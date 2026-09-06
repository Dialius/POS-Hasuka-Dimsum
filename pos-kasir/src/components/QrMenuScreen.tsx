import { QrCode, Smartphone, RefreshCw, Eye } from 'lucide-react'
import PageShell from './PageShell'

const MENU_PREVIEW = [
  { cat: 'Kukus', items: ['Siao May Ayam Udang', 'Hakau Udang Garing', 'Bakpao Durian'] },
  { cat: 'Goreng', items: ['Lumpia Kulit Tahu', 'Ceker Saus Szechuan', 'Tahu Crispy Udang'] },
  { cat: 'Minuman', items: ['Teh Liang Dingin', 'Es Jeruk Peras', 'Kopi Susu Aren'] },
]

export default function QrMenuScreen({ onBack }: { onBack: () => void }) {
  return (
    <PageShell
      title="QR Menu Digital"
      subtitle="Tampilan menu pelanggan via scan QR"
      onBack={onBack}
      rightPanelWidth={320}
      rightPanel={
        <div className="flex flex-col items-center px-6 py-8">
          {/* QR Display */}
          <div
            className="w-48 h-48 rounded-3xl flex items-center justify-center mb-5 shadow-inner"
            style={{ background: 'white', border: '3px solid #E8D7C0' }}
          >
            <QrCode size={120} color="#2B1810" strokeWidth={1} />
          </div>

          <h3 className="font-serif font-bold text-[16px] mb-1 text-center" style={{ color: '#2B1810' }}>
            Hasuka Dimsum — Paskal
          </h3>
          <p className="text-[11px] text-center mb-5" style={{ color: '#6B5448' }}>
            Scan QR code ini untuk melihat menu digital. URL diperbarui otomatis saat menu berubah.
          </p>

          <div className="w-full rounded-xl px-4 py-2.5 mb-5 flex items-center gap-2" style={{ background: '#F3E7CE', border: '1px solid #E8D7C0' }}>
            <span className="text-[11px] flex-1 truncate" style={{ color: '#6B5448' }}>hasuka.menu/paskal/01</span>
            <button className="text-[11px] font-bold" style={{ color: '#8B4A1E' }}>Salin</button>
          </div>

          <div className="flex flex-col gap-2 w-full">
            <button className="w-full py-2.5 rounded-xl font-bold text-[13px] flex items-center justify-center gap-2" style={{ background: '#8B4A1E', color: 'white' }}>
              <Eye size={15} /> Preview Menu Digital
            </button>
            <button className="w-full py-2.5 rounded-xl font-bold text-[13px] flex items-center justify-center gap-2" style={{ background: 'white', color: '#2B1810', border: '1.5px solid #E8D7C0' }}>
              <RefreshCw size={15} /> Regenerate QR Code
            </button>
            <button className="w-full py-2.5 rounded-xl font-bold text-[13px] flex items-center justify-center gap-2" style={{ background: 'white', color: '#2B1810', border: '1.5px solid #E8D7C0' }}>
              <Smartphone size={15} /> Cetak QR Code
            </button>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 gap-2 w-full mt-5">
            {[
              { label: 'Scan Hari Ini', val: '47' },
              { label: 'Produk Aktif', val: '23' },
            ].map(s => (
              <div key={s.label} className="rounded-xl p-3 text-center" style={{ background: '#F3E7CE', border: '1px solid #E8D7C0' }}>
                <p className="font-serif font-bold text-[20px]" style={{ color: '#2B1810' }}>{s.val}</p>
                <p className="text-[10px] mt-0.5" style={{ color: '#6B5448' }}>{s.label}</p>
              </div>
            ))}
          </div>
        </div>
      }
    >
      <div className="px-6 py-5">
        <h2 className="font-serif font-bold text-[15px] mb-4" style={{ color: '#2B1810' }}>Menu yang Ditampilkan ke Pelanggan</h2>

        <div className="space-y-4">
          {MENU_PREVIEW.map(cat => (
            <div key={cat.cat} className="rounded-2xl overflow-hidden" style={{ background: 'white', border: '1px solid #E8D7C0' }}>
              <div className="px-5 py-3" style={{ background: '#F3E7CE', borderBottom: '1px solid #E8D7C0' }}>
                <h3 className="font-bold text-[13px]" style={{ color: '#8B4A1E' }}>{cat.cat}</h3>
              </div>
              <div className="divide-y" style={{ borderColor: '#F3E7CE' }}>
                {cat.items.map(item => (
                  <div key={item} className="flex items-center justify-between px-5 py-3">
                    <span className="text-[13px]" style={{ color: '#2B1810' }}>{item}</span>
                    <span className="text-[11px] px-2 py-0.5 rounded-full font-bold" style={{ background: '#EAF4E0', color: '#5B8A2E' }}>Aktif</span>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </PageShell>
  )
}
