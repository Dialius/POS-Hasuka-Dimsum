import { useState } from 'react'
import { QrCode, Smartphone, RefreshCw, Eye, Copy, Check, ExternalLink, ToggleLeft, ToggleRight, Pencil, X } from 'lucide-react'
import PageShell from './PageShell'
import { useApp } from '../context/AppContext'

const MENU_ITEMS = [
  { id: 1, name: 'Siao May Ayam Udang (Isi 4)', cat: 'Kukus', price: 24000, shown: true },
  { id: 2, name: 'Hakau Udang Garing (Isi 3)', cat: 'Kukus', price: 21000, shown: true },
  { id: 3, name: 'Bakpao Durian Pasir Emas', cat: 'Kukus', price: 26000, shown: false },
  { id: 4, name: 'Lumpia Kulit Tahu Goreng', cat: 'Goreng', price: 23000, shown: true },
  { id: 5, name: 'Ceker Ayam Saus Szechuan', cat: 'Goreng', price: 19500, shown: true },
  { id: 6, name: 'Teh Liang Dingin Manis', cat: 'Minuman', price: 8000, shown: true },
  { id: 7, name: 'Es Jeruk Peras Segar', cat: 'Minuman', price: 10000, shown: true },
  { id: 8, name: 'Kopi Susu Aren', cat: 'Minuman', price: 14000, shown: false },
]

const fmt = (n: number) => `Rp ${n.toLocaleString('id-ID')}`

export default function QrMenuScreen({ onBack, backLabel }: { onBack: () => void; backLabel?: string }) {
  const { outlet } = useApp()
  const [menuItems, setMenuItems] = useState(MENU_ITEMS)
  const [copied, setCopied] = useState(false)
  const [qrRegen, setQrRegen] = useState(false)
  const [previewOpen, setPreviewOpen] = useState(false)
  const [editNameId, setEditNameId] = useState<number | null>(null)
  const [editNameVal, setEditNameVal] = useState('')

  const menuUrl = `hasuka.menu/${outlet.id}/01`

  const copyUrl = () => {
    navigator.clipboard.writeText(`https://${menuUrl}`).catch(() => {})
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const regenQr = () => {
    setQrRegen(true)
    setTimeout(() => setQrRegen(false), 800)
  }

  const toggleItem = (id: number) =>
    setMenuItems(prev => prev.map(p => p.id === id ? { ...p, shown: !p.shown } : p))

  const saveEditName = (id: number) => {
    if (editNameVal.trim()) setMenuItems(prev => prev.map(p => p.id === id ? { ...p, name: editNameVal.trim() } : p))
    setEditNameId(null)
    setEditNameVal('')
  }

  const shownCount = menuItems.filter(p => p.shown).length

  return (
    <PageShell
      title="QR Menu Digital"
      subtitle={`Menu online pelanggan · ${shownCount} produk ditampilkan`}
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
            Scan QR code untuk melihat menu digital. URL diperbarui otomatis saat menu berubah.
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
          <div className="flex flex-col gap-2 w-full mb-5">
            <button
              onClick={() => setPreviewOpen(true)}
              className="w-full py-2.5 rounded-xl font-bold text-[13px] flex items-center justify-center gap-2"
              style={{ background: '#8B4A1E', color: 'white' }}
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
            <div className="grid grid-cols-2 gap-2">
              <button onClick={regenQr} className="py-2.5 rounded-xl font-bold text-[12px] flex items-center justify-center gap-1.5" style={{ background: '#3D2315', color: '#C49A62', border: '1px solid #C49A6240' }}>
                <RefreshCw size={13} className={qrRegen ? 'animate-spin' : ''} /> Regenerate
              </button>
              <button className="py-2.5 rounded-xl font-bold text-[12px] flex items-center justify-center gap-1.5" style={{ background: '#3D2315', color: '#C49A62', border: '1px solid #C49A6240' }}>
                <Smartphone size={13} /> Cetak QR
              </button>
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 gap-2 w-full">
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
            <p className="text-[12px]" style={{ color: '#6B5448' }}>Toggle untuk menampilkan/menyembunyikan produk di menu pelanggan</p>
          </div>
          <button className="px-4 py-2 rounded-xl font-bold text-[12px]" style={{ background: '#8B4A1E', color: 'white' }}>
            Simpan Perubahan
          </button>
        </div>

        {['Kukus', 'Goreng', 'Minuman'].map(cat => {
          const items = menuItems.filter(p => p.cat === cat)
          return (
            <div key={cat} className="mb-4 rounded-2xl overflow-hidden" style={{ border: '1px solid #E8D7C0' }}>
              <div className="px-5 py-3" style={{ background: '#F3E7CE', borderBottom: '1px solid #E8D7C0' }}>
                <p className="font-bold text-[13px]" style={{ color: '#2B1810' }}>{cat}</p>
              </div>
              {items.map((item, i) => (
                <div key={item.id} className="flex items-center gap-4 px-5 py-3"
                  style={{ background: 'white', borderBottom: i < items.length - 1 ? '1px solid #F3E7CE' : 'none' }}>
                  {/* Toggle */}
                  <button onClick={() => toggleItem(item.id)}>
                    {item.shown
                      ? <ToggleRight size={26} color="#5B8A2E" />
                      : <ToggleLeft size={26} color="#C49A62" />}
                  </button>

                  {/* Name (editable) */}
                  <div className="flex-1 min-w-0">
                    {editNameId === item.id ? (
                      <div className="flex items-center gap-2">
                        <input
                          autoFocus
                          value={editNameVal}
                          onChange={e => setEditNameVal(e.target.value)}
                          onKeyDown={e => { if (e.key === 'Enter') saveEditName(item.id); if (e.key === 'Escape') setEditNameId(null) }}
                          className="flex-1 px-3 py-1.5 rounded-lg text-[13px] font-semibold outline-none"
                          style={{ border: '1.5px solid #8B4A1E', color: '#2B1810', background: '#FFF9F5' }}
                        />
                        <button onClick={() => saveEditName(item.id)}>
                          <Check size={16} color="#5B8A2E" strokeWidth={3} />
                        </button>
                        <button onClick={() => setEditNameId(null)}>
                          <X size={15} color="#B60000" />
                        </button>
                      </div>
                    ) : (
                      <button
                        className="flex items-center gap-2 group text-left w-full"
                        onClick={() => { setEditNameId(item.id); setEditNameVal(item.name) }}
                      >
                        <p className={`font-semibold text-[13px] leading-snug ${!item.shown ? 'opacity-40 line-through' : ''}`} style={{ color: '#2B1810' }}>{item.name}</p>
                        <Pencil size={12} color="#C49A62" className="opacity-0 group-hover:opacity-100 shrink-0 transition-opacity" />
                      </button>
                    )}
                    <p className="text-[11px] mt-0.5" style={{ color: '#C49A62' }}>{fmt(item.price)}</p>
                  </div>

                  {/* Visibility badge */}
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full shrink-0"
                    style={{ background: item.shown ? '#EAF4E0' : '#F3F3F3', color: item.shown ? '#5B8A2E' : '#9CA3AF' }}>
                    {item.shown ? 'Tampil' : 'Tersembunyi'}
                  </span>
                </div>
              ))}
            </div>
          )
        })}
      </div>

      {/* Preview modal */}
      {previewOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center" style={{ background: 'rgba(43,24,16,0.7)', backdropFilter: 'blur(4px)' }} onClick={() => setPreviewOpen(false)}>
          <div className="relative rounded-3xl overflow-hidden shadow-2xl" style={{ width: 380, maxHeight: '85vh', background: '#FAF6ED' }} onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between px-6 py-4" style={{ borderBottom: '1px solid #E8D7C0', background: '#2B1810' }}>
              <div>
                <p className="font-serif font-bold text-[16px]" style={{ color: '#F3E7CE' }}>Hasuka Dimsum</p>
                <p className="text-[11px]" style={{ color: '#C49A62' }}>Menu Digital — Preview</p>
              </div>
              <button onClick={() => setPreviewOpen(false)} className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: '#3D2315' }}>
                <X size={16} color="#C49A62" />
              </button>
            </div>
            <div className="overflow-y-auto custom-scrollbar px-5 py-4" style={{ maxHeight: 'calc(85vh - 70px)' }}>
              {['Kukus', 'Goreng', 'Minuman'].map(cat => {
                const shown = menuItems.filter(p => p.cat === cat && p.shown)
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
