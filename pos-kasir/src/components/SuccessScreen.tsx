import { useState } from 'react'
import { CheckCircle2, ArrowRight, Printer, Download, Eye, X } from 'lucide-react'
import { useApp } from '../context/AppContext'
import { generateReceiptString, resolveEffectivePaperWidth } from '../utils/receiptPrinter'
import { printReceipt } from '../services/printer'
import { Button } from './common/Button'
import { fmt } from '../utils/formatters'

function getReceiptNo() {
  const d = new Date()
  const pad = (n: number) => String(n).padStart(2, '0')
  return `HSK-${d.getFullYear()}${pad(d.getMonth()+1)}${pad(d.getDate())}-0032`
}

export default function SuccessScreen({ transaction, onNewTransaction }: { transaction?: any, onNewTransaction: () => void }) {
  const { outlet, kasirInfo, tableName, receiptSettings, taxRate, serviceRate } = useApp()
  const [showPreviewModal, setShowPreviewModal] = useState(false)
  const [paperWidth, setPaperWidthState] = useState<'58mm' | '80mm'>(() => resolveEffectivePaperWidth())
  
  const setPaperWidth = (w: '58mm' | '80mm') => {
    setPaperWidthState(w)
    try {
      localStorage.setItem('hasuka_printer_paper_width', w)
    } catch {}
  }
  const [isPrinting, setIsPrinting] = useState(false)

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

  const receiptContent = generateReceiptString({
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
    paperWidth,
    waktu: `${dateStr}, ${timeStr}`,
    cashier: transaction?.cashier || kasirInfo?.name || 'Kasir',
    tableName: tableName || transaction?.table_name || 'Dine In',
    paymentMethod: transaction?.payment_method === 'QRIS' ? 'QRIS' : 'TUNAI',
    footer: receiptSettings.customFooter,
    showLogo: receiptSettings.showLogo && !receiptSettings.logoUrl
  })

  const handlePrint = async (widthOverride?: '58mm' | '80mm') => {
    const targetWidth = widthOverride || paperWidth
    try {
      setIsPrinting(true)
      const content = generateReceiptString({
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
        paperWidth: targetWidth,
        waktu: `${dateStr}, ${timeStr}`,
        cashier: transaction?.cashier || kasirInfo?.name || 'Kasir',
        tableName: tableName || transaction?.table_name || 'Dine In',
        paymentMethod: transaction?.payment_method === 'QRIS' ? 'QRIS' : 'TUNAI',
        footer: receiptSettings.customFooter,
        showLogo: receiptSettings.showLogo && !receiptSettings.logoUrl
      })
      await printReceipt({ paperWidth: targetWidth }, content)
    } finally {
      setIsPrinting(false)
    }
  }

  const handleSavePdf = () => {
    handlePrint()
  }

  return (
    <div className="flex flex-col items-center justify-center w-full h-full p-4 md:p-8 overflow-y-auto custom-scrollbar" style={{ background: '#FAF6ED' }}>
      <div className="w-full max-w-md flex flex-col items-center text-center animate-fade-in my-auto py-4">
        {/* Animated checkmark */}
        <div
          className="w-16 h-16 md:w-20 md:h-20 rounded-full flex items-center justify-center mb-3 md:mb-5 shadow-lg"
          style={{
            background: 'linear-gradient(135deg, #66BB6A 0%, #43A047 100%)',
            boxShadow: '0 8px 24px rgba(67,160,71,0.35), 0 0 50px rgba(67,160,71,0.15)'
          }}
        >
          <CheckCircle2 size={36} color="white" strokeWidth={2.5} />
        </div>

        <h1 className="font-serif font-bold text-[24px] md:text-[30px] mb-1.5" style={{ color: '#2B1810' }}>
          Transaksi Berhasil!
        </h1>
        <p className="text-[13px] md:text-[14px] mb-2 px-4" style={{ color: '#6B5448' }}>
          {change > 0 
            ? <>Kembalian <span className="font-bold" style={{ color: '#2B1810' }}>{fmt(change)}</span> sudah diserahkan kepada pelanggan.</>
            : <>Pembayaran lunas dan transaksi telah tersimpan.</>}
        </p>
        <p className="font-mono text-[11px] md:text-[12px] mb-4" style={{ color: '#C49A62' }}>
          #{receiptNo} · {tableName} · {kasirInfo?.name ?? 'Kasir'}
        </p>

        {/* Kembalian card */}
        <div className="w-full rounded-2xl p-4 md:p-5 mb-5 text-center shadow-sm" style={{ background: '#EAF4E0', border: '1.5px solid #5B8A2E40' }}>
          {change > 0 ? (
            <>
              <p className="text-[11px] font-bold mb-1" style={{ color: '#5B8A2E', letterSpacing: '0.06em' }}>KEMBALIAN</p>
              <p className="font-serif font-bold text-[28px] md:text-[34px]" style={{ color: '#5B8A2E' }}>{fmt(change)}</p>
              <p className="text-[11px] mt-0.5" style={{ color: '#6B5448' }}>Dari {fmt(received)}</p>
            </>
          ) : (
            <>
              <p className="text-[11px] font-bold mb-1" style={{ color: '#5B8A2E', letterSpacing: '0.06em' }}>STATUS PEMBAYARAN</p>
              <p className="font-serif font-bold text-[28px] md:text-[34px]" style={{ color: '#5B8A2E' }}>LUNAS</p>
              <p className="text-[11px] mt-0.5" style={{ color: '#6B5448' }}>{transaction?.payment_method === 'QRIS' ? 'QRIS' : 'Uang Pas'}</p>
            </>
          )}
        </div>

        {/* Action buttons */}
        <div className="flex flex-col gap-2.5 w-full">
          <Button 
            variant="primary"
            size="lg"
            fullWidth
            onClick={() => handlePrint()}
            loading={isPrinting}
            icon={!isPrinting ? <Printer size={18} /> : undefined}
            aria-label={`Cetak struk thermal ${paperWidth}`}
            style={{ minHeight: 48 }}
          >
            Cetak Struk ({paperWidth})
          </Button>

          <div className="grid grid-cols-2 gap-2.5 w-full">
            <Button 
              variant="secondary"
              size="md"
              fullWidth
              onClick={() => setShowPreviewModal(true)}
              icon={<Eye size={16} />}
              aria-label="Lihat preview struk"
              style={{ minHeight: 44 }}
            >
              Preview Struk
            </Button>
            <Button 
              variant="secondary"
              size="md"
              fullWidth
              onClick={handleSavePdf}
              icon={<Download size={16} />}
              aria-label="Simpan struk sebagai PDF"
              style={{ minHeight: 44 }}
            >
              Simpan PDF
            </Button>
          </div>
        </div>

        <div className="mt-5 pt-3 w-full flex justify-center" style={{ borderTop: '1px solid #E8D7C0' }}>
          <Button onClick={onNewTransaction} variant="ghost" size="md" icon={<ArrowRight size={16} />}>
            Lewati & Transaksi Baru
          </Button>
        </div>
      </div>

      {/* ── Modal Preview Struk (Unified with Hasuka POS Modal Style) ── */}
      {showPreviewModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 transition-all duration-200"
          style={{ background: 'rgba(43,24,16,0.6)', backdropFilter: 'blur(4px)' }}
          onClick={() => setShowPreviewModal(false)}
        >
          <div
            className={`relative flex flex-col w-full ${paperWidth === '80mm' ? 'max-w-[460px]' : 'max-w-[420px]'} max-h-[92vh] rounded-2xl md:rounded-3xl shadow-2xl overflow-hidden transition-all duration-200`}
            style={{ background: '#FAF6ED', border: '1px solid #E8D7C0' }}
            onClick={e => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="flex items-center justify-between px-5 md:px-6 py-3.5 shrink-0" style={{ borderBottom: '1px solid #E8D7C0', background: '#FAF6ED' }}>
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0" style={{ background: '#F3E7CE' }}>
                  <Printer size={16} color="#8B4A1E" />
                </div>
                <div>
                  <h2 className="font-serif font-bold text-[16px] md:text-[17px] leading-tight" style={{ color: '#2B1810' }}>Preview Struk Kasir</h2>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-[11px]" style={{ color: '#6B5448' }}>Lebar Kertas:</span>
                    <div className="inline-flex items-center p-0.5 rounded-lg border border-[#E8D7C0] bg-[#F3E7CE]">
                      <button
                        type="button"
                        onClick={() => setPaperWidth('58mm')}
                        className={`px-2 py-0.5 rounded-md text-[10px] font-bold transition-all ${
                          paperWidth === '58mm' ? 'bg-[#8B4A1E] text-white shadow-xs' : 'text-[#6B5448] hover:text-[#2B1810]'
                        }`}
                      >
                        58mm (32 kol)
                      </button>
                      <button
                        type="button"
                        onClick={() => setPaperWidth('80mm')}
                        className={`px-2 py-0.5 rounded-md text-[10px] font-bold transition-all ${
                          paperWidth === '80mm' ? 'bg-[#8B4A1E] text-white shadow-xs' : 'text-[#6B5448] hover:text-[#2B1810]'
                        }`}
                      >
                        80mm (42 kol)
                      </button>
                    </div>
                  </div>
                </div>
              </div>
              <button
                onClick={() => setShowPreviewModal(false)}
                className="w-8 h-8 rounded-lg flex items-center justify-center hover:bg-black/5 transition-colors shrink-0"
                title="Tutup"
              >
                <X size={18} color="#6B5448" />
              </button>
            </div>

            {/* Modal Body: Perfectly Centered Thermal Paper with Smooth Scroll */}
            <div className="flex-1 overflow-y-auto p-4 md:p-6 custom-scrollbar flex flex-col items-center justify-start" style={{ background: '#F5EFE6' }}>
              <div
                className="bg-white px-4 py-5 md:px-5 md:py-6 shadow-md rounded-xl border border-[#E8D7C0] flex flex-col items-center mx-auto mb-2 transition-all duration-200"
                style={{ width: 'fit-content', minWidth: paperWidth === '80mm' ? 330 : 260, maxWidth: paperWidth === '80mm' ? 400 : 310 }}
              >
                {receiptSettings.showLogo && receiptSettings.logoUrl ? (
                  <img src={receiptSettings.logoUrl} alt="Logo" className="w-14 h-14 object-contain mb-2.5 mix-blend-multiply grayscale" />
                ) : null}
                <pre
                  className="font-mono text-[11px] leading-[1.38] text-[#2B1810] select-all"
                  style={{
                    margin: 0,
                    fontFamily: 'Consolas, Monaco, "Courier New", Courier, monospace',
                    letterSpacing: '0.02em',
                    whiteSpace: 'pre',
                    textAlign: 'left',
                  }}
                >
                  {receiptContent}
                </pre>
              </div>
              <p className="text-[10px] text-[#6B5448] mt-1 mb-1 opacity-70 select-none">
                ↓ Gulir ke bawah untuk melihat total & rincian pembayaran
              </p>
            </div>

            {/* Modal Footer */}
            <div className="flex items-center justify-end gap-2.5 px-5 md:px-6 py-3.5 shrink-0" style={{ borderTop: '1px solid #E8D7C0', background: '#FAF6ED' }}>
              <Button
                variant="secondary"
                size="md"
                onClick={() => setShowPreviewModal(false)}
                style={{ minHeight: 40 }}
              >
                Tutup
              </Button>
              <Button
                variant="primary"
                size="md"
                onClick={() => {
                  handlePrint()
                  setShowPreviewModal(false)
                }}
                icon={<Printer size={16} />}
                style={{ minHeight: 40 }}
              >
                Cetak Struk
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
