import { useState, useEffect } from 'react'
import { Plus, Package, Edit2, Trash2, Search, RotateCw } from 'lucide-react'
import PageShell from './PageShell'
import { gasApi } from '../services/gasApi'
import { useApp, type Ingredient } from '../context/AppContext'
import { showToast } from './Alert'
import { Button } from './common/Button'
import { ConfirmDialog } from './common/ConfirmDialog'
import { DataTable, type Column } from './common/DataTable'

export default function KelolaBahanBakuScreen({ onBack, onNavigate }: { onBack: () => void; onNavigate?: (s: string) => void }) {
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

  const columns: Column[] = [
    {
      key: 'name',
      label: 'BAHAN',
      sortable: true,
      render: (ing: Ingredient) => (
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl flex items-center justify-center shrink-0" style={{ background: '#F3E7CE' }}>
            <Package size={24} color="#8B4A1E" />
          </div>
          <div>
            <p className="font-bold text-[14px]" style={{ color: '#2B1810' }}>{ing.name}</p>
            <span className="text-[11px]" style={{ color: '#6B5448' }}>Satuan: {ing.unit}</span>
          </div>
        </div>
      )
    },
    {
      key: 'current_stock',
      label: 'STOK',
      sortable: true,
      render: (ing: Ingredient) => (
        <div>
          <span className="text-[13px] font-bold" style={{ color: '#8B4A1E' }}>{ing.current_stock} {ing.unit}</span>
          <p className="text-[11px]" style={{ color: '#6B5448' }}>Min: {ing.min_stock_threshold || 10}</p>
        </div>
      )
    },
    {
      key: 'is_tracked',
      label: 'STATUS',
      render: (ing: Ingredient) => 
        ing.is_tracked ? (
          <span className="text-[11px] font-bold px-2 py-1 rounded-full" style={{ background: '#EAF4E0', color: '#5B8A2E' }}>
            DILACAK
          </span>
        ) : (
          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full" style={{ background: '#FCE8E8', color: '#B60000' }}>
            TIDAK DILACAK
          </span>
        )
    },
    {
      key: 'actions',
      label: 'AKSI',
      render: (ing: Ingredient) => (
        <div className="flex items-center gap-2">
          <Button onClick={() => setModalIng(ing)}
            variant="ghost"
            size="sm"
            icon={<Edit2 size={16} />}
            className="w-10 h-10 p-0 rounded-xl border border-[#E8D7C0]"
          />
          <Button onClick={() => setIngredientToDelete(ing)}
            variant="destructive"
            size="sm"
            icon={<Trash2 size={16} />}
            className="w-10 h-10 p-0 rounded-xl"
          />
        </div>
      )
    }
  ]

  return (
    <>
    <PageShell
      title="Kelola Bahan Baku"
      subtitle="Data bahan dikaitkan ke resep"
      onBack={onBack}
      backLabel="Owner"
      onNavigate={onNavigate}
      activeNav="kelolaBahanBaku"
      headerRight={
        <div className="flex items-center gap-2">
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
          <Button onClick={() => setModalIng(null)}
            variant="primary"
            size="sm"
            icon={<Plus size={15} />}
            className="px-3 md:px-4 py-2 rounded-xl text-[12px] md:text-[13px] font-bold shadow-sm"
          >
            Tambah Bahan
          </Button>
        </div>
      }
    >
      <div className="flex flex-col h-full bg-[#FAF6ED]">
        {/* Search bar */}
        <div className="px-6 py-4 shrink-0 flex items-center justify-between gap-4 bg-white" style={{ borderBottom: '1px solid #E8D7C0' }}>
          <div className="relative flex-1 max-w-sm">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: '#6B5448' }} />
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Cari bahan..."
              className="w-full pl-8 pr-3 py-2 rounded-xl text-[12px] outline-none"
              style={{ background: '#FAF6ED', border: '1.5px solid #E8D7C0', color: '#2B1810' }}
            />
          </div>
          <span className="text-[12px] font-bold" style={{ color: '#6B5448' }}>
            Total: {filtered.length} bahan
          </span>
        </div>

        <div className="flex-1 overflow-hidden p-6">
          <DataTable
            columns={columns}
            data={filtered}
            isLoading={isRefreshing && filtered.length === 0}
            emptyState={{
              title: search ? 'Tidak ada bahan baku yang cocok' : 'Belum ada bahan baku',
              description: search ? 'Coba kata kunci lain' : 'Klik "Tambah Bahan" untuk memulai',
              action: !search ? { label: 'Tambah Bahan', onClick: () => setModalIng(null) } : undefined
            }}
          />
        </div>
      </div>

      <ConfirmDialog
        isOpen={!!ingredientToDelete}
        variant="destructive"
        title="Hapus Bahan Baku?"
        description={`Bahan baku ${ingredientToDelete?.name} akan dihapus dari semua resep yang menggunakannya. Tindakan ini tidak dapat dibatalkan.`}
        confirmLabel={isDeleting ? 'Menghapus...' : 'Hapus'}
        onConfirm={handleDelete}
        onCancel={() => setIngredientToDelete(null)}
      />
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
    <div className="fixed inset-0 z-50 flex items-end md:items-center justify-center p-0 md:p-4" style={{ background: 'rgba(43,24,16,0.6)', backdropFilter: 'blur(4px)' }} onClick={onClose}>
      <div className="relative flex flex-col rounded-t-3xl md:rounded-3xl shadow-2xl overflow-hidden w-full md:max-w-md max-h-[92vh]" style={{ background: '#FAF6ED' }} onClick={e => e.stopPropagation()}>
        
        <div className="px-5 md:px-6 py-4 md:py-6 shrink-0" style={{ borderBottom: '1px solid #E8D7C0' }}>
          <h2 className="font-serif font-bold text-[18px]" style={{ color: '#2B1810' }}>
            {isEdit ? 'Edit Bahan Baku' : 'Tambah Bahan Baku'}
          </h2>
        </div>

        <div className="px-5 md:px-6 py-4 md:py-6 space-y-4 overflow-y-auto custom-scrollbar flex-1">
          <div>
            <label className="block text-[11px] font-bold mb-2" style={{ color: '#6B5448' }}>NAMA BAHAN *</label>
            <input value={form.name} onChange={e => set('name', e.target.value)} className="w-full px-4 py-4 rounded-xl text-[14px] outline-none" style={inputStyle} placeholder="Mis: Tepung Terigu" />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-[11px] font-bold mb-2" style={{ color: '#6B5448' }}>SATUAN (UNIT)</label>
              <input value={form.unit} onChange={e => set('unit', e.target.value)} className="w-full px-4 py-4 rounded-xl text-[14px] outline-none" style={inputStyle} placeholder="pcs, gram, porsi..." />
            </div>
            <div>
              <label className="block text-[11px] font-bold mb-2" style={{ color: '#6B5448' }}>STOK AWAL</label>
              <input type="number" value={form.current_stock} onChange={e => set('current_stock', parseInt(e.target.value) || 0)} className="w-full px-4 py-4 rounded-xl text-[14px] outline-none" style={inputStyle} />
            </div>
          </div>

          <div className="rounded-2xl p-4" style={{ background: 'white', border: '1px solid #E8D7C0' }}>
            <div className="flex items-center justify-between mb-2">
              <div>
                <p className="font-bold text-[14px]" style={{ color: '#2B1810' }}>Lacak Stok</p>
                <p className="text-[11px]" style={{ color: '#6B5448' }}>Stok tidak dipotong saat transaksi (saus/bumbu).</p>
              </div>
              <button onClick={() => set('is_tracked', !form.is_tracked)} className="transition-all">
                <div className="w-12 h-6 rounded-full relative transition-colors" style={{ background: form.is_tracked ? '#5B8A2E' : '#C49A62' }}>
                  <div className="w-5 h-5 bg-white rounded-full absolute top-0.5 transition-all" style={{ left: form.is_tracked ? '26px' : '2px' }} />
                </div>
              </button>
            </div>
          </div>

          <div className="rounded-2xl p-4" style={{ background: 'white', border: '1px solid #E8D7C0' }}>
            <label className="block text-[11px] font-bold mb-4" style={{ color: '#6B5448' }}>TERSEDIA DI CABANG</label>
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

        <div className="px-6 py-4 flex gap-4" style={{ borderTop: '1px solid #E8D7C0' }}>
          <Button onClick={onClose} disabled={isSaving} variant="secondary" className="flex-1 py-4 rounded-xl font-bold text-[14px]">
            Batal
          </Button>
          <Button onClick={() => { if(form.name.trim()) onSave({ ...form, id: ingredient?.id ?? Date.now() }) }} 
            loading={isSaving}
            variant="primary"
            className="flex-1 py-4 rounded-xl font-bold text-[14px]"
          >
            {isSaving ? 'Menyimpan...' : 'Simpan'}
          </Button>
        </div>
      </div>
    </div>
  )
}
