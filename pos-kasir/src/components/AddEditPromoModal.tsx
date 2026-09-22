import { useState, useEffect } from 'react'
import { X, Tag, Percent, Package, Gift, Search, AlertCircle, Calendar, Settings } from 'lucide-react'
import { useApp } from '../context/AppContext'
import { Button } from './common/Button'
import { TabNavigation } from './common/TabNavigation'

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
  value: number
  scope: string
  products: PromoItem[]
  bundleProducts?: PromoItem[]
  freeItem?: PromoItem
  startDate: string
  endDate: string
  status: 'Aktif' | 'Kedaluwarsa' | 'Dijadwalkan'
  desc: string
  outlets?: 'all' | string[]
}

const PROMO_TYPES: { id: PromoType; label: string; icon: any; desc: string }[] = [
  { id: 'diskon_persen', label: 'Diskon %', icon: Percent, desc: 'Potong persen' },
  { id: 'diskon_nominal', label: 'Diskon Rp', icon: Tag, desc: 'Potong nominal' },
  { id: 'bundling', label: 'Bundling', icon: Package, desc: 'Paket spesial' },
  { id: 'gratis_item', label: 'Gratis Item', icon: Gift, desc: 'Beli dapat gratis' },
]

interface Props {
  promo?: Promo | null
  onSave: (p: Promo) => void
  onClose: () => void
}

export default function AddEditPromoModal({ promo, onSave, onClose }: Props) {
  const { productsList, outlet, kasirInfo, outletsList } = useApp()
  const isEdit = !!promo
  const isOwner = kasirInfo?.role === 'owner'
  const [activeTab, setActiveTab] = useState('info')
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
    desc: '',
    outlets: 'all'
  })

  useEffect(() => {
    if (promo) setForm({ ...promo })
  }, [promo])

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
    if (Array.isArray(form.outlets) && form.outlets.length === 0) {
      setErrorMsg('Silakan pilih minimal 1 cabang jika memilih opsi Cabang Tertentu.')
      return
    }
    setErrorMsg('')
    onSave({ ...form, id: promo?.id ?? Date.now() })
    onClose()
  }

  const tabs = [
    { id: 'info', label: 'Info Promo', icon: Tag },
    { id: 'conditions', label: 'Kondisi', icon: Settings },
    { id: 'schedule', label: 'Jadwal', icon: Calendar },
  ]

  return (
    <div className="fixed inset-0 z-50 flex items-end md:items-center justify-center p-0 md:p-4" style={{ background: 'rgba(43,24,16,0.6)', backdropFilter: 'blur(4px)' }} onClick={onClose}>
      <div className="relative flex flex-col w-full md:max-w-2xl rounded-t-3xl md:rounded-3xl shadow-2xl overflow-hidden" style={{ maxHeight: '92vh', background: '#FAF6ED' }} onClick={e => e.stopPropagation()}>

        {/* Header */}
        <div className="flex items-center justify-between px-5 md:px-6 py-4 md:py-5 shrink-0" style={{ borderBottom: '1px solid #E8D7C0' }}>
          <h2 className="font-serif font-bold text-[18px] md:text-[20px]" style={{ color: '#2B1810' }}>{isEdit ? 'Edit Promo' : 'Buat Promo Baru'}</h2>
          <button onClick={onClose} className="w-8 h-8 rounded-lg flex items-center justify-center hover:bg-black/5 transition-colors">
            <X size={18} color="#6B5448" />
          </button>
        </div>

        {/* Tabs */}
        <div className="px-5 md:px-6 pt-3 md:pt-4 shrink-0">
          <TabNavigation tabs={tabs} activeTab={activeTab} onTabChange={setActiveTab} variant="underline" />
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto custom-scrollbar px-4 md:px-6 py-4 md:py-5 space-y-4 md:space-y-5">

          {/* Tab 1: Info Promo */}
          {activeTab === 'info' && (
            <>
              <div>
                <label className="block text-[11px] font-bold mb-1.5" style={{ color: '#6B5448', letterSpacing: '0.06em' }}>NAMA PROMO *</label>
                <input value={form.name} onChange={e => set('name', e.target.value)}
                  className="w-full px-4 py-3 rounded-xl text-[14px] outline-none"
                  style={{ background: 'white', border: '1.5px solid #E8D7C0', color: '#2B1810' }}
                  onFocus={e => e.currentTarget.style.borderColor = '#8B4A1E'}
                  onBlur={e => e.currentTarget.style.borderColor = '#E8D7C0'}
                  placeholder="Mis. Diskon Soft Launching Hakau" />
              </div>

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
            </>
          )}

          {/* Tab 2: Conditions */}
          {activeTab === 'conditions' && (
            <>
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

              {form.type !== 'bundling' && (
                <div>
                  <label className="block text-[11px] font-bold mb-2" style={{ color: '#6B5448', letterSpacing: '0.06em' }}>CAKUPAN PROMO *</label>
                  <div className="grid grid-cols-2 gap-2 mb-3">
                    {[
                      { id: 'Semua Produk', label: 'Semua Produk', desc: 'Semua menu' },
                      { id: 'Produk Tertentu', label: 'Produk Tertentu', desc: 'Menu pilihan' }
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

              <div>
                <label className="block text-[11px] font-bold mb-2" style={{ color: '#6B5448', letterSpacing: '0.06em' }}>
                  BERLAKU DI CABANG
                </label>
                <div className="grid grid-cols-2 gap-2 mb-2">
                  <button
                    type="button"
                    onClick={() => set('outlets', 'all')}
                    className="py-2.5 px-3 rounded-xl text-[12px] font-bold transition-all text-center flex items-center justify-center gap-1.5"
                    style={{
                      background: form.outlets === 'all' || !form.outlets ? '#F3E7CE' : 'white',
                      color: form.outlets === 'all' || !form.outlets ? '#8B4A1E' : '#6B5448',
                      border: `1.5px solid ${form.outlets === 'all' || !form.outlets ? '#8B4A1E' : '#E8D7C0'}`,
                    }}
                  >
                    <span>Semua Cabang (Global)</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      if (form.outlets === 'all' || !form.outlets) {
                        set('outlets', outlet?.id && outlet.id !== 'none' ? [outlet.id] : (outletsList[0]?.id ? [outletsList[0].id] : []))
                      }
                    }}
                    className="py-2.5 px-3 rounded-xl text-[12px] font-bold transition-all text-center flex items-center justify-center gap-1.5"
                    style={{
                      background: Array.isArray(form.outlets) ? '#F3E7CE' : 'white',
                      color: Array.isArray(form.outlets) ? '#8B4A1E' : '#6B5448',
                      border: `1.5px solid ${Array.isArray(form.outlets) ? '#8B4A1E' : '#E8D7C0'}`,
                    }}
                  >
                    <span>Pilih Cabang Tertentu</span>
                  </button>
                </div>

                {Array.isArray(form.outlets) && (
                  <div className="p-3.5 rounded-2xl bg-white border border-[#E8D7C0] flex flex-col gap-2 mt-2">
                    <p className="text-[11px] font-medium" style={{ color: '#6B5448' }}>Pilih satu atau lebih cabang:</p>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {outletsList.map(o => {
                        const isChecked = Array.isArray(form.outlets) && form.outlets.includes(o.id)
                        return (
                          <button
                            key={o.id}
                            type="button"
                            onClick={() => {
                              const current = Array.isArray(form.outlets) ? form.outlets : []
                              const next = isChecked
                                ? current.filter(id => id !== o.id)
                                : [...current, o.id]
                              set('outlets', next)
                            }}
                            className="flex items-center gap-2.5 p-2.5 rounded-xl text-left transition-colors"
                            style={{
                              background: isChecked ? '#FAF6ED' : 'white',
                              border: `1.5px solid ${isChecked ? '#8B4A1E' : '#E8D7C0'}`
                            }}
                          >
                            <div
                              className="w-4 h-4 rounded flex items-center justify-center shrink-0"
                              style={{
                                background: isChecked ? '#8B4A1E' : 'transparent',
                                border: `1.5px solid ${isChecked ? '#8B4A1E' : '#C49A62'}`
                              }}
                            >
                              {isChecked && <span className="text-white text-[10px] font-bold leading-none">✓</span>}
                            </div>
                            <div className="min-w-0 flex-1">
                              <p className="text-[12px] font-bold truncate" style={{ color: '#2B1810' }}>
                                {o.name}
                              </p>
                              <p className="text-[10px] truncate opacity-70" style={{ color: '#6B5448' }}>
                                {o.address}
                              </p>
                            </div>
                          </button>
                        )
                      })}
                    </div>
                  </div>
                )}
              </div>
            </>
          )}

          {/* Tab 3: Schedule */}
          {activeTab === 'schedule' && (
            <>
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
            </>
          )}
        </div>

        {/* Footer */}
        {errorMsg && (
          <div className="px-6 pb-3 flex items-start gap-2" role="alert">
            <AlertCircle size={15} color="#B60000" className="shrink-0 mt-0.5" />
            <p className="text-[12px] font-semibold" style={{ color: '#B60000' }}>{errorMsg}</p>
          </div>
        )}
        <div className="px-6 py-4 flex gap-3" style={{ borderTop: '1px solid #E8D7C0' }}>
          <Button onClick={onClose} variant="secondary" size="lg" fullWidth>
            Batal
          </Button>
          <Button onClick={handleSave} variant="primary" size="lg" fullWidth>
            {isEdit ? 'Simpan Perubahan' : 'Buat Promo'}
          </Button>
        </div>
      </div>
    </div>
  )
}
