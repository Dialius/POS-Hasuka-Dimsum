# PRD 09: Owner AI Insight Widget

**Status:** Approved / Implemented  
**Owner:** Owner Dashboard / Analytics  
**Version:** 1.1.0 (Dynamic Models, Multi-Provider Presets & Resiliency Fallbacks)  

---

## 1. Executive Summary & Objective
Menambahkan fitur **AI Insight** interaktif di halaman Owner (`OwnerDashboardScreen`) POS Hasuka Dimsum. Fitur ini membaca transaksi yang telah dimuat di client-side, merangkumnya menjadi snapshot metrik terstruktur, dan meminta model AI (default: Google Gemini API gratis) untuk menghasilkan ringkasan naratif bisnis yang tajam, akurat, dan dapat ditindaklanjuti oleh pemilik usaha.

Sistem tidak meng-hardcode nama model AI agar tahan terhadap siklus pensiun model oleh penyedia, mendukung berbagai preset penyedia AI gratis (Gemini, Groq, OpenRouter, Cerebras, Mistral, NVIDIA NIM, xAI) lewat OpenAI-compatible adapter, menyediakan mekanisme fallback (model cadangan dan retry tanpa `response_format`), serta dilengkapi panduan konfigurasi non-teknis bagi pemilik restoran (`docs/AI-SETUP.md`).

---

## 2. Core Requirements & Constraints

### 2.1 Backend (Google Apps Script)
1. **Endpoint & Action Routing:**
   - Aksi `aiAnalyze` didaftarkan di `doPost` dan `rpcPostAction` sebagai *early return* sebelum `LockService.waitLock`.
   - Memastikan operasi AI bersifat non-blocking (read-only) sehingga transaksi kasir di jam sibuk tidak terhambat.
2. **Script Properties:**
   - `AI_PROVIDER`: `gemini` (default), `openai`, atau preset otomatis: `groq`, `openrouter`, `cerebras`, `mistral`, `nvidia`, `xai`.
   - `AI_API_KEY`: Kunci API penyedia (wajib diisi di Project Settings GAS, tidak pernah di-commit ke Git/bundle atau dikirim ke klien).
   - `AI_MODEL`: **Wajib diisi**. Tidak ada nama model hardcoded. Wajib diisi dengan ID model aktif dari hasil fungsi `aiListModels` karena ID model sering dipensiunkan oleh penyedia AI. Jika kosong, sistem mengembalikan `[AI_NOT_CONFIGURED]` dengan instruksi mengisi `AI_MODEL` dari hasil `aiListModels`.
   - `AI_MODEL_FALLBACK`: Model cadangan opsional (dipilih dari hasil `aiListModels`). Jika model utama gagal dengan `[AI_MODEL_INVALID]` (404) atau 429 (`[AI_QUOTA]`), sistem mencoba model cadangan tepat 1 kali tanpa menghitung ganda kuota harian.
   - `AI_BASE_URL`: URL endpoint server AI kustom. Otomatis terisi default terverifikasi bila menggunakan preset provider. Nilai `AI_BASE_URL` yang diisi manual selalu menang atas preset.
   - `AI_OWNER_KEY`: Kunci pengaman opsional (jika diisi, `ownerKey` dari klien wajib sama persis).
   - `AI_DAILY_LIMIT`: Batas panggilan harian (default: 40).
3. **Preset Base URLs (Terverifikasi per 4 November 2026):**
   - Groq: `https://api.groq.com/openai/v1`
   - OpenRouter: `https://openrouter.ai/api/v1`
   - Cerebras: `https://api.cerebras.ai/v1`
   - Mistral: `https://api.mistral.ai/v1`
   - NVIDIA NIM: `https://integrate.api.nvidia.com/v1`
   - xAI: `https://api.x.ai/v1`
4. **Resiliency & Fallback Adapters:**
   - **Gemini**: Memanggil `generateContent` dengan header `x-goog-api-key`, `temperature: 0.2`, `responseMimeType: "application/json"`.
   - **OpenAI-Compatible Adapter**: Memanggil `{AI_BASE_URL}/chat/completions` dengan header `Authorization: Bearer`. Pertama kali mencoba dengan `response_format: { type: "json_object" }`. Jika penyedia membalas HTTP 400 (karena tidak mendukung parameter tersebut), sistem otomatis mengulangi SEKALI tanpa `response_format` dan mengandalkan parser toleran.
5. **External Fetch & OAuth Scopes:**
   - Memakai `UrlFetchApp.fetch` dengan `muteHttpExceptions: true`.
   - Memastikan `oauthScopes` di `appsscript.json` menyertakan `https://www.googleapis.com/auth/script.external_request`.
6. **Error Mapping:**
   - Status 401/403 $\rightarrow$ `[AI_NOT_CONFIGURED]`
   - Status 404 $\rightarrow$ `[AI_MODEL_INVALID]` ("Model AI sudah tidak tersedia. Ganti AI_MODEL di Script Properties dengan ID model dari hasil aiListModels.")
   - Status 429 $\rightarrow$ `[AI_QUOTA]`
   - Status 5xx / body tak valid $\rightarrow$ `[AI_BAD_RESPONSE]`
   - Kode akses salah $\rightarrow$ `[AI_FORBIDDEN]`
   - Limit harian habis $\rightarrow$ `[AI_RATE_LIMIT]`
   - Input snapshot tidak valid $\rightarrow$ `[AI_BAD_REQUEST]`
7. **Caching & Rate Limiting:**
   - Cache hasil via `CacheService.getScriptCache()` dengan hash SHA-256 dari snapshot & scope (TTL 900 detik / 15 menit). Parameter `force: true` melewati cache.
   - Penghitung harian disimpan per tanggal WIB (GMT+7) di Script Properties dengan `LockService.tryLock(2000)` singkat saat mutasi counter.
8. **Editor Helper Functions:**
   - `aiListModels()`: Mengambil daftar model aktif yang mendukung inferensi langsung dari penyedia dan mencetaknya ke *Execution Log* tanpa menampilkan kunci API.
   - `aiHealthCheck()`: Menguji konektivitas provider, memanggil `aiListModels()`, dan memberi peringatan di log jika `AI_MODEL` yang dikonfigurasi tidak terdaftar.

---

### 2.2 Client-Side Snapshot Engine (`src/utils/aiSnapshot.ts`)
- Fungsi murni `buildAiSnapshot(input)` tanpa efek samping.
- Menghitung ulang KPI dengan rumus identik dengan `OwnerDashboardScreen.tsx`:
  - Mengabaikan transaksi `void`.
  - Filter rentang waktu sesuai periode:
    - `today`: Pembanding kemarin sampai jam yang sama (dan data hari yang sama minggu lalu jika ada).
    - `7days`: 7 hari sebelumnya.
    - `month`: Bulan lalu pada rentang tanggal yang sama.
    - `custom`: 1 hari sebelum tanggal terpilih.
  - Snapshot mencakup: `meta`, `current`, `previous`, `delta`, `topProducts` (maks 5), `slowProducts` (maks 3), `branches`, `cashiers` (maks 8), `lowStock` (maks 8), `cashDifferences` (maks 5), `flags`.
  - Deteksi anomali (flags): `OMZET_TURUN`, `OMZET_NAIK`, `VOID_TINGGI`, `DISKON_MANUAL_TINGGI`, `SELISIH_KAS`, `STOK_MENIPIS`, `KETERGANTUNGAN_PRODUK`, `CABANG_DI_BAWAH_TARGET`.
  - Jika tidak ada transaksi aktif dalam periode terpilih, mengembalikan `{ empty: true }`.

---

### 2.3 Client Service & Caching (`src/services/gasApi.ts`)
- `gasApi.aiAnalyze(payload)` memanggil `postAction('aiAnalyze', payload, 1, 45000)`.
- Penambahan parameter opsional `timeoutMs` pada `postAction` (default 15000).
- Cache lokal di memori dan `localStorage` (`hasuka_ai_cache_v1`, maks 5 entri, TTL 15 menit) berbasis hash snapshot bebas timestamp.
- Menampilkan fallback "data lama" saat terjadi galat kuota (429) atau offline.
- Cooldown minimal 10 detik antar klik "Analisis ulang".

---

### 2.4 UI / UX & Widget (`AiAssistantWidget.tsx`, `useDraggable.ts`)
- Saklar AI tersimpan di `localStorage` (`hasuka_ai_enabled`), default `'1'`.
- Tombol saklar di header sub-tab owner di samping tombol "Ekspor".
- Widget mengambang (`z-[90]`):
  - Tertutup: Tombol lingkaran 52px dengan ikon Sparkles (warna `#8B4A1E`).
  - Terbuka: Panel lebar maks 360px, tinggi maks 70vh, scroll internal.
  - Gestur Drag: Pointer events (`pointerdown`, `pointermove`, `pointerup`, `setPointerCapture`), ambang batas gerak 5px, clamp ke viewport (margin 8px), snap ke tepi terdekat saat dilepas, posisi tersimpan di `localStorage` (`hasuka_ai_widget_pos`).
- Seluruh teks AI dirender sebagai plain text (aman dari XSS, tidak menggunakan `dangerouslySetInnerHTML`).
- Desain mengikuti palet tema Hasuka Dimsum (warna Warm Heritage, border `#E8D7C0`, teks 11-13px).

