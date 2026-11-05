# PRD-03 — Backend
**Proyek:** POS Kasir untuk Hasuka Dimsum | **Status:** v1.1
**Induk:** 00-PRD-Overview.md | **Terkait:** 04-PRD-Offline-Sync.md, 05-PRD-Payment-Gateway.md, 07-PRD-QR-Menu-Digital-Receipt.md

---

> JANGAN AI SLOP — ini juga berlaku untuk backend: jangan generate REST API generic tanpa mikir domain (nama endpoint asal-asalan, response shape tidak konsisten, error message generic "Something went wrong"). Desain API harus jelas menyampaikan domain bisnis kasir, bukan CRUD generic tanpa konteks.
> Skill: jika environment punya skill terkait backend/API design/database, baca dulu sebelum implementasi.
> Catatan: dokumen ini tidak menentukan tampilan, hanya kontrak data/API yang mendukung apa yang didesain di PRD-01.
> Catatan: integrasi Midtrans/Xendit (lihat PRD-05) sifatnya opsional untuk MVP — hanya wajib kalau outlet pakai `qris_mode: "dynamic"`. Kalau outlet pakai QRIS statis, modul ini boleh dikerjakan belakangan. Detail keputusan di PRD-05 bagian 1-2.

---

## 1. Tujuan

Backend adalah pusat kebenaran lintas outlet (bukan lintas transaksi harian — itu tugas local DB di PRD-04), menyimpan master data (produk, harga, promo, pajak, user), menerima hasil sinkronisasi transaksi dari tiap terminal, memproses pembayaran non-tunai, melayani halaman web publik (Owner Dashboard, QR Menu), dan menyajikan laporan.

## 2. Keputusan Tech Stack

| Komponen | Pilihan | Alasan |
|---|---|---|
| Bahasa & framework | Node.js + NestJS (TypeScript) | Satu bahasa dengan frontend (PRD-02) — kurangi context-switching untuk tim kecil/solo |
| Database utama | PostgreSQL | Transaksional, robust untuk data uang, mendukung constraint ketat |
| Cache/queue | Redis (BullMQ untuk job queue) | Antrian job sync, webhook payment, kirim struk digital, retry |
| Autentikasi | JWT (access + refresh token) untuk web/admin, PIN-based login untuk kasir di terminal | Kasir ganti shift harus cepat |
| Alternatif jika tim lebih familiar PHP | Laravel + PostgreSQL/MySQL | Ekosistem PHP di Indonesia besar, Midtrans/Xendit punya SDK resmi PHP |

## 3. Prinsip Desain API

- RESTful, response shape konsisten (`{ data, meta, error }`)
- Idempotent untuk semua endpoint sync (pakai `externalId`/UUID digenerate di client)
- Batch-friendly: endpoint sync menerima banyak transaksi sekaligus
- Versioning API dari awal (`/api/v1/...`)
- Endpoint publik (QR Menu) dipisah namespace dari endpoint terautentikasi, dengan rate-limiting lebih ketat

## 4. Modul & Skema Data (ringkas)

| Modul | Entity utama |
|---|---|
| Outlet & User | `outlets` (termasuk `tax_enabled`, `tax_rate`, `qris_mode: "static"\|"dynamic"`, `static_qris_image_url`), `users`, `roles`, `user_outlet_access` |
| Produk | `products` (termasuk `is_taxable`), `categories`, `product_variants`, `stock_levels` (dengan `min_stock_threshold` untuk alert) |
| Promo | `promotions` (id, outlet_id, name, scope_type: `all`\|`category`\|`product`, discount_type: `percentage`\|`fixed`, value, start_date opsional, end_date opsional, is_active), `promotion_targets` (relasi many-to-many kalau scope-nya category/product) |
| Transaksi | `transactions`, `transaction_items` (termasuk `applied_promotion_id` nullable), `payments` (termasuk `confirmation_type: "manual"\|"webhook"`, `confirmed_by_user_id`, `confirmed_at`), `discounts` (diskon manual kasir), `voids`, `refunds` |
| Shift | `shifts` (opening_cash, closing_cash, selisih, cashier_id, outlet_id) |
| Stok Opname | `stock_opname_sessions` (id, outlet_id, started_by_user_id, started_at, completed_at, status: `in_progress`\|`completed`), `stock_opname_items` (session_id, product_id, system_stock_at_time, physical_count, difference, note) |
| Petty Cash | `petty_cash_entries` (id, outlet_id, shift_id, amount, category, description, recorded_by_user_id, created_at, receipt_photo_url opsional) |
| Sync | `sync_log` (audit setiap batch sync: dari terminal mana, kapan, status) |
| Struk digital | `receipt_deliveries` (transaction_id, channel: wa/email, status, sent_at) — detail di PRD-07 |
| QR Menu | `menu_qr_codes` (outlet_id, table_id opsional, url_slug) — detail di PRD-07 |
| Integrasi | `google_sheets_connections` (outlet_id, oauth_token, spreadsheet_id, last_synced_at) |
| Pelanggan (fase 2) | `customers`, `loyalty_points` |

Field penting yang wajib ada di `transactions`: `client_generated_id` (UUID dari terminal, untuk idempotency), `created_at_client`, `outlet_id`, `cashier_id`, `shift_id`, `status` (`completed`/`voided`/`refunded`), `tax_amount`, `subtotal`, `promo_discount_amount`, `manual_discount_amount`, `total`.

Formula rekonsiliasi kas saat Tutup Shift (sudah termasuk petty cash):
```
Kas seharusnya = kas awal (opening_cash)
                + total tunai masuk dari penjualan
                - total refund tunai
                - total petty cash keluar (dari petty_cash_entries shift itu)

Selisih = kas fisik hasil hitung manual - kas seharusnya
```

## 5. Kalkulasi Pajak & Promo di Transaksi

Urutan hitung per item, wajib konsisten antara local DB (offline, PRD-04) dan backend:

```
1. Harga dasar item (qty x harga satuan)
2. Cek promo aktif yang cocok (scope produk/kategori/semua, dalam rentang tanggal aktif) -> kurangi otomatis
3. Diskon manual oleh kasir (kalau ada, butuh approval role tertentu untuk nominal besar)
4. Kalau outlet.tax_enabled = true DAN product.is_taxable = true -> tambahkan pajak = subtotal_setelah_diskon x outlet.tax_rate
5. Total akhir
```

Promo (langkah 2) dan diskon manual (langkah 3) tidak saling meniadakan — keduanya bisa berlaku sekaligus di satu transaksi, tapi dicatat terpisah (`applied_promotion_id` vs `discounts`) supaya laporan bisa membedakan "berapa dari promo" vs "berapa dari kebijakan kasir di lapangan".

## 6. Endpoint Utama (ringkas per grup)

Sync (terautentikasi, kontrak dengan PRD-04):
- `POST /api/v1/sync/transactions/batch` — terima array transaksi, idempotent per `client_generated_id`
- `GET /api/v1/sync/products?since={timestamp}` — pull perubahan produk/harga/stok
- `GET /api/v1/sync/promotions?since={timestamp}` — pull aturan promo aktif
- `GET /api/v1/sync/settings?since={timestamp}` — pull pengaturan outlet termasuk `tax_enabled`/`tax_rate` dan `qris_mode`/`static_qris_image_url`

Promo (terautentikasi, dipakai halaman Pengaturan):
- `GET/POST/PUT/DELETE /api/v1/promotions` — CRUD aturan promo

Stok Opname & Petty Cash (terautentikasi):
- `POST /api/v1/stock-opname/sessions` — mulai sesi hitung fisik
- `PUT /api/v1/stock-opname/sessions/:id/items` — input hasil hitung per produk
- `POST /api/v1/stock-opname/sessions/:id/complete` — selesaikan sesi, sesuaikan stok sistem, catat audit log
- `GET/POST /api/v1/petty-cash` — catat & lihat pengeluaran kas kecil per shift

Struk digital (lihat PRD-07):
- `POST /api/v1/receipts/:transactionId/send` — body `{ channel: "whatsapp" | "email", target }`

QR Menu — publik, tanpa auth (lihat PRD-07):
- `GET /api/v1/public/menu/:outletSlug` — daftar produk & kategori, termasuk harga setelah promo aktif (harga coret) kalau ada

Owner Dashboard & Laporan (terautentikasi):
- `GET /api/v1/dashboard/summary` — satu endpoint agregat untuk landing page Owner Dashboard: penjualan hari ini/minggu/bulan + komparasi periode sebelumnya, daftar ringkas produk stok menipis, ringkasan shift terakhir, top produk terlaris, ringkasan performa promo aktif
- `GET /api/v1/reports/sales?range=...` — ringkasan & detail penjualan (pisahkan angka pajak, promo, diskon manual)
- `GET /api/v1/reports/sales/export?format=csv|xlsx`
- `POST /api/v1/integrations/google-sheets/sync` — trigger sync manual ke Google Sheets

## 7. Integrasi Google Sheets (opsional, nice-to-have — lihat PRD-00 bagian 6)

Prinsip: satu arah (backend ke Sheets), bukan Sheets sebagai sumber data. PostgreSQL tetap satu-satunya database utama.

Alur teknis: (1) owner connect akun Google via OAuth2 dari halaman Pengaturan, (2) token disimpan terenkripsi di `google_sheets_connections`, (3) sync jalan via Google Sheets API v4, dipicu job terjadwal (mis. akhir hari) atau tombol manual, (4) yang dikirim adalah ringkasan transaksi bukan raw dump, (5) token expired/dicabut, tandai perlu re-auth, jangan gagal diam-diam.

## 8. Keamanan

- Role-based access control: kasir tidak bisa ubah harga/pajak/promo/hapus produk — hanya manager/owner
- Audit log untuk aksi sensitif: void transaksi, refund, ubah harga, ubah aturan promo/pajak, hapus produk
- Rate limiting di endpoint publik (login, sync, endpoint QR Menu)
- Semua secret via environment variable, tidak pernah hardcoded/commit ke repo

## 9. Multi-Outlet (fase 2, tapi desain skema dari awal siap ke sini)

Meskipun MVP fokus 1 outlet, skema data (`outlet_id` di hampir semua tabel, termasuk `promotions` dan setting pajak per-outlet) harus sudah siap multi-outlet dari awal.

## 10. Definition of Done

- [ ] Skema database final & migration terdokumentasi, termasuk `promotions`, `tax_enabled`/`tax_rate`, `is_taxable`
- [ ] Endpoint sync lolos test idempotency
- [ ] Kalkulasi pajak & promo (bagian 5) teruji identik hasilnya antara local DB (offline) dan backend
- [ ] Stok Opname: selisih terhitung benar, stok sistem ter-update setelah sesi selesai, ada audit log
- [ ] Petty Cash: entry tercatat per shift dan masuk ke formula rekonsiliasi Tutup Shift dengan benar
- [ ] Setting `qris_mode` per outlet berfungsi; kalau `dynamic`, integrasi payment gateway lolos sandbox test (lihat PRD-05)
- [ ] Endpoint QR Menu publik teruji tidak membocorkan data internal & menampilkan harga promo dengan benar
- [ ] Integrasi Google Sheets teruji end-to-end
- [ ] RBAC teruji: kasir tidak bisa akses endpoint yang harusnya khusus manager/owner
