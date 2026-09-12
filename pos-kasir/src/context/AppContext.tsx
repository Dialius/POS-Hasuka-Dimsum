import { createContext, useContext, useState, useEffect, type ReactNode } from 'react'
import { gasApi } from '../services/gasApi'

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
}

const INITIAL_OUTLETS: Outlet[] = []

const INITIAL_CASHIERS: Cashier[] = []

// Expose OUTLETS as a fallback for some files, though they should ideally use the context
export const OUTLETS = INITIAL_OUTLETS

const Ctx = createContext<AppState | null>(null)

export function AppProvider({ children }: { children: ReactNode }) {
  const [outlet, setOutlet] = useState<Outlet>(OUTLETS[0])
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

  // Shared state for Owner management
  const cachedOutlets = localStorage.getItem('hasuka_cached_outlets')
  const initialOutletsState = cachedOutlets ? JSON.parse(cachedOutlets) : INITIAL_OUTLETS
  
  const cachedCashiers = localStorage.getItem('hasuka_cached_cashiers')
  const initialCashiersState = cachedCashiers ? JSON.parse(cachedCashiers) : INITIAL_CASHIERS

  const [outletsList, setOutletsListState] = useState<Outlet[]>(initialOutletsState)
  const [cashiersList, setCashiersListState] = useState<Cashier[]>(initialCashiersState)

  const setOutletsList = (outlets: Outlet[]) => {
    setOutletsListState(outlets)
    localStorage.setItem('hasuka_cached_outlets', JSON.stringify(outlets))
  }

  const setCashiersList = (cashiers: Cashier[]) => {
    setCashiersListState(cashiers)
    localStorage.setItem('hasuka_cached_cashiers', JSON.stringify(cashiers))
  }

  // Live Sync: Fetch initial data from Google Apps Script Web App on startup
  useEffect(() => {
    let isMounted = true
    gasApi.getInitialData().then(data => {
      if (!isMounted || !data) return
      if (Array.isArray(data.outlets)) {
        setOutletsList(data.outlets)
      }
      if (Array.isArray(data.cashiers)) {
        setCashiersList(data.cashiers)
      }
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
