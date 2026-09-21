import { useState } from 'react'
import { AlertTriangle, Delete } from 'lucide-react'
import { HASUKA_LOGO } from '../assets/logo'
import { useApp } from '../context/AppContext'
import { gasApi } from '../services/gasApi'
import { Button } from './common/Button'
import { fmt } from '../utils/formatters'


export default function BukaShiftScreen({ onBukaShift }: { onBukaShift: () => void }) {
  const { kasirInfo, outlet } = useApp()
  const [nominal, setNominal] = useState('')
  const [catatan, setCatatan] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [errorMsg, setErrorMsg] = useState('')
  
  const getPreviousUnclosedShift = () => {
    try {
      const saved = localStorage.getItem('hasuka_active_shift')
      if (saved) {
        const shift = JSON.parse(saved)
        if (new Date(shift.startTime).toDateString() !== new Date().toDateString()) {
          return shift
        }
      }
    } catch (e) {}
    return null
  }

  const previousShift = getPreviousUnclosedShift()
  const hasPreviousShift = !!previousShift

  const handleBukaShift = async () => {
    if (!hasNominal) return
    setIsSubmitting(true)
    setErrorMsg('')
    const newShift = {
      id: Date.now().toString(),
      cashierName: kasirInfo?.name || '',
      startTime: new Date().toISOString(),
      nominal: parseInt(nominal.replace(/\D/g, ''), 10)
    }

    try {
      await gasApi.openShift({
        shift_id: newShift.id,
        date: newShift.startTime,
        cashier: newShift.cashierName,
        outlet: outlet.id,
        start_time: new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }),
        kas_awal: newShift.nominal,
        alasan: catatan
      })
      localStorage.setItem('hasuka_active_shift', JSON.stringify(newShift))
      onBukaShift()
    } catch (err: any) {
      setErrorMsg(err.message || 'Gagal membuka shift')
    } finally {
      setIsSubmitting(false)
    }
  }

  const press = (val: string) => {
    setNominal(prev => {
      const cur = prev.replace(/\D/g, '')
      if (cur === '0' || cur === '') return val
      return cur + val
    })
  }

  const del = () => setNominal(prev => prev.replace(/\D/g, '').slice(0, -1))

  const displayNominal = nominal ? parseInt(nominal.replace(/\D/g, ''), 10).toLocaleString('id-ID') : '0'
  const hasNominal = nominal.replace(/\D/g, '') !== ''

  return (
    <div className="flex flex-col sm:flex-row w-full h-full overflow-hidden" style={{ background: '#FAF6ED' }}>

      {/* Left: context + info */}
      <div className="flex flex-col flex-1 overflow-y-auto px-6 sm:px-10 py-8 sm:py-10 sm:border-r" style={{ borderColor: '#E8D7C0' }}>

        {/* Brand mark */}
        <div className="flex items-center gap-4 mb-10">
          <img src={HASUKA_LOGO} alt="Hasuka" className="w-12 h-12 object-contain rounded-full" />
          <div>
            <h1 className="font-serif font-bold text-[22px] leading-tight" style={{ color: '#2B1810' }}>Hasuka POS</h1>
            <p className="text-[12px]" style={{ color: '#6B5448' }}>Sistem Kasir · Paskal Hyper Square</p>
          </div>
        </div>

        {/* Previous shift warning */}
        {hasPreviousShift && previousShift && (
          <div
            className="flex items-start gap-4 p-4 rounded-2xl mb-8"
            style={{ background: '#FCE8E8', border: '1px solid rgba(182,0,0,0.2)' }}
          >
            <AlertTriangle size={20} color="#B60000" className="shrink-0 mt-0.5" strokeWidth={2.5} />
            <p className="text-[13px] font-semibold leading-relaxed" style={{ color: '#B60000' }}>
              Shift sebelumnya ({new Date(previousShift.startTime).toLocaleString('id-ID', { weekday: 'long', day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}) belum ditutup atau ditutup paksa. Pastikan saldo kas sudah dihitung ulang sebelum mulai.
            </p>
          </div>
        )}

        {/* Big title */}
        <h2 className="font-serif font-bold text-[32px] leading-tight mb-2" style={{ color: '#2B1810' }}>
          Buka Shift
        </h2>
        <p className="text-[15px] mb-8" style={{ color: '#6B5448' }}>
          Modal awal laci kasir sebelum mulai transaksi.
        </p>

        {/* Info box */}
        <div className="rounded-2xl p-6 mb-6" style={{ background: '#F3E7CE', border: '1px solid #E8D7C0' }}>
          <div className="space-y-3">
            {[
              { label: 'Kasir Bertugas', value: kasirInfo?.name || 'Kasir' },
              { label: 'Outlet', value: outlet.name },
              { label: 'Waktu Mulai', value: `Hari ini, ${new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })} WIB` },
            ].map(row => (
              <div key={row.label} className="flex justify-between items-center text-[14px]">
                <span style={{ color: '#6B5448' }}>{row.label}</span>
                <span className="font-bold" style={{ color: '#2B1810' }}>{row.value}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Notes */}
        <div>
          <label htmlFor="catatan-shift" className="block text-[12px] font-bold mb-2" style={{ color: '#6B5448', letterSpacing: '0.04em' }}>
            CATATAN (OPSIONAL)
          </label>
          <textarea
            id="catatan-shift"
            value={catatan}
            onChange={e => setCatatan(e.target.value)}
            className="w-full p-4 rounded-xl text-[14px] resize-none outline-none transition-colors"
            style={{
              background: 'white',
              border: '1.5px solid #E8D7C0',
              color: '#2B1810',
              height: 80,
            }}
            onFocus={e => { e.currentTarget.style.borderColor = '#8B4A1E' }}
            onBlur={e => { e.currentTarget.style.borderColor = '#E8D7C0' }}
            placeholder="Contoh: Modal lengkap, semua pecahan tersedia..."
            maxLength={200}
          />
          <p className="text-[11px] mt-1" style={{ color: '#6B5448' }}>
            {catatan.length} / 200 karakter
          </p>
        </div>
      </div>

      {/* Right: nominal input + numpad */}
      <div
        className="flex flex-col shrink-0 px-6 sm:px-8 py-6 sm:py-10 sm:w-[380px] overflow-y-auto max-h-[60vh] sm:max-h-none"
        style={{ background: '#F3E7CE', borderBottom: '1px solid #E8D7C0' }}
      >
        <p className="text-[11px] font-bold mb-2" style={{ color: '#6B5448', letterSpacing: '0.08em' }}>
          KAS AWAL
        </p>

        {/* Nominal display */}
        <div
          className="rounded-2xl p-6 mb-6 flex items-end gap-2"
          style={{
            background: 'white',
            border: `2px solid ${hasNominal ? '#8B4A1E' : '#E8D7C0'}`,
            transition: 'border-color 0.2s',
          }}
        >
          <span className="font-bold text-[18px]" style={{ color: '#6B5448' }}>Rp</span>
          <span className="font-serif font-bold text-[32px] leading-none" style={{ color: '#2B1810' }}>
            {displayNominal}
          </span>
        </div>

        {/* Quick amounts */}
        <div className="grid grid-cols-3 gap-2 mb-6">
          {[50000, 100000, 200000, 300000, 500000, 1000000].map(amt => (
            <button
              key={amt}
              onClick={() => setNominal(amt.toString())}
              className="py-2 rounded-xl text-[12px] font-bold transition-colors"
              style={{
                background: nominal === amt.toString() ? '#8B4A1E' : 'white',
                color: nominal === amt.toString() ? 'white' : '#8B4A1E',
                border: '1.5px solid #8B4A1E',
              }}
            >
              {fmt(amt)}
            </button>
          ))}
        </div>

        {/* Numpad */}
        <div className="grid grid-cols-3 gap-2 mb-6">
          {[1, 2, 3, 4, 5, 6, 7, 8, 9].map(n => (
            <button
              key={n}
              onClick={() => press(n.toString())}
              aria-label={`Angka ${n}`}
              disabled={isSubmitting}
              className="transition-all active:scale-95 disabled:opacity-50 font-bold text-[19px] rounded-xl"
              style={{
                background: 'linear-gradient(180deg, #ffffff 0%, #f9f9f9 100%)',
                color: '#2B1810',
                border: '2px solid #E8D7C0',
                height: 58,
                boxShadow: '0 2px 8px rgba(0,0,0,0.06), inset 0 1px 0 rgba(255,255,255,0.8)',
              }}
            >
              {n}
            </button>
          ))}
          <button
            onClick={del}
            aria-label="Hapus digit terakhir"
            disabled={isSubmitting}
            className="rounded-xl flex items-center justify-center transition-all active:scale-95 disabled:opacity-50"
            style={{ 
              background: 'linear-gradient(135deg, #D32F2F 0%, #B71C1C 100%)',
              border: '2px solid rgba(211,47,47,0.3)',
              height: 58,
              boxShadow: '0 4px 12px rgba(211,47,47,0.4)',
            }}
          >
            <Delete size={22} color="white" strokeWidth={2.5} />
          </button>
          <button
            onClick={() => press('0')}
            aria-label="Angka 0"
            disabled={isSubmitting}
            className="transition-all active:scale-95 disabled:opacity-50 font-bold text-[19px] rounded-xl"
            style={{
              background: 'linear-gradient(180deg, #ffffff 0%, #f9f9f9 100%)',
              color: '#2B1810',
              border: '2px solid #E8D7C0',
              height: 58,
              boxShadow: '0 2px 8px rgba(0,0,0,0.06), inset 0 1px 0 rgba(255,255,255,0.8)',
            }}
          >
            0
          </button>
          <button
            onClick={() => press('000')}
            aria-label="Tiga nol"
            disabled={isSubmitting}
            className="transition-all active:scale-95 disabled:opacity-50 font-bold text-[16px] rounded-xl"
            style={{
              background: 'linear-gradient(180deg, #ffffff 0%, #f9f9f9 100%)',
              color: '#2B1810',
              border: '2px solid #E8D7C0',
              height: 58,
              boxShadow: '0 2px 8px rgba(0,0,0,0.06), inset 0 1px 0 rgba(255,255,255,0.8)',
            }}
          >
            000
          </button>
        </div>

        {errorMsg && (
          <div role="alert" className="mb-4 p-4 rounded-xl bg-red-50 border border-red-200">
            <p className="text-[12px] font-semibold text-red-700">{errorMsg}</p>
          </div>
        )}

        {/* Confirm button */}
        <Button
          variant="primary"
          fullWidth
          onClick={handleBukaShift}
          disabled={!hasNominal || isSubmitting}
          loading={isSubmitting}
          className="py-4 text-[16px] shadow-lg hover:shadow-xl"
          style={{
            background: (hasNominal && !isSubmitting) 
              ? 'linear-gradient(135deg, #66BB6A 0%, #43A047 100%)' 
              : undefined,
            boxShadow: (hasNominal && !isSubmitting) ? '0 6px 20px rgba(67,160,71,0.4)' : undefined,
          }}
        >
          {isSubmitting ? 'Memproses...' : 'Mulai Shift'}
        </Button>

        <p className="text-center text-[11px] mt-4" style={{ color: '#6B5448' }}>
          Tercatat sebagai kas awal
        </p>
      </div>
    </div>
  )
}
