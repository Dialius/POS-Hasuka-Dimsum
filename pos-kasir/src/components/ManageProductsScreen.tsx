import { useState } from 'react'
import { Search, Plus, ArrowLeft , Menu } from 'lucide-react'
import { useSidebar } from '../context/SidebarContext'

const formatRp = (num: number) => num.toLocaleString('id-ID')

// Dummy Data matching Figma
const DUMMY_PRODUCTS = [
  { id: 1, name: 'Siao May Ayam Udang (Isi 4)', category: 'Dimsum Kukus', price: 24000, cost: 14500, stock: 45, minStock: 10, isPromo: false, img: 'https://images.unsplash.com/photo-1604908176997-125f25cc6f3d?auto=format&fit=crop&q=80&w=150' },
  { id: 2, name: 'Hakau Udang Garing (Isi 3)', category: 'Dimsum Kukus', price: 21000, cost: 12000, stock: 12, minStock: 10, isPromo: true, img: 'https://images.unsplash.com/photo-1598514982205-f36b96d1e8d4?auto=format&fit=crop&q=80&w=150' },
  { id: 3, name: 'Lumpia Kulit Tahu Goreng', category: 'Dimsum Goreng', price: 23000, cost: 13000, stock: 8, minStock: 10, isPromo: false, img: 'https://images.unsplash.com/photo-1556679343-c7306c1976bc?auto=format&fit=crop&q=80&w=150' },
  { id: 4, name: 'Bakpao Durian Pasir Emas', category: 'Dimsum Kukus', price: 26000, cost: 15000, stock: 0, minStock: 10, isPromo: false, img: 'https://images.unsplash.com/photo-1556679343-c7306c1976bc?auto=format&fit=crop&q=80&w=150' },
  { id: 5, name: 'Teh Liang Dingin Manis', category: 'Minuman', price: 8000, cost: 3000, stock: 120, minStock: 20, isPromo: false, img: 'https://images.unsplash.com/photo-1626200419199-391ae4be7a41?auto=format&fit=crop&q=80&w=150' },
]

const CATEGORIES = ['Semua', 'Kukus', 'Goreng', 'Minuman', 'Habis']
const MOBILE_CATEGORIES = ['Kukus', 'Goreng', 'Minuman', 'Paket Ready']

export default function ManageProductsScreen({ onBack }: { onBack: () => void }) {
  const [selectedProduct, setSelectedProduct] = useState(DUMMY_PRODUCTS[0])
  const [search, setSearch] = useState('')
  const [activeCategory, setActiveCategory] = useState('Semua')
  const [activeMobileCategory, setActiveMobileCategory] = useState('Kukus')
  const [isEditingMobile, setIsEditingMobile] = useState(false)
  
  // Margin calculation
  const margin = selectedProduct.price - selectedProduct.cost
  const marginPercentage = ((margin / selectedProduct.price) * 100).toFixed(1)

  const { toggleSidebar } = useSidebar();

  return (
    <div className="flex flex-col w-full h-full md:h-screen bg-background font-sans overflow-hidden">
      
      {/* Top Bar - Tablet Main */}
      <div className="hidden md:flex bg-white px-6 py-3 justify-between items-center border-b border-border shadow-sm z-10 shrink-0">
        <div className="flex items-center gap-3">
          
          <button onClick={toggleSidebar} className="p-2 -ml-2 rounded-xl text-textPrimary hover:bg-surface transition-colors hidden md:flex">
            <Menu size={22} />
          </button>
          <span className="font-extrabold text-lg tracking-tight text-primary">Manajemen Produk</span>
        </div>
        
        <div className="flex items-center gap-5">
          <div className="flex px-2.5 py-1 rounded-full border border-success bg-white text-success text-[13px] font-bold items-center gap-1.5">
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

      <div className="flex flex-1 overflow-hidden">
        
        {/* Left Pane / Mobile Main: List */}
        <div className={`flex-1 flex flex-col bg-white md:bg-background overflow-hidden ${isEditingMobile ? 'hidden md:flex' : 'flex'}`}>
          
          {/* Mobile Header */}
          <div className="md:hidden flex flex-col px-4 pt-4 pb-2 w-full border-b border-borderLight bg-[#F9F7F4]">
            <div className="flex items-center gap-3 mb-1 cursor-pointer" onClick={onBack}>
              <div className="bg-surface border border-borderLight p-2 rounded-lg text-primary">
                <div className="w-4 h-0.5 bg-primary rounded-full"></div>
              </div>
              <h1 className="text-xl font-extrabold text-textPrimary">Manajemen Produk</h1>
            </div>
            <p className="text-textSecondary text-xs">Atur varian dimsum, harga, & ketersediaan stok</p>
          </div>

          {/* Controls: Search & Filter (Tablet) */}
          <div className="hidden md:flex flex-col px-6 py-4 bg-white border-b border-borderLight shrink-0">
            <div className="flex gap-4 mb-4">
              <div className="relative flex-1 border border-borderLight rounded-lg bg-white overflow-hidden flex items-center">
                <Search size={18} className="text-textSecondary ml-3" />
                <input 
                  type="text"
                  placeholder="Cari nama produk..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full px-3 py-2.5 text-[14px] outline-none text-textPrimary placeholder:text-textSecondary/70 font-medium"
                />
              </div>
              <button className="bg-primary hover:bg-primaryHover text-white px-6 py-2.5 rounded-lg font-bold text-[14px] transition-colors shadow-sm flex items-center gap-2">
                <Plus size={18} strokeWidth={3} />
                Tambah
              </button>
            </div>
            <div className="flex gap-3">
              {CATEGORIES.map(cat => (
                <button 
                  key={cat}
                  onClick={() => setActiveCategory(cat)}
                  className={`px-4 py-1.5 rounded-full text-[13px] font-bold border transition-colors ${
                    activeCategory === cat 
                      ? 'bg-primary border-primary text-white' 
                      : 'bg-white border-borderLight text-textPrimary hover:bg-surface'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>

          {/* Controls: Search & Filter (Mobile) */}
          <div className="md:hidden flex flex-col px-4 pt-3 pb-2 bg-[#F9F7F4] shrink-0">
            <div className="flex gap-2 mb-3">
              <div className="relative flex-1 border border-borderLight rounded-lg bg-white overflow-hidden flex items-center">
                <Search size={18} className="text-textSecondary ml-3" />
                <input 
                  type="text"
                  placeholder="Cari dimsum..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full px-3 py-2 text-[14px] outline-none text-textPrimary placeholder:text-textSecondary/70 font-medium"
                />
              </div>
              <button className="bg-[#EBE7DF] text-primary border border-primary/20 w-[42px] rounded-lg flex items-center justify-center">
                <div className="w-2 h-2 bg-primary rounded-sm"></div>
              </button>
            </div>
            <div className="flex gap-2 overflow-x-auto scrollbar-hide pb-1">
              {MOBILE_CATEGORIES.map(cat => (
                <button 
                  key={cat}
                  onClick={() => setActiveMobileCategory(cat)}
                  className={`px-4 py-1.5 rounded-full text-[13px] font-bold border whitespace-nowrap transition-colors ${
                    activeMobileCategory === cat 
                      ? 'bg-primary border-primary text-white' 
                      : 'bg-white border-borderLight text-textPrimary'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>

          {/* Product List */}
          <div className="flex-1 overflow-y-auto scrollbar-hide bg-white md:bg-background pb-20 md:pb-0 px-4 pt-2 md:p-0">
            {DUMMY_PRODUCTS.map((prod) => {
              const isSelected = selectedProduct.id === prod.id
              const isOut = prod.stock === 0
              const isLowStock = prod.stock > 0 && prod.stock <= prod.minStock
              
              // Tablet Style List Item
              if (window.innerWidth >= 768) {
                return (
                  <div 
                    key={prod.id} 
                    onClick={() => setSelectedProduct(prod)}
                    className={`flex items-center gap-4 px-6 py-4 border-b border-borderLight cursor-pointer transition-colors ${isSelected ? 'bg-[#EBE7DF]' : 'bg-white hover:bg-surface'}`}
                  >
                    <div className="w-[50px] h-[50px] rounded-xl overflow-hidden border border-borderLight shrink-0">
                      <img src={prod.img} alt={prod.name} className="w-full h-full object-cover" />
                    </div>
                    <div className="flex-1 flex flex-col">
                      <span className="font-extrabold text-[15px] text-textPrimary leading-tight mb-0.5">{prod.name}</span>
                      <span className="text-[13px] font-medium text-textSecondary flex items-center gap-1.5">
                        {prod.category} <span className="text-primary font-bold">&bull; Rp {formatRp(prod.price)}</span>
                      </span>
                    </div>
                    <div className={`px-2.5 py-1 rounded-md text-[11px] font-extrabold flex items-center justify-center min-w-[70px] ${
                      isOut ? 'bg-[#FCE8E8] text-danger' : 
                      isLowStock ? 'bg-[#FEF3C7] text-[#D97706]' : 
                      'bg-success/15 text-[#307B43]'
                    }`}>
                      Stok: {prod.stock}
                    </div>
                  </div>
                )
              }

              // Mobile Style List Item
              return (
                <div 
                  key={prod.id} 
                  onClick={() => {
                    setSelectedProduct(prod)
                    setIsEditingMobile(true)
                  }}
                  className="flex flex-col bg-white border border-borderLight rounded-xl p-3 mb-3 cursor-pointer shadow-sm"
                >
                  <div className="flex gap-3">
                    <div className="w-[60px] h-[60px] rounded-lg overflow-hidden border border-borderLight shrink-0">
                      <img src={prod.img} alt={prod.name} className="w-full h-full object-cover" />
                    </div>
                    <div className="flex-1 flex flex-col justify-center">
                      <div className="flex items-center gap-2 mb-0.5">
                        <span className="font-extrabold text-[14px] text-textPrimary leading-tight">{prod.name}</span>
                        {prod.isPromo && (
                          <span className="bg-[#E76F51] text-white text-[9px] font-extrabold px-1.5 py-0.5 rounded">PROMO</span>
                        )}
                      </div>
                      <span className="font-extrabold text-[13px] text-primary mb-1">Rp {formatRp(prod.price)}</span>
                      <span className="text-[11px] font-medium text-textSecondary">
                        Stok: {isOut ? 'Habis' : `${prod.stock} porsi`} &bull; <span className={`font-extrabold ${isOut ? 'text-danger' : 'text-success'}`}>{isOut ? 'KOSONG' : 'READY'}</span>
                      </span>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>

          {/* Mobile FAB */}
          <button className="md:hidden fixed bottom-6 right-6 w-14 h-14 bg-primary hover:bg-primaryHover text-white rounded-full flex items-center justify-center shadow-lg z-20 transition-transform active:scale-95">
            <Plus size={28} strokeWidth={2.5} />
          </button>
        </div>

        {/* Right Pane / Mobile Form: Edit Form */}
        <div className={`w-full md:w-[600px] bg-white md:border-l border-borderLight flex-col z-30 shrink-0 ${isEditingMobile ? 'flex absolute inset-0' : 'hidden md:flex'}`}>
          
          {/* Form Header */}
          <div className="px-4 md:px-8 py-4 md:py-6 border-b border-borderLight flex justify-between items-center bg-[#F9F7F4] md:bg-white shrink-0">
            <div className="flex items-center gap-3">
              <button onClick={() => setIsEditingMobile(false)} className="md:hidden p-1.5 bg-surface rounded-lg text-textPrimary">
                <ArrowLeft size={20} />
              </button>
              <h2 className="text-lg md:text-xl font-extrabold text-textPrimary">Ubah Informasi Produk</h2>
            </div>
            <div className="hidden md:flex items-center gap-2">
              <span className="text-[13px] text-textSecondary font-medium">Status Jual:</span>
              <div className="px-3 py-1 rounded-full border border-success text-success text-[12px] font-bold bg-white">
                Aktif Dijual
              </div>
            </div>
          </div>

          {/* Form Body */}
          <div className="flex-1 overflow-y-auto scrollbar-hide px-4 md:px-8 py-6 flex flex-col gap-5 md:gap-6">
            
            {/* Image Section */}
            <div className="flex gap-4 md:gap-6 items-center">
              <div className="w-[80px] h-[80px] md:w-[100px] md:h-[100px] rounded-xl md:rounded-2xl overflow-hidden border border-borderLight shrink-0 shadow-sm">
                <img src={selectedProduct.img} alt={selectedProduct.name} className="w-full h-full object-cover" />
              </div>
              <div className="flex flex-col items-start gap-2">
                <button className="border border-primary text-primary font-bold px-4 py-2 rounded-lg text-[13px] hover:bg-surface transition-colors">
                  Ganti Foto Produk
                </button>
                <span className="text-textSecondary text-[11px] font-medium">Rekomendasi format 1:1, maks 2MB.</span>
              </div>
            </div>

            {/* Nama Produk */}
            <div className="flex flex-col gap-1.5">
              <label className="text-[14px] font-extrabold text-textPrimary">Nama Produk</label>
              <input 
                type="text" 
                value={selectedProduct.name}
                readOnly
                className="w-full px-4 py-3 bg-white border border-borderLight rounded-lg text-[14px] font-medium text-textPrimary outline-none focus:border-primary transition-colors"
              />
            </div>

            {/* Kategori & Stok Saat Ini */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
              <div className="flex flex-col gap-1.5">
                <label className="text-[14px] font-extrabold text-textPrimary">Kategori</label>
                <input 
                  type="text" 
                  value={selectedProduct.category}
                  readOnly
                  className="w-full px-4 py-3 bg-white border border-borderLight rounded-lg text-[14px] font-medium text-textPrimary outline-none focus:border-primary transition-colors"
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-[14px] font-extrabold text-textPrimary">Stok Saat Ini</label>
                <div className="relative">
                  <input 
                    type="text" 
                    value={selectedProduct.stock}
                    readOnly
                    className="w-full px-4 py-3 bg-white border border-borderLight rounded-lg text-[14px] font-medium text-textPrimary outline-none focus:border-primary transition-colors"
                  />
                  <span className="absolute right-4 top-1/2 -translate-y-1/2 text-textSecondary font-extrabold text-[13px]">Porsi</span>
                </div>
              </div>
            </div>

            {/* Harga Jual & Harga Modal */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
              <div className="flex flex-col gap-1.5">
                <label className="text-[14px] font-extrabold text-textPrimary">Harga Jual</label>
                <div className="relative flex items-center bg-white border border-borderLight rounded-lg overflow-hidden focus-within:border-primary transition-colors">
                  <input 
                    type="text" 
                    value={formatRp(selectedProduct.price)}
                    readOnly
                    className="w-full px-4 py-3 text-[14px] font-medium text-textPrimary outline-none bg-transparent"
                  />
                  <span className="absolute right-4 text-textSecondary font-extrabold text-[13px]">Rp</span>
                </div>
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-[14px] font-extrabold text-textPrimary">Harga Modal</label>
                <div className="relative flex items-center bg-white border border-borderLight rounded-lg overflow-hidden focus-within:border-primary transition-colors">
                  <input 
                    type="text" 
                    value={formatRp(selectedProduct.cost)}
                    readOnly
                    className="w-full px-4 py-3 text-[14px] font-medium text-textPrimary outline-none bg-transparent"
                  />
                  <span className="absolute right-4 text-textSecondary font-extrabold text-[13px]">Rp</span>
                </div>
              </div>
            </div>

            {/* Estimasi Keuntungan */}
            <div className="bg-[#F0FDF4] border border-success/20 rounded-lg p-3 md:p-4 flex justify-between items-center text-[13px]">
              <span className="font-extrabold text-textPrimary">Estimasi Keuntungan Bersih (Margin)</span>
              <span className="font-extrabold text-success">Rp {formatRp(margin)} ({marginPercentage}%)</span>
            </div>

            {/* Batas Minimum & PPN */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
              <div className="flex flex-col gap-1.5">
                <label className="text-[14px] font-extrabold text-textPrimary">Batas Minimum Stok</label>
                <div className="relative">
                  <input 
                    type="text" 
                    value={selectedProduct.minStock}
                    readOnly
                    className="w-full px-4 py-3 bg-white border border-borderLight rounded-lg text-[14px] font-medium text-textPrimary outline-none focus:border-primary transition-colors"
                  />
                  <span className="absolute right-4 top-1/2 -translate-y-1/2 text-textSecondary font-extrabold text-[13px]">Porsi</span>
                </div>
                <span className="text-[11px] font-medium text-textSecondary mt-0.5">Notifikasi stok menipis akan aktif</span>
              </div>
              
              <div className="flex flex-col gap-1.5">
                <label className="text-[14px] font-extrabold text-textPrimary">Kena Pajak PPN (11%)</label>
                <div className="h-[46px] flex items-center">
                  <div className="w-12 h-6 bg-[#C78749] rounded-full relative cursor-pointer">
                    <div className="w-5 h-5 bg-white rounded-full absolute right-0.5 top-0.5 shadow-sm"></div>
                  </div>
                </div>
              </div>
            </div>

          </div>

          {/* Footer Actions */}
          <div className="px-4 md:px-8 py-4 border-t border-borderLight flex justify-end gap-4 bg-[#F9F7F4] md:bg-white shrink-0">
            <button onClick={() => setIsEditingMobile(false)} className="hidden md:block px-6 py-3 bg-white border border-white hover:bg-surface font-extrabold text-textPrimary transition-colors text-[14px] rounded-lg">
              Batal
            </button>
            <button className="flex-1 md:flex-none px-8 py-3 bg-primary hover:bg-primaryHover text-white font-extrabold rounded-lg transition-colors text-[14px] shadow-sm">
              Simpan Perubahan
            </button>
          </div>

        </div>

      </div>
    </div>
  )
}
