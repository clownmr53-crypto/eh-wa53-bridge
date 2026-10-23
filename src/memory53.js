// Mémoire ISOLÉE ligne 53, par contact. Jamais fusionnée avec la ligne 59.
// Ancienne fusion cassée : une seule mémoire pour 53 et 59, donc un
// contact 59 pouvait écraser le contexte d'un contact 53 (et inversement),
// et un effacement côté 59 touchait le 53. Ici : un dossier par ligne,
// un fichier par contact, clé = numéro nettoyé, rien d'autre.
import fs from 'node:fs';
import path from 'node:path';

export function cleanPhone(raw) {
  return String(raw || '').replace(/\D/g, '');
}

export class LineMemory {
  constructor(memoryDir, line = '53') {
    this.dir = memoryDir;
    this.line = line;
    fs.mkdirSync(this.dir, { recursive: true });
  }

  fileFor(phone) {
    return path.join(this.dir, `${cleanPhone(phone)}.json`);
  }

  read(phone) {
    try {
      return JSON.parse(fs.readFileSync(this.fileFor(phone), 'utf8'));
    } catch {
      return { line: this.line, phone: cleanPhone(phone), lang: null, turns: [] };
    }
  }

  append(phone, role, text) {
    const m = this.read(phone);
    m.turns.push({ at: new Date().toISOString(), role, text: String(text).slice(0, 1000) });
    if (m.turns.length > 40) m.turns = m.turns.slice(-40);
    fs.writeFileSync(this.fileFor(phone), JSON.stringify(m, null, 2));
    return m;
  }

  setLang(phone, lang) {
    const m = this.read(phone);
    m.lang = lang;
    fs.writeFileSync(this.fileFor(phone), JSON.stringify(m, null, 2));
    return m;
  }
}

// Détection de langue minimale, sans dépendance : anglais évident => 'en',
// sinon 'fr' (défaut de la ligne 53). La langue mémorisée d'un contact
// ne s'applique jamais à un autre contact, ni à la ligne 59.
export function detectLang(text, previous) {
  if (previous) return previous;
  if (/\b(hello|hi|how are you|please|thank you|price)\b/i.test(text || '')) return 'en';
  return 'fr';
}
