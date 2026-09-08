import { useState } from 'react'
import { Delete, ChevronDown, Plus, Camera } from 'lucide-react'
import PageShell from './PageShell'

const fmt = (n: number) => `Rp ${n.toLocaleString('id-ID')}`

const KATEGORI_LIST = [
  'Bahan Baku (Es Batu / Garnish)',
  'Transportasi & Ongkos Kirim',
  'Peralatan & ATK',
  'Kebersihan & Sanitasi',
  'Lainnya',
]

const HISTORY = [
  { id: 1, ket: 'Beli es batu 20kg untuk prep', kat: 'Bahan Baku', nominal: 35000, time: '10:15', user: 'Sri Wahyuni' },
  { id: 2, ket: 'Ongkir bahan tambahan dari pasar', kat: 'Transportasi', nominal: 25000, time: '09:30', user: 'Sri Wahyuni' },
  { id: 3, ket: 'Beli plastik wrap roll', kat: 'Peralatan', nominal: 15000, time: '08:45', user: 'Budi Santoso' },
]

export default function PettyCashScreen({ onBack, backLabel }: { onBack: () => void; backLabel?: string }) {
  const [nominal, setNominal] = useState('')
  const [kategori, setKategori] = useState(KATEGORI_LIST[0])
  const [isDropdownOpen, setIsDropdownOpen] = useState(false)
  const [keterangan, setKeterangan] = useState('')

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

  return (
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
          <button
            disabled={!hasNominal}
            className="w-full py-3.5 rounded-xl font-bold text-[14px] flex items-center justify-center gap-2 mt-auto transition-all"
            style={{
              background: hasNominal ? '#8B4A1E' : '#C49A62',
              color: 'white',
              opacity: hasNominal ? 1 : 0.6,
              cursor: hasNominal ? 'pointer' : 'not-allowed',
            }}
          >
            <Plus size={18} />
            Simpan Pengeluaran
          </button>
        </div>
      }
    >
      {/* Left: history */}
      <div className="px-6 py-5">

        {/* Balance overview */}
        <div className="grid grid-cols-3 gap-3 mb-5">
          {[
            { label: 'Saldo Awal', val: fmt(500000) },
            { label: 'Total Keluar', val: fmt(85000), color: '#B60000' },
            { label: 'Saldo Tersisa', val: fmt(415000), color: '#5B8A2E' },
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
          {HISTORY.map((item, i) => (
            <div
              key={item.id}
              className="flex items-start gap-4 px-5 py-4"
              style={{ borderBottom: i < HISTORY.length - 1 ? '1px solid #F3E7CE' : 'none' }}
            >
              <div className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0" style={{ background: '#FCE8E8' }}>
                <span className="text-[14px]" style={{ color: '#B60000' }}>↓</span>
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-bold text-[13px]" style={{ color: '#2B1810' }}>{item.ket}</p>
                <div className="flex items-center gap-2 mt-0.5">
                  <span className="text-[10px] px-2 py-0.5 rounded-full font-semibold" style={{ background: '#F3E7CE', color: '#6B5448' }}>{item.kat}</span>
                  <span className="text-[10px]" style={{ color: '#C49A62' }}>{item.time} · {item.user}</span>
                </div>
              </div>
              <span className="font-bold text-[14px] shrink-0" style={{ color: '#B60000' }}>-{fmt(item.nominal)}</span>
            </div>
          ))}
        </div>
      </div>
    </PageShell>
  )
}
