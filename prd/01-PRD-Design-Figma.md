# PRD-01 — Design (Figma)
**Proyek:** POS Kasir | **Status:** Draft v0.2 | **Induk:** 00-PRD-Overview.md
**Output:** File Figma (design system + hi-fi screens + prototype flow)

---

> ⚠️ **JANGAN AI SLOP.** Baca §2 sebelum membuka Figma. Ini bukan checklist opsional — desain yang lolos "keliatan bagus tapi generic" akan ditolak di review.
> **Skill:** baca `frontend-design` SKILL.md dulu (prinsipnya berlaku juga untuk desain di Figma, bukan cuma kode) sebelum mulai eksplorasi visual.

---

## 1. Brief Singkat

Desain UI untuk aplikasi kasir yang dipakai di **tablet/desktop touchscreen** sebagai form factor utama (dioperasikan berdiri di meja kasir, seringkali buru-buru), dengan **HP sebagai form factor sekunder** (owner cek laporan, atau kasir darurat) — dan satu halaman customer-facing (QR Menu) yang sebaliknya **mobile-first** karena dibuka dari HP pelanggan sendiri. Prioritas: kecepatan baca angka, target sentuh besar, status koneksi/offline yang selalu terlihat jelas.

## 2. Prinsip Anti-AI-Slop (wajib diikuti)

Ciri-ciri "AI slop" yang **dilarang**: gradient ungu→biru sebagai aksen/background, font default Inter/Arial tanpa alasan, semua card pakai border abu-abu 1px + shadow yang sama persis, layout "SaaS card kit" (konten dipotong jadi card seragam tanpa hierarki), eyebrow label ALL CAPS di atas tiap heading atau dekorasi yang tidak menyampaikan informasi apa-apa.

Yang **wajib** dilakukan sebagai gantinya:
1. **Tipografi berkarakter.** Pilih 1–2 typeface yang punya kepribadian, cocok dengan brand/nama toko client — bukan default. Kalau client belum punya brand, ajukan proposal palet + tipografi sebagai bagian dari deliverable, bukan tebakan asal.
2. **Warna semantik, bukan dekoratif.** Warna sukses/warning/error/status-offline harus konsisten dan berarti sesuatu.
3. **Hierarki shadow & elevasi yang jelas.** Elemen beda "lapisan" (mis. modal pembayaran vs card produk biasa) harus beda level shadow/elevasi.
4. **Grid spacing konsisten** — kelipatan 8px (4px untuk half-step). Tidak ada angka spacing acak.
5. **Ground di subject matter POS**: angka besar & mudah dibaca dari jarak, target sentuh minimum ~44×44px (dipakai jari di tablet), status "Online/Offline" selalu visible tanpa perlu dicari.

## 3. Prinsip Responsive & Breakpoint

| Breakpoint | Device target | Prioritas | Catatan layout |
|---|---|---|---|
| **≥1280px** | Desktop | **Utama** | Layout multi-panel penuh (grid produk + cart panel side-by-side) |
| **768–1279px** | Tablet (landscape, form factor utama kasir) | **Utama** | Layout sama seperti desktop tapi panel lebih ringkas; ini yang didesain & dites duluan |
| **480–767px** | Tablet portrait / HP besar | Sekunder | Cart panel berubah jadi bottom sheet yang bisa di-expand, bukan side panel |
| **<480px** | HP | Sekunder | Single column penuh, navigasi jadi bottom tab/hamburger, aksi utama jadi floating bar bawah |

**Urutan kerja desain: desain tablet/desktop dulu sampai matang, baru adaptasi ke breakpoint HP** — bukan sebaliknya (bukan "mobile-first" generic, karena use-case utama produk ini justru tablet/desktop). Pengecualian: halaman **QR Menu** (§5.11) didesain mobile-first karena memang dibuka dari HP pelanggan.

## 4. Design System (deliverable wajib di Figma)

Buat 1 page khusus "Design System" berisi:
- **Color tokens**: 4–6 warna dasar bernama semantik (`color-primary`, `color-success`, `color-danger`, `color-offline`, bukan `gradient-start/end`)
- **Type scale**: heading (angka besar/total harga), body, label — dengan typeface terpilih
- **Spacing scale**: 4/8/16/24/32/48px
- **Component library**: button (primary/secondary/danger/disabled), numeric keypad, product card, cart line item, badge status koneksi, modal pembayaran, toast/notification
- **States**: setiap komponen interaktif harus punya state default/hover/active/disabled/loading
- **Responsive variants**: tiap komponen kunci (product grid, cart panel, StatusBar) digambar dalam 2 varian — tablet/desktop dan HP — supaya frontend tidak menebak sendiri perilaku responsive-nya

## 5. Detail Desain per Halaman

> Setiap halaman di bawah berisi: tujuan, layout tablet/desktop (utama), adaptasi HP, komponen kunci, dan state penting. Ini level detail minimum sebelum mulai hi-fi di Figma — kalau ada keputusan desain baru saat proses, update bagian ini juga supaya PRD tetap jadi sumber kebenaran.

### 5.1 Login / PIN Kasir
- **Tujuan**: ganti kasir antar-shift secepat mungkin, tanpa ketik email/password tiap kali.
- **Layout tablet/desktop**: card terpusat di tengah layar (bukan full-bleed form), logo/nama toko di atas card, daftar avatar/nama kasir yang bisa dipilih dulu (opsional, lebih cepat dari ketik username), lalu numpad PIN besar (4–6 digit) di bawahnya.
- **Adaptasi HP**: card jadi full width dengan padding, numpad full width juga.
- **Komponen kunci**: numpad, indikator PIN terisi (dot), tombol "Kasir lain"/logout.
- **State**: PIN salah → shake halus + pesan error singkat inline (bukan alert box mengganggu); loading saat verifikasi lokal (harus instan karena PIN dicek di local DB, bukan ke server).

### 5.2 Buka Shift (Opening Cash)
- **Tujuan**: wajib input kas awal sebelum transaksi pertama hari itu.
- **Layout**: form 1 kolom terpusat — field nominal besar dengan numpad, ringkasan kecil (nama kasir, outlet, waktu), catatan opsional.
- **Komponen kunci**: input nominal, tombol konfirmasi besar (full width).
- **State**: kalau shift kasir sebelumnya di terminal ini belum ditutup → tampilkan warning block dulu (ringkasan shift lama) sebelum bisa lanjut buka shift baru.

### 5.3 Kasir / Checkout (halaman utama — paling penting)
- **Tujuan**: tempat kasir menghabiskan ±90% waktu kerja; harus paling dioptimasi.
- **Layout tablet/desktop**: split 2 panel. Kiri/tengah (~65% lebar): search bar + scan barcode di atas, chip kategori horizontal-scroll di bawahnya, grid card produk (gambar, nama, harga — tap untuk add to cart) mengisi sisa area. Kanan (~35% lebar, sticky): cart panel — daftar item dengan qty stepper & tombol hapus, ringkasan subtotal/diskon/pajak/total di bagian bawah cart, tombol "Bayar" besar (primary, full width panel) paling bawah.
- **StatusBar**: strip tipis nempel di paling atas, selalu visible di semua state — menampilkan status online/offline + jumlah transaksi pending sync (lihat PRD-04).
- **Adaptasi HP**: cart panel berubah jadi **bottom sheet** yang collapsed secara default (menampilkan ringkasan total + tombol bayar sebagai floating bar bawah), bisa di-drag up untuk expand lihat detail item. Grid produk full width, 2 kolom.
- **Komponen kunci**: search/scan input, chip kategori, product card, cart line item, numeric badge jumlah item di cart (saat collapsed di HP).
- **State**: cart kosong (empty state ilustratif — bukan generic "No items"), produk stok habis (badge "Habis" di card, card jadi disabled/dim, tidak bisa ditambah ke cart), mode offline (banner status berubah warna di StatusBar, lihat §5.10).

### 5.4 Pilih Metode Pembayaran
- **Tujuan**: pilih tunai/QRIS/kartu/split dengan jelas mana yang butuh internet.
- **Layout**: modal/sheet muncul dari kanan (desktop/tablet) atau bawah (HP) — bukan navigate ke halaman baru, supaya cepat. Pilihan metode sebagai card besar dengan ikon (Tunai, QRIS, Kartu, Split). Kalau sedang offline, metode yang butuh internet (QRIS dinamis, kartu via gateway) diberi badge kecil "Butuh internet" dan disabled dengan tooltip yang mengarahkan ke QRIS statis manual.
- **Sub-state Tunai**: numpad + tombol nominal cepat (uang pas, 50rb, 100rb, dst), kalkulasi kembalian otomatis ditampilkan besar begitu nominal cukup.
- **Sub-state QRIS**: kode QR besar di tengah, timer countdown, status "menunggu pembayaran..." dengan animasi halus (bukan spinner generic tanpa konteks).
- **State**: timeout QRIS → tawarkan ulangi/ganti metode, bukan dead-end.

### 5.5 Konfirmasi & Struk
- **Tujuan**: preview transaksi sebelum kirim/cetak struk.
- **Layout**: preview struk dalam bentuk visual proporsional (lebar 80mm) di tengah layar, 3 tombol aksi jelas di bawah dengan ikon berbeda: **Cetak** (printer), **Kirim WA**, **Kirim Email** — plus tombol "Lewati" kecil. Kalau pilih kirim digital, muncul input nomor HP/email (dengan opsi pilih dari data pelanggan tersimpan kalau ada).
- **State**: printer tidak terhubung → sembunyikan/nonaktifkan tombol cetak dengan pesan kecil, arahkan ke opsi digital; sukses kirim → checkmark animasi ringan (bukan modal besar mengganggu).

### 5.6 Manajemen Produk & Kategori
- **Layout tablet/desktop**: table/list produk di kiri (dengan search, filter kategori, sort), panel form edit di kanan (muncul saat produk dipilih atau tombol "+ Tambah Produk" ditekan) — jadi tidak perlu pindah halaman untuk edit.
- **Adaptasi HP**: list full width; tap produk membuka halaman form terpisah (bukan panel samping, karena ruang terlalu sempit).
- **Komponen kunci**: upload gambar produk, field harga jual & harga modal (untuk hitung margin otomatis), dropdown kategori (+ opsi buat kategori baru inline), toggle "kena pajak (PPN)", input stok & ambang minimum stok (untuk alert stok menipis).

### 5.7 Laporan Penjualan
- **Layout**: filter periode di atas sebagai chip (Hari ini / Minggu ini / Bulan ini / Custom range), beberapa card ringkasan angka besar (total penjualan, jumlah transaksi, rata-rata per transaksi) di baris atas, grafik sederhana (line/bar) di bawahnya, tabel produk terlaris di paling bawah.
- **Komponen kunci**: tombol export (Excel/CSV, + tombol "Sync ke Google Sheets" kalau sudah terhubung — lihat PRD-07).
- **Adaptasi HP**: card ringkasan jadi horizontal-scroll, grafik & tabel tetap full width stacked vertikal.

### 5.8 Tutup Shift (Rekonsiliasi Kas)
- **Layout**: ringkasan angka (kas awal, total tunai masuk, total tunai keluar/refund, kas seharusnya menurut sistem), lalu input kas fisik hasil hitung manual → selisih dihitung otomatis dan di-highlight warna (hijau = pas, merah = ada selisih).
- **State**: selisih di atas ambang tertentu → wajib isi catatan alasan sebelum bisa submit tutup shift.

### 5.9 Pengaturan
- **Layout tablet/desktop**: sidebar list menu pengaturan di kiri (Printer, User & Role, Outlet, Integrasi) + panel form detail di kanan.
- **Adaptasi HP**: jadi accordion/list bertingkat (tap kategori → masuk sub-halaman).
- **Komponen kunci**: test print, konfigurasi koneksi printer (IP address untuk printer LAN — lihat PRD-02 §5), daftar user & role, tombol hubungkan Google Sheets (toggle + tombol "Connect" via OAuth Google).

### 5.10 Banner/Indikator Mode Offline (elemen global, bukan halaman sendiri)
- Strip tipis di bawah StatusBar, warna semantik oranye/kuning (bukan merah — ini status normal yang di-handle, bukan error fatal), teks singkat "Mode Offline — X transaksi menunggu sinkron", bisa di-tap untuk expand detail antrian sync. Muncul di semua halaman aplikasi kasir saat koneksi terputus.

### 5.11 QR Menu — Customer-facing (halaman terpisah, publik)
- **Tujuan**: pelanggan scan QR di meja/etalase, lihat menu tanpa perlu ketemu kasir dulu. Detail fitur & arsitektur lengkap di **PRD-07**.
- Ini **halaman web terpisah** (bukan bagian dari app kasir), diakses lewat browser HP pelanggan sendiri — didesain **mobile-first**, kebalikan dari halaman lain di dokumen ini.
- **Layout**: header dengan nama & logo toko, search/filter kategori (sticky saat scroll), grid/list produk dengan foto besar, tap produk untuk lihat detail (deskripsi, harga, varian kalau ada).
- **MVP**: read-only — CTA di tiap produk bersifat informatif saja, bukan "tambah ke keranjang".
- **Catatan desain untuk fase 2** (self-order): kalau nanti di-upgrade, tambahkan keranjang + checkout di layout yang sama, jangan didesain ulang dari nol — siapkan spacing yang cukup dari awal untuk elemen ini.

## 6. Struktur File Figma

- **Page: Design System** (§4)
- **Page: Screens — Tablet/Desktop** (halaman §5.1–§5.10, hi-fi, breakpoint utama)
- **Page: Screens — HP** (adaptasi breakpoint sekunder untuk halaman yang sama)
- **Page: Screens — QR Menu (mobile-first)** (§5.11, terpisah karena target device & audiens beda)
- **Page: Prototype** (flow interaktif: buka shift → transaksi → bayar → cetak/kirim struk → tutup shift, termasuk simulasi transisi ke mode offline)
- **Page: Redlines/Handoff** (spacing & spec untuk frontend, dibuat setelah desain disetujui client)

## 7. Deliverable & Catatan Revisi

Desain ini **akan direvisi** setelah direview client dan sebelum/selama development frontend (lihat PRD-02). Simpan versi sebagai `v0.1`, `v0.2`, dst — jangan overwrite tanpa histori, supaya keputusan desain sebelumnya bisa dilacak.

## 8. Definition of Done

- [ ] Semua halaman di §5 ada dalam versi hi-fi, untuk breakpoint tablet/desktop DAN HP
- [ ] Design system lengkap dengan token & component states
- [ ] Lolos self-review checklist anti-slop di §2 (screenshot tiap layar, cek satu-satu)
- [ ] Halaman QR Menu didesain terpisah, mobile-first, dan diuji tampilannya di HP sungguhan (bukan cuma preview di Figma)
- [ ] Prototype flow bisa diklik end-to-end untuk demo ke client
