/* ============================================================
   STPM KOHORT 20266 PAY — Dashboard Penjual
   ============================================================ */
(function () {
  "use strict";

  var store = KP.load();
  var $ = function (s) { return document.querySelector(s); };
  var $$ = function (s) { return Array.prototype.slice.call(document.querySelectorAll(s)); };

  function persist() { if (!KP.save(store)) KP.toast("Storan penuh — gambar terlalu besar", "err"); }

  /* ================= KUNCI PIN ================= */
  var lock = $("#lock"), app = $("#app");
  var lockSetup = $("#lock-setup"), lockEnter = $("#lock-enter");
  var lockNowBtn = $("#btn-lock-now");

  function showApp() {
    lock.hidden = true;
    app.hidden = false;
    lockNowBtn.hidden = !store.profile.pinHash;
    renderAll();
  }

  function showLock() {
    app.hidden = true;
    lock.hidden = false;
    if (store.profile.pinHash) {
      lockSetup.hidden = true;
      lockEnter.hidden = false;
      setTimeout(function () { $("#pin-enter").focus(); }, 60);
    } else {
      lockEnter.hidden = true;
      lockSetup.hidden = false;
    }
  }

  $("#btn-pin-set").addEventListener("click", function () {
    var pin = $("#pin-new").value.trim();
    if (!/^[0-9]{4,8}$/.test(pin)) return KP.toast("PIN mesti 4–8 digit nombor", "err");
    KP.hashPin(pin).then(function (h) {
      store.profile.pinHash = h;
      persist();
      KP.toast("PIN ditetapkan — selamat datang!", "ok");
      showApp();
    });
  });

  $("#btn-pin-skip").addEventListener("click", function () {
    store.profile.pinSkipped = true;
    persist();
    showApp();
  });

  function tryUnlock() {
    var pin = $("#pin-enter").value.trim();
    KP.hashPin(pin).then(function (h) {
      if (h === store.profile.pinHash) {
        $("#pin-enter").value = "";
        showApp();
      } else {
        KP.toast("PIN salah", "err");
        $("#pin-enter").value = "";
        $("#pin-enter").focus();
      }
    });
  }

  $("#btn-pin-unlock").addEventListener("click", tryUnlock);
  $("#pin-enter").addEventListener("keydown", function (e) { if (e.key === "Enter") tryUnlock(); });
  $("#pin-new").addEventListener("keydown", function (e) { if (e.key === "Enter") $("#btn-pin-set").click(); });

  $("#btn-pin-reset").addEventListener("click", function () {
    if (confirm("Padam SEMUA data (payout, pautan, transaksi) pada peranti ini? Tindakan ini tidak boleh diundur.")) {
      KP.wipe();
      location.reload();
    }
  });

  lockNowBtn.addEventListener("click", showLock);

  /* ================= NAVIGASI PANE ================= */
  $$("#side-nav button").forEach(function (b) {
    b.addEventListener("click", function () {
      $$("#side-nav button").forEach(function (x) { x.classList.remove("active"); });
      b.classList.add("active");
      $$(".pane").forEach(function (p) { p.classList.remove("active"); });
      $("#pane-" + b.dataset.pane).classList.add("active");
      if (b.dataset.pane === "overview") drawChart();
    });
  });

  function goPane(name) {
    var btn = $$("#side-nav button").filter(function (b) { return b.dataset.pane === name; })[0];
    if (btn) btn.click();
  }

  /* ================= MODAL GENERIK ================= */
  $$(".modal-back").forEach(function (m) {
    m.addEventListener("click", function (e) {
      if (e.target === m || e.target.hasAttribute("data-close")) m.classList.remove("open");
    });
  });

  function openModal(id) { $(id).classList.add("open"); }
  function closeModal(id) { $(id).classList.remove("open"); }

  /* ================= RENDER UTAMA ================= */
  function renderAll() {
    renderCounts();
    renderOverview();
    renderLinks();
    renderPayouts();
    renderOrders();
    fillSettings();
  }

  function renderCounts() {
    $("#n-links").textContent = store.products.length;
    $("#n-payouts").textContent = store.payouts.length;
    $("#n-orders").textContent = store.orders.filter(function (o) { return o.status === "pending"; }).length;
  }

  /* ---------- Ringkasan ---------- */
  function renderOverview() {
    $("#ov-shop").textContent = store.profile.shopName || "Kedai Anda";
    $("#ov-tagline").textContent = store.profile.tagline || "Selamat berniaga, bos!";

    var paid = store.orders.filter(function (o) { return o.status === "paid"; });
    var pending = store.orders.filter(function (o) { return o.status === "pending"; });
    var total = paid.reduce(function (s, o) { return s + (Number(o.amount) || 0); }, 0);
    var pendTotal = pending.reduce(function (s, o) { return s + (Number(o.amount) || 0); }, 0);

    $("#st-total").textContent = KP.fmtRM(total);
    $("#st-total-sub").textContent = paid.length + " transaksi disahkan";
    $("#st-pending").textContent = pending.length;
    $("#st-pending-sub").textContent = KP.fmtRM(pendTotal) + " belum disahkan";
    $("#st-links").textContent = store.products.filter(function (p) { return p.active !== false; }).length;
    $("#st-payouts").textContent = store.payouts.filter(function (p) { return p.enabled; }).length;
    var kinds = {};
    store.payouts.forEach(function (p) { if (p.enabled) kinds[p.type] = 1; });
    var kindLabels = Object.keys(kinds).map(function (k) { return KP.METHODS[k] ? KP.METHODS[k].label.split(" ")[0] : k; });
    $("#st-payouts-sub").textContent = kindLabels.length ? kindLabels.join(" · ") : "belum ditetapkan";

    var recent = store.orders.slice().sort(function (a, b) { return b.created - a.created; }).slice(0, 5);
    $("#ov-recent").innerHTML = recent.length ? recent.map(orderItemHtml).join("") :
      '<div class="empty"><span class="big-ic">🌙</span>Belum ada transaksi. Cipta pautan jualan &amp; kongsikan kepada kohort!<br><br><button class="ibtn gold" id="ov-seed" type="button">✨ Isi Data Demo</button></div>';
    bindOrderActions("#ov-recent");
    var seed = $("#ov-seed");
    if (seed) seed.addEventListener("click", seedDemo);

    drawChart();
  }

  /* Carta kutipan 14 hari */
  function drawChart() {
    var cv = $("#kp-chart");
    if (!cv || !cv.offsetParent) return;
    var dpr = Math.min(2, window.devicePixelRatio || 1);
    var W = cv.clientWidth || cv.parentElement.clientWidth, H = 170;
    cv.width = W * dpr; cv.height = H * dpr;
    var ctx = cv.getContext("2d");
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, W, H);

    var days = [], sums = [];
    var now = new Date(); now.setHours(0, 0, 0, 0);
    for (var i = 13; i >= 0; i--) {
      var d = new Date(now.getTime() - i * 864e5);
      days.push(d);
      sums.push(0);
    }
    store.orders.forEach(function (o) {
      if (o.status !== "paid") return;
      var od = new Date(o.created); od.setHours(0, 0, 0, 0);
      var idx = Math.round((od - days[0]) / 864e5);
      if (idx >= 0 && idx < 14) sums[idx] += Number(o.amount) || 0;
    });

    var max = Math.max.apply(null, sums.concat([1]));
    var padL = 8, padB = 22, padT = 12;
    var bw = (W - padL * 2) / 14;

    if (sums.every(function (v) { return v === 0; })) {
      ctx.fillStyle = "rgba(156,146,184,.7)";
      ctx.font = "600 13px Manrope, sans-serif";
      ctx.textAlign = "center";
      ctx.fillText("Tiada kutipan disahkan dalam 14 hari terakhir — carta akan hidup di sini ✨", W / 2, H / 2);
      return;
    }

    days.forEach(function (d, i) {
      var v = sums[i];
      var h = v === 0 ? 2 : Math.max(4, (H - padB - padT) * (v / max));
      var x = padL + i * bw + bw * 0.18, y = H - padB - h, w = bw * 0.64;
      var g = ctx.createLinearGradient(0, y, 0, H - padB);
      g.addColorStop(0, v === 0 ? "rgba(156,146,184,.25)" : "rgba(233,227,248,.95)");
      g.addColorStop(1, v === 0 ? "rgba(156,146,184,.15)" : "rgba(127,95,192,.55)");
      ctx.fillStyle = g;
      ctx.beginPath();
      var r = Math.min(5, w / 2);
      ctx.moveTo(x, y + r);
      ctx.arcTo(x, y, x + w, y, r);
      ctx.arcTo(x + w, y, x + w, y + h, r);
      ctx.lineTo(x + w, H - padB);
      ctx.lineTo(x, H - padB);
      ctx.closePath();
      ctx.fill();
      if (i % 2 === 1) {
        ctx.fillStyle = "rgba(156,146,184,.75)";
        ctx.font = "700 9.5px Manrope, sans-serif";
        ctx.textAlign = "center";
        ctx.fillText(d.getDate() + "/" + (d.getMonth() + 1), x + w / 2, H - 7);
      }
    });
  }

  window.addEventListener("resize", function () { drawChart(); }, { passive: true });

  /* ---------- Pautan Jualan ---------- */
  function priceLabel(p) {
    return p.openAmount ? "Jumlah terbuka (min " + KP.fmtRM(p.minAmount || 1) + ")" : KP.fmtRM(p.price);
  }

  function renderLinks() {
    var el = $("#list-links");
    if (!store.products.length) {
      el.innerHTML = '<div class="empty"><span class="big-ic">🔗</span>Belum ada pautan jualan.' +
        (store.payouts.length ? "" : "<br>Tip: tambah <b>kaedah payout</b> dahulu di tab Payout.") +
        '<br><br><button class="ibtn gold" id="empty-new-link" type="button">＋ Cipta Pautan Pertama</button></div>';
      var b = $("#empty-new-link");
      if (b) b.addEventListener("click", function () { openProductModal(null); });
      return;
    }
    el.innerHTML = store.products.map(function (p) {
      var m = (p.methods && p.methods.length)
        ? p.methods.length + " kaedah dipilih"
        : "semua kaedah aktif";
      return '<div class="item" data-id="' + p.id + '">' +
        '<div class="thumb">' + (p.img ? '<img src="' + p.img + '" alt="">' : "🛍️") + "</div>" +
        '<div class="meta"><b>' + KP.esc(p.name) + "</b><span>" + priceLabel(p) + " · " + m + "</span></div>" +
        '<span class="badge ' + (p.active !== false ? "ok" : "") + '">' + (p.active !== false ? "Aktif" : "Tutup") + "</span>" +
        '<div class="acts">' +
        '<button class="ibtn gold" data-act="share" type="button">Kongsi</button>' +
        '<button class="ibtn" data-act="edit" type="button">Edit</button>' +
        '<button class="ibtn" data-act="toggle" type="button">' + (p.active !== false ? "Tutup" : "Buka") + "</button>" +
        '<button class="ibtn danger" data-act="del" type="button">Padam</button>' +
        "</div></div>";
    }).join("");

    $$("#list-links .item").forEach(function (it) {
      var id = it.dataset.id;
      it.querySelectorAll("[data-act]").forEach(function (b) {
        b.addEventListener("click", function () {
          var p = store.products.filter(function (x) { return x.id === id; })[0];
          if (!p) return;
          if (b.dataset.act === "share") openShare(p);
          if (b.dataset.act === "edit") openProductModal(p);
          if (b.dataset.act === "toggle") { p.active = p.active === false ? true : false; persist(); renderLinks(); renderOverview(); }
          if (b.dataset.act === "del" && confirm('Padam pautan "' + p.name + '"?')) {
            store.products = store.products.filter(function (x) { return x.id !== id; });
            persist(); renderAll();
          }
        });
      });
    });
  }

  /* Modal produk */
  var mpEditing = null, mpImg = null, mpPriceType = "fixed";

  function openProductModal(p) {
    if (!store.payouts.length) {
      KP.toast("Tambah sekurang-kurangnya satu kaedah payout dahulu", "err");
      goPane("payouts");
      return;
    }
    mpEditing = p || null;
    mpImg = p ? p.img || null : null;
    mpPriceType = p && p.openAmount ? "open" : "fixed";
    $("#mp-title").textContent = p ? "Edit Pautan Jualan" : "Cipta Pautan Jualan";
    $("#mp-name").value = p ? p.name : "";
    $("#mp-price").value = p && !p.openAmount ? p.price : "";
    $("#mp-min").value = p && p.openAmount ? (p.minAmount || 1) : "";
    $("#mp-desc").value = p ? p.desc || "" : "";
    $("#mp-qty").checked = p ? !!p.allowQty : false;
    setPriceType(mpPriceType);
    renderMpImg();
    renderMpMethods(p);
    openModal("#m-product");
  }

  function setPriceType(t) {
    mpPriceType = t;
    $$("#mp-pricetype button").forEach(function (b) { b.classList.toggle("active", b.dataset.v === t); });
    $("#mp-fixed-wrap").hidden = t !== "fixed";
    $("#mp-open-wrap").hidden = t !== "open";
  }

  $$("#mp-pricetype button").forEach(function (b) {
    b.addEventListener("click", function () { setPriceType(b.dataset.v); });
  });

  function renderMpImg() {
    var prev = $("#mp-imgprev");
    if (mpImg) {
      prev.classList.add("show");
      $("#mp-imgprev-img").src = mpImg;
      $("#mp-imgprev-size").textContent = "~" + Math.round(mpImg.length * 0.75 / 1024) + " KB dalam pautan";
    } else {
      prev.classList.remove("show");
    }
  }

  $("#mp-imgdrop").addEventListener("click", function () { $("#mp-imgfile").click(); });
  $("#mp-imgfile").addEventListener("change", function () {
    var f = this.files[0];
    this.value = "";
    if (!f) return;
    KP.compressImage(f, 220, false).then(function (durl) {
      mpImg = durl;
      renderMpImg();
      KP.toast("Gambar dimampatkan & sedia", "ok");
    }).catch(function () { KP.toast("Gagal membaca gambar", "err"); });
  });
  $("#mp-imgremove").addEventListener("click", function () { mpImg = null; renderMpImg(); });

  function renderMpMethods(p) {
    var el = $("#mp-methods");
    el.innerHTML = store.payouts.map(function (po) {
      var checked = !p || !p.methods || !p.methods.length || p.methods.indexOf(po.id) !== -1;
      var meta = KP.METHODS[po.type] || { label: po.type, icon: "•" };
      return '<label class="switch-row" style="cursor:pointer">' +
        '<div class="sw-meta"><b>' + meta.icon + " " + KP.esc(meta.label) + "</b><span>" + KP.esc(po.label || payoutSummary(po)) + "</span></div>" +
        '<input type="checkbox" class="switch mp-mcheck" value="' + po.id + '"' + (checked ? " checked" : "") + ">" +
        "</label>";
    }).join("");
  }

  $("#mp-save").addEventListener("click", function () {
    var name = $("#mp-name").value.trim();
    if (!name) return KP.toast("Masukkan nama produk", "err");
    var open = mpPriceType === "open";
    var price = parseFloat($("#mp-price").value);
    var min = parseFloat($("#mp-min").value);
    if (!open && (!isFinite(price) || price <= 0)) return KP.toast("Masukkan harga yang sah", "err");
    var picked = $$(".mp-mcheck").filter(function (c) { return c.checked; }).map(function (c) { return c.value; });
    if (!picked.length) return KP.toast("Pilih sekurang-kurangnya satu kaedah bayaran", "err");
    var methods = picked.length === store.payouts.length ? [] : picked;

    if (mpEditing) {
      mpEditing.name = name;
      mpEditing.openAmount = open;
      mpEditing.price = open ? 0 : price;
      mpEditing.minAmount = open ? (isFinite(min) && min > 0 ? min : 1) : null;
      mpEditing.desc = $("#mp-desc").value.trim();
      mpEditing.allowQty = $("#mp-qty").checked && !open;
      mpEditing.img = mpImg;
      mpEditing.methods = methods;
    } else {
      store.products.unshift({
        id: KP.uid("prd"),
        name: name,
        openAmount: open,
        price: open ? 0 : price,
        minAmount: open ? (isFinite(min) && min > 0 ? min : 1) : null,
        desc: $("#mp-desc").value.trim(),
        allowQty: $("#mp-qty").checked && !open,
        img: mpImg,
        methods: methods,
        active: true,
        created: Date.now()
      });
    }
    persist();
    closeModal("#m-product");
    renderAll();
    KP.toast(mpEditing ? "Pautan dikemas kini" : "Pautan dicipta — sedia dikongsi!", "ok");
    if (!mpEditing) {
      var p = store.products[0];
      openShare(p);
    }
    mpEditing = null;
  });

  $("#btn-new-link").addEventListener("click", function () { openProductModal(null); });
  $("#btn-new-link-ov").addEventListener("click", function () { openProductModal(null); });

  /* ---------- Kongsi ---------- */
  function openShare(p) {
    var payload = KP.buildLinkPayload(store, p);
    var url = KP.checkoutUrl(payload);
    $("#ms-prodname").textContent = p.name + " · " + priceLabel(p);
    $("#ms-url").value = url;

    var qrUrl = url, lightNote = "";
    if (url.length > 1500) {
      var light = KP.buildLinkPayload(store, Object.assign({}, p, { img: null }));
      qrUrl = KP.checkoutUrl(light);
      lightNote = " (versi ringan tanpa gambar)";
    }
    var qrImg = $("#ms-qr");
    try {
      qrImg.src = KP.qrDataUrl(qrUrl, 300);
      qrImg.parentElement.style.display = "";
      $("#ms-dlqr").href = qrImg.src;
      $("#ms-dlqr").style.display = "";
    } catch (e) {
      qrImg.parentElement.style.display = "none";
      $("#ms-dlqr").style.display = "none";
    }

    var msg = "🛍️ " + p.name + "\n💰 " + priceLabel(p) + "\n\nBayar di sini (DuitNow QR / FPX / Bank / Kad):\n" + url;
    $("#ms-wa").href = "https://wa.me/?text=" + encodeURIComponent(msg);
    $("#ms-tg").href = "https://t.me/share/url?url=" + encodeURIComponent(url) + "&text=" + encodeURIComponent("🛍️ " + p.name + " · " + priceLabel(p) + lightNote);
    $("#ms-open").href = url;
    openModal("#m-share");
  }

  $("#ms-copy").addEventListener("click", function () {
    KP.copyText($("#ms-url").value).then(function (ok) {
      KP.toast(ok ? "Pautan disalin!" : "Gagal menyalin — salin manual", ok ? "ok" : "err");
    });
  });

  /* ---------- Payout ---------- */
  function payoutSummary(po) {
    if (po.type === "bank") {
      var acc = String(po.accNo || "");
      var masked = acc.length > 4 ? acc.slice(0, 2) + "••••" + acc.slice(-4) : acc;
      return (po.bank || "Bank") + " · " + masked + (po.showName ? " · nama dipaparkan" : " · nama disembunyikan");
    }
    if (po.type === "duitnow") return po.payload ? "QR dibaca & dijana semula ✓" : (po.img ? "Imej QR asal" : "Belum ada QR");
    if (po.type === "tng") return (po.phone ? po.phone + " · " : "") + (po.payload ? "QR dibaca ✓" : po.img ? "Imej QR" : "");
    if (po.type === "gw") return po.gatewayUrl || "";
    return "";
  }

  function renderPayouts() {
    var el = $("#list-payouts");
    if (!store.payouts.length) {
      el.innerHTML = '<div class="empty"><span class="big-ic">💸</span>Belum ada kaedah payout. Tambah akaun bank, TNG atau QR DuitNow anda —<br>ini destinasi wang anda, pembeli tidak akan nampak butiran sensitif.' +
        '<br><br><button class="ibtn gold" id="empty-new-po" type="button">＋ Tambah Payout Pertama</button></div>';
      var b = $("#empty-new-po");
      if (b) b.addEventListener("click", function () { openPayoutModal(null); });
      return;
    }
    el.innerHTML = store.payouts.map(function (po) {
      var meta = KP.METHODS[po.type] || { label: po.type, icon: "•" };
      return '<div class="item" data-id="' + po.id + '">' +
        '<div class="thumb">' + meta.icon + "</div>" +
        '<div class="meta"><b>' + KP.esc(po.label || meta.label) + "</b><span>" + KP.esc(meta.label + " — " + payoutSummary(po)) + "</span></div>" +
        '<span class="badge ' + (po.enabled ? "ok" : "") + '">' + (po.enabled ? "Aktif" : "Tutup") + "</span>" +
        '<div class="acts">' +
        '<button class="ibtn" data-act="toggle" type="button">' + (po.enabled ? "Tutup" : "Buka") + "</button>" +
        '<button class="ibtn" data-act="edit" type="button">Edit</button>' +
        '<button class="ibtn danger" data-act="del" type="button">Padam</button>' +
        "</div></div>";
    }).join("");

    $$("#list-payouts .item").forEach(function (it) {
      var id = it.dataset.id;
      it.querySelectorAll("[data-act]").forEach(function (b) {
        b.addEventListener("click", function () {
          var po = store.payouts.filter(function (x) { return x.id === id; })[0];
          if (!po) return;
          if (b.dataset.act === "toggle") { po.enabled = !po.enabled; persist(); renderPayouts(); renderOverview(); }
          if (b.dataset.act === "edit") openPayoutModal(po);
          if (b.dataset.act === "del" && confirm("Padam kaedah payout ini?")) {
            store.payouts = store.payouts.filter(function (x) { return x.id !== id; });
            persist(); renderAll();
          }
        });
      });
    });
  }

  /* Modal payout */
  var moEditing = null, moQr = { payload: null, img: null };

  var bankSel = $("#mo-bank");
  bankSel.innerHTML = KP.BANKS.map(function (b) { return "<option>" + b + "</option>"; }).join("") + "<option>Lain-lain</option>";

  function openPayoutModal(po) {
    moEditing = po || null;
    moQr = { payload: po ? po.payload || null : null, img: po ? po.img || null : null };
    $("#mo-title").textContent = po ? "Edit Kaedah Payout" : "Tambah Kaedah Payout";
    $("#mo-type").value = po ? po.type : "duitnow";
    $("#mo-type").disabled = !!po;
    $("#mo-label").value = po ? po.label || "" : "";
    $("#mo-phone").value = po ? po.phone || "" : "";
    $("#mo-bank").value = po && po.bank ? po.bank : KP.BANKS[0];
    $("#mo-acc").value = po ? po.accNo || "" : "";
    $("#mo-holder").value = po ? po.holder || "" : "";
    $("#mo-showname").checked = po ? !!po.showName : false;
    $("#mo-gwurl").value = po ? po.gatewayUrl || "" : "";
    syncPayoutFields();
    renderMoQrPreview();
    openModal("#m-payout");
  }

  function syncPayoutFields() {
    var t = $("#mo-type").value;
    $("#mo-qr-wrap").hidden = !(t === "duitnow" || t === "tng");
    $("#mo-tng-wrap").hidden = t !== "tng";
    $("#mo-bank-wrap").hidden = t !== "bank";
    $("#mo-gw-wrap").hidden = t !== "gw";
  }

  $("#mo-type").addEventListener("change", syncPayoutFields);

  function renderMoQrPreview() {
    var prev = $("#mo-qrprev");
    if (moQr.payload) {
      prev.classList.add("show");
      $("#mo-qrprev-img").src = KP.qrDataUrl(moQr.payload, 168);
      $("#mo-qrprev-t").textContent = "QR berjaya dibaca ✓";
      $("#mo-qrprev-s").textContent = "Dijana semula secara digital — tajam & ringan dalam pautan";
    } else if (moQr.img) {
      prev.classList.add("show");
      $("#mo-qrprev-img").src = moQr.img;
      $("#mo-qrprev-t").textContent = "Imej QR digunakan terus";
      $("#mo-qrprev-s").textContent = "QR tidak dapat ditafsir — imej asal akan dipaparkan (masih boleh diimbas)";
    } else {
      prev.classList.remove("show");
    }
  }

  function handleQrFile(f) {
    if (!f) return;
    KP.toast("Membaca QR…");
    KP.readQrFromFile(f).then(function (res) {
      if (res && res.text) {
        moQr.payload = res.text;
        moQr.img = null;
        renderMoQrPreview();
        KP.toast("QR berjaya dibaca & dijana semula ✓", "ok");
      } else {
        return KP.compressImage(f, 460, true).then(function (durl) {
          moQr.payload = null;
          moQr.img = durl;
          renderMoQrPreview();
          KP.toast("QR disimpan sebagai imej (tidak dapat ditafsir)", "ok");
        });
      }
    }).catch(function () { KP.toast("Gagal membaca fail", "err"); });
  }

  $("#mo-qrdrop").addEventListener("click", function () { $("#mo-qrfile").click(); });
  $("#mo-qrfile").addEventListener("change", function () { var f = this.files[0]; this.value = ""; handleQrFile(f); });
  ["dragover", "dragleave", "drop"].forEach(function (ev) {
    $("#mo-qrdrop").addEventListener(ev, function (e) {
      e.preventDefault();
      this.classList.toggle("drag", ev === "dragover");
      if (ev === "drop" && e.dataTransfer.files[0]) handleQrFile(e.dataTransfer.files[0]);
    });
  });
  $("#mo-qrremove").addEventListener("click", function () { moQr = { payload: null, img: null }; renderMoQrPreview(); });

  $("#mo-save").addEventListener("click", function () {
    var t = $("#mo-type").value;
    var data = {
      type: t,
      label: $("#mo-label").value.trim(),
      enabled: moEditing ? moEditing.enabled : true
    };
    if (t === "duitnow") {
      if (!moQr.payload && !moQr.img) return KP.toast("Muat naik imej QR DuitNow anda", "err");
      data.payload = moQr.payload; data.img = moQr.img;
    }
    if (t === "tng") {
      var ph = $("#mo-phone").value.trim();
      if (!moQr.payload && !moQr.img && !ph) return KP.toast("Muat naik QR TNG atau isi no. telefon", "err");
      data.payload = moQr.payload; data.img = moQr.img; data.phone = ph;
    }
    if (t === "bank") {
      var acc = $("#mo-acc").value.trim();
      if (!acc) return KP.toast("Masukkan nombor akaun", "err");
      data.bank = $("#mo-bank").value;
      data.accNo = acc;
      data.holder = $("#mo-holder").value.trim();
      data.showName = $("#mo-showname").checked;
    }
    if (t === "gw") {
      var u = $("#mo-gwurl").value.trim();
      if (!/^https?:\/\/.+/i.test(u)) return KP.toast("Masukkan URL gerbang yang sah (https://…)", "err");
      data.gatewayUrl = u;
    }

    if (moEditing) {
      Object.assign(moEditing, data);
    } else {
      data.id = KP.uid("po");
      store.payouts.push(data);
    }
    persist();
    closeModal("#m-payout");
    renderAll();
    KP.toast(moEditing ? "Payout dikemas kini" : "Payout ditambah!", "ok");
    moEditing = null;
  });

  $("#btn-new-payout").addEventListener("click", function () { openPayoutModal(null); });
  $("#btn-new-payout-ov").addEventListener("click", function () { openPayoutModal(null); });

  /* ---------- Transaksi ---------- */
  var orderFilter = "all";

  function statusBadge(st) {
    if (st === "paid") return '<span class="badge ok">Disahkan</span>';
    if (st === "cancelled") return '<span class="badge bad">Dibatal</span>';
    return '<span class="badge warn">Menunggu</span>';
  }

  function orderItemHtml(o) {
    var meta = KP.METHODS[o.method] || { label: o.method || "—", icon: "🧾" };
    var who = o.buyer ? KP.esc(o.buyer) : "Pembeli";
    var sub = [meta.label, KP.fmtDate(o.created, true)];
    if (o.qty && o.qty > 1) sub.unshift(o.qty + " unit");
    return '<div class="item" data-oid="' + o.id + '">' +
      '<div class="thumb">' + meta.icon + "</div>" +
      '<div class="meta"><b>' + KP.esc(o.productName || "Pesanan") + " — " + who + "</b>" +
      "<span>" + KP.esc(o.code) + " · " + sub.join(" · ") + (o.note ? " · “" + KP.esc(o.note) + "”" : "") + "</span></div>" +
      '<b style="font-variant-numeric:tabular-nums;white-space:nowrap">' + KP.fmtRM(o.amount) + "</b>" +
      statusBadge(o.status) +
      '<div class="acts">' +
      (o.status === "pending" ? '<button class="ibtn ok" data-act="paid" type="button">✓ Sahkan</button><button class="ibtn" data-act="cancel" type="button">Batal</button>' : "") +
      '<button class="ibtn danger" data-act="del" type="button">Padam</button>' +
      "</div></div>";
  }

  function bindOrderActions(rootSel) {
    $$(rootSel + " .item[data-oid]").forEach(function (it) {
      var id = it.dataset.oid;
      it.querySelectorAll("[data-act]").forEach(function (b) {
        b.addEventListener("click", function () {
          var o = store.orders.filter(function (x) { return x.id === id; })[0];
          if (!o) return;
          if (b.dataset.act === "paid") { o.status = "paid"; o.paidAt = Date.now(); KP.toast("Transaksi disahkan ✓", "ok"); }
          if (b.dataset.act === "cancel") { o.status = "cancelled"; }
          if (b.dataset.act === "del") {
            if (!confirm("Padam rekod " + o.code + "?")) return;
            store.orders = store.orders.filter(function (x) { return x.id !== id; });
          }
          persist();
          renderAll();
        });
      });
    });
  }

  function renderOrders() {
    var el = $("#list-orders");
    var list = store.orders.slice().sort(function (a, b) { return b.created - a.created; });
    if (orderFilter !== "all") list = list.filter(function (o) { return o.status === orderFilter; });
    el.innerHTML = list.length ? list.map(orderItemHtml).join("") :
      '<div class="empty"><span class="big-ic">🧾</span>Tiada rekod dalam kategori ini.<br>Pesanan masuk apabila anda import kod <b>KPORD1.</b> daripada pembeli.</div>';
    bindOrderActions("#list-orders");

    $$("#order-filters .ibtn").forEach(function (b) {
      b.classList.toggle("gold", b.dataset.f === orderFilter);
    });
  }

  $$("#order-filters .ibtn").forEach(function (b) {
    b.addEventListener("click", function () { orderFilter = b.dataset.f; renderOrders(); });
  });

  $("#btn-import-order").addEventListener("click", function () {
    $("#mi-text").value = "";
    openModal("#m-import");
    setTimeout(function () { $("#mi-text").focus(); }, 60);
  });

  $("#mi-save").addEventListener("click", function () {
    var d = KP.decodeOrder($("#mi-text").value);
    if (!d) return KP.toast("Kod tidak sah — pastikan keseluruhan kod KPORD1. ditampal", "err");
    if (store.orders.some(function (o) { return o.code === d.c; })) {
      return KP.toast("Pesanan " + d.c + " sudah wujud dalam rekod", "err");
    }
    store.orders.unshift({
      id: KP.uid("ord"),
      code: d.c,
      productName: d.p || "Pesanan",
      amount: Number(d.a) || 0,
      qty: d.q || 1,
      method: d.m || "",
      buyer: d.b || "",
      phone: d.ph || "",
      note: d.n || "",
      status: "pending",
      created: d.t || Date.now()
    });
    persist();
    closeModal("#m-import");
    renderAll();
    goPane("orders");
    KP.toast("Pesanan " + d.c + " diimport — sahkan selepas wang masuk", "ok");
  });

  /* ---------- Tetapan ---------- */
  function fillSettings() {
    $("#set-shop").value = store.profile.shopName || "";
    $("#set-tagline").value = store.profile.tagline || "";
    $("#set-wa").value = store.profile.waNumber || "";
    $("#set-tg").value = store.profile.tgUser || "";
  }

  $("#btn-save-profile").addEventListener("click", function () {
    store.profile.shopName = $("#set-shop").value.trim() || "STPM Kohort 20266";
    store.profile.tagline = $("#set-tagline").value.trim();
    store.profile.waNumber = $("#set-wa").value.trim();
    store.profile.tgUser = $("#set-tg").value.trim().replace(/^@/, "");
    persist();
    renderOverview();
    KP.toast("Profil disimpan — pautan baharu akan guna maklumat ini", "ok");
  });

  $("#btn-save-pin").addEventListener("click", function () {
    var pin = $("#set-pin").value.trim();
    if (!pin) {
      store.profile.pinHash = null;
      store.profile.pinSkipped = true;
      persist();
      lockNowBtn.hidden = true;
      KP.toast("PIN dibuang — dashboard tidak berkunci", "ok");
      return;
    }
    if (!/^[0-9]{4,8}$/.test(pin)) return KP.toast("PIN mesti 4–8 digit nombor", "err");
    KP.hashPin(pin).then(function (h) {
      store.profile.pinHash = h;
      persist();
      $("#set-pin").value = "";
      lockNowBtn.hidden = false;
      KP.toast("PIN dikemas kini", "ok");
    });
  });

  $("#btn-export").addEventListener("click", function () {
    var blob = new Blob([JSON.stringify(store, null, 2)], { type: "application/json" });
    var a = document.createElement("a");
    var d = new Date();
    a.href = URL.createObjectURL(blob);
    a.download = "kohortpay-sandaran-" + d.getFullYear() + String(d.getMonth() + 1).padStart(2, "0") + String(d.getDate()).padStart(2, "0") + ".json";
    a.click();
    setTimeout(function () { URL.revokeObjectURL(a.href); }, 4000);
    KP.toast("Sandaran dimuat turun", "ok");
  });

  $("#btn-import").addEventListener("click", function () { $("#file-import").click(); });
  $("#file-import").addEventListener("change", function () {
    var f = this.files[0];
    this.value = "";
    if (!f) return;
    var r = new FileReader();
    r.onload = function () {
      try {
        var d = JSON.parse(r.result);
        if (!d || d.v !== 1 || !d.profile) throw new Error("bad");
        if (!confirm("Gantikan SEMUA data semasa dengan sandaran ini?")) return;
        store = d;
        persist();
        renderAll();
        KP.toast("Sandaran dipulihkan ✓", "ok");
      } catch (e) {
        KP.toast("Fail sandaran tidak sah", "err");
      }
    };
    r.readAsText(f);
  });

  $("#btn-wipe").addEventListener("click", function () {
    if (!confirm("Padam SEMUA data KohortPay pada peranti ini?")) return;
    if (!confirm("Pasti? Payout, pautan & transaksi akan hilang selama-lamanya.")) return;
    KP.wipe();
    location.reload();
  });

  /* ---------- Data demo ---------- */
  function seedDemo() {
    if (store.orders.length || store.products.length || store.payouts.length) {
      if (!confirm("Tambah data demo pada data sedia ada?")) return;
    }
    var demoDuitnow = "00020201021126580014A000000615000101065887370208DEMO-QR0303UEN5204732553034585802MY5913KOHORT 20266 6009DEMO CITY6304ABCD";
    var poQr = { id: KP.uid("po"), type: "duitnow", label: "DuitNow utama (demo)", payload: demoDuitnow, img: null, enabled: true };
    var poBank = { id: KP.uid("po"), type: "bank", label: "Akaun simpanan (demo)", bank: "Maybank", accNo: "1122003344556", holder: "Nama Anda", showName: false, enabled: true };
    var poGw = { id: KP.uid("po"), type: "gw", label: "ToyyibPay (demo)", gatewayUrl: "https://toyyibpay.com", enabled: true };
    store.payouts.push(poQr, poBank, poGw);

    store.products.unshift(
      { id: KP.uid("prd"), name: "Baju Kohort 20266 — Edisi Terhad", openAmount: false, price: 35, minAmount: null, desc: "Cotton premium 240gsm, cetakan lambang kohort. Saiz S–XXL.", allowQty: true, img: null, methods: [], active: true, created: Date.now() },
      { id: KP.uid("prd"), name: "Nota Padat Sejarah Penggal 3 (PDF)", openAmount: false, price: 12, minAmount: null, desc: "68 muka surat, ikut sukatan MPM terkini.", allowQty: false, img: null, methods: [], active: true, created: Date.now() },
      { id: KP.uid("prd"), name: "Tabung Kelas — Sumbangan Terbuka", openAmount: true, price: 0, minAmount: 2, desc: "Sumbangan aktiviti kelas & jamuan kohort.", allowQty: false, img: null, methods: [], active: true, created: Date.now() }
    );

    var names = ["Aina", "Haziq", "Mei Ling", "Arjun", "Siti", "Danish", "Farah", "Wei Jian", "Nurul", "Iqbal"];
    var prods = [["Baju Kohort 20266 — Edisi Terhad", 35], ["Nota Padat Sejarah Penggal 3 (PDF)", 12], ["Tabung Kelas — Sumbangan Terbuka", 10]];
    var methods = ["duitnow", "bank", "gw", "duitnow", "duitnow", "tng"];
    for (var i = 0; i < 12; i++) {
      var pr = prods[Math.floor(Math.random() * prods.length)];
      var qty = pr[0].indexOf("Baju") === 0 ? 1 + Math.floor(Math.random() * 2) : 1;
      var st = i < 9 ? "paid" : i < 11 ? "pending" : "cancelled";
      store.orders.push({
        id: KP.uid("ord"),
        code: KP.orderCode(),
        productName: pr[0],
        amount: pr[1] * qty,
        qty: qty,
        method: methods[Math.floor(Math.random() * methods.length)],
        buyer: names[Math.floor(Math.random() * names.length)],
        phone: "",
        note: "",
        status: st,
        created: Date.now() - Math.floor(Math.random() * 13) * 864e5 - Math.floor(Math.random() * 8) * 36e5
      });
    }
    persist();
    renderAll();
    KP.toast("Data demo dimuatkan — jelajah setiap tab! ✨", "ok");
  }

  $("#btn-demo").addEventListener("click", seedDemo);

  /* ================= MULA ================= */
  if (store.profile.pinHash) {
    showLock();
  } else if (store.profile.pinSkipped) {
    showApp();
  } else {
    showLock(); // paparan setup pertama kali
  }
})();
