// Publication d'AFFICHAGE uniquement, pour le tableau de bord.
// Ce canal ne transporte JAMAIS d'authentification : seulement l'instantané
// QR/code courant (version, dates, image), pour que le centre de contrôle
// affiche le même QR que le chat, frais et lisible.
// Ancien défaut corrigé : l'ancien pont ne republicait qu'aux événements
// QR, donc la ligne du tableau de bord restait figée (QR expiré affiché
// comme valide, ou QR null après 55 s). Ici, en état "qr", on republicate
// toutes les 5 s le MÊME instantané, avec sa date d'expiration réelle :
// le tableau de bord peut donc afficher un compte à rebours et refuser
// d'afficher un QR expiré, au lieu de montrer une vieille image.
// Sans clé anonyme configurée, la publication est désactivée (pas d'erreur).
export class DisplayPublisher {
  constructor(config, getSnapshot) {
    this.config = config;
    this.getSnapshot = getSnapshot;
    this.timer = null;
  }

  async publishOnce(status) {
    if (!this.config.supabaseUrl || !this.config.supabaseAnonKey) return { published: false, reason: 'no-display-config' };
    const snap = this.getSnapshot();
    const body = {
      instance: this.config.instance,
      line: this.config.line,
      status,
      qr: snap ? snap.qrDataUrl : null,
      qr_at: snap ? snap.generatedAt : 0,
      expires_at: snap ? new Date(snap.expiresAt).toISOString() : null,
      version: snap ? snap.version : 0,
      code: snap ? snap.code : null,
      code_expires_at: snap ? new Date(snap.expiresAt).toISOString() : null,
      at: Date.now(),
    };
    const r = await fetch(`${this.config.supabaseUrl}/rest/v1/kv53?on_conflict=key`, {
      method: 'POST',
      signal: AbortSignal.timeout(8000),
      headers: {
        apikey: this.config.supabaseAnonKey,
        Authorization: `Bearer ${this.config.supabaseAnonKey}`,
        'Content-Type': 'application/json',
        Prefer: 'resolution=merge-duplicates,return=minimal',
      },
      body: JSON.stringify({ key: 'wa53:qr', value: JSON.stringify(body) }),
    });
    if (!r.ok) throw new Error(`display publish ${r.status}`);
    return { published: true, version: body.version };
  }

  start(getStatus) {
    if (this.timer) return;
    this.timer = setInterval(() => {
      if (getStatus() === 'qr') this.publishOnce('qr').catch(() => {});
    }, 5000);
    this.timer.unref?.();
  }

  stop() {
    if (this.timer) clearInterval(this.timer);
    this.timer = null;
  }
}
