# POS Hasuka Dimsum

Selamat datang di repositori Point of Sales (POS) khusus untuk Hasuka Dimsum! Aplikasi ini dirancang dari nol untuk menjawab kebutuhan kasir dan owner, dengan fokus utama pada kecepatan operasional, keandalan saat internet mati, dan kemudahan rekap data di akhir hari.

## Konsep Utama: Cepat di Kasir, Aman di Cloud
Pernah ngalamin kasir lemot karena internet putus? Di POS Hasuka Dimsum, hal itu tidak akan terjadi. Kami menggunakan arsitektur **Offline-First**. 

Saat kasir menekan tombol "Bayar", data langsung disimpan ke database lokal (SQLite) di laptop dalam hitungan milidetik. Kasir bisa langsung melayani pelanggan berikutnya. Di balik layar, ada sistem pintar yang akan menunggu sampai internet lancar, lalu mengirim semua antrean transaksi tersebut (secara otomatis) ke Google Sheets milik Owner. 

Dengan cara ini, kasir tidak pernah terhambat, dan Owner tetap bisa melihat laporan keuangan secara akurat dari mana saja.

## Fitur Unggulan

* **Transaksi Kasir Super Cepat:** Tampilan bersih, mendukung pembayaran uang pas atau kalkulasi kembalian otomatis. Selesai bayar, struk langsung siap dicetak.
* **Manajemen Shift Kasir:** Fitur lengkap untuk buka shift, rekap uang di laci, hingga pencatatan selisih kas fisik dibandingkan sistem saat tutup shift.
* **Kelola Produk & Resep:** Tidak hanya mengatur harga jual produk jadi, tapi juga mengatur resep bahan baku pembentuknya (contoh: 1 porsi dimsum memotong stok 4 pcs siomay dan 1 bungkus saus).
* **Stok Opname & Bahan Baku:** Memudahkan tim untuk mengecek kesesuaian stok fisik bahan baku dengan angka di sistem, lengkap dengan peringatan visual jika ada selisih.
* **Dashboard Owner:** Laporan omset harian, bulanan, dan performa tiap cabang yang tersinkronisasi rapi ke ekosistem Google.
* **Penyimpanan Foto di Google Drive:** Upload foto produk dari aplikasi kasir, dan file gambar akan otomatis tersimpan dan terorganisir di Google Drive.

## Teknologi yang Digunakan

Aplikasi ini dibangun menggunakan kombinasi teknologi modern:

* **Antarmuka (Frontend):** React, TypeScript, dan Vite untuk UI yang responsif dan gesit, dibalut dengan Tailwind CSS agar tampilannya elegan dan memanjakan mata.
* **Aplikasi Desktop:** Tauri (berbasis bahasa Rust). Alat ini menyulap web menjadi aplikasi desktop Windows asli, lengkap dengan akses ke database lokal (SQLite) tanpa membuat laptop menjadi lambat.
* **Backend & Cloud:** Google Apps Script. Kami mengubah Google Sheets menjadi database serverless yang gratis, aman, dan sangat familiar bagi owner untuk memantau bisnisnya.

## Struktur Proyek

Jika Anda ingin melihat jeroan aplikasi ini, kodenya dibagi menjadi dua markas utama:
1. `pos-kasir/`: Tempat berkumpulnya semua kode antarmuka React dan konfigurasi desktop Tauri.
2. `google-apps-script/`: Berisi kode script backend yang bertugas mengelola lalu lintas data ke Google Sheets.

Untuk melihat peta jalan pengembangan, daftar halaman, atau cara kerja teknis yang lebih dalam, silakan mampir ke dokumen [PROJECT-STRUCTURE.md](./PROJECT-STRUCTURE.md).
