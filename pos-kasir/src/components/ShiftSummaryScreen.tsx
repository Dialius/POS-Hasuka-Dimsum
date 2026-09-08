import { Clock, FileText, CheckCircle2, TrendingUp, ShoppingBag, Wallet } from 'lucide-react'
import { useApp } from '../context/AppContext'
import { HASUKA_LOGO } from '../assets/logo'

const fmt = (n: number) => `Rp ${n.toLocaleString('id-ID')}`

export default function ShiftSummaryScreen({ onDone }: { onDone: () => void }) {
  const { kasirInfo, outlet } = useApp()

  const now = new Date()
  const shiftStart = new Date(now.getTime() - 7 * 60 * 60 * 1000 - 42 * 60 * 1000)
  const pad = (n: number) => String(n).padStart(2, '0')
  const timeStr = (d: Date) => `${pad(d.getHours())}:${pad(d.getMinutes())} WIB`
  const dateStr = now.toLocaleDateString('id-ID', { weekday: 'long', day: '2-digit', month: 'long', year: 'numeric' })

  const STATS = [
    { label: 'Total Transaksi', val: '47 transaksi', icon: ShoppingBag, color: '#5B8A2E' },
    { label: 'Omzet Shift', val: fmt(4312500), icon: TrendingUp, color: '#8B4A1E' },
    { label: 'Petty Cash Keluar', val: fmt(85000), icon: Wallet, color: '#C9A227' },
  ]

  return (
    <div className="flex flex-col w-full h-full overflow-hidden" style={{ background: '#FAF6ED' }}>

      {/* Top dark bar */}
      <div className="flex items-center gap-4 px-8 py-5 shrink-0" style={{ background: '#2B1810' }}>
        <img src={HASUKA_LOGO} alt="Hasuka" className="w-10 h-10 object-contain rounded-full" />
        <div>
          <h1 className="font-serif font-bold text-[18px]" style={{ color: '#F3E7CE' }}>Ringkasan Shift</h1>
          <p className="text-[12px]" style={{ color: '#C49A62' }}>{outlet.name}</p>
        </div>
      </div>

      {/* Main content */}
      <div className="flex-1 overflow-y-auto custom-scrollbar px-8 py-8">
        <div className="max-w-xl mx-auto space-y-5">

          {/* Success mark */}
          <div className="flex flex-col items-center text-center py-6">
            <div className="w-20 h-20 rounded-full flex items-center justify-center mb-4 animate-fade-in" style={{ background: '#5B8A2E' }}>
              <CheckCircle2 size={40} color="white" strokeWidth={2} />
            </div>
            <h2 className="font-serif font-bold text-[28px] mb-1" style={{ color: '#2B1810' }}>Shift Ditutup!</h2>
            <p className="text-[14px]" style={{ color: '#6B5448' }}>
              Selamat beristirahat, <span className="font-bold">{kasirInfo?.name ?? 'Kasir'}</span>. Shift hari ini telah selesai.
            </p>
          </div>

          {/* Shift info */}
          <div className="rounded-2xl p-5" style={{ background: 'white', border: '1px solid #E8D7C0' }}>
            <div className="flex items-center gap-2 mb-4">
              <Clock size={16} color="#8B4A1E" />
              <h3 className="font-bold text-[14px]" style={{ color: '#2B1810' }}>Informasi Shift</h3>
            </div>
            <div className="space-y-2.5">
              {[
                { label: 'Tanggal', val: dateStr },
                { label: 'Kasir', val: kasirInfo?.name ?? 'Kasir' },
                { label: 'Outlet', val: outlet.name },
                { label: 'Mulai Shift', val: timeStr(shiftStart) },
                { label: 'Tutup Shift', val: timeStr(now) },
                { label: 'Durasi', val: '7j 42m' },
              ].map(r => (
                <div key={r.label} className="flex justify-between text-[13px]">
                  <span style={{ color: '#6B5448' }}>{r.label}</span>
                  <span className="font-bold" style={{ color: '#2B1810' }}>{r.val}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-3 gap-3">
            {STATS.map(s => {
              const Icon = s.icon
              return (
                <div key={s.label} className="rounded-2xl p-4 text-center" style={{ background: 'white', border: '1px solid #E8D7C0' }}>
                  <div className="w-10 h-10 rounded-full flex items-center justify-center mx-auto mb-2" style={{ background: '#F3E7CE' }}>
                    <Icon size={18} color={s.color} />
                  </div>
                  <p className="font-serif font-bold text-[16px]" style={{ color: s.color }}>{s.val}</p>
                  <p className="text-[11px] mt-0.5" style={{ color: '#6B5448' }}>{s.label}</p>
                </div>
              )
            })}
          </div>

          {/* Rekonsiliasi kas summary */}
          <div className="rounded-2xl p-5" style={{ background: '#F3E7CE', border: '1px solid #C49A6240' }}>
            <h3 className="font-bold text-[14px] mb-4" style={{ color: '#2B1810' }}>Rekonsiliasi Kas</h3>
            {[
              { label: 'Kas Awal', val: fmt(500000) },
              { label: 'Penjualan Tunai', val: fmt(3750000), color: '#5B8A2E' },
              { label: 'Refund & Pengeluaran', val: `-${fmt(235000)}`, color: '#B60000' },
              { label: 'Ekspektasi Sistem', val: fmt(4015000), bold: true },
              { label: 'Kas Fisik Input', val: fmt(4000000), bold: true },
            ].map(r => (
              <div key={r.label} className="flex justify-between text-[13px] mb-2">
                <span style={{ color: '#6B5448' }}>{r.label}</span>
                <span className={r.bold ? 'font-extrabold' : 'font-semibold'} style={{ color: r.color ?? '#2B1810' }}>{r.val}</span>
              </div>
            ))}
            <div className="flex justify-between text-[13px] pt-2" style={{ borderTop: '1px dashed #C49A62' }}>
              <span className="font-bold" style={{ color: '#B60000' }}>Selisih</span>
              <span className="font-extrabold" style={{ color: '#B60000' }}>-Rp 15.000</span>
            </div>
          </div>

          {/* Actions */}
          <div className="flex flex-col gap-3 print:hidden">
            <button onClick={() => window.print()} className="w-full py-3.5 rounded-xl font-bold text-[14px] flex items-center justify-center gap-2" style={{ background: '#8B4A1E', color: 'white' }}>
              <FileText size={18} /> Cetak Laporan Shift
            </button>
            <button onClick={onDone} className="w-full py-3.5 rounded-xl font-bold text-[14px] transition-colors" style={{ background: 'white', color: '#2B1810', border: '1.5px solid #E8D7C0' }}>
              Kembali ke Login
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
