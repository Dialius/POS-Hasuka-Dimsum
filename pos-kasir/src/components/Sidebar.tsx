import { Store, LineChart, FileText, PackageSearch, QrCode, Settings, Wallet, LogOut, ChefHat } from 'lucide-react'
import { HASUKA_LOGO } from '../assets/logo'

import { useSidebar } from '../context/SidebarContext'

interface SidebarProps {
  activeScreen: string
  onNavigate: (screen: string) => void
  userRole?: 'kasir' | 'owner' | null
}

export default function Sidebar({ activeScreen, onNavigate, userRole }: SidebarProps) {
  const { isSidebarOpen } = useSidebar()

  return (
    <div className={`hidden md:flex flex-col bg-white border-r border-borderLight shrink-0 z-20 overflow-y-auto scrollbar-hide transition-all duration-300 ${isSidebarOpen ? 'w-[80px] py-4' : 'w-0 opacity-0 overflow-hidden'}`}>
      <img src={HASUKA_LOGO} alt="Hasuka Logo" className="w-12 h-12 object-contain mb-8 mx-auto shrink-0" />
      
      <div className="flex flex-col gap-5 flex-1 w-full px-3 items-center shrink-0">
        <button 
          onClick={() => onNavigate('checkout')}
          className={`flex flex-col items-center justify-center gap-1.5 w-full group ${activeScreen === 'checkout' ? 'text-primary' : 'text-textSecondary hover:text-primary transition-colors'}`} 
          title="POS Kasir"
        >
          <div className={`w-12 h-12 rounded-xl flex items-center justify-center transition-colors ${activeScreen === 'checkout' ? 'bg-[#FFF4ED] shadow-sm' : 'group-hover:bg-surface'}`}>
            <Store size={22} strokeWidth={activeScreen === 'checkout' ? 2.5 : 2} />
          </div>
          <span className={`text-[10px] text-center leading-none ${activeScreen === 'checkout' ? 'font-extrabold' : 'font-bold'}`}>Kasir</span>
        </button>
        
        {userRole === 'owner' && (
          <button 
            onClick={() => onNavigate('ownerDashboard')} 
            className={`flex flex-col items-center justify-center gap-1.5 w-full group ${activeScreen === 'ownerDashboard' ? 'text-primary' : 'text-textSecondary hover:text-primary transition-colors'}`} 
            title="Owner Dashboard"
          >
            <div className={`w-12 h-12 rounded-xl flex items-center justify-center transition-colors ${activeScreen === 'ownerDashboard' ? 'bg-[#FFF4ED] shadow-sm' : 'group-hover:bg-surface'}`}>
              <LineChart size={22} strokeWidth={activeScreen === 'ownerDashboard' ? 2.5 : 2} />
            </div>
            <span className={`text-[10px] text-center leading-none ${activeScreen === 'ownerDashboard' ? 'font-extrabold' : 'font-bold'}`}>Dashboard</span>
          </button>
        )}

        {userRole === 'owner' && (
          <button 
            onClick={() => onNavigate('kelolaResep')} 
            className={`flex flex-col items-center justify-center gap-1.5 w-full group ${activeScreen === 'kelolaResep' ? 'text-primary' : 'text-textSecondary hover:text-primary transition-colors'}`} 
            title="Kelola Resep"
          >
            <div className={`w-12 h-12 rounded-xl flex items-center justify-center transition-colors ${activeScreen === 'kelolaResep' ? 'bg-[#FFF4ED] shadow-sm' : 'group-hover:bg-surface'}`}>
              <ChefHat size={22} strokeWidth={activeScreen === 'kelolaResep' ? 2.5 : 2} />
            </div>
            <span className={`text-[10px] text-center leading-none ${activeScreen === 'kelolaResep' ? 'font-extrabold' : 'font-bold'}`}>Resep</span>
          </button>
        )}
        
        <button 
          onClick={() => onNavigate('reports')} 
          className={`flex flex-col items-center justify-center gap-1.5 w-full group ${activeScreen === 'reports' ? 'text-primary' : 'text-textSecondary hover:text-primary transition-colors'}`} 
          title="Laporan"
        >
          <div className={`w-12 h-12 rounded-xl flex items-center justify-center transition-colors ${activeScreen === 'reports' ? 'bg-[#FFF4ED] shadow-sm' : 'group-hover:bg-surface'}`}>
            <FileText size={22} strokeWidth={activeScreen === 'reports' ? 2.5 : 2} />
          </div>
          <span className={`text-[10px] text-center leading-none ${activeScreen === 'reports' ? 'font-extrabold' : 'font-bold'}`}>Laporan</span>
        </button>
        
        <button 
          onClick={() => onNavigate('manageProducts')} 
          className={`flex flex-col items-center justify-center gap-1.5 w-full group ${activeScreen === 'manageProducts' ? 'text-primary' : 'text-textSecondary hover:text-primary transition-colors'}`} 
          title="Manajemen Produk"
        >
          <div className={`w-12 h-12 rounded-xl flex items-center justify-center transition-colors ${activeScreen === 'manageProducts' ? 'bg-[#FFF4ED] shadow-sm' : 'group-hover:bg-surface'}`}>
            <PackageSearch size={22} strokeWidth={activeScreen === 'manageProducts' ? 2.5 : 2} />
          </div>
          <span className={`text-[10px] text-center leading-none ${activeScreen === 'manageProducts' ? 'font-extrabold' : 'font-bold'}`}>Produk</span>
        </button>
        
        <button 
          onClick={() => onNavigate('qrMenu')} 
          className={`flex flex-col items-center justify-center gap-1.5 w-full group ${activeScreen === 'qrMenu' ? 'text-primary' : 'text-textSecondary hover:text-primary transition-colors'}`} 
          title="QR Menu"
        >
          <div className={`w-12 h-12 rounded-xl flex items-center justify-center transition-colors ${activeScreen === 'qrMenu' ? 'bg-[#FFF4ED] shadow-sm' : 'group-hover:bg-surface'}`}>
            <QrCode size={22} strokeWidth={activeScreen === 'qrMenu' ? 2.5 : 2} />
          </div>
          <span className={`text-[10px] text-center leading-none ${activeScreen === 'qrMenu' ? 'font-extrabold' : 'font-bold'}`}>QR Menu</span>
        </button>
        
        <button 
          onClick={() => onNavigate('settings')} 
          className={`flex flex-col items-center justify-center gap-1.5 w-full group ${activeScreen === 'settings' ? 'text-primary' : 'text-textSecondary hover:text-primary transition-colors'}`} 
          title="Pengaturan"
        >
          <div className={`w-12 h-12 rounded-xl flex items-center justify-center transition-colors ${activeScreen === 'settings' ? 'bg-[#FFF4ED] shadow-sm' : 'group-hover:bg-surface'}`}>
            <Settings size={22} strokeWidth={activeScreen === 'settings' ? 2.5 : 2} />
          </div>
          <span className={`text-[10px] text-center leading-none ${activeScreen === 'settings' ? 'font-extrabold' : 'font-bold'}`}>Settings</span>
        </button>
      </div>
      
      <div className="flex flex-col gap-5 w-full px-3 mt-auto pt-6 shrink-0 items-center">
        <button 
          onClick={() => onNavigate('pettyCash')} 
          className={`flex flex-col items-center justify-center gap-1.5 w-full group ${activeScreen === 'pettyCash' ? 'text-primary' : 'text-textSecondary hover:text-primary transition-colors'}`} 
          title="Petty Cash"
        >
          <div className={`w-12 h-12 rounded-xl flex items-center justify-center transition-colors ${activeScreen === 'pettyCash' ? 'bg-[#FFF4ED] shadow-sm' : 'group-hover:bg-surface'}`}>
            <Wallet size={22} strokeWidth={activeScreen === 'pettyCash' ? 2.5 : 2} />
          </div>
          <span className={`text-[10px] text-center leading-none ${activeScreen === 'pettyCash' ? 'font-extrabold' : 'font-bold'}`}>Petty Cash</span>
        </button>
        
        <button 
          onClick={() => onNavigate('tutupShift')} 
          className="flex flex-col items-center justify-center gap-1.5 w-full text-[#C53030] hover:text-[#9B2C2C] group transition-colors" 
          title="Tutup Shift"
        >
          <div className="w-12 h-12 rounded-xl group-hover:bg-red-50 flex items-center justify-center transition-colors">
            <LogOut size={22} />
          </div>
          <span className="text-[10px] font-bold text-center leading-none">Tutup Shift</span>
        </button>
      </div>
    </div>
  )
}
