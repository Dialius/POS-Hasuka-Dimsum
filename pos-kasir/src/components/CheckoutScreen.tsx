import { useState } from 'react'
import { Search, Plus, Minus, ShoppingBasket, Menu } from 'lucide-react'
import PaymentModal from './PaymentModal'
import { useSidebar } from '../context/SidebarContext'

const CATEGORIES = ['Semua', 'Dimsum Kukus', 'Dimsum Goreng', 'Minuman', 'Snack', 'Paket']

const PRODUCTS = [
  { id: 1, name: 'Siao May Ayam Udang (Isi 3)', price: 24000, img: 'https://images.unsplash.com/photo-1563245372-f21724e3856d?auto=format&fit=crop&q=80&w=400', stock: 10, promo: false },
  { id: 2, name: 'Hakau Udang Garing (Isi 3)', price: 21000, originalPrice: 28000, img: 'https://images.unsplash.com/photo-1496116218417-1a781b1c416c?auto=format&fit=crop&q=80&w=400', stock: 5, promo: true, promoText: 'PROMO 25%' },
  { id: 3, name: 'Bakpao Durian Pasir Emas', price: 26000, img: 'https://images.unsplash.com/photo-1577906096429-f73c2c312435?auto=format&fit=crop&q=80&w=400', stock: 0, promo: false },
  { id: 4, name: 'Lumpia Kulit Tahu Goreng', price: 23000, img: 'https://images.unsplash.com/photo-1563245372-f21724e3856d?auto=format&fit=crop&q=80&w=400', stock: 12, promo: false },
  { id: 5, name: 'Ceker Ayam Saus Szechuan', price: 19500, img: 'https://images.unsplash.com/photo-1563245372-f21724e3856d?auto=format&fit=crop&q=80&w=400', stock: 10, promo: false },
  { id: 6, name: 'Teh Liang Dingin Manis', price: 8000, img: 'https://images.unsplash.com/photo-1556679343-c7306c1976bc?auto=format&fit=crop&q=80&w=400', stock: 20, promo: false },
]

const formatRp = (num: number) => `Rp ${num.toLocaleString('id-ID')}`

export default function CheckoutScreen({ onSuccess }: { onSuccess: () => void }) {
  const [activeCategory, setActiveCategory] = useState('Semua')
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false)
  const [isCartOpenMobile, setIsCartOpenMobile] = useState(false)
  
  const { toggleSidebar } = useSidebar()

  // Dummy cart state
  const cartItems = [
    { id: 1, name: 'Siao May Ayam Udang (Isi 3)', price: 24000, qty: 2, promo: false },
    { id: 2, name: 'Hakau Udang Garing (Isi 3)', price: 21000, qty: 1, promo: true },
    { id: 5, name: 'Ceker Ayam Saus Szechuan', price: 19500, qty: 1, promo: false },
  ]
  
  const subtotal = 147500
  const discount = 7000
  const tax = 15500
  const total = 156000

  return (
    <div className="flex w-full h-full bg-background font-sans overflow-hidden text-textPrimary">

      <div className="flex flex-col flex-1 overflow-hidden relative">
        {/* Top Bar - Tablet Main */}
        <div className="bg-white px-4 md:px-6 py-3 flex justify-between items-center border-b border-border shadow-sm z-10 shrink-0">
          <div className="flex items-center gap-3 md:hidden">
            <img src="/Hasuka-logo.png" alt="Hasuka Logo" className="w-8 h-8 object-contain" />
            <span className="font-extrabold text-lg tracking-tight">Hasuka POS</span>
          </div>
          <div className="hidden md:flex items-center gap-3">
            <button 
              onClick={toggleSidebar}
              className="p-2 -ml-2 rounded-xl text-textPrimary hover:bg-surface transition-colors"
            >
              <Menu size={22} />
            </button>
            <span className="font-extrabold text-lg tracking-tight text-primary">POS Kasir Utama</span>
        </div>
        
        <div className="flex items-center gap-3 md:gap-5">
          <div className="hidden md:flex px-2.5 py-1 rounded-full border border-success bg-white text-success text-[13px] font-bold items-center gap-1.5">
            <div className="w-2 h-2 rounded-full bg-success"></div>
            Online
          </div>
          <div className={"items-center gap-2 bg-surface hover:bg-gray-100 transition-colors px-3 py-1.5 rounded-full cursor-pointer border border-borderLight shadow-sm" + " hidden md:flex"}>
            <img src="https://i.pravatar.cc/150?u=sri" alt="Sri Wahyuni" className="w-6 h-6 rounded-full object-cover border border-borderLight" />
            <span className="text-sm font-bold text-textPrimary">Sri Wahyuni <span className="text-textSecondary font-medium text-[11px]">(Meja 01)</span></span>
          </div>
          <span className="font-bold text-base md:text-lg">15:42</span>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex flex-1 overflow-hidden relative">
        
        {/* Left Column: Products */}
        <div className="flex-1 flex flex-col bg-background relative">
          <div className="p-4 md:p-6 pb-2 shrink-0">
            {/* Search Bar & Scan */}
            <div className="flex gap-3 mb-4 md:mb-6">
              <div className="relative flex-1">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                  <Search size={18} className="text-textSecondary" />
                </div>
                <input 
                  type="text"
                  placeholder="Cari nama dimsum atau minuman..."
                  className="w-full pl-10 pr-4 py-3 bg-white border border-border rounded-xl text-sm font-medium outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-colors shadow-sm"
                />
              </div>
              <button className="text-textPrimary hover:bg-surface w-10 h-10 rounded-xl flex items-center justify-center transition-colors">
                <Search size={20} />
              </button>
            </div>

            {/* Categories */}
            <div className="flex gap-2.5 overflow-x-auto pb-3 scrollbar-hide">
              {CATEGORIES.map(cat => {
                const isActive = activeCategory === cat
                return (
                  <button
                    key={cat}
                    onClick={() => setActiveCategory(cat)}
                    className={`px-4 py-2 rounded-full text-[13.5px] font-bold border transition-colors shrink-0 ${
                      isActive 
                        ? 'bg-primary text-white border-primary' 
                        : 'bg-white text-textPrimary border-border hover:bg-surface'
                    }`}
                  >
                    {cat}
                  </button>
                )
              })}
            </div>
          </div>

          {/* Product Grid */}
          <div className="flex-1 overflow-y-auto scrollbar-hide px-4 md:px-6 pb-24 md:pb-6">
            <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 md:gap-5">
              {PRODUCTS.map(product => {
                const isOutOfStock = product.stock === 0
                return (
                  <div key={product.id} className="bg-white rounded-2xl border border-border overflow-hidden flex flex-col cursor-pointer hover:shadow-md transition-shadow group relative">
                    {/* Image Area */}
                    <div className="relative w-full aspect-[4/3] bg-surface overflow-hidden">
                      <img src={product.img} alt={product.name} className={`w-full h-full object-cover transition-transform duration-300 group-hover:scale-105 ${isOutOfStock ? 'opacity-50' : ''}`} />
                      
                      {/* Badges */}
                      {product.promo && !isOutOfStock && (
                        <div className="absolute top-2 left-2 bg-accentPromo text-white text-[10px] font-bold px-2 py-1 rounded">
                          {product.promoText}
                        </div>
                      )}
                      
                      {isOutOfStock && (
                        <div className="absolute inset-0 flex items-center justify-center">
                          <span className="bg-danger/90 text-white text-xs font-bold px-3 py-1.5 rounded-md tracking-wide">
                            HABIS
                          </span>
                        </div>
                      )}
                    </div>
                    {/* Content */}
                    <div className="p-3.5 flex flex-col flex-1">
                      <h3 className={`font-bold text-[14px] leading-snug mb-1.5 line-clamp-2 ${isOutOfStock ? 'text-textSecondary' : 'text-textPrimary'}`}>
                        {product.name}
                      </h3>
                      <div className="mt-auto mb-2.5">
                        <span className={`font-extrabold text-[15px] ${isOutOfStock ? 'text-textSecondary/70' : 'text-primary'}`}>
                          {formatRp(product.price)}
                        </span>
                        {product.originalPrice && !isOutOfStock && (
                          <span className="text-textSecondary line-through text-[11px] ml-1.5 font-medium">
                            {formatRp(product.originalPrice)}
                          </span>
                        )}
                      </div>
                      
                      {/* Status Bottom Badge */}
                      <div className={`w-full text-center py-1 rounded text-[11px] font-bold ${isOutOfStock ? 'bg-surface text-textSecondary/70' : 'bg-[#EAF3E4] text-success'}`}>
                        {isOutOfStock ? 'Stok Kosong' : 'Tersedia'}
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        </div>

        {/* Right Column: Cart (Tablet) */}
        <div className={`hidden md:flex flex-col w-[350px] lg:w-[380px] bg-white border-l border-border shrink-0 z-20`}>
          
          {/* Cart Header */}
          <div className="px-5 py-4 flex justify-between items-center border-b border-border bg-[#FCFAF7]">
            <div className="flex items-center gap-2">
              <ShoppingBasket size={20} className="text-primary" />
              <h2 className="text-[17px] font-extrabold text-textPrimary">Pesanan Aktif</h2>
            </div>
            <div className="bg-surface text-primary text-xs font-bold px-2.5 py-1 rounded-full border border-borderLight">
              3 Item
            </div>
          </div>

          {/* Cart Items */}
          <div className="flex-1 overflow-y-auto scrollbar-hide bg-white">
            {cartItems.map((item, idx) => (
              <div key={item.id} className={`p-5 flex flex-col gap-2 ${idx !== cartItems.length - 1 ? 'border-b border-borderLight' : ''}`}>
                <h4 className="font-bold text-[14px] text-textPrimary leading-tight pr-4">{item.name}</h4>
                <div className="flex justify-between items-center">
                  <div className="flex flex-col">
                    <span className="font-semibold text-textSecondary text-[13px]">{formatRp(item.price)} {item.promo && <span className="bg-accentPromo text-white text-[9px] px-1 py-0.5 rounded ml-1">PROMO</span>}</span>
                  </div>
                  
                  {/* Stepper custom design */}
                  <div className="flex items-center bg-surface rounded-md border border-borderLight h-8">
                    <button className="w-8 h-full flex items-center justify-center text-textPrimary hover:text-primary transition-colors">
                      <Minus size={14} strokeWidth={3} />
                    </button>
                    <span className="font-extrabold text-[14px] w-6 text-center text-textPrimary">{item.qty}</span>
                    <button className="w-8 h-full flex items-center justify-center text-textPrimary hover:text-primary transition-colors">
                      <Plus size={14} strokeWidth={3} />
                    </button>
                  </div>
                </div>
                <div className="text-right font-extrabold text-[15px] mt-1 text-textPrimary">
                  {formatRp(item.price * item.qty)}
                </div>
              </div>
            ))}
          </div>

          {/* Cart Summary Area */}
          <div className="bg-surface px-5 pt-4 pb-6 border-t border-border">
            <div className="space-y-2 mb-4 text-[14px] font-medium">
              <div className="flex justify-between text-textSecondary">
                <span>Subtotal</span>
                <span className="font-semibold text-textPrimary">{formatRp(subtotal)}</span>
              </div>
              <div className="flex justify-between text-textSecondary">
                <span className="text-accentPromo">Diskon Promo</span>
                <span className="font-bold text-accentPromo">-{formatRp(discount)}</span>
              </div>
              <div className="flex justify-between text-textSecondary">
                <span>Pajak PPN 11%</span>
                <span className="font-semibold text-textPrimary">{formatRp(tax)}</span>
              </div>
            </div>
            
            <div className="border-t border-borderLight mb-3"></div>
            
            <div className="flex justify-between items-center mb-5">
              <span className="font-extrabold text-textPrimary text-[15px]">TOTAL AKHIR</span>
              <span className="font-extrabold text-[22px] text-primary">
                {formatRp(total)}
              </span>
            </div>

            <button 
              onClick={() => setIsPaymentModalOpen(true)}
              className="w-full bg-primary hover:bg-primaryHover text-white font-extrabold py-3.5 rounded-xl transition-colors text-[16px] shadow-sm flex items-center justify-center gap-2"
            >
              BAYAR {formatRp(total)} &rarr;
            </button>
          </div>

        </div>
      </div>
      
      {/* Mobile Cart Floating Bar / Bottom Sheet */}
      <div className={`md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-border rounded-t-2xl shadow-[0_-10px_20px_rgba(0,0,0,0.05)] z-30 transition-all duration-300 flex flex-col ${isCartOpenMobile ? 'h-[85vh]' : 'h-auto'}`}>
        <div 
          className="flex justify-center pt-2 pb-1 cursor-pointer"
          onClick={() => setIsCartOpenMobile(!isCartOpenMobile)}
        >
          <div className="w-10 h-1.5 bg-border rounded-full opacity-50"></div>
        </div>
        
        {/* Collapsed Header / Floating Bar */}
        <div className="px-4 pb-4 pt-1 flex justify-between items-center" onClick={() => !isCartOpenMobile && setIsCartOpenMobile(true)}>
          <div className="flex items-center gap-3">
            <div className="bg-primary p-2 rounded-lg text-white">
              <ShoppingBasket size={20} />
            </div>
            <div className="flex flex-col">
              <span className="font-extrabold text-[15px] text-textPrimary">Pesanan Aktif</span>
              <span className="text-[12px] font-bold text-primary">3 Item &bull; Promo Aktif</span>
            </div>
          </div>
          
          <button 
            onClick={(e) => { e.stopPropagation(); setIsPaymentModalOpen(true); }}
            className="bg-primary hover:bg-primaryHover text-white font-extrabold py-3 px-4 rounded-xl transition-colors text-[14px] shadow-sm flex items-center gap-1"
          >
            Bayar {formatRp(total)} &rarr;
          </button>
        </div>

        {/* Expanded Content */}
        {isCartOpenMobile && (
          <div className="flex-1 overflow-y-auto flex flex-col border-t border-borderLight mt-2">
            <div className="flex-1 overflow-y-auto scrollbar-hide">
              {cartItems.map((item, idx) => (
                <div key={item.id} className={`p-4 flex flex-col gap-2 ${idx !== cartItems.length - 1 ? 'border-b border-borderLight' : ''}`}>
                  <h4 className="font-bold text-[14px] text-textPrimary leading-tight pr-4">{item.name}</h4>
                  <div className="flex justify-between items-center">
                    <span className="font-semibold text-textSecondary text-[13px]">{formatRp(item.price)}</span>
                    <div className="flex items-center bg-surface rounded-md border border-borderLight h-8">
                      <button className="w-8 h-full flex items-center justify-center text-textPrimary"><Minus size={14} strokeWidth={3} /></button>
                      <span className="font-extrabold text-[14px] w-6 text-center text-textPrimary">{item.qty}</span>
                      <button className="w-8 h-full flex items-center justify-center text-textPrimary"><Plus size={14} strokeWidth={3} /></button>
                    </div>
                  </div>
                  <div className="text-right font-extrabold text-[15px] mt-1 text-textPrimary">{formatRp(item.price * item.qty)}</div>
                </div>
              ))}
            </div>
            <div className="bg-surface p-4 border-t border-border space-y-2 text-[14px] font-medium shrink-0">
              <div className="flex justify-between text-textSecondary"><span>Subtotal</span><span className="font-semibold text-textPrimary">{formatRp(subtotal)}</span></div>
              <div className="flex justify-between text-textSecondary"><span className="text-accentPromo">Diskon Promo</span><span className="font-bold text-accentPromo">-{formatRp(discount)}</span></div>
              <div className="flex justify-between text-textSecondary"><span>Pajak PPN 11%</span><span className="font-semibold text-textPrimary">{formatRp(tax)}</span></div>
            </div>
          </div>
        )}
      </div>
      
      <PaymentModal 
        isOpen={isPaymentModalOpen} 
        onClose={() => setIsPaymentModalOpen(false)} 
        onSuccess={onSuccess}
        totalAmount={total} 
      />
      </div>
    </div>
  )
}
