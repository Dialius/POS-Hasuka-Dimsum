# PRD-00 — Overview & Product Vision
**Proyek:** POS Kasir untuk Hasuka Dimsum (outlet GOR Satria)
**Status:** v1.1 — konsolidasi setelah rebuild desain & UI
**Dokumen terkait:** 01-Design-Figma, 02-Frontend, 03-Backend, 04-Offline-Sync, 05-Payment-Gateway, 06-Deployment, 07-QR-Menu-Digital-Receipt

---

> INSTRUKSI WAJIB UNTUK SIAPAPUN/AI APAPUN YANG MENGERJAKAN PROYEK INI
> 1. JANGAN AI SLOP. Semua yang dihasilkan — desain, kode UI, copywriting — tidak boleh terasa seperti default template AI generic (gradient ungu-biru, card shadow seragam, font Inter/Arial polos, layout "SaaS card kit"). Lihat prinsip anti-slop di bagian 5 dan di setiap PRD turunan.
> 2. Gunakan skill yang relevan. Sebelum membuat file/kode/desain apapun, cek dan baca skill yang cocok di environment (mis. skill `frontend-design` untuk UI). Jangan mulai kerja tanpa membaca skill yang relevan lebih dulu.
> 3. Baca PRD ini dan PRD turunannya secara utuh sebelum mulai — jangan cuma baca judul bagian.
>
> Catatan versi: `01-PRD-Design-Figma.md` baru saja di-rebuild total (tablet & HP jadi prioritas, semua fitur baru sudah include dari awal) — kalau kamu pernah baca versi lama dokumen ini yang bilang "Figma sudah final jangan diubah", itu sudah tidak berlaku. Rujuk selalu versi terbaru tiap PRD.

---

## 1. Latar Belakang

Client (Hasuka Dimsum, outlet GOR Satria — bisnis F&B) butuh sistem POS Kasir baru. Alasan utama membangun sendiri (bukan pakai Moka/Majoo/Olsera/dsb) kemungkinan besar salah satu dari: kontrol penuh atas biaya langganan jangka panjang, kebutuhan kustomisasi workflow yang spesifik, atau keinginan punya aset software sendiri. (Asumsi — konfirmasi ke client, lihat bagian 11.)

Riset pasar (lihat bagian 7) menunjukkan provider POS Indonesia sudah sangat matang dari sisi fitur, tapi rata-rata desainnya generic/template-y dan mode offline sudah jadi standar minimum, bukan lagi nilai jual pembeda.

## 2. Tujuan Produk

- Membuat POS Kasir yang tetap bisa dipakai transaksi walau listrik/internet mati (offline-first, bukan "offline sebagai fallback").
- UX yang cepat dipakai kasir (minim klik, target sentuh besar, alur checkout singkat) dan desain yang punya karakter — bukan template generic.
- Tampilan responsive — device kasir yang dipakai di outlet sudah dikonfirmasi client: tablet & HP (form factor utama), desktop tetap didukung untuk kebutuhan back-office/laporan.
- Mendukung pembayaran tunai dan non-tunai (QRIS, e-wallet, kartu) dengan payment gateway lokal.
- Fitur lengkap selayaknya POS pada umumnya — lihat checklist di bagian 8.
- Arsitektur yang bisa tumbuh dari 1 outlet ke multi-outlet tanpa rombak ulang.

## 3. Target Pengguna / Persona

| Persona | Kebutuhan utama |
|---|---|
| Kasir | Checkout cepat, tombol besar, tidak perlu training lama, tetap bisa transaksi saat offline |
| Owner / Admin | Pantau kondisi toko lewat Owner Dashboard (termasuk dari HP), lihat laporan penjualan detail, kelola produk & harga, kontrol multi-outlet, tahu kondisi kas tiap shift |
| Manager/Supervisor shift | Buka-tutup shift, rekonsiliasi kas, approve void/refund/diskon di luar wewenang kasir |
| Pelanggan | Lihat menu digital lewat QR di meja/etalase tanpa perlu nunggu dilayani (lihat PRD-07) |

## 4. Ruang Lingkup

### In-scope (MVP)
- Transaksi kasir (cart, diskon manual per-item/nota oleh kasir, split payment sebagian, void item, retur/refund dengan approval)
- Manajemen produk & kategori, harga jual & harga modal, stok dasar + alert stok menipis
- Stok Opname: sesi hitung fisik stok dibandingkan ke stok sistem, selisih tercatat & bisa dikoreksi dengan audit log — detail di PRD-03 bagian 4
- Petty Cash: pencatatan pengeluaran kas kecil (di luar transaksi penjualan), otomatis masuk ke perhitungan Tutup Shift — detail di PRD-03 bagian 4
- Pengaturan PPN: on/off di level outlet + rate yang bisa diatur sendiri (default 11%, sesuai tarif berlaku untuk barang/jasa nonmewah) + toggle kena-pajak per produk — detail di PRD-03 bagian 4
- Promo/diskon per-produk yang bisa dikonfigurasi: persentase atau nominal, cakupan per produk/kategori/semua produk, dengan periode aktif opsional — diterapkan otomatis saat checkout, terpisah dari diskon manual kasir — detail di PRD-03 bagian 4
- Mode offline penuh untuk transaksi tunai + antrian sinkronisasi
- Pembayaran tunai + QRIS (mode Statis atau Dinamis, bisa dikonfigurasi per outlet — default Statis kalau belum punya akun Midtrans/Xendit) + kartu (via EDC, dicatat manual sebagai metode bayar) — detail di PRD-05
- Manajemen shift kasir (buka/tutup, rekonsiliasi kas — termasuk petty cash)
- Cetak struk fisik (thermal printer ESC/POS) + struk digital (kirim via WhatsApp/Email) — detail di PRD-07
- QR Menu read-only: pelanggan scan QR di meja/etalase untuk lihat menu digital tanpa perlu checkout — detail di PRD-07
- Owner Dashboard (web, bisa diakses dari HP): landing page ringkasan kondisi toko — penjualan + komparasi periode, alert stok menipis, ringkasan shift terakhir, produk terlaris & performa promo — detail di PRD-02 bagian 7 dan PRD-03 bagian 6
- Laporan penjualan harian/per-shift (detail, bukan cuma ringkasan), rekap cash vs QRIS + ekspor Excel/CSV (+ opsional sync Google Sheets, lihat bagian 6)
- Manajemen user & role (Kasir, Manager, Owner)
- Barcode: scan (checkout) + cetak label barcode produk sendiri
- Tampilan responsive: tablet & HP sebagai form factor utama (sesuai konfirmasi client), desktop didukung untuk back-office — detail breakpoint di PRD-01 bagian 3 dan PRD-02 bagian 4

### Out-of-scope MVP (fase berikutnya, atau menunggu konfirmasi)
- Multi-outlet dashboard terpusat lintas cabang
- Manajemen meja, split bill, dan Kitchen Display System (KDS) — bisnis sudah terkonfirmasi F&B (dimsum), tapi masih menunggu konfirmasi client: apakah model operasionalnya makan-di-tempat (butuh ini) atau lebih ke beli-bawa-pulang (tidak butuh). Lihat bagian 11.
- QR self-order penuh (pelanggan pesan sendiri dari QR, otomatis masuk ke kasir/dapur) — terkait erat dengan poin di atas. Versi read-only QR Menu tetap masuk MVP terlepas dari keputusan ini.
- Program loyalitas pelanggan / membership
- Integrasi marketplace/online delivery (GoFood, GrabFood, dsb)
- Purchase order ke supplier & manajemen resep/HPP

## 5. Prinsip Inti Proyek

1. Offline-first, bukan offline-fallback. Local database di terminal kasir adalah source of truth harian. Sinkron ke server pusat itu proses background, bukan syarat transaksi bisa jalan. Detail penuh di PRD-04.
2. Anti-AI-Slop. Desain harus punya keputusan sadar: palet warna bermakna, tipografi berkarakter, hierarki shadow yang jelas, spacing konsisten, kontras terukur. Detail di PRD-01 dan PRD-02.
3. Skill-driven. Setiap tahap kerja wajib merujuk skill yang relevan di environment sebelum eksekusi.
4. Satu bahasa, sedikit context-switching. Frontend & backend pakai TypeScript agar developer (atau AI agent) tidak bolak-balik ganti bahasa/paradigma.
5. Responsive dengan prioritas jelas. Client sudah konfirmasi device kasir di outlet: tablet & HP, bukan desktop — jadi dua form factor ini yang jadi prioritas desain & testing utama. Desktop tetap didukung, tapi untuk kebutuhan back-office/laporan, bukan kasir.

## 6. Keputusan Kunci & Q&A dengan Client

Q: Sistem ini web atau aplikasi?
A: Hybrid — dua form factor untuk dua kebutuhan berbeda dari satu codebase (React + TypeScript):
- Terminal kasir (tablet/HP) → aplikasi ter-install (Tauri v2, lihat PRD-02) karena butuh akses hardware (printer, laci kas) dan wajib 100% jalan offline — dua hal yang tidak bisa dipenuhi web biasa.
- Owner Dashboard/laporan dari HP owner, dan QR Menu untuk pelanggan → web biasa dibuka di browser, tanpa install, karena kedua kebutuhan ini online-only dan diakses dari device yang bukan terminal kasir.

Q: Butuh sync otomatis ke Google Spreadsheet?
A: Bukan sebagai database utama (Google Sheets tidak transaksional — rawan soal konkurensi, rate limit, dan integritas data uang). Ditambahkan sebagai integrasi opsional satu-arah: laporan penjualan bisa di-export/sync otomatis ke Google Sheets milik owner sendiri (owner connect akun Google-nya, lihat PRD-03 bagian 7). Fitur nice-to-have, tidak menghalangi rilis MVP.

Q: QRIS-nya pakai yang statis (tempel) atau dinamis?
A: Bisa dikonfigurasi per outlet (`qris_mode: static | dynamic`), bukan dipatok satu jalan — lihat PRD-05 bagian 1. Statis = tidak butuh akun Midtrans/Xendit, konfirmasi manual oleh kasir, tetap jalan penuh saat offline. Dinamis = otomatis (webhook), tapi butuh akun gateway + internet aktif saat transaksi. Rekomendasi default: Statis untuk mulai, upgrade ke Dinamis kapan saja lewat setting begitu client siap.

Q: Kenapa VPS, bukan hosting biasa (shared/cPanel)?
A: Stack backend (NestJS/Node.js + PostgreSQL + Redis, lihat PRD-03 bagian 2) butuh proses yang nyala terus (bukan model request-response PHP), install database & queue sendiri, dan Docker untuk deployment (PRD-06) — hal-hal yang hampir selalu tidak tersedia di shared hosting. Alternatif Laravel+MySQL bisa jalan di hosting biasa, tapi kehilangan Redis dan Docker/CI-CD. Selisih harga ke VPS yang layak juga sudah tipis (sekitar Rp150-235rb/bulan, lihat PRD-06 bagian 2).

Q: Bisa pindah ke ekosistem Google (AppSheet + Google Sheets + Apps Script) untuk hemat biaya & maintenance?
A: Tidak untuk bagian transaksional/kasir — ini nabrak requirement paling inti proyek (offline-first, PRD-04): AppSheet tidak bisa akses hardware printer ESC/POS sama sekali, Apps Script berjalan di server Google jadi tidak bisa dipanggil saat offline, dan Google Sheets bukan database transaksional. Bagian keinginan "simpel & murah ala Google" sudah terakomodasi lewat integrasi Google Sheets satu-arah untuk laporan (bagian 6 di atas).

## 7. Riset Kompetitor — Perbandingan Fitur per Paket

Data digabung dari riset publik (halaman harga/fitur resmi tiap provider & artikel pembanding pihak ketiga) plus referensi paket Majoo Advance yang diberikan client. Harga bisa berubah — cek ulang ke situs resmi sebelum dipakai sebagai acuan final.

| Provider | Tier & harga (perkiraan) | Fitur inti tiap naik tier |
|---|---|---|
| Majoo | Starter ~Rp249rb/bln, Advance ~Rp499rb/bln, Prime ~Rp999rb/bln | Starter: kasir online, inventory, CRM, laporan, karyawan, toko online. Advance: tambah multi-outlet (maks 3 terminal), manajemen meja & multisatuan, COGS average & produksi stok, deposit pelanggan, absensi foto, akuntansi lengkap, QRIS dinamis & EDC, struk digital, weborder & QR e-menu. Prime: tambah payroll, manajemen cabang lebih dalam, otomasi. |
| Olsera | Basic ~Rp1,29jt/thn, Premium ~Rp1,99jt/thn, Pro ~Rp2,69jt/thn | Basic: order dasar, manajemen produk, laporan penjualan. Premium: tambah order oleh waiter, manajemen meja, integrasi marketplace & e-wallet. Pro: tambah AntarInMakan, akuntansi built-in, dashboard franchise, self-order. |
| Pawoon | Free, Basic ~Rp149rb/bln, Pro ~Rp299rb/bln | Free: fitur dasar + bisa terima order dari aplikasi pesan-antar & e-commerce (unik, biasanya berbayar di provider lain). Pro: fitur lengkap + integrasi Jurnal/Accurate Online, multi-outlet/franchise. |
| Qasir | Free, Pro (~Rp699rb/thn), Pro Plus (~Rp1,2jt/thn) | Free: transaksi & produk dasar. Pro: laporan pajak, backup otomatis, integrasi GrabFood, struk digital. |
| Moka POS | Mulai ~Rp299rb/bln | Table management, QR order, CRM pelanggan — kuat di segmen resto/kafe. |
| iREAP POS | Free (1 device), Pro mulai ~Rp79rb/bln | Fokus kontrol stok multi-gudang, Android-only. |
| Kasir Pintar | Free, Pro | Struk digital WA/Email jadi salah satu pembeda versi Pro, ekspor Excel, support prioritas. |

Insight kunci dari riset ini:
- Mode offline + auto-sync sudah jadi fitur standar minimum di hampir semua provider — bukan lagi pembeda.
- Struk digital (WA/Email/SMS) dan QR e-menu/weborder konsisten muncul sebagai fitur "upgrade tier" — alasan bagus untuk kita sertakan dari MVP.
- Manajemen meja & multi-outlet konsisten jadi pembatas antar-tier.
- Pawoon unik karena fitur integrasi pesan-antar/e-commerce sudah ada di versi gratis — jangan asumsikan fitur tertentu "pasti mahal" hanya karena provider lain menaruhnya di tier atas.

## 8. Checklist Fitur POS Standar (memastikan tidak ada yang kelewat)

| Fitur | Status di scope kita |
|---|---|
| Kasir/checkout (cart, qty, void item) | MVP |
| Manajemen produk & kategori | MVP |
| Manajemen stok otomatis + alert stok menipis | MVP |
| Stok Opname (hitung fisik vs sistem) | MVP |
| Petty cash (pengeluaran kas kecil) | MVP |
| Barcode: scan + cetak label | MVP |
| Multi metode pembayaran (tunai/QRIS/kartu) | MVP — lihat PRD-05 |
| Diskon manual per-item/per-nota (oleh kasir) | MVP |
| Promo/diskon per-produk, rule-based & bisa dikonfigurasi | MVP |
| Pajak (PPN): on/off level outlet + rate configurable + per-produk | MVP |
| Cetak struk fisik + struk digital (WA/Email) | MVP — lihat PRD-07 |
| Manajemen shift & rekonsiliasi kas (termasuk petty cash) | MVP |
| Manajemen user & role | MVP |
| Void transaksi & retur/refund (dengan approval) | MVP |
| Laporan penjualan + rekap cash vs QRIS + ekspor Excel/CSV | MVP |
| Owner Dashboard (ringkasan, bisa diakses dari HP) | MVP |
| Sync Google Sheets | Nice-to-have, non-blocking |
| Mode offline penuh | MVP — lihat PRD-04 |
| QR Menu (read-only) | MVP — lihat PRD-07 |
| Tampilan responsive (tablet & HP utama, desktop untuk back-office) | MVP |
| Multi-outlet dashboard terpusat | Fase 2 |
| Manajemen meja, split bill & KDS | Menunggu konfirmasi client (dine-in vs bawa-pulang) |
| QR self-order penuh | Menunggu konfirmasi client (terkait poin di atas) |
| Loyalitas pelanggan/membership | Fase 2 |
| Integrasi marketplace/delivery | Fase 2 |
| Purchase order supplier | Fase 2 |

## 9. Ringkasan Tech Stack

| Layer | Pilihan utama | Alasan singkat |
|---|---|---|
| Frontend app (kasir) | React + TypeScript + Tauri v2 (target tablet/HP via mobile build, desktop untuk back-office; fallback Electron desktop-only) | Ringan, aman, satu kode untuk desktop & mobile; detail di PRD-02 |
| Frontend web (Owner Dashboard, QR Menu) | React + TypeScript, sama codebase, mode web murni | Online-only, tidak butuh install; detail di PRD-02 & PRD-07 |
| Local storage (offline) | SQLite (via Tauri SQL plugin) | Source of truth lokal, robust untuk transaksi |
| Backend | NestJS (Node.js/TypeScript) + PostgreSQL + Redis | Satu bahasa dengan frontend, ekosistem matang untuk payment gateway Indonesia |
| Payment gateway | Midtrans (utama) + Xendit (cadangan) — opsional, tergantung `qris_mode` | Lihat PRD-05 |
| Deployment | VPS 2 vCPU/4GB, region Jakarta/Singapore, Docker, GitHub Actions CI/CD | Lihat PRD-06 |

## 10. Daftar Dokumen PRD

1. `01-PRD-Design-Figma.md` — brief desain, design system, referensi, detail desain tiap halaman (rebuild, prioritas tablet & HP)
2. `02-PRD-Frontend.md` — arsitektur frontend, responsive, komponen, integrasi hardware
3. `03-PRD-Backend.md` — API, skema data, autentikasi, integrasi payment & Google Sheets
4. `04-PRD-Offline-Sync.md` — arsitektur offline-first & strategi sinkronisasi (deep-dive)
5. `05-PRD-Payment-Gateway.md` — integrasi Midtrans/Xendit/QRIS/EDC
6. `06-PRD-Deployment.md` — environment, CI/CD, hosting, monitoring
7. `07-PRD-QR-Menu-Digital-Receipt.md` — struk digital (WA/Email) & QR Menu/self-order

## 11. Asumsi & Pertanyaan Terbuka

- Paling mendesak — model operasional dine-in vs bawa-pulang: bisnis sudah terkonfirmasi F&B (Hasuka Dimsum). Yang belum jelas: apakah pelanggan makan di tempat (butuh manajemen meja, split bill, KDS) atau model beli-bawa-pulang (tidak perlu). Sebaiknya dikonfirmasi sebelum development lanjut jauh.
- Berapa jumlah outlet di awal? (mempengaruhi urgensi fitur multi-outlet)
- Apakah client sudah punya rekening merchant/MID untuk QRIS, atau perlu bantu daftar?
- Budget & timeline belum ditentukan — perlu info skala tim (solo dev vs tim).
- Kalau Google Sheets sync jadi prioritas client (bukan cuma nice-to-have), perlu konfirmasi lebih awal karena mempengaruhi urutan development di PRD-03.
- Referensi tarif PPN: per aturan yang berlaku, kenaikan PPN ke 12% hanya berlaku untuk barang/jasa mewah — barang/jasa nonmewah tetap efektif 11%. Karena rate dibuat configurable, ini tidak masalah kalau aturan berubah lagi.
- Printer struk sudah dimiliki client tapi mereknya belum diketahui — cek konektivitas LAN/WiFi-nya sebelum development integrasi hardware (lihat PRD-02 bagian 8).
