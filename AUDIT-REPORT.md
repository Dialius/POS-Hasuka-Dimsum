# Laporan Audit POS Hasuka Dimsum (Update PRD-08 v0.3)

Berdasarkan pengecekan menyeluruh terhadap *codebase* dan dokumen PRD-08 v0.3, berikut adalah laporan audit terbaru per item sesuai instruksi Fase 1-4.

> **UPDATE ARSITEKTUR (FASE 1)**
> Aplikasi telah beralih (pivot) dari murni Google Apps Script HTML Service menjadi **Tauri Desktop App** dengan React sebagai UI. 
> Mode *Offline-First* telah diimplementasi menggunakan `tauri-plugin-sql` (Local SQLite) dan *Outbox Pattern*. Aplikasi menulis ke lokal terlebih dahulu, lalu background worker mensinkronkan batch transaksi ke Apps Script.
> Namun, karena keterbatasan environment saat ini (tidak ada Rust/Cargo), build Tauri belum dapat dikompilasi secara fisik. Status fitur-fitur baru terkait Tauri ditandai **SEBAGIAN** karena kodenya sudah ditulis namun butuh divalidasi di mesin target.

---

## BAGIAN A: Permintaan Client
1. **Ekosistem Google (AppSheet+Sheets+Apps Script) sebagai platform utama**
   - **BEDA-DARI-RENCANA:** AppSheet dihilangkan, namun backend (Database & API) tetap 100% menggunakan Google Sheets & Apps Script. UI menggunakan React yang dibungkus Tauri.
2. **Tier AppSheet yang dipakai (Starter/Core)**
   - **BEDA-DARI-RENCANA:** Tidak relevan, tidak ada biaya AppSheet.
3. **Compatibility tablet & HP**
   - **SELESAI:** UI React sudah responsive (split-screen untuk tablet, single-column untuk HP).
4. **Owner Dashboard (ringkasan penjualan)**
   - **SELESAI:** `OwnerDashboardScreen.tsx` sudah ada (meski butuh update filter custom di Fase 3).
5. **Manajemen stok & Stok Opname**
   - **SEBAGIAN:** Fitur ada, tapi akan disesuaikan untuk Multi-Cabang (Fase 2).
6. **Fitur Refund/Void**
   - **BELUM:** (Akan dikerjakan di Fase 3).
7. **Pencatatan Petty Cash**
   - **SELESAI:** Fitur kas kecil ada.
8. **Rekap pembagian pembayaran Cash vs QRIS**
   - **SELESAI:** Laporan terpisah.
9. **Sistem stok berbasis resep (composition-based)**
   - **SELESAI:** Terintegrasi di `Code.gs`. (Tinggal dipisah per-cabang di Fase 2).
10. **Fitur Kelola Resep untuk Owner**
    - **SEBAGIAN:** Fitur ada, tapi perlu ditambah shortcut dari halaman Produk (Fase 3).

---

## BAGIAN B: Checklist Fitur Tambahan (Fase 1-4)
- **Fase 1: Pivot Tauri & Mode Offline (SQLite + Outbox)**
  - **SEBAGIAN:** Kode `db.ts` (SQLite) dan `syncWorker.ts` telah dibuat. Endpoint Apps Script (`syncPush`) dan *idempotency* via sheet `SyncLogs` telah diimplementasikan. Belum bisa divalidasi karena tidak bisa build Tauri (`cargo` not found).
- **Fase 1: Cetak struk fisik (LAN/ESC-POS)**
  - **SEBAGIAN:** Command native Rust `print_receipt` telah ditulis di `src-tauri/src/lib.rs` dan di-bind di `printer.ts`, namun belum dites langsung dengan hardware printer.
- **Fase 2: Multi-Outlet / Cabang**
  - **BELUM:** Data sheet Outlets dan UserOutletAccess beserta halaman pengelolaannya belum dikerjakan.
- **Fase 2: Scoped Login Kasir per Cabang**
  - **BELUM.**
- **Fase 2: Prinsip Akses Owner (CRUD Data Master Penuh)**
  - **BELUM:** Perlu audit lanjutan halaman owner.
- **Fase 3: Tambah Resep Langsung dari Produk**
  - **BELUM.**
- **Fase 3: Filter Tanggal Custom (Date Range Picker)**
  - **BELUM.**
- **Fase 3: Laporan Shift Detail (Riwayat & Transaksi)**
  - **BELUM.**
- **Fase 3: Audit Fungsi Tombol Laporan (Export, Drill-down)**
  - **BELUM.**
- **Fase 3: Diskon Manual per-transaksi (Checkout)**
  - **BELUM.**
- **Fase 3: Void / Refund (termasuk kembalikan stok resep)**
  - **BELUM.**
- **Fase 4: Verifikasi Kualitas UI (Scrollbar & Select Native)**
  - **BELUM.**

---

## RINGKASAN & PRIORITAS

- **Fase 1 (Pivot Arsitektur)** telah dikerjakan secara *code-level*, namun verifikasi utuh terhalang ketiadaan `cargo` di environment.
- Saya akan meminta konfirmasi penyelesaian Fase 1 dan izin untuk lanjut ke **FASE 2 (Multi-Outlet / Cabang)**. 
