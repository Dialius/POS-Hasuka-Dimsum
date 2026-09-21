import { useState, useEffect, useRef } from 'react'
import {
  Download,
  TrendingUp,
  ShoppingBag,
  Users,
  Loader2,
  RotateCw,
  Package,
  AlertTriangle,
  CheckCircle2,
  Wallet,
  Store,
  ChevronDown
} from 'lucide-react'
import PageShell from './PageShell'
import { gasApi } from '../services/gasApi'
import { useApp } from '../context/AppContext'
import { showToast } from './Alert'
import { fmt } from '../utils/formatters'

const fmtShort = (n: number) => {
  if (n <= 0) return '0'
  if (n >= 1000000) return `${(n / 1000000).toFixed(1)} Jt`
  if (n >= 1000) return `${(n / 1000).toFixed(0)} Rb`
  return String(Math.round(n))
}

const DATE_FILTERS = ['Hari Ini', 'Minggu Ini', 'Bulan Ini', 'Semua Data']

export default function ReportScreen({
  onBack,
  backLabel,
  onNavigate
}: {
  onBack: () => void
  backLabel?: string
  onNavigate?: (s: string) => void
}) {
  const { outlet, outletsList, productsList } = useApp()
  const isOwner = backLabel === 'Owner' || backLabel === 'Keluar'
  const [selectedBranch, setSelectedBranch] = useState<string>(isOwner ? 'all' : (outlet?.id || 'all'))
  const [activeFilter, setActiveFilter] = useState('Hari Ini')
  const [isLoading, setIsLoading] = useState(true)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [transactions, setTransactions] = useState<any[]>([])
  const [transactionItems, setTransactionItems] = useState<any[]>([])
  const [isBranchDropdownOpen, setIsBranchDropdownOpen] = useState(false)
  const branchDropdownRef = useRef<HTMLDivElement>(null)

  const loadData = async (showLoading = true) => {
    if (showLoading) setIsLoading(true)
    setIsRefreshing(true)
    try {
      const res = await gasApi.getBranchReportData(selectedBranch)
      if (res) {
        setTransactions(res.transactions || [])
        setTransactionItems(res.transactionItems || [])
      }
    } catch (err) {
      console.error('Error fetching report data:', err)
      showToast({
        variant: 'destructive',
        title: 'Gagal memuat laporan',
        description: 'Tidak dapat mengambil data dari database Google Sheets.'
      })
    } finally {
      setIsLoading(false)
      setIsRefreshing(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [selectedBranch])

  // Click outside listener for branch dropdown
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (branchDropdownRef.current && !branchDropdownRef.current.contains(event.target as Node)) {
        setIsBranchDropdownOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

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
      const diff = now.getTime() - tDate.getTime()
      return diff <= 7 * 24 * 60 * 60 * 1000 && diff >= 0
    } else if (activeFilter === 'Bulan Ini') {
      return tDate.getMonth() === now.getMonth() && tDate.getFullYear() === now.getFullYear()
    }
    return true // Semua Data
  })

  // Separate valid and void transactions
  const validTx: any[] = []
  const voidTx: any[] = []
  filteredTx.forEach(t => {
    if (t.status === 'void' || t.status === 'VOID') {
      voidTx.push(t)
    } else {
      validTx.push(t)
    }
  })

  const totalOmzet = validTx.reduce((sum, t) => sum + (Number(t.total) || 0), 0)
  const totalTrx = validTx.length
  const voidCount = voidTx.length
  const lostOmzet = voidTx.reduce((sum, t) => sum + (Number(t.total) || 0), 0)
  const avgTicket = totalTrx > 0 ? Math.round(totalOmzet / totalTrx) : 0

  // Calculate items sold
  let itemsSold = 0
  validTx.forEach(t => {
    try {
      let items: any[] = []
      if (transactionItems && transactionItems.length > 0) {
        const serverItems = transactionItems.filter((i: any) => String(i.transaction_id) === String(t.id))
        if (serverItems.length > 0) items.push(...serverItems)
      }
      if (items.length === 0) {
        if (t.payload) {
          const payloadObj = typeof t.payload === 'string' ? JSON.parse(t.payload) : t.payload
          if (payloadObj.items) items.push(...payloadObj.items)
        } else if (t.items) {
          const parsed = typeof t.items === 'string' ? JSON.parse(t.items) : t.items
          items.push(...parsed)
        }
      }
      itemsSold += items.reduce((sum: number, i: any) => sum + (Number(i.qty) || 0), 0)
    } catch (e) {}
  })

  // Cash vs QRIS breakdown
  let cashTotal = 0
  let qrisTotal = 0
  validTx.forEach(t => {
    const method = String(t.payment_method || '').toUpperCase()
    const amt = Number(t.total) || 0
    if (method === 'CASH' || method === 'TUNAI') {
      cashTotal += amt
    } else {
      qrisTotal += amt
    }
  })
  const cashPct = totalOmzet > 0 ? Math.round((cashTotal / totalOmzet) * 100) : 0
  const qrisPct = totalOmzet > 0 ? 100 - cashPct : 0

  // Chart Data: 7 days
  const last7Days = [...Array(7)].map((_, i) => {
    const d = new Date()
    d.setDate(d.getDate() - (6 - i))
    return {
      label: d.toLocaleDateString('id-ID', { weekday: 'short' }),
      dateString: d.toLocaleDateString('sv-SE'),
      val: 0,
      isToday: i === 6
    }
  })

  const currentChartTx = activeFilter === 'Hari Ini' ? transactions : validTx
  currentChartTx.forEach((t: any) => {
    if (t.status === 'void' || t.status === 'VOID') return
    try {
      const ts = t.timestamp || t.date
      if (!ts) return
      const tDate = parseTs(String(ts))
      const tDateStr = tDate.toLocaleDateString('sv-SE')
      const day = last7Days.find(d => d.dateString === tDateStr)
      if (day) day.val += Number(t.total) || 0
    } catch (e) {}
  })

  const rawMaxVal = Math.max(...last7Days.map(d => d.val), 0)
  const maxChartValue = rawMaxVal > 0 ? rawMaxVal : 100000

  // Top Products
  const productMap: Record<string, { qty: number; total: number }> = {}
  validTx.forEach((t: any) => {
    try {
      let items: any[] = []
      if (transactionItems && transactionItems.length > 0) {
        const serverItems = transactionItems.filter((i: any) => String(i.transaction_id) === String(t.id))
        if (serverItems.length > 0) items.push(...serverItems)
      }
      if (items.length === 0) {
        if (t.payload) {
          const payloadObj = typeof t.payload === 'string' ? JSON.parse(t.payload) : t.payload
          if (payloadObj.items) items.push(...payloadObj.items)
        } else if (t.items) {
          const parsed = typeof t.items === 'string' ? JSON.parse(t.items) : t.items
          items.push(...parsed)
        }
      }

      items.forEach((item: any) => {
        const itemName = item.name || item.product_name || 'Unknown'
        if (productsList.length > 0) {
          const matched = productsList.find(p => p.name.trim().toLowerCase() === String(itemName).trim().toLowerCase())
          if (!matched) return
        }
        if (!productMap[itemName]) productMap[itemName] = { qty: 0, total: 0 }
        productMap[itemName].qty += Number(item.qty) || 0
        productMap[itemName].total += (Number(item.price || item.unit_price) || 0) * (Number(item.qty) || 0)
      })
    } catch (e) {}
  })

  const topProducts = Object.entries(productMap)
    .map(([name, data]) => ({ name, qty: data.qty, total: data.total }))
    .sort((a, b) => b.qty - a.qty)
    .slice(0, 5)

  // Cashier Performance
  const cashierMap: Record<string, { trx: number; omzet: number }> = {}
  validTx.forEach((t: any) => {
    const cName = t.cashier || t.cashierName || 'Kasir'
    if (!cashierMap[cName]) cashierMap[cName] = { trx: 0, omzet: 0 }
    cashierMap[cName].trx += 1
    cashierMap[cName].omzet += Number(t.total) || 0
  })
  const cashierStats = Object.entries(cashierMap)
    .map(([name, data]) => ({ name, trx: data.trx, omzet: data.omzet }))
    .sort((a, b) => b.omzet - a.omzet)
    .slice(0, 5)

  // CSV Export
  const handleExportCSV = () => {
    if (validTx.length === 0) {
      showToast({ variant: 'warning', title: 'Tidak ada data transaksi untuk diekspor.' })
      return
    }

    const branchLabel = selectedBranch === 'all' ? 'Semua-Cabang' : (outletsList.find(o => o.id === selectedBranch)?.name || selectedBranch)
    const headers = ['No Invoice', 'Tanggal', 'Jam', 'Cabang', 'Kasir', 'Metode Bayar', 'Total (Rp)', 'Status']
    const rows = validTx.map(t => {
      const ts = t.timestamp ? parseTs(t.timestamp) : new Date()
      return [
        t.invoice_no || t.id,
        ts.toLocaleDateString('id-ID'),
        ts.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }),
        t.cashier || t.cashierName || 'Kasir',
        t.payment_method || 'CASH',
        Number(t.total) || 0,
        t.status || 'Success'
      ]
    })

    const csvContent =
      'data:text/csv;charset=utf-8,' +
      [headers.join(','), ...rows.map(r => r.map(c => `"${String(c).replace(/"/g, '""')}"`).join(','))].join('\n')

    const encodedUri = encodeURI(csvContent)
    const link = document.createElement('a')
    link.setAttribute('href', encodedUri)
    link.setAttribute('download', `Laporan-Hasuka-${branchLabel.replace(/\s+/g, '-')}-${activeFilter}-${Date.now()}.csv`)
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)

    showToast({ variant: 'success', title: 'File CSV Laporan berhasil diunduh!' })
  }

  const branchOptions = [
    { id: 'all', name: `Semua Cabang (${outletsList.length})` },
    ...outletsList.map(o => ({ id: o.id, name: o.name }))
  ]
  const currentBranchName = branchOptions.find(b => b.id === selectedBranch)?.name || 'Semua Cabang'

  const STAT_CARDS = [
    {
      label: 'Total Omzet Bersih',
      value: fmt(totalOmzet),
      sub: `${totalTrx} transaksi berhasil`,
      icon: TrendingUp,
      status: 'success'
    },
    {
      label: 'Rata-Rata Order (AOV)',
      value: fmt(avgTicket),
      sub: 'Nilai rata-rata keranjang',
      icon: ShoppingBag,
      status: 'neutral'
    },
    {
      label: 'Dimsum Terjual',
      value: `${itemsSold} Porsi`,
      sub: `Dari ${topProducts.length} varian menu`,
      icon: Package,
      status: 'neutral'
    },
    {
      label: 'Pembatalan (Void)',
      value: `${voidCount} Tiket`,
      sub: voidCount > 0 ? `Kerugian ${fmt(lostOmzet)}` : 'Nol transaksi batal',
      icon: voidCount > 0 ? AlertTriangle : CheckCircle2,
      status: voidCount > 0 ? 'warning' : 'success'
    }
  ]

  return (
    <PageShell
      title="Laporan Penjualan & Finansial"
      subtitle={`Ringkasan omzet & operasional • ${currentBranchName}`}
      onBack={onBack}
      backLabel={backLabel}
      onNavigate={onNavigate}
      activeNav="reports"
    >
      <div className="px-4 sm:px-6 py-4 sm:py-5 max-w-7xl mx-auto space-y-5">
        {/* Controls Bar: Branch Selector + Period Tabs + Action Buttons */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-white p-3 sm:p-4 rounded-2xl border border-[#E8D7C0] shadow-sm">
          {/* Branch Dropdown */}
          <div className="relative" ref={branchDropdownRef}>
            <button
              type="button"
              onClick={() => setIsBranchDropdownOpen(!isBranchDropdownOpen)}
              className="flex items-center gap-2 px-3 py-2 rounded-xl text-[13px] font-semibold transition-all hover:bg-neutral-50"
              style={{ background: '#FAF6ED', border: '1.5px solid #C49A62', color: '#2B1810' }}
            >
              <Store size={15} color="#8B4A1E" />
              <span className="font-bold truncate max-w-[200px]">{currentBranchName}</span>
              <ChevronDown
                size={14}
                color="#6B5448"
                className={`transition-transform duration-200 ${isBranchDropdownOpen ? 'rotate-180' : ''}`}
              />
            </button>

            {isBranchDropdownOpen && (
              <div
                className="absolute left-0 mt-1 w-64 bg-white rounded-2xl shadow-xl z-50 py-1.5 overflow-hidden border border-[#C49A6240] animate-in fade-in zoom-in-95 duration-150"
              >
                <div className="px-3 py-2 border-b border-[#E8D7C0] text-[10px] font-bold text-[#8B4A1E] uppercase tracking-wider">
                  Pilih Lingkup Laporan
                </div>
                {branchOptions.map(b => (
                  <button
                    key={b.id}
                    type="button"
                    onClick={() => {
                      setSelectedBranch(b.id)
                      setIsBranchDropdownOpen(false)
                    }}
                    className={`w-full text-left px-3.5 py-2.5 text-[12px] font-medium transition-colors flex items-center justify-between ${
                      selectedBranch === b.id ? 'bg-[#F3E7CE] font-bold text-[#8B4A1E]' : 'hover:bg-[#FAF6ED] text-[#2B1810]'
                    }`}
                  >
                    <span>{b.name}</span>
                    {selectedBranch === b.id && <span className="w-1.5 h-1.5 rounded-full bg-[#8B4A1E]" />}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Period Filter Tabs */}
          <div className="flex items-center gap-1 p-1 rounded-xl" style={{ background: '#F3E7CE', border: '1px solid #E8D7C0' }}>
            {DATE_FILTERS.map(f => (
              <button
                key={f}
                type="button"
                onClick={() => setActiveFilter(f)}
                className="flex-1 sm:flex-none px-3 py-1.5 rounded-lg text-[12px] font-bold transition-all"
                style={{
                  background: activeFilter === f ? '#8B4A1E' : 'transparent',
                  color: activeFilter === f ? 'white' : '#6B5448',
                  boxShadow: activeFilter === f ? '0 1px 4px rgba(139,74,30,0.3)' : 'none'
                }}
              >
                {f}
              </button>
            ))}
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => loadData(false)}
              disabled={isRefreshing}
              className="p-2.5 rounded-xl border border-[#E8D7C0] bg-white text-[#8B4A1E] hover:bg-[#FAF6ED] transition-colors disabled:opacity-50"
              title="Perbarui data dari Google Sheets"
            >
              <RotateCw size={15} className={isRefreshing ? 'animate-spin' : ''} />
            </button>
            <button
              type="button"
              onClick={handleExportCSV}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-[12px] font-bold text-white transition-opacity hover:opacity-90 shadow-sm"
              style={{ background: '#8B4A1E' }}
            >
              <Download size={14} />
              <span>Ekspor CSV</span>
            </button>
          </div>
        </div>

        {/* Loading Indicator */}
        {isLoading && (
          <div className="py-6 flex items-center justify-center gap-2 text-[13px] font-bold" style={{ color: '#8B4A1E' }}>
            <Loader2 className="animate-spin" size={18} />
            <span>Mengambil data transaksi dan omzet live...</span>
          </div>
        )}

        {/* Top 4 KPI Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          {STAT_CARDS.map(card => {
            const Icon = card.icon
            return (
              <div
                key={card.label}
                className="rounded-2xl p-4 sm:p-5 transition-transform hover:-translate-y-0.5"
                style={{
                  background: 'white',
                  border: '1.5px solid #E8D7C0',
                  boxShadow: '0 2px 8px rgba(43,24,16,0.04)'
                }}
              >
                <div className="flex items-center justify-between mb-3">
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: '#F3E7CE' }}>
                    <Icon size={19} color="#8B4A1E" />
                  </div>
                  {card.status === 'warning' && (
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-[#FFF5F5] text-[#B60000] border border-[#FED7D7]">
                      Perhatian
                    </span>
                  )}
                  {card.status === 'success' && (
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-[#EAF4E0] text-[#5B8A2E] border border-[#C2E0A3]">
                      Normal
                    </span>
                  )}
                </div>
                <p className="font-serif font-bold text-[20px] sm:text-[22px] leading-tight" style={{ color: '#2B1810' }}>
                  {card.value}
                </p>
                <p className="text-[12px] font-bold mt-1" style={{ color: '#6B5448' }}>
                  {card.label}
                </p>
                <p className="text-[10px] mt-0.5 truncate" style={{ color: card.status === 'warning' ? '#B60000' : '#8B4A1E' }}>
                  {card.sub}
                </p>
              </div>
            )
          })}
        </div>

        {/* Payment Ribbon (Metode Bayar) */}
        <div className="rounded-2xl p-4 bg-white border border-[#E8D7C0] shadow-sm">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-2">
            <div className="flex items-center gap-2">
              <Wallet size={16} color="#8B4A1E" />
              <h4 className="font-serif font-bold text-[14px]" style={{ color: '#2B1810' }}>
                Komposisi Penerimaan Kas ({activeFilter})
              </h4>
            </div>
            <div className="flex items-center gap-4 text-[11px] font-semibold">
              <span style={{ color: '#8B4A1E' }}>Tunai: {fmt(cashTotal)} ({cashPct}%)</span>
              <span style={{ color: '#5B8A2E' }}>QRIS / Transfer: {fmt(qrisTotal)} ({qrisPct}%)</span>
            </div>
          </div>
          <div className="w-full h-2.5 rounded-full overflow-hidden flex bg-neutral-100">
            <div style={{ width: `${cashPct}%`, background: '#8B4A1E' }} title={`Tunai: ${cashPct}%`} />
            <div style={{ width: `${qrisPct}%`, background: '#5B8A2E' }} title={`QRIS: ${qrisPct}%`} />
          </div>
        </div>

        {/* Sales Chart: Pendapatan Harian */}
        <div className="rounded-2xl p-5 bg-white border border-[#E8D7C0] shadow-sm">
          <div className="flex items-start sm:items-center justify-between mb-4 gap-2 flex-wrap">
            <div>
              <h3 className="font-serif font-bold text-[16px]" style={{ color: '#2B1810' }}>
                Tren Penjualan Harian
              </h3>
              <p className="text-[11px]" style={{ color: '#6B5448' }}>
                {activeFilter === 'Hari Ini' ? 'Perbandingan omzet 7 hari terakhir' : `Pergerakan omzet ${activeFilter}`}
              </p>
            </div>
            <div className="flex items-center gap-3 text-[11px] shrink-0">
              <div className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded" style={{ background: '#8B4A1E' }} />
                <span style={{ color: '#2B1810' }}>Puncak</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded" style={{ background: '#E8D7C0' }} />
                <span style={{ color: '#6B5448' }}>Biasa</span>
              </div>
            </div>
          </div>

          {/* Chart Bars */}
          <div className="flex items-stretch h-52 pt-4 pb-2" style={{ borderBottom: '1.5px solid #E8D7C0' }}>
            {/* Fixed Y-axis indicator */}
            <div className="flex flex-col justify-between h-full pr-3 pb-7 text-[10px] font-mono select-none shrink-0" style={{ color: '#C49A62' }}>
              <span>{fmtShort(maxChartValue)}</span>
              <span>{fmtShort(maxChartValue * 0.66)}</span>
              <span>{fmtShort(maxChartValue * 0.33)}</span>
              <span>0</span>
            </div>

            {/* Scroll-safe Bar Container */}
            <div className="flex-1 overflow-x-auto custom-scrollbar min-w-0 pb-1">
              <div className="flex items-end h-full w-full gap-3 sm:gap-4 min-w-[340px]">
                {last7Days.map(item => {
                  const pct = rawMaxVal > 0 ? Math.max(8, Math.round((item.val / maxChartValue) * 100)) : 8
                  const isTop = rawMaxVal > 0 && item.val === rawMaxVal

                  return (
                    <div key={item.label + item.dateString} className="flex-1 flex flex-col items-center h-full justify-end group relative">
                      {/* Tooltip */}
                      <div className="opacity-0 group-hover:opacity-100 transition-opacity absolute -top-8 bg-neutral-900 text-white text-[10px] font-bold px-2 py-1 rounded shadow pointer-events-none whitespace-nowrap z-20">
                        {item.label} ({item.dateString}): {fmt(item.val)}
                      </div>

                      <div
                        className="w-full rounded-t-xl transition-all duration-300 relative group-hover:brightness-95"
                        style={{
                          height: `${pct}%`,
                          background: item.val > 0 ? (isTop ? '#8B4A1E' : '#E8D7C0') : '#FAF6ED',
                          border: item.val > 0 && !isTop ? '1px solid #D5CBB8' : '1px solid #E8D7C0',
                        }}
                      >
                        {item.val > 0 && (
                          <div className="absolute -top-5 w-full text-center text-[9px] font-bold font-mono truncate" style={{ color: isTop ? '#8B4A1E' : '#6B5448' }}>
                            {fmtShort(item.val)}
                          </div>
                        )}
                      </div>

                      <span
                        className="text-[10px] font-bold mt-2 text-center select-none"
                        style={{ color: item.isToday ? '#8B4A1E' : '#6B5448' }}
                      >
                        {item.label}
                      </span>
                    </div>
                  )
                })}
              </div>
            </div>
          </div>
        </div>

        {/* Bottom 2 Balanced Columns: Top 5 Menu + Kasir Rekap */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-5">
          {/* 1. Top 5 Menu Dimsum */}
          <div className="rounded-2xl p-5 bg-white border border-[#E8D7C0] shadow-sm flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h4 className="font-serif font-bold text-[15px]" style={{ color: '#2B1810' }}>
                    Top 5 Menu Paling Laris
                  </h4>
                  <p className="text-[11px]" style={{ color: '#6B5448' }}>
                    Porsi terjual pada periode {activeFilter}
                  </p>
                </div>
                <Package size={17} color="#8B4A1E" />
              </div>

              <div className="space-y-2.5">
                {topProducts.length === 0 ? (
                  <div className="py-12 text-center" style={{ color: '#6B5448' }}>
                    <Package size={28} className="mx-auto mb-2 opacity-40" />
                    <p className="text-[13px] font-medium">Belum ada transaksi menu pada periode ini.</p>
                  </div>
                ) : (
                  <>
                    {topProducts.map((p, idx) => (
                      <div
                        key={p.name}
                        className="flex items-center justify-between p-3 rounded-xl transition-colors hover:bg-neutral-50"
                        style={{ background: '#FAF6ED', border: '1px solid #E8D7C0' }}
                      >
                        <div className="flex items-center gap-3">
                          <span
                            className="w-6 h-6 rounded-full flex items-center justify-center font-bold text-[11px]"
                            style={{
                              background: idx === 0 ? '#8B4A1E' : '#E8D7C0',
                              color: idx === 0 ? 'white' : '#2B1810'
                            }}
                          >
                            {idx + 1}
                          </span>
                          <div>
                            <p className="font-bold text-[13px]" style={{ color: '#2B1810' }}>
                              {p.name}
                            </p>
                            <p className="text-[10px] text-[#8B4A1E] font-semibold">
                              {p.qty} porsi terjual
                            </p>
                          </div>
                        </div>
                        <p className="font-bold font-mono text-[13px]" style={{ color: '#2B1810' }}>
                          {fmt(p.total)}
                        </p>
                      </div>
                    ))}
                    {Array.from({ length: Math.max(0, 5 - topProducts.length) }).map((_, i) => {
                      const slotNum = topProducts.length + i + 1
                      return (
                        <div
                          key={`empty-prod-${slotNum}`}
                          className="flex items-center justify-between p-3 rounded-xl border border-dashed border-[#E8D7C0] bg-[#FAF6ED]/30"
                        >
                          <div className="flex items-center gap-3">
                            <span
                              className="w-6 h-6 rounded-full flex items-center justify-center font-bold text-[11px]"
                              style={{ background: '#E8D7C0', color: '#6B5448' }}
                            >
                              {slotNum}
                            </span>
                            <span className="text-[12px] italic text-[#6B5448]/60">
                              Slot #{slotNum} belum terisi
                            </span>
                          </div>
                          <span className="text-[11px] font-mono text-[#6B5448]/40">—</span>
                        </div>
                      )
                    })}
                  </>
                )}
              </div>
            </div>
          </div>

          {/* 2. Performa Kasir */}
          <div className="rounded-2xl p-5 bg-white border border-[#E8D7C0] shadow-sm flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h4 className="font-serif font-bold text-[15px]" style={{ color: '#2B1810' }}>
                    Performa Staf Kasir
                  </h4>
                  <p className="text-[11px]" style={{ color: '#6B5448' }}>
                    Omzet & order ditangani ({activeFilter})
                  </p>
                </div>
                <Users size={17} color="#8B4A1E" />
              </div>

              <div className="space-y-2.5">
                {cashierStats.length === 0 ? (
                  <div className="py-12 text-center" style={{ color: '#6B5448' }}>
                    <Users size={28} className="mx-auto mb-2 opacity-40" />
                    <p className="text-[13px] font-medium">Belum ada transaksi kasir pada periode ini.</p>
                  </div>
                ) : (
                  <>
                    {cashierStats.map((k, idx) => (
                      <div
                        key={k.name}
                        className="flex items-center justify-between p-3 rounded-xl transition-colors hover:bg-neutral-50"
                        style={{ background: '#FAF6ED', border: '1px solid #E8D7C0' }}
                      >
                        <div className="flex items-center gap-3">
                          <div
                            className="w-7 h-7 rounded-full flex items-center justify-center font-bold text-[11px]"
                            style={{
                              background: idx === 0 ? '#8B4A1E' : '#F3E7CE',
                              color: idx === 0 ? 'white' : '#8B4A1E',
                              border: '1px solid #E8D7C0'
                            }}
                          >
                            {k.name.charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <p className="font-bold text-[13px]" style={{ color: '#2B1810' }}>
                              {k.name}
                            </p>
                            <p className="text-[10px] text-[#6B5448]">
                              {k.trx} order selesai
                            </p>
                          </div>
                        </div>
                        <p className="font-bold font-mono text-[13px]" style={{ color: '#8B4A1E' }}>
                          {fmt(k.omzet)}
                        </p>
                      </div>
                    ))}
                    {Array.from({ length: Math.max(0, 5 - cashierStats.length) }).map((_, i) => {
                      const slotNum = cashierStats.length + i + 1
                      return (
                        <div
                          key={`empty-cashier-${slotNum}`}
                          className="flex items-center justify-between p-3 rounded-xl border border-dashed border-[#E8D7C0] bg-[#FAF6ED]/30"
                        >
                          <div className="flex items-center gap-3">
                            <span
                              className="w-6 h-6 rounded-full flex items-center justify-center font-bold text-[11px]"
                              style={{ background: '#E8D7C0', color: '#6B5448' }}
                            >
                              {slotNum}
                            </span>
                            <span className="text-[12px] italic text-[#6B5448]/60">
                              Slot kasir #{slotNum} belum terisi
                            </span>
                          </div>
                          <span className="text-[11px] font-mono text-[#6B5448]/40">—</span>
                        </div>
                      )
                    })}
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </PageShell>
  )
}
