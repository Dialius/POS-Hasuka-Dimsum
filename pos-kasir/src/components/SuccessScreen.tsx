import { CheckCircle2, Printer, MessageCircle, Mail, ArrowRight, Download } from 'lucide-react'
import { useApp } from '../context/AppContext'
import { generateReceiptString } from '../utils/receiptPrinter'


const fmt = (n: number) => `Rp ${n.toLocaleString('id-ID')}`

function getReceiptNo() {
  const d = new Date()
  const pad = (n: number) => String(n).padStart(2, '0')
  return `HSK-${d.getFullYear()}${pad(d.getMonth()+1)}${pad(d.getDate())}-0032`
}

export default function SuccessScreen({ transaction, onNewTransaction }: { transaction?: any, onNewTransaction: () => void }) {
  const { outlet, kasirInfo, tableName, receiptSettings } = useApp()
  const receiptNo = transaction?.invoice_no || getReceiptNo()
  
  const now = transaction?.timestamp ? new Date(transaction.timestamp) : new Date()
  const timeStr = `${String(now.getHours()).padStart(2,'0')}:${String(now.getMinutes()).padStart(2,'0')} WIB`
  const dateStr = now.toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' })

  const items = transaction?.items || []
  const subtotal = transaction?.subtotal || 0
  const discount = transaction?.promo_discount || 0
  const tax = transaction?.tax || 0
  const total = transaction?.total || 0
  const received = transaction?.cash_received || 0
  const change = transaction?.change_amount || 0

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
          {change > 0 
            ? <>Kembalian <span className="font-bold" style={{ color: '#2B1810' }}>{fmt(change)}</span> sudah diserahkan kepada pelanggan.</>
            : <>Pembayaran lunas dan transaksi telah dicatat.</>}
        </p>
        <p className="font-mono text-[12px] mb-8" style={{ color: '#C49A62' }}>
          #{receiptNo} · {tableName} · {kasirInfo?.name ?? 'Kasir'}
        </p>

        {/* Kembalian card */}
        <div className="w-full max-w-xs rounded-2xl p-5 mb-8 text-center" style={{ background: '#EAF4E0', border: '2px solid #5B8A2E30' }}>
          {change > 0 ? (
            <>
              <p className="text-[12px] font-bold mb-1" style={{ color: '#5B8A2E', letterSpacing: '0.06em' }}>KEMBALIAN</p>
              <p className="font-serif font-bold text-[36px]" style={{ color: '#5B8A2E' }}>{fmt(change)}</p>
              <p className="text-[12px] mt-1" style={{ color: '#6B5448' }}>Dari {fmt(received)}</p>
            </>
          ) : (
            <>
              <p className="text-[12px] font-bold mb-1" style={{ color: '#5B8A2E', letterSpacing: '0.06em' }}>STATUS PEMBAYARAN</p>
              <p className="font-serif font-bold text-[36px]" style={{ color: '#5B8A2E' }}>LUNAS</p>
              <p className="text-[12px] mt-1" style={{ color: '#6B5448' }}>{transaction?.payment_method === 'QRIS' ? 'QRIS' : 'Uang Pas'}</p>
            </>
          )}
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
      <div className="flex flex-col shrink-0 items-center overflow-y-auto custom-scrollbar bg-[#FAF6ED]" style={{ width: 360, borderLeft: '4px solid #8B4A1E', padding: '32px 16px' }}>
        <div className="bg-white p-4 shadow-sm" style={{ border: '1px solid #E8D7C0' }}>
          <pre className="font-mono text-[11px] leading-[1.4] whitespace-pre-wrap text-[#2B1810]" style={{ margin: 0 }}>
            {generateReceiptString({
              outlet,
              items,
              subtotal,
              discount,
              tax,
              total,
              received,
              change,
              receiptNo,
              waktu: `${dateStr} - ${timeStr}`,
              cashier: transaction?.cashier || kasirInfo?.name || 'Kasir',
              tableName,
              paymentMethod: transaction?.payment_method === 'QRIS' ? 'QRIS' : 'TUNAI',
              footer: receiptSettings.customFooter,
              showLogo: receiptSettings.showLogo
            })}
          </pre>
        </div>
      </div>
    </div>
  )
}
