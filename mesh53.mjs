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
export function start(o) { getState = o.getState; ctx = o; beat(); setInterval(beat, 30000).unref(); setInterval(pollCommands, 10000).unref(); }
