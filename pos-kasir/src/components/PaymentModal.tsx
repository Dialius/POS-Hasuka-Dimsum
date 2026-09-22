import { useState, useEffect } from 'react'
import { X, Banknote, QrCode, CreditCard, Delete, CheckCircle2 } from 'lucide-react'
import { useApp } from '../context/AppContext'
import { Button } from './common/Button'
import { fmt } from '../utils/formatters'

export type PaymentMethod = 'cash' | 'qris' | 'card' | 'split'

export interface PaymentDetails {
  method: 'CASH' | 'QRIS' | 'CARD' | 'SPLIT'
  cashReceived?: number
  changeAmount?: number
}

interface PaymentModalProps {
  isOpen: boolean
  onClose: () => void
  onSuccess: (details: PaymentDetails) => void
  totalAmount: number
  subtotal: number
  taxAmount: number
  serviceAmount: number
  isSubmitting?: boolean
}


const METHODS = [
{ id: 'cash' as const, label: 'Tunai', icon: Banknote, desc: 'Uang tunai' },
{ id: 'qris' as const, label: 'QRIS', icon: QrCode, desc: 'Scan QR' },
]

const QUICK_AMOUNTS = [20000, 50000, 100000, 200000, 500000]

export default function PaymentModal({ isOpen, onClose, onSuccess, totalAmount, subtotal, taxAmount, serviceAmount, isSubmitting = false }: PaymentModalProps) {
  const { taxRate, serviceRate } = useApp()
  const [method, setMethod] = useState<PaymentMethod>('cash')
  const [received, setReceived] = useState('')
  const [visible, setVisible] = useState(false)
  const [isMobile, setIsMobile] = useState(typeof window !== 'undefined' ? window.innerWidth < 744 : false)

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 744)
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  useEffect(() => {
    if (isOpen) { setReceived(''); setMethod('cash'); setTimeout(() => setVisible(true), 10) }
    else setVisible(false)
  }, [isOpen])

  if (!isOpen && !visible) return null

  const press = (v: string) => setReceived(p => {
    const cur = p.replace(/\D/g, '')
    if (cur === '0' || cur === '') return v
    return cur + v
  })
  const del = () => setReceived(p => p.replace(/\D/g, '').slice(0, -1))

  const parsed = parseInt(received.replace(/\D/g, '') || '0', 10)
  const kembalian = parsed >= totalAmount ? parsed - totalAmount : 0
  const isEnough = parsed >= totalAmount
  const displayReceived = received ? parseInt(received.replace(/\D/g, ''), 10).toLocaleString('id-ID') : ''

  return (
    <div
      className={`fixed inset-0 z-50 flex transition-all duration-300 ${visible ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
      style={{
        background: 'rgba(43,24,16,0.6)',
        backdropFilter: 'blur(4px)',
        // Mobile: align to bottom; Tablet+: center
        alignItems: isMobile ? 'flex-end' : 'center',
        justifyContent: isMobile ? 'stretch' : 'center',
      }}
      onClick={onClose}
    >
      {/* ── Container: bottom sheet on mobile, floating box on tablet+ ── */}
      <div
        className="relative flex overflow-hidden shadow-2xl"
        style={{
          background: '#FAF6ED',
          // Mobile: full width, rounded top, max 92vh
          // Tablet+: fixed width, rounded all sides
          width: isMobile ? '100%' : 760,
          maxHeight: '92vh',
          borderRadius: isMobile ? '20px 20px 0 0' : 24,
          flexDirection: isMobile ? 'column' : 'row',
        }}
        onClick={e => e.stopPropagation()}
      >
        {/* ── Method Selector + Summary (top on mobile, left on tablet+) ── */}
        <div
          className="flex flex-col overflow-y-auto custom-scrollbar"
          style={{
            // Mobile: horizontal method selector strip; Tablet+: left panel
            width: isMobile ? '100%' : 320,
            background: '#2B1810',
            padding: isMobile ? '16px 16px 12px' : '24px 20px',
            flexShrink: 0,
          }}
        >
          {/* Header row */}
          <div className="flex items-center justify-between mb-3">
            <div>
              <h2 className="font-serif font-bold text-white leading-tight" style={{ fontSize: isMobile ? 17 : 20 }}>Metode Bayar</h2>
              {!isMobile && <p className="text-[12px] mt-0.5" style={{ color: '#C49A62' }}>Pilih metode</p>}
            </div>
            <button onClick={onClose} className="w-9 h-9 rounded-lg flex items-center justify-center hover:bg-white/10 transition-colors">
              <X size={18} color="#C49A62" />
            </button>
          </div>

          {/* Method options — horizontal on mobile, vertical on tablet */}
          <div className={isMobile ? 'flex gap-8 overflow-x-auto scrollbar-hide pb-1' : 'flex flex-col gap-8 mb-16'}>
            {METHODS.map(m => {
              const Icon = m.icon
              const active = method === m.id
              return (
                <button
                  key={m.id}
                  onClick={() => setMethod(m.id)}
                  className="flex items-center gap-2.5 rounded-2xl text-left transition-all shrink-0"
                  style={{
                    background: active ? '#F3E7CE' : 'rgba(255,255,255,0.07)',
                    border: active ? '2px solid #C49A62' : '1.5px solid rgba(255,255,255,0.12)',
                    padding: isMobile ? '10px 14px' : '10px 14px',
                    minWidth: isMobile ? 100 : 'auto',
                    minHeight: 44,
                  }}
                >
                  <div className="w-7 h-7 rounded-xl flex items-center justify-center shrink-0" style={{ background: active ? '#8B4A1E' : '#3D2315' }}>
                    <Icon size={15} color={active ? 'white' : '#C49A62'} />
                  </div>
                  <div>
                    <p className="font-bold text-[13px]" style={{ color: active ? '#2B1810' : '#F3E7CE' }}>{m.label}</p>
                    {!isMobile && <p className="text-[10px]" style={{ color: active ? '#6B5448' : '#C49A6280' }}>{m.desc}</p>}
                  </div>
                </button>
              )
            })}
          </div>

          {/* Order summary — only show on tablet+ (mobile shows it inline) */}
          {!isMobile && (
            <div className="rounded-2xl p-3.5 mt-auto" style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)' }}>
              <p className="text-[10px] font-bold mb-2.5" style={{ color: '#C49A62', letterSpacing: '0.06em' }}>RINGKASAN PESANAN</p>
              <div className="space-y-1.5 text-[12px]">
                <div className="flex justify-between"><span style={{ color: '#C49A62' }}>Subtotal</span><span style={{ color: '#F3E7CE' }}>{fmt(subtotal)}</span></div>
                {taxRate > 0 && <div className="flex justify-between"><span style={{ color: '#C49A62' }}>PPN {taxRate}%</span><span style={{ color: '#F3E7CE' }}>{fmt(taxAmount)}</span></div>}
                {serviceRate > 0 && <div className="flex justify-between"><span style={{ color: '#C49A62' }}>Layanan {serviceRate}%</span><span style={{ color: '#F3E7CE' }}>{fmt(serviceAmount)}</span></div>}
                <div className="flex justify-between pt-2" style={{ borderTop: '1px solid rgba(255,255,255,0.1)' }}>
                  <span className="font-bold" style={{ color: '#F3E7CE' }}>TOTAL</span>
                  <span className="font-serif font-bold text-[16px]" style={{ color: '#C49A62' }}>{fmt(totalAmount)}</span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* ── Right/Bottom: Input / QR ── */}
        <div className="flex flex-col flex-1 overflow-y-auto custom-scrollbar" style={{ padding: isMobile ? '16px 16px 20px' : '24px 24px 20px' }}>
          {/* Mobile: compact total display */}
          {isMobile && (
            <div className="flex items-center justify-between mb-3 pb-3" style={{ borderBottom: '1px solid #E8D7C0' }}>
              <span className="text-[12px] font-semibold" style={{ color: '#6B5448' }}>Total</span>
              <span className="font-serif font-bold text-[20px]" style={{ color: '#8B4A1E' }}>{fmt(totalAmount)}</span>
            </div>
          )}

          {method === 'cash' && (
            <>
              {!isMobile && <h3 className="font-serif font-bold text-[17px] mb-0.5" style={{ color: '#2B1810' }}>Pembayaran Tunai</h3>}
              {!isMobile && <p className="text-[11px] mb-3.5" style={{ color: '#6B5448' }}>Nominal diterima</p>}

              {/* Received display */}
              <div className="rounded-2xl px-16 py-8 mb-8" style={{ background: 'white', border: `2px solid ${isEnough ? '#5B8A2E' : '#E8D7C0'}`, transition: 'border-color 0.2s' }}>
                <p className="text-[10px] font-bold mb-0.5" style={{ color: '#6B5448', letterSpacing: '0.06em' }}>UANG DITERIMA</p>
                <div className="flex items-baseline gap-2">
                  <span className="text-[13px] font-bold" style={{ color: '#6B5448' }}>Rp</span>
                  <span className="font-mono font-bold" style={{ color: '#2B1810', fontSize: isMobile ? 22 : 26 }}>{displayReceived || '0'}</span>
                </div>
              </div>

              {/* Change display */}
              {received && (
                <div className="rounded-xl px-16 py-8 mb-8 flex items-center justify-between" style={{ background: isEnough ? '#EAF4E0' : '#FCE8E8' }}>
                  <span className="text-[12px] font-bold" style={{ color: isEnough ? '#5B8A2E' : '#B60000' }}>
                    {isEnough ? 'Kembalian' : `Kurang ${fmt(totalAmount - parsed)}`}
                  </span>
                  {isEnough && <span className="font-mono font-bold text-[16px]" style={{ color: '#5B8A2E' }}>{fmt(kembalian)}</span>}
                </div>
              )}

              {/* Quick amounts */}
              <div className="flex flex-wrap gap-8 mb-8">
                {[...QUICK_AMOUNTS, totalAmount].map(amt => (
                  <button key={amt} onClick={() => setReceived(amt.toString())}
                    className="px-2.5 py-1 rounded-xl text-[11px] font-bold transition-colors"
                    style={{ background: parsed === amt ? '#8B4A1E' : 'white', color: parsed === amt ? 'white' : '#8B4A1E', border: '1.5px solid #8B4A1E', minHeight: 36 }}>
                    {amt === totalAmount ? 'Pas' : fmt(amt)}
                  </button>
                ))}
              </div>

              {/* Numpad — min 48px height per key for touch targets */}
              <div className="grid grid-cols-3 gap-8 mb-8">
                {[1,2,3,4,5,6,7,8,9].map(n => (
                  <button key={n} onClick={() => press(n.toString())}
                    className="rounded-xl font-extrabold text-[18px] transition-all active:scale-95"
                    style={{ background: 'white', color: '#2B1810', border: '1px solid #E8D7C0', minHeight: 48 }}>
                    {n}
                  </button>
                ))}
                <button onClick={del} className="rounded-xl flex items-center justify-center active:scale-95" style={{ background: '#B60000', minHeight: 48 }}>
                  <Delete size={18} color="white" strokeWidth={2.5} />
                </button>
                <button onClick={() => press('0')} className="rounded-xl font-extrabold text-[18px] active:scale-95" style={{ background: 'white', color: '#2B1810', border: '1px solid #E8D7C0', minHeight: 48 }}>0</button>
                <button onClick={() => press('000')} className="rounded-xl font-bold text-[13px] active:scale-95" style={{ background: 'white', color: '#2B1810', border: '1px solid #E8D7C0', minHeight: 48 }}>000</button>
              </div>
            </>
          )}

          {method === 'qris' && (
            <div className="flex flex-col items-center justify-center flex-1 py-4">
              <h3 className="font-serif font-bold text-[18px] mb-1" style={{ color: '#2B1810' }}>Bayar via QRIS</h3>
              <p className="text-[12px] mb-4 text-center" style={{ color: '#6B5448' }}>Scan QR ini</p>
              <div className="w-40 h-40 rounded-2xl flex items-center justify-center mb-4" style={{ background: 'white', border: '2px solid #E8D7C0' }}>
                <QrCode size={100} color="#2B1810" strokeWidth={1} />
              </div>
              <p className="font-mono text-[12px] mb-4" style={{ color: '#6B5448' }}>Total: <span className="font-bold" style={{ color: '#8B4A1E' }}>{fmt(totalAmount)}</span></p>
              <div className="rounded-xl px-5 py-3 w-full text-center mb-3" style={{ background: '#FEF9EC', border: '1px solid #C9A22740' }}>
                <p className="text-[12px] font-semibold" style={{ color: '#C9A227' }}>Menunggu konfirmasi pembayaran...</p>
              </div>
            </div>
          )}

          {method === 'card' && (
            <div className="flex flex-col items-center justify-center flex-1 py-4">
              <h3 className="font-serif font-bold text-[18px] mb-1" style={{ color: '#2B1810' }}>Bayar via Kartu</h3>
              <p className="text-[12px] mb-6 text-center" style={{ color: '#6B5448' }}>Proses EDC lalu konfirmasi</p>
              <div className="w-28 h-28 rounded-2xl flex items-center justify-center mb-4" style={{ background: '#F3E7CE', border: '2px solid #C49A62' }}>
                <CreditCard size={50} color="#8B4A1E" strokeWidth={1.5} />
              </div>
              <p className="font-serif font-bold text-[24px] mb-4" style={{ color: '#2B1810' }}>{fmt(totalAmount)}</p>
            </div>
          )}

          {method === 'split' && (
            <div className="flex flex-col flex-1 py-2">
              <h3 className="font-serif font-bold text-[18px] mb-1" style={{ color: '#2B1810' }}>Bayar Split</h3>
              <p className="text-[12px] mb-4" style={{ color: '#6B5448' }}>Total dibagi dalam dua metode</p>
              <div className="rounded-2xl p-4 mb-4" style={{ background: '#F3E7CE', border: '1px solid #E8D7C0' }}>
                <p className="text-[13px] text-center font-bold" style={{ color: '#2B1810' }}>Total: {fmt(totalAmount)}</p>
              </div>
              <div className="flex gap-3">
                {['Tunai', 'QRIS'].map(m => (
                  <div key={m} className="flex-1 rounded-xl p-3" style={{ background: 'white', border: '1px solid #E8D7C0' }}>
                    <p className="text-[12px] font-bold mb-2" style={{ color: '#6B5448' }}>{m}</p>
                    <input type="number" placeholder="Rp 0" className="w-full text-[14px] font-bold outline-none" style={{ color: '#2B1810' }} />
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Confirm button — min 52px height */}
          <Button
            onClick={() => {
              if (isSubmitting) return
              if (method === 'cash' && !isEnough) return
              const methodMap: Record<PaymentMethod, 'CASH' | 'QRIS' | 'CARD' | 'SPLIT'> = {
                cash: 'CASH',
                qris: 'QRIS',
                card: 'CARD',
                split: 'SPLIT',
              }
              onSuccess({
                method: methodMap[method],
                cashReceived: method === 'cash' ? parsed : totalAmount,
                changeAmount: method === 'cash' ? kembalian : 0,
              })
            }}
            disabled={(method === 'cash' && !isEnough) || isSubmitting}
            variant="primary"
            size="lg"
            fullWidth
            loading={isSubmitting}
            icon={!isSubmitting ? <CheckCircle2 size={18} /> : undefined}
            className="mt-2 shadow-md active:scale-95"
            style={{ minHeight: 52 }}
          >
            {isSubmitting ? (
              <span>Menyimpan ke Database...</span>
            ) : (
              <span>
                {method === 'cash'
                  ? (isEnough ? `Konfirmasi · Kembalian ${fmt(kembalian)}` : `Kurang ${fmt(totalAmount - parsed)}`)
                  : `Konfirmasi Pembayaran ${fmt(totalAmount)} (Pas)`}
              </span>
            )}
          </Button>
        </div>
      </div>
    </div>
  )
}
