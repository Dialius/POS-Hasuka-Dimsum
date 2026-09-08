import { useState } from 'react'
import { Search, Plus, Minus, AlertTriangle, CheckCircle2, Eye, EyeOff } from 'lucide-react'
import PageShell from './PageShell'
import { INGREDIENTS, type Ingredient } from '../data/mockData'
import { useApp } from '../context/AppContext'

type OpnameRow = Ingredient & { physical: number | null }

const toRows = (ings: Ingredient[]): OpnameRow[] =>
  ings.map(i => ({ ...i, physical: null }))

export default function StokOpnameScreen({ onBack, backLabel }: { onBack: () => void; backLabel?: string }) {
  const { outlet } = useApp()
  
  // Hanya ambil bahan baku yang berlaku untuk cabang ini (atau semua cabang)
  const applicableIngredients = INGREDIENTS.filter(i => {
    if (!i.outlets || i.outlets === 'all') return true
    if (Array.isArray(i.outlets) && i.outlets.includes(outlet.id)) return true
    return false
  })

  const [rows, setRows] = useState<OpnameRow[]>(toRows(applicableIngredients))
  const [search, setSearch] = useState('')
  const [showUntracked, setShowUntracked] = useState(false)

  const update = (id: number, val: number | null) =>
    setRows(prev => prev.map(r => r.id === id ? { ...r, physical: val !== null && val < 0 ? 0 : val } : r))

  const visible = rows.filter(r =>
    (showUntracked || r.is_tracked) &&
    r.name.toLowerCase().includes(search.toLowerCase())
  )

  const tracked = rows.filter(r => r.is_tracked)
  const counted = tracked.filter(r => r.physical !== null).length
  const diffs = tracked.filter(r => r.physical !== null && r.physical !== r.current_stock)

  return (
    <PageShell title="Stok Opname" subtitle="Hitung fisik bahan baku & kemasan" onBack={onBack} backLabel={backLabel}>
      <div className="flex flex-col h-full">

        {/* Progress bar */}
        <div className="px-6 py-3 shrink-0" style={{ background: '#F3E7CE', borderBottom: '1px solid #E8D7C0' }}>
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-[12px] font-semibold" style={{ color: '#6B5448' }}>Progress penghitungan bahan baku</span>
            <div className="flex items-center gap-2">
              {diffs.length > 0 && (
                <span className="flex items-center gap-1 text-[11px] font-bold" style={{ color: '#B60000' }}>
                  <AlertTriangle size={12} /> {diffs.length} selisih
                </span>
              )}
              <span className="text-[12px] font-bold" style={{ color: '#8B4A1E' }}>{counted}/{tracked.length}</span>
            </div>
          </div>
          <div className="h-2 rounded-full overflow-hidden" style={{ background: '#E8D7C0' }}>
            <div className="h-full rounded-full transition-all duration-500"
              style={{ width: `${tracked.length > 0 ? (counted / tracked.length) * 100 : 0}%`, background: 'linear-gradient(to right, #8B4A1E, #C49A62)' }} />
          </div>
        </div>

        {/* Search + toggle untracked */}
        <div className="px-6 py-3 shrink-0" style={{ borderBottom: '1px solid #E8D7C0' }}>
          <div className="relative mb-2">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: '#6B5448' }} />
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Cari bahan baku..."
              className="w-full pl-9 pr-4 py-2 rounded-xl text-[13px] outline-none"
              style={{ background: 'white', border: '1.5px solid #E8D7C0', color: '#2B1810' }}
              onFocus={e => e.currentTarget.style.borderColor = '#8B4A1E'}
              onBlur={e => e.currentTarget.style.borderColor = '#E8D7C0'} />
          </div>
          <button onClick={() => setShowUntracked(v => !v)}
            className="flex items-center gap-1.5 text-[11px] font-bold transition-colors"
            style={{ color: showUntracked ? '#8B4A1E' : '#C49A62' }}>
            {showUntracked ? <Eye size={13} /> : <EyeOff size={13} />}
            {showUntracked ? 'Sembunyikan' : 'Tampilkan'} bahan tidak dilacak (saus, chili oil, dll)
          </button>
        </div>

        {/* Table header */}
        <div className="grid grid-cols-12 px-6 py-2 text-[10px] font-bold shrink-0"
          style={{ color: '#6B5448', borderBottom: '1px solid #E8D7C0', background: '#FAF6ED', letterSpacing: '0.06em' }}>
          <span className="col-span-5">BAHAN BAKU / KEMASAN</span>
          <span className="col-span-2 text-center">SISTEM</span>
          <span className="col-span-3 text-center">FISIK</span>
          <span className="col-span-2 text-center">SELISIH</span>
        </div>

        {/* Ingredient rows */}
        <div className="flex-1 overflow-y-auto custom-scrollbar">
          {visible.map((r, i) => {
            const diff = r.physical !== null ? r.physical - r.current_stock : null
            const hasDiff = diff !== null && diff !== 0
            const isUntracked = !r.is_tracked
            return (
              <div key={r.id} className="grid grid-cols-12 items-center px-6"
                style={{
                  height: 64,
                  background: isUntracked ? '#FAF6ED' : hasDiff ? (diff! < 0 ? '#FFF0F0' : '#F0FFF0') : (i % 2 === 0 ? '#FAF6ED' : 'white'),
                  borderBottom: '1px solid #E8D7C040',
                  borderLeft: `3px solid ${isUntracked ? '#E8D7C0' : hasDiff ? (diff! < 0 ? '#B60000' : '#5B8A2E') : 'transparent'}`,
                  opacity: isUntracked ? 0.55 : 1,
                }}>

                {/* Name + unit */}
                <div className="col-span-5 pr-2">
                  <p className="font-semibold text-[12px] leading-snug truncate" style={{ color: '#2B1810' }}>{r.name}</p>
                  <p className="text-[10px]" style={{ color: '#C49A62' }}>
                    {r.unit}{isUntracked ? ' · tidak dilacak' : ''}
                  </p>
                </div>

                {/* System stock */}
                <div className="col-span-2 text-center">
                  {isUntracked
                    ? <span className="text-[11px]" style={{ color: '#C49A62' }}>—</span>
                    : <span className="font-bold text-[15px]" style={{ color: '#6B5448' }}>{r.current_stock}</span>
                  }
                </div>

                {/* Physical stepper */}
                <div className="col-span-3 flex items-center justify-center">
                  {isUntracked ? (
                    <span className="text-[10px] px-2 py-1 rounded-full" style={{ background: '#F3E7CE', color: '#C49A62' }}>Skip</span>
                  ) : r.physical === null ? (
                    <button onClick={() => update(r.id, r.current_stock)}
                      className="text-[11px] font-bold px-3 py-1.5 rounded-full transition-all"
                      style={{ background: '#F3E7CE', color: '#8B4A1E', border: '1.5px solid #C49A62' }}>
                      + Hitung
                    </button>
                  ) : (
                    <div className="flex items-center rounded-xl overflow-hidden" style={{ border: '1.5px solid #8B4A1E', height: 32 }}>
                      <button onClick={() => update(r.id, Math.max(0, (r.physical ?? 0) - 1))}
                        className="w-8 h-full flex items-center justify-center transition-colors"
                        style={{ color: '#8B4A1E', background: '#F3E7CE' }}>
                        <Minus size={12} strokeWidth={3} />
                      </button>
                      <input type="number" value={r.physical}
                        onChange={e => { const v = parseInt(e.target.value); update(r.id, isNaN(v) ? 0 : v) }}
                        className="w-9 text-center font-extrabold text-[13px] outline-none h-full"
                        style={{ color: '#2B1810', background: 'white' }} />
                      <button onClick={() => update(r.id, (r.physical ?? 0) + 1)}
                        className="w-8 h-full flex items-center justify-center"
                        style={{ background: '#8B4A1E', color: 'white' }}>
                        <Plus size={12} strokeWidth={3} />
                      </button>
                    </div>
                  )}
                </div>

                {/* Diff */}
                <div className="col-span-2 flex items-center justify-center gap-1">
                  {isUntracked || diff === null ? (
                    <span className="text-[11px]" style={{ color: '#C49A62' }}>—</span>
                  ) : diff === 0 ? (
                    <CheckCircle2 size={16} color="#5B8A2E" />
                  ) : (
                    <span className="font-bold text-[13px]" style={{ color: diff < 0 ? '#B60000' : '#5B8A2E' }}>
                      {diff > 0 ? '+' : ''}{diff}
                    </span>
                  )}
                </div>
              </div>
            )
          })}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 shrink-0" style={{ borderTop: '1.5px solid #E8D7C0' }}>
          <button disabled={counted === 0} className="w-full py-3 rounded-xl font-bold text-[14px] transition-all"
            style={{ background: counted === 0 ? '#C49A62' : '#8B4A1E', color: 'white', opacity: counted === 0 ? 0.6 : 1 }}>
            Simpan & Sinkronkan Stok ({counted} bahan)
          </button>
        </div>
      </div>
    </PageShell>
  )
}
