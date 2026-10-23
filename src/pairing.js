// Instantané d'appairage (QR + code) : figé pendant sa durée de vie.
// Ancien défaut corrigé ici : le code changeait après livraison parce
// qu'un nouvel événement QR ou une republication le remplaçait sans
// prévenir. Ici, un instantané ne change jamais : il expire, puis il est
// remplacé en une fois par un nouvel instantané numéroté (version+1).
// Le tableau de bord et le chat lisent TOUJOURS le même instantané.
import QRCode from 'qrcode';

export class PairingSnapshot {
  constructor(ttlMs) {
    this.ttlMs = ttlMs;
    this.version = 0;
    this.current = null; // { version, qrDataUrl, qrPng, code, generatedAt, expiresAt }
  }

  async replace(qrString, code) {
    const qrDataUrl = await QRCode.toDataURL(qrString, { width: 512, margin: 2 });
    const now = Date.now();
    this.version += 1;
    this.current = {
      version: this.version,
      qrDataUrl,
      qrString,
      code: code || null,
      generatedAt: now,
      expiresAt: now + this.ttlMs,
    };
    return this.current;
  }

  // Renvoie l'instantané seulement s'il est encore valide.
  // Expiré => null, jamais l'ancien QR : afficher un QR expiré, c'est
  // garantir un scan qui échoue en disant "impossible".
  getValid() {
    if (!this.current) return null;
    if (Date.now() >= this.current.expiresAt) return null;
    return this.current;
  }

  clear() {
    this.current = null;
  }
}
