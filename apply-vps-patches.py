#!/usr/bin/env python3
"""Applique les patchs VPS B / C1 / C2 / MEM sur un checkout du dépôt pont
eh-wa53-bridge. NE DÉPLOIE RIEN : il modifie les fichiers du dépôt local,
vérifie la syntaxe, et c'est tout. Le redémarrage pm2 se fait à la main,
après la procédure (voir PROCEDURE-VPS.md).

Usage sur le VPS : python3 apply-vps-patches.py [/root/wa53-bridge]

Règles : chaque patch vérifie son ancre (exactement 1 occurrence) ; si un
marqueur VPS-* est déjà présent, le patch est sauté (idempotent) ; si une
ancre est absente, ABANDON SANS RIEN ÉCRIRE. La syntaxe des 3 fichiers
patchés est vérifiée (node --check sur copies .mjs) AVANT toute écriture.
"""
import os
import subprocess
import sys

REPO = sys.argv[1] if len(sys.argv) > 1 else "/root/wa53-bridge"

B_BLOCK = """  // VPS-B (2026-10-22) : journaliser les accusés Baileys de nos propres envois,
  // pour distinguer « envoyé (serveur) » de « délivré » et « lu ».
  // Seuls les identifiants présents dans botSent (nos envois, 15 min) sont
  // journalisés, via le bus mesh (eh_events) comme les msg_out.
  my.ev.on('messages.update', (updates) => {
    try {
      for (const u of updates || []) {
        const id = u.key && u.key.id, st = u.update && u.update.status;
        if (!id || !st || !botSent.has(id)) continue;
        const digits = String(u.key.remoteJid || '').replace(/\\D/g, '');
        mesh.event('wa53_ack', { status: st, fromMe: !!(u.key && u.key.fromMe) }, { wa: digits || null, msg_id: id });
      }
    } catch {}
  });
"""

C2A_OLD = """      let res; try { res = await exec(got[0]); } catch (e) { res = { ok: false, error: String(e.message || e).slice(0, 300) }; }
      await sb('PATCH', `eh_commands?id=eq.${c.id}`, { status: res.ok ? 'done' : 'failed', result: res, done_at: new Date().toISOString() }).catch(() => {});
      event('command', { id: c.id, action: c.action, ok: res.ok });"""

C2A_NEW = """      let res; try { res = await exec(got[0]); } catch (e) { res = { ok: false, error: String(e.message || e).slice(0, 300) }; }
      // VPS-C2 (2026-10-22) : un envoi patron tombé pendant une coupure socket
      // (1006 / Connection Closed / not linked) est retenté UNE fois après
      // reconnexion. La retentative est sûre : une erreur de ce type ne peut
      // venir que de ctx.sendText avant l'envoi (les suites — outbound, hist —
      // ne lèvent pas) ; un envoi déjà parti n'est donc jamais renvoyé.
      const __connErr = !res.ok && /closed|not linked|1006|ECONNRESET|socket/i.test(String(res.error || ''));
      const __sendAction = /^(send_text|send_document|send_catalog|send_reminder)$/.test(String(c.action || ''));
      if (__connErr && __sendAction) {
        const __t0 = Date.now();
        while (Date.now() - __t0 < 60000 && getState().status !== 'open') await new Promise((r) => setTimeout(r, 2000));
        if (getState().status === 'open') {
          try { res = await exec(got[0]); } catch (e) { res = { ok: false, error: String(e.message || e).slice(0, 300) }; }
        }
      }
      await sb('PATCH', `eh_commands?id=eq.${c.id}`, { status: res.ok ? 'done' : 'failed', result: res, done_at: new Date().toISOString() }).catch(() => {});
      event('command', { id: c.id, action: c.action, ok: res.ok });
      if (!res.ok && __connErr && __sendAction) event('wa53_send_failed_definitif', { id: c.id, action: c.action, error: String(res.error || '').slice(0, 200) }, { wa: String((got[0].params && (got[0].params.wa || got[0].params.to)) || '').replace(/\\D/g, '') || null });"""

C2B_OLD = "      log.warn({ code, restart }, 'connection closed');"
C2B_NEW = """      log.warn({ code, restart }, 'connection closed');
      try { mesh.event('wa53_socket_close', { code, restart }); } catch {} // VPS-C2B : coupure visible par le Gardien (la reconnexion elle-même existe déjà : setTimeout(startSock, 2000) ci-dessous, sauf loggedOut)."""

C1_NEW = """  if (!isText) {
    // VPS-C1 (2026-10-22) : une image du patron reçoit TOUJOURS une réponse utile.
    // La vision (bloc ci-dessus) a déjà été tentée ; si elle n'a rien rendu,
    // repli IA locale du patron sur la légende. Le « Non envoyé » n'est plus
    // jamais la seule réponse, et le cooldown 180 s ne supprime plus la seule
    // réponse : s'il est refroidi, un accusé minimal part quand même.
    const cap = String(e.caption || "").trim();
    let answered = false;
    try {
      answered = await __ownerAiReply(env, phoneId, e, cap ? "Le patron m'envoie une image avec la légende : « " + cap + " ». Décris ce que cette image peut contenir d'utile pour la boutique et réponds à sa légende." : "Le patron m'envoie une image sans légende. Dis-lui que tu as bien reçu son image mais que tu ne peux pas la décrire sans légende, et demande-lui ce qu'il veut en faire (analyse, envoi à un client, catalogue).", []);
    } catch (err) { console.error("c1 owner image fallback soft-fail", String(err && err.message || err).slice(0, 120)); }
    if (!answered) {
      if (await globalCooldown("owner_media_hint", 180))
        await sendText(env, phoneId, e.from, "📎 Image bien reçue, mais je n'ai pas pu l'analyser pour l'instant. Renvoie-la avec une légende (« analyse cette capture », « réponds au 229… : texte », ou « photo <modèle> ») et je m'en occupe.");
      else
        await sendText(env, phoneId, e.from, "📎 Image reçue (analyse indisponible pour l'instant).");
    }
    return;
  }"""

MEM_HISTGET_OLD = "export async function histGet(wa) { const r = await HTTP({ url: KVBASE() + '?key=eq.' + encodeURIComponent('conv:' + wa) + '&select=key,value,metadata,expires_at', headers: SBH(), encoding: 'text' }); const row = JSON.parse(r.body || '[]')[0] || null; let h = []; try { h = row && row.value ? JSON.parse(row.value) : []; } catch {} return { row, hist: Array.isArray(h) ? h : [] }; }"

MEM_HISTGET_NEW = """export async function histGet(wa) { const r = await HTTP({ url: KVBASE() + '?key=eq.' + encodeURIComponent('conv:' + wa) + '&select=key,value,metadata,expires_at', headers: SBH(), encoding: 'text' }); const row = JSON.parse(r.body || '[]')[0] || null; let h = []; try { h = row && row.value ? JSON.parse(row.value) : []; } catch {} if (!Array.isArray(h)) h = [];
  // VPS-MEM (2026-10-22) : mémoire unique 53/59 côté pont — fusionne aussi
  // l'historique worker (table wa59_conv), dédupliqué par (rôle, ts, texte).
  try { const w = await HTTP({ url: SB_URL + '/rest/v1/wa59_conv?wa=eq.' + encodeURIComponent(String(wa).replace(/\\D/g, '')) + '&select=value,meta,expires_at', headers: SBH(), encoding: 'text' }); const wrow = JSON.parse(w.body || '[]')[0] || null; if (wrow && wrow.value && (!wrow.expires_at || Date.parse(wrow.expires_at) >= Date.now())) { const wh = JSON.parse(wrow.value); if (Array.isArray(wh)) { const seen = new Set(h.map((x) => (x && x.role) + '|' + (x && x.ts) + '|' + String(x && x.text || '').slice(0, 60))); for (const x of wh) { const k = (x && x.role) + '|' + (x && x.ts) + '|' + String(x && x.text || '').slice(0, 60); if (!seen.has(k)) { seen.add(k); h.push(x); } } h.sort((a, b) => (Number(a && a.ts) || 0) - (Number(b && b.ts) || 0)); } } } catch {}
  return { row, hist: h }; }"""

MEM_APPEND_OLD = "  await HTTP({ url: KVBASE() + '?on_conflict=key', method: 'POST', headers: { ...SBH(), Prefer: 'resolution=merge-duplicates,return=minimal' }, body: JSON.stringify({ key: 'conv:' + wa, value: JSON.stringify(hist.slice(-80)), metadata: meta, expires_at: row ? row.expires_at : null }) });"

MEM_APPEND_NEW = MEM_APPEND_OLD + """
  // VPS-MEM : miroir worker — le worker fusionne wa59_conv à chaque lecture.
  try { await HTTP({ url: SB_URL + '/rest/v1/wa59_conv?on_conflict=wa', method: 'POST', headers: { ...SBH(), Prefer: 'resolution=merge-duplicates,return=minimal' }, body: JSON.stringify({ wa, value: JSON.stringify(hist.slice(-80)), meta: meta, expires_at: row ? row.expires_at : null, updated_at: new Date().toISOString() }) }); } catch {}"""


def replace_once(text, old, new, label):
    n = text.count(old)
    if n != 1:
        print(f"ABANDON {label}: {n} occurrence(s) (attendu 1)")
        sys.exit(1)
    return text.replace(old, new)


def patch_c1(text):
    lines = text.split("\n")
    start = None
    for i, ln in enumerate(lines):
        if ln == "  if (!isText) {" and any('globalCooldown("owner_media_hint"' in lines[j] for j in range(i + 1, min(i + 4, len(lines)))):
            start = i
            break
    if start is None:
        print("ABANDON C1: bloc hint introuvable")
        sys.exit(1)
    end = None
    for j in range(start + 1, len(lines)):
        if lines[j] == "  }":
            end = j
            break
    if end is None:
        print("ABANDON C1: fin de bloc introuvable")
        sys.exit(1)
    block = "\n".join(lines[start:end + 1])
    if "Non envoy" not in block or "return;" not in block:
        print("ABANDON C1: bloc trouvé mais contenu inattendu")
        sys.exit(1)
    lines[start:end + 1] = C1_NEW.split("\n")
    return "\n".join(lines)


def main():
    targets = {}
    for name in ("index.js", "mesh53.mjs", "core53.js", "bot53.mjs"):
        p = os.path.join(REPO, name)
        if not os.path.isfile(p):
            print(f"ABANDON: {p} introuvable")
            sys.exit(1)
        targets[name] = open(p, encoding="utf-8").read()

    # B (index.js)
    t = targets["index.js"]
    if "VPS-B" in t:
        print("B: déjà appliqué, sauté")
    else:
        anchor = "  my.ev.on('messages.upsert', async ({ messages, type }) => {"
        if t.count(anchor) != 1:
            print("ABANDON B: ancre upsert introuvable")
            sys.exit(1)
        targets["index.js"] = t.replace(anchor, B_BLOCK + anchor)
        print("B: appliqué")
    # C2b (index.js)
    t = targets["index.js"]
    if "VPS-C2B" in t:
        print("C2b: déjà appliqué, sauté")
    else:
        targets["index.js"] = replace_once(t, C2B_OLD, C2B_NEW, "C2b")
        print("C2b: appliqué")
    # C2a (mesh53.mjs)
    t = targets["mesh53.mjs"]
    if "VPS-C2" in t:
        print("C2a: déjà appliqué, sauté")
    else:
        targets["mesh53.mjs"] = replace_once(t, C2A_OLD, C2A_NEW, "C2a")
        print("C2a: appliqué")
    # C1 (core53.js)
    t = targets["core53.js"]
    if "VPS-C1" in t:
        print("C1: déjà appliqué, sauté")
    else:
        targets["core53.js"] = patch_c1(t)
        print("C1: appliqué")
    # MEM (bot53.mjs)
    t = targets["bot53.mjs"]
    if "VPS-MEM" in t:
        print("MEM: déjà appliqué, sauté")
    else:
        t = replace_once(t, MEM_HISTGET_OLD, MEM_HISTGET_NEW, "MEM-histGet")
        t = replace_once(t, MEM_APPEND_OLD, MEM_APPEND_NEW, "MEM-histAppend")
        targets["bot53.mjs"] = t
        print("MEM: appliqué")

    # Vérification syntaxe AVANT écriture. core53.js est un script vm (pas un
    # module : il déclare withLock deux fois, légal en script, illégal en
    # module) -> vérifié en .js ; les autres sont ESM -> vérifiés en .mjs.
    tmp = "/tmp/vps-check"
    os.makedirs(tmp, exist_ok=True)
    ext = {"core53.js": ".js"}
    for name, content in targets.items():
        cp = os.path.join(tmp, name + ext.get(name, ".mjs"))
        with open(cp, "w", encoding="utf-8") as f:
            f.write(content)
        r = subprocess.run(["node", "--check", cp], capture_output=True, text=True)
        if r.returncode != 0:
            print(f"ABANDON: syntaxe {name} invalide:\n{r.stderr[:500]}")
            sys.exit(1)
        print(f"syntaxe {name}: OK")
    for name, content in targets.items():
        with open(os.path.join(REPO, name), "w", encoding="utf-8") as f:
            f.write(content)
    print("PATCHS VPS APPLIQUÉS (dépôt seul, aucun redémarrage effectué).")
    print("Suite : PROCEDURE-VPS.md (baseline, pm2 restart, vérifications, rollback).")


if __name__ == "__main__":
    main()
