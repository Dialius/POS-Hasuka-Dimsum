import { useState } from 'react'
import { AlertTriangle, Delete } from 'lucide-react'
import { HASUKA_LOGO } from '../assets/logo'

const fmt = (n: number) => `Rp ${n.toLocaleString('id-ID')}`

export default function BukaShiftScreen({ onBukaShift }: { onBukaShift: () => void }) {
  const [nominal, setNominal] = useState('')
  const [catatan, setCatatan] = useState('')
  const hasPreviousShift = true

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
    <div className="flex w-full h-full overflow-hidden" style={{ background: '#FAF6ED' }}>

      {/* Left: context + info */}
      <div className="flex flex-col flex-1 overflow-y-auto px-10 py-10" style={{ borderRight: '1px solid #E8D7C0' }}>

        {/* Brand mark */}
        <div className="flex items-center gap-3 mb-10">
          <img src={HASUKA_LOGO} alt="Hasuka" className="w-12 h-12 object-contain rounded-full" />
          <div>
            <h1 className="font-serif font-bold text-[22px] leading-tight" style={{ color: '#2B1810' }}>Hasuka POS</h1>
            <p className="text-[12px]" style={{ color: '#6B5448' }}>Sistem Kasir · Paskal Hyper Square</p>
          </div>
        </div>

        {/* Previous shift warning */}
        {hasPreviousShift && (
          <div
            className="flex items-start gap-3 p-4 rounded-2xl mb-8"
            style={{ background: '#FCE8E8', border: '1px solid rgba(182,0,0,0.2)' }}
          >
            <AlertTriangle size={20} color="#B60000" className="shrink-0 mt-0.5" strokeWidth={2.5} />
            <p className="text-[13px] font-semibold leading-relaxed" style={{ color: '#B60000' }}>
              Shift sebelumnya ditutup paksa oleh Admin. Pastikan saldo kas sudah dihitung ulang sebelum mulai.
            </p>
          </div>
        )}

        {/* Big title */}
        <h2 className="font-serif font-bold text-[32px] leading-tight mb-2" style={{ color: '#2B1810' }}>
          Buka Shift Baru
        </h2>
        <p className="text-[15px] mb-8" style={{ color: '#6B5448' }}>
          Masukkan modal awal laci kasir dengan akurat sebelum memulai transaksi.
        </p>

        {/* Info box */}
        <div className="rounded-2xl p-5 mb-6" style={{ background: '#F3E7CE', border: '1px solid #E8D7C0' }}>
          <div className="space-y-3">
            {[
              { label: 'Kasir Bertugas', value: 'Sri Wahyuni' },
              { label: 'Outlet', value: 'Hasuka Dimsum — Paskal' },
              { label: 'Waktu Mulai', value: 'Hari ini, 15:42 WIB' },
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
          <label className="block text-[12px] font-bold mb-2" style={{ color: '#6B5448', letterSpacing: '0.04em' }}>
            CATATAN BUKA SHIFT (OPSIONAL)
          </label>
          <textarea
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
          />
        </div>
      </div>

      {/* Right: nominal input + numpad */}
      <div
        className="flex flex-col shrink-0 px-8 py-10"
        style={{ width: 380, background: '#F3E7CE' }}
      >
        <p className="text-[11px] font-bold mb-2" style={{ color: '#6B5448', letterSpacing: '0.08em' }}>
          MODAL AWAL KAS (CASH IN)
        </p>

        {/* Nominal display */}
        <div
          className="rounded-2xl p-5 mb-6 flex items-end gap-2"
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
        <div className="grid grid-cols-3 gap-2 mb-5">
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
        <div className="grid grid-cols-3 gap-2 mb-5">
          {[1, 2, 3, 4, 5, 6, 7, 8, 9].map(n => (
            <button
              key={n}
              onClick={() => press(n.toString())}
              className="py-4 rounded-xl font-extrabold text-[22px] transition-colors"
              style={{ background: 'white', color: '#2B1810', border: '1px solid #E8D7C0' }}
            >
              {n}
            </button>
          ))}
          <button
            onClick={del}
            className="py-4 rounded-xl flex items-center justify-center transition-colors"
            style={{ background: '#B60000', border: '1px solid #B60000' }}
          >
            <Delete size={22} color="white" strokeWidth={2.5} />
          </button>
          <button
            onClick={() => press('0')}
            className="py-4 rounded-xl font-extrabold text-[22px] transition-colors"
            style={{ background: 'white', color: '#2B1810', border: '1px solid #E8D7C0' }}
          >
            0
          </button>
          <button
            onClick={() => press('000')}
            className="py-4 rounded-xl font-bold text-[16px] transition-colors"
            style={{ background: 'white', color: '#2B1810', border: '1px solid #E8D7C0' }}
          >
            000
          </button>
        </div>

        {/* Confirm button */}
        <button
          onClick={() => hasNominal && onBukaShift()}
          disabled={!hasNominal}
          className="w-full py-4 rounded-xl font-bold text-[16px] transition-all"
          style={{
            background: hasNominal ? '#8B4A1E' : '#C49A62',
            color: 'white',
            opacity: hasNominal ? 1 : 0.6,
            cursor: hasNominal ? 'pointer' : 'not-allowed',
          }}
        >
          Mulai Shift & Buka Laci
        </button>

        <p className="text-center text-[11px] mt-3" style={{ color: '#6B5448' }}>
          Nominal akan tercatat sebagai kas awal hari ini
        </p>
      </div>
    </div>
  )
}
