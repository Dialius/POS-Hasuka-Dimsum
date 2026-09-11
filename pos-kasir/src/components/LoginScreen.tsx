import { useState, useEffect } from 'react'
import { Delete, Settings2, CheckCircle2, ChevronDown, MapPin, AlertCircle } from 'lucide-react'
import { useApp, OUTLETS } from '../context/AppContext'
import { HASUKA_LOGO } from '../assets/logo'
import { gasApi } from '../services/gasApi'

export default function LoginScreen({ onLogin }: { onLogin: (role: 'kasir' | 'owner') => void }) {
  const { outlet, setOutlet, setKasirInfo, cashiersList } = useApp()

  const [loginMode, setLoginMode] = useState<'kasir' | 'owner'>('kasir')
  const [selectedKasir, setSelectedKasir] = useState<string | null>(null)
  const [pin, setPin] = useState('')
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [errorMsg, setErrorMsg] = useState('')
  const [shake, setShake] = useState(false)
  const [showOutletDropdown, setShowOutletDropdown] = useState(false)
  const [showConfigWarning, setShowConfigWarning] = useState(false)

  useEffect(() => {
    if (!gasApi.isConfigured()) {
      setShowConfigWarning(true)
    }
  }, [])

  const displayCashiers = cashiersList.filter(c => c.branchId === 'all' || c.branchId === outlet.id)
  const activeKasir = displayCashiers.find(k => k.id === selectedKasir)

  const pressPin = (val: string) => {
    if (!activeKasir) {
      setErrorMsg('Silakan pilih kasir terlebih dahulu!')
      setShake(true)
      setTimeout(() => setShake(false), 600)
      return
    }
    if (pin.length >= 6) return
    const next = pin + val
    setPin(next)
    if (errorMsg) setErrorMsg('')
    if (next.length === 6) {
      if (next === '654321') {
        const kasir = displayCashiers.find(k => k.id === selectedKasir)
        if (kasir) {
          setKasirInfo({
            id: kasir.id,
            name: kasir.name,
            role: kasir.role,
            avatarUrl: `https://ui-avatars.com/api/?name=${encodeURIComponent(kasir.name)}&background=F3E7CE&color=8B4A1E&bold=true`,
          })
        }
        
        // Auto-sync on login
        if (gasApi.isConfigured()) {
          gasApi.getInitialData(outlet.id).catch(e => console.warn('Auto-sync failed', e))
        }

        setTimeout(() => onLogin('kasir'), 300)
      } else {
        setErrorMsg('PIN salah. Coba lagi.')
        setShake(true)
        setTimeout(() => { setPin(''); setShake(false) }, 600)
      }
    }
  }

  const delPin = () => { setPin(p => p.slice(0, -1)); if (errorMsg) setErrorMsg('') }

  const handleOwnerLogin = (e: React.FormEvent) => {
    e.preventDefault()
    const valid =
      (username.toLowerCase() === 'admin' && password === 'admin123') ||
      (username.toLowerCase() === 'owner' && (password === 'hasuka888' || password === 'admin123'))
    if (valid) {
      setKasirInfo({ id: 'owner', name: 'Bpk. Haryanto', role: 'Owner', avatarUrl: '' })
      
      if (gasApi.isConfigured()) {
        gasApi.getInitialData().catch(e => console.warn('Owner auto-sync failed', e))
      }

      onLogin('owner')
    } else {
      setErrorMsg('Username atau password salah (Gunakan admin / admin123)')
    }
  }

  // Moved up above pressPin

  return (
    <div className="flex w-full h-full overflow-hidden" style={{ background: '#FAF6ED' }}>
      {/* ── Left Panel ── */}
      <div className="flex flex-col flex-1 overflow-y-auto" style={{ borderRight: '1px solid #E8D7C0' }}>

        {/* Brand header */}
        <div className="flex items-center gap-4 px-8 py-6" style={{ borderBottom: '1px solid #E8D7C0' }}>
          <img src={HASUKA_LOGO} alt="Hasuka" className="w-12 h-12 object-contain rounded-full" />
          <div>
            <div className="flex items-center gap-2">
              <h1 className="font-serif font-bold text-[22px] leading-tight" style={{ color: '#2B1810' }}>Hasuka Dimsum</h1>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#EAF3DE] text-[#2D6A4F] border border-[#B7E4C7]">
                v1.0.1 Live
              </span>
            </div>
            <p className="text-[12px]" style={{ color: '#6B5448' }}>Sistem Kasir POS • Cloud Connected</p>
          </div>
        </div>

        {/* Outlet selector */}
        {loginMode === 'kasir' && (
          <div className="px-8 pt-6 pb-4">
            <p className="text-[11px] font-bold mb-2" style={{ color: '#6B5448', letterSpacing: '0.08em' }}>PILIH OUTLET / CABANG</p>
            <div className="relative">
              <button
                onClick={() => setShowOutletDropdown(!showOutletDropdown)}
                className="w-full flex items-center gap-3 px-4 py-3 rounded-2xl text-left transition-colors"
                style={{ background: 'white', border: '1.5px solid #E8D7C0' }}
              >
                <MapPin size={16} color="#8B4A1E" />
                <div className="flex-1 min-w-0">
                  <p className="font-bold text-[14px] truncate" style={{ color: '#2B1810' }}>{outlet.name}</p>
                  <p className="text-[11px] truncate" style={{ color: '#6B5448' }}>{outlet.address}</p>
                </div>
                <ChevronDown size={16} color="#6B5448" className={`shrink-0 transition-transform ${showOutletDropdown ? 'rotate-180' : ''}`} />
              </button>

              {showOutletDropdown && (
                <div className="absolute top-full left-0 right-0 z-20 rounded-2xl mt-1 shadow-lg overflow-hidden" style={{ background: 'white', border: '1px solid #E8D7C0' }}>
                  {OUTLETS.map(o => (
                    <button
                      key={o.id}
                      onClick={() => { setOutlet(o); setShowOutletDropdown(false) }}
                      className="w-full text-left flex items-start gap-3 px-4 py-3 transition-colors"
                      style={{ background: outlet.id === o.id ? '#F3E7CE' : 'white', borderBottom: '1px solid #F3E7CE' }}
                    >
                      <MapPin size={14} color={outlet.id === o.id ? '#8B4A1E' : '#C49A62'} className="mt-0.5 shrink-0" />
                      <div>
                        <p className="font-bold text-[13px]" style={{ color: '#2B1810' }}>{o.name}</p>
                        <p className="text-[11px]" style={{ color: '#6B5448' }}>{o.address}</p>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Kasir / Owner selector */}
        <div className="px-8 flex-1 pb-6">
          {loginMode === 'kasir' ? (
            <>
              <p className="text-[11px] font-bold mb-3" style={{ color: '#6B5448', letterSpacing: '0.08em' }}>PILIH KASIR BERTUGAS</p>
              {displayCashiers.length === 0 ? (
                <div className="p-4 text-center rounded-2xl" style={{ background: 'white', border: '1.5px dashed #E8D7C0' }}>
                  <p className="text-[13px] font-bold" style={{ color: '#8B4A1E' }}>Belum ada kasir</p>
                  <p className="text-[11px]" style={{ color: '#6B5448' }}>Pilih cabang lain atau tambah kasir via Owner Dashboard.</p>
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-3">
                  {displayCashiers.map(kasir => {
                    const isSelected = selectedKasir === kasir.id
                    const avatarUrl = `https://ui-avatars.com/api/?name=${encodeURIComponent(kasir.name)}&background=F3E7CE&color=8B4A1E&bold=true`
                    return (
                      <div key={kasir.id} className="relative">
                        <button
                          onClick={() => { setSelectedKasir(kasir.id); setPin(''); setErrorMsg('') }}
                          className="w-full flex items-center gap-3 p-4 rounded-2xl text-left transition-all"
                          style={{
                            background: isSelected ? '#F3E7CE' : 'white',
                            border: isSelected ? '2px solid #8B4A1E' : '1.5px solid #E8D7C0',
                          }}
                        >
                          <div className="relative shrink-0">
                            <div className="overflow-hidden" style={{ width: 48, height: 48, borderRadius: '50%', border: isSelected ? '2.5px solid #8B4A1E' : '2px solid #E8D7C0' }}>
                              <img src={avatarUrl} alt={kasir.name} referrerPolicy="no-referrer" className="w-full h-full object-cover" />
                          </div>
                        </div>
                        <div>
                          <p className="font-bold text-[14px]" style={{ color: '#2B1810' }}>{kasir.name}</p>
                          <p className="text-[11px]" style={{ color: '#6B5448' }}>{kasir.role}</p>
                        </div>
                      </button>
                    </div>
                  )
                })}
              </div>
              )}
            </>
          ) : (
            <div className="flex flex-col justify-center h-full">
              <div className="w-14 h-14 rounded-full flex items-center justify-center mb-5" style={{ background: '#F3E7CE', border: '2px solid #C49A62' }}>
                <Settings2 size={24} color="#8B4A1E" />
              </div>
              <h2 className="font-serif font-bold text-[22px] mb-2" style={{ color: '#2B1810' }}>Login Owner</h2>
              <p className="text-[14px]" style={{ color: '#6B5448' }}>Akses dashboard & pengaturan sistem.</p>
            </div>
          )}
        </div>

        {/* Toggle: only show when in kasir mode */}
        {loginMode === 'kasir' && (
          <div className="px-8 py-5" style={{ borderTop: '1px solid #E8D7C0' }}>
            <button
              onClick={() => { setLoginMode('owner'); setPin(''); setErrorMsg(''); setUsername(''); setPassword('') }}
              className="flex items-center gap-2 text-[13px] font-bold transition-colors"
              style={{ color: '#8B4A1E' }}
            >
              <Settings2 size={15} />
              Masuk sebagai Admin / Owner
            </button>
          </div>
        )}
      </div>

      {/* ── Right Panel: PIN / Owner Form ── */}
      <div className="flex flex-col items-center justify-center shrink-0 px-8 py-8" style={{ width: 360, background: '#F3E7CE' }}>
        {loginMode === 'owner' ? (
          <form onSubmit={handleOwnerLogin} className="w-full flex flex-col">
            <h3 className="font-serif font-bold text-[20px] mb-6 text-center" style={{ color: '#2B1810' }}>Otorisasi Owner</h3>
            <div className="flex flex-col gap-4 mb-4">
              {[
                { label: 'Username', type: 'text', value: username, set: setUsername },
                { label: 'Password', type: 'password', value: password, set: setPassword },
              ].map(f => (
                <div key={f.label}>
                  <label className="block text-[11px] font-bold mb-1.5" style={{ color: '#6B5448', letterSpacing: '0.06em' }}>{f.label.toUpperCase()}</label>
                  <input
                    type={f.type} value={f.value}
                    onChange={e => { f.set(e.target.value); setErrorMsg('') }}
                    className="w-full px-4 py-3 rounded-xl text-[14px] outline-none"
                    style={{ background: 'white', border: '1.5px solid #E8D7C0', color: '#2B1810' }}
                    onFocus={e => { e.currentTarget.style.borderColor = '#8B4A1E' }}
                    onBlur={e => { e.currentTarget.style.borderColor = '#E8D7C0' }}
                  />
                </div>
              ))}
            </div>
            <p className="text-center text-[11px] mb-3" style={{ color: '#8B4A1E' }}>
              Demo: <b>admin</b> / <b>admin123</b> atau <b>owner</b> / <b>hasuka888</b>
            </p>
            {errorMsg && <p className="text-center text-[12px] font-bold mb-3" style={{ color: '#B60000' }}>{errorMsg}</p>}
            <button type="submit" className="w-full py-3.5 rounded-xl font-bold text-[15px] mb-3" style={{ background: '#8B4A1E', color: 'white' }}>
              Masuk ke Sistem
            </button>
            <button
              type="button"
              onClick={() => { setLoginMode('kasir'); setErrorMsg(''); setUsername(''); setPassword('') }}
              className="w-full py-2.5 rounded-xl text-[13px] font-bold flex items-center justify-center gap-1.5 transition-colors"
              style={{ background: 'transparent', color: '#6B5448', border: '1px solid #C49A6260' }}
            >
              ← Kembali ke Login Kasir
            </button>
          </form>
        ) : (
          <>
            {activeKasir && (
              <div className="flex items-center gap-3 mb-6">
                <div className="overflow-hidden shrink-0" style={{ width: 52, height: 52, borderRadius: '50%', border: '2.5px solid #8B4A1E' }}>
                  <img src={`https://ui-avatars.com/api/?name=${encodeURIComponent(activeKasir.name)}&background=F3E7CE&color=8B4A1E&bold=true`} alt={activeKasir.name} referrerPolicy="no-referrer" className="w-full h-full object-cover" />
                </div>
                <div>
                  <p className="font-bold text-[15px]" style={{ color: '#2B1810' }}>{activeKasir.name}</p>
                  <p className="text-[11px]" style={{ color: '#6B5448' }}>{activeKasir.role}</p>
                </div>
              </div>
            )}

            <p className="text-[11px] font-bold mb-3" style={{ color: '#6B5448', letterSpacing: '0.08em' }}>PIN OTORISASI</p>

            <div className={`flex gap-3 mb-2 ${shake ? 'animate-shake' : ''}`}>
              {[...Array(6)].map((_, i) => (
                <div key={i} className="rounded-full transition-all duration-150" style={{
                  width: 14, height: 14,
                  background: i < pin.length ? '#8B4A1E' : 'transparent',
                  border: `2px solid ${i < pin.length ? '#8B4A1E' : '#C49A62'}`,
                  transform: i < pin.length ? 'scale(1.15)' : 'scale(1)',
                }} />
              ))}
            </div>

            {errorMsg
              ? <p className="text-[12px] font-bold mb-4" style={{ color: '#B60000' }}>{errorMsg}</p>
              : <div className="mb-4 h-5" />}

            <div className="grid grid-cols-3 gap-2.5 w-full">
              {[1,2,3,4,5,6,7,8,9].map(n => (
                <button key={n} onClick={() => pressPin(n.toString())}
                  className="py-4 rounded-xl font-extrabold text-[22px] transition-all active:scale-95"
                  style={{ background: 'white', color: '#2B1810', border: '1px solid #E8D7C0' }}>
                  {n}
                </button>
              ))}
              <button onClick={delPin} className="py-4 rounded-xl flex items-center justify-center active:scale-95" style={{ background: '#B60000' }}>
                <Delete size={22} color="white" strokeWidth={2.5} />
              </button>
              <button onClick={() => pressPin('0')} className="py-4 rounded-xl font-extrabold text-[22px] active:scale-95" style={{ background: 'white', color: '#2B1810', border: '1px solid #E8D7C0' }}>0</button>
              <button onClick={() => pin.length === 6 && pressPin('')} className="py-4 rounded-xl flex items-center justify-center active:scale-95"
                style={{ background: pin.length === 6 ? '#5B8A2E' : '#E8D7C0', cursor: pin.length === 6 ? 'pointer' : 'not-allowed' }}>
                <CheckCircle2 size={22} color={pin.length === 6 ? 'white' : '#C49A62'} strokeWidth={2.5} />
              </button>
            </div>
          </>
        )}
      </div>
      {/* Configuration Warning Modal */}
      {showConfigWarning && (
        <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm px-4">
          <div className="bg-white rounded-3xl p-8 max-w-md w-full shadow-2xl flex flex-col items-center text-center">
            <div className="w-16 h-16 bg-[#FFF4F4] rounded-full flex items-center justify-center mb-4">
              <AlertCircle size={32} color="#B60000" />
            </div>
            <h2 className="font-serif font-bold text-[22px] mb-2" style={{ color: '#2B1810' }}>Database Belum Terhubung</h2>
            <p className="text-[14px] mb-6" style={{ color: '#6B5448' }}>
              Aplikasi belum terhubung dengan Google Spreadsheet. Silakan login sebagai Owner (Admin) lalu masukkan URL Integrasi di menu Pengaturan.
            </p>
            <button
              onClick={() => {
                setShowConfigWarning(false)
                setLoginMode('owner')
              }}
              className="w-full py-3.5 rounded-xl font-bold text-[15px] mb-3 transition-colors"
              style={{ background: '#8B4A1E', color: 'white' }}
            >
              Login sebagai Owner
            </button>
            <button
              onClick={() => setShowConfigWarning(false)}
              className="text-[13px] font-bold"
              style={{ color: '#6B5448' }}
            >
              Tutup Peringatan
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
