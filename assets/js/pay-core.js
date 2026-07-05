/* ============================================================
   STPM KOHORT 20266 PAY — teras perkongsian
   Storan localStorage + pengekodan pautan (LZ-String) + QR
   Digunakan oleh dashboard.html & checkout.html
   ============================================================ */
(function (global) {
  "use strict";

  var LS_KEY = "kpay.v1";
  var LINK_PREFIX = "K1.";     // versi payload pautan bayaran
  var ORDER_PREFIX = "KPORD1."; // versi kod pesanan pelanggan

  /* ---------- utiliti asas ---------- */
  function uid(p) {
    return (p || "id") + "_" + Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
  }

  function esc(s) {
    return String(s == null ? "" : s).replace(/[&<>"']/g, function (c) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c];
    });
  }

  function fmtRM(n) {
    var v = Number(n);
    if (!isFinite(v)) v = 0;
    return "RM " + v.toLocaleString("ms-MY", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  }

  function fmtDate(ts, withTime) {
    var d = new Date(ts);
    var opt = { day: "numeric", month: "short", year: "numeric" };
    if (withTime) { opt.hour = "2-digit"; opt.minute = "2-digit"; }
    try { return d.toLocaleDateString("ms-MY", opt); } catch (e) { return d.toLocaleDateString(); }
  }

  function orderCode() {
    var t = Date.now().toString(36).toUpperCase().slice(-5);
    var r = Math.random().toString(36).toUpperCase().slice(2, 5);
    return "KP-" + t + r;
  }

  /* ---------- hash PIN (kunci peranti, bukan keselamatan pelayan) ---------- */
  function hashPin(pin) {
    var data = "kpay::" + pin;
    if (global.crypto && global.crypto.subtle && global.isSecureContext !== false) {
      return global.crypto.subtle.digest("SHA-256", new TextEncoder().encode(data)).then(function (buf) {
        return Array.prototype.map.call(new Uint8Array(buf), function (b) {
          return b.toString(16).padStart(2, "0");
        }).join("");
      }).catch(function () { return Promise.resolve(djb2(data)); });
    }
    return Promise.resolve(djb2(data));
  }

  function djb2(s) {
    var h1 = 5381, h2 = 52711;
    for (var i = 0; i < s.length; i++) {
      var c = s.charCodeAt(i);
      h1 = (h1 * 33 + c) >>> 0;
      h2 = (h2 * 37 + c) >>> 0;
    }
    return "x" + h1.toString(16) + h2.toString(16);
  }

  /* ---------- senarai bank & dompet Malaysia ---------- */
  var BANKS = [
    "Maybank", "CIMB Bank", "Public Bank", "RHB Bank", "Bank Islam",
    "Bank Rakyat", "BSN (Bank Simpanan Nasional)", "Hong Leong Bank",
    "AmBank", "Affin Bank", "Alliance Bank", "UOB Malaysia",
    "OCBC Bank", "HSBC Malaysia", "Standard Chartered", "Bank Muamalat",
    "Agrobank", "MBSB Bank", "CO-OPBANK Pertama", "GXBank", "Boost Bank", "AEON Bank"
  ];

  /* ---------- metadata kaedah bayaran ---------- */
  var METHODS = {
    duitnow: {
      label: "DuitNow QR",
      short: "Imbas & bayar dari mana-mana app bank / e-wallet",
      icon: "◫",
      badge: "PALING PANTAS"
    },
    tng: {
      label: "TNG eWallet",
      short: "Imbas QR Touch 'n Go eWallet",
      icon: "⬡",
      badge: ""
    },
    bank: {
      label: "Pindahan Bank",
      short: "Transfer manual / DuitNow ke akaun",
      icon: "🏦",
      badge: ""
    },
    gw: {
      label: "FPX / Kad Kredit / Debit",
      short: "Bayaran online segera melalui gerbang selamat",
      icon: "💳",
      badge: "AUTOMATIK"
    }
  };

  /* ---------- storan penjual ---------- */
  function defaultStore() {
    return {
      v: 1,
      profile: {
        shopName: "STPM Kohort 20266",
        tagline: "Kedai rasmi kohort",
        waNumber: "",
        tgUser: "",
        pinHash: null,
        created: Date.now()
      },
      payouts: [],
      products: [],
      orders: []
    };
  }

  function load() {
    try {
      var raw = global.localStorage.getItem(LS_KEY);
      if (!raw) return defaultStore();
      var d = JSON.parse(raw);
      var base = defaultStore();
      d.profile = Object.assign(base.profile, d.profile || {});
      d.payouts = d.payouts || [];
      d.products = d.products || [];
      d.orders = d.orders || [];
      return d;
    } catch (e) {
      return defaultStore();
    }
  }

  function save(store) {
    try {
      global.localStorage.setItem(LS_KEY, JSON.stringify(store));
      return true;
    } catch (e) {
      return false;
    }
  }

  function wipe() {
    try { global.localStorage.removeItem(LS_KEY); } catch (e) {}
  }

  /* ---------- pengekodan pautan bayaran ----------
     Semua data yang pelanggan perlukan dimampatkan ke dalam #K1.<data>
     supaya pautan berfungsi di mana-mana peranti TANPA pelayan. */
  function encodeLink(payload) {
    return LINK_PREFIX + LZString.compressToEncodedURIComponent(JSON.stringify(payload));
  }

  function decodeLink(hash) {
    if (!hash) return null;
    var s = hash.replace(/^#/, "");
    if (s.indexOf(LINK_PREFIX) !== 0) return null;
    try {
      var json = LZString.decompressFromEncodedURIComponent(s.slice(LINK_PREFIX.length));
      if (!json) return null;
      var d = JSON.parse(json);
      if (!d || d.v !== 1 || !d.p) return null;
      return d;
    } catch (e) {
      return null;
    }
  }

  /* Bina payload pautan daripada produk + kaedah payout yang diaktifkan */
  function buildLinkPayload(store, product) {
    var methods = [];
    (store.payouts || []).forEach(function (po) {
      if (!po.enabled) return;
      if (product.methods && product.methods.length && product.methods.indexOf(po.id) === -1) return;
      if (po.type === "duitnow") {
        methods.push({ t: "duitnow", q: po.payload || null, i: po.img || null });
      } else if (po.type === "tng") {
        methods.push({ t: "tng", q: po.payload || null, i: po.img || null, ph: po.phone || null });
      } else if (po.type === "bank") {
        methods.push({ t: "bank", bk: po.bank || "", ac: po.accNo || "", hn: po.showName ? (po.holder || null) : null });
      } else if (po.type === "gw") {
        // label peribadi penjual TIDAK dihantar — pembeli nampak label standard sahaja
        methods.push({ t: "gw", u: po.gatewayUrl || "" });
      }
    });
    return {
      v: 1,
      s: store.profile.shopName || "STPM Kohort 20266",
      tg: store.profile.tgUser || null,
      w: store.profile.waNumber || null,
      p: {
        id: product.id,
        n: product.name,
        d: product.desc || "",
        a: product.openAmount ? null : Number(product.price || 0),
        mn: product.openAmount ? Number(product.minAmount || 1) : null,
        img: product.img || null,
        q: product.allowQty ? 1 : 0
      },
      m: methods
    };
  }

  function checkoutUrl(payload) {
    var base = global.location.href.replace(/[^/]*$/, "");
    return base + "checkout.html#" + encodeLink(payload);
  }

  /* ---------- kod pesanan (pelanggan → penjual, tanpa pelayan) ---------- */
  function encodeOrder(o) {
    return ORDER_PREFIX + LZString.compressToEncodedURIComponent(JSON.stringify(o));
  }

  function decodeOrder(s) {
    if (!s) return null;
    s = String(s).trim();
    var i = s.indexOf(ORDER_PREFIX);
    if (i === -1) return null;
    // ambil token bersambung selepas prefix (kod mungkin ditampal dalam ayat penuh)
    var tail = s.slice(i + ORDER_PREFIX.length).match(/^[A-Za-z0-9+\-$_%.]+/);
    if (!tail) return null;
    try {
      var json = LZString.decompressFromEncodedURIComponent(tail[0]);
      if (!json) return null;
      var d = JSON.parse(json);
      if (!d || !d.c) return null;
      return d;
    } catch (e) {
      return null;
    }
  }

  /* ---------- QR: jana & baca ---------- */
  function qrDataUrl(text, sizePx) {
    // qrcode-generator: typeNumber 0 = auto
    var qr = global.qrcode(0, "M");
    qr.addData(text);
    qr.make();
    var count = qr.getModuleCount();
    var quiet = 4;
    var scale = Math.max(2, Math.floor((sizePx || 320) / (count + quiet * 2)));
    var dim = (count + quiet * 2) * scale;
    var cv = document.createElement("canvas");
    cv.width = dim; cv.height = dim;
    var ctx = cv.getContext("2d");
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, dim, dim);
    ctx.fillStyle = "#0b0618";
    for (var r = 0; r < count; r++) {
      for (var c = 0; c < count; c++) {
        if (qr.isDark(r, c)) {
          ctx.fillRect((c + quiet) * scale, (r + quiet) * scale, scale, scale);
        }
      }
    }
    return cv.toDataURL("image/png");
  }

  /* Baca QR daripada fail imej (guna jsQR). Pulangkan Promise<{text}|null> */
  function readQrFromFile(file) {
    return fileToImage(file).then(function (img) {
      var tries = [900, 600, 1200, 400];
      for (var i = 0; i < tries.length; i++) {
        var res = tryDecodeAt(img, tries[i]);
        if (res) return res;
      }
      return null;
    });
  }

  function tryDecodeAt(img, maxDim) {
    var w = img.naturalWidth || img.width, h = img.naturalHeight || img.height;
    var k = Math.min(1, maxDim / Math.max(w, h));
    var cw = Math.max(1, Math.round(w * k)), ch = Math.max(1, Math.round(h * k));
    var cv = document.createElement("canvas");
    cv.width = cw; cv.height = ch;
    var ctx = cv.getContext("2d", { willReadFrequently: true });
    ctx.drawImage(img, 0, 0, cw, ch);
    var data = ctx.getImageData(0, 0, cw, ch);
    var out = global.jsQR(data.data, cw, ch, { inversionAttempts: "attemptBoth" });
    return out && out.data ? { text: out.data } : null;
  }

  /* ---------- imej: mampat untuk simpanan / pautan ---------- */
  function fileToImage(file) {
    return new Promise(function (resolve, reject) {
      var url = URL.createObjectURL(file);
      var img = new Image();
      img.onload = function () { resolve(img); };
      img.onerror = reject;
      img.src = url;
    });
  }

  function compressImage(file, maxDim, asPng) {
    return fileToImage(file).then(function (img) {
      var w = img.naturalWidth || img.width, h = img.naturalHeight || img.height;
      var k = Math.min(1, (maxDim || 560) / Math.max(w, h));
      var cv = document.createElement("canvas");
      cv.width = Math.max(1, Math.round(w * k));
      cv.height = Math.max(1, Math.round(h * k));
      var ctx = cv.getContext("2d");
      if (asPng) { ctx.fillStyle = "#ffffff"; ctx.fillRect(0, 0, cv.width, cv.height); }
      ctx.drawImage(img, 0, 0, cv.width, cv.height);
      return asPng ? cv.toDataURL("image/png") : cv.toDataURL("image/jpeg", 0.82);
    });
  }

  /* ---------- toast ---------- */
  var toastTimer = null;
  function toast(msg, kind) {
    var el = document.getElementById("kp-toast");
    if (!el) {
      el = document.createElement("div");
      el.id = "kp-toast";
      document.body.appendChild(el);
    }
    el.textContent = msg;
    el.className = "show" + (kind ? " " + kind : "");
    clearTimeout(toastTimer);
    toastTimer = setTimeout(function () { el.className = ""; }, 3200);
  }

  function copyText(text) {
    if (navigator.clipboard && navigator.clipboard.writeText) {
      return navigator.clipboard.writeText(text).then(function () { return true; }, function () { return legacyCopy(text); });
    }
    return Promise.resolve(legacyCopy(text));
  }

  function legacyCopy(text) {
    try {
      var ta = document.createElement("textarea");
      ta.value = text;
      ta.style.cssText = "position:fixed;opacity:0";
      document.body.appendChild(ta);
      ta.select();
      var ok = document.execCommand("copy");
      ta.remove();
      return ok;
    } catch (e) { return false; }
  }

  /* ---------- nombor WhatsApp → pautan wa.me ---------- */
  function waLink(number, text) {
    var n = String(number || "").replace(/[^0-9]/g, "");
    if (n.indexOf("0") === 0) n = "6" + n; // 01x → 601x
    return "https://wa.me/" + n + (text ? "?text=" + encodeURIComponent(text) : "");
  }

  function tgLink(user) {
    return "https://t.me/" + String(user || "").replace(/^@/, "");
  }

  global.KP = {
    uid: uid, esc: esc, fmtRM: fmtRM, fmtDate: fmtDate, orderCode: orderCode,
    hashPin: hashPin,
    BANKS: BANKS, METHODS: METHODS,
    load: load, save: save, wipe: wipe, defaultStore: defaultStore,
    encodeLink: encodeLink, decodeLink: decodeLink, buildLinkPayload: buildLinkPayload, checkoutUrl: checkoutUrl,
    encodeOrder: encodeOrder, decodeOrder: decodeOrder,
    qrDataUrl: qrDataUrl, readQrFromFile: readQrFromFile, compressImage: compressImage,
    toast: toast, copyText: copyText, waLink: waLink, tgLink: tgLink
  };
})(window);
