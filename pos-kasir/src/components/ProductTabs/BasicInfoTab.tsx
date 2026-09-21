import { Search, Plus, Minus, Package, Check } from 'lucide-react'
import { type Product } from '../../context/AppContext'

interface Props {
  form: Omit<Product, 'id'>
  setField: <K extends keyof Omit<Product, 'id'>>(k: K, v: Omit<Product, 'id'>[K]) => void
  productsList: Product[]
  packageItems: { productId: number; productName: string; qty: number; price: number; cost: number }[]
  togglePackageItem: (p: Product) => void
  updatePkgItemQty: (id: number, delta: number) => void
  pkgSearch: string
  setPkgSearch: (s: string) => void
  totalPkgNormalPrice: number
  totalPkgCost: number
}

const CATS = ['Kukus', 'Goreng', 'Minuman', 'Snack', 'Paket']
const inputStyle = { background: 'white', border: '1.5px solid #E8D7C0', color: '#2B1810' } as const
const focusBorder = (e: React.FocusEvent<HTMLInputElement>) => { e.currentTarget.style.borderColor = '#8B4A1E' }
const blurBorder = (e: React.FocusEvent<HTMLInputElement>) => { e.currentTarget.style.borderColor = '#E8D7C0' }

export default function BasicInfoTab({
  form, setField, productsList, packageItems, togglePackageItem, updatePkgItemQty,
  pkgSearch, setPkgSearch, totalPkgNormalPrice, totalPkgCost
}: Props) {
  const margin = form.price > 0 ? Math.round(((form.price - form.cost) / form.price) * 100) : 0

  return (
    <div className="space-y-4">
      {/* Name */}
      <div>
        <label htmlFor="product-name" className="block text-[11px] font-bold mb-1.5" style={{ color: '#6B5448', letterSpacing: '0.06em' }}>NAMA PRODUK *</label>
        <input
          id="product-name"
          value={form.name}
          onChange={e => setField('name', e.target.value)}
          className="w-full px-4 py-3 rounded-xl text-[14px] outline-none"
          style={inputStyle}
          onFocus={focusBorder}
          onBlur={blurBorder}
          placeholder="Mis. Siao May Ayam Udang (Isi 3)"
        />
      </div>

      {/* Category */}
      <div>
        <label className="block text-[11px] font-bold mb-1.5" style={{ color: '#6B5448', letterSpacing: '0.06em' }}>KATEGORI</label>
        <div className="flex flex-wrap gap-2">
          {CATS.map(c => (
            <button
              key={c}
              type="button"
              onClick={() => setField('cat', c)}
              className="px-4 py-2 rounded-xl text-[13px] font-bold transition-colors"
              style={{ background: form.cat === c ? '#8B4A1E' : 'white', color: form.cat === c ? 'white' : '#6B5448', border: `1.5px solid ${form.cat === c ? '#8B4A1E' : '#E8D7C0'}` }}
            >
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
            <input
              type="text"
              value={form[key] ? form[key].toLocaleString('id-ID') : ''}
              onChange={e => {
                const rawVal = e.target.value.replace(/\D/g, '')
                setField(key, parseInt(rawVal) || 0)
              }}
              className="w-full px-4 py-3 rounded-xl text-[14px] outline-none"
              style={inputStyle}
              onFocus={focusBorder}
              onBlur={blurBorder}
            />
          </div>
        ))}
      </div>

      {/* Margin */}
      {form.price > 0 && form.cost > 0 && (
        <div className="rounded-xl px-4 py-2.5 flex items-center justify-between"
          style={{ background: margin > 30 ? '#EAF4E0' : '#FEF9EC', border: `1px solid ${margin > 30 ? '#5B8A2E' : '#C9A227'}30` }}>
          <span className="text-[12px]" style={{ color: margin > 30 ? '#5B8A2E' : '#C9A227' }}>Margin: {margin}%</span>
          <span className="font-bold text-[13px]" style={{ color: margin > 30 ? '#5B8A2E' : '#C9A227' }}>
            Rp {(form.price - form.cost).toLocaleString('id-ID')}
          </span>
        </div>
      )}

      {/* Package composition */}
      {form.cat === 'Paket' && (
        <div className="rounded-2xl p-4 bg-white border border-[#C49A62] shadow-sm space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Package size={17} color="#8B4A1E" />
              <p className="font-serif font-bold text-[14px]" style={{ color: '#2B1810' }}>
                Komposisi Menu dalam Paket ({packageItems.length} menu)
              </p>
            </div>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-[#FAF6ED] text-[#8B4A1E] border border-[#E8D7C0]">
              Paket Combo
            </span>
          </div>
          <p className="text-[11px]" style={{ color: '#6B5448' }}>
            Pilih menu apa saja yang didapat pelanggan dalam paket ini. Stok bahan baku masing-masing menu otomatis dipotong resep saat paket terjual di kasir.
          </p>

          {/* Search */}
          <div className="relative">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              value={pkgSearch}
              onChange={e => setPkgSearch(e.target.value)}
              placeholder="Cari menu untuk dimasukkan ke paket..."
              className="w-full pl-8 pr-3 py-2 rounded-xl text-[12px] outline-none"
              style={{ background: '#FAF6ED', border: '1.5px solid #E8D7C0', color: '#2B1810' }}
            />
          </div>

          {/* Product list */}
          <div className="max-h-44 overflow-y-auto custom-scrollbar flex flex-col gap-1 pr-1">
            {productsList
              .filter(p => p.cat !== 'Paket' && (p.name.toLowerCase().includes(pkgSearch.toLowerCase()) || (p.cat && p.cat.toLowerCase().includes(pkgSearch.toLowerCase()))))
              .slice(0, 15)
              .map(p => {
                const isSelected = packageItems.some(it => it.productId === p.id)
                return (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => togglePackageItem(p)}
                    className="flex items-center justify-between p-2 rounded-xl text-left transition-colors text-[12px]"
                    style={{
                      background: isSelected ? '#F3E7CE' : 'white',
                      border: `1px solid ${isSelected ? '#8B4A1E' : '#E8D7C0'}`
                    }}
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <div
                        className="w-4 h-4 rounded flex items-center justify-center shrink-0"
                        style={{
                          background: isSelected ? '#8B4A1E' : 'transparent',
                          border: `1.5px solid ${isSelected ? '#8B4A1E' : '#C49A62'}`
                        }}
                      >
                        {isSelected && <Check size={10} color="white" strokeWidth={3} />}
                      </div>
                      <span className="font-semibold text-[#2B1810] truncate">{p.name}</span>
                      <span className="text-[10px] text-[#6B5448] shrink-0">({p.cat})</span>
                    </div>
                    <span className="font-bold text-[#8B4A1E] shrink-0">
                      Rp {p.price.toLocaleString('id-ID')}
                    </span>
                  </button>
                )
              })}
          </div>

          {/* Selected items */}
          {packageItems.length > 0 && (
            <div className="p-3 rounded-xl bg-[#FAF6ED] border border-[#E8D7C0] space-y-2 mt-2">
              <p className="text-[10px] font-bold text-[#8B4A1E]">MENU TERPILIH DI DALAM PAKET:</p>
              <div className="space-y-1.5">
                {packageItems.map(it => (
                  <div key={it.productId} className="flex items-center justify-between text-[12px]">
                    <span className="font-medium text-[#2B1810] truncate max-w-[200px]">{it.productName}</span>
                    <div className="flex items-center gap-2">
                      <div className="flex items-center rounded-lg overflow-hidden border border-[#E8D7C0] bg-white h-6">
                        <button
                          type="button"
                          onClick={() => updatePkgItemQty(it.productId, -1)}
                          className="w-6 h-full flex items-center justify-center hover:bg-gray-100 text-[#8B4A1E]"
                        >
                          <Minus size={10} />
                        </button>
                        <span className="w-6 text-center font-bold text-[11px] text-[#2B1810]">{it.qty}</span>
                        <button
                          type="button"
                          onClick={() => updatePkgItemQty(it.productId, 1)}
                          className="w-6 h-full flex items-center justify-center hover:bg-gray-100 text-[#8B4A1E]"
                        >
                          <Plus size={10} />
                        </button>
                      </div>
                      <span className="font-bold text-[11px] text-[#6B5448] w-20 text-right">
                        Rp {(it.price * it.qty).toLocaleString('id-ID')}
                      </span>
                    </div>
                  </div>
                ))}
              </div>

              {/* Summary */}
              <div className="pt-2 border-t border-[#E8D7C0] space-y-1.5 text-[11px]">
                <div className="flex justify-between">
                  <span className="text-[#6B5448]">Total Nilai Normal Satuan:</span>
                  <span className="font-bold text-[#2B1810]">Rp {totalPkgNormalPrice.toLocaleString('id-ID')}</span>
                </div>
                {totalPkgCost > 0 && (
                  <div className="flex justify-between items-center">
                    <span className="text-[#6B5448]">Total Modal HPP Penyusun:</span>
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-[#6B5448]">Rp {totalPkgCost.toLocaleString('id-ID')}</span>
                      {form.cost !== totalPkgCost && (
                        <button
                          type="button"
                          onClick={() => setField('cost', totalPkgCost)}
                          className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-[#F3E7CE] text-[#8B4A1E] hover:underline"
                        >
                          Salin ke Modal
                        </button>
                      )}
                    </div>
                  </div>
                )}
                {totalPkgNormalPrice > form.price && form.price > 0 && (
                  <div className="flex justify-between text-[#5B8A2E] font-bold">
                    <span>Penghematan Pelanggan:</span>
                    <span>Hemat Rp {(totalPkgNormalPrice - form.price).toLocaleString('id-ID')} ({Math.round(((totalPkgNormalPrice - form.price) / totalPkgNormalPrice) * 100)}%)</span>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
