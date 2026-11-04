import { useState, useRef, useEffect } from 'react'
import { createPortal } from 'react-dom'
import { Printer, Home, Percent, Link2, FileText, UploadCloud, Loader2, Bluetooth, Usb, CheckCircle2, AlertTriangle, RefreshCw, Power, DollarSign, X, Search, ChevronDown } from 'lucide-react'
import PageShell from './PageShell'
import { useApp } from '../context/AppContext'
import { gasApi, compressImageFile } from '../services/gasApi'
import { setLocalSetting } from '../services/db'
import { HASUKA_LOGO } from '../assets/logo'
import { generateReceiptString } from '../utils/receiptPrinter'
import { getStoredPrinterSettings, savePrinterSettings, printTestReceipt, PrinterSettingsConfig } from '../services/printer'
import { webSerialPrinter, WebSerialStatus } from '../services/webSerialPrinter'
import { WarmSelect } from './common/WarmSelect'
import { showToast } from './Alert'
import { Button } from './common/Button'

const TABS = [
  { id: 'pajak', label: 'Pajak & Biaya', icon: Percent },
  { id: 'struk', label: 'Struk & Nota', icon: FileText },
  { id: 'printer', label: 'Printer', icon: Printer },
  { id: 'outlet', label: 'Detail Outlet', icon: Home },
  { id: 'integrasi', label: 'Integrasi', icon: Link2 },
]

export default function SettingsScreen({ onBack, backLabel, onNavigate }: { onBack: () => void; backLabel?: string; onNavigate?: (s: string) => void }) {
  const { taxRate, setTaxRate, serviceRate, setServiceRate, receiptSettings, setReceiptSettings, outlet, refreshData, setHasActiveMutation } = useApp()
  const [activeTab, setActiveTab] = useState('pajak')
  const [isSaving, setIsSaving] = useState(false)
  const [isPajakActive, setIsPajakActive] = useState(taxRate > 0)
  const [pajakRate, setPajakRate] = useState(taxRate)
  const [serviceCharge, setServiceCharge] = useState(serviceRate)
  const [customPajakInput, setCustomPajakInput] = useState('')
  const [customServiceInput, setCustomServiceInput] = useState('')
  const [receiptDraft, setReceiptDraft] = useState(receiptSettings)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [isUploadingLogo, setIsUploadingLogo] = useState(false)
  const [gasUrl, setGasUrlInput] = useState(gasApi.getUrl())
  const [testing, setTesting] = useState(false)
  const [syncing, setSyncing] = useState(false)
  const [testResult, setTestResult] = useState<{ success?: boolean; message?: string } | null>(null)
  const [savedMsg, setSavedMsg] = useState(false)
  const [printerDraft, setPrinterDraft] = useState<PrinterSettingsConfig>(() => {
    const stored = getStoredPrinterSettings()
    if (stored.printerType === 'system_browser') {
      return { ...stored, printerType: 'bluetooth_serial' }
    }
    return stored
  })
  const [isTestingPrinter, setIsTestingPrinter] = useState(false)
  const [serialStatus, setSerialStatus] = useState<WebSerialStatus>(() => webSerialPrinter.getStatus())
  const [serialPortName, setSerialPortName] = useState<string>(() => webSerialPrinter.getPortName())
  const [isConnectingSerial, setIsConnectingSerial] = useState(false)
  const [isTestingDrawer, setIsTestingDrawer] = useState(false)
  const [isPortModalOpen, setIsPortModalOpen] = useState(false)
  const [availablePorts, setAvailablePorts] = useState<any[]>([])
  const [isLoadingPorts, setIsLoadingPorts] = useState(false)
  const [showAdvancedPrinter, setShowAdvancedPrinter] = useState(false)
  const paperCardRefs = useRef<Array<HTMLDivElement | null>>([])

  // Reset modal port jika berpindah tab
  useEffect(() => {
    setIsPortModalOpen(false)
  }, [activeTab])



  // Kunci scroll halaman belakang dan tangani tombol Escape saat modal port terbuka
  useEffect(() => {
    if (!isPortModalOpen) return

    const originalOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setIsPortModalOpen(false)
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => {
      document.body.style.overflow = originalOverflow
      window.removeEventListener('keydown', handleKeyDown)
    }
  }, [isPortModalOpen])

  useEffect(() => {
    const unsub = webSerialPrinter.subscribe((status, name) => {
      setSerialStatus(status)
      setSerialPortName(name)
    })
    if (webSerialPrinter.isSupported()) {
      const mode = printerDraft.printerType === 'usb_serial' ? 'usb_serial' : 'bluetooth_serial'
      webSerialPrinter.autoReconnect(mode).catch(() => {})
    }
    return () => unsub()
  }, [printerDraft.printerType])

  // Muat daftar port tersimpan setiap kali modal dibuka atau mode koneksi berubah saat modal aktif
  useEffect(() => {
    if (!isPortModalOpen || !webSerialPrinter.isSupported()) return

    let isCancelled = false
    setIsLoadingPorts(true)
    const mode = printerDraft.printerType === 'usb_serial' ? 'usb_serial' : 'bluetooth_serial'
    webSerialPrinter.getAuthorizedPorts(mode)
      .then(ports => {
        if (!isCancelled) {
          setAvailablePorts(ports)
          setIsLoadingPorts(false)
        }
      })
      .catch(() => {
        if (!isCancelled) {
          setAvailablePorts([])
          setIsLoadingPorts(false)
        }
      })

    return () => {
      isCancelled = true
    }
  }, [isPortModalOpen, printerDraft.printerType])

  const handleUploadLogo = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    if (file.size > 5 * 1024 * 1024) {
      showToast({ variant: 'warning', title: 'Ukuran foto maksimal 5MB', description: 'Silakan pilih gambar yang lebih kecil.' })
      return
    }
    setIsUploadingLogo(true)
    try {
      // 1. Kompresi gambar client-side menjadi Base64 (max 250x250, quality 0.8)
      // Base64 langsung siap ditampilkan di preview & disimpan ke Settings sheet (cell limit 50KB)
      const { base64 } = await compressImageFile(file, 250, 250, 0.8)
      setReceiptDraft(prev => ({ ...prev, logoUrl: base64 }))
      setReceiptSettings(prev => ({ ...prev, logoUrl: base64 }))
      setLocalSetting('logo_url', base64).catch(() => {})

      // 2. Backup upload ke Google Drive di background (non-blocking & fire-and-forget)
      // Jika Google Workspace membatasi setSharing, tidak akan pernah memblokir/menggagalkan logo kasir
      setTimeout(() => {
        try {
          const ext = file.name.split('.').pop()
          const customName = `logo-hasuka.${ext}`
          gasApi.uploadImage(file, customName, true)
            .catch(err => console.warn('[Background Drive] Upload logo dilewati/gagal:', err))
        } catch {}
      }, 50)

      showToast({
        variant: 'success',
        title: 'Logo Berhasil Dipilih',
        description: 'Logo tersimpan di perangkat ini. Klik "Simpan Pengaturan" di bawah untuk sinkronisasi ke cloud Google Sheets.'
      })
    } catch (err) {
      showToast({ variant: 'destructive', title: 'Gagal memproses logo', description: err instanceof Error ? err.message : String(err) })
    } finally {
      setIsUploadingLogo(false)
      if (fileInputRef.current) fileInputRef.current.value = ''
    }
  }

  const handleSaveSettings = async (settingsToSave: Record<string, string>, successTitle: string, callback: () => void) => {
    setIsSaving(true)
    if (setHasActiveMutation) setHasActiveMutation(true)
    // Langsung terapkan perubahan ke state & localStorage agar POS langsung aktif tanpa terhalang koneksi
    callback()
    try {
      localStorage.setItem('hasuka_settings_last_saved_at', Date.now().toString())
      const res = await gasApi.saveSettings(settingsToSave)
      if (res.status === 'success' || res.success) {
        showToast({ variant: 'success', title: successTitle })
      } else {
        showToast({ variant: 'warning', title: 'Tersimpan di Perangkat', description: 'Pengaturan aktif di kasir ini, tetapi belum tersinkron ke cloud Google Sheets.' })
      }
    } catch (e) {
      showToast({ variant: 'warning', title: 'Tersimpan di Perangkat (Offline)', description: 'Pengaturan aktif di kasir ini dan akan tersinkron saat terhubung kembali.' })
    } finally {
      setIsSaving(false)
      setTimeout(() => {
        if (setHasActiveMutation) setHasActiveMutation(false)
      }, 2000)
    }
  }

  const saveRates = () => {
    const finalTax = isPajakActive ? pajakRate : 0;
    setTaxRate(finalTax)
    setServiceRate(serviceCharge)
    handleSaveSettings(
      {
        tax_rate: finalTax.toString(),
        service_rate: serviceCharge.toString(),
        tax_enabled: isPajakActive ? 'true' : 'false'
      },
      'Pengaturan pajak & biaya layanan berhasil disimpan',
      () => { setTaxRate(finalTax); setServiceRate(serviceCharge) }
    )
  }

  const simPrice = 24000
  const simPajak = isPajakActive ? Math.round(simPrice * pajakRate / 100) : 0
  const simService = Math.round(simPrice * serviceCharge / 100)
  const simTotal = simPrice + simPajak + simService

  const fmt = (n: number) => `Rp ${n.toLocaleString('id-ID')}`

  const Toggle = ({ on, onToggle, label }: { on: boolean; onToggle: () => void; label: string }) => (
    <button
      type="button"
      onClick={onToggle}
      role="switch"
      aria-checked={on}
      aria-label={label}
      className="relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-out focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#8B4A1E] focus-visible:ring-offset-2 active:scale-95"
      style={{
        background: on ? '#5B8A2E' : '#D9C4A9',
      }}
    >
      <span
        aria-hidden="true"
        className="pointer-events-none inline-block h-5 w-5 rounded-full bg-white shadow-sm ring-0 transition-transform duration-200 ease-out"
        style={{
          transform: on ? 'translateX(20px)' : 'translateX(0px)',
        }}
      />
    </button>
  )

  const PajakTab = () => (
    <div className="space-y-4">
      {/* PPN */}
      <div className="rounded-2xl p-5" style={{ background: 'white', border: '1px solid #E8D7C0' }}>
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="font-bold text-[14px]" style={{ color: '#2B1810' }}>Pajak PPN</h3>
            <p className="text-[12px]" style={{ color: '#6B5448' }}>Dikenakan atas total transaksi sebelum biaya lain</p>
          </div>
          <Toggle 
            on={isPajakActive} 
            onToggle={() => {
              const next = !isPajakActive
              setIsPajakActive(next)
              setTaxRate(next ? pajakRate : 0)
            }} 
            label="Aktifkan pajak PPN" 
          />
        </div>

        <div className={`collapse-transition ${isPajakActive ? 'open' : 'closed'}`}>
          <div className="collapse-inner">
            <label className="block text-[11px] font-bold mb-2" style={{ color: '#6B5448', letterSpacing: '0.06em' }}>TARIF PPN (%)</label>
            <div className="flex gap-2 mb-3">
              {[0, 5, 10, 11, 12].map(r => (
                <button key={r} onClick={() => { 
                  setPajakRate(r); 
                  if (isPajakActive) setTaxRate(r);
                  setCustomPajakInput('') 
                }}
                  className="flex-1 py-2 rounded-xl font-bold text-[13px] transition-all duration-200 active:scale-95 cursor-pointer"
                  style={{
                    background: pajakRate === r && !customPajakInput ? '#8B4A1E' : 'white',
                    color: pajakRate === r && !customPajakInput ? 'white' : '#6B5448',
                    border: pajakRate === r && !customPajakInput ? '1.5px solid #8B4A1E' : '1px solid #E8D7C0',
                    boxShadow: pajakRate === r && !customPajakInput ? '0 2px 6px -1px rgba(139, 74, 30, 0.2)' : 'none'
                  }}>
                  {r}%
                </button>
              ))}
            </div>
            <div className="relative mb-1">
              <input type="number" value={customPajakInput} min={0} max={100}
                onChange={e => { 
                  setCustomPajakInput(e.target.value); 
                  const val = parseFloat(e.target.value) || 0
                  setPajakRate(val)
                  if (isPajakActive && e.target.value) setTaxRate(val)
                }}
                placeholder="Atau ketik tarif custom (0–100)..."
                className="w-full px-4 py-2.5 rounded-xl text-[13px] outline-none transition-colors duration-200"
                style={{ background: 'white', border: `1.5px solid ${customPajakInput ? '#8B4A1E' : '#E8D7C0'}`, color: '#2B1810' }}
                onFocus={e => e.currentTarget.style.borderColor = '#8B4A1E'}
                onBlur={e => { if (!customPajakInput) e.currentTarget.style.borderColor = '#E8D7C0' }} />
              {customPajakInput && <span className="absolute right-4 top-1/2 -translate-y-1/2 font-bold text-[13px]" style={{ color: '#8B4A1E' }}>%</span>}
            </div>
          </div>
        </div>
      </div>

      {/* Service charge */}
      <div className="rounded-2xl p-5" style={{ background: 'white', border: '1px solid #E8D7C0' }}>
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="font-bold text-[14px]" style={{ color: '#2B1810' }}>Biaya Layanan</h3>
            <p className="text-[12px]" style={{ color: '#6B5448' }}>Service charge untuk operasional / makan di tempat</p>
          </div>
          <Toggle 
            on={serviceCharge > 0} 
            onToggle={() => {
              const next = serviceCharge > 0 ? 0 : 10;
              setServiceCharge(next)
              setServiceRate(next)
            }} 
            label="Aktifkan biaya layanan" 
          />
        </div>
        <div className={`collapse-transition ${serviceCharge > 0 ? 'open' : 'closed'}`}>
          <div className="collapse-inner">
            <label className="block text-[11px] font-bold mb-2" style={{ color: '#6B5448', letterSpacing: '0.06em' }}>TARIF BIAYA LAYANAN (%)</label>
            <div className="flex gap-2 mb-3">
              {[5, 10, 15].map(r => (
                <button key={r} onClick={() => { 
                  setServiceCharge(r); 
                  setServiceRate(r);
                  setCustomServiceInput('') 
                }}
                  className="flex-1 py-2 rounded-xl font-bold text-[13px] transition-all duration-200 active:scale-95 cursor-pointer"
                  style={{
                    background: serviceCharge === r && !customServiceInput ? '#8B4A1E' : 'white',
                    color: serviceCharge === r && !customServiceInput ? 'white' : '#6B5448',
                    border: serviceCharge === r && !customServiceInput ? '1.5px solid #8B4A1E' : '1px solid #E8D7C0',
                    boxShadow: serviceCharge === r && !customServiceInput ? '0 2px 6px -1px rgba(139, 74, 30, 0.2)' : 'none'
                  }}>
                  {r}%
                </button>
              ))}
            </div>
            <div className="relative mb-1">
              <input type="number" value={customServiceInput} min={0} max={100}
                onChange={e => { 
                  setCustomServiceInput(e.target.value); 
                  const val = parseFloat(e.target.value) || 0
                  setServiceCharge(val)
                  if (e.target.value) setServiceRate(val)
                }}
                placeholder="Atau ketik tarif custom (0–100)..."
                className="w-full px-4 py-2.5 rounded-xl text-[13px] outline-none transition-colors duration-200"
                style={{ background: 'white', border: `1.5px solid ${customServiceInput ? '#8B4A1E' : '#E8D7C0'}`, color: '#2B1810' }}
                onFocus={e => e.currentTarget.style.borderColor = '#8B4A1E'}
                onBlur={e => { if (!customServiceInput) e.currentTarget.style.borderColor = '#E8D7C0' }} />
              {customServiceInput && <span className="absolute right-4 top-1/2 -translate-y-1/2 font-bold text-[13px]" style={{ color: '#8B4A1E' }}>%</span>}
            </div>
          </div>
        </div>
      </div>

      {/* Simulation */}
      <div className="rounded-2xl p-5" style={{ background: '#F3E7CE', border: '1px solid #E8D7C0' }}>
        <h3 className="font-bold text-[13px] mb-3" style={{ color: '#2B1810' }}>Simulasi Perhitungan</h3>
        <div className="space-y-2 text-[13px]">
          <div className="flex justify-between"><span style={{ color: '#6B5448' }}>Harga produk contoh</span><span className="font-semibold" style={{ color: '#2B1810' }}>{fmt(simPrice)}</span></div>
          {simPajak > 0 && <div className="flex justify-between"><span style={{ color: '#6B5448' }}>PPN {pajakRate}%</span><span className="font-semibold" style={{ color: '#2B1810' }}>+{fmt(simPajak)}</span></div>}
          {simService > 0 && <div className="flex justify-between"><span style={{ color: '#6B5448' }}>Layanan {serviceCharge}%</span><span className="font-semibold" style={{ color: '#2B1810' }}>+{fmt(simService)}</span></div>}
          <div className="flex justify-between pt-2" style={{ borderTop: '1px solid #C49A6260' }}>
            <span className="font-bold" style={{ color: '#2B1810' }}>Total Pelanggan Bayar</span>
            <span className="font-serif font-bold text-[16px]" style={{ color: '#8B4A1E' }}>{fmt(simTotal)}</span>
          </div>
        </div>
      </div>

      <Button onClick={saveRates} disabled={isSaving} loading={isSaving} variant="primary" size="lg" fullWidth>
        Simpan Pengaturan Pajak & Biaya Layanan
      </Button>
    </div>
  )


  const StrukTab = () => (
    <div className="space-y-4">
      <div className="rounded-2xl p-5" style={{ background: 'white', border: '1px solid #E8D7C0' }}>
        <h3 className="font-bold text-[14px] mb-2" style={{ color: '#2B1810' }}>Header Struk</h3>
        <p className="text-[12px] mb-4" style={{ color: '#6B5448' }}>
          Nama Outlet dan Alamat secara otomatis mengambil data dari sistem (sesuai cabang kasir).
        </p>

        <div className="flex items-center justify-between mt-6 mb-3">
          <div>
            <h3 className="font-bold text-[14px]" style={{ color: '#2B1810' }}>Logo Struk (Opsional)</h3>
            <p className="text-[12px]" style={{ color: '#6B5448' }}>Tampilkan logo di bagian atas struk thermal.</p>
          </div>
          <Toggle on={receiptDraft.showLogo} onToggle={() => setReceiptDraft(prev => ({ ...prev, showLogo: !prev.showLogo }))} label="Tampilkan logo di struk" />
        </div>
        
        <div className={`collapse-transition ${receiptDraft.showLogo ? 'open' : 'closed'}`}>
          <div className="collapse-inner">
            <div className="rounded-2xl p-5 flex flex-col items-center mt-3" style={{ background: '#FAF6ED', border: '1px dashed #C49A62' }}>
              <div className="w-16 h-16 rounded-xl flex items-center justify-center mb-3 overflow-hidden relative" style={{ background: 'white', border: '1px solid #E8D7C0' }}>
                {isUploadingLogo ? (
                  <Loader2 size={24} className="animate-spin text-[#8B4A1E]" />
                ) : receiptDraft.logoUrl ? (
                  <img
                    src={receiptDraft.logoUrl}
                    className="w-full h-full object-contain"
                    alt="Logo"
                    onError={(e) => { e.currentTarget.onerror = null; e.currentTarget.src = HASUKA_LOGO; }}
                  />
                ) : (
                  <UploadCloud size={24} color="#C49A62" />
                )}
              </div>
              <p className="text-[11px] text-center mb-3" style={{ color: '#6B5448' }}>Upload logo (format PNG/JPG) untuk dicetak di bagian atas struk thermal.</p>
              <button 
                onClick={() => fileInputRef.current?.click()}
                disabled={isUploadingLogo}
                className="px-4 py-2 rounded-xl text-[12px] font-bold disabled:opacity-50 cursor-pointer active:scale-95 transition-all" 
                style={{ background: 'white', color: '#2B1810', border: '1px solid #E8D7C0' }}>
                Pilih File Logo
              </button>
              <input 
                type="file" 
                accept="image/*" 
                className="hidden" 
                ref={fileInputRef} 
                onChange={handleUploadLogo} 
              />
            </div>
          </div>
        </div>
      </div>

      <div className="rounded-2xl p-5" style={{ background: 'white', border: '1px solid #E8D7C0' }}>
        <h3 className="font-bold text-[14px] mb-4" style={{ color: '#2B1810' }}>Footer Struk</h3>
        <label className="block text-[11px] font-bold mb-1.5" style={{ color: '#6B5448', letterSpacing: '0.06em' }}>TEKS PENUTUP STRUK</label>
        <textarea
          value={receiptDraft.customFooter}
          onChange={e => setReceiptDraft(d => ({ ...d, customFooter: e.target.value }))}
          rows={3}
          className="w-full px-4 py-3 rounded-xl text-[13px] outline-none resize-none"
          style={{ background: '#F3E7CE', border: '1.5px solid #E8D7C0', color: '#2B1810' }}
          onFocus={e => e.currentTarget.style.borderColor = '#8B4A1E'}
          onBlur={e => e.currentTarget.style.borderColor = '#E8D7C0'} />
        <p className="text-[11px] mt-1" style={{ color: '#C49A62' }}>Baris baru = Enter. Akan muncul di bagian bawah struk.</p>
      </div>

      <div className="rounded-2xl p-5" style={{ background: 'white', border: '1px solid #E8D7C0' }}>
        <h3 className="font-bold text-[14px] mb-4" style={{ color: '#2B1810' }}>Preview Struk</h3>
        <div className="flex justify-center bg-[#FAF6ED] p-4 rounded-xl border border-[#E8D7C0]">
          <div className="bg-white p-4 shadow-sm flex flex-col items-center w-full max-w-[280px]" style={{ border: '1px solid #E8D7C0' }}>
            {receiptDraft.showLogo && receiptDraft.logoUrl ? (
              <img
                src={receiptDraft.logoUrl}
                alt="Logo"
                className="w-16 h-16 object-contain mb-2 mix-blend-multiply grayscale"
                onError={(e) => { e.currentTarget.onerror = null; e.currentTarget.src = HASUKA_LOGO; }}
              />
            ) : null}
            <pre className="font-mono text-[10px] leading-[1.4] whitespace-pre-wrap text-[#2B1810] mx-auto" style={{ margin: 0 }}>
              {generateReceiptString({
                outlet: { name: outlet.name || 'HASUKA DIMSUM', address: outlet.address || 'Jl. Contoh No. 123' },
                items: [
                  { name: 'Hakau Udang Garing', qty: 1, price: 21000, total: 21000, promo: true },
                  { name: 'Siao May Ayam Udang', qty: 2, price: 24000, total: 48000 }
                ],
                subtotal: 69000,
                discount: 5000,
                tax: isPajakActive ? Math.round((69000 - 5000) * (pajakRate / 100)) : 0,
                serviceChargeAmount: Math.round((69000 - 5000) * (serviceCharge / 100)),
                total: (69000 - 5000) + (isPajakActive ? Math.round((69000 - 5000) * (pajakRate / 100)) : 0) + Math.round((69000 - 5000) * (serviceCharge / 100)),
                received: (69000 - 5000) + (isPajakActive ? Math.round((69000 - 5000) * (pajakRate / 100)) : 0) + Math.round((69000 - 5000) * (serviceCharge / 100)),
                change: 0,
                taxRate: isPajakActive ? pajakRate : 0,
                serviceRate: serviceCharge,
                receiptNo: 'HSK-20260913-0032',
                waktu: '13/09/26 - 14:30 WIB',
                cashier: 'Budi',
                tableName: 'Meja 4',
                paymentMethod: 'QRIS',
                footer: receiptDraft.customFooter,
                showLogo: receiptDraft.showLogo && !receiptDraft.logoUrl
              })}
            </pre>
          </div>
        </div>
      </div>

      <Button
        onClick={() => {
          if (receiptDraft.logoUrl) setLocalSetting('logo_url', receiptDraft.logoUrl).catch(() => {})
          setLocalSetting('receipt_footer', receiptDraft.customFooter).catch(() => {})
          setLocalSetting('logo_enabled', receiptDraft.showLogo ? 'true' : 'false').catch(() => {})

          handleSaveSettings(
            {
              receipt_footer: receiptDraft.customFooter,
              logo_enabled: receiptDraft.showLogo ? 'true' : 'false',
              logo_url: receiptDraft.logoUrl || ''
            },
            'Pengaturan struk berhasil disimpan',
            () => setReceiptSettings(receiptDraft)
          )
        }}
        disabled={isSaving}
        loading={isSaving}
        variant="primary"
        size="lg"
        fullWidth
      >
        Simpan Pengaturan Struk
      </Button>
    </div>
  )

  const IntegrasiTab = () => {

    const handleSave = () => {
      gasApi.setUrl(gasUrl)
      setSavedMsg(true)
      setTimeout(() => setSavedMsg(false), 3000)
    }

    const handleTest = async () => {
      setTesting(true)
      setTestResult(null)
      try {
        const res = await gasApi.ping(gasUrl)
        setTestResult(res)
        showToast(
          res.success
            ? { variant: 'success', title: 'Koneksi berhasil', description: res.message }
            : { variant: 'destructive', title: 'Koneksi gagal', description: res.message }
        )
      } catch (err) {
        setTestResult({ success: false, message: err instanceof Error ? err.message : String(err) })
        showToast({ variant: 'destructive', title: 'Koneksi gagal', description: err instanceof Error ? err.message : String(err) })
      } finally {
        setTesting(false)
      }
    }

    const handleSync = async () => {
      setSyncing(true)
      try {
        await refreshData()
        showToast({ variant: 'success', title: 'Data berhasil disinkronkan dari Google Sheets' })
      } catch (err) {
        showToast({
          variant: 'destructive',
          title: 'Gagal sinkron dari Google Sheets',
          description: err instanceof Error ? err.message : 'Terjadi kesalahan',
          actionLabel: 'Coba Lagi',
          onAction: handleSync,
        })
      } finally {
        setSyncing(false)
      }
    }

    const isConnected = gasApi.isConfigured()

    return (
      <div className="space-y-4">
        <div className="rounded-2xl p-5" style={{ background: 'white', border: '1px solid #E8D7C0' }}>
          <div className="flex items-center justify-between mb-3">
            <div>
              <h3 className="font-bold text-[15px]" style={{ color: '#2B1810' }}>Database Google Sheets & Apps Script</h3>
              <p className="text-[12px]" style={{ color: '#6B5448' }}>
                Sinkronkan transaksi kasir, pengurangan stok resep, dan katalog produk langsung ke Google Spreadsheet Anda.
              </p>
            </div>
            <span
              className="px-3 py-1 rounded-full text-[11px] font-bold"
              style={{
                background: isConnected ? '#EAF3DE' : '#FCE8E6',
                color: isConnected ? '#3B6E1C' : '#C5221F',
                border: `1px solid ${isConnected ? '#C2E2A3' : '#F5C2C0'}`
              }}
            >
              {isConnected ? '● Terkonfigurasi' : '○ Belum Dikonfigurasi'}
            </span>
          </div>

          <div className="mt-4">
            <label className="block text-[11px] font-bold mb-1.5" style={{ color: '#6B5448', letterSpacing: '0.06em' }}>
              GOOGLE APPS SCRIPT WEB APP URL
            </label>
            <input
              type="url"
              value={gasUrl}
              onChange={e => setGasUrlInput(e.target.value)}
              onBlur={() => {
                const cleaned = gasApi.cleanUrl(gasUrl)
                if (cleaned !== gasUrl) setGasUrlInput(cleaned)
              }}
              placeholder="https://script.google.com/macros/s/AKfycb.../exec"
              className="w-full px-4 py-2.5 rounded-xl text-[13px] outline-none font-mono"
              style={{ background: '#F8F4EE', border: '1.5px solid #E8D7C0', color: '#2B1810' }}
              onFocus={e => e.currentTarget.style.borderColor = '#8B4A1E'}
            />
            <p className="text-[11px] mt-1.5" style={{ color: '#8C7466' }}>
              Pastikan URL berakhiran <code className="font-bold text-[#8B4A1E]">/exec</code> (didapat dari menu <i>Deploy &gt; Web App</i> di Google Apps Script).
            </p>
          </div>

          {testResult && (
            <div
              className="mt-3 p-3.5 rounded-xl text-[12px] flex items-start gap-2 leading-relaxed"
              style={{
                background: testResult.success ? '#EAF3DE' : '#FCE8E6',
                color: testResult.success ? '#3B6E1C' : '#C5221F',
                border: `1px solid ${testResult.success ? '#C2E2A3' : '#F5C2C0'}`
              }}
            >
              <span className="font-bold shrink-0">{testResult.success ? 'Berhasil:' : 'Gagal:'}</span>
              <span>{testResult.message}</span>
            </div>
          )}

          {savedMsg && (
            <div className="mt-3 p-3 rounded-xl text-[12px] bg-amber-50 text-amber-800 border border-amber-200">
              URL berhasil disimpan di perangkat ini.
            </div>
          )}

          <div className="flex flex-wrap items-center gap-2.5 mt-4">
            <Button
              onClick={handleTest}
              disabled={testing || !gasUrl}
              loading={testing}
              variant="secondary"
              size="sm"
            >
              Tes Koneksi
            </Button>
            <Button
              onClick={handleSync}
              disabled={syncing || !isConnected}
              loading={syncing}
              variant="secondary"
              size="sm"
            >
              Sinkronkan Data Sekarang
            </Button>
            {gasUrl && (
              <a
                href={gasApi.cleanUrl(gasUrl)}
                target="_blank"
                rel="noreferrer"
                className="px-3.5 py-2 rounded-xl text-[12px] font-bold border flex items-center gap-1 transition-colors hover:bg-[#F8F4EE]"
                style={{ borderColor: '#C49A62', color: '#6B5448' }}
              >
                Buka URL di Tab Baru ↗
              </a>
            )}
            <Button
              onClick={handleSave}
              variant="primary"
              size="sm"
              className="ml-auto"
            >
              Simpan URL
            </Button>
          </div>
        </div>

        <div className="rounded-2xl p-5" style={{ background: '#F8F4EE', border: '1px solid #E8D7C0' }}>
          <h4 className="font-bold text-[13px] mb-2" style={{ color: '#2B1810' }}>Panduan Singkat Setup Google Sheets &amp; Apps Script</h4>
          <ol className="text-[12px] list-decimal ml-4 space-y-2" style={{ color: '#6B5448' }}>
            <li>Buka spreadsheet Google Sheets Anda (misal: <code>DB_Hasuka_POS</code>).</li>
            <li>Klik menu <b>Ekstensi &gt; Apps Script</b> (<i>Extensions &gt; Apps Script</i>).</li>
            <li>Salin file <code>Code.gs</code> dan <code>SetupSheets.gs</code> dari folder <code>google-apps-script/</code>.</li>
            <li>Jalankan fungsi <b><code>setupHasukaDatabase</code></b> sekali untuk membuat tab database otomatis.</li>
            <li>
              Klik tombol <b>Deploy &gt; New deployment</b> (atau <i>Manage deployments</i>). Pilih tipe <b>Web App</b> dengan setelan wajib:
              <ul className="list-disc ml-4 mt-1 space-y-0.5 text-[11px] text-[#2B1810]">
                <li><b>Execute as:</b> <code>Me (akun Google Anda)</code></li>
                <li><b>Who has access:</b> <code className="bg-amber-100 text-amber-900 px-1 rounded font-bold">Anyone (Siapa saja)</code> <i>&larr; Wajib agar tidak dicekal Google CORS / Failed to fetch!</i></li>
              </ul>
            </li>
            <li>Salin URL Web App yang berakhiran <code>/exec</code>, tempel ke kolom di atas, lalu klik <b>Simpan URL</b> dan <b>Tes Koneksi</b>.</li>
          </ol>
        </div>
      </div>
    )
  }


  const PrinterTab = () => {
    const isSupported = webSerialPrinter.isSupported()
    const isBluetooth = printerDraft.printerType === 'bluetooth_serial'
    const isUsb = printerDraft.printerType === 'usb_serial'
    const isConnected = serialStatus === 'connected'

    const loadAuthorizedPorts = async () => {
      if (!webSerialPrinter.isSupported()) return
      setIsLoadingPorts(true)
      try {
        const mode = printerDraft.printerType === 'usb_serial' ? 'usb_serial' : 'bluetooth_serial'
        const ports = await webSerialPrinter.getAuthorizedPorts(mode)
        setAvailablePorts(ports)
      } catch (e) {
        setAvailablePorts([])
      } finally {
        setIsLoadingPorts(false)
      }
    }

    const openPortModal = () => {
      setIsPortModalOpen(true)
      loadAuthorizedPorts()
    }

    const handleModeChange = async (newMode: 'bluetooth_serial' | 'usb_serial') => {
      if (printerDraft.printerType === newMode) return
      setPrinterDraft(d => ({ ...d, printerType: newMode }))
      if (serialStatus === 'connected') {
        await webSerialPrinter.disconnect()
      }
      if (webSerialPrinter.isSupported()) {
        webSerialPrinter.autoReconnect(newMode).catch(() => {})
      }
    }

    const handleSelectExistingPort = async (port: any) => {
      setIsConnectingSerial(true)
      try {
        const mode = printerDraft.printerType === 'usb_serial' ? 'usb_serial' : 'bluetooth_serial'
        const result = await webSerialPrinter.connectToPort(port, 9600, mode)
        if (result.success) {
          const portName = result.portName || webSerialPrinter.getPortName()
          setIsPortModalOpen(false)
          showToast({
            variant: 'success',
            title: 'Printer Terhubung!',
            description: `Port aktif: ${portName}. Mode cetak langsung ESC/POS siap digunakan.`,
          })
        } else {
          showToast({
            variant: 'destructive',
            title: 'Gagal Membuka Port',
            description: result.error || 'Port tidak merespons atau sedang dipakai aplikasi lain.',
          })
        }
      } catch (err: any) {
        showToast({
          variant: 'destructive',
          title: 'Gagal Membuka Port',
          description: err?.message || 'Terjadi kesalahan saat menghubungkan port.',
        })
      } finally {
        setIsConnectingSerial(false)
      }
    }

    const handleRequestNewPort = async () => {
      setIsConnectingSerial(true)
      try {
        const mode = printerDraft.printerType === 'usb_serial' ? 'usb_serial' : 'bluetooth_serial'
        const result = await webSerialPrinter.requestAndConnect(9600, mode)
        if (result.success) {
          const portName = result.portName || webSerialPrinter.getPortName()
          setIsPortModalOpen(false)
          showToast({
            variant: 'success',
            title: 'Printer Terhubung!',
            description: `Port aktif: ${portName}. Mode cetak langsung ESC/POS siap digunakan.`,
          })
        } else if (result.cancelled) {
          // User batalkan dialog Chrome native - status bersih kembali ke terputus tanpa toast merah
        } else {
          showToast({
            variant: 'destructive',
            title: 'Gagal Menghubungkan Printer',
            description: result.error || 'Tidak ada port serial yang dipilih.',
          })
        }
      } catch (err: any) {
        showToast({
          variant: 'destructive',
          title: 'Gagal Menghubungkan Printer',
          description: err?.message || 'Terjadi kesalahan saat meminta akses port.',
        })
      } finally {
        setIsConnectingSerial(false)
        loadAuthorizedPorts()
      }
    }

    const handleDisconnectSerial = async () => {
      try {
        await webSerialPrinter.disconnect()
        showToast({
          variant: 'info',
          title: 'Port Ditutup',
          description: 'Koneksi printer berhasil diputuskan.',
        })
      } catch (err: any) {
        showToast({
          variant: 'destructive',
          title: 'Gagal Memutuskan Port',
          description: err?.message || 'Terjadi kesalahan saat menutup port.',
        })
      }
    }

    const handleTestPrint = async () => {
      setIsTestingPrinter(true)
      try {
        const ok = await printTestReceipt(printerDraft, outlet.name)
        if (ok) {
          showToast({
            variant: 'success',
            title: 'Sinyal Cetak Terkirim',
            description: 'Data struk uji berhasil dikirim. Jika kertas tidak keluar, pastikan perangkat yang terhubung adalah printer kasir Anda.',
          })
        } else {
          showToast({
            variant: 'destructive',
            title: 'Gagal Cetak Uji',
            description: 'Printer tidak merespons atau port belum terhubung.',
          })
        }
      } catch (e: any) {
        showToast({
          variant: 'destructive',
          title: 'Gagal Cetak Uji',
          description: e?.message || 'Terjadi kesalahan saat memproses cetak.',
        })
      } finally {
        setIsTestingPrinter(false)
      }
    }

    const handleTestDrawer = async () => {
      setIsTestingDrawer(true)
      try {
        const ok = await webSerialPrinter.openCashDrawer()
        if (ok) {
          showToast({
            variant: 'success',
            title: 'Sinyal Laci Terkirim',
            description: 'Perintah pembuka laci (ESC p) berhasil dikirim ke printer.',
          })
        } else {
          showToast({
            variant: 'destructive',
            title: 'Gagal Buka Laci',
            description: 'Pastikan printer terhubung via port serial.',
          })
        }
      } catch (err: any) {
        showToast({
          variant: 'destructive',
          title: 'Gagal Membuka Laci',
          description: err?.message || 'Pastikan kabel laci tercolok ke port RJ11 printer.',
        })
      } finally {
        setIsTestingDrawer(false)
      }
    }

    const handlePaperKeyDown = (e: React.KeyboardEvent, index: number) => {
      const options = ['58mm', '80mm', 'auto'] as const
      let targetIndex = index
      if (e.key === 'ArrowRight' || e.key === 'ArrowDown') {
        e.preventDefault()
        targetIndex = (index + 1) % options.length
      } else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') {
        e.preventDefault()
        targetIndex = (index - 1 + options.length) % options.length
      } else if (e.key === 'Home') {
        e.preventDefault()
        targetIndex = 0
      } else if (e.key === 'End') {
        e.preventDefault()
        targetIndex = options.length - 1
      }

      if (targetIndex !== index) {
        setPrinterDraft(d => ({ ...d, paperWidth: options[targetIndex] }))
        paperCardRefs.current[targetIndex]?.focus()
      }
    }

    return (
      <div className="space-y-4 animate-fade-in no-scrollbar" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
        <style>{`
          .no-scrollbar::-webkit-scrollbar {
            display: none;
          }
        `}</style>

        {/* 1. KARTU KONEKSI TUNGGAL (UNIFIED CARD: STATUS + AKSI) */}
        {!isSupported ? (
          <div className="rounded-2xl p-4 md:p-5 flex items-start gap-3.5 shadow-xs" style={{ background: '#FFF1F0', border: '1.5px solid #FFA39E' }}>
            <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0" style={{ background: '#FFCCC7' }}>
              <AlertTriangle size={20} color="#CF1322" />
            </div>
            <div>
              <p className="font-bold text-[14px]" style={{ color: '#A8071A' }}>
                Web Serial Tidak Didukung / Dibatasi Browser
              </p>
              <p className="text-[12px] mt-0.5 leading-relaxed" style={{ color: '#5C0011' }}>
                Fitur cetak langsung (Web Serial API) tidak didukung browser ini atau dibatasi oleh sandbox iframe Google Apps Script. Buka web app langsung di browser Google Chrome atau Microsoft Edge desktop untuk menghubungkan printer kasir.
              </p>
            </div>
          </div>
        ) : isConnected ? (
          /* STATE C: TERHUBUNG */
          <div
            className="rounded-2xl p-4 md:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 transition-all"
            style={{
              background: '#EAF4E0',
              border: '1.5px solid #5B8A2E50',
              boxShadow: '0 2px 8px -2px rgba(91, 138, 46, 0.12)',
            }}
          >
            <div className="flex items-start sm:items-center gap-3.5">
              <div className="w-11 h-11 rounded-xl flex items-center justify-center shrink-0" style={{ background: '#5B8A2E20' }}>
                {isBluetooth ? (
                  <Bluetooth size={22} color="#5B8A2E" />
                ) : (
                  <Usb size={22} color="#5B8A2E" />
                )}
              </div>
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <p className="font-bold text-[14px]" style={{ color: '#2B1810' }}>
                    {isBluetooth ? 'Printer Bluetooth' : 'Printer Kabel USB'}
                  </p>
                  <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-[#5B8A2E] text-white inline-flex items-center gap-1">
                    <CheckCircle2 size={12} /> Terhubung
                  </span>
                </div>
                <p className="text-[12px] mt-1 text-[#2B5420]">
                  Status: <span className="font-bold">{serialPortName || (isBluetooth ? 'Printer Bluetooth' : 'Printer Kabel USB')}</span> siap digunakan untuk cetak struk kasir.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
              <Button
                variant="secondary"
                size="sm"
                onClick={openPortModal}
                icon={<RefreshCw size={13} />}
              >Ganti Printer</Button>
              <Button
                variant="secondary"
                size="sm"
                onClick={handleDisconnectSerial}
                icon={<Power size={13} />}
              >
                Putuskan
              </Button>
            </div>
          </div>
        ) : serialStatus === 'connecting' ? (
          /* STATE B: MENYAMBUNG */
          <div
            className="rounded-2xl p-4 md:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 transition-all opacity-85"
            style={{
              background: '#FFF8ED',
              border: '1.5px solid #D48806',
            }}
          >
            <div className="flex items-start sm:items-center gap-3.5">
              <div className="w-11 h-11 rounded-xl flex items-center justify-center shrink-0" style={{ background: '#D4880618' }}>
                <RefreshCw size={22} className="animate-spin text-[#D48806]" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <p className="font-bold text-[14px]" style={{ color: '#2B1810' }}>
                    {isBluetooth ? 'Printer Bluetooth' : 'Printer Kabel USB'}
                  </p>
                  <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-[#D48806] text-white inline-flex items-center gap-1">
                    <RefreshCw size={11} className="animate-spin" /> Menghubungkan...
                  </span>
                </div>
                <p className="text-[12px] mt-1 text-[#6B5448]">
                  Membuka komunikasi serial ke printer thermal...
                </p>
              </div>
            </div>
          </div>
        ) : (
          /* STATE A: TERPUTUS (CLICKABLE CARD) */
          <div
            role="button"
            tabIndex={0}
            onClick={openPortModal}
            onKeyDown={e => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault()
                openPortModal()
              }
            }}
            className="rounded-2xl p-4 md:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 transition-all duration-200 cursor-pointer focus-visible:ring-2 focus-visible:ring-[#CF1322] focus-visible:ring-offset-2 outline-none group hover:border-[#CF1322]"
            style={{
              background: '#FFF1F0',
              border: '1.5px solid #FFA39E',
              boxShadow: '0 2px 8px -2px rgba(207, 19, 34, 0.08)',
            }}
          >
            <div className="flex items-start sm:items-center gap-3.5">
              <div
                className="w-11 h-11 rounded-xl flex items-center justify-center shrink-0 transition-transform duration-200 group-hover:scale-105"
                style={{ background: '#CF132215' }}
              >
                {isBluetooth ? (
                  <Bluetooth size={22} color="#CF1322" />
                ) : (
                  <Usb size={22} color="#CF1322" />
                )}
              </div>
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <p className="font-bold text-[14px] text-[#2B1810]">
                    {isBluetooth ? 'Printer Bluetooth' : 'Printer Kabel USB'}
                  </p>
                  <span
                    className="text-[11px] font-bold px-2.5 py-0.5 rounded-full inline-flex items-center gap-1 bg-[#CF1322] text-white"
                  >
                    <Power size={11} /> Tidak Terhubung
                  </span>
                </div>
                <p className="text-[12px] mt-1 text-[#820014]">
                  {isBluetooth ? 'Printer belum terhubung. Klik di sini untuk menyambungkan printer Bluetooth Anda.' : 'Printer belum terhubung. Klik di sini untuk menyambungkan kabel USB printer Anda.'}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
              <Button
                variant="primary"
                size="sm"
                onClick={e => {
                  e.stopPropagation()
                  openPortModal()
                }}
                icon={isBluetooth ? <Bluetooth size={14} /> : <Usb size={14} />}
              >
                {isBluetooth ? 'Hubungkan Bluetooth' : 'Hubungkan USB'}
              </Button>
            </div>
          </div>
        )}

        {/* BARIS TOMBOL AKSI CEPAT (UJI CETAK & LACI) */}
        <div className="flex flex-wrap items-center gap-2.5">
          <Button
            variant="secondary"
            size="sm"
            onClick={handleTestPrint}
            loading={isTestingPrinter}
            icon={!isTestingPrinter ? <Printer size={14} /> : undefined}
          >
            Cetak Halaman Uji
          </Button>

          <Button
            variant="secondary"
            size="sm"
            onClick={handleTestDrawer}
            loading={isTestingDrawer}
            icon={!isTestingDrawer ? <DollarSign size={14} /> : undefined}
          >
            Tes Buka Laci Kasir
          </Button>
        </div>

        {/* 2. PILIHAN TIPE KONEKSI PRINTER (REVISI 1: HAPUS DRIVER SISTEM) */}
        <div className="rounded-2xl p-5" style={{ background: 'white', border: '1px solid #E8D7C0' }}>
          <h3 className="font-bold text-[14px] mb-3" style={{ color: '#2B1810' }}>Pilih Tipe Koneksi Printer</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3" role="radiogroup" aria-label="Tipe Koneksi Printer">
            {/* Opsi 1: Bluetooth SPP */}
            <div
              role="radio"
              aria-checked={isBluetooth}
              tabIndex={0}
              onClick={() => handleModeChange('bluetooth_serial')}
              onKeyDown={e => {
                if (e.key === ' ' || e.key === 'Enter') {
                  e.preventDefault()
                  handleModeChange('bluetooth_serial')
                }
              }}
              className="p-4 rounded-xl cursor-pointer transition-all flex flex-col justify-between outline-none focus-visible:ring-2 focus-visible:ring-[#8B4A1E] focus-visible:ring-offset-2"
              style={{
                background: isBluetooth ? '#FAF6ED' : '#FAF6ED40',
                border: isBluetooth ? '2px solid #8B4A1E' : '1px solid #E8D7C0',
                boxShadow: isBluetooth ? '0 2px 8px -2px rgba(139, 74, 30, 0.12)' : 'none',
              }}
            >
              <div>
                <div className="flex items-center justify-between mb-2">
                  <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: '#8B4A1E15' }}>
                    <Bluetooth size={18} color="#8B4A1E" />
                  </div>
                  <span className="text-[11px] font-bold px-2 py-0.5 rounded-full" style={{ background: '#5B8A2E20', color: '#5B8A2E' }}>
                    Rekomendasi Utama
                  </span>
                </div>
                <p className="font-bold text-[13px]" style={{ color: '#2B1810' }}>Printer Bluetooth</p>
                <p className="text-[11px] mt-1 text-[#6B5448] leading-relaxed">
                  Cetak struk tanpa kabel lewat Bluetooth. Praktis dan langsung tercetak otomatis tanpa dialog tambahan.
                </p>
              </div>
              <div className="mt-3 pt-2 border-t flex items-center justify-between text-[11px] font-semibold" style={{ borderColor: '#E8D7C0', color: isBluetooth ? '#8B4A1E' : '#A89689' }}>
                <span>{isBluetooth ? 'Sedang Dipilih' : 'Pilih Mode Ini'}</span>
                {isBluetooth && <CheckCircle2 size={14} color="#8B4A1E" />}
              </div>
            </div>

            {/* Opsi 2: Kabel USB Direct */}
            <div
              role="radio"
              aria-checked={isUsb}
              tabIndex={0}
              onClick={() => handleModeChange('usb_serial')}
              onKeyDown={e => {
                if (e.key === ' ' || e.key === 'Enter') {
                  e.preventDefault()
                  handleModeChange('usb_serial')
                }
              }}
              className="p-4 rounded-xl cursor-pointer transition-all flex flex-col justify-between outline-none focus-visible:ring-2 focus-visible:ring-[#8B4A1E] focus-visible:ring-offset-2"
              style={{
                background: isUsb ? '#FAF6ED' : '#FAF6ED40',
                border: isUsb ? '2px solid #8B4A1E' : '1px solid #E8D7C0',
                boxShadow: isUsb ? '0 2px 8px -2px rgba(139, 74, 30, 0.12)' : 'none',
              }}
            >
              <div>
                <div className="flex items-center justify-between mb-2">
                  <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: '#8B4A1E15' }}>
                    <Usb size={18} color="#8B4A1E" />
                  </div>
                  <span className="text-[11px] font-bold px-2 py-0.5 rounded-full" style={{ background: '#8B4A1E15', color: '#8B4A1E' }}>
                    Kabel USB
                  </span>
                </div>
                <p className="font-bold text-[13px]" style={{ color: '#2B1810' }}>Printer Kabel USB</p>
                <p className="text-[11px] mt-1 text-[#6B5448] leading-relaxed">
                  Cetak struk menggunakan kabel USB yang dicolok langsung dari printer ke komputer kasir.
                </p>
              </div>
              <div className="mt-3 pt-2 border-t flex items-center justify-between text-[11px] font-semibold" style={{ borderColor: '#E8D7C0', color: isUsb ? '#8B4A1E' : '#A89689' }}>
                <span>{isUsb ? 'Sedang Dipilih' : 'Pilih Mode Ini'}</span>
                {isUsb && <CheckCircle2 size={14} color="#8B4A1E" />}
              </div>
            </div>
          </div>
        </div>

        {/* 3. PANDUAN KONEKSI */}
        <div className="rounded-2xl p-5" style={{ background: 'white', border: '1px solid #E8D7C0' }}>
          <h3 className="font-bold text-[14px] mb-2" style={{ color: '#2B1810' }}>
            {isBluetooth
              ? 'Panduan Koneksi Bluetooth SPP (Windows)'
              : 'Panduan Koneksi Kabel USB (Web Serial)'}
          </h3>

          {isBluetooth ? (
            <div className="space-y-2.5 mt-3">
              <p className="text-[12px] leading-relaxed text-[#6B5448]">
                Printer thermal berkomunikasi melalui Bluetooth SPP (Serial Port Profile). Ikuti langkah 1 kali setup ini:
              </p>
              <div className="flex items-start gap-3 p-3 rounded-xl" style={{ background: '#FAF6ED', border: '1px solid #E8D7C0' }}>
                <div className="w-6 h-6 rounded-full bg-[#8B4A1E] text-white text-[11px] font-bold flex items-center justify-center shrink-0 mt-0.5">
                  1
                </div>
                <div className="text-[12px]">
                  <p className="font-bold text-[#2B1810]">Pairing Bluetooth Printer di Windows</p>
                  <p className="text-[#6B5448] mt-0.5">
                    Nyalakan printer Anda. Buka menu <b>Windows Settings &gt; Bluetooth &amp; devices</b>. Klik <b>Add device</b> &gt; pilih nama printer Bluetooth Anda. Jika diminta PIN/Password, masukkan <code>1234</code> atau <code>0000</code>.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3 p-3 rounded-xl" style={{ background: '#FAF6ED', border: '1px solid #E8D7C0' }}>
                <div className="w-6 h-6 rounded-full bg-[#8B4A1E] text-white text-[11px] font-bold flex items-center justify-center shrink-0 mt-0.5">
                  2
                </div>
                <div className="text-[12px]">
                  <p className="font-bold text-[#2B1810]">Buat Port COM Outgoing (Virtual Serial)</p>
                  <p className="text-[#6B5448] mt-0.5">
                    Pada Windows Bluetooth Settings, buka <b>More Bluetooth settings &gt; tab COM Ports</b>. Klik <b>Add</b> &gt; pilih <b>Outgoing</b> &gt; pilih nama printer Anda &gt; Service: <b>SPP slave</b> (misal Windows akan menetapkan <b>COM6</b>). Klik OK.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3 p-3 rounded-xl" style={{ background: '#FAF6ED', border: '1px solid #E8D7C0' }}>
                <div className="w-6 h-6 rounded-full bg-[#5B8A2E] text-white text-[11px] font-bold flex items-center justify-center shrink-0 mt-0.5">
                  3
                </div>
                <div className="text-[12px]">
                  <p className="font-bold text-[#2B1810]">Pilih Port di POS Hasuka</p>
                  <p className="text-[#6B5448] mt-0.5">
                    Klik kartu status printer di atas atau tombol <b>"Pilih Port Bluetooth"</b>. Pilih port COM printer Anda (misal COM6) lalu klik Sambungkan. Sekali izin diberikan, aplikasi akan otomatis menyambung ulang tiap kali kasir dibuka!
                  </p>
                </div>
              </div>
            </div>
          ) : (
            <div className="space-y-2.5 mt-3">
              <p className="text-[12px] leading-relaxed text-[#6B5448]">
                Gunakan mode ini jika printer thermal dicolok menggunakan kabel USB:
              </p>
              <div className="flex items-start gap-3 p-3 rounded-xl" style={{ background: '#FAF6ED', border: '1px solid #E8D7C0' }}>
                <div className="w-6 h-6 rounded-full bg-[#8B4A1E] text-white text-[11px] font-bold flex items-center justify-center shrink-0 mt-0.5">
                  1
                </div>
                <div className="text-[12px]">
                  <p className="font-bold text-[#2B1810]">Colok Kabel USB ke Laptop Kasir</p>
                  <p className="text-[#6B5448] mt-0.5">Pastikan lampu indikator printer menyala dan roll kertas thermal terpasang rapi.</p>
                </div>
              </div>

              <div className="flex items-start gap-3 p-3 rounded-xl" style={{ background: '#FAF6ED', border: '1px solid #E8D7C0' }}>
                <div className="w-6 h-6 rounded-full bg-[#5B8A2E] text-white text-[11px] font-bold flex items-center justify-center shrink-0 mt-0.5">
                  2
                </div>
                <div className="text-[12px]">
                  <p className="font-bold text-[#2B1810]">Beri Akses Port USB</p>
                  <p className="text-[#6B5448] mt-0.5">Klik kartu status printer di atas atau tombol <b>"Pilih Port Printer"</b>, lalu pilih port USB perangkat printer Anda.</p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* 4. FORMAT UKURAN KERTAS THERMAL (TAHAP 1 POLISH: FOCUS-VISIBLE, ROVING TABINDEX, KONTRAST TEMA) */}
        <div className="rounded-2xl p-5" style={{ background: 'white', border: '1px solid #E8D7C0' }}>
          <h3 className="font-bold text-[14px] mb-3" style={{ color: '#2B1810' }}>Format Ukuran Kertas Thermal</h3>
          <div>
            <label className="block text-[11px] font-bold mb-2 text-[#6B5448]" style={{ letterSpacing: '0.06em' }}>
              LEBAR KERTAS ROLL (PAPER SIZE)
            </label>
            <div
              role="radiogroup"
              aria-label="Lebar Kertas Roll"
              className="grid grid-cols-1 sm:grid-cols-3 gap-3"
            >
              {[
                {
                  id: '58mm',
                  title: '58 mm',
                  sub: 'Roll Mini Thermal (32 Kolom)',
                  badge: 'Format Standar',
                  desc: 'Format pas untuk printer Bluetooth/USB mini agar struk rapi tanpa terpotong.',
                },
                {
                  id: '80mm',
                  title: '80 mm',
                  sub: 'Roll Standar Kasir (42 Kolom)',
                  desc: 'Format lebar standar untuk printer kasir thermal desktop besar.',
                },
                {
                  id: 'auto',
                  title: 'Otomatis',
                  sub: 'Adaptif Layar',
                  desc: 'Menyesuaikan lebar struk otomatis sesuai tampilan layar perangkat.',
                },
              ].map((opt, idx) => {
                const isSelected = printerDraft.paperWidth === opt.id
                return (
                  <div
                    key={opt.id}
                    ref={el => { paperCardRefs.current[idx] = el }}
                    role="radio"
                    aria-checked={isSelected}
                    tabIndex={isSelected ? 0 : -1}
                    onClick={() => setPrinterDraft(d => ({ ...d, paperWidth: opt.id as any }))}
                    onKeyDown={e => {
                      if (e.key === ' ' || e.key === 'Enter') {
                        e.preventDefault()
                        setPrinterDraft(d => ({ ...d, paperWidth: opt.id as any }))
                      } else {
                        handlePaperKeyDown(e, idx)
                      }
                    }}
                    className="p-3.5 rounded-xl cursor-pointer transition-all flex flex-col justify-between outline-none focus-visible:ring-2 focus-visible:ring-[#8B4A1E] focus-visible:ring-offset-2"
                    style={{
                      background: isSelected ? '#FAF6ED' : '#FAF6ED40',
                      border: isSelected ? '2px solid #8B4A1E' : '1.5px solid #E8D7C0',
                      boxShadow: isSelected ? '0 2px 8px -2px rgba(139, 74, 30, 0.12)' : 'none',
                    }}
                  >
                    <div>
                      <div className="flex items-center justify-between mb-1 gap-1">
                        <span className="font-bold text-[14px]" style={{ color: isSelected ? '#8B4A1E' : '#2B1810' }}>
                          {opt.title}
                        </span>
                        {opt.badge && (
                          <span
                            className="text-[11px] px-2 py-0.5 rounded-full font-bold shrink-0"
                            style={{ background: '#8B4A1E18', color: '#8B4A1E' }}
                          >
                            {opt.badge}
                          </span>
                        )}
                      </div>
                      <p className="text-[12px] font-semibold text-[#4A3B32]">{opt.sub}</p>
                      <p className="text-[11px] mt-1 text-[#5C483D] leading-tight">{opt.desc}</p>
                    </div>

                    <div className="mt-3 pt-2 border-t flex items-center justify-between text-[11px] font-semibold" style={{ borderColor: '#E8D7C080', color: isSelected ? '#8B4A1E' : '#8A7669' }}>
                      <span>{isSelected ? 'Ukuran Aktif' : 'Pilih Ukuran'}</span>
                      {isSelected ? (
                        <CheckCircle2 size={16} color="#8B4A1E" />
                      ) : (
                        <span className="w-4 h-4 rounded-full border border-[#D9C4A9]" />
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        </div>

        {/* 5. OPSIH TAMBAHAN STRUK & BUFFER ESC/POS */}
        <div className="rounded-2xl p-5" style={{ background: 'white', border: '1px solid #E8D7C0' }}>
          <h3 className="font-bold text-[14px] mb-3" style={{ color: '#2B1810' }}>Fitur Struk &amp; Perangkat Keras</h3>
          <div className="space-y-3">
            <div className="flex items-center justify-between p-3.5 rounded-xl transition-all" style={{ background: '#FAF6ED', border: '1px solid #E8D7C060' }}>
              <div>
                <p className="font-bold text-[13px]" style={{ color: '#2B1810' }}>Potong Kertas Otomatis (Auto Cut)</p>
                <p className="text-[11px] text-[#6B5448]">Kirim sinyal potong (GS V) ke printer setelah struk selesai dicetak.</p>
              </div>
              <Toggle
                on={printerDraft.autoCut}
                onToggle={() => setPrinterDraft(d => ({ ...d, autoCut: !d.autoCut }))}
                label="Potong Kertas Otomatis"
              />
            </div>

            <div className="flex items-center justify-between p-3.5 rounded-xl transition-all" style={{ background: '#FAF6ED', border: '1px solid #E8D7C060' }}>
              <div>
                <p className="font-bold text-[13px]" style={{ color: '#2B1810' }}>Buka Laci Uang Kasir (Cash Drawer)</p>
                <p className="text-[11px] text-[#6B5448]">Kirim pulsa listrik pembuka laci (ESC p) ke pin RJ11 printer saat struk dicetak.</p>
              </div>
              <Toggle
                on={printerDraft.openCashDrawer}
                onToggle={() => setPrinterDraft(d => ({ ...d, openCashDrawer: !d.openCashDrawer }))}
                label="Buka Laci Kasir"
              />
            </div>

            <div className="flex items-center justify-between p-3.5 rounded-xl transition-all" style={{ background: '#FAF6ED', border: '1px solid #E8D7C060' }}>
              <div>
                <p className="font-bold text-[13px]" style={{ color: '#2B1810' }}>Cetak Otomatis Saat Bayar Sukses</p>
                <p className="text-[11px] text-[#6B5448]">Langsung mencetak struk transaksi begitu pembayaran selesai divalidasi kasir.</p>
              </div>
              <Toggle
                on={printerDraft.autoPrintOnCheckout}
                onToggle={() => setPrinterDraft(d => ({ ...d, autoPrintOnCheckout: !d.autoPrintOnCheckout }))}
                label="Cetak Otomatis Saat Bayar"
              />
            </div>
          </div>

          {/* Accordion Pengaturan Lanjutan Buffer (ESC/POS) */}
          <div className="mt-4 pt-4 border-t" style={{ borderColor: '#E8D7C0' }}>
            <button
              type="button"
              onClick={() => setShowAdvancedPrinter(!showAdvancedPrinter)}
              className="w-full flex items-center justify-between text-left py-1 cursor-pointer group outline-none"
            >
              <div>
                <h4 className="font-bold text-[13px] text-[#2B1810] group-hover:text-[#8B4A1E] transition-colors">
                  Pengaturan Lanjutan Buffer (ESC/POS)
                </h4>
                <p className="text-[11px] text-[#6B5448] mt-0.5">
                  Penyesuaian ukuran paket data (chunk) dan jeda bakar thermal untuk printer mini.
                </p>
              </div>
              <div
                className="p-1 rounded-lg text-[#8B4A1E] transition-transform duration-200"
                style={{ transform: showAdvancedPrinter ? 'rotate(180deg)' : 'rotate(0deg)' }}
              >
                <ChevronDown size={18} />
              </div>
            </button>

            <div className={`collapse-transition ${showAdvancedPrinter ? 'open' : 'closed'}`}>
              <div className="collapse-inner pt-3 space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <WarmSelect
                      id="printer-chunk-size"
                      label="UKURAN PAKET DATA (CHUNK SIZE)"
                      value={printerDraft.chunkSize || 256}
                      onChange={val => setPrinterDraft(d => ({ ...d, chunkSize: Number(val) }))}
                      options={[
                        { value: 64, label: '64 Byte', description: 'Sangat Aman / Lebih Lambat' },
                        { value: 128, label: '128 Byte', description: 'Aman' },
                        { value: 256, label: '256 Byte', badge: 'Rekomendasi', description: 'Standar buffer printer mini' },
                        { value: 512, label: '512 Byte', description: 'Cepat / Buffer Besar' },
                      ]}
                    />
                  </div>

                  <div>
                    <WarmSelect
                      id="printer-chunk-delay"
                      label="JEDA ANTAR PAKET (CHUNK DELAY)"
                      value={printerDraft.chunkDelayMs || 30}
                      onChange={val => setPrinterDraft(d => ({ ...d, chunkDelayMs: Number(val) }))}
                      options={[
                        { value: 10, label: '10 ms', description: 'Cepat' },
                        { value: 20, label: '20 ms' },
                        { value: 30, label: '30 ms', badge: 'Rekomendasi', description: 'Standar jeda bakar thermal' },
                        { value: 50, label: '50 ms', description: 'Ekstra Aman' },
                        { value: 100, label: '100 ms' },
                      ]}
                    />
                  </div>
                </div>

                <p className="text-[11px] leading-relaxed text-[#6B5448]">
                  <b>Info Teknis:</b> Komunikasi serial pada printer 58mm umumnya memiliki kapasitas buffer terbatas (~1-2 KB). Mengirim data terbagi per paket 256 byte dengan jeda 30 ms memastikan printer memiliki waktu untuk membakar kertas tanpa ada byte yang hilang atau terpotong.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* 6. TOMBOL SIMPAN PENGATURAN */}
        <Button
          onClick={() => {
            savePrinterSettings(printerDraft)
            showToast({
              variant: 'success',
              title: 'Pengaturan Printer Disimpan',
              description: `Tipe: ${isBluetooth ? 'Bluetooth SPP' : 'USB Serial'}, Kertas: ${printerDraft.paperWidth}`,
            })
          }}
          size="lg"
          fullWidth
        >
          Simpan Pengaturan Printer
        </Button>

        {/* REVISI 6: KARTU MELAYANG PEMILIH PORT (FLOATING MODAL via React Portal) */}
        {isPortModalOpen && typeof document !== 'undefined' && createPortal(
          <div
            className="fixed inset-0 z-[999] flex items-center justify-center p-4 bg-[#2B1810]/30 backdrop-blur-sm"
            onClick={() => setIsPortModalOpen(false)}
          >
            <div
              className="bg-white rounded-2xl p-6 w-full max-w-md max-h-[90vh] flex flex-col border border-[#E8D7C0] shadow-2xl relative"
              onClick={e => e.stopPropagation()}
              role="dialog"
              aria-modal="true"
              aria-labelledby="modal-port-title"
            >
              {/* Header Modal */}
              <div className="flex items-center justify-between pb-3 border-b border-[#E8D7C0] shrink-0">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-lg bg-[#8B4A1E15] flex items-center justify-center">
                    {isBluetooth ? <Bluetooth size={18} color="#8B4A1E" /> : <Usb size={18} color="#8B4A1E" />}
                  </div>
                  <div>
                    <h3 id="modal-port-title" className="font-bold text-[14px] text-[#2B1810]">
                      {isBluetooth ? 'Hubungkan Printer Bluetooth' : 'Hubungkan Printer USB'}
                    </h3>
                    <p className="text-[11px] text-[#6B5448]">
                      {isBluetooth ? 'Koneksi nirkabel (tanpa kabel)' : 'Koneksi kabel colok langsung'}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setIsPortModalOpen(false)}
                  className="p-1.5 rounded-lg hover:bg-[#F3E7CE] text-[#6B5448] transition-colors cursor-pointer"
                  aria-label="Tutup"
                >
                  <X size={18} />
                </button>
              </div>

              {/* Scrollable Body: Petunjuk + Daftar Port */}
              <div className="flex-1 overflow-y-auto space-y-4 py-3 pr-0.5 hide-scrollbar">
                {/* Petunjuk Singkat Ramah Pengguna (Windows & Tablet Android) */}
                <div className="p-3 rounded-xl bg-[#FAF6ED] border border-[#E8D7C0] text-[11px] text-[#6B5448] leading-relaxed">
                  {isBluetooth ? (
                    <span>
                      Pastikan printer sudah dinyalakan dan Bluetooth-nya sudah tersambung (paired) ke komputer atau tablet kasir. Cukup hubungkan <b>sekali saja</b> di sini.
                    </span>
                  ) : (
                    <span>
                      Pastikan kabel USB printer sudah dicolok rapat ke komputer kasir dan printer dalam keadaan menyala.
                    </span>
                  )}
                </div>

                {/* Daftar Port yang Pernah Diizinkan (Isolasi Ketat Sesuai Mode Aktif) */}
                <div>
                  <p className="text-[11px] font-bold text-[#6B5448] mb-2 uppercase tracking-wide">
                    Daftar Printer Tersimpan
                  </p>
                  {isLoadingPorts ? (
                    <div className="p-4 text-center text-[12px] text-[#6B5448] flex items-center justify-center gap-2">
                      <RefreshCw size={14} className="animate-spin text-[#8B4A1E]" /> Memeriksa port...
                    </div>
                  ) : availablePorts.length > 0 ? (
                    <div className="space-y-2 max-h-48 overflow-y-auto pr-1 hide-scrollbar">
                      {availablePorts.map((item, idx) => (
                        <button
                          key={idx}
                          onClick={() => handleSelectExistingPort(item.port)}
                          className="w-full p-3 rounded-xl border border-[#E8D7C0] hover:border-[#8B4A1E] hover:bg-[#FAF6ED] transition-all text-left flex items-center justify-between group cursor-pointer outline-none focus-visible:ring-2 focus-visible:ring-[#8B4A1E]"
                        >
                          <div className="flex items-center gap-2.5">
                            {item.isUsb ? <Usb size={16} color="#8B4A1E" /> : <Bluetooth size={16} color="#8B4A1E" />}
                            <div>
                              <p className="text-[12px] font-bold text-[#2B1810] group-hover:text-[#8B4A1E]">
                                {item.displayName}
                              </p>
                              <p className="text-[10px] text-[#6B5448]">
                                {item.isUsb ? 'Kabel USB terdeteksi' : 'Bluetooth terdeteksi'}
                              </p>
                            </div>
                          </div>
                          <span className="text-[11px] font-semibold text-[#8B4A1E] opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
                            Sambungkan &rarr;
                          </span>
                        </button>
                      ))}
                    </div>
                  ) : (
                    /* Pesan Jika Belum Ada Port Tersimpan untuk Mode Ini */
                    <div className="p-3.5 rounded-xl bg-[#FAF6ED] border border-[#E8D7C0] text-center text-[11px] text-[#8B4A1E] leading-relaxed">
                      {isBluetooth ? (
                        'Belum ada printer Bluetooth yang tersimpan. Klik tombol Cari Printer di bawah untuk menghubungkan.'
                      ) : (
                        'Belum ada printer USB yang tersimpan. Pastikan kabel printer sudah dicolok, lalu klik tombol Cari Printer di bawah.'
                      )}
                    </div>
                  )}
                </div>
              </div>

              {/* Tombol Aksi: Cari Printer Baru & Batal */}
              <div className="pt-3 border-t border-[#E8D7C0] space-y-2 shrink-0">
                <div className="p-2.5 rounded-xl bg-[#FAF6ED] border border-[#E8D7C0] text-[11px] text-[#6B5448] leading-relaxed">
                  <p className="font-semibold text-[#2B1810] mb-0.5">Petunjuk:</p>
                  <span>
                    {isBluetooth
                      ? 'Nanti akan muncul jendela kecil dari browser. Klik nama printer Bluetooth kasir Anda, lalu klik "Connect" (atau "Sambungkan").'
                      : 'Nanti akan muncul jendela kecil dari browser. Klik printer kabel kasir Anda, lalu klik "Connect" (atau "Sambungkan").'}
                  </span>
                </div>
                <Button
                  variant="primary"
                  size="md"
                  className="w-full justify-center"
                  onClick={handleRequestNewPort}
                  loading={isConnectingSerial}
                  icon={!isConnectingSerial ? <Search size={14} /> : undefined}
                >Cari Printer...</Button>
                <Button
                  variant="ghost"
                  size="sm"
                  className="w-full justify-center text-[#6B5448]"
                  onClick={() => setIsPortModalOpen(false)}
                >
                  Batal
                </Button>
              </div>
            </div>
          </div>,
          document.body
        )}
      </div>
    )
  }

  const GenericTab = ({ id }: { id: string }) => (
    <div className="rounded-2xl p-8 flex flex-col items-center justify-center text-center min-h-48" style={{ background: 'white', border: '1px solid #E8D7C0' }}>
      <p className="font-serif font-bold text-[16px] mb-2" style={{ color: '#2B1810' }}>
        {TABS.find(t => t.id === id)?.label}
      </p>
      <p className="text-[13px]" style={{ color: '#6B5448' }}>Fitur pengaturan ini sedang dalam pengembangan.</p>
    </div>
  )

  return (
    <>
    <PageShell
      title="Pengaturan Sistem"
      subtitle="Pajak, printer, QRIS, dan konfigurasi outlet"
      onBack={onBack}
      backLabel={backLabel}
      onNavigate={onNavigate}
      activeNav="settings"
      rightPanelWidth={220}
      rightPanel={
        <div className="py-4 px-3 hidden md:block">
          <p className="text-[10px] font-bold mb-3 px-2" style={{ color: '#C49A62', letterSpacing: '0.08em' }}>KATEGORI</p>
          <div className="flex flex-col gap-1">
            {TABS.map(tab => {
              const Icon = tab.icon
              const isActive = activeTab === tab.id
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className="flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-left transition-all duration-200 cursor-pointer active:scale-98"
                  style={{
                    background: isActive ? '#2B1810' : 'transparent',
                    color: isActive ? '#F3E7CE' : '#6B5448',
                  }}
                >
                  <Icon size={15} />
                  <span className="font-semibold text-[13px]">{tab.label}</span>
                </button>
              )
            })}
          </div>
        </div>
      }
    >
      {/* Mobile horizontal tab pills */}
      <div className="md:hidden px-3.5 py-2.5 flex gap-2 overflow-x-auto scrollbar-hide border-b" style={{ borderColor: '#E8D7C0', background: 'white' }}>
        {TABS.map(tab => {
          const Icon = tab.icon
          const isActive = activeTab === tab.id
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[12px] font-bold whitespace-nowrap shrink-0 transition-all duration-200 cursor-pointer active:scale-95"
              style={{ background: isActive ? '#2B1810' : '#F3E7CE', color: isActive ? '#F3E7CE' : '#6B5448' }}
            >
              <Icon size={13} />
              {tab.label}
            </button>
          )
        })}
      </div>
      <div className="px-3.5 md:px-6 py-4 md:py-5 pb-32">
        <style>{`
          @keyframes tabFadeSlide {
            from {
              opacity: 0;
              transform: translateY(4px);
            }
            to {
              opacity: 1;
              transform: translateY(0);
            }
          }
          .tab-content-transition {
            animation: tabFadeSlide 180ms cubic-bezier(0.16, 1, 0.3, 1) forwards;
          }
          .collapse-transition {
            display: grid;
            transition: grid-template-rows 200ms cubic-bezier(0.16, 1, 0.3, 1), opacity 180ms ease-out;
          }
          .collapse-transition.closed {
            grid-template-rows: 0fr;
            opacity: 0;
            pointer-events: none;
          }
          .collapse-transition.open {
            grid-template-rows: 1fr;
            opacity: 1;
          }
          .collapse-inner {
            overflow: hidden;
          }
          .hide-scrollbar {
            scrollbar-width: none;
            -ms-overflow-style: none;
          }
          .hide-scrollbar::-webkit-scrollbar {
            display: none;
          }
          @media (prefers-reduced-motion: reduce) {
            .tab-content-transition {
              animation: none !important;
            }
            .collapse-transition {
              transition: none !important;
            }
          }
        `}</style>
        <div key={activeTab} className="tab-content-transition">
          {activeTab === 'pajak' && PajakTab()}
          {activeTab === 'struk' && StrukTab()}
          {activeTab === 'printer' && PrinterTab()}
          {activeTab === 'integrasi' && IntegrasiTab()}
          {activeTab !== 'pajak' && activeTab !== 'struk' && activeTab !== 'printer' && activeTab !== 'integrasi' && GenericTab({ id: activeTab })}
        </div>
      </div>
    </PageShell>
    </>
  )
}
