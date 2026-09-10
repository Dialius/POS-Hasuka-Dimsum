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
  receiptSettings: ReceiptSettings
  setReceiptSettings: (s: ReceiptSettings) => void
  kasirAvatars: Record<string, string>
  setKasirAvatar: (kasirId: string, url: string) => void
  outletsList: Outlet[]
  setOutletsList: (o: Outlet[]) => void
  cashiersList: Cashier[]
  setCashiersList: (c: Cashier[]) => void
}

const INITIAL_OUTLETS: Outlet[] = [
  { id: 'paskal', name: 'Hasuka Dimsum — Paskal', address: 'Paskal Hyper Square Blok C-12, Bandung', phone: '(022) 8821992' },
  { id: 'braga', name: 'Hasuka Dimsum — Braga', address: 'Jl. Braga No. 55, Bandung', phone: '(022) 4234567' },
  { id: 'dago', name: 'Hasuka Dimsum — Dago', address: 'Jl. Ir. H. Juanda No. 20, Bandung', phone: '(022) 2509876' },
]

const INITIAL_CASHIERS: Cashier[] = [
  { id: 'c1', name: 'Sri Wahyuni', branchId: 'paskal', role: 'Kasir Shift Siang', status: 'Aktif' },
  { id: 'c2', name: 'Budi Santoso', branchId: 'braga', role: 'Kasir Shift Siang', status: 'Aktif' },
  { id: 'c3', name: 'Ahmad Dani', branchId: 'dago', role: 'Kasir Shift Siang', status: 'Aktif' },
]

// Expose OUTLETS as a fallback for some files, though they should ideally use the context
export const OUTLETS = INITIAL_OUTLETS

const Ctx = createContext<AppState | null>(null)

export function AppProvider({ children }: { children: ReactNode }) {
  const [outlet, setOutlet] = useState<Outlet>(OUTLETS[0])
  const [kasirInfo, setKasirInfo] = useState<KasirInfo | null>(null)
  const [tableName, setTableName] = useState('Meja 01')
  const [taxRate, setTaxRate] = useState(11)
  const [serviceRate, setServiceRate] = useState(0)
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
      if (data.outlets && data.outlets.length > 0) {
        setOutletsList(data.outlets)
      }
      if (data.cashiers && data.cashiers.length > 0) {
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
