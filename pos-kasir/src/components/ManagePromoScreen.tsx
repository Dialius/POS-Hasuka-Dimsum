import { useState } from 'react'
import { Plus, Tag, Calendar, X, Trash2, AlertTriangle } from 'lucide-react'
import PageShell from './PageShell'
import AddEditPromoModal, { type Promo } from './AddEditPromoModal'
import { useApp } from '../context/AppContext'
import { gasApi } from '../services/gasApi'
import { showToast } from './Alert'

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

export default function ManagePromoScreen({ onBack, backLabel }: { onBack: () => void; backLabel?: string }) {
  const { promosList, setPromosList } = useApp()
  const [selected, setSelected] = useState<Promo | undefined>(promosList[0])
  const [modal, setModal] = useState<Promo | null | undefined>(undefined)
  const [isSaving, setIsSaving] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState(false)

  const handleSave = async (p: Promo, opts?: { statusChange?: boolean }) => {
    const statusChange = !!opts?.statusChange
    try {
      setIsSaving(true)
      const res = await gasApi.savePromo(p)
      if (res && res.id) p.id = res.id

      setPromosList(prev => {
        const exists = prev.some(x => x.id === p.id)
        const next = exists ? prev.map(x => x.id === p.id ? p : x) : [...prev, p]
        if (selected?.id === p.id) setSelected(p)
        return next
      })
      showToast({
        variant: 'success',
        title: statusChange ? `Promo '${p.name}' dinonaktifkan` : `Promo '${p.name}' berhasil disimpan`,
      })
    } catch (err) {
      console.error(err)
      showToast({
        variant: 'destructive',
        title: statusChange ? 'Gagal mengubah status promo' : 'Gagal menyimpan promo',
        description: statusChange ? `Perubahan status promo '${p.name}' tidak tersimpan.` : `Promo '${p.name}' tidak tersimpan.`,
        actionLabel: 'Coba Lagi',
        onAction: () => handleSave(p, opts),
      })
    } finally {
      setIsSaving(false)
      setModal(undefined)
    }
  }

  const deactivate = async () => {
    if (!selected) return
    const updated = { ...selected, status: 'Kedaluwarsa' as const }
    await handleSave(updated, { statusChange: true })
  }

  const doDelete = async (promo: Promo) => {
    try {
      setIsSaving(true)
      await gasApi.deletePromo(promo.id)
      setPromosList(prev => {
        const next = prev.filter(x => x.id !== promo.id)
        setSelected(next[0])
        return next
      })
      showToast({ variant: 'success', title: `Promo '${promo.name}' berhasil dihapus` })
    } catch (err) {
      console.error(err)
      showToast({
        variant: 'destructive',
        title: 'Gagal menghapus promo',
        description: `Promo '${promo.name}' tidak terhapus.`,
        actionLabel: 'Coba Lagi',
        onAction: () => doDelete(promo),
      })
    } finally {
      setIsSaving(false)
    }
  }

  const handleDelete = () => {
    if (!selected) return
    setConfirmDelete(true)
  }

  const sc = selected ? (STATUS_STYLE[selected.status] ?? STATUS_STYLE['Aktif']) : STATUS_STYLE['Aktif']

  const typeInfo = () => {
    if (!selected) return ''
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
      headerRight={
        <button
          onClick={() => setModal(null)}
          className="flex items-center gap-1.5 px-3 sm:px-4 py-2 rounded-xl font-bold text-[12px] sm:text-[13px] shadow-sm transition-all hover:brightness-110 active:scale-95"
          style={{ background: '#8B4A1E', color: 'white' }}
        >
          <Plus size={16} />
          <span>Tambah Promo</span>
        </button>
      }
      rightPanelWidth={340}
      rightPanel={
        selected ? (
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
                <button onClick={handleDelete} className="w-full py-2.5 rounded-xl font-bold text-[13px] flex items-center justify-center gap-1.5 bg-white border border-[#B60000] text-[#B60000] hover:bg-[#FCE8E8] transition-colors">
                  <Trash2 size={14} /> Hapus Promo
                </button>
              </div>
            </div>

            <div className="px-5 pb-5 shrink-0">
              <button onClick={() => setModal(null)} className="w-full py-3 rounded-xl font-bold text-[14px] flex items-center justify-center gap-2 transition-all hover:brightness-110 active:scale-95 shadow-sm" style={{ background: '#8B4A1E', color: 'white' }}>
                <Plus size={16} /> Buat Promo Baru
              </button>
            </div>
          </div>
        ) : (
          <div className="p-6 h-full flex flex-col items-center justify-center text-center text-[#6B5448]">
            <div className="w-14 h-14 rounded-2xl flex items-center justify-center mb-4" style={{ background: '#E8D7C0' }}>
              <Tag size={28} color="#8B4A1E" />
            </div>
            <p className="font-bold text-[15px] text-[#2B1810]">Belum Ada Promo</p>
            <p className="text-[12px] mt-1 opacity-70 mb-5 max-w-[220px]">
              Klik tombol di bawah atau di pojok kanan atas untuk membuat promo baru.
            </p>
            <button
              onClick={() => setModal(null)}
              className="py-2.5 px-5 rounded-xl font-bold text-[13px] flex items-center justify-center gap-2 shadow-sm transition-all hover:brightness-110 active:scale-95"
              style={{ background: '#8B4A1E', color: 'white' }}
            >
              <Plus size={16} /> Buat Promo Baru
            </button>
          </div>
        )
      }
    >
      <div className="px-4 sm:px-5 py-4 sm:py-5">
        {/* Summary */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-5">
          {[
            { label: 'Promo Aktif', val: promosList.filter(p => p.status === 'Aktif').length, color: '#5B8A2E' },
            { label: 'Dijadwalkan', val: promosList.filter(p => p.status === 'Dijadwalkan').length, color: '#C9A227' },
            { label: 'Kedaluwarsa', val: promosList.filter(p => p.status === 'Kedaluwarsa').length, color: '#6B5448' },
          ].map(c => (
            <div key={c.label} className="rounded-2xl p-4 text-center" style={{ background: 'white', border: '1px solid #E8D7C0' }}>
              <p className="font-serif font-bold text-[24px]" style={{ color: c.color }}>{c.val}</p>
              <p className="text-[11px] mt-0.5" style={{ color: '#6B5448' }}>{c.label}</p>
            </div>
          ))}
        </div>

        {/* Promo list */}
        <div className="bg-white rounded-2xl border border-[#E8D7C0] overflow-hidden">
          {promosList.length === 0 ? (
            <div className="p-10 text-center flex flex-col items-center justify-center">
              <div className="w-12 h-12 rounded-2xl flex items-center justify-center mb-3" style={{ background: '#F3E7CE' }}>
                <Tag size={24} color="#8B4A1E" />
              </div>
              <p className="font-bold text-[15px] text-[#2B1810] mb-1">Belum Ada Promo</p>
              <p className="text-[12px] text-[#6B5448] mb-5 max-w-sm">
                Buat promo diskon persentase, potongan harga rupiah, atau paket bundling untuk menarik pelanggan.
              </p>
              <button
                onClick={() => setModal(null)}
                className="flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold text-[13px] shadow-sm transition-all hover:brightness-110 active:scale-95"
                style={{ background: '#8B4A1E', color: 'white' }}
              >
                <Plus size={16} /> Buat Promo Baru
              </button>
            </div>
          ) : promosList.map((promo, i) => {
            const sc = STATUS_STYLE[promo.status] ?? STATUS_STYLE['Aktif']
            const isSelected = selected?.id === promo.id
            return (
              <button key={promo.id} onClick={() => setSelected(promo)}
                className="w-full text-left flex items-start gap-4 px-5 py-4 transition-colors"
                style={{ background: isSelected ? '#F3E7CE' : 'white', borderBottom: i < promosList.length - 1 ? '1px solid #E8D7C060' : 'none', borderLeft: isSelected ? '3px solid #8B4A1E' : '3px solid transparent' }}>
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
        <AddEditPromoModal promo={modal} onSave={p => handleSave(p)} onClose={() => setModal(undefined)} />
      )}
      {confirmDelete && selected && (
        <div className="fixed inset-0 z-[210] flex items-center justify-center bg-black/50 p-4" onClick={() => setConfirmDelete(false)}>
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-sm p-6 text-center" onClick={e => e.stopPropagation()}>
            <div className="w-14 h-14 rounded-2xl flex items-center justify-center mx-auto mb-4" style={{ background: '#FCE8E8' }}>
              <AlertTriangle size={28} color="#B60000" />
            </div>
            <h3 className="font-serif font-bold text-[18px] mb-1" style={{ color: '#2B1810' }}>Hapus Promo?</h3>
            <p className="text-[13px] mb-6" style={{ color: '#6B5448' }}>
              Promo <span className="font-bold">"{selected.name}"</span> akan dihapus permanen dan tidak bisa dikembalikan.
            </p>
            <div className="flex gap-3">
              <button onClick={() => setConfirmDelete(false)} className="flex-1 py-3 rounded-xl font-bold text-[13px]" style={{ background: '#F3F3F3', color: '#6B5448' }}>
                Batal
              </button>
              <button
                onClick={() => { setConfirmDelete(false); doDelete(selected) }}
                className="flex-1 py-3 rounded-xl font-bold text-[13px] bg-[#B60000] text-white transition-colors hover:brightness-110 active:scale-95"
              >
                Ya, Hapus
              </button>
            </div>
          </div>
        </div>
      )}
      {isSaving && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-[200]">
          <div className="bg-white p-6 rounded-2xl shadow-xl flex flex-col items-center">
            <div className="w-8 h-8 border-4 border-[#8B4A1E] border-t-transparent rounded-full animate-spin mb-4" />
            <p className="text-[13px] font-bold text-[#8B4A1E]">Menyimpan Promo...</p>
          </div>
        </div>
      )}
    </PageShell>
  )
}
