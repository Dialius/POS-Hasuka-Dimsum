// Shared shell for back-office pages (Laporan, Produk, Promo, Stok Opname, Petty Cash, Tutup Shift, Settings)
// DNA: dark left stripe (72px) matching checkout Zone 1, page title area with serif, warm cream bg

import { type ReactNode } from 'react'
import {
  ArrowLeft,
  LayoutDashboard,
  Package,
  ChefHat,
  Layers,
  Tag,
  ArrowDownToLine,
  ClipboardCheck,
  BarChart2,
  Settings,
  LogOut
} from 'lucide-react'
import { HASUKA_LOGO } from '../assets/logo'
import { useApp } from '../context/AppContext'

const OWNER_NAV_ITEMS = [
  { screen: 'ownerDashboard', label: 'Ringkasan', icon: LayoutDashboard },
  { screen: 'manageProducts', label: 'Menu', icon: Package },
  { screen: 'kelolaResep', label: 'Resep', icon: ChefHat },
  { screen: 'kelolaBahanBaku', label: 'Bahan', icon: Layers },
  { screen: 'managePromo', label: 'Promo', icon: Tag },
  { screen: 'stockIn', label: 'Stok In', icon: ArrowDownToLine },
  { screen: 'stokOpname', label: 'Opname', icon: ClipboardCheck },
  { screen: 'reports', label: 'Laporan', icon: BarChart2 },
  { screen: 'settings', label: 'Setting', icon: Settings },
]

interface PageShellProps {
  title: string
  subtitle?: string
  onBack: () => void
  backLabel?: string
  headerRight?: ReactNode
  children: ReactNode
  /** Optional right-side panel (e.g. form panel, numpad). If given, content is split left/right. */
  rightPanel?: ReactNode
  rightPanelWidth?: number
  onNavigate?: (screen: any) => void
  activeNav?: string
}

export default function PageShell({
  title,
  subtitle,
  onBack,
  backLabel,
  headerRight,
  children,
  rightPanel,
  rightPanelWidth = 380,
  onNavigate,
  activeNav
}: PageShellProps) {
  const { receiptSettings } = useApp()
  const displayLogo = receiptSettings?.logoUrl || HASUKA_LOGO
  const isOwnerNav = (backLabel === 'Owner' || backLabel === 'Keluar') && Boolean(onNavigate)

  return (
    <div className="flex flex-col sm:flex-row w-full h-full overflow-hidden" style={{ background: '#FAF6ED' }}>

      {/* Dark stripe — top bar on mobile, left sidebar on sm+ */}
      <div
        className="flex sm:flex-col items-center shrink-0 px-4 sm:px-0 py-0 sm:py-3 z-30"
        style={{ background: '#2B1810', width: undefined, minHeight: undefined }}
      >
        {/* Mobile: horizontal strip */}
        <div className="flex sm:hidden items-center w-full h-[52px] gap-2 px-1 justify-between">
          <button
            onClick={onBack}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl transition-colors hover:bg-white/10 active:bg-white/20"
          >
            <ArrowLeft size={16} color="#C49A62" />
            <span className="text-[11px] font-bold" style={{ color: '#C49A62' }}>{backLabel || 'Kasir'}</span>
          </button>
          
          {isOwnerNav && onNavigate && (
            <select
              value={activeNav || 'ownerDashboard'}
              onChange={(e) => onNavigate(e.target.value)}
              className="px-2 py-1 rounded-lg text-[11px] font-bold outline-none border border-[#C49A6260]"
              style={{ background: '#3E2419', color: '#F3E7CE' }}
            >
              {OWNER_NAV_ITEMS.map(item => (
                <option key={item.screen} value={item.screen} style={{ background: '#2B1810', color: '#FAF6ED' }}>
                  {item.label}
                </option>
              ))}
            </select>
          )}

          <img src={displayLogo} alt="Hasuka" className="w-8 h-8 object-contain rounded-full" />
        </div>

        {/* Desktop: vertical stripe */}
        {!isOwnerNav ? (
          <div className="hidden sm:flex flex-col items-center gap-4 py-5" style={{ width: 72 }}>
            <img src={displayLogo} alt="Hasuka" className="w-9 h-9 object-contain rounded-full" />
            <div style={{ width: 40, height: 1, background: '#C49A6240' }} />
            <button
              onClick={onBack}
              className="flex flex-col items-center gap-1 px-1 py-2 rounded-xl w-full transition-colors hover:bg-white/10"
              title={backLabel ? `Kembali (${backLabel})` : 'Kembali ke Kasir'}
            >
              <ArrowLeft size={18} color="#C49A62" />
              <span className="text-[8px] font-bold text-center" style={{ color: '#C49A62' }}>{backLabel || 'Kasir'}</span>
            </button>
          </div>
        ) : (
          <div
            className="hidden sm:flex flex-col items-center justify-between shrink-0 select-none h-full"
            style={{ width: 76 }}
          >
            {/* Top Logo */}
            <div className="flex flex-col items-center gap-2 w-full pt-1">
              <button
                onClick={() => onNavigate ? onNavigate('ownerDashboard') : onBack()}
                className="p-1 rounded-full transition-transform hover:scale-105 active:scale-95"
                title="Hasuka Dimsum POS"
              >
                <img src={displayLogo} alt="Hasuka" className="w-10 h-10 object-contain rounded-full shadow" />
              </button>
              <div style={{ width: 44, height: 1, background: '#C49A6230' }} />
            </div>

            {/* Navigation Items */}
            <div className="flex-1 w-full flex flex-col items-center gap-1 my-2 overflow-y-auto custom-scrollbar px-1.5 min-h-0">
              {OWNER_NAV_ITEMS.map(item => {
                const Icon = item.icon
                const isActive = activeNav === item.screen
                return (
                  <button
                    key={item.screen}
                    onClick={() => onNavigate && onNavigate(item.screen)}
                    className={`w-full py-1.5 px-0.5 rounded-xl flex flex-col items-center justify-center gap-0.5 transition-all text-center group ${
                      isActive
                        ? 'shadow-sm'
                        : 'hover:bg-white/10 active:bg-white/15'
                    }`}
                    style={{
                      background: isActive ? '#F3E7CE' : 'transparent',
                      border: isActive ? '1px solid #E8D7C0' : '1px solid transparent',
                    }}
                    title={item.label}
                  >
                    <Icon size={17} color={isActive ? '#2B1810' : '#C49A62'} strokeWidth={isActive ? 2.5 : 2} />
                    <span
                      className="text-[8.5px] font-bold tracking-tight leading-none text-center truncate max-w-full"
                      style={{ color: isActive ? '#2B1810' : '#C49A62' }}
                    >
                      {item.label}
                    </span>
                  </button>
                )
              })}
            </div>

            {/* Bottom Action: Keluar */}
            <div className="flex flex-col items-center gap-2 w-full pb-1">
              <div style={{ width: 44, height: 1, background: '#C49A6230' }} />
              <button
                onClick={onBack}
                className="w-14 py-2 rounded-xl flex flex-col items-center gap-1 transition-all hover:bg-red-500/20 active:bg-red-500/30 group"
                title={backLabel ? `Keluar (${backLabel})` : 'Keluar'}
              >
                <LogOut size={16} color="#E57373" className="group-hover:scale-110 transition-transform" />
                <span className="text-[8px] font-bold text-[#E57373]">
                  {backLabel || 'Keluar'}
                </span>
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Main area */}
      <div className="flex flex-col sm:flex-row flex-1 overflow-hidden">

        {/* Content column — always first on mobile, left on desktop */}
        <div className="flex flex-col flex-1 overflow-hidden order-1 sm:order-1">
          {/* Page title bar */}
          <div className="px-4 sm:px-6 py-2.5 sm:py-4 shrink-0 flex items-center justify-between gap-3" style={{ borderBottom: '1px solid #E8D7C0', background: '#FAF6ED' }}>
            <div className="min-w-0 flex-1">
              <h1 className="font-serif font-bold text-[16px] sm:text-[22px] leading-tight truncate" style={{ color: '#2B1810' }}>{title}</h1>
              {subtitle && <p className="text-[10px] sm:text-[12px] mt-0.5 truncate" style={{ color: '#6B5448' }}>{subtitle}</p>}
            </div>
            {headerRight && <div className="shrink-0">{headerRight}</div>}
          </div>

          {/* Scrollable content */}
          <div className="flex-1 overflow-y-auto custom-scrollbar">
            {children}
          </div>
        </div>

        {/* Optional right panel — below content on mobile, side panel on sm+ */}
        {rightPanel && (
          <div
            className="shrink-0 flex flex-col overflow-y-auto custom-scrollbar border-t-4 sm:border-t-0 sm:border-l-4 border-[#8B4A1E] w-full sm:w-auto max-h-[45vh] sm:max-h-none order-2 sm:order-2"
            style={{ background: '#F3E7CE' }}
          >
            <div style={{ width: '100%' }} className="sm:hidden">{rightPanel}</div>
            <div className="hidden sm:block h-full" style={{ width: rightPanelWidth }}>{rightPanel}</div>
          </div>
        )}
      </div>
    </div>
  )
}
