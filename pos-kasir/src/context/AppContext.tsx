import { createContext, useContext, useState, useEffect, useRef, type ReactNode, type Dispatch, type SetStateAction } from 'react'
import { gasApi } from '../services/gasApi'

export interface Product {
  id: number
  name: string
  cat: string
  price: number
  cost: number
  stock_mode: 'recipe' | 'direct' | 'simple'
  stock: number
  minStock: number
  promo: boolean
  promoText?: string
  originalPrice?: number
  img?: string
  outlets?: 'all' | string[]
}

export interface Ingredient {
  id: number
  name: string
  unit: string
  current_stock: number
  min_stock_threshold: number
  is_tracked: boolean
  outlets?: 'all' | string[]
}

export interface Recipe {
  id: number
  product_id: number
  ingredient_id: number
  qty_per_unit: number
}

export interface Outlet {
  id: string
  name: string
  address: string
  phone: string
  target?: number
}

export interface KasirInfo {
  id: string
  name: string
  role: string
  avatarUrl: string
}

export interface Cashier {
  id: string
  name: string
  branchId: string
  role: string
  status: 'Aktif' | 'Nonaktif'
  shiftStart?: string
  shiftEnd?: string
  pin?: string
}

export interface ReceiptSettings {
  customFooter: string
  showLogo: boolean
  logoUrl?: string
}

interface AppState {
  outlet: Outlet
  setOutlet: (o: Outlet) => void
  kasirInfo: KasirInfo | null
  setKasirInfo: (k: KasirInfo) => void
  tableName: string
  setTableName: (t: string) => void
  taxRate: number
  setTaxRate: (r: number) => void
  serviceRate: number
  setServiceRate: (r: number) => void
  shiftTolerance: number
  setShiftTolerance: (r: number) => void
  receiptSettings: ReceiptSettings
  setReceiptSettings: (s: ReceiptSettings) => void
  kasirAvatars: Record<string, string>
  setKasirAvatar: (kasirId: string, url: string) => void
  outletsList: Outlet[]
  setOutletsList: (o: Outlet[]) => void
  cashiersList: Cashier[]
  setCashiersList: (c: Cashier[]) => void
  productsList: Product[]
  setProductsList: Dispatch<SetStateAction<Product[]>>
  ingredientsList: Ingredient[]
  setIngredientsList: Dispatch<SetStateAction<Ingredient[]>>
  recipesList: Recipe[]
  setRecipesList: Dispatch<SetStateAction<Recipe[]>>
  promosList: any[]
  setPromosList: Dispatch<SetStateAction<any[]>>
  refreshData: (branchId?: string) => Promise<any>
  updateIngredientStock: (ingredientId: number, newStock: number) => void
  isGlobalSyncing: boolean
  lastSyncTime: number | null
  isOnline: boolean
  hasActiveMutation: boolean
  setHasActiveMutation: (v: boolean) => void
}

const INITIAL_OUTLETS: Outlet[] = []

const INITIAL_CASHIERS: Cashier[] = []

// Expose OUTLETS as a fallback for some files, though they should ideally use the context
export const OUTLETS = INITIAL_OUTLETS

const Ctx = createContext<AppState | null>(null)

export function AppProvider({ children }: { children: ReactNode }) {
  const [outlet, setOutlet] = useState<Outlet>(() => {
    try {
      const cached = localStorage.getItem('hasuka_cached_outlets')
      if (cached) {
        const parsed = JSON.parse(cached)
        if (parsed && parsed.length > 0) return parsed[0]
      }
      return OUTLETS[0] || { id: 'none', name: 'Belum Ada Cabang', address: '-', phone: '-' }
    } catch { return OUTLETS[0] || { id: 'none', name: 'Belum Ada Cabang', address: '-', phone: '-' } }
  })
  const [kasirInfo, setKasirInfoState] = useState<KasirInfo | null>(() => {
    try {
      const saved = localStorage.getItem('hasuka_kasir_info')
      return saved ? JSON.parse(saved) : null
    } catch { return null }
  })

  const setKasirInfo = (k: KasirInfo | null) => {
    setKasirInfoState(k)
    if (k) localStorage.setItem('hasuka_kasir_info', JSON.stringify(k))
    else localStorage.removeItem('hasuka_kasir_info')
  }
  const [tableName, setTableName] = useState('Meja 01')
  const [taxRateState, setTaxRateState] = useState(() => {
    try {
      const saved = localStorage.getItem('hasuka_tax_rate')
      return saved !== null ? parseFloat(saved) : 11
    } catch { return 11 }
  })
  const setTaxRate = (v: number) => {
    setTaxRateState(v)
    localStorage.setItem('hasuka_tax_rate', v.toString())
  }

  const [serviceRateState, setServiceRateState] = useState(() => {
    try {
      const saved = localStorage.getItem('hasuka_service_rate')
      return saved !== null ? parseFloat(saved) : 0
    } catch { return 0 }
  })
  const setServiceRate = (v: number) => {
    setServiceRateState(v)
    localStorage.setItem('hasuka_service_rate', v.toString())
  }
  const [shiftTolerance, setShiftToleranceState] = useState(() => {
    try {
      const saved = localStorage.getItem('hasuka_shift_tolerance')
      return saved ? parseInt(saved, 10) : 30
    } catch { return 30 }
  })
  const setShiftTolerance = (v: number) => {
    setShiftToleranceState(v)
    localStorage.setItem('hasuka_shift_tolerance', v.toString())
  }
  const [receiptSettings, setReceiptSettings] = useState<ReceiptSettings>({
    customFooter: 'Dimsum paling nikmat disantap hangat 🥟\nTerima kasih atas kunjungan Anda!',
    showLogo: true,
    logoUrl: '',
  })

  // Avatar overrides stored in localStorage
  const [kasirAvatars, setKasirAvatars] = useState<Record<string, string>>(() => {
    try { return JSON.parse(localStorage.getItem('kasirAvatars') || '{}') } catch { return {} }
  })

  const setKasirAvatar = (kasirId: string, url: string) => {
    const next = { ...kasirAvatars, [kasirId]: url }
    setKasirAvatars(next)
    localStorage.setItem('kasirAvatars', JSON.stringify(next))
  }

  const safeGetJSON = (key: string, fallback: any) => {
    try {
      const item = localStorage.getItem(key)
      return item ? JSON.parse(item) : fallback
    } catch {
      return fallback
    }
  }

  const [outletsList, setOutletsListState] = useState<Outlet[]>(() => safeGetJSON('hasuka_cached_outlets', INITIAL_OUTLETS))
  const [cashiersList, setCashiersListState] = useState<Cashier[]>(() => safeGetJSON('hasuka_cached_cashiers', INITIAL_CASHIERS))
  const [productsList, setProductsListState] = useState<Product[]>(() => safeGetJSON('hasuka_cached_products', []))
  const [ingredientsList, setIngredientsListState] = useState<Ingredient[]>(() => safeGetJSON('hasuka_cached_ingredients', []))
  const [recipesList, setRecipesListState] = useState<Recipe[]>(() => safeGetJSON('hasuka_cached_recipes', []))
  const [promosList, setPromosListState] = useState<any[]>(() => safeGetJSON('hasuka_cached_promos', []))

  const setOutletsList = (outlets: Outlet[]) => {
    setOutletsListState(outlets)
    try { localStorage.setItem('hasuka_cached_outlets', JSON.stringify(outlets)) } catch { /* ignore */ }
  }

  const setCashiersList = (cashiers: Cashier[]) => {
    setCashiersListState(cashiers)
    try { localStorage.setItem('hasuka_cached_cashiers', JSON.stringify(cashiers)) } catch { /* ignore */ }
  }

  const setProductsList: Dispatch<SetStateAction<Product[]>> = (val) => {
    setProductsListState(prev => {
      const next = typeof val === 'function' ? val(prev) : val;
      try { localStorage.setItem('hasuka_cached_products', JSON.stringify(next)) } catch { /* ignore */ }
      return next;
    });
  }

  const setIngredientsList: Dispatch<SetStateAction<Ingredient[]>> = (val) => {
    setIngredientsListState(prev => {
      const next = typeof val === 'function' ? val(prev) : val;
      try { localStorage.setItem('hasuka_cached_ingredients', JSON.stringify(next)) } catch { /* ignore */ }
      return next;
    });
  }

  const setRecipesList: Dispatch<SetStateAction<Recipe[]>> = (val) => {
    setRecipesListState(prev => {
      const next = typeof val === 'function' ? val(prev) : val;
      try { localStorage.setItem('hasuka_cached_recipes', JSON.stringify(next)) } catch { /* ignore */ }
      return next;
    });
  }

  const setPromosList: Dispatch<SetStateAction<any[]>> = (val) => {
    setPromosListState(prev => {
      const next = typeof val === 'function' ? val(prev) : val;
      try { localStorage.setItem('hasuka_cached_promos', JSON.stringify(next)) } catch { /* ignore */ }
      return next;
    });
  }

  const [isGlobalSyncing, setIsGlobalSyncing] = useState(false)
  const [lastSyncTime, setLastSyncTime] = useState<number | null>(null)
  const [isOnline, setIsOnline] = useState(() => typeof navigator === 'undefined' ? true : navigator.onLine)
  const [hasActiveMutationState, setHasActiveMutationState] = useState(false)
  const syncingRef = useRef(false)
  const mutatingRef = useRef(false)
  const outletRef = useRef(outlet)
  outletRef.current = outlet

  const refreshData = async (branchId?: string) => {
    // Guard anti double-fetch (polling + focus bisa bertabrakan)
    if (syncingRef.current) return null
    syncingRef.current = true
    setIsGlobalSyncing(true)
    try {
      const data = await gasApi.getInitialData(branchId)
      if (!data) return null
      if (Array.isArray(data.outlets)) setOutletsList(data.outlets)
      if (Array.isArray(data.cashiers)) setCashiersList(data.cashiers)
      if (Array.isArray(data.promos)) setPromosList(data.promos)
      if (Array.isArray(data.ingredients)) setIngredientsList(data.ingredients)
      if (Array.isArray(data.recipes)) setRecipesList(data.recipes)
      
      if (Array.isArray(data.products)) {
        const todayStr = new Date().toISOString().split('T')[0]
        const activePromos = (data.promos || []).filter((p: any) => {
          if (p.status !== 'Aktif') return false
          const s = String(p.startDate || '').split(' ')[0].split('T')[0]
          const e = String(p.endDate || '').split(' ')[0].split('T')[0]
          if (s && s > todayStr) return false
          if (e && e < todayStr) return false
          const targetBranch = branchId || outletRef.current?.id
          if (p.outlets && p.outlets !== 'all' && Array.isArray(p.outlets) && targetBranch) {
            if (!p.outlets.includes(targetBranch)) return false
          }
          return true
        })

        const enrichedProducts = data.products.map(p => {
          let hasPromo = p.promo || false
          let promoText = p.promoText || ''

          for (const pr of activePromos) {
            let matches = false
            if (pr.scope === 'Semua Produk') matches = true
            else if (pr.scope === 'Produk Tertentu' && Array.isArray(pr.products)) {
              matches = pr.products.some((it: any) => (it.productId || it.id) === p.id)
            }
            if (pr.type === 'bundling' && Array.isArray(pr.bundleProducts)) {
              if (pr.bundleProducts.some((it: any) => (it.productId || it.id) === p.id)) matches = true
            }
            if (pr.type === 'gratis_item') {
              if (Array.isArray(pr.products) && pr.products.some((it: any) => (it.productId || it.id) === p.id)) matches = true
              if (pr.freeItem && (pr.freeItem.productId || pr.freeItem.id) === p.id) matches = true
            }

            if (matches) {
              hasPromo = true
              if (!promoText) {
                if (pr.type === 'diskon_persen') promoText = `${pr.value}%`
                else if (pr.type === 'diskon_nominal') promoText = `Hemat Rp${(pr.value || 0).toLocaleString('id-ID')}`
                else if (pr.type === 'bundling') promoText = 'Bundle'
                else if (pr.type === 'gratis_item') promoText = 'B1G1'
                else promoText = 'PROMO'
              }
              break
            }
          }

          return { ...p, promo: hasPromo, promoText }
        })

        setProductsList(enrichedProducts)
      }
      
      if (data.settings) {
        if (data.settings['tax_rate'] !== undefined) {
          const parsedTax = parseFloat(data.settings['tax_rate'])
          if (!isNaN(parsedTax)) setTaxRate(parsedTax)
        }
        if (data.settings['service_rate'] !== undefined) {
          const parsedService = parseFloat(data.settings['service_rate'])
          if (!isNaN(parsedService)) setServiceRate(parsedService)
        }
        if (data.settings['shift_tolerance']) {
          const parsedTol = parseInt(data.settings['shift_tolerance'], 10)
          if (!isNaN(parsedTol)) setShiftTolerance(parsedTol)
        }
        
        setReceiptSettings(prev => ({
          ...prev,
          customFooter: data.settings?.['receipt_footer'] || prev.customFooter,
          showLogo: data.settings?.['logo_enabled'] === 'false' ? false : true,
          logoUrl: data.settings?.['logo_url'] || prev.logoUrl,
        }))
      }
      setLastSyncTime(Date.now())
      return data
    } catch (err) {
      console.warn('[LiveSync] Gagal memuat data live dari Google Apps Script:', err)
      return null
    } finally {
      syncingRef.current = false
      setIsGlobalSyncing(false)
    }
  }

  const updateIngredientStock = (ingredientId: number, newStock: number) => {
    setIngredientsList(prev => prev.map(ing => ing.id === ingredientId ? { ...ing, current_stock: newStock } : ing))
  }

  // ── Near-Realtime: smart polling 45 detik + revalidasi saat tab fokus ──────
  // Skip jika offline / ada mutasi aktif (outbox/proses simpan berjalan)
  useEffect(() => {
    const interval = setInterval(() => {
      if (mutatingRef.current) return
      if (typeof navigator !== 'undefined' && !navigator.onLine) return
      if (typeof document !== 'undefined' && document.visibilityState === 'hidden') return
      refreshData(outletRef.current?.id)
    }, 45000)
    return () => clearInterval(interval)
  }, [])

  useEffect(() => {
    const onFocusOrVisible = () => {
      if (document.visibilityState === 'visible') {
        if (!mutatingRef.current && navigator.onLine) refreshData(outletRef.current?.id)
      }
    }
    window.addEventListener('focus', onFocusOrVisible)
    document.addEventListener('visibilitychange', onFocusOrVisible)
    return () => {
      window.removeEventListener('focus', onFocusOrVisible)
      document.removeEventListener('visibilitychange', onFocusOrVisible)
    }
  }, [])

  // Online/offline tracking untuk indikator koneksi global
  useEffect(() => {
    const goOnline = () => setIsOnline(true)
    const goOffline = () => setIsOnline(false)
    window.addEventListener('online', goOnline)
    window.addEventListener('offline', goOffline)
    return () => {
      window.removeEventListener('online', goOnline)
      window.removeEventListener('offline', goOffline)
    }
  }, [])

  // sinkronkan ref mutasi agar polling tidak menabrak proses simpan
  const setHasActiveMutation = (v: boolean) => {
    mutatingRef.current = v
    setHasActiveMutationState(v)
  }

  // Live Sync: Fetch initial data from Google Apps Script Web App on startup
  useEffect(() => {
    refreshData()
  }, [])

  // Ensure current outlet is updated if it is edited in outletsList
  const currentOutlet = outletsList.find(o => o.id === outlet.id) || outlet

  return (
    <Ctx.Provider value={{
      outlet: currentOutlet, setOutlet,
      kasirInfo, setKasirInfo,
      tableName, setTableName,
      taxRate: taxRateState, setTaxRate,
      serviceRate: serviceRateState, setServiceRate,
      receiptSettings, setReceiptSettings,
      kasirAvatars, setKasirAvatar,
      outletsList, setOutletsList,
      cashiersList, setCashiersList,
      productsList, setProductsList,
      ingredientsList, setIngredientsList,
      recipesList, setRecipesList,
      promosList, setPromosList,
      shiftTolerance, setShiftTolerance,
      refreshData,
      updateIngredientStock,
      isGlobalSyncing,
      lastSyncTime,
      isOnline,
      hasActiveMutation: hasActiveMutationState,
      setHasActiveMutation,
    }}>
      {children}
    </Ctx.Provider>
  )
}

export function useApp() {
  const ctx = useContext(Ctx)
  if (!ctx) throw new Error('useApp must be used within AppProvider')
  return ctx
}
