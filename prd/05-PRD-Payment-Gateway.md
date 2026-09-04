# PRD-05 — Payment Gateway
**Proyek:** POS Kasir | **Status:** Draft v0.1
**Induk:** 00-PRD-Overview.md | **Terkait:** 03-PRD-Backend.md, 04-PRD-Offline-Sync.md

---

> ⚠️ **JANGAN AI SLOP** — jangan asal integrasi "yang penting jalan". Alur pembayaran menyangkut uang asli; setiap state (pending/success/failed/expired/refund) harus ditangani eksplisit, bukan diasumsikan selalu sukses.
> **Skill:** cek skill terkait integrasi API/payment di environment sebelum mulai coding modul ini.

---

## 1. Apakah Butuh Payment Gateway? — Ya

Client kemungkinan besar butuh terima pembayaran non-tunai (QRIS, e-wallet, kartu) — ini sudah jadi ekspektasi standar pelanggan di Indonesia, dan hampir semua kompetitor (Moka, Majoo, Olsera, Pawoon, Qasir) sudah menyediakannya. **Konfirmasi ke client**: kalau bisnisnya kecil dan cukup tunai + QRIS statis manual (lihat PRD-04 §7), integrasi payment gateway bisa disederhanakan/ditunda. Tapi untuk pengalaman kasir yang mulus (nominal otomatis masuk ke QR, tercatat otomatis di laporan), gateway tetap direkomendasikan.

## 2. Pilihan Gateway

| Gateway | Kelebihan | Kekurangan | Rekomendasi |
|---|---|---|---|
| **Midtrans** | Bagian grup GoTo → integrasi native ke GoPay; plugin siap pakai, cepat go-live; SDK resmi Node.js/PHP/dll | API lebih "tua", terpisah antara Core API/Snap/Iris | **Utama** — cocok untuk go-live cepat |
| **Xendit** | API REST modern & bersih, dokumentasi ramah developer, fitur disbursement kuat | Tidak ada hand-off native ke GoPay (user GoPay tetap lewat QRIS universal) | **Cadangan/backup** — kalau mau redundansi 2 gateway |
| **QRIS statis** | Tidak butuh gateway sama sekali untuk kasus darurat | Tidak tercatat otomatis, perlu rekonsiliasi manual | **Fallback offline**, lihat PRD-04 §7 |

**Rekomendasi:** mulai dengan **Midtrans sebagai gateway utama** (ekosistem GoPay + kecepatan go-live), simpan opsi tambah **Xendit sebagai gateway kedua** di fase berikutnya untuk redundansi — kalau satu gateway down, transaksi tetap bisa lewat yang lain. Ini pola yang lazim dipakai untuk bisnis yang serius soal payment.

Catatan biaya: MDR QRIS diregulasi Bank Indonesia di angka yang sama (sekitar 0,7% untuk merchant reguler) di semua gateway — jadi pemilihan gateway sebaiknya berdasarkan kemudahan integrasi & fitur, bukan selisih biaya QRIS.

## 3. Metode Pembayaran yang Didukung

| Metode | Sumber | Butuh internet real-time? |
|---|---|---|
| Tunai | — | Tidak |
| QRIS dinamis (nominal otomatis) | Midtrans/Xendit | Ya |
| QRIS statis (nominal input manual pelanggan) | Terdaftar sekali via GoPay Merchant/gateway | Tidak di sisi merchant (lihat PRD-04 §7) |
| E-wallet (GoPay, OVO, DANA, ShopeePay) | Lewat QRIS atau redirect/deeplink gateway | Ya |
| Kartu debit/kredit | EDC bank (terpisah dari software) **atau** gateway (Visa/Mastercard/JCB) | EDC: independen internet toko (SIM sendiri). Gateway: ya |
| PayLater (Kredivo, Akulaku) | Gateway | Ya |

## 4. Arsitektur Integrasi

- **Backend yang berkomunikasi dengan gateway**, bukan terminal kasir langsung — API key/credential gateway tidak boleh tersebar ke banyak device fisik di toko (lihat PRD-03 §6).
- Alur QRIS dinamis: kasir pilih "QRIS" di terminal → request ke backend → backend request generate QR ke gateway → QR ditampilkan di layar terminal → gateway kirim webhook ke backend saat pelanggan bayar → backend update status transaksi → terminal polling/menerima notifikasi status → struk tercetak.
- **Webhook harus idempotent** — gateway kadang mengirim webhook yang sama lebih dari sekali; backend harus cek apakah event ini sudah diproses sebelum update status.
- Sediakan **timeout & fallback UX**: kalau QR tidak dibayar dalam waktu tertentu (mis. 5 menit), alihkan ke pilihan metode bayar lain — jangan biarkan kasir/pelanggan menunggu tanpa kepastian.

## 5. Keamanan & Kepatuhan

- Tidak pernah menyimpan data kartu mentah (nomor kartu, CVV) di database sendiri — delegasikan sepenuhnya ke gateway (pertimbangan PCI-DSS).
- Simpan hanya reference ID transaksi dari gateway untuk keperluan rekonsiliasi.
- Gunakan environment sandbox gateway untuk semua testing sebelum production — perilaku sandbox tidak selalu 100% identik dengan production, jadi tetap uji ulang skenario kritis (sukses, gagal, timeout, refund, partial payment) setelah go-live di skala kecil dulu.

## 6. Rekonsiliasi

- Laporan harian harus bisa memisahkan: total tunai, total per metode non-tunai, dan total dari QRIS statis manual (yang perlu dicocokkan manual dari dashboard gateway).
- Sediakan proses/checklist rekonsiliasi akhir shift: kas fisik vs kas sistem, dan ringkasan pembayaran digital vs yang tercatat di dashboard gateway.

## 7. Definition of Done

- [ ] Integrasi Midtrans lolos sandbox test semua skenario (sukses/gagal/timeout/refund)
- [ ] Webhook teruji idempotent (kirim event sama 2x, status tidak berubah tidak konsisten)
- [ ] UX timeout QR ditangani, tidak ada dead-end di layar pembayaran
- [ ] Tidak ada data kartu mentah tersimpan di database sendiri
