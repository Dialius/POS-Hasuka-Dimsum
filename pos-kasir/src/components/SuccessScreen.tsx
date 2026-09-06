import { CheckCircle2, Printer, MessageCircle, Mail } from 'lucide-react'

const formatRp = (num: number) => `Rp ${num.toLocaleString('id-ID')}`

export default function SuccessScreen({ onNewTransaction }: { onNewTransaction: () => void }) {
  // Dummy receipt data
  const receiptItems = [
    { id: 1, name: 'Siao May Ayam Udang', price: 24000, qty: 2, total: 48000 },
    { id: 2, name: 'Hakau Udang Garing', price: 21000, qty: 1, total: 21000, promo: true },
    { id: 5, name: 'Ceker Ayam Szechuan', price: 19500, qty: 1, total: 19500 },
  ]

  const subtotal = 147500
  const discount = 7000
  const tax = 15500
  const total = 156000
  const received = 200000
  const change = 44000

  return (
    <div className="flex flex-col w-full h-screen bg-background font-sans overflow-hidden text-textPrimary">
      
      {/* Top Bar - Tablet Main */}
      <div className="hidden md:flex bg-white px-6 py-3 justify-between items-center border-b border-border shadow-sm z-10 shrink-0">
        <div className="flex items-center gap-3">
          <img src="/Hasuka-logo.png" alt="Hasuka Logo" className="w-8 h-8 object-contain" />
          <span className="font-extrabold text-lg tracking-tight text-primary">Transaksi Selesai & Struk</span>
        </div>
        
        <div className="flex items-center gap-5">
          <div className="hidden md:flex px-2.5 py-1 rounded-full border border-success bg-white text-success text-[13px] font-bold items-center gap-1.5">
            <div className="w-2 h-2 rounded-full bg-success"></div>
            Online
          </div>
          <div className={"items-center gap-2 bg-surface hover:bg-gray-100 transition-colors px-3 py-1.5 rounded-full cursor-pointer border border-borderLight shadow-sm" + " flex"}>
            <img src="https://i.pravatar.cc/150?u=sri" alt="Sri Wahyuni" className="w-6 h-6 rounded-full object-cover border border-borderLight" />
            <span className="text-sm font-bold text-textPrimary">Sri Wahyuni <span className="text-textSecondary font-medium text-[11px]">(Meja 01)</span></span>
          </div>
          <span className="font-bold text-lg">15:42</span>
        </div>
      </div>

      {/* Mobile Top Bar (Just time & battery for mockup spacing, but we'll leave it out to let it breathe) */}

      {/* Main Content Area */}
      <div className="flex-1 overflow-y-auto scrollbar-hide flex flex-col">
        <div className="flex flex-col lg:flex-row items-center lg:items-start justify-center flex-1 w-full max-w-6xl mx-auto p-4 md:p-8 lg:p-12 gap-8 lg:gap-24 relative">
          
          {/* Left Side: Success Message & Actions (Tablet: Left, Mobile: Bottom/Mixed) */}
          <div className="flex flex-col items-center w-full max-w-md shrink-0 lg:mt-8 z-10 order-1 lg:order-1">
            
            {/* Success Icon */}
            <div className="bg-success text-white w-20 h-20 md:w-24 md:h-24 rounded-full flex items-center justify-center mb-4 md:mb-6 shadow-sm">
              <CheckCircle2 size={48} strokeWidth={2} className="md:w-14 md:h-14" />
            </div>

            <h1 className="font-extrabold text-2xl md:text-3xl text-textPrimary mb-2 md:mb-3">Transaksi Berhasil!</h1>
            <p className="hidden md:block text-textSecondary text-[15px] mb-10 text-center px-4">
              Kembalian sebesar <span className="font-bold">{formatRp(change)}</span> sudah diserahkan kepada pelanggan.
            </p>

            {/* Receipt Mobile Preview - Reordered for Mobile Layout */}
            <div className="md:hidden w-full bg-white rounded-2xl border border-border border-b-2 p-5 font-mono text-[13px] text-textPrimary mb-8 shadow-sm">
              <div className="text-center mb-4">
                <h2 className="font-sans font-extrabold text-[15px] mb-0.5">HASUKA DIMSUM</h2>
                <p className="text-[11px] text-textSecondary">Paskal Hyper Square Blok C-12, Bandung</p>
              </div>

              <div className="border-t border-dashed border-borderLight py-3 flex flex-col gap-1.5">
                {receiptItems.map(item => (
                  <div key={item.id} className="flex justify-between items-start">
                    <span className="flex-1 pr-2 leading-tight">{item.name} x{item.qty}</span>
                    <span className="font-bold shrink-0">{formatRp(item.total)}</span>
                  </div>
                ))}
              </div>

              <div className="border-t border-dashed border-borderLight py-3 flex flex-col gap-1">
                <div className="flex justify-between items-center text-[14px]">
                  <span>Total Akhir</span>
                  <span className="font-extrabold text-primary">{formatRp(total)}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-textSecondary">Bayar Tunai</span>
                  <span>{formatRp(received)}</span>
                </div>
                <div className="flex justify-between items-center font-bold text-success">
                  <span>Kembalian</span>
                  <span>{formatRp(change)}</span>
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="flex flex-col gap-3 w-full">
              <button className="w-full bg-primary hover:bg-primaryHover text-white p-4 rounded-xl flex items-center justify-center gap-3 transition-colors shadow-sm font-extrabold text-[15px]">
                <Printer size={20} />
                <span>Cetak Struk Fisik (80mm)</span>
              </button>
              
              <button className="w-full bg-[#25D366] hover:bg-[#20bd5a] text-white p-4 rounded-xl flex items-center justify-center gap-3 transition-colors shadow-sm font-extrabold text-[15px]">
                <MessageCircle size={20} />
                <span>Kirim Struk WA Digital</span>
              </button>
              
              <button className="w-full bg-white border border-border hover:bg-surface text-textPrimary p-4 rounded-xl flex items-center justify-center gap-3 transition-colors shadow-sm font-extrabold text-[15px]">
                <Mail size={20} />
                <span>Kirim via Email</span>
              </button>
            </div>

            {/* Divider */}
            <div className="hidden md:block w-full border-t border-borderLight my-6"></div>
            
            <button 
              onClick={onNewTransaction}
              className="mt-6 md:mt-0 text-primary hover:text-primaryHover font-extrabold py-2 px-4 transition-colors flex items-center gap-2 text-[15px]"
            >
              Lewati & Transaksi Baru &rarr;
            </button>
          </div>

          {/* Right Side: Receipt Preview (Tablet Only) */}
          <div className="hidden md:flex bg-white rounded-2xl border border-border border-b-4 w-full max-w-[380px] p-6 lg:p-8 font-mono text-[13px] text-textPrimary flex-col shrink-0 order-2 shadow-sm">
            
            <div className="text-center mb-6">
              <h2 className="font-sans font-extrabold text-lg mb-1">HASUKA DIMSUM</h2>
              <p className="text-xs text-textSecondary">Paskal Hyper Square Blok C-12, Bandung</p>
              <p className="text-xs text-textSecondary">Telp: (022) 8821992</p>
            </div>

            <div className="border-t border-dashed border-border py-4 text-xs text-textSecondary flex flex-col gap-1">
              <p>No. Struk: #HSK-20260412-0032</p>
              <p>Tanggal: 12 Apr 2026, 15:42 WIB</p>
              <p>Kasir: Sri Wahyuni &bull; Meja: Meja 12</p>
            </div>

            <div className="border-t border-dashed border-border py-4 flex flex-col gap-4">
              {receiptItems.map(item => (
                <div key={item.id} className="flex flex-col">
                  <div className="flex justify-between items-start mb-0.5">
                    <span className="font-bold text-[14px]">{item.name} {item.qty > 1 ? `(Isi ${item.qty * 2})` : ''}</span>
                    <span className="font-bold">{formatRp(item.total)}</span>
                  </div>
                  <div className="text-textSecondary text-[12px]">
                    {item.qty} x {formatRp(item.price)} {item.promo && '(Promo %)'}
                  </div>
                </div>
              ))}
            </div>

            <div className="border-t border-dashed border-border py-4 space-y-2">
              <div className="flex justify-between text-textSecondary">
                <span>Subtotal</span>
                <span>{formatRp(subtotal)}</span>
              </div>
              <div className="flex justify-between text-textSecondary">
                <span>Diskon Promo</span>
                <span>-{formatRp(discount)}</span>
              </div>
              <div className="flex justify-between text-textSecondary">
                <span>PPN (11%)</span>
                <span>{formatRp(tax)}</span>
              </div>
            </div>

            <div className="border-t border-dashed border-border py-4">
              <div className="flex justify-between items-center font-extrabold text-[16px]">
                <span>TOTAL AKHIR</span>
                <span className="text-[18px]">{formatRp(total)}</span>
              </div>
            </div>

            <div className="border-t border-dashed border-border py-4 space-y-2">
              <div className="flex justify-between text-textSecondary">
                <span>Bayar Tunai</span>
                <span>{formatRp(received)}</span>
              </div>
              <div className="flex justify-between font-extrabold">
                <span>Kembalian</span>
                <span>{formatRp(change)}</span>
              </div>
            </div>

            <div className="border-t border-dashed border-border pt-6 text-center text-[12px] flex flex-col gap-1">
              <p className="font-bold">Terima Kasih atas Kunjungan Anda!</p>
              <p className="text-textSecondary">Nasihat Cilantro: Dimsum paling nikmat disantap hangat</p>
            </div>
          </div>
          
        </div>
      </div>
    </div>
  )
}
