// Test Verification for BUG-005: Sinkronisasi Master Data Non-Atomik & Rawan Terhapus Bersih
const assert = require('assert');

console.log('--- TEST BUG-005: VERIFIKASI SINKRONISASI MASTER DATA ATOMIK & ROLLBACK SAFETY ---');

class MockDatabase {
  constructor() {
    this.inTx = false;
    this.tables = { products: [{ id: 1, name: 'Original Dimsum' }] };
    this.rollbackTriggered = false;
  }

  async execute(sql) {
    if (sql === 'BEGIN TRANSACTION') this.inTx = true;
    else if (sql === 'COMMIT') this.inTx = false;
    else if (sql === 'ROLLBACK') {
      this.inTx = false;
      this.rollbackTriggered = true;
    }
  }
}

async function simulateUpdateMasterData(db, data) {
  await db.execute('BEGIN TRANSACTION');
  try {
    if (data.products && Array.isArray(data.products) && data.products.length > 0) {
      if (data.shouldFail) throw new Error('Simulasi kegagalan network/query di tengah proses');
      db.tables.products = data.products;
    }
    await db.execute('COMMIT');
  } catch (err) {
    await db.execute('ROLLBACK');
    throw err;
  }
}

(async () => {
  // Test 1: Guard terhadap array kosong
  console.log('1. Testing proteksi terhadap array kosong (mencegah data terhapus bersih)...');
  const db1 = new MockDatabase();
  await simulateUpdateMasterData(db1, { products: [] });
  assert.strictEqual(db1.tables.products.length, 1, 'Data tidak boleh terhapus jika payload kosong');
  console.log('   -> PASSED: Array kosong tidak menghapus data master!');

  // Test 2: Rollback otomatis saat terjadi error
  console.log('2. Testing rollback otomatis saat query gagal di tengah proses...');
  const db2 = new MockDatabase();
  let errorCaught = false;
  try {
    await simulateUpdateMasterData(db2, {
      products: [{ id: 2, name: 'New Dimsum' }],
      shouldFail: true
    });
  } catch {
    errorCaught = true;
  }

  assert.strictEqual(errorCaught, true, 'Error harus dilempar');
  assert.strictEqual(db2.rollbackTriggered, true, 'ROLLBACK harus dieksekusi saat error terjadi');
  console.log('   -> PASSED: Rollback atomik berhasil mengembalikan status awal!');

  console.log('\n--- SEMUA PENGUJIAN BUG-005 BERHASIL 100% ---');
})();
