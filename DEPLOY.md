# Déploiement du matin — en une fois, sans autre étape

Objectif d'Horeb pour demain : TOUT réparé, une seule action de son côté
(la reconnexion), puis le système répond immédiatement. Ce plan est donc
conçu pour que déploiement + reconnexion suffisent, sans autre question,
sans autre réparation à découvrir le matin. Rien n'a été déployé cette
nuit : le pont live actuel n'a pas été touché.

## 0. Avant de commencer (agent, pas Horeb)
- Vérifier que les autres ponts sont bien arrêtés (botkeep, Wispbyte) et
  que le réveil automatique reste désactivé. Un seul pont : celui-ci.
- Vérifier que ce dossier est complet : `npm run check`, `npm test`,
  `node scripts/deploy-check.mjs` — les trois doivent être verts.
- Ne pas copier `node_modules/` tel quel si la version Node du VPS diffère
  de celle des tests : refaire `npm install` sur le VPS.

## 1. Sur le VPS, remplacer l'ancien pont (agent, console VPS)
1. `pm2 stop wa53-bridge` puis `pm2 status` (vérifier : stopped).
2. Sauvegarder l'ancien dossier, sans le supprimer :
   `cp -r /root/wa53-bridge /root/wa53-old-20261023` (vérifier la copie).
3. Copier le contenu de ce dossier neuf dans `/root/wa53-bridge-neuf`
   (nouveau dossier, pour ne pas mélanger avec l'ancien).
4. Créer `.env` dans ce dossier depuis `.env.example`, avec les valeurs
   réelles tapées sur le VPS uniquement (jamais dans ce dossier, jamais
   en chat) : `DATA_DIR`, `PORT` (8787), `BRIDGE_KEY` si besoin,
   `SUPABASE_URL` + `SUPABASE_ANON_KEY` (affichage QR uniquement, clé
   anonyme, jamais la clé de service), `GROQ_API_KEY` puis `GEMINI_API_KEY`
   si disponibles (sans clé : accusés + réponses d'accueil uniquement,
   jamais de réponse inventée), `PAIR_PHONE` seulement si Horeb choisit
   le code au lieu du QR.
5. `npm install`, puis `node scripts/deploy-check.mjs` sur le VPS.
6. `pm2 start` sur le nouveau dossier (nom pm2 : `wa53-bridge`, pour
   garder la même commande de surveillance). Vérifier `/health` :
   statut `qr`, lié = faux, accusés en attente = 0.
7. NE PAS démarrer l'ancien pont, NE PAS appliquer d'ancien correctif,
   NE PAS restaurer d'ancienne authentification. Le nouveau pont part
   vierge : c'est voulu, c'est l'appairage du matin qui crée la liaison.

## 2. Reconnexion — la seule action d'Horeb
- Horeb se met D'ABORD dans WhatsApp Business, Appareils connectés,
  Lier un appareil (écran déjà ouvert, téléphone chargé).
- L'agent lui envoie UN SEUL QR frais (depuis le chat, ou depuis le
  tableau de bord avec l'extrait `public/dashboard-qr.js` — c'est le
  MÊME instantané, même version, même expiration) OU un seul code,
  selon son choix, et Horeb scanne / tape TOUT DE SUITE (moins de 30 s).
- Vérification immédiate par l'agent : `/health` doit passer à `open`,
  lié = vrai. Si ce n'est pas le cas sous 60 s, NE PAS renvoyer un
  deuxième QR en boucle : noter le code de fermeture et revenir à
  AUDIT-GLOBAL.md §2 (hypothèses H1/H2), pas de répétition à l'aveugle.

## 3. Tableau de bord (QR en direct)
- Intégrer `public/dashboard-qr.html` + `public/dashboard-qr.js` dans le
  centre de contrôle, avec `window.EH_QR = { supabaseUrl, anonKey }`
  (clé anonyme uniquement). Vérifier : QR visible, compte à rebours qui
  descend, image masquée après expiration, code du même instantané.
- Si le QR du tableau de bord ne s'affiche pas : utiliser le QR du chat
  pour la reconnexion (même instantané), et noter le tableau de bord
  comme à corriger à part — ne pas bloquer la reconnexion pour ça.

## 4. Preuve que c'est réparé (immédiatement après la reconnexion)
1. Horeb envoie un premier message test vers le 53 (heure notée).
2. Vérifier : une réponse DU 53 (pas du 59) arrive, et un accusé apparaît
   dans `data/acks.jsonl` et sur `/health` (accusés en attente retombe à 0).
3. Recommencer avec un deuxième message test, même vérification.
4. Critère de réussite, sans exception : DEUX réponses du 53, DEUX accusés.
   Un seul des deux ne suffit pas. Zéro accusé = non réparé, même si une
   réponse semble arriver.

## 5. Si ça échoue le matin (retour en arrière honnête)
- Arrêter le nouveau pont (`pm2 stop wa53-bridge`), ne pas redémarrer
  l'ancien pont (il est cassé, le redémarrer ne réparerait rien).
- Garder `/root/wa53-old-20261023` et le dossier neuf intacts, avec les
  journaux, pour diagnostic. Ne pas effacer d'authentification à l'aveugle.
- Ne pas tenter un déplacement du 53 vers l'API Cloud sans accord explicite
  d'Horeb, et ne pas toucher au 59.

## 6. Après la preuve (pas avant)
- Seulement après les deux réponses avec accusés : brancher la
  surveillance (Gardien) sur le nouveau `/health`, en sachant que le
  Gardien doit vérifier "lié" ET "accusés", pas seulement le battement.
- Laisser les autres ponts arrêtés. Aucun secours automatique tant que
  le pont neuf n'a pas tenu une journée complète.
