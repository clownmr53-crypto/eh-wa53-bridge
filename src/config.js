// Configuration du pont neuf, ligne 53, un seul VPS.
// Règle de base : tout secret vient de l'environnement, jamais du code,
// jamais d'une valeur par défaut, jamais d'un fichier commité.
import path from 'node:path';

function required(name) {
  const v = process.env[name];
  if (!v) throw new Error(`missing env ${name}`);
  return v;
}

export function loadConfig(env = process.env) {
  const dataDir = env.DATA_DIR || path.join(process.cwd(), 'data');
  const line = env.EH_LINE || '53';
  if (line !== '53') throw new Error('this build is line 53 only');
  return {
    line,
    instance: env.EH_INSTANCE || 'eh-wa53-vps1',
    dataDir,
    authDir: path.join(dataDir, 'auth'),
    memoryDir: path.join(dataDir, 'memory', `line-${line}`),
    outboxFile: path.join(dataDir, 'outbox.jsonl'),
    dedupFile: path.join(dataDir, 'dedup.jsonl'),
    ackFile: path.join(dataDir, 'acks.jsonl'),
    lockFile: path.join(dataDir, 'instance.lock'),
    port: Number(env.PORT || 8787),
    bridgeKey: env.BRIDGE_KEY || '',
    // Affichage QR uniquement (jamais d'authentification).
    supabaseUrl: (env.SUPABASE_URL || '').replace(/\/$/, ''),
    supabaseAnonKey: env.SUPABASE_ANON_KEY || '',
    groqKey: env.GROQ_API_KEY || '',
    geminiKey: env.GEMINI_API_KEY || '',
    pairPhone: (env.PAIR_PHONE || '').replace(/\D/g, ''),
    qrTtlMs: 55_000,
    // Reconnexions transitoires, bornées : après 3 échecs, on s'arrête
    // en état dégradé lisible, on ne boucle jamais.
    maxTransientReconnects: 3,
    reconnectDelaysMs: [2000, 5000, 15000],
  };
}

export { required };
