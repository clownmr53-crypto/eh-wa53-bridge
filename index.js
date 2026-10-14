/**
 * WA53 unofficial linked-device bridge (Baileys).
 * - Pair via /qr (key-protected) or qr.png on disk
 * - Outbound: POST /send {to,text} with Authorization: Bearer <BRIDGE_KEY>
 * - Inbound forward to n8n (Meta-like JSON) is OFF by default (BRIDGE_FORWARD_INBOUND=0)
 *   so Meta Cloud API webhook keeps feeding the clone without double replies.
 */
import makeWASocket, {
  DisconnectReason, downloadMediaMessage, useMultiFileAuthState, fetchLatestBaileysVersion,
  makeCacheableSignalKeyStore, jidNormalizedUser, isLidUser
} from 'baileys'; // Baileys 7 rc (LID support)
import { Boom } from '@hapi/boom';
import QRCode from 'qrcode';
import pino from 'pino';
import http from 'http';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import os from 'os';
// optional .env next to index.js (handy on Wispbyte/Pterodactyl); real env vars win
try { for (const l of fs.readFileSync(path.join(path.dirname(fileURLToPath(import.meta.url)), '.env'), 'utf8').split(/\r?\n/)) { const m = l.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/); if (m && process.env[m[1]] === undefined) process.env[m[1]] = m[2].replace(/^['"]|['"]$/g, ''); } } catch {}

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PORT = Number(process.env.PORT || process.env.SERVER_PORT || 8787);
const INSTANCE = process.env.INSTANCE_NAME || os.hostname();
const LOCK_HB_MS = 10_000, LOCK_STALE_S = Number(process.env.LOCK_STALE_S || 45), LOCK_LOSE_MS = 30_000; // heartbeat 10s, takeover if stale >45s, self-demote if no successful heartbeat for 30s
const BRIDGE_KEY = process.env.BRIDGE_KEY || '';
const SB_URL = (process.env.SUPABASE_URL || '').replace(/\/$/, '');
const SB_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || '';
const N8N_WEBHOOK = process.env.N8N_WEBHOOK || 'https://eh-n8n.onrender.com/webhook/wa53';
const PHONE_NUMBER_ID = process.env.PHONE_NUMBER_ID_53 || '1364570600073371';
const FORWARD_IN = process.env.BRIDGE_FORWARD_INBOUND === '1';
const INPROC = process.env.BOT_INPROC === '1'; // WA53 rapide: run the bot logic in this process (bot53.mjs)
const bot53 = INPROC ? await import('./bot53.mjs') : null;
const media53 = INPROC ? await import('./media53.mjs') : null;
const ar53 = INPROC ? await import('./alwaysreply53.mjs') : null; // always-reply fallback (2026-10-13)
if (bot53) await bot53.loadSecrets();
const mesh = await import('./mesh53.mjs'); // Système V2: Supabase bus (dedup, events, heartbeat, commands)
const botSent = new Map(); // wid -> ts (ids sent by the bot itself; their fromMe upsert is not an owner echo)
setInterval(() => { const n = Date.now(); for (const [k, t] of botSent) if (n - t > 9e5) botSent.delete(k); }, 6e4);
const AUTH_DIR = path.join(__dirname, '.auth');
const QR_PNG = path.join(__dirname, 'qr.png');
const QR_META = path.join(__dirname, 'qr.meta.json');
const log = pino({ level: process.env.LOG_LEVEL || 'info' });

if (!SB_URL || !SB_KEY) {
  console.error('Need SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY (and INSTANCE_NAME)');
  process.exit(1);
}

const seen = new Map(); // id -> ts
// v7: getMessage store for retry receipts (re-encrypt on 'waiting for this message')
const msgStore = new Map(); // id -> proto message
const remember = (k, m) => { if (k?.id && m) { msgStore.set(k.id, m); if (msgStore.size > 2000) msgStore.delete(msgStore.keys().next().value); } };
const cleanSeen = () => { const n = Date.now(); for (const [k, t] of seen) if (n - t > 6e5) seen.delete(k); };
setInterval(cleanSeen, 6e4);

async function sb(method, path, body, prefer) {
  const r = await fetch(SB_URL + '/rest/v1/' + path, {
    signal: AbortSignal.timeout(8000), // 2026-10-13: a hung Supabase call used to freeze the lock heartbeat -> silent lock loss
    method, headers: {
      apikey: SB_KEY, Authorization: 'Bearer ' + SB_KEY, 'Content-Type': 'application/json',
      ...(prefer ? { Prefer: prefer } : {})
    }, body: body ? JSON.stringify(body) : undefined
  });
  const t = await r.text();
  if (!r.ok) throw new Error(`sb ${method} ${path} ${r.status} ${t.slice(0, 160)}`);
  return t ? JSON.parse(t) : null;
}

async function loadAuthFromSb() {
  try {
    const rows = await sb('GET', 'wa53_bridge_auth?id=eq.default&select=creds,keys');
    return rows?.[0] || null;
  } catch (e) { log.warn(e, 'loadAuth'); return null; }
}
const SYNC_FILE = path.join(path.dirname(fileURLToPath(import.meta.url)), 'auth_sync.json');
function readSync() { try { return JSON.parse(fs.readFileSync(SYNC_FILE, 'utf8')); } catch { return null; } }
function writeSync(updated_at) { try { fs.writeFileSync(SYNC_FILE, JSON.stringify({ updated_at, instance: process.env.INSTANCE_NAME || os.hostname() })); } catch {} }
async function saveAuthToSb(creds, keys) {
  const updated_at = new Date().toISOString();
  await sb('POST', 'wa53_bridge_auth?on_conflict=id',
    [{ id: 'default', creds, keys, updated_at }],
    'resolution=merge-duplicates');
  writeSync(updated_at);
}

/** Multi-file auth that also mirrors to Supabase after every write. */
async function useSupabaseAuthState() {
  fs.mkdirSync(AUTH_DIR, { recursive: true });
  // restore from Supabase ONLY when local auth is empty; local disk is the source of truth otherwise
  const localHas = fs.existsSync(path.join(AUTH_DIR, 'creds.json'));
  let remote = false;
  if (!localHas) remote = await loadAuthToDisk();
  else { // takeover safety: if ANOTHER instance mirrored newer auth since our last sync, local disk is stale -> back it up, then restore from Supabase
    const sync = readSync(); const row = await sb('GET', 'wa53_bridge_auth?id=eq.default&select=updated_at').then(r => r?.[0]).catch(() => null);
    if (sync && row?.updated_at && Date.parse(row.updated_at) > Date.parse(sync.updated_at) + 1000) {
      const bk = path.join(__dirname, '..', 'backups', 'wa53_auth_pre_resync_' + Date.now() + '.tgz');
      try { (await import('child_process')).execFileSync('tar', ['czf', bk, '-C', __dirname, '.auth']); } catch (e) { log.warn({ err: String(e?.message || e) }, 'auth backup before resync failed'); }
      remote = await loadAuthToDisk(); log.warn({ remote_at: row.updated_at, local_sync: sync.updated_at, backup: bk }, 'remote auth newer (other instance) -> restored from supabase');
    }
  }
  const { state, saveCreds } = await useMultiFileAuthState(AUTH_DIR);
  // immediate, serialized, coalesced mirror (always reads the latest disk state; no debounce, no stale restore)
  let mirrorRunning = false, mirrorDirty = false;
  const kick = () => { mirrorDirty = true; if (!mirrorRunning) runMirror(); };
  const runMirror = async () => {
    mirrorRunning = true;
    try { while (mirrorDirty) { mirrorDirty = false; await mirror(); } } finally { mirrorRunning = false; }
  };
  flushAuth = async () => { mirrorDirty = true; while (mirrorRunning) await sleep(50); await runMirror(); };
  const origSet = state.keys.set.bind(state.keys);
  state.keys.set = async (data) => { await origSet(data); if (leader) kick(); };
  const save = async () => {
    if (!leader) return; // never write creds after losing the lock
    await saveCreds();
    kick();
  };
  const mirror = async () => {
    if (!leader) return;
    try {
      const creds = JSON.parse(fs.readFileSync(path.join(AUTH_DIR, 'creds.json'), 'utf8'));
      const keys = {};
      for (const f of fs.readdirSync(AUTH_DIR).filter(n => n !== 'creds.json' && n.endsWith('.json'))) {
        keys[f] = JSON.parse(fs.readFileSync(path.join(AUTH_DIR, f), 'utf8'));
      }
      await saveAuthToSb(creds, keys);
      log.info({ keys: Object.keys(keys).length }, 'auth mirrored to supabase');
    } catch (e) { log.warn(e, 'mirror auth failed'); }
  };
  if (remote) log.info('restored auth from supabase');
  return { state, saveCreds: save };
}
async function loadAuthToDisk() {
  const row = await loadAuthFromSb();
  if (!row?.creds) return false;
  try { const u = await sb('GET', 'wa53_bridge_auth?id=eq.default&select=updated_at'); if (u?.[0]?.updated_at) writeSync(u[0].updated_at); } catch {}
  fs.mkdirSync(AUTH_DIR, { recursive: true });
  fs.writeFileSync(path.join(AUTH_DIR, 'creds.json'), JSON.stringify(row.creds, null, 2));
  for (const [f, v] of Object.entries(row.keys || {})) {
    fs.writeFileSync(path.join(AUTH_DIR, f), JSON.stringify(v, null, 2));
  }
  return true;
}

let flushAuth = async () => {};
const PAIR_PHONE = (process.env.PAIR_PHONE || '').replace(/\D/g, '');
const EXT_QR = '/workspace/eh_mission/wa53_qr.png', EXT_CODE = '/workspace/eh_mission/wa53_paircode.txt';
let sock = null, qrDataUrl = null, qrAt = 0, status = 'starting', me = null;
let pairCode = null, pairPhone = '';
async function pubQr(extra = {}) { // V3: live QR / pairing code for the dashboard (kv53 key wa53:qr, short TTL)
  try { await sb('POST', 'kv53?on_conflict=key', { key: 'wa53:qr', value: JSON.stringify({ instance: INSTANCE, status, qr: qrDataUrl && Date.now() - qrAt < QR_TTL_MS ? qrDataUrl : null, qr_at: qrAt, code: pairCode, phone: pairPhone ? pairPhone.slice(0, 5) + '…' : null, me: me?.id || null, at: Date.now(), ...extra }), expires_at: new Date(Date.now() + 600e3).toISOString() }, 'resolution=merge-duplicates,return=minimal'); } catch (e) { log.warn({ err: String(e?.message || e) }, 'pubQr'); }
}
async function repair(mode, phone, force) { // V3: dashboard "Reconnecter le 53"
  if (!leader) return { ok: false, error: 'cette instance ne tient pas le verrou' };
  if (status === 'open' && !force) return { ok: false, error: 'le 53 est connecté : re-liaison refusée (force=true pour forcer)' };
  pairPhone = mode === 'code' ? String(phone || '').replace(/\D/g, '') : ''; pairCode = null;
  if (mode === 'code' && sock && !sock.authState?.creds?.registered) { try { pairCode = await sock.requestPairingCode(pairPhone); await pubQr(); return { ok: true, code: pairCode }; } catch (e) { log.warn({ err: String(e?.message || e) }, 'pair code on live sock failed'); } }
  const s = sock; sock = null; try { s && s.ev.removeAllListeners(); s && s.end(undefined); } catch {}
  try { fs.rmSync(AUTH_DIR, { recursive: true, force: true }); await sb('DELETE', 'wa53_bridge_auth?id=eq.default'); } catch {}
  status = 'starting'; await pubQr({ repair: mode }); setTimeout(() => startSock().catch(e => log.error(e, 'startSock')), 500);
  return { ok: true, note: 'nouvelle liaison lancée ; QR / code visibles dans le tableau de bord' };
}
const QR_TTL_MS = 55_000; // Meta/WhatsApp QR ~60s; refresh on new qr event

function authOk(req) {
  const h = req.headers.authorization || '';
  const q = new URL(req.url, 'http://x').searchParams.get('key') || '';
  if (!BRIDGE_KEY) return false; // /send and /qr disabled without BRIDGE_KEY
  return h === 'Bearer ' + BRIDGE_KEY || q === BRIDGE_KEY;
}

function toDigits(jid) {
  return String(jid || '').split('@')[0].split(':')[0].replace(/\D/g, '');
}

async function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }
const HUMAN_MIN_MS = Number(process.env.HUMAN_MIN_MS || 1000), HUMAN_MAX_MS = Number(process.env.HUMAN_MAX_MS || 3000);
async function humanDelay(jid, text) { // 1–3s scaled by length, with typing indicator
  const len = String(text || '').length;
  const ms = Math.min(HUMAN_MAX_MS, HUMAN_MIN_MS + Math.min(1500, len * 15) + Math.floor(Math.random() * 500));
  if (jid && sock) { try { await sock.presenceSubscribe(jid); await sock.sendPresenceUpdate('composing', jid); } catch {} }
  await sleep(ms);
  if (jid && sock) { try { await sock.sendPresenceUpdate('paused', jid); } catch {} }
}
// tell n8n which message ids the bot sent itself, so the Meta coexistence echo of them is not taken as an owner takeover (auto-pause)
async function markBotSent(wid) {
  if (!wid) return;
  try { await sb('POST', 'kv53?on_conflict=key', { key: 'botwid:' + wid, value: '1', expires_at: new Date(Date.now() + 15 * 60e3).toISOString() }, 'resolution=merge-duplicates,return=minimal'); }
  catch (e) { log.warn({ err: String(e?.message || e) }, 'markBotSent'); }
}

async function startSock() {
  if (!leader || sock) return;
  // NEVER wipe local .auth on start (that caused stale restores -> Bad MAC / 'waiting for this message')
  const { state, saveCreds } = await useSupabaseAuthState();
  if (!leader) return;
  let version; try { ({ version } = await fetchLatestBaileysVersion()); } catch {}
  const my = makeWASocket({
    ...(version ? { version } : {}),
    getMessage: async (key) => msgStore.get(key.id),
    auth: { creds: state.creds, keys: makeCacheableSignalKeyStore(state.keys, log) },
    logger: pino({ level: 'silent' }), printQRInTerminal: false, syncFullHistory: false,
    markOnlineOnConnect: false, generateHighQualityLinkPreview: false,
  });
  sock = my;
  my.ev.on('creds.update', saveCreds);
  my.ev.on('connection.update', async (u) => {
    if (sock !== my) return; // stale socket
    const { connection, lastDisconnect, qr } = u;
    if (qr) {
      qrDataUrl = await QRCode.toDataURL(qr, { width: 512, margin: 2 });
      qrAt = Date.now();
      await QRCode.toFile(QR_PNG, qr, { width: 512, margin: 2 });
      try { fs.copyFileSync(QR_PNG, EXT_QR + '.tmp'); fs.renameSync(EXT_QR + '.tmp', EXT_QR); } catch {}
      if ((PAIR_PHONE || pairPhone) && !my._pairReq && !state.creds.registered) {
        my._pairReq = true;
        try {
          const code = await my.requestPairingCode(pairPhone || PAIR_PHONE); pairCode = code;
          fs.writeFileSync(EXT_CODE, `${code}\nphone=${PAIR_PHONE}\ngenerated=${new Date().toISOString()}\n`);
          log.info({ file: EXT_CODE }, 'pairing code ready');
        } catch (e) { log.warn({ err: String(e?.message || e) }, 'pairing code failed'); }
      }
      fs.writeFileSync(QR_META, JSON.stringify({ at: qrAt, expiresAt: qrAt + QR_TTL_MS, path: QR_PNG }));
      status = 'qr'; pubQr();
      log.info({ png: QR_PNG, ttl_s: QR_TTL_MS / 1000 }, 'QR ready — scan with WhatsApp Business > Appareils connectés');
    }
    if (connection === 'open') {
      status = 'open'; lastOpenAt = Date.now(); me = my.user; qrDataUrl = null;
      try { fs.unlinkSync(QR_PNG); fs.unlinkSync(EXT_QR); } catch {}
      try { fs.writeFileSync(EXT_CODE, `LINKED ${me?.id} at ${new Date().toISOString()}\n`); } catch {}
      flushAuth().catch(() => {}); pairCode = null; pairPhone = ''; pubQr();
      log.info({ me: me?.id }, 'linked');
    }
    if (connection === 'close') {
      const code = (lastDisconnect?.error instanceof Boom) ? lastDisconnect.error.output?.statusCode : 0;
      status = 'closed:' + code; pubQr();
      const restart = code !== DisconnectReason.loggedOut;
      log.warn({ code, restart }, 'connection closed');
      sock = null;
      if (!leader) return;
      if (restart) setTimeout(startSock, 2000);
      else { try { fs.rmSync(AUTH_DIR, { recursive: true, force: true }); await sb('DELETE', 'wa53_bridge_auth?id=eq.default'); } catch {} setTimeout(startSock, 1000); }
    }
  });
  my.ev.process(() => { lastEvAt = Date.now(); });
  my.ev.on('lid-mapping.update', (m) => log.info({ n: Array.isArray(m) ? m.length : 1 }, 'lid mapping update'));
  my.ev.on('messages.upsert', async ({ messages, type }) => {
    for (const m of messages) if (m.key?.fromMe) remember(m.key, m.message);
    if (INPROC) {
      for (const m of messages) {
        if (m.key?.fromMe) { handleOwnEcho(m).catch(e => log.warn({ err: String(e?.message || e) }, 'echo')); continue; }
        if (type !== 'notify') continue;
        handleInbound(m).catch(e => log.error(e, 'inbound'));
      }
      return;
    }
    if (!FORWARD_IN) return;
    if (type !== 'notify') return;
    for (const m of messages) {
      try { await handleInbound(m); } catch (e) { log.error(e, 'inbound'); }
    }
  });
}

async function handleInbound(m) {
  if (!m.message || m.key.fromMe) return;
  let jid = m.key.remoteJid || '';
  if (isLidUser(jid)) { // v7: resolve LID -> phone number
    jid = m.key.remoteJidAlt || (await sock?.signalRepository?.lidMapping?.getPNForLID?.(jid).catch(() => null)) || jid;
  }
  if (jid.endsWith('@g.us') || jid === 'status@broadcast' || jid.endsWith('@newsletter')) return;
  const id = m.key.id; if (!id || seen.has(id)) return; seen.set(id, Date.now());
  const from = toDigits(jid);
  if (!from) return;
  if (!(await mesh.claim(id, from))) { log.warn({ from, id }, 'dedup: message already claimed by another system'); mesh.event('msg_dup', { id }, { wa: from, msg_id: id }); return; }
  let text = '', msgType = 'text';
  const msg = m.message;
  if (msg.conversation) text = msg.conversation;
  else if (msg.extendedTextMessage?.text) text = msg.extendedTextMessage.text;
  else if (msg.imageMessage) { msgType = 'image'; text = msg.imageMessage.caption || '[image]'; }
  else if (msg.audioMessage) { msgType = msg.audioMessage.ptt ? 'voice' : 'audio'; text = '[voice]'; }
  else if (msg.videoMessage) { msgType = 'video'; text = msg.videoMessage.caption || '[video]'; }
  else if (msg.documentMessage) { msgType = 'document'; text = msg.documentMessage.caption || '[document]'; }
  else return; // stickers etc. skip
  let mime = null, extra = {};
  if (INPROC) {
    media53.touchContact(from, m.pushName || null, msgType === 'text' ? text : '').catch(e => log.warn({ err: String(e?.message || e) }, 'wa_contacts'));
    if (msgType === 'voice' || msgType === 'audio' || msgType === 'image') {
      const t0 = Date.now();
      try {
        const buf = await downloadMediaMessage(m, 'buffer', {}, { logger: log, reuploadRequest: sock.updateMediaMessage });
        mime = (msg.audioMessage || msg.imageMessage)?.mimetype || (msgType === 'image' ? 'image/jpeg' : 'audio/ogg');
        bot53.MEDIA.set(id, { buf, mime, at: Date.now() });
        if (msgType === 'image') {
          const d = await media53.describeImage(buf, mime);
          if (d) { const cap = msg.imageMessage.caption || ''; text = (cap ? cap + '\n' : '') + '[Photo envoyée par le client : ' + d.text + ']'; extra.vision = d.via; }
        } else {
          const tr = await media53.transcribe(buf, mime);
          if (tr && tr.text && !tr.unclear) { msgType = 'text'; text = '[vocal] ' + tr.text + (tr.fr ? '\n(traduction : ' + tr.fr + ')' : '') + (tr.lang && tr.lang !== 'français' ? '\n[Langue du vocal : ' + tr.lang + '. Réponds au client dans cette langue (si tu ne la maîtrises pas bien, réponds simplement en français).]' : ''); extra.lang = tr.lang; extra.stt = tr.via; media53.touchContact(from, null, tr.text).catch(() => {}); }
          else { msgType = 'text'; text = "[vocal reçu mais peu clair : le client a parlé mais on n'a pas bien compris. Réponds naturellement en demandant de reformuler ou de répéter plus simplement ; ne dis jamais que tu ne peux pas écouter les vocaux.]"; extra.stt = (tr && tr.via) || 'none'; }
        }
      } catch (e) { log.warn({ err: String(e?.message || e) }, 'media download/understand'); }
      log.info({ from, kind: msgType, ms: Date.now() - t0, ...extra, text: text.slice(0, 60) }, 'media understood');
    }
  }
  { // 2026-10-14: quoted message (client replies to one of our bubbles) -> give the AI what was quoted
    const ci = msg.extendedTextMessage?.contextInfo || msg.imageMessage?.contextInfo || null; const qm = ci?.quotedMessage;
    const qt = qm ? (qm.conversation || qm.extendedTextMessage?.text || qm.imageMessage?.caption || qm.documentMessage?.caption || (qm.documentMessage ? '[document ' + (qm.documentMessage.fileName || '') + ']' : '')) : '';
    if (qt) text = text + '\n[Il répond à ce message : « ' + String(qt).replace(/\s+/g, ' ').slice(0, 300) + ' »]';
  }
  if (INPROC && !OWNERS.has(from) && bot53.AGREE.test(text)) { // client agrees after a reminder -> tell the boss (relay alert route)
    bot53.histGet(from).then(({ hist }) => { const lb = [...hist].reverse().find(h => h.role !== 'user'); if (lb && /rappel|remind/i.test(lb.via || '') && Date.now() / 1000 - (Number(lb.ts) || 0) < 7 * 86400) mesh.event('wa53_client_agrees', { text: text.slice(0, 200), via: lb.via, last: String(lb.text).slice(0, 200), name: m.pushName || null }, { wa: from, msg_id: id }); }).catch(() => {});
  }
  const body = {
    object: 'whatsapp_business_account',
    entry: [{ id: '2333109240587511', changes: [{ field: 'messages', value: {
      messaging_product: 'whatsapp',
      metadata: { display_phone_number: '22953632000', phone_number_id: PHONE_NUMBER_ID },
      contacts: [{ wa_id: from, profile: { name: m.pushName || null } }],
      messages: [{ from, id: 'bridge.' + id, timestamp: String(m.messageTimestamp || Math.floor(Date.now() / 1000)), type: msgType, text: { body: text },
        ...(msgType === 'image' ? { image: { caption: text, id: 'bridge.' + id, ...(mime ? { mime_type: mime } : {}) } } : {}),
        ...(msgType === 'voice' || msgType === 'audio' ? { audio: { id: 'bridge.' + id, voice: msgType === 'voice', ...(mime ? { mime_type: mime } : {}) } } : {}) }]
    }}]}]
  };
  mesh.inbound(from, id, msgType, text);
  if (INPROC && mesh.isPaused() && !OWNERS.has(from)) { log.info({ from }, 'global pause (command center): no auto reply'); mesh.event('msg_skipped_paused', {}, { wa: from, msg_id: id }); return; }
  if (INPROC) { lastInTs.set(from, Number(m.messageTimestamp || Math.floor(Date.now() / 1000))); lastInboundAt = Date.now(); selfCheckArm(from, text, m.pushName || null); return runBot(body, { from, text }); }
  const r = await fetch(N8N_WEBHOOK, { method: 'POST', headers: { 'Content-Type': 'application/json', 'x-eh-bridge': '1' }, body: JSON.stringify(body) });
  log.info({ from, status: r.status, text: text.slice(0, 40) }, 'forwarded inbound');
}

// ---- in-process bot (WA53 rapide) ----
async function botSend(payload) { // called by core53 for every Graph /messages POST
  if (!sock || status !== 'open') return { error: 'not linked' };
  const digits = String(payload.to || '').replace(/\D/g, ''); if (digits.length < 8) return { error: 'bad to' };
  if (media53 && payload?.text?.body) payload.text.body = media53.scrubCantListen(payload.text.body);
  const content = outboxContent(payload.type || 'text', payload); if (!content) return { error: 'unsupported kind ' + payload.type };
  const jid = `${digits}@s.whatsapp.net`;
  const fb = fallbackAt.get(digits); // the self-check fallback already answered this turn: drop a late duplicate from core53
  if (fb && fb > (lastIn.get(digits) || 0) && Date.now() - fb < 120e3) { log.warn({ to: digits }, 'late core reply suppressed (fallback already answered)'); return { id: 'suppressed.' + Date.now() }; }
  try { await sock.presenceSubscribe(jid); await sock.sendPresenceUpdate('composing', jid); } catch {}
  await sleep(Number(process.env.TYPING_MS || 1000));
  try { await sock.sendPresenceUpdate('paused', jid); } catch {}
  const out = await sock.sendMessage(jid, content);
  if (out?.key?.id) botSent.set(out.key.id, Date.now());
  remember(out?.key, out?.message); markBotSent(out?.key?.id); selfCheckDone(digits, 'core'); lastOutAt = Date.now(); mesh.outbound(digits, out?.key?.id, 'core', lastIn.get(digits) ? Date.now() - lastIn.get(digits) : null);
  log.info({ to: digits, kind: payload.type, wid: out?.key?.id, ms_since_in: lastIn.get(digits) ? Date.now() - lastIn.get(digits) : null }, 'bot sent');
  return { id: out?.key?.id };
}
const lastIn = new Map();
async function runBot(body, info = {}) {
  const t0 = Date.now(); if (info.from && !String(info.from).startsWith('echo:')) lastIn.set(info.from, t0);
  const pc = info.from ? pend.get(info.from) : null; if (pc) pc.inflight++;
  let out; try { out = await bot53.runJob({ kind: 'webhook', body }, { send: botSend }); } finally { if (pc) pc.inflight--; }
  if (pc && out?.result?.skipped) pc.skip = out.result.skipped;
  const ms = Date.now() - t0;
  log.info({ from: info.from, ms, sends: (out.sends || []).length, fatal: out.fatal ? String(out.fatal).slice(0, 200) : undefined, text: info.text ? String(info.text).slice(0, 40) : undefined }, 'bot handled');
  sb('POST', 'events', { type: 'wa53_inproc_run', source: 'bridge-inproc', data: { ms, from: info.from, sends: (out.sends || []).map(x => ({ to: x.to, via: x.via, err: x.err })), fatal: out.fatal ? String(out.fatal).slice(0, 500) : null, log: (out.log || []).filter(l => !/^HTTP /.test(l)).slice(-8) } }, 'return=minimal').catch(() => {});
  return out;
}
// a message sent from the 53 phone itself (owner typing to a client) -> same "message_echoes" path as Meta coexistence (auto-pause)
// 2026-10-13: only a GENUINE manual message pauses the bot. Ignored: bot/outbox/API sends, WhatsApp Business automations
// (greeting / away / quick-reply: flags, known text, learned text, or sent <=3 s after the client's inbound), protocol/reaction/edit events.
const AUTO_FILE = path.join(__dirname, 'automated_texts.json');
const AUTO_SEED = [/Electronic\s*HOUSE\s+est\s+une\s+boutique/i, ...String(process.env.AUTO_TEXT_RE || '').split('||').filter(Boolean).map(x => new RegExp(x, 'i'))];
let AUTO_LEARNED = (() => { try { return JSON.parse(fs.readFileSync(AUTO_FILE, 'utf8')); } catch { return {}; } })();
const normTxt = (t) => String(t || '').toLowerCase().replace(/[^\p{L}\p{N}]+/gu, ' ').trim().slice(0, 160);
const lastInTs = new Map(); // phone -> messageTimestamp (s) of the client's last inbound
const HUMAN_TYPES = ['conversation', 'extendedTextMessage', 'imageMessage', 'videoMessage', 'audioMessage', 'documentMessage', 'stickerMessage', 'contactMessage', 'locationMessage', 'documentWithCaptionMessage', 'ptvMessage'];
function echoContent(msg) {
  let k = Object.keys(msg || {}).find(x => HUMAN_TYPES.includes(x)); if (!k) return null;
  let c = msg[k]; if (k === 'documentWithCaptionMessage') c = c?.message?.documentMessage;
  const text = typeof c === 'string' ? c : (c?.text || c?.caption || '');
  const ctx = Object.assign({}, msg.messageContextInfo || {}, ...Object.values(msg).map(v => (v && typeof v === 'object' && v.contextInfo) || {}));
  return { type: k, text, ctx };
}
function automatedReason(m, to, ec) {
  const ctx = ec.ctx || {};
  if (ctx.automatedGreetingMessageShown || ctx.greetingMessageBody || ctx.automatedGreetingMessageCtaType) return 'flag:greeting';
  if (m.message?.messageContextInfo?.botMessageSecret || ctx.botMessageInvokerJid) return 'flag:bot';
  if (ec.text && AUTO_SEED.some(r => r.test(ec.text))) return 'text:seed';
  const n = normTxt(ec.text); if (n.length >= 12 && AUTO_LEARNED[n]) return 'text:learned';
  const ts = Number(m.messageTimestamp || 0), tin = lastInTs.get(to);
  if (ts && tin && ts - tin >= 0 && ts - tin <= 3) return 'timing:' + (ts - tin) + 's';
  return null;
}
function learnAuto(text, why) {
  const n = normTxt(text); if (n.length < 12 || AUTO_LEARNED[n]) return;
  AUTO_LEARNED[n] = { at: new Date().toISOString(), why, sample: String(text).slice(0, 80) };
  try { fs.writeFileSync(AUTO_FILE, JSON.stringify(AUTO_LEARNED, null, 1)); } catch {}
}
async function handleOwnEcho(m) {
  const id = m.key?.id; if (!id || !m.message) return;
  const ts = Number(m.messageTimestamp || 0); if (ts && Date.now() / 1000 - ts > 120) return; // history/append, not live
  const ec = echoContent(m.message); if (!ec) return; // protocol / reaction / edit / receipt-like: never a takeover
  let jid = m.key.remoteJid || '';
  if (isLidUser(jid)) jid = m.key.remoteJidAlt || (await sock?.signalRepository?.lidMapping?.getPNForLID?.(jid).catch(() => null)) || jid;
  if (!jid.endsWith('@s.whatsapp.net')) return;
  await sleep(3000); // let botSend register its own ids first
  if (botSent.has(id) || seen.has('echo:' + id)) return; seen.set('echo:' + id, Date.now());
  const to = toDigits(jid); const myNum = toDigits(me?.id) || '22953632000';
  if (!to || to === myNum) return;
  try { const r = await sb('GET', 'kv53?select=key&key=eq.' + encodeURIComponent('botwid:' + id)); if (r?.length) return; } catch {} // sent by this bridge via outbox/API/another instance
  const why = automatedReason(m, to, ec);
  const meta = { to, type: ec.type, biz: m.bizPrivacyStatus ?? null, vbn: m.verifiedBizName ? 1 : 0, ctxKeys: Object.keys(ec.ctx || {}).slice(0, 12), dt: ts && lastInTs.get(to) ? ts - lastInTs.get(to) : null };
  if (why) {
    if (why.startsWith('timing') || why.startsWith('flag')) learnAuto(ec.text, why);
    log.info({ ...meta, why, text: String(ec.text).slice(0, 50) }, 'owner echo ignored (WhatsApp Business automation)');
    sb('POST', 'events', { type: 'wa53_echo_automated', source: 'bridge-inproc', data: { ...meta, why, text: String(ec.text).slice(0, 200) } }, 'return=minimal').catch(() => {});
    return;
  }
  selfCheckDone(to, 'owner'); // a human answered
  const body = { object: 'whatsapp_business_account', entry: [{ id: '2333109240587511', changes: [{ field: 'smb_message_echoes', value: {
    messaging_product: 'whatsapp', metadata: { display_phone_number: '22953632000', phone_number_id: PHONE_NUMBER_ID },
    message_echoes: [{ from: myNum, to, id: 'bridge.' + id, timestamp: String(ts || Math.floor(Date.now() / 1000)), type: m.message.conversation || m.message.extendedTextMessage ? 'text' : 'other' }] } }] }] };
  log.info(meta, 'owner echo -> bot (manual takeover)');
  if (INPROC && ec.text) bot53.histAppend(to, 'owner', ec.text, 'phone').catch(() => {});
  await runBot(body, { from: 'echo:' + to });
}

// ---- always-reply self-check (2026-10-13): every client inbound must get a reply within SELFCHECK_MS ----
const SELFCHECK_MS = Number(process.env.SELFCHECK_MS || 25000);
const OWNERS = new Set(['22997342101', '2290197342101', '22996984737', '2290196984737']);
const pend = new Map(); // phone -> { since, texts[], name, timer, inflight, skip, tries }
const fallbackAt = new Map();
let lastInboundAt = 0, lastOutAt = 0, lastOpenAt = 0, lastEvAt = Date.now();
function selfCheckArm(from, text, name) {
  if (!ar53 || OWNERS.has(from)) return;
  let p = pend.get(from); if (!p) { p = { since: Date.now(), texts: [], name, timer: null, inflight: 0, skip: null, tries: 0 }; pend.set(from, p); }
  p.texts.push(String(text || '').slice(0, 400)); if (p.texts.length > 8) p.texts.shift(); if (name) p.name = name; p.skip = null;
  clearTimeout(p.timer); p.timer = setTimeout(() => selfCheckFire(from).catch(e => log.error(e, 'selfcheck')), SELFCHECK_MS);
}
function selfCheckDone(to, by) { const p = pend.get(to); if (p) { clearTimeout(p.timer); pend.delete(to); } }
async function pauseActive(wa) {
  try {
    const r = await sb('GET', 'kv53?select=key,value,expires_at&key=in.(' + ['pause:' + wa, 'optout:' + wa].map(encodeURIComponent).join(',') + ')');
    for (const row of r || []) {
      if (row.expires_at && Date.parse(row.expires_at) < Date.now()) continue;
      if (row.key.startsWith('optout:')) return 'optout';
      let v = null; try { v = JSON.parse(row.value); } catch {}
      if (!v) continue; if (!v.until || v.until > Date.now() / 1000) return 'pause:' + (v.why || v.mode);
    }
  } catch (e) { log.warn({ err: String(e?.message || e) }, 'selfcheck pause read'); }
  return null;
}
async function selfCheckFire(from) {
  const p = pend.get(from); if (!p) return;
  if (!sock || status !== 'open' || !leader) { p.timer = setTimeout(() => selfCheckFire(from).catch(() => {}), 10000); if (Date.now() - p.since > 15 * 60e3) pend.delete(from); return; }
  if (p.skip && /^(optout|rate_day)$/.test(p.skip)) { pend.delete(from); return; }
  const pz = await pauseActive(from); if (pz) { log.info({ from, pz }, 'selfcheck: paused chat, no fallback'); pend.delete(from); return; }
  const ev = { from, waited_ms: Date.now() - p.since, skip: p.skip, inflight: p.inflight };
  // tier 1: re-run the full core53 conversation (its own cascade) once, unless a run for this chat is still in flight
  if (!p.inflight && !p.tries++) {
    try { const out = await Promise.race([bot53.runJob({ kind: 'conv', wa: from, source: 'selfcheck' }, { send: botSend }), sleep(15000).then(() => ({ timeout: true }))]);
      ev.tier1 = out?.timeout ? 'timeout' : (out?.result?.skipped || (out?.sends?.length ? 'sent' : 'nosend')); } catch (e) { ev.tier1 = 'err ' + String(e?.message || e).slice(0, 80); }
    if (!pend.has(from)) { log.info(ev, 'selfcheck: answered by core rerun'); sb('POST', 'events', { type: 'wa53_selfcheck', source: 'bridge-inproc', data: ev }, 'return=minimal').catch(() => {}); return; }
    if (/^pause|optout/.test(String(ev.tier1))) { pend.delete(from); return; }
  }
  // tier 2/3: independent mini AI cascade, then varied neutral acknowledgement (AI-free)
  const S = await bot53.loadSecrets().catch(() => ({}));
  const r = await ar53.fallbackReply(S, { texts: p.texts, name: p.name });
  if (!pend.has(from)) return; // answered meanwhile
  const pz2 = await pauseActive(from); if (pz2) { pend.delete(from); return; }
  const jid = `${from}@s.whatsapp.net`;
  try { await sock.presenceSubscribe(jid); await sock.sendPresenceUpdate('composing', jid); await sleep(1200); await sock.sendPresenceUpdate('paused', jid); } catch {}
  const out = await sock.sendMessage(jid, { text: r.text });
  if (out?.key?.id) botSent.set(out.key.id, Date.now()); remember(out?.key, out?.message); markBotSent(out?.key?.id);
  fallbackAt.set(from, Date.now()); lastOutAt = Date.now(); pend.delete(from); mesh.outbound(from, out?.key?.id, 'fallback:' + r.via, Date.now() - p.since);
  Object.assign(ev, { via: r.via, errs: r.errs, wid: out?.key?.id, text: r.text.slice(0, 120) });
  log.warn(ev, 'selfcheck: FALLBACK reply sent');
  sb('POST', 'events', { type: 'wa53_selfcheck', source: 'bridge-inproc', data: ev }, 'return=minimal').catch(() => {});
}

async function sendText(to, text) {
  if (!sock || status !== 'open') throw Object.assign(new Error('not linked'), { code: 503 });
  const digits = String(to).replace(/\D/g, '');
  if (!digits || digits.length < 8) throw Object.assign(new Error('bad to'), { code: 400 });
  // ban-risk guard: reject bulk / identical blast
  if (String(text).length > 4000) throw Object.assign(new Error('text too long'), { code: 400 });
  const jid = digits.includes('@') ? digits : `${digits}@s.whatsapp.net`;
  await humanDelay(jid, text);
  const r = await sock.sendMessage(jid, { text: String(text) });
  if (r?.key?.id) botSent.set(r.key.id, Date.now()); remember(r?.key, r?.message); markBotSent(r?.key?.id);
  return { id: r?.key?.id, to: digits };
}

async function sendDocument(to, url, fileName, caption) {
  if (!sock || status !== 'open') throw Object.assign(new Error('not linked'), { code: 503 });
  const digits = String(to).replace(/\D/g, ''); if (digits.length < 8) throw Object.assign(new Error('bad to'), { code: 400 });
  if (!/^https:\/\//.test(String(url))) throw Object.assign(new Error('bad url'), { code: 400 });
  const res = await fetch(url, { signal: AbortSignal.timeout(30000) }); if (!res.ok) throw new Error('pdf http ' + res.status);
  const buf = Buffer.from(await res.arrayBuffer()); if (buf.length > 5e6 || buf.slice(0, 4).toString() !== '%PDF') throw new Error('not a pdf');
  const jid = `${digits}@s.whatsapp.net`; await humanDelay(jid, caption || 'doc');
  const r = await sock.sendMessage(jid, { document: buf, mimetype: 'application/pdf', fileName: String(fileName || 'facture.pdf'), caption: caption ? String(caption).slice(0, 900) : undefined });
  if (r?.key?.id) botSent.set(r.key.id, Date.now()); remember(r?.key, r?.message); markBotSent(r?.key?.id);
  return { id: r?.key?.id, to: digits };
}

// ---- Supabase outbox poller: n8n clone (bridge mode) inserts rows into wa53_outbox; we send them here ----
function outboxContent(kind, p) {
  const media = (k) => { const o = p[k] || {}; return o.link ? { url: o.link } : null; };
  if (kind === 'text') return { text: String(p.text?.body ?? p.text ?? '') };
  if (kind === 'image' && media('image')) return { image: media('image'), caption: p.image.caption || undefined };
  if (kind === 'video' && media('video')) return { video: media('video'), caption: p.video.caption || undefined };
  if (kind === 'audio' && media('audio')) return { audio: media('audio'), mimetype: 'audio/mpeg' };
  if (kind === 'document' && media('document')) return { document: media('document'), fileName: p.document.filename || 'document', caption: p.document.caption || undefined, mimetype: 'application/pdf' };
  if (kind === 'interactive') { // buttons/lists are not available to linked devices: degrade to plain text
    const i = p.interactive || {}; const parts = [i.header?.text, i.body?.text].filter(Boolean);
    const btns = (i.action?.buttons || []).map(b => b.reply?.title).filter(Boolean);
    const rows = (i.action?.sections || []).flatMap(s => s.rows || []).map(r => r.title).filter(Boolean);
    const opts = btns.length ? btns : rows; if (opts.length) parts.push(opts.map((t, n) => `${n + 1}. ${t}`).join('\n'));
    if (i.action?.parameters?.url) parts.push(i.action.parameters.url);
    if (i.footer?.text) parts.push('_' + i.footer.text + '_');
    return parts.length ? { text: parts.join('\n\n') } : null;
  }
  if (kind === 'reaction' && p.reaction) return null;
  return null;
}
let outboxBusy = false;
async function pollOutbox() {
  if (outboxBusy || !sock || status !== 'open') return;
  outboxBusy = true;
  try {
    const rows = await sb('GET', 'wa53_outbox?status=eq.pending&order=id.asc&limit=10&select=id,to_number,kind,payload');
    for (const r of rows || []) {
      const claim = await sb('PATCH', `wa53_outbox?id=eq.${r.id}&status=eq.pending`, { status: 'sending' }, 'return=representation');
      if (!claim?.length) continue;
      try {
        const content = outboxContent(r.kind, r.payload || {});
        if (!content) throw new Error('unsupported kind ' + r.kind);
        const digits = String(r.to_number).replace(/\D/g, '');
        if (digits.length < 8) throw new Error('bad to');
        const jid = `${digits}@s.whatsapp.net`;
        await humanDelay(jid, content.text || content.caption || '');
        const out = await sock.sendMessage(jid, content);
        if (out?.key?.id) botSent.set(out.key.id, Date.now()); remember(out?.key, out?.message); await markBotSent(out?.key?.id);
        await sb('PATCH', `wa53_outbox?id=eq.${r.id}`, { status: 'sent', sent_at: new Date().toISOString(), error: null });
        log.info({ id: r.id, to: digits, kind: r.kind, wid: out?.key?.id }, 'outbox sent'); mesh.outbound(digits, out?.key?.id, 'outbox');
      } catch (e) {
        await sb('PATCH', `wa53_outbox?id=eq.${r.id}`, { status: 'failed', error: String(e?.message || e).slice(0, 500) }).catch(() => {});
        log.warn({ id: r.id, err: String(e?.message || e) }, 'outbox failed');
      }
    }
  } catch (e) { log.warn({ err: String(e?.message || e) }, 'outbox poll'); }
  finally { outboxBusy = false; }
}
setInterval(pollOutbox, Number(process.env.OUTBOX_POLL_MS || 1000));

function readBody(req) {
  return new Promise((res, rej) => { const a = []; req.on('data', c => a.push(c)); req.on('end', () => res(Buffer.concat(a))); req.on('error', rej); });
}

const server = http.createServer(async (req, res) => {
  const u = new URL(req.url, 'http://x');
  const json = (c, o) => { res.writeHead(c, { 'Content-Type': 'application/json' }); res.end(JSON.stringify(o)); };
  try {
    if (u.pathname === '/health') return json(200, { ok: true, instance: INSTANCE, leader, lock_holder: holder, status, me: me?.id || null, forward_inbound: FORWARD_IN, bot_inproc: INPROC, open_s: status === 'open' && lastOpenAt ? Math.round((Date.now() - lastOpenAt) / 1000) : 0, last_in_s: lastInboundAt ? Math.round((Date.now() - lastInboundAt) / 1000) : null, last_out_s: lastOutAt ? Math.round((Date.now() - lastOutAt) / 1000) : null, selfcheck_pending: pend.size, qr: !!(qrDataUrl && Date.now() - qrAt < QR_TTL_MS) });
    if (u.pathname === '/qr') {
      if (!authOk(req)) return json(401, { error: 'unauthorized' });
      const fresh = qrDataUrl && Date.now() - qrAt < QR_TTL_MS;
      if (req.headers.accept?.includes('application/json') || u.searchParams.get('format') === 'json')
        return json(200, { status, has_qr: !!fresh, expires_in_s: fresh ? Math.max(0, Math.floor((qrAt + QR_TTL_MS - Date.now()) / 1000)) : 0, png_path: QR_PNG });
      const html = `<!doctype html><meta charset=utf-8><title>WA53 pair</title>
        <body style="font-family:sans-serif;text-align:center;padding:2rem">
        <h1>Lier le 53 (WhatsApp Business)</h1>
        <p>Appareils connectés → Connecter un appareil. QR valide ~55 s, page auto-refresh.</p>
        ${fresh ? `<img src="${qrDataUrl}" width=320 height=320 alt=qr><p>expire dans ${Math.floor((qrAt + QR_TTL_MS - Date.now()) / 1000)}s</p>` : `<p>Statut: <b>${status}</b>${status === 'open' ? ' — déjà lié ✔' : ' — en attente d’un QR…'}</p>`}
        <script>setTimeout(()=>location.reload(),4000)</script></body>`;
      res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' }); return res.end(html);
    }
    if (u.pathname === '/qr.png') {
      if (!authOk(req)) return json(401, { error: 'unauthorized' });
      if (!fs.existsSync(QR_PNG)) return json(404, { error: 'no qr yet' });
      res.writeHead(200, { 'Content-Type': 'image/png' }); return res.end(fs.readFileSync(QR_PNG));
    }
    if (u.pathname === '/admin/resume' && req.method === 'POST') { // unpause one chat and let the bot answer its pending messages once
      if (!authOk(req)) return json(401, { error: 'unauthorized' });
      const wa = String(u.searchParams.get('wa') || '').replace(/\D/g, ''); if (wa.length < 8) return json(400, { error: 'wa' });
      await sb('DELETE', 'kv53?key=eq.' + encodeURIComponent('pause:' + wa)); bot53.kvForget('pause:' + wa);
      if (u.searchParams.get('answer') !== '1') return json(200, { ok: true, unpaused: wa });
      const out = await bot53.runJob({ kind: 'conv', wa, source: 'admin_resume' }, { send: botSend });
      return json(200, { ok: true, unpaused: wa, result: out?.result, sends: (out?.sends || []).length, fatal: out?.fatal ? String(out.fatal).slice(0, 300) : undefined, log: (out?.log || []).filter(l => !/^HTTP /.test(l)).slice(-10) });
    }
    if (u.pathname === '/send' && req.method === 'POST') {
      if (!authOk(req)) return json(401, { error: 'unauthorized' });
      const raw = await readBody(req); let b = {}; try { b = JSON.parse(raw.toString() || '{}'); } catch { return json(400, { error: 'bad json' }); }
      try {
        const out = await sendText(b.to, b.text || b.body || '');
        return json(200, { ok: true, ...out });
      } catch (e) { return json(e.code || 500, { ok: false, error: String(e.message || e) }); }
    }
    json(404, { error: 'not found' });
  } catch (e) { log.error(e); json(500, { error: String(e.message || e) }); }
});

server.listen(PORT, '0.0.0.0', () => log.info({ PORT }, 'wa53-bridge listening'));

// ---- leader election (Supabase wa53_bridge_lock): only the lock holder connects to WhatsApp ----
let leader = false, lastHbOk = 0, holder = null;
async function stopSock(why) {
  leader = false;
  const s = sock; sock = null; status = 'standby'; me = null;
  if (s) { try { s.ev.removeAllListeners(); s.end(undefined); } catch {} log.warn({ why }, 'disconnected from WhatsApp (lost lock)'); }
}
let lockBusy = false;
async function lockTick() {
  if (lockBusy) return; lockBusy = true; // never overlap ticks
  try {
    const r = await sb('POST', 'rpc/wa53_lock_acquire', { p_holder: INSTANCE, p_stale_s: LOCK_STALE_S });
    holder = r?.holder || null;
    if (r?.held) {
      lastHbOk = Date.now();
      if (!leader) { leader = true; log.info({ instance: INSTANCE }, 'lock acquired -> connecting'); startSock().catch(e => { log.error(e, 'startSock'); sock = null; }); }
      else if (!sock) startSock().catch(e => { log.error(e, 'startSock'); sock = null; });
    } else if (leader) await stopSock('held by ' + holder);
    else if (status === 'starting') status = 'standby';
  } catch (e) {
    log.warn({ err: String(e?.message || e) }, 'lock heartbeat failed');
    if (leader && Date.now() - lastHbOk > LOCK_LOSE_MS) await stopSock('heartbeat failing');
  } finally { lockBusy = false; }
}
// V2: KEEP_LOCK_ON_EXIT=1 (box) -> a clean restart keeps the lock, so the Render standby cannot grab it in the 5 s restart gap; it takes over only if the lock is stale > 45 s
async function shutdown() { try { await flushAuth(); } catch {} try { await stopSock('shutdown'); if (process.env.KEEP_LOCK_ON_EXIT !== '1') await sb('POST', 'rpc/wa53_lock_release', { p_holder: INSTANCE }); } catch {} process.exit(0); }
process.on('SIGTERM', shutdown); process.on('SIGINT', shutdown);
lockTick(); setInterval(lockTick, LOCK_HB_MS);
mesh.start({ getState: () => ({ leader, status, holder, me: me?.id || null, last_in_s: lastInboundAt ? Math.round((Date.now() - lastInboundAt) / 1000) : null, last_out_s: lastOutAt ? Math.round((Date.now() - lastOutAt) / 1000) : null, pend: pend.size, open_s: status === 'open' && lastOpenAt ? Math.round((Date.now() - lastOpenAt) / 1000) : 0 }), sendText, sendDocument, histAppend: (...a) => bot53 ? bot53.histAppend(...a) : Promise.resolve(), secrets: () => bot53 ? bot53.loadSecrets() : ({}), kvForget: (k) => bot53 && bot53.kvForget(k), repair, channelCreate: async (name, desc) => { if (!sock || status !== 'open') throw new Error('not connected');
    try { await sock.query({ tag: 'iq', attrs: { to: 's.whatsapp.net', xmlns: 'tos', id: sock.generateMessageTag(), type: 'set' }, content: [{ tag: 'notice', attrs: { id: '20601218', stage: '5' }, content: [] }] }); } catch (x) { console.error('[channel] tos', String(x.message || x).slice(0, 120)); } // accept Channels terms once (required before create)
    return sock.newsletterCreate(name, desc); },
  channelList: async () => { if (!sock || status !== 'open') throw new Error('not connected'); // owned/followed channels (mex xwa2_newsletter_subscribed), read-only
    const r = await sock.query({ tag: 'iq', attrs: { id: sock.generateMessageTag(), type: 'get', to: 's.whatsapp.net', xmlns: 'w:mex' }, content: [{ tag: 'query', attrs: { query_id: '6388546374527196' }, content: Buffer.from(JSON.stringify({ variables: {} }), 'utf-8') }] });
    const ch = (r.content || []).find(x => x.tag === 'result'); const d = ch && ch.content ? JSON.parse(ch.content.toString()) : null; if (d && d.errors) throw new Error(JSON.stringify(d.errors).slice(0, 200));
    const list = (d && d.data && d.data.xwa2_newsletter_subscribed) || [];
    return list.map(n => ({ jid: n.id, name: n.thread_metadata && n.thread_metadata.name && n.thread_metadata.name.text, invite: n.thread_metadata && n.thread_metadata.invite, role: n.viewer_metadata && n.viewer_metadata.role, created: n.thread_metadata && Number(n.thread_metadata.creation_time) })); },
  revokeOwn: async (jid, id) => { if (!sock || status !== 'open') throw new Error('not connected'); if (!/^(status@broadcast|\d+@newsletter)$/.test(jid)) throw new Error('jid refused'); await sock.sendMessage(jid, { delete: { remoteJid: jid, fromMe: true, id } }); return { ok: true }; }, // delete our own test status/channel post
  channelMeta: async (jid) => { if (!sock || status !== 'open') throw new Error('not connected'); return sock.newsletterMetadata('jid', jid); },
  channelSend: async (jid, buf, caption, kind = 'image') => { if (!sock || status !== 'open') throw new Error('not connected'); const out = await sock.sendMessage(jid, kind === 'text' ? { text: caption } : kind === 'video' ? { video: buf, caption } : { image: buf, caption }); return { id: out?.key?.id || null }; },
  sendStatus: async (buf, caption, kind = 'image') => {
  if (!sock || status !== 'open') throw new Error('not connected');
  let list = []; try { list = (await sb('GET', 'wa_contacts?line=eq.53&select=phone&order=last_seen.desc.nullslast&limit=1000') || []).map(x => String(x.phone).replace(/\D/g, '')).filter(p => p.length >= 8).map(p => p + '@s.whatsapp.net'); } catch {}
  if (me?.id) list.push(me.id.replace(/:\d+@/, '@'));
  const content = kind === 'text' ? { text: caption } : kind === 'video' ? { video: buf, caption } : { image: buf, caption };
  const out = await sock.sendMessage('status@broadcast', content, { statusJidList: [...new Set(list)], broadcast: true });
  return { id: out?.key?.id || null, n: list.length };
} });

// ---- heartbeat (Supabase kv53 'wa53:hb', read by eh-relay for the down-alert) + in-process watchdog (2026-10-13) ----
let notOpenSince = null, probeFails = 0;
setInterval(() => {
  if (!leader) return;
  sb('POST', 'kv53?on_conflict=key', { key: 'wa53:hb', value: JSON.stringify({ instance: INSTANCE, status, at: Date.now(), open: status === 'open', last_in: lastInboundAt || null, last_out: lastOutAt || null, pend: pend.size }), expires_at: new Date(Date.now() + 7 * 864e5).toISOString() }, 'resolution=merge-duplicates,return=minimal').catch(() => {});
}, 15000);
const WD_NOT_OPEN_MS = Number(process.env.WD_NOT_OPEN_MS || 60000);
async function wdExit(why) { log.error({ why }, 'WATCHDOG restart'); try { await sb('POST', 'events', { type: 'wa53_watchdog', source: 'bridge-inproc', data: { instance: INSTANCE, why } }, 'return=minimal'); } catch {} try { await flushAuth(); } catch {} process.exit(3); } // keep the lock: same instance re-acquires after restart
setInterval(async () => {
  if (!leader) { notOpenSince = null; return; }
  if (status === 'open' || status === 'qr') notOpenSince = null; else if (!notOpenSince) notOpenSince = Date.now();
  if (notOpenSince && Date.now() - notOpenSince > WD_NOT_OPEN_MS) return wdExit('socket not open for ' + Math.round((Date.now() - notOpenSince) / 1000) + 's (' + status + ')');
}, 5000);
// liveness probe: a cheap IQ to WhatsApp every 2 min; 3 failures in a row = stalled socket
setInterval(async () => {
  if (!leader || !sock || status !== 'open') { probeFails = 0; return; }
  try { await Promise.race([sock.fetchPrivacySettings(true), sleep(15000).then(() => { throw new Error('probe timeout'); })]); probeFails = 0; }
  catch (e) { probeFails++; log.warn({ probeFails, err: String(e?.message || e).slice(0, 80) }, 'liveness probe failed'); if (probeFails >= 3) wdExit('liveness probe failed x3'); }
}, 120000);
// inbound stall: socket "open" but no event at all for 45 min (WhatsApp normally pushes receipts/presence/app-state) -> reconnect
setInterval(() => { if (leader && status === 'open' && Date.now() - lastEvAt > Number(process.env.WD_STALL_MS || 45 * 60e3)) wdExit('no socket events for ' + Math.round((Date.now() - lastEvAt) / 60e3) + ' min'); }, 60000);

