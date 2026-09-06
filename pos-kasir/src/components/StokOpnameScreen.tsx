import { useState } from 'react'
import { Search, ChevronDown, Plus, Minus , Menu } from 'lucide-react'
import { useSidebar } from '../context/SidebarContext'

// Dummy Data matching Figma
const INITIAL_PRODUCTS = [
  { id: 1, name: 'Siao May Ayam Udang (Isi 4)', category: 'Dimsum Kukus', systemStock: 45, physicalStock: 45 },
  { id: 2, name: 'Hakau Udang Garing (Isi 3)', category: 'Dimsum Kukus', systemStock: 12, physicalStock: 11 },
  { id: 3, name: 'Lumpia Kulit Tahu Goreng', category: 'Dimsum Goreng', systemStock: 8, physicalStock: 8 },
  { id: 4, name: 'Bakpao Durian Pasir Emas', category: 'Dimsum Kukus', systemStock: 0, physicalStock: 0 },
  { id: 5, name: 'Teh Liang Dingin Manis', category: 'Minuman', systemStock: 120, physicalStock: 115 },
  { id: 6, name: 'Ceker Ayam Saus Szechuan', category: 'Dimsum Kukus', systemStock: 18, physicalStock: null },
  { id: 7, name: 'Siao May Kepiting (Isi 4)', category: 'Dimsum Kukus', systemStock: 24, physicalStock: null },
]

export default function StokOpnameScreen({ onBack }: { onBack: () => void }) {
  const [products, setProducts] = useState(INITIAL_PRODUCTS)
  const [search, setSearch] = useState('')
  const [isCategoryOpen, setIsCategoryOpen] = useState(false)
  const [activeCategory, setActiveCategory] = useState('Semua')

  const updatePhysicalStock = (id: number, newValue: number | null) => {
    setProducts(products.map(p => {
      if (p.id === id) {
        // Prevent negative stock
        const validValue = newValue !== null && newValue < 0 ? 0 : newValue
        return { ...p, physicalStock: validValue }
      }
      return p
    }))
  }

  // Calculate totals
  const totalCounted = products.filter(p => p.physicalStock !== null).length
  const totalProducts = products.length
  let totalDifference = 0
  products.forEach(p => {
    if (p.physicalStock !== null) {
      totalDifference += (p.physicalStock - p.systemStock)
    }
  })

  const { toggleSidebar } = useSidebar();

  return (
    <div className="flex flex-col w-full h-full md:h-screen bg-background font-sans overflow-hidden">
      
      {/* Top Bar - Tablet Main */}
      <div className="hidden md:flex bg-white px-6 py-3 justify-between items-center border-b border-border shadow-sm z-10 shrink-0">
        <div className="flex items-center gap-3">
          
          <button onClick={toggleSidebar} className="p-2 -ml-2 rounded-xl text-textPrimary hover:bg-surface transition-colors hidden md:flex">
            <Menu size={22} />
          </button>
          <span className="font-extrabold text-lg tracking-tight text-primary">Stok Opname / Stock Reconcile</span>
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

      <div className="flex flex-1 overflow-hidden bg-[#F9F7F4] md:bg-white">
        
        <div className="flex-1 flex flex-col overflow-hidden max-w-[1200px] mx-auto w-full">
          
          {/* Mobile Header & Info */}
          <div className="md:hidden flex flex-col px-4 pt-4 pb-2 w-full border-b border-borderLight bg-[#F9F7F4] shrink-0">
            <div className="flex items-center gap-3 mb-1 cursor-pointer" onClick={onBack}>
              <div className="bg-surface border border-borderLight p-2 rounded-lg text-primary">
                <div className="w-4 h-0.5 bg-primary rounded-full"></div>
              </div>
              <h1 className="text-xl font-extrabold text-textPrimary">Stok Opname</h1>
            </div>
            <p className="text-textSecondary text-xs mb-4">Pencocokan stok fisik dapur harian</p>
            
            <div className="bg-[#EBE7DF] rounded-lg p-3 flex flex-col gap-0.5 mb-2">
              <span className="font-extrabold text-[13px] text-textPrimary">Sesi: Opname Pagi - Dapur Utama</span>
              <span className="text-[11px] font-medium text-textSecondary">Petugas: Sri Wahyuni &bull; Update Terakhir: Hari ini, 09:15</span>
            </div>
          </div>

          {/* Tablet Header & Filters */}
          <div className="hidden md:flex flex-col px-6 py-6 border-b border-borderLight shrink-0 bg-white">
            <div className="flex justify-between items-start mb-4">
              <div className="flex flex-col gap-1.5">
                <div className="flex items-center gap-3">
                  <h2 className="text-2xl font-extrabold text-textPrimary leading-none">Sesi Opname Bulanan</h2>
                  <div className="px-3 py-0.5 border border-[#D97706] text-[#D97706] text-[11px] font-bold rounded-full bg-[#FEF3C7]">
                    Sedang Berjalan
                  </div>
                </div>
                <span className="text-[13px] font-medium text-textSecondary">
                  Dimulai pada: 15 Mar 2026, 14:00 &bull; Oleh Sri Wahyuni
                </span>
              </div>
              
              <div className="flex items-center gap-4">
                <div className="relative border border-borderLight rounded-lg bg-white overflow-hidden flex items-center w-[250px]">
                  <Search size={18} className="text-textSecondary ml-3" />
                  <input 
                    type="text"
                    placeholder="Cari nama dimsum..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="w-full px-3 py-2 text-[14px] outline-none text-textPrimary placeholder:text-textSecondary/70 font-medium"
                  />
                </div>
                <div className="relative w-[180px]">
                  <div 
                    onClick={() => setIsCategoryOpen(!isCategoryOpen)}
                    className="border border-borderLight rounded-lg px-4 py-2 bg-white text-[14px] font-medium text-textPrimary cursor-pointer flex justify-between items-center"
                  >
                    <span>Kategori: {activeCategory}</span>
                    <ChevronDown className="text-textSecondary" size={18} />
                  </div>
                  {isCategoryOpen && (
                    <>
                      <div className="fixed inset-0 z-10" onClick={() => setIsCategoryOpen(false)}></div>
                      <div className="absolute top-[calc(100%+4px)] left-0 right-0 bg-white border border-borderLight rounded-lg shadow-lg z-20 flex flex-col overflow-hidden">
                        {['Semua', 'Dimsum Kukus', 'Dimsum Goreng', 'Minuman'].map(cat => (
                          <div 
                            key={cat}
                            onClick={() => { setActiveCategory(cat); setIsCategoryOpen(false); }}
                            className="px-4 py-2 hover:bg-surface cursor-pointer text-[13px] font-medium text-textPrimary border-b border-borderLight/50 last:border-none"
                          >
                            {cat}
                          </div>
                        ))}
                      </div>
                    </>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Mobile Search */}
          <div className="md:hidden px-4 py-3 shrink-0">
            <div className="relative border border-borderLight rounded-lg bg-white overflow-hidden flex items-center">
              <Search size={18} className="text-textSecondary ml-3" />
              <input 
                type="text"
                placeholder="Cari produk..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full px-3 py-2.5 text-[14px] outline-none text-textPrimary placeholder:text-textSecondary/70 font-medium"
              />
            </div>
          </div>

          {/* Table Header (Tablet Only) */}
          <div className="hidden md:grid grid-cols-[1fr_150px_120px_160px_120px] gap-4 px-6 py-4 bg-[#F9F7F4] border-b border-borderLight text-[12px] font-extrabold text-textPrimary uppercase tracking-wider shrink-0">
            <div>Nama Produk</div>
            <div>Kategori</div>
            <div className="text-center">Stok Sistem</div>
            <div className="text-center">Hitung Fisik</div>
            <div className="text-right">Selisih</div>
          </div>

          {/* List Content */}
          <div className="flex-1 overflow-y-auto scrollbar-hide px-4 md:px-0 pb-32 md:pb-0">
            {products.map(prod => {
              const diff = prod.physicalStock !== null ? prod.physicalStock - prod.systemStock : null;
              
              // Tablet View
              if (window.innerWidth >= 768) {
                return (
                  <div key={prod.id} className="grid grid-cols-[1fr_150px_120px_160px_120px] gap-4 px-6 py-4 border-b border-borderLight items-center bg-white hover:bg-surface transition-colors">
                    <div className="font-extrabold text-[15px] text-textPrimary">{prod.name}</div>
                    <div className="text-[14px] text-textSecondary font-medium">{prod.category}</div>
                    <div className="text-[15px] font-extrabold text-textSecondary text-center">{prod.systemStock} Porsi</div>
                    
                    <div className="flex justify-center">
                      {prod.physicalStock === null ? (
                        <button 
                          onClick={() => updatePhysicalStock(prod.id, prod.systemStock)}
                          className="border border-borderLight text-textSecondary hover:bg-surface hover:text-textPrimary px-4 py-1.5 rounded-lg text-[13px] font-bold flex items-center gap-1 transition-colors"
                        >
                          <Plus size={14} strokeWidth={3} /> Isi Fisik
                        </button>
                      ) : (
                        <div className="flex items-center gap-2 border border-borderLight rounded-lg bg-[#FAF9F7] p-1">
                          <button 
                            onClick={() => updatePhysicalStock(prod.id, prod.physicalStock! - 1)}
                            className="w-7 h-7 bg-white rounded flex items-center justify-center text-textPrimary shadow-sm hover:bg-gray-50"
                          >
                            <Minus size={16} strokeWidth={3} />
                          </button>
                          <span className="w-8 text-center font-extrabold text-[15px]">{prod.physicalStock}</span>
                          <button 
                            onClick={() => updatePhysicalStock(prod.id, prod.physicalStock! + 1)}
                            className="w-7 h-7 bg-white rounded flex items-center justify-center text-textPrimary shadow-sm hover:bg-gray-50"
                          >
                            <Plus size={16} strokeWidth={3} />
                          </button>
                        </div>
                      )}
                    </div>
                    
                    <div className="flex justify-end">
                      {diff === null ? (
                        <div className="bg-surface text-textSecondary text-[12px] font-extrabold px-3 py-1 rounded">Pending</div>
                      ) : diff === 0 ? (
                        <div className="bg-success/15 text-[#307B43] text-[12px] font-extrabold px-3 py-1 rounded">Sesuai</div>
                      ) : diff < 0 ? (
                        <div className="bg-[#FEF3C7] text-[#D97706] text-[12px] font-extrabold px-3 py-1 rounded">{diff} Porsi</div>
                      ) : (
                        <div className="bg-[#FCE8E8] text-danger text-[12px] font-extrabold px-3 py-1 rounded">+{diff} Porsi</div>
                      )}
                    </div>
                  </div>
                )
              }

              // Mobile View (Card)
              return (
                <div key={prod.id} className="bg-white border border-borderLight rounded-xl p-4 mb-3 shadow-sm flex flex-col gap-3">
                  <div className="flex justify-between items-start gap-4">
                    <div className="flex flex-col gap-1 flex-1">
                      <span className="font-extrabold text-[15px] text-textPrimary leading-tight">{prod.name}</span>
                      <span className="text-[13px] font-medium text-textSecondary">Stok Sistem: {prod.systemStock} porsi</span>
                      <div className="mt-1">
                        {diff === null ? (
                          <span className="bg-surface text-textSecondary px-2 py-0.5 rounded text-[11px] font-extrabold">Menunggu Input</span>
                        ) : diff === 0 ? (
                          <span className="bg-success/15 text-[#307B43] px-2 py-0.5 rounded text-[11px] font-extrabold">Selisih: 0 (Cocok)</span>
                        ) : diff < 0 ? (
                          <span className="bg-[#FCE8E8] text-danger px-2 py-0.5 rounded text-[11px] font-extrabold">Selisih: {diff} porsi</span>
                        ) : (
                          <span className="bg-[#FEF3C7] text-[#D97706] px-2 py-0.5 rounded text-[11px] font-extrabold">Selisih: +{diff} porsi</span>
                        )}
                      </div>
                    </div>
                    
                    {/* Mobile Input */}
                    <div className="w-[80px] shrink-0">
                      {prod.physicalStock === null ? (
                        <button 
                          onClick={() => updatePhysicalStock(prod.id, prod.systemStock)}
                          className="w-full bg-[#EBE7DF] text-primary border border-[#D5CBB8] rounded-lg py-2 text-[12px] font-extrabold hover:bg-[#D5CBB8] transition-colors"
                        >
                          Isi
                        </button>
                      ) : (
                        <div className="relative border border-primary/40 bg-[#FAF9F7] rounded-lg overflow-hidden focus-within:border-primary transition-colors">
                          <input 
                            type="number" 
                            value={prod.physicalStock}
                            onChange={(e) => updatePhysicalStock(prod.id, parseInt(e.target.value) || 0)}
                            className="w-full px-2 py-2 text-[18px] font-extrabold text-textPrimary outline-none bg-transparent text-center"
                          />
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )
            })}
          </div>

          {/* Footer Fixed (Tablet) */}
          <div className="hidden md:flex justify-between items-center px-6 py-4 border-t border-borderLight bg-white shrink-0">
            <div className="flex gap-8">
              <div className="flex flex-col gap-0.5">
                <span className="text-[11px] font-bold text-textSecondary uppercase tracking-widest">Total Kelompok Dihitung</span>
                <span className="font-extrabold text-[15px] text-textPrimary">{totalCounted} dari {totalProducts} Menu</span>
              </div>
              <div className="flex flex-col gap-0.5">
                <span className="text-[11px] font-bold text-textSecondary uppercase tracking-widest">Total Selisih</span>
                <span className={`font-extrabold text-[15px] ${totalDifference < 0 ? 'text-danger' : totalDifference > 0 ? 'text-[#D97706]' : 'text-success'}`}>
                  {totalDifference > 0 ? '+' : ''}{totalDifference} Porsi (Tercatat)
                </span>
              </div>
            </div>
            
            <div className="flex gap-4">
              <button className="px-6 py-3 border-2 border-primary text-primary font-extrabold rounded-lg hover:bg-surface transition-colors text-[14px]">
                Simpan Draf
              </button>
              <button className="px-6 py-3 bg-primary text-white font-extrabold rounded-lg hover:bg-primaryHover transition-colors text-[14px] shadow-sm">
                Selesaikan Sesi Opname
              </button>
            </div>
          </div>

          {/* Footer Fixed (Mobile) */}
          <div className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-borderLight p-4 flex flex-col gap-3 z-20">
            <div className="flex justify-between items-center">
              <span className="text-[13px] font-medium text-textPrimary">Progress Input:</span>
              <span className="font-extrabold text-[14px] text-primary">{totalCounted} / {totalProducts} Produk</span>
            </div>
            <button className="w-full bg-primary hover:bg-primaryHover text-white py-4 rounded-xl font-extrabold text-[15px] shadow-sm transition-colors">
              Selesaikan & Sinkronisasi
            </button>
          </div>

        </div>
      </div>
    </div>
  )
}
