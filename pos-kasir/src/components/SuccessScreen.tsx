import { CheckCircle2, ArrowRight, Printer, Download } from 'lucide-react'
import { useApp } from '../context/AppContext'
import { generateReceiptString } from '../utils/receiptPrinter'
import { Button } from './common/Button'
import { fmt } from '../utils/formatters'



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
    <div className="flex flex-col md:flex-row w-full h-full overflow-hidden" style={{ background: '#FAF6ED' }}>

      {/* ── Left: Success + Actions ── */}
      <div className="flex flex-col flex-1 items-center justify-center px-4 md:px-10 py-6 md:py-8 overflow-y-auto custom-scrollbar" style={{ borderBottom: '1px solid #E8D7C0' }}>
        {/* Animated checkmark */}
        <div className="w-16 h-16 md:w-20 md:h-20 rounded-full flex items-center justify-center mb-3 md:mb-5 animate-fade-in" style={{
          background: 'linear-gradient(135deg, #66BB6A 0%, #43A047 100%)',
          boxShadow: '0 8px 24px rgba(67,160,71,0.4), 0 0 60px rgba(67,160,71,0.2)'
        }}>
          <CheckCircle2 size={36} color="white" strokeWidth={2.5} />
        </div>

        <h1 className="font-serif font-bold text-[22px] md:text-[30px] mb-2 text-center animate-fade-in" style={{ color: '#2B1810' }}>
          Transaksi Berhasil!
        </h1>
        <p className="text-[13px] md:text-[14px] mb-2 text-center" style={{ color: '#6B5448' }}>
          {change > 0 
            ? <>Kembalian <span className="font-bold" style={{ color: '#2B1810' }}>{fmt(change)}</span> sudah diserahkan kepada pelanggan.</>
            : <>Pembayaran lunas dan transaksi telah dicatat.</>}
        </p>
        <p className="font-mono text-[11px] md:text-[12px] mb-4 text-center" style={{ color: '#C49A62' }}>
          #{receiptNo} · {tableName} · {kasirInfo?.name ?? 'Kasir'}
        </p>

        {/* Kembalian card */}
        <div className="w-full max-w-xs rounded-2xl p-4 md:p-5 mb-5 text-center shadow-sm" style={{ background: '#EAF4E0', border: '1.5px solid #5B8A2E40' }}>
          {change > 0 ? (
            <>
              <p className="text-[11px] font-bold mb-1" style={{ color: '#5B8A2E', letterSpacing: '0.06em' }}>KEMBALIAN</p>
              <p className="font-serif font-bold text-[28px] md:text-[32px]" style={{ color: '#5B8A2E' }}>{fmt(change)}</p>
              <p className="text-[11px] mt-0.5" style={{ color: '#6B5448' }}>Dari {fmt(received)}</p>
            </>
          ) : (
            <>
              <p className="text-[11px] font-bold mb-1" style={{ color: '#5B8A2E', letterSpacing: '0.06em' }}>STATUS PEMBAYARAN</p>
              <p className="font-serif font-bold text-[28px] md:text-[32px]" style={{ color: '#5B8A2E' }}>LUNAS</p>
              <p className="text-[11px] mt-0.5" style={{ color: '#6B5448' }}>{transaction?.payment_method === 'QRIS' ? 'QRIS' : 'Uang Pas'}</p>
            </>
          )}
        </div>

        {/* Action buttons */}
        <div className="flex flex-col gap-2.5 w-full max-w-xs">
          <Button 
            variant="primary"
            size="lg"
            fullWidth
            icon={<Printer size={18} />}
            aria-label="Cetak struk thermal 80mm"
          >
            Cetak Struk (80mm)
          </Button>
          <Button 
            variant="secondary"
            size="lg"
            fullWidth
            icon={<Download size={16} />}
            aria-label="Simpan struk sebagai PDF"
          >
            Simpan PDF
          </Button>
        </div>

        <div className="mt-4 pt-3 w-full max-w-xs flex justify-center" style={{ borderTop: '1px solid #E8D7C0' }}>
          <Button onClick={onNewTransaction} variant="ghost" size="md" icon={<ArrowRight size={16} />}>
            Lewati & Transaksi Baru
          </Button>
        </div>
      </div>

      {/* 🖨️ Right: Receipt Preview 🖨️ */}
      <div className="flex flex-col shrink-0 items-center overflow-y-auto custom-scrollbar bg-[#FAF6ED] w-full md:w-[340px] lg:w-[380px] border-t-4 md:border-t-0 md:border-l-4 border-[#8B4A1E]">
        <div className="w-full p-4 md:p-6">
          <div className="bg-white p-4 shadow-sm flex flex-col items-center rounded-xl" style={{ border: '1px solid #E8D7C0', width: '100%' }}>
            {receiptSettings.showLogo && receiptSettings.logoUrl ? (
              <img src={receiptSettings.logoUrl} alt="Logo" className="w-20 h-20 object-contain mb-2 mix-blend-multiply grayscale" />
            ) : null}
            <pre className="font-mono text-[11px] leading-[1.4] whitespace-pre-wrap text-[#2B1810] mx-auto" style={{ margin: 0 }}>
              {generateReceiptString({
              outlet,
              items,
              subtotal,
              discount,
              promoName: transaction?.promo_name,
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
