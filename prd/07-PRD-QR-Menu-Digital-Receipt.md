# PRD-07 — QR Menu & Struk Digital
**Proyek:** POS Kasir | **Status:** Draft v0.1
**Induk:** 00-PRD-Overview.md | **Terkait:** 01-PRD-Design-Figma.md §5.11, 02-PRD-Frontend.md §7, 03-PRD-Backend.md §5

---

> ⚠️ **JANGAN AI SLOP** — jangan asal integrasi "yang penting jalan". Dua fitur ini customer-facing, jadi kesan pertama yang pelanggan lihat dari brand client — desain & copywriting-nya harus dapat perhatian yang sama seperti halaman kasir.
> **Skill:** baca `frontend-design` SKILL.md untuk bagian QR Menu (ini halaman publik yang representasi visual toko client).

---

## 1. Kenapa Dua Fitur Ini Digabung Satu PRD

Struk digital dan QR Menu sama-sama: (a) customer-facing, (b) murni online (tidak butuh mode offline), (c) dibuka dari device milik pelanggan sendiri, bukan terminal kasir. Cocok dibahas sebagai satu subsistem terpisah dari app kasir utama.

## 2. Struk Digital (WhatsApp & Email)

### 2.1 Kenapa Ditambahkan
Riset kompetitor (PRD-00 §7) menunjukkan struk digital konsisten muncul sebagai fitur andalan di tier menengah-atas (Majoo Advance, Qasir Pro, Kasir Pintar Pro, Accurate POS) — pola umumnya: setelah pembayaran sukses, kasir tinggal pilih kirim struk ke WhatsApp/Email pelanggan alih-alih (atau selain) cetak fisik.

### 2.2 Dua Pendekatan WhatsApp — Pilih Salah Satu

| Pendekatan | Cara kerja | Kelebihan | Kekurangan |
|---|---|---|---|
| **A. Share via deep link (`wa.me`)** — direkomendasikan untuk MVP | App generate link struk (halaman web ringan berisi struk), buka `wa.me/{nomor}?text={pesan+link}` — kasir/pelanggan tinggal tekan kirim di WhatsApp yang sudah terbuka | Gratis, tidak perlu approval WhatsApp Business API, setup cepat | Masih perlu 1 tap manual dari kasir/pelanggan untuk konfirmasi kirim di WhatsApp |
| **B. WhatsApp Business API (otomatis penuh)** | Backend kirim langsung lewat provider resmi (mis. lewat Meta BSP) | Benar-benar otomatis tanpa sentuhan manual | Perlu approval bisnis, ada biaya per pesan, setup jauh lebih kompleks — overkill untuk MVP satu client |

**Rekomendasi MVP: Pendekatan A.** Cukup untuk kebutuhan client saat ini, bisa upgrade ke Pendekatan B nanti kalau volume transaksi sudah besar dan butuh otomasi penuh.

### 2.3 Email
Lebih sederhana: backend generate struk (HTML atau PDF ringan) dan kirim via layanan email transaksional (mis. SMTP provider seperti SendGrid/Mailgun/SES) — sepenuhnya otomatis dari MVP, tidak perlu approval khusus seperti WhatsApp Business API.

### 2.4 Alur
1. Transaksi selesai → layar Konfirmasi & Struk (PRD-01 §5.5) muncul.
2. Kasir pilih Cetak / Kirim WA / Kirim Email / Lewati.
3. Kalau digital: input/pilih nomor HP atau email pelanggan (bisa dari data pelanggan tersimpan kalau sudah ada riwayatnya).
4. Backend catat percobaan pengiriman di `receipt_deliveries` (lihat PRD-03 §4) — status `sent`/`failed`, supaya bisa di-retry atau dicek dari riwayat transaksi.
5. Struk fisik & struk digital **tidak saling eksklusif** — kasir bisa pilih keduanya kalau pelanggan minta.

## 3. QR Menu

### 3.1 Kenapa Ditambahkan
Konsisten muncul di kompetitor (Moka POS, Majoo Advance "weborder + QR e-menu") dan riset pola umum self-order QR: pelanggan scan kode QR di meja/etalase pakai kamera HP biasa, langsung diarahkan ke halaman menu digital di browser — **tanpa perlu download aplikasi apapun**. Ini pola standar industri, bukan cuma di Indonesia.

### 3.2 Dua Level Fitur

| Level | Deskripsi | Status di scope |
|---|---|---|
| **QR Menu read-only (MVP)** | Pelanggan scan → lihat daftar menu, foto, harga, deskripsi. Tidak ada checkout — murni pengganti buku menu fisik | ✅ In-scope MVP — lihat PRD-00 §4 |
| **QR self-order (fase 2)** | Pelanggan tambah ke keranjang, checkout, pesanan otomatis masuk ke sistem kasir/dapur — butuh manajemen meja & (untuk F&B) integrasi Kitchen Display System | ⏭️ Fase 2 |

Kenapa dipisah dua level: self-order penuh itu perubahan operasional besar (perlu SOP baru untuk staf, integrasi dapur, penomoran meja) — bukan cuma fitur teknis. Read-only sudah memberi banyak manfaat (kurangi cetak menu fisik, gampang update harga) dengan risiko implementasi jauh lebih kecil.

### 3.3 Cara Kerja Teknis (read-only, MVP)

1. Setiap outlet (atau tiap meja, kalau F&B) dapat 1 `url_slug` unik, disimpan di `menu_qr_codes` (PRD-03 §4).
2. QR code di-generate dari URL itu (`https://[domain]/menu/{outlet-slug}` atau `/menu/{outlet-slug}/{table-id}`), lalu dicetak/ditempel di meja/etalase — proses ini di luar aplikasi (cetak stiker fisik, sekali di awal).
3. Pelanggan scan pakai kamera HP bawaan → browser buka halaman **QR Menu** (PRD-01 §5.11, dibangun sebagai web page publik — lihat PRD-02 §7).
4. Halaman fetch data dari endpoint publik `GET /api/v1/public/menu/:outletSlug` (PRD-03 §6) — read-only, tidak perlu login. Endpoint ini juga mengembalikan harga setelah promo aktif (kalau ada) — tampilkan harga asli dicoret + harga promo, supaya QR Menu juga jadi kanal promosi, bukan cuma daftar harga statis. Harga yang ditampilkan sudah termasuk pajak kalau `tax_enabled` outlet tersebut aktif (tidak perlu pelanggan hitung sendiri).
5. Kalau owner ubah harga/foto/promo produk dari app kasir, QR Menu otomatis ikut update (sumber data sama, tidak ada proses cetak ulang menu).

### 3.4 Definition of Done

- [ ] Struk digital: WA (deep link) & Email teruji end-to-end, tercatat di `receipt_deliveries`
- [ ] QR Menu: bisa di-generate per outlet, halaman terbuka benar di berbagai browser HP (Chrome Android, Safari iOS)
- [ ] QR Menu tetap update otomatis begitu ada perubahan produk/harga dari app kasir, tanpa proses manual tambahan
- [ ] Endpoint publik QR Menu tidak membocorkan data internal (stok, harga modal, data outlet lain)
