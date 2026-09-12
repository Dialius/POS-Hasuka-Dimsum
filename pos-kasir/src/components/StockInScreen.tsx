import { useState } from 'react'
import { Plus, Trash2, Save, CheckCircle2 } from 'lucide-react'
import PageShell from './PageShell'
import { gasApi } from '../services/gasApi'
import { INGREDIENTS, PRODUCTS } from '../data/mockData'
import { useApp } from '../context/AppContext'

interface StockItem {
  id: string
  type: 'ingredient' | 'product'
  itemId: number
  qty: number
}

export default function StockInScreen({ onBack, backLabel }: { onBack: () => void; backLabel?: string }) {
  const { outlet, kasirInfo } = useApp()
  const [source, setSource] = useState('Gudang Pusat')
  const [items, setItems] = useState<StockItem[]>([{ id: Date.now().toString(), type: 'ingredient', itemId: INGREDIENTS[0]?.id || 0, qty: 1 }])
  const [isSaving, setIsSaving] = useState(false)
  const [success, setSuccess] = useState(false)

  const addItem = () => {
    setItems([...items, { id: Date.now().toString(), type: 'ingredient', itemId: INGREDIENTS[0]?.id || 0, qty: 1 }])
  }

  const removeItem = (id: string) => {
    setItems(items.filter(i => i.id !== id))
  }

  const updateItem = (id: string, field: keyof StockItem, value: any) => {
    setItems(items.map(i => {
      if (i.id === id) {
        const updated = { ...i, [field]: value }
        // If type changes, reset itemId to first available
        if (field === 'type') {
          updated.itemId = value === 'ingredient' ? (INGREDIENTS[0]?.id || 0) : (PRODUCTS[0]?.id || 0)
        }
        return updated
      }
      return i
    }))
  }

  const handleSave = async () => {
    const validItems = items.filter(i => i.qty > 0 && i.itemId !== 0)
    if (validItems.length === 0) {
      alert('Tambahkan setidaknya 1 item dengan jumlah lebih dari 0')
      return
    }

    setIsSaving(true)
    try {
      await gasApi.saveStockIn({
        branch_id: outlet?.id,
        source: source,
        items: validItems.map(i => ({ id: i.itemId, type: i.type, qty: i.qty })),
        recorded_by: kasirInfo?.name || 'Owner'
      })
      setSuccess(true)
      setTimeout(() => {
        onBack()
      }, 1500)
    } catch (e) {
      alert('Gagal menyimpan faktur stok masuk')
      setIsSaving(false)
    }
  }

  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#FAF6ED]">
        <div className="bg-white p-8 rounded-3xl shadow-xl border border-[#E8D7C0] text-center max-w-sm w-full">
          <div className="w-20 h-20 bg-[#EAF4E0] rounded-full flex items-center justify-center mx-auto mb-6">
            <CheckCircle2 size={40} color="#5B8A2E" />
          </div>
          <h2 className="font-serif font-bold text-[24px] text-[#2B1810] mb-2">Stok Masuk Disimpan!</h2>
          <p className="text-[#6B5448] text-[14px]">Stok berhasil diperbarui di sistem.</p>
        </div>
      </div>
    )
  }

  return (
    <PageShell
      title="Faktur Stok Masuk"
      subtitle="Catat barang masuk sebelum jualan"
      onBack={onBack}
      backLabel={backLabel}
    >
      <div className="p-6 max-w-4xl mx-auto">
        <div className="bg-white rounded-2xl p-6 border border-[#E8D7C0] shadow-sm mb-6">
          <h3 className="font-bold text-[16px] text-[#2B1810] mb-4">Informasi Faktur</h3>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-[12px] font-bold text-[#6B5448] mb-1.5">Tanggal & Jam</label>
              <input 
                type="text" 
                value={new Date().toLocaleString('id-ID')}
                disabled
                className="w-full bg-[#FAF6ED] border border-[#E8D7C0] rounded-xl px-4 py-3 text-[14px] text-[#2B1810] font-medium opacity-70"
              />
            </div>
            <div>
              <label className="block text-[12px] font-bold text-[#6B5448] mb-1.5">Sumber / Asal Barang</label>
              <input 
                type="text" 
                value={source}
                onChange={e => setSource(e.target.value)}
                placeholder="Cth: Gudang Pusat / Supplier A"
                className="w-full bg-white border border-[#C49A62] rounded-xl px-4 py-3 text-[14px] text-[#2B1810] font-medium outline-none focus:ring-2 focus:ring-[#8B4A1E]/20"
              />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-2xl p-6 border border-[#E8D7C0] shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-bold text-[16px] text-[#2B1810]">Daftar Barang Masuk</h3>
            <button 
              onClick={addItem}
              className="flex items-center gap-1 text-[13px] font-bold text-[#8B4A1E] bg-[#F3E7CE] px-3 py-1.5 rounded-lg hover:bg-[#E8D7C0] transition-colors"
            >
              <Plus size={16} /> Tambah Baris
            </button>
          </div>

          <div className="space-y-3">
            {items.map((item, idx) => (
              <div key={item.id} className="flex items-center gap-3 bg-[#FAF6ED] p-3 rounded-xl border border-[#E8D7C0]">
                <div className="w-8 flex justify-center text-[13px] font-bold text-[#C49A62]">{idx + 1}</div>
                
                <select
                  value={item.type}
                  onChange={e => updateItem(item.id, 'type', e.target.value)}
                  className="w-40 bg-white border border-[#E8D7C0] rounded-lg px-3 py-2.5 text-[13px] text-[#2B1810] font-medium outline-none"
                >
                  <option value="ingredient">Bahan Baku</option>
                  <option value="product">Produk Siap Jual</option>
                </select>

                <select
                  value={item.itemId}
                  onChange={e => updateItem(item.id, 'itemId', Number(e.target.value))}
                  className="flex-1 bg-white border border-[#E8D7C0] rounded-lg px-3 py-2.5 text-[13px] text-[#2B1810] font-medium outline-none"
                >
                  {item.type === 'ingredient' 
                    ? INGREDIENTS.map(i => <option key={i.id} value={i.id}>{i.name} ({i.unit})</option>)
                    : PRODUCTS.map(p => <option key={p.id} value={p.id}>{p.name}</option>)
                  }
                </select>

                <input
                  type="number"
                  min="1"
                  value={item.qty || ''}
                  onChange={e => updateItem(item.id, 'qty', Number(e.target.value))}
                  placeholder="Jml"
                  className="w-24 bg-white border border-[#E8D7C0] rounded-lg px-3 py-2.5 text-[13px] text-[#2B1810] font-medium outline-none text-center"
                />

                <button
                  onClick={() => removeItem(item.id)}
                  className="w-10 h-10 flex items-center justify-center text-[#B60000] hover:bg-[#FCE8E8] rounded-lg transition-colors"
                  title="Hapus"
                >
                  <Trash2 size={18} />
                </button>
              </div>
            ))}
            
            {items.length === 0 && (
              <div className="text-center py-8 text-[#6B5448] text-[13px]">
                Belum ada barang yang ditambahkan.
              </div>
            )}
          </div>
        </div>

        <div className="mt-8 flex justify-end">
          <button
            onClick={handleSave}
            disabled={isSaving || items.length === 0}
            className="flex items-center justify-center gap-2 bg-[#8B4A1E] text-white px-8 py-3.5 rounded-xl font-bold text-[15px] transition-all hover:bg-[#6B5448] disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-[#8B4A1E]/20"
          >
            {isSaving ? (
              <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              <>
                <Save size={18} />
                Simpan Faktur
              </>
            )}
          </button>
        </div>
      </div>
    </PageShell>
  )
}
