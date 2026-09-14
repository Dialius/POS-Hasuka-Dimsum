// Shared shell for back-office pages (Laporan, Produk, Promo, Stok Opname, Petty Cash, Tutup Shift, Settings)
// DNA: dark left stripe (72px) matching checkout Zone 1, page title area with serif, warm cream bg

import { type ReactNode } from 'react'
import { ArrowLeft } from 'lucide-react'
import { HASUKA_LOGO } from '../assets/logo'

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
}

export default function PageShell({
  title,
  subtitle,
  onBack,
  backLabel,
  headerRight,
  children,
  rightPanel,
  rightPanelWidth = 380
}: PageShellProps) {
  return (
    <div className="flex flex-col sm:flex-row w-full h-full overflow-hidden" style={{ background: '#FAF6ED' }}>

      {/* Dark stripe — top bar on mobile, left sidebar on sm+ */}
      <div
        className="flex sm:flex-col items-center shrink-0 sm:py-5 sm:gap-4 px-4 sm:px-0 py-0"
        style={{ background: '#2B1810', width: undefined, minHeight: undefined }}
      >
        {/* Mobile: horizontal strip */}
        <div className="flex sm:hidden items-center w-full h-[52px] gap-3 px-4">
          <button
            onClick={onBack}
            className="flex items-center gap-2 px-3 py-2 rounded-xl transition-colors hover:bg-white/10 active:bg-white/20"
          >
            <ArrowLeft size={18} color="#C49A62" />
            <span className="text-[12px] font-bold" style={{ color: '#C49A62' }}>{backLabel || 'Kasir'}</span>
          </button>
          <div className="flex-1" />
          <img src={HASUKA_LOGO} alt="Hasuka" className="w-8 h-8 object-contain rounded-full" />
        </div>

        {/* Desktop: vertical stripe */}
        <div className="hidden sm:flex flex-col items-center gap-4 py-5" style={{ width: 72 }}>
          <img src={HASUKA_LOGO} alt="Hasuka" className="w-9 h-9 object-contain rounded-full" />
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
      </div>

      {/* Main area */}
      <div className="flex flex-col sm:flex-row flex-1 overflow-hidden">

        {/* Content column */}
        <div className="flex flex-col flex-1 overflow-hidden">
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

        {/* Optional right panel — stacks below on mobile, side panel on sm+ */}
        {rightPanel && (
          <div
            className="shrink-0 flex flex-col overflow-y-auto custom-scrollbar border-t-4 sm:border-t-0 sm:border-l-4 border-[#8B4A1E] w-full sm:w-auto max-h-[55vh] sm:max-h-none"
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
