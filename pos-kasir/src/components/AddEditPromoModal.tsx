import { useState, useEffect } from 'react'
import { X, Tag, Percent, Package, Gift, Search, AlertCircle } from 'lucide-react'
import { useApp } from '../context/AppContext'

export type PromoType = 'diskon_persen' | 'diskon_nominal' | 'bundling' | 'gratis_item'

export interface PromoItem {
  productId: number
  productName: string
  qty: number
}

export interface Promo {
  id: number
  name: string
  type: PromoType
  value: number // For diskon: %, for bundling: fixed price
  scope: string
  products: PromoItem[]
  bundleProducts?: PromoItem[] // for bundling: list items in bundle
  freeItem?: PromoItem        // for gratis_item: what they get free
  startDate: string
  endDate: string
  status: 'Aktif' | 'Kedaluwarsa' | 'Dijadwalkan'
  desc: string
}

const PROMO_TYPES: { id: PromoType; label: string; icon: any; desc: string }[] = [
  { id: 'diskon_persen', label: 'Diskon %', icon: Percent, desc: 'Diskon persentase dari harga normal' },
  { id: 'diskon_nominal', label: 'Diskon Rp', icon: Tag, desc: 'Potongan nominal tetap' },
  { id: 'bundling', label: 'Bundling', icon: Package, desc: 'Paket beberapa produk harga spesial' },
  { id: 'gratis_item', label: 'Gratis Item', icon: Gift, desc: 'Beli X, gratis Y' },
]

interface Props {
  promo?: Promo | null
  onSave: (p: Promo) => void
  onClose: () => void
}

export default function AddEditPromoModal({ promo, onSave, onClose }: Props) {
  const { productsList, outlet, kasirInfo } = useApp()
  const isEdit = !!promo
  const isOwner = kasirInfo?.role === 'owner'
  const [productSearch, setProductSearch] = useState('')
  const [errorMsg, setErrorMsg] = useState('')

  const todayStr = new Date().toISOString().split('T')[0]
  const nextMonth = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]

  const [form, setForm] = useState<Omit<Promo, 'id'>>({
    name: '',
    type: 'diskon_persen',
    value: 0,
    scope: 'Semua Produk',
    products: [],
    bundleProducts: [],
    freeItem: undefined,
    startDate: todayStr,
    endDate: nextMonth,
    status: 'Aktif',
    desc: ''
  })

  useEffect(() => {
    if (promo) setForm({ ...promo })
  }, [promo])

  // Filter produk yang sama persis seperti yang tampil di kasir
  const applicableProducts = (productsList || []).filter(p => {
    if (isOwner) return true
    if (!outlet?.id || outlet.id === 'none') return true
    if (!p.outlets || p.outlets === 'all') return true
    if (Array.isArray(p.outlets) && p.outlets.includes(outlet.id)) return true
    return false
  })

  const displayProducts = applicableProducts.filter(p =>
    p.name.toLowerCase().includes(productSearch.toLowerCase()) ||
    (p.cat && p.cat.toLowerCase().includes(productSearch.toLowerCase()))
  )

  const set = <K extends keyof typeof form>(k: K, v: typeof form[K]) => setForm(p => ({ ...p, [k]: v }))

  const toggleProduct = (pid: number, pname: string) => {
    set('products', form.products.some(x => x.productId === pid)
      ? form.products.filter(x => x.productId !== pid)
      : [...form.products, { productId: pid, productName: pname, qty: 1 }]
    )
  }

  const toggleBundleProduct = (pid: number, pname: string) => {
    const cur = form.bundleProducts ?? []
    set('bundleProducts', cur.some(x => x.productId === pid)
      ? cur.filter(x => x.productId !== pid)
      : [...cur, { productId: pid, productName: pname, qty: 1 }]
    )
  }

  const handleSave = () => {
    if (!form.name.trim() || !form.value) {
      setErrorMsg('Mohon isi nama promo dan nilai diskon/promo.')
      return
    }
    if (form.type !== 'bundling' && form.scope === 'Produk Tertentu' && form.products.length === 0) {
      setErrorMsg('Silakan pilih minimal 1 produk jika cakupan promo adalah Produk Tertentu.')
      return
    }
    setErrorMsg('')
    onSave({ ...form, id: promo?.id ?? Date.now() })
    onClose()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center sm:p-4" style={{ background: 'rgba(43,24,16,0.6)', backdropFilter: 'blur(4px)' }} onClick={onClose}>
      <div className="relative flex flex-col w-full sm:max-w-2xl rounded-t-3xl sm:rounded-3xl shadow-2xl overflow-hidden" style={{ maxHeight: '90vh', background: '#FAF6ED' }} onClick={e => e.stopPropagation()}>

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5" style={{ borderBottom: '1px solid #E8D7C0' }}>
          <h2 className="font-serif font-bold text-[20px]" style={{ color: '#2B1810' }}>{isEdit ? 'Edit Promo' : 'Buat Promo Baru'}</h2>
          <button onClick={onClose} className="w-8 h-8 rounded-lg flex items-center justify-center hover:bg-black/5 transition-colors">
            <X size={18} color="#6B5448" />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto custom-scrollbar px-6 py-5 space-y-5">

          {/* Name */}
          <div>
            <label className="block text-[11px] font-bold mb-1.5" style={{ color: '#6B5448', letterSpacing: '0.06em' }}>NAMA PROMO *</label>
            <input value={form.name} onChange={e => set('name', e.target.value)}
              className="w-full px-4 py-3 rounded-xl text-[14px] outline-none"
              style={{ background: 'white', border: '1.5px solid #E8D7C0', color: '#2B1810' }}
              onFocus={e => e.currentTarget.style.borderColor = '#8B4A1E'}
              onBlur={e => e.currentTarget.style.borderColor = '#E8D7C0'}
              placeholder="Mis. Diskon Soft Launching Hakau" />
          </div>

          {/* Description */}
          <div>
            <label className="block text-[11px] font-bold mb-1.5" style={{ color: '#6B5448', letterSpacing: '0.06em' }}>DESKRIPSI PROMO</label>
            <textarea value={form.desc} onChange={e => set('desc', e.target.value)}
              rows={2}
              className="w-full px-4 py-3 rounded-xl text-[13px] outline-none resize-none"
              style={{ background: 'white', border: '1.5px solid #E8D7C0', color: '#2B1810' }}
              onFocus={e => e.currentTarget.style.borderColor = '#8B4A1E'}
              onBlur={e => e.currentTarget.style.borderColor = '#E8D7C0'}
              placeholder="Syarat, jam berlaku, dll." />
          </div>

          {/* Type */}
          <div>
            <label className="block text-[11px] font-bold mb-2" style={{ color: '#6B5448', letterSpacing: '0.06em' }}>TIPE PROMO *</label>
            <div className="grid grid-cols-2 gap-2">
              {PROMO_TYPES.map(t => {
                const Icon = t.icon
                const active = form.type === t.id
                return (
                  <button key={t.id} onClick={() => set('type', t.id)}
                    className="flex items-center gap-3 px-4 py-3 rounded-xl text-left transition-all"
                    style={{ background: active ? '#F3E7CE' : 'white', border: `1.5px solid ${active ? '#8B4A1E' : '#E8D7C0'}` }}>
                    <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0" style={{ background: active ? '#8B4A1E' : '#F3E7CE' }}>
                      <Icon size={16} color={active ? 'white' : '#8B4A1E'} />
                    </div>
                    <div>
                      <p className="font-bold text-[13px]" style={{ color: '#2B1810' }}>{t.label}</p>
                      <p className="text-[10px]" style={{ color: '#6B5448' }}>{t.desc}</p>
                    </div>
                  </button>
                )
              })}
            </div>
          </div>

          {/* Value */}
          <div>
            <label className="block text-[11px] font-bold mb-1.5" style={{ color: '#6B5448', letterSpacing: '0.06em' }}>
              {form.type === 'diskon_persen' ? 'BESAR DISKON (%)' :
               form.type === 'diskon_nominal' ? 'NOMINAL DISKON (Rp)' :
               form.type === 'bundling' ? 'HARGA PAKET BUNDLE (Rp)' : 'MINIMAL BELI (QTY)'}
            </label>
            <input type="number" value={form.value || ''} onChange={e => set('value', parseInt(e.target.value) || 0)}
              className="w-full px-4 py-3 rounded-xl text-[14px] outline-none"
              style={{ background: 'white', border: '1.5px solid #E8D7C0', color: '#2B1810' }}
              onFocus={e => e.currentTarget.style.borderColor = '#8B4A1E'}
              onBlur={e => e.currentTarget.style.borderColor = '#E8D7C0'} />
          </div>

          {/* Bundling: pilih produk di bundle */}
          {form.type === 'bundling' && (
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="block text-[11px] font-bold" style={{ color: '#6B5448', letterSpacing: '0.06em' }}>
                  PRODUK DALAM BUNDLE ({form.bundleProducts?.length || 0} dipilih)
                </label>
              </div>
              <div className="relative mb-2">
                <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: '#6B5448' }} />
                <input
                  value={productSearch}
                  onChange={e => setProductSearch(e.target.value)}
                  placeholder="Cari produk / kategori..."
                  className="w-full pl-8 pr-3 py-2 rounded-xl text-[12px] outline-none"
                  style={{ background: 'white', border: '1.5px solid #E8D7C0', color: '#2B1810' }}
                />
              </div>
              <div className="flex flex-col gap-1.5 max-h-52 overflow-y-auto custom-scrollbar pr-1">
                {displayProducts.length === 0 ? (
                  <p className="text-[12px] text-[#6B5448] py-2 text-center">Tidak ada produk yang cocok.</p>
                ) : displayProducts.map(p => {
                  const isIn = form.bundleProducts?.some(x => x.productId === p.id)
                  return (
                    <button key={p.id} type="button" onClick={() => toggleBundleProduct(p.id, p.name)}
                      className="flex items-center gap-3 px-4 py-2.5 rounded-xl text-left transition-all"
                      style={{ background: isIn ? '#F3E7CE' : 'white', border: `1px solid ${isIn ? '#8B4A1E' : '#E8D7C0'}` }}>
                      <div className="w-4 h-4 rounded flex items-center justify-center shrink-0" style={{ background: isIn ? '#8B4A1E' : 'transparent', border: `1.5px solid ${isIn ? '#8B4A1E' : '#C49A62'}` }}>
                        {isIn && <span className="text-white text-[10px] font-bold leading-none">✓</span>}
                      </div>
                      <div className="flex-1 min-w-0 flex items-center justify-between gap-2">
                        <div>
                          <p className="text-[13px] font-semibold truncate" style={{ color: '#2B1810' }}>{p.name}</p>
                          {p.cat && <span className="text-[10px]" style={{ color: '#6B5448' }}>{p.cat}</span>}
                        </div>
                        <span className="text-[11px] font-bold shrink-0" style={{ color: '#8B4A1E' }}>Rp {p.price.toLocaleString('id-ID')}</span>
                      </div>
                    </button>
                  )
                })}
              </div>
            </div>
          )}

          {/* Gratis item: free item */}
          {form.type === 'gratis_item' && (
            <div>
              <label className="block text-[11px] font-bold mb-2" style={{ color: '#6B5448', letterSpacing: '0.06em' }}>ITEM GRATIS YANG DIDAPAT</label>
              <div className="relative mb-2">
                <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: '#6B5448' }} />
                <input
                  value={productSearch}
                  onChange={e => setProductSearch(e.target.value)}
                  placeholder="Cari produk gratis..."
                  className="w-full pl-8 pr-3 py-2 rounded-xl text-[12px] outline-none"
                  style={{ background: 'white', border: '1.5px solid #E8D7C0', color: '#2B1810' }}
                />
              </div>
              <div className="flex flex-col gap-1.5 max-h-52 overflow-y-auto custom-scrollbar pr-1">
                {displayProducts.length === 0 ? (
                  <p className="text-[12px] text-[#6B5448] py-2 text-center">Tidak ada produk yang cocok.</p>
                ) : displayProducts.map(p => {
                  const isSelected = form.freeItem?.productId === p.id
                  return (
                    <button key={p.id} type="button" onClick={() => set('freeItem', { productId: p.id, productName: p.name, qty: 1 })}
                      className="flex items-center gap-3 px-4 py-2.5 rounded-xl text-left transition-all"
                      style={{ background: isSelected ? '#F3E7CE' : 'white', border: `1px solid ${isSelected ? '#8B4A1E' : '#E8D7C0'}` }}>
                      <div className="w-4 h-4 rounded-full shrink-0" style={{ background: isSelected ? '#8B4A1E' : 'transparent', border: `1.5px solid ${isSelected ? '#8B4A1E' : '#C49A62'}` }} />
                      <div className="flex-1 min-w-0 flex items-center justify-between gap-2">
                        <div>
                          <p className="text-[13px] font-semibold truncate" style={{ color: '#2B1810' }}>{p.name}</p>
                          {p.cat && <span className="text-[10px]" style={{ color: '#6B5448' }}>{p.cat}</span>}
                        </div>
                        <span className="text-[11px] font-bold shrink-0" style={{ color: '#8B4A1E' }}>Rp {p.price.toLocaleString('id-ID')}</span>
                      </div>
                    </button>
                  )
                })}
              </div>
            </div>
          )}

          {/* Scope (Semua Produk vs Produk Tertentu) */}
          {form.type !== 'bundling' && (
            <div>
              <label className="block text-[11px] font-bold mb-2" style={{ color: '#6B5448', letterSpacing: '0.06em' }}>CAKUPAN PROMO *</label>
              <div className="grid grid-cols-2 gap-2 mb-3">
                {[
                  { id: 'Semua Produk', label: 'Semua Produk', desc: 'Berlaku untuk seluruh menu kasir' },
                  { id: 'Produk Tertentu', label: 'Produk Tertentu', desc: 'Hanya menu yang dipilih' }
                ].map(sc => {
                  const active = form.scope === sc.id
                  return (
                    <button
                      key={sc.id}
                      type="button"
                      onClick={() => set('scope', sc.id)}
                      className="px-4 py-3 rounded-xl text-left transition-all"
                      style={{ background: active ? '#F3E7CE' : 'white', border: `1.5px solid ${active ? '#8B4A1E' : '#E8D7C0'}` }}
                    >
                      <p className="font-bold text-[13px]" style={{ color: '#2B1810' }}>{sc.label}</p>
                      <p className="text-[10px]" style={{ color: '#6B5448' }}>{sc.desc}</p>
                    </button>
                  )
                })}
              </div>

              {form.scope === 'Produk Tertentu' && (
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className="block text-[11px] font-bold" style={{ color: '#6B5448', letterSpacing: '0.06em' }}>
                      PILIH PRODUK DISKON ({form.products.length} dipilih)
                    </label>
                  </div>
                  <div className="relative mb-2">
                    <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: '#6B5448' }} />
                    <input
                      value={productSearch}
                      onChange={e => setProductSearch(e.target.value)}
                      placeholder="Cari menu / kategori..."
                      className="w-full pl-8 pr-3 py-2 rounded-xl text-[12px] outline-none"
                      style={{ background: 'white', border: '1.5px solid #E8D7C0', color: '#2B1810' }}
                    />
                  </div>
                  <div className="flex flex-col gap-1.5 max-h-52 overflow-y-auto custom-scrollbar pr-1">
                    {displayProducts.length === 0 ? (
                      <p className="text-[12px] text-[#6B5448] py-2 text-center">Tidak ada produk yang cocok.</p>
                    ) : displayProducts.map(p => {
                      const isIn = form.products.some(x => x.productId === p.id)
                      return (
                        <button key={p.id} type="button" onClick={() => toggleProduct(p.id, p.name)}
                          className="flex items-center gap-3 px-4 py-2.5 rounded-xl text-left transition-all"
                          style={{ background: isIn ? '#F3E7CE' : 'white', border: `1px solid ${isIn ? '#8B4A1E' : '#E8D7C0'}` }}>
                          <div className="w-4 h-4 rounded flex items-center justify-center shrink-0" style={{ background: isIn ? '#8B4A1E' : 'transparent', border: `1.5px solid ${isIn ? '#8B4A1E' : '#C49A62'}` }}>
                            {isIn && <span className="text-white text-[10px] font-bold leading-none">✓</span>}
                          </div>
                          <div className="flex-1 min-w-0 flex items-center justify-between gap-2">
                            <div>
                              <p className="text-[13px] font-semibold truncate" style={{ color: '#2B1810' }}>{p.name}</p>
                              {p.cat && <span className="text-[10px]" style={{ color: '#6B5448' }}>{p.cat}</span>}
                            </div>
                            <span className="text-[11px] font-bold shrink-0" style={{ color: '#8B4A1E' }}>Rp {p.price.toLocaleString('id-ID')}</span>
                          </div>
                        </button>
                      )
                    })}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Date range */}
          <div className="grid grid-cols-2 gap-3">
            {[
              { label: 'TANGGAL MULAI', key: 'startDate' as const },
              { label: 'TANGGAL SELESAI', key: 'endDate' as const },
            ].map(f => (
              <div key={f.key}>
                <label className="block text-[11px] font-bold mb-1.5" style={{ color: '#6B5448', letterSpacing: '0.06em' }}>{f.label}</label>
                <input type="date" value={form[f.key]} onChange={e => set(f.key, e.target.value)}
                  className="w-full px-4 py-3 rounded-xl text-[13px] outline-none"
                  style={{ background: 'white', border: '1.5px solid #E8D7C0', color: '#2B1810' }}
                  onFocus={e => e.currentTarget.style.borderColor = '#8B4A1E'}
                  onBlur={e => e.currentTarget.style.borderColor = '#E8D7C0'} />
              </div>
            ))}
          </div>

          {/* Status */}
          <div>
            <label className="block text-[11px] font-bold mb-2" style={{ color: '#6B5448', letterSpacing: '0.06em' }}>STATUS PROMO</label>
            <div className="flex gap-2">
              {(['Aktif', 'Dijadwalkan'] as const).map(s => (
                <button key={s} onClick={() => set('status', s)}
                  className="px-4 py-2 rounded-xl text-[13px] font-bold transition-colors"
                  style={{ background: form.status === s ? '#8B4A1E' : 'white', color: form.status === s ? 'white' : '#6B5448', border: `1.5px solid ${form.status === s ? '#8B4A1E' : '#E8D7C0'}` }}>
                  {s}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Footer */}
        {errorMsg && (
          <div className="px-6 pb-3 flex items-start gap-2" role="alert">
            <AlertCircle size={15} color="#B60000" className="shrink-0 mt-0.5" />
            <p className="text-[12px] font-semibold" style={{ color: '#B60000' }}>{errorMsg}</p>
          </div>
        )}
        <div className="px-6 py-4 flex gap-3" style={{ borderTop: '1px solid #E8D7C0' }}>
          <button onClick={onClose} className="flex-1 py-3 rounded-xl font-bold text-[14px]" style={{ background: 'white', color: '#6B5448', border: '1.5px solid #E8D7C0' }}>Batal</button>
          <button onClick={handleSave} className="flex-1 py-3 rounded-xl font-bold text-[14px]" style={{ background: '#8B4A1E', color: 'white' }}>
            {isEdit ? 'Simpan Perubahan' : 'Buat Promo'}
          </button>
        </div>
      </div>
    </div>
  )
}
