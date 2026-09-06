import { useState } from 'react'
import { Printer, Users, Home, Percent, QrCode, Link2, AlertTriangle, UploadCloud, ToggleLeft, ToggleRight } from 'lucide-react'
import PageShell from './PageShell'

const TABS = [
  { id: 'pajak', label: 'Pajak & Biaya', icon: Percent },
  { id: 'printer', label: 'Printer & Struk', icon: Printer },
  { id: 'qris', label: 'Metode QRIS', icon: QrCode },
  { id: 'outlet', label: 'Detail Outlet', icon: Home },
  { id: 'users', label: 'User & Akses', icon: Users },
  { id: 'integrasi', label: 'Integrasi', icon: Link2 },
]

export default function SettingsScreen({ onBack }: { onBack: () => void }) {
  const [activeTab, setActiveTab] = useState('pajak')
  const [isPajakActive, setIsPajakActive] = useState(true)
  const [pajakRate, setPajakRate] = useState(11)
  const [serviceCharge, setServiceCharge] = useState(0)
  const [qrisMode, setQrisMode] = useState<'dinamis' | 'statis'>('statis')

  const simPrice = 24000
  const simPajak = isPajakActive ? Math.round(simPrice * pajakRate / 100) : 0
  const simService = Math.round(simPrice * serviceCharge / 100)
  const simTotal = simPrice + simPajak + simService

  const fmt = (n: number) => `Rp ${n.toLocaleString('id-ID')}`

  const Toggle = ({ on, onToggle }: { on: boolean; onToggle: () => void }) => (
    <button onClick={onToggle} className="transition-all" style={{ color: on ? '#5B8A2E' : '#C49A62' }}>
      {on ? <ToggleRight size={32} /> : <ToggleLeft size={32} />}
    </button>
  )

  const PajakTab = () => (
    <div className="space-y-4">
      {/* PPN */}
      <div className="rounded-2xl p-5" style={{ background: 'white', border: '1px solid #E8D7C0' }}>
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="font-bold text-[14px]" style={{ color: '#2B1810' }}>Pajak PPN</h3>
            <p className="text-[12px]" style={{ color: '#6B5448' }}>Dikenakan atas total transaksi sebelum biaya lain</p>
          </div>
          <Toggle on={isPajakActive} onToggle={() => setIsPajakActive(!isPajakActive)} />
        </div>

        {isPajakActive && (
          <div>
            <label className="block text-[11px] font-bold mb-2" style={{ color: '#6B5448', letterSpacing: '0.06em' }}>TARIF PPN (%)</label>
            <div className="flex gap-2">
              {[0, 5, 10, 11, 12].map(r => (
                <button
                  key={r}
                  onClick={() => setPajakRate(r)}
                  className="flex-1 py-2 rounded-xl font-bold text-[13px] transition-colors"
                  style={{
                    background: pajakRate === r ? '#8B4A1E' : 'white',
                    color: pajakRate === r ? 'white' : '#6B5448',
                    border: pajakRate === r ? '1px solid #8B4A1E' : '1px solid #E8D7C0',
                  }}
                >
                  {r}%
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Service charge */}
      <div className="rounded-2xl p-5" style={{ background: 'white', border: '1px solid #E8D7C0' }}>
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="font-bold text-[14px]" style={{ color: '#2B1810' }}>Biaya Layanan</h3>
            <p className="text-[12px]" style={{ color: '#6B5448' }}>Service charge untuk makan di tempat</p>
          </div>
          <Toggle on={serviceCharge > 0} onToggle={() => setServiceCharge(prev => prev > 0 ? 0 : 5)} />
        </div>
        {serviceCharge > 0 && (
          <div className="flex gap-2">
            {[5, 10, 15].map(r => (
              <button
                key={r}
                onClick={() => setServiceCharge(r)}
                className="flex-1 py-2 rounded-xl font-bold text-[13px] transition-colors"
                style={{
                  background: serviceCharge === r ? '#8B4A1E' : 'white',
                  color: serviceCharge === r ? 'white' : '#6B5448',
                  border: serviceCharge === r ? '1px solid #8B4A1E' : '1px solid #E8D7C0',
                }}
              >
                {r}%
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Simulation */}
      <div className="rounded-2xl p-5" style={{ background: '#F3E7CE', border: '1px solid #E8D7C0' }}>
        <h3 className="font-bold text-[13px] mb-3" style={{ color: '#2B1810' }}>Simulasi Perhitungan</h3>
        <div className="space-y-2 text-[13px]">
          <div className="flex justify-between"><span style={{ color: '#6B5448' }}>Harga produk contoh</span><span className="font-semibold" style={{ color: '#2B1810' }}>{fmt(simPrice)}</span></div>
          {simPajak > 0 && <div className="flex justify-between"><span style={{ color: '#6B5448' }}>PPN {pajakRate}%</span><span className="font-semibold" style={{ color: '#2B1810' }}>+{fmt(simPajak)}</span></div>}
          {simService > 0 && <div className="flex justify-between"><span style={{ color: '#6B5448' }}>Layanan {serviceCharge}%</span><span className="font-semibold" style={{ color: '#2B1810' }}>+{fmt(simService)}</span></div>}
          <div className="flex justify-between pt-2" style={{ borderTop: '1px solid #C49A6260' }}>
            <span className="font-bold" style={{ color: '#2B1810' }}>Total Pelanggan Bayar</span>
            <span className="font-serif font-bold text-[16px]" style={{ color: '#8B4A1E' }}>{fmt(simTotal)}</span>
          </div>
        </div>
      </div>

      <button className="w-full py-3 rounded-xl font-bold text-[14px] transition-all" style={{ background: '#8B4A1E', color: 'white' }}>
        Simpan Pengaturan Pajak
      </button>
    </div>
  )

  const QrisTab = () => (
    <div className="space-y-4">
      <div className="rounded-2xl p-5" style={{ background: 'white', border: '1px solid #E8D7C0' }}>
        <h3 className="font-bold text-[14px] mb-4" style={{ color: '#2B1810' }}>Mode QRIS</h3>
        <div className="flex flex-col gap-2">
          {[
            { id: 'dinamis' as const, label: 'QRIS Dinamis', desc: 'QR code berbeda tiap transaksi, konfirmasi otomatis' },
            { id: 'statis' as const, label: 'QRIS Statis', desc: 'Satu QR code, kasir konfirmasi manual' },
          ].map(opt => (
            <button
              key={opt.id}
              onClick={() => setQrisMode(opt.id)}
              className="flex items-start gap-3 p-4 rounded-xl text-left transition-colors"
              style={{
                background: qrisMode === opt.id ? '#F3E7CE' : 'white',
                border: qrisMode === opt.id ? '2px solid #8B4A1E' : '1.5px solid #E8D7C0',
              }}
            >
              <div className="w-4 h-4 rounded-full mt-0.5 shrink-0" style={{ border: '2px solid', borderColor: qrisMode === opt.id ? '#8B4A1E' : '#C49A62', background: qrisMode === opt.id ? '#8B4A1E' : 'transparent' }} />
              <div>
                <p className="font-bold text-[13px]" style={{ color: '#2B1810' }}>{opt.label}</p>
                <p className="text-[11px] mt-0.5" style={{ color: '#6B5448' }}>{opt.desc}</p>
              </div>
            </button>
          ))}
        </div>
      </div>

      {qrisMode === 'statis' && (
        <div className="rounded-2xl p-5 flex flex-col items-center" style={{ background: 'white', border: '1px solid #E8D7C0' }}>
          <div className="w-32 h-32 rounded-2xl flex items-center justify-center mb-3" style={{ background: '#F3E7CE', border: '2px dashed #C49A62' }}>
            <QrCode size={56} color="#C49A62" />
          </div>
          <p className="text-[12px] text-center mb-3" style={{ color: '#6B5448' }}>Upload QR code statis dari bank / penyedia QRIS Anda</p>
          <button className="flex items-center gap-2 px-4 py-2 rounded-xl text-[13px] font-bold transition-colors" style={{ background: '#8B4A1E', color: 'white' }}>
            <UploadCloud size={16} /> Upload QR Code
          </button>
        </div>
      )}

      <div className="rounded-2xl p-4 flex items-start gap-3" style={{ background: '#FEF9EC', border: '1px solid #C9A22740' }}>
        <AlertTriangle size={16} color="#C9A227" className="shrink-0 mt-0.5" />
        <p className="text-[12px]" style={{ color: '#6B5448' }}>Pastikan QRIS sudah terverifikasi oleh Bank Indonesia sebelum digunakan untuk transaksi.</p>
      </div>
    </div>
  )

  const GenericTab = ({ id }: { id: string }) => (
    <div className="rounded-2xl p-8 flex flex-col items-center justify-center text-center min-h-48" style={{ background: 'white', border: '1px solid #E8D7C0' }}>
      <p className="font-serif font-bold text-[16px] mb-2" style={{ color: '#2B1810' }}>
        {TABS.find(t => t.id === id)?.label}
      </p>
      <p className="text-[13px]" style={{ color: '#6B5448' }}>Fitur pengaturan ini sedang dalam pengembangan.</p>
    </div>
  )

  return (
    <PageShell
      title="Pengaturan Sistem"
      subtitle="Pajak, printer, QRIS, dan konfigurasi outlet"
      onBack={onBack}
      rightPanelWidth={220}
      rightPanel={
        <div className="py-4 px-3">
          <p className="text-[10px] font-bold mb-3 px-2" style={{ color: '#C49A62', letterSpacing: '0.08em' }}>KATEGORI</p>
          <div className="flex flex-col gap-1">
            {TABS.map(tab => {
              const Icon = tab.icon
              const isActive = activeTab === tab.id
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className="flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-left transition-colors"
                  style={{
                    background: isActive ? '#2B1810' : 'transparent',
                    color: isActive ? '#F3E7CE' : '#6B5448',
                  }}
                >
                  <Icon size={15} />
                  <span className="font-semibold text-[13px]">{tab.label}</span>
                </button>
              )
            })}
          </div>
        </div>
      }
    >
      <div className="px-6 py-5">
        {activeTab === 'pajak' && <PajakTab />}
        {activeTab === 'qris' && <QrisTab />}
        {activeTab !== 'pajak' && activeTab !== 'qris' && <GenericTab id={activeTab} />}
      </div>
    </PageShell>
  )
}
