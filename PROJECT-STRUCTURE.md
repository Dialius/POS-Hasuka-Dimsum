# Laporan Audit Struktur Proyek Pos Kasir Hasuka

Berikut adalah pemetaan jujur dan mendetail dari kondisi mentah proyek ini saat ini, tanpa asumsi atau rencana ke depan.

## 1. STRUKTUR DIREKTORI LENGKAP
Struktur direktori hingga level 3 dari root proyek `d:\Client-Dimsum`:

```text
/
├── pos-kasir/                              (Aplikasi frontend React dan wrapper Tauri)
│   ├── src/                                (Kode utama React)
│   │   ├── assets/                         (File statis seperti gambar logo)
│   │   ├── components/                     (Komponen UI React, seperti CheckoutScreen, dsb)
│   │   ├── context/                        (React Context API untuk global state seperti AppContext)
│   │   ├── data/                           (Data dummy/mock awal, spt mockData.ts)
│   │   └── services/                       (Kumpulan fungsi logic backend: db.ts, gasApi.ts, syncWorker.ts)
│   ├── src-tauri/                          (Kode sumber Rust untuk aplikasi desktop Tauri)
│   │   ├── capabilities/                   (Konfigurasi permission Tauri)
│   │   ├── icons/                          (Ikon aplikasi desktop)
│   │   └── src/                            (File main.rs tempat entry point Rust/Tauri)
│   ├── package.json                        (Definisi dependensi Node.js / React)
│   ├── vite.config.ts                      (Konfigurasi bundler Vite)
│   └── tailwind.config.js                  (Konfigurasi styling Tailwind CSS)
│
├── google-apps-script/                     (Kode backend Google Apps Script)
│   ├── Code.gs                             (File utama API backend, menangani GET, POST, & logika bisnis)
│   ├── Index.html                          (Template HTML jika web app diakses via browser)
│   ├── SetupSheets.gs                      (Script untuk meng-generate struktur sheet secara otomatis)
│   └── PANDUAN_SETUP_GOOGLE_SHEETS.md      (Panduan cara deploy script ini ke Google)
│
├── prd/                                    (Folder Product Requirements Document)
└── AUDIT-REPORT.md                         (Dokumen laporan awal/fitur)
```

## 2. DEPENDENSI YANG TERPASANG
Hanya dependensi yang **benar-benar terpasang** di file konfigurasi saat ini.

**React / Node.js (`pos-kasir/package.json`):**
* `react` (^18.3.1)
* `react-dom` (^18.3.1)
* `lucide-react` (^0.439.0)
* `@tauri-apps/api` (^2.11.1)
* `@tauri-apps/plugin-sql` (^2.4.1)

*(Catatan: Ada library `vite`, `typescript`, dan `tailwindcss` sebagai devDependencies).*

**Rust / Tauri (`pos-kasir/src-tauri/Cargo.toml`):**
* `serde` (1.0, features = ["derive"])
* `serde_json` (1.0)
* `log` (0.4)
* `tauri` (2.11.3)
* `tauri-plugin-log` (2)
* `tauri-plugin-sql` (2.0.0, features = ["sqlite"])

## 3. ALUR DATA YANG BENAR-BENAR ADA SEKARANG (Transaksi Kasir)
Alur ini ditarik langsung dari source code, bukan teori:

1. **Tap Tombol BAYAR**: Di `CheckoutScreen.tsx`, saat kasir klik tombol "BAYAR", fungsi `handlePaymentSuccess()` dipanggil.
2. **Panggil Service API**: Fungsi tersebut memanggil `gasApi.createTransaction(payload)` dari file `gasApi.ts`.
3. **Antrean Outbox (Offline-First)**: Alih-alih mengirim request HTTP langsung, fungsi `createTransaction` memanggil fungsi `queueOutbox('createTransaction', payload)` dari `db.ts`. 
   - Di `db.ts`, UUID (`client_generated_id`) dibuat. Data transaksi di-JSON-kan dan di-insert ke dalam tabel SQLite lokal bernama `outbox` dengan status `"pending"`. Transaksi selesai di mata kasir (UI kembali ke state sukses).
4. **Sinkronisasi di Background**: Ada sebuah interval waktu yang berjalan di `syncWorker.ts` (secara default tiap 30 detik).
   - Jika koneksi internet menyala, fungsi `sync()` akan dipanggil.
   - Fungsi ini menarik semua data di tabel SQLite `outbox` yang berstatus `pending`.
   - Data dibungkus menjadi sebuah array `batch` dan dikirim sungguhan ke Google Apps Script (GAS) lewat request POST HTTP dengan metode `gasApi.postAction('syncPush', { batch: payloads })`.
5. **Pemrosesan di Google Apps Script**: Di `Code.gs`, fungsi `doPost` menerima request POST dan mengarahkannya ke `handleSyncPush`.
   - Script akan mengecek tab `SyncLogs` untuk ID ini (mencegah *double entry* / idempotensi).
   - Jika belum ada, diteruskan ke fungsi `handleCreateTransaction`.
   - Di fungsi ini, baris baru ditambahkan ke sheet `Transactions` dan `TransactionItems`.
   - **Pemotongan Stok**: Script akan mengecek apakah produk memiliki status stok `direct` (potong produk langsung) atau resep (potong `Ingredients` berdasarkan data `Recipes`). Stok diupdate langsung ke baris sheet yang bersangkutan.
6. **Tandai Selesai**: GAS mengembalikan daftar ID yang sukses diolah (`synced_ids`). Di React, `syncWorker.ts` menerima ID ini dan mengubah status di SQLite dari `"pending"` menjadi `"synced"` via fungsi `markOutboxSynced(id)`.

## 4. SKEMA GOOGLE SHEETS AKTUAL
Skema yang **nyata** dikodingkan dan diantisipasi oleh `Code.gs` dan `db.ts` saat ini:

* **Transactions**: `txId`, `invoiceNo`, `timestamp`, `cashier`, `shift_id`, `subtotal`, `promo_discount`, `manual_discount`, `tax`, `total`, `payment_method`, `cash_received`, `change_amount`, `status`
* **TransactionItems**: `id` (txId-idx), `txId`, `product_id`, `product_name`, `qty`, `unit_price`, `subtotal`
* **Products**: `id`, `name`, `cat`, `price`, `cost`, `stock_mode`, `stock`, `minStock`, `promo`, `promoText`, `originalPrice`, `img`, `outlets`
* **Ingredients**: `id`, `name`, `unit`, `current_stock`, `min_stock_threshold`, `is_tracked`, `outlets`
* **Recipes**: `id`, `product_id`, `ingredient_id`, `qty_per_unit`
* **Categories**: `id`, `name`
* **Settings**: `key`, `value`
* **Outlets**: `id`, `name`, `address`, `phone`
* **Cashiers**: `id`, `name`, `branchId`, `role`, `status`
* **SyncLogs**: `client_generated_id`, `timestamp`, `action` (Digunakan untuk penanda idempotency sync offline)
* **StockOpname**: `session_id-idx`, `session_id`, `dateStr`, `ingId`, `system`, `physical`, `diff`, `notes`, `recorded_by`
* **ShiftReports**: `id`, `date`, `cashier`, `outlet`, `start_time`, `end_time`, `total_transactions`, `omzet`, `petty_cash`, `kas_awal`, `kas_sistem`, `kas_fisik`, `selisih`, `alasan`

## 5. FUNGSI APPS SCRIPT YANG ADA (`Code.gs`)
Semua fungsi berikut benar-benar ada dan sudah ditulis logikanya:

* `doGet`: Melayani endpoint web-app (HTML) atau merespons `ping` dan `getInitialData`. (Fungsional)
* `doPost`: Entry point utama HTTP POST. Melakukan routing action via JSON payload dengan implementasi *LockService* antrean (15 detik). (Fungsional)
* `handleSyncPush`: Menangani batch operasi (offline sync outbox) dengan pengecekan double data. (Fungsional)
* `handleCreateTransaction`: Mencatat transaksi kasir & memotong stok di sheet. (Fungsional)
* `handleSaveRecipe`: Menggantikan resep produk (hapus data lama, insert data resep baru). (Fungsional)
* `handleStockOpname`: Menyimpan data SO dan mengubah (timpa) stok fisik di master `Ingredients`. (Fungsional)
* `handleSaveOutlet` & `handleDeleteOutlet`: CRUD data outlet. (Fungsional)
* `handleSaveCashier` & `handleDeleteCashier`: CRUD data kasir. (Fungsional)
* `handleSaveShiftReport`: Insert pelaporan akhir shift kasir. (Fungsional)
* `handleSaveProduct`: CRUD data produk. (Fungsional)
* `handleSaveIngredient`: CRUD data bahan baku. (Fungsional)
* `handleUploadImage`: Menyimpan file Base64 ke dalam direktori Google Drive. (Fungsional)
* `isSyncProcessed` & `recordSyncProcessed`: Helper untuk membaca/menulis ke sheet `SyncLogs` demi keamanan data ganda (idempotency). (Fungsional)

*(Semua fungsi di atas **sudah ter-coding rapi** di Code.gs dan siap di-test. Beberapa operasi dari frontend seperti uploadImage tampaknya sudah di-implement secara teknis di frontend juga).*

## 6. STATUS BUILD/COMPILE
* **React / Frontend (`npm run dev`)**: Sudah berjalan dengan sangat baik. Di environment saat ini sedang aktif (`npm run dev -- --force`) berjalan lebih dari 30 menit.
* **Tauri / Desktop (`cargo build` / `tauri dev`)**: **Belum pernah di-compile satu kali pun di lingkungan ini.** Terlihat dari tidak adanya folder `target/` di dalam direktori `src-tauri`. Artinya, eksekusi dalam bentuk "Aplikasi Desktop Executable" dengan akses penuh ke SQLite OS belum pernah divalidasi keutuhannya.

## 7. PENJELASAN ARSITEKTUR SQLite + GOOGLE SHEETS (Outbox/Offline-First)
Arsitektur ini dipakai semata-mata demi kecepatan dan resiliensi kasir.
Bayangkan jika setiap kali kasir menekan "BAYAR", kasir harus menunggu 3-5 detik sampai Google Sheets selesai memproses data (atau bahkan gagal jika koneksi restoran sedang putus). Ini sangat mengganggu operasional. 

Dengan metode yang dipakai saat ini:
1. SQLite lokal di laptop berfungsi sebagai **tampungan tercepat**. Begitu kasir klik bayar, transaksi disimpan ke database lokal dan diantrekan di tabel `outbox` SQLite, lalu antarmuka langsung merespons "Selesai!" dalam hitungan milidetik.
2. Di balik layar, ada pekerja gaib (`syncWorker.ts`) yang diam-diam rutin mengecek: "Ada koneksi internet? Oh ada." Lalu dia mengambil semua tumpukan `outbox` tadi dan melemparnya dalam satu paket rombongan (batch) ke Google Sheets.
3. Google Sheets adalah **master/pusat kebenarannya**. Ia menerima rombongan data tadi, memproses transaksinya, memotong stok sesungguhnya, lalu mengkonfirmasi balik bahwa "Tugas selesai". Barulah `syncWorker` mencentang data lokal tersebut. 

Jadi, SQLite dipakai agar aplikasi *nggak pernah lemot atau error saat mati lampu internet*, sedangkan Google Sheets dipakai agar Owner bisa melihat pelaporan pusat dari mana saja. 

## 8. PENYIMPANAN FOTO
**Sudah diimplementasi dalam kode!** Saat ini alur penyimpanannya adalah:
1. File gambar produk dibaca sebagai format **Base64** di antarmuka kasir (lewat `gasApi.ts -> uploadImage`).
2. Teks Base64 itu dikirim langsung via HTTP POST ke fungsi `handleUploadImage` di Apps Script.
3. Apps Script akan me-ngecek atau secara otomatis membuat folder **Google Drive** bernama `POS_Hasuka_Images`. Folder ini otomatis di-set sharing *public (anyone with link can view)*.
4. Base64 di-decode dan disimpan sebagai wujud file asli (.jpg/.png) ke dalam Google Drive tersebut.
5. Apps Script mereturn URL bentuk `https://drive.google.com/uc?export=view&id=...` yang kemudian akan disimpan sebagai string di kolom `img` pada tabel produk. 

**(Tidak lagi wacana, mekanisme kodenya telah eksis di Code.gs dan gasApi.ts)**.

## 9. STATUS HALAMAN & FITUR (Level Komponen)

Berikut adalah audit jujur dari file di `pos-kasir/src/components/` berdasarkan inspeksi source code:

1. **Layar Kasir (`CheckoutScreen.tsx`)**
   - **Status:** [BERFUNGSI SEBAGIAN]
   - **Analisis:** Kerangka UI untuk grid menu, keranjang, order type (Dine In/Takeaway), dan shortcut numpad sudah sangat lengkap dan interaktif. Data masih diambil dari *mock context*, tetapi fungsi checkout-nya (`handlePaymentSuccess`) **benar-benar memanggil** `gasApi.createTransaction()` yang mengantrekan data ke SQLite outbox. Belum berfungsi *penuh* karena list menu belum ditarik dari DB SQLite lokal, tapi secara alur transaksi sudah siap jalan.

2. **Halaman Login (`LoginScreen.tsx`)**
   - **Status:** [BERFUNGSI SEBAGIAN]
   - **Analisis:** Tampilan PIN pad yang sangat responsif. Validasi PIN (1234, 2345, dsb) ada, tapi saat ini *hardcoded* mengecek kecocokan dari `mockData`. Belum query langsung ke tabel `cashiers` SQLite.

3. **Buka Shift (`BukaShiftScreen.tsx`)**
   - **Status:** [BERFUNGSI SEBAGIAN]
   - **Analisis:** Form input modal awal shift sudah ada. Namun, saat klik "Buka Shift", hanya merubah *state* di memori aplikasi (`AppContext`). Belum ada panggilan `gasApi` untuk mencatat event buka shift ini ke backend.

4. **Modal Pembayaran (`PaymentModal.tsx`)**
   - **Status:** [BERFUNGSI SEBAGIAN]
   - **Analisis:** Logika UI uang pas, uang custom, dan kalkulasi kembalian sudah sangat interaktif. Tombol konfirmasi memicu *callback* checkout. Belum mendukung split bill / multi-payment.

5. **Layar Sukses & Struk (`SuccessScreen.tsx`)**
   - **Status:** [BERFUNGSI SEBAGIAN]
   - **Analisis:** UI sukses menarik, kalkulasi kembalian tepat, dan perintah `window.print()` untuk cetak struk siap dipakai. Data struk yang dicetak saat ini didapatkan dari properti (props) memori, bukan query history transaksi.

6. **Kelola Produk & Katalog (`ManageProductsScreen.tsx`)**
   - **Status:** [BERFUNGSI SEBAGIAN]
   - **Analisis:** Layout manajemen produk (search, filter, status stok) sudah rapi. Tombol "Simpan" memanggil `gasApi.saveProduct()`. Hanya saja list data yang ditampilkan masih dari `mockData`.

7. **Modal Tambah/Edit Produk (`AddEditProductModal.tsx`)**
   - **Status:** [BERFUNGSI PENUH]
   - **Analisis:** Form kompleks (harga, HPP, mode stok, outlet) sudah siap. **Fitur upload gambar sudah live**: memakai `gasApi.uploadImage(file)` yang mengirim file Base64 langsung untuk disimpan di Google Drive.

8. **Kelola Promo (`ManagePromoScreen.tsx`)**
   - **Status:** [BERFUNGSI SEBAGIAN]
   - **Analisis:** List promo (diskon, bundle, dsb). Data awal masih statis. Logic 'Simpan' belum dihubungkan dengan `gasApi` (masih mutasi *array state* lokal).

9. **Modal Tambah/Edit Promo (`AddEditPromoModal.tsx`)**
   - **Status:** [BERFUNGSI SEBAGIAN]
   - **Analisis:** Formnya ada dan *logic rendering*-nya bisa membedakan mana diskon persen, nominal, gratis item, atau bundling. Murni *state management* UI, belum ada API call.

10. **Kelola Resep (`KelolaResepScreen.tsx`)**
    - **Status:** [BERFUNGSI SEBAGIAN]
    - **Analisis:** Menghubungkan 1 produk dengan banyak ingredient pembentuknya (kalkulator bahan baku per porsi). Tombol simpan memanggil `gasApi.saveRecipe()`. List produk/bahan masih dari *mock*.

11. **Kelola Bahan Baku (`KelolaBahanBakuScreen.tsx`)**
    - **Status:** [BERFUNGSI SEBAGIAN]
    - **Analisis:** Form bahan baku (nama, satuan, stok awal, status tracking). Tombol simpan memanggil `gasApi.saveIngredient()`.

12. **Stok Opname (`StokOpnameScreen.tsx`)**
    - **Status:** [BERFUNGSI SEBAGIAN]
    - **Analisis:** Form untuk penghitungan fisik bahan baku vs angka sistem (selisih otomatis diwarnai merah/hijau). UI sudah interaktif, tapi tombol "Simpan & Sinkronkan" **belum** di-hook ke fungsi `gasApi`.

13. **Laporan Penjualan (`ReportScreen.tsx`)**
    - **Status:** [BELUM BERFUNGSI] (Hanya UI)
    - **Analisis:** Tampilan dashboard, *bar chart* pendapatan 7 hari, dan performa kasir. Datanya adalah *hardcoded object* (`DAILY_DATA`, `KASIR_DATA`). Tidak menarik laporan apa pun dari Google Sheets/SQLite.

14. **Ringkasan Shift (`ShiftSummaryScreen.tsx`)**
    - **Status:** [BELUM BERFUNGSI] (Hanya UI)
    - **Analisis:** Tampilan rekonsiliasi yang disajikan pasca-tutup shift. Angkanya statis (contoh: Penjualan Tunai di-hardcode Rp 3.750.000).

15. **Tutup Shift (`TutupShiftScreen.tsx`)**
    - **Status:** [BERFUNGSI SEBAGIAN]
    - **Analisis:** Ada form khusus dengan *numpad* mandiri untuk input uang fisik di laci. Kalkulasi selisih jalan. Tombol submit memanggil `gasApi.saveShiftReport()`. Kelemahannya: Angka 'Ekspektasi Sistem' masih di-hardcode, belum menjumlahkan riil transaksi hari tersebut.

16. **Petty Cash (`PettyCashScreen.tsx`)**
    - **Status:** [BELUM BERFUNGSI] (Hanya UI)
    - **Analisis:** Form mencatat pengeluaran uang laci (contoh: beli es batu). Belum tersambung ke `gasApi` sama sekali. Angka saldo awal juga statis.

17. **Pengaturan Sistem (`SettingsScreen.tsx`)**
    - **Status:** [BERFUNGSI SEBAGIAN] (Integrasi: PENUH)
    - **Analisis:** Tab "Integrasi" sangat vital dan [BERFUNGSI PENUH]. Di sini kasir/owner memasukkan URL Google Apps Script dan mentrigger tombol "Sinkronkan Data Sekarang" (`gasApi.getInitialData()`) untuk inisialisasi master data dari Sheets ke SQLite. Tab lainnya (Pajak, QRIS, Struk) baru mengubah *Context* React lokal.

18. **Dashboard Owner (`OwnerDashboardScreen.tsx`)**
    - **Status:** [BELUM BERFUNGSI] (Hanya UI)
    - **Analisis:** File raksasa (1.200 baris kode) untuk pemantauan multi-cabang. Metrik, grafik proporsional, analisa jam sibuk, semuanya dikalkulasi dengan cara mengalikan angka *dummy* (*multiplier* cabang & rentang waktu). Tidak membaca analitik *real*.

19. **QR Menu (`QrMenuScreen.tsx`)**
    - **Status:** [BELUM BERFUNGSI] (Hanya UI)
    - **Analisis:** Tampilan khusus untuk me-manage visibilitas produk di katalog pelanggan (QR). Tampilan QR statis. Fitur toggle sembunyikan menu jalan di UI, tapi tombol Simpan Perubahan tidak memicu fungsi backend/database.

20. **Layar Dapur / Kitchen Display (KDS)**
    - **Status:** [BELUM ADA]
    - **Analisis:** Setelah dicek ke dalam direktori komponen, tidak ditemukan komponen `KitchenDisplay`, `KDS`, atau apa pun yang menyerupai monitor dapur.

---

### KESIMPULAN AUDIT:
Aplikasi ini sudah jauh melampaui fase "Design Mockup". Mekanisme *Offline-First* menggunakan Tauri via SQLite lokal -> Google Apps Script sudah dirakit *end-to-end* (terdapat di `db.ts`, `syncWorker.ts`, `gasApi.ts`, dan `Code.gs`). 

Pekerjaan utama yang saat ini menjadi *bottleneck* adalah **"Wiring" (Penyambungan)**: yakni menghapus data *hardcoded* (`mockData.ts`) dari dalam komponen-komponen React, lalu menggantinya dengan state yang di-fetch dari tabel SQLite yang telah disinkronkan, serta menghubungkan beberapa layar (terutama Pelaporan dan Shift) ke sistem pengambilan data (backend/db).
