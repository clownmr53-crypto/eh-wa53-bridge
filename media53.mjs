// WA53 rapide: voice-note transcription, cheap image description, contact capture (wa_contacts) and given-name extraction.
import { loadSecrets, MEDIA } from './bot53.mjs';
export { MEDIA };
const SB_URL = (process.env.SUPABASE_URL || '').replace(/\/$/, ''), SB_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || '';
const T = (ms) => AbortSignal.timeout(ms);
setInterval(() => { const n = Date.now(); for (const [k, v] of MEDIA) if (n - v.at > 30 * 60e3) MEDIA.delete(k); }, 60e3).unref();
const GEMINI = ['gemini-3-flash-preview', 'gemini-3.1-flash-lite', 'gemini-2.5-flash'];
async function gemini(S, parts, ms = 9000, models = GEMINI) {
  for (const m of models) { try {
    const r = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${m}:generateContent`, { method: 'POST', headers: { 'Content-Type': 'application/json', 'x-goog-api-key': S.GEMINI_API_KEY }, body: JSON.stringify({ contents: [{ parts }] }), signal: T(ms) });
    if (!r.ok) continue; const j = await r.json(); const t = j?.candidates?.[0]?.content?.parts?.map(p => p.text || '').join('').trim(); if (t) return t;
  } catch {} } return null;
}
const WPROMPT = "Message vocal WhatsApp d'un client au Bénin, en français. Vocabulaire : téléphone, Gemini, Google One, ChatGPT, logiciel, prix, Electronic House.";
const FRISH = /\b(je|tu|il|elle|nous|vous|est|c'est|le|la|les|un|une|des|de|du|et|pour|pas|oui|non|bonjour|bonsoir|merci|prix|combien|téléphone|voudrais|veux|quoi|ça|the|is|you|i|and|what|how|price|hello|yes|no|please)\b/i;
const NONLATIN = /[ðþæøåäöÐÞÆØ\u0400-\u04FF\u0600-\u06FF\u4E00-\u9FFF\u3040-\u30FF]/;
export function sttLooksBad(t) {
  t = String(t || '').trim(); if (!t) return true;
  const words = t.split(/\s+/).filter(w => /\p{L}/u.test(w));
  if (t.replace(/[^\p{L}]/gu, '').length < 4 || words.length < 2 && !/^(oui|non|bonjour|bonsoir|merci|ok|okay|d'accord|combien|allo|allô)\W*$/i.test(t)) return true;
  if (NONLATIN.test(t)) return true;
  return false;
}
const LANGS = { fr: 'français', french: 'français', en: 'anglais', english: 'anglais', yo: 'yoruba', yoruba: 'yoruba', ha: 'haoussa', hausa: 'haoussa', fon: 'fon' };
async function groqWhisper(S, buf, base, model) { // no forced language; verbose_json for detected language + confidence
  const fd = new FormData(); fd.append('file', new Blob([buf], { type: base }), 'voice.ogg'); fd.append('model', model);
  fd.append('response_format', 'verbose_json'); fd.append('temperature', '0'); fd.append('prompt', WPROMPT);
  const r = await fetch('https://api.groq.com/openai/v1/audio/transcriptions', { method: 'POST', headers: { Authorization: 'Bearer ' + S.GROQ_API_KEY }, body: fd, signal: T(8000) });
  if (!r.ok) throw new Error('groq ' + r.status); const j = await r.json(); const seg = j.segments || [];
  const avg = (k) => seg.length ? seg.reduce((a, x) => a + (x[k] || 0), 0) / seg.length : null;
  return { text: String(j.text || '').trim(), lang: String(j.language || '').toLowerCase(), logprob: avg('avg_logprob'), nospeech: avg('no_speech_prob') };
}
const GPROMPT = 'Message vocal WhatsApp d\'un client d\'Electronic House, boutique de téléphones et d\'abonnements (Gemini, Google One, ChatGPT, logiciels) au Bénin. Le locuteur est béninois : il peut parler français, anglais, fon, yoruba, haoussa ou un mélange. Détecte la langue principale et transcris fidèlement dans cette langue. Réponds UNIQUEMENT en JSON : {"lang":"fr|en|fon|yo|ha|autre","text":"transcription","fr":"traduction française (vide si déjà en français)"}. Si l\'audio est vide ou inaudible : {"lang":"","text":"","fr":""}';
export async function transcribe(buf, mime = 'audio/ogg') {
  const S = await loadSecrets(); const base = String(mime).split(';')[0]; let w = null, via = 'none';
  if (S.GROQ_API_KEY) for (const model of ['whisper-large-v3', 'whisper-large-v3-turbo']) { // 1) Groq Whisper, auto language
    try { w = await groqWhisper(S, buf, base, model); via = 'groq-' + model; break; } catch {}
  }
  const plausible = w && ['fr', 'french', 'en', 'english', 'yo', 'yoruba', 'ha', 'hausa'].includes(w.lang);
  const confident = w && (w.logprob == null || w.logprob > -0.8) && (w.nospeech == null || w.nospeech < 0.5);
  if (w && plausible && confident && !sttLooksBad(w.text)) return { text: w.text, lang: LANGS[w.lang], via };
  if (S.GEMINI_API_KEY) { // 2) Gemini audio detects language itself (incl. Fon)
    const t = await gemini(S, [{ text: GPROMPT }, { inline_data: { mime_type: base, data: Buffer.from(buf).toString('base64') } }], 6000, ['gemini-2.5-flash', 'gemini-3-flash-preview']);
    try { const j = JSON.parse(String(t).replace(/^```(json)?|```$/g, '').trim()); const tx = String(j.text || '').trim();
      if (tx.replace(/[^\p{L}]/gu, '').length >= 2) return { text: tx, fr: String(j.fr || '').trim() || null, lang: LANGS[String(j.lang).toLowerCase()] || String(j.lang || 'inconnue'), via: 'gemini' };
    } catch {}
  }
  return { text: '', via: via + '+unclear', unclear: true, wlang: w?.lang || null };
}
// Never let the bot claim it cannot listen to audio (any language).
const CANT_LISTEN = /[^.!?\n]*\b(je ne (peux|suis) pas (en mesure d'|capable d')?(écouter|ecouter|lire|ouvrir|entendre)|(ne|n') ?(peux|arrive) pas (à )?(écouter|ecouter|entendre)|impossible d'(écouter|ecouter)|je n'ai pas (accès|la possibilité) (aux|d'écouter les) (vocaux|audios?|messages vocaux)|(can ?not|can't|unable to) (listen|play|hear))[^.!?\n]*[.!?]?\s*/gi;
export function scrubCantListen(t) {
  if (!t || !CANT_LISTEN.test(t)) return t; CANT_LISTEN.lastIndex = 0;
  let o = t.replace(CANT_LISTEN, '').trim();
  return o.length >= 3 ? o : "Pardon, je n'ai pas bien saisi votre vocal 🙏 Vous pouvez me le redire autrement ou l'écrire ?";
}
const VPROMPT = "Décris brièvement (1 à 2 phrases, en français) ce que montre cette photo envoyée par un client à une boutique de téléphones/abonnements au Bénin. Si c'est une capture de paiement Mobile Money, donne le montant, le nom/numéro bénéficiaire et la référence lisibles. Si c'est un téléphone ou une capture d'écran de produit, dis lequel. Pas de commentaire.";
export async function describeImage(buf, mime = 'image/jpeg') {
  const S = await loadSecrets(); const b64 = Buffer.from(buf).toString('base64'); const base = String(mime).split(';')[0];
  if (S.GROQ_API_KEY) { try {
    const r = await fetch('https://api.groq.com/openai/v1/chat/completions', { method: 'POST', headers: { Authorization: 'Bearer ' + S.GROQ_API_KEY, 'Content-Type': 'application/json' }, body: JSON.stringify({ model: 'meta-llama/llama-4-scout-17b-16e-instruct', max_tokens: 160, temperature: 0.2, messages: [{ role: 'user', content: [{ type: 'text', text: VPROMPT }, { type: 'image_url', image_url: { url: `data:${base};base64,${b64}` } }] }] }), signal: T(8000) });
    if (r.ok) { const t = (await r.json())?.choices?.[0]?.message?.content?.trim(); if (t) return { text: t, via: 'groq-vision' }; }
  } catch {} }
  if (S.GEMINI_API_KEY) { const t = await gemini(S, [{ text: VPROMPT }, { inline_data: { mime_type: base, data: b64 } }], 8000, ['gemini-3.1-flash-lite', 'gemini-2.5-flash-lite', 'gemini-3-flash-preview']); if (t) return { text: t, via: 'gemini' }; }
  return null;
}
// contacts: every writer upserted in wa_contacts (line 53); given_name when the client introduces himself
const INTRO = /\b(je m'?appelle|je m’appelle|mon (pré)?nom (est|c'?est)|moi c'?est|c'?est (monsieur|madame|mr|mme|m\.)?\s*[A-ZÀ-Ý]|ici [A-ZÀ-Ý]|my name is|i am [A-Z])/i;
async function extractGivenName(text) {
  if (!INTRO.test(text)) return null;
  const S = await loadSecrets(); if (!S.GROQ_API_KEY) return null;
  try {
    const r = await fetch('https://api.groq.com/openai/v1/chat/completions', { method: 'POST', headers: { Authorization: 'Bearer ' + S.GROQ_API_KEY, 'Content-Type': 'application/json' }, body: JSON.stringify({ model: 'openai/gpt-oss-20b', temperature: 0, max_tokens: 200, response_format: { type: 'json_object' }, messages: [{ role: 'system', content: 'Extrait le nom par lequel le client se présente lui-même dans son message WhatsApp (ex. "je m\'appelle Koffi", "c\'est Mme Adjovi"). Réponds en JSON {"name": "<Prénom Nom tel qu\'écrit, avec civilité si donnée>"} ou {"name": null} si le client ne se présente pas (un nom de produit, de vendeur ou d\'une autre personne ne compte pas).' }, { role: 'user', content: String(text).slice(0, 400) }] }), signal: T(8000) });
    const j = await r.json(); const n = JSON.parse(j?.choices?.[0]?.message?.content || '{}').name;
    return n && String(n).trim().length >= 2 && String(n).length <= 60 ? String(n).trim() : null;
  } catch { return null; }
}
export async function touchContact(phone, pushName, text) {
  const given = text ? await extractGivenName(text) : null;
  const r = await fetch(SB_URL + '/rest/v1/rpc/wa_contact_touch', { method: 'POST', headers: { apikey: SB_KEY, Authorization: 'Bearer ' + SB_KEY, 'Content-Type': 'application/json' }, body: JSON.stringify({ p_phone: phone, p_name: pushName || null, p_line: '53', p_given: given }), signal: T(10000) });
  if (!r.ok) throw new Error('wa_contact_touch ' + r.status);
  return { given };
}
