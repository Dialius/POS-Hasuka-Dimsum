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
    <div className="flex w-full h-full overflow-hidden" style={{ background: '#FAF6ED' }}>

      {/* Dark left stripe — matches checkout Zone 1 */}
      <div
        className="flex flex-col items-center shrink-0 py-5 gap-4"
        style={{ width: 72, background: '#2B1810' }}
      >
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

      {/* Main area */}
      <div className="flex flex-1 overflow-hidden">

        {/* Content column */}
        <div className="flex flex-col flex-1 overflow-hidden">
          {/* Page title bar */}
          <div className="px-6 py-4 shrink-0 flex items-center justify-between gap-4" style={{ borderBottom: '1px solid #E8D7C0', background: '#FAF6ED' }}>
            <div>
              <h1 className="font-serif font-bold text-[22px] leading-tight" style={{ color: '#2B1810' }}>{title}</h1>
              {subtitle && <p className="text-[12px] mt-0.5" style={{ color: '#6B5448' }}>{subtitle}</p>}
            </div>
            {headerRight && <div className="shrink-0">{headerRight}</div>}
          </div>

          {/* Scrollable content */}
          <div className="flex-1 overflow-y-auto custom-scrollbar">
            {children}
          </div>
        </div>

        {/* Optional right panel */}
        {rightPanel && (
          <div
            className="shrink-0 flex flex-col overflow-y-auto custom-scrollbar"
            style={{
              width: rightPanelWidth,
              background: '#F3E7CE',
              borderLeft: '4px solid #8B4A1E',
            }}
          >
            {rightPanel}
          </div>
        )}
      </div>
    </div>
  )
}
