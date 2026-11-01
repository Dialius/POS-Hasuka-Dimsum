// Test Verification for BUG-010: Google Apps Script Menulis Sel demi Sel dalam Loop (appendRow/setValue Jamming)
const assert = require('assert');

console.log('--- TEST BUG-010: VERIFIKASI BATCH WRITING (SETVALUES) VS CELL-BY-CELL LOOP ---');

// Mock Sheet with Call Tracking
class SpySheet {
  constructor(name, initialData) {
    this.name = name;
    this.data = initialData ? JSON.parse(JSON.stringify(initialData)) : [[]];
    this.appendRowCalls = 0;
    this.setValuesCalls = 0;
    this.setValueCalls = 0;
  }

  getLastRow() {
    return this.data.length;
  }

  getDataRange() {
    const self = this;
    return {
      getValues() {
        return JSON.parse(JSON.stringify(self.data));
      }
    };
  }

  appendRow(row) {
    this.appendRowCalls++;
    this.data.push([...row]);
  }

  getRange(startRow, startCol, numRows = 1, numCols = 1) {
    const self = this;
    return {
      setValue(val) {
        self.setValueCalls++;
        while (self.data.length < startRow) self.data.push([]);
        while (self.data[startRow - 1].length < startCol) self.data[startRow - 1].push('');
        self.data[startRow - 1][startCol - 1] = val;
        return this;
      },
      setValues(values) {
        self.setValuesCalls++;
        for (let r = 0; r < values.length; r++) {
          const targetRow = startRow - 1 + r;
          while (self.data.length <= targetRow) self.data.push([]);
          for (let c = 0; c < values[r].length; c++) {
            const targetCol = startCol - 1 + c;
            while (self.data[targetRow].length <= targetCol) self.data[targetRow].push('');
            self.data[targetRow][targetCol] = values[r][c];
          }
        }
        return this;
      }
    };
  }
}

// Simulasi logika handleCreateTransaction dengan batch
function simulateBatchCreateTransaction({ itemsSheet, ingSheet, prodSheet, items, recMap }) {
  const txId = 1718000000000;
  const ingData = ingSheet.getDataRange().getValues();
  const prodData = prodSheet.getDataRange().getValues();

  const ingMap = {};
  for (let i = 1; i < ingData.length; i++) {
    ingMap[Number(ingData[i][0])] = {
      rowIndex: i + 1,
      currentStock: Number(ingData[i][3]),
      isTracked: true
    };
  }

  const prodMap = {};
  for (let p = 1; p < prodData.length; p++) {
    prodMap[Number(prodData[p][0])] = {
      rowIndex: p + 1,
      stockMode: prodData[p][5],
      stock: Number(prodData[p][6])
    };
  }

  const itemRows = [];
  let hasIngDeductions = false;
  let hasProdDeductions = false;

  items.forEach((item, index) => {
    itemRows.push([
      txId + "-" + (index + 1),
      txId,
      item.product_id,
      item.product_name,
      item.qty,
      item.unit_price,
      item.subtotal
    ]);

    const pId = Number(item.product_id);
    const qtySold = Number(item.qty);

    if (prodMap[pId] && prodMap[pId].stockMode === "direct") {
      const newStock = Math.max(0, prodMap[pId].stock - qtySold);
      prodData[prodMap[pId].rowIndex - 1][6] = newStock;
      prodMap[pId].stock = newStock;
      hasProdDeductions = true;
    } else {
      const itemRecipes = recMap[pId] || [];
      itemRecipes.forEach(recipe => {
        const ing = ingMap[recipe.ingredient_id];
        if (ing && ing.isTracked) {
          const deduction = recipe.qty_per_unit * qtySold;
          const newStock = ing.currentStock - deduction;
          ingData[ing.rowIndex - 1][3] = newStock;
          ing.currentStock = newStock;
          hasIngDeductions = true;
        }
      });
    }
  });

  // Batch insert transaction items
  if (itemRows.length > 0) {
    const lastRow = itemsSheet.getLastRow();
    itemsSheet.getRange(lastRow + 1, 1, itemRows.length, itemRows[0].length).setValues(itemRows);
  }

  // Batch update ingredients stock
  if (hasIngDeductions && ingData.length > 0) {
    ingSheet.getRange(1, 1, ingData.length, ingData[0].length).setValues(ingData);
  }

  // Batch update direct products stock
  if (hasProdDeductions && prodData.length > 0) {
    prodSheet.getRange(1, 1, prodData.length, prodData[0].length).setValues(prodData);
  }
}

// Test 1: handleCreateTransaction dengan 5 items & 5 resep
console.log('1. Testing batch insert & update pada handleCreateTransaction...');
const itemsSheet = new SpySheet('TransactionItems', [
  ['id', 'transaction_id', 'product_id', 'product_name', 'qty', 'unit_price', 'subtotal']
]);

const ingSheet = new SpySheet('Ingredients', [
  ['id', 'name', 'unit', 'current_stock', 'min_stock_threshold', 'is_tracked'],
  [1, 'Kulit Dimsum', 'pcs', 100, 20, true],
  [2, 'Ayam Giling', 'gram', 1000, 200, true]
]);

const prodSheet = new SpySheet('Products', [
  ['id', 'name', 'category', 'price', 'cost', 'stock_mode', 'stock'],
  [10, 'Dimsum Ayam', 'Kukus', 15000, 8000, 'recipe', 0],
  [20, 'Teh Botol', 'Minuman', 5000, 2500, 'direct', 50]
]);

const recMap = {
  10: [
    { ingredient_id: 1, qty_per_unit: 4 },   // 4 lembar kulit
    { ingredient_id: 2, qty_per_unit: 50 }  // 50 gram ayam
  ]
};

// 2 porsi Dimsum Ayam (8 kulit, 100g ayam) + 3 Teh Botol (direct 3)
const testItems = [
  { product_id: 10, product_name: 'Dimsum Ayam', qty: 2, unit_price: 15000, subtotal: 30000 },
  { product_id: 20, product_name: 'Teh Botol', qty: 3, unit_price: 5000, subtotal: 15000 }
];

simulateBatchCreateTransaction({ itemsSheet, ingSheet, prodSheet, items: testItems, recMap });

// Verifikasi Call Counter
assert.strictEqual(itemsSheet.appendRowCalls, 0, 'itemsSheet tidak boleh memanggil appendRow di dalam loop!');
assert.strictEqual(itemsSheet.setValuesCalls, 1, 'itemsSheet harus menulis semua item dalam 1 panggilan setValues batch!');
assert.strictEqual(ingSheet.setValueCalls, 0, 'ingSheet tidak boleh memanggil setValue per cell!');
assert.strictEqual(ingSheet.setValuesCalls, 1, 'ingSheet harus mengupdate seluruh stok dalam 1 panggilan setValues batch!');
assert.strictEqual(prodSheet.setValueCalls, 0, 'prodSheet tidak boleh memanggil setValue per cell!');
assert.strictEqual(prodSheet.setValuesCalls, 1, 'prodSheet harus mengupdate stok direct dalam 1 panggilan setValues batch!');

// Verifikasi Keakuratan Nilai Stok
assert.strictEqual(ingSheet.data[1][3], 92, 'Stok Kulit Dimsum harus berkurang dari 100 menjadi 92 (100 - 8)');
assert.strictEqual(ingSheet.data[2][3], 900, 'Stok Ayam Giling harus berkurang dari 1000 menjadi 900 (1000 - 100)');
assert.strictEqual(prodSheet.data[2][6], 47, 'Stok Teh Botol harus berkurang dari 50 menjadi 47 (50 - 3)');
console.log('   -> PASSED: Transaksi berhasil diproses dengan 3 batch calls (0 loop setValue/appendRow calls)!');

// Test 2: Simulasi handleStockOpname dengan 10 item
console.log('2. Testing batch write pada handleStockOpname...');
const opnameSheet = new SpySheet('StockOpname', [
  ['id', 'session_id', 'date', 'ingredient_id', 'system_stock', 'physical_count', 'difference', 'notes', 'recorded_by']
]);
const opnameIngSheet = new SpySheet('Ingredients', [
  ['id', 'name', 'unit', 'current_stock'],
  [1, 'Bahan A', 'kg', 10],
  [2, 'Bahan B', 'kg', 20],
  [3, 'Bahan C', 'kg', 30]
]);

function simulateBatchStockOpname({ opnameSheet, ingSheet, items }) {
  const sessionId = 'SOP-20261013';
  const dateStr = '2026-10-13 23:00:00';
  const ingData = ingSheet.getDataRange().getValues();
  const ingRowMap = {};
  for (let i = 1; i < ingData.length; i++) {
    ingRowMap[Number(ingData[i][0])] = i + 1;
  }

  const opnameRows = [];
  items.forEach((item, idx) => {
    const ingId = Number(item.ingredient_id);
    const physical = Number(item.physical_count);
    const system = Number(item.system_stock);
    const diff = physical - system;

    opnameRows.push([
      sessionId + '-' + (idx + 1),
      sessionId,
      dateStr,
      ingId,
      system,
      physical,
      diff,
      item.notes || '',
      'Owner'
    ]);

    if (ingRowMap[ingId]) {
      ingData[ingRowMap[ingId] - 1][3] = physical;
    }
  });

  if (opnameRows.length > 0) {
    opnameSheet.getRange(opnameSheet.getLastRow() + 1, 1, opnameRows.length, opnameRows[0].length).setValues(opnameRows);
  }
  if (ingData.length > 0) {
    ingSheet.getRange(1, 1, ingData.length, ingData[0].length).setValues(ingData);
  }
}

const opnameItems = [
  { ingredient_id: 1, system_stock: 10, physical_count: 8 },
  { ingredient_id: 2, system_stock: 20, physical_count: 22 },
  { ingredient_id: 3, system_stock: 30, physical_count: 30 }
];

simulateBatchStockOpname({ opnameSheet, ingSheet: opnameIngSheet, items: opnameItems });

assert.strictEqual(opnameSheet.appendRowCalls, 0, 'opnameSheet tidak boleh memanggil appendRow di dalam loop!');
assert.strictEqual(opnameSheet.setValuesCalls, 1, 'opnameSheet harus batch setValues!');
assert.strictEqual(opnameIngSheet.setValueCalls, 0, 'opnameIngSheet tidak boleh setValue per baris!');
assert.strictEqual(opnameIngSheet.setValuesCalls, 1, 'opnameIngSheet harus batch setValues!');
assert.strictEqual(opnameIngSheet.data[1][3], 8, 'Stok Bahan A harus 8');
assert.strictEqual(opnameIngSheet.data[2][3], 22, 'Stok Bahan B harus 22');
console.log('   -> PASSED: Stock Opname diproses dalam 2 batch calls tanpa jamming!');

console.log('\n--- SEMUA PENGUJIAN BUG-010 BERHASIL 100% ---');
