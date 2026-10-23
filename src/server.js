// Serveur HTTP local du pont : santé, QR, code, statut. Aucun secret,
// aucune clé d'authentification, aucun numéro complet de client n'y sort.
// Le QR servi ici est TOUJOURS l'instantané valide courant : expiré =>
// page "en attente d'un QR frais", jamais l'ancienne image. En-têtes
// anti-cache partout sur le QR, pour que le navigateur ne resserve pas
// une image périmée (l'une des causes probables du QR cassé du tableau
// de bord : image mise en cache, puis scannée après expiration).
import http from 'node:http';

export function createServer({ config, getState, getSnapshot }) {
  const server = http.createServer((req, res) => {
    const url = new URL(req.url, 'http://x');
    const noStore = { 'Cache-Control': 'no-store, no-cache, must-revalidate', Pragma: 'no-cache' };
    const json = (code, obj) => {
      res.writeHead(code, { 'Content-Type': 'application/json', ...noStore });
      res.end(JSON.stringify(obj));
    };
    if (url.pathname === '/health') {
      const s = getState();
      return json(200, { ok: true, line: config.line, instance: config.instance, status: s.status, linked: s.status === 'open', me: s.me ? 'linked' : null, last_in: s.lastIn, last_out: s.lastOut, pending_acks: s.pendingAcks });
    }
    if (url.pathname === '/status') return json(200, getState());
    if (url.pathname === '/qr.json') {
      const snap = getSnapshot();
      if (!snap) return json(200, { status: 'waiting', version: 0, expires_at: null, code: null });
      return json(200, { status: 'qr', version: snap.version, qr: snap.qrDataUrl, expires_at: new Date(snap.expiresAt).toISOString(), seconds_left: Math.max(0, Math.floor((snap.expiresAt - Date.now()) / 1000)), code: snap.code });
    }
    if (url.pathname === '/qr') {
      const snap = getSnapshot();
      const body = snap
        ? `<img src="${snap.qrDataUrl}" width="320" height="320" alt="QR"><p>Expire dans ${Math.max(0, Math.floor((snap.expiresAt - Date.now()) / 1000))} s — version ${snap.version}</p>${snap.code ? `<p>Code : <b>${snap.code}</b></p>` : ''}`
        : `<p>En attente d'un QR frais… la page se rafraîchit toute seule.</p>`;
      res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8', ...noStore });
      return res.end(`<!doctype html><meta charset="utf-8"><meta http-equiv="refresh" content="10"><title>QR ligne 53</title><h1>WhatsApp ligne 53 — appairage</h1>${body}<p>WhatsApp Business &gt; Appareils connectés &gt; Lier un appareil.</p>`);
    }
    if (url.pathname === '/qr.png') {
      const snap = getSnapshot();
      if (!snap) return json(404, { error: 'no-qr-yet' });
      const b64 = snap.qrDataUrl.split(',')[1];
      const buf = Buffer.from(b64, 'base64');
      res.writeHead(200, { 'Content-Type': 'image/png', ...noStore, 'Content-Length': buf.length });
      return res.end(buf);
    }
    return json(404, { error: 'not-found' });
  });
  return server;
}
