# INVENTARISASI LENGKAP HALAMAN & KONDISI TAMPILAN (PAGE-INVENTORY)
**Proyek:** POS Kasir Hasuka Dimsum | **Stack:** React 18, Vite, TypeScript, Tailwind CSS, Lucide Icons  
**Design System:** Figma PRD-01 (Palet Warna Logo Dimsum & Warm Heritage)  
**Dokumen Acuan:** `App.tsx`, `src/components/*`, `src/context/*`, `PROJECT-STRUCTURE.md`, `prd/01-PRD-Design-Figma.md`  
**Waktu Audit:** September 2026

---

## DAFTAR ISI
1. [Langkah 0 — Audit & Penemuan Mandiri Halaman (Routing vs File)](#langkah-0--audit--penemuan-mandiri-halaman)
2. [Peta Navigasi & Arsitektur Layar (Screen Matrix)](#peta-navigasi--arsitektur-layar)
3. [Design Token & Palet Warna Resmi (PRD-01)](#design-token--palet-warna-resmi)
4. [Inventarisasi Detail Tiap Halaman](#inventarisasi-detail-tiap-halaman)
   - [4.1 LoginScreen (`login`)](#41-loginscreen-login)
   - [4.2 BukaShiftScreen (`bukaShift`)](#42-bukashiftscreen-bukashift)
   - [4.3 CheckoutScreen (`checkout`) & Nav Drawer](#43-checkoutscreen-checkout--nav-drawer)
   - [4.4 PaymentModal (Sub-Tampilan Modal Bayar)](#44-paymentmodal-sub-tampilan-modal-bayar)
   - [4.5 SuccessScreen (`success`)](#45-successscreen-success)
   - [4.6 ManageProductsScreen (`manageProducts`)](#46-manageproductsscreen-manageproducts)
   - [4.7 AddEditProductModal (Sub-Tampilan Modal Produk)](#47-addeditproductmodal-sub-tampilan-modal-produk)
   - [4.8 ManagePromoScreen (`managePromo`)](#48-managepromoscreen-managepromo)
   - [4.9 AddEditPromoModal (Sub-Tampilan Modal Promo)](#49-addeditpromomodal-sub-tampilan-modal-promo)
   - [4.10 StokOpnameScreen (`stokOpname`)](#410-stokopnamescreen-stokopname)
   - [4.11 ReportScreen (`reports`) & Modal Laporan Shift](#411-reportscreen-reports--modal-laporan-shift)
   - [4.12 PettyCashScreen (`pettyCash`)](#412-pettycashscreen-pettycash)
   - [4.13 TutupShiftScreen (`tutupShift`)](#413-tutupshiftscreen-tutupshift)
   - [4.14 SettingsScreen (`settings`)](#414-settingsscreen-settings)
   - [4.15 KelolaResepScreen (`kelolaResep`)](#415-kelolaresepscreen-kelolaresep)
   - [4.16 OwnerDashboardScreen (`ownerDashboard`) & Modals](#416-ownerdashboardscreen-ownerdashboard--modals)
   - [4.17 QRMenuScreen (`qrMenu`) & Preview Modal](#417-qrmenuscreen-qrmenu--preview-modal)
5. [Temuan Khusus: Komponen Mati, Komponen Wrapper & Integrasi](#temuan-khusus-komponen-mati-komponen-wrapper--integrasi)

---

## LANGKAH 0 — AUDIT & PENEMUAN MANDIRI HALAMAN

Audit dilakukan dengan memeriksa secara silang antara router utama di `d:\Client-Dimsum\pos-kasir\src\App.tsx` dengan seluruh berkas komponen di folder `d:\Client-Dimsum\pos-kasir\src\components\`.

### 1. Daftar Route Terdaftar di `App.tsx` (Lines 20–24)
```typescript
type Screen =
  | 'login' | 'bukaShift' | 'checkout' | 'success'
  | 'manageProducts' | 'managePromo' | 'stokOpname'
  | 'reports' | 'pettyCash' | 'tutupShift' | 'settings'
  | 'qrMenu' | 'kelolaResep' | 'ownerDashboard'
```
Total terdaftar di state router: **14 identifier layar** (13 layar unik + 1 sub-alur).

### 2. Inventaris Berkas di Folder `src/components`
| Nama Berkas | Jenis / Peran | Status Sambungan ke Routing |
|---|---|---|
| `LoginScreen.tsx` | Screen Utama | **Terhubung** (`currentScreen === 'login'`) |
| `BukaShiftScreen.tsx` | Screen Utama | **Terhubung** (`currentScreen === 'bukaShift'`) |
| `CheckoutScreen.tsx` | Screen Utama POS | **Terhubung** (`currentScreen === 'checkout'`) |
| `PaymentModal.tsx` | Sub-Modal Transaksi | **Terhubung** (Dipanggil di dalam `CheckoutScreen.tsx`) |
| `SuccessScreen.tsx` | Screen Struk / Selesai | **Terhubung** (`currentScreen === 'success'`) |
| `ManageProductsScreen.tsx` | Screen Back-Office | **Terhubung** (`currentScreen === 'manageProducts'`) |
| `AddEditProductModal.tsx` | Sub-Modal Produk | **Terhubung** (Dipanggil di dalam `ManageProductsScreen.tsx`) |
| `ManagePromoScreen.tsx` | Screen Back-Office | **Terhubung** (`currentScreen === 'managePromo'`) |
| `AddEditPromoModal.tsx` | Sub-Modal Promo | **Terhubung** (Dipanggil di dalam `ManagePromoScreen.tsx`) |
| `StokOpnameScreen.tsx` | Screen Back-Office | **Terhubung** (`currentScreen === 'stokOpname'`) |
| `ReportScreen.tsx` | Screen Laporan | **Terhubung** (`currentScreen === 'reports'`) |
| `PettyCashScreen.tsx` | Screen Kas Kecil | **Terhubung** (`currentScreen === 'pettyCash'`) |
| `TutupShiftScreen.tsx` | Screen Kasir Tutup Sesi | **Terhubung** (`currentScreen === 'tutupShift'`) |
| `SettingsScreen.tsx` | Screen Pengaturan | **Terhubung** (`currentScreen === 'settings'`) |
| `KelolaResepScreen.tsx` | Screen Resep BOM | **Terhubung** (`currentScreen === 'kelolaResep'`) |
| `OwnerDashboardScreen.tsx` | Screen Command Center Owner | **Terhubung** (`currentScreen === 'ownerDashboard'`) |
| `QRMenuScreen.tsx` | Screen Menu Pelanggan | **Terhubung** (`currentScreen === 'qrMenu'`) |
| `PageShell.tsx` | Layout Shell Wrapper | **Komponen Bersama** (Dipakai oleh 9 screen back-office) |
| `CategoryIcons.tsx` | SVG Vector Icons | **Komponen Bersama** (Ikon Kukus, Goreng, Bakpao, Minuman, Dimsum) |
| `Sidebar.tsx` | Sidebar Navigasi Independen | ⚠️ **KODE MATI / TIDAK TERPAKAI (ORPHANED)** |

### 3. Temuan Kode Mati / Tidak Terpakai (Orphaned Component)
- **File:** `d:\Client-Dimsum\pos-kasir\src\components\Sidebar.tsx` dan `d:\Client-Dimsum\pos-kasir\src\context\SidebarContext.tsx`
- **Analisis Temuan:** Berkas `Sidebar.tsx` awalnya dibuat sebagai navigasi bilah kiri permanen (`w-[80px]`). Namun pada implementasi aktif:
  1. `App.tsx` membungkus aplikasi dengan `<SidebarProvider>`, tetapi **tidak pernah me-render `<Sidebar />`**.
  2. `CheckoutScreen.tsx` telah mengimplementasikan navigasi bawaan sendiri berupa **Nav Overlay Drawer (`isNavOpen`)** berlatar `#2B1810` selebar 256px.
  3. Seluruh screen back-office telah dibungkus oleh `<PageShell>` yang memiliki tombol `onBack` bawaan.
  4. Akibatnya, file `Sidebar.tsx` tidak memiliki pemanggil sama sekali di dalam aplikasi.

### 4. Temuan Route Rusak
- **Hasil Audit:** **0 route rusak**. Seluruh 14 screen string yang dievaluasi pada percabangan `App.tsx` (lines 48–137) memiliki file komponen yang eksis, valid, dan dapat dikompilasi tanpa error.

---

## PETA NAVIGASI & ARSITEKTUR LAYAR

```mermaid
flowchart TD
    Login["4.1 LoginScreen ('login')"]
    BukaShift["4.2 BukaShiftScreen ('bukaShift')"]
    Checkout["4.3 CheckoutScreen ('checkout')"]
    PayModal["4.4 PaymentModal (Modal)"]
    Success["4.5 SuccessScreen ('success')"]
    NavDrawer["4.3 Nav Drawer (Slide-out)"]
    
    OwnerDash["4.16 OwnerDashboardScreen ('ownerDashboard')"]
    OutletModal["Modal Tambah/Edit Cabang"]
    CashierModal["Modal Tambah/Edit Kasir"]
    
    Products["4.6 ManageProductsScreen ('manageProducts')"]
    ProdModal["4.7 AddEditProductModal (Modal)"]
    Resep["4.15 KelolaResepScreen ('kelolaResep')"]
    
    Promo["4.8 ManagePromoScreen ('managePromo')"]
    PromoModal["4.9 AddEditPromoModal (Modal)"]
    
    Opname["4.10 StokOpnameScreen ('stokOpname')"]
    Reports["4.11 ReportScreen ('reports')"]
    ShiftModal["Modal Preview Shift"]
    Petty["4.12 PettyCashScreen ('pettyCash')"]
    TutupShift["4.13 TutupShiftScreen ('tutupShift')"]
    Settings["4.14 SettingsScreen ('settings')"]
    QRMenu["4.17 QRMenuScreen ('qrMenu')"]
    QRPreview["Modal Preview HP"]

    Login -->|PIN Kasir Benar| BukaShift
    Login -->|Mode Owner + PIN Owner Benar| OwnerDash
    BukaShift -->|Konfirmasi Kas Awal| Checkout
    
    Checkout -->|Pilih Produk & Klik 'BAYAR'| PayModal
    PayModal -->|Sukses Bayar (gasApi.createTransaction)| Success
    Success -->|'Lewati & Transaksi Baru'| Checkout
    
    Checkout -->|Klik Tombol Burger Menu| NavDrawer
    NavDrawer -->|Pilih Menu| Reports
    NavDrawer -->|Pilih Menu| Petty
    NavDrawer -->|Pilih Menu| Products
    NavDrawer -->|Pilih Menu| Promo
    NavDrawer -->|Pilih Menu| Opname
    NavDrawer -->|Pilih Menu| QRMenu
    NavDrawer -->|Pilih Menu| Settings
    NavDrawer -->|Pilih Menu Tutup Shift| TutupShift
    NavDrawer -->|Jika Login sebagai Owner: 'Kembali ke Owner'| OwnerDash
    
    Products -->|Klik 'Tambah' / 'Edit'| ProdModal
    Products -->|Klik 'Atur Resep'| Resep
    Promo -->|Klik 'Buat Promo' / 'Edit'| PromoModal
    Reports -->|Klik 'Laporan Shift'| ShiftModal
    QRMenu -->|Klik 'Preview Menu Digital'| QRPreview
    
    OwnerDash -->|Klik 'Tambah/Edit Cabang'| OutletModal
    OwnerDash -->|Klik 'Tambah/Edit Kasir'| CashierModal
    OwnerDash -->|Klik 'Resep & Bahan Baku'| Resep
    OwnerDash -->|Klik 'Keluar'| Login
    
    TutupShift -->|Konfirmasi Tutup Shift (gasApi.saveShiftReport)| Login
```

---

## DESIGN TOKEN & PALET WARNA RESMI

Berdasarkan ekstraksi warna logo Hasuka Dimsum pada `prd/01-PRD-Design-Figma.md`:

| Token Figma | Kode Hex | Peran Antarmuka | Representasi Filosofis |
|---|---|---|---|
| `color-primary` | `#8B4A1E` | Tombol CTA utama, border aktif, tab aktif, badge cart | Coklat steamer bambu kukusan |
| `color-brand` / `color-danger` | `#B60000` | Header error, void, delete, logout, selisih minus | Merah menyala cap stempel logo |
| `color-success` | `#5B8A2E` | Uang pas, kembalian cukup, stok aman, sinkron | Hijau daun cilantro / kesegaran |
| `color-warning` | `#C9A227` | Stok menipis, offline alert, status dijadwalkan | Kuning kulit pangsit dimsum |
| `color-accent-promo` | `#DF690B` | Badge diskon promo, strip promo menu | Oranye saus asam manis / garnish wortel |
| `color-border` | `#C49A62` | Divider kartu, outline tombol sekunder | Emas tan pita ornamen |
| `color-surface` | `#F3E7CE` | Background panel samping, container aksen | Krem kulit lumpia lembut |
| `color-background` | `#FAF6ED` | Kanvas dasar seluruh aplikasi | Putih gading hangat (warm ivory) |
| `color-text` | `#2B1810` | Tipografi heading, teks nominal utama | Coklat pekat arang / kecap asin |
| `color-text-muted` | `#6B5448` | Label subjudul, caption sekunder | Coklat kayu redup |

---

## INVENTARISASI DETAIL TIAP HALAMAN

---

### 4.1 LoginScreen (`login`)
- **File Sumber:** `d:\Client-Dimsum\pos-kasir\src\components\LoginScreen.tsx`
- **Route Key:** `'login'`
- **Hak Akses:** Publik / Gerbang Pertama Aplikasi (Kasir & Pemilik)

#### A. Tata Letak Default (Default Visual Layout)
1. **Latar Belakang:** Menggunakan gradien halus `#FAF6ED` ke `#F3E7CE` dengan ilusi pattern ornamen oriental berulang.
2. **Kartu Terpusat (Center Modal Box):**
   - Dimensi: Lebar 440px, sudut membulat `rounded-3xl`, bayangan `shadow-2xl`.
   - Header Card: Menampilkan `HASUKA_LOGO` (gambar bulat 72px ber-border emas `#C49A62`), nama "HASUKA DIMSUM" dalam tipografi serif tebal warna `#2B1810`, serta subtitle dinamis tergantung mode.
3. **Toggle Mode (Owner vs Kasir):**
   - Terletak di atas keypad: Tombol pill ganda (Kasir Outlet vs Pemilik Bisnis).
   - Mode Kasir: Membuka seleksi dropdown / daftar nama kasir aktif (Sri Wahyuni, Budi Santoso, Ahmad Dani) dan memilih outlet.
   - Mode Pemilik: Menampilkan avatar Bpk. Haryanto dengan input PIN Master 6-digit.

#### B. Komponen Interaktif & Elemen Kontrol
- **Pill Switch Mode:** Tombol toggle transisi halus antara mode kasir shift dan mode owner.
- **Daftar Pilihan Kasir:** Tombol avatar kasir dengan badge nama dan cabang aktif.
- **PIN Dot Indicator:** 4 lingkaran untuk kasir (atau 6 lingkaran untuk owner) yang terisi titik coklat `#8B4A1E` saat digit ditekan.
- **Numpad Sentuh (Touch Keypad):**
  - Grid 3x4: Angka 1 sampai 9, tombol Kosongkan/Backspace ikon `Delete` berwarna merah `#B60000`, angka 0, dan tombol Bantuan/Cek.
  - Setiap penekanan tombol memiliki feedback `active:scale-95`.

#### C. Kondisi & Sub-Tampilan Layar (Screen States)
1. **State 1 — Default (Menunggu Input):**
   - 4 dot indikator berupa lingkaran bergaris tepi `#C49A62` kosong tanpa isi.
   - Pesan panduan: *"Masukkan 4 digit PIN kasir Anda"*.
2. **State 2 — Input Sedang Berjalan (Typing State):**
   - Dot terisi satu per satu dengan warna solid `#8B4A1E` dan animasi perbesaran skala halus.
3. **State 3 — PIN Salah (Error State):**
   - Animasi getar kartu (shake animation) dengan border kartu berubah menjadi merah `#B60000`.
   - Bunyi/haptic feedback, teks instruksi berubah merah: *"PIN salah, silakan coba lagi"*.
   - Ke-4 dot otomatis dikosongkan kembali setelah 600ms.
4. **State 4 — Verifikasi Berhasil (Success Transition):**
   - Dot berubah hijau `#5B8A2E`.
   - Jika Kasir: Navigasi otomatis ke layar `'bukaShift'`.
   - Jika Owner: Navigasi otomatis ke layar `'ownerDashboard'`.

#### D. Bukti Kode JSX Asli
```tsx
// Cuplikan LoginScreen.tsx baris 26-44: Penanganan PIN dan Validasi Otomatis
const handleDigit = (digit: string) => {
  if (pin.length >= maxDigits) return
  const nextPin = pin + digit
  setPin(nextPin)
  if (nextPin.length === maxDigits) {
    if (isOwnerMode) {
      if (nextPin === '888888') {
        setKasirInfo({ id: 'owner-1', name: 'Bpk. Haryanto', role: 'Owner' })
        onLoginSuccess('owner')
      } else {
        triggerError()
      }
    } else {
      if (nextPin === '1234') {
        setKasirInfo({ id: selectedCashier.id, name: selectedCashier.name, role: 'Kasir' })
        onLoginSuccess('cashier')
      } else {
        triggerError()
      }
    }
  }
}
```

---

### 4.2 BukaShiftScreen (`bukaShift`)
- **File Sumber:** `d:\Client-Dimsum\pos-kasir\src\components\BukaShiftScreen.tsx`
- **Route Key:** `'bukaShift'`
- **Hak Akses:** Kasir yang baru login

#### A. Tata Letak Default
1. **Struktur:** Layar penuh terpusat (`min-h-screen flex items-center justify-center`), kanvas berlatar `#FAF6ED`.
2. **Panel Kontainer:** Kotak tunggal berukuran 480px, `rounded-3xl`, latar putih susu dengan border ganda tan `#C49A62`.
3. **Header Informasi Shift:**
   - Menampilkan tanggal hari ini dalam format lokal Indonesia (misal: *Senin, 07 September 2026*).
   - Profil kasir aktif: Nama kasir, foto/inisial avatar, serta nama cabang aktif (contoh: *Hasuka Dimsum — Paskal 23*).

#### B. Komponen Interaktif & Elemen Kontrol
- **Layar Display Nominal Modal Awal (Cash Box Display):**
  - Kotak besar di bagian atas keypad dengan angka Rupiah font serif ukuran 36px warna `#2B1810`.
  - Prefix "Rp" warna `#6B5448`.
- **Numpad Finansial:**
  - Tombol 1–9, `Delete` (merah `#B60000`), `0`, dan tombol shortcut `000` untuk kemudahan pengetikan nominal ribuan Indonesia.
- **Tombol Cepat (Quick Chips):** Pilihan instan Rp 200.000, Rp 300.000, Rp 500.000.
- **Kolom Catatan Operasional:** Textarea opsional untuk mencatat kondisi fisik laci kas (misal: *"Uang pecahan Rp 5.000 dan Rp 2.000 lengkap"*).
- **Tombol Konfirmasi (CTA):** Tombol penuh `w-full py-4 rounded-2xl` warna `#8B4A1E` dengan teks *"Buka Kasir Sekarang"*.

#### C. Kondisi & Sub-Tampilan Layar
1. **State 1 — Nilai Kosong / Rp 0:**
   - Display menunjukkan *"Rp 0"*.
   - Tombol *"Buka Kasir Sekarang"* dalam kondisi disable (latar `#C49A62`, opacity 0.5, kursor not-allowed).
2. **State 2 — Nominal Terisi:**
   - Display angka berformat pemisah ribuan otomatis (contoh: *Rp 500.000*).
   - Tombol aktif menyala dengan warna `#8B4A1E` solid.
3. **State 3 — Konfirmasi Berhasil:**
   - Menyimpan kas modal awal ke state shift konteks global (`AppContext`).
   - Pindah layar ke POS Checkout (`'checkout'`).

#### D. Bukti Kode JSX Asli
```tsx
// Cuplikan BukaShiftScreen.tsx baris 61-77: Numpad nominal dan Tombol Konfirmasi
<div className="rounded-2xl p-4 mb-4 flex items-end justify-between" style={{ background: '#FAF6ED', border: '2px solid #8B4A1E' }}>
  <span className="text-[14px] font-bold" style={{ color: '#6B5448' }}>MODAL AWAL KAS</span>
  <span className="font-serif font-bold text-[32px] leading-none" style={{ color: '#2B1810' }}>
    Rp {parseInt(cashAmount || '0', 10).toLocaleString('id-ID')}
  </span>
</div>
<button
  onClick={handleConfirm}
  disabled={!cashAmount || parseInt(cashAmount, 10) <= 0}
  className="w-full py-4 rounded-2xl font-bold text-[16px] text-white transition-all shadow-lg"
  style={{ background: cashAmount ? '#8B4A1E' : '#C49A62', opacity: cashAmount ? 1 : 0.6 }}
>
  Buka Shift & Masuk Kasir
</button>
```

---

### 4.3 CheckoutScreen (`checkout`) & Nav Drawer
- **File Sumber:** `d:\Client-Dimsum\pos-kasir\src\components\CheckoutScreen.tsx`
- **Route Key:** `'checkout'`
- **Hak Akses:** Kasir & Owner (Layar Transaksi Inti POS)

#### A. Tata Letak Default (3-Zone Split Screen)
Layar POS dibagi menjadi 3 zona horizontal fleksibel yang dioptimalkan untuk tablet & layar sentuh:
1. **Zona 1 (Kiri - Bilah Kategori Navigasi):** Lebar 88px, latar coklat tua pekat `#2B1810`. Berisi tombol menu drawer hamburger di bagian paling atas, diikuti ikon kategori bertingkat: *Semua*, *Kukus* (ikon kukusan bambu), *Goreng* (ikon wajan mendidih), *Bakpao* (ikon bao beruap), *Minuman* (ikon cangkir), dan *Dimsum Spesial*. Di bagian paling bawah terdapat indikator status koneksi (Online/Offline) dan avatar kasir.
2. **Zona 2 (Tengah - Katalog & Pencarian Produk):** Area fleksibel (`flex-1`), latar krem gading `#FAF6ED`.
   - Header Katalog: Input pencarian real-time dengan ikon Search, informasi nama outlet, dan chip filter kategori aktif.
   - Grid Kartu Menu: Menampilkan kartu-kartu dimsum dalam grid 3 atau 4 kolom. Setiap kartu memiliki foto aspek 1:1, badge harga overlay semi-transparan, badge PROMO (oranye `#DF690B`), indikator qty di pojok kanan atas (`#8B4A1E`), serta nama menu di bawah foto.
3. **Zona 3 (Kanan - Panel Keranjang / Cart Panel):** Lebar 340px, latar `#F3E7CE` dengan garis batas vertikal tegas coklat 4px `#8B4A1E`.
   - Header Meja: Menampilkan nama meja aktif (default: *"Meja 01"*). Terdapat ikon pensil untuk inline-edit nomor meja pelanggan.
   - Daftar Item: Scrollable list item pesanan lengkap dengan stepper tambah/kurang (+/-), subtotal per baris, dan badge diskon.
   - Ringkasan Kasir & Tombol Bayar: Rincian Subtotal, Diskon Promo, Pajak PPN 11%, dan TOTAL AKHIR dalam font serif 24px warna `#8B4A1E`. Tombol raksasa *"BAYAR"* di posisi paling bawah.

#### B. Nav Overlay Drawer (`isNavOpen`)
- Ketika tombol burger menu di pojok kiri atas Zona 1 ditekan, muncul drawer slide-out selebar 256px berlatar `#2B1810` dengan efek backdrop blur:
  - Header: Logo Hasuka, nama aplikasi, identitas kasir yang bertugas.
  - Tombol Owner (khusus jika yang login adalah Owner): *"Kembali ke Owner (Command Center Pemilik)"*.
  - Daftar Rute Back-Office:
    1. *Kasir* (`checkout`)
    2. *Laporan* (`reports`)
    3. *Petty Cash* (`pettyCash`)
    4. *Manajemen Produk* (`manageProducts`)
    5. *Manajemen Promo* (`managePromo`)
    6. *Stok Opname* (`stokOpname`)
    7. *QR Menu* (`qrMenu`)
    8. *Pengaturan* (`settings`)
  - Tombol Bahaya di Bagian Bawah: *"Tutup Shift"* (merah `#F87171` dengan ikon `LogOut`), mengarahkan ke proses rekonsiliasi kas.

#### C. Kondisi & Sub-Tampilan Layar
1. **State 1 — Keranjang Kosong (Cart Empty State):**
   - Zona 3 menampilkan ilustrasi kukusan bambu monokrom redup, teks *"Belum Ada Pesanan"*, dan panduan *"Pilih produk di sebelah kiri untuk mulai"*.
   - Tombol BAYAR berubah abu-abu emas `#C49A62`, opacity 0.5, dan tidak dapat diklik.
2. **State 2 — Produk Habis (Habis / Out of Stock Overlay):**
   - Jika `stock === 0`, kartu produk di Zona 2 dilapisi overlay gelap 45% dengan badge kapsul hitam-krem bertuliskan *"HABIS"*.
   - Kartu tidak dapat ditambahkan ke keranjang saat disentuh.
3. **State 3 — Edit Nama Meja (Inline Table Renaming):**
   - Mengetuk judul *"Meja 01"* mengubah teks menjadi kolom input aktif dengan tombol centang hijau. Kasir dapat mengganti menjadi "Takeaway #04" atau "VIP 2".
4. **State 4 — Stepper Interaktif di Kartu & Cart:**
   - Mengetuk kartu produk pertama kali menambahkan 1 item ke cart dan memunculkan stepper kontrol langsung di atas kartu produk.
   - Mengurangi hingga 0 di cart akan menghapus item tersebut dari daftar pesanan.

#### D. Bukti Kode JSX Asli
```tsx
// Cuplikan CheckoutScreen.tsx baris 454-477: Inline Editable Table Name
{isEditingTable ? (
  <div className="flex items-center gap-2">
    <input
      autoFocus
      value={tableNameDraft}
      onChange={e => setTableNameDraft(e.target.value)}
      onKeyDown={e => { if (e.key === 'Enter') { setTableName(tableNameDraft || tableName); setIsEditingTable(false) } }}
      className="font-serif font-bold text-[24px] leading-none w-36 outline-none rounded-lg px-2 py-0.5"
      style={{ color: '#2B1810', background: 'white', border: '1.5px solid #8B4A1E' }}
    />
    <button onClick={() => { setTableName(tableNameDraft || tableName); setIsEditingTable(false) }} style={{ color: '#5B8A2E' }}>
      <Check size={18} strokeWidth={3} />
    </button>
  </div>
) : (
  <button onClick={() => { setTableNameDraft(tableName); setIsEditingTable(true) }} className="flex items-center gap-2 group">
    <h2 className="font-serif text-[26px] font-bold leading-none" style={{ color: '#2B1810' }}>{tableName}</h2>
    <Pencil size={14} color="#C49A62" className="opacity-0 group-hover:opacity-100 transition-opacity" />
  </button>
)}
```

---

### 4.4 PaymentModal (Sub-Tampilan Modal Bayar)
- **File Sumber:** `d:\Client-Dimsum\pos-kasir\src\components\PaymentModal.tsx`
- **Pemicu Tampil:** Tombol *"BAYAR"* di `CheckoutScreen.tsx` ditekan saat cart memiliki isi.
- **Struktur Modal:** Dialog modal 2 panel selebar 760px dengan sudut membulat 24px (`rounded-3xl`) di atas backdrop blur gelap `rgba(43,24,16,0.6)`.

#### A. Panel Kiri (Pilihan Metode & Ringkasan Pesanan)
- Lebar 320px, latar gelap `#2B1810`.
- 4 Tombol Pilihan Metode Pembayaran:
  1. **Tunai (Cash):** Ikon Banknote, deskripsi *"Pembayaran uang cash"*.
  2. **QRIS:** Ikon QrCode, deskripsi *"Scan QR code pelanggan"*.
  3. **Kartu (Card):** Ikon CreditCard, deskripsi *"Debit / Kredit / EDC"*.
  4. **Split:** Ikon SquareSplitHorizontal, deskripsi *"Bayar dua metode"*.
- Card Ringkasan Pesanan di bagian bawah: Subtotal, PPN, Biaya Layanan (jika aktif), dan TOTAL AKHIR dalam teks emas `#C49A62`.

#### B. Panel Kanan (Sub-Kondisi Metode Pembayaran)

##### 1. Sub-Kondisi: Tunai (`method === 'cash'`)
- **Display Uang Diterima:** Kotak putih besar dengan nominal Rupiah font mono 26px. Border otomatis berwarna hijau `#5B8A2E` jika uang yang dimasukkan mencukupi, atau krem jika masih kurang.
- **Banner Status Kembalian:**
  - Jika uang cukup: Kotak hijau muda `#EAF4E0` menampilkan *"Kembalian: Rp XX.XXX"*.
  - Jika uang kurang: Kotak merah muda `#FCE8E8` menampilkan *"Kurang Rp XX.XXX"*.
- **Tombol Cepat Pecahan Uang:** Pilihan cepat [Rp 20.000, Rp 50.000, Rp 100.000, Rp 200.000, Rp 500.000, dan Tombol "Pas"].
- **Numpad Tunai:** Angka 1-9, Backspace (merah), 0, dan 000.
- **Tombol Konfirmasi:** Teks dinamis *"Konfirmasi · Kembalian Rp XX.XXX"*. Tombol dinonaktifkan jika uang belum mencukupi.

##### 2. Sub-Kondisi: QRIS (`method === 'qris'`)
- Menampilkan kotak QR Code berukuran 176x176px di tengah layar.
- Total tagihan yang harus dibayar.
- Kotak status berkedip kuning lembut: *"Menunggu konfirmasi pembayaran..."*.
- Tombol konfirmasi manual kasir: *"Konfirmasi Pembayaran Rp XX.XXX"*.

##### 3. Sub-Kondisi: Kartu EDC (`method === 'card'`)
- Menampilkan ilustrasi kartu pembayaran.
- Teks panduan: *"Silakan proses kartu pada mesin EDC, lalu konfirmasi di bawah"*.
- Tampilan total nominal transaksi font serif 26px.
- Tombol konfirmasi: *"Konfirmasi Pembayaran Rp XX.XXX"*.

##### 4. Sub-Kondisi: Split Bill (`method === 'split'`)
- Menampilkan dua input nominal independen: *"Tunai"* dan *"QRIS"*.
- Kasir membagi nilai total tagihan ke dalam dua metode pembayaran terpisah.

#### C. Bukti Kode JSX Asli
```tsx
// Cuplikan PaymentModal.tsx baris 136-143: Kalkulasi visual kembalian / kekurangan tunai
{received && (
  <div className="rounded-xl px-4 py-2 mb-2.5 flex items-center justify-between" style={{ background: isEnough ? '#EAF4E0' : '#FCE8E8' }}>
    <span className="text-[12px] font-bold" style={{ color: isEnough ? '#5B8A2E' : '#B60000' }}>
      {isEnough ? 'Kembalian' : `Kurang ${fmt(totalAmount - parsed)}`}
    </span>
    {isEnough && <span className="font-mono font-bold text-[16px]" style={{ color: '#5B8A2E' }}>{fmt(kembalian)}</span>}
  </div>
)}
```

---

### 4.5 SuccessScreen (`success`)
- **File Sumber:** `d:\Client-Dimsum\pos-kasir\src\components\SuccessScreen.tsx`
- **Route Key:** `'success'`
- **Pemicu Masuk:** Transaksi selesai dibayar di `PaymentModal`.

#### A. Tata Letak Default (Split Layout)
1. **Sisi Kiri (Status Sukses & Tombol Aksi):**
   - Lingkaran centang hijau besar 96px (`#5B8A2E`) dengan animasi fade-in lembut.
   - Heading font serif: *"Transaksi Berhasil!"*.
   - Informasi kembalian yang wajib diserahkan kasir kepada pelanggan dalam kartu hijau mencolok.
   - Nomor struk unik (`#HSK-YYYYMMDD-XXXX`), nama meja, dan nama kasir.
   - Kumpulan tombol aksi:
     - Tombol 1 (Coklat `#8B4A1E`): *"Cetak Struk (80mm)"* dengan ikon Printer.
     - Tombol 2 (Hijau WhatsApp `#25D366`): *"Kirim via WhatsApp"*.
     - Tombol 3 & 4 (Grid ganda putih border krem): *"Email"* dan *"PDF"*.
   - Tombol Bawah: *"Lewati & Transaksi Baru →"*, mereset keranjang belanja dan kembali ke POS utama.
2. **Sisi Kanan (Live Receipt Preview):**
   - Lebar 360px, latar putih kertas struk dengan batas kiri coklat 4px `#8B4A1E`.
   - Menggunakan font monospace termal menyerupai hasil cetakan printer thermal 80mm asli.
   - Rincian struk: Logo Hasuka, nama outlet, alamat, nomor telepon, metadata waktu transaksi, daftar item pesanan dengan rincian harga per porsi, subtotal, diskon promo, PPN 11%, total akhir, rincian uang diterima dan kembalian, serta footer ramah (*"Terima kasih atas kunjungan Anda"*).

#### B. Bukti Kode JSX Asli
```tsx
// Cuplikan SuccessScreen.tsx baris 48-53: Kartu Kembalian yang Harus Diserahkan
<div className="w-full max-w-xs rounded-2xl p-5 mb-8 text-center" style={{ background: '#EAF4E0', border: '2px solid #5B8A2E30' }}>
  <p className="text-[12px] font-bold mb-1" style={{ color: '#5B8A2E', letterSpacing: '0.06em' }}>KEMBALIAN</p>
  <p className="font-serif font-bold text-[36px]" style={{ color: '#5B8A2E' }}>{fmt(CHANGE)}</p>
  <p className="text-[12px] mt-1" style={{ color: '#6B5448' }}>Dari {fmt(RECEIVED)}</p>
</div>
```

---

### 4.6 ManageProductsScreen (`manageProducts`)
- **File Sumber:** `d:\Client-Dimsum\pos-kasir\src\components\ManageProductsScreen.tsx`
- **Route Key:** `'manageProducts'`
- **Struktur Pembungkus:** `<PageShell title="Manajemen Produk" ... rightPanelWidth={340}>`

#### A. Tata Letak Default
1. **Area Utama Kiri (Daftar Produk & Pencarian):**
   - Filter bar: Kolom pencarian nama produk, filter kategori pil (*Semua*, *Kukus*, *Goreng*, *Minuman*), serta tombol coklat *"+ Tambah"* di sudut kanan.
   - Daftar item produk: Baris-baris produk dengan thumbnail lingkaran, nama menu, harga jual, badge status stok (*HABIS* merah, *STOK RENDAH* kuning, *PROMO* oranye), serta indikator mode stok (Ikon Paket untuk stok langsung, Ikon Chef Hat untuk stok berbasis resep).
2. **Panel Kanan (Detail Produk Terpilih):**
   - Foto produk rasio lebar ber-overlay judul dan kategori.
   - Kotak Analisis Finansial: Grid 3 kolom menampilkan *Harga Jual*, *Harga Modal (HPP)*, dan kalkulasi otomatis persentase *Margin Keuntungan* dalam warna hijau.
   - Kotak Status Stok:
     - Jika Mode Resep: Menampilkan estimasi porsi yang dapat dimasak berdasarkan ketersediaan bahan baku paling kritis di resep (contoh: *"45 porsi bisa dibuat · Dibatasi oleh: Udang Kupang"*).
     - Jika Mode Langsung: Menampilkan jumlah unit fisik tersisa terhadap batas minimum.
   - Tombol Aksi Bawah: Tombol *"Atur Resep (Bahan Baku)"* (mengarahkan langsung ke layar resep) dan tombol *"Edit Produk Ini"* (membuka modal edit).

#### B. Bukti Kode JSX Asli
```tsx
// Cuplikan ManageProductsScreen.tsx baris 88-99: Kartu Finansial Margin & HPP
<div className="grid grid-cols-3 gap-2 mb-5 shrink-0">
  {[
    { label: 'Harga Jual', val: fmt(selected.price), color: '#8B4A1E' },
    { label: 'Harga Modal', val: fmt(selected.cost), color: '#6B5448' },
    { label: `Margin ${marginPct}%`, val: fmt(margin), color: '#5B8A2E' },
  ].map(c => (
    <div key={c.label} className="rounded-xl p-3 text-center" style={{ background: '#F3E7CE', border: '1px solid #E8D7C0' }}>
      <p className="font-bold text-[14px]" style={{ color: c.color }}>{c.val}</p>
      <p className="text-[10px] mt-0.5" style={{ color: '#6B5448' }}>{c.label}</p>
    </div>
  ))}
</div>
```

---

### 4.7 AddEditProductModal (Sub-Tampilan Modal Produk)
- **File Sumber:** `d:\Client-Dimsum\pos-kasir\src\components\AddEditProductModal.tsx`
- **Pemicu Tampil:** Tombol *"+ Tambah"* atau *"Edit Produk Ini"* di `ManageProductsScreen.tsx`.
- **Dimensi:** Lebar 600px, tinggi maks 90vh, latar krem `#FAF6ED`, scrollable body.

#### A. Formulir & Komponen Masukan
1. **Upload & Pratinjau Foto Produk:**
   - Thumbnail foto 80x80px dengan spinner loading saat proses unggah.
   - Pilihan URL gambar manual atau tombol *"Upload"* yang terhubung langsung ke file picker dan Google Apps Script image storage.
2. **Nama & Kategori Produk:**
   - Kolom nama wajib diisi.
   - Pilihan kategori berbasis tombol pil (*Kukus*, *Goreng*, *Minuman*, *Snack*, *Paket*).
3. **Harga Jual, Harga Modal & Margin Real-Time:**
   - Input harga jual dan input HPP.
   - Indikator badge otomatis menghitung selisih keuntungan nominal dan persentase margin secara live.
4. **Pemilih Mode Stok (Recipe vs Direct):**
   - Mode Resep (*"🍜 Berbasis Resep"*): Stok dikurangi otomatis dari bahan baku mentah melalui resep BOM.
   - Mode Langsung (*"📦 Stok Langsung"*): Memunculkan 2 kolom tambahan: *Stok Saat Ini* dan *Stok Minimum*.
5. **Konfigurasi Promo Produk:**
   - Toggle sakelar on/off promo.
   - Jika aktif, memunculkan kolom *Teks Promo* (misal: "20%") dan *Harga Normal Coret*.
6. **Ketersediaan Multi-Cabang:**
   - Radio pilihan: *"Semua Cabang"* vs *"Cabang Tertentu"*.
   - Jika cabang tertentu dipilih, muncul daftar centang checkbox seluruh outlet (Paskal, Braga, Dago, dll).
7. **Footer Modal:**
   - Tombol *"Batal"* dan tombol *"Simpan Perubahan"* / *"Tambah Produk"* lengkap dengan status loading saat transmisi API.

#### B. Bukti Kode JSX Asli
```tsx
// Cuplikan AddEditProductModal.tsx baris 176-187: Pemilihan Mode Stok Produk
{(['recipe', 'direct'] as const).map(mode => (
  <button key={mode} onClick={() => set('stock_mode', mode)}
    className="flex-1 py-2.5 rounded-xl font-bold text-[13px] transition-colors"
    style={{
      background: form.stock_mode === mode ? '#8B4A1E' : '#F3E7CE',
      color: form.stock_mode === mode ? 'white' : '#6B5448',
      border: `1.5px solid ${form.stock_mode === mode ? '#8B4A1E' : '#E8D7C0'}`,
    }}>
    {mode === 'recipe' ? '🍜 Berbasis Resep' : '📦 Stok Langsung'}
  </button>
))}
```

---

### 4.8 ManagePromoScreen (`managePromo`)
- **File Sumber:** `d:\Client-Dimsum\pos-kasir\src\components\ManagePromoScreen.tsx`
- **Route Key:** `'managePromo'`
- **Struktur Pembungkus:** `<PageShell title="Manajemen Promo" ... rightPanelWidth={340}>`

#### A. Tata Letak Default
1. **Area Kiri (Ringkasan & Daftar Promo):**
   - 3 Kartu Metrik Ringkas: *Promo Aktif* (hijau `#5B8A2E`), *Dijadwalkan* (kuning `#C9A227`), dan *Kedaluwarsa* (abu-abu `#6B5448`).
   - Daftar Kartu Promo: Menampilkan nama promo, badge status, tipe promo (Diskon %, Potongan Rp, Bundling, Gratis Item), serta periode tanggal berlaku.
2. **Panel Kanan (Detail Promo Terpilih):**
   - Badge status besar dan deskripsi ketentuan promo (misal: *"Hanya berlaku pukul 14:00–17:00 WIB"*).
   - Rincian parameter: Nilai potongan, daftar produk yang berlaku, dan tanggal periode.
   - Jika tipe promo adalah *Bundling*: Menampilkan daftar menu apa saja yang masuk ke dalam paket.
   - Tombol Aksi: *"Edit Promo Ini"*, tombol bahaya merah *"Nonaktifkan Promo"*, serta tombol bawah *"+ Buat Promo Baru"*.

#### B. Bukti Kode JSX Asli
```tsx
// Cuplikan ManagePromoScreen.tsx baris 6-10: Penataan Warna Status Promo
const STATUS_STYLE: Record<string, { bg: string; color: string }> = {
  'Aktif':        { bg: '#EAF4E0', color: '#5B8A2E' },
  'Kedaluwarsa':  { bg: '#F3F3F3', color: '#6B5448' },
  'Dijadwalkan':  { bg: '#FEF9EC', color: '#C9A227' },
}
```

---

### 4.9 AddEditPromoModal (Sub-Tampilan Modal Promo)
- **File Sumber:** `d:\Client-Dimsum\pos-kasir\src\components\AddEditPromoModal.tsx`
- **Pemicu Tampil:** Tombol *"+ Buat Promo Baru"* atau *"Edit Promo Ini"* di `ManagePromoScreen.tsx`.
- **Dimensi:** Lebar 640px, tinggi maks 90vh, latar `#FAF6ED`.

#### A. Komponen & Sub-Kondisi Tipe Promo
1. **Nama & Deskripsi Promo:** Kolom teks judul promo dan textarea syarat & ketentuan.
2. **Pilihan 4 Tipe Promo:**
   - **Diskon %:** Memunculkan kolom *Besar Diskon (%)*.
   - **Diskon Rp:** Memunculkan kolom *Nominal Diskon (Rp)*.
   - **Bundling:** Memunculkan kolom *Harga Paket Bundle (Rp)* dan daftar pilihan checklist produk yang masuk dalam paket (wajib pilih minimal 2 produk).
   - **Gratis Item:** Memunculkan kolom *Minimal Beli (Qty)* dan daftar pemilih radio produk mana yang akan diberikan secara cuma-cuma.
3. **Pemilih Produk Sasaran:** Pilihan menu apa saja yang dikenakan diskon jika bukan promo bundling.
4. **Rentang Tanggal Berlaku:** Dua date-picker (*Tanggal Mulai* dan *Tanggal Selesai*).
5. **Status Promo:** Tombol pilihan langsung (*Aktif* vs *Dijadwalkan*).

#### B. Bukti Kode JSX Asli
```tsx
// Cuplikan AddEditPromoModal.tsx baris 160-179: Sub-Kondisi Pemilihan Menu Bundling
{form.type === 'bundling' && (
  <div>
    <label className="block text-[11px] font-bold mb-2" style={{ color: '#6B5448', letterSpacing: '0.06em' }}>PRODUK DALAM BUNDLE (pilih minimal 2)</label>
    <div className="flex flex-col gap-1.5">
      {SAMPLE_PRODUCTS.map(p => {
        const isIn = form.bundleProducts?.some(x => x.productId === p.id)
        return (
          <button key={p.id} onClick={() => toggleBundleProduct(p.id, p.name)}
            className="flex items-center gap-3 px-4 py-2.5 rounded-xl text-left transition-all"
            style={{ background: isIn ? '#F3E7CE' : 'white', border: `1px solid ${isIn ? '#8B4A1E' : '#E8D7C0'}` }}>
            <div className="w-4 h-4 rounded flex items-center justify-center shrink-0" style={{ background: isIn ? '#8B4A1E' : 'transparent', border: `1.5px solid ${isIn ? '#8B4A1E' : '#C49A62'}` }}>
              {isIn && <span className="text-white text-[10px] font-bold leading-none">✓</span>}
            </div>
            <span className="text-[13px] font-semibold" style={{ color: '#2B1810' }}>{p.name}</span>
          </button>
        )
      })}
    </div>
  </div>
)}
```

---

### 4.10 StokOpnameScreen (`stokOpname`)
- **File Sumber:** `d:\Client-Dimsum\pos-kasir\src\components\StokOpnameScreen.tsx`
- **Route Key:** `'stokOpname'`
- **Struktur Pembungkus:** `<PageShell title="Stok Opname" subtitle="Hitung fisik bahan baku & kemasan" ...>`

#### A. Tata Letak Default
1. **Bilah Progress Penghitungan:**
   - Menampilkan persentase progress penghitungan fisik bahan baku.
   - Menampilkan badge merah peringatan jumlah item selisih jika ada (`AlertTriangle`), serta rasio bahan terhitung terhadap total bahan terlacak (misal: *7/12*).
2. **Bilah Pencarian & Filter Pelacakan:**
   - Input cari nama bahan baku/kemasan.
   - Tombol toggle mata: *"Tampilkan/Sembunyikan bahan tidak dilacak (saus, chili oil, dll)"*.
3. **Tabel Penghitungan Fisik (Grid 12 Kolom):**
   - Kolom 1–5: Nama Bahan Baku & Kemasan beserta satuan ukur (gram, pcs, pack).
   - Kolom 6–7: Stok Menurut Sistem (data buku).
   - Kolom 8–10: Input Stepper Fisik Nyata.
   - Kolom 11–12: Status Selisih.
4. **Bilah Bawah (Sticky Footer):**
   - Tombol submit penuh: *"Simpan & Sinkronkan Stok (X bahan)"*.

#### B. Kondisi & Sub-Tampilan Baris Tabel
1. **State Belum Dihitung (`physical === null`):**
   - Menampilkan tombol *" + Hitung "* berwarna krem. Selisih berupa strip abu-abu `—`.
2. **State Dihitung & Sesuai Fisik (`physical === current_stock`):**
   - Muncul ikon centang hijau `CheckCircle2` (`#5B8A2E`). Latar baris putih normal.
3. **State Selisih Kurang (`physical < current_stock`):**
   - Latar baris bernuansa merah muda pucat `#FFF0F0` dengan garis kiri merah 3px `#B60000`.
   - Angka selisih negatif merah menyala (contoh: *-150*).
4. **State Selisih Lebih (`physical > current_stock`):**
   - Latar baris hijau muda pucat `#F0FFF0` dengan garis kiri hijau `#5B8A2E`.
   - Angka selisih positif hijau (contoh: *+50*).
5. **State Bahan Tidak Dilacak (`!is_tracked`):**
   - Baris tampil redup (opacity 0.55), kolom fisik menampilkan badge *"Skip"*, tidak dihitung dalam akumulasi progress.

#### C. Bukti Kode JSX Asli
```tsx
// Cuplikan StokOpnameScreen.tsx baris 98-102: Indikasi Visual Warna Selisih Baris Opname
background: isUntracked ? '#FAF6ED' : hasDiff ? (diff! < 0 ? '#FFF0F0' : '#F0FFF0') : (i % 2 === 0 ? '#FAF6ED' : 'white'),
borderBottom: '1px solid #E8D7C040',
borderLeft: `3px solid ${isUntracked ? '#E8D7C0' : hasDiff ? (diff! < 0 ? '#B60000' : '#5B8A2E') : 'transparent'}`,
opacity: isUntracked ? 0.55 : 1,
```

---

### 4.11 ReportScreen (`reports`) & Modal Laporan Shift
- **File Sumber:** `d:\Client-Dimsum\pos-kasir\src\components\ReportScreen.tsx`
- **Route Key:** `'reports'`
- **Struktur Pembungkus:** `<PageShell title="Laporan Penjualan" ... rightPanelWidth={200}>`

#### A. Tata Letak Default
1. **Panel Kanan (Navigasi Kategori Laporan):**
   - 5 Menu Tab: *Penjualan Harian*, *Laporan Produk*, *Laporan Kasir*, *Laporan Promo*, dan *Ekspor Data*.
   - Tombol Bawah Terpisah: *"Laporan Shift"* dengan ikon dokumen.
2. **Area Konten Utama Kiri:**
   - Filter Waktu & Tombol Export: Tombol pil periode (*Hari Ini*, *Minggu Ini*, *Bulan Ini*, *Custom*) dan tombol *"Export"*.
   - 4 Kartu KPI Utama:
     - *Total Omzet* (Rp 4.312.500) dengan persentase pertumbuhan hijau.
     - *Jumlah Transaksi* (47 trx) dengan rata-rata ticket size.
     - *Jumlah Pelanggan* (38 dine-in + 9 takeaway).
     - *Item Terjual* (184 porsi) dengan rata-rata item per order.

#### B. Sub-Tampilan Tab Laporan
1. **Tab 'penjualan' (Default):**
   - Grafik Batang Penjualan (Daily Sales Bar Chart): Menampilkan 7 batang hari (Senin s.d. Minggu) dengan skala nilai Rupiah proporsional di sumbu Y. Batang hari ini diberi gradien coklat emas menonjol.
   - Tabel Produk Terlaris & Grafik Performa Kasir berjejer di bawah.
2. **Tab 'produk':** Menampilkan ranking lengkap produk terlaris beserta kuantitas porsi dan total omzet.
3. **Tab 'kasir':** Menampilkan rincian performa kasir (Sri Wahyuni, Budi Santoso, Ahmad Dani), jumlah transaksi yang diproses, dan progres bar rasio transaksi.
4. **Tab 'promo':** Menampilkan status placeholder: *"Belum ada data promo untuk periode ini"*.
5. **Tab 'ekspor':** Menampilkan panel tombol unduh *"Download Semua Data (CSV/Excel)"*.

#### C. Sub-Tampilan Modal Laporan Shift (`showShiftModal`)
- Ketika tombol *"Laporan Shift"* di panel kanan ditekan, muncul modal pop-up:
  - Header: *"Laporan Shift (Preview) — Rincian setoran kasir saat ini"*.
  - Rincian Keuangan:
    - *Total Penjualan:* Rp 4.312.500
    - *Modal Awal (Petty Cash):* Rp 500.000
    - *Total Uang di Laci Kas:* Rp 4.812.500
  - Tombol Aksi: Tombol *"Cetak"* (memanggil dialog cetak sistem browser `window.print()`) dan tombol *"Tutup"*.

#### D. Bukti Kode JSX Asli
```tsx
// Cuplikan ReportScreen.tsx baris 248-265: Isi Modal Rincian Laporan Shift
<div className="p-6 space-y-4">
  <div className="flex justify-between items-center text-[13px]">
    <span style={{ color: '#6B5448' }}>Total Penjualan:</span>
    <span className="font-bold" style={{ color: '#2B1810' }}>Rp 4.312.500</span>
  </div>
  <div className="flex justify-between items-center text-[13px]">
    <span style={{ color: '#6B5448' }}>Modal Awal (Petty Cash):</span>
    <span className="font-bold" style={{ color: '#2B1810' }}>Rp 500.000</span>
  </div>
  <div className="flex justify-between items-center text-[13px] border-t pt-4" style={{ borderColor: '#E8D7C0' }}>
    <span className="font-bold" style={{ color: '#8B4A1E' }}>Total Uang di Laci:</span>
    <span className="font-bold text-[16px]" style={{ color: '#8B4A1E' }}>Rp 4.812.500</span>
  </div>
</div>
```

---

### 4.12 PettyCashScreen (`pettyCash`)
- **File Sumber:** `d:\Client-Dimsum\pos-kasir\src\components\PettyCashScreen.tsx`
- **Route Key:** `'pettyCash'`
- **Struktur Pembungkus:** `<PageShell title="Petty Cash" subtitle="Catat pengeluaran kas kecil harian" ... rightPanelWidth={380}>`

#### A. Tata Letak Default
1. **Area Utama Kiri (Riwayat & Ringkasan Kas Kecil):**
   - 3 Kartu Saldo Kas Kecil: *Saldo Awal* (Rp 500.000), *Total Keluar* (Rp 85.000 merah `#B60000`), dan *Saldo Tersisa* (Rp 415.000 hijau `#5B8A2E`).
   - Riwayat Transaksi Hari Ini: Kartu daftar pengeluaran kas kecil (contoh: *Beli es batu 20kg*, *Ongkir bahan tambahan*, *Beli plastik wrap* lengkap dengan jam, pembuat, dan tag kategori).
2. **Panel Kanan (Formulir Pengeluaran & Numpad):**
   - Display Nominal Pengeluaran: Border berubah coklat `#8B4A1E` saat nominal diketik.
   - Numpad Layar Sentuh: Angka 1-9, Hapus (merah), 0, dan 000.
   - Dropdown Kategori: Pilihan kategori pengeluaran (*Bahan Baku*, *Transportasi & Ongkir*, *Peralatan & ATK*, *Kebersihan*, *Lainnya*).
   - Kolom Keterangan: Textarea alasan pembelian.
   - Tombol Unggah Foto: *"Foto Struk / Bukti (Opsional)"* bergaris putus-putus.
   - Tombol Submit Bawah: *"Simpan Pengeluaran"*.

#### B. Kondisi Layar
1. **State Nominal Kosong:** Tombol *"Simpan Pengeluaran"* disabled (opacity 0.6, warna emas `#C49A62`).
2. **State Nominal Terisi:** Tombol menyala coklat tua `#8B4A1E` dan dapat dieksekusi.

#### C. Bukti Kode JSX Asli
```tsx
// Cuplikan PettyCashScreen.tsx baris 150-160: Kartu Saldo Awal, Keluar, dan Sisa
<div className="grid grid-cols-3 gap-3 mb-5">
  {[
    { label: 'Saldo Awal', val: fmt(500000) },
    { label: 'Total Keluar', val: fmt(85000), color: '#B60000' },
    { label: 'Saldo Tersisa', val: fmt(415000), color: '#5B8A2E' },
  ].map(c => (
    <div key={c.label} className="rounded-2xl p-4 text-center" style={{ background: 'white', border: '1px solid #E8D7C0' }}>
      <p className="font-serif font-bold text-[18px]" style={{ color: c.color ?? '#2B1810' }}>{c.val}</p>
      <p className="text-[11px] mt-0.5" style={{ color: '#6B5448' }}>{c.label}</p>
    </div>
  ))}
</div>
```

---

### 4.13 TutupShiftScreen (`tutupShift`)
- **File Sumber:** `d:\Client-Dimsum\pos-kasir\src\components\TutupShiftScreen.tsx`
- **Route Key:** `'tutupShift'`
- **Struktur Pembungkus:** `<PageShell title="Tutup Shift" subtitle="Rekonsiliasi kas & penutupan sesi kasir" ... rightPanelWidth={380}>`

#### A. Tata Letak Default
1. **Area Utama Kiri (Ringkasan Shift & Tabel Rekonsiliasi):**
   - Kartu Info Shift Berjalan: Nama Kasir, Outlet, Waktu Mulai Shift (*08:00 WIB*), Durasi Shift (*7j 42m*).
   - Tabel Rincian Rekonsiliasi Kas:
     - *Kas Awal Shift:* Rp 500.000
     - *Penjualan Tunai:* +Rp 3.750.000 (hijau `#5B8A2E`)
     - *Refund Tunai:* -Rp 150.000 (merah `#B60000`)
     - *Pengeluaran Kas Kecil:* -Rp 85.000 (merah `#B60000`)
     - *Ekspektasi Sistem:* Rp 4.015.000 (font tebal dengan garis pemisah putus-putus)
     - *Kas Fisik Nyata (Hasil Input):* Rp 4.000.000
   - 3 Kartu Ringkasan Bawah: Total Transaksi (47), Omzet Hari Ini, Petty Cash Keluar.
2. **Panel Kanan (Input Fisik Uang Laci & Numpad):**
   - Display Nominal Uang Fisik Laci: Angka font serif 28px.
   - Badge Selisih Otomatis:
     - Jika Sama: Kotak hijau muda *"✓ Kas sesuai sistem"*.
     - Jika Beda: Kotak kuning/merah menampilkan selisih (contoh: *Selisih -Rp 15.000*).
   - Numpad Kas Fisik: Angka 1-9, Backspace (merah), 0, dan 000.
   - Textarea Alasan Selisih: Muncul hanya ketika ada selisih kas fisik vs sistem.
   - Tombol Submit Bahaya: Tombol merah `#B60000` dengan ikon `Check` bertuliskan *"Tutup Shift & Logout"*, mengirim payload laporan rekonsiliasi ke Google Sheets via `gasApi.saveShiftReport`.

#### B. Bukti Kode JSX Asli
```tsx
// Cuplikan TutupShiftScreen.tsx baris 64-76: Banner Dinamis Status Selisih Kas
{inputLaci && (
  <div
    className="rounded-xl p-3 mb-4 text-center"
    style={{
      background: !hasDiff ? '#EAF4E0' : (diff < 0 ? '#FCE8E8' : '#FEF9EC'),
      border: `1px solid ${!hasDiff ? '#5B8A2E' : (diff < 0 ? '#B60000' : '#C9A227')}30`,
    }}
  >
    <p className="text-[12px] font-bold" style={{ color: !hasDiff ? '#5B8A2E' : (diff < 0 ? '#B60000' : '#C9A227') }}>
      {!hasDiff ? '✓ Kas sesuai sistem' : `Selisih ${diff > 0 ? '+' : ''}${fmt(diff)}`}
    </p>
  </div>
)}
```

---

### 4.14 SettingsScreen (`settings`)
- **File Sumber:** `d:\Client-Dimsum\pos-kasir\src\components\SettingsScreen.tsx`
- **Route Key:** `'settings'`
- **Struktur Pembungkus:** `<PageShell title="Pengaturan Sistem" subtitle="Pajak, printer, QRIS, dan konfigurasi outlet" ... rightPanelWidth={220}>`

#### A. Tata Letak Default
1. **Panel Kanan (Menu Tab Kategori Pengaturan):**
   - 7 Menu: *Pajak & Biaya*, *Struk & Nota*, *Printer*, *QRIS*, *Detail Outlet*, *User & Akses*, *Integrasi*.
2. **Area Konten Utama Kiri (Sub-Tampilan per Tab):**

##### 1. Tab 'pajak' (Pajak & Biaya)
- **Kartu Pajak PPN:** Toggle on/off PPN. Jika on, muncul pilihan tarif instan [0%, 5%, 10%, 11%, 12%] serta kolom tarif kustom (0–100%).
- **Kartu Biaya Layanan (Service Charge):** Toggle on/off biaya layanan. Jika on, muncul pilihan [5%, 10%, 15%] dan input kustom.
- **Simulasi Perhitungan Live:** Menampilkan simulasi langsung harga makanan Rp 24.000 + PPN + Biaya Layanan = Total yang dibayar pelanggan.
- Tombol: *"Simpan Pengaturan Pajak"*.

##### 2. Tab 'struk' (Struk & Nota)
- Pengaturan Header Struk: Kolom Nama Outlet, Alamat Cabang, dan No. Telepon.
- Pengaturan Footer Struk: Textarea multi-line untuk kustomisasi pesan ramah penutup struk pelanggan.
- Tombol: *"Simpan Pengaturan Struk"*.

##### 3. Tab 'qris' (QRIS)
- Mode QRIS: Pilihan radio-card antara *QRIS Dinamis* (generate per transaksi via gateway) vs *QRIS Statis* (satu kode QR fisik tetap).
- Jika Statis: Muncul container upload gambar QR code dari bank.
- Banner Peringatan: Standarisasi sertifikasi Bank Indonesia.

##### 4. Tab 'integrasi' (Google Apps Script & Database)
- Status badge koneksi: `● Terkonfigurasi` (hijau) atau `○ Belum Dikonfigurasi` (merah).
- Input *Google Apps Script Web App URL* (`https://script.google.com/macros/s/.../exec`).
- Tombol Aksi:
  - *"Tes Koneksi"*: Menjalankan ping HTTP ke backend GAS (`gasApi.ping`).
  - *"Sinkronkan Data Sekarang"*: Mengunduh katalog produk, resep, dan bahan baku dari Google Sheets ke SQLite lokal (`gasApi.getInitialData`).
  - *"Simpan URL"*: Menyimpan URL ke local storage perangkat.
- Panduan Langkah Setup: 5 langkah ringkas integrasi Sheets.

##### 5. Tab 'printer', 'outlet', 'users'
- Menampilkan kartu status placeholder rapi: *"Fitur pengaturan ini sedang dalam pengembangan"*.

#### B. Bukti Kode JSX Asli
```tsx
// Cuplikan SettingsScreen.tsx baris 262-279: Status Konfigurasi Integrasi Cloud GAS
<div className="flex items-center justify-between mb-3">
  <div>
    <h3 className="font-bold text-[15px]" style={{ color: '#2B1810' }}>Database Google Sheets & Apps Script</h3>
    <p className="text-[12px]" style={{ color: '#6B5448' }}>
      Sinkronkan transaksi kasir, pengurangan stok resep, dan katalog produk langsung ke Google Spreadsheet Anda.
    </p>
  </div>
  <span
    className="px-3 py-1 rounded-full text-[11px] font-bold"
    style={{
      background: isConnected ? '#EAF3DE' : '#FCE8E6',
      color: isConnected ? '#3B6E1C' : '#C5221F',
      border: `1px solid ${isConnected ? '#C2E2A3' : '#F5C2C0'}`
    }}
  >
    {isConnected ? '● Terkonfigurasi' : '○ Belum Dikonfigurasi'}
  </span>
</div>
```

---

### 4.15 KelolaResepScreen (`kelolaResep`)
- **File Sumber:** `d:\Client-Dimsum\pos-kasir\src\components\KelolaResepScreen.tsx`
- **Route Key:** `'kelolaResep'`
- **Struktur Pembungkus:** `<PageShell title="Kelola Resep" subtitle="Atur bahan baku tiap menu — stok otomatis terpotong saat transaksi" ... rightPanelWidth={400}>`

#### A. Tata Letak Default
1. **Area Utama Kiri (Daftar Menu Berbasis Resep):**
   - Menampilkan seluruh menu dimsum yang memiliki `stock_mode === 'recipe'`.
   - Setiap kartu menampilkan foto menu, nama, harga, dan badge status ketersediaan resep (*X bahan resep ada* dalam teks hijau, atau *Belum ada resep* dalam teks merah).
2. **Panel Kanan (Editor Komposisi Bahan Baku BOM):**
   - Kondisi Belum Memilih: Menampilkan ilustrasi topi koki Chef Hat dan panduan *"Pilih Menu di kiri untuk mengubah resepnya"*.
   - Kondisi Terpilih:
     - Header Menu: Foto, nama menu, harga, dan kategori.
     - Kartu Baris Bahan Baku:
       - Dropdown Bahan Baku: Memilih dari katalog bahan mentah (misal: *Ayam Giling*, *Kulit Pangsit*, *Udang Kupang*). Terdapat penanda jika bahan tidak dilacak.
       - Stepper Takaran per Porsi: Input kuantitas presisi (misal: *30 gram* atau *3 pcs*) dengan tombol increment/decrement half-step (0.5).
       - Tombol Hapus: Ikon tong sampah merah `Trash2`.
     - Validasi Duplikat: Jika bahan baku yang sama dipilih lebih dari satu kali, muncul pesan peringatan merah *"Bahan ini sudah ada di resep — hapus yang duplikat"*.
     - Tombol *"+ Tambah Bahan"* bergaris putus-putus.
     - Tombol Bawah: *"Simpan Resep"* (terhubung ke `gasApi.saveRecipe`).

#### B. Bukti Kode JSX Asli
```tsx
// Cuplikan KelolaResepScreen.tsx baris 167-187: Stepper Presisi Takaran Bahan per Porsi
<div className="flex items-center rounded-xl overflow-hidden" style={{ border: '1.5px solid #8B4A1E', height: 40 }}>
  <button onClick={() => updateRow(row.localId, 'qty_per_unit', Math.max(0.5, row.qty_per_unit - 0.5))}
    className="w-10 h-full flex items-center justify-center shrink-0"
    style={{ background: '#F3E7CE', color: '#8B4A1E', fontWeight: 700, fontSize: 18 }}>−</button>
  <input
    type="number"
    min={0.5}
    step={0.5}
    value={row.qty_per_unit}
    onChange={e => updateRow(row.localId, 'qty_per_unit', Math.max(0.5, parseFloat(e.target.value) || 0.5))}
    className="flex-1 text-center font-extrabold text-[15px] outline-none h-full"
    style={{ color: '#2B1810', background: 'white' }} />
  <button onClick={() => updateRow(row.localId, 'qty_per_unit', row.qty_per_unit + 0.5)}
    className="w-10 h-full flex items-center justify-center shrink-0"
    style={{ background: '#8B4A1E', color: 'white', fontWeight: 700, fontSize: 18 }}>+</button>
</div>
```

---

### 4.16 OwnerDashboardScreen (`ownerDashboard`) & Modals
- **File Sumber:** `d:\Client-Dimsum\pos-kasir\src\components\OwnerDashboardScreen.tsx`
- **Route Key:** `'ownerDashboard'`
- **Hak Akses:** Khusus Akun Pemilik (Bpk. Haryanto)
- **Struktur Pembungkus:** `<PageShell title="Command Center Owner" ...>`

#### A. Tata Letak Header & Kontrol Eksekutif
1. **Dropdown Pemilih Cabang (Multi-Branch Selector):** Dropdown kustom di header kanan untuk memfilter data: *Semua Cabang (3 Outlet)*, *Paskal*, *Braga*, atau *Dago*.
2. **Filter Periode Waktu:** Tombol pil [*Hari Ini*, *7 Hari*, *Bulan Ini*, *Custom Date Picker*].
3. **Tombol Keluar:** Tombol merah untuk logout kembali ke layar Login.
4. **Navigasi 5 Sub-Tab Internal:**
   - `overview`: Ringkasan Eksekutif
   - `analytics`: Analisis & Margin
   - `branches`: Monitoring Cabang
   - `kasir`: Performa Kasir
   - `raw_stock`: Resep & Bahan Baku

#### B. Sub-Tampilan Tab Owner Dashboard
1. **Sub-Tab 1: Ringkasan Eksekutif (`overview`):**
   - 4 Kartu KPI Raksasa: *Total Omzet Kotor*, *Total Transaksi Selesai*, *Porsi Dimsum Terjual*, dan *Estimasi Margin Kotor* (~54.2%).
   - Grafik Pendapatan Harian Proporsional: Diagram batang harian dengan warna batang puncak dan rata-rata.
   - Tabel Produk Terlaris dan Ringkasan Kontribusi Cabang.
2. **Sub-Tab 2: Analisis & Margin (`analytics`):**
   - Grafik breakdown penjualan per kategori makanan (Kukus vs Goreng vs Minuman).
   - Analisis struktur HPP per menu dan identifikasi margin tertinggi vs terendah.
3. **Sub-Tab 3: Monitoring Cabang (`branches`):**
   - Menampilkan kartu untuk setiap outlet (Paskal, Braga, Dago).
   - Omzet outlet, jumlah tiket, status shift aktif, nama kasir bertugas, dan persentase pencapaian target.
   - Tombol *"+ Tambah Cabang Baru"* dan tombol *"Edit Cabang"*.
4. **Sub-Tab 4: Performa Kasir (`kasir`):**
   - Daftar kasir aktif di seluruh cabang.
   - Statistik transaksi per kasir, omzet yang dikumpulkan, jumlah void/pembatalan nota, dan role kasir.
   - Tombol *"+ Tambah Kasir Baru"* dan tombol *"Edit Kasir"*.
5. **Sub-Tab 5: Resep & Bahan Baku (`raw_stock`):**
   - Monitoring stok bahan baku kritis dengan peringatan stok di bawah ambang batas (low stock alert).
   - Tombol jalan pintas menuju layar Kelola Resep.

#### C. Sub-Tampilan Modal di Owner Dashboard
1. **Modal Kelola Outlet / Cabang (`isOutletModalOpen`):**
   - Pop-up dialog form: Input *Nama Cabang*, Textarea *Alamat Lengkap*, dan Input *Nomor Telepon*.
   - Terhubung langsung ke `gasApi.saveOutlet`.
2. **Modal Kelola Kasir (`isCashierModalOpen`):**
   - Pop-up dialog form: Input *Nama Kasir*, Dropdown *Penugasan Cabang*, dan Dropdown *Role* (*Kasir*, *Kasir Shift Siang*, *Kasir Shift Malam*, *Supervisor*).
   - Terhubung langsung ke `gasApi.saveCashier`.

#### D. Bukti Kode JSX Asli
```tsx
// Cuplikan OwnerDashboardScreen.tsx baris 320-337: Navigasi 5 Sub-Tab Owner
{[
  { id: 'overview', label: 'Ringkasan Eksekutif', icon: Activity },
  { id: 'analytics', label: 'Analisis & Margin', icon: BarChart2 },
  { id: 'branches', label: 'Monitoring Cabang', icon: Building2 },
  { id: 'kasir', label: 'Performa Kasir', icon: Users },
  { id: 'raw_stock', label: 'Resep & Bahan Baku', icon: ChefHat },
].map(tab => {
  const Icon = tab.icon
  const active = activeTab === tab.id
  return (
    <button key={tab.id} onClick={() => setActiveTab(tab.id as Tab)}
      className="flex items-center gap-2 px-4 py-2 rounded-xl text-[13px] font-bold transition-all"
      style={{ background: active ? '#8B4A1E' : 'transparent', color: active ? 'white' : '#6B5448' }}>
      <Icon size={16} />
      <span>{tab.label}</span>
    </button>
  )
})}
```

---

### 4.17 QRMenuScreen (`qrMenu`) & Preview Modal
- **File Sumber:** `d:\Client-Dimsum\pos-kasir\src\components\QRMenuScreen.tsx`
- **Route Key:** `'qrMenu'`
- **Struktur Pembungkus:** `<PageShell title="QR Menu Digital" ... rightPanelWidth={320}>`

#### A. Tata Letak Default
1. **Area Kiri (Kelola Tampilan Menu):**
   - Daftar menu dikelompokkan berdasarkan kategori: *Kukus*, *Goreng*, *Minuman*.
   - Setiap baris memiliki toggle switch untuk menampilkan atau menyembunyikan produk di menu digital pelanggan (`shown: boolean`).
   - Tombol pensil untuk inline-edit nama produk khusus untuk menu QR.
   - Badge visual: *"Tampil"* (hijau `#5B8A2E`) atau *"Tersembunyi"* (abu-abu `#9CA3AF`).
2. **Panel Kanan (Display QR Code & Tautan Menu):**
   - Kotak QR Code besar (120px) dengan efek regenerasi animasi putar `RefreshCw`.
   - URL Bar: Menampilkan link menu (`hasuka.menu/paskal/01`) dengan tombol *"Salin Tautan"*.
   - Tombol Aksi:
     - *"Preview Menu Digital"* (membuka pop-up simulasi smartphone pelanggan).
     - *"Buka di Browser"* (membuka tab browser eksternal).
     - *"Regenerate"* dan *"Cetak QR"*.
   - Statistik Cepat: Jumlah scan hari ini dan total menu yang ditampilkan.

#### B. Sub-Tampilan Modal Pratinjau Smartphone (`previewOpen`)
- Ketika tombol *"Preview Menu Digital"* ditekan, muncul modal simulasi tampilan layar HP pelanggan (lebar 380px):
  - Header gelap oriental bertuliskan *"Hasuka Dimsum — Menu Digital"*.
  - Menampilkan hanya produk-produk yang statusnya aktif (`shown === true`).
  - Dikelompokkan per kategori lengkap dengan harga resmi.
  - Tombol tutup silang di pojok kanan atas.

#### C. Bukti Kode JSX Asli
```tsx
// Cuplikan QRMenuScreen.tsx baris 195-226: Modal Pratinjau HP Pelanggan
{previewOpen && (
  <div className="fixed inset-0 z-50 flex items-center justify-center" style={{ background: 'rgba(43,24,16,0.7)', backdropFilter: 'blur(4px)' }} onClick={() => setPreviewOpen(false)}>
    <div className="relative rounded-3xl overflow-hidden shadow-2xl" style={{ width: 380, maxHeight: '85vh', background: '#FAF6ED' }} onClick={e => e.stopPropagation()}>
      <div className="flex items-center justify-between px-6 py-4" style={{ borderBottom: '1px solid #E8D7C0', background: '#2B1810' }}>
        <div>
          <p className="font-serif font-bold text-[16px]" style={{ color: '#F3E7CE' }}>Hasuka Dimsum</p>
          <p className="text-[11px]" style={{ color: '#C49A62' }}>Menu Digital — Preview</p>
        </div>
        <button onClick={() => setPreviewOpen(false)} className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: '#3D2315' }}>
          <X size={16} color="#C49A62" />
        </button>
      </div>
      {/* ... Render Menu Pelanggan ... */}
    </div>
  </div>
)}
```

---

## TEMUAN KHUSUS: KOMPONEN MATI, KOMPONEN WRAPPER & INTEGRASI

### 1. Rincian Komponen Mati: `Sidebar.tsx`
- **Lokasi Berkas:** `d:\Client-Dimsum\pos-kasir\src\components\Sidebar.tsx`
- **Tujuan Asal:** Memfasilitasi bilah menu tetap di sisi kiri layar dengan lebar `80px`.
- **Kondisi Aktual:**
  - Tidak diimpor atau dirender sama sekali di `App.tsx`.
  - Fungsi navigasinya telah sepenuhnya digantikan oleh:
    1. Bilah Kategori Vertikal (88px) di `CheckoutScreen.tsx`.
    2. Nav Drawer Slide-out (`isNavOpen`) di `CheckoutScreen.tsx`.
    3. Bilah Navigasi Bawaan di `<PageShell>` untuk seluruh screen back-office.
- **Rekomendasi Pembersihan:** Berkas `Sidebar.tsx` dan hook `useSidebar()` di `SidebarContext.tsx` dapat dihapus dengan aman untuk merapikan codebase (Zero Dead-Code).

### 2. Komponen Shell Bersama: `PageShell.tsx`
- **Lokasi Berkas:** `d:\Client-Dimsum\pos-kasir\src\components\PageShell.tsx`
- **Peran:** Layout template standar yang membungkus 9 halaman back-office:
  1. Header atas: Judul halaman, subjudul/deskripsi, tombol kembali (`onBack`), dan wadah kontrol opsional kanan (`headerRight`).
  2. Pembagian layout 2 panel otomatis jika prop `rightPanel` disediakan (digunakan pada Manajemen Produk, Promo, Petty Cash, Tutup Shift, Laporan, Pengaturan, Resep, dan QR Menu).
  3. Menyediakan scrollbar kustom dengan tema warna tan dan krem Hasuka.

### 3. Matriks Status Kesiapan Integrasi Backend (Cloud GAS vs Local Mock)
| Layar / Fitur | Status Wire-up Backend | Keterangan Teknis |
|---|---|---|
| **Login Kasir / Owner** | ✅ **Lokal (Instan)** | Validasi PIN cepat di client/SQLite tanpa latensi jaringan |
| **Buka Shift** | ✅ **State Global** | Disimpan ke `AppContext` untuk sesi kasir aktif |
| **Transaksi & Checkout** | ✅ **GAS + SQLite Outbox** | Memanggil `gasApi.createTransaction()` dan antrean offline `db.ts` |
| **Simpan Laporan Shift** | ✅ **GAS Connected** | Memanggil `gasApi.saveShiftReport()` saat Tutup Shift |
| **Upload Foto Menu** | ✅ **GAS Connected** | Mengunggah gambar via `gasApi.uploadImage()` |
| **Simpan Produk & Resep** | ✅ **GAS Connected** | Memanggil `gasApi.saveProduct()` dan `gasApi.saveRecipe()` |
| **Kelola Cabang & Kasir** | ✅ **GAS Connected** | Memanggil `gasApi.saveOutlet()` dan `gasApi.saveCashier()` |
| **Riwayat Petty Cash** | ⚠️ **Mock Data** | Masih menggunakan konstanta `HISTORY` lokal di komponen |
| **Statistik Laporan Penjualan** | ⚠️ **Mock Data** | Menggunakan konstanta `DAILY_DATA` & `TOP` di `ReportScreen` |
| **Stok Opname Submit** | ⚠️ **UI Only** | Tombol simpan belum disambungkan ke fungsi mutasi SQLite/GAS |
