import { type Product } from '../../context/AppContext'

interface Props {
  form: Omit<Product, 'id'>
  setField: <K extends keyof Omit<Product, 'id'>>(k: K, v: Omit<Product, 'id'>[K]) => void
}

export default function PromoTab({ form, setField }: Props) {
  return (
    <div className="space-y-4">
      <div className="rounded-2xl p-4" style={{ background: 'white', border: '1px solid #E8D7C0' }}>
        <div className="flex items-center justify-between mb-3">
          <div>
            <p className="font-bold text-[14px]" style={{ color: '#2B1810' }}>Produk Promo</p>
            <p className="text-[12px]" style={{ color: '#6B5448' }}>Tampilkan badge promo & harga coret</p>
          </div>
          <button onClick={() => setField('promo', !form.promo)} className="transition-all">
            <div className="w-12 h-6 rounded-full relative transition-colors" style={{ background: form.promo ? '#5B8A2E' : '#C49A62' }}>
              <div className="w-5 h-5 bg-white rounded-full absolute top-0.5 transition-all" style={{ left: form.promo ? '26px' : '2px' }} />
            </div>
          </button>
        </div>
        {form.promo && (
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[11px] font-bold mb-1.5" style={{ color: '#6B5448', letterSpacing: '0.06em' }}>TEKS PROMO (mis. "25%")</label>
              <input
                value={form.promoText || ''}
                onChange={e => setField('promoText', e.target.value)}
                className="w-full px-3 py-2 rounded-xl text-[13px] outline-none"
                style={{ background: '#F3E7CE', border: '1px solid #E8D7C0', color: '#2B1810' }}
                placeholder="25%"
              />
            </div>
            <div>
              <label className="block text-[11px] font-bold mb-1.5" style={{ color: '#6B5448', letterSpacing: '0.06em' }}>HARGA NORMAL (Rp)</label>
              <input
                type="number"
                value={form.originalPrice || ''}
                onChange={e => setField('originalPrice', parseInt(e.target.value) || undefined)}
                className="w-full px-3 py-2 rounded-xl text-[13px] outline-none"
                style={{ background: '#F3E7CE', border: '1px solid #E8D7C0', color: '#2B1810' }}
              />
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
