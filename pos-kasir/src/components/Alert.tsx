/**
 * Alert — komponen hand-crafted mengikuti struktur reui.io/components/alert.
 * Variants: default | destructive | warning | success | info
 * Warna dari token PRD-01, bukan shadcn generic.
 */

import { type ReactNode } from 'react'

type AlertVariant = 'default' | 'destructive' | 'warning' | 'success' | 'info'

const VARIANT_STYLES: Record<AlertVariant, { container: string; iconColor: string; titleColor: string; descColor: string }> = {
  default: {
    container: 'border-[#C49A62] bg-[#F3E7CE]',
    iconColor: '#8B4A1E',
    titleColor: '#2B1810',
    descColor: '#6B5448',
  },
  info: {
    container: 'border-[#C49A62] bg-[#F3E7CE]',
    iconColor: '#8B4A1E',
    titleColor: '#2B1810',
    descColor: '#6B5448',
  },
  destructive: {
    container: 'border-[#B60000] bg-[#FFF0F0]',
    iconColor: '#B60000',
    titleColor: '#7A0000',
    descColor: '#9A2020',
  },
  warning: {
    container: 'border-[#C9A227] bg-[#FEFBEC]',
    iconColor: '#C9A227',
    titleColor: '#6B5000',
    descColor: '#7A6010',
  },
  success: {
    container: 'border-[#5B8A2E] bg-[#F0F7EA]',
    iconColor: '#5B8A2E',
    titleColor: '#2F4A16',
    descColor: '#4A6E25',
  },
}

// SVG icons per variant
function AlertIcon({ variant }: { variant: AlertVariant }) {
  const color = VARIANT_STYLES[variant].iconColor
  if (variant === 'destructive') {
    return (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
      </svg>
    )
  }
  if (variant === 'warning') {
    return (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/>
      </svg>
    )
  }
  if (variant === 'success') {
    return (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <path d="M22 11.08V12a10 10 0 11-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/>
      </svg>
    )
  }
  // default / info
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/>
    </svg>
  )
}

interface AlertProps {
  variant?: AlertVariant
  children: ReactNode
  className?: string
}

export function Alert({ variant = 'default', children, className = '' }: AlertProps) {
  const s = VARIANT_STYLES[variant]
  return (
    <div
      role="alert"
      className={`relative flex w-full gap-3 rounded-xl border px-4 py-3 ${s.container} ${className}`}
    >
      <span className="mt-0.5 shrink-0">
        <AlertIcon variant={variant} />
      </span>
      <div className="flex flex-1 flex-col gap-1 min-w-0">{children}</div>
    </div>
  )
}

interface AlertTitleProps { children: ReactNode; variant?: AlertVariant }
export function AlertTitle({ children, variant = 'default' }: AlertTitleProps) {
  return (
    <p className="font-bold text-[13px] leading-snug" style={{ color: VARIANT_STYLES[variant].titleColor }}>
      {children}
    </p>
  )
}

interface AlertDescriptionProps { children: ReactNode; variant?: AlertVariant }
export function AlertDescription({ children, variant = 'default' }: AlertDescriptionProps) {
  return (
    <p className="text-[12px] leading-relaxed" style={{ color: VARIANT_STYLES[variant].descColor }}>
      {children}
    </p>
  )
}

interface AlertActionProps {
  children: ReactNode
  onClick: () => void
  variant?: AlertVariant
}
export function AlertAction({ children, onClick, variant = 'default' }: AlertActionProps) {
  const color = VARIANT_STYLES[variant].iconColor
  return (
    <button
      onClick={onClick}
      className="mt-1 self-start rounded-lg px-3 py-1.5 text-[12px] font-bold transition-all active:scale-95"
      style={{
        border: `1.5px solid ${color}`,
        color,
        background: 'transparent',
      }}
      onMouseOver={e => { (e.currentTarget as HTMLElement).style.background = `${color}18` }}
      onMouseOut={e => { (e.currentTarget as HTMLElement).style.background = 'transparent' }}
    >
      {children}
    </button>
  )
}

// ── Toast wrapper (auto-dismiss) ──────────────────────────────────────────────

import { useState, useEffect } from 'react'

interface AlertToastProps {
  variant?: AlertVariant
  title: string
  description?: string
  actionLabel?: string
  onAction?: () => void
  onDismiss: () => void
  durationMs?: number
}

export function AlertToast({
  variant = 'default',
  title,
  description,
  actionLabel,
  onAction,
  onDismiss,
  durationMs = 4000,
}: AlertToastProps) {
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    // Animate in
    const t1 = setTimeout(() => setVisible(true), 10)
    // Auto-dismiss (unless has action)
    const t2 = !actionLabel ? setTimeout(() => { setVisible(false); setTimeout(onDismiss, 300) }, durationMs) : null
    return () => { clearTimeout(t1); if (t2) clearTimeout(t2) }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div
      className="pointer-events-auto transition-all duration-300"
      style={{
        opacity: visible ? 1 : 0,
        transform: visible ? 'translateY(0)' : 'translateY(-12px)',
      }}
    >
      <Alert variant={variant} className="shadow-lg">
        <AlertTitle variant={variant}>{title}</AlertTitle>
        {description && <AlertDescription variant={variant}>{description}</AlertDescription>}
        {actionLabel && onAction && (
          <AlertAction variant={variant} onClick={onAction}>{actionLabel}</AlertAction>
        )}
        <button
          onClick={() => { setVisible(false); setTimeout(onDismiss, 300) }}
          className="absolute top-2.5 right-2.5 w-6 h-6 flex items-center justify-center rounded-lg opacity-60 hover:opacity-100 transition-opacity"
          style={{ color: VARIANT_STYLES[variant].iconColor }}
          aria-label="Tutup notifikasi"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
        </button>
      </Alert>
    </div>
  )
}

// ── Toast Host (portal-like, fixed position) ──────────────────────────────────

interface ToastItem {
  id: string
  variant: AlertVariant
  title: string
  description?: string
  actionLabel?: string
  onAction?: () => void
  durationMs?: number
}

interface AlertToastHostProps {
  toasts: ToastItem[]
  onDismiss: (id: string) => void
}

export function AlertToastHost({ toasts, onDismiss }: AlertToastHostProps) {
  if (toasts.length === 0) return null
  return (
    <div className="fixed top-4 right-4 z-[200] flex flex-col gap-2 pointer-events-none w-[calc(100vw-2rem)] max-w-sm">
      {toasts.map(t => (
        <AlertToast key={t.id} {...t} onDismiss={() => onDismiss(t.id)} />
      ))}
    </div>
  )
}
