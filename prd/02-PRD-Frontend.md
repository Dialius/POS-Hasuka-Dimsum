# PRD-02 — Frontend
**Proyek:** POS Kasir | **Status:** Draft v0.4 — Figma (PRD-01) sudah final
**Induk:** 00-PRD-Overview.md | **Terkait:** 01-PRD-Design-Figma.md, 04-PRD-Offline-Sync.md, 07-PRD-QR-Menu-Digital-Receipt.md

---

> ⚠️ **JANGAN AI SLOP.** Implementasi UI harus mengikuti design token dari Figma (PRD-01) apa adanya — bukan "reinterpretasi" jadi tampilan default component library. Kalau ada gap antara desain dan komponen yang tersedia, tanya/catat, jangan diam-diam ganti ke default.
> **Skill:** baca `frontend-design` SKILL.md sebelum menulis kode UI apapun — termasuk untuk elemen UI baru yang belum ada di file Figma (lihat §6a), supaya tetap konsisten dengan design system yang sudah dibuat, bukan bikin gaya baru sendiri.
> **Catatan:** `01-PRD-Design-Figma.md` sudah final dan dibuat manual oleh client — dokumen ini sekarang jadi acuan implementasi 1:1 ke desain tersebut. Dua fitur di §6a (PPN & promo) ditambahkan setelah desain final, jadi elemen UI-nya belum tentu ada di file Figma — perlu ditambahkan manual ke sana dulu (pakai komponen/design system yang sudah ada) sebelum diimplementasi, bukan didesain ulang dari nol di kode.

---

## 1. Tujuan

Membangun aplikasi kasir yang **berjalan penuh secara offline** di terminal (tablet/desktop), **responsive** di semua form factor yang relevan, dengan UI 1:1 sesuai desain Figma final, cepat dipakai kasir, dan bisa mengakses hardware toko (printer, laci kas, barcode scanner).

## 2. Web atau Aplikasi? — Dua Form Factor, Satu Codebase

Ini pertanyaan yang sering muncul, jadi ditegaskan di sini: **bukan pilih salah satu.**

| Bagian | Bentuk | Kenapa |
|---|---|---|
| **Terminal kasir** (tablet/desktop, dipakai kasir jualan) | **Aplikasi ter-install** (Tauri) | Butuh akses hardware (printer/laci kas) + wajib 100% jalan tanpa internet — dua hal yang tidak dipenuhi web biasa |
| **Laporan untuk owner** (dibuka dari HP owner) | **Web biasa**, buka lewat browser | Online-only by design, diakses dari device siapapun tanpa perlu install |
| **QR Menu** (dibuka dari HP pelanggan) | **Web biasa**, buka lewat browser | Pelanggan tidak mungkin disuruh install app cuma buat lihat menu — lihat PRD-07 |

Ketiganya dibangun dari **codebase React + TypeScript yang sama**, cuma beda target build & routing. Ini konsisten dengan pola yang dipakai kompetitor (mis. Moka POS: aplikasi kasir + weborder berbasis web terpisah).

## 3. Keputusan Tech Stack

| Komponen | Pilihan | Alasan |
|---|---|---|
| Bahasa | **TypeScript** | Konsisten dengan backend (PRD-03), aman untuk logic uang/stok |
| Framework UI | **React** + Vite | Ekosistem besar, kompatibel dengan Tauri/Electron/PWA sekaligus |
| Styling | Tailwind CSS + design tokens dari Figma | Cepat dan tetap bisa 100% custom (bukan berarti pakai default Tailwind look) |
| App shell (desktop) | **Tauri** (utama) — fallback **Electron** | Tauri: bundle 20-50x lebih kecil, RAM jauh lebih hemat, permukaan keamanan lebih kecil dibanding Electron. Electron jadi fallback kalau butuh library hardware Node.js yang belum ada portingan Rust-nya |
| Local database (offline) | **SQLite** via Tauri SQL plugin (atau `better-sqlite3` jika pakai Electron) | Source of truth lokal — lihat PRD-04 |
| State management | Zustand (ringan) atau Redux Toolkit jika kompleksitas naik | Sesuaikan dengan ukuran tim |
| Web-only build (laporan HP, QR Menu) | React yang sama, dibuild sebagai web app biasa / PWA, tanpa Tauri | Tidak butuh local DB/offline — langsung panggil API backend |

**Kenapa Tauri jadi pilihan utama, bukan Electron:** untuk proyek baru, Tauri hampir selalu pilihan teknis lebih baik — bundle 20-50x lebih kecil dan jauh lebih hemat RAM dibanding Electron, dengan permukaan keamanan lebih kecil. Trade-off: logic native custom (kalau butuh) ditulis di Rust, bukan Node.js — tapi untuk kasus kita, hardware printer/cash drawer paling umum diakses via jaringan (LAN/WiFi), yang sama mudahnya dari Rust maupun Node. **Electron tetap valid** kalau tim menemukan kebutuhan library Node.js matang yang belum ada equivalent Tauri-nya.

## 4. Responsive Implementation

Mengikuti breakpoint dari PRD-01 §3:

```
Desktop   : ≥1280px  → grid produk + cart panel side-by-side (utama)
Tablet    : 768–1279px → sama seperti desktop, panel lebih ringkas (utama)
Tablet portrait/HP besar : 480–767px → cart jadi bottom sheet
HP        : <480px  → single column, floating action bar bawah
```

- Pakai Tailwind responsive utility (`sm:` `md:` `lg:` `xl:`) yang di-mapping ke breakpoint di atas, bukan default Tailwind breakpoint tanpa dipikir ulang.
- **Testing wajib di breakpoint tablet & desktop dulu** (form factor utama) sebelum poles tampilan HP — searah dengan urutan kerja desain di PRD-01.
- Komponen yang perilakunya beda signifikan antar breakpoint (cart panel ↔ bottom sheet) dibuat sebagai 1 komponen dengan logic adaptif berdasarkan breakpoint, bukan 2 komponen terpisah yang gampang divergen kontennya.
- Halaman **QR Menu** (§7 & PRD-07) di-build terpisah, mobile-first, tidak memakai layout shell yang sama dengan app kasir.

## 5. Arsitektur Aplikasi (terminal kasir)

```
┌─────────────────────────────────────────┐
│  UI Layer (React components)             │
│  - mengikuti design tokens dari Figma    │
│  - responsive per §4                     │
├─────────────────────────────────────────┤
│  State layer (Zustand/Redux)             │
├─────────────────────────────────────────┤
│  Data access layer (abstraksi)           │
│  - selalu baca/tulis ke LOCAL DB dulu    │
├─────────────────────────────────────────┤
│  Local SQLite DB (source of truth harian)│
├─────────────────────────────────────────┤
│  Sync Service (background worker)        │
│  - detect online/offline                 │
│  - push outbox queue, pull update produk │
├─────────────────────────────────────────┤
│  Hardware Service Layer                  │
│  - printer (ESC/POS), cash drawer,       │
│    barcode scanner                       │
└─────────────────────────────────────────┘
```

Aturan tegas: **UI tidak pernah menunggu network call untuk operasi transaksi kasir.** Detail pola sync ada di PRD-04 — jangan implementasi sync dari nol tanpa baca dokumen itu dulu.

## 6. Komponen Utama (mengacu ke PRD-01 §5)

Lihat detail desain tiap komponen di PRD-01. Ringkas: `<StatusBar />`, `<ProductGrid />`, `<CartPanel />` (adaptif → bottom sheet di HP), `<NumericKeypad />`, `<PaymentMethodSheet />`, `<ReceiptPreview />` (dengan 3 opsi kirim: cetak/WA/email — lihat PRD-07), `<ShiftPanel />`, `<OfflineBanner />` (global).

## 6a. Komponen Tambahan — PPN & Promo (belum ada di Figma final, lihat catatan di atas)

Dua fitur ini ditambahkan ke scope (PRD-00 §4) setelah desain Figma selesai — perlu elemen UI baru yang **ditambahkan manual ke file Figma yang sudah ada** sebelum development, pakai token/komponen dari design system yang sudah dibuat (PRD-01 §4), bukan gaya baru:

- **Pengaturan Pajak** (halaman baru di bawah menu Pengaturan, sejajar dengan Printer/User/Integrasi): toggle on/off PPN level outlet + input rate (%, default 11) + preview simulasi hitung ke satu contoh harga, supaya owner langsung lihat efeknya sebelum simpan.
- **Manajemen Promo** (halaman baru, pola sama seperti Manajemen Produk — list kiri + form edit kanan di tablet/desktop, halaman terpisah di HP): form berisi nama promo, cakupan (semua produk/kategori/produk tertentu — kalau kategori/produk, tambah picker multi-select), tipe diskon (persentase/nominal), nilai, tanggal mulai & selesai (opsional, kosong = aktif terus), toggle aktif/nonaktif.
- **Cart/Checkout** (`<CartPanel />`, sudah ada di Figma): tambahkan baris breakdown di ringkasan total — subtotal → potongan promo (kalau ada, tampilkan nama promonya) → diskon manual kasir (kalau ada) → pajak (kalau `tax_enabled`) → total. Item yang lagi dapat promo otomatis ditandai kecil di product card/cart line (mis. badge "Promo") supaya kasir & pelanggan tahu kenapa harganya beda dari label rak.

## 7. Web-only Views (Owner Dashboard & QR Menu)

- **Owner Dashboard** (landing page saat owner buka web dari HP/device manapun): kombinasi beberapa card ringkasan (penjualan hari ini/minggu/bulan + komparasi periode sebelumnya, alert stok menipis, ringkasan shift terakhir, produk terlaris, performa promo aktif) + shortcut ke Laporan Penjualan detail (reuse komponen laporan dari PRD-01 §5.7), Manajemen Produk, dan Pengaturan. Dibungkus routing web terpisah, panggil API backend langsung (tanpa local DB, karena selalu online) — lihat endpoint agregat di PRD-03 §6.
  - **Catatan Figma**: dashboard ini kebanyakan reuse komponen yang sudah ada di design system (card angka, grafik, tabel) — cukup disusun ulang jadi 1 halaman ringkasan di Figma, bukan bikin komponen visual baru dari nol seperti kasus PPN/Promo di §6a.
- **QR Menu**: aplikasi React terpisah/route terpisah, mobile-first sesuai PRD-01 §5.11, public (tanpa login), fetch data menu dari endpoint publik backend (lihat PRD-03 §6, PRD-07).

## 8. Integrasi Hardware

| Hardware | Metode koneksi rekomendasi | Rekomendasi model & harga (referensi) |
|---|---|---|
| Thermal printer (struk) | **Jaringan (WiFi/LAN, port 9100, protokol ESC/POS)** sebagai default — tidak butuh driver native, jalan sama di Tauri (Rust TCP) maupun Electron (Node `net`) | Epson TM-T82X/TM-T82III (LAN, ~Rp2,2–2,5jt) untuk yang mau merek mapan; alternatif kompatibel ESC/POS lebih murah (mis. Codeshop CB-T80, ~Rp600rb–1jt) untuk budget terbatas. USB tetap didukung sebagai opsi kedua |
| Cash drawer | Terhubung ke printer (drawer kick lewat pulsa ESC/POS dari printer), bukan langsung ke komputer | — |
| Barcode scanner | USB HID (perilaku seperti keyboard) | Tidak butuh driver khusus, langsung capture sebagai keyboard input di field pencarian produk |

Protokol ESC/POS untuk cetak struk, buka laci kas, dan cetak QR di struk sudah terstandarisasi lintas bahasa — cari implementasi yang cocok dengan runtime yang dipilih (Rust untuk Tauri, Node untuk Electron), jangan reinvent protokol dari nol.

## 9. Non-Functional Requirements

- **Waktu buka aplikasi** ke siap transaksi: target < 3 detik
- **Checkout flow**: maksimal 3 tap dari cart penuh sampai struk tercetak untuk pembayaran tunai
- **Toleransi offline**: aplikasi harus tetap 100% fungsional (transaksi, cetak struk, lihat laporan hari berjalan) tanpa internet sama sekali
- **Responsive**: semua halaman kasir teruji baik di tablet landscape (form factor utama) maupun HP, tanpa elemen terpotong/overflow
- Accessibility dasar: kontras warna terukur, target sentuh minimum 44×44px, keyboard focus terlihat untuk mode desktop dengan keyboard/scanner

## 10. Testing

- Unit test untuk logic kalkulasi (total, diskon, pajak, kembalian)
- Test skenario offline: cabut koneksi di tengah transaksi → transaksi tetap selesai lokal → sambungkan lagi → verifikasi masuk antrian sync dan berhasil terkirim
- Test responsive di breakpoint tablet, desktop, dan HP (device fisik, bukan cuma resize browser)
- Test hardware di device fisik (printer, scanner) sebelum go-live — emulator tidak cukup untuk lapisan ini

## 11. Catatan Revisi

Karena `01-PRD-Design-Figma.md` sudah final, §6 (komponen) sekarang seharusnya sudah 1:1 dengan file Figma — kalau nama/struktur di Figma ternyata beda dari yang tertulis di sini, **PRD ini yang menyesuaikan ke Figma**, bukan sebaliknya. Pengecualian: §6a (Pengaturan Pajak, Manajemen Promo) belum ada representasinya di Figma — tambahkan ke sana dulu sebelum development, lalu update §6a supaya sesuai hasilnya.
