import type { Outlet, Cashier, Product, Ingredient } from '../context/AppContext'

// Ambang batas deteksi anomali (Flags)
export const THRESHOLDS = {
  OMZET_DELTA_ALERT: 15,       // Perubahan omzet >= 15% (naik) atau <= -15% (turun)
  HIGH_VOID_PCT: 5,            // Void >= 5% dari total transaksi
  HIGH_MANUAL_DISCOUNT_PCT: 10,// Diskon manual >= 10% omzet kotor
  PRODUCT_DEPENDENCY_PCT: 40,  // Satu produk menyumbang >= 40% omzet
  STOCK_WARNING_RATIO: 1.5,    // Stok saat ini <= 1.5x batas minimum
}

export interface AiSnapshotInput {
  dashboardData: any
  selectedBranch: string
  period: 'today' | '7days' | 'month' | 'custom'
  customDate?: string
  outletsList: Outlet[]
  cashiersList: Cashier[]
  productsList: Product[]
  ingredientsList: Ingredient[]
  shiftTolerance: number
  now?: Date
}

export interface AiFlag {
  code: string
  severity: 'info' | 'warning' | 'danger' | 'success'
  detail: string
}

export interface AiSnapshotMetrics {
  omzet: number
  transactions: number
  avgTicket: number
  itemsSold: number
  voidCount: number
  voidRate: number
  totalDiscount: number
  discountRate: number
  manualDiscount: number
  paymentMethods: Record<string, number>
  busyHours: string
}

export interface AiSnapshotData {
  empty?: boolean
  meta: {
    businessName: string
    branchLabel: string
    period: string
    dateRangeLabel: string
    comparedTo: string
    generatedAtWib: string
  }
  current: AiSnapshotMetrics
  previous: AiSnapshotMetrics | null
  delta: {
    omzet: number | null
    transactions: number | null
    avgTicket: number | null
  }
  topProducts: {
    name: string
    qty: number
    omzet: number
    qtyDeltaPct: number | null
  }[]
  slowProducts: {
    name: string
    qty: number
    omzet: number
  }[]
  branches: {
    name: string
    omzet: number
    transactions: number
    targetPct: number
    deltaPct: number | null
  }[]
  cashiers: {
    name: string
    transactions: number
    omzet: number
    voidCount: number
    avgTicket: number
  }[]
  lowStock: {
    name: string
    currentStock: number
    minStock: number
    unit: string
  }[]
  cashDifferences: {
    cashier: string
    outlet: string
    date: string
    selisih: number
  }[]
  flags: AiFlag[]
}

export type AiSnapshotResult = AiSnapshotData | { empty: true }

/**
 * Parser timestamp identik dengan OwnerDashboardScreen.tsx
 */
export function parseTs(ts: string): Date {
  if (!ts) return new Date(0)
  if (/^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}/.test(ts)) {
    return new Date(ts.replace(' ', 'T') + '+07:00')
  }
  return new Date(ts)
}

/**
 * Pengecekan transaksi void
 */
export function isVoidTx(t: any): boolean {
  return String(t.status || '').trim().toLowerCase() === 'void'
}

function round1(val: number): number {
  return Math.round(val * 10) / 10
}

/**
 * Bangun snapshot data penjualan murni tanpa efek samping
 */
export function buildAiSnapshot(input: AiSnapshotInput): AiSnapshotResult {
  const {
    dashboardData,
    selectedBranch,
    period,
    customDate,
    outletsList = [],
    cashiersList = [],
    productsList = [],
    ingredientsList = [],
    shiftTolerance = 10000,
    now = new Date()
  } = input

  const transactions: any[] = dashboardData?.transactions || []
  const serverItemsList: any[] = dashboardData?.transactionItems || []

  // 1. Pemetaan baseTx identik dengan OwnerDashboardScreen
  const rawBranchTx = selectedBranch === 'all'
    ? transactions
    : transactions.filter((t: any) => String(t.branchId) === String(selectedBranch))

  const baseTx = rawBranchTx.map((t: any) => {
    const matchedServerItems = serverItemsList.filter((item: any) => {
      const itemTxId = item.transaction_id || item.transactionId || item.Transaction_ID || item['Transaction ID'] || item.id_transaksi || item.tx_id
      if (String(itemTxId) === String(t.id)) return true
      const itemIdStr = String(item.id || item.ID || '')
      if (itemIdStr.startsWith(String(t.id) + '-')) return true
      return false
    })

    const mappedItems = matchedServerItems.map((i: any) => ({
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

  // 2. Evaluasi rentang tanggal saat ini
  const todayDay = new Date(now.getFullYear(), now.getMonth(), now.getDate())

  const isCurrentPeriod = (t: any): boolean => {
    if (!t.timestamp) return true
    const txDate = parseTs(String(t.timestamp))
    const txDay = new Date(txDate.getFullYear(), txDate.getMonth(), txDate.getDate())

    if (period === 'today') {
      return txDay.getTime() === todayDay.getTime()
    }
    if (period === 'custom' && customDate) {
      const cDate = new Date(customDate)
      const cDay = new Date(cDate.getFullYear(), cDate.getMonth(), cDate.getDate())
      return txDay.getTime() === cDay.getTime()
    }
    if (period === '7days') {
      const sevenDaysAgo = new Date(todayDay)
      sevenDaysAgo.setDate(todayDay.getDate() - 6)
      return txDay >= sevenDaysAgo && txDay <= todayDay
    }
    if (period === 'month') {
      const firstDay = new Date(todayDay.getFullYear(), todayDay.getMonth(), 1)
      const lastDay = new Date(todayDay.getFullYear(), todayDay.getMonth() + 1, 0, 23, 59, 59, 999)
      return txDay >= firstDay && txDay <= lastDay
    }
    return true
  }

  const periodAllTx = baseTx.filter(isCurrentPeriod)
  const currentActiveTx = periodAllTx.filter((t: any) => !isVoidTx(t))
  const currentVoidTx = periodAllTx.filter(isVoidTx)

  // Jika tidak ada transaksi sama sekali pada periode, kembalikan empty: true
  if (currentActiveTx.length === 0 && currentVoidTx.length === 0) {
    return { empty: true }
  }

  // 3. Evaluasi pembanding (previous)
  let comparedToLabel = ''
  let isPreviousPeriod: ((t: any) => boolean) | null = null

  const currentHour = now.getHours()
  const currentMinute = now.getMinutes()

  if (period === 'today') {
    const yesterday = new Date(todayDay)
    yesterday.setDate(todayDay.getDate() - 1)
    comparedToLabel = `kemarin hingga pk ${String(currentHour).padStart(2, '0')}:${String(currentMinute).padStart(2, '0')}`

    isPreviousPeriod = (t: any) => {
      if (!t.timestamp) return false
      const txDate = parseTs(String(t.timestamp))
      const txDay = new Date(txDate.getFullYear(), txDate.getMonth(), txDate.getDate())
      if (txDay.getTime() !== yesterday.getTime()) return false
      const h = txDate.getHours()
      const m = txDate.getMinutes()
      return h < currentHour || (h === currentHour && m <= currentMinute)
    }
  } else if (period === '7days') {
    comparedToLabel = '7 hari sebelumnya'
    const endPrev = new Date(todayDay)
    endPrev.setDate(todayDay.getDate() - 7)
    const startPrev = new Date(todayDay)
    startPrev.setDate(todayDay.getDate() - 13)

    isPreviousPeriod = (t: any) => {
      if (!t.timestamp) return false
      const txDate = parseTs(String(t.timestamp))
      const txDay = new Date(txDate.getFullYear(), txDate.getMonth(), txDate.getDate())
      return txDay >= startPrev && txDay <= endPrev
    }
  } else if (period === 'month') {
    comparedToLabel = 'bulan lalu pada rentang tanggal yang sama'
    const prevMonthDate = new Date(todayDay.getFullYear(), todayDay.getMonth() - 1, 1)
    const prevMonthYear = prevMonthDate.getFullYear()
    const prevMonthIndex = prevMonthDate.getMonth()
    const daysInPrevMonth = new Date(prevMonthYear, prevMonthIndex + 1, 0).getDate()
    const targetDay = Math.min(now.getDate(), daysInPrevMonth)
    const prevMonthEnd = new Date(prevMonthYear, prevMonthIndex, targetDay, 23, 59, 59, 999)

    isPreviousPeriod = (t: any) => {
      if (!t.timestamp) return false
      const txDate = parseTs(String(t.timestamp))
      const txDay = new Date(txDate.getFullYear(), txDate.getMonth(), txDate.getDate())
      return txDay >= prevMonthDate && txDay <= prevMonthEnd
    }
  } else if (period === 'custom' && customDate) {
    const selDate = new Date(customDate)
    const prevDay = new Date(selDate)
    prevDay.setDate(selDate.getDate() - 1)
    comparedToLabel = 'hari sebelum tanggal terpilih'

    isPreviousPeriod = (t: any) => {
      if (!t.timestamp) return false
      const txDate = parseTs(String(t.timestamp))
      const txDay = new Date(txDate.getFullYear(), txDate.getMonth(), txDate.getDate())
      return txDay.getTime() === prevDay.getTime()
    }
  }

  const prevAllTx = isPreviousPeriod ? baseTx.filter(isPreviousPeriod) : []
  const prevActiveTx = prevAllTx.filter((t: any) => !isVoidTx(t))
  const prevVoidTx = prevAllTx.filter(isVoidTx)

  // 4. Perhitungan metrik helper
  const calcMetrics = (active: any[], voidList: any[]): AiSnapshotMetrics => {
    const omzet = Math.round(active.reduce((sum, t) => sum + (Number(t.total) || 0), 0))
    const transactionsCount = active.length
    const avgTicket = transactionsCount > 0 ? Math.round(omzet / transactionsCount) : 0

    let itemsSold = 0
    let totalDiscount = 0
    let manualDiscount = 0
    const payMap: Record<string, number> = {}
    const slotMap: Record<string, number> = {}

    active.forEach((t: any) => {
      // Diskon
      const promoD = Number(t.promo_discount) || 0
      const manualD = Number(t.manual_discount) || 0
      totalDiscount += (promoD + manualD)
      manualDiscount += manualD

      // Items sold
      if (t.payloadObj?.items && Array.isArray(t.payloadObj.items)) {
        itemsSold += t.payloadObj.items.reduce((s: number, i: any) => s + (Number(i.qty) || 0), 0)
      }

      // Metode bayar
      const pm = String(t.payment_method || 'CASH').toUpperCase()
      payMap[pm] = (payMap[pm] || 0) + 1

      // Jam ramai (slot 2 jam F&B: 08-10, 10-12, 12-14, 14-16, 16-18, 18-20, 20-22, 22-24)
      const d = parseTs(String(t.timestamp || ''))
      if (!isNaN(d.getTime())) {
        const h = d.getHours()
        const startSlot = Math.floor(h / 2) * 2
        const slotKey = `${String(startSlot).padStart(2, '0')}:00-${String(startSlot + 2).padStart(2, '0')}:00`
        slotMap[slotKey] = (slotMap[slotKey] || 0) + 1
      }
    })

    const totalWithVoid = active.length + voidList.length
    const voidRate = totalWithVoid > 0 ? round1((voidList.length / totalWithVoid) * 100) : 0

    const grossOmzet = omzet + totalDiscount
    const discountRate = grossOmzet > 0 ? round1((totalDiscount / grossOmzet) * 100) : 0

    // Format payment methods persentase
    const paymentPercentages: Record<string, number> = {}
    if (transactionsCount > 0) {
      Object.entries(payMap).forEach(([m, count]) => {
        paymentPercentages[m] = Math.round((count / transactionsCount) * 100)
      })
    }

    // Jam teramai
    const sortedSlots = Object.entries(slotMap).sort((a, b) => b[1] - a[1])
    const busyHours = sortedSlots.length > 0 ? sortedSlots[0][0] : '-'

    return {
      omzet,
      transactions: transactionsCount,
      avgTicket,
      itemsSold,
      voidCount: voidList.length,
      voidRate,
      totalDiscount: Math.round(totalDiscount),
      discountRate,
      manualDiscount: Math.round(manualDiscount),
      paymentMethods: paymentPercentages,
      busyHours
    }
  }

  const currentMetrics = calcMetrics(currentActiveTx, currentVoidTx)
  const prevMetrics = prevActiveTx.length > 0 ? calcMetrics(prevActiveTx, prevVoidTx) : null

  // Delta
  const delta = {
    omzet: prevMetrics && prevMetrics.omzet > 0
      ? round1(((currentMetrics.omzet - prevMetrics.omzet) / prevMetrics.omzet) * 100)
      : null,
    transactions: prevMetrics && prevMetrics.transactions > 0
      ? round1(((currentMetrics.transactions - prevMetrics.transactions) / prevMetrics.transactions) * 100)
      : null,
    avgTicket: prevMetrics && prevMetrics.avgTicket > 0
      ? round1(((currentMetrics.avgTicket - prevMetrics.avgTicket) / prevMetrics.avgTicket) * 100)
      : null,
  }

  // 5. Produk terlaris & produk lambat
  const currentProdMap: Record<string, { qty: number; omzet: number }> = {}
  currentActiveTx.forEach((t: any) => {
    if (t.payloadObj?.items && Array.isArray(t.payloadObj.items)) {
      t.payloadObj.items.forEach((item: any) => {
        const name = String(item.product_name || item.name || 'Unknown').trim()
        if (productsList.length > 0) {
          const match = productsList.find(p => p.name.trim().toLowerCase() === name.toLowerCase())
          if (!match) return
        }
        if (!currentProdMap[name]) currentProdMap[name] = { qty: 0, omzet: 0 }
        const q = Number(item.qty) || 0
        const price = Number(item.unit_price || item.price) || 0
        currentProdMap[name].qty += q
        currentProdMap[name].omzet += (q * price)
      })
    }
  })

  const prevProdMap: Record<string, number> = {}
  prevActiveTx.forEach((t: any) => {
    if (t.payloadObj?.items && Array.isArray(t.payloadObj.items)) {
      t.payloadObj.items.forEach((item: any) => {
        const name = String(item.product_name || item.name || 'Unknown').trim()
        prevProdMap[name] = (prevProdMap[name] || 0) + (Number(item.qty) || 0)
      })
    }
  })

  const topProducts = Object.entries(currentProdMap)
    .sort((a, b) => b[1].qty - a[1].qty)
    .slice(0, 5)
    .map(([name, data]) => {
      const prevQty = prevProdMap[name] || 0
      const qtyDeltaPct = prevQty > 0 ? round1(((data.qty - prevQty) / prevQty) * 100) : null
      return {
        name,
        qty: data.qty,
        omzet: Math.round(data.omzet),
        qtyDeltaPct
      }
    })

  // Slow products: 3 terendah dari katalog produk
  const catalogSales = productsList.map(p => ({
    name: p.name,
    qty: currentProdMap[p.name]?.qty || 0,
    omzet: Math.round(currentProdMap[p.name]?.omzet || 0)
  })).sort((a, b) => a.qty - b.qty).slice(0, 3)

  // 6. Data Cabang
  const branches = outletsList.map(o => {
    const bCurrentTx = transactions.filter((t: any) => String(t.branchId) === String(o.id) && isCurrentPeriod(t) && !isVoidTx(t))
    const bOmzet = Math.round(bCurrentTx.reduce((sum, t) => sum + (Number(t.total) || 0), 0))
    const targetNominal = Number(o.target) || 0
    const targetPct = targetNominal > 0 ? Math.round((bOmzet / targetNominal) * 100) : 0

    let deltaPct: number | null = null
    if (isPreviousPeriod) {
      const bPrevTx = transactions.filter((t: any) => String(t.branchId) === String(o.id) && isPreviousPeriod!(t) && !isVoidTx(t))
      const bPrevOmzet = Math.round(bPrevTx.reduce((sum, t) => sum + (Number(t.total) || 0), 0))
      if (bPrevOmzet > 0) {
        deltaPct = round1(((bOmzet - bPrevOmzet) / bPrevOmzet) * 100)
      }
    }

    return {
      name: o.name,
      omzet: bOmzet,
      transactions: bCurrentTx.length,
      targetPct,
      deltaPct
    }
  })

  // 7. Data Kasir (Maksimal 8)
  const cashiers = cashiersList.slice(0, 8).map(c => {
    const cTx = baseTx.filter((t: any) => t.cashier === c.name && isCurrentPeriod(t))
    const activeCTx = cTx.filter((t: any) => !isVoidTx(t))
    const omzet = Math.round(activeCTx.reduce((sum, t) => sum + (Number(t.total) || 0), 0))
    const voidCount = cTx.filter(isVoidTx).length
    const avgTicket = activeCTx.length > 0 ? Math.round(omzet / activeCTx.length) : 0

    return {
      name: c.name,
      transactions: activeCTx.length,
      omzet,
      voidCount,
      avgTicket
    }
  })

  // 8. Low Stock Ingredients (Maksimal 8)
  const rawIngs = dashboardData?.ingredients || ingredientsList
  let displayIngs: any[] = []
  if (selectedBranch === 'all') {
    const map = new Map<number, any>()
    rawIngs.forEach((ing: any) => {
      const id = Number(ing.id)
      if (!map.has(id)) {
        map.set(id, { ...ing, current_stock: 0 })
      }
      map.get(id).current_stock += (Number(ing.current_stock) || 0)
    })
    displayIngs = Array.from(map.values())
  } else {
    displayIngs = rawIngs.filter((ing: any) => {
      if (String(ing.branchId) === String(selectedBranch)) return true
      if (ing.branchId === 'pusat' || !ing.branchId) {
        const outlets = String(ing.outlets || 'all').toLowerCase()
        if (outlets === 'all') return true
        return outlets.split(',').map((s: string) => s.trim()).includes(String(selectedBranch).toLowerCase())
      }
      return false
    })
  }

  const lowStock = displayIngs
    .filter((i: any) => {
      const isTracked = i.is_tracked === undefined || i.is_tracked === '' ? true : String(i.is_tracked).toUpperCase() === 'TRUE'
      return isTracked && Number(i.current_stock) <= Number(i.min_stock_threshold || 0) * THRESHOLDS.STOCK_WARNING_RATIO
    })
    .slice(0, 8)
    .map((i: any) => ({
      name: i.name,
      currentStock: Number(i.current_stock) || 0,
      minStock: Number(i.min_stock_threshold) || 0,
      unit: i.unit || 'unit'
    }))

  // 9. Selisih Kas (Shift Reports di luar toleransi, maks 5)
  const shiftReports: any[] = dashboardData?.shiftReports || []
  const cashDifferences = shiftReports
    .filter((sr: any) => {
      if (selectedBranch !== 'all' && String(sr.branchId || sr.outlet) !== String(selectedBranch)) return false
      const diff = Math.abs(Number(sr.selisih) || 0)
      return diff > shiftTolerance
    })
    .slice(0, 5)
    .map((sr: any) => ({
      cashier: sr.cashier || 'Kasir',
      outlet: sr.outlet || sr.branchId || 'Cabang',
      date: sr.date || sr.timestamp || '-',
      selisih: Math.round(Number(sr.selisih) || 0)
    }))

  // 10. Deteksi Flags / Anomali Bisnis
  const flags: AiFlag[] = []

  if (delta.omzet !== null) {
    if (delta.omzet <= -THRESHOLDS.OMZET_DELTA_ALERT) {
      flags.push({
        code: 'OMZET_TURUN',
        severity: 'danger',
        detail: `Omzet turun ${Math.abs(delta.omzet)}% dibanding ${comparedToLabel}.`
      })
    } else if (delta.omzet >= THRESHOLDS.OMZET_DELTA_ALERT) {
      flags.push({
        code: 'OMZET_NAIK',
        severity: 'success',
        detail: `Omzet naik ${delta.omzet}% dibanding ${comparedToLabel}.`
      })
    }
  }

  if (currentMetrics.voidRate >= THRESHOLDS.HIGH_VOID_PCT) {
    flags.push({
      code: 'VOID_TINGGI',
      severity: 'warning',
      detail: `Tingkat void tinggi (${currentMetrics.voidRate}% dari total tiket).`
    })
  }

  const manualDiscountRate = currentMetrics.omzet > 0
    ? round1((currentMetrics.manualDiscount / (currentMetrics.omzet + currentMetrics.totalDiscount)) * 100)
    : 0

  if (manualDiscountRate >= THRESHOLDS.HIGH_MANUAL_DISCOUNT_PCT) {
    flags.push({
      code: 'DISKON_MANUAL_TINGGI',
      severity: 'warning',
      detail: `Diskon manual mencapai ${manualDiscountRate}% dari omzet kotor.`
    })
  }

  if (cashDifferences.length > 0) {
    flags.push({
      code: 'SELISIH_KAS',
      severity: 'danger',
      detail: `Ada ${cashDifferences.length} laporan shift dengan selisih kas melebihi toleransi (Rp${shiftTolerance.toLocaleString('id-ID')}).`
    })
  }

  if (lowStock.length > 0) {
    flags.push({
      code: 'STOK_MENIPIS',
      severity: 'warning',
      detail: `${lowStock.length} bahan baku berada di bawah atau mendekati batas minimum.`
    })
  }

  if (topProducts.length > 0 && currentMetrics.omzet > 0) {
    const topProd = topProducts[0]
    const prodShare = round1((topProd.omzet / currentMetrics.omzet) * 100)
    if (prodShare >= THRESHOLDS.PRODUCT_DEPENDENCY_PCT) {
      flags.push({
        code: 'KETERGANTUNGAN_PRODUK',
        severity: 'info',
        detail: `Produk '${topProd.name}' mendominasi ${prodShare}% total omzet.`
      })
    }
  }

  const belowTargetBranches = branches.filter(b => b.targetPct > 0 && b.targetPct < 70)
  if (belowTargetBranches.length > 0) {
    flags.push({
      code: 'CABANG_DI_BAWAH_TARGET',
      severity: 'warning',
      detail: `${belowTargetBranches.length} cabang pencapaian target di bawah 70%.`
    })
  }

  const branchObj = outletsList.find(o => String(o.id) === String(selectedBranch))
  const branchLabel = selectedBranch === 'all' ? 'Semua Cabang' : (branchObj?.name || selectedBranch)

  const periodLabels: Record<string, string> = {
    today: 'Hari Ini',
    '7days': '7 Hari Terakhir',
    month: 'Bulan Ini',
    custom: `Custom (${customDate || 'Tanggal Terpilih'})`
  }

  // Format waktu WIB
  const wibTimeStr = new Intl.DateTimeFormat('id-ID', {
    timeZone: 'Asia/Jakarta',
    hour: '2-digit',
    minute: '2-digit',
    day: '2-digit',
    month: 'short',
    year: 'numeric'
  }).format(now)

  return {
    meta: {
      businessName: 'Hasuka Dimsum',
      branchLabel,
      period,
      dateRangeLabel: periodLabels[period] || period,
      comparedTo: comparedToLabel || 'periode sebelumnya',
      generatedAtWib: wibTimeStr
    },
    current: currentMetrics,
    previous: prevMetrics,
    delta,
    topProducts,
    slowProducts: catalogSales,
    branches,
    cashiers,
    lowStock,
    cashDifferences,
    flags
  }
}

export interface UniversalAiContextInput {
  dashboardData: any
  selectedBranch: string
  period: 'today' | '7days' | 'month' | 'custom'
  customDate?: string
  outletsList?: Outlet[]
  cashiersList?: Cashier[]
  productsList?: Product[]
  ingredientsList?: Ingredient[]
  shiftTolerance?: number
  now?: Date
}

/**
 * Universal Knowledge Builder: merangkum seluruh data bisnis Hasuka Dimsum
 * (rekap tanggal per-tanggal 30 hari, katalog menu & margin HPP, seluruh stok bahan, cabang & kasir)
 * Memberikan AI akses 360-derajat yang akurat dan aman (murni read-only).
 */
export function buildUniversalAiContext(input: UniversalAiContextInput): Record<string, any> {
  const {
    dashboardData,
    selectedBranch,
    period,
    customDate,
    outletsList = [],
    cashiersList = [],
    productsList = [],
    ingredientsList = [],
    shiftTolerance = 10000,
    now = new Date()
  } = input

  const transactions: any[] = dashboardData?.transactions || []
  const branchTx = (selectedBranch === 'all'
    ? transactions
    : transactions.filter((t: any) => String(t.branchId) === String(selectedBranch))
  ).filter((t: any) => !isVoidTx(t))

  const pad2 = (n: number) => String(n).padStart(2, '0')
  const toDateStr = (d: Date) => `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`
  const todayStr = toDateStr(now)

  // Rekap harian: kelompokkan transaksi per YYYY-MM-DD
  const dailyMap = new Map<string, { omzet: number; trx: number; itemsMap: Map<string, number> }>()

  branchTx.forEach((t: any) => {
    const txDate = parseTs(String(t.timestamp || ''))
    if (!txDate || isNaN(txDate.getTime()) || txDate.getTime() === 0) return
    const dStr = toDateStr(txDate)
    const existing = dailyMap.get(dStr) || { omzet: 0, trx: 0, itemsMap: new Map() }
    existing.omzet += Number(t.total) || 0
    existing.trx += 1

    try {
      const items = Array.isArray(t.items) ? t.items : (typeof t.items === 'string' && t.items.startsWith('[') ? JSON.parse(t.items) : [])
      items.forEach((item: any) => {
        const name = item.name || item.nama || item.product_name || 'Item'
        const qty = Number(item.qty || item.quantity || 1)
        existing.itemsMap.set(name, (existing.itemsMap.get(name) || 0) + qty)
      })
    } catch { /* ignore parse error */ }

    dailyMap.set(dStr, existing)
  })

  // Urutkan tanggal dari terbaru ke terlama (maksimal 30 hari kalender)
  const sortedDates = Array.from(dailyMap.keys()).sort().reverse().slice(0, 30)
  const dayNames = ['Min', 'Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab']
  const rekapHarian = sortedDates.map(dateKey => {
    const entry = dailyMap.get(dateKey)!
    const dObj = new Date(dateKey + 'T00:00:00')
    let topItem = '-'
    let maxQty = 0
    entry.itemsMap.forEach((qty, name) => {
      if (qty > maxQty) {
        maxQty = qty
        topItem = `${name} (${qty} porsi)`
      }
    })
    return {
      tanggal: dateKey,
      hari: dayNames[dObj.getDay()],
      omzet: entry.omzet,
      totalTrx: entry.trx,
      topMenu: topItem
    }
  })

  // Agregasi cepat
  const yesterday = new Date(now)
  yesterday.setDate(now.getDate() - 1)
  const yesterdayStr = toDateStr(yesterday)

  const sevenDaysAgo = new Date(now)
  sevenDaysAgo.setDate(now.getDate() - 6)
  const sevenDaysAgoStr = toDateStr(sevenDaysAgo)

  let omzet7Hari = 0
  let trx7Hari = 0
  let omzetBulanIni = 0
  let trxBulanIni = 0
  const currentMonth = now.getMonth()
  const currentYear = now.getFullYear()

  dailyMap.forEach((val, dateKey) => {
    if (dateKey >= sevenDaysAgoStr && dateKey <= todayStr) {
      omzet7Hari += val.omzet
      trx7Hari += val.trx
    }
    const dObj = new Date(dateKey + 'T00:00:00')
    if (dObj.getFullYear() === currentYear && dObj.getMonth() === currentMonth) {
      omzetBulanIni += val.omzet
      trxBulanIni += val.trx
    }
  })

  const todayEntry = dailyMap.get(todayStr) || { omzet: 0, trx: 0 }
  const yesterdayEntry = dailyMap.get(yesterdayStr) || { omzet: 0, trx: 0 }

  // Katalog menu, harga jual dan margin HPP
  const katalogMenu = productsList.slice(0, 35).map(p => {
    const price = Number(p.price) || 0
    const cost = Number(p.cost) || 0
    const marginPct = price > 0 ? Math.round(((price - cost) / price) * 100) : 0
    return {
      nama: p.name,
      kategori: p.cat || 'Umum',
      hargaJual: price,
      hpp: cost,
      marginPct: `${marginPct}%`,
      stok: p.stock
    }
  })

  // Status seluruh stok bahan baku (minus darurat vs kritis vs aman)
  const bahanMinus: Array<{ nama: string; stok: number; satuan: string }> = []
  const bahanKritis: Array<{ nama: string; stok: number; min: number; satuan: string }> = []
  let amanCount = 0

  ingredientsList.forEach(ing => {
    const stock = Number(ing.current_stock) || 0
    const min = Number(ing.min_stock_threshold) || 0
    const unit = ing.unit || 'pcs'
    if (stock < 0) {
      bahanMinus.push({ nama: ing.name, stok: stock, satuan: unit })
    } else if (stock <= min) {
      bahanKritis.push({ nama: ing.name, stok: stock, min, satuan: unit })
    } else {
      amanCount++
    }
  })

  // Cabang dan pencapaian target
  const cabang = outletsList.map(o => {
    const oTx = transactions.filter(t => !isVoidTx(t) && String(t.branchId) === String(o.id))
    const firstDay = new Date(currentYear, currentMonth, 1)
    const mTx = oTx.filter(t => parseTs(String(t.timestamp || '')) >= firstDay)
    const oOmzetMonth = mTx.reduce((sum, t) => sum + (Number(t.total) || 0), 0)
    const target = Number(o.target) || 0
    const pct = target > 0 ? Math.round((oOmzetMonth / target) * 100) : 0
    return {
      nama: o.name,
      targetBulanan: target,
      omzetBulanIni: oOmzetMonth,
      persenTarget: `${pct}%`
    }
  })

  const branchObj = outletsList.find(o => String(o.id) === String(selectedBranch))
  const branchLabel = selectedBranch === 'all' ? 'Semua Cabang' : (branchObj?.name || selectedBranch)

  return {
    meta: {
      bisnis: 'Hasuka Dimsum',
      tanggalHariIni: todayStr,
      hariHariIni: dayNames[now.getDay()],
      cabangAktif: branchLabel,
      filterAktif: period,
      customDate: customDate || null,
      toleransiSelisihKas: shiftTolerance
    },
    ringkasanPeriodeUtama: {
      hariIni: { omzet: todayEntry.omzet, totalTrx: todayEntry.trx },
      kemarin: { omzet: yesterdayEntry.omzet, totalTrx: yesterdayEntry.trx },
      tujuhHariTerakhir: { omzet: omzet7Hari, totalTrx: trx7Hari },
      bulanIni: { omzet: omzetBulanIni, totalTrx: trxBulanIni }
    },
    rekapHarian: rekapHarian,
    katalogMenu: katalogMenu,
    stokBahanBaku: {
      totalJenisBahan: ingredientsList.length,
      bahanMinusDarurat: bahanMinus,
      bahanKritis: bahanKritis,
      jumlahBahanAman: amanCount
    },
    cabang: cabang,
    kasirAktif: cashiersList.filter(c => c.status === 'Aktif').map(c => ({
      nama: c.name,
      cabang: outletsList.find(o => String(o.id) === String(c.branchId))?.name || c.branchId
    }))
  }
}
