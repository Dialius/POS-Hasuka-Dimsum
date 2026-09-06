import { CheckCircle2, Printer, MessageCircle, Mail, ArrowRight } from 'lucide-react'

const fmt = (n: number) => `Rp ${n.toLocaleString('id-ID')}`

const RECEIPT_ITEMS = [
  { id: 1, name: 'Siao May Ayam Udang', price: 24000, qty: 2, total: 48000 },
  { id: 2, name: 'Hakau Udang Garing', price: 21000, qty: 1, total: 21000, promo: true },
  { id: 5, name: 'Ceker Ayam Szechuan', price: 19500, qty: 1, total: 19500 },
]

const SUBTOTAL = 147500, DISCOUNT = 7000, TAX = 15500, TOTAL = 156000, RECEIVED = 200000, CHANGE = 44000

export default function SuccessScreen({ onNewTransaction }: { onNewTransaction: () => void }) {
  return (
    <div className="flex w-full h-full overflow-hidden" style={{ background: '#FAF6ED' }}>

      {/* Left: success message + actions */}
      <div
        className="flex flex-col flex-1 items-center justify-center px-12 py-10 overflow-y-auto"
        style={{ borderRight: '1px solid #E8D7C0' }}
      >
        {/* Success mark */}
        <div
          className="w-20 h-20 rounded-full flex items-center justify-center mb-6"
          style={{ background: '#5B8A2E' }}
        >
          <CheckCircle2 size={40} color="white" strokeWidth={2} />
        </div>

        <h1 className="font-serif font-bold text-[30px] mb-2" style={{ color: '#2B1810' }}>
          Transaksi Berhasil!
        </h1>
        <p className="text-[14px] mb-2 text-center" style={{ color: '#6B5448' }}>
          Kembalian sebesar <span className="font-bold" style={{ color: '#2B1810' }}>{fmt(CHANGE)}</span> sudah diserahkan kepada pelanggan.
        </p>
        <p className="text-[12px] mb-10" style={{ color: '#C49A62' }}>
          #HSK-20260406-0032 · Meja 01 · Sri Wahyuni
        </p>

        {/* Action buttons */}
        <div className="flex flex-col gap-3 w-full max-w-sm">
          <button
            className="w-full py-3.5 rounded-xl font-bold text-[14px] flex items-center justify-center gap-2.5 transition-all hover:opacity-90"
            style={{ background: '#8B4A1E', color: 'white' }}
          >
            <Printer size={18} />
            Cetak Struk Fisik (80mm)
          </button>
          <button
            className="w-full py-3.5 rounded-xl font-bold text-[14px] flex items-center justify-center gap-2.5 transition-all hover:opacity-90"
            style={{ background: '#25D366', color: 'white' }}
          >
            <MessageCircle size={18} />
            Kirim Struk via WhatsApp
          </button>
          <button
            className="w-full py-3.5 rounded-xl font-bold text-[14px] flex items-center justify-center gap-2.5 transition-all"
            style={{ background: 'white', color: '#2B1810', border: '1.5px solid #E8D7C0' }}
          >
            <Mail size={18} />
            Kirim via Email
          </button>
        </div>

        <div className="mt-8" style={{ borderTop: '1px solid #E8D7C0', paddingTop: 24, width: '100%', maxWidth: 320 }}>
          <button
            onClick={onNewTransaction}
            className="flex items-center gap-2 font-bold text-[14px] transition-colors mx-auto"
            style={{ color: '#8B4A1E' }}
          >
            Lewati & Transaksi Baru
            <ArrowRight size={16} />
          </button>
        </div>
      </div>

      {/* Right: receipt preview */}
      <div
        className="flex flex-col shrink-0 overflow-y-auto"
        style={{ width: 360, background: 'white', borderLeft: '4px solid #8B4A1E' }}
      >
        {/* Receipt paper */}
        <div className="px-8 pt-8 pb-6 font-mono text-[12px]" style={{ color: '#2B1810' }}>
          {/* Header */}
          <div className="text-center mb-5">
            <div className="flex justify-center mb-3">
              <img src="/Hasuka-logo.png" alt="Hasuka" className="w-12 h-12 object-contain rounded-full" />
            </div>
            <p className="font-sans font-extrabold text-[15px]">HASUKA DIMSUM</p>
            <p className="text-[10px] mt-0.5" style={{ color: '#6B5448' }}>Paskal Hyper Square Blok C-12, Bandung</p>
            <p className="text-[10px]" style={{ color: '#6B5448' }}>Telp: (022) 8821992</p>
          </div>

          {/* Meta */}
          <div className="py-3 border-dashed border-t border-b flex flex-col gap-0.5" style={{ borderColor: '#C49A62', marginBottom: 12 }}>
            <p style={{ color: '#6B5448' }}>No. Struk: #HSK-20260406-0032</p>
            <p style={{ color: '#6B5448' }}>Tanggal: 06 Sep 2026, 15:42 WIB</p>
            <p style={{ color: '#6B5448' }}>Kasir: Sri Wahyuni · Meja 01</p>
          </div>

          {/* Items */}
          <div className="flex flex-col gap-3 py-3" style={{ borderBottom: '1px dashed #C49A62' }}>
            {RECEIPT_ITEMS.map(item => (
              <div key={item.id}>
                <div className="flex justify-between">
                  <span className="font-bold text-[13px]">{item.name}</span>
                  <span className="font-bold">{fmt(item.total)}</span>
                </div>
                <div style={{ color: '#6B5448' }}>
                  {item.qty} × {fmt(item.price)} {item.promo && '(Promo)'}
                </div>
              </div>
            ))}
          </div>

          {/* Totals */}
          <div className="py-3 flex flex-col gap-1.5" style={{ borderBottom: '1px dashed #C49A62' }}>
            {[
              { label: 'Subtotal', val: fmt(SUBTOTAL), muted: true },
              { label: 'Diskon Promo', val: `-${fmt(DISCOUNT)}`, muted: true, accent: '#DF690B' },
              { label: 'PPN 11%', val: fmt(TAX), muted: true },
            ].map(r => (
              <div key={r.label} className="flex justify-between" style={{ color: r.accent ?? (r.muted ? '#6B5448' : '#2B1810') }}>
                <span>{r.label}</span><span>{r.val}</span>
              </div>
            ))}
          </div>

          <div className="py-3" style={{ borderBottom: '1px dashed #C49A62' }}>
            <div className="flex justify-between font-extrabold text-[15px]">
              <span>TOTAL AKHIR</span><span style={{ color: '#8B4A1E' }}>{fmt(TOTAL)}</span>
            </div>
          </div>

          <div className="py-3 flex flex-col gap-1" style={{ borderBottom: '1px dashed #C49A62' }}>
            <div className="flex justify-between" style={{ color: '#6B5448' }}><span>Bayar Tunai</span><span>{fmt(RECEIVED)}</span></div>
            <div className="flex justify-between font-bold" style={{ color: '#5B8A2E' }}><span>Kembalian</span><span>{fmt(CHANGE)}</span></div>
          </div>

          <div className="pt-5 text-center" style={{ color: '#6B5448' }}>
            <p className="font-bold" style={{ color: '#2B1810' }}>Terima kasih atas kunjungan Anda!</p>
            <p className="text-[10px] mt-1">Dimsum paling nikmat disantap hangat 🥟</p>
          </div>
        </div>
      </div>
    </div>
  )
}
