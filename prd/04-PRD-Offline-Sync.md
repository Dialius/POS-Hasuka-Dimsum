# PRD-04 — Offline & Sync Architecture (Deep-Dive)
**Proyek:** POS Kasir untuk Hasuka Dimsum | **Status:** v1.1
**Induk:** 00-PRD-Overview.md | **Dirujuk oleh:** 02-PRD-Frontend.md, 03-PRD-Backend.md

---

> JANGAN AI SLOP — khusus dokumen ini: jangan implementasi "offline mode" versi tempelan (mis. cuma disable tombol pas offline, atau tampilkan spinner "menunggu koneksi"). Ini harus benar-benar local-first: aplikasi tidak boleh tahu/peduli status koneksi untuk bisa menyelesaikan transaksi.
> Skill: kalau ada skill terkait database/sync architecture di environment, cek dulu sebelum mendesain ulang dari nol.

---

## 1. Masalah yang Dipecahkan

Kasir harus tetap bisa jualan walau:
- Internet toko putus (ISP down, kuota habis, dsb — umum terjadi di banyak lokasi di Indonesia)
- Listrik padam (device harus tetap hidup dari baterai — lihat bagian 6)
- Server pusat sedang down/maintenance

Kalau salah satu dari ini bikin kasir tidak bisa transaksi, itu kegagalan desain — bukan sekadar bug.

## 2. Prinsip Utama

Local database di terminal adalah source of truth untuk hari berjalan. Server pusat adalah tempat konsolidasi & pusat kebenaran lintas outlet/lintas waktu, bukan syarat transaksi bisa terjadi. Alur data satu arah dan tegas:

1. Read: UI selalu baca dari local DB (SQLite), tidak pernah nunggu network.
2. Write: Aksi user (checkout, buka/tutup shift, tambah produk) langsung ditulis ke local DB dulu.
3. Sync: Proses background terpisah yang mengirim perubahan ke server dan menarik update dari server — UI tidak nunggu proses ini.

## 3. Pola: Outbox + Background Sync Worker

Pola yang dipakai (standar industri untuk kasus seperti ini):

```
Transaksi selesai
  -> Tulis ke local DB (status: LOCAL, permanen)
  -> Tulis entry baru ke SYNC QUEUE (outbox) - durable, tahan restart app
  -> Background Sync Worker (thread/proses terpisah):
       - Jalan periodik (mis. tiap 15-30 detik) ATAU begitu status online terdeteksi
       - Ambil item PENDING dari queue, kirim batch ke backend
       - Sukses -> tandai SYNCED
       - Gagal -> tetap PENDING, retry dengan backoff (jangan spam request tiap detik)
       - Setelah push sukses, tarik (pull) update produk/harga/aturan promo/pengaturan pajak
         (PPN on/off & rate) terbaru dari server - lihat PRD-03 bagian 6 untuk endpoint-nya
```

Struktur minimal tabel/queue lokal:

```
QueuedMutation {
  local_id: string        // UUID digenerate di device saat transaksi dibuat
  type: "TRANSACTION" | "SHIFT_OPEN" | "SHIFT_CLOSE" | ...
  payload: object
  status: "pending" | "synced" | "failed"
  created_at: timestamp
  retry_count: number
  last_error?: string
}
```

Poin kritis: transaksi harus dianggap "selesai" di mata kasir & pelanggan begitu tersimpan lokal — bukan menunggu konfirmasi server. Struk tetap tercetak, laci kas tetap kebuka, walau device belum sempat sync sama sekali.

## 4. Idempotency & Conflict Resolution

- Setiap transaksi punya `local_id` (UUID) yang digenerate di client, dikirim apa adanya ke server sebagai `client_generated_id`. Kalau sync gagal di tengah jalan lalu diulang, server cukup cek apakah ID ini sudah pernah diproses (idempotent) — tidak akan tercatat dobel.
- Stok: dikurangi optimistic di local DB saat transaksi terjadi. Saat sync, server jadi otoritas final — kalau ternyata terjadi oversell lintas terminal, server menandai transaksi kedua untuk review manual, bukan otomatis dibatalkan begitu saja.
- Harga & data produk: server adalah otoritas. Kalau owner ubah harga saat outlet offline, harga lama tetap dipakai sampai terminal itu online lagi dan pull update.
- Semua konflik yang tidak bisa diresolusi otomatis masuk ke log untuk dicek admin, jangan pernah silent-drop data transaksi.

## 5. Apa yang Tetap Jalan vs Tidak Saat Offline

| Fitur | Jalan offline? | Catatan |
|---|---|---|
| Transaksi tunai | Ya | Full lokal |
| Cetak struk | Ya | Printer LAN/USB, tidak butuh internet |
| Buka/tutup laci kas | Ya | Terhubung ke printer, bukan ke internet |
| Lihat laporan hari ini (di terminal itu) | Ya | Dari local DB |
| Diskon/promo yang sudah tersimpan lokal | Ya | Selama aturan promo sudah ter-pull sebelumnya |
| Perhitungan pajak (PPN) | Ya | Pakai `tax_enabled`/`tax_rate` hasil pull terakhir |
| Stok Opname | Ya | Sesi hitung fisik & penyesuaian stok tetap bisa jalan lokal, ikut antrian sync seperti transaksi lain |
| Petty Cash | Ya | Tercatat lokal dulu, ikut ke perhitungan Tutup Shift di terminal itu juga tanpa perlu online |
| QRIS Statis (`qris_mode: static`) | Ya | Tampil di layar dari gambar ter-upload, kasir konfirmasi manual — lihat PRD-05 bagian 1-3. Bisa jadi mode utama, bukan cuma darurat |
| QRIS Dinamis (`qris_mode: dynamic`) | Tidak | Butuh request ke server payment gateway tiap generate kode — lihat bagian 7 untuk fallback |
| Kartu via EDC bank | Tergantung EDC | EDC biasanya punya jalur sendiri (SIM card sendiri), independen dari internet toko |
| Lihat laporan gabungan multi-outlet | Tidak | Butuh data dari outlet lain di server pusat |

## 6. Skenario Mati Listrik (bukan cuma internet)

Offline internet itu satu hal — mati listrik total itu hal lain. Rekomendasi:
- Device terminal sebaiknya punya baterai (tablet/HP), bukan PC desktop tanpa UPS — supaya transaksi yang sedang berjalan tidak hilang begitu listrik padam mendadak.
- Kalau pakai PC desktop untuk back-office, sediakan UPS minimal untuk PC dan printer.
- Local DB (SQLite) harus pakai mode transaksi yang aman terhadap crash mendadak (WAL mode) — supaya kalau device mati mendadak di tengah write, data tidak korup.
- Sesi login kasir tidak boleh hilang saat restart aplikasi mendadak — simpan sesi lokal, jangan paksa re-login yang butuh koneksi ke server.

## 7. QRIS Statis: Mode Utama vs Stiker Darurat Cadangan

Dua skenario berbeda, jangan tertukar:

1. QRIS statis sebagai mode utama (`outlet.qris_mode = "static"`, lihat PRD-05 bagian 1): pelanggan scan dari layar POS, kasir tetap konfirmasi manual lewat aplikasi ("Sudah Dibayar") — transaksi tetap tercatat normal di sistem, cuma konfirmasinya manual bukan via webhook. Ini alur utama, bukan darurat, dan bisa dipakai penuh saat offline karena tidak butuh koneksi apapun.
2. Stiker QRIS fisik sebagai cadangan darurat — dipakai kalau outlet pakai `qris_mode: "dynamic"` tapi terminal/aplikasi POS-nya sendiri yang bermasalah (bukan cuma internet mati, tapi device rusak/gagal booting). Di sini pelanggan scan stiker fisik yang sama sekali di luar sistem POS — transaksi tidak tercatat otomatis, perlu rekonsiliasi manual dari dashboard gateway saat POS pulih.

Kalau outlet memang memilih QRIS Statis sebagai mode utama, skenario 2 jadi tidak relevan.

## 8. Skenario Uji Wajib

- [ ] Cabut internet di tengah transaksi -> transaksi selesai lokal -> struk tercetak
- [ ] Restart aplikasi mendadak (simulasi mati listrik) di tengah transaksi -> tidak ada data korup
- [ ] Offline lama (lebih dari 1 hari), lalu online lagi -> semua transaksi yang menumpuk berhasil sync tanpa duplikat, tanpa urutan tercampur
- [ ] Dua terminal di outlet sama, sama-sama offline, jual stok terakhir item yang sama -> server mendeteksi & menandai untuk review, bukan crash atau silent-drop
- [ ] Ubah harga produk dari dashboard admin saat 1 terminal offline -> terminal itu tetap pakai harga lama sampai online & pull update
- [ ] QRIS Statis (mode utama) dipakai penuh saat outlet offline total -> transaksi tercatat lokal dengan `confirmation_type: manual`, ikut ke antrian sync seperti transaksi lain
