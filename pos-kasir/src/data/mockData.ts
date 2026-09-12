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

export const INGREDIENTS: Ingredient[] = []

// Resep per produk
export const RECIPES: Recipe[] = []

export const PRODUCTS: Product[] = []

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
