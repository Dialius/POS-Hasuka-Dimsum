import { useState, useRef } from 'react'
import { Printer, Home, Percent, Link2, ToggleLeft, ToggleRight, FileText, UploadCloud, Loader2 } from 'lucide-react'
import PageShell from './PageShell'
import { useApp } from '../context/AppContext'
import { gasApi } from '../services/gasApi'
import { generateReceiptString } from '../utils/receiptPrinter'
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
  const { taxRate, setTaxRate, serviceRate, setServiceRate, receiptSettings, setReceiptSettings, outlet, refreshData } = useApp()
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

  const handleUploadLogo = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    if (file.size > 2 * 1024 * 1024) {
      showToast({ variant: 'warning', title: 'Ukuran foto maksimal 2MB', description: 'Silakan pilih gambar yang lebih kecil.' })
      return
    }
    setIsUploadingLogo(true)
    try {
      const ext = file.name.split('.').pop()
      const customName = `logo-hasuka.${ext}`
      const url = await gasApi.uploadImage(file, customName, true)
      setReceiptDraft(prev => ({ ...prev, logoUrl: url }))
    } catch (err) {
      showToast({ variant: 'destructive', title: 'Gagal mengupload logo', description: err instanceof Error ? err.message : String(err) })
    } finally {
      setIsUploadingLogo(false)
      if (fileInputRef.current) fileInputRef.current.value = ''
    }
  }

  const handleSaveSettings = async (settingsToSave: Record<string, string>, successTitle: string, callback: () => void) => {
    setIsSaving(true)
    try {
      const res = await gasApi.saveSettings(settingsToSave)
      if (res.status === 'success') {
        callback()
        showToast({ variant: 'success', title: successTitle })
      } else {
        showToast({ variant: 'destructive', title: 'Gagal menyimpan pengaturan', description: res.message || 'Error unknown' })
      }
    } catch (e) {
      showToast({ variant: 'destructive', title: 'Gagal menyimpan pengaturan', description: 'Periksa koneksi internet Anda lalu coba lagi.' })
    } finally {
      setIsSaving(false)
    }
  }

  const saveRates = () => {
    const finalTax = isPajakActive ? pajakRate : 0;
    handleSaveSettings(
      {
        tax_rate: finalTax.toString(),
        service_rate: serviceCharge.toString()
      },
      'Pengaturan pajak berhasil disimpan',
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
          <Toggle on={isPajakActive} onToggle={() => setIsPajakActive(!isPajakActive)} label="Aktifkan pajak PPN" />
        </div>

        {isPajakActive && (
          <div>
            <label className="block text-[11px] font-bold mb-8" style={{ color: '#6B5448', letterSpacing: '0.06em' }}>TARIF PPN (%)</label>
            <div className="flex gap-8 mb-8">
              {[0, 5, 10, 11, 12].map(r => (
                <button key={r} onClick={() => { setPajakRate(r); setCustomPajakInput('') }}
                  className="flex-1 py-2 rounded-xl font-bold text-[13px] transition-colors"
                  style={{ background: pajakRate === r && !customPajakInput ? '#8B4A1E' : 'white', color: pajakRate === r && !customPajakInput ? 'white' : '#6B5448', border: pajakRate === r && !customPajakInput ? '1px solid #8B4A1E' : '1px solid #E8D7C0' }}>
                  {r}%
                </button>
              ))}
            </div>
            <div className="relative">
              <input type="number" value={customPajakInput} min={0} max={100}
                onChange={e => { setCustomPajakInput(e.target.value); if (e.target.value) setPajakRate(parseFloat(e.target.value) || 0) }}
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
            <p className="text-[12px]" style={{ color: '#6B5448' }}>Service charge untuk makan di tempat</p>
          </div>
          <Toggle on={serviceCharge > 0} onToggle={() => setServiceCharge(prev => prev > 0 ? 0 : 5)} label="Aktifkan biaya layanan" />
        </div>
        {serviceCharge > 0 && (
          <div>
            <label className="block text-[11px] font-bold mb-8" style={{ color: '#6B5448', letterSpacing: '0.06em' }}>TARIF BIAYA LAYANAN (%)</label>
            <div className="flex gap-8 mb-8">
              {[5, 10, 15].map(r => (
                <button key={r} onClick={() => { setServiceCharge(r); setCustomServiceInput('') }}
                  className="flex-1 py-2 rounded-xl font-bold text-[13px] transition-colors"
                  style={{ background: serviceCharge === r && !customServiceInput ? '#8B4A1E' : 'white', color: serviceCharge === r && !customServiceInput ? 'white' : '#6B5448', border: serviceCharge === r && !customServiceInput ? '1px solid #8B4A1E' : '1px solid #E8D7C0' }}>
                  {r}%
                </button>
              ))}
            </div>
            <div className="relative">
              <input type="number" value={customServiceInput} min={0} max={100}
                onChange={e => { setCustomServiceInput(e.target.value); if (e.target.value) setServiceCharge(parseFloat(e.target.value) || 0) }}
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
        Simpan Pengaturan Pajak
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
                <img src={receiptDraft.logoUrl} className="w-full h-full object-contain" alt="Logo" />
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
              <img src={receiptDraft.logoUrl} alt="Logo" className="w-16 h-16 object-contain mb-2 mix-blend-multiply grayscale" />
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
        <div className="py-4 px-3 hidden sm:block">
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
      <div className="sm:hidden px-16 py-8 flex gap-8 overflow-x-auto scrollbar-hide border-b" style={{ borderColor: '#E8D7C0', background: 'white' }}>
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
      <div className="px-4 sm:px-6 py-4 sm:py-5">
        {activeTab === 'pajak' && PajakTab()}
        {activeTab === 'struk' && StrukTab()}
        {activeTab === 'integrasi' && IntegrasiTab()}
        {activeTab !== 'pajak' && activeTab !== 'struk' && activeTab !== 'integrasi' && GenericTab({ id: activeTab })}
      </div>
    </PageShell>
    </>
  )
}
