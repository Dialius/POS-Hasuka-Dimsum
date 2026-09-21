// Utility functions for formatting
export const formatCurrency = (value: number): string => {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
  }).format(value);
};

export const formatNumber = (value: number): string => {
  return new Intl.NumberFormat('id-ID').format(value);
};

export const formatPercentage = (value: number, decimals: number = 0): string => {
  return `${value.toFixed(decimals)}%`;
};

export const formatDate = (date: Date | string): string => {
  const d = typeof date === 'string' ? new Date(date) : date;
  return d.toLocaleDateString('id-ID', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
};

export const formatDateTime = (date: Date | string): string => {
  const d = typeof date === 'string' ? new Date(date) : date;
  return d.toLocaleString('id-ID', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
};

export const formatTime = (date: Date | string): string => {
  const d = typeof date === 'string' ? new Date(date) : date;
  return d.toLocaleTimeString('id-ID', {
    hour: '2-digit',
    minute: '2-digit',
  });
};

// Short currency formatter (used across many components as 'fmt')
export const fmt = (n: number): string => `Rp ${n.toLocaleString('id-ID')}`;

// Recipe stock estimation helper
export function recipeStockEstimate(
  productId: number,
  recipesList: Array<{ product_id: number; ingredient_id: number; qty_per_unit: number }>,
  ingredientsList: Array<{ id: number; name: string; current_stock: number; is_tracked: boolean }>
): { min: number; unit: string } | null {
  const recipes = recipesList.filter(r => r.product_id === productId);
  if (recipes.length === 0) return null;
  let minPortions = Infinity;
  let limitUnit = '';
  for (const r of recipes) {
    const ing = ingredientsList.find(i => i.id === r.ingredient_id);
    if (!ing || !ing.is_tracked) continue;
    const possible = Math.floor(ing.current_stock / r.qty_per_unit);
    if (possible < minPortions) {
      minPortions = possible;
      limitUnit = ing.name;
    }
  }
  return minPortions === Infinity ? null : { min: minPortions, unit: limitUnit };
}
