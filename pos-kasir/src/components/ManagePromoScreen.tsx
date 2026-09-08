import { useState } from 'react'
import { Plus, Tag, Calendar, X } from 'lucide-react'
import PageShell from './PageShell'
import AddEditPromoModal, { type Promo } from './AddEditPromoModal'

const STATUS_STYLE: Record<string, { bg: string; color: string }> = {
  'Aktif':        { bg: '#EAF4E0', color: '#5B8A2E' },
  'Kedaluwarsa':  { bg: '#F3F3F3', color: '#6B5448' },
  'Dijadwalkan':  { bg: '#FEF9EC', color: '#C9A227' },
}

const TYPE_LABEL: Record<string, string> = {
  diskon_persen: 'Diskon %',
  diskon_nominal: 'Diskon Rp',
  bundling: 'Bundling',
  gratis_item: 'Gratis Item',
}

const INITIAL_PROMOS: Promo[] = [
  { id: 1, name: 'Diskon Soft Launching Hakau', type: 'diskon_persen', value: 25, scope: 'Produk Tertentu', products: [{ productId: 2, productName: 'Hakau Udang Garing', qty: 1 }], startDate: '2024-03-01', endDate: '2024-03-31', status: 'Aktif', desc: 'Hanya berlaku pukul 14:00–17:00 WIB.' },
  { id: 2, name: 'Paket Steamer Komplit', type: 'bundling', value: 50000, scope: 'Bundle', products: [], bundleProducts: [{ productId: 1, productName: 'Siao May', qty: 1 }, { productId: 2, productName: 'Hakau', qty: 1 }], startDate: '2024-03-10', endDate: '2024-03-15', status: 'Kedaluwarsa', desc: 'Bundle Siao May + Hakau + Bakpao gratis Teh hangat.' },
  { id: 3, name: 'Happy Hour Goreng', type: 'diskon_persen', value: 15, scope: 'Semua Produk', products: [], startDate: '2024-04-01', endDate: '2024-04-30', status: 'Aktif', desc: 'Setiap hari pukul 15:00–18:00.' },
]

export default function ManagePromoScreen({ onBack, backLabel }: { onBack: () => void; backLabel?: string }) {
  const [promos, setPromos] = useState<Promo[]>(INITIAL_PROMOS)
  const [selected, setSelected] = useState<Promo>(promos[0])
  const [modal, setModal] = useState<Promo | null | undefined>(undefined)

  const handleSave = (p: Promo) => {
    setPromos(prev => {
      const exists = prev.some(x => x.id === p.id)
      const next = exists ? prev.map(x => x.id === p.id ? p : x) : [...prev, p]
      if (selected.id === p.id) setSelected(p)
      return next
    })
  }

  const deactivate = () => {
    const updated = { ...selected, status: 'Kedaluwarsa' as const }
    setSelected(updated)
    setPromos(prev => prev.map(p => p.id === selected.id ? updated : p))
  }

  const sc = STATUS_STYLE[selected.status] ?? STATUS_STYLE['Aktif']

  const typeInfo = () => {
    if (selected.type === 'diskon_persen') return `Diskon ${selected.value}%`
    if (selected.type === 'diskon_nominal') return `Potongan Rp ${selected.value.toLocaleString('id-ID')}`
    if (selected.type === 'bundling') return `Paket Rp ${selected.value.toLocaleString('id-ID')}`
    return `Gratis Item (min. beli ${selected.value})`
  }

  return (
    <PageShell
      title="Manajemen Promo"
      subtitle="Diskon, bundling & promo aktif"
      onBack={onBack}
      backLabel={backLabel}
      rightPanelWidth={340}
      rightPanel={
        <div className="flex flex-col h-full">
          <div className="px-5 py-5 shrink-0" style={{ borderBottom: '1px solid #C49A6240' }}>
            <span className="text-[11px] font-bold px-2.5 py-1 rounded-full inline-block mb-3" style={{ background: sc.bg, color: sc.color }}>
              {selected.status}
            </span>
            <h2 className="font-serif font-bold text-[17px] leading-snug mb-1" style={{ color: '#F3E7CE' }}>{selected.name}</h2>
            <p className="text-[12px]" style={{ color: '#C49A62' }}>{selected.desc}</p>
          </div>

          <div className="px-5 py-4 flex-1">
            <div className="space-y-3 mb-5">
              {[
                { label: 'Tipe', val: typeInfo(), Icon: Tag },
                { label: 'Produk Berlaku', val: selected.products.length > 0 ? selected.products.map(p => p.productName).join(', ') : (selected.bundleProducts?.length ? `${selected.bundleProducts.length} produk bundle` : 'Semua Produk'), Icon: Tag },
                { label: 'Periode', val: `${selected.startDate} – ${selected.endDate}`, Icon: Calendar },
              ].map(r => {
                const Icon = r.Icon
                return (
                  <div key={r.label} className="flex items-start gap-3">
                    <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0 mt-0.5" style={{ background: '#3D2315' }}>
                      <Icon size={15} color="#C49A62" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-[10px]" style={{ color: '#C49A62' }}>{r.label}</p>
                      <p className="font-bold text-[12px]" style={{ color: '#F3E7CE' }}>{r.val}</p>
                    </div>
                  </div>
                )
              })}

              {/* Bundle detail */}
              {selected.type === 'bundling' && selected.bundleProducts && selected.bundleProducts.length > 0 && (
                <div className="rounded-xl p-3" style={{ background: '#3D2315' }}>
                  <p className="text-[10px] font-bold mb-2" style={{ color: '#C49A62' }}>ISI BUNDLE:</p>
                  {selected.bundleProducts.map(bp => (
                    <p key={bp.productId} className="text-[12px]" style={{ color: '#F3E7CE' }}>• {bp.productName}</p>
                  ))}
                </div>
              )}
            </div>

            <div className="flex flex-col gap-2">
              <button onClick={() => setModal(selected)} className="w-full py-2.5 rounded-xl font-bold text-[13px] transition-colors" style={{ background: '#F3E7CE', color: '#2B1810' }}>
                Edit Promo Ini
              </button>
              {selected.status === 'Aktif' && (
                <button onClick={deactivate} className="w-full py-2.5 rounded-xl font-bold text-[13px] flex items-center justify-center gap-1.5" style={{ background: '#5C1010', color: '#F87171' }}>
                  <X size={14} /> Nonaktifkan Promo
                </button>
              )}
            </div>
          </div>

          <div className="px-5 pb-5 shrink-0">
            <button onClick={() => setModal(null)} className="w-full py-3 rounded-xl font-bold text-[14px] flex items-center justify-center gap-2" style={{ background: '#8B4A1E', color: 'white' }}>
              <Plus size={16} /> Buat Promo Baru
            </button>
          </div>
        </div>
      }
    >
      <div className="px-5 py-5">
        {/* Summary */}
        <div className="grid grid-cols-3 gap-3 mb-5">
          {[
            { label: 'Promo Aktif', val: promos.filter(p => p.status === 'Aktif').length, color: '#5B8A2E' },
            { label: 'Dijadwalkan', val: promos.filter(p => p.status === 'Dijadwalkan').length, color: '#C9A227' },
            { label: 'Kedaluwarsa', val: promos.filter(p => p.status === 'Kedaluwarsa').length, color: '#6B5448' },
          ].map(c => (
            <div key={c.label} className="rounded-2xl p-4 text-center" style={{ background: 'white', border: '1px solid #E8D7C0' }}>
              <p className="font-serif font-bold text-[24px]" style={{ color: c.color }}>{c.val}</p>
              <p className="text-[11px] mt-0.5" style={{ color: '#6B5448' }}>{c.label}</p>
            </div>
          ))}
        </div>

        {/* Promo list */}
        <div className="rounded-2xl overflow-hidden" style={{ background: 'white', border: '1px solid #E8D7C0' }}>
          {promos.map((promo, i) => {
            const sc = STATUS_STYLE[promo.status] ?? STATUS_STYLE['Aktif']
            const isSelected = selected.id === promo.id
            return (
              <button key={promo.id} onClick={() => setSelected(promo)}
                className="w-full text-left flex items-start gap-4 px-5 py-4 transition-colors"
                style={{ background: isSelected ? '#F3E7CE' : 'white', borderBottom: i < promos.length - 1 ? '1px solid #E8D7C060' : 'none', borderLeft: isSelected ? '3px solid #8B4A1E' : '3px solid transparent' }}>
                <div className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0" style={{ background: '#F3E7CE' }}>
                  <Tag size={18} color="#8B4A1E" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-bold text-[13px]" style={{ color: '#2B1810' }}>{promo.name}</p>
                  <div className="flex items-center gap-2 mt-1 flex-wrap">
                    <span className="text-[11px] font-bold px-2 py-0.5 rounded-full" style={{ background: sc.bg, color: sc.color }}>{promo.status}</span>
                    <span className="text-[10px]" style={{ color: '#C49A62' }}>{TYPE_LABEL[promo.type]} · {promo.startDate} – {promo.endDate}</span>
                  </div>
                </div>
              </button>
            )
          })}
        </div>
      </div>

      {modal !== undefined && (
        <AddEditPromoModal promo={modal} onSave={handleSave} onClose={() => setModal(undefined)} />
      )}
    </PageShell>
  )
}
