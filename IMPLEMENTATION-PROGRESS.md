# Status Implementasi Desain POS Hasuka Dimsum

Dokumen ini melacak status pengerjaan 15 halaman/elemen desain berdasarkan Figma dan PRD. 
Pengerjaan menggunakan pola multi-pass: **Build** -> **Review** (anti-slop, UI/UX check) -> **Test** (responsive, state).

## Legend
- [ ] Belum dimulai
- [B] Sedang tahap Build
- [R] Sedang tahap Review
- [T] Sedang tahap Test
- [x] Selesai

## Daftar Halaman

### Prioritas 1: Kasir / Checkout
- [x] 1. Kasir/Checkout (`tablet-kasir-checkout.png`, `hp-kasir-checkout.png`)
- [x] 2. Pilih Metode Bayar (`tablet-metode-bayar.png`, `hp-metode-bayar.png`)
- [x] 3. Konfirmasi dan Struk (`tablet-konfirmasi-struk.png`, `hp-konfirmasi-struk.png`)

### Prioritas 2: Autentikasi & Operasional Kasir
- [x] 4. Login/PIN Kasir (`tablet-login-pin.png`, `hp-login-pin.png`)
- [x] 5. Buka Shift (`tablet-buka-shift.png`, `hp-buka-shift.png`)
- [x] 6. Tutup Shift (`tablet-tutup-shift.png`, `hp-tutup-shift.png`)
- [x] 7. Petty Cash (`tablet-petty-cash.png`, `hp-petty-cash.png`)
- [x] 8. Indikator/Banner Mode Offline (`hp-offline-banner.png` / Global Component)

### Prioritas 3: Manajemen & Back-office
- [x] 9. Manajemen Produk/Promo (`tablet-manage-products.png`, `hp-manage-products.png`)
- [x] 10. Manajemen Promo (`tablet-manajemen-promo.png`, `hp-manajemen-promo.png`)
- [x] 11. Stok Opname (`tablet-stok-opname.png`, `hp-stok-opname.png`)
- [x] 12. Laporan Penjualan (`tablet-laporan-penjualan.png`, `hp-laporan-penjualan.png`)
- [x] 13. Pengaturan (Pajak/QRIS) (`tablet-pengaturan-pajak.png`, `tablet-pengaturan-qris.png`, `hp-pengaturan.png`)
- [x] 14. Owner Dashboard (`tablet-owner-dashboard.png`, `hp-owner-dashboard.png`)

### Prioritas 4: Customer Facing
- [x] 15. QR Menu Customer (`qr-menu-customer.png`)

---
**Catatan Kualitas Wajib (Checklist per Halaman):**
- [ ] Scrollbar custom/hidden (tanpa scrollbar default)
- [ ] Dropdown/select custom styling (tidak ada native UI browser)
- [ ] Form/control (checkbox, radio, dll) custom sesuai design system Hasuka
- [ ] Warna konsisten dari palet PRD-01
- [ ] Responsive diuji untuk Tablet & HP
- [ ] State interaktif: hover, active, disabled, loading, error terimplementasi
