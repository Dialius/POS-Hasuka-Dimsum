import { useState, useEffect } from 'react'
import { AppProvider, useApp } from './context/AppContext'
import { HASUKA_LOGO } from './assets/logo'
import { AlertToastHost } from './components/Alert'
import LoginScreen from './components/LoginScreen'
import BukaShiftScreen from './components/BukaShiftScreen'
import CheckoutScreen from './components/CheckoutScreen'
import SuccessScreen from './components/SuccessScreen'
import ManageProductsScreen from './components/ManageProductsScreen'
import ReportScreen from './components/ReportScreen'
import TutupShiftScreen from './components/TutupShiftScreen'
import ShiftSummaryScreen from './components/ShiftSummaryScreen'
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

function App() {
  const [currentScreen, setCurrentScreen] = useState<Screen>('login')
  const [userRole, setUserRole] = useState<'owner' | 'kasir' | null>(null)
  const [lastTransaction, setLastTransaction] = useState<any>(null)

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

  // Global Toasts for GAS Sync Errors
  const [globalToasts, setGlobalToasts] = useState<{ id: string; variant: 'destructive'; title: string; description?: string }[]>([])

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
            <TutupShiftScreen onShiftClose={() => go('shiftSummary')} onBack={() => go('checkout')} />
          )}
          {currentScreen === 'shiftSummary' && (
            <ShiftSummaryScreen onDone={() => { setUserRole(null); go('login') }} />
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
