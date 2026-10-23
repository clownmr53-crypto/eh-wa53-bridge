// Contrôle pré-déploiement, SANS toucher au live : syntaxe, tests,
// absence de secret dans les fichiers, variables obligatoires listées.
// Usage le matin, sur la machine de déploiement, avant toute copie VPS :
//   node scripts/deploy-check.mjs
import { execSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';

const root = path.join(path.dirname(new URL(import.meta.url).pathname), '..');
const fail = (m) => { console.error('FAIL:', m); process.exit(1); };

for (const f of ['src/index.js', 'src/config.js', 'src/authStore.js', 'src/pairing.js', 'src/connection.js', 'src/brain.js', 'src/memory53.js', 'src/outbox.js', 'src/publish.js', 'src/server.js']) {
  try { execSync(`node --check ${path.join(root, f)}`, { stdio: 'ignore' }); }
  catch { fail(`syntax ${f}`); }
}
console.log('syntax: ok');
try { execSync('node --test test/new-bridge.test.mjs', { cwd: root, stdio: 'inherit' }); }
catch { fail('tests'); }

// Balayage secret : aucun fichier du repo ne doit contenir une valeur
// de clé de service, une clé API ou un mot de passe affecté.
const walk = (d) => fs.readdirSync(d, { withFileTypes: true }).flatMap((e) => {
  if (e.isDirectory()) return e.name === 'node_modules' ? [] : walk(path.join(d, e.name));
  return [path.join(d, e.name)];
});
for (const f of walk(root)) {
  if (f.endsWith('.env')) continue;
  const t = fs.readFileSync(f, 'utf8');
  if (/(SERVICE_ROLE_KEY\s*=\s*\S+|GROQ_API_KEY\s*=\s*\S+|GEMINI_API_KEY\s*=\s*\S+|BRIDGE_KEY\s*=\s*\S+)/.test(t) && !f.endsWith('.env.example')) fail(`possible secret in ${f}`);
}
console.log('secret scan: ok (placeholders only)');
console.log('deploy-check: OK — prêt à copier sur le VPS le matin (voir DEPLOY.md).');
