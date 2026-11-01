import { useState, useRef, useEffect } from 'react'
import { Printer, Home, Percent, Link2, ToggleLeft, ToggleRight, FileText, UploadCloud, Loader2, Laptop, Bluetooth, Usb, CheckCircle2, AlertTriangle, RefreshCw, Power, DollarSign, ChevronDown, ChevronUp } from 'lucide-react'
import PageShell from './PageShell'
import { useApp } from '../context/AppContext'
import { gasApi, compressImageFile } from '../services/gasApi'
import { setLocalSetting } from '../services/db'
import { HASUKA_LOGO } from '../assets/logo'
import { generateReceiptString } from '../utils/receiptPrinter'
import { getStoredPrinterSettings, savePrinterSettings, printTestReceipt, PrinterSettingsConfig, detectDevicePlatform } from '../services/printer'
import { webSerialPrinter, WebSerialStatus } from '../services/webSerialPrinter'
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
  const [printerDraft, setPrinterDraft] = useState<PrinterSettingsConfig>(() => getStoredPrinterSettings())
  const [isTestingPrinter, setIsTestingPrinter] = useState(false)
  const [serialStatus, setSerialStatus] = useState<WebSerialStatus>(() => webSerialPrinter.getStatus())
  const [serialPortName, setSerialPortName] = useState<string>(() => webSerialPrinter.getPortName())
  const [isConnectingSerial, setIsConnectingSerial] = useState(false)
  const [isTestingDrawer, setIsTestingDrawer] = useState(false)
  const [showAdvancedPrinter, setShowAdvancedPrinter] = useState(false)

  useEffect(() => {
    const unsub = webSerialPrinter.subscribe((status, name) => {
      setSerialStatus(status)
      setSerialPortName(name)
    })
    if (printerDraft.printerType === 'bluetooth_serial' && webSerialPrinter.isSupported()) {
      webSerialPrinter.autoReconnect().catch(() => {})
    }
    return () => unsub()
  }, [printerDraft.printerType])

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
      onClick={onToggle} 
      role="switch"
      aria-checked={on}
      aria-label={label}
      className="transition-all" 
      style={{ color: on ? '#5B8A2E' : '#C49A62' }}
    >
      {on ? <ToggleRight size={32} aria-hidden="true" /> : <ToggleLeft size={32} aria-hidden="true" />}
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

        {isPajakActive && (
          <div>
            <label className="block text-[11px] font-bold mb-2" style={{ color: '#6B5448', letterSpacing: '0.06em' }}>TARIF PPN (%)</label>
            <div className="flex gap-2 mb-3">
              {[0, 5, 10, 11, 12].map(r => (
                <button key={r} onClick={() => { 
                  setPajakRate(r); 
                  if (isPajakActive) setTaxRate(r);
                  setCustomPajakInput('') 
                }}
                  className="flex-1 py-2 rounded-xl font-bold text-[13px] transition-colors"
                  style={{ background: pajakRate === r && !customPajakInput ? '#8B4A1E' : 'white', color: pajakRate === r && !customPajakInput ? 'white' : '#6B5448', border: pajakRate === r && !customPajakInput ? '1px solid #8B4A1E' : '1px solid #E8D7C0' }}>
                  {r}%
                </button>
              ))}
            </div>
            <div className="relative">
              <input type="number" value={customPajakInput} min={0} max={100}
                onChange={e => { 
                  setCustomPajakInput(e.target.value); 
                  const val = parseFloat(e.target.value) || 0
                  setPajakRate(val)
                  if (isPajakActive && e.target.value) setTaxRate(val)
                }}
                placeholder="Atau ketik tarif custom (0–100)..."
                className="w-full px-4 py-2.5 rounded-xl text-[13px] outline-none"
                style={{ background: 'white', border: `1.5px solid ${customPajakInput ? '#8B4A1E' : '#E8D7C0'}`, color: '#2B1810' }}
                onFocus={e => e.currentTarget.style.borderColor = '#8B4A1E'}
                onBlur={e => { if (!customPajakInput) e.currentTarget.style.borderColor = '#E8D7C0' }} />
              {customPajakInput && <span className="absolute right-4 top-1/2 -translate-y-1/2 font-bold text-[13px]" style={{ color: '#8B4A1E' }}>%</span>}
            </div>
          </div>
        )}
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
        {serviceCharge > 0 && (
          <div>
            <label className="block text-[11px] font-bold mb-2" style={{ color: '#6B5448', letterSpacing: '0.06em' }}>TARIF BIAYA LAYANAN (%)</label>
            <div className="flex gap-2 mb-3">
              {[5, 10, 15].map(r => (
                <button key={r} onClick={() => { 
                  setServiceCharge(r); 
                  setServiceRate(r);
                  setCustomServiceInput('') 
                }}
                  className="flex-1 py-2 rounded-xl font-bold text-[13px] transition-colors"
                  style={{ background: serviceCharge === r && !customServiceInput ? '#8B4A1E' : 'white', color: serviceCharge === r && !customServiceInput ? 'white' : '#6B5448', border: serviceCharge === r && !customServiceInput ? '1px solid #8B4A1E' : '1px solid #E8D7C0' }}>
                  {r}%
                </button>
              ))}
            </div>
            <div className="relative">
              <input type="number" value={customServiceInput} min={0} max={100}
                onChange={e => { 
                  setCustomServiceInput(e.target.value); 
                  const val = parseFloat(e.target.value) || 0
                  setServiceCharge(val)
                  if (e.target.value) setServiceRate(val)
                }}
                placeholder="Atau ketik tarif custom (0–100)..."
                className="w-full px-4 py-2.5 rounded-xl text-[13px] outline-none"
                style={{ background: 'white', border: `1.5px solid ${customServiceInput ? '#8B4A1E' : '#E8D7C0'}`, color: '#2B1810' }}
                onFocus={e => e.currentTarget.style.borderColor = '#8B4A1E'}
                onBlur={e => { if (!customServiceInput) e.currentTarget.style.borderColor = '#E8D7C0' }} />
              {customServiceInput && <span className="absolute right-4 top-1/2 -translate-y-1/2 font-bold text-[13px]" style={{ color: '#8B4A1E' }}>%</span>}
            </div>
          </div>
        )}
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
        
        {receiptDraft.showLogo && (
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
              className="px-4 py-2 rounded-xl text-[12px] font-bold disabled:opacity-50" 
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
        )}
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
    const device = detectDevicePlatform()
    const isSupported = webSerialPrinter.isSupported()
    const isBluetooth = printerDraft.printerType === 'bluetooth_serial'
    const isUsb = printerDraft.printerType === 'usb_serial'
    const isDirectSerial = isBluetooth || isUsb
    const isConnected = serialStatus === 'connected'

    const handleConnectSerial = async () => {
      setIsConnectingSerial(true)
      try {
        const success = await webSerialPrinter.requestAndConnect()
        if (success) {
          const portName = webSerialPrinter.getPortName()
          showToast({
            variant: 'success',
            title: 'Printer Terhubung!',
            description: `Port aktif: ${portName}. Mode cetak langsung ESC/POS siap digunakan.`,
          })
        } else {
          showToast({
            variant: 'warning',
            title: 'Koneksi Dibatalkan',
            description: 'Tidak ada port printer yang dipilih.',
          })
        }
      } catch (err: any) {
        showToast({
          variant: 'destructive',
          title: 'Gagal Menghubungkan Printer',
          description: err?.message || 'Pastikan Bluetooth ON dan port Outgoing COM sudah terdaftar di Windows.',
        })
      } finally {
        setIsConnectingSerial(false)
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
            title: 'Uji Cetak Berhasil',
            description: isDirectSerial
              ? 'Struk uji berhasil dikirim langsung ke printer tanpa dialog!'
              : 'Dialog cetak browser berhasil dipanggil.',
          })
        } else {
          showToast({
            variant: 'destructive',
            title: 'Gagal Cetak Uji',
            description: 'Printer tidak merespons atau dialog cetak dibatalkan.',
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
        if (isDirectSerial) {
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
              description: 'Pastikan printer Bluetooth terhubung.',
            })
          }
        } else {
          showToast({
            variant: 'info',
            title: 'Fitur Khusus Direct ESC/POS',
            description: 'Buka laci kasir otomatis memerlukan mode Bluetooth atau USB Web Serial.',
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

    return (
      <div className="space-y-4 animate-fade-in no-scrollbar" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
        <style>{`
          .no-scrollbar::-webkit-scrollbar {
            display: none;
          }
        `}</style>

        {/* 1. Status Card */}
        {isBluetooth && !isSupported ? (
          <div className="rounded-2xl p-4 md:p-5 flex items-start gap-3.5 shadow-xs" style={{ background: '#FFF1F0', border: '1.5px solid #FFA39E' }}>
            <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0" style={{ background: '#FFCCC7' }}>
              <AlertTriangle size={20} color="#CF1322" />
            </div>
            <div>
              <p className="font-bold text-[14px]" style={{ color: '#A8071A' }}>
                Web Serial API Tidak Didukung Browser Ini
              </p>
              <p className="text-[12px] mt-0.5 leading-relaxed" style={{ color: '#5C0011' }}>
                Browser Anda belum mendukung Web Serial API untuk koneksi Bluetooth SPP langsung. Silakan gunakan <b>Google Chrome</b> atau <b>Microsoft Edge</b> di PC/Laptop kasir. Saat ini sistem akan otomatis dialihkan ke <b>Driver Sistem (Browser)</b> sebagai cadangan saat mencetak.
              </p>
            </div>
          </div>
        ) : isDirectSerial ? (
          <div
            className="rounded-2xl p-4 md:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-xs transition-all"
            style={{
              background: isConnected ? '#EAF4E0' : '#FFF8F0',
              border: isConnected ? '1.5px solid #5B8A2E40' : '1.5px solid #E8D7C0',
            }}
          >
            <div className="flex items-start sm:items-center gap-3.5">
              <div
                className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
                style={{ background: isConnected ? '#5B8A2E20' : '#8B4A1E15' }}
              >
                {isBluetooth ? (
                  <Bluetooth size={20} color={isConnected ? '#5B8A2E' : '#8B4A1E'} />
                ) : (
                  <Usb size={20} color={isConnected ? '#5B8A2E' : '#8B4A1E'} />
                )}
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <p className="font-bold text-[14px]" style={{ color: '#2B1810' }}>
                    {isBluetooth ? 'Bluetooth SPP (RPP02N 58mm)' : 'Kabel USB (Web Serial)'}
                  </p>
                  <span
                    className="text-[11px] font-bold px-2 py-0.5 rounded-full inline-flex items-center gap-1"
                    style={{
                      background: isConnected ? '#5B8A2E' : serialStatus === 'connecting' ? '#D48806' : '#8C8C8C',
                      color: 'white',
                    }}
                  >
                    {isConnected ? (
                      <>
                        <CheckCircle2 size={11} /> Terhubung
                      </>
                    ) : serialStatus === 'connecting' ? (
                      <>
                        <RefreshCw size={11} className="animate-spin" /> Menghubungkan...
                      </>
                    ) : (
                      'Terputus / Belum Dipilih'
                    )}
                  </span>
                </div>
                <p className="text-[12px] mt-0.5" style={{ color: '#6B5448' }}>
                  {isConnected
                    ? `Port Aktif: ${serialPortName || 'Port Serial Terhubung'}. Siap mencetak langsung dengan perintah ESC/POS.`
                    : 'Port serial belum aktif. Klik "Hubungkan Printer" untuk mengaktifkan koneksi.'}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              {isConnected ? (
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={handleDisconnectSerial}
                  icon={<Power size={14} />}
                >
                  Putuskan Port
                </Button>
              ) : (
                <Button
                  variant="primary"
                  size="sm"
                  onClick={handleConnectSerial}
                  loading={isConnectingSerial}
                  icon={!isConnectingSerial ? <Bluetooth size={14} /> : undefined}
                >
                  Hubungkan Printer
                </Button>
              )}
            </div>
          </div>
        ) : (
          <div className="rounded-2xl p-4 md:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-xs" style={{ background: '#EAF4E0', border: '1.5px solid #5B8A2E40' }}>
            <div className="flex items-start sm:items-center gap-3.5">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0" style={{ background: '#5B8A2E20' }}>
                <Laptop size={20} color="#5B8A2E" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <p className="font-bold text-[14px]" style={{ color: '#2B1810' }}>
                    Koneksi Aktif: <span style={{ color: '#5B8A2E' }}>{device.os} (Driver Sistem)</span>
                  </p>
                  <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-[#5B8A2E] text-white inline-flex items-center gap-1">
                    <CheckCircle2 size={11} /> Aktif
                  </span>
                </div>
                <p className="text-[12px] mt-0.5" style={{ color: '#6B5448' }}>
                  Aplikasi mencetak lewat dialog sistem browser ke spooler printer default komputer/laptop kasir ini.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* 2. Pilihan Tipe Koneksi Printer */}
        <div className="rounded-2xl p-5" style={{ background: 'white', border: '1px solid #E8D7C0' }}>
          <h3 className="font-bold text-[14px] mb-3" style={{ color: '#2B1810' }}>Pilih Tipe Koneksi Printer</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {/* Opsi 1: Bluetooth SPP */}
            <div
              onClick={() => setPrinterDraft(d => ({ ...d, printerType: 'bluetooth_serial' }))}
              className="p-4 rounded-xl cursor-pointer transition-all flex flex-col justify-between"
              style={{
                background: printerDraft.printerType === 'bluetooth_serial' ? '#FAF6ED' : '#FAFAFA',
                border: printerDraft.printerType === 'bluetooth_serial' ? '2px solid #8B4A1E' : '1px solid #E8D7C0',
              }}
            >
              <div>
                <div className="flex items-center justify-between mb-2">
                  <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: '#8B4A1E15' }}>
                    <Bluetooth size={18} color="#8B4A1E" />
                  </div>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full" style={{ background: '#5B8A2E20', color: '#5B8A2E' }}>
                    Rekomendasi RPP02N
                  </span>
                </div>
                <p className="font-bold text-[13px]" style={{ color: '#2B1810' }}>Bluetooth (Web Serial)</p>
                <p className="text-[11px] mt-1 leading-relaxed" style={{ color: '#6B5448' }}>
                  Cetak langsung kecepatan tinggi lewat port COM virtual Windows tanpa muncul jendela dialog browser.
                </p>
              </div>
              <div className="mt-3 pt-2 border-t flex items-center justify-between text-[11px] font-semibold" style={{ borderColor: '#E8D7C0', color: printerDraft.printerType === 'bluetooth_serial' ? '#8B4A1E' : '#A89689' }}>
                <span>{printerDraft.printerType === 'bluetooth_serial' ? '✓ Sedang Dipilih' : 'Pilih Mode Ini'}</span>
              </div>
            </div>

            {/* Opsi 2: Driver Sistem */}
            <div
              onClick={() => setPrinterDraft(d => ({ ...d, printerType: 'system_browser' }))}
              className="p-4 rounded-xl cursor-pointer transition-all flex flex-col justify-between"
              style={{
                background: printerDraft.printerType === 'system_browser' ? '#FAF6ED' : '#FAFAFA',
                border: printerDraft.printerType === 'system_browser' ? '2px solid #8B4A1E' : '1px solid #E8D7C0',
              }}
            >
              <div>
                <div className="flex items-center justify-between mb-2">
                  <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: '#8B4A1E15' }}>
                    <Laptop size={18} color="#8B4A1E" />
                  </div>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full" style={{ background: '#FAF0E6', color: '#8B4A1E' }}>
                    Driver Bawaan
                  </span>
                </div>
                <p className="font-bold text-[13px]" style={{ color: '#2B1810' }}>Driver Sistem (Browser)</p>
                <p className="text-[11px] mt-1 leading-relaxed" style={{ color: '#6B5448' }}>
                  Memakai dialog cetak bawaan browser (Ctrl+P). Kompatibel dengan semua printer USB/WiFi yang berdriver.
                </p>
              </div>
              <div className="mt-3 pt-2 border-t flex items-center justify-between text-[11px] font-semibold" style={{ borderColor: '#E8D7C0', color: printerDraft.printerType === 'system_browser' ? '#8B4A1E' : '#A89689' }}>
                <span>{printerDraft.printerType === 'system_browser' ? '✓ Sedang Dipilih' : 'Pilih Mode Ini'}</span>
              </div>
            </div>

            {/* Opsi 3: Kabel USB Direct */}
            <div
              onClick={() => setPrinterDraft(d => ({ ...d, printerType: 'usb_serial' }))}
              className="p-4 rounded-xl cursor-pointer transition-all flex flex-col justify-between"
              style={{
                background: printerDraft.printerType === 'usb_serial' ? '#FAF6ED' : '#FAFAFA',
                border: printerDraft.printerType === 'usb_serial' ? '2px solid #8B4A1E' : '1px solid #E8D7C0',
              }}
            >
              <div>
                <div className="flex items-center justify-between mb-2">
                  <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: '#8B4A1E15' }}>
                    <Usb size={18} color="#8B4A1E" />
                  </div>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full" style={{ background: '#F0F0F0', color: '#666' }}>
                    Direct COM
                  </span>
                </div>
                <p className="font-bold text-[13px]" style={{ color: '#2B1810' }}>Kabel USB (Web Serial)</p>
                <p className="text-[11px] mt-1 leading-relaxed" style={{ color: '#6B5448' }}>
                  Untuk printer thermal colok kabel USB yang terdeteksi sebagai Virtual COM/Serial port di Windows.
                </p>
              </div>
              <div className="mt-3 pt-2 border-t flex items-center justify-between text-[11px] font-semibold" style={{ borderColor: '#E8D7C0', color: printerDraft.printerType === 'usb_serial' ? '#8B4A1E' : '#A89689' }}>
                <span>{printerDraft.printerType === 'usb_serial' ? '✓ Sedang Dipilih' : 'Pilih Mode Ini'}</span>
              </div>
            </div>
          </div>

          {/* Baris Tombol Aksi Cepat */}
          <div className="mt-4 pt-4 border-t flex flex-wrap items-center gap-2.5" style={{ borderColor: '#E8D7C0' }}>
            {isDirectSerial && !isConnected && (
              <Button
                variant="primary"
                size="sm"
                onClick={handleConnectSerial}
                loading={isConnectingSerial}
                icon={!isConnectingSerial ? <Bluetooth size={14} /> : undefined}
              >
                Hubungkan Printer
              </Button>
            )}

            {isDirectSerial && isConnected && (
              <Button
                variant="secondary"
                size="sm"
                onClick={handleDisconnectSerial}
                icon={<Power size={14} />}
              >
                Putuskan Port
              </Button>
            )}

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
        </div>

        {/* 3. Panduan Petunjuk Menyesuaikan Tipe Koneksi */}
        <div className="rounded-2xl p-5" style={{ background: 'white', border: '1px solid #E8D7C0' }}>
          <h3 className="font-bold text-[14px] mb-2" style={{ color: '#2B1810' }}>
            {isBluetooth
              ? 'Panduan Koneksi Bluetooth SPP untuk RPP02N (Windows)'
              : isUsb
              ? 'Panduan Koneksi Kabel USB (Web Serial)'
              : 'Panduan Menggunakan Driver Sistem (Browser)'}
          </h3>

          {isBluetooth ? (
            <div className="space-y-2.5 mt-3">
              <p className="text-[12px] leading-relaxed" style={{ color: '#6B5448' }}>
                Printer thermal <b>RPP02N 58mm</b> berkomunikasi melalui Bluetooth SPP (Serial Port Profile). Ikuti langkah 1 kali setup ini:
              </p>
              <div className="flex items-start gap-3 p-3 rounded-xl" style={{ background: '#FAF6ED', border: '1px solid #E8D7C0' }}>
                <div className="w-6 h-6 rounded-full bg-[#8B4A1E] text-white text-[11px] font-bold flex items-center justify-center shrink-0 mt-0.5">
                  1
                </div>
                <div className="text-[12px]">
                  <p className="font-bold text-[#2B1810]">Pairing Bluetooth Printer di Windows</p>
                  <p className="text-[#6B5448] mt-0.5">
                    Nyalakan printer RPP02N. Buka menu <b>Windows Settings &gt; Bluetooth &amp; devices</b>. Klik <b>Add device</b> &gt; pilih <b>RPP02N</b>. Jika diminta PIN/Password, masukkan <code>1234</code> atau <code>0000</code>.
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
                    Pada Windows Bluetooth Settings, buka <b>More Bluetooth settings &gt; tab COM Ports</b>. Klik <b>Add</b> &gt; pilih <b>Outgoing</b> &gt; pilih perangkat <b>RPP02N</b> &gt; Service: <b>SPP slave</b> (misal Windows akan menetapkan <b>COM6</b>). Klik OK.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3 p-3 rounded-xl" style={{ background: '#FAF6ED', border: '1px solid #E8D7C0' }}>
                <div className="w-6 h-6 rounded-full bg-[#5B8A2E] text-white text-[11px] font-bold flex items-center justify-center shrink-0 mt-0.5">
                  3
                </div>
                <div className="text-[12px]">
                  <p className="font-bold text-[#2B1810]">Buka Akses di Chrome / Edge</p>
                  <p className="text-[#6B5448] mt-0.5">
                    Klik tombol <b>"Hubungkan Printer"</b> di atas. Di jendela pop-up browser, pilih port COM printer Anda (misal COM6) lalu klik <b>Connect</b>. Sekali izin diberikan, aplikasi akan otomatis menyambung ulang tiap kali kasir dibuka!
                  </p>
                </div>
              </div>
            </div>
          ) : isUsb ? (
            <div className="space-y-2.5 mt-3">
              <p className="text-[12px] leading-relaxed" style={{ color: '#6B5448' }}>
                Gunakan mode ini jika printer Anda dicolok menggunakan kabel USB dan memiliki driver Virtual COM Port:
              </p>
              <div className="flex items-start gap-3 p-3 rounded-xl" style={{ background: '#FAF6ED', border: '1px solid #E8D7C0' }}>
                <div className="w-6 h-6 rounded-full bg-[#8B4A1E] text-white text-[11px] font-bold flex items-center justify-center shrink-0 mt-0.5">
                  1
                </div>
                <div className="text-[12px]">
                  <p className="font-bold text-[#2B1810]">Colok Kabel USB ke Laptop Kasir</p>
                  <p className="text-[#6B5448] mt-0.5">Pastikan lampu indikator printer menyala dan kertas terpasang.</p>
                </div>
              </div>

              <div className="flex items-start gap-3 p-3 rounded-xl" style={{ background: '#FAF6ED', border: '1px solid #E8D7C0' }}>
                <div className="w-6 h-6 rounded-full bg-[#5B8A2E] text-white text-[11px] font-bold flex items-center justify-center shrink-0 mt-0.5">
                  2
                </div>
                <div className="text-[12px]">
                  <p className="font-bold text-[#2B1810]">Beri Akses Port USB</p>
                  <p className="text-[#6B5448] mt-0.5">Klik tombol <b>"Hubungkan Printer"</b> lalu pilih port USB yang muncul di pop-up browser.</p>
                </div>
              </div>
            </div>
          ) : (
            <div className="space-y-2.5 mt-3">
              <p className="text-[12px] leading-relaxed" style={{ color: '#6B5448' }}>
                Mode Driver Sistem menggunakan spooler cetak standar {device.os}:
              </p>
              <div className="flex items-start gap-3 p-3 rounded-xl" style={{ background: '#FAF6ED', border: '1px solid #E8D7C0' }}>
                <div className="w-6 h-6 rounded-full bg-[#8B4A1E] text-white text-[11px] font-bold flex items-center justify-center shrink-0 mt-0.5">
                  1
                </div>
                <div className="text-[12px]">
                  <p className="font-bold text-[#2B1810]">Sambungkan Printer ke Komputer</p>
                  <p className="text-[#6B5448] mt-0.5">Pastikan printer sudah terinstal di Windows/OS sebagai printer sistem.</p>
                </div>
              </div>

              <div className="flex items-start gap-3 p-3 rounded-xl" style={{ background: '#FAF6ED', border: '1px solid #E8D7C0' }}>
                <div className="w-6 h-6 rounded-full bg-[#8B4A1E] text-white text-[11px] font-bold flex items-center justify-center shrink-0 mt-0.5">
                  2
                </div>
                <div className="text-[12px]">
                  <p className="font-bold text-[#2B1810]">Klik "Cetak Halaman Uji"</p>
                  <p className="text-[#6B5448] mt-0.5">Jendela dialog cetak akan terbuka. Pilih nama printer kasir Anda pada kolom <b>Destination</b>.</p>
                </div>
              </div>

              <div className="flex items-start gap-3 p-3 rounded-xl" style={{ background: '#FAF6ED', border: '1px solid #E8D7C0' }}>
                <div className="w-6 h-6 rounded-full bg-[#5B8A2E] text-white text-[11px] font-bold flex items-center justify-center shrink-0 mt-0.5">
                  3
                </div>
                <div className="text-[12px]">
                  <p className="font-bold text-[#2B1810]">Selesai</p>
                  <p className="text-[#6B5448] mt-0.5">Klik Print. Browser otomatis mengingat printer untuk transaksi kasir berikutnya.</p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* 4. Format Ukuran Kertas Thermal */}
        <div className="rounded-2xl p-5" style={{ background: 'white', border: '1px solid #E8D7C0' }}>
          <h3 className="font-bold text-[14px] mb-3" style={{ color: '#2B1810' }}>Format Ukuran Kertas Thermal</h3>
          <div>
            <label className="block text-[11px] font-bold mb-1.5" style={{ color: '#6B5448', letterSpacing: '0.06em' }}>
              LEBAR KERTAS ROLL (PAPER SIZE)
            </label>
            <select
              value={printerDraft.paperWidth}
              onChange={e => setPrinterDraft(d => ({ ...d, paperWidth: e.target.value as any }))}
              className="w-full px-4 py-2.5 rounded-xl text-[13px] font-semibold outline-none"
              style={{ background: '#F3E7CE', border: '1.5px solid #E8D7C0', color: '#2B1810' }}
            >
              <option value="58mm">58 mm (Roll Mini Thermal / 32 Kolom Teks - Rekomendasi RPP02N)</option>
              <option value="80mm">80 mm (Roll Standar POS Kasir / 42 Kolom Teks)</option>
              <option value="auto">Otomatis (Adaptif sesuai layar perangkat)</option>
            </select>
            <p className="text-[11px] mt-1.5" style={{ color: '#C49A62' }}>
              Untuk printer RPP02N, pilih <b>58 mm</b> agar tata letak struk pas dan rapi tanpa terpotong.
            </p>
          </div>
        </div>

        {/* 5. Otomatisasi Kasir & Perangkat Keras */}
        <div className="rounded-2xl p-5" style={{ background: 'white', border: '1px solid #E8D7C0' }}>
          <h3 className="font-bold text-[14px] mb-3" style={{ color: '#2B1810' }}>Otomatisasi Kasir &amp; Perangkat</h3>
          <div className="space-y-3">
            {/* Auto-print */}
            <div className="flex items-center justify-between p-3.5 rounded-xl" style={{ background: '#FAF6ED' }}>
              <div>
                <p className="font-semibold text-[13px]" style={{ color: '#2B1810' }}>Cetak Otomatis Setelah Pembayaran</p>
                <p className="text-[11px]" style={{ color: '#6B5448' }}>Memicu pencetakan struk seketika saat kasir menyelesaikan pembayaran.</p>
              </div>
              <button
                type="button"
                onClick={() => setPrinterDraft(d => ({ ...d, autoPrintOnCheckout: !d.autoPrintOnCheckout }))}
                style={{ color: printerDraft.autoPrintOnCheckout ? '#5B8A2E' : '#C49A62' }}
              >
                {printerDraft.autoPrintOnCheckout ? <ToggleRight size={32} /> : <ToggleLeft size={32} />}
              </button>
            </div>

            {/* Auto-cut */}
            <div className="flex items-center justify-between p-3.5 rounded-xl" style={{ background: '#FAF6ED' }}>
              <div>
                <p className="font-semibold text-[13px]" style={{ color: '#2B1810' }}>Potong Kertas Otomatis (Auto-Cut)</p>
                <p className="text-[11px]" style={{ color: '#6B5448' }}>Kirim sinyal GS V pemotong kertas setelah selesai mencetak (khusus printer dengan pisau potong fisik).</p>
              </div>
              <button
                type="button"
                onClick={() => setPrinterDraft(d => ({ ...d, autoCut: !d.autoCut }))}
                style={{ color: printerDraft.autoCut ? '#5B8A2E' : '#C49A62' }}
              >
                {printerDraft.autoCut ? <ToggleRight size={32} /> : <ToggleLeft size={32} />}
              </button>
            </div>

            {/* Cash Drawer */}
            <div className="flex items-center justify-between p-3.5 rounded-xl" style={{ background: '#FAF6ED' }}>
              <div>
                <p className="font-semibold text-[13px]" style={{ color: '#2B1810' }}>Buka Laci Kasir Otomatis (Cash Drawer Kick)</p>
                <p className="text-[11px]" style={{ color: '#6B5448' }}>Kirim pulsa getar ESC p ke laci kasir lewat port RJ11 printer saat pembayaran tunai selesai.</p>
              </div>
              <button
                type="button"
                onClick={() => setPrinterDraft(d => ({ ...d, openCashDrawer: !d.openCashDrawer }))}
                style={{ color: printerDraft.openCashDrawer ? '#5B8A2E' : '#C49A62' }}
              >
                {printerDraft.openCashDrawer ? <ToggleRight size={32} /> : <ToggleLeft size={32} />}
              </button>
            </div>
          </div>
        </div>

        {/* 6. Pengaturan Lanjutan Buffer Bluetooth (ESC/POS) */}
        {isDirectSerial && (
          <div className="rounded-2xl p-5" style={{ background: 'white', border: '1px solid #E8D7C0' }}>
            <div
              className="flex items-center justify-between cursor-pointer"
              onClick={() => setShowAdvancedPrinter(!showAdvancedPrinter)}
            >
              <div>
                <h3 className="font-bold text-[14px]" style={{ color: '#2B1810' }}>Pengaturan Lanjutan Buffer Bluetooth (ESC/POS)</h3>
                <p className="text-[11px] mt-0.5" style={{ color: '#6B5448' }}>
                  Kontrol chunking data agar printer mini RPP02N tidak mengalami buffer overrun / macet.
                </p>
              </div>
              <button type="button" className="p-1 rounded-lg hover:bg-black/5" style={{ color: '#8B4A1E' }}>
                {showAdvancedPrinter ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
              </button>
            </div>

            {showAdvancedPrinter && (
              <div className="mt-4 pt-4 border-t space-y-4" style={{ borderColor: '#E8D7C0' }}>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[11px] font-bold mb-1.5" style={{ color: '#6B5448' }}>
                      UKURAN PAKET DATA (CHUNK SIZE)
                    </label>
                    <select
                      value={printerDraft.chunkSize || 256}
                      onChange={e => setPrinterDraft(d => ({ ...d, chunkSize: Number(e.target.value) }))}
                      className="w-full px-4 py-2.5 rounded-xl text-[13px] font-semibold outline-none"
                      style={{ background: '#F3E7CE', border: '1.5px solid #E8D7C0', color: '#2B1810' }}
                    >
                      <option value="64">64 Byte (Sangat Aman / Lebih Lambat)</option>
                      <option value="128">128 Byte (Aman)</option>
                      <option value="256">256 Byte (Standar Rekomendasi RPP02N)</option>
                      <option value="512">512 Byte (Cepat / Buffer Besar)</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold mb-1.5" style={{ color: '#6B5448' }}>
                      JEDA ANTAR PAKET (CHUNK DELAY)
                    </label>
                    <select
                      value={printerDraft.chunkDelayMs || 30}
                      onChange={e => setPrinterDraft(d => ({ ...d, chunkDelayMs: Number(e.target.value) }))}
                      className="w-full px-4 py-2.5 rounded-xl text-[13px] font-semibold outline-none"
                      style={{ background: '#F3E7CE', border: '1.5px solid #E8D7C0', color: '#2B1810' }}
                    >
                      <option value="10">10 ms (Cepat)</option>
                      <option value="20">20 ms</option>
                      <option value="30">30 ms (Standar Rekomendasi RPP02N)</option>
                      <option value="50">50 ms (Ekstra Aman)</option>
                      <option value="100">100 ms</option>
                    </select>
                  </div>
                </div>

                <div className="p-3 rounded-xl text-[11px] leading-relaxed" style={{ background: '#FAF6ED', color: '#6B5448' }}>
                  <b>💡 Info Teknis:</b> Bluetooth SPP pada printer 58mm umumnya memiliki kapasitas buffer terbatas (~1-2 KB). Mengirim data terbagi per paket 256 byte dengan jeda 30 ms memastikan printer memiliki waktu untuk membakar kertas tanpa ada byte yang hilang atau terpotong.
                </div>
              </div>
            )}
          </div>
        )}

        {/* 7. Tombol Simpan Pengaturan */}
        <Button
          onClick={() => {
            savePrinterSettings(printerDraft)
            showToast({
              variant: 'success',
              title: 'Pengaturan Printer Disimpan',
              description: `Tipe: ${printerDraft.printerType === 'bluetooth_serial' ? 'Bluetooth SPP' : printerDraft.printerType === 'usb_serial' ? 'USB Serial' : 'Driver Sistem'}, Kertas: ${printerDraft.paperWidth}`,
            })
          }}
          size="lg"
          fullWidth
        >
          Simpan Pengaturan Printer
        </Button>
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
                  className="flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-left transition-colors"
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
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[12px] font-bold whitespace-nowrap shrink-0 transition-colors"
              style={{ background: isActive ? '#2B1810' : '#F3E7CE', color: isActive ? '#F3E7CE' : '#6B5448' }}
            >
              <Icon size={13} />
              {tab.label}
            </button>
          )
        })}
      </div>
      <div className="px-3.5 md:px-6 py-4 md:py-5 pb-32">
        {activeTab === 'pajak' && PajakTab()}
        {activeTab === 'struk' && StrukTab()}
        {activeTab === 'printer' && PrinterTab()}
        {activeTab === 'integrasi' && IntegrasiTab()}
        {activeTab !== 'pajak' && activeTab !== 'struk' && activeTab !== 'printer' && activeTab !== 'integrasi' && GenericTab({ id: activeTab })}
      </div>
    </PageShell>
    </>
  )
}
