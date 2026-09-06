import { useState } from 'react'
import { Plus, Calendar, Tag, X, ChevronRight } from 'lucide-react'
import PageShell from './PageShell'

const PROMOS = [
  { id: 1, name: 'Diskon Soft Launching Hakau', type: 'Diskon 25%', scope: 'Produk Tertentu', date: '1 Mar – 31 Mar', status: 'Aktif', desc: 'Hanya berlaku untuk Hakau Udang pukul 14:00–17:00 WIB.' },
  { id: 2, name: 'Paket Steamer Komplit', type: 'Bundling Rp 50k', scope: 'Kategori Tertentu', date: '10 Mar – 15 Mar', status: 'Kedaluwarsa', desc: 'Bundling Siao May + Hakau + Bakpao gratis Teh hangat.' },
  { id: 3, name: 'Happy Hour Goreng', type: 'Diskon 15%', scope: 'Semua Produk', date: '1 Apr – 30 Apr', status: 'Aktif', desc: 'Berlaku setiap hari pukul 15:00–18:00 WIB untuk semua menu.' },
]

const STATUS_COLOR: Record<string, { bg: string; color: string }> = {
  'Aktif': { bg: '#EAF4E0', color: '#5B8A2E' },
  'Kedaluwarsa': { bg: '#F3F3F3', color: '#6B5448' },
  'Dijadwalkan': { bg: '#FEF9EC', color: '#C9A227' },
}

export default function ManagePromoScreen({ onBack }: { onBack: () => void }) {
  const [selected, setSelected] = useState(PROMOS[0])

  return (
    <PageShell
      title="Manajemen Promo"
      subtitle="Diskon, bundling & promo aktif"
      onBack={onBack}
      rightPanelWidth={340}
      rightPanel={
        <div className="flex flex-col h-full">
          {/* Header */}
          <div className="px-5 py-5 shrink-0" style={{ borderBottom: '1px solid #C49A6240' }}>
            <div className="flex items-center justify-between mb-2">
              <span
                className="text-[11px] font-bold px-2.5 py-1 rounded-full"
                style={{ background: STATUS_COLOR[selected.status]?.bg, color: STATUS_COLOR[selected.status]?.color }}
              >
                {selected.status}
              </span>
            </div>
            <h2 className="font-serif font-bold text-[17px] leading-snug mb-1" style={{ color: '#F3E7CE' }}>{selected.name}</h2>
            <p className="text-[12px]" style={{ color: '#C49A62' }}>{selected.desc}</p>
          </div>

          {/* Detail */}
          <div className="px-5 py-4 flex-1">
            <div className="space-y-3 mb-6">
              {[
                { label: 'Tipe Promo', val: selected.type, Icon: Tag },
                { label: 'Berlaku untuk', val: selected.scope, Icon: ChevronRight },
                { label: 'Periode', val: selected.date, Icon: Calendar },
              ].map(r => (
                <div key={r.label} className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0" style={{ background: '#3D2315' }}>
                    <r.Icon size={15} color="#C49A62" />
                  </div>
                  <div>
                    <p className="text-[10px]" style={{ color: '#C49A62' }}>{r.label}</p>
                    <p className="font-bold text-[13px]" style={{ color: '#F3E7CE' }}>{r.val}</p>
                  </div>
                </div>
              ))}
            </div>

            {/* Actions */}
            <div className="flex flex-col gap-2">
              <button className="w-full py-2.5 rounded-xl font-bold text-[13px] transition-colors" style={{ background: '#F3E7CE', color: '#2B1810' }}>
                Edit Promo Ini
              </button>
              {selected.status === 'Aktif' && (
                <button className="w-full py-2.5 rounded-xl font-bold text-[13px] flex items-center justify-center gap-1.5 transition-colors" style={{ background: '#5C1010', color: '#F87171' }}>
                  <X size={14} /> Nonaktifkan Promo
                </button>
              )}
            </div>
          </div>

          {/* New promo button */}
          <div className="px-5 pb-5 shrink-0">
            <button className="w-full py-3 rounded-xl font-bold text-[14px] flex items-center justify-center gap-2 transition-all" style={{ background: '#8B4A1E', color: 'white' }}>
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
            { label: 'Promo Aktif', val: '2', color: '#5B8A2E' },
            { label: 'Dijadwalkan', val: '0', color: '#C9A227' },
            { label: 'Kedaluwarsa', val: '1', color: '#6B5448' },
          ].map(c => (
            <div key={c.label} className="rounded-2xl p-4 text-center" style={{ background: 'white', border: '1px solid #E8D7C0' }}>
              <p className="font-serif font-bold text-[24px]" style={{ color: c.color }}>{c.val}</p>
              <p className="text-[11px] mt-0.5" style={{ color: '#6B5448' }}>{c.label}</p>
            </div>
          ))}
        </div>

        {/* Promo list */}
        <div className="rounded-2xl overflow-hidden" style={{ background: 'white', border: '1px solid #E8D7C0' }}>
          {PROMOS.map((promo, i) => {
            const sc = STATUS_COLOR[promo.status] ?? { bg: '#F3F3F3', color: '#6B5448' }
            const isSelected = selected.id === promo.id
            return (
              <button
                key={promo.id}
                onClick={() => setSelected(promo)}
                className="w-full text-left flex items-start gap-4 px-5 py-4 transition-colors"
                style={{
                  background: isSelected ? '#F3E7CE' : 'white',
                  borderBottom: i < PROMOS.length - 1 ? '1px solid #E8D7C060' : 'none',
                  borderLeft: isSelected ? '3px solid #8B4A1E' : '3px solid transparent',
                }}
              >
                <div className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0" style={{ background: '#F3E7CE' }}>
                  <Tag size={18} color="#8B4A1E" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-bold text-[13px]" style={{ color: '#2B1810' }}>{promo.name}</p>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-[11px] font-bold px-2 py-0.5 rounded-full" style={{ background: sc.bg, color: sc.color }}>{promo.status}</span>
                    <span className="text-[10px]" style={{ color: '#C49A62' }}>{promo.type} · {promo.date}</span>
                  </div>
                </div>
              </button>
            )
          })}
        </div>
      </div>
    </PageShell>
  )
}
