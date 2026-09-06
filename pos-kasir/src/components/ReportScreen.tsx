import { useState } from 'react'
import { RefreshCw, Download , Menu } from 'lucide-react'
import { useSidebar } from '../context/SidebarContext'

// Dummy Data matching Figma
const CHART_DATA_TABLET = [
  { day: 'Sen', value: '1.2M', height: '20%' },
  { day: 'Sel', value: '1.5M', height: '25%' },
  { day: 'Rab', value: '1.8M', height: '30%' },
  { day: 'Kam', value: '1.4M', height: '23%' },
  { day: 'Jum', value: '2.4M', height: '40%' },
  { day: 'Sab', value: '3.8M', height: '65%' },
  { day: 'Min', value: '4.3M', height: '75%', isToday: true },
]

const CHART_DATA_MOBILE = [
  { time: '10', height: '30%' },
  { time: '12', height: '55%' },
  { time: '14', height: '45%' },
  { time: '16', height: '80%' },
  { time: '18', height: '65%' },
  { time: '20', height: '40%' },
]

const TOP_PRODUCTS = [
  { id: 1, name: 'Siao May Ayam Udang (Isi 4)', category: 'Dimsum Kukus', qty: '214', total: 'Rp 5.136.000' },
  { id: 2, name: 'Hakau Udang Garing (Isi 3)', category: 'Dimsum Kukus', qty: '156', total: 'Rp 3.276.000' },
  { id: 3, name: 'Lumpia Kulit Tahu Goreng', category: 'Dimsum Goreng', qty: '98', total: 'Rp 2.254.000' },
  { id: 4, name: 'Ceker Ayam Saus Szechuan', category: 'Dimsum Kukus', qty: '74', total: 'Rp 1.443.000' },
]

export default function ReportScreen({ onBack }: { onBack: () => void }) {
  const [activeTabletFilter, setActiveTabletFilter] = useState('Hari Ini')
  const [activeMobileFilter, setActiveMobileFilter] = useState('Hari Ini')

  const { toggleSidebar } = useSidebar();

  return (
    <div className="flex flex-col w-full h-full md:h-screen bg-[#F9F7F4] md:bg-white font-sans overflow-hidden">
      
      {/* Top Bar - Tablet Main */}
      <div className="hidden md:flex bg-white px-6 py-3 justify-between items-center border-b border-border shadow-sm z-10 shrink-0">
        <div className="flex items-center gap-3">
          
          <button onClick={toggleSidebar} className="p-2 -ml-2 rounded-xl text-textPrimary hover:bg-surface transition-colors hidden md:flex">
            <Menu size={22} />
          </button>
          <span className="font-extrabold text-lg tracking-tight text-primary">Laporan Penjualan & Analytics</span>
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

      <div className="flex flex-1 overflow-y-auto scrollbar-hide md:overflow-hidden bg-[#F9F7F4] md:bg-[#F9F7F4]">
        
        <div className="flex-1 flex flex-col md:overflow-y-auto w-full max-w-[1200px] mx-auto pb-24 md:pb-8">
          
          {/* Mobile Header */}
          <div className="md:hidden flex flex-col px-4 pt-4 pb-2 w-full border-b border-borderLight bg-[#F9F7F4] shrink-0">
            <div className="flex items-center gap-3 mb-1 cursor-pointer" onClick={onBack}>
              <div className="bg-surface border border-borderLight p-2 rounded-lg text-primary">
                <div className="w-4 h-0.5 bg-primary rounded-full"></div>
              </div>
              <h1 className="text-xl font-extrabold text-textPrimary">Laporan Penjualan</h1>
            </div>
            <p className="text-textSecondary text-[13px]">Ringkasan omzet & performa menu</p>
          </div>

          {/* Controls: Tablet */}
          <div className="hidden md:flex justify-between items-center px-6 py-5 border-b border-borderLight bg-white shrink-0">
            <div className="flex gap-3">
              {['Hari Ini', 'Minggu Ini', 'Bulan Ini', 'Tahun Ini', 'Kustom 📅'].map(filter => (
                <button 
                  key={filter}
                  onClick={() => setActiveTabletFilter(filter)}
                  className={`px-5 py-2 rounded-full text-[13px] font-extrabold border transition-colors ${
                    activeTabletFilter === filter 
                      ? 'bg-primary border-primary text-white' 
                      : 'bg-white border-borderLight text-textPrimary hover:bg-surface'
                  }`}
                >
                  {filter}
                </button>
              ))}
            </div>
            <div className="flex gap-3">
              <button className="flex items-center gap-2 px-4 py-2 border border-borderLight bg-white hover:bg-surface rounded-lg font-extrabold text-textPrimary text-[13px] transition-colors">
                <RefreshCw size={16} />
                Sinkronisasi
              </button>
              <button className="flex items-center gap-2 px-5 py-2 bg-primary hover:bg-primaryHover text-white rounded-lg font-extrabold text-[13px] transition-colors shadow-sm">
                <Download size={16} />
                Unduh Laporan
              </button>
            </div>
          </div>

          {/* Controls: Mobile */}
          <div className="md:hidden flex gap-2 px-4 py-3 bg-[#F9F7F4] border-b border-borderLight overflow-x-auto scrollbar-hide shrink-0">
            {['Hari Ini', 'Kemarin', '7 Hari Terakhir', 'Bulan Ini'].map(filter => (
              <button 
                key={filter}
                onClick={() => setActiveMobileFilter(filter)}
                className={`px-4 py-1.5 rounded-full text-[13px] font-extrabold border whitespace-nowrap transition-colors ${
                  activeMobileFilter === filter 
                    ? 'bg-primary border-primary text-white' 
                    : 'bg-white border-borderLight text-textPrimary'
                }`}
              >
                {filter}
              </button>
            ))}
          </div>

          {/* Tablet Content Container */}
          <div className="hidden md:flex flex-col p-6 gap-6">
            
            {/* KPI Cards Tablet */}
            <div className="grid grid-cols-4 gap-4">
              <div className="bg-[#EBE7DF] border border-[#D5CBB8] rounded-xl p-5 flex flex-col justify-center">
                <span className="text-[11px] font-extrabold text-textSecondary uppercase tracking-wider mb-2">Total Penjualan Kotor</span>
                <span className="font-extrabold text-2xl text-primary mb-1">Rp 16.350.000</span>
                <span className="text-[12px] font-bold text-[#5E8C31]">▲ 14.2% dari minggu lalu</span>
              </div>
              <div className="bg-[#EBE7DF] border border-[#D5CBB8] rounded-xl p-5 flex flex-col justify-center">
                <span className="text-[11px] font-extrabold text-textSecondary uppercase tracking-wider mb-2">Jumlah Transaksi</span>
                <span className="font-extrabold text-2xl text-textPrimary mb-1">184 Transaksi</span>
                <span className="text-[12px] font-bold text-[#5E8C31]">▲ 8.5% dari minggu lalu</span>
              </div>
              <div className="bg-[#EBE7DF] border border-[#D5CBB8] rounded-xl p-5 flex flex-col justify-center">
                <span className="text-[11px] font-extrabold text-textSecondary uppercase tracking-wider mb-2">Rata-Rata Transaksi</span>
                <span className="font-extrabold text-2xl text-textPrimary mb-1">Rp 88.850</span>
                <span className="text-[12px] font-bold text-[#5E8C31]">▲ 2.1% kenaikan tiket size</span>
              </div>
              <div className="bg-[#EBE7DF] border border-[#D5CBB8] rounded-xl p-5 flex flex-col justify-center">
                <span className="text-[11px] font-extrabold text-textSecondary uppercase tracking-wider mb-2">Metode Metode Pembayaran</span>
                <span className="font-extrabold text-xl text-[#D97706] mb-1">65% QRIS &bull; 35% Tunai</span>
                <span className="text-[12px] font-medium text-textSecondary">Dominasi transaksi non-tunai</span>
              </div>
            </div>

            {/* Charts and Top Products Tablet */}
            <div className="grid grid-cols-[1.2fr_1fr] gap-6">
              
              {/* Chart */}
              <div className="bg-white border border-borderLight rounded-xl p-6 shadow-sm flex flex-col">
                <div className="flex justify-between items-center mb-10">
                  <h2 className="font-extrabold text-lg text-textPrimary">Tren Omzet Harian (Mingguan)</h2>
                  <span className="text-[13px] font-medium text-textSecondary">Rp dalam Jutaan</span>
                </div>
                <div className="flex-1 flex items-end justify-between min-h-[250px]">
                  {CHART_DATA_TABLET.map((data, idx) => (
                    <div key={idx} className="flex flex-col items-center flex-1 h-full justify-end">
                      <span className="font-extrabold text-[12px] text-textPrimary mb-2">{data.value}</span>
                      <div 
                        className={`w-10 rounded-t-sm transition-all ${data.isToday ? 'bg-[#E76F51]' : 'bg-primary'}`}
                        style={{ height: data.height }}
                      ></div>
                      <span className="font-extrabold text-[13px] text-textPrimary mt-3">{data.day}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Top Products */}
              <div className="bg-white border border-borderLight rounded-xl p-6 shadow-sm flex flex-col">
                <h2 className="font-extrabold text-lg text-textPrimary mb-6">Produk Terlaris (Top 4)</h2>
                <div className="flex flex-col gap-4">
                  {TOP_PRODUCTS.map((prod, idx) => (
                    <div key={prod.id} className="flex items-center gap-4 py-3 border-b border-borderLight/60 last:border-0">
                      <div className={`w-6 h-6 rounded-full flex items-center justify-center font-extrabold text-[11px] shrink-0 ${
                        idx === 0 || idx === 1 ? 'bg-[#C78749] text-white' : 'bg-[#EBE7DF] text-primary'
                      }`}>
                        {prod.id}
                      </div>
                      <div className="flex-1 flex flex-col">
                        <span className="font-extrabold text-[14px] text-textPrimary">{prod.name}</span>
                        <span className="text-[12px] font-medium text-textSecondary">{prod.category} &bull; {prod.qty} Porsi Terjual</span>
                      </div>
                      <span className="font-extrabold text-[14px] text-primary shrink-0">{prod.total}</span>
                    </div>
                  ))}
                </div>
              </div>

            </div>
          </div>

          {/* Mobile Content Container */}
          <div className="md:hidden flex flex-col px-4 pt-4 gap-4">
            
            {/* KPI Cards Mobile */}
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-[#EBE7DF] border border-[#D5CBB8] rounded-xl p-3 flex flex-col justify-center">
                <span className="text-[11px] font-medium text-textSecondary mb-1">Total Penjualan</span>
                <span className="font-extrabold text-[18px] text-textPrimary leading-tight">Rp 4.820.000</span>
              </div>
              <div className="bg-white border border-borderLight rounded-xl p-3 flex flex-col justify-center">
                <span className="text-[11px] font-medium text-textSecondary mb-1">Transaksi</span>
                <span className="font-extrabold text-[18px] text-textPrimary leading-tight">96 Order</span>
              </div>
            </div>

            {/* Chart Mobile */}
            <div className="bg-white border border-borderLight rounded-xl p-4 shadow-sm">
              <h2 className="font-extrabold text-[15px] text-textPrimary mb-6">Grafik Omzet Per Jam</h2>
              <div className="flex items-end justify-between h-[120px] px-2">
                {CHART_DATA_MOBILE.map((data, idx) => (
                  <div key={idx} className="flex flex-col items-center flex-1 h-full justify-end gap-2">
                    <div 
                      className="w-4 bg-primary rounded-t-sm"
                      style={{ height: data.height }}
                    ></div>
                    <span className="text-[10px] text-textSecondary font-medium">{data.time}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Top Products Mobile */}
            <div className="bg-white border border-borderLight rounded-xl p-4 shadow-sm mb-4">
              <h2 className="font-extrabold text-[15px] text-textPrimary mb-4">Produk Terlaris</h2>
              <div className="flex flex-col gap-4">
                {TOP_PRODUCTS.slice(0,2).map((prod) => (
                  <div key={prod.id} className="flex justify-between items-center">
                    <div className="flex flex-col gap-0.5">
                      <span className="font-extrabold text-[14px] text-textPrimary">{prod.name.replace(' (Isi 4)', '').replace(' (Isi 3)', '')}</span>
                      <span className="text-[12px] font-medium text-textSecondary">{prod.qty} porsi</span>
                    </div>
                    <span className="font-extrabold text-[14px] text-primary">{prod.total}</span>
                  </div>
                ))}
              </div>
            </div>

          </div>

          {/* Mobile Floating Button */}
          <div className="md:hidden fixed bottom-6 left-4 right-4 z-20">
            <button className="w-full bg-white border-2 border-primary text-primary hover:bg-surface font-extrabold py-3.5 rounded-xl transition-colors text-[14px] shadow-lg">
              Unduh Laporan PDF / CSV
            </button>
          </div>

        </div>
      </div>
    </div>
  )
}
