import { useState } from 'react'
import { Search , Menu } from 'lucide-react'
import { useSidebar } from '../context/SidebarContext'

const CATEGORIES = ['Semua', 'Dimsum Kukus', 'Dimsum Goreng', 'Minuman', 'Snack']

const PRODUCTS = [
  { id: 1, name: 'Siao May Ayam Udang (Isi 4)', price: 24000, img: 'https://images.unsplash.com/photo-1563245372-f21724e3856d?auto=format&fit=crop&q=80&w=400', promo: false },
  { id: 2, name: 'Hakau Udang Garing (Isi 3)', price: 21000, originalPrice: 28000, img: 'https://images.unsplash.com/photo-1496116218417-1a781b1c416c?auto=format&fit=crop&q=80&w=400', promo: true, promoText: 'Diskon 25%' },
  { id: 3, name: 'Lumpia Kulit Tahu Goreng', price: 23000, img: 'https://images.unsplash.com/photo-1563245372-f21724e3856d?auto=format&fit=crop&q=80&w=400', promo: false },
  { id: 4, name: 'Ceker Ayam Saus Szechuan', price: 19500, img: 'https://images.unsplash.com/photo-1563245372-f21724e3856d?auto=format&fit=crop&q=80&w=400', promo: false },
]

const formatRp = (num: number) => `Rp ${num.toLocaleString('id-ID')}`

// @ts-ignore
export default function QrMenuScreen({ onBack }: { onBack?: () => void }) {
  const [activeCategory, setActiveCategory] = useState('Semua')

  const { toggleSidebar } = useSidebar();

  return (
    <div className="flex flex-col w-full h-screen bg-[#F9F7F4] font-sans overflow-hidden">
      
      {/* Header */}
      <div className="bg-white pt-4 pb-4 px-4 flex items-center gap-3 border-b border-[#EBE7DF] shrink-0">
        <button onClick={toggleSidebar} className="p-2 -ml-2 rounded-xl text-textPrimary hover:bg-surface transition-colors hidden md:flex">
          <Menu size={22} />
        </button>
        <div className="flex flex-col">
          <h1 className="font-extrabold text-[18px] text-textPrimary leading-tight">Hasuka Dimsum</h1>
          <span className="text-[12px] font-medium text-textSecondary">Meja 12 &bull; Silakan lihat menu ter-update kami</span>
        </div>
      </div>

      <div className="flex-1 flex flex-col overflow-hidden">
        
        {/* Search & Categories */}
        <div className="bg-white p-4 shrink-0 flex flex-col gap-4 border-b border-[#EBE7DF]">
          
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
              <Search size={18} className="text-textSecondary" />
            </div>
            <input 
              type="text"
              placeholder="Cari dimsum favorit Anda..."
              className="w-full pl-10 pr-4 py-3 bg-white border border-[#D5CBB8] rounded-xl text-[14px] text-textPrimary font-medium outline-none focus:border-[#915B30] transition-colors shadow-sm"
            />
          </div>

          <div className="flex gap-2.5 overflow-x-auto scrollbar-hide">
            {CATEGORIES.map(cat => (
              <button
                key={cat}
                onClick={() => setActiveCategory(cat)}
                className={`px-4 py-2 rounded-full text-[13px] font-extrabold border transition-colors shrink-0 ${
                  activeCategory === cat 
                    ? 'bg-[#915B30] text-white border-[#915B30]' 
                    : 'bg-white text-textPrimary border-[#D5CBB8]'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>

        </div>

        {/* Product Grid */}
        <div className="flex-1 overflow-y-auto p-4 pb-8">
          <div className="grid grid-cols-2 gap-3">
            {PRODUCTS.map(product => (
              <div key={product.id} className="bg-white border border-[#D5CBB8] rounded-2xl overflow-hidden flex flex-col shadow-sm">
                <div className="relative aspect-[4/3] bg-gray-100 overflow-hidden w-full">
                  <img src={product.img} alt={product.name} className="w-full h-full object-cover" />
                  
                  {product.promo && (
                    <div className="absolute top-2 left-2 bg-[#E76F51] text-white text-[10px] font-extrabold px-2 py-1 rounded shadow-sm">
                      {product.promoText}
                    </div>
                  )}
                </div>
                
                <div className="p-3 flex flex-col gap-1.5 flex-1 justify-between">
                  <h3 className="font-extrabold text-[13px] text-textPrimary leading-snug line-clamp-2">
                    {product.name}
                  </h3>
                  <div className="flex items-center gap-1.5 mt-auto">
                    <span className="font-extrabold text-[14px] text-[#915B30]">
                      {formatRp(product.price)}
                    </span>
                    {product.originalPrice && (
                      <span className="text-textSecondary line-through text-[10px] font-medium">
                        {formatRp(product.originalPrice)}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="bg-white p-4 border-t border-[#EBE7DF] shrink-0 text-center flex flex-col gap-1 items-center justify-center">
        <span className="font-extrabold text-[#915B30] text-[13px]">Powered by Hasuka POS</span>
        <span className="text-[11px] font-medium text-textSecondary">Sistem Informasi Menu Realtime &bull; Meja 12</span>
      </div>

    </div>
  )
}
