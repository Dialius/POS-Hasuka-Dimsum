# RESPONSIVE-ALERT-REPORT.md — Fase 1: Kasir + PaymentModal

**Tanggal:** 2026-09-14  
**Status:** Selesai (TypeScript clean, dev server running)

---

## File Dibuat / Dimodifikasi

| File | Aksi | Ringkasan |
|---|---|---|
| `src/components/Alert.tsx` | BARU | Komponen Alert hand-crafted: Alert, AlertTitle, AlertDescription, AlertAction, AlertToast, AlertToastHost |
| `src/components/CheckoutScreen.tsx` | EDIT | Responsive layout + alert system |
| `src/components/PaymentModal.tsx` | EDIT | Responsive bottom sheet + touch targets |

---

## Masalah Ditemukan & Diperbaiki

### CheckoutScreen

| Masalah | Sebelum | Sesudah |
|---|---|---|
| Sidebar kategori di HP | Selalu tampil vertikal 72px | Hidden di HP (`sm:hidden`), diganti horizontal scroll top bar |
| Product grid di HP | Hardcoded `grid-cols-3` | `grid-cols-2 sm:grid-cols-3` |
| Cart panel di HP | Hardcoded `width: 340` | Hidden di HP (`sm:flex`); diganti bottom sheet |
| Cart bottom sheet | Tidak ada | Floating bar bawah (total + BAYAR); tap expand → detail item |
| `alert()` native | Dipakai untuk error transaksi gagal | `AlertToast` variant `destructive` + tombol "Coba Kirim Ulang" |
| Sukses transaksi | Tidak ada feedback visual | `AlertToast` variant `success`, auto-dismiss 3 detik |
| Product grid bottom padding | `pb-3` — konten tertutup floating bar | `pb-24 sm:pb-3` |

### PaymentModal

| Masalah | Sebelum | Sesudah |
|---|---|---|
| Modal di HP | `width: 760` hardcoded — overflow horizontal parah | Bottom sheet full-width di HP |
| Layout 2-kolom di HP | Left panel 320px + right — terlalu sempit | 1-kolom di HP: method selector horizontal scroll di atas, numpad di bawah |
| Numpad touch target | `py-2.5` — bisa ~38px | `minHeight: 48` per key |
| Konfirmasi button | `py-3.5` | `minHeight: 52` |

---

## Alert System

### Warna — token PRD-01, bukan shadcn generic

| Variant | Background | Border | Text |
|---|---|---|---|
| `destructive` | #FFF0F0 | #B60000 | #7A0000 |
| `warning` | #FEFBEC | #C9A227 | #6B5000 |
| `success` | #F0F7EA | #5B8A2E | #2F4A16 |
| `info`/`default` | #F3E7CE | #C49A62 | #2B1810 |

### Alert terimplementasi (Fase 1)

- [x] Transaksi gagal tersimpan — `destructive` + AlertAction "Coba Kirim Ulang"
- [x] Transaksi berhasil tersimpan — `success` toast 3 detik

### Alert belum diimplementasi (Fase berikutnya)

- [ ] Print gagal/dialog cetak di-cancel — `warning` + AlertAction struk digital
- [ ] Stok habis sebelum tambah ke cart — `warning`
- [ ] Owner: stok menipis — `warning` + link ke Stok Opname
- [ ] Owner: selisih kas signifikan — `destructive`/`warning`
- [ ] Owner: produk baru tanpa resep — `info`
- [ ] Proaktif WA/Email via Apps Script — bukan alert di app

---

## Verifikasi

- [x] `npx tsc --noEmit` — exit code 0
- [x] `npm run dev` — running di http://localhost:5173/
- [ ] Visual QA di HP (375px) dan tablet (768px) — perlu dilakukan manual

---

## Catatan Teknis

**isMobile detection di PaymentModal**: saat ini pakai `window.innerWidth < 640` saat render — tidak reaktif saat resize. Cukup untuk POS (kasir tidak resize window). Kalau nanti butuh reaktif, tambah `useWindowSize` hook.

**Bottom sheet cart**: simple toggle (CSS + state), tanpa drag gesture, sesuai konfirmasi.

---

## Fase Berikutnya

1. **LoginScreen** — numpad PIN di HP
2. **BukaShiftScreen** — form input di HP  
3. **OwnerDashboardScreen** (file 78KB) — paling kompleks
4. **SettingsScreen**
5. Alert: print gagal, stok habis, selisih kas, produk tanpa resep
