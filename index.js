/**
 * WA53 unofficial linked-device bridge (Baileys).
 * - Pair via /qr (key-protected) or qr.png on disk
 * - Outbound: POST /send {to,text} with Authorization: Bearer <BRIDGE_KEY>
 * - Inbound forward to n8n (Meta-like JSON) is OFF by default (BRIDGE_FORWARD_INBOUND=0)
 *   so Meta Cloud API webhook keeps feeding the clone without double replies.
 */
import makeWASocket, {
  DisconnectReason, useMultiFileAuthState, fetchLatestBaileysVersion,
  makeCacheableSignalKeyStore, downloadMediaMessage, jidNormalizedUser
} from '@whiskeysockets/baileys';
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
const LOCK_HB_MS = 10_000, LOCK_STALE_S = 45, LOCK_LOSE_MS = 30_000; // heartbeat 10s, takeover if stale >45s, self-demote if no successful heartbeat for 30s
const BRIDGE_KEY = process.env.BRIDGE_KEY || '';
const SB_URL = (process.env.SUPABASE_URL || '').replace(/\/$/, '');
const SB_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || '';
const N8N_WEBHOOK = process.env.N8N_WEBHOOK || 'https://eh-n8n.onrender.com/webhook/wa53';
const PHONE_NUMBER_ID = process.env.PHONE_NUMBER_ID_53 || '1364570600073371';
const FORWARD_IN = process.env.BRIDGE_FORWARD_INBOUND === '1';
const AUTH_DIR = path.join(__dirname, '.auth');
const QR_PNG = path.join(__dirname, 'qr.png');
const QR_META = path.join(__dirname, 'qr.meta.json');
const log = pino({ level: process.env.LOG_LEVEL || 'info' });

if (!SB_URL || !SB_KEY) {
  console.error('Need SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY (and INSTANCE_NAME)');
  process.exit(1);
}

const seen = new Map(); // id -> ts
const cleanSeen = () => { const n = Date.now(); for (const [k, t] of seen) if (n - t > 6e5) seen.delete(k); };
setInterval(cleanSeen, 6e4);

async function sb(method, path, body, prefer) {
  const r = await fetch(SB_URL + '/rest/v1/' + path, {
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
async function saveAuthToSb(creds, keys) {
  await sb('POST', 'wa53_bridge_auth?on_conflict=id',
    [{ id: 'default', creds, keys, updated_at: new Date().toISOString() }],
    'resolution=merge-duplicates');
}

/** Multi-file auth that also mirrors to Supabase after every write. */
async function useSupabaseAuthState() {
  fs.mkdirSync(AUTH_DIR, { recursive: true });
  const remote = await loadAuthToDisk();
  const { state, saveCreds } = await useMultiFileAuthState(AUTH_DIR);
  let mirrorTimer = null, mirrorChain = Promise.resolve();
  const save = async () => {
    if (!leader) return; // never write creds after losing the lock
    await saveCreds();
    clearTimeout(mirrorTimer); // debounce + serialize mirrors so an older snapshot never overwrites a newer one
    mirrorTimer = setTimeout(() => { mirrorChain = mirrorChain.then(mirror).catch(() => {}); }, 1500);
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
  fs.mkdirSync(AUTH_DIR, { recursive: true });
  fs.writeFileSync(path.join(AUTH_DIR, 'creds.json'), JSON.stringify(row.creds, null, 2));
  for (const [f, v] of Object.entries(row.keys || {})) {
    fs.writeFileSync(path.join(AUTH_DIR, f), JSON.stringify(v, null, 2));
  }
  return true;
}

let sock = null, qrDataUrl = null, qrAt = 0, status = 'starting', me = null;
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
async function humanDelay() { await sleep(800 + Math.floor(Math.random() * 2200)); } // 0.8–3s

async function startSock() {
  if (!leader || sock) return;
  fs.rmSync(AUTH_DIR, { recursive: true, force: true }); // always start from the Supabase copy (another instance may have updated it)
  const { state, saveCreds } = await useSupabaseAuthState();
  if (!leader) return;
  const { version } = await fetchLatestBaileysVersion();
  const my = makeWASocket({
    version, auth: { creds: state.creds, keys: makeCacheableSignalKeyStore(state.keys, log) },
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
      fs.writeFileSync(QR_META, JSON.stringify({ at: qrAt, expiresAt: qrAt + QR_TTL_MS, path: QR_PNG }));
      status = 'qr';
      log.info({ png: QR_PNG, ttl_s: QR_TTL_MS / 1000 }, 'QR ready — scan with WhatsApp Business > Appareils connectés');
    }
    if (connection === 'open') {
      status = 'open'; me = my.user; qrDataUrl = null;
      try { fs.unlinkSync(QR_PNG); } catch {}
      log.info({ me: me?.id }, 'linked');
    }
    if (connection === 'close') {
      const code = (lastDisconnect?.error instanceof Boom) ? lastDisconnect.error.output?.statusCode : 0;
      status = 'closed:' + code;
      const restart = code !== DisconnectReason.loggedOut;
      log.warn({ code, restart }, 'connection closed');
      sock = null;
      if (!leader) return;
      if (restart) setTimeout(startSock, 2000);
      else { try { fs.rmSync(AUTH_DIR, { recursive: true, force: true }); await sb('DELETE', 'wa53_bridge_auth?id=eq.default'); } catch {} setTimeout(startSock, 1000); }
    }
  });
  my.ev.on('messages.upsert', async ({ messages, type }) => {
    if (!FORWARD_IN) return;
    if (type !== 'notify') return;
    for (const m of messages) {
      try { await handleInbound(m); } catch (e) { log.error(e, 'inbound'); }
    }
  });
}

async function handleInbound(m) {
  if (!m.message || m.key.fromMe) return;
  const jid = m.key.remoteJid || '';
  if (jid.endsWith('@g.us') || jid === 'status@broadcast' || jid.endsWith('@newsletter')) return;
  const id = m.key.id; if (!id || seen.has(id)) return; seen.set(id, Date.now());
  const from = toDigits(jid);
  if (!from) return;
  let text = '', msgType = 'text';
  const msg = m.message;
  if (msg.conversation) text = msg.conversation;
  else if (msg.extendedTextMessage?.text) text = msg.extendedTextMessage.text;
  else if (msg.imageMessage) { msgType = 'image'; text = msg.imageMessage.caption || '[image]'; }
  else if (msg.audioMessage) { msgType = msg.audioMessage.ptt ? 'voice' : 'audio'; text = '[voice]'; }
  else if (msg.videoMessage) { msgType = 'video'; text = msg.videoMessage.caption || '[video]'; }
  else if (msg.documentMessage) { msgType = 'document'; text = msg.documentMessage.caption || '[document]'; }
  else return; // stickers etc. skip
  const body = {
    object: 'whatsapp_business_account',
    entry: [{ id: '2333109240587511', changes: [{ field: 'messages', value: {
      messaging_product: 'whatsapp',
      metadata: { display_phone_number: '22953632000', phone_number_id: PHONE_NUMBER_ID },
      contacts: [{ wa_id: from, profile: { name: m.pushName || null } }],
      messages: [{ from, id: 'bridge.' + id, timestamp: String(m.messageTimestamp || Math.floor(Date.now() / 1000)), type: msgType, text: { body: text },
        ...(msgType === 'image' ? { image: { caption: text, id: 'bridge.' + id } } : {}),
        ...(msgType === 'voice' || msgType === 'audio' ? { audio: { id: 'bridge.' + id } } : {}) }]
    }}]}]
  };
  const r = await fetch(N8N_WEBHOOK, { method: 'POST', headers: { 'Content-Type': 'application/json', 'x-eh-bridge': '1' }, body: JSON.stringify(body) });
  log.info({ from, status: r.status, text: text.slice(0, 40) }, 'forwarded inbound');
}

async function sendText(to, text) {
  if (!sock || status !== 'open') throw Object.assign(new Error('not linked'), { code: 503 });
  const digits = String(to).replace(/\D/g, '');
  if (!digits || digits.length < 8) throw Object.assign(new Error('bad to'), { code: 400 });
  // ban-risk guard: reject bulk / identical blast
  if (String(text).length > 4000) throw Object.assign(new Error('text too long'), { code: 400 });
  await humanDelay();
  const jid = digits.includes('@') ? digits : `${digits}@s.whatsapp.net`;
  const r = await sock.sendMessage(jid, { text: String(text) });
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
        await humanDelay();
        const out = await sock.sendMessage(`${digits}@s.whatsapp.net`, content);
        await sb('PATCH', `wa53_outbox?id=eq.${r.id}`, { status: 'sent', sent_at: new Date().toISOString(), error: null });
        log.info({ id: r.id, to: digits, kind: r.kind, wid: out?.key?.id }, 'outbox sent');
      } catch (e) {
        await sb('PATCH', `wa53_outbox?id=eq.${r.id}`, { status: 'failed', error: String(e?.message || e).slice(0, 500) }).catch(() => {});
        log.warn({ id: r.id, err: String(e?.message || e) }, 'outbox failed');
      }
    }
  } catch (e) { log.warn({ err: String(e?.message || e) }, 'outbox poll'); }
  finally { outboxBusy = false; }
}
setInterval(pollOutbox, Number(process.env.OUTBOX_POLL_MS || 2000));

function readBody(req) {
  return new Promise((res, rej) => { const a = []; req.on('data', c => a.push(c)); req.on('end', () => res(Buffer.concat(a))); req.on('error', rej); });
}

const server = http.createServer(async (req, res) => {
  const u = new URL(req.url, 'http://x');
  const json = (c, o) => { res.writeHead(c, { 'Content-Type': 'application/json' }); res.end(JSON.stringify(o)); };
  try {
    if (u.pathname === '/health') return json(200, { ok: true, instance: INSTANCE, leader, lock_holder: holder, status, me: me?.id || null, forward_inbound: FORWARD_IN, qr: !!(qrDataUrl && Date.now() - qrAt < QR_TTL_MS) });
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
async function lockTick() {
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
  }
}
async function shutdown() { try { await stopSock('shutdown'); await sb('POST', 'rpc/wa53_lock_release', { p_holder: INSTANCE }); } catch {} process.exit(0); }
process.on('SIGTERM', shutdown); process.on('SIGINT', shutdown);
lockTick(); setInterval(lockTick, LOCK_HB_MS);

