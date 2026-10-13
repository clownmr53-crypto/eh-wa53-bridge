# eh-wa53-bridge
Baileys linked-device bridge for Electronic HOUSE WhatsApp 53 (+229 53 63 20 00).

- Sends: polls Supabase `wa53_outbox` every 2 s (rows inserted by the n8n 59-clone in bridge mode), human delay 0.8–3 s, marks `sent`/`failed`.
- Session: Supabase `wa53_bridge_auth` (restored at each connect, mirrored on every creds update). No local state needed.
- Leader election: Supabase `wa53_bridge_lock` via RPC `wa53_lock_acquire(holder, 45)`. Heartbeat every 10 s; a stale lock (>45 s) is taken over;
  an instance that loses the lock (or can't heartbeat for 30 s) closes its WhatsApp socket. Only the holder connects -> no double session.
  SIGTERM releases the lock so another instance takes over within ~10 s.
- HTTP: `GET /health` -> `{instance, leader, lock_holder, status, me}`. Optional `POST /send` and `/qr` need BRIDGE_KEY.

## Env
Required: SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, INSTANCE_NAME (e.g. render / wispbyte / box).
Optional: BRIDGE_KEY, PORT (Render sets it; Wispbyte uses SERVER_PORT automatically), LOG_LEVEL.
A `.env` file next to index.js is also read (real env vars take precedence). Never commit it.

## Render (free web service)
New Web Service -> this repo -> Runtime Docker (Dockerfile) -> Free -> env vars above -> Health check path `/health`.
Keep awake: add `https://<service>.onrender.com/health` to eh-relay RENDER_PING_URLS.

## Wispbyte (Pterodactyl, Node.js egg, nodejs_22 image)
Upload the zip contents to /home/container (index.js, package.json, .env from .env.example filled in), start: the egg runs npm install then node index.js.
