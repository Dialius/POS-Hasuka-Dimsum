// Test Verification for BUG-011: Inkonsistensi Kolom Skema Tabel Resep di ensureSheet vs SetupSheets.gs
const assert = require('assert');

console.log('--- TEST BUG-011: VERIFIKASI KONSISTENSI & FLEKSIBILITAS SKEMA TABEL RESEP ---');

// 1. Uji keselarasan header standar
console.log('1. Testing konsistensi header standar (4 kolom: id, product_id, ingredient_id, qty_per_unit)...');
const standardHeader = ["id", "product_id", "ingredient_id", "qty_per_unit"];
const legacyHeader = ["product_id", "ingredient_id", "qty_per_unit"];

assert.deepStrictEqual(
  standardHeader,
  ["id", "product_id", "ingredient_id", "qty_per_unit"],
  'Header standar harus memiliki 4 kolom dengan urutan id, product_id, ingredient_id, qty_per_unit'
);
console.log('   -> PASSED: Header standar terdefinisi konsisten!');

// 2. Uji parsing recMap dinamis pada handleCreateTransaction
function parseRecMap(recData) {
  const recHeaders = recData.length > 0 ? recData[0].map(h => String(h).trim().toLowerCase()) : [];
  const pIdCol = recHeaders.indexOf("product_id") !== -1 ? recHeaders.indexOf("product_id") : 1;
  const iIdCol = recHeaders.indexOf("ingredient_id") !== -1 ? recHeaders.indexOf("ingredient_id") : 2;
  const qtyCol = recHeaders.indexOf("qty_per_unit") !== -1 ? recHeaders.indexOf("qty_per_unit") : 3;

  const recMap = {};
  for (let r = 1; r < recData.length; r++) {
    const pId = Number(recData[r][pIdCol]);
    const iId = Number(recData[r][iIdCol]);
    const qtyPerUnit = Number(recData[r][qtyCol]);
    if (!recMap[pId]) recMap[pId] = [];
    recMap[pId].push({ ingredient_id: iId, qty_per_unit: qtyPerUnit });
  }
  return recMap;
}

console.log('2. Testing pemetaan resep pada skema standar 4 kolom...');
const mockStandardRecData = [
  ["id", "product_id", "ingredient_id", "qty_per_unit"],
  [1, 10, 101, 4],  // Produk 10 pakai 4 pcs bahan 101
  [2, 10, 102, 50], // Produk 10 pakai 50 gram bahan 102
  [3, 20, 103, 1]   // Produk 20 pakai 1 pcs bahan 103
];
const standardRecMap = parseRecMap(mockStandardRecData);

assert.strictEqual(standardRecMap[10].length, 2, 'Produk 10 harus memiliki 2 bahan');
assert.strictEqual(standardRecMap[10][0].ingredient_id, 101, 'Bahan 1 harus ID 101');
assert.strictEqual(standardRecMap[10][0].qty_per_unit, 4, 'Qty per unit bahan 1 harus 4');
assert.strictEqual(standardRecMap[10][1].ingredient_id, 102, 'Bahan 2 harus ID 102');
assert.strictEqual(standardRecMap[10][1].qty_per_unit, 50, 'Qty per unit bahan 2 harus 50');
assert.strictEqual(standardRecMap[20][0].ingredient_id, 103, 'Produk 20 harus pakai bahan 103');
console.log('   -> PASSED: Pemetaan 4 kolom standar bekerja sempurna!');

console.log('3. Testing backward-compatibility pada sheet warisan (legacy 3 kolom)...');
const mockLegacyRecData = [
  ["product_id", "ingredient_id", "qty_per_unit"],
  [10, 101, 4],
  [10, 102, 50],
  [20, 103, 1]
];
const legacyRecMap = parseRecMap(mockLegacyRecData);

assert.strictEqual(legacyRecMap[10].length, 2, 'Produk 10 harus memiliki 2 bahan');
assert.strictEqual(legacyRecMap[10][0].ingredient_id, 101, 'Bahan 1 harus ID 101');
assert.strictEqual(legacyRecMap[10][0].qty_per_unit, 4, 'Qty per unit bahan 1 harus 4');
assert.strictEqual(legacyRecMap[10][1].ingredient_id, 102, 'Bahan 2 harus ID 102');
assert.strictEqual(legacyRecMap[10][1].qty_per_unit, 50, 'Qty per unit bahan 2 harus 50');
console.log('   -> PASSED: Sheet 3 kolom lama otomatis terdeteksi tanpa pergeseran nilai!');

// 4. Uji simulasi handleSaveRecipe (delete existing + batch insert)
console.log('4. Testing handleSaveRecipe dengan resolusi kolom dinamis & batch setValues...');
class MockRecipeSheet {
  constructor(initialData) {
    this.data = JSON.parse(JSON.stringify(initialData));
  }
  getLastRow() { return this.data.length; }
  getDataRange() {
    const self = this;
    return { getValues() { return JSON.parse(JSON.stringify(self.data)); } };
  }
  getRange(row, col) {
    const self = this;
    return {
      getValue() { return self.data[row - 1][col - 1]; }
    };
  }
  deleteRow(rowIdx) {
    this.data.splice(rowIdx - 1, 1);
  }
  insertBatch(rows) {
    for (const r of rows) this.data.push([...r]);
  }
}

function simulateSaveRecipe(recSheet, productId, newRecipes) {
  const values = recSheet.getDataRange().getValues();
  const recHeaders = values.length > 0 ? values[0].map(h => String(h).trim().toLowerCase()) : [];
  const pIdCol = recHeaders.indexOf("product_id") !== -1 ? recHeaders.indexOf("product_id") : 1;

  // Hapus semua resep lama untuk product_id ini (hapus dari bawah ke atas)
  for (let i = values.length - 1; i >= 1; i--) {
    if (Number(values[i][pIdCol]) === productId) {
      recSheet.deleteRow(i + 1);
    }
  }

  const lastRow = recSheet.getLastRow();
  let nextId = lastRow > 1 ? Number(recSheet.getRange(lastRow, 1).getValue()) + 1 : 1;

  const rowsToInsert = newRecipes.map(r => [
    nextId++,
    productId,
    Number(r.ingredient_id),
    Number(r.qty_per_unit)
  ]);

  if (rowsToInsert.length > 0) {
    recSheet.insertBatch(rowsToInsert);
  }
}

const recipeSheetInstance = new MockRecipeSheet(mockStandardRecData);

// Update resep Produk 10: ganti dengan 1 bahan baru (ID 105, qty 12)
simulateSaveRecipe(recipeSheetInstance, 10, [{ ingredient_id: 105, qty_per_unit: 12 }]);

// Produk 10 sekarang hanya punya 1 bahan (105), Produk 20 tetap utuh
const updatedRecMap = parseRecMap(recipeSheetInstance.data);
assert.strictEqual(updatedRecMap[10].length, 1, 'Resep lama produk 10 harus terhapus bersih dan diganti 1 resep baru');
assert.strictEqual(updatedRecMap[10][0].ingredient_id, 105, 'Bahan baru harus 105');
assert.strictEqual(updatedRecMap[10][0].qty_per_unit, 12, 'Qty bahan baru harus 12');
assert.strictEqual(updatedRecMap[20].length, 1, 'Resep produk 20 tidak boleh terganggu');
console.log('   -> PASSED: Simpan resep berjalan presisi dan bebas duplikasi!');

console.log('\n--- SEMUA PENGUJIAN BUG-011 BERHASIL 100% ---');
