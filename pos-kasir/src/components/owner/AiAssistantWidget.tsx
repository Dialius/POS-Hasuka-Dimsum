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
  MessageSquare
} from 'lucide-react'
import { useApp } from '../../context/AppContext'
import { gasApi, AiInsightResponse, mapAiErrorMessage } from '../../services/gasApi'
import { buildAiSnapshot, AiSnapshotResult } from '../../utils/aiSnapshot'
import { useDraggable } from '../../hooks/useDraggable'

function renderMarkdown(text: string): React.ReactNode {
  const parts = text.split(/(\*\*[^*]+\*\*|\*[^*]+\*)/g)
  return parts.map((part, i) => {
    if (part.startsWith('**') && part.endsWith('**')) return <strong key={i}>{part.slice(2, -2)}</strong>
    if (part.startsWith('*') && part.endsWith('*')) return <em key={i}>{part.slice(1, -1)}</em>
    return part
  })
}

const PERIOD_LABELS: Record<string, string> = {
  today: 'Hari Ini',
  '7days': '7 Hari Terakhir',
  month: 'Bulan Ini',
  custom: 'Kustom'
}

interface AiAssistantWidgetProps {
  dashboardData: any
  selectedBranch: string
  period: 'today' | '7days' | 'month' | 'custom'
  customDate?: string
  onDisableAi?: () => void
}

const OWNER_KEY_STORAGE = 'hasuka_ai_owner_key'
const COOLDOWN_SECONDS = 10

export const AiAssistantWidget: React.FC<AiAssistantWidgetProps> = ({
  dashboardData,
  selectedBranch,
  period,
  customDate,
  onDisableAi
}) => {
  const {
    isOnline,
    outletsList,
    cashiersList,
    productsList,
    ingredientsList,
    shiftTolerance
  } = useApp()

  const [isOpen, setIsOpen] = useState(false)
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
  const [chatMessages, setChatMessages] = useState<Array<{ id: string; sender: 'user' | 'ai'; text: string; time: string }>>([])
  const [chatInput, setChatInput] = useState('')
  const [isSendingQuestion, setIsSendingQuestion] = useState(false)

  const widgetRef = useRef<HTMLDivElement>(null)
  const chatBottomRef = useRef<HTMLDivElement>(null)
  const latestSnapshotRef = useRef<any>(null)
  const hasInitializedRef = useRef(false)
  const prevFilterRef = useRef({ selectedBranch, period, customDate })
  const cooldownTimerRef = useRef<any>(null)

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
  const periodMap: Record<string, string> = {
    today: 'Hari Ini',
    '7days': '7 Hari',
    month: 'Bulan Ini',
    custom: 'Kustom'
  }
  const scopeLabel = `${branchName} · ${periodMap[period] || period}`

  // Eksekusi pemanggilan analisis AI
  const runAnalysis = useCallback(async (force = false) => {
    if (loading) return

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
      return
    }

    latestSnapshotRef.current = snapshotRes
    setIsEmptySnapshot(false)
    setLoading(true)
    setErrorMessage(null)
    setIsAuthError(false)

    try {
      let savedOwnerKey = ''
      try {
        savedOwnerKey = localStorage.getItem(OWNER_KEY_STORAGE) || ''
      } catch { /* ignore */ }

      const res = await gasApi.aiAnalyze({
        scope: `${selectedBranch}_${period}_${customDate || ''}`,
        snapshot: snapshotRes,
        ownerKey: savedOwnerKey,
        force
      })

      setData(res)
      if (force) {
        setCooldownRemaining(COOLDOWN_SECONDS)
      }
    } catch (err: any) {
      const rawMsg = err instanceof Error ? err.message : String(err)
      const mapped = mapAiErrorMessage(rawMsg, !isOnline)
      setErrorMessage(mapped.message)
      if (mapped.isAuthError) {
        setIsAuthError(true)
      }
    } finally {
      setLoading(false)
    }
  }, [
    loading,
    dashboardData,
    selectedBranch,
    period,
    customDate,
    outletsList,
    cashiersList,
    productsList,
    ingredientsList,
    shiftTolerance,
    isOnline
  ])

  // Eksekusi pengiriman pertanyaan interaktif ke AI
  const handleSendQuestion = async (customQ?: string) => {
    const textToSend = (customQ || chatInput).trim()
    if (!textToSend || isSendingQuestion || !isOnline) return

    const now = new Date()
    const timeStr = now.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })

    const userMsg = {
      id: `u_${Date.now()}`,
      sender: 'user' as const,
      text: textToSend,
      time: timeStr
    }

    setChatMessages(prev => [...prev, userMsg])
    if (!customQ) setChatInput('')
    setIsSendingQuestion(true)

    setTimeout(() => chatBottomRef.current?.scrollIntoView({ behavior: 'smooth' }), 50)

    try {
      let snapshotToUse = latestSnapshotRef.current
      if (!snapshotToUse) {
        snapshotToUse = buildAiSnapshot({
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
      }

      let savedOwnerKey = ''
      try {
        savedOwnerKey = localStorage.getItem(OWNER_KEY_STORAGE) || ''
      } catch { /* ignore */ }

      const periodLabel = PERIOD_LABELS[period] || period
      const branchCtx = selectedBranch === 'all' ? 'Semua Cabang' : (outletsList.find(o => String(o.id) === String(selectedBranch))?.name || selectedBranch)
      const contextualQuestion = `[Periode: ${periodLabel}, ${branchCtx}]\n\n${textToSend}`

      const res = await gasApi.aiAnalyze({
        scope: `${selectedBranch}_${period}_${customDate || ''}`,
        snapshot: snapshotToUse,
        ownerKey: savedOwnerKey,
        question: contextualQuestion,
        force: true
      })

      const rawAnswer = (res.insight?.headline || '').trim() || 'Maaf, tidak ada jawaban dari AI.'
      const aiMsg = {
        id: `ai_${Date.now()}`,
        sender: 'ai' as const,
        text: rawAnswer,
        time: new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })
      }
      setChatMessages(prev => [...prev, aiMsg])
    } catch (err: any) {
      const rawMsg = err instanceof Error ? err.message : String(err)
      const mapped = mapAiErrorMessage(rawMsg, !isOnline)
      const errMsg = {
        id: `err_${Date.now()}`,
        sender: 'ai' as const,
        text: `⚠️ ${mapped.message}`,
        time: new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })
      }
      setChatMessages(prev => [...prev, errMsg])
    } finally {
      setIsSendingQuestion(false)
      setTimeout(() => chatBottomRef.current?.scrollIntoView({ behavior: 'smooth' }), 50)
    }
  }

  // Trigger: Pertama kali panel dibuka
  useEffect(() => {
    if (isOpen && !hasInitializedRef.current) {
      hasInitializedRef.current = true
      runAnalysis(false)
    }
  }, [isOpen, runAnalysis])

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

  const handleSaveOwnerKey = (e: React.FormEvent) => {
    e.preventDefault()
    try {
      localStorage.setItem(OWNER_KEY_STORAGE, ownerKeyInput.trim())
    } catch { /* ignore */ }
    setIsAuthError(false)
    runAnalysis(true)
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
        transition: isDragging ? 'none' : 'left 0.22s ease-out, top 0.22s ease-out'
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
            {!isOnline && (
              <span
                className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full border border-white"
                style={{ background: '#C9A227' }}
                title="Mode Offline"
              />
            )}
          </div>
        </button>
      ) : (
        /* Keadaan Buka: Panel AI Insight */
        <div
          className="w-[calc(100vw-32px)] sm:w-[380px] max-w-[400px] max-h-[75vh] md:max-h-[80vh] flex flex-col rounded-2xl shadow-2xl border text-[#2B1810] overflow-hidden"
          style={{
            background: '#FAF6ED',
            borderColor: '#E8D7C0'
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
            {/* Status: Loading Skeleton */}
            {loading && (
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
            )}

            {/* Status: Kosong (Empty Snapshot) */}
            {!loading && isEmptySnapshot && (
              <div className="py-6 text-center space-y-2">
                <div className="w-10 h-10 mx-auto rounded-full flex items-center justify-center bg-amber-100 text-amber-800">
                  <AlertCircle size={20} />
                </div>
                <p className="font-semibold text-[#2B1810]">Belum ada transaksi</p>
                <p className="text-[11px] text-[#6B5448]">
                  Tidak ada transaksi tercatat pada periode ini untuk dianalisis oleh AI.
                </p>
              </div>
            )}

            {/* Status: Error Message */}
            {!loading && errorMessage && (
              <div className="p-3 rounded-xl border border-red-200 bg-red-50 text-red-900 space-y-2.5">
                <div className="flex items-start gap-2">
                  <AlertCircle size={16} className="text-red-700 shrink-0 mt-0.5" />
                  <div className="flex-1">
                    <p className="font-semibold text-[12px] text-red-900 leading-tight">Gagal Memuat Analisis</p>
                    <p className="text-[11px] text-red-800 mt-1">{errorMessage}</p>
                  </div>
                </div>

                {/* Form Input Kode Akses jika AI_FORBIDDEN */}
                {isAuthError && (
                  <form onSubmit={handleSaveOwnerKey} className="space-y-2 pt-1">
                    <label className="block text-[11px] font-semibold text-red-900">
                      Masukkan Kode Akses AI:
                    </label>
                    <div className="flex items-center gap-1.5">
                      <div className="relative flex-1">
                        <Key size={13} className="absolute left-2.5 top-2.5 text-gray-500" />
                        <input
                          type="password"
                          value={ownerKeyInput}
                          onChange={e => setOwnerKeyInput(e.target.value)}
                          placeholder="Kode Akses..."
                          className="w-full pl-8 pr-2 py-1.5 text-[11px] rounded-lg border border-red-300 bg-white text-gray-900 focus:outline-none focus:ring-1 focus:ring-red-500"
                        />
                      </div>
                      <button
                        type="submit"
                        className="px-2.5 py-1.5 rounded-lg text-[11px] font-bold text-white bg-red-700 hover:bg-red-800 transition-colors shrink-0"
                      >
                        Simpan
                      </button>
                    </div>
                  </form>
                )}

                <div className="pt-1">
                  <button
                    type="button"
                    onClick={() => runAnalysis(true)}
                    className="flex items-center gap-1 px-3 py-1 rounded-lg text-[11px] font-bold text-red-900 bg-red-100 hover:bg-red-200 transition-colors"
                  >
                    <RefreshCw size={12} />
                    <span>Coba Lagi</span>
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
                          <span className="text-[#2B1810]">{h.text}</span>
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
                          <span className="text-[#2B1810]">{rec}</span>
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
                <div className="flex items-center gap-1.5 text-[11px] font-bold text-[#6B5448] uppercase tracking-wider">
                  <MessageSquare size={13} className="text-[#8B4A1E]" />
                  <span>Tanya Sifu</span>
                </div>
                <div className="space-y-2">
                  {chatMessages.map(msg => (
                    <div
                      key={msg.id}
                      className={`flex flex-col ${msg.sender === 'user' ? 'items-end' : 'items-start'}`}
                    >
                      <div
                        className={`p-2.5 rounded-2xl text-[11.5px] max-w-[90%] leading-relaxed whitespace-pre-line ${
                          msg.sender === 'user'
                            ? 'bg-[#8B4A1E] text-white rounded-br-xs shadow-xs'
                            : 'bg-white border border-[#E8D7C0] text-[#2B1810] rounded-bl-xs shadow-xs'
                        }`}
                      >
                        {msg.sender === 'ai' ? renderMarkdown(msg.text) : msg.text}
                      </div>
                      <span className="text-[9.5px] text-[#6B5448] px-1 mt-0.5">{msg.time}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Indikator Mengetik saat AI Sedang Memproses Pertanyaan */}
            {isSendingQuestion && (
              <div className="flex items-center gap-2 p-2 bg-white/80 rounded-xl border border-[#E8D7C0] w-fit shadow-xs">
                <Sparkles size={13} className="animate-spin text-[#8B4A1E]" />
                <span className="text-[11px] text-[#6B5448] font-medium">AI sedang memikirkan jawaban...</span>
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
        </div>
      )}
    </div>
  )
}

