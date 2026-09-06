import { useState } from 'react'
import LoginScreen from './components/LoginScreen'
import BukaShiftScreen from './components/BukaShiftScreen'
import CheckoutScreen from './components/CheckoutScreen'
import SuccessScreen from './components/SuccessScreen'
import ManageProductsScreen from './components/ManageProductsScreen'
import ReportScreen from './components/ReportScreen'
import TutupShiftScreen from './components/TutupShiftScreen'
import SettingsScreen from './components/SettingsScreen'
import PettyCashScreen from './components/PettyCashScreen'
import ManagePromoScreen from './components/ManagePromoScreen'
import StokOpnameScreen from './components/StokOpnameScreen'
import OwnerDashboardScreen from './components/OwnerDashboardScreen'
import QrMenuScreen from './components/QrMenuScreen'

type Screen =
  | 'login' | 'bukaShift' | 'checkout' | 'success'
  | 'manageProducts' | 'managePromo' | 'stokOpname'
  | 'reports' | 'tutupShift' | 'settings' | 'pettyCash'
  | 'ownerDashboard' | 'qrMenu'

function App() {
  const [currentScreen, setCurrentScreen] = useState<Screen>('login')

  const go = (s: Screen) => setCurrentScreen(s)

  return (
    <div className="flex flex-col w-full h-screen bg-background font-sans overflow-hidden">

      {/* Global Offline Banner — only shown when actually offline (hardcoded demo off) */}
      {/* Uncomment when offline state is wired:
      <div className="bg-[#F6EBD5] text-[#915B30] text-[13px] font-bold px-4 py-2.5 flex justify-center items-center border-b border-[#E3D1B4] shrink-0 z-50">
        <div className="w-2.5 h-2.5 rounded-full bg-[#C78749] mr-2" />
        Mode Offline Aktif · 3 transaksi menunggu sinkronisasi
      </div>
      */}

      <div className="flex-1 overflow-hidden">
        {currentScreen === 'login' && (
          <LoginScreen onLogin={(role) => {
            go(role === 'owner' ? 'ownerDashboard' : 'bukaShift')
          }} />
        )}
        {currentScreen === 'bukaShift' && (
          <BukaShiftScreen onBukaShift={() => go('checkout')} />
        )}
        {currentScreen === 'checkout' && (
          <CheckoutScreen onSuccess={() => go('success')} onNavigate={go} />
        )}
        {currentScreen === 'success' && (
          <SuccessScreen onNewTransaction={() => go('checkout')} />
        )}
        {currentScreen === 'manageProducts' && (
          <ManageProductsScreen onBack={() => go('checkout')} />
        )}
        {currentScreen === 'managePromo' && (
          <ManagePromoScreen onBack={() => go('checkout')} />
        )}
        {currentScreen === 'stokOpname' && (
          <StokOpnameScreen onBack={() => go('checkout')} />
        )}
        {currentScreen === 'reports' && (
          <ReportScreen onBack={() => go('checkout')} />
        )}
        {currentScreen === 'tutupShift' && (
          <TutupShiftScreen onLogout={() => go('login')} onBack={() => go('checkout')} />
        )}
        {currentScreen === 'settings' && (
          <SettingsScreen onBack={() => go('checkout')} />
        )}
        {currentScreen === 'pettyCash' && (
          <PettyCashScreen onBack={() => go('checkout')} />
        )}
        {currentScreen === 'ownerDashboard' && (
          <OwnerDashboardScreen onBack={() => go('checkout')} />
        )}
        {currentScreen === 'qrMenu' && (
          <QrMenuScreen onBack={() => go('checkout')} />
        )}
      </div>
    </div>
  )
}

export default App
