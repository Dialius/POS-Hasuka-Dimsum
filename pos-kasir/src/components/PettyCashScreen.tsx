import { useState } from 'react'
import { Store, Camera, Delete, ChevronDown , Menu } from 'lucide-react'
import { useSidebar } from '../context/SidebarContext'

export default function PettyCashScreen({ onBack }: { onBack: () => void }) {
  const [nominal, setNominal] = useState('')
  const [kategori, setKategori] = useState('Bahan Baku (Es Batu / Garnish)')
  const [isDropdownOpen, setIsDropdownOpen] = useState(false)
  const [keterangan, setKeterangan] = useState('')

  const handleNumpadPress = (val: string) => {
    setNominal(prev => {
      const current = prev.replace(/[^0-9]/g, '')
      if (current === '0' && val !== '000') return val
      if (current === '0' && val === '000') return '0'
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

  const { toggleSidebar } = useSidebar();

  return (
    <div className="flex flex-col w-full h-full md:h-screen bg-background font-sans overflow-hidden text-textPrimary">
      
      {/* Top Bar - Tablet Main */}
      <div className="hidden md:flex bg-white px-6 py-3 justify-between items-center border-b border-border shadow-sm z-10 shrink-0">
        <div className="flex items-center gap-3">
          
          <button onClick={toggleSidebar} className="p-2 -ml-2 rounded-xl text-textPrimary hover:bg-surface transition-colors hidden md:flex">
            <Menu size={22} />
          </button>
          <span className="font-extrabold text-lg tracking-tight text-primary">Catat Pengeluaran Kas</span>
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

      <div className="flex-1 flex flex-col md:flex-row items-start justify-center p-4 md:p-8 overflow-y-auto gap-6 md:gap-8 max-w-6xl mx-auto w-full relative pb-24 md:pb-8">
        
        {/* Mobile Header */}
        <div className="md:hidden flex flex-col mb-2 w-full">
          <div className="flex items-center gap-3 mb-1">
            <div className="bg-surface border border-borderLight p-2 rounded-lg text-primary">
              <div className="w-4 h-0.5 bg-primary rounded-full"></div>
            </div>
            <h1 className="text-2xl font-extrabold text-textPrimary">Petty Cash</h1>
          </div>
          <p className="text-textSecondary text-xs font-medium">Pengeluaran operasional mendadak outlet</p>
        </div>

        {/* Left Column: Form Petty Cash */}
        <div className="w-full bg-white md:border border-borderLight md:rounded-2xl md:p-8 md:shadow-sm flex flex-col flex-1">
          
          <div className="hidden md:flex items-center gap-3 border-b border-borderLight pb-4 mb-6">
            <div className="bg-primary/10 text-primary p-2 rounded-lg">
              <Store size={24} />
            </div>
            <h2 className="font-extrabold text-2xl text-textPrimary">Form Pengeluaran Kas (Petty Cash)</h2>
          </div>

          <div className="flex flex-col gap-4 md:gap-6 w-full">
            
            {/* Nominal Field */}
            <div className="flex flex-col gap-1.5 md:gap-2">
              <label className="text-[12px] md:text-[13px] font-extrabold text-textSecondary md:text-textPrimary uppercase tracking-widest">Nominal Pengeluaran {window.innerWidth >= 768 ? '(RP)' : ''}</label>
              <div className="w-full border border-borderLight md:border-primary rounded-xl px-4 py-3 md:py-4 bg-white md:bg-[#F9F7F4] flex justify-between md:justify-end items-center focus-within:border-primary transition-colors">
                <span className="font-extrabold text-2xl md:text-4xl text-textPrimary md:hidden">Rp</span>
                <span className="font-extrabold text-2xl md:text-4xl text-textPrimary">
                  <span className="hidden md:inline">Rp </span>{getDisplayNominal()}
                </span>
              </div>
            </div>

            {/* Kategori & Keterangan Row (Tablet) / Stack (Mobile) */}
            <div className="flex flex-col md:flex-row gap-4 md:gap-6">
              <div className="flex flex-col gap-1.5 md:gap-2 flex-1">
                <label className="text-[12px] md:text-[13px] font-extrabold text-textSecondary md:text-textPrimary uppercase tracking-widest">Kategori</label>
                <div className="relative">
                  <div 
                    onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                    className="w-full border border-borderLight md:border-primary/50 rounded-xl px-4 py-3.5 bg-white text-[14px] font-semibold text-textPrimary cursor-pointer flex justify-between items-center"
                  >
                    <span>{kategori}</span>
                    <ChevronDown className="text-textSecondary" size={20} />
                  </div>
                  {isDropdownOpen && (
                    <div className="absolute top-full left-0 right-0 mt-2 bg-white border border-borderLight rounded-xl shadow-lg z-20 flex flex-col overflow-hidden">
                      {['Bahan Baku (Es Batu / Garnish)', 'Transport / Bensin', 'Lain-lain'].map(kat => (
                        <div 
                          key={kat}
                          onClick={() => { setKategori(kat); setIsDropdownOpen(false); }}
                          className="px-4 py-3 hover:bg-surface cursor-pointer text-[14px] font-semibold text-textPrimary border-b border-borderLight/50 last:border-none"
                        >
                          {kat}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              <div className="flex flex-col gap-1.5 md:gap-2 flex-1">
                <label className="text-[12px] md:text-[13px] font-extrabold text-textSecondary md:text-textPrimary uppercase tracking-widest">Keterangan {window.innerWidth >= 768 ? 'Singkat' : ''}</label>
                <input 
                  type="text"
                  value={keterangan}
                  onChange={(e) => setKeterangan(e.target.value)}
                  className="w-full border border-borderLight md:border-primary/50 rounded-xl px-4 py-3.5 bg-white text-[14px] text-textPrimary outline-none focus:border-primary"
                  placeholder="Contoh: Beli es batu kristal 3 pack"
                />
              </div>
            </div>

            {/* Upload Foto Struk (Tablet Only, Mobile Optional per Design) */}
            <div className="hidden md:flex flex-col gap-2 mt-2">
              <label className="text-[13px] font-extrabold text-textPrimary uppercase tracking-widest">Foto Bukti / Struk (Opsional)</label>
              <div className="w-full border-2 border-dashed border-borderLight hover:border-primary bg-surface/30 rounded-2xl p-8 flex flex-col items-center justify-center gap-3 cursor-pointer transition-colors group">
                <div className="text-primary group-hover:scale-110 transition-transform">
                  <Camera size={32} strokeWidth={1.5} />
                </div>
                <span className="font-extrabold text-primary">Ambil Foto atau Upload Struk</span>
                <span className="text-xs text-textSecondary font-medium">Format JPG, PNG (Maks 5MB)</span>
              </div>
            </div>

            {/* Riwayat Hari Ini (Mobile Only, since Tablet has it on the right) */}
            <div className="md:hidden flex flex-col mt-4">
              <label className="text-[12px] font-extrabold text-textSecondary uppercase tracking-widest mb-3">Riwayat Hari Ini</label>
              <div className="border border-borderLight rounded-xl p-4 flex flex-col gap-1 bg-white">
                <div className="flex justify-between items-center">
                  <span className="font-extrabold text-[15px]">Belanja kemasan plastik takeaway</span>
                  <span className="font-extrabold text-danger">- Rp 105.000</span>
                </div>
                <span className="text-xs text-textSecondary">12:30 &bull; Operasional</span>
              </div>
            </div>

            {/* Numpad Mobile (Rendered below on mobile to satisfy strict PRD anti-slop) */}
            <div className="md:hidden flex flex-col mt-4 mb-8">
               <div className="grid grid-cols-3 gap-3 w-full">
                {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((num) => (
                  <button 
                    key={num}
                    onClick={() => handleNumpadPress(num.toString())}
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
                  onClick={() => handleNumpadPress('0')}
                  className="bg-white border border-borderLight active:bg-surface transition-colors py-4 rounded-xl text-2xl font-extrabold text-textPrimary shadow-sm"
                >
                  0
                </button>
                <button 
                  onClick={() => handleNumpadPress('000')}
                  className="bg-white border border-borderLight active:bg-surface transition-colors py-4 rounded-xl text-lg font-extrabold text-textPrimary shadow-sm"
                >
                  000
                </button>
              </div>
            </div>

            {/* Action Buttons Tablet */}
            <div className="hidden md:flex justify-end gap-4 mt-6">
              <button onClick={onBack} className="px-8 py-3.5 bg-white border border-border hover:bg-surface rounded-xl font-extrabold text-primary transition-colors">
                Batal
              </button>
              <button onClick={onBack} className="px-8 py-3.5 bg-primary hover:bg-primaryHover text-white rounded-xl font-extrabold transition-colors shadow-sm">
                Simpan Transaksi Kas
              </button>
            </div>

          </div>
        </div>

        {/* Right Column: Numpad & Riwayat (Tablet Only) */}
        <div className="hidden md:flex flex-col w-[380px] lg:w-[420px] gap-6 shrink-0">
          
          <div className="bg-surface/50 border border-borderLight rounded-2xl p-6 shadow-sm">
            <div className="grid grid-cols-3 gap-3 w-full">
              {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((num) => (
                <button 
                  key={num}
                  onClick={() => handleNumpadPress(num.toString())}
                  className="bg-white border border-borderLight hover:bg-gray-50 active:bg-gray-100 transition-colors py-5 rounded-xl text-[22px] font-extrabold text-textPrimary shadow-sm"
                >
                  {num}
                </button>
              ))}
              <button 
                onClick={handleDelete}
                className="bg-brand border border-brand active:bg-brand/80 transition-colors py-5 rounded-xl text-white flex items-center justify-center shadow-sm"
              >
                <Delete size={24} strokeWidth={2.5} />
              </button>
              <button 
                onClick={() => handleNumpadPress('0')}
                className="bg-white border border-borderLight hover:bg-gray-50 active:bg-gray-100 transition-colors py-5 rounded-xl text-[22px] font-extrabold text-textPrimary shadow-sm"
              >
                0
              </button>
              <button 
                onClick={() => handleNumpadPress('000')}
                className="bg-white border border-borderLight hover:bg-gray-50 active:bg-gray-100 transition-colors py-5 rounded-xl text-[20px] font-extrabold text-textPrimary shadow-sm"
              >
                000
              </button>
            </div>
          </div>

          <div className="bg-white border border-borderLight rounded-2xl p-6 shadow-sm flex flex-col flex-1">
            <h3 className="font-extrabold text-[16px] text-textPrimary mb-4">Riwayat Pengeluaran Hari Ini</h3>
            
            <div className="flex flex-col gap-3">
              <div className="bg-[#FAF9F7] border border-borderLight/60 rounded-xl p-4 flex flex-col gap-1">
                <div className="flex justify-between items-start">
                  <span className="font-extrabold text-primary text-[14px]">Bahan Baku</span>
                  <span className="font-extrabold text-textPrimary">Rp 120.000</span>
                </div>
                <span className="text-[13px] text-textPrimary leading-snug">Beli Daun Bawang & Cabai di Pasar</span>
                <span className="text-[11px] text-textSecondary mt-1">Jam 11:15 &bull; Sri Wahyuni</span>
              </div>

              <div className="bg-[#FAF9F7] border border-borderLight/60 rounded-xl p-4 flex flex-col gap-1">
                <div className="flex justify-between items-start">
                  <span className="font-extrabold text-primary text-[14px]">Transport</span>
                  <span className="font-extrabold text-textPrimary">Rp 35.000</span>
                </div>
                <span className="text-[13px] text-textPrimary leading-snug">Ojek Kurir Antar Dimsum Titipan Event</span>
                <span className="text-[11px] text-textSecondary mt-1">Jam 09:30 &bull; Sri Wahyuni</span>
              </div>
            </div>
          </div>

        </div>

      </div>

      {/* Action Button Mobile Fixed Bottom */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 p-4 bg-white border-t border-borderLight z-20">
        <button onClick={onBack} className="w-full bg-primary hover:bg-primaryHover text-white py-4 rounded-xl font-extrabold text-[15px] shadow-sm transition-colors">
          Simpan Petty Cash
        </button>
      </div>

    </div>
  )
}
