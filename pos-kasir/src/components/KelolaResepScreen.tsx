import { useState } from 'react'
import { ChevronRight, Plus, Trash2, ChefHat, AlertCircle, Loader2 } from 'lucide-react'
import PageShell from './PageShell'
import { useApp, type Product, type Recipe } from '../context/AppContext'
import { gasApi } from '../services/gasApi'
import { showToast } from './Alert'
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
  const [mobileTab, setMobileTab] = useState<'content' | 'panel'>('content')

  // Rows yang sedang diedit untuk produk terpilih
  const [editRows, setEditRows] = useState<RecipeRow[]>([])
  const [isDirty, setIsDirty] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [productToDelete, setProductToDelete] = useState<Product | null>(null)

  const selectProduct = (p: Product) => {
    setSelectedProduct(p)
    const existing = recipesList
      .filter(r => r.product_id === p.id)
      .map(r => ({ localId: r.id, ingredient_id: r.ingredient_id, qty_per_unit: r.qty_per_unit }))
    setEditRows(existing)
    setIsDirty(false)
    setMobileTab('panel')
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
        setMobileTab('content')
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
        rightPanelWidth={440}
        rightPanelTitle={selectedProduct ? `Resep: ${selectedProduct.name}` : 'Resep Bahan'}
        mobileTab={mobileTab}
        onMobileTabChange={setMobileTab}
        rightPanel={
          selectedProduct ? (
            <div className="flex flex-col h-full min-h-0 overflow-hidden">
              {/* Selected product header */}
              <div className="px-4 md:px-5 py-3 md:py-3.5 shrink-0 bg-[#FAF6ED] border-b border-[#E8D7C0]">
                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={() => setMobileTab('content')}
                    className="md:hidden p-1.5 rounded-xl text-[#8B4A1E] bg-[#E8D7C060] hover:bg-[#E8D7C0] transition-colors shrink-0"
                    title="Kembali ke Daftar Menu"
                  >
                    <ChevronRight size={18} className="rotate-180" />
                  </button>
                  <div className="w-11 h-11 md:w-12 md:h-12 rounded-xl overflow-hidden shrink-0 border-2 border-[#E8D7C0]">
                    <img src={selectedProduct.img} alt={selectedProduct.name} referrerPolicy="no-referrer" className="w-full h-full object-cover" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-bold text-[13px] md:text-[14px] truncate text-[#2B1810]">{selectedProduct.name}</p>
                    <p className="text-[11px] md:text-[12px] text-[#C49A62]">{fmt(selectedProduct.price)} · {selectedProduct.cat}</p>
                  </div>
                  <div className="w-8 h-8 rounded-full bg-white border border-[#E8D7C0] flex items-center justify-center shrink-0">
                    <ChefHat size={17} color="#8B4A1E" />
                  </div>
                </div>
              </div>

              {/* Recipe rows */}
              <div className="flex-1 min-h-0 overflow-y-auto custom-scrollbar px-3.5 md:px-5 py-3 md:py-4 space-y-3 pb-8">
                <p className="text-[11px] md:text-[12px] font-semibold text-[#6B5448]">
                  Untuk setiap <b>1 porsi</b> yang terjual, bahan berikut akan terpotong otomatis:
                </p>

                {editRows.length === 0 && (
                  <div className="rounded-2xl p-5 text-center border-2 border-dashed border-[#E8D7C0] bg-white/60">
                    <ChefHat size={28} color="#C49A62" className="mx-auto mb-2" />
                    <p className="text-[13px] font-semibold text-[#6B5448]">Belum ada bahan baku</p>
                    <p className="text-[12px] mt-1 text-[#C49A62]">Klik "+ Tambah Bahan" di bawah untuk mulai</p>
                  </div>
                )}

                {editRows.map((row, index) => {
                  const ing = ingredientsList.find(i => i.id === row.ingredient_id)
                  const isDuplicate = usedIngredientIds(row.localId).includes(row.ingredient_id)
                  return (
                    <div
                      key={row.localId}
                      className="rounded-2xl p-3.5 md:p-4 bg-white shadow-sm transition-all"
                      style={{ border: `1.5px solid ${isDuplicate ? '#B60000' : '#E8D7C0'}` }}
                    >
                      {/* Top label + duplicate badge */}
                      <div className="flex items-center justify-between gap-2 mb-1.5">
                        <span className="text-[10px] font-bold tracking-wider text-[#6B5448]">
                          BAHAN #{index + 1}
                        </span>
                        {isDuplicate && (
                          <div className="flex items-center gap-1 text-[11px] font-bold text-[#B60000]">
                            <AlertCircle size={13} /> Duplikat
                          </div>
                        )}
                      </div>

                      {/* Ingredient select */}
                      <div className="mb-2.5">
                        <div className="relative">
                          <select
                            value={row.ingredient_id}
                            onChange={e => updateRow(row.localId, 'ingredient_id', parseInt(e.target.value))}
                            className="w-full px-3 py-2 md:py-2.5 rounded-xl text-[12px] md:text-[13px] font-semibold outline-none appearance-none cursor-pointer pr-8"
                            style={{ background: '#FAF6ED', border: '1.5px solid #E8D7C0', color: '#2B1810' }}
                          >
                            {ingredientsList.map(ingItem => {
                              const usedIds = usedIngredientIds(row.localId)
                              return (
                                <option key={ingItem.id} value={ingItem.id} disabled={usedIds.includes(ingItem.id) && ingItem.id !== row.ingredient_id}>
                                  {ingItem.name} ({ingItem.unit}) {!ingItem.is_tracked ? '· tidak dilacak' : ''}
                                </option>
                              )
                            })}
                          </select>
                          <ChevronRight size={14} className="absolute right-3 top-1/2 -translate-y-1/2 rotate-90 pointer-events-none text-[#6B5448]" />
                        </div>
                        {ing && !ing.is_tracked && (
                          <p className="text-[11px] mt-1 flex items-center gap-1 text-[#C49A62]">
                            <AlertCircle size={11} className="shrink-0" /> Bahan ini tidak dilacak — tidak memotong stok
                          </p>
                        )}
                      </div>

                      {/* Qty input + unit + Delete button */}
                      <div>
                        <label className="block text-[10px] font-bold mb-1.5 text-[#6B5448] tracking-wider">
                          JUMLAH PER PORSI ({ing?.unit ?? '—'})
                        </label>
                        <div className="flex items-center gap-2.5">
                          <div className="flex-1 flex items-center rounded-xl overflow-hidden border-[1.5px] border-[#8B4A1E] h-10 bg-white">
                            <button
                              type="button"
                              onClick={() => updateRow(row.localId, 'qty_per_unit', Math.max(0.5, row.qty_per_unit - (row.qty_per_unit > 1 ? 1 : 0.5)))}
                              className="w-10 h-full flex items-center justify-center shrink-0 cursor-pointer bg-[#F3E7CE] text-[#8B4A1E] font-bold text-lg hover:bg-[#E8D7C0] active:opacity-80 transition-colors"
                            >
                              −
                            </button>
                            <input
                              type="number"
                              min={0.5}
                              step={0.5}
                              value={row.qty_per_unit}
                              onChange={e => updateRow(row.localId, 'qty_per_unit', Math.max(0.5, parseFloat(e.target.value) || 0.5))}
                              className="flex-1 text-center font-extrabold text-[14px] md:text-[15px] outline-none h-full text-[#2B1810] bg-transparent"
                            />
                            <button
                              type="button"
                              onClick={() => updateRow(row.localId, 'qty_per_unit', row.qty_per_unit + 1)}
                              className="w-10 h-full flex items-center justify-center shrink-0 cursor-pointer bg-[#8B4A1E] text-white font-bold text-lg hover:bg-[#723B17] active:opacity-80 transition-colors"
                            >
                              +
                            </button>
                          </div>
                          <button
                            type="button"
                            onClick={() => deleteRow(row.localId)}
                            className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0 transition-colors hover:bg-red-50 text-[#B60000] border border-[#FCE8E8] cursor-pointer"
                            title="Hapus Bahan"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </div>
                    </div>
                  )
                })}

                {/* Add row button */}
                <button
                  type="button"
                  onClick={addRow}
                  className="w-full py-3 rounded-2xl font-bold text-[13px] flex items-center justify-center gap-2 transition-all cursor-pointer bg-[#F3E7CE] text-[#8B4A1E] border-2 border-dashed border-[#C49A62] hover:bg-[#EADBC2] active:opacity-90"
                >
                  <Plus size={15} /> Tambah Bahan
                </button>
              </div>

              {/* Save footer */}
              <div className="px-4 md:px-5 py-3 md:py-3.5 shrink-0 bg-[#FAF6ED] border-t border-[#E8D7C0] shadow-sm">
                {isDirty && (
                  <p className="text-[11px] text-center mb-2 font-medium text-[#C9A227]">
                    Ada perubahan yang belum disimpan
                  </p>
                )}
                <button
                  type="button"
                  onClick={saveRecipe}
                  disabled={isSaving || editRows.some(r => usedIngredientIds(r.localId).includes(r.ingredient_id))}
                  className="w-full py-3 rounded-xl font-bold text-[13px] md:text-[14px] transition-all flex items-center justify-center gap-2 cursor-pointer shadow-sm disabled:opacity-50"
                  style={{
                    background: isDirty ? '#8B4A1E' : '#C49A62',
                    color: 'white',
                  }}
                >
                  {isSaving ? (
                    <>
                      <Loader2 size={15} className="animate-spin" />
                      Menyimpan ke Google Sheets...
                    </>
                  ) : (isDirty ? 'Simpan Resep' : 'Tersimpan ✓')}
                </button>
                {editRows.length > 0 && (
                  <button
                    type="button"
                    onClick={() => setProductToDelete(selectedProduct)}
                    className="w-full py-2.5 rounded-xl font-bold text-[12px] md:text-[13px] transition-all flex items-center justify-center gap-2 mt-2 text-[#B60000] hover:bg-red-50 border border-[#FCE8E8] cursor-pointer"
                  >
                    <Trash2 size={14} /> Hapus Resep
                  </button>
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
                Pilih menu di kiri untuk melihat atau mengubah resepnya — bahan baku apa saja yang terpotong tiap kali menu ini terjual.
              </p>
            </div>
          )
        }
      >
        {/* Left: product list */}
        <div className="flex flex-col h-full">
          <div className="px-5 py-3 shrink-0" style={{ borderBottom: '1px solid #E8D7C0', background: '#FAF6ED' }}>
            <p className="text-[12px]" style={{ color: '#6B5448' }}>
              Menu di bawah menggunakan mode <b>Berbasis Resep</b>. Klik untuk atur bahan bakunya.
            </p>
          </div>

          <div className="flex-1 overflow-y-auto custom-scrollbar p-5 space-y-3">
            {recipeProducts.length === 0 ? (
              <div className="text-center py-10">
                <ChefHat size={40} className="mx-auto mb-3" style={{ color: '#E8D7C0' }} />
                <p className="text-[13px]" style={{ color: '#6B5448' }}>Belum ada produk dengan mode stok "Berbasis Resep".</p>
              </div>
            ) : (
              recipeProducts.map((p, i) => {
                const isSelected = selectedProduct?.id === p.id
                const recipeCount = recipesList.filter(r => r.product_id === p.id).length
                return (
                  <button key={p.id} onClick={() => selectProduct(p)}
                    className="w-full flex items-center gap-3 px-5 py-4 text-left transition-colors cursor-pointer"
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
