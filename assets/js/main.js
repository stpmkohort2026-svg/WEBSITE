/* STPM 2026 Portal Rasmi — interaksi utama */
(() => {
  "use strict";

  document.documentElement.classList.add("js");

  const reduceMotion = matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* Tirai pembuka sinematik */
  const intro = document.getElementById("intro");
  if (intro) {
    const hide = () => intro.classList.add("gone");
    window.addEventListener("load", () => setTimeout(hide, 650));
    setTimeout(hide, 2600); // jaring keselamatan jika 'load' lambat
  }

  /* Bar kemajuan skrol */
  const prog = document.querySelector(".progress");
  if (prog) {
    const upd = () => {
      const max = document.documentElement.scrollHeight - window.innerHeight;
      prog.style.transform = `scaleX(${max > 0 ? Math.min(1, window.scrollY / max) : 0})`;
    };
    window.addEventListener("scroll", upd, { passive: true });
    window.addEventListener("resize", upd, { passive: true });
    upd();
  }

  /* Pastikan video header bermain (sesetengah pelayar perlukan panggilan eksplisit) */
  const heroVid = document.querySelector(".hero-video video");
  if (heroVid && !reduceMotion) heroVid.play().catch(() => {});

  /* Habuk platinum terapung di hero (canvas) */
  const dust = document.getElementById("fx-dust");
  if (dust && !reduceMotion) {
    const ctx = dust.getContext("2d");
    let w = 0, h = 0;
    const resize = () => {
      const dpr = Math.min(2, window.devicePixelRatio || 1);
      w = dust.clientWidth;
      h = dust.clientHeight;
      dust.width = w * dpr;
      dust.height = h * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };
    resize();
    window.addEventListener("resize", resize, { passive: true });

    const P = Array.from({ length: 70 }, () => ({
      x: Math.random(),
      y: Math.random(),
      z: 0.3 + Math.random() * 0.7,        // kedalaman (parallax + saiz)
      r: 0.6 + Math.random() * 1.7,
      s: 0.12 + Math.random() * 0.5,       // kelajuan naik
      tw: Math.random() * Math.PI * 2,      // fasa kelipan
      lite: Math.random() < 0.65,
    }));

    let mx = 0, my = 0;
    window.addEventListener("pointermove", (e) => {
      mx = e.clientX / window.innerWidth - 0.5;
      my = e.clientY / window.innerHeight - 0.5;
    }, { passive: true });

    let t = 0;
    (function loop() {
      t += 0.016;
      ctx.clearRect(0, 0, w, h);
      for (const p of P) {
        p.y -= p.s * 0.0011;
        if (p.y < -0.02) { p.y = 1.02; p.x = Math.random(); }
        const a = (0.22 + 0.3 * Math.sin(t * 1.4 + p.tw)) * p.z;
        if (a <= 0.02) continue;
        ctx.beginPath();
        ctx.fillStyle = p.lite ? `rgba(233,227,248,${a})` : `rgba(179,158,228,${a})`;
        ctx.arc((p.x + mx * 0.035 * p.z) * w, (p.y + my * 0.035 * p.z) * h, p.r * p.z, 0, 7);
        ctx.fill();
      }
      requestAnimationFrame(loop);
    })();
  }

  /* Ribbon dinamik — bertukar selepas kertas terakhir Semester 2 (5 Julai 2026) */
  const ribbon = document.querySelector(".ribbon");
  if (ribbon && Date.now() > new Date("2026-07-05T23:59:59+08:00").getTime()) {
    ribbon.innerHTML = '✦ Semester 2 selesai — fokus seterusnya: Peperiksaan Semester 3 bermula 17 November 2026 · <a href="https://t.me/stpm20266" target="_blank" rel="noopener">Ikuti channel kita</a> ✦';
  }

  /* Sticky nav shadow */
  const nav = document.querySelector("header.nav");
  const onScroll = () => nav && nav.classList.toggle("scrolled", window.scrollY > 12);
  window.addEventListener("scroll", onScroll, { passive: true });
  onScroll();

  /* Mobile menu */
  const burger = document.querySelector(".burger");
  const links = document.querySelector("nav.links");
  if (burger && links) {
    burger.addEventListener("click", () => {
      const open = links.classList.toggle("open");
      burger.classList.toggle("open", open);
      burger.setAttribute("aria-expanded", String(open));
    });
    links.querySelectorAll("a").forEach((a) =>
      a.addEventListener("click", () => {
        links.classList.remove("open");
        burger.classList.remove("open");
      })
    );
  }

  /* Reveal on scroll */
  const revealEls = [...document.querySelectorAll(".reveal")];
  const io = new IntersectionObserver(
    (entries) => {
      entries.forEach((e) => {
        if (e.isIntersecting) {
          e.target.classList.add("in");
          io.unobserve(e.target);
        }
      });
    },
    { threshold: 0, rootMargin: "0px 0px -5% 0px" }
  );
  revealEls.forEach((el) => io.observe(el));

  /* Jaring keselamatan: skrol pantas (flick) boleh melepasi observer,
     jadi dedahkan apa sahaja yang sudah berada pada atau di atas viewport */
  let sweepQueued = false;
  const sweep = () => {
    sweepQueued = false;
    revealEls.forEach((el) => {
      if (!el.classList.contains("in") && el.getBoundingClientRect().top < window.innerHeight) {
        el.classList.add("in");
        io.unobserve(el);
      }
    });
  };
  window.addEventListener(
    "scroll",
    () => {
      if (!sweepQueued) {
        sweepQueued = true;
        setTimeout(sweep, 150);
      }
    },
    { passive: true }
  );

  /* Card cursor glow + 3D tilt */
  document.querySelectorAll(".card").forEach((card) => {
    card.addEventListener("pointermove", (e) => {
      const r = card.getBoundingClientRect();
      const px = (e.clientX - r.left) / r.width;
      const py = (e.clientY - r.top) / r.height;
      card.style.setProperty("--mx", `${px * 100}%`);
      card.style.setProperty("--my", `${py * 100}%`);
      if (!reduceMotion) {
        card.style.setProperty("--ry", `${((px - 0.5) * 6).toFixed(2)}deg`);
        card.style.setProperty("--rx", `${((0.5 - py) * 6).toFixed(2)}deg`);
      }
    });
    card.addEventListener("pointerleave", () => {
      card.style.setProperty("--rx", "0deg");
      card.style.setProperty("--ry", "0deg");
    });
  });

  /* Countdown — Peperiksaan Bertulis Semester 3 STPM 2026 */
  const target = new Date("2026-11-17T08:00:00+08:00").getTime();
  const cells = {
    d: document.getElementById("cd-days"),
    h: document.getElementById("cd-hours"),
    m: document.getElementById("cd-mins"),
    s: document.getElementById("cd-secs"),
  };
  if (cells.d) {
    const pad = (n) => String(n).padStart(2, "0");
    const set = (cell, val) => {
      if (cell.textContent !== val) {
        cell.textContent = val;
        const box = cell.closest(".count-cell");
        if (box && !reduceMotion) {
          box.classList.remove("tick");
          void box.offsetWidth; // mulakan semula animasi
          box.classList.add("tick");
        }
      }
    };
    const tick = () => {
      let diff = Math.max(0, target - Date.now());
      set(cells.d, pad(Math.floor(diff / 864e5)));
      set(cells.h, pad(Math.floor(diff / 36e5) % 24));
      set(cells.m, pad(Math.floor(diff / 6e4) % 60));
      set(cells.s, pad(Math.floor(diff / 1e3) % 60));
      if (diff === 0) {
        const note = document.getElementById("cd-note");
        if (note) note.innerHTML = "<b>Peperiksaan Semester 3 sedang berlangsung — semoga berjaya, kohort 2026!</b>";
      }
    };
    tick();
    setInterval(tick, 1000);
  }

  /* Tahun footer */
  const yr = document.getElementById("year");
  if (yr) yr.textContent = new Date().getFullYear();
})();
