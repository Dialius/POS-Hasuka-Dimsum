import { useState } from 'react'
import { Delete, Settings2, CheckCircle2 } from 'lucide-react'

const KASIR_LIST = [
  { id: '1', name: 'Sri Wahyuni', role: 'Kasir Senior', avatarUrl: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&q=80&w=150' },
  { id: '2', name: 'Budi Santoso', role: 'Kasir', avatarUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=150' },
  { id: '3', name: 'Ahmad Dani', role: 'Kasir Malam', avatarUrl: 'https://images.unsplash.com/photo-1583394838336-acd977736f90?auto=format&fit=crop&q=80&w=150' },
  { id: '4', name: 'Riska Amalia', role: 'Supervisor', avatarUrl: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?auto=format&fit=crop&q=80&w=150' },
]

export default function LoginScreen({ onLogin }: { onLogin: (role: 'kasir' | 'owner') => void }) {
  const [loginMode, setLoginMode] = useState<'kasir' | 'owner'>('kasir')
  const [selectedKasir, setSelectedKasir] = useState<string | null>('1')
  const [pin, setPin] = useState('')
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [errorMsg, setErrorMsg] = useState('')
  const [shake, setShake] = useState(false)

  const pressPin = (val: string) => {
    if (pin.length >= 6) return
    const next = pin + val
    setPin(next)
    if (errorMsg) setErrorMsg('')
    if (next.length === 6) {
      if (loginMode === 'kasir' && next === '654321') {
        setTimeout(() => onLogin('kasir'), 300)
      } else {
        setErrorMsg('PIN salah. Coba lagi.')
        setShake(true)
        setTimeout(() => { setPin(''); setShake(false) }, 600)
      }
    }
  }

  const delPin = () => setPin(p => p.slice(0, -1))

  const handleOwnerLogin = (e: React.FormEvent) => {
    e.preventDefault()
    if (username === 'admin' && password === 'admin123') {
      onLogin('owner')
    } else {
      setErrorMsg('Username atau password salah')
    }
  }

  const activeKasir = KASIR_LIST.find(k => k.id === selectedKasir)

  return (
    <div className="flex w-full h-full overflow-hidden" style={{ background: '#FAF6ED' }}>

      {/* Left panel: brand + kasir selection */}
      <div className="flex flex-col flex-1 overflow-y-auto" style={{ borderRight: '1px solid #E8D7C0' }}>

        {/* Brand header */}
        <div
          className="flex items-center gap-4 px-10 py-8"
          style={{ borderBottom: '1px solid #E8D7C0' }}
        >
          <img src="/Hasuka-logo.png" alt="Hasuka" className="w-14 h-14 object-contain rounded-full" />
          <div>
            <h1 className="font-serif font-bold text-[24px] leading-tight" style={{ color: '#2B1810' }}>
              Hasuka Dimsum
            </h1>
            <p className="text-[12px]" style={{ color: '#6B5448' }}>
              Sistem Kasir · Paskal Hyper Square · Meja POS 01
            </p>
          </div>
        </div>

        {/* Kasir selector */}
        <div className="px-10 py-8 flex-1">
          {loginMode === 'kasir' ? (
            <>
              <p className="text-[11px] font-bold mb-5" style={{ color: '#6B5448', letterSpacing: '0.08em' }}>
                PILIH KASIR BERTUGAS
              </p>
              <div className="grid grid-cols-2 gap-3">
                {KASIR_LIST.map(kasir => {
                  const isSelected = selectedKasir === kasir.id
                  return (
                    <button
                      key={kasir.id}
                      onClick={() => { setSelectedKasir(kasir.id); setPin(''); setErrorMsg('') }}
                      className="flex items-center gap-3 p-4 rounded-2xl text-left transition-all"
                      style={{
                        background: isSelected ? '#F3E7CE' : 'white',
                        border: isSelected ? '2px solid #8B4A1E' : '1.5px solid #E8D7C0',
                      }}
                    >
                      <div
                        className="shrink-0 overflow-hidden"
                        style={{
                          width: 52,
                          height: 52,
                          borderRadius: '50%',
                          border: isSelected ? '2.5px solid #8B4A1E' : '2px solid #C49A6260',
                        }}
                      >
                        <img src={kasir.avatarUrl} alt={kasir.name} className="w-full h-full object-cover" />
                      </div>
                      <div>
                        <p className="font-bold text-[14px]" style={{ color: '#2B1810' }}>{kasir.name}</p>
                        <p className="text-[11px]" style={{ color: '#6B5448' }}>{kasir.role}</p>
                      </div>
                    </button>
                  )
                })}
              </div>
            </>
          ) : (
            /* Owner login left side */
            <div className="flex flex-col justify-center h-full">
              <div
                className="w-16 h-16 rounded-full flex items-center justify-center mb-6"
                style={{ background: '#F3E7CE', border: '2px solid #C49A62' }}
              >
                <Settings2 size={28} color="#8B4A1E" />
              </div>
              <h2 className="font-serif font-bold text-[24px] mb-2" style={{ color: '#2B1810' }}>Login Owner</h2>
              <p className="text-[14px]" style={{ color: '#6B5448' }}>
                Masukkan kredensial owner untuk mengakses dashboard dan pengaturan sistem.
              </p>
            </div>
          )}
        </div>

        {/* Toggle mode */}
        <div className="px-10 py-6" style={{ borderTop: '1px solid #E8D7C0' }}>
          <button
            onClick={() => { setLoginMode(m => m === 'owner' ? 'kasir' : 'owner'); setPin(''); setErrorMsg(''); setUsername(''); setPassword('') }}
            className="flex items-center gap-2 text-[13px] font-bold transition-colors"
            style={{ color: '#8B4A1E' }}
          >
            <Settings2 size={15} />
            {loginMode === 'owner' ? 'Kembali ke Login Kasir' : 'Masuk sebagai Admin / Owner'}
          </button>
        </div>
      </div>

      {/* Right panel: PIN / Owner form */}
      <div
        className="flex flex-col items-center justify-center shrink-0 px-10 py-10"
        style={{ width: 380, background: '#F3E7CE' }}
      >
        {loginMode === 'owner' ? (
          /* Owner form */
          <form onSubmit={handleOwnerLogin} className="w-full flex flex-col">
            <h3 className="font-serif font-bold text-[20px] mb-6 text-center" style={{ color: '#2B1810' }}>
              Otorisasi Owner
            </h3>

            <div className="flex flex-col gap-4 mb-4">
              {[
                { label: 'Username', type: 'text', value: username, onChange: (v: string) => { setUsername(v); setErrorMsg('') } },
                { label: 'Password', type: 'password', value: password, onChange: (v: string) => { setPassword(v); setErrorMsg('') } },
              ].map(field => (
                <div key={field.label}>
                  <label className="block text-[11px] font-bold mb-1.5" style={{ color: '#6B5448', letterSpacing: '0.06em' }}>
                    {field.label.toUpperCase()}
                  </label>
                  <input
                    type={field.type}
                    value={field.value}
                    onChange={e => field.onChange(e.target.value)}
                    className="w-full px-4 py-3 rounded-xl text-[14px] outline-none transition-colors"
                    style={{ background: 'white', border: '1.5px solid #E8D7C0', color: '#2B1810' }}
                    onFocus={e => { e.currentTarget.style.borderColor = '#8B4A1E' }}
                    onBlur={e => { e.currentTarget.style.borderColor = '#E8D7C0' }}
                    autoComplete="off"
                  />
                </div>
              ))}
            </div>

            {errorMsg && (
              <p className="text-center text-[12px] font-bold mb-3" style={{ color: '#B60000' }}>{errorMsg}</p>
            )}

            <button
              type="submit"
              className="w-full py-3.5 rounded-xl font-bold text-[15px]"
              style={{ background: '#8B4A1E', color: 'white' }}
            >
              Masuk ke Sistem
            </button>
          </form>
        ) : (
          /* PIN numpad */
          <>
            {/* Selected kasir */}
            {activeKasir && (
              <div className="flex items-center gap-3 mb-8">
                <div
                  className="overflow-hidden shrink-0"
                  style={{ width: 52, height: 52, borderRadius: '50%', border: '2.5px solid #8B4A1E' }}
                >
                  <img src={activeKasir.avatarUrl} alt={activeKasir.name} className="w-full h-full object-cover" />
                </div>
                <div>
                  <p className="font-bold text-[15px]" style={{ color: '#2B1810' }}>{activeKasir.name}</p>
                  <p className="text-[11px]" style={{ color: '#6B5448' }}>{activeKasir.role}</p>
                </div>
              </div>
            )}

            {/* PIN label */}
            <p className="text-[11px] font-bold mb-4" style={{ color: '#6B5448', letterSpacing: '0.08em' }}>
              PIN OTORISASI
            </p>

            {/* PIN dots */}
            <div
              className="flex gap-3 mb-2 transition-all"
              style={{ transform: shake ? 'translateX(-4px)' : 'none' }}
            >
              {[...Array(6)].map((_, i) => (
                <div
                  key={i}
                  className="rounded-full transition-all duration-150"
                  style={{
                    width: 14,
                    height: 14,
                    background: i < pin.length ? '#8B4A1E' : 'transparent',
                    border: `2px solid ${i < pin.length ? '#8B4A1E' : '#C49A62'}`,
                    transform: i < pin.length ? 'scale(1.15)' : 'scale(1)',
                  }}
                />
              ))}
            </div>

            {errorMsg ? (
              <p className="text-[12px] font-bold mb-5" style={{ color: '#B60000' }}>{errorMsg}</p>
            ) : (
              <div className="mb-5 h-5" />
            )}

            {/* Numpad */}
            <div className="grid grid-cols-3 gap-2.5 w-full">
              {[1, 2, 3, 4, 5, 6, 7, 8, 9].map(n => (
                <button
                  key={n}
                  onClick={() => pressPin(n.toString())}
                  className="py-4 rounded-xl font-extrabold text-[22px] transition-all active:scale-95"
                  style={{ background: 'white', color: '#2B1810', border: '1px solid #E8D7C0' }}
                >
                  {n}
                </button>
              ))}
              <button
                onClick={delPin}
                className="py-4 rounded-xl flex items-center justify-center transition-all active:scale-95"
                style={{ background: '#B60000', border: '1px solid #B60000' }}
              >
                <Delete size={22} color="white" strokeWidth={2.5} />
              </button>
              <button
                onClick={() => pressPin('0')}
                className="py-4 rounded-xl font-extrabold text-[22px] transition-all active:scale-95"
                style={{ background: 'white', color: '#2B1810', border: '1px solid #E8D7C0' }}
              >
                0
              </button>
              <button
                onClick={() => pin.length === 6 && onLogin('kasir')}
                className="py-4 rounded-xl flex items-center justify-center transition-all active:scale-95"
                style={{
                  background: pin.length === 6 ? '#5B8A2E' : '#E8D7C0',
                  border: pin.length === 6 ? '1px solid #5B8A2E' : '1px solid #E8D7C0',
                  cursor: pin.length === 6 ? 'pointer' : 'not-allowed',
                }}
              >
                <CheckCircle2 size={22} color={pin.length === 6 ? 'white' : '#C49A62'} strokeWidth={2.5} />
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
