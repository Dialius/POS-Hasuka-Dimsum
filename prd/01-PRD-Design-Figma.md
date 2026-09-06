# PRD-01 — Design (Figma)
**Proyek:** POS Kasir untuk Hasuka Dimsum | **Status:** v1.1 — REBUILD, prioritas tablet & HP, palet warna dari logo
**Induk:** 00-PRD-Overview.md
**Output:** File Figma (design system + hi-fi screens + prototype flow)

---

> PENTING: dokumen ini menggantikan versi sebelumnya. Versi lama disusun dengan asumsi tablet & desktop sebagai form factor utama, dan sejumlah fitur (Owner Dashboard, Stok Opname, Petty Cash, Pengaturan Pajak, Manajemen Promo, QRIS Statis) belum ada — ditambahkan belakangan sebagai catatan tempelan. Versi ini menyatukan semuanya jadi satu spec utuh sejak awal, dengan device yang sudah dikonfirmasi client: **tablet & HP**.
>
> JANGAN AI SLOP. Baca bagian 2 sebelum membuka Figma. Ini bukan checklist opsional — desain yang lolos "keliatan bagus tapi generic" akan ditolak di review.
> Skill: baca skill `frontend-design` dulu (prinsipnya berlaku juga untuk desain di Figma, bukan cuma kode) sebelum mulai eksplorasi visual.

---

## 1. Brief Singkat

Desain UI untuk aplikasi kasir yang dipakai di **tablet dan HP** sebagai form factor utama (dioperasikan berdiri di meja kasir, seringkali buru-buru), dengan **desktop sebagai form factor sekunder** (dipakai untuk back-office/laporan, bukan buat transaksi). Ada juga satu halaman customer-facing (QR Menu) yang dibuka dari HP pelanggan sendiri — mobile-first juga, tapi terpisah dari alur kasir. Prioritas desain: kecepatan baca angka, target sentuh besar, status koneksi/offline yang selalu terlihat jelas.

## 2. Prinsip Anti-AI-Slop (wajib diikuti)

Ciri-ciri "AI slop" yang **dilarang**: gradient ungu ke biru sebagai aksen/background, font default Inter/Arial tanpa alasan, semua card pakai border abu-abu 1px dan shadow yang sama persis, layout "SaaS card kit" (konten dipotong jadi card seragam tanpa hierarki), eyebrow label ALL CAPS di atas tiap heading atau dekorasi yang tidak menyampaikan informasi apa-apa.

Yang **wajib** dilakukan sebagai gantinya:
1. **Tipografi berkarakter.** Pilih 1–2 typeface yang punya kepribadian, cocok dengan brand Hasuka Dimsum — bukan default. Palet warna sudah ada (diambil dari logo, lihat bagian 4) — tinggal cari typeface yang match dengan nuansa warm/appetizing dari brand ini, bukan tebakan asal.
2. **Warna semantik, bukan dekoratif.** Warna sukses/warning/error/status-offline harus konsisten dan berarti sesuatu.
3. **Hierarki shadow dan elevasi yang jelas.** Elemen beda "lapisan" (mis. modal pembayaran vs card produk biasa) harus beda level shadow/elevasi.
4. **Grid spacing konsisten** — kelipatan 8px (4px untuk half-step). Tidak ada angka spacing acak.
5. **Ground di subject matter POS**: angka besar dan mudah dibaca dari jarak, target sentuh minimum sekitar 44x44px (dipakai jari di tablet/HP), status "Online/Offline" selalu terlihat tanpa perlu dicari.

## 3. Prinsip Responsive dan Breakpoint

Client sudah konfirmasi: device kasir di outlet adalah **tablet dan HP**, bukan desktop. Jadi urutan prioritas desain berubah dari versi sebelumnya:

| Breakpoint | Device target | Prioritas | Catatan layout |
|---|---|---|---|
| **768–1024px (landscape)** | Tablet | **Utama** | Layout split panel: grid produk + cart panel side-by-side |
| **< 480px (portrait)** | HP | **Utama** | Layout stacked: cart jadi bottom sheet, tombol aksi jadi floating bar bawah |
| **480–767px** | Tablet portrait / HP besar | Utama (perlakuan sama seperti HP, diperbesar) | Sama pola dengan HP |
| **≥ 1280px** | Desktop | Sekunder — back-office | Dipakai untuk Owner Dashboard, laporan, dan pengaturan dari layar besar — bukan untuk transaksi kasir |

**Urutan kerja desain: tablet dan HP dulu sampai matang, baru adaptasi ke desktop** (kebalikan dari versi sebelumnya). Pengecualian: halaman **QR Menu** (bagian 5.15) dan **Owner Dashboard** (bagian 5.14) memang murni web dan dibuka dari device pelanggan/owner masing-masing — QR Menu mobile-first, Owner Dashboard didesain nyaman dari HP maupun desktop karena owner bisa buka dari mana saja.

## 4. Design System (deliverable wajib di Figma)

Buat 1 page khusus "Design System" berisi:
- **Color tokens** (diambil dari logo Hasuka Dimsum via color extraction, lihat tabel di bawah)
- **Type scale**: heading (angka besar/total harga), body, label — dengan typeface terpilih
- **Spacing scale**: 4/8/16/24/32/48px
- **Component library**: button (primary/secondary/danger/disabled), numeric keypad, product card, cart line item, badge status koneksi, badge promo, modal pembayaran, toast/notification
- **States**: setiap komponen interaktif harus punya state default/hover/active/disabled/loading
- **Responsive variants**: tiap komponen kunci (product grid, cart panel, StatusBar) digambar dalam 2 varian — tablet dan HP — supaya frontend tidak menebak sendiri perilaku responsive-nya

| Token | Hex | Peran | Sumber dari logo |
|---|---|---|---|
| `color-primary` | #8B4A1E | Tombol & aksi utama (mis. "Bayar") | Coklat steamer bambu |
| `color-brand` / `color-danger` | #B60000 | Identitas brand (header, aksen) DAN void/refund/error | Merah background logo |
| `color-success` | #5B8A2E | Konfirmasi, status aman | Hijau cilantro |
| `color-warning` / `color-offline` | #C9A227 | Banner offline, alert stok menipis | Kuning kulit dimsum |
| `color-accent-promo` | #DF690B | Badge promo/diskon | Oranye garnish |
| `color-border` | #C49A62 | Border, divider (ganti abu-abu generic) | Tan pita logo |
| `color-surface` | #F3E7CE | Background card | Krem pita logo |
| `color-text` | #2B1810 | Teks utama (ganti hitam pekat generic) | Outline gelap logo |

Catatan: `color-primary` sengaja BUKAN merah meskipun itu warna dominan logo — merah dipakai untuk brand/danger supaya tidak ambigu dengan tombol aksi utama (konvensi UI: merah = bahaya/berhenti). Nilai hex di atas adalah estimasi dari ekstraksi warna otomatis — cek ulang dengan eyedropper langsung di file logo saat kerja di Figma untuk presisi final.

## 5. Detail Desain per Halaman

Setiap halaman berisi: tujuan, layout tablet (utama), layout HP (utama, kalau beda dari tablet), komponen kunci, dan state penting.

### 5.1 Login/PIN Kasir
- **Tujuan**: ganti kasir antar-shift secepat mungkin, tanpa ketik email/password tiap kali.
- **Layout tablet**: card terpusat di tengah layar, logo/nama Hasuka Dimsum di atas card, daftar avatar/nama kasir yang bisa dipilih dulu, lalu numpad PIN besar (4–6 digit) di bawahnya.
- **Layout HP**: card full width dengan padding, numpad full width juga — pola sama, cuma lebih ramping.
- **Komponen kunci**: numpad, indikator PIN terisi (dot), tombol "Kasir lain"/logout.
- **State**: PIN salah → shake halus + pesan error singkat inline; loading saat verifikasi lokal (harus instan karena PIN dicek di local DB).

### 5.2 Buka Shift (Opening Cash)
- **Tujuan**: wajib input kas awal sebelum transaksi pertama hari itu.
- **Layout**: form 1 kolom terpusat di tablet maupun HP — field nominal besar dengan numpad, ringkasan kecil (nama kasir, outlet, waktu), catatan opsional.
- **Komponen kunci**: input nominal, tombol konfirmasi besar (full width).
- **State**: kalau shift sebelumnya di terminal ini belum ditutup → tampilkan ringkasan shift lama dulu sebelum bisa lanjut buka shift baru.

### 5.3 Kasir/Checkout (halaman utama — paling penting)
- **Tujuan**: tempat kasir menghabiskan sebagian besar waktu kerja; paling dioptimasi.
- **Layout tablet**: split 2 panel. Kiri/tengah (sekitar 65% lebar): search bar + scan barcode di atas, chip kategori horizontal-scroll di bawahnya, grid card produk mengisi sisa area. Kanan (sekitar 35% lebar, sticky): cart panel — daftar item dengan qty stepper dan tombol hapus, badge kecil kalau item sedang dapat promo, ringkasan subtotal/promo/diskon/pajak/total di bagian bawah cart, tombol "Bayar" besar paling bawah.
- **Layout HP**: satu kolom. Grid produk 2 kolom penuh layar. Cart jadi **bottom sheet** collapsed secara default (menampilkan ringkasan total + tombol bayar sebagai floating bar bawah), bisa di-drag up untuk expand lihat detail item.
- **StatusBar**: strip tipis di paling atas, selalu terlihat di tablet maupun HP — status online/offline + jumlah transaksi pending sync.
- **Komponen kunci**: search/scan input, chip kategori, product card (dengan badge promo kalau ada), cart line item, breakdown total (subtotal, promo, diskon manual, pajak, total).
- **State**: cart kosong (empty state ilustratif), produk stok habis (badge "Habis", card disabled), mode offline (banner berubah warna di StatusBar, lihat bagian 5.13).

### 5.4 Pilih Metode Bayar
- **Tujuan**: pilih tunai/QRIS/kartu/split dengan jelas mana yang butuh internet.
- **Layout**: modal/sheet muncul dari kanan (tablet) atau bawah (HP) — bukan navigate ke halaman baru. Pilihan metode sebagai card besar dengan ikon (Tunai, QRIS, Kartu, Split). Kalau sedang offline, metode yang butuh internet diberi badge "Butuh internet" dan disabled dengan tooltip yang mengarahkan ke QRIS Statis.
- **Sub-state Tunai**: numpad + tombol nominal cepat (uang pas, 50rb, 100rb, dst), kalkulasi kembalian otomatis ditampilkan besar.
- **Sub-state QRIS Dinamis**: kode QR besar di tengah (di-generate via payment gateway, nominal sudah ter-embed), timer countdown, status "menunggu pembayaran..." dengan animasi halus.
- **Sub-state QRIS Statis**: tanpa timer, tampilkan gambar QR yang di-upload owner (dari Pengaturan) + total belanja besar (untuk pelanggan ketik manual), dan tombol "Sudah Dibayar" untuk konfirmasi manual kasir setelah verifikasi.
- **State**: timeout QRIS Dinamis → tawarkan ulangi/ganti metode.

### 5.5 Konfirmasi dan Struk
- **Tujuan**: preview transaksi sebelum kirim/cetak struk.
- **Layout**: preview struk dalam bentuk visual proporsional (lebar 80mm) di tengah layar, 3 tombol aksi jelas di bawah dengan ikon berbeda: **Cetak** (printer), **Kirim WA**, **Kirim Email** — plus tombol "Lewati" kecil. Kalau pilih kirim digital, muncul input nomor HP/email.
- **State**: printer tidak terhubung → sembunyikan/nonaktifkan tombol cetak, arahkan ke opsi digital; sukses kirim → checkmark animasi ringan.

### 5.6 Manajemen Produk dan Kategori
- **Layout tablet**: table/list produk di kiri (search, filter kategori, sort), panel form edit di kanan (muncul saat produk dipilih atau tombol "+ Tambah Produk" ditekan).
- **Layout HP**: list full width; tap produk membuka halaman form terpisah.
- **Komponen kunci**: upload gambar produk, field harga jual dan harga modal (hitung margin otomatis), dropdown kategori, toggle "kena pajak (PPN)", input stok dan ambang minimum stok (untuk alert stok menipis).

### 5.7 Manajemen Promo
- **Tujuan**: owner mengatur diskon/promo yang berlaku otomatis saat checkout, tanpa perlu kasir ingat manual.
- **Layout tablet**: pola sama seperti Manajemen Produk — list promo di kiri (nama, cakupan, status aktif/nonaktif), form edit di kanan.
- **Layout HP**: list full width, tap untuk buka halaman form terpisah.
- **Komponen kunci**: input nama promo, pilihan cakupan (semua produk/kategori tertentu/produk tertentu — kalau kategori/produk, tampilkan picker multi-select), pilihan tipe diskon (persentase/nominal) dengan input nilai, date range picker untuk periode aktif (opsional, kosong berarti aktif terus), toggle aktif/nonaktif.
- **State**: promo yang periodenya sudah lewat ditandai "Kedaluwarsa" di list, bukan dihapus otomatis.

### 5.8 Stok Opname
- **Tujuan**: sesi hitung fisik stok, dibandingkan ke stok sistem.
- **Layout tablet dan HP**: daftar produk (bisa difilter per kategori) dengan 2 kolom angka: "Stok Sistem" (read-only) dan "Hitung Fisik" (input manual per produk). Selisih dihitung otomatis di kolom ketiga, di-highlight warna kalau ada beda (hijau kalau pas, kuning/merah kalau selisih).
- **Komponen kunci**: search produk, input angka per baris, tombol "Selesaikan Sesi" di akhir yang memicu penyesuaian stok sistem.
- **State**: sesi yang belum selesai (in progress) bisa dilanjutkan lagi, bukan hilang kalau aplikasi ditutup di tengah jalan.

### 5.9 Laporan Penjualan
- **Layout**: filter periode di atas sebagai chip (Hari ini/Minggu ini/Bulan ini/Custom range), beberapa card ringkasan angka besar (total penjualan, jumlah transaksi, rata-rata per transaksi, rekap cash vs QRIS) di baris atas, grafik sederhana di bawahnya, tabel produk terlaris di paling bawah.
- **Komponen kunci**: tombol export (Excel/CSV, plus tombol "Sync ke Google Sheets" kalau sudah terhubung).
- **Layout HP**: card ringkasan jadi horizontal-scroll, grafik dan tabel tetap full width stacked vertikal.

### 5.10 Tutup Shift (Rekonsiliasi Kas)
- **Layout**: ringkasan angka (kas awal, total tunai masuk dari penjualan, total refund tunai, total petty cash keluar, kas seharusnya menurut sistem), lalu input kas fisik hasil hitung manual — selisih dihitung otomatis dan di-highlight warna.
- **Komponen kunci**: ringkasan riwayat petty cash hari itu ditampilkan di sini sebagai bagian dari perhitungan, bukan cuma angka total.
- **State**: selisih di atas ambang tertentu → wajib isi catatan alasan sebelum bisa submit tutup shift.

### 5.11 Petty Cash — Catat Pengeluaran
- **Tujuan**: catat pengeluaran kas kecil di luar transaksi penjualan (misal beli galon, bensin, keperluan dadakan).
- **Layout**: form ringkas — bisa diakses lewat tombol kecil di halaman Kasir/Checkout atau langsung dari Tutup Shift. Input nominal (numpad), dropdown/input kategori, keterangan singkat, opsional foto struk.
- **Komponen kunci**: riwayat pengeluaran hari itu ditampilkan sebagai list singkat di bawah form, supaya kasir bisa cek yang sudah dicatat.

### 5.12 Pengaturan
- **Layout tablet**: sidebar list menu pengaturan di kiri (Printer, User & Role, Outlet, **Pajak**, **QRIS**, Integrasi Google Sheets) + panel form detail di kanan.
- **Layout HP**: jadi accordion/list bertingkat (tap kategori → masuk sub-halaman).
- **Sub-halaman Pajak**: toggle on/off PPN level outlet + input rate (%, default 11) + preview simulasi hitung ke satu contoh harga, supaya owner langsung lihat efeknya sebelum simpan.
- **Sub-halaman QRIS**: pilihan mode Statis/Dinamis, kalau Statis ada tombol upload gambar QR milik toko.
- **Komponen kunci lain**: test print, konfigurasi koneksi printer (input IP address untuk printer LAN), daftar user & role, tombol hubungkan Google Sheets (toggle + tombol "Connect" via OAuth Google).

### 5.13 Banner/Indikator Mode Offline (elemen global, bukan halaman sendiri)
- Strip tipis di bawah StatusBar, warna semantik oranye/kuning (bukan merah — ini status normal yang di-handle, bukan error fatal), teks singkat "Mode Offline — X transaksi menunggu sinkron", bisa di-tap untuk expand detail antrian sync. Muncul di semua halaman aplikasi kasir (tablet maupun HP) saat koneksi terputus.

### 5.14 Owner Dashboard (web, terpisah dari app kasir)
- **Tujuan**: landing page ringkasan kondisi toko begitu owner buka dari device manapun.
- **Layout**: kombinasi card ringkasan (penjualan hari ini/minggu/bulan + komparasi periode sebelumnya, alert stok menipis, ringkasan shift terakhir, produk terlaris, performa promo aktif) di bagian atas, shortcut ke Laporan Penjualan detail, Manajemen Produk, dan Pengaturan di bawahnya.
- **Catatan desain**: halaman ini kebanyakan reuse komponen yang sudah ada di design system (card angka, grafik, tabel dari Laporan Penjualan) — disusun ulang jadi satu halaman ringkasan, bukan komponen visual baru dari nol. Didesain nyaman dibuka dari HP maupun desktop, karena owner bisa akses dari device manapun.

### 5.15 QR Menu — Customer-facing (halaman terpisah, publik)
- **Tujuan**: pelanggan scan QR di meja/etalase, lihat menu tanpa perlu ketemu kasir dulu.
- Halaman web terpisah (bukan bagian dari app kasir), diakses lewat browser HP pelanggan sendiri — **mobile-first**.
- **Layout**: header dengan nama dan logo Hasuka Dimsum, search/filter kategori (sticky saat scroll), grid/list produk dengan foto besar, tap produk untuk lihat detail (deskripsi, harga, varian kalau ada). Kalau ada promo aktif, tampilkan harga asli dicoret + harga promo.
- **MVP**: read-only — CTA di tiap produk bersifat informatif, bukan "tambah ke keranjang".
- **Catatan untuk kemungkinan fase berikutnya** (self-order, tergantung konfirmasi dine-in/bawa-pulang — lihat PRD-00 bagian 11): kalau nanti di-upgrade, tambahkan keranjang dan checkout di layout yang sama, siapkan spacing yang cukup dari awal untuk elemen ini.

## 6. Struktur File Figma

- **Page: Design System** (bagian 4)
- **Page: Screens — Tablet** (halaman 5.1–5.13, hi-fi, breakpoint utama)
- **Page: Screens — HP** (halaman 5.1–5.13, adaptasi breakpoint utama kedua)
- **Page: Screens — Desktop (Back-office)** (adaptasi sekunder untuk Owner Dashboard, Laporan, Pengaturan — bukan untuk transaksi kasir)
- **Page: Owner Dashboard** (bagian 5.14, didesain untuk HP dan desktop)
- **Page: QR Menu** (bagian 5.15, mobile-first)
- **Page: Prototype** (flow interaktif: buka shift, transaksi, bayar, cetak/kirim struk, tutup shift, termasuk simulasi transisi ke mode offline)
- **Page: Redlines/Handoff** (spacing dan spec untuk frontend)

## 7. Catatan Rebuild

Ini rebuild penuh dari versi sebelumnya — bukan revisi tempelan. File Figma lama (kalau sudah ada progress) dijadikan referensi historis, bukan basis lanjutan, karena asumsi device dan daftar fiturnya sudah berubah cukup banyak. Simpan sebagai versi baru (`v1.0`) dengan histori tetap tersimpan, supaya keputusan desain sebelumnya masih bisa dilacak kalau perlu.

## 8. Definition of Done

- [ ] Semua halaman di bagian 5 ada dalam versi hi-fi, untuk breakpoint tablet DAN HP (dua-duanya prioritas utama)
- [ ] Design system lengkap dengan token dan component states
- [ ] Lolos self-review checklist anti-slop di bagian 2
- [ ] Owner Dashboard dan QR Menu didesain terpisah dan diuji tampilannya di device sungguhan
- [ ] Prototype flow bisa diklik end-to-end untuk demo ke client
