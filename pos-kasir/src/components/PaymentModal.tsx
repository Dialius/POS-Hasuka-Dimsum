import { useState, useEffect } from 'react'
import { X, Banknote, QrCode, CreditCard, SquareSplitHorizontal, Delete, CheckCircle2 } from 'lucide-react'
import { useApp } from '../context/AppContext'

type PaymentMethod = 'cash' | 'qris' | 'card' | 'split'

interface PaymentModalProps {
  isOpen: boolean
  onClose: () => void
  onSuccess: () => void
  totalAmount: number
}

const fmt = (n: number) => `Rp ${n.toLocaleString('id-ID')}`

const METHODS = [
  { id: 'cash' as const, label: 'Tunai', icon: Banknote, desc: 'Pembayaran uang cash' },
  { id: 'qris' as const, label: 'QRIS', icon: QrCode, desc: 'Scan QR code pelanggan' },
  { id: 'card' as const, label: 'Kartu', icon: CreditCard, desc: 'Debit / Kredit / EDC' },
  { id: 'split' as const, label: 'Split', icon: SquareSplitHorizontal, desc: 'Bayar dua metode' },
]

const QUICK_AMOUNTS = [20000, 50000, 100000, 200000, 500000]

export default function PaymentModal({ isOpen, onClose, onSuccess, totalAmount }: PaymentModalProps) {
  const { taxRate, serviceRate } = useApp()
  const [method, setMethod] = useState<PaymentMethod>('cash')
  const [received, setReceived] = useState('')
  const [visible, setVisible] = useState(false)

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
      className={`fixed inset-0 z-50 flex items-center justify-center transition-all duration-300 ${visible ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
      style={{ background: 'rgba(43,24,16,0.6)', backdropFilter: 'blur(4px)' }}
      onClick={onClose}
    >
      <div
        className="relative flex overflow-hidden rounded-3xl shadow-2xl"
        style={{ width: 760, maxHeight: '92vh', background: '#FAF6ED' }}
        onClick={e => e.stopPropagation()}
      >
        {/* ── Left: Method Selector + Summary ── */}
        <div
          className="flex flex-col shrink-0 overflow-y-auto custom-scrollbar"
          style={{ width: 320, background: '#2B1810', padding: '24px 20px' }}
        >
          {/* Header */}
          <div className="flex items-start justify-between mb-5">
            <div>
              <h2 className="font-serif font-bold text-[20px] text-white leading-tight">Metode Bayar</h2>
              <p className="text-[12px] mt-0.5" style={{ color: '#C49A62' }}>Pilih cara pembayaran</p>
            </div>
            <button onClick={onClose} className="w-8 h-8 rounded-lg flex items-center justify-center hover:bg-white/10 transition-colors mt-0.5">
              <X size={18} color="#C49A62" />
            </button>
          </div>

          {/* Method options */}
          <div className="flex flex-col gap-2 mb-5">
            {METHODS.map(m => {
              const Icon = m.icon
              const active = method === m.id
              return (
                <button
                  key={m.id}
                  onClick={() => setMethod(m.id)}
                  className="flex items-center gap-3 px-3.5 py-2.5 rounded-2xl text-left transition-all"
                  style={{
                    background: active ? '#F3E7CE' : 'rgba(255,255,255,0.05)',
                    border: active ? '2px solid #C49A62' : '1.5px solid rgba(255,255,255,0.1)',
                  }}
                >
                  <div className="w-8 h-8 rounded-xl flex items-center justify-center shrink-0" style={{ background: active ? '#8B4A1E' : '#3D2315' }}>
                    <Icon size={16} color={active ? 'white' : '#C49A62'} />
                  </div>
                  <div>
                    <p className="font-bold text-[13px]" style={{ color: active ? '#2B1810' : '#F3E7CE' }}>{m.label}</p>
                    <p className="text-[10px]" style={{ color: active ? '#6B5448' : '#C49A6280' }}>{m.desc}</p>
                  </div>
                </button>
              )
            })}
          </div>

          {/* Order summary */}
          <div className="rounded-2xl p-3.5 mt-auto" style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)' }}>
            <p className="text-[10px] font-bold mb-2.5" style={{ color: '#C49A62', letterSpacing: '0.06em' }}>RINGKASAN PESANAN</p>
            <div className="space-y-1.5 text-[12px]">
              <div className="flex justify-between"><span style={{ color: '#C49A62' }}>Subtotal</span><span style={{ color: '#F3E7CE' }}>{fmt(Math.round(totalAmount / 1.11))}</span></div>
              {taxRate > 0 && <div className="flex justify-between"><span style={{ color: '#C49A62' }}>PPN {taxRate}%</span><span style={{ color: '#F3E7CE' }}>{fmt(totalAmount - Math.round(totalAmount / 1.11))}</span></div>}
              {serviceRate > 0 && <div className="flex justify-between"><span style={{ color: '#C49A62' }}>Layanan {serviceRate}%</span><span style={{ color: '#F3E7CE' }}>{fmt(Math.round(totalAmount * serviceRate / 100))}</span></div>}
              <div className="flex justify-between pt-2" style={{ borderTop: '1px solid rgba(255,255,255,0.1)' }}>
                <span className="font-bold" style={{ color: '#F3E7CE' }}>TOTAL</span>
                <span className="font-serif font-bold text-[16px]" style={{ color: '#C49A62' }}>{fmt(totalAmount)}</span>
              </div>
            </div>
          </div>
        </div>

        {/* ── Right: Input / QR (Scrollable) ── */}
        <div className="flex flex-col flex-1 overflow-y-auto custom-scrollbar" style={{ padding: '24px 24px 20px' }}>
          {method === 'cash' && (
            <>
              <h3 className="font-serif font-bold text-[17px] mb-0.5" style={{ color: '#2B1810' }}>Pembayaran Tunai</h3>
              <p className="text-[11px] mb-3.5" style={{ color: '#6B5448' }}>Masukkan nominal uang yang diterima dari pelanggan</p>

              {/* Received display */}
              <div className="rounded-2xl px-4 py-3 mb-2.5" style={{ background: 'white', border: `2px solid ${isEnough ? '#5B8A2E' : '#E8D7C0'}`, transition: 'border-color 0.2s' }}>
                <p className="text-[10px] font-bold mb-0.5" style={{ color: '#6B5448', letterSpacing: '0.06em' }}>UANG DITERIMA</p>
                <div className="flex items-baseline gap-2">
                  <span className="text-[14px] font-bold" style={{ color: '#6B5448' }}>Rp</span>
                  <span className="font-mono font-bold text-[26px]" style={{ color: '#2B1810' }}>{displayReceived || '0'}</span>
                </div>
              </div>

              {/* Change display */}
              {received && (
                <div className="rounded-xl px-4 py-2 mb-2.5 flex items-center justify-between" style={{ background: isEnough ? '#EAF4E0' : '#FCE8E8' }}>
                  <span className="text-[12px] font-bold" style={{ color: isEnough ? '#5B8A2E' : '#B60000' }}>
                    {isEnough ? 'Kembalian' : `Kurang ${fmt(totalAmount - parsed)}`}
                  </span>
                  {isEnough && <span className="font-mono font-bold text-[16px]" style={{ color: '#5B8A2E' }}>{fmt(kembalian)}</span>}
                </div>
              )}

              {/* Quick amounts */}
              <div className="flex flex-wrap gap-1.5 mb-3 custom-scrollbar">
                {[...QUICK_AMOUNTS, totalAmount].map(amt => (
                  <button key={amt} onClick={() => setReceived(amt.toString())}
                    className="px-2.5 py-1 rounded-xl text-[11px] font-bold transition-colors"
                    style={{ background: parsed === amt ? '#8B4A1E' : 'white', color: parsed === amt ? 'white' : '#8B4A1E', border: '1.5px solid #8B4A1E' }}>
                    {amt === totalAmount ? 'Pas' : fmt(amt)}
                  </button>
                ))}
              </div>

              {/* Numpad */}
              <div className="grid grid-cols-3 gap-1.5 mb-3">
                {[1,2,3,4,5,6,7,8,9].map(n => (
                  <button key={n} onClick={() => press(n.toString())}
                    className="py-2.5 rounded-xl font-extrabold text-[18px] transition-all active:scale-95"
                    style={{ background: 'white', color: '#2B1810', border: '1px solid #E8D7C0' }}>
                    {n}
                  </button>
                ))}
                <button onClick={del} className="py-2.5 rounded-xl flex items-center justify-center active:scale-95" style={{ background: '#B60000' }}>
                  <Delete size={18} color="white" strokeWidth={2.5} />
                </button>
                <button onClick={() => press('0')} className="py-2.5 rounded-xl font-extrabold text-[18px] active:scale-95" style={{ background: 'white', color: '#2B1810', border: '1px solid #E8D7C0' }}>0</button>
                <button onClick={() => press('000')} className="py-2.5 rounded-xl font-bold text-[13px] active:scale-95" style={{ background: 'white', color: '#2B1810', border: '1px solid #E8D7C0' }}>000</button>
              </div>
            </>
          )}

          {method === 'qris' && (
            <div className="flex flex-col items-center justify-center flex-1 py-4">
              <h3 className="font-serif font-bold text-[18px] mb-1" style={{ color: '#2B1810' }}>Bayar via QRIS</h3>
              <p className="text-[12px] mb-6 text-center" style={{ color: '#6B5448' }}>Perlihatkan QR code berikut kepada pelanggan untuk discan</p>
              <div className="w-44 h-44 rounded-2xl flex items-center justify-center mb-4" style={{ background: 'white', border: '2px solid #E8D7C0' }}>
                <QrCode size={110} color="#2B1810" strokeWidth={1} />
              </div>
              <p className="font-mono text-[12px] mb-6" style={{ color: '#6B5448' }}>Total: <span className="font-bold" style={{ color: '#8B4A1E' }}>{fmt(totalAmount)}</span></p>
              <div className="rounded-xl px-5 py-3 w-full text-center mb-4" style={{ background: '#FEF9EC', border: '1px solid #C9A22740' }}>
                <p className="text-[12px] font-semibold" style={{ color: '#C9A227' }}>Menunggu konfirmasi pembayaran...</p>
              </div>
            </div>
          )}

          {method === 'card' && (
            <div className="flex flex-col items-center justify-center flex-1 py-4">
              <h3 className="font-serif font-bold text-[18px] mb-1" style={{ color: '#2B1810' }}>Bayar via Kartu</h3>
              <p className="text-[12px] mb-8 text-center" style={{ color: '#6B5448' }}>Silakan proses kartu pada mesin EDC, lalu konfirmasi di bawah</p>
              <div className="w-32 h-32 rounded-2xl flex items-center justify-center mb-6" style={{ background: '#F3E7CE', border: '2px solid #C49A62' }}>
                <CreditCard size={56} color="#8B4A1E" strokeWidth={1.5} />
              </div>
              <p className="font-serif font-bold text-[26px] mb-6" style={{ color: '#2B1810' }}>{fmt(totalAmount)}</p>
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

          {/* Confirm button */}
          <button
            onClick={() => { if (method === 'cash' && !isEnough) return; onSuccess() }}
            disabled={method === 'cash' && !isEnough}
            className="w-full py-3.5 rounded-2xl font-bold text-[15px] flex items-center justify-center gap-3 transition-all shrink-0 mt-2"
            style={{
              background: (method !== 'cash' || isEnough) ? '#8B4A1E' : '#C49A62',
              color: 'white',
              opacity: (method !== 'cash' || isEnough) ? 1 : 0.55,
              cursor: (method !== 'cash' || isEnough) ? 'pointer' : 'not-allowed',
            }}
          >
            <CheckCircle2 size={18} />
            {method === 'cash'
              ? (isEnough ? `Konfirmasi · Kembalian ${fmt(kembalian)}` : `Kurang ${fmt(totalAmount - parsed)}`)
              : `Konfirmasi Pembayaran ${fmt(totalAmount)}`}
          </button>
        </div>
      </div>
    </div>
  )
}
