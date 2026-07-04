# ✦ STPM 2026 Kohort Baharu — Portal Rasmi

Website rasmi komuniti Telegram **[@stpm20266](https://t.me/stpm20266)** — direka dengan tema premium "Royal Academic" (biru gelap + emas champagne).

## Halaman

| Fail | Kandungan |
| --- | --- |
| `index.html` | Halaman utama — hero dengan lambang rasmi, kiraan detik ke Peperiksaan Semester 3 (17 Nov 2026), kalendar peperiksaan MPM, sumber pembelajaran, liputan subjek, CTA Telegram & soalan lazim |
| `alat-pelajar.html` | Alat Pelajar — Kalkulator PNGK (skala gred rasmi MPM) & Penjana Jadual Belajar |

## Struktur

```
assets/
  css/style.css   — sistem reka bentuk penuh (responsif, animasi reveal, menu mobile)
  js/main.js      — countdown, ribbon dinamik, animasi, navigasi
  js/alat.js      — logik Kalkulator PNGK & Penjana Jadual Belajar
  img/logo.svg    — lambang rasmi (SVG, boleh skala tanpa had)
```

## Deploy

Laman ini statik sepenuhnya — tiada build step. Boleh terus deploy ke **Cloudflare Pages** (atau GitHub Pages / Netlify):

1. Cloudflare Pages → *Create project* → sambungkan repo ini
2. Build command: *(kosongkan)* · Output directory: `/`
3. Siap!

## Nota penyelenggaraan

- **Tarikh countdown** — tukar dalam `assets/js/main.js` (pemboleh ubah `target`).
- **Ribbon pengumuman** — teks lalai dalam `index.html` (kelas `.ribbon`); ia bertukar secara automatik selepas 5 Julai 2026 (logik dalam `main.js`).
- **Kalendar** — kemas kini bahagian `#kalendar` dalam `index.html` apabila MPM mengeluarkan jadual baharu.
