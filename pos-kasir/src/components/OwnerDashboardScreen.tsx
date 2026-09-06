import { TrendingUp, Wifi, AlertCircle, Menu, Tag, ChevronRight, Activity } from 'lucide-react'
import { useSidebar } from '../context/SidebarContext'

// Dummy Data
const TOP_PRODUCTS = [
  { id: 1, name: 'Siao May Ayam Udang (Isi 4)', qty: 142, total: 'Rp 3.408.000', trend: 'up' },
  { id: 2, name: 'Hakau Udang Garing (Isi 3)', qty: 98, total: 'Rp 2.058.000', trend: 'up' },
  { id: 3, name: 'Lumpia Kulit Tahu Goreng', qty: 86, total: 'Rp 1.978.000', trend: 'stable' },
  { id: 4, name: 'Ceker Ayam Saus Szechuan', qty: 74, total: 'Rp 1.443.000', trend: 'down' },
  { id: 5, name: 'Bakpao Durian Pasir Emas', qty: 55, total: 'Rp 1.430.000', trend: 'stable' },
  { id: 6, name: 'Onde-Onde Wijen Hitam', qty: 42, total: 'Rp 924.000', trend: 'down' },
  { id: 7, name: 'Pangsit Udang Mayonaise', qty: 38, total: 'Rp 1.102.000', trend: 'up' },
  { id: 8, name: 'Mantau Goreng Susu', qty: 35, total: 'Rp 700.000', trend: 'stable' },
  { id: 9, name: 'Kuo Tie Ayam', qty: 31, total: 'Rp 744.000', trend: 'down' },
  { id: 10, name: 'Lo Mai Gai (Nasi Ketan)', qty: 29, total: 'Rp 812.000', trend: 'up' },
]

export default function OwnerDashboardScreen({ onBack }: { onBack: () => void }) {
  const { toggleSidebar } = useSidebar();

  return (
    <div className="flex flex-col w-full min-h-screen bg-[#F9F7F4] font-sans custom-scrollbar overflow-y-auto">
      
      {/* Top Bar - Tablet Main */}
      <div className="hidden md:flex bg-white px-8 py-4 justify-between items-center border-b border-border z-10 shrink-0">
        <div className="flex items-center gap-4">
          <button onClick={toggleSidebar} className="p-2 -ml-2 rounded-xl text-textPrimary hover:bg-surface transition-colors hidden md:flex border border-transparent hover:border-borderLight">
            <Menu size={22} />
          </button>
          <div className="bg-[#915B30] text-white p-2.5 rounded-xl flex items-center justify-center cursor-pointer shadow-sm border border-[#7A4B27]" onClick={onBack}>
            <Activity size={22} strokeWidth={2.5} />
          </div>
          <div className="flex flex-col cursor-pointer" onClick={onBack}>
            <span className="font-extrabold text-[18px] tracking-tight text-textPrimary leading-tight">Command Center</span>
            <span className="font-medium text-[12px] text-textSecondary">Realtime Analytics & Branch Monitoring</span>
          </div>
        </div>
        
        <div className="flex items-center gap-4">
          <div className="hidden md:flex px-3 py-1.5 rounded-full border border-success/30 bg-success/5 text-success text-[12px] font-extrabold items-center gap-2">
            <div className="w-1.5 h-1.5 rounded-full bg-success animate-pulse"></div>
            System Online
          </div>
          <div className="items-center gap-3 bg-white hover:bg-gray-50 transition-colors px-3 py-1.5 rounded-full cursor-pointer border border-[#D5CBB8] flex">
            <div className="w-7 h-7 rounded-full bg-primary/10 flex items-center justify-center border border-primary/20 text-primary font-bold text-[12px]">
              OW
            </div>
            <div className="flex flex-col">
              <span className="text-[13px] font-extrabold text-textPrimary leading-none">Bpk. Haryanto</span>
              <span className="text-textSecondary font-medium text-[10px]">Owner &bull; Cabang 01</span>
            </div>
          </div>
          <div className="flex flex-col items-end border-l border-borderLight pl-4 ml-1">
            <span className="font-extrabold text-[15px] text-textPrimary leading-none">15:42</span>
            <span className="text-[10px] font-bold text-textSecondary uppercase tracking-widest">6 Sep 2026</span>
          </div>
        </div>
      </div>

      <div className="flex flex-1">
        
        {/* Desktop / Tablet Container */}
        <div className="flex-1 flex flex-col w-full max-w-[1280px] mx-auto p-4 md:p-6 gap-4 md:gap-6">
          
          {/* Mobile Header (Only visible on small screens) */}
          <div className="md:hidden flex flex-col shrink-0">
            <div className="flex justify-between items-center w-full mb-4">
              <div className="flex items-center gap-3 cursor-pointer" onClick={onBack}>
                <div className="bg-[#915B30] p-2 rounded-xl text-white shadow-sm border border-[#7A4B27]">
                  <Activity size={20} strokeWidth={2.5} />
                </div>
                <h1 className="text-[18px] font-extrabold text-textPrimary">Command Center</h1>
              </div>
              <div className="bg-success/10 border border-success/30 text-success px-3 py-1 rounded-full text-[11px] font-extrabold">
                Online
              </div>
            </div>
          </div>

          {/* Alert Banner */}
          <div className="bg-[#FEF9E6] rounded-xl px-5 py-3.5 flex justify-between items-center border border-[#FBE3B8] shrink-0">
            <div className="flex items-center gap-4">
              <div className="text-[#D9A34A] shrink-0 bg-white rounded-full p-1 border border-[#FBE3B8]">
                <AlertCircle size={20} strokeWidth={2.5} />
              </div>
              <div className="flex flex-col md:flex-row md:items-center md:gap-2">
                <span className="font-extrabold text-[13px] text-textPrimary">Sistem Otomatis: Stok Menipis (Outlet Utama)</span>
                <span className="hidden md:inline text-borderLight">&bull;</span>
                <span className="text-[12px] font-medium text-textSecondary">
                  Siao May Ayam sisa 5 porsi, Hakau Udang sisa 3 porsi. Diperlukan aksi pengadaan ulang.
                </span>
              </div>
            </div>
            <button className="text-[#915B30] font-extrabold text-[12px] hover:underline shrink-0 bg-white px-3 py-1.5 rounded-lg border border-[#FBE3B8]">
              Tinjau Stok
            </button>
          </div>

          {/* KPI Cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 shrink-0">
            
            <div className="bg-white rounded-2xl p-5 border border-[#D5CBB8] flex flex-col justify-between">
              <div className="flex justify-between items-start mb-4">
                <span className="text-[12px] font-extrabold text-textSecondary uppercase tracking-widest">Gross Revenue</span>
                <div className="w-8 h-8 rounded-full bg-[#5E8C31]/10 flex items-center justify-center text-[#5E8C31]">
                  <TrendingUp size={16} strokeWidth={2.5} />
                </div>
              </div>
              <div className="flex flex-col">
                <span className="font-extrabold text-2xl md:text-[28px] text-textPrimary mb-1">Rp 4.250k</span>
                <span className="text-[11px] font-bold text-[#5E8C31] flex items-center gap-1">
                  &uarr; +12.4% <span className="text-textSecondary font-medium">vs harian rata-rata</span>
                </span>
              </div>
            </div>

            <div className="bg-white rounded-2xl p-5 border border-[#D5CBB8] flex flex-col justify-between">
              <div className="flex justify-between items-start mb-4">
                <span className="text-[12px] font-extrabold text-textSecondary uppercase tracking-widest">Transaksi</span>
                <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                  <Activity size={16} strokeWidth={2.5} />
                </div>
              </div>
              <div className="flex flex-col">
                <span className="font-extrabold text-2xl md:text-[28px] text-textPrimary mb-1">47</span>
                <span className="text-[11px] font-bold text-textSecondary flex items-center gap-1">
                  Puncak order: 12:00 - 13:30
                </span>
              </div>
            </div>

            <div className="bg-white rounded-2xl p-5 border border-[#D5CBB8] flex flex-col justify-between">
              <div className="flex justify-between items-start mb-4">
                <span className="text-[12px] font-extrabold text-textSecondary uppercase tracking-widest">Avg. Ticket Size</span>
                <div className="w-8 h-8 rounded-full bg-surface flex items-center justify-center text-textPrimary border border-borderLight">
                  <Tag size={16} strokeWidth={2.5} />
                </div>
              </div>
              <div className="flex flex-col">
                <span className="font-extrabold text-2xl md:text-[28px] text-textPrimary mb-1">Rp 90.4k</span>
                <span className="text-[11px] font-bold text-[#5E8C31] flex items-center gap-1">
                  &uarr; +5.1% <span className="text-textSecondary font-medium">vs kemarin</span>
                </span>
              </div>
            </div>

            <div className="bg-white rounded-2xl p-5 border border-[#D5CBB8] flex flex-col justify-between">
              <div className="flex justify-between items-start mb-4">
                <span className="text-[12px] font-extrabold text-textSecondary uppercase tracking-widest">Status Outlet</span>
                <div className="w-8 h-8 rounded-full bg-[#5E8C31] flex items-center justify-center text-white border border-[#486D25]">
                  <Wifi size={16} strokeWidth={2.5} />
                </div>
              </div>
              <div className="flex flex-col">
                <span className="font-extrabold text-2xl md:text-[28px] text-textPrimary mb-1">Online</span>
                <span className="text-[11px] font-bold text-textSecondary flex items-center gap-1">
                  Semua POS sinkron (3/3)
                </span>
              </div>
            </div>

          </div>

          {/* Bottom Section */}
          <div className="flex-1 flex flex-col md:flex-row gap-4 md:gap-6">
            
            {/* Top Products Table Container */}
            <div className="flex-[3] flex flex-col bg-white rounded-2xl border border-[#D5CBB8]">
              <div className="px-6 py-4 border-b border-borderLight flex justify-between items-center bg-[#FDFCFB] shrink-0">
                <h2 className="font-extrabold text-[14px] uppercase tracking-widest text-textPrimary">Performa Produk Terlaris</h2>
                <button className="text-primary text-[12px] font-extrabold hover:underline flex items-center gap-1">
                  Lihat Semua Laporan <ChevronRight size={14} />
                </button>
              </div>
              
              {/* Full List (No inner scroll constraint) */}
              <div className="flex-1 p-6">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr>
                      <th className="pb-3 text-[11px] font-extrabold text-textSecondary uppercase tracking-wider border-b border-borderLight w-8">#</th>
                      <th className="pb-3 text-[11px] font-extrabold text-textSecondary uppercase tracking-wider border-b border-borderLight">Nama Produk</th>
                      <th className="pb-3 text-[11px] font-extrabold text-textSecondary uppercase tracking-wider border-b border-borderLight text-right">Terjual</th>
                      <th className="pb-3 text-[11px] font-extrabold text-textSecondary uppercase tracking-wider border-b border-borderLight text-right">Pendapatan</th>
                    </tr>
                  </thead>
                  <tbody>
                    {TOP_PRODUCTS.map((prod, index) => (
                      <tr key={prod.id} className="group hover:bg-surface/50 transition-colors">
                        <td className="py-4 border-b border-borderLight/50">
                          <span className="text-[13px] font-bold text-textSecondary">{index + 1}</span>
                        </td>
                        <td className="py-4 border-b border-borderLight/50">
                          <span className="font-extrabold text-[13px] text-textPrimary">{prod.name}</span>
                        </td>
                        <td className="py-4 border-b border-borderLight/50 text-right">
                          <div className="flex items-center justify-end gap-2">
                            {prod.trend === 'up' && <TrendingUp size={14} className="text-[#5E8C31]" />}
                            {prod.trend === 'down' && <TrendingUp size={14} className="text-[#C53030] rotate-180" />}
                            {prod.trend === 'stable' && <div className="w-2 h-0.5 bg-textSecondary rounded-full"></div>}
                            <span className="text-[13px] font-bold text-textSecondary">{prod.qty} <span className="font-medium text-[11px]">porsi</span></span>
                          </div>
                        </td>
                        <td className="py-4 border-b border-borderLight/50 text-right">
                          <span className="font-extrabold text-[13px] text-textPrimary">{prod.total}</span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Sidebar Data Container */}
            <div className="flex-[2] flex flex-col gap-4 md:gap-6 overflow-hidden">
              
              {/* Promo Widget */}
              <div className="bg-white rounded-2xl border border-[#D5CBB8] overflow-hidden shrink-0">
                <div className="px-5 py-3 border-b border-borderLight bg-[#FDFCFB]">
                  <h2 className="font-extrabold text-[12px] uppercase tracking-widest text-textPrimary">Efektivitas Promosi</h2>
                </div>
                <div className="p-5 flex flex-col gap-4">
                  <div className="bg-[#F9F7F4] border border-[#D5CBB8] rounded-xl p-4 flex justify-between items-center">
                    <div className="flex flex-col">
                      <span className="font-extrabold text-[13px] text-textPrimary mb-1">Diskon Spesial Hakau 25%</span>
                      <span className="text-[11px] font-medium text-textSecondary">Sisa Kuota: 8 / 50</span>
                    </div>
                    <div className="flex flex-col items-end">
                      <span className="font-extrabold text-[18px] text-[#5E8C31]">42x</span>
                      <span className="text-[10px] font-extrabold text-textSecondary uppercase">Digunakan</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Action / Context Widget */}
              <div className="bg-primary text-white rounded-2xl p-6 flex-1 flex flex-col justify-center items-center text-center relative overflow-hidden shrink-0 border border-[#7A4B27] min-h-[150px]">
                {/* Decorative background shape */}
                <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full blur-2xl transform translate-x-1/2 -translate-y-1/2"></div>
                <div className="absolute bottom-0 left-0 w-24 h-24 bg-black/10 rounded-full blur-xl transform -translate-x-1/2 translate-y-1/2"></div>
                
                <Activity size={32} strokeWidth={2} className="mb-4 text-white/80 relative z-10" />
                <h3 className="font-extrabold text-[15px] mb-2 relative z-10">Pusat Kendali Sistem Aktif</h3>
                <p className="text-[12px] font-medium text-white/70 max-w-[200px] leading-relaxed relative z-10">
                  Seluruh fitur kasir & laporan lengkap dapat diakses melalui menu navigasi samping (☰).
                </p>
              </div>

            </div>

          </div>

          {/* Mobile Footer Spacing padding */}
          <div className="h-6 md:hidden shrink-0 w-full"></div>

        </div>
      </div>
    </div>
  )
}
