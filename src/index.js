// Point d'entrée du pont neuf, ligne 53, un seul VPS.
// - Un seul verrou LOCAL (fichier + PID) : si un autre processus du pont
//   tourne déjà sur ce VPS, on s'arrête avec une erreur claire. Il n'y a
//   pas d'élection entre plusieurs hôtes, parce qu'il n'y a qu'un seul hôte.
// - Déduplication des entrants par identifiant de message, journal local :
//   un message déjà traité n'est jamais répondu deux fois.
// - Après la reconnexion, la réponse est immédiate : le cerveau est déjà
//   chargé, la file d'envoi est vide, aucune étape supplémentaire n'attend.
import fs from 'node:fs';
import { loadConfig } from './config.js';
import { loadLocalAuth } from './authStore.js';
import { PairingSnapshot } from './pairing.js';
import { Connection } from './connection.js';
import { LineMemory, cleanPhone } from './memory53.js';
import { brainReply } from './brain.js';
import { Outbox } from './outbox.js';
import { DisplayPublisher } from './publish.js';
import { createServer } from './server.js';

export async function main(env = process.env) {
  const config = loadConfig(env);
  fs.mkdirSync(config.dataDir, { recursive: true });

  // Verrou local unique.
  if (fs.existsSync(config.lockFile)) {
    const pid = Number(fs.readFileSync(config.lockFile, 'utf8').trim());
    if (pid && pid !== process.pid) {
      try { process.kill(pid, 0); throw new Error(`another bridge instance is running (pid ${pid})`); }
      catch (e) { if (e.message.startsWith('another bridge')) throw e; }
    }
  }
  fs.writeFileSync(config.lockFile, String(process.pid));
  const releaseLock = () => { try { fs.unlinkSync(config.lockFile); } catch {} };
  process.on('SIGTERM', () => { releaseLock(); process.exit(0); });
  process.on('SIGINT', () => { releaseLock(); process.exit(0); });

  const authLoad = await loadLocalAuth(config.authDir, config.dataDir);
  const pairing = new PairingSnapshot(config.qrTtlMs);
  const memory = new LineMemory(config.memoryDir, config.line);
  const outbox = new Outbox(config.ackFile);
  const seen = new Set(fs.existsSync(config.dedupFile) ? fs.readFileSync(config.dedupFile, 'utf8').split('\n').filter(Boolean) : []);
  const state = { status: 'starting', me: null, lastIn: null, lastOut: null, pendingAcks: 0 };

  const connection = new Connection({
    config,
    auth: authLoad.auth,
    pairing,
    onOpen: (user) => { state.status = 'open'; state.me = user?.id || 'linked'; },
    onQr: () => { state.status = 'qr'; },
    onClose: (code) => { state.status = code === 401 ? 'qr' : `closed:${code}`; },
    onAck: (keyId) => { outbox.markAck(keyId); state.pendingAcks = outbox.pending.size; },
    onInbound: async (m) => {
      const id = m.key?.id;
      if (!id || seen.has(id)) return;
      seen.add(id);
      fs.appendFileSync(config.dedupFile, id + '\n');
      const remote = m.key.remoteJid || '';
      if (remote.endsWith('@g.us') || remote === 'status@broadcast') return;
      const phone = cleanPhone(remote.split('@')[0].split(':')[0]);
      const text = m.message?.conversation || m.message?.extendedTextMessage?.text || '';
      state.lastIn = new Date().toISOString();
      const { text: reply } = await brainReply({ text, phone, memory, config });
      try {
        const sent = await connection.sendText(phone, reply);
        if (sent?.key?.id) outbox.recordSent(sent.key.id, phone, reply);
        state.lastOut = new Date().toISOString();
        state.pendingAcks = outbox.pending.size;
      } catch (e) {
        fs.appendFileSync(config.outboxFile, JSON.stringify({ at: new Date().toISOString(), to: phone, text: reply, error: String(e.message).slice(0, 200) }) + '\n');
      }
    },
  });

  const publisher = new DisplayPublisher(config, () => pairing.getValid());
  publisher.start(() => state.status);

  // Relance des accusés en retard : une fois, puis échec journalisé.
  setInterval(() => {
    for (const o of outbox.overdue()) {
      if (o.tries >= 2) outbox.markFailed(o.keyId);
      else {
        o.tries += 1;
        connection.sendText(o.to, o.text).then((s) => { if (s?.key?.id) outbox.recordSent(s.key.id, o.to, o.text); }).catch(() => outbox.markFailed(o.keyId));
      }
    }
    state.pendingAcks = outbox.pending.size;
  }, 30000).unref();

  const server = createServer({ config, getState: () => ({ ...state, pendingAcks: outbox.pending.size }), getSnapshot: () => pairing.getValid() });
  server.listen(config.port, () => {
    // eslint-disable-next-line no-console
    console.log(`eh-wa53-new line ${config.line} listening on ${config.port}, auth=${authLoad.state}`);
  });
  await connection.start();
  return { config, connection, server, state, authState: authLoad.state };
}

if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch((e) => { console.error(e); process.exit(1); });
}
