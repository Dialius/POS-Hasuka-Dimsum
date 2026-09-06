import { useState } from 'react'
import { Delete, Check, Menu } from 'lucide-react'
import { useSidebar } from '../context/SidebarContext'

const formatRp = (num: number) => `Rp ${num.toLocaleString('id-ID')}`

export default function TutupShiftScreen({ onLogout, onBack }: { onLogout: () => void, onBack: () => void }) {
  const { toggleSidebar } = useSidebar()
  // System values
  const kasAwal = 500000
  const penjualanTunai = 3750000
  const refund = 150000
  const pengeluaran = 85000
  const kasSistem = kasAwal + penjualanTunai - refund - pengeluaran

  const [inputLaci, setInputLaci] = useState('4000000') // Default to demo difference
  const [alasan, setAlasan] = useState('Terdapat selisih minus Rp 15.000 karena refund tunai salah catat, nominal laci fisik Rp 4.000.000')
  
  const physicalCash = parseInt(inputLaci || '0', 10)
  const difference = physicalCash - kasSistem
  const hasDifference = difference !== 0

  const handleNumpadPress = (val: string) => {
    setInputLaci(prev => {
      const current = prev.replace(/[^0-9]/g, '')
      if (current === '0' && val !== '000') return val
      if (current === '0' && val === '000') return '0'
      return current + val
    })
  }

  const handleDelete = () => {
    setInputLaci(prev => {
      const current = prev.replace(/[^0-9]/g, '')
      return current.slice(0, -1)
    })
  }

  const getDisplayInput = () => {
    if (!inputLaci) return '0'
    return parseInt(inputLaci, 10).toLocaleString('id-ID')
  }

  return (
    <div className="flex flex-col w-full h-full md:h-screen bg-background font-sans overflow-hidden text-textPrimary">
      
      {/* Top Bar - Tablet Main */}
      <div className="hidden md:flex bg-white px-6 py-3 justify-between items-center border-b border-border shadow-sm z-10 shrink-0">
        <div className="flex items-center gap-3">
          <button onClick={toggleSidebar} className="p-2 -ml-2 rounded-xl text-textPrimary hover:bg-surface transition-colors hidden md:flex">
            <Menu size={22} />
          </button>
          <span className="font-extrabold text-lg tracking-tight text-primary">Tutup Shift & Rekonsiliasi Kas</span>
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

      <div className="flex-1 flex flex-col md:flex-row items-center md:items-start justify-center p-4 md:p-8 overflow-y-auto gap-4 md:gap-8 max-w-7xl mx-auto w-full">
        
        {/* Mobile Header (Only visible on mobile) */}
        <div className="md:hidden flex flex-col mb-4 w-full">
          <div className="flex items-center gap-3 mb-1 cursor-pointer" onClick={onBack}>
            <div className="bg-surface border border-borderLight p-2 rounded-lg text-primary">
              <div className="w-4 h-0.5 bg-primary rounded-full"></div>
            </div>
            <h1 className="text-xl font-extrabold text-textPrimary">Tutup Shift</h1>
          </div>
          <p className="text-textSecondary text-xs">Rekonsiliasi kas laci & cetak laporan</p>
        </div>

        {/* Left Card: Summary & Petty Cash */}
        <div className="w-full flex flex-col gap-4 md:gap-6 md:flex-1 md:max-w-2xl">
          
          {/* Ringkasan Kas Laci */}
          <div className="bg-[#EBE7DF] md:bg-surface border border-borderLight rounded-2xl p-5 md:p-6 shadow-sm flex flex-col">
            <div className="flex justify-between items-center mb-4 md:mb-6">
              <h2 className="font-extrabold text-[15px] md:text-lg text-textPrimary">
                <span className="md:hidden">Ringkasan Kas Laci</span>
                <span className="hidden md:inline">Rekonsiliasi Kas Shift Ini</span>
              </h2>
              <span className="hidden md:inline text-[13px] text-textSecondary">Shift: Siang (07:00 - 15:00)</span>
            </div>

            <div className="flex flex-col gap-3">
              <div className="flex justify-between items-center text-[13px] md:text-[15px]">
                <span className="text-textSecondary">
                  <span className="md:hidden">Kas Awal</span>
                  <span className="hidden md:inline">Modal Laci Kas Awal</span>
                </span>
                <span className="font-extrabold text-textPrimary">{formatRp(kasAwal)}</span>
              </div>
              <div className="flex justify-between items-center text-[13px] md:text-[15px]">
                <span className="text-textSecondary">
                  <span className="md:hidden">Tunai Masuk</span>
                  <span className="hidden md:inline">Total Transaksi Tunai Masuk</span>
                </span>
                <span className="font-extrabold text-success">+{formatRp(penjualanTunai)}</span>
              </div>
              <div className="hidden md:flex justify-between items-center text-[15px]">
                <span className="text-textSecondary">Total Refund Terbayar</span>
                <span className="font-extrabold text-danger">-{formatRp(refund)}</span>
              </div>
              <div className="flex justify-between items-center text-[13px] md:text-[15px]">
                <span className="text-textSecondary">
                  <span className="md:hidden">Petty Cash Keluar</span>
                  <span className="hidden md:inline">Total Pengeluaran Petty Cash</span>
                </span>
                <span className="font-extrabold text-danger">-{formatRp(pengeluaran)}</span>
              </div>
            </div>

            <div className="w-full h-px bg-borderLight/60 md:bg-border/30 my-4"></div>

            <div className="flex justify-between items-center">
              <span className="font-extrabold text-[14px] md:text-[16px] text-textPrimary uppercase">
                <span className="md:hidden">Kas Seharusnya</span>
                <span className="hidden md:inline">Kas Seharusnya Di Laci</span>
              </span>
              <span className="font-extrabold text-[16px] md:text-[22px] text-primary md:text-textPrimary">
                {formatRp(kasSistem)}
              </span>
            </div>
          </div>

          {/* Petty Cash Details (Tablet Only) */}
          <div className="hidden md:flex flex-col bg-white border border-borderLight rounded-2xl p-6 shadow-sm">
            <h3 className="font-extrabold text-[15px] mb-4">Petty Cash / Pengeluaran Toko Hari Ini</h3>
            <div className="flex flex-col gap-3">
              <div className="flex justify-between items-center text-[14px]">
                <span>1. Pembelian Air Galon Kukusan</span>
                <span className="font-extrabold text-danger">Rp 25.000</span>
              </div>
              <div className="flex justify-between items-center text-[14px]">
                <span>2. Bensin Kurir Bahan Baku</span>
                <span className="font-extrabold text-danger">Rp 60.000</span>
              </div>
            </div>
          </div>

          {/* Notes Input (Tablet Only) */}
          <div className="hidden md:flex flex-col w-full">
            <label className="font-extrabold text-[13px] mb-2">Catatan Penutupan Shift (Wajib jika ada selisih)</label>
            <textarea 
              value={alasan}
              onChange={(e) => setAlasan(e.target.value)}
              className="w-full h-24 bg-white border border-borderLight rounded-xl p-4 text-[14px] text-textPrimary focus:border-primary focus:outline-none resize-none"
              placeholder="Masukkan catatan disini..."
            />
          </div>

        </div>

        {/* Right Card: Numpad for Physical Cash */}
        <div className="w-full md:w-[460px] flex flex-col shrink-0 gap-4 md:gap-6">
          
          {/* Input Display Card */}
          <div className="bg-white md:border border-borderLight md:rounded-2xl md:p-6 md:shadow-sm flex flex-col items-center">
            
            <h2 className="hidden md:block text-[13px] font-extrabold text-textSecondary uppercase tracking-widest mb-4">Total Kas Fisik Di Laci</h2>
            <h2 className="md:hidden text-[11px] font-extrabold text-textSecondary uppercase tracking-widest mb-2 w-full text-left">Masukkan Kas Fisik Di Laci</h2>

            <div className="w-full border border-borderLight md:border-none rounded-xl bg-white md:bg-transparent flex justify-end items-center px-4 py-3 md:p-0 md:justify-center mb-2 md:mb-4">
              <span className="font-extrabold text-2xl md:text-[36px] text-textPrimary">
                Rp {getDisplayInput()}
              </span>
            </div>

            {/* Badge Indicator */}
            <div className="w-full flex justify-start md:justify-center mb-4 md:mb-0">
              {hasDifference ? (
                <div className="bg-[#FCE8E8] text-danger px-3 md:px-4 py-1.5 md:py-2 rounded-lg md:rounded-full font-bold text-[12px] md:text-[14px]">
                  Selisih: {difference > 0 ? '+' : '-'}{formatRp(Math.abs(difference))} ({difference > 0 ? 'Lebih' : 'Kurang'})
                </div>
              ) : (
                <div className="bg-success/10 text-success px-3 md:px-4 py-1.5 md:py-2 rounded-lg md:rounded-full font-bold text-[12px] md:text-[14px]">
                  Selisih: Rp 0 (Cocok/Balanced)
                </div>
              )}
            </div>
          </div>

          {/* Numpad Block */}
          <div className="bg-white md:bg-[#F9F7F4] md:border border-borderLight md:rounded-2xl md:p-6 md:shadow-sm flex flex-col w-full">
            <div className="grid grid-cols-3 gap-3 md:gap-4 w-full mb-4 md:mb-6">
              {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((num) => (
                <button 
                  key={num}
                  onClick={() => handleNumpadPress(num.toString())}
                  className="bg-white border border-borderLight active:bg-surface transition-colors py-4 md:py-5 rounded-xl md:rounded-lg text-2xl md:text-[22px] font-extrabold text-textPrimary shadow-sm"
                >
                  {num}
                </button>
              ))}
              <button 
                onClick={handleDelete}
                className="bg-brand border border-brand active:bg-brand/80 transition-colors py-4 md:py-5 rounded-xl md:rounded-lg text-white flex items-center justify-center shadow-sm"
              >
                <Delete size={24} strokeWidth={2.5} />
              </button>
              <button 
                onClick={() => handleNumpadPress('0')}
                className="bg-white border border-borderLight active:bg-surface transition-colors py-4 md:py-5 rounded-xl md:rounded-lg text-2xl md:text-[22px] font-extrabold text-textPrimary shadow-sm"
              >
                0
              </button>
              <button 
                onClick={() => handleNumpadPress('000')}
                className="hidden md:block bg-white border border-borderLight active:bg-surface transition-colors py-4 md:py-5 rounded-lg text-[20px] font-extrabold text-textPrimary shadow-sm"
              >
                000
              </button>
              <div className="md:hidden bg-success border border-success rounded-xl"></div>
            </div>

            {/* Action Button */}
            <button 
              onClick={() => {
                if (hasDifference && !alasan && window.innerWidth >= 768) {
                  alert('Harap isi alasan selisih sebelum menutup shift.')
                  return
                }
                onLogout()
              }}
              className="w-full bg-primary md:bg-brand hover:opacity-90 text-white font-extrabold py-4 rounded-xl transition-colors text-[15px] flex items-center justify-center gap-2 shadow-sm"
            >
              <span className="hidden md:inline"><Check size={20} strokeWidth={3} /></span>
              <span className="md:hidden">Proses Tutup Shift & Cetak</span>
              <span className="hidden md:inline">Tutup Shift & Print Struk Kas</span>
            </button>
          </div>

        </div>
      </div>
    </div>
  )
}
