const assert = require('assert');

// 1. Test Recipe Bottleneck
function recipeStockEstimate(recipes, ingredients) {
  let min = Infinity;
  for (const r of recipes) {
    const ing = ingredients.find(i => i.id === r.ingredient_id);
    if (!ing || !ing.is_tracked) continue;
    const possible = Math.floor(ing.current_stock / r.qty_per_unit);
    if (possible < min) min = possible;
  }
  return min === Infinity ? null : min;
}

const ingredients = [
  { id: 1, name: 'Sumpit', current_stock: 120, is_tracked: true },
  { id: 2, name: 'Chili oil', current_stock: 100, is_tracked: true },
  { id: 3, name: 'Box kertas', current_stock: 150, is_tracked: true },
  { id: 4, name: 'Saus dimsum', current_stock: 130, is_tracked: true }
];

const recipes = [
  { product_id: 10, ingredient_id: 1, qty_per_unit: 1 },
  { product_id: 10, ingredient_id: 2, qty_per_unit: 1 },
  { product_id: 10, ingredient_id: 3, qty_per_unit: 1 },
  { product_id: 10, ingredient_id: 4, qty_per_unit: 1 }
];

const portions = recipeStockEstimate(recipes, ingredients);
console.log('Bottleneck portion estimate:', portions);
assert.strictEqual(portions, 100, 'Portion should equal bottleneck ingredient (100)');

// 2. Test Multi-Portion Deduction (5 portions)
const qtySold = 5;
recipes.forEach(r => {
  const ing = ingredients.find(i => i.id === r.ingredient_id);
  const deduction = r.qty_per_unit * qtySold;
  ing.current_stock -= deduction;
});

console.log('Stock after 5 portions sold:');
ingredients.forEach(i => console.log(`  - ${i.name}: ${i.current_stock}`));
assert.strictEqual(ingredients.find(i => i.name === 'Chili oil').current_stock, 95);
assert.strictEqual(ingredients.find(i => i.name === 'Sumpit').current_stock, 115);

// 3. Test Negative Stock
const directProduct = { id: 99, stock: 0 };
directProduct.stock -= 5;
console.log('Direct product stock from 0 after selling 5:', directProduct.stock);
assert.strictEqual(directProduct.stock, -5);

console.log('ALL VERIFICATION CHECKS PASSED!');
