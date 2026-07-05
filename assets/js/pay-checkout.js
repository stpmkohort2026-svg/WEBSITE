/* ============================================================
   STPM KOHORT 20266 PAY — Checkout Pelanggan
   Membaca payload pautan daripada URL (#K1.…) — tiada pelayan.
   ============================================================ */
(function () {
  "use strict";

  var $ = function (s) { return document.querySelector(s); };

  var data = KP.decodeLink(location.hash);
  window.addEventListener("hashchange", function () { location.reload(); });

  if (!data) {
    $("#stage-invalid").hidden = false;
    return;
  }

  var card = $("#co-card");
  card.hidden = false;

  var product = data.p;
  var qty = 1;
  var openAmount = product.a == null;
  var selectedMethod = null;

  /* ---------- kepala kad ---------- */
  if (data.dm) $("#demo-band").hidden = false;
  $("#co-name").textContent = product.n || "Pesanan";
  $("#co-desc").textContent = product.d || "";
  $("#co-desc").style.display = product.d ? "" : "none";
  $("#co-seller").textContent = data.s || "Penjual Kohort";
  if (product.img) {
    $("#co-thumb").innerHTML = '<img src="' + product.img + '" alt="">';
  }

  /* ---------- jumlah ---------- */
  function currentAmount() {
    if (openAmount) {
      var v = parseFloat($("#open-amount").value);
      return isFinite(v) ? v : 0;
    }
    return (Number(product.a) || 0) * qty;
  }

  function renderAmount() {
    $("#co-amount").textContent = KP.fmtRM(currentAmount());
    $("#qty-val").textContent = qty;
    renderPayPanel(); // jumlah dipaparkan dalam arahan bayaran
  }

  if (openAmount) {
    $("#open-amount-wrap").hidden = false;
    var mn = Number(product.mn) || 1;
    $("#open-amount").min = mn;
    $("#open-amount").placeholder = mn.toFixed(2);
    $("#open-amount-help").textContent = "Minimum " + KP.fmtRM(mn) + " — masukkan jumlah yang anda ingin bayar.";
    $("#open-amount").addEventListener("input", renderAmount);
  } else if (product.q) {
    $("#qty-ctl").hidden = false;
    $("#qty-minus").addEventListener("click", function () { qty = Math.max(1, qty - 1); renderAmount(); });
    $("#qty-plus").addEventListener("click", function () { qty = Math.min(99, qty + 1); renderAmount(); });
  }

  /* ---------- kaedah bayaran ---------- */
  var methodRank = { duitnow: 0, gw: 1, tng: 2, bank: 3 };
  var methods = (data.m || []).filter(function (m) { return m && m.t; }).sort(function (a, b) {
    return (methodRank[a.t] != null ? methodRank[a.t] : 9) - (methodRank[b.t] != null ? methodRank[b.t] : 9);
  });

  var pmList = $("#pm-list");
  pmList.innerHTML = methods.map(function (m, i) {
    var meta = KP.METHODS[m.t] || { label: m.t, short: "", icon: "•", badge: "" };
    var label = meta.label;
    return '<button class="pm" type="button" data-i="' + i + '">' +
      '<span class="pm-ic">' + meta.icon + "</span>" +
      '<span class="pm-meta"><b>' + KP.esc(label) + "</b><span>" + KP.esc(meta.short) + "</span></span>" +
      (meta.badge ? '<span class="pm-badge">' + meta.badge + "</span>" : "") +
      '<span class="tick">✓</span>' +
      "</button>";
  }).join("");

  if (!methods.length) {
    pmList.innerHTML = '<div class="empty">Penjual belum menetapkan kaedah bayaran untuk pautan ini.</div>';
    $("#btn-paid").style.display = "none";
  }

  Array.prototype.forEach.call(pmList.querySelectorAll(".pm"), function (btn) {
    btn.addEventListener("click", function () {
      Array.prototype.forEach.call(pmList.querySelectorAll(".pm"), function (b) { b.classList.remove("sel"); });
      btn.classList.add("sel");
      selectedMethod = methods[Number(btn.dataset.i)];
      renderPayPanel();
    });
  });

  /* auto-pilih kaedah pertama */
  var firstPm = pmList.querySelector(".pm");
  if (firstPm) firstPm.click();

  /* ---------- panel arahan bayaran ---------- */
  function copyBtn(value, label) {
    return '<button class="ibtn" type="button" data-copy="' + KP.esc(value) + '">' + (label || "Salin") + "</button>";
  }

  function renderPayPanel() {
    var panel = $("#pay-panel");
    if (!selectedMethod) { panel.classList.remove("show"); panel.innerHTML = ""; return; }
    var m = selectedMethod;
    var amt = KP.fmtRM(currentAmount());
    var html = "";

    if (m.t === "duitnow" || m.t === "tng") {
      var qrSrc = null;
      try { qrSrc = m.q ? KP.qrDataUrl(m.q, 300) : (m.i || null); } catch (e) { qrSrc = m.i || null; }
      var appName = m.t === "tng" ? "app Touch 'n Go eWallet" : "mana-mana app bank atau e-wallet";
      if (qrSrc) {
        html += '<div class="qr-stage"><span class="scanline"></span><img src="' + qrSrc + '" alt="Kod QR bayaran"></div>' +
          '<div class="qr-cap">Imbas dengan <b>' + appName + "</b> dan bayar <b>" + amt + "</b></div>";
      }
      if (m.t === "tng" && m.ph) {
        html += '<div class="bank-lines" style="margin-top:1rem"><div class="bank-line"><span class="k">No. Telefon TNG</span><span class="v mono">' + KP.esc(m.ph) + "</span>" + copyBtn(m.ph) + "</div></div>";
      }
      html += '<ol class="co-steps">' +
        "<li>Buka " + appName + " anda</li>" +
        "<li>Pilih <b>Scan</b> / <b>Imbas QR</b> dan halakan ke kod di atas" + (qrSrc ? "" : " (minta QR daripada penjual)") + "</li>" +
        "<li>Masukkan jumlah <b>" + amt + "</b> dan sahkan bayaran</li>" +
        "<li>Simpan resit, kemudian tekan <b>Saya Sudah Bayar</b></li>" +
        "</ol>" +
        '<div class="priv-note">🕶️ <span><b>Privasi terjaga:</b> anda hanya perlu imbas — butiran peribadi penjual tidak dipaparkan di halaman ini.</span></div>';
    }

    if (m.t === "bank") {
      html += '<div class="bank-lines">' +
        '<div class="bank-line"><span class="k">Bank</span><span class="v">' + KP.esc(m.bk || "—") + "</span></div>" +
        '<div class="bank-line"><span class="k">No. Akaun</span><span class="v mono">' + KP.esc(m.ac || "—") + "</span>" + copyBtn(String(m.ac || "").replace(/\s+/g, "")) + "</div>" +
        '<div class="bank-line"><span class="k">Penerima</span><span class="v">' + (m.hn ? KP.esc(m.hn) : "Dilindungi 🕶️") + "</span></div>" +
        '<div class="bank-line"><span class="k">Jumlah Tepat</span><span class="v mono">' + amt + "</span>" + copyBtn(currentAmount().toFixed(2)) + "</div>" +
        "</div>" +
        '<ol class="co-steps">' +
        "<li>Buka app bank anda &amp; pilih <b>Pindahan / DuitNow Transfer</b></li>" +
        "<li>Salin nombor akaun di atas dan masukkan jumlah tepat <b>" + amt + "</b></li>" +
        "<li>Siapkan pindahan &amp; simpan resit, kemudian tekan <b>Saya Sudah Bayar</b></li>" +
        "</ol>";
      if (!m.hn) {
        html += '<div class="priv-note">🕶️ <span><b>Nota:</b> nama penerima disembunyikan di halaman ini untuk privasi penjual. App bank anda mungkin memaparkan nama semasa pindahan — itu proses standard bank.</span></div>';
      }
    }

    if (m.t === "gw") {
      var label = m.lb || "FPX / Kad Kredit / Debit";
      html += '<div class="bank-lines">' +
        '<div class="bank-line"><span class="k">Kaedah</span><span class="v">' + KP.esc(label) + "</span></div>" +
        '<div class="bank-line"><span class="k">Jumlah</span><span class="v mono">' + amt + "</span></div>" +
        "</div>" +
        '<div class="co-cta" style="margin-top:1.1rem">' +
        '<a class="btn btn-gold btn-block" href="' + KP.esc(m.u) + '" target="_blank" rel="noopener">Teruskan ke Bayaran Selamat ↗</a>' +
        "</div>" +
        '<ol class="co-steps">' +
        "<li>Tekan butang di atas — anda akan dibawa ke gerbang bayaran berlesen</li>" +
        "<li>Pilih <b>FPX (bank online)</b> atau <b>kad kredit/debit</b> dan bayar <b>" + amt + "</b></li>" +
        "<li>Selepas berjaya, kembali ke sini dan tekan <b>Saya Sudah Bayar</b></li>" +
        "</ol>" +
        '<div class="priv-note">🔒 <span>Bayaran diproses oleh gerbang pembayaran selamat. Kohort Pay tidak menyimpan sebarang maklumat kad anda.</span></div>';
    }

    panel.innerHTML = html;
    panel.classList.add("show");

    Array.prototype.forEach.call(panel.querySelectorAll("[data-copy]"), function (b) {
      b.addEventListener("click", function () {
        KP.copyText(b.getAttribute("data-copy")).then(function (ok) {
          KP.toast(ok ? "Disalin!" : "Gagal menyalin", ok ? "ok" : "err");
        });
      });
    });
  }

  /* ---------- peringkat 2 & 3 ---------- */
  var orderMsg = "";

  $("#btn-paid").addEventListener("click", function () {
    if (!selectedMethod) return KP.toast("Pilih kaedah bayaran dahulu", "err");
    var amt = currentAmount();
    var mn = Number(product.mn) || 1;
    if (openAmount && (!isFinite(amt) || amt < mn)) {
      $("#open-amount").focus();
      return KP.toast("Masukkan jumlah minimum " + KP.fmtRM(mn), "err");
    }
    $("#stage-pay").hidden = true;
    $("#stage-confirm").hidden = false;
    setTimeout(function () { $("#buyer-name").focus(); }, 80);
  });

  $("#btn-back-pay").addEventListener("click", function () {
    $("#stage-confirm").hidden = true;
    $("#stage-pay").hidden = false;
  });

  $("#btn-gen-order").addEventListener("click", function () {
    var name = $("#buyer-name").value.trim();
    if (!name) {
      $("#buyer-name").focus();
      return KP.toast("Masukkan nama anda", "err");
    }
    var code = KP.orderCode();
    var order = {
      c: code,
      p: product.n || "Pesanan",
      a: Number(currentAmount().toFixed(2)),
      q: qty,
      m: selectedMethod ? selectedMethod.t : "",
      b: name,
      ph: $("#buyer-phone").value.trim(),
      n: $("#buyer-note").value.trim(),
      t: Date.now()
    };
    var token = KP.encodeOrder(order);
    var methodLabel = (KP.METHODS[order.m] || { label: order.m }).label;

    orderMsg =
      "🧾 PESANAN BARU — " + (data.s || "Kohort Pay") + "\n" +
      "Produk: " + order.p + (order.q > 1 ? " ×" + order.q : "") + "\n" +
      "Jumlah: " + KP.fmtRM(order.a) + "\n" +
      "Kaedah: " + methodLabel + "\n" +
      "Nama: " + order.b + (order.ph ? " (" + order.ph + ")" : "") + "\n" +
      (order.n ? "Nota: " + order.n + "\n" : "") +
      "Kod Pesanan: " + code + "\n\n" +
      "Kod import penjual (tampal dalam dashboard):\n" + token + "\n\n" +
      "📎 Resit bayaran dilampirkan bersama.";

    $("#done-code").textContent = code;

    var wa = $("#btn-send-wa"), tg = $("#btn-send-tg");
    if (data.w) {
      wa.hidden = false;
      wa.href = KP.waLink(data.w, orderMsg);
    } else {
      wa.hidden = false;
      wa.href = "https://wa.me/?text=" + encodeURIComponent(orderMsg);
      wa.innerHTML = wa.innerHTML.replace("Hantar Kepada Penjual (WhatsApp)", "Kongsi Melalui WhatsApp");
    }
    if (data.tg) {
      tg.hidden = false;
      tg.href = "https://t.me/share/url?url=" + encodeURIComponent("https://t.me/" + data.tg) + "&text=" + encodeURIComponent(orderMsg);
    }

    $("#stage-confirm").hidden = true;
    $("#stage-done").hidden = false;
    try { window.scrollTo({ top: 0, behavior: "smooth" }); } catch (e) {}
  });

  $("#btn-copy-order").addEventListener("click", function () {
    KP.copyText(orderMsg).then(function (ok) {
      KP.toast(ok ? "Mesej pesanan disalin — tampal kepada penjual" : "Gagal menyalin", ok ? "ok" : "err");
    });
  });

  renderAmount();
})();
