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
export async function runJob(job, opts = {}) {
  const sec = await loadSecrets();
  const S = Object.assign({}, sec, { PHONE_ID: '1364570600073371', SEND_VIA: 'inproc', TEST_GUARD: !!opts.test, TEST_ALLOW: opts.test ? [] : ['22997342101', '2290197342101'] });
  const ai = mesh.aiState(); S.FORCE_PROVIDER = ai.forced || (process.env.AI_FIRST && !(ai.rest[process.env.AI_FIRST] > Date.now()) ? process.env.AI_FIRST : null); // AI_FIRST=groq: fastest first (<1 s) unless resting
  S.AI_REST = ai.rest; // Système V2: shared provider health
  await prefetchUser(job).catch(() => {});
  const ctx = vm.createContext({ __AIH: mesh.aiReport, Buffer, TextEncoder, setTimeout, clearTimeout, setInterval, clearInterval, queueMicrotask, console, __HTTP: HTTP, __S: S, __SEND: opts.send });
  script.runInContext(ctx);
  ctx.__RUNREF.t0 = Date.now();
  try { return await ctx.__entry(S, job); }
  catch (e) { return { fatal: String(e && e.stack || e).slice(0, 800), log: ctx.__RUNREF.log.slice(-20), sends: ctx.__RUNREF.sends }; }
}
// drop a cached kv53 key (e.g. after the bridge itself deletes pause:<wa> in Supabase)
export function kvForget(key) { KVC.delete(key); }
