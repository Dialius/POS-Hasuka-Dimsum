// Shared shell for back-office pages (Laporan, Produk, Promo, Stok Opname, Petty Cash, Tutup Shift, Settings)
// DNA: dark left stripe (72px) matching checkout Zone 1, page title area with serif, warm cream bg

import { useState, type ReactNode } from 'react'
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
  LogOut,
  Menu,
  X
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
  rightPanelTitle?: string
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
  rightPanelTitle,
  onNavigate,
  activeNav
}: PageShellProps) {
  const { receiptSettings } = useApp()
  const displayLogo = receiptSettings?.logoUrl || HASUKA_LOGO
  const isOwnerNav = (backLabel === 'Owner' || backLabel === 'Keluar') && Boolean(onNavigate)
  const [mobileTab, setMobileTab] = useState<'content' | 'panel'>('content')
  const [isMobileDrawerOpen, setIsMobileDrawerOpen] = useState(false)

  const activeNavItem = OWNER_NAV_ITEMS.find(item => item.screen === activeNav)

  return (
    <div className="flex flex-col md:flex-row w-full h-full overflow-hidden" style={{ background: '#FAF6ED' }}>

      {/* ── Mobile Nav Drawer Overlay ── */}
      {isMobileDrawerOpen && (
        <div className="fixed inset-0 z-50 flex md:hidden">
          <div
            className="fixed inset-0 bg-black/50 backdrop-blur-sm transition-opacity"
            onClick={() => setIsMobileDrawerOpen(false)}
          />
          <div
            className="relative w-72 max-w-[80vw] h-full flex flex-col z-10 shadow-2xl animate-in slide-in-from-left duration-200"
            style={{ background: '#2B1810' }}
          >
            <div className="p-4 flex items-center justify-between border-b border-[#C49A6240]">
              <div className="flex items-center gap-2.5">
                <img src={displayLogo} alt="Hasuka" className="w-8 h-8 object-contain rounded-full shadow" />
                <div>
                  <h3 className="font-serif font-bold text-[14px] text-[#F3E7CE]">Hasuka Dimsum</h3>
                  <p className="text-[10px] text-[#C49A62]">Owner Navigation</p>
                </div>
              </div>
              <button
                onClick={() => setIsMobileDrawerOpen(false)}
                className="w-8 h-8 flex items-center justify-center rounded-xl text-[#C49A62] hover:bg-white/10 active:bg-white/20"
                aria-label="Tutup menu navigasi"
              >
                <X size={18} />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto custom-scrollbar p-3 space-y-1">
              {OWNER_NAV_ITEMS.map(item => {
                const Icon = item.icon
                const isActive = activeNav === item.screen
                return (
                  <button
                    key={item.screen}
                    onClick={() => {
                      setIsMobileDrawerOpen(false)
                      if (onNavigate) onNavigate(item.screen)
                    }}
                    className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-left transition-all ${
                      isActive
                        ? 'font-bold shadow-sm'
                        : 'text-[#C49A62] hover:bg-white/10 active:bg-white/15'
                    }`}
                    style={{
                      background: isActive ? '#F3E7CE' : 'transparent',
                      color: isActive ? '#2B1810' : '#C49A62',
                      border: isActive ? '1px solid #E8D7C0' : '1px solid transparent'
                    }}
                  >
                    <Icon size={18} color={isActive ? '#2B1810' : '#C49A62'} strokeWidth={isActive ? 2.5 : 2} />
                    <span className="text-[13px]">{item.label}</span>
                  </button>
                )
              })}
            </div>

            <div className="p-3 border-t border-[#C49A6240]">
              <button
                onClick={() => {
                  setIsMobileDrawerOpen(false)
                  onBack()
                }}
                className="w-full flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl bg-red-500/15 hover:bg-red-500/25 text-[#E57373] text-[12px] font-bold transition-colors"
              >
                <LogOut size={16} />
                <span>{backLabel ? `Keluar (${backLabel})` : 'Keluar'}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Top Bar (Mobile < md) / Sidebar (Tablet & Desktop md+) ── */}
      <div
        className="flex md:flex-col items-center shrink-0 px-3 md:px-0 py-0 md:py-3 z-30"
        style={{ background: '#2B1810' }}
      >
        {/* Mobile: horizontal strip */}
        <div className="flex md:hidden items-center w-full h-[52px] gap-2 justify-between">
          <button
            onClick={onBack}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl transition-colors hover:bg-white/10 active:bg-white/20"
          >
            <ArrowLeft size={16} color="#C49A62" />
            <span className="text-[11px] font-bold text-[#C49A62]">{backLabel || 'Kasir'}</span>
          </button>
          
          {isOwnerNav && onNavigate ? (
            <button
              onClick={() => setIsMobileDrawerOpen(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl transition-colors bg-[#3E2419] border border-[#C49A6260] text-[#F3E7CE] hover:bg-[#4E3022]"
            >
              {activeNavItem && <activeNavItem.icon size={14} color="#F3E7CE" />}
              <span className="text-[12px] font-bold">{activeNavItem?.label || 'Menu Navigasi'}</span>
              <Menu size={14} color="#C49A62" className="ml-0.5" />
            </button>
          ) : (
            <span className="font-serif font-bold text-[14px] text-[#F3E7CE] truncate max-w-[160px]">{title}</span>
          )}

          <img src={displayLogo} alt="Hasuka" className="w-8 h-8 object-contain rounded-full" />
        </div>

        {/* Tablet & Desktop: vertical sidebar */}
        {!isOwnerNav ? (
          <div className="hidden md:flex flex-col items-center gap-4 py-5 w-[68px] lg:w-[72px]">
            <img src={displayLogo} alt="Hasuka" className="w-9 h-9 object-contain rounded-full" />
            <div style={{ width: 40, height: 1, background: '#C49A6240' }} />
            <button
              onClick={onBack}
              className="flex flex-col items-center gap-1 px-1 py-2 rounded-xl w-full transition-colors hover:bg-white/10"
              title={backLabel ? `Kembali (${backLabel})` : 'Kembali ke Kasir'}
            >
              <ArrowLeft size={18} color="#C49A62" />
              <span className="text-[8px] font-bold text-center text-[#C49A62]">{backLabel || 'Kasir'}</span>
            </button>
          </div>
        ) : (
          <div
            className="hidden md:flex flex-col items-center justify-between shrink-0 select-none h-full w-[68px] lg:w-[76px]"
          >
            {/* Top Logo */}
            <div className="flex flex-col items-center gap-2 w-full pt-1">
              <button
                onClick={() => onNavigate ? onNavigate('ownerDashboard') : onBack()}
                className="p-1 rounded-full transition-transform hover:scale-105 active:scale-95"
                title="Hasuka Dimsum POS"
              >
                <img src={displayLogo} alt="Hasuka" className="w-9 h-9 lg:w-10 lg:h-10 object-contain rounded-full shadow" />
              </button>
              <div style={{ width: 40, height: 1, background: '#C49A6230' }} />
            </div>

            {/* Navigation Items */}
            <div className="flex-1 w-full flex flex-col items-center gap-1 my-2 overflow-y-auto custom-scrollbar px-1 min-h-0">
              {OWNER_NAV_ITEMS.map(item => {
                const Icon = item.icon
                const isActive = activeNav === item.screen
                return (
                  <button
                    key={item.screen}
                    onClick={() => onNavigate && onNavigate(item.screen)}
                    className={`w-full py-2 px-0.5 rounded-xl flex flex-col items-center justify-center gap-0.5 transition-all text-center group ${
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
                    <Icon size={16} color={isActive ? '#2B1810' : '#C49A62'} strokeWidth={isActive ? 2.5 : 2} />
                    <span
                      className="text-[8px] lg:text-[8.5px] font-bold tracking-tight leading-none text-center truncate max-w-full"
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
              <div style={{ width: 40, height: 1, background: '#C49A6230' }} />
              <button
                onClick={onBack}
                className="w-12 lg:w-14 py-2 rounded-xl flex flex-col items-center gap-1 transition-all hover:bg-red-500/20 active:bg-red-500/30 group"
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

      {/* ── Main Area ── */}
      <div className="flex flex-col md:flex-row flex-1 overflow-hidden">

        {/* Optional Mobile Segmented Tab Switch (when rightPanel exists) */}
        {rightPanel && (
          <div className="flex md:hidden px-3 pt-2 pb-1 bg-[#FAF6ED] shrink-0 border-b border-[#E8D7C0]">
            <div className="flex w-full p-1 bg-[#E8D7C060] rounded-xl">
              <button
                onClick={() => setMobileTab('content')}
                className={`flex-1 py-1.5 text-[12px] font-bold rounded-lg transition-all ${
                  mobileTab === 'content'
                    ? 'bg-white text-[#2B1810] shadow-sm'
                    : 'text-[#6B5448]'
                }`}
              >
                {title || 'Utama'}
              </button>
              <button
                onClick={() => setMobileTab('panel')}
                className={`flex-1 py-1.5 text-[12px] font-bold rounded-lg transition-all ${
                  mobileTab === 'panel'
                    ? 'bg-[#8B4A1E] text-white shadow-sm'
                    : 'text-[#6B5448]'
                }`}
              >
                {rightPanelTitle || 'Detail / Form'}
              </button>
            </div>
          </div>
        )}

        {/* Content Column — visible on desktop/tablet, or conditionally on mobile */}
        <div className={`flex flex-col flex-1 overflow-hidden order-1 ${
          rightPanel && mobileTab === 'panel' ? 'hidden md:flex' : 'flex'
        }`}>
          {/* Page title bar */}
          <div className="px-4 md:px-6 py-2.5 md:py-3.5 shrink-0 flex items-center justify-between gap-3" style={{ borderBottom: '1px solid #E8D7C0', background: '#FAF6ED' }}>
            <div className="min-w-0 flex-1">
              <h1 className="font-serif font-bold text-[16px] md:text-[20px] lg:text-[22px] leading-tight truncate" style={{ color: '#2B1810' }}>{title}</h1>
              {subtitle && <p className="text-[10px] md:text-[11px] lg:text-[12px] mt-0.5 truncate text-[#6B5448]">{subtitle}</p>}
            </div>
            {headerRight && <div className="shrink-0">{headerRight}</div>}
          </div>

          {/* Scrollable content */}
          <div className="flex-1 overflow-y-auto custom-scrollbar">
            {children}
          </div>
        </div>

        {/* Right Panel — visible on desktop/tablet side-by-side, or on mobile when mobileTab === 'panel' */}
        {rightPanel && (
          <div
            className={`shrink-0 flex flex-col overflow-y-auto custom-scrollbar border-t-0 md:border-l-4 border-[#8B4A1E] order-2 ${
              mobileTab === 'panel' ? 'flex flex-1 md:flex-initial' : 'hidden md:flex'
            }`}
            style={{
              background: '#F3E7CE',
            }}
          >
            {/* Mobile View: Full Width */}
            <div className="w-full md:hidden flex-1 flex flex-col">
              {rightPanel}
            </div>

            {/* Tablet & Desktop View: Adaptive Clamped Width */}
            <div
              className="hidden md:block h-full"
              style={{
                width: `clamp(280px, 32vw, ${rightPanelWidth}px)`
              }}
            >
              {rightPanel}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
