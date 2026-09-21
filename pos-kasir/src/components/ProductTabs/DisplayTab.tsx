import { useRef, useState } from 'react'
import { Upload, Loader2 } from 'lucide-react'
import { type Product } from '../../context/AppContext'
import { gasApi } from '../../services/gasApi'

interface Props {
  form: Omit<Product, 'id'>
  setField: <K extends keyof Omit<Product, 'id'>>(k: K, v: Omit<Product, 'id'>[K]) => void
  outletsList: Array<{ id: string; name: string }>
  addToast: (variant: 'destructive' | 'warning', title: string, description?: string) => void
}

const inputStyle = { background: 'white', border: '1.5px solid #E8D7C0', color: '#2B1810' } as const
const focusBorder = (e: React.FocusEvent<HTMLInputElement>) => { e.currentTarget.style.borderColor = '#8B4A1E' }
const blurBorder = (e: React.FocusEvent<HTMLInputElement>) => { e.currentTarget.style.borderColor = '#E8D7C0' }

export default function DisplayTab({ form, setField, outletsList, addToast }: Props) {
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [isUploading, setIsUploading] = useState(false)

  return (
    <div className="space-y-4">
      {/* Photo */}
      <div className="flex items-start gap-4">
        <div className="shrink-0 w-20 h-20 rounded-2xl overflow-hidden relative" style={{ border: '2px solid #E8D7C0', background: '#F3E7CE' }}>
          {isUploading ? (
            <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/50 gap-1.5 px-1 text-center">
              <Loader2 className="animate-spin text-white" size={20} />
              <p className="text-[8px] font-bold text-white leading-tight">Mengunggah foto menu ke Google Drive...</p>
            </div>
          ) : (
            <img src={form.img || 'https://ui-avatars.com/api/?name=Pr&background=F3E7CE&color=8B4A1E'} alt="" className="w-full h-full object-cover" />
          )}
        </div>
        <div className="flex-1">
          <label className="block text-[11px] font-bold mb-1.5" style={{ color: '#6B5448', letterSpacing: '0.06em' }}>FOTO PRODUK</label>
          
          <div className="flex gap-2">
            <input value={form.img || ''} onChange={e => setField('img', e.target.value)}
              className="flex-1 px-3 py-2 rounded-xl text-[13px] outline-none"
              style={inputStyle} onFocus={focusBorder} onBlur={blurBorder}
              placeholder="Atau paste URL dari internet..." />
            
            <input type="file" accept="image/*" className="hidden" ref={fileInputRef} 
              onChange={async (e) => {
                const file = e.target.files?.[0]
                if (!file) return
                if (file.size > 2 * 1024 * 1024) {
                  addToast('warning', 'Ukuran foto maksimal 2MB', 'Silakan pilih gambar yang lebih kecil.')
                  return
                }
                setIsUploading(true)
                try {
                  let customName = file.name
                  if (form.name && form.name.trim()) {
                    const ext = file.name.split('.').pop()
                    customName = `${form.name.trim()}.${ext}`
                  }
                  const url = await gasApi.uploadImage(file, customName)
                  setField('img', url)
                } catch (err) {
                  addToast('destructive', 'Gagal mengupload gambar', err instanceof Error ? err.message : String(err))
                } finally {
                  setIsUploading(false)
                  if (fileInputRef.current) fileInputRef.current.value = ''
                }
              }} />
            
            <button type="button" disabled={isUploading} onClick={() => fileInputRef.current?.click()}
              className="shrink-0 px-4 py-2 rounded-xl text-[13px] font-bold flex items-center gap-2 transition-colors disabled:opacity-50"
              style={{ background: '#F3E7CE', color: '#8B4A1E' }}>
              <Upload size={16} />
              Upload
            </button>
          </div>
        </div>
      </div>

      {/* Outlets */}
      <div className="rounded-2xl p-4" style={{ background: 'white', border: '1px solid #E8D7C0' }}>
        <label className="block text-[11px] font-bold mb-3" style={{ color: '#6B5448' }}>TERSEDIA DI CABANG</label>
        <div className="space-y-3">
          <label className="flex items-center gap-2 cursor-pointer">
            <input type="radio" name="outletsType" checked={form.outlets === 'all' || !form.outlets} onChange={() => setField('outlets', 'all')} className="accent-[#8B4A1E]" />
            <span className="text-[13px] font-bold" style={{ color: '#2B1810' }}>Semua Cabang</span>
          </label>
          <label className="flex items-center gap-2 cursor-pointer">
            <input type="radio" name="outletsType" checked={Array.isArray(form.outlets)} onChange={() => setField('outlets', outletsList.map(o => o.id))} className="accent-[#8B4A1E]" />
            <span className="text-[13px] font-bold" style={{ color: '#2B1810' }}>Cabang Tertentu</span>
          </label>

          {Array.isArray(form.outlets) && (
            <div className="pl-6 grid grid-cols-2 gap-2 mt-2">
              {outletsList.map(o => {
                const isChecked = (form.outlets as string[]).includes(o.id)
                return (
                  <label key={o.id} className="flex items-center gap-2 cursor-pointer p-2 rounded-xl" style={{ background: isChecked ? '#F3E7CE' : 'white', border: '1px solid #E8D7C0' }}>
                    <input
                      type="checkbox"
                      checked={isChecked}
                      onChange={(e) => {
                        const current = (form.outlets as string[]) || []
                        const next = e.target.checked ? [...current, o.id] : current.filter(id => id !== o.id)
                        setField('outlets', next.length === 0 ? 'all' : next)
                      }}
                      className="accent-[#8B4A1E]"
                    />
                    <span className="text-[12px] font-bold" style={{ color: '#2B1810' }}>{o.name.replace('Hasuka Dimsum — ', '')}</span>
                  </label>
                )
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
