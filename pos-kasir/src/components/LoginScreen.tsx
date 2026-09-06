import { useState } from 'react'
import { Delete, Settings2, CheckCircle2, ShoppingBasket } from 'lucide-react'

const KASIR_LIST = [
  { id: '1', name: 'Sri Wahyuni', role: 'Kasir Senior', avatarUrl: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&q=80&w=150' },
  { id: '2', name: 'Budi Santoso', role: 'Kasir', avatarUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=150' },
  { id: '3', name: 'Ahmad Dani', role: 'Kasir Malam', avatarUrl: 'https://images.unsplash.com/photo-1583394838336-acd977736f90?auto=format&fit=crop&q=80&w=150' },
  { id: '4', name: 'Riska Amalia', role: 'Supervisor', avatarUrl: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?auto=format&fit=crop&q=80&w=150' },
]

export default function LoginScreen({ onLogin }: { onLogin: (role: 'kasir' | 'owner') => void }) {
  const [loginMode, setLoginMode] = useState<'kasir' | 'owner'>('kasir')
  const [selectedKasir, setSelectedKasir] = useState<string | null>('1') // Default selected for mobile view logic
  const [pin, setPin] = useState('')
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [errorMsg, setErrorMsg] = useState('')

  const handleKeyPress = (val: string) => {
    if (pin.length < 6) {
      const newPin = pin + val
      setPin(newPin)
      if (errorMsg) setErrorMsg('')
      
      // Auto-login on 6th digit for kasir demo purposes
      if (newPin.length === 6) {
        if (loginMode === 'kasir' && newPin === '654321') {
          setTimeout(() => onLogin('kasir'), 300)
        } else {
          setErrorMsg('PIN salah. Coba lagi.')
          setTimeout(() => setPin(''), 500)
        }
      }
    }
  }

  const handleDelete = () => {
    setPin(prev => prev.slice(0, -1))
  }

  const handleOwnerLogin = (e: React.FormEvent) => {
    e.preventDefault()
    if (username === 'admin' && password === 'admin123') {
      onLogin('owner')
    } else {
      setErrorMsg('Username atau Password salah')
    }
  }

  const activeKasir = KASIR_LIST.find(k => k.id === selectedKasir)

  return (
    <div className="flex flex-col w-full h-full md:h-screen bg-background font-sans overflow-hidden">
      
      {/* Top Bar - Tablet Only */}
      <div className="hidden md:flex bg-white px-6 py-3 justify-between items-center border-b border-border shadow-sm z-10 shrink-0">
        <div className="flex items-center gap-3">
          <img src="/Hasuka-logo.png" alt="Hasuka Logo" className="w-8 h-8 object-contain" />
          <span className="font-extrabold text-lg tracking-tight text-primary">Otorisasi PIN Masuk</span>
        </div>
        
        <div className="flex items-center gap-5">
          <div className="flex px-2.5 py-1 rounded-full border border-success bg-white text-success text-[13px] font-bold items-center gap-1.5">
            <div className="w-2 h-2 rounded-full bg-success"></div>
            Online
          </div>
          <span className="text-sm font-medium text-textSecondary">
            Menunggu Login &bull; Meja POS 01
          </span>
          <span className="font-bold text-lg text-textPrimary">15:42</span>
        </div>
      </div>

      <div className="flex-1 flex flex-col items-center justify-center p-4 md:p-8 relative">
        
        {/* Tablet Split Card */}
        <div className="hidden md:flex bg-white rounded-2xl shadow-lg border border-border/50 overflow-hidden w-[800px] h-[500px]">
          
          {/* Left Side: Select Kasir */}
          <div className="flex-1 p-8 flex flex-col relative">
            {loginMode === 'owner' ? (
              <div className="flex-1 flex flex-col justify-center items-center">
                <div className="w-24 h-24 rounded-full bg-primary/10 flex items-center justify-center mb-6">
                  <Settings2 size={40} className="text-primary" />
                </div>
                <h3 className="text-2xl font-extrabold text-textPrimary mb-2">Login Owner</h3>
                <p className="text-textSecondary text-center max-w-[250px]">Masukkan 6 digit PIN khusus Owner untuk mengakses Dashboard & Sistem.</p>
              </div>
            ) : (
              <>
                <div className="mb-6">
                  <h2 className="text-2xl font-extrabold text-textPrimary mb-1">Silakan Pilih Kasir</h2>
                  <p className="text-textSecondary text-sm">Ketuk profil Anda sebelum memasukkan PIN</p>
                </div>

                <div className="grid grid-cols-2 gap-4 flex-1">
                  {KASIR_LIST.map((kasir) => {
                    const isSelected = selectedKasir === kasir.id;
                    return (
                      <button 
                        key={kasir.id} 
                        onClick={() => { setSelectedKasir(kasir.id); setPin(''); setErrorMsg(''); }}
                        className={`flex flex-col items-center justify-center gap-2 p-4 rounded-xl border-2 transition-all ${isSelected ? 'border-primary bg-surface/50 shadow-sm' : 'border-borderLight/60 hover:border-border hover:bg-gray-50'}`}
                      >
                        <div className="w-16 h-16 rounded-full overflow-hidden border border-borderLight shadow-sm">
                          <img src={kasir.avatarUrl} alt={kasir.name} className="w-full h-full object-cover" />
                        </div>
                        <div className="flex flex-col items-center">
                          <span className={`font-extrabold text-[15px] ${isSelected ? 'text-textPrimary' : 'text-textPrimary/80'}`}>
                            {kasir.name}
                          </span>
                          <span className="text-textSecondary text-xs font-medium">
                            {kasir.role}
                          </span>
                        </div>
                      </button>
                    )
                  })}
                </div>
              </>
            )}

            <div className="mt-auto pt-6">
              <button 
                onClick={() => { setLoginMode(loginMode === 'owner' ? 'kasir' : 'owner'); setPin(''); setErrorMsg(''); setUsername(''); setPassword(''); }}
                className="flex items-center gap-2 text-primary hover:text-primaryHover font-extrabold text-[13px] transition-colors"
              >
                {loginMode === 'owner' ? (
                  <>Kembali ke Login Kasir</>
                ) : (
                  <><Settings2 size={16} /> Masuk sebagai Admin / Owner</>
                )}
              </button>
            </div>
          </div>

          {/* Right Side: Numpad / Owner Form */}
          <div className="w-[360px] bg-[#EBE7DF] border-l border-border p-8 flex flex-col items-center justify-center relative">
            
            {loginMode === 'owner' ? (
              <form onSubmit={handleOwnerLogin} className="w-full flex flex-col items-center">
                <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mb-6 shadow-sm border border-primary/20">
                  <Settings2 size={28} className="text-primary" />
                </div>
                <h3 className="text-lg font-extrabold text-textPrimary mb-6">Otorisasi Owner</h3>
                
                <div className="w-full flex flex-col gap-4 mb-6">
                  <div className="flex flex-col gap-1.5">
                    <label className="text-[12px] font-extrabold text-textSecondary uppercase tracking-wider">Username</label>
                    <input 
                      type="text" 
                      value={username}
                      onChange={(e) => { setUsername(e.target.value); setErrorMsg(''); }}
                      className="w-full px-4 py-3 rounded-xl border border-borderLight shadow-sm focus:outline-none focus:border-primary font-medium"
                      placeholder="Masukkan username"
                      autoComplete="off"
                    />
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <label className="text-[12px] font-extrabold text-textSecondary uppercase tracking-wider">Password</label>
                    <input 
                      type="password" 
                      value={password}
                      onChange={(e) => { setPassword(e.target.value); setErrorMsg(''); }}
                      className="w-full px-4 py-3 rounded-xl border border-borderLight shadow-sm focus:outline-none focus:border-primary font-medium"
                      placeholder="Masukkan kata sandi"
                    />
                  </div>
                </div>

                <div className="h-6 flex items-center justify-center w-full mb-2">
                  {errorMsg && <span className="text-danger text-sm font-bold animate-pulse">{errorMsg}</span>}
                </div>

                <button 
                  type="submit"
                  className="w-full bg-primary hover:bg-primaryHover text-white font-extrabold py-3.5 rounded-xl transition-colors shadow-sm"
                >
                  Masuk ke Sistem
                </button>
              </form>
            ) : (
              <>
                <div className="mb-8 flex flex-col items-center w-full">
                  <h3 className="text-[13px] font-extrabold text-textPrimary tracking-widest mb-4">PIN OTORISASI</h3>
                  <div className="flex gap-3">
                    {[...Array(6)].map((_, i) => (
                      <div 
                        key={i} 
                        className={`w-4 h-4 rounded-full border-2 transition-all duration-200 ${i < pin.length ? 'bg-primary border-primary scale-110' : 'bg-transparent border-primary/50'}`}
                      />
                    ))}
                  </div>
                  <div className="h-6 mt-2 flex items-center justify-center w-full">
                    {errorMsg && <span className="text-danger text-sm font-bold animate-pulse">{errorMsg}</span>}
                  </div>
                </div>

                {/* Tablet Numpad */}
                <div className="grid grid-cols-3 gap-3 w-full">
                  {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((num) => (
                    <button 
                      key={num}
                      onClick={() => handleKeyPress(num.toString())}
                      className="bg-white border border-borderLight hover:bg-gray-50 active:bg-gray-100 transition-colors py-4 rounded-xl text-2xl font-extrabold text-textPrimary shadow-sm"
                    >
                      {num}
                    </button>
                  ))}
                  <button 
                    onClick={handleDelete}
                    className="bg-brand border border-brand active:bg-brand/80 transition-colors py-4 rounded-xl text-white flex items-center justify-center shadow-sm"
                  >
                    <Delete size={24} strokeWidth={2.5} />
                  </button>
                  <button 
                    onClick={() => handleKeyPress('0')}
                    className="bg-white border border-borderLight hover:bg-gray-50 active:bg-gray-100 transition-colors py-4 rounded-xl text-2xl font-extrabold text-textPrimary shadow-sm"
                  >
                    0
                  </button>
                  <button 
                    onClick={() => pin.length === 6 ? onLogin('kasir') : null}
                    className={`border transition-colors py-4 rounded-xl flex items-center justify-center shadow-sm ${pin.length === 6 ? 'bg-[#5B8A2E] border-[#5B8A2E] text-white hover:bg-success/90' : 'bg-success/20 border-success/30 text-success cursor-not-allowed'}`}
                  >
                    <CheckCircle2 size={24} strokeWidth={2.5} />
                  </button>
                </div>
              </>
            )}
          </div>
        </div>

        {/* Mobile View */}
        <div className="md:hidden flex flex-col items-center w-full max-w-sm mt-8">
          
          {/* Header Mobile */}
          <div className="flex flex-col items-center mb-8 text-center">
            <div className="bg-[#DF690B] text-white p-3 rounded-xl mb-4 shadow-sm">
              <ShoppingBasket size={32} />
            </div>
            <h1 className="text-2xl font-extrabold text-textPrimary mb-1">Hasuka Dimsum</h1>
            <p className="text-textSecondary text-[11px] font-medium">F&B POS Client App &bull; Handphone Version</p>
          </div>

          {(!selectedKasir && loginMode === 'kasir') ? (
            /* Mobile: Select Kasir List */
            <div className="w-full flex flex-col gap-3">
              <div className="text-[11px] font-extrabold text-textSecondary tracking-widest uppercase mb-2 text-center">
                Pilih Kasir
              </div>
              {KASIR_LIST.map((kasir) => (
                <button 
                  key={kasir.id}
                  onClick={() => setSelectedKasir(kasir.id)}
                  className="bg-white border border-borderLight rounded-xl p-3 flex items-center gap-4 hover:border-primary transition-colors shadow-sm"
                >
                  <img src={kasir.avatarUrl} alt={kasir.name} className="w-12 h-12 rounded-full object-cover border border-borderLight" />
                  <div className="flex flex-col items-start">
                    <span className="font-extrabold text-[15px] text-textPrimary">{kasir.name}</span>
                    <span className="text-textSecondary text-xs">{kasir.role}</span>
                  </div>
                </button>
              ))}
            </div>
          ) : (
            /* Mobile: Numpad View / Owner Form */
            <div className="w-full flex flex-col items-center">
              
              {loginMode === 'owner' ? (
                <form onSubmit={handleOwnerLogin} className="w-full flex flex-col items-center bg-white border border-border rounded-2xl p-6 shadow-sm mb-6">
                  <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mb-4 border border-primary/20">
                    <Settings2 size={28} className="text-primary" />
                  </div>
                  <h3 className="text-[15px] font-extrabold text-textPrimary mb-6">Otorisasi Login Owner</h3>
                  
                  <div className="w-full flex flex-col gap-4 mb-6">
                    <div className="flex flex-col gap-1.5 text-left">
                      <label className="text-[12px] font-extrabold text-textSecondary uppercase tracking-wider">Username</label>
                      <input 
                        type="text" 
                        value={username}
                        onChange={(e) => { setUsername(e.target.value); setErrorMsg(''); }}
                        className="w-full px-4 py-3 rounded-xl border border-borderLight shadow-sm focus:outline-none focus:border-primary font-medium"
                        placeholder="Username owner"
                        autoComplete="off"
                      />
                    </div>
                    <div className="flex flex-col gap-1.5 text-left">
                      <label className="text-[12px] font-extrabold text-textSecondary uppercase tracking-wider">Password</label>
                      <input 
                        type="password" 
                        value={password}
                        onChange={(e) => { setPassword(e.target.value); setErrorMsg(''); }}
                        className="w-full px-4 py-3 rounded-xl border border-borderLight shadow-sm focus:outline-none focus:border-primary font-medium"
                        placeholder="Kata sandi owner"
                      />
                    </div>
                  </div>

                  <div className="h-5 flex items-center justify-center w-full mb-3">
                    {errorMsg && <span className="text-danger text-[12px] font-bold animate-pulse">{errorMsg}</span>}
                  </div>

                  <button 
                    type="submit"
                    className="w-full bg-primary hover:bg-primaryHover text-white font-extrabold py-3.5 rounded-xl transition-colors shadow-sm"
                  >
                    Masuk ke Sistem
                  </button>
                </form>
              ) : (
                <>
                  {/* Selected Kasir Card */}
                  <div className="w-full bg-white border border-border rounded-2xl p-4 flex items-center justify-between shadow-sm mb-8">
                    <div className="flex items-center gap-4">
                      <img src={activeKasir?.avatarUrl} alt={activeKasir?.name} className="w-14 h-14 rounded-full object-cover border border-borderLight" />
                      <div className="flex flex-col">
                        <span className="font-extrabold text-lg text-textPrimary">{activeKasir?.name}</span>
                        <span className="text-textSecondary text-xs">{activeKasir?.role} &bull; POS Meja 01</span>
                      </div>
                    </div>
                    <div className="border border-success text-success px-2 py-1 rounded-full text-[10px] font-bold">
                      Aktif
                    </div>
                  </div>

                  {/* PIN Indicator Mobile */}
                  <div className="mb-6 flex flex-col items-center w-full">
                    <h3 className="text-[12px] font-extrabold text-textSecondary tracking-widest mb-3 uppercase">
                      PIN OTORISASI KASIR
                    </h3>
                    <div className="flex gap-3">
                      {[...Array(6)].map((_, i) => (
                        <div 
                          key={i} 
                          className={`w-3.5 h-3.5 rounded-full border-2 transition-all duration-200 ${i < pin.length ? 'bg-primary border-primary scale-110' : 'bg-transparent border-primary/50'}`}
                        />
                      ))}
                    </div>
                    <div className="h-5 mt-2 flex items-center justify-center w-full">
                      {errorMsg && <span className="text-danger text-[11px] font-bold animate-pulse">{errorMsg}</span>}
                    </div>
                  </div>

                  {/* Numpad Mobile */}
                  <div className="grid grid-cols-3 gap-3 w-full mb-8">
                    {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((num) => (
                      <button 
                        key={num}
                        onClick={() => handleKeyPress(num.toString())}
                        className="bg-white border border-borderLight active:bg-surface transition-colors py-4 rounded-xl text-2xl font-extrabold text-textPrimary shadow-sm"
                      >
                        {num}
                      </button>
                    ))}
                    <button 
                      onClick={handleDelete}
                      className="bg-brand border border-brand active:bg-brand/80 transition-colors py-4 rounded-xl text-white flex items-center justify-center shadow-sm"
                    >
                      <Delete size={24} strokeWidth={2.5} />
                    </button>
                    <button 
                      onClick={() => handleKeyPress('0')}
                      className="bg-white border border-borderLight active:bg-surface transition-colors py-4 rounded-xl text-2xl font-extrabold text-textPrimary shadow-sm"
                    >
                      0
                    </button>
                    <button 
                      onClick={() => pin.length === 6 ? onLogin('kasir') : null}
                      className={`border transition-colors py-4 rounded-xl flex items-center justify-center shadow-sm ${pin.length === 6 ? 'bg-primary border-primary text-white active:bg-primaryHover' : 'bg-primary/20 border-primary/30 text-primary cursor-not-allowed'}`}
                    >
                      <CheckCircle2 size={24} strokeWidth={2.5} />
                    </button>
                  </div>
                </>
              )}

              <div className="flex w-full justify-between mt-4">
                <button 
                  onClick={() => { setSelectedKasir(null); setPin(''); setErrorMsg(''); setUsername(''); setPassword(''); }}
                  className="flex items-center gap-2 text-primary font-extrabold text-sm active:text-primaryHover transition-colors"
                >
                  <Settings2 size={16} />
                  Ganti Akun Kasir Lain
                </button>
                <button 
                  onClick={() => { setLoginMode(loginMode === 'owner' ? 'kasir' : 'owner'); setPin(''); setErrorMsg(''); setUsername(''); setPassword(''); }}
                  className="flex items-center gap-2 text-primary font-extrabold text-sm active:text-primaryHover transition-colors"
                >
                  {loginMode === 'owner' ? 'Masuk Kasir' : 'Masuk Owner'}
                </button>
              </div>

            </div>
          )}
        </div>

      </div>
    </div>
  )
}
