// EH Système V2 (2026-10-13): bridge <-> Supabase bus (eh_events, eh_bot_status, eh_heartbeats, eh_commands, eh_ai_health).
// Every call is best-effort: a Supabase outage never blocks a customer reply (claim fails OPEN; the lock already guarantees one connected bridge).
const SB_URL = (process.env.SUPABASE_URL || '').replace(/\/$/, ''), SB_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || '';
const INSTANCE = process.env.INSTANCE_NAME || 'box';
const WHO = 'wa53-bridge:' + INSTANCE;
async function sb(method, p, body, prefer) {
  const r = await fetch(SB_URL + '/rest/v1/' + p, { method, signal: AbortSignal.timeout(6000), headers: { apikey: SB_KEY, Authorization: 'Bearer ' + SB_KEY, 'Content-Type': 'application/json', ...(prefer ? { Prefer: prefer } : {}) }, body: body ? JSON.stringify(body) : undefined });
  const t = await r.text(); if (!r.ok) throw new Error(`sb ${method} ${p.split('?')[0]} ${r.status} ${t.slice(0, 120)}`); return t ? JSON.parse(t) : null;
}
// ---- strict dedup by message id, recorded BEFORE any reply ----
export async function claim(id, wa) {
  try { return await sb('POST', 'rpc/eh_claim_message', { p_key: 'wa53:' + id, p_who: WHO, p_line: '53', p_wa: wa }) === true; }
  catch (e) { console.error('[mesh] claim failed open', String(e.message).slice(0, 100)); return true; }
}
// ---- events (batched) ----
let buf = [];
export function event(type, data = {}, extra = {}) { buf.push({ source: WHO, type, line: '53', wa: extra.wa || null, msg_id: extra.msg_id || null, dedup_key: extra.dedup_key || null, data }); if (buf.length > 200) buf.shift(); }
async function flush() { if (!buf.length) return; const b = buf; buf = []; try { await sb('POST', 'eh_events', b, 'return=minimal'); } catch (e) { console.error('[mesh] events', String(e.message).slice(0, 100)); } }
setInterval(flush, 3000).unref();
export const inbound = (wa, id, kind, text) => event('msg_in', { kind, len: String(text || '').length }, { wa, msg_id: id });
export const outbound = (wa, id, via, ms) => event('msg_out', { via, ms }, { wa, msg_id: id || null });
// ---- shared AI health ----
let REST = {}, FORCED = null;
export const aiState = () => ({ rest: REST, forced: FORCED && FORCED.until > Date.now() ? FORCED.provider : null });
async function readAi() {
  try {
    const rows = await sb('GET', 'eh_ai_health?select=provider,state,rest_until,forced_until');
    const now = Date.now(); REST = {}; FORCED = null;
    for (const r of rows || []) {
      if (r.rest_until && Date.parse(r.rest_until) > now) REST[r.provider] = Date.parse(r.rest_until);
      if (r.forced_until && Date.parse(r.forced_until) > now) FORCED = { provider: r.provider, until: Date.parse(r.forced_until) };
    }
  } catch {}
}
setInterval(readAi, 60000).unref(); readAi();
const aiLast = new Map();
export function aiReport(provider, ok, ms, err, restS = 0) {
  const k = provider + ok; const t = aiLast.get(k) || 0; if (ok && Date.now() - t < 30000) return; aiLast.set(k, Date.now()); // rate-limit success writes
  sb('POST', 'rpc/eh_ai_report', { p_provider: provider, p_ok: !!ok, p_ms: Math.round(ms || 0), p_err: err ? String(err).slice(0, 300) : null, p_by: WHO, p_rest_s: restS }).catch(() => {});
}
// ---- global pause (command center) ----
let pausedUntil = 0;
export const isPaused = () => pausedUntil > Date.now();
// ---- heartbeat ----
let getState = () => ({}), lastHbRow = 0;
async function beat() {
  const s = getState(); const now = new Date().toISOString();
  try {
    await sb('POST', 'eh_bot_status?on_conflict=component', { component: WHO, kind: 'wa53-bridge', line: '53', status: s.leader ? (s.status === 'open' ? (isPaused() ? 'paused' : 'active') : 'degraded:' + s.status) : 'standby', instance: INSTANCE, last_beat: now, paused: isPaused(), info: { ...s, paused_until: pausedUntil || null, ai_forced: aiState().forced }, updated_at: now }, 'resolution=merge-duplicates,return=minimal');
    if (Date.now() - lastHbRow > 300000) { lastHbRow = Date.now(); await sb('POST', 'eh_heartbeats', { component: WHO, ok: s.leader ? s.status === 'open' : true, info: { leader: s.leader, status: s.status } }, 'return=minimal'); }
  } catch (e) { console.error('[mesh] beat', String(e.message).slice(0, 100)); }
}
// ---- command consumer (leader only) ----
let ctx = null, cmdBusy = false;
const BANNED = /cotonou/i, PRICE = /\d[\d\s.,]*\s*(f\b|fcfa|cfa|xof|€|\$|francs?)/i;
async function aiText(S, instruction) {
  const sys = "Tu écris des messages WhatsApp pour Electronic HOUSE (boutique en ligne : abonnements numériques — Google One Gemini Pro en premier —, ChatGPT, Netflix, Office, antivirus… et téléphones neufs/venus). 2 à 4 phrases, chaleureux, naturel, en français. JAMAIS de prix, jamais de ville, jamais de commission. Pas de signature.";
  const tries = [];
  if (S.GROQ_API_KEY) tries.push(() => fetch('https://api.groq.com/openai/v1/chat/completions', { method: 'POST', signal: AbortSignal.timeout(8000), headers: { 'Content-Type': 'application/json', Authorization: 'Bearer ' + S.GROQ_API_KEY }, body: JSON.stringify({ model: 'openai/gpt-oss-20b', messages: [{ role: 'system', content: sys }, { role: 'user', content: instruction }], max_tokens: 300, temperature: 0.8 }) }).then(r => r.json()).then(j => j?.choices?.[0]?.message?.content));
  if (S.GEMINI_API_KEY) tries.push(() => fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-3.1-flash-lite:generateContent?key=${S.GEMINI_API_KEY}`, { method: 'POST', signal: AbortSignal.timeout(8000), headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ systemInstruction: { parts: [{ text: sys }] }, contents: [{ role: 'user', parts: [{ text: instruction }] }], generationConfig: { maxOutputTokens: 300, temperature: 0.8 } }) }).then(r => r.json()).then(j => (j?.candidates?.[0]?.content?.parts || []).map(p => p.text || '').join('')));
  for (const f of tries) { try { const t = String(await f() || '').replace(/<think>[\s\S]*?<\/think>/g, '').trim(); if (t && !BANNED.test(t) && !PRICE.test(t)) return t; } catch {} }
  return null;
}
async function exec(c) {
  const p = c.params || {};
  switch (c.action) {
    case 'pause': { const min = Math.min(Number(p.minutes || 60), 24 * 60); pausedUntil = Date.now() + min * 60e3; return { ok: true, paused_until: new Date(pausedUntil).toISOString() }; }
    case 'resume': pausedUntil = 0; return { ok: true };
    case 'pause_chat': case 'resume_chat': { const wa = String(p.wa || '').replace(/\D/g, ''); if (wa.length < 8) return { ok: false, error: 'wa' };
      if (c.action === 'pause_chat') await sb('POST', 'kv53?on_conflict=key', { key: 'pause:' + wa, value: JSON.stringify({ until: Math.floor(Date.now() / 1000) + Number(p.hours || 12) * 3600, why: 'owner_dashboard', mode: 'owner' }), expires_at: new Date(Date.now() + 2 * 864e5).toISOString() }, 'resolution=merge-duplicates,return=minimal');
      else await sb('DELETE', 'kv53?key=eq.' + encodeURIComponent('pause:' + wa)); ctx.kvForget && ctx.kvForget('pause:' + wa); return { ok: true, wa }; }
    case 'send_catalog': case 'send_text': case 'send_reminder': {
      const wa = String(p.wa || p.to || '').replace(/\D/g, ''); if (wa.length < 8) return { ok: false, error: 'numéro invalide' };
      if (!c.confirmed_at) return { ok: false, error: 'confirmation requise' };
      let text = p.text;
      if (c.action === 'send_catalog') text = await aiText(await ctx.secrets(), `Écris un message pour présenter notre catalogue à ${p.name || 'ce client'} en citant d'abord Google One Gemini Pro (abonnement phare), puis les autres abonnements et les téléphones, et l'inviter à le parcourir ici : https://electronichouse.pages.dev ${p.note ? '(contexte : ' + p.note + ')' : ''}. Termine par une question ouverte.`);
      if (c.action === 'send_reminder' && !text) text = await aiText(await ctx.secrets(), `Écris un rappel amical de renouvellement d'abonnement (${p.product || 'abonnement'}) à ${p.name || 'ce client'}, qui a demandé à être prévenu.`);
      if (!text) return { ok: false, error: 'IA indisponible' };
      if (BANNED.test(text)) return { ok: false, error: 'mot interdit' };
      const out = await ctx.sendText(wa, text); outbound(wa, out.id, 'command:' + c.action);
      return { ok: true, wa, wid: out.id, text: text.slice(0, 300) };
    }
    case 'force_provider': return { ok: true, note: 'appliqué via eh_ai_health.forced_until (lu chaque minute)' };
    case 'status': return { ok: true, state: getState() };
    case 'status_post': return postStatus({ manual: true, slot: 'manual-' + c.id, product: p.product });
    case 'channel_list': return ctx.channelList ? { ok: true, list: await ctx.channelList() } : { ok: false };
    case 'channel_post': return postChannel({ manual: true, slot: 'manual-' + c.id, product: p.product });
    case 'repair': return ctx.repair ? ctx.repair(p.mode === 'code' ? 'code' : 'qr', p.phone, !!p.force) : { ok: false, error: 'non supporté' };
    default: return { ok: false, error: 'action inconnue pour wa53: ' + c.action };
  }
}
async function pollCommands() {
  if (cmdBusy || !ctx || !getState().leader) return; cmdBusy = true;
  try {
    const rows = await sb('GET', 'eh_commands?status=eq.pending&target=in.(wa53,all)&order=id.asc&limit=5&select=*');
    for (const c of rows || []) {
      const got = await sb('PATCH', `eh_commands?id=eq.${c.id}&status=eq.pending`, { status: 'running', claimed_by: WHO, claimed_at: new Date().toISOString() }, 'return=representation');
      if (!got?.length) continue;
      let res; try { res = await exec(got[0]); } catch (e) { res = { ok: false, error: String(e.message || e).slice(0, 300) }; }
      await sb('PATCH', `eh_commands?id=eq.${c.id}`, { status: res.ok ? 'done' : 'failed', result: res, done_at: new Date().toISOString() }).catch(() => {});
      event('command', { id: c.id, action: c.action, ok: res.ok });
    }
  } catch (e) { console.error('[mesh] cmds', String(e.message).slice(0, 100)); } finally { cmdBusy = false; }
}
// ---- WhatsApp Status bot (2026-10-13): product image + short AI caption, Google One Gemini first, no price, never the city; leader only ----
let stBusy = false; const ST_FIRST = 8 * 60, ST_LAST = 21 * 60;
async function stSettings() { try { const r = await sb('GET', 'eh_settings?key=in.(wa53_status_per_day,wa53_status_paused)&select=key,value'); const o = Object.fromEntries((r || []).map(x => [x.key, x.value])); return { n: Math.max(0, Math.min(Number(o.wa53_status_per_day ?? 4), 12)), paused: o.wa53_status_paused === true }; } catch { return { n: 4, paused: false }; } }
async function stProducts() {
  const r = await fetch('https://electronichouse.pages.dev/feeds/google.tsv', { signal: AbortSignal.timeout(15000) }); const L = (await r.text()).split('\n').filter(Boolean); const h = L.shift().split('\t'); const ix = n => h.indexOf(n);
  const items = L.map(l => { const c = l.split('\t'); return { id: c[ix('id')], name: c[ix('title')], desc: c[ix('description')], img: c[ix('image_link')], type: c[ix('product_type')] || '' }; }).filter(x => x.img && /^https:/.test(x.img));
  let extra = []; try { extra = (await sb('GET', 'eh_catalog_extra?active=eq.true&photo=like.http*&select=name,description,photo,category')).map(x => ({ id: 'x:' + x.name, name: x.name, desc: x.description, img: x.photo, type: x.category })); } catch {}
  return [...items, ...extra];
}

// Real product photos / brand posters from the eh-facebook bot's image logic (pickImage via /admin/preview, read-only)
const FB_URL = process.env.FB_PREVIEW_URL || 'https://eh-facebook.domingohoreb.workers.dev', FB_KEY = process.env.FB_ADMIN_KEY || '';
async function fbImage(id) {
  if (!FB_KEY) return null;
  const q = new URLSearchParams({ key: FB_KEY }); if (id) q.set('id', id);
  const j = await (await fetch(`${FB_URL}/admin/preview?${q}`, { signal: AbortSignal.timeout(45000) })).json();
  if (!j.ok && id) return fbImage(null);
  if (!j.ok || !j.product_id || /affiche_EH|logo/i.test(String(j.image_source))) return { error: 'fb preview ' + (j.image_source || j.error || 'ko') };
  q.set('id', j.product_id); q.set('png', '1'); if (j.layout != null) q.set('layout', String(j.layout));
  const r = await fetch(`${FB_URL}/admin/preview?${q}`, { signal: AbortSignal.timeout(45000) }); if (!r.ok) return { error: 'fb png ' + r.status };
  const buf = Buffer.from(await r.arrayBuffer()); if (buf.length < 10000) return { error: 'fb png small' };
  return { buf, caption: j.caption, label: j.label, id: j.product_id, source: j.image_source };
}
async function postStatus({ manual = false, slot, product } = {}) {
  if (!ctx || !ctx.sendStatus || !getState().leader || getState().status !== 'open') return { ok: false, error: 'pas leader / pas connecté' };
  const day = new Date(Date.now() + 3600e3).toISOString().slice(0, 10);
  try { await sb('POST', 'eh_events', { source: WHO, type: 'wa53_status_claim', line: '53', dedup_key: `st53:${day}:${slot}`, data: { manual } }, 'return=minimal'); } catch { return { ok: false, skipped: 'déjà posté (slot ' + slot + ')' }; }
  const todayN0 = (await sb('GET', `eh_events?type=eq.wa53_status&ts=gte.${day}T00:00:00%2B01:00&select=id`).catch(() => [])).length;
  const fbr = await fbImage(todayN0 === 0 && !product ? 'dig:ia-multi' : null).catch(e => ({ error: String(e.message || e) }));
  if (fbr && fbr.buf) {
    let cap = String(fbr.caption || '').replace(/\s+\n/g, '\n').slice(0, 650);
    if (!cap || BANNED.test(cap) || PRICE.test(cap)) cap = `✨ ${fbr.label} disponible chez Electronic HOUSE. Écrivez-nous ici pour en savoir plus !`;
    const out = await ctx.sendStatus(fbr.buf, cap);
    event('wa53_status', { id: fbr.id, name: fbr.label, image_source: fbr.source, caption: cap.slice(0, 300), recipients: out.n, wid: out.id, manual, slot }); await flush();
    return { ok: !!out.id, product: fbr.label, image_source: fbr.source, caption: cap, recipients: out.n, wid: out.id };
  }
  if (FB_KEY) console.error('[mesh] status fb image failed, fallback catalog', fbr && fbr.error);
  const all = (await stProducts()).filter(x => !/logo|electronic[-_ ]?house|\/eh[-_.]/i.test(x.img)); if (!all.length) return { ok: false, error: 'aucun produit avec vraie image' };
  let recent = []; try { recent = (await sb('GET', `eh_events?type=eq.wa53_status&ts=gte.${new Date(Date.now() - 3 * 864e5).toISOString()}&select=data`)).map(x => x.data && x.data.id); } catch {}
  const gem = all.filter(x => /google one|gemini/i.test(x.name));
  const todayN = (await sb('GET', `eh_events?type=eq.wa53_status&ts=gte.${day}T00:00:00%2B01:00&select=id`).catch(() => [])).length;
  let pick = product ? all.find(x => x.name.toLowerCase().includes(String(product).toLowerCase())) : null;
  if (!pick && todayN === 0 && gem.length) pick = gem[Math.floor(Math.random() * gem.length)]; // Google One Gemini first each day
  if (!pick) { const pool = all.filter(x => !recent.includes(x.id)); pick = (pool.length ? pool : all)[Math.floor(Math.random() * (pool.length || all.length))]; }
  const img = await fetch(pick.img, { signal: AbortSignal.timeout(20000) }); if (!img.ok) return { ok: false, error: 'image ' + img.status };
  const buf = Buffer.from(await img.arrayBuffer());
  let cap = await aiText(await ctx.secrets(), `Écris une légende de statut WhatsApp (1 à 2 phrases, 2 emojis max) pour ce produit d'Electronic HOUSE : « ${pick.name} ». Infos : ${String(pick.desc || '').replace(/\d[\d\s.,]*\s*(f\b|fcfa|cfa|xof|francs?)/gi, '').replace(/cotonou[^.]*\.?/gi, '').slice(0, 300)}. Termine par une invitation à écrire sur WhatsApp. Aucun prix, aucune ville.`);
  if (!cap) cap = `✨ ${pick.name} disponible chez Electronic HOUSE. Écrivez-nous ici pour en savoir plus !`;
  if (BANNED.test(cap) || PRICE.test(cap)) cap = `✨ ${pick.name} disponible chez Electronic HOUSE. Écrivez-nous ici pour en savoir plus !`;
  const out = await ctx.sendStatus(buf, cap);
  event('wa53_status', { id: pick.id, name: pick.name, caption: cap.slice(0, 300), recipients: out.n, wid: out.id, manual, slot }); await flush();
  return { ok: !!out.id, product: pick.name, caption: cap, recipients: out.n, wid: out.id };
}
async function statusTick() {
  if (stBusy || !getState().leader || getState().status !== 'open') return; stBusy = true;
  try { const st = await stSettings(); if (st.paused || !st.n) return;
    const d = new Date(Date.now() + 3600e3); const min = d.getUTCHours() * 60 + d.getUTCMinutes();
    const slots = st.n === 1 ? [Math.round((ST_FIRST + ST_LAST) / 2)] : [...Array(st.n)].map((_, i) => Math.round(ST_FIRST + i * (ST_LAST - ST_FIRST) / (st.n - 1)));
    const i = slots.findIndex(t => min >= t && min < t + 20); if (i < 0) return;
    const r = await postStatus({ slot: `${st.n}-${i}` }); if (!r.skipped) console.error('[mesh] status', JSON.stringify(r).slice(0, 200));
  } catch (e) { console.error('[mesh] status', String(e.message).slice(0, 120)); } finally { stBusy = false; }
}
// ---- WhatsApp Channel bot (V4 2026-10-13): channel « Electronic HOUSE » created once (claim eh_events dedup), 2-3 posts/day, same image logic as statuses ----
// settings: wa53_channel {jid, invite, link} (written here), wa53_channel_per_day (default 3, max 3), wa53_channel_paused. Events: wa53_channel_created / wa53_channel_post / wa53_channel_error.
let chBusy = false; const CH_SLOTS = { 1: [14 * 60], 2: [11 * 60, 18 * 60 + 30], 3: [10 * 60, 14 * 60 + 30, 19 * 60] };
async function chSettings() { try { const r = await sb('GET', 'eh_settings?key=in.(wa53_channel,wa53_channel_per_day,wa53_channel_paused)&select=key,value'); const o = Object.fromEntries((r || []).map(x => [x.key, x.value])); return { ch: o.wa53_channel || null, n: Math.max(0, Math.min(Number(o.wa53_channel_per_day ?? 3), 3)), paused: o.wa53_channel_paused === true }; } catch { return null; } }
async function ensureChannel(st) {
  if (st.ch && st.ch.jid) return st.ch;
  if (ctx.channelList) { try { const own = (await ctx.channelList()).filter(n => /electronic house/i.test(n.name || '') && /owner|admin/i.test(n.role || '')).sort((a, b) => (a.created || 0) - (b.created || 0));
    if (own.length) { const o = own[0]; const ch = { jid: o.jid, invite: o.invite || null, link: o.invite ? 'https://whatsapp.com/channel/' + o.invite : null, adopted: true, others: own.slice(1).map(x => x.jid), at: new Date().toISOString() };
      await sb('POST', 'eh_settings?on_conflict=key', { key: 'wa53_channel', value: ch, updated_by: WHO, updated_at: new Date().toISOString() }, 'resolution=merge-duplicates,return=minimal'); event('wa53_channel_adopted', { ...ch, all: own }); await flush(); return ch; } }
    catch (e) { event('wa53_channel_error', { step: 'list', error: String(e.message || e).slice(0, 200) }); await flush(); return null; } } // never create if we cannot check
  if (!ctx.channelCreate) return null;
  try { await sb('POST', 'eh_events', { source: WHO, type: 'wa53_channel_claim', line: '53', dedup_key: 'wa53_channel_create:v2', data: {} }, 'return=minimal'); } catch { return null; } // created (or being created) by an instance already
  try {
    const r = await ctx.channelCreate('Electronic HOUSE', 'Nouveautés, téléphones, logiciels et abonnements Electronic HOUSE. Écrivez-nous sur WhatsApp : wa.me/2290153632000');
    const ch = { jid: r.id, invite: r.invite || null, link: r.invite ? 'https://whatsapp.com/channel/' + r.invite : null, created_at: new Date().toISOString() };
    await sb('POST', 'eh_settings?on_conflict=key', { key: 'wa53_channel', value: ch, updated_by: WHO, updated_at: new Date().toISOString() }, 'resolution=merge-duplicates,return=minimal');
    event('wa53_channel_created', ch); await flush(); return ch;
  } catch (e) { event('wa53_channel_error', { step: 'create', error: String(e.message || e).slice(0, 200) }); await flush(); return null; }
}
async function postChannel({ manual = false, slot, product } = {}) {
  if (!ctx || !ctx.channelSend || !getState().leader || getState().status !== 'open') return { ok: false, error: 'pas leader / pas connecté' };
  const st = await chSettings(); if (!st) return { ok: false, error: 'settings' }; const ch = await ensureChannel(st); if (!ch) return { ok: false, error: 'chaîne absente' };
  const day = new Date(Date.now() + 3600e3).toISOString().slice(0, 10);
  try { await sb('POST', 'eh_events', { source: WHO, type: 'wa53_channel_claim', line: '53', dedup_key: `ch53:${day}:${slot}`, data: { manual } }, 'return=minimal'); } catch { return { ok: false, skipped: 'déjà posté (slot ' + slot + ')' }; }
  const todayN = (await sb('GET', `eh_events?type=eq.wa53_channel_post&ts=gte.${day}T00:00:00%2B01:00&select=id`).catch(() => [])).length;
  let buf, cap, id, name, src;
  const fbr = await fbImage(todayN === 0 && !product ? 'dig:ia-multi' : null).catch(e => ({ error: String(e.message || e) })); // Google One Gemini first each day
  if (fbr && fbr.buf) { buf = fbr.buf; id = fbr.id; name = fbr.label; src = fbr.source; cap = String(fbr.caption || '').replace(/\s+\n/g, '\n').slice(0, 650); }
  else {
    const all = (await stProducts()).filter(x => !/logo|electronic[-_ ]?house|\/eh[-_.]/i.test(x.img)); if (!all.length) return { ok: false, error: 'aucun produit avec vraie image' };
    let recent = []; try { recent = (await sb('GET', `eh_events?type=eq.wa53_channel_post&ts=gte.${new Date(Date.now() - 4 * 864e5).toISOString()}&select=data`)).map(x => x.data && x.data.id); } catch {}
    const gem = all.filter(x => /google one|gemini/i.test(x.name)); let pick = product ? all.find(x => x.name.toLowerCase().includes(String(product).toLowerCase())) : null;
    if (!pick && todayN === 0 && gem.length) pick = gem[Math.floor(Math.random() * gem.length)];
    if (!pick) { const pool = all.filter(x => !recent.includes(x.id)); pick = (pool.length ? pool : all)[Math.floor(Math.random() * (pool.length || all.length))]; }
    const img = await fetch(pick.img, { signal: AbortSignal.timeout(20000) }); if (!img.ok) return { ok: false, error: 'image ' + img.status };
    buf = Buffer.from(await img.arrayBuffer()); id = pick.id; name = pick.name; src = 'catalog';
    cap = await aiText(await ctx.secrets(), `Écris un court message pour la chaîne WhatsApp d'Electronic HOUSE (2 à 3 phrases, 2 emojis max) présentant : « ${pick.name} ». Infos : ${String(pick.desc || '').replace(/\d[\d\s.,]*\s*(f\b|fcfa|cfa|xof|francs?)/gi, '').replace(/cotonou[^.]*\.?/gi, '').slice(0, 300)}. Aucun prix, aucune ville.`);
  }
  if (!cap || BANNED.test(cap) || PRICE.test(cap)) cap = `✨ ${name} disponible chez Electronic HOUSE.`;
  cap = `${cap.trim()}\n\n💬 Commandez sur WhatsApp : wa.me/2290153632000`;
  try { const out = await ctx.channelSend(ch.jid, buf, cap); event('wa53_channel_post', { id, name, image_source: src, caption: cap.slice(0, 300), wid: out.id, manual, slot, channel: ch.link }); await flush(); return { ok: !!out.id, product: name, image_source: src, caption: cap, wid: out.id, channel: ch.link }; }
  catch (e) { event('wa53_channel_error', { step: 'post', slot, error: String(e.message || e).slice(0, 200) }); await flush(); return { ok: false, error: String(e.message || e) }; }
}
async function channelTick() {
  if (chBusy || !getState().leader || getState().status !== 'open') return; chBusy = true;
  try { const st = await chSettings(); if (!st || st.paused) return; if (!st.ch) { await ensureChannel(st); return; } if (!st.n) return;
    const d = new Date(Date.now() + 3600e3); const min = d.getUTCHours() * 60 + d.getUTCMinutes();
    const i = CH_SLOTS[st.n].findIndex(t => min >= t && min < t + 20); if (i < 0) return;
    const r = await postChannel({ slot: `${st.n}-${i}` }); if (!r.skipped) console.error('[mesh] channel', JSON.stringify(r).slice(0, 200));
  } catch (e) { console.error('[mesh] channel', String(e.message).slice(0, 120)); } finally { chBusy = false; }
}
export function start(o) { setInterval(statusTick, 60000).unref(); setInterval(channelTick, 60000).unref(); getState = o.getState; ctx = o; beat(); setInterval(beat, 30000).unref(); setInterval(pollCommands, 10000).unref(); }

// Peer keep-alive: ping the other Render bridge /health every 5 min (PEER_URLS, comma-separated)
const PEERS = (process.env.PEER_URLS || "").split(",").map(s => s.trim()).filter(Boolean);
async function pingPeers() { for (const u of PEERS) { try { const r = await fetch(u, { signal: AbortSignal.timeout(25000) }); console.log("[peer]", u, r.status); } catch (x) { console.log("[peer]", u, String(x)); } } }
if (PEERS.length) { setTimeout(pingPeers, 20000).unref(); setInterval(pingPeers, 5 * 60e3).unref(); }
