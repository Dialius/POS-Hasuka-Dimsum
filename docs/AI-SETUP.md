# Panduan Menghubungkan AI Insight (Untuk Pemilik Usaha)

Panduan praktis dan ramah bagi pemilik usaha (owner) non-teknis restoran **Hasuka Dimsum** untuk mengaktifkan fitur analisis bisnis otomatis **AI Insight**.

---

## 1. Bagaimana Fitur Ini Bekerja?

Alur kerja AI Insight dirancang dengan prinsip **keamanan tingkat tinggi dan efisiensi biaya**:

```
[Aplikasi POS Kasir / Browser Owner]
                 │
                 ▼ (Hanya mengirim angka agregat penjualan, tanpa invoice/PIN)
[Backend Server Google Apps Script]
                 │
                 ▼ (Kunci API tersimpan aman di server, tidak pernah bocor ke browser)
[Penyedia Model AI (Gemini / Groq / dll.)]
```

- **Kunci API Anda Aman**: Kunci API hanya disimpan di menu rahasia *Script Properties* Google Apps Script. Kode program di browser kasir/owner maupun bundle aplikasi tidak memuat kunci apa pun.
- **Privasi Data Pelanggan Terjaga**: AI hanya menerima rangkuman angka (total omzet, jumlah tiket, porsi produk terjual, persentase diskon). Sistem **tidak pernah** mengirimkan nomor nota (*invoice_no*), nama pelanggan, nomor telepon, nomor PIN kasir, maupun URL ke pihak luar.
- **100% Gratis**: Anda dapat memanfaatkan paket gratis resmi (*free tier*) dari penyedia AI tanpa biaya langganan bulanan.

---

## 2. Langkah Cepat Menghubungkan AI

### Langkah A: Buat Kunci API
Pilih salah satu penyedia AI (disarankan **Google Gemini** atau **Groq**), lalu dapatkan kunci API gratis Anda sesuai panduan pada Bagian 3.

### Langkah B: Masukkan Kunci ke Google Apps Script
1. Buka spreadsheet Google Sheets database Hasuka Dimsum Anda.
2. Klik menu **Ekstensi** > **Apps Script**.
3. Di bilah menu sebelah kiri, klik ikon gerigi **Project Settings** (Setelan Proyek).
4. Gulir ke bagian paling bawah ke tabel **Script Properties** (Properti Skrip).
5. Klik tombol **Add script property** (Tambah properti skrip) dan masukkan baris konfigurasi berikut:

| Nama Properti | Status | Fungsi | Contoh Nilai |
|---|---|---|---|
| `AI_PROVIDER` | Wajib | Nama penyedia AI yang digunakan (`gemini`, `groq`, `openrouter`, `cerebras`, `mistral`, `nvidia`, `xai`, atau `openai`) | `gemini` atau `groq` |
| `AI_API_KEY` | Wajib | Kunci rahasia API dari penyedia AI Anda | *(Kunci rahasia dari penyedia)* |
| `AI_MODEL` | Wajib | ID nama model AI yang aktif (bebas dari model yang sudah pensiun) | `gemini-1.5-flash` atau `llama-3.3-70b-versatile` |
| `AI_MODEL_FALLBACK` | Opsional | Model cadangan jika model utama kehabisan kuota atau sedang tidak tersedia | `gemini-1.5-flash-8b` atau `llama-3.1-8b-instant` |
| `AI_BASE_URL` | Opsional | URL endpoint server AI (otomatis terisi jika menggunakan preset, isi hanya jika pakai server kustom) | `https://api.groq.com/openai/v1` |
| `AI_OWNER_KEY` | Opsional | Kunci pengaman tambahan jika Anda ingin membatasi fitur AI hanya untuk orang yang tahu PIN/kunci ini | `123456` |
| `AI_DAILY_LIMIT` | Opsional | Batas maksimal analisis AI per hari untuk mencegah kuota tersedot habis (default: 40) | `40` |

6. Klik **Save script properties** (Simpan properti skrip).

### Langkah C: Periksa Model & Berikan Izin (Otorisasi)
1. Di editor Apps Script, kembali ke menu **Editor** (`< >`).
2. Pada dropdown fungsi di toolbar atas, pilih fungsi **`aiListModels`**, lalu klik **Run** (Jalankan).
   - Fungsi ini akan mencetak daftar model yang aktif dan valid langsung ke *Execution Log*. Pastikan model yang Anda pilih di `AI_MODEL` tercantum di sana.
3. Selanjutnya pilih fungsi **`aiHealthCheck`**, lalu klik **Run**.
4. Jika Google meminta izin akses (*Authorization Required*), klik **Review Permissions** (Tinjau Izin), pilih akun Google Anda, klik **Advanced** > **Go to Hasuka Dimsum POS (unsafe)**, lalu klik **Allow** (Izinkan).
5. Periksa log: Jika muncul `SUKSES! Respon: {"status":"OK"}`, artinya server Anda sudah berhasil terhubung ke AI!

### Langkah D: Gunakan di Dashboard Owner
1. Buka aplikasi POS Hasuka Dimsum dan masuk ke halaman **Owner**.
2. Pastikan tombol saklar **AI** di baris tab atas dalam kondisi aktif (berwarna cokelat gelap).
3. Klik widget bulat mengambang di kanan bawah untuk membaca ringkasan performa bisnis harian Anda.

---

## 3. Panduan per Penyedia AI

### 1. Google Gemini (Pilihan Utama — Sangat Direkomendasikan)
- **Halaman Buat Kunci**: [Google AI Studio (aistudio.google.com/app/apikey)](https://aistudio.google.com/app/apikey)
- **Cara Buat**: Masuk dengan akun Google Anda, klik tombol **Create API key** > **Create API key in new project**.
- **Konfigurasi Script Properties**:
  - `AI_PROVIDER`: `gemini`
  - `AI_MODEL`: `gemini-1.5-flash` *(atau `gemini-2.0-flash` jika sudah tersedia di wilayah Anda)*
  - `AI_MODEL_FALLBACK`: `gemini-1.5-flash-8b`
  - `AI_BASE_URL`: *(kosongkan)*

### 2. Groq (Pilihan Cadangan — Sangat Cepat)
- **Halaman Buat Kunci**: [Groq Console (console.groq.com/keys)](https://console.groq.com/keys)
- **Cara Buat**: Masuk dengan email / akun Google atau GitHub, klik **Create API Key**, beri nama bebas, lalu salin kunci yang muncul.
- **Konfigurasi Script Properties**:
  - `AI_PROVIDER`: `groq`
  - `AI_MODEL`: `llama-3.3-70b-versatile`
  - `AI_MODEL_FALLBACK`: `llama-3.1-8b-instant`
  - `AI_BASE_URL`: *(kosongkan, otomatis menggunakan preset `https://api.groq.com/openai/v1`)*

### 3. OpenRouter (Banyak Pilihan Model Gratis)
- **Halaman Buat Kunci**: [OpenRouter Keys (openrouter.ai/keys)](https://openrouter.ai/keys)
- **Cara Buat**: Masuk, klik **Create Key**, beri nama, salin kuncinya.
- **Konfigurasi Script Properties**:
  - `AI_PROVIDER`: `openrouter`
  - `AI_MODEL`: `meta-llama/llama-3.3-70b-instruct:free`
  - `AI_MODEL_FALLBACK`: `google/gemini-2.0-flash-exp:free`
  - `AI_BASE_URL`: *(kosongkan, otomatis menggunakan preset `https://openrouter.ai/api/v1`)*
  - *Catatan*: Pastikan nama model selalu berakhiran `:free` agar tidak memotong saldo berbayar.

### 4. Cerebras
- **Halaman Buat Kunci**: [Cerebras Cloud Console (cloud.cerebras.ai)](https://cloud.cerebras.ai/)
- **Cara Buat**: Daftar akun pengembang dan buat API key baru.
- **Konfigurasi Script Properties**:
  - `AI_PROVIDER`: `cerebras`
  - `AI_MODEL`: `llama3.1-8b`
  - `AI_BASE_URL`: *(kosongkan, otomatis menggunakan preset `https://api.cerebras.ai/v1`)*

### 5. Mistral AI
- **Halaman Buat Kunci**: [Mistral Console (console.mistral.ai/api-keys)](https://console.mistral.ai/api-keys/)
- **Cara Buat**: Daftar akun, pilih tier *Experiment*, buat API key baru.
- **Konfigurasi Script Properties**:
  - `AI_PROVIDER`: `mistral`
  - `AI_MODEL`: `mistral-small-latest` *(atau `open-mistral-7b`)*
  - `AI_BASE_URL`: *(kosongkan, otomatis menggunakan preset `https://api.mistral.ai/v1`)*

### 6. NVIDIA NIM
- **Halaman Buat Kunci**: [NVIDIA Build (build.nvidia.com)](https://build.nvidia.com/)
- **Cara Buat**: Daftar akun NVIDIA Developer, dapatkan kuota trial 1.000 kredit dan buat API key.
- **Konfigurasi Script Properties**:
  - `AI_PROVIDER`: `nvidia`
  - `AI_MODEL`: `meta/llama-3.3-70b-instruct`
  - `AI_BASE_URL`: *(kosongkan, otomatis menggunakan preset `https://integrate.api.nvidia.com/v1`)*

### 7. xAI (Grok)
- **Halaman Buat Kunci**: [xAI Console (console.x.ai)](https://console.x.ai/)
- **Konfigurasi Script Properties**:
  - `AI_PROVIDER`: `xai`
  - `AI_MODEL`: `grok-2-latest`
  - `AI_BASE_URL`: *(kosongkan, otomatis menggunakan preset `https://api.x.ai/v1`)*
  - *Perhatian*: xAI tidak menyediakan paket gratis harian tetap (memerlukan kartu kredit/sistem saldo berbayar).

---

## 4. Tabel Perbandingan Penyedia AI

*Data perbandingan telah diverifikasi ke dokumentasi resmi masing-masing penyedia per **4 November 2026**.*

| Penyedia | Perlu Kartu Kredit? | Jenis Paket Gratis | Kuota Terverifikasi (per 4 Nov 2026) | Catatan Khusus | Rekomendasi |
|---|:---:|---|---|---|:---:|
| **Google Gemini** | **Tidak** | Gratis Permanen | **15 RPM** (panggilan/menit), **1.500 RPD** (panggilan/hari) | Kuota dihitung per project Google Cloud, bukan per API key | ⭐ **UTAMA** |
| **Groq** | **Tidak** | Gratis Permanen | **30 RPM**, **1.000 RPD**, ~100k token/hari (pada model LLaMA 3.3 70B) | Kecepatan respons sangat tinggi, kuota dihitung per organisasi | ⭐ **CADANGAN** |
| **OpenRouter** | **Tidak** | Model Gratis (`:free`) | **20 RPM**, **50 RPD** (atau 1.000 RPD jika ada riwayat saldo $10) | Wajib memilih model dengan akhiran `:free` | Alternatif |
| **Cerebras** | Terkadang | Free Trial | **5 RPM**, 30K uncached TPM, batas harian lihat dashboard | Kecepatan inferensi tinggi | Alternatif |
| **Mistral AI** | **Tidak** | Free Experiment Plan | **~1 RPS** / 30-500 RPM tergantung model | Dirancang untuk eksperimen/prototipe | Alternatif |
| **NVIDIA NIM** | **Tidak** | Kuota Awal (1.000 kredit) | 1.000 kredit saat pendaftaran (bukan kuota harian permanen) | Kuota akan habis jika kredit pendaftaran terpakai | Uji Coba |
| **xAI (Grok)** | **Ya** | Trial Berbayar | Tergantung saldo/kartu kredit (lihat dashboard penyedia) | Bukan paket gratis harian permanen | Khusus Saldo |

---

## 5. Panduan Memilih & Mengganti Model AI

### Kriteria Model yang Tepat:
- **Ukuran Cukup Kecil / Cepat**: Gunakan model berukuran 8B hingga 70B, atau kelas *Flash* / *Flash-Lite*. Model ringan bekerja lebih cepat (di bawah 2 detik) dan kuota gratisnya jauh lebih besar.
- **Mendukung Output JSON**: Analisis Hasuka POS membutuhkan output JSON terstruktur.
- **Fasih Bahasa Indonesia**: Model modern seperti Gemini Flash dan LLaMA 3.3 70B sangat mahir menyajikan bahasa Indonesia bisnis yang natural.
- **Hindari Model Reasoning Besar**: Model kelas "Thinking/Reasoning" berukuran raksasa tidak diperlukan untuk tugas ini dan cenderung boros kuota serta lambat.

### Cara Mengganti Model Saat Dipensiunkan:
Penyedia AI rutin memperbarui versi model (misalnya dari versi 1.5 ke 2.0). Jika suatu saat model Anda tidak lagi tersedia:
1. Buka Apps Script > **Editor** > jalankan fungsi **`aiListModels`**.
2. Lihat daftar model terbaru yang muncul di *Execution Log*.
3. Buka **Project Settings** > **Script Properties**, lalu ubah nilai `AI_MODEL` ke nama model terbaru tersebut.
4. Klik **Save script properties**. Anda **tidak perlu mengutak-atik kode** aplikasi sama sekali.

---

## 6. Privasi dan Ketentuan Data

1. **Hanya Angka Agregat**: Yang dikirimkan hanyalah ringkasan penjualan yang telah dipadatkan (misal: "Cabang Braga: omzet Rp1.250.000, 24 transaksi, Dimsum Mentai terjual 35 porsi").
2. **Kebijakan Data Paket Gratis**:
   - Pada tier gratis Google Gemini dan Mistral Experiment, data masukan dapat digunakan oleh penyedia untuk evaluasi dan pelatihan model internal mereka. Karena data yang dikirim tidak memuat data pribadi (tanpa nama pelanggan, tanpa nomor kartu/rekening, tanpa nomor invoice), data ini aman untuk dianalisis.
   - Jika bisnis Anda kelak memerlukan kebijakan *Zero Data Retention* (data tidak disimpan sama sekali oleh penyedia), Anda dapat beralih ke paket berbayar (*Pay-As-You-Go*) pada penyedia tersebut.
3. **Batas Kuota Google Gemini**: Kuota gratis Gemini berlaku per Google Cloud Project. Jika Anda membuat 2 atau 3 kunci API dalam satu proyek yang sama, kuota tersebut tetap berbagi di angka 1.500 panggilan per hari.

---

## 7. Solusi Kendala (Troubleshooting)

| Kode Error | Penyebab Utama | Solusi Praktis |
|---|---|---|
| `[AI_NOT_CONFIGURED]` | `AI_API_KEY` atau `AI_MODEL` belum diisi di Script Properties. | Buka Project Settings Apps Script, pastikan properti `AI_API_KEY` dan `AI_MODEL` sudah terisi dengan benar. |
| `[AI_MODEL_INVALID]` | ID model pada `AI_MODEL` salah ketik atau sudah dipensiunkan penyedia. | Jalankan fungsi `aiListModels` di editor Apps Script untuk melihat model aktif, lalu perbarui nilai `AI_MODEL`. |
| `[AI_QUOTA]` | Kuota gratis penyedia sedang habis atau terkena batas laju per menit (429). | Tunggu 1-2 menit lalu klik **Analisis ulang**. Anda juga bisa menyiapkan `AI_MODEL_FALLBACK` agar otomatis dialihkan ke model cadangan. |
| `[AI_RATE_LIMIT]` | Jumlah analisis hari ini telah mencapai batas `AI_DAILY_LIMIT` (default 40x). | Fitur terkunci untuk sisa hari ini demi menjaga keamanan kuota. Nilai limit dapat dinaikkan pada properti `AI_DAILY_LIMIT`. |
| `[AI_FORBIDDEN]` | Server dipasangi `AI_OWNER_KEY`, namun kode akses pada widget salah/kosong. | Masukkan kode akses AI yang cocok pada kotak input yang muncul di kartu widget. |
| `[AI_BAD_RESPONSE]` | Gangguan jaringan server penyedia atau format jawaban rusak. | Klik tombol **Coba Lagi** pada widget. Sistem memiliki mekanisme fallback toleran untuk membaca teks. |
| `[AI_OFFLINE]` | Perangkat kasir/owner tidak memiliki koneksi internet. | Periksa koneksi WiFi atau paket data perangkat Anda. Widget akan menampilkan analisis terakhir yang tersimpan (*data lama*). |
