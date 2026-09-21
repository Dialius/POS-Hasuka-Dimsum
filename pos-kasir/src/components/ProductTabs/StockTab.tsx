import { type Product } from '../../context/AppContext'

interface Props {
  form: Omit<Product, 'id'>
  setField: <K extends keyof Omit<Product, 'id'>>(k: K, v: Omit<Product, 'id'>[K]) => void
}

const inputStyle = { background: 'white', border: '1.5px solid #E8D7C0', color: '#2B1810' } as const
const focusBorder = (e: React.FocusEvent<HTMLInputElement>) => { e.currentTarget.style.borderColor = '#8B4A1E' }
const blurBorder = (e: React.FocusEvent<HTMLInputElement>) => { e.currentTarget.style.borderColor = '#E8D7C0' }

export default function StockTab({ form, setField }: Props) {
  return (
    <div className="space-y-4">
      <div className="rounded-2xl p-4" style={{ background: 'white', border: '1px solid #E8D7C0' }}>
        <p className="font-bold text-[14px] mb-1" style={{ color: '#2B1810' }}>Mode Stok</p>
        <p className="text-[12px] mb-3" style={{ color: '#6B5448' }}>
          Pilih <b>Resep</b> untuk menu yang bahan bakunya dipotong otomatis via Kelola Resep. Pilih <b>Langsung</b> untuk produk yang stoknya dikelola sendiri (mis. minuman botol).
        </p>
        <div className="flex gap-2">
          {(['recipe', 'direct'] as const).map(mode => (
            <button key={mode} onClick={() => setField('stock_mode', mode)}
              className="flex-1 py-2.5 rounded-xl font-bold text-[13px] transition-colors"
              style={{
                background: form.stock_mode === mode ? '#8B4A1E' : '#F3E7CE',
                color: form.stock_mode === mode ? 'white' : '#6B5448',
                border: `1.5px solid ${form.stock_mode === mode ? '#8B4A1E' : '#E8D7C0'}`,
              }}>
              {mode === 'recipe' ? '🍜 Berbasis Resep' : '📦 Stok Langsung'}
            </button>
          ))}
        </div>

        {/* Direct stock fields */}
        {form.stock_mode === 'direct' && (
          <div className="grid grid-cols-2 gap-3 mt-3">
            {([['STOK SAAT INI', 'stock'], ['STOK MINIMUM', 'minStock']] as const).map(([label, key]) => (
              <div key={key}>
                <label className="block text-[11px] font-bold mb-1.5" style={{ color: '#6B5448', letterSpacing: '0.06em' }}>{label}</label>
                <input
                  type="number"
                  value={form[key] || ''}
                  onChange={e => setField(key, parseInt(e.target.value) || 0)}
                  className="w-full px-4 py-3 rounded-xl text-[14px] outline-none"
                  style={inputStyle}
                  onFocus={focusBorder}
                  onBlur={blurBorder}
                />
              </div>
            ))}
          </div>
        )}

        {form.stock_mode === 'recipe' && (
          <p className="text-[11px] mt-3 px-1" style={{ color: '#C49A62' }}>
            Stok bahan baku diatur di halaman <b>Kelola Resep</b> — atur resep produk ini setelah disimpan.
          </p>
        )}
      </div>
    </div>
  )
}
