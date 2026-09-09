# Laporan Audit Struktur Proyek Pos Kasir Hasuka (TERVERIFIKASI)

Laporan ini dibuat dengan aturan ketat: SETIAP klaim didukung oleh bukti konkret dari baris kode yang benar-benar ada di file, setelah dilakukan pembacaan ulang pada sesi ini.

## Langkah 0: Bukti Listing File
Berikut adalah hasil mentah dari eksekusi perintah shell untuk melist file di dalam folder `src/components` dan `src/services` pada saat audit ini dilakukan:

```text
FullName                                                           
--------                                                           
D:\Client-Dimsum\pos-kasir\src\components\AddEditProductModal.tsx  
D:\Client-Dimsum\pos-kasir\src\components\AddEditPromoModal.tsx    
D:\Client-Dimsum\pos-kasir\src\components\BukaShiftScreen.tsx      
D:\Client-Dimsum\pos-kasir\src\components\CheckoutScreen.tsx       
D:\Client-Dimsum\pos-kasir\src\components\KelolaBahanBakuScreen.tsx
D:\Client-Dimsum\pos-kasir\src\components\KelolaResepScreen.tsx    
D:\Client-Dimsum\pos-kasir\src\components\LoginScreen.tsx          
D:\Client-Dimsum\pos-kasir\src\components\ManageProductsScreen.tsx 
D:\Client-Dimsum\pos-kasir\src\components\ManagePromoScreen.tsx    
D:\Client-Dimsum\pos-kasir\src\components\OwnerDashboardScreen.tsx 
D:\Client-Dimsum\pos-kasir\src\components\PageShell.tsx            
D:\Client-Dimsum\pos-kasir\src\components\PaymentModal.tsx         
D:\Client-Dimsum\pos-kasir\src\components\PettyCashScreen.tsx      
D:\Client-Dimsum\pos-kasir\src\components\QrMenuScreen.tsx         
D:\Client-Dimsum\pos-kasir\src\components\ReportScreen.tsx         
D:\Client-Dimsum\pos-kasir\src\components\SettingsScreen.tsx       
D:\Client-Dimsum\pos-kasir\src\components\ShiftSummaryScreen.tsx   
D:\Client-Dimsum\pos-kasir\src\components\Sidebar.tsx              
D:\Client-Dimsum\pos-kasir\src\components\StokOpnameScreen.tsx     
D:\Client-Dimsum\pos-kasir\src\components\SuccessScreen.tsx        
D:\Client-Dimsum\pos-kasir\src\components\TutupShiftScreen.tsx     
D:\Client-Dimsum\pos-kasir\src\services\db.ts                      
D:\Client-Dimsum\pos-kasir\src\services\gasApi.ts                  
D:\Client-Dimsum\pos-kasir\src\services\printer.ts                 
D:\Client-Dimsum\pos-kasir\src\services\syncWorker.ts              
```


## 1. STATUS HALAMAN & FITUR (Level Komponen)

Berikut adalah hasil audit ulang komponen-komponen yang telah dibaca secara langsung:

### 1. Layar Kasir (`CheckoutScreen.tsx`)
- **Fitur UI (Kategori & Grid Menu)**: Terbukti ada.
  - Bukti: Terdapat array kategori statis dan rendering grid menu dari `PRODUCTS`.
  - Kutipan (`src/components/CheckoutScreen.tsx:11-19`):
    ```tsx
    const CATEGORIES = [
      { id: 'semua', label: 'Semua', icon: CategoryIconSemua },
      { id: 'promo', label: '🔥 Promo', icon: CategoryIconPromo },
      // ...
    ]
    ```
- **Klaim "Dine In/Takeaway"**: **TERBUKTI SALAH / TIDAK ADA**.
  - Fakta: Setelah membedah 726 baris kode di `CheckoutScreen.tsx`, tidak ada satu pun elemen UI, state, atau variabel yang menangani status "Dine In" atau "Takeaway". Bagian header hanya berisi pilihan meja (Meja Aktif) yang dapat diubah namanya (`tableName`), namun bukan tipe pesanan.
  - Akar Masalah: Laporan sebelumnya berasumsi (halusinasi) berdasarkan fitur aplikasi POS pada umumnya, tanpa benar-benar merujuk pada kode nyata.
- **Klaim "Shortcut numpad"**: **TERBUKTI SALAH / TIDAK ADA** di komponen ini (numpad ada di modal pembayaran, tapi bukan sebagai shortcut di CheckoutScreen).
- **Integrasi Transaksi**: Terbukti fungsi pemanggilan ke gasApi ada.
  - Bukti (`src/components/CheckoutScreen.tsx:176-193`):
    ```tsx
    const handlePaymentSuccess = async () => {
      try {
        await gasApi.createTransaction({
          cashier: kasirInfo?.name || 'Kasir Hasuka',
          subtotal,
          promo_discount: discount,
          // ...
    ```

### 2. Halaman Login (`LoginScreen.tsx`)
- **Tampilan PIN Pad**: Terbukti ada.
- **Klaim "Validasi PIN 1234, 2345 dari mockData"**: **TERBUKTI SALAH**.
  - Fakta: PIN di-hardcode persis hanya angka `'654321'` di dalam kode komponen. Tidak ada pencarian dari array `mockData`.
  - Bukti (`src/components/LoginScreen.tsx:23-24`):
    ```tsx
    if (next.length === 6) {
      if (next === '654321') {
        const kasir = displayCashiers.find(k => k.id === selectedKasir)
    ```
  - Fakta: Login owner juga di-hardcode ke 'admin123' atau 'hasuka888'.
  - Bukti (`src/components/LoginScreen.tsx:47-49`):
    ```tsx
    const valid =
      (username.toLowerCase() === 'admin' && password === 'admin123') ||
      (username.toLowerCase() === 'owner' && (password === 'hasuka888' || password === 'admin123'))
    ```

### 3. Buka Shift (`BukaShiftScreen.tsx`)
- **Form Input Buka Shift**: Terbukti ada.
- **Panggilan Action**: Terbukti memicu props `onBukaShift` jika memiliki nominal, bukan mengubah state context langsung di dalam file ini.
  - Bukti (`src/components/BukaShiftScreen.tsx:177-178`):
    ```tsx
    <button
      onClick={() => hasNominal && onBukaShift()}
      disabled={!hasNominal}
    ```

### 4. Modal Pembayaran (`PaymentModal.tsx`)
- **Logika UI Uang Pas & Custom**: Terbukti ada dan menghitung kembalian.
  - Bukti (`src/components/PaymentModal.tsx:45-46`):
    ```tsx
    const parsed = parseInt(received.replace(/\D/g, '') || '0', 10)
    const kembalian = parsed >= totalAmount ? parsed - totalAmount : 0
    ```
- **Klaim "Belum mendukung split bill"**: **TERBUKTI SALAH**.
  - Fakta: Fitur Split bill didukung di UI (meskipun logikanya mungkin baru sebatas UI).
  - Bukti (`src/components/PaymentModal.tsx:199-201`):
    ```tsx
    {method === 'split' && (
      <div className="flex flex-col flex-1 py-2">
        <h3 className="font-serif font-bold text-[18px] mb-1" style={{ color: '#2B1810' }}>Bayar Split</h3>
    ```

### 5. Layar Sukses (`SuccessScreen.tsx`)
- **UI Sukses & Kembalian**: Terbukti ada, tetapi nilainya **hardcoded** statis di dalam komponen, bukan dari transaksi riil.
  - Bukti (`src/components/SuccessScreen.tsx:13`):
    ```tsx
    const SUBTOTAL = 88500, DISCOUNT = 5250, TAX = 9163, TOTAL = 92413, RECEIVED = 100000, CHANGE = 7587
    ```

*(Catatan: Audit file lainnya dibatasi pada file yang di-read di sesi ini agar laporan tetap sesuai fakta lapangan terkini dan 100% tervalidasi).*

---

## KLAIM YANG DIKOREKSI DARI LAPORAN SEBELUMNYA

Berdasarkan audit ketat yang mengacu langsung ke baris kode, berikut adalah kumpulan "halusinasi" atau kesalahan fatal yang ada pada laporan `PROJECT-STRUCTURE.md` sebelumnya:

1. **CheckoutScreen (Layar Kasir)**: 
   - *Klaim lama*: Ada fitur `order type (Dine In/Takeaway)` dan `shortcut numpad`.
   - *Koreksi*: **TIDAK ADA SAMA SEKALI.** Elemen-elemen ini murni halusinasi AI yang mengasumsikan standar fitur POS, karena di dalam kode `CheckoutScreen.tsx` tidak ditemukan state/UI untuk hal tersebut.
2. **LoginScreen (Login)**:
   - *Klaim lama*: Mengambil validasi PIN `1234, 2345` dari `mockData`.
   - *Koreksi*: **SALAH.** Validasi PIN dilakukan secara *hardcoded* dengan kode `'654321'` (baris 24), dan login Owner menggunakan `'admin'/'admin123'` atau `'owner'/'hasuka888'` (baris 48-49).
3. **PaymentModal (Modal Pembayaran)**:
   - *Klaim lama*: Belum mendukung split bill.
   - *Koreksi*: **SALAH.** Justru terdapat implementasi UI spesifik untuk metode `split` (baris 199), di mana total pembayaran dibagi dalam input Tunai dan QRIS (baris 207).
4. **SuccessScreen (Layar Sukses)**:
   - *Klaim lama*: "Data struk yang dicetak saat ini didapatkan dari properti (props) memori".
   - *Koreksi*: **SALAH.** Data struk dan nominal transaksi sepenuhnya di-*hardcode* di dalam file `SuccessScreen.tsx` (baris 13), bukan diambil via `props` (props yang ada hanya fungsi `onNewTransaction`).

### Analisis Akar Masalah:
Laporan sebelumnya (`PROJECT-STRUCTURE.md`) terjebak dalam jebakan LLM standar, yaitu mengisi "blank spot" (kekosongan memori saat menganalisis kode yang panjang) dengan **asumsi probabilistik** tentang apa yang *biasanya* ada dalam aplikasi Point of Sale (POS), ketimbang membacanya baris demi baris secara objektif. Untuk ke depannya, metode pengutipan bukti baris demi baris akan terus dipertahankan agar tidak ada asumsi fiktif yang lolos.
