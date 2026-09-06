import { useState } from 'react'
import { Search, Plus, Edit2, Package } from 'lucide-react'
import PageShell from './PageShell'

const fmt = (n: number) => `Rp ${n.toLocaleString('id-ID')}`

const PRODUCTS = [
  { id: 1, name: 'Siao May Ayam Udang (Isi 3)', cat: 'Kukus', price: 24000, cost: 14500, stock: 45, minStock: 10, promo: false, img: 'https://images.unsplash.com/photo-1563245372-f21724e3856d?auto=format&fit=crop&q=80&w=100' },
  { id: 2, name: 'Hakau Udang Garing (Isi 3)', cat: 'Kukus', price: 21000, cost: 12000, stock: 12, minStock: 10, promo: true, img: 'https://images.unsplash.com/photo-1496116218417-1a781b1c416c?auto=format&fit=crop&q=80&w=100' },
  { id: 3, name: 'Bakpao Durian Pasir Emas', cat: 'Kukus', price: 26000, cost: 15000, stock: 0, minStock: 10, promo: false, img: 'https://images.unsplash.com/photo-1577906096429-f73c2c312435?auto=format&fit=crop&q=80&w=100' },
  { id: 4, name: 'Lumpia Kulit Tahu Goreng', cat: 'Goreng', price: 23000, cost: 13000, stock: 8, minStock: 10, promo: false, img: 'https://images.unsplash.com/photo-1563245372-f21724e3856d?auto=format&fit=crop&q=80&w=100' },
  { id: 5, name: 'Ceker Ayam Saus Szechuan', cat: 'Goreng', price: 19500, cost: 10000, stock: 10, promo: false, img: 'https://images.unsplash.com/photo-1563245372-f21724e3856d?auto=format&fit=crop&q=80&w=100' },
  { id: 6, name: 'Teh Liang Dingin Manis', cat: 'Minuman', price: 8000, cost: 3000, stock: 120, minStock: 20, promo: false, img: 'https://images.unsplash.com/photo-1556679343-c7306c1976bc?auto=format&fit=crop&q=80&w=100' },
]

const CATS = ['Semua', 'Kukus', 'Goreng', 'Minuman']

export default function ManageProductsScreen({ onBack }: { onBack: () => void }) {
  const [activeCat, setActiveCat] = useState('Semua')
  const [search, setSearch] = useState('')
  const [selected, setSelected] = useState(PRODUCTS[0])

  const filtered = PRODUCTS.filter(p =>
    (activeCat === 'Semua' || p.cat === activeCat) &&
    p.name.toLowerCase().includes(search.toLowerCase())
  )

  const margin = selected.price - selected.cost
  const marginPct = ((margin / selected.price) * 100).toFixed(1)

  return (
    <PageShell
      title="Manajemen Produk"
      subtitle="Kelola menu, harga, stok & variasi"
      onBack={onBack}
      rightPanelWidth={340}
      rightPanel={
        <div className="flex flex-col h-full">
          {/* Product photo */}
          <div className="relative h-44 shrink-0 overflow-hidden" style={{ background: '#E8D7C0' }}>
            <img src={selected.img} alt={selected.name} className="w-full h-full object-cover" />
            <div className="absolute inset-0" style={{ background: 'linear-gradient(to top, rgba(43,24,16,0.6) 0%, transparent 60%)' }} />
            <div className="absolute bottom-0 left-0 right-0 px-5 pb-4">
              <p className="font-serif font-bold text-[16px] text-white leading-snug">{selected.name}</p>
              <span
                className="text-[10px] font-bold px-2 py-0.5 rounded-full mt-1 inline-block"
                style={{ background: selected.promo ? '#DF690B' : '#F3E7CE', color: selected.promo ? 'white' : '#6B5448' }}
              >
                {selected.promo ? 'PROMO AKTIF' : selected.cat}
              </span>
            </div>
          </div>

          {/* Detail panel */}
          <div className="flex-1 overflow-y-auto px-5 py-4">
            {/* Pricing */}
            <div className="grid grid-cols-3 gap-2 mb-5">
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

            {/* Stock */}
            <div className="rounded-2xl p-4 mb-4" style={{ background: 'white', border: '1px solid #E8D7C0' }}>
              <div className="flex items-center justify-between mb-2">
                <span className="font-bold text-[13px]" style={{ color: '#2B1810' }}>Status Stok</span>
                <span
                  className="text-[11px] font-bold px-2 py-0.5 rounded-full"
                  style={{
                    background: selected.stock === 0 ? '#FCE8E8' : (selected.stock <= (selected.minStock ?? 10) ? '#FEF9EC' : '#EAF4E0'),
                    color: selected.stock === 0 ? '#B60000' : (selected.stock <= (selected.minStock ?? 10) ? '#C9A227' : '#5B8A2E'),
                  }}
                >
                  {selected.stock === 0 ? 'HABIS' : selected.stock <= (selected.minStock ?? 10) ? 'STOK RENDAH' : 'TERSEDIA'}
                </span>
              </div>
              <div className="flex items-end gap-1">
                <span className="font-serif font-bold text-[28px]" style={{ color: '#2B1810' }}>{selected.stock}</span>
                <span className="text-[12px] mb-1" style={{ color: '#6B5448' }}>/ min. {selected.minStock ?? 10} porsi</span>
              </div>
            </div>

            {/* Edit button */}
            <button
              className="w-full py-3 rounded-xl font-bold text-[14px] flex items-center justify-center gap-2 transition-all"
              style={{ background: '#8B4A1E', color: 'white' }}
            >
              <Edit2 size={16} />
              Edit Produk Ini
            </button>
          </div>
        </div>
      }
    >
      {/* Left: search + list */}
      <div className="flex flex-col h-full">
        {/* Search + filter */}
        <div className="px-5 py-3 shrink-0" style={{ borderBottom: '1px solid #E8D7C0' }}>
          <div className="relative mb-3">
            <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: '#6B5448' }} />
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Cari produk..."
              className="w-full pl-9 pr-4 py-2 rounded-xl text-[13px] outline-none"
              style={{ background: '#F3E7CE', border: '1.5px solid #E8D7C0', color: '#2B1810' }}
              onFocus={e => { e.currentTarget.style.borderColor = '#8B4A1E' }}
              onBlur={e => { e.currentTarget.style.borderColor = '#E8D7C0' }}
            />
          </div>
          <div className="flex gap-1.5">
            {CATS.map(c => (
              <button
                key={c}
                onClick={() => setActiveCat(c)}
                className="px-3 py-1 rounded-full text-[11px] font-bold transition-colors"
                style={{
                  background: activeCat === c ? '#8B4A1E' : 'white',
                  color: activeCat === c ? 'white' : '#6B5448',
                  border: activeCat === c ? '1px solid #8B4A1E' : '1px solid #E8D7C0',
                }}
              >
                {c}
              </button>
            ))}
            <button
              className="ml-auto flex items-center gap-1 px-3 py-1 rounded-full text-[11px] font-bold transition-colors"
              style={{ background: '#8B4A1E', color: 'white' }}
            >
              <Plus size={12} /> Tambah
            </button>
          </div>
        </div>

        {/* Product list */}
        <div className="flex-1 overflow-y-auto custom-scrollbar">
          {filtered.map((p, i) => {
            const isSelected = selected.id === p.id
            const isHabis = p.stock === 0
            const isLow = !isHabis && p.stock <= (p.minStock ?? 10)
            return (
              <button
                key={p.id}
                onClick={() => setSelected(p)}
                className="w-full flex items-center gap-3 px-5 py-3.5 text-left transition-colors"
                style={{
                  background: isSelected ? '#F3E7CE' : (i % 2 === 0 ? '#FAF6ED' : 'white'),
                  borderBottom: '1px solid #E8D7C080',
                  borderLeft: isSelected ? '3px solid #8B4A1E' : '3px solid transparent',
                }}
              >
                {/* Circular photo */}
                <div
                  className="shrink-0 overflow-hidden"
                  style={{ width: 44, height: 44, borderRadius: '50%', border: isSelected ? '2.5px solid #8B4A1E' : '1.5px solid #C49A6240' }}
                >
                  <img src={p.img} alt={p.name} className="w-full h-full object-cover" />
                </div>

                <div className="flex-1 min-w-0">
                  <p className="font-bold text-[13px] truncate" style={{ color: '#2B1810' }}>{p.name}</p>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className="font-semibold text-[12px]" style={{ color: '#8B4A1E' }}>{fmt(p.price)}</span>
                    {isHabis && <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full" style={{ background: '#FCE8E8', color: '#B60000' }}>HABIS</span>}
                    {isLow && !isHabis && <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full" style={{ background: '#FEF9EC', color: '#C9A227' }}>STOK RENDAH</span>}
                    {p.promo && <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full" style={{ background: '#DF690B1A', color: '#DF690B' }}>PROMO</span>}
                  </div>
                </div>

                <div className="flex items-center gap-1 shrink-0">
                  <Package size={12} color="#C49A62" />
                  <span className="font-bold text-[12px]" style={{ color: isHabis ? '#B60000' : '#6B5448' }}>{p.stock}</span>
                </div>
              </button>
            )
          })}
        </div>
      </div>
    </PageShell>
  )
}
