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
import Sidebar from './components/Sidebar'
import { SidebarProvider } from './context/SidebarContext'

function App() {
  const [currentScreen, setCurrentScreen] = useState<'login' | 'bukaShift' | 'checkout' | 'success' | 'manageProducts' | 'managePromo' | 'stokOpname' | 'reports' | 'tutupShift' | 'settings' | 'pettyCash' | 'ownerDashboard' | 'qrMenu'>('login')
  const [userRole, setUserRole] = useState<'kasir' | 'owner' | null>(null)

  const renderScreen = () => {
    switch (currentScreen) {
      case 'checkout': return <CheckoutScreen onSuccess={() => setCurrentScreen('success')} />
      case 'manageProducts': return <ManageProductsScreen onBack={() => setCurrentScreen('checkout')} />
      case 'managePromo': return <ManagePromoScreen onBack={() => setCurrentScreen('checkout')} />
      case 'stokOpname': return <StokOpnameScreen onBack={() => setCurrentScreen('checkout')} />
      case 'reports': return <ReportScreen onBack={() => setCurrentScreen('checkout')} />
      case 'tutupShift': return <TutupShiftScreen onLogout={() => setCurrentScreen('login')} onBack={() => setCurrentScreen('checkout')} />
      case 'settings': return <SettingsScreen onBack={() => setCurrentScreen('checkout')} />
      case 'ownerDashboard': return <OwnerDashboardScreen onBack={() => setCurrentScreen('checkout')} />
      case 'qrMenu': return <QrMenuScreen onBack={() => setCurrentScreen('checkout')} />
      case 'pettyCash':
        return (
          <div className="flex flex-col w-full h-full">
            <PettyCashScreen onBack={() => setCurrentScreen('checkout')} />
          </div>
        )
      default: return null
    }
  }

  return (
    <div className="flex flex-col w-full h-screen bg-background font-sans overflow-hidden">
      {/* Global Offline Banner */}
      <div className="bg-[#F6EBD5] text-[#915B30] text-[13px] font-bold px-4 py-2.5 flex justify-center items-center border-b border-[#E3D1B4] shrink-0 z-50">
        <div className="flex items-center gap-2">
          <div className="w-2.5 h-2.5 rounded-full bg-[#C78749]" />
          <span>Mode Offline Aktif &bull; 3 transaksi menunggu sinkronisasi</span>
        </div>
      </div>

      <div className="flex-1 flex flex-col overflow-hidden">
        {currentScreen === 'login' && <LoginScreen onLogin={(role) => {
          setUserRole(role)
          setCurrentScreen(role === 'owner' ? 'ownerDashboard' : 'bukaShift')
        }} />}
        {currentScreen === 'bukaShift' && <BukaShiftScreen onBukaShift={() => setCurrentScreen('checkout')} />}
        {currentScreen === 'success' && <SuccessScreen onNewTransaction={() => setCurrentScreen('checkout')} />}
        
        {/* Layout with Sidebar for Authenticated Screens */}
        {currentScreen !== 'login' && currentScreen !== 'bukaShift' && currentScreen !== 'success' && (
          <SidebarProvider>
            <div className="flex flex-1 overflow-hidden w-full h-full relative">
              <Sidebar 
                activeScreen={currentScreen} 
                onNavigate={(screen: any) => setCurrentScreen(screen as any)}
                userRole={userRole}
              />
              <div className="flex flex-col flex-1 overflow-hidden relative">
                {renderScreen()}
              </div>
            </div>
          </SidebarProvider>
        )}
      </div>
    </div>
  )
}

export default App
