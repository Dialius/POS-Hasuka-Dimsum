# Panduan Setup Google Sheets & Google Apps Script - Hasuka Dimsum POS

Panduan ini berisi cara menghubungkan aplikasi Web POS React Hasuka Dimsum langsung ke akun Google Sheets Anda sebagai database gratis.

---

## Langkah 1: Buat Google Spreadsheet Baru
1. Buka [Google Sheets](https://sheets.new) di browser Anda.
2. Beri nama spreadsheet Anda, misalnya: `DB_Hasuka_POS`.

---

## Langkah 2: Buka Editor Apps Script & Pasang File
1. Di spreadsheet tersebut, klik menu **Extensions (Ekstensi)** > **Apps Script**.
2. Anda akan diarahkan ke editor script Google.
3. Di panel kiri, pasang 3 file berikut:
   - **File 1 (`Code.gs`)**: Salin seluruh isi dari file lokal:
     [`google-apps-script/Code.gs`](file:///d:/Client-Dimsum/google-apps-script/Code.gs)
   - **File 2 (`SetupSheets.gs`)**: Klik tombol **+** di samping Files > pilih **Script**, beri nama `SetupSheets`. Salin seluruh isi dari:
     [`google-apps-script/SetupSheets.gs`](file:///d:/Client-Dimsum/google-apps-script/SetupSheets.gs)
   - **File 3 (`Index.html` - Seluruh Desain Web POS)**: Klik tombol **+** di samping Files > pilih **HTML**, beri nama `Index`. Salin seluruh isi dari:
     [`google-apps-script/Index.html`](file:///d:/Client-Dimsum/google-apps-script/Index.html)
4. Klik tombol ikon **Save (Simpan / Ctrl+S)**.

---

## Langkah 3: Inisialisasi Database (Satu Kali Saja)
1. Di toolbar atas editor Apps Script, pada dropdown pilihan fungsi (di sebelah tombol Run/Debug), pilih fungsi:
   **`setupHasukaDatabase`**
2. Klik tombol **Run (Jalankan)**.
3. Jika muncul jendela permintaan izin ("Authorization Required"):
   - Klik **Review Permissions** > Pilih akun Google Anda > Klik **Advanced** > Klik **Go to Untitled project (unsafe)** > Klik **Allow**.
4. Tunggu hingga muncul log *"Setup Database Hasuka Dimsum selesai!"*. Tab-tab spreadsheet Anda sekarang sudah siap.

---

## Langkah 4: Terapkan sebagai Web App (Deploy)
1. Di pojok kanan atas editor Apps Script, klik tombol biru **Deploy** > **New deployment** (atau jika sudah pernah deploy, klik **Manage deployments** > ikon Pensil / Edit > pilih **New version**).
2. Pastikan tipe yang dipilih adalah **Web app** (ikon bola dunia).
3. Atur konfigurasi penting berikut:
   - **Execute as (Jalankan sebagai):** `Me (email Google Anda)`
   - **Who has access (Siapa yang memiliki akses):** `Anyone (Siapa saja)`
     > ⚠️ **SANGAT PENTING**: Jangan biarkan bernilai *"Only myself"* (Hanya saya). Jika disetel ke Hanya Saya, Google akan menolak akses dari aplikasi web/kasir dan memunculkan error **"Failed to fetch"** serta **"Maaf, file yang Anda minta tidak ada"**.
4. Klik tombol **Deploy**.
5. Salin **Web app URL** yang berakhiran `/exec` (misal: `https://script.google.com/macros/s/.../exec`).
6. Masuk ke aplikasi POS Kasir Hasuka Dimsum:
   - Buka menu **Pengaturan** (ikon gear) > tab **Integrasi**.
   - Tempel URL tersebut ke kolom **GOOGLE APPS SCRIPT WEB APP URL**.
   - Klik tombol **Simpan URL**, lalu klik **Tes Koneksi**.
   - Indikator akan berubah menjadi hijau **"Terkonfigurasi"** dan muncul notifikasi *"Koneksi Berhasil!"*.
7. Sekarang sinkronisasi transaksi, menu produk, dan stok bahan baku sudah terhubung secara real-time ke Google Spreadsheet Anda!

