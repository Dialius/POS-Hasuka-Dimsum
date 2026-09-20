import { useState, useEffect } from 'react'
import { Plus, Package, Edit2, Loader2, Trash2, Search, RotateCw } from 'lucide-react'
import PageShell from './PageShell'
import { gasApi } from '../services/gasApi'
import { useApp, type Ingredient } from '../context/AppContext'
import { showToast } from './Alert'

export default function KelolaBahanBakuScreen({ onBack }: { onBack: () => void }) {
  const { ingredientsList, setIngredientsList, refreshData } = useApp()
  const [modalIng, setModalIng] = useState<Ingredient | null | undefined>(undefined)
  const [isSaving, setIsSaving] = useState(false)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [search, setSearch] = useState('')
  
  const [isDeleting, setIsDeleting] = useState(false)
  const [ingredientToDelete, setIngredientToDelete] = useState<Ingredient | null>(null)

  // Live fetch data saat halaman dibuka
  const handleRefresh = async () => {
    setIsRefreshing(true)
    try {
      await refreshData()
    } catch (e) {
      showToast({ variant: 'destructive', title: 'Gagal menyinkronkan bahan baku', description: 'Periksa koneksi internet Anda lalu coba lagi.' })
    } finally {
      setIsRefreshing(false)
    }
  }

  useEffect(() => {
    handleRefresh()
  }, [])

  const handleSave = async (ing: Ingredient) => {
    setIsSaving(true)
    try {
      await gasApi.saveIngredient(ing)
      setIngredientsList(prev => {
        const exists = prev.some(x => x.id === ing.id)
        return exists ? prev.map(x => x.id === ing.id ? ing : x) : [...prev, ing]
      })
      setModalIng(undefined)
      showToast({ variant: 'success', title: `Bahan baku ${ing.name} berhasil disimpan` })
    } catch (error) {
      showToast({
        variant: 'destructive',
        title: `Gagal menyimpan bahan baku ${ing.name}`,
        description: 'Periksa koneksi internet Anda lalu coba lagi.',
      })
    } finally {
      setIsSaving(false)
    }
  }

  const handleDelete = async () => {
    if (!ingredientToDelete) return
    setIsDeleting(true)
    try {
      await gasApi.deleteIngredient(ingredientToDelete.id)
      setIngredientsList(prev => prev.filter(x => x.id !== ingredientToDelete.id))
      showToast({ variant: 'success', title: `${ingredientToDelete.name} berhasil dihapus` })
      setIngredientToDelete(null)
    } catch (error) {
      showToast({
        variant: 'destructive',
        title: `Gagal menghapus ${ingredientToDelete.name}`,
        description: 'Periksa koneksi internet Anda lalu coba lagi.',
      })
    } finally {
      setIsDeleting(false)
    }
  }

  const filtered = ingredientsList.filter(i =>
    i.name.toLowerCase().includes(search.toLowerCase()) ||
    i.unit.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <>
    <PageShell
      title="Kelola Bahan Baku"
      subtitle="Master data bahan baku & kemasan (dikaitkan ke resep menu)"
      onBack={onBack}
      backLabel="Owner"
      headerRight={
        <div className="flex items-center gap-2">
          <button
            onClick={handleRefresh}
            disabled={isRefreshing}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[12px] font-bold border transition-all hover:bg-amber-100/50"
            style={{ background: '#F3E7CE', borderColor: '#C49A62', color: '#8B4A1E' }}
          >
            <RotateCw size={13} className={isRefreshing ? 'animate-spin' : ''} />
            <span className="hidden sm:inline">{isRefreshing ? 'Memuat...' : 'Refresh'}</span>
          </button>
          <button onClick={() => setModalIng(null)}
            className="flex items-center gap-1.5 px-3 sm:px-4 py-1.5 rounded-xl text-[12px] sm:text-[13px] font-bold transition-all shadow-sm active:scale-95"
            style={{ background: '#8B4A1E', color: 'white' }}>
            <Plus size={15} /> Tambah Bahan
          </button>
        </div>
      }
    >
      <div className="flex flex-col h-full bg-[#FAF6ED]">
        {/* Search & Filter bar */}
        <div className="px-5 py-3 shrink-0 flex items-center justify-between gap-3 bg-white" style={{ borderBottom: '1px solid #E8D7C0' }}>
          <div className="relative flex-1 max-w-sm">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: '#6B5448' }} />
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Cari nama bahan / satuan..."
              className="w-full pl-8 pr-3 py-2 rounded-xl text-[12px] outline-none"
              style={{ background: '#FAF6ED', border: '1.5px solid #E8D7C0', color: '#2B1810' }}
            />
          </div>
          <span className="text-[12px] font-bold" style={{ color: '#6B5448' }}>
            Total: {filtered.length} bahan
          </span>
        </div>

        <div className="flex-1 overflow-y-auto custom-scrollbar p-5 space-y-3">
          {isRefreshing && filtered.length === 0 ? (
            // Skeleton loading saat data pertama kali dimuat
            Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="rounded-2xl p-4 flex items-center justify-between animate-pulse" style={{ background: 'white', border: '1px solid #E8D7C0' }}>
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-xl" style={{ background: '#E8D7C0' }} />
                  <div className="space-y-2">
                    <div className="h-3.5 rounded-full w-36" style={{ background: '#E8D7C0' }} />
                    <div className="h-3 rounded-full w-24" style={{ background: '#E8D7C0' }} />
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-10 h-10 rounded-xl" style={{ background: '#E8D7C0' }} />
                  <div className="w-10 h-10 rounded-xl" style={{ background: '#E8D7C0' }} />
                </div>
              </div>
            ))
          ) : filtered.length === 0 && !search ? (
            <div className="text-center py-10">
              <Package size={40} className="mx-auto mb-3" style={{ color: '#E8D7C0' }} />
              <p className="text-[13px]" style={{ color: '#6B5448' }}>Belum ada bahan baku.</p>
            </div>
          ) : filtered.length === 0 && search ? (
            <div className="text-center py-10">
              <Package size={40} className="mx-auto mb-3" style={{ color: '#E8D7C0' }} />
              <p className="text-[13px]" style={{ color: '#6B5448' }}>Tidak ada bahan baku yang cocok.</p>
            </div>
          ) : filtered.map(ing => (
            <div key={ing.id} className="rounded-2xl p-4 flex items-center justify-between transition-shadow hover:shadow-md" style={{ background: 'white', border: '1px solid #E8D7C0' }}>
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl flex items-center justify-center shrink-0" style={{ background: '#F3E7CE' }}>
                  <Package size={24} color="#8B4A1E" />
                </div>
                <div>
                  <p className="font-bold text-[14px]" style={{ color: '#2B1810' }}>{ing.name}</p>
                  <div className="flex items-center gap-2 mt-1 flex-wrap">
                    <span className="text-[13px] font-bold" style={{ color: '#8B4A1E' }}>{ing.current_stock} {ing.unit}</span>
                    <span className="text-[11px]" style={{ color: '#6B5448' }}>• Min: {ing.min_stock_threshold || 10} {ing.unit}</span>
                    {!ing.is_tracked && (
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full" style={{ background: '#FCE8E8', color: '#B60000' }}>
                        TIDAK DILACAK (BEBAS)
                      </span>
                    )}
                  </div>
                </div>
              </div>
              
              <div className="flex items-center gap-2">
                <button onClick={() => setModalIng(ing)}
                  className="w-10 h-10 rounded-xl flex items-center justify-center transition-colors hover:bg-[#FAF6ED]"
                  style={{ border: '1.5px solid #E8D7C0', color: '#6B5448' }}>
                  <Edit2 size={16} />
                </button>
                <button onClick={() => setIngredientToDelete(ing)}
                  className="w-10 h-10 rounded-xl flex items-center justify-center transition-colors hover:bg-red-50"
                  style={{ border: '1.5px solid #FCE8E8', color: '#B60000' }}>
                  <Trash2 size={16} />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* MODAL KONFIRMASI HAPUS */}
      {ingredientToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'rgba(43,24,16,0.6)', backdropFilter: 'blur(4px)' }}>
          <div className="bg-white rounded-3xl p-6 max-w-sm w-full shadow-2xl border border-[#E8D7C0] text-center animate-fade-in">
            <div className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center mx-auto mb-4 text-[#B60000]">
              <Trash2 size={24} />
            </div>
            <h3 className="font-bold text-[18px] text-[#2B1810] mb-2">Hapus Bahan Baku?</h3>
            <p className="text-[13px] text-[#6B5448] mb-6 leading-relaxed">
              Apakah Anda yakin ingin menghapus bahan baku <strong>{ingredientToDelete.name}</strong>? Tindakan ini tidak dapat dibatalkan.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setIngredientToDelete(null)}
                disabled={isDeleting}
                className="flex-1 py-3 rounded-xl font-bold text-[14px] border border-[#E8D7C0] text-[#6B5448] hover:bg-gray-50 transition-colors"
              >
                Batal
              </button>
              <button
                onClick={handleDelete}
                disabled={isDeleting}
                className="flex-1 py-3 rounded-xl font-bold text-[14px] bg-[#B60000] text-white hover:bg-red-700 transition-colors flex items-center justify-center gap-2"
              >
                {isDeleting ? (
                  <>
                    <Loader2 size={16} className="animate-spin" />
                    <span>Menghapus...</span>
                  </>
                ) : (
                  'Hapus'
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </PageShell>
    {modalIng !== undefined && (
      <AddEditIngredientModal
        ingredient={modalIng}
        onSave={handleSave}
        onClose={() => setModalIng(undefined)}
        isSaving={isSaving}
      />
    )}
    </>
  )
}

function AddEditIngredientModal({ ingredient, onSave, onClose, isSaving }: { ingredient: Ingredient | null, onSave: (i: Ingredient) => void, onClose: () => void, isSaving: boolean }) {
  const { outletsList } = useApp()
  const isEdit = !!ingredient
  const [form, setForm] = useState<Omit<Ingredient, 'id'>>({
    name: '', unit: 'pcs', current_stock: 0, min_stock_threshold: 10, is_tracked: true, outlets: 'all'
  })

  // initialize properly with useEffect
  useEffect(() => {
    if (ingredient) setForm({ ...ingredient })
    else setForm({ name: '', unit: 'pcs', current_stock: 0, min_stock_threshold: 10, is_tracked: true, outlets: 'all' })
  }, [ingredient])

  const inputStyle = { background: 'white', border: '1.5px solid #E8D7C0', color: '#2B1810' }
  const set = (k: keyof typeof form, v: any) => setForm(p => ({ ...p, [k]: v }))

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'rgba(43,24,16,0.6)', backdropFilter: 'blur(4px)' }} onClick={onClose}>
      <div className="relative flex flex-col rounded-3xl shadow-2xl overflow-hidden w-full max-w-md" style={{ background: '#FAF6ED' }} onClick={e => e.stopPropagation()}>
        
        <div className="px-6 py-5" style={{ borderBottom: '1px solid #E8D7C0' }}>
          <h2 className="font-serif font-bold text-[18px]" style={{ color: '#2B1810' }}>
            {isEdit ? 'Edit Bahan Baku' : 'Tambah Bahan Baku'}
          </h2>
        </div>

        <div className="px-6 py-5 space-y-4">
          <div>
            <label className="block text-[11px] font-bold mb-1.5" style={{ color: '#6B5448' }}>NAMA BAHAN *</label>
            <input value={form.name} onChange={e => set('name', e.target.value)} className="w-full px-4 py-3 rounded-xl text-[14px] outline-none" style={inputStyle} placeholder="Mis: Tepung Terigu" />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[11px] font-bold mb-1.5" style={{ color: '#6B5448' }}>SATUAN (UNIT)</label>
              <input value={form.unit} onChange={e => set('unit', e.target.value)} className="w-full px-4 py-3 rounded-xl text-[14px] outline-none" style={inputStyle} placeholder="pcs, gram, porsi..." />
            </div>
            <div>
              <label className="block text-[11px] font-bold mb-1.5" style={{ color: '#6B5448' }}>STOK AWAL</label>
              <input type="number" value={form.current_stock} onChange={e => set('current_stock', parseInt(e.target.value) || 0)} className="w-full px-4 py-3 rounded-xl text-[14px] outline-none" style={inputStyle} />
            </div>
          </div>

          <div className="rounded-2xl p-4" style={{ background: 'white', border: '1px solid #E8D7C0' }}>
            <div className="flex items-center justify-between mb-2">
              <div>
                <p className="font-bold text-[14px]" style={{ color: '#2B1810' }}>Lacak Stok Otomatis</p>
                <p className="text-[11px]" style={{ color: '#6B5448' }}>Jika dimatikan, stok bahan tidak akan dipotong saat transaksi (cocok untuk saus/bumbu rahasia).</p>
              </div>
              <button onClick={() => set('is_tracked', !form.is_tracked)} className="transition-all">
                <div className="w-12 h-6 rounded-full relative transition-colors" style={{ background: form.is_tracked ? '#5B8A2E' : '#C49A62' }}>
                  <div className="w-5 h-5 bg-white rounded-full absolute top-0.5 transition-all" style={{ left: form.is_tracked ? '26px' : '2px' }} />
                </div>
              </button>
            </div>
          </div>

          <div className="rounded-2xl p-4" style={{ background: 'white', border: '1px solid #E8D7C0' }}>
            <label className="block text-[11px] font-bold mb-3" style={{ color: '#6B5448' }}>TERSEDIA DI CABANG</label>
            <div className="space-y-3">
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="radio" name="outletsTypeIng" checked={form.outlets === 'all' || !form.outlets} onChange={() => set('outlets', 'all')} className="accent-[#8B4A1E]" />
                <span className="text-[13px] font-bold" style={{ color: '#2B1810' }}>Semua Cabang</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="radio" name="outletsTypeIng" checked={Array.isArray(form.outlets)} onChange={() => set('outlets', outletsList.map(o => o.id))} className="accent-[#8B4A1E]" />
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
                            set('outlets', next.length === 0 ? 'all' : next)
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
        </div>

        <div className="px-6 py-4 flex gap-3" style={{ borderTop: '1px solid #E8D7C0' }}>
          <button onClick={onClose} disabled={isSaving} className="flex-1 py-3 rounded-xl font-bold text-[14px] disabled:opacity-50"
            style={{ background: 'white', color: '#6B5448', border: '1.5px solid #E8D7C0' }}>Batal</button>
          <button onClick={() => { if(form.name.trim()) onSave({ ...form, id: ingredient?.id ?? Date.now() }) }} 
            disabled={isSaving} className="flex-1 py-3 rounded-xl font-bold text-[14px] flex items-center justify-center gap-2 disabled:opacity-50"
            style={{ background: '#8B4A1E', color: 'white' }}>
            {isSaving ? <Loader2 size={16} className="animate-spin" /> : null}
            {isSaving ? 'Menyimpan...' : 'Simpan'}
          </button>
        </div>
      </div>
    </div>
  )
}
