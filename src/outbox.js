// File d'envoi avec preuve d'accusé. Ancien défaut corrigé : un envoi
// était compté comme réussi dès l'appel, alors que WhatsApp ne l'avait
// jamais accusé (zéro accusé wa53_ack jamais journalisé). Ici :
// - "sent" = appel émis, pas encore délivré.
// - "delivered" = accusé WhatsApp reçu (événement de reçu), seulement là.
// - Sans accusé sous 30 s : une seule relance, puis "failed", journalisé.
// Un message n'est jamais déclaré délivré sans accusé.
import fs from 'node:fs';

export class Outbox {
  constructor(ackFile) {
    this.ackFile = ackFile;
    this.pending = new Map(); // keyId -> { to, text, sentAt, tries }
  }

  recordSent(keyId, to, text) {
    this.pending.set(keyId, { to, text: String(text).slice(0, 200), sentAt: Date.now(), tries: 1 });
  }

  markAck(keyId) {
    const p = this.pending.get(keyId);
    if (!p) return false;
    this.pending.delete(keyId);
    fs.appendFileSync(this.ackFile, JSON.stringify({ at: new Date().toISOString(), keyId, to: p.to, delivered: true }) + '\n');
    return true;
  }

  // Messages sans accusé depuis plus de 30 s : à relancer une fois, sinon échec.
  overdue(now = Date.now()) {
    return [...this.pending.entries()]
      .filter(([, p]) => now - p.sentAt > 30_000)
      .map(([keyId, p]) => ({ keyId, ...p }));
  }

  markFailed(keyId) {
    const p = this.pending.get(keyId);
    if (!p) return;
    this.pending.delete(keyId);
    fs.appendFileSync(this.ackFile, JSON.stringify({ at: new Date().toISOString(), keyId, to: p.to, delivered: false, reason: 'no-ack-30s' }) + '\n');
  }
}
