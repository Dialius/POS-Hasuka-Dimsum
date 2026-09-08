# PRD-08 — Arsitektur Hybrid: Tauri (React) + Google Sheets + Apps Script
**Proyek:** POS Kasir untuk Hasuka Dimsum | **Status:** v0.3 — Pivot dari AppSheet-UI ke Tauri-UI, jalur aktif
**Induk:** 00-PRD-Overview.md | **Menggantikan:** 02-PRD-Frontend.md, 03-PRD-Backend.md, 04-PRD-Offline-Sync.md, 06-PRD-Deployment.md (konsep offline-sync dari PRD-04 dipakai lagi di sini, target sync-nya saja yang beda)

---

> PERUBAHAN DARI v0.2: AppSheet DIHILANGKAN sepenuhnya sebagai UI. UI kasir yang sudah dibangun tim (React, sesuai PRD-01) dipertahankan 100% — dibungkus Tauri (native app) supaya offline dan cetak struk beneran jalan, bukan disajikan lewat Apps Script HTML Service. Google Sheets tetap jadi database, Apps Script tetap jadi lapisan API/sync — bagian ini yang tidak berubah dari rencana client.
> JANGAN AI SLOP tetap berlaku. Kode React yang sudah ada JANGAN dibangun ulang dari nol — lanjutkan dan sambungkan ke arsitektur baru ini.

---

## 1. Kenapa Pivot Ini

- AppSheet terbukti (dicek langsung ke dokumentasi & review resmi) **secara struktural terbatas untuk UI custom** — cuma bisa ganti warna tema/logo/font dari daftar terbatas, tidak bisa bikin layout/komponen custom. Ini alasan kenapa versi AppSheet murni akan terasa kaku dibanding desain PRD-01.
- Versi React-di-dalam-Apps-Script-HTML-Service (hasil kerja sebelumnya) sudah benar soal UI, tapi salah soal offline — Apps Script HTML Service berjalan di iframe sandbox yang tidak bisa diandalkan untuk Service Worker/caching, jadi aplikasi wajib online 100%. Ini mengulang masalah yang sama seperti kalau pakai AppSheet: requirement offline paling inti dari proyek ini tidak terpenuhi.
- Solusinya: pisahkan UI dari cara hosting-nya. React yang sudah dibangun **dibungkus Tauri** (app ter-install, sama seperti rencana awal PRD-02) supaya dapat local SQLite + akses printer asli — sementara Google Sheets dan Apps Script tetap dipakai sebagai database dan API, sesuai keinginan client soal ekosistem Google dan tanpa VPS.

## 2. Batasan yang Masih Berlaku

- Google Sheets tetap bukan database transaksional penuh — rawan concurrency di bawah beban tinggi. Untuk skala 1-3 outlet kecil ini masih wajar, tapi bukan solusi yang scale tanpa batas.
- Apps Script tetap ada limit eksekusi (6 menit) dan kuota harian (trigger, urlfetch, email) — cukup untuk skala Hasuka Dimsum saat ini, perlu dipantau kalau volume transaksi naik jauh.
- Tier AppSheet sudah tidak relevan lagi karena AppSheet tidak dipakai — TIDAK ADA biaya AppSheet sama sekali di jalur ini sekarang. Biaya yang tetap ada: distribusi app Tauri (installer, opsional biaya code-signing/App Store kalau nanti mau publish resmi — untuk sekarang cukup distribusi langsung/sideload).

## 3. Arsitektur

```
Tauri App (kasir, tablet/HP) - React yang sudah dibangun, TIDAK diubah tampilannya
    -> Local SQLite (source of truth harian, pola outbox seperti PRD-04)
    -> Sync ke Google Apps Script Web App (push transaksi batch, pull produk/resep/promo/settings)
            -> Google Sheets (database)

Web App back-office (Owner) - React yang sama, dibuild sebagai web biasa (tanpa Tauri)
    -> Panggil Apps Script Web App langsung (selalu online, tidak butuh offline)

QR Menu pelanggan - web ringan terpisah, fetch dari Apps Script Web App (read-only, publik)
```

Pola sync mengikuti PRD-04 (outbox + background worker + idempotency by `client_generated_id`) — dokumen itu tetap jadi acuan detail, cuma "server" yang dituju sekarang adalah endpoint Apps Script, bukan NestJS.

## 4. Multi-Outlet / Manajemen Cabang (BARU)

Owner bisa menambah, mengedit cabang sendiri, dan mengatur kasir mana yang bertugas di cabang mana — tanpa bantuan developer.

- **Data master** (dipakai bersama semua cabang): Products, Ingredients (definisi), Recipes, Categories, Promotions.
- **Data per-cabang** (dipisah per outlet): stok fisik ingredient (lihat `IngredientStock` di bagian 6), Transactions, Shifts, StockOpname, PettyCash, dan Settings (tiap cabang bisa beda tarif pajak/mode QRIS-nya sendiri).
- **Halaman Kelola Cabang** (owner-only): tambah cabang baru (nama, alamat, no. telp), edit, nonaktifkan cabang. Dari halaman yang sama atau terhubung, owner assign user/kasir ke cabang tertentu (satu kasir bisa saja ditugaskan di lebih dari satu cabang kalau perlu, tapi tiap sesi login/shift tetap terikat ke satu cabang).
- **Scoping akses**: kasir login hanya melihat data cabang yang dia ditugaskan. Owner melihat semua cabang, bisa filter per cabang atau lihat gabungan.

## 5. Prinsip Akses Owner (BARU — ditegaskan eksplisit)

Owner punya akses kelola penuh ke SEMUA hal berikut, tanpa perlu minta bantuan developer untuk operasional sehari-hari: Produk & Kategori, Promo, Resep (bagian 7) & Bahan Baku, Cabang & penugasan kasir (bagian 4), User & Role, Pengaturan (Pajak, QRIS) per cabang. Prinsipnya: kalau itu data konfigurasi/master (bukan transaksi harian kasir), owner harus bisa CRUD sendiri dari UI, bukan lewat edit langsung ke Google Sheets atau minta developer.

## 6. Sistem Stok Berbasis Resep (Composition-Based)

Tidak berubah dari v0.2 secara konsep: menu yang terjual memotong stok bahan baku/kemasan sesuai resep, ingredient yang ditandai `is_tracked = FALSE` dilewati. Yang berubah: stok sekarang per-cabang (lihat `IngredientStock` di bagian 8), bukan stok tunggal global.

**Tambahan UX yang diminta**: di halaman Manajemen Produk maupun Kelola Resep, sediakan tombol "Tambah Resep" langsung dari tampilan/detail sebuah produk — supaya owner tidak perlu pindah halaman dulu ke Kelola Resep secara terpisah untuk menghubungkan produk baru ke bahan-bahannya. Tombol ini membuka form tambah baris resep (ingredient + qty) yang terikat ke produk yang sedang dilihat.

## 7. Fitur Kelola Resep

Tetap seperti v0.2 (tabel Products dan Ingredients terpisah, dihubungkan lewat Recipes) — ditambah shortcut di bagian 6 di atas.

## 8. Skema Google Sheets (Update)

| Sheet/Tab | Kolom utama | Catatan |
|---|---|---|
| **Outlets** | id, name, address, phone, is_active | BARU |
| Products | id, name, category, price, stock_mode, is_taxable, image_url | Master, dipakai semua cabang |
| Ingredients | id, name, unit, is_tracked | Master (definisi), TANPA kolom stok langsung |
| **IngredientStock** | outlet_id, ingredient_id, current_stock, min_stock_threshold | BARU — stok per cabang, dipisah dari definisi ingredient |
| Recipes | id, product_id, ingredient_id, qty_per_unit | Master |
| Categories | id, name | Master |
| Promotions | id, name, scope_type, target, discount_type, value, start_date, end_date, is_active | Master (atau tambah outlet_id kalau owner mau promo beda per cabang) |
| Transactions | id, outlet_id, timestamp, cashier, shift_id, subtotal, promo_discount, manual_discount, tax, total, payment_method, status, client_generated_id | Tambah outlet_id, client_generated_id untuk idempotency sync |
| TransactionItems | id, transaction_id, product_id, qty, unit_price, promo_id | — |
| Shifts | id, outlet_id, cashier, opening_cash, closing_cash, opened_at, closed_at, selisih | Tambah outlet_id |
| StockOpname | id, outlet_id, session_id, ingredient_id, system_stock, physical_count, difference, date | Tambah outlet_id |
| PettyCash | id, outlet_id, shift_id, amount, category, description, recorded_by | Tambah outlet_id |
| Settings | outlet_id, key, value | Sekarang per-cabang |
| Users | id, name, pin_hash, role | — |
| **UserOutletAccess** | user_id, outlet_id | BARU — kasir mana bertugas di cabang mana |

## 9. Tanggung Jawab Apps Script (Update)

- Endpoint sync untuk pola outbox Tauri: terima batch transaksi (idempotent via `client_generated_id`), kirim balik update produk/resep/promo/settings per outlet sejak timestamp terakhir (mirror pola PRD-04)
- Potong stok `IngredientStock` (scoped per outlet_id) berdasarkan Recipes saat transaksi baru masuk — pakai LockService, sudah pernah diimplementasi dengan benar di versi sebelumnya, pastikan tetap jalan setelah skema berubah jadi per-outlet
- Generate QRIS dinamis, terima webhook Midtrans/Xendit
- Kirim struk digital (WA deep link + email)
- Job terjadwal: laporan harian per cabang, alert stok menipis per cabang
- Endpoint publik untuk QR Menu (per outlet_id / table_id kalau perlu)
- Endpoint untuk operasi Kelola Cabang dan penugasan kasir (CRUD Outlets, CRUD UserOutletAccess)

## 10. Kebutuhan yang Masih Perlu Diperbaiki dari Build Sebelumnya

Ini bug/kekurangan konkret dari hasil audit sebelumnya, dicatat di sini supaya jadi bagian resmi spec, bukan cuma catatan chat:

- **Filter tanggal custom** di Owner Dashboard dan Laporan Penjualan harus benar-benar berfungsi (date range picker interaktif), bukan cuma preset Hari ini/Minggu ini/Bulan ini yang statis.
- **Laporan Shift** harus jadi fitur yang berfungsi: daftar riwayat shift (per cabang), masing-masing menampilkan kasir, waktu buka/tutup, kas awal/akhir, selisih, dan bisa diklik untuk lihat detail transaksi di shift itu. Saat ini tombolnya ada tapi belum berfungsi.
- **Semua tombol di halaman Laporan** perlu diaudit satu per satu dan dipastikan benar-benar berfungsi sesuai maksudnya (export, filter, drill-down, dst) — bukan cuma tombol dekoratif.
- **Diskon manual per-transaksi** di layar Checkout (belum ada per audit sebelumnya) — kasir harus bisa input diskon manual per-item atau per-nota.
- **Void/Refund** (belum ada per audit sebelumnya) — perlu layar khusus untuk Owner/Manager, termasuk logic Apps Script yang mengembalikan stok ingredient sesuai resep saat transaksi dibatalkan.

## 11. Kualitas UI (Ditegaskan Ulang)

- Tidak ada scrollbar default browser/OS yang terlihat di manapun — custom styled atau disembunyikan dengan indikator custom.
- Tidak ada dropdown/combobox/select native browser di manapun — semua pakai komponen custom yang konsisten dengan design system PRD-01.
- Ini instruksi ulang karena laporan audit sebelumnya bilang sudah selesai — perlu verifikasi ulang menyeluruh di SEMUA halaman (termasuk halaman baru: Kelola Cabang, Laporan Shift), bukan cuma yang lama.

## 12. Definition of Done

- [ ] Kode React sebelumnya berjalan di dalam Tauri, tidak dibangun ulang
- [ ] Local SQLite + outbox sync ke Apps Script berfungsi, idempotent, teruji dengan skenario offline lama lalu online lagi
- [ ] Cetak struk fisik lewat printer LAN berfungsi dari Tauri
- [ ] Multi-outlet: owner bisa tambah/edit cabang, assign kasir ke cabang, kasir cuma lihat data cabangnya sendiri
- [ ] Tombol "Tambah Resep" dari halaman produk berfungsi
- [ ] Filter tanggal custom di Owner Dashboard dan Laporan benar-benar interaktif
- [ ] Laporan Shift menampilkan riwayat shift yang benar dan bisa di-drill-down
- [ ] Semua tombol di halaman Laporan diverifikasi berfungsi satu per satu
- [ ] Diskon manual dan Void/Refund sudah ada dan berfungsi
- [ ] Tidak ada scrollbar/combobox default di seluruh halaman, termasuk halaman baru
