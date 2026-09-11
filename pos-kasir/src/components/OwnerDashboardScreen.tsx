import { useState, useRef, useEffect } from 'react'
import {
  TrendingUp,
  TrendingDown,
  Minus,
  Activity,
  BarChart2,
  Package,
  Users,
  Building2,
  X,
  ChefHat,
  ShoppingBag,
  ArrowUpRight,
  Download,
  AlertTriangle,
  Store,
  LogOut,
  CheckCircle2,
  Layers,
  ChevronDown,
  Check
} from 'lucide-react'
import PageShell from './PageShell'
import { useApp, Outlet, Cashier } from '../context/AppContext'
import { gasApi } from '../services/gasApi'
import { INGREDIENTS } from '../data/mockData'

const fmt = (n: number) => `Rp ${n.toLocaleString('id-ID')}`
const fmtShort = (n: number) =>
  n >= 1000000 ? `${(n / 1000000).toFixed(1)} Jt` : n >= 1000 ? `${(n / 1000).toFixed(0)} Rb` : String(n)

interface OwnerDashboardScreenProps {
  onBack: () => void
  onNavigate?: (screen: any) => void
}

type BranchId = 'all' | 'paskal' | 'braga' | 'dago' | string
type Period = 'today' | '7days' | 'month' | 'custom'
type Tab = 'overview' | 'analytics' | 'branches' | 'kasir' | 'raw_stock'

export default function OwnerDashboardScreen({ onBack, onNavigate }: OwnerDashboardScreenProps) {
  const { outletsList, setOutletsList, cashiersList, setCashiersList } = useApp()
  const [selectedBranch, setSelectedBranch] = useState<BranchId>('all')
  const [isBranchDropdownOpen, setIsBranchDropdownOpen] = useState(false)
  const [editingOutlet, setEditingOutlet] = useState<Outlet | null>(null)
  const [isOutletModalOpen, setIsOutletModalOpen] = useState(false)
  const [editingCashier, setEditingCashier] = useState<Cashier | null>(null)
  const [isCashierModalOpen, setIsCashierModalOpen] = useState(false)
  const [cashierForm, setCashierForm] = useState({ name: '', branchId: 'all', role: 'Kasir' })
  const [openDropdown, setOpenDropdown] = useState<'branch' | 'role' | null>(null)
  const branchDropdownRef = useRef<HTMLDivElement>(null)
  const [period, setPeriod] = useState<Period>('today')
  const [customDate, setCustomDate] = useState('')
  const [activeTab, setActiveTab] = useState<Tab>('overview')
  const [exportNotice, setExportNotice] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [dashboardData, setDashboardData] = useState<any>(null)
  const [isLoadingData, setIsLoadingData] = useState(true)

  useEffect(() => {
    let isMounted = true
    setIsLoadingData(true)
    gasApi.getOwnerDashboardData()
      .then(res => {
        if (isMounted && res) {
          setDashboardData(res)
        }
      })
      .catch(err => console.error("Error loading dashboard data:", err))
      .finally(() => {
        if (isMounted) setIsLoadingData(false)
      })
    return () => { isMounted = false }
  }, [])

  // Click outside listener to close dropdown
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (branchDropdownRef.current && !branchDropdownRef.current.contains(event.target as Node)) {
        setIsBranchDropdownOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const branchOptions = [
    { id: 'all' as BranchId, name: `Semua Cabang (${outletsList.length} Outlet)`, desc: outletsList.map(o => o.name.split('—')[1]?.trim() || o.name).join(', ') },
    ...outletsList.map(o => ({ id: o.id as BranchId, name: o.name, desc: o.address })),
  ]
  const activeBranchObj = branchOptions.find(b => b.id === selectedBranch) || branchOptions[0]

  // Branch data multipliers for dynamic demo stats
  const branchMultiplier: Record<BranchId, number> = {
    all: 1.0,
    paskal: 0.44,
    braga: 0.32,
    dago: 0.24,
  }

  const periodMultiplier: Record<Period, { factor: number; label: string }> = {
    today: { factor: 1.0, label: 'Hari Ini (07 Sep)' },
    '7days': { factor: 6.4, label: '7 Hari Terakhir' },
    month: { factor: 26.5, label: 'Bulan Ini (Sep 2026)' },
    custom: { factor: 3.2, label: `Custom (${customDate || 'Pilih Tanggal'})` },
  }

  const transactions = dashboardData?.transactions || []
  const branchTx = selectedBranch === 'all' 
    ? transactions 
    : transactions.filter((t: any) => t.branchId === selectedBranch)

  const realTotalOmzet = branchTx.reduce((sum: number, t: any) => sum + (Number(t.total) || 0), 0)
  const realTotalTrx = branchTx.length

  const totalOmzet = realTotalOmzet > 0 ? realTotalOmzet : 0
  const totalTrx = realTotalTrx > 0 ? realTotalTrx : 0
  const avgTicket = totalTrx > 0 ? Math.round(totalOmzet / totalTrx) : 0
  
  // Hitung itemsSold dari JSON items
  let itemsSold = 0
  branchTx.forEach((t: any) => {
    try {
      if (t.items) {
        const items = typeof t.items === 'string' ? JSON.parse(t.items) : t.items
        itemsSold += items.reduce((sum: number, i: any) => sum + (Number(i.qty) || 0), 0)
      }
    } catch(e) {}
  })

  const grossProfit = Math.round(totalOmzet * 0.54) // ~54% margin

  const mult = 1 // Use real data now, no multipliers needed for top metrics

  // Chart data based on period
  const chartDays = [
    { label: 'Sen', val: Math.round(13500000 * branchMultiplier[selectedBranch]) },
    { label: 'Sel', val: Math.round(14100000 * branchMultiplier[selectedBranch]) },
    { label: 'Rab', val: Math.round(13800000 * branchMultiplier[selectedBranch]) },
    { label: 'Kam', val: Math.round(14900000 * branchMultiplier[selectedBranch]) },
    { label: 'Jum', val: Math.round(17200000 * branchMultiplier[selectedBranch]) },
    { label: 'Sab', val: Math.round(21400000 * branchMultiplier[selectedBranch]) },
    { label: 'Min', val: Math.round(19800000 * branchMultiplier[selectedBranch]), active: true },
  ]
  const maxChartVal = Math.max(...chartDays.map(c => c.val))

  // Branch breakdown mapped from context
  const branchesData = outletsList.map((o, i) => {
    const defaultShare = i === 0 ? 0.44 : i === 1 ? 0.32 : i === 2 ? 0.24 : 0.1
    const share = Math.round(defaultShare * 100)
    const cashier = cashiersList.find(c => c.branchId === o.id)?.name || 'Belum Ada Kasir'
    return {
      id: o.id,
      name: o.name,
      address: o.address,
      omzet: Math.round(totalOmzet * defaultShare),
      trx: Math.round(totalTrx * defaultShare),
      cashier,
      status: 'Buka • Shift Siang',
      share,
      target: 80 + (i * 4),
    }
  })

  // Top products scaled
  const topProducts = [
    { id: 1, name: 'Siao May Ayam Udang (Isi 3)', cat: 'Kukus', qty: Math.round(214 * mult), total: Math.round(5136000 * mult), trend: 'up', hpp: 14500, price: 24000 },
    { id: 2, name: 'Hakau Udang Garing (Isi 3)', cat: 'Kukus', qty: Math.round(156 * mult), total: Math.round(3276000 * mult), trend: 'up', hpp: 12000, price: 21000 },
    { id: 4, name: 'Lumpia Kulit Tahu Goreng', cat: 'Goreng', qty: Math.round(98 * mult), total: Math.round(2254000 * mult), trend: 'stable', hpp: 13000, price: 23000 },
    { id: 5, name: 'Ceker Ayam Saus Szechuan', cat: 'Goreng', qty: Math.round(74 * mult), total: Math.round(1443000 * mult), trend: 'down', hpp: 10000, price: 19500 },
    { id: 3, name: 'Bakpao Durian Pasir Emas', cat: 'Kukus', qty: Math.round(55 * mult), total: Math.round(1430000 * mult), trend: 'stable', hpp: 15000, price: 26000 },
  ]

  // Cashier list mapped from context
  const cashierStats = cashiersList.map((c, i) => {
    const branchName = outletsList.find(o => o.id === c.branchId)?.name || 'Tidak Diketahui'
    const share = i === 0 ? 0.44 : i === 1 ? 0.32 : i === 2 ? 0.24 : 0.1
    return {
      id: c.id,
      name: c.name,
      branch: branchName,
      role: c.role,
      trx: Math.round(78 * mult * 0.5 * (share * 2)),
      omzet: Math.round(totalOmzet * share),
      status: c.status,
      voidCount: i % 2 === 0 ? 0 : 1,
    }
  })

  // Critical raw stock items
  const lowStockIngredients = INGREDIENTS.filter(i => i.is_tracked && i.current_stock <= i.min_stock_threshold * 1.5)

  const handleExport = () => {
    setExportNotice(true)
    setTimeout(() => setExportNotice(false), 3000)
  }

  // Header controls on the right
  const headerRight = (
    <div className="flex items-center gap-2">
      {/* Custom Branch selector dropdown */}
      <div className="relative" ref={branchDropdownRef}>
        <button
          type="button"
          onClick={() => setIsBranchDropdownOpen(!isBranchDropdownOpen)}
          className="flex items-center gap-2 px-3 py-1.5 rounded-xl text-[12px] font-bold transition-all hover:bg-amber-100/60 cursor-pointer"
          style={{
            background: '#F3E7CE',
            border: isBranchDropdownOpen ? '1.5px solid #8B4A1E' : '1px solid #E8D7C0',
            color: '#2B1810',
          }}
          title="Pilih Cabang untuk Audit & Monitoring"
        >
          <Store size={14} color="#8B4A1E" />
          <span className="truncate max-w-[180px]">{activeBranchObj.name}</span>
          <ChevronDown
            size={14}
            color="#6B5448"
            className={`transition-transform duration-200 ${isBranchDropdownOpen ? 'rotate-180' : ''}`}
          />
        </button>

        {isBranchDropdownOpen && (
          <div
            className="absolute left-0 top-full mt-1.5 z-50 rounded-2xl shadow-xl overflow-hidden animate-fade-in"
            style={{
              width: 270,
              background: 'white',
              border: '1.5px solid #E8D7C0',
              boxShadow: '0 10px 25px -5px rgba(43, 24, 16, 0.15)',
            }}
          >
            <div className="p-1.5 space-y-1">
              {branchOptions.map(b => {
                const isSelected = selectedBranch === b.id
                return (
                  <button
                    key={b.id}
                    type="button"
                    onClick={() => {
                      setSelectedBranch(b.id)
                      setIsBranchDropdownOpen(false)
                    }}
                    className="w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-left transition-all cursor-pointer"
                    style={{
                      background: isSelected ? '#F3E7CE' : 'transparent',
                      color: isSelected ? '#8B4A1E' : '#2B1810',
                    }}
                    onMouseEnter={e => {
                      if (!isSelected) {
                        e.currentTarget.style.background = '#FAF6ED'
                      }
                    }}
                    onMouseLeave={e => {
                      if (!isSelected) {
                        e.currentTarget.style.background = 'transparent'
                      }
                    }}
                  >
                    <div className="flex items-center gap-2.5 min-w-0 pr-2">
                      <div
                        className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0"
                        style={{
                          background: isSelected ? '#8B4A1E' : '#F3E7CE',
                          color: isSelected ? 'white' : '#8B4A1E',
                        }}
                      >
                        <Store size={14} />
                      </div>
                      <div className="min-w-0">
                        <p className="font-bold text-[12px] truncate" style={{ color: isSelected ? '#8B4A1E' : '#2B1810' }}>
                          {b.name}
                        </p>
                        {b.desc && (
                          <p className="text-[10px] truncate" style={{ color: '#6B5448' }}>
                            {b.desc}
                          </p>
                        )}
                      </div>
                    </div>
                    {isSelected && <Check size={14} color="#8B4A1E" className="shrink-0" />}
                  </button>
                )
              })}
            </div>
          </div>
        )}
      </div>

      {/* Period filter */}
      <div className="flex items-center gap-1 p-1 rounded-xl" style={{ background: '#F3E7CE', border: '1px solid #E8D7C0' }}>
        {(['today', '7days', 'month', 'custom'] as Period[]).map(p => (
          <button
            key={p}
            onClick={() => setPeriod(p)}
            className="px-2.5 py-1 rounded-lg text-[11px] font-bold transition-colors"
            style={{
              background: period === p ? '#8B4A1E' : 'transparent',
              color: period === p ? 'white' : '#6B5448',
            }}
          >
            {p === 'today' ? 'Hari Ini' : p === '7days' ? '7 Hari' : p === 'month' ? 'Bulan Ini' : 'Custom'}
          </button>
        ))}
        {period === 'custom' && (
          <input 
            type="date"
            value={customDate}
            onChange={(e) => setCustomDate(e.target.value)}
            className="ml-1 px-2 py-0.5 rounded text-[11px] font-bold outline-none"
            style={{ border: '1px solid #C49A62', background: 'white', color: '#8B4A1E' }}
          />
        )}
      </div>

      {/* Logout button */}
      <button
        onClick={onBack}
        className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[12px] font-bold transition-colors hover:bg-red-50"
        style={{ border: '1px solid #E8D7C0', color: '#B60000', background: 'white' }}
        title="Keluar dari Akun Owner ke Halaman Login"
      >
        <LogOut size={14} />
        <span>Keluar</span>
      </button>
    </div>
  )

  return (
    <PageShell
      title="Command Center Owner"
      subtitle={`Pemantauan Multi-Cabang & Keputusan Bisnis • Bpk. Haryanto (${periodMultiplier[period].label})`}
      onBack={onBack}
      backLabel="Keluar"
      headerRight={headerRight}
    >
      <div className="px-6 py-5 space-y-5 max-w-7xl mx-auto">
        {isLoadingData && (
          <div className="flex items-center justify-center p-8">
            <div className="w-8 h-8 border-4 border-amber-200/50 border-t-amber-500 rounded-full animate-spin"></div>
            <span className="ml-3 font-bold text-[#8B4A1E]">Mengambil data live dari seluruh cabang...</span>
          </div>
        )}

        {/* Export toast */}
        {exportNotice && (
          <div className="p-3.5 rounded-xl flex items-center justify-between animate-fade-in" style={{ background: '#EAF4E0', border: '1px solid #99C76E' }}>
            <div className="flex items-center gap-2">
              <CheckCircle2 size={16} color="#5B8A2E" />
              <p className="text-[13px] font-bold" style={{ color: '#2B1810' }}>
                Laporan Ringkasan Eksekutif ({periodMultiplier[period].label}) berhasil diekspor ke PDF/Excel.
              </p>
            </div>
            <span className="text-[11px] font-mono" style={{ color: '#5B8A2E' }}>STATUS: 200 OK</span>
          </div>
        )}

        {/* Navigation Sub-Tabs */}
        <div className="flex items-center justify-between border-b pb-1" style={{ borderColor: '#E8D7C0' }}>
          <div className="flex items-center gap-2">
            {[
              { id: 'overview', label: 'Ringkasan Eksekutif', icon: Activity },
              { id: 'analytics', label: 'Analisis & Margin', icon: BarChart2 },
              { id: 'branches', label: 'Monitoring Cabang', icon: Building2 },
              { id: 'kasir', label: 'Performa Kasir', icon: Users },
              { id: 'raw_stock', label: 'Resep & Bahan Baku', icon: ChefHat },
            ].map(tab => {
              const Icon = tab.icon
              const active = activeTab === tab.id
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as Tab)}
                  className="flex items-center gap-2 px-4 py-2 rounded-xl text-[13px] font-bold transition-all"
                  style={{
                    background: active ? '#8B4A1E' : 'transparent',
                    color: active ? 'white' : '#6B5448',
                  }}
                >
                  <Icon size={16} />
                  <span>{tab.label}</span>
                  {tab.id === 'raw_stock' && lowStockIngredients.length > 0 && (
                    <span className="w-2 h-2 rounded-full" style={{ background: '#B60000' }} />
                  )}
                </button>
              )
            })}
          </div>

          <button
            onClick={handleExport}
            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-[12px] font-bold transition-colors hover:bg-amber-100/50"
            style={{ border: '1px solid #C49A62', color: '#8B4A1E', background: '#F3E7CE' }}
          >
            <Download size={14} />
            <span>Ekspor PDF / Excel</span>
          </button>
        </div>

        {/* TAB 1: OVERVIEW */}
        {activeTab === 'overview' && (
          <div className="space-y-5 animate-fade-in">
            {/* Top 4 KPI Cards */}
            <div className="grid grid-cols-4 gap-4">
              {[
                {
                  label: 'Total Omzet Kotor',
                  val: fmt(totalOmzet),
                  sub: '+14.2% vs periode lalu',
                  icon: Activity,
                  up: true,
                  badge: 'Tertinggi: Paskal',
                },
                {
                  label: 'Total Transaksi Selesai',
                  val: `${totalTrx.toLocaleString('id-ID')} Tiket`,
                  sub: `Rata-rata ${fmt(avgTicket)}/meja`,
                  icon: BarChart2,
                  up: true,
                  badge: 'Target: 95%',
                },
                {
                  label: 'Porsi Dimsum Terjual',
                  val: `${itemsSold.toLocaleString('id-ID')} Porsi`,
                  sub: 'Laju 48 porsi/jam rata-rata',
                  icon: Package,
                  up: true,
                  badge: '64% Kukus',
                },
                {
                  label: 'Estimasi Margin Kotor',
                  val: fmt(grossProfit),
                  sub: 'Margin ~54.2% setelah HPP',
                  icon: TrendingUp,
                  up: true,
                  badge: 'HPP Terkendali',
                },
              ].map(kpi => {
                const Icon = kpi.icon
                return (
                  <div
                    key={kpi.label}
                    className="rounded-2xl p-4 transition-transform hover:-translate-y-0.5"
                    style={{ background: 'white', border: '1.5px solid #E8D7C0', boxShadow: '0 2px 8px rgba(43,24,16,0.04)' }}
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: '#F3E7CE' }}>
                        <Icon size={20} color="#8B4A1E" />
                      </div>
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full" style={{ background: '#EAF4E0', color: '#5B8A2E' }}>
                        {kpi.badge}
                      </span>
                    </div>
                    <p className="font-serif font-bold text-[20px] leading-tight" style={{ color: '#2B1810' }}>
                      {kpi.val}
                    </p>
                    <p className="text-[11px] font-bold mt-1" style={{ color: '#6B5448' }}>
                      {kpi.label}
                    </p>
                    <p className="text-[10px] mt-0.5" style={{ color: '#8B4A1E' }}>
                      {kpi.sub}
                    </p>
                  </div>
                )
              })}
            </div>

            {/* Sales Chart with proportional Y-axis */}
            <div className="rounded-2xl p-5" style={{ background: 'white', border: '1px solid #E8D7C0' }}>
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="font-serif font-bold text-[16px]" style={{ color: '#2B1810' }}>
                    Tren Pendapatan Harian (Proposional)
                  </h3>
                  <p className="text-[11px]" style={{ color: '#6B5448' }}>
                    Grafik penjualan riil dalam Rupiah dengan skala Y proporsional
                  </p>
                </div>
                <div className="flex items-center gap-4 text-[11px]">
                  <div className="flex items-center gap-1.5">
                    <span className="w-3 h-3 rounded" style={{ background: '#8B4A1E' }} />
                    <span style={{ color: '#2B1810' }}>Hari Terpilih / Puncak</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="w-3 h-3 rounded" style={{ background: '#E8D7C0' }} />
                    <span style={{ color: '#6B5448' }}>Hari Biasa</span>
                  </div>
                </div>
              </div>

              {/* Proportional Chart Graphic */}
              <div className="flex items-end gap-4 h-48 pt-4 pb-2 px-2" style={{ borderBottom: '1.5px solid #E8D7C0' }}>
                {/* Y-axis indicator */}
                <div className="flex flex-col justify-between h-full pr-2 text-[10px] font-mono select-none" style={{ color: '#C49A62' }}>
                  <span>{fmtShort(maxChartVal)}</span>
                  <span>{fmtShort(maxChartVal * 0.66)}</span>
                  <span>{fmtShort(maxChartVal * 0.33)}</span>
                  <span>0</span>
                </div>

                {chartDays.map(item => {
                  const pct = Math.max(8, Math.round((item.val / maxChartVal) * 100))
                  const isTop = item.active || item.val === maxChartVal
                  return (
                    <div key={item.label} className="flex-1 flex flex-col items-center h-full justify-end group relative">
                      {/* Hover Tooltip */}
                      <div className="opacity-0 group-hover:opacity-100 transition-opacity absolute -top-8 bg-neutral-900 text-white text-[10px] font-bold px-2 py-1 rounded shadow pointer-events-none whitespace-nowrap z-10">
                        {fmt(item.val)}
                      </div>
                      <div
                        className="w-full rounded-t-xl transition-all duration-300 relative group-hover:brightness-95"
                        style={{
                          height: `${pct}%`,
                          background: isTop ? '#8B4A1E' : '#E8D7C0',
                          border: isTop ? 'none' : '1px solid #D5CBB8',
                        }}
                      >
                        <div className="absolute -top-5 w-full text-center text-[9px] font-bold font-mono" style={{ color: isTop ? '#8B4A1E' : '#6B5448' }}>
                          {fmtShort(item.val)}
                        </div>
                      </div>
                      <span className="text-[11px] font-bold mt-2" style={{ color: isTop ? '#8B4A1E' : '#6B5448' }}>
                        {item.label}
                      </span>
                    </div>
                  )
                })}
              </div>
            </div>

            {/* Bottom 2 Columns: Top Products + Fast Actions & Live Branch status */}
            <div className="grid grid-cols-12 gap-5">
              {/* Left 7 cols: Top Dimsum Products */}
              <div className="col-span-7 rounded-2xl p-5" style={{ background: 'white', border: '1px solid #E8D7C0' }}>
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-serif font-bold text-[15px]" style={{ color: '#2B1810' }}>
                    Top 5 Menu Dimsum Paling Laris
                  </h3>
                  <button
                    onClick={() => onNavigate && onNavigate('manageProducts')}
                    className="text-[12px] font-bold flex items-center gap-1"
                    style={{ color: '#8B4A1E' }}
                  >
                    <span>Katalog Menu</span>
                    <ArrowUpRight size={14} />
                  </button>
                </div>

                <div className="space-y-2.5">
                  {topProducts.map((p, idx) => {
                    const TIcon = p.trend === 'up' ? TrendingUp : p.trend === 'down' ? TrendingDown : Minus
                    const tColor = p.trend === 'up' ? '#5B8A2E' : p.trend === 'down' ? '#B60000' : '#C49A62'
                    const marginPct = Math.round(((p.price - p.hpp) / p.price) * 100)

                    return (
                      <div
                        key={p.id}
                        className="flex items-center justify-between p-3 rounded-xl transition-colors hover:bg-neutral-50"
                        style={{ background: '#FAF6ED', border: '1px solid #E8D7C0' }}
                      >
                        <div className="flex items-center gap-3">
                          <span
                            className="w-6 h-6 rounded-full flex items-center justify-center font-bold text-[11px]"
                            style={{
                              background: idx === 0 ? '#8B4A1E' : '#E8D7C0',
                              color: idx === 0 ? 'white' : '#2B1810',
                            }}
                          >
                            {idx + 1}
                          </span>
                          <div>
                            <p className="font-bold text-[13px]" style={{ color: '#2B1810' }}>
                              {p.name}
                            </p>
                            <div className="flex items-center gap-2 mt-0.5">
                              <span className="text-[10px] font-bold px-1.5 py-0.2 rounded" style={{ background: '#F3E7CE', color: '#8B4A1E' }}>
                                {p.cat}
                              </span>
                              <span className="text-[10px]" style={{ color: '#6B5448' }}>
                                HPP {fmt(p.hpp)} • Margin {marginPct}%
                              </span>
                            </div>
                          </div>
                        </div>

                        <div className="text-right">
                          <p className="font-bold text-[13px]" style={{ color: '#2B1810' }}>
                            {fmt(p.total)}
                          </p>
                          <div className="flex items-center justify-end gap-1 text-[11px] font-semibold" style={{ color: tColor }}>
                            <TIcon size={12} />
                            <span>{p.qty} porsi</span>
                          </div>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>

              {/* Right 5 cols: Fast Navigation & Operational Shortcuts */}
              {/* Right 5 cols: Fast Navigation & Operational Shortcuts */}
              <div className="col-span-5 space-y-4">
                {/* Manajemen Data Master Box */}
                <div className="rounded-2xl p-5" style={{ background: '#F3E7CE', border: '1.5px solid #C49A62' }}>
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: '#8B4A1E' }}>
                      <ChefHat size={20} color="white" />
                    </div>
                    <div>
                      <h4 className="font-serif font-bold text-[15px]" style={{ color: '#2B1810' }}>
                        Manajemen Data Master
                      </h4>
                      <p className="text-[11px]" style={{ color: '#6B5448' }}>
                        Kelola Katalog Menu & Bahan Baku
                      </p>
                    </div>
                  </div>
                  <p className="text-[12px] mb-4 leading-relaxed" style={{ color: '#2B1810' }}>
                    Tambah, edit, atau atur resep menu dan bahan baku agar stok terpotong otomatis.
                  </p>
                  
                  {onNavigate && (
                    <div className="space-y-2">
                      <button
                        onClick={() => onNavigate('manageProducts')}
                        className="w-full py-2.5 rounded-xl font-bold text-[13px] flex items-center justify-center gap-2 transition-colors hover:opacity-90"
                        style={{ background: '#8B4A1E', color: 'white', border: '1px solid #C49A62' }}
                      >
                        <Package size={15} />
                        <span>Kelola Menu & Tambah Produk</span>
                      </button>
                      <button
                        onClick={() => onNavigate('kelolaBahanBaku')}
                        className="w-full py-2.5 rounded-xl font-bold text-[13px] flex items-center justify-center gap-2 transition-colors hover:opacity-90"
                        style={{ background: 'white', color: '#8B4A1E', border: '1px solid #C49A62' }}
                      >
                        <Layers size={15} />
                        <span>Master Bahan Baku</span>
                      </button>
                      <button
                        onClick={() => onNavigate('kelolaResep')}
                        className="w-full py-2.5 rounded-xl font-bold text-[13px] flex items-center justify-center gap-2 transition-colors hover:opacity-90"
                        style={{ background: '#8B4A1E', color: 'white' }}
                      >
                        <ChefHat size={15} />
                        <span>Atur Resep Menu</span>
                      </button>
                    </div>
                  )}
                </div>

                {/* Quick Owner Navigation Links */}
                <div className="rounded-2xl p-4 bg-white" style={{ border: '1px solid #E8D7C0' }}>
                  <h4 className="font-serif font-bold text-[13px] mb-3" style={{ color: '#2B1810' }}>
                    Akses Cepat Modul Pemilik
                  </h4>
                  <div className="grid grid-cols-2 gap-2">
                    {[
                      { label: 'Audit Stok Opname', screen: 'stokOpname', icon: Layers },
                      { label: 'Kelola Promo', screen: 'managePromo', icon: ShoppingBag },
                      { label: 'Laporan Finansial', screen: 'reports', icon: BarChart2 },
                      { label: 'Pengaturan Sistem', screen: 'settings', icon: Building2 },
                    ].map(btn => {
                      const Icon = btn.icon
                      return (
                        <button
                          key={btn.screen}
                          onClick={() => onNavigate && onNavigate(btn.screen)}
                          className="flex items-center gap-2 p-2.5 rounded-xl text-left transition-colors hover:bg-amber-50"
                          style={{ border: '1px solid #E8D7C0', background: '#FAF6ED' }}
                        >
                          <Icon size={14} color="#8B4A1E" />
                          <span className="text-[11px] font-bold" style={{ color: '#2B1810' }}>
                            {btn.label}
                          </span>
                        </button>
                      )
                    })}
                  </div>
                </div>

                {/* Low Stock Warning Alert if any */}
                {lowStockIngredients.length > 0 && (
                  <div className="rounded-2xl p-4" style={{ background: '#FFF5F5', border: '1.5px solid #F8B4B4' }}>
                    <div className="flex items-center gap-2 mb-2">
                      <AlertTriangle size={16} color="#B60000" />
                      <h4 className="font-bold text-[12px]" style={{ color: '#B60000' }}>
                        Peringatan Bahan Baku Kritis ({lowStockIngredients.length} item)
                      </h4>
                    </div>
                    <div className="space-y-1 text-[11px]" style={{ color: '#6B5448' }}>
                      {lowStockIngredients.slice(0, 3).map(i => (
                        <div key={i.id} className="flex justify-between">
                          <span>{i.name}</span>
                          <span className="font-bold font-mono" style={{ color: '#B60000' }}>
                            {i.current_stock} {i.unit} (Min: {i.min_stock_threshold})
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: ANALYTICS & MARGIN */}
        {activeTab === 'analytics' && (
          <div className="space-y-5 animate-fade-in">
            <div className="grid grid-cols-3 gap-4">
              {/* Category distribution */}
              <div className="rounded-2xl p-5 bg-white" style={{ border: '1px solid #E8D7C0' }}>
                <h4 className="font-serif font-bold text-[15px] mb-3" style={{ color: '#2B1810' }}>
                  Distribusi Kategori Penjualan
                </h4>
                <div className="space-y-3">
                  {[
                    { cat: 'Dimsum Kukus', pct: 58, omzet: Math.round(totalOmzet * 0.58), color: '#8B4A1E' },
                    { cat: 'Dimsum Goreng', pct: 28, omzet: Math.round(totalOmzet * 0.28), color: '#C49A62' },
                    { cat: 'Minuman Segar', pct: 14, omzet: Math.round(totalOmzet * 0.14), color: '#5B8A2E' },
                  ].map(c => (
                    <div key={c.cat}>
                      <div className="flex justify-between text-[12px] font-bold mb-1">
                        <span style={{ color: '#2B1810' }}>{c.cat}</span>
                        <span style={{ color: c.color }}>{c.pct}% ({fmt(c.omzet)})</span>
                      </div>
                      <div className="w-full h-2 rounded-full bg-neutral-100 overflow-hidden">
                        <div className="h-full rounded-full" style={{ width: `${c.pct}%`, background: c.color }} />
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Payment Methods Breakdown */}
              <div className="rounded-2xl p-5 bg-white" style={{ border: '1px solid #E8D7C0' }}>
                <h4 className="font-serif font-bold text-[15px] mb-3" style={{ color: '#2B1810' }}>
                  Metode Pembayaran Pelanggan
                </h4>
                <div className="space-y-3">
                  {[
                    { method: 'QRIS (Gopay/OVO/BCA)', pct: 64, count: Math.round(totalTrx * 0.64), color: '#8B4A1E' },
                    { method: 'Tunai (Cash)', pct: 26, count: Math.round(totalTrx * 0.26), color: '#C49A62' },
                    { method: 'Debit / Kartu Kredit', pct: 10, count: Math.round(totalTrx * 0.10), color: '#6B5448' },
                  ].map(m => (
                    <div key={m.method}>
                      <div className="flex justify-between text-[12px] font-bold mb-1">
                        <span style={{ color: '#2B1810' }}>{m.method}</span>
                        <span style={{ color: m.color }}>{m.pct}% ({m.count} trx)</span>
                      </div>
                      <div className="w-full h-2 rounded-full bg-neutral-100 overflow-hidden">
                        <div className="h-full rounded-full" style={{ width: `${m.pct}%`, background: m.color }} />
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Peak Hours Analysis */}
              <div className="rounded-2xl p-5 bg-white" style={{ border: '1px solid #E8D7C0' }}>
                <h4 className="font-serif font-bold text-[15px] mb-3" style={{ color: '#2B1810' }}>
                  Jam Sibuk Restoran (Peak Hours)
                </h4>
                <div className="space-y-3">
                  {[
                    { time: '11:30 - 14:00 (Lunch Rush)', load: 'Sangat Padat', pct: 88, color: '#B60000' },
                    { time: '18:00 - 21:00 (Dinner Peak)', load: 'Maksimum', pct: 96, color: '#8B4A1E' },
                    { time: '14:00 - 17:30 (Sore Hangout)', load: 'Sedang', pct: 45, color: '#C49A62' },
                  ].map(t => (
                    <div key={t.time}>
                      <div className="flex justify-between text-[12px] font-bold mb-1">
                        <span style={{ color: '#2B1810' }}>{t.time}</span>
                        <span style={{ color: t.color }}>{t.load} ({t.pct}%)</span>
                      </div>
                      <div className="w-full h-2 rounded-full bg-neutral-100 overflow-hidden">
                        <div className="h-full rounded-full" style={{ width: `${t.pct}%`, background: t.color }} />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB 3: BRANCH MONITORING */}
        {activeTab === 'branches' && (
          <div className="space-y-4 animate-fade-in">
            <div className="flex items-center justify-between mb-2">
              <div>
                <h3 className="font-serif font-bold text-[16px]" style={{ color: '#2B1810' }}>Daftar Cabang</h3>
                <p className="text-[12px]" style={{ color: '#6B5448' }}>Kelola informasi outlet dan target cabang</p>
              </div>
              <button 
                disabled={isSaving}
                onClick={() => {
                  setEditingOutlet(null)
                  setIsOutletModalOpen(true)
                }}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[12px] font-bold text-white transition-opacity hover:opacity-90 disabled:opacity-50"
                style={{ background: '#8B4A1E' }}>
                <Store size={14} /> {isSaving ? 'Menyimpan...' : 'Tambah Cabang'}
              </button>
            </div>
            <div className="grid grid-cols-3 gap-4">
              {branchesData.map(b => (
                <div
                  key={b.id}
                  className="rounded-2xl p-5 bg-white transition-all hover:shadow-md"
                  style={{ border: selectedBranch === b.id ? '2px solid #8B4A1E' : '1px solid #E8D7C0' }}
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: '#F3E7CE' }}>
                      <Building2 size={20} color="#8B4A1E" />
                    </div>
                    <span className="text-[11px] font-bold px-2 py-0.5 rounded-full" style={{ background: '#EAF4E0', color: '#5B8A2E' }}>
                      {b.status}
                    </span>
                  </div>

                  <h4 className="font-serif font-bold text-[16px]" style={{ color: '#2B1810' }}>
                    {b.name}
                  </h4>
                  <p className="text-[11px] mb-4" style={{ color: '#6B5448' }}>
                    {b.address}
                  </p>

                  <div className="space-y-2 py-3 border-t border-b" style={{ borderColor: '#F3E7CE' }}>
                    <div className="flex justify-between text-[12px]">
                      <span style={{ color: '#6B5448' }}>Omzet Periode Ini:</span>
                      <span className="font-bold" style={{ color: '#8B4A1E' }}>{fmt(b.omzet)}</span>
                    </div>
                    <div className="flex justify-between text-[12px]">
                      <span style={{ color: '#6B5448' }}>Jumlah Transaksi:</span>
                      <span className="font-bold font-mono">{b.trx} order</span>
                    </div>
                    <div className="flex justify-between text-[12px]">
                      <span style={{ color: '#6B5448' }}>Kasir Bertugas:</span>
                      <span className="font-bold">{b.cashier}</span>
                    </div>
                  </div>

                  <div className="mt-4">
                    <div className="flex justify-between text-[11px] font-bold mb-1">
                      <span style={{ color: '#6B5448' }}>Pencapaian Target Cabang:</span>
                      <span style={{ color: '#8B4A1E' }}>{b.target}%</span>
                    </div>
                    <div className="w-full h-2 rounded-full bg-neutral-100 overflow-hidden">
                      <div className="h-full rounded-full" style={{ width: `${b.target}%`, background: '#8B4A1E' }} />
                    </div>
                  </div>

                  <div className="mt-4 pt-3 flex items-center justify-end gap-2 border-t" style={{ borderColor: '#E8D7C0' }}>
                    <button 
                      disabled={isSaving}
                      onClick={() => {
                        setEditingOutlet(outletsList.find(o => o.id === b.id) || null)
                        setIsOutletModalOpen(true)
                      }}
                      className="text-[11px] font-bold disabled:opacity-50" style={{ color: '#6B5448' }}>Edit</button>
                    <button 
                      disabled={isSaving}
                      onClick={async () => {
                        if (confirm(`Hapus cabang ${b.name}?`)) {
                          setIsSaving(true)
                          try {
                            await gasApi.deleteOutlet(b.id)
                            setOutletsList(outletsList.filter(o => o.id !== b.id))
                          } catch (err) {
                            alert('Gagal menghapus cabang')
                          } finally {
                            setIsSaving(false)
                          }
                        }
                      }}
                      className="text-[11px] font-bold disabled:opacity-50" style={{ color: '#B60000' }}>Hapus</button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* TAB 4: KASIR AUDIT */}
        {activeTab === 'kasir' && (
          <div className="rounded-2xl p-5 bg-white animate-fade-in" style={{ border: '1px solid #E8D7C0' }}>
            <div className="flex items-center justify-between mb-4">
              <h4 className="font-serif font-bold text-[16px]" style={{ color: '#2B1810' }}>
                Monitoring Kasir Aktif & Rekap Shift
              </h4>
              <button 
                disabled={isSaving}
                onClick={() => {
                  setEditingCashier(null)
                  setCashierForm({ name: '', branchId: outletsList[0]?.id || 'all', role: 'Kasir' })
                  setOpenDropdown(null)
                  setIsCashierModalOpen(true)
                }}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[12px] font-bold text-white transition-opacity hover:opacity-90 disabled:opacity-50"
                style={{ background: '#8B4A1E' }}>
                <Users size={14} /> {isSaving ? 'Menyimpan...' : 'Tambah Kasir'}
              </button>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="text-[11px] font-bold uppercase tracking-wider border-b" style={{ borderColor: '#E8D7C0', color: '#6B5448' }}>
                    <th className="pb-3">Nama Kasir</th>
                    <th className="pb-3">Lokasi Outlet</th>
                    <th className="pb-3">Shift</th>
                    <th className="pb-3 text-right">Order Selesai</th>
                    <th className="pb-3 text-right">Total Kas Terkumpul</th>
                    <th className="pb-3 text-center">Void / Batal</th>
                    <th className="pb-3 text-center">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y" style={{ borderColor: '#F3E7CE' }}>
                  {cashierStats.map(k => (
                    <tr key={k.id} className="text-[13px]">
                      <td className="py-3 font-bold" style={{ color: '#2B1810' }}>
                        {k.name}
                        <div className="flex gap-2 mt-1">
                          <button 
                            disabled={isSaving}
                            onClick={() => {
                              const c = cashiersList.find(x => x.id === k.id)
                              if (c) {
                                setEditingCashier(c)
                                setCashierForm({ name: c.name, branchId: c.branchId, role: c.role })
                                setOpenDropdown(null)
                                setIsCashierModalOpen(true)
                              }
                            }}
                            className="text-[9px] font-normal underline disabled:opacity-50" style={{ color: '#C49A62' }}>Edit</button>
                          <button 
                            disabled={isSaving}
                            onClick={async () => {
                              if (confirm(`Hapus kasir ${k.name}?`)) {
                                setIsSaving(true)
                                try {
                                  await gasApi.deleteCashier(k.id)
                                  setCashiersList(cashiersList.filter(c => c.id !== k.id))
                                } catch (err) {
                                  alert('Gagal menghapus kasir')
                                } finally {
                                  setIsSaving(false)
                                }
                              }
                            }}
                            className="text-[9px] font-normal underline disabled:opacity-50" style={{ color: '#B60000' }}>Hapus</button>
                        </div>
                      </td>
                      <td className="py-3">
                        <span className="text-[12px] font-bold" style={{ color: '#6B5448' }}>
                          {k.branch}
                        </span>
                      </td>
                      <td className="py-3" style={{ color: '#6B5448' }}>
                        {k.role}
                      </td>
                      <td className="py-3 text-right font-mono font-bold">
                        {k.trx} trx
                      </td>
                      <td className="py-3 text-right font-bold" style={{ color: '#8B4A1E' }}>
                        {fmt(k.omzet)}
                      </td>
                      <td className="py-3 text-center">
                        <span className="px-2 py-0.5 rounded text-[11px] font-bold" style={{ background: k.voidCount > 0 ? '#FFF5F5' : '#F3E7CE', color: k.voidCount > 0 ? '#B60000' : '#6B5448' }}>
                          {k.voidCount} item
                        </span>
                      </td>
                      <td className="py-3 text-center flex items-center justify-center gap-1 flex-wrap">
                        <select 
                          disabled={isSaving}
                          value={k.status}
                          onChange={async (e) => {
                            setIsSaving(true)
                            try {
                              const updatedCashier = { ...cashiersList.find(c => c.id === k.id)!, status: e.target.value as 'Aktif' | 'Nonaktif' }
                              await gasApi.saveCashier(updatedCashier)
                              setCashiersList(cashiersList.map(c => c.id === k.id ? updatedCashier : c))
                            } catch (err) {
                              alert('Gagal update status')
                            } finally {
                              setIsSaving(false)
                            }
                          }}
                          className="px-2.5 py-0.5 rounded-full text-[11px] font-bold outline-none cursor-pointer disabled:opacity-50"
                          style={{ background: k.status === 'Aktif' ? '#EAF4E0' : '#FCE8E8', color: k.status === 'Aktif' ? '#5B8A2E' : '#B60000' }}
                        >
                          <option value="Aktif">Aktif</option>
                          <option value="Nonaktif">Nonaktif</option>
                        </select>
                        <button 
                          disabled={isSaving}
                          onClick={async () => {
                            if(confirm(`Hapus kasir ${k.name}?`)) {
                              setIsSaving(true)
                              try {
                                await gasApi.deleteCashier(k.id)
                                setCashiersList(cashiersList.filter(c => c.id !== k.id))
                              } catch(err) {
                                alert('Gagal hapus kasir')
                              } finally {
                                setIsSaving(false)
                              }
                            }
                          }}
                          className="text-[10px] text-red-500 underline ml-2 disabled:opacity-50">
                          Hapus
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* TAB 5: RAW INGREDIENTS & RECIPES */}
        {activeTab === 'raw_stock' && (
          <div className="space-y-4 animate-fade-in">
            <div className="flex items-center justify-between p-4 rounded-2xl" style={{ background: '#F3E7CE', border: '1.5px solid #C49A62' }}>
              <div>
                <h4 className="font-serif font-bold text-[16px]" style={{ color: '#2B1810' }}>
                  Audit Stok Bahan Baku Terintegrasi Resep
                </h4>
                <p className="text-[12px]" style={{ color: '#6B5448' }}>
                  Semua bahan baku dengan status tracked otomatis terhitung saat menu dimsum terjual di kasir.
                </p>
              </div>
              {onNavigate && (
                <button
                  onClick={() => onNavigate('kelolaResep')}
                  className="px-4 py-2 rounded-xl font-bold text-[13px] flex items-center gap-2"
                  style={{ background: '#8B4A1E', color: 'white' }}
                >
                  <ChefHat size={16} />
                  <span>Buka Editor Resep Produk</span>
                </button>
              )}
            </div>

            <div className="rounded-2xl p-5 bg-white" style={{ border: '1px solid #E8D7C0' }}>
              <div className="grid grid-cols-3 gap-3">
                {INGREDIENTS.map(ing => {
                  const isLow = ing.is_tracked && ing.current_stock <= ing.min_stock_threshold
                  return (
                    <div
                      key={ing.id}
                      className="p-3.5 rounded-xl transition-all"
                      style={{
                        background: isLow ? '#FFF5F5' : '#FAF6ED',
                        border: isLow ? '1.5px solid #F8B4B4' : '1px solid #E8D7C0',
                      }}
                    >
                      <div className="flex items-start justify-between">
                        <h5 className="font-bold text-[13px]" style={{ color: '#2B1810' }}>
                          {ing.name}
                        </h5>
                        <span
                          className="text-[9px] font-bold px-1.5 py-0.5 rounded"
                          style={{
                            background: ing.is_tracked ? (isLow ? '#B60000' : '#8B4A1E') : '#C49A62',
                            color: 'white',
                          }}
                        >
                          {ing.is_tracked ? (isLow ? 'Kritis' : 'Tracked') : 'Bebas'}
                        </span>
                      </div>
                      <div className="mt-3 flex items-baseline justify-between">
                        <p className="text-[18px] font-serif font-bold font-mono" style={{ color: isLow ? '#B60000' : '#2B1810' }}>
                          {ing.current_stock} <span className="text-[12px] font-sans font-normal" style={{ color: '#6B5448' }}>{ing.unit}</span>
                        </p>
                        {ing.is_tracked && (
                          <span className="text-[10px]" style={{ color: '#6B5448' }}>
                            Min: {ing.min_stock_threshold} {ing.unit}
                          </span>
                        )}
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* MODAL KELOLA OUTLET / CABANG */}
      {isOutletModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setIsOutletModalOpen(false)} />
          <div className="bg-[#FAF6ED] rounded-3xl w-full max-w-md relative flex flex-col shadow-2xl animate-scale-up z-10 overflow-hidden" style={{ border: '1px solid #E8D7C0' }}>
            <div className="px-6 py-5 flex items-center justify-between" style={{ borderBottom: '1px solid #E8D7C0', background: 'white' }}>
              <div>
                <h3 className="font-serif font-bold text-[18px]" style={{ color: '#2B1810' }}>
                  {editingOutlet ? 'Edit Cabang' : 'Tambah Cabang Baru'}
                </h3>
              </div>
              <button onClick={() => setIsOutletModalOpen(false)} className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-neutral-100 transition-colors">
                <X size={18} color="#6B5448" />
              </button>
            </div>
            
            <div className="p-6 space-y-4 flex-1 overflow-y-auto custom-scrollbar">
              <form id="outletForm" onSubmit={async (e) => {
                e.preventDefault()
                const fd = new FormData(e.currentTarget)
                setIsSaving(true)
                try {
                  const data: Outlet = {
                    id: editingOutlet?.id || 'b' + Date.now(),
                    name: fd.get('name') as string,
                    address: fd.get('address') as string,
                    phone: fd.get('phone') as string,
                  }
                  await gasApi.saveOutlet(data)
                  if (editingOutlet) {
                    setOutletsList(outletsList.map(o => o.id === data.id ? data : o))
                  } else {
                    setOutletsList([...outletsList, data])
                  }
                  setIsOutletModalOpen(false)
                } catch (err) {
                  alert('Gagal menyimpan cabang: ' + (err instanceof Error ? err.message : String(err)))
                } finally {
                  setIsSaving(false)
                }
              }}>
                <div>
                  <label className="block text-[11px] font-bold mb-1.5" style={{ color: '#6B5448' }}>NAMA CABANG</label>
                  <input required name="name" defaultValue={editingOutlet?.name} placeholder="Misal: Hasuka Dimsum - Paskal"
                    className="w-full px-4 py-2.5 rounded-xl text-[13px] outline-none transition-colors"
                    style={{ background: 'white', border: '1.5px solid #E8D7C0', color: '#2B1810' }}
                    onFocus={e => e.currentTarget.style.borderColor = '#8B4A1E'}
                    onBlur={e => e.currentTarget.style.borderColor = '#E8D7C0'} />
                </div>
                <div>
                  <label className="block text-[11px] font-bold mb-1.5 mt-3" style={{ color: '#6B5448' }}>ALAMAT LENGKAP</label>
                  <textarea required name="address" defaultValue={editingOutlet?.address} placeholder="Alamat lengkap cabang..." rows={3}
                    className="w-full px-4 py-2.5 rounded-xl text-[13px] outline-none transition-colors resize-none"
                    style={{ background: 'white', border: '1.5px solid #E8D7C0', color: '#2B1810' }}
                    onFocus={e => e.currentTarget.style.borderColor = '#8B4A1E'}
                    onBlur={e => e.currentTarget.style.borderColor = '#E8D7C0'} />
                </div>
                <div>
                  <label className="block text-[11px] font-bold mb-1.5 mt-3" style={{ color: '#6B5448' }}>NOMOR TELEPON</label>
                  <input required name="phone" defaultValue={editingOutlet?.phone} placeholder="Misal: 0812-3456-7890"
                    className="w-full px-4 py-2.5 rounded-xl text-[13px] outline-none transition-colors"
                    style={{ background: 'white', border: '1.5px solid #E8D7C0', color: '#2B1810' }}
                    onFocus={e => e.currentTarget.style.borderColor = '#8B4A1E'}
                    onBlur={e => e.currentTarget.style.borderColor = '#E8D7C0'} />
                </div>
              </form>
            </div>
            
            <div className="px-6 py-4 flex gap-3" style={{ borderTop: '1px solid #E8D7C0', background: 'white' }}>
              <button type="button" onClick={() => setIsOutletModalOpen(false)} disabled={isSaving} className="flex-1 py-3 rounded-xl font-bold text-[14px] disabled:opacity-50"
                style={{ background: '#F3E7CE', color: '#8B4A1E' }}>Batal</button>
              <button form="outletForm" type="submit" disabled={isSaving} className="flex-1 py-3 rounded-xl font-bold text-[14px] text-white disabled:opacity-50 flex items-center justify-center gap-2"
                style={{ background: '#8B4A1E' }}>
                {isSaving ? 'Menyimpan...' : 'Simpan'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL KELOLA KASIR */}
      {isCashierModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setIsCashierModalOpen(false)} />
          <div className="bg-[#FAF6ED] rounded-3xl w-full max-w-md relative flex flex-col shadow-2xl animate-scale-up z-10 overflow-hidden" style={{ border: '1px solid #E8D7C0' }}>
            <div className="px-6 py-5 flex items-center justify-between" style={{ borderBottom: '1px solid #E8D7C0', background: 'white' }}>
              <div>
                <h3 className="font-serif font-bold text-[18px]" style={{ color: '#2B1810' }}>
                  {editingCashier ? 'Edit Kasir' : 'Tambah Kasir Baru'}
                </h3>
              </div>
              <button onClick={() => setIsCashierModalOpen(false)} className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-neutral-100 transition-colors">
                <X size={18} color="#6B5448" />
              </button>
            </div>
            
            <div className="p-6 space-y-4 flex-1 overflow-y-auto custom-scrollbar">
              <form id="cashierForm" onSubmit={async (e) => {
                e.preventDefault()
                setIsSaving(true)
                try {
                  const data: Cashier = {
                    id: editingCashier?.id || 'c' + Date.now(),
                    name: cashierForm.name,
                    branchId: cashierForm.branchId,
                    role: cashierForm.role,
                    status: 'Aktif',
                  }
                  await gasApi.saveCashier(data)
                  if (editingCashier) {
                    setCashiersList(cashiersList.map(c => c.id === data.id ? data : c))
                  } else {
                    setCashiersList([...cashiersList, data])
                  }
                  setIsCashierModalOpen(false)
                } catch (err) {
                  alert('Gagal menyimpan kasir: ' + (err instanceof Error ? err.message : String(err)))
                } finally {
                  setIsSaving(false)
                }
              }}>
                <div>
                  <label className="block text-[11px] font-bold mb-1.5" style={{ color: '#6B5448' }}>NAMA KASIR</label>
                  <input required name="name" value={cashierForm.name} onChange={e => setCashierForm(prev => ({...prev, name: e.target.value}))} placeholder="Nama lengkap..."
                    className="w-full px-4 py-2.5 rounded-xl text-[13px] outline-none transition-colors"
                    style={{ background: 'white', border: '1.5px solid #E8D7C0', color: '#2B1810' }}
                    onFocus={e => e.currentTarget.style.borderColor = '#8B4A1E'}
                    onBlur={e => e.currentTarget.style.borderColor = '#E8D7C0'} />
                </div>
                <div>
                  <label className="block text-[11px] font-bold mb-1.5 mt-3" style={{ color: '#6B5448' }}>PENUGASAN CABANG (OUTLET)</label>
                  <div className="relative">
                    <button type="button" onClick={() => setOpenDropdown(openDropdown === 'branch' ? null : 'branch')}
                      className="w-full flex items-center justify-between px-4 py-2.5 rounded-xl text-[13px] outline-none transition-colors"
                      style={{ background: 'white', border: openDropdown === 'branch' ? '1.5px solid #8B4A1E' : '1.5px solid #E8D7C0', color: '#2B1810' }}>
                      <span>{cashierForm.branchId === 'all' ? 'Semua Cabang (Global)' : (outletsList.find(o => o.id === cashierForm.branchId)?.name || 'Pilih Cabang')}</span>
                      <ChevronDown size={16} color="#6B5448" className={`transition-transform ${openDropdown === 'branch' ? 'rotate-180' : ''}`} />
                    </button>
                    {openDropdown === 'branch' && (
                      <div className="absolute top-full left-0 right-0 z-20 rounded-xl mt-1 py-1 shadow-lg overflow-hidden" style={{ background: 'white', border: '1px solid #E8D7C0' }}>
                        <button type="button" onClick={() => { setCashierForm(prev => ({...prev, branchId: 'all'})); setOpenDropdown(null) }}
                          className="w-full text-left px-4 py-2.5 text-[13px] hover:bg-neutral-50 transition-colors" style={{ color: '#2B1810' }}>
                          Semua Cabang (Global)
                        </button>
                        {outletsList.map(o => (
                          <button key={o.id} type="button" onClick={() => { setCashierForm(prev => ({...prev, branchId: o.id})); setOpenDropdown(null) }}
                            className="w-full text-left px-4 py-2.5 text-[13px] hover:bg-neutral-50 transition-colors" style={{ color: '#2B1810' }}>
                            {o.name}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
                <div>
                  <label className="block text-[11px] font-bold mb-1.5 mt-3" style={{ color: '#6B5448' }}>ROLE (PERAN)</label>
                  <div className="relative">
                    <button type="button" onClick={() => setOpenDropdown(openDropdown === 'role' ? null : 'role')}
                      className="w-full flex items-center justify-between px-4 py-2.5 rounded-xl text-[13px] outline-none transition-colors"
                      style={{ background: 'white', border: openDropdown === 'role' ? '1.5px solid #8B4A1E' : '1.5px solid #E8D7C0', color: '#2B1810' }}>
                      <span>{cashierForm.role}</span>
                      <ChevronDown size={16} color="#6B5448" className={`transition-transform ${openDropdown === 'role' ? 'rotate-180' : ''}`} />
                    </button>
                    {openDropdown === 'role' && (
                      <div className="absolute top-full left-0 right-0 z-20 rounded-xl mt-1 py-1 shadow-lg overflow-hidden" style={{ background: 'white', border: '1px solid #E8D7C0' }}>
                        {['Kasir', 'Kasir Shift Siang', 'Kasir Shift Malam', 'Supervisor'].map(r => (
                          <button key={r} type="button" onClick={() => { setCashierForm(prev => ({...prev, role: r})); setOpenDropdown(null) }}
                            className="w-full text-left px-4 py-2.5 text-[13px] hover:bg-neutral-50 transition-colors" style={{ color: '#2B1810' }}>
                            {r}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </form>
            </div>
            
            <div className="px-6 py-4 flex gap-3" style={{ borderTop: '1px solid #E8D7C0', background: 'white' }}>
              <button type="button" onClick={() => setIsCashierModalOpen(false)} disabled={isSaving} className="flex-1 py-3 rounded-xl font-bold text-[14px] disabled:opacity-50"
                style={{ background: '#F3E7CE', color: '#8B4A1E' }}>Batal</button>
              <button form="cashierForm" type="submit" disabled={isSaving} className="flex-1 py-3 rounded-xl font-bold text-[14px] text-white disabled:opacity-50 flex items-center justify-center gap-2"
                style={{ background: '#8B4A1E' }}>
                {isSaving ? 'Menyimpan...' : 'Simpan'}
              </button>
            </div>
          </div>
        </div>
      )}
    </PageShell>
  )
}
