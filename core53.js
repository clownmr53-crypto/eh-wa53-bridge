var S = __S;
// ===== EH59-on-n8n runtime prelude: Workers-API polyfills for the n8n Code sandbox =====
const __G = globalThis;
const __B = typeof Buffer !== "undefined" ? Buffer : null;
// --- URLSearchParams / URL (minimal WHATWG subset used by eh-whatsapp) ---
if (typeof __G.URLSearchParams === "undefined") {
  __G.URLSearchParams = class URLSearchParams {
    constructor(init) { this._l = []; if (!init) return; if (typeof init === "string") { for (const p of init.replace(/^\?/, "").split("&")) { if (!p) continue; const i = p.indexOf("="); const d = s => decodeURIComponent(s.replace(/\+/g, " ")); this._l.push(i < 0 ? [d(p), ""] : [d(p.slice(0, i)), d(p.slice(i + 1))]); } } else if (Array.isArray(init)) this._l = init.map(([a, b]) => [String(a), String(b)]); else for (const k of Object.keys(init)) this._l.push([k, String(init[k])]); }
    get(k) { const e = this._l.find(x => x[0] === k); return e ? e[1] : null; } getAll(k) { return this._l.filter(x => x[0] === k).map(x => x[1]); }
    has(k) { return this._l.some(x => x[0] === k); } set(k, v) { this.delete(k); this._l.push([k, String(v)]); } append(k, v) { this._l.push([k, String(v)]); } delete(k) { this._l = this._l.filter(x => x[0] !== k); }
    forEach(f) { this._l.forEach(([k, v]) => f(v, k, this)); } entries() { return this._l[Symbol.iterator](); } [Symbol.iterator]() { return this._l[Symbol.iterator](); } keys() { return this._l.map(x => x[0])[Symbol.iterator](); }
    toString() { const e = s => encodeURIComponent(s).replace(/%20/g, "+"); return this._l.map(([k, v]) => e(k) + "=" + e(v)).join("&"); }
  };
}
if (typeof __G.URL === "undefined") {
  __G.URL = class URL {
    constructor(u, base) { u = String(u); if (base && !/^[a-z][a-z0-9+.-]*:/i.test(u)) { const b = new URL(base); u = u.startsWith("/") ? b.origin + u : b.origin + b.pathname.replace(/[^/]*$/, "") + u; }
      const m = u.match(/^([a-z][a-z0-9+.-]*:)\/\/([^/?#]*)([^?#]*)(\?[^#]*)?(#.*)?$/i); if (!m) throw new TypeError("Invalid URL: " + u);
      this.protocol = m[1].toLowerCase(); this.host = m[2]; this.hostname = m[2].replace(/:\d+$/, ""); this.port = (m[2].match(/:(\d+)$/) || [])[1] || ""; this.pathname = m[3] || "/"; this.searchParams = new URLSearchParams(m[4] || ""); this.hash = m[5] || ""; }
    get origin() { return this.protocol + "//" + this.host; } get search() { const s = this.searchParams.toString(); return s ? "?" + s : ""; } set search(v) { this.searchParams = new URLSearchParams(v || ""); }
    get href() { return this.origin + this.pathname + this.search + this.hash; } toString() { return this.href; } toJSON() { return this.href; }
  };
}
// --- base64 / text ---
if (typeof __G.atob === "undefined") __G.atob = s => __B.from(String(s), "base64").toString("binary");
if (typeof __G.btoa === "undefined") __G.btoa = s => __B.from(String(s), "binary").toString("base64");
if (typeof __G.TextDecoder === "undefined") __G.TextDecoder = class { decode(b) { if (!b) return ""; return __B.from(b instanceof ArrayBuffer ? new Uint8Array(b) : b).toString("utf8"); } };
const __toBuf = b => b == null ? __B.alloc(0) : __B.isBuffer(b) ? b : b instanceof ArrayBuffer ? __B.from(new Uint8Array(b)) : ArrayBuffer.isView(b) ? __B.from(b.buffer, b.byteOffset, b.byteLength) : __B.from(String(b), "utf8");
// --- Headers / Blob / FormData / Request / Response ---
if (typeof __G.Headers === "undefined") {
  __G.Headers = class Headers { constructor(h) { this._m = new Map(); if (h instanceof Headers) h.forEach((v, k) => this.set(k, v)); else if (Array.isArray(h)) h.forEach(([k, v]) => this.set(k, v)); else if (h) for (const k of Object.keys(h)) this.set(k, h[k]); }
    get(k) { const v = this._m.get(String(k).toLowerCase()); return v == null ? null : v; } set(k, v) { this._m.set(String(k).toLowerCase(), String(v)); } append(k, v) { const o = this.get(k); this.set(k, o ? o + ", " + v : v); } has(k) { return this._m.has(String(k).toLowerCase()); } delete(k) { this._m.delete(String(k).toLowerCase()); }
    forEach(f) { for (const [k, v] of this._m) f(v, k, this); } entries() { return this._m.entries(); } [Symbol.iterator]() { return this._m.entries(); } toObject() { return Object.fromEntries(this._m); } };
}
if (typeof __G.Blob === "undefined") __G.Blob = class Blob { constructor(parts = [], o = {}) { this._b = __B.concat(parts.map(p => p instanceof Blob ? p._b : __toBuf(p))); this.type = o.type || ""; this.size = this._b.length; } async arrayBuffer() { return this._b.buffer.slice(this._b.byteOffset, this._b.byteOffset + this._b.length); } async text() { return this._b.toString("utf8"); } };
if (typeof __G.FormData === "undefined") __G.FormData = class FormData { constructor() { this._l = []; } append(k, v, fn) { this._l.push([k, v, fn]); } set(k, v, fn) { this._l = this._l.filter(x => x[0] !== k); this._l.push([k, v, fn]); } get(k) { const e = this._l.find(x => x[0] === k); return e ? e[1] : null; }
  _encode() { const bd = "----ehform" + Math.random().toString(16).slice(2); const parts = []; for (const [k, v, fn] of this._l) { if (v instanceof Blob) { parts.push(__B.from(`--${bd}\r\nContent-Disposition: form-data; name="${k}"; filename="${fn || "blob"}"\r\nContent-Type: ${v.type || "application/octet-stream"}\r\n\r\n`), v._b, __B.from("\r\n")); } else parts.push(__B.from(`--${bd}\r\nContent-Disposition: form-data; name="${k}"\r\n\r\n${v}\r\n`)); } parts.push(__B.from(`--${bd}--\r\n`)); return { body: __B.concat(parts), type: "multipart/form-data; boundary=" + bd }; } };
class __Body {
  _initBody(b) { this._raw = b == null ? null : b; this.bodyUsed = false; }
  async _buf() { const b = this._raw; if (b == null) return __B.alloc(0); if (b instanceof Blob) return b._b; if (b instanceof URLSearchParams) return __B.from(b.toString()); if (typeof FormData !== "undefined" && b instanceof FormData) return b._encode().body; return __toBuf(b); }
  async text() { return (await this._buf()).toString("utf8"); } async json() { return JSON.parse(await this.text()); }
  async arrayBuffer() { const b = await this._buf(); return b.buffer.slice(b.byteOffset, b.byteOffset + b.length); } async blob() { return new Blob([await this._buf()], { type: this.headers.get("content-type") || "" }); }
  get body() { return this._raw; }
}
if (typeof __G.Response === "undefined") {
  __G.Response = class Response extends __Body { constructor(body, init = {}) { super(); this._initBody(body); this.status = init.status == null ? 200 : init.status; this.statusText = init.statusText || ""; this.headers = new Headers(init.headers); this.url = init.url || ""; this.redirected = false; if (typeof body === "string" && !this.headers.has("content-type")) this.headers.set("content-type", "text/plain;charset=UTF-8"); }
    get ok() { return this.status >= 200 && this.status < 300; } clone() { return new Response(this._raw, { status: this.status, headers: this.headers, url: this.url }); }
    static json(o, init = {}) { const h = new Headers(init.headers); h.set("content-type", "application/json"); return new Response(JSON.stringify(o), { ...init, headers: h }); } static redirect(u, s = 302) { return new Response(null, { status: s, headers: { Location: u } }); } };
}
if (typeof __G.Request === "undefined") {
  __G.Request = class Request extends __Body { constructor(input, init = {}) { super(); const src = input instanceof Request ? input : null; this.url = src ? src.url : String(input); this.method = (init.method || (src && src.method) || "GET").toUpperCase(); this.headers = new Headers(init.headers || (src && src.headers)); this._initBody(init.body !== undefined ? init.body : src ? src._raw : null); this.signal = init.signal || null; this.redirect = init.redirect || "follow"; }
    clone() { return new Request(this.url, { method: this.method, headers: this.headers, body: this._raw }); } };
}
if (typeof __G.AbortSignal === "undefined" || !__G.AbortSignal.timeout) {
  __G.AbortSignal = class AbortSignal { constructor() { this.aborted = false; this._ms = 0; } static timeout(ms) { const s = new AbortSignal(); s._ms = ms; return s; } static any(list) { const s = new AbortSignal(); s._ms = Math.min(...list.map(x => x && x._ms || 1e9)); return s; } addEventListener() {} removeEventListener() {} throwIfAborted() {} };
  __G.AbortController = class AbortController { constructor() { this.signal = new AbortSignal(); } abort() { this.signal.aborted = true; } };
}
// --- crypto (sha256/hmac/getRandomValues/randomUUID) pure JS ---
if (typeof __G.crypto === "undefined" || !__G.crypto.subtle) {
  const K = new Uint32Array([0x428a2f98,0x71374491,0xb5c0fbcf,0xe9b5dba5,0x3956c25b,0x59f111f1,0x923f82a4,0xab1c5ed5,0xd807aa98,0x12835b01,0x243185be,0x550c7dc3,0x72be5d74,0x80deb1fe,0x9bdc06a7,0xc19bf174,0xe49b69c1,0xefbe4786,0x0fc19dc6,0x240ca1cc,0x2de92c6f,0x4a7484aa,0x5cb0a9dc,0x76f988da,0x983e5152,0xa831c66d,0xb00327c8,0xbf597fc7,0xc6e00bf3,0xd5a79147,0x06ca6351,0x14292967,0x27b70a85,0x2e1b2138,0x4d2c6dfc,0x53380d13,0x650a7354,0x766a0abb,0x81c2c92e,0x92722c85,0xa2bfe8a1,0xa81a664b,0xc24b8b70,0xc76c51a3,0xd192e819,0xd6990624,0xf40e3585,0x106aa070,0x19a4c116,0x1e376c08,0x2748774c,0x34b0bcb5,0x391c0cb3,0x4ed8aa4a,0x5b9cca4f,0x682e6ff3,0x748f82ee,0x78a5636f,0x84c87814,0x8cc70208,0x90befffa,0xa4506ceb,0xbef9a3f7,0xc67178f2]);
  const sha256 = (data) => { const m = __toBuf(data); const l = m.length; const n = ((l + 9 + 63) >> 6) << 6; const b = new Uint8Array(n); b.set(m); b[l] = 0x80; const dv = new DataView(b.buffer); dv.setUint32(n - 4, (l * 8) >>> 0); dv.setUint32(n - 8, Math.floor(l / 0x20000000));
    const H = new Uint32Array([0x6a09e667,0xbb67ae85,0x3c6ef372,0xa54ff53a,0x510e527f,0x9b05688c,0x1f83d9ab,0x5be0cd19]); const W = new Uint32Array(64); const r = (x, k) => (x >>> k) | (x << (32 - k));
    for (let o = 0; o < n; o += 64) { for (let i = 0; i < 16; i++) W[i] = dv.getUint32(o + i * 4); for (let i = 16; i < 64; i++) { const s0 = r(W[i-15],7) ^ r(W[i-15],18) ^ (W[i-15] >>> 3), s1 = r(W[i-2],17) ^ r(W[i-2],19) ^ (W[i-2] >>> 10); W[i] = (W[i-16] + s0 + W[i-7] + s1) >>> 0; }
      let [a, bb, c, d, e, f, g, h] = H; for (let i = 0; i < 64; i++) { const S1 = r(e,6) ^ r(e,11) ^ r(e,25), ch = (e & f) ^ (~e & g), t1 = (h + S1 + ch + K[i] + W[i]) >>> 0, S0 = r(a,2) ^ r(a,13) ^ r(a,22), mj = (a & bb) ^ (a & c) ^ (bb & c), t2 = (S0 + mj) >>> 0; h = g; g = f; f = e; e = (d + t1) >>> 0; d = c; c = bb; bb = a; a = (t1 + t2) >>> 0; }
      H[0] += a; H[1] += bb; H[2] += c; H[3] += d; H[4] += e; H[5] += f; H[6] += g; H[7] += h; }
    const out = __B.alloc(32); for (let i = 0; i < 8; i++) out.writeUInt32BE(H[i] >>> 0, i * 4); return out; };
  const hmac = (key, msg) => { let k = __toBuf(key); if (k.length > 64) k = sha256(k); const kp = __B.alloc(64); k.copy(kp); const ip = __B.alloc(64), op = __B.alloc(64); for (let i = 0; i < 64; i++) { ip[i] = kp[i] ^ 0x36; op[i] = kp[i] ^ 0x5c; } return sha256(__B.concat([op, sha256(__B.concat([ip, __toBuf(msg)]))])); };
  const ab = b => b.buffer.slice(b.byteOffset, b.byteOffset + b.length);
  __G.crypto = { getRandomValues(a) { for (let i = 0; i < a.length; i++) a[i] = Math.floor(Math.random() * 256); return a; },
    randomUUID() { const h = [...crypto.getRandomValues(new Uint8Array(16))].map(x => x.toString(16).padStart(2, "0")).join(""); return `${h.slice(0,8)}-${h.slice(8,12)}-4${h.slice(13,16)}-a${h.slice(17,20)}-${h.slice(20,32)}`; },
    subtle: { async digest(alg, data) { return ab(sha256(data)); }, async importKey(fmt, raw) { return { raw: __toBuf(raw) }; }, async sign(alg, key, data) { return ab(hmac(key.raw, data)); } } };
}

function __name(t, v) { try { Object.defineProperty(t, "name", { value: v, configurable: true }); } catch {} return t; }
function __name2(t, v) { return __name(t, v); }
function __name22(t, v) { return __name(t, v); }
var __defProp = Object.defineProperty, __defProp2 = Object.defineProperty;

// owner_hub.js
var HUB_DO = "__hub_v1";
var H = 3600;
var HUB_DEFAULT_CFG = { quiet: true, start: 23, end: 7, pay_urgent: true, ext: {} };
var URGENT_KINDS = /* @__PURE__ */ new Set(["paid", "capture", "wrong_number", "ai_down", "wa_locked", "account_update", "ligne2", "send_fail", "urgent", "token", "bot_down", "secours"]);
var PAY_KINDS = /* @__PURE__ */ new Set(["paid", "capture", "wrong_number"]);
var URGENT_RE = /(token|jeton|cl[ée] (instagram|facebook|page|whatsapp)[^.]{0,30}(manquante|expir)|expir[ée]|\b190\b|oauth|131031|locked|bloqu[ée]e? par meta|compte (d[ée]sactiv|suspendu|restreint)|toutes les ia|ia ko|hors service|panne)/i;
var watH = /* @__PURE__ */ __name((sec) => new Date((sec + H) * 1e3).getUTCHours(), "watH");
var watHM = /* @__PURE__ */ __name((sec) => new Date((sec + H) * 1e3).toISOString().slice(11, 16).replace(":", "h"), "watHM");
var nowS = /* @__PURE__ */ __name(() => Math.floor(Date.now() / 1e3), "nowS");
async function hubGet(env, d, k, dflt) {
  try {
    const st = d.convStub(env, HUB_DO);
    if (!st)
      return dflt;
    const r = await st.fetch(`https://conv.do/kv?k=${encodeURIComponent(k)}`);
    if (!r.ok)
      return dflt;
    const v = await r.json();
    return v == null ? dflt : v;
  } catch {
    return dflt;
  }
}
__name(hubGet, "hubGet");
async function hubPut(env, d, k, v) {
  try {
    const st = d.convStub(env, HUB_DO);
    if (st)
      await st.fetch(`https://conv.do/kv?k=${encodeURIComponent(k)}`, { method: "PUT", body: JSON.stringify(v) });
  } catch {
  }
}
__name(hubPut, "hubPut");
async function hubCfg(env, d) {
  return { ...HUB_DEFAULT_CFG, ...await hubGet(env, d, "cfg", {}) };
}
__name(hubCfg, "hubCfg");
async function hubCfgSet(env, d, patch) {
  const cur = await hubCfg(env, d);
  const next = { ...cur, ...patch, ext: { ...cur.ext || {}, ...patch && patch.ext || {} } };
  await hubPut(env, d, "cfg", next);
  return next;
}
__name(hubCfgSet, "hubCfgSet");
function inQuiet(cfg, sec = nowS()) {
  if (!cfg || !cfg.quiet)
    return false;
  const h = watH(sec), s = Number(cfg.start ?? 23), e = Number(cfg.end ?? 7);
  return s > e ? h >= s || h < e : h >= s && h < e;
}
__name(inQuiet, "inQuiet");
async function hubQuietNow(env, d) {
  return inQuiet(await hubCfg(env, d));
}
__name(hubQuietNow, "hubQuietNow");
function isUrgent(kind, body, o = {}, cfg = HUB_DEFAULT_CFG) {
  if (o.urgent === true)
    return true;
  if (o.urgent === false)
    return false;
  const ks = String(kind || "").split(",").map((x) => x.trim());
  if (ks.some((k) => URGENT_KINDS.has(k) && (cfg.pay_urgent !== false || !PAY_KINDS.has(k))))
    return true;
  if (ks.some((k) => /(^|_)urgent$/.test(k)))
    return true;
  if (cfg.pay_urgent !== false && ks.some((k) => /(^|_)(paiement|pay|preuve)s?(_|$)/.test(k)))
    return true;
  if (!o.wa && /(_fail|chef|fb|ig|tt|sales|vente|abonn|prix|sup|bot)/.test(String(kind || "")) && URGENT_RE.test(String(body || "")))
    return true;
  return false;
}
__name(isUrgent, "isUrgent");
function fingerprint(kind, body, wa) {
  const t = String(body || "").toLowerCase().replace(/https?:\S+/g, "").replace(/\d+/g, "#").replace(/\s+/g, " ").trim().slice(0, 160);
  return `${kind}|${wa || ""}|${t}`;
}
__name(fingerprint, "fingerprint");
function dedupTtl(kind, wa) {
  const k = String(kind || "");
  if (wa)
    return 10 * 60;
  if (/_post$/.test(k))
    return 30 * 60;
  if (/(_fail|chef|token|locked|account_update)/.test(k))
    return 6 * H;
  if (/(compte_rendu|summary|rapport)/.test(k))
    return 20 * 60;
  return 2 * H;
}
__name(dedupTtl, "dedupTtl");
async function hubNotify(env, d, body, o = {}) {
  const now = nowS();
  const kind = String(o.kind || "alerte");
  const wa = o.wa ? String(o.wa) : "";
  const text = String(body || "").slice(0, 900);
  if (!text.trim())
    return { skipped: "empty" };
  let cfg = HUB_DEFAULT_CFG, mem = { seen: {}, log: [] };
  try {
    [cfg, mem] = await Promise.all([hubCfg(env, d), hubGet(env, d, "mem", { seen: {}, log: [] })]);
  } catch {
  }
  mem.seen = mem.seen || {};
  mem.log = Array.isArray(mem.log) ? mem.log : [];
  const urgent = isUrgent(kind, text, o, cfg);
  const fp = o.key ? `${kind}|key|${o.key}` : fingerprint(kind, text, wa);
  const ttl = Number(o.dedup_s) >= 0 && o.dedup_s != null ? Number(o.dedup_s) : dedupTtl(kind, wa);
  for (const [k, v] of Object.entries(mem.seen))
    if (!v || now - Number(v.at) > 24 * H)
      delete mem.seen[k];
  const prev = mem.seen[fp];
  let res;
  if (prev && ttl > 0 && now - Number(prev.at) < ttl) {
    prev.n = (prev.n || 1) + 1;
    res = { dedup: true, first_at: prev.at };
  } else {
    mem.seen[fp] = { at: now, n: 1 };
    const quiet = inQuiet(cfg, now) && !urgent;
    if (quiet) {
      if (o.queue === false)
        res = { dropped: "quiet" };
      else {
        try {
          await d.ownerQueuePush(env, { wa, kind, name: o.name || null, body: text, at: now });
        } catch {
        }
        res = { queued: "quiet" };
      }
    } else {
      try {
        res = await d.ownerNotifyRaw(env, text, o);
      } catch (err) {
        res = { error: String(err && err.message || err).slice(0, 120) };
      }
    }
  }
  mem.log.push({ at: now, kind, wa: wa || void 0, urgent: urgent || void 0, r: res.sent ? "envoy\xE9e" : res.dedup ? "doublon" : res.queued === "quiet" ? "nuit" : res.queued ? "en attente" : res.dropped ? "ignor\xE9e" : "erreur", t: text.replace(/\s+/g, " ").slice(0, 140) });
  mem.log = mem.log.slice(-80);
  const keys = Object.keys(mem.seen);
  if (keys.length > 300)
    for (const k of keys.slice(0, keys.length - 300))
      delete mem.seen[k];
  await hubPut(env, d, "mem", mem);
  try {
    await d.logEvent(env, { k: "hub_alert", wa, kind, text: `${res.sent ? "sent" : JSON.stringify(res).slice(0, 60)} ${text.slice(0, 120)}` });
  } catch {
  }
  return { ...res, urgent };
}
__name(hubNotify, "hubNotify");
async function fbCall(env, path, method = "GET", body) {
  if (!env.FB)
    return { status: 599, j: { error: "no FB binding" } };
  try {
    const r = await env.FB.fetch(new Request(`https://eh-facebook${path}${path.includes("?") ? "&" : "?"}key=${encodeURIComponent(env.ADMIN_KEY || "")}`, { method, ...body ? { body: JSON.stringify(body), headers: { "content-type": "application/json" } } : {} }));
    let j = {};
    try {
      j = await r.json();
    } catch {
    }
    return { status: r.status, j };
  } catch (err) {
    return { status: 599, j: { error: String(err && err.message || err) } };
  }
}
__name(fbCall, "fbCall");
async function journalPost(env, from, type, msg) {
  if (!env.FB || !env.ADMIN_KEY)
    return false;
  try {
    const r = await env.FB.fetch(new Request("https://eh-facebook/internal/journal", { method: "POST", headers: { "content-type": "application/json", "x-eh-internal": env.ADMIN_KEY }, body: JSON.stringify({ from, type, msg: String(msg).slice(0, 300) }) }));
    return r.ok;
  } catch {
    return false;
  }
}
__name(journalPost, "journalPost");
var NET = { fb: "Facebook", ig: "Instagram", tt: "TikTok", wa: "WhatsApp" };
var netOf = /* @__PURE__ */ __name((w) => ({ fb: "fb", facebook: "fb", ig: "ig", insta: "ig", instagram: "ig", tt: "tt", tiktok: "tt", tik: "tt", wa: "wa", whatsapp: "wa", watsap: "wa" })[w] || null, "netOf");
var HUB_HELP = `\u{1F4CB} Tes commandes (\xE9cris-les ici, simplement) :

\u{1F4CA} SUIVI
\u2022 statut \u2014 tout en un coup d'\u0153il (bots, posts, clients, prix)
\u2022 rapport \u2014 bilan du jour + conseils pour demain
\u2022 ventes \u2014 les ventes / paiements
\u2022 alertes \u2014 les derni\xE8res alertes
\u2022 journal \u2014 ce que les bots se disent (chef d'\xE9quipe)

\u23EF\uFE0F ROBOTS
\u2022 pause fb / pause ig / pause tt / pause wa
\u2022 reprise fb / reprise ig / reprise tt / reprise wa
\u2022 posts \u2014 posts du jour ; posts ig 80 / posts tt 5 \u2014 changer le nombre par jour

\u{1F4B0} PRIX
\u2022 prix iphone 13 128 \u2014 prix client actuel
\u2022 fournisseurs \u2014 changements de prix fournisseurs en attente
\u2022 valide 2 / valide tout \u2014 accepter un nouveau prix ; refuse 2 \u2014 garder l'ancien
\u2022 fournisseur : (colle la liste du fournisseur) \u2014 je calcule tes prix
\u2022 fournisseur ajoute 229\u2026 \u2014 num\xE9ro de confiance (ses petits changements passent seuls)
\u2022 taux \u2014 taux du dollar du jour

\u{1F319} NUIT
\u2022 nuit on / nuit off \u2014 pas d'alertes de 23h \xE0 7h (sauf urgent : argent re\xE7u, bot bloqu\xE9)

\u{1F465} CLIENTS
\u2022 liste \u2014 clients \xE0 traiter ; r\xE9ponds au 229\u2026 : ton texte
\u2022 pause 229\u2026 / reprends 229\u2026 \u2014 bot en pause sur un client

\xAB aide plus \xBB = toutes les anciennes commandes.`;
async function waBlock(env, d) {
  let flags = [], paused = 0, q = [], h = null, lp = {}, lc = {};
  try {
    flags = await d.listOpenFlags(env);
  } catch {
  }
  try {
    const l = await env.EH_KV.list({ prefix: "pause:", limit: 1e3 });
    paused = l.keys.length;
  } catch {
  }
  try {
    q = await d.ownerQueueGet(env);
  } catch {
  }
  try {
    h = await d.buildWhoSpeaksHealth(env, { forceProbe: false });
  } catch {
  }
  try {
    lp = await d.linePauseGet(env);
    lc = await d.linesCfg(env);
  } catch {
  }
  let aiOff = false;
  try {
    aiOff = await env.EH_KV.get("cfg:ai_enabled") === "0";
  } catch {
  }
  const pay = flags.filter((f) => f.reason === "paiement_a_verifier").length;
  return { flags, paused, q, h, lp, lc, aiOff, pay };
}
__name(waBlock, "waBlock");
async function supBlock(env, d) {
  try {
    return d.supStatusBrief ? await d.supStatusBrief(env) : null;
  } catch {
    return null;
  }
}
__name(supBlock, "supBlock");
async function buildStatut(env, d) {
  const now = nowS();
  const [wa, chef, cfg, sup, mem] = await Promise.all([waBlock(env, d), fbCall(env, "/chef/status"), hubCfg(env, d), supBlock(env, d), hubGet(env, d, "mem", { log: [] })]);
  const t = chef.j && chef.j.today || {};
  const ext = cfg.ext || {};
  const locked53 = (mem.log || []).some((x) => x.kind === "wa_locked" && now - x.at < 72 * H) || /bloqu/i.test(ext.meta53 || "");
  const l = [];
  l.push(`\u{1F4CA} Statut Electronic HOUSE \u2014 ${watHM(now)}`);
  l.push(`\u{1F4AC} WhatsApp : ${wa.aiOff ? "bot arr\xEAt\xE9" : wa.lp.all ? "bot en PAUSE (toutes lignes)" : "bot actif"}${wa.h ? wa.h.replies_ok ? ", IA OK" : ", IA en difficult\xE9 (filet actif)" : ""}`);
  l.push(`   Ligne 59 : ${wa.lp.all || wa.lp["1"] ? "pause" : "OK"} \xB7 Ligne 53 : ${locked53 ? "bloqu\xE9e par Meta" : wa.lc && wa.lc.WA_STATUT && /^\d{10,}$/.test(String(wa.lc.WA_STATUT)) ? "branch\xE9e" : "en attente"}${ext.meta53 ? ` (${ext.meta53})` : ""}`);
  l.push(`   Clients \xE0 traiter : ${wa.flags.length}${wa.pay ? ` (dont ${wa.pay} paiement(s) \xE0 v\xE9rifier)` : ""} \xB7 bot en pause sur ${wa.paused} client(s)`);
  if (chef.status === 200) {
    l.push(`\u{1F4D8} Facebook : ${t.fb && t.fb.on ? "ON" : "OFF"} \xB7 ${t.fb ? t.fb.n : 0}/${t.fb ? t.fb.target : 45} posts${t.fb && t.fb.fails ? ` \xB7 ${t.fb.fails} \xE9chec(s)` : ""}`);
    l.push(`\u{1F4F8} Instagram : ${t.ig && t.ig.on ? "ON" : "OFF"} \xB7 ${t.ig ? t.ig.n : 0}/${t.ig ? t.ig.target : 50} posts (limite Meta 100/24 h)${t.ig && t.ig.replies ? ` \xB7 ${t.ig.replies} r\xE9ponse(s)` : ""}${t.ig && t.ig.fails ? ` \xB7 ${t.ig.fails} \xE9chec(s)` : ""}`);
    l.push(`\u{1F3B5} TikTok : ${t.tt && t.tt.on ? "ON" : "OFF"} \xB7 ${t.tt ? t.tt.n : 0}/${t.tt ? t.tt.target : 5}${ext.tiktok ? ` (${ext.tiktok})` : ""}`);
    const iss = chef.j.brain && chef.j.brain.health && chef.j.brain.health.issues || [];
    if (iss.length)
      l.push(`\u{1F9E0} Chef d'\xE9quipe : ${iss.slice(0, 2).map((x) => x && (x.msg || x) || "").join(" ; ").slice(0, 200)}`);
  } else
    l.push(`\u26A0\uFE0F Robots r\xE9seaux (eh-facebook) : pas de r\xE9ponse (${chef.status})`);
  if (sup)
    l.push(`\u{1F4B0} Prix fournisseurs : ${sup.pending ? `${sup.pending} en attente de ta validation (\xAB fournisseurs \xBB)` : "rien en attente"}${sup.rate ? ` \xB7 1 $ = ${sup.rate} F (officiel)` : ""}`);
  l.push(`\u{1F514} Alertes en attente : ${wa.q.length} \xB7 nuit 23h\u20137h : ${cfg.quiet ? "ON" : "OFF"}`);
  l.push(`\xAB aide \xBB pour les commandes.`);
  return l.join("\n");
}
__name(buildStatut, "buildStatut");
async function buildRapport(env, d) {
  const now = nowS();
  const [st, chef, sup, mem] = await Promise.all([buildStatut(env, d), fbCall(env, "/chef/status"), supBlock(env, d), hubGet(env, d, "mem", { log: [] })]);
  const t = chef.j && chef.j.today || {};
  const ai = chef.j && chef.j.brain && chef.j.brain.ai || null;
  const today = (mem.log || []).filter((x) => now - x.at < 24 * H);
  const lines = [st.replace(/\n« aide » pour les commandes\.$/, "")];
  lines.push("");
  lines.push(`\u{1F4C8} Aujourd'hui : ${(t.fb ? t.fb.n : 0) + (t.ig ? t.ig.n : 0) + (t.tt ? t.tt.n : 0)} posts au total \xB7 ${today.length} alerte(s) re\xE7ue(s) (${today.filter((x) => x.urgent).length} urgente(s))`);
  if (sup && sup.today)
    lines.push(`\u{1F4B0} Prix : ${sup.today.auto} changement(s) appliqu\xE9(s) seul(s), ${sup.today.pending} \xE0 valider, ${sup.today.new} nouveau(x) produit(s)`);
  const tips = [];
  if (t.ig && t.ig.target && t.ig.n < t.ig.target * 0.5 && watH(now) >= 18)
    tips.push("Instagram en retard sur son plan : v\xE9rifie \xAB statut \xBB demain matin.");
  if (sup && sup.pending)
    tips.push(`Valide ou refuse les ${sup.pending} prix fournisseurs en attente (\xAB fournisseurs \xBB).`);
  if (t.tt && !t.tt.on)
    tips.push("TikTok attend la r\xE9ponse de l'audit : rien \xE0 faire pour l'instant.");
  tips.push("Google One Gemini reste le produit n\xB01 \xE0 pousser (posts + statuts).");
  lines.push(`\u{1F4A1} Pour demain :
\u2022 ${tips.slice(0, 4).join("\n\u2022 ")}`);
  if (d.extraReport) {
    try {
      const x = await d.extraReport(env);
      if (x)
        lines.push("", x);
    } catch {
    }
  }
  lines.push("Le compte rendu complet arrive chaque soir \xE0 20h.");
  return lines.join("\n").slice(0, 3800);
}
__name(buildRapport, "buildRapport");
var SALES_CMD_RE = /^(ventes?( (jour|aujourd hui|hier|semaine|mois|7j|30j|aide|help|\?))?|crm( .*)?|aide ventes?|impayes?|impaye|a payer|non payes?|preuves?( a verifier)?|paiements?( a verifier)?|abos?( .*)?|abonnements?( (expirent|fin|7j|semaine))?|avis( (on|off|liste|list))?|bilan|bilan ventes|rapport ventes|(annule|annuler|supprime) .*[vpa]\d+|(refuse|refuser|rejette|faux) [pa]\d+|(publie|publier) a\d+|fin v\d+ .*|(payee?|paye|reglee?|encaissee?) .+|vente .+)$/;
async function hubCommand(env, d, e, rawText, say) {
  const n = d.norm(String(rawText || "")).replace(/[’']/g, "'").replace(/[!.?]+$/, "").replace(/\s+/g, " ").trim();
  if (!n)
    return false;
  if (SALES_CMD_RE.test(n))
    return false;
  const now = nowS();
  if (/^(aide|help|menu|commandes?|\?)$/.test(n)) {
    await say(HUB_HELP);
    return true;
  }
  if (/^(aide|help) (plus|tout|toutes|ancien|anciennes|complete?)$/.test(n)) {
    await say(d.OWNER_HELP_OLD || HUB_HELP);
    return true;
  }
  if (/^(statut|status|etat|etat general|point)$/.test(n)) {
    await say(await buildStatut(env, d));
    return true;
  }
  if (/^(rapport|resume|recap|compte rendu)( du jour)?$/.test(n)) {
    await say(await buildRapport(env, d));
    return true;
  }
  if (/^(alertes?|historique|historique alertes?|dernieres alertes)$/.test(n)) {
    const mem = await hubGet(env, d, "mem", { log: [] });
    let q = [];
    try {
      q = await d.ownerQueueGet(env);
    } catch {
    }
    const last = (mem.log || []).slice(-12).reverse();
    await say(last.length ? `\u{1F514} Derni\xE8res alertes (${q.length} en attente) :
${last.map((x) => `\u2022 ${watHM(x.at)} ${x.urgent ? "\u{1F6A8} " : ""}${x.t}${x.r !== "envoy\xE9e" ? ` [${x.r}]` : ""}`).join("\n")}`.slice(0, 3500) : "\u{1F514} Aucune alerte r\xE9cente.");
    return true;
  }
  if (/^(journal|equipe journal|journal equipe)$/.test(n)) {
    let j = null;
    try {
      const r = await env.FB.fetch(new Request("https://eh-facebook/internal/journal", { headers: { "x-eh-internal": env.ADMIN_KEY || "" } }));
      j = await r.json();
    } catch {
    }
    const rows = (j && j.journal || []).slice(-8).reverse();
    await say(rows.length ? `\u{1F9E0} Journal de l'\xE9quipe (derniers) :
${rows.map((x) => `\u2022 ${watHM(Math.floor(x.at / 1e3))} [${x.from}] ${String(x.msg).slice(0, 160)}`).join("\n")}`.slice(0, 3500) : "\u{1F9E0} Journal vide pour l'instant.");
    return true;
  }
  let m = n.match(/^nuit (on|off|oui|non|marche|arret)$/);
  if (m) {
    const on = /^(on|oui|marche)$/.test(m[1]);
    const c = await hubCfgSet(env, d, { quiet: on });
    await say(on ? `\u{1F319} Mode nuit ON : de ${c.start}h \xE0 ${c.end}h, pas d'alertes sauf urgent (argent re\xE7u, bot ou Meta bloqu\xE9). Le reste arrive en un seul message apr\xE8s ${c.end}h.` : "\u{1F514} Mode nuit OFF : toutes les alertes arrivent tout de suite, m\xEAme la nuit.");
    return true;
  }
  m = n.match(/^nuit paiements? (on|off)$/);
  if (m) {
    await hubCfgSet(env, d, { pay_urgent: m[1] === "on" });
    await say(m[1] === "on" ? "\u{1F4B0} La nuit, les paiements clients te sont quand m\xEAme signal\xE9s tout de suite." : "\u{1F4B0} La nuit, les paiements attendent aussi 7h.");
    return true;
  }
  m = n.match(/^(pause|coupe|reprise|reprends|reprend|relance|demarre|active) (fb|facebook|ig|insta|instagram|tt|tiktok|wa|whatsapp)$/);
  if (m) {
    const net = netOf(m[2]);
    const on = /^(reprise|reprends|reprend|relance|demarre|active)$/.test(m[1]);
    let txt;
    if (net === "wa") {
      await d.ownerLinesCommand(env, e.phone_number_id || d.OWNER_PHONE_DEFAULT, e.from, on ? "reprends tout" : "pause tout", now);
      try {
        await journalPost(env, "patron", "ordre", `WhatsApp ${on ? "relanc\xE9" : "en pause"} par le patron`);
      } catch {
      }
      return true;
    }
    const path = net === "fb" ? `/admin/enable?on=${on ? 1 : 0}` : net === "ig" ? `/ig/enable?on=${on ? 1 : 0}` : `/tiktok/enable?on=${on ? 1 : 0}`;
    const r = await fbCall(env, path, "POST");
    if (r.status !== 200)
      txt = `\u26A0\uFE0F ${NET[net]} : je n'ai pas pu ${on ? "relancer" : "mettre en pause"} (erreur ${r.status}).`;
    else
      txt = on ? `\u25B6\uFE0F ${NET[net]} relanc\xE9.${net === "tt" ? " (TikTok attend toujours l'audit : il pr\xE9pare des brouillons, pas de publication directe.)" : ""} \xAB pause ${net} \xBB pour couper.` : `\u23F8 ${NET[net]} en pause : plus aucune publication${net === "tt" ? "" : " ni r\xE9ponse automatique"} sur ${NET[net]}. \xAB reprise ${net} \xBB pour relancer.`;
    try {
      await journalPost(env, "patron", "ordre", `${NET[net]} ${on ? "relanc\xE9" : "en pause"} par le patron`);
    } catch {
    }
    await say(txt);
    return true;
  }
  m = n.match(/^posts?(?: (fb|facebook|ig|insta|instagram|tt|tiktok))?(?: (\d{1,3}))?(?: par jour| ?\/ ?jour)?$/);
  if (m) {
    const net = m[1] ? netOf(m[1]) : null, want = m[2] ? Number(m[2]) : null;
    const chef = await fbCall(env, "/chef/status");
    const t = chef.j && chef.j.today || {};
    if (net && want != null) {
      let txt;
      if (net === "ig") {
        const v = Math.max(1, Math.min(95, want));
        const r = await fbCall(env, `/ig/enable?on=${t.ig && t.ig.on ? 1 : 0}&per_day=${v}`, "POST");
        txt = r.status === 200 ? `\u{1F4F8} Instagram : ${r.j.per_day || v} posts par jour${want > 95 ? " (95 maximum : Meta bloque \xE0 100 par 24 h)" : ""}.` : `\u26A0\uFE0F Instagram : erreur ${r.status}.`;
      } else if (net === "tt") {
        const v = Math.max(1, Math.min(15, want));
        await env.EH_KV.put("cfg:tt_per_day", String(v));
        txt = `\u{1F3B5} TikTok : ${v} posts par jour${want > 15 ? " (15 maximum)" : ""}.`;
      } else
        txt = `\u{1F4D8} Facebook reste \xE0 ${t.fb ? t.fb.target : 45} posts par jour (r\xE9glage fixe, pour ne pas \xEAtre frein\xE9 par Meta).`;
      try {
        await journalPost(env, "patron", "ordre", txt);
      } catch {
      }
      await say(txt);
      return true;
    }
    await say(`\u{1F4C5} Posts aujourd'hui :
\u2022 Facebook ${t.fb ? t.fb.n : 0}/${t.fb ? t.fb.target : 45}${t.fb && !t.fb.on ? " (OFF)" : ""}
\u2022 Instagram ${t.ig ? t.ig.n : 0}/${t.ig ? t.ig.target : 50}${t.ig && !t.ig.on ? " (OFF)" : ""}
\u2022 TikTok ${t.tt ? t.tt.n : 0}/${t.tt ? t.tt.target : 5}${t.tt && !t.tt.on ? " (OFF)" : ""}
Pour changer : \xAB posts ig 80 \xBB ou \xAB posts tt 5 \xBB.`);
    return true;
  }
  if (d.supCommand) {
    const r = await d.supCommand(env, e, rawText, n);
    if (r) {
      await say(r);
      return true;
    }
  }
  if (!e.context_id && d.supLooksLikeList && d.supLooksLikeList(rawText) && !/^\s*(r[ée]ponds?|dis|dit|envoie|[àa]u?|demande|promo(tion)?|explique|propose|rappelle|pr[ée]viens|informe)\b/i.test(String(rawText))) {
    const r = await d.supParseList(env, rawText, { src: "patron", trusted: false });
    if (r && r.ok && r.list) {
      await say(`${d.proposalsText(r)}
\u2139\uFE0F Liste re\xE7ue sans \xAB fournisseur : \xBB : rien n'est appliqu\xE9 seul, valide ce que tu veux.`);
      return true;
    }
  }
  return false;
}
__name(hubCommand, "hubCommand");

// supplier_overlay.js
var OVERLAY_KEY = "sup:overlay";
function entryKey(e) {
  return `${e.name}|${e.storage || ""}|${e.ram || ""}|${e.cond || ""}|${e.source}`;
}
__name(entryKey, "entryKey");
function overlayApply(entries, ov, { allowAdd = false, mark = false } = {}) {
  const out = { applied: 0, held: 0, added: 0, stale: [] };
  if (!Array.isArray(entries) || !ov || !ov.items)
    return out;
  const idx = new Map(entries.map((e, i) => [entryKey(e), i]));
  for (const [k, it] of Object.entries(ov.items)) {
    if (!it || !Number.isFinite(Number(it.price)) || Number(it.price) <= 0)
      continue;
    if (it.mode === "add") {
      if (allowAdd && !idx.has(k) && it.entry) {
        entries.push({ ...it.entry, price: Number(it.price), ...mark ? { sup: "add" } : {} });
        out.added++;
      }
      continue;
    }
    const i = idx.get(k);
    if (i == null) {
      out.stale.push(k);
      continue;
    }
    const e = entries[i];
    if (Number(e.price) !== Number(it.base)) {
      out.stale.push(k);
      continue;
    }
    entries[i] = { ...e, price: Number(it.price), ...mark ? { sheet_price: e.price, sup: it.mode } : {} };
    if (it.mode === "hold")
      out.held++;
    else
      out.applied++;
  }
  return out;
}
__name(overlayApply, "overlayApply");

// supplier_prices.js
var DO_NAME = "__sup_v1";
var H2 = 3600;
var SHEET_RATE = 600;
var XOF_PER_EUR = 655.957;
var AUTO_PCT = 10;
var SRC_USD_URL = /* @__PURE__ */ __name((id) => `https://docs.google.com/spreadsheets/d/${id}/gviz/tq?tqx=out:csv&sheet=Source_USD`, "SRC_USD_URL");
var nowS2 = /* @__PURE__ */ __name(() => Math.floor(Date.now() / 1e3), "nowS");
var watIso = /* @__PURE__ */ __name((sec) => new Date((sec + H2) * 1e3).toISOString().slice(0, 16).replace("T", " "), "watIso");
var watDate = /* @__PURE__ */ __name((sec) => new Date((sec + H2) * 1e3).toISOString().slice(0, 10), "watDate");
var fmtF = /* @__PURE__ */ __name((n) => String(Math.round(Number(n) || 0)).replace(/\B(?=(\d{3})+(?!\d))/g, " "), "fmtF");
var pctStr = /* @__PURE__ */ __name((p) => `${p > 0 ? "+" : ""}${Math.round(p)} %`, "pctStr");
async function sget(env, d, k, dflt) {
  try {
    const st = d.convStub(env, DO_NAME);
    if (!st)
      return dflt;
    const r = await st.fetch(`https://conv.do/kv?k=${encodeURIComponent(k)}`);
    if (!r.ok)
      return dflt;
    const v = await r.json();
    return v == null ? dflt : v;
  } catch {
    return dflt;
  }
}
__name(sget, "sget");
async function sput(env, d, k, v) {
  try {
    const st = d.convStub(env, DO_NAME);
    if (st)
      await st.fetch(`https://conv.do/kv?k=${encodeURIComponent(k)}`, { method: "PUT", body: JSON.stringify(v) });
  } catch {
  }
}
__name(sput, "sput");
async function histAdd(env, d, rows) {
  if (!rows.length)
    return;
  const h = await sget(env, d, "hist", []);
  await sput(env, d, "hist", h.concat(rows).slice(-600));
}
__name(histAdd, "histAdd");
async function overlayGet(env) {
  try {
    return await env.EH_KV.get(OVERLAY_KEY, "json") || { v: 1, items: {} };
  } catch {
    return { v: 1, items: {} };
  }
}
__name(overlayGet, "overlayGet");
async function overlayPut(env, ov) {
  ov.at = Date.now();
  await env.EH_KV.put(OVERLAY_KEY, JSON.stringify(ov));
}
__name(overlayPut, "overlayPut");
function majoration(conv) {
  return conv <= 5e4 ? 1e4 : conv <= 1e5 ? 15e3 : conv <= 15e4 ? 2e4 : conv <= 2e5 ? 3e4 : conv <= 25e4 ? 4e4 : 4e4 + Math.ceil((conv - 25e4) / 5e4) * 1e4;
}
__name(majoration, "majoration");
function digitalClient(usd, rate = SHEET_RATE) {
  const conv = Math.round(usd * rate / 100) * 100;
  return conv + majoration(conv);
}
__name(digitalClient, "digitalClient");
function digitalClientFromFcfa(fcfa) {
  const conv = Math.round(fcfa / 100) * 100;
  return conv + majoration(conv);
}
__name(digitalClientFromFcfa, "digitalClientFromFcfa");
function parseMoney(s) {
  let t = String(s == null ? "" : s).replace(/^(unit price|prix usd|prix|price)\s*/i, "").replace(/[$€\s\u00a0\u202f]|usd|eur/gi, "");
  if (!t)
    return NaN;
  if (t.includes(",") && t.includes("."))
    t = t.lastIndexOf(",") > t.lastIndexOf(".") ? t.replace(/\./g, "").replace(",", ".") : t.replace(/,/g, "");
  else if (t.includes(","))
    t = /,\d{3}$/.test(t) && !/^\d{1,3},\d{3},/.test(t) && t.split(",")[0].length <= 3 && Number(t.replace(",", "")) >= 1e3 ? t.replace(",", "") : t.replace(",", ".");
  const v = Number(t);
  return Number.isFinite(v) ? v : NaN;
}
__name(parseMoney, "parseMoney");
async function supRate(env, d, { force = false } = {}) {
  const now = nowS2();
  const cur = await sget(env, d, "rate", null);
  if (!force && cur && (cur.date_wat === watDate(now) || now - Number(cur.try_at || 0) < 3 * H2))
    return cur;
  let next = null;
  try {
    const r = await fetch("https://api.frankfurter.app/latest?from=USD&to=EUR", { signal: AbortSignal.timeout(8e3) });
    const j = await r.json();
    const eur = Number(j && j.rates && j.rates.EUR);
    if (r.ok && eur > 0.3 && eur < 3)
      next = { eur_per_usd: eur, xof_per_usd: Math.round(eur * XOF_PER_EUR * 100) / 100, ecb_date: j.date, src: "BCE (frankfurter.app)" };
  } catch {
  }
  if (!next) {
    try {
      const r = await fetch("https://open.er-api.com/v6/latest/USD", { signal: AbortSignal.timeout(8e3) });
      const j = await r.json();
      const x = Number(j && j.rates && j.rates.XOF);
      if (r.ok && x > 200 && x < 2e3)
        next = { eur_per_usd: Math.round(x / XOF_PER_EUR * 1e5) / 1e5, xof_per_usd: x, ecb_date: (j.time_last_update_utc || "").slice(5, 16), src: "open.er-api.com" };
    } catch {
    }
  }
  const out = next ? { ...next, at: now, try_at: now, date_wat: watDate(now) } : { ...cur || {}, try_at: now, error: "taux indisponible" };
  await sput(env, d, "rate", out);
  if (next && next.xof_per_usd > SHEET_RATE && (!cur || cur.alert_day !== watDate(now))) {
    out.alert_day = watDate(now);
    await sput(env, d, "rate", out);
    try {
      await d.hubNotify(env, `\u{1F4B1} Le dollar monte : 1 $ = ${Math.round(next.xof_per_usd)} F (taux officiel), plus que les 600 F/$ de ta feuille Produits Digitaux. Tes marges logiciels baissent : dis-moi si on passe la feuille \xE0 ${Math.ceil(next.xof_per_usd / 10) * 10} F/$.`, { kind: "sup_rate", key: `rate:${watDate(now)}` });
    } catch {
    }
  }
  return out;
}
__name(supRate, "supRate");
function phoneRate(rate) {
  return Math.max(SHEET_RATE, Number(rate && rate.xof_per_usd) || 0);
}
__name(phoneRate, "phoneRate");
function parseSourceUsd(d, csv) {
  const rows = d.parseCsv(csv);
  const out = {};
  for (const r of rows) {
    if (!r || r.length < 3)
      continue;
    let name = String(r[1] || "").replace(/^product name\s*/i, "").replace(/\s+/g, " ").trim();
    if (!name || name.startsWith("---") || /^produit$/i.test(name))
      continue;
    const usd = parseMoney(r[2]);
    if (usd > 0 && usd < 1e5)
      out[name] = usd;
  }
  return out;
}
__name(parseSourceUsd, "parseSourceUsd");
async function supDigitalCheck(env, d, { dry = false, now = nowS2(), csv = null } = {}) {
  const res = { ok: false, dry, at: watIso(now) };
  try {
    if (!csv) {
      const r = await fetch(SRC_USD_URL(d.SHEET_DIGITAL), { redirect: "follow", headers: { "User-Agent": "EH-SupplierBot/1.0" }, signal: AbortSignal.timeout(15e3) });
      if (!r.ok || !(r.headers.get("content-type") || "").includes("csv"))
        throw new Error(`Source_USD HTTP ${r.status}`);
      csv = await r.text();
    }
    const cur = parseSourceUsd(d, csv);
    res.n = Object.keys(cur).length;
    if (res.n < 100)
      throw new Error(`Source_USD : seulement ${res.n} prix lus (feuille fournisseur vide ?)`);
    const snap = await sget(env, d, "snap", null);
    if (!snap || !snap.usd) {
      if (!dry)
        await sput(env, d, "snap", { at: now, usd: cur });
      return { ...res, ok: true, baseline: true };
    }
    const changes = [], news = [], removed = [];
    for (const [name, usd] of Object.entries(cur)) {
      if (!(name in snap.usd))
        news.push({ name, usd });
      else if (Math.abs(snap.usd[name] - usd) > 1e-9)
        changes.push({ name, old: snap.usd[name], usd });
    }
    for (const name of Object.keys(snap.usd))
      if (!(name in cur))
        removed.push({ name, usd: snap.usd[name] });
    Object.assign(res, { changes: changes.length, news: news.length, removed: removed.length });
    if (!changes.length && !news.length && !removed.length)
      return { ...res, ok: true, nothing: true };
    if (changes.length + news.length + removed.length > 120) {
      res.error = "trop de changements d'un coup (feuille fournisseur r\xE9organis\xE9e ?) : rien bloqu\xE9";
      if (!dry)
        await d.hubNotify(env, `\u26A0\uFE0F Prix fournisseur logiciels : ${changes.length} prix chang\xE9s, ${news.length} nouveaux, ${removed.length} retir\xE9s d'un coup. Je ne bloque rien (feuille fournisseur r\xE9organis\xE9e ?). V\xE9rifie la feuille Produits Digitaux.`, { kind: "sup_bulk", key: `bulk:${watDate(now)}` });
      if (!dry)
        await sput(env, d, "snap", { at: now, usd: cur });
      return res;
    }
    const ov = await overlayGet(env);
    let ovChanged = false;
    const pend = await sget(env, d, "pend", []);
    let seq = Number(await sget(env, d, "seq", 0)) || 0;
    const hist = [], holds = [], autos = [], newsVis = [];
    for (const c of changes) {
      const oldC = digitalClient(c.old), newC = digitalClient(c.usd);
      const e = d.digitalEntry(c.name, newC);
      if (!e) {
        hist.push(row(now, "Tikeys (Source_USD)", c.name, "USD", c.old, c.usd, oldC, newC, "masqu\xE9 (hors catalogue)"));
        continue;
      }
      const key = entryKey(e);
      const prevHold = ov.items[key] && ov.items[key].mode === "hold" ? ov.items[key] : null;
      const eff = prevHold ? Number(prevHold.price) : oldC;
      const pct = (newC - eff) / eff * 100;
      for (let i = pend.length - 1; i >= 0; i--)
        if (pend[i].key === key)
          pend.splice(i, 1);
      if (Math.abs(pct) < AUTO_PCT) {
        if (prevHold) {
          delete ov.items[key];
          ovChanged = true;
        }
        if (newC !== eff) {
          autos.push({ label: e.name, old: eff, new: newC, pct });
          hist.push(row(now, "Tikeys (Source_USD)", e.name, "USD", c.old, c.usd, eff, newC, "appliqu\xE9 seul (< 10 %)"));
        }
      } else {
        const id = ++seq;
        ov.items[key] = { price: eff, base: newC, mode: "hold", id, why: `Tikeys ${c.old} \u2192 ${c.usd} $`, at: now, label: e.name };
        ovChanged = true;
        pend.push({ id, kind: "digital", key, label: e.name, old: eff, new: newC, pct: Math.round(pct), cur: "USD", sup_old: c.old, sup_new: c.usd, src: "Tikeys (Source_USD)", at: now });
        holds.push({ id, label: e.name, old: eff, new: newC, pct });
        hist.push(row(now, "Tikeys (Source_USD)", e.name, "USD", c.old, c.usd, eff, newC, `en attente n\xB0${id} (clients gardent ${fmtF(eff)} F)`));
      }
    }
    for (const nw of news) {
      const newC = digitalClient(nw.usd);
      const e = d.digitalEntry(nw.name, newC);
      if (!e)
        continue;
      newsVis.push({ label: e.name, new: newC });
      hist.push(row(now, "Tikeys (Source_USD)", e.name, "USD", "", nw.usd, "", newC, "nouveau produit (en ligne)"));
    }
    for (const rm of removed) {
      const e = d.digitalEntry(rm.name, digitalClient(rm.usd));
      if (e)
        hist.push(row(now, "Tikeys (Source_USD)", e.name, "USD", rm.usd, "", digitalClient(rm.usd), "", "retir\xE9 par le fournisseur"));
    }
    Object.assign(res, { holds, autos: autos.length, new_visible: newsVis.length, hist: hist.length });
    if (!dry) {
      if (ovChanged)
        await overlayPut(env, ov);
      await sput(env, d, "pend", pend.slice(-60));
      await sput(env, d, "seq", seq);
      await histAdd(env, d, hist);
      await sput(env, d, "snap", { at: now, usd: cur });
      if (holds.length || newsVis.length) {
        const L = [];
        if (holds.length) {
          L.push(`\u{1F4B0} Prix fournisseur logiciels : ${holds.length} gros changement(s) \xE0 valider`);
          for (const h of holds.slice(0, 10))
            L.push(`${h.id}. ${h.label} : ${fmtF(h.old)} \u2192 ${fmtF(h.new)} F (${pctStr(h.pct)}) \u2014 les clients gardent ${fmtF(h.old)} F en attendant`);
          if (holds.length > 10)
            L.push(`\u2026 et ${holds.length - 10} autre(s) (\xAB fournisseurs \xBB)`);
          L.push("\xAB valide 1 \xBB ou \xAB valide tout \xBB = nouveau prix ; \xAB refuse 1 \xBB = garder l'ancien.");
        }
        if (autos.length)
          L.push(`${autos.length} petit(s) changement(s) (< 10 %) appliqu\xE9(s) seul(s).`);
        if (newsVis.length)
          L.push(`\u{1F195} ${newsVis.length} nouveau(x) logiciel(s) chez le fournisseur : ${newsVis.slice(0, 5).map((x) => `${x.label} (${fmtF(x.new)} F)`).join(", ")}${newsVis.length > 5 ? "\u2026" : ""}`);
        await d.hubNotify(env, L.join("\n"), { kind: "sup_price" });
      }
      try {
        await d.journalPost(env, "prix", "prix", `Fournisseur logiciels : ${autos.length} petit(s) changement(s) appliqu\xE9(s), ${holds.length} en attente du patron, ${newsVis.length} nouveau(x), ${removed.length} retir\xE9(s).`);
      } catch {
      }
    }
    res.ok = true;
  } catch (err) {
    res.error = String(err && err.message || err).slice(0, 200);
  }
  return res;
}
__name(supDigitalCheck, "supDigitalCheck");
function row(at, src, produit, devise, supOld, supNew, cliOld, cliNew, decision, id) {
  return { at, src, produit, devise, sup_old: supOld, sup_new: supNew, cli_old: cliOld, cli_new: cliNew, pct: cliOld && cliNew ? Math.round((cliNew - cliOld) / cliOld * 1e3) / 10 : "", decision };
}
__name(row, "row");
var PRICE_LINE = /(\$\s?\d|\d[\d\s.,]*\s?(\$|usd|dollars?|fcfa|cfa|xof|f\b|frs?\b|k\b|mil\b|€|eur)|[:=\-–]\s*\d{2,3}[\s.,]?\d{3}\b|\b\d{2,3}[\s.]\d{3}\b|\b\d{5,7}\b)/i;
var LIST_WORDS = /(prix|price|tarif|wholesale|grossiste|revendeur|liste|list|stock|arrivage|dispo|available|new arrival|promo)/i;
function looksLikePriceList(text, { strict = true } = {}) {
  const t = String(text || "");
  if (t.length < 25 || t.length > 8e3)
    return false;
  const lines = t.split(/\n+/).map((x) => x.trim()).filter(Boolean);
  const pl = lines.filter((l) => PRICE_LINE.test(l) && /[a-z]{2,}/i.test(l.replace(PRICE_LINE, ""))).length;
  if (strict)
    return pl >= 4 || pl >= 3 && LIST_WORDS.test(t);
  return pl >= 1;
}
__name(looksLikePriceList, "looksLikePriceList");
var SYS_EXTRACT = `Tu lis des messages de FOURNISSEURS d'une boutique d'\xE9lectronique (t\xE9l\xE9phones, montres, tablettes, logiciels/abonnements).
R\xE9ponds UNIQUEMENT avec un objet JSON valide, sans texte autour :
{"liste_prix": true ou false, "devise_defaut": "USD" ou "FCFA" ou "EUR", "articles": [{"produit": "nom du mod\xE8le sans le prix", "stockage": "128 Go" ou null, "ram": "8" ou null, "etat": "neuf" ou "occasion" ou null, "prix": nombre, "devise": "USD" ou "FCFA" ou "EUR"}]}
R\xE8gles : liste_prix=false si c'est un client qui demande un prix ou une question. "neuf" pour scell\xE9/new/sealed, "occasion" pour venu/used/UK used/US used. Prix en milliers ("245k", "245 mil") \u2192 245000. "$", "usd", "dollars" \u2192 USD ; "F", "FCFA", "CFA", "XOF" \u2192 FCFA. Une ligne = un article ; si un mod\xE8le a plusieurs capacit\xE9s avec des prix diff\xE9rents, fais un article par capacit\xE9. Maximum 40 articles. N'invente rien.`;
function fallbackExtract(text) {
  const arts = [];
  for (const l of String(text).split(/\n+/)) {
    const m = l.match(/^(.*?[a-z].*?)\s*[:=\-–]?\s*(\$?\s?\d[\d\s.,]*\s*(k|mil|\$|usd|fcfa|cfa|f)?)\s*$/i);
    if (!m)
      continue;
    let p = parseMoney(m[2].replace(/k|mil|fcfa|cfa|f$/gi, ""));
    if (/k|mil/i.test(m[2]))
      p *= 1e3;
    if (!(p > 0))
      continue;
    arts.push({ produit: m[1].replace(/[*•\-–:]+$/g, "").trim(), prix: p, devise: /\$|usd/i.test(m[2]) ? "USD" : p < 3e3 ? "USD" : "FCFA" });
  }
  return { liste_prix: arts.length >= 2, articles: arts.slice(0, 40) };
}
__name(fallbackExtract, "fallbackExtract");
async function aiExtract(env, d, text) {
  let j = null, provider = null;
  try {
    const r = await d.runAiChain(env, [{ role: "system", content: SYS_EXTRACT }, { role: "user", content: String(text).slice(0, 5e3) }], { max_tokens: 1400, temperature: 0, deadline: Date.now() + 22e3 });
    provider = r && r.provider;
    const m = r && r.ok && String(r.text || "").match(/\{[\s\S]*\}/);
    if (m)
      j = JSON.parse(m[0]);
  } catch {
  }
  if (!j || !Array.isArray(j.articles)) {
    j = fallbackExtract(text);
    provider = (provider ? provider + "\u2192" : "") + "regex";
  }
  j.provider = provider;
  return j;
}
__name(aiExtract, "aiExtract");
function toFcfa(art, def, rate) {
  let p = Number(art.prix);
  if (!(p > 0))
    return null;
  let cur = String(art.devise || def || "").toUpperCase();
  if (!cur)
    cur = p < 3e3 ? "USD" : "FCFA";
  if (cur === "FCFA" && p < 1e3)
    p *= 1e3;
  const fcfa = cur === "USD" ? Math.round(p * phoneRate(rate) / 100) * 100 : cur === "EUR" ? Math.round(p * XOF_PER_EUR / 100) * 100 : Math.round(p);
  return { fcfa, cur, sup: Number(art.prix) };
}
__name(toFcfa, "toFcfa");
function titleCase(s) {
  return String(s || "").replace(/\s+/g, " ").trim().replace(/\b([a-z])/g, (m) => m.toUpperCase()).slice(0, 80);
}
__name(titleCase, "titleCase");
async function supParseList(env, d, text, { src = "patron", trusted = false, dry = false, name = null } = {}) {
  const now = nowS2();
  const res = { ok: false, src, trusted, dry };
  const j = await aiExtract(env, d, text);
  res.provider = j.provider;
  if (!j.liste_prix || !Array.isArray(j.articles) || !j.articles.length)
    return { ...res, ok: true, list: false };
  const [rate, prices] = await Promise.all([supRate(env, d), d.loadPrices(env, true)]);
  const ov = await overlayGet(env);
  let ovChanged = false;
  const pend = await sget(env, d, "pend", []);
  let seq = Number(await sget(env, d, "seq", 0)) || 0;
  const hist = [], auto = [], props = [], same = [];
  const srcLabel = src === "patron" ? "patron (coll\xE9)" : `${name ? name + " " : ""}${src}`;
  const seenKeys = /* @__PURE__ */ new Map();
  for (const a of j.articles.slice(0, 40)) {
    const fx = toFcfa(a, j.devise_defaut, rate);
    if (!fx || !a.produit)
      continue;
    const q = `${a.produit} ${a.stockage || ""} ${a.ram ? a.ram + " go ram" : ""} ${a.etat === "neuf" ? "scelle" : a.etat === "occasion" ? "venu" : ""}`.replace(/\s+/g, " ").trim();
    let lk = d.priceLookup(prices, q);
    let digital = false;
    if (lk.status === "none") {
      const dl = d.digitalLookup(prices, a.produit);
      if (dl.status !== "none") {
        lk = dl;
        digital = true;
      }
    }
    if (lk.status === "exact") {
      const e = lk.entry, key = entryKey(e);
      const base = Number(e.sheet_price || e.price);
      const eff = Number(e.price);
      const newC = digital ? fx.cur === "USD" ? digitalClient(fx.sup) : digitalClientFromFcfa(fx.fcfa) : fx.fcfa + d.CLIENT_MARKUP;
      const pct = (newC - eff) / eff * 100;
      const label = lk.label || e.name;
      if (newC === eff && !seenKeys.has(key)) {
        same.push(label);
        seenKeys.set(key, newC);
        continue;
      }
      const dup = seenKeys.has(key) && seenKeys.get(key) !== newC;
      if (dup && ov.items[key] && ov.items[key].mode === "set" && ov.items[key].at === now) {
        delete ov.items[key];
        ovChanged = true;
        const ai = auto.findIndex((x) => x.key === key);
        if (ai >= 0)
          auto.splice(ai, 1);
      }
      seenKeys.set(key, newC);
      for (let i = pend.length - 1; i >= 0; i--)
        if (pend[i].key === key && !(dup && pend[i].at === now))
          pend.splice(i, 1);
      if (!digital && trusted && !dup && Math.abs(pct) < AUTO_PCT) {
        if (newC === base)
          delete ov.items[key];
        else
          ov.items[key] = { price: newC, base, mode: "set", id: null, why: `${srcLabel} ${fx.sup} ${fx.cur}`, at: now, label };
        ovChanged = true;
        auto.push({ key, label, old: eff, new: newC, pct });
        hist.push(row(now, srcLabel, label, fx.cur, "", fx.sup, eff, newC, "appliqu\xE9 seul (< 10 %, source de confiance)"));
      } else {
        const id = ++seq;
        pend.push({ id, kind: digital ? "digital_wa" : "phone", key, label, base, old: eff, new: newC, pct: Math.round(pct), cur: fx.cur, sup_new: fx.sup, src: srcLabel, at: now });
        props.push({ id, label, old: eff, new: newC, pct, why: dup ? "plusieurs prix pour ce mod\xE8le dans la liste" : digital ? "logiciel (autre fournisseur)" : !trusted ? "source pas encore de confiance" : "gros \xE9cart" });
        hist.push(row(now, srcLabel, label, fx.cur, "", fx.sup, eff, newC, `en attente n\xB0${id}`));
      }
    } else {
      const id = ++seq;
      const stor = Number(String(a.stockage || "").replace(/\D/g, "")) || null;
      const entry = { name: titleCase(a.produit), family: "Autres Android", storage: stor, ram: a.ram ? String(a.ram) : null, cond: a.etat === "neuf" ? "scelle" : a.etat === "occasion" ? "venu" : "", note: "", source: "phone", category: "telephone" };
      const newC = fx.fcfa + d.CLIENT_MARKUP;
      pend.push({ id, kind: lk.status === "ambiguous" ? "a_preciser" : "nouveau", key: entryKey(entry), entry, label: `${entry.name}${stor ? " " + stor + " Go" : ""}`, old: null, new: newC, pct: null, cur: fx.cur, sup_new: fx.sup, src: srcLabel, at: now, options: lk.options || null });
      props.push({ id, label: `${entry.name}${stor ? " " + stor + " Go" : ""}`, old: null, new: newC, why: lk.status === "ambiguous" ? `plusieurs mod\xE8les possibles (${(lk.options || []).slice(0, 2).join(" / ")})` : "pas dans le catalogue" });
      hist.push(row(now, srcLabel, entry.name, fx.cur, "", fx.sup, "", newC, lk.status === "ambiguous" ? `\xE0 pr\xE9ciser n\xB0${id}` : `nouveau, en attente n\xB0${id}`));
    }
  }
  Object.assign(res, { ok: true, list: true, articles: j.articles.length, auto, proposals: props, unchanged: same.length, rate: phoneRate(rate) });
  if (!dry) {
    if (ovChanged) {
      await overlayPut(env, ov);
      try {
        await d.runSheetSync(env, "sup_auto");
      } catch {
      }
    }
    await sput(env, d, "pend", pend.slice(-60));
    await sput(env, d, "seq", seq);
    await histAdd(env, d, hist);
    try {
      await d.journalPost(env, "prix", "prix", `Liste fournisseur (${srcLabel}) : ${auto.length} prix appliqu\xE9(s), ${props.length} \xE0 valider, ${same.length} inchang\xE9(s).`);
    } catch {
    }
  }
  return res;
}
__name(supParseList, "supParseList");
function proposalsText(r, { header = true } = {}) {
  const L = [];
  if (header)
    L.push(`\u{1F4B0} Liste de prix ${r.src === "patron" ? "re\xE7ue" : `fournisseur re\xE7ue (${r.src})`} : ${r.articles} article(s) lus${r.provider ? "" : ""}.`);
  if (r.auto && r.auto.length) {
    L.push(`\u2705 Appliqu\xE9 seul (< 10 %) :`);
    for (const a of r.auto.slice(0, 8))
      L.push(`\u2022 ${a.label} : ${fmtF(a.old)} \u2192 ${fmtF(a.new)} F (${pctStr(a.pct)})`);
  }
  if (r.proposals && r.proposals.length) {
    L.push(`\u23F3 \xC0 valider :`);
    for (const p of r.proposals.slice(0, 12))
      L.push(`${p.id}. ${p.label} : ${p.old ? `${fmtF(p.old)} \u2192 ` : ""}${fmtF(p.new)} F${p.pct != null && p.old ? ` (${pctStr(p.pct)})` : ""} \u2014 ${p.why}`);
    if (r.proposals.length > 12)
      L.push(`\u2026 et ${r.proposals.length - 12} autre(s) (\xAB fournisseurs \xBB)`);
    L.push("\xAB valide 3 \xBB / \xAB valide tout \xBB = appliquer ; \xAB refuse 3 \xBB = ignorer.");
  }
  if (r.unchanged)
    L.push(`${r.unchanged} prix inchang\xE9(s).`);
  if (!(r.auto && r.auto.length) && !(r.proposals && r.proposals.length) && !r.unchanged)
    L.push("Aucun produit reconnu.");
  return L.join("\n").slice(0, 3500);
}
__name(proposalsText, "proposalsText");
async function supInbound(env, d, e) {
  try {
    const text = String(e.text || e.caption || "");
    const sups = await sget(env, d, "suppliers", []);
    const trusted = sups.some((s) => s.wa === String(e.from));
    if (!looksLikePriceList(text, { strict: !trusted }))
      return trusted ? { supplier: true, list: false } : null;
    const now = nowS2();
    const rl = await sget(env, d, "rl", {});
    const mine = (rl[e.from] || []).filter((t) => now - t < H2);
    if (mine.length >= 4)
      return trusted ? { supplier: true, limited: true } : null;
    rl[e.from] = mine.concat([now]);
    for (const k of Object.keys(rl))
      if (!(rl[k] || []).some((t) => now - t < H2))
        delete rl[k];
    await sput(env, d, "rl", rl);
    const r = await supParseList(env, d, text, { src: `wa:${e.from}`, trusted, name: e.name || (sups.find((s) => s.wa === String(e.from)) || {}).name || null });
    if (r.ok && r.list && (r.auto && r.auto.length || r.proposals && r.proposals.length)) {
      await d.hubNotify(env, `${proposalsText(r)}${trusted ? "" : `
\u2139\uFE0F ${e.name || ""} (${e.from}) n'est pas dans tes fournisseurs : rien n'est appliqu\xE9 seul. \xAB fournisseur ajoute ${e.from} \xBB pour lui faire confiance.`}`, { kind: "sup_price" });
    }
    return trusted ? { supplier: true, parsed: r.list } : null;
  } catch (err) {
    console.error("supInbound soft-fail", err && err.message || err);
    return null;
  }
}
__name(supInbound, "supInbound");
async function decide(env, d, ids, accept) {
  const now = nowS2();
  const pend = await sget(env, d, "pend", []);
  const ov = await overlayGet(env);
  let ovChanged = false;
  const done = [], hist = [];
  for (const id of ids) {
    const i = pend.findIndex((p2) => p2.id === id);
    if (i < 0)
      continue;
    const p = pend[i];
    pend.splice(i, 1);
    if (p.kind === "digital") {
      if (accept) {
        if (ov.items[p.key]) {
          delete ov.items[p.key];
          ovChanged = true;
        }
      } else if (ov.items[p.key]) {
        ov.items[p.key] = { ...ov.items[p.key], id: null, why: `${ov.items[p.key].why} \u2014 refus\xE9 par le patron`, refused_at: now };
        ovChanged = true;
      }
    } else if (accept) {
      if (p.kind === "nouveau" || p.kind === "a_preciser") {
        ov.items[p.key] = { price: p.new, base: null, mode: "add", id: p.id, why: `${p.src} valid\xE9`, at: now, label: p.label, entry: p.entry };
      } else if (p.base === p.new)
        delete ov.items[p.key];
      else
        ov.items[p.key] = { price: p.new, base: p.base, mode: "set", id: p.id, why: `${p.src} valid\xE9`, at: now, label: p.label };
      ovChanged = true;
    }
    done.push(p);
    hist.push(row(now, p.src, p.label, p.cur || "", "", p.sup_new ?? "", p.old ?? "", p.new, `${accept ? "valid\xE9" : "refus\xE9"} par le patron (n\xB0${p.id})`));
  }
  if (ovChanged)
    await overlayPut(env, ov);
  await sput(env, d, "pend", pend);
  await histAdd(env, d, hist);
  if (done.length && ovChanged) {
    try {
      await d.runSheetSync(env, "sup_decide");
    } catch {
    }
  }
  if (done.length) {
    try {
      await d.journalPost(env, "patron", "prix", `${accept ? "Valid\xE9" : "Refus\xE9"} : ${done.map((p) => p.label).join(", ").slice(0, 200)}`);
    } catch {
    }
  }
  return { done, left: pend.length };
}
__name(decide, "decide");
async function supStatusBrief(env, d) {
  const [pend, rate, hist] = await Promise.all([sget(env, d, "pend", []), sget(env, d, "rate", null), sget(env, d, "hist", [])]);
  const t0 = Date.parse(watDate(nowS2()) + "T00:00:00Z") / 1e3 - H2;
  const today = hist.filter((h) => h.at >= t0);
  return { pending: pend.length, rate: rate && rate.xof_per_usd ? Math.round(rate.xof_per_usd) : null, today: { auto: today.filter((h) => /^appliqué/.test(h.decision)).length, pending: today.filter((h) => /attente|préciser/.test(h.decision)).length, new: today.filter((h) => /^nouveau/.test(h.decision)).length } };
}
__name(supStatusBrief, "supStatusBrief");
async function supStatus(env, d) {
  const [pend, rate, hist, snap, sups, ov, tok] = await Promise.all([sget(env, d, "pend", []), sget(env, d, "rate", null), sget(env, d, "hist", []), sget(env, d, "snap", null), sget(env, d, "suppliers", []), overlayGet(env), sget(env, d, "csv_token", null)]);
  return { pending: pend, rate, history_last: hist.slice(-40), history_n: hist.length, snapshot: snap ? { at: snap.at, n: Object.keys(snap.usd || {}).length } : null, suppliers: sups, overlay: ov, csv_token_set: !!tok };
}
__name(supStatus, "supStatus");
async function supCsvToken(env, d, { create = false } = {}) {
  let t = await sget(env, d, "csv_token", null);
  if (!t && create) {
    const b = new Uint8Array(18);
    crypto.getRandomValues(b);
    t = [...b].map((x) => x.toString(16).padStart(2, "0")).join("");
    await sput(env, d, "csv_token", t);
  }
  return t;
}
__name(supCsvToken, "supCsvToken");
async function supCsv(env, d) {
  const hist = await sget(env, d, "hist", []);
  const esc2 = /* @__PURE__ */ __name((v) => {
    const s = v == null ? "" : String(v);
    return /[",\n;]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
  }, "esc");
  const head = ["Date (heure B\xE9nin)", "Source", "Produit", "Devise fournisseur", "Prix fournisseur avant", "Prix fournisseur nouveau", "Prix client avant (F)", "Prix client nouveau (F)", "\xC9cart %", "D\xE9cision"];
  const lines = [head.join(",")].concat(hist.slice().reverse().map((h) => [watIso(h.at), h.src, h.produit, h.devise, h.sup_old, h.sup_new, h.cli_old, h.cli_new, h.pct, h.decision].map(esc2).join(",")));
  return lines.join("\r\n") + "\r\n";
}
__name(supCsv, "supCsv");
function parseIds(s, pend) {
  if (/\b(tout|tous|toutes|all)\b/.test(s))
    return pend.map((p) => p.id);
  return [...String(s).matchAll(/\d{1,4}/g)].map((m) => Number(m[0]));
}
__name(parseIds, "parseIds");
async function supCommand(env, d, e, rawText, n) {
  let m;
  if (/^(fournisseurs?|prix fournisseurs?|prix en attente|en attente prix|propositions?( prix)?)$/.test(n)) {
    const [pend, rate, sups] = await Promise.all([sget(env, d, "pend", []), supRate(env, d), sget(env, d, "suppliers", [])]);
    const L = [`\u{1F4B0} Prix fournisseurs \u2014 ${pend.length} en attente`];
    for (const p of pend.slice(-15))
      L.push(`${p.id}. ${p.label} : ${p.old ? `${fmtF(p.old)} \u2192 ` : "nouveau "}${fmtF(p.new)} F${p.pct != null && p.old ? ` (${pctStr(p.pct)})` : ""} \xB7 ${p.src}`);
    if (pend.length)
      L.push("\xAB valide 2 \xBB / \xAB valide tout \xBB = appliquer ; \xAB refuse 2 \xBB = garder l'ancien.");
    L.push(`\u{1F4B1} 1 $ = ${rate && rate.xof_per_usd ? Math.round(rate.xof_per_usd) : "?"} F (officiel) \xB7 feuille logiciels : 600 F/$ \xB7 t\xE9l\xE9phones en $ : ${phoneRate(rate)} F/$`);
    L.push(`\u{1F91D} Fournisseurs de confiance : ${sups.length ? sups.map((s) => `${s.name ? s.name + " " : ""}${s.wa}`).join(", ") : "aucun (\xAB fournisseur ajoute 229\u2026 \xBB)"}`);
    return L.join("\n");
  }
  if (m = n.match(/^(valide|valider|accepte|ok prix|oui prix)\s+((?:\d{1,4}[\s,et]*)+|tout|tous)$/)) {
    const pend = await sget(env, d, "pend", []);
    const ids = parseIds(m[2], pend);
    if (!ids.length)
      return null;
    const r = await decide(env, d, ids, true);
    return r.done.length ? `\u2705 Valid\xE9 : ${r.done.map((p) => `${p.label} \u2192 ${fmtF(p.new)} F`).join(" ; ").slice(0, 900)}.
Le bot WhatsApp a d\xE9j\xE0 le nouveau prix ; le site et les catalogues suivent \xE0 la prochaine synchro (7h15 / 13h15 / 19h15).${r.done.some((p) => p.kind === "nouveau" || p.kind === "a_preciser") ? "\n\u2139\uFE0F Nouveau produit : ajoute-le aussi dans la feuille T\xE9l\xE9phone pour qu'il apparaisse sur le site." : ""}${r.left ? `
Encore ${r.left} en attente.` : ""}` : "Aucun num\xE9ro trouv\xE9 dans les prix en attente (\xAB fournisseurs \xBB pour la liste).";
  }
  if (m = n.match(/^(refuse|refuser|non prix|garde)\s+((?:\d{1,4}[\s,et]*)+|tout|tous)$/)) {
    const pend = await sget(env, d, "pend", []);
    const ids = parseIds(m[2], pend);
    if (!ids.length)
      return null;
    const r = await decide(env, d, ids, false);
    return r.done.length ? `\u{1F6AB} Refus\xE9 : ${r.done.map((p) => p.label).join(", ").slice(0, 900)}. Les clients gardent l'ancien prix.${r.left ? `
Encore ${r.left} en attente.` : ""}` : "Aucun num\xE9ro trouv\xE9 dans les prix en attente (\xAB fournisseurs \xBB pour la liste).";
  }
  if (m = n.match(/^fournisseur (ajoute|ajouter|add|retire|retirer|enleve|supprime)\s+\+?([\d\s.\-]{8,18})\s*(.*)$/)) {
    const wa = d.toWaId(m[2].replace(/[\s.\-]/g, ""));
    if (!wa)
      return "Num\xE9ro invalide.";
    const sups = (await sget(env, d, "suppliers", [])).filter((s) => s.wa !== wa);
    const add = /^(ajoute|ajouter|add)$/.test(m[1]);
    if (add)
      sups.push({ wa, name: (m[3] || "").trim().slice(0, 40) || null, at: nowS2() });
    await sput(env, d, "suppliers", sups);
    try {
      if (add)
        await env.EH_KV.put(`pause:${wa}`, JSON.stringify({ mode: "manual", at: nowS2(), why: "fournisseur" }));
      else {
        const p = JSON.parse(await env.EH_KV.get(`pause:${wa}`) || "null");
        if (p && p.why === "fournisseur")
          await env.EH_KV.delete(`pause:${wa}`);
      }
    } catch {
    }
    return add ? `\u{1F91D} ${wa} ajout\xE9 \xE0 tes fournisseurs de confiance : ses listes de prix sont lues seules, les petits changements (< 10 %) passent directement, le reste te sera demand\xE9. Le bot ne lui r\xE9pond plus comme \xE0 un client.` : `${wa} retir\xE9 des fournisseurs de confiance.`;
  }
  if (/^fournisseur liste$|^liste fournisseurs$/.test(n)) {
    const sups = await sget(env, d, "suppliers", []);
    return `\u{1F91D} Fournisseurs de confiance : ${sups.length ? sups.map((s) => `${s.name ? s.name + " " : ""}${s.wa}`).join(", ") : "aucun"}`;
  }
  if (/^(taux|taux du jour|dollar|taux dollar|cours dollar)$/.test(n)) {
    const r = await supRate(env, d, { force: true });
    return r && r.xof_per_usd ? `\u{1F4B1} Taux du jour (${r.src}, ${r.ecb_date}) : 1 $ = ${r.xof_per_usd.toFixed(2)} F \xB7 1 \u20AC = 655,957 F (fixe).
Ta feuille logiciels calcule \xE0 600 F/$ (${r.xof_per_usd <= 600 ? `marge de s\xE9curit\xE9 ${Math.round(600 - r.xof_per_usd)} F/$` : "\u26A0\uFE0F en dessous du taux officiel"}). Prix t\xE9l\xE9phones re\xE7us en $ : ${phoneRate(r)} F/$.` : "\u{1F4B1} Taux indisponible pour l'instant.";
  }
  if ((m = String(rawText || "").match(/^\s*(?:prix\s+)?fournisseurs?\s*[:\-–]\s*([\s\S]{10,})$/i)) || (m = String(rawText || "").match(/^\s*(?:prix\s+)?fournisseurs?\s*\n([\s\S]{10,})$/i))) {
    const r = await supParseList(env, d, m[1], { src: "patron", trusted: true });
    if (!r.ok)
      return "\u26A0\uFE0F Je n'ai pas pu lire cette liste.";
    if (!r.list)
      return "Je ne vois pas de liste de prix dans ce message (une ligne par produit avec son prix).";
    return proposalsText(r);
  }
  if (m = n.match(/^prix\s+(?!fournisseur)(.{2,80})$/)) {
    const prices = await d.loadPrices(env);
    const q = m[1];
    let lk = d.priceLookup(prices, q);
    if (lk.status === "none")
      lk = d.digitalLookup(prices, q);
    const pend = await sget(env, d, "pend", []);
    if (lk.status === "exact") {
      const e2 = lk.entry;
      const pp = pend.find((p) => p.key === entryKey(e2));
      return `\u{1F3F7}\uFE0F ${lk.label || e2.name} : ${fmtF(lk.price)} F (prix client)${e2.avail === false ? " \u2014 indisponible" : ""}${e2.sup === "hold" ? `
\u23F3 Le fournisseur a chang\xE9 : nouveau prix propos\xE9 ${fmtF(e2.sheet_price)} F (\xAB fournisseurs \xBB).` : e2.sup === "set" ? "\n\u2139\uFE0F Prix mis \xE0 jour d'apr\xE8s le fournisseur." : ""}${pp ? `
\u23F3 En attente n\xB0${pp.id} : ${fmtF(pp.new)} F.` : ""}`;
    }
    if (lk.status === "ambiguous") {
      const opts = (prices.entries || []).filter((x) => (lk.options || []).some((o) => o.startsWith(x.name))).slice(0, 8);
      return `\u{1F3F7}\uFE0F Plusieurs versions pour \xAB ${q} \xBB :
${(lk.options || []).slice(0, 8).map((o) => `\u2022 ${o}${(() => {
        const hit = opts.find((x) => o.startsWith(x.name));
        return "";
      })()}`).join("\n")}
Pr\xE9cise (capacit\xE9, \xE9tat), ex. \xAB prix ${q} 128 scell\xE9 \xBB.`;
    }
    return `Je ne trouve pas \xAB ${q} \xBB dans le catalogue.`;
  }
  return null;
}
__name(supCommand, "supCommand");
async function supCron(env, d, event) {
  const t = new Date(event && event.scheduledTime || Date.now());
  if (t.getUTCMinutes() >= 15)
    return null;
  if (await env.EH_KV.get("cfg:sup_enabled") === "0")
    return { off: true };
  const out = {};
  try {
    out.rate = await supRate(env, d);
  } catch {
  }
  out.digital = await supDigitalCheck(env, d, {});
  if (!out.digital.ok && out.digital.error)
    console.error("sup digital", out.digital.error);
  return out;
}
__name(supCron, "supCron");
async function supApplyToEntries(env, entries) {
  const ov = await overlayGet(env);
  const r = overlayApply(entries, ov, { allowAdd: true, mark: true });
  const stale = r.stale.filter((k) => ov.items[k] && ov.items[k].mode === "set");
  if (stale.length) {
    for (const k of stale)
      delete ov.items[k];
    try {
      await overlayPut(env, ov);
    } catch {
    }
  }
  return { ...r, pruned: stale.length };
}
__name(supApplyToEntries, "supApplyToEntries");

// index.js
var PHONE_ID = "1364570600073371";
var WABA_ID = "2333109240587511";
var AUTO_PAUSE_S = 1 * 3600;
var WINDOW_S = 24 * 3600;
var SESSION_S = 30 * 24 * 3600;
var FAIL_IP_MAX = 5;
var FAIL_IP_TTL = 15 * 60;
var FAIL_ALL_MAX = 40;
var FAIL_ALL_TTL = 3600;
var COOKIE = "eh_inbox";
async function softPut(env, key, value, opts) {
  try {
    await env.EH_KV.put(key, value, opts);
    return true;
  } catch (e) {
    console.error("KV put soft-fail", key, e && e.message || e);
    return false;
  }
}
__name(softPut, "softPut");
__name2(softPut, "softPut");
async function softPutIfChanged(env, key, nextObjOrString, ttl) {
  const next = typeof nextObjOrString === "string" ? nextObjOrString : JSON.stringify(nextObjOrString);
  let prev = null;
  try {
    prev = await env.EH_KV.get(key);
  } catch {
  }
  if (prev === next)
    return false;
  return softPut(env, key, next, ttl != null ? { expirationTtl: ttl } : void 0);
}
__name(softPutIfChanged, "softPutIfChanged");
__name2(softPutIfChanged, "softPutIfChanged");
var esc = /* @__PURE__ */ __name2((s) => String(s == null ? "" : s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]), "esc");
var nowS3 = /* @__PURE__ */ __name2(() => Math.floor(Date.now() / 1e3), "nowS");
function fmtTime(ts) {
  if (!ts)
    return "";
  const d = new Date((Number(ts) + 3600) * 1e3), n = new Date((nowS3() + 3600) * 1e3);
  const hm = `${String(d.getUTCHours()).padStart(2, "0")}:${String(d.getUTCMinutes()).padStart(2, "0")}`;
  if (d.toISOString().slice(0, 10) === n.toISOString().slice(0, 10))
    return hm;
  const y = new Date(n.getTime() - 864e5);
  if (d.toISOString().slice(0, 10) === y.toISOString().slice(0, 10))
    return `hier ${hm}`;
  return `${String(d.getUTCDate()).padStart(2, "0")}/${String(d.getUTCMonth() + 1).padStart(2, "0")} ${hm}`;
}
__name(fmtTime, "fmtTime");
__name2(fmtTime, "fmtTime");
var fmtDur = /* @__PURE__ */ __name2((s) => {
  s = Math.max(0, Math.round(s / 60));
  const h = Math.floor(s / 60), m = s % 60;
  return h ? `${h} h ${String(m).padStart(2, "0")}` : `${m} min`;
}, "fmtDur");
var fmtNum = /* @__PURE__ */ __name2((wa) => "+" + String(wa).replace(/^(229)(\d{2})(\d{2})(\d{2})(\d{2})(\d*)$/, "$1 $2 $3 $4 $5$6"), "fmtNum");
function page(title, body, { refresh = 0, script = "" } = {}) {
  return new Response(
    `<!doctype html><html lang="fr"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<meta name="robots" content="noindex,nofollow"><title>${esc(title)}</title>${refresh ? `<meta http-equiv="refresh" content="${refresh}">` : ""}
<style>
*{box-sizing:border-box}body{margin:0;font-family:system-ui,-apple-system,Segoe UI,Roboto,sans-serif;background:#eef1f4;color:#1c1e21;font-size:17px}
header{background:#0b5c4a;color:#fff;padding:12px 14px;display:flex;align-items:center;gap:10px;position:sticky;top:0;z-index:5}
header h1{font-size:18px;margin:0;flex:1;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}header a{color:#fff;text-decoration:none;font-size:15px}
main{max-width:720px;margin:0 auto;padding:10px}
.card{background:#fff;border-radius:12px;padding:12px 14px;margin:8px 0;box-shadow:0 1px 2px rgba(0,0,0,.08)}
a.conv{display:block;color:inherit;text-decoration:none}.row{display:flex;justify-content:space-between;gap:8px;align-items:baseline}
.name{font-weight:600}.time{color:#667;font-size:14px;white-space:nowrap}.last{color:#444;font-size:15px;margin-top:4px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.badge{display:inline-block;border-radius:10px;padding:1px 8px;font-size:12px;font-weight:600;margin-left:4px;vertical-align:middle}
.b-flag{background:#fde2e1;color:#b3261e}.b-new{background:#d7f5e3;color:#0b5c4a}.b-pause{background:#fff1c2;color:#7a5b00}
.msgs{display:flex;flex-direction:column;gap:6px;padding-bottom:8px}
.m{max-width:85%;padding:8px 11px;border-radius:12px;white-space:pre-wrap;word-wrap:break-word;font-size:16px;line-height:1.35}
.m small{display:block;font-size:12px;color:#667;margin-bottom:2px;font-weight:600}
.client{background:#fff;align-self:flex-start}.bot{background:#e3ecfa;align-self:flex-end}.vous{background:#d7f5e3;align-self:flex-end}
textarea,input[type=text],input[type=password]{width:100%;font-size:17px;padding:10px;border:1px solid #bbb;border-radius:10px;font-family:inherit}
textarea{min-height:90px}button,.btn{font-size:17px;padding:11px 16px;border:0;border-radius:10px;background:#0b5c4a;color:#fff;cursor:pointer;width:100%;margin-top:8px;display:block;text-align:center;text-decoration:none}
button.sec{background:#e4e6eb;color:#1c1e21}button.warn{background:#b3261e}button:disabled{opacity:.5}
.info{background:#fff8e1;border-left:4px solid #e0a800;padding:10px 12px;border-radius:8px;margin:8px 0;font-size:15px}
.ok{background:#e6f6ec;border-left:4px solid #0b8a4a;padding:10px 12px;border-radius:8px;margin:8px 0}.err{background:#fde2e1;border-left:4px solid #b3261e;padding:10px 12px;border-radius:8px;margin:8px 0}
.muted{color:#667;font-size:14px}label{display:block;font-size:15px;margin:8px 0 4px}details summary{cursor:pointer;font-weight:600;padding:4px 0}
</style></head><body>${body}${script ? `<script>${script}<\/script>` : ""}</body></html>`,
    { headers: { "Content-Type": "text/html; charset=utf-8", "Cache-Control": "no-store", "X-Frame-Options": "DENY", "Referrer-Policy": "no-referrer", "X-Robots-Tag": "noindex" } }
  );
}
__name(page, "page");
__name2(page, "page");
var redirect = /* @__PURE__ */ __name2((loc, extra = {}) => new Response(null, { status: 303, headers: { Location: loc, "Cache-Control": "no-store", ...extra } }), "redirect");
function timingSafeEq(a, b) {
  const x = new TextEncoder().encode(String(a)), y = new TextEncoder().encode(String(b));
  let d = x.length ^ y.length;
  for (let i = 0; i < Math.max(x.length, y.length); i++)
    d |= (x[i] || 0) ^ (y[i] || 0);
  return d === 0;
}
__name(timingSafeEq, "timingSafeEq");
__name2(timingSafeEq, "timingSafeEq");
function getCookie(req, name) {
  const m = (req.headers.get("Cookie") || "").match(new RegExp(`(?:^|;\\s*)${name}=([a-f0-9]{64})`));
  return m ? m[1] : null;
}
__name(getCookie, "getCookie");
__name2(getCookie, "getCookie");
async function session(req, env) {
  const t = getCookie(req, COOKIE);
  return t && await env.EH_KV.get(`sess:${t}`) ? t : null;
}
__name(session, "session");
__name2(session, "session");
function loginPage(msg = "") {
  return page("Connexion \u2014 Electronic HOUSE", `<header><h1>Electronic HOUSE \u2014 Messages</h1></header><main><div class="card">
<p>Entrez votre mot de passe pour lire et r\xE9pondre aux clients WhatsApp.</p>${msg ? `<div class="err">${esc(msg)}</div>` : ""}
<form method="post" action="/inbox/login"><label for="p">Mot de passe</label><input id="p" type="password" name="password" autocomplete="current-password" autocapitalize="off" autocorrect="off" spellcheck="false" required autofocus>
<button type="submit">Se connecter</button></form></div></main>`);
}
__name(loginPage, "loginPage");
__name2(loginPage, "loginPage");
async function login(req, env) {
  const ip = req.headers.get("CF-Connecting-IP") || "inconnu";
  const fIp = Number(await env.EH_KV.get(`inboxfail:${ip}`) || 0), fAll = Number(await env.EH_KV.get("inboxfail:all") || 0);
  if (fIp >= FAIL_IP_MAX || fAll >= FAIL_ALL_MAX)
    return loginPage("Trop d'essais incorrects. R\xE9essayez dans 15 minutes.");
  const f = await req.formData().catch(() => null);
  const pw = f ? String(f.get("password") || "").trim() : "";
  if (!env.INBOX_PASSWORD || !pw || !timingSafeEq(pw.toLowerCase(), String(env.INBOX_PASSWORD).toLowerCase())) {
    await softPut(env, `inboxfail:${ip}`, String(fIp + 1), { expirationTtl: FAIL_IP_TTL });
    await softPut(env, "inboxfail:all", String(fAll + 1), { expirationTtl: FAIL_ALL_TTL });
    const left = FAIL_IP_MAX - fIp - 1;
    return loginPage(left > 0 ? `Mot de passe incorrect. Il vous reste ${left} essai(s).` : "Trop d'essais incorrects. R\xE9essayez dans 15 minutes.");
  }
  try {
    await env.EH_KV.delete(`inboxfail:${ip}`);
  } catch (e) {
    console.error("KV delete soft-fail", e);
  }
  const tok = [...crypto.getRandomValues(new Uint8Array(32))].map((b) => b.toString(16).padStart(2, "0")).join("");
  await softPut(env, `sess:${tok}`, JSON.stringify({ ip, at: nowS3() }), { expirationTtl: SESSION_S });
  return redirect("/inbox", { "Set-Cookie": `${COOKIE}=${tok}; Path=/inbox; HttpOnly; Secure; SameSite=Strict; Max-Age=${SESSION_S}` });
}
__name(login, "login");
__name2(login, "login");
async function getPause(env, wa) {
  let p = null;
  try {
    p = JSON.parse(await env.EH_KV.get(`pause:${wa}`) || "null");
  } catch {
  }
  if (p && p.until && p.until < nowS3())
    return null;
  return p;
}
__name(getPause, "getPause");
__name2(getPause, "getPause");
async function convSummary(env, wa, getJSON2) {
  const [hist, name, flag, pause, seen] = await Promise.all([
    getJSON2(env, `conv:${wa}`, []),
    env.EH_KV.get(`name:${wa}`),
    getJSON2(env, `flag:${wa}`, null),
    getPause(env, wa),
    env.EH_KV.get(`seen_owner:${wa}`)
  ]);
  const lastMsg = hist[hist.length - 1] || null;
  const lastUser = [...hist].reverse().find((h) => h.role === "user");
  return {
    wa,
    hist,
    name: name || flag && flag.name || "",
    flag,
    pause,
    lastIn: Number(lastUser && lastUser.ts || 0),
    lastMsg,
    unread: !!(lastUser && lastUser.ts > Number(seen || 0)),
    ts: lastMsg ? lastMsg.ts : 0
  };
}
__name(convSummary, "convSummary");
__name2(convSummary, "convSummary");
var who = /* @__PURE__ */ __name2((r) => r === "user" ? "Client" : r === "owner" ? "Vous" : "Bot", "who");
async function listPage(env, getJSON2) {
  const keys = [];
  let cursor;
  do {
    const l = await env.EH_KV.list({ prefix: "conv:", cursor, limit: 1e3 });
    keys.push(...l.keys);
    cursor = l.list_complete ? null : l.cursor;
  } while (cursor);
  const convs = (await Promise.all(keys.map((k) => convSummary(env, k.name.slice(5), getJSON2)))).filter((c) => c.hist.length).sort((a, b) => b.ts - a.ts);
  const rows = convs.map((c) => `<a class="conv card" href="/inbox/c/${esc(c.wa)}"><div class="row"><span class="name">${esc(c.name || fmtNum(c.wa))}${c.unread ? '<span class="badge b-new">nouveau</span>' : ""}${c.flag ? '<span class="badge b-flag">\xE0 traiter</span>' : ""}${c.pause ? '<span class="badge b-pause">bot en pause</span>' : ""}</span><span class="time">${esc(fmtTime(c.ts))}</span></div>
<div class="last">${c.name ? `<span class="muted">${esc(fmtNum(c.wa))} \xB7 </span>` : ""}${c.lastMsg ? `<b>${who(c.lastMsg.role)} :</b> ${esc(c.lastMsg.text)}` : ""}</div></a>`).join("");
  return page("Messages \u2014 Electronic HOUSE", `<header><h1>Messages clients (${convs.length})</h1><a href="/inbox">\u21BB Actualiser</a></header><main>
${rows || '<div class="card">Aucune conversation pour le moment.</div>'}
<p class="muted">\xAB \xE0 traiter \xBB = le bot a signal\xE9 la conversation (prix, commande, remise\u2026). La liste se met \xE0 jour toute seule chaque minute. Heures de Porto-Novo.</p>
<form method="post" action="/inbox/logout"><button class="sec" type="submit">Se d\xE9connecter</button></form></main>`, { refresh: 60 });
}
__name(listPage, "listPage");
__name2(listPage, "listPage");
async function approvedTemplates(env) {
  let c = null;
  try {
    c = JSON.parse(await env.EH_KV.get("cache:templates") || "null");
  } catch {
  }
  if (c)
    return c;
  try {
    const r = await fetch(`https://graph.facebook.com/v21.0/${WABA_ID}/message_templates?fields=name,status,language,category,components&limit=100`, { headers: { Authorization: `Bearer ${env.WA_TOKEN}` } });
    const d = await r.json();
    const all = d.data || [];
    c = { approved: all.filter((t) => t.status === "APPROVED" && t.name !== "hello_world").map((t) => {
      const comp = /* @__PURE__ */ __name2((type) => (t.components || []).find((x) => x.type === type) || {}, "comp");
      const nv = /* @__PURE__ */ __name2((s) => Math.max(0, ...[...String(s || "").matchAll(/\{\{(\d+)\}\}/g)].map((m) => +m[1])), "nv");
      const btnVars = (comp("BUTTONS").buttons || []).some((b) => /\{\{/.test(b.url || ""));
      const head = comp("HEADER");
      return {
        name: t.name,
        lang: t.language,
        category: t.category,
        header: head.format === "TEXT" ? head.text || "" : "",
        headerVars: head.format === "TEXT" ? nv(head.text) : 0,
        mediaHeader: !!head.format && head.format !== "TEXT",
        body: comp("BODY").text || "",
        bodyVars: nv(comp("BODY").text),
        supported: !btnVars && !(head.format && head.format !== "TEXT")
      };
    }), pending: all.filter((t) => t.status === "PENDING").map((t) => t.name), error: d.error ? d.error.message : null };
    await softPutIfChanged(env, "cache:templates", c, 600);
  } catch (e) {
    c = { approved: [], pending: [], error: String(e) };
  }
  return c;
}
__name(approvedTemplates, "approvedTemplates");
__name2(approvedTemplates, "approvedTemplates");
var fill = /* @__PURE__ */ __name2((s, vals) => String(s || "").replace(/\{\{(\d+)\}\}/g, (_, i) => vals[+i - 1] || `{{${i}}}`), "fill");
async function convPage(env, wa, url, getJSON2) {
  const c = await convSummary(env, wa, getJSON2);
  if (!c.hist.length)
    return page("Introuvable", `<header><a href="/inbox">\u2190</a><h1>Conversation introuvable</h1></header><main><div class="card">Aucun message avec ce num\xE9ro.</div></main>`);
  {
    const lastUser = [...c.hist].reverse().find((h) => h.role === "user");
    if (lastUser && lastUser.ts)
      await softPutIfChanged(env, `seen_owner:${wa}`, String(lastUser.ts), 60 * 86400);
  }
  const left = c.lastIn ? c.lastIn + WINDOW_S - nowS3() : -1, open = left > 60;
  const ok = url.searchParams.get("ok"), err = url.searchParams.get("err");
  const msgs = c.hist.map((h) => `<div class="m ${h.role === "user" ? "client" : h.role === "owner" ? "vous" : "bot"}"><small>${who(h.role)} \xB7 ${esc(fmtTime(h.ts))}</small>${esc(h.text)}</div>`).join("");
  const pauseTxt = c.pause ? c.pause.until ? `Bot en pause jusqu'\xE0 ${esc(fmtTime(c.pause.until))} (reprend tout seul)` : "Bot en pause (jusqu'\xE0 ce que vous le r\xE9activiez)" : "Bot actif : il r\xE9pond automatiquement \xE0 ce client";
  let reply;
  if (open)
    reply = `<div class="card"><form method="post" action="/inbox/c/${esc(wa)}/send" onsubmit="this.querySelector('button').disabled=true">
<label for="t">Votre r\xE9ponse <span class="muted">(fen\xEAtre ouverte encore ${fmtDur(left)})</span></label><textarea id="t" name="text" maxlength="4000" required placeholder="\xC9crivez votre message\u2026"></textarea>
<button type="submit">Envoyer</button></form><p class="muted">Quand vous r\xE9pondez, le bot se met en pause 1 heure pour ce client, pour ne pas parler en m\xEAme temps que vous.</p></div>`;
  else {
    const t = await approvedTemplates(env);
    const forms = t.approved.filter((x) => x.supported).map((x) => `<details class="card"><summary>${esc(x.name)}</summary><p class="muted">${esc(x.header ? x.header + " \u2014 " : "")}${esc(x.body)}</p>
<form method="post" action="/inbox/c/${esc(wa)}/template" onsubmit="this.querySelector('button').disabled=true"><input type="hidden" name="name" value="${esc(x.name)}"><input type="hidden" name="lang" value="${esc(x.lang)}">
${Array.from({ length: x.headerVars }, (_, i) => `<label>Titre {{${i + 1}}}</label><input type="text" name="h${i + 1}" required>`).join("")}
${Array.from({ length: x.bodyVars }, (_, i) => `<label>Texte {{${i + 1}}}</label><input type="text" name="b${i + 1}" required>`).join("")}
<button type="submit">Envoyer ce mod\xE8le</button></form></details>`).join("");
    reply = `<div class="info"><b>Vous ne pouvez pas \xE9crire librement \xE0 ce client pour l'instant.</b><br>WhatsApp autorise les messages libres seulement dans les 24 heures qui suivent le dernier message du client${c.lastIn ? ` (dernier message du client : ${esc(fmtTime(c.lastIn))})` : ""}. Pass\xE9 ce d\xE9lai, on peut seulement envoyer un <b>mod\xE8le de message approuv\xE9 par WhatsApp</b>. D\xE8s que le client vous r\xE9\xE9crit, vous pourrez de nouveau r\xE9pondre librement.</div>
${forms || `<div class="card muted">Aucun mod\xE8le approuv\xE9 n'est disponible pour le moment${t.pending.length ? ` (${t.pending.length} mod\xE8le(s) en attente de validation par WhatsApp : ${esc(t.pending.join(", "))})` : ""}.</div>`}`;
  }
  const script = `window.scrollTo(0,document.body.scrollHeight);setInterval(function(){var t=document.querySelector('textarea');if(document.visibilityState==='visible'&&(!t||!t.value)&&!document.querySelector('details[open]'))location.replace(location.pathname)},30000);`;
  return page(`${c.name || fmtNum(wa)} \u2014 Messages`, `<header><a href="/inbox">\u2190 Retour</a><h1>${esc(c.name || fmtNum(wa))}</h1></header><main>
<div class="muted" style="margin:4px 2px 8px">${esc(fmtNum(wa))}${c.flag ? ` \xB7 <span class="badge b-flag">\xE0 traiter : ${esc(c.flag.reason)}${c.flag.product ? " \u2014 " + esc(c.flag.product) : ""}</span>` : ""}</div>
<div class="msgs">${msgs}</div>
${ok ? `<div class="ok">${esc(ok)}</div>` : ""}${err ? `<div class="err">${esc(err)}</div>` : ""}
${reply}
<div class="card"><div>${pauseTxt}</div><form method="post" action="/inbox/c/${esc(wa)}/pause"><input type="hidden" name="to" value="${c.pause ? "on" : "off"}">
<button class="${c.pause ? "" : "warn"}" type="submit">${c.pause ? "R\xE9activer le bot" : "Mettre le bot en pause"}</button></form></div>
${c.flag ? `<form method="post" action="/inbox/c/${esc(wa)}/done"><button class="sec" type="submit">Marquer comme trait\xE9 (retirer \xAB \xE0 traiter \xBB)</button></form>` : ""}
</main>`, { script });
}
__name(convPage, "convPage");
__name2(convPage, "convPage");
function graphErr(res) {
  let e = {};
  try {
    e = JSON.parse(res.body).error || {};
  } catch {
  }
  const code = e.code;
  if (code === 131047 || /24 hours|re-engagement/i.test(e.message || ""))
    return "Message refus\xE9 : la fen\xEAtre de 24 heures est ferm\xE9e. Utilisez un mod\xE8le approuv\xE9.";
  if (code === 131026)
    return "Message refus\xE9 : ce num\xE9ro ne peut pas recevoir de messages WhatsApp.";
  if (code === 190)
    return "Message refus\xE9 : l'acc\xE8s WhatsApp du bot a expir\xE9. Pr\xE9venez la personne qui g\xE8re le bot.";
  return `Message non envoy\xE9 (erreur WhatsApp ${esc(code || res.status)}). R\xE9essayez dans un instant.`;
}
__name(graphErr, "graphErr");
__name2(graphErr, "graphErr");
async function autoPause(env, wa) {
  const p = await getPause(env, wa);
  if (p && !p.until)
    return;
  await softPutIfChanged(env, `pause:${wa}`, { mode: "auto", until: nowS3() + AUTO_PAUSE_S, at: nowS3() }, AUTO_PAUSE_S);
}
__name(autoPause, "autoPause");
__name2(autoPause, "autoPause");
async function inbox(req, env, url, deps) {
  const { getJSON: getJSON2, pushHist: pushHist2, sendText: sendText2 } = deps;
  const path = url.pathname.replace(/\/+$/, "") || "/inbox";
  if (req.method === "POST") {
    const o = req.headers.get("Origin");
    if (o && o !== url.origin)
      return new Response("Forbidden", { status: 403 });
  }
  if (path === "/inbox/login" && req.method === "POST")
    return login(req, env);
  const sess = await session(req, env);
  if (!sess)
    return loginPage();
  if (path === "/inbox/logout" && req.method === "POST") {
    await env.EH_KV.delete(`sess:${sess}`);
    return redirect("/inbox", { "Set-Cookie": `${COOKIE}=; Path=/inbox; HttpOnly; Secure; SameSite=Strict; Max-Age=0` });
  }
  if (path === "/inbox" && req.method === "GET")
    return listPage(env, getJSON2);
  const m = path.match(/^\/inbox\/c\/(\d{6,15})(?:\/(send|template|pause|done))?$/);
  if (!m)
    return redirect("/inbox");
  const wa = m[1], action = m[2], back = `/inbox/c/${wa}`;
  if (!action && req.method === "GET")
    return convPage(env, wa, url, getJSON2);
  if (req.method !== "POST")
    return redirect(back);
  if (!await env.EH_KV.get(`conv:${wa}`))
    return redirect("/inbox");
  const f = await req.formData().catch(() => new FormData());
  const now = nowS3();
  if (action === "pause") {
    if (f.get("to") === "on") {
      try {
        await env.EH_KV.delete(`pause:${wa}`);
      } catch (e) {
        console.error("KV delete soft-fail", e);
      }
      return redirect(`${back}?ok=${encodeURIComponent("Bot r\xE9activ\xE9 pour ce client.")}`);
    }
    await softPutIfChanged(env, `pause:${wa}`, { mode: "manual", until: 0, at: now });
    return redirect(`${back}?ok=${encodeURIComponent("Bot en pause pour ce client. Il ne r\xE9pondra plus jusqu'\xE0 ce que vous le r\xE9activiez.")}`);
  }
  if (action === "done") {
    try {
      await env.EH_KV.delete(`flag:${wa}`);
    } catch (e) {
      console.error("KV delete soft-fail", e);
    }
    return redirect(`${back}?ok=${encodeURIComponent("Conversation marqu\xE9e comme trait\xE9e.")}`);
  }
  if (action === "send") {
    const text = String(f.get("text") || "").trim().slice(0, 4e3);
    if (!text)
      return redirect(back);
    const hist = await getJSON2(env, `conv:${wa}`, []);
    const lastUser = [...hist].reverse().find((h) => h.role === "user");
    const lastIn = Number(lastUser && lastUser.ts || 0);
    if (!lastIn || now - lastIn > WINDOW_S - 60)
      return redirect(`${back}?err=${encodeURIComponent("La fen\xEAtre de 24 heures est ferm\xE9e : seul un mod\xE8le approuv\xE9 peut \xEAtre envoy\xE9.")}`);
    const res = await sendText2(env, PHONE_ID, wa, text);
    await softPut(env, `owner_sent:${wa}`, JSON.stringify({ wa, text, status: res.status, body: res.status < 300 ? void 0 : res.body.slice(0, 300), ts: now }), { expirationTtl: 60 * 86400 });
    if (res.status >= 300)
      return redirect(`${back}?err=${encodeURIComponent(graphErr(res))}`);
    await pushHist2(env, wa, "owner", text, now);
    await autoPause(env, wa);
    return redirect(`${back}?ok=${encodeURIComponent("Message envoy\xE9. Le bot est en pause 1 heure pour ce client.")}`);
  }
  if (action === "template") {
    const t = (await approvedTemplates(env)).approved.find((x) => x.name === f.get("name") && x.lang === f.get("lang") && x.supported);
    if (!t)
      return redirect(`${back}?err=${encodeURIComponent("Mod\xE8le introuvable ou non approuv\xE9.")}`);
    const hv = Array.from({ length: t.headerVars }, (_, i) => String(f.get(`h${i + 1}`) || "").trim().slice(0, 60));
    const bv = Array.from({ length: t.bodyVars }, (_, i) => String(f.get(`b${i + 1}`) || "").trim().slice(0, 500));
    if ([...hv, ...bv].some((v) => !v))
      return redirect(`${back}?err=${encodeURIComponent("Remplissez toutes les cases du mod\xE8le.")}`);
    const components = [];
    if (hv.length)
      components.push({ type: "header", parameters: hv.map((text) => ({ type: "text", text })) });
    if (bv.length)
      components.push({ type: "body", parameters: bv.map((text) => ({ type: "text", text })) });
    const r = await fetch(`https://graph.facebook.com/v21.0/${await lineRoute(env, PHONE_ID, wa)}/messages`, {
      method: "POST",
      headers: { Authorization: `Bearer ${env.WA_TOKEN}`, "Content-Type": "application/json" },
      body: JSON.stringify({ messaging_product: "whatsapp", to: wa, type: "template", template: { name: t.name, language: { code: t.lang }, ...components.length ? { components } : {} } })
    });
    const res = { status: r.status, body: await r.text() };
    try {
      await logOut(env, wa, "template", `[inbox mod\xE8le ${t.name}]`, res);
    } catch {
    }
    await softPut(env, `owner_sent:${wa}`, JSON.stringify({ wa, template: t.name, status: res.status, body: res.status < 300 ? void 0 : res.body.slice(0, 300), ts: now }), { expirationTtl: 60 * 86400 });
    if (res.status >= 300)
      return redirect(`${back}?err=${encodeURIComponent(graphErr(res))}`);
    await pushHist2(env, wa, "owner", `[Mod\xE8le \xAB ${t.name} \xBB] ${fill(t.header, hv) ? fill(t.header, hv) + " \u2014 " : ""}${fill(t.body, bv)}`, now);
    await autoPause(env, wa);
    return redirect(`${back}?ok=${encodeURIComponent("Mod\xE8le envoy\xE9. Le bot est en pause 1 heure pour ce client.")}`);
  }
  return redirect(back);
}
__name(inbox, "inbox");
__name2(inbox, "inbox");
var PHOTO_INDEX = [
  {
    "id": "tel-motorola-g84-5g-256go-ram12-4",
    "model": "motorola g84",
    "storage": "256",
    "url": "https://eh-catalog.domingohoreb.workers.dev/img/tel-motorola-g84-5g-256go-ram12-4.jpg",
    "title": "Motorola G84 5G 256 Go / 12+4 Go RAM"
  },
  {
    "id": "tel-nokia-ta-1359-32go-ram2",
    "model": "nokia ta-1359",
    "storage": "32",
    "url": "https://eh-catalog.domingohoreb.workers.dev/img/tel-nokia-ta-1359-32go-ram2.jpg",
    "title": "Nokia TA-1359 32 Go / 2 Go RAM"
  },
  {
    "id": "tel-oppo-a18-8-64go-ram4",
    "model": "oppo a18",
    "storage": "64",
    "url": "https://eh-catalog.domingohoreb.workers.dev/img/tel-oppo-a18-8-64go-ram4.jpg",
    "title": "Oppo A18+8 64 Go / 4 Go RAM"
  },
  {
    "id": "tel-oppo-a31-64go-ram4",
    "model": "oppo a31",
    "storage": "64",
    "url": "https://eh-catalog.domingohoreb.workers.dev/img/tel-oppo-a31-64go-ram4.jpg",
    "title": "Oppo A31 64 Go / 4 Go RAM"
  },
  {
    "id": "num-chatgpt-plus-1-mois",
    "model": "chatgpt",
    "storage": "",
    "url": "https://eh-catalog.domingohoreb.workers.dev/img/num-chatgpt-plus-1-mois.jpg",
    "title": "ChatGPT Plus \u2013 1 mois"
  },
  {
    "id": "num-google-one-gemini-pro-1-a-2-to-1-an",
    "model": "gemini",
    "storage": "",
    "url": "https://eh-catalog.domingohoreb.workers.dev/img/num-google-one-gemini-pro-1-a-2-to-1-an.jpg",
    "title": "Google One Gemini Pro (1 \xE0 2 To, 1 an)"
  }
];
var PRICE_OVERRIDES = [
  {
    "name": "Google One Gemini Pro (1 \xE0 2 To, 1 an)",
    "family": "IA & assistants",
    "category": "logiciel",
    "source": "digital",
    "price": 3e4,
    "approved": "2026-09-25 par le propri\xE9taire (\xAB autour de 30 000 FCFA \xBB)",
    "keywords": [
      "gemini",
      "gemini pro",
      "gemini advanced",
      "google one",
      "google one ai premium",
      "google ai pro",
      "ai premium",
      "1tb",
      "2tb",
      "1 year",
      "12 month",
      "stockage cloud"
    ],
    "catalog": {
      "name": "Google One Gemini Pro",
      "category": "logiciel",
      "family": "IA & assistants",
      "flagship": true,
      "description": "Abonnement num\xE9rique Google (produit phare) : acc\xE8s \xE0 Gemini Pro, l'IA de Google, plus 1 \xE0 2 To de stockage cloud Google One (Drive, Gmail, Photos) pendant 1 an, activ\xE9 sur votre compte Google. Ce n'est pas un t\xE9l\xE9phone.",
      "variants": [
        "1 To - 1 an",
        "2 To - 1 an"
      ]
    }
  },
  {
    "name": "Cursor Pro (IA code) \u2013 1 an",
    "family": "IA & assistants",
    "category": "logiciel",
    "source": "digital",
    "price": 8e4,
    "approved": "2026-09-26 par MR DOM (\xAB 80.000 \xBB)",
    "keywords": [
      "cursor",
      "cursor pro",
      "cursor ai",
      "cursor ia",
      "ia code",
      "1 year",
      "12 month",
      "1 an"
    ],
    "catalog": {
      "name": "Cursor Pro (IA code) \u2013 1 an",
      "category": "logiciel",
      "family": "IA & assistants",
      "flagship": true,
      "description": "Abonnement Cursor Pro pendant 1 an : assistant IA pour coder (compl\xE9tion, chat, agent) dans l\u2019\xE9diteur Cursor. Activation / acc\xE8s fourni par Electronic HOUSE. Ce n\u2019est pas un t\xE9l\xE9phone.",
      "variants": [
        "1 an"
      ]
    }
  }
];
var SHEET_PHONES = "1z3xtjwyN2fKdQ_LZxz3oVL90aQ8l3YPD0KoCfKH4snA";
var SHEET_DIGITAL = "1wvZwtwDyJ3OnApTEcDoALxTjCWg1gRID3Bj0nPrtMSk";
var CLIENT_MARKUP = 2e4;
var W = "[\\p{L}\\p{N}_]";
var B = `(?:(?<=${W})(?!${W})|(?<!${W})(?=${W}))`;
function R(src, flags = "") {
  return new RegExp(src.replace(/\\b/g, B).replace(/\\w/g, W), flags.includes("u") ? flags : flags + "u");
}
__name(R, "R");
__name2(R, "R");
function stripChars(s, chars) {
  let a = 0, b = s.length;
  while (a < b && chars.includes(s[a]))
    a++;
  while (b > a && chars.includes(s[b - 1]))
    b--;
  return s.slice(a, b);
}
__name(stripChars, "stripChars");
__name2(stripChars, "stripChars");
function parseCsv(text) {
  const rows = [];
  let row2 = [], f = "", q = false;
  const t = String(text || "").replace(/^\uFEFF/, "");
  for (let i = 0; i < t.length; i++) {
    const c = t[i];
    if (q) {
      if (c === '"') {
        if (t[i + 1] === '"') {
          f += '"';
          i++;
        } else
          q = false;
      } else
        f += c;
    } else if (c === '"')
      q = true;
    else if (c === ",") {
      row2.push(f);
      f = "";
    } else if (c === "\n" || c === "\r") {
      if (c === "\r" && t[i + 1] === "\n")
        i++;
      row2.push(f);
      rows.push(row2);
      row2 = [];
      f = "";
    } else
      f += c;
  }
  if (f !== "" || row2.length) {
    row2.push(f);
    rows.push(row2);
  }
  return rows;
}
__name(parseCsv, "parseCsv");
__name2(parseCsv, "parseCsv");
var MONEY_WORDS = R("(fcfa|\\bcfa\\b|\\bxof\\b|\\bprix\\b|\\bprice\\b|commission|\\btarifs?\\b|\\busd\\b|\u20AC|\\$)", "gi");
function clean(s) {
  s = String(s || "").replace(/\s+/g, " ").trim();
  s = s.replace(R("\\b\\d{1,3}(?:[ .]\\d{3})+\\b|\\b\\d{5,}\\b", "g"), "");
  s = s.replace(MONEY_WORDS, "");
  return stripChars(s.replace(/\s{2,}/g, " "), " -\u2013,;:");
}
__name(clean, "clean");
__name2(clean, "clean");
var STORAGE_SRC = "\\b(\\d{2,4})\\s?(gb|go|tb|to)\\b|\\b(\\d{2,3})/(\\d{1,2})(\\+\\d)?\\b|\\bram\\s?\\d+\\s?gb\\b|\\b(32|64|128|256|512)\\b(?!\\s?mm)";
function splitVariant(name) {
  let n = name, cond = "";
  if (/sc[eé]ll[eé]s?/i.test(n))
    cond = "scell\xE9 (neuf)";
  if (R("\\bvenu\\b", "i").test(n))
    cond = "venu (occasion import\xE9e)";
  n = n.replace(R("sc[e\xE9]ll[e\xE9]s?|\\bvenu\\b", "gi"), "");
  n = n.replace(/\([^)]*\)/g, "");
  const stor = [];
  for (const m of n.matchAll(R(STORAGE_SRC, "gi"))) {
    if (m[1])
      stor.push(["gb", "go"].includes(m[2].toLowerCase()) ? `${m[1]} Go` : `${m[1]} To`);
    else if (m[3])
      stor.push(`${m[3]} Go / ${m[4]}${m[5] || ""} Go RAM`);
    else if (m[6])
      stor.push(`${m[6]} Go`);
  }
  n = n.replace(R(STORAGE_SRC, "gi"), "");
  n = n.replace(R("(\\w)\\s?\\+(?=\\s|$)", "g"), "$1 Plus");
  n = stripChars(n.replace(/\s{2,}/g, " "), " -/+");
  return [n, stor[0] || "", cond];
}
__name(splitVariant, "splitVariant");
__name2(splitVariant, "splitVariant");
function titleModel(m) {
  m = m.replace(R("(\\d)(pro|plus|max|edge|ultra)\\b", "gi"), "$1 $2");
  m = m.replace(R("\\bpro\\s?max\\b|\\bpm\\b", "gi"), "Pro Max");
  m = m.replace(R("\\bpro\\b", "gi"), "Pro").replace(R("\\bplus\\b", "gi"), "Plus").replace(R("\\bultra\\b", "gi"), "Ultra");
  m = m.replace(R("\\bxr\\b", "gi"), "XR").replace(/^xs max/i, "XS Max");
  return m.replace(/\s{2,}/g, " ").trim();
}
__name(titleModel, "titleModel");
__name2(titleModel, "titleModel");
var AVAIL_HDR_RE = /^(dispo|disponible|disponibilit[ée]|stock|en stock|quantit[ée]|qt[ée]|qty|availability|available)$/i;
function availOf(v) {
  const s = String(v == null ? "" : v).trim().toLowerCase();
  if (!s)
    return null;
  if (/^\d+$/.test(s))
    return Number(s) > 0;
  if (/^(non|no|n|0|x|rupture|en rupture|[ée]puis[ée]e?|indispo(nible)?|hors stock|out|out of stock|pas dispo|vendu|sold)$/.test(s))
    return false;
  if (/^(oui|yes|y|o|ok|dispo(nible)?|en stock|in stock|✓|✔|v)$/.test(s))
    return true;
  return null;
}
__name(availOf, "availOf");
__name2(availOf, "availOf");
function phoneRows(rows, out, info) {
  const hdr = rows[0].map((h) => h.trim().toLowerCase());
  const iname = hdr.indexOf("nom"), icat = hdr.indexOf("cat\xE9gorie");
  if (iname < 0 || icat < 0)
    throw new Error("feuille t\xE9l\xE9phones : colonnes Nom/Cat\xE9gorie introuvables");
  const iprice = hdr.indexOf("prix");
  const iav = hdr.findIndex((h) => AVAIL_HDR_RE.test(h));
  info.phones_avail_col = iav >= 0 ? rows[0][iav].trim() : null;
  for (const r of rows.slice(1)) {
    if (r.length <= Math.max(iname, icat))
      continue;
    const name = r[iname].trim(), cat = r[icat].trim();
    if (!name || cat.toUpperCase() === "META" || name.toLowerCase().includes("interne"))
      continue;
    let [model, stor, cond] = splitVariant(name);
    const c = cat.toLowerCase();
    let category, family, full;
    if (c.startsWith("ecrans")) {
      stor = cond = "";
      category = "accessoire";
      family = "\xC9crans iPhone (pi\xE8ces d\xE9tach\xE9es)";
      full = "\xC9cran iPhone " + titleModel(name.replace(/original/gi, "").trim());
    } else if (c === "apple watch") {
      category = "electronique";
      family = "Apple Watch";
      full = "Apple Watch " + titleModel(model.replace(/Serie/g, "S\xE9rie"));
    } else if (c === "tablettes") {
      category = "electronique";
      family = "Tablettes";
      full = "Samsung Galaxy " + titleModel(model);
    } else {
      category = "telephone";
      let base;
      if (c.startsWith("iphone")) {
        family = "iPhone";
        base = "iPhone";
      } else if (c.startsWith("samsung")) {
        family = "Samsung";
        base = "Samsung";
      } else if (c === "google pixel") {
        family = "Google Pixel";
        base = "";
      } else if (c === "infinix" || c === "tecno") {
        family = cat;
        base = cat;
      } else {
        family = "Autres Android";
        base = "";
      }
      if (c.startsWith("samsung venu") || c.startsWith("iphone venu"))
        cond = cond || "venu (occasion import\xE9e)";
      model = model.replace(/^(iphone|samsung)\s+/i, "");
      full = (base + " " + titleModel(model)).trim().replace(/Comon/g, "Camon");
      if (family === "Samsung" && /^samsung (a|s|note|z)/i.test(full))
        full = full.replace("Samsung ", "Samsung Galaxy ");
    }
    full = clean(full);
    if (iprice >= 0 && category !== "accessoire" && r.length > iprice) {
      const raw = r[iprice].replace(/[\s\u00a0\u202f.,]/g, "");
      if (/^\d{4,7}$/.test(raw)) {
        const sm = /(\d{2,4}) Go/.exec(stor || ""), rm = /\/ ([\d+]+) Go RAM/.exec(stor || "");
        const note = [...name.matchAll(/\(([^)]*)\)/g)].map((m) => m[1]).join(" ").trim();
        const e = {
          name: full,
          family,
          storage: sm ? Number(sm[1]) : null,
          ram: rm ? rm[1] : null,
          cond: cond.startsWith("scell") ? "scelle" : cond.startsWith("venu") ? "venu" : "",
          note,
          source: "phone",
          category,
          price: Number(raw) + CLIENT_MARKUP
        };
        if (iav >= 0) {
          const a = availOf(r[iav]);
          if (a !== null)
            e.avail = a;
        }
        out.push(e);
      }
    }
  }
}
__name(phoneRows, "phoneRows");
__name2(phoneRows, "phoneRows");
var DIGI_FAMILIES = [
  ["server|sql|remote desktop", "Windows Server & SQL Server"],
  ["coa|dvd|usb", "Windows bo\xEEte/COA (revendeurs)"],
  ["^windows|windows 1|windows 8|windows 7|windows home", "Windows"],
  ["office 365|microsoft 365|onedrive", "Microsoft 365 / Office 365"],
  ["project", "Microsoft Project"],
  ["visio", "Microsoft Visio"],
  ["power ?bi", "Power BI"],
  ["office|access 20", "Microsoft Office (2013 \xE0 2024)"],
  ["visual studio", "Visual Studio"],
  ["vmware|parallels", "Virtualisation (VMware, Parallels)"],
  ["autodesk|autocad|formit", "Autodesk (AutoCAD, Revit, Maya\u2026)"],
  ["sketchup|enscape|lumion|bricscad|v-ray|corona|keyshot|twinmotion|rhino|archicad|solidworks|miro", "Architecture, 3D & rendu"],
  ["corel", "CorelDRAW"],
  ["adobe", "Adobe (Creative Cloud, Acrobat, Photoshop)"],
  ["canva", "Canva"],
  ["capcut", "CapCut Pro"],
  ["nitro", "Nitro PDF Pro"],
  ["norton|eset|mcafee|kaspersky", "Antivirus (Norton, ESET, McAfee, Kaspersky)"],
  ["spotify", "Spotify Premium"],
  ["dazn", "DAZN"],
  ["ccleaner", "CCleaner Pro"],
  ["spss", "IBM SPSS"],
  ["bluebeam", "Bluebeam Revu"],
  ["final cut|logic pro", "Logiciels Mac (Final Cut Pro, Logic Pro)"],
  ["app cleaner", "App Cleaner (Mac)"],
  ["expressvpn|vpn", "VPN"],
  ["idm|internet download", "IDM"],
  ["chatgpt", "IA & assistants"],
  ["jetbrains", "JetBrains"],
  ["stata", "Stata"],
  ["quickbooks", "QuickBooks"]
];
var HIDE = R("china vpn|moq|in a roll|blank sticker|not download|usb only|customize name|excluding japan|anti-?counterfeit|\\bpcs\\b|dazn account|fresh email", "i");
var DROP = [
  "\\baccount\\s*\\+\\s*password(\\s*\\+\\s*key)?\\b",
  "\\bbind\\s+redeem\\s+key\\b",
  "\\bredeem\\s+code\\b",
  "\\bbind\\s+key\\b",
  "\\bbind\\b",
  "\\bretail\\b",
  "\\boem\\b",
  "\\bmak\\b",
  "\\bcdk\\b",
  "\\bkeys?\\b",
  "\\bpanel\\b",
  "\\bnew account\\b",
  "\\baccount download\\b",
  "\\baccount\\b",
  "\\bactivation manual\\b",
  "\\bactivate online\\b",
  "\\bphone activation\\b",
  "\\binvitation\\b",
  "\\bsubscription\\b",
  "\\bglobal\\b",
  "\\bbasis\\b",
  "\\bmanual\\b",
  "\\bfixed\\b",
  "\\blicen[cs]e\\b",
  "\\(\\s*[\\d.x]+\\s*\u2265\\s*version\\s*\\)",
  "\\bsingle-user\\b",
  "\\bgift\\b",
  "\\bnot\\b",
  "\\bversion\\b"
].map((p) => R(p, "gi"));
var TR = [
  ["\\bCoreldDraw\\b", "CorelDRAW"],
  ["\\bSuit\\b", "Suite"],
  ["\\bProfesional\\b", "Professional"],
  ["\\bPower Bi\\b", "Power BI"],
  ["\\bEdu\\b", "\xC9ducation"],
  ["\\bEducation(al)?\\b", "\xC9ducation"],
  ["\\bFaculty\\b", "Enseignants"],
  ["\\bHome and Business\\b", "Famille et Petite Entreprise"],
  ["\\bHome and Student\\b", "Famille et \xC9tudiant"],
  ["\\bFamily Members\\b", "membre d'un abonnement Famille"],
  ["\\bFamily\\b", "Famille"],
  ["\\bPersonal\\b", "Personnel"],
  ["\\bIndividual\\b", "Individuel"],
  ["\\bWithout OneDrive\\b", "sans OneDrive"],
  ["\\bOther Separate App\\b", "une application au choix"],
  ["\\bAll Apps\\b", "toutes les applications"],
  ["\\bfor Windows\\b", "pour Windows"],
  ["\\bfor Mac\\b", "pour Mac"],
  ["\\bfor 1 Windows\\b", "pour Windows"],
  ["\\bfor 1 Mac\\b", "pour Mac"],
  ["\\bfor Rhinoceros 3D\\b", "(Rhinoceros 3D)"],
  ["\\bHome Upgrade Pro\\b", "mise \xE0 niveau Famille vers Pro"],
  ["\\bwith 1TB\\b", "+ 1 To"],
  ["Device/User Connections (\\d+) CAL", "$1 licences d'acc\xE8s (CAL)"],
  ["(User|Device) Connections (\\d+) CAL", "$2 licences d'acc\xE8s (CAL)"],
  ["\\bAdmin\\b", "administrateur"],
  ["\\bScreen\\b", "\xE9cran"],
  ["\\bPerpetual\\b", "\xE0 vie"],
  ["\\blifetime\\b", "\xE0 vie", "i"],
  ["\\bPhotography Plan Photoshop\\+Lightroom\\b", "Photographie (Photoshop + Lightroom)"],
  ["\\bCommercial\\b", "Commercial"],
  ["\\bTeam\\b", "\xE9quipe"],
  ["\\bMonths?\\b", "mois"],
  ["\\bYears?\\b", "an"],
  ["\\bDevices?\\b", "appareil"],
  ["\\bUsers?\\b", "utilisateur"],
  ["\\bIndividuel\\b", "Individuel"],
  ["(\\d+)\\s*TB\\b", "$1 To"],
  ["(\\d+)-core\\b", "$1 c\u0153urs"],
  ["\\bUS\\b", "(US)"],
  ["\\bCA\\b", "(Canada)"],
  ["\\bUK\\b", "(UK)"]
].map(([a, b, f]) => [R(a, "g" + (f || "")), b]);
function plural(s) {
  s = s.replace(R("\\b(\\d+) an\\b", "g"), (m, n) => `${n} an` + (Number(n) > 1 ? "s" : ""));
  for (const w of ["appareil", "utilisateur"])
    s = s.replace(R(`\\b(\\d+) ${w}\\b`, "g"), (m, n) => `${n} ${w}` + (Number(n) > 1 ? "s" : ""));
  return s;
}
__name(plural, "plural");
__name2(plural, "plural");
var DETAIL_SRC = "\\b\\d+\\s(?:mois|ans?|appareils?|utilisateurs?|PC(?:/Mac)?|Mac|To|c\u0153urs|\xE9crans?|licences d'acc\xE8s \\(CAL\\)|Core)\\b|\\b\xE0 vie\\b|\\bpour (?:Windows|Mac)\\b";
function publicName(raw) {
  let s = String(raw || "").replace(/\s+/g, " ").trim();
  if (!s)
    return ["", false];
  if (/[àâéèêîôûç]/.test(s) && !R("\\b(Key|Account|Retail|OEM|MAK)\\b").test(s))
    return [s, true];
  let visible = !HIDE.test(s);
  s = s.replace(/\(\s*\)/g, "");
  s = s.replace(/\((Maya[^)]*)\)/g, "(Maya, Revit, 3ds Max, Civil 3D, Inventor, Fusion\u2026)");
  s = s.replace(/Lifetime,\s*Gift\s*\+\s*/g, "Lifetime + ");
  s = s.replace(/Subscription 32 Version (.*?) 1 Key/g, "32 $1");
  s = s.replace(/\(China VPN\)|Excluding Japan and Brazil|Fresh Email|Customize Name/gi, "");
  for (const p of DROP)
    s = s.replace(p, " ");
  for (const [a, b] of TR)
    s = s.replace(a, b);
  s = s.replace(/^(20\d\d) (Adobe Acrobat Pro DC)/, "$2 $1");
  s = s.replace(/^Server (20\d\d)/, "Windows Server $1");
  s = stripChars(s.replace(/\s{2,}/g, " ").replace(/\s*[,+]\s*$/, ""), " ,-");
  s = plural(s);
  const det = [...s.matchAll(R(DETAIL_SRC, "g"))].map((m) => m[0]);
  let base = stripChars(s.replace(R(DETAIL_SRC, "g"), " ").replace(/\s{2,}/g, " "), " ,-+");
  base = base.replace(R("\\b(Premium|Pro|Plus)\\s+(Premium|Pro|Plus)\\b", "g"), "$1 $2");
  let out = base + (det.length ? " \u2013 " + [...new Set(det)].join(", ") : "");
  out = out.replace(/\s{2,}/g, " ").trim();
  if (base.length < 3 || R("\\b(key|account|password|redeem|bind|moq)\\b", "i").test(out))
    visible = false;
  return [out, visible];
}
__name(publicName, "publicName");
__name2(publicName, "publicName");
function digitalRows(rows, out, info) {
  const hi = rows.findIndex((r) => r && r[0] != null && r[0].trim().toLowerCase().startsWith("categorie"));
  if (hi < 0)
    throw new Error("feuille digitale : ligne d'en-t\xEAte \xAB Categorie \xBB introuvable");
  const hdr = rows[hi].map((h) => h.trim().toLowerCase());
  const iprod = hdr.indexOf("produit");
  const iprice = hdr.findIndex((h) => h.startsWith("prix"));
  const icom = hdr.findIndex((h) => h.includes("commission"));
  const iav = hdr.findIndex((h) => AVAIL_HDR_RE.test(h));
  info.digital_avail_col = iav >= 0 ? rows[hi][iav].trim() : null;
  for (const r of rows.slice(hi + 1)) {
    if (r.length <= iprod)
      continue;
    let name = r[iprod].replace(/\s+/g, " ").trim();
    if (!name || name.startsWith("---"))
      continue;
    const famE = DIGI_FAMILIES.find(([p]) => new RegExp(p, "i").test(name));
    const fam = famE ? famE[1] : "Autres logiciels";
    name = name.replace(/\((The most|With good luck)[^)]*\)?/g, "");
    name = name.replace(R("\\b(hot sale|free delivery|price fluctuation)\\b", "gi"), "");
    const raw = clean(name);
    let [pub, visible] = publicName(raw);
    if (!visible)
      continue;
    pub = clean(pub);
    if (iprice >= 0 && icom >= 0 && r.length > Math.max(iprice, icom) && r[icom].trim().toLowerCase() === "avec commission") {
      const raw2 = r[iprice].replace(/[\s\u00a0\u202f.,]/g, "");
      if (/^\d{3,7}$/.test(raw2)) {
        const e = { name: pub, family: `${fam}  ${clean(name)}`, source: "digital", category: "logiciel", price: Number(raw2) };
        if (iav >= 0) {
          const a = availOf(r[iav]);
          if (a !== null)
            e.avail = a;
        }
        out.push(e);
      }
    }
  }
}
__name(digitalRows, "digitalRows");
__name2(digitalRows, "digitalRows");
function applyOverrides(rows, overrides) {
  for (const o of overrides || []) {
    if (!o || !o.name || !Number.isInteger(o.price))
      continue;
    for (let i = rows.length - 1; i >= 0; i--)
      if (rows[i].name.toLowerCase() === o.name.toLowerCase())
        rows.splice(i, 1);
    const kw = (o.keywords || []).join(" ");
    const e = { name: o.name, family: ((o.family || "") + (kw ? " " + kw : "")).trim(), source: o.source || "digital", category: o.category || "logiciel", price: o.price, manual: true };
    if (kw)
      e.keywords = o.keywords;
    for (const k of ["storage", "ram", "cond", "note"])
      if (k in o)
        e[k] = o[k];
    rows.push(e);
  }
  return rows;
}
__name(applyOverrides, "applyOverrides");
__name2(applyOverrides, "applyOverrides");
function buildEntries(phoneCsv, digitalCsv, overrides = PRICE_OVERRIDES) {
  const out = [], info = {};
  phoneRows(parseCsv(phoneCsv), out, info);
  digitalRows(parseCsv(digitalCsv), out, info);
  applyOverrides(out, overrides);
  return { entries: out, info };
}
__name(buildEntries, "buildEntries");
__name2(buildEntries, "buildEntries");
async function fetchCsv(id, fetchFn) {
  const r = await fetchFn(`https://docs.google.com/spreadsheets/d/${id}/export?format=csv`, { redirect: "follow", headers: { "User-Agent": "EH-SheetSync/1.0" } });
  const ct = r.headers.get("content-type") || "";
  if (!r.ok)
    throw new Error(`sheet ${id.slice(0, 8)} HTTP ${r.status}`);
  if (!ct.includes("text/csv"))
    throw new Error(`sheet ${id.slice(0, 8)} pas un CSV (partage restreint ?)`);
  return await r.text();
}
__name(fetchCsv, "fetchCsv");
__name2(fetchCsv, "fetchCsv");
function diffSummary(oldE, newE) {
  const key = /* @__PURE__ */ __name2((e) => `${e.name}|${e.storage || ""}|${e.ram || ""}|${e.cond || ""}|${e.source}`, "key");
  const om = new Map((oldE || []).map((e) => [key(e), e])), nm = new Map(newE.map((e) => [key(e), e]));
  let added = 0, removed = 0, price = 0, avail = 0;
  for (const [k, e] of nm) {
    const o = om.get(k);
    if (!o)
      added++;
    else {
      if (o.price !== e.price)
        price++;
      if (o.avail !== false !== (e.avail !== false))
        avail++;
    }
  }
  for (const k of om.keys())
    if (!nm.has(k))
      removed++;
  return { added, removed, price, avail };
}
__name(diffSummary, "diffSummary");
__name2(diffSummary, "diffSummary");
async function syncSheets(env, { force = false, fetchFn = fetch, reason = "cron" } = {}) {
  const t0 = Date.now();
  const [pc, dc] = await Promise.all([fetchCsv(SHEET_PHONES, fetchFn), fetchCsv(SHEET_DIGITAL, fetchFn)]);
  const { entries, info } = buildEntries(pc, dc);
  let supOv = null;
  try {
    supOv = await supApplyToEntries(env, entries);
  } catch (e) {
    console.error("sup overlay soft-fail", e && e.message || e);
  }
  if (entries.length < 50)
    throw new Error(`seulement ${entries.length} prix lus \u2014 synchro annul\xE9e (feuille vide ou mal form\xE9e ?)`);
  let old = null;
  try {
    const raw = await env.EH_KV.get("cfg:prices_client");
    old = typeof raw === "string" ? JSON.parse(raw) : raw;
  } catch {
  }
  const oldE = old && Array.isArray(old.entries) ? old.entries : [];
  const changed = JSON.stringify(oldE) !== JSON.stringify(entries);
  const diff = diffSummary(oldE, entries);
  const unavailable = entries.filter((e) => e.avail === false).length;
  const res = { ok: true, reason, changed, written: false, count: entries.length, unavailable, diff, avail_cols: info, ms: 0, supplier_overlay: supOv ? { applied: supOv.applied, held: supOv.held, added: supOv.added, pruned: supOv.pruned } : null };
  if (changed || force) {
    const payload = { ...old && typeof old === "object" ? old : {}, version: (/* @__PURE__ */ new Date()).toISOString().slice(0, 10) + "-sheet-auto", entries, synced_at: Date.now() };
    if (!payload.currency)
      payload.currency = "FCFA";
    await env.EH_KV.put("cfg:prices_client", JSON.stringify(payload));
    res.written = true;
  }
  res.ms = Date.now() - t0;
  return res;
}
__name(syncSheets, "syncSheets");
__name2(syncSheets, "syncSheets");
function syncReport(res) {
  if (!res.ok)
    return `\u26A0\uFE0F Synchro catalogue \xE9chou\xE9e : ${res.error}. Les anciens prix restent en place.`;
  const miss = [];
  if (!res.avail_cols.phones_avail_col)
    miss.push("T\xE9l\xE9phones");
  if (!res.avail_cols.digital_avail_col)
    miss.push("Produits digitaux");
  const d = res.diff;
  let s = `\u{1F504} Synchro catalogue ${res.written ? "\u2705 mise \xE0 jour" : "\u2705 d\xE9j\xE0 \xE0 jour (rien \xE9crit)"} \u2014 ${res.count} prix`;
  if (res.written)
    s += ` (${d.added} ajout(s), ${d.removed} retrait(s), ${d.price} prix modifi\xE9(s), ${d.avail} dispo modifi\xE9e(s))`;
  s += `. Indisponibles : ${res.unavailable}.`;
  if (miss.length)
    s += ` Colonne de disponibilit\xE9 absente (${miss.join(", ")}) : ajoutez une colonne \xAB Dispo \xBB avec oui / non (ou \xAB Stock \xBB avec une quantit\xE9) \u2014 en attendant, un article pr\xE9sent dans la feuille = disponible, retir\xE9 de la feuille = indisponible.`;
  return s;
}
__name(syncReport, "syncReport");
__name2(syncReport, "syncReport");
var NEVER_REPLY = /* @__PURE__ */ new Set([]);
var OWNER_WAS = /* @__PURE__ */ new Set(["22997342101", "2290197342101", "22996984737", "2290196984737"]); // V10: 2nd boss 22996984737
var OWNER_PHONE_DEFAULT = "1364570600073371";
var WA_LINES_DEFAULT = { WA_CAISSE: "1364570600073371", WA_STATUT: "pending", WA_PROPRIO: "22997342101" };
var LINES_STATE = globalThis.__ehLines || (globalThis.__ehLines = { at: 0, cfg: null });
var LINE_OF = globalThis.__ehLineOf || (globalThis.__ehLineOf = /* @__PURE__ */ new Map());
var LP_STATE = globalThis.__ehLinePause || (globalThis.__ehLinePause = { at: 0, v: null });
function isPid(x) {
  return /^\d{10,20}$/.test(String(x || ""));
}
__name(isPid, "isPid");
async function linesCfg(env) {
  const t = Date.now();
  if (LINES_STATE.cfg && t - LINES_STATE.at < 6e4)
    return LINES_STATE.cfg;
  const c = { ...WA_LINES_DEFAULT };
  try {
    if (env.WA_LINES)
      Object.assign(c, JSON.parse(env.WA_LINES));
  } catch {
  }
  try {
    const j = await env.EH_KV.get("cfg:lines");
    if (j)
      Object.assign(c, JSON.parse(j));
  } catch {
  }
  c.WA_CAISSE = OWNER_PHONE_DEFAULT;
  if (!/^\d{8,15}$/.test(String(c.WA_PROPRIO || "")))
    c.WA_PROPRIO = WA_LINES_DEFAULT.WA_PROPRIO;
  LINES_STATE.cfg = c;
  LINES_STATE.at = t;
  return c;
}
__name(linesCfg, "linesCfg");
function line2Id(c) {
  return isPid(c.WA_STATUT) && String(c.WA_STATUT) !== String(c.WA_CAISSE) ? String(c.WA_STATUT) : null;
}
__name(line2Id, "line2Id");
function lineNum(c, pid) {
  const p = String(pid || "");
  if (p === String(c.WA_CAISSE))
    return 1;
  const l2 = line2Id(c);
  return l2 && p === l2 ? 2 : 0;
}
__name(lineNum, "lineNum");
async function lineOf(env, wa) {
  const k = String(wa || "");
  if (!k)
    return null;
  const c = LINE_OF.get(k);
  if (c && Date.now() - c.at < 6e5)
    return c.pid;
  let pid = null;
  try {
    pid = await env.EH_KV.get(`line:${k}`);
  } catch {
  }
  LINE_OF.set(k, { pid: pid || null, at: Date.now() });
  if (LINE_OF.size > 2e3)
    LINE_OF.delete(LINE_OF.keys().next().value);
  return pid || null;
}
__name(lineOf, "lineOf");
async function lineNote(env, wa, pid) {
  try {
    const c = await linesCfg(env);
    const l2 = line2Id(c);
    if (!l2 || !wa || !pid)
      return;
    const cur = await lineOf(env, wa);
    if (String(pid) === l2 && cur !== l2) {
      await env.EH_KV.put(`line:${wa}`, l2, { expirationTtl: 30 * 86400 });
      LINE_OF.set(String(wa), { pid: l2, at: Date.now() });
    } else if (String(pid) === String(c.WA_CAISSE) && cur) {
      await env.EH_KV.delete(`line:${wa}`);
      LINE_OF.set(String(wa), { pid: null, at: Date.now() });
    }
  } catch (err) {
    console.error("lineNote soft-fail", err && err.message || err);
  }
}
__name(lineNote, "lineNote");
async function lineRoute(env, phoneId, to) {
  try {
    const t = String(to || "");
    if (!t || String(phoneId) !== OWNER_PHONE_DEFAULT || OWNER_WAS.has(t))
      return phoneId;
    const l2 = line2Id(await linesCfg(env));
    if (!l2)
      return phoneId;
    return await lineOf(env, t) === l2 ? l2 : phoneId;
  } catch {
    return phoneId;
  }
}
__name(lineRoute, "lineRoute");
async function linePauseGet(env) {
  if (LP_STATE.v && Date.now() - LP_STATE.at < 15e3)
    return LP_STATE.v;
  let v = {};
  try {
    v = JSON.parse(await env.EH_KV.get("cfg:line_pause") || "{}") || {};
  } catch {
  }
  LP_STATE.v = v;
  LP_STATE.at = Date.now();
  return v;
}
__name(linePauseGet, "linePauseGet");
async function linePauseSet(env, v) {
  LP_STATE.v = v;
  LP_STATE.at = Date.now();
  await env.EH_KV.put("cfg:line_pause", JSON.stringify(v));
}
__name(linePauseSet, "linePauseSet");
async function linePaused(env, pid, wa) {
  try {
    const lp = await linePauseGet(env);
    if (lp.all)
      return true;
    if (!lp["1"] && !lp["2"])
      return false;
    const c = await linesCfg(env);
    const p = pid || await lineOf(env, wa) || OWNER_PHONE_DEFAULT;
    const n = lineNum(c, p);
    return !!(n && lp[String(n)]);
  } catch {
    return false;
  }
}
__name(linePaused, "linePaused");
function lineLabel(n) {
  return n === 1 ? "ligne 1 (WA_CAISSE +229 01 59 71 67 16)" : "ligne 2 (WA_STATUT +229 01 53 63 20 00)";
}
__name(lineLabel, "lineLabel");
async function ownerLinesCommand(env, phoneId, to, nt, now) {
  const c = await linesCfg(env);
  const l2 = line2Id(c);
  const lp = { ...await linePauseGet(env) };
  const m = nt.match(/^(pause|reprends|reprend|reprise) (tout|1|2)$/);
  let txt;
  if (m) {
    const on = m[1] === "pause";
    if (m[2] === "tout") {
      if (on)
        lp.all = 1;
      else {
        delete lp.all;
        delete lp["1"];
        delete lp["2"];
      }
    } else if (on)
      lp[m[2]] = 1;
    else
      delete lp[m[2]];
    await linePauseSet(env, lp);
    if (m[2] === "tout")
      txt = on ? "\u23F8 Bot en pause sur TOUTES les lignes (1 = 59, 2 = 53). Les messages clients sont gard\xE9s et signal\xE9s (liste / APK). \xAB reprends tout \xBB pour relancer." : "\u25B6\uFE0F Bot relanc\xE9 sur toutes les lignes.";
    else
      txt = on ? `\u23F8 Bot en pause sur la ${lineLabel(+m[2])}.${lp.all ? " (pause tout d\xE9j\xE0 active)" : ""} \xAB reprends ${m[2]} \xBB pour relancer.` : `\u25B6\uFE0F Bot relanc\xE9 sur la ${lineLabel(+m[2])}.${lp.all ? " \u26A0\uFE0F \xAB pause tout \xBB reste active : \xE9crivez \xAB reprends tout \xBB." : ""}`;
    if (m[2] === "2" && !l2)
      txt += "\n\u2139\uFE0F La ligne 2 n'est pas encore branch\xE9e \xE0 Meta (en attente) : r\xE9glage gard\xE9 pour plus tard.";
  } else {
    let paused = [];
    try {
      const l = await env.EH_KV.list({ prefix: "pause:", limit: 1e3 });
      paused = l.keys.map((k) => k.name.slice(6));
    } catch {
    }
    const flags = await listOpenFlags(env);
    const st = /* @__PURE__ */ __name((n) => lp.all || lp[String(n)] ? "\u23F8 pause" : "\u25B6\uFE0F active", "st");
    txt = `\u{1F4DE} Lignes WhatsApp :
\u2022 1 WA_CAISSE (59) : ${st(1)}
\u2022 2 WA_STATUT (53) : ${l2 ? st(2) : "en attente Meta (pas encore branch\xE9e)"}${lp.all ? "\n\u23F8 \xAB pause tout \xBB active" : ""}
\u23F8 Discussions en pause (g\xE9rant) : ${paused.length}${paused.length ? " \u2014 " + paused.slice(0, 8).join(", ") : ""}
\u{1F6A9} Clients en attente de r\xE9ponse : ${flags.length}${flags.length ? "\n" + flags.slice(0, 8).map((f, i) => `${i + 1}. ${f.name || "?"} (${f.wa_id})${f.reason ? " \u2014 " + f.reason : ""}`).join("\n") : ""}
Commandes : pause tout / reprends tout / pause 1 / reprends 1 / pause 2 / reprends 2`;
  }
  await sendText(env, phoneId, to, txt);
}
__name(ownerLinesCommand, "ownerLinesCommand");
var ES_APP_ID = "3454950308016509";
var ES_BUSINESS_ID = "1092440816495106";
var ES_SYSTEM_USER_ID = "122100182691487994";
var ES_CATALOG_ID = "38335921126052809";
var ES_LINE2_DIGITS = "22901536320";
var ES_LINE2_DIGITS_ALT = "2290153632000";
var ES_GRAPH = "https://graph.facebook.com/v23.0";
var ES_WEBHOOK = "https://eh-whatsapp.domingohoreb.workers.dev/webhook";
async function sha256Hex(s) {
  const d = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(s));
  return [...new Uint8Array(d)].map((b) => b.toString(16).padStart(2, "0")).join("");
}
__name(sha256Hex, "sha256Hex");
function esCookie(req) {
  const m = (req.headers.get("Cookie") || "").match(/(?:^|;\s*)eh_c2=([a-f0-9]{64})/);
  return m ? m[1] : null;
}
__name(esCookie, "esCookie");
async function esSession(req, env) {
  const t = esCookie(req);
  if (!t)
    return false;
  try {
    return !!await env.EH_KV.get(`c2sess:${t}`);
  } catch {
    return false;
  }
}
__name(esSession, "esSession");
function esHtml(body, status = 200, extra = {}) {
  return new Response(`<!doctype html><html lang="fr"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="robots" content="noindex"><title>Electronic HOUSE \u2014 Ligne 2</title><style>body{font-family:system-ui,sans-serif;max-width:680px;margin:24px auto;padding:0 16px;color:#111}button{font-size:18px;padding:12px 20px;border-radius:8px;border:0;background:#1877f2;color:#fff;cursor:pointer}button[disabled]{background:#999}input{font-size:18px;padding:10px;width:100%;box-sizing:border-box}.card{border:1px solid #ddd;border-radius:10px;padding:14px;margin:14px 0}.muted{color:#666;font-size:14px}pre{white-space:pre-wrap;background:#f6f6f6;padding:10px;border-radius:8px;font-size:13px}.ok{color:#0a7d32}.ko{color:#b00020}</style></head><body>${body}</body></html>`, { status, headers: { "Content-Type": "text/html; charset=utf-8", "Cache-Control": "no-store", "X-Frame-Options": "DENY", "Referrer-Policy": "same-origin", ...extra } });
}
__name(esHtml, "esHtml");
async function esGraph(env, token, path, method = "GET", params = null) {
  const opt = { method, headers: token ? { Authorization: `Bearer ${token}` } : {} };
  let u = `${env.GRAPH_BASE_URL ? graphBase(env) : ES_GRAPH}/${path}`;
  if (params && method === "GET")
    u += (u.includes("?") ? "&" : "?") + new URLSearchParams(params).toString();
  else if (params) {
    opt.headers["Content-Type"] = "application/json";
    opt.body = JSON.stringify(params);
  }
  try {
    const r = await fetch(u, opt);
    let j = {};
    try {
      j = await r.json();
    } catch {
    }
    return { status: r.status, j };
  } catch (err) {
    return { status: 599, j: { error: { message: String(err && err.message || err) } } };
  }
}
__name(esGraph, "esGraph");
function esErr(r) {
  const e = r && r.j && r.j.error;
  return e ? { status: r.status, code: e.code || null, subcode: e.error_subcode || null, message: String(e.error_user_msg || e.message || "").slice(0, 300) } : null;
}
__name(esErr, "esErr");
function esIsLine2(p) {
  const d = String(p && p.display_phone_number || "").replace(/\D/g, "");
  return d === ES_LINE2_DIGITS || d === ES_LINE2_DIGITS_ALT || d.endsWith("53632000");
}
__name(esIsLine2, "esIsLine2");
async function esFinish(env, input) {
  const now = Math.floor(Date.now() / 1e3);
  const res = { at: now, event: String(input.event || "").slice(0, 60), steps: {} };
  const S = /* @__PURE__ */ __name((k, v) => {
    res.steps[k] = v;
  }, "S");
  let waba = /^\d{6,20}$/.test(String(input.waba_id || "")) ? String(input.waba_id) : null;
  let pid = /^\d{6,20}$/.test(String(input.phone_number_id || "")) ? String(input.phone_number_id) : null;
  let bizTok = null;
  if (input.code && env.META_APP_SECRET) {
    const r = await esGraph(env, null, `oauth/access_token?client_id=${ES_APP_ID}&client_secret=${encodeURIComponent(env.META_APP_SECRET)}&code=${encodeURIComponent(String(input.code))}`);
    bizTok = r.j && r.j.access_token || null;
    S("code_exchange", bizTok ? "ok" : esErr(r) || "no_token");
  } else
    S("code_exchange", input.code ? "skipped (META_APP_SECRET absent: jeton syst\xE8me EH Bot utilis\xE9)" : "no_code");
  const tok = env.WA_TOKEN;
  if (!waba) {
    for (const edge of ["client_whatsapp_business_accounts", "owned_whatsapp_business_accounts"]) {
      const r = await esGraph(env, tok, `${ES_BUSINESS_ID}/${edge}?fields=id,name&limit=50`);
      for (const w of r.j && r.j.data || []) {
        if (w.id === "1115610207664862")
          continue;
        const pr = await esGraph(env, tok, `${w.id}/phone_numbers?fields=id,display_phone_number`);
        const hit = (pr.j && pr.j.data || []).find(esIsLine2);
        if (hit) {
          waba = w.id;
          pid = pid || hit.id;
          break;
        }
      }
      if (waba)
        break;
    }
    S("discover_waba", waba ? `found ${waba}` : "not_found");
  }
  if (!waba) {
    res.ok = false;
    res.blocker = "WABA de la ligne 2 introuvable (ni dans l'\xE9v\xE9nement, ni via le Business).";
    return res;
  }
  res.waba_id = waba;
  {
    let r = await esGraph(env, tok, `${waba}/assigned_users`, "POST", { user: ES_SYSTEM_USER_ID, tasks: ["MANAGE"] });
    if (r.status >= 300 && bizTok)
      r = await esGraph(env, bizTok, `${waba}/assigned_users`, "POST", { user: ES_SYSTEM_USER_ID, tasks: ["MANAGE"] });
    S("assign_system_user", r.status < 300 ? "ok" : esErr(r));
  }
  const useTok = /* @__PURE__ */ __name(async (path, method, params) => {
    let r = await esGraph(env, tok, path, method, params);
    if (r.status >= 300 && bizTok)
      r = await esGraph(env, bizTok, path, method, params);
    return r;
  }, "useTok");
  {
    const r = await useTok(`${waba}/phone_numbers?fields=id,display_phone_number,verified_name,status,platform_type,is_on_biz_app,quality_rating`, "GET");
    const list = r.j && r.j.data || [];
    const hit = list.find((p) => pid ? p.id === pid : esIsLine2(p)) || list.find(esIsLine2);
    if (hit) {
      pid = hit.id;
      res.phone = { id: hit.id, display: hit.display_phone_number, status: hit.status, platform_type: hit.platform_type, is_on_biz_app: hit.is_on_biz_app };
    }
    S("phone_numbers", hit ? "ok" : esErr(r) || `no match in ${list.length}`);
  }
  if (!pid) {
    res.ok = false;
    res.blocker = "phone_number_id de la ligne 2 introuvable dans le WABA.";
    return res;
  }
  res.phone_number_id = pid;
  {
    const r = await useTok(`${waba}/subscribed_apps`, "POST", { override_callback_uri: ES_WEBHOOK, verify_token: env.VERIFY_TOKEN || "" });
    let r2 = r;
    if (r.status >= 300)
      r2 = await useTok(`${waba}/subscribed_apps`, "POST", {});
    S("subscribe_app", r2.status < 300 ? r === r2 ? "ok (override eh-whatsapp)" : "ok (callback app par d\xE9faut)" : esErr(r2));
  }
  {
    let cur = {};
    try {
      cur = JSON.parse(await env.EH_KV.get("cfg:lines") || "{}") || {};
    } catch {
    }
    const next = { WA_CAISSE: OWNER_PHONE_DEFAULT, WA_PROPRIO: "22997342101", ...cur, WA_STATUT: pid, WA_STATUT_WABA: waba };
    await env.EH_KV.put("cfg:lines", JSON.stringify(next));
    LINES_STATE.cfg = null;
    S("cfg_lines", "ok");
  }
  for (const st of ["smb_app_state_sync", "history"]) {
    const r = await useTok(`${pid}/smb_app_data`, "POST", { messaging_product: "whatsapp", sync_type: st });
    S(`sync_${st}`, r.status < 300 ? `ok ${r.j && r.j.request_id || ""}` : esErr(r));
  }
  {
    const r = await useTok(`${waba}/product_catalogs`, "POST", { catalog_id: ES_CATALOG_ID });
    S("catalog_link_waba", r.status < 300 ? "ok" : esErr(r));
    const r2 = await useTok(`${pid}/whatsapp_commerce_settings`, "POST", { is_catalog_visible: true, is_cart_enabled: false });
    S("commerce_settings", r2.status < 300 ? "ok" : esErr(r2));
  }
  res.ok = true;
  try {
    await ownerNotify(env, `\u2705 Ligne 2 (53) branch\xE9e au bot \u2014 phone_number_id ${pid}, compte ${waba}. D\xE9tail : /connect-ligne2/status`, { kind: "ligne2" });
  } catch {
  }
  return res;
}
__name(esFinish, "esFinish");
async function connectLigne2(req, env, url, ctx) {
  const path = url.pathname.replace(/\/+$/, "");
  const ip = req.headers.get("cf-connecting-ip") || "?";
  if (req.method === "POST") {
    const o = req.headers.get("Origin");
    if (o && o !== url.origin)
      return new Response("Forbidden", { status: 403 });
  }
  if (path === "/connect-ligne2/login" && req.method === "POST") {
    const rk = `c2fail:${ip}`;
    let fails = 0;
    try {
      fails = Number(await env.EH_KV.get(rk) || 0);
    } catch {
    }
    if (fails >= 8)
      return esHtml("<p class=ko>Trop d'essais. R\xE9essayez dans 15 minutes.</p>", 429);
    const f = await req.formData().catch(() => new FormData());
    const pw = String(f.get("pw") || "");
    let hash = null, salt = "";
    try {
      hash = await env.EH_KV.get("cfg:connect_pw");
      salt = await env.EH_KV.get("cfg:connect_salt") || "";
    } catch {
    }
    if (!hash || !pw || await sha256Hex(salt + pw) !== hash) {
      try {
        await env.EH_KV.put(rk, String(fails + 1), { expirationTtl: 900 });
      } catch {
      }
      return esHtml(`<p class=ko>Mot de passe incorrect.</p><p><a href="/connect-ligne2">Retour</a></p>`, 401);
    }
    const tokS = [...crypto.getRandomValues(new Uint8Array(32))].map((b) => b.toString(16).padStart(2, "0")).join("");
    await env.EH_KV.put(`c2sess:${tokS}`, String(Math.floor(Date.now() / 1e3)), { expirationTtl: 3 * 3600 });
    return new Response(null, { status: 303, headers: { Location: "/connect-ligne2", "Set-Cookie": `eh_c2=${tokS}; Path=/connect-ligne2; HttpOnly; Secure; SameSite=Lax; Max-Age=10800`, "Cache-Control": "no-store" } });
  }
  if (!await esSession(req, env)) {
    if (req.method !== "GET")
      return new Response("Forbidden", { status: 403 });
    return esHtml(`<h2>Electronic HOUSE \u2014 brancher la ligne 2</h2><form method="post" action="/connect-ligne2/login"><p><input type="password" name="pw" placeholder="Mot de passe" autocomplete="current-password" required></p><p><button type="submit">Entrer</button></p></form>`, 200);
  }
  if (path === "/connect-ligne2/log" && req.method === "POST") {
    let j = {};
    try {
      j = await req.json();
    } catch {
    }
    const clean2 = JSON.stringify(j).replace(/"code"\s*:\s*"[^"]*"/g, '"code":"<redacted>"').slice(0, 2e3);
    let arr = [];
    try {
      arr = JSON.parse(await env.EH_KV.get("cfg:line2_eslog") || "[]");
    } catch {
    }
    arr.push({ at: Math.floor(Date.now() / 1e3), d: clean2 });
    await env.EH_KV.put("cfg:line2_eslog", JSON.stringify(arr.slice(-30)), { expirationTtl: 30 * 86400 });
    return json({ ok: true });
  }
  if (path === "/connect-ligne2/finish" && req.method === "POST") {
    let j = {};
    try {
      j = await req.json();
    } catch {
    }
    const lock = await env.EH_KV.get("cfg:line2_onboard");
    if (lock && JSON.parse(lock).ok && !url.searchParams.get("force"))
      return json({ ok: true, already: JSON.parse(lock) });
    const res = await esFinish(env, j);
    await env.EH_KV.put("cfg:line2_onboard", JSON.stringify(res));
    return json(res);
  }
  if (path === "/connect-ligne2/status") {
    const [ob, lg, lines] = await Promise.all([env.EH_KV.get("cfg:line2_onboard"), env.EH_KV.get("cfg:line2_eslog"), env.EH_KV.get("cfg:lines")]);
    return esHtml(`<h2>Ligne 2 \u2014 \xE9tat</h2><div class=card><b>cfg:lines</b><pre>${esc(lines || "(vide)")}</pre></div><div class=card><b>R\xE9sultat du branchement</b><pre>${esc(ob || "(pas encore)")}</pre></div><div class=card><b>Journal Embedded Signup</b><pre>${esc(lg || "(vide)")}</pre></div><p><a href="/connect-ligne2">Retour</a></p>`);
  }
  let cfgId = null;
  try {
    cfgId = await env.EH_KV.get("cfg:es_config_id");
  } catch {
  }
  const ready = /^\d{6,25}$/.test(String(cfgId || ""));
  return esHtml(`<h2>Brancher la ligne 2 (+229 01 53 63 20 00) au bot</h2>
<div class=card><b>Avant de commencer</b><ol><li>Le t\xE9l\xE9phone de la ligne 53 est allum\xE9, connect\xE9, avec <b>WhatsApp Business</b> \xE0 jour.</li><li>Vous \xEAtes connect\xE9 \xE0 Facebook avec le compte administrateur d'Electronic House.</li><li>Ne supprimez rien sur le t\xE9l\xE9phone. L'app reste ouverte et continue de marcher.</li></ol></div>
${ready ? "" : "<p class=ko>\u26A0\uFE0F Pas encore pr\xEAt : la configuration Meta (config_id) n'est pas renseign\xE9e. Ne rien faire pour l'instant.</p>"}
<p><button id=go ${ready ? "" : "disabled"}>Connecter mon WhatsApp Business existant</button></p>
<div class=card><b>Sur le t\xE9l\xE9phone, quand Facebook le demande :</b><ol><li>Dans la fen\xEAtre Facebook, choisissez <b>\xAB Connecter votre compte WhatsApp Business existant \xBB</b> et tapez le num\xE9ro 01 53 63 20 00.</li><li>Sur le t\xE9l\xE9phone, ouvrez le message de <b>Facebook Business</b> \u2192 <b>Se connecter \xE0 la Business Platform</b> \u2192 <b>Confirmer</b>.</li><li>Choisissez de partager ou non l'historique des discussions.</li><li>Tapez le code affich\xE9 sur l'ordinateur (ou scannez le QR code).</li><li>Revenez ici et attendez le message \u2705. Gardez WhatsApp Business ouvert quelques minutes.</li></ol></div>
<pre id=out class=muted></pre><p class=muted><a href="/connect-ligne2/status">\xC9tat / journal</a></p>
<script>
const out=document.getElementById('out');let code=null,sess=null,sent=false;
function log(t){out.textContent+=t+"\\n";}
function post(p,b){return fetch('/connect-ligne2/'+p,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(b),credentials:'same-origin'}).then(r=>r.json()).catch(e=>({ok:false,error:String(e)}));}
async function maybeFinish(){if(sent||!sess)return;if(!/FINISH/.test(sess.event||''))return;sent=true;log('Branchement en cours\u2026');const d=sess.data||{};const r=await post('finish',{event:sess.event,waba_id:d.waba_id,phone_number_id:d.phone_number_id,business_id:d.business_id,code:code});log(r.ok?'\u2705 Ligne 2 branch\xE9e. phone_number_id '+(r.phone_number_id||(r.already&&r.already.phone_number_id)||'?'):'\u26A0\uFE0F '+(r.blocker||r.error||'\xE9chec'));log(JSON.stringify(r.steps||r.already||r,null,1));}
window.addEventListener('message',ev=>{if(!/(^|\\.)facebook\\.com$/.test(new URL(ev.origin).hostname))return;let d;try{d=typeof ev.data==='string'?JSON.parse(ev.data):ev.data;}catch(e){return;}if(!d||d.type!=='WA_EMBEDDED_SIGNUP')return;sess=d;post('log',d);log('Meta : '+(d.event||'?'));maybeFinish();});
window.fbAsyncInit=function(){FB.init({appId:'${ES_APP_ID}',autoLogAppEvents:true,xfbml:false,version:'v23.0'});};
document.getElementById('go').onclick=function(){if(!window.FB){log('SDK Facebook pas charg\xE9, rechargez la page.');return;}FB.login(function(r){post('log',{login:r&&r.status,has_code:!!(r&&r.authResponse&&r.authResponse.code)});if(r&&r.authResponse&&r.authResponse.code){code=r.authResponse.code;}setTimeout(maybeFinish,1500);if(!(r&&r.authResponse))log('Fen\xEAtre ferm\xE9e sans terminer.');},{config_id:'${ready ? cfgId : ""}',response_type:'code',override_default_response_type:true,extras:{setup:{},featureType:'whatsapp_business_app_onboarding',sessionInfoVersion:'3'}});};
<\/script><script async defer crossorigin="anonymous" src="https://connect.facebook.net/fr_FR/sdk.js"><\/script>`);
}
__name(connectLigne2, "connectLigne2");
var AUTO_PAUSE_S2 = 1 * 3600;
var DAY = 24 * 3600;
var RL_DAY_MAX = 30;
var HIST_MAX = 60;
var MODELS = ["@cf/meta/llama-3.3-70b-instruct-fp8-fast", "@cf/meta/llama-3.1-8b-instruct-fp8", "@cf/meta/llama-3.2-3b-instruct"];
var GEMINI_MODELS = ["gemini-3-flash-preview", "gemini-3.1-flash-lite"];
var GEMINI_API_BASE = "https://generativelanguage.googleapis.com/v1beta/models";
var GROQ_API_BASE = "https://api.groq.com/openai/v1/chat/completions";
var GROQ_MODELS = ["openai/gpt-oss-120b", "qwen/qwen3.8-27b", "openai/gpt-oss-20b"];
var OPENROUTER_API_BASE = "https://openrouter.ai/api/v1/chat/completions";
var OPENROUTER_MODELS = ["openai/gpt-4o-mini", "openai/gpt-4o", "anthropic/claude-3.5-haiku"];
var MISTRAL_API_BASE = "https://api.mistral.ai/v1/chat/completions";
var MISTRAL_MODELS = ["mistral-small-latest", "open-mistral-nemo"];
var HF_API_BASE = "https://router.huggingface.co/v1/chat/completions";
var HF_MODELS = ["meta-llama/Llama-3.1-8B-Instruct", "Qwen/Qwen3-4B-Instruct-2507"];
var HF_TIMEOUT_MS = 7e3;
var COHERE_API_BASE = "https://api.cohere.com/v2/chat";
var COHERE_MODELS = ["command-r-plus-08-2024", "command-r-08-2024"];
var COHERE_TIMEOUT_MS = 7e3;
var AI_HEALTH_URL = "https://eh-ai-health.internal/state";
var AI_FAIL_THRESHOLD = 2;
var AI_DOWN_TTL_MS = 20 * 60 * 1e3;
var AI_PROBE_OK_TTL_MS = 10 * 60 * 1e3;
var AI_PROBE_MODEL = MODELS[MODELS.length - 1];
var AI_HARD_ERR_RE = /4000|4001|4006|4020|4021|4022|4023|4029|5028|neuron|quota|allocation|deprecated|not found in the catalog|model.?not.?found|capacity|exhausted|rate.?limit|\b429\b|\b503\b|Workers AI missing|AiError|inference|billing|API_KEY|RESOURCE_EXHAUSTED|PERMISSION_DENIED|UNAUTHENTICATED|generativelanguage|GEMINI_API_KEY missing|GROQ_API_KEY missing|OPENROUTER_API_KEY missing|MISTRAL_API_KEY missing|HF_TOKEN missing|COHERE_API_KEY missing|Gemini|groq|openrouter|mistral|huggingface|Hugging Face|cohere|Cohere|insufficient_quota|credits/i;
var AI_TIMEOUT_MS = 8e3;
var AI_CLOUD_BUDGET_MS = 16e3;
var MODEL_COOL_MS = 15 * 60 * 1e3;
var MODEL_COOL_URL = "https://eh-ai-health.internal/model-cool";
async function readModelCool() {
  try {
    const mem = globalThis.__ehModelCool;
    if (mem && typeof mem === "object")
      return { ...mem };
    const hit = await caches.default.match(new Request(MODEL_COOL_URL));
    if (hit) {
      const j = await hit.json();
      globalThis.__ehModelCool = j;
      return { ...j };
    }
  } catch (_) {
  }
  return {};
}
__name(readModelCool, "readModelCool");
__name2(readModelCool, "readModelCool");
__name22(readModelCool, "readModelCool");
async function writeModelCool(map) {
  globalThis.__ehModelCool = map;
  try {
    await caches.default.put(new Request(MODEL_COOL_URL), new Response(JSON.stringify(map), {
      headers: { "Content-Type": "application/json", "Cache-Control": "max-age=86400" }
    }));
  } catch (_) {
  }
}
__name(writeModelCool, "writeModelCool");
__name2(writeModelCool, "writeModelCool");
__name22(writeModelCool, "writeModelCool");
function coolKey(provider, model) {
  return `${provider}::${model}`;
}
__name(coolKey, "coolKey");
__name2(coolKey, "coolKey");
__name22(coolKey, "coolKey");
async function isModelCool(provider, model) {
  const map = await readModelCool();
  const until = Number(map[coolKey(provider, model)] || 0);
  return until > Date.now();
}
__name(isModelCool, "isModelCool");
__name2(isModelCool, "isModelCool");
__name22(isModelCool, "isModelCool");
async function markModelCool(provider, model, errMsg) {
  if (!model)
    return;
  const hard = /quota|rate.?limit|429|404|does not exist|no endpoints|not found|billing|exhausted|RESOURCE_EXHAUSTED|insufficient/i.test(String(errMsg || ""));
  if (!hard)
    return;
  const map = await readModelCool();
  map[coolKey(provider, model)] = Date.now() + MODEL_COOL_MS;
  const now = Date.now();
  for (const k of Object.keys(map))
    if (Number(map[k]) <= now)
      delete map[k];
  await writeModelCool(map);
  console.error("model_cool", provider, model, String(errMsg || "").slice(0, 120));
}
__name(markModelCool, "markModelCool");
__name2(markModelCool, "markModelCool");
__name22(markModelCool, "markModelCool");
async function filterCoolModels(provider, models) {
  const out = [];
  for (const m of models) {
    if (!await isModelCool(provider, m))
      out.push(m);
  }
  return out.length ? out : models;
}
__name(filterCoolModels, "filterCoolModels");
__name2(filterCoolModels, "filterCoolModels");
__name22(filterCoolModels, "filterCoolModels");
var RENDER_HEALTH_URL = "https://eh-wa-failover-mr.onrender.com/health";
function isHardAiError(msg) {
  return AI_HARD_ERR_RE.test(String(msg || ""));
}
__name(isHardAiError, "isHardAiError");
__name2(isHardAiError, "isHardAiError");
__name22(isHardAiError, "isHardAiError");
function defaultAiHealth() {
  return { fails: 0, down_until: 0, last_err: null, last_ok: 0, last_check: 0, last_probe: null };
}
__name(defaultAiHealth, "defaultAiHealth");
__name2(defaultAiHealth, "defaultAiHealth");
__name22(defaultAiHealth, "defaultAiHealth");
async function readAiHealth() {
  const mem = globalThis.__ehAiHealth;
  if (mem && typeof mem === "object")
    return { ...defaultAiHealth(), ...mem };
  try {
    const hit = await caches.default.match(new Request(AI_HEALTH_URL));
    if (hit) {
      const j = await hit.json();
      const st = { ...defaultAiHealth(), ...j };
      globalThis.__ehAiHealth = st;
      return st;
    }
  } catch (e) {
    console.error("readAiHealth soft-fail", e && e.message || e);
  }
  return defaultAiHealth();
}
__name(readAiHealth, "readAiHealth");
__name2(readAiHealth, "readAiHealth");
__name22(readAiHealth, "readAiHealth");
async function writeAiHealth(st) {
  const next = { ...defaultAiHealth(), ...st };
  globalThis.__ehAiHealth = next;
  try {
    await caches.default.put(new Request(AI_HEALTH_URL), new Response(JSON.stringify(next), {
      headers: { "Content-Type": "application/json", "Cache-Control": "max-age=604800" }
    }));
  } catch (e) {
    console.error("writeAiHealth soft-fail", e && e.message || e);
  }
  return next;
}
__name(writeAiHealth, "writeAiHealth");
__name2(writeAiHealth, "writeAiHealth");
__name22(writeAiHealth, "writeAiHealth");
async function markAiOk(env, via = "run") {
  const st = await readAiHealth();
  const now = Date.now();
  return writeAiHealth({
    fails: 0,
    down_until: 0,
    last_err: null,
    last_ok: now,
    last_check: now,
    last_probe: via
  });
}
__name(markAiOk, "markAiOk");
__name2(markAiOk, "markAiOk");
__name22(markAiOk, "markAiOk");
async function markAiFail(env, errMsg, via = "run") {
  const st = await readAiHealth();
  const now = Date.now();
  const hard = isHardAiError(errMsg);
  let fails = Number(st.fails) || 0;
  if (hard)
    fails = via === "probe" ? AI_FAIL_THRESHOLD : fails + 1;
  let down_until = Number(st.down_until) || 0;
  if (down_until > now)
    down_until = now + AI_DOWN_TTL_MS;
  else if (hard && fails >= AI_FAIL_THRESHOLD)
    down_until = now + AI_DOWN_TTL_MS;
  return writeAiHealth({
    fails,
    down_until,
    last_err: String(errMsg || "").slice(0, 400),
    last_ok: st.last_ok || 0,
    last_check: now,
    last_probe: via
  });
}
__name(markAiFail, "markAiFail");
__name2(markAiFail, "markAiFail");
__name22(markAiFail, "markAiFail");
async function aiHealthSnapshot() {
  const st = await readAiHealth();
  const now = Date.now();
  const down = Number(st.down_until) > now;
  return {
    ok: !down,
    down,
    fails: Number(st.fails) || 0,
    down_until: Number(st.down_until) || 0,
    down_remaining_s: down ? Math.ceil((Number(st.down_until) - now) / 1e3) : 0,
    last_err: st.last_err || null,
    last_ok: st.last_ok || 0,
    last_check: st.last_check || 0,
    last_probe: st.last_probe || null
  };
}
__name(aiHealthSnapshot, "aiHealthSnapshot");
__name2(aiHealthSnapshot, "aiHealthSnapshot");
__name22(aiHealthSnapshot, "aiHealthSnapshot");
async function probeWorkersAi(env) {
  if (!env.AI) {
    return { ok: false, err: "Workers AI missing binding", skipped: true };
  }
  try {
    const out = await env.AI.run(AI_PROBE_MODEL, {
      messages: [{ role: "user", content: "ping" }],
      max_tokens: 1,
      temperature: 0
    });
    return { ok: true, model: AI_PROBE_MODEL };
  } catch (e) {
    const msg = String(e && e.message || e);
    return { ok: false, err: msg, model: AI_PROBE_MODEL };
  }
}
__name(probeWorkersAi, "probeWorkersAi");
__name2(probeWorkersAi, "probeWorkersAi");
__name22(probeWorkersAi, "probeWorkersAi");
async function probeGemini(env) {
  if (!env.GEMINI_API_KEY) {
    return { ok: false, err: "GEMINI_API_KEY missing", skipped: true };
  }
  try {
    const r = await callGemini(env, [
      { role: "system", content: "R\xE9ponds juste : pong" },
      { role: "user", content: "ping" }
    ], { max_tokens: 48, temperature: 0, model: GEMINI_MODELS[0] });
    if (r.ok && r.text)
      return { ok: true, model: r.model || GEMINI_MODELS[0] };
    return { ok: false, err: r.err || "empty", model: GEMINI_MODELS[0] };
  } catch (e) {
    return { ok: false, err: String(e && e.message || e), model: GEMINI_MODELS[0] };
  }
}
__name(probeGemini, "probeGemini");
__name2(probeGemini, "probeGemini");
__name22(probeGemini, "probeGemini");
async function probeGroq(env) {
  if (!env.GROQ_API_KEY) {
    return { ok: false, err: "GROQ_API_KEY missing", skipped: true };
  }
  try {
    const r = await callGroq(env, [
      { role: "system", content: "R\xE9ponds juste : pong" },
      { role: "user", content: "ping" }
    ], { max_tokens: 48, temperature: 0, model: GROQ_MODELS[0] });
    if (r.ok && r.text)
      return { ok: true, model: r.model || GROQ_MODELS[0] };
    return { ok: false, err: r.err || "empty", model: GROQ_MODELS[0] };
  } catch (e) {
    return { ok: false, err: String(e && e.message || e), model: GROQ_MODELS[0] };
  }
}
__name(probeGroq, "probeGroq");
__name2(probeGroq, "probeGroq");
__name22(probeGroq, "probeGroq");
async function probeOpenRouter(env) {
  if (!env.OPENROUTER_API_KEY) {
    return { ok: false, err: "OPENROUTER_API_KEY missing", skipped: true };
  }
  try {
    const r = await callOpenRouter(env, [
      { role: "system", content: "R\xE9ponds juste : pong" },
      { role: "user", content: "ping" }
    ], { max_tokens: 48, temperature: 0, model: OPENROUTER_MODELS[0] });
    if (r.ok && r.text)
      return { ok: true, model: r.model || OPENROUTER_MODELS[0] };
    return { ok: false, err: r.err || "empty", model: OPENROUTER_MODELS[0] };
  } catch (e) {
    return { ok: false, err: String(e && e.message || e), model: OPENROUTER_MODELS[0] };
  }
}
__name(probeOpenRouter, "probeOpenRouter");
__name2(probeOpenRouter, "probeOpenRouter");
__name22(probeOpenRouter, "probeOpenRouter");
async function probeMistral(env) {
  if (!env.MISTRAL_API_KEY) {
    return { ok: false, err: "MISTRAL_API_KEY missing", skipped: true };
  }
  try {
    const r = await callMistral(env, [
      { role: "system", content: "R\xE9ponds juste : pong" },
      { role: "user", content: "ping" }
    ], { max_tokens: 48, temperature: 0, model: MISTRAL_MODELS[0] });
    if (r.ok && r.text)
      return { ok: true, model: r.model || MISTRAL_MODELS[0] };
    return { ok: false, err: r.err || "empty", model: MISTRAL_MODELS[0] };
  } catch (e) {
    return { ok: false, err: String(e && e.message || e), model: MISTRAL_MODELS[0] };
  }
}
__name(probeMistral, "probeMistral");
__name2(probeMistral, "probeMistral");
__name22(probeMistral, "probeMistral");
async function probeHuggingFace(env) {
  if (!env.HF_TOKEN) {
    return { ok: false, err: "HF_TOKEN missing", skipped: true };
  }
  try {
    const r = await callHuggingFace(env, [
      { role: "system", content: "R\xE9ponds juste : pong" },
      { role: "user", content: "ping" }
    ], { max_tokens: 48, temperature: 0, model: HF_MODELS[0] });
    if (r.ok && r.text)
      return { ok: true, model: r.model || HF_MODELS[0] };
    return { ok: false, err: r.err || "empty", model: HF_MODELS[0] };
  } catch (e) {
    return { ok: false, err: String(e && e.message || e), model: HF_MODELS[0] };
  }
}
__name(probeHuggingFace, "probeHuggingFace");
__name2(probeHuggingFace, "probeHuggingFace");
__name22(probeHuggingFace, "probeHuggingFace");
async function probeCohere(env) {
  if (!env.COHERE_API_KEY) {
    return { ok: false, err: "COHERE_API_KEY missing", skipped: true };
  }
  try {
    const r = await callCohere(env, [
      { role: "system", content: "R\xE9ponds juste : pong" },
      { role: "user", content: "ping" }
    ], { max_tokens: 48, temperature: 0, model: COHERE_MODELS[0] });
    if (r.ok && r.text)
      return { ok: true, model: r.model || COHERE_MODELS[0] };
    return { ok: false, err: r.err || "empty", model: COHERE_MODELS[0] };
  } catch (e) {
    return { ok: false, err: String(e && e.message || e), model: COHERE_MODELS[0] };
  }
}
__name(probeCohere, "probeCohere");
__name2(probeCohere, "probeCohere");
__name22(probeCohere, "probeCohere");
async function probeAiStack(env) {
  const empty = { gemini: null, groq: null, openrouter: null, mistral: null, huggingface: null, cohere: null, workers: null };
  const g = await probeGemini(env);
  if (g.ok) {
    await markAiOk(env, "probe_gemini");
    return { ok: true, via: "gemini", model: g.model, ...empty, gemini: g };
  }
  const q = await probeGroq(env);
  if (q.ok) {
    await markAiOk(env, "probe_groq");
    return { ok: true, via: "groq", model: q.model, ...empty, gemini: g, groq: q };
  }
  const o = await probeOpenRouter(env);
  if (o.ok) {
    await markAiOk(env, "probe_openrouter");
    return { ok: true, via: "openrouter", model: o.model, ...empty, gemini: g, groq: q, openrouter: o };
  }
  const mi = await probeMistral(env);
  if (mi.ok) {
    await markAiOk(env, "probe_mistral");
    return { ok: true, via: "mistral", model: mi.model, ...empty, gemini: g, groq: q, openrouter: o, mistral: mi };
  }
  const hf = await probeHuggingFace(env);
  if (hf.ok) {
    await markAiOk(env, "probe_huggingface");
    return { ok: true, via: "huggingface", model: hf.model, ...empty, gemini: g, groq: q, openrouter: o, mistral: mi, huggingface: hf };
  }
  const co = await probeCohere(env);
  if (co.ok) {
    await markAiOk(env, "probe_cohere");
    return { ok: true, via: "cohere", model: co.model, ...empty, gemini: g, groq: q, openrouter: o, mistral: mi, huggingface: hf, cohere: co };
  }
  const w = await probeWorkersAi(env);
  if (w.ok) {
    await markAiOk(env, "probe_workers");
    return { ok: true, via: "workers_ai", model: w.model, gemini: g, groq: q, openrouter: o, mistral: mi, huggingface: hf, cohere: co, workers: w };
  }
  const sideDown = /* @__PURE__ */ __name22((key, res) => !key || isHardAiError(res && res.err) || !(res && res.skipped), "sideDown");
  const allDown = sideDown(env.GEMINI_API_KEY, g) && sideDown(env.GROQ_API_KEY, q) && sideDown(env.OPENROUTER_API_KEY, o) && sideDown(env.MISTRAL_API_KEY, mi) && sideDown(env.HF_TOKEN, hf) && sideDown(env.COHERE_API_KEY, co) && sideDown(env.AI, w);
  const err = `gemini: ${g.err || "fail"} | groq: ${q.err || "fail"} | openrouter: ${o.err || "fail"} | mistral: ${mi.err || "fail"} | huggingface: ${hf.err || "fail"} | cohere: ${co.err || "fail"} | workers: ${w.err || "fail"}`;
  if (allDown)
    await markAiFail(env, err, "probe");
  return { ok: false, via: null, model: null, gemini: g, groq: q, openrouter: o, mistral: mi, huggingface: hf, cohere: co, workers: w, err };
}
__name(probeAiStack, "probeAiStack");
__name2(probeAiStack, "probeAiStack");
__name22(probeAiStack, "probeAiStack");
async function ensureAiHealth(env, { forceProbe = false } = {}) {
  const st = await readAiHealth();
  const now = Date.now();
  const down = Number(st.down_until) > now;
  const anyCloudKey = !!(env.GEMINI_API_KEY || env.GROQ_API_KEY || env.OPENROUTER_API_KEY || env.MISTRAL_API_KEY || env.HF_TOKEN || env.COHERE_API_KEY);
  if (!forceProbe && down && !anyCloudKey) {
    return aiHealthSnapshot();
  }
  if (!forceProbe)
    return aiHealthSnapshot();
  const freshOk = Number(st.last_ok) && now - Number(st.last_ok) < AI_PROBE_OK_TTL_MS && !down;
  if (!forceProbe && freshOk) {
    return aiHealthSnapshot();
  }
  await probeAiStack(env);
  return aiHealthSnapshot();
}
__name(ensureAiHealth, "ensureAiHealth");
__name2(ensureAiHealth, "ensureAiHealth");
__name22(ensureAiHealth, "ensureAiHealth");
async function catalogHealthOk(env) {
  try {
    const cat = await loadCatalog(env, false);
    const prices = await loadPrices(env, false);
    const nCat = cat && (Array.isArray(cat.items) ? cat.items.length : cat.products && cat.products.length) || 0;
    const nPrices = prices && (Array.isArray(prices.entries) ? prices.entries.length : Array.isArray(prices.items) ? prices.items.length : prices.rows && prices.rows.length || 0) || 0;
    return { ok: nCat > 0 || nPrices > 0, nCat, nPrices, version: cat && cat.version || null };
  } catch (e) {
    return { ok: false, err: String(e && e.message || e), nCat: 0, nPrices: 0 };
  }
}
__name(catalogHealthOk, "catalogHealthOk");
__name2(catalogHealthOk, "catalogHealthOk");
__name22(catalogHealthOk, "catalogHealthOk");
function computeWhoSpeaks({ geminiOk, groqOk, openrouterOk, mistralOk, huggingfaceOk, cohereOk, workersOk, catalogueOk, secoursOn, renderActive }) {
  if (secoursOn)
    return 6;
  if (renderActive)
    return 5;
  if (geminiOk || groqOk || openrouterOk || mistralOk || huggingfaceOk || cohereOk)
    return 1;
  if (workersOk)
    return 2;
  if (catalogueOk)
    return 3;
  return 4;
}
__name(computeWhoSpeaks, "computeWhoSpeaks");
__name2(computeWhoSpeaks, "computeWhoSpeaks");
__name22(computeWhoSpeaks, "computeWhoSpeaks");
function whoSpeaksLabel(who2, { geminiOk, groqOk, openrouterOk, mistralOk, huggingfaceOk, cohereOk }) {
  if (who2 === 1) {
    if (geminiOk)
      return "1 CF+Gemini (primary)";
    if (groqOk)
      return "1 CF+Groq";
    if (openrouterOk)
      return "1 CF+OpenRouter";
    if (mistralOk)
      return "1 CF+Mistral";
    if (huggingfaceOk)
      return "1 CF+Hugging Face";
    if (cohereOk)
      return "1 CF+Cohere";
    return "1 CF+cloud AI";
  }
  return {
    2: "2 CF+Workers AI (cloud KO)",
    3: "3 CF+Catalogue (IA KO)",
    4: "4 CF+Filet conversation",
    5: "5 Render+cron (Meta override)",
    6: "6 New Bot secours (CF+Render down)",
    7: "7 APK/97 humain"
  }[who2] || String(who2);
}
__name(whoSpeaksLabel, "whoSpeaksLabel");
__name2(whoSpeaksLabel, "whoSpeaksLabel");
__name22(whoSpeaksLabel, "whoSpeaksLabel");
async function buildWhoSpeaksHealth(env, { forceProbe = false } = {}) {
  const snap = await ensureAiHealth(env, { forceProbe });
  let geminiOk = false, groqOk = false, openrouterOk = false, mistralOk = false, huggingfaceOk = false, cohereOk = false, workersOk = false, via = snap.last_probe || null;
  let probe_errs = null;
  if (forceProbe) {
    const stack = await probeAiStack(env);
    geminiOk = !!(stack.gemini && stack.gemini.ok) || stack.via === "gemini";
    groqOk = !!(stack.groq && stack.groq.ok) || stack.via === "groq";
    openrouterOk = !!(stack.openrouter && stack.openrouter.ok) || stack.via === "openrouter";
    mistralOk = !!(stack.mistral && stack.mistral.ok) || stack.via === "mistral";
    huggingfaceOk = !!(stack.huggingface && stack.huggingface.ok) || stack.via === "huggingface";
    cohereOk = !!(stack.cohere && stack.cohere.ok) || stack.via === "cohere";
    workersOk = !!(stack.workers && stack.workers.ok) || stack.via === "workers_ai";
    via = stack.via;
    const take = /* @__PURE__ */ __name22((x) => x ? { ok: !!x.ok, err: x.err || null, skipped: !!x.skipped } : null, "take");
    probe_errs = {
      gemini: take(stack.gemini),
      groq: take(stack.groq),
      openrouter: take(stack.openrouter),
      mistral: take(stack.mistral),
      huggingface: take(stack.huggingface),
      cohere: take(stack.cohere),
      workers: take(stack.workers),
      stack_err: stack.err || null
    };
  } else {
    const lp = String(snap.last_probe || "");
    geminiOk = /gemini/i.test(lp) || !!env.GEMINI_API_KEY && snap.ok && !/groq|openrouter|mistral|huggingface|hf_|cohere|workers/i.test(lp);
    groqOk = /groq/i.test(lp);
    openrouterOk = /openrouter/i.test(lp);
    mistralOk = /mistral/i.test(lp);
    huggingfaceOk = /huggingface|hf_/i.test(lp);
    cohereOk = /cohere/i.test(lp);
    workersOk = /workers/i.test(lp);
    if (snap.ok && env.GEMINI_API_KEY && !groqOk && !openrouterOk && !mistralOk && !huggingfaceOk && !cohereOk && !workersOk)
      geminiOk = true;
  }
  const catH = await catalogHealthOk(env);
  const catalogueOk = !!catH.ok;
  const filetOk = true;
  const replies_ok = !!(geminiOk || groqOk || openrouterOk || mistralOk || huggingfaceOk || cohereOk || workersOk || catalogueOk || filetOk);
  let secoursOn = false;
  try {
    secoursOn = !!(await assistantSecoursGet(env)).on;
  } catch {
    secoursOn = false;
  }
  if (replies_ok && secoursOn) {
    try {
      await assistantSecoursSet(env, false, "auto_off_cf_healthy");
    } catch {
    }
    secoursOn = false;
  }
  const flags = { geminiOk, groqOk, openrouterOk, mistralOk, huggingfaceOk, cohereOk, workersOk, catalogueOk, secoursOn, renderActive: false };
  const who2 = computeWhoSpeaks(flags);
  const http = true;
  const phrase = whoSpeaksLabel(who2, flags);
  return {
    ok: replies_ok && http,
    http,
    gemini: geminiOk,
    groq: groqOk,
    openrouter: openrouterOk,
    mistral: mistralOk,
    huggingface: huggingfaceOk,
    cohere: cohereOk,
    workers_ai: workersOk,
    catalogue: catalogueOk,
    filet: filetOk,
    replies_ok,
    who_speaks: who2,
    who_speaks_label: phrase,
    ai: snap,
    ai_primary: "gemini",
    ai_chain: ["gemini", "groq", "openrouter", "mistral", "huggingface", "cohere", "workers_ai", "catalogue", "filet"],
    gemini_configured: !!env.GEMINI_API_KEY,
    groq_configured: !!env.GROQ_API_KEY,
    openrouter_configured: !!env.OPENROUTER_API_KEY,
    mistral_configured: !!env.MISTRAL_API_KEY,
    huggingface_configured: !!env.HF_TOKEN,
    cohere_configured: !!env.COHERE_API_KEY,
    gemini_models: GEMINI_MODELS,
    groq_models: GROQ_MODELS,
    openrouter_models: OPENROUTER_MODELS,
    mistral_models: MISTRAL_MODELS,
    huggingface_models: HF_MODELS,
    cohere_models: COHERE_MODELS,
    ai_models: MODELS,
    ai_fallback: "groq>openrouter>mistral>huggingface>cohere>workers_ai",
    catalog_version: catH.version,
    catalog_n: catH.nCat,
    prices_n: catH.nPrices,
    secours_on: secoursOn,
    kv_degraded: !!globalThis.__ehKvDegraded,
    via,
    probe_errs,
    ts: Math.floor(Date.now() / 1e3),
    service: "eh-whatsapp",
    worker: "up"
  };
}
__name(buildWhoSpeaksHealth, "buildWhoSpeaksHealth");
__name2(buildWhoSpeaksHealth, "buildWhoSpeaksHealth");
__name22(buildWhoSpeaksHealth, "buildWhoSpeaksHealth");
async function healthHttpResponse(env, { detail = false, forceProbe = false } = {}) {
  const h = await buildWhoSpeaksHealth(env, { forceProbe });
  const status = h.http && h.replies_ok ? 200 : 503;
  if (detail) {
    return Response.json(h, { status, headers: { "Cache-Control": "no-store" } });
  }
  const body = status === 200 ? "Electronic HOUSE webhook OK" : "Electronic HOUSE webhook REPLIES_DOWN";
  return new Response(body, { status, headers: { "Cache-Control": "no-store", "Content-Type": "text/plain; charset=utf-8" } });
}
__name(healthHttpResponse, "healthHttpResponse");
__name2(healthHttpResponse, "healthHttpResponse");
__name22(healthHttpResponse, "healthHttpResponse");
var OWNER_NOTIFY_WA = "22997342101";
function lastAssistText(history = []) {
  const a = (history || []).filter((h) => h.role === "assistant" || h.role === "owner");
  return String((a.slice(-1)[0] || {}).text || "");
}
__name(lastAssistText, "lastAssistText");
__name2(lastAssistText, "lastAssistText");
__name22(lastAssistText, "lastAssistText");
function unwrapReply(v, depth = 0) {
  if (depth > 6 || v == null)
    return "";
  if (typeof v === "object") {
    if ("reply" in v)
      return unwrapReply(v.reply, depth + 1);
    return "";
  }
  let s = String(v).trim();
  if (!s)
    return "";
  if (s.startsWith("{") && /"reply"\s*:/.test(s)) {
    try {
      const o = JSON.parse(s);
      if (o && typeof o === "object" && "reply" in o)
        return unwrapReply(o.reply, depth + 1);
    } catch {
    }
    const m = s.match(/"reply"\s*:\s*"((?:\\.|[^"\\])*)"/);
    if (m) {
      try {
        return unwrapReply(JSON.parse(`"${m[1]}"`), depth + 1);
      } catch {
        return unwrapReply(m[1].replace(/\\n/g, "\n").replace(/\\"/g, '"').replace(/\\\\/g, "\\"), depth + 1);
      }
    }
  }
  return s;
}
__name(unwrapReply, "unwrapReply");
__name2(unwrapReply, "unwrapReply");
__name22(unwrapReply, "unwrapReply");
function cleanReply(t) {
  let s = unwrapReply(t);
  if (/^\s*\{/.test(s) && /"reply"\s*:/.test(s))
    s = unwrapReply(s);
  if (/^\s*\{[\s\S]*\}\s*$/.test(s) && /"(flag|reason|product)"\s*:/.test(s)) {
    const m = s.match(/"reply"\s*:\s*"((?:\\.|[^"\\])*)"/);
    s = m ? m[1].replace(/\\n/g, "\n").replace(/\\"/g, '"').replace(/\\\\/g, "\\") : "";
  }
  return s.replace(/[*_#`>]+/g, "").replace(/^\s*[-•]\s*/gm, "").replace(/\s+\n/g, "\n").trim().slice(0, 600);
}
__name(cleanReply, "cleanReply");
__name2(cleanReply, "cleanReply");
__name22(cleanReply, "cleanReply");
function aiExtractText(out) {
  if (out == null)
    return "";
  if (typeof out === "string" || typeof out === "number")
    return String(out);
  if (typeof out !== "object")
    return String(out);
  if ("reply" in out && (typeof out.reply === "string" || typeof out.reply === "object")) {
    return typeof out.reply === "string" ? out.reply : JSON.stringify(out);
  }
  const candidates = [
    out.response,
    out.result?.response,
    out.result?.text,
    out.result,
    out.text,
    out.output_text,
    out.generated_text,
    out.content,
    Array.isArray(out.choices) && out.choices[0] && (out.choices[0].message?.content ?? out.choices[0].text ?? out.choices[0].content),
    Array.isArray(out) && out[0] && (out[0].response ?? out[0].text ?? out[0].generated_text)
  ];
  for (const c of candidates) {
    if (c == null || c === out)
      continue;
    if (typeof c === "string" || typeof c === "number") {
      const s = String(c).trim();
      if (s)
        return s;
    } else if (typeof c === "object") {
      if ("reply" in c)
        return typeof c.reply === "string" ? JSON.stringify(c) : JSON.stringify(c);
      if ("response" in c && typeof c.response === "string" && c.response.trim())
        return c.response;
      if ("text" in c && typeof c.text === "string" && c.text.trim())
        return c.text;
      try {
        const s = JSON.stringify(c);
        if (s && s !== "{}" && s !== "null")
          return s;
      } catch {
      }
    }
  }
  try {
    const s = JSON.stringify(out);
    if (s && s !== "{}" && s !== "null")
      return s;
  } catch {
  }
  return "";
}
__name(aiExtractText, "aiExtractText");
__name2(aiExtractText, "aiExtractText");
__name22(aiExtractText, "aiExtractText");
function parseModel(out) {
  if (out && typeof out === "object" && !Array.isArray(out) && "reply" in out && typeof out.reply !== "undefined") {
    return { reply: unwrapReply(out.reply), flag: !!out.flag, reason: out.reason || "", product: out.product || "", raw: "" };
  }
  if (out && typeof out === "object" && out.response && typeof out.response === "object" && "reply" in out.response) {
    const o = out.response;
    return { reply: unwrapReply(o.reply), flag: !!o.flag, reason: o.reason || "", product: o.product || "", raw: "" };
  }
  if (out && typeof out === "object" && out.result && typeof out.result === "object" && "reply" in out.result) {
    const o = out.result;
    return { reply: unwrapReply(o.reply), flag: !!o.flag, reason: o.reason || "", product: o.product || "", raw: "" };
  }
  let txt = aiExtractText(out);
  txt = String(txt || "").trim();
  if (!txt)
    return { reply: "", flag: false, reason: "", product: "", raw: "" };
  let parsed = null;
  for (let i = 0; i < txt.length; i++) {
    if (txt[i] !== "{")
      continue;
    for (let j = txt.length; j > i + 1; j--) {
      if (txt[j - 1] !== "}")
        continue;
      try {
        const o = JSON.parse(txt.slice(i, j));
        if (o && typeof o === "object" && "reply" in o) {
          parsed = o;
          break;
        }
      } catch {
      }
    }
    if (parsed)
      break;
  }
  if (parsed) {
    return { reply: unwrapReply(parsed.reply), flag: !!parsed.flag, reason: parsed.reason || "", product: parsed.product || "", raw: txt };
  }
  const plain = unwrapReply(txt);
  return { reply: plain, flag: false, reason: "", product: "", raw: txt };
}
__name(parseModel, "parseModel");
__name2(parseModel, "parseModel");
__name22(parseModel, "parseModel");
var CATALOG_CACHE = { at: 0, data: null };
async function loadCatalog(env, fresh = false) {
  if (!fresh && CATALOG_CACHE.data && Date.now() - CATALOG_CACHE.at < 5 * 60 * 1e3)
    return CATALOG_CACHE.data;
  let data = null;
  try {
    data = JSON.parse(await env.EH_KV.get("cfg:catalog") || "null");
  } catch {
  }
  try { // V3 2026-10-13: merge eh_catalog_extra (published by eh-relay to cfg:catalog_extra), read-only, sheet untouched
    const x = data && Array.isArray(data.items) ? JSON.parse(await env.EH_KV.get("cfg:catalog_extra") || "null") : null;
    if (x && Array.isArray(x.items) && x.items.length) { const have = new Set(data.items.map((i) => String(i && i.name || "").toLowerCase())); data = { ...data, items: [...data.items, ...x.items.filter((i) => i && i.name && !have.has(String(i.name).toLowerCase())).slice(0, 200)] }; }
  } catch {
  }
  CATALOG_CACHE = { at: Date.now(), data };
  return data;
}
__name(loadCatalog, "loadCatalog");
__name2(loadCatalog, "loadCatalog");
__name22(loadCatalog, "loadCatalog");
var norm = /* @__PURE__ */ __name22((t) => String(t || "").toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, ""), "norm");
var STOP = new Set("le la les un une des de du et ou a au aux en pour avec sans vous nous je tu il est sont c ce ca quoi qui que quel quelle avez avoir as ont dispo disponible bonjour bonsoir salut svp merci prix combien cout coute stock oui non pas plus moins tres bien model modele version go gb to tb ram neuf venu scelle occasion the of for key pc logiciel logiciels abonnement abonnements application applications produit produits telephone telephones".split(" "));
function relevantItems(cat, query, max = 8) {
  if (!cat || !Array.isArray(cat.items))
    return [];
  const toks = [...new Set(norm(query).split(/[^a-z0-9+]+/).filter((t) => t && !STOP.has(t) && (t.length >= 3 || /\d/.test(t) && /[a-z]/.test(t) || /^\d{2,}$/.test(t))))];
  if (!toks.length)
    return [];
  const docs = cat.items.map((it) => {
    const hay = norm(`${it.name} ${it.family}`);
    return { it, hay, words: new Set(hay.split(/[^a-z0-9+]+/)) };
  });
  const N = docs.length, idf = {};
  for (const t of toks) {
    const df = docs.filter((d) => d.words.has(t) || t.length >= 4 && d.hay.includes(t)).length;
    idf[t] = df ? Math.log(1 + N / df) : 0;
  }
  const scored = [];
  for (const d of docs) {
    let sc = 0;
    for (const t of toks) {
      if (d.words.has(t))
        sc += idf[t] * (/\d/.test(t) ? 1.5 : 1);
      else if (t.length >= 4 && d.hay.includes(t))
        sc += idf[t] * 0.5;
    }
    if (sc > 0)
      scored.push([sc + (d.it.flagship ? 0.3 : 0), d.it]);
  }
  scored.sort((a, b) => b[0] - a[0]);
  const best = scored.length ? scored[0][0] : 0;
  return scored.filter((x) => x[0] >= best * 0.6 && x[0] >= 2).slice(0, max).map((x) => x[1]);
}
__name(relevantItems, "relevantItems");
__name2(relevantItems, "relevantItems");
__name22(relevantItems, "relevantItems");
var PRICES_CACHE = { at: 0, data: null };
async function runSheetSync(env, reason, manual = false) {
  let res;
  try {
    res = await syncSheets(env, { reason, fetchFn: globalThis.__sheetFetch || fetch });
  } catch (e) {
    res = { ok: false, reason, error: String(e && e.message || e).slice(0, 160) };
  }
  console.log("sheet_sync", JSON.stringify(res));
  if (res.ok && res.written)
    PRICES_CACHE = { at: 0, data: null };
  try {
    const c = caches.default;
    await c.put(new Request("https://eh.cache/sheet_sync_last"), new Response(JSON.stringify({ ...res, at: Date.now() }), { headers: { "Cache-Control": "max-age=172800" } }));
  } catch {
  }
  return res;
}
__name(runSheetSync, "runSheetSync");
__name2(runSheetSync, "runSheetSync");
__name22(runSheetSync, "runSheetSync");
async function maybeDailySheetSync(env, event) {
  const d = new Date(event && event.scheduledTime || Date.now());
  if (d.getUTCHours() !== 6 || d.getUTCMinutes() >= 15)
    return null;
  return await runSheetSync(env, "cron_7h");
}
__name(maybeDailySheetSync, "maybeDailySheetSync");
__name2(maybeDailySheetSync, "maybeDailySheetSync");
__name22(maybeDailySheetSync, "maybeDailySheetSync");
async function loadPrices(env, fresh = false) {
  if (!fresh && PRICES_CACHE.data && Date.now() - PRICES_CACHE.at < 5 * 60 * 1e3)
    return PRICES_CACHE.data;
  let data = null;
  try {
    data = JSON.parse(await env.EH_KV.get("cfg:prices_client") || "null");
  } catch {
  }
  PRICES_CACHE = { at: Date.now(), data };
  return data;
}
__name(loadPrices, "loadPrices");
__name2(loadPrices, "loadPrices");
__name22(loadPrices, "loadPrices");
var fmtFCFA = /* @__PURE__ */ __name22((n) => String(n).replace(/\B(?=(\d{3})+(?!\d))/g, " "), "fmtFCFA");
var BRANDS = [
  ["iphone", /\b(iphone|ip|apple)\b/],
  ["samsung", /\b(samsung|galaxy|sam)\b/],
  ["pixel", /\b(pixel|google)\b/],
  ["infinix", /\binfinix\b/],
  ["tecno", /\btecno\b/],
  ["xiaomi", /\b(redmi|xiaomi|poco|mi)\b/],
  ["oppo", /\boppo\b/],
  ["realme", /\brealme\b/],
  ["nokia", /\bnokia\b/],
  ["motorola", /\b(motorola|moto)\b/],
  ["huawei", /\bhuawei\b/],
  ["honor", /\bhonor\b/],
  ["vivo", /\bvivo\b/],
  ["watch", /\bwatch\b/]
];
var BRAND_WORDS = /\b(iphone|apple|samsung|galaxy|google|infinix|tecno|redmi|xiaomi|poco|oppo|realme|nokia|motorola|huawei|honor|vivo)\b/g;
function mnorm(t) {
  return " " + norm(t).replace(/\+/g, " plus ").replace(/(\d)([a-z])/g, "$1 $2").replace(/([a-z])(\d)/g, "$1 $2").replace(/\bpromax\b/g, "pro max").replace(/\bpm\b/g, "pro max").replace(/\bserie\b/g, "").replace(/\b\d+ ?mm\b/g, "").replace(/[^a-z0-9 ]+/g, " ").replace(/\s+/g, " ").trim() + " ";
}
__name(mnorm, "mnorm");
__name2(mnorm, "mnorm");
__name22(mnorm, "mnorm");
function brandOf(t) {
  const n = norm(t);
  const b = BRANDS.find(([, re]) => re.test(n));
  return b ? b[0] : null;
}
__name(brandOf, "brandOf");
__name2(brandOf, "brandOf");
__name22(brandOf, "brandOf");
function parseQuery(text) {
  const n = norm(text);
  let storage = null, ram = null, m;
  if (m = n.match(/\b(\d{2,3})\s*\/\s*(\d{1,2})(?:\s*\+\s*\d)?\b/)) {
    storage = +m[1];
    ram = m[2];
  }
  if (!storage && (m = n.match(/\b(\d{2,4})\s*(go|gb|g|giga)\b/)))
    storage = +m[1];
  if (!storage && (m = n.match(/\b1\s*(to|tb)\b/)))
    storage = 1024;
  if (!storage && (m = n.match(/\b(32|64|128|256|512)\b/)))
    storage = +m[1];
  if (!ram && (m = n.match(/\b(\d{1,2})\s*(go|gb)?\s*(de\s*)?ram\b/)))
    ram = m[1];
  const cond = /scell|neuf|new\b|sous blister/.test(n) ? "scelle" : /venu|occasion|reconditionn|used|seconde main|deuxieme main/.test(n) ? "venu" : "";
  const stripped = n.replace(/\b\d{2,3}\s*\/\s*\d{1,2}(\s*\+\s*\d)?\b/g, " ").replace(/\b\d{1,4}\s*(go|gb|g|giga|to|tb)\b/g, " ").replace(/\b\d{1,2}\s*(de\s*)?ram\b/g, " ").replace(/\b(32|64|128|256|512)\b/g, " ");
  return { storage, ram, cond, model: mnorm(stripped), brand: brandOf(n), raw: n };
}
__name(parseQuery, "parseQuery");
__name2(parseQuery, "parseQuery");
__name22(parseQuery, "parseQuery");
function priceLookup(prices, text) {
  if (!prices || !Array.isArray(prices.entries))
    return { status: "none" };
  const q = parseQuery(text);
  let cands = [];
  for (const e of prices.entries) {
    if (e.source === "digital")
      continue;
    const eb = brandOf(`${e.family} ${e.name}`);
    if (q.brand && eb && q.brand !== eb)
      continue;
    const key = mnorm(norm(e.name).replace(BRAND_WORDS, " ")).trim();
    if (!key || !q.model.includes(` ${key} `))
      continue;
    if ((/^\d/.test(key) || /^(xr|se 2020|x)$/.test(key)) && !q.brand)
      continue;
    cands.push({ e, key, len: key.split(" ").length });
  }
  if (!cands.length)
    return { status: "none" };
  const maxLen = Math.max(...cands.map((c) => c.len));
  cands = cands.filter((c) => c.len === maxLen).map((c) => c.e);
  const noteWords = /* @__PURE__ */ __name22((e) => norm(e.note).split(/\W+/).filter((w) => w.length >= 4), "noteWords");
  if (cands.some((e) => !e.note))
    cands = cands.filter((e) => !e.note || noteWords(e).some((w) => q.raw.includes(w)));
  if (q.storage) {
    const s = cands.filter((e) => e.storage === q.storage);
    cands = s.length ? s : cands.filter((e) => e.storage == null);
  }
  if (q.ram) {
    const r = cands.filter((e) => e.ram && e.ram.split("+")[0] === q.ram);
    if (r.length)
      cands = r;
  }
  if (q.cond) {
    const c = cands.filter((e) => e.cond === q.cond);
    cands = c.length ? c : cands.filter((e) => !e.cond);
  }
  if (!cands.length)
    return { status: "none" };
  const label = /* @__PURE__ */ __name22((e) => `${e.name}${e.storage ? ` ${e.storage} Go` : ""}${e.ram ? ` / ${e.ram} Go RAM` : ""}${e.cond === "scelle" ? " scell\xE9 (neuf)" : e.cond === "venu" ? " venu (occasion)" : ""}${e.note ? ` (${e.note})` : ""}`, "label");
  const distinct = [...new Set(cands.map((e) => e.price))];
  if (distinct.length === 1)
    return { status: "exact", entry: cands[0], price: distinct[0], label: label(cands[0]) };
  const dims = [];
  const matters = /* @__PURE__ */ __name22((f) => cands.some((a) => cands.some((b) => f(a) !== f(b) && a.price !== b.price && ["name", "storage", "ram", "cond"].filter((k) => k !== f.k).every((k) => a[k] === b[k]))), "matters");
  const by = /* @__PURE__ */ __name22((k) => Object.assign((e) => e[k], { k }), "by");
  if (matters(by("name")))
    dims.push("le mod\xE8le exact");
  if (matters(by("storage")))
    dims.push("la capacit\xE9");
  if (matters(by("ram")))
    dims.push("la RAM");
  if (matters(by("cond")))
    dims.push("l'\xE9tat (scell\xE9 neuf ou venu/occasion)");
  if (!dims.length)
    dims.push("la version exacte (capacit\xE9, RAM, \xE9tat)");
  return { status: "ambiguous", options: [...new Set(cands.map(label))].slice(0, 8), ask: dims.join(", ") };
}
__name(priceLookup, "priceLookup");
__name2(priceLookup, "priceLookup");
__name22(priceLookup, "priceLookup");
var DSTOP = new Set("prix combien coute cout tarif le la les l de du des d un une pour c est ce ca quel quelle quels svp stp fcfa cfa abonnement abonnements licence licences logiciel logiciels compte version vous avez as tu me moi je et ou a au en sur the and of s il plait bonjour bonsoir merci svp info infos avoir".split(" "));
function digitalLookup(prices, text) {
  if (!prices || !Array.isArray(prices.entries))
    return { status: "none" };
  let n = " " + norm(text).replace(/\b(\d+)\s*to\b/g, "$1tb").replace(/\b(\d+)\s*go\b/g, "$1gb").replace(/\ba vie\b/g, "lifetime") + " ";
  n = n.replace(/\bmois\b/g, "month").replace(/\b(ans?|annees?)\b/g, "year").replace(/\bappareils?\b/g, "device").replace(/\bcles?\b/g, "key").replace(/\bpostes?\b/g, "pc");
  const toks = [...new Set(n.split(/[^a-z0-9]+/).filter((t) => t && !DSTOP.has(t)))];
  if (!toks.some((t) => /^[a-z]{3,}$/.test(t)))
    return { status: "none" };
  const cands = [];
  for (const e of prices.entries) {
    if (e.source !== "digital")
      continue;
    const et = norm(`${e.name} ${e.family}`).replace(/\bmonths\b/g, "month").replace(/\byears\b/g, "year").replace(/\bdevices\b/g, "device").split(/[^a-z0-9]+/);
    const ok = toks.every((t) => et.includes(t) || t.length >= 4 && et.some((w) => w.startsWith(t)) || /^\d+$/.test(t) === false && t.length >= 5 && et.some((w) => t.startsWith(w) && w.length >= 4));
    if (ok)
      cands.push(e);
  }
  if (!cands.length)
    return { status: "none" };
  const distinct = [...new Set(cands.map((e) => e.price))];
  if (distinct.length === 1)
    return { status: "exact", entry: cands[0], price: distinct[0], label: cands[0].name, digital: true };
  return { status: "ambiguous", options: [...new Set(cands.map((e) => e.name))].slice(0, 6), more: cands.length, ask: "la version exacte (\xE9dition, dur\xE9e, nombre d'appareils ou d'utilisateurs)", digital: true };
}
__name(digitalLookup, "digitalLookup");
__name2(digitalLookup, "digitalLookup");
__name22(digitalLookup, "digitalLookup");
function normAck(t) {
  return norm(String(t || "")).replace(/[.!?,;:…]+/g, " ").replace(/\s+/g, " ").trim();
}
__name(normAck, "normAck");
__name2(normAck, "normAck");
__name22(normAck, "normAck");
function msgsToGemini(msgs) {
  let system = "";
  const contents = [];
  for (const m of msgs || []) {
    const roleIn = m && m.role;
    const text = String(m && m.content != null ? m.content : "").trim();
    if (!text && roleIn !== "system")
      continue;
    if (roleIn === "system") {
      system += (system ? "\n" : "") + String(m.content || "");
      continue;
    }
    const role = roleIn === "assistant" ? "model" : "user";
    if (contents.length && contents[contents.length - 1].role === role) {
      contents[contents.length - 1].parts[0].text += "\n" + text;
    } else {
      contents.push({ role, parts: [{ text }] });
    }
  }
  if (contents.length && contents[0].role === "model") {
    contents.unshift({ role: "user", parts: [{ text: "(contexte)" }] });
  }
  return { system, contents };
}
__name(msgsToGemini, "msgsToGemini");
__name2(msgsToGemini, "msgsToGemini");
__name22(msgsToGemini, "msgsToGemini");
function geminiExtractText(data) {
  if (!data || typeof data !== "object")
    return "";
  const cands = data.candidates || [];
  for (const c of cands) {
    const parts = c && c.content && c.content.parts || [];
    for (const p of parts) {
      if (p && typeof p.text === "string" && p.text.trim())
        return p.text.trim();
    }
  }
  return "";
}
__name(geminiExtractText, "geminiExtractText");
__name2(geminiExtractText, "geminiExtractText");
__name22(geminiExtractText, "geminiExtractText");
async function callGemini(env, msgs, { max_tokens = 280, temperature = 0.7, model = null, timeoutMs = AI_TIMEOUT_MS } = {}) {
  const gStart = Date.now();
  const key = env.GEMINI_API_KEY;
  if (!key)
    return { ok: false, err: "GEMINI_API_KEY missing", model: null };
  const { system, contents } = msgsToGemini(msgs);
  if (!contents.length)
    return { ok: false, err: "empty contents", model: null };
  let models = model ? [model] : GEMINI_MODELS;
  models = await filterCoolModels("gemini", models);
  const errors = [];
  for (const m of models) {
    if (Date.now() - gStart > timeoutMs - 1500)
      break;
    const url = `${GEMINI_API_BASE}/${m}:generateContent?key=${encodeURIComponent(key)}`;
    const tryOnce = /* @__PURE__ */ __name22(async (withThinking) => {
      const generationConfig = {
        temperature,
        maxOutputTokens: max_tokens
      };
      if (withThinking)
        generationConfig.thinkingConfig = { thinkingBudget: 0 };
      const body = { contents, generationConfig };
      if (system)
        body.system_instruction = { parts: [{ text: system }] };
      const res = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
        signal: AbortSignal.timeout(Math.max(1e3, timeoutMs - (Date.now() - gStart)))
      });
      const raw = await res.text();
      let data = null;
      try {
        data = JSON.parse(raw);
      } catch {
      }
      if (!res.ok) {
        const msg = data && data.error && data.error.message || raw.slice(0, 240) || `HTTP ${res.status}`;
        return { ok: false, err: msg, status: res.status, data };
      }
      const text = geminiExtractText(data);
      if (text)
        return { ok: true, text, model: m, raw: data };
      return { ok: false, err: "empty", status: res.status, data };
    }, "tryOnce");
    try {
      let r = await tryOnce(true);
      if (!r.ok && /thinking|invalid argument|Unknown name/i.test(String(r.err || ""))) {
        r = await tryOnce(false);
      }
      if (r.ok)
        return { ok: true, text: r.text, model: m, raw: r.raw };
      errors.push(`${m}: ${r.err}`);
      await markModelCool("gemini", m, r.err);
      console.error("Gemini err", m, r.err);
    } catch (e) {
      const msg = String(e && e.message || e);
      errors.push(`${m}: ${msg}`);
      await markModelCool("gemini", m, msg);
      console.error("Gemini err", m, msg);
    }
  }
  return { ok: false, err: errors.slice(-3).join(" | "), model: null };
}
__name(callGemini, "callGemini");
__name2(callGemini, "callGemini");
__name22(callGemini, "callGemini");
function openAiExtractText(data) {
  try {
    const c = data && data.choices && data.choices[0];
    if (!c)
      return "";
    const msg = c.message || c.delta || {};
    if (typeof msg.content === "string")
      return msg.content;
    if (Array.isArray(msg.content)) {
      return msg.content.map((p) => typeof p === "string" ? p : p && p.text || "").join("");
    }
    if (typeof c.text === "string")
      return c.text;
  } catch {
  }
  return "";
}
__name(openAiExtractText, "openAiExtractText");
__name2(openAiExtractText, "openAiExtractText");
__name22(openAiExtractText, "openAiExtractText");
async function callOpenAiChat(env, {
  baseUrl,
  apiKey,
  models,
  msgs,
  max_tokens = 280,
  temperature = 0.3,
  model = null,
  extraHeaders = {},
  label = "openai",
  timeoutMs = AI_TIMEOUT_MS,
  maxModels = null
} = {}) {
  if (!apiKey)
    return { ok: false, err: `${label} API key missing`, model: null };
  let list = model ? [model] : models || [];
  if (maxModels && !model)
    list = list.slice(0, maxModels);
  list = await filterCoolModels(label, list);
  if (!list.length)
    return { ok: false, err: `${label} no models`, model: null };
  const errors = [];
  const oStart = Date.now();
  const winMs = timeoutMs || AI_TIMEOUT_MS;
  for (const m of list) {
    if (Date.now() - oStart > winMs - 1500)
      break;
    try {
      const body = {
        model: m,
        messages: msgs,
        temperature,
        max_tokens
      };
      if (/gpt-oss/i.test(m)) {
        body.reasoning_effort = "low";
        body.max_tokens = max_tokens + 400;
      } else if (/groq/i.test(label) && /qwen3/i.test(m))
        body.reasoning_effort = "none";
      const res = await fetch(baseUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${apiKey}`,
          ...extraHeaders
        },
        body: JSON.stringify(body),
        signal: AbortSignal.timeout(Math.max(1e3, winMs - (Date.now() - oStart)))
      });
      const raw = await res.text();
      let data = null;
      try {
        data = JSON.parse(raw);
      } catch {
      }
      if (!res.ok) {
        const msg = data && data.error && (data.error.message || data.error) || raw.slice(0, 240) || `HTTP ${res.status}`;
        errors.push(`${m}: ${msg}`);
        await markModelCool(label, m, msg);
        console.error(label, "err", m, msg);
        continue;
      }
      const text = openAiExtractText(data);
      const fin = data && data.choices && data.choices[0] && data.choices[0].finish_reason;
      if (text && fin === "length" && !/[.!?…)»😊🙏]\s*$/.test(text.trim())) {
        errors.push(`${m}: truncated`);
        console.error(label, "truncated", m);
        continue;
      }
      if (text)
        return { ok: true, text, model: m, raw: data };
      errors.push(`${m}: empty`);
      await markModelCool(label, m, "empty");
      console.error(label, "empty", m);
    } catch (e) {
      const msg = String(e && e.message || e);
      errors.push(`${m}: ${msg}`);
      await markModelCool(label, m, msg);
      console.error(label, "err", m, msg);
    }
  }
  return { ok: false, err: errors.slice(-3).join(" | "), model: null };
}
__name(callOpenAiChat, "callOpenAiChat");
__name2(callOpenAiChat, "callOpenAiChat");
__name22(callOpenAiChat, "callOpenAiChat");
async function callGroq(env, msgs, opts = {}) {
  return callOpenAiChat(env, {
    baseUrl: GROQ_API_BASE,
    apiKey: env.GROQ_API_KEY,
    models: GROQ_MODELS,
    msgs,
    max_tokens: opts.max_tokens,
    temperature: opts.temperature,
    model: opts.model || null,
    label: "Groq",
    timeoutMs: opts.timeoutMs || AI_TIMEOUT_MS
  });
}
__name(callGroq, "callGroq");
__name2(callGroq, "callGroq");
__name22(callGroq, "callGroq");
async function callOpenRouter(env, msgs, opts = {}) {
  return callOpenAiChat(env, {
    baseUrl: OPENROUTER_API_BASE,
    apiKey: env.OPENROUTER_API_KEY,
    models: OPENROUTER_MODELS,
    msgs,
    max_tokens: opts.max_tokens,
    temperature: opts.temperature,
    model: opts.model || null,
    label: "OpenRouter",
    timeoutMs: opts.timeoutMs || AI_TIMEOUT_MS,
    extraHeaders: {
      "HTTP-Referer": "https://eh-whatsapp.domingohoreb.workers.dev",
      "X-Title": "Electronic HOUSE WhatsApp"
    }
  });
}
__name(callOpenRouter, "callOpenRouter");
__name2(callOpenRouter, "callOpenRouter");
__name22(callOpenRouter, "callOpenRouter");
async function callMistral(env, msgs, opts = {}) {
  return callOpenAiChat(env, {
    baseUrl: MISTRAL_API_BASE,
    apiKey: env.MISTRAL_API_KEY,
    models: MISTRAL_MODELS,
    msgs,
    max_tokens: opts.max_tokens,
    temperature: opts.temperature,
    model: opts.model || null,
    label: "Mistral",
    timeoutMs: opts.timeoutMs || AI_TIMEOUT_MS
  });
}
__name(callMistral, "callMistral");
__name2(callMistral, "callMistral");
__name22(callMistral, "callMistral");
async function callHuggingFace(env, msgs, opts = {}) {
  return callOpenAiChat(env, {
    baseUrl: HF_API_BASE,
    apiKey: env.HF_TOKEN,
    models: HF_MODELS,
    msgs,
    max_tokens: opts.max_tokens,
    temperature: opts.temperature,
    model: opts.model || null,
    label: "HuggingFace",
    timeoutMs: Math.min(HF_TIMEOUT_MS, opts.timeoutMs || HF_TIMEOUT_MS),
    maxModels: opts.model ? null : 1
  });
}
__name(callHuggingFace, "callHuggingFace");
__name2(callHuggingFace, "callHuggingFace");
__name22(callHuggingFace, "callHuggingFace");
function cohereExtractText(data) {
  try {
    const msg = data && data.message;
    if (!msg)
      return "";
    const content = msg.content;
    if (typeof content === "string")
      return content;
    if (Array.isArray(content)) {
      return content.map((p) => typeof p === "string" ? p : p && p.text || "").join("");
    }
    if (typeof msg.text === "string")
      return msg.text;
  } catch {
  }
  return "";
}
__name(cohereExtractText, "cohereExtractText");
__name2(cohereExtractText, "cohereExtractText");
__name22(cohereExtractText, "cohereExtractText");
async function callCohere(env, msgs, opts = {}) {
  const apiKey = env.COHERE_API_KEY;
  if (!apiKey)
    return { ok: false, err: "COHERE_API_KEY missing", model: null };
  const list = opts.model ? [opts.model] : COHERE_MODELS.slice(0, 1);
  const errors = [];
  const max_tokens = opts.max_tokens != null ? opts.max_tokens : 280;
  const temperature = opts.temperature != null ? opts.temperature : 0.3;
  for (const m of list) {
    try {
      const res = await fetch(COHERE_API_BASE, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
          Authorization: `Bearer ${apiKey}`
        },
        body: JSON.stringify({ model: m, messages: msgs, temperature, max_tokens }),
        signal: AbortSignal.timeout(Math.min(COHERE_TIMEOUT_MS, opts.timeoutMs || COHERE_TIMEOUT_MS))
      });
      const raw = await res.text();
      let data = null;
      try {
        data = JSON.parse(raw);
      } catch {
      }
      if (!res.ok) {
        const msg = data && (data.message || data.error && data.error.message) || raw.slice(0, 240) || `HTTP ${res.status}`;
        errors.push(`${m}: ${msg}`);
        console.error("Cohere err", m, msg);
        continue;
      }
      const text = cohereExtractText(data);
      if (text)
        return { ok: true, text, model: m, raw: data };
      errors.push(`${m}: empty`);
      console.error("Cohere empty", m);
    } catch (e) {
      const msg = String(e && e.message || e);
      errors.push(`${m}: ${msg}`);
      console.error("Cohere err", m, msg);
    }
  }
  return { ok: false, err: errors.slice(-3).join(" | "), model: null };
}
__name(callCohere, "callCohere");
__name2(callCohere, "callCohere");
__name22(callCohere, "callCohere");
async function getJSON(env, key, dflt) {
  try {
    const v = await env.EH_KV.get(key);
    return v ? JSON.parse(v) : dflt;
  } catch {
    return dflt;
  }
}
__name(getJSON, "getJSON");
__name2(getJSON, "getJSON");
__name22(getJSON, "getJSON");
async function kvPut(env, key, value, opts) {
  try {
    await env.EH_KV.put(key, value, opts);
    globalThis.__ehKvDegraded = false;
    return true;
  } catch (e) {
    console.error("KV put soft-fail", key, e && e.message || e);
    globalThis.__ehKvDegraded = true;
    globalThis.__ehKvDegradedAt = Date.now();
    return false;
  }
}
__name(kvPut, "kvPut");
__name2(kvPut, "kvPut");
__name22(kvPut, "kvPut");
async function putIfChanged(env, key, nextObjOrString, ttl) {
  const next = typeof nextObjOrString === "string" ? nextObjOrString : JSON.stringify(nextObjOrString);
  let prev = null;
  try {
    prev = await env.EH_KV.get(key);
  } catch {
  }
  if (prev === next)
    return false;
  const opts = ttl != null ? { expirationTtl: ttl } : void 0;
  return kvPut(env, key, next, opts);
}
__name(putIfChanged, "putIfChanged");
__name2(putIfChanged, "putIfChanged");
__name22(putIfChanged, "putIfChanged");
async function hmacHex(secret, data) {
  const key = await crypto.subtle.importKey("raw", new TextEncoder().encode(secret), { name: "HMAC", hash: "SHA-256" }, false, ["sign"]);
  const sig = await crypto.subtle.sign("HMAC", key, data);
  return [...new Uint8Array(sig)].map((b) => b.toString(16).padStart(2, "0")).join("");
}
__name(hmacHex, "hmacHex");
__name2(hmacHex, "hmacHex");
__name22(hmacHex, "hmacHex");
async function flagConv(env, e, g, now) {
  const prev = await getJSON(env, `flag:${e.from}`, null);
  const next = {
    wa_id: e.from,
    name: e.name || prev && prev.name || null,
    reason: g.reason || "autre",
    product: g.product || prev && prev.product || "",
    last_message: e.text || `[${e.type}]`,
    message_id: e.id,
    ai_reply: g.reply || null,
    price_given: g.price_given || null,
    ts: now,
    at: new Date(now * 1e3).toISOString(),
    count: (prev && prev.count || 0) + 1
  };
  const LOW = /* @__PURE__ */ new Set(["bot_en_pause", "ia_desactivee", "hors_fenetre_24h", "assistant_secours", "limite_journaliere", "sans_reponse", "autre"]);
  if (prev && prev.reason === "paiement_a_verifier" && LOW.has(next.reason))
    next.reason = "paiement_a_verifier";
  await putIfChanged(env, `flag:${e.from}`, next, 30 * DAY);
  try {
    await logEvent(env, { k: "flag", wa: String(e.from), reason: next.reason, text: next.last_message });
  } catch {
  }
}
__name(flagConv, "flagConv");
__name2(flagConv, "flagConv");
__name22(flagConv, "flagConv");
var APK_FEED_URL = "https://eh-apk-feed.internal/ring";
var APK_FEED_MAX = 200;
async function apkFeedRead() {
  try {
    const hit = await caches.default.match(new Request(APK_FEED_URL));
    if (!hit)
      return { updated: 0, events: [] };
    const ring = await hit.json();
    return { updated: Number(ring.updated) || 0, events: Array.isArray(ring.events) ? ring.events : [] };
  } catch (err) {
    console.error("apkFeedRead soft-fail", err && err.message || err);
    return { updated: 0, events: [] };
  }
}
__name(apkFeedRead, "apkFeedRead");
__name2(apkFeedRead, "apkFeedRead");
__name22(apkFeedRead, "apkFeedRead");
async function apkFeedPush(env, e, role = "user") {
  if (!e || !e.from || OWNER_WAS.has(e.from) || isTestWa(e.from))
    return;
  try {
    const id = String(e.id || `${role}:${e.from}:${e.ts || Date.now()}`);
    const ring = await apkFeedRead();
    const events = ring.events.filter((x) => x && x.id !== id);
    events.unshift({
      id,
      wa: String(e.from),
      name: e.name || null,
      text: String(e.text || (e.reply != null ? e.reply : `[${e.type || "text"}]`)).replace(/\s+/g, " ").slice(0, 500),
      ts: Number(e.ts) || Math.floor(Date.now() / 1e3),
      type: e.type || "text",
      role: role === "assistant" || role === "owner" ? role : "user",
      ...e.media_id ? { media_id: String(e.media_id), mime: e.mime || null } : {}
    });
    await waRingPush(String(e.from), events[0]);
    const next = { updated: Math.floor(Date.now() / 1e3), events: events.slice(0, APK_FEED_MAX) };
    await caches.default.put(new Request(APK_FEED_URL), new Response(JSON.stringify(next), {
      headers: { "Content-Type": "application/json", "Cache-Control": "max-age=604800" }
    }));
  } catch (err) {
    console.error("apkFeedPush soft-fail", err && err.message || err);
  }
}
__name(apkFeedPush, "apkFeedPush");
__name2(apkFeedPush, "apkFeedPush");
__name22(apkFeedPush, "apkFeedPush");
var MIRROR_SEEN = globalThis.__ehMirrorSeen || (globalThis.__ehMirrorSeen = /* @__PURE__ */ new Map());
var SECOURS_URL = "https://eh-apk-feed.internal/assistant-secours";
async function assistantSecoursGet(env) {
  let cacheState = { on: false, since: 0, by: null };
  try {
    const hit = await caches.default.match(new Request(SECOURS_URL));
    if (hit) {
      const j = await hit.json();
      cacheState = { on: !!j.on, since: Number(j.since) || 0, by: j.by || null };
    }
  } catch {
  }
  let kvState = null;
  if (env && env.EH_KV) {
    try {
      const raw = await env.EH_KV.get("cfg:assistant_secours");
      if (raw) {
        const j = JSON.parse(raw);
        kvState = { on: !!j.on, since: Number(j.since) || 0, by: j.by || null };
      }
    } catch {
    }
  }
  if (kvState) {
    if (kvState.on !== cacheState.on) {
      try {
        await caches.default.put(new Request(SECOURS_URL), new Response(JSON.stringify(kvState), {
          headers: { "Content-Type": "application/json", "Cache-Control": "max-age=604800" }
        }));
      } catch (err) {
        console.error("assistantSecoursGet cache resync soft-fail", err && err.message || err);
      }
    }
    return kvState;
  }
  return cacheState;
}
__name(assistantSecoursGet, "assistantSecoursGet");
__name2(assistantSecoursGet, "assistantSecoursGet");
__name22(assistantSecoursGet, "assistantSecoursGet");
async function assistantSecoursSet(env, on, by = null) {
  const next = { on: !!on, since: Math.floor(Date.now() / 1e3), by: by || null };
  try {
    await caches.default.put(new Request(SECOURS_URL), new Response(JSON.stringify(next), {
      headers: { "Content-Type": "application/json", "Cache-Control": "max-age=604800" }
    }));
  } catch (err) {
    console.error("assistantSecoursSet soft-fail", err && err.message || err);
  }
  try {
    await kvPut(env, "cfg:assistant_secours", JSON.stringify(next));
  } catch {
  }
  return next;
}
__name(assistantSecoursSet, "assistantSecoursSet");
__name2(assistantSecoursSet, "assistantSecoursSet");
__name22(assistantSecoursSet, "assistantSecoursSet");
function isAdmin(env, url) {
  return !!env.ADMIN_KEY && url.searchParams.get("key") === env.ADMIN_KEY;
}
__name(isAdmin, "isAdmin");
__name2(isAdmin, "isAdmin");
__name22(isAdmin, "isAdmin");
var json = /* @__PURE__ */ __name22((o, status = 200) => new Response(JSON.stringify(o, null, 1), { status, headers: { "Content-Type": "application/json" } }), "json");
var BATCH_MAX = 6;
var sleep = /* @__PURE__ */ __name22((ms) => new Promise((r) => setTimeout(r, ms)), "sleep");
async function ownerFbCommand(env, phoneId, to, sub) {
  if (!env.FB) {
    await sendText(env, phoneId, to, "\u26A0\uFE0F FB : liaison eh-facebook absente.");
    return;
  }
  const call = /* @__PURE__ */ __name(async (path, method = "GET") => {
    try {
      const r = await env.FB.fetch(new Request(`https://eh-facebook${path}${path.includes("?") ? "&" : "?"}key=${encodeURIComponent(env.ADMIN_KEY || "")}`, { method }));
      let j = {};
      try {
        j = await r.json();
      } catch {
      }
      return { status: r.status, j };
    } catch (err) {
      return { status: 599, j: { error: String(err && err.message || err) } };
    }
  }, "call");
  let txt;
  if (sub === "on" || sub === "off") {
    const r = await call(`/admin/enable?on=${sub === "on" ? 1 : 0}`, "POST");
    txt = r.status !== 200 ? `\u26A0\uFE0F FB ${sub} : erreur ${r.status}` : sub === "on" ? "\u25B6\uFE0F FB auto : ON (45 posts/jour, 07h00\u201322h30, sans validation). \xAB fb off \xBB pour couper." : "\u23F8 FB auto : OFF (coupe-circuit). Plus aucune publication ni r\xE9ponse aux commentaires. \xAB fb on \xBB pour relancer.";
  } else if (sub === "status" || sub === "statut") {
    const r = await call("/version");
    const j = r.j || {};
    txt = `\u{1F4D8} FB auto : ${j.enabled ? "ON" : "OFF"} \u2014 token Page ${j.token_configured ? "OK" : "MANQUANT"} \u2014 dernier : ${j.last_product || "aucun"}${j.safe_mode_until ? " \u2014 mode prudence" : ""}`;
  } else if (sub === "preview" || sub === "apercu") {
    const r = await call("/admin/preview");
    const j = r.j || {};
    txt = j.ok ? `\u{1F440} Aper\xE7u FB (rien publi\xE9)
Produit : ${j.label} (${j.kind === "digital" ? "num\xE9rique" : "t\xE9l\xE9phone"})
Image : ${j.image_source}
R\xE9dig\xE9 par : ${j.provider}

${j.caption}` : `\u26A0\uFE0F Aper\xE7u FB impossible : ${j.stage || r.status}`;
  } else {
    const r = await call("/admin/run-now?trigger=fb_go", "POST");
    const j = r.j || {};
    txt = j.ok ? `\u2705 FB publi\xE9 \u2014 ${j.post.label} \u2014 ${j.post.permalink || j.post.post_id}` : `\u26A0\uFE0F FB go : ${j.error ? String(typeof j.error === "string" ? j.error : j.error.message || JSON.stringify(j.error)).slice(0, 200) : j.skipped || j.stage || "\xE9chec"}`;
  }
  await sendText(env, phoneId, to, String(txt).slice(0, 3500));
}
__name(ownerFbCommand, "ownerFbCommand");
async function ownerTtCommand(env, phoneId, to, sub) {
  if (!env.FB) {
    await sendText(env, phoneId, to, "\u26A0\uFE0F TikTok : liaison eh-facebook absente.");
    return;
  }
  const call = /* @__PURE__ */ __name(async (path, method = "GET") => {
    try {
      const r = await env.FB.fetch(new Request(`https://eh-facebook${path}${path.includes("?") ? "&" : "?"}key=${encodeURIComponent(env.ADMIN_KEY || "")}`, { method }));
      let j = {};
      try {
        j = await r.json();
      } catch {
      }
      return { status: r.status, j };
    } catch (err) {
      return { status: 599, j: { error: String(err && err.message || err) } };
    }
  }, "call");
  let txt;
  if (sub === "on" || sub === "off") {
    const r = await call(`/tiktok/enable?on=${sub === "on" ? 1 : 0}`, "POST");
    txt = r.status !== 200 ? `\u26A0\uFE0F TikTok ${sub} : erreur ${r.status}` : sub === "on" ? "\u25B6\uFE0F TikTok auto : ON (copie de quelques posts Facebook par jour). \xAB tt off \xBB pour couper." : "\u23F8 TikTok auto : OFF. Plus aucune publication TikTok. \xAB tt on \xBB pour relancer.";
  } else {
    const r = await call("/tiktok/status");
    const j = r.j || {};
    const today = (j.today && j.today.posts || []).filter((p) => !p.test);
    const fails = (j.today && j.today.failures || []).length;
    const acct = j.connected ? j.connected.username ? "@" + j.connected.username : j.connected.display_name || "connect\xE9" : "NON CONNECT\xC9";
    const vis = j.mode === "inbox" ? "brouillons dans ta bo\xEEte TikTok" : j.privacy_wanted === "SELF_ONLY" ? "priv\xE9 (moi seul)" : j.privacy_wanted;
    txt = r.status !== 200 ? `\u26A0\uFE0F TikTok statut : erreur ${r.status}` : `\u{1F3B5} TikTok auto : ${j.enabled ? "ON" : "OFF"} \u2014 compte ${acct} \u2014 ${today.length}/${j.per_day} aujourd'hui (${vis}) \u2014 ${fails} \xE9chec(s)${j.backoff && j.backoff.until > Date.now() ? ` \u2014 en pause (${j.backoff.why})` : ""}${j.client_secret_set ? "" : " \u2014 cl\xE9 secr\xE8te manquante"}`;
  }
  await sendText(env, phoneId, to, String(txt).slice(0, 3500));
}
__name(ownerTtCommand, "ownerTtCommand");
__name2(ownerTtCommand, "ownerTtCommand");
async function ownerIgCommand(env, phoneId, to, sub) {
  if (!env.FB) {
    await sendText(env, phoneId, to, "\u26A0\uFE0F Instagram : liaison eh-facebook absente.");
    return;
  }
  const call = /* @__PURE__ */ __name(async (path, method = "GET") => {
    try {
      const r = await env.FB.fetch(new Request(`https://eh-facebook${path}${path.includes("?") ? "&" : "?"}key=${encodeURIComponent(env.ADMIN_KEY || "")}`, { method }));
      let j = {};
      try {
        j = await r.json();
      } catch {
      }
      return { status: r.status, j };
    } catch (err) {
      return { status: 599, j: { error: String(err && err.message || err) } };
    }
  }, "call");
  let txt;
  if (sub === "on" || sub === "off") {
    const r = await call(`/ig/enable?on=${sub === "on" ? 1 : 0}`, "POST");
    txt = r.status !== 200 ? `\u26A0\uFE0F Instagram ${sub} : erreur ${r.status}` : sub === "on" ? `\u25B6\uFE0F Instagram auto : ON (${r.j.per_day || 95} posts/jour, 06h30\u201323h00, sur @electronichouze). \xAB ig off \xBB pour couper.` : "\u23F8 Instagram auto : OFF. Plus aucune publication Instagram. \xAB ig on \xBB pour relancer.";
  } else if (sub === "chef") {
    const r = await call("/chef/status");
    const j = r.j || {};
    const t = j.today || {};
    txt = r.status !== 200 ? `\u26A0\uFE0F Chef d'\xE9quipe : erreur ${r.status}` : `\u{1F9E0} Chef d'\xE9quipe aujourd'hui :
\u2022 Facebook ${t.fb ? t.fb.n : 0}/${t.fb ? t.fb.target : 45}${t.fb && !t.fb.on ? " (OFF)" : ""}
\u2022 Instagram ${t.ig ? t.ig.n : 0}/${t.ig ? t.ig.target : 95}${t.ig && !t.ig.on ? " (OFF)" : ""}
\u2022 TikTok ${t.tt ? t.tt.n : 0}/${t.tt ? t.tt.target : 5} brouillons${t.tt && !t.tt.on ? " (OFF)" : ""}
\u2022 Doublons < 2 h : ${j.audit ? j.audit.same_network_within_2h + j.audit.cross_network_within_2h : "?"}
R\xE9sum\xE9 complet chaque soir \xE0 20h.`;
  } else {
    const r = await call("/ig/status");
    const j = r.j || {};
    const t = j.today || {};
    txt = r.status !== 200 ? `\u26A0\uFE0F Instagram statut : erreur ${r.status}` : `\u{1F4F8} Instagram auto : ${j.enabled ? "ON" : "OFF"} \u2014 @electronichouze \u2014 ${t.posted || 0}/${j.per_day} aujourd'hui \u2014 ${t.failures || 0} \xE9chec(s) \u2014 ${t.replies || 0} r\xE9ponse(s) aux commentaires${j.backoff ? ` \u2014 en pause (${j.backoff.why})` : ""}${j.token ? "" : " \u2014 cl\xE9 Instagram manquante"}`;
  }
  await sendText(env, phoneId, to, String(txt).slice(0, 3500));
}
__name(ownerIgCommand, "ownerIgCommand");
__name2(ownerIgCommand, "ownerIgCommand");
var OWNER_HELP = `Commandes g\xE9rant Electronic HOUSE :
\u2022 ig on / ig off / ig statut \u2014 robot Instagram (@electronichouze)
\u2022 chef \u2014 bilan du jour de tous les robots (Facebook, Instagram, TikTok)
\u2022 tt on / tt off / tt statut \u2014 robot TikTok (copie de quelques posts Facebook)
\u2022 fb preview \u2014 aper\xE7u du prochain post Facebook (rien publi\xE9) ; fb go \u2014 publier maintenant ; fb off / fb on \u2014 coupe-circuit Facebook
\u2022 liste \u2014 clients signal\xE9s
\u2022 aide \u2014 ce message
\u2022 secours \u2014 New Bot (niveau6) si CF+Render down ; \xAB stop secours \xBB pour couper
\u2022 stop secours \u2014 couper le mode secours assistant
\u2022 pings off / pings on \u2014 couper / remettre les pings Nouveau/Relance (les alertes restent)
\u2022 photo produit : envoyez une photo au bot avec la l\xE9gende \xAB photo <mod\xE8le> \xBB (ex. photo Samsung Galaxy S24 Ultra) \u2014 le bot l'enverra aux clients
\u2022 synchro catalogue \u2014 relire tout de suite les prix + dispo des Google Sheets (auto chaque jour \xE0 7h)
\u2022 suivi on / suivi off \u2014 relances automatiques (apr\xE8s-vente, prospects) ; OFF par d\xE9faut
\u2022 promotion <texte> (ou promotion produit | prix | d\xE9tail) \u2014 aper\xE7u + nombre de clients, puis \xAB confirmer \xBB / \xAB annuler \xBB
\u2022 pause 229\u2026 / reprends 229\u2026 \u2014 bot en pause sur un client
\u2022 pause tout / reprends tout \u2014 bot en pause / relanc\xE9 sur toutes les lignes ; pause 2 / reprends 2 (ligne 53) ; pause 1 / reprends 1 (ligne 59)
\u2022 en attente \u2014 \xE9tat des lignes, discussions en pause et clients \xE0 traiter
\u2022 r\xE9ponds au 229\u2026 : votre texte
\u2022 r\xE9ponds au 1 : votre texte
\u2022 R\xE9ponds : votre texte \u2014 au dernier client signal\xE9/\xE9crit (moins d'1 h)
\u2022 Demande-lui \u2026 / Dis-lui que \u2026 \u2014 le bot reformule pour le client et vous montre le texte envoy\xE9
\u2022 citer (r\xE9pondre \xE0) une alerte + votre texte \u2014 envoy\xE9 \xE0 ce client
\u2022 statut \u2014 r\xE9sum\xE9 (clients \xE0 traiter, pauses, alertes en attente)
Un texte seul non reconnu n'est plus envoy\xE9 \xE0 un client.
Sinon utilisez la bo\xEEte /inbox ou l'APK EH Bo\xEEte.`;
var OWNER_RE_DIS = /^(?:dis|reponds|réponds|envoie|dit)\s+(?:au\s+)?(?:client\s+)?(.+?)\s*[:=\-]\s*(.+)$/i;
var OWNER_RE_A = /^(?:à|a|au)\s+(\d{8,15}|[\w]+)\s*[:=\-]\s*(.+)$/i;
function isOwnerListe(t) {
  const n = norm(t).replace(/\s+/g, " ").trim();
  return /^(liste|flags|a traiter|atraiter|a-traiter)$/.test(n);
}
__name(isOwnerListe, "isOwnerListe");
__name2(isOwnerListe, "isOwnerListe");
__name22(isOwnerListe, "isOwnerListe");
function isOwnerAide(t) {
  const n = norm(t).replace(/\s+/g, " ").trim();
  return /^(aide|help)$/.test(n);
}
__name(isOwnerAide, "isOwnerAide");
__name2(isOwnerAide, "isOwnerAide");
__name22(isOwnerAide, "isOwnerAide");
function toWaId(raw) {
  const d = String(raw || "").replace(/\D/g, "");
  if (d.length >= 8 && d.length <= 10)
    return "229" + d;
  if (d.length >= 11 && d.length <= 15)
    return d;
  return null;
}
__name(toWaId, "toWaId");
__name2(toWaId, "toWaId");
__name22(toWaId, "toWaId");
function parseOwnerCommand(text) {
  let t = stripOwnerLead(text);
  t = t.replace(/^réponds\s+au\s+/i, "r\xE9ponds au ");
  {
    const mc = parseOwnerMediaCaption(t);
    if (mc && mc.caption && !/^(?:…|\.\.\.)$/.test(mc.caption))
      return { kind: "send", target: mc.wa, body: mc.caption };
  }
  if (!t)
    return { kind: "empty" };
  {
    const n = norm(t).replace(/\s+/g, " ").trim();
    if (/^(secours|mode secours|assistant secours|secours on|secours 1)$/.test(n))
      return { kind: "secours_on" };
    if (/^(stop secours|fin secours|secours off|secours 0|coupe secours)$/.test(n))
      return { kind: "secours_off" };
    if (/^secours\s+status|statut secours$/.test(n))
      return { kind: "secours_status" };
  }
  {
    const pg = norm(t).replace(/\s+/g, " ").trim().match(/^pings? (on|off|status)$/);
    if (pg)
      return { kind: `pings_${pg[1]}` };
    if (/^(synchro|sync|synchronise|maj|mise a jour|actualise)( (le |du )?(catalogue|stock|prix|dispo|feuille|sheet|sheets))+$/.test(norm(t).replace(/\s+/g, " ").trim()))
      return { kind: "sheet_sync" };
  }
  {
    const tt = String(t).normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[\u2019']/g, "'").trim();
    const mp = tt.match(/^(pause|stop|stoppe|stopper|arrete|arreter|silence|tais[- ]toi|reprends|reprend|reprise|relance|resume)(?:\s+(?:d'ecrire|de repondre|de parler|le bot|bot|l'ia|ia))?(?:\s*(?:a|au|avec|pour|le|chez))?\s*[:\-]?\s*\+?(\d[\d\s.\-]{7,18})\s*[.!]*$/i);
    if (mp)
      return { kind: /^(reprends|reprend|reprise|relance|resume)$/i.test(mp[1]) ? "resume_wa" : "pause_wa", target: mp[2].replace(/[\s.\-]/g, "") };
  }
  if (isOwnerListe(t))
    return { kind: "liste" };
  if (/^(statut|status|etat|bilan)$/.test(norm(t).replace(/\s+/g, " ").trim()))
    return { kind: "statut" };
  if (/^(alertes?|file|attente)$/.test(norm(t).replace(/\s+/g, " ").trim()))
    return { kind: "alertes" };
  if (isOwnerAide(t))
    return { kind: "aide" };
  let m = t.match(/^(demande|demandez|demandes|dis|dites|dit|explique|expliquez|informe|informez|pr[ée]viens|pr[ée]venez|rappelle|rappelez|propose|proposez|r[ée]ponds|r[ée]pondez)(?:[- ](?:lui|leur)\b|-(?:le|la|les)\b)\s*[:,\-]?\s*(.+)$/i);
  if (m) {
    const vb = norm(m[1]).slice(0, 4);
    if (vb === "repo")
      return { kind: "plain", body: m[2].trim() };
    return { kind: "instr", verb: vb, body: m[2].trim() };
  }
  m = t.match(/^(?:dis|reponds|réponds|envoie|dit)\s+(?:au\s+)?(\d{1,2})\s*[:=\-]\s*(.+)$/i);
  if (m)
    return { kind: "send", targetIndex: +m[1], body: m[2].trim() };
  m = t.match(/^(?:à|a|au)\s+(\d{1,2})\s*[:=\-]\s*(.+)$/i);
  if (m)
    return { kind: "send", targetIndex: +m[1], body: m[2].trim() };
  m = t.match(OWNER_RE_DIS) || t.match(OWNER_RE_A);
  if (m)
    return { kind: "send", target: m[1].trim(), body: m[2].trim() };
  m = t.match(/^(?:dis|reponds|réponds|envoie|dit)\s*[:=\-]\s*(.+)$/i);
  if (m)
    return { kind: "plain", body: m[1].trim() };
  return { kind: "plain", body: t, raw: true };
}
__name(parseOwnerCommand, "parseOwnerCommand");
__name2(parseOwnerCommand, "parseOwnerCommand");
__name22(parseOwnerCommand, "parseOwnerCommand");
async function listOpenFlags(env) {
  try {
    const list = await env.EH_KV.list({ prefix: "flag:", limit: 200 });
    const items = [];
    for (const k of list.keys) {
      const f = await getJSON(env, k.name, null);
      if (f && f.wa_id)
        items.push(f);
    }
    items.sort((a, b) => (b.ts || 0) - (a.ts || 0));
    return items;
  } catch (e) {
    console.error("listOpenFlags soft-fail", e && e.message || e);
    return [];
  }
}
__name(listOpenFlags, "listOpenFlags");
__name2(listOpenFlags, "listOpenFlags");
__name22(listOpenFlags, "listOpenFlags");
function resolveOwnerTarget(flags, query) {
  const q = String(query || "").trim();
  const dig = q.replace(/\D/g, "");
  const waFromDigits = dig.length >= 8 ? toWaId(dig) : null;
  if (waFromDigits) {
    const byWa = flags.find((f) => f.wa_id === waFromDigits || f.wa_id === dig);
    if (byWa)
      return { ok: byWa };
    return { ok: { wa_id: waFromDigits, name: null, product: "", reason: "" } };
  }
  const nq = norm(q);
  if (!nq)
    return { none: true };
  const hits = flags.filter((f) => {
    const name = norm(f.name || "");
    const prod = norm(f.product || "");
    return name && (name.includes(nq) || nq.includes(name)) || prod && (prod.includes(nq) || nq.includes(prod));
  });
  if (hits.length === 1)
    return { ok: hits[0] };
  if (hits.length > 1)
    return { ambiguous: hits };
  return { none: true };
}
__name(resolveOwnerTarget, "resolveOwnerTarget");
__name2(resolveOwnerTarget, "resolveOwnerTarget");
__name22(resolveOwnerTarget, "resolveOwnerTarget");
var ECHO_BURST_N = 3;
async function echoBurst(env, to, now) {
  const key = new Request("https://eh.cache/echo_burst");
  let arr = [];
  try {
    const r = await caches.default.match(key);
    if (r)
      arr = await r.json();
  } catch {
  }
  try {
    const kv = JSON.parse(await env.EH_KV.get("cfg:echo_burst") || "[]");
    for (const x of kv)
      if (!arr.some((y) => y.to === x.to && y.at === x.at))
        arr.push(x);
  } catch {
  }
  arr = arr.filter((x) => now - x.at <= 120);
  if (!arr.some((x) => x.to === to))
    arr.push({ to, at: now });
  const recips = [...new Set(arr.map((x) => x.to))];
  try {
    await caches.default.put(key, new Response(JSON.stringify(arr), { headers: { "Cache-Control": "max-age=180" } }));
  } catch {
  }
  if (recips.length >= ECHO_BURST_N - 1) {
    try {
      await env.EH_KV.put("cfg:echo_burst", JSON.stringify(arr), { expirationTtl: 300 });
    } catch {
    }
  }
  return { broadcast: recips.length >= ECHO_BURST_N, n: recips.length, recips };
}
__name(echoBurst, "echoBurst");
async function pauseAfterOwner(env, wa, now) {
  const p = await getPause(env, wa);
  if (p && !p.until)
    return;
  await putIfChanged(env, `pause:${wa}`, { mode: "auto", until: now + AUTO_PAUSE_S2, at: now }, AUTO_PAUSE_S2);
}
__name(pauseAfterOwner, "pauseAfterOwner");
__name2(pauseAfterOwner, "pauseAfterOwner");
__name22(pauseAfterOwner, "pauseAfterOwner");
async function ownerLastTargetSet(wa, name, now) {
  try {
    await caches.default.put(new Request("https://eh.cache/owner_last_target"), new Response(JSON.stringify({ wa, name, at: now }), { headers: { "Cache-Control": "max-age=600" } }));
  } catch {
  }
}
__name(ownerLastTargetSet, "ownerLastTargetSet");
__name2(ownerLastTargetSet, "ownerLastTargetSet");
__name22(ownerLastTargetSet, "ownerLastTargetSet");
var OWNER_MEDIA_CAP_RE = /^(?:r[ée]ponds?|reponds?|dis|dit|envoie|envoyer|envoies|transf[èe]re|transmets?)\s+(?:au|à|a|aux)\s+(?:client\s+)?\+?((?:\d[\s.\-]?){8,15})(?![\d])\s*[:=\-–—,]?\s*([\s\S]*)$/i;
function stripOwnerLead(t) {
  return String(t || "").replace(/^[^\p{L}\p{N}+]+/u, "").trim();
}
__name(stripOwnerLead, "stripOwnerLead");
__name2(stripOwnerLead, "stripOwnerLead");
__name22(stripOwnerLead, "stripOwnerLead");
function parseOwnerMediaCaption(cap) {
  const m = stripOwnerLead(cap).match(OWNER_MEDIA_CAP_RE);
  if (!m)
    return null;
  const wa = toWaId(m[1].replace(/\D/g, ""));
  if (!wa)
    return null;
  return { wa, caption: m[2].replace(/^[\s:=\-–—,]+/, "").replace(/^(?:…|\.\.\.)\s*$/, "").trim() };
}
__name(parseOwnerMediaCaption, "parseOwnerMediaCaption");
__name2(parseOwnerMediaCaption, "parseOwnerMediaCaption");
__name22(parseOwnerMediaCaption, "parseOwnerMediaCaption");
async function ownerMediaTarget(env, e, now) {
  const cap = String(e.caption || "");
  const m = parseOwnerMediaCaption(cap);
  if (m)
    return { wa: m.wa, caption: m.caption, via: "legende" };
  if (e.context_id) {
    const wa = await ownerMapLookup(e.context_id, env);
    if (wa)
      return { wa, caption: cap.trim(), via: "citation" };
  }
  try {
    const r = await caches.default.match(new Request("https://eh.cache/owner_last_target"));
    if (r) {
      const j = await r.json();
      if (j && j.wa && now - Number(j.at) <= 120)
        return { wa: j.wa, name: j.name, caption: cap.trim(), via: "rafale" };
    }
  } catch {
  }
  if (e.context_id || e.forwarded || cap.trim() && !/^\s*(photo|image|visuel)\s+(pour\s+)?\S/i.test(cap)) {
    const rec = await ownerAlertsRecent(env, now, 1800);
    const photoWa = [...new Set(rec.filter((x) => x.photo).map((x) => x.wa))];
    if (photoWa.length === 1)
      return { wa: photoWa[0], caption: cap.trim(), via: "demande_photo" };
    const anyWa = [...new Set(rec.map((x) => x.wa))];
    if (e.context_id && anyWa.length === 1)
      return { wa: anyWa[0], caption: cap.trim(), via: "alerte_recente" };
  }
  return null;
}
__name(ownerMediaTarget, "ownerMediaTarget");
__name2(ownerMediaTarget, "ownerMediaTarget");
__name22(ownerMediaTarget, "ownerMediaTarget");
async function relayOwnerMedia(env, e, tgt, now) {
  const phoneId = e.phone_number_id || OWNER_PHONE_DEFAULT;
  const kind = e.type === "voice" ? "audio" : e.type === "sticker" ? "image" : e.type;
  const caption = /^photo\s+(pour\s+)?\S/i.test(tgt.caption) && tgt.caption.length < 40 ? "" : tgt.caption;
  let r = await sendMediaById(env, phoneId, tgt.wa, kind, e.media_id, caption, e.filename);
  if (r.status >= 300) {
    const nid = await reuploadMedia(env, phoneId, e.media_id, e.filename, tgt.wa);
    if (nid)
      r = await sendMediaById(env, phoneId, tgt.wa, kind, nid, caption, e.filename);
  }
  const ok = r.status < 300;
  const label = { image: "[image]", video: "[vid\xE9o]", document: "[document]", audio: "[vocal]" }[kind] || `[${kind}]`;
  if (ok) {
    await pushHist(env, tgt.wa, "owner", `${label}${caption ? " " + caption : ""} (envoy\xE9 par l'\xE9quipe)`, now, { type: kind, media_id: e.media_id, mime: e.mime || null });
    await ownerLastTargetSet(tgt.wa, tgt.name || null, now);
    await pauseAfterOwner(env, tgt.wa, now);
  }
  const bk = new Request(`https://eh.cache/owner_relay_burst/${tgt.wa}`);
  await withLock(`burst:${tgt.wa}`, async () => {
    let b = { n: 0, fail: 0, last: "" };
    try {
      const x = await caches.default.match(bk);
      if (x)
        b = await x.json();
    } catch {
    }
    b = { n: b.n + (ok ? 1 : 0), fail: b.fail + (ok ? 0 : 1), last: String(e.id || now), kind, err: ok ? b.err || "" : graphErrText(r) };
    try {
      await caches.default.put(bk, new Response(JSON.stringify(b), { headers: { "Cache-Control": "max-age=120" } }));
    } catch {
    }
  });
  await sleep(globalThis.__burstWaitMs ?? 6e3);
  let cur = { n: ok ? 1 : 0, fail: ok ? 0 : 1, last: String(e.id || now), kind, err: ok ? "" : graphErrText(r) };
  try {
    const x = await caches.default.match(bk);
    if (x)
      cur = await x.json();
  } catch {
  }
  if (cur.last !== String(e.id || now))
    return ok;
  try {
    await caches.default.put(bk, new Response(JSON.stringify({ n: 0, fail: 0, last: "" }), { headers: { "Cache-Control": "max-age=5" } }));
  } catch {
  }
  let name = tgt.name;
  if (!name) {
    try {
      name = await env.EH_KV.get(`name:${tgt.wa}`);
    } catch {
    }
  }
  const what = cur.kind === "image" ? `photo${cur.n > 1 ? "s" : ""} envoy\xE9e${cur.n > 1 ? "s" : ""}` : `m\xE9dia${cur.n > 1 ? "s" : ""} envoy\xE9${cur.n > 1 ? "s" : ""}`;
  const save = /^photo\s+(pour\s+)?(\S.*)$/i.exec(tgt.caption || "");
  await sendText(env, phoneId, e.from, `${cur.n ? `\u2705 ${cur.n} ${what} \xE0 ${name || "?"} (${tgt.wa})${caption ? ` avec \xAB ${caption.slice(0, 60)} \xBB` : ""}.` : ""}${cur.fail ? ` \u26A0\uFE0F ${cur.fail} \xE9chec(s) d'envoi \xE0 ${name || "?"} (${tgt.wa}) : ${cur.err || "erreur"} \u2014 non re\xE7u par le client.` : ""}${tgt.via === "demande_photo" || tgt.via === "alerte_recente" ? " (destinataire d\xE9duit : seule demande r\xE9cente)" : ""}${save ? ` Pour l'ajouter au catalogue du bot : renvoie-la avec la l\xE9gende \xAB photo ${save[2].trim()} \xBB.` : ""}`.trim());
  return ok;
}
__name(relayOwnerMedia, "relayOwnerMedia");
__name2(relayOwnerMedia, "relayOwnerMedia");
__name22(relayOwnerMedia, "relayOwnerMedia");
async function deliverOwnerToClient(env, e, client, body, now) {
  const phoneId = e.phone_number_id || OWNER_PHONE_DEFAULT;
  const wa = client.wa_id;
  if (OWNER_PLACEHOLDER_RE.test(String(body || ""))) {
    await sendText(env, phoneId, e.from, `\u26A0\uFE0F Rien envoy\xE9 \xE0 ${client.name || wa} : remplacez \xAB ${String(body).trim().slice(0, 20)} \xBB par votre vrai message, ex. \xAB r\xE9ponds au ${wa} : Bonjour, il est disponible \xBB.`);
    return false;
  }
  const res = await sendText(env, phoneId, wa, body);
  if (res.status >= 300) {
    await sendText(env, phoneId, e.from, `\u26A0\uFE0F \xC9chec d'envoi \xE0 ${client.name || wa} (${wa}) : ${graphErrText(res)} [HTTP ${res.status}]. Rien n'a \xE9t\xE9 re\xE7u par le client.`);
    return false;
  }
  await pushHist(env, wa, "owner", body, now);
  await ownerLastTargetSet(wa, client.name || null, now);
  let pendingSent = 0;
  try {
    const pk = new Request("https://eh.cache/owner_pending_media");
    const x = await caches.default.match(pk);
    const list = x ? (await x.json()).filter((p) => now - p.at <= 600) : [];
    if (list.length) {
      await caches.default.put(pk, new Response("[]", { headers: { "Cache-Control": "max-age=5" } }));
      for (const pm of list) {
        let r2 = await sendMediaById(env, phoneId, wa, pm.kind, pm.id, "", pm.filename);
        if (r2.status >= 300) {
          const nid = await reuploadMedia(env, phoneId, pm.id, pm.filename);
          if (nid)
            r2 = await sendMediaById(env, phoneId, wa, pm.kind, nid, "", pm.filename);
        }
        if (r2.status < 300) {
          pendingSent++;
          await pushHist(env, wa, "owner", `[${pm.kind}] (envoy\xE9 par l'\xE9quipe)`, now, { type: pm.kind, media_id: pm.id, mime: pm.mime });
        }
      }
    }
  } catch (err) {
    console.error("owner pending media soft-fail", err && err.message || err);
  }
  await pauseAfterOwner(env, wa, now);
  try {
    await env.EH_KV.delete(`flag:${wa}`);
  } catch (err) {
    console.error("KV delete soft-fail", err);
  }
  let name = client.name;
  if (!name) {
    try {
      name = await env.EH_KV.get(`name:${wa}`);
    } catch {
    }
  }
  await sendText(env, phoneId, e.from, `\u2705 Envoy\xE9 \xE0 ${name || "?"} (${wa})${pendingSent ? ` + ${pendingSent} m\xE9dia(s) en attente` : ""} : \xAB ${String(body).slice(0, 160)} \xBB`);
  return true;
}
__name(deliverOwnerToClient, "deliverOwnerToClient");
__name2(deliverOwnerToClient, "deliverOwnerToClient");
__name22(deliverOwnerToClient, "deliverOwnerToClient");
var OWNER_PLACEHOLDER_RE = /^\s*(?:votre\s+(?:message|texte|r[ée]ponse)|texte|message|\.{2,}|…+|\?+|x+)\s*$/i;
function ownerThirdToSecond(t) {
  let x = " " + String(t || "").trim() + " ";
  const V = [["veut", "voulez"], ["peut", "pouvez"], ["a", "avez"], ["est", "\xEAtes"], ["pr\xE9f\xE8re", "pr\xE9f\xE9rez"], ["prefere", "pr\xE9f\xE9rez"], ["souhaite", "souhaitez"], ["habite", "habitez"], ["vient", "venez"], ["prend", "prenez"], ["doit", "devez"], ["sait", "savez"], ["cherche", "cherchez"], ["aime", "aimez"], ["passe", "passez"], ["paie", "payez"], ["paye", "payez"], ["attend", "attendez"], ["fait", "faites"], ["va", "allez"], ["dispose", "disposez"], ["connait", "connaissez"], ["conna\xEEt", "connaissez"]];
  x = x.replace(/\b(?:s'?il|s'?elle|si il|si elle)\s+/gi, "si vous ");
  x = x.replace(/\s(?:il|elle)\s+/gi, " vous ");
  x = x.replace(/\s(?:lui|le|la)\s+(?=\S)/gi, (w, off) => off === 0 ? w : " vous ");
  for (const [a, b] of V)
    x = x.replace(new RegExp(`(\\bvous\\s+(?:ne\\s+|n')?)${a}\\b`, "gi"), `$1${b}`);
  x = x.replace(/\bson\s+/gi, "votre ").replace(/\bsa\s+/gi, "votre ").replace(/\bses\s+/gi, "vos ").replace(/\bleur\s+/gi, "votre ").replace(/\bleurs\s+/gi, "vos ");
  x = x.replace(/\bsi vous\b/gi, "si vous");
  return x.trim();
}
__name(ownerThirdToSecond, "ownerThirdToSecond");
function capFirst(t) {
  t = String(t || "").trim();
  return t ? t[0].toUpperCase() + t.slice(1) : t;
}
__name(capFirst, "capFirst");
function ownerInstrHeuristic(verb, raw) {
  let r = String(raw || "").trim().replace(/[\s?.!]+$/, "");
  if (!r)
    return "";
  const isAsk = verb === "dema" || verb === "rapp" && /^(s'?il|si )/i.test(r);
  if (/^(?:son |sa |leur )?budget\b/i.test(r))
    return "Quel est votre budget ?";
  if (isAsk) {
    if (/^(?:s'?il|s'?elle|si il|si elle|si)\s/i.test(r))
      return capFirst(ownerThirdToSecond(r).replace(/^si vous\s+/i, "Est-ce que vous ")) + " ?";
    if (/^(?:son|sa|ses|leur|leurs)\s/i.test(r))
      return "Pouvez-vous me pr\xE9ciser " + ownerThirdToSecond(r) + " ?";
    if (/^(?:quel|quelle|quels|quelles|combien|o[uù]|quand|comment|pourquoi|est-ce|qu'|que )/i.test(r))
      return capFirst(ownerThirdToSecond(r)) + " ?";
    return "Pouvez-vous me dire " + ownerThirdToSecond(r) + " ?";
  }
  r = r.replace(/^(?:que|qu')\s*/i, "");
  return capFirst(ownerThirdToSecond(r)) + ".";
}
__name(ownerInstrHeuristic, "ownerInstrHeuristic");
async function ownerInstrToClient(env, verb, raw) {
  const h = ownerInstrHeuristic(verb, raw);
  if (/^(?:son |sa |leur )?budget\b/i.test(String(raw || "").trim()))
    return { text: h, via: "regle" };
  const sys = "Tu \xE9cris pour la boutique Electronic HOUSE. Le g\xE9rant te donne une CONSIGNE destin\xE9e \xE0 un client. \xC9cris UNIQUEMENT le message final \xE0 envoyer au client : en fran\xE7ais, vouvoiement, 1 ou 2 phrases courtes, poli, sans salutation longue. N'ajoute AUCUNE information absente de la consigne (pas de prix, d\xE9lai, heure, date, stock, adresse). Pas de guillemets, pas d'explication.";
  const user = `Consigne du g\xE9rant : ${verb === "dema" ? "demande-lui" : verb === "dis" || verb === "dite" || verb === "dit" ? "dis-lui" : "consigne"} ${raw}`;
  const msgs = [{ role: "system", content: sys }, { role: "user", content: user }];
  const nums = /* @__PURE__ */ new Set((String(raw).match(/\d+/g) || []).map((d) => d.replace(/^0+/, "")));
  const ok = /* @__PURE__ */ __name((t) => {
    t = String(t || "").trim().replace(/^["«\s]+|["»\s]+$/g, "");
    if (!t || t.length > 400 || /consigne|g[ée]rant/i.test(t))
      return null;
    for (const d of t.match(/\d+/g) || [])
      if (!nums.has(d.replace(/^0+/, "")))
        return null;
    return t;
  }, "ok");
  for (const call of [callGroq, callGemini]) {
    try {
      const r = await Promise.race([call(env, msgs, { max_tokens: 160, temperature: 0.2, timeoutMs: 7e3 }), new Promise((res) => setTimeout(() => res({ ok: false }), 7500))]);
      const t = r && r.ok ? ok(r.text) : null;
      if (t)
        return { text: t, via: "ia" };
    } catch {
    }
  }
  return { text: h, via: "regle" };
}
__name(ownerInstrToClient, "ownerInstrToClient");
async function ownerImplicitTarget(env, flags, now) {
  let best = null;
  try {
    const r = await caches.default.match(new Request("https://eh.cache/owner_last_target"));
    if (r) {
      const j = await r.json();
      if (j && j.wa && now - Number(j.at) <= 1800)
        best = { wa: j.wa, name: j.name || null, at: Number(j.at), via: "dernier client \xE9crit" };
    }
  } catch {
  }
  try {
    const rec = await ownerAlertsRecent(env, now, 3600);
    const last = rec.sort((a, b) => Number(b.at) - Number(a.at))[0];
    if (last && (!best || Number(last.at) > best.at))
      best = { wa: last.wa, name: null, at: Number(last.at), via: "derni\xE8re alerte" };
  } catch {
  }
  if (!best && flags.length === 1)
    best = { wa: flags[0].wa_id, name: flags[0].name || null, at: now, via: "seul client en attente" };
  if (!best)
    return null;
  const f = flags.find((x) => x.wa_id === best.wa);
  if (!best.name) {
    best.name = f && f.name || null;
    if (!best.name) {
      try {
        best.name = await env.EH_KV.get(`name:${best.wa}`);
      } catch {
      }
    }
  }
  return best;
}
__name(ownerImplicitTarget, "ownerImplicitTarget");
var FBM_KEY = "fb:wa_mode";
var FBM_IDLE_S = 2 * 3600;
var FBM_OWNER = "22997342101";
async function fbmGet(env, key) {
  try {
    return JSON.parse(await env.EH_KV.get(key) || "null");
  } catch {
    return null;
  }
}
__name(fbmGet, "fbmGet");
async function fbmPut(env, key, v) {
  await env.EH_KV.put(key, JSON.stringify(v), { expirationTtl: 3 * 24 * 3600 });
}
__name(fbmPut, "fbmPut");
async function fbQueueCall(env, path, init) {
  if (!env.FB)
    return { ok: false, err: "no FB binding" };
  try {
    const r = await env.FB.fetch(new Request(`https://eh-facebook${path}`, { ...init, headers: { "x-eh-internal": env.ADMIN_KEY || "", ...init && init.headers || {} } }));
    const j = await r.json().catch(() => ({}));
    return { status: r.status, ...j, ok: r.ok && j.ok !== false };
  } catch (err) {
    return { ok: false, err: String(err && err.message || err).slice(0, 160) };
  }
}
__name(fbQueueCall, "fbQueueCall");
async function ownerFbMode(env, e, o = {}) {
  const key = o.key || FBM_KEY, test = !!o.test, say = o.say || (async () => {
  });
  if (!OWNER_WAS.has(String(e.from)))
    return false;
  const now = Math.floor(Date.now() / 1e3);
  const isText = !!e.text && (e.type === "text" || e.type === "button" || e.type === "interactive");
  const nt = isText ? norm(String(e.text || "")).replace(/\s+/g, " ").trim() : "";
  let m = await fbmGet(env, key);
  if (m && m.on && now - Number(m.last || m.since || 0) > FBM_IDLE_S) {
    m = { ...m, on: false, off_at: now, off_why: "idle" };
    await fbmPut(env, key, m);
    await say("\u23F9 Mode Facebook arr\xEAt\xE9 automatiquement (2 h sans envoi). \xC9cris \xAB fb \xBB pour le relancer.");
  }
  const on = !!(m && m.on);
  if (/^(fb|mode fb|mode facebook|facebook)$/.test(nt)) {
    if (on) {
      await fbmPut(env, key, { ...m, last: now });
      await say("Mode Facebook d\xE9j\xE0 activ\xE9 : envoie tout, \xE9cris stop fb pour arr\xEAter");
      return true;
    }
    await fbmPut(env, key, { on: true, since: now, last: now });
    await say("Mode Facebook activ\xE9 : envoie tout, \xE9cris stop fb pour arr\xEAter");
    return true;
  }
  if (/^(stop fb|fb stop|stop facebook|stopfb|arrete fb|arreter fb)$/.test(nt)) {
    if (!on) {
      await say("Le mode Facebook n'\xE9tait pas activ\xE9. \xC9cris \xAB fb \xBB pour l'activer.");
      return true;
    }
    await fbmPut(env, key, { ...m, on: false, off_at: now, off_why: "stop" });
    const st = test ? { pending_posts: "?", wa_since: "?" } : await fbQueueCall(env, `/internal/owner-queue/status?since=${Number(m.since) || 0}`, { method: "GET" });
    await say(`\u23F9 Mode Facebook arr\xEAt\xE9. ${st.wa_since ?? "?"} \xE9l\xE9ment(s) re\xE7u(s) en attente, ${st.pending_posts ?? "?"} post(s) dans la file Facebook. Le robot les publie en priorit\xE9 sur ses cr\xE9neaux.`);
    return true;
  }
  if (!on)
    return false;
  if (/^(pause|reprends|reprend|reprise) (tout|1|2)$/.test(nt))
    return false;
  const mime = String(e.mime || "");
  let kind = null;
  if (isText)
    kind = "text";
  else if (e.type === "image" || e.type === "document" && /^image\//.test(mime))
    kind = "image";
  else if (e.type === "video" || e.type === "document" && /^video\//.test(mime))
    kind = "video";
  let res = { ok: false, err: "unsupported" };
  if (kind === "text") {
    res = await fbQueueCall(env, "/internal/owner-queue", { method: "POST", headers: { "x-kind": "text", "x-at": String(Date.now()), "x-since": String(m.since || 0), ...test ? { "x-test": "1" } : {} }, body: String(e.text || "") });
  } else if (kind) {
    const media = e._bytes ? { buf: e._bytes, mime: mime || "image/jpeg" } : await graphMediaFetch(env, e.media_id);
    if (media && media.buf) {
      res = await fbQueueCall(env, "/internal/owner-queue", { method: "POST", headers: { "x-kind": kind, "x-mime": String(media.mime || mime).split(";")[0], "x-text": encodeURIComponent(String(e.caption || "").slice(0, 1500)), "x-at": String(Date.now()), "x-since": String(m.since || 0), "x-name": String(e.filename || "").slice(0, 60), ...test ? { "x-test": "1" } : {} }, body: media.buf });
    } else
      res = { ok: false, err: "media_download_failed" };
  }
  if (now - Number(m.last || 0) > 600)
    await fbmPut(env, key, { ...m, last: now });
  try {
    await logEvent(env, { k: "fb_mode_in", wa: e.from, text: `${kind || e.type}${res.ok ? "" : " ERR " + (res.err || res.error || res.status)}` });
  } catch {
  }
  if (!res.ok && kind) {
    if (test || await globalCooldown("fbm_err", 600))
      await say(`\u26A0\uFE0F Facebook : un \xE9l\xE9ment n'a pas pu \xEAtre mis en file (${String(res.err || res.error || res.status).slice(0, 60)}). Renvoie-le.`);
  } else if (!kind && e.type) {
    if (test || await globalCooldown("fbm_unsup", 1800))
      await say(`\u2139\uFE0F Facebook : ${e.type} ignor\xE9 (seuls textes, photos et vid\xE9os vont sur Facebook).`);
  } else if (res.ok && Number(res.wa_since) > 0 && Number(res.wa_since) % 10 === 0) {
    await say(`\u{1F4E5} ${res.wa_since} \xE9l\xE9ments re\xE7us pour Facebook (${res.pending_posts} post(s) en file). Continue, ou \xE9cris stop fb.`);
  } else if (res.ok && (test || await globalCooldown("fbm_ack", 120))) {
    await say(`\u{1F4E5} Re\xE7u pour Facebook. Envoie la suite ; le robot retire les num\xE9ros/liens fournisseurs, met les tiens et publie sur les prochains cr\xE9neaux (07h\u201322h30). \xC9cris stop fb quand tu as fini.`);
  }
  return { queued: !!res.ok, kind, res };
}
__name(ownerFbMode, "ownerFbMode");
async function fbVision(env, req) {
  const mime = (req.headers.get("x-mime") || "image/jpeg").split(";")[0];
  const buf = new Uint8Array(await req.arrayBuffer());
  if (!buf.length)
    return { ok: false, error: "empty" };
  if (!env.GEMINI_API_KEY)
    return { ok: false, error: "no gemini key" };
  let bin = "";
  for (let i = 0; i < buf.length; i += 32768)
    bin += String.fromCharCode.apply(null, buf.subarray(i, i + 32768));
  const data = btoa(bin);
  const prompt = `Analyse cette image publicitaire. R\xE9ponds en JSON strict : {"phones": [tous les num\xE9ros de t\xE9l\xE9phone / WhatsApp / liens wa.me lisibles dans l'image, tels qu'\xE9crits], "shop_names": [noms de boutiques ou vendeurs visibles autres que "Electronic HOUSE"], "description": "description courte en fran\xE7ais (max 25 mots) des produits visibles"}. Si aucun num\xE9ro : "phones": [].`;
  const errors = [];
  for (const mdl of GEMINI_MODELS) {
    try {
      const r = await fetch(`${GEMINI_API_BASE}/${mdl}:generateContent?key=${encodeURIComponent(env.GEMINI_API_KEY)}`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ contents: [{ role: "user", parts: [{ inline_data: { mime_type: mime, data } }, { text: prompt }] }], generationConfig: { temperature: 0, responseMimeType: "application/json", maxOutputTokens: 600 } }), signal: AbortSignal.timeout(2e4) });
      const j = await r.json().catch(() => ({}));
      const txt = j && j.candidates && j.candidates[0] && j.candidates[0].content && (j.candidates[0].content.parts || []).map((x) => x.text || "").join("");
      const mm = String(txt || "").match(/\{[\s\S]*\}/);
      if (r.ok && mm) {
        const v = JSON.parse(mm[0]);
        return { ok: true, provider: `gemini:${mdl}`, result: { phones: Array.isArray(v.phones) ? v.phones.map(String) : [], shop_names: Array.isArray(v.shop_names) ? v.shop_names.map(String) : [], description: String(v.description || "").slice(0, 200) } };
      }
      errors.push(`${mdl}:${r.status}`);
    } catch (err) {
      errors.push(`${mdl}:${String(err && err.message || err).slice(0, 60)}`);
    }
  }
  return { ok: false, error: errors.join(" | ").split(env.GEMINI_API_KEY).join("<k>") };
}
__name(fbVision, "fbVision");
async function handleOwner(env, e) {
  const now = Math.floor(Date.now() / 1e3);
  await ownerWindowTouch(env, now);
  const phoneId = e.phone_number_id || OWNER_PHONE_DEFAULT;
  try {
    await ownerFlushQueue(env, phoneId, "owner_msg");
  } catch (err) {
    console.error("owner digest soft-fail", err && err.message || err);
  }
  try {
    if (await ownerFbMode(env, e, { say: (t) => sendText(env, phoneId, e.from, t) }))
      return;
  } catch (err) {
    console.error("fb mode soft-fail", err && err.message || err);
  }
  const isText = !!e.text && (e.type === "text" || e.type === "button" || e.type === "interactive");
  if (!isText && e.type === "image" && e.media_id && /^\s*(photo|image|visuel)\s+(pour\s+)?\S/i.test(String(e.caption || "")) && !parseOwnerMediaCaption(String(e.caption || ""))) {
    const res = await ownerSavePhoto(env, e);
    await sendText(env, phoneId, e.from, res.ok ? `\u2705 Photo enregistr\xE9e pour \xAB ${res.model} \xBB (${res.count} mod\xE8le(s) avec photo perso). Le bot l'enverra aux clients qui demandent une photo de ce mod\xE8le.` : `\u26A0\uFE0F Photo non enregistr\xE9e : ${res.error}`);
    return;
  }
  if (!isText && e.media_id) {
    const tgt = await ownerMediaTarget(env, e, now);
    if (tgt) {
      await relayOwnerMedia(env, e, tgt, now);
      return;
    }
  }
  if (!isText && e.type === "image" && e.media_id && /^\s*(photo|image|visuel)\s+(pour\s+)?\S/i.test(String(e.caption || ""))) {
    const res = await ownerSavePhoto(env, e);
    await sendText(env, phoneId, e.from, res.ok ? `\u2705 Photo enregistr\xE9e pour \xAB ${res.model} \xBB (${res.count} mod\xE8le(s) avec photo perso). Le bot l'enverra aux clients qui demandent une photo de ce mod\xE8le.` : `\u26A0\uFE0F Photo non enregistr\xE9e : ${res.error}`);
    return;
  }
  if (!isText && e.media_id) {
    const kind = e.type === "voice" ? "audio" : e.type;
    await pushHist(env, OWNER_NOTIFY_WA, "user", `[${kind}]${e.caption ? " " + e.caption : ""} (97, non relay\xE9)`, now, { type: kind, media_id: e.media_id, mime: e.mime || null });
    await withLock("owner_pending", async () => {
      const pk = new Request("https://eh.cache/owner_pending_media");
      let list = [];
      try {
        const x = await caches.default.match(pk);
        if (x)
          list = await x.json();
      } catch {
      }
      list = list.filter((x) => now - x.at <= 600).concat([{ id: e.media_id, kind, mime: e.mime || null, filename: e.filename || null, at: now }]).slice(-10);
      try {
        await caches.default.put(pk, new Response(JSON.stringify(list), { headers: { "Cache-Control": "max-age=600" } }));
      } catch {
      }
    });
  }
  if (isText) {
    try {
      if (await hubCommand(env, ehxDeps(), e, String(e.text || ""), (t) => sendText(env, phoneId, e.from, t)))
        return;
    } catch (err) {
      console.error("hub command soft-fail", err && err.message || err);
    }
  }
  if (!isText) {
    if (await globalCooldown("owner_media_hint", 180))
      await sendText(env, phoneId, e.from, "\u{1F4CE} Non envoy\xE9 (destinataire inconnu). Pour l'envoyer \xE0 un client : cite son alerte avec la photo, ou l\xE9gende \xAB r\xE9ponds au 229\u2026 : texte \xBB. Pour le catalogue : l\xE9gende \xAB photo <mod\xE8le> \xBB.");
    return;
  }
  {
    const nt = norm(String(e.text || "")).replace(/\s+/g, " ").trim();
    if ((/^(pause|reprends|reprend|reprise) (tout|1|2)$/.test(nt) || /^en attente$/.test(nt)) && String(e.from) === String((await linesCfg(env)).WA_PROPRIO)) {
      await ownerLinesCommand(env, phoneId, e.from, nt, now);
      return;
    }
    const ttm = nt.match(/^(?:tt|tiktok) (on|off|status|statut)$/);
    if (ttm) {
      await ownerTtCommand(env, phoneId, e.from, ttm[1]);
      return;
    }
    const igm = nt.match(/^(?:ig|insta|instagram) (on|off|status|statut)$/);
    if (igm) {
      await ownerIgCommand(env, phoneId, e.from, igm[1]);
      return;
    }
    if (/^(?:chef|equipe|reseaux)(?: statut| status)?$/.test(nt)) {
      await ownerIgCommand(env, phoneId, e.from, "chef");
      return;
    }
    const fbm = nt.match(/^fb (preview|apercu|go|on|off|status|statut)$/);
    if (fbm) {
      await ownerFbCommand(env, phoneId, e.from, fbm[1]);
      return;
    }
    const sm = nt.match(/^suivi(?: (on|off|status|statut))?$/);
    if (sm) {
      if (sm[1] === "on" || sm[1] === "off")
        await env.EH_KV.put(SUIVI_KEY, sm[1]);
      const on = await suiviOn(env);
      let st = {};
      try {
        st = JSON.parse(await env.EH_KV.get("cfg:suivi_stats") || "{}");
      } catch {
      }
      await sendText(env, phoneId, e.from, on ? `\u{1F501} Suivi clients : ON. Apr\xE8s-vente 2\u20133 jours apr\xE8s la vente, relance prospect ~1 jour apr\xE8s un prix sans r\xE9ponse ; 1 seul message par \xE9v\xE9nement, 8h\u201320h, jamais si STOP / pause / conflit / g\xE9rant actif. Hors fen\xEAtre 24 h : mod\xE8les Meta \xAB ${TPL_AFTER_SALE} \xBB / \xAB ${TPL_LEAD} \xBB. Bilan : ${st.sale || 0} apr\xE8s-vente, ${st.lead || 0} relances, ${st.hors_fenetre || 0} hors fen\xEAtre. \xAB suivi off \xBB pour couper.` : "\u23F8 Suivi clients : OFF (aucune relance automatique). \xAB suivi on \xBB pour activer.");
      return;
    }
    if (/^promo(tion)?\b/.test(nt) && await promoCommand(env, phoneId, e.from, e.text, now))
      return;
    if (/^(confirmer|confirme|je confirme|ok confirmer|annuler|annule)$/.test(nt) && await promoConfirm(env, phoneId, e.from, now, /^(ok )?(je )?confirm/.test(nt)))
      return;
  }
  const cmd = parseOwnerCommand(e.text);
  if (cmd.kind === "aide" || cmd.kind === "empty") {
    await sendText(env, phoneId, e.from, OWNER_HELP);
    return;
  }
  if (cmd.kind === "secours_on" || cmd.kind === "secours_off" || cmd.kind === "secours_status") {
    if (cmd.kind === "secours_status") {
      const st2 = await assistantSecoursGet(env);
      await sendText(env, phoneId, e.from, st2.on ? `Mode secours ASSISTANT : ON (depuis ${st2.since}). New Bot continue les clients. \xC9crivez \xAB stop secours \xBB pour couper. (Auto: seulement si CF replies_ok=false ET Render down.)` : `Mode secours ASSISTANT : OFF. CF r\xE9pond (IAs\u2192catalogue\u2192filet). Auto niveau6 si CF+Render down.`);
      return;
    }
    if (cmd.kind === "secours_on") {
      const h = await buildWhoSpeaksHealth(env, { forceProbe: false });
      if (h.replies_ok) {
        await assistantSecoursSet(env, false, e.from || "owner");
        await sendText(env, phoneId, e.from, "\u26D4 Secours refus\xE9 : CF replies_ok=true (IAs/catalogue/filet OK). Pas de silence client. Secours auto seulement si CF+Render down.");
        return;
      }
    }
    const st = await assistantSecoursSet(env, cmd.kind === "secours_on", e.from);
    await sendText(env, phoneId, e.from, st.on ? `\u2705 Mode secours activ\xE9 (CF replies_ok=false). New Bot (Grok) r\xE9pond depuis le 59. \xC9crivez \xAB stop secours \xBB pour arr\xEAter.` : `\u23F9 Mode secours coup\xE9. Cloudflare reprend (IAs\u2192catalogue\u2192filet).`);
    return;
  }
  if (cmd.kind === "sheet_sync") {
    const res = await runSheetSync(env, "97", true);
    await sendText(env, phoneId, e.from, syncReport(res));
    return;
  }
  if (cmd.kind === "pings_on" || cmd.kind === "pings_off" || cmd.kind === "pings_status") {
    if (cmd.kind !== "pings_status") {
      await putIfChanged(env, "cfg:pings", cmd.kind === "pings_on" ? "on" : "off");
      PINGS_STATE.on = cmd.kind === "pings_on";
      PINGS_STATE.at = Date.now();
    }
    const on = await pingsEnabled(env);
    await sendText(env, phoneId, e.from, on ? "\u{1F514} Pings Nouveau/Relance : ON (1 ligne, 2 min d'\xE9cart). Les alertes paiement/humain/troc restent actives." : "\u{1F515} Pings Nouveau/Relance : OFF. Les alertes \xAB besoin de toi \xBB (paiement, capture, humain, troc, boutique, IA KO, envoi \xE9chou\xE9) restent actives. \xAB pings on \xBB pour relancer.");
    return;
  }
  if (cmd.kind === "pause_wa" || cmd.kind === "resume_wa") {
    const wa = toWaId(cmd.target);
    if (!wa) {
      await sendText(env, phoneId, e.from, `Num\xE9ro invalide : ${cmd.target}`);
      return;
    }
    if (cmd.kind === "pause_wa") {
      await putIfChanged(env, `pause:${wa}`, { mode: "manual", at: now });
      await sendText(env, phoneId, e.from, `\u23F8 Bot en pause pour ${wa}. \xAB reprends ${wa} \xBB pour relancer.`);
    } else {
      try {
        await env.EH_KV.delete(`pause:${wa}`);
      } catch {
      }
      await sendText(env, phoneId, e.from, `\u25B6\uFE0F Bot relanc\xE9 pour ${wa}.`);
    }
    return;
  }
  if (cmd.kind === "statut" || cmd.kind === "alertes") {
    const flags3 = await listOpenFlags(env);
    let paused = 0;
    try {
      const l = await env.EH_KV.list({ prefix: "pause:", limit: 1e3 });
      paused = l.keys.length;
    } catch {
    }
    const q = await ownerQueueGet(env);
    let aiOff = false;
    try {
      aiOff = await env.EH_KV.get("cfg:ai_enabled") === "0";
    } catch {
    }
    let h = null;
    try {
      h = await buildWhoSpeaksHealth(env, { forceProbe: false });
    } catch {
    }
    const pay = flags3.filter((f) => f.reason === "paiement_a_verifier").length;
    await sendText(env, phoneId, e.from, `\u{1F4CA} Statut Electronic HOUSE
\u{1F916} Bot : ${aiOff ? "arr\xEAt\xE9 pour tous" : "actif"}${h ? ` (${h.replies_ok ? "IA OK" : "IA en difficult\xE9, filet actif"})` : ""}
\u{1F514} Clients \xE0 traiter : ${flags3.length}${pay ? ` (dont ${pay} paiement(s) \xE0 v\xE9rifier)` : ""}
\u23F8 Clients avec bot en pause : ${paused}
\u{1F4EC} Alertes en attente : ${q.length}
\xC9crivez \xAB liste \xBB pour le d\xE9tail, \xAB aide \xBB pour les commandes.`);
    return;
  }
  if (cmd.kind === "liste") {
    const flags2 = await listOpenFlags(env);
    if (!flags2.length) {
      await sendText(env, phoneId, e.from, "Aucun client en attente. \xC9crivez aide ou utilisez la bo\xEEte /inbox.");
      return;
    }
    const lines = flags2.slice(0, 25).map((f, i) => {
      const last = String(f.last_message || "").replace(/\s+/g, " ").slice(0, 80);
      return `${i + 1}. ${f.name || "?"} (${f.wa_id}) \u2014 ${f.reason || "?"}${f.product ? " / " + f.product : ""}${last ? "\n   \xAB " + last + " \xBB" : ""}`;
    });
    await sendText(env, phoneId, e.from, `Clients \xE0 traiter (${flags2.length}) :
${lines.join("\n")}`);
    return;
  }
  const flags = await listOpenFlags(env);
  if (cmd.kind === "instr") {
    const rw = await ownerInstrToClient(env, cmd.verb, cmd.body);
    await logEvent(env, { k: "owner_instr", text: `${cmd.body} => ${rw.text} (${rw.via})` });
    cmd.body = rw.text;
    cmd.kind = "plain";
  }
  if (cmd.kind === "send") {
    if (cmd.targetIndex) {
      const idx = cmd.targetIndex - 1;
      if (idx < 0 || idx >= flags.length) {
        await sendText(env, phoneId, e.from, `Pas de client n\xB0 ${cmd.targetIndex}. \xC9crivez liste.`);
        return;
      }
      await deliverOwnerToClient(env, e, flags[idx], cmd.body, now);
      return;
    }
    const r = resolveOwnerTarget(flags, cmd.target);
    if (r.ok) {
      await deliverOwnerToClient(env, e, r.ok, cmd.body, now);
      return;
    }
    if (r.ambiguous) {
      const brief2 = r.ambiguous.slice(0, 8).map((f) => `\u2022 ${f.name || "?"} (${f.wa_id})${f.product ? " \u2014 " + f.product : ""}`).join("\n");
      await sendText(env, phoneId, e.from, `Plusieurs clients correspondent \xE0 \xAB ${cmd.target} \xBB. Pr\xE9cisez le num\xE9ro :
${brief2}`);
      return;
    }
    await sendText(env, phoneId, e.from, `Client introuvable : \xAB ${cmd.target} \xBB. \xC9crivez liste pour voir les flags.`);
    return;
  }
  if (e.context_id) {
    const qwa = await ownerMapLookup(e.context_id, env);
    if (qwa) {
      const f0 = flags.find((f) => f.wa_id === qwa) || { wa_id: qwa, name: null };
      await deliverOwnerToClient(env, e, f0, cmd.body, now);
      return;
    }
  }
  if (cmd.raw) {
    const it0 = await ownerImplicitTarget(env, flags, now);
    await __ownerAiReply(env, phoneId, e, cmd.body, flags);
    return;
  }
  if (!cmd.raw && cmd.body)
    cmd.body = capFirst(cmd.body);
  {
    const it = await ownerImplicitTarget(env, flags, now);
    if (it) {
      await deliverOwnerToClient(env, e, { wa_id: it.wa, name: it.name }, cmd.body, now);
      return;
    }
  }
  if (!flags.length) {
    await __ownerAiReply(env, phoneId, e, cmd.body, flags);
    return;
  }
  await __ownerAiReply(env, phoneId, e, cmd.body, flags);
}
__name(handleOwner, "handleOwner");
__name2(handleOwner, "handleOwner");
__name22(handleOwner, "handleOwner");
async function maybeAutoNiveau6(env) {
  try {
    const h = await buildWhoSpeaksHealth(env, { forceProbe: false });
    if (h.replies_ok) {
      const cur2 = await assistantSecoursGet(env);
      if (cur2.on) {
        await assistantSecoursSet(env, false, "auto_off_cf_healthy");
        return { action: "secours_off", reason: "cf_replies_ok", who: h.who_speaks };
      }
      return { action: "none", reason: "cf_replies_ok", who: h.who_speaks };
    }
    let renderOk = false;
    try {
      const r = await fetch(RENDER_HEALTH_URL, { method: "GET", signal: AbortSignal.timeout(8e3) });
      renderOk = r.ok;
    } catch {
      renderOk = false;
    }
    if (renderOk)
      return { action: "none", reason: "render_up_handles_failover", renderOk };
    const cur = await assistantSecoursGet(env);
    if (cur.on)
      return { action: "none", reason: "secours_already_on" };
    await assistantSecoursSet(env, true, "auto_niveau6");
    try {
      await sendText(
        env,
        OWNER_PHONE_DEFAULT,
        OWNER_NOTIFY_WA,
        "\u26A0\uFE0F Niveau 6 auto : CF replies_ok=false et Render OFF \u2192 mode secours New Bot ACTIV\xC9. \xC9crivez \xAB stop secours \xBB sur le 59 pour couper."
      );
    } catch {
    }
    return { action: "secours_on", reason: "cf_down_render_down" };
  } catch (e) {
    console.error("maybeAutoNiveau6 soft-fail", e && e.message || e);
    return { action: "error", err: String(e && e.message || e) };
  }
}
__name(maybeAutoNiveau6, "maybeAutoNiveau6");
__name2(maybeAutoNiveau6, "maybeAutoNiveau6");
__name22(maybeAutoNiveau6, "maybeAutoNiveau6");
async function wakeRender() {
  try {
    const r = await fetch(RENDER_HEALTH_URL, { method: "GET", signal: AbortSignal.timeout(12e3) });
    return { ok: r.ok, status: r.status };
  } catch (e) {
    return { ok: false, err: String(e && e.message || e) };
  }
}
__name(wakeRender, "wakeRender");
__name2(wakeRender, "wakeRender");
__name22(wakeRender, "wakeRender");
var MOMO_NUMBER = "01 97 34 21 01";
var MOMO_NAME = "Horeb";
var DELIVERY_CENTRE_F = 1e3;
var DELIVERY_OUT_F = 1500;
var NEGO_MAX_F = 5e3;
var HIST_TURN_MSGS = 16;
var AI_TEMP = 0.7;
var AI_MAX_OUT = 220;
var AI_PROVIDER_WINDOW_MS = 8e3;
var PROVIDER_DEAD_MS = 30 * 60 * 1e3;
var PROVIDER_DEAD_URL = "https://eh-ai-health.internal/provider-dead";
var CONV_V = 2;
var ALERT_GAP_S = 30 * 60;
var DEBOUNCE_MS = 1500;
var SWEEP_MIN_AGE_S = 90;
var SWEEP_MAX_AGE_S = 30 * 60;
var MOMO_DIGITS = "0197342101";
var OWNER_DIGITS = ["22997342101", "97342101", "2290197342101", "22996984737", "96984737", "2290196984737"];
var WAT_OFFSET_H = 1;
var READY_RE = /\b(je\s+(le\s+|la\s+|les\s+)?(prends|prend|commande|valide|ach[eè]te)|je\s+(vais\s+)?(pay|pai|paye|paie|payer)|on\s+y\s+va|go\s+pour|ok\s+pour\s+(le|la|ça|ca)|envoie[zs]?\s+(moi\s+)?(le|ton|votre)\s+(num|momo|numéro|numero)|votre\s+(num[ée]ro\s+)?momo|comment\s+(je\s+)?(peux\s+)?(pay|pai|r[èe]gle)|comment\s+(on\s+)?(fait|proc[èe]de)\s+pour\s+(pay|acheter|commander|l'?avoir)|mode\s+de\s+paiement|moyen\s+de\s+paiement|i'?ll\s+take|i\s+take\s+it|how\s+(do|can)\s+i\s+pay|i\s+want\s+to\s+(buy|order)|send\s+(me\s+)?(the\s+)?(momo|number))\b/i;
var PAID_RE = /\b(j'?\s?ai\s+(d[ée]j[aà]\s+)?(pay[ée]|payer|r[ée]gl[ée]|envoy[ée]\s+(l'?argent|le\s+paiement|les\s+sous|la\s+capture)|fait\s+le\s+(paiement|transfert|d[ée]p[oô]t)|effectu[ée]\s+le\s+(paiement|transfert))|paiement\s+(fait|effectu[ée]|envoy[ée])|c'?est\s+pay[ée]|transfert\s+(fait|effectu[ée])|voici\s+(la\s+)?capture|i\s+(have\s+|just\s+)?paid|payment\s+(done|sent|made))(?![a-zà-ÿ])/i;
var TRADE_RE = /\b(trocs?|troquer|reprise|reprendre\s+mon|[ée]chang(e|er|eons)|swap|trade[- ]?in|contre\s+mon)\b/i;
var VISIT_RE = /\b(venir\s+(à|a|au|en)\s+(la\s+)?(boutique|magasin)|passer\s+(à|a|au|en)\s+(la\s+)?(boutique|magasin)|je\s+(peux|veux|vais|voudrais)\s+(venir|passer)|votre\s+(adresse|boutique|magasin|localisation)|o[uù]\s+(êtes|etes|se\s+trouve|vous\s+trouver)|localisation|visiter\s+(la\s+)?boutique|where\s+is\s+(your\s+)?shop|visit\s+(the\s+|your\s+)?shop)\b/i;
var PHOTO_RE = /((?<![a-zà-ÿ])(?:une|la|des|les|vos|quelques|a|some|the)\s+(?:vraies?\s+)?(?:photos?|images?|pics?|pictures?)(?![a-zà-ÿ])(?!\s+(?:nette|de\s+qualit|quality))|(envo(?:i|y)\w*|montre[zr]?|voir|avoir|recevoir|send|show)\b[^.?!\n]{0,25}\b(photos?|images?|visuels?|pics?|pictures?)\b|\b(photos?|images?|visuels?|pictures?)\s+(du|de\s+la|des|de\s+ce|de\s+cet|de\s+cette|de\s+l['’]|of\s+the|of)\b|montre[zr]?[- ]moi|voir\s+(le|la|les)\s+(t[ée]l[ée]phone|produit|appareil|mod[eè]le)|^\s*(photos?|images?|pics?)\s*\?*\s*$)/i;
var HUMAN_RE = /(parler|discuter|[ée]changer)\s+(à|a|au|avec)\s+(g[ée]rant|patron|responsable|quelqu[' ]?un|un|une|le|la|votre|une\s+personne|un\s+humain|un\s+vrai|le\s+g[ée]rant|le\s+responsable|le\s+patron|un\s+conseiller|un\s+vendeur)|\bun\s+(humain|vrai\s+vendeur|conseiller)\b|vraie?\s+personne|pas\s+(un|une|à\s+un|avec\s+un)\s+(robot|bot)|appel(ez|er|le[zr]?)[- ]moi|talk\s+to\s+(a\s+)?(human|person|someone|agent)|real\s+person|call\s+me\b/i;
var NEGO_RE = /remise|r[ée]duction|rabais|n[ée]goci|discount|dernier\s+prix|baiss|diminu|moins\s+cher|faire\s+un\s+effort|petit\s+geste|de\s+moins|ailleurs|trop\s+cher|cheaper|lower/i;
var CONFLICT_RE = /\b(arnaque|arnaqueur|escroc|escroquerie|voleur|voleurs|menteur|fraude|scam|police|plainte|rembourse[zr]?|remboursement|idiot|imb[ée]cile|con\b|connard)\b/i;
var WARRANTY_RE = /\b(garantie|warranty|imei|sav)\b/i;
var EN_RE = /\b(hello|hi|how much|price|please|i want|do you|have|phone|thanks|thank you|good (morning|evening)|available|what|the|is|are)\b/gi;
var FON_RE = /\b(a\s?fon|kudo|kú[ɖd]ó|ɖo|mi\s+kan|nɛ|ɛ|ganji|a\s+d[ɔo]|mi\s+jló|jlo|akwɛ|nukún|kpɔn|xɔ|ahwan)\b|[ɛɔɖ]/i;
var LINK_RE = /https?:\/\/\S+|www\.\S+|facebook\.com\S*|g\.page\S*/gi;
var FAR_ABROAD_RE = /(?<![a-zà-ÿ])(new[- ]?york|usa|[ée]tats[- ]unis|am[ée]rique|canada|montr[ée]al|france|paris|lyon|marseille|belgique|bruxelles|suisse|gen[eè]ve|allemagne|italie|espagne|londres|london|angleterre|royaume[- ]uni|duba[iï]|chine|togo|lom[ée]|nig[ée]ria|lagos|abuja|ghana|accra|niger|niamey|burkina(?:[- ]faso)?|ouagadougou|c[oô]te\s+d['’]?ivoire|abidjan|s[ée]n[ée]gal|dakar|cameroun|douala|yaound[ée]|gabon|libreville|mali|bamako|guin[ée]e|conakry|congo|kinshasa|brazzaville|maroc|casablanca|tunisie|alg[ée]rie|europe|afrique\s+du\s+sud|[àa]\s+l['’]?[ée]tranger|l['’]?international|hors\s+du\s+b[ée]nin|abroad|overseas)(?![a-zà-ÿ])/i;
var FAR_BENIN_RE = /(?<![a-zà-ÿ])(porto[- ]?novo|parakou|bohicon|abomey(?![- ]?calavi)|natitingou|djougou|lokossa|ouidah|kandi|malanville|savalou|dassa(?:[- ]zoum[ée])?|covè|pobè|k[ée]tou|allada|comè|grand[- ]popo|nikki|bassila|savè|aplahou[ée]|dogbo|azovè|s[ée]m[eè][- ]?(?:kpodji|podji)|tangui[ée]ta|banikoara|s[ée]gbana)(?![a-zà-ÿ])/i;
var SHIP_WORD_RE = /(livr|exp[ée]di|envo[iy]|ship|deliver|colis|habite|je\s+suis\s+(à|a|au|en)\b|je\s+vis\s+(à|a|au|en)\b|r[ée]side|live\s+in|based\s+in|destination)/i;
var CALL_REQ_RE = /(appel(?:ez|er|le[zr]?)[- ]moi|rappel(?:ez|er|le[zr]?)[- ]moi|(?:vous\s+)?pou(?:vez|rriez)[- ](?:vous\s+)?m['’]?\s?(?:appeler|rappeler|joindre)|m['’]?\s?(?:appeler|rappeler)\s+(?:au|sur|à|a|svp|stp|s'il)|me\s+(?:rappeler|contacter|joindre)\s+(?:au|sur|par)|un\s+appel\b|joignable|call\s+me\b|give\s+me\s+a\s+call|phone\s+me\b)/i;
var PAID2_RE = /\bcapture\b[^.!?\n]{0,40}\b(chez|envoy[ée]e?|transmise?|donn[ée]e?|partie|re[çc]ue?)\b|\b(j['’]?\s?ai|on\s+a|il\s+a|elle\s+a)\s+(d[ée]j[aà]\s+)?(envoy[ée]|transmis|donn[ée]|fait\s+parvenir)\s+(la\s+capture|l['’]?argent|le\s+paiement|les\s+sous|le\s+transfert)|\bd[ée]j[aà]\s+(pay[ée]|r[ée]gl[ée])|\bpay[ée]\s+(à|a|chez|au)\s+(horeb|01\s?97)|\bargent\s+(est\s+)?(envoy[ée]|transf[ée]r[ée]|parti)\b|\b(momo|transfert|d[ée]p[oô]t)\s+(est\s+)?(fait|effectu[ée]|envoy[ée]|parti)\b|\bpaiement\s+(est\s+)?(fait|effectu[ée]|envoy[ée]|chez|re[çc]u|parti)\b/i;
var ASKED_NUM_RE = /(appel|rappel|joindre|call\s+you|phone\s+number)/i;
var SAME_NUM_RE = /\b(ce\s+(m[êe]me\s+)?num[ée]ro|sur\s+ce\s+num|celui[- ]ci|sur\s+whatsapp|ce\s+whatsapp|this\s+number|same\s+number)\b/i;
function farDestination(t) {
  const s = String(t || "");
  const m = s.match(FAR_ABROAD_RE) || s.match(FAR_BENIN_RE);
  return m ? m[0].replace(/^[àa]\s+/i, "").trim() : "";
}
__name(farDestination, "farDestination");
__name2(farDestination, "farDestination");
__name22(farDestination, "farDestination");
function extractPhone(t) {
  const s = String(t || "");
  for (const m of s.matchAll(/\+?\d[\d \u00a0.\-]{6,20}\d/g)) {
    const after = s.slice(m.index + m[0].length);
    if (/^\s*(f\b|fcfa|francs?|cfa|go\b|gb\b|mah)/i.test(after))
      continue;
    const d = m[0].replace(/\D/g, "");
    if (d.length < 8 || d.length > 15)
      continue;
    if (d === MOMO_DIGITS || OWNER_DIGITS.includes(d) || d.endsWith("97342101"))
      continue;
    return m[0].replace(/\s+/g, " ").trim();
  }
  return "";
}
__name(extractPhone, "extractPhone");
__name2(extractPhone, "extractPhone");
__name22(extractPhone, "extractPhone");
function callWhen(t) {
  const m = String(t || "").match(/\b(\d{1,2}\s?h(?:\s?\d{2})?|\d{1,2}\s?(?:am|pm)|ce\s+soir|ce\s+matin|demain(?:\s+(?:matin|soir|midi))?|matin|midi|apr[èe]s[- ]midi|soir|maintenant|tout\s+de\s+suite|now|tonight|tomorrow|morning|afternoon|evening)\b/i);
  return m ? m[0] : "";
}
__name(callWhen, "callWhen");
__name2(callWhen, "callWhen");
__name22(callWhen, "callWhen");
function alertExtras(keys, text, wa) {
  const out = [];
  if (keys.includes("ship_far")) {
    const d = farDestination(text);
    out.push(`\u{1F4CD} Destination : ${d || "hors zone"} \u2014 frais \xE0 v\xE9rifier aupr\xE8s des agences, puis confirmer au client`);
  }
  if (keys.includes("dispo"))
    out.push(`\u{1F50E} Le client attend ta confirmation de disponibilit\xE9 (voir la bulle \u{1F916} pr\xE9c\xE9dente / le fil dans l'APK)`);
  if (keys.includes("callback")) {
    const n = extractPhone(text);
    const w = callWhen(text);
    out.push(`\u{1F4DE} Num\xE9ro : ${n || `${wa} (ce num\xE9ro WhatsApp)`}${w ? ` \xB7 \u{1F550} ${w}` : ""}`);
  }
  return out;
}
__name(alertExtras, "alertExtras");
__name2(alertExtras, "alertExtras");
__name22(alertExtras, "alertExtras");
var COD_RE = /(pa(?:y|i)(?:er|e|é|erai)?\s+(?:à|a)\s+la\s+(?:livraison|r[ée]ception)|paiement\s+(?:à|a)\s+la\s+(?:livraison|r[ée]ception)|(?:cash|esp[èe]ces?)\s+(?:à|a)\s+la\s+(?:livraison|r[ée]ception)|pa(?:y|i)(?:er|e)?\s+(?:en\s+)?(?:cash|esp[èe]ces?)|à\s+la\s+livraison\s+(?:je|on)\s+pa|cash\s+on\s+delivery|pay\s+on\s+delivery|pay\s+(?:at|upon)\s+delivery)/i;
var ANY_BRAND_RE = /(toutes?\s+(?:les\s+)?marques?|peu\s+importe\s+(?:la\s+)?marque|n['’]importe\s+(?:quelle\s+)?marque|pas\s+de\s+marque\s+pr[ée]f[ée]r[ée]e|la\s+marque\s+(?:m['’]importe\s+peu|n['’]est\s+pas\s+importante|compte\s+pas)|any\s+brand|je\s+m['’]en\s+fous?\s+de\s+la\s+marque)/i;
var FALSE_CHECK_RE = /(je\s+(?:viens\s+de\s+|vais\s+|suis\s+en\s+train\s+de\s+)?v[ée]rifi\w*|j['’]ai\s+(?:bien\s+)?v[ée]rifi[ée]|que\s+je\s+v[ée]rifie|je\s+regarde\s+(?:tout\s+de\s+suite|la\s+dispo\w*|le\s+stock)|en\s+stock|dans\s+notre\s+stock|stock\s+actuel)/i;
var DEFINITE_STOCK_RE = /\b(est|sont)\s+(bien\s+|actuellement\s+|toujours\s+|encore\s+|effectivement\s+|donc\s+)*(disponibles?|dispos?)\b|\b(disponibles?|dispos?)\s+(imm[ée]diatement|tout\s+de\s+suite|maintenant|chez\s+nous|en\s+boutique|actuellement)|\b(nous|on)\s+(l['’]|les\s+)?a(vons)?\s+(bien\s+|encore\s+|en\s+ce\s+moment\s+|actuellement\s+)*(en\s+boutique|disponibles?|en\s+main|sous\s+la\s+main)|il\s+(nous\s+)?en\s+reste|nous\s+en\s+avons\s+(encore|en\s+ce\s+moment|actuellement)/i;
function softenDefiniteStock(t) {
  let out = String(t || "").replace(/\b(est|sont)\s+(?:bien\s+|actuellement\s+|toujours\s+|encore\s+|effectivement\s+|donc\s+)*(?:disponibles?|dispos?)\b/gi, (m, v) => v.toLowerCase() === "sont" ? "figurent dans notre catalogue" : "figure dans notre catalogue").replace(/\b(disponibles?|dispos?)\s+(imm[ée]diatement|tout\s+de\s+suite|maintenant|chez\s+nous|en\s+boutique|actuellement)/gi, "au catalogue").replace(/\b(nous|on)\s+(l['’]|les\s+)?a(vons)?\s+(bien\s+|encore\s+|en\s+ce\s+moment\s+|actuellement\s+)*(en\s+boutique|disponibles?|en\s+main|sous\s+la\s+main)/gi, "$1 $2a$3 au catalogue").replace(/il\s+(nous\s+)?en\s+reste/gi, "il figure au catalogue").replace(/nous\s+en\s+avons\s+(encore|en\s+ce\s+moment|actuellement)/gi, "il figure au catalogue");
  out = out.replace(/d'après notre catalogue,?\s+([^.?!]*figure(?:nt)? dans notre catalogue)/gi, "$1").replace(/(dans notre catalogue|au catalogue)(\s+(dans notre catalogue|au catalogue))+/gi, "$1");
  out = out.replace(/(figure(?:nt)? dans notre catalogue)\s+et\s+(propos|vend|affich)/gi, "$1, $2").replace(/(^|[.!?]\s+)([a-zà-ü])/g, (m, a, c) => a + c.toUpperCase());
  if (!/l'équipe confirme|confirm/i.test(out))
    out = out.replace(/([^.?!]*(figure(?:nt)? dans notre catalogue|au catalogue)[^.?!]*)([.?!])/i, "$1 (l'\xE9quipe confirme la disponibilit\xE9)$3");
  return out;
}
__name(softenDefiniteStock, "softenDefiniteStock");
__name2(softenDefiniteStock, "softenDefiniteStock");
__name22(softenDefiniteStock, "softenDefiniteStock");
var FIRM_PRICE_RE = /meilleur\s+(prix|tarif|offre)|derni[eè]re?\s+(prix|mot|effort|offre)|prix\s+(final|plancher|minimum|le\s+plus\s+bas)|(ne\s+)?(peux|pourrai|pouvons|pourrons)\s+(vraiment\s+|malheureusement\s+)*pas\s+(descendre|aller|faire|baisser)\s*(plus|moins|en\s+dessous|davantage|mieux)?|impossible\s+de\s+(descendre|baisser|faire\s+moins)|c['’]est\s+(vraiment\s+)?(le|mon|notre)\s+maximum|au\s+maximum\s+de|pas\s+plus\s+bas|plus\s+bas\s+possible|le\s+mieux\s+que\s+je\s+puisse/i;
function stripFirmPrice(t) {
  return String(t || "").split(/(?<=[.!?])\s+/).map((x) => FIRM_PRICE_RE.test(x) && !/\d{2,3}[  .,]?\d{3}/.test(x) ? "" : x.replace(/,?\s*(c['’]est\s+)?(vraiment\s+)?(le|mon|notre)\s+(meilleur\s+prix|dernier\s+(prix|mot))[^,.?!]*/gi, "")).filter(Boolean).join(" ").replace(/\s+([,.])/g, "$1").replace(/(je\s+)?ne\s+(peux|pourrai|pouvons)\s+(vraiment\s+|malheureusement\s+)*pas\s+(descendre|aller|faire)\s+(plus\s+bas\s+|moins\s+|en\s+dessous\s+)(que|de)\s+/gi, "je peux vous le faire \xE0 ").replace(/(^|[.!?]\s+)je peux/g, (m, a) => a + "Je peux").trim();
}
__name(stripFirmPrice, "stripFirmPrice");
__name2(stripFirmPrice, "stripFirmPrice");
__name22(stripFirmPrice, "stripFirmPrice");
var PHOTO_CLAIM_RE = /(voici\s+(la|les|une)\s+(photo|image)|(ci[- ]joint|ci[- ]dessous|en\s+pi[èe]ce\s+jointe)[^.?!]{0,30}(photo|image)|je\s+vous\s+(ai\s+)?(envoy[ée]|transmis|partag[ée])\s+(la|les|une|des)\s+(photo|image)|(la|les)\s+(photo|image)s?\s+(que\s+je\s+vous\s+ai|envoy[ée]e?s?|ci[- ]jointe?s?)|(avez|as)[- ](vous|tu)\s+(pu\s+)?(voir|visualiser|regarder|re[çc]u)[^.?!]{0,40}(photo|image)|sur\s+(la|cette)\s+photo)/i;
function stripPhotoClaims(t) {
  const ph = String(t || "").split(/(?<=[.!?])\s+/).filter((x) => !PHOTO_CLAIM_RE.test(x));
  return ph.join(" ").trim();
}
__name(stripPhotoClaims, "stripPhotoClaims");
__name2(stripPhotoClaims, "stripPhotoClaims");
__name22(stripPhotoClaims, "stripPhotoClaims");
function softenStockClaims(t) {
  return String(t || "").replace(/je\s+viens\s+de\s+v[ée]rifier\s*(?:et|:|,)?\s*/gi, "d'apr\xE8s notre catalogue, ").replace(/j['’]ai\s+(?:bien\s+)?v[ée]rifi[ée]\s*(?:et|:|,)?\s*/gi, "d'apr\xE8s notre catalogue, ").replace(/(souhaitez|voulez)[- ]vous\s+que\s+je\s+v[ée]rifie/gi, "$1-vous que l'\xE9quipe confirme").replace(/que\s+je\s+v[ée]rifie/gi, "que l'\xE9quipe confirme").replace(/je\s+(?:vais\s+|suis\s+en\s+train\s+de\s+)?v[ée]rifi\w*(?:\s+(?:tout\s+de\s+suite|imm[ée]diatement|cela|ça))?/gi, "l'\xE9quipe confirme").replace(/je\s+regarde\s+(?:tout\s+de\s+suite|la\s+dispo\w*|le\s+stock)/gi, "l'\xE9quipe confirme la disponibilit\xE9").replace(/(?:bien\s+)?(?:disponibles?\s+)?en\s+stock/gi, (m) => /disponible/i.test(m) ? "disponible d'apr\xE8s notre catalogue" : "au catalogue").replace(/dans\s+notre\s+stock(?:\s+actuel)?/gi, "dans notre catalogue du moment").replace(/stock\s+actuel/gi, "catalogue du moment").replace(/(^|[.!?]\s+)d'après/g, (m, a) => a + "D'apr\xE8s").replace(/(^|[.!?]\s+)l'équipe/g, (m, a) => a + "L'\xE9quipe").replace(/\s{2,}/g, " ").trim().split(/(?<=[.!?])\s+/).map((ph) => {
    let n = 0;
    return ph.replace(/\s*,?\s*d['’]après notre catalogue\s*,?/gi, (m) => n++ ? "" : m).replace(/\s+,/g, ",").replace(/\s{2,}/g, " ");
  }).join(" ").trim();
}
__name(softenStockClaims, "softenStockClaims");
__name2(softenStockClaims, "softenStockClaims");
__name22(softenStockClaims, "softenStockClaims");
function amountsIn(t) {
  const s = String(t || "").replace(/\u00a0|\u202f/g, " ");
  const out = [];
  for (const m of s.matchAll(/(\d{1,4}(?:[.,]\d)?)\s?(k|mille)\b/gi))
    out.push(Math.round(parseFloat(m[1].replace(",", ".")) * 1e3));
  for (const m of s.matchAll(/\d{1,3}(?:[ .,]\d{3})+|\d{4,7}/g)) {
    if (/^0/.test(m[0]))
      continue;
    out.push(Number(m[0].replace(/\D/g, "")));
  }
  return out.filter((v) => v >= 5e3 && v <= 5e6);
}
__name(amountsIn, "amountsIn");
__name2(amountsIn, "amountsIn");
__name22(amountsIn, "amountsIn");
var APK_SEND_MEDIA_MAX = 16 * 1024 * 1024;
var NEGO_FIRST_STEP_F = 2e3;
var NEGO_NEXT_STEP_F = 1500;
var REMISE_AMT_RE = /(\d[\d .]{2,6})\s*(?:f|fcfa|francs?)?\s*(?:de\s+)?(?:remise|r[ée]duction|rabais|de\s+moins|en\s+moins)|(?:remise|r[ée]duction|rabais|geste|baisse)\s+(?:de\s+)?(\d[\d .]{2,6})/gi;
function negoState(meta, product) {
  if (!product || product.digital || !product.price)
    return null;
  const n = meta && meta.nego && Number(meta.nego.price) === Number(product.price) && Date.now() / 1e3 - Number(meta.nego.ts || Date.now() / 1e3) < 3 * 86400 ? meta.nego : null;
  const conceded = Math.max(0, Math.min(NEGO_MAX_F, Number(n && n.conceded) || 0));
  const nextMax = Math.min(NEGO_MAX_F, conceded + (conceded ? NEGO_NEXT_STEP_F : NEGO_FIRST_STEP_F));
  return { product: product.label, price: Number(product.price), conceded, nextMax, offer: product.price - conceded, minThisTurn: product.price - nextMax, floor: product.price - NEGO_MAX_F, steps: Number(n && n.steps) || 0 };
}
__name(negoState, "negoState");
__name2(negoState, "negoState");
__name22(negoState, "negoState");
function allowedHint(pctx) {
  const cat = [...pctx && pctx.catAllowed || pctx && pctx.allowed || []].filter((v) => v >= 5e3).sort((a, b) => a - b);
  if (!cat.length || cat.length > 12)
    return "";
  return ` Montants autoris\xE9s (exactement ceux-ci) : ${cat.map(fmtF2).join(" ; ")} FCFA.`;
}
__name(allowedHint, "allowedHint");
__name2(allowedHint, "allowedHint");
__name22(allowedHint, "allowedHint");
function concessionIn(reply, ns) {
  if (!ns)
    return 0;
  const t = String(reply || "").replace(/\u00a0|\u202f/g, " ");
  let best = 0;
  for (const v of amountsIn(t))
    if (v >= ns.floor && v < ns.price)
      best = Math.max(best, ns.price - v);
  for (const m of t.matchAll(REMISE_AMT_RE)) {
    const d = Number(String(m[1] || m[2] || "").replace(/\D/g, ""));
    if (d >= 500 && d <= 5e4)
      best = Math.max(best, d);
  }
  return best;
}
__name(concessionIn, "concessionIn");
__name2(concessionIn, "concessionIn");
__name22(concessionIn, "concessionIn");
function budgetIn(t) {
  const s = String(t || "");
  const hasK = /\d\s?(k|mille)\b/i.test(s);
  if (!hasK && !/(budget|max|maximum|limite|jusqu|moins\s+de|pas\s+plus|autour\s+de|environ|entre|pas\s+d[ée]passer|fcfa|\bf\b|francs?)/i.test(s))
    return 0;
  const a = amountsIn(s).filter((v) => v >= 2e4);
  return a.length ? Math.max(...a) : 0;
}
__name(budgetIn, "budgetIn");
__name2(budgetIn, "budgetIn");
__name22(budgetIn, "budgetIn");
function extractPrefs(texts, prev) {
  const p = { ...prev || {} };
  for (const raw of texts || []) {
    const t = String(raw || "");
    if (/^\[[a-z_]+\]/.test(t) && !/^\[vocal\]/.test(t))
      continue;
    const n = norm(t);
    if (ANY_BRAND_RE.test(t))
      p.b = "any";
    else if (!/google\s+one|gemini|drive|netflix|office|chatgpt|canva|windows/.test(n)) {
      const b = brandOf(t);
      if (b)
        p.b = b;
    }
    const bu = budgetIn(t);
    if (bu)
      p.bu = bu;
    let m = n.match(/\b(\d{1,2})\s?(?:go|gb)\s*(?:de\s+)?ram\b/) || n.match(/\bram\s*(?:de\s*)?(\d{1,2})\b/);
    if (m)
      p.r = Number(m[1]);
    m = n.match(/\b(32|64|128|256|512)\s?(?:go|gb|g)?\b(?!\s*(?:de\s+)?ram)/) || n.match(/\b(1)\s?(?:to|tb)\b/);
    if (m)
      p.s = m[1] === "1" ? 1024 : Number(m[1]);
    if (/\b(venu|venus|occasion|seconde\s+main|reconditionn\w*)\b/.test(n))
      p.c = "venu";
    else if (/\b(neuf|neufs|scelle|scelles|sealed)\b/.test(n))
      p.c = "neuf";
    const u = new Set(String(p.u || "").split(",").filter(Boolean));
    if (/(puissan|performan|rapide|jeu|jeux|gaming|codm|free\s*fire)/.test(n))
      u.add("puissance");
    if (/(batterie|autonomie)/.test(n))
      u.add("batterie");
    if (/(photo|camera|selfie)/.test(n) && !PHOTO_RE.test(t))
      u.add(/pas\s+prioritaire|secondaire|pas\s+important/.test(n) ? "photo (secondaire)" : "photo");
    if (u.size)
      p.u = [...u].slice(0, 4).join(",");
  }
  return p;
}
__name(extractPrefs, "extractPrefs");
__name2(extractPrefs, "extractPrefs");
__name22(extractPrefs, "extractPrefs");
function prefsLine(p) {
  if (!p)
    return "";
  const parts = [];
  if (p.b === "any")
    parts.push("marque : toutes marques (la marque ne compte pas : propose des mod\xE8les de plusieurs marques selon ses crit\xE8res)");
  else if (p.b)
    parts.push(`marque : ${p.b}`);
  if (p.bu)
    parts.push(`budget : jusqu'\xE0 ${fmtF2(p.bu)} FCFA`);
  if (p.s)
    parts.push(`capacit\xE9 : ${p.s >= 1024 ? "1 To" : p.s + " Go"}`);
  if (p.r)
    parts.push(`RAM : au moins ${p.r} Go`);
  if (p.c)
    parts.push(`\xE9tat : ${p.c === "venu" ? "venu (occasion)" : "neuf"}`);
  if (p.u)
    parts.push(`priorit\xE9s : ${p.u}`);
  return parts.length ? `PR\xC9F\xC9RENCES D\xC9J\xC0 DONN\xC9ES PAR LE CLIENT (ne les redemande pas, sers-t'en) : ${parts.join(" ; ")}.` : "";
}
__name(prefsLine, "prefsLine");
__name2(prefsLine, "prefsLine");
__name22(prefsLine, "prefsLine");
function availTag(e) {
  return e && e.avail === false ? " \u2014 INDISPONIBLE en ce moment (propose une alternative ou que l'\xE9quipe confirme)" : "";
}
__name(availTag, "availTag");
__name2(availTag, "availTag");
__name22(availTag, "availTag");
function suggestModels(prices, p, max = 6) {
  if (!prices || !Array.isArray(prices.entries) || !p || !(p.bu || p.b || p.s || p.r))
    return [];
  let c = prices.entries.filter((e) => e.source !== "digital" && e.category === "telephone" && e.avail !== false && Number(e.price) > 0);
  if (p.b && p.b !== "any")
    c = c.filter((e) => brandOf(`${e.family} ${e.name}`) === p.b);
  if (p.bu)
    c = c.filter((e) => e.price <= p.bu);
  const condOk = /* @__PURE__ */ __name2((e) => !p.c || (p.c === "venu" ? e.cond !== "scelle" : e.cond !== "venu"), "condOk");
  const strict = c.filter((e) => (!p.s || e.storage === p.s) && (!p.r || !e.ram || Number(e.ram) >= p.r) && condOk(e));
  const pool = (strict.length >= 2 ? strict : c.filter((e) => (!p.s || !e.storage || e.storage >= p.s) && condOk(e))).slice().sort((a, b) => b.price - a.price);
  const out = [], seen = /* @__PURE__ */ new Set(), perBrand = {}, perSeries = {};
  for (const pass of [1, 2]) {
    for (const e of pool) {
      const k = `${e.name}|${e.storage}|${e.cond}`;
      if (seen.has(e.name) || seen.has(k))
        continue;
      const br = brandOf(`${e.family} ${e.name}`) || "autre";
      const sk = `${br}:${seriesOf(e).key}`;
      if (pass === 1 && perSeries[sk])
        continue;
      if (p.b === "any" && (perBrand[br] || 0) >= 2)
        continue;
      seen.add(e.name);
      seen.add(k);
      perBrand[br] = (perBrand[br] || 0) + 1;
      perSeries[sk] = 1;
      out.push(e);
      if (out.length >= max)
        break;
    }
    if (out.length >= max)
      break;
  }
  return out;
}
__name(suggestModels, "suggestModels");
__name2(suggestModels, "suggestModels");
__name22(suggestModels, "suggestModels");
var RANGE_Q_RE = /(nouvelle?s?\s+g[ée]n[ée]ration|derni[èe]re?s?\s+(g[ée]n[ée]ration|sortie?s?|mod[eè]les?)|r[ée]cents?|haut\s+de\s+gamme|flagship|premium|quels?\s+(mod[eè]les|t[ée]l[ée]phones)|vos\s+(mod[eè]les|t[ée]l[ée]phones)|qu['’]?est[- ]ce\s+que\s+vous\s+(avez|proposez)|ce\s+que\s+vous\s+(avez|proposez)|gamme|latest|newest|high[- ]end)/i;
function seriesOf(e) {
  const n = String(e.name || "");
  let m;
  if (/iphone/i.test(n)) {
    const g = (m = n.match(/iphone\s+(\d{1,2})/i)) ? Number(m[1]) : /xs|xr|\bx\b/i.test(n) ? 10 : /se/i.test(n) ? 9 : 8;
    const v = /pro\s*max/i.test(n) ? 3 : /pro/i.test(n) ? 2 : /plus/i.test(n) ? 1 : 0;
    return { key: "iphone", label: "iPhone", tier: 0, gen: g * 10 + v };
  }
  if (/samsung|galaxy/i.test(n)) {
    if (m = n.match(/\bS(\d{1,2})\b\s*(ultra|plus|fe|edge|5g)?/i)) {
      const v = /ultra/i.test(n) ? 3 : /plus|edge/i.test(n) ? 2 : /\bfe\b/i.test(n) ? 0 : 1;
      return { key: "S", label: "S\xE9rie S (haut de gamme)", tier: 0, gen: Number(m[1]) * 10 + v };
    }
    if (m = n.match(/\bZ\s*(fold|flip)\s*(\d)/i))
      return { key: "Z", label: "S\xE9rie Z (pliables, haut de gamme)", tier: 0, gen: Number(m[2]) * 10 + (/fold/i.test(n) ? 1 : 0) };
    if (m = n.match(/note\s*(\d{1,2})/i))
      return { key: "Note", label: "S\xE9rie Note (ancien haut de gamme)", tier: 1, gen: Number(m[1]) * 10 + (/ultra/i.test(n) ? 3 : /plus/i.test(n) ? 2 : 0) };
    if (m = n.match(/\bA(\d)(\d)\b/i)) {
      const tier = Number(m[1]) >= 3 ? 2 : 3;
      return { key: tier === 2 ? "Amid" : "Alow", label: tier === 2 ? "S\xE9rie A milieu de gamme (A3x\u2013A5x)" : "S\xE9rie A entr\xE9e de gamme (A0x\u2013A2x)", tier, gen: Number(m[2]) * 10 + Number(m[1]) };
    }
    return { key: "autre", label: "Autres Samsung", tier: 4, gen: 0 };
  }
  if (/pixel/i.test(n)) {
    const g = (m = n.match(/pixel\s+(\d{1,2})/i)) ? Number(m[1]) : 0;
    const v = /pro\s*xl/i.test(n) ? 3 : /pro/i.test(n) ? 2 : /\d\s*a\b/i.test(n) ? 0 : 1;
    return { key: "pixel", label: "Google Pixel", tier: 0, gen: g * 10 + v };
  }
  return { key: "autre", label: e.family || "Autres", tier: 1, gen: 0 };
}
__name(seriesOf, "seriesOf");
__name2(seriesOf, "seriesOf");
__name22(seriesOf, "seriesOf");
function brandLineup(prices, brand, opts = {}) {
  if (!prices || !Array.isArray(prices.entries) || !brand || brand === "any")
    return null;
  const c = prices.entries.filter((e) => e.source !== "digital" && e.category === "telephone" && e.avail !== false && Number(e.price) > 0 && brandOf(`${e.family} ${e.name}`) === brand);
  if (c.length < 3)
    return null;
  const byModel = /* @__PURE__ */ new Map();
  for (const e of c) {
    const k = e.name.toLowerCase();
    const x = byModel.get(k);
    if (!x)
      byModel.set(k, { e, lo: e.price, hi: e.price });
    else {
      x.lo = Math.min(x.lo, e.price);
      x.hi = Math.max(x.hi, e.price);
    }
  }
  const groups = /* @__PURE__ */ new Map();
  for (const x of byModel.values()) {
    const sr = seriesOf(x.e);
    if (!groups.has(sr.key))
      groups.set(sr.key, { sr, items: [] });
    groups.get(sr.key).items.push({ ...x, gen: sr.gen });
  }
  const gs = [...groups.values()].sort((a, b) => a.sr.tier - b.sr.tier);
  const allowed = [];
  const lines = gs.map((g) => {
    g.items.sort((a, b) => b.gen - a.gen || b.hi - a.hi);
    const top = g.items.slice(0, opts.perSeries || 5);
    const lo = Math.min(...g.items.map((i) => i.lo)), hi = Math.max(...g.items.map((i) => i.hi));
    top.forEach((i) => {
      allowed.push(i.lo, i.hi);
    });
    allowed.push(lo, hi);
    const short = /* @__PURE__ */ __name2((i) => i.e.name.replace(/^Samsung Galaxy\s+/i, "").replace(/^Google\s+/i, ""), "short");
    return `- ${g.sr.label} \u2014 de ${fmtF2(lo)} \xE0 ${fmtF2(hi)} FCFA ; les plus r\xE9cents d'abord : ${top.map((i) => `${short(i)} (~${fmtF2(i.lo)}${i.hi !== i.lo ? `\u2013${fmtF2(i.hi)}` : ""})`).join(", ")}${g.items.length > top.length ? `, + ${g.items.length - top.length} plus ancien(s)` : ""}`;
  });
  return { lines, allowed };
}
__name(brandLineup, "brandLineup");
__name2(brandLineup, "brandLineup");
__name22(brandLineup, "brandLineup");
function mentionedModels(prices, text, max = 8) {
  if (!prices || !Array.isArray(prices.entries))
    return [];
  const hay = mnorm(text);
  const out = [], seen = /* @__PURE__ */ new Set();
  for (const e of prices.entries) {
    if (e.source === "digital" || !e.name)
      continue;
    const full = mnorm(e.name).trim();
    let key = full.replace(/^(samsung galaxy|samsung|apple|iphone|google pixel|pixel|infinix|tecno|xiaomi redmi|redmi|xiaomi|apple watch|oppo|realme|honor|huawei|vivo|nokia|motorola) /, "").trim();
    if (!/[a-z]/.test(key) || !/\d/.test(key))
      key = full;
    const keys = [key, key.replace(/ 5 g$/, "")].filter((k) => k.length >= 3 && /\d/.test(k));
    if (!keys.some((k) => hay.includes(` ${k} `)))
      continue;
    const l = entryLabel(e);
    if (seen.has(l))
      continue;
    seen.add(l);
    out.push(e);
    if (out.length >= max)
      break;
  }
  return out;
}
__name(mentionedModels, "mentionedModels");
__name2(mentionedModels, "mentionedModels");
__name22(mentionedModels, "mentionedModels");
var BOT_SELF_RE = /\b(je\s+suis\s+(un|une)\s+(bot|robot|ia|intelligence\s+artificielle|assistant\s+virtuel)|en\s+tant\s+qu'?(ia|intelligence))\b/i;
function detectLang(text) {
  const t = String(text || "");
  if (FON_RE.test(t))
    return "fon";
  const en = (t.match(EN_RE) || []).length;
  const fr = (t.match(/\b(je|vous|le|la|les|bonjour|bonsoir|prix|combien|merci|est|pour|avec|des|un|une)\b/gi) || []).length;
  if (en >= 2 && en > fr)
    return "en";
  return "fr";
}
__name(detectLang, "detectLang");
__name2(detectLang, "detectLang");
__name22(detectLang, "detectLang");
function watHour(tsS) {
  const d = new Date(tsS * 1e3 + WAT_OFFSET_H * 3600 * 1e3);
  return d.getUTCHours();
}
__name(watHour, "watHour");
__name2(watHour, "watHour");
__name22(watHour, "watHour");
function watDay(tsS) {
  return new Date(tsS * 1e3 + WAT_OFFSET_H * 3600 * 1e3).toISOString().slice(0, 10);
}
__name(watDay, "watDay");
__name2(watDay, "watDay");
__name22(watDay, "watDay");
function defaultConvMeta() {
  return {
    v: CONV_V,
    stage: "new",
    last_bot_text: "",
    last_bot_ts: 0,
    last_user_ts: 0,
    last_user_id: "",
    promo_sent: false,
    product: "",
    price: 0,
    floor: 0,
    digital: false,
    price_ts: 0,
    followup_day: "",
    day: "",
    day_n: 0,
    alerts: {}
  };
}
__name(defaultConvMeta, "defaultConvMeta");
__name2(defaultConvMeta, "defaultConvMeta");
__name22(defaultConvMeta, "defaultConvMeta");
function convStub(env, wa) {
  try {
    return env.CONV_DO ? env.CONV_DO.get(env.CONV_DO.idFromName(String(wa))) : null;
  } catch {
    return null;
  }
}
__name(convStub, "convStub");
__name2(convStub, "convStub");
__name22(convStub, "convStub");
async function convDoGet(env, wa) {
  const st = convStub(env, wa);
  if (!st)
    return null;
  try {
    const r = await st.fetch("https://conv.do/conv", { method: "GET" });
    if (!r.ok)
      return null;
    return await r.json();
  } catch (e) {
    console.error("convDO get soft-fail", e && e.message || e);
    return null;
  }
}
__name(convDoGet, "convDoGet");
__name2(convDoGet, "convDoGet");
__name22(convDoGet, "convDoGet");
async function convDoPut(env, wa, hist, meta) {
  const st = convStub(env, wa);
  if (!st)
    return false;
  try {
    const r = await st.fetch("https://conv.do/conv", { method: "PUT", body: JSON.stringify({ hist: (hist || []).slice(-40), meta, at: Date.now() }) });
    return r.ok;
  } catch (e) {
    console.error("convDO put soft-fail", e && e.message || e);
    return false;
  }
}
__name(convDoPut, "convDoPut");
__name2(convDoPut, "convDoPut");
__name22(convDoPut, "convDoPut");
function mergeHist(a, b) {
  const byId = /* @__PURE__ */ new Map();
  const sig = /* @__PURE__ */ new Set();
  for (const h of [...a || [], ...b || []]) {
    if (!h)
      continue;
    const k = h.id ? String(h.id) : `${h.role}|${h.ts}|${String(h.text || "").slice(0, 40)}`;
    if (byId.has(k)) {
      const x = byId.get(k);
      if (String(h.text || "").length > String(x.text || "").length)
        byId.set(k, { ...x, ...h });
      continue;
    }
    const s2 = `${h.role}|${Math.round((Number(h.ts) || 0) / 5)}|${String(h.text || "").slice(0, 60)}`;
    if (!h.id && sig.has(s2))
      continue;
    sig.add(s2);
    byId.set(k, h);
  }
  return [...byId.values()].sort((x, y) => (Number(x.ts) || 0) - (Number(y.ts) || 0) || (x.role === "user" ? -1 : 1));
}
__name(mergeHist, "mergeHist");
__name2(mergeHist, "mergeHist");
__name22(mergeHist, "mergeHist");
var ConvJournal = /* @__PURE__ */ __name2(class {
  constructor(state, env) {
    this.state = state;
  }
  async fetch(req) {
    const u = new URL(req.url);
    if (u.pathname === "/log") {
      if (req.method === "POST") {
        const arr = await req.json();
        const out = {};
        for (const x of Array.isArray(arr) ? arr : [arr]) {
          const at = Number(x && x.at) || Date.now();
          out[`e:${String(at).padStart(13, "0")}:${Math.random().toString(36).slice(2, 8)}`] = x;
        }
        const ks = Object.keys(out);
        for (let i = 0; i < ks.length; i += 100)
          await this.state.storage.put(Object.fromEntries(ks.slice(i, i + 100).map((k) => [k, out[k]])));
        if (Math.random() < 0.03) {
          const cutoff = `e:${String(Date.now() - 10 * 86400 * 1e3).padStart(13, "0")}`;
          const old = await this.state.storage.list({ prefix: "e:", end: cutoff, limit: 500 });
          const oks = [...old.keys()];
          for (let i = 0; i < oks.length; i += 128)
            await this.state.storage.delete(oks.slice(i, i + 128));
        }
        return new Response("ok");
      }
      const limit = Math.min(Math.max(Number(u.searchParams.get("limit") || 200) || 200, 1), 2e3);
      const wa = u.searchParams.get("wa") || "";
      const m = await this.state.storage.list({ prefix: "e:", reverse: true, limit: wa ? 2e3 : limit });
      let items = [...m.values()];
      if (wa)
        items = items.filter((x) => x && (x.from === wa || x.to === wa || x.wa === wa)).slice(0, limit);
      return new Response(JSON.stringify(items.reverse()), { headers: { "Content-Type": "application/json" } });
    }
    if (u.pathname.startsWith("/q")) {
      const cur = await this.state.storage.get("alertq") || [];
      if (req.method === "GET")
        return new Response(JSON.stringify(cur), { headers: { "Content-Type": "application/json" } });
      if (u.pathname === "/q/push") {
        const it = await req.json();
        const i = cur.findIndex((x) => x && it && x.wa && x.wa === it.wa && x.kind === it.kind);
        if (i >= 0)
          cur[i] = { ...it, first_at: cur[i].first_at || cur[i].at, count: (cur[i].count || 1) + 1 };
        else
          cur.push({ ...it, first_at: it.at, count: 1 });
        await this.state.storage.put("alertq", cur.slice(-40));
        return new Response(JSON.stringify({ ok: true, n: Math.min(cur.length, 40) }));
      }
      if (u.pathname === "/q/take") {
        await this.state.storage.put("alertq", []);
        return new Response(JSON.stringify(cur), { headers: { "Content-Type": "application/json" } });
      }
      if (u.pathname === "/q/restore") {
        const back = await req.json();
        await this.state.storage.put("alertq", [...Array.isArray(back) ? back : [], ...cur].slice(-40));
        return new Response(JSON.stringify({ ok: true }));
      }
    }
    if (u.pathname === "/sent") {
      const cur = await this.state.storage.get("sentmap") || [];
      if (req.method === "POST") {
        const it = await req.json();
        await this.state.storage.put("sentmap", [...cur.filter((x) => x.id !== it.id), it].slice(-60));
        return new Response(JSON.stringify({ ok: true }));
      }
      if (req.method === "DELETE") {
        const id = u.searchParams.get("id");
        const hit = cur.find((x) => x.id === id) || null;
        if (hit)
          await this.state.storage.put("sentmap", cur.filter((x) => x.id !== id));
        return new Response(JSON.stringify(hit), { headers: { "Content-Type": "application/json" } });
      }
    }
    if (u.pathname === "/kv") {
      const k = u.searchParams.get("k") || "";
      if (!k)
        return new Response("k", { status: 400 });
      if (req.method === "GET")
        return new Response(JSON.stringify(await this.state.storage.get(k) ?? null), { headers: { "Content-Type": "application/json" } });
      if (req.method === "PUT") {
        await this.state.storage.put(k, await req.json());
        return new Response("ok");
      }
      if (req.method === "POST" && k === "recent") {
        const it = await req.json();
        const cur = await this.state.storage.get("recent") || [];
        const now = Math.floor(Date.now() / 1e3);
        const next = cur.filter((x) => now - Number(x.at) <= 86400).concat([it]).slice(-50);
        await this.state.storage.put("recent", next);
        return new Response("ok");
      }
    }
    if (req.method === "GET")
      return new Response(JSON.stringify(await this.state.storage.get("conv") || null), { headers: { "Content-Type": "application/json" } });
    if (req.method === "PUT") {
      const b = await req.json();
      await this.state.storage.put("conv", b);
      return new Response("ok");
    }
    return new Response("method", { status: 405 });
  }
}, "ConvJournal");
__name22(ConvJournal, "ConvJournal");
async function convLoad(env, wa) {
  let hist = [], meta = null;
  const doP = convDoGet(env, wa);
  try {
    const r = await env.EH_KV.getWithMetadata(`conv:${wa}`);
    if (r && r.value) {
      try {
        hist = JSON.parse(r.value);
      } catch {
        hist = [];
      }
    }
    if (r && r.metadata && r.metadata.v === CONV_V)
      meta = r.metadata;
  } catch (e) {
    console.error("convLoad soft-fail", e && e.message || e);
    hist = await getJSON(env, `conv:${wa}`, []);
  }
  if (!Array.isArray(hist))
    hist = [];
  const dj = await doP;
  if (dj && Array.isArray(dj.hist) && dj.hist.length) {
    const kvLast = hist.reduce((m, h) => Math.max(m, Number(h.ts) || 0), 0);
    const doLast = dj.hist.reduce((m, h) => Math.max(m, Number(h.ts) || 0), 0);
    hist = mergeHist(hist, dj.hist);
    const kvStamp = meta ? Math.max(Number(meta.last_bot_ts) || 0, Number(meta.last_user_ts) || 0) : 0;
    const doStamp = dj.meta ? Math.max(Number(dj.meta.last_bot_ts) || 0, Number(dj.meta.last_user_ts) || 0) : 0;
    if (dj.meta && dj.meta.v === CONV_V && (doStamp >= kvStamp || !meta))
      meta = dj.meta;
    if (doLast > kvLast)
      console.log("conv_do_newer", wa, doLast - kvLast);
  }
  if (!meta) {
    meta = defaultConvMeta();
    try {
      const old = await getJSON(env, `state:${wa}`, null);
      if (old) {
        meta.last_bot_text = String(old.last_bot_text || "").slice(0, 200);
        meta.last_bot_ts = Number(old.last_bot_ts) || 0;
        meta.last_user_ts = Number(old.last_user_ts) || 0;
      }
    } catch {
    }
    const la = [...hist].reverse().find((h) => h.role === "assistant" || h.role === "owner");
    if (la && !meta.last_bot_text) {
      meta.last_bot_text = String(la.text || "").slice(0, 200);
      meta.last_bot_ts = Number(la.ts) || 0;
    }
  }
  return { hist, meta: { ...defaultConvMeta(), ...meta } };
}
__name(convLoad, "convLoad");
__name2(convLoad, "convLoad");
__name22(convLoad, "convLoad");
function packMeta(meta) {
  const m = { ...defaultConvMeta(), ...meta, v: CONV_V, promo_sent: false };
  m.last_bot_text = String(m.last_bot_text || "").slice(0, 200);
  m.product = String(m.product || "").slice(0, 70);
  m.last_user_id = String(m.last_user_id || "").slice(-80);
  const now = Math.floor(Date.now() / 1e3);
  const al = {};
  for (const [k, v] of Object.entries(m.alerts || {}))
    if (now - Number(v) < 6 * 3600)
      al[k] = Number(v);
  m.alerts = al;
  let s = JSON.stringify(m);
  while (s.length > 1e3 && m.last_bot_text.length > 20) {
    m.last_bot_text = m.last_bot_text.slice(0, m.last_bot_text.length - 40);
    s = JSON.stringify(m);
  }
  if (s.length > 1e3 && m.nego) {
    m.nego = { price: m.nego.price, conceded: m.nego.conceded, ts: m.nego.ts };
    s = JSON.stringify(m);
  }
  if (s.length > 1e3 && m.prefs) {
    delete m.prefs;
    s = JSON.stringify(m);
  }
  return m;
}
__name(packMeta, "packMeta");
__name2(packMeta, "packMeta");
__name22(packMeta, "packMeta");
async function convSave(env, wa, hist, meta, prevSerialized = null) {
  const value = JSON.stringify((hist || []).slice(-HIST_MAX));
  const md = packMeta(meta);
  const sig = value + "|" + JSON.stringify(md);
  if (prevSerialized && prevSerialized === sig)
    return false;
  await convDoPut(env, wa, (hist || []).slice(-HIST_MAX), md);
  try {
    await env.EH_KV.put(`conv:${wa}`, value, { expirationTtl: 60 * DAY, metadata: md });
    globalThis.__ehKvDegraded = false;
    return true;
  } catch (e) {
    console.error("KV put soft-fail conv", e && e.message || e);
    globalThis.__ehKvDegraded = true;
    globalThis.__ehKvDegradedAt = Date.now();
    return false;
  }
}
__name(convSave, "convSave");
__name2(convSave, "convSave");
__name22(convSave, "convSave");
function convSig(hist, meta) {
  return JSON.stringify((hist || []).slice(-HIST_MAX)) + "|" + JSON.stringify(packMeta(meta));
}
__name(convSig, "convSig");
__name2(convSig, "convSig");
__name22(convSig, "convSig");
var LOCKS = /* @__PURE__ */ new Map();
function withLock(key, fn) {
  const prev = LOCKS.get(key) || Promise.resolve();
  const next = prev.catch(() => {
  }).then(fn);
  LOCKS.set(key, next.finally(() => {
    if (LOCKS.get(key) === next)
      LOCKS.delete(key);
  }));
  return next;
}
__name(withLock, "withLock");
__name2(withLock, "withLock");
__name22(withLock, "withLock");
async function pushHist(env, wa, role, text, now, extra = null) {
  return withLock(`hist:${wa}`, () => pushHist0(env, wa, role, text, now, extra));
}
__name(pushHist, "pushHist");
__name2(pushHist, "pushHist");
__name22(pushHist, "pushHist");
async function pushHist0(env, wa, role, text, now, extra) {
  const { hist, meta } = await convLoad(env, wa);
  const id = `${role}:${wa}:${now}:${shortHash(String(text || "").slice(0, 60) + (extra && extra.media_id || ""))}`;
  hist.push({ role, text: String(text || "").slice(0, 800), ts: now, id, ...extra || {} });
  if (role === "assistant" || role === "owner") {
    meta.last_bot_text = String(text || "").slice(0, 200);
    meta.last_bot_ts = now;
  } else if (role === "user")
    meta.last_user_ts = now;
  if (role !== "user" || extra)
    await apkFeedPush(env, { from: wa, id, text, ts: now, type: extra && extra.type || "text", ...extra && extra.media_id ? { media_id: extra.media_id, mime: extra.mime || null } : {} }, role);
  await convSave(env, wa, hist, meta);
  return hist;
}
__name(pushHist0, "pushHist0");
__name2(pushHist0, "pushHist0");
__name22(pushHist0, "pushHist0");
async function readProviderDead() {
  try {
    const mem = globalThis.__ehProviderDead;
    if (mem && typeof mem === "object")
      return { ...mem };
    const hit = await caches.default.match(new Request(PROVIDER_DEAD_URL));
    if (hit) {
      const j = await hit.json();
      globalThis.__ehProviderDead = j;
      return { ...j };
    }
  } catch {
  }
  return {};
}
__name(readProviderDead, "readProviderDead");
__name2(readProviderDead, "readProviderDead");
__name22(readProviderDead, "readProviderDead");
async function writeProviderDead(map) {
  globalThis.__ehProviderDead = map;
  try {
    await caches.default.put(new Request(PROVIDER_DEAD_URL), new Response(JSON.stringify(map), { headers: { "Content-Type": "application/json", "Cache-Control": "max-age=3600" } }));
  } catch {
  }
}
__name(writeProviderDead, "writeProviderDead");
__name2(writeProviderDead, "writeProviderDead");
__name22(writeProviderDead, "writeProviderDead");
async function isProviderDead(name) {
  try { if (typeof __S !== "undefined" && __S.AI_REST && Number(__S.AI_REST[name] || 0) > Date.now() && __S.FORCE_PROVIDER !== name) return true; } catch {}
  const map = await readProviderDead();
  return Number(map[name] || 0) > Date.now();
}
__name(isProviderDead, "isProviderDead");
__name2(isProviderDead, "isProviderDead");
__name22(isProviderDead, "isProviderDead");
var PROVIDER_STRIKES = globalThis.__ehProviderStrikes || (globalThis.__ehProviderStrikes = /* @__PURE__ */ new Map());
async function markProviderDead(name, err) {
  const e = String(err || "");
  const hard = /quota|rate.?limit|\b429\b|\b401\b|\b403\b|unauthor|invalid.*key|api.?key|billing|exhausted|RESOURCE_EXHAUSTED|PERMISSION_DENIED|UNAUTHENTICATED|insufficient|credits|4006|neuron|missing/i.test(e);
  const soft = /timeout|timed out|aborted|\b5\d\d\b|overloaded|unavailable/i.test(e);
  if (!hard && !soft)
    return;
  if (!hard) {
    const now0 = Date.now();
    const arr = (PROVIDER_STRIKES.get(name) || []).filter((x) => now0 - x < 10 * 60 * 1e3);
    arr.push(now0);
    PROVIDER_STRIKES.set(name, arr);
    if (arr.length < 2)
      return;
  }
  const map = await readProviderDead();
  const now = Date.now();
  for (const k of Object.keys(map))
    if (Number(map[k]) <= now)
      delete map[k];
  map[name] = now + PROVIDER_DEAD_MS;
  await writeProviderDead(map);
  try { __AIH(name, false, 0, e, Math.round(PROVIDER_DEAD_MS / 1e3)); } catch {}
  console.error("provider_dead", name, String(err || "").slice(0, 140));
}
__name(markProviderDead, "markProviderDead");
__name2(markProviderDead, "markProviderDead");
__name22(markProviderDead, "markProviderDead");
async function markProviderAlive(name) {
  PROVIDER_STRIKES.delete(name);
  const map = await readProviderDead();
  if (map[name]) {
    delete map[name];
    await writeProviderDead(map);
  }
}
__name(markProviderAlive, "markProviderAlive");
__name2(markProviderAlive, "markProviderAlive");
__name22(markProviderAlive, "markProviderAlive");
function anyCloudAiKey(env) {
  return !!(env.GEMINI_API_KEY || env.GROQ_API_KEY || env.OPENROUTER_API_KEY || env.MISTRAL_API_KEY || env.HF_TOKEN || env.COHERE_API_KEY);
}
__name(anyCloudAiKey, "anyCloudAiKey");
__name2(anyCloudAiKey, "anyCloudAiKey");
__name22(anyCloudAiKey, "anyCloudAiKey");
function aiEnabledEnv(env) {
  return anyCloudAiKey(env) || !!env.AI;
}
__name(aiEnabledEnv, "aiEnabledEnv");
__name2(aiEnabledEnv, "aiEnabledEnv");
__name22(aiEnabledEnv, "aiEnabledEnv");
var AI_PROVIDERS = [
  { name: "groq", key: "GROQ_API_KEY", call: (env, msgs, o) => callGroq(env, msgs, o) },
  { name: "gemini", key: "GEMINI_API_KEY", call: (env, msgs, o) => callGemini(env, msgs, o) },
  { name: "openrouter", key: "OPENROUTER_API_KEY", call: (env, msgs, o) => callOpenRouter(env, msgs, o) },
  { name: "mistral", key: "MISTRAL_API_KEY", call: (env, msgs, o) => callMistral(env, msgs, o) },
  { name: "huggingface", key: "HF_TOKEN", call: (env, msgs, o) => callHuggingFace(env, msgs, o) },
  { name: "cohere", key: "COHERE_API_KEY", call: (env, msgs, o) => callCohere(env, msgs, o) },
  { name: "workers_ai", key: "AI", call: (env, msgs, o) => callWorkersAi(env, msgs, o) }
];
async function callWorkersAi(env, msgs, { max_tokens = 300, temperature = AI_TEMP, timeoutMs = AI_TIMEOUT_MS } = {}) {
  if (!env.AI)
    return { ok: false, err: "Workers AI missing binding" };
  const errors = [];
  for (const m of MODELS.slice(0, 2)) {
    try {
      const out = await Promise.race([
        env.AI.run(m, { messages: msgs, max_tokens, temperature }),
        new Promise((_, rej) => setTimeout(() => rej(new Error("timeout")), timeoutMs))
      ]);
      const txt = aiExtractText(out);
      if (txt && String(txt).trim())
        return { ok: true, text: String(txt), model: m };
      errors.push(`${m}: empty`);
    } catch (e) {
      errors.push(`${m}: ${String(e && e.message || e)}`);
      if (/timeout/i.test(String(e && e.message)))
        break;
    }
  }
  return { ok: false, err: errors.join(" | ") };
}
__name(callWorkersAi, "callWorkersAi");
__name2(callWorkersAi, "callWorkersAi");
__name22(callWorkersAi, "callWorkersAi");
async function runAiChain(env, msgs, { max_tokens = 320, temperature = AI_TEMP, deadline = Date.now() + AI_CLOUD_BUDGET_MS, skip = [] } = {}) {
  const errors = [];
  const __F = typeof __S !== "undefined" && __S.FORCE_PROVIDER; // V2: forced provider first (eh_ai_health.forced_until)
  const __X = typeof __S !== "undefined" && Array.isArray(__S.EXTRA_AI) && typeof __XAI === "function" ? __S.EXTRA_AI.map((x) => ({ name: x.name, key: "__always", call: (env2, msgs2, o2) => __XAI(x, msgs2, o2) })) : []; // V8: extra providers (NVIDIA, owner-added)
  const __ALL = [...AI_PROVIDERS, ...__X];
  const __ORDER = __F ? [...__ALL.filter((x) => x.name === __F), ...__ALL.filter((x) => x.name !== __F)] : __ALL;
  for (const p of __ORDER) {
    const __t0 = Date.now();
    if (skip.includes(p.name))
      continue;
    if (p.key !== "__always" && !env[p.key])
      continue;
    const left = deadline - Date.now();
    if (left < 1500) {
      errors.push(`${p.name}: budget`);
      break;
    }
    if (await isProviderDead(p.name)) {
      errors.push(`${p.name}: dead_cache`);
      continue;
    }
    const timeoutMs = Math.max(1500, Math.min(AI_PROVIDER_WINDOW_MS, left));
    try {
      const r = await Promise.race([
        p.call(env, msgs, { max_tokens, temperature, timeoutMs }),
        new Promise((res) => setTimeout(() => res({ ok: false, err: "timeout provider window" }), timeoutMs + 300))
      ]);
      if (r && r.ok && r.text && String(r.text).trim()) {
        await markProviderAlive(p.name);
        try { __AIH(p.name, true, Date.now() - __t0, null); } catch {}
        return { ok: true, text: String(r.text), model: r.model || p.name, provider: p.name, errors };
      }
      errors.push(`${p.name}: ${r && r.err || "empty"}`);
      await markProviderDead(p.name, r && r.err);
    } catch (e) {
      const msg = String(e && e.message || e);
      errors.push(`${p.name}: ${msg}`);
      await markProviderDead(p.name, msg);
    }
  }
  return { ok: false, errors };
}
__name(runAiChain, "runAiChain");
__name2(runAiChain, "runAiChain");
__name22(runAiChain, "runAiChain");
function fmtF2(n) {
  return fmtFCFA(Math.round(Number(n) || 0));
}
__name(fmtF2, "fmtF");
__name2(fmtF2, "fmtF");
__name22(fmtF2, "fmtF");
function entryLabel(e) {
  return `${e.name}${e.storage ? ` ${e.storage >= 1024 ? "1 To" : e.storage + " Go"}` : ""}${e.ram ? ` / ${e.ram} Go RAM` : ""}${e.cond === "scelle" ? " neuf (scell\xE9)" : e.cond === "venu" ? " venu (occasion)" : ""}${e.note ? ` (${e.note})` : ""}`;
}
__name(entryLabel, "entryLabel");
__name2(entryLabel, "entryLabel");
__name22(entryLabel, "entryLabel");
function phoneCandidates(prices, text) {
  if (!prices || !Array.isArray(prices.entries))
    return [];
  const q = parseQuery(text);
  let cands = [];
  for (const e of prices.entries) {
    if (e.source === "digital")
      continue;
    const eb = brandOf(`${e.family} ${e.name}`);
    if (q.brand && eb && q.brand !== eb)
      continue;
    const key = mnorm(norm(e.name).replace(BRAND_WORDS, " ")).trim();
    if (!key || !q.model.includes(` ${key} `))
      continue;
    if ((/^\d/.test(key) || /^(xr|se 2020|x)$/.test(key)) && !q.brand)
      continue;
    cands.push({ e, len: key.split(" ").length });
  }
  if (!cands.length)
    return [];
  const maxLen = Math.max(...cands.map((c) => c.len));
  let out = cands.filter((c) => c.len === maxLen).map((c) => c.e);
  if (q.storage) {
    const s = out.filter((e) => e.storage === q.storage);
    if (s.length)
      out = s;
  }
  return out.slice(0, 12);
}
__name(phoneCandidates, "phoneCandidates");
__name2(phoneCandidates, "phoneCandidates");
__name22(phoneCandidates, "phoneCandidates");
function closeModels(prices, text, max = 3) {
  if (!prices || !Array.isArray(prices.entries))
    return [];
  const q = parseQuery(text);
  if (!q.brand)
    return [];
  const nums = (q.model.match(/\b\d{1,3}\b/g) || []).map(Number);
  const words = new Set(q.model.trim().split(" ").filter((w) => w && !/^\d+$/.test(w)));
  const byName = /* @__PURE__ */ new Map();
  for (const e of prices.entries) {
    if (e.source === "digital")
      continue;
    if (brandOf(`${e.family} ${e.name}`) !== q.brand)
      continue;
    const key = mnorm(norm(e.name).replace(BRAND_WORDS, " "));
    const en = (key.match(/\b\d{1,3}\b/g) || []).map(Number);
    const ew = key.trim().split(" ").filter((w) => w && !/^\d+$/.test(w));
    let score = 0;
    if (nums.length && en.length)
      score -= Math.min(...en.map((n) => Math.abs(n - nums[0]))) * 3;
    else if (nums.length)
      score -= 30;
    for (const w of ew)
      if (words.has(w))
        score += 4;
      else
        score -= 1;
    if (q.storage && e.storage === q.storage)
      score += 1;
    const prev = byName.get(e.name);
    if (!prev || score > prev.score)
      byName.set(e.name, { e, score });
  }
  return [...byName.values()].sort((a, b) => b.score - a.score).slice(0, max).map((x) => x.e);
}
__name(closeModels, "closeModels");
__name2(closeModels, "closeModels");
__name22(closeModels, "closeModels");
var PHONE_WORD_RE = /\b(iphone|samsung|galaxy|redmi|xiaomi|poco|honor|vivo|oppo|pixel|tecno|infinix|huawei|nokia|realme|motorola|itel|ip\s?\d{1,2}|a\d{2}|s\d{2}|pro\s?max|t[ée]l[ée]phone|phone|smartphone)\b/i;
var OUT_ZONE_RE = /\b(calavi|abomey[- ]?calavi|akpakpa|godomey|togba|pahou|ouidah|s[èe]m[èe][- ]?(kpodji|podji)?|porto[- ]?novo|ekpe|womey|hevi[eé]|glo[- ]?djigb[eé]|hors (du )?centre|banlieue)\b/i;
var PHONE_BRAND_RE = /\b(iphone|samsung|galaxy|redmi|tecno|infinix|pixel|xiaomi|itel|oppo|vivo|realme|nokia|huawei|honor)\b/i;
var DIGITAL_HINT_RE = /\b(windows|office|microsoft\s*365|word|excel|netflix|chatgpt|gpt|gemini|google\s*one|antivirus|kaspersky|norton|eset|mcafee|avast|bitdefender|iptv|canva|adobe|photoshop|spotify|youtube\s*premium|prime\s*video|disney|autocad|corel|stata|quickbooks|licence|license|cl[ée]\s+d.activation|abonnement)\b/i;
function buildPriceContext(prices, texts, meta) {
  const cur = texts.join(" ");
  const ctx = { lines: [], allowed: /* @__PURE__ */ new Set(), product: null, floorProducts: [], note: "" };
  const addAllowed = /* @__PURE__ */ __name2((p) => {
    if (p)
      ctx.allowed.add(Number(p));
  }, "addAllowed");
  const attempts = [inferBrandText(cur), ...meta && meta._prevUsers && meta._prevUsers.length ? [inferBrandText(`${meta._prevUsers.join(" ")} ${cur}`)] : []];
  let found = null;
  for (const t of attempts) {
    const raw = t === attempts[0] ? cur : `${(meta && meta._prevUsers || []).join(" ")} ${cur}`;
    let pl = DIGITAL_HINT_RE.test(raw) && !PHONE_BRAND_RE.test(raw) ? digitalLookup(prices, raw) : { status: "none" };
    if (pl.status === "none")
      pl = priceLookup(prices, t);
    if (pl.status === "none")
      pl = digitalLookup(prices, t);
    if (pl.status !== "none") {
      found = { pl, t };
      break;
    }
  }
  if (found && found.pl.status === "exact") {
    const pl = found.pl;
    const digital = !!pl.digital;
    ctx.product = { label: pl.label, price: pl.price, floor: digital ? pl.price : pl.price - NEGO_MAX_F, digital };
    addAllowed(pl.price);
    ctx.lines.push(`PRIX \xC0 ANNONCER : ${pl.label} \u2192 environ ${fmtF2(pl.price)} FCFA. Dis-le avec \xAB environ \xBB ou \xAB autour de \xBB.`);
    if (pl.entry && pl.entry.avail === false) {
      ctx.unavailable = pl.label;
      ctx.lines.push(`ATTENTION : ${pl.label} est marqu\xE9 INDISPONIBLE dans la feuille du jour. Dis-le honn\xEAtement, propose l'alternative disponible la plus proche (liste ci-dessous) ou que l'\xE9quipe v\xE9rifie un prochain arrivage. Ne le promets pas.`);
      const alt = closeModels(prices, found.t).filter((e) => e.avail !== false && e.name !== pl.entry.name).slice(0, 3);
      if (alt.length)
        ctx.lines.push(`ALTERNATIVES DISPONIBLES :
${alt.map((e) => {
          addAllowed(e.price);
          return `${entryLabel(e)} \u2192 environ ${fmtF2(e.price)} FCFA`;
        }).join("\n")}`);
    }
    if (!digital) {
      const vars = phoneCandidates(prices, found.t).filter((e) => e.storage === (pl.entry && pl.entry.storage));
      const conds = [...new Set(vars.map((e) => e.cond).filter(Boolean))];
      if (conds.length > 1 && !parseQuery(found.t).cond) {
        const lines = [];
        for (const c of conds) {
          const ps = vars.filter((e) => e.cond === c).map((e) => e.price);
          const lo = Math.min(...ps), hi = Math.max(...ps);
          ps.forEach(addAllowed);
          lines.push(`${c === "scelle" ? "neuf (scell\xE9)" : "venu (occasion)"} : environ ${fmtF2(lo)}${hi !== lo ? ` \xE0 ${fmtF2(hi)}` : ""} FCFA`);
        }
        ctx.lines.push(`NEUF ET VENU EXISTENT : ${lines.join(" ; ")}. Donne les deux et demande ce qu'il pr\xE9f\xE8re.`);
      }
    }
  } else if (found && found.pl.status === "ambiguous") {
    const opts = found.pl.digital ? (prices.entries || []).filter((e) => e.source === "digital" && found.pl.options.includes(e.name)).slice(0, 6) : phoneCandidates(prices, found.t).slice(0, 8);
    const seen = /* @__PURE__ */ new Set();
    const ls = [];
    for (const e of opts) {
      const l = found.pl.digital ? e.name : entryLabel(e);
      if (seen.has(l))
        continue;
      seen.add(l);
      addAllowed(e.price);
      ls.push(`${l} \u2192 environ ${fmtF2(e.price)} FCFA${availTag(e)}`);
    }
    ctx.lines.push(`VARIANTES (le client doit pr\xE9ciser ${found.pl.ask}) :
${ls.join("\n")}`);
    ctx.lines.push("Si la capacit\xE9 ou la version manque, demande-la en donnant au besoin la fourchette ; ne choisis pas \xE0 sa place.");
    const ps = opts.map((e) => e.price).filter(Boolean);
    if (ps.length)
      ctx.floorProducts.push({ lo: Math.min(...ps) - NEGO_MAX_F, hi: Math.max(...ps) });
  } else if (PHONE_WORD_RE.test(cur) && /\d/.test(cur) || meta && meta._prevUsers && PHONE_WORD_RE.test(cur + " " + meta._prevUsers.slice(-1).join(" ")) && /\d/.test(cur)) {
    const near = closeModels(prices, found ? found.t : attempts[attempts.length - 1]);
    if (near.length) {
      const ls = near.filter((e) => e.avail !== false).map((e) => {
        addAllowed(e.price);
        return `${entryLabel(e)} \u2192 environ ${fmtF2(e.price)} FCFA`;
      });
      ctx.lines.push(`MOD\xC8LE DEMAND\xC9 ABSENT DE NOTRE LISTE. MOD\xC8LES PROCHES DISPONIBLES \xC0 PROPOSER (1, au plus 2) :
${ls.join("\n")}
Dis simplement que ce mod\xE8le pr\xE9cis n'est pas dans notre liste du moment et propose le plus proche avec son prix environ. Pas de faux stock.`);
    }
  }
  if (!ctx.product && meta && meta.price) {
    ctx.product = { label: meta.product, price: meta.price, floor: meta.digital ? meta.price : meta.price - NEGO_MAX_F, digital: !!meta.digital };
    addAllowed(meta.price);
    ctx.lines.push(`PRODUIT EN COURS (d\xE9j\xE0 annonc\xE9) : ${meta.product} \u2192 environ ${fmtF2(meta.price)} FCFA.`);
  }
  if (ctx.product && !ctx.product.digital) {
    ctx.lines.push(`PLANCHER N\xC9GOCIATION (t\xE9l\xE9phone) : ${fmtF2(ctx.product.floor)} FCFA (= prix \u2212 5 000 max). Ne descends jamais en dessous. N'offre une baisse QUE si le client la demande ; annonce d'abord le prix plein.`);
    for (let v = ctx.product.floor; v <= ctx.product.price; v += 500)
      ctx.allowed.add(v);
  } else if (ctx.product && ctx.product.digital) {
    ctx.product.floor = ctx.product.price;
    ctx.lines.push(`PRIX FERME (abonnement / logiciel) : ${fmtF2(ctx.product.price)} FCFA. Aucune remise.`);
  }
  return ctx;
}
__name(buildPriceContext, "buildPriceContext");
__name2(buildPriceContext, "buildPriceContext");
__name22(buildPriceContext, "buildPriceContext");
var SITE_CHAT_RULES = `MODE CHAT DU SITE WEB electronichouse.pages.dev (PRIORITAIRE sur toute autre consigne) : tu r\xE9ponds \xE0 un visiteur du site, pas sur WhatsApp. Boutique au B\xE9nin, ouverte 24h/24. Tu ne donnes AUCUN num\xE9ro de paiement (pas de MoMo), tu ne prends aucun paiement, tu ne confirmes ni commande ni r\xE9servation : pour commander, payer ou n\xE9gocier, le visiteur clique sur le bouton \xAB Finaliser sur WhatsApp \xBB (num\xE9ro principal 01 59 71 67 16). Tu ne cites JAMAIS de nom de marque d'abonnement ou de logiciel (dis \xAB abonnement streaming \xBB, \xAB outil d'IA \xBB, \xAB suite bureautique \xBB, \xAB stockage en ligne \xBB\u2026). Jamais les mots r\xE9plique, copie, imitation. Aucun autre num\xE9ro de t\xE9l\xE9phone ni e-mail. Tu ne demandes pas le num\xE9ro du visiteur. Prix : uniquement ceux de l'EXTRAIT CATALOGUE, avec \xAB environ \xBB ; pas de n\xE9gociation ici (elle se fait sur WhatsApp). Livraison : possible, frais confirm\xE9s sur WhatsApp.`;
var SITE_ORIGIN_RE = /^https:\/\/([a-z0-9-]+\.)?electronichouse\.pages\.dev$/;
var SITE_BRAND_RE = /\b(?:net\s?flix|chat\s?gpt|open\s?ai|gpt[- ]?\d\w*|linked\s?in|canva|microsoft\s*365|office\s*365|office|google\s*one|google\s*drive|gemini|super\s*grok|grok|spotify|deezer|adobe|photoshop|capcut|youtube|prime\s*video|disney\+?|apple\s*music|icloud|power\s*bi|copilot|midjourney|claude|perplexity|duolingo|coursera|udemy|zoom|dropbox|showmax|canal\+?|iptv|kaspersky|norton|avast|mcafee|bitdefender)(?:\s+(?:plus|pro|premium|advanced|business|team|family|famille|ultra|max))?\b/gi;
function siteScrub(t) {
  let x = String(t || "");
  x = x.replace(/[^\s@]+@[^\s@]+\.[a-z]{2,}/gi, "\xA7");
  x = x.replace(/(?:\+?229[\s.\-]?)?\d(?:[\s.\-\u00a0\u202f]?\d){7,10}/g, (m) => {
    const d = m.replace(/\D/g, "").replace(/^229/, "");
    return d === "0159716716" || d === "59716716" ? "01 59 71 67 16" : d === "0153632000" || d === "53632000" ? "01 53 63 20 00" : /000$/.test(d) && !/^01/.test(d) ? m : /^\d{8,}$/.test(d) ? "\xA7" : m;
  });
  x = x.replace(/[^.!?\n]*\u00A7[^.!?\n]*[.!?]?/g, " ");
  x = x.replace(/[^.!?\n]*\b(momo|mobile\s*money)\b[^.!?\n]*[.!?]?/gi, " ");
  x = x.replace(SITE_BRAND_RE, "\xB6");
  x = x.replace(/\u00B6(\s*(,|et|ou|\/)\s*\u00B6)+/g, "\xB6");
  x = x.replace(/(abonnements?|outils?|licences?|logiciels?)((?:\s+[\w\u00C0-\u017F'\u2019-]+){0,3}?)\s*(?:\(\s*)?(?:de |d'|d\u2019|du |type |comme |\u00e0 |a )?\u00B6\s*\)?/gi, "$1$2 ");
  x = x.replace(/\b(le|la|l'|l\u2019|un|une|du|de|des)\s*\u00B6/gi, "cet abonnement");
  x = x.replace(/\u00B6/g, "cet abonnement");
  x = x.replace(/[,;]?\s*(?:(?:ce n'est |ni |pas |aucune? )(?:une? |de |des )?)?(?:r[\u00E9e]pliques?|copies?|imitations?)\b/gi, "");
  x = x.replace(/[ \t]{2,}/g, " ").replace(/\s+([.,!?])/g, "$1").trim();
  return x.replace(/(^|[.!?]\s+)([a-z\u00E0-\u00FF])(?![A-Z])/g, (m, a, b) => a + b.toUpperCase());
}
__name(siteScrub, "siteScrub");
async function siteRate(key, max, windowS) {
  const c = caches.default;
  const slot = Math.floor(Date.now() / 1e3 / windowS);
  const req = new Request(`https://eh.cache/site-rate/${encodeURIComponent(key)}/${slot}`);
  const hit = await c.match(req);
  const n = hit ? Number(await hit.text()) || 0 : 0;
  if (n >= max)
    return false;
  await c.put(req, new Response(String(n + 1), { headers: { "Cache-Control": `max-age=${windowS}` } }));
  return true;
}
__name(siteRate, "siteRate");
async function handleSiteChat(req, env) {
  const origin = req.headers.get("Origin") || "";
  const okOrigin = SITE_ORIGIN_RE.test(origin);
  const cors = okOrigin ? { "Access-Control-Allow-Origin": origin, "Vary": "Origin", "Access-Control-Allow-Methods": "POST, OPTIONS", "Access-Control-Allow-Headers": "Content-Type", "Access-Control-Max-Age": "86400" } : {};
  const out = /* @__PURE__ */ __name((o, status = 200) => new Response(JSON.stringify(o), { status, headers: { "Content-Type": "application/json; charset=utf-8", "Cache-Control": "no-store", ...cors } }), "out");
  if (req.method === "OPTIONS")
    return new Response(null, { status: okOrigin ? 204 : 403, headers: cors });
  if (req.method !== "POST")
    return out({ ok: false, error: "method" }, 405);
  if (origin && !okOrigin)
    return out({ ok: false, error: "origin" }, 403);
  const ip = req.headers.get("CF-Connecting-IP") || "0";
  if (!await siteRate("ip:" + ip, 20, 600))
    return out({ ok: false, error: "rate", reply: "Vous avez envoy\xE9 beaucoup de messages. Continuons sur WhatsApp : cliquez sur \xAB Finaliser sur WhatsApp \xBB." }, 429);
  if (!await siteRate("all", 3e3, 86400))
    return out({ ok: false, error: "busy", reply: "Le chat est tr\xE8s sollicit\xE9. \xC9crivez-nous directement sur WhatsApp." }, 429);
  let b = {};
  try {
    b = await req.json();
  } catch {
  }
  const text = String(b.text || "").replace(/\s+/g, " ").trim().slice(0, 500);
  if (!text)
    return out({ ok: false, error: "text" }, 400);
  const history = (Array.isArray(b.history) ? b.history : []).slice(-8).map((h) => ({ role: h && h.role === "assistant" ? "assistant" : "user", text: String(h && h.text || "").slice(0, 600) }));
  const m0 = b.meta && typeof b.meta === "object" ? b.meta : {};
  const meta = { ...defaultConvMeta() };
  if (["greeting", "new", "collecting", "priced"].includes(m0.stage))
    meta.stage = m0.stage;
  if (m0.prefs && typeof m0.prefs === "object") {
    const pr = {};
    for (const k of ["b", "bu", "s", "r", "c", "u"])
      if (m0.prefs[k] != null)
        pr[k] = k === "bu" || k === "s" || k === "r" ? Number(m0.prefs[k]) || void 0 : String(m0.prefs[k]).slice(0, 40);
    meta.prefs = pr;
  }
  let r;
  try {
    r = await generateReply(env, text, history, { meta, type: "text", site: true, first: !history.length, noLastChance: false });
  } catch (e) {
    console.error("site_chat_err", e && e.message);
    return out({ ok: false, error: "ai", reply: "Petit souci technique. Cliquez sur \xAB Finaliser sur WhatsApp \xBB, on vous r\xE9pond tout de suite." }, 200);
  }
  const reply = siteScrub(r.reply) || "Je vous \xE9coute : quel appareil ou quel abonnement cherchez-vous ?";
  let cards = [];
  if (Array.isArray(r.suggest) && r.suggest.length) {
    const feed = await env.EH_KV.get("feed:products", "json").catch(() => null);
    const items = feed && Array.isArray(feed.items) ? feed.items : [];
    const rl = reply.toLowerCase();
    const key = /* @__PURE__ */ __name((n) => String(n || "").toLowerCase().replace(/^(google|samsung|apple|xiaomi)\s+/, "").replace(/^galaxy\s+/, ""), "key");
    const sug = r.suggest.map((e, i) => ({ e, i, hit: rl.includes(key(e.name)) ? 1 : 0 })).sort((a, b2) => b2.hit - a.hit || a.i - b2.i).map((x) => x.e);
    for (const e of sug) {
      const base = `${e.name}${e.storage ? ` ${e.storage >= 1024 ? "1 To" : e.storage + " Go"}` : ""}`;
      const it = items.find((i) => Number(i.price_value) === e.price && String(i.title).startsWith(base) && !/[\p{L}\p{N}]/u.test(String(i.title).charAt(base.length)) && (!e.cond || (e.cond === "scelle" ? /neuf|scell/i.test(i.title) : e.cond === "venu" ? /occasion|venu|reconditionn/i.test(i.title) : true)));
      if (!it || cards.some((c) => c.id === it.id))
        continue;
      cards.push({ id: it.id, title: siteScrub(it.title), price: Number(it.price_value), link: `/p/${it.id}`, image: String(it.image_link || "").replace(/^https:\/\/[^/]+/, ""), photo: it.image_kind !== "logo" });
      if (cards.length >= 3)
        break;
    }
  }
  if (r.product)
    cards.sort((a, b2) => Number(b2.title.startsWith(r.product)) - Number(a.title.startsWith(r.product)));
  return out({ ok: true, reply, cards, meta: { stage: r.stage || meta.stage, prefs: r.prefs || meta.prefs || {} }, product: r.product ? siteScrub(r.product) : null, price: r.price || null });
}
__name(handleSiteChat, "handleSiteChat");
var SYSTEM_PROMPT = `Tu es le vendeur WhatsApp d\u2019Electronic HOUSE (vente en ligne, clients partout dans le monde). Boutique 24/24. Tu vends t\xE9l\xE9phones (neuf et venu) et tous les abonnements (Google One Gemini Pro, ChatGPT, Netflix, IPTV, Office, antivirus\u2026).

Tu discutes. Tu lis l\u2019historique. Tu n\u2019envoies jamais un message d\u2019accueil type si le fil a d\xE9j\xE0 commenc\xE9. Tu ne recopies pas une phrase pr\xE9c\xE9dente. 1 \xE0 4 phrases, naturelles. Vous, sauf si le client \xE9crit dans une autre langue : alors tu suis sa langue (anglais, fon\u2026).

Prix : si le prompt contient PRIX \xC0 ANNONCER ou un extrait avec montant, tu dis environ ce montant, avec tes mots. Sinon tu pr\xE9cises (capacit\xE9, neuf ou venu) et tu peux donner les deux fourchettes si elles sont dans le prompt. Tu n\u2019inventes pas un chiffre hors prompt. Jamais les mots commission, marge, +20 000, feuille.

N\xE9gociation : seulement les t\xE9l\xE9phones. Tu g\xE8res tout seul, maximum \u22125 000 FCFA pour conclure. Pas plus. Abonnements et logiciels : prix ferme, tu ne baisses pas, tu expliques et tu cherches \xE0 conclure au prix annonc\xE9. Concurrent moins cher sur un t\xE9l : tu d\xE9fends sans d\xE9nigrer, toujours dans les \u22125 000.

Troc / reprise / \xE9change : on \xE9tudie selon l\u2019\xE9tat. Tu ne donnes aucun montant de reprise. Tu fais pr\xE9ciser mod\xE8le, capacit\xE9, \xE9tat, panne, photo, ce qu\u2019il veut en face.

Lieu : tu ne cites JAMAIS Cotonou ni aucune autre ville ou quartier de toi-m\xEAme. Abonnements et logiciels : tout se fait en ligne, pour des clients partout dans le monde. Seulement si le client demande o\xF9 on se trouve / o\xF9 r\xE9cup\xE9rer un produit PHYSIQUE (t\xE9l\xE9phone\u2026), tu r\xE9ponds simplement \xAB au B\xE9nin \xBB.

Livraison partout au B\xE9nin et dans le monde \u2013 frais selon la destination, \xE0 confirmer sur WhatsApp (tu ne cites AUCUN montant de livraison ni aucune ville) ; la boutique confirme le montant (tu n\u2019inventes aucun frais ni d\xE9lai). Paiement, quand le client est pr\xEAt ou demande comment payer : t\xE9l\xE9phones et produits physiques \u2192 le client choisit MoMo 01 97 34 21 01 Horeb (complet) OU paiement \xE0 la livraison (cash \xE0 la r\xE9ception). Abonnements / logiciels \u2192 paiement MoMo AVANT l\u2019activation / l\u2019envoi du produit.

Appel direct : si le client h\xE9site, a une question complexe, une grosse commande, une livraison hors zone, veut parler \xE0 quelqu\u2019un ou demande un appel, tu peux proposer qu\u2019un membre de l\u2019\xE9quipe l\u2019appelle : demande son num\xE9ro et le meilleur moment. Pas \xE0 chaque message.

Apr\xE8s un prix, un simple ok : tu r\xE9agis comme un vendeur et tu attends. S\u2019il prend / paie : tu demandes en un message ce qui manque (quartier, \xE9tat, nom, e-mail digital) et tu donnes les frais + le choix de paiement (t\xE9l\xE9phone : MoMo ou \xE0 la livraison ; abonnement : MoMo avant). Paiement, capture, transfert : un conseiller prend le relais, tu ne confirmes jamais la r\xE9ception d\u2019un paiement.

INTERDIT ABSOLU : tu ne promets JAMAIS une heure, un jour ou une date de livraison, d\u2019exp\xE9dition ou de rendez-vous (pas de \xAB demain \xBB, \xAB 15h \xBB, \xAB aujourd\u2019hui \xBB, \xAB ce soir \xBB, \xAB tout de suite \xBB), tu ne r\xE9serves ni ne mets de c\xF4t\xE9 aucun article, tu ne confirmes ni commande ni paiement. Si le client propose une heure ou un jour : tu dis qu\u2019un conseiller le recontacte pour convenir de la livraison ou du passage.

Garantie, adresse exacte de boutique, IMEI, stock minute : tu ne les inventes pas. Tu ne v\xE9rifies pas le stock toi-m\xEAme : jamais \xAB je v\xE9rifie \xBB, \xAB je viens de v\xE9rifier \xBB ni \xAB en stock \xBB ; tu t\u2019appuies sur le catalogue (\xAB d\u2019apr\xE8s notre catalogue \xBB) et l\u2019\xE9quipe confirme la disponibilit\xE9. Caract\xE9ristiques (RAM, \xE9cran, batterie\u2026) : seulement celles \xE9crites dans le prompt ; sinon tu proposes que l\u2019\xE9quipe confirme. Tu ne reposes jamais une question \xE0 laquelle le client a d\xE9j\xE0 r\xE9pondu : sers-toi de ses pr\xE9f\xE9rences (marque ou \xAB toutes marques \xBB, budget, capacit\xE9, \xE9tat, usage). Boutique physique : tu ne donnes ni adresse ni rendez-vous ; un conseiller le recontacte avec l\u2019adresse. Photos produit : une si demand\xE9e et disponible.

Tu n\u2019\xE9cris pas de liens Facebook ou Google. Tu n\u2019\xE9cris pas de JSON. Tu n\u2019accordes pas \u22125 001 F. Tu ne dis pas que tu es un bot.`;
function histToMsgs(history, maxMsgs = HIST_TURN_MSGS) {
  const out = [];
  for (const h of (history || []).slice(-maxMsgs)) {
    const role = h.role === "user" ? "user" : "assistant";
    const txt = (h.role === "owner" ? "(g\xE9rant) " : "") + String(h.text || "").slice(0, 500);
    if (!txt.trim())
      continue;
    if (out.length && out[out.length - 1].role === role)
      out[out.length - 1].content += "\n" + txt;
    else
      out.push({ role, content: txt });
  }
  while (out.length && out[0].role === "assistant")
    out.shift();
  return out;
}
__name(histToMsgs, "histToMsgs");
__name2(histToMsgs, "histToMsgs");
__name22(histToMsgs, "histToMsgs");
function sanitizeOut(t) {
  let s = unwrapReply(String(t || ""));
  s = s.replace(/<think>[\s\S]*?<\/think>/gi, "");
  s = s.replace(LINK_RE, "").replace(/^.*(page facebook|avis (sur )?google|boutique google).*$/gim, "");
  s = s.replace(/[*_#`>]+/g, "").replace(/^\s*[-•]\s*/gm, "").replace(/^\s*(r[ée]ponse|assistant|vendeur|bot)\s*:\s*/i, "");
  s = s.replace(/^["«\s]+|["»\s]+$/g, "");
  s = s.replace(/[ \t]+\n/g, "\n").replace(/\n{3,}/g, "\n\n").trim();
  return s.slice(0, 700);
}
__name(sanitizeOut, "sanitizeOut");
__name2(sanitizeOut, "sanitizeOut");
__name22(sanitizeOut, "sanitizeOut");
var FORBIDDEN_WORDS_RE = /commission|prix\s+interne|\bmarge\b|markup|\+\s?20\s?000|feuille|tableur|prix\s+d'?achat/i;
function checkAmounts2(reply, pctx) {
  const txt = String(reply || "").replace(/\u00a0|\u202f/g, " ");
  if (FORBIDDEN_WORDS_RE.test(txt))
    return "mot_interdit";
  if (/\b\d+\s?%/.test(txt))
    return "pourcentage";
  if (/€|\$|\beuros?\b|\busd\b/i.test(txt))
    return "devise";
  const allowed = pctx ? pctx.allowed : /* @__PURE__ */ new Set();
  const nums = [];
  for (const m of txt.matchAll(/\d{1,3}(?:[ .,]\d{3})+|\d{4,}|\b\d{2,3}\s?k\b|\b\d{2,3}\s?mille\b/gi)) {
    const raw = m[0];
    const after = txt.slice(m.index + raw.length);
    if (/^\s*(go|gb|to|tb|mo|mb|mah|mp|hz|mm|users?|appareils?)\b/i.test(after))
      continue;
    const digits = raw.replace(/\D/g, "");
    if (digits === MOMO_DIGITS || OWNER_DIGITS.includes(digits) || /^(19|20)\d\d$/.test(digits))
      continue;
    let v = Number(digits);
    if (/k\b|mille/i.test(raw))
      v = Number(raw.match(/\d+/)[0]) * 1e3;
    if (v < 5e3)
      continue;
    nums.push(v);
  }
  const refusal = /\b(pas|impossible|ne\s+peux|ne\s+pouvons|can'?t|cannot|not\s+possible|maximum|max|au\s+mieux|plut[oô]t)\b/i.test(txt);
  const plusDelivery = /* @__PURE__ */ __name2((x) => [DELIVERY_CENTRE_F, DELIVERY_OUT_F].some((dl) => allowed.has(x - dl) || pctx && pctx.floorProducts.some((r) => x - dl >= r.lo && x - dl <= r.hi)), "plusDelivery");
  const ns = pctx && pctx.nego;
  const refuses = /* @__PURE__ */ __name2((v) => refusal && pctx.clientAmounts && pctx.clientAmounts.has(v), "refuses");
  const strictNo = /\b(impossible|ne\s+peux\s+pas|ne\s+pouvons\s+pas|can'?t|cannot)\b/i.test(txt);
  if (ns) {
    for (const m of txt.matchAll(REMISE_AMT_RE)) {
      const d = Number(String(m[1] || m[2] || "").replace(/\D/g, ""));
      if (d > NEGO_MAX_F && d <= 5e4 && !strictNo)
        return "remise_trop_grande";
      if (d > ns.nextMax && d <= NEGO_MAX_F && !strictNo)
        return "palier_trop_grand";
    }
  }
  for (const v of nums) {
    if (ns && !(pctx.ownerAllowed && pctx.ownerAllowed.has(v)) && ![DELIVERY_CENTRE_F, DELIVERY_OUT_F].some((dl) => v - dl >= ns.minThisTurn && v - dl <= ns.offer)) {
      if (v >= ns.floor && v < ns.minThisTurn && !refuses(v))
        return "palier_trop_grand";
      if (ns.conceded && v > ns.offer && v < ns.price && !refuses(v))
        return "recul_prix";
      if (v < ns.floor && v > ns.floor * 0.7 && !refuses(v) && !(pctx.catAllowed && pctx.catAllowed.has(v)))
        return "sous_plancher";
    }
    if (allowed.has(v))
      continue;
    if (pctx && pctx.floorProducts.some((r) => v >= r.lo && v <= r.hi))
      continue;
    if (plusDelivery(v))
      continue;
    const discountSized = v <= 5e4 && (!pctx || !pctx.product || v < pctx.product.floor / 3);
    if (discountSized && pctx && pctx.product) {
      if (pctx.product.digital) {
        if (refusal)
          continue;
        return "remise_sur_digital";
      }
      if (v <= NEGO_MAX_F)
        continue;
      if (refusal)
        continue;
      return "remise_trop_grande";
    }
    if (pctx && pctx.product && v < pctx.product.floor && v > pctx.product.floor / 3)
      return "sous_plancher";
    return "montant_non_autorise";
  }
  return null;
}
__name(checkAmounts2, "checkAmounts2");
__name2(checkAmounts2, "checkAmounts2");
__name22(checkAmounts2, "checkAmounts2");
function mentionsAmount(reply, v) {
  if (!v)
    return false;
  const t = String(reply || "").replace(/(\d)[\s.,\u00a0\u202f](?=\d{3}\b)/g, "$1");
  return new RegExp(`(^|\\D)${Number(v)}(\\D|$)`).test(t);
}
__name(mentionsAmount, "mentionsAmount");
__name2(mentionsAmount, "mentionsAmount");
__name22(mentionsAmount, "mentionsAmount");
function inferBrandText(t) {
  const s = String(t || "");
  if (brandOf(s))
    return s;
  if (/\b(1[1-7]|x[rs]?|se)\s*(pro\s*max|promax|pro|mini|plus)\b|\bpro\s*max\b/i.test(s))
    return "iphone " + s;
  return s;
}
__name(inferBrandText, "inferBrandText");
__name2(inferBrandText, "inferBrandText");
__name22(inferBrandText, "inferBrandText");
function softDup2(a, b) {
  const x = normAck(a), y = normAck(b);
  if (!x || !y)
    return false;
  if (x === y)
    return true;
  return x.length > 40 && y.length > 40 && (x.includes(y.slice(0, 60)) || y.includes(x.slice(0, 60)));
}
__name(softDup2, "softDup2");
__name2(softDup2, "softDup2");
__name22(softDup2, "softDup2");
function histToText(history, maxMsgs = HIST_TURN_MSGS) {
  const rows = (history || []).slice(-maxMsgs).map((h) => `${h.role === "user" ? "Client" : h.role === "owner" ? "G\xE9rant" : "Toi"} : ${String(h.text || "").replace(/\s+/g, " ").slice(0, 300)}`);
  return rows.length ? rows.join("\n") : "(aucun \xE9change avant)";
}
__name(histToText, "histToText");
__name2(histToText, "histToText");
__name22(histToText, "histToText");
function sameText(a, b) {
  const x = normAck(a), y = normAck(b);
  return !!x && !!y && x === y;
}
__name(sameText, "sameText");
__name2(sameText, "sameText");
__name22(sameText, "sameText");
function detectEvents({ text, type, meta, lastBot }) {
  const t = String(text || "");
  const ev = /* @__PURE__ */ new Set();
  const inPay = meta.stage === "wait_pay" || meta.stage === "wait_proof" || /01\s?97\s?34\s?21\s?01|momo|mobile money/i.test(lastBot || "");
  if (PAID_RE.test(t))
    ev.add("paid");
  else if (type !== "image" && PAID2_RE.test(t))
    ev.add("paid");
  if (type === "image" && (inPay || meta.price))
    ev.add("capture");
  else if (type === "image")
    ev.add("media");
  if (READY_RE.test(t) && !ev.has("paid"))
    ev.add("ready");
  if (COD_RE.test(t) && !ev.has("paid") && type !== "image")
    ev.add("cod");
  if (TRADE_RE.test(t))
    ev.add("trade");
  if (VISIT_RE.test(t))
    ev.add("visit");
  if (PHOTO_RE.test(t) && !/capture/i.test(t) && type !== "image")
    ev.add("photo");
  if (/^\s*(oui|ok+|okay|d['’]?accord|volontiers|yes|oui\s+svp|svp|s['’]il\s+vous\s+pla[iî]t|allez[- ]y|vas[- ]y|ok\s+merci|oui\s+merci)\b/i.test(t) && t.length < 60 && /(l['’][ée]quipe[^?]{0,80}(confirm|v[ée]rifi)|que\s+je\s+v[ée]rifie)[^?]*\?/i.test(lastBot || ""))
    ev.add("dispo");
  if (NEGO_RE.test(t))
    ev.add("nego");
  const callReq = CALL_REQ_RE.test(t);
  if (HUMAN_RE.test(callReq ? t.replace(new RegExp(CALL_REQ_RE.source, "gi"), " ") : t))
    ev.add("human");
  const phone = extractPhone(t);
  const askedNum = ASKED_NUM_RE.test(lastBot || "");
  if (phone && (callReq || askedNum || /appel|rappel|joindre|joignable|call|num[ée]ro|contact/i.test(t)) || askedNum && SAME_NUM_RE.test(t) && /appel|rappel|joindre|call/i.test(lastBot || ""))
    ev.add("callback");
  else if (callReq)
    ev.add("call_req");
  if (farDestination(t) && (SHIP_WORD_RE.test(t) || meta.product || ["priced", "wait_commit", "wait_pay", "wait_proof", "done"].includes(meta.stage)))
    ev.add("ship_far");
  if (CONFLICT_RE.test(t))
    ev.add("conflict");
  if (WARRANTY_RE.test(t))
    ev.add("warranty");
  if (/\b(autre|mauvais)\s+num[ée]ro\b|pas\s+le\s+bon\s+num/i.test(t) && inPay)
    ev.add("wrong_number");
  if (type === "audio" || type === "voice")
    ev.add("voice");
  if (!ev.size && /^\s*(ok+|okay|d'?accord|dac+|ça marche|ca marche|bien reçu|bien recu|je vois|hmm+|ah ok)\s*[.!👍🙏]*\s*$/i.test(t) && ["priced", "wait_commit", "wait_proof", "done", "cod"].includes(meta.stage))
    ev.add("ack");
  return ev;
}
__name(detectEvents, "detectEvents");
__name2(detectEvents, "detectEvents");
__name22(detectEvents, "detectEvents");
function eventDirectives(ev, meta, extras) {
  const d = [];
  if (ev.has("capture"))
    d.push("\xC9V\xC9NEMENT : le client vient d'envoyer une image, tr\xE8s probablement la capture de son paiement. Rassure-le, dis que l'\xE9quipe v\xE9rifie la capture et revient vers lui. Si ce n'est pas lisible, l'\xE9quipe lui redemandera ; ne confirme pas toi-m\xEAme le paiement.");
  if (ev.has("paid") && !ev.has("capture"))
    d.push("\xC9V\xC9NEMENT : le client dit avoir pay\xE9 mais n'a pas envoy\xE9 de capture dans ce message. Rassure-le et demande-lui une capture nette du paiement ; l'\xE9quipe v\xE9rifie ensuite. Ne confirme pas toi-m\xEAme le paiement.");
  if (ev.has("wrong_number"))
    d.push("\xC9V\xC9NEMENT : possible paiement sur un mauvais num\xE9ro. Reste calme, rappelle le bon num\xE9ro 01 97 34 21 01 (Horeb) et dis que l'\xE9quipe regarde.");
  if (ev.has("ready"))
    d.push(extras.digital ? "\xC9V\xC9NEMENT : le client est pr\xEAt pour un abonnement / logiciel. En UN message : paiement MoMo 01 97 34 21 01 (Horeb) AVANT l'activation, demande l'e-mail \xE0 activer et la capture du paiement. Pas de livraison, pas de paiement apr\xE8s." : "\xC9V\xC9NEMENT : le client est pr\xEAt / demande comment payer (t\xE9l\xE9phone / produit physique). En UN message : demande ce qui manque (nom, quartier) et laisse-lui le CHOIX : MoMo 01 97 34 21 01 (Horeb) OU paiement \xE0 la livraison (cash \xE0 la r\xE9ception) ; livraison partout au B\xE9nin et dans le monde, frais selon la destination \xE0 confirmer sur WhatsApp (aucun montant). N'impose pas le MoMo.");
  if (ev.has("dispo"))
    d.push("\xC9V\xC9NEMENT : le client accepte que l'\xE9quipe confirme la disponibilit\xE9 : dis simplement que c'est transmis \xE0 l'\xE9quipe qui revient vers lui tr\xE8s vite ; demande au besoin UNE info utile qui manque (capacit\xE9, neuf ou venu, quartier), sans reposer ce qui est d\xE9j\xE0 connu.");
  if (ev.has("cod"))
    d.push(extras.digital ? "\xC9V\xC9NEMENT : le client veut payer apr\xE8s / \xE0 la livraison, mais c'est un abonnement / logiciel : explique poliment que le paiement MoMo 01 97 34 21 01 (Horeb) se fait avant l'activation." : "\xC9V\xC9NEMENT : le client choisit le paiement \xE0 la livraison (cash \xE0 la r\xE9ception). Confirme simplement ce choix avec les frais de livraison, demande seulement ce qui manque (nom, quartier) ; un conseiller le recontacte pour convenir de la livraison (tu ne donnes ni jour ni heure) ; ne demande ni MoMo ni capture.");
  if (ev.has("trade"))
    d.push("\xC9V\xC9NEMENT : troc / reprise. On \xE9tudie selon l'\xE9tat : aucun montant de reprise, jamais \xAB on ne fait pas \xBB. Demande mod\xE8le actuel, capacit\xE9, \xE9tat, panne, photo face et dos, et ce qu'il veut en face (argent ou quel mod\xE8le).");
  if (ev.has("visit"))
    d.push("\xC9V\xC9NEMENT : le client veut passer \xE0 la boutique. Demande son nom ; un conseiller le recontacte avec l'adresse et pour convenir du passage. Aucune adresse, aucun rendez-vous, aucune r\xE9servation de ta part.");
  if (ev.has("photo"))
    d.push(extras.photoSent ? "\xC9V\xC9NEMENT : une photo du produit part juste avec ce message ; mentionne-la bri\xE8vement." : "\xC9V\xC9NEMENT : le client veut une photo du produit ; aucune photo de ce mod\xE8le n'est disponible ici : dis-le honn\xEAtement (pas de \xAB je vous l'envoie \xBB) et que l'\xE9quipe est pr\xE9venue et lui envoie une vraie photo d\xE8s que possible ; ne pousse ni commande ni livraison.");
  if (ev.has("nego"))
    d.push(extras.digital ? "\xC9V\xC9NEMENT : demande de remise sur un abonnement / logiciel : prix ferme, pas de baisse. Explique la valeur et cherche \xE0 conclure au prix annonc\xE9." : "\xC9V\xC9NEMENT : n\xE9gociation sur un t\xE9l\xE9phone. N\xE9gocie en crescendo (voir N\xC9GOCIATION) : petite concession \xE0 la fois, jamais toute la marge d'un coup, jamais de retour en arri\xE8re. Cherche \xE0 conclure.");
  if (ev.has("ack") && ["wait_proof", "done", "cod"].includes(meta.stage))
    d.push("\xC9V\xC9NEMENT : simple \xAB ok \xBB apr\xE8s la commande : une seule phrase tr\xE8s courte (merci / \xE0 tout \xE0 l'heure), sans r\xE9p\xE9ter ce que tu as d\xE9j\xE0 dit.");
  else if (ev.has("ack"))
    d.push("\xC9V\xC9NEMENT : simple \xAB ok \xBB apr\xE8s le prix. R\xE9agis bri\xE8vement et naturellement, laisse-le d\xE9cider (ex. demande s'il veut le r\xE9server) ; ne demande pas encore quartier/nom et ne redonne pas le prix ; ne propose pas de r\xE9server.");
  if (ev.has("human"))
    d.push("\xC9V\xC9NEMENT : le client veut parler \xE0 une personne. Dis-lui simplement, avec tes mots, qu'un membre de l'\xE9quipe prend le relais tr\xE8s vite sur ce m\xEAme WhatsApp ; tu peux proposer qu'on l'appelle (num\xE9ro et meilleur moment).");
  if (ev.has("ship_far"))
    d.push("\xC9V\xC9NEMENT : livraison dans une autre ville / \xE0 l'\xE9tranger. Oui, on exp\xE9die partout (autres villes du B\xE9nin et international). Les frais d\xE9pendent de la ville ou du pays : la boutique v\xE9rifie aupr\xE8s des agences d'exp\xE9dition et confirme le montant. N'invente aucun frais ni d\xE9lai, ne dis jamais qu'on n'exp\xE9die pas. Propose qu'un membre de l'\xE9quipe l'appelle : demande son num\xE9ro et le meilleur moment.");
  if (ev.has("callback"))
    d.push("\xC9V\xC9NEMENT : le client a donn\xE9 un num\xE9ro / accepte d'\xEAtre appel\xE9. Remercie-le et dis qu'un membre de l'\xE9quipe va l'appeler (sans promettre d'heure pr\xE9cise). Ne r\xE9\xE9cris pas son num\xE9ro.");
  if (ev.has("call_req"))
    d.push("\xC9V\xC9NEMENT : le client veut \xEAtre appel\xE9. R\xE9ponds oui avec plaisir et demande \xE0 quel num\xE9ro (ce WhatsApp ou un autre) et \xE0 quelle heure l'\xE9quipe peut l'appeler.");
  if (ev.has("conflict"))
    d.push("\xC9V\xC9NEMENT : client m\xE9content ou m\xE9fiant. Calme, rassurant, pas de dispute.");
  if (ev.has("warranty"))
    d.push("\xC9V\xC9NEMENT : garantie / IMEI / SAV : pas de dur\xE9e ni d'IMEI invent\xE9s, l'\xE9quipe pr\xE9cise.");
  if (ev.has("voice"))
    d.push(extras.transcript ? "Le dernier message client \xE9tait un vocal, transcrit ci-dessus." : "\xC9V\xC9NEMENT : le client a envoy\xE9 un vocal peu clair. Demande-lui naturellement de reformuler ou r\xE9p\xE9ter (ou d'\xE9crire s'il pr\xE9f\xE8re). Ne dis JAMAIS que tu ne peux pas \xE9couter les vocaux : tu les \xE9coutes.");
  if (ev.has("media") && !ev.has("capture"))
    d.push("\xC9V\xC9NEMENT : le client a envoy\xE9 une image (contenu non lu). Accuse r\xE9ception naturellement ; si c'est pour un troc, l'\xE9quipe regarde.");
  if (meta.stage === "cod" && !ev.has("paid") && !ev.has("capture"))
    d.push("\xC9TAPE : paiement \xE0 la livraison choisi : ne demande ni MoMo ni capture ; finalise (nom, quartier) et dis qu'un conseiller le recontacte pour convenir de la livraison (jamais de jour ni d'heure).");
  if ((meta.stage === "wait_pay" || meta.stage === "wait_proof") && !ev.has("ready") && !ev.has("paid") && !ev.has("capture"))
    d.push("\xC9TAPE : commande valid\xE9e, infos de paiement d\xE9j\xE0 donn\xE9es. Ne relance pas le prix et ne redemande pas s'il est int\xE9ress\xE9 : avance la finalisation (adresse / paiement) et r\xE9ponds \xE0 sa question ; jour et heure de livraison : un conseiller les confirme, jamais toi. Si tu donnes un total, c'est prix + frais de livraison.");
  return d;
}
__name(eventDirectives, "eventDirectives");
__name2(eventDirectives, "eventDirectives");
__name22(eventDirectives, "eventDirectives");
var ALERT_LABELS = {
  dispo: "\u{1F50E} Dispo \xE0 confirmer au client",
  ready: "\u{1F4B0} Client pr\xEAt \xE0 payer",
  paid: "\u{1F9FE} Client dit avoir pay\xE9 (capture \xE0 v\xE9rifier)",
  capture: "\u{1F9FE} Capture de paiement re\xE7ue \u2014 \xE0 v\xE9rifier",
  wrong_number: "\u26A0\uFE0F Paiement possible sur mauvais num\xE9ro",
  trade: "\u{1F501} Troc / reprise \xE0 estimer",
  visit: "\u{1F3EC} Client veut passer \xE0 la boutique",
  conflict: "\u26A0\uFE0F Conflit / m\xE9fiance client",
  photo: "\u{1F4F7} Photo produit demand\xE9e (visuel non mapp\xE9)",
  human: "\u{1F64B} Client demande un humain (bot en pause 1 h sur ce fil)",
  ship_far: "\u{1F30D} Livraison hors zone / international demand\xE9e",
  cod: "\u{1F6F5} Commande pr\xEAte \u2014 paiement \xE0 la livraison (cash)",
  callback: "\u{1F4DE} Rappel demand\xE9",
  media_nf: "\u{1F4CE} M\xE9dia client non transf\xE9r\xE9 au 97 \u2014 visible dans l'APK (EH Bo\xEEte)",
  ai_down: "\u26A0\uFE0F Toutes les IA KO \u2014 filet utilis\xE9",
  promise: "\u{1F69A} Livraison / RDV demand\xE9 \u2014 \xE0 confirmer par toi (le bot n'a promis ni heure ni date)"
};
function graphBase(env) {
  return String(env.GRAPH_BASE_URL || "https://graph.facebook.com/v21.0").replace(/\/$/, "");
}
__name(graphBase, "graphBase");
__name2(graphBase, "graphBase");
__name22(graphBase, "graphBase");
async function transcribeVoice(env, mediaId) {
  if (!mediaId || !env.WA_TOKEN)
    return null;
  try {
    const meta = await fetch(`${graphBase(env)}/${mediaId}`, { headers: { Authorization: `Bearer ${env.WA_TOKEN}` }, signal: AbortSignal.timeout(6e3) });
    if (!meta.ok)
      return null;
    const mj = await meta.json();
    if (!mj || !mj.url)
      return null;
    const bin = await fetch(mj.url, { headers: { Authorization: `Bearer ${env.WA_TOKEN}` }, signal: AbortSignal.timeout(8e3) });
    if (!bin.ok)
      return null;
    const buf = await bin.arrayBuffer();
    if (env.GROQ_API_KEY && !await isProviderDead("groq_whisper")) {
      try {
        const fd = new FormData();
        fd.append("file", new Blob([buf], { type: mj.mime_type || "audio/ogg" }), "voice.ogg");
        fd.append("model", "whisper-large-v3-turbo");
        const r = await fetch("https://api.groq.com/openai/v1/audio/transcriptions", { method: "POST", headers: { Authorization: `Bearer ${env.GROQ_API_KEY}` }, body: fd, signal: AbortSignal.timeout(8e3) });
        if (r.ok) {
          const j = await r.json();
          if (j && j.text && j.text.trim())
            return j.text.trim().slice(0, 800);
        } else
          await markProviderDead("groq_whisper", `HTTP ${r.status}`);
      } catch (e) {
        console.error("groq whisper", e && e.message || e);
      }
    }
    if (env.AI) {
      try {
        const out = await Promise.race([env.AI.run("@cf/openai/whisper", { audio: [...new Uint8Array(buf)] }), new Promise((_, rej) => setTimeout(() => rej(new Error("timeout")), 8e3))]);
        if (out && out.text && out.text.trim())
          return out.text.trim().slice(0, 800);
      } catch (e) {
        console.error("workers whisper", e && e.message || e);
      }
    }
  } catch (e) {
    console.error("transcribeVoice soft-fail", e && e.message || e);
  }
  return null;
}
__name(transcribeVoice, "transcribeVoice");
__name2(transcribeVoice, "transcribeVoice");
__name22(transcribeVoice, "transcribeVoice");
function pick(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}
__name(pick, "pick");
__name2(pick, "pick");
__name22(pick, "pick");
function netReply({ lang, ev, pctx, meta, first, alt }) {
  const en = lang === "en";
  const p = pctx && pctx.product;
  if (ev.has("capture") || ev.has("paid"))
    return en ? pick(["Thanks, well noted! Please send a clear screenshot of the payment; the team checks it.", "Received, thank you. A clear screenshot of the payment helps us confirm quickly.", "Noted, thanks! The team is checking; send a clear screenshot if not done yet."]) : pick(["Merci, bien not\xE9 ! Envoyez-nous une capture nette du paiement, l'\xE9quipe v\xE9rifie.", "Bien re\xE7u, merci. Une capture nette du paiement et l'\xE9quipe confirme vite.", "C'est not\xE9, merci ! L'\xE9quipe v\xE9rifie ; envoyez la capture si ce n'est pas fait."]);
  const dig = !!(pctx && pctx.product && pctx.product.digital || meta && meta.digital);
  if (ev.has("ready") && dig)
    return en ? pick([`Great: payment by MoMo ${MOMO_NUMBER} (${MOMO_NAME}) before activation. Which e-mail should we activate?`, `Perfect: MoMo ${MOMO_NUMBER} (${MOMO_NAME}) first, then we activate. Your e-mail?`, `Deal: send the MoMo to ${MOMO_NUMBER} (${MOMO_NAME}) and the e-mail to activate.`]) : pick([`Tr\xE8s bien : paiement MoMo au ${MOMO_NUMBER} (${MOMO_NAME}) avant l'activation. Quel e-mail faut-il activer ?`, `Parfait : MoMo ${MOMO_NUMBER} (${MOMO_NAME}) d'abord, puis on active. Votre e-mail ?`, `C'est parti : envoyez le MoMo au ${MOMO_NUMBER} (${MOMO_NAME}) et l'e-mail \xE0 activer.`]);
  if (ev.has("cod") && !dig)
    return en ? pick([`Noted, you pay cash on delivery (delivery ${fmtF2(DELIVERY_CENTRE_F)} F centre / ${fmtF2(DELIVERY_OUT_F)} F outside). Your name and area? An advisor then contacts you to arrange delivery.`, `Perfect, payment on delivery. Just your name and area; an advisor contacts you to arrange delivery.`]) : pick([`C'est not\xE9, paiement \xE0 la livraison (livraison ${fmtF2(DELIVERY_CENTRE_F)} F centre / ${fmtF2(DELIVERY_OUT_F)} F hors centre). Votre nom et quartier ? Un conseiller vous recontacte pour la livraison.`, `Parfait, vous payez \xE0 la r\xE9ception. Il me faut juste votre nom et quartier ; un conseiller vous recontacte pour convenir de la livraison.`]);
  if (ev.has("ready"))
    return en ? pick([`Great, you choose: MoMo ${MOMO_NUMBER} (${MOMO_NAME}) or cash on delivery; delivery ${fmtF2(DELIVERY_CENTRE_F)} F centre / ${fmtF2(DELIVERY_OUT_F)} F outside. Your area?`, `Perfect: pay by MoMo to ${MOMO_NUMBER} (${MOMO_NAME}) or in cash when you receive it (${fmtF2(DELIVERY_CENTRE_F)} F centre-ville, ${fmtF2(DELIVERY_OUT_F)} F outside). Where are you?`]) : pick([`Tr\xE8s bien, au choix : MoMo ${MOMO_NUMBER} (${MOMO_NAME}) ou cash \xE0 la livraison ; livraison ${fmtF2(DELIVERY_CENTRE_F)} F centre-ville, ${fmtF2(DELIVERY_OUT_F)} F hors centre. Votre quartier ?`, `Parfait : vous payez par MoMo au ${MOMO_NUMBER} (${MOMO_NAME}) ou en esp\xE8ces \xE0 la r\xE9ception (${fmtF2(DELIVERY_CENTRE_F)} F centre, ${fmtF2(DELIVERY_OUT_F)} F hors centre). Vous \xEAtes o\xF9 ?`, `C'est parti : MoMo ${MOMO_NUMBER} (nom ${MOMO_NAME}) ou paiement \xE0 la livraison, comme vous pr\xE9f\xE9rez (livraison ${fmtF2(DELIVERY_CENTRE_F)} / ${fmtF2(DELIVERY_OUT_F)} F). Quel quartier ?`]);
  if (ev.has("dispo"))
    return en ? pick(["Done, I've passed it to the team; they confirm availability very soon.", "Noted, the team checks and gets back to you shortly."]) : pick(["C'est transmis \xE0 l'\xE9quipe, elle vous confirme la disponibilit\xE9 tr\xE8s vite.", "Not\xE9, l'\xE9quipe regarde et revient vers vous rapidement.", "Je transmets tout de suite \xE0 l'\xE9quipe, qui vous confirme la dispo sous peu."]);
  if (ev.has("photo")) {
    const lbl = p && p.label ? ` du ${p.label}` : "";
    return en ? pick([`I don't have a photo${lbl} here yet; the team has been notified and will send you a real one.`, `No photo${lbl} available here right now, sorry; the team will send you one.`]) : pick([`Je n'ai pas encore de photo${lbl} ici ; l'\xE9quipe est pr\xE9venue et vous envoie une vraie photo.`, `D\xE9sol\xE9, pas de photo${lbl} disponible ici pour l'instant ; l'\xE9quipe vous en envoie une d\xE8s que possible.`, `Je n'ai pas la photo${lbl} sous la main, mais l'\xE9quipe est pr\xE9venue et vous l'envoie.`]);
  }
  if (ev.has("human"))
    return en ? pick(["Of course, a team member takes over right here very soon.", "Sure, someone from the team will answer you here shortly.", "No problem, a colleague replies to you here in a moment."]) : pick(["Bien s\xFBr, un membre de l'\xE9quipe vous r\xE9pond ici tr\xE8s vite.", "Pas de souci, quelqu'un de l'\xE9quipe prend le relais ici tout de suite.", "D'accord, un coll\xE8gue vous \xE9crit ici dans un instant."]);
  if (ev.has("ship_far"))
    return en ? pick(["Yes, we ship to other cities and abroad; the fee depends on the destination, the team checks with the shipping agencies and confirms. What number and time can we call you?", "Sure, we ship there too; the shop confirms the fee after checking with the agencies. Can we call you? Number and best time?", "Yes we can ship it; the cost depends on the country or city and the team confirms it. Best number and time to call you?"]) : pick(["Oui, on exp\xE9die aussi dans d'autres villes et \xE0 l'\xE9tranger ; les frais d\xE9pendent de la destination, l'\xE9quipe v\xE9rifie aupr\xE8s des agences et vous confirme. \xC0 quel num\xE9ro et quelle heure peut-on vous appeler ?", "Oui, on vous l'exp\xE9die ; la boutique confirme les frais apr\xE8s v\xE9rification aupr\xE8s des agences. On peut vous appeler ? Num\xE9ro et meilleur moment ?", "C'est possible, on exp\xE9die partout ; le co\xFBt d\xE9pend de la ville ou du pays et l'\xE9quipe vous le confirme. Un num\xE9ro et une heure pour vous appeler ?"]);
  if (ev.has("callback"))
    return en ? pick(["Noted, thank you! A team member will call you at that time.", "Perfect, the team calls you as agreed.", "Thanks, someone from the team will call you shortly."]) : pick(["C'est not\xE9, merci ! Un membre de l'\xE9quipe vous appelle au moment indiqu\xE9.", "Parfait, l'\xE9quipe vous appelle comme convenu.", "Merci, quelqu'un de l'\xE9quipe vous rappelle tr\xE8s vite."]);
  if (ev.has("call_req"))
    return en ? pick(["With pleasure: which number and what time can we call you?", "Sure! Which number (this WhatsApp or another) and when?", "Of course, tell me the number and the best time to call."]) : pick(["Avec plaisir : \xE0 quel num\xE9ro et \xE0 quelle heure peut-on vous appeler ?", "Bien s\xFBr ! Ce num\xE9ro WhatsApp ou un autre, et \xE0 quelle heure ?", "D'accord, donnez-moi le num\xE9ro et le meilleur moment pour vous appeler."]);
  const st = meta && meta.stage;
  if (p && (st === "wait_proof" || st === "done" || st === "cod"))
    return en ? pick(["Thank you! An advisor checks and replies very soon."]) : pick(["Merci ! Un conseiller v\xE9rifie et vous r\xE9pond tr\xE8s vite."]);
  if (p && (st === "wait_pay" || st === "wait_commit"))
    return en ? pick([`Noted for the ${p.label}! Your name and area? Payment by MoMo ${MOMO_NUMBER} (${MOMO_NAME}) or on delivery; an advisor contacts you to arrange delivery.`]) : pick([`Bien not\xE9 pour le ${p.label} ! Votre nom et quartier ? Paiement MoMo ${MOMO_NUMBER} (${MOMO_NAME}) ou \xE0 la livraison ; un conseiller vous recontacte pour convenir de la livraison.`, `Parfait, c'est not\xE9. Il me faut votre nom et quartier ; paiement MoMo ${MOMO_NUMBER} (${MOMO_NAME}) ou \xE0 la livraison, et un conseiller vous recontacte pour la livraison.`]);
  if (p)
    return en ? pick([`The ${p.label} is about ${fmtF2(p.price)} FCFA. Interested?`, `About ${fmtF2(p.price)} FCFA for the ${p.label}. Interested?`, `${p.label}: around ${fmtF2(p.price)} FCFA. Want it?`]) : pick([`Le ${p.label} est \xE0 environ ${fmtF2(p.price)} FCFA. Il vous int\xE9resse ?`, `Environ ${fmtF2(p.price)} FCFA pour le ${p.label}. Il vous int\xE9resse ?`, `${p.label} : autour de ${fmtF2(p.price)} FCFA. \xC7a vous convient ?`]);
  if (ev.has("trade") || ev.has("visit"))
    return en ? pick(["Sure, tell me a bit more and the team follows up.", "Noted! Give me the details and we'll look at it.", "Okay, send me the details and the team gets back to you."]) : pick(["Oui, dites-m'en un peu plus et l'\xE9quipe vous suit.", "C'est not\xE9 ! Donnez-moi les d\xE9tails, on regarde \xE7a.", "D'accord, envoyez-moi les d\xE9tails et l'\xE9quipe revient vers vous."]);
  const sg = pctx && pctx.suggest || [];
  if (sg.length >= 2) {
    const a = sg[0], b = sg[1];
    return en ? pick([`According to our catalogue, within your criteria: ${a.name} (about ${fmtF2(a.price)} FCFA) or ${b.name} (about ${fmtF2(b.price)} FCFA). Which one?`, `Two good options: ${a.name} ~${fmtF2(a.price)} FCFA and ${b.name} ~${fmtF2(b.price)} FCFA. Your pick?`]) : pick([`D'apr\xE8s notre catalogue, dans vos crit\xE8res : ${a.name} (environ ${fmtF2(a.price)} FCFA) ou ${b.name} (environ ${fmtF2(b.price)} FCFA). Lequel vous tente ?`, `Deux bonnes options : ${a.name} autour de ${fmtF2(a.price)} FCFA, ou ${b.name} autour de ${fmtF2(b.price)} FCFA. Votre choix ?`, `Je vous propose ${a.name} (environ ${fmtF2(a.price)} FCFA) ou ${b.name} (environ ${fmtF2(b.price)} FCFA) ; l'\xE9quipe confirme la dispo. Lequel ?`]);
  }
  const pf = meta && meta.prefs || {};
  if (!p && (pf.b || pf.bu || pf.s)) {
    if (!pf.bu)
      return en ? pick(["What budget roughly?", "Roughly how much do you plan to spend?"]) : pick(["Quel budget environ ?", "Vous comptez mettre environ combien ?", "Votre budget tourne autour de combien ?"]);
    if (!pf.s)
      return en ? pick(["Which storage do you need (128 or 256 GB)?", "How much storage do you want?"]) : pick(["Quelle capacit\xE9 vous faut-il (128 ou 256 Go) ?", "Vous voulez combien de stockage ?", "128 Go vous suffit, ou plut\xF4t 256 Go ?"]);
  }
  if (alt)
    return en ? pick(["Tell me a bit more about what you need.", "What matters most for you?"]) : pick(["Dites-m'en un peu plus sur ce qu'il vous faut.", "Qu'est-ce qui compte le plus pour vous ?", "Pr\xE9cisez-moi votre besoin, je vous oriente."]);
  if (pctx && pctx.lines && pctx.lines.length && /VARIANTES|PROCHES/.test(pctx.lines.join(" ")))
    return en ? pick(["Which exact version (storage, new or used)?", "Which storage and condition do you want?", "Tell me the exact version and I give you the price."]) : pick(["Quelle version exactement (capacit\xE9, neuf ou venu) ?", "Vous le voulez en quelle capacit\xE9 et quel \xE9tat ?", "Pr\xE9cisez la version, je vous donne le prix."]);
  const lastU = String(meta && meta._lastUser || "");
  const wantsPhone = /t[ée]l[ée]phone|smartphone|phone|portable|iphone|samsung|android|galaxy|redmi|infinix|tecno|pixel/i.test(lastU) || pf.b || pf.bu || pf.s;
  const wantsDigital = /abonnement|netflix|chatgpt|gemini|office|windows|canva|iptv|logiciel|antivirus|licence|spotify/i.test(lastU);
  if (wantsDigital)
    return en ? pick(["For which use and how many devices / months do you need it?", "Tell me the duration and number of devices you want."]) : pick(["C'est pour quel usage, et sur combien d'appareils / quelle dur\xE9e ?", "Pr\xE9cisez-moi la dur\xE9e et le nombre d'appareils voulus, je vous donne le bon abonnement.", "Pour vous orienter : quelle dur\xE9e d'abonnement et pour combien d'appareils ?"]);
  if (wantsPhone) {
    if (!pf.u)
      return en ? pick(["What will you mainly use it for: photos, games, battery life?", "What matters most: camera, power or battery?"]) : pick(["Vous l'utiliserez surtout pour quoi : photos, jeux, autonomie ?", "Qu'est-ce qui compte le plus pour vous : l'appareil photo, la puissance ou la batterie ?", "Pour bien vous conseiller : plut\xF4t photos, jeux ou grosse autonomie ?"]);
    return en ? pick(["Noted. Any preference between new and used (imported)?", "Would you rather have it new or imported used?"]) : pick(["Bien not\xE9. Vous le pr\xE9f\xE9rez neuf ou venu (occasion import\xE9e) ?", "Neuf scell\xE9 ou venu, qu'est-ce qui vous arrange ?", "C'est not\xE9 ; plut\xF4t neuf ou venu d'Europe ?"]);
  }
  if (first)
    return en ? pick(["Hello! What are you looking for today, a phone or a subscription?", "Hi! Tell me what you need and I'll guide you."]) : pick(["Bonjour ! Vous cherchez plut\xF4t un t\xE9l\xE9phone ou un abonnement ?", "Bonsoir ! Dites-moi ce qu'il vous faut, je vous oriente.", "Bonjour, bienvenue ! T\xE9l\xE9phone ou abonnement, dites-moi votre besoin."]);
  return en ? pick(["Tell me a bit more about what you need.", "What exactly are you looking for?"]) : pick(["Dites-m'en un peu plus sur ce qu'il vous faut.", "Pr\xE9cisez-moi votre besoin, je vous oriente.", "Qu'est-ce qui vous ferait plaisir exactement ?"]);
}
__name(netReply, "netReply");
__name2(netReply, "netReply");
__name22(netReply, "netReply");
var LAST_CHANCE_ORDER = ["groq", "gemini", "mistral", "cohere", "huggingface", "workers_ai"];
var LAST_CHANCE_MS = 6e3;
async function lastChanceAi(env, msgs, { max_tokens = AI_MAX_OUT } = {}) {
  for (const name of LAST_CHANCE_ORDER) {
    const p = AI_PROVIDERS.find((x) => x.name === name);
    if (!p || !env[p.key])
      continue;
    if (await isProviderDead(name))
      continue;
    try {
      const r = await Promise.race([
        p.call(env, msgs, { max_tokens, temperature: AI_TEMP, timeoutMs: LAST_CHANCE_MS }),
        new Promise((res) => setTimeout(() => res({ ok: false, err: "timeout last chance" }), LAST_CHANCE_MS + 300))
      ]);
      if (r && r.ok && r.text && String(r.text).trim()) {
        await markProviderAlive(name);
        return { ok: true, text: String(r.text), model: r.model || name, provider: name, errors: [] };
      }
      await markProviderDead(name, r && r.err);
      return { ok: false, errors: [`${name}_last: ${r && r.err || "empty"}`] };
    } catch (e) {
      return { ok: false, errors: [`${name}_last: ${String(e && e.message || e)}`] };
    }
  }
  return { ok: false, errors: ["last_chance: aucun prestataire vivant"] };
}
__name(lastChanceAi, "lastChanceAi");
__name2(lastChanceAi, "lastChanceAi");
__name22(lastChanceAi, "lastChanceAi");
async function generateReply(env, text, history = [], opts = {}) {
  const meta = { ...defaultConvMeta(), ...opts.meta || {} };
  const texts = Array.isArray(opts.texts) && opts.texts.length ? opts.texts : [String(text || "")];
  const joined = texts.join("\n");
  const prices = await loadPrices(env, !!opts.freshCatalog);
  const cat = await loadCatalog(env, !!opts.freshCatalog);
  const prevUsers = (history || []).filter((h) => h.role === "user").slice(-3).map((h) => String(h.text || ""));
  meta._prevUsers = prevUsers;
  const pctx = buildPriceContext(prices, texts.filter((t) => !/^\[[a-z_]+\]$/.test(t)), meta);
  delete meta._prevUsers;
  const lastBot = meta.last_bot_text || lastAssistText(history);
  const prefs = extractPrefs([...meta.prefs ? [] : prevUsers, ...texts], meta.prefs);
  meta.prefs = prefs;
  pctx.catAllowed = new Set(pctx.allowed);
  pctx.nego = negoState(meta, pctx.product);
  if (pctx.nego) {
    for (let v = pctx.nego.floor; v < pctx.nego.minThisTurn; v += 500)
      pctx.catAllowed.delete(v);
    pctx.lines = pctx.lines.filter((l) => !/^PLANCHER NÉGOCIATION/.test(l));
    const n = pctx.nego;
    pctx.lines.push(n.conceded ? `N\xC9GOCIATION EN COURS : prix catalogue ${fmtF2(n.price)} FCFA ; tu as d\xE9j\xE0 propos\xE9 ${fmtF2(n.offer)} FCFA (${fmtF2(n.conceded)} F de remise). Ne remonte jamais au-dessus de ${fmtF2(n.offer)}. ${n.conceded >= NEGO_MAX_F ? "Remise maximale atteinte : c'est le dernier prix, tu peux le dire, reste ferme et aimable." : `Ne dis pas \xAB meilleur prix \xBB, \xAB dernier prix \xBB ni \xAB je ne peux pas descendre plus \xBB (il reste de la marge) ; si le client insiste encore, tu peux l\xE2cher un petit peu plus (\xE0 toi de choisir le palier, 500 \xE0 1 500 F), sans jamais proposer moins de ${fmtF2(n.minThisTurn)} FCFA ce tour-ci.`}` : `N\xC9GOCIATION : ne dis jamais \xAB meilleur prix \xBB, \xAB dernier prix \xBB ni \xAB je ne peux pas descendre plus \xBB tant que la remise totale n'atteint pas 5 000 F. Annonce d'abord le prix plein ${fmtF2(n.price)} FCFA. N'accorde une baisse QUE si le client la demande, et progressivement (crescendo) : premi\xE8re concession petite (\xE0 toi de choisir, 500 \xE0 2 000 F), jamais toute la marge d'un coup ; ce tour-ci, pas moins de ${fmtF2(n.minThisTurn)} FCFA.`);
  }
  pctx.ownerAllowed = /* @__PURE__ */ new Set();
  pctx.clientAmounts = new Set(amountsIn([...texts, ...prevUsers].join(" ")));
  for (const v of pctx.clientAmounts)
    pctx.allowed.add(v);
  const recentHist = (history || []).slice(-HIST_TURN_MSGS);
  for (const v of amountsIn(recentHist.filter((h) => h.role !== "user").map((h) => String(h.text || "")).join(" ")))
    pctx.allowed.add(v);
  for (const v of amountsIn(recentHist.filter((h) => h.role === "owner").map((h) => String(h.text || "")).join(" ")))
    pctx.ownerAllowed.add(v);
  const GREET_RE = /^\s*(bonjour|bonsoir|salut|slt|bjr|bsr|hello|hi|coucou|yo|cc|re\s*bonjour|allo)\b/i;
  const lastTxt = String(texts[texts.length - 1] || "");
  const RECAP_RE = /\d{2,3}[  .,]?000|\bF(CFA)?\b|finalis|conclu|n[ée]goci|dernier prix|commande|livraison/i;
  const isGreeting = GREET_RE.test(lastTxt) && lastTxt.length < 80;
  const nowS22 = Date.now() / 1e3;
  const lastUserTs = [...history || []].reverse().find((h) => h.role === "user" && Number(h.ts || 0) < nowS22 - 120);
  const prevTs = Number(lastUserTs && lastUserTs.ts || 0);
  const gapH = prevTs ? (nowS22 - prevTs) / 3600 : 0;
  const returning = !!prevTs && gapH >= 6;
  const pureGreet = isGreeting && !lastTxt.replace(GREET_RE, "").replace(/electronic\s*house|\beh\b|monsieur|madame|mademoiselle|\bmr\b|\bmme\b|boss|patron|chef|fr[èe]re|s[œo]eur|tonton|tantie|comment (allez[- ]vous|vous allez|[çc]a va)|[çc]a va|\bcv\b|la forme|svp|s'il vous pla[iî]t|\bet\b|[^\p{L}\p{N}]+/giu, "").trim();
  const ownerPrice = (() => {
    for (const h of [...recentHist].reverse()) {
      if (h.role === "owner" || h.role === "assistant") {
        const a = amountsIn(String(h.text || "")).filter((v) => v >= 2e4);
        if (a.length && (h.role === "owner" || /dernier\s+prix|prix\s+final|d'accord|accord/i.test(h.text)))
          return a[a.length - 1];
      }
    }
    return 0;
  })();
  const exact = pctx.lines.some((l) => /^PRIX À ANNONCER/.test(l));
  const mentTxt = [lastBot, ...texts].join(" \n ");
  const ment = DIGITAL_HINT_RE.test(texts.join(" ")) && !PHONE_BRAND_RE.test(mentTxt) ? [] : mentionedModels(prices, mentTxt);
  if (ment.length && !exact) {
    ment.forEach((e) => pctx.allowed.add(Number(e.price)));
    pctx.lines.push(`MOD\xC8LES CIT\xC9S DANS LA CONVERSATION (prix catalogue ; sers-t'en pour comparer ou r\xE9pondre, rien d'invent\xE9) :
${ment.map((e) => `- ${entryLabel(e)} \u2192 environ ${fmtF2(e.price)} FCFA${availTag(e)}`).join("\n")}`);
  }
  pctx.suggest = [];
  const stageRank0 = { greeting: 0, new: 0, collecting: 1, priced: 2, wait_commit: 3 };
  if (!exact && stageRank0[meta.stage] != null && (prefs.bu || prefs.b || prefs.s) && !(pctx.product && pctx.product.digital)) {
    const sug = suggestModels(prices, prefs).filter((e) => !ment.includes(e));
    if (sug.length) {
      pctx.suggest = sug;
      sug.forEach((e) => pctx.allowed.add(Number(e.price)));
      pctx.lines.push(`MOD\xC8LES DU CATALOGUE QUI CORRESPONDENT \xC0 SES CRIT\xC8RES (propose-en 2 ou 3 avec \xAB environ \xBB ; la disponibilit\xE9 est confirm\xE9e par l'\xE9quipe) :
${sug.map((e) => `- ${entryLabel(e)} \u2192 environ ${fmtF2(e.price)} FCFA`).join("\n")}`);
    }
  }
  if (!exact && !(pctx.product && pctx.product.digital) && stageRank0[meta.stage] != null) {
    const qb = parseQuery([...texts].join(" ")).brand;
    const rangeQ = RANGE_Q_RE.test(texts.join(" "));
    const brands = qb ? [qb] : rangeQ && prefs.b && prefs.b !== "any" ? [prefs.b] : rangeQ && (!prefs.b || prefs.b === "any") && PHONE_WORD_RE.test(texts.join(" ")) ? ["samsung", "iphone", "pixel"] : [];
    const onlyBrand = qb && !pctx.lines.some((l) => /^(PRIX À ANNONCER|VARIANTES|MODÈLE DEMANDÉ ABSENT)/.test(l));
    if (brands.length && (onlyBrand || rangeQ || !qb)) {
      const blocks = [];
      for (const b of brands) {
        const lu = brandLineup(prices, b, { perSeries: brands.length > 1 ? 3 : 5 });
        if (lu) {
          lu.allowed.forEach((v) => pctx.allowed.add(Number(v)));
          blocks.push(`${b === "iphone" ? "iPhone" : b === "pixel" ? "Google Pixel" : b.charAt(0).toUpperCase() + b.slice(1)} :
${lu.lines.join("\n")}`);
        }
      }
      if (blocks.length) {
        pctx.range = true;
        pctx.lines.push(`GAMME DU CATALOGUE PAR S\xC9RIE (haut de gamme d'abord, mod\xE8les les plus r\xE9cents en t\xEAte ; prix \xAB environ \xBB) :
${blocks.join("\n")}
Pr\xE9sente un \xC9VENTAIL repr\xE9sentatif adapt\xE9 \xE0 sa demande et \xE0 son budget : \xAB nouvelle g\xE9n\xE9ration / r\xE9cent \xBB = les plus r\xE9cents de CHAQUE s\xE9rie (ex. un S r\xE9cent, un A5x r\xE9cent, un A d'entr\xE9e r\xE9cent) ; \xAB haut de gamme \xBB = s\xE9ries S / Z / Pro d'abord. Jamais seulement les A d'entr\xE9e de gamme. Budget inconnu : 2 \xE0 3 exemples \xE9tal\xE9s avec leur prix, puis demande son budget.`);
      }
    }
  }
  const ev = opts.events || detectEvents({ text: joined, type: opts.type || "text", meta, lastBot });
  const lang = detectLang(joined + " " + prevUsers.slice(-1).join(" "));
  const first = opts.first != null ? !!opts.first : !(history || []).some((h) => h.role === "user" || h.role === "assistant" || h.role === "owner");
  const hour = watHour(Math.floor(Date.now() / 1e3));
  const buyingIntent = ev.has("ready") || ev.has("paid") || ev.has("capture");
  const stageRank = { greeting: 0, new: 0, collecting: 1, priced: 2, wait_commit: 3, wait_pay: 4, wait_proof: 5, cod: 5, done: 6, pause: 6 };
  const U = [];
  U.push(`HISTORIQUE (8 derniers tours de ce client) :
${histToText(history)}`);
  U.push(`MESSAGE DU CLIENT :
${texts.join("\n")}`);
  U.push(`STAGE : ${meta.stage === "new" ? "greeting" : meta.stage}${first ? " (tout premier message de ce client : salue avec tes mots, " + pick(["question directe sur son besoin", "ton chaleureux et court", "propose t\xE9l\xE9phone ou abonnement", "mentionne qu'on est l\xE0 24/24", "ton souriant, question ouverte"]) + ")" : " (fil d\xE9j\xE0 commenc\xE9 : pas d'accueil)"}. Heure locale (B\xE9nin) : ${hour}h.`);
  U.push("STYLE : vouvoie le client (sauf s'il \xE9crit en anglais ou en fon).");
  {
    const pl = prefsLine(prefs);
    if (pl)
      U.push(pl);
  }
  if (isGreeting)
    U.push(`SALUTATION : le client te salue : commence par le saluer en retour${opts.name ? ` (par son pr\xE9nom / nom : ${String(opts.name).slice(0, 30)})` : ""}.`);
  if (returning && pureGreet)
    U.push(`CLIENT QUI REVIENT (dernier message il y a ${Math.round(gapH)} h) ET QUI SALUE : salue-le chaleureusement et mets-toi \xE0 son \xE9coute (demande-lui, avec tes mots, ce que tu peux faire pour lui aujourd'hui). NE RELANCE PAS l'ancien sujet : ne rappelle ni le produit, ni le prix, ni la n\xE9gociation pr\xE9c\xE9dente, ne propose pas de finaliser. L'HISTORIQUE sert seulement de contexte (ne pas redemander ce qu'il a d\xE9j\xE0 dit ; y revenir seulement s'il en parle).`);
  else if (returning)
    U.push(`CLIENT QUI REVIENT (dernier message il y a ${Math.round(gapH)} h) : r\xE9ponds \xE0 ce qu'il dit maintenant ; l'HISTORIQUE est un contexte (produit, prix convenu${ownerPrice ? ` : ${fmtF2(ownerPrice)} FCFA` : ""}) \xE0 utiliser seulement s'il y fait r\xE9f\xE9rence.`);
  U.push("SUIS LE CLIENT, NE LE DEVANCE PAS : r\xE9ponds d'abord exactement \xE0 ce qu'il demande ; au plus UNE petite question de relance li\xE9e \xE0 son point actuel. Ne parle pas de commande, validation, livraison ou boutique tant qu'il n'a pas montr\xE9 d'intention d'achat (\xAB je prends \xBB, \xAB je veux commander \xBB, \xAB comment payer \xBB, \xAB vous livrez ? \xBB\u2026). Pas de \xAB souhaitez-vous les d\xE9tails techniques ? \xBB s'il ne les a pas demand\xE9s.");
  U.push("R\xC8GLE : ne repose jamais une question \xE0 laquelle le client a d\xE9j\xE0 r\xE9pondu (voir PR\xC9F\xC9RENCES et HISTORIQUE) ; stock / dispo : \xAB d'apr\xE8s notre catalogue \xBB, l'\xE9quipe confirme \u2014 jamais \xAB je v\xE9rifie \xBB ; caract\xE9ristiques : seulement celles \xE9crites ci-dessous.");
  if (lang !== "fr")
    U.push(`LANGUE : le client \xE9crit en ${lang === "en" ? "anglais \u2192 r\xE9ponds en anglais" : "fon \u2192 suis sa langue (fon simple ou fran\xE7ais tr\xE8s simple)"}.`);
  const pgcOnly = isPgcText(joined);
  if (pgcOnly && !opts.site)
    U.push("\xC9CHANGE DE CONTACTS (PGC / \xAB garde contact \xBB / groupes d'ajout) : ce client semble seulement vouloir \xE9changer les contacts, pas acheter. R\xE9ponds naturellement et tr\xE8s bri\xE8vement (1 \xE0 2 phrases courtes) en t'adaptant \xE0 ce qu'il a \xE9crit exactement : confirme que son contact est bien enregistr\xE9, et si \xE7a s'y pr\xEAte pr\xE9sente-toi en quelques mots (Electronic HOUSE : t\xE9l\xE9phones et abonnements) avec le lien du catalogue https://electronichouse.pages.dev . Aucun prix, aucun nom de produit, aucune question commerciale, aucune relance : n'insiste pas et ne pousse pas la vente ensuite, sauf s'il pose une vraie question.");
  const greetOnly = returning && pureGreet || pgcOnly;
  if (greetOnly)
    U.push("EXTRAIT CATALOGUE / PRIX : aucun montant pour ce message (le client ne fait que saluer : n'\xE9cris aucun prix, ne cite aucun produit).");
  else if (pctx.lines.length)
    U.push(`EXTRAIT CATALOGUE / PRIX :
${pctx.lines.join("\n")}`);
  else
    U.push("EXTRAIT CATALOGUE / PRIX : aucun montant pour ce message (n'\xE9cris aucun prix).");
  const rel = relevantItems(cat, [joined, ...prevUsers.slice(-1)].join(" "), 4);
  if (rel.length && !greetOnly)
    U.push("FICHES :\n" + rel.map((i) => `- ${i.name} [${i.category === "logiciel" ? "abonnement num\xE9rique" : i.category}] : ${String(i.description || "").slice(0, 160)}`).join("\n"));
  if (opts.site)
    U.push(SITE_CHAT_RULES);
  else if (buyingIntent || (stageRank[meta.stage] || 0) >= 2 || pctx.product)
    U.push(`LIVRAISON / PAIEMENT : Livraison partout au B\xE9nin et dans le monde \u2013 frais selon la destination, \xE0 confirmer sur WhatsApp (tu ne cites AUCUN montant de livraison ni aucune ville). Paiement : t\xE9l\xE9phone / produit physique \u2192 au choix du client : MoMo 01 97 34 21 01 (nom Horeb) OU paiement \xE0 la livraison (cash) ; abonnement / logiciel \u2192 MoMo avant l'activation. Total \xE9ventuel = prix + frais de livraison. Frais de livraison confirm\xE9s par la boutique (aucun montant invent\xE9). Abonnement : pas de livraison, e-mail \xE0 activer.`);
  const dirs0 = eventDirectives(ev, meta, { photoSent: !!opts.photoSent, transcript: opts.transcript, digital: !!(pctx.product && pctx.product.digital) });
  const dirs = opts.site ? dirs0.filter((d) => !/MoMo|97 34 21 01|paiement|payer|capture/i.test(d)) : dirs0;
  if (dirs.length)
    U.push(dirs.join("\n"));
  if (!opts.site && globalThis.__CLIENTCTX) U.push(globalThis.__CLIENTCTX);
  if (lastBot)
    U.push(`TA DERNI\xC8RE BULLE (ne la recopie pas) : \xAB ${String(lastBot).slice(0, 200)} \xBB`);
  U.push(opts.site ? "\xC9cris maintenant ta r\xE9ponse dans le chat du SITE WEB (texte seul, 1 \xE0 4 phrases, pas de num\xE9ro de paiement)." : "\xC9cris maintenant ta prochaine bulle WhatsApp pour ce client (texte seul).");
  const msgs = [{ role: "system", content: opts.site ? SYSTEM_PROMPT + "\n\n" + SITE_CHAT_RULES : SYSTEM_PROMPT }, { role: "user", content: U.join("\n\n") }];
  const deadline = Date.now() + AI_CLOUD_BUDGET_MS;
  let reply = "", model = null, provider = null, guard = null, errors = [];
  let r = await runAiChain(env, msgs, { deadline, max_tokens: AI_MAX_OUT, skip: opts.skipProviders || [] });
  if (!r.ok && !opts.noLastChance) {
    const lc = await lastChanceAi(env, msgs);
    r = lc.ok ? { ...lc, errors: [...r.errors || [], "last_chance_ok"] } : { ok: false, errors: [...r.errors || [], ...lc.errors || []] };
  }
  if (r.ok) {
    reply = sanitizeOut(r.text);
    model = r.model;
    provider = r.provider;
    let bad = !reply ? "vide" : checkAmounts2(reply, pctx);
    if (!bad && BOT_SELF_RE.test(reply))
      bad = "bot_self";
    if (bad)
      console.log("reply_rejected", bad, JSON.stringify(String(reply).slice(0, 180)));
    const dup = reply && softDup2(reply, lastBot);
    const stockBad = !!reply && (FALSE_CHECK_RE.test(reply) || !opts.photoSent && PHOTO_CLAIM_RE.test(reply));
    if (stockBad)
      console.log("reply_stock_claim", JSON.stringify(String(reply).slice(0, 160)));
    const recapBad = greetOnly && !!reply && RECAP_RE.test(reply);
    const defStock = !!reply && DEFINITE_STOCK_RE.test(reply);
    const zoneBad = !!reply && OUT_ZONE_RE.test([joined, ...prevUsers.slice(-2)].join(" ")) && /1[\s.\u00a0\u202f]?000\s*(f\b|fcfa|francs)/i.test(reply) && !/1[\s.\u00a0\u202f]?500/.test(reply) && /livr/i.test(reply);
    const firmBad = !!reply && !!pctx.nego && FIRM_PRICE_RE.test(reply) && Math.max(pctx.nego.conceded, concessionIn(reply, pctx.nego)) < NEGO_MAX_F;
    if (defStock || firmBad)
      console.log("reply_claim", defStock ? "stock_definitif" : "fermete_prematuree", JSON.stringify(String(reply).slice(0, 160)));
    if (recapBad)
      console.log("reply_recap_on_greeting", JSON.stringify(String(reply).slice(0, 160)));
    if ((bad || dup || stockBad || recapBad || defStock || firmBad || zoneBad) && Date.now() < deadline - 2500) {
      const fix = zoneBad && !bad && !dup ? "Ne donne aucun montant de livraison ni aucune ville : dis \xAB Livraison partout au B\xE9nin et dans le monde \u2013 frais selon la destination, \xE0 confirmer sur WhatsApp \xBB. R\xE9\xE9cris ta bulle." : firmBad && !bad && !dup ? `Tu as encore de la marge de n\xE9gociation : ne dis pas \xAB meilleur prix \xBB, \xAB dernier prix \xBB ni \xAB je ne peux pas descendre plus \xBB. Pr\xE9sente ton offre comme un geste, sans fermer la porte, et cherche \xE0 conclure. Garde les m\xEAmes montants (pas moins de ${fmtF2(pctx.nego.minThisTurn)} FCFA).` : defStock && !bad && !dup && !stockBad ? "Tu ne peux pas affirmer qu'un article est disponible : r\xE9\xE9cris sans \xAB est disponible \xBB, \xAB est bien disponible \xBB, \xAB nous l'avons en boutique \xBB ; dis qu'il figure dans notre catalogue et que l'\xE9quipe confirme la disponibilit\xE9." : recapBad ? "Le client ne fait que te saluer : r\xE9ponds \xE0 son salut chaleureusement et demande-lui avec tes mots ce que tu peux faire pour lui aujourd'hui. Ne rappelle ni produit, ni prix, ni n\xE9gociation, ne propose pas de finaliser." : dup ? "Ta r\xE9ponse est identique \xE0 ta bulle pr\xE9c\xE9dente. Reformule autrement, avec des mots nouveaux, en tenant compte du dernier message du client." : (bad === "palier_trop_grand" || bad === "recul_prix" || bad === "sous_plancher") && pctx.nego ? `Ta r\xE9ponse a \xE9t\xE9 refus\xE9e (${bad}). N\xE9gociation en crescendo : ${pctx.nego.conceded ? `ton offre actuelle est ${fmtF2(pctx.nego.offer)} FCFA, ne remonte pas au-dessus ; ` : ""}ce tour-ci, ne propose pas moins de ${fmtF2(pctx.nego.minThisTurn)} FCFA (petite concession seulement). R\xE9\xE9cris ta bulle.` : bad ? `Ta r\xE9ponse a \xE9t\xE9 refus\xE9e (${bad}). R\xE9\xE9cris-la en respectant strictement les montants fournis (plancher inclus), sans pourcentage, sans mot interdit.${allowedHint(pctx)}` : !opts.photoSent && PHOTO_CLAIM_RE.test(reply) ? "AUCUNE photo n'est envoy\xE9e avec ce message : r\xE9\xE9cris sans dire \xAB voici la photo \xBB, sans demander s'il a vu / re\xE7u la photo ; s'il en veut une, dis honn\xEAtement qu'elle n'est pas disponible ici pour l'instant et que l'\xE9quipe est pr\xE9venue." : "Tu ne peux pas v\xE9rifier le stock : r\xE9\xE9cris sans \xAB je v\xE9rifie \xBB, \xAB je viens de v\xE9rifier \xBB ni \xAB en stock \xBB ; dis \xAB d'apr\xE8s notre catalogue \xBB et que l'\xE9quipe confirme la disponibilit\xE9.";
      const msgs2 = [...msgs, { role: "assistant", content: reply || "\u2026" }, { role: "user", content: `[Consigne interne, ne pas citer] ${fix}` }];
      const r2 = await runAiChain(env, msgs2, { deadline, max_tokens: AI_MAX_OUT, skip: opts.skipProviders || [] });
      let accepted = false;
      if (r2.ok) {
        const rep2 = sanitizeOut(r2.text);
        const bad2 = !rep2 ? "vide" : checkAmounts2(rep2, pctx);
        if (bad2)
          console.log("reply_rejected2", bad2, JSON.stringify(String(rep2).slice(0, 180)));
        const firm2 = !!pctx.nego && FIRM_PRICE_RE.test(rep2) && Math.max(pctx.nego.conceded, concessionIn(rep2, pctx.nego)) < NEGO_MAX_F;
        const zone2 = zoneBad && /1[\s.\u00a0\u202f]?000\s*(f\b|fcfa|francs)/i.test(rep2) && !/1[\s.\u00a0\u202f]?500/.test(rep2);
        if (!bad2 && !softDup2(rep2, lastBot) && !(greetOnly && RECAP_RE.test(rep2)) && !(firmBad && firm2) && !zone2) {
          reply = rep2;
          model = r2.model;
          provider = r2.provider;
          guard = dup ? "reformule" : bad ? `corrige_${bad}` : zoneBad ? "corrige_livraison_zone" : firmBad ? "corrige_fermete" : recapBad ? "corrige_recap" : stockBad ? "corrige_stock" : defStock ? "corrige_stock_definitif" : "corrige";
          bad = null;
          accepted = true;
        }
      }
      if (!accepted && (bad || dup) && Date.now() < deadline - 2e3) {
        {
          const why = bad || "doublon";
          const msgs3 = [...msgs, { role: "user", content: `[Consigne interne, ne pas citer] Ta r\xE9ponse pr\xE9c\xE9dente a \xE9t\xE9 refus\xE9e (${why}). N'\xE9cris AUCUN montant qui ne figure pas dans l'EXTRAIT CATALOGUE ou dans le message du client${allowedHint(pctx)}${pctx.nego ? `, ne propose pas moins de ${fmtF2(pctx.nego.minThisTurn)} FCFA${pctx.nego.conceded ? ` ni plus de ${fmtF2(pctx.nego.offer)} FCFA` : ""} (n\xE9gociation en crescendo)` : ""}, ne r\xE9p\xE8te pas ta bulle pr\xE9c\xE9dente, et r\xE9ponds pr\xE9cis\xE9ment au dernier message du client.` }];
          const r3 = await runAiChain(env, msgs3, { deadline, max_tokens: AI_MAX_OUT, skip: [...new Set([...opts.skipProviders || [], r.provider, r2.ok ? r2.provider : null].filter(Boolean))] });
          if (r3.ok) {
            const rep3 = sanitizeOut(r3.text);
            const bad3 = !rep3 ? "vide" : checkAmounts2(rep3, pctx);
            if (bad3)
              console.log("reply_rejected3", bad3, JSON.stringify(String(rep3).slice(0, 180)));
            if (!bad3 && !softDup2(rep3, lastBot)) {
              reply = rep3;
              model = r3.model;
              provider = r3.provider;
              guard = `corrige3_${why}`;
              bad = null;
              accepted = true;
            }
          }
        }
      }
      if (!accepted && recapBad) {
        guard = "recap_filet";
        reply = "";
      }
      if (!accepted && !bad && dup)
        guard = "dup_drop";
      if (bad) {
        guard = `rejet_${bad}`;
        reply = "";
      }
    } else if (bad) {
      guard = `rejet_${bad}`;
      reply = "";
    } else if (dup)
      guard = "dup_drop";
    if (reply && zoneBad && /1[\s.\u00a0\u202f]?000\s*(f\b|fcfa|francs)/i.test(reply) && !/1[\s.\u00a0\u202f]?500/.test(reply)) {
      reply = reply.replace(/1[\s.\u00a0\u202f]?000(\s*(f\b|fcfa|francs))/i, "1 500$1");
      guard = guard || "livraison_zone_corrigee";
    }
    try {
      await markAiOk(env, `run_${provider}`);
    } catch {
    }
  } else {
    errors = r.errors || [];
    try {
      await markAiFail(env, errors.join(" | ") || "ai_all_failed", "run");
    } catch {
    }
  }
  console.log("reply_via", provider || "none", model || "", guard || "");
  if (guard === "dup_drop" && reply && softDup2(reply, lastBot)) {
    return { drop: true, reply, model, provider, guarded: true, guard_reason: "dup_drop", events: [...ev], stage: meta.stage, flag: false, reason: "" };
  }
  if (reply && FALSE_CHECK_RE.test(reply)) {
    reply = softenStockClaims(reply);
    guard = guard || "adouci_stock";
  }
  if (reply && DEFINITE_STOCK_RE.test(reply)) {
    reply = softenDefiniteStock(reply);
    guard = guard || "adouci_stock_definitif";
  }
  if (reply && pctx.nego && FIRM_PRICE_RE.test(reply) && Math.max(pctx.nego.conceded, concessionIn(reply, pctx.nego)) < NEGO_MAX_F) {
    const r0 = stripFirmPrice(reply);
    if (r0.length >= 15) {
      reply = r0;
      guard = guard || "fermete_retiree";
    }
  }
  if (reply && !opts.photoSent && PHOTO_CLAIM_RE.test(reply)) {
    const r0 = stripPhotoClaims(reply);
    reply = r0.length >= 15 ? r0 : "";
    guard = guard || "photo_non_envoyee";
  }
  let aiFailed = false;
  if (!reply && !opts.site) return { drop: true, ai_retry: true, reply: "", model: null, provider: "none", guarded: true, guard_reason: "ai_retry", error: (errors || []).slice(-3).join(" | ") || null, events: [...ev], stage: meta.stage, flag: false, reason: "" };
  if (!reply) {
    aiFailed = !r.ok;
    meta._lastUser = texts[texts.length - 1];
    reply = netReply({ lang, ev, pctx, meta, first });
    if (isGreeting || returning) {
      const nm = opts.name ? " " + String(opts.name).split(/\s+/)[0].slice(0, 20) : "";
      const hi = lang === "en" ? `Hello${nm}!` : `${watHour(Math.floor(Date.now() / 1e3)) >= 18 ? "Bonsoir" : "Bonjour"}${nm} !`;
      const pr = ownerPrice || meta.price;
      if (isGreeting)
        reply = lang === "en" ? pick(returning ? [`${hi} Good to hear from you, how can I help today?`, `${hi} What can I do for you today?`] : [`${hi} How can I help you today?`, `${hi} What can I do for you?`]) : pick(returning ? [`${hi} Ravi de vous relire, que puis-je faire pour vous aujourd'hui ?`, `${hi} Je vous \xE9coute : qu'est-ce qu'il vous faut aujourd'hui ?`, `${hi} Content de vous retrouver ; en quoi puis-je vous aider ?`] : [`${hi} Que puis-je faire pour vous aujourd'hui ?`, `${hi} Je vous \xE9coute : qu'est-ce qu'il vous faut ?`, `${hi} En quoi puis-je vous aider ?`]);
      else if (!/^(bonjour|bonsoir|hello|salut)/i.test(reply))
        reply = `${hi} ${reply}`;
    }
    for (let i = 0; i < 8 && softDup2(reply, lastBot); i++)
      reply = netReply({ lang, ev, pctx, meta, first });
    if (softDup2(reply, lastBot))
      reply = netReply({ lang, ev: /* @__PURE__ */ new Set(), pctx: { ...pctx, product: null, suggest: [] }, meta: { ...meta, stage: "collecting" }, first: false, alt: true });
    delete meta._lastUser;
    model = null;
    provider = "filet";
    guard = guard || "filet_ia_less";
  }
  let promiseHit = false;
  {
    const pg = guardPromises(reply);
    if (pg.hit) {
      console.log("reply_promise_blocked", JSON.stringify(String(reply).slice(0, 180)));
      reply = pg.text;
      guard = guard || "promesse_retiree";
      promiseHit = true;
      ev.add("promise");
    }
  }
  const out = {
    reply,
    model,
    provider,
    guarded: !!guard,
    guard_reason: guard,
    error: aiFailed ? errors.slice(-3).join(" | ") || "ai_all_failed" : null,
    events: [...ev],
    lang,
    price_ctx: pctx.product || null,
    catalog_version: cat && cat.version || null,
    prefs
  };
  if (opts.site)
    out.suggest = [...pctx.suggest || [], ...ment || []].slice(0, 6).map((e) => ({ name: e.name, storage: e.storage || null, ram: e.ram || null, cond: e.cond || null, note: e.note || "", price: Number(e.price) || 0, label: entryLabel(e) }));
  let stage = meta.stage === "new" ? "greeting" : meta.stage;
  const rk = /* @__PURE__ */ __name2((x) => stageRank[x] || 0, "rk");
  if (ev.has("capture"))
    stage = "done";
  else if (ev.has("paid"))
    stage = "wait_proof";
  else if (ev.has("cod") && !(pctx.product && pctx.product.digital) && !meta.digital)
    stage = "cod";
  else if (ev.has("ready"))
    stage = rk(stage) >= 4 ? stage : "wait_pay";
  else if (rk(stage) < 4) {
    if ((ev.has("nego") || /^(ok|oui|d'?accord|dac|okay|ça marche|ca marche|je vois|super|parfait)\b/i.test(joined.trim())) && (meta.price || pctx.product) && rk(stage) >= 2)
      stage = "wait_commit";
    else if (pctx.product && mentionsAmount(reply, pctx.product.price))
      stage = "priced";
    else if (rk(stage) < 1 && !first)
      stage = "collecting";
    else if (rk(stage) < 1 && (pctx.lines.length || ev.has("trade") || ev.has("visit")))
      stage = "collecting";
  }
  out.stage = stage;
  if (pctx.product && (mentionsAmount(reply, pctx.product.price) || meta.product === pctx.product.label)) {
    out.product = pctx.product.label;
    out.price = pctx.product.price;
    out.digital = !!pctx.product.digital;
  }
  if (out.product)
    out.price_given = `environ ${fmtF2(out.price)} FCFA`;
  if (pctx.nego && reply && provider !== "filet") {
    const c = Math.min(NEGO_MAX_F, Math.max(pctx.nego.conceded, concessionIn(reply, pctx.nego)));
    if (c > pctx.nego.conceded)
      out.nego = { product: String(pctx.nego.product).slice(0, 60), price: pctx.nego.price, conceded: c, steps: pctx.nego.steps + 1 };
  }
  out.flag = ["ready", "cod", "paid", "capture", "trade", "visit", "conflict", "wrong_number", "human", "promise"].some((k) => ev.has(k)) || ev.has("photo") && !opts.photoSent || aiFailed;
  out.reason = ev.has("capture") || ev.has("paid") ? "paiement_a_verifier" : ev.has("cod") ? "pret_livraison_cash" : ev.has("ready") ? "pret_a_payer" : ev.has("trade") ? "troc" : ev.has("visit") ? "boutique" : ev.has("human") ? "humain" : ev.has("conflict") ? "conflit" : ev.has("photo") ? "photo" : aiFailed ? "ia_ko" : promiseHit ? "livraison_a_confirmer" : "";
  return out;
}
__name(generateReply, "generateReply");
__name2(generateReply, "generateReply");
__name22(generateReply, "generateReply");
async function sendText(env, phoneId, to, text) {
  phoneId = await lineRoute(env, phoneId, to);
  const r = await fetch(`${graphBase(env)}/${phoneId}/messages`, {
    method: "POST",
    headers: { Authorization: `Bearer ${env.WA_TOKEN}`, "Content-Type": "application/json" },
    body: JSON.stringify({ messaging_product: "whatsapp", to, type: "text", text: { body: text } })
  });
  const out = { status: r.status, body: await r.text() };
  await rememberOwnerMsg(to, text, out, env);
  await logOut(env, to, "text", text, out);
  return out;
}
__name(sendText, "sendText");
__name2(sendText, "sendText");
__name22(sendText, "sendText");
async function rememberOwnerMsg(to, text, res, env) {
  try {
    if (String(to) !== OWNER_NOTIFY_WA || !res || res.status >= 300)
      return;
    const m = String(text || "").match(/r[ée]ponds au (\d{8,15})/i);
    if (!m)
      return;
    const allW = new Set([...String(text || "").matchAll(/r[ée]ponds au (\d{8,15})/gi)].map((x) => x[1]));
    if (allW.size > 1 || /^\s*(?:\u2753|\u26A0|\u2705)/u.test(String(text || "")))
      return;
    const id = JSON.parse(res.body || "{}").messages?.[0]?.id;
    if (!id)
      return;
    await caches.default.put(new Request(`https://eh.cache/ownermap/${encodeURIComponent(id)}`), new Response(m[1], { headers: { "Cache-Control": "max-age=604800" } }));
    const st = env && convStub(env, "ownermap");
    if (st) {
      const now = Math.floor(Date.now() / 1e3);
      await st.fetch(`https://conv.do/kv?k=${encodeURIComponent("m:" + id)}`, { method: "PUT", body: JSON.stringify({ wa: m[1], at: now }) });
      await st.fetch("https://conv.do/kv?k=recent", { method: "POST", body: JSON.stringify({ wa: m[1], at: now, id, photo: /Photo produit demand/i.test(String(text || "")) }) });
    }
  } catch (err) {
    console.error("ownermap soft-fail", err && err.message || err);
  }
}
__name(rememberOwnerMsg, "rememberOwnerMsg");
__name2(rememberOwnerMsg, "rememberOwnerMsg");
__name22(rememberOwnerMsg, "rememberOwnerMsg");
async function ownerMapLookup(id, env) {
  try {
    const r = await caches.default.match(new Request(`https://eh.cache/ownermap/${encodeURIComponent(id)}`));
    if (r) {
      const t = (await r.text()).trim();
      if (t)
        return t;
    }
  } catch {
  }
  try {
    const st = env && convStub(env, "ownermap");
    if (!st)
      return null;
    const r = await st.fetch(`https://conv.do/kv?k=${encodeURIComponent("m:" + id)}`);
    if (!r.ok)
      return null;
    const j = await r.json();
    return j && j.wa ? String(j.wa) : null;
  } catch {
    return null;
  }
}
__name(ownerMapLookup, "ownerMapLookup");
__name2(ownerMapLookup, "ownerMapLookup");
__name22(ownerMapLookup, "ownerMapLookup");
async function ownerAlertsRecent(env, now, maxAge) {
  try {
    const st = env && convStub(env, "ownermap");
    if (!st)
      return [];
    const r = await st.fetch("https://conv.do/kv?k=recent");
    if (!r.ok)
      return [];
    const j = await r.json();
    return Array.isArray(j) ? j.filter((x) => x && x.wa && now - Number(x.at) <= maxAge) : [];
  } catch {
    return [];
  }
}
__name(ownerAlertsRecent, "ownerAlertsRecent");
__name2(ownerAlertsRecent, "ownerAlertsRecent");
__name22(ownerAlertsRecent, "ownerAlertsRecent");
function graphErrText(res) {
  try {
    const er = JSON.parse(res.body || "{}").error || {};
    const code = er.code || er.error_data && er.error_data.code;
    if (code === 131047 || /24|re-engage/i.test(String(er.message || "")))
      return "hors fen\xEAtre 24 h (le client doit r\xE9\xE9crire d'abord)";
    return `${er.message || "erreur Graph"}${code ? ` (code ${code})` : ""}`.slice(0, 160);
  } catch {
    return "erreur inconnue";
  }
}
__name(graphErrText, "graphErrText");
__name2(graphErrText, "graphErrText");
__name22(graphErrText, "graphErrText");
async function sendImage(env, phoneId, to, link, caption) {
  phoneId = await lineRoute(env, phoneId, to);
  const r = await fetch(`${graphBase(env)}/${phoneId}/messages`, {
    method: "POST",
    headers: { Authorization: `Bearer ${env.WA_TOKEN}`, "Content-Type": "application/json" },
    body: JSON.stringify({ messaging_product: "whatsapp", to, type: "image", image: { link, caption: String(caption || "").slice(0, 1e3) } })
  });
  const out = { status: r.status, body: await r.text() };
  await logOut(env, to, "image", caption || "", out);
  return out;
}
__name(sendImage, "sendImage");
__name2(sendImage, "sendImage");
__name22(sendImage, "sendImage");
var TEST_WAS = /* @__PURE__ */ new Set(["999000000001"]);
function isTestWa(wa) {
  return TEST_WAS.has(String(wa || ""));
}
__name(isTestWa, "isTestWa");
var EVLOG_NAME = "__evlog_v1";
var OWNER_ST_NAME = "__owner_v1";
async function logEvent(env, ev) {
  try {
    const st = convStub(env, EVLOG_NAME);
    if (!st)
      return;
    const at = Date.now();
    const arr = (Array.isArray(ev) ? ev : [ev]).filter(Boolean).map((x) => ({ at, ...x, ...x.text != null ? { text: String(x.text).slice(0, 400) } : {} }));
    if (!arr.length)
      return;
    await st.fetch("https://conv.do/log", { method: "POST", body: JSON.stringify(arr) });
  } catch (err) {
    console.error("logEvent soft-fail", err && err.message || err);
  }
}
__name(logEvent, "logEvent");
async function evlogRead(env, limit = 200, wa = "") {
  try {
    const st = convStub(env, EVLOG_NAME);
    if (!st)
      return [];
    const r = await st.fetch(`https://conv.do/log?limit=${Number(limit) || 200}${wa ? `&wa=${encodeURIComponent(wa)}` : ""}`);
    if (!r.ok)
      return [];
    const j = await r.json();
    return Array.isArray(j) ? j : [];
  } catch {
    return [];
  }
}
__name(evlogRead, "evlogRead");
function wamidOf(res) {
  try {
    return JSON.parse(res.body || "{}").messages?.[0]?.id || null;
  } catch {
    return null;
  }
}
__name(wamidOf, "wamidOf");
async function logOut(env, to, type, text, res) {
  let err = null;
  if (res && res.status >= 300) {
    try {
      const er = JSON.parse(res.body || "{}").error || {};
      err = `${er.code || ""} ${er.message || ""}`.trim().slice(0, 200);
    } catch {
      err = String(res.body || "").slice(0, 200);
    }
  }
  await logEvent(env, { k: "out", to: String(to), type, text: text == null ? "" : String(text), status: res ? res.status : 0, wamid: res ? wamidOf(res) : null, ...err ? { err } : {} });
}
__name(logOut, "logOut");
async function ownerDo(env, path, method = "GET", body = void 0) {
  try {
    const st = convStub(env, OWNER_ST_NAME);
    if (!st)
      return null;
    const r = await st.fetch(`https://conv.do${path}`, { method, ...body !== void 0 ? { body: JSON.stringify(body) } : {} });
    if (!r.ok)
      return null;
    const txt = await r.text();
    try {
      return JSON.parse(txt);
    } catch {
      return txt;
    }
  } catch (err) {
    console.error("ownerDo soft-fail", path, err && err.message || err);
    return null;
  }
}
__name(ownerDo, "ownerDo");
async function ownerInTs(env) {
  let v = Number(await ownerDo(env, "/kv?k=owner_in")) || 0;
  if (!v) {
    try {
      const w = await cacheGetJSON(OWNER_WINDOW_URL, null);
      if (w && w.seen)
        v = Number(w.seen) || 0;
    } catch {
    }
    try {
      const { hist } = await convLoad(env, OWNER_NOTIFY_WA);
      v = Math.max(v, hist.filter((h) => h.role === "user").reduce((m, h) => Math.max(m, Number(h.ts) || 0), 0));
    } catch {
    }
    if (v)
      await ownerDo(env, "/kv?k=owner_in", "PUT", v);
  }
  return v;
}
__name(ownerInTs, "ownerInTs");
async function ownerWindowState(env, now = Math.floor(Date.now() / 1e3)) {
  const inTs = await ownerInTs(env);
  const closed = Number(await ownerDo(env, "/kv?k=owner_closed")) || 0;
  const open = !!inTs && now - inTs < 24 * 3600 - 600 && !(closed && closed >= inTs);
  return { open, owner_last_message: inTs, closed_by_failure_at: closed, left_s: inTs ? Math.max(0, inTs + 24 * 3600 - now) : 0 };
}
__name(ownerWindowState, "ownerWindowState");
async function ownerQueuePush(env, item) {
  return ownerDo(env, "/q/push", "POST", item);
}
__name(ownerQueuePush, "ownerQueuePush");
async function ownerQueueGet(env) {
  const q = await ownerDo(env, "/q");
  return Array.isArray(q) ? q : [];
}
__name(ownerQueueGet, "ownerQueueGet");
async function ownerNotify(env, body, o = {}) {
  return hubNotify(env, ehxDeps(), body, o);
}
__name(ownerNotify, "ownerNotify");
async function ownerNotifyRaw(env, body, o = {}) {
  const wa = o.wa ? String(o.wa) : "";
  const kind = String(o.kind || "alerte");
  const now = Math.floor(Date.now() / 1e3);
  const item = { wa, kind, name: o.name || null, body: String(body || "").slice(0, 900), at: now };
  if (wa && isTestWa(wa)) {
    await logEvent(env, { k: "owner_alert_test_suppressed", wa, kind, text: body });
    return { suppressed: "test" };
  }
  const st = await ownerWindowState(env, now);
  if (!st.open) {
    if (o.queue === false) {
      await logEvent(env, { k: "owner_ping_dropped_window", wa, kind, text: body });
      return { dropped: "window_closed" };
    }
    await ownerQueuePush(env, item);
    await logEvent(env, { k: "owner_alert_queued", wa, kind, text: body });
    return { queued: true };
  }
  let res;
  try {
    res = await sendText(env, OWNER_PHONE_DEFAULT, OWNER_NOTIFY_WA, body);
  } catch (err) {
    res = { status: 599, body: String(err && err.message || err) };
  }
  if (res.status >= 300) {
    if (o.queue !== false)
      await ownerQueuePush(env, item);
    return { queued: o.queue !== false, status: res.status };
  }
  const id = wamidOf(res);
  if (id && o.queue !== false)
    await ownerDo(env, "/sent", "POST", { id, item });
  return { sent: true, id };
}
__name(ownerNotifyRaw, "ownerNotifyRaw");
function digestItem(x, i) {
  const lines = String(x.body || "").split("\n").filter((l) => l.trim() && !/^\u{1F916}/u.test(l) && !/^\u21AA/.test(l));
  const when = new Date((Number(x.at) + 3600) * 1e3).toISOString().slice(5, 16).replace("T", " ").replace(/^(\d\d)-(\d\d)/, "$2/$1");
  return `${i + 1}. [${when}]${x.count > 1 ? ` (x${x.count})` : ""} ${lines.join("\n   ").slice(0, 420)}${x.wa ? `
   \u21AA\uFE0F r\xE9ponds au ${x.wa} : \u2026` : ""}`;
}
__name(digestItem, "digestItem");
async function ownerFlushQueue(env, phoneId, why = "owner_msg") {
  const q = await ownerDo(env, "/q/take", "POST", {});
  if (!Array.isArray(q) || !q.length)
    return 0;
  const head = `\u{1F4CB} ${q.length} alerte(s) en attente (re\xE7ues pendant la nuit ou quand la fen\xEAtre WhatsApp 24 h \xE9tait ferm\xE9e) :`;
  const foot = "Pour r\xE9pondre : \xAB r\xE9ponds au <num\xE9ro> : votre texte \xBB (si le client a \xE9crit il y a moins de 24 h ; sinon mod\xE8le via l'inbox).";
  const chunks = [];
  let cur = head, curItems = [];
  q.forEach((x, i) => {
    const t = digestItem(x, i);
    if ((cur + "\n\n" + t).length > 3500 && curItems.length) {
      chunks.push({ text: cur, items: curItems });
      cur = "(suite)";
      curItems = [];
    }
    cur += "\n\n" + t;
    curItems.push(x);
  });
  cur += "\n\n" + foot;
  chunks.push({ text: cur, items: curItems });
  let sent = 0;
  for (let c = 0; c < chunks.length; c++) {
    const res = await sendText(env, phoneId || OWNER_PHONE_DEFAULT, OWNER_NOTIFY_WA, chunks[c].text);
    if (res.status >= 300) {
      const rest = chunks.slice(c).flatMap((x) => x.items);
      await ownerDo(env, "/q/restore", "POST", rest);
      break;
    }
    sent += chunks[c].items.length;
  }
  await logEvent(env, { k: "owner_digest", why, text: `${sent}/${q.length} alertes livr\xE9es` });
  return sent;
}
__name(ownerFlushQueue, "ownerFlushQueue");
async function ownerMaybeFlush(env) {
  try {
    if (await hubQuietNow(env, ehxDeps()))
      return 0;
  } catch {
  }
  const q = await ownerQueueGet(env);
  if (!q.length)
    return 0;
  const st = await ownerWindowState(env);
  if (!st.open)
    return 0;
  return ownerFlushQueue(env, OWNER_PHONE_DEFAULT, "cron");
}
__name(ownerMaybeFlush, "ownerMaybeFlush");
var PAY_TXT = "Merci ! Un conseiller v\xE9rifie et vous r\xE9pond tr\xE8s vite.";
var PAY_WORD_RE = /(?<![\p{L}])(pay[ée]e?s?|paie|paye|pai?ement|pay[ée]r|r[ée]gl[ée]e?|transf[ée]r[ée]e?|transf[ée]rer|transfert|virement|d[ée]p[oô]t|momo|mobile\s*money|moov\s*money|mtn\s*money|flooz|celtiis|wave|capture|screenshot|re[çc]u\s+de\s+paiement|preuve\s+de\s+paiement|l['’]argent|les\s+sous|paid|payment|transfer)(?![\p{L}])/iu;
var PAY_HOWTO_RE = /((comment|quel(?:le)?|o[uù]|c['’]?est\s+quoi|donne[zr]?|envoie[zr]?|envoyez|vous\s+acceptez|accept[ée]z|possible|je\s+peux|on\s+peut|how|which|what|can\s+i)[^.!?\n]{0,50}(pay|pai|r[èe]gl|momo|mobile\s*money|num[ée]ro|transf))|\?\s*$/i;
function paymentKind({ texts, type, meta, lastBot, history, ev }) {
  if (ev.has("capture"))
    return "capture";
  if (ev.has("paid"))
    return "paid";
  const t = (texts || []).filter((x) => !/^\[(image|audio|voice|video|document|sticker)\]\s*$/i.test(String(x))).join("\n");
  if (t && PAY_WORD_RE.test(t) && !PAY_HOWTO_RE.test(t) && !COD_RE.test(t))
    return "paid";
  if (type === "image") {
    const recent = (history || []).slice(-12).map((h) => String(h.text || "")).join(" \n ");
    const orderCtx = !!(meta.product || meta.price) || ["priced", "wait_commit", "wait_pay", "wait_proof", "cod", "done"].includes(meta.stage) || /01\s?97\s?34\s?21\s?01|momo|mobile\s*money|commande|livraison/i.test(String(lastBot || "")) || /momo|commande|je\s+prends|je\s+valide|livraison|pay|pai/i.test(recent);
    if (orderCtx)
      return "capture";
  }
  return null;
}
__name(paymentKind, "paymentKind");
var PROMISE_STRONG_TIME_RE = /(\b\d{1,2}\s?(?:h|heures?)(?:\s?\d{2})?\b(?!\s*\/\s*24)(?!\s*sur\s*24)|\b\d{1,2}\s?(?:am|pm)\b|\bdemain\b|\bapr[èe]s[- ]demain\b|\b(?:lundi|mardi|mercredi|jeudi|vendredi|samedi|dimanche)\b|\bdans\s+(?:la\s+)?(?:journ[ée]e|matin[ée]e|soir[ée]e|\d+\s*(?:min\w*|h\b|heures?|jours?))|\bsous\s+\d+\s*(?:h\b|heures?|jours?)|\bd['’]ici\s+(?:ce\s+soir|demain|\d+|la\s+fin)|\btomorrow\b|\bwithin\s+\d+|\b(?!24\s?\/\s?24\b)(?!7\s?\/\s?7\b)\d{1,2}\s?\/\s?\d{1,2}\b)/i;
var PROMISE_TIME_RE = /(\baujourd['’]?\s?hui\b|\bce\s+(?:soir|matin|midi|week-?end)\b|\bcet\s+apr[èe]s[- ]midi\b|\btout\s+de\s+suite\b|\bimm[ée]diatement\b|\bd[èe]s\s+(?:ce\s+soir|que)\b|\bmatin\b|\bsoir\b|\bmidi\b|\btoday\b|\btonight\b|\bt[ôo]t\b)/i;
var PROMISE_ACT_RE = /(livr|exp[ée]di|envoi|envoy|pr[ée]par|d[ée]part|achemin|arriv|re[çc]ev|r[ée]ception|r[ée]cup[ée]r|passer|passage|pr[ée]vo|planifi|programm|rendez[- ]vous|\brdv\b|vous\s+attend|\bboutique\b|deliver|ship|dispatch|pick\s?up|\bnote[rz]?\b|\bnot[ée]e?s?(?![a-zà-ÿ])|confirm)/i;
var PROMISE_HARD_RE = /(r[ée]serv[ée]e?s?(?![\p{L}])|mis\s+de\s+c[ôo]t[ée]|gard[ée]e?\s+pour\s+vous|bloqu[ée]e?\s+pour\s+vous|paiement\s+(?:est\s+)?(?:bien\s+)?(?:re[çc]u|confirm[ée]|valid[ée]|en\s+cours\s+de\s+validation|en\s+cours\s+de\s+v[ée]rification)|(?:avons|ai|a)\s+bien\s+re[çc]u\s+(?:votre\s+|le\s+|l['’])?(?:paiement|argent|transfert|virement|d[ée]p[oô]t|momo|capture)|(?:paiement|transfert|argent|virement)\s+(?:a\s+)?(?:bien\s+)?(?:[ée]t[ée]\s+)?re[çc]u|payment\s+(?:is\s+|was\s+|has\s+been\s+)?(?:received|confirmed)|commande\s+(?:est\s+)?(?:confirm[ée]e|valid[ée]e)|je\s+(?:vous\s+)?(?:envoie|transmets|donne|communique)\s+(?:l['’]adresse|les\s+(?:d[ée]tails|coordonn[ée]es)|la\s+localisation))/iu;
function guardPromises(text) {
  const t = String(text || "");
  if (!t)
    return { text: t, hit: false };
  const parts = t.split(/(?<=[.!?\u2026])\s+|\n+/);
  const kept = [];
  let hit = false;
  for (const p of parts) {
    const bad = PROMISE_HARD_RE.test(p) || PROMISE_STRONG_TIME_RE.test(p) || PROMISE_TIME_RE.test(p) && PROMISE_ACT_RE.test(p);
    if (bad)
      hit = true;
    else if (p.trim())
      kept.push(p.trim());
  }
  if (!hit)
    return { text: t, hit: false };
  let out = kept.join(" ").replace(/\s{2,}/g, " ").trim();
  if (out.replace(/[^\p{L}]/gu, "").length < 12)
    out = "Merci ! Un conseiller vous confirme les d\xE9tails (livraison, rendez-vous) tr\xE8s vite.";
  else if (!/conseiller|l['’][ée]quipe/i.test(out))
    out += " Un conseiller vous confirme le jour et l'heure tr\xE8s vite.";
  return { text: out, hit: true };
}
__name(guardPromises, "guardPromises");
async function sweepOrphans(env) {
  const evs = await evlogRead(env, 800);
  if (!evs.length)
    return 0;
  const now = Date.now();
  const lastOk = /* @__PURE__ */ new Map();
  for (const x of evs) {
    const wa = x.k === "out" ? x.to : x.wa || x.from;
    if (!wa)
      continue;
    if (x.k === "out" && x.status < 300 || x.k === "flag" || x.k === "handled" || x.k === "orphan" || x.k === "pgc_silent")
      lastOk.set(wa, Math.max(lastOk.get(wa) || 0, Number(x.at) || 0));
  }
  const done = /* @__PURE__ */ new Set();
  const seenId = /* @__PURE__ */ new Set();
  const minAgeMs = (Number(env.ORPHAN_MIN_AGE_S) || 360) * 1e3;
  let n = 0;
  for (const x of evs) {
    if (x.k !== "in" || !x.from)
      continue;
    if (x.id && seenId.has(x.id))
      continue;
    if (x.id)
      seenId.add(x.id);
    if (OWNER_WAS.has(x.from) || done.has(x.from) || /^999\d{9}$/.test(String(x.from)))
      continue;
    const age = now - (Number(x.at) || 0);
    if (age < minAgeMs || age > 20 * 3600 * 1e3)
      continue;
    if ((lastOk.get(x.from) || 0) >= Number(x.at))
      continue;
    done.add(x.from);
    n++;
    await logEvent(env, { k: "orphan", wa: x.from, id: x.id });
    await flagConv(env, { from: x.from, name: x.name, text: x.text, id: x.id, type: x.type }, { reason: "sans_reponse" }, Math.floor(now / 1e3));
    await ownerNotify(env, `\u26A0\uFE0F Message client rest\xE9 sans r\xE9ponse du bot
\u{1F464} ${x.name || "?"} (${x.from})
\u{1F4AC} ${String(x.text || `[${x.type || "msg"}]`).replace(/\s+/g, " ").slice(0, 200)}
\u21AA\uFE0F r\xE9ponds au ${x.from} : \u2026`, { wa: x.from, kind: "sans_reponse", name: x.name });
  }
  return n;
}
__name(sweepOrphans, "sweepOrphans");
async function alertOwner(env, e, meta, evs, g, now) {
  const keys = evs.filter((k) => ALERT_LABELS[k]);
  if (!keys.length)
    return [];
  const fresh = keys.filter((k) => now - Number((meta.alerts || {})[k] || 0) >= ALERT_GAP_S);
  if (!fresh.length)
    return [];
  meta.alerts = { ...meta.alerts || {} };
  for (const k of fresh)
    meta.alerts[k] = now;
  const phoneId = e.phone_number_id || OWNER_PHONE_DEFAULT;
  const name = e.name || e.from;
  const extra = alertExtras(fresh, e.text, e.from);
  if (e.mediaNote && !fresh.includes("media_nf"))
    extra.push("\u{1F4CE} M\xE9dia non transf\xE9r\xE9 au 97 \u2014 visible dans l'APK (EH Bo\xEEte)");
  const body = `${fresh.map((k) => ALERT_LABELS[k]).join("\n")}
\u{1F464} ${name} (${e.from})${extra.length ? "\n" + extra.join("\n") : ""}${g.product || meta.product ? `
\u{1F4E6} ${g.product || meta.product}${g.price || meta.price ? ` ~${fmtF2(g.price || meta.price)} F` : ""}` : ""}
\u{1F4AC} ${String(e.text || "").replace(/\s+/g, " ").slice(0, 300)}
\u{1F916} ${String(g.reply || "").replace(/\s+/g, " ").slice(0, 200)}
\u21AA\uFE0F r\xE9ponds au ${e.from} : \u2026`;
  try {
    await ownerNotify(env, body, { phoneId, wa: e.from, kind: fresh.join(","), name: e.name || null });
  } catch (err) {
    console.error("alertOwner soft-fail", err && err.message || err);
  }
  return fresh;
}
__name(alertOwner, "alertOwner");
__name2(alertOwner, "alertOwner");
__name22(alertOwner, "alertOwner");
async function mirrorOwnerInbound(env, e) {
  if (!e || !e.from || OWNER_WAS.has(e.from) || !env.WA_TOKEN)
    return;
  let mode = "key";
  try {
    mode = await env.EH_KV.get("cfg:owner_mirror") ?? "key";
  } catch {
  }
  const kvDead = globalThis.__ehKvDegraded === true && Date.now() - Number(globalThis.__ehKvDegradedAt || 0) < 15 * 60 * 1e3;
  if (!(kvDead || mode === "force"))
    return;
  const id = String(e.id || `${e.from}:${e.text || e.type}`);
  const t = Date.now();
  for (const [k, ts] of MIRROR_SEEN)
    if (t - ts > 10 * 60 * 1e3)
      MIRROR_SEEN.delete(k);
  if (MIRROR_SEEN.has(id))
    return;
  MIRROR_SEEN.set(id, t);
  try {
    const msg = `\u{1F4E9} Message client${globalThis.__ehKvDegraded ? " (\u26A0\uFE0F m\xE9moire CF satur\xE9e)" : ""}
\u{1F464} ${e.name || e.from} (${e.from})
\u{1F4AC} ${String(e.text || `[${e.type}]`).replace(/\s+/g, " ").slice(0, 400)}
\u21AA\uFE0F r\xE9ponds au ${e.from} : \u2026`;
    await ownerNotify(env, msg, { phoneId: e.phone_number_id, wa: e.from, kind: "miroir", queue: false });
  } catch (err) {
    console.error("mirrorOwnerInbound soft-fail", err && err.message || err);
  }
}
__name(mirrorOwnerInbound, "mirrorOwnerInbound");
__name2(mirrorOwnerInbound, "mirrorOwnerInbound");
__name22(mirrorOwnerInbound, "mirrorOwnerInbound");
var INBOUND_SEEN = globalThis.__ehInboundSeen || (globalThis.__ehInboundSeen = /* @__PURE__ */ new Map());
var PROCESSING2 = globalThis.__ehProcessing2 || (globalThis.__ehProcessing2 = /* @__PURE__ */ new Set());
function summarize(body) {
  const out = [];
  for (const entry of body.entry || [])
    for (const ch of entry.changes || []) {
      const v = ch.value || {};
      if (ch.field === "history" || ch.field === "smb_app_state_sync" || ch.field === "account_update") {
        out.push({ kind: "other", field: ch.field, event: v && v.event || null, phone: v && v.phone_number || null, phone_number_id: v && v.metadata && v.metadata.phone_number_id || null });
        continue;
      }
      const contacts = Object.fromEntries((v.contacts || []).map((c) => [c.wa_id, c.profile && c.profile.name]));
      for (const m of v.messages || []) {
        const media = m.audio || m.voice || m.image || m.video || m.document || m.sticker || null;
        out.push({
          kind: "message",
          from: m.from,
          name: contacts[m.from] || null,
          id: m.id,
          ts: m.timestamp,
          type: m.type,
          text: m.text && m.text.body || m.button && m.button.text || m.interactive && (m.interactive.button_reply && m.interactive.button_reply.title || m.interactive.list_reply && m.interactive.list_reply.title || JSON.stringify(m.interactive)) || null,
          caption: media && media.caption || null,
          media_id: media && media.id || null,
          mime: media && media.mime_type || null,
          filename: media && media.filename || null,
          context_id: m.context && m.context.id || null,
          forwarded: !!(m.context && (m.context.forwarded || m.context.frequently_forwarded)),
          phone_number_id: v.metadata && v.metadata.phone_number_id
        });
      }
      for (const s of v.statuses || [])
        out.push({ kind: "status", id: s.id, status: s.status, recipient: s.recipient_id, ts: s.timestamp, errors: s.errors || null, phone_number_id: v.metadata && v.metadata.phone_number_id });
      for (const m of v.message_echoes || [])
        out.push({ kind: "echo", from: m.from, to: m.to, id: m.id, ts: m.timestamp, type: m.type, phone_number_id: v.metadata && v.metadata.phone_number_id });
      if (!(v.messages || v.statuses || v.message_echoes))
        out.push({ kind: "other", field: ch.field });
    }
  return out;
}
__name(summarize, "summarize");
__name2(summarize, "summarize");
__name22(summarize, "summarize");
async function handle(env, body, deps = {}) {
  const now = Math.floor(Date.now() / 1e3);
  const toProcess = /* @__PURE__ */ new Map();
  const side = [];
  const evs0 = await __dedupIn(summarize(body));
  try {
    const fl = [];
    for (const en of body.entry || [])
      for (const ch of en.changes || [])
        fl.push(`${ch.field}@${ch.value && ch.value.metadata && ch.value.metadata.phone_number_id || en.id || "?"}`);
    if (fl.length)
      console.log("wh_fields", fl.join(","));
  } catch {
  }
  try {
    await logEvent(env, evs0.filter((e) => e.kind === "message" || e.kind === "status" && e.status === "failed").map((e) => e.kind === "message" ? { k: "in", from: e.from, name: e.name, id: e.id, type: e.type, text: e.text || (e.caption ? `[${e.type}] ${e.caption}` : `[${e.type}]`), media_id: e.media_id || null, ctx: e.context_id || null } : { k: "status_failed", to: e.recipient, id: e.id, text: JSON.stringify(e.errors || []).slice(0, 200) }));
  } catch {
  }
  for (const e of evs0) {
    if (e.kind === "status" && e.status === "failed" && !OWNER_WAS.has(String(e.recipient || "")) && (e.errors || []).some((x) => Number(x && x.code) === 131031)) {
      side.push((async () => {
        if (await globalCooldown("wa_locked", 3 * 3600))
          await ownerNotify(env, `\u26D4 Meta bloque l'envoi sur la ligne ${e.phone_number_id && lineNum(await linesCfg(env), e.phone_number_id) === 2 ? "2 (53)" : "WhatsApp"} : \xAB Business account locked \xBB (code 131031). Les r\xE9ponses du bot n'arrivent pas aux clients. R\xE9ponds depuis l'app WhatsApp Business du t\xE9l\xE9phone en attendant, et ajoute un moyen de paiement valide au compte WhatsApp de la ligne 2 (WhatsApp Manager > Facturation).`, { kind: "wa_locked" });
      })().catch(() => {
      }));
      continue;
    }
    if (e.kind === "status" && e.status === "failed" && OWNER_WAS.has(String(e.recipient || ""))) {
      side.push(ownerSendFailed(env, e).catch(() => {
      }));
      continue;
    }
    if (e.kind === "other" && e.field === "account_update" && e.event) {
      side.push((async () => {
        await logEvent(env, { k: "account_update", text: `${e.event} ${e.phone || ""}` });
        if (/PARTNER_REMOVED|ACCOUNT_OFFBOARDED|ACCOUNT_RECONNECTED/.test(String(e.event)))
          await ownerNotify(env, `\u26A0\uFE0F Ligne WhatsApp ${e.phone || ""} : ${e.event} (coexistence). V\xE9rifier /connect-ligne2/status.`, { kind: "account_update" });
      })().catch(() => {
      }));
      continue;
    }
    if (e.kind === "echo") {
      if (await __isBotEcho(e.id)) { console.log("echo_self_skip", String(e.to)); continue; }
      try {
        const lc = await linesCfg(env);
        if (e.to && lineNum(lc, e.phone_number_id) && !OWNER_WAS.has(String(e.to))) {
          const burst = await echoBurst(env, String(e.to), now);
          if (burst.broadcast) {
            console.log("echo_broadcast_no_pause", String(e.to), burst.n);
            if (burst.n === ECHO_BURST_N) {
              for (const w of burst.recips) {
                try {
                  const p = JSON.parse(await env.EH_KV.get(`pause:${w}`) || "null");
                  if (p && p.mode === "auto" && p.why === "echo")
                    await env.EH_KV.delete(`pause:${w}`);
                } catch {
                }
              }
              await logEvent(env, { k: "owner_broadcast", wa: "", text: `diffusion d\xE9tect\xE9e (${burst.n}+ envois en 2 min) : pas de pause` });
            }
            await lineNote(env, String(e.to), e.phone_number_id);
            continue;
          }
          {
            const p0 = await getPause(env, String(e.to));
            if (!(p0 && !p0.until))
              await putIfChanged(env, `pause:${String(e.to)}`, { mode: "auto", until: now + AUTO_PAUSE_S2, at: now, why: "echo" }, AUTO_PAUSE_S2);
          }
          try {
            await pendingSet(String(e.to), []);
          } catch {
          }
          await lineNote(env, String(e.to), e.phone_number_id);
          try {
            if (!await env.EH_KV.get(`welcomed:${String(e.to)}`))
              await env.EH_KV.put(`welcomed:${String(e.to)}`, "echo", { expirationTtl: 400 * DAY });
          } catch {
          }
          await logEvent(env, { k: "owner_echo_pause", wa: String(e.to), text: `ligne ${lineNum(lc, e.phone_number_id)}` });
        }
      } catch (err) {
        console.error("echo soft-fail", err && err.message || err);
      }
      continue;
    }
    if (e.kind !== "message" || !e.from || NEVER_REPLY.has(e.from) || !env.WA_TOKEN)
      continue;
    if (e.phone_number_id && !lineNum(await linesCfg(env), e.phone_number_id)) {
      console.warn("unknown phone_number_id ignored", String(e.phone_number_id));
      continue;
    }
    const t0 = Date.now();
    for (const [k, ts] of INBOUND_SEEN)
      if (t0 - ts > 30 * 60 * 1e3)
        INBOUND_SEEN.delete(k);
    if (INBOUND_SEEN.has(e.id))
      continue;
    INBOUND_SEEN.set(e.id, t0);
    if (OWNER_WAS.has(e.from)) {
      await handleOwner(env, e);
      continue;
    }
    await lineNote(env, e.from, e.phone_number_id);
    await contactEnqueue(env, e.from, e.name, e.phone_number_id);
    if (e.text || e.caption)
      side.push(supInbound(env, ehxDeps(), e).catch(() => {
      }));
    {
      const rawT = e.text || e.caption || "";
      const pgcAt = await pgcGet(env, e.from);
      if (!pgcAt && isPgcText(rawT)) {
        console.log("pgc_flag", e.from);
        try {
          await env.EH_KV.put(`pgc:${e.from}`, String(now), { expirationTtl: 400 * DAY });
          if (e.name)
            await putIfChanged(env, `name:${e.from}`, String(e.name).slice(0, 80), 180 * DAY);
          if (!await env.EH_KV.get(`welcomed:${e.from}`))
            await env.EH_KV.put(`welcomed:${e.from}`, "pgc", { expirationTtl: 400 * DAY });
        } catch {
        }
        await logEvent(env, { k: "pgc", wa: e.from, text: String(rawT).slice(0, 120) });
      }
      if (pgcAt && isPgcAck(rawT)) {
        console.log("pgc_silent", e.from);
        await logEvent(env, { k: "pgc_silent", wa: e.from, text: String(rawT).slice(0, 120) });
        continue;
      }
    }
    const { hist, meta } = await convLoad(env, e.from);
    if (hist.some((h) => h.id && h.id === e.id))
      continue;
    const pend = await pendingGet(e.from);
    if (pend.some((p) => p.id === e.id))
      continue;
    const isText = !!e.text && (e.type === "text" || e.type === "button" || e.type === "interactive");
    let userText = isText ? e.text : `[${e.type}]${e.caption ? " " + e.caption : ""}`;
    if ((e.type === "audio" || e.type === "voice") && e.media_id) {
      const tr = await transcribeVoice(env, e.media_id);
      if (tr) {
        userText = `[vocal] ${tr}`;
        e.transcript = tr;
      }
    }
    e.text = userText;
    const item = { role: "user", text: String(userText).slice(0, 800), ts: now, id: e.id, type: e.type };
    if (e.media_id) {
      item.media_id = String(e.media_id);
      if (e.mime)
        item.mime = String(e.mime).slice(0, 60);
    }
    let ring = [];
    try {
      ring = await waRingRead(e.from);
    } catch {
    }
    const maxTs = /* @__PURE__ */ __name2((arr) => arr.reduce((m, x) => Math.max(m, Number(x && x.ts) || 0), 0), "maxTs");
    const prevUserTs = Math.max(Number(meta.last_user_ts) || 0, maxTs(hist.filter((h) => h.role === "user")), maxTs(ring.filter((x) => x.role === "user" && x.id !== e.id)), maxTs(pend));
    const kind = pingKind(prevUserTs, now);
    await apkFeedPush(env, e);
    side.push(fcmNotifyInbound(env, e).catch(() => {
    }));
    if (kind)
      side.push(maybePing97(env, e, kind, prevUserTs, now).catch(() => {
      }));
    if (e.name)
      await putIfChanged(env, `name:${e.from}`, String(e.name).slice(0, 80), 180 * DAY);
    if (e.media_id && MEDIA_FWD_TYPES.has(e.type)) {
      try {
        const fr = await forwardMediaToOwner(env, e, meta);
        if (fr.ok) {
          item.fwd = 1;
          e.__fwd = true;
        }
      } catch (err) {
        console.error("media_fwd soft-fail", err && err.message || err);
      }
    }
    if (!e.__fwd)
      await mirrorOwnerInbound(env, e);
    let gate = null;
    try {
      const sec = await assistantSecoursGet(env);
      if (sec && sec.on) {
        const h = await buildWhoSpeaksHealth(env, { forceProbe: false });
        if (h.replies_ok)
          await assistantSecoursSet(env, false, "auto_off_cf_healthy_reply");
        else
          gate = { reason: "assistant_secours" };
      }
    } catch (err) {
      console.error("secours gate soft-fail", err);
    }
    if (!gate && (await getPause(env, e.from) || await linePaused(env, e.phone_number_id, e.from)))
      gate = { reason: "bot_en_pause" };
    if (!gate) {
      let aiOff = false;
      try {
        aiOff = await env.EH_KV.get("cfg:ai_enabled") === "0";
      } catch {
      }
      const tooOld = e.ts && now - Number(e.ts) > 23 * 3600;
      if (tooOld)
        gate = { reason: "hors_fenetre_24h", alert: "hors_24h" };
      else if (aiOff)
        gate = { reason: "ia_desactivee" };
    }
    if (gate) {
      const h2 = mergePending(hist, pend).hist;
      h2.push(item);
      meta.last_user_ts = now;
      meta.last_user_id = e.id;
      meta.last_type = e.type;
      if (e.media_id && MEDIA_FWD_TYPES.has(e.type) && !e.__fwd) {
        try {
          await alertOwner(env, { ...e, mediaNote: false }, meta, ["media_nf"], { reply: `(${gate.reason})` }, now);
        } catch {
        }
      }
      if (gate.reason === "bot_en_pause") {
        try {
          const pe = detectEvents({ text: String(e.text || ""), type: e.type || "text", meta, lastBot: meta.last_bot_text || lastAssistText(hist) });
          const pk = ["callback", "ship_far", "paid", "capture"].filter((k) => pe.has(k));
          if (pk.length)
            await alertOwner(env, e, meta, pk, { reply: "(bot en pause \u2014 \xE0 toi de r\xE9pondre)" }, now);
        } catch (err) {
          console.error("pause alert soft-fail", err && err.message || err);
        }
      }
      await convSave(env, e.from, h2, meta);
      await pendingClear(e.from, pend.map((p) => p.id));
      await flagConv(env, e, { reason: gate.reason, product: "" }, now);
      if (gate.alert === "hors_24h")
        side.push(alertOwnerOnce(env, e.from, "hors_24h", `\u23F0 Message hors fen\xEAtre 24 h (pas de r\xE9ponse auto) \xB7 ${e.name || "?"} (${e.from}) : \xAB ${String(e.text || "").replace(/\s+/g, " ").slice(0, 80)} \xBB`, e.phone_number_id));
      continue;
    }
    await pendingAdd(e.from, item);
    toProcess.set(e.from, { id: e.id, e });
  }
  const debounce = deps.debounceMs != null ? deps.debounceMs : DEBOUNCE_MS;
  await Promise.all([...toProcess].map(async ([wa, x]) => {
    if (debounce)
      await sleep(debounce);
    try {
      await processConv(env, wa, { expectId: x.id, e: x.e });
    } catch (err) {
      console.error("processConv crash", wa, err && err.stack || err);
      const n2 = Math.floor(Date.now() / 1e3);
      try {
        await flagConv(env, { from: wa, name: x.e && x.e.name, text: x.e && x.e.text, id: x.id, type: x.e && x.e.type }, { reason: "erreur_bot" }, n2);
        await ownerNotify(env, `\u26A0\uFE0F Erreur du bot \u2014 message client non trait\xE9
\u{1F464} ${x.e && x.e.name || "?"} (${wa})
\u{1F4AC} ${String(x.e && x.e.text || "").replace(/\s+/g, " ").slice(0, 200)}
\u21AA\uFE0F r\xE9ponds au ${wa} : \u2026`, { wa, kind: "erreur_bot", name: x.e && x.e.name });
      } catch {
      }
    }
  }));
  await Promise.all(side);
}
__name(handle, "handle");
__name2(handle, "handle");
__name22(handle, "handle");
var WELCOME_MSG_DEFAULT = "Bienvenue chez Electronic HOUSE \u{1F44B}\n\n\u{1F4F1} T\xE9l\xE9phones neufs et reconditionn\xE9s\n\u{1F4BB} Logiciels & abonnements\n\u{1F4CD} B\xE9nin \xB7 Ouvert 24h/24 \xB7 Livraison partout au B\xE9nin et dans le monde \u{1F1E7}\u{1F1EF}\n\nDis-moi le mod\xE8le ou ce dont tu as besoin, on te r\xE9pond vite \u{1F447}\n\n\u{1F6D2} Nos produits : https://electronichouse.pages.dev\n\u{1F4D8} Facebook : https://www.facebook.com/profile.php?id=61588977842002\n\u{1F4CD} Google (adresse et avis) : https://g.page/r/CaOMH9URkBZiEBM";
async function welcomeText(env) {
  return null; // WA53: no canned welcome
  try {
    const v = await env.EH_KV.get("cfg:welcome_msg");
    if (v != null) {
      const t = String(v).trim();
      if (/^(off|0|false|non)$/i.test(t))
        return null;
      if (t)
        return String(v);
    }
  } catch {
  }
  return WELCOME_MSG_DEFAULT;
}
__name(welcomeText, "welcomeText");
async function welcomeEligible(env, wa, { first, history, meta }) {
  if (!first || !wa || OWNER_WAS.has(String(wa)) || OWNER_DIGITS.includes(String(wa)))
    return false;
  if ((history || []).length)
    return false;
  if ((Number(meta && meta.last_bot_ts) || 0) > 0 || String(meta && meta.last_bot_text || ""))
    return false;
  try {
    if (await env.EH_KV.get(`welcomed:${wa}`))
      return false;
    if (await env.EH_KV.get(`optout:${wa}`))
      return false;
  } catch {
    return false;
  }
  return true;
}
__name(welcomeEligible, "welcomeEligible");
async function processConv(env, wa, { expectId = null, e: e0 = null, source = "webhook" } = {}) {
  if (PROCESSING2.has(wa))
    return { skipped: "processing" };
  PROCESSING2.add(wa);
  try {
    const now = Math.floor(Date.now() / 1e3);
    let { hist, meta } = await convLoad(env, wa);
    const m0 = mergePending(hist, await pendingGet(wa));
    hist = m0.hist;
    const noteUsers = /* @__PURE__ */ __name2((added) => {
      if (!added.length)
        return;
      const la = added[added.length - 1];
      meta.last_user_ts = Math.max(Number(meta.last_user_ts) || 0, Number(la.ts) || 0);
      meta.last_user_id = la.id;
      meta.last_type = la.type;
    }, "noteUsers");
    noteUsers(m0.added);
    let pendIds = m0.added.map((x) => x.id);
    const persist = /* @__PURE__ */ __name2(async () => {
      const ok = await convSave(env, wa, hist, meta);
      await pendingClear(wa, pendIds);
      return ok;
    }, "persist");
    let i = hist.length;
    while (i > 0 && hist[i - 1].role === "user")
      i--;
    const batch = hist.slice(i).filter((h) => now - (Number(h.ts) || 0) <= 23 * 3600).slice(-BATCH_MAX);
    if (!batch.length) {
      if (pendIds.length)
        await persist();
      return { skipped: "already_answered" };
    }
    const lastUser = batch[batch.length - 1];
    if (expectId && lastUser.id && lastUser.id !== expectId)
      return { skipped: "newer_message" };
    if (await getPause(env, wa) || await linePaused(env, e0 && e0.phone_number_id, wa)) {
      try {
        const pe = detectEvents({ text: batch.map((h) => String(h.text || "")).join("\n"), type: lastUser.type || "text", meta, lastBot: meta.last_bot_text || lastAssistText(hist.slice(0, i)) });
        const pk = ["callback", "ship_far", "paid"].filter((k) => pe.has(k));
        if (pk.length) {
          let nm = e0 && e0.name || null;
          if (!nm) {
            try {
              nm = await env.EH_KV.get(`name:${wa}`);
            } catch {
            }
          }
          const sa = await alertOwner(env, { from: wa, name: nm, text: batch.map((h) => String(h.text || "")).join(" / "), phone_number_id: e0 && e0.phone_number_id || OWNER_PHONE_DEFAULT }, meta, pk, { reply: "(bot en pause \u2014 \xE0 toi de r\xE9pondre)" }, now);
          if (sa.length) {
            await persist();
            return { skipped: "pause", alerts: sa };
          }
        }
      } catch (err) {
        console.error("pause alert soft-fail", err && err.message || err);
      }
      if (pendIds.length)
        await persist();
      await flagConv(env, { from: wa, name: e0 && e0.name, text: lastUser.text, id: lastUser.id, type: lastUser.type }, { reason: "bot_en_pause" }, now);
      return { skipped: "pause" };
    }
    const day = watDay(now);
    if (meta.day !== day) {
      meta.day = day;
      meta.day_n = 0;
    }
    if (meta.day_n >= RL_DAY_MAX) {
      await persist();
      await flagConv(env, { from: wa, text: lastUser.text, id: lastUser.id }, { reason: "limite_journaliere" }, now);
      return { skipped: "rate_day" };
    }
    if (OPTOUT_RE.test(String(lastUser.text || ""))) {
      try {
        await env.EH_KV.put(`optout:${wa}`, String(now));
      } catch {
      }
      const ack = await __aiFree(env, SYSTEM_PROMPT, "Le client vient d'\u00e9crire : \u00ab " + String(lastUser.text || "") + " \u00bb. Il ne veut plus recevoir de relances ni d'offres (c'est enregistr\u00e9). \u00c9cris ta bulle WhatsApp pour le lui confirmer bri\u00e8vement, avec tes mots.");
      if (!ack) return { sent: false, skipped: "ai_retry" };
      const r = await sendText(env, e0 && e0.phone_number_id || OWNER_PHONE_DEFAULT, wa, ack);
      if (r.status < 300) {
        hist.push({ role: "assistant", text: ack, ts: now, id: `asst:${lastUser.id || now}` });
        meta.last_bot_text = ack;
        meta.last_bot_ts = now;
      }
      await persist();
      return { skipped: "optout" };
    }
    const history = hist.slice(0, i);
    const texts = batch.map((h) => String(h.text || ""));
    const type = batch.some((h) => h.type === "image") ? "image" : lastUser.type || "text";
    const e = { from: wa, name: e0 && e0.name || null, id: lastUser.id, type, text: texts.join(" / "), phone_number_id: e0 && e0.phone_number_id || OWNER_PHONE_DEFAULT };
    if (!e.name) {
      try {
        e.name = await env.EH_KV.get(`name:${wa}`);
      } catch {
      }
    }
    const transcript = e0 && e0.transcript || null;
    const voiceNoTr = batch.some((h) => /^\[(audio|voice)\]/.test(String(h.text)));
    const lastBot = meta.last_bot_text || lastAssistText(history);
    const ev = detectEvents({ text: texts.join("\n"), type: voiceNoTr ? "audio" : type, meta, lastBot });
    if (!voiceNoTr && batch.some((h) => /^\[vocal\]/.test(String(h.text))))
      ev.add("voice");
    const payKind = paymentKind({ texts, type, meta, lastBot, history, ev });
    if (payKind) {
      const already = String(meta.last_bot_text || "") === PAY_TXT && now - (Number(meta.last_bot_ts) || 0) < 6 * 3600;
      let pres = { status: 200, body: "" };
      if (!already)
        { const __pt = await __aiFree(env, SYSTEM_PROMPT, "Le client vient d'\u00e9crire : \u00ab " + texts.join(" / ").slice(0, 400) + " \u00bb. Il signale un paiement ou envoie une preuve. Remercie-le et dis-lui qu'un conseiller v\u00e9rifie et lui r\u00e9pond tr\u00e8s vite (1 \u00e0 2 phrases, tes mots)."); if (!__pt) return { sent: false, skipped: "ai_retry" }; pres = await sendText(env, e.phone_number_id, wa, __pt); }
      const asstId = `asst:${lastUser.id || now}`;
      if (!already && pres.status < 300) {
        hist.push({ role: "assistant", text: PAY_TXT, ts: now, id: asstId });
        meta.last_bot_text = PAY_TXT;
        meta.last_bot_ts = now;
        meta.day_n = (meta.day_n || 0) + 1;
      }
      meta.stage = "wait_proof";
      meta.pay_ts = now;
      const pkeys = [payKind];
      if (payKind === "capture" && batch.some((h) => h.fwd && h.type === "image")) {
        meta.alerts = { ...meta.alerts || {}, capture: now };
        pkeys.length = 0;
      }
      if (pkeys.length)
        await alertOwner(env, e, meta, pkeys, { reply: `${PAY_TXT} \u23F8 Bot mis en pause pour ce client : \xE0 toi de v\xE9rifier et r\xE9pondre (\xAB reprends ${wa} \xBB pour relancer le bot).` }, now);
      await persist();
      try {
        await putIfChanged(env, `pause:${wa}`, { mode: "manual", at: now, why: "paiement_a_verifier" });
      } catch {
      }
      await flagConv(env, e, { reason: "paiement_a_verifier", product: meta.product || "", reply: PAY_TXT }, now);
      if (!already && pres.status < 300)
        await apkFeedPush(env, { from: wa, name: e.name, id: asstId, text: PAY_TXT, ts: now, type: "text" }, "assistant");
      if (pres.status >= 300)
        await alertOwnerOnce(env, wa, "send_fail", `\u26A0\uFE0F Envoi \xE9chou\xE9 (HTTP ${pres.status}) \xB7 ${e.name || "?"} (${wa}) : paiement \xE0 v\xE9rifier \u21AA\uFE0F r\xE9ponds au ${wa} : \u2026`, e.phone_number_id);
      return { sent: !already && pres.status < 300, payment: payKind, reply: PAY_TXT, status: pres.status };
    }
    let photoUrl = null;
    if (ev.has("photo")) {
      const prevU = history.filter((h) => h.role === "user").slice(-2).map((h) => String(h.text || "")).join(" ");
      photoUrl = await findProductImage(env, "", texts.join(" ")) || await findProductImage(env, meta.product, prevU);
    }
    let first = !history.some((h) => h.role === "user");
    if (first) {
      try {
        const feed = await apkHistFor(wa, 40);
        if (feed.some((h) => h.role === "user" && !batch.some((b) => String(b.text).slice(0, 80) === String(h.text).slice(0, 80))))
          first = false;
      } catch {
      }
    }
    const g = await generateReply(env, texts.join("\n"), history, { meta, texts, type, events: ev, first, transcript: transcript || (batch.some((h) => /^\[vocal\]/.test(String(h.text))) ? "transcrit" : null), photoSent: !!photoUrl, name: e.name || null });
    const fresh = await convLoad(env, wa);
    const fm = mergePending(fresh.hist, await pendingGet(wa));
    const fl = [...fm.hist].reverse().find((h) => h.role === "user");
    if (fl && lastUser.id && fl.id && fl.id !== lastUser.id)
      return { skipped: "newer_message_after_gen", reply: g.reply };
    const lastEntry = fm.hist[fm.hist.length - 1];
    if (lastEntry && lastEntry.role !== "user")
      return { skipped: "answered_meanwhile", reply: g.reply };
    let welcomeSent = null;
    try {
      if (await welcomeEligible(env, wa, { first, history, meta }) && !(await getPause(env, wa) || await linePaused(env, e.phone_number_id, wa))) {
        const wt = await welcomeText(env);
        if (wt) {
          await env.EH_KV.put(`welcomed:${wa}`, String(now), { expirationTtl: 400 * DAY });
          const wr = await sendText(env, e.phone_number_id, wa, wt);
          await logEvent(env, { k: "welcome", wa, text: `HTTP ${wr.status}` });
          if (wr.status < 300) {
            welcomeSent = { id: `welcome:${lastUser.id || now}`, text: wt };
            await apkFeedPush(env, { from: wa, name: e.name, id: welcomeSent.id, text: wt, ts: now, type: "text" }, "assistant");
          }
        }
      }
    } catch (err) {
      console.error("welcome soft-fail", err && err.message || err);
    }
    const keepUser = { last_user_ts: meta.last_user_ts, last_user_id: meta.last_user_id, last_type: meta.last_type };
    hist = fm.hist;
    meta = { ...fresh.meta, day: meta.day, day_n: meta.day_n, ...keepUser };
    noteUsers(fm.added);
    pendIds = [.../* @__PURE__ */ new Set([...pendIds, ...fm.added.map((x) => x.id)])];
    {
      const pg = guardPromises(g.reply);
      if (pg.hit) {
        console.log("promise_blocked", JSON.stringify(String(g.reply).slice(0, 200)));
        await logEvent(env, { k: "promise_blocked", wa, text: g.reply });
        g.reply = pg.text;
        g.flag = true;
        g.reason = g.reason || "livraison_a_confirmer";
        g.events = [.../* @__PURE__ */ new Set([...g.events || [], "promise"])];
      }
    }
    if (g.ai_retry) {
      const __k = `airetry:${wa}`; const __n = Number(await env.EH_KV.get(__k) || 0) + 1;
      if (__n < 8) { await env.EH_KV.put(__k, String(__n), { expirationTtl: 86400 }); await logEvent(env, { k: "ai_retry", wa, text: `essai ${__n} ${g.error || ""}`.slice(0, 160) }); return { sent: false, skipped: "ai_retry", attempt: __n }; }
      await env.EH_KV.delete(__k); g.reason = "ia_indisponible";
    }
    if (g.drop) {
      await logEvent(env, { k: "handled", wa, why: "drop_" + (g.guard_reason || "ack") });
      const onlyAck = (g.events || []).length === 1 && g.events[0] === "ack";
      if (onlyAck) {
        await pendingClear(wa, pendIds);
        return { sent: false, dropped: true, reply: g.reply, puts: 0 };
      }
      meta.last_bot_ts = now;
      await persist();
      await flagConv(env, e, { ...g, reason: g.reason || "reponse_non_envoyee" }, now);
      return { sent: false, dropped: true, reply: g.reply };
    }
    if (welcomeSent)
      hist.push({ role: "assistant", text: welcomeSent.text.slice(0, 800), ts: now, id: welcomeSent.id });
    {
      let pausedNow = null;
      try {
        pausedNow = await getPause(env, wa) || await linePaused(env, e.phone_number_id, wa);
      } catch {
      }
      if (pausedNow) {
        console.log("presend_pause_skip", wa);
        try {
          await logEvent(env, { k: "presend_pause_skip", wa, text: String(g.reply || "").slice(0, 200) });
        } catch {
        }
        await persist();
        return { sent: false, skipped: "paused_presend", reply: g.reply };
      }
    }
    let res = photoUrl ? await sendImage(env, e.phone_number_id, wa, photoUrl, g.reply) : await sendText(env, e.phone_number_id, wa, g.reply);
    if (photoUrl && res.status >= 300) {
      console.log("photo_send_failed", res.status, photoUrl);
      const t2 = stripPhotoClaims(g.reply) || g.reply;
      g.reply = t2;
      photoUrl = null;
      res = await sendText(env, e.phone_number_id, wa, t2);
    }
    if (res.status < 300) {
      const asstId = `asst:${lastUser.id || now}`;
      hist.push({ role: "assistant", text: g.reply.slice(0, 800), ts: now, id: asstId });
      meta.last_bot_text = g.reply.slice(0, 200);
      meta.last_bot_ts = now;
      meta.day_n = (meta.day_n || 0) + 1;
      meta.stage = g.stage || meta.stage;
      if ((meta.stage === "done" || meta.stage === "cod") && !(meta.sale_ts && meta.sale_ts >= (meta.price_ts || 0)))
        meta.sale_ts = now;
      if (g.prefs && Object.keys(g.prefs).length)
        meta.prefs = g.prefs;
      if (g.product) {
        meta.product = g.product;
        meta.price = g.price;
        meta.floor = g.price - NEGO_MAX_F;
        meta.digital = !!g.digital;
        if (g.stage === "priced" || !meta.price_ts)
          meta.price_ts = now;
      }
      if (g.stage === "priced")
        meta.price_ts = now;
      if (g.nego)
        meta.nego = { ...g.nego, ts: now };
      if ((g.events || []).includes("conflict"))
        meta.conflict_ts = now;
      const alertKeys = [...g.events || []];
      if (g.provider === "filet" && g.error && await globalCooldown("ai_down", 30 * 60))
        alertKeys.push("ai_down");
      if (ev.has("photo") && photoUrl)
        alertKeys.splice(alertKeys.indexOf("photo"), 1);
      if (alertKeys.includes("capture") && batch.some((h) => h.fwd && h.type === "image")) {
        alertKeys.splice(alertKeys.indexOf("capture"), 1);
        meta.alerts = { ...meta.alerts || {}, capture: now };
      }
      e.mediaNote = batch.some((h) => h.media_id && !h.fwd && MEDIA_FWD_TYPES.has(h.type));
      if (e.mediaNote && !alertKeys.includes("capture"))
        alertKeys.push("media_nf");
      const sentAlerts = await alertOwner(env, e, meta, alertKeys, g, now);
      await apkFeedPush(env, { from: wa, name: e.name, id: asstId, text: g.reply, ts: now, type: photoUrl ? "image" : "text" }, "assistant");
      await persist();
      if (ev.has("human")) {
        try {
          await putIfChanged(env, `pause:${wa}`, { mode: "auto", until: now + AUTO_PAUSE_S2, at: now, why: "humain" }, AUTO_PAUSE_S2);
        } catch {
        }
      }
      if (g.flag)
        await flagConv(env, e, g, now);
      return { sent: true, reply: g.reply, g, alerts: sentAlerts, status: res.status, photo: photoUrl || null };
    }
    console.error("send failed", res.status, String(res.body || "").slice(0, 200));
    await persist();
    await flagConv(env, e, { ...g, reason: "envoi_echoue" }, now);
    await alertOwnerOnce(env, wa, "send_fail", `\u26A0\uFE0F Envoi \xE9chou\xE9 (HTTP ${res.status}) \xB7 ${e.name || "?"} (${wa}) : \xAB ${String(texts.join(" / ")).replace(/\s+/g, " ").slice(0, 80)} \xBB \u21AA\uFE0F r\xE9ponds au ${wa} : \u2026`, e.phone_number_id);
    return { sent: false, status: res.status, reply: g.reply };
  } finally {
    PROCESSING2.delete(wa);
  }
}
__name(processConv, "processConv");
__name2(processConv, "processConv");
__name22(processConv, "processConv");
async function sweepUnanswered(env) {
  const now = Math.floor(Date.now() / 1e3);
  let cursor = null, n = 0;
  try {
    for (const wa of await pendingWas()) {
      const pend = await pendingGet(wa);
      if (!pend.length) {
        await pendingSet(wa, []);
        continue;
      }
      const age = now - (Number(pend[pend.length - 1].ts) || 0);
      if (age < SWEEP_MIN_AGE_S)
        continue;
      try {
        const sec = await assistantSecoursGet(env);
        if (sec && sec.on)
          return;
      } catch {
      }
      try {
        await processConv(env, wa, { source: "sweep_pending" });
        n++;
      } catch (err) {
        console.error("sweep pending", wa, err && err.message || err);
      }
      if (n >= 5)
        return;
    }
  } catch (err) {
    console.error("sweep pending soft-fail", err && err.message || err);
  }
  do {
    let l;
    try {
      l = await env.EH_KV.list({ prefix: "conv:", cursor, limit: 1e3 });
    } catch {
      return;
    }
    for (const k of l.keys) {
      const m = k.metadata;
      if (!m || m.v !== CONV_V)
        continue;
      const lu = Number(m.last_user_ts) || 0, lb = Number(m.last_bot_ts) || 0;
      if (lu <= lb)
        continue;
      const age = now - lu;
      if (age < SWEEP_MIN_AGE_S || age > SWEEP_MAX_AGE_S)
        continue;
      const wa = k.name.slice(5);
      if (OWNER_WAS.has(wa))
        continue;
      try {
        const sec = await assistantSecoursGet(env);
        if (sec && sec.on)
          return;
      } catch {
      }
      try {
        await processConv(env, wa, { source: "sweep" });
        n++;
      } catch (err) {
        console.error("sweep", wa, err && err.message || err);
      }
      if (n >= 5)
        return;
    }
    cursor = l.list_complete ? null : l.cursor;
  } while (cursor);
}
__name(sweepUnanswered, "sweepUnanswered");
__name2(sweepUnanswered, "sweepUnanswered");
__name22(sweepUnanswered, "sweepUnanswered");
var SUIVI_KEY = "cfg:suivi";
var OPTOUT_RE = /^\s*(stop|stop promo|stop pub|arr[eê]te[rz]?|arr[eê]t|d[ée]sabonn\w*|unsubscribe|plus de (messages?|pub|promo)\w*)\s*[.!]*\s*$/i;
var FU_SALE_MIN_S = 2 * 86400;
var FU_SALE_MAX_S = 6 * 86400;
var FU_LEAD_MIN_S = 20 * 3600;
var FU_LEAD_MAX_S = 72 * 3600;
var FU_PER_RUN = 8;
var PROMO_PER_RUN = 20;
var PROMO_GAP_MS = 1200;
var TPL_AFTER_SALE = "eh_suivi_apres_vente";
var TPL_LEAD = "eh_relance_info";
var TPL_PROMO = "eh_promo_offre";
var STOP_LINE = "R\xE9pondez STOP pour ne plus recevoir nos offres.";
async function suiviOn(env) {
  try {
    return await env.EH_KV.get(SUIVI_KEY) === "on";
  } catch {
    return false;
  }
}
__name(suiviOn, "suiviOn");
__name2(suiviOn, "suiviOn");
__name22(suiviOn, "suiviOn");
function quietOk(now) {
  const h = watHour(now);
  return h >= 8 && h < 20;
}
__name(quietOk, "quietOk");
__name2(quietOk, "quietOk");
__name22(quietOk, "quietOk");
var PGC_RE = /(?:^|[^a-z])(?:p\s*\.?\s*g\s*\.?\s*c|pay[ée]?s?\s+gard(?:e|er|ez)?\s+(?:de\s+)?contacts?|gard(?:e|er|ez)\s+(?:mon\s+|le\s+|les\s+|ton\s+|votre\s+)?contacts?|enregistr(?:e|er|ez)\s+(?:moi|mon\s+(?:num|numero|numéro|contact))|save\s+(?:my\s+)?contact)(?:$|[^a-z])/i;
function isPgcText(t) {
  const x = String(t || "").normalize("NFD").replace(/[\u0300-\u036f]/g, "").trim();
  if (!x || x.length > 120 || /\?/.test(x))
    return false;
  return PGC_RE.test(x);
}
__name(isPgcText, "isPgcText");
function isPgcAck(t) {
  const x = String(t || "").trim();
  if (!x || /\?/.test(x))
    return false;
  if (isPgcText(x))
    return true;
  return x.length <= 25 && /^[\p{L}\p{Emoji_Presentation}\p{Extended_Pictographic}\s!.,'’👍🙏✅]*$/u.test(x) && /^(ok+|okay|merci|thanks?|thx|d'?accord|dac|cool|top|super|bien|fait|c'?est fait|parfait|ça marche|ca marche|oui|yes|👍|🙏|✅|\s)*[!.]*$/iu.test(x.normalize("NFD").replace(/[\u0300-\u036f]/g, ""));
}
__name(isPgcAck, "isPgcAck");
async function pgcGet(env, wa) {
  try {
    return await env.EH_KV.get(`pgc:${wa}`);
  } catch {
    return null;
  }
}
__name(pgcGet, "pgcGet");
async function contactEnqueue(env, wa, name, phoneId) {
  try {
    wa = String(wa || "").replace(/\D/g, "");
    if (!wa || OWNER_WAS.has(wa) || /^999\d{9}$/.test(wa) || GC_SKIP.has(wa))
      return;
    const k = `ct:${wa}`;
    const cur = await env.EH_KV.get(k, "json");
    const line = lineNum(await linesCfg(env), phoneId) || 1;
    if (cur && cur.saved) {
      const nn = gcCleanName(name);
      if (nn && nn !== gcCleanName(cur.name))
        await env.EH_KV.put(k, JSON.stringify({ ...cur, name: nn, rename: true }), { metadata: { s: 0 } });
      return;
    }
    if (cur && (cur.name || !name))
      return;
    const v = { name: String(name || cur && cur.name || "").slice(0, 60), line: cur && cur.line || line, at: cur && cur.at || Math.floor(Date.now() / 1e3), saved: false };
    await env.EH_KV.put(k, JSON.stringify(v), { metadata: { s: 0 } });
  } catch (err) {
    console.error("contactEnqueue soft-fail", err && err.message || err);
  }
}
__name(contactEnqueue, "contactEnqueue");
var GC_SKIP = /* @__PURE__ */ new Set(["16465894168"]);
function gcCleanName(n) {
  const x = String(n || "").replace(/\s+/g, " ").trim();
  if (!x || !/[\p{L}\p{N}]/u.test(x) || /^\+?[\d\s().-]+$/.test(x))
    return "";
  return x.slice(0, 50);
}
__name(gcCleanName, "gcCleanName");
function gcDisplay(name, line, wa) {
  const lbl = Number(line) === 2 ? "53" : "59";
  const n = gcCleanName(String(name || "").replace(/\(?\s*\bEH\s*[-_]?\s*(53|59)\b\s*\)?/gi, " "));
  const num = "+" + String(wa).replace(/\D/g, "").replace(/^(\d{3})(\d+)$/, (m, a, b) => a + " " + (b.match(/.{1,2}/g) || []).join(" "));
  return `${n || num} EH ${lbl}`; // 2026-10-13: single suffix rule (was "<n> (EH x)")
}
__name(gcDisplay, "gcDisplay");
function gcNameFromHist(hist) {
  for (const h of [...hist || []].reverse()) {
    if (h.role !== "user")
      continue;
    const m = String(h.text || "").match(/(?:je m'appelle|je m’appelle|moi c'est|mon nom (?:est|c'est)|nom\s*:)\s+([A-ZÀ-Ý][\p{L}'’-]+(?:\s+[A-ZÀ-Ý][\p{L}'’-]+){0,2})/u);
    if (m)
      return m[1];
  }
  return "";
}
__name(gcNameFromHist, "gcNameFromHist");
async function gcAllConnections(G) {
  const all = [];
  let pt = "";
  for (let i = 0; i < 20; i++) {
    const r = await G(`people/me/connections?personFields=names,phoneNumbers,memberships&pageSize=1000${pt ? "&pageToken=" + encodeURIComponent(pt) : ""}`);
    const j = await r.json().catch(() => ({}));
    if (!r.ok)
      throw new Error(`connections ${r.status}`);
    all.push(...j.connections || []);
    pt = j.nextPageToken || "";
    if (!pt)
      break;
  }
  return all;
}
__name(gcAllConnections, "gcAllConnections");
async function contactsRename(env, { dry = false } = {}) {
  const at = await gcAccessToken(env);
  if (!at)
    return { error: "no_google_auth" };
  const G = /* @__PURE__ */ __name((path, init = {}) => fetch(`https://people.googleapis.com/v1/${path}`, { ...init, headers: { Authorization: `Bearer ${at}`, "Content-Type": "application/json", ...init.headers || {} } }), "G");
  const conns = await gcAllConnections(G);
  const byDig = /* @__PURE__ */ new Map();
  for (const c of conns)
    for (const ph of c.phoneNumbers || [])
      byDig.set(gcDigits(ph.canonicalForm || ph.value), c);
  const l = await env.EH_KV.list({ prefix: "ct:", limit: 1e3 });
  const out = [];
  for (const k of l.keys) {
    const wa = k.name.slice(3);
    let v = {};
    try {
      v = JSON.parse(await env.EH_KV.get(k.name) || "{}") || {};
    } catch {
    }
    let name = gcCleanName(v.name) || gcCleanName(await env.EH_KV.get(`name:${wa}`));
    if (!name) {
      try {
        const { hist } = await convLoad(env, wa);
        name = gcCleanName(gcNameFromHist(hist));
      } catch {
      }
    }
    const want = gcDisplay(name, v.line, wa);
    const c = byDig.get(gcDigits(wa));
    const cur = c && (c.names || [])[0] && (c.names[0].displayName || c.names[0].unstructuredName) || "";
    const row2 = { last4: wa.slice(-4), line: Number(v.line) === 2 ? 53 : 59, name: want, before: cur, found: !!c, dup: !!v.dup };
    if (c && !v.dup && cur !== want && !dry) {
      const r = await G(`${c.resourceName}:updateContact?updatePersonFields=names`, { method: "PATCH", body: JSON.stringify({ etag: c.etag, names: [{ givenName: want, unstructuredName: want }] }) });
      row2.updated = r.ok;
      if (!r.ok)
        row2.err = (await r.text()).slice(0, 160);
    }
    if (c && !v.dup) {
      try {
        await env.EH_KV.put(k.name, JSON.stringify({ ...v, name: name || v.name || "", rn: c.resourceName, rename: false, saved: true }), { metadata: { s: 1 } });
      } catch {
      }
    }
    out.push(row2);
  }
  return { count: out.length, rows: out };
}
__name(contactsRename, "contactsRename");
var GC_REDIRECT = "https://eh-whatsapp.domingohoreb.workers.dev/gcontacts/callback";
var GC_SCOPE = "https://www.googleapis.com/auth/contacts email";
var GC_GROUP = "Electronic HOUSE";
async function gcClient(env) {
  if (env.GOOGLE_CLIENT_ID && env.GOOGLE_CLIENT_SECRET)
    return { id: env.GOOGLE_CLIENT_ID, secret: env.GOOGLE_CLIENT_SECRET };
  try {
    const c = JSON.parse(await env.EH_KV.get("cfg:gcontacts_client") || "null");
    if (c && c.id && c.secret)
      return c;
  } catch {
  }
  return null;
}
__name(gcClient, "gcClient");
async function gcAccessToken(env) {
  const rt = await env.EH_KV.get("cfg:gcontacts_rt");
  const cl = await gcClient(env);
  if (!rt || !cl)
    return null;
  const r = await fetch("https://oauth2.googleapis.com/token", { method: "POST", headers: { "Content-Type": "application/x-www-form-urlencoded" }, body: new URLSearchParams({ client_id: cl.id, client_secret: cl.secret, refresh_token: rt, grant_type: "refresh_token" }) });
  const j = await r.json().catch(() => ({}));
  if (!j.access_token) {
    console.error("gc token fail", r.status, JSON.stringify(j).slice(0, 200));
    return null;
  }
  return j.access_token;
}
__name(gcAccessToken, "gcAccessToken");
function gcDigits(p) {
  const d = String(p || "").replace(/\D/g, "");
  return d.slice(-8);
}
__name(gcDigits, "gcDigits");
async function contactsSync(env, opts = {}) {
  const out = { ok: false, created: 0, dup: 0, errors: 0, pending: 0 };
  const at = await gcAccessToken(env);
  if (!at) {
    out.reason = "no_google_auth";
    return out;
  }
  const G = /* @__PURE__ */ __name((path, init = {}) => fetch(`https://people.googleapis.com/v1/${path}`, { ...init, headers: { Authorization: `Bearer ${at}`, "Content-Type": "application/json", ...init.headers || {} } }), "G");
  let l;
  try {
    l = await env.EH_KV.list({ prefix: "ct:", limit: 1e3 });
  } catch {
    out.reason = "kv_list";
    return out;
  }
  const todo = l.keys.filter((k) => !k.metadata || !k.metadata.s).slice(0, opts.max || 25);
  out.pending = todo.length;
  if (!todo.length) {
    out.ok = true;
    return out;
  }
  const have = /* @__PURE__ */ new Set();
  let pt = "";
  for (let i = 0; i < 20; i++) {
    const r = await G(`people/me/connections?personFields=phoneNumbers&pageSize=1000${pt ? "&pageToken=" + encodeURIComponent(pt) : ""}`);
    const j = await r.json().catch(() => ({}));
    if (!r.ok) {
      out.reason = `connections ${r.status}`;
      return out;
    }
    for (const c of j.connections || [])
      for (const ph of c.phoneNumbers || [])
        have.add(gcDigits(ph.canonicalForm || ph.value));
    pt = j.nextPageToken || "";
    if (!pt)
      break;
  }
  let group = null;
  {
    const r = await G("contactGroups?pageSize=200");
    const j = await r.json().catch(() => ({}));
    const g = (j.contactGroups || []).find((x) => x.name === GC_GROUP);
    if (g)
      group = g.resourceName;
    else {
      const c = await G("contactGroups", { method: "POST", body: JSON.stringify({ contactGroup: { name: GC_GROUP } }) });
      const cj = await c.json().catch(() => ({}));
      group = cj.resourceName || null;
    }
  }
  for (const k of todo) {
    const wa = k.name.slice(3);
    let v = {};
    try {
      v = JSON.parse(await env.EH_KV.get(k.name) || "{}") || {};
    } catch {
    }
    if (v.rename && v.rn) {
      try {
        const g = await G(`${v.rn}?personFields=names`);
        const gj = await g.json();
        const want = gcDisplay(v.name, v.line, wa);
        const r2 = await G(`${v.rn}:updateContact?updatePersonFields=names`, { method: "PATCH", body: JSON.stringify({ etag: gj.etag, names: [{ givenName: want, unstructuredName: want }] }) });
        if (r2.ok)
          out.renamed = (out.renamed || 0) + 1;
      } catch {
      }
      await env.EH_KV.put(k.name, JSON.stringify({ ...v, rename: false }), { metadata: { s: 1 } });
      continue;
    }
    if (v.rename) {
      await env.EH_KV.put(k.name, JSON.stringify({ ...v, rename: false }), { metadata: { s: 1 } });
      continue;
    }
    if (have.has(gcDigits(wa))) {
      out.dup++;
      await env.EH_KV.put(k.name, JSON.stringify({ ...v, saved: true, dup: true, done: Math.floor(Date.now() / 1e3) }), { metadata: { s: 1 } });
      continue;
    }
    const lineLbl = Number(v.line) === 2 ? "53" : "59";
    const nm = gcDisplay(v.name, v.line, wa);
    const body = { names: [{ givenName: nm, unstructuredName: nm }], phoneNumbers: [{ value: `+${wa}`, type: "mobile" }], biographies: [{ value: `Client WhatsApp Electronic HOUSE (ligne ${lineLbl})`, contentType: "TEXT_PLAIN" }] };
    if (group)
      body.memberships = [{ contactGroupMembership: { contactGroupResourceName: group } }];
    const r = await G("people:createContact?personFields=names,phoneNumbers", { method: "POST", body: JSON.stringify(body) });
    if (r.ok) {
      out.created++;
      have.add(gcDigits(wa));
      let rn = null;
      try {
        rn = (await r.clone().json()).resourceName || null;
      } catch {
      }
      await env.EH_KV.put(k.name, JSON.stringify({ ...v, saved: true, rn, done: Math.floor(Date.now() / 1e3) }), { metadata: { s: 1 } });
    } else {
      out.errors++;
      console.error("gc create fail", r.status, (await r.text()).slice(0, 200));
      if (r.status === 429)
        break;
    }
  }
  out.ok = true;
  try {
    await env.EH_KV.put("cfg:gcontacts_last", JSON.stringify({ at: Math.floor(Date.now() / 1e3), ...out }));
  } catch {
  }
  return out;
}
__name(contactsSync, "contactsSync");
async function contactsBackfill(env) {
  const seen = /* @__PURE__ */ new Map();
  for (const pre of ["conv:", "name:", "line:", "pgc:"]) {
    let cursor = null;
    do {
      const l = await env.EH_KV.list({ prefix: pre, cursor, limit: 1e3 });
      for (const k of l.keys) {
        const wa = k.name.slice(pre.length).replace(/\D/g, "");
        if (wa && !seen.has(wa))
          seen.set(wa, { line: null });
      }
      cursor = l.list_complete ? null : l.cursor;
    } while (cursor);
  }
  try {
    const items = await evlogRead(env, 2e3, "");
    for (const x of items)
      if (x && x.k === "in" && x.from) {
        const w = String(x.from).replace(/\D/g, "");
        if (!seen.has(w))
          seen.set(w, { line: null });
        if (x.name)
          seen.get(w).name = x.name;
      }
  } catch {
  }
  let n = 0;
  for (const [wa, info] of seen) {
    let name = info.name || null;
    if (!name) {
      try {
        name = await env.EH_KV.get(`name:${wa}`);
      } catch {
      }
    }
    let line = 1;
    try {
      const lw = await env.EH_KV.get(`line:${wa}`);
      if (lw && lineNum(await linesCfg(env), lw) === 2)
        line = 2;
    } catch {
    }
    const before = await env.EH_KV.get(`ct:${wa}`);
    const lc = await linesCfg(env);
    await contactEnqueue(env, wa, name, line === 2 ? lc.WA_STATUT || null : OWNER_PHONE_DEFAULT);
    if (!before && await env.EH_KV.get(`ct:${wa}`))
      n++;
  }
  return { candidates: seen.size, queued: n };
}
__name(contactsBackfill, "contactsBackfill");
async function isOptOut(env, wa) {
  try {
    if (await env.EH_KV.get(`pgc:${wa}`))
      return true;
    return !!await env.EH_KV.get(`optout:${wa}`);
  } catch {
    return false;
  }
}
__name(isOptOut, "isOptOut");
__name2(isOptOut, "isOptOut");
__name22(isOptOut, "isOptOut");
async function sendTemplate(env, phoneId, to, name, params) {
  phoneId = await lineRoute(env, phoneId, to);
  const r = await fetch(`${graphBase(env)}/${phoneId}/messages`, {
    method: "POST",
    headers: { Authorization: `Bearer ${env.WA_TOKEN}`, "Content-Type": "application/json" },
    body: JSON.stringify({ messaging_product: "whatsapp", to, type: "template", template: { name, language: { code: "fr" }, components: [{ type: "body", parameters: params.map((t) => ({ type: "text", text: String(t || "-").replace(/\s+/g, " ").slice(0, 200) })) }] } })
  });
  const out = { status: r.status, body: await r.text() };
  await logOut(env, to, "template", `[mod\xE8le ${name}]`, out);
  return out;
}
__name(sendTemplate, "sendTemplate");
__name2(sendTemplate, "sendTemplate");
__name22(sendTemplate, "sendTemplate");
async function suiviStat(env, key) {
  try {
    const s = JSON.parse(await env.EH_KV.get("cfg:suivi_stats") || "{}");
    s[key] = (s[key] || 0) + 1;
    s.updated = Math.floor(Date.now() / 1e3);
    await env.EH_KV.put("cfg:suivi_stats", JSON.stringify(s));
  } catch {
  }
}
__name(suiviStat, "suiviStat");
__name2(suiviStat, "suiviStat");
__name22(suiviStat, "suiviStat");
async function sendFollow(env, wa, meta, { free, tpl, params }, now) {
  const inWin = now - (Number(meta.last_user_ts) || 0) < 23.5 * 3600;
  let r, via;
  if (inWin && free) {
    r = await sendText(env, OWNER_PHONE_DEFAULT, wa, free);
    via = "libre";
  } else if (tpl) {
    r = await sendTemplate(env, OWNER_PHONE_DEFAULT, wa, tpl, params);
    via = `mod\xE8le ${tpl}`;
  } else
    return { ok: false, via: "hors_fenetre" };
  if (r.status >= 300) {
    let code = 0;
    try {
      code = Number(JSON.parse(r.body).error.code) || 0;
    } catch {
    }
    return { ok: false, via: via === "libre" ? "echec" : "hors_fenetre", code };
  }
  return { ok: true, via };
}
__name(sendFollow, "sendFollow");
__name2(sendFollow, "sendFollow");
__name22(sendFollow, "sendFollow");
function firstName(n) {
  const f = String(n || "").trim().split(/\s+/)[0] || "";
  return /^[\p{L}'-]{2,20}$/u.test(f) ? f : "";
}
__name(firstName, "firstName");
__name2(firstName, "firstName");
__name22(firstName, "firstName");
async function sweepFollowups(env, opts = {}) {
  const now = opts.now || Math.floor(Date.now() / 1e3);
  if (!await suiviOn(env) || !quietOk(now))
    return { skipped: true };
  let cursor = null, sent = 0;
  const out = { sale: 0, lead: 0, hors_fenetre: 0, echec: 0 };
  do {
    let l;
    try {
      l = await env.EH_KV.list({ prefix: "conv:", cursor, limit: 1e3 });
    } catch {
      return out;
    }
    for (const k of l.keys) {
      if (sent >= FU_PER_RUN)
        return out;
      const m = k.metadata;
      if (!m || m.v !== CONV_V)
        continue;
      const wa = k.name.slice(5);
      if (OWNER_WAS.has(wa))
        continue;
      const lu = Number(m.last_user_ts) || 0, lb = Number(m.last_bot_ts) || 0;
      const sale = m.sale_ts && (!m.fu_s || Number(m.fu_s) < Number(m.sale_ts)) && now - m.sale_ts >= FU_SALE_MIN_S && now - m.sale_ts <= FU_SALE_MAX_S && now - lu > 12 * 3600;
      const lead = !sale && m.price && m.price_ts && ["priced", "wait_commit", "collecting"].includes(m.stage) && Number(m.fu_l || 0) !== Number(m.price_ts) && !(m.sale_ts && m.sale_ts >= m.price_ts) && lu <= lb && now - lu >= FU_LEAD_MIN_S && now - lu <= FU_LEAD_MAX_S;
      if (!sale && !lead)
        continue;
      if (m.alerts && m.alerts.conflict || m.conflict_ts && now - m.conflict_ts < 14 * 86400)
        continue;
      if (await getPause(env, wa) || await isOptOut(env, wa))
        continue;
      const { hist, meta } = await convLoad(env, wa);
      if (hist.slice(-6).some((h) => h.role === "owner" && now - Number(h.ts || 0) < 24 * 3600))
        continue;
      let nm = "";
      try {
        nm = firstName(await env.EH_KV.get(`name:${wa}`));
      } catch {
      }
      const hi = nm ? `Bonjour ${nm}` : "Bonjour";
      const prod = String(meta.product || "").slice(0, 60) || "votre achat";
      const res = sale ? await sendFollow(env, wa, meta, { free: `${hi}, c'est Electronic HOUSE. Tout se passe bien avec votre ${prod} ? Une question sur la configuration ou la garantie, r\xE9pondez simplement ici.`, tpl: TPL_AFTER_SALE, params: [nm || "cher client", prod] }, now) : await sendFollow(env, wa, meta, { free: `${hi} \u{1F44B} Vous vous \xE9tiez renseign\xE9(e) sur ${prod}. D'autres questions, ou on vous le pr\xE9pare ? Livraison possible, paiement MoMo ou \xE0 la livraison.`, tpl: TPL_LEAD, params: [nm || "cher client", prod] }, now);
      if (sale)
        meta.fu_s = now;
      else
        meta.fu_l = meta.price_ts;
      if (res.ok) {
        sent++;
        out[sale ? "sale" : "lead"]++;
        hist.push({ role: "assistant", text: `(${sale ? "suivi apr\xE8s-vente" : "relance"} \u2014 ${res.via})`, ts: now, id: `fu:${wa}:${now}` });
        meta.last_bot_ts = now;
        await suiviStat(env, sale ? "sale" : "lead");
      } else {
        out[res.via === "echec" ? "echec" : "hors_fenetre"]++;
        await suiviStat(env, res.via === "echec" ? "echec" : "hors_fenetre");
      }
      await convSave(env, wa, hist, meta);
    }
    cursor = l.list_complete ? null : l.cursor;
  } while (cursor);
  return out;
}
__name(sweepFollowups, "sweepFollowups");
__name2(sweepFollowups, "sweepFollowups");
__name22(sweepFollowups, "sweepFollowups");
function parsePromo(t) {
  const m = String(t || "").match(/^\s*promo(?:tion)?\s*[:\-]?\s+([\s\S]{3,700})$/i);
  if (!m)
    return null;
  const body = m[1].trim();
  const parts = body.split("|").map((x) => x.trim());
  const tpl = parts.length >= 3 && parts[0] && /\d/.test(parts[1]) ? { product: parts[0].slice(0, 80), price: parts[1].replace(/\s*(f|fcfa)\s*$/i, "").slice(0, 20), detail: parts.slice(2).join(" ").slice(0, 200) || "Stocks limit\xE9s." } : null;
  const text = tpl ? `\u{1F389} Offre du moment chez Electronic HOUSE : ${tpl.product} \xE0 ${tpl.price} FCFA. ${tpl.detail}` : body;
  return { text: `${text}

${STOP_LINE}`, tpl };
}
__name(parsePromo, "parsePromo");
__name2(parsePromo, "parsePromo");
__name22(parsePromo, "parsePromo");
async function promoTargets(env, now) {
  const inWin = [], out = [];
  let cursor = null;
  do {
    let l;
    try {
      l = await env.EH_KV.list({ prefix: "conv:", cursor, limit: 1e3 });
    } catch {
      break;
    }
    for (const k of l.keys) {
      const m = k.metadata;
      const wa = k.name.slice(5);
      if (!m || m.v !== CONV_V || OWNER_WAS.has(wa) || !m.last_user_ts)
        continue;
      if (now - m.last_user_ts > 90 * 86400)
        continue;
      if (m.alerts && m.alerts.conflict || m.conflict_ts && now - m.conflict_ts < 14 * 86400)
        continue;
      (now - m.last_user_ts < 23 * 3600 ? inWin : out).push(wa);
    }
    cursor = l.list_complete ? null : l.cursor;
  } while (cursor);
  const keep = /* @__PURE__ */ __name2(async (arr) => {
    const r = [];
    for (const wa of arr)
      if (!await isOptOut(env, wa))
        r.push(wa);
    return r;
  }, "keep");
  return { inWin: await keep(inWin), out: await keep(out) };
}
__name(promoTargets, "promoTargets");
__name2(promoTargets, "promoTargets");
__name22(promoTargets, "promoTargets");
async function promoCommand(env, phoneId, from, text, now) {
  const p = parsePromo(text);
  if (!p)
    return false;
  const t = await promoTargets(env, now);
  await env.EH_KV.put("promo:pending", JSON.stringify({ ...p, at: now, inWin: t.inWin, out: t.out }), { expirationTtl: 900 });
  const outLine = p.tpl ? `${t.out.length} hors fen\xEAtre 24 h \u2192 mod\xE8le \xAB ${TPL_PROMO} \xBB (si approuv\xE9 par Meta, sinon compt\xE9s \xAB hors fen\xEAtre \xBB)` : `${t.out.length} hors fen\xEAtre 24 h \u2192 non envoy\xE9s (pour eux, \xE9crivez \xAB promotion produit | prix | d\xE9tail \xBB : mod\xE8le Meta)`;
  await sendText(env, phoneId, from, `\u{1F4E3} APER\xC7U PROMOTION

${p.text}

Cibles : ${t.inWin.length} client(s) dans la fen\xEAtre 24 h (message libre) ; ${outLine}. Clients ayant dit STOP exclus. Envoi progressif (8h\u201320h).

R\xE9pondez \xAB confirmer \xBB pour envoyer ou \xAB annuler \xBB (valable 10 min).`);
  return true;
}
__name(promoCommand, "promoCommand");
__name2(promoCommand, "promoCommand");
__name22(promoCommand, "promoCommand");
async function promoConfirm(env, phoneId, from, now, yes) {
  let pend = null;
  try {
    pend = JSON.parse(await env.EH_KV.get("promo:pending") || "null");
  } catch {
  }
  if (!pend || now - pend.at > 600)
    return false;
  try {
    await env.EH_KV.delete("promo:pending");
  } catch {
  }
  if (!yes) {
    await sendText(env, phoneId, from, "\u274E Promotion annul\xE9e, rien n'a \xE9t\xE9 envoy\xE9.");
    return true;
  }
  const queue = [...pend.inWin.map((wa) => ({ wa, mode: "libre" })), ...pend.tpl ? pend.out.map((wa) => ({ wa, mode: "modele" })) : []];
  const job = { text: pend.text, tpl: pend.tpl, queue, idx: 0, ok: 0, fail: 0, hors: pend.tpl ? 0 : pend.out.length, at: now, by: from };
  await env.EH_KV.put("promo:job", JSON.stringify(job));
  await sendText(env, phoneId, from, `\u2705 Promotion confirm\xE9e : ${queue.length} envoi(s) programm\xE9(s)${job.hors ? `, ${job.hors} hors fen\xEAtre non envoy\xE9s` : ""}. Je vous envoie le bilan \xE0 la fin.`);
  await runPromoJob(env, now);
  return true;
}
__name(promoConfirm, "promoConfirm");
__name2(promoConfirm, "promoConfirm");
__name22(promoConfirm, "promoConfirm");
async function runPromoJob(env, now = Math.floor(Date.now() / 1e3)) {
  let job = null;
  try {
    job = JSON.parse(await env.EH_KV.get("promo:job") || "null");
  } catch {
  }
  if (!job || !quietOk(now))
    return null;
  const end = Math.min(job.queue.length, job.idx + PROMO_PER_RUN);
  for (; job.idx < end; job.idx++) {
    const q = job.queue[job.idx];
    if (await isOptOut(env, q.wa))
      continue;
    let nm = "";
    try {
      nm = firstName(await env.EH_KV.get(`name:${q.wa}`));
    } catch {
    }
    const r = q.mode === "libre" ? await sendText(env, OWNER_PHONE_DEFAULT, q.wa, `${nm ? `Bonjour ${nm} ! ` : ""}${job.text}`) : await sendTemplate(env, OWNER_PHONE_DEFAULT, q.wa, TPL_PROMO, [nm || "cher client", job.tpl.product, job.tpl.price, job.tpl.detail]);
    if (r.status < 300) {
      job.ok++;
      try {
        await pushHist(env, q.wa, "assistant", q.mode === "libre" ? job.text : `(promotion \u2014 mod\xE8le ${TPL_PROMO}) ${job.tpl.product} \xE0 ${job.tpl.price} FCFA`, now);
      } catch {
      }
    } else if (q.mode === "modele")
      job.hors++;
    else
      job.fail++;
    if (globalThis.__promoGapMs !== 0)
      await sleep(globalThis.__promoGapMs ?? PROMO_GAP_MS);
  }
  if (job.idx >= job.queue.length) {
    try {
      await env.EH_KV.delete("promo:job");
    } catch {
    }
    await sendText(env, OWNER_PHONE_DEFAULT, job.by || OWNER_NOTIFY_WA, `\u{1F4E3} Bilan promotion : ${job.ok} envoy\xE9(s), ${job.fail} \xE9chec(s), ${job.hors} hors fen\xEAtre 24 h.`);
  } else
    await env.EH_KV.put("promo:job", JSON.stringify(job));
  return job;
}
__name(runPromoJob, "runPromoJob");
__name2(runPromoJob, "runPromoJob");
__name22(runPromoJob, "runPromoJob");
async function sweepEveningFollowups(env) {
  const now = Math.floor(Date.now() / 1e3);
  const h = watHour(now);
  if (h < 18 || h >= 21)
    return;
  const today = watDay(now);
  let cursor = null, sent = 0;
  do {
    let l;
    try {
      l = await env.EH_KV.list({ prefix: "conv:", cursor, limit: 1e3 });
    } catch {
      return;
    }
    for (const k of l.keys) {
      if (sent >= 3)
        return;
      const m = k.metadata;
      if (!m || m.v !== CONV_V || !m.price || !m.price_ts)
        continue;
      if (!["priced", "wait_commit", "collecting"].includes(m.stage))
        continue;
      if (m.followup_day === today)
        continue;
      if (watDay(m.price_ts) !== today || watHour(m.price_ts) >= 12)
        continue;
      if ((Number(m.last_user_ts) || 0) > (Number(m.last_bot_ts) || 0))
        continue;
      if (now - (Number(m.last_user_ts) || 0) > 22 * 3600)
        continue;
      const wa = k.name.slice(5);
      if (OWNER_WAS.has(wa) || await getPause(env, wa))
        continue;
      const { hist, meta } = await convLoad(env, wa);
      const history = hist.slice(-HIST_TURN_MSGS);
      const msgs = [{ role: "system", content: SYSTEM_PROMPT + `

RELANCE DU SOIR : ce matin tu as donn\xE9 le prix de ${meta.product} (environ ${fmtF2(meta.price)} FCFA) et le client n'a plus r\xE9pondu. \xC9cris UNE relance courte, naturelle et nouvelle (1\u20132 phrases), sans pression, sans lien, sans r\xE9p\xE9ter ta derni\xE8re bulle, qui l'invite \xE0 conclure ou \xE0 poser sa question.
TA DERNI\xC8RE BULLE : \xAB ${meta.last_bot_text} \xBB` }, ...histToMsgs(history), { role: "user", content: "[Consigne interne : r\xE9dige maintenant la relance du soir pour ce client.]" }];
      const r = await runAiChain(env, msgs, { deadline: Date.now() + AI_CLOUD_BUDGET_MS });
      const text = r.ok ? sanitizeOut(r.text) : "";
      const pctx = { allowed: /* @__PURE__ */ new Set([meta.price, ...Array.from({ length: 11 }, (_, i) => meta.price - NEGO_MAX_F + i * 500)]), floorProducts: [], product: { price: meta.price, floor: meta.price - NEGO_MAX_F } };
      meta.followup_day = today;
      if (!text || checkAmounts2(text, pctx) || sameText(text, meta.last_bot_text)) {
        await convSave(env, wa, hist, meta);
        continue;
      }
      const res = await sendText(env, OWNER_PHONE_DEFAULT, wa, text);
      if (res.status < 300) {
        hist.push({ role: "assistant", text, ts: now });
        meta.last_bot_text = text.slice(0, 200);
        meta.last_bot_ts = now;
        meta.stage = "followup_done";
        sent++;
      }
      await convSave(env, wa, hist, meta);
    }
    cursor = l.list_complete ? null : l.cursor;
  } while (cursor);
}
__name(sweepEveningFollowups, "sweepEveningFollowups");
__name2(sweepEveningFollowups, "sweepEveningFollowups");
__name22(sweepEveningFollowups, "sweepEveningFollowups");
async function maybeCronProbe(env) {
  const st = await readAiHealth();
  if (Number(st.last_ok) && Date.now() - Number(st.last_ok) < 30 * 60 * 1e3)
    return { skipped: "recent_ok" };
  if (Number(st.last_check) && Date.now() - Number(st.last_check) < 30 * 60 * 1e3)
    return { skipped: "recent_check" };
  const r = await runAiChain(env, [{ role: "system", content: "R\xE9ponds juste : pong" }, { role: "user", content: "ping" }], { max_tokens: 8, temperature: 0, deadline: Date.now() + 12e3 });
  if (r.ok)
    await markAiOk(env, `probe_${r.provider}`);
  else
    await markAiFail(env, (r.errors || []).join(" | ") || "probe_fail", "probe");
  return r.ok ? { ok: true, via: r.provider } : { ok: false };
}
__name(maybeCronProbe, "maybeCronProbe");
__name2(maybeCronProbe, "maybeCronProbe");
__name22(maybeCronProbe, "maybeCronProbe");
async function apkHistFor(wa, limit = 12) {
  const ring = await apkFeedRead();
  const events = (ring.events || []).filter((x) => x && String(x.wa) === String(wa));
  const chron = events.slice().reverse().slice(-limit);
  return chron.map((x) => ({ role: x.role === "assistant" || x.role === "owner" ? x.role : "user", text: x.text || "", ts: x.ts || 0 }));
}
__name(apkHistFor, "apkHistFor");
__name2(apkHistFor, "apkHistFor");
__name22(apkHistFor, "apkHistFor");
async function cacheGetJSON(url, dflt = null) {
  try {
    const hit = await caches.default.match(new Request(url));
    if (!hit)
      return dflt;
    return await hit.json();
  } catch {
    return dflt;
  }
}
__name(cacheGetJSON, "cacheGetJSON");
__name2(cacheGetJSON, "cacheGetJSON");
__name22(cacheGetJSON, "cacheGetJSON");
async function cachePutJSON(url, obj, maxAge = 604800) {
  try {
    await caches.default.put(new Request(url), new Response(JSON.stringify(obj), { headers: { "Content-Type": "application/json", "Cache-Control": `max-age=${maxAge}` } }));
    return true;
  } catch (err) {
    console.error("cachePut soft-fail", err && err.message || err);
    return false;
  }
}
__name(cachePutJSON, "cachePutJSON");
__name2(cachePutJSON, "cachePutJSON");
__name22(cachePutJSON, "cachePutJSON");
function shortHash(t) {
  let h = 5381;
  const s = String(t || "");
  for (let i = 0; i < s.length; i++)
    h = (h << 5) + h + s.charCodeAt(i) >>> 0;
  return h.toString(36);
}
__name(shortHash, "shortHash");
__name2(shortHash, "shortHash");
__name22(shortHash, "shortHash");
function histId(wa, m) {
  return m && m.id ? String(m.id) : `c:${wa}:${Number(m && m.ts) || 0}:${m && m.role || "user"}:${shortHash(String(m && m.text || "").slice(0, 60))}`;
}
__name(histId, "histId");
__name2(histId, "histId");
__name22(histId, "histId");
var WA_RING_MAX = 50;
function waRingUrl(wa) {
  return `https://eh-apk-feed.internal/wa/${String(wa).replace(/\D/g, "")}`;
}
__name(waRingUrl, "waRingUrl");
__name2(waRingUrl, "waRingUrl");
__name22(waRingUrl, "waRingUrl");
async function waRingRead(wa) {
  const j = await cacheGetJSON(waRingUrl(wa), null);
  return j && Array.isArray(j.events) ? j.events : [];
}
__name(waRingRead, "waRingRead");
__name2(waRingRead, "waRingRead");
__name22(waRingRead, "waRingRead");
async function waRingPush(wa, ev) {
  try {
    const evs = (await waRingRead(wa)).filter((x) => x && x.id !== ev.id);
    evs.push(ev);
    evs.sort((a, b) => (Number(a.ts) || 0) - (Number(b.ts) || 0));
    await cachePutJSON(waRingUrl(wa), { updated: Math.floor(Date.now() / 1e3), events: evs.slice(-WA_RING_MAX) });
  } catch (err) {
    console.error("waRingPush soft-fail", err && err.message || err);
  }
}
__name(waRingPush, "waRingPush");
__name2(waRingPush, "waRingPush");
__name22(waRingPush, "waRingPush");
var PENDING_MEM = globalThis.__ehPending || (globalThis.__ehPending = /* @__PURE__ */ new Map());
var PENDING_INDEX_URL = "https://eh-apk-feed.internal/pending-index";
function pendingUrl(wa) {
  return `https://eh-apk-feed.internal/pending/${wa}`;
}
__name(pendingUrl, "pendingUrl");
__name2(pendingUrl, "pendingUrl");
__name22(pendingUrl, "pendingUrl");
async function pendingGet(wa) {
  const mem = PENDING_MEM.get(wa) || [];
  const c = await cacheGetJSON(pendingUrl(wa), null);
  const byId = /* @__PURE__ */ new Map();
  for (const x of [...c && Array.isArray(c.items) ? c.items : [], ...mem])
    if (x && x.id)
      byId.set(x.id, x);
  return [...byId.values()].sort((a, b) => (Number(a.ts) || 0) - (Number(b.ts) || 0));
}
__name(pendingGet, "pendingGet");
__name2(pendingGet, "pendingGet");
__name22(pendingGet, "pendingGet");
async function pendingIndexUpdate(wa, present) {
  const idx = await cacheGetJSON(PENDING_INDEX_URL, { was: [] });
  const set = new Set(Array.isArray(idx.was) ? idx.was : []);
  if (present) {
    if (set.has(wa))
      return;
    set.add(wa);
  } else {
    if (!set.has(wa))
      return;
    set.delete(wa);
  }
  await cachePutJSON(PENDING_INDEX_URL, { was: [...set].slice(-200) }, 7200);
}
__name(pendingIndexUpdate, "pendingIndexUpdate");
__name2(pendingIndexUpdate, "pendingIndexUpdate");
__name22(pendingIndexUpdate, "pendingIndexUpdate");
async function pendingSet(wa, items) {
  const arr = (items || []).slice(-BATCH_MAX * 2);
  if (arr.length)
    PENDING_MEM.set(wa, arr);
  else
    PENDING_MEM.delete(wa);
  await cachePutJSON(pendingUrl(wa), { items: arr }, 7200);
  await pendingIndexUpdate(wa, arr.length > 0);
}
__name(pendingSet, "pendingSet");
__name2(pendingSet, "pendingSet");
__name22(pendingSet, "pendingSet");
async function pendingAdd(wa, item) {
  const cur = await pendingGet(wa);
  if (cur.some((x) => x.id === item.id))
    return;
  cur.push(item);
  await pendingSet(wa, cur);
}
__name(pendingAdd, "pendingAdd");
__name2(pendingAdd, "pendingAdd");
__name22(pendingAdd, "pendingAdd");
async function pendingClear(wa, ids) {
  if (!ids || !ids.length)
    return;
  const cur = await pendingGet(wa);
  const rest = cur.filter((x) => !ids.includes(x.id));
  if (rest.length !== cur.length)
    await pendingSet(wa, rest);
}
__name(pendingClear, "pendingClear");
__name2(pendingClear, "pendingClear");
__name22(pendingClear, "pendingClear");
async function pendingWas() {
  const idx = await cacheGetJSON(PENDING_INDEX_URL, { was: [] });
  return [.../* @__PURE__ */ new Set([...Array.isArray(idx.was) ? idx.was : [], ...PENDING_MEM.keys()])];
}
__name(pendingWas, "pendingWas");
__name2(pendingWas, "pendingWas");
__name22(pendingWas, "pendingWas");
function mergePending(hist, pend) {
  const ids = new Set((hist || []).map((h) => h && h.id).filter(Boolean));
  const add = (pend || []).filter((p) => p && p.id && !ids.has(p.id)).sort((a, b) => (Number(a.ts) || 0) - (Number(b.ts) || 0));
  return { hist: [...hist || [], ...add], added: add };
}
__name(mergePending, "mergePending");
__name2(mergePending, "mergePending");
__name22(mergePending, "mergePending");
var COOLDOWN_MEM = globalThis.__ehCooldown || (globalThis.__ehCooldown = /* @__PURE__ */ new Map());
async function globalCooldown(key, gapS) {
  const now = Math.floor(Date.now() / 1e3);
  const url = `https://eh-ai-health.internal/cooldown/${encodeURIComponent(key)}`;
  let last = Number(COOLDOWN_MEM.get(key) || 0);
  if (!last) {
    const c = await cacheGetJSON(url, null);
    last = Number(c && c.at || 0);
  }
  if (last && now - last < gapS)
    return false;
  COOLDOWN_MEM.set(key, now);
  await cachePutJSON(url, { at: now }, Math.max(60, gapS));
  return true;
}
__name(globalCooldown, "globalCooldown");
__name2(globalCooldown, "globalCooldown");
__name22(globalCooldown, "globalCooldown");
var PING_COOLDOWN_S = 120;
var PING_NEW_SILENCE_S = 14 * DAY;
var PING_RELANCE_SILENCE_S = 6 * 3600;
var PINGS_STATE = globalThis.__ehPingsState || (globalThis.__ehPingsState = { at: 0, on: true });
async function pingsEnabled(env) {
  if (Date.now() - PINGS_STATE.at < 60 * 1e3)
    return PINGS_STATE.on;
  let v = null;
  try {
    v = await env.EH_KV.get("cfg:pings");
  } catch {
  }
  PINGS_STATE.on = String(v || "on").toLowerCase() !== "off";
  PINGS_STATE.at = Date.now();
  return PINGS_STATE.on;
}
__name(pingsEnabled, "pingsEnabled");
__name2(pingsEnabled, "pingsEnabled");
__name22(pingsEnabled, "pingsEnabled");
function pingKind(prevUserTs, now) {
  const p = Number(prevUserTs) || 0;
  if (!p || now - p > PING_NEW_SILENCE_S)
    return "new";
  if (now - p > PING_RELANCE_SILENCE_S)
    return "relance";
  return null;
}
__name(pingKind, "pingKind");
__name2(pingKind, "pingKind");
__name22(pingKind, "pingKind");
function pingLine(kind, e, prevUserTs, now) {
  const who2 = `${String(e.name || "?").replace(/\s+/g, " ").slice(0, 40)} (${e.from})`;
  const prev = String(e.text || `[${e.type || "msg"}]`).replace(/\s+/g, " ").slice(0, 70);
  if (kind === "new")
    return `\u{1F195} Nouveau \xB7 ${who2} : \xAB ${prev} \xBB`;
  const h = Math.round((now - Number(prevUserTs || now)) / 3600);
  return `\u{1F501} Relance (${h} h) \xB7 ${who2} : \xAB ${prev} \xBB`;
}
__name(pingLine, "pingLine");
__name2(pingLine, "pingLine");
__name22(pingLine, "pingLine");
async function maybePing97(env, e, kind, prevUserTs, now) {
  if (!kind)
    return null;
  if (!await pingsEnabled(env))
    return "off";
  if (!await globalCooldown("ping_move", PING_COOLDOWN_S))
    return "cooldown";
  try {
    await ownerNotify(env, pingLine(kind, e, prevUserTs, now), { phoneId: e.phone_number_id, wa: e.from, kind: "ping", queue: false });
  } catch (err) {
    console.error("ping97 soft-fail", err && err.message || err);
  }
  return kind;
}
__name(maybePing97, "maybePing97");
__name2(maybePing97, "maybePing97");
__name22(maybePing97, "maybePing97");
async function alertOwnerOnce(env, wa, kind, body, phoneId) {
  if (!await globalCooldown(`alert_${kind}_${wa}`, ALERT_GAP_S))
    return false;
  try {
    await ownerNotify(env, body, { phoneId, wa, kind });
    return true;
  } catch {
    return false;
  }
}
__name(alertOwnerOnce, "alertOwnerOnce");
__name2(alertOwnerOnce, "alertOwnerOnce");
__name22(alertOwnerOnce, "alertOwnerOnce");
var FCM_TOK = globalThis.__ehFcmTok || (globalThis.__ehFcmTok = { tok: null, exp: 0 });
var FCM_TOPIC_DEFAULT = "eh_owner";
function fcmConfig(env) {
  try {
    if (!env.FCM_SERVICE_ACCOUNT)
      return null;
    const j = typeof env.FCM_SERVICE_ACCOUNT === "string" ? JSON.parse(env.FCM_SERVICE_ACCOUNT) : env.FCM_SERVICE_ACCOUNT;
    const project = env.FCM_PROJECT_ID || j.project_id;
    if (!j.client_email || !j.private_key || !project)
      return null;
    return { email: j.client_email, key: j.private_key, project, tokenUri: j.token_uri || "https://oauth2.googleapis.com/token" };
  } catch {
    return null;
  }
}
__name(fcmConfig, "fcmConfig");
__name2(fcmConfig, "fcmConfig");
__name22(fcmConfig, "fcmConfig");
function b64url(input) {
  const bytes = typeof input === "string" ? new TextEncoder().encode(input) : new Uint8Array(input);
  let bin = "";
  for (let i = 0; i < bytes.length; i++)
    bin += String.fromCharCode(bytes[i]);
  return btoa(bin).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}
__name(b64url, "b64url");
__name2(b64url, "b64url");
__name22(b64url, "b64url");
async function fcmAccessToken(cfg) {
  const now = Math.floor(Date.now() / 1e3);
  if (FCM_TOK.tok && FCM_TOK.exp - 120 > now && FCM_TOK.email === cfg.email)
    return FCM_TOK.tok;
  const pem = String(cfg.key).replace(/-----[^-]+-----/g, "").replace(/\s+/g, "");
  const der = Uint8Array.from(atob(pem), (c) => c.charCodeAt(0));
  const key = await crypto.subtle.importKey("pkcs8", der, { name: "RSASSA-PKCS1-v1_5", hash: "SHA-256" }, false, ["sign"]);
  const head = b64url(JSON.stringify({ alg: "RS256", typ: "JWT" }));
  const claim = b64url(JSON.stringify({ iss: cfg.email, scope: "https://www.googleapis.com/auth/firebase.messaging", aud: cfg.tokenUri, iat: now, exp: now + 3600 }));
  const sig = await crypto.subtle.sign("RSASSA-PKCS1-v1_5", key, new TextEncoder().encode(`${head}.${claim}`));
  const jwt = `${head}.${claim}.${b64url(sig)}`;
  const r = await fetch(cfg.tokenUri, { method: "POST", headers: { "Content-Type": "application/x-www-form-urlencoded" }, body: `grant_type=${encodeURIComponent("urn:ietf:params:oauth:grant-type:jwt-bearer")}&assertion=${jwt}`, signal: AbortSignal.timeout(8e3) });
  const j = await r.json().catch(() => null);
  if (!r.ok || !j || !j.access_token)
    throw new Error(`fcm oauth HTTP ${r.status}`);
  FCM_TOK.tok = j.access_token;
  FCM_TOK.exp = now + (Number(j.expires_in) || 3600);
  FCM_TOK.email = cfg.email;
  return FCM_TOK.tok;
}
__name(fcmAccessToken, "fcmAccessToken");
__name2(fcmAccessToken, "fcmAccessToken");
__name22(fcmAccessToken, "fcmAccessToken");
async function fcmSend(env, data) {
  const cfg = fcmConfig(env);
  if (!cfg)
    return { ok: false, skipped: "fcm_not_configured" };
  try {
    const tok = await fcmAccessToken(cfg);
    const d = {};
    for (const [k, v] of Object.entries(data || {}))
      if (v != null)
        d[k] = String(v).slice(0, k === "preview" ? 120 : 60);
    const msg = { message: { topic: env.FCM_TOPIC || FCM_TOPIC_DEFAULT, data: d, android: { priority: "HIGH", ttl: "3600s" } } };
    const r = await fetch(`https://fcm.googleapis.com/v1/projects/${cfg.project}/messages:send`, { method: "POST", headers: { Authorization: `Bearer ${tok}`, "Content-Type": "application/json" }, body: JSON.stringify(msg), signal: AbortSignal.timeout(8e3) });
    if (r.status === 401)
      FCM_TOK.tok = null;
    const body = await r.text();
    if (!r.ok)
      console.error("fcm send fail", r.status, body.slice(0, 160));
    return { ok: r.ok, status: r.status };
  } catch (err) {
    console.error("fcm soft-fail", err && err.message || err);
    return { ok: false, error: String(err && err.message || err).slice(0, 120) };
  }
}
__name(fcmSend, "fcmSend");
__name2(fcmSend, "fcmSend");
__name22(fcmSend, "fcmSend");
async function fcmNotifyInbound(env, e) {
  if (!e || !e.from || OWNER_WAS.has(e.from) || isTestWa(e.from))
    return { skipped: "owner" };
  return fcmSend(env, { type: "msg", role: "user", wa: e.from, name: e.name || "", preview: String(e.text || `[${e.type || "msg"}]`).replace(/\s+/g, " "), ts: String(Number(e.ts) || Math.floor(Date.now() / 1e3)), id: e.id || "" });
}
__name(fcmNotifyInbound, "fcmNotifyInbound");
__name2(fcmNotifyInbound, "fcmNotifyInbound");
__name22(fcmNotifyInbound, "fcmNotifyInbound");
var MEDIA_FWD_TYPES = /* @__PURE__ */ new Set(["image", "video", "document", "audio", "voice"]);
var MEDIA_CACHE_MAX = 15 * 1024 * 1024;
var OWNER_WINDOW_URL = "https://eh-ai-health.internal/owner-window";
async function ownerWindowTouch(env, now) {
  await cachePutJSON(OWNER_WINDOW_URL, { seen: now, closed_at: 0 }, 7 * 86400);
  await ownerDo(env, "/kv?k=owner_in", "PUT", now);
}
__name(ownerWindowTouch, "ownerWindowTouch");
__name2(ownerWindowTouch, "ownerWindowTouch");
__name22(ownerWindowTouch, "ownerWindowTouch");
async function ownerWindowOpen(env, now = Math.floor(Date.now() / 1e3)) {
  if (env && env.CONV_DO)
    return (await ownerWindowState(env, now)).open;
  const w = await cacheGetJSON(OWNER_WINDOW_URL, null);
  if (!w)
    return true;
  if (w.closed_at && w.closed_at >= (w.seen || 0))
    return now - w.closed_at > 6 * 3600;
  if (w.seen && now - w.seen > 24 * 3600 - 300)
    return false;
  return true;
}
__name(ownerWindowOpen, "ownerWindowOpen");
__name2(ownerWindowOpen, "ownerWindowOpen");
__name22(ownerWindowOpen, "ownerWindowOpen");
async function ownerSendFailed(env, st) {
  const codes = (st.errors || []).map((x) => Number(x && x.code));
  console.warn("owner_send_failed", st.id, codes.join(","));
  if (!codes.some((c) => c === 131047 || c === 131026 || c === 131051 || c === 470))
    return;
  const w = await cacheGetJSON(OWNER_WINDOW_URL, null) || {};
  await cachePutJSON(OWNER_WINDOW_URL, { seen: Number(w.seen) || 0, closed_at: Math.floor(Date.now() / 1e3) }, 7 * 86400);
  await ownerDo(env, "/kv?k=owner_closed", "PUT", Math.floor(Date.now() / 1e3));
  const lost = st.id ? await ownerDo(env, `/sent?id=${encodeURIComponent(st.id)}`, "DELETE") : null;
  if (lost && lost.item)
    await ownerQueuePush(env, lost.item);
  await logEvent(env, { k: "owner_send_failed", text: `${st.id} ${codes.join(",")}${lost ? " (re-queued)" : ""}` });
  if (await globalCooldown("owner_window_fcm", 30 * 60))
    await fcmSend(env, { type: "owner_alert", role: "user", wa: "", name: "EH Bo\xEEte", preview: "\u26A0\uFE0F Alertes WhatsApp au 97 non livr\xE9es (fen\xEAtre 24 h ferm\xE9e). Envoie un message au num\xE9ro du bot pour la rouvrir ; tout reste visible dans l'APK.", ts: String(Math.floor(Date.now() / 1e3)), id: String(st.id || "") });
}
__name(ownerSendFailed, "ownerSendFailed");
__name2(ownerSendFailed, "ownerSendFailed");
__name22(ownerSendFailed, "ownerSendFailed");
function mediaCaption(e, meta) {
  const m = meta || {};
  const inPay = m.stage === "wait_pay" || m.stage === "wait_proof" || !!m.price;
  const label = e.type === "image" ? inPay ? "\u{1F9FE} Capture de paiement \u2014 \xE0 v\xE9rifier" : "\u{1F4F7} Image client" : e.type === "video" ? "\u{1F3AC} Vid\xE9o client" : e.type === "document" ? "\u{1F4C4} Document client" : "\u{1F3A4} Vocal client";
  const num = String(e.from || "").replace(/\D/g, "");
  const lines = [`${label} \u2014 ${e.name || "?"} (+${num})`];
  if (m.product)
    lines.push(`\u{1F4E6} ${m.product}${m.price ? ` ~${fmtF2(m.price)} F` : ""}`);
  const txt = e.transcript ? `\xAB ${e.transcript} \xBB` : e.caption ? e.caption : "";
  if (txt)
    lines.push(`\u{1F4AC} ${String(txt).replace(/\s+/g, " ").slice(0, 300)}`);
  if (e.type === "document" && e.filename)
    lines.push(`\u{1F4CE} ${String(e.filename).slice(0, 80)}`);
  lines.push(`\u21AA\uFE0F r\xE9ponds au ${num} : \u2026`);
  return lines.join("\n").slice(0, 1e3);
}
__name(mediaCaption, "mediaCaption");
__name2(mediaCaption, "mediaCaption");
__name22(mediaCaption, "mediaCaption");
async function sendMediaById(env, phoneId, to, kind, id, caption, filename) {
  const obj = { id };
  if (caption && kind !== "audio")
    obj.caption = String(caption).slice(0, 1e3);
  if (kind === "document" && filename)
    obj.filename = String(filename).slice(0, 120);
  phoneId = await lineRoute(env, phoneId, to);
  const r = await fetch(`${graphBase(env)}/${phoneId}/messages`, {
    method: "POST",
    headers: { Authorization: `Bearer ${env.WA_TOKEN}`, "Content-Type": "application/json" },
    body: JSON.stringify({ messaging_product: "whatsapp", to, type: kind, [kind]: obj })
  });
  const out = { status: r.status, body: await r.text() };
  await rememberOwnerMsg(to, caption, out, env);
  await logOut(env, to, kind, `[${kind}]${caption ? " " + caption : ""}`, out);
  return out;
}
__name(sendMediaById, "sendMediaById");
__name2(sendMediaById, "sendMediaById");
__name22(sendMediaById, "sendMediaById");
async function graphMediaFetch(env, mediaId) {
  if (!mediaId || !env.WA_TOKEN)
    return null;
  try {
    const meta = await fetch(`${graphBase(env)}/${mediaId}`, { headers: { Authorization: `Bearer ${env.WA_TOKEN}` }, signal: AbortSignal.timeout(8e3) });
    if (!meta.ok)
      return null;
    const mj = await meta.json();
    if (!mj || !mj.url)
      return null;
    const bin = await fetch(mj.url, { headers: { Authorization: `Bearer ${env.WA_TOKEN}` }, signal: AbortSignal.timeout(15e3) });
    if (!bin.ok)
      return null;
    return { buf: await bin.arrayBuffer(), mime: mj.mime_type || bin.headers.get("Content-Type") || "application/octet-stream" };
  } catch (err) {
    console.error("graphMediaFetch soft-fail", err && err.message || err);
    return null;
  }
}
__name(graphMediaFetch, "graphMediaFetch");
__name2(graphMediaFetch, "graphMediaFetch");
__name22(graphMediaFetch, "graphMediaFetch");
async function reuploadMedia(env, phoneId, mediaId, filename, to) {
  if (to)
    phoneId = await lineRoute(env, phoneId, to);
  const m = await graphMediaFetch(env, mediaId);
  if (!m)
    return null;
  try {
    const fd = new FormData();
    fd.append("messaging_product", "whatsapp");
    fd.append("type", m.mime);
    fd.append("file", new Blob([m.buf], { type: m.mime }), filename || "media");
    const r = await fetch(`${graphBase(env)}/${phoneId}/media`, { method: "POST", headers: { Authorization: `Bearer ${env.WA_TOKEN}` }, body: fd, signal: AbortSignal.timeout(2e4) });
    if (!r.ok)
      return null;
    const j = await r.json();
    return j && j.id ? String(j.id) : null;
  } catch (err) {
    console.error("reuploadMedia soft-fail", err && err.message || err);
    return null;
  }
}
__name(reuploadMedia, "reuploadMedia");
__name2(reuploadMedia, "reuploadMedia");
__name22(reuploadMedia, "reuploadMedia");
async function forwardMediaToOwner(env, e, meta) {
  if (isTestWa(e.from)) {
    await logEvent(env, { k: "owner_alert_test_suppressed", wa: e.from, kind: "media_fwd", text: `[${e.type}]` });
    return { ok: false, reason: "test_number" };
  }
  const kind = e.type === "voice" ? "audio" : e.type;
  const caption = mediaCaption(e, meta);
  const phoneId = OWNER_PHONE_DEFAULT;
  if (!await ownerWindowOpen(env)) {
    await fcmSend(env, { type: "owner_alert", role: "user", wa: String(e.from), name: e.name || "", preview: `${caption.split("\n")[0]} \u2014 97 hors fen\xEAtre 24 h : voir l'APK`, ts: String(Math.floor(Date.now() / 1e3)), id: String(e.id || "") });
    console.log("media_fwd skipped owner_window_closed", kind);
    return { ok: false, reason: "owner_window_closed" };
  }
  let r = await sendMediaById(env, phoneId, OWNER_NOTIFY_WA, kind, e.media_id, caption, e.filename);
  let via = "id";
  if (r.status >= 300) {
    const nid = await reuploadMedia(env, phoneId, e.media_id, e.filename);
    if (nid) {
      r = await sendMediaById(env, phoneId, OWNER_NOTIFY_WA, kind, nid, caption, e.filename);
      via = "reupload";
    }
  }
  const ok = r.status < 300;
  if (ok && kind === "audio") {
    try {
      await sendText(env, phoneId, OWNER_NOTIFY_WA, caption);
    } catch {
    }
  }
  console.log("media_fwd", kind, via, r.status);
  return { ok, via, status: r.status };
}
__name(forwardMediaToOwner, "forwardMediaToOwner");
__name2(forwardMediaToOwner, "forwardMediaToOwner");
__name22(forwardMediaToOwner, "forwardMediaToOwner");
var STORAGE_SIZES = /* @__PURE__ */ new Set(["16", "32", "64", "128", "256", "512", "1"]);
function storagesIn(hayM) {
  const out = /* @__PURE__ */ new Set();
  for (const m of hayM.matchAll(/ (\d{1,4}) (go|gb|g|to|tb) /g))
    if (STORAGE_SIZES.has(m[1]))
      out.add(m[1]);
  return out;
}
__name(storagesIn, "storagesIn");
__name2(storagesIn, "storagesIn");
__name22(storagesIn, "storagesIn");
function photoIndexMatch(hayText) {
  const hay = mnorm(hayText) + " ";
  const sto = storagesIn(hay);
  let best = null;
  for (const p of PHOTO_INDEX || []) {
    const key = mnorm(p.model).trim();
    if (!key || !hay.includes(` ${key} `))
      continue;
    if (p.storage && sto.size && !sto.has(String(p.storage)))
      continue;
    if (!best || key.length > best.key.length)
      best = { key, url: p.url, id: p.id, title: p.title };
  }
  return best;
}
__name(photoIndexMatch, "photoIndexMatch");
__name2(photoIndexMatch, "photoIndexMatch");
__name22(photoIndexMatch, "photoIndexMatch");
var PUBLIC_BASE = "https://eh-whatsapp.domingohoreb.workers.dev";
function photoSlug(t) {
  return norm(t).replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 60);
}
__name(photoSlug, "photoSlug");
__name2(photoSlug, "photoSlug");
__name22(photoSlug, "photoSlug");
async function ownerSavePhoto(env, e) {
  const model = String(e.caption || "").replace(/^\s*(photo|image|visuel)\s+(pour\s+)?(du|de\s+la|de\s+l['’]|de|des)?\s*/i, "").replace(/\s+/g, " ").trim().slice(0, 60);
  if (model.length < 2)
    return { ok: false, error: "l\xE9gende vide \u2014 \xE9crivez \xAB photo <mod\xE8le> \xBB, ex. \xAB photo Samsung Galaxy S24 Ultra \xBB" };
  const m = await graphMediaFetch(env, e.media_id);
  if (!m)
    return { ok: false, error: "image illisible chez Meta (r\xE9essayez)" };
  if (m.buf.byteLength > 5 * 1024 * 1024)
    return { ok: false, error: "image trop lourde (> 5 Mo)" };
  const slug = photoSlug(model);
  const ext = /png/.test(m.mime) ? "png" : "jpg";
  await env.EH_KV.put(`img:${slug}`, m.buf, { metadata: { mime: m.mime, title: model } });
  const map = await getJSON(env, "cfg:product_images", {}) || {};
  map[model.toLowerCase()] = `${PUBLIC_BASE}/img/${slug}.${ext}`;
  await env.EH_KV.put("cfg:product_images", JSON.stringify(map));
  PRODUCT_IMAGES_CACHE.at = 0;
  return { ok: true, model, count: Object.keys(map).length };
}
__name(ownerSavePhoto, "ownerSavePhoto");
__name2(ownerSavePhoto, "ownerSavePhoto");
__name22(ownerSavePhoto, "ownerSavePhoto");
var PRODUCT_IMAGES_CACHE = { at: 0, map: null };
async function findProductImage(env, productLabel, text) {
  const hayRaw = `${productLabel || ""} ${text || ""}`;
  try {
    if (!PRODUCT_IMAGES_CACHE.map || Date.now() - PRODUCT_IMAGES_CACHE.at > 5 * 60 * 1e3)
      PRODUCT_IMAGES_CACHE = { at: Date.now(), map: await getJSON(env, "cfg:product_images", null) };
    const map = PRODUCT_IMAGES_CACHE.map;
    if (map && typeof map === "object") {
      const hay = ` ${norm(hayRaw).replace(/[^a-z0-9+]+/g, " ").replace(/\b([asmz])\s+(\d{2})\b/g, "$1$2")} `;
      const FILL = /\b(samsung|galaxy|apple|google|telephone|smartphone|le|la|du|de)\b/g;
      let best = null;
      for (const [k, url] of Object.entries(map)) {
        const kn = norm(k).replace(/[^a-z0-9+]+/g, " ").trim();
        const core = kn.replace(FILL, " ").replace(/\s+/g, " ").trim().split(" ").filter(Boolean);
        const hit = kn && (hay.includes(` ${kn} `) || core.length && core.some((w) => /\d/.test(w)) && core.every((w) => hay.includes(` ${w} `)));
        if (hit && /^https:\/\//.test(String(url)) && (!best || kn.length > best.k.length))
          best = { k: kn, url: String(url) };
      }
      if (best)
        return best.url;
    }
  } catch {
  }
  try {
    const m = photoIndexMatch(String(text || "")) || photoIndexMatch(String(productLabel || ""));
    return m ? m.url : null;
  } catch {
    return null;
  }
}
__name(findProductImage, "findProductImage");
__name2(findProductImage, "findProductImage");
__name22(findProductImage, "findProductImage");
var AIKEYS_UA_RE = /^EH-Failover\/\d/;
var AIKEYS_RL_MAX = 10;
function ipv4ToInt(ip) {
  const p = String(ip || "").split(".");
  if (p.length !== 4 || p.some((x) => !/^\d{1,3}$/.test(x) || +x > 255))
    return null;
  return (+p[0] << 24 >>> 0) + (+p[1] << 16) + (+p[2] << 8) + +p[3];
}
__name(ipv4ToInt, "ipv4ToInt");
__name2(ipv4ToInt, "ipv4ToInt");
__name22(ipv4ToInt, "ipv4ToInt");
function ipAllowed(ip, cidrsStr) {
  const list = String(cidrsStr || "").split(/[\s,;]+/).map((x) => x.trim()).filter(Boolean);
  if (!list.length)
    return true;
  const n = ipv4ToInt(ip);
  for (const c of list) {
    const [base, bitsS] = c.split("/");
    if (base.includes(":")) {
      if (String(ip).toLowerCase().startsWith(base.toLowerCase().replace(/::?$/, "")))
        return true;
      continue;
    }
    const b = ipv4ToInt(base);
    const bits = bitsS == null ? 32 : Number(bitsS);
    if (n == null || b == null || !(bits >= 0 && bits <= 32))
      continue;
    const mask = bits === 0 ? 0 : ~0 << 32 - bits >>> 0;
    if ((n & mask) >>> 0 === (b & mask) >>> 0)
      return true;
  }
  return false;
}
__name(ipAllowed, "ipAllowed");
__name2(ipAllowed, "ipAllowed");
__name22(ipAllowed, "ipAllowed");
function safeEq(a, b) {
  a = String(a || "");
  b = String(b || "");
  if (a.length !== b.length)
    return false;
  let r = 0;
  for (let i = 0; i < a.length; i++)
    r |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return r === 0;
}
__name(safeEq, "safeEq");
__name2(safeEq, "safeEq");
__name22(safeEq, "safeEq");
async function hourCounter(name, inc = 1) {
  const bucket = Math.floor(Date.now() / 36e5);
  const url = `https://eh-ai-health.internal/ctr/${name}/${bucket}`;
  const mem = globalThis.__ehCtr || (globalThis.__ehCtr = /* @__PURE__ */ new Map());
  const k = `${name}:${bucket}`;
  const c = await cacheGetJSON(url, null);
  const n = Math.max(Number(mem.get(k) || 0), Number(c && c.n || 0)) + inc;
  if (inc) {
    mem.set(k, n);
    await cachePutJSON(url, { n }, 3700);
  }
  return n;
}
__name(hourCounter, "hourCounter");
__name2(hourCounter, "hourCounter");
__name22(hourCounter, "hourCounter");
async function aiKeysDeny(req, status, reason) {
  const ip = req.headers.get("cf-connecting-ip") || "?";
  const ua = String(req.headers.get("user-agent") || "").slice(0, 40);
  console.warn(`ai_keys_denied status=${status} reason=${reason} ip=${ip} ua=${ua}`);
  try {
    await hourCounter("aikeys_denied");
  } catch {
  }
  return new Response(JSON.stringify({ error: status === 429 ? "Too many requests" : status === 401 ? "Unauthorized" : "Forbidden" }), { status, headers: { "Content-Type": "application/json" } });
}
__name(aiKeysDeny, "aiKeysDeny");
__name2(aiKeysDeny, "aiKeysDeny");
__name22(aiKeysDeny, "aiKeysDeny");
async function handleAiKeys(req, env, url) {
  if (req.method !== "GET")
    return aiKeysDeny(req, 405, "method");
  if (url.searchParams.has("secret"))
    return aiKeysDeny(req, 401, "secret_in_query");
  const secret = req.headers.get("x-failover-secret") || "";
  const expected = env.FAILOVER_SECRET || "";
  if (!expected || !secret || !safeEq(secret, expected))
    return aiKeysDeny(req, 401, "bad_secret");
  const ua = req.headers.get("user-agent") || "";
  if (!AIKEYS_UA_RE.test(ua))
    return aiKeysDeny(req, 403, "not_render_ua");
  const ip = req.headers.get("cf-connecting-ip") || "";
  if (env.RENDER_EGRESS_CIDRS && !ipAllowed(ip, env.RENDER_EGRESS_CIDRS))
    return aiKeysDeny(req, 403, "not_render_ip");
  const n = await hourCounter("aikeys_ok");
  if (n > AIKEYS_RL_MAX)
    return aiKeysDeny(req, 429, "rate_10h");
  const needInfra = /infra|boot/i.test(req.headers.get("x-eh-need") || "");
  console.log(`ai_keys_served infra=${needInfra} ip=${ip} n=${n}`);
  const body = {
    GEMINI_API_KEY: env.GEMINI_API_KEY || "",
    GROQ_API_KEY: env.GROQ_API_KEY || "",
    OPENROUTER_API_KEY: env.OPENROUTER_API_KEY || "",
    MISTRAL_API_KEY: env.MISTRAL_API_KEY || "",
    HF_TOKEN: env.HF_TOKEN || "",
    COHERE_API_KEY: env.COHERE_API_KEY || "",
    CF_ACCOUNT_ID: env.EH_CF_ACCOUNT_ID || "",
    EH_KV_NAMESPACE_ID: env.EH_KV_NAMESPACE_ID || "1d7180f8ae3a40a4a7403f82f4af6eec",
    infra_included: needInfra,
    ai_chain: ["gemini", "groq", "openrouter", "mistral", "huggingface", "cohere", "workers_ai", "catalogue", "filet"]
  };
  if (needInfra) {
    body.CF_AI_TOKEN = env.CF_AI_TOKEN || "";
    body.EH_KV_REST_TOKEN = env.EH_KV_REST_TOKEN || "";
  }
  return new Response(JSON.stringify(body), { headers: { "Content-Type": "application/json", "Cache-Control": "no-store" } });
}
__name(handleAiKeys, "handleAiKeys");
__name2(handleAiKeys, "handleAiKeys");
__name22(handleAiKeys, "handleAiKeys");
async function apkThreadMessages(env, wa, limit = WA_RING_MAX) {
  let kvHist = [];
  let source = "kv";
  try {
    kvHist = await getJSON(env, `conv:${wa}`, []);
  } catch {
    kvHist = [];
  }
  if (!Array.isArray(kvHist))
    kvHist = [];
  try {
    const dj = await convDoGet(env, wa);
    if (dj && Array.isArray(dj.hist))
      kvHist = mergeHist(kvHist, dj.hist);
  } catch {
  }
  const byId = /* @__PURE__ */ new Map();
  const add = /* @__PURE__ */ __name2((m, src) => {
    if (!m)
      return;
    const role = m.role === "assistant" || m.role === "owner" ? m.role : "user";
    const id = histId(wa, { ...m, role });
    if (byId.has(id))
      return;
    byId.set(id, { id, role, text: String(m.text || "").slice(0, 800), ts: Number(m.ts) || 0, src, type: m.type || "text", ...m.media_id ? { media_id: String(m.media_id), mime: m.mime || null } : {} });
  }, "add");
  for (const m of kvHist)
    add(m, "kv");
  let ring = [];
  try {
    ring = await waRingRead(wa);
  } catch {
  }
  const sig = new Set([...byId.values()].map((x) => `${x.role}|${x.text.slice(0, 60)}|${Math.round(x.ts / 10)}`));
  for (const m of ring) {
    const role = m.role === "assistant" || m.role === "owner" ? m.role : "user";
    const s1 = `${role}|${String(m.text || "").slice(0, 60)}|${Math.round((Number(m.ts) || 0) / 10)}`;
    if (!byId.has(m.id) && sig.has(s1))
      continue;
    add(m, "cache");
  }
  try {
    for (const p of await pendingGet(wa))
      add(p, "pending");
  } catch {
  }
  if (!kvHist.length)
    source = ring.length ? "cache" : "none";
  const messages = [...byId.values()].sort((a, b) => a.ts - b.ts || (a.role === "user" ? -1 : 1)).slice(-limit);
  return { source, messages };
}
__name(apkThreadMessages, "apkThreadMessages");
__name2(apkThreadMessages, "apkThreadMessages");
__name22(apkThreadMessages, "apkThreadMessages");
function ehxDigitalEntry(raw, price) {
  const out = [];
  try {
    digitalRows([["Categorie", "Produit", "Prix (FCFA)", "Garantie", "Remarques", "Commission ou pas"], ["", String(raw), String(price), "", "", "Avec commission"]], out, {});
  } catch {
  }
  return out[0] || null;
}
__name(ehxDigitalEntry, "ehxDigitalEntry");
function ehxDeps() {
  const d = {
    convStub,
    sendText,
    ownerNotifyRaw,
    ownerQueuePush,
    ownerQueueGet,
    ownerWindowState,
    logEvent,
    runAiChain,
    norm,
    toWaId,
    linesCfg,
    linePauseGet,
    linePauseSet,
    ownerLinesCommand,
    listOpenFlags,
    buildWhoSpeaksHealth,
    runSheetSync,
    loadPrices,
    priceLookup,
    digitalLookup,
    parseCsv,
    digitalEntry: ehxDigitalEntry,
    SHEET_DIGITAL,
    SHEET_PHONES,
    CLIENT_MARKUP,
    OWNER_PHONE_DEFAULT,
    OWNER_NOTIFY_WA,
    OWNER_HELP_OLD: OWNER_HELP,
    journalPost,
    hubNotify: (env, body, o) => ownerNotify(env, body, o),
    salesCommand: typeof ehSalesCommand === "function" ? ehSalesCommand : null,
    extraReport: typeof ehSalesReport === "function" ? ehSalesReport : null
  };
  d.supCommand = (env, e, raw, n) => supCommand(env, d, e, raw, n);
  d.supStatusBrief = (env) => supStatusBrief(env, d);
  d.supLooksLikeList = (t) => looksLikePriceList(t, { strict: true });
  d.supParseList = (env, t, o) => supParseList(env, d, t, o);
  d.proposalsText = proposalsText;
  return d;
}
__name(ehxDeps, "ehxDeps");
async function fbTickFromWaCron(env, event) {
  try {
    if (!env.FB || !env.ADMIN_KEY) {
      console.error("fb-tick: FB binding or ADMIN_KEY missing");
      return;
    }
    const now = Date.now();
    try {
      const lc = await env.EH_KV.get("fb:last_cron", "json");
      if (lc && lc.at && now - lc.at < 10 * 6e4) {
        console.log("fb-tick: skipped, eh-facebook own cron active", lc.at);
        return;
      }
      const lt = await env.EH_KV.get("fb:last_tick", "json");
      if (lt && lt.at && lt.via !== "wa-cron" && now - lt.at < 10 * 6e4) {
        console.log("fb-tick: skipped, other tick path active", lt.via, lt.at);
        return;
      }
    } catch (e) {
    }
    const r = await env.FB.fetch(new Request(`https://eh-facebook/admin/tick?via=wa-cron&key=${encodeURIComponent(env.ADMIN_KEY)}`, { method: "POST" }));
    const body = await r.text().catch(() => "");
    if (r.ok)
      console.log("fb-tick", r.status, body.slice(0, 400));
    else
      console.error("fb-tick failed", r.status, body.slice(0, 200));
  } catch (e) {
    console.error("fb-tick error", e && e.message || e);
  }
}
__name(fbTickFromWaCron, "fbTickFromWaCron");
__name2(fbTickFromWaCron, "fbTickFromWaCron");
var src_default = {
  async scheduled(event, env, ctx) {
    ctx.waitUntil(fbTickFromWaCron(env, event));
    ctx.waitUntil((async () => {
      try {
        await supCron(env, ehxDeps(), event);
      } catch (e) {
        console.error("supCron", e);
      }
      try {
        await maybeDailySheetSync(env, event);
      } catch (e) {
        console.error(e);
      }
      try {
        await sweepUnanswered(env);
      } catch (e) {
        console.error(e);
      }
      try {
        if (await env.EH_KV.get("cfg:gcontacts_rt")) {
          const cs = await contactsSync(env, { max: 25 });
          if (cs.created || cs.errors || cs.reason)
            console.log("contacts_sync", JSON.stringify(cs));
        }
      } catch (e) {
        console.error("contacts_sync", e);
      }
      try {
        await sweepEveningFollowups(env);
      } catch (e) {
        console.error(e);
      }
      try {
        await sweepFollowups(env);
        await runPromoJob(env);
      } catch (e) {
        console.error(e);
      }
      try {
        await maybeCronProbe(env);
      } catch (e) {
        console.error(e);
      }
      try {
        await wakeRender();
      } catch (e) {
        console.error(e);
      }
      try {
        await maybeAutoNiveau6(env);
      } catch (e) {
        console.error(e);
      }
      try {
        await sweepOrphans(env);
      } catch (e) {
        console.error(e);
      }
      try {
        await ownerMaybeFlush(env);
      } catch (e) {
        console.error(e);
      }
    })());
  },
  async fetch(req, env, ctx) {
    const url = new URL(req.url);
    if (url.pathname === "/site-chat")
      return handleSiteChat(req, env);
    if (url.pathname === "/internal/fb-vision") {
      if (req.method !== "POST" || !env.ADMIN_KEY || req.headers.get("x-eh-internal") !== env.ADMIN_KEY)
        return new Response("Forbidden", { status: 403 });
      return json(await fbVision(env, req));
    }
    if (url.pathname === "/admin/fb-sim" && req.method === "POST") {
      if (!isAdmin(env, url))
        return new Response("Forbidden", { status: 403 });
      let b = {};
      try {
        b = await req.json();
      } catch {
      }
      const said = [], results = [];
      for (const m of (Array.isArray(b.msgs) ? b.msgs : []).slice(0, 12)) {
        const e = { from: FBM_OWNER, type: m.type || "text", text: m.text || null, caption: m.caption || null, mime: m.mime || null, _bytes: m.b64 ? Uint8Array.from(atob(m.b64), (c) => c.charCodeAt(0)).buffer : null };
        const r = await ownerFbMode(env, e, { key: "fb:wa_mode:test", test: true, say: async (t) => {
          said.push(t);
        } });
        results.push(r === true ? "command" : r === false ? "not_consumed(normal owner flow)" : { queued: r.queued, kind: r.kind, err: r.res && (r.res.err || r.res.error) || null });
      }
      return json({ ok: true, said, results, mode: await fbmGet(env, "fb:wa_mode:test") });
    }
    if (url.pathname === "/internal/fb-ai" || url.pathname === "/internal/fb-notify") {
      if (req.method !== "POST" || !env.ADMIN_KEY || req.headers.get("x-eh-internal") !== env.ADMIN_KEY)
        return new Response("Forbidden", { status: 403 });
      let b = {};
      try {
        b = await req.json();
      } catch {
      }
      if (url.pathname === "/internal/fb-ai") {
        const msgs = (Array.isArray(b.msgs) ? b.msgs : []).slice(0, 6).map((m) => ({ role: m && m.role === "system" ? "system" : m && m.role === "assistant" ? "assistant" : "user", content: String(m && m.content || "").slice(0, 4e3) }));
        if (!msgs.length)
          return json({ ok: false, errors: ["no msgs"] }, 400);
        const r = await runAiChain(env, msgs, { max_tokens: Math.min(Number(b.max_tokens) || 400, 600), temperature: Number.isFinite(Number(b.temperature)) ? Number(b.temperature) : 0.7, deadline: Date.now() + 25e3 });
        const scrub = /* @__PURE__ */ __name((x) => {
          let t = String(x || "");
          for (const k of ["GEMINI_API_KEY", "GROQ_API_KEY", "OPENROUTER_API_KEY", "MISTRAL_API_KEY", "HF_TOKEN", "COHERE_API_KEY", "CF_AI_TOKEN", "WA_TOKEN", "ADMIN_KEY"])
            if (env[k] && typeof env[k] === "string")
              t = t.split(env[k]).join("<k>");
          return t.slice(0, 160);
        }, "scrub");
        return json({ ok: !!r.ok, text: r.ok ? r.text : null, provider: r.provider || null, model: r.model || null, errors: (r.errors || []).map(scrub) });
      }
      const res = await ownerNotify(env, String(b.text || "").slice(0, 900), { kind: String(b.kind || "fb") });
      return json({ ok: true, ...res || {} });
    }
    if (url.pathname === "/internal/owner-alert") {
      if (req.method !== "POST" || !env.ADMIN_KEY || req.headers.get("x-eh-internal") !== env.ADMIN_KEY)
        return new Response("Forbidden", { status: 403 });
      let b = {};
      try {
        b = await req.json();
      } catch {
      }
      return json({ ok: true, ...await ownerNotify(env, String(b.text || "").slice(0, 900), { kind: String(b.kind || "bot").slice(0, 40), urgent: b.urgent === true ? true : b.urgent === false ? false : void 0, key: b.key ? String(b.key).slice(0, 80) : void 0, wa: b.wa ? String(b.wa).replace(/\D/g, "") : void 0, queue: b.queue === false ? false : void 0 }) });
    }
    if (url.pathname === "/prix-fournisseurs.csv" && req.method === "GET") {
      const t = await supCsvToken(env, ehxDeps());
      if (!t || url.searchParams.get("t") !== t)
        return new Response("Forbidden", { status: 403 });
      return new Response(await supCsv(env, ehxDeps()), { headers: { "Content-Type": "text/csv; charset=utf-8", "Cache-Control": "no-store" } });
    }
    if (url.pathname.startsWith("/admin/hub") || url.pathname.startsWith("/admin/sup")) {
      if (!isAdmin(env, url))
        return new Response("Forbidden", { status: 403 });
      const d = ehxDeps();
      if (url.pathname === "/admin/hub" && req.method === "GET")
        return json({ cfg: await hubCfg(env, d), quiet_now: await hubQuietNow(env, d), mem: await (async () => {
          try {
            const st = convStub(env, "__hub_v1");
            const r = await st.fetch("https://conv.do/kv?k=mem");
            return await r.json();
          } catch {
            return null;
          }
        })(), queue: await ownerQueueGet(env), window: await ownerWindowState(env) });
      if (url.pathname === "/admin/hub/cfg" && req.method === "POST") {
        let b = {};
        try {
          b = await req.json();
        } catch {
        }
        return json({ ok: true, cfg: await hubCfgSet(env, d, b) });
      }
      if (url.pathname === "/admin/hub/sim" && req.method === "POST") {
        let b = {};
        try {
          b = await req.json();
        } catch {
        }
        const out = [];
        for (const t of (Array.isArray(b.msgs) ? b.msgs : []).slice(0, 10)) {
          const said = [];
          const nt = norm(String(t)).trim();
          if (/^(pause|coupe|reprise|reprends|reprend|relance|demarre|active|valide|valider|accepte|refuse|refuser|garde|nuit|fournisseur ajoute|fournisseur retire|posts? (ig|tt|fb|insta|instagram|tiktok|facebook) \d)/.test(nt) && !b.allow_writes) {
            out.push({ msg: t, skipped: "write command (allow_writes:true to run)" });
            continue;
          }
          const handled = await hubCommand(env, d, { from: OWNER_NOTIFY_WA, phone_number_id: OWNER_PHONE_DEFAULT, type: "text", text: String(t) }, String(t), async (x) => {
            said.push(x);
          });
          out.push({ msg: t, handled, said });
        }
        return json({ ok: true, out });
      }
      if (url.pathname === "/admin/hub/test-alert" && req.method === "POST") {
        let b = {};
        try {
          b = await req.json();
        } catch {
        }
        return json({ ok: true, res: await ownerNotify(env, String(b.text || "Test alerte"), { kind: String(b.kind || "test"), urgent: b.urgent }) });
      }
      if (url.pathname === "/admin/sup" && req.method === "GET")
        return json(await supStatus(env, d));
      if (url.pathname === "/admin/sup/check" && req.method === "POST")
        return json(await supDigitalCheck(env, d, { dry: url.searchParams.get("dry") !== "0" }));
      if (url.pathname === "/admin/sup/rate")
        return json(await supRate(env, d, { force: req.method === "POST" }));
      if (url.pathname === "/admin/sup/parse" && req.method === "POST") {
        const text = await req.text();
        const r = await supParseList(env, d, text, { src: url.searchParams.get("src") || "test", trusted: url.searchParams.get("trusted") === "1", dry: url.searchParams.get("dry") !== "0" });
        return json({ ...r, owner_text: proposalsText(r) });
      }
      if (url.pathname === "/admin/sup/token" && req.method === "POST")
        return json({ ok: true, csv_url: `${url.origin}/prix-fournisseurs.csv?t=${await supCsvToken(env, d, { create: true })}` });
      if (url.pathname === "/admin/sup/enable" && req.method === "POST") {
        await env.EH_KV.put("cfg:sup_enabled", url.searchParams.get("on") === "0" ? "0" : "1");
        return json({ ok: true, enabled: url.searchParams.get("on") !== "0" });
      }
      return json({ ok: false, error: "not found" }, 404);
    }
    if (req.method === "GET" && (url.pathname === "/" || url.pathname === "/health")) {
      return healthHttpResponse(env, { detail: false, forceProbe: url.searchParams.get("probe") === "1" && await globalCooldown("forced_probe", 30 * 60) });
    }
    if (req.method === "GET" && (url.pathname === "/health/ai" || url.pathname === "/health-ai")) {
      return healthHttpResponse(env, { detail: true, forceProbe: url.searchParams.get("probe") === "1" && await globalCooldown("forced_probe", 30 * 60) });
    }
    if (url.pathname === "/failover/ai-keys" || url.pathname === "/internal/ai-keys") {
      return handleAiKeys(req, env, url);
    }
    if (req.method === "GET" && url.pathname === "/version") {
      const h = await buildWhoSpeaksHealth(env, { forceProbe: false });
      return Response.json({
        ok: true,
        service: "eh-whatsapp",
        build: "ultime-v5.6-connect-ligne2-2026-09-29",
        eh_fix: ["no_delivery_promises", "payment_handoff_pause", "owner_alert_queue_digest", "event_log_do", "orphan_sweep", "owner_raw_text_not_relayed", "statut", "owner_instr_rewrite", "owner_implicit_target", "owner_placeholder_guard", "test_number_999000000001"],
        failover_keys_v: 3,
        ai_keys_restricted: { header_secret: true, render_ua: true, ip_allowlist: !!env.RENDER_EGRESS_CIDRS, rate_per_h: AIKEYS_RL_MAX, infra_tokens_on_boot_only: true },
        ai_keys_denied_1h: await hourCounter("aikeys_denied", 0).then((n) => n, () => null),
        pings_97: await pingsEnabled(env),
        fcm_configured: !!fcmConfig(env),
        apk_thread_turns: WA_RING_MAX,
        photos_indexed: (PHOTO_INDEX || []).length,
        filet_short: true,
        conv_puts_per_turn: 1,
        one_bubble: true,
        ai_writes_every_bubble: true,
        canned_texts_removed: true,
        ai_on_any_key: true,
        nego_max_fcfa: 5e3,
        delivery_fcfa: { cotonou_centre: 1e3, hors_centre: 1500 },
        momo: "01 97 34 21 01 (Horeb)",
        conv_single_key: true,
        health_no_probe: true,
        provider_dead_cache_min: 20,
        rescue_noloop: true,
        hello_direct: false,
        digital_direct: false,
        phone_direct: false,
        form_unique: false,
        ai_budget_16s: true,
        ai_robust: true,
        ai_health_gate: true,
        who_speaks_chain: true,
        gemini: !!env.GEMINI_API_KEY,
        groq: !!env.GROQ_API_KEY,
        openrouter: !!env.OPENROUTER_API_KEY,
        mistral: !!env.MISTRAL_API_KEY,
        huggingface: !!env.HF_TOKEN,
        cohere: !!env.COHERE_API_KEY,
        gemini_model: GEMINI_MODELS[0],
        gemini_models: GEMINI_MODELS,
        groq_models: GROQ_MODELS,
        openrouter_models: OPENROUTER_MODELS,
        mistral_models: MISTRAL_MODELS,
        huggingface_models: HF_MODELS,
        cohere_models: COHERE_MODELS,
        ai_primary: "gemini",
        ai_chain: ["gemini", "groq", "openrouter", "mistral", "huggingface", "cohere", "workers_ai", "catalogue", "filet"],
        ai_fallback: "groq>openrouter>mistral>huggingface>cohere>workers_ai",
        ai_models: MODELS,
        ai_ok: h.ai && h.ai.ok,
        ai_down_remaining_s: h.ai && h.ai.down_remaining_s,
        ai_last_err: h.ai && h.ai.last_err,
        http: h.http,
        gemini_ok: h.gemini,
        groq_ok: h.groq,
        openrouter_ok: h.openrouter,
        mistral_ok: h.mistral,
        huggingface_ok: h.huggingface,
        cohere_ok: h.cohere,
        workers_ai_ok: h.workers_ai,
        catalogue_ok: h.catalogue,
        replies_ok: h.replies_ok,
        who_speaks: h.who_speaks,
        who_speaks_label: h.who_speaks_label,
        secours_on: h.secours_on,
        kv_degraded: !!globalThis.__ehKvDegraded,
        ts: Math.floor(Date.now() / 1e3)
      });
    }
    if (url.pathname === "/connect-ligne2" || url.pathname.startsWith("/connect-ligne2/"))
      return connectLigne2(req, env, url, ctx);
    if (url.pathname === "/webhook" && req.method === "GET") {
      const p = url.searchParams;
      if (p.get("hub.mode") === "subscribe" && env.VERIFY_TOKEN && p.get("hub.verify_token") === env.VERIFY_TOKEN)
        return new Response(p.get("hub.challenge") || "");
      return new Response("Forbidden", { status: 403 });
    }
    if (url.pathname === "/webhook" && req.method === "POST") {
      const raw = await req.arrayBuffer();
      if (env.APP_SECRET) {
        const exp = "sha256=" + await hmacHex(env.APP_SECRET, raw);
        if ((req.headers.get("x-hub-signature-256") || "") !== exp)
          return new Response("", { status: 401 });
      }
      let body = {};
      try {
        body = JSON.parse(new TextDecoder().decode(raw) || "{}");
      } catch {
      }
      ctx.waitUntil(handle(env, body).catch((err) => console.error(err)));
      return new Response("EVENT_RECEIVED");
    }
    if (url.pathname === "/inbox" || url.pathname.startsWith("/inbox/"))
      return inbox(req, env, url, { getJSON, pushHist, sendText, kvPut, putIfChanged });
    if (url.pathname === "/recent" && req.method === "GET" && !url.searchParams.get("prefix")) {
      if (!isAdmin(env, url))
        return new Response("Forbidden", { status: 403 });
      const lim = Math.min(Number(url.searchParams.get("limit") || 200) || 200, 2e3);
      const items = await evlogRead(env, lim, String(url.searchParams.get("wa") || "").replace(/\D/g, ""));
      return json(items.map((x) => ({ received_at: new Date(Number(x.at) || 0).toISOString(), ...x })));
    }
    if (url.pathname === "/gcontacts/start" && req.method === "GET") {
      if (!isAdmin(env, url))
        return new Response("Forbidden", { status: 403 });
      const cl = await gcClient(env);
      if (!cl)
        return new Response("Client OAuth Google non configur\xE9 (cfg:gcontacts_client).", { status: 503 });
      const st = [...crypto.getRandomValues(new Uint8Array(16))].map((b) => b.toString(16).padStart(2, "0")).join("");
      await env.EH_KV.put(`gcstate:${st}`, "1", { expirationTtl: 1800 });
      const q = new URLSearchParams({ client_id: cl.id, redirect_uri: GC_REDIRECT, response_type: "code", scope: GC_SCOPE, access_type: "offline", prompt: "consent", login_hint: env.GOOGLE_CONTACTS_ACCOUNT || "electronichouze@gmail.com", state: st });
      return new Response(null, { status: 302, headers: { Location: `https://accounts.google.com/o/oauth2/v2/auth?${q}`, "Cache-Control": "no-store" } });
    }
    if (url.pathname === "/gcontacts/callback" && req.method === "GET") {
      const html = /* @__PURE__ */ __name((b, st2 = 200) => new Response(`<!doctype html><meta charset=utf-8><meta name=robots content=noindex><body style="font-family:system-ui;max-width:600px;margin:30px auto">${b}</body>`, { status: st2, headers: { "Content-Type": "text/html; charset=utf-8", "Cache-Control": "no-store", "Referrer-Policy": "no-referrer" } }), "html");
      const st = url.searchParams.get("state") || "", code = url.searchParams.get("code") || "";
      if (!st || !await env.EH_KV.get(`gcstate:${st}`))
        return html("<p>Lien expir\xE9 ou invalide. Recommencez depuis /gcontacts/start.</p>", 400);
      await env.EH_KV.delete(`gcstate:${st}`);
      if (!code)
        return html(`<p>Autorisation refus\xE9e (${esc(url.searchParams.get("error") || "?")}).</p>`, 400);
      const cl = await gcClient(env);
      const r = await fetch("https://oauth2.googleapis.com/token", { method: "POST", headers: { "Content-Type": "application/x-www-form-urlencoded" }, body: new URLSearchParams({ code, client_id: cl.id, client_secret: cl.secret, redirect_uri: GC_REDIRECT, grant_type: "authorization_code" }) });
      const j = await r.json().catch(() => ({}));
      if (!j.refresh_token)
        return html(`<p>\xC9chec de l'autorisation (${esc(j.error || r.status)}). Recommencez.</p>`, 400);
      await env.EH_KV.put("cfg:gcontacts_rt", j.refresh_token);
      let who2 = "";
      try {
        const me = await fetch("https://people.googleapis.com/v1/people/me?personFields=emailAddresses", { headers: { Authorization: `Bearer ${j.access_token}` } });
        const mj = await me.json();
        who2 = (mj.emailAddresses || [])[0]?.value || "";
        await env.EH_KV.put("cfg:gcontacts_account", who2);
      } catch {
      }
      return html(`<h2>\u2705 Contacts Google autoris\xE9s ${esc(who2)}</h2><p>Le bot enregistrera les num\xE9ros dans le groupe \xAB Electronic HOUSE \xBB. Vous pouvez fermer cette page.</p>`);
    }
    if (url.pathname === "/admin/process" && req.method === "GET") {
      if (!isAdmin(env, url))
        return new Response("Forbidden", { status: 403 });
      const wa = String(url.searchParams.get("wa") || "").replace(/\D/g, "");
      if (!wa || OWNER_WAS.has(wa))
        return json({ error: "wa" }, 400);
      const p = await getPause(env, wa);
      if (p && url.searchParams.get("unpause") === "1" && p.mode === "auto")
        await env.EH_KV.delete(`pause:${wa}`);
      else if (p)
        return json({ skipped: "paused", pause: p });
      const r = await processConv(env, wa, { source: "admin" });
      return json({ wa, result: { sent: r && r.sent, skipped: r && r.skipped, status: r && r.status, reply: r && r.reply } });
    }
    if (url.pathname === "/admin/contacts" && req.method === "GET") {
      if (!isAdmin(env, url))
        return new Response("Forbidden", { status: 403 });
      const act = url.searchParams.get("do") || "status";
      if (act === "backfill")
        return json(await contactsBackfill(env));
      if (act === "sync")
        return json(await contactsSync(env, { max: 50 }));
      if (act === "names")
        return json(await contactsRename(env, { dry: url.searchParams.get("dry") === "1" }));
      const l = await env.EH_KV.list({ prefix: "ct:", limit: 1e3 });
      return json({ total: l.keys.length, pending: l.keys.filter((k) => !k.metadata || !k.metadata.s).length, google_auth: !!await env.EH_KV.get("cfg:gcontacts_rt"), client_configured: !!await gcClient(env), account: await env.EH_KV.get("cfg:gcontacts_account"), last: JSON.parse(await env.EH_KV.get("cfg:gcontacts_last") || "null") });
    }
    if (url.pathname === "/admin/owner-instr" && req.method === "GET") {
      if (!isAdmin(env, url))
        return new Response("Forbidden", { status: 403 });
      const cmd = parseOwnerCommand(url.searchParams.get("t") || "");
      const out = { cmd };
      if (cmd.kind === "instr")
        out.rewrite = await ownerInstrToClient(env, cmd.verb, cmd.body);
      out.implicit = await ownerImplicitTarget(env, await listOpenFlags(env), Math.floor(Date.now() / 1e3));
      return json(out);
    }
    if (url.pathname === "/admin/owner-state") {
      if (!isAdmin(env, url))
        return new Response("Forbidden", { status: 403 });
      if (req.method === "POST") {
        let b = {};
        try {
          b = await req.json();
        } catch {
        }
        const items = Array.isArray(b.queue) ? b.queue : [];
        for (const it of items)
          await ownerQueuePush(env, { wa: String(it.wa || ""), kind: String(it.kind || "alerte"), name: it.name || null, body: String(it.body || "").slice(0, 900), at: Number(it.at) || Math.floor(Date.now() / 1e3) });
      }
      return json({ window: await ownerWindowState(env), queue: await ownerQueueGet(env) });
    }
    if (url.pathname === "/recent" && req.method === "GET") {
      if (!isAdmin(env, url))
        return new Response("Forbidden", { status: 403 });
      const list = await env.EH_KV.list({ prefix: url.searchParams.get("prefix") || "evt:", limit: 1e3 });
      const keys = list.keys.slice(-100);
      const items = await Promise.all(keys.map(async (k) => {
        const raw = await env.EH_KV.get(k.name);
        let v;
        try {
          v = JSON.parse(raw);
        } catch {
          v = raw;
        }
        if (v && typeof v === "object" && v.kind === "message" && v.id)
          v.ai_replied = !!await env.EH_KV.get(`ai_replied:${v.id}`);
        return v;
      }));
      return json(items);
    }
    if (url.pathname === "/flags" && req.method === "GET") {
      if (!isAdmin(env, url))
        return new Response("Forbidden", { status: 403 });
      const list = await env.EH_KV.list({ prefix: "flag:", limit: 1e3 });
      const items = (await Promise.all(list.keys.map((k) => getJSON(env, k.name, null)))).filter(Boolean).sort((a, b) => b.ts - a.ts);
      return json(items);
    }
    if (url.pathname === "/flags" && req.method === "DELETE") {
      if (!isAdmin(env, url))
        return new Response("Forbidden", { status: 403 });
      const wa = url.searchParams.get("wa_id");
      if (!wa)
        return json({ error: "wa_id requis" }, 400);
      await env.EH_KV.delete(`flag:${wa}`);
      return json({ ok: true, deleted: wa });
    }
    if (url.pathname === "/admin/save-photo" && req.method === "POST") {
      if (!isAdmin(env, url))
        return new Response("Forbidden", { status: 403 });
      const b = await req.json().catch(() => ({}));
      if (!b.media_id || !b.model)
        return new Response(JSON.stringify({ ok: false, error: "media_id + model requis" }), { status: 400 });
      const res = await ownerSavePhoto(env, { media_id: String(b.media_id), caption: `photo ${String(b.model)}` });
      return new Response(JSON.stringify(res), { headers: { "Content-Type": "application/json" } });
    }
    if (url.pathname === "/test-ai" && req.method === "POST") {
      if (!isAdmin(env, url))
        return new Response("Forbidden", { status: 403 });
      if (!env.GEMINI_API_KEY && !env.GROQ_API_KEY && !env.OPENROUTER_API_KEY && !env.MISTRAL_API_KEY && !env.HF_TOKEN && !env.COHERE_API_KEY && !env.AI)
        return json({ error: "Aucune cl\xE9 IA (Gemini/Groq/OpenRouter/Mistral/HF/Cohere) ni AI binding" }, 500);
      let b = {};
      try {
        b = await req.json();
      } catch {
      }
      if (!b.text)
        return json({ error: "text requis" }, 400);
      const history = (b.history || []).map((h) => typeof h === "string" ? { role: "user", text: h } : h);
      const meta = { ...defaultConvMeta(), ...b.meta || {} };
      const out = await generateReply(env, b.text, history, { meta, texts: b.texts, type: b.type || "text", freshCatalog: true });
      if (b.debug)
        out.matched = relevantItems(await loadCatalog(env), b.text).map((i) => i.name);
      return json({ sent: false, ...out });
    }
    if (url.pathname === "/catalog" && req.method === "GET") {
      if (!isAdmin(env, url))
        return new Response("Forbidden", { status: 403 });
      const cat = await loadCatalog(env, true);
      if (!cat)
        return json({ loaded: false });
      const q = url.searchParams.get("q");
      return json({ loaded: true, version: cat.version, counts: cat.counts, items: cat.items.length, prompt_chars: (cat.prompt || "").length, ...q ? { matches: relevantItems(cat, q) } : {} });
    }
    if (url.pathname === "/apk/secours" && req.method === "GET") {
      if (!isAdmin(env, url))
        return new Response("Forbidden", { status: 403 });
      const st = await assistantSecoursGet(env);
      return json({ ok: true, ...st, source: "kv_prefer", note: "auto niveau6 only if CF replies_ok=false AND Render down" });
    }
    if (url.pathname === "/apk/secours" && req.method === "POST") {
      if (!isAdmin(env, url))
        return new Response("Forbidden", { status: 403 });
      let b = {};
      try {
        b = await req.json();
      } catch {
      }
      const on = b.on === true || b.on === 1 || b.on === "1" || b.mode === "on";
      if (on) {
        const h = await buildWhoSpeaksHealth(env, { forceProbe: false });
        if (h.replies_ok) {
          const st2 = await assistantSecoursSet(env, false, b.by || "api_refused_cf_healthy");
          return json({ ok: false, refused: true, reason: "cf_replies_ok", ...st2 });
        }
      }
      const st = await assistantSecoursSet(env, on, b.by || "api");
      return json({ ok: true, ...st });
    }
    if (url.pathname === "/apk/thread" && req.method === "GET") {
      if (!isAdmin(env, url))
        return new Response("Forbidden", { status: 403 });
      const wa = String(url.searchParams.get("wa") || url.searchParams.get("wa_id") || "").replace(/\D/g, "");
      if (!wa)
        return json({ error: "wa requis" }, 400);
      const { source, messages } = await apkThreadMessages(env, wa, Math.min(Number(url.searchParams.get("limit") || 50) || 50, 60));
      const name = await env.EH_KV.get(`name:${wa}`) || null;
      const flag = await getJSON(env, `flag:${wa}`, null);
      return json({
        ok: true,
        source,
        wa,
        name: name || flag && flag.name || null,
        flag: flag ? { reason: flag.reason || null, product: flag.product || null, ts: flag.ts || null, last_message: flag.last_message || null } : null,
        messages: messages.map((m) => ({ id: m.id, role: m.role, text: m.text, ts: m.ts, type: m.type || "text", ...m.media_id ? { media_id: m.media_id, mime: m.mime || null } : {} }))
      });
    }
    if (url.pathname.startsWith("/img/") && req.method === "GET") {
      const slug = url.pathname.slice(5).replace(/\.(jpe?g|png)$/i, "");
      if (!/^[a-z0-9-]{1,60}$/.test(slug))
        return new Response("not found", { status: 404 });
      const c = caches.default;
      const ck = new Request(`https://eh.cache/img/${slug}`);
      const hit = await c.match(ck);
      if (hit)
        return hit;
      const r = await env.EH_KV.getWithMetadata(`img:${slug}`, "arrayBuffer");
      if (!r || !r.value)
        return new Response("not found", { status: 404 });
      const res = new Response(r.value, { headers: { "Content-Type": r.metadata && r.metadata.mime || "image/jpeg", "Cache-Control": "public, max-age=86400" } });
      try {
        await c.put(ck, res.clone());
      } catch {
      }
      return res;
    }
    if (url.pathname === "/admin/sheet-sync") {
      if (!isAdmin(env, url))
        return new Response("Forbidden", { status: 403 });
      if (req.method === "POST") {
        const res = await runSheetSync(env, "admin");
        return json({ ...res, report: syncReport(res) });
      }
      let last = null;
      try {
        const r = await caches.default.match(new Request("https://eh.cache/sheet_sync_last"));
        if (r)
          last = await r.json();
      } catch {
      }
      return json({ last });
    }
    if (url.pathname === "/apk/push" && req.method === "POST") {
      if (!isAdmin(env, url))
        return new Response("Forbidden", { status: 403 });
      let b = {};
      try {
        b = await req.json();
      } catch {
      }
      const r = await fcmSend(env, { type: b.type || "test", role: "user", wa: String(b.wa || "").replace(/\D/g, ""), name: b.name || "", preview: b.preview || "Test notification EH Bo\xEEte", ts: String(Math.floor(Date.now() / 1e3)) });
      return json({ ok: !!r.ok, fcm_configured: !!fcmConfig(env), topic: env.FCM_TOPIC || FCM_TOPIC_DEFAULT, ...r });
    }
    if (url.pathname === "/apk/media" && req.method === "GET") {
      if (!isAdmin(env, url))
        return new Response("Forbidden", { status: 403 });
      const id = String(url.searchParams.get("id") || "").replace(/[^0-9A-Za-z_.-]/g, "").slice(0, 80);
      if (!id)
        return json({ error: "id requis" }, 400);
      const ck = new Request(`https://eh-apk-feed.internal/media/${id}`);
      try {
        const hit = await caches.default.match(ck);
        if (hit)
          return new Response(hit.body, { headers: { "Content-Type": hit.headers.get("Content-Type") || "application/octet-stream", "Cache-Control": "private, max-age=86400", "X-EH-Media": "cache" } });
      } catch {
      }
      const m = await graphMediaFetch(env, id);
      if (!m)
        return json({ error: "m\xE9dia indisponible (expir\xE9 chez Meta ou id inconnu)" }, 404);
      if (m.buf.byteLength <= MEDIA_CACHE_MAX) {
        const put = caches.default.put(ck, new Response(m.buf.slice(0), { headers: { "Content-Type": m.mime, "Cache-Control": "max-age=2592000" } })).catch(() => {
        });
        if (ctx && ctx.waitUntil)
          ctx.waitUntil(put);
        else
          await put;
      }
      return new Response(m.buf, { headers: { "Content-Type": m.mime, "Cache-Control": "private, max-age=86400", "X-EH-Media": "graph" } });
    }
    if (url.pathname === "/admin/suivi-run" && req.method === "POST") {
      if (!isAdmin(env, url))
        return new Response("Forbidden", { status: 403 });
      const fu = await sweepFollowups(env);
      const pj = await runPromoJob(env);
      return json({ ok: true, suivi_on: await suiviOn(env), followups: fu, promo: pj ? { idx: pj.idx, total: pj.queue.length, ok: pj.ok, fail: pj.fail, hors: pj.hors } : null });
    }
    if (url.pathname === "/apk/send-media" && req.method === "POST") {
      if (!isAdmin(env, url))
        return new Response("Forbidden", { status: 403 });
      const wa = toWaId(String(url.searchParams.get("wa") || "").replace(/\D/g, ""));
      if (!wa || wa.length < 8 || OWNER_WAS.has(wa))
        return json({ ok: false, error: "wa invalide" }, 400);
      const caption = String(url.searchParams.get("caption") || "").slice(0, 1e3);
      const filename = String(url.searchParams.get("filename") || "fichier").replace(/[\r\n"\\/]/g, "_").slice(0, 120);
      const mime = String(req.headers.get("Content-Type") || "application/octet-stream").split(";")[0].trim().toLowerCase();
      const buf = await req.arrayBuffer();
      if (!buf.byteLength)
        return json({ ok: false, error: "fichier vide" }, 400);
      if (buf.byteLength > APK_SEND_MEDIA_MAX)
        return json({ ok: false, error: "fichier trop lourd (max 16 Mo)" }, 413);
      const kind = /^image\/(jpeg|png)$/.test(mime) ? "image" : /^video\/(mp4|3gpp)$/.test(mime) ? "video" : /^audio\/(aac|mp4|mpeg|amr|ogg)$/.test(mime) ? "audio" : "document";
      const phoneId = env.PHONE_NUMBER_ID || OWNER_PHONE_DEFAULT;
      let mediaId = null, upErr = "";
      try {
        const fd = new FormData();
        fd.append("messaging_product", "whatsapp");
        fd.append("type", mime);
        fd.append("file", new Blob([buf], { type: mime }), filename);
        const r = await fetch(`${graphBase(env)}/${phoneId}/media`, { method: "POST", headers: { Authorization: `Bearer ${env.WA_TOKEN}` }, body: fd, signal: AbortSignal.timeout(25e3) });
        const j = await r.json().catch(() => ({}));
        if (r.ok && j && j.id)
          mediaId = String(j.id);
        else
          upErr = j && j.error && j.error.message || `HTTP ${r.status}`;
      } catch (err) {
        upErr = err && err.message || "upload";
      }
      if (!mediaId)
        return json({ ok: false, error: "upload_meta", message: `Envoi du fichier \xE0 Meta impossible : ${String(upErr).slice(0, 160)}` }, 502);
      const sr = await sendMediaById(env, phoneId, wa, kind, mediaId, caption, filename);
      if (sr.status >= 300) {
        let code = 0, msg = "";
        try {
          const j = JSON.parse(sr.body);
          code = Number(j.error && j.error.code) || 0;
          msg = j.error && (j.error.error_data && j.error.error_data.details || j.error.message) || "";
        } catch {
        }
        const win = code === 131047 || /24|re-?engagement|window/i.test(msg);
        return json({ ok: false, error: win ? "window_24h" : "graph", code, message: win ? "Fen\xEAtre 24 h ferm\xE9e : le client n'a pas \xE9crit depuis plus de 24 h. Meta n'autorise qu'un mod\xE8le approuv\xE9 ; attendez qu'il r\xE9\xE9crive." : `Meta a refus\xE9 l'envoi : ${String(msg).slice(0, 160)}` }, win ? 409 : 502);
      }
      const now = Math.floor(Date.now() / 1e3);
      let wamid = "";
      try {
        wamid = JSON.parse(sr.body).messages[0].id;
      } catch {
      }
      const label = { image: "[image]", video: "[vid\xE9o]", document: "[document]", audio: "[vocal]" }[kind];
      const text = `${label}${caption ? " " + caption : ""} (envoy\xE9 par l'\xE9quipe)`;
      await pushHist(env, wa, "owner", text, now, { type: kind, media_id: mediaId, mime });
      await pauseAfterOwner(env, wa, now);
      return json({ ok: true, kind, media_id: mediaId, wamid, ts: now });
    }
    if (url.pathname === "/apk/feed" && req.method === "GET") {
      if (!isAdmin(env, url))
        return new Response("Forbidden", { status: 403 });
      const ring = await apkFeedRead();
      const since = Number(url.searchParams.get("since") || 0) || 0;
      const events = (ring.events || []).filter((x) => x && (!since || (Number(x.ts) || 0) > since));
      return json({ ok: true, source: "cache", delta: !!since, since, updated: ring.updated || 0, server_ts: Math.floor(Date.now() / 1e3), events });
    }
    return new Response("Not found", { status: 404 });
  }
};
var src_default2 = src_default;

// ---- WA53 owner rule: NO canned replies. Every reply is AI-written; if AI is down -> retry/queue, never a fixed text ----
async function __aiFree(env, sys, user, tries = 2) {
  const msgs = [{ role: "system", content: sys }, { role: "user", content: user }];
  for (let i = 0; i < tries; i++) {
    let r = await runAiChain(env, msgs, { max_tokens: AI_MAX_OUT });
    if (!r.ok) r = await lastChanceAi(env, msgs);
    if (r && r.ok && r.text && String(r.text).trim()) { const t = sanitizeOut(String(r.text)).trim(); if (t) return t; }
  }
  return null;
}
async function __ownerAiText(env, body, flags) {
  const fl = (flags || []).slice(0, 10).map((f) => `- ${f.name || "?"} (${f.wa_id})${f.product ? " : " + f.product : ""}`).join("\n");
  const sys = "Tu es l'assistant IA interne d'Electronic HOUSE (Bénin, téléphones et abonnements). Le patron t'écrit sur WhatsApp (ligne 53). Réponds-lui directement à ce qu'il dit, en français, naturellement et brièvement (1 à 4 phrases). N'invente aucun chiffre ni fait. Si c'est pertinent, rappelle qu'il peut écrire à un client avec « réponds au 229… : texte » ou en citant l'alerte, et « aide » pour la liste des commandes.";
  const user = `Clients en attente (${(flags || []).length}) :\n${fl || "aucun"}\n\nMessage du patron : « ${String(body || "").slice(0, 600)} »`;
  return __aiFree(env, sys, user);
}
async function __ownerAiReply(env, phoneId, e, body, flags) {
  try { if (typeof __EBOT === "function") { const eb = await __EBOT(String(e.from), String(body || ""), (flags || []).slice(0, 8).map((f) => `${f.name || "?"} (${f.wa_id})${f.product ? " " + f.product : ""}${f.reason ? " [" + f.reason + "]" : ""}`).join(" ; ")); if (eb) { await sendText(env, phoneId, e.from, eb); return true; } } } catch (err) { console.error("ebot soft-fail", String(err && err.message || err).slice(0, 120)); } // V10: Electronic Bot first
  const t = await __ownerAiText(env, body, flags);
  if (t) { await sendText(env, phoneId, e.from, t); return true; }
  try { await env.EH_KV.put(`aiq:owner:${e.id || Date.now()}`, JSON.stringify({ phoneId, from: e.from, body, flags: (flags || []).slice(0, 10), ts: Date.now() }), { expirationTtl: 6 * 3600 }); } catch {}
  console.log("owner_ai_queued", String(body || "").slice(0, 60));
  return false;
}
async function __aiqSweep(env) {
  const l = await env.EH_KV.list({ prefix: "aiq:owner:", limit: 20 });
  for (const k of l.keys) {
    const j = await env.EH_KV.get(k.name, "json"); if (!j) { await env.EH_KV.delete(k.name); continue; }
    const t = await __ownerAiText(env, j.body, j.flags);
    if (t) { await sendText(env, j.phoneId, j.from, t); await env.EH_KV.delete(k.name); } else break;
  }
}

// ===== EH59-on-n8n harness: Cloudflare bindings emulated on Supabase + n8n helpers =====
// __HTTP(opts) -> {statusCode, headers, body:Buffer}  (n8n: this.helpers.httpRequest)
function __anyBuf(b) { // cross-realm safe (n8n sandbox Buffers are not instanceof our Buffer)
  if (b == null) return __B.alloc(0);
  if (typeof b === "string") return __B.from(b, "utf8");
  if (typeof b.readUInt8 === "function" || (typeof b.byteLength === "number" && typeof b.length === "number")) return __B.from(b);
  if (typeof b.byteLength === "number" && typeof b.slice === "function") return __B.from(new Uint8Array(b));
  if (b.type === "Buffer" && Array.isArray(b.data)) return __B.from(b.data);
  return __B.from(JSON.stringify(b), "utf8");
}
const __RUN = { log: [], sends: [], http: 0, kvOps: 0, t0: Date.now() };
function __mkFetch(S) {
  return async function fetch(input, init = {}) {
    const req = input instanceof Request ? input : new Request(input, init);
    let url = req.url, method = req.method, headers = new Headers(req.headers);
    if (init.headers) new Headers(init.headers).forEach((v, k) => headers.set(k, v));
    let body = init.body !== undefined ? init.body : req._raw;
    if (body instanceof FormData) { const enc = body._encode(); body = enc.body; headers.set("content-type", enc.type); }
    else if (body instanceof URLSearchParams) { body = body.toString(); if (!headers.has("content-type")) headers.set("content-type", "application/x-www-form-urlencoded"); }
    else if (body instanceof Blob) body = body._b;
    else if (body instanceof ArrayBuffer || ArrayBuffer.isView(body)) body = __toBuf(body);
    // --- test guard: in TEST mode only the boss numbers may receive WhatsApp sends ---
    if (/graph\.facebook\.com\/v[\d.]+\/\d+\/messages$/.test(url) && method === "POST") {
      let payload = {}; try { payload = JSON.parse(String(body)); } catch {}
      if (S.TEST_GUARD && !S.TEST_ALLOW.includes(String(payload.to))) { __RUN.sends.push({ to: payload.to, blocked: true, body: String(body).slice(0, 400) }); return new Response(JSON.stringify({ messages: [{ id: "wamid.BLOCKED_TEST_" + Date.now() }] }), { status: 200, headers: { "content-type": "application/json" } }); }
      if (S.SEND_VIA === "inproc" && typeof __SEND === "function") {
        // WA53 rapide: send directly through the Baileys socket of this process
        if (payload.status === "read" || !payload.to) { __RUN.sends.push({ via: "inproc", skipped: payload.status || "no-to" }); return new Response(JSON.stringify({ success: true }), { status: 200, headers: { "content-type": "application/json" } }); }
        let r; try { r = await __SEND(payload); } catch (e) { r = { error: String(e && e.message || e) }; }
        __RUN.sends.push({ via: "inproc", to: payload.to, id: r && r.id, err: r && r.error, body: String(body).slice(0, 300) });
        return new Response(JSON.stringify(r && r.id ? { messaging_product: "whatsapp", contacts: [{ input: payload.to, wa_id: payload.to }], messages: [{ id: "bridge." + r.id }] } : { error: { message: "inproc " + (r && r.error), code: 502 } }), { status: r && r.id ? 200 : 502, headers: { "content-type": "application/json" } });
      }
      if ((S.SEND_VIA === "bridge" || S.SEND_VIA === "outbox") && S.SB_URL && S.SB_KEY) {
        // bridge mode: queue in Supabase wa53_outbox; the Baileys bridge on the box polls and sends it
        if (payload.status === "read" || !payload.to) { __RUN.sends.push({ via: "outbox", skipped: payload.status || "no-to" }); return new Response(JSON.stringify({ success: true }), { status: 200, headers: { "content-type": "application/json" } }); }
        __RUN.http++;
        const ob = await __HTTP({ method: "POST", url: S.SB_URL + "/rest/v1/wa53_outbox", headers: { apikey: S.SB_KEY, Authorization: "Bearer " + S.SB_KEY, "Content-Type": "application/json", Prefer: "return=representation" }, body: JSON.stringify({ to_number: String(payload.to).replace(/\D/g, ""), kind: payload.type || "text", payload }), returnFullResponse: true, ignoreHttpStatusErrors: true, encoding: "text", json: false, timeout: 15000 });
        const ok = ob.statusCode < 300; let row = {}; try { row = JSON.parse(ob.body || "[]")[0] || {}; } catch {}
        __RUN.sends.push({ via: "outbox", status: ob.statusCode, to: payload.to, id: row.id, body: String(body).slice(0, 300) });
        return new Response(JSON.stringify(ok ? { messaging_product: "whatsapp", contacts: [{ input: payload.to, wa_id: payload.to }], messages: [{ id: "outbox." + (row.id || Date.now()) }] } : { error: { message: "outbox " + ob.statusCode + " " + String(ob.body).slice(0, 120), code: ob.statusCode } }), { status: ok ? 200 : 502, headers: { "content-type": "application/json" } });
      }
      if (S.SEND_VIA === "bridge_http" && S.BRIDGE_URL && S.BRIDGE_KEY && payload.type === "text") {
        __RUN.http++;
        const br = await __HTTP({ method: "POST", url: String(S.BRIDGE_URL).replace(/\/$/, "") + "/send", headers: Object.assign({ Authorization: "Bearer " + S.BRIDGE_KEY, "Content-Type": "application/json" }, S.BRIDGE_EXTRA_HEADERS || {}), body: JSON.stringify({ to: payload.to, text: payload.text && payload.text.body }), returnFullResponse: true, ignoreHttpStatusErrors: true, encoding: "text", json: false, timeout: 25000 });
        const ok = br.statusCode < 300; let j = {}; try { j = JSON.parse(br.body || "{}"); } catch {}
        __RUN.sends.push({ via: "bridge", status: br.statusCode, to: payload.to, body: String(body).slice(0, 300), resp: String(br.body).slice(0, 300) });
        return new Response(JSON.stringify(ok ? { messaging_product: "whatsapp", messages: [{ id: "bridge." + (j.id || Date.now()) }] } : { error: { message: j.error || "bridge " + br.statusCode, code: br.statusCode } }), { status: ok ? 200 : 502, headers: { "content-type": "application/json" } });
      }
    }
    const sig = init.signal || req.signal; const timeout = sig && sig._ms ? sig._ms : 30000;
    __RUN.http++;
    let r;
    try {
      r = await __HTTP({ method, url, headers: headers.toObject(), body: body == null || method === "GET" || method === "HEAD" ? undefined : (typeof body === "string" ? body : __toBuf(body)), returnFullResponse: true, ignoreHttpStatusErrors: true, encoding: "arraybuffer", json: false, timeout, disableFollowRedirect: req.redirect === "manual" });
    } catch (e) { __RUN.log.push("HTTPERR " + method + " " + url.replace(/key=[^&]+/, "key=*").slice(0, 120) + " :: " + String(e && e.message || e).slice(0, 200)); throw new TypeError("fetch failed: " + (e && e.message || e)); }
    __RUN.log.push("HTTP " + method + " " + url.replace(/key=[^&]+/, "key=*").replace(/\?.*$/, "").slice(0, 100) + " -> " + r.statusCode);
    const rb = __anyBuf(r.body);
    if (r.statusCode >= 400) __RUN.log.push("HTTPBODY " + rb.toString("utf8").slice(0, 300) + " | reqCT=" + headers.get("content-type") + " bodyType=" + (body == null ? "null" : typeof body) + " len=" + (body ? __toBuf(body).length : 0));
    if (/graph\.facebook\.com\/v[\d.]+\/\d+\/messages$/.test(url) && method === "POST") __RUN.sends.push({ status: r.statusCode, body: String(body).slice(0, 300), resp: rb.toString("utf8").slice(0, 300) });
    const rh = {}; for (const k of Object.keys(r.headers || {})) rh[k] = Array.isArray(r.headers[k]) ? r.headers[k].join(", ") : r.headers[k];
    return new Response(rb, { status: r.statusCode, headers: rh, url });
  };
}
function __mkKV(S) {
  const base = S.SB_URL + "/rest/v1/kv53", H = { apikey: S.SB_KEY, Authorization: "Bearer " + S.SB_KEY, "Content-Type": "application/json" };
  const cache = new Map();
  const call = async (method, q, body, extra = {}) => { __RUN.kvOps++; const r = await __HTTP({ method, url: base + q, headers: { ...H, ...extra }, body: body ? JSON.stringify(body) : undefined, returnFullResponse: true, ignoreHttpStatusErrors: true, json: false, encoding: "text", timeout: 15000 }); if (r.statusCode >= 300) throw new Error("kv53 " + method + " " + r.statusCode + " " + String(r.body).slice(0, 120)); return r.body ? JSON.parse(r.body) : null; };
  const live = row => row && (!row.expires_at || Date.parse(row.expires_at) > Date.now());
  const enc = k => encodeURIComponent(k);
  const kv = {
    async get(key, opt) { const type = typeof opt === "string" ? opt : opt && opt.type || "text"; let row;
      if (key.startsWith("cfg:") && cache.has(key)) row = cache.get(key); else { const rows = await call("GET", `?key=eq.${enc(key)}&select=value,metadata,expires_at`); row = rows && rows[0] || null; cache.set(key, row); }
      if (!live(row) || row.value == null) return null; if (type === "json") { try { return JSON.parse(row.value); } catch { return null; } } if (type === "arrayBuffer") return __toBuf(row.value).buffer; return row.value; },
    async getWithMetadata(key, opt) { const value = await kv.get(key, opt); const row = cache.get(key); return { value, metadata: value == null ? null : row && row.metadata || null }; },
    async put(key, value, o = {}) { const ttl = o.expirationTtl ? Number(o.expirationTtl) : o.expiration ? Number(o.expiration) - Date.now() / 1e3 : 0;
      const row = { key, value: typeof value === "string" ? value : __toBuf(value).toString("utf8"), metadata: o.metadata || null, expires_at: ttl > 0 ? new Date(Date.now() + ttl * 1e3).toISOString() : null, updated_at: new Date().toISOString() };
      cache.set(key, row); await call("POST", "?on_conflict=key", row, { Prefer: "resolution=merge-duplicates,return=minimal" }); },
    async delete(key) { cache.set(key, null); await call("DELETE", `?key=eq.${enc(key)}`); },
    async list(o = {}) { const lim = Math.min(Number(o.limit) || 1000, 1000), off = Number(o.cursor) || 0; const pf = String(o.prefix || "").replace(/[%_\\]/g, m => "\\" + m);
      const rows = await call("GET", `?key=like.${enc(pf)}*&select=key,metadata,expires_at&order=key.asc&limit=${lim + 1}&offset=${off}`);
      const ok = rows.filter(live); const page = ok.slice(0, lim);
      return { keys: page.map(r => ({ name: r.key, metadata: r.metadata || undefined, expiration: r.expires_at ? Math.floor(Date.parse(r.expires_at) / 1e3) : undefined })), list_complete: rows.length <= lim, cursor: rows.length > lim ? String(off + lim) : "" }; }
  };
  return kv;
}
function __mkCaches(kv) { // caches.default emulated on kv53 ("cache:" keys, TTL from Cache-Control max-age)
  const key = r => "cache:" + (r instanceof Request ? r.url : String(r));
  return { default: {
    async match(r) { const v = await kv.get(key(r)); if (v == null) return undefined; const o = JSON.parse(v); return new Response(__B.from(o.b, "base64"), { status: o.s, headers: o.h }); },
    async put(r, resp) { const h = resp.headers.toObject ? resp.headers.toObject() : {}; const ma = Number((String(h["cache-control"] || "").match(/max-age=(\d+)/) || [])[1] || 0); const b = await resp.clone()._buf(); await kv.put(key(r), JSON.stringify({ s: resp.status, h, b: b.toString("base64") }), ma > 0 ? { expirationTtl: Math.max(60, ma) } : {}); },
    async delete(r) { await kv.delete(key(r)); return true; } } };
}
function __mkEnv(S) {
  const kv = __mkKV(S);
  const env = {
    EH_KV: kv, WA_TOKEN: S.WA_TOKEN, VERIFY_TOKEN: S.VERIFY_TOKEN, ADMIN_KEY: S.ADMIN_KEY, PHONE_NUMBER_ID: S.PHONE_ID,
    GEMINI_API_KEY: S.GEMINI_API_KEY, GROQ_API_KEY: S.GROQ_API_KEY, OPENROUTER_API_KEY: S.OPENROUTER_API_KEY, MISTRAL_API_KEY: S.MISTRAL_API_KEY,
    HF_TOKEN: S.HF_TOKEN, COHERE_API_KEY: S.COHERE_API_KEY, CF_AI_TOKEN: S.CF_AI_TOKEN,
    // Workers AI binding -> REST API (muchiwa3 account)
    AI: S.CF_AI_TOKEN ? { async run(model, input) { const r = await fetch(`https://api.cloudflare.com/client/v4/accounts/${S.CF_AI_ACCOUNT}/ai/run/${model}`, { method: "POST", headers: { Authorization: "Bearer " + S.CF_AI_TOKEN, "Content-Type": "application/json" }, body: JSON.stringify(input) }); const j = await r.json().catch(() => ({})); if (!r.ok || j.success === false) throw new Error("AiError " + r.status + " " + JSON.stringify(j.errors || j).slice(0, 160)); return j.result; } } : undefined,
    // service binding eh-facebook -> its public workers.dev URL (same ?key=ADMIN_KEY auth as 59)
    FB: { fetch(req) { const u = new URL(req.url); return fetch(new Request("https://eh-facebook.domingohoreb.workers.dev" + u.pathname + u.search, { method: req.method, headers: req.headers, body: req._raw })); } },
  };
  return env;
}
async function __run(S, job) {
  __LOCK_S = S;
  __G.fetch = __mkFetch(S);
  const env = __mkEnv(S);
  __G.caches = __mkCaches(env.EH_KV);
  const pending = []; const ctx = { waitUntil(p) { pending.push(Promise.resolve(p).catch(e => __RUN.log.push("waitUntil: " + (e && e.stack || e)))); }, passThroughOnException() {} };
  const oc = console.error; const ol = console.log; console.error = (...a) => { __RUN.log.push("E " + a.map(x => x && x.stack || (typeof x === "object" ? JSON.stringify(x) : x)).join(" ").slice(0, 400)); }; console.log = (...a) => { __RUN.log.push("L " + a.map(x => typeof x === "object" ? JSON.stringify(x) : x).join(" ").slice(0, 300)); };
  let result;
  try {
    if (job.kind === "webhook") result = await handle(env, job.body);
    else if (job.kind === "conv") result = await processConv(env, String(job.wa), { source: job.source || "selfcheck" });
    else if (job.kind === "cron") result = await __cron53(env, job.event || { scheduledTime: Date.now(), cron: "* * * * *" });
    while (pending.length) await pending.shift();
  } finally { console.error = oc; console.log = ol; }
  return { result: result === undefined ? null : result, ms: Date.now() - __RUN.t0, http: __RUN.http, kvOps: __RUN.kvOps, sends: __RUN.sends, log: __RUN.log.slice(-60) };
}
// 59's scheduled() minus the jobs that belong to the 59 worker only (FB posting tick, supplier cron, Google contacts, Render wake, niveau6, cron probe)
async function __cron53(env, event) {
  const out = {};
  for (const [n, f] of [["sheet", () => maybeDailySheetSync(env, event)], ["unanswered", () => sweepUnanswered(env)], ["evening", () => sweepEveningFollowups(env)], ["followups", () => sweepFollowups(env)], ["promo", () => runPromoJob(env)], ["orphans", () => sweepOrphans(env)], ["ownerflush", () => ownerMaybeFlush(env)], ["aiq", () => __aiqSweep(env)]]) {
    try { await f(); out[n] = "ok"; } catch (e) { out[n] = "err " + String(e && e.message || e).slice(0, 120); }
  }
  return out;
}

// withLock(): 59 serialises per key inside one Worker isolate (in-memory Map). n8n runs each webhook in its own
// sandbox, so the same lock is made cross-execution with an insert-if-absent row in kv53 (TTL 15 s).
var __KV_FOR_LOCK = null;
async function withLock(key, fn) {
  const S = __LOCK_S; const H = { apikey: S.SB_KEY, Authorization: "Bearer " + S.SB_KEY, "Content-Type": "application/json", Prefer: "resolution=ignore-duplicates,return=representation" };
  const lk = "lock:" + key, me = Math.random().toString(36).slice(2), t0 = Date.now(); let got = false;
  while (Date.now() - t0 < 12000) {
    try { await __HTTP({ method: "DELETE", url: S.SB_URL + "/rest/v1/kv53?key=eq." + encodeURIComponent(lk) + "&expires_at=lt." + encodeURIComponent(new Date().toISOString()), headers: H, ignoreHttpStatusErrors: true, returnFullResponse: true, json: false, encoding: "text" });
      const r = await __HTTP({ method: "POST", url: S.SB_URL + "/rest/v1/kv53?on_conflict=key", headers: H, body: JSON.stringify({ key: lk, value: me, expires_at: new Date(Date.now() + 15000).toISOString() }), ignoreHttpStatusErrors: true, returnFullResponse: true, json: false, encoding: "text" });
      const b = typeof r.body === "string" ? r.body : JSON.stringify(r.body); if (r.statusCode < 300 && b && b.includes(me)) { got = true; break; } } catch {}
    await new Promise(res => setTimeout(res, 150 + Math.random() * 150));
  }
  try { return await fn(); } finally { if (got) { try { await __HTTP({ method: "DELETE", url: S.SB_URL + "/rest/v1/kv53?key=eq." + encodeURIComponent(lk) + "&value=eq." + me, headers: H, ignoreHttpStatusErrors: true, returnFullResponse: true, json: false, encoding: "text" }); } catch {} } }
}
var __LOCK_S = null;
// WA53: bridge + Meta coexistence both deliver the same inbound; and Meta echoes what the bridge sends. Both carry the same raw WA id.
function __rawWaId(id) { id = String(id || ""); if (id.startsWith("bridge.")) return id.slice(7).toUpperCase(); if (id.startsWith("wamid.")) { try { const t = __B ? __B.from(id.slice(6), "base64").toString("latin1") : atob(id.slice(6)); const m = t.match(/[0-9A-F]{12,}/g); if (m) return m[m.length - 1]; } catch {} } return id; }
async function __kvH() { const S = __LOCK_S; return { S, H: { apikey: S.SB_KEY, Authorization: "Bearer " + S.SB_KEY, "Content-Type": "application/json" } }; }
async function __isBotEcho(id) { try { const { S, H } = await __kvH(); const r = await __HTTP({ method: "GET", url: S.SB_URL + "/rest/v1/kv53?select=key&key=eq." + encodeURIComponent("botwid:" + __rawWaId(id)), headers: H, ignoreHttpStatusErrors: true, returnFullResponse: true, json: false, encoding: "text" }); const b = typeof r.body === "string" ? r.body : JSON.stringify(r.body); return r.statusCode < 300 && b.includes("botwid:"); } catch { return false; } }
async function __dedupIn(evs) { const out = []; for (const e of evs) { if (e.kind !== "message" || !e.id) { out.push(e); continue; } try { const { S, H } = await __kvH(); const k = "inseen:" + __rawWaId(e.id); const r = await __HTTP({ method: "POST", url: S.SB_URL + "/rest/v1/kv53?on_conflict=key", headers: { ...H, Prefer: "resolution=ignore-duplicates,return=representation" }, body: JSON.stringify({ key: k, value: String(e.id), expires_at: new Date(Date.now() + 3600e3).toISOString() }), ignoreHttpStatusErrors: true, returnFullResponse: true, json: false, encoding: "text" }); const b = typeof r.body === "string" ? r.body : JSON.stringify(r.body); if (r.statusCode < 300 && !b.includes(k)) { console.log("dup_inbound_skip", k); continue; } } catch {} out.push(e); } return out; }
// 59 batches a client's rapid messages through PENDING_MEM (shared memory of one Worker isolate). In n8n every
// webhook is a separate sandbox, so the same pending list is kept in the shared cache (kv53) under a per-client lock.
async function pendingAdd(wa, item) { return withLock("pend:" + wa, async () => { const cur = await pendingGet(wa); if (cur.some((x) => x.id === item.id)) return; cur.push(item); await pendingSet(wa, cur); }); }
async function pendingClear(wa, ids) { if (!ids || !ids.length) return; return withLock("pend:" + wa, async () => { const cur = await pendingGet(wa); const rest = cur.filter((x) => !ids.includes(x.id)); if (rest.length !== cur.length) await pendingSet(wa, rest); }); }
;globalThis.__entry = __run; globalThis.__RUNREF = __RUN;
