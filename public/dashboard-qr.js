// Extrait tableau de bord : affiche le QR de la ligne 53 depuis la ligne
// d'affichage kv53 (wa53:qr), JAMAIS depuis l'URL du pont (le VPS est en
// IPv6 seul, donc une image servie par le pont ne s'affiche pas dans un
// navigateur classique) et JAMAIS depuis une image mise en cache.
// Règles : rafraîchissement toutes les 5 s, vérification de expires_at,
// compte à rebours affiché, QR expiré => image masquée et message
// "en attente d'un QR frais" (pas d'ancienne image), code affiché depuis
// LE MÊME instantané (même version) que le QR, jamais un code d'un autre
// instantané. À configurer dans la page qui intègre cet extrait :
// window.EH_QR = { supabaseUrl: '…', anonKey: '…' } (clé ANONYME seulement,
// jamais la clé de service, jamais dans un fichier commité).
(async function () {
  const cfg = window.EH_QR || {};
  const $ = (id) => document.getElementById(id);
  async function tick() {
    try {
      if (!cfg.supabaseUrl || !cfg.anonKey) { $('status').textContent = 'Configuration d’affichage manquante (clé anonyme).'; return; }
      const r = await fetch(`${cfg.supabaseUrl}/rest/v1/kv53?key=eq.wa53:qr&select=value`, {
        headers: { apikey: cfg.anonKey, Authorization: `Bearer ${cfg.anonKey}` },
      });
      const rows = await r.json();
      const v = rows?.[0]?.value ? JSON.parse(rows[0].value) : null;
      if (!v || v.status !== 'qr' || !v.qr || !v.expires_at || Date.parse(v.expires_at) <= Date.now()) {
        $('qr').style.display = 'none';
        $('status').textContent = 'En attente d’un QR frais…';
        $('count').textContent = '';
        $('code').textContent = '';
        return;
      }
      $('qr').src = v.qr;
      $('qr').style.display = 'block';
      $('status').textContent = `QR frais — version ${v.version || '?'}`;
      $('count').textContent = `Expire dans ${Math.max(0, Math.floor((Date.parse(v.expires_at) - Date.now()) / 1000))} s`;
      $('code').textContent = v.code ? `Code : ${v.code} (même instantané que le QR)` : '';
    } catch {
      $('status').textContent = 'Affichage indisponible, nouvelle tentative…';
    }
  }
  await tick();
  setInterval(tick, 5000);
})();
