# ✦ STPM 2026 Kohort Baharu — Portal Rasmi

Website rasmi komuniti Telegram **[@stpm20266](https://t.me/stpm20266)** — tema premium **"Royal Amethyst"** (ungu diraja + platinum) yang sepadan dengan video lambang rasmi, lengkap dengan header video sinematik dan VFX.

## Halaman

| Fail | Kandungan |
| --- | --- |
| `index.html` | Halaman utama — hero dengan lambang rasmi, kiraan detik ke Peperiksaan Semester 3 (17 Nov 2026), kalendar peperiksaan MPM, sumber pembelajaran, liputan subjek, CTA Telegram & soalan lazim |
| `alat-pelajar.html` | Alat Pelajar — Kalkulator PNGK (skala gred rasmi MPM) & Penjana Jadual Belajar |
| `pay/index.html` | **Kohort Pay** — landing gerbang transaksi online kohort (header video sinematik + bunyi) |
| `pay/dashboard.html` | Dashboard Penjual — payout (bank / TNG / DuitNow QR / gerbang FPX+kad), pautan jualan + QR, rekod transaksi, kunci PIN, sandaran |
| `pay/checkout.html` | Checkout Pembeli — DuitNow QR, FPX/kad, TNG & pindahan bank; identiti penjual dilindungi; kod pesanan via WhatsApp/Telegram |

## Struktur

```
assets/
  css/style.css        — sistem reka bentuk penuh + VFX (responsif, animasi reveal, menu mobile)
  css/pay.css          — lapisan reka bentuk Kohort Pay (dashboard, checkout, modal, toast)
  js/main.js           — countdown, ribbon dinamik, VFX (habuk platinum, tilt 3D, progress bar), navigasi
  js/alat.js           — logik Kalkulator PNGK & Penjana Jadual Belajar
  js/pay-core.js       — teras Kohort Pay: storan, pengekodan pautan (LZ-String), jana/baca QR
  js/pay-dashboard.js  — dashboard penjual (payout, pautan, transaksi, PIN, sandaran, carta)
  js/pay-checkout.js   — checkout pembeli (kaedah bayaran, QR, kod pesanan)
  js/vendor/           — lz-string, qrcode-generator, jsQR (tiada CDN — semuanya tempatan)
  img/logo.svg         — lambang statik (nav/footer/favicon)
  img/poster.jpg       — poster video utama
  img/pay-poster.jpg   — poster video Kohort Pay
  video/logo-intro.mp4 — video lambang rasmi (header sinematik, autoplay senyap & berulang)
  video/pay-intro.mp4  — video header Kohort Pay (dengan bunyi)
```

## Kohort Pay — cara ia berfungsi

Laman kekal 100% statik. **Dashboard penjual** menyimpan payout & produk dalam
`localStorage` (dikunci PIN). Apabila pautan jualan dikongsi, semua data yang
pembeli perlukan **dimampatkan ke dalam URL** (`checkout.html#K1.…`) — jadi
checkout berfungsi pada mana-mana peranti tanpa pelayan/pangkalan data.

- **Payout penjual:** akaun bank (20+ bank Malaysia), TNG eWallet, DuitNow QR
  sendiri (imej QR dibaca dengan jsQR & dijana semula), atau pautan gerbang
  FPX/kad (ToyyibPay, Billplz, dll).
- **Pembeli bayar:** DuitNow QR (imbas sahaja), FPX / kad melalui gerbang,
  TNG, atau pindahan bank — **tanpa nama penjual dipaparkan**.
- **Pengesahan:** pembeli hantar kod pesanan `KPORD1.…` melalui
  WhatsApp/Telegram; penjual import kod itu di dashboard dan sahkan
  selepas wang masuk.

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
