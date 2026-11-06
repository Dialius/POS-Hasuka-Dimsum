const assert = require('assert');
const fs = require('fs');
const path = require('path');

console.log('=== TEST MULTI-OUTLET STOCK ISOLATION (STOCK IN & TRANSACTIONS) ===\n');

// Mock Spreadsheet environment for Google Apps Script
class MockSheet {
  constructor(name, headers, defaultRows = []) {
    this.name = name;
    this.data = [headers, ...defaultRows.map(r => [...r])];
  }

  getLastRow() {
    return this.data.length;
  }

  getLastColumn() {
    return this.data[0] ? this.data[0].length : 0;
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
    this.data.push([...row]);
  }

  getRange(startRow, startCol, numRows = 1, numCols = 1) {
    const self = this;
    return {
      getValue() {
        return self.data[startRow - 1] && self.data[startRow - 1][startCol - 1] !== undefined
          ? self.data[startRow - 1][startCol - 1]
          : '';
      },
      getValues() {
        const res = [];
        for (let r = 0; r < numRows; r++) {
          const row = [];
          const targetRow = startRow - 1 + r;
          for (let c = 0; c < numCols; c++) {
            const targetCol = startCol - 1 + c;
            row.push(self.data[targetRow] ? self.data[targetRow][targetCol] : '');
          }
          res.push(row);
        }
        return res;
      },
      setValue(val) {
        while (self.data.length < startRow) self.data.push([]);
        while (self.data[startRow - 1].length < startCol) self.data[startRow - 1].push('');
        self.data[startRow - 1][startCol - 1] = val;
        return this;
      },
      setValues(values) {
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
      },
      setFontWeight() { return this; },
      setBackground() { return this; },
      setFontColor() { return this; }
    };
  }

  setFrozenRows() {}
}

class MockSpreadsheet {
  constructor() {
    this.sheets = {};
  }

  getSheetByName(name) {
    return this.sheets[name] || null;
  }

  insertSheet(name) {
    const s = new MockSheet(name, []);
    this.sheets[name] = s;
    return s;
  }

  getId() {
    return 'mock-ss-id';
  }
}

// Global GAS mocks
global.Utilities = {
  formatDate(d, tz, fmt) {
    return '2026-11-06 10:00:00';
  }
};

// Load code from pos-kasir/Code.js in a sandbox
const codeContent = fs.readFileSync(path.resolve('pos-kasir', 'Code.js'), 'utf8');
const vm = require('vm');
const context = {
  console: console,
  Utilities: global.Utilities,
  Object: Object,
  Array: Array,
  Number: Number,
  String: String,
  Boolean: Boolean,
  Date: Date,
  Math: Math,
  JSON: JSON
};
vm.createContext(context);
vm.runInContext(codeContent, context);

// Setup mock database with two outlets: 'paskal' and 'buah-batu'
const mockSs = new MockSpreadsheet();
mockSs.sheets["Outlets"] = new MockSheet("Outlets", ["id", "name", "address", "phone", "target"], [
  ["paskal", "Hasuka Dimsum - Paskal 23", "Paskal 23 Mall", "0812345678", 5000000],
  ["buah-batu", "Hasuka Dimsum - Buah Batu", "Jl. Buah Batu No. 12", "0812345679", 4000000]
]);

mockSs.sheets["Ingredients"] = new MockSheet("Ingredients", ["id", "name", "unit", "current_stock", "min_stock_threshold", "is_tracked", "outlets"], [
  [1, "Daging Ayam Cincang", "gram", 1000, 200, "TRUE", "all"],
  [2, "Kulit Pangsit", "pcs", 50, 10, "TRUE", "all"],
  [3, "Tepung Tapioka", "gram", 500, 100, "TRUE", "all"]
]);

mockSs.sheets["Products"] = new MockSheet("Products", ["id", "name", "cat", "price", "cost", "stock_mode", "stock", "minStock", "promo", "promoText", "originalPrice", "img", "outlets"], [
  [101, "Siomay Ayam (4 pcs)", "Kukus", 22000, 10000, "recipe", 0, 0, false, "", 22000, "", "all"],
  [102, "Badak Sarsaparilla", "Minuman", 15000, 8000, "direct", 20, 5, false, "", 15000, "", "all"]
]);

mockSs.sheets["Recipes"] = new MockSheet("Recipes", ["id", "product_id", "ingredient_id", "qty_per_unit"], [
  [1, 101, 1, 50], // 50g daging per porsi
  [2, 101, 2, 4]   // 4 pcs kulit per porsi
]);

// 1. Test Inisialisasi Sheet Stok Scoped
console.log('1. Menguji inisialisasi ensureStockSheets...');
context.ensureStockSheets(mockSs);
const ingStockSheet = mockSs.getSheetByName("IngredientStock");
const prodStockSheet = mockSs.getSheetByName("ProductStock");

assert(ingStockSheet, 'Sheet IngredientStock harus berhasil dibuat');
assert(prodStockSheet, 'Sheet ProductStock harus berhasil dibuat');
console.log('   ✓ Sheet IngredientStock dan ProductStock berhasil dibuat & di-seed otomatis.');

// Cek bahwa awal mulanya paskal dan buah-batu punya stok masing-masing
const mapsPaskalAwal = context.getOutletStockMaps(mockSs, 'paskal');
const mapsBatuAwal = context.getOutletStockMaps(mockSs, 'buah-batu');

assert.strictEqual(mapsPaskalAwal.ingStockMap[1].current_stock, 1000, 'Stok awal Daging Ayam di Paskal harus 1000');
assert.strictEqual(mapsBatuAwal.ingStockMap[1].current_stock, 1000, 'Stok awal Daging Ayam di Buah Batu harus 1000');
assert.strictEqual(mapsPaskalAwal.prodStockMap[102].stock, 20, 'Stok awal Badak di Paskal harus 20');
assert.strictEqual(mapsBatuAwal.prodStockMap[102].stock, 20, 'Stok awal Badak di Buah Batu harus 20');
console.log('   ✓ Data stok awal ter-seed rapi untuk kedua cabang.');

// 2. Test Stock In ke Buah Batu
console.log('\n2. Menguji Stock In HANYA ke Cabang "buah-batu"...');
const stockInPayload = {
  branch_id: 'buah-batu',
  source: 'Supplier Utama',
  items: [
    { id: 1, type: 'ingredient', qty: 500 }, // Tambah 500g Daging Ayam ke Buah Batu
    { id: 102, type: 'product', qty: 15 }    // Tambah 15 botol Badak ke Buah Batu
  ],
  recorded_by: 'Owner'
};

const stockInResult = context.handleSaveStockIn(mockSs, stockInPayload);
assert.strictEqual(stockInResult.status, 'saved', 'Stock In harus berhasil disimpan');

// Verifikasi isolasi stok
const mapsPaskalAfter = context.getOutletStockMaps(mockSs, 'paskal');
const mapsBatuAfter = context.getOutletStockMaps(mockSs, 'buah-batu');

console.log('   Stok Buah Batu setelah Stock In:');
console.log('     - Daging Ayam: ' + mapsBatuAfter.ingStockMap[1].current_stock + ' gram (Awal: 1000, +500 = 1500)');
console.log('     - Badak Sarsaparilla: ' + mapsBatuAfter.prodStockMap[102].stock + ' botol (Awal: 20, +15 = 35)');

console.log('   Stok Paskal (Cabang Lain):');
console.log('     - Daging Ayam: ' + mapsPaskalAfter.ingStockMap[1].current_stock + ' gram (Harus tetap 1000)');
console.log('     - Badak Sarsaparilla: ' + mapsPaskalAfter.prodStockMap[102].stock + ' botol (Harus tetap 20)');

assert.strictEqual(mapsBatuAfter.ingStockMap[1].current_stock, 1500, 'Stok Daging Ayam di Buah Batu harus bertambah jadi 1500');
assert.strictEqual(mapsBatuAfter.prodStockMap[102].stock, 35, 'Stok Badak di Buah Batu harus bertambah jadi 35');
assert.strictEqual(mapsPaskalAfter.ingStockMap[1].current_stock, 1000, 'Stok Daging Ayam di Paskal TIDAK BOLEH BERUBAH (harus tetap 1000)');
assert.strictEqual(mapsPaskalAfter.prodStockMap[102].stock, 20, 'Stok Badak di Paskal TIDAK BOLEH BERUBAH (harus tetap 20)');
console.log('   ✓ ISOLASI BERHASIL: Stok bertambah hanya di Buah Batu, Paskal sama sekali tidak terpengaruh!');

// 3. Test Stock In ke Paskal
console.log('\n3. Menguji Stock In HANYA ke Cabang "paskal"...');
context.handleSaveStockIn(mockSs, {
  branch_id: 'paskal',
  source: 'Gudang Pusat',
  items: [
    { id: 2, type: 'ingredient', qty: 100 } // Tambah 100 Kulit Pangsit ke Paskal
  ],
  recorded_by: 'Owner'
});

const mapsPaskal2 = context.getOutletStockMaps(mockSs, 'paskal');
const mapsBatu2 = context.getOutletStockMaps(mockSs, 'buah-batu');

assert.strictEqual(mapsPaskal2.ingStockMap[2].current_stock, 150, 'Stok Kulit Pangsit di Paskal harus jadi 150 (50+100)');
assert.strictEqual(mapsBatu2.ingStockMap[2].current_stock, 50, 'Stok Kulit Pangsit di Buah Batu harus tetap 50');
console.log('   ✓ ISOLASI BERHASIL: Kulit Pangsit di Paskal jadi 150, di Buah Batu tetap 50!');

// 4. Test Pemotongan Stok Transaksi di Buah Batu
console.log('\n4. Menguji pemotongan stok penjualan di Cabang "buah-batu"...');
context.handleCreateTransaction(mockSs, {
  branch_id: 'buah-batu',
  cashier: 'Kasir BB',
  subtotal: 59000,
  total: 59000,
  items: [
    { product_id: 101, product_name: 'Siomay Ayam (4 pcs)', qty: 2, unit_price: 22000, subtotal: 44000 }, // Resep: 2x50g = 100g daging, 2x4 = 8 pcs kulit
    { product_id: 102, product_name: 'Badak Sarsaparilla', qty: 1, unit_price: 15000, subtotal: 15000 }  // Direct: 1 botol
  ]
});

const mapsBatuAfterTx = context.getOutletStockMaps(mockSs, 'buah-batu');
const mapsPaskalAfterTx = context.getOutletStockMaps(mockSs, 'paskal');

assert.strictEqual(mapsBatuAfterTx.ingStockMap[1].current_stock, 1400, 'Daging di Buah Batu terpotong 100g jadi 1400');
assert.strictEqual(mapsBatuAfterTx.prodStockMap[102].stock, 34, 'Badak di Buah Batu terpotong 1 botol jadi 34');
assert.strictEqual(mapsPaskalAfterTx.ingStockMap[1].current_stock, 1000, 'Daging di Paskal tetap 1000');
assert.strictEqual(mapsPaskalAfterTx.prodStockMap[102].stock, 20, 'Badak di Paskal tetap 20');
console.log('   ✓ Transaksi di Buah Batu hanya memotong stok Buah Batu. Paskal tetap aman.');

// 5. Test Owner Dashboard Data Aggregation
console.log('\n5. Menguji agregasi stok di handleGetOwnerDashboardData...');
const dashData = context.handleGetOwnerDashboardData(mockSs);
assert(dashData.ingredients && dashData.ingredients.length > 0, 'Data ingredients dashboard harus tersedia');

const bbAyam = dashData.ingredients.find(i => i.id === 1 && i.branchId === 'buah-batu');
const paskalAyam = dashData.ingredients.find(i => i.id === 1 && i.branchId === 'paskal');

assert(bbAyam, 'Harus ada data Daging Ayam untuk cabang buah-batu');
assert(paskalAyam, 'Harus ada data Daging Ayam untuk cabang paskal');
assert.strictEqual(bbAyam.current_stock, 1400, 'Dashboard harus melihat stok Buah Batu = 1400');
assert.strictEqual(paskalAyam.current_stock, 1000, 'Dashboard harus melihat stok Paskal = 1000');
console.log('   ✓ Dashboard mengembalikan data stok terpisah untuk masing-masing cabang (Buah Batu: 1400, Paskal: 1000).');

// 6. Test Stock Opname Isolation (Tidak Menimpa Master Sheet)
console.log('\n6. Menguji Stok Opname HANYA di Cabang "buah-batu" tanpa menimpa Master Ingredients...');
const masterIngBefore = mockSs.getSheetByName("Ingredients").getDataRange().getValues();
const masterAyamStockBefore = masterIngBefore[1][3];

context.handleStockOpname(mockSs, {
  branch_id: 'buah-batu',
  recorded_by: 'Owner',
  items: [
    { ingredient_id: 1, system_stock: 1400, physical_count: 1750 } // Opname Daging Ayam di Buah Batu jadi 1750
  ]
});

const mapsBatuAfterOpname = context.getOutletStockMaps(mockSs, 'buah-batu');
const mapsPaskalAfterOpname = context.getOutletStockMaps(mockSs, 'paskal');
const masterIngAfter = mockSs.getSheetByName("Ingredients").getDataRange().getValues();
const masterAyamStockAfter = masterIngAfter[1][3];

assert.strictEqual(mapsBatuAfterOpname.ingStockMap[1].current_stock, 1750, 'Stok Daging Ayam di Buah Batu harus terupdate jadi 1750');
assert.strictEqual(mapsPaskalAfterOpname.ingStockMap[1].current_stock, 1000, 'Stok Daging Ayam di Paskal harus TETAP 1000');
assert.strictEqual(masterAyamStockAfter, masterAyamStockBefore, 'Sheet master Ingredients TIDAK BOLEH tertimpa oleh opname cabang!');

console.log('   ✓ ISOLASI OPNAME BERHASIL: Buah Batu jadi 1750, Paskal tetap 1000, Master Sheet tetap aman!');

console.log('\n=== SEMUA 6 PENGUJIAN MULTI-OUTLET STOCK ISOLATION LULUS 100% ===');
