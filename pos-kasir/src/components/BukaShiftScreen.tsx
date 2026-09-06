import { useState } from 'react'
import { AlertTriangle, Delete, CheckCircle2 } from 'lucide-react'

export default function BukaShiftScreen({ onBukaShift }: { onBukaShift: () => void }) {
  const [nominal, setNominal] = useState('')
  const hasPreviousShift = true

  const handleNumpadPress = (val: string) => {
    setNominal(prev => {
      const current = prev.replace(/[^0-9]/g, '')
      if (current === '0') return val
      return current + val
    })
  }

  const handleDelete = () => {
    setNominal(prev => {
      const current = prev.replace(/[^0-9]/g, '')
      return current.slice(0, -1)
    })
  }

  const getDisplayNominal = () => {
    if (!nominal) return '0'
    return parseInt(nominal, 10).toLocaleString('id-ID')
  }

  return (
    <div className="flex flex-col w-full h-full md:h-screen bg-background font-sans overflow-hidden text-textPrimary">
      
      {/* Top Bar - Tablet Main */}
      <div className="hidden md:flex bg-white px-6 py-3 justify-between items-center border-b border-border shadow-sm z-10 shrink-0">
        <div className="flex items-center gap-3">
          <img src="/Hasuka-logo.png" alt="Hasuka Logo" className="w-8 h-8 object-contain" />
          <span className="font-extrabold text-lg tracking-tight text-primary">Buka Shift Baru</span>
        </div>
        
        <div className="flex items-center gap-5">
          <div className="flex px-2.5 py-1 rounded-full border border-success bg-white text-success text-[13px] font-bold items-center gap-1.5">
            <div className="w-2 h-2 rounded-full bg-success"></div>
            Online
          </div>
          <div className={"items-center gap-2 bg-surface hover:bg-gray-100 transition-colors px-3 py-1.5 rounded-full cursor-pointer border border-borderLight shadow-sm" + " flex"}>
            <img src="https://i.pravatar.cc/150?u=sri" alt="Sri Wahyuni" className="w-6 h-6 rounded-full object-cover border border-borderLight" />
            <span className="text-sm font-bold text-textPrimary">Sri Wahyuni <span className="text-textSecondary font-medium text-[11px]">(Meja 01)</span></span>
          </div>
          <span className="font-bold text-lg">15:42</span>
        </div>
      </div>

      <div className="flex-1 flex flex-col items-center p-4 md:p-8 overflow-y-auto">
        
        <div className="w-full max-w-4xl flex flex-col items-center">
          
          {/* Warning Block (Tablet & Mobile) */}
          {hasPreviousShift && (
            <div className="w-full bg-[#FCE8E8] border border-danger/30 rounded-xl p-4 flex items-center gap-3 mb-6 shadow-sm">
              <AlertTriangle size={24} className="text-danger shrink-0" strokeWidth={2.5} />
              <span className="font-bold text-danger text-[13px] md:text-sm">
                Perhatian: Shift sebelumnya telah ditutup otomatis secara paksa pada sistem oleh Admin.
              </span>
            </div>
          )}

          {/* Main Card Wrapper */}
          <div className="w-full bg-white md:border border-border md:rounded-3xl md:shadow-lg flex flex-col md:flex-row overflow-hidden relative">
            
            {/* Mobile Header (Only visible on mobile) */}
            <div className="md:hidden flex flex-col mb-6 mt-2">
              <h1 className="text-2xl font-extrabold text-textPrimary mb-1">Buka Shift Kasir</h1>
              <p className="text-textSecondary text-sm font-medium">Meja 01 &bull; Sri Wahyuni</p>
            </div>

            {/* Left Column */}
            <div className="flex-1 md:p-8 flex flex-col">
              
              <div className="hidden md:block mb-8">
                <h2 className="text-[28px] font-extrabold text-textPrimary mb-1 leading-tight">Buka Shift Baru</h2>
                <p className="text-textSecondary text-[15px]">Siapkan modal awal laci kasir secara akurat</p>
              </div>

              {/* Info Box */}
              <div className="bg-surface/50 border border-borderLight rounded-2xl p-5 mb-6 md:mb-8 flex flex-col gap-3">
                <div className="flex justify-between items-center text-sm md:text-[15px]">
                  <span className="text-textSecondary font-bold uppercase tracking-widest text-[11px] md:text-[12px]">
                    <span className="md:hidden">Lokasi Outlet</span>
                    <span className="hidden md:inline">Kasir Bertugas</span>
                  </span>
                  <span className="font-extrabold text-textPrimary">
                    <span className="md:hidden">Paskal Hyper Square</span>
                    <span className="hidden md:inline">Sri Wahyuni</span>
                  </span>
                </div>
                <div className="w-full h-px bg-borderLight/60"></div>
                <div className="flex justify-between items-center text-sm md:text-[15px]">
                  <span className="text-textSecondary font-bold uppercase tracking-widest text-[11px] md:text-[12px]">
                    <span className="md:hidden">Waktu Pembukaan</span>
                    <span className="hidden md:inline">Outlet</span>
                  </span>
                  <span className="font-extrabold text-textPrimary">
                    <span className="md:hidden">12 Apr 2026, 15:42 WIB</span>
                    <span className="hidden md:inline">Hasuka Dimsum - Paskal</span>
                  </span>
                </div>
                <div className="hidden md:block w-full h-px bg-borderLight/60"></div>
                <div className="hidden md:flex justify-between items-center text-sm md:text-[15px]">
                  <span className="text-textSecondary font-bold uppercase tracking-widest text-[11px] md:text-[12px]">Waktu Mulai</span>
                  <span className="font-extrabold text-textPrimary">Hari ini, 15:42 WIB</span>
                </div>
              </div>

              {/* Notes Box (Tablet Only) */}
              <div className="hidden md:flex flex-col">
                <label className="font-extrabold text-textSecondary text-[13px] mb-2">Catatan Buka Shift (Opsional)</label>
                <textarea 
                  className="w-full border-2 border-borderLight rounded-xl p-4 text-[14px] text-textPrimary placeholder:text-textSecondary/60 focus:border-primary focus:outline-none transition-colors resize-none h-24"
                  placeholder="Kondisi modal awal lengkap pecahan Rp 10rb & Rp 20rb..."
                ></textarea>
              </div>

            </div>

            {/* Right Column / Mobile Lower Half */}
            <div className="w-full md:w-[420px] lg:w-[480px] bg-white md:bg-[#EBE7DF] md:border-l border-border md:p-8 flex flex-col pt-0 md:pt-8">
              
              <div className="mb-6 flex flex-col w-full">
                <h3 className="text-[12px] md:text-[13px] font-extrabold text-textSecondary md:text-primary tracking-widest mb-2 uppercase text-left md:text-right">
                  <span className="md:hidden">Input Modal Awal (Laci Kas)</span>
                  <span className="hidden md:inline">Modal Awal Kas (Cash In)</span>
                </h3>
                <div className="w-full bg-white border-2 border-primary rounded-xl p-4 flex justify-between md:justify-end items-center">
                  <span className="font-extrabold text-2xl md:text-3xl text-primary md:hidden">Rp</span>
                  <span className="font-extrabold text-2xl md:text-3xl text-textPrimary md:text-primary">
                    <span className="md:hidden">{getDisplayNominal()}</span>
                    <span className="hidden md:inline">Rp {getDisplayNominal()}</span>
                  </span>
                </div>
              </div>

              {/* Numpad */}
              <div className="grid grid-cols-3 gap-3 w-full mb-8">
                {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((num) => (
                  <button 
                    key={num}
                    onClick={() => handleNumpadPress(num.toString())}
                    className="bg-white border border-borderLight hover:bg-gray-50 active:bg-surface transition-colors py-4 md:py-5 rounded-xl text-2xl font-extrabold text-textPrimary shadow-sm"
                  >
                    {num}
                  </button>
                ))}
                <button 
                  onClick={handleDelete}
                  className="bg-brand border border-brand active:bg-brand/80 transition-colors py-4 md:py-5 rounded-xl text-white flex items-center justify-center shadow-sm"
                >
                  <Delete size={28} strokeWidth={2.5} />
                </button>
                <button 
                  onClick={() => handleNumpadPress('0')}
                  className="bg-white border border-borderLight hover:bg-gray-50 active:bg-surface transition-colors py-4 md:py-5 rounded-xl text-2xl font-extrabold text-textPrimary shadow-sm"
                >
                  0
                </button>
                <button 
                  onClick={() => nominal ? onBukaShift() : null}
                  className={`hidden md:flex border transition-colors py-4 md:py-5 rounded-xl items-center justify-center shadow-sm ${nominal ? 'bg-primary border-primary text-white hover:bg-primaryHover' : 'bg-primary/20 border-primary/30 text-primary cursor-not-allowed'}`}
                >
                  <CheckCircle2 size={28} strokeWidth={2.5} />
                </button>
                <div className="md:hidden bg-success border border-success rounded-xl"></div>
              </div>

              {/* Action Button */}
              <button 
                onClick={onBukaShift}
                disabled={!nominal}
                className={`w-full py-4 rounded-xl font-extrabold text-[16px] transition-colors shadow-sm ${nominal ? 'bg-primary hover:bg-primaryHover text-white' : 'bg-gray-300 text-gray-500 cursor-not-allowed'}`}
              >
                Mulai Shift & Buka Laci
              </button>

            </div>
            
          </div>
        </div>
      </div>
    </div>
  )
}
