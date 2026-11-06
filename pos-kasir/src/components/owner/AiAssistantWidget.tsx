import React, { useState, useEffect, useRef, useCallback } from 'react'
import {
  Sparkles,
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  Info,
  RefreshCw,
  X,
  Key,
  AlertCircle,
  GripHorizontal,
  WifiOff,
  Send,
  MessageSquare,
  Copy,
  Check,  ExternalLink,
  Maximize2,
  Minimize2
} from 'lucide-react'
import { useApp } from '../../context/AppContext'
import { gasApi, AiInsightResponse, mapAiErrorMessage } from '../../services/gasApi'
import { buildAiSnapshot, buildUniversalAiContext, AiSnapshotResult } from '../../utils/aiSnapshot'
import { showToast } from '../Alert'
import { useDraggable } from '../../hooks/useDraggable'

const PERIOD_LABELS: Record<string, string> = {
  today: 'Hari Ini',
  '7days': '7 Hari Terakhir',
  month: 'Bulan Ini',
  custom: 'Kustom'
}

const PERIOD_SHORT_MAP: Record<string, string> = {
  today: 'Hari Ini',
  '7days': '7 Hari',
  month: 'Bulan Ini',
  custom: 'Kustom'
}

function renderMarkdown(text: string): React.ReactNode {
  // Highlight Rp amounts and percentages in brand color, plus bold/italic
  const parts = text.split(/(\b\d+(?:[.,]\d+)?%|Rp[\d]+(?:[.,]\d+)*|\*\*[^*]+\*\*|\*[^*]+\*)/g)
  return parts.map((part, i) => {
    if (part.startsWith('**') && part.endsWith('**')) return <strong key={i}>{part.slice(2, -2)}</strong>
    if (part.startsWith('*') && part.endsWith('*')) return <em key={i}>{part.slice(1, -1)}</em>
    if (/^Rp[\d]+(?:[.,]\d+)*$/.test(part) || /^\d+(?:[.,]\d+)?%$/.test(part)) {
      return <span key={i} className="font-semibold text-[#8B4A1E]">{part}</span>
    }
    return part
  })
}

function formatForWhatsApp(text: string): string {
  if (!text) return ''
  const lines = text.split('\n')
  const formattedLines: string[] = []

  for (const rawLine of lines) {
    let line = rawLine.trim()
    if (!line) {
      formattedLines.push('')
      continue
    }

    // 1. Jika header pembuka / salam
    if (/^halo\s+/i.test(line)) {
      line = '*' + line.replace(/^\*+|\*+$/g, '') + '*'
    }
    // 2. Jika numbered point dengan judul titik dua (contoh: 1. Perbandingan Omzet: ...)
    else if (/^(\d+[.)]\s*)([^:]+:)(.*)$/.test(line)) {
      line = line.replace(/^(\d+[.)]\s*)([^:]+:)(.*)$/, (_m, num, title, rest) => {
        return num + '*' + title.trim() + '* ' + rest.trim()
      })
    }
    // 3. Jika subjudul seperti 'Saran Aksi:' atau 'Catatan:'
    else if (/^[A-Za-z\s]+:$/.test(line)) {
      line = '*' + line + '*'
    }

    // 4. Tebalkan nominal Rupiah dan Persentase yang belum diapit asterisk
    line = line.replace(/(?<!\*)\b(Rp[\d]+(?:[.,]\d+)*|\d+(?:[.,]\d+)?%)(?!\*)/g, '*$1*')

    formattedLines.push(line)
  }

  return formattedLines.join('\n') + '\n\n_— Dibuat otomatis oleh Sifu AI (Hasuka Dimsum)_'
}

function renderChatAiMessage(text: string): React.ReactNode {
  const lines = text.split('\n').map(l => l.trim()).filter(Boolean)
  const numberedRe = /^(\d+)[.)]\s+(.+)$/

  // Collect intro lines and numbered items separately
  const introLines: string[] = []
  const items: string[] = []
  for (const line of lines) {
    const m = line.match(numberedRe)
    if (m) {
      items.push(m[2])
    } else if (items.length === 0) {
      introLines.push(line)
    }
  }

  if (items.length >= 2) {
    return (
      <>
        {introLines.length > 0 && (
          <p className="mb-2 leading-relaxed">{renderMarkdown(introLines.join(' '))}</p>
        )}
        <div className="space-y-1.5">
          {items.map((item, i) => (
            <div key={i} className="flex items-start gap-2 p-1.5 rounded-lg" style={{ background: 'rgba(139,74,30,0.06)' }}>
              <span className="w-4 h-4 rounded-full flex items-center justify-center text-[9px] font-bold shrink-0 mt-0.5 text-white" style={{ background: '#8B4A1E' }}>{i + 1}</span>
              <span className="flex-1 text-[11px] leading-snug">{renderMarkdown(item)}</span>
            </div>
          ))}
        </div>
      </>
    )
  }

  return <span className="leading-relaxed">{renderMarkdown(text)}</span>
}

interface AiAssistantWidgetProps {
  dashboardData: any
  selectedBranch: string
  period: 'today' | '7days' | 'month' | 'custom'
  customDate?: string
  isOpenExternal?: boolean
  onToggleExternal?: (open: boolean) => void
  triggerAnalyzeCount?: number
  onDisableAi?: () => void
  onNavigateTab?: (tab: string) => void
  onNavigateScreen?: (screen: string) => void
}

const OWNER_KEY_STORAGE = 'hasuka_ai_owner_key'
const AI_CHAT_STORAGE = 'hasuka_ai_chat_history_v1'
const PANEL_SIZE_STORAGE = 'hasuka_ai_panel_size_v1'
const COOLDOWN_SECONDS = 10

interface PanelSize {
  width: number
  height: number
}

export const AiAssistantWidget: React.FC<AiAssistantWidgetProps> = ({
  dashboardData,
  selectedBranch,
  period,
  customDate,
  isOpenExternal,
  onToggleExternal,
  triggerAnalyzeCount,
  onDisableAi,
  onNavigateTab,
  onNavigateScreen
}) => {
  const {
    isOnline,
    outletsList,
    cashiersList,
    productsList,
    ingredientsList,
    shiftTolerance
  } = useApp()

  const isControlled = isOpenExternal !== undefined
  const [internalOpen, setInternalOpen] = useState(false)
  const isOpen = isControlled ? isOpenExternal : internalOpen

  const setIsOpen = useCallback((next: boolean | ((prev: boolean) => boolean)) => {
    const val = typeof next === 'function' ? next(isOpen) : next
    if (isControlled && onToggleExternal) {
      onToggleExternal(val)
    } else {
      setInternalOpen(val)
    }
  }, [isControlled, isOpen, onToggleExternal])
  const [loading, setLoading] = useState(false)
  const [data, setData] = useState<AiInsightResponse | null>(null)
  const [isEmptySnapshot, setIsEmptySnapshot] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [isAuthError, setIsAuthError] = useState(false)
  const [ownerKeyInput, setOwnerKeyInput] = useState(() => {
    try {
      return localStorage.getItem(OWNER_KEY_STORAGE) || ''
    } catch {
      return ''
    }
  })
  const [cooldownRemaining, setCooldownRemaining] = useState(0)
  const [showKeyConfig, setShowKeyConfig] = useState(false)
  const [chatMessages, setChatMessages] = useState<Array<{ id: string; sender: 'user' | 'ai'; text: string; time: string }>>(() => {
    try {
      const stored = localStorage.getItem(AI_CHAT_STORAGE)
      if (stored) {
        const parsed = JSON.parse(stored)
        if (Array.isArray(parsed)) return parsed
      }
    } catch { /* ignore */ }
    return []
  })

  // Simpan riwayat chat ke localStorage setiap kali ada pesan baru
  useEffect(() => {
    try {
      if (chatMessages.length > 0) {
        localStorage.setItem(AI_CHAT_STORAGE, JSON.stringify(chatMessages.slice(-30)))
      } else {
        localStorage.removeItem(AI_CHAT_STORAGE)
      }
    } catch { /* ignore */ }
  }, [chatMessages])

  const [chatInput, setChatInput] = useState('')
  const [isSendingQuestion, setIsSendingQuestion] = useState(false)
  const [loadingStatus, setLoadingStatus] = useState('')
  const [copiedId, setCopiedId] = useState<string | null>(null)

  const hasUrgentAlert = ingredientsList.some(i => (Number(i.current_stock) || 0) < 0)

  // Manajemen Ukuran Panel yang Fleksibel (Resizable & Maximizable)
  const [panelSize, setPanelSize] = useState<PanelSize>(() => {
    try {
      const stored = localStorage.getItem(PANEL_SIZE_STORAGE)
      if (stored) {
        const parsed = JSON.parse(stored)
        if (typeof parsed.width === 'number' && typeof parsed.height === 'number') {
          return {
            width: Math.max(300, Math.min(parsed.width, typeof window !== 'undefined' ? window.innerWidth - 20 : 800)),
            height: Math.max(360, Math.min(parsed.height, typeof window !== 'undefined' ? window.innerHeight - 30 : 850))
          }
        }
      }
    } catch { /* ignore */ }

    const vw = typeof window !== 'undefined' ? window.innerWidth : 1024
    const vh = typeof window !== 'undefined' ? window.innerHeight : 768
    return {
      width: Math.min(vw - 24, 390),
      height: Math.min(vh * 0.78, 540)
    }
  })

  const [isMaximized, setIsMaximized] = useState(false)
  const [isResizing, setIsResizing] = useState(false)
  const resizeStartRef = useRef<{ startX: number; startY: number; startW: number; startH: number; corner: 'left' | 'right' }>({
    startX: 0,
    startY: 0,
    startW: 0,
    startH: 0,
    corner: 'right'
  })

  const effectiveWidth = isMaximized
    ? Math.min(typeof window !== 'undefined' ? window.innerWidth - 24 : 700, 700)
    : Math.min(typeof window !== 'undefined' ? window.innerWidth - 24 : panelSize.width, panelSize.width)

  const effectiveHeight = isMaximized
    ? Math.min(typeof window !== 'undefined' ? window.innerHeight - 36 : 760, 760)
    : Math.min(typeof window !== 'undefined' ? window.innerHeight - 36 : panelSize.height, panelSize.height)

  const handleResizePointerDown = (e: React.PointerEvent, corner: 'left' | 'right') => {
    e.stopPropagation()
    e.preventDefault()
    try {
      (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId)
    } catch { /* ignore */ }

    setIsResizing(true)
    setIsMaximized(false)
    resizeStartRef.current = {
      startX: e.clientX,
      startY: e.clientY,
      startW: effectiveWidth,
      startH: effectiveHeight,
      corner
    }
  }

  const handleResizePointerMove = (e: React.PointerEvent) => {
    if (!isResizing) return
    const { startX, startY, startW, startH, corner } = resizeStartRef.current
    const dx = e.clientX - startX
    const dy = e.clientY - startY

    const newW = corner === 'left' ? startW - dx : startW + dx
    const newH = startH + dy

    const maxW = Math.min(window.innerWidth - 24, 800)
    const maxH = Math.min(window.innerHeight - 36, 850)
    const clampedW = Math.max(300, Math.min(newW, maxW))
    const clampedH = Math.max(360, Math.min(newH, maxH))

    setPanelSize({ width: clampedW, height: clampedH })
  }

  const handleResizePointerUp = (e: React.PointerEvent) => {
    if (!isResizing) return
    setIsResizing(false)
    try {
      (e.currentTarget as HTMLElement).releasePointerCapture(e.pointerId)
    } catch { /* ignore */ }

    try {
      localStorage.setItem(PANEL_SIZE_STORAGE, JSON.stringify(panelSize))
    } catch { /* ignore */ }
  }

  const widgetRef = useRef<HTMLDivElement>(null)
  const chatBottomRef = useRef<HTMLDivElement>(null)
  const latestSnapshotRef = useRef<any>(null)
  const prevFilterRef = useRef({ selectedBranch, period, customDate })
  const cooldownTimerRef = useRef<any>(null)
  const hasRunInitialRef = useRef(false)

  const { position, isDragging, isClickSuppressed, dragProps } = useDraggable({
    isOpen,
    elementRef: widgetRef
  })

  // Cooldown countdown timer
  useEffect(() => {
    if (cooldownRemaining > 0) {
      cooldownTimerRef.current = setTimeout(() => {
        setCooldownRemaining(prev => Math.max(0, prev - 1))
      }, 1000)
    }
    return () => {
      if (cooldownTimerRef.current) clearTimeout(cooldownTimerRef.current)
    }
  }, [cooldownRemaining])

  // Esc key closes panel
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        setIsOpen(false)
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isOpen])

  // Scope label for header
  const branchObj = outletsList.find(o => String(o.id) === String(selectedBranch))
  const branchName = selectedBranch === 'all' ? 'Semua Cabang' : (branchObj?.name || selectedBranch)
  const scopeLabel = `${branchName} · ${PERIOD_SHORT_MAP[period] || period}`

  // Eksekusi pemanggilan analisis AI dengan notifikasi lengkap untuk Owner
  const runAnalysis = useCallback(async (force = false, keyOverride?: string) => {
    // Cegah tabrakan jika sedang loading, kecuali jika user memaksa (force) atau memberikan kunci akses baru
    if (loading && !force && keyOverride === undefined) return

    if (!isOnline) {
      const msg = 'Perangkat sedang offline. Sambungkan koneksi internet untuk menjalankan Sifu AI.'
      setErrorMessage(msg)
      if (force) {
        showToast({
          variant: 'destructive',
          title: 'Analisis AI Tidak Dapat Dijalankan',
          description: msg
        })
      }
      return
    }

    if (force && cooldownRemaining > 0) {
      showToast({
        variant: 'warning',
        title: 'Mohon Tunggu Sebentar',
        description: `Sifu AI baru saja selesai menganalisis data. Tunggu ${cooldownRemaining} detik lagi untuk analisis ulang.`
      })
      return
    }

    // 1. Bangun snapshot
    const snapshotRes: AiSnapshotResult = buildAiSnapshot({
      dashboardData,
      selectedBranch,
      period,
      customDate,
      outletsList,
      cashiersList,
      productsList,
      ingredientsList,
      shiftTolerance,
      now: new Date()
    })

    if ('empty' in snapshotRes && snapshotRes.empty) {
      setIsEmptySnapshot(true)
      setData(null)
      setErrorMessage(null)
      setIsAuthError(false)
      latestSnapshotRef.current = null
      if (force) {
        showToast({
          variant: 'warning',
          title: 'Data Belum Tersedia untuk Analisis',
          description: `Belum ada data transaksi atau inventori yang tercatat untuk periode ${PERIOD_SHORT_MAP[period] || period}.`
        })
      }
      return
    }

    latestSnapshotRef.current = snapshotRes
    setIsEmptySnapshot(false)
    setLoading(true)
    setErrorMessage(null)
    setIsAuthError(false)

    try {
      let keyToSend = keyOverride !== undefined ? keyOverride : ''
      if (!keyToSend) {
        try {
          keyToSend = ownerKeyInput.trim() || localStorage.getItem(OWNER_KEY_STORAGE) || ''
        } catch { /* ignore */ }
      }

      const res = await gasApi.aiAnalyze({
        scope: `${selectedBranch}_${period}_${customDate || ''}`,
        snapshot: snapshotRes,
        ownerKey: keyToSend,
        force
      })

      setData(res)
      if (force) {
        setCooldownRemaining(COOLDOWN_SECONDS)
        showToast({
          variant: 'success',
          title: 'Analisis Sifu AI Selesai',
          description: 'Hasil analisis performa restoran dan saran aksi hari ini telah berhasil diperbarui.'
        })
      }
    } catch (err: any) {
      const rawMsg = err instanceof Error ? err.message : String(err)
      const mapped = mapAiErrorMessage(rawMsg, !isOnline)
      setErrorMessage(mapped.message)
      if (mapped.isAuthError) {
        setIsAuthError(true)
        setShowKeyConfig(true)
      }
      // HANYA munculkan pop-up toast jika force === true (tindakan manual oleh user)
      // Mencegah spam notifikasi saat kegagalan background/autorun
      if (force) {
        showToast({
          variant: 'destructive',
          title: 'Analisis AI Mengalami Kendala',
          description: mapped.message
        })
      }
    } finally {
      setLoading(false)
    }
  }, [
    loading,
    isOnline,
    cooldownRemaining,
    dashboardData,
    selectedBranch,
    period,
    customDate,
    outletsList,
    cashiersList,
    productsList,
    ingredientsList,
    shiftTolerance,
    ownerKeyInput
  ])

  // Eksekusi pengiriman pertanyaan interaktif ke AI
  const handleSendQuestion = async (customQ?: string) => {
    const textToSend = (customQ || chatInput).trim()
    if (!textToSend || isSendingQuestion || !isOnline) return

    const now = new Date()
    const timeStr = now.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })

    setChatMessages(prev => [...prev, { id: `u_${Date.now()}`, sender: 'user' as const, text: textToSend, time: timeStr }])
    if (!customQ) setChatInput('')
    setIsSendingQuestion(true)
    setLoadingStatus('Membangun data semua periode...')
    setTimeout(() => chatBottomRef.current?.scrollIntoView({ behavior: 'smooth' }), 50)

    try {
      setLoadingStatus('Menyiapkan data restoran lengkap...')

      // Universal Knowledge Context: rekap harian 30 hari, katalog menu & margin HPP, seluruh stok bahan, cabang, dan kasir
      const universalContext = buildUniversalAiContext({
        dashboardData,
        selectedBranch,
        period,
        customDate,
        outletsList,
        cashiersList,
        productsList,
        ingredientsList,
        shiftTolerance,
        now: new Date()
      })

      setLoadingStatus('Menghubungi Sifu...')

      let savedOwnerKey = ''
      try { savedOwnerKey = localStorage.getItem(OWNER_KEY_STORAGE) || '' } catch { /* ignore */ }

      const branchCtx = selectedBranch === 'all' ? 'Semua Cabang' : (outletsList.find(o => String(o.id) === String(selectedBranch))?.name || selectedBranch)
      const contextualQuestion = `[Filter aktif: ${PERIOD_LABELS[period] || period}, ${branchCtx}]\n\n${textToSend}`

      setLoadingStatus('Sifu sedang menghitung & menganalisis...')

      const res = await gasApi.aiAnalyze({
        scope: `${selectedBranch}_universal_context`,
        snapshot: universalContext,
        ownerKey: savedOwnerKey,
        question: contextualQuestion,
        force: true
      })

      const rawAnswer = (res.insight?.headline || '').trim() || 'Maaf, tidak ada jawaban dari AI.'
      setChatMessages(prev => [...prev, {
        id: `ai_${Date.now()}`,
        sender: 'ai' as const,
        text: rawAnswer,
        time: new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })
      }])
    } catch (err: any) {
      const rawMsg = err instanceof Error ? err.message : String(err)
      const mapped = mapAiErrorMessage(rawMsg, !isOnline)
      setChatMessages(prev => [...prev, {
        id: `err_${Date.now()}`,
        sender: 'ai' as const,
        text: `⚠️ ${mapped.message}`,
        time: new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })
      }])
    } finally {
      setIsSendingQuestion(false)
      setLoadingStatus('')
      setTimeout(() => chatBottomRef.current?.scrollIntoView({ behavior: 'smooth' }), 50)
    }
  }

  const lastTriggerCountRef = useRef(triggerAnalyzeCount || 0)
  useEffect(() => {
    if (triggerAnalyzeCount !== undefined && triggerAnalyzeCount > lastTriggerCountRef.current) {
      lastTriggerCountRef.current = triggerAnalyzeCount
      runAnalysis(true)
    }
  }, [triggerAnalyzeCount, runAnalysis])

  // Reset status autorun jika panel ditutup
  useEffect(() => {
    if (!isOpen) {
      hasRunInitialRef.current = false
    }
  }, [isOpen])

  // Trigger: Pertama kali panel dibuka atau saat belum ada data (dibatasi 1x agar tidak infinite-loop saat error)
  useEffect(() => {
    if (isOpen && !hasRunInitialRef.current && !data && !loading && !errorMessage && !isEmptySnapshot) {
      hasRunInitialRef.current = true
      runAnalysis(false)
    }
  }, [isOpen, data, loading, errorMessage, isEmptySnapshot, runAnalysis])

  // Trigger: Perubahan filter cabang atau periode saat panel sedang terbuka
  useEffect(() => {
    const prev = prevFilterRef.current
    const hasChanged =
      prev.selectedBranch !== selectedBranch ||
      prev.period !== period ||
      prev.customDate !== customDate

    if (hasChanged) {
      prevFilterRef.current = { selectedBranch, period, customDate }
      if (isOpen) {
        runAnalysis(false)
      }
    }
  }, [selectedBranch, period, customDate, isOpen, runAnalysis])

  const handleToggleOpen = () => {
    if (isClickSuppressed.current) return
    setIsOpen(prev => !prev)
  }

  const handleSaveOwnerKey = (e?: React.FormEvent) => {
    if (e && typeof e.preventDefault === 'function') e.preventDefault()
    const cleanKey = ownerKeyInput.trim()
    try {
      localStorage.setItem(OWNER_KEY_STORAGE, cleanKey)
    } catch { /* ignore */ }
    setIsAuthError(false)
    setErrorMessage(null)
    setShowKeyConfig(false)
    setLoading(false)
    runAnalysis(true, cleanKey)
  }

  // Waktu pembaruan
  const lastUpdatedTime = data?.meta?.generatedAt
    ? new Date(data.meta.generatedAt).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })
    : ''

  return (
    <div
      ref={widgetRef}
      className="fixed z-[90] select-none"
      style={{
        left: `${position.x}px`,
        top: `${position.y}px`,
        transition: (isDragging || isResizing) ? 'none' : 'left 0.22s ease-out, top 0.22s ease-out'
      }}
    >
      {!isOpen ? (
        /* Keadaan Tutup: Tombol Lingkaran 52px */
        <button
          type="button"
          {...dragProps}
          onClick={handleToggleOpen}
          aria-label="Buka Sifu AI"
          className="w-[52px] h-[52px] rounded-full shadow-lg flex items-center justify-center transition-transform active:scale-95 focus:outline-none focus:ring-2 focus:ring-[#8B4A1E] focus:ring-offset-2"
          style={{
            background: '#FAF6ED',
            border: '2px solid #C49A62',
            color: '#8B4A1E'
          }}
        >
          <div className="relative pointer-events-none">
            <Sparkles size={24} className="animate-pulse" />
            {!isOnline ? (
              <span
                className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full border border-white"
                style={{ background: '#C9A227' }}
                title="Mode Offline"
              />
            ) : hasUrgentAlert ? (
              <span
                className="absolute -top-1.5 -right-1.5 w-3.5 h-3.5 rounded-full bg-red-600 border-2 border-white flex items-center justify-center text-[8px] font-bold text-white shadow-xs"
                title="Perhatian: Ada stok bahan minus/kritis"
              >
                !
              </span>
            ) : null}
          </div>
        </button>
      ) : (
        /* Keadaan Buka: Panel AI Insight */
        <div
          className="flex flex-col rounded-2xl shadow-2xl border text-[#2B1810] overflow-hidden relative"
          style={{
            width: `${effectiveWidth}px`,
            height: `${effectiveHeight}px`,
            maxWidth: 'calc(100vw - 20px)',
            maxHeight: 'calc(100vh - 28px)',
            background: '#FAF6ED',
            borderColor: '#E8D7C0',
            transition: isResizing ? 'none' : 'width 0.2s ease-out, height 0.2s ease-out'
          }}
        >
          {/* Header Panel (Drag Handle) */}
          <div
            {...dragProps}
            className="flex items-center justify-between px-3.5 py-2.5 border-b cursor-grab active:cursor-grabbing select-none"
            style={{
              background: '#F3E7CE',
              borderColor: '#E8D7C0'
            }}
          >
            <div className="flex items-center gap-2 min-w-0 flex-1">
              <GripHorizontal size={14} className="text-[#6B5448] opacity-60 shrink-0" />
              <div className="w-6 h-6 rounded-lg flex items-center justify-center shrink-0" style={{ background: '#8B4A1E', color: 'white' }}>
                <Sparkles size={13} />
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-1.5">
                  <h3 className="font-bold text-[13px] leading-tight text-[#2B1810] truncate">Sifu</h3>
                  {data?.meta?.isStale && (
                    <span className="text-[10px] px-1.5 py-0.2 rounded font-semibold text-amber-800 bg-amber-100 border border-amber-300">
                      data lama
                    </span>
                  )}
                </div>
                <p className="text-[11px] text-[#6B5448] truncate leading-tight">{scopeLabel}</p>
              </div>
            </div>

            <div
              className="flex items-center gap-1 shrink-0 ml-2"
              onPointerDown={(e) => e.stopPropagation()}
            >
              <button
                type="button"
                onPointerDown={(e) => e.stopPropagation()}
                onClick={(e) => {
                  e.stopPropagation()
                  setShowKeyConfig(prev => !prev)
                }}
                className="p-1.5 rounded-lg transition-colors hover:bg-black/10 active:scale-95 cursor-pointer"
                style={{ color: showKeyConfig ? '#8B4A1E' : '#6B5448' }}
                title="Atur Kode Akses AI"
              >
                <Key size={13} />
              </button>
              {onDisableAi && (
                <button
                  type="button"
                  onPointerDown={(e) => e.stopPropagation()}
                  onClick={(e) => {
                    e.stopPropagation()
                    onDisableAi()
                  }}
                  className="px-2 py-1 rounded-lg text-[10px] font-medium transition-colors hover:bg-black/10 active:scale-95 cursor-pointer"
                  style={{ color: '#6B5448' }}
                  title="Matikan Fitur AI"
                >
                  Matikan
                </button>
              )}
              <button
                type="button"
                onPointerDown={(e) => e.stopPropagation()}
                onClick={(e) => {
                  e.stopPropagation()
                  setIsMaximized(prev => !prev)
                }}
                className="p-1.5 rounded-lg transition-colors hover:bg-black/10 active:scale-95 cursor-pointer"
                style={{ color: isMaximized ? '#8B4A1E' : '#6B5448' }}
                title={isMaximized ? "Perkecil Ukuran" : "Perbesar Ukuran"}
                aria-label={isMaximized ? "Perkecil Ukuran" : "Perbesar Ukuran"}
              >
                {isMaximized ? <Minimize2 size={13} /> : <Maximize2 size={13} />}
              </button>
              <button
                type="button"
                onPointerDown={(e) => e.stopPropagation()}
                onClick={(e) => {
                  e.stopPropagation()
                  setIsOpen(false)
                }}
                className="p-1.5 rounded-lg transition-colors hover:bg-black/10 active:scale-95 cursor-pointer"
                style={{ color: '#6B5448' }}
                aria-label="Tutup Panel AI Insight"
              >
                <X size={16} />
              </button>
            </div>
          </div>

          {/* Body Konten dengan Scroll Internal */}
          <div className="flex-1 overflow-y-auto p-3.5 space-y-3 text-[12px] scrollbar-thin">
            {/* Box Konfigurasi Kode Akses AI (Hanya 1 kartu tampil, mencegah form ganda) */}
            {showKeyConfig && (
              <div className="p-3 rounded-xl border border-amber-300 bg-amber-50/90 text-[#2B1810] space-y-2 animate-fade-in">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5 text-[11.5px] font-bold text-[#8B4A1E]">
                    <Key size={13} />
                    <span>Pengaturan Kode Akses AI</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setShowKeyConfig(false)}
                    className="text-gray-400 hover:text-gray-600 text-xs cursor-pointer p-0.5"
                  >
                    ✕
                  </button>
                </div>
                {isAuthError ? (
                  <p className="text-[11px] font-semibold text-red-700 leading-tight">
                    Kode akses AI belum tepat atau belum dimasukkan. Silakan masukkan Kode Akses Pemilik (Owner Key) untuk mengaktifkan Sifu AI:
                  </p>
                ) : (
                  <p className="text-[11px] text-[#6B5448] leading-tight">
                    Masukkan Kode Akses AI (Owner Key) jika server mengaktifkan proteksi:
                  </p>
                )}
                <form onSubmit={handleSaveOwnerKey} className="flex items-center gap-1.5">
                  <div className="relative flex-1">
                    <input
                      type="password"
                      value={ownerKeyInput}
                      onChange={e => setOwnerKeyInput(e.target.value)}
                      placeholder="Kode Akses AI..."
                      className="w-full px-2.5 py-1.5 text-[11px] rounded-lg border border-amber-300 bg-white text-gray-900 focus:outline-none focus:ring-1 focus:ring-[#8B4A1E]"
                      autoFocus={isAuthError}
                    />
                  </div>
                  <button
                    type="submit"
                    className="px-3 py-1.5 rounded-lg text-[11px] font-bold text-white bg-[#8B4A1E] hover:bg-[#723C18] transition-colors shrink-0 cursor-pointer"
                  >
                    Simpan
                  </button>
                </form>
                {ownerKeyInput && !isAuthError && (
                  <p className="text-[10px] text-emerald-700 font-medium">✓ Kode akses aktif di perangkat ini</p>
                )}
              </div>
            )}
            {/* Status: Loading Skeleton */}
            {loading && (
              <div className="space-y-3">
                <div className="flex items-center gap-2 p-2.5 rounded-xl bg-amber-50 border border-amber-200 text-[#8B4A1E]">
                  <RefreshCw size={14} className="animate-spin text-[#8B4A1E] shrink-0" />
                  <span className="text-[11.5px] font-bold">Sifu sedang menganalisis data restoran...</span>
                </div>
                <div className="space-y-3 animate-pulse">
                  <div className="h-4 bg-[#E8D7C0]/60 rounded-md w-3/4" />
                  <div className="h-14 bg-[#E8D7C0]/40 rounded-xl" />
                  <div className="space-y-2 pt-1">
                    <div className="h-3 bg-[#E8D7C0]/50 rounded w-full" />
                    <div className="h-3 bg-[#E8D7C0]/50 rounded w-5/6" />
                    <div className="h-3 bg-[#E8D7C0]/50 rounded w-4/6" />
                  </div>
                  <div className="h-10 bg-[#E8D7C0]/30 rounded-xl" />
                </div>
              </div>
            )}

            {/* Status: Kosong (Empty Snapshot) - Pemberitahuan Jelas untuk Owner */}
            {!loading && isEmptySnapshot && (
              <div className="p-4 rounded-xl border border-amber-300 bg-amber-50/90 text-center space-y-2.5">
                <div className="w-10 h-10 mx-auto rounded-full flex items-center justify-center bg-amber-100 text-amber-800">
                  <AlertCircle size={22} />
                </div>
                <div>
                  <h4 className="font-bold text-[13px] text-[#2B1810]">Tidak Dapat Menganalisis Periode Ini</h4>
                  <p className="text-[11.5px] text-[#6B5448] mt-1 leading-relaxed">
                    Belum ada data transaksi, produk, atau inventori bahan yang tercatat pada periode <strong>{scopeLabel}</strong>.
                  </p>
                </div>
                <div className="pt-1 flex flex-wrap items-center justify-center gap-1.5">
                  {onNavigateTab && (
                    <button
                      type="button"
                      onClick={() => onNavigateTab('overview')}
                      className="px-2.5 py-1.5 rounded-lg text-[11px] font-bold text-[#8B4A1E] bg-white border border-[#C49A62] hover:bg-amber-100/50 transition-colors cursor-pointer"
                    >
                      Lihat Ringkasan
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => runAnalysis(true)}
                    className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-[11px] font-bold bg-[#8B4A1E] text-white hover:bg-[#723C18] transition-colors cursor-pointer"
                  >
                    <RefreshCw size={12} />
                    <span>Periksa Ulang Data</span>
                  </button>
                </div>
              </div>
            )}

            {/* Status: Error Message (Hanya jika BUKAN auth error, karena auth error sudah ditangani dengan rapi oleh kartu konfigurasi tunggal di atas) */}
            {!loading && errorMessage && !isAuthError && (
              <div className="p-3 rounded-xl border border-red-200 bg-red-50 text-red-900 space-y-2.5">
                <div className="flex items-start gap-2">
                  <AlertCircle size={16} className="text-red-700 shrink-0 mt-0.5" />
                  <div className="flex-1">
                    <p className="font-semibold text-[12px] text-red-900 leading-tight">Gagal Memuat Analisis</p>
                    <p className="text-[11px] text-red-800 mt-1">{errorMessage}</p>
                  </div>
                </div>

                <div className="flex items-center gap-2 pt-1">
                  <button
                    type="button"
                    onClick={() => runAnalysis(true)}
                    className="flex items-center gap-1 px-3 py-1 rounded-lg text-[11px] font-bold text-red-900 bg-red-100 hover:bg-red-200 transition-colors cursor-pointer"
                  >
                    <RefreshCw size={12} />
                    <span>Coba Lagi</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowKeyConfig(prev => !prev)}
                    className="flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-bold text-amber-900 bg-amber-100 hover:bg-amber-200 transition-colors cursor-pointer"
                  >
                    <Key size={12} />
                    <span>Atur Kode AI</span>
                  </button>
                </div>
              </div>
            )}

            {/* Status: Berhasil Menampilkan Insight */}
            {!loading && data && (
              <div className="space-y-3">
                {/* Headline Kesimpulan Utama */}
                <div
                  className="p-3 rounded-xl border"
                  style={{
                    background: '#FFFFFF',
                    borderColor: '#E8D7C0'
                  }}
                >
                  <p className="font-medium text-[12px] text-[#2B1810] leading-relaxed whitespace-pre-line">
                    {renderMarkdown((data.insight.headline || '')
                      .replace(/^\{?\s*"?(?:headline|ringkasan|summary|kesimpulan)"?\s*:\s*"?/i, '')
                      .replace(/"?\s*\}?$/, '')
                      .trim())}
                  </p>
                </div>

                {/* Highlights */}
                {data.insight.highlights && data.insight.highlights.length > 0 && (
                  <div className="space-y-1.5">
                    <h4 className="text-[11px] font-bold text-[#6B5448] uppercase tracking-wider">
                      Sorotan Performa
                    </h4>
                    <div className="space-y-1.5">
                      {data.insight.highlights.map((h, i) => (
                        <div
                          key={i}
                          className="flex items-start gap-2 p-2 rounded-lg text-[11.5px] leading-tight"
                          style={{ background: '#F8F3EA' }}
                        >
                          {h.type === 'naik' && <TrendingUp size={15} className="text-[#5B8A2E] shrink-0 mt-0.5" />}
                          {h.type === 'turun' && <TrendingDown size={15} className="text-[#B60000] shrink-0 mt-0.5" />}
                          {h.type === 'peringatan' && <AlertTriangle size={15} className="text-[#C9A227] shrink-0 mt-0.5" />}
                          {h.type === 'info' && <Info size={15} className="text-[#8B4A1E] shrink-0 mt-0.5" />}
                          <span className="text-[#2B1810]">{renderMarkdown(h.text)}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Blok Produk Terlaris */}
                {data.insight.bestSeller && (
                  <div
                    className="p-2.5 rounded-xl border flex items-start gap-2"
                    style={{
                      background: '#FFF9ED',
                      borderColor: '#F1D9A7'
                    }}
                  >
                    <Sparkles size={15} className="text-amber-700 shrink-0 mt-0.5" />
                    <div>
                      <span className="text-[10px] font-bold uppercase tracking-wider text-amber-800 block">
                        Produk Terlaris
                      </span>
                      <p className="font-bold text-[12px] text-[#2B1810]">{data.insight.bestSeller.name}</p>
                      {data.insight.bestSeller.note && (
                        <p className="text-[11px] text-[#6B5448] mt-0.5">{data.insight.bestSeller.note}</p>
                      )}
                    </div>
                  </div>
                )}

                {/* Saran Aksi */}
                {data.insight.recommendations && data.insight.recommendations.length > 0 && (
                  <div className="space-y-1.5">
                    <h4 className="text-[11px] font-bold text-[#6B5448] uppercase tracking-wider">
                      Saran Aksi Hari Ini
                    </h4>
                    <div className="space-y-1">
                      {data.insight.recommendations.map((rec, i) => (
                        <div
                          key={i}
                          className="flex items-start gap-2 p-2 rounded-lg text-[11.5px] leading-tight"
                          style={{ background: '#FFFFFF', border: '1px solid #E8D7C0' }}
                        >
                          <span className="w-4 h-4 rounded-full bg-[#8B4A1E] text-white flex items-center justify-center text-[10px] font-bold shrink-0 mt-0.5">
                            {i + 1}
                          </span>
                          <span className="text-[#2B1810]">{renderMarkdown(rec)}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Catatan / Caveat */}
                {data.insight.caveat && (
                  <div className="flex items-start gap-1.5 p-2 rounded-lg text-[10.5px] text-[#6B5448] bg-amber-50/70 border border-amber-200">
                    <AlertCircle size={13} className="shrink-0 mt-0.5 text-amber-700" />
                    <span>{data.insight.caveat}</span>
                  </div>
                )}
              </div>
            )}

            {/* Riwayat Chat / Tanya Jawab Interaktif */}
            {chatMessages.length > 0 && (
              <div className="space-y-2.5 pt-2 border-t border-[#E8D7C0]">
                <div className="flex items-center justify-between text-[11px] font-bold text-[#6B5448] uppercase tracking-wider">
                  <div className="flex items-center gap-1.5">
                    <MessageSquare size={13} className="text-[#8B4A1E]" />
                    <span>Tanya Sifu</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      if (confirm('Bersihkan riwayat percakapan dengan Sifu?')) {
                        setChatMessages([])
                      }
                    }}
                    className="text-[10px] text-[#6B5448] hover:text-red-700 font-normal hover:underline cursor-pointer"
                  >
                    Hapus Chat
                  </button>
                </div>
                <div className="space-y-2">
                  {chatMessages.map(msg => {
                    const shortcuts = msg.sender === 'ai' ? (() => {
                      const low = msg.text.toLowerCase()
                      const list: Array<{ label: string; onClick: () => void }> = []
                      if (onNavigateTab) {
                        if (low.includes('bahan') || low.includes('stok') || low.includes('kemasan') || low.includes('siomay') || low.includes('wadah') || low.includes('belanja') || low.includes('restock')) {
                          list.push({ label: '📦 Cek Bahan', onClick: () => onNavigateTab('raw_stock') })
                        }
                        if (low.includes('cabang') || low.includes('outlet')) {
                          list.push({ label: '🏢 Cek Cabang', onClick: () => onNavigateTab('branches') })
                        }
                        if (low.includes('kasir') || low.includes('shift') || low.includes('selisih')) {
                          list.push({ label: '👥 Cek Kasir', onClick: () => onNavigateTab('kasir') })
                        }
                        if (low.includes('transaksi') || low.includes('struk') || low.includes('penjualan')) {
                          list.push({ label: '🧾 Cek Transaksi', onClick: () => onNavigateTab('transactions') })
                        }
                        if (low.includes('margin') || low.includes('laba') || low.includes('performa')) {
                          list.push({ label: '📊 Cek Analisis', onClick: () => onNavigateTab('analytics') })
                        }
                      }
                      if (onNavigateScreen) {
                        if (low.includes('resep') || low.includes('racikan')) {
                          list.push({ label: '📋 Kelola Resep', onClick: () => onNavigateScreen('kelolaResep') })
                        }
                      }
                      return list.slice(0, 3)
                    })() : []

                    return (
                      <div
                        key={msg.id}
                        className={`flex flex-col ${msg.sender === 'user' ? 'items-end' : 'items-start'}`}
                      >
                        <div
                          className={`p-2.5 rounded-2xl text-[11.5px] max-w-[90%] ${
                            msg.sender === 'user'
                              ? 'bg-[#8B4A1E] text-white rounded-br-xs shadow-xs leading-relaxed'
                              : 'bg-white border border-[#E8D7C0] text-[#2B1810] rounded-bl-xs shadow-xs'
                          }`}
                        >
                          {msg.sender === 'ai' ? renderChatAiMessage(msg.text) : msg.text}

                          {/* Pintasan Navigasi Langsung dari Jawaban AI */}
                          {shortcuts.length > 0 && (
                            <div className="flex flex-wrap items-center gap-1 mt-2 pt-2 border-t border-[#E8D7C0]/60">
                              <span className="text-[9px] text-[#6B5448] font-bold uppercase tracking-wider w-full">Pintasan Cepat:</span>
                              {shortcuts.map((sc, idx) => (
                                <button
                                  key={idx}
                                  type="button"
                                  onClick={sc.onClick}
                                  className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold transition-all active:scale-95 cursor-pointer"
                                  style={{ background: '#FAF6ED', color: '#8B4A1E', border: '1px solid #C49A62' }}
                                >
                                  <span>{sc.label}</span>
                                  <ExternalLink size={9} />
                                </button>
                              ))}
                            </div>
                          )}
                        </div>

                        <div className="flex items-center gap-1.5 px-1 mt-0.5">
                          <span className="text-[9.5px] text-[#6B5448]">{msg.time}</span>
                          {msg.sender === 'ai' && (
                            <button
                              type="button"
                              onClick={() => {
                                try {
                                  const formatted = formatForWhatsApp(msg.text)
                                  navigator.clipboard.writeText(formatted)
                                  setCopiedId(msg.id)
                                  try {
                                    showToast({ variant: 'success', title: 'Tersalin untuk WhatsApp!', description: 'Format tebal & rapi siap dikirim ke WA.' })
                                  } catch { /* ignore */ }
                                  setTimeout(() => setCopiedId(prev => (prev === msg.id ? null : prev)), 2000)
                                } catch { /* ignore */ }
                              }}
                              title="Salin untuk WhatsApp (Format tebal rapi)"
                              className="p-0.5 rounded hover:bg-black/5 text-[#6B5448] transition-colors cursor-pointer"
                            >
                              {copiedId === msg.id ? <Check size={11} className="text-emerald-700" /> : <Copy size={11} />}
                            </button>
                          )}
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            )}

            {/* Loading — teks sesuai fase aktual */}
            {isSendingQuestion && (
              <div className="flex items-start gap-2 max-w-[85%]">
                <div
                  className="w-6 h-6 rounded-full flex items-center justify-center shrink-0"
                  style={{ background: '#F3E7CE', border: '1.5px solid #C49A62' }}
                >
                  <Sparkles size={12} className="text-[#8B4A1E] animate-pulse" />
                </div>
                <div className="p-2.5 rounded-2xl rounded-bl-xs bg-white border border-[#E8D7C0] shadow-xs space-y-1.5 min-w-[160px]">
                  <div className="flex gap-1 items-center">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#8B4A1E] animate-bounce" style={{ animationDelay: '0ms' }} />
                    <span className="w-1.5 h-1.5 rounded-full bg-[#8B4A1E] animate-bounce" style={{ animationDelay: '150ms' }} />
                    <span className="w-1.5 h-1.5 rounded-full bg-[#8B4A1E] animate-bounce" style={{ animationDelay: '300ms' }} />
                  </div>
                  {loadingStatus && (
                    <p className="text-[10.5px] text-[#6B5448] font-medium">{loadingStatus}</p>
                  )}
                </div>
              </div>
            )}
            <div ref={chatBottomRef} />
          </div>

          {/* Form Input Chat & Chip Pertanyaan Cepat */}
          <div
            className="p-2.5 border-t space-y-1.5 bg-[#FAF6ED] shrink-0"
            style={{ borderColor: '#E8D7C0' }}
          >
            {/* Chip Pertanyaan Cepat */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-0.5 scrollbar-none text-[10.5px]">
              <button
                type="button"
                disabled={isSendingQuestion || !isOnline}
                onClick={() => handleSendQuestion('Menu apa yang paling laris dan berapa porsinya?')}
                className="px-2.5 py-1 rounded-full border border-[#C49A62]/70 bg-white/90 text-[#8B4A1E] hover:bg-[#F3E7CE] whitespace-nowrap transition-colors active:scale-95 disabled:opacity-50 cursor-pointer font-medium"
              >
                🥟 Menu Terlaris?
              </button>
              <button
                type="button"
                disabled={isSendingQuestion || !isOnline}
                onClick={() => handleSendQuestion('Apakah ada bahan baku atau kemasan yang stoknya menipis atau kritis?')}
                className="px-2.5 py-1 rounded-full border border-[#C49A62]/70 bg-white/90 text-[#8B4A1E] hover:bg-[#F3E7CE] whitespace-nowrap transition-colors active:scale-95 disabled:opacity-50 cursor-pointer font-medium"
              >
                ⚠️ Stok Menipis?
              </button>
              <button
                type="button"
                disabled={isSendingQuestion || !isOnline}
                onClick={() => handleSendQuestion('Berikan 2 ide promo ringkas untuk meningkatkan omzet hari ini')}
                className="px-2.5 py-1 rounded-full border border-[#C49A62]/70 bg-white/90 text-[#8B4A1E] hover:bg-[#F3E7CE] whitespace-nowrap transition-colors active:scale-95 disabled:opacity-50 cursor-pointer font-medium"
              >
                💡 Saran Promo?
              </button>
            </div>

            {/* Input Field dan Tombol Kirim */}
            <form
              onSubmit={(e) => {
                e.preventDefault()
                handleSendQuestion()
              }}
              className="flex items-center gap-1.5"
            >
              <input
                type="text"
                value={chatInput}
                onChange={(e) => setChatInput(e.target.value)}
                placeholder={isOnline ? "Tanya AI seputar penjualan & stok..." : "Sedang offline..."}
                disabled={isSendingQuestion || !isOnline}
                className="flex-1 px-3 py-1.5 text-[11.5px] rounded-xl border border-[#C49A62] bg-white text-[#2B1810] placeholder-[#6B5448]/60 focus:outline-none focus:ring-1 focus:ring-[#8B4A1E] disabled:bg-gray-100 disabled:opacity-60"
              />
              <button
                type="submit"
                disabled={!chatInput.trim() || isSendingQuestion || !isOnline}
                className="p-2 rounded-xl bg-[#8B4A1E] text-white hover:bg-[#723C18] disabled:opacity-40 disabled:hover:bg-[#8B4A1E] transition-all active:scale-95 cursor-pointer shrink-0 flex items-center justify-center"
                aria-label="Kirim pertanyaan"
                title="Kirim pertanyaan"
              >
                <Send size={14} />
              </button>
            </form>
          </div>

          {/* Footer Panel */}
          <div
            className="p-3 border-t space-y-1.5 select-none shrink-0"
            style={{
              background: '#F3E7CE',
              borderColor: '#E8D7C0'
            }}
          >
            <div className="flex items-center justify-between text-[11px]">
              <span className="text-[#6B5448]">
                {lastUpdatedTime ? `Diperbarui ${lastUpdatedTime}` : 'Belum dianalisis'}
              </span>

              <button
                type="button"
                disabled={loading || cooldownRemaining > 0 || !isOnline}
                onClick={() => runAnalysis(true)}
                className="flex items-center gap-1 font-bold text-[#8B4A1E] hover:underline disabled:opacity-50 disabled:no-underline transition-opacity"
              >
                {!isOnline ? (
                  <>
                    <WifiOff size={12} />
                    <span>Offline</span>
                  </>
                ) : cooldownRemaining > 0 ? (
                  <span>Tunggu {cooldownRemaining}s</span>
                ) : (
                  <>
                    <RefreshCw size={12} className={loading ? 'animate-spin' : ''} />
                    <span>Analisis ulang</span>
                  </>
                )}
              </button>
            </div>

            <p className="text-[9.5px] text-[#6B5448] text-center leading-tight">
              Dibuat AI dari data transaksi. Cek ulang angka penting.
            </p>
          </div>
            {/* Corner Resize Handles */}
            <div
              onPointerDown={(e) => handleResizePointerDown(e, 'left')}
              onPointerMove={handleResizePointerMove}
              onPointerUp={handleResizePointerUp}
              onPointerCancel={handleResizePointerUp}
              className="absolute bottom-0 left-0 w-6 h-6 cursor-sw-resize flex items-end justify-start p-1 text-[#6B5448]/40 hover:text-[#8B4A1E] transition-colors select-none z-10 touch-none"
              title="Tarik untuk ubah ukuran"
            >
              <svg width="8" height="8" viewBox="0 0 8 8" className="rotate-90">
                <circle cx="2" cy="6" r="1" fill="currentColor" />
                <circle cx="6" cy="6" r="1" fill="currentColor" />
                <circle cx="2" cy="2" r="1" fill="currentColor" />
              </svg>
            </div>
            <div
              onPointerDown={(e) => handleResizePointerDown(e, 'right')}
              onPointerMove={handleResizePointerMove}
              onPointerUp={handleResizePointerUp}
              onPointerCancel={handleResizePointerUp}
              className="absolute bottom-0 right-0 w-6 h-6 cursor-se-resize flex items-end justify-end p-1 text-[#6B5448]/40 hover:text-[#8B4A1E] transition-colors select-none z-10 touch-none"
              title="Tarik untuk ubah ukuran"
            >
              <svg width="8" height="8" viewBox="0 0 8 8">
                <circle cx="6" cy="2" r="1" fill="currentColor" />
                <circle cx="6" cy="6" r="1" fill="currentColor" />
                <circle cx="2" cy="2" r="1" fill="currentColor" />
              </svg>
            </div>
        </div>
      )}
    </div>
  )
}

