import { CheckCircle2, Printer, MessageCircle, Mail, ArrowRight, Download } from 'lucide-react'
import { useApp } from '../context/AppContext'
import { HASUKA_LOGO } from '../assets/logo'

const fmt = (n: number) => `Rp ${n.toLocaleString('id-ID')}`

const RECEIPT_ITEMS = [
  { id: 1, name: 'Siao May Ayam Udang', price: 24000, qty: 2, total: 48000 },
  { id: 2, name: 'Hakau Udang Garing', price: 21000, qty: 1, total: 21000, promo: true },
  { id: 5, name: 'Ceker Ayam Szechuan', price: 19500, qty: 1, total: 19500 },
]

const SUBTOTAL = 88500, DISCOUNT = 5250, TAX = 9163, TOTAL = 92413, RECEIVED = 100000, CHANGE = 7587

function getReceiptNo() {
  const d = new Date()
  const pad = (n: number) => String(n).padStart(2, '0')
  return `HSK-${d.getFullYear()}${pad(d.getMonth()+1)}${pad(d.getDate())}-0032`
}

export default function SuccessScreen({ onNewTransaction }: { onNewTransaction: () => void }) {
  const { outlet, kasirInfo, tableName, receiptSettings } = useApp()
  const receiptNo = getReceiptNo()
  const now = new Date()
  const timeStr = `${String(now.getHours()).padStart(2,'0')}:${String(now.getMinutes()).padStart(2,'0')} WIB`
  const dateStr = now.toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' })

  return (
    <div className="flex w-full h-full overflow-hidden" style={{ background: '#FAF6ED' }}>

      {/* ── Left: Success + Actions ── */}
      <div className="flex flex-col flex-1 items-center justify-center px-10 py-10 overflow-y-auto custom-scrollbar" style={{ borderRight: '1px solid #E8D7C0' }}>
        {/* Animated checkmark */}
        <div className="w-24 h-24 rounded-full flex items-center justify-center mb-6 animate-fade-in" style={{ background: 'linear-gradient(135deg, #5B8A2E, #3d6b1e)' }}>
          <CheckCircle2 size={48} color="white" strokeWidth={2} />
        </div>

        <h1 className="font-serif font-bold text-[34px] mb-2 text-center animate-fade-in" style={{ color: '#2B1810' }}>
          Transaksi Berhasil!
        </h1>
        <p className="text-[15px] mb-2 text-center" style={{ color: '#6B5448' }}>
          Kembalian <span className="font-bold" style={{ color: '#2B1810' }}>{fmt(CHANGE)}</span> sudah diserahkan kepada pelanggan.
        </p>
        <p className="font-mono text-[12px] mb-8" style={{ color: '#C49A62' }}>
          #{receiptNo} · {tableName} · {kasirInfo?.name ?? 'Kasir'}
        </p>

        {/* Kembalian card */}
        <div className="w-full max-w-xs rounded-2xl p-5 mb-8 text-center" style={{ background: '#EAF4E0', border: '2px solid #5B8A2E30' }}>
          <p className="text-[12px] font-bold mb-1" style={{ color: '#5B8A2E', letterSpacing: '0.06em' }}>KEMBALIAN</p>
          <p className="font-serif font-bold text-[36px]" style={{ color: '#5B8A2E' }}>{fmt(CHANGE)}</p>
          <p className="text-[12px] mt-1" style={{ color: '#6B5448' }}>Dari {fmt(RECEIVED)}</p>
        </div>

        {/* Action buttons */}
        <div className="flex flex-col gap-3 w-full max-w-sm">
          <button className="w-full py-3.5 rounded-xl font-bold text-[14px] flex items-center justify-center gap-2.5" style={{ background: '#8B4A1E', color: 'white' }}>
            <Printer size={18} /> Cetak Struk (80mm)
          </button>
          <button className="w-full py-3.5 rounded-xl font-bold text-[14px] flex items-center justify-center gap-2.5" style={{ background: '#25D366', color: 'white' }}>
            <MessageCircle size={18} /> Kirim via WhatsApp
          </button>
          <div className="grid grid-cols-2 gap-2">
            <button className="py-3 rounded-xl font-bold text-[13px] flex items-center justify-center gap-1.5" style={{ background: 'white', color: '#2B1810', border: '1.5px solid #E8D7C0' }}>
              <Mail size={16} /> Email
            </button>
            <button className="py-3 rounded-xl font-bold text-[13px] flex items-center justify-center gap-1.5" style={{ background: 'white', color: '#2B1810', border: '1.5px solid #E8D7C0' }}>
              <Download size={16} /> PDF
            </button>
          </div>
        </div>

        <div className="mt-8 pt-6 w-full max-w-sm" style={{ borderTop: '1px solid #E8D7C0' }}>
          <button onClick={onNewTransaction} className="flex items-center gap-2 font-bold text-[14px] transition-colors mx-auto" style={{ color: '#8B4A1E' }}>
            Lewati & Transaksi Baru <ArrowRight size={16} />
          </button>
        </div>
      </div>

      {/* ── Right: Receipt Preview ── */}
      <div className="flex flex-col shrink-0 overflow-y-auto custom-scrollbar" style={{ width: 360, background: 'white', borderLeft: '4px solid #8B4A1E' }}>
        <div className="px-8 pt-8 pb-6 font-mono text-[12px]" style={{ color: '#2B1810' }}>

          {/* Header */}
          <div className="text-center mb-5">
            <div className="flex justify-center mb-3">
              <img src={HASUKA_LOGO} alt="Hasuka" className="w-12 h-12 object-contain rounded-full" />
            </div>
            <p className="font-sans font-extrabold text-[15px]">HASUKA DIMSUM</p>
            <p className="text-[10px] mt-0.5" style={{ color: '#6B5448' }}>{outlet.address}</p>
            <p className="text-[10px]" style={{ color: '#6B5448' }}>Telp: {outlet.phone}</p>
          </div>

          {/* Meta */}
          <div className="py-3 flex flex-col gap-0.5" style={{ borderTop: '1px dashed #C49A62', borderBottom: '1px dashed #C49A62', marginBottom: 12 }}>
            <p style={{ color: '#6B5448' }}>No. Struk: #{receiptNo}</p>
            <p style={{ color: '#6B5448' }}>Tanggal: {dateStr}, {timeStr}</p>
            <p style={{ color: '#6B5448' }}>Kasir: {kasirInfo?.name ?? 'Kasir'}</p>
            <p style={{ color: '#6B5448' }}>Nama/No. Meja: <span style={{ color: '#2B1810', fontWeight: 700 }}>{tableName}</span></p>
            <p style={{ color: '#6B5448' }}>Cabang: {outlet.name.replace('Hasuka Dimsum — ', '')}</p>
          </div>

          {/* Items */}
          <div className="flex flex-col gap-3 py-3" style={{ borderBottom: '1px dashed #C49A62' }}>
            {RECEIPT_ITEMS.map(item => (
              <div key={item.id}>
                <div className="flex justify-between">
                  <span className="font-bold text-[13px]">{item.name}</span>
                  <span className="font-bold">{fmt(item.total)}</span>
                </div>
                <div style={{ color: '#6B5448' }}>{item.qty} × {fmt(item.price)} {item.promo ? '(Promo)' : ''}</div>
              </div>
            ))}
          </div>

          {/* Totals */}
          <div className="py-3 flex flex-col gap-1.5" style={{ borderBottom: '1px dashed #C49A62' }}>
            <div className="flex justify-between" style={{ color: '#6B5448' }}><span>Subtotal</span><span>{fmt(SUBTOTAL)}</span></div>
            <div className="flex justify-between" style={{ color: '#DF690B' }}><span>Diskon Promo</span><span>-{fmt(DISCOUNT)}</span></div>
            <div className="flex justify-between" style={{ color: '#6B5448' }}><span>PPN 11%</span><span>{fmt(TAX)}</span></div>
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
            {receiptSettings.customFooter.split('\n').map((line, i) => (
              <p key={i} className={i === 0 ? 'font-bold' : 'text-[10px] mt-1'} style={{ color: i === 0 ? '#2B1810' : '#6B5448' }}>{line}</p>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
