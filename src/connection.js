// Machine à états de connexion, une seule instance, sans boucle.
// États : starting -> qr -> open -> closed:<code> -> degraded.
// Règles, chacune écrite pour un défaut prouvé de l'ancien système :
// - 401 (loggedOut) : les clés sont invalides. On les met en quarantaine
//   locale, on repasse en "qr", on attend un humain. On ne retente JAMAIS
//   avec les mêmes clés, on ne restaure rien depuis ailleurs.
// - 428 / 503 / 515 (transitoire) : 3 tentatives maximum, délais croissants
//   (2 s, 5 s, 15 s), puis état "degraded" lisible sur /health. Pas de
//   redémarrage de processus, pas de watchdog qui tue et relance en boucle.
// - Un QR expiré n'est jamais resservi : l'instantané expiré vaut null.
// - Le code d'appairage est demandé UNE fois par événement QR, stocké dans
//   l'instantané, et ne change plus jusqu'à expiration de l'instantané.
import { Boom } from '@hapi/boom';
import { DisconnectReason, fetchLatestBaileysVersion, makeWASocket, makeCacheableSignalKeyStore } from 'baileys';
import pino from 'pino';

export class Connection {
  constructor({ config, auth, pairing, onOpen, onQr, onClose, onInbound, onAck }) {
    this.config = config;
    this.auth = auth; // { state, saveCreds }
    this.pairing = pairing;
    this.onOpen = onOpen;
    this.onQr = onQr;
    this.onClose = onClose;
    this.onInbound = onInbound;
    this.onAck = onAck;
    this.status = 'starting';
    this.sock = null;
    this.me = null;
    this.transientTries = 0;
    this.stopped = false;
  }

  async start() {
    if (this.stopped || this.sock) return;
    let version;
    try { ({ version } = await fetchLatestBaileysVersion()); } catch { version = undefined; }
    const sock = makeWASocket({
      ...(version ? { version } : {}),
      auth: this.auth.state,
      logger: pino({ level: 'silent' }),
      printQRInTerminal: false,
      syncFullHistory: false,
      markOnlineOnConnect: false,
      generateHighQualityLinkPreview: false,
    });
    this.sock = sock;
    sock.ev.on('creds.update', this.auth.saveCreds);
    sock.ev.on('connection.update', async (u) => {
      if (this.sock !== sock) return;
      if (u.qr) {
        let code = null;
        if (this.config.pairPhone && !this.auth.state.creds.registered) {
          try { code = await sock.requestPairingCode(this.config.pairPhone); } catch { code = null; }
        }
        const snap = await this.pairing.replace(u.qr, code);
        this.status = 'qr';
        this.onQr?.(snap);
      }
      if (u.connection === 'open') {
        this.status = 'open';
        this.me = sock.user;
        this.transientTries = 0;
        this.pairing.clear();
        this.onOpen?.(sock.user);
      }
      if (u.connection === 'close') {
        const code = u.lastDisconnect?.error instanceof Boom ? u.lastDisconnect.error.output?.statusCode : 0;
        this.status = `closed:${code}`;
        this.sock = null;
        this.onClose?.(code);
        if (this.stopped) return;
        if (code === DisconnectReason.loggedOut) {
          // 401 : clés invalides, on ne boucle pas, on attend un humain.
          this.status = 'qr';
          return;
        }
        if (this.transientTries < this.config.maxTransientReconnects) {
          const delay = this.config.reconnectDelaysMs[this.transientTries] || 15000;
          this.transientTries += 1;
          setTimeout(() => this.start().catch(() => {}), delay);
        } else {
          this.status = 'degraded';
        }
      }
    });
    sock.ev.on('messages.upsert', async ({ messages, type }) => {
      if (type !== 'notify') return;
      for (const m of messages) {
        if (m.key?.fromMe) continue;
        if (!m.message) continue;
        await this.onInbound?.(m);
      }
    });
    // Accusés WhatsApp : seule preuve de livraison acceptée (voir outbox.js).
    sock.ev.on('messages.update', (updates) => {
      for (const u of updates) {
        const st = u.update?.status;
        if ((st === 3 || st === 4) && u.key?.id) this.onAck?.(u.key.id);
      }
    });
  }

  async sendText(to, text) {
    if (!this.sock || this.status !== 'open') throw new Error('not-linked');
    return this.sock.sendMessage(`${to}@s.whatsapp.net`, { text });
  }

  stop() {
    this.stopped = true;
    try { this.sock?.end?.(undefined); } catch {}
    this.sock = null;
  }
}
