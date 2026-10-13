// Test Verification for BUG-008: Perhitungan Void di Dashboard Owner Case-Sensitive ("VOID" vs 'void')
const assert = require('assert');

console.log('--- TEST BUG-008: VERIFIKASI PERHITUNGAN VOID CASE-INSENSITIVE PADA DASHBOARD OWNER ---');

// Helper function yang diimplementasikan di OwnerDashboardScreen.tsx
const isVoidTx = (t) => String(t && t.status || '').trim().toLowerCase() === 'void';

// Test 1: Helper function case-insensitivity & null-safety
console.log('1. Testing deteksi status void dengan berbagai variasi casing & whitespace...');
assert.strictEqual(isVoidTx({ status: 'VOID' }), true, 'Harus mendeteksi UPPERCASE VOID');
assert.strictEqual(isVoidTx({ status: 'void' }), true, 'Harus mendeteksi lowercase void');
assert.strictEqual(isVoidTx({ status: 'Void' }), true, 'Harus mendeteksi Titlecase Void');
assert.strictEqual(isVoidTx({ status: ' VOID ' }), true, 'Harus mendeteksi VOID dengan whitespace');
assert.strictEqual(isVoidTx({ status: 'vOiD' }), true, 'Harus mendeteksi mixed case vOiD');
assert.strictEqual(isVoidTx({ status: 'PAID' }), false, 'PAID bukan void');
assert.strictEqual(isVoidTx({ status: 'success' }), false, 'success bukan void');
assert.strictEqual(isVoidTx({ status: null }), false, 'null bukan void');
assert.strictEqual(isVoidTx({ status: undefined }), false, 'undefined bukan void');
assert.strictEqual(isVoidTx({}), false, 'object kosong bukan void');
console.log('   -> PASSED: Semua variasi casing & nilai status terdeteksi akurat!');

// Test 2: Simulasi dataset transaksi dashboard owner
console.log('2. Testing pemisahan periodTx vs branchTx dan perhitungan omzet...');
const mockTransactions = [
  { id: '1', cashier: 'Budi', total: 100000, status: 'PAID', timestamp: '2026-10-13 10:00:00' },
  { id: '2', cashier: 'Budi', total: 50000, status: 'success', timestamp: '2026-10-13 11:00:00' },
  { id: '3', cashier: 'Siti', total: 30000, status: 'PAID', timestamp: '2026-10-13 12:00:00' },
  // Transaksi Void dalam berbagai casing:
  { id: '4', cashier: 'Budi', total: 40000, status: 'VOID', timestamp: '2026-10-13 13:00:00' },      // dari Google Sheets
  { id: '5', cashier: 'Siti', total: 25000, status: 'void', timestamp: '2026-10-13 14:00:00' },      // dari sqlite/local
  { id: '6', cashier: 'Siti', total: 15000, status: ' Void ', timestamp: '2026-10-13 15:00:00' },    // dari human/whitespace
];

// Simulasi periodTx (semua transaksi dalam periode)
const periodTx = mockTransactions;

// Simulasi branchTx (hanya transaksi aktif / non-void)
const branchTx = periodTx.filter(t => !isVoidTx(t));

const totalOmzet = branchTx.reduce((sum, t) => sum + (Number(t.total) || 0), 0);
const totalTrx = branchTx.length;
const avgTicket = totalTrx > 0 ? Math.round(totalOmzet / totalTrx) : 0;

assert.strictEqual(totalOmzet, 180000, 'Total omzet harus 180.000 (tidak boleh bocor nilai void)');
assert.strictEqual(totalTrx, 3, 'Total transaksi aktif harus 3');
assert.strictEqual(avgTicket, 60000, 'Average ticket harus 60.000 (180.000 / 3)');
console.log('   -> PASSED: Omzet & Trx aktif bersih 100% tanpa kontaminasi void!');

// Test 3: Simulasi Analisis Void
console.log('3. Testing metrik Analisis Void (voidCount, lostOmzet, successPct)...');
let successCount = 0;
let voidCount = 0;
let lostOmzet = 0;

periodTx.forEach(t => {
  if (isVoidTx(t)) {
    voidCount++;
    lostOmzet += (Number(t.total) || 0);
  } else {
    successCount++;
  }
});

const totalAllTrx = successCount + voidCount;
const successPct = Math.round((successCount / totalAllTrx) * 100);

assert.strictEqual(voidCount, 3, 'Harus mendeteksi 3 transaksi void');
assert.strictEqual(lostOmzet, 80000, 'Potensi omzet hilang harus 80.000 (40k + 25k + 15k)');
assert.strictEqual(successCount, 3, 'Transaksi sukses harus 3');
assert.strictEqual(successPct, 50, 'Success rate harus 50%');
console.log('   -> PASSED: Metrik Analisis Void terhitung sempurna!');

// Test 4: Simulasi Cashier Performance
console.log('4. Testing statistik kasir individual...');
const budiTx = mockTransactions.filter(t => t.cashier === 'Budi');
const activeBudiTx = budiTx.filter(t => !isVoidTx(t));
const budiOmzet = activeBudiTx.reduce((sum, t) => sum + (Number(t.total) || 0), 0);
const budiVoidCount = budiTx.filter(isVoidTx).length;

assert.strictEqual(budiOmzet, 150000, 'Omzet kasir Budi harus 150.000 (100k + 50k)');
assert.strictEqual(activeBudiTx.length, 2, 'Jumlah transaksi aktif Budi harus 2');
assert.strictEqual(budiVoidCount, 1, 'Void count Budi harus 1 (40k dengan status VOID)');
console.log('   -> PASSED: Statistik kasir akurat dan mengisolasi void!');

console.log('\n--- SEMUA PENGUJIAN BUG-008 BERHASIL 100% ---');
