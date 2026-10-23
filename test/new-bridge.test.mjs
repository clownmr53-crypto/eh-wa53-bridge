import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { PairingSnapshot } from '../src/pairing.js';
import { validateAuthDir, quarantineAuthDir } from '../src/authStore.js';
import { LineMemory, detectLang } from '../src/memory53.js';
import { Outbox } from '../src/outbox.js';
import { needsHuman, brainReply } from '../src/brain.js';
import { createServer } from '../src/server.js';

test('pairing: un instantané ne change pas avant expiration, puis expire', async () => {
  const p = new PairingSnapshot(55_000);
  const s1 = await p.replace('test-qr-string', 'ABC12345');
  const s2 = p.getValid();
  assert.equal(s1.version, s2.version);
  assert.equal(s2.code, 'ABC12345');
  assert.ok(s2.qrDataUrl.startsWith('data:image/png;base64,'));
  // Expiration simulée : on recule la date d'expiration.
  p.current.expiresAt = Date.now() - 1;
  assert.equal(p.getValid(), null, 'un QR expiré ne doit jamais être resservi');
});

test('pairing: un nouvel événement QR remplace en une fois, version+1', async () => {
  const p = new PairingSnapshot(55_000);
  await p.replace('qr-1', 'CODE1111');
  const s = await p.replace('qr-2', 'CODE2222');
  assert.equal(s.version, 2);
  assert.equal(s.code, 'CODE2222');
});

test('auth: vide, lié, corrompu distingués ; corrompu mis en quarantaine', () => {
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'eh53-'));
  const authDir = path.join(tmp, 'auth');
  fs.mkdirSync(authDir, { recursive: true });
  assert.equal(validateAuthDir(authDir).state, 'empty');
  fs.writeFileSync(path.join(authDir, 'creds.json'), JSON.stringify({ registered: true }));
  assert.equal(validateAuthDir(authDir).state, 'linked');
  fs.writeFileSync(path.join(authDir, 'creds.json'), '{invalid json');
  assert.equal(validateAuthDir(authDir).state, 'corrupt');
  const dest = quarantineAuthDir(authDir, tmp);
  assert.ok(fs.existsSync(dest));
  assert.ok(!fs.existsSync(authDir));
});

test('mémoire: ligne 53 isolée, langue par contact', () => {
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'eh53-'));
  const m = new LineMemory(path.join(tmp, 'memory', 'line-53'), '53');
  m.append('22953632000', 'client', 'Bonjour');
  const other = m.read('22959716716');
  assert.equal(other.turns.length, 0, 'un contact 59 ne doit pas lire la mémoire 53');
  assert.equal(detectLang('Hello, how are you?', null), 'en');
  assert.equal(detectLang('Bonjour', null), 'fr');
});

test('cerveau: cas humain => accusé seulement, jamais de prix inventé', async () => {
  assert.equal(needsHuman('J’ai un problème de paiement'), true);
  assert.equal(needsHuman('Bonjour, vous avez quoi comme abonnement ?'), false);
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'eh53-'));
  const memory = new LineMemory(path.join(tmp, 'memory', 'line-53'), '53');
  const r = await brainReply({ text: 'Bonjour', phone: '22996000000', memory, config: { groqKey: '', geminiKey: '' } });
  assert.ok(r.text.length > 0);
  assert.ok(!/\d+\s*(fcfa|cfa)/i.test(r.text));
});

test('outbox: envoyé sans accusé n’est pas délivré ; accusé => délivré', () => {
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'eh53-'));
  const o = new Outbox(path.join(tmp, 'acks.jsonl'));
  o.recordSent('key-1', '22996000000', 'Bonjour');
  assert.equal(o.overdue(Date.now() + 31_000).length, 1);
  assert.equal(o.markAck('key-1'), true);
  assert.equal(o.pending.size, 0);
  const ack = fs.readFileSync(path.join(tmp, 'acks.jsonl'), 'utf8');
  assert.ok(ack.includes('"delivered":true'));
});

test('serveur: /qr.json expiré => waiting, jamais l’ancienne image', async () => {
  const server = createServer({
    config: { line: '53', instance: 'test' },
    getState: () => ({ status: 'qr', me: null, lastIn: null, lastOut: null, pendingAcks: 0 }),
    getSnapshot: () => null,
  });
  await new Promise((r) => server.listen(0, r));
  const port = server.address().port;
  const res = await fetch(`http://127.0.0.1:${port}/qr.json`);
  const j = await res.json();
  assert.equal(j.status, 'waiting');
  assert.equal(j.qr, undefined);
  server.close();
});
