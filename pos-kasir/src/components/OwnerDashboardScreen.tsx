import { TrendingUp, TrendingDown, Minus, Activity, BarChart2, Package, Users } from 'lucide-react'
import PageShell from './PageShell'

const fmt = (n: number) => `Rp ${n.toLocaleString('id-ID')}`

const TOP_PRODUCTS = [
  { id: 1, name: 'Siao May Ayam Udang (Isi 4)', qty: 142, total: 3408000, trend: 'up' },
  { id: 2, name: 'Hakau Udang Garing (Isi 3)', qty: 98, total: 2058000, trend: 'up' },
  { id: 3, name: 'Lumpia Kulit Tahu Goreng', qty: 86, total: 1978000, trend: 'stable' },
  { id: 4, name: 'Ceker Ayam Saus Szechuan', qty: 74, total: 1443000, trend: 'down' },
  { id: 5, name: 'Bakpao Durian Pasir Emas', qty: 55, total: 1430000, trend: 'stable' },
]

const KASIR_PERF = [
  { name: 'Sri Wahyuni', trx: 47, omzet: 4312500 },
  { name: 'Budi Santoso', trx: 31, omzet: 2840000 },
  { name: 'Ahmad Dani', trx: 22, omzet: 1920000 },
]

const CHART = [
  { day: 'Sen', pct: 20 }, { day: 'Sel', pct: 25 }, { day: 'Rab', pct: 30 },
  { day: 'Kam', pct: 23 }, { day: 'Jum', pct: 40 }, { day: 'Sab', pct: 65 }, { day: 'Min', pct: 75, today: true },
]

export default function OwnerDashboardScreen({ onBack }: { onBack: () => void }) {
  return (
    <PageShell
      title="Command Center"
      subtitle="Realtime analytics & monitoring cabang — Bpk. Haryanto"
      onBack={onBack}
    >
      <div className="px-6 py-5 space-y-5">

        {/* KPI cards */}
        <div className="grid grid-cols-4 gap-3">
          {[
            { label: 'Omzet Hari Ini', val: 'Rp 9,07 Jt', sub: '+8.5% vs kemarin', Icon: Activity, up: true },
            { label: 'Total Transaksi', val: '100', sub: 'avg Rp 90.700/order', Icon: BarChart2, up: true },
            { label: 'Item Terjual', val: '372', sub: '3 cabang aktif', Icon: Package, up: true },
            { label: 'Kasir Bertugas', val: '3', sub: 'Shift pagi berjalan', Icon: Users, up: null },
          ].map(c => {
            const Icon = c.Icon
            return (
              <div key={c.label} className="rounded-2xl p-4" style={{ background: 'white', border: '1px solid #E8D7C0' }}>
                <div className="flex items-start justify-between mb-3">
                  <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: '#F3E7CE' }}>
                    <Icon size={18} color="#8B4A1E" />
                  </div>
                  {c.up !== null && (
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full" style={{ background: c.up ? '#EAF4E0' : '#FCE8E8', color: c.up ? '#5B8A2E' : '#B60000' }}>
                      {c.up ? '↑' : '↓'}
                    </span>
                  )}
                </div>
                <p className="font-serif font-bold text-[18px] leading-tight" style={{ color: '#2B1810' }}>{c.val}</p>
                <p className="text-[11px] font-semibold mt-0.5" style={{ color: '#6B5448' }}>{c.label}</p>
                <p className="text-[10px] mt-1" style={{ color: '#C49A62' }}>{c.sub}</p>
              </div>
            )
          })}
        </div>

        {/* Trend chart */}
        <div className="rounded-2xl p-5" style={{ background: 'white', border: '1px solid #E8D7C0' }}>
          <h2 className="font-serif font-bold text-[15px] mb-5" style={{ color: '#2B1810' }}>Tren Penjualan 7 Hari</h2>
          <div className="flex items-end gap-3 h-28">
            {CHART.map(b => (
              <div key={b.day} className="flex flex-col items-center gap-1.5 flex-1">
                <div className="w-full rounded-t-lg" style={{ height: `${b.pct * 0.8}%`, minHeight: 4, background: b.today ? '#8B4A1E' : '#F3E7CE', border: b.today ? 'none' : '1px solid #E8D7C0' }} />
                <span className="text-[11px] font-bold" style={{ color: b.today ? '#8B4A1E' : '#6B5448' }}>{b.day}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Two columns: top products + kasir performance */}
        <div className="grid grid-cols-2 gap-4">
          {/* Top products */}
          <div className="rounded-2xl overflow-hidden" style={{ background: 'white', border: '1px solid #E8D7C0' }}>
            <div className="px-5 py-4" style={{ borderBottom: '1px solid #E8D7C0' }}>
              <h2 className="font-serif font-bold text-[14px]" style={{ color: '#2B1810' }}>Top 5 Produk</h2>
            </div>
            {TOP_PRODUCTS.map((p, i) => {
              const TIcon = p.trend === 'up' ? TrendingUp : p.trend === 'down' ? TrendingDown : Minus
              const tColor = p.trend === 'up' ? '#5B8A2E' : p.trend === 'down' ? '#B60000' : '#C9A227'
              return (
                <div key={p.id} className="flex items-center gap-3 px-5 py-3" style={{ borderBottom: i < TOP_PRODUCTS.length - 1 ? '1px solid #F3E7CE' : 'none' }}>
                  <span className="w-6 h-6 rounded-full flex items-center justify-center font-bold text-[11px] shrink-0" style={{ background: i === 0 ? '#8B4A1E' : '#F3E7CE', color: i === 0 ? 'white' : '#6B5448' }}>{i + 1}</span>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-[12px] truncate" style={{ color: '#2B1810' }}>{p.name}</p>
                    <p className="text-[10px]" style={{ color: '#6B5448' }}>{p.qty} porsi</p>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-[12px]" style={{ color: '#2B1810' }}>{fmt(p.total)}</p>
                    <TIcon size={12} color={tColor} />
                  </div>
                </div>
              )
            })}
          </div>

          {/* Kasir performance */}
          <div className="rounded-2xl overflow-hidden" style={{ background: 'white', border: '1px solid #E8D7C0' }}>
            <div className="px-5 py-4" style={{ borderBottom: '1px solid #E8D7C0' }}>
              <h2 className="font-serif font-bold text-[14px]" style={{ color: '#2B1810' }}>Performa Kasir Hari Ini</h2>
            </div>
            {KASIR_PERF.map((k, i) => (
              <div key={k.name} className="flex items-center gap-3 px-5 py-4" style={{ borderBottom: i < KASIR_PERF.length - 1 ? '1px solid #F3E7CE' : 'none' }}>
                <div className="w-10 h-10 rounded-full flex items-center justify-center font-bold text-[13px] shrink-0" style={{ background: '#F3E7CE', color: '#8B4A1E', border: '2px solid #C49A6260' }}>
                  {k.name.charAt(0)}
                </div>
                <div className="flex-1">
                  <p className="font-bold text-[13px]" style={{ color: '#2B1810' }}>{k.name}</p>
                  <p className="text-[11px]" style={{ color: '#6B5448' }}>{k.trx} transaksi</p>
                </div>
                <div className="text-right">
                  <p className="font-bold text-[13px]" style={{ color: '#8B4A1E' }}>{fmt(k.omzet)}</p>
                  <div className="h-1.5 rounded-full mt-1" style={{ width: 60, background: '#E8D7C0' }}>
                    <div className="h-full rounded-full" style={{ width: `${(k.trx / 47) * 100}%`, background: '#8B4A1E' }} />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </PageShell>
  )
}
