# PRD-05 — Payment Gateway
**Proyek:** POS Kasir untuk Hasuka Dimsum | **Status:** v1.1
**Induk:** 00-PRD-Overview.md | **Terkait:** 03-PRD-Backend.md, 04-PRD-Offline-Sync.md

---

> JANGAN AI SLOP — jangan asal integrasi "yang penting jalan". Alur pembayaran menyangkut uang asli; setiap state (pending/success/failed/expired/refund) harus ditangani eksplisit, bukan diasumsikan selalu sukses.
> Skill: cek skill terkait integrasi API/payment di environment sebelum mulai coding modul ini.
> Catatan: sub-state QRIS Statis (tanpa timer, ada tombol konfirmasi manual, tampilan kode QR ter-upload) sudah termasuk dalam desain di PRD-01 bagian 5.4 (rebuild).

---

## 1. QRIS: Statis atau Dinamis? — Dibuat Configurable

Ini keputusan produk, bukan cuma teknis, jadi ditegaskan di paling atas: sistem mendukung keduanya lewat satu setting (`outlet.qris_mode: "static" | "dynamic"`), bukan pilih salah satu secara hardcode. Alasannya:

- QRIS Statis: pelanggan scan kode tetap (dari bank/penyedia QRIS manapun, tidak perlu akun Midtrans/Xendit), ketik nominal sendiri di app mereka, kasir konfirmasi manual setelah lihat notifikasi/tampilan sukses di HP pelanggan. Tetap jalan 100% walau POS lagi offline — sama seperti tunai, karena tidak butuh koneksi apapun di sisi device kasir.
- QRIS Dinamis: nominal otomatis ter-embed di kode QR (generate via Midtrans/Xendit), konfirmasi otomatis lewat webhook, tapi butuh internet aktif di device kasir saat transaksi & butuh akun gateway.

Rekomendasi default: mulai dengan Statis kalau client belum punya akun Midtrans/Xendit — lebih cepat go-live, tanpa biaya integrasi tambahan, dan justru lebih konsisten dengan prinsip offline-first proyek ini (PRD-04). Pindah ke Dinamis kapan saja tinggal ganti setting begitu client siap.

## 2. Apakah Tetap Butuh Payment Gateway (Midtrans/Xendit)?

Tergantung mode QRIS yang dipilih di atas:
- Kalau QRIS Statis + Kartu via EDC bank (dicatat manual) -> Midtrans/Xendit tidak wajib untuk MVP.
- Kalau mau QRIS Dinamis dan/atau kartu online tanpa mesin EDC fisik -> butuh salah satu gateway. Lihat bagian 4 untuk pilihannya.

Arsitektur backend (PRD-03) tetap dirancang siap keduanya dari awal — supaya pindah dari Statis ke Dinamis nanti tidak perlu rombak skema data.

## 3. Alur di Layar Pembayaran (per mode)

| | QRIS Statis | QRIS Dinamis |
|---|---|---|
| Tampilan | Gambar QR yang di-upload owner (sekali, di Pengaturan) + teks total belanja (untuk pelanggan ketik manual) | QR di-generate otomatis oleh gateway, nominal sudah ter-embed |
| Timer | Tidak ada | Ada (timeout, mis. 5 menit) |
| Konfirmasi | Tombol "Sudah Dibayar" ditekan kasir setelah verifikasi manual | Otomatis begitu webhook diterima backend |
| Kalau offline | Tetap bisa dipakai penuh | Disabled, arahkan ke Statis (kalau tersedia) atau tunai |

## 4. Pilihan Gateway (kalau pakai Dinamis)

| Gateway | Kelebihan | Kekurangan | Rekomendasi |
|---|---|---|---|
| Midtrans | Bagian grup GoTo — integrasi native ke GoPay; plugin siap pakai, cepat go-live; SDK resmi Node.js/PHP/dll | API lebih "tua", terpisah antara Core API/Snap/Iris | Utama — cocok untuk go-live cepat |
| Xendit | API REST modern & bersih, dokumentasi ramah developer, fitur disbursement kuat | Tidak ada hand-off native ke GoPay | Cadangan/backup — kalau mau redundansi 2 gateway |

Catatan biaya: MDR QRIS diregulasi Bank Indonesia di angka yang sama (sekitar 0,7% untuk merchant reguler) di semua gateway maupun QRIS statis.

## 5. Metode Pembayaran yang Didukung

| Metode | Sumber | Butuh internet real-time? |
|---|---|---|
| Tunai | — | Tidak |
| QRIS Statis (nominal manual, konfirmasi manual) | Kode QRIS milik toko | Tidak di sisi POS |
| QRIS Dinamis (nominal otomatis, konfirmasi otomatis) | Midtrans/Xendit | Ya |
| E-wallet (GoPay, OVO, DANA, ShopeePay) | Lewat QRIS (statis maupun dinamis) | Sesuai mode QRIS yang dipakai |
| Kartu debit/kredit | EDC bank (dicatat manual) atau gateway | EDC independen internet toko. Gateway: ya |
| PayLater (Kredivo, Akulaku) | Gateway (Dinamis) | Ya |

## 6. Arsitektur Integrasi (mode Dinamis)

- Backend yang berkomunikasi dengan gateway, bukan terminal kasir langsung.
- Alur: kasir pilih "QRIS" -> backend cek `outlet.qris_mode` -> kalau `dynamic`: request generate QR ke gateway -> tampil di terminal -> webhook masuk saat dibayar -> status auto-update -> struk tercetak. Kalau `static`: tampilkan QR ter-upload + total -> kasir tap "Sudah Dibayar" setelah verifikasi manual.
- Webhook harus idempotent (mode Dinamis).
- Sediakan timeout & fallback UX (mode Dinamis): kalau QR tidak dibayar dalam waktu tertentu, alihkan ke pilihan metode bayar lain.

## 7. Keamanan & Kepatuhan

- Tidak pernah menyimpan data kartu mentah (nomor kartu, CVV) di database sendiri.
- Simpan hanya reference ID transaksi dari gateway (mode Dinamis).
- Untuk mode Statis: wajib ada log siapa (kasir mana) yang menekan "Sudah Dibayar" dan kapan.
- Gunakan environment sandbox gateway (mode Dinamis) untuk semua testing sebelum production.

## 8. Rekonsiliasi

- Mode Statis: karena tidak ada konfirmasi otomatis, rekonsiliasi wajib jadi bagian dari SOP Tutup Shift — kasir/owner cocokkan total QRIS yang tercatat di sistem terhadap mutasi masuk di aplikasi bank/QRIS penyedia.
- Mode Dinamis: rekonsiliasi otomatis tercatat, tapi tetap sediakan laporan pembanding terhadap dashboard gateway.
- Laporan harian harus bisa memisahkan: total tunai, total QRIS, total kartu.

## 9. Definition of Done

- [ ] Setting `qris_mode` (statis/dinamis) berfungsi dan tersimpan per outlet
- [ ] Mode Statis: upload gambar QR di Pengaturan, tampil benar di layar pembayaran, tombol konfirmasi manual tercatat dengan audit log
- [ ] Mode Dinamis: integrasi gateway lolos sandbox test semua skenario, webhook teruji idempotent
- [ ] Laporan bisa memisahkan total per metode & mode pembayaran
- [ ] Tidak ada data kartu mentah tersimpan di database sendiri
