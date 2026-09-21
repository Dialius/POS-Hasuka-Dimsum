import { useState } from 'react'
import { QrCode, Smartphone, RefreshCw, Eye, Copy, Check, ExternalLink, ToggleLeft, ToggleRight, X } from 'lucide-react'
import PageShell from './PageShell'
import { useApp } from '../context/AppContext'
import { fmt } from '../utils/formatters'


const HIDDEN_KEY = 'hasuka_qr_menu_hidden'
const loadHidden = (): number[] => {
  try {
    const arr = JSON.parse(localStorage.getItem(HIDDEN_KEY) || '[]')
    return Array.isArray(arr) ? arr.filter((x): x is number => typeof x === 'number') : []
  } catch { return [] }
}

export default function QrMenuScreen({ onBack, backLabel }: { onBack: () => void; backLabel?: string }) {
  const { outlet, productsList, lastSyncTime } = useApp()
  const [hidden, setHidden] = useState<number[]>(loadHidden)
  const [copied, setCopied] = useState(false)
  const [qrRegen, setQrRegen] = useState(false)
  const [previewOpen, setPreviewOpen] = useState(false)

  const menuUrl = `hasuka.menu/${outlet.id}/01`
  const isLoading = productsList.length === 0 && lastSyncTime === null

  const persist = (ids: number[]) => {
    setHidden(ids)
    try { localStorage.setItem(HIDDEN_KEY, JSON.stringify(ids)) } catch { /* storage penuh: abaikan */ }
  }

  const toggleItem = (id: number) =>
    persist(hidden.includes(id) ? hidden.filter(h => h !== id) : [...hidden, id])

  const isShown = (id: number) => !hidden.includes(id)
  const shownCount = productsList.filter(p => isShown(p.id)).length
  const cats = [...new Set(productsList.map(p => p.cat))]

  const copyUrl = () => {
    navigator.clipboard.writeText(`https://${menuUrl}`).catch(() => {})
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const regenQr = () => {
    setQrRegen(true)
    setTimeout(() => setQrRegen(false), 800)
  }

  return (
    <PageShell
      title="QR Menu Digital"
      subtitle={`Menu digital · ${shownCount} produk aktif`}
      onBack={onBack}
      backLabel={backLabel}
      rightPanelWidth={320}
      rightPanel={
        <div className="flex flex-col items-center px-6 py-8 overflow-y-auto custom-scrollbar h-full">
          {/* QR Display */}
          <div className={`w-48 h-48 rounded-3xl flex items-center justify-center mb-5 shadow-inner transition-all ${qrRegen ? 'opacity-0 scale-95' : 'opacity-100 scale-100'}`}
            style={{ background: 'white', border: '3px solid #E8D7C0' }}>
            <QrCode size={120} color="#2B1810" strokeWidth={1} />
          </div>

          <h3 className="font-serif font-bold text-[16px] mb-1 text-center" style={{ color: '#F3E7CE' }}>{outlet.name.replace('Hasuka Dimsum — ', '')}</h3>
          <p className="text-[11px] text-center mb-5" style={{ color: '#C49A62' }}>
            Scan QR lihat menu. URL auto-update.
          </p>

          {/* URL bar */}
          <div className="w-full rounded-xl px-4 py-2.5 mb-4 flex items-center gap-2" style={{ background: '#3D2315', border: '1px solid #C49A6240' }}>
            <span className="text-[11px] flex-1 truncate font-mono" style={{ color: '#C49A62' }}>{menuUrl}</span>
            <button onClick={copyUrl} className="flex items-center gap-1 text-[11px] font-bold transition-colors" style={{ color: copied ? '#5B8A2E' : '#F3E7CE' }}>
              {copied ? <Check size={13} /> : <Copy size={13} />}
              {copied ? 'Tersalin' : 'Salin'}
            </button>
          </div>

          {/* Action buttons */}
          <div className="flex flex-col gap-8 w-full mb-16">
            <button
              onClick={() => setPreviewOpen(true)}
              className="w-full py-2.5 rounded-xl font-bold text-[13px] flex items-center justify-center gap-2 transition-all active:scale-95 shadow-lg hover:shadow-xl"
              style={{
                background: 'linear-gradient(135deg, #66BB6A 0%, #43A047 100%)',
                color: 'white',
                boxShadow: '0 4px 12px rgba(67,160,71,0.4)'
              }}
            >
              <Eye size={15} /> Preview Menu Digital
            </button>
            <button
              onClick={() => window.open(`https://${menuUrl}`, '_blank')}
              className="w-full py-2.5 rounded-xl font-bold text-[13px] flex items-center justify-center gap-2"
              style={{ background: '#3D2315', color: '#C49A62', border: '1px solid #C49A6240' }}
            >
              <ExternalLink size={15} /> Buka di Browser
            </button>
            <div className="grid grid-cols-2 gap-8">
              <button onClick={regenQr} className="py-2.5 rounded-xl font-bold text-[12px] flex items-center justify-center gap-1.5" style={{ background: '#3D2315', color: '#C49A62', border: '1px solid #C49A6240' }}>
                <RefreshCw size={13} className={qrRegen ? 'animate-spin' : ''} /> Regenerate
              </button>
              <button className="py-2.5 rounded-xl font-bold text-[12px] flex items-center justify-center gap-1.5" style={{ background: '#3D2315', color: '#C49A62', border: '1px solid #C49A6240' }}>
                <Smartphone size={13} /> Cetak QR
              </button>
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 gap-8 w-full">
            {[
              { label: 'Scan Hari Ini', val: '47' },
              { label: 'Ditampilkan', val: String(shownCount) },
            ].map(s => (
              <div key={s.label} className="rounded-xl p-3 text-center" style={{ background: '#3D2315', border: '1px solid #C49A6230' }}>
                <p className="font-serif font-bold text-[20px]" style={{ color: '#F3E7CE' }}>{s.val}</p>
                <p className="text-[10px] mt-0.5" style={{ color: '#C49A62' }}>{s.label}</p>
              </div>
            ))}
          </div>
        </div>
      }
    >
      {/* Main: menu visibility editor */}
      <div className="px-6 py-5">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="font-serif font-bold text-[16px]" style={{ color: '#2B1810' }}>Kelola Tampilan Menu</h2>
            <p className="text-[12px]" style={{ color: '#6B5448' }}>Tampil/sembunyikan produk</p>
          </div>
        </div>

        {isLoading ? (
          <div className="space-y-4">
            {[0, 1, 2].map(i => (
              <div key={i} className="rounded-2xl overflow-hidden animate-pulse" style={{ border: '1px solid #E8D7C0' }}>
                <div className="px-5 py-3" style={{ background: '#E8D7C0' }}>
                  <div className="h-3 w-24 rounded" style={{ background: '#E8D7C0' }} />
                </div>
                {[0, 1].map(j => (
                  <div key={j} className="flex items-center gap-4 px-5 py-3" style={{ background: 'white' }}>
                    <div className="w-6 h-6 rounded-full" style={{ background: '#E8D7C0' }} />
                    <div className="flex-1 space-y-1.5">
                      <div className="h-3 w-2/3 rounded" style={{ background: '#E8D7C0' }} />
                      <div className="h-2 w-20 rounded" style={{ background: '#E8D7C0' }} />
                    </div>
                    <div className="h-4 w-16 rounded-full" style={{ background: '#E8D7C0' }} />
                  </div>
                ))}
              </div>
            ))}
          </div>
        ) : productsList.length === 0 ? (
          <div className="rounded-2xl py-16 text-center" style={{ border: '1px solid #E8D7C0', background: 'white' }}>
            <p className="font-serif font-bold text-[15px] mb-1" style={{ color: '#2B1810' }}>Belum ada menu</p>
            <p className="text-[12px]" style={{ color: '#6B5448' }}>Tambahkan produk terlebih dahulu di Kelola Produk.</p>
          </div>
        ) : cats.map(cat => {
          const items = productsList.filter(p => p.cat === cat)
          return (
            <div key={cat} className="mb-4 rounded-2xl overflow-hidden" style={{ border: '1px solid #E8D7C0' }}>
              <div className="px-5 py-3" style={{ background: '#F3E7CE', borderBottom: '1px solid #E8D7C0' }}>
                <p className="font-bold text-[13px]" style={{ color: '#2B1810' }}>{cat}</p>
              </div>
              {items.map((item, i) => (
                <div key={item.id} className="flex items-center gap-4 px-5 py-3"
                  style={{ background: 'white', borderBottom: i < items.length - 1 ? '1px solid #F3E7CE' : 'none' }}>
                  {/* Toggle */}
                  <button 
                    onClick={() => toggleItem(item.id)} 
                    role="switch"
                    aria-checked={isShown(item.id)}
                    aria-label={isShown(item.id) ? `Sembunyikan ${item.name}` : `Tampilkan ${item.name}`}
                  >
                    {isShown(item.id)
                      ? <ToggleRight size={26} color="#5B8A2E" aria-hidden="true" />
                      : <ToggleLeft size={26} color="#C49A62" aria-hidden="true" />}
                  </button>

                  {/* Name */}
                  <div className="flex-1 min-w-0">
                    <p className={`font-semibold text-[13px] leading-snug ${!isShown(item.id) ? 'opacity-40 line-through' : ''}`} style={{ color: '#2B1810' }}>{item.name}</p>
                    <p className="text-[11px] mt-0.5" style={{ color: '#C49A62' }}>{fmt(item.price)}</p>
                  </div>

                  {/* Visibility badge */}
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full shrink-0"
                    style={{ background: isShown(item.id) ? '#EAF4E0' : '#F3F3F3', color: isShown(item.id) ? '#5B8A2E' : '#9CA3AF' }}>
                    {isShown(item.id) ? 'Tampil' : 'Tersembunyi'}
                  </span>
                </div>
              ))}
            </div>
          )
        })}
      </div>

      {/* Preview modal */}
      {previewOpen && (
        <div 
          className="fixed inset-0 z-50 flex items-end sm:items-center justify-center sm:p-4" 
          style={{ background: 'rgba(43,24,16,0.7)', backdropFilter: 'blur(4px)' }} 
          role="dialog"
          aria-modal="true"
          aria-labelledby="preview-modal-title"
          onClick={() => setPreviewOpen(false)}
          onKeyDown={e => e.key === 'Escape' && setPreviewOpen(false)}
        >
          <div className="relative rounded-t-3xl sm:rounded-3xl overflow-hidden shadow-2xl w-full sm:max-w-sm" style={{ maxHeight: '85vh', background: '#FAF6ED' }} onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between px-6 py-4" style={{ borderBottom: '1px solid #E8D7C0', background: '#2B1810' }}>
              <div>
                <p id="preview-modal-title" className="font-serif font-bold text-[16px]" style={{ color: '#F3E7CE' }}>Hasuka Dimsum</p>
                <p className="text-[11px]" style={{ color: '#C49A62' }}>Menu Digital — Preview</p>
              </div>
              <button 
                onClick={() => setPreviewOpen(false)} 
                aria-label="Tutup preview menu"
                className="w-8 h-8 rounded-lg flex items-center justify-center" 
                style={{ background: '#3D2315' }}
              >
                <X size={16} color="#C49A62" aria-hidden="true" />
              </button>
            </div>
            <div className="overflow-y-auto custom-scrollbar px-5 py-4" style={{ maxHeight: 'calc(85vh - 70px)' }}>
              {cats.map(cat => {
                const shown = productsList.filter(p => p.cat === cat && isShown(p.id))
                if (!shown.length) return null
                return (
                  <div key={cat} className="mb-5">
                    <p className="font-bold text-[11px] mb-3 tracking-widest" style={{ color: '#8B4A1E' }}>{cat.toUpperCase()}</p>
                    {shown.map(item => (
                      <div key={item.id} className="flex items-center justify-between py-2.5" style={{ borderBottom: '1px solid #E8D7C0' }}>
                        <p className="font-semibold text-[13px]" style={{ color: '#2B1810' }}>{item.name}</p>
                        <p className="font-bold text-[13px]" style={{ color: '#8B4A1E' }}>{fmt(item.price)}</p>
                      </div>
                    ))}
                  </div>
                )
              })}
            </div>
          </div>
        </div>
      )}
    </PageShell>
  )
}
