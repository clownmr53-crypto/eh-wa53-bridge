// HORYON BRAIN - un seul correctif, meme systeme sur toutes les plateformes
// (Render, VPS, etc. : ce fichier remplace alwaysreply53.mjs tel quel, sans adaptation)
// Principe confirme par Horeb 2026-11-04 :
//  - Horyon = le cerveau unique qui discute avec le client, toute la boutique.
//  - Les IA (Gemini, Groq, Llama, Mistral...) = des outils interchangeables,
//    essayes dans l'ordre avec LE MEME historique, la MEME memoire.
//  - Si une IA tombe, la suivante reprend avec la meme memoire : produit, prix,
//    etape, historique complet client + Horyon. Le client ne voit jamais le changement.
//  - Jamais de phrase figee, jamais de salut a nouveau en pleine conversation,
//    jamais de prix invente : si le prix catalogue est fourni, le donner quand le
//    client dit oui ; sinon poser UNE question simple, en continuant la discussion.
//  - Vitesse : un seul appel rapide par IA, 5 s max chacune, Gemini en premier.
const SYS_BASE = `Tu es Horyon, le cerveau unique d'Electronic HOUSE, toute la boutique qui discute avec le client sur WhatsApp.
Tu parles avec une seule voix, naturelle, chaleureuse, en 1 a 2 phrases courtes, dans la langue du client (francais par defaut).
Tu gardes en memoire tout l'historique ci-dessous : produit discute, prix, etape, questions deja posees.
Regles :
- Ne recommence JAMAIS par un salut si la conversation a deja commence.
- Si le client repond par "1", "2", "oui" ou un mot court, interprete-le contre la DERNIERE question que tu as posee, ne redemande pas depuis zero.
- Si un prix catalogue est indique dans le contexte, donne-le avec tes mots quand le client dit oui au prix, au tarif ou au montant, sans redemander s'il veut le tarif.
- Si aucun prix catalogue n'est indique, n'invente JAMAIS de prix, de stock ou de delai : pose UNE question simple pour preciser le produit.
- Pas de liste, pas de signature, pas de lien. Ne dis jamais que tu es un robot ou une IA, tu es Horyon, la boutique.`;
const T = (ms) => AbortSignal.timeout(ms);
async function oai(url, key, model, msgs) {
  const r = await fetch(url, { method: 'POST', signal: T(5000), headers: { 'Content-Type': 'application/json', Authorization: 'Bearer ' + key }, body: JSON.stringify({ model, messages: msgs, max_tokens: 200, temperature: 0.7 }) });
  const j = await r.json().catch(() => ({})); if (!r.ok) throw new Error(model + ' ' + r.status);
  return j?.choices?.[0]?.message?.content || '';
}
async function gemini(key, model, msgs) {
  // Gemini recoit tout l'historique, pas seulement le dernier message
  const contents = msgs.filter(m => m.role !== 'system').map(m => ({ role: m.role === 'assistant' ? 'model' : 'user', parts: [{ text: m.content }] }));
  const sys = msgs.find(m => m.role === 'system')?.content || SYS_BASE;
  const r = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${key}`, { method: 'POST', signal: T(5000), headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ systemInstruction: { parts: [{ text: sys }] }, contents, generationConfig: { maxOutputTokens: 250, temperature: 0.7, thinkingConfig: { thinkingBudget: 0 } } }) });
  const j = await r.json().catch(() => ({})); if (!r.ok) throw new Error(model + ' ' + r.status);
  return (j?.candidates?.[0]?.content?.parts || []).map(p => p.text || '').join('');
}
async function cfai(acct, tok, model, msgs) {
  const r = await fetch(`https://api.cloudflare.com/client/v4/accounts/${acct}/ai/run/${model}`, { method: 'POST', signal: T(5000), headers: { 'Content-Type': 'application/json', Authorization: 'Bearer ' + tok }, body: JSON.stringify({ messages: msgs, max_tokens: 200 }) });
  const j = await r.json().catch(() => ({})); if (!r.ok) throw new Error(model + ' ' + r.status);
  return j?.result?.response || '';
}
function clean(t) {
  t = String(t || '').replace(/<think>[\s\S]*?<\/think>/g, '').replace(/^["«\s]+|["»\s]+$/g, '').trim();
  if (!t || t.length > 600 || /\b(as an ai|en tant qu'(ia|assistant)|je suis une ia|language model)\b/i.test(t)) return '';
  return t;
}
export function providers(S) {
  const p = []; const gk = [S.GEMINI_API_KEY, ...String(process.env.FALLBACK_GEMINI_KEYS || '').split(',')].map(s => (s || '').trim()).filter(Boolean);
  // Gemini en premier, rapide, puis les autres avec la MEME memoire si Gemini tombe
  gk.forEach((k, i) => p.push(['gemini-lite' + i, m => gemini(k, 'gemini-3.1-flash-lite', m)]));
  if (S.GROQ_API_KEY) p.push(['groq-gptoss20b', m => oai('https://api.groq.com/openai/v1/chat/completions', S.GROQ_API_KEY, 'openai/gpt-oss-20b', m)]);
  if (S.CF_AI_TOKEN && (S.CF_AI_ACCOUNT || S.CF_AI_ACCOUNT_ID)) p.push(['cf-llama8b-fast', m => cfai(S.CF_AI_ACCOUNT || S.CF_AI_ACCOUNT_ID, S.CF_AI_TOKEN, '@cf/meta/llama-3.1-8b-instruct-fast', m)]);
  if (S.MISTRAL_API_KEY) p.push(['mistral-small', m => oai('https://api.mistral.ai/v1/chat/completions', S.MISTRAL_API_KEY, 'mistral-small-latest', m)]);
  if (S.OPENROUTER_API_KEY) p.push(['openrouter-free', m => oai('https://openrouter.ai/api/v1/chat/completions', S.OPENROUTER_API_KEY, 'google/gemma-4-31b-it:free', m)]);
  return p;
}
// history: [{role:'client'|'horyon', text}] - historique complet, pas seulement les textes client
// texts: ancien format (textes client seuls) - conserve pour compatibilite
// product: {label, price} optionnel, prix catalogue si connu
export async function fallbackReply(S, { texts, history, name, product, skip = [] }) {
  const turns = (history && history.length ? history : (texts || []).map(t => ({ role: 'client', text: String(t) }))).slice(-12);
  let sys = SYS_BASE;
  if (name) sys += `\nClient : ${name}.`;
  if (product?.label) sys += `\nProduit en cours : ${product.label}${product.price ? `, prix catalogue environ ${product.price} FCFA.` : ''}`;
  const msgs = [{ role: 'system', content: sys }, ...turns.map(t => ({ role: t.role === 'horyon' ? 'assistant' : 'user', content: String(t.text || '').slice(0, 400) }))];
  const errs = [];
  for (const [n, f] of providers(S)) {
    if (skip.includes(n)) continue;
    try { const t = clean(await f(msgs)); if (t) return { text: t, via: n, errs }; errs.push(n + ':empty'); } catch (e) { errs.push(String(e.message || e).slice(0, 60)); }
  }
  // Dernier recours sans IA : continuer la discussion, jamais repartir a zero, jamais de salut si deja en cours
  const last = String((turns[turns.length - 1] || {}).text || '');
  const started = turns.length > 1;
  return { text: started ? `Bien recu pour "${last.slice(0, 60)}", je vous confirme ca tout de suite.` : `Bonjour, bien recu, je vous reponds tout de suite.`, via: 'ack', errs };
}
