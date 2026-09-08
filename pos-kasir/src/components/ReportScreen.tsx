import { useState } from 'react'
import { Download, TrendingUp, TrendingDown, ShoppingBag, Users, BarChart2, FileText, Tag, UserCheck, FileClock } from 'lucide-react'
import PageShell from './PageShell'

const fmt = (n: number) => `Rp ${n.toLocaleString('id-ID')}`
const fmtShort = (n: number) => n >= 1000000 ? `${(n/1000000).toFixed(1)}Jt` : n >= 1000 ? `${(n/1000).toFixed(0)}Rb` : String(n)

const DATE_FILTERS = ['Hari Ini', 'Minggu Ini', 'Bulan Ini', 'Custom']

// Data points: {day, value in Rupiah}
const DAILY_DATA = [
  { day: 'Sen', value: 1200000 },
  { day: 'Sel', value: 1500000 },
  { day: 'Rab', value: 1800000 },
  { day: 'Kam', value: 1400000 },
  { day: 'Jum', value: 2400000 },
  { day: 'Sab', value: 3800000 },
  { day: 'Min', value: 4300000, isToday: true },
]

const TOP = [
  { name: 'Siao May Ayam Udang (Isi 4)', cat: 'Kukus', qty: 214, total: 5136000 },
  { name: 'Hakau Udang Garing (Isi 3)', cat: 'Kukus', qty: 156, total: 3276000 },
  { name: 'Lumpia Kulit Tahu Goreng', cat: 'Goreng', qty: 98, total: 2254000 },
  { name: 'Ceker Ayam Saus Szechuan', cat: 'Goreng', qty: 74, total: 1443000 },
  { name: 'Bakpao Durian Pasir Emas', cat: 'Kukus', qty: 55, total: 1430000 },
]

const KASIR_DATA = [
  { name: 'Sri Wahyuni', trx: 47, omzet: 4312500 },
  { name: 'Budi Santoso', trx: 31, omzet: 2840000 },
  { name: 'Ahmad Dani', trx: 22, omzet: 1920000 },
]

const NAV_ITEMS = [
  { id: 'penjualan', label: 'Penjualan Harian', icon: BarChart2 },
  { id: 'produk', label: 'Laporan Produk', icon: ShoppingBag },
  { id: 'kasir', label: 'Laporan Kasir', icon: UserCheck },
  { id: 'promo', label: 'Laporan Promo', icon: Tag },
  { id: 'ekspor', label: 'Ekspor Data', icon: FileClock },
]

const STAT_CARDS = [
  { label: 'Total Omzet', value: 4312500, sub: '+12% vs kemarin', icon: TrendingUp, up: true },
  { label: 'Transaksi', value: 47, sub: 'avg Rp 91.755/order', icon: ShoppingBag, up: true, isCount: true },
  { label: 'Pelanggan', value: 38, sub: '9 takeaway', icon: Users, up: true, isCount: true },
  { label: 'Item Terjual', value: 184, sub: 'Avg 3.9 item/order', icon: TrendingDown, up: false, isCount: true },
]

export default function ReportScreen({ onBack, backLabel }: { onBack: () => void; backLabel?: string }) {
  const [activeFilter, setActiveFilter] = useState('Hari Ini')
  const [activeNav, setActiveNav] = useState('penjualan')
  const [showShiftModal, setShowShiftModal] = useState(false)

  const maxValue = Math.max(...DAILY_DATA.map(d => d.value))

  const rightNav = (
    <div className="py-4 px-3">
      <p className="text-[10px] font-bold mb-3 px-2" style={{ color: '#C49A62', letterSpacing: '0.08em' }}>LAPORAN</p>
      <div className="flex flex-col gap-1">
        {NAV_ITEMS.map(item => {
          const Icon = item.icon
          const isActive = activeNav === item.id
          return (
            <button key={item.id} onClick={() => setActiveNav(item.id)}
              className="flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-left transition-colors"
              style={{ background: isActive ? '#2B1810' : 'transparent', color: isActive ? '#F3E7CE' : '#6B5448' }}>
              <Icon size={15} />
              <span className="font-semibold text-[13px]">{item.label}</span>
            </button>
          )
        })}
      </div>
      <div className="mt-4 px-2" style={{ borderTop: '1px solid #E8D7C0', paddingTop: 12 }}>
        <button 
          onClick={() => setShowShiftModal(true)}
          className="w-full flex items-center gap-2 py-2.5 px-3 rounded-xl font-semibold text-[13px] transition-colors hover:bg-amber-100" 
          style={{ color: '#8B4A1E' }}>
          <FileText size={15} />
          <span>Laporan Shift</span>
        </button>
      </div>
    </div>
  )

  return (
    <PageShell
      title="Laporan Penjualan"
      subtitle="Analitik omzet & performa menu"
      onBack={onBack}
      backLabel={backLabel}
      rightPanel={rightNav}
      rightPanelWidth={200}
    >
      <div className="px-6 py-5">

        {/* Filter + export */}
        <div className="flex items-center justify-between mb-5">
          <div className="flex gap-1.5">
            {DATE_FILTERS.map(f => (
              <button key={f} onClick={() => setActiveFilter(f)}
                className="px-3.5 py-1.5 rounded-full text-[12px] font-bold transition-colors"
                style={{ background: activeFilter === f ? '#8B4A1E' : 'white', color: activeFilter === f ? 'white' : '#6B5448', border: `1px solid ${activeFilter === f ? '#8B4A1E' : '#E8D7C0'}` }}>
                {f}
              </button>
            ))}
          </div>
          <button className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-[12px] font-bold" style={{ background: '#8B4A1E', color: 'white' }}>
            <Download size={13} /> Export
          </button>
        </div>

        {/* KPI cards */}
        <div className="grid grid-cols-4 gap-3 mb-6">
          {STAT_CARDS.map(card => {
            const Icon = card.icon
            return (
              <div key={card.label} className="rounded-2xl p-4" style={{ background: 'white', border: '1px solid #E8D7C0' }}>
                <div className="flex items-start justify-between mb-3">
                  <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: '#F3E7CE' }}>
                    <Icon size={18} color="#8B4A1E" />
                  </div>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full" style={{ background: card.up ? '#EAF4E0' : '#FCE8E8', color: card.up ? '#5B8A2E' : '#B60000' }}>
                    {card.up ? '↑' : '↓'}
                  </span>
                </div>
                <p className="font-serif font-bold text-[18px] leading-tight" style={{ color: '#2B1810' }}>
                  {card.isCount ? card.value : fmt(card.value)}
                </p>
                <p className="text-[11px] font-semibold mt-0.5" style={{ color: '#6B5448' }}>{card.label}</p>
                <p className="text-[10px] mt-1" style={{ color: '#C49A62' }}>{card.sub}</p>
              </div>
            )
          })}
        </div>

        {/* Dynamic Content based on activeNav */}
        {activeNav === 'penjualan' && (
          <div className="rounded-2xl p-5 mb-6" style={{ background: 'white', border: '1px solid #E8D7C0' }}>
            <div className="flex items-center justify-between mb-5">
              <h2 className="font-serif font-bold text-[15px]" style={{ color: '#2B1810' }}>Tren Penjualan — {activeFilter}</h2>
              <p className="text-[11px]" style={{ color: '#6B5448' }}>Total: {fmt(DAILY_DATA.reduce((s,d)=>s+d.value,0))}</p>
            </div>

            {/* Y-axis + chart */}
            <div className="flex gap-3">
              {/* Y-axis labels */}
              <div className="flex flex-col justify-between text-right pr-2" style={{ height: 140, minWidth: 40 }}>
                {[maxValue, maxValue*0.75, maxValue*0.5, maxValue*0.25, 0].map((v,i) => (
                  <span key={i} className="text-[9px]" style={{ color: '#C49A62' }}>{fmtShort(v)}</span>
                ))}
              </div>

              {/* Bars */}
              <div className="flex items-end gap-2 flex-1" style={{ height: 140 }}>
                {DAILY_DATA.map(bar => {
                  const heightPct = (bar.value / maxValue) * 100
                  return (
                    <div key={bar.day} className="flex flex-col items-center gap-1.5 flex-1">
                      <span className="text-[9px] font-bold" style={{ color: bar.isToday ? '#8B4A1E' : '#C49A62' }}>{fmtShort(bar.value)}</span>
                      <div className="w-full rounded-t-lg transition-all" style={{
                        height: `${heightPct}%`,
                        minHeight: 4,
                        background: bar.isToday ? 'linear-gradient(to top, #8B4A1E, #C49A62)' : '#F3E7CE',
                        border: bar.isToday ? 'none' : '1px solid #E8D7C0',
                      }} />
                      <span className="text-[10px] font-bold" style={{ color: bar.isToday ? '#8B4A1E' : '#6B5448' }}>{bar.day}</span>
                    </div>
                  )
                })}
              </div>
            </div>
          </div>
        )}

        {/* Dynamic Bottom Panels */}
        <div className="grid grid-cols-2 gap-4">
          {/* Top products */}
          {(activeNav === 'penjualan' || activeNav === 'produk') && (
            <div className="rounded-2xl overflow-hidden" style={{ background: 'white', border: '1px solid #E8D7C0' }}>
              <div className="px-5 py-4" style={{ borderBottom: '1px solid #E8D7C0' }}>
                <h2 className="font-serif font-bold text-[14px]" style={{ color: '#2B1810' }}>Produk Terlaris {activeFilter}</h2>
              </div>
              {TOP.map((p, i) => (
                <div key={p.name} className="flex items-center gap-3 px-5 py-3" style={{ borderBottom: i < TOP.length-1 ? '1px solid #F3E7CE' : 'none' }}>
                  <span className="w-6 h-6 rounded-full flex items-center justify-center font-bold text-[11px] shrink-0"
                    style={{ background: i === 0 ? '#8B4A1E' : '#F3E7CE', color: i === 0 ? 'white' : '#6B5448' }}>{i+1}</span>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-[12px] truncate" style={{ color: '#2B1810' }}>{p.name}</p>
                    <p className="text-[10px]" style={{ color: '#C49A62' }}>{p.qty} porsi</p>
                  </div>
                  <p className="font-bold text-[12px] shrink-0" style={{ color: '#2B1810' }}>{fmt(p.total)}</p>
                </div>
              ))}
            </div>
          )}

          {/* Kasir performance */}
          {(activeNav === 'penjualan' || activeNav === 'kasir') && (
            <div className="rounded-2xl overflow-hidden" style={{ background: 'white', border: '1px solid #E8D7C0' }}>
              <div className="px-5 py-4" style={{ borderBottom: '1px solid #E8D7C0' }}>
                <h2 className="font-serif font-bold text-[14px]" style={{ color: '#2B1810' }}>Performa Kasir {activeFilter}</h2>
              </div>
              {KASIR_DATA.map((k, i) => (
                <div key={k.name} className="flex items-center gap-3 px-5 py-4" style={{ borderBottom: i < KASIR_DATA.length-1 ? '1px solid #F3E7CE' : 'none' }}>
                  <div className="w-9 h-9 rounded-full flex items-center justify-center font-bold text-[14px] shrink-0" style={{ background: '#F3E7CE', color: '#8B4A1E', border: '2px solid #C49A6260' }}>
                    {k.name.charAt(0)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-bold text-[13px]" style={{ color: '#2B1810' }}>{k.name}</p>
                    <div className="flex items-center gap-2 mt-1">
                      <div className="flex-1 h-1.5 rounded-full" style={{ background: '#E8D7C0' }}>
                        <div className="h-full rounded-full" style={{ width: `${(k.trx/47)*100}%`, background: '#8B4A1E' }} />
                      </div>
                      <span className="text-[10px]" style={{ color: '#6B5448' }}>{k.trx} trx</span>
                    </div>
                  </div>
                  <p className="font-bold text-[12px] shrink-0" style={{ color: '#8B4A1E' }}>{fmt(k.omzet)}</p>
                </div>
              ))}
            </div>
          )}
          
          {activeNav === 'promo' && (
            <div className="col-span-2 rounded-2xl p-5 text-center" style={{ background: 'white', border: '1px solid #E8D7C0' }}>
               <p className="text-[13px] font-bold" style={{ color: '#6B5448' }}>Belum ada data promo untuk periode ini.</p>
            </div>
          )}
          
          {activeNav === 'ekspor' && (
             <div className="col-span-2 rounded-2xl p-5 text-center" style={{ background: 'white', border: '1px solid #E8D7C0' }}>
               <button className="px-6 py-3 rounded-xl text-white font-bold text-[14px]" style={{ background: '#8B4A1E' }}>
                 Download Semua Data (CSV/Excel)
               </button>
             </div>
          )}
        </div>
        
        {/* Shift Modal */}
        {showShiftModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'rgba(43,24,16,0.6)' }}>
            <div className="bg-white rounded-3xl w-full max-w-md overflow-hidden animate-fade-in shadow-2xl">
              <div className="px-6 py-5" style={{ background: '#FAF6ED', borderBottom: '1px solid #E8D7C0' }}>
                <h2 className="font-serif font-bold text-[18px]" style={{ color: '#2B1810' }}>Laporan Shift (Preview)</h2>
                <p className="text-[12px] mt-1" style={{ color: '#6B5448' }}>Rincian setoran kasir saat ini</p>
              </div>
              <div className="p-6 space-y-4">
                <div className="flex justify-between items-center text-[13px]">
                  <span style={{ color: '#6B5448' }}>Total Penjualan:</span>
                  <span className="font-bold" style={{ color: '#2B1810' }}>Rp 4.312.500</span>
                </div>
                <div className="flex justify-between items-center text-[13px]">
                  <span style={{ color: '#6B5448' }}>Modal Awal (Petty Cash):</span>
                  <span className="font-bold" style={{ color: '#2B1810' }}>Rp 500.000</span>
                </div>
                <div className="flex justify-between items-center text-[13px] border-t pt-4" style={{ borderColor: '#E8D7C0' }}>
                  <span className="font-bold" style={{ color: '#8B4A1E' }}>Total Uang di Laci:</span>
                  <span className="font-bold text-[16px]" style={{ color: '#8B4A1E' }}>Rp 4.812.500</span>
                </div>
              </div>
              <div className="px-6 py-4 border-t flex justify-end gap-2" style={{ borderColor: '#E8D7C0', background: '#FAFAFA' }}>
                <button onClick={() => window.print()} className="px-6 py-2.5 rounded-xl font-bold text-[13px] print:hidden" style={{ background: '#8B4A1E', color: 'white' }}>Cetak</button>
                <button onClick={() => setShowShiftModal(false)} className="px-6 py-2.5 rounded-xl font-bold text-[13px] print:hidden" style={{ background: '#E8D7C0', color: '#2B1810' }}>Tutup</button>
              </div>
            </div>
          </div>
        )}

      </div>
    </PageShell>
  )
}
