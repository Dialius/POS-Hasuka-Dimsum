import { useState, useEffect } from 'react'
import { AppProvider, useApp } from './context/AppContext'
import { HASUKA_LOGO } from './assets/logo'
import { AlertToastHost, subscribeToToasts, type ToastItem } from './components/Alert'
import LoginScreen from './components/LoginScreen'
import BukaShiftScreen from './components/BukaShiftScreen'
import CheckoutScreen from './components/CheckoutScreen'
import SuccessScreen from './components/SuccessScreen'
import ManageProductsScreen from './components/ManageProductsScreen'
import ReportScreen from './components/ReportScreen'
import TutupShiftScreen from './components/TutupShiftScreen'
import ShiftSummaryScreen, { type ShiftSummary as ShiftSummaryData } from './components/ShiftSummaryScreen'
import SettingsScreen from './components/SettingsScreen'
import PettyCashScreen from './components/PettyCashScreen'
import ManagePromoScreen from './components/ManagePromoScreen'
import StokOpnameScreen from './components/StokOpnameScreen'
import OwnerDashboardScreen from './components/OwnerDashboardScreen'
import QrMenuScreen from './components/QrMenuScreen'
import KelolaResepScreen from './components/KelolaResepScreen'
import KelolaBahanBakuScreen from './components/KelolaBahanBakuScreen'
import StockInScreen from './components/StockInScreen'
import TransactionHistoryScreen from './components/TransactionHistoryScreen'

type Screen =
  | 'login' | 'bukaShift' | 'checkout' | 'success' | 'history'
  | 'manageProducts' | 'managePromo' | 'stokOpname' | 'stockIn'
  | 'reports' | 'tutupShift' | 'shiftSummary' | 'settings' | 'pettyCash'
  | 'ownerDashboard' | 'qrMenu' | 'kelolaResep' | 'kelolaBahanBaku'

const FaviconUpdater = () => {
  const { receiptSettings } = useApp()
  useEffect(() => {
    const iconUrl = receiptSettings?.logoUrl || HASUKA_LOGO;
    if (iconUrl) {
      try {
        let link = document.querySelector("link[rel~='icon']") as HTMLLinkElement | null;
        if (!link) {
          link = document.createElement('link');
          link.rel = 'icon';
          document.head.appendChild(link);
        }
        link.href = iconUrl;
      } catch (e) {}
    }
  }, [receiptSettings?.logoUrl])
  return null
}

// ── Global Live Connection Status (hijau / kuning sinkron / merah offline) ────
function ConnectionIndicator() {
  const { isGlobalSyncing, isOnline, lastSyncTime } = useApp()
  const [now, setNow] = useState(Date.now())
  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 30000)
    return () => clearInterval(t)
  }, [])

  const lastLabel = lastSyncTime
    ? `Sinkron terakhir ${new Date(lastSyncTime).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}`
    : 'Belum pernah sinkron'
  const stale = lastSyncTime ? (now - lastSyncTime) > 120000 : true

  let color = '#B60000'
  let label = 'Koneksi Terputus (Mode Offline)'
  if (isOnline && isGlobalSyncing) {
    color = '#C9A227'
    label = 'Menyinkronkan Data...'
  } else if (isOnline && !stale) {
    color = '#5B8A2E'
    label = 'Database Cloud Terhubung'
  } else if (isOnline) {
    color = '#C9A227'
    label = 'Koneksi Cloud Tidak Stabil'
  }

  return (
    <div
      className="fixed bottom-3 left-3 z-[150] flex items-center gap-2 px-3 py-1.5 rounded-full shadow-sm pointer-events-none"
      style={{ background: 'rgba(255,255,255,0.95)', border: '1px solid #E8D7C0' }}
      title={`${label} — ${lastLabel}`}
    >
      <span
        className={`inline-block w-2 h-2 rounded-full ${isGlobalSyncing ? 'animate-pulse' : ''}`}
        style={{ background: color }}
      />
      <span className="text-[10px] font-bold" style={{ color: '#6B5448' }}>{label}</span>
    </div>
  )
}

function App() {
  const [currentScreen, setCurrentScreen] = useState<Screen>('login')
  const [userRole, setUserRole] = useState<'owner' | 'kasir' | null>(null)
  const [lastTransaction, setLastTransaction] = useState<any>(null)
  const [lastShiftSummary, setLastShiftSummary] = useState<ShiftSummaryData | null>(null)

  const go = (s: Screen) => setCurrentScreen(s)

  const handleLogin = (role: 'owner' | 'kasir', cashierName?: string) => {
    setUserRole(role)
    if (role === 'owner') {
      go('ownerDashboard')
    } else {
      try {
        const saved = localStorage.getItem('hasuka_active_shift')
        if (saved) {
          const shift = JSON.parse(saved)
          const isToday = new Date(shift.startTime).toDateString() === new Date().toDateString()
          // Hanya skip halaman buka shift jika kasir yang sama login di hari yang sama
          if (isToday && shift.cashierName === cashierName) {
            go('checkout')
            return
          }
          // Jika kasir berbeda, hapus shift yang nyangkut agar kasir baru bisa buka shift sendiri
          localStorage.removeItem('hasuka_active_shift')
        }
      } catch (e) {
        console.error('Error parsing active shift:', e)
      }
      go('bukaShift')
    }
  }

  // Strict role check: ONLY owner returns to ownerDashboard! Kasir strictly returns to checkout!
  const getBackTarget = (): Screen => (userRole === 'owner' ? 'ownerDashboard' : 'checkout')
  const getBackLabel = (): string => (userRole === 'owner' ? 'Owner' : 'Kasir')

  // Global Toasts: GAS sync errors + bus showToast() dari semua layar
  const [globalToasts, setGlobalToasts] = useState<ToastItem[]>([])

  const pushToast = (t: Omit<ToastItem, 'id'> & { id?: string }) => {
    const id = t.id || Date.now().toString() + Math.random().toString(36).slice(2, 6)
    setGlobalToasts(p => [...p, { ...t, id }])
    const dur = t.durationMs ?? 5000
    if (dur > 0) setTimeout(() => setGlobalToasts(p => p.filter(x => x.id !== id)), dur)
  }

  useEffect(() => subscribeToToasts(pushToast), [])

  useEffect(() => {
    const handleGasSyncError = (e: Event) => {
      const ce = e as CustomEvent
      setGlobalToasts(p => [...p, {
        id: Date.now().toString(),
        variant: 'destructive',
        title: 'Koneksi ke Database Terputus',
        description: ce.detail?.message || 'Gagal memuat data dari Google Sheets. Pastikan Anda tidak memblokir Cookie Pihak Ketiga.'
      }])
    }
    window.addEventListener('gas-sync-error', handleGasSyncError)
    return () => window.removeEventListener('gas-sync-error', handleGasSyncError)
  }, [])

  return (
    <AppProvider>
      <FaviconUpdater />
      <div className="flex flex-col w-full h-screen bg-background font-sans overflow-hidden">
        <AlertToastHost toasts={globalToasts} onDismiss={id => setGlobalToasts(p => p.filter(t => t.id !== id))} />
        <ConnectionIndicator />
        <div className="flex-1 overflow-hidden">
          {currentScreen === 'login' && (
            <LoginScreen onLogin={handleLogin} />
          )}
          {currentScreen === 'bukaShift' && (
            <BukaShiftScreen onBukaShift={() => go('checkout')} />
          )}
          {currentScreen === 'checkout' && (
            <CheckoutScreen onSuccess={(tx: any) => { setLastTransaction(tx); go('success') }} onNavigate={go} isOwner={userRole === 'owner'} />
          )}
          {currentScreen === 'success' && (
            <SuccessScreen transaction={lastTransaction} onNewTransaction={() => go('checkout')} />
          )}
          {currentScreen === 'history' && (
            <TransactionHistoryScreen onBack={() => go('checkout')} />
          )}
          {currentScreen === 'manageProducts' && (
            <ManageProductsScreen onBack={() => go(getBackTarget())} backLabel={getBackLabel()} onNavigate={(s) => go(s as Screen)} />
          )}
          {currentScreen === 'managePromo' && (
            <ManagePromoScreen onBack={() => go(getBackTarget())} backLabel={getBackLabel()} />
          )}
          {currentScreen === 'stokOpname' && (
            <StokOpnameScreen onBack={() => go(getBackTarget())} backLabel={getBackLabel()} />
          )}
          {currentScreen === 'stockIn' && (
            <StockInScreen onBack={() => go(getBackTarget())} backLabel={getBackLabel()} />
          )}
          {currentScreen === 'reports' && (
            <ReportScreen onBack={() => go(getBackTarget())} backLabel={getBackLabel()} />
          )}
          {currentScreen === 'tutupShift' && (
            <TutupShiftScreen onShiftClose={(s) => { setLastShiftSummary(s); go('shiftSummary') }} onBack={() => go('checkout')} />
          )}
          {currentScreen === 'shiftSummary' && lastShiftSummary && (
            <ShiftSummaryScreen summary={lastShiftSummary} onDone={() => { setUserRole(null); go('login') }} />
          )}
          {currentScreen === 'settings' && (
            <SettingsScreen onBack={() => go(getBackTarget())} backLabel={getBackLabel()} />
          )}
          {currentScreen === 'pettyCash' && (
            <PettyCashScreen onBack={() => go(getBackTarget())} backLabel={getBackLabel()} />
          )}
          {currentScreen === 'ownerDashboard' && (
            userRole === 'owner' ? (
              <OwnerDashboardScreen onBack={() => { setUserRole(null); go('login') }} onNavigate={go} />
            ) : (
              <CheckoutScreen onSuccess={() => go('success')} onNavigate={go} isOwner={false} />
            )
          )}
          {currentScreen === 'qrMenu' && (
            <QrMenuScreen onBack={() => go(getBackTarget())} backLabel={getBackLabel()} />
          )}
          {currentScreen === 'kelolaResep' && (
            userRole === 'owner' ? (
              <KelolaResepScreen onBack={() => go('manageProducts')} />
            ) : (
              <CheckoutScreen onSuccess={() => go('success')} onNavigate={go} isOwner={false} />
            )
          )}
          {currentScreen === 'kelolaBahanBaku' && (
            userRole === 'owner' ? (
              <KelolaBahanBakuScreen onBack={() => go('ownerDashboard')} />
            ) : (
              <CheckoutScreen onSuccess={() => go('success')} onNavigate={go} isOwner={false} />
            )
          )}
        </div>
      </div>
    </AppProvider>
  )
}

export default App
