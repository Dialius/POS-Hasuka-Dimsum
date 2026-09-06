import { useState } from 'react'
import { RefreshCw, Download, TrendingUp, TrendingDown, ShoppingBag, Users } from 'lucide-react'
import PageShell from './PageShell'

const FILTERS = ['Hari Ini', 'Minggu Ini', 'Bulan Ini', 'Custom']

const CHART = [
  { day: 'Sen', pct: 20, val: '1.2M' },
  { day: 'Sel', pct: 25, val: '1.5M' },
  { day: 'Rab', pct: 30, val: '1.8M' },
  { day: 'Kam', pct: 23, val: '1.4M' },
  { day: 'Jum', pct: 40, val: '2.4M' },
  { day: 'Sab', pct: 65, val: '3.8M' },
  { day: 'Min', pct: 75, val: '4.3M', isToday: true },
]

const TOP = [
  { name: 'Siao May Ayam Udang (Isi 4)', cat: 'Kukus', qty: 214, total: 5136000 },
  { name: 'Hakau Udang Garing (Isi 3)', cat: 'Kukus', qty: 156, total: 3276000 },
  { name: 'Lumpia Kulit Tahu Goreng', cat: 'Goreng', qty: 98, total: 2254000 },
  { name: 'Ceker Ayam Saus Szechuan', cat: 'Kukus', qty: 74, total: 1443000 },
]

const fmt = (n: number) => `Rp ${n.toLocaleString('id-ID')}`

const STAT_CARDS = [
  { label: 'Total Omzet', value: 'Rp 4.312.500', sub: '+12% vs kemarin', icon: TrendingUp, up: true },
  { label: 'Transaksi', value: '47', sub: 'avg Rp 91.755/order', icon: ShoppingBag, up: true },
  { label: 'Pelanggan', value: '38', sub: '9 takeaway', icon: Users, up: true },
  { label: 'Item Terjual', value: '184', sub: 'Avg 3.9 item/order', icon: TrendingDown, up: false },
]

export default function ReportScreen({ onBack }: { onBack: () => void }) {
  const [activeFilter, setActiveFilter] = useState('Hari Ini')

  return (
    <PageShell
      title="Laporan Penjualan"
      subtitle="Analitik omzet & performa menu"
      onBack={onBack}
    >
      <div className="px-6 py-5">

        {/* Filter + actions row */}
        <div className="flex items-center justify-between mb-5">
          <div className="flex gap-1.5">
            {FILTERS.map(f => (
              <button
                key={f}
                onClick={() => setActiveFilter(f)}
                className="px-3.5 py-1.5 rounded-full text-[12px] font-bold transition-colors"
                style={{
                  background: activeFilter === f ? '#8B4A1E' : 'white',
                  color: activeFilter === f ? 'white' : '#6B5448',
                  border: activeFilter === f ? '1px solid #8B4A1E' : '1px solid #E8D7C0',
                }}
              >
                {f}
              </button>
            ))}
          </div>
          <div className="flex gap-2">
            <button
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[12px] font-bold transition-colors"
              style={{ background: 'white', color: '#6B5448', border: '1px solid #E8D7C0' }}
            >
              <RefreshCw size={13} /> Refresh
            </button>
            <button
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[12px] font-bold transition-colors"
              style={{ background: '#8B4A1E', color: 'white' }}
            >
              <Download size={13} /> Export
            </button>
          </div>
        </div>

        {/* Stat cards */}
        <div className="grid grid-cols-4 gap-3 mb-6">
          {STAT_CARDS.map(card => {
            const Icon = card.icon
            return (
              <div
                key={card.label}
                className="rounded-2xl p-4"
                style={{ background: 'white', border: '1px solid #E8D7C0' }}
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: '#F3E7CE' }}>
                    <Icon size={18} color="#8B4A1E" />
                  </div>
                  <span
                    className="text-[10px] font-bold px-2 py-0.5 rounded-full"
                    style={{ background: card.up ? '#EAF4E0' : '#FEE2E2', color: card.up ? '#5B8A2E' : '#B60000' }}
                  >
                    {card.up ? '↑' : '↓'}
                  </span>
                </div>
                <p className="font-serif font-bold text-[18px] leading-tight" style={{ color: '#2B1810' }}>{card.value}</p>
                <p className="text-[11px] font-semibold mt-0.5" style={{ color: '#6B5448' }}>{card.label}</p>
                <p className="text-[10px] mt-1" style={{ color: '#C49A62' }}>{card.sub}</p>
              </div>
            )
          })}
        </div>

        {/* Bar chart */}
        <div className="rounded-2xl p-5 mb-6" style={{ background: 'white', border: '1px solid #E8D7C0' }}>
          <h2 className="font-serif font-bold text-[15px] mb-5" style={{ color: '#2B1810' }}>Tren Penjualan — {activeFilter}</h2>
          <div className="flex items-end gap-3 h-36">
            {CHART.map(bar => (
              <div key={bar.day} className="flex flex-col items-center gap-1.5 flex-1">
                <span className="text-[10px] font-bold" style={{ color: bar.isToday ? '#8B4A1E' : '#6B5448' }}>{bar.val}</span>
                <div className="w-full rounded-t-lg transition-all" style={{
                  height: `${bar.pct * 0.8}%`,
                  minHeight: 4,
                  background: bar.isToday ? '#8B4A1E' : '#F3E7CE',
                  border: bar.isToday ? 'none' : '1px solid #E8D7C0',
                }} />
                <span className="text-[11px] font-bold" style={{ color: bar.isToday ? '#8B4A1E' : '#6B5448' }}>{bar.day}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Top products */}
        <div className="rounded-2xl overflow-hidden" style={{ background: 'white', border: '1px solid #E8D7C0' }}>
          <div className="px-5 py-4" style={{ borderBottom: '1px solid #E8D7C0' }}>
            <h2 className="font-serif font-bold text-[15px]" style={{ color: '#2B1810' }}>Produk Terlaris</h2>
          </div>
          {TOP.map((p, i) => (
            <div
              key={p.name}
              className="flex items-center gap-4 px-5 py-3.5"
              style={{ borderBottom: i < TOP.length - 1 ? '1px solid #F3E7CE' : 'none' }}
            >
              <span
                className="w-7 h-7 rounded-full flex items-center justify-center font-bold text-[12px] shrink-0"
                style={{ background: i === 0 ? '#8B4A1E' : '#F3E7CE', color: i === 0 ? 'white' : '#6B5448' }}
              >
                {i + 1}
              </span>
              <div className="flex-1 min-w-0">
                <p className="font-bold text-[13px] truncate" style={{ color: '#2B1810' }}>{p.name}</p>
                <p className="text-[11px]" style={{ color: '#C49A62' }}>{p.cat}</p>
              </div>
              <div className="text-right">
                <p className="font-bold text-[13px]" style={{ color: '#2B1810' }}>{fmt(p.total)}</p>
                <p className="text-[11px]" style={{ color: '#6B5448' }}>{p.qty} porsi</p>
              </div>
            </div>
          ))}
        </div>

      </div>
    </PageShell>
  )
}
