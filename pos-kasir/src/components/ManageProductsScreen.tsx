import { useState } from 'react'
import { Search, Plus, Edit2, Package, ChefHat } from 'lucide-react'
import PageShell from './PageShell'
import { useApp, type Product, type Recipe, type Ingredient } from '../context/AppContext'
import AddEditProductModal from './AddEditProductModal'
import { gasApi } from '../services/gasApi'

const fmt = (n: number) => `Rp ${n.toLocaleString('id-ID')}`

const CATS = ['Semua', 'Kukus', 'Goreng', 'Minuman']

// Hitung estimasi stok minimum dari resep (ingredient paling kritis)
function recipeStockEstimate(productId: number, recipesList: Recipe[], ingredientsList: Ingredient[]): { min: number; unit: string } | null {
  const recipes = recipesList.filter(r => r.product_id === productId)
  if (recipes.length === 0) return null
  let minPortions = Infinity
  let limitUnit = ''
  for (const r of recipes) {
    const ing = ingredientsList.find(i => i.id === r.ingredient_id)
    if (!ing || !ing.is_tracked) continue
    const possible = Math.floor(ing.current_stock / r.qty_per_unit)
    if (possible < minPortions) { minPortions = possible; limitUnit = ing.name }
  }
  return minPortions === Infinity ? null : { min: minPortions, unit: limitUnit }
}

export default function ManageProductsScreen({ onBack, backLabel, onNavigate }: { onBack: () => void; backLabel?: string; onNavigate?: (s: string) => void }) {
  const { productsList, setProductsList, recipesList, ingredientsList } = useApp()
  const [activeCat, setActiveCat] = useState('Semua')
  const [search, setSearch] = useState('')
  const [selected, setSelected] = useState<Product | undefined>(productsList[0])
  const [modalProduct, setModalProduct] = useState<Product | null | undefined>(undefined)

  const [isSaving, setIsSaving] = useState(false)

  const handleSave = async (p: Product) => {
    setIsSaving(true)
    try {
      await gasApi.saveProduct(p)
      setProductsList(prev => {
        const exists = prev.some(x => x.id === p.id)
        const next = exists ? prev.map(x => x.id === p.id ? p : x) : [...prev, p]
        if (selected?.id === p.id) setSelected(p)
        return next
      })
      setModalProduct(undefined)
    } catch (error) {
      alert('Gagal menyimpan produk.')
    } finally {
      setIsSaving(false)
    }
  }

  const filtered = productsList.filter(p =>
    (activeCat === 'Semua' || p.cat === activeCat) &&
    p.name.toLowerCase().includes(search.toLowerCase())
  )

  const margin = selected ? selected.price - selected.cost : 0
  const marginPct = selected && selected.price > 0 ? ((margin / selected.price) * 100).toFixed(1) : '0'
  const estimate = selected && selected.stock_mode === 'recipe' ? recipeStockEstimate(selected.id, recipesList, ingredientsList) : null

  return (
    <PageShell
      title="Manajemen Produk"
      subtitle="Kelola menu, harga & mode stok"
      onBack={onBack}
      backLabel={backLabel}
      rightPanelWidth={340}
      rightPanel={
        <div className="flex flex-col h-full">
          {/* Product photo */}
          <div className="relative h-44 shrink-0 overflow-hidden" style={{ background: '#E8D7C0' }}>
            {selected ? (
              <>
                <img src={selected.img} alt={selected.name} referrerPolicy="no-referrer" className="w-full h-full object-cover" />
                <div className="absolute inset-0" style={{ background: 'linear-gradient(to top, rgba(43,24,16,0.6) 0%, transparent 60%)' }} />
                <div className="absolute bottom-0 left-0 right-0 px-5 pb-4">
                  <p className="font-serif font-bold text-[16px] text-white leading-snug">{selected.name}</p>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full mt-1 inline-block"
                    style={{ background: selected.promo ? '#DF690B' : '#F3E7CE', color: selected.promo ? 'white' : '#6B5448' }}>
                    {selected.promo ? 'PROMO AKTIF' : selected.cat}
                  </span>
                </div>
              </>
            ) : (
              <div className="absolute inset-0 flex items-center justify-center">
                <Package size={48} color="#C49A62" opacity={0.3} />
              </div>
            )}
          </div>

          {/* Detail panel */}
          <div className="flex-1 overflow-y-auto px-5 py-4 flex flex-col">
            {!selected ? (
              <div className="flex-1 flex flex-col items-center justify-center text-center px-4">
                <ChefHat size={48} color="#E8D7C0" className="mb-4" />
                <h3 className="font-bold text-[#8B4A1E] text-[16px] mb-2">Belum Ada Produk</h3>
                <p className="text-[12px] text-[#6B5448]">Silakan tambah produk baru untuk mengelola menu Anda.</p>
              </div>
            ) : (
              <>
                {/* Pricing */}
                <div className="grid grid-cols-3 gap-2 mb-5 shrink-0">
                  {[
                    { label: 'Harga Jual', val: fmt(selected.price), color: '#8B4A1E' },
                    { label: 'Harga Modal', val: fmt(selected.cost), color: '#6B5448' },
                    { label: `Margin ${marginPct}%`, val: fmt(margin), color: '#5B8A2E' },
                  ].map(c => (
                    <div key={c.label} className="rounded-xl p-3 text-center" style={{ background: '#F3E7CE', border: '1px solid #E8D7C0' }}>
                      <p className="font-bold text-[14px]" style={{ color: c.color }}>{c.val}</p>
                      <p className="text-[10px] mt-0.5" style={{ color: '#6B5448' }}>{c.label}</p>
                    </div>
                  ))}
                </div>

                {/* Stock info */}
                <div className="rounded-2xl p-4 mb-4 shrink-0" style={{ background: 'white', border: '1px solid #E8D7C0' }}>
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-bold text-[13px]" style={{ color: '#2B1810' }}>Status Stok</span>
                    {selected.stock_mode === 'recipe' ? (
                      <span className="text-[11px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1"
                        style={{ background: '#F3E7CE', color: '#8B4A1E' }}>
                        <ChefHat size={11} /> Berbasis Resep
                      </span>
                    ) : (
                      <span className="text-[11px] font-bold px-2 py-0.5 rounded-full"
                        style={{
                          background: selected.stock === 0 ? '#FCE8E8' : selected.stock <= (selected.minStock ?? 10) ? '#FEF9EC' : '#EAF4E0',
                          color: selected.stock === 0 ? '#B60000' : selected.stock <= (selected.minStock ?? 10) ? '#C9A227' : '#5B8A2E',
                        }}>
                        {selected.stock === 0 ? 'HABIS' : selected.stock <= (selected.minStock ?? 10) ? 'STOK RENDAH' : 'TERSEDIA'}
                      </span>
                    )}
                  </div>

                  {selected.stock_mode === 'recipe' ? (
                    estimate ? (
                      <>
                        <div className="flex items-end gap-1">
                          <span className="font-serif font-bold text-[28px]" style={{ color: '#2B1810' }}>{estimate.min}</span>
                          <span className="text-[12px] mb-1" style={{ color: '#6B5448' }}>porsi bisa dibuat</span>
                        </div>
                        <p className="text-[10px] mt-1" style={{ color: '#C49A62' }}>Dibatasi oleh: {estimate.unit}</p>
                      </>
                    ) : (
                      <p className="text-[13px]" style={{ color: '#C49A62' }}>Belum ada resep — atur di Kelola Resep</p>
                    )
                  ) : (
                    <div className="flex items-end gap-1">
                      <span className="font-serif font-bold text-[28px]" style={{ color: '#2B1810' }}>{selected.stock}</span>
                      <span className="text-[12px] mb-1" style={{ color: '#6B5448' }}>/ min. {selected.minStock ?? 10}</span>
                    </div>
                  )}
                </div>

                {/* Spacer to push buttons down */}
                <div className="flex-1" />

                {/* Buttons */}
                <div className="flex flex-col gap-2 mt-4">
                  {selected.stock_mode === 'recipe' && onNavigate && (
                    <button onClick={() => onNavigate('kelolaResep')}
                      className="w-full py-3 rounded-xl font-bold text-[14px] flex items-center justify-center gap-2 transition-all hover:bg-amber-100"
                      style={{ background: '#F3E7CE', color: '#8B4A1E', border: '1px solid #E8D7C0' }}>
                      <ChefHat size={16} />
                      Atur Resep (Bahan Baku)
                    </button>
                  )}
                  <button onClick={() => setModalProduct(selected)}
                    className="w-full py-3 rounded-xl font-bold text-[14px] flex items-center justify-center gap-2 transition-all hover:opacity-90"
                    style={{ background: '#8B4A1E', color: 'white' }}>
                    <Edit2 size={16} />
                    Edit Produk Ini
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      }
    >
      {/* Left: search + list */}
      <div className="flex flex-col h-full">
        <div className="px-5 py-3 shrink-0" style={{ borderBottom: '1px solid #E8D7C0' }}>
          <div className="relative mb-3">
            <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: '#6B5448' }} />
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Cari produk..."
              className="w-full pl-9 pr-4 py-2 rounded-xl text-[13px] outline-none"
              style={{ background: '#F3E7CE', border: '1.5px solid #E8D7C0', color: '#2B1810' }}
              onFocus={e => { e.currentTarget.style.borderColor = '#8B4A1E' }}
              onBlur={e => { e.currentTarget.style.borderColor = '#E8D7C0' }} />
          </div>
          <div className="flex gap-1.5">
            {CATS.map(c => (
              <button key={c} onClick={() => setActiveCat(c)}
                className="px-3 py-1 rounded-full text-[11px] font-bold transition-colors"
                style={{ background: activeCat === c ? '#8B4A1E' : 'white', color: activeCat === c ? 'white' : '#6B5448', border: activeCat === c ? '1px solid #8B4A1E' : '1px solid #E8D7C0' }}>
                {c}
              </button>
            ))}
            <button onClick={() => setModalProduct(null)}
              className="ml-auto flex items-center gap-1 px-3 py-1 rounded-full text-[11px] font-bold transition-colors"
              style={{ background: '#8B4A1E', color: 'white' }}>
              <Plus size={12} /> Tambah
            </button>
          </div>
        </div>

        {/* Product list */}
        <div className="flex-1 overflow-y-auto custom-scrollbar">
          {filtered.map((p, i) => {
            const isSelected = selected?.id === p.id
            const isDirect = p.stock_mode === 'direct'
            const isHabis = isDirect && p.stock === 0
            const isLow = isDirect && !isHabis && p.stock <= (p.minStock ?? 10)
            const est = p.stock_mode === 'recipe' ? recipeStockEstimate(p.id, recipesList, ingredientsList) : null
            return (
              <button key={p.id} onClick={() => setSelected(p)}
                className="w-full flex items-center gap-3 px-5 py-3.5 text-left transition-colors"
                style={{
                  background: isSelected ? '#F3E7CE' : (i % 2 === 0 ? '#FAF6ED' : 'white'),
                  borderBottom: '1px solid #E8D7C080',
                  borderLeft: isSelected ? '3px solid #8B4A1E' : '3px solid transparent',
                }}>
                <div className="shrink-0 overflow-hidden" style={{ width: 44, height: 44, borderRadius: '50%', border: isSelected ? '2.5px solid #8B4A1E' : '1.5px solid #C49A6240' }}>
                  <img src={p.img} alt={p.name} referrerPolicy="no-referrer" className="w-full h-full object-cover" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-bold text-[13px] truncate" style={{ color: '#2B1810' }}>{p.name}</p>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className="font-semibold text-[12px]" style={{ color: '#8B4A1E' }}>{fmt(p.price)}</span>
                    {isHabis && <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full" style={{ background: '#FCE8E8', color: '#B60000' }}>HABIS</span>}
                    {isLow && <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full" style={{ background: '#FEF9EC', color: '#C9A227' }}>STOK RENDAH</span>}
                    {p.promo && <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full" style={{ background: '#DF690B1A', color: '#DF690B' }}>PROMO</span>}
                  </div>
                </div>
                {/* Stock indicator — right side */}
                <div className="flex items-center gap-1 shrink-0">
                  {isDirect ? (
                    <>
                      <Package size={12} color="#C49A62" />
                      <span className="font-bold text-[12px]" style={{ color: isHabis ? '#B60000' : '#6B5448' }}>{p.stock}</span>
                    </>
                  ) : est ? (
                    <>
                      <ChefHat size={12} color="#8B4A1E" />
                      <span className="font-bold text-[12px]" style={{ color: est.min === 0 ? '#B60000' : '#6B5448' }}>{est.min}</span>
                    </>
                  ) : (
                    <ChefHat size={12} color="#C49A62" />
                  )}
                </div>
              </button>
            )
          })}
        </div>
      </div>

      {modalProduct !== undefined && (
        <AddEditProductModal 
          product={modalProduct} 
          onSave={handleSave} 
          onClose={() => setModalProduct(undefined)} 
          isSaving={isSaving} 
        />
      )}
    </PageShell>
  )
}
