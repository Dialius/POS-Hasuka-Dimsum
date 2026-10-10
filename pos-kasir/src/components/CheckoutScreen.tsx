import { useState, useEffect } from 'react'
import { Minus, Plus, Search, Wifi, WifiOff, ChevronRight, Menu as MenuIcon, X, Store, BarChart2, Package, Tag, ClipboardList, Wallet, Settings, LogOut, Pencil, Check, ArrowLeft, Building2, ShoppingCart, ChevronUp, Trash2, Gift } from 'lucide-react'
import PaymentModal, { PaymentDetails } from './PaymentModal'
import { useApp, type Product } from '../context/AppContext'
import { gasApi } from '../services/gasApi'
import { HASUKA_LOGO } from '../assets/logo'
import { AlertToastHost } from './Alert'
import { Button } from './common/Button'
import { fmt, recipeStockEstimate } from '../utils/formatters'



const CATEGORIES = [
  { id: 'semua', label: 'Semua', icon: CategoryIconSemua },
  { id: 'promo', label: '🔥 Promo', icon: CategoryIconPromo },
  { id: 'kukus', label: 'Kukus', icon: CategoryIconKukus },
  { id: 'goreng', label: 'Goreng', icon: CategoryIconGoreng },
  { id: 'minuman', label: 'Minuman', icon: CategoryIconMinuman },
  { id: 'snack', label: 'Snack', icon: CategoryIconSnack },
  { id: 'paket', label: 'Paket', icon: CategoryIconPaket },
]
// Products are now imported from mockData


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

function CategoryIconPromo({ active }: { active: boolean }) {
  const c = active ? '#2B1810' : '#C49A62'
  return (
    <svg width="22" height="22" viewBox="0 0 22 22" fill="none">
      <path d="M11 2L13.5 8.5L20 9L15 13.5L16.5 20L11 16.5L5.5 20L7 13.5L2 9L8.5 8.5L11 2Z" stroke={c} strokeWidth="1.7" fill={active ? c : 'none'} opacity={active ? 0.3 : 1} strokeLinejoin="round" />
    </svg>
  )
}

type CartItem = {
  id: number
  name: string
  price: number
  qty: number
  promo: boolean
  isBundle?: boolean
  bundleId?: number
  bundleProducts?: { productId: number; productName: string; qty: number }[]
  detailText?: string
}

type ToastItem = { id: string; variant: 'default' | 'destructive' | 'warning' | 'success' | 'info'; title: string; description?: string; actionLabel?: string; onAction?: () => void; durationMs?: number }

export default function CheckoutScreen({ onSuccess, onNavigate, isOwner }: { onSuccess: (tx: any) => void, onNavigate?: (screen: any) => void, isOwner?: boolean }) {
  const { tableName, setTableName, kasirInfo, outlet, productsList, setProductsList, taxRate, serviceRate, recipesList, ingredientsList, setIngredientsList, promosList } = useApp()
  const isUserOwner = isOwner ?? (kasirInfo?.role === 'Owner')
  const [activeCat, setActiveCat] = useState('semua')
  const [search, setSearch] = useState('')
  const [cart, setCart] = useState<CartItem[]>([])
  const [isPaymentOpen, setIsPaymentOpen] = useState(false)
  const [isNavOpen, setIsNavOpen] = useState(false)
  const [isOnline] = useState(true)
  const [isEditingTable, setIsEditingTable] = useState(false)
  const [tableNameDraft, setTableNameDraft] = useState('')
  const [isCartExpanded, setIsCartExpanded] = useState(() => {
    try {
      return localStorage.getItem('hasuka_cart_expanded') === 'true'
    } catch {
      return false
    }
  })
  const [toasts, setToasts] = useState<ToastItem[]>([])
  const [itemToRemove, setItemToRemove] = useState<{id: number, name: string} | null>(null)

  const addToast = (t: Omit<ToastItem, 'id'>) =>
    setToasts(prev => prev.some(x => x.title === t.title && x.description === t.description) ? prev : [...prev, { ...t, id: Date.now().toString() }])
  const dismissToast = (id: string) => setToasts(prev => prev.filter(t => t.id !== id))

  // Persist cart expansion state
  useEffect(() => {
    try {
      localStorage.setItem('hasuka_cart_expanded', String(isCartExpanded))
    } catch {}
  }, [isCartExpanded])

  // ── Promo helpers ────────────────────────────────────────────────────────
  const todayStr = new Date().toISOString().split('T')[0]
  const activePromos = promosList?.filter(p => {
    if (p.status !== 'Aktif') return false
    const s = String(p.startDate || '').split(' ')[0].split('T')[0]
    const e = String(p.endDate || '').split(' ')[0].split('T')[0]
    if (s && s > todayStr) return false
    if (e && e < todayStr) return false
    if (p.outlets && p.outlets !== 'all' && Array.isArray(p.outlets) && outlet?.id) {
      if (!p.outlets.includes(outlet.id)) return false
    }
    return true
  }) || []

  const isProductInPromo = (p: { id: number; promo?: boolean; originalPrice?: number; price?: number }) => {
    if (p.originalPrice && p.price && p.originalPrice > p.price) return true
    return activePromos.some(promo => {
      // Promo bundling HANYA berlaku untuk menu paket di tab paket, TIDAK menandai produk satuan sebagai promo
      if (promo.type === 'bundling') return false
      // Untuk promo Gratis Item / BxGy: hanya produk pemicu yang di-tag PROMO, item gratisnya tidak di-tag
      if (promo.type === 'gratis_item') {
        if (promo.scope === 'Semua Produk') return true
        if (Array.isArray(promo.products) && promo.products.some((item: any) => (item.productId || item.id) === p.id)) return true
        return false
      }
      if (promo.scope === 'Semua Produk') return true
      if (promo.scope === 'Produk Tertentu' && Array.isArray(promo.products)) {
        if (promo.products.some((item: any) => (item.productId || item.id) === p.id)) return true
      }
      return false
    })
  }

  // ── Cart helpers ─────────────────────────────────────────────────────────
  const getMaxQty = (p: any) => {
    if (p.stock_mode === 'recipe') {
      const est = recipeStockEstimate(p.id, recipesList, ingredientsList)
      return est ? est.min : Infinity
    }
    return p.stock ?? Infinity
  }

  const addToCart = (p: Product, addQty = 1) => {
    const maxQty = getMaxQty(p)

    setCart(prev => {
      const existing = prev.find(i => i.id === p.id)
      const currentQty = existing ? existing.qty : 0
      
      if (currentQty === 0 && maxQty <= 0) {
        addToast({ variant: 'warning', title: 'Stok Tercatat Habis', description: `Pesanan ${p.name} tetap ditambahkan.` })
      } else if (currentQty + addQty > maxQty) {
        addToast({ variant: 'warning', title: 'Stok Tercatat Kurang', description: `Sisa stok ${p.name} di sistem hanya ${maxQty}.` })
      }

      if (existing) return prev.map(i => i.id === p.id ? { ...i, qty: i.qty + addQty } : i)
      return [...prev, { id: p.id, name: p.name, price: p.price, qty: addQty, promo: isProductInPromo(p) }]
    })
  }

  const getBundleStockStatus = (bundle: any) => {
    if (!bundle.bundleProducts || !Array.isArray(bundle.bundleProducts) || bundle.bundleProducts.length === 0) {
      return { isHabis: false, maxPortions: Infinity, depletedItems: [] as string[] }
    }
    let minPortions = Infinity
    const depletedItems: string[] = []
    for (const bp of bundle.bundleProducts) {
      const prod = productsList.find(p => p.id === bp.productId)
      if (!prod) continue
      const available = getMaxQty(prod)
      const required = bp.qty || 1
      const portions = Math.floor(available / required)
      if (portions <= 0) {
        depletedItems.push(bp.productName || prod.name)
      }
      if (portions < minPortions) minPortions = portions
    }
    const isHabis = depletedItems.length > 0
    const safePortions = minPortions === Infinity ? 999 : minPortions
    return { isHabis, maxPortions: safePortions, depletedItems }
  }

  const addBundleToCart = (bundle: any) => {
    if (!bundle.bundleProducts || !Array.isArray(bundle.bundleProducts)) return
    const { isHabis, depletedItems } = getBundleStockStatus(bundle)

    const bundleCartId = 900000 + Number(bundle.id)
    const detailList = bundle.bundleProducts.map((bp: any) => `${bp.qty || 1}x ${bp.productName}`).join(', ')
    const bundleName = bundle.name.toLowerCase().startsWith('paket') ? bundle.name : `Paket ${bundle.name}`

    setCart(prev => {
      const existing = prev.find(i => i.id === bundleCartId)
      if (existing) {
        return prev.map(i => i.id === bundleCartId ? { ...i, qty: i.qty + 1 } : i)
      }
      return [
        ...prev,
        {
          id: bundleCartId,
          name: bundleName,
          price: Number(bundle.value || 0),
          qty: 1,
          promo: false,
          isBundle: true,
          bundleId: bundle.id,
          bundleProducts: bundle.bundleProducts,
          detailText: detailList
        }
      ]
    })

    if (isHabis && depletedItems.length > 0) {
      addToast({
        variant: 'warning',
        title: `${bundleName} Dimasukkan (Stok Kurang)`,
        description: `Bahan/menu (${depletedItems.join(', ')}) tercatat habis, tetapi paket tetap dimasukkan ke pesanan.`,
        durationMs: 4000
      })
    } else {
      addToast({
        variant: 'success',
        title: `${bundleName} Dimasukkan`,
        description: `Harga paket ${fmt(bundle.value)} (isi: ${detailList}).`,
        durationMs: 3000
      })
    }
  }

  const updateQty = (id: number, delta: number, name: string) => {
    setCart(prev => {
      const item = prev.find(i => i.id === id)
      if (!item) return prev
      const next = item.qty + delta

      if (item.isBundle) {
        const bundle = activeBundles.find(b => 900000 + Number(b.id) === id)
        if (bundle) {
          const { maxPortions } = getBundleStockStatus(bundle)
          if (delta > 0 && next > maxPortions) {
            addToast({ variant: 'warning', title: 'Stok Paket Kurang', description: `Sisa kapasitas porsi paket di sistem hanya ${maxPortions}.` })
          }
        }
      } else {
        const p = productsList.find(x => x.id === id)
        const maxQty = p ? getMaxQty(p) : Infinity
        if (delta > 0 && next > maxQty) {
          addToast({ variant: 'warning', title: 'Stok Tercatat Kurang', description: `Sisa stok di sistem hanya ${maxQty}.` })
        }
      }

      if (next <= 0) {
        setItemToRemove({ id, name })
        return prev
      }
      return prev.map(i => i.id === id ? { ...i, qty: next } : i)
    })
  }

  const removeItem = (id: number, name: string) => {
    setItemToRemove({ id, name })
  }

  // ── Derived ──────────────────────────────────────────────────────────────
  // Filter products by branch access and category/search
  const applicableProducts = productsList.filter(p => {
    if (isOwner) return true
    if (!p.outlets || p.outlets === 'all') return true
    if (Array.isArray(p.outlets) && p.outlets.includes(outlet.id)) return true
    return false
  })

  const filtered = applicableProducts.filter(p => {
    let matchCat = false
    if (activeCat === 'semua') {
      matchCat = true
    } else if (activeCat === 'promo') {
      matchCat = isProductInPromo(p)
    } else if (activeCat === 'paket') {
      // Tab Paket: Hanya tampilkan menu berkategori resmi 'paket' (bundling promo dirender di grid paket khusus)
      matchCat = (p.cat || '').toLowerCase() === 'paket'
    } else {
      matchCat = (p.cat || '').toLowerCase() === activeCat.toLowerCase()
    }
    const matchSearch = p.name.toLowerCase().includes(search.toLowerCase())
    return matchCat && matchSearch
  })

  const subtotal = cart.reduce((s, i) => s + i.price * i.qty, 0)
  
  // ── Hitung Diskon dari Seluruh Jenis Promo Aktif (Multi-Promo & Revenue Leak Prevention) ──
  const allocatedQty: Record<number, number> = {}
  let calculatedDiscount = 0
  const appliedPromoDetails: string[] = []

  // Helper Pengaman HPP (Cost Floor Guard)
  // Menjamin harga jual setelah diskon tidak pernah berada di bawah modal bahan baku pokok (HPP / cost)
  const getSafeDiscountFloor = (productId: number, unitPrice: number, desiredDiscount: number) => {
    const prod = productsList.find(p => p.id === productId)
    const cost = Number(prod?.cost || 0)
    // Jika data cost diisi, batas maksimal diskon adalah selisih antara harga jual dan modal (gross margin positif)
    // Jika data cost belum diisi / 0, batas pengaman default adalah 75% dari harga jual
    const maxDiscountAllowed = cost > 0 ? Math.max(0, unitPrice - cost) : Math.round(unitPrice * 0.75)
    return Math.min(desiredDiscount, maxDiscountAllowed)
  }

  // 1. TAHAP BUNDLING (Paket Kombinasi Produk Spesifik)
  // Produk yang masuk ke dalam paket bundling dialokasikan terlebih dahulu agar tidak terkena diskon ganda
  const activeBundles = activePromos.filter(pr => pr.type === 'bundling' && Array.isArray(pr.bundleProducts) && pr.bundleProducts.length > 0)

  activeBundles.forEach(promo => {
    let maxBundles = Infinity
    let regularBundlePrice = 0

    for (const bp of promo.bundleProducts) {
      const requiredQty = bp.qty || 1
      const cartItem = cart.find(i => i.id === bp.productId && !i.isBundle)
      const availableQty = cartItem ? (cartItem.qty - (allocatedQty[cartItem.id] || 0)) : 0
      if (availableQty < requiredQty) {
        maxBundles = 0
        break
      }
      const possible = Math.floor(availableQty / requiredQty)
      if (possible < maxBundles) maxBundles = possible
      if (cartItem) regularBundlePrice += cartItem.price * requiredQty
    }

    if (maxBundles > 0 && maxBundles !== Infinity) {
      // Batasi maksimal 5 paket per transaksi untuk mencegah kebocoran pesanan grosir/reseller
      const safeBundles = promo.applyLimits !== false ? Math.min(maxBundles, 5) : maxBundles
      const discountPerBundle = Math.max(0, regularBundlePrice - promo.value)
      if (discountPerBundle > 0) {
        calculatedDiscount += discountPerBundle * safeBundles
        appliedPromoDetails.push(`${promo.name} (${safeBundles}x Paket)`)
        for (const bp of promo.bundleProducts) {
          allocatedQty[bp.productId] = (allocatedQty[bp.productId] || 0) + (bp.qty || 1) * safeBundles
        }
      }
    }
  })

  // Bundle display & stock calculation helpers
  const displayedBundles = activeBundles.filter(b => 
    !search || 
    b.name.toLowerCase().includes(search.toLowerCase()) || 
    (b.desc || '').toLowerCase().includes(search.toLowerCase()) ||
    (Array.isArray(b.bundleProducts) && b.bundleProducts.some((bp: any) => bp.productName?.toLowerCase().includes(search.toLowerCase())))
  )

  const getBundleCartCount = (bundle: any) => {
    // 1. Cek langsung jika bundle ada di keranjang sebagai 1 paket
    const bundleCartId = 900000 + Number(bundle.id)
    const direct = cart.find(i => i.id === bundleCartId)
    if (direct) return direct.qty

    // 2. Fallback jika item lepasan membentuk bundle
    if (!bundle.bundleProducts || !Array.isArray(bundle.bundleProducts) || bundle.bundleProducts.length === 0) return 0
    let count = Infinity
    for (const bp of bundle.bundleProducts) {
      const cartItem = cart.find(i => i.id === bp.productId)
      const qty = cartItem ? cartItem.qty : 0
      const required = bp.qty || 1
      const possible = Math.floor(qty / required)
      if (possible < count) count = possible
    }
    return count === Infinity ? 0 : count
  }

  // 2. TAHAP GRATIS ITEM / BxGy (Beli X Gratis Y)
  // Dilengkapi Fair-Value Ceiling & Max Cycles Guard
  const freeItemClaims: { promoName: string; product: Product; label: string; qtyToAdd: number }[] = []

  activePromos.filter(pr => pr.type === 'gratis_item').forEach(promo => {
    const minBuy = Math.max(1, promo.value || 1) // X pemicu

    if (promo.freeItem && promo.freeItem.productId) {
      // KASUS A: BxGy beda produk (contoh: Beli 2 Dimsum Mentai, Gratis 1 Teh Liang)
      const freeProductId = promo.freeItem.productId
      const freePerCycle = Math.max(1, promo.freeItem.qty || 1) // Y per kelipatan

      // Hitung total unit pemicu yang belum terpakai oleh promo lain & cari harga pemicu tertinggi
      let triggerQty = 0
      let maxTriggerPrice = 0
      cart.forEach(item => {
        if (item.isBundle) return
        let isTrigger = false
        if (promo.scope === 'Semua Produk') isTrigger = (item.id !== freeProductId)
        else if (Array.isArray(promo.products)) {
          isTrigger = promo.products.some((p: any) => (p.productId || p.id) === item.id)
        }
        if (isTrigger) {
          const avail = Math.max(0, item.qty - (allocatedQty[item.id] || 0))
          triggerQty += avail
          if (item.price > maxTriggerPrice) maxTriggerPrice = item.price
        }
      })

      // Hitung kelipatan yang berhak didapat (dibatasi maks 4 siklus per transaksi untuk cegah kebocoran)
      const eligibleCycles = promo.applyLimits !== false ? Math.min(Math.floor(triggerQty / minBuy), 4) : Math.floor(triggerQty / minBuy)
      const totalFreeUnitsEligible = eligibleCycles * freePerCycle

      if (eligibleCycles > 0) {
        // Alokasikan trigger items yang sudah dipakai untuk promo ini
        let neededTriggerAllocation = eligibleCycles * minBuy
        cart.forEach(item => {
          if (item.isBundle) return
          let isTrigger = false
          if (promo.scope === 'Semua Produk') isTrigger = (item.id !== freeProductId)
          else if (Array.isArray(promo.products)) {
            isTrigger = promo.products.some((p: any) => (p.productId || p.id) === item.id)
          }
          if (isTrigger && neededTriggerAllocation > 0) {
            const avail = Math.max(0, item.qty - (allocatedQty[item.id] || 0))
            const take = Math.min(avail, neededTriggerAllocation)
            allocatedQty[item.id] = (allocatedQty[item.id] || 0) + take
            neededTriggerAllocation -= take
          }
        })

        // Cek item gratis di keranjang untuk dipotong 100% (gratis)
        const freeItemInCart = cart.find(i => i.id === freeProductId && !i.isBundle)
        const freeItemAvailInCart = freeItemInCart ? Math.max(0, freeItemInCart.qty - (allocatedQty[freeProductId] || 0)) : 0

        const freeQtyToDiscount = Math.min(freeItemAvailInCart, totalFreeUnitsEligible)
        if (freeItemInCart && freeQtyToDiscount > 0) {
          // PENGAMAN REVENUE LEAK: Nilai potongan item gratis tidak boleh melebihi harga produk pemicu yang dibeli
          const unitDiscount = promo.applyLimits !== false ? Math.min(freeItemInCart.price, maxTriggerPrice > 0 ? maxTriggerPrice : freeItemInCart.price) : freeItemInCart.price
          calculatedDiscount += unitDiscount * freeQtyToDiscount
          allocatedQty[freeProductId] = (allocatedQty[freeProductId] || 0) + freeQtyToDiscount
          appliedPromoDetails.push(`${promo.name} (${freeQtyToDiscount}x Gratis ${freeItemInCart.name})`)
        }

        // Tampilkan tombol klaim jika masih ada jatah gratis yang belum dimasukkan ke keranjang
        const remainingFreeToClaim = totalFreeUnitsEligible - freeQtyToDiscount
        if (remainingFreeToClaim > 0) {
          const targetProd = productsList.find(p => p.id === freeProductId)
          if (targetProd) {
            freeItemClaims.push({
              promoName: promo.name,
              product: targetProd,
              qtyToAdd: remainingFreeToClaim,
              label: remainingFreeToClaim > 1
                ? `Klaim ${remainingFreeToClaim}x Gratis: ${targetProd.name}`
                : `Klaim Gratis: ${targetProd.name}`
            })
          }
        }
      }
    } else {
      // KASUS B: BxG1 pada produk yang sama (contoh: Beli 1 Gratis 1, Beli 2 Gratis 1)
      const cycleSize = minBuy + 1

      cart.forEach(item => {
        if (item.isBundle) return
        let applies = false
        if (promo.scope === 'Semua Produk') applies = true
        else if (Array.isArray(promo.products)) {
          applies = promo.products.some((p: any) => (p.productId || p.id) === item.id)
        }

        if (applies) {
          const availQty = Math.max(0, item.qty - (allocatedQty[item.id] || 0))
          // Batasi maksimal 4 siklus gratis per transaksi
          const completeCycles = promo.applyLimits !== false ? Math.min(Math.floor(availQty / cycleSize), 4) : Math.floor(availQty / cycleSize)
          if (completeCycles > 0) {
            const freeUnits = completeCycles
            calculatedDiscount += item.price * freeUnits
            allocatedQty[item.id] = (allocatedQty[item.id] || 0) + (completeCycles * cycleSize)
            appliedPromoDetails.push(`${promo.name} (${freeUnits}x Gratis ${item.name})`)
          }

          // Jika ada sisa pembelian yang berhak atas item gratis berikutnya
          const remainder = availQty % cycleSize
          if (remainder >= minBuy && (promo.applyLimits === false || completeCycles < 4)) {
            const prod = productsList.find(p => p.id === item.id)
            if (prod) {
              freeItemClaims.push({
                promoName: promo.name,
                product: prod,
                qtyToAdd: 1,
                label: `Ambil 1 Gratis: ${prod.name} (${minBuy > 1 ? `B${minBuy}G1` : 'B1G1'})`
              })
            }
          }
        }
      })
    }
  })

  // 3. TAHAP DISKON PRODUK LANGSUNG (Diskon % & Diskon Rp)
  // PENGAMAN REVENUE LEAK (Pencegahan Kebocoran Marjin Penjualan):
  // (A) Batas Porsi Terdiskon: Maksimal 2 porsi per item yang berhak diskon per transaksi!
  //     (Contoh: Beli 3 porsi Dimsum Mentai diskon 20% -> Porsi 1 & 2 diskon 20%, porsi ke-3 harga reguler!)
  // (B) Cost Floor Guard: Diskon tidak boleh menembus modal HPP (p.cost)
  // (C) Best Deal Resolution: Jika ada > 1 diskon bersaing, ambil diskon tertinggi per unit, non-stacking.
  const directDiscountPromos = activePromos.filter(pr => pr.type === 'diskon_persen' || pr.type === 'diskon_nominal')

  cart.forEach(item => {
    // Item paket bundling sudah mendapatkan harga paket promo, TIDAK boleh dipotong diskon lagi
    if (item.isBundle) return

    const unallocatedQty = Math.max(0, item.qty - (allocatedQty[item.id] || 0))
    if (unallocatedQty <= 0) return

    let bestUnitDiscount = 0
    let bestPromoName = ''
    let bestPromoLimits = true

    directDiscountPromos.forEach(promo => {
      let applies = false
      if (promo.scope === 'Semua Produk') applies = true
      else if (Array.isArray(promo.products)) {
        applies = promo.products.some((p: any) => (p.productId || p.id) === item.id)
      }

      if (applies) {
        let rawDiscPerUnit = 0
        if (promo.type === 'diskon_persen') {
          rawDiscPerUnit = Math.round(item.price * (promo.value / 100))
        } else if (promo.type === 'diskon_nominal') {
          rawDiscPerUnit = Math.min(item.price, promo.value)
        }

        // Terapkan batas aman HPP (Cost Floor)
        const safeDiscPerUnit = promo.applyLimits !== false ? getSafeDiscountFloor(item.id, item.price, rawDiscPerUnit) : rawDiscPerUnit

        if (safeDiscPerUnit > bestUnitDiscount) {
          bestUnitDiscount = safeDiscPerUnit
          bestPromoName = promo.name
          bestPromoLimits = promo.applyLimits !== false
        }
      }
    })

    if (bestUnitDiscount > 0) {
      // PENGAMAN KEBOCORAN VOLUME: Maksimal 2 porsi per transaksi yang terdiskon promo langsung
      const MAX_DISCOUNTED_QTY_PER_ITEM = bestPromoLimits ? 2 : Infinity
      const qtyToDiscount = Math.min(unallocatedQty, MAX_DISCOUNTED_QTY_PER_ITEM)
      
      calculatedDiscount += bestUnitDiscount * qtyToDiscount
      allocatedQty[item.id] = (allocatedQty[item.id] || 0) + unallocatedQty // tandai seluruh qty agar tidak di-double dip

      const detailText = unallocatedQty > qtyToDiscount
        ? `${bestPromoName} (${qtyToDiscount} dari ${unallocatedQty} porsi)`
        : bestPromoName

      if (!appliedPromoDetails.includes(detailText)) {
        appliedPromoDetails.push(detailText)
      }
    }
  })

  // Catat nama paket yang ada di keranjang untuk struk/pelaporan
  cart.filter(i => i.isBundle).forEach(b => {
    if (!appliedPromoDetails.includes(b.name)) {
      appliedPromoDetails.push(b.name)
    }
  })
  
  const discount = calculatedDiscount
  const tax = Math.round((subtotal - discount) * (taxRate / 100))
  const serviceChargeAmount = Math.round((subtotal - discount) * (serviceRate / 100))
  const total = subtotal - discount + tax + serviceChargeAmount
  const cartCount = cart.reduce((s, i) => s + i.qty, 0)

  const [isSubmitting, setIsSubmitting] = useState(false)

  const handlePaymentSuccess = async (details?: PaymentDetails) => {
    setIsSubmitting(true)
    
    let activeShiftId: string | number = 1;
    try {
      const saved = localStorage.getItem('hasuka_active_shift');
      if (saved) {
        const shift = JSON.parse(saved);
        if (shift.id) activeShiftId = shift.id;
      }
    } catch (e) {}

    const txPayload = {
      cashier: kasirInfo?.name || 'Kasir Hasuka',
      branch_id: outlet.id,
      shift_id: activeShiftId,
      subtotal,
      promo_discount: discount,
      manual_discount: 0,
      tax,
      total,
      payment_method: details?.method || 'CASH',
      cash_received: details?.cashReceived || total,
      change_amount: details?.changeAmount || 0,
      items: cart.map(i => ({
        product_id: i.id,
        product_name: i.name,
        qty: i.qty,
        unit_price: i.price,
        subtotal: i.price * i.qty,
        is_bundle: i.isBundle || false,
        bundle_id: i.bundleId || null,
        bundle_items: i.bundleProducts || null,
        notes: i.detailText ? `Isi: ${i.detailText}` : undefined
      })),
      timestamp: new Date().toISOString(),
      promo_name: appliedPromoDetails.join(', ')
    }

    let saveError: string | null = null
    let res: any = null
    try {
      res = await gasApi.createTransaction(txPayload)
    } catch (err: any) {
      console.warn('Gagal sinkron transaksi ke Google Sheets:', err)
      saveError = err.message || String(err)
    } finally {
      setIsSubmitting(false)
    }

    if (saveError) {
      // Transaksi masuk Outbox — beri alert destruktif, kasir harus tahu
      addToast({
        variant: 'destructive',
        title: 'Transaksi gagal tersimpan — koneksi terputus',
        description: `Data masuk antrian Outbox dan akan dikirim ulang saat online. JANGAN lepas pelanggan sebelum memastikan. (${saveError})`,
        actionLabel: 'Coba Kirim Ulang',
        onAction: async () => {
          try {
            await gasApi.createTransaction(txPayload)
            addToast({ variant: 'success', title: 'Transaksi berhasil dikirim ulang', durationMs: 3000 })
          } catch (e2: any) {
            addToast({ variant: 'destructive', title: 'Gagal lagi', description: e2.message })
          }
        },
      })
    } else {
      addToast({ variant: 'success', title: 'Transaksi tersimpan', description: 'Data berhasil dikirim ke Google Sheets', durationMs: 3000 })
      
      // Update local stock immediately
      if (res?.data?.deductions) {
        res.data.deductions.forEach((d: any) => {
          if (d.mode === "direct") {
            setProductsList(prev => prev.map(p => p.id === d.product_id ? { ...p, stock: d.new_stock } : p))
          } else {
            setIngredientsList(prev => prev.map(i => i.id === d.ingredient_id ? { ...i, current_stock: d.new_stock } : i))
          }
        })
      } else {
        // Optimistic local deduction (offline/outbox mode)
        cart.forEach(item => {
          if (item.isBundle && Array.isArray(item.bundleProducts)) {
            item.bundleProducts.forEach(bp => {
              const compQty = (bp.qty || 1) * item.qty
              const prod = productsList.find(p => p.id === bp.productId)
              if (prod?.stock_mode === 'direct') {
                setProductsList(prev => prev.map(p => p.id === bp.productId ? { ...p, stock: Math.max(0, (p.stock || 0) - compQty) } : p))
              } else {
                const pRecipes = recipesList.filter(r => r.product_id === bp.productId)
                pRecipes.forEach(r => {
                  setIngredientsList(prev => prev.map(ing => {
                    if (ing.id === r.ingredient_id && ing.is_tracked) {
                      return { ...ing, current_stock: Math.max(0, ing.current_stock - (r.qty_per_unit * compQty)) }
                    }
                    return ing
                  }))
                })
              }
            })
          } else {
            const prod = productsList.find(p => p.id === item.id)
            if (prod?.stock_mode === 'direct') {
              setProductsList(prev => prev.map(p => p.id === item.id ? { ...p, stock: Math.max(0, (p.stock || 0) - item.qty) } : p))
            } else {
              const pRecipes = recipesList.filter(r => r.product_id === item.id)
              pRecipes.forEach(r => {
                setIngredientsList(prev => prev.map(ing => {
                  if (ing.id === r.ingredient_id && ing.is_tracked) {
                    return { ...ing, current_stock: Math.max(0, ing.current_stock - (r.qty_per_unit * item.qty)) }
                  }
                  return ing
                }))
              })
            }
          }
        })
      }
    }

    setCart([])
    setIsCartExpanded(false)
    setIsPaymentOpen(false)
    onSuccess(txPayload)
  }

  const getProductPromoBadge = (p: Product) => {
    // 1. Cek promo aktif dari activePromos yang menarget produk ini
    for (const promo of activePromos) {
      // Promo bundling HANYA berlaku untuk menu paket di tab paket, TIDAK menandai produk satuan sebagai promo
      if (promo.type === 'bundling') continue

      let isMatch = false
      if (promo.scope === 'Semua Produk') {
        isMatch = true
      } else if (promo.scope === 'Produk Tertentu' && Array.isArray(promo.products)) {
        isMatch = promo.products.some((it: any) => (it.productId || it.id) === p.id)
      } else if (promo.type === 'gratis_item') {
        if (promo.scope === 'Semua Produk') isMatch = true
        else if (Array.isArray(promo.products) && promo.products.some((it: any) => (it.productId || it.id) === p.id)) isMatch = true
      }

      if (isMatch) {
        if (promo.type === 'diskon_persen') {
          return {
            text: `Diskon ${promo.value}%`,
            subText: promo.name || undefined,
            variant: 'percent' as const
          }
        }
        if (promo.type === 'diskon_nominal') {
          return {
            text: `Potongan Rp ${(promo.value || 0).toLocaleString('id-ID')}`,
            subText: promo.name || undefined,
            variant: 'nominal' as const
          }
        }
        if (promo.type === 'gratis_item') {
          const buyQty = promo.value || 1
          const freeName = promo.freeItem?.productName || '1 Menu'
          return {
            text: buyQty > 1 ? `Beli ${buyQty} Gratis 1` : 'Beli 1 Gratis 1',
            subText: promo.freeItem?.productName ? `+ Gratis ${freeName}` : promo.name,
            variant: 'b1g1' as const
          }
        }
        return {
          text: promo.name || 'Promo Khusus',
          subText: undefined,
          variant: 'special' as const
        }
      }
    }

    // 2. Cek harga coret langsung pada produk
    if (p.originalPrice && p.price && p.originalPrice > p.price) {
      const hemat = p.originalPrice - p.price
      return {
        text: `Hemat Rp ${hemat.toLocaleString('id-ID')}`,
        subText: p.promoText && p.promoText !== 'PROMO' && p.promoText !== 'Bundle' ? p.promoText : undefined,
        variant: 'direct' as const
      }
    }

    return null
  }

  const renderProductCard = (product: Product) => {
    const est = product.stock_mode === 'recipe' ? recipeStockEstimate(product.id, recipesList, ingredientsList) : null
    const isHabis = product.stock_mode === 'recipe' ? (est !== null && est.min <= 0) : product.stock <= 0
    const inCart = cart.find(i => i.id === product.id)
    const promoBadge = getProductPromoBadge(product)

    return (
      <div
        key={product.id}
        className="flex flex-col rounded-2xl overflow-hidden cursor-pointer group"
        style={{ opacity: isHabis ? 0.65 : 1 }}
        onClick={() => addToCart(product)}
      >
        {/* Photo with overlays */}
        <div className="relative overflow-hidden" style={{ borderRadius: 16, aspectRatio: '4/3' }}>
          <img
            src={product.img}
            alt={product.name}
            referrerPolicy="no-referrer"
            className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
          />

          {/* HABIS overlay */}
          {isHabis && (
            <div className="absolute inset-0 flex items-center justify-center" style={{ background: 'rgba(43,24,16,0.45)' }}>
              <span className="font-bold text-[12px] px-4 py-2 rounded-full" style={{ background: '#2B1810', color: '#F3E7CE', letterSpacing: '0.08em' }}>
                HABIS
              </span>
            </div>
          )}

          {/* PROMO badge - deskriptif & mudah dipahami kasir */}
          {promoBadge && (
            <div className="absolute top-2 left-2 max-w-[85%] z-10 pointer-events-none">
              <div
                className="flex flex-col items-start px-2 py-1 rounded-lg shadow-md"
                style={{
                  background: promoBadge.variant === 'b1g1'
                    ? 'linear-gradient(135deg, #059669 0%, #047857 100%)'
                    : promoBadge.variant === 'nominal'
                    ? 'linear-gradient(135deg, #7C3AED 0%, #6D28D9 100%)'
                    : 'linear-gradient(135deg, #FF6B35 0%, #E65100 100%)',
                  color: 'white',
                  boxShadow: '0 3px 8px rgba(0,0,0,0.3)'
                }}
              >
                <span className="font-extrabold text-[10px] leading-tight tracking-tight flex items-center gap-1">
                  <span>🔥</span>
                  <span>{promoBadge.text}</span>
                </span>
                {promoBadge.subText && (
                  <span className="text-[8px] font-semibold opacity-90 truncate max-w-[120px] leading-tight mt-0.5">
                    {promoBadge.subText}
                  </span>
                )}
              </div>
            </div>
          )}

          {/* In-cart indicator ring - elevated */}
          {inCart && (
            <div className="absolute top-2 right-2 w-7 h-7 rounded-full flex items-center justify-center font-extrabold text-[11px] shadow-lg"
              style={{ 
                background: 'linear-gradient(135deg, #8B4A1E 0%, #5B3510 100%)', 
                color: 'white',
                border: '2px solid white',
                boxShadow: '0 3px 10px rgba(139,74,30,0.5)'
              }}>
              {inCart.qty}
            </div>
          )}

          {/* Price overlay — glassmorphism at bottom */}
          <div
            className="absolute bottom-0 left-0 right-0 px-4 py-2"
              style={{ background: 'linear-gradient(to top, rgba(43,24,16,0.75) 0%, transparent 100%)' }}
            >
              <div className="flex items-center gap-2">
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
          {inCart && (
            <div
              className="flex items-center rounded-lg overflow-hidden shrink-0"
              style={{ border: '1.5px solid #8B4A1E', height: 28 }}
              onClick={e => e.stopPropagation()}
            >
              <button
                onClick={e => { e.stopPropagation(); updateQty(product.id, -1, product.name) }}
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
  }

  return (
    <div className="flex flex-col w-full h-full overflow-hidden" style={{ background: '#FAF6ED' }}>
      {/* Toast host — fixed top-right */}
      <AlertToastHost toasts={toasts} onDismiss={dismissToast} />
      {/* If owner is previewing Kasir mode, show prominent banner with direct return button */}
      {isUserOwner && (
        <div
          className="flex items-center justify-between px-6 py-2 shrink-0 z-20 shadow-md"
          style={{ background: '#2B1810', borderBottom: '2px solid #C49A62' }}
        >
          <div className="flex items-center gap-2.5">
            <span className="w-2.5 h-2.5 rounded-full animate-pulse" style={{ background: '#5B8A2E' }} />
            <span className="text-[12px] font-bold" style={{ color: '#F3E7CE' }}>
              Mode Kasir POS <span className="font-normal text-[11px] opacity-80">(Pratinjau Akses Pemilik • Bpk. Haryanto)</span>
            </span>
          </div>
          <Button
            variant="primary"
            size="sm"
            onClick={() => onNavigate && onNavigate('ownerDashboard')}
            icon={<ArrowLeft size={13} />}
            className="text-[11px] shadow"
          >
            Kembali ke Owner
          </Button>
        </div>
      )}

      {/* Main POS layout — responsive */}
      <div className="flex flex-1 w-full overflow-hidden relative">

        {/* ── ZONE 1A: Vertical Category Sidebar — tablet+ only ── */}
        <div className="hidden md:flex flex-col items-center shrink-0 z-10 w-[68px] lg:w-[72px]" style={{ background: '#2B1810' }}>
          {/* Logo mark */}
          <div className="py-3 flex items-center justify-center">
            <img src={HASUKA_LOGO} alt="Hasuka" className="w-9 h-9 object-contain rounded-full" />
          </div>
          <div className="w-10 mx-auto mb-3" style={{ height: 1, background: '#C49A6240' }} />
          {/* Category tabs */}
          <div className="flex flex-col gap-1 w-full px-1.5 flex-1 overflow-y-auto scrollbar-hide pb-1">
            {CATEGORIES.map(cat => {
              const active = activeCat === cat.id
              const Icon = cat.icon
              return (
                <button
                  key={cat.id}
                  onClick={() => setActiveCat(cat.id)}
                  title={cat.label}
                  className="flex flex-col items-center justify-center gap-1 py-2.5 rounded-xl transition-all"
                  style={{ background: active ? '#F3E7CE' : 'transparent', cursor: 'pointer' }}
                >
                  <Icon active={active} />
                  <span className="text-[9px] font-bold leading-none text-center" style={{ color: active ? '#2B1810' : '#C49A62' }}>
                    {cat.label}
                  </span>
                </button>
              )
            })}
          </div>
          <div className="w-10 mx-auto my-2 shrink-0" style={{ height: 1, background: '#C49A6240' }} />
          {/* Bottom: nav + status */}
          <div className="flex flex-col items-center gap-2.5 pb-3 shrink-0 w-full">
            <div className="flex flex-col items-center gap-0.5" title={isOnline ? 'Online' : 'Offline'}>
              {isOnline ? <Wifi size={14} color="#5B8A2E" /> : <WifiOff size={14} color="#C9A227" />}
              <span className="text-[8px] font-bold" style={{ color: isOnline ? '#5B8A2E' : '#C9A227' }}>
                {isOnline ? 'Live' : 'Offline'}
              </span>
            </div>
            <button onClick={() => setIsNavOpen(true)} className="flex flex-col items-center justify-center gap-0.5 w-11 h-10 rounded-xl transition-colors hover:bg-white/10" title="Menu Navigasi">
              <MenuIcon size={18} color="#C49A62" />
              <span className="text-[8px] font-bold" style={{ color: '#C49A62' }}>Menu</span>
            </button>
          </div>
        </div>

        {/* ── ZONE 2: Product List ── */}
        <div className="flex flex-col flex-1 overflow-hidden" style={{ borderRight: '1px solid #E8D7C0' }}>
          {/* ── Mobile-only: top bar (logo + nav + status + category horizontal scroll) ── */}
          <div className="flex md:hidden flex-col shrink-0" style={{ background: '#2B1810' }}>
            {/* Logo row */}
            <div className="flex items-center justify-between px-4 pt-3 pb-2">
              <div className="flex items-center gap-2">
                <img src={HASUKA_LOGO} alt="Hasuka" className="w-8 h-8 object-contain rounded-full" />
                <span className="font-serif font-bold text-[15px]" style={{ color: '#F3E7CE' }}>Hasuka POS</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="flex items-center gap-1" title={isOnline ? 'Online' : 'Offline'}>
                  {isOnline ? <Wifi size={13} color="#5B8A2E" /> : <WifiOff size={13} color="#C9A227" />}
                  <span className="text-[10px] font-bold" style={{ color: isOnline ? '#5B8A2E' : '#C9A227' }}>
                    {isOnline ? 'Live' : 'Offline'}
                  </span>
                </div>
                <button onClick={() => setIsNavOpen(true)} className="w-10 h-10 flex items-center justify-center rounded-xl hover:bg-white/10 transition-colors" title="Menu">
                  <MenuIcon size={20} color="#C49A62" />
                </button>
              </div>
            </div>
            {/* Category horizontal scroll */}
            <div className="flex gap-2 overflow-x-auto scrollbar-hide px-4 pb-3" style={{ scrollSnapType: 'x mandatory' }}>
              {CATEGORIES.map(cat => {
                const active = activeCat === cat.id
                const Icon = cat.icon
                return (
                  <button
                    key={cat.id}
                    onClick={() => setActiveCat(cat.id)}
                    className="flex flex-col items-center gap-1 px-4 py-2 rounded-xl shrink-0 transition-all"
                    style={{ background: active ? '#F3E7CE' : 'rgba(255,255,255,0.08)', scrollSnapAlign: 'start', minWidth: 56 }}
                  >
                    <Icon active={active} />
                    <span className="text-[9px] font-bold leading-none whitespace-nowrap" style={{ color: active ? '#2B1810' : '#C49A62' }}>
                      {cat.label}
                    </span>
                  </button>
                )
              })}
            </div>
          </div>

          {/* Search bar */}
          <div className="px-3 md:px-5 pt-3 md:pt-4 pb-3 shrink-0" style={{ borderBottom: '1px solid #E8D7C0' }}>
            <div className="relative">
              <label htmlFor="checkout-product-search" className="sr-only">Cari produk</label>
              <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: '#6B5448' }} aria-hidden="true" />
              <input
                id="checkout-product-search"
                type="text"
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Cari dimsum, minuman..."
                className="w-full pl-9 pr-4 py-2.5 text-sm font-medium rounded-xl outline-none transition-colors"
                style={{ background: '#F3E7CE', border: '1.5px solid #E8D7C0', color: '#2B1810' }}
                onFocus={e => { e.currentTarget.style.borderColor = '#8B4A1E' }}
                onBlur={e => { e.currentTarget.style.borderColor = '#E8D7C0' }}
              />
            </div>
          </div>

          {/* Product grid / Paket view */}
          <div className="flex-1 overflow-y-auto custom-scrollbar px-3 md:px-5 pt-3 pb-24 md:pb-4">
            {activeCat === 'paket' ? (
              <div className="space-y-6">
                {displayedBundles.length > 0 && (
                  <div>
                    <div className="flex items-center justify-between gap-2 mb-3">
                      <div className="flex items-center gap-2">
                        <Package size={18} color="#8B4A1E" />
                        <h3 className="font-serif font-bold text-[15px]" style={{ color: '#2B1810' }}>
                          Pilihan Paket & Bundling ({displayedBundles.length})
                        </h3>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3 gap-4">
                      {displayedBundles.map(bundle => {
                        const { isHabis, depletedItems } = getBundleStockStatus(bundle)
                        const cartCount = getBundleCartCount(bundle)
                        const regularTotal = bundle.bundleProducts?.reduce((sum: number, bp: any) => {
                          const pr = productsList.find(p => p.id === bp.productId)
                          return sum + (pr ? pr.price * (bp.qty || 1) : 0)
                        }, 0) || 0
                        const hemat = Math.max(0, regularTotal - bundle.value)
                        
                        // Kumpulkan gambar menu dari isi bundle
                        const bundleImgs = (bundle.bundleProducts || [])
                          .map((bp: any) => productsList.find(p => p.id === bp.productId)?.img)
                          .filter(Boolean)

                        return (
                          <div
                            key={bundle.id}
                            className={`flex flex-col justify-between rounded-2xl bg-white border ${
                              isHabis ? 'border-[#F8B4B4] bg-[#FFFBFB]' : 'border-[#E8D7C0] hover:border-[#C49A62]'
                            } shadow-sm hover:shadow-md transition-all overflow-hidden group`}
                          >
                            <div>
                              {/* Visual Header / Gallery */}
                              <div className="relative h-40 bg-[#FAF6ED] overflow-hidden border-b border-[#E8D7C0]/60">
                                {bundleImgs.length > 0 ? (
                                  <div className={`grid h-full ${bundleImgs.length >= 3 ? 'grid-cols-3' : bundleImgs.length === 2 ? 'grid-cols-2' : 'grid-cols-1'} gap-0.5 bg-[#E8D7C0]/40`}>
                                    {bundleImgs.slice(0, 3).map((imgUrl: string, idx: number) => (
                                      <div key={idx} className="relative h-full overflow-hidden bg-white">
                                        <img
                                          src={imgUrl}
                                          alt=""
                                          className={`w-full h-full object-cover transition-transform duration-300 group-hover:scale-105 ${
                                            isHabis ? 'grayscale-[30%] opacity-90' : ''
                                          }`}
                                          referrerPolicy="no-referrer"
                                        />
                                      </div>
                                    ))}
                                  </div>
                                ) : (
                                  <div className="w-full h-full flex flex-col items-center justify-center gap-2 bg-gradient-to-br from-[#FAF6ED] to-[#F3E7CE]">
                                    <Package size={32} color="#C49A62" />
                                    <span className="text-[12px] font-semibold text-[#8B4A1E]">Menu Paket Pilihan</span>
                                  </div>
                                )}

                                {/* Overlay Badges (Clean non-colliding bar) */}
                                <div className="absolute top-2.5 inset-x-2.5 flex items-center justify-between gap-1.5 z-10 pointer-events-none">
                                  <span
                                    className="font-bold text-[10px] px-2 py-0.5 rounded-md text-white shadow-sm flex items-center gap-1 shrink-0"
                                    style={{ background: 'linear-gradient(135deg, #FF6B35 0%, #F7931E 100%)' }}
                                  >
                                    🔥 Paket
                                  </span>

                                  {isHabis ? (
                                    <span className="flex items-center gap-1 px-2 py-0.5 rounded-md bg-[#B60000] text-white font-extrabold text-[10px] shadow-sm truncate">
                                      ⚠️ Stok Kurang ({depletedItems.length})
                                    </span>
                                  ) : hemat > 0 ? (
                                    <span className="font-extrabold text-[10px] px-2 py-0.5 rounded-md bg-[#2B1810]/85 text-[#F3E7CE] backdrop-blur-sm shadow-sm shrink-0">
                                      Hemat {fmt(hemat)}
                                    </span>
                                  ) : null}
                                </div>

                                {cartCount > 0 && (
                                  <div className="absolute bottom-2.5 right-2.5 px-3 py-1 rounded-full bg-[#8B4A1E] text-white font-extrabold text-[11px] shadow-lg border border-white z-10">
                                    {cartCount}x di Keranjang
                                  </div>
                                )}
                              </div>

                              {/* Card Content */}
                              <div className="p-4">
                                <div className="flex items-start justify-between gap-2 mb-1.5">
                                  <h4 className="font-serif font-bold text-[15px] leading-tight" style={{ color: '#2B1810' }}>
                                    {bundle.name}
                                  </h4>
                                </div>

                                <div className="flex items-baseline gap-2 mb-2">
                                  <span className="font-extrabold text-[17px] text-[#8B4A1E]">
                                    {fmt(bundle.value)}
                                  </span>
                                  {regularTotal > bundle.value && (
                                    <span className="text-[11px] text-[#6B5448]/70 line-through">
                                      {fmt(regularTotal)}
                                    </span>
                                  )}
                                </div>

                                {bundle.desc && (
                                  <p className="text-[11px] mb-3 line-clamp-2" style={{ color: '#6B5448' }}>
                                    {bundle.desc}
                                  </p>
                                )}

                                {/* Komposisi Menu Box */}
                                <div className={`p-2.5 rounded-xl border text-[11px] mb-2 ${
                                  isHabis ? 'bg-[#FFF5F5] border-[#F8B4B4]' : 'bg-[#FAF6ED] border-[#E8D7C0]'
                                }`}>
                                  <div className="flex items-center justify-between mb-1 pb-1 border-b border-black/5">
                                    <span className="font-bold text-[10px] text-[#8B4A1E] uppercase tracking-wider">
                                      Isi Paket ({bundle.bundleProducts?.length || 0} Menu):
                                    </span>
                                    {isHabis && (
                                      <span className="text-[9px] font-bold text-[#B60000]">
                                        *Ada stok habis
                                      </span>
                                    )}
                                  </div>

                                  <div className="space-y-1">
                                    {bundle.bundleProducts?.map((bp: any) => {
                                      const prod = productsList.find(p => p.id === bp.productId)
                                      const itemStock = prod ? getMaxQty(prod) : Infinity
                                      const isItemHabis = Number.isFinite(itemStock) && itemStock < (bp.qty || 1)

                                      return (
                                        <div key={bp.productId} className="flex justify-between items-center py-0.5 text-[11px]">
                                          <span className={`truncate font-medium pr-2 ${
                                            isItemHabis ? 'text-[#B60000] font-semibold line-through' : 'text-[#2B1810]'
                                          }`}>
                                            • {bp.qty || 1}x {bp.productName}
                                          </span>
                                          {isItemHabis ? (
                                            <span className="shrink-0 px-1.5 py-0.2 rounded text-[9px] font-bold bg-[#FEE2E2] text-[#B60000] border border-[#FCA5A5]">
                                              Habis
                                            </span>
                                          ) : Number.isFinite(itemStock) && itemStock <= 5 ? (
                                            <span className="shrink-0 text-[10px] text-[#D97706] font-semibold">
                                              Sisa {itemStock}
                                            </span>
                                          ) : null}
                                        </div>
                                      )
                                    })}
                                  </div>
                                </div>
                              </div>
                            </div>

                            {/* Action Button: Selalu bisa diklik sesuai permintaan user */}
                            <div className="p-4 pt-0">
                              <Button
                                variant={isHabis ? "secondary" : "primary"}
                                fullWidth
                                onClick={() => addBundleToCart(bundle)}
                                icon={<Plus size={15} />}
                                className={`py-2.5 text-[12px] font-bold shadow-sm ${
                                  isHabis ? '!bg-[#FDF0ED] !border-[#E8A598] !text-[#B60000] hover:!bg-[#FCE3DD]' : ''
                                }`}
                              >
                                {isHabis ? `Tetap Pesan Paket • ${fmt(bundle.value)}` : `Pesan Paket • ${fmt(bundle.value)}`}
                              </Button>
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  </div>
                )}

                {/* Menu berkategori 'paket' jika ada */}
                {filtered.length > 0 && (
                  <div>
                    <h3 className="font-serif font-bold text-[14px] text-[#2B1810] mb-3">
                      Menu Paket Lainnya ({filtered.length})
                    </h3>
                    <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 md:gap-4">
                      {filtered.map(product => renderProductCard(product))}
                    </div>
                  </div>
                )}

                {displayedBundles.length === 0 && filtered.length === 0 && (
                  <div className="flex flex-col items-center justify-center h-64 gap-3 opacity-50">
                    <CategoryIconPaket active={false} />
                    <p className="text-sm font-medium" style={{ color: '#6B5448' }}>Tidak ada paket ditemukan</p>
                  </div>
                )}
              </div>
            ) : (
              <div>
                {filtered.length === 0 && (
                  <div className="flex flex-col items-center justify-center h-full gap-4 opacity-50 py-10">
                    <CategoryIconKukus active={false} />
                    <p className="text-sm font-medium" style={{ color: '#6B5448' }}>Tidak ada produk ditemukan</p>
                  </div>
                )}
                <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 md:gap-4">
                  {filtered.map(product => renderProductCard(product))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* ── ZONE 3: Cart Panel — tablet+ side panel ── */}
        <div
          className="hidden md:flex flex-col shrink-0"
          style={{
            width: 'clamp(280px, 30vw, 340px)',
            background: '#F3E7CE',
            borderLeft: '4px solid #8B4A1E',
          }}
        >
        {/* Cart header: editable table name */}
        <div className="px-6 pt-5 pb-4 shrink-0" style={{ borderBottom: '1px solid #C49A6260' }}>
          <div className="flex items-start justify-between">
            <div>
              <p className="text-[11px] font-bold uppercase tracking-widest mb-1" style={{ color: '#6B5448' }}>Pesanan</p>
              {isEditingTable ? (
                <div className="flex items-center gap-2">
                  <input
                    autoFocus
                    value={tableNameDraft}
                    onChange={e => setTableNameDraft(e.target.value)}
                    onKeyDown={e => { if (e.key === 'Enter') { setTableName(tableNameDraft || tableName); setIsEditingTable(false) } if (e.key === 'Escape') setIsEditingTable(false) }}
                    className="font-serif font-bold text-[24px] leading-none w-36 outline-none rounded-lg px-2 py-0.5"
                    style={{ color: '#2B1810', background: 'white', border: '1.5px solid #8B4A1E' }}
                  />
                  <button onClick={() => { setTableName(tableNameDraft || tableName); setIsEditingTable(false) }} style={{ color: '#5B8A2E' }}>
                    <Check size={18} strokeWidth={3} />
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => { setTableNameDraft(tableName); setIsEditingTable(true) }}
                  className="flex items-center gap-2 group"
                  title="Klik untuk edit nama/nomor meja"
                >
                  <h2 className="font-serif text-[26px] font-bold leading-none" style={{ color: '#2B1810' }}>{tableName}</h2>
                  <Pencil size={14} color="#C49A62" className="opacity-80 hover:opacity-100 transition-opacity" />
                </button>
              )}
            </div>
            <div className="text-right">
              <p className="text-[11px] font-semibold" style={{ color: '#6B5448' }}>{kasirInfo?.name ?? 'Kasir'}</p>
              <p className="text-[10px]" style={{ color: '#8B4A1E' }}>Kasir</p>
            </div>
          </div>

          {cartCount > 0 && (
            <div className="mt-4 inline-flex items-center gap-2 px-3 py-1 rounded-full text-[11px] font-bold" style={{ background: '#8B4A1E', color: 'white' }}>
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
            cart.map((item) => (
              <div
                key={item.id}
                className="mx-3 mb-2 px-4 py-4 rounded-xl flex items-start gap-4 transition-all hover:shadow-md"
                style={{ 
                  background: 'linear-gradient(135deg, #ffffff 0%, #fafafa 100%)',
                  border: '1.5px solid #E8D7C0',
                  boxShadow: '0 2px 6px rgba(0,0,0,0.04)'
                }}
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-start gap-2 mb-0.5">
                    <p className="font-semibold text-[13px] leading-snug flex-1" style={{ color: '#2B1810' }}>
                      {item.name}
                    </p>
                    {item.isBundle ? (
                      <span
                        className="text-[9px] font-bold px-1.5 py-0.5 rounded shrink-0 mt-0.5"
                        style={{ background: '#8B4A1E', color: 'white' }}
                      >
                        PAKET
                      </span>
                    ) : item.promo ? (
                      <span
                        className="text-[9px] font-bold px-1 py-0.5 rounded shrink-0 mt-0.5"
                        style={{ background: '#DF690B', color: 'white' }}
                      >
                        PROMO
                      </span>
                    ) : null}
                  </div>

                  {item.detailText && (
                    <p className="text-[10px] text-[#6B5448] mb-1.5 leading-tight">
                      {item.detailText}
                    </p>
                  )}

                  <div className="flex items-center justify-between">
                    {/* Stepper */}
                    <div
                      className="flex items-center rounded-lg overflow-hidden"
                      style={{ border: '1px solid #C49A62', height: 30 }}
                    >
                      <button
                        onClick={() => updateQty(item.id, -1, item.name)}
                        className="w-8 h-full flex items-center justify-center transition-colors hover:bg-white/50"
                        style={{ color: '#8B4A1E' }}
                      >
                        <Minus size={12} strokeWidth={3} />
                      </button>
                      <span className="w-7 text-center font-extrabold text-[13px]" style={{ color: '#2B1810' }}>
                        {item.qty}
                      </span>
                      <button
                        onClick={() => updateQty(item.id, 1, item.name)}
                        className="w-8 h-full flex items-center justify-center transition-colors hover:bg-white/50"
                        style={{ color: '#8B4A1E' }}
                      >
                        <Plus size={12} strokeWidth={3} />
                      </button>
                    </div>

                    <div className="flex items-center gap-2.5">
                      <span className="font-extrabold text-[14px]" style={{ color: '#2B1810' }}>
                        {fmt(item.price * item.qty)}
                      </span>
                      <button 
                        onClick={() => removeItem(item.id, item.name)}
                        className="w-7 h-7 flex items-center justify-center rounded-full hover:bg-red-50 text-red-500 transition-colors"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {/* 🎁 Promo Item Gratis / B1G1 Claim Button 🎁 */}
        {freeItemClaims.length > 0 && (
          <div className="shrink-0 px-4 py-2 space-y-1.5" style={{ background: '#FAF6ED', borderTop: '1px solid #E8D7C0' }}>
            {freeItemClaims.map((claim, idx) => (
              <div key={idx} className="p-2.5 rounded-xl bg-[#EAF4E0] border border-[#B7E4C7] flex items-center justify-between gap-2 shadow-sm">
                <div className="flex items-center gap-2 min-w-0">
                  <Gift size={16} color="#2D6A4F" className="shrink-0 animate-bounce" />
                  <div className="min-w-0">
                    <p className="text-[11px] font-bold text-[#1B4332] truncate leading-tight">
                      {claim.label}
                    </p>
                    <p className="text-[9px] text-[#2D6A4F] truncate">
                      Promo: {claim.promoName}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => addToCart(claim.product, claim.qtyToAdd || 1)}
                  className="px-4 py-2 rounded-lg text-[11px] font-bold bg-[#2D6A4F] text-white hover:bg-[#1B4332] transition-all whitespace-nowrap shadow-sm active:scale-95 shrink-0"
                >
                  + Klaim {claim.qtyToAdd > 1 ? `${claim.qtyToAdd}x ` : ''}Gratis
                </button>
              </div>
            ))}
          </div>
        )}

        {/* Cart summary + pay button */}
        <div className="shrink-0 px-6 pb-5 pt-3" style={{ borderTop: '1.5px solid #C49A62' }}>
          <div className="space-y-1.5 mb-4">
            <div className="flex justify-between text-[12px]">
              <span style={{ color: '#6B5448' }}>Subtotal</span>
              <span className="font-semibold" style={{ color: '#2B1810' }}>{fmt(subtotal)}</span>
            </div>
            {discount > 0 && (
              <div className="flex justify-between text-[12px] items-start">
                <div className="flex flex-col">
                  <span style={{ color: '#DF690B', fontWeight: 600 }}>Diskon Promo</span>
                  {appliedPromoDetails.length > 0 && (
                    <span className="text-[10px]" style={{ color: '#8B4A1E' }}>
                      ({appliedPromoDetails.join(', ')})
                    </span>
                  )}
                </div>
                <span className="font-bold text-[13px]" style={{ color: '#DF690B' }}>-{fmt(discount)}</span>
              </div>
            )}
            {tax > 0 && (
              <div className="flex justify-between text-[12px]">
                <span style={{ color: '#6B5448' }}>Pajak PPN {taxRate}%</span>
                <span className="font-semibold" style={{ color: '#2B1810' }}>{fmt(tax)}</span>
              </div>
            )}
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
          <Button
            variant="primary"
            fullWidth
            onClick={() => cart.length > 0 && setIsPaymentOpen(true)}
            disabled={cart.length === 0}
            className="py-4 text-[15px] flex items-center justify-between px-6 group"
          >
            <span>BAYAR</span>
            <span className="flex items-center gap-1">
              <span className="font-extrabold">{fmt(total)}</span>
              <ChevronRight size={18} className="group-hover:translate-x-0.5 transition-transform" />
            </span>
          </Button>
        </div>
        </div>

        {/* ── ZONE 3B: Mobile Cart Bottom Sheet ── */}
        <div className="md:hidden">
          {/* Backdrop when expanded */}
          {isCartExpanded && (
            <div
              className="fixed inset-0 z-30 bg-black/40"
              onClick={() => setIsCartExpanded(false)}
            />
          )}

          {/* Bottom sheet panel */}
          <div
            className="fixed bottom-0 left-0 right-0 z-40 flex flex-col transition-all duration-300 rounded-t-2xl shadow-2xl overflow-hidden"
            style={{
              background: '#F3E7CE',
              borderTop: '3px solid #8B4A1E',
              maxHeight: isCartExpanded ? '85vh' : 'auto',
            }}
          >
            {/* Collapsed: floating summary bar */}
            {!isCartExpanded ? (
              <div className="flex flex-col w-full">
                {/* 🎁 Promo B1G1 claim alert strip on collapsed mobile bar 🎁 */}
                {freeItemClaims.length > 0 && (
                  <div
                    onClick={() => setIsCartExpanded(true)}
                    className="px-4 py-2 bg-[#EAF4E0] border-b border-[#B7E4C7] flex items-center justify-between cursor-pointer active:bg-[#d8ebd1] transition-colors"
                  >
                    <span className="flex items-center gap-1.5 text-[11px] font-bold text-[#1B4332]">
                      <Gift size={15} color="#2D6A4F" className="animate-bounce shrink-0" />
                      <span>Ada {freeItemClaims.length} promo gratis (B1G1)</span>
                    </span>
                    <span className="text-[11px] font-bold text-[#2D6A4F] flex items-center gap-0.5">
                      Klaim Sekarang →
                    </span>
                  </div>
                )}
                <button
                  className="flex items-center justify-between px-4 py-3.5 w-full"
                  onClick={() => cart.length > 0 && setIsCartExpanded(true)}
                  style={{ cursor: cart.length > 0 ? 'pointer' : 'default' }}
                >
                  <div className="flex items-center gap-2">
                    <ShoppingCart size={18} style={{ color: '#8B4A1E' }} />
                    <span className="font-bold text-[13px]" style={{ color: '#2B1810' }}>
                      {cartCount > 0 ? `${cartCount} item` : 'Keranjang kosong'}
                    </span>
                    {cartCount > 0 && (
                      <span className="text-[11px]" style={{ color: '#6B5448' }}>· Ketuk untuk detail</span>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="font-serif font-bold text-[16px]" style={{ color: '#8B4A1E' }}>{fmt(total)}</span>
                    <Button
                      variant="primary"
                      onClick={e => { e.stopPropagation(); if (cart.length > 0) setIsPaymentOpen(true) }}
                      disabled={cart.length === 0}
                      className="px-4 py-2 text-[13px]"
                      style={{ minHeight: 40 }}
                    >
                      BAYAR
                    </Button>
                  </div>
                </button>
              </div>
            ) : (
              // Expanded: full cart detail
              <>
                {/* Sheet header */}
                <div className="flex items-center justify-between px-4 pt-4 pb-3 shrink-0" style={{ borderBottom: '1px solid #C49A6260' }}>
                  <div>
                    <p className="text-[11px] font-bold uppercase tracking-widest mb-0.5" style={{ color: '#6B5448' }}>Pesanan</p>
                    {isEditingTable ? (
                      <div className="flex items-center gap-2">
                        <input
                          autoFocus
                          value={tableNameDraft}
                          onChange={e => setTableNameDraft(e.target.value)}
                          onKeyDown={e => { if (e.key === 'Enter') { setTableName(tableNameDraft || tableName); setIsEditingTable(false) } if (e.key === 'Escape') setIsEditingTable(false) }}
                          className="font-serif font-bold text-[20px] leading-none w-32 outline-none rounded-lg px-2 py-0.5"
                          style={{ color: '#2B1810', background: 'white', border: '1.5px solid #8B4A1E' }}
                        />
                        <button onClick={() => { setTableName(tableNameDraft || tableName); setIsEditingTable(false) }} style={{ color: '#5B8A2E' }}>
                          <Check size={16} strokeWidth={3} />
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={() => { setTableNameDraft(tableName); setIsEditingTable(true) }}
                        className="flex items-center gap-2 group"
                        title="Ketuk untuk edit nama/nomor meja"
                      >
                        <h2 className="font-serif font-bold text-[20px] leading-none" style={{ color: '#2B1810' }}>{tableName}</h2>
                        <Pencil size={13} color="#C49A62" className="opacity-80" />
                      </button>
                    )}
                  </div>
                  <button
                    onClick={() => setIsCartExpanded(false)}
                    className="w-10 h-10 flex items-center justify-center rounded-xl hover:bg-black/10 transition-colors"
                  >
                    <ChevronUp size={20} style={{ color: '#6B5448' }} />
                  </button>
                </div>

                {/* Items list */}
                <div className="flex-1 overflow-y-auto py-1">
                  {cart.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-8 gap-4 opacity-60">
                      <CategoryIconKukus active={false} />
                      <p className="text-sm font-medium" style={{ color: '#2B1810' }}>Belum Ada Pesanan</p>
                    </div>
                  ) : (
                    cart.map((item, idx) => (
                      <div key={item.id} className="px-4 py-4 flex items-start gap-4" style={{ borderBottom: idx < cart.length - 1 ? '1px solid #C49A6240' : 'none' }}>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start gap-2 mb-1">
                            <p className="font-semibold text-[13px] leading-snug flex-1" style={{ color: '#2B1810' }}>{item.name}</p>
                            {item.isBundle ? (
                              <span className="text-[9px] font-bold px-1.5 py-0.5 rounded shrink-0 mt-0.5" style={{ background: '#8B4A1E', color: 'white' }}>PAKET</span>
                            ) : item.promo ? (
                              <span className="text-[9px] font-bold px-1 py-0.5 rounded shrink-0 mt-0.5" style={{ background: '#DF690B', color: 'white' }}>PROMO</span>
                            ) : null}
                          </div>
                          {item.detailText && (
                            <p className="text-[10px] text-[#6B5448] mb-2 leading-tight">
                              {item.detailText}
                            </p>
                          )}
                          <div className="flex items-center justify-between">
                            <div className="flex items-center rounded-lg overflow-hidden" style={{ border: '1px solid #C49A62', height: 36 }}>
                              <button onClick={() => updateQty(item.id, -1, item.name)} className="w-10 h-full flex items-center justify-center hover:bg-white/50" style={{ color: '#8B4A1E' }}>
                                <Minus size={12} strokeWidth={3} />
                              </button>
                              <span className="w-8 text-center font-extrabold text-[13px]" style={{ color: '#2B1810' }}>{item.qty}</span>
                              <button onClick={() => updateQty(item.id, 1, item.name)} className="w-10 h-full flex items-center justify-center hover:bg-white/50" style={{ color: '#8B4A1E' }}>
                                <Plus size={12} strokeWidth={3} />
                              </button>
                            </div>
                            <div className="flex items-center gap-2.5">
                              <span className="font-extrabold text-[14px]" style={{ color: '#2B1810' }}>{fmt(item.price * item.qty)}</span>
                              <button onClick={() => removeItem(item.id, item.name)} className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-red-50 text-red-500">
                                <Trash2 size={16} />
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>

                {/* 🎁 Promo Item Gratis / B1G1 Claim Button (Mobile) 🎁 */}
                {freeItemClaims.length > 0 && (
                  <div className="shrink-0 px-4 py-2 space-y-1.5" style={{ background: '#FAF6ED', borderTop: '1px solid #E8D7C0' }}>
                    {freeItemClaims.map((claim, idx) => (
                      <div key={idx} className="p-2.5 rounded-xl bg-[#EAF4E0] border border-[#B7E4C7] flex items-center justify-between gap-2 shadow-sm">
                        <div className="flex items-center gap-2 min-w-0">
                          <Gift size={16} color="#2D6A4F" className="shrink-0 animate-bounce" />
                          <div className="min-w-0">
                            <p className="text-[11px] font-bold text-[#1B4332] truncate leading-tight">
                              {claim.label}
                            </p>
                            <p className="text-[9px] text-[#2D6A4F] truncate">
                              Promo: {claim.promoName}
                            </p>
                          </div>
                        </div>
                        <button
                          onClick={() => addToCart(claim.product, claim.qtyToAdd || 1)}
                          className="px-3.5 py-1.5 rounded-lg text-[11px] font-bold bg-[#2D6A4F] text-white hover:bg-[#1B4332] transition-all whitespace-nowrap shadow-sm active:scale-95 shrink-0"
                        >
                          + Klaim {claim.qtyToAdd > 1 ? `${claim.qtyToAdd}x ` : ''}Gratis
                        </button>
                      </div>
                    ))}
                  </div>
                )}

                {/* Summary + pay */}
                <div className="shrink-0 px-4 pb-5 pt-3" style={{ borderTop: '1.5px solid #C49A62' }}>
                  <div className="space-y-1.5 mb-4">
                    <div className="flex justify-between text-[12px]"><span style={{ color: '#6B5448' }}>Subtotal</span><span className="font-semibold" style={{ color: '#2B1810' }}>{fmt(subtotal)}</span></div>
                    {discount > 0 && <div className="flex justify-between text-[12px]"><span style={{ color: '#DF690B' }}>Diskon Promo</span><span className="font-bold" style={{ color: '#DF690B' }}>-{fmt(discount)}</span></div>}
                    {tax > 0 && <div className="flex justify-between text-[12px]"><span style={{ color: '#6B5448' }}>Pajak PPN {taxRate}%</span><span className="font-semibold" style={{ color: '#2B1810' }}>{fmt(tax)}</span></div>}
                  </div>
                  <div className="flex justify-between items-baseline mb-4 pb-3" style={{ borderTop: '1.5px solid #C49A6280', paddingTop: 12 }}>
                    <span className="font-serif font-bold text-[15px]" style={{ color: '#2B1810' }}>TOTAL</span>
                    <span className="font-serif font-bold text-[22px]" style={{ color: '#8B4A1E' }}>{fmt(total)}</span>
                  </div>
                  <Button
                    variant="primary"
                    fullWidth
                    onClick={() => { setIsCartExpanded(false); if (cart.length > 0) setIsPaymentOpen(true) }}
                    disabled={cart.length === 0}
                    className="py-4 text-[15px] flex items-center justify-between px-6"
                    style={{ minHeight: 52 }}
                  >
                    <span>BAYAR</span>
                    <span className="font-extrabold">{fmt(total)}</span>
                  </Button>
                </div>
              </>
            )}
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
            <div className="px-6 pt-5 pb-4 shrink-0 flex items-start justify-between" style={{ borderBottom: '1px solid #C49A6230' }}>
              <div className="flex items-center gap-4">
                <img src={HASUKA_LOGO} alt="Hasuka" className="w-11 h-11 object-contain rounded-full shrink-0" />
                <div>
                  <h2 className="font-serif font-bold text-[17px] leading-tight" style={{ color: '#F3E7CE' }}>Hasuka POS</h2>
                  <p className="text-[11px] mt-0.5" style={{ color: '#C49A62' }}>{kasirInfo?.name || 'Kasir'} · Kasir</p>
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
              {isUserOwner && (
                <button
                  className="w-full text-left flex items-center gap-4 px-4 py-2.5 rounded-xl transition-all mb-2 cursor-pointer shadow-sm"
                  style={{ background: '#8B4A1E', border: '1px solid #C49A62' }}
                  onClick={() => {
                    setIsNavOpen(false)
                    if (onNavigate) onNavigate('ownerDashboard')
                  }}
                >
                  <div className="shrink-0 w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: '#2B1810' }}>
                    <Building2 size={16} color="#C49A62" />
                  </div>
                  <div className="min-w-0">
                    <p className="font-bold text-[13px] leading-tight text-white">Kembali ke Owner</p>
                    <p className="text-[10px] truncate text-[#F3E7CE]">Command Center Pemilik</p>
                  </div>
                </button>
              )}
              {([
                { label: 'Kasir',             key: 'checkout',       desc: 'Halaman utama transaksi',     Icon: Store },
                { label: 'Laporan',           key: 'reports',        desc: 'Omzet & analitik penjualan',  Icon: BarChart2 },
                { label: 'Petty Cash',        key: 'pettyCash',      desc: 'Catat pengeluaran kas kecil', Icon: Wallet },
                { label: 'Manajemen Produk',  key: 'manageProducts', desc: 'Kelola menu & stok',          Icon: Package },
                { label: 'Faktur Stok Masuk', key: 'stockIn',        desc: 'Catat stok yang masuk',       Icon: Package },
                { label: 'Manajemen Promo',   key: 'managePromo',    desc: 'Diskon & promo aktif',        Icon: Tag },
                { label: 'Stok Opname',       key: 'stokOpname',     desc: 'Hitung fisik stok',           Icon: ClipboardList },
                // { label: 'QR Menu',           key: 'qrMenu',         desc: 'Tampilan menu pelanggan',     Icon: QrCode },
                { label: 'Pengaturan',        key: 'settings',       desc: 'Printer, QRIS, pajak',        Icon: Settings },
              ] as const).map(nav => (
                <button
                  key={nav.key}
                  className="w-full text-left flex items-center gap-4 px-4 py-2.5 rounded-xl transition-colors hover:bg-white/10 active:bg-white/20"
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
            <div className="shrink-0 px-2 py-4" style={{ borderTop: '1px solid #C49A6230' }}>
              <button
                className="w-full flex items-center gap-4 px-4 py-2.5 rounded-xl transition-colors hover:bg-red-900/30 active:bg-red-900/50"
                onClick={() => {
                  setIsNavOpen(false)
                  if (onNavigate) onNavigate('tutupShift')
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

      {/* ── Submitting Overlay ─────────────────────────────────────────── */}
      {isSubmitting && (
        <div className="fixed inset-0 z-[100] flex flex-col items-center justify-center bg-black/60 backdrop-blur-sm text-white animate-in fade-in">
          <div className="w-14 h-14 border-4 border-amber-200/30 border-t-amber-400 rounded-full animate-spin mb-4 shadow-lg" />
          <p className="font-bold text-[16px] tracking-wide">Menyimpan Transaksi ke Google Sheets...</p>
          <p className="text-[12px] text-amber-200/90 mt-1">Mengurangi stok resep & mencatat penjualan</p>
        </div>
      )}

      {/* ── Payment Modal ─────────────────────────────────────────────────── */}
      <PaymentModal 
        isOpen={isPaymentOpen} 
        onClose={() => !isSubmitting && setIsPaymentOpen(false)} 
        onSuccess={handlePaymentSuccess} 
        totalAmount={total} 
        subtotal={subtotal - discount}
        taxAmount={tax}
        serviceAmount={serviceChargeAmount}
        isSubmitting={isSubmitting}
      />

      {/* ── Remove Item Modal ─────────────────────────────────────────────────── */}
      {itemToRemove && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60 backdrop-blur-sm px-4">
          <div className="w-full max-w-sm rounded-3xl p-6" style={{ background: '#F3E7CE' }}>
            <h3 className="font-bold text-[18px] text-[#2B1810] mb-2">Hapus Pesanan?</h3>
            <p className="text-[#6B5448] text-[14px] mb-6">
              Hapus <strong>{itemToRemove.name}</strong> dari pesanan?
            </p>
            <div className="flex gap-4">
              <Button 
                variant="secondary"
                onClick={() => setItemToRemove(null)}
                className="flex-1 py-4"
              >
                Batal
              </Button>
              <Button 
                variant="destructive"
                onClick={() => {
                  setCart(prev => prev.filter(i => i.id !== itemToRemove.id))
                  setItemToRemove(null)
                }}
                className="flex-1 py-4"
              >
                Hapus
              </Button>
            </div>
          </div>
        </div>
      )}
      </div>
    </div>
  )
}
