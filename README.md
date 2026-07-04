# ✦ STPM 2026 Kohort Baharu — Portal Rasmi

Website rasmi komuniti Telegram **[@stpm20266](https://t.me/stpm20266)** — tema premium **"Royal Amethyst"** (ungu diraja + platinum) yang sepadan dengan video lambang rasmi, lengkap dengan header video sinematik dan VFX.

## Halaman

| Fail | Kandungan |
| --- | --- |
| `index.html` | Halaman utama — hero dengan lambang rasmi, kiraan detik ke Peperiksaan Semester 3 (17 Nov 2026), kalendar peperiksaan MPM, sumber pembelajaran, liputan subjek, CTA Telegram & soalan lazim |
| `alat-pelajar.html` | Alat Pelajar — Kalkulator PNGK (skala gred rasmi MPM) & Penjana Jadual Belajar |

## Struktur

```
assets/
  css/style.css        — sistem reka bentuk penuh + VFX (responsif, animasi reveal, menu mobile)
  js/main.js           — countdown, ribbon dinamik, VFX (habuk platinum, tilt 3D, progress bar), navigasi
  js/alat.js           — logik Kalkulator PNGK & Penjana Jadual Belajar
  img/logo.svg         — lambang statik (nav/footer/favicon)
  img/poster.jpg       — poster video (paparan serta-merta & fallback)
  video/logo-intro.mp4 — video lambang rasmi (header sinematik, autoplay senyap & berulang)
```

## VFX yang disertakan

- Header video sinematik dengan vignet + fade filem ke latar halaman
- Tirai pembuka (intro overlay) dengan jenama
- Headline muncul perkataan demi perkataan
- Habuk platinum terapung (canvas, parallax mengikut kursor)
- Sempadan cahaya berputar pada kad countdown + denyut nombor setiap saat
- Kad 3D tilt mengikut kursor dengan cahaya sorot
- Kilauan menyapu butang utama & bar kemajuan skrol
- Semua animasi dimatikan secara automatik untuk `prefers-reduced-motion`

## Deploy

Laman ini statik sepenuhnya — tiada build step. Boleh terus deploy ke **Cloudflare Pages** (atau GitHub Pages / Netlify):

1. Cloudflare Pages → *Create project* → sambungkan repo ini
2. Build command: *(kosongkan)* · Output directory: `/`
3. Siap!

## Nota penyelenggaraan

- **Tarikh countdown** — tukar dalam `assets/js/main.js` (pemboleh ubah `target`).
- **Ribbon pengumuman** — teks lalai dalam `index.html` (kelas `.ribbon`); ia bertukar secara automatik selepas 5 Julai 2026 (logik dalam `main.js`).
- **Kalendar** — kemas kini bahagian `#kalendar` dalam `index.html` apabila MPM mengeluarkan jadual baharu.
