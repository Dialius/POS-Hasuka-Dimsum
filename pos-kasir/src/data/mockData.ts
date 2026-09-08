// Shared mock data — semua screen baca dari sini
// ponytail: flat arrays, no normalization layer — upgrade ke zustand/context kalau perlu shared mutations

export interface Ingredient {
  id: number
  name: string
  unit: string          // pcs, pasang, porsi, gram, botol, dll
  current_stock: number
  min_stock_threshold: number
  is_tracked: boolean   // FALSE = tidak dipotong dan tidak dapat alert
  outlets?: 'all' | string[]
}

export interface Recipe {
  id: number
  product_id: number
  ingredient_id: number
  qty_per_unit: number  // berapa unit ingredient per 1 unit produk terjual
}

export interface Product {
  id: number
  name: string
  cat: string
  price: number
  cost: number
  stock_mode: 'recipe' | 'direct' | 'simple'
  stock: number         // hanya relevan kalau stock_mode = 'direct'
  minStock: number      // hanya relevan kalau stock_mode = 'direct'
  promo: boolean
  promoText?: string
  originalPrice?: number
  img?: string
  outlets?: 'all' | string[]
}

export const INGREDIENTS: Ingredient[] = [
  { id: 1, name: 'Dimsum Ayam (mentah)', unit: 'pcs', current_stock: 180, min_stock_threshold: 50, is_tracked: true, outlets: 'all' },
  { id: 2, name: 'Dimsum Udang (mentah)', unit: 'pcs', current_stock: 95, min_stock_threshold: 30, is_tracked: true, outlets: 'all' },
  { id: 3, name: 'Dimsum Nori (mentah)', unit: 'pcs', current_stock: 60, min_stock_threshold: 20, is_tracked: true, outlets: 'all' },
  { id: 4, name: 'Wadah Foil 4-in-1', unit: 'pcs', current_stock: 45, min_stock_threshold: 20, is_tracked: true, outlets: 'all' },
  { id: 5, name: 'Wadah Foil 6-in-1', unit: 'pcs', current_stock: 38, min_stock_threshold: 15, is_tracked: true, outlets: 'all' },
  { id: 6, name: 'Sumpit Bambu', unit: 'pasang', current_stock: 120, min_stock_threshold: 30, is_tracked: true, outlets: 'all' },
  { id: 7, name: 'Saus Mentai', unit: 'porsi', current_stock: 200, min_stock_threshold: 50, is_tracked: false, outlets: 'all' },
  { id: 8, name: 'Chili Oil', unit: 'porsi', current_stock: 150, min_stock_threshold: 40, is_tracked: false, outlets: 'all' },
  { id: 9, name: 'Keju Mozzarella', unit: 'gram', current_stock: 850, min_stock_threshold: 200, is_tracked: true, outlets: 'all' },
  { id: 10, name: 'Paper Bag Hasuka', unit: 'pcs', current_stock: 75, min_stock_threshold: 25, is_tracked: true, outlets: 'all' },
  { id: 11, name: 'Teh Liang Botol', unit: 'botol', current_stock: 24, min_stock_threshold: 10, is_tracked: true, outlets: 'all' },
]

// Resep per produk
export const RECIPES: Recipe[] = [
  // Siao May Ayam Udang (Isi 3) — product_id: 1
  { id: 1,  product_id: 1, ingredient_id: 1,  qty_per_unit: 3 },
  { id: 2,  product_id: 1, ingredient_id: 4,  qty_per_unit: 1 },
  { id: 3,  product_id: 1, ingredient_id: 6,  qty_per_unit: 1 },

  // Hakau Udang Garing (Isi 3) — product_id: 2
  { id: 5,  product_id: 2, ingredient_id: 2,  qty_per_unit: 3 },
  { id: 6,  product_id: 2, ingredient_id: 4,  qty_per_unit: 1 },
  { id: 7,  product_id: 2, ingredient_id: 6,  qty_per_unit: 1 },

  // Bakpao Durian Pasir Emas — product_id: 3
  { id: 8,  product_id: 3, ingredient_id: 10, qty_per_unit: 2 },
  { id: 9,  product_id: 3, ingredient_id: 4,  qty_per_unit: 1 },
  { id: 10, product_id: 3, ingredient_id: 6,  qty_per_unit: 1 },

  // Lumpia Kulit Tahu Goreng — product_id: 4
  { id: 11, product_id: 4, ingredient_id: 11, qty_per_unit: 3 },
  { id: 12, product_id: 4, ingredient_id: 5,  qty_per_unit: 1 },
  { id: 13, product_id: 4, ingredient_id: 6,  qty_per_unit: 1 },

  // Ceker Ayam Saus Szechuan — product_id: 5
  { id: 14, product_id: 5, ingredient_id: 3,  qty_per_unit: 4 },
  { id: 15, product_id: 5, ingredient_id: 5,  qty_per_unit: 1 },
  { id: 16, product_id: 5, ingredient_id: 6,  qty_per_unit: 1 },
]

export const PRODUCTS: Product[] = [
  { id: 1, name: 'Siao May Ayam Udang (Isi 3)', cat: 'kukus', price: 24000, cost: 18000, stock_mode: 'recipe', stock: 0, minStock: 0, promo: false, img: 'https://images.unsplash.com/photo-1563245372-f21724e3856d?w=400', outlets: 'all' },
  { id: 2, name: 'Hakau Udang Garing (Isi 3)', cat: 'kukus', price: 21000, cost: 15000, stock_mode: 'recipe', stock: 0, minStock: 0, promo: true, promoText: '25%', originalPrice: 28000, img: 'https://images.unsplash.com/photo-1496116218417-1a781b1c416c?w=400', outlets: 'all' },
  { id: 3, name: 'Bakpao Durian Pasir Emas', cat: 'kukus', price: 26000, cost: 19000, stock_mode: 'recipe', stock: 0, minStock: 0, promo: false, img: 'https://images.unsplash.com/photo-1577906096429-f73c2c312435?w=400', outlets: 'all' },
  { id: 4, name: 'Lumpia Kulit Tahu Goreng', cat: 'goreng', price: 23000, cost: 16000, stock_mode: 'recipe', stock: 0, minStock: 0, promo: false, img: 'https://images.unsplash.com/photo-1563245372-f21724e3856d?w=400', outlets: 'all' },
  { id: 5, name: 'Ceker Ayam Saus Szechuan', cat: 'goreng', price: 19500, cost: 14000, stock_mode: 'recipe', stock: 0, minStock: 0, promo: false, img: 'https://images.unsplash.com/photo-1563245372-f21724e3856d?w=400', outlets: 'all' },
  { id: 6, name: 'Tahu Crispy Isi Udang', cat: 'goreng', price: 17000, cost: 12000, stock_mode: 'recipe', stock: 0, minStock: 0, promo: false, img: 'https://images.unsplash.com/photo-1563245372-f21724e3856d?w=400', outlets: 'all' },
  { id: 7, name: 'Teh Liang Dingin Manis', cat: 'minuman', price: 8000, cost: 4000, stock_mode: 'simple', stock: 20, minStock: 5, promo: false, img: 'https://images.unsplash.com/photo-1556679343-c7306c1976bc?w=400', outlets: 'all' },
  { id: 8, name: 'Es Jeruk Peras Segar', cat: 'minuman', price: 10000, cost: 5000, stock_mode: 'simple', stock: 15, minStock: 5, promo: false, img: 'https://images.unsplash.com/photo-1613478223719-2ab802602423?w=400', outlets: 'all' },
  { id: 9, name: 'Kopi Susu Aren', cat: 'minuman', price: 14000, cost: 7000, stock_mode: 'simple', stock: 12, minStock: 5, promo: false, img: 'https://images.unsplash.com/photo-1461023058943-07fcbe16d735?w=400', outlets: 'all' },
  { id: 10, name: 'Onde-Onde Kacang Hijau', cat: 'snack', price: 7000, cost: 3500, stock_mode: 'simple', stock: 30, minStock: 10, promo: false, img: 'https://images.unsplash.com/photo-1563245372-f21724e3856d?w=400', outlets: 'all' },
]

// Helper: kurangi stok ingredients berdasarkan 1 item transaksi
// Mirror dari logic Apps Script yang akan jalan di Google Sheets
export function deductStock(
  ingredients: Ingredient[],
  recipes: Recipe[],
  productId: number,
  qtySold: number
): Ingredient[] {
  const productRecipes = recipes.filter(r => r.product_id === productId)
  return ingredients.map(ing => {
    const recipe = productRecipes.find(r => r.ingredient_id === ing.id)
    if (!recipe || !ing.is_tracked) return ing
    return { ...ing, current_stock: Math.max(0, ing.current_stock - recipe.qty_per_unit * qtySold) }
  })
}
