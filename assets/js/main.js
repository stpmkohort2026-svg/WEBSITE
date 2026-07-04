/* STPM 2026 Portal Rasmi — interaksi utama */
(() => {
  "use strict";

  document.documentElement.classList.add("js");

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

  /* Card cursor glow */
  document.querySelectorAll(".card").forEach((card) => {
    card.addEventListener("pointermove", (e) => {
      const r = card.getBoundingClientRect();
      card.style.setProperty("--mx", `${((e.clientX - r.left) / r.width) * 100}%`);
      card.style.setProperty("--my", `${((e.clientY - r.top) / r.height) * 100}%`);
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
    const tick = () => {
      let diff = Math.max(0, target - Date.now());
      const d = Math.floor(diff / 864e5);
      const h = Math.floor(diff / 36e5) % 24;
      const m = Math.floor(diff / 6e4) % 60;
      const s = Math.floor(diff / 1e3) % 60;
      cells.d.textContent = pad(d);
      cells.h.textContent = pad(h);
      cells.m.textContent = pad(m);
      cells.s.textContent = pad(s);
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
