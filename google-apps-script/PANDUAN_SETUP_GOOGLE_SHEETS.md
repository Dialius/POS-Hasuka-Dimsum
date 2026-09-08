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

## Langkah 4: Perbarui Deployment (Live ke Cloud Google)
Karena Anda sudah memiliki deployment (seperti di screenshot), Anda tinggal memperbaruinya agar memuat desain terbaru:
1. Di pojok kanan atas editor Apps Script, klik tombol biru **Deploy** > **Manage deployments (Kelola penerapan)**.
2. Klik ikon **Pensil (Edit)** di kanan atas.
3. Pada dropdown **Version (Versi)**, pilih **New version (Versi baru)**.
4. Klik tombol **Deploy**.
5. Salin URL Aplikasi Web Anda:
   `https://script.google.com/macros/s/AKfycbyYRDinLFIMJ_d_DwyFvwNHfF3IjfnfivxMvG4Vh_kZA3U6RGQNMakFYV0H6RFJYRBK/exec`
6. **Buka URL tersebut di tab baru browser atau tablet kasir Anda**:
   🎉 **Seluruh aplikasi POS Kasir Hasuka Dimsum (desain Figma, checkout kasir, kelola resep, stok opname) langsung tampil dan berjalan 100% di dalam ekosistem Google!**

