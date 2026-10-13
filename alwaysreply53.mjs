// WA53 always-reply fallback (2026-10-13): mini AI cascade independent of core53, then a varied neutral acknowledgement.
// Keys come from runtime_secrets wa53 (same as core53) + optional env FALLBACK_GEMINI_KEYS (comma list).
const SYS = `Tu es le vendeur WhatsApp d'Electronic HOUSE (vente en ligne, boutique ouverte 24/24) : téléphones neufs et venus, abonnements (Google One Gemini Pro, ChatGPT, Netflix, IPTV, Office, antivirus…), logiciels et accessoires tech.
Réponds au DERNIER message du client en 1 à 2 phrases courtes, naturelles, chaleureuses, dans la langue du client (français par défaut).
N'invente JAMAIS de prix, de stock, de délai, d'adresse ou de ville. Si tu as besoin d'une info, pose UNE question simple (quel modèle, quel abonnement, pour combien de temps…).
Pas de liste, pas de signature, pas de lien. Ne dis jamais que tu es un robot ou une IA.`;
const T = (ms) => AbortSignal.timeout(ms);
async function oai(url, key, model, msgs, extraH = {}) {
  const r = await fetch(url, { method: 'POST', signal: T(9000), headers: { 'Content-Type': 'application/json', Authorization: 'Bearer ' + key, ...extraH }, body: JSON.stringify({ model, messages: msgs, max_tokens: 160, temperature: 0.7 }) });
  const j = await r.json().catch(() => ({})); if (!r.ok) throw new Error(model + ' ' + r.status);
  return j?.choices?.[0]?.message?.content || '';
}
async function gemini(key, model, msgs) {
  const r = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${key}`, { method: 'POST', signal: T(9000), headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ systemInstruction: { parts: [{ text: msgs[0].content }] }, contents: [{ role: 'user', parts: [{ text: msgs[1].content }] }], generationConfig: { maxOutputTokens: 200, temperature: 0.7, thinkingConfig: { thinkingBudget: 0 } } }) });
  const j = await r.json().catch(() => ({})); if (!r.ok) throw new Error(model + ' ' + r.status);
  return (j?.candidates?.[0]?.content?.parts || []).map(p => p.text || '').join('');
}
async function cfai(acct, tok, model, msgs) {
  const r = await fetch(`https://api.cloudflare.com/client/v4/accounts/${acct}/ai/run/${model}`, { method: 'POST', signal: T(9000), headers: { 'Content-Type': 'application/json', Authorization: 'Bearer ' + tok }, body: JSON.stringify({ messages: msgs, max_tokens: 160 }) });
  const j = await r.json().catch(() => ({})); if (!r.ok) throw new Error(model + ' ' + r.status);
  return j?.result?.response || '';
}
function clean(t) {
  t = String(t || '').replace(/<think>[\s\S]*?<\/think>/g, '').replace(/^["«\s]+|["»\s]+$/g, '').replace(/\*\*/g, '*').trim();
  if (!t || t.length > 600 || /\b(as an ai|en tant qu'(ia|assistant)|je suis une ia|language model)\b/i.test(t)) return '';
  return t;
}
export function providers(S) {
  const p = []; const gk = [S.GEMINI_API_KEY, ...String(process.env.FALLBACK_GEMINI_KEYS || '').split(',')].map(s => (s || '').trim()).filter(Boolean);
  if (S.GROQ_API_KEY) p.push(['groq-gptoss20b', m => oai('https://api.groq.com/openai/v1/chat/completions', S.GROQ_API_KEY, 'openai/gpt-oss-20b', m)]);
  gk.forEach((k, i) => p.push(['gemini-lite' + i, m => gemini(k, 'gemini-3.1-flash-lite', m)]));
  if (S.CF_AI_TOKEN && (S.CF_AI_ACCOUNT || S.CF_AI_ACCOUNT_ID)) p.push(['cf-llama8b-fast', m => cfai(S.CF_AI_ACCOUNT || S.CF_AI_ACCOUNT_ID, S.CF_AI_TOKEN, '@cf/meta/llama-3.1-8b-instruct-fast', m)]);
  if (S.MISTRAL_API_KEY) p.push(['mistral-small', m => oai('https://api.mistral.ai/v1/chat/completions', S.MISTRAL_API_KEY, 'mistral-small-latest', m)]);
  if (S.OPENROUTER_API_KEY) p.push(['openrouter-free', m => oai('https://openrouter.ai/api/v1/chat/completions', S.OPENROUTER_API_KEY, 'google/gemma-4-31b-it:free', m)]);
  if (S.CF_AI_TOKEN && (S.CF_AI_ACCOUNT || S.CF_AI_ACCOUNT_ID)) p.push(['cf-llama1b', m => cfai(S.CF_AI_ACCOUNT || S.CF_AI_ACCOUNT_ID, S.CF_AI_TOKEN, '@cf/meta/llama-3.2-1b-instruct', m)]);
  return p;
}
// texts: recent client messages (oldest first); name: push name or null
export async function fallbackReply(S, { texts, name, skip = [] }) {
  const user = (name ? `Client : ${name}\n` : '') + 'Messages récents du client (du plus ancien au plus récent) :\n' + texts.slice(-6).map(t => '- ' + String(t).slice(0, 300)).join('\n') + '\n\nÉcris ta réponse au client.';
  const msgs = [{ role: 'system', content: SYS }, { role: 'user', content: user }];
  const errs = [];
  for (const [n, f] of providers(S)) {
    if (skip.includes(n)) continue;
    try { const t = clean(await f(msgs)); if (t) return { text: t, via: n, errs }; errs.push(n + ':empty'); } catch (e) { errs.push(String(e.message || e).slice(0, 60)); }
  }
  return { text: ackText(texts, name), via: 'ack', errs };
}
// AI-free last resort: neutral, varied, lightly contextual (never a fixed canned line)
export function ackText(texts, name) {
  const last = String(texts[texts.length - 1] || ''); const all = texts.join(' ');
  const r = (a) => a[Math.floor(Math.random() * a.length)];
  const first = name && /^[\p{L}][\p{L}' -]{1,20}$/u.test(String(name).trim()) ? ' ' + String(name).trim().split(/\s+/)[0] : '';
  const hi = /^(bonjour|bonsoir|salut|cc|coucou|hello|hi|bjr|bsr|slt)\b/i.test(last.replace(/^\[vocal\]\s*/, '')) ? r(['Bonjour', 'Bonjour à vous', 'Bonsoir']) .replace('Bonsoir', new Date().getHours() >= 18 ? 'Bonsoir' : 'Bonjour') + first + ' 😊 ' : '';
  const what = /vocal/.test(all) ? r(['Votre vocal est bien reçu', "J'ai bien reçu votre vocal", 'Message vocal bien reçu'])
    : /photo|image/i.test(all) ? r(['Votre photo est bien reçue', "J'ai bien reçu votre image"])
    : /prix|combien|co[uû]t|tarif/i.test(all) ? r(['Je regarde le prix exact pour vous', 'Je vérifie le tarif à jour'])
    : r(['Bien reçu', 'Message bien reçu', "C'est noté", 'Je prends note']);
  const tail = r([', un conseiller vous répond dans un instant.', ', je reviens vers vous très vite.', ', on vous répond tout de suite.', ', un collègue vous répond dans quelques minutes.']);
  const body = hi ? what : (first ? first.trim() + ', ' + what.charAt(0).toLowerCase() + what.slice(1) : what);
  return (hi + body + tail).replace(/\s+,/, ',');
}
