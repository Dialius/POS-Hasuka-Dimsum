import { useState } from 'react'
import { Search, Plus, Minus } from 'lucide-react'
import PageShell from './PageShell'

const INITIAL = [
  { id: 1, name: 'Siao May Ayam Udang (Isi 4)', cat: 'Kukus', system: 45, physical: 45 },
  { id: 2, name: 'Hakau Udang Garing (Isi 3)', cat: 'Kukus', system: 12, physical: 11 },
  { id: 3, name: 'Lumpia Kulit Tahu Goreng', cat: 'Goreng', system: 8, physical: 8 },
  { id: 4, name: 'Bakpao Durian Pasir Emas', cat: 'Kukus', system: 0, physical: 0 },
  { id: 5, name: 'Teh Liang Dingin Manis', cat: 'Minuman', system: 120, physical: 115 },
  { id: 6, name: 'Ceker Ayam Saus Szechuan', cat: 'Kukus', system: 18, physical: null },
  { id: 7, name: 'Siao May Kepiting (Isi 4)', cat: 'Kukus', system: 24, physical: null },
]

const CATS = ['Semua', 'Kukus', 'Goreng', 'Minuman']

export default function StokOpnameScreen({ onBack }: { onBack: () => void }) {
  const [products, setProducts] = useState(INITIAL)
  const [search, setSearch] = useState('')
  const [activeCat, setActiveCat] = useState('Semua')

  const update = (id: number, val: number | null) => {
    setProducts(prev => prev.map(p => p.id === id ? { ...p, physical: val !== null && val < 0 ? 0 : val } : p))
  }

  const filtered = products.filter(p =>
    (activeCat === 'Semua' || p.cat === activeCat) &&
    p.name.toLowerCase().includes(search.toLowerCase())
  )

  const counted = products.filter(p => p.physical !== null).length
  const hasDiff = products.filter(p => p.physical !== null && p.physical !== p.system)

  return (
    <PageShell
      title="Stok Opname"
      subtitle="Hitung fisik stok & rekonsiliasi"
      onBack={onBack}
    >
      <div className="flex flex-col h-full">

        {/* Progress bar */}
        <div className="px-6 py-3 shrink-0" style={{ background: '#F3E7CE', borderBottom: '1px solid #E8D7C0' }}>
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-[12px] font-semibold" style={{ color: '#6B5448' }}>Progress penghitungan</span>
            <span className="text-[12px] font-bold" style={{ color: '#8B4A1E' }}>{counted}/{products.length} produk</span>
          </div>
          <div className="h-2 rounded-full overflow-hidden" style={{ background: '#E8D7C0' }}>
            <div className="h-full rounded-full transition-all" style={{ width: `${(counted / products.length) * 100}%`, background: '#8B4A1E' }} />
          </div>
          {hasDiff.length > 0 && (
            <p className="text-[11px] mt-1.5 font-semibold" style={{ color: '#B60000' }}>
              {hasDiff.length} produk ada selisih
            </p>
          )}
        </div>

        {/* Search + filter */}
        <div className="px-6 py-3 shrink-0" style={{ borderBottom: '1px solid #E8D7C0' }}>
          <div className="relative mb-2">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: '#6B5448' }} />
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
              <button key={c} onClick={() => setActiveCat(c)} className="px-3 py-1 rounded-full text-[11px] font-bold transition-colors"
                style={{ background: activeCat === c ? '#8B4A1E' : 'white', color: activeCat === c ? 'white' : '#6B5448', border: activeCat === c ? '1px solid #8B4A1E' : '1px solid #E8D7C0' }}>
                {c}
              </button>
            ))}
          </div>
        </div>

        {/* Table header */}
        <div className="grid grid-cols-12 px-6 py-2 text-[10px] font-bold shrink-0" style={{ color: '#6B5448', borderBottom: '1px solid #E8D7C0', background: '#FAF6ED', letterSpacing: '0.06em' }}>
          <span className="col-span-5">PRODUK</span>
          <span className="col-span-2 text-center">SISTEM</span>
          <span className="col-span-3 text-center">FISIK</span>
          <span className="col-span-2 text-center">SELISIH</span>
        </div>

        {/* Product rows */}
        <div className="flex-1 overflow-y-auto custom-scrollbar">
          {filtered.map((p, i) => {
            const diff = p.physical !== null ? p.physical - p.system : null
            const hasDiffRow = diff !== null && diff !== 0
            return (
              <div
                key={p.id}
                className="grid grid-cols-12 items-center px-6"
                style={{
                  height: 64,
                  background: hasDiffRow ? (diff! < 0 ? '#FCE8E815' : '#EAF4E015') : (i % 2 === 0 ? '#FAF6ED' : 'white'),
                  borderBottom: '1px solid #E8D7C060',
                  borderLeft: hasDiffRow ? `3px solid ${diff! < 0 ? '#B60000' : '#5B8A2E'}` : '3px solid transparent',
                }}
              >
                {/* Name */}
                <div className="col-span-5 pr-2">
                  <p className="font-semibold text-[12px] leading-snug" style={{ color: '#2B1810' }}>{p.name}</p>
                  <p className="text-[10px]" style={{ color: '#C49A62' }}>{p.cat}</p>
                </div>

                {/* System */}
                <div className="col-span-2 text-center">
                  <span className="font-bold text-[14px]" style={{ color: '#6B5448' }}>{p.system}</span>
                </div>

                {/* Physical stepper */}
                <div className="col-span-3 flex items-center justify-center">
                  {p.physical === null ? (
                    <button
                      onClick={() => update(p.id, p.system)}
                      className="text-[11px] font-bold px-2.5 py-1 rounded-full transition-colors"
                      style={{ background: '#F3E7CE', color: '#8B4A1E', border: '1px solid #C49A62' }}
                    >
                      + Hitung
                    </button>
                  ) : (
                    <div className="flex items-center rounded-lg overflow-hidden" style={{ border: '1.5px solid #8B4A1E', height: 30 }}>
                      <button onClick={() => update(p.id, Math.max(0, (p.physical ?? 0) - 1))} className="w-7 h-full flex items-center justify-center" style={{ color: '#8B4A1E' }}>
                        <Minus size={11} strokeWidth={3} />
                      </button>
                      <input
                        type="number"
                        value={p.physical ?? ''}
                        onChange={e => update(p.id, e.target.value === '' ? null : parseInt(e.target.value))}
                        className="w-8 text-center font-extrabold text-[13px] outline-none"
                        style={{ color: '#2B1810', background: 'transparent' }}
                      />
                      <button onClick={() => update(p.id, (p.physical ?? 0) + 1)} className="w-7 h-full flex items-center justify-center" style={{ background: '#8B4A1E', color: 'white' }}>
                        <Plus size={11} strokeWidth={3} />
                      </button>
                    </div>
                  )}
                </div>

                {/* Difference */}
                <div className="col-span-2 text-center">
                  {diff === null ? (
                    <span className="text-[10px]" style={{ color: '#C49A62' }}>—</span>
                  ) : (
                    <span className="font-bold text-[13px]" style={{ color: diff === 0 ? '#5B8A2E' : (diff < 0 ? '#B60000' : '#C9A227') }}>
                      {diff > 0 ? '+' : ''}{diff}
                    </span>
                  )}
                </div>
              </div>
            )
          })}
        </div>

        {/* Footer action */}
        <div className="px-6 py-4 shrink-0" style={{ borderTop: '1.5px solid #E8D7C0' }}>
          <button
            disabled={counted === 0}
            className="w-full py-3 rounded-xl font-bold text-[14px] transition-all"
            style={{ background: counted === 0 ? '#C49A62' : '#8B4A1E', color: 'white', opacity: counted === 0 ? 0.6 : 1 }}
          >
            Simpan & Sinkronkan Stok ({counted} produk)
          </button>
        </div>
      </div>
    </PageShell>
  )
}
