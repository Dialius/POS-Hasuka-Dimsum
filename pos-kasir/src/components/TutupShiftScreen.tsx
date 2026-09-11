import { useState, useEffect } from 'react'
import { Delete, Check, Loader2 } from 'lucide-react'
import PageShell from './PageShell'
import { gasApi } from '../services/gasApi'
import { useApp } from '../context/AppContext'

const fmt = (n: number) => `Rp ${n.toLocaleString('id-ID')}`

const PENJUALAN_TUNAI = 3750000
const REFUND = 150000
const PENGELUARAN = 85000

export default function TutupShiftScreen({ onShiftClose, onBack }: { onShiftClose: () => void; onBack: () => void }) {
  const { kasirInfo, outlet } = useApp()
  const [inputLaci, setInputLaci] = useState('')
  const [alasan, setAlasan] = useState('')
  const [isSaving, setIsSaving] = useState(false)
  
  const [activeShift, setActiveShift] = useState<any>(null)
  
  useEffect(() => {
    try {
      const saved = localStorage.getItem('hasuka_active_shift')
      if (saved) {
        setActiveShift(JSON.parse(saved))
      }
    } catch(e) {}
  }, [])

  const kasAwal = activeShift?.nominal || 0
  const kasSistem = kasAwal + PENJUALAN_TUNAI - REFUND - PENGELUARAN
  
  const startTimeObj = activeShift ? new Date(activeShift.startTime) : new Date()
  const durationMs = new Date().getTime() - startTimeObj.getTime()
  const durHours = Math.floor(durationMs / (1000 * 60 * 60))
  const durMins = Math.floor((durationMs % (1000 * 60 * 60)) / (1000 * 60))

  const press = (val: string) => {
    setInputLaci(prev => {
      const cur = prev.replace(/\D/g, '')
      if (cur === '0' && val !== '000') return val
      if (cur === '0' && val === '000') return '0'
      return cur + val
    })
  }
  const del = () => setInputLaci(prev => prev.replace(/\D/g, '').slice(0, -1))

  const physical = parseInt(inputLaci || '0', 10)
  const diff = physical - kasSistem
  const hasDiff = diff !== 0
  const displayLaci = inputLaci ? parseInt(inputLaci.replace(/\D/g, ''), 10).toLocaleString('id-ID') : '0'

  const rekonRows = [
    { label: 'Kas Awal Shift', val: fmt(kasAwal) },
    { label: 'Penjualan Tunai', val: fmt(PENJUALAN_TUNAI), accent: '#5B8A2E' },
    { label: 'Refund Tunai', val: `-${fmt(REFUND)}`, accent: '#B60000' },
    { label: 'Pengeluaran Kas', val: `-${fmt(PENGELUARAN)}`, accent: '#B60000' },
    { label: 'Ekspektasi Sistem', val: fmt(kasSistem), bold: true },
  ]

  return (
    <PageShell
      title="Tutup Shift"
      subtitle="Rekonsiliasi kas & penutupan sesi kasir"
      onBack={onBack}
      rightPanelWidth={380}
      rightPanel={
        <div className="px-6 py-6 flex flex-col h-full">
          <p className="text-[11px] font-bold mb-2" style={{ color: '#6B5448', letterSpacing: '0.08em' }}>KAS FISIK LACI</p>

          {/* Nominal display */}
          <div
            className="rounded-2xl p-4 mb-4 flex items-end gap-2"
            style={{ background: 'white', border: `2px solid ${physical ? '#8B4A1E' : '#E8D7C0'}` }}
          >
            <span className="font-bold text-[16px]" style={{ color: '#6B5448' }}>Rp</span>
            <span className="font-serif font-bold text-[28px] leading-none" style={{ color: '#2B1810' }}>{displayLaci}</span>
          </div>

          {/* Difference badge */}
          {inputLaci && (
            <div
              className="rounded-xl p-3 mb-4 text-center"
              style={{
                background: !hasDiff ? '#EAF4E0' : (diff < 0 ? '#FCE8E8' : '#FEF9EC'),
                border: `1px solid ${!hasDiff ? '#5B8A2E' : (diff < 0 ? '#B60000' : '#C9A227')}30`,
              }}
            >
              <p className="text-[12px] font-bold" style={{ color: !hasDiff ? '#5B8A2E' : (diff < 0 ? '#B60000' : '#C9A227') }}>
                {!hasDiff ? '✓ Kas sesuai sistem' : `Selisih ${diff > 0 ? '+' : ''}${fmt(diff)}`}
              </p>
            </div>
          )}

          {/* Numpad */}
          <div className="grid grid-cols-3 gap-2 mb-3">
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
            <button
              onClick={del}
              className="py-3.5 rounded-xl flex items-center justify-center transition-all active:scale-95"
              style={{ background: '#B60000', border: '1px solid #B60000' }}
            >
              <Delete size={20} color="white" strokeWidth={2.5} />
            </button>
            <button
              onClick={() => press('0')}
              className="py-3.5 rounded-xl font-extrabold text-[20px] transition-all active:scale-95"
              style={{ background: 'white', color: '#2B1810', border: '1px solid #E8D7C0' }}
            >
              0
            </button>
            <button
              onClick={() => press('000')}
              className="py-3.5 rounded-xl font-bold text-[14px] transition-all active:scale-95"
              style={{ background: 'white', color: '#2B1810', border: '1px solid #E8D7C0' }}
            >
              000
            </button>
          </div>

          {/* Alasan selisih */}
          {hasDiff && (
            <div className="mb-3">
              <label className="block text-[11px] font-bold mb-1.5" style={{ color: '#6B5448', letterSpacing: '0.06em' }}>
                ALASAN SELISIH
              </label>
              <textarea
                value={alasan}
                onChange={e => setAlasan(e.target.value)}
                className="w-full p-3 rounded-xl text-[12px] resize-none outline-none"
                style={{ background: 'white', border: '1.5px solid #E8D7C0', color: '#2B1810', height: 70 }}
                onFocus={e => { e.currentTarget.style.borderColor = '#8B4A1E' }}
                onBlur={e => { e.currentTarget.style.borderColor = '#E8D7C0' }}
              />
            </div>
          )}

          {/* Confirm button */}
          <button
            disabled={isSaving}
            onClick={async () => {
              setIsSaving(true)
              try {
                await gasApi.saveShiftReport({
                  cashier: kasirInfo?.name || 'Kasir',
                  outlet: outlet.name,
                  start_time: startTimeObj.toLocaleTimeString('id-ID'),
                  end_time: new Date().toLocaleTimeString('id-ID'),
                  total_transactions: 47, // Mock
                  omzet: PENJUALAN_TUNAI,
                  petty_cash: PENGELUARAN,
                  kas_awal: kasAwal,
                  kas_sistem: kasSistem,
                  kas_fisik: physical,
                  selisih: diff,
                  alasan: hasDiff ? alasan : ''
                })
                localStorage.removeItem('hasuka_active_shift')
                onShiftClose()
              } catch (error) {
                alert('Gagal menyimpan laporan shift. Silakan coba lagi.')
              } finally {
                setIsSaving(false)
              }
            }}
            className="w-full py-3.5 rounded-xl font-bold text-[14px] flex items-center justify-center gap-2 mt-auto transition-all disabled:opacity-50"
            style={{ background: '#B60000', color: 'white' }}
          >
            {isSaving ? <Loader2 size={18} className="animate-spin" /> : <Check size={18} />}
            {isSaving ? 'Menyimpan...' : 'Tutup Shift & Logout'}
          </button>
        </div>
      }
    >
      {/* Left: summary */}
      <div className="px-6 py-5 space-y-4">

        {/* Shift info */}
        <div className="rounded-2xl p-5" style={{ background: 'white', border: '1px solid #E8D7C0' }}>
          <h2 className="font-serif font-bold text-[15px] mb-4" style={{ color: '#2B1810' }}>Info Shift Berjalan</h2>
          <div className="space-y-2.5">
            {[
              { label: 'Kasir', val: kasirInfo?.name || 'Kasir' },
              { label: 'Outlet', val: outlet.name },
              { label: 'Mulai Shift', val: startTimeObj.toLocaleString('id-ID', { weekday: 'long', hour: '2-digit', minute: '2-digit' }) },
              { label: 'Durasi', val: `${durHours}j ${durMins}m` },
            ].map(r => (
              <div key={r.label} className="flex justify-between text-[13px]">
                <span style={{ color: '#6B5448' }}>{r.label}</span>
                <span className="font-bold" style={{ color: '#2B1810' }}>{r.val}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Rekonsiliasi kas */}
        <div className="rounded-2xl overflow-hidden" style={{ background: 'white', border: '1px solid #E8D7C0' }}>
          <div className="px-5 py-4" style={{ borderBottom: '1px solid #E8D7C0' }}>
            <h2 className="font-serif font-bold text-[15px]" style={{ color: '#2B1810' }}>Rekonsiliasi Kas</h2>
          </div>
          <div className="px-5 py-4 space-y-3">
            {rekonRows.map(r => (
              <div key={r.label} className="flex justify-between text-[13px]" style={{ borderBottom: r.bold ? '1px dashed #E8D7C0' : 'none', paddingBottom: r.bold ? 12 : 0 }}>
                <span style={{ color: '#6B5448' }}>{r.label}</span>
                <span className={r.bold ? 'font-extrabold' : 'font-semibold'} style={{ color: r.accent ?? '#2B1810' }}>{r.val}</span>
              </div>
            ))}
            <div className="flex justify-between text-[14px] pt-1">
              <span style={{ color: '#6B5448' }}>Kas Fisik (input)</span>
              <span className="font-extrabold" style={{ color: '#8B4A1E' }}>
                {inputLaci ? fmt(parseInt(inputLaci.replace(/\D/g, ''), 10)) : '—'}
              </span>
            </div>
          </div>
        </div>

        {/* Summary stats */}
        <div className="grid grid-cols-3 gap-3">
          {[
            { label: 'Total Transaksi', val: '47' },
            { label: 'Omzet Hari Ini', val: 'Rp 4.312.500' },
            { label: 'Petty Cash Keluar', val: fmt(PENGELUARAN) },
          ].map(c => (
            <div key={c.label} className="rounded-2xl p-4 text-center" style={{ background: '#F3E7CE', border: '1px solid #E8D7C0' }}>
              <p className="font-serif font-bold text-[18px]" style={{ color: '#2B1810' }}>{c.val}</p>
              <p className="text-[11px] mt-0.5" style={{ color: '#6B5448' }}>{c.label}</p>
            </div>
          ))}
        </div>

      </div>
    </PageShell>
  )
}
