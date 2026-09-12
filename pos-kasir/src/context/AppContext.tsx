import { createContext, useContext, useState, useEffect, type ReactNode, type Dispatch, type SetStateAction } from 'react'
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
  const [taxRate, setTaxRate] = useState(11)
  const [serviceRate, setServiceRate] = useState(0)
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

  // Live Sync: Fetch initial data from Google Apps Script Web App on startup
  useEffect(() => {
    let isMounted = true
    gasApi.getInitialData().then(data => {
      if (!isMounted || !data) return
      if (Array.isArray(data.outlets)) setOutletsList(data.outlets)
      if (Array.isArray(data.cashiers)) setCashiersList(data.cashiers)
      if (Array.isArray(data.products)) setProductsList(data.products)
      if (Array.isArray(data.ingredients)) setIngredientsList(data.ingredients)
      if (Array.isArray(data.recipes)) setRecipesList(data.recipes)
      
      if (data.settings && data.settings['tax_rate']) {
        const parsedTax = parseFloat(data.settings['tax_rate'])
        if (!isNaN(parsedTax)) setTaxRate(parsedTax)
      }
    }).catch(err => {
      console.warn('[LiveSync] Tidak dapat memuat data awal live dari Google Apps Script:', err)
    })
    return () => { isMounted = false }
  }, [])

  // Ensure current outlet is updated if it is edited in outletsList
  const currentOutlet = outletsList.find(o => o.id === outlet.id) || outlet

  return (
    <Ctx.Provider value={{
      outlet: currentOutlet, setOutlet,
      kasirInfo, setKasirInfo,
      tableName, setTableName,
      taxRate, setTaxRate,
      serviceRate, setServiceRate,
      receiptSettings, setReceiptSettings,
      kasirAvatars, setKasirAvatar,
      outletsList, setOutletsList,
      cashiersList, setCashiersList,
      productsList, setProductsList,
      ingredientsList, setIngredientsList,
      recipesList, setRecipesList,
      shiftTolerance, setShiftTolerance,
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
