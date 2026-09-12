import { useState, useEffect, useRef } from 'react'
import { X, Loader2, Upload } from 'lucide-react'
import { type Product, useApp } from '../context/AppContext'
import { gasApi } from '../services/gasApi'

export type { Product }

const CATS = ['Kukus', 'Goreng', 'Minuman', 'Snack', 'Paket']

interface Props {
  product?: Product | null
  onSave: (p: Product) => void
  onClose: () => void
  isSaving?: boolean
}

const inputStyle = {
  background: 'white', border: '1.5px solid #E8D7C0', color: '#2B1810',
} as const

const focusBorder = (e: React.FocusEvent<HTMLInputElement>) => { e.currentTarget.style.borderColor = '#8B4A1E' }
const blurBorder  = (e: React.FocusEvent<HTMLInputElement>) => { e.currentTarget.style.borderColor = '#E8D7C0' }

export default function AddEditProductModal({ product, onSave, onClose, isSaving }: Props) {
  const { outletsList } = useApp()
  const isEdit = !!product
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [isUploading, setIsUploading] = useState(false)

  const [form, setForm] = useState<Omit<Product, 'id'>>({
    name: '', cat: 'Kukus', price: 0, cost: 0,
    stock_mode: 'recipe',
    stock: 0, minStock: 10,
    promo: false, promoText: '', originalPrice: undefined,
    img: 'https://images.unsplash.com/photo-1563245372-f21724e3856d?auto=format&fit=crop&q=80&w=120',
    outlets: 'all'
  })

  useEffect(() => { if (product) setForm({ ...product }) }, [product])

  const set = <K extends keyof typeof form>(k: K, v: typeof form[K]) =>
    setForm(p => ({ ...p, [k]: v }))

  const handleSave = () => {
    if (!form.name.trim()) return
    onSave({ ...form, id: product?.id ?? Date.now() })
    onClose()
  }

  const margin = form.price > 0 ? Math.round(((form.price - form.cost) / form.price) * 100) : 0

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center"
      style={{ background: 'rgba(43,24,16,0.6)', backdropFilter: 'blur(4px)' }} onClick={onClose}>
      <div className="relative flex flex-col rounded-3xl shadow-2xl overflow-hidden"
        style={{ width: 600, maxHeight: '90vh', background: '#FAF6ED' }} onClick={e => e.stopPropagation()}>

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5" style={{ borderBottom: '1px solid #E8D7C0' }}>
          <h2 className="font-serif font-bold text-[20px]" style={{ color: '#2B1810' }}>
            {isEdit ? 'Edit Produk' : 'Tambah Produk Baru'}
          </h2>
          <button onClick={onClose} className="w-8 h-8 rounded-lg flex items-center justify-center hover:bg-black/5 transition-colors">
            <X size={18} color="#6B5448" />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto custom-scrollbar px-6 py-5 space-y-4">

          {/* Photo preview */}
          <div className="flex items-start gap-4">
            <div className="shrink-0 w-20 h-20 rounded-2xl overflow-hidden relative" style={{ border: '2px solid #E8D7C0', background: '#F3E7CE' }}>
              {isUploading ? (
                <div className="absolute inset-0 flex items-center justify-center bg-black/10">
                  <Loader2 className="animate-spin text-[#8B4A1E]" size={24} />
                </div>
              ) : (
                <img src={form.img || 'https://ui-avatars.com/api/?name=Pr&background=F3E7CE&color=8B4A1E'} alt="" className="w-full h-full object-cover" />
              )}
            </div>
            <div className="flex-1">
              <label className="block text-[11px] font-bold mb-1.5" style={{ color: '#6B5448', letterSpacing: '0.06em' }}>FOTO PRODUK</label>
              
              <div className="flex gap-2">
                <input value={form.img || ''} onChange={e => set('img', e.target.value)}
                  className="flex-1 px-3 py-2 rounded-xl text-[13px] outline-none"
                  style={inputStyle} onFocus={focusBorder} onBlur={blurBorder}
                  placeholder="Atau paste URL dari internet..." />
                
                <input type="file" accept="image/*" className="hidden" ref={fileInputRef} 
                  onChange={async (e) => {
                    const file = e.target.files?.[0]
                    if (!file) return
                    if (file.size > 2 * 1024 * 1024) {
                      alert('Ukuran foto maksimal 2MB')
                      return
                    }
                    setIsUploading(true)
                    try {
                      const url = await gasApi.uploadImage(file)
                      set('img', url)
                    } catch (err) {
                      alert('Gagal mengupload gambar: ' + (err instanceof Error ? err.message : String(err)))
                    } finally {
                      setIsUploading(false)
                      if (fileInputRef.current) fileInputRef.current.value = ''
                    }
                  }} />
                
                <button type="button" disabled={isUploading} onClick={() => fileInputRef.current?.click()}
                  className="shrink-0 px-4 py-2 rounded-xl text-[13px] font-bold flex items-center gap-2 transition-colors disabled:opacity-50"
                  style={{ background: '#F3E7CE', color: '#8B4A1E' }}>
                  <Upload size={16} />
                  Upload
                </button>
              </div>
            </div>
          </div>

          {/* Name */}
          <div>
            <label className="block text-[11px] font-bold mb-1.5" style={{ color: '#6B5448', letterSpacing: '0.06em' }}>NAMA PRODUK *</label>
            <input value={form.name} onChange={e => set('name', e.target.value)}
              className="w-full px-4 py-3 rounded-xl text-[14px] outline-none"
              style={inputStyle} onFocus={focusBorder} onBlur={blurBorder}
              placeholder="Mis. Siao May Ayam Udang (Isi 3)" />
          </div>

          {/* Category */}
          <div>
            <label className="block text-[11px] font-bold mb-1.5" style={{ color: '#6B5448', letterSpacing: '0.06em' }}>KATEGORI</label>
            <div className="flex flex-wrap gap-2">
              {CATS.map(c => (
                <button key={c} onClick={() => set('cat', c)}
                  className="px-4 py-2 rounded-xl text-[13px] font-bold transition-colors"
                  style={{ background: form.cat === c ? '#8B4A1E' : 'white', color: form.cat === c ? 'white' : '#6B5448', border: `1.5px solid ${form.cat === c ? '#8B4A1E' : '#E8D7C0'}` }}>
                  {c}
                </button>
              ))}
            </div>
          </div>

          {/* Pricing */}
          <div className="grid grid-cols-2 gap-3">
            {([['HARGA JUAL (Rp) *', 'price'], ['HARGA MODAL (Rp)', 'cost']] as const).map(([label, key]) => (
              <div key={key}>
                <label className="block text-[11px] font-bold mb-1.5" style={{ color: '#6B5448', letterSpacing: '0.06em' }}>{label}</label>
                <input type="text" value={form[key] ? form[key].toLocaleString('id-ID') : ''}
                  onChange={e => {
                    const rawVal = e.target.value.replace(/\D/g, '')
                    set(key, parseInt(rawVal) || 0)
                  }}
                  className="w-full px-4 py-3 rounded-xl text-[14px] outline-none"
                  style={inputStyle} onFocus={focusBorder} onBlur={blurBorder} />
              </div>
            ))}
          </div>

          {/* Margin indicator */}
          {form.price > 0 && form.cost > 0 && (
            <div className="rounded-xl px-4 py-2.5 flex items-center justify-between"
              style={{ background: margin > 30 ? '#EAF4E0' : '#FEF9EC', border: `1px solid ${margin > 30 ? '#5B8A2E' : '#C9A227'}30` }}>
              <span className="text-[12px]" style={{ color: margin > 30 ? '#5B8A2E' : '#C9A227' }}>Margin: {margin}%</span>
              <span className="font-bold text-[13px]" style={{ color: margin > 30 ? '#5B8A2E' : '#C9A227' }}>
                Rp {(form.price - form.cost).toLocaleString('id-ID')}
              </span>
            </div>
          )}

          {/* Stock mode */}
          <div className="rounded-2xl p-4" style={{ background: 'white', border: '1px solid #E8D7C0' }}>
            <p className="font-bold text-[14px] mb-1" style={{ color: '#2B1810' }}>Mode Stok</p>
            <p className="text-[12px] mb-3" style={{ color: '#6B5448' }}>
              Pilih <b>Resep</b> untuk menu yang bahan bakunya dipotong otomatis via Kelola Resep. Pilih <b>Langsung</b> untuk produk yang stoknya dikelola sendiri (mis. minuman botol).
            </p>
            <div className="flex gap-2">
              {(['recipe', 'direct'] as const).map(mode => (
                <button key={mode} onClick={() => set('stock_mode', mode)}
                  className="flex-1 py-2.5 rounded-xl font-bold text-[13px] transition-colors"
                  style={{
                    background: form.stock_mode === mode ? '#8B4A1E' : '#F3E7CE',
                    color: form.stock_mode === mode ? 'white' : '#6B5448',
                    border: `1.5px solid ${form.stock_mode === mode ? '#8B4A1E' : '#E8D7C0'}`,
                  }}>
                  {mode === 'recipe' ? '🍜 Berbasis Resep' : '📦 Stok Langsung'}
                </button>
              ))}
            </div>

            {/* Direct stock fields — only shown when stock_mode = 'direct' */}
            {form.stock_mode === 'direct' && (
              <div className="grid grid-cols-2 gap-3 mt-3">
                {([['STOK SAAT INI', 'stock'], ['STOK MINIMUM', 'minStock']] as const).map(([label, key]) => (
                  <div key={key}>
                    <label className="block text-[11px] font-bold mb-1.5" style={{ color: '#6B5448', letterSpacing: '0.06em' }}>{label}</label>
                    <input type="number" value={form[key] || ''}
                      onChange={e => set(key, parseInt(e.target.value) || 0)}
                      className="w-full px-4 py-3 rounded-xl text-[14px] outline-none"
                      style={inputStyle} onFocus={focusBorder} onBlur={blurBorder} />
                  </div>
                ))}
              </div>
            )}

            {form.stock_mode === 'recipe' && (
              <p className="text-[11px] mt-3 px-1" style={{ color: '#C49A62' }}>
                Stok bahan baku diatur di halaman <b>Kelola Resep</b> — atur resep produk ini setelah disimpan.
              </p>
            )}
          </div>

          {/* Promo */}
          <div className="rounded-2xl p-4" style={{ background: 'white', border: '1px solid #E8D7C0' }}>
            <div className="flex items-center justify-between mb-3">
              <div>
                <p className="font-bold text-[14px]" style={{ color: '#2B1810' }}>Produk Promo</p>
                <p className="text-[12px]" style={{ color: '#6B5448' }}>Tampilkan badge promo & harga coret</p>
              </div>
              <button onClick={() => set('promo', !form.promo)} className="transition-all">
                <div className="w-12 h-6 rounded-full relative transition-colors" style={{ background: form.promo ? '#5B8A2E' : '#C49A62' }}>
                  <div className="w-5 h-5 bg-white rounded-full absolute top-0.5 transition-all" style={{ left: form.promo ? '26px' : '2px' }} />
                </div>
              </button>
            </div>
            {form.promo && (
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold mb-1.5" style={{ color: '#6B5448', letterSpacing: '0.06em' }}>TEKS PROMO (mis. "25%")</label>
                  <input value={form.promoText || ''} onChange={e => set('promoText', e.target.value)}
                    className="w-full px-3 py-2 rounded-xl text-[13px] outline-none"
                    style={{ background: '#F3E7CE', border: '1px solid #E8D7C0', color: '#2B1810' }} placeholder="25%" />
                </div>
                <div>
                  <label className="block text-[11px] font-bold mb-1.5" style={{ color: '#6B5448', letterSpacing: '0.06em' }}>HARGA NORMAL (Rp)</label>
                  <input type="number" value={form.originalPrice || ''}
                    onChange={e => set('originalPrice', parseInt(e.target.value) || undefined)}
                    className="w-full px-3 py-2 rounded-xl text-[13px] outline-none"
                    style={{ background: '#F3E7CE', border: '1px solid #E8D7C0', color: '#2B1810' }} />
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Ketersediaan Cabang */}
        <div className="px-6 py-4" style={{ borderTop: '1px solid #E8D7C0' }}>
          <label className="block text-[11px] font-bold mb-3" style={{ color: '#6B5448' }}>TERSEDIA DI CABANG</label>
          <div className="space-y-3">
            <label className="flex items-center gap-2 cursor-pointer">
              <input type="radio" name="outletsType" checked={form.outlets === 'all' || !form.outlets} onChange={() => setForm(p => ({ ...p, outlets: 'all' }))} className="accent-[#8B4A1E]" />
              <span className="text-[13px] font-bold" style={{ color: '#2B1810' }}>Semua Cabang</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input type="radio" name="outletsType" checked={Array.isArray(form.outlets)} onChange={() => setForm(p => ({ ...p, outlets: outletsList.map(o => o.id) }))} className="accent-[#8B4A1E]" />
              <span className="text-[13px] font-bold" style={{ color: '#2B1810' }}>Cabang Tertentu</span>
            </label>

            {Array.isArray(form.outlets) && (
              <div className="pl-6 grid grid-cols-2 gap-2 mt-2">
                {outletsList.map(o => {
                  const isChecked = (form.outlets as string[]).includes(o.id)
                  return (
                    <label key={o.id} className="flex items-center gap-2 cursor-pointer p-2 rounded-xl" style={{ background: isChecked ? '#F3E7CE' : 'white', border: '1px solid #E8D7C0' }}>
                      <input 
                        type="checkbox" 
                        checked={isChecked}
                        onChange={(e) => {
                          const current = (form.outlets as string[]) || []
                          const next = e.target.checked ? [...current, o.id] : current.filter(id => id !== o.id)
                          setForm(p => ({ ...p, outlets: next.length === 0 ? 'all' : next }))
                        }}
                        className="accent-[#8B4A1E]"
                      />
                      <span className="text-[12px] font-bold" style={{ color: '#2B1810' }}>{o.name.replace('Hasuka Dimsum — ', '')}</span>
                    </label>
                  )
                })}
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 flex gap-3" style={{ borderTop: '1px solid #E8D7C0' }}>
          <button onClick={onClose} disabled={isSaving} className="flex-1 py-3 rounded-xl font-bold text-[14px] disabled:opacity-50"
            style={{ background: 'white', color: '#6B5448', border: '1.5px solid #E8D7C0' }}>Batal</button>
          <button onClick={handleSave} disabled={isSaving} className="flex-1 py-3 rounded-xl font-bold text-[14px] flex items-center justify-center gap-2 disabled:opacity-50"
            style={{ background: '#8B4A1E', color: 'white' }}>
            {isSaving ? <Loader2 size={16} className="animate-spin" /> : null}
            {isSaving ? 'Menyimpan...' : (isEdit ? 'Simpan Perubahan' : 'Tambah Produk')}
          </button>
        </div>
      </div>
    </div>
  )
}
