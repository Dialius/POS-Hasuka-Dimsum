# PRD-06 — Deployment
**Proyek:** POS Kasir untuk Hasuka Dimsum | **Status:** v1.1
**Induk:** 00-PRD-Overview.md | **Terkait:** 03-PRD-Backend.md, 02-PRD-Frontend.md

---

> JANGAN AI SLOP — berlaku juga di sini: jangan copy-paste konfigurasi CI/CD generic tanpa disesuaikan ke kebutuhan proyek (mis. health check yang asal ping "/" tanpa cek koneksi database/redis beneran).
> Skill: cek skill terkait deployment/DevOps di environment sebelum menyusun pipeline final.

---

## 1. Environment

| Environment | Tujuan |
|---|---|
| Local (dev) | Development sehari-hari, docker-compose lokal (Postgres, Redis) |
| Staging | Testing integrasi sebelum rilis, termasuk sandbox payment gateway |
| Production | Live, dipakai client sungguhan |

## 2. Hosting & Infrastruktur

Spek VPS untuk mulai (1 outlet, beberapa terminal):

| Spek | Rekomendasi | Catatan |
|---|---|---|
| vCPU | 2 core | Cukup untuk NestJS + PostgreSQL + Redis di skala 1 outlet |
| RAM | 4GB | Naik ke 8GB kalau outlet bertambah jadi 3+ atau traffic sync ramai |
| Storage | 60-80GB NVMe SSD | Termasuk ruang untuk foto produk kalau disimpan di server |
| Region | Jakarta atau Singapore | Latensi rendah ke terminal di Indonesia |
| OS | Ubuntu LTS + Docker | Postgres, Redis, backend jalan sebagai container via docker-compose |

Kisaran biaya di spek ini: sekitar Rp150rb-350rb/bulan tergantung provider. Untuk mulai, cukup 1 VPS menjalankan backend + PostgreSQL + Redis sekaligus lewat Docker.

Opsi budget (3 outlet atau kurang, trafik ringan): 2GB RAM secara teori cukup untuk beban idle (OS+Docker+Postgres+Redis+backend sekitar 1,1-1,6GB), tapi headroom-nya tipis untuk lonjakan sesaat. Kalau pilih tier ini, wajib aktifkan swap (mis. 2GB swap file) sebagai jaring pengaman murah. Selisih harga ke tier 4GB biasanya kecil (sekitar Rp90-100rb/bulan) dan lebih aman untuk sistem yang menangani transaksi uang.

Soal database terkelola (managed): untuk skala 1 client/1 outlet, managed database biasanya 2-3x lebih mahal dari self-host di VPS yang sama — rekomendasi realistis di tahap ini adalah self-host PostgreSQL di VPS, dengan backup otomatis via cron/script. Migrasi ke managed database jadi opsi masuk akal begitu skala sudah menjustifikasi biayanya.

- Backend di-package sebagai container Docker.
- Pertimbangkan 1 backend pusat melayani banyak outlet (bukan 1 server per outlet) — karena arsitektur offline-first (PRD-04) sudah menjamin tiap outlet tetap jalan walau tidak bisa mencapai server pusat.
- Trigger naik spek: pantau CPU/RAM VPS secara berkala — kalau rutin di atas sekitar 70% pemakaian, atau outlet bertambah signifikan, itu saatnya upgrade.

## 3. Distribusi Aplikasi Frontend

| Target | Cara distribusi |
|---|---|
| Tablet & HP (Tauri v2 mobile build, Android/iOS) | Distribusi APK langsung atau lewat Play Store/App Store; auto-update lewat mekanisme Tauri updater |
| Desktop back-office (Tauri v2 desktop build, fallback Electron) | Installer per OS, dengan auto-update supaya perbaikan bug/fitur baru tidak perlu install manual ulang |
| Owner Dashboard & QR Menu (web) | Hosting statis via CDN |

## 4. CI/CD

GitHub Actions (atau setara) dengan pipeline minimal:
1. Lint + type-check (TypeScript)
2. Unit test (terutama logic kalkulasi transaksi & sync — lihat PRD-02 bagian 10, PRD-04 bagian 8)
3. Build (backend image, frontend bundle/installer)
4. Deploy otomatis ke staging saat merge ke branch utama
5. Deploy ke production lewat approval manual (jangan auto-deploy production tanpa gerbang manusia, karena ini sistem yang menangani uang)

## 5. Monitoring & Observability

- Error tracking (mis. Sentry) di backend maupun frontend — termasuk error yang terjadi di terminal kasir yang sedang offline (dikirim begitu online lagi).
- Uptime monitoring untuk backend & endpoint sync.
- Metrik sync (lihat PRD-04): pantau jumlah transaksi pending sync per outlet, umur antrian tertua yang belum sync.

## 6. Backup & Disaster Recovery

- Backup database otomatis harian minimum, dengan retensi yang jelas (mis. 30 hari).
- Uji proses restore secara berkala.
- Karena arsitektur offline-first, kegagalan server pusat tidak menghentikan operasional outlet — tapi tetap perlu SOP kalau server pusat down lebih dari waktu tertentu.

## 7. Keamanan Infrastruktur

- HTTPS wajib di semua endpoint publik.
- Secret (DB credential, JWT secret, API key payment gateway) disimpan di secret manager/environment variable platform hosting, tidak pernah di repo.
- Akses admin ke server/database dibatasi (SSH key, bukan password; VPN/IP allowlist kalau memungkinkan).

## 8. Definition of Done

- [ ] Pipeline CI/CD staging & production berjalan otomatis sesuai bagian 4
- [ ] Monitoring & alert aktif sebelum go-live
- [ ] Proses backup sudah diuji restore minimal 1x sebelum go-live
- [ ] Auto-update aplikasi teruji (rilis versi baru, terminal existing terupdate tanpa reinstall manual)
