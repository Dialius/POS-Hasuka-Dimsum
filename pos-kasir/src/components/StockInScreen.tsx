import { useState } from 'react'
import { Plus, Trash2, Save, CheckCircle2 } from 'lucide-react'
import PageShell from './PageShell'
import { gasApi } from '../services/gasApi'
import { useApp } from '../context/AppContext'
import { Button } from './common/Button'
import { showToast } from './Alert'

interface StockItem {
  id: string
  type: 'ingredient' | 'product'
  itemId: number
  qty: number
}

export default function StockInScreen({ onBack, backLabel, onNavigate }: { onBack: () => void; backLabel?: string; onNavigate?: (s: string) => void }) {
  const { outlet, kasirInfo, productsList, ingredientsList, refreshData, outletsList, setIngredientsList, setProductsList } = useApp()
  const isOwner = kasirInfo?.role === 'owner' || backLabel === 'Owner'
  const [selectedBranch, setSelectedBranch] = useState<string>(outlet?.id || outletsList[0]?.id || 'paskal')
  const [source, setSource] = useState('Gudang Pusat')
  const [items, setItems] = useState<StockItem[]>([{ id: `item-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`, type: 'ingredient', itemId: ingredientsList[0]?.id || 0, qty: 1 }])
  const [isSaving, setIsSaving] = useState(false)
  const [showSuccessModal, setShowSuccessModal] = useState(false)
  const [savedSummary, setSavedSummary] = useState<{ count: number; source: string; branchName: string } | null>(null)

  const addItem = () => {
    setItems(prev => [...prev, { id: `item-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`, type: 'ingredient', itemId: ingredientsList[0]?.id || 0, qty: 1 }])
  }

  const removeItem = (id: string) => {
    if (items.length <= 1) {
      setItems([{ id: `item-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`, type: 'ingredient', itemId: ingredientsList[0]?.id || 0, qty: 1 }])
      showToast({ variant: 'info', title: 'Baris barang telah direset' })
      return
    }
    setItems(prev => prev.filter(i => i.id !== id))
  }

  const updateItem = (id: string, field: keyof StockItem, value: any) => {
    setItems(items.map(i => {
      if (i.id === id) {
        const updated = { ...i, [field]: value }
        // If type changes, reset itemId to first available
        if (field === 'type') {
          updated.itemId = value === 'ingredient' ? (ingredientsList[0]?.id || 0) : (productsList[0]?.id || 0)
        }
        return updated
      }
      return i
    }))
  }

  const handleSave = async () => {
    const validItems = items.filter(i => i.qty > 0 && i.itemId !== 0)
    if (validItems.length === 0) {
      showToast({ variant: 'warning', title: 'Tambahkan setidaknya 1 item dengan jumlah lebih dari 0' })
      return
    }

    const targetBranch = isOwner ? selectedBranch : (outlet?.id || 'paskal')
    const targetBranchName = outletsList.find(o => o.id === targetBranch)?.name || outlet?.name || 'Cabang'

    setIsSaving(true)
    try {
      await gasApi.saveStockIn({
        branch_id: targetBranch,
        source: source,
        items: validItems.map(i => ({ id: i.itemId, type: i.type, qty: i.qty })),
        recorded_by: kasirInfo?.name || (isOwner ? 'Owner' : 'Kasir')
      })

      // Update langsung state lokal ingredientsList & productsList agar Stok Opname seketika bertambah
      setIngredientsList(prev => prev.map(ing => {
        const matched = validItems.find(v => v.type === 'ingredient' && v.itemId === ing.id)
        return matched ? { ...ing, current_stock: Number(ing.current_stock || 0) + Number(matched.qty) } : ing
      }))

      setProductsList(prev => prev.map(prod => {
        const matched = validItems.find(v => v.type === 'product' && v.itemId === prod.id)
        return matched ? { ...prod, stock: Number(prod.stock || 0) + Number(matched.qty) } : prod
      }))

      // Refresh data global di background untuk cabang terkait
      refreshData(targetBranch).catch(() => {})

      showToast({ variant: 'success', title: `Stok masuk ${validItems.length} item berhasil dicatat ke ${targetBranchName}` })
      setSavedSummary({ count: validItems.length, source, branchName: targetBranchName })
      setItems([{ id: Date.now().toString(), type: 'ingredient', itemId: ingredientsList[0]?.id || 0, qty: 1 }])
      setShowSuccessModal(true)
    } catch (e) {
      showToast({
        variant: 'destructive',
        title: 'Gagal menyimpan faktur stok masuk',
        description: 'Periksa koneksi internet Anda lalu coba lagi.',
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
      title="Faktur Stok Masuk"
      subtitle="Catat barang masuk"
      onBack={onBack}
      backLabel={backLabel}
      onNavigate={onNavigate}
      activeNav="stockIn"
    >
      <div className="p-3.5 md:p-6 max-w-4xl mx-auto">
        <div className="bg-white rounded-2xl p-4 md:p-6 border border-[#E8D7C0] shadow-sm mb-4 md:mb-6">
          <h3 className="font-bold text-[15px] md:text-[16px] text-[#2B1810] mb-3 md:mb-4">Info Faktur</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 md:gap-4">
            <div>
              <label className="block text-[11px] md:text-[12px] font-bold text-[#6B5448] mb-1.5 md:mb-2">Tanggal & Jam</label>
              <input 
                type="text" 
                value={new Date().toLocaleString('id-ID')}
                disabled
                className="w-full bg-[#FAF6ED] border border-[#E8D7C0] rounded-xl px-3.5 py-2.5 md:py-3 text-[13px] text-[#2B1810] font-medium opacity-70"
              />
            </div>
            <div>
              <label className="block text-[11px] md:text-[12px] font-bold text-[#6B5448] mb-1.5 md:mb-2">Cabang Tujuan</label>
              {isOwner && outletsList.length > 0 ? (
                <select
                  value={selectedBranch}
                  onChange={e => setSelectedBranch(e.target.value)}
                  className="w-full bg-white border border-[#C49A62] rounded-xl px-3.5 py-2.5 md:py-3 text-[13px] text-[#2B1810] font-bold outline-none focus:ring-2 focus:ring-[#8B4A1E]/20 cursor-pointer"
                >
                  {outletsList.map(o => (
                    <option key={o.id} value={o.id}>
                      {o.name}
                    </option>
                  ))}
                </select>
              ) : (
                <input 
                  type="text" 
                  value={outlet?.name || 'Cabang Aktif'}
                  disabled
                  className="w-full bg-[#FAF6ED] border border-[#E8D7C0] rounded-xl px-3.5 py-2.5 md:py-3 text-[13px] text-[#2B1810] font-bold opacity-80"
                />
              )}
            </div>
            <div>
              <label className="block text-[11px] md:text-[12px] font-bold text-[#6B5448] mb-1.5 md:mb-2">Sumber Barang</label>
              <input 
                type="text" 
                value={source}
                onChange={e => setSource(e.target.value)}
                placeholder="Cth: Gudang Pusat"
                className="w-full bg-white border border-[#C49A62] rounded-xl px-3.5 py-2.5 md:py-3 text-[13px] text-[#2B1810] font-medium outline-none focus:ring-2 focus:ring-[#8B4A1E]/20"
              />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-2xl p-4 md:p-6 border border-[#E8D7C0] shadow-sm">
          <div className="flex items-center justify-between mb-3 md:mb-4">
            <h3 className="font-bold text-[15px] md:text-[16px] text-[#2B1810]">Barang Masuk</h3>
            <Button 
              onClick={addItem}
              variant="secondary"
              size="sm"
              icon={<Plus size={16} />}
              className="text-[12px] md:text-[13px] font-bold"
            >
              Tambah Baris
            </Button>
          </div>

          <div className="space-y-3">
            {items.map((item, idx) => {
              return (
                <div key={item.id} className="flex flex-col md:flex-row items-stretch md:items-center gap-2.5 md:gap-3 bg-[#FAF6ED] p-3 md:p-3.5 rounded-xl border border-[#E8D7C0] w-full">
                  {/* Mobile header inside item card */}
                  <div className="flex items-center justify-between md:hidden">
                    <span className="text-[11px] font-bold text-[#8B4A1E] bg-[#F3E7CE] px-2 py-0.5 rounded-md">
                      Item #{idx + 1}
                    </span>
                    <button
                      type="button"
                      onClick={() => removeItem(item.id)}
                      className="w-8 h-8 rounded-lg border border-[#F8B4B4] bg-white text-[#B60000] hover:bg-[#FFF5F5] active:scale-95 transition-all flex items-center justify-center shrink-0 shadow-sm"
                      title={items.length <= 1 ? "Reset baris ini" : "Hapus baris ini"}
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>

                  <div className="hidden md:flex w-6 shrink-0 items-center justify-center text-[12px] font-bold text-[#C49A62]">
                    {idx + 1}
                  </div>
                  
                  <select
                    value={item.type}
                    onChange={e => updateItem(item.id, 'type', e.target.value)}
                    className="w-full md:w-36 shrink-0 bg-white border border-[#E8D7C0] rounded-xl px-3 py-2 text-[12px] text-[#2B1810] font-medium outline-none"
                  >
                    <option value="ingredient">Bahan Baku</option>
                    <option value="product">Produk Siap Jual</option>
                  </select>

                  <div className="flex-1 min-w-0 flex items-center gap-2">
                    <select
                      value={item.itemId}
                      onChange={e => updateItem(item.id, 'itemId', Number(e.target.value))}
                      className="w-full min-w-0 bg-white border border-[#E8D7C0] rounded-xl px-3 py-2 text-[12px] text-[#2B1810] font-medium outline-none truncate"
                    >
                      {item.type === 'ingredient' 
                        ? ingredientsList.map(i => (
                            <option key={i.id} value={i.id}>
                              {i.name} ({i.unit}) — [Stok: {i.current_stock}]
                            </option>
                          ))
                        : productsList.map(p => (
                            <option key={p.id} value={p.id}>
                              {p.name} — [Stok: {p.stock}]
                            </option>
                          ))
                      }
                    </select>
                  </div>

                  <div className="flex items-center justify-between md:justify-start gap-2 shrink-0 pt-1 md:pt-0">
                    <span className="text-[11px] font-semibold text-[#6B5448] md:hidden">Jumlah:</span>
                    <input
                      type="number"
                      min="1"
                      value={item.qty || ''}
                      onChange={e => updateItem(item.id, 'qty', Math.max(1, Number(e.target.value)))}
                      placeholder="Jml"
                      className="w-24 md:w-20 bg-white border border-[#E8D7C0] rounded-xl px-2.5 py-2 text-[12px] text-[#2B1810] font-bold outline-none text-center"
                    />

                    <button
                      type="button"
                      onClick={() => removeItem(item.id)}
                      className="hidden md:flex w-9 h-9 rounded-xl border border-[#F8B4B4] bg-white text-[#B60000] hover:bg-[#FFF5F5] active:scale-95 transition-all items-center justify-center shrink-0 shadow-sm"
                      title={items.length <= 1 ? "Reset baris ini" : "Hapus baris ini"}
                    >
                      <Trash2 size={15} />
                    </button>
                  </div>
                </div>
              )
            })}
            
            {items.length === 0 && (
              <div className="text-center py-8 text-[#6B5448] text-[13px]">
                Belum ada barang yang ditambahkan.
              </div>
            )}
          </div>
        </div>

        <div className="mt-6 md:mt-8 flex justify-end">
          <Button
            onClick={handleSave}
            disabled={items.length === 0}
            loading={isSaving}
            icon={!isSaving ? <Save size={18} /> : undefined}
            variant="primary"
            size="lg"
            className="w-full md:w-auto px-8 py-3.5 md:py-4 rounded-xl font-bold text-[14px] md:text-[15px] shadow-lg shadow-[#8B4A1E]/20"
          >
            Simpan Faktur
          </Button>
        </div>
      </div>

      {/* Modal Sukses Simpan Faktur (Tetap di halaman yang sama) */}
      {showSuccessModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-in fade-in duration-150">
          <div className="bg-white rounded-3xl p-6 max-w-sm w-full shadow-2xl border border-[#E8D7C0] text-center animate-in zoom-in-95 duration-150">
            <div className="w-16 h-16 bg-[#EAF4E0] rounded-full flex items-center justify-center mx-auto mb-4 border border-[#B7E4C7]">
              <CheckCircle2 size={36} color="#5B8A2E" />
            </div>
            <h3 className="font-serif font-bold text-[20px] mb-1" style={{ color: '#2B1810' }}>
              Faktur Tersimpan!
            </h3>
            <p className="text-[13px] mb-4" style={{ color: '#6B5448' }}>
              <b>{savedSummary?.count || 0} item</b> dari <i>{savedSummary?.source}</i> dicatat dan stok diperbarui.
            </p>
            <Button
              onClick={() => setShowSuccessModal(false)}
              variant="primary"
              fullWidth
              className="py-4 rounded-xl font-bold text-[14px] shadow-md"
            >
              Selesai
            </Button>
          </div>
        </div>
      )}
    </PageShell>
    </>
  )
}
