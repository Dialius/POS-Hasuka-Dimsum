import { useState, useEffect } from 'react'
import {
  KeyRound,
  Lock,
  User,
  AlertCircle,
  CheckCircle2,
  Copy,
  Eye,
  EyeOff,
  Loader2,
  X,
  FileSpreadsheet,
  ArrowRight,
} from 'lucide-react'
import {
  normalizeRecoveryKey,
  evaluatePasswordStrength,
  PasswordStrength,
} from '../utils/cryptoAuth'
import { recoverOwnerPassword } from '../services/ownerAuthService'
import { Button } from './common/Button'
import { showToast } from './Alert'

interface OwnerForgotPasswordModalProps {
  isOpen: boolean
  onClose: () => void
  onSuccess?: () => void
}

export default function OwnerForgotPasswordModal({
  isOpen,
  onClose,
  onSuccess,
}: OwnerForgotPasswordModalProps) {
  const [phase, setPhase] = useState<'verify' | 'new_password' | 'success'>('verify')

  // Input Data
  const [username, setUsername] = useState('')
  const [recoveryKey, setRecoveryKey] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [strength, setStrength] = useState<PasswordStrength>(() => evaluatePasswordStrength(''))

  // Hasil Rotasi Baru
  const [newRotatedKey, setNewRotatedKey] = useState('')
  const [copiedKey, setCopiedKey] = useState(false)

  // Status
  const [isLoading, setIsLoading] = useState(false)
  const [errorMsg, setErrorMsg] = useState('')

  useEffect(() => {
    if (isOpen) {
      setPhase('verify')
      setUsername('')
      setRecoveryKey('')
      setNewPassword('')
      setConfirmPassword('')
      setErrorMsg('')
      setNewRotatedKey('')
      setCopiedKey(false)
    }
  }, [isOpen])

  useEffect(() => {
    setStrength(evaluatePasswordStrength(newPassword))
  }, [newPassword])

  if (!isOpen) return null

  const handleKeyChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = normalizeRecoveryKey(e.target.value)
    setRecoveryKey(formatted)
  }

  // Tahap 1: Verifikasi awal username & kode
  const handleProceedToPassword = () => {
    setErrorMsg('')
    if (!username.trim()) {
      setErrorMsg('Silakan masukkan username Owner Anda.')
      return
    }
    if (!recoveryKey.trim() || recoveryKey.length < 16) {
      setErrorMsg('Format kode pemulihan harus lengkap (contoh: HSK-XXXX-XXXX-XXXX).')
      return
    }
    setPhase('new_password')
  }

  // Tahap 2: Eksekusi Reset Kata Sandi
  const handleExecuteReset = async () => {
    setErrorMsg('')
    if (!newPassword || newPassword.length < 8) {
      setErrorMsg('Kata sandi baru minimal 8 karakter.')
      return
    }
    if (newPassword !== confirmPassword) {
      setErrorMsg('Konfirmasi kata sandi baru tidak cocok.')
      return
    }

    setIsLoading(true)
    try {
      const res = await recoverOwnerPassword({
        username,
        recoveryKey,
        newPassword,
      })

      if (res.success && res.newRecoveryKey) {
        setNewRotatedKey(res.newRecoveryKey)
        setPhase('success')
        showToast({
          variant: 'success',
          title: 'Kata Sandi Berhasil Direset!',
          description: 'Kode pemulihan darurat baru telah diterbitkan.',
        })
      } else {
        setErrorMsg(res.error || 'Gagal memulihkan kata sandi. Periksa kembali username dan kode.')
        // Jika gagal verifikasi, kembali ke tahap input kode
        setPhase('verify')
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Terjadi kesalahan sistem saat pemulihan kata sandi.')
      setPhase('verify')
    } finally {
      setIsLoading(false)
    }
  }

  const handleCopyNewKey = () => {
    if (!newRotatedKey) return
    navigator.clipboard?.writeText(newRotatedKey)
    setCopiedKey(true)
    showToast({
      variant: 'success',
      title: 'Kode Baru Disalin',
      description: 'Simpan kode pemulihan baru ini di tempat yang aman.',
    })
    setTimeout(() => setCopiedKey(false), 3000)
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
      <div className="relative w-full max-w-md overflow-hidden bg-white rounded-2xl shadow-2xl border border-[#F3E7CE] flex flex-col max-h-[92vh]">
        {/* Header Modal */}
        <div className="px-6 py-4 bg-gradient-to-r from-[#8B4A1E] to-[#A05524] text-white flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-white/10 backdrop-blur-md">
              <KeyRound className="w-5 h-5 text-[#F59E0B]" />
            </div>
            <div>
              <h3 className="font-bold text-base leading-tight">Pemulihan Kata Sandi Owner</h3>
              <p className="text-xs text-white/80">Hasuka Dimsum Emergency Recovery</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-white/70 hover:text-white p-1 rounded-lg hover:bg-white/10 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body Modal */}
        <div className="p-6 overflow-y-auto space-y-4 text-[#4A3B32]">
          {errorMsg && (
            <div className="flex items-start gap-2.5 p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* FASE 1: Verifikasi Username & Recovery Key */}
          {phase === 'verify' && (
            <div className="space-y-4 animate-fade-in">
              <p className="text-xs text-[#6B5A4E] leading-relaxed">
                Masukkan <strong>Username</strong> dan <strong>Kunci Pemulihan Darurat</strong> (16
                karakter) yang Anda peroleh saat Setup Awal.
              </p>

              <div>
                <label className="block text-xs font-semibold text-[#4A3B32] mb-1.5">
                  Username Owner
                </label>
                <div className="relative">
                  <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#8B4A1E]/60" />
                  <input
                    type="text"
                    value={username}
                    onChange={e => setUsername(e.target.value.toLowerCase().trim())}
                    placeholder="Contoh: owner_hasuka"
                    className="w-full pl-10 pr-4 py-2.5 text-sm rounded-xl border border-[#D9D1C7] focus:border-[#8B4A1E] focus:ring-2 focus:ring-[#8B4A1E]/15 outline-none font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#4A3B32] mb-1.5">
                  Kunci Pemulihan Darurat (16 Karakter)
                </label>
                <div className="relative">
                  <KeyRound className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#8B4A1E]/60" />
                  <input
                    type="text"
                    value={recoveryKey}
                    onChange={handleKeyChange}
                    placeholder="HSK-XXXX-XXXX-XXXX"
                    maxLength={19}
                    className="w-full pl-10 pr-4 py-2.5 text-sm rounded-xl border border-[#D9D1C7] focus:border-[#8B4A1E] focus:ring-2 focus:ring-[#8B4A1E]/15 outline-none font-mono tracking-wider font-semibold"
                  />
                </div>
              </div>

              {/* Bantuan Root-of-Trust jika kode hilang */}
              <div className="p-3 rounded-xl bg-[#FFFDF8] border border-[#F3E7CE] flex items-start gap-2.5 text-[11px] text-[#6B5A4E]">
                <FileSpreadsheet className="w-4 h-4 text-[#8B4A1E] shrink-0 mt-0.5" />
                <div className="space-y-1 leading-snug">
                  <span className="font-semibold text-[#4A3B32]">
                    Kehilangan Kunci Pemulihan Darurat?
                  </span>
                  <p>
                    Anda dapat mereset akun secara resmi dari <strong>Google Spreadsheet</strong>{' '}
                    milik Anda sendiri: Buka menu <em>Hasuka POS &rarr; Reset Akun Owner (Darurat)</em>.
                  </p>
                </div>
              </div>

              <Button
                variant="primary"
                onClick={handleProceedToPassword}
                className="w-full text-xs py-2.5 flex items-center justify-center gap-1.5"
              >
                <span>Lanjutkan</span>
                <ArrowRight className="w-4 h-4" />
              </Button>
            </div>
          )}

          {/* FASE 2: Buat Kata Sandi Baru */}
          {phase === 'new_password' && (
            <div className="space-y-4 animate-fade-in">
              <p className="text-xs text-[#6B5A4E]">
                Kredensial diverifikasi. Silakan buat <strong>Kata Sandi Baru</strong> untuk akun Anda.
              </p>

              <div>
                <label className="block text-xs font-semibold text-[#4A3B32] mb-1.5">
                  Kata Sandi Baru
                </label>
                <div className="relative">
                  <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#8B4A1E]/60" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={newPassword}
                    onChange={e => setNewPassword(e.target.value)}
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

                {newPassword.length > 0 && (
                  <div className="mt-2 space-y-1 text-[11px]">
                    <div className="flex justify-between">
                      <span className="text-[#8C7A6B]">Kekuatan:</span>
                      <span className="font-semibold" style={{ color: strength.color }}>
                        {strength.label}
                      </span>
                    </div>
                    <div className="w-full h-1 bg-gray-200 rounded-full overflow-hidden">
                      <div
                        className="h-full"
                        style={{ width: `${strength.percent}%`, backgroundColor: strength.color }}
                      />
                    </div>
                  </div>
                )}
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#4A3B32] mb-1.5">
                  Konfirmasi Kata Sandi Baru
                </label>
                <div className="relative">
                  <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#8B4A1E]/60" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={confirmPassword}
                    onChange={e => setConfirmPassword(e.target.value)}
                    placeholder="Ketik ulang kata sandi baru"
                    className="w-full pl-10 pr-4 py-2.5 text-sm rounded-xl border border-[#D9D1C7] focus:border-[#8B4A1E] focus:ring-2 focus:ring-[#8B4A1E]/15 outline-none"
                  />
                </div>
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setPhase('verify')}
                  className="px-4 py-2 text-xs font-semibold text-[#6B5A4E] hover:text-[#4A3B32]"
                >
                  Kembali
                </button>
                <Button
                  variant="primary"
                  disabled={isLoading}
                  onClick={handleExecuteReset}
                  className="flex-1 text-xs py-2.5 flex items-center justify-center gap-2"
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Mereset Kata Sandi...
                    </>
                  ) : (
                    'Simpan Kata Sandi Baru'
                  )}
                </Button>
              </div>
            </div>
          )}

          {/* FASE 3: Sukses & Rotasi Kunci Pemulihan Baru */}
          {phase === 'success' && (
            <div className="space-y-4 animate-fade-in text-center py-2">
              <div className="w-12 h-12 mx-auto rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mb-1">
                <CheckCircle2 className="w-7 h-7" />
              </div>
              <h4 className="font-bold text-base text-[#4A3B32]">Kata Sandi Berhasil Diperbarui!</h4>

              <div className="p-3.5 rounded-xl bg-amber-50 border border-amber-200 text-xs text-amber-900 text-left space-y-2">
                <p className="font-semibold text-center">PENTING: KODE PEMULIHAN BARU</p>
                <p>
                  Kode pemulihan lama Anda telah <strong>hangus</strong> demi keamanan. Simpan{' '}
                  <strong>Kunci Pemulihan Darurat Baru</strong> di bawah ini:
                </p>
                <div className="p-2.5 rounded-lg bg-white border border-amber-300 font-mono text-center text-lg font-bold text-[#8B4A1E] tracking-widest">
                  {newRotatedKey}
                </div>
              </div>

              <button
                type="button"
                onClick={handleCopyNewKey}
                className="w-full flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl border border-[#8B4A1E]/30 bg-white hover:bg-[#F3E7CE]/40 text-[#8B4A1E] text-xs font-semibold transition"
              >
                <Copy className="w-4 h-4" />
                <span>{copiedKey ? 'Kode Baru Tersalin!' : 'Salin Kode Baru'}</span>
              </button>

              <Button
                variant="primary"
                onClick={() => {
                  onClose()
                  if (onSuccess) onSuccess()
                }}
                className="w-full text-xs py-2.5 mt-2"
              >
                Selesai & Masuk ke Login
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
