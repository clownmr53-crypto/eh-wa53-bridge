// Stockage d'authentification LOCAL UNIQUEMENT, ligne 53.
// Aucune lecture, aucune écriture, aucune restauration depuis un serveur
// distant, une autre instance ou une sauvegarde partagée. C'est le point
// central qui casse l'ancien système : ici, une clé corrompue ne peut pas
// être réimportée par un autre pont, parce qu'il n'y a pas d'autre pont.
import fs from 'node:fs';
import path from 'node:path';
import { useMultiFileAuthState } from 'baileys';

// Une authentification est utilisable si, et seulement si, ses fichiers
// existent ET se relisent en JSON valide. Tout le reste est corrompu.
export function validateAuthDir(authDir) {
  const credsPath = path.join(authDir, 'creds.json');
  if (!fs.existsSync(credsPath)) return { state: 'empty' };
  try {
    const creds = JSON.parse(fs.readFileSync(credsPath, 'utf8'));
    if (!creds || typeof creds !== 'object') return { state: 'corrupt', reason: 'creds-not-object' };
    for (const f of fs.readdirSync(authDir).filter((n) => n.endsWith('.json') && n !== 'creds.json')) {
      JSON.parse(fs.readFileSync(path.join(authDir, f), 'utf8'));
    }
    return { state: creds.registered ? 'linked' : 'unlinked', registered: !!creds.registered };
  } catch (e) {
    return { state: 'corrupt', reason: String(e.message).slice(0, 120) };
  }
}

// Corrompu => mise en quarantaine locale datée, puis démarrage vierge.
// On ne supprime jamais sans trace : la quarantaine reste lisible sur le VPS.
export function quarantineAuthDir(authDir, dataDir) {
  const stamp = new Date().toISOString().replace(/[:.]/g, '-');
  const dest = path.join(dataDir, `auth-quarantine-${stamp}`);
  fs.mkdirSync(dataDir, { recursive: true });
  fs.renameSync(authDir, dest);
  return dest;
}

export async function loadLocalAuth(authDir, dataDir) {
  fs.mkdirSync(authDir, { recursive: true });
  const check = validateAuthDir(authDir);
  if (check.state === 'corrupt') {
    const dest = quarantineAuthDir(authDir, dataDir);
    fs.mkdirSync(authDir, { recursive: true });
    return { state: 'quarantined', quarantine: dest, auth: await useMultiFileAuthState(authDir) };
  }
  return { state: check.state, auth: await useMultiFileAuthState(authDir) };
}
