# PRD-02 — Frontend
**Proyek:** POS Kasir untuk Hasuka Dimsum | **Status:** v1.1 — selaras dengan rebuild PRD-01
**Induk:** 00-PRD-Overview.md | **Terkait:** 01-PRD-Design-Figma.md, 04-PRD-Offline-Sync.md, 07-PRD-QR-Menu-Digital-Receipt.md

---

> JANGAN AI SLOP. Implementasi UI harus mengikuti design token dari Figma (PRD-01) apa adanya — bukan "reinterpretasi" jadi tampilan default component library. Kalau ada gap antara desain dan komponen yang tersedia, tanya/catat, jangan diam-diam ganti ke default.
> Skill: baca skill `frontend-design` sebelum menulis kode UI apapun. Ini bukan sekali baca di awal proyek — cek ulang tiap kali membangun komponen baru.
> Catatan: `01-PRD-Design-Figma.md` baru saja di-rebuild (tablet & HP jadi prioritas, semua halaman termasuk Owner Dashboard/Stok Opname/Petty Cash/Pengaturan Pajak/Manajemen Promo sudah include dari awal). Dokumen ini jadi acuan implementasi 1:1 ke desain tersebut.

---

## 1. Tujuan

Membangun aplikasi kasir yang berjalan penuh secara offline di terminal (tablet dan HP), responsive di semua form factor yang relevan, dengan UI 1:1 sesuai desain Figma, cepat dipakai kasir, dan bisa mengakses hardware toko (printer, laci kas, barcode scanner).

## 2. Web atau Aplikasi? — Dua Form Factor, Satu Codebase

Ini pertanyaan yang sering muncul, jadi ditegaskan di sini: bukan pilih salah satu.

| Bagian | Bentuk | Kenapa |
|---|---|---|
| Terminal kasir (client sudah konfirmasi: tablet & HP, bukan desktop) | Aplikasi ter-install (Tauri v2, target mobile Android/iOS — desktop tetap didukung untuk back-office) | Butuh akses hardware (printer/laci kas) + wajib 100% jalan tanpa internet — dua hal yang tidak dipenuhi web biasa, apalagi kalau device campuran termasuk iPad (Safari tidak dukung Web Bluetooth/WebUSB untuk PWA) |
| Owner Dashboard (dibuka dari HP atau desktop owner) | Web biasa, buka lewat browser | Online-only by design, diakses dari device siapapun tanpa perlu install |
| QR Menu (dibuka dari HP pelanggan) | Web biasa, buka lewat browser | Pelanggan tidak mungkin disuruh install app cuma buat lihat menu — lihat PRD-07 |

Ketiganya dibangun dari codebase React + TypeScript yang sama, cuma beda target build & routing.

## 3. Keputusan Tech Stack

| Komponen | Pilihan | Alasan |
|---|---|---|
| Bahasa | TypeScript | Konsisten dengan backend (PRD-03), aman untuk logic uang/stok |
| Framework UI | React + Vite | Ekosistem besar, kompatibel dengan Tauri sekaligus web build |
| Styling | Tailwind CSS + design tokens dari Figma | Cepat dan tetap bisa 100% custom |
| App shell | Tauri v2 (satu codebase — desktop Windows/Mac/Linux dan mobile Android/iOS) — fallback Electron (desktop-only) | Tauri v2 (stabil sejak Okt 2024) resmi dukung build mobile, bukan cuma desktop — cocok karena device kasir yang dikonfirmasi client (tablet & HP) butuh akses hardware native, bukan cuma browser. Bundle jauh lebih kecil & hemat RAM dibanding Electron |
| Local database (offline) | SQLite via Tauri SQL plugin (atau `better-sqlite3` jika pakai Electron) | Source of truth lokal — lihat PRD-04 |
| State management | Zustand (ringan) atau Redux Toolkit jika kompleksitas naik | Sesuaikan dengan ukuran tim |
| Web-only build (Owner Dashboard, QR Menu) | React yang sama, dibuild sebagai web app biasa, tanpa Tauri | Tidak butuh local DB/offline — langsung panggil API backend |

Kenapa Tauri, bukan PWA murni atau Electron: device kasir sudah dikonfirmasi tablet & HP, tapi OS spesifik (Android/iOS) dan merek printer masih belum pasti. PWA murni punya risiko nyata di sini: akses hardware (Web Bluetooth/WebUSB) cuma jalan di Chrome/Edge, sama sekali tidak di Safari/iOS — jadi kalau device kasirnya iPhone/iPad, PWA gagal total untuk fitur printer. Tauri v2 tidak punya masalah ini karena aksesnya native, konsisten di semua platform yang didukungnya. Dibanding Electron, Tauri tetap unggul soal ukuran bundle & RAM, plus Electron tidak punya jalur ke mobile sama sekali.

## 4. Responsive Implementation

Mengikuti breakpoint dari PRD-01 bagian 3 — tablet dan HP jadi prioritas utama, desktop untuk back-office:

```
Tablet (768-1024px, landscape) : prioritas utama kasir — layout split panel
HP (< 480px)                   : prioritas utama kasir — layout stacked, cart jadi bottom sheet
Tablet portrait/HP besar (480-767px) : perlakuan sama seperti HP
Desktop (>= 1280px)            : sekunder — back-office, Owner Dashboard, laporan, pengaturan
```

- Pakai Tailwind responsive utility yang di-mapping ke breakpoint di atas, bukan default Tailwind breakpoint tanpa dipikir ulang.
- Testing wajib di breakpoint tablet dan HP dulu (form factor utama kasir) sebelum poles tampilan desktop.
- Komponen yang perilakunya beda signifikan antar breakpoint (cart panel dan bottom sheet) dibuat sebagai satu komponen dengan logic adaptif berdasarkan breakpoint, bukan dua komponen terpisah yang gampang divergen kontennya.
- Halaman QR Menu dan Owner Dashboard (lihat bagian 7) dibangun terpisah dari shell aplikasi kasir.

## 5. Arsitektur Aplikasi (terminal kasir)

```
UI Layer (React components)
  - mengikuti design tokens dari Figma
  - responsive per bagian 4
State layer (Zustand/Redux)
Data access layer (abstraksi)
  - selalu baca/tulis ke LOCAL DB dulu
Local SQLite DB (source of truth harian)
Sync Service (background worker)
  - detect online/offline
  - push outbox queue, pull update produk
Hardware Service Layer
  - printer (ESC/POS), cash drawer, barcode scanner
```

Aturan tegas: UI tidak pernah menunggu network call untuk operasi transaksi kasir. Detail pola sync ada di PRD-04 — jangan implementasi sync dari nol tanpa baca dokumen itu dulu.

## 6. Komponen Utama (mengacu ke PRD-01 bagian 5)

Lihat detail desain tiap komponen di PRD-01. Ringkas:
- `StatusBar` — indikator online/offline, selalu terlihat
- `ProductGrid`, `CartPanel` (adaptif — bottom sheet di HP, side panel di tablet), dengan breakdown subtotal/promo/diskon/pajak/total
- `NumericKeypad`
- `PaymentMethodSheet` — sub-state Tunai, QRIS Dinamis (dengan timer), QRIS Statis (tanpa timer, tombol konfirmasi manual), Kartu, Split
- `ReceiptPreview` — 3 opsi kirim: cetak/WA/email (lihat PRD-07)
- `ShiftPanel` — buka/tutup shift, termasuk ringkasan petty cash
- `PromoManager` — list dan form promo
- `StockOpnameGrid` — daftar produk dengan input hitung fisik
- `PettyCashForm` — input pengeluaran kas kecil
- `TaxSettingsForm` — toggle dan rate PPN
- `OfflineBanner` (global)

## 7. Web-only Views (Owner Dashboard & QR Menu)

- Owner Dashboard (landing page saat owner buka web dari device manapun): kombinasi beberapa card ringkasan (penjualan hari ini/minggu/bulan + komparasi periode sebelumnya, alert stok menipis, ringkasan shift terakhir, produk terlaris, performa promo aktif) + shortcut ke Laporan Penjualan detail, Manajemen Produk, dan Pengaturan. Dibungkus routing web terpisah, panggil API backend langsung (tanpa local DB, karena selalu online) — lihat endpoint agregat di PRD-03 bagian 6.
- QR Menu: aplikasi React terpisah/route terpisah, mobile-first sesuai PRD-01 bagian 5.15, public (tanpa login), fetch data menu dari endpoint publik backend (lihat PRD-03 bagian 6, PRD-07).

## 8. Integrasi Hardware

Catatan: printer yang akan dipakai client belum diketahui mereknya. Cek dulu apakah printer itu punya konektivitas LAN/WiFi — kalau ada, itu jalur paling aman karena brand-agnostic (jalan sama di Tauri apapun mereknya). Kalau printer ternyata USB-only, akses USB dari Tauri mobile lebih baru/kurang matang dibanding di desktop — wajib dites langsung dengan device & printer fisik sebelum commit ke alur ini.

| Hardware | Metode koneksi rekomendasi | Rekomendasi model & harga (referensi) |
|---|---|---|
| Thermal printer (struk) | Jaringan (WiFi/LAN, port 9100, protokol ESC/POS) sebagai default — tidak butuh driver native, jalan sama di Tauri di desktop maupun mobile, apapun mereknya | Epson TM-T82X/TM-T82III (LAN, sekitar Rp2,2-2,5jt) untuk merek mapan; alternatif kompatibel ESC/POS lebih murah (mis. Codeshop CB-T80, sekitar Rp600rb-1jt). USB tetap didukung sebagai opsi kedua |
| Cash drawer | Terhubung ke printer (drawer kick lewat pulsa ESC/POS dari printer), bukan langsung ke device | — |
| Barcode scanner | USB HID atau Bluetooth (perilaku seperti keyboard) | Tidak butuh driver khusus, langsung capture sebagai keyboard input di field pencarian produk |

Protokol ESC/POS untuk cetak struk, buka laci kas, dan cetak QR di struk sudah terstandarisasi lintas bahasa — cari implementasi Rust yang sesuai (native untuk Tauri desktop maupun mobile), jangan reinvent protokol dari nol.

## 9. Non-Functional Requirements

- Waktu buka aplikasi ke siap transaksi: target di bawah 3 detik
- Checkout flow: maksimal 3 tap dari cart penuh sampai struk tercetak untuk pembayaran tunai
- Toleransi offline: aplikasi harus tetap 100% fungsional (transaksi, cetak struk, lihat laporan hari berjalan) tanpa internet sama sekali
- Responsive: semua halaman kasir teruji baik di tablet maupun HP (dua-duanya prioritas utama), tanpa elemen terpotong/overflow
- Accessibility dasar: kontras warna terukur, target sentuh minimum 44x44px

## 10. Testing

- Unit test untuk logic kalkulasi (total, diskon, pajak, kembalian)
- Test skenario offline: cabut koneksi di tengah transaksi, transaksi tetap selesai lokal, sambungkan lagi, verifikasi masuk antrian sync dan berhasil terkirim
- Test responsive di breakpoint tablet dan HP dulu (device fisik, bukan cuma resize browser), baru desktop
- Test hardware di device fisik (printer, scanner) sebelum go-live — emulator tidak cukup untuk lapisan ini

## 11. Catatan Revisi

Karena PRD-01 baru saja di-rebuild, PRD ini sudah diselaraskan mengikuti struktur halaman terbaru. Kalau ada perbedaan lanjutan antara file Figma final dan dokumen ini, PRD ini yang menyesuaikan ke Figma, bukan sebaliknya.
