# Pont WhatsApp 53 — système NEUF, un seul VPS

Système écrit de zéro pour la ligne 53 d'Electronic HOUSE. Il ne reprend
ni l'ancien code, ni les anciens ponts, ni les anciens correctifs, ni
l'historique n8n / Render. Un seul VPS, une seule instance, une seule
liaison, une seule mémoire (ligne 53).

## Ce qui était cassé (résumé — détail dans AUDIT-GLOBAL.md)
- Une authentification partagée entre plusieurs ponts, qui s'écrasaient
  les clés (VPS, botkeep, Wispbyte, Render).
- Restauration d'authentifications invalides ou vides, sans validation.
- Boucles de redémarrage (watchdog + reconnexion sans plafond).
- Fermeture 401 traitée en rebouclant au lieu d'attendre un humain.
- Envois comptés comme réussis sans aucun accusé WhatsApp.
- Code d'appairage qui changeait après livraison.
- Chemin de fichier code erroné sur le VPS.
- QR du tableau de bord figé ou mis en cache, affiché après expiration.
- Fusions fragiles : mémoire 53/59 unifiée, une seule voie 53 sans secours,
  une seule file pour tout.

## Ce qui a changé (par construction)
- Authentification locale uniquement, validée, corrompue => quarantaine.
- Instantané d'appairage figé (QR + code + version + expiration), jamais
  modifié pendant sa durée de vie, jamais resservi après expiration.
- Reconnexions bornées (3 maximum), puis état "degraded" lisible.
- 401 => quarantaine + attente d'un humain, jamais de boucle.
- Livraison = accusé WhatsApp uniquement ; sans accusé sous 30 s : une
  relance, puis échec journalisé.
- Mémoire isolée : dossier ligne 53, un fichier par contact, jamais 59.
- Un seul hôte, un seul verrou local, aucune élection multi-hôtes.
- Cerveau : même logique que la ligne 59 (français d'abord, puis langue
  du client, jamais de prix inventé, cas humains => accusé seulement),
  mais connexion neuve sur le VPS pour le 53. Le 59 n'est pas touché,
  le 53 ne passe pas sur l'API Cloud du 59.
- Baileys : version officielle épinglée `7.0.0-rc14`, sans fourche
  (les fourches tierces trouvées comportent des risques avérés).

## Déployer (matin, en une fois)
Voir `DEPLOY.md`. En résumé : arrêter l'ancien pont, sauvegarder son
dossier, copier ce dossier, créer `.env` depuis `.env.example` (valeurs
réelles uniquement sur le VPS, jamais dans ce dossier), `npm install`,
`node scripts/deploy-check.mjs`, démarrer avec pm2, puis UN SEUL
appairage (QR ou code) par Horeb, puis deux messages test.

## Tester sans compte réel (déjà fait cette nuit)
- `npm run check` — syntaxe des 10 fichiers.
- `npm test` — 7 tests, tous verts.
- `node scripts/deploy-check.mjs` — syntaxe + tests + balayage secret.
- Démarrage à blanc du serveur seul : `/health` 200, `/qr` 200.

## Ce qui reste pour le matin (une seule action d'Horeb)
1. Reconnexion : un seul scan QR (depuis le chat OU depuis le tableau de
   bord, même instantané) ou un seul code, depuis un écran déjà ouvert.
2. Preuve : deux messages test vers le 53, deux réponses DU 53 (pas du 59),
   avec accusés vérifiés sur `/health` et dans `data/acks.jsonl`.
3. Si une réponse arrive du 59, ou si aucun accusé n'apparaît : arrêter,
   ne pas recommencer en boucle, revenir à ce rapport.
