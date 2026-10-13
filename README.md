# eh-wa53 bridge — standby image (v7 + in-process bot + always-reply), 2026-10-13
Same code as the box (`/workspace/eh_mission/wa53_bridge_v7`). Only the holder of Supabase `wa53_bridge_lock` connects to WhatsApp.

## Safety model (one session, two hosts)
- Lock RPC `wa53_lock_acquire(holder, 45)`: heartbeat every 10 s; a lock is taken over only when stale > 45 s or released.
- The holder self-demotes (closes its socket, stops writing auth) if it cannot heartbeat for 30 s -> it is gone before anyone can take over.
- Auth: every key/creds write is mirrored immediately (serialized, coalesced) to `wa53_bridge_auth`; SIGTERM flushes then releases.
- A host with an empty disk (Render) always restores auth from Supabase. A host that has a local `.auth` but sees a NEWER Supabase row written by
  someone else (auth_sync.json) backs up its `.auth` and restores from Supabase before connecting (box coming back after a Render takeover).
- Known limit: if the leader is network-partitioned it cannot flush its last keys; the taker restores the last mirrored state (normally identical, since every write is mirrored at once).

## Render (free web service, Docker)
New Web Service -> private repo `clownmr53-crypto/eh-wa53-bridge` -> Docker -> Free -> env: INSTANCE_NAME=render, SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, BRIDGE_KEY -> health `/health`.
Free instances sleep after 15 min without HTTP: add `https://<service>.onrender.com/health` to eh-relay `RENDER_PING_URLS` (pinged every 5 min) or the standby cannot take over.
Do NOT set PAIR_PHONE. Never run two instances with the same INSTANCE_NAME.
