// WA53 "rapide": the n8n "59 clone" runtime (core53.js) executed in-process inside the bridge.
// Each job runs in a fresh vm context (same isolation as one n8n execution); state stays in Supabase kv53.
import fs from 'fs'; import vm from 'vm'; import path from 'path'; import { fileURLToPath } from 'url';
const DIR = path.dirname(fileURLToPath(import.meta.url));
const script = new vm.Script(fs.readFileSync(path.join(DIR, 'core53.js'), 'utf8'), { filename: 'core53.js' });
const SB_URL = (process.env.SUPABASE_URL || '').replace(/\/$/, ''), SB_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || '';
let SECRETS = null, secAt = 0;
export async function loadSecrets(force) {
  if (SECRETS && !force && Date.now() - secAt < 10 * 60e3) return SECRETS;
  try {
    const r = await fetch(SB_URL + '/rest/v1/runtime_secrets?name=eq.wa53&select=data', { headers: { apikey: SB_KEY, Authorization: 'Bearer ' + SB_KEY } });
    const j = await r.json(); if (!r.ok || !j?.[0]?.data) throw new Error('runtime_secrets ' + r.status);
    SECRETS = j[0].data; secAt = Date.now();
  } catch (e) { if (!SECRETS) throw e; console.error('secrets refresh failed (keeping cache):', String(e.message).slice(0, 120)); }
  return SECRETS;
}
setInterval(() => loadSecrets(true).catch(() => {}), 10 * 60e3).unref();
// ---- V8 AI registry (Supabase: runtime_secrets 'ai_keys', eh_ai_providers, eh_settings ai_route/ai_auto_route) ----
let AI8 = null, ai8At = 0; const RR8 = {};
async function sbGet(p) { const r = await fetch(SB_URL + '/rest/v1/' + p, { headers: { apikey: SB_KEY, Authorization: 'Bearer ' + SB_KEY }, signal: AbortSignal.timeout(5000) }); if (!r.ok) throw new Error(p.split('?')[0] + ' ' + r.status); return r.json(); }
async function loadAi8() {
  if (AI8 && Date.now() - ai8At < 60e3) return AI8;
  try { const [k, pr, st] = await Promise.all([sbGet('runtime_secrets?name=eq.ai_keys&select=data'), sbGet('eh_ai_providers?select=name,kind,base_url,model,enabled'), sbGet('eh_settings?key=in.(ai_route,ai_auto_route)&select=key,value')]);
    const S = Object.fromEntries(st.map(x => [x.key, x.value])); AI8 = { keys: (k[0] && k[0].data) || {}, prov: pr, route: S.ai_route || {}, auto: S.ai_auto_route || {} }; ai8At = Date.now();
  } catch (e) { if (!AI8) AI8 = { keys: {}, prov: [], route: {}, auto: {} }; ai8At = Date.now() - 50e3; }
  return AI8;
}
const pick8 = (name, arr) => { if (!arr || !arr.length) return null; const i = (RR8[name] = (RR8[name] || 0) + 1) % arr.length; return arr[i]; };
const CORE8 = ['groq', 'gemini', 'openrouter', 'mistral', 'huggingface', 'cohere', 'workers_ai'];
async function xai(x, msgs, { max_tokens = 320, temperature = 0.6, timeoutMs = 8000 } = {}) {
  const key = pick8('x:' + x.name, x.keys); const base = String(x.base_url || '').replace(/\/$/, ''); const sig = AbortSignal.timeout(timeoutMs); let r, j, t;
  try {
    if (x.kind === 'anthropic') { r = await fetch(base + '/messages', { method: 'POST', signal: sig, headers: { 'Content-Type': 'application/json', 'x-api-key': key, 'anthropic-version': '2023-06-01' }, body: JSON.stringify({ model: x.model, system: msgs.filter(m => m.role === 'system').map(m => m.content).join('\n') || undefined, messages: msgs.filter(m => m.role !== 'system'), max_tokens, temperature }) }); j = await r.json().catch(() => ({})); t = (j.content || []).map(c => c.text || '').join(''); }
    else if (x.kind === 'gemini') { r = await fetch(`${base}/models/${x.model}:generateContent?key=${key}`, { method: 'POST', signal: sig, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ systemInstruction: { parts: [{ text: msgs.filter(m => m.role === 'system').map(m => m.content).join('\n') || ' ' }] }, contents: msgs.filter(m => m.role !== 'system').map(m => ({ role: m.role === 'assistant' ? 'model' : 'user', parts: [{ text: m.content }] })), generationConfig: { maxOutputTokens: max_tokens, temperature } }) }); j = await r.json().catch(() => ({})); t = (j?.candidates?.[0]?.content?.parts || []).map(p => p.text || '').join(''); }
    else if (x.kind === 'cohere') { r = await fetch(base + '/chat', { method: 'POST', signal: sig, headers: { 'Content-Type': 'application/json', Authorization: 'Bearer ' + key }, body: JSON.stringify({ model: x.model, messages: msgs, max_tokens, temperature }) }); j = await r.json().catch(() => ({})); t = (j?.message?.content || []).map(c => c.text || '').join(''); }
    else { r = await fetch(base + '/chat/completions', { method: 'POST', signal: sig, headers: { 'Content-Type': 'application/json', Authorization: 'Bearer ' + key }, body: JSON.stringify({ model: x.model, messages: msgs, max_tokens: Math.max(max_tokens, 300), temperature, ...(/gpt-oss/.test(x.model) ? { reasoning_effort: 'low' } : {}) }) }); j = await r.json().catch(() => ({})); t = j?.choices?.[0]?.message?.content || ''; }
  } catch (e) { return { ok: false, err: String(e.message || e).slice(0, 120) }; }
  t = String(t || '').replace(/<think>[\s\S]*?<\/think>/g, '').trim();
  return r.ok && t ? { ok: true, text: t, model: x.model } : { ok: false, err: `HTTP ${r.status}` };
}
export async function applyAi8(S, ai) {
  const A = await loadAi8(); const K = A.keys || {};
  const rot = (name, envName) => { const pool = [...new Set([S[envName], ...(K[name] || [])].filter(Boolean))]; const k = pick8(name, pool); if (k) S[envName] = k; };
  rot('gemini', 'GEMINI_API_KEY'); rot('groq', 'GROQ_API_KEY'); rot('mistral', 'MISTRAL_API_KEY'); rot('openrouter', 'OPENROUTER_API_KEY');
  const cf = pick8('workers_ai', K.workers_ai || []); if (cf && cf.includes(':')) { const i = cf.indexOf(':'); S.CF_AI_ACCOUNT = cf.slice(0, i); S.CF_AI_TOKEN = cf.slice(i + 1); }
  for (const p of A.prov) if (p.enabled === false) S.AI_REST[p.name] = Date.now() + 864e5; // disabled in the dashboard
  S.EXTRA_AI = A.prov.filter(p => p.enabled !== false && !CORE8.includes(p.name) && !['template', 'builtin59', 'cf'].includes(p.kind) && (K[p.name] || []).length).map(p => ({ ...p, keys: K[p.name] }));
  const ok = n => n && n !== 'auto' && !(S.AI_REST[n] > Date.now()) && (CORE8.includes(n) || S.EXTRA_AI.some(x => x.name === n));
  const route = A.route.reply, auto = A.auto.reply;
  S.FORCE_PROVIDER = ai.forced || (ok(route) ? route : null) || (ok(auto) ? auto : null) || S.FORCE_PROVIDER;
  S.AI8 = { route: route || 'auto', auto: auto || null, used_first: S.FORCE_PROVIDER, extra: S.EXTRA_AI.map(x => x.name) };
}
export const ai8Status = async () => { const A = await loadAi8(); return { route: A.route.reply || 'auto', auto: A.auto.reply || null, extra: A.prov.filter(p => !CORE8.includes(p.name) && (A.keys[p.name] || []).length).map(p => p.name), keys: Object.fromEntries(Object.entries(A.keys).map(([k, v]) => [k, v.length])) }; };
export const PROF = [];
// ---- process-wide write-through cache for kv53 single-key reads/writes (this process is the main kv53 writer) ----
const KV_TTL_MS = Number(process.env.KV_CACHE_MS || 20000), KV_TTL_GLOBAL_MS = Number(process.env.KV_CACHE_GLOBAL_MS || 300000), KVC = new Map(), KVQ = new Map();
const NOCACHE = /^(lock:|inseen:|botwid:)/;
const KVBASE = () => SB_URL + '/rest/v1/kv53';
const fake = (status, obj) => ({ statusCode: status, headers: { 'content-type': 'application/json' }, body: obj === undefined ? '' : JSON.stringify(obj) });
const asBody = (o, txt) => o.encoding === 'text' ? txt : Buffer.from(txt);
function kvQueue(key, o) { const prev = KVQ.get(key) || Promise.resolve(); const p = prev.then(() => HTTP0(o)).then(r => { if (r.statusCode >= 300) console.error('kv53 async write', r.statusCode, key.slice(0, 60)); }, e => console.error('kv53 async write err', key.slice(0, 60), String(e.message).slice(0, 80))); KVQ.set(key, p); p.finally(() => { if (KVQ.get(key) === p) KVQ.delete(key); }); }
export async function kvFlush() { await Promise.all([...KVQ.values()]); }
async function kvHTTP(o) {
  const url = String(o.url); if (!url.startsWith(KVBASE() + '?')) return null;
  const q = new URLSearchParams(url.slice(KVBASE().length + 1)); const m = (o.method || 'GET').toUpperCase();
  const pref = String((o.headers || {}).Prefer || (o.headers || {}).prefer || '');
  if (m === 'GET') { const k = (q.get('key') || ''); if (!k.startsWith('eq.') || [...q.keys()].some(x => x !== 'key' && x !== 'select')) return null; const key = k.slice(3); if (NOCACHE.test(key)) return null;
    const c = KVC.get(key); let row;
    if (c && Date.now() - c.at < (/\d{8,}/.test(key) ? KV_TTL_MS : KV_TTL_GLOBAL_MS)) row = c.row;
    else if (!c && isPrefetchedMiss(key)) { row = null; KVC.set(key, { at: Date.now(), row }); }
    else { const r = await HTTP0({ ...o, method: 'GET', url: KVBASE() + '?key=eq.' + encodeURIComponent(key) + '&select=key,value,metadata,expires_at', encoding: 'text' }); if (r.statusCode >= 300) return r; row = JSON.parse(r.body || '[]')[0] || null; KVC.set(key, { at: Date.now(), row }); }
    const sel = (q.get('select') || 'key,value,metadata,expires_at').split(',');
    const out = row ? [Object.fromEntries(sel.map(f => [f, row[f] === undefined ? null : row[f]]))] : [];
    return { statusCode: 200, headers: { 'content-type': 'application/json' }, body: asBody(o, JSON.stringify(out)) };
  }
  if (m === 'POST' && q.get('on_conflict') === 'key' && /merge-duplicates/.test(pref) && /return=minimal/.test(pref)) {
    let rows; try { rows = JSON.parse(typeof o.body === 'string' ? o.body : Buffer.from(o.body).toString('utf8')); } catch { return null; }
    rows = Array.isArray(rows) ? rows : [rows]; if (rows.some(r => !r || !r.key || NOCACHE.test(r.key))) return null;
    for (const r of rows) KVC.set(r.key, { at: Date.now(), row: { key: r.key, value: r.value ?? null, metadata: r.metadata ?? null, expires_at: r.expires_at ?? null } });
    kvQueue(rows.length === 1 ? rows[0].key : '*multi', o); return { statusCode: 201, headers: {}, body: asBody(o, '') };
  }
  if (m === 'DELETE') { const k = q.get('key') || ''; if (!k.startsWith('eq.') || [...q.keys()].length !== 1) return null; const key = k.slice(3); if (NOCACHE.test(key)) return null;
    KVC.set(key, { at: Date.now(), row: null }); kvQueue(key, o); return { statusCode: 204, headers: {}, body: asBody(o, '') }; }
  return null;
}
// ---- 2026-10-13 latency fix: ~30 sequential kv53 reads x 200 ms = 6 s per reply. One bulk read per conversation + background refresh of global keys ----
const PREF = new Map(); // wa -> at
function isPrefetchedMiss(key) { const m = key.match(/\d{8,}/g); if (!m) return false; return m.some(w => { const t = PREF.get(w); return t && Date.now() - t < KV_TTL_MS; }); }
async function prefetchUser(job) {
  let wa = null; try { const v = job.body.entry[0].changes[0].value; wa = (v.messages && v.messages[0] && v.messages[0].from) || null; } catch {}
  wa = String(wa || '').replace(/\D/g, ''); if (wa.length < 8) return;
  const t = PREF.get(wa); if (t && Date.now() - t < KV_TTL_MS / 2) return;
  const r = await HTTP0({ url: KVBASE() + '?key=like.*' + wa + '*&select=key,value,metadata,expires_at&limit=200', headers: { apikey: SB_KEY, Authorization: 'Bearer ' + SB_KEY }, encoding: 'text', timeout: 6000 });
  if (r.statusCode >= 300) return; const now = Date.now();
  for (const row of JSON.parse(r.body || '[]')) if (!NOCACHE.test(row.key) && !(KVC.get(row.key) && now - KVC.get(row.key).at < 3000)) KVC.set(row.key, { at: now, row });
  PREF.set(wa, now); if (PREF.size > 2000) PREF.clear();
}
setInterval(async () => { // refresh cached global keys in one query before they expire
  const keys = [...KVC.keys()].filter(k => !/\d{8,}/.test(k) && !NOCACHE.test(k)).slice(0, 150); if (!keys.length) return;
  try { const r = await HTTP0({ url: KVBASE() + '?key=in.(' + keys.map(k => '"' + k.replace(/"/g, '') + '"').map(encodeURIComponent).join(',') + ')&select=key,value,metadata,expires_at', headers: { apikey: SB_KEY, Authorization: 'Bearer ' + SB_KEY }, encoding: 'text', timeout: 10000 });
    if (r.statusCode < 300) { const now = Date.now(), got = new Set(); for (const row of JSON.parse(r.body || '[]')) { got.add(row.key); if (!(KVC.get(row.key) && now - KVC.get(row.key).at < 3000)) KVC.set(row.key, { at: now, row }); } for (const k of keys) if (!got.has(k)) KVC.set(k, { at: now, row: null }); } } catch {}
}, 240000).unref();
export const MEDIA = new Map(); // id -> { buf, mime, at }: inbound Baileys media served to core53 as if it were Graph media
function mediaHTTP(o) {
  const url = String(o.url); let m = url.match(/^https:\/\/graph\.facebook\.com\/v[\d.]+\/bridge\.([A-Za-z0-9]+)$/);
  if (m) { const x = MEDIA.get(m[1]); if (!x) return fake404(o); return { statusCode: 200, headers: { 'content-type': 'application/json' }, body: asBody(o, JSON.stringify({ id: 'bridge.' + m[1], url: 'https://bridge-media.local/' + m[1], mime_type: x.mime, file_size: x.buf.length })) }; }
  m = url.match(/^https:\/\/bridge-media\.local\/([A-Za-z0-9]+)$/);
  if (m) { const x = MEDIA.get(m[1]); if (!x) return fake404(o); return { statusCode: 200, headers: { 'content-type': x.mime }, body: o.encoding === 'text' ? x.buf.toString('latin1') : x.buf }; }
  return null;
}
const fake404 = (o) => ({ statusCode: 404, headers: { 'content-type': 'application/json' }, body: asBody(o, '{"error":{"message":"media expired"}}') });
async function HTTP(o) { const mm = mediaHTTP(o); if (mm) return mm; const c = await kvHTTP(o).catch(e => { console.error('kvcache', String(e.message).slice(0, 80)); return null; }); if (c) return c; const __t = Date.now(); try { return await HTTP0(o); } finally { PROF.push([Date.now() - __t, (o.method || "GET") + " " + decodeURIComponent(String(o.url)).replace(/&select.*$/, "").slice(0,110).replace(/^https:\/\/[^/]+/, m => m.slice(8, 30))]); } }
async function HTTP0(o) {
  const r = await fetch(o.url, { method: o.method || 'GET', headers: o.headers, body: o.body, redirect: o.disableFollowRedirect ? 'manual' : 'follow', signal: AbortSignal.timeout(o.timeout || 30000) });
  const b = Buffer.from(await r.arrayBuffer()); const h = {}; r.headers.forEach((v, k) => h[k] = v);
  return { statusCode: r.status, headers: h, body: o.encoding === 'text' ? b.toString('utf8') : b };
}
// opts: { send(payload) -> {id}|{error}, test: bool }
import * as mesh from './mesh53.mjs';
// ---- 2026-10-14: conversation history written by the bridge itself (reminders, receipts, invoices, owner phone) + client file for the AI ----
const SBH = () => ({ apikey: SB_KEY, Authorization: 'Bearer ' + SB_KEY, 'Content-Type': 'application/json' });
export async function histGet(wa) { const r = await HTTP({ url: KVBASE() + '?key=eq.' + encodeURIComponent('conv:' + wa) + '&select=key,value,metadata,expires_at', headers: SBH(), encoding: 'text' }); const row = JSON.parse(r.body || '[]')[0] || null; let h = []; try { h = row && row.value ? JSON.parse(row.value) : []; } catch {} return { row, hist: Array.isArray(h) ? h : [] }; }
export async function histAppend(wa, role, text, via) {
  wa = String(wa || '').replace(/\D/g, ''); text = String(text || '').trim(); if (wa.length < 8 || !text) return;
  const { row, hist } = await histGet(wa); hist.push({ role, text: text.slice(0, 1500), ts: Math.floor(Date.now() / 1000), ...(via ? { via } : {}) });
  const meta = row && row.metadata ? { ...row.metadata, ...(role !== 'user' ? { last_bot_ts: Math.floor(Date.now() / 1000) } : {}) } : null;
  await HTTP({ url: KVBASE() + '?on_conflict=key', method: 'POST', headers: { ...SBH(), Prefer: 'resolution=merge-duplicates,return=minimal' }, body: JSON.stringify({ key: 'conv:' + wa, value: JSON.stringify(hist.slice(-80)), metadata: meta, expires_at: row ? row.expires_at : null }) });
}
const fF = n => String(Math.round(n || 0)).replace(/\B(?=(\d{3})+(?!\d))/g, ' ') + ' F CFA';
async function clientCtx(wa, hist) {
  const lines = [];
  try {
    const q = async p => { const r = await fetch(SB_URL + '/rest/v1/' + p, { headers: SBH(), signal: AbortSignal.timeout(4000) }); return r.ok ? r.json() : []; };
    const tail = wa.slice(-8);
    const [subs, sales] = await Promise.all([q(`subscriptions?select=product,ends_on,price_fcfa,paid_fcfa,status&deleted_at=is.null&client_wa=like.*${tail}&limit=10`), q(`sales?select=product,amount_fcfa,paid_fcfa,category&client_wa=like.*${tail}&category=neq.abonnement&order=id.desc&limit=5`)]);
    for (const s of subs) { const d = s.ends_on ? Math.round((Date.parse(s.ends_on + 'T23:59:59Z') - Date.now()) / 864e5) : null; const bal = s.price_fcfa ? Math.max(0, s.price_fcfa - (s.paid_fcfa || 0)) : null;
      lines.push(`- Abonnement ${s.product}${s.status === 'cancelled' ? ' (annulé)' : ''} : fin le ${s.ends_on || '?'}${d != null ? (d >= 0 ? ` (dans ${d} jours)` : ` (expiré depuis ${-d} jours)`) : ''}${bal == null ? '' : bal ? ` ; déjà payé ${fF(s.paid_fcfa || 0)}, reste à payer ${fF(bal)}` : ' ; entièrement payé'}`); }
    for (const s of sales) { const bal = Math.max(0, (s.amount_fcfa || 0) - (s.paid_fcfa || 0)); if (bal) lines.push(`- Achat ${s.product || ''} : déjà payé ${fF(s.paid_fcfa || 0)}, reste à payer ${fF(bal)}`); }
  } catch {}
  const now = Date.now() / 1000, recent = hist.filter(h => h && h.role !== 'user' && now - (Number(h.ts) || 0) < 7 * 86400);
  const out = [];
  if (lines.length) out.push('DOSSIER DU CLIENT (interne, pour comprendre sa situation ; ne récite pas tout) :\n' + lines.join('\n'));
  if (recent.length) out.push(`CONVERSATION EN COURS : nous lui avons déjà écrit (voir HISTORIQUE, dont nos rappels / reçus / factures). Ne le salue PAS à nouveau, pas de « Bonjour », pas de « Comment puis-je vous aider ». Réagis directement à sa réponse, comme un vendeur humain qui le connaît.`);
  const lastOur = [...hist].reverse().find(h => h && h.role !== 'user'); if (lastOur && /rappel/.test(lastOur.via || '')) out.push(`PRIORITAIRE — IL RÉPOND À NOTRE ${/paiement|payment/.test(lastOur.via) ? 'RAPPEL DE PAIEMENT' : "RAPPEL D'ABONNEMENT"} (ces règles passent avant toute consigne de paiement ou de commande ci-dessus).` + (/paiement|payment/.test(lastOur.via) ? '' : " Si le DOSSIER dit que l'abonnement est entièrement payé, NE PARLE PAS DE PAIEMENT ni de numéro MoMo : remercie-le et dis qu'on le recontactera à l'approche de l'échéance pour le renouvellement (s'il veut renouveler dès maintenant, il n'a qu'à nous le dire)."));
  out.push(`RÉPONSES COURTES (« d'accord », « ok », « oui », « merci », pouce…) : comprends-les par rapport à NOTRE dernier message. Après un rappel d'abonnement : remercie-le brièvement et donne la suite (s'il veut renouveler maintenant, dis comment faire ; sinon, qu'on le recontactera à l'approche de l'échéance). Après un rappel de paiement : remercie et indique simplement comment régler le reste (Mobile Money ou espèces). Jamais de texte figé ni de formule toute faite : 1 à 2 phrases naturelles, brèves. Ne cite aucun montant sauf le reste à payer du DOSSIER s'il est utile.`);
  return out.join('\n\n');
}
export const AGREE = /^\s*(d'?\s?accord|dac+|ok+|okay|oui|ouais|yes|ça marche|ca marche|entendu|parfait|volontiers|pas de souci|pas de probl[eè]me|je (vais |veux )?(renouvel|pay|r[ée]gl|envoy)|c'?est bon|👍)/i;
export async function runJob(job, opts = {}) {
  const sec = await loadSecrets();
  const S = Object.assign({}, sec, { PHONE_ID: '1364570600073371', SEND_VIA: 'inproc', TEST_GUARD: !!opts.test, TEST_ALLOW: opts.test ? [] : ['22997342101', '2290197342101'] });
  const ai = mesh.aiState(); S.FORCE_PROVIDER = ai.forced || (process.env.AI_FIRST && !(ai.rest[process.env.AI_FIRST] > Date.now()) ? process.env.AI_FIRST : null); // AI_FIRST=groq: fastest first (<1 s) unless resting
  S.AI_REST = { ...ai.rest }; // Système V2: shared provider health (copy: V8 adds per-job disabled flags)
  try { await applyAi8(S, ai); } catch (e) { console.error('ai8', String(e.message || e).slice(0, 120)); }
  await prefetchUser(job).catch(() => {});
  let __CLIENTCTX = '';
  try { const v = job.body.entry[0].changes[0].value; const wa = String((v.messages && v.messages[0] && v.messages[0].from) || '').replace(/\D/g, ''); if (wa.length >= 8) { const { hist } = await histGet(wa); __CLIENTCTX = await clientCtx(wa, hist); } } catch {}
  const ctx = vm.createContext({ __CLIENTCTX, __AIH: mesh.aiReport, __XAI: xai, Buffer, TextEncoder, setTimeout, clearTimeout, setInterval, clearInterval, queueMicrotask, console, __HTTP: HTTP, __S: S, __SEND: opts.send });
  script.runInContext(ctx);
  ctx.__RUNREF.t0 = Date.now();
  try { return await ctx.__entry(S, job); }
  catch (e) { return { fatal: String(e && e.stack || e).slice(0, 800), log: ctx.__RUNREF.log.slice(-20), sends: ctx.__RUNREF.sends }; }
}
// drop a cached kv53 key (e.g. after the bridge itself deletes pause:<wa> in Supabase)
export function kvForget(key) { KVC.delete(key); }
