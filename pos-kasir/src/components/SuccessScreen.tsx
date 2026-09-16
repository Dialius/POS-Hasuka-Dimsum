import { CheckCircle2, ArrowRight, Printer, Download } from 'lucide-react'
import { useApp } from '../context/AppContext'
import { generateReceiptString } from '../utils/receiptPrinter'


const fmt = (n: number) => `Rp ${n.toLocaleString('id-ID')}`

function getReceiptNo() {
  const d = new Date()
  const pad = (n: number) => String(n).padStart(2, '0')
  return `HSK-${d.getFullYear()}${pad(d.getMonth()+1)}${pad(d.getDate())}-0032`
}

export default function SuccessScreen({ transaction, onNewTransaction }: { transaction?: any, onNewTransaction: () => void }) {
  const { outlet, kasirInfo, tableName, receiptSettings, taxRate, serviceRate } = useApp()
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
  const serviceChargeAmount = transaction?.service_charge || 0

  return (
    <div className="flex flex-col sm:flex-row w-full h-full overflow-hidden" style={{ background: '#FAF6ED' }}>

      {/* ── Left: Success + Actions ── */}
      <div className="flex flex-col flex-1 items-center justify-center px-6 sm:px-10 py-8 sm:py-10 overflow-y-auto custom-scrollbar" style={{ borderBottom: '1px solid #E8D7C0' }}>
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
          <button className="w-full py-3.5 rounded-xl font-bold text-[13px] flex items-center justify-center gap-1.5" style={{ background: 'white', color: '#2B1810', border: '1.5px solid #E8D7C0' }}>
            <Download size={16} /> Simpan PDF
          </button>
        </div>

        <div className="mt-8 pt-6 w-full max-w-sm" style={{ borderTop: '1px solid #E8D7C0' }}>
          <button onClick={onNewTransaction} className="flex items-center gap-2 font-bold text-[14px] transition-colors mx-auto" style={{ color: '#8B4A1E' }}>
            Lewati & Transaksi Baru <ArrowRight size={16} />
          </button>
        </div>
      </div>

        {/* 🖨️ Right: Receipt Preview 🖨️ */}
        <div className="flex flex-col shrink-0 items-center overflow-y-auto custom-scrollbar bg-[#FAF6ED] w-full sm:w-auto" style={{ borderTop: '4px solid #8B4A1E', borderLeft: 'none' }} >
          <div className="w-full sm:w-[360px] p-4 sm:p-8">
          <div className="bg-white p-4 shadow-sm flex flex-col items-center" style={{ border: '1px solid #E8D7C0', width: '100%' }}>
            {receiptSettings.showLogo && receiptSettings.logoUrl ? (
              <img src={receiptSettings.logoUrl} alt="Logo" className="w-20 h-20 object-contain mb-2 mix-blend-multiply grayscale" />
            ) : null}
            <pre className="font-mono text-[11px] leading-[1.4] whitespace-pre-wrap text-[#2B1810] mx-auto" style={{ margin: 0 }}>
              {generateReceiptString({
              outlet,
              items,
              subtotal,
              discount,
              tax,
              serviceChargeAmount,
              total,
              received,
              change,
              receiptNo,
              taxRate,
              serviceRate,
              waktu: `${dateStr} - ${timeStr}`,
              cashier: transaction?.cashier || kasirInfo?.name || 'Kasir',
                tableName,
                paymentMethod: transaction?.payment_method === 'QRIS' ? 'QRIS' : 'TUNAI',
                footer: receiptSettings.customFooter,
                showLogo: receiptSettings.showLogo && !receiptSettings.logoUrl
              })}
            </pre>
          </div>
          </div>
        </div>
    </div>
  )
}
