# PRD-06 — Deployment
**Proyek:** POS Kasir | **Status:** Draft v0.1
**Induk:** 00-PRD-Overview.md | **Terkait:** 03-PRD-Backend.md, 02-PRD-Frontend.md

---

> ⚠️ **JANGAN AI SLOP** — berlaku juga di sini: jangan copy-paste konfigurasi CI/CD generic tanpa disesuaikan ke kebutuhan proyek (mis. health check yang asal ping "/" tanpa cek koneksi database/redis beneran).
> **Skill:** cek skill terkait deployment/DevOps di environment sebelum menyusun pipeline final.

---

## 1. Environment

| Environment | Tujuan |
|---|---|
| **Local (dev)** | Development sehari-hari, docker-compose lokal (Postgres, Redis) |
| **Staging** | Testing integrasi sebelum rilis, termasuk sandbox payment gateway |
| **Production** | Live, dipakai client sungguhan |

## 2. Hosting & Infrastruktur

- **Backend & database**: cloud provider dengan region Asia Tenggara (mis. region Jakarta/Singapore) untuk latensi rendah dari terminal-terminal di Indonesia.
- **Database**: PostgreSQL terkelola (managed) — backup otomatis, jangan self-host database production tanpa strategi backup jelas.
- **Redis**: untuk queue job sync & cache, bisa managed atau self-host tergantung skala.
- Backend di-package sebagai **container Docker** — memudahkan deploy konsisten di staging & production.
- Pertimbangkan **1 backend pusat melayani banyak outlet** (bukan 1 server per outlet) — karena arsitektur offline-first (PRD-04) sudah menjamin tiap outlet tetap jalan walau tidak bisa mencapai server pusat.

## 3. Distribusi Aplikasi Frontend

| Target | Cara distribusi |
|---|---|
| Desktop (Tauri/Electron) | Installer per OS (Windows `.msi`/`.exe` paling relevan untuk pasar ini), dengan **auto-update** supaya perbaikan bug/fitur baru tidak perlu install manual ulang ke tiap outlet |
| Tablet Android (PWA) | Hosting statis via CDN, "Add to Home Screen" untuk pengalaman seperti app native |

## 4. CI/CD

- **GitHub Actions** (atau setara) dengan pipeline minimal:
  1. Lint + type-check (TypeScript)
  2. Unit test (terutama logic kalkulasi transaksi & sync — lihat PRD-02 §7, PRD-04 §8)
  3. Build (backend image, frontend bundle/installer)
  4. Deploy otomatis ke staging saat merge ke branch utama
  5. Deploy ke production lewat approval manual (jangan auto-deploy production tanpa gerbang manusia, karena ini sistem yang menangani uang)

## 5. Monitoring & Observability

- **Error tracking** (mis. Sentry) di backend maupun frontend — termasuk error yang terjadi di terminal kasir yang sedang offline (dikirim begitu online lagi).
- **Uptime monitoring** untuk backend & endpoint sync.
- **Metrik sync** (lihat PRD-04): pantau jumlah transaksi pending sync per outlet, umur antrian tertua yang belum sync — kalau ada outlet dengan antrian menumpuk lama, itu sinyal ada masalah (bukan cuma offline biasa).

## 6. Backup & Disaster Recovery

- Backup database otomatis harian minimum, dengan retensi yang jelas (mis. 30 hari).
- Uji proses restore secara berkala — backup yang tidak pernah dites restore-nya sama saja tidak ada.
- Karena arsitektur offline-first, **kegagalan server pusat tidak menghentikan operasional outlet** — tapi tetap perlu SOP: kalau server pusat down lebih dari X waktu, siapa yang dihubungi, apa dampaknya ke laporan gabungan.

## 7. Keamanan Infrastruktur

- HTTPS wajib di semua endpoint publik.
- Secret (DB credential, JWT secret, API key payment gateway) disimpan di secret manager/environment variable platform hosting, tidak pernah di repo.
- Akses admin ke server/database dibatasi (SSH key, bukan password; VPN/IP allowlist kalau memungkinkan).

## 8. Definition of Done

- [ ] Pipeline CI/CD staging & production berjalan otomatis sesuai §4
- [ ] Monitoring & alert aktif sebelum go-live (bukan dipasang setelah insiden pertama)
- [ ] Proses backup sudah diuji restore minimal 1x sebelum go-live
- [ ] Auto-update aplikasi desktop teruji (rilis versi baru → terminal existing terupdate tanpa reinstall manual)
