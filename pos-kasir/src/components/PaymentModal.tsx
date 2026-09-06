import { useState, useEffect } from 'react'
import { X, Banknote, QrCode, CreditCard, SquareSplitHorizontal, Delete, CheckCircle2 } from 'lucide-react'

type PaymentMethod = 'cash' | 'qris' | 'card' | 'split'

interface PaymentModalProps {
  isOpen: boolean
  onClose: () => void
  onSuccess: () => void
  totalAmount: number
}

const formatRp = (num: number) => `Rp ${num.toLocaleString('id-ID')}`

export default function PaymentModal({ isOpen, onClose, onSuccess, totalAmount }: PaymentModalProps) {
  const [method, setMethod] = useState<PaymentMethod>('cash')
  const [receivedAmount, setReceivedAmount] = useState('')
  const [isRendered, setIsRendered] = useState(false)

  // For animation
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => setIsRendered(true), 10)
    } else {
      setIsRendered(false)
    }
  }, [isOpen])

  if (!isOpen && !isRendered) return null

  const handleNumpadPress = (val: string) => {
    setReceivedAmount(prev => {
      const current = prev.replace(/[^0-9]/g, '')
      if (current === '0') return val
      return current + val
    })
  }

  const handleDelete = () => {
    setReceivedAmount(prev => {
      const current = prev.replace(/[^0-9]/g, '')
      return current.slice(0, -1)
    })
  }

  const handleQuickAmount = (amount: number) => {
    setReceivedAmount(amount.toString())
  }

  const getDisplayReceived = () => {
    if (!receivedAmount) return ''
    return parseInt(receivedAmount, 10).toLocaleString('id-ID')
  }

  const parsedReceived = parseInt(receivedAmount || '0', 10)
  const kembalian = parsedReceived >= totalAmount ? parsedReceived - totalAmount : 0
  const isEnough = parsedReceived >= totalAmount

  return (
    <div className={`fixed inset-0 z-50 flex justify-end transition-opacity duration-300 ${isRendered ? 'opacity-100' : 'opacity-0'}`}>
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      
      {/* Drawer Panel */}
      <div className={`relative bg-white w-full h-full md:w-[600px] lg:w-[680px] shadow-2xl flex flex-col transition-transform duration-300 ease-in-out ${isRendered ? 'translate-x-0' : 'translate-x-full'}`}>
        
        {/* Mobile Header (Hidden on Tablet) */}
        <div className="md:hidden px-5 pt-12 pb-4 bg-white border-b border-borderLight shrink-0">
          <div className="flex justify-between items-start mb-4">
            <div>
              <h2 className="text-xl font-extrabold text-textPrimary leading-tight">Pilih Metode Pembayaran</h2>
              <p className="text-textSecondary text-sm font-medium mt-1">Total Tagihan Pelanggan</p>
            </div>
            <button onClick={onClose} className="p-2 -mr-2 text-textSecondary active:bg-surface rounded-full">
              <X size={24} />
            </button>
          </div>
          <div className="flex justify-between items-end">
            <span className="text-textSecondary font-bold text-sm tracking-widest uppercase">TOTAL AKHIR</span>
            <span className="font-extrabold text-3xl text-primary leading-none">{formatRp(totalAmount)}</span>
          </div>
        </div>

        {/* Tablet Header (Hidden on Mobile) */}
        <div className="hidden md:flex px-8 pt-8 pb-5 bg-white border-b border-borderLight shrink-0 flex-col">
          <div className="flex justify-between items-start mb-6">
            <div>
              <h2 className="text-2xl font-extrabold text-textPrimary leading-tight">Pilih Metode Pembayaran</h2>
              <p className="text-textSecondary text-sm font-medium mt-1">Meja 12 &bull; Sri Wahyuni</p>
            </div>
            <button onClick={onClose} className="w-10 h-10 rounded-xl bg-surface border border-borderLight flex items-center justify-center text-textPrimary hover:bg-borderLight transition-colors">
              <X size={20} strokeWidth={3} />
            </button>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-textSecondary font-medium text-lg">Total Tagihan Pelanggan</span>
            <span className="font-extrabold text-3xl text-primary">{formatRp(totalAmount)}</span>
          </div>
        </div>

        {/* Content Area */}
        <div className="flex-1 overflow-y-auto p-5 md:p-8 bg-white md:bg-white flex flex-col gap-6 md:gap-8">
          
          {/* Methods Grid (Tablet) / Single Dropdown-like (Mobile) */}
          <div className="hidden md:grid grid-cols-2 gap-4 shrink-0">
            {/* Cash */}
            <button 
              onClick={() => setMethod('cash')}
              className={`flex items-center gap-4 p-5 rounded-2xl border-2 transition-all ${method === 'cash' ? 'border-border bg-surface text-textPrimary' : 'border-borderLight bg-white text-textPrimary hover:border-border/50'}`}
            >
              <Banknote size={24} className="text-primary" />
              <span className="font-extrabold text-[15px]">Tunai / Cash</span>
            </button>

            {/* QRIS */}
            <button 
              onClick={() => setMethod('qris')}
              className={`flex items-center gap-4 p-5 rounded-2xl border-2 transition-all ${method === 'qris' ? 'border-border bg-surface text-textPrimary' : 'border-borderLight bg-white text-textPrimary hover:border-border/50'}`}
            >
              <QrCode size={24} className="text-textPrimary" />
              <span className="font-extrabold text-[15px]">QRIS</span>
            </button>

            {/* Card */}
            <button 
              onClick={() => setMethod('card')}
              className={`flex items-center gap-4 p-5 rounded-2xl border-2 transition-all ${method === 'card' ? 'border-border bg-surface text-textPrimary' : 'border-borderLight bg-white text-textPrimary hover:border-border/50'}`}
            >
              <CreditCard size={24} className="text-textPrimary" />
              <span className="font-extrabold text-[15px]">Kartu Debit/Kredit</span>
            </button>

            {/* Split */}
            <button 
              onClick={() => setMethod('split')}
              className={`flex items-center gap-4 p-5 rounded-2xl border-2 transition-all ${method === 'split' ? 'border-border bg-surface text-textPrimary' : 'border-borderLight bg-white text-textPrimary hover:border-border/50'}`}
            >
              <SquareSplitHorizontal size={24} className="text-textPrimary" />
              <span className="font-extrabold text-[15px]">Bayar Patungan</span>
            </button>
          </div>

          {/* Mobile Method Title (Simulated Accordion Header) */}
          <div className="md:hidden flex items-center gap-3 p-4 rounded-xl border border-primary bg-white text-primary shrink-0">
            <div className="w-6 h-6 border border-primary rounded flex items-center justify-center font-bold text-sm">0</div>
            <span className="font-extrabold text-[16px]">Pembayaran Tunai / Cash</span>
          </div>

          {method === 'cash' && (
            <div className="flex flex-col md:flex-row gap-6 md:gap-8 flex-1">
              {/* Left Column: Nominal & Numpad */}
              <div className="flex-1 flex flex-col min-w-[280px]">
                <div className="text-textSecondary text-[12px] font-extrabold uppercase tracking-widest mb-2">Nominal Diterima</div>
                <div className="w-full border-2 border-primary rounded-xl bg-white flex items-center justify-end px-4 py-3 md:py-4 mb-4 md:mb-6">
                  <span className="font-extrabold text-2xl md:text-3xl text-textPrimary">Rp {getDisplayReceived() || '0'}</span>
                </div>

                {/* Mobile: Quick Amounts between Nominal and Numpad */}
                <div className="md:hidden flex flex-col mb-4">
                  <div className="text-textSecondary text-[12px] font-extrabold uppercase tracking-widest mb-2">Uang Pas Cepat</div>
                  <div className="flex gap-2">
                    <button onClick={() => handleQuickAmount(totalAmount)} className="flex-1 bg-white border border-borderLight active:border-primary active:text-primary py-3 rounded-xl text-textPrimary font-extrabold text-sm whitespace-nowrap">
                      Pas ({totalAmount / 1000}k)
                    </button>
                    <button onClick={() => handleQuickAmount(200000)} className="flex-1 bg-white border border-borderLight active:border-primary active:text-primary py-3 rounded-xl text-textPrimary font-extrabold text-sm whitespace-nowrap">
                      Rp 200k
                    </button>
                    <button onClick={() => handleQuickAmount(500000)} className="flex-1 bg-white border border-borderLight active:border-primary active:text-primary py-3 rounded-xl text-textPrimary font-extrabold text-sm whitespace-nowrap">
                      Rp 500k
                    </button>
                  </div>
                </div>

                {/* Mobile: Kembalian right before Numpad */}
                <div className="md:hidden mb-4">
                  <div className="bg-[#F2F7EC] border border-success rounded-xl p-4 flex justify-between items-center">
                    <span className="font-extrabold text-[13px] text-success uppercase">Uang Kembalian</span>
                    <span className="font-extrabold text-xl text-success">{formatRp(kembalian)}</span>
                  </div>
                </div>

                {/* Numpad */}
                <div className="grid grid-cols-3 gap-3 md:gap-4 flex-1">
                  {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((num) => (
                    <button 
                      key={num}
                      onClick={() => handleNumpadPress(num.toString())}
                      className="bg-white border border-borderLight active:bg-surface md:hover:bg-surface transition-colors py-4 md:py-5 rounded-2xl text-2xl font-extrabold text-textPrimary shadow-sm"
                    >
                      {num}
                    </button>
                  ))}
                  <button 
                    onClick={handleDelete}
                    className="bg-brand border border-brand active:bg-brand/80 transition-colors py-4 md:py-5 rounded-2xl text-white flex items-center justify-center shadow-sm"
                  >
                    <Delete size={28} strokeWidth={2.5} />
                  </button>
                  <button 
                    onClick={() => handleNumpadPress('0')}
                    className="bg-white border border-borderLight active:bg-surface md:hover:bg-surface transition-colors py-4 md:py-5 rounded-2xl text-2xl font-extrabold text-textPrimary shadow-sm"
                  >
                    0
                  </button>
                  {/* The Green Check Button */}
                  <button 
                    onClick={() => isEnough && onSuccess()}
                    className={`border transition-colors py-4 md:py-5 rounded-2xl flex items-center justify-center shadow-sm ${isEnough ? 'bg-[#5B8A2E] border-[#5B8A2E] text-white' : 'bg-gray-100 border-gray-200 text-gray-300'}`}
                    disabled={!isEnough}
                  >
                    <CheckCircle2 size={32} strokeWidth={2.5} className="md:hidden" />
                    <CheckCircle2 size={32} strokeWidth={2.5} className="hidden md:block" />
                  </button>
                </div>
              </div>

              {/* Right Column: Quick Amounts & Kembalian (Tablet only) */}
              <div className="hidden md:flex flex-col w-[260px] shrink-0">
                <div className="text-textSecondary text-[12px] font-extrabold uppercase tracking-widest mb-2">Uang Pas Cepat</div>
                <div className="flex flex-col gap-3 mb-6">
                  <button onClick={() => handleQuickAmount(totalAmount)} className="bg-white border border-borderLight hover:border-primary hover:text-primary transition-colors py-4 rounded-xl text-textPrimary font-extrabold text-[15px]">
                    Uang Pas ({formatRp(totalAmount)})
                  </button>
                  <button onClick={() => handleQuickAmount(200000)} className="bg-white border border-borderLight hover:border-primary hover:text-primary transition-colors py-4 rounded-xl text-textPrimary font-extrabold text-[15px]">
                    Rp 200.000
                  </button>
                  <button onClick={() => handleQuickAmount(500000)} className="bg-white border border-borderLight hover:border-primary hover:text-primary transition-colors py-4 rounded-xl text-textPrimary font-extrabold text-[15px]">
                    Rp 500.000
                  </button>
                </div>

                <div className="bg-[#F2F7EC] border border-success/30 rounded-2xl p-6 flex flex-col items-center justify-center text-center flex-1">
                  <span className="font-extrabold text-[13px] text-success uppercase tracking-widest mb-3">Uang Kembalian Kasir</span>
                  <span className="font-extrabold text-3xl text-success leading-none">{formatRp(kembalian)}</span>
                </div>
              </div>
            </div>
          )}
          
          {/* Placeholder for QRIS/Card/Split to match height if clicked */}
          {method !== 'cash' && (
            <div className="flex flex-col items-center justify-center flex-1 bg-surface rounded-2xl border-2 border-dashed border-borderLight">
               <QrCode size={48} className="text-textSecondary mb-4 opacity-50" />
               <p className="font-bold text-textSecondary">Integrasi dalam tahap pengembangan.</p>
               <button onClick={() => setMethod('cash')} className="mt-4 px-6 py-2 bg-white border border-border rounded-xl font-bold text-primary">Kembali ke Tunai</button>
            </div>
          )}
        </div>

        {/* Footer (Tablet / Mobile) */}
        <div className="px-5 md:px-8 py-4 md:py-5 border-t border-borderLight flex flex-col md:flex-row gap-4 justify-between items-center bg-white shrink-0">
          <button onClick={onClose} className="hidden md:block font-extrabold text-brand hover:text-red-800 transition-colors px-4 py-3">
            Batal
          </button>
          
          <button 
            onClick={onSuccess}
            disabled={!isEnough}
            className={`w-full md:w-auto px-8 py-4 rounded-xl transition-all shadow-sm flex items-center justify-center gap-2 font-extrabold text-[16px] ${
              isEnough 
                ? 'bg-[#5B8A2E] hover:bg-[#4a7224] text-white' 
                : 'bg-gray-200 text-gray-400 cursor-not-allowed'
            }`}
          >
            <CheckCircle2 size={20} strokeWidth={3} />
            Selesaikan Pembayaran
          </button>
        </div>
        
      </div>
    </div>
  )
}
