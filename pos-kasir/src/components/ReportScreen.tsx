import { useState, useEffect } from 'react'
import { Download, TrendingUp, TrendingDown, ShoppingBag, Users, BarChart2, FileText, Tag, UserCheck, FileClock, Loader2 } from 'lucide-react'
import PageShell from './PageShell'
import { gasApi } from '../services/gasApi'
import { useApp } from '../context/AppContext'

const fmt = (n: number) => `Rp ${Number(n || 0).toLocaleString('id-ID')}`
const fmtShort = (n: number) => n >= 1000000 ? `${(n/1000000).toFixed(1)}Jt` : n >= 1000 ? `${(n/1000).toFixed(0)}Rb` : String(n)

const DATE_FILTERS = ['Hari Ini', 'Minggu Ini', 'Bulan Ini', 'Semua Data']

const NAV_ITEMS = [
  { id: 'penjualan', label: 'Penjualan Harian', icon: BarChart2 },
  { id: 'produk', label: 'Laporan Produk', icon: ShoppingBag },
  { id: 'kasir', label: 'Laporan Kasir', icon: UserCheck },
  { id: 'promo', label: 'Laporan Promo', icon: Tag },
  { id: 'ekspor', label: 'Ekspor Data', icon: FileClock },
]

export default function ReportScreen({ onBack, backLabel }: { onBack: () => void; backLabel?: string }) {
  const { outlet, productsList } = useApp()
  const [activeFilter, setActiveFilter] = useState('Hari Ini')
  const [activeNav, setActiveNav] = useState('penjualan')
  const [showShiftModal, setShowShiftModal] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [transactions, setTransactions] = useState<any[]>([])
  
  useEffect(() => {
    let isMounted = true
    setIsLoading(true)
    gasApi.getBranchReportData(outlet.id).then(res => {
      if (isMounted && res) {
        setTransactions(res.transactions || [])
      }
    }).catch(err => console.error(err)).finally(() => {
      if (isMounted) setIsLoading(false)
    })
    return () => { isMounted = false }
  }, [outlet.id])

  const parseTs = (ts: string) => {
    if (!ts) return new Date(0)
    if (/^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}/.test(ts)) return new Date(ts.replace(' ', 'T') + '+07:00')
    return new Date(ts)
  }

  // Filter transactions by date
  const now = new Date()
  const filteredTx = transactions.filter(t => {
    const ts = t.timestamp || t.date
    if (!ts) return false
    const tDate = parseTs(String(ts))
    
    if (activeFilter === 'Hari Ini') {
      return tDate.toDateString() === now.toDateString()
    } else if (activeFilter === 'Minggu Ini') {
      // 7 hari terakhir (termasuk hari ini)
      const diff = now.getTime() - tDate.getTime()
      return diff <= 7 * 24 * 60 * 60 * 1000 && diff >= 0
    } else if (activeFilter === 'Bulan Ini') {
      return tDate.getMonth() === now.getMonth() && tDate.getFullYear() === now.getFullYear()
    }
    return true // Semua Data
  })

  // KPI Calculations
  const totalOmzet = filteredTx.reduce((sum, t) => sum + (Number(t.total) || 0), 0)
  const totalTrx = filteredTx.length
  
  let itemsSold = 0
  filteredTx.forEach(t => {
    try {
      const items = typeof t.items === 'string' ? JSON.parse(t.items) : (t.items || [])
      itemsSold += items.reduce((sum: number, i: any) => sum + (Number(i.qty) || 0), 0)
    } catch(e) {}
  })

  // Chart Data (Last 7 Days)
  const last7Days = [...Array(7)].map((_, i) => {
    const d = new Date()
    d.setDate(d.getDate() - (6 - i))
    return { 
      label: d.toLocaleDateString('id-ID', { weekday: 'short' }), 
      dateString: d.toISOString().split('T')[0],
      val: 0,
      isToday: i === 6
    }
  })
  
  const currentFilterTx = activeFilter === 'Hari Ini' 
    ? transactions // Always show 7 days trend if filtered by today, use all transactions to get past 7 days
    : filteredTx 
    
  currentFilterTx.forEach((t: any) => {
    try {
      const ts = t.timestamp || t.date
      if (!ts) return
      
      const tDate = parseTs(String(ts))
      
      // Menggunakan toLocaleDateString sv-SE untuk mendapatkan yyyy-mm-dd di timezone lokal
      const tDateStr = tDate.toLocaleDateString('sv-SE')
      
      const day = last7Days.find(d => {
         const dDateStr = new Date(d.dateString).toLocaleDateString('sv-SE')
         return dDateStr === tDateStr
      })
      if (day) day.val += (Number(t.total) || 0)
    } catch(e) {}
  })
  const maxValue = Math.max(...last7Days.map(d => d.val), 1)

  // Top Products
  const productMap: Record<string, { qty: number, total: number }> = {}
  filteredTx.forEach((t: any) => {
    try {
      const items = typeof t.items === 'string' ? JSON.parse(t.items) : (t.items || [])
      items.forEach((item: any) => {
        let matchedProduct = null;
        if (productsList.length > 0) {
          matchedProduct = productsList.find(p => p.name.trim().toLowerCase() === String(item.name).trim().toLowerCase())
          if (!matchedProduct) return; // Skip deleted products
        }

        if (!productMap[item.name]) productMap[item.name] = { qty: 0, total: 0 }
        productMap[item.name].qty += Number(item.qty) || 0
        productMap[item.name].total += (Number(item.price) || 0) * (Number(item.qty) || 0)
      })
    } catch(e) {}
  })
  const topProducts = Object.entries(productMap)
    .map(([name, data]) => ({ name, qty: data.qty, total: data.total }))
    .sort((a, b) => b.qty - a.qty)
    .slice(0, 5)

  // Cashier Performance
  const cashierMap: Record<string, { trx: number, omzet: number }> = {}
  filteredTx.forEach((t: any) => {
    const cName = t.cashier || t.cashierName || 'Kasir'
    if (!cashierMap[cName]) cashierMap[cName] = { trx: 0, omzet: 0 }
    cashierMap[cName].trx += 1
    cashierMap[cName].omzet += Number(t.total) || 0
  })
  const cashierStats = Object.entries(cashierMap)
    .map(([name, data]) => ({ name, trx: data.trx, omzet: data.omzet }))
    .sort((a, b) => b.omzet - a.omzet)

  const STAT_CARDS = [
    { label: 'Total Omzet', value: totalOmzet, sub: 'Periode aktif', icon: TrendingUp, up: true },
    { label: 'Transaksi', value: totalTrx, sub: `avg Rp ${totalTrx ? Math.round(totalOmzet/totalTrx).toLocaleString('id-ID') : 0}/order`, icon: ShoppingBag, up: true, isCount: true },
    { label: 'Pelanggan', value: totalTrx, sub: 'Estimasi dr struk', icon: Users, up: true, isCount: true },
    { label: 'Item Terjual', value: itemsSold, sub: `Avg ${totalTrx ? (itemsSold/totalTrx).toFixed(1) : 0} item/order`, icon: TrendingDown, up: false, isCount: true },
  ]

  const rightNav = (
    <div className="py-4 px-3 hidden sm:block">
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
      subtitle={`Analitik omzet cabang ${outlet.name}`}
      onBack={onBack}
      backLabel={backLabel}
      rightPanel={rightNav}
      rightPanelWidth={200}
    >
      {/* Mobile horizontal tab pills */}
      <div className="sm:hidden px-3 py-2.5 flex gap-2 overflow-x-auto scrollbar-hide border-b" style={{ borderColor: '#E8D7C0', background: 'white' }}>
        {NAV_ITEMS.map(item => {
          const Icon = item.icon
          const isActive = activeNav === item.id
          return (
            <button
              key={item.id}
              onClick={() => setActiveNav(item.id)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[11px] font-bold whitespace-nowrap shrink-0 transition-colors"
              style={{ background: isActive ? '#2B1810' : '#F3E7CE', color: isActive ? '#F3E7CE' : '#6B5448' }}
            >
              <Icon size={12} />
              {item.label}
            </button>
          )
        })}
        <button
          onClick={() => setShowShiftModal(true)}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[11px] font-bold whitespace-nowrap shrink-0 transition-colors"
          style={{ background: '#F3E7CE', color: '#8B4A1E' }}
        >
          <FileText size={12} />
          Shift
        </button>
      </div>

      <div className="px-3 sm:px-6 py-4 sm:py-5 relative">
        {isLoading && (
          <div className="absolute inset-0 z-10 flex flex-col items-center justify-center bg-white/50 backdrop-blur-sm rounded-xl">
            <Loader2 className="animate-spin text-[#8B4A1E] mb-2" size={32} />
            <p className="font-semibold text-[13px]" style={{ color: '#2B1810' }}>Memuat Laporan...</p>
          </div>
        )}

        {/* Filter + export */}
        <div className="flex items-center justify-between gap-2 mb-5 flex-wrap">
          <div className="flex gap-1.5 flex-wrap">
            {DATE_FILTERS.map(f => (
              <button key={f} onClick={() => setActiveFilter(f)}
                className="px-3.5 py-1.5 rounded-full text-[12px] font-bold transition-colors"
                style={{ background: activeFilter === f ? '#8B4A1E' : 'white', color: activeFilter === f ? 'white' : '#6B5448', border: `1px solid ${activeFilter === f ? '#8B4A1E' : '#E8D7C0'}` }}>
                {f}
              </button>
            ))}
          </div>
          <button className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-[12px] font-bold shrink-0" style={{ background: '#8B4A1E', color: 'white' }}>
            <Download size={13} /> Export
          </button>
        </div>

        {/* KPI cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
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
              <h2 className="font-serif font-bold text-[15px]" style={{ color: '#2B1810' }}>Tren Penjualan (7 Hari Terakhir)</h2>
              <p className="text-[11px]" style={{ color: '#6B5448' }}>Total: {fmt(last7Days.reduce((s,d)=>s+d.val,0))}</p>
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
                {last7Days.map(bar => {
                  const heightPct = (bar.val / maxValue) * 100
                  return (
                    <div key={bar.label} className="flex flex-col items-center gap-1.5 flex-1">
                      <span className="text-[9px] font-bold" style={{ color: bar.isToday ? '#8B4A1E' : '#C49A62' }}>{fmtShort(bar.val)}</span>
                      <div className="w-full rounded-t-lg transition-all" style={{
                        height: `${heightPct}%`,
                        minHeight: 4,
                        background: bar.isToday ? 'linear-gradient(to top, #8B4A1E, #C49A62)' : '#F3E7CE',
                        border: bar.isToday ? 'none' : '1px solid #E8D7C0',
                      }} />
                      <span className="text-[10px] font-bold" style={{ color: bar.isToday ? '#8B4A1E' : '#6B5448' }}>{bar.label}</span>
                    </div>
                  )
                })}
              </div>
            </div>
          </div>
        )}

        {/* Dynamic Bottom Panels */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* Top products */}
          {(activeNav === 'penjualan' || activeNav === 'produk') && (
            <div className="rounded-2xl overflow-hidden" style={{ background: 'white', border: '1px solid #E8D7C0' }}>
              <div className="px-5 py-4" style={{ borderBottom: '1px solid #E8D7C0' }}>
                <h2 className="font-serif font-bold text-[14px]" style={{ color: '#2B1810' }}>Produk Terlaris {activeFilter}</h2>
              </div>
              {topProducts.length === 0 ? (
                <div className="p-6 text-center text-[12px] font-bold text-[#6B5448]">Belum ada produk terjual.</div>
              ) : topProducts.map((p, i) => (
                <div key={p.name} className="flex items-center gap-3 px-5 py-3" style={{ borderBottom: i < topProducts.length-1 ? '1px solid #F3E7CE' : 'none' }}>
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
              {cashierStats.length === 0 ? (
                <div className="p-6 text-center text-[12px] font-bold text-[#6B5448]">Belum ada transaksi kasir.</div>
              ) : cashierStats.map((k, i) => (
                <div key={k.name} className="flex items-center gap-3 px-5 py-4" style={{ borderBottom: i < cashierStats.length-1 ? '1px solid #F3E7CE' : 'none' }}>
                  <div className="w-9 h-9 rounded-full flex items-center justify-center font-bold text-[14px] shrink-0" style={{ background: '#F3E7CE', color: '#8B4A1E', border: '2px solid #C49A6260' }}>
                    {k.name.charAt(0).toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-bold text-[13px]" style={{ color: '#2B1810' }}>{k.name}</p>
                    <div className="flex items-center gap-2 mt-1">
                      <div className="flex-1 h-1.5 rounded-full" style={{ background: '#E8D7C0' }}>
                        <div className="h-full rounded-full" style={{ width: `${(k.trx/totalTrx)*100}%`, background: '#8B4A1E' }} />
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
                  <span className="font-bold" style={{ color: '#2B1810' }}>{fmt(totalOmzet)}</span>
                </div>
                <div className="flex justify-between items-center text-[13px]">
                  <span style={{ color: '#6B5448' }}>Penerimaan Kas (Tunai):</span>
                  <span className="font-bold" style={{ color: '#2B1810' }}>{fmt(
                    filteredTx
                      .filter(t => String(t.payment_method).toUpperCase() === 'CASH' || String(t.payment_method).toUpperCase() === 'TUNAI')
                      .reduce((sum, t) => sum + (Number(t.total) || 0), 0)
                  )}</span>
                </div>
                <div className="flex justify-between items-center text-[13px] border-t pt-4" style={{ borderColor: '#E8D7C0' }}>
                  <span className="font-bold" style={{ color: '#8B4A1E' }}>Total Omzet Harian:</span>
                  <span className="font-bold text-[16px]" style={{ color: '#8B4A1E' }}>{fmt(totalOmzet)}</span>
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
