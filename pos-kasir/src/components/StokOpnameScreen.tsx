import { useState, useEffect } from 'react'
import { Search, Plus, Minus, AlertTriangle, CheckCircle2, Eye, EyeOff, RotateCw } from 'lucide-react'
import PageShell from './PageShell'
import { useApp, type Ingredient } from '../context/AppContext'
import { gasApi } from '../services/gasApi'
import { showToast } from './Alert'
import { Button } from './common/Button'

type OpnameRow = Ingredient & { physical: number | null }

const toRows = (ings: Ingredient[]): OpnameRow[] =>
  ings.map(i => ({ ...i, physical: null }))

export default function StokOpnameScreen({ onBack, backLabel, onNavigate }: { onBack: () => void; backLabel?: string; onNavigate?: (s: string) => void }) {
  const { outlet, kasirInfo, ingredientsList, outletsList, refreshData, setIngredientsList } = useApp()
  const isOwner = kasirInfo?.role === 'owner' || backLabel === 'Owner'
  const [selectedBranch, setSelectedBranch] = useState<string>(isOwner ? 'all' : (outlet?.id || 'all'))
  const [isRefreshing, setIsRefreshing] = useState(false)
  
  // Filter bahan baku yang berlaku untuk cabang yang dipilih
  const applicableIngredients = ingredientsList.filter(i => {
    if (selectedBranch === 'all') return true
    if (!i.outlets || i.outlets === 'all') return true
    if (Array.isArray(i.outlets) && i.outlets.includes(selectedBranch)) return true
    if (typeof i.outlets === 'string' && (i.outlets as string).split(',').map(s => s.trim()).includes(selectedBranch)) return true
    return false
  })

  const [rows, setRows] = useState<OpnameRow[]>(toRows(applicableIngredients))
  const [search, setSearch] = useState('')
  const [showUntracked, setShowUntracked] = useState(false)
  const [isSaving, setIsSaving] = useState(false)

  // Sync rows jika daftar bahan baku di AppContext atau cabang berubah
  useEffect(() => {
    setRows(toRows(applicableIngredients))
  }, [ingredientsList, selectedBranch])

  // Auto fetch data live dari Google Sheets saat layar dibuka
  const handleRefresh = async () => {
    setIsRefreshing(true)
    try {
      await refreshData(selectedBranch === 'all' ? undefined : selectedBranch)
      showToast({ variant: 'success', title: 'Data stok bahan berhasil disinkronkan dari database.' })
    } catch (err) {
      showToast({ variant: 'destructive', title: 'Gagal memuat data live', description: String(err) })
    } finally {
      setIsRefreshing(false)
    }
  }

  useEffect(() => {
    handleRefresh()
  }, [selectedBranch])

  const update = (id: number, val: number | null) =>
    setRows(prev => prev.map(r => r.id === id ? { ...r, physical: val !== null && val < 0 ? 0 : val } : r))

  const visible = rows.filter(r =>
    (showUntracked || r.is_tracked) &&
    r.name.toLowerCase().includes(search.toLowerCase())
  )

  const tracked = rows.filter(r => r.is_tracked)
  const counted = tracked.filter(r => r.physical !== null).length
  const diffs = tracked.filter(r => r.physical !== null && r.physical !== r.current_stock)

  const handleSave = async () => {
    if (counted === 0) return
    setIsSaving(true)
    
    try {
      const itemsToSave = tracked
        .filter(r => r.physical !== null)
        .map(r => ({
          ingredient_id: r.id,
          system_stock: r.current_stock,
          physical_count: r.physical!,
          notes: ''
        }))
        
      const res = await gasApi.saveStockOpname(
        itemsToSave,
        kasirInfo?.name || (isOwner ? 'Owner' : 'Kasir'),
        selectedBranch === 'all' ? undefined : selectedBranch
      )
      if (res.status === 'success') {
        // Segera perbarui state lokal dengan hasil hitung fisik terbaru
        setIngredientsList(prev => prev.map(ing => {
          const matched = itemsToSave.find(it => it.ingredient_id === ing.id)
          return matched ? { ...ing, current_stock: matched.physical_count } : ing
        }))
        // Perbarui baris lokal agar stok sistem sinkron dan input fisik ter-reset
        setRows(prev => prev.map(r => {
          const matched = itemsToSave.find(it => it.ingredient_id === r.id)
          return matched ? { ...r, current_stock: matched.physical_count, physical: null } : r
        }))
        showToast({ variant: 'success', title: `Stok opname ${itemsToSave.length} item berhasil diselaraskan.` })
        refreshData(selectedBranch === 'all' ? undefined : selectedBranch).catch(() => {})
      } else {
        throw new Error(res.message || 'Unknown error')
      }
    } catch (e: any) {
      showToast({
        variant: 'destructive',
        title: 'Gagal menyimpan stok opname',
        description: e?.message || 'Terjadi kesalahan',
        actionLabel: 'Coba Lagi',
        onAction: handleSave,
      })
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <>
    <PageShell
      title="Stok Opname"
      subtitle="Hitung fisik bahan"
      onBack={onBack}
      backLabel={backLabel}
      onNavigate={onNavigate}
      activeNav="stokOpname"
      headerRight={
        <div className="flex items-center gap-2">
          {isOwner && outletsList.length > 0 && (
            <select
              value={selectedBranch}
              onChange={e => setSelectedBranch(e.target.value)}
              className="px-3 py-2 rounded-xl text-[12px] font-bold outline-none border cursor-pointer"
              style={{ background: '#F3E7CE', borderColor: '#C49A62', color: '#2B1810' }}
            >
              <option value="all">Gudang Pusat (Master)</option>
              {outletsList.map(o => (
                <option key={o.id} value={o.id}>{o.name.replace('Hasuka Dimsum — ', '')}</option>
              ))}
            </select>
          )}
          <Button
            onClick={handleRefresh}
            disabled={isRefreshing}
            variant="secondary"
            size="sm"
            icon={<RotateCw size={13} className={isRefreshing ? 'animate-spin' : ''} />}
            className="px-3 md:px-4 py-2 rounded-xl text-[12px] font-bold"
          >
            <span className="hidden md:inline">{isRefreshing ? 'Memuat...' : 'Refresh'}</span>
          </Button>
        </div>
      }
    >
      <div className="flex flex-col h-full">

        {/* Progress bar */}
        <div className="px-4 md:px-6 py-3 md:py-4 shrink-0" style={{ background: '#F3E7CE', borderBottom: '1px solid #E8D7C0' }}>
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] md:text-[12px] font-semibold text-[#6B5448]">Progress Audit</span>
            <div className="flex items-center gap-2">
              {diffs.length > 0 && (
                <span className="flex items-center gap-1 text-[10px] md:text-[11px] font-bold text-[#B60000]">
                  <AlertTriangle size={12} /> {diffs.length} selisih
                </span>
              )}
              <span className="text-[11px] md:text-[12px] font-bold text-[#8B4A1E]">{counted}/{tracked.length}</span>
            </div>
          </div>
          <div className="h-2 rounded-full overflow-hidden bg-[#E8D7C0]">
            <div className="h-full rounded-full transition-all duration-500"
              style={{ width: `${tracked.length > 0 ? (counted / tracked.length) * 100 : 0}%`, background: 'linear-gradient(to right, #8B4A1E, #C49A62)' }} />
          </div>
        </div>

        {/* Search + toggle untracked */}
        <div className="px-4 md:px-6 py-3 md:py-4 shrink-0 border-b border-[#E8D7C0]">
          <div className="relative mb-2">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#6B5448]" />
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Cari bahan..."
              className="w-full pl-9 pr-4 py-2 rounded-xl text-[12px] md:text-[13px] outline-none"
              style={{ background: 'white', border: '1.5px solid #E8D7C0', color: '#2B1810' }}
              onFocus={e => e.currentTarget.style.borderColor = '#8B4A1E'}
              onBlur={e => e.currentTarget.style.borderColor = '#E8D7C0'} />
          </div>
          <Button onClick={() => setShowUntracked(v => !v)}
            variant="ghost"
            size="sm"
            icon={showUntracked ? <Eye size={13} /> : <EyeOff size={13} />}
            className="text-[11px] font-bold"
            style={{ color: showUntracked ? '#8B4A1E' : '#C49A62' }}
          >
            {showUntracked ? 'Sembunyikan' : 'Tampilkan'} tidak dilacak
          </Button>
        </div>

        {/* ── Mobile Card View (< md) ── */}
        <div className="flex-1 md:hidden overflow-y-auto custom-scrollbar p-3 space-y-2.5">
          {visible.map((r) => {
            const diff = r.physical !== null ? r.physical - r.current_stock : null
            const hasDiff = diff !== null && diff !== 0
            const isUntracked = !r.is_tracked
            return (
              <div
                key={r.id}
                className="rounded-xl p-3.5 border shadow-sm flex flex-col gap-2.5"
                style={{
                  borderColor: isUntracked ? '#E8D7C0' : hasDiff ? (diff! < 0 ? '#F8B4B4' : '#B7E4C7') : '#E8D7C0',
                  background: isUntracked ? '#FAF6ED' : hasDiff ? (diff! < 0 ? '#FFF5F5' : '#F4FBF4') : 'white'
                }}
              >
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <h4 className="font-bold text-[13px] text-[#2B1810] leading-snug">{r.name}</h4>
                    <span className="text-[10px] text-[#8B4A1E] font-medium">{r.unit}{isUntracked ? ' · tidak dilacak' : ''}</span>
                  </div>
                  <div className="text-right">
                    <span className="text-[9px] font-bold uppercase text-[#6B5448] block">Sistem</span>
                    <span className="font-bold text-[13px] text-[#2B1810]">
                      {isUntracked ? '—' : r.current_stock}
                    </span>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-2 border-t border-[#E8D7C060]">
                  <div className="flex items-center gap-2">
                    <span className="text-[11px] font-semibold text-[#6B5448]">Fisik:</span>
                    {isUntracked ? (
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-[#F3E7CE] text-[#C49A62]">Skip</span>
                    ) : r.physical === null ? (
                      <button
                        onClick={() => update(r.id, r.current_stock)}
                        className="px-3 py-1 rounded-lg text-[11px] font-bold bg-[#F3E7CE] text-[#8B4A1E] border border-[#C49A62] active:scale-95 transition-all"
                      >
                        + Hitung
                      </button>
                    ) : (
                      <div className="flex items-center rounded-xl overflow-hidden border border-[#8B4A1E]" style={{ height: 32 }}>
                        <button
                          onClick={() => update(r.id, Math.max(0, (r.physical ?? 0) - 1))}
                          className="w-8 h-full flex items-center justify-center bg-[#F3E7CE] text-[#8B4A1E] active:bg-[#E8D7C0]"
                        >
                          <Minus size={12} strokeWidth={3} />
                        </button>
                        <input
                          type="number"
                          value={r.physical}
                          onChange={e => { const v = parseInt(e.target.value); update(r.id, isNaN(v) ? 0 : v) }}
                          className="w-12 text-center font-extrabold text-[13px] outline-none h-full bg-white text-[#2B1810]"
                        />
                        <button
                          onClick={() => update(r.id, (r.physical ?? 0) + 1)}
                          className="w-8 h-full flex items-center justify-center bg-[#8B4A1E] text-white active:bg-[#703B18]"
                        >
                          <Plus size={12} strokeWidth={3} />
                        </button>
                      </div>
                    )}
                  </div>

                  <div>
                    {isUntracked || diff === null ? (
                      <span className="text-[11px] text-[#C49A62]">—</span>
                    ) : diff === 0 ? (
                      <span className="inline-flex items-center gap-1 text-[11px] font-bold text-[#5B8A2E] bg-[#EAF4E0] px-2 py-0.5 rounded-md">
                        <CheckCircle2 size={12} /> Cocok
                      </span>
                    ) : (
                      <span
                        className={`inline-flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-md ${
                          diff < 0 ? 'bg-[#FDE8E8] text-[#B60000]' : 'bg-[#EAF4E0] text-[#5B8A2E]'
                        }`}
                      >
                        {diff > 0 ? `+${diff}` : diff}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            )
          })}
        </div>

        {/* ── Tablet & Desktop Table View (md+) ── */}
        <div className="hidden md:flex flex-col flex-1 overflow-hidden">
          {/* Table header */}
          <div className="grid grid-cols-12 px-6 py-2.5 text-[11px] font-bold shrink-0 text-[#6B5448] border-b border-[#E8D7C0] bg-[#FAF6ED] tracking-wide">
            <span className="col-span-5">BAHAN</span>
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
                    <p className="font-semibold text-[13px] leading-snug truncate text-[#2B1810]">{r.name}</p>
                    <p className="text-[11px] text-[#C49A62]">
                      {r.unit}{isUntracked ? ' · tidak dilacak' : ''}
                    </p>
                  </div>

                  {/* System stock */}
                  <div className="col-span-2 text-center">
                    {isUntracked
                      ? <span className="text-[11px] text-[#C49A62]">—</span>
                      : <span className="font-bold text-[15px] text-[#6B5448]">{r.current_stock}</span>
                    }
                  </div>

                  {/* Physical stepper */}
                  <div className="col-span-3 flex items-center justify-center">
                    {isUntracked ? (
                      <span className="text-[10px] px-2 py-1 rounded-full bg-[#F3E7CE] text-[#C49A62]">Skip</span>
                    ) : r.physical === null ? (
                      <Button onClick={() => update(r.id, r.current_stock)}
                        variant="secondary"
                        size="sm"
                        className="text-[11px] font-bold px-4 py-2 rounded-full"
                      >
                        + Hitung
                      </Button>
                    ) : (
                      <div className="flex items-center rounded-xl overflow-hidden border border-[#8B4A1E]" style={{ height: 34 }}>
                        <button onClick={() => update(r.id, Math.max(0, (r.physical ?? 0) - 1))}
                          className="w-8 h-full flex items-center justify-center transition-colors text-[#8B4A1E] bg-[#F3E7CE]">
                          <Minus size={12} strokeWidth={3} />
                        </button>
                        <input type="number" value={r.physical}
                          onChange={e => { const v = parseInt(e.target.value); update(r.id, isNaN(v) ? 0 : v) }}
                          className="w-12 text-center font-extrabold text-[13px] outline-none h-full text-[#2B1810] bg-white" />
                        <button onClick={() => update(r.id, (r.physical ?? 0) + 1)}
                          className="w-8 h-full flex items-center justify-center bg-[#8B4A1E] text-white">
                          <Plus size={12} strokeWidth={3} />
                        </button>
                      </div>
                    )}
                  </div>

                  {/* Diff */}
                  <div className="col-span-2 flex items-center justify-center gap-1">
                    {isUntracked || diff === null ? (
                      <span className="text-[11px] text-[#C49A62]">—</span>
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
        </div>

        {/* Footer */}
        <div className="px-4 md:px-6 py-3.5 md:py-4 shrink-0 border-t border-[#E8D7C0]">
          <Button 
            disabled={counted === 0} 
            loading={isSaving}
            onClick={handleSave}
            variant="primary"
            fullWidth
            className="py-3 md:py-3.5 rounded-xl font-bold text-[14px]"
          >
            {isSaving ? 'Menyesuaikan stok...' : `Simpan Stok (${counted})`}
          </Button>
        </div>
      </div>
    </PageShell>
    </>
  )
}
