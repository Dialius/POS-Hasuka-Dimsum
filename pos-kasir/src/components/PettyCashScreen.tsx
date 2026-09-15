import { useState, useEffect } from 'react'
import { Delete, ChevronDown, Plus, Camera, Loader2 } from 'lucide-react'
import PageShell from './PageShell'
import { gasApi } from '../services/gasApi'
import { useApp } from '../context/AppContext'
import { AlertToastHost } from './Alert'

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
  const [history, setHistory] = useState<any[]>([])
  const [kasAwal, setKasAwal] = useState(0)
  const [totalKeluar, setTotalKeluar] = useState(0)
  const [toasts, setToasts] = useState<{ id: string; variant: 'success' | 'destructive'; title: string; description?: string }[]>([])
  
  const addToast = (variant: 'success' | 'destructive', title: string, description?: string) =>
    setToasts(p => [...p, { id: Date.now().toString(), variant, title, description }])

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

  const handleSubmit = async () => {
    if (!hasNominal) return
    setIsSaving(true)
    try {
      const saved = localStorage.getItem('hasuka_active_shift')
      const shiftId = saved ? JSON.parse(saved).id : ''
      
      const payload: any = {
        branch_id: outlet.id,
        shift_id: shiftId,
        date: new Date().toISOString(),
        type: 'OUT',
        amount: parseInt(nominal.replace(/\D/g, ''), 10),
        description: `[${kategori}] ${keterangan}`,
        recorded_by: kasirInfo?.name || 'Kasir'
      }
      if (editingId) payload.id = editingId

      const res = await gasApi.savePettyCash(payload)

      
      if (res.status === 'success') {
        addToast('success', editingId ? 'Perubahan berhasil disimpan.' : 'Pengeluaran berhasil dicatat.')
        setNominal('')
        setKeterangan('')
        setEditingId(null)
        loadData()
      } else {
        throw new Error(res.message || 'Unknown error')
      }
    } catch (e: any) {
      addToast('destructive', 'Gagal menyimpan', e.message)
    } finally {
      setIsSaving(false)
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Hapus data pengeluaran ini?')) return
    try {
      addToast('success', 'Menghapus data...')
      const res = await gasApi.deletePettyCash(id, outlet.id)
      if (res.status === 'success') {
        addToast('success', 'Data berhasil dihapus')
        loadData()
      } else {
        throw new Error(res.message)
      }
    } catch (e: any) {
      addToast('destructive', 'Gagal menghapus', e.message)
    }
  }

  const handleEdit = (item: any) => {
    setEditingId(item.id)
    setNominal(String(item.amount || 0))
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
          <p className="text-[11px] font-bold mb-2" style={{ color: '#6B5448', letterSpacing: '0.08em' }}>NOMINAL PENGELUARAN</p>

          <div
            className="rounded-2xl p-4 mb-4 flex items-end gap-2"
            style={{ background: 'white', border: `2px solid ${hasNominal ? '#8B4A1E' : '#E8D7C0'}` }}
          >
            <span className="font-bold text-[16px]" style={{ color: '#6B5448' }}>Rp</span>
            <span className="font-serif font-bold text-[28px] leading-none" style={{ color: '#2B1810' }}>{displayNominal}</span>
          </div>

          {/* Numpad */}
          <div className="grid grid-cols-3 gap-2 mb-4">
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
          <div className="mb-3 relative">
            <label className="block text-[11px] font-bold mb-1.5" style={{ color: '#6B5448', letterSpacing: '0.06em' }}>KATEGORI</label>
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
          <div className="mb-4">
            <label className="block text-[11px] font-bold mb-1.5" style={{ color: '#6B5448', letterSpacing: '0.06em' }}>KETERANGAN</label>
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

          {/* Foto struk */}
          <button
            className="w-full py-2.5 rounded-xl flex items-center justify-center gap-2 text-[13px] font-semibold mb-4 transition-colors"
            style={{ background: 'white', border: '1.5px dashed #C49A62', color: '#6B5448' }}
          >
            <Camera size={16} />
            Foto Struk / Bukti (Opsional)
          </button>

          {/* Submit */}
          <div className="mt-auto flex gap-2">
            {editingId && (
              <button
                disabled={isSaving}
                onClick={() => {
                  setEditingId(null)
                  setNominal('')
                  setKeterangan('')
                }}
                className="w-1/3 py-3.5 rounded-xl font-bold text-[14px] flex items-center justify-center transition-all bg-white"
                style={{ border: '1.5px solid #E8D7C0', color: '#6B5448' }}
              >
                Batal
              </button>
            )}
            <button
              disabled={!hasNominal || isSaving}
              onClick={handleSubmit}
              className="flex-1 py-3.5 rounded-xl font-bold text-[14px] flex items-center justify-center gap-2 transition-all"
              style={{
                background: (hasNominal && !isSaving) ? '#8B4A1E' : '#C49A62',
                color: 'white',
                opacity: (hasNominal && !isSaving) ? 1 : 0.6,
                cursor: (hasNominal && !isSaving) ? 'pointer' : 'not-allowed',
              }}
            >
              {isSaving ? <Loader2 size={18} className="animate-spin" /> : (editingId ? null : <Plus size={18} />)}
              {isSaving ? 'Menyimpan...' : (editingId ? 'Simpan Perubahan' : 'Simpan Pengeluaran')}
            </button>
          </div>
        </div>
      }
    >
      {/* Left: history */}
      <div className="px-4 sm:px-6 py-4 sm:py-5">

        {/* Balance overview */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-5">
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

        {/* History list */}
        <div className="rounded-2xl overflow-hidden" style={{ background: 'white', border: '1px solid #E8D7C0' }}>
          <div className="px-5 py-4" style={{ borderBottom: '1px solid #E8D7C0' }}>
            <h2 className="font-serif font-bold text-[15px]" style={{ color: '#2B1810' }}>Riwayat Pengeluaran — Hari Ini</h2>
          </div>
          {isLoading ? (
            <div className="flex justify-center items-center py-8 text-[#8B4A1E]">
              <Loader2 className="animate-spin" size={24} />
            </div>
          ) : history.length === 0 ? (
            <div className="px-5 py-8 text-center text-[13px]" style={{ color: '#6B5448' }}>
              Belum ada pengeluaran shift ini.
            </div>
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
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className="text-[10px]" style={{ color: '#C49A62' }}>{timeStr} · {item.recorded_by}</span>
                    </div>
                  </div>
                  <div className="flex flex-col items-end gap-1 shrink-0">
                    <span className="font-bold text-[14px]" style={{ color: '#B60000' }}>-{fmt(item.amount)}</span>
                    <div className="flex items-center gap-2 mt-1">
                      <button onClick={() => handleEdit(item)} className="text-[11px] font-bold px-2 py-0.5 rounded bg-[#F3E7CE] text-[#8B4A1E]">Edit</button>
                      <button onClick={() => handleDelete(item.id)} className="text-[11px] font-bold px-2 py-0.5 rounded bg-[#FCE8E8] text-[#B60000]">Hapus</button>
                    </div>
                  </div>
                </div>
              )
            })
          )}
        </div>
      </div>
    </PageShell>
    <AlertToastHost toasts={toasts} onDismiss={id => setToasts(p => p.filter(t => t.id !== id))} />
    </>
  )
}
