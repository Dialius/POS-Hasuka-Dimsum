import { useState } from 'react'
import { Minus, Plus, Search, Wifi, WifiOff, ChevronRight, Menu as MenuIcon, X, Store, BarChart2, Package, Tag, ClipboardList, Wallet, QrCode, Settings, LogOut } from 'lucide-react'
import PaymentModal from './PaymentModal'

// ─── Data ────────────────────────────────────────────────────────────────────

const CATEGORIES = [
  { id: 'semua', label: 'Semua', icon: CategoryIconSemua },
  { id: 'kukus', label: 'Kukus', icon: CategoryIconKukus },
  { id: 'goreng', label: 'Goreng', icon: CategoryIconGoreng },
  { id: 'minuman', label: 'Minuman', icon: CategoryIconMinuman },
  { id: 'snack', label: 'Snack', icon: CategoryIconSnack },
  { id: 'paket', label: 'Paket', icon: CategoryIconPaket },
]

const PRODUCTS = [
  { id: 1, name: 'Siao May Ayam Udang (Isi 3)', cat: 'kukus', price: 24000, stock: 10, promo: false, img: 'https://images.unsplash.com/photo-1563245372-f21724e3856d?auto=format&fit=crop&q=80&w=120' },
  { id: 2, name: 'Hakau Udang Garing (Isi 3)', cat: 'kukus', price: 21000, originalPrice: 28000, stock: 5, promo: true, promoText: '25%', img: 'https://images.unsplash.com/photo-1496116218417-1a781b1c416c?auto=format&fit=crop&q=80&w=120' },
  { id: 3, name: 'Bakpao Durian Pasir Emas', cat: 'kukus', price: 26000, stock: 0, promo: false, img: 'https://images.unsplash.com/photo-1577906096429-f73c2c312435?auto=format&fit=crop&q=80&w=120' },
  { id: 4, name: 'Lumpia Kulit Tahu Goreng', cat: 'goreng', price: 23000, stock: 12, promo: false, img: 'https://images.unsplash.com/photo-1563245372-f21724e3856d?auto=format&fit=crop&q=80&w=120' },
  { id: 5, name: 'Ceker Ayam Saus Szechuan', cat: 'goreng', price: 19500, stock: 10, promo: false, img: 'https://images.unsplash.com/photo-1563245372-f21724e3856d?auto=format&fit=crop&q=80&w=120' },
  { id: 6, name: 'Tahu Crispy Isi Udang', cat: 'goreng', price: 17000, stock: 8, promo: false, img: 'https://images.unsplash.com/photo-1563245372-f21724e3856d?auto=format&fit=crop&q=80&w=120' },
  { id: 7, name: 'Teh Liang Dingin Manis', cat: 'minuman', price: 8000, stock: 20, promo: false, img: 'https://images.unsplash.com/photo-1556679343-c7306c1976bc?auto=format&fit=crop&q=80&w=120' },
  { id: 8, name: 'Es Jeruk Peras Segar', cat: 'minuman', price: 10000, stock: 15, promo: false, img: 'https://images.unsplash.com/photo-1613478223719-2ab802602423?auto=format&fit=crop&q=80&w=120' },
  { id: 9, name: 'Kopi Susu Aren', cat: 'minuman', price: 14000, stock: 12, promo: false, img: 'https://images.unsplash.com/photo-1461023058943-07fcbe16d735?auto=format&fit=crop&q=80&w=120' },
  { id: 10, name: 'Onde-Onde Kacang Hijau', cat: 'snack', price: 7000, stock: 30, promo: false, img: 'https://images.unsplash.com/photo-1563245372-f21724e3856d?auto=format&fit=crop&q=80&w=120' },
]

// ─── Category SVG Icons (custom, not Lucide) ─────────────────────────────────

function CategoryIconSemua({ active }: { active: boolean }) {
  const c = active ? '#2B1810' : '#C49A62'
  return (
    <svg width="22" height="22" viewBox="0 0 22 22" fill="none">
      <rect x="2" y="2" width="8" height="8" rx="2" fill={c} />
      <rect x="12" y="2" width="8" height="8" rx="2" fill={c} opacity="0.6" />
      <rect x="2" y="12" width="8" height="8" rx="2" fill={c} opacity="0.6" />
      <rect x="12" y="12" width="8" height="8" rx="2" fill={c} opacity="0.3" />
    </svg>
  )
}

function CategoryIconKukus({ active }: { active: boolean }) {
  const c = active ? '#2B1810' : '#C49A62'
  return (
    <svg width="22" height="22" viewBox="0 0 22 22" fill="none">
      {/* Bamboo steamer basket */}
      <ellipse cx="11" cy="16" rx="8" ry="4" stroke={c} strokeWidth="1.8" fill="none" />
      <path d="M3 16 Q3 11 11 11 Q19 11 19 16" stroke={c} strokeWidth="1.8" fill="none" />
      <path d="M6 11 Q6 7 11 7 Q16 7 16 11" stroke={c} strokeWidth="1.4" fill="none" />
      {/* Steam lines */}
      <path d="M8 6 Q8.5 4.5 8 3" stroke={c} strokeWidth="1.2" strokeLinecap="round" opacity="0.7"/>
      <path d="M11 5 Q11.5 3.5 11 2" stroke={c} strokeWidth="1.2" strokeLinecap="round" opacity="0.7"/>
      <path d="M14 6 Q14.5 4.5 14 3" stroke={c} strokeWidth="1.2" strokeLinecap="round" opacity="0.7"/>
    </svg>
  )
}

function CategoryIconGoreng({ active }: { active: boolean }) {
  const c = active ? '#2B1810' : '#C49A62'
  return (
    <svg width="22" height="22" viewBox="0 0 22 22" fill="none">
      {/* Flame */}
      <path d="M11 19C7.5 19 5 16.5 5 13.5C5 10 8 8 8 5C8 5 9 7 9 8.5C9 8.5 11 6 10 3C10 3 14 5 14 9C14 9 15.5 8 15 6C15 6 18 8.5 18 13.5C18 16.5 14.5 19 11 19Z" stroke={c} strokeWidth="1.6" fill="none" strokeLinejoin="round" />
      <path d="M11 19C9.5 19 8.5 17.5 8.5 16C8.5 14 10 13 10 11.5C10 11.5 11.5 13 11.5 14.5C11.5 14.5 13 13.5 12.5 12C12.5 12 14 13.5 14 16C14 17.5 12.5 19 11 19Z" fill={c} opacity="0.4" />
    </svg>
  )
}

function CategoryIconMinuman({ active }: { active: boolean }) {
  const c = active ? '#2B1810' : '#C49A62'
  return (
    <svg width="22" height="22" viewBox="0 0 22 22" fill="none">
      {/* Cup with straw */}
      <path d="M6 7H16L14.5 18H7.5L6 7Z" stroke={c} strokeWidth="1.7" fill="none" strokeLinejoin="round" />
      <line x1="5" y1="7" x2="17" y2="7" stroke={c} strokeWidth="1.7" strokeLinecap="round" />
      {/* Straw */}
      <line x1="13" y1="4" x2="11" y2="18" stroke={c} strokeWidth="1.4" strokeLinecap="round" />
      {/* Ice/liquid */}
      <path d="M8 11 Q11 10 14 11" stroke={c} strokeWidth="1" opacity="0.5" />
    </svg>
  )
}

function CategoryIconSnack({ active }: { active: boolean }) {
  const c = active ? '#2B1810' : '#C49A62'
  return (
    <svg width="22" height="22" viewBox="0 0 22 22" fill="none">
      {/* Circular dumpling/onde */}
      <circle cx="11" cy="11" r="7" stroke={c} strokeWidth="1.7" fill="none" />
      <path d="M8 11 Q11 8 14 11 Q11 14 8 11Z" fill={c} opacity="0.4" />
      <circle cx="11" cy="11" r="2" fill={c} opacity="0.7" />
    </svg>
  )
}

function CategoryIconPaket({ active }: { active: boolean }) {
  const c = active ? '#2B1810' : '#C49A62'
  return (
    <svg width="22" height="22" viewBox="0 0 22 22" fill="none">
      {/* Box/package */}
      <path d="M4 8L11 4L18 8V16L11 20L4 16V8Z" stroke={c} strokeWidth="1.7" fill="none" strokeLinejoin="round" />
      <path d="M4 8L11 12M11 12L18 8M11 12V20" stroke={c} strokeWidth="1.4" />
      <path d="M7.5 6L14.5 10" stroke={c} strokeWidth="1.2" opacity="0.5" />
    </svg>
  )
}

// ─── Formatters ───────────────────────────────────────────────────────────────

const fmt = (n: number) => `Rp ${n.toLocaleString('id-ID')}`

// ─── Cart Types ───────────────────────────────────────────────────────────────

type CartItem = { id: number; name: string; price: number; qty: number; promo: boolean }

// ─── Main Component ───────────────────────────────────────────────────────────

export default function CheckoutScreen({ onSuccess, onNavigate }: { onSuccess: () => void, onNavigate?: (screen: any) => void }) {
  const [activeCat, setActiveCat] = useState('semua')
  const [search, setSearch] = useState('')
  const [cart, setCart] = useState<CartItem[]>([
    { id: 1, name: 'Siao May Ayam Udang (Isi 3)', price: 24000, qty: 2, promo: false },
    { id: 2, name: 'Hakau Udang Garing (Isi 3)', price: 21000, qty: 1, promo: true },
    { id: 5, name: 'Ceker Ayam Saus Szechuan', price: 19500, qty: 1, promo: false },
  ])
  const [isPaymentOpen, setIsPaymentOpen] = useState(false)
  const [isNavOpen, setIsNavOpen] = useState(false)
  const [isOnline] = useState(true)

  // ── Cart helpers ─────────────────────────────────────────────────────────
  const addToCart = (p: typeof PRODUCTS[0]) => {
    if (p.stock === 0) return
    setCart(prev => {
      const existing = prev.find(i => i.id === p.id)
      if (existing) return prev.map(i => i.id === p.id ? { ...i, qty: i.qty + 1 } : i)
      return [...prev, { id: p.id, name: p.name, price: p.price, qty: 1, promo: p.promo }]
    })
  }
  const updateQty = (id: number, delta: number) => {
    setCart(prev => prev.flatMap(i => {
      if (i.id !== id) return [i]
      const next = i.qty + delta
      if (next <= 0) return []
      return [{ ...i, qty: next }]
    }))
  }

  // ── Derived ──────────────────────────────────────────────────────────────
  const filtered = PRODUCTS.filter(p => {
    const matchCat = activeCat === 'semua' || p.cat === activeCat
    const matchSearch = p.name.toLowerCase().includes(search.toLowerCase())
    return matchCat && matchSearch
  })

  const subtotal = cart.reduce((s, i) => s + i.price * i.qty, 0)
  const discount = cart.filter(i => i.promo).reduce((s, i) => s + Math.round(i.price * i.qty * 0.25), 0)
  const tax = Math.round((subtotal - discount) * 0.11)
  const total = subtotal - discount + tax
  const cartCount = cart.reduce((s, i) => s + i.qty, 0)

  return (
    <div className="flex w-full h-full overflow-hidden" style={{ background: '#FAF6ED' }}>

      {/* ── ZONE 1: Vertical Category Tab (72px, dark) ── */}
      <div className="flex flex-col items-center shrink-0 z-10" style={{ width: 72, background: '#2B1810' }}>
        {/* Logo mark */}
        <div className="py-4 flex items-center justify-center">
          <img src="/Hasuka-logo.png" alt="Hasuka" className="w-9 h-9 object-contain rounded-full" />
        </div>

        {/* Separator */}
        <div className="w-10 mx-auto mb-3" style={{ height: 1, background: '#C49A6240' }} />

        {/* Category tabs */}
        <div className="flex flex-col gap-1 w-full px-1.5 flex-1">
          {CATEGORIES.map(cat => {
            const active = activeCat === cat.id
            const Icon = cat.icon
            return (
              <button
                key={cat.id}
                onClick={() => setActiveCat(cat.id)}
                title={cat.label}
                className="flex flex-col items-center justify-center gap-1 py-3 rounded-xl transition-all"
                style={{
                  background: active ? '#F3E7CE' : 'transparent',
                  cursor: 'pointer',
                }}
              >
                <Icon active={active} />
                <span
                  className="text-[9px] font-bold leading-none text-center"
                  style={{ color: active ? '#2B1810' : '#C49A62' }}
                >
                  {cat.label}
                </span>
              </button>
            )
          })}
        </div>

        {/* Bottom: nav + status */}
        <div className="flex flex-col items-center gap-3 pb-4 mt-auto">
          {/* Online/offline dot */}
          <div
            className="flex flex-col items-center gap-1"
            title={isOnline ? 'Online' : 'Offline'}
          >
            {isOnline
              ? <Wifi size={14} color="#5B8A2E" />
              : <WifiOff size={14} color="#C9A227" />
            }
            <span className="text-[8px] font-bold" style={{ color: isOnline ? '#5B8A2E' : '#C9A227' }}>
              {isOnline ? 'Live' : 'Offline'}
            </span>
          </div>

          {/* Nav menu button */}
          <button
            onClick={() => setIsNavOpen(true)}
            className="flex flex-col items-center justify-center gap-1 w-11 h-11 rounded-xl transition-colors hover:bg-white/10"
            title="Menu Navigasi"
          >
            <MenuIcon size={18} color="#C49A62" />
            <span className="text-[8px] font-bold" style={{ color: '#C49A62' }}>Menu</span>
          </button>
        </div>
      </div>

      {/* ── ZONE 2: Product List (horizontal rows) ── */}
      <div className="flex flex-col flex-1 overflow-hidden" style={{ borderRight: '1px solid #E8D7C0' }}>
        {/* Search bar */}
        <div className="px-4 pt-4 pb-3 shrink-0" style={{ borderBottom: '1px solid #E8D7C0' }}>
          <div className="relative">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: '#6B5448' }} />
            <input
              type="text"
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Cari dimsum, minuman..."
              className="w-full pl-9 pr-4 py-2.5 text-sm font-medium rounded-xl outline-none transition-colors"
              style={{
                background: '#F3E7CE',
                border: '1.5px solid #E8D7C0',
                color: '#2B1810',
              }}
              onFocus={e => { e.currentTarget.style.borderColor = '#8B4A1E' }}
              onBlur={e => { e.currentTarget.style.borderColor = '#E8D7C0' }}
            />
          </div>
        </div>

        {/* Product grid — Direction A style */}
        <div className="flex-1 overflow-y-auto custom-scrollbar px-3 pt-3 pb-3">
          {filtered.length === 0 && (
            <div className="flex flex-col items-center justify-center h-full gap-3 opacity-50">
              <CategoryIconKukus active={false} />
              <p className="text-sm font-medium" style={{ color: '#6B5448' }}>Tidak ada produk ditemukan</p>
            </div>
          )}

          <div className="grid grid-cols-3 gap-x-3 gap-y-5">
            {filtered.map((product) => {
              const isHabis = product.stock === 0
              const inCart = cart.find(i => i.id === product.id)

              return (
                <div
                  key={product.id}
                  className="flex flex-col rounded-2xl overflow-hidden cursor-pointer group"
                  style={{ opacity: isHabis ? 0.65 : 1 }}
                  onClick={() => !isHabis && addToCart(product)}
                >
                  {/* Photo with overlays */}
                  <div className="relative overflow-hidden" style={{ borderRadius: 16, aspectRatio: '4/3' }}>
                    <img
                      src={product.img}
                      alt={product.name}
                      className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                    />

                    {/* HABIS overlay */}
                    {isHabis && (
                      <div className="absolute inset-0 flex items-center justify-center" style={{ background: 'rgba(43,24,16,0.45)' }}>
                        <span className="font-bold text-[12px] px-3 py-1.5 rounded-full" style={{ background: '#2B1810', color: '#F3E7CE', letterSpacing: '0.08em' }}>
                          HABIS
                        </span>
                      </div>
                    )}

                    {/* PROMO badge */}
                    {product.promo && !isHabis && (
                      <div className="absolute top-2 left-2">
                        <span className="font-bold text-[10px] px-2 py-1 rounded-md" style={{ background: '#DF690B', color: 'white' }}>
                          -{product.promoText}
                        </span>
                      </div>
                    )}

                    {/* In-cart indicator ring */}
                    {inCart && !isHabis && (
                      <div className="absolute top-2 right-2 w-6 h-6 rounded-full flex items-center justify-center font-extrabold text-[11px]" style={{ background: '#8B4A1E', color: 'white' }}>
                        {inCart.qty}
                      </div>
                    )}

                    {/* Price overlay — glassmorphism at bottom */}
                    {!isHabis && (
                      <div
                        className="absolute bottom-0 left-0 right-0 px-3 py-2"
                        style={{ background: 'linear-gradient(to top, rgba(43,24,16,0.75) 0%, transparent 100%)' }}
                      >
                        <div className="flex items-center gap-1.5">
                          <span className="font-bold text-[14px]" style={{ color: 'white' }}>
                            {fmt(product.price)}
                          </span>
                          {product.originalPrice && (
                            <span className="text-[10px] line-through" style={{ color: 'rgba(255,255,255,0.65)' }}>
                              {fmt(product.originalPrice)}
                            </span>
                          )}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Name + action row below photo */}
                  <div className="flex items-start justify-between pt-2 px-0.5 pb-1 gap-2">
                    <p
                      className="font-serif font-bold text-[13px] leading-snug flex-1 line-clamp-2"
                      style={{ color: isHabis ? '#6B5448' : '#2B1810' }}
                    >
                      {product.name}
                    </p>

                    {/* Stepper if in cart, else invisible (tap whole card to add) */}
                    {inCart && !isHabis && (
                      <div
                        className="flex items-center rounded-lg overflow-hidden shrink-0"
                        style={{ border: '1.5px solid #8B4A1E', height: 28 }}
                        onClick={e => e.stopPropagation()}
                      >
                        <button
                          onClick={e => { e.stopPropagation(); updateQty(product.id, -1) }}
                          className="w-7 h-full flex items-center justify-center"
                          style={{ color: '#8B4A1E' }}
                        >
                          <Minus size={11} strokeWidth={3} />
                        </button>
                        <span className="w-6 text-center font-extrabold text-[12px]" style={{ color: '#2B1810' }}>
                          {inCart.qty}
                        </span>
                        <button
                          onClick={e => { e.stopPropagation(); addToCart(product) }}
                          className="w-7 h-full flex items-center justify-center"
                          style={{ background: '#8B4A1E', color: 'white' }}
                        >
                          <Plus size={11} strokeWidth={3} />
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </div>


      {/* ── ZONE 3: Cart Panel ── */}
      <div
        className="flex flex-col shrink-0"
        style={{
          width: 340,
          background: '#F3E7CE',
          borderLeft: '4px solid #8B4A1E',
        }}
      >
        {/* Cart header: table number prominent */}
        <div className="px-5 pt-5 pb-4 shrink-0" style={{ borderBottom: '1px solid #C49A6260' }}>
          <div className="flex items-end justify-between">
            <div>
              <p className="text-[11px] font-bold uppercase tracking-widest mb-0.5" style={{ color: '#6B5448' }}>
                Meja Aktif
              </p>
              <h2 className="font-serif text-[28px] font-bold leading-none" style={{ color: '#2B1810' }}>
                Meja 01
              </h2>
            </div>
            <div className="text-right">
              <p className="text-[11px] font-semibold" style={{ color: '#6B5448' }}>Sri Wahyuni</p>
              <p className="text-[10px]" style={{ color: '#8B4A1E' }}>Kasir Senior</p>
            </div>
          </div>

          {/* Cart count pill */}
          {cartCount > 0 && (
            <div
              className="mt-3 inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold"
              style={{ background: '#8B4A1E', color: 'white' }}
            >
              <span>{cartCount} item dalam pesanan</span>
            </div>
          )}
        </div>

        {/* Cart items */}
        <div className="flex-1 overflow-y-auto custom-scrollbar py-1">
          {cart.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full gap-4 px-6 text-center opacity-60">
              <CategoryIconKukus active={false} />
              <div>
                <p className="font-serif font-bold text-[16px]" style={{ color: '#2B1810' }}>Belum Ada Pesanan</p>
                <p className="text-[12px] mt-1" style={{ color: '#6B5448' }}>Pilih produk di sebelah kiri untuk mulai</p>
              </div>
            </div>
          ) : (
            cart.map((item, idx) => (
              <div
                key={item.id}
                className="px-4 py-3 flex items-start gap-3"
                style={{ borderBottom: idx < cart.length - 1 ? '1px solid #C49A6240' : 'none' }}
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-start gap-1.5 mb-1">
                    <p className="font-semibold text-[13px] leading-snug flex-1" style={{ color: '#2B1810' }}>
                      {item.name}
                    </p>
                    {item.promo && (
                      <span
                        className="text-[9px] font-bold px-1 py-0.5 rounded shrink-0 mt-0.5"
                        style={{ background: '#DF690B', color: 'white' }}
                      >
                        PROMO
                      </span>
                    )}
                  </div>

                  <div className="flex items-center justify-between">
                    {/* Stepper */}
                    <div
                      className="flex items-center rounded-lg overflow-hidden"
                      style={{ border: '1px solid #C49A62', height: 30 }}
                    >
                      <button
                        onClick={() => updateQty(item.id, -1)}
                        className="w-8 h-full flex items-center justify-center transition-colors hover:bg-white/50"
                        style={{ color: '#8B4A1E' }}
                      >
                        <Minus size={12} strokeWidth={3} />
                      </button>
                      <span className="w-7 text-center font-extrabold text-[13px]" style={{ color: '#2B1810' }}>
                        {item.qty}
                      </span>
                      <button
                        onClick={() => updateQty(item.id, 1)}
                        className="w-8 h-full flex items-center justify-center transition-colors hover:bg-white/50"
                        style={{ color: '#8B4A1E' }}
                      >
                        <Plus size={12} strokeWidth={3} />
                      </button>
                    </div>

                    {/* Line total */}
                    <span className="font-extrabold text-[14px]" style={{ color: '#2B1810' }}>
                      {fmt(item.price * item.qty)}
                    </span>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Cart summary + pay button */}
        <div className="shrink-0 px-5 pb-5 pt-3" style={{ borderTop: '1.5px solid #C49A62' }}>
          <div className="space-y-1.5 mb-3">
            <div className="flex justify-between text-[12px]">
              <span style={{ color: '#6B5448' }}>Subtotal</span>
              <span className="font-semibold" style={{ color: '#2B1810' }}>{fmt(subtotal)}</span>
            </div>
            {discount > 0 && (
              <div className="flex justify-between text-[12px]">
                <span style={{ color: '#DF690B' }}>Diskon Promo</span>
                <span className="font-bold" style={{ color: '#DF690B' }}>-{fmt(discount)}</span>
              </div>
            )}
            <div className="flex justify-between text-[12px]">
              <span style={{ color: '#6B5448' }}>Pajak PPN 11%</span>
              <span className="font-semibold" style={{ color: '#2B1810' }}>{fmt(tax)}</span>
            </div>
          </div>

          {/* Total line */}
          <div
            className="flex justify-between items-baseline mb-4 pb-3"
            style={{ borderTop: '1.5px solid #C49A6280', paddingTop: 12 }}
          >
            <span className="font-serif font-bold text-[15px]" style={{ color: '#2B1810' }}>TOTAL AKHIR</span>
            <span className="font-serif font-bold text-[24px]" style={{ color: '#8B4A1E' }}>
              {fmt(total)}
            </span>
          </div>

          {/* Pay button */}
          <button
            onClick={() => cart.length > 0 && setIsPaymentOpen(true)}
            disabled={cart.length === 0}
            className="w-full py-3.5 rounded-xl font-bold text-[15px] transition-all flex items-center justify-between px-5 group"
            style={{
              background: cart.length === 0 ? '#C49A62' : '#8B4A1E',
              color: 'white',
              opacity: cart.length === 0 ? 0.5 : 1,
              cursor: cart.length === 0 ? 'not-allowed' : 'pointer',
            }}
          >
            <span>BAYAR</span>
            <span className="flex items-center gap-1">
              <span className="font-extrabold">{fmt(total)}</span>
              <ChevronRight size={18} className="group-hover:translate-x-0.5 transition-transform" />
            </span>
          </button>
        </div>
      </div>

      {/* ── Nav Overlay Drawer ─────────────────────────────────────────────── */}
      {isNavOpen && (
        <div
          className="fixed inset-0 z-50 flex"
          onClick={() => setIsNavOpen(false)}
        >
          {/* Backdrop */}
          <div className="absolute inset-0" style={{ background: 'rgba(43,24,16,0.55)' }} />

          {/* Drawer panel — full height, scrollable nav */}
          <div
            className="relative flex flex-col h-full shadow-2xl z-10"
            style={{ width: 256, background: '#2B1810' }}
            onClick={e => e.stopPropagation()}
          >
            {/* Header: logo + identity + close button */}
            <div className="px-5 pt-5 pb-4 shrink-0 flex items-start justify-between" style={{ borderBottom: '1px solid #C49A6230' }}>
              <div className="flex items-center gap-3">
                <img src="/Hasuka-logo.png" alt="Hasuka" className="w-11 h-11 object-contain rounded-full shrink-0" />
                <div>
                  <h2 className="font-serif font-bold text-[17px] leading-tight" style={{ color: '#F3E7CE' }}>Hasuka POS</h2>
                  <p className="text-[11px] mt-0.5" style={{ color: '#C49A62' }}>Sri Wahyuni · Meja 01</p>
                </div>
              </div>
              <button
                onClick={() => setIsNavOpen(false)}
                className="w-8 h-8 rounded-lg flex items-center justify-center transition-colors hover:bg-white/10 shrink-0 mt-0.5"
                title="Tutup menu"
              >
                <X size={18} color="#C49A62" />
              </button>
            </div>

            {/* Scrollable nav list */}
            <div className="flex-1 overflow-y-auto py-2 px-2" style={{ scrollbarWidth: 'none' }}>
              {([
                { label: 'Kasir',             key: 'checkout',       desc: 'Halaman utama transaksi',     Icon: Store },
                { label: 'Laporan',           key: 'reports',        desc: 'Omzet & analitik penjualan',  Icon: BarChart2 },
                { label: 'Petty Cash',        key: 'pettyCash',      desc: 'Catat pengeluaran kas kecil', Icon: Wallet },
                { label: 'Manajemen Produk',  key: 'manageProducts', desc: 'Kelola menu & stok',          Icon: Package },
                { label: 'Manajemen Promo',   key: 'managePromo',    desc: 'Diskon & promo aktif',        Icon: Tag },
                { label: 'Stok Opname',       key: 'stokOpname',     desc: 'Hitung fisik stok',           Icon: ClipboardList },
                { label: 'QR Menu',           key: 'qrMenu',         desc: 'Tampilan menu pelanggan',     Icon: QrCode },
                { label: 'Pengaturan',        key: 'settings',       desc: 'Printer, QRIS, pajak',        Icon: Settings },
              ] as const).map(nav => (
                <button
                  key={nav.key}
                  className="w-full text-left flex items-center gap-3 px-3 py-2.5 rounded-xl transition-colors hover:bg-white/10 active:bg-white/20"
                  onClick={() => {
                    setIsNavOpen(false)
                    if (onNavigate && nav.key !== 'checkout') onNavigate(nav.key)
                  }}
                >
                  <div className="shrink-0 w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: '#3D2315' }}>
                    <nav.Icon size={16} color="#C49A62" />
                  </div>
                  <div className="min-w-0">
                    <p className="font-bold text-[13px] leading-tight" style={{ color: '#F3E7CE' }}>{nav.label}</p>
                    <p className="text-[10px] truncate" style={{ color: '#C49A6299' }}>{nav.desc}</p>
                  </div>
                </button>
              ))}
            </div>

            {/* Tutup Shift — pinned at bottom, danger */}
            <div className="shrink-0 px-2 py-3" style={{ borderTop: '1px solid #C49A6230' }}>
              <button
                className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition-colors hover:bg-red-900/30 active:bg-red-900/50"
                onClick={() => {
                  setIsNavOpen(false)
                  if (onNavigate) onNavigate('login')
                }}
              >
                <div className="shrink-0 w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: '#5C1010' }}>
                  <LogOut size={16} color="#F87171" />
                </div>
                <div>
                  <p className="font-bold text-[13px]" style={{ color: '#F87171' }}>Tutup Shift</p>
                  <p className="text-[10px]" style={{ color: '#C49A6299' }}>Rekonsiliasi & logout kasir</p>
                </div>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Payment Modal ─────────────────────────────────────────────────── */}
      <PaymentModal
        isOpen={isPaymentOpen}
        onClose={() => setIsPaymentOpen(false)}
        onSuccess={onSuccess}
        totalAmount={total}
      />
    </div>
  )
}
