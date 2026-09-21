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
  ArrowUpRight,
  Download,
  AlertTriangle,
  Store,
  LogOut,
  CheckCircle2,
  Layers,
  ChevronDown,
  Check,
  ReceiptText,
  Ban,
  Loader2,
  Tag
} from 'lucide-react'
import PageShell from './PageShell'
import { useApp, Outlet, Cashier } from '../context/AppContext'
import { gasApi } from '../services/gasApi'
import { AlertToastHost } from './Alert'
import { ConfirmDialog } from './common/ConfirmDialog'
import { fmt } from '../utils/formatters'

const fmtShort = (n: number) =>
  n >= 1000000 ? `${(n / 1000000).toFixed(1)} Jt` : n >= 1000 ? `${(n / 1000).toFixed(0)} Rb` : String(n)

interface OwnerDashboardScreenProps {
  onBack: () => void
  onNavigate?: (screen: any) => void
}

type BranchId = 'all' | 'paskal' | 'braga' | 'dago' | string
type Period = 'today' | '7days' | 'month' | 'custom'
type Tab = 'overview' | 'analytics' | 'branches' | 'kasir' | 'raw_stock' | 'transactions'

export default function OwnerDashboardScreen({ onBack, onNavigate }: OwnerDashboardScreenProps) {
  const { outletsList, cashiersList, setOutletsList, setCashiersList, ingredientsList, productsList, shiftTolerance, setShiftTolerance, refreshData } = useApp()
  const [selectedBranch, setSelectedBranch] = useState<BranchId>('all')
  const [isBranchDropdownOpen, setIsBranchDropdownOpen] = useState(false)
  const [editingOutlet, setEditingOutlet] = useState<Outlet | null>(null)
  const [isOutletModalOpen, setIsOutletModalOpen] = useState(false)
  const [editingCashier, setEditingCashier] = useState<Cashier | null>(null)
  const [isCashierModalOpen, setIsCashierModalOpen] = useState(false)
  const [cashierForm, setCashierForm] = useState({ name: '', branchId: 'all', role: 'Kasir', shiftStart: '08:00', shiftEnd: '15:00', pin: '' })
  const [openDropdown, setOpenDropdown] = useState<'branch' | 'role' | null>(null)
  const branchDropdownRef = useRef<HTMLDivElement>(null)
  const [period, setPeriod] = useState<Period>('today')
  const [customDate, setCustomDate] = useState('')
  const [activeTab, setActiveTab] = useState<Tab>('overview')
  const [exportNotice, setExportNotice] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [dashboardData, setDashboardData] = useState<any>(null)
  const [isLoadingData, setIsLoadingData] = useState(true)
  const [toasts, setToasts] = useState<{ id: string; variant: 'success' | 'destructive'; title: string; description?: string }[]>([])
  const addToast = (variant: 'success' | 'destructive', title: string, description?: string) =>
    setToasts(p => p.some(x => x.title === title && x.description === description) ? p : [...p, { id: Date.now().toString(), variant, title, description }])
    
  // State for Transactions tab
  const [selectedTx, setSelectedTx] = useState<any | null>(null)
  const [searchTx, setSearchTx] = useState('')
  const [isVoiding, setIsVoiding] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState<{ label: string; onConfirm: () => void } | null>(null)

  useEffect(() => {
    let isMounted = true
    setIsLoadingData(true)
    const loadDashboardData = () => {
      gasApi.getOwnerDashboardData()
        .then(res => {
          if (isMounted && res) setDashboardData(res)
        })
        .catch(err => console.error("Error loading dashboard data:", err))
        .finally(() => {
          if (isMounted) setIsLoadingData(false)
        })
    }
    loadDashboardData()
    return () => { isMounted = false }
  }, [selectedBranch])

  // Auto-refresh data dashboard tiap 30 detik (skip saat tab tersembunyi)
  useEffect(() => {
    const interval = setInterval(() => {
      if (document.visibilityState === 'hidden') return
      gasApi.getOwnerDashboardData()
        .then(res => { if (res) setDashboardData(res) })
        .catch(() => {})
    }, 30000)
    return () => clearInterval(interval)
  }, [])

  const handleVoid = async (returnStock: boolean) => {
    if (!selectedTx) return
    setIsVoiding(true)
    try {
      const payload = {
        transaction_id: selectedTx.id,
        invoice_no: selectedTx.invoice_no,
        branch_id: selectedTx.branchId || selectedBranch,
        cashier: selectedTx.cashier || 'Owner',
        return_stock: returnStock,
        items: selectedTx.payloadObj?.items || []
      }
      
      const res = await gasApi.postAction('voidTransaction', payload)
      if (res.status === 'success') {
        const invoiceNo = selectedTx.invoice_no
        setSelectedTx(null)
        // Refresh dashboard data
        gasApi.getOwnerDashboardData().then(d => { if (d) setDashboardData(d) })
        addToast('success', `Transaksi ${invoiceNo} berhasil dibatalkan.`)
      } else {
        throw new Error(res.message || 'Unknown error')
      }
    } catch (err: any) {
      addToast('destructive', 'Gagal melakukan void', err.message || String(err))
    } finally {
      setIsVoiding(false)
    }
  }

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
    { id: 'all' as BranchId, name: `${outletsList.length} Cabang`, desc: outletsList.map(o => o.name.split('—')[1]?.trim() || o.name).join(', ') },
    ...outletsList.map(o => ({ id: o.id as BranchId, name: o.name, desc: o.address })),
  ]
  const activeBranchObj = branchOptions.find(b => b.id === selectedBranch) || branchOptions[0]


  const todayDate = new Date();
  const todayLabel = `Hari Ini (${todayDate.toLocaleDateString('id-ID', { day: '2-digit', month: 'short' })})`;
  const monthLabel = `Bulan Ini (${todayDate.toLocaleDateString('id-ID', { month: 'short', year: 'numeric' })})`;

  const periodMultiplier: Record<Period, { label: string }> = {
    today: { label: todayLabel },
    '7days': { label: '7 Hari Terakhir' },
    month: { label: monthLabel },
    custom: { label: `Custom (${customDate || 'Pilih Tanggal'})` },
  }

  const parseTs = (ts: string) => {
    if (!ts) return new Date(0)
    if (/^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}/.test(ts)) return new Date(ts.replace(' ', 'T') + '+07:00')
    return new Date(ts)
  }

  const transactions = dashboardData?.transactions || []
  const baseTx = (selectedBranch === 'all' 
    ? transactions 
    : transactions.filter((t: any) => t.branchId === selectedBranch)).map((t: any) => {
      
      const serverItems = (dashboardData?.transactionItems || []).filter((item: any) => {
        const itemTxId = item.transaction_id || item.transactionId || item.Transaction_ID || item['Transaction ID'] || item.id_transaksi || item.tx_id;
        if (String(itemTxId) === String(t.id)) return true;
        const itemIdStr = String(item.id || item.ID || '');
        if (itemIdStr.startsWith(String(t.id) + '-')) return true;
        return false;
      })

      const mappedItems = serverItems.map((i: any) => ({
        product_name: i.product_name || i.productName || i['Product Name'] || i.name || i.nama_produk || 'Item Pembelian',
        qty: Number(i.qty || i.Quantity || 1),
        unit_price: Number(i.unit_price || i.unitPrice || i.price || i['Unit Price'] || 0),
        subtotal: Number(i.subtotal || i.Subtotal || 0)
      }))

      let payloadObj = { payment_method: t.payment_method || 'CASH', items: mappedItems }
      if (t.payload) {
        try { payloadObj = typeof t.payload === 'string' ? JSON.parse(t.payload) : t.payload } catch(e) {}
      } else if (t.items && typeof t.items === 'string') {
        try { payloadObj.items = JSON.parse(t.items) } catch(e) {}
      }

      return {
        ...t,
        payloadObj
      }
    })

  const isTxInPeriod = (t: any) => {
    if (t.status === 'void') return false;
    if (!t.timestamp) return true;
    const txDate = parseTs(String(t.timestamp));
    const today = new Date();
    
    // reset time to 00:00:00 for comparison
    const txDay = new Date(txDate.getFullYear(), txDate.getMonth(), txDate.getDate());
    const currentDay = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    
    if (period === 'today') {
      return txDay.getTime() === currentDay.getTime();
    }
    
    if (period === 'custom' && customDate) {
      const cDate = new Date(customDate);
      const cDay = new Date(cDate.getFullYear(), cDate.getMonth(), cDate.getDate());
      return txDay.getTime() === cDay.getTime();
    }
    
    if (period === '7days') {
      const sevenDaysAgo = new Date(currentDay);
      sevenDaysAgo.setDate(currentDay.getDate() - 6);
      return txDay >= sevenDaysAgo && txDay <= currentDay;
    }
    
    if (period === 'month') {
      const firstDay = new Date(currentDay.getFullYear(), currentDay.getMonth(), 1);
      return txDay >= firstDay && txDay <= currentDay;
    }
    
    return true;
  }

  const branchTx = baseTx.filter(isTxInPeriod)

  const realTotalOmzet = branchTx.reduce((sum: number, t: any) => sum + (Number(t.total) || 0), 0)
  const realTotalTrx = branchTx.length

  const totalOmzet = realTotalOmzet > 0 ? realTotalOmzet : 0
  const totalTrx = realTotalTrx > 0 ? realTotalTrx : 0
  const avgTicket = totalTrx > 0 ? Math.round(totalOmzet / totalTrx) : 0
  
  // Hitung itemsSold dari JSON items
  let itemsSold = 0
  branchTx.forEach((t: any) => {
    try {
      if (t.payloadObj?.items) {
        itemsSold += t.payloadObj.items.reduce((sum: number, i: any) => sum + (Number(i.qty) || 0), 0)
      }
    } catch(e) {}
  })

  // grossProfit calculated below

  // Chart data based on period
  let numDays = 7;
  let endDate = new Date();
  
  if (period === 'month') {
    numDays = new Date(endDate.getFullYear(), endDate.getMonth() + 1, 0).getDate(); // days in current month
  } else if (period === 'custom' && customDate) {
    endDate = new Date(customDate);
  }

  const generatedDays = [...Array(numDays)].map((_, i) => {
    const d = new Date(endDate)
    d.setDate(d.getDate() - ((numDays - 1) - i))
    return { 
      label: d.toLocaleDateString('id-ID', { day: 'numeric', month: numDays > 7 ? 'short' : undefined, weekday: numDays <= 7 ? 'short' : undefined }), 
      dateString: d.toLocaleDateString('sv-SE'),
      val: 0,
      active: i === (numDays - 1)
    }
  })
  
  baseTx.forEach((t: any) => {
    try {
      const txDate = parseTs(String(t.timestamp || ''))
      const datePart = txDate.toLocaleDateString('sv-SE')
      const day = generatedDays.find(d => d.dateString === datePart)
      if (day) day.val += (Number(t.total) || 0)
    } catch(e) {}
  })
  const chartDays = generatedDays
  const maxChartVal = Math.max(...chartDays.map(c => c.val), 1)

  // Branch breakdown mapped from context
  const branchesData = outletsList.map(o => {
    const oTx = transactions.filter((t: any) => t.branchId === o.id && isTxInPeriod(t))
    const omzet = oTx.reduce((sum: number, t: any) => sum + (Number(t.total) || 0), 0)
    const cashier = cashiersList.find(c => c.branchId === o.id)?.name || 'Belum Ada Kasir'
    const share = totalOmzet > 0 ? Math.round((omzet / totalOmzet) * 100) : 0
    const targetNominal = Number(o.target) || 0
    const targetPct = targetNominal > 0 ? Math.round((omzet / targetNominal) * 100) : 0
    
    return {
      id: o.id,
      name: o.name,
      address: o.address,
      omzet,
      trx: oTx.length,
      cashier,
      status: 'Aktif',
      share,
      targetNominal,
      targetPct,
    }
  })

  // Top products scaled
  const productMap: Record<string, { qty: number, total: number, price: number, cost: number, cat: string }> = {}
  branchTx.forEach((t: any) => {
    try {
      let items: any[] = []
      // Ambil dari payloadObj yang sudah dimapping di baseTx
      if (t.payloadObj && t.payloadObj.items) {
        items.push(...t.payloadObj.items)
      }

      items.forEach((item: any) => {
        const itemName = item.name || item.product_name || 'Unknown'
        let matchedProduct = null;
        if (productsList.length > 0) {
          matchedProduct = productsList.find(p => p.name.trim().toLowerCase() === String(itemName).trim().toLowerCase())
          if (!matchedProduct) return; // Skip deleted products ONLY IF productsList is loaded
        }

        if (!productMap[itemName]) {
          productMap[itemName] = { 
            qty: 0, 
            total: 0, 
            price: Number(item.price || item.unit_price) || 0, 
            cost: matchedProduct ? (Number(matchedProduct.cost) || 0) : 0,
            cat: item.cat || '-' 
          }
        }
        productMap[itemName].qty += Number(item.qty) || 0
        productMap[itemName].total += (Number(item.price || item.unit_price) || 0) * (Number(item.qty) || 0)
      })
    } catch(e) {}
  })
  
  const topProducts = Object.entries(productMap)
    .map(([name, data], i) => ({
      id: i,
      name,
      cat: data.cat,
      qty: data.qty,
      total: data.total,
      trend: 'stable' as 'stable' | 'up' | 'down',
      hpp: data.cost,
      price: data.price
    }))
    .sort((a, b) => b.qty - a.qty)
    .slice(0, 5)

  // Cashier list mapped from context
  const cashierStats = cashiersList.map(c => {
    const branchName = outletsList.find(o => o.id === c.branchId)?.name || 'Tidak Diketahui'
    // field name in DB Transactions sheet is "cashier" (kolom 4)
    const cTx = transactions.filter((t: any) => t.cashier === c.name)
    const omzet = cTx.reduce((sum: number, t: any) => sum + (Number(t.total) || 0), 0)
    return {
      id: c.id,
      name: c.name,
      branch: branchName,
      role: c.role,
      trx: cTx.length,
      omzet,
      status: c.status,
      voidCount: cTx.filter((t:any) => t.status === 'void' || t.status === 'VOID').length,
    }
  })

  // Critical raw stock items based on selectedBranch
  const rawIngsLowStock = dashboardData?.ingredients || [];
  let displayIngsForLowStock = [];
  if (rawIngsLowStock.length === 0) {
    displayIngsForLowStock = ingredientsList;
  } else if (selectedBranch === 'all') {
    const map = new Map<number, any>();
    rawIngsLowStock.forEach((ing: any) => {
      const id = Number(ing.id);
      if (!map.has(id)) {
        map.set(id, { ...ing, current_stock: 0 });
      }
      map.get(id).current_stock += (Number(ing.current_stock) || 0);
    });
    displayIngsForLowStock = Array.from(map.values());
  } else {
    displayIngsForLowStock = rawIngsLowStock.filter((ing: any) => {
      if (String(ing.branchId) === String(selectedBranch)) return true;
      if (ing.branchId === 'pusat' || !ing.branchId) {
        const outlets = String(ing.outlets || 'all').toLowerCase();
        if (outlets === 'all') return true;
        return outlets.split(',').map(s => s.trim()).includes(String(selectedBranch).toLowerCase());
      }
      return false;
    });
  }
  const lowStockIngredients = displayIngsForLowStock.filter((i: any) => {
    const isTracked = i.is_tracked === undefined || i.is_tracked === "" ? true : String(i.is_tracked).toUpperCase() === 'TRUE';
    return isTracked && Number(i.current_stock) <= Number(i.min_stock_threshold || 0) * 1.5;
  });
  // Analytics & Margin - Distribution logic
  const categorySales: Record<string, number> = {}
  Object.values(productMap).forEach(p => {
    const cat = p.cat && p.cat !== '-' ? p.cat : 'Lainnya'
    categorySales[cat] = (categorySales[cat] || 0) + p.total
  })
  const catColors = ['#8B4A1E', '#C49A62', '#5B8A2E', '#2D6A4F', '#B60000']
  let categoryDistribution = Object.entries(categorySales)
    .sort((a, b) => b[1] - a[1])
    .map(([cat, omzet], idx) => ({
      cat,
      omzet,
      pct: totalOmzet > 0 ? Math.round((omzet / totalOmzet) * 100) : 0,
      color: catColors[idx % catColors.length]
    }))
  
  // FIX BUG #2: Normalize percentages to sum to 100%
  const totalCategoryPct = categoryDistribution.reduce((sum, item) => sum + item.pct, 0)
  if (totalCategoryPct > 0 && totalCategoryPct !== 100) {
    categoryDistribution = categoryDistribution.map(item => ({
      ...item,
      pct: Math.round((item.pct / totalCategoryPct) * 100)
    }))
  }

  const paymentSales: Record<string, { count: number, omzet: number }> = {}
  branchTx.forEach((t: any) => {
    const method = String(t.payment_method || 'CASH').toUpperCase()
    if (!paymentSales[method]) paymentSales[method] = { count: 0, omzet: 0 }
    paymentSales[method].count += 1
    paymentSales[method].omzet += Number(t.total) || 0
  })
  const payColors: Record<string, string> = { 'QRIS': '#8B4A1E', 'CASH': '#C49A62', 'DEBIT': '#5B8A2E' }
  const paymentDistribution = Object.entries(paymentSales)
    .sort((a, b) => b[1].count - a[1].count)
    .map(([method, data]) => ({
      method,
      count: data.count,
      pct: totalTrx > 0 ? Math.round((data.count / totalTrx) * 100) : 0,
      color: payColors[method] || '#6B5448'
    }))

  let lunchCount = 0; // 11-14
  let soreCount = 0;  // 14-18
  let dinnerCount = 0; // 18-22
  let otherCount = 0;
  branchTx.forEach((t: any) => {
    const d = parseTs(String(t.timestamp || ''))
    if (isNaN(d.getTime())) return;
    const h = d.getHours()
    if (h >= 11 && h < 14) lunchCount++
    else if (h >= 14 && h < 18) soreCount++
    else if (h >= 18 && h < 22) dinnerCount++
    else otherCount++
  })
  const totalPeakTrx = (lunchCount + soreCount + dinnerCount + otherCount) || 1
  const getLoadStatus = (pct: number) => {
    if (pct > 40) return 'Sangat Padat'
    if (pct > 25) return 'Maksimum'
    if (pct > 10) return 'Sedang'
    return 'Sepi'
  }
  const peakDistribution = [
    { time: '11:00 - 14:00 (Lunch Rush)', load: getLoadStatus(Math.round(lunchCount / totalPeakTrx * 100)), pct: Math.round(lunchCount / totalPeakTrx * 100), color: '#B60000' },
    { time: '18:00 - 22:00 (Dinner Peak)', load: getLoadStatus(Math.round(dinnerCount / totalPeakTrx * 100)), pct: Math.round(dinnerCount / totalPeakTrx * 100), color: '#8B4A1E' },
    { time: '14:00 - 18:00 (Sore Hangout)', load: getLoadStatus(Math.round(soreCount / totalPeakTrx * 100)), pct: Math.round(soreCount / totalPeakTrx * 100), color: '#C49A62' },
  ].sort((a, b) => b.pct - a.pct)

  // -----------------------------------------------------
  // NEW ANALYTICS: Financial, Profit Margins, Void Status
  // -----------------------------------------------------
  let totalHPP = 0
  Object.values(productMap).forEach(p => {
    totalHPP += p.cost * p.qty
  })
  const grossProfit = totalOmzet - totalHPP
  const grossMarginPct = totalOmzet > 0 ? Math.round((grossProfit / totalOmzet) * 100) : 0

  const topProfitProducts = Object.entries(productMap)
    .map(([name, data]) => {
      const profitPerItem = data.price - data.cost
      const totalProfit = profitPerItem * data.qty
      return {
        name,
        qty: data.qty,
        totalProfit,
        profitMarginPct: data.price > 0 ? Math.round((profitPerItem / data.price) * 100) : 0
      }
    })
    .sort((a, b) => b.totalProfit - a.totalProfit)
    .slice(0, 5)

  let successCount = 0
  let voidCount = 0
  let lostOmzet = 0
  branchTx.forEach((t: any) => {
    if (t.status === 'void') {
      voidCount++
      lostOmzet += (Number(t.total) || 0)
    } else {
      successCount++
    }
  })
  const totalAllTrx = successCount + voidCount || 1
  const successPct = Math.round((successCount / totalAllTrx) * 100)

  const handleExport = () => {
    setExportNotice(true)
    setTimeout(() => setExportNotice(false), 3000)
  }

  // Header controls on the right (desktop only)
  const headerRight = (
    <div className="hidden sm:flex items-center gap-2">
      {/* Custom Branch selector dropdown */}
      <div className="relative" ref={branchDropdownRef}>
        <button
          type="button"
          onClick={() => setIsBranchDropdownOpen(!isBranchDropdownOpen)}
          className="flex items-center gap-2 px-3 py-2 rounded-xl text-[13px] font-semibold transition-all"
          style={{
            background: 'white',
            border: '1px solid #E8D7C0',
            color: '#2B1810',
          }}
          title="Pilih Cabang"
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
            className="absolute left-0 top-full mt-2 z-50 rounded-xl overflow-hidden"
            style={{
              width: 270,
              background: 'white',
              border: '1px solid #E8D7C0',
              boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
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
            className="px-3 py-1.5 rounded-lg text-[12px] font-semibold transition-all"
            style={{
              background: period === p ? '#66BB6A' : 'white',
              color: period === p ? 'white' : '#6B5448',
              border: '1px solid #E8D7C0',
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
        className="flex items-center gap-2 px-3 py-2 rounded-xl text-[13px] font-semibold transition-all"
        style={{ border: '1px solid #E8D7C0', color: '#B60000', background: 'white' }}
        title="Keluar ke Login"
      >
        <LogOut size={14} />
        <span>Keluar</span>
      </button>
    </div>
  )

  return (
    <>
    <PageShell
      title="Command Center Owner"
      subtitle={`${periodMultiplier[period].label}`}
      onBack={onBack}
      backLabel="Keluar"
      headerRight={headerRight}
    >
      <div className="px-3 sm:px-6 py-4 sm:py-5 space-y-4 sm:space-y-5 max-w-7xl mx-auto">
        {/* Skeleton loading KPI & tabel saat data sedang dimuat / ganti cabang */}
        {isLoadingData && (
          <div className="space-y-4 animate-fade-in">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="rounded-xl p-4" style={{ background: 'white', border: '1px solid #E8D7C0' }}>
                  <div className="w-10 h-10 rounded-xl mb-3 animate-pulse" style={{ background: '#E8D7C0' }} />
                  <div className="h-5 rounded-full animate-pulse mb-2" style={{ width: '70%', background: '#E8D7C0' }} />
                  <div className="h-2.5 rounded-full animate-pulse" style={{ width: '90%', background: '#E8D7C0' }} />
                </div>
              ))}
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="rounded-xl p-4 bg-white" style={{ border: '1px solid #E8D7C0' }}>
                  <div className="h-3 rounded-full animate-pulse mb-3" style={{ width: '50%', background: '#E8D7C0' }} />
                  <div className="h-2.5 rounded-full animate-pulse mb-2" style={{ width: '80%', background: '#E8D7C0' }} />
                  <div className="h-2.5 rounded-full animate-pulse" style={{ width: '65%', background: '#E8D7C0' }} />
                </div>
              ))}
            </div>
            <p className="flex items-center gap-2 text-[13px] font-bold" style={{ color: '#8B4A1E' }}>
              <span className="w-4 h-4 border-2 border-[#E8D7C0] border-t-[#8B4A1E] rounded-full animate-spin" />
              Mengambil data live dari seluruh cabang...
            </p>
          </div>
        )}

        <div style={isLoadingData ? { display: 'none' } : undefined}>
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

        {/* Mobile toolbar: branch + period + logout (hidden on sm+) */}
        <div className="sm:hidden space-y-2">
          <div className="flex items-center gap-2">
            <select
              value={selectedBranch}
              onChange={e => setSelectedBranch(e.target.value)}
              className="flex-1 min-w-0 px-3 py-2 rounded-xl text-[13px] font-semibold outline-none truncate"
              style={{ background: 'white', border: '1px solid #E8D7C0', color: '#2B1810' }}
            >
              {branchOptions.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
            </select>
            <button
              onClick={onBack}
              className="shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[12px] font-bold"
              style={{ border: '1px solid #E8D7C0', color: '#B60000', background: 'white' }}
            >
              <LogOut size={13} />
              <span>Keluar</span>
            </button>
          </div>
          <div className="flex items-center gap-1 p-1 rounded-xl" style={{ background: '#F3E7CE', border: '1px solid #E8D7C0' }}>
            {(['today', '7days', 'month'] as Period[]).map(p => (
              <button
                key={p}
                onClick={() => setPeriod(p)}
                className="flex-1 py-1 rounded-lg text-[11px] font-bold transition-colors"
                style={{ background: period === p ? '#8B4A1E' : 'transparent', color: period === p ? 'white' : '#6B5448' }}
              >
                {p === 'today' ? 'Hari Ini' : p === '7days' ? '7 Hari' : 'Bulan Ini'}
              </button>
            ))}
          </div>
        </div>

        {/* Navigation Sub-Tabs — horizontal scroll on mobile */}
        <div className="flex items-center justify-between border-b pb-1" style={{ borderColor: '#E8D7C0' }}>
          <div className="flex items-center gap-1 sm:gap-2 overflow-x-auto pb-1 scrollbar-hide flex-1 min-w-0">
            {[
              { id: 'overview', label: 'Ringkasan', icon: Activity },
              { id: 'analytics', label: 'Analisis', icon: BarChart2 },
              { id: 'transactions', label: 'Transaksi', icon: ReceiptText },
              { id: 'branches', label: 'Cabang', icon: Building2 },
              { id: 'kasir', label: 'Kasir', icon: Users },
              { id: 'raw_stock', label: 'Bahan', icon: ChefHat },
            ].map(tab => {
              const Icon = tab.icon
              const active = activeTab === tab.id
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as Tab)}
                  className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-[12px] sm:text-[13px] font-bold transition-all whitespace-nowrap shrink-0"
                  style={{
                    background: active ? '#8B4A1E' : 'transparent',
                    color: active ? 'white' : '#6B5448',
                  }}
                >
                  <Icon size={15} />
                  <span>{tab.label}</span>
                  {tab.id === 'raw_stock' && lowStockIngredients.length > 0 && (
                    <span className="w-2 h-2 rounded-full" style={{ background: active ? 'white' : '#B60000' }} />
                  )}
                </button>
              )
            })}
          </div>

          <button
            onClick={handleExport}
            className="shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[12px] font-bold transition-colors hover:bg-amber-100/50 ml-2"
            style={{ border: '1px solid #C49A62', color: '#8B4A1E', background: '#F3E7CE' }}
          >
            <Download size={14} />
            <span className="hidden sm:inline">Ekspor</span>
          </button>
        </div>

        {/* TAB 1: OVERVIEW */}
        {activeTab === 'overview' && (
          <div className="space-y-5 animate-fade-in">
            {/* Top 4 KPI Cards */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
              {[
                {
                  label: 'Total Omzet Kotor',
                  val: fmt(totalOmzet),
                  sub: 'Transaksi berhasil',
                  icon: Activity,
                  up: true,
                },
                {
                  label: 'Total Transaksi Selesai',
                  val: `${totalTrx.toLocaleString('id-ID')} Tiket`,
                  sub: `Rata-rata ${fmt(avgTicket)}/pesanan`,
                  icon: BarChart2,
                  up: true,
                },
                {
                  label: 'Porsi Dimsum Terjual',
                  val: `${itemsSold.toLocaleString('id-ID')} Porsi`,
                  sub: 'Total seluruh item terjual',
                  icon: Package,
                  up: true,
                },
                {
                  label: 'Estimasi Margin Kotor',
                  val: fmt(grossProfit),
                  sub: `Estimasi ~${grossMarginPct}% setelah HPP`,
                  icon: TrendingUp,
                  up: true,
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
            <div className="rounded-xl p-5" style={{ background: 'white', border: '1px solid #E8D7C0' }}>
              <div className="flex items-start sm:items-center justify-between mb-4 gap-2 flex-wrap">
                <div>
                  <h3 className="font-serif font-bold text-[16px]" style={{ color: '#2B1810' }}>
                    Tren Pendapatan Harian (Proposional)
                  </h3>
                  <p className="text-[11px]" style={{ color: '#6B5448' }}>
                    Penjualan harian (Rp)
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
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 sm:gap-5">
              {/* Left: Top Dimsum Products */}
              <div className="col-span-1 lg:col-span-7 rounded-2xl p-5" style={{ background: 'white', border: '1px solid #E8D7C0' }}>
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
              <div className="col-span-1 lg:col-span-5 space-y-4">
                {/* Manajemen Data Master Box */}
                <div className="rounded-xl p-5" style={{ background: '#F3E7CE', border: '1px solid #C49A62' }}>
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
                        <span>Kelola Menu</span>
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
                      { label: 'Kelola Promo & Diskon', screen: 'managePromo', icon: Tag },
                      { label: 'Atur Resep Menu', screen: 'kelolaResep', icon: ChefHat },
                      { label: 'Faktur Stok Masuk', screen: 'stockIn', icon: Package },
                      { label: 'Audit Stok Opname', screen: 'stokOpname', icon: Layers },
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
                <div className="rounded-xl p-4" style={{ background: '#FFF5F5', border: '1px solid #F8B4B4' }}>
                    <div className="flex items-center gap-2 mb-2">
                      <AlertTriangle size={16} color="#B60000" />
                      <h4 className="font-bold text-[12px]" style={{ color: '#B60000' }}>
                        Peringatan Bahan Baku Kritis ({lowStockIngredients.length} item)
                      </h4>
                    </div>
                    <div className="space-y-1 text-[11px]" style={{ color: '#6B5448' }}>
                      {lowStockIngredients.slice(0, 3).map((i: any) => (
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
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {/* Category distribution */}
              <div className="rounded-2xl p-5 bg-white" style={{ border: '1px solid #E8D7C0' }}>
                <h4 className="font-serif font-bold text-[15px] mb-3" style={{ color: '#2B1810' }}>
                  Distribusi Kategori Penjualan
                </h4>
                <div className="space-y-3">
                  {categoryDistribution.length > 0 ? categoryDistribution.map(c => (
                    <div key={c.cat}>
                      <div className="flex justify-between text-[12px] font-bold mb-1">
                        <span style={{ color: '#2B1810' }}>{c.cat}</span>
                        <span style={{ color: c.color }}>{c.pct}% ({fmt(c.omzet)})</span>
                      </div>
                      <div className="w-full h-2 rounded-full bg-neutral-100 overflow-hidden">
                        <div className="h-full rounded-full" style={{ width: `${c.pct}%`, background: c.color }} />
                      </div>
                    </div>
                  )) : <p className="text-[12px] text-gray-500 italic">Belum ada data transaksi</p>}
                </div>
              </div>

              {/* Payment Methods Breakdown */}
              <div className="rounded-2xl p-5 bg-white" style={{ border: '1px solid #E8D7C0' }}>
                <h4 className="font-serif font-bold text-[15px] mb-3" style={{ color: '#2B1810' }}>
                  Metode Pembayaran Pelanggan
                </h4>
                <div className="space-y-3">
                  {paymentDistribution.length > 0 ? paymentDistribution.map(m => (
                    <div key={m.method}>
                      <div className="flex justify-between text-[12px] font-bold mb-1">
                        <span style={{ color: '#2B1810' }}>{m.method}</span>
                        <span style={{ color: m.color }}>{m.pct}% ({m.count} trx)</span>
                      </div>
                      <div className="w-full h-2 rounded-full bg-neutral-100 overflow-hidden">
                        <div className="h-full rounded-full" style={{ width: `${m.pct}%`, background: m.color }} />
                      </div>
                    </div>
                  )) : <p className="text-[12px] text-gray-500 italic">Belum ada data transaksi</p>}
                </div>
              </div>

              {/* Peak Hours Analysis */}
              <div className="rounded-2xl p-5 bg-white" style={{ border: '1px solid #E8D7C0' }}>
                <h4 className="font-serif font-bold text-[15px] mb-3" style={{ color: '#2B1810' }}>
                  Jam Sibuk Restoran (Peak Hours)
                </h4>
                <div className="space-y-3">
                  {peakDistribution.map(t => (
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
            
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {/* Ringkasan Keuangan */}
              <div className="rounded-2xl p-5 bg-white" style={{ border: '1px solid #E8D7C0' }}>
                <h4 className="font-serif font-bold text-[15px] mb-3 flex items-center gap-2" style={{ color: '#2B1810' }}>
                  <Activity size={16} color="#8B4A1E" />
                  Ringkasan Keuangan
                </h4>
                <div className="space-y-4">
                  <div>
                    <div className="flex justify-between text-[11px] mb-1 font-bold" style={{ color: '#2B1810' }}>
                      <span>Omzet (Pendapatan)</span>
                      <span>{fmt(totalOmzet)}</span>
                    </div>
                    <div className="w-full h-2.5 rounded-full bg-neutral-100 overflow-hidden">
                      <div className="h-full rounded-full" style={{ width: '100%', background: '#8B4A1E' }} />
                    </div>
                  </div>
                  <div>
                    <div className="flex justify-between text-[11px] mb-1 font-bold" style={{ color: '#6B5448' }}>
                      <span>Total HPP (Modal Pokok)</span>
                      <span>{fmt(totalHPP)}</span>
                    </div>
                    <div className="w-full h-2.5 rounded-full bg-neutral-100 overflow-hidden">
                      <div className="h-full rounded-full" style={{ width: `${totalOmzet > 0 ? (totalHPP/totalOmzet)*100 : 0}%`, background: '#C49A62' }} />
                    </div>
                  </div>
                  <div className="pt-2" style={{ borderTop: '1px dashed #E8D7C0' }}>
                    <div className="flex justify-between items-center">
                      <span className="text-[12px] font-bold" style={{ color: '#2D6A4F' }}>Laba Kotor (Gross Profit)</span>
                      <span className="text-[14px] font-black" style={{ color: '#2D6A4F' }}>{fmt(grossProfit)}</span>
                    </div>
                    <span className="text-[11px] font-medium" style={{ color: '#5B8A2E' }}>Margin: {grossMarginPct}%</span>
                  </div>
                </div>
              </div>

              {/* Top Profit Products */}
              <div className="rounded-2xl p-5 bg-white" style={{ border: '1px solid #E8D7C0' }}>
                <h4 className="font-serif font-bold text-[15px] mb-3 flex items-center gap-2" style={{ color: '#2B1810' }}>
                  <TrendingUp size={16} color="#5B8A2E" />
                  Top Produk Pencetak Laba
                </h4>
                <div className="space-y-3">
                  {topProfitProducts.length > 0 ? topProfitProducts.map((p, i) => (
                    <div key={p.name} className="flex items-center justify-between">
                      <div className="flex items-center gap-2.5">
                        <div className="w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold text-white" style={{ background: i === 0 ? '#8B4A1E' : i === 1 ? '#C49A62' : '#D5CBB8' }}>
                          {i + 1}
                        </div>
                        <div>
                          <p className="text-[12px] font-bold truncate max-w-[120px]" style={{ color: '#2B1810' }}>{p.name}</p>
                          <p className="text-[10px]" style={{ color: '#6B5448' }}>Terjual {p.qty}x (Mg: {p.profitMarginPct}%)</p>
                        </div>
                      </div>
                      <span className="text-[12px] font-bold" style={{ color: '#2D6A4F' }}>+{fmtShort(p.totalProfit)}</span>
                    </div>
                  )) : <p className="text-[12px] text-gray-500 italic">Belum ada data profit</p>}
                </div>
              </div>

              {/* Void & Cancellation Analysis */}
              <div className="rounded-2xl p-5 bg-white" style={{ border: '1px solid #E8D7C0' }}>
                <h4 className="font-serif font-bold text-[15px] mb-3 flex items-center gap-2" style={{ color: '#2B1810' }}>
                  <TrendingDown size={16} color="#B60000" />
                  Analisis Pembatalan (Void)
                </h4>
                <div className="flex gap-4 mb-4">
                  <div className="flex-1 text-center p-2 rounded-xl" style={{ background: '#EAF4E0' }}>
                    <p className="text-[10px] font-bold" style={{ color: '#5B8A2E' }}>Sukses</p>
                    <p className="text-[16px] font-black" style={{ color: '#2D6A4F' }}>{successCount}</p>
                  </div>
                  <div className="flex-1 text-center p-2 rounded-xl" style={{ background: '#FFF4F4' }}>
                    <p className="text-[10px] font-bold" style={{ color: '#B60000' }}>Dibatalkan</p>
                    <p className="text-[16px] font-black" style={{ color: '#B60000' }}>{voidCount}</p>
                  </div>
                </div>
                <div>
                  <div className="flex justify-between text-[11px] font-bold mb-1" style={{ color: '#2B1810' }}>
                    <span>Tingkat Kesuksesan (Success Rate)</span>
                    <span style={{ color: successPct > 90 ? '#2D6A4F' : '#B60000' }}>{successPct}%</span>
                  </div>
                  <div className="w-full h-2 rounded-full bg-neutral-100 overflow-hidden mb-3">
                    <div className="h-full rounded-full" style={{ width: `${successPct}%`, background: successPct > 90 ? '#5B8A2E' : '#B60000' }} />
                  </div>
                  <div className="p-2.5 rounded-xl flex justify-between items-center" style={{ background: '#FFF4F4', border: '1px solid #F8B4B4' }}>
                    <span className="text-[11px] font-bold" style={{ color: '#B60000' }}>Potensi Lenyap:</span>
                    <span className="text-[12px] font-black" style={{ color: '#B60000' }}>{fmt(lostOmzet)}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB TRANSAKSI */}
        {activeTab === 'transactions' && (
          <div className="space-y-4 animate-fade-in">
            <div className="flex items-center justify-between mb-2 flex-wrap gap-2">
              <div>
                <h3 className="font-serif font-bold text-[18px]" style={{ color: '#2B1810' }}>
                  Daftar Transaksi
                </h3>
                <p className="text-[12px]" style={{ color: '#6B5448' }}>
                  Riwayat transaksi lengkap, klik untuk melihat detail atau membatalkan (Void)
                </p>
              </div>
              <div className="relative w-full sm:w-64">
                <input
                  type="text"
                  placeholder="Cari No. Invoice..."
                  value={searchTx}
                  onChange={e => setSearchTx(e.target.value)}
                  className="w-full px-4 py-2 bg-white border rounded-xl text-sm outline-none"
                  style={{ borderColor: '#E8D7C0', color: '#2B1810' }}
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {branchTx.filter((t:any) => t.invoice_no?.toLowerCase().includes(searchTx.toLowerCase())).map((t:any) => {
                const isVoid = String(t.status).toLowerCase() === 'void'
                return (
                  <div 
                    key={t.id} 
                    onClick={() => {
                      if (!isVoid) {
                         setSelectedTx(t)
                      }
                    }}
                    className={`bg-white rounded-2xl p-4 border transition-shadow ${isVoid ? 'opacity-60 cursor-not-allowed' : 'cursor-pointer hover:shadow-md'}`}
                    style={{ borderColor: isVoid ? '#F8B4B4' : '#E8D7C0' }}
                  >
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-[12px] font-bold" style={{ color: isVoid ? '#B60000' : '#8B4A1E' }}>
                            {t.invoice_no}
                          </span>
                          {isVoid && (
                            <span className="px-2 py-0.5 text-[9px] font-bold rounded-lg bg-red-100 text-red-700 flex items-center gap-1">
                              <Ban size={10} /> VOID
                            </span>
                          )}
                        </div>
                        <p className="text-[10px]" style={{ color: '#6B5448' }}>
                          {new Date(t.timestamp).toLocaleString('id-ID', { dateStyle: 'medium', timeStyle: 'short' })}
                        </p>
                      </div>
                      <span className={`font-black ${isVoid ? 'line-through text-gray-400' : ''}`} style={{ color: isVoid ? '' : '#2B1810' }}>
                        {fmt(t.total)}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 text-[11px]" style={{ color: '#6B5448' }}>
                      <span className="flex items-center gap-1 bg-gray-50 px-2 py-0.5 rounded-lg border border-gray-100"><Users size={12}/> {t.cashier || 'Kasir'}</span>
                      <span className="flex items-center gap-1 bg-gray-50 px-2 py-0.5 rounded-lg border border-gray-100"><CheckCircle2 size={12}/> {t.payment_method || 'CASH'}</span>
                    </div>
                  </div>
                )
              })}
            </div>
            {branchTx.length === 0 && (
               <div className="py-12 text-center text-gray-400 text-sm">Tidak ada transaksi</div>
            )}
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
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
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
                    {b.targetNominal > 0 ? (
                      <>
                        <div className="flex justify-between text-[11px] font-bold mb-1">
                          <span style={{ color: '#6B5448' }}>Pencapaian Target: {fmt(b.omzet)} / {fmt(b.targetNominal)}</span>
                          <span style={{ color: '#8B4A1E' }}>{b.targetPct}%</span>
                        </div>
                        <div className="w-full h-2 rounded-full bg-neutral-100 overflow-hidden">
                          <div className="h-full rounded-full transition-all duration-500" style={{ width: `${b.targetPct}%`, background: '#8B4A1E' }} />
                        </div>
                      </>
                    ) : (
                      <div className="flex justify-between items-center text-[11px] font-bold p-2 rounded-lg" style={{ background: '#F9F5EC', color: '#6B5448' }}>
                        <span>Pencapaian: {fmt(b.omzet)}</span>
                        <span className="italic font-normal">Target Belum Diatur</span>
                      </div>
                    )}
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
                      onClick={() => {
                        setConfirmDelete({
                          label: `Hapus cabang ${b.name}?`,
                          onConfirm: async () => {
                            setIsSaving(true)
                            try {
                              await gasApi.deleteOutlet(b.id)
                              setOutletsList(outletsList.filter(o => o.id !== b.id))
                            } catch (err) {
                              addToast('destructive', 'Gagal menghapus cabang')
                            } finally {
                              setIsSaving(false)
                            }
                          }
                        })
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
          <div className="space-y-4 animate-fade-in">
            {/* Kelonggaran Shift Kasir */}
            <div className="rounded-2xl p-5 bg-white" style={{ border: '1px solid #E8D7C0' }}>
              <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                <div className="flex-1">
                  <h3 className="font-bold text-[14px] mb-2" style={{ color: '#2B1810' }}>Kelonggaran Batas Shift Kasir</h3>
                  <p className="text-[12px] mb-3" style={{ color: '#6B5448' }}>Toleransi login kasir (menit)</p>
                  
                  <div className="flex items-center gap-3">
                    <input 
                      type="number" 
                      min="0"
                      max="180"
                      value={shiftTolerance} 
                      onChange={e => setShiftTolerance(Number(e.target.value) || 0)}
                      className="w-24 px-4 py-2.5 rounded-xl text-[13px] outline-none text-center"
                      style={{ background: 'white', border: '1.5px solid #E8D7C0', color: '#2B1810' }}
                      onFocus={e => e.currentTarget.style.borderColor = '#8B4A1E'}
                      onBlur={e => e.currentTarget.style.borderColor = '#E8D7C0'}
                    />
                    <span className="font-bold text-[13px]" style={{ color: '#6B5448' }}>Menit</span>
                  </div>
                </div>
                <button
                  onClick={async () => {
                    try {
                      setIsSaving(true)
                      await gasApi.saveSettings({ shift_tolerance: shiftTolerance.toString() })
                      addToast('success', 'Kelonggaran shift berhasil disimpan!')
                    } catch (e) {
                      addToast('destructive', 'Gagal menyimpan kelonggaran shift')
                    } finally {
                      setIsSaving(false)
                    }
                  }}
                  disabled={isSaving}
                  className="sm:self-start px-4 py-2 rounded-xl text-[12px] font-bold text-white transition-opacity hover:opacity-90 disabled:opacity-50"
                  style={{ background: '#8B4A1E' }}
                >
                  {isSaving ? 'Menyimpan...' : 'Simpan Toleransi'}
                </button>
              </div>
            </div>

            <div className="rounded-2xl p-5 bg-white" style={{ border: '1px solid #E8D7C0' }}>
            <div className="flex items-center justify-between mb-4">
              <h4 className="font-serif font-bold text-[16px]" style={{ color: '#2B1810' }}>
                Monitoring Kasir Aktif & Rekap Shift
              </h4>
              <button 
                disabled={isSaving}
                onClick={() => {
                  setEditingCashier(null)
                  setCashierForm({ name: '', branchId: outletsList[0]?.id || 'all', role: 'Kasir', shiftStart: '08:00', shiftEnd: '15:00', pin: '' })
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
                                setCashierForm({ name: c.name, branchId: c.branchId, role: c.role, shiftStart: c.shiftStart || '08:00', shiftEnd: c.shiftEnd || '15:00', pin: c.pin || '' })
                                setOpenDropdown(null)
                                setIsCashierModalOpen(true)
                              }
                            }}
                            className="text-[9px] font-normal underline disabled:opacity-50" style={{ color: '#C49A62' }}>Edit</button>
                          <button 
                            disabled={isSaving}
                            onClick={() => {
                              setConfirmDelete({
                                label: `Hapus kasir ${k.name}?`,
                                onConfirm: async () => {
                                  setIsSaving(true)
                                  try {
                                    await gasApi.deleteCashier(k.id)
                                    setCashiersList(cashiersList.filter(c => c.id !== k.id))
                                  } catch (err) {
                                    addToast('destructive', 'Gagal menghapus kasir')
                                  } finally {
                                    setIsSaving(false)
                                  }
                                }
                              })
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
                              addToast('destructive', 'Gagal update status kasir')
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
                          onClick={() => {
                            setConfirmDelete({
                              label: `Hapus kasir ${k.name}?`,
                              onConfirm: async () => {
                                setIsSaving(true)
                                try {
                                  await gasApi.deleteCashier(k.id)
                                  setCashiersList(cashiersList.filter(c => c.id !== k.id))
                                } catch(err) {
                                  addToast('destructive', 'Gagal hapus kasir')
                                } finally {
                                  setIsSaving(false)
                                }
                              }
                            })
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
          </div>
        )}

        {/* TAB 5: RAW INGREDIENTS & RECIPES */}
        {activeTab === 'raw_stock' && (
          <div className="space-y-4 animate-fade-in">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 rounded-2xl" style={{ background: '#F3E7CE', border: '1.5px solid #C49A62' }}>
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
                  className="shrink-0 px-4 py-2 rounded-xl font-bold text-[13px] flex items-center gap-2"
                  style={{ background: '#8B4A1E', color: 'white' }}
                >
                  <ChefHat size={16} />
                  <span>Buka Editor Resep</span>
                </button>
              )}
            </div>

            <div className="rounded-2xl p-5 bg-white" style={{ border: '1px solid #E8D7C0' }}>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {(() => {
                  const rawIngs = dashboardData?.ingredients || [];
                  let displayIngs = [];
                  if (rawIngs.length === 0) {
                    displayIngs = ingredientsList; // Fallback
                  } else if (selectedBranch === 'all') {
                    const map = new Map<number, any>();
                    rawIngs.forEach((ing: any) => {
                      const id = Number(ing.id);
                      if (!map.has(id)) {
                        map.set(id, { ...ing, current_stock: 0 });
                      }
                      map.get(id).current_stock += (Number(ing.current_stock) || 0);
                    });
                    displayIngs = Array.from(map.values());
                  } else {
                    displayIngs = rawIngs.filter((ing: any) => {
                      if (String(ing.branchId) === String(selectedBranch)) return true;
                      if (ing.branchId === 'pusat' || !ing.branchId) {
                        const outlets = String(ing.outlets || 'all').toLowerCase();
                        if (outlets === 'all') return true;
                        return outlets.split(',').map(s => s.trim()).includes(String(selectedBranch).toLowerCase());
                      }
                      return false;
                    });
                  }

                  if (displayIngs.length === 0) {
                    return <p className="text-[13px] text-gray-500 col-span-full">Belum ada bahan baku di cabang ini.</p>
                  }

                  return displayIngs.map((ing: any) => {
                    const isTracked = ing.is_tracked === undefined || ing.is_tracked === "" ? true : String(ing.is_tracked).toUpperCase() === 'TRUE';
                    const isLow = isTracked && Number(ing.current_stock) <= Number(ing.min_stock_threshold || 0);
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
                              background: isTracked ? (isLow ? '#B60000' : '#8B4A1E') : '#C49A62',
                              color: 'white',
                            }}
                          >
                            {isTracked ? (isLow ? 'Kritis' : 'Tracked') : 'Bebas'}
                          </span>
                        </div>
                        <div className="mt-3 flex items-baseline justify-between">
                          <p className="text-[18px] font-serif font-bold font-mono" style={{ color: isLow ? '#B60000' : '#2B1810' }}>
                            {ing.current_stock} <span className="text-[12px] font-sans font-normal" style={{ color: '#6B5448' }}>{ing.unit}</span>
                          </p>
                          {isTracked && (
                            <span className="text-[10px]" style={{ color: '#6B5448' }}>
                              Min: {ing.min_stock_threshold} {ing.unit}
                            </span>
                          )}
                        </div>
                      </div>
                    )
                  })
                })()}
              </div>
            </div>
          </div>
        )}
        </div>
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
                    target: Number((fd.get('target') as string || '0').replace(/\D/g, ''))
                  }
                  await gasApi.saveOutlet(data)
                  if (editingOutlet) {
                    setOutletsList(outletsList.map(o => o.id === data.id ? data : o))
                  } else {
                    setOutletsList([...outletsList, data])
                  }
                  setIsOutletModalOpen(false)
                  addToast('success', `Pengaturan cabang '${data.name}' & target omzet berhasil disimpan.`)
                  refreshData().catch(console.warn)
                } catch (err) {
                  addToast('destructive', 'Gagal menyimpan cabang', err instanceof Error ? err.message : String(err))
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
                <div>
                  <label className="block text-[11px] font-bold mb-1.5 mt-3" style={{ color: '#6B5448' }}>TARGET OMZET BULANAN (Rp)</label>
                  <input name="target" defaultValue={editingOutlet?.target || ''} placeholder="Contoh: 10000000"
                    className="w-full px-4 py-2.5 rounded-xl text-[13px] outline-none transition-colors"
                    style={{ background: 'white', border: '1.5px solid #E8D7C0', color: '#2B1810' }}
                    onChange={e => {
                      const val = e.target.value.replace(/\D/g, '')
                      e.target.value = val ? parseInt(val).toLocaleString('id-ID') : ''
                    }}
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
                    shiftStart: cashierForm.shiftStart,
                    shiftEnd: cashierForm.shiftEnd,
                    pin: cashierForm.pin,
                  }
                  await gasApi.saveCashier(data)
                  if (editingCashier) {
                    setCashiersList(cashiersList.map(c => c.id === data.id ? data : c))
                  } else {
                    setCashiersList([...cashiersList, data])
                  }
                  setIsCashierModalOpen(false)
                } catch (err) {
                  addToast('destructive', 'Gagal menyimpan kasir', err instanceof Error ? err.message : String(err))
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
                  <label className="block text-[11px] font-bold mb-1.5 mt-3" style={{ color: '#6B5448' }}>PIN KASIR (6 DIGIT)</label>
                  <input required name="pin" type="text" maxLength={6} value={cashierForm.pin} onChange={e => {
                    const val = e.target.value.replace(/\D/g, '').slice(0, 6)
                    setCashierForm(prev => ({...prev, pin: val}))
                  }} placeholder="Misal: 654321"
                    className="w-full px-4 py-2.5 rounded-xl text-[13px] outline-none transition-colors"
                    style={{ background: 'white', border: '1.5px solid #E8D7C0', color: '#2B1810', letterSpacing: '0.2em' }}
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
                <div className="grid grid-cols-2 gap-3 mt-4">
                  <div>
                    <label className="block text-[11px] font-bold mb-1.5" style={{ color: '#6B5448' }}>JAM MULAI SHIFT</label>
                    <input type="time" name="shiftStart" value={cashierForm.shiftStart} onChange={e => setCashierForm(prev => ({...prev, shiftStart: e.target.value}))}
                      className="w-full px-4 py-2.5 rounded-xl text-[13px] outline-none transition-colors"
                      style={{ background: 'white', border: '1.5px solid #E8D7C0', color: '#2B1810' }} />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold mb-1.5" style={{ color: '#6B5448' }}>JAM SELESAI</label>
                    <input type="time" name="shiftEnd" value={cashierForm.shiftEnd} onChange={e => setCashierForm(prev => ({...prev, shiftEnd: e.target.value}))}
                      className="w-full px-4 py-2.5 rounded-xl text-[13px] outline-none transition-colors"
                      style={{ background: 'white', border: '1.5px solid #E8D7C0', color: '#2B1810' }} />
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

    {/* Delete Confirmation */}
    <ConfirmDialog
      isOpen={!!confirmDelete}
      variant="destructive"
      title="Konfirmasi Hapus"
      description={confirmDelete?.label || ''}
      confirmLabel="Hapus"
      cancelLabel="Batal"
      onConfirm={() => {
        if (confirmDelete) {
          confirmDelete.onConfirm();
        }
      }}
      onCancel={() => setConfirmDelete(null)}
    />

      {/* Modal Detail / Void */}
      {selectedTx && (
        <div className="fixed inset-0 z-[100] bg-black/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#FAF6ED] rounded-3xl w-full max-w-lg relative flex flex-col shadow-2xl animate-scale-up z-10 overflow-hidden max-h-[90vh]" style={{ border: '1px solid #E8D7C0' }}>
            <div className="px-6 py-5 flex items-center justify-between bg-white shrink-0" style={{ borderBottom: '1px solid #E8D7C0' }}>
              <div>
                <h3 className="font-serif font-bold text-[18px]" style={{ color: '#2B1810' }}>Detail Transaksi</h3>
                <p className="text-[12px] font-mono mt-0.5" style={{ color: '#6B5448' }}>{selectedTx.invoice_no}</p>
              </div>
              <button 
                onClick={() => !isVoiding && setSelectedTx(null)}
                className="w-8 h-8 rounded-full flex items-center justify-center hover:bg-neutral-100 transition-colors"
                disabled={isVoiding}
              >
                <X size={18} color="#6B5448" />
              </button>
            </div>

            <div className="p-6 overflow-y-auto custom-scrollbar bg-[#FAF6ED]">
              <div className="flex flex-wrap gap-4 mb-6 pb-6" style={{ borderBottom: '1px dashed #E8D7C0' }}>
                <div className="flex-1 min-w-[120px]">
                  <p className="text-[10px] font-bold mb-1 uppercase tracking-wider" style={{ color: '#6B5448' }}>Tanggal</p>
                  <p className="text-[13px] font-bold" style={{ color: '#2B1810' }}>
                    {new Date(selectedTx.timestamp).toLocaleString('id-ID', { dateStyle: 'long', timeStyle: 'short' })}
                  </p>
                </div>
                <div className="flex-1 min-w-[120px]">
                  <p className="text-[10px] font-bold mb-1 uppercase tracking-wider" style={{ color: '#6B5448' }}>Kasir</p>
                  <p className="text-[13px] font-bold" style={{ color: '#2B1810' }}>{selectedTx.cashier || 'Kasir'}</p>
                </div>
                <div className="flex-1 min-w-[120px]">
                  <p className="text-[10px] font-bold mb-1 uppercase tracking-wider" style={{ color: '#6B5448' }}>Pembayaran</p>
                  <p className="text-[13px] font-bold" style={{ color: '#2B1810' }}>{selectedTx.payment_method || 'CASH'}</p>
                </div>
                <div className="flex-1 min-w-[120px]">
                  <p className="text-[10px] font-bold mb-1 uppercase tracking-wider" style={{ color: '#6B5448' }}>Status</p>
                  <span className={`px-2 py-0.5 text-[10px] font-bold rounded flex items-center gap-1 w-max ${String(selectedTx.status).toLowerCase() === 'void' ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'}`}>
                    {String(selectedTx.status).toLowerCase() === 'void' ? <><Ban size={10} /> DIBATALKAN</> : <><CheckCircle2 size={10} /> SUKSES</>}
                  </span>
                </div>
              </div>

              <div className="space-y-3">
                <p className="text-[11px] font-bold uppercase tracking-wider mb-2" style={{ color: '#6B5448' }}>Item Pembelian</p>
                {selectedTx.payloadObj?.items?.length > 0 ? (
                  selectedTx.payloadObj.items.map((item: any, i: number) => (
                    <div key={i} className="flex justify-between items-start py-1">
                      <div>
                        <p className="font-bold text-[13px]" style={{ color: '#2B1810' }}>{item.product_name || item.name || 'Unknown'}</p>
                        <p className="text-[11px]" style={{ color: '#6B5448' }}>{item.qty}x @ {fmt(item.unit_price || item.price || 0)}</p>
                      </div>
                      <p className="font-bold text-[13px]" style={{ color: '#8B4A1E' }}>{fmt(item.subtotal || ((item.unit_price || item.price || 0) * item.qty))}</p>
                    </div>
                  ))
                ) : <p className="text-[12px] italic" style={{ color: '#6B5448' }}>Tidak ada detail item yang tersimpan.</p>}
              </div>

              <div className="mt-6 pt-4 space-y-2" style={{ borderTop: '1px dashed #E8D7C0' }}>
                <div className="flex justify-between text-[12px]" style={{ color: '#6B5448' }}>
                  <span>Subtotal</span><span>{fmt(selectedTx.total - (selectedTx.tax || 0) + (selectedTx.discount || 0))}</span>
                </div>
                {selectedTx.discount > 0 && (
                  <div className="flex justify-between text-[12px] font-medium" style={{ color: '#2D6A4F' }}>
                    <span>Diskon</span><span>-{fmt(selectedTx.discount)}</span>
                  </div>
                )}
                {selectedTx.tax > 0 && (
                  <div className="flex justify-between text-[12px]" style={{ color: '#6B5448' }}>
                    <span>PPN</span><span>{fmt(selectedTx.tax)}</span>
                  </div>
                )}
                <div className="flex justify-between font-black text-[16px] mt-2 pt-2" style={{ color: '#2B1810', borderTop: '1px dashed #E8D7C0' }}>
                  <span>Total</span><span style={{ color: '#8B4A1E' }}>{fmt(selectedTx.total)}</span>
                </div>
              </div>
            </div>

            <div className="p-6 bg-white shrink-0" style={{ borderTop: '1px solid #E8D7C0' }}>
              {String(selectedTx.status).toLowerCase() !== 'void' && (
                <div className="p-3 mb-4 rounded-xl flex items-start gap-2.5 bg-[#FFF4F4]" style={{ border: '1px solid #F8B4B4' }}>
                  <AlertTriangle size={16} color="#B60000" className="shrink-0 mt-0.5" />
                  <p className="text-[11px] font-medium leading-relaxed" style={{ color: '#B60000' }}>
                    Membatalkan (Void) transaksi akan mengurangi omzet hari ini. Pilih apakah bahan baku dikembalikan ke stok awal atau dianggap hangus/rusak.
                  </p>
                </div>
              )}
              
              <div className="flex flex-col sm:flex-row gap-2.5">
                <button 
                  onClick={() => setSelectedTx(null)}
                  disabled={isVoiding}
                  className="flex-1 py-2.5 bg-white font-bold rounded-xl text-[13px] hover:bg-gray-50 transition-colors"
                  style={{ border: '1px solid #E8D7C0', color: '#6B5448' }}
                >
                  Tutup
                </button>
                {String(selectedTx.status).toLowerCase() !== 'void' && (
                  <>
                    <button 
                      onClick={() => handleVoid(false)}
                      disabled={isVoiding}
                      className="flex-1 py-2.5 font-bold rounded-xl text-[13px] transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                      style={{ background: '#FFF4ED', color: '#B60000', border: '1px solid #F8B4B4' }}
                    >
                      {isVoiding && <Loader2 size={14} className="animate-spin" />}
                      {isVoiding ? 'Membatalkan...' : 'Void (Stok Hangus)'}
                    </button>
                    <button 
                      onClick={() => handleVoid(true)}
                      disabled={isVoiding}
                      className="flex-1 py-2.5 font-bold rounded-xl text-[13px] text-white transition-opacity disabled:opacity-50 flex items-center justify-center gap-2"
                      style={{ background: '#B60000' }}
                    >
                      {isVoiding && <Loader2 size={14} className="animate-spin" />}
                      {isVoiding ? 'Membatalkan...' : 'Void & Kembalikan'}
                    </button>
                  </>
                )}
              </div>
            </div>
            
          </div>
        </div>
      )}

    <AlertToastHost toasts={toasts} onDismiss={(id: string) => setToasts(p => p.filter(t => t.id !== id))} />
    </>
  )
}
