import { useState } from 'react'
import { Printer, Users, Home, Percent, QrCode, Link2, UploadCloud, AlertTriangle , Menu } from 'lucide-react'
import { useSidebar } from '../context/SidebarContext'

export default function SettingsScreen({ onBack }: { onBack: () => void }) {
  const [activeTab, setActiveTab] = useState('pajak')
  
  // Pajak states
  const [isPajakActive, setIsPajakActive] = useState(true)
  const [pajakRate, setPajakRate] = useState(11)
  const [serviceCharge, setServiceCharge] = useState(0)

  // QRIS states
  const [qrisMode, setQrisMode] = useState<'dinamis' | 'statis'>('statis')

  // Mobile accordion states


  const TABS = [
    { id: 'printer', label: 'Printer & Struk', icon: Printer },
    { id: 'users', label: 'User & Hak Akses', icon: Users },
    { id: 'outlet', label: 'Detail Outlet', icon: Home },
    { id: 'pajak', label: 'Pajak & Biaya', icon: Percent },
    { id: 'qris', label: 'Metode QRIS', icon: QrCode },
    { id: 'integrasi', label: 'Integrasi Apps', icon: Link2 },
  ]

  const formatRp = (num: number) => num.toLocaleString('id-ID')
  
  // Simulation calc
  const simPrice = 24000
  const simPajak = (simPrice * pajakRate) / 100
  const simTotal = simPrice + simPajak

  const { toggleSidebar } = useSidebar();

  return (
    <div className="flex flex-col w-full h-full md:h-screen bg-[#F9F7F4] md:bg-white font-sans overflow-hidden">
      
      {/* Top Bar - Tablet Main */}
      <div className="hidden md:flex bg-white px-6 py-3 justify-between items-center border-b border-border shadow-sm z-10 shrink-0">
        <div className="flex items-center gap-3">
          
          <button onClick={toggleSidebar} className="p-2 -ml-2 rounded-xl text-textPrimary hover:bg-surface transition-colors hidden md:flex">
            <Menu size={22} />
          </button>
          <span className="font-extrabold text-lg tracking-tight text-primary">
            {activeTab === 'pajak' ? 'Pengaturan Sistem' : 'Pengaturan QRIS'}
          </span>
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
        
        {/* Left Sidebar (Tablet) */}
        <div className="hidden md:flex w-[260px] bg-[#FAF9F7] border-r border-borderLight flex-col shrink-0 pt-6">
          <div className="px-6 mb-4">
            <span className="text-[12px] font-extrabold text-textSecondary uppercase tracking-widest">Kategori Pengaturan</span>
          </div>
          <div className="flex flex-col px-4 gap-1.5">
            {TABS.map(tab => {
              const isActive = activeTab === tab.id
              const Icon = tab.icon
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-4 px-4 py-3.5 rounded-xl text-left transition-colors font-extrabold text-[14px] ${
                    isActive ? 'bg-[#EBE7DF] text-[#915B30]' : 'text-textPrimary hover:bg-surface'
                  }`}
                >
                  <Icon size={20} strokeWidth={isActive ? 2.5 : 2} className={isActive ? 'text-[#915B30]' : 'text-textSecondary'} />
                  {tab.label}
                </button>
              )
            })}
          </div>
        </div>

        {/* Right Content / Mobile Main */}
        <div className="flex-1 flex flex-col md:overflow-y-auto w-full md:bg-white bg-[#F9F7F4] relative">
          
          {/* Mobile Header */}
          <div className="md:hidden flex flex-col px-4 pt-4 pb-2 w-full border-b border-borderLight bg-[#F9F7F4] shrink-0">
            <div className="flex items-center gap-3 mb-1 cursor-pointer" onClick={onBack}>
              <div className="bg-surface border border-borderLight p-2 rounded-lg text-primary">
                <div className="w-4 h-0.5 bg-primary rounded-full"></div>
              </div>
              <h1 className="text-xl font-extrabold text-textPrimary">Pengaturan POS</h1>
            </div>
            <p className="text-textSecondary text-[12px]">Konfigurasi sistem, pajak, & integrasi perangkat</p>
          </div>

          {/* TABLET: Pajak Tab */}
          {activeTab === 'pajak' && (
            <div className="hidden md:flex flex-col p-8 max-w-[800px] w-full">
              <h1 className="font-extrabold text-2xl text-textPrimary mb-2">Pengaturan Pajak & Biaya tambahan</h1>
              <p className="text-textSecondary text-[14px] font-medium mb-8">Sesuaikan nilai persentase pajak PPN dan service charge untuk transaksi kasir.</p>
              
              <div className="bg-white border border-[#D5CBB8] rounded-xl overflow-hidden shadow-sm">
                
                {/* Switch section */}
                <div className="p-6 border-b border-borderLight flex justify-between items-center">
                  <div className="flex flex-col gap-1">
                    <span className="font-extrabold text-[15px] text-textPrimary">Aktifkan Pajak PPN</span>
                    <span className="text-[13px] text-textSecondary font-medium">Otomatis menambahkan PPN di setiap struk cetak dan hitungan checkout.</span>
                  </div>
                  <div 
                    onClick={() => setIsPajakActive(!isPajakActive)}
                    className={`w-14 h-7 rounded-full relative cursor-pointer shadow-inner transition-colors ${isPajakActive ? 'bg-[#915B30]' : 'bg-gray-300'}`}
                  >
                    <div className={`w-6 h-6 bg-white rounded-full absolute top-0.5 shadow-sm transition-transform ${isPajakActive ? 'right-0.5' : 'left-0.5'}`}></div>
                  </div>
                </div>

                {/* Inputs */}
                <div className="p-6 border-b border-borderLight grid grid-cols-2 gap-6 bg-white">
                  <div className="flex flex-col gap-2">
                    <label className="text-[12px] font-extrabold text-textSecondary uppercase tracking-widest">Tarif Pajak PPN (%)</label>
                    <div className="relative border border-[#D5CBB8] rounded-lg overflow-hidden bg-white">
                      <input 
                        type="number"
                        value={pajakRate}
                        onChange={(e) => setPajakRate(Number(e.target.value))}
                        className="w-full px-4 py-3 text-[15px] font-extrabold text-textPrimary outline-none focus:border-primary"
                      />
                      <span className="absolute right-4 top-1/2 -translate-y-1/2 text-textSecondary font-extrabold">%</span>
                    </div>
                  </div>
                  <div className="flex flex-col gap-2">
                    <label className="text-[12px] font-extrabold text-textSecondary uppercase tracking-widest">Biaya Servis / Service Charge (%)</label>
                    <div className="relative border border-[#D5CBB8] rounded-lg overflow-hidden bg-white">
                      <input 
                        type="number"
                        value={serviceCharge}
                        onChange={(e) => setServiceCharge(Number(e.target.value))}
                        className="w-full px-4 py-3 text-[15px] font-extrabold text-textPrimary outline-none focus:border-primary"
                      />
                      <span className="absolute right-4 top-1/2 -translate-y-1/2 text-textSecondary font-extrabold">%</span>
                    </div>
                  </div>
                </div>

                {/* Simulasi */}
                <div className="p-6 bg-[#FAF9F7]">
                  <span className="font-extrabold text-[13px] text-[#915B30] mb-4 block">Simulasi Perhitungan Nota:</span>
                  <div className="flex flex-col gap-2 mb-4">
                    <div className="flex justify-between items-center text-[13px] text-textPrimary font-medium">
                      <span>Siao May Ayam Udang (1 Porsi)</span>
                      <span className="font-extrabold">Rp {formatRp(simPrice)}</span>
                    </div>
                    {isPajakActive && (
                      <div className="flex justify-between items-center text-[13px] text-textSecondary font-medium">
                        <span>PPN Aktif ({pajakRate}%)</span>
                        <span className="font-extrabold">Rp {formatRp(simPajak)}</span>
                      </div>
                    )}
                  </div>
                  <div className="h-px w-full bg-borderLight mb-3"></div>
                  <div className="flex justify-between items-center text-[15px]">
                    <span className="font-extrabold text-textPrimary">Total Akhir Nota Pelanggan</span>
                    <span className="font-extrabold text-[#915B30]">Rp {formatRp(simTotal)}</span>
                  </div>
                </div>

              </div>

              <div className="flex justify-end mt-8">
                <button className="px-6 py-3 bg-[#915B30] hover:bg-[#7A4B27] text-white font-extrabold rounded-lg transition-colors shadow-sm text-[14px]">
                  Simpan Perubahan Pajak
                </button>
              </div>

            </div>
          )}

          {/* TABLET: QRIS Tab */}
          {activeTab === 'qris' && (
            <div className="hidden md:flex flex-col p-8 max-w-[900px] w-full">
              <h1 className="font-extrabold text-2xl text-textPrimary mb-2">Metode Pembayaran QRIS</h1>
              <p className="text-textSecondary text-[14px] font-medium mb-8">Atur bagaimana mesin POS Anda memproses metode pembayaran digital QRIS.</p>
              
              <div className="border border-[#D5CBB8] rounded-xl overflow-hidden shadow-sm bg-white p-6">
                <span className="text-[12px] font-extrabold text-textSecondary uppercase tracking-widest block mb-4">Mode Operasional QRIS</span>
                
                <div className="grid grid-cols-2 gap-4 mb-6">
                  {/* Dinamis */}
                  <div 
                    onClick={() => setQrisMode('dinamis')}
                    className={`border rounded-xl p-4 cursor-pointer transition-colors flex gap-4 ${qrisMode === 'dinamis' ? 'border-[#915B30] bg-[#EBE7DF]' : 'border-borderLight bg-white hover:border-[#915B30]/50'}`}
                  >
                    <div className="mt-0.5">
                      <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${qrisMode === 'dinamis' ? 'border-[#915B30]' : 'border-borderLight'}`}>
                        {qrisMode === 'dinamis' && <div className="w-2.5 h-2.5 rounded-full bg-[#915B30]"></div>}
                      </div>
                    </div>
                    <div className="flex flex-col gap-1">
                      <span className={`font-extrabold text-[14px] ${qrisMode === 'dinamis' ? 'text-[#915B30]' : 'text-textSecondary'}`}>QRIS Dinamis (Payment Gateway)</span>
                      <span className="text-[12px] font-medium text-textSecondary">Nilai transaksi otomatis masuk QR. Sinkron otomatis.</span>
                    </div>
                  </div>

                  {/* Statis */}
                  <div 
                    onClick={() => setQrisMode('statis')}
                    className={`border rounded-xl p-4 cursor-pointer transition-colors flex gap-4 ${qrisMode === 'statis' ? 'border-[#915B30] bg-[#EBE7DF]' : 'border-borderLight bg-white hover:border-[#915B30]/50'}`}
                  >
                    <div className="mt-0.5">
                      <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${qrisMode === 'statis' ? 'border-[#915B30]' : 'border-borderLight'}`}>
                        {qrisMode === 'statis' && <div className="w-2.5 h-2.5 rounded-full bg-[#915B30]"></div>}
                      </div>
                    </div>
                    <div className="flex flex-col gap-1">
                      <span className={`font-extrabold text-[14px] ${qrisMode === 'statis' ? 'text-[#915B30]' : 'text-textSecondary'}`}>QRIS Statis (Upload QR Toko)</span>
                      <span className="text-[12px] font-medium text-textPrimary">Upload gambar QRIS e-wallet merchant Hasuka Anda.</span>
                    </div>
                  </div>
                </div>

                {qrisMode === 'statis' && (
                  <>
                    <div className="grid grid-cols-[1fr_350px] gap-6 mb-6">
                      
                      {/* Upload Box */}
                      <div className="border-2 border-dashed border-[#D5CBB8] rounded-xl flex flex-col items-center justify-center bg-[#FAF9F7] py-10 px-6 cursor-pointer hover:bg-surface hover:border-[#915B30]/50 transition-colors">
                        <UploadCloud size={32} className="text-[#915B30] mb-3" />
                        <span className="font-extrabold text-[15px] text-[#915B30] mb-1">Upload Gambar QRIS Baru</span>
                        <span className="text-[12px] font-medium text-textSecondary">Mendukung file PNG, JPG, JPEG (Rekomendasi rasio 1:1)</span>
                      </div>

                      {/* Preview Box */}
                      <div className="border border-[#D5CBB8] rounded-xl p-6 flex gap-4 bg-white items-center">
                        <div className="w-24 h-24 bg-gray-200 rounded-lg overflow-hidden p-2 flex items-center justify-center">
                          {/* Placeholder QR Code visual */}
                          <div className="w-full h-full border-[6px] border-black p-2 flex items-center justify-center relative">
                            <div className="absolute top-0 left-0 w-3 h-3 bg-black"></div>
                            <div className="absolute top-0 right-0 w-3 h-3 bg-black"></div>
                            <div className="absolute bottom-0 left-0 w-3 h-3 bg-black"></div>
                            <div className="w-6 h-6 border-[3px] border-black"></div>
                          </div>
                        </div>
                        <div className="flex flex-col gap-1.5">
                          <span className="font-extrabold text-[14px] text-textPrimary">QR_Hasuka_POS.png</span>
                          <span className="text-[12px] font-medium text-textSecondary mb-1">Ukuran: 235 KB</span>
                          <span className="bg-[#5E8C31] text-white text-[10px] font-extrabold px-2 py-0.5 rounded w-fit uppercase">Ready</span>
                        </div>
                      </div>

                    </div>

                    {/* Alert Box */}
                    <div className="bg-[#FEF3C7] border border-[#D97706] rounded-lg p-4 flex gap-3">
                      <AlertTriangle size={20} className="text-[#D97706] shrink-0" />
                      <span className="text-[13px] text-textPrimary leading-snug">
                        <span className="font-extrabold">Catatan QRIS Statis:</span> Pelanggan harus scan kode dan memasukkan nominal pembayaran secara manual di aplikasi e-wallet masing-masing. Kasir diwajibkan memverifikasi bukti struk bayar dari HP pelanggan sebelum menekan tombol transaksi sukses.
                      </span>
                    </div>
                  </>
                )}

              </div>

              <div className="flex justify-end mt-8">
                <button className="px-6 py-3 bg-[#915B30] hover:bg-[#7A4B27] text-white font-extrabold rounded-lg transition-colors shadow-sm text-[14px]">
                  Simpan QRIS Statis
                </button>
              </div>

            </div>
          )}

          {/* MOBILE Accordion View */}
          <div className="md:hidden flex-1 overflow-y-auto scrollbar-hide px-4 pt-4 pb-24">
            
            {/* Accordion 1 */}
            <div className="border border-[#D5CBB8] rounded-xl bg-white mb-3 shadow-sm overflow-hidden">
              <div className="px-4 py-4 flex justify-between items-center cursor-pointer bg-white">
                <span className="font-extrabold text-[15px] text-textPrimary">Printer & Cetak Struk</span>
                <div className="w-4 h-0.5 bg-textPrimary"></div>
              </div>
            </div>

            {/* Accordion 2 */}
            <div className="border border-[#D5CBB8] rounded-xl bg-white mb-3 shadow-sm overflow-hidden">
              <div className="px-4 py-4 flex justify-between items-center cursor-pointer bg-white">
                <span className="font-extrabold text-[15px] text-textPrimary">User & Manajer Role</span>
                <div className="w-4 h-0.5 bg-textPrimary"></div>
              </div>
            </div>

            {/* Accordion 3 */}
            <div className="border border-[#D5CBB8] rounded-xl bg-white mb-3 shadow-sm overflow-hidden">
              <div className="px-4 py-4 flex justify-between items-center cursor-pointer bg-white">
                <span className="font-extrabold text-[15px] text-textPrimary">Outlet Cabang</span>
                <div className="w-4 h-0.5 bg-textPrimary"></div>
              </div>
            </div>

            {/* Accordion 4 (Pajak) - Expanded */}
            <div className="border-2 border-[#915B30] rounded-xl bg-white mb-3 shadow-sm overflow-hidden">
              <div 
                className="px-4 py-4 flex justify-between items-center cursor-pointer border-b border-[#EBE7DF]"
              >
                <span className="font-extrabold text-[15px] text-[#915B30]">Pengaturan Pajak (PPN)</span>
                <div className="w-4 h-0.5 bg-[#915B30]"></div>
              </div>
              
              <div className="p-4 bg-white flex flex-col gap-5">
                <div className="flex justify-between items-center">
                  <span className="text-[14px] font-medium text-textPrimary">Aktifkan PPN Restoran</span>
                  <div 
                    onClick={() => setIsPajakActive(!isPajakActive)}
                    className={`w-14 h-7 rounded-full relative cursor-pointer shadow-inner transition-colors ${isPajakActive ? 'bg-[#5E8C31]' : 'bg-gray-300'}`}
                  >
                    <div className={`w-6 h-6 bg-white border border-gray-100 rounded-full absolute top-0.5 shadow-sm transition-transform ${isPajakActive ? 'right-0.5' : 'left-0.5'}`}></div>
                  </div>
                </div>
                
                <div className="flex justify-between items-center">
                  <span className="text-[14px] font-medium text-textPrimary">Tarif Pajak Standard</span>
                  <div className="bg-[#EBE7DF] rounded-lg px-3 py-2 flex items-center font-extrabold text-[14px] text-textPrimary w-[80px] justify-center">
                    11 %
                  </div>
                </div>
              </div>
            </div>

            {/* Accordion 5 */}
            <div className="border border-[#D5CBB8] rounded-xl bg-white mb-3 shadow-sm overflow-hidden">
              <div className="px-4 py-4 flex justify-between items-center cursor-pointer bg-white">
                <span className="font-extrabold text-[15px] text-textPrimary">Pengaturan Qris</span>
                <div className="w-4 h-0.5 bg-textPrimary"></div>
              </div>
            </div>

            {/* Accordion 6 */}
            <div className="border border-[#D5CBB8] rounded-xl bg-white mb-3 shadow-sm overflow-hidden">
              <div className="px-4 py-4 flex justify-between items-center cursor-pointer bg-white">
                <span className="font-extrabold text-[15px] text-textPrimary">Integrasi Grab/Gofood</span>
                <div className="w-4 h-0.5 bg-textPrimary"></div>
              </div>
            </div>
            
          </div>

          {/* Mobile Footer Button */}
          <div className="md:hidden fixed bottom-6 left-4 right-4 z-20">
            <button className="w-full bg-[#915B30] hover:bg-[#7A4B27] text-white font-extrabold py-3.5 rounded-xl transition-colors text-[15px] shadow-lg">
              Simpan Konfigurasi
            </button>
          </div>

        </div>
      </div>
    </div>
  )
}
