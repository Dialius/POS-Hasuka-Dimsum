# KLAUSUL SERAH TERIMA (BAST) - HASUKA DIMSUM POS

Dokumen ini merupakan lampiran kesepakatan penyerahan sistem kasir (Point of Sale) Hasuka Dimsum.

## 1. Lingkup Platform & Bebas Biaya Langganan
Sistem ini disepakati dibangun menggunakan arsitektur web modern yang di-*hosting* di atas **Google Apps Script** dan **Google Sheets** (menggunakan ekosistem Google gratis bawaan akun). Hal ini menjamin bahwa Hasuka Dimsum **tidak akan dikenakan biaya langganan bulanan rutin** seperti platform SaaS pada umumnya maupun batasan AppSheet versi berbayar. Sistem 100% milik Hasuka Dimsum.

## 2. Transfer Kepemilikan Penuh (Full Ownership Handover)
Pada saat Berita Acara Serah Terima (BAST) ditandatangani, seluruh hak akses dan kepemilikan aset digital akan diserahkan 100% kepada Pihak Hasuka Dimsum. Aset tersebut mencakup:
- Kepemilikan (Owner access) file **Google Spreadsheet** sebagai *Database*.
- Kepemilikan (Owner access) file **Google Apps Script** sebagai *Backend & Web Hosting*.
- Seluruh baris *source code* (React Web App) yang telah dicompile.

Setelah BAST, Developer tidak memiliki hak untuk menahan akses, mengubah, atau mematikan sistem secara sepihak.

## 3. Garansi Bug & Maintenance (Bug Warranty)
Developer memberikan jaminan **Garansi Perbaikan Bug/Error selama 2 (Dua) Bulan** terhitung sejak tanggal BAST ditandatangani. 
- **Cakupan Garansi**: Memperbaiki fungsi yang rusak, tidak berjalan sesuai kesepakatan awal (PRD), atau *error logic* (seperti stok tidak terpotong benar, layar *blank* putih, dll).
- **Di Luar Garansi**: Penambahan fitur baru, perubahan desain besar, modifikasi struktur *database*, atau *error* yang timbul akibat Pihak Hasuka secara tidak sengaja mengubah/menghapus baris kode Apps Script maupun menghapus kolom/sheet krusial di Google Sheets secara manual.
