import { useState, useEffect } from 'react'
import {
  ShieldCheck,
  User,
  Store,
  Lock,
  CheckCircle2,
  Copy,
  Printer,
  Eye,
  EyeOff,
  AlertCircle,
  Loader2,
  ArrowRight,
  ArrowLeft,
} from 'lucide-react'
import {
  generateRecoveryKey,
  evaluatePasswordStrength,
  PasswordStrength,
} from '../utils/cryptoAuth'
import { setupOwnerAccount } from '../services/ownerAuthService'
import { Button } from './common/Button'
import { showToast } from './Alert'

interface OwnerSetupModalProps {
  isOpen: boolean
  onSuccess: (ownerName: string) => void
  onClose?: () => void
  canCancel?: boolean
}

export default function OwnerSetupModal({
  isOpen,
  onSuccess,
  onClose,
  canCancel = false,
}: OwnerSetupModalProps) {
  const [step, setStep] = useState<1 | 2 | 3 | 4>(1)

  // Step 1: Profil
  const [displayName, setDisplayName] = useState('Bpk. Haryanto')
  const [storeName, setStoreName] = useState('Hasuka Dimsum - GOR Satria')

  // Step 2: Kredensial
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [strength, setStrength] = useState<PasswordStrength>(() => evaluatePasswordStrength(''))

  // Step 3: Recovery Key
  const [recoveryKey, setRecoveryKey] = useState('')
  const [copiedKey, setCopiedKey] = useState(false)
  const [hasSavedKey, setHasSavedKey] = useState(false)

  // State Eksekusi
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [errorMsg, setErrorMsg] = useState('')

  useEffect(() => {
    if (isOpen) {
      setStep(1)
      setUsername('')
      setPassword('')
      setConfirmPassword('')
      setErrorMsg('')
      setHasSavedKey(false)
      setCopiedKey(false)
      // Bangkitkan recovery key baru
      setRecoveryKey(generateRecoveryKey())
    }
  }, [isOpen])

  useEffect(() => {
    setStrength(evaluatePasswordStrength(password))
  }, [password])

  if (!isOpen) return null

  // Handler Salin Kode
  const handleCopyKey = () => {
    if (!recoveryKey) return
    navigator.clipboard?.writeText(recoveryKey)
    setCopiedKey(true)
    showToast({
      variant: 'success',
      title: 'Kode Pemulihan Disalin!',
      description: 'Simpan kode ini di tempat yang aman (mis. catatan pribadi / pengelola sandi).',
    })
    setTimeout(() => setCopiedKey(false), 3000)
  }

  // Handler Cetak / Unduh Lembar Darurat
  const handlePrintOrDownload = () => {
    const textContent = `================================================
HASUKA DIMSUM - LEMBAR PEMULIHAN DARURAT AKUN OWNER
================================================
Outlet       : ${storeName}
Nama Pemilik : ${displayName}
Username     : ${username}
Tanggal Dibuat: ${new Date().toLocaleDateString('id-ID', { dateStyle: 'full' })}

KUNCI PEMULIHAN DARURAT (EMERGENCY RECOVERY KEY):
>>>  ${recoveryKey}  <<<

PERINGATAN PENTING:
1. Simpan lembar ini di brankas atau tempat aman.
2. Jangan bagikan kode ini kepada kasir atau pihak lain.
3. Kode ini digunakan untuk membuat kata sandi baru jika
   Anda lupa kata sandi akun Owner.
4. Kode ini bersifat sekali pakai (one-time use).
================================================`

    // Buat file teks darurat untuk diunduh
    const blob = new Blob([textContent], { type: 'text/plain;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `Hasuka-Dimsum-Recovery-Key-${username || 'owner'}.txt`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)

    showToast({
      variant: 'success',
      title: 'Lembar Darurat Diunduh',
      description: 'Simpan file teks ini di penyimpanan aman Anda.',
    })
  }

  // Validasi Step 1 -> Step 2
  const handleNextStep1 = () => {
    if (!displayName.trim()) {
      setErrorMsg('Silakan masukkan nama pemilik.')
      return
    }
    setErrorMsg('')
    setStep(2)
  }

  // Validasi Step 2 -> Step 3
  const handleNextStep2 = () => {
    setErrorMsg('')
    const cleanUser = username.trim()
    if (!cleanUser || cleanUser.length < 4) {
      setErrorMsg('Username minimal 4 karakter (huruf dan angka).')
      return
    }
    if (/\s/.test(cleanUser)) {
      setErrorMsg('Username tidak boleh mengandung spasi.')
      return
    }
    if (!password || password.length < 8) {
      setErrorMsg('Kata sandi minimal 8 karakter.')
      return
    }
    if (password !== confirmPassword) {
      setErrorMsg('Konfirmasi kata sandi tidak cocok. Silakan periksa kembali.')
      return
    }
    setStep(3)
  }

  // Validasi Step 3 -> Step 4
  const handleNextStep3 = () => {
    if (!hasSavedKey) {
      setErrorMsg('Harap centang konfirmasi bahwa Anda telah menyimpan kode pemulihan.')
      return
    }
    setErrorMsg('')
    setStep(4)
  }

  // Eksekusi Simpan Final (Step 4)
  const handleFinalSubmit = async () => {
    setIsSubmitting(true)
    setErrorMsg('')

    try {
      const res = await setupOwnerAccount({
        username,
        displayName,
        password,
        recoveryKey,
      })

      if (res.success) {
        showToast({
          variant: 'success',
          title: 'Setup Akun Owner Berhasil!',
          description: `Selamat datang, ${displayName}. Akun Anda kini aktif dan terlindungi.`,
        })
        onSuccess(displayName)
      } else {
        setErrorMsg(res.error || 'Gagal menyimpan konfigurasi. Silakan coba lagi.')
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Terjadi kesalahan sistem saat setup akun.')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
      <div className="relative w-full max-w-lg overflow-hidden bg-white rounded-2xl shadow-2xl border border-[#F3E7CE] flex flex-col max-h-[92vh]">
        {/* Header Modal */}
        <div className="px-6 py-5 bg-gradient-to-r from-[#8B4A1E] to-[#A05524] text-white">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-xl bg-white/10 backdrop-blur-md">
                <ShieldCheck className="w-5 h-5 text-[#F59E0B]" />
              </div>
              <div>
                <h3 className="font-bold text-lg leading-tight tracking-wide">
                  Setup Awal Akun Pemilik Toko
                </h3>
                <p className="text-xs text-white/80">Hasuka Dimsum POS Security Onboarding</p>
              </div>
            </div>
            {canCancel && onClose && (
              <button
                type="button"
                onClick={onClose}
                className="text-white/70 hover:text-white text-xs px-2 py-1 rounded bg-white/10"
              >
                Batal
              </button>
            )}
          </div>

          {/* Stepper Progress Indicator */}
          <div className="flex items-center justify-between mt-3 gap-2">
            {[1, 2, 3, 4].map(s => (
              <div key={s} className="flex-1 flex flex-col gap-1">
                <div
                  className={`h-1.5 rounded-full transition-all duration-300 ${
                    s <= step ? 'bg-[#F59E0B]' : 'bg-white/20'
                  }`}
                />
                <span className="text-[10px] text-white/70 text-center font-medium">
                  {s === 1 ? 'Profil' : s === 2 ? 'Kredensial' : s === 3 ? 'Kunci Darurat' : 'Aktivasi'}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Body Modal Berdasarkan Step */}
        <div className="p-6 overflow-y-auto flex-1 space-y-4">
          {errorMsg && (
            <div className="flex items-start gap-2.5 p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* STEP 1: Profil Pemilik & Toko */}
          {step === 1 && (
            <div className="space-y-4 animate-fade-in">
              <div className="p-3.5 rounded-xl bg-[#FFFDF8] border border-[#F3E7CE] text-xs text-[#6B5A4E]">
                Selamat datang di sistem kasir <strong>Hasuka Dimsum</strong>! Silakan lengkapi profil
                pemilik toko sebelum mengatur kata sandi pengaman.
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#4A3B32] mb-1.5">
                  Nama Lengkap Pemilik
                </label>
                <div className="relative">
                  <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#8B4A1E]/60" />
                  <input
                    type="text"
                    value={displayName}
                    onChange={e => setDisplayName(e.target.value)}
                    placeholder="Contoh: Bpk. Haryanto"
                    className="w-full pl-10 pr-4 py-2.5 text-sm rounded-xl border border-[#D9D1C7] focus:border-[#8B4A1E] focus:ring-2 focus:ring-[#8B4A1E]/15 outline-none transition"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#4A3B32] mb-1.5">
                  Nama Gerai / Outlet Utama
                </label>
                <div className="relative">
                  <Store className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#8B4A1E]/60" />
                  <input
                    type="text"
                    value={storeName}
                    onChange={e => setStoreName(e.target.value)}
                    placeholder="Contoh: Hasuka Dimsum - GOR Satria"
                    className="w-full pl-10 pr-4 py-2.5 text-sm rounded-xl border border-[#D9D1C7] focus:border-[#8B4A1E] focus:ring-2 focus:ring-[#8B4A1E]/15 outline-none transition"
                  />
                </div>
              </div>
            </div>
          )}

          {/* STEP 2: Tentukan Username & Kata Sandi */}
          {step === 2 && (
            <div className="space-y-4 animate-fade-in">
              <div>
                <label className="block text-xs font-semibold text-[#4A3B32] mb-1.5">
                  Username Owner Baru
                </label>
                <div className="relative">
                  <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#8B4A1E]/60" />
                  <input
                    type="text"
                    value={username}
                    onChange={e => setUsername(e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, ''))}
                    placeholder="Contoh: owner_hasuka"
                    className="w-full pl-10 pr-4 py-2.5 text-sm rounded-xl border border-[#D9D1C7] focus:border-[#8B4A1E] focus:ring-2 focus:ring-[#8B4A1E]/15 outline-none font-mono"
                  />
                </div>
                <p className="text-[11px] text-[#8C7A6B] mt-1">
                  Minimal 4 karakter, huruf kecil, angka, atau garis bawah (_).
                </p>
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#4A3B32] mb-1.5">
                  Kata Sandi Baru
                </label>
                <div className="relative">
                  <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#8B4A1E]/60" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    placeholder="Minimal 8 karakter"
                    className="w-full pl-10 pr-10 py-2.5 text-sm rounded-xl border border-[#D9D1C7] focus:border-[#8B4A1E] focus:ring-2 focus:ring-[#8B4A1E]/15 outline-none"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(p => !p)}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 p-1"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>

                {/* Password Strength Meter */}
                {password.length > 0 && (
                  <div className="mt-2 space-y-1.5">
                    <div className="flex items-center justify-between text-[11px]">
                      <span className="text-[#8C7A6B]">Kekuatan Sandi:</span>
                      <span className="font-semibold" style={{ color: strength.color }}>
                        {strength.label}
                      </span>
                    </div>
                    <div className="w-full h-1.5 bg-gray-200 rounded-full overflow-hidden">
                      <div
                        className="h-full transition-all duration-300"
                        style={{ width: `${strength.percent}%`, backgroundColor: strength.color }}
                      />
                    </div>
                    {strength.feedback && (
                      <p className="text-[11px] text-[#8C7A6B]">{strength.feedback}</p>
                    )}
                  </div>
                )}
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#4A3B32] mb-1.5">
                  Konfirmasi Kata Sandi
                </label>
                <div className="relative">
                  <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#8B4A1E]/60" />
                  <input
                    type={showConfirmPassword ? 'text' : 'password'}
                    value={confirmPassword}
                    onChange={e => setConfirmPassword(e.target.value)}
                    placeholder="Ketik ulang kata sandi"
                    className="w-full pl-10 pr-10 py-2.5 text-sm rounded-xl border border-[#D9D1C7] focus:border-[#8B4A1E] focus:ring-2 focus:ring-[#8B4A1E]/15 outline-none"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(p => !p)}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 p-1"
                  >
                    {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* STEP 3: Kunci Pemulihan Darurat */}
          {step === 3 && (
            <div className="space-y-4 animate-fade-in">
              <div className="p-3.5 rounded-xl bg-amber-50 border border-amber-200 text-xs text-amber-900 leading-relaxed">
                <strong>Kunci Pemulihan Darurat (Emergency Recovery Key)</strong> adalah satu-satunya
                kunci bagi Anda untuk masuk dan mereset kata sandi jika suatu hari lupa.
              </div>

              <div className="p-4 rounded-xl bg-[#FFFDF8] border-2 border-dashed border-[#8B4A1E]/40 text-center space-y-2">
                <span className="text-[11px] font-semibold text-[#8B4A1E] uppercase tracking-wider">
                  Kode Pemulihan Anda
                </span>
                <div className="text-xl sm:text-2xl font-mono font-extrabold text-[#8B4A1E] tracking-widest selection:bg-[#FDE68A]">
                  {recoveryKey}
                </div>
                <p className="text-[11px] text-[#6B5A4E]">
                  Kode ini berlaku satu kali pakai dan akan dirotasi setelah digunakan.
                </p>
              </div>

              <div className="grid grid-cols-2 gap-2 pt-1">
                <button
                  type="button"
                  onClick={handleCopyKey}
                  className="flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-xl border border-[#8B4A1E]/30 bg-white hover:bg-[#F3E7CE]/40 text-[#8B4A1E] text-xs font-semibold transition"
                >
                  <Copy className="w-3.5 h-3.5" />
                  <span>{copiedKey ? 'Tersalin!' : 'Salin Kode'}</span>
                </button>
                <button
                  type="button"
                  onClick={handlePrintOrDownload}
                  className="flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-xl border border-[#8B4A1E]/30 bg-white hover:bg-[#F3E7CE]/40 text-[#8B4A1E] text-xs font-semibold transition"
                >
                  <Printer className="w-3.5 h-3.5" />
                  <span>Unduh Lembar Darurat</span>
                </button>
              </div>

              <label className="flex items-start gap-2.5 pt-2 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={hasSavedKey}
                  onChange={e => setHasSavedKey(e.target.checked)}
                  className="mt-0.5 w-4 h-4 text-[#8B4A1E] rounded border-gray-300 focus:ring-[#8B4A1E]"
                />
                <span className="text-xs text-[#4A3B32] leading-tight">
                  Saya telah menyimpan kode pemulihan ini di tempat yang aman dan paham bahwa kode ini
                  diperlukan jika saya lupa kata sandi.
                </span>
              </label>
            </div>
          )}

          {/* STEP 4: Konfirmasi & Aktivasi */}
          {step === 4 && (
            <div className="space-y-4 animate-fade-in">
              <div className="text-center py-2 space-y-1">
                <div className="w-12 h-12 mx-auto rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mb-2">
                  <CheckCircle2 className="w-6 h-6" />
                </div>
                <h4 className="font-bold text-base text-[#4A3B32]">Konfirmasi & Simpan Akun</h4>
                <p className="text-xs text-[#8C7A6B]">
                  Periksa kembali ringkasan akun Anda sebelum aktivasi.
                </p>
              </div>

              <div className="p-3.5 rounded-xl bg-[#FFFDF8] border border-[#F3E7CE] space-y-2 text-xs">
                <div className="flex justify-between py-1 border-b border-[#F3E7CE]">
                  <span className="text-[#8C7A6B]">Nama Pemilik:</span>
                  <span className="font-semibold text-[#4A3B32]">{displayName}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-[#F3E7CE]">
                  <span className="text-[#8C7A6B]">Username:</span>
                  <span className="font-mono font-semibold text-[#8B4A1E]">{username}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-[#F3E7CE]">
                  <span className="text-[#8C7A6B]">Kata Sandi:</span>
                  <span className="text-[#4A3B32] font-mono">•••••••••••• (Terenkripsi PBKDF2)</span>
                </div>
                <div className="flex justify-between py-1">
                  <span className="text-[#8C7A6B]">Kode Pemulihan:</span>
                  <span className="font-mono text-emerald-700 font-semibold">Tersimpan</span>
                </div>
              </div>

              <p className="text-[11px] text-center text-[#8C7A6B]">
                Setelah disimpan, kata sandi dan kode darurat lama direset dan akun baru ini langsung
                aktif untuk seluruh perangkat kasir.
              </p>
            </div>
          )}
        </div>

        {/* Footer Tombol Navigasi */}
        <div className="px-6 py-4 bg-[#FDFBF7] border-t border-[#F3E7CE] flex items-center justify-between">
          {step > 1 ? (
            <button
              type="button"
              disabled={isSubmitting}
              onClick={() => {
                setErrorMsg('')
                setStep(s => (s - 1) as any)
              }}
              className="flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-[#6B5A4E] hover:text-[#4A3B32] transition"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              Kembali
            </button>
          ) : (
            <div />
          )}

          {step === 1 && (
            <Button variant="primary" onClick={handleNextStep1} className="text-xs">
              Lanjut ke Kredensial
              <ArrowRight className="w-3.5 h-3.5 ml-1" />
            </Button>
          )}

          {step === 2 && (
            <Button variant="primary" onClick={handleNextStep2} className="text-xs">
              Lanjut ke Kunci Darurat
              <ArrowRight className="w-3.5 h-3.5 ml-1" />
            </Button>
          )}

          {step === 3 && (
            <Button
              variant="primary"
              disabled={!hasSavedKey}
              onClick={handleNextStep3}
              className="text-xs disabled:opacity-50"
            >
              Lanjut ke Konfirmasi
              <ArrowRight className="w-3.5 h-3.5 ml-1" />
            </Button>
          )}

          {step === 4 && (
            <Button
              variant="primary"
              disabled={isSubmitting}
              onClick={handleFinalSubmit}
              className="text-xs flex items-center gap-2"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  Mengenkripsi & Menyimpan...
                </>
              ) : (
                <>
                  <ShieldCheck className="w-3.5 h-3.5" />
                  Simpan & Aktifkan Akun
                </>
              )}
            </Button>
          )}
        </div>
      </div>
    </div>
  )
}
