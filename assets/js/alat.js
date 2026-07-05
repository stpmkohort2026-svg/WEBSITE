/* Alat Pelajar STPM 2026 — Kalkulator PNGK & Penjana Jadual Belajar */
(() => {
  "use strict";

  /* ============ KALKULATOR PNGK (Skala rasmi MPM) ============ */
  const GRED = [
    ["A", 4.0], ["A-", 3.67], ["B+", 3.33], ["B", 3.0], ["B-", 2.67],
    ["C+", 2.33], ["C", 2.0], ["C-", 1.67], ["D+", 1.33], ["D", 1.0], ["F", 0.0],
  ];

  const rowsEl = document.getElementById("gpa-rows");
  const addBtn = document.getElementById("gpa-add");
  const calcBtn = document.getElementById("gpa-calc");
  const resetBtn = document.getElementById("gpa-reset");
  const resultEl = document.getElementById("gpa-result");

  const SUBJEK_LAZIM = [
    "Pengajian Am", "Bahasa Melayu", "Sejarah", "Geografi", "Ekonomi",
    "Pengajian Perniagaan", "Perakaunan", "Mathematics (T)", "Mathematics (M)",
    "Physics", "Chemistry", "Biology", "Sains Sukan", "Seni Visual",
    "Usuluddin", "Syariah", "Literature in English", "ICT",
  ];

  function makeRow(namaLalai = "") {
    const row = document.createElement("div");
    row.className = "field-row";

    const nama = document.createElement("input");
    nama.className = "field";
    nama.type = "text";
    nama.placeholder = "Nama subjek (cth: Pengajian Am)";
    nama.value = namaLalai;
    nama.setAttribute("list", "senarai-subjek");

    const gred = document.createElement("select");
    gred.className = "field";
    const opt0 = document.createElement("option");
    opt0.value = "";
    opt0.textContent = "Pilih gred";
    gred.appendChild(opt0);
    GRED.forEach(([g, p]) => {
      const o = document.createElement("option");
      o.value = p;
      o.textContent = `${g}  —  ${p.toFixed(2)}`;
      gred.appendChild(o);
    });

    const del = document.createElement("button");
    del.className = "row-del";
    del.type = "button";
    del.setAttribute("aria-label", "Buang subjek");
    del.textContent = "✕";
    del.addEventListener("click", () => {
      if (rowsEl.children.length > 1) row.remove();
    });

    row.append(nama, gred, del);
    return row;
  }

  if (rowsEl) {
    const dl = document.createElement("datalist");
    dl.id = "senarai-subjek";
    SUBJEK_LAZIM.forEach((s) => {
      const o = document.createElement("option");
      o.value = s;
      dl.appendChild(o);
    });
    document.body.appendChild(dl);

    ["Pengajian Am", "", "", ""].forEach((n) => rowsEl.appendChild(makeRow(n)));

    addBtn.addEventListener("click", () => rowsEl.appendChild(makeRow()));

    resetBtn.addEventListener("click", () => {
      rowsEl.innerHTML = "";
      ["Pengajian Am", "", "", ""].forEach((n) => rowsEl.appendChild(makeRow(n)));
      resultEl.classList.remove("show");
    });

    calcBtn.addEventListener("click", () => {
      const points = [...rowsEl.querySelectorAll("select")]
        .map((s) => s.value)
        .filter((v) => v !== "")
        .map(Number);

      if (!points.length) {
        resultEl.innerHTML = `<div class="verdict">Sila pilih gred untuk sekurang-kurangnya satu subjek.</div>`;
        resultEl.classList.add("show");
        return;
      }

      const pngk = points.reduce((a, b) => a + b, 0) / points.length;
      let verdict;
      if (pngk >= 3.8) verdict = "Cemerlang tertinggi — kekalkan momentum, anda calon universiti penyelidikan!";
      else if (pngk >= 3.5) verdict = "Cemerlang — dalam laluan kursus kompetitif. Teruskan!";
      else if (pngk >= 3.0) verdict = "Kepujian — masih banyak ruang untuk naik, fokus pada subjek paling lemah.";
      else if (pngk >= 2.0) verdict = "Lulus penuh — susun strategi ulangkaji, sasarkan peningkatan setiap penggal.";
      else verdict = "Perlukan perhatian segera — jumpa guru subjek & manfaatkan nota dalam channel Telegram kita.";

      resultEl.innerHTML = `
        <div class="grade-label">Purata Nilai Gred Keseluruhan</div>
        <div class="big gold-text">${pngk.toFixed(2)}</div>
        <div class="verdict">${points.length} subjek dikira · ${verdict}</div>`;
      resultEl.classList.add("show");
      resultEl.scrollIntoView({ behavior: "smooth", block: "nearest" });
    });
  }

  /* ============ PENJANA JADUAL BELAJAR ============ */
  const sjBtn = document.getElementById("sj-jana");
  const sjResult = document.getElementById("sj-result");

  const SLOT_TIP = [
    "Teknik Pomodoro: 25 minit fokus + 5 minit rehat",
    "Ulangkaji aktif — tutup nota, tulis semula dari ingatan",
    "Buat past-year paper dalam keadaan masa sebenar",
    "Ajar semula topik kepada rakan (teknik Feynman)",
    "Buat peta minda ringkasan bab",
    "Semak skema pemarkahan & format jawapan MPM",
  ];

  if (sjBtn) {
    sjBtn.addEventListener("click", () => {
      const subjeksRaw = document.getElementById("sj-subjek").value.trim();
      const jam = Math.min(12, Math.max(1, Number(document.getElementById("sj-jam").value) || 3));
      const mula = document.getElementById("sj-mula").value || "20:00";

      const subjek = subjeksRaw
        ? subjeksRaw.split(/[,;\n]+/).map((s) => s.trim()).filter(Boolean)
        : ["Pengajian Am", "Subjek 2", "Subjek 3"];

      const [h0, m0] = mula.split(":").map(Number);
      let t = h0 * 60 + m0;
      const fmt = (mins) => {
        const h = Math.floor(mins / 60) % 24;
        const m = mins % 60;
        return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
      };

      const blok = 50;
      const rehat = 10;
      const totalBlok = Math.round((jam * 60) / (blok + rehat));
      let rows = "";
      for (let i = 0; i < totalBlok; i++) {
        const s = subjek[i % subjek.length];
        const tip = SLOT_TIP[i % SLOT_TIP.length];
        rows += `<tr><td>${fmt(t)} – ${fmt(t + blok)}</td><td>${s}</td><td>${tip}</td></tr>`;
        t += blok;
        if (i < totalBlok - 1) {
          rows += `<tr><td>${fmt(t)} – ${fmt(t + rehat)}</td><td style="color:var(--muted)">☕ Rehat</td><td style="color:var(--muted)">Regangan, air, jauhi telefon</td></tr>`;
          t += rehat;
        }
      }

      sjResult.innerHTML = `
        <div class="grade-label">Jadual Ulangkaji Peribadi Anda</div>
        <div class="table-scroll"><table class="sched-table">
          <thead><tr><th>Masa</th><th>Subjek</th><th>Kaedah Disyorkan</th></tr></thead>
          <tbody>${rows}</tbody>
        </table></div>
        <div class="verdict" style="margin-top:1.1rem">${subjek.length} subjek · ${jam} jam · blok fokus 50 minit + rehat 10 minit. Konsisten setiap hari lebih baik daripada belajar 10 jam sekali sekala.</div>`;
      sjResult.classList.add("show");
      sjResult.scrollIntoView({ behavior: "smooth", block: "nearest" });
    });
  }
})();
