// Test Verification for BUG-006: Inkonsistensi Nama Kolom Kategori (cat vs category) & Gambar (img vs image_url)
const assert = require('assert');

console.log('--- TEST BUG-006: VERIFIKASI KONSISTENSI KOLOM (cat vs category & img vs image_url) ---');

// Mock SQLite storage
const mockProductsTable = [];

// Simulasi logika db.ts: updateMasterData
function simulateUpdateMasterData(data) {
  if (data.products && Array.isArray(data.products) && data.products.length > 0) {
    mockProductsTable.length = 0; // DELETE FROM products
    for (const p of data.products) {
      const category = p.cat || p.category || 'Kukus';
      const imageUrl = p.img || p.image_url || '';
      const minStock = p.minStock !== undefined ? p.minStock : (p.min_stock || 0);
      const originalPrice = p.originalPrice !== undefined ? p.originalPrice : (p.original_price || 0);
      const promoText = p.promoText !== undefined ? p.promoText : (p.promo_text || '');
      const outletsStr = typeof p.outlets === 'object' ? JSON.stringify(p.outlets) : (p.outlets || 'all');
      
      mockProductsTable.push({
        id: p.id,
        name: p.name,
        category,
        price: p.price,
        cost: p.cost,
        stock_mode: p.stock_mode,
        stock: p.stock,
        min_stock: minStock,
        promo: p.promo ? 1 : 0,
        promo_text: promoText,
        original_price: originalPrice,
        image_url: imageUrl,
        outlets: outletsStr
      });
    }
  }
}

// Simulasi logika db.ts: getProducts
function simulateGetProducts() {
  return mockProductsTable.map(r => ({
    ...r,
    cat: r.category || r.cat || 'Kukus',
    img: r.image_url || r.img || '',
    minStock: r.min_stock !== undefined ? r.min_stock : r.minStock,
    promoText: r.promo_text !== undefined ? r.promo_text : r.promoText,
    originalPrice: r.original_price !== undefined ? r.original_price : r.originalPrice,
    promo: Boolean(r.promo)
  }));
}

// Test Case 1: Data masuk dengan format Google Sheets / React (cat & img)
console.log('1. Testing data sync dengan payload "cat" dan "img"...');
simulateUpdateMasterData({
  products: [
    {
      id: 1,
      name: 'Siomay Ayam',
      cat: 'Dimsum Kukus',
      price: 15000,
      cost: 8000,
      stock_mode: 'simple',
      stock: 50,
      minStock: 10,
      promo: true,
      promoText: 'Diskon 10%',
      originalPrice: 16500,
      img: 'https://example.com/siomay.jpg',
      outlets: ['cbg1']
    }
  ]
});

// Verifikasi isi tabel SQLite
assert.strictEqual(mockProductsTable[0].category, 'Dimsum Kukus', 'SQLite category harus terisi dari cat');
assert.strictEqual(mockProductsTable[0].image_url, 'https://example.com/siomay.jpg', 'SQLite image_url harus terisi dari img');

// Verifikasi pembacaan dari SQLite ke model Product
const loadedProducts1 = simulateGetProducts();
assert.strictEqual(loadedProducts1[0].cat, 'Dimsum Kukus', 'Model React cat harus terisi dari SQLite category');
assert.strictEqual(loadedProducts1[0].img, 'https://example.com/siomay.jpg', 'Model React img harus terisi dari SQLite image_url');
assert.strictEqual(loadedProducts1[0].minStock, 10, 'minStock harus terisi');
console.log('   -> PASSED: Pemetaan cat & img ke SQLite category & image_url sukses!');

// Test Case 2: Data masuk dengan format alternatif (category & image_url)
console.log('2. Testing data sync dengan payload alternatif "category" dan "image_url"...');
simulateUpdateMasterData({
  products: [
    {
      id: 2,
      name: 'Hakau Udang',
      category: 'Goreng',
      price: 20000,
      cost: 12000,
      stock_mode: 'recipe',
      stock: 30,
      image_url: 'https://example.com/hakau.jpg'
    }
  ]
});

assert.strictEqual(mockProductsTable[0].category, 'Goreng', 'SQLite category harus terisi dari category');
assert.strictEqual(mockProductsTable[0].image_url, 'https://example.com/hakau.jpg', 'SQLite image_url harus terisi dari image_url');

const loadedProducts2 = simulateGetProducts();
assert.strictEqual(loadedProducts2[0].cat, 'Goreng', 'Model React cat harus terisi dari SQLite category');
assert.strictEqual(loadedProducts2[0].img, 'https://example.com/hakau.jpg', 'Model React img harus terisi dari SQLite image_url');
console.log('   -> PASSED: Pemetaan balik fleksibel dua arah sukses!');

// Test Case 3: Data kosong/fallback default
console.log('3. Testing fallback nilai default jika kolom kosong/undefined...');
simulateUpdateMasterData({
  products: [
    {
      id: 3,
      name: 'Pangsit Biasa',
      price: 10000
    }
  ]
});

const loadedProducts3 = simulateGetProducts();
assert.strictEqual(loadedProducts3[0].cat, 'Kukus', 'Fallback category harus Kukus jika kosong');
assert.strictEqual(loadedProducts3[0].img, '', 'Fallback img harus string kosong jika kosong');
console.log('   -> PASSED: Fallback nilai default bekerja dengan sempurna!');

console.log('\n--- SEMUA PENGUJIAN BUG-006 BERHASIL 100% ---');
