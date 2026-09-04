import { useState } from 'react'
import { AlertTriangle } from 'lucide-react'

export default function BukaShiftScreen() {
  const [nominal, setNominal] = useState('500.000')
  const [hasPreviousShift, setHasPreviousShift] = useState(true)

  const handleAddNominal = (amount: number) => {
    // Parse current nominal
    const current = parseInt(nominal.replace(/\./g, '')) || 0
    const next = current + amount
    setNominal(next.toLocaleString('id-ID'))
  }

  return (
    <div className="bg-surface p-10 rounded-3xl w-[500px] flex flex-col border border-borderLight shadow-sm">
      {/* Header */}
      <div className="flex flex-col mb-6">
        <div className="text-[11px] font-bold text-primary tracking-wider mb-2 uppercase">
          PROSEDUR BUKA SHIFT
        </div>
        <h1 className="text-4xl font-serif font-bold text-textPrimary leading-none tracking-tight">
          Laporan Kas Awal
        </h1>
      </div>

      <div className="w-full h-px bg-borderLight mb-6"></div>

      {/* Kasir Info Card */}
      <div className="bg-keypadSpecial rounded-xl p-4 flex items-center gap-4 mb-6">
        <div className="w-14 h-14 rounded-full overflow-hidden border border-borderLight flex-shrink-0">
          <img src="https://i.pravatar.cc/150?u=a042581f4e29026024d" alt="Rina" className="w-full h-full object-cover" />
        </div>
        <div className="flex flex-col">
          <span className="font-semibold text-textPrimary text-sm">Rina (Kasir Utama)</span>
          <span className="text-textSecondary text-[13px] mt-0.5">WarungPOS Cabang Kemang</span>
          <span className="text-[#A39E97] font-mono text-[11px] mt-1 tracking-wider uppercase">Senin, 14 Mei 2025 • 07:00 WIB</span>
        </div>
      </div>

      {/* Warning Block */}
      {hasPreviousShift && (
        <div className="bg-[#FFF9F2] border border-[#F4A261] rounded-xl p-5 mb-6">
          <div className="flex items-center gap-2 text-[#E76F51] mb-2">
            <AlertTriangle size={18} strokeWidth={2.5} />
            <span className="font-bold text-[13px]">Shift Sebelumnya Belum Ditutup</span>
          </div>
          <p className="text-textPrimary text-[13px] leading-relaxed mb-4">
            Shift Kasir Budi (Minggu, 13 Mei) terdeteksi masih menggantung dengan 42 transaksi aktif.
          </p>
          <button 
            onClick={() => setHasPreviousShift(false)}
            className="bg-white border border-borderLight hover:bg-gray-50 active:bg-gray-100 transition-colors py-2 px-4 rounded-lg text-textPrimary text-[13px] font-semibold"
          >
            Tutup Shift Sebelumnya
          </button>
        </div>
      )}

      {/* Nominal Input */}
      <div className="flex flex-col mb-4">
        <label className="text-textSecondary font-semibold text-[13px] mb-2">
          Nominal Uang Laci Awal (Modal)
        </label>
        <div className="w-full border border-borderLight rounded-xl bg-[#FAF9F7] flex items-center px-6 py-4 focus-within:border-primary transition-colors">
          <span className="font-serif font-bold text-3xl text-[#BDB9B1] mr-3">Rp</span>
          <input 
            type="text" 
            value={nominal}
            onChange={(e) => {
              const val = e.target.value.replace(/[^0-9]/g, '');
              if (val) {
                setNominal(parseInt(val).toLocaleString('id-ID'));
              } else {
                setNominal('');
              }
            }}
            className="bg-transparent outline-none font-serif font-bold text-4xl text-primary w-full"
            placeholder="0"
          />
        </div>
      </div>

      {/* Quick Add Buttons */}
      <div className="grid grid-cols-4 gap-3 mb-6">
        <button onClick={() => handleAddNominal(100000)} className="bg-keypadSpecial hover:bg-[#E4DFD5] active:bg-[#D9D3C8] transition-colors py-2.5 rounded-lg text-textPrimary font-semibold text-[13px]">
          +100rb
        </button>
        <button onClick={() => handleAddNominal(200000)} className="bg-keypadSpecial hover:bg-[#E4DFD5] active:bg-[#D9D3C8] transition-colors py-2.5 rounded-lg text-textPrimary font-semibold text-[13px]">
          +200rb
        </button>
        <button onClick={() => handleAddNominal(500000)} className="bg-keypadSpecial hover:bg-[#E4DFD5] active:bg-[#D9D3C8] transition-colors py-2.5 rounded-lg text-textPrimary font-semibold text-[13px]">
          +500rb
        </button>
        <button onClick={() => handleAddNominal(1000000)} className="bg-keypadSpecial hover:bg-[#E4DFD5] active:bg-[#D9D3C8] transition-colors py-2.5 rounded-lg text-textPrimary font-semibold text-[13px]">
          +1jt
        </button>
      </div>

      {/* Notes */}
      <div className="flex flex-col mb-8">
        <label className="text-textSecondary font-semibold text-[13px] mb-2">
          Catatan Buka Shift (Opsional)
        </label>
        <textarea 
          className="w-full border border-borderLight rounded-xl bg-[#FAF9F7] p-4 text-[13px] text-textPrimary outline-none focus:border-primary transition-colors resize-none h-[80px]"
          placeholder="Contoh: Uang modal terdiri dari pecahan kecil..."
        ></textarea>
      </div>

      {/* Action Button */}
      <button className="w-full bg-primary hover:bg-primaryHover text-white font-semibold py-4 rounded-xl transition-colors text-[15px]">
        Buka Shift Sekarang
      </button>
    </div>
  )
}
