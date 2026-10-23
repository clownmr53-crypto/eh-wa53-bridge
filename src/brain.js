// Cerveau de réponse : MÊME LOGIQUE que la ligne 59, NOUVELLE CONNEXION
// pour la ligne 53. Précision qui compte, et qui est respectée ici :
// - On ne copie PAS le bot du 59 tel quel : la ligne 59 marche parce que
//   Meta l'accepte officiellement (API Cloud, WABA vérifié). La ligne 53
//   est dans l'application WhatsApp Business du téléphone, NON vérifiée
//   sur l'API Cloud : Meta refuserait les envois si on branchait le 53
//   sur l'API Cloud du 59. On ne déplace donc PAS le 53 vers l'API Cloud,
//   on ne touche PAS au 59, on ne copie AUCUN identifiant Cloud du 59.
// - On garde le même cerveau : accueil en français au premier message,
//   puis langue du client, réponses naturelles, jamais de prix inventé,
//   jamais de promesse de livraison ou de paiement sans validation humaine.
// - La connexion, elle, est neuve : c'est ce pont-ci, sur le VPS, qui
//   porte l'identité 53 (son propre appairage, sa propre mémoire).
// Les cas à validation humaine ne reçoivent qu'un accusé de réception :
// paiement, problème signalé par un client, message incompris.
import { detectLang } from './memory53.js';

const HUMAN_CASES = /(paiement|payé|payer|remboursement|problème|probleme|plainte|ne marche pas|ne fonctionne pas|arnaque|payment|refund|issue|problem)/i;

export function needsHuman(text) {
  return HUMAN_CASES.test(text || '');
}

export async function brainReply({ text, phone, memory, config }) {
  const prev = memory.read(phone);
  const lang = detectLang(text, prev.lang);
  memory.setLang(phone, lang);
  memory.append(phone, 'client', text);

  if (needsHuman(text)) {
    const ack = lang === 'en'
      ? 'Thank you, I have noted your message. Our team will get back to you personally on this point.'
      : 'Merci, votre message est bien noté. Notre équipe vous répondra personnellement sur ce point.';
    memory.append(phone, 'assistant', ack);
    return { text: ack, human: true };
  }

  // Chaîne IA, même ordre que la ligne 59 : Groq d'abord, Gemini ensuite.
  // Sans clé, pas de réponse inventée : accusé + renvoi vers un humain.
  const prompt = lang === 'en'
    ? `You are Electronic HOUSE customer support on WhatsApp (line 53). Answer briefly, warmly, in English, in 2-4 sentences. Never invent a price, never promise a delivery or a payment. If you do not know, say so and offer human help. Customer: ${text}`
    : `Tu es le service client Electronic HOUSE sur WhatsApp (ligne 53). Réponds brièvement, chaleureusement, en français, en 2 à 4 phrases. N'invente jamais un prix, ne promets jamais une livraison ni un paiement. Si tu ne sais pas, dis-le et propose l'aide d'un humain. Client : ${text}`;

  let reply = null;
  if (config.groqKey) {
    try {
      const r = await fetch('https://api.groq.com/openai/v1/chat/completions', {
        method: 'POST',
        signal: AbortSignal.timeout(15000),
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${config.groqKey}` },
        body: JSON.stringify({ model: 'openai/gpt-oss-120b', messages: [{ role: 'user', content: prompt }], max_tokens: 300, temperature: 0.7 }),
      });
      const j = await r.json();
      reply = j?.choices?.[0]?.message?.content?.trim() || null;
    } catch { reply = null; }
  }
  if (!reply && config.geminiKey) {
    try {
      const r = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${config.geminiKey}`, {
        method: 'POST',
        signal: AbortSignal.timeout(15000),
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ contents: [{ role: 'user', parts: [{ text: prompt }] }], generationConfig: { maxOutputTokens: 300, temperature: 0.7 } }),
      });
      const j = await r.json();
      reply = (j?.candidates?.[0]?.content?.parts || []).map((p) => p.text || '').join('').trim() || null;
    } catch { reply = null; }
  }
  if (!reply) {
    reply = lang === 'en'
      ? 'Hello, thank you for your message. I will get back to you shortly.'
      : 'Bonjour, merci pour votre message. Je vous réponds très vite.';
  }
  // Garde-fou prix : on ne laisse jamais passer un prix généré par l'IA
  // sans source. Ici, par construction, le cerveau ne connaît aucun prix :
  // tout montant chiffré sortant est remplacé par une demande de précision.
  if (/\d[\d\s.,]*\s*(fcfa|cfa|xof|€|\$)/i.test(reply)) {
    reply = lang === 'en'
      ? 'Thank you for your message. For the exact price, I will confirm it with the team and get back to you.'
      : 'Merci pour votre message. Pour le prix exact, je le confirme avec l’équipe et je vous réponds.';
  }
  memory.append(phone, 'assistant', reply);
  return { text: reply, human: false };
}
