import { Clock, FileText, CheckCircle2, TrendingUp, ShoppingBag, Wallet } from 'lucide-react'
import { useApp } from '../context/AppContext'
import { HASUKA_LOGO } from '../assets/logo'
import { Button } from './common/Button'
import { fmt } from '../utils/formatters'


export interface ShiftSummary {
  totalTransactions: number
  omzet: number
  pettyCash: number
  startTime?: string
  endTime?: string
  kasAwal?: number
  kasFisik?: number
  selisih?: number
  cashierName?: string
  outletName?: string
}

export default function ShiftSummaryScreen({ summary, onDone }: { summary: ShiftSummary; onDone: () => void }) {
  const { kasirInfo, outlet, receiptSettings } = useApp()
  const displayLogo = receiptSettings?.logoUrl || HASUKA_LOGO

  const end = summary.endTime ? new Date(summary.endTime) : new Date()
  const start = summary.startTime ? new Date(summary.startTime) : end
  const pad = (n: number) => String(n).padStart(2, '0')
  const timeStr = (d: Date) => `${pad(d.getHours())}:${pad(d.getMinutes())} WIB`
  const dateStr = end.toLocaleDateString('id-ID', { weekday: 'long', day: '2-digit', month: 'long', year: 'numeric' })

  const durMs = Math.max(0, end.getTime() - start.getTime())
  const dur = `${Math.floor(durMs / 3600000)}j ${Math.floor((durMs % 3600000) / 60000)}m`

  const kasAwal = summary.kasAwal ?? 0
  const pettyCash = summary.pettyCash
  // ponytail: omzet shift dipakai sebagai proxy penjualan tunai; pisahkan saat summary punya field tunai
  const ekspektasi = kasAwal + summary.omzet - pettyCash
  const kasFisik = summary.kasFisik ?? ekspektasi
  const selisih = summary.selisih ?? (kasFisik - ekspektasi)
  const selisihLabel = `${selisih > 0 ? '+' : selisih < 0 ? '-' : ''}${fmt(Math.abs(selisih)).replace('Rp ', 'Rp ')}`

  const STATS = [
    { label: 'Total Transaksi', val: `${summary.totalTransactions} transaksi`, icon: ShoppingBag, color: '#5B8A2E' },
    { label: 'Omzet Shift', val: fmt(summary.omzet), icon: TrendingUp, color: '#8B4A1E' },
    { label: 'Petty Cash Keluar', val: fmt(pettyCash), icon: Wallet, color: '#C9A227' },
  ]

  return (
    <div className="flex flex-col w-full h-full overflow-hidden" style={{ background: '#FAF6ED' }}>

      {/* Top dark bar */}
      <div className="flex items-center gap-3 md:gap-4 px-4 md:px-8 py-3.5 md:py-5 shrink-0" style={{ background: '#2B1810' }}>
        <img src={displayLogo} alt="Hasuka" className="w-9 h-9 md:w-10 md:h-10 object-contain rounded-full" />
        <div>
          <h1 className="font-serif font-bold text-[16px] md:text-[18px]" style={{ color: '#F3E7CE' }}>Ringkasan Shift</h1>
          <p className="text-[11px] md:text-[12px]" style={{ color: '#C49A62' }}>{summary.outletName ?? outlet.name}</p>
        </div>
      </div>

      {/* Main content */}
      <div className="flex-1 overflow-y-auto custom-scrollbar px-3.5 md:px-8 py-5 md:py-8">
        <div className="max-w-xl mx-auto space-y-4 md:space-y-5">

          {/* Success mark */}
          <div className="flex flex-col items-center text-center py-4 md:py-6">
            <div className="w-16 h-16 md:w-20 md:h-20 rounded-full flex items-center justify-center mb-3 md:mb-4 animate-fade-in" style={{ background: '#5B8A2E' }}>
              <CheckCircle2 size={36} color="white" strokeWidth={2.5} />
            </div>
            <h2 className="font-serif font-bold text-[22px] md:text-[28px] mb-1" style={{ color: '#2B1810' }}>Shift Ditutup!</h2>
            <p className="text-[13px] md:text-[14px]" style={{ color: '#6B5448' }}>
              Selamat beristirahat, <span className="font-bold">{summary.cashierName ?? kasirInfo?.name ?? 'Kasir'}</span>. Shift hari ini telah selesai.
            </p>
          </div>

          {/* Shift info */}
          <div className="rounded-2xl p-4 md:p-5" style={{ background: 'white', border: '1px solid #E8D7C0' }}>
            <div className="flex items-center gap-2 mb-3 md:mb-4">
              <Clock size={16} color="#8B4A1E" />
              <h3 className="font-bold text-[13px] md:text-[14px]" style={{ color: '#2B1810' }}>Informasi Shift</h3>
            </div>
            <div className="space-y-2 md:space-y-2.5">
              {[
                { label: 'Tanggal', val: dateStr },
                { label: 'Kasir', val: summary.cashierName ?? kasirInfo?.name ?? 'Kasir' },
                { label: 'Outlet', val: summary.outletName ?? outlet.name },
                { label: 'Mulai Shift', val: timeStr(start) },
                { label: 'Tutup Shift', val: timeStr(end) },
                { label: 'Durasi', val: dur },
              ].map(r => (
                <div key={r.label} className="flex justify-between text-[12px] md:text-[13px]">
                  <span style={{ color: '#6B5448' }}>{r.label}</span>
                  <span className="font-bold" style={{ color: '#2B1810' }}>{r.val}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 md:gap-4">
            {STATS.map(s => {
              const Icon = s.icon
              return (
                <div key={s.label} className="rounded-2xl p-3.5 md:p-4 text-center" style={{ background: 'white', border: '1px solid #E8D7C0' }}>
                  <div className="w-9 h-9 md:w-10 md:h-10 rounded-full flex items-center justify-center mx-auto mb-2" style={{ background: '#F3E7CE' }}>
                    <Icon size={18} color={s.color} />
                  </div>
                  <p className="font-serif font-bold text-[15px] md:text-[16px]" style={{ color: s.color }}>{s.val}</p>
                  <p className="text-[10px] md:text-[11px] mt-0.5" style={{ color: '#6B5448' }}>{s.label}</p>
                </div>
              )
            })}
          </div>

          {/* Rekonsiliasi kas summary */}
          <div className="rounded-2xl p-4 md:p-5" style={{ background: '#F3E7CE', border: '1px solid #C49A6240' }}>
            <h3 className="font-bold text-[13px] md:text-[14px] mb-3 md:mb-4" style={{ color: '#2B1810' }}>Rekonsiliasi Kas</h3>
            {[
              { label: 'Kas Awal', val: fmt(kasAwal) },
              { label: 'Penjualan Shift', val: fmt(summary.omzet), color: '#5B8A2E' },
              { label: 'Petty Cash Keluar', val: `-${fmt(pettyCash)}`, color: '#B60000' },
              { label: 'Ekspektasi Sistem', val: fmt(ekspektasi), bold: true },
              { label: 'Kas Fisik Input', val: fmt(kasFisik), bold: true },
            ].map(r => (
              <div key={r.label} className="flex justify-between text-[12px] md:text-[13px] mb-2">
                <span style={{ color: '#6B5448' }}>{r.label}</span>
                <span className={r.bold ? 'font-extrabold' : 'font-semibold'} style={{ color: r.color ?? '#2B1810' }}>{r.val}</span>
              </div>
            ))}
            <div className="flex justify-between text-[12px] md:text-[13px] pt-2" style={{ borderTop: '1px dashed #C49A62' }}>
              <span className="font-bold" style={{ color: selisih === 0 ? '#5B8A2E' : '#B60000' }}>
                Selisih
              </span>
              <div className="flex items-center gap-1.5">
                {selisih !== 0 && (
                  <span 
                    className="text-[10px] font-bold px-1.5 py-0.5 rounded-full"
                    style={{ 
                      background: selisih < 0 ? '#B60000' : '#C9A227',
                      color: 'white'
                    }}
                    role="img"
                    aria-label={selisih < 0 ? 'Kekurangan' : 'Kelebihan'}
                  >
                    {selisih < 0 ? '▼' : '▲'}
                  </span>
                )}
                <span className="font-extrabold" style={{ color: selisih === 0 ? '#5B8A2E' : '#B60000' }}>
                  {selisih === 0 ? 'Rp 0' : selisihLabel}
                </span>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex flex-col gap-2.5 print:hidden">
            <Button 
              onClick={() => window.print()} 
              variant="primary"
              size="lg"
              fullWidth
              icon={<FileText size={18} />}
            >
              Cetak Laporan Shift
            </Button>
            <Button 
              onClick={onDone} 
              variant="secondary"
              size="lg"
              fullWidth
            >
              Kembali ke Login
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
