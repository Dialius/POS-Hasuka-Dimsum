import { useState } from 'react'
import { ChevronRight, Plus, Trash2, ChefHat, AlertCircle } from 'lucide-react'
import PageShell from './PageShell'
import { useApp, type Product, type Recipe } from '../context/AppContext'
import { gasApi } from '../services/gasApi'
import { showToast } from './Alert'
import { Button } from './common/Button'
import { ConfirmDialog } from './common/ConfirmDialog'
import { fmt } from '../utils/formatters'


// Row yang sedang diedit di form resep
interface RecipeRow {
  localId: number       // ID sementara di UI, bukan ID di DB
  ingredient_id: number
  qty_per_unit: number
}

export default function KelolaResepScreen({ onBack, onNavigate }: { onBack: () => void; onNavigate?: (s: string) => void }) {
  const { productsList, recipesList, setRecipesList, ingredientsList } = useApp()
  const recipeProducts = productsList.filter(p => p.stock_mode === 'recipe')
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null)

  // Rows yang sedang diedit untuk produk terpilih
  const [editRows, setEditRows] = useState<RecipeRow[]>([])
  const [isDirty, setIsDirty] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [productToDelete, setProductToDelete] = useState<Product | null>(null)

  const selectProduct = (p: Product) => {
    const existing = recipesList
      .filter(r => r.product_id === p.id)
      .map(r => ({ localId: r.id, ingredient_id: r.ingredient_id, qty_per_unit: r.qty_per_unit }))
    setEditRows(existing)
    setIsDirty(false)
  }

  const addRow = () => {
    // Pilih ingredient yang belum dipakai di resep ini
    const usedIds = editRows.map(r => r.ingredient_id)
    const firstUnused = ingredientsList.find(i => !usedIds.includes(i.id))
    setEditRows(prev => [...prev, {
      localId: Date.now(),
      ingredient_id: firstUnused?.id ?? (ingredientsList[0]?.id || 0),
      qty_per_unit: 1,
    }])
    setIsDirty(true)
  }

  const updateRow = (localId: number, field: 'ingredient_id' | 'qty_per_unit', val: number) => {
    setEditRows(prev => prev.map(r => r.localId === localId ? { ...r, [field]: val } : r))
    setIsDirty(true)
  }

  const deleteRow = (localId: number) => {
    setEditRows(prev => prev.filter(r => r.localId !== localId))
    setIsDirty(true)
  }

  const handleDeleteRecipe = async () => {
    if (!productToDelete) return
    try {
      await gasApi.saveRecipe(productToDelete.id, [])
      setRecipesList(prev => prev.filter(r => r.product_id !== productToDelete.id))
      if (selectedProduct?.id === productToDelete.id) {
        setSelectedProduct(null)
        setEditRows([])
      }
      showToast({ variant: 'success', title: `Resep ${productToDelete.name} berhasil dihapus` })
      setProductToDelete(null)
    } catch (error) {
      showToast({
        variant: 'destructive',
        title: `Gagal menghapus resep ${productToDelete.name}`,
        description: 'Periksa koneksi internet Anda lalu coba lagi.',
      })
    }
  }

  const saveRecipe = async () => {
    if (!selectedProduct) return
    setIsSaving(true)
    // Buang semua resep lama untuk produk ini, ganti dengan editRows
    const kept = recipesList.filter(r => r.product_id !== selectedProduct.id)
    const newRows: Recipe[] = editRows.map((r, idx) => ({
      id: Date.now() + idx,
      product_id: selectedProduct.id,
      ingredient_id: r.ingredient_id,
      qty_per_unit: r.qty_per_unit,
    }))
    setRecipesList([...kept, ...newRows])
    setIsDirty(false)

    try {
      await gasApi.saveRecipe(
        selectedProduct.id,
        editRows.map(r => ({ ingredient_id: r.ingredient_id, qty_per_unit: r.qty_per_unit }))
      )
      showToast({ variant: 'success', title: `Resep produk ${selectedProduct.name} berhasil disimpan ke Google Sheets` })
    } catch (err) {
      console.warn('Gagal simpan resep ke Google Sheets:', err)
      showToast({
        variant: 'destructive',
        title: 'Gagal menyimpan resep ke Google Sheets',
        description: err instanceof Error ? err.message : 'Periksa koneksi lalu coba lagi.',
        actionLabel: 'Coba Lagi',
        onAction: saveRecipe,
      })
    } finally {
      setIsSaving(false)
    }
  }

  // Cek apakah ingredient sudah dipilih di baris lain (untuk validasi duplikat)
  const usedIngredientIds = (excludeLocalId: number) =>
    editRows.filter(r => r.localId !== excludeLocalId).map(r => r.ingredient_id)

  return (
    <>
      <PageShell
      title="Kelola Resep"
      subtitle="Bahan per menu — stok terpotong otomatis"
      onBack={onBack}
      backLabel="Owner"
      onNavigate={onNavigate}
      activeNav="kelolaResep"
      rightPanelWidth={400}
      rightPanel={
        selectedProduct ? (
          <div className="flex flex-col h-full">
            {/* Selected product header */}
            <div className="px-6 py-4 shrink-0" style={{ borderBottom: '1px solid #E8D7C0', background: '#FAF6ED' }}>
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl overflow-hidden shrink-0" style={{ border: '2px solid #E8D7C0' }}>
                  <img src={selectedProduct.img} alt={selectedProduct.name} referrerPolicy="no-referrer" className="w-full h-full object-cover" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-bold text-[14px] truncate" style={{ color: '#2B1810' }}>{selectedProduct.name}</p>
                  <p className="text-[12px]" style={{ color: '#C49A62' }}>{fmt(selectedProduct.price)} · {selectedProduct.cat}</p>
                </div>
                <ChefHat size={20} color="#8B4A1E" />
              </div>
            </div>

            {/* Recipe rows */}
            <div className="flex-1 overflow-y-auto custom-scrollbar px-6 py-4 space-y-3">

              <p className="text-[12px] font-semibold" style={{ color: '#6B5448' }}>
                Per <b>1 porsi</b> terjual, bahan terpotong:
              </p>

              {editRows.length === 0 && (
                <div className="rounded-2xl p-6 text-center" style={{ border: '2px dashed #E8D7C0' }}>
                  <ChefHat size={28} color="#C49A62" className="mx-auto mb-2" />
                  <p className="text-[13px] font-semibold" style={{ color: '#6B5448' }}>Belum ada bahan baku</p>
                  <p className="text-[12px] mt-1" style={{ color: '#C49A62' }}>Klik "+ Tambah Bahan" di bawah untuk mulai</p>
                </div>
              )}

              {editRows.map(row => {
                const ing = ingredientsList.find(i => i.id === row.ingredient_id)
                const isDuplicate = usedIngredientIds(row.localId).includes(row.ingredient_id)
                return (
                  <div key={row.localId} className="rounded-2xl p-4" style={{ background: 'white', border: `1.5px solid ${isDuplicate ? '#B60000' : '#E8D7C0'}` }}>

                    {isDuplicate && (
                      <div className="flex items-center gap-2 mb-2 text-[11px] font-bold" style={{ color: '#B60000' }}>
                        <AlertCircle size={13} /> Bahan ini sudah ada di resep — hapus yang duplikat
                      </div>
                    )}

                    {/* Ingredient select */}
                    <div className="mb-3">
                      <label className="block text-[10px] font-bold mb-1.5" style={{ color: '#6B5448', letterSpacing: '0.06em' }}>BAHAN BAKU</label>
                      <div className="relative">
                        <select
                          value={row.ingredient_id}
                          onChange={e => updateRow(row.localId, 'ingredient_id', parseInt(e.target.value))}
                          className="w-full px-4 py-2.5 rounded-xl text-[13px] font-semibold outline-none appearance-none"
                          style={{ background: '#FAF6ED', border: '1.5px solid #E8D7C0', color: '#2B1810' }}>
                          {ingredientsList.map(ing => {
                            const usedIds = usedIngredientIds(row.localId)
                            return (
                              <option key={ing.id} value={ing.id} disabled={usedIds.includes(ing.id) && ing.id !== row.ingredient_id}>
                                {ing.name} ({ing.unit}) {!ing.is_tracked ? '· tidak dilacak' : ''}
                              </option>
                            )
                          })}
                        </select>
                        <ChevronRight size={14} className="absolute right-3 top-1/2 -translate-y-1/2 rotate-90 pointer-events-none" style={{ color: '#6B5448' }} />
                      </div>
                      {ing && !ing.is_tracked && (
                        <p className="text-[11px] mt-1 flex items-center gap-1" style={{ color: '#C49A62' }}>
                          <AlertCircle size={11} /> Bahan ini tidak dilacak — tidak akan dipotong saat transaksi (oke untuk saus, bumbu, dll)
                        </p>
                      )}
                    </div>

                    {/* Qty input + unit */}
                    <div className="flex items-end gap-4">
                      <div className="flex-1">
                        <label className="block text-[10px] font-bold mb-2" style={{ color: '#6B5448', letterSpacing: '0.06em' }}>
                          JUMLAH PER PORSI ({ing?.unit ?? '—'})
                        </label>
                        <div className="flex items-center rounded-xl overflow-hidden" style={{ border: '1.5px solid #8B4A1E', height: 40 }}>
                          <button onClick={() => updateRow(row.localId, 'qty_per_unit', Math.max(0.5, row.qty_per_unit - (row.qty_per_unit > 1 ? 1 : 0.5)))}
                            className="w-10 h-full flex items-center justify-center shrink-0"
                            style={{ background: '#F3E7CE', color: '#8B4A1E', fontWeight: 700, fontSize: 18 }}>−</button>
                          <input
                            type="number"
                            min={0.5}
                            step={0.5}
                            value={row.qty_per_unit}
                            onChange={e => updateRow(row.localId, 'qty_per_unit', Math.max(0.5, parseFloat(e.target.value) || 0.5))}
                            className="flex-1 text-center font-extrabold text-[15px] outline-none h-full"
                            style={{ color: '#2B1810', background: 'white' }} />
                          <button onClick={() => updateRow(row.localId, 'qty_per_unit', row.qty_per_unit + 1)}
                            className="w-10 h-full flex items-center justify-center shrink-0"
                            style={{ background: '#8B4A1E', color: 'white', fontWeight: 700, fontSize: 18 }}>+</button>
                        </div>
                      </div>
                      <Button onClick={() => deleteRow(row.localId)}
                        variant="destructive"
                        size="sm"
                        icon={<Trash2 size={15} />}
                        className="w-10 h-10 p-0 rounded-xl shrink-0"
                      />
                    </div>
                  </div>
                )
              })}

              {/* Add row button */}
              <Button onClick={addRow}
                variant="secondary"
                fullWidth
                icon={<Plus size={15} />}
                className="py-4 rounded-2xl font-bold text-[13px] border-2 border-dashed"
              >
                Tambah Bahan
              </Button>
            </div>

            {/* Save footer */}
            <div className="px-6 py-4 shrink-0" style={{ borderTop: '1.5px solid #E8D7C0' }}>
              {isDirty && (
                <p className="text-[11px] text-center mb-2" style={{ color: '#C9A227' }}>
                  Ada perubahan yang belum disimpan
                </p>
              )}
              <Button
                onClick={saveRecipe}
                disabled={editRows.some(r => usedIngredientIds(r.localId).includes(r.ingredient_id))}
                loading={isSaving}
                variant="primary"
                fullWidth
                className="py-4 rounded-xl font-bold text-[14px]"
                style={{
                  background: isDirty ? '#8B4A1E' : '#C49A62',
                }}
              >
                {isSaving ? 'Menyimpan ke Google Sheets...' : (isDirty ? 'Simpan Resep' : 'Tersimpan ✓')}
              </Button>
              {editRows.length > 0 && (
                <Button
                  onClick={() => setProductToDelete(selectedProduct)}
                  variant="destructive"
                  fullWidth
                  icon={<Trash2 size={15} />}
                  className="py-4 rounded-xl font-bold text-[13px] mt-2"
                >
                  Hapus Resep
                </Button>
              )}
            </div>
          </div>
        ) : (
          // Empty state — belum pilih produk
          <div className="flex flex-col items-center justify-center h-full px-8 text-center">
            <div className="w-16 h-16 rounded-full flex items-center justify-center mb-4" style={{ background: '#F3E7CE' }}>
              <ChefHat size={28} color="#8B4A1E" />
            </div>
            <p className="font-serif font-bold text-[16px] mb-2" style={{ color: '#2B1810' }}>Pilih Menu</p>
            <p className="text-[13px]" style={{ color: '#6B5448' }}>
              Pilih menu untuk lihat/ubah resep — bahan terpotong per transaksi.
            </p>
          </div>
        )
      }
    >
      {/* Left: product list */}
      <div className="flex flex-col h-full">
        <div className="px-6 py-4 shrink-0" style={{ borderBottom: '1px solid #E8D7C0', background: '#FAF6ED' }}>
          <p className="text-[12px]" style={{ color: '#6B5448' }}>
            Menu di bawah menggunakan mode <b>Berbasis Resep</b>. Klik untuk atur bahan bakunya.
          </p>
        </div>

        <div className="flex-1 overflow-y-auto custom-scrollbar p-6 space-y-3">
          {recipeProducts.length === 0 ? (
            <div className="text-center py-10">
              <ChefHat size={40} className="mx-auto mb-4" style={{ color: '#E8D7C0' }} />
              <p className="text-[13px]" style={{ color: '#6B5448' }}>Belum ada produk dengan mode stok "Berbasis Resep".</p>
            </div>
          ) : (
            recipeProducts.map((p, i) => {
              const isSelected = selectedProduct?.id === p.id
              const recipeCount = recipesList.filter(r => r.product_id === p.id).length
              return (
                <button key={p.id} onClick={() => selectProduct(p)}
                  className="w-full flex items-center gap-4 px-6 py-4 text-left transition-colors"
                  style={{
                    background: isSelected ? '#F3E7CE' : (i % 2 === 0 ? '#FAF6ED' : 'white'),
                    borderBottom: '1px solid #E8D7C080',
                    borderLeft: isSelected ? '3px solid #8B4A1E' : '3px solid transparent',
                  }}>
                  <div className="shrink-0 overflow-hidden" style={{ width: 48, height: 48, borderRadius: 12, border: isSelected ? '2px solid #8B4A1E' : '1.5px solid #E8D7C0' }}>
                    <img src={p.img} alt={p.name} referrerPolicy="no-referrer" className="w-full h-full object-cover" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-bold text-[13px] truncate" style={{ color: '#2B1810' }}>{p.name}</p>
                    <p className="text-[12px] mt-0.5" style={{ color: '#8B4A1E' }}>{fmt(p.price)}</p>
                  </div>
                  <div className="text-right shrink-0">
                    {recipeCount > 0 ? (
                      <>
                        <span className="text-[12px] font-bold" style={{ color: '#5B8A2E' }}>{recipeCount} bahan</span>
                        <p className="text-[10px]" style={{ color: '#C49A62' }}>resep ada</p>
                      </>
                    ) : (
                      <>
                        <span className="text-[11px] font-bold" style={{ color: '#B60000' }}>Belum</span>
                        <p className="text-[10px]" style={{ color: '#C49A62' }}>ada resep</p>
                      </>
                    )}
                  </div>
                </button>
              )
            })
          )}
        </div>
      </div>
    </PageShell>
    <ConfirmDialog
      isOpen={!!productToDelete}
      variant="destructive"
      title="Hapus Resep?"
      description={`Resep ${productToDelete?.name} akan dihapus. Stok tidak akan otomatis terpotong lagi saat menu ini terjual. Tindakan ini tidak dapat dibatalkan.`}
      confirmLabel="Hapus"
      onConfirm={handleDeleteRecipe}
      onCancel={() => setProductToDelete(null)}
    />
    </>
  )
}
