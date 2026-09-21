import { useState, useEffect, useRef } from 'react'
import { Delete, ChevronDown, Plus, Camera, Loader2, AlertTriangle, X, ExternalLink, Image as ImageIcon, Wallet } from 'lucide-react'
import PageShell from './PageShell'
import { gasApi } from '../services/gasApi'
import { useApp } from '../context/AppContext'
import { AlertToastHost } from './Alert'
import { EmptyState } from './common/EmptyState'

const fmt = (n: number) => `Rp ${n.toLocaleString('id-ID')}`

const KATEGORI_LIST = [
  'Bahan Baku (Es Batu / Garnish)',
  'Transportasi & Ongkos Kirim',
  'Peralatan & ATK',
  'Kebersihan & Sanitasi',
  'Lainnya',
]

export default function PettyCashScreen({ onBack, backLabel }: { onBack: () => void; backLabel?: string }) {
  const { outlet, kasirInfo } = useApp()
  const [nominal, setNominal] = useState('')
  const [kategori, setKategori] = useState(KATEGORI_LIST[0])
  const [isDropdownOpen, setIsDropdownOpen] = useState(false)
  const [keterangan, setKeterangan] = useState('')
  const [editingId, setEditingId] = useState<string | null>(null)
  
  const [isSaving, setIsSaving] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [isDeleting, setIsDeleting] = useState(false)
  const [itemToDelete, setItemToDelete] = useState<any | null>(null)

  // Foto bukti struk
  const [receiptFile, setReceiptFile] = useState<File | null>(null)
  const [receiptPreview, setReceiptPreview] = useState<string | null>(null)
  const [isUploadingPhoto, setIsUploadingPhoto] = useState(false)
  const [previewModalUrl, setPreviewModalUrl] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement | null>(null)

  const [history, setHistory] = useState<any[]>([])
  const [kasAwal, setKasAwal] = useState(0)
  const [totalKeluar, setTotalKeluar] = useState(0)
  const [toasts, setToasts] = useState<{ id: string; variant: 'success' | 'destructive'; title: string; description?: string }[]>([])
  
  const addToast = (variant: 'success' | 'destructive', title: string, description?: string) =>
    setToasts(p => p.some(x => x.title === title && x.description === description) ? p : [...p, { id: Date.now().toString(), variant, title, description }])

  const loadData = async () => {
    setIsLoading(true)
    try {
      const saved = localStorage.getItem('hasuka_active_shift')
      let shiftStart = new Date().setHours(0,0,0,0)
      let initialCash = 0
      if (saved) {
        const shiftInfo = JSON.parse(saved)
        shiftStart = new Date(shiftInfo.startTime).getTime()
        initialCash = shiftInfo.nominal || 0
      }
      setKasAwal(initialCash)

      const parseTs = (ts: string): Date => {
        if (!ts) return new Date(0)
        // Handle "yyyy-MM-dd HH:mm:ss" from Google Sheets
        if (/^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}/.test(ts)) {
          return new Date(ts.replace(' ', 'T') + '+07:00')
        }
        return new Date(ts)
      }

      const res = await gasApi.getBranchReportData(outlet.id)
      if (res && res.pettyCash) {
        let currentShiftPettyCash: any[] = []
        let currentTotalKeluar = 0
        
        res.pettyCash.forEach((pc: any) => {
          const pcTime = parseTs(String(pc.date || '')).getTime()
          if (pcTime >= shiftStart && String(pc.type).toUpperCase() === 'OUT') {
            currentTotalKeluar += Number(pc.amount)
            currentShiftPettyCash.push(pc)
          }
        })
        
        currentShiftPettyCash.sort((a, b) => parseTs(String(b.date || '')).getTime() - parseTs(String(a.date || '')).getTime())
        setTotalKeluar(currentTotalKeluar)
        setHistory(currentShiftPettyCash)
      }
    } catch (e: any) {
      addToast('destructive', 'Gagal memuat data', e.message)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [outlet.id])

  const handlePhotoSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    if (!file.type.startsWith('image/')) {
      addToast('destructive', 'Format tidak didukung', 'Silakan pilih file gambar (JPG/PNG).')
      return
    }
    setReceiptFile(file)
    const reader = new FileReader()
    reader.onload = () => setReceiptPreview(reader.result as string)
    reader.readAsDataURL(file)
  }

  const handleSubmit = async () => {
    if (!hasNominal) return
    setIsSaving(true)
    try {
      const saved = localStorage.getItem('hasuka_active_shift')
      const shiftId = saved ? JSON.parse(saved).id : ''
      const amountVal = parseInt(nominal.replace(/\D/g, ''), 10)
      
      let receiptUrl = ''
      if (receiptFile) {
        setIsUploadingPhoto(true)
        addToast('success', 'Mengunggah foto bukti ke Google Drive...')
        receiptUrl = await gasApi.uploadImage(
          receiptFile,
          `bukti_${Date.now()}.jpg`,
          false,
          {
            type: 'petty_cash',
            branch_name: outlet.name,
            category: kategori,
            amount: amountVal
          }
        )
      } else if (editingId && receiptPreview && receiptPreview.startsWith('http')) {
        receiptUrl = receiptPreview
      }

      const payload: any = {
        branch_id: outlet.id,
        shift_id: shiftId,
        date: new Date().toISOString(),
        type: 'OUT',
        amount: amountVal,
        description: `[${kategori}] ${keterangan}`,
        recorded_by: kasirInfo?.name || 'Kasir'
      }
      if (receiptUrl) payload.receipt_url = receiptUrl
      if (editingId) payload.id = editingId

      const res = await gasApi.savePettyCash(payload)

      if (res.status === 'success') {
        addToast('success', editingId ? 'Perubahan berhasil disimpan.' : 'Pengeluaran & bukti foto berhasil dicatat.')
        setNominal('')
        setKeterangan('')
        setReceiptFile(null)
        setReceiptPreview(null)
        setEditingId(null)
        loadData()
      } else {
        throw new Error(res.message || 'Unknown error')
      }
    } catch (e: any) {
      addToast('destructive', 'Gagal menyimpan', e.message)
    } finally {
      setIsSaving(false)
      setIsUploadingPhoto(false)
    }
  }

  const handleDelete = async () => {
    if (!itemToDelete) return
    setIsDeleting(true)
    try {
      const res = await gasApi.deletePettyCash(itemToDelete.id, outlet.id)
      if (res.status === 'success') {
        addToast('success', 'Data pengeluaran kas kecil berhasil dihapus.')
        setItemToDelete(null)
        loadData()
      } else {
        throw new Error(res.message || 'Gagal menghapus')
      }
    } catch (e: any) {
      addToast('destructive', 'Gagal menghapus pengeluaran', e.message)
    } finally {
      setIsDeleting(false)
    }
  }

  const handleEdit = (item: any) => {
    setEditingId(item.id)
    setNominal(String(item.amount || 0))
    if (item.receipt_url) {
      setReceiptPreview(item.receipt_url)
    } else {
      setReceiptPreview(null)
      setReceiptFile(null)
    }
    // extract category and notes
    const match = String(item.description || '').match(/^\[(.*?)\] (.*)$/)
    if (match) {
      setKategori(match[1])
      setKeterangan(match[2])
    } else {
      setKategori(KATEGORI_LIST[4])
      setKeterangan(item.description || '')
    }
  }

  const press = (val: string) => {
    setNominal(prev => {
      const cur = prev.replace(/\D/g, '')
      if (cur === '0' && val !== '000') return val
      if (cur === '0' && val === '000') return '0'
      return cur + val
    })
  }
  const del = () => setNominal(prev => prev.replace(/\D/g, '').slice(0, -1))

  const displayNominal = nominal ? parseInt(nominal.replace(/\D/g, ''), 10).toLocaleString('id-ID') : '0'
  const hasNominal = nominal.replace(/\D/g, '') !== ''
  const saldoTersisa = kasAwal - totalKeluar

  return (
    <>
    <PageShell
      title="Petty Cash"
      subtitle="Catat pengeluaran kas kecil harian"
      onBack={onBack}
      backLabel={backLabel}
      rightPanelWidth={380}
      rightPanel={
        <div className="px-6 py-6 flex flex-col h-full">
          <p className="text-[11px] font-bold mb-8" style={{ color: '#6B5448', letterSpacing: '0.08em' }}>NOMINAL</p>

          <div
            className="rounded-2xl p-16 mb-16 flex items-end gap-8"
            style={{ background: 'white', border: `2px solid ${hasNominal ? '#8B4A1E' : '#E8D7C0'}` }}
          >
            <span className="font-bold text-[16px]" style={{ color: '#6B5448' }}>Rp</span>
            <span className="font-serif font-bold text-[28px] leading-none" style={{ color: '#2B1810' }}>{displayNominal}</span>
          </div>

          {/* Numpad */}
          <div className="grid grid-cols-3 gap-8 mb-16">
            {[1, 2, 3, 4, 5, 6, 7, 8, 9].map(n => (
              <button
                key={n}
                onClick={() => press(n.toString())}
                className="py-3.5 rounded-xl font-extrabold text-[20px] transition-all active:scale-95"
                style={{ background: 'white', color: '#2B1810', border: '1px solid #E8D7C0' }}
              >
                {n}
              </button>
            ))}
            <button onClick={del} className="py-3.5 rounded-xl flex items-center justify-center active:scale-95" style={{ background: '#B60000', border: '1px solid #B60000' }}>
              <Delete size={20} color="white" strokeWidth={2.5} />
            </button>
            <button onClick={() => press('0')} className="py-3.5 rounded-xl font-extrabold text-[20px] active:scale-95" style={{ background: 'white', color: '#2B1810', border: '1px solid #E8D7C0' }}>0</button>
            <button onClick={() => press('000')} className="py-3.5 rounded-xl font-bold text-[14px] active:scale-95" style={{ background: 'white', color: '#2B1810', border: '1px solid #E8D7C0' }}>000</button>
          </div>

          {/* Kategori dropdown */}
          <div className="mb-8 relative">
            <label className="block text-[11px] font-bold mb-8" style={{ color: '#6B5448', letterSpacing: '0.06em' }}>KATEGORI</label>
            <button
              onClick={() => setIsDropdownOpen(!isDropdownOpen)}
              className="w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-[13px] font-semibold"
              style={{ background: 'white', border: '1.5px solid #E8D7C0', color: '#2B1810' }}
            >
              <span className="truncate">{kategori}</span>
              <ChevronDown size={16} color="#6B5448" className={`shrink-0 transition-transform ${isDropdownOpen ? 'rotate-180' : ''}`} />
            </button>
            {isDropdownOpen && (
              <div className="absolute top-full left-0 right-0 z-10 rounded-xl mt-1 overflow-hidden shadow-lg" style={{ background: 'white', border: '1px solid #E8D7C0' }}>
                {KATEGORI_LIST.map(k => (
                  <button
                    key={k}
                    onClick={() => { setKategori(k); setIsDropdownOpen(false) }}
                    className="w-full text-left px-4 py-2.5 text-[13px] transition-colors hover:bg-surface"
                    style={{ color: k === kategori ? '#8B4A1E' : '#2B1810', fontWeight: k === kategori ? 700 : 400 }}
                  >
                    {k}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Keterangan */}
          <div className="mb-16">
            <label className="block text-[11px] font-bold mb-8" style={{ color: '#6B5448', letterSpacing: '0.06em' }}>KETERANGAN</label>
            <textarea
              value={keterangan}
              onChange={e => setKeterangan(e.target.value)}
              className="w-full p-3 rounded-xl text-[13px] resize-none outline-none"
              style={{ background: 'white', border: '1.5px solid #E8D7C0', color: '#2B1810', height: 64 }}
              onFocus={e => { e.currentTarget.style.borderColor = '#8B4A1E' }}
              onBlur={e => { e.currentTarget.style.borderColor = '#E8D7C0' }}
              placeholder="Deskripsi singkat pengeluaran..."
            />
          </div>

          {/* Foto struk / bukti */}
          <div className="mb-16">
            <input
              type="file"
              ref={fileInputRef}
              onChange={handlePhotoSelect}
              accept="image/*"
              className="hidden"
            />
            {receiptPreview ? (
              <div className="rounded-xl p-3 bg-white border border-[#E8D7C0] flex items-center gap-3">
                <div
                  className="w-12 h-12 rounded-lg bg-gray-100 overflow-hidden shrink-0 border border-[#E8D7C0] cursor-pointer"
                  onClick={() => setPreviewModalUrl(receiptPreview)}
                  title="Klik untuk memperbesar foto"
                >
                  <img src={receiptPreview} alt="Bukti" className="w-full h-full object-cover" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-bold text-[12px] truncate" style={{ color: '#2B1810' }}>
                    {receiptFile ? receiptFile.name : 'Bukti Foto Terlampir'}
                  </p>
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="text-[11px] font-semibold text-[#8B4A1E] hover:underline"
                  >
                    Ganti Foto
                  </button>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setReceiptFile(null)
                    setReceiptPreview(null)
                    if (fileInputRef.current) fileInputRef.current.value = ''
                  }}
                  className="w-7 h-7 rounded-lg flex items-center justify-center text-gray-400 hover:text-red-600 hover:bg-red-50 transition-colors"
                  title="Hapus foto"
                >
                  <X size={15} />
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="w-full py-3 rounded-xl flex items-center justify-center gap-2 text-[13px] font-semibold transition-colors hover:bg-amber-50"
                style={{ background: 'white', border: '1.5px dashed #C49A62', color: '#6B5448' }}
              >
                <Camera size={16} color="#8B4A1E" />
                <span>Foto Struk / Bukti (Upload ke Drive)</span>
              </button>
            )}
          </div>

          {/* Submit */}
          <div className="mt-auto flex gap-8">
            {editingId && (
              <button
                disabled={isSaving || isUploadingPhoto}
                onClick={() => {
                  setEditingId(null)
                  setNominal('')
                  setKeterangan('')
                  setReceiptFile(null)
                  setReceiptPreview(null)
                }}
                className="w-1/3 py-3.5 rounded-xl font-bold text-[14px] flex items-center justify-center transition-all bg-white"
                style={{ border: '1.5px solid #E8D7C0', color: '#6B5448' }}
              >
                Batal
              </button>
            )}
            <button
              disabled={!hasNominal || isSaving || isUploadingPhoto}
              onClick={handleSubmit}
              className="flex-1 py-3.5 rounded-xl font-bold text-[14px] flex items-center justify-center gap-2 transition-all"
              style={{
                background: (hasNominal && !isSaving && !isUploadingPhoto) ? '#8B4A1E' : '#C49A62',
                color: 'white',
                opacity: (hasNominal && !isSaving && !isUploadingPhoto) ? 1 : 0.6,
                cursor: (hasNominal && !isSaving && !isUploadingPhoto) ? 'pointer' : 'not-allowed',
              }}
            >
              {(isSaving || isUploadingPhoto) ? (
                <>
                  <Loader2 size={18} className="animate-spin" />
                  <span>{isUploadingPhoto ? 'Mengunggah Foto ke Drive...' : 'Menyimpan...'}</span>
                </>
              ) : (
                <>
                  {editingId ? null : <Plus size={18} />}
                  <span>{editingId ? 'Simpan Perubahan' : 'Simpan Pengeluaran'}</span>
                </>
              )}
            </button>
          </div>
        </div>
      }
    >
      {/* Left: history */}
      <div className="px-4 sm:px-6 py-4 sm:py-5">

        {/* Balance overview */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-8 mb-16">
          {[
            { label: 'Saldo Awal Shift', val: isLoading ? '-' : fmt(kasAwal) },
            { label: 'Total Keluar', val: isLoading ? '-' : fmt(totalKeluar), color: '#B60000' },
            { label: 'Sisa Saldo Awal', val: isLoading ? '-' : fmt(saldoTersisa), color: saldoTersisa >= 0 ? '#5B8A2E' : '#B60000' },
          ].map(c => (
            <div key={c.label} className="rounded-2xl p-4 text-center" style={{ background: 'white', border: '1px solid #E8D7C0' }}>
              <p className="font-serif font-bold text-[18px]" style={{ color: c.color ?? '#2B1810' }}>{c.val}</p>
              <p className="text-[11px] mt-0.5" style={{ color: '#6B5448' }}>{c.label}</p>
            </div>
          ))}
        </div>

        <div className="rounded-2xl overflow-hidden" style={{ background: 'white', border: '1px solid #E8D7C0' }}>
          <div className="px-5 py-4" style={{ borderBottom: '1px solid #E8D7C0' }}>
            <h2 className="font-serif font-bold text-[15px]" style={{ color: '#2B1810' }}>Riwayat Pengeluaran — Hari Ini</h2>
          </div>
          {isLoading ? (
            <div className="flex justify-center items-center py-8 text-[#8B4A1E]">
              <Loader2 className="animate-spin" size={24} />
            </div>
          ) : history.length === 0 ? (
            <EmptyState 
              icon={<Wallet size={48} style={{ opacity: 0.5, color: '#8B4A1E' }} />}
              title="Belum ada entry"
              description="Catat pemasukan atau pengeluaran kas"
              size="sm"
            />
          ) : (
            history.map((item, i) => {
              const parseTs = (ts: string) => {
                if (!ts) return new Date(0)
                if (/^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}/.test(ts)) return new Date(ts.replace(' ', 'T') + '+07:00')
                return new Date(ts)
              }
              const timeStr = parseTs(String(item.date || '')).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })
              return (
                <div
                  key={item.id}
                  className="flex items-start gap-4 px-5 py-4"
                  style={{ borderBottom: i < history.length - 1 ? '1px solid #F3E7CE' : 'none' }}
                >
                  <div className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0" style={{ background: '#FCE8E8' }}>
                    <span className="text-[14px]" style={{ color: '#B60000' }}>↓</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-bold text-[13px]" style={{ color: '#2B1810' }}>{item.description}</p>
                    <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                      <span className="text-[10px]" style={{ color: '#C49A62' }}>{timeStr} · {item.recorded_by}</span>
                      {item.receipt_url && (
                        <button
                          type="button"
                          onClick={() => setPreviewModalUrl(item.receipt_url)}
                          className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-[#EAF4E0] text-[#5B8A2E] hover:underline"
                        >
                          <ImageIcon size={11} />
                          <span>Lihat Bukti Foto</span>
                        </button>
                      )}
                    </div>
                  </div>
                  <div className="flex flex-col items-end gap-1 shrink-0">
                    <span className="font-bold text-[14px]" style={{ color: '#B60000' }}>-{fmt(item.amount)}</span>
                    <div className="flex items-center gap-2 mt-1">
                      {item.receipt_url && (
                        <button
                          onClick={() => setPreviewModalUrl(item.receipt_url)}
                          className="text-[11px] font-bold px-2 py-0.5 rounded bg-[#FAF6ED] text-[#8B4A1E] border border-[#E8D7C0]"
                          title="Lihat foto bukti"
                        >
                          Foto
                        </button>
                      )}
                      <button onClick={() => handleEdit(item)} className="text-[11px] font-bold px-2 py-0.5 rounded bg-[#F3E7CE] text-[#8B4A1E]">Edit</button>
                      <button onClick={() => setItemToDelete(item)} className="text-[11px] font-bold px-2 py-0.5 rounded bg-[#FCE8E8] text-[#B60000]">Hapus</button>
                    </div>
                  </div>
                </div>
              )
            })
          )}
        </div>
      </div>

      {/* Modal Konfirmasi Hapus Petty Cash Custom */}
      {itemToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-white rounded-3xl p-6 max-w-sm w-full shadow-2xl border border-[#E8D7C0] animate-in fade-in zoom-in-95 duration-150">
            <div className="w-12 h-12 rounded-full bg-[#FFF4F4] border border-[#FCE8E8] flex items-center justify-center mx-auto mb-4">
              <AlertTriangle size={24} color="#B60000" />
            </div>
            <h3 className="font-serif font-bold text-[18px] text-center mb-2" style={{ color: '#2B1810' }}>
              Hapus Pengeluaran Kas?
            </h3>
            <p className="text-[13px] text-center mb-1" style={{ color: '#6B5448' }}>
              Yakin ingin menghapus catatan pengeluaran kas kecil ini?
            </p>
            <div className="p-3 my-3 rounded-2xl bg-[#FAF6ED] border border-[#E8D7C0] text-center">
              <p className="font-bold text-[14px]" style={{ color: '#B60000' }}>-{fmt(itemToDelete.amount)}</p>
              <p className="text-[12px] truncate" style={{ color: '#2B1810' }}>{itemToDelete.description}</p>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => setItemToDelete(null)}
                disabled={isDeleting}
                className="flex-1 py-3 rounded-xl font-bold text-[13px] border border-[#E8D7C0] text-[#6B5448] hover:bg-gray-50 transition-colors"
              >
                Batal
              </button>
              <button
                onClick={handleDelete}
                disabled={isDeleting}
                className="flex-1 py-3 rounded-xl font-bold text-[13px] text-white flex items-center justify-center gap-1.5 transition-all shadow-md active:scale-95"
                style={{ background: '#B60000' }}
              >
                {isDeleting ? (
                  <>
                    <Loader2 size={16} className="animate-spin" />
                    <span>Menghapus...</span>
                  </>
                ) : (
                  'Ya, Hapus'
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Preview Foto Struk Google Drive */}
      {previewModalUrl && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4" onClick={() => setPreviewModalUrl(null)}>
          <div className="bg-white rounded-3xl p-5 max-w-lg w-full shadow-2xl border border-[#E8D7C0] flex flex-col items-center animate-in fade-in zoom-in-95 duration-150" onClick={e => e.stopPropagation()}>
            <div className="w-full flex items-center justify-between pb-3 mb-3 border-b border-[#E8D7C0]">
              <div className="flex items-center gap-2">
                <ImageIcon size={18} color="#8B4A1E" />
                <h4 className="font-serif font-bold text-[16px]" style={{ color: '#2B1810' }}>Bukti Foto Kas Kecil</h4>
              </div>
              <button
                onClick={() => setPreviewModalUrl(null)}
                className="w-8 h-8 rounded-lg flex items-center justify-center hover:bg-gray-100 text-gray-500"
              >
                <X size={18} />
              </button>
            </div>
            <div className="w-full max-h-[65vh] overflow-hidden rounded-2xl bg-black/5 flex items-center justify-center mb-4 p-1">
              <img src={previewModalUrl} alt="Bukti Foto" className="max-h-[60vh] w-auto max-w-full object-contain rounded-xl shadow-sm" />
            </div>
            <div className="w-full flex justify-end gap-2">
              <a
                href={previewModalUrl}
                target="_blank"
                rel="noreferrer"
                className="px-4 py-2.5 rounded-xl font-bold text-[12px] flex items-center gap-1.5 transition-colors hover:brightness-95"
                style={{ background: '#F3E7CE', color: '#8B4A1E' }}
              >
                <ExternalLink size={14} />
                <span>Buka di Google Drive</span>
              </a>
              <button
                onClick={() => setPreviewModalUrl(null)}
                className="px-5 py-2.5 rounded-xl font-bold text-[12px] text-white"
                style={{ background: '#8B4A1E' }}
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}
    </PageShell>
    <AlertToastHost toasts={toasts} onDismiss={id => setToasts(p => p.filter(t => t.id !== id))} />
    </>
  )
}
