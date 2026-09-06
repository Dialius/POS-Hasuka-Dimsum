import { useState } from 'react'
import { Search, Plus, ArrowLeft, Calendar, X, ChevronDown , Menu } from 'lucide-react'
import { useSidebar } from '../context/SidebarContext'

// Dummy Data matching Figma
const DUMMY_PROMOS = [
  { 
    id: 1, 
    name: 'Diskon Soft Launching Hakau', 
    typeValue: '25%', 
    typeLabel: 'Diskon 25%',
    scope: 'Produk Tertentu', 
    dateString: '1 Mar - 31 Mar',
    endDateString: '31 Des 2024',
    status: 'Aktif',
    description: 'Hanya berlaku untuk menu Hakau Udang setiap pukul 14:00 - 17:00 WIB.'
  },
  { 
    id: 2, 
    name: 'Paket Steamer Komplit Hebat', 
    typeValue: 'Bonus Item', 
    typeLabel: 'Bundling Rp 50k',
    scope: 'Kategori Tertentu', 
    dateString: '10 Mar - 15 Mar',
    endDateString: '10 Nov 2024',
    status: 'Kedaluwarsa',
    description: 'Bundling Siao May + Hakau + Bakpao Durian gratis Teh hangat.'
  },
  { 
    id: 3, 
    name: 'Diskon Member Hasuka Goreng', 
    typeValue: 'Rp 5.000', 
    typeLabel: 'Potongan Rp 5k',
    scope: 'Kategori Tertentu', 
    dateString: 'Aktif terus',
    endDateString: 'Tanpa batas',
    status: 'Aktif',
    description: 'Potongan khusus untuk member terdaftar pada pembelian kategori goreng.'
  },
  { 
    id: 4, 
    name: 'Promo Imlek Hoki Dimsum', 
    typeValue: '15%', 
    typeLabel: 'Diskon 15%',
    scope: 'Semua Produk', 
    dateString: 'Jan 2026',
    endDateString: '31 Jan 2026',
    status: 'Kedaluwarsa',
    description: 'Diskon all item selama perayaan Imlek.'
  },
]

const CATEGORIES = ['Semua', 'Aktif', 'Nonaktif', 'Kedaluwarsa']

export default function ManagePromoScreen({ onBack }: { onBack: () => void }) {
  const [selectedPromo, setSelectedPromo] = useState(DUMMY_PROMOS[0])
  const [search, setSearch] = useState('')
  const [activeCategory, setActiveCategory] = useState('Semua')
  const [isEditingMobile, setIsEditingMobile] = useState(false)
  const [isDropdownOpen, setIsDropdownOpen] = useState(false)
  
  const { toggleSidebar } = useSidebar();

  return (
    <div className="flex flex-col w-full h-full md:h-screen bg-background font-sans overflow-hidden">
      
      {/* Top Bar - Tablet Main */}
      <div className="hidden md:flex bg-white px-6 py-3 justify-between items-center border-b border-border shadow-sm z-10 shrink-0">
        <div className="flex items-center gap-3">
          
          <button onClick={toggleSidebar} className="p-2 -ml-2 rounded-xl text-textPrimary hover:bg-surface transition-colors hidden md:flex">
            <Menu size={22} />
          </button>
          <span className="font-extrabold text-lg tracking-tight text-primary">Manajemen Promo</span>
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
              <h1 className="text-xl font-extrabold text-textPrimary">Manajemen Promo</h1>
            </div>
            <p className="text-textSecondary text-xs">Atur diskon, bundling, & voucher khusus</p>
          </div>

          {/* Controls: Search & Filter */}
          <div className="flex flex-col px-4 md:px-6 py-3 md:py-4 bg-[#F9F7F4] md:bg-white border-b border-borderLight shrink-0">
            <div className="flex gap-4 mb-3 md:mb-4">
              <div className="relative flex-1 border border-borderLight rounded-lg bg-white overflow-hidden flex items-center">
                <Search size={18} className="text-textSecondary ml-3" />
                <input 
                  type="text"
                  placeholder={window.innerWidth >= 768 ? "Cari nama promo..." : "Cari program promo..."}
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full px-3 py-2 md:py-2.5 text-[14px] outline-none text-textPrimary placeholder:text-textSecondary/70 font-medium"
                />
              </div>
              <button className="hidden md:flex bg-primary hover:bg-primaryHover text-white px-6 py-2.5 rounded-lg font-bold text-[14px] transition-colors shadow-sm items-center gap-2">
                <Plus size={18} strokeWidth={3} />
                Tambah
              </button>
            </div>
            <div className="hidden md:flex gap-3">
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

          {/* Promo List */}
          <div className="flex-1 overflow-y-auto scrollbar-hide bg-[#F9F7F4] md:bg-background pb-20 md:pb-0 px-4 pt-4 md:p-0">
            {DUMMY_PROMOS.map((promo) => {
              const isSelected = selectedPromo.id === promo.id
              const isAktif = promo.status === 'Aktif'
              
              // Tablet Style List Item
              if (window.innerWidth >= 768) {
                return (
                  <div 
                    key={promo.id} 
                    onClick={() => setSelectedPromo(promo)}
                    className={`flex items-center gap-4 px-6 py-4 border-b border-borderLight cursor-pointer transition-colors ${isSelected ? 'bg-[#F6EBD5]' : 'bg-white hover:bg-surface'}`}
                  >
                    <div className="flex-1 flex flex-col">
                      <div className="flex justify-between items-center mb-1">
                        <span className="font-extrabold text-[15px] text-textPrimary">{promo.name}</span>
                        <span className="font-extrabold text-[15px] text-[#D97706]">{promo.typeValue}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-[12px] font-bold text-textSecondary flex items-center gap-1.5">
                          <span className="bg-[#EBE7DF] text-[#915B30] px-2 py-0.5 rounded text-[10px] uppercase">{promo.scope}</span> 
                          &bull; {promo.dateString}
                        </span>
                        <div className={`px-3 py-1 rounded-md text-[11px] font-extrabold flex items-center justify-center min-w-[70px] ${
                          isAktif ? 'bg-success/15 text-[#307B43]' : 'bg-[#FCE8E8] text-danger'
                        }`}>
                          {promo.status}
                        </div>
                      </div>
                    </div>
                  </div>
                )
              }

              // Mobile Style List Item (Card)
              return (
                <div 
                  key={promo.id} 
                  onClick={() => {
                    setSelectedPromo(promo)
                    setIsEditingMobile(true)
                  }}
                  className="flex flex-col bg-white border border-borderLight rounded-xl p-4 mb-3 cursor-pointer shadow-sm"
                >
                  <div className="flex justify-between items-center mb-3">
                    <span className={`px-2 py-0.5 rounded border text-[10px] font-extrabold uppercase ${
                      isAktif ? 'border-[#307B43] text-[#307B43] bg-success/5' : 'border-danger text-danger bg-danger/5'
                    }`}>
                      {promo.status}
                    </span>
                    <span className="font-extrabold text-[14px] text-[#D97706]">{promo.typeLabel}</span>
                  </div>
                  
                  <span className="font-extrabold text-[15px] text-textPrimary leading-tight mb-1.5">{promo.name}</span>
                  <span className="text-[13px] text-textSecondary mb-4 leading-snug">{promo.description}</span>
                  
                  <div className="h-px w-full bg-borderLight/60 mb-3"></div>
                  
                  <div className="flex justify-between items-center text-[11px] font-medium text-textSecondary">
                    <span>Berakhir: {promo.endDateString}</span>
                    <span className="font-extrabold text-primary">{isAktif ? 'Edit Program' : 'Lihat Riwayat'}</span>
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
              <h2 className="text-lg md:text-xl font-extrabold text-textPrimary">Ubah Konfigurasi Promo</h2>
            </div>
            <div className="hidden md:flex items-center gap-2">
              <div className="px-3 py-1 rounded-full border border-success text-success text-[12px] font-bold bg-white">
                Aktif
              </div>
            </div>
          </div>

          {/* Form Body */}
          <div className="flex-1 overflow-y-auto scrollbar-hide px-4 md:px-8 py-6 flex flex-col gap-6 md:gap-8">
            
            {/* Nama Promo */}
            <div className="flex flex-col gap-2">
              <label className="text-[14px] font-extrabold text-textPrimary">Nama Promo</label>
              <input 
                type="text" 
                value={selectedPromo.name}
                readOnly
                className="w-full px-4 py-3 bg-white border border-borderLight rounded-lg text-[14px] font-medium text-textPrimary outline-none focus:border-primary transition-colors"
              />
            </div>

            {/* Cakupan Promo */}
            <div className="flex flex-col gap-3">
              <label className="text-[14px] font-extrabold text-textPrimary">Cakupan Promo</label>
              <div className="flex flex-wrap gap-4 md:gap-6">
                <label className="flex items-center gap-2 cursor-pointer group">
                  <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-colors ${selectedPromo.scope === 'Semua Produk' ? 'border-primary' : 'border-borderLight group-hover:border-primary/50'}`}>
                    {selectedPromo.scope === 'Semua Produk' && <div className="w-2.5 h-2.5 rounded-full bg-primary" />}
                  </div>
                  <span className="text-[14px] font-semibold text-textSecondary">Semua Produk</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer group">
                  <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-colors ${selectedPromo.scope === 'Kategori Tertentu' ? 'border-primary' : 'border-borderLight group-hover:border-primary/50'}`}>
                    {selectedPromo.scope === 'Kategori Tertentu' && <div className="w-2.5 h-2.5 rounded-full bg-primary" />}
                  </div>
                  <span className="text-[14px] font-semibold text-textSecondary">Kategori Tertentu</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer group">
                  <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-colors ${selectedPromo.scope === 'Produk Tertentu' ? 'border-primary' : 'border-borderLight group-hover:border-primary/50'}`}>
                    {selectedPromo.scope === 'Produk Tertentu' && <div className="w-2.5 h-2.5 rounded-full bg-primary" />}
                  </div>
                  <span className="text-[14px] font-extrabold text-textPrimary">Produk Tertentu</span>
                </label>
              </div>

              {/* Produk Terpilih Box (Only if Produk Tertentu) */}
              {selectedPromo.scope === 'Produk Tertentu' && (
                <div className="mt-2 border border-borderLight bg-[#FAF9F7] rounded-lg p-4">
                  <p className="text-[12px] font-medium text-textSecondary mb-3">Daftar produk terpilih (1 produk):</p>
                  <div className="flex flex-wrap gap-2">
                    <div className="bg-[#EBE7DF] border border-[#D5CBB8] text-primary font-extrabold text-[12px] px-3 py-1.5 rounded-lg flex items-center gap-2 w-fit">
                      Hakau Udang Garing (Isi 3)
                      <X size={14} className="cursor-pointer hover:opacity-70" strokeWidth={3} />
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Tipe Diskon & Nilai */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
              <div className="flex flex-col gap-2 relative">
                <label className="text-[14px] font-extrabold text-textPrimary">Tipe Diskon</label>
                <div 
                  onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                  className="w-full border border-borderLight rounded-lg px-4 py-3 bg-white text-[14px] font-medium text-textPrimary cursor-pointer flex justify-between items-center"
                >
                  <span>Persentase (%)</span>
                  <ChevronDown className="text-textSecondary" size={20} />
                </div>
                {isDropdownOpen && (
                  <>
                    <div className="fixed inset-0 z-10" onClick={() => setIsDropdownOpen(false)}></div>
                    <div className="absolute top-[calc(100%+4px)] left-0 right-0 bg-white border border-borderLight rounded-lg shadow-lg z-20 flex flex-col overflow-hidden">
                      {['Persentase (%)', 'Nominal (Rp)'].map(tipe => (
                        <div 
                          key={tipe}
                          onClick={() => setIsDropdownOpen(false)}
                          className="px-4 py-3 hover:bg-surface cursor-pointer text-[14px] font-medium text-textPrimary border-b border-borderLight/50 last:border-none"
                        >
                          {tipe}
                        </div>
                      ))}
                    </div>
                  </>
                )}
              </div>
              
              <div className="flex flex-col gap-2">
                <label className="text-[14px] font-extrabold text-textPrimary">Nilai Diskon</label>
                <div className="relative flex items-center bg-white border border-borderLight rounded-lg overflow-hidden focus-within:border-primary transition-colors">
                  <input 
                    type="text" 
                    value="25"
                    readOnly
                    className="w-full px-4 py-3 text-[14px] font-medium text-textPrimary outline-none bg-transparent"
                  />
                  <span className="absolute right-4 text-textSecondary font-extrabold text-[14px]">%</span>
                </div>
              </div>
            </div>

            {/* Tanggal Mulai & Berakhir */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
              <div className="flex flex-col gap-2">
                <label className="text-[14px] font-extrabold text-textPrimary">Tanggal Mulai</label>
                <div className="relative flex items-center bg-white border border-borderLight rounded-lg overflow-hidden focus-within:border-primary transition-colors">
                  <input 
                    type="text" 
                    value="2026-03-01"
                    readOnly
                    className="w-full px-4 py-3 text-[14px] font-medium text-textPrimary outline-none bg-transparent"
                  />
                  <Calendar size={18} className="absolute right-4 text-textSecondary/70" />
                </div>
              </div>
              <div className="flex flex-col gap-2">
                <label className="text-[14px] font-extrabold text-textPrimary">Tanggal Berakhir</label>
                <div className="relative flex items-center bg-white border border-borderLight rounded-lg overflow-hidden focus-within:border-primary transition-colors">
                  <input 
                    type="text" 
                    value="2026-03-31"
                    readOnly
                    className="w-full px-4 py-3 text-[14px] font-medium text-textPrimary outline-none bg-transparent"
                  />
                  <Calendar size={18} className="absolute right-4 text-textSecondary/70" />
                </div>
              </div>
            </div>

            {/* Aktifkan Toggle */}
            <div className="flex justify-between items-center mt-2">
              <div className="flex flex-col">
                <span className="font-extrabold text-[14px] text-textPrimary">Aktifkan Promo Sekarang</span>
                <span className="text-[12px] font-medium text-textSecondary mt-1">Promo akan otomatis diterapkan di kasir & menu QR</span>
              </div>
              <div className="h-[46px] flex items-center">
                <div className="w-14 h-7 bg-[#5E8C31] rounded-full relative cursor-pointer shadow-inner">
                  <div className="w-6 h-6 bg-white rounded-full absolute right-0.5 top-0.5 shadow-sm"></div>
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
              Simpan Promo
            </button>
          </div>

        </div>

      </div>
    </div>
  )
}
