const assert = require('assert');
const fs = require('fs');

console.log('--- TEST SUITE: AI INSIGHT FEATURE ---');

// 1. Uji Backend Code.js
const codeJs = fs.readFileSync('pos-kasir/Code.js', 'utf8');

// Verifikasi early return di doPost
assert(
  codeJs.includes('if (action === "aiAnalyze")') &&
  codeJs.indexOf('if (action === "aiAnalyze")') < codeJs.indexOf('LockService.getScriptLock()'),
  'FAIL: aiAnalyze di doPost harus dieksekusi SEBELUM LockService.getScriptLock()'
);
console.log('✅ PASS: doPost memiliki early return aiAnalyze sebelum lock.');

// Verifikasi early return di rpcPostAction
const rpcIdx = codeJs.indexOf('function rpcPostAction');
const rpcActionIdx = codeJs.indexOf("if (action === 'aiAnalyze')", rpcIdx);
const rpcLockIdx = codeJs.indexOf('LockService.getScriptLock()', rpcIdx);
assert(
  rpcActionIdx !== -1 && rpcActionIdx < rpcLockIdx,
  'FAIL: aiAnalyze di rpcPostAction harus dieksekusi SEBELUM LockService.getScriptLock()'
);
console.log('✅ PASS: rpcPostAction memiliki early return aiAnalyze sebelum lock.');

// Verifikasi keberadaan fungsi kritis backend
assert(codeJs.includes('function handleAiAnalyze(data)'), 'FAIL: handleAiAnalyze tidak ditemukan di Code.js');
assert(codeJs.includes('function callGeminiApi('), 'FAIL: callGeminiApi tidak ditemukan di Code.js');
assert(codeJs.includes('function callOpenAiApi('), 'FAIL: callOpenAiApi tidak ditemukan di Code.js');
assert(codeJs.includes('function parseAndSanitizeAiResponse('), 'FAIL: parseAndSanitizeAiResponse tidak ditemukan di Code.js');
assert(codeJs.includes('function aiHealthCheck()'), 'FAIL: aiHealthCheck tidak ditemukan di Code.js');
assert(codeJs.includes('const AI_SYSTEM_PROMPT ='), 'FAIL: AI_SYSTEM_PROMPT tidak ditemukan di Code.js');
console.log('✅ PASS: Semua fungsi & konstanta backend GAS tersedia di Code.js.');

// Ekstraksi parseAndSanitizeAiResponse untuk unit testing
const parseFunctionMatch = codeJs.match(/function parseAndSanitizeAiResponse\(rawText\) \{[\s\S]*?\n\}/);
assert(parseFunctionMatch, 'Gagal mengekstrak parseAndSanitizeAiResponse');
const parseAndSanitizeAiResponse = new Function('rawText', parseFunctionMatch[0] + '\nreturn parseAndSanitizeAiResponse(rawText);');

// Test Parser: Bersihkan markdown code fence
const normalJson = JSON.stringify({
  headline: 'Penjualan hari ini naik 10% dibanding kemarin.',
  highlights: [{ type: 'naik', text: 'Omzet meningkat di Braga.' }],
  bestSeller: { name: 'Dimsum Mentai', note: 'Terjual 45 porsi' },
  recommendations: ['Pertahankan stok Dimsum Mentai'],
  caveat: ''
});
const parsedNormal = parseAndSanitizeAiResponse(normalJson);
assert.strictEqual(parsedNormal.headline, 'Penjualan hari ini naik 10% dibanding kemarin.');
assert.strictEqual(parsedNormal.highlights.length, 1);
assert.strictEqual(parsedNormal.bestSeller.name, 'Dimsum Mentai');
assert.strictEqual(parsedNormal.degraded, false);
console.log('✅ PASS: parseAndSanitizeAiResponse memproses JSON standar dengan benar.');

const fencedJson = '```json\n' + normalJson + '\n```';
const parsedFenced = parseAndSanitizeAiResponse(fencedJson);
assert.strictEqual(parsedFenced.headline, 'Penjualan hari ini naik 10% dibanding kemarin.');
assert.strictEqual(parsedFenced.degraded, false);
console.log('✅ PASS: parseAndSanitizeAiResponse toleran terhadap markdown code fence (```json ... ```).');

// Test Parser: Degraded Fallback jika output model bukan JSON
const invalidJson = 'Maaf saya tidak dapat menghasilkan JSON saat ini.';
const parsedInvalid = parseAndSanitizeAiResponse(invalidJson);
assert.strictEqual(parsedInvalid.degraded, true);
assert.strictEqual(parsedInvalid.headline, invalidJson);
assert.deepStrictEqual(parsedInvalid.highlights, []);
console.log('✅ PASS: parseAndSanitizeAiResponse menangani fallback degraded jika AI tidak membalas JSON.');

// 2. Uji buildAiSnapshot (Snapshot Engine)
const aiSnapshotTs = fs.readFileSync('pos-kasir/src/utils/aiSnapshot.ts', 'utf8');
const ts = require('../pos-kasir/node_modules/typescript');
const transpiled = ts.transpileModule(aiSnapshotTs, {
  compilerOptions: { module: ts.ModuleKind.CommonJS }
}).outputText;

const snapshotExports = {};
const evalModule = new Function('exports', transpiled);
evalModule(snapshotExports);

const { buildAiSnapshot } = snapshotExports;

// Uji Periode Kosong
const emptyRes = buildAiSnapshot({
  dashboardData: { transactions: [], transactionItems: [] },
  selectedBranch: 'all',
  period: 'today',
  outletsList: [],
  cashiersList: [],
  productsList: [],
  ingredientsList: [],
  shiftTolerance: 10000,
  now: new Date('2026-11-04T14:30:00+07:00')
});
assert.strictEqual(emptyRes.empty, true, 'FAIL: Harus mengembalikan empty: true jika tidak ada transaksi');
console.log('✅ PASS: buildAiSnapshot mengembalikan empty: true untuk periode kosong tanpa memanggil AI.');

// Uji Snapshot dengan Transaksi & Perbandingan Jam yang Sama
const mockDashboardData = {
  transactions: [
    // Hari ini pk 10:00
    { id: 'tx-1', timestamp: '2026-11-04 10:00:00', branchId: 'braga', cashier: 'Budi', total: 50000, promo_discount: 5000, manual_discount: 0, payment_method: 'QRIS', status: 'PAID' },
    // Hari ini pk 13:00
    { id: 'tx-2', timestamp: '2026-11-04 13:00:00', branchId: 'braga', cashier: 'Budi', total: 75000, promo_discount: 0, manual_discount: 5000, payment_method: 'CASH', status: 'PAID' },
    // Hari ini Void
    { id: 'tx-3', timestamp: '2026-11-04 11:00:00', branchId: 'braga', cashier: 'Budi', total: 30000, status: 'void' },
    // Kemarin pk 09:30 (sebelum jam 14:30)
    { id: 'tx-prev-1', timestamp: '2026-11-03 09:30:00', branchId: 'braga', cashier: 'Budi', total: 40000, status: 'PAID' },
    // Kemarin pk 20:00 (setelah jam 14:30 -> harus dikecualikan saat jam sekarang 14:30)
    { id: 'tx-prev-2', timestamp: '2026-11-03 20:00:00', branchId: 'braga', cashier: 'Budi', total: 100000, status: 'PAID' },
  ],
  transactionItems: [
    { transaction_id: 'tx-1', product_name: 'Dimsum Mentai', qty: 2, unit_price: 25000 },
    { transaction_id: 'tx-2', product_name: 'Dimsum Mentai', qty: 1, unit_price: 25000 },
    { transaction_id: 'tx-2', product_name: 'Hakau Udang', qty: 2, unit_price: 25000 },
    { transaction_id: 'tx-prev-1', product_name: 'Dimsum Mentai', qty: 1, unit_price: 25000 }
  ],
  shiftReports: [
    { cashier: 'Budi', outlet: 'braga', selisih: 15000, date: '2026-11-04' } // selisih > shiftTolerance
  ],
  ingredients: [
    { id: 1, name: 'Daging Udang', current_stock: 2, min_stock_threshold: 5, unit: 'kg', is_tracked: true, branchId: 'braga' }
  ]
};

const mockOutlets = [{ id: 'braga', name: 'Braga', target: 200000 }];
const mockCashiers = [{ id: 1, name: 'Budi', branchId: 'braga' }];
const mockProducts = [
  { id: 1, name: 'Dimsum Mentai', price: 25000, cost: 12000 },
  { id: 2, name: 'Hakau Udang', price: 25000, cost: 13000 },
  { id: 3, name: 'Lumpia Kulit Tahu', price: 22000, cost: 10000 }
];

// 2a. Uji pada jam 14:30 WIB
const snapshot1430 = buildAiSnapshot({
  dashboardData: mockDashboardData,
  selectedBranch: 'braga',
  period: 'today',
  outletsList: mockOutlets,
  cashiersList: mockCashiers,
  productsList: mockProducts,
  ingredientsList: mockDashboardData.ingredients,
  shiftTolerance: 10000,
  now: new Date('2026-11-04T14:30:00+07:00')
});

assert.strictEqual(snapshot1430.current.omzet, 125000, 'Omzet hari ini harus 125.000 (tx-1 + tx-2)');
assert.strictEqual(snapshot1430.current.transactions, 2, 'Jumlah transaksi aktif harus 2');
assert.strictEqual(snapshot1430.current.voidCount, 1, 'Jumlah void harus 1');
assert.strictEqual(snapshot1430.previous.omzet, 40000, 'Pembanding kemarin hingga pk 14:30 hanya tx-prev-1 (40.000)');
assert(snapshot1430.delta.omzet > 0, 'Delta omzet harus positif (naik)');
assert(snapshot1430.meta.comparedTo.includes('kemarin hingga pk 14:30'), 'Label comparedTo harus memuat jam');
assert.strictEqual(snapshot1430.topProducts[0].name, 'Dimsum Mentai', 'Top seller harus Dimsum Mentai');
assert.strictEqual(snapshot1430.topProducts[0].qty, 3, 'Qty Dimsum Mentai harus 3');
assert(snapshot1430.flags.some(f => f.code === 'SELISIH_KAS'), 'Harus mendeteksi flag SELISIH_KAS');
assert(snapshot1430.flags.some(f => f.code === 'STOK_MENIPIS'), 'Harus mendeteksi flag STOK_MENIPIS');
console.log('✅ PASS: buildAiSnapshot akurat pada pukul 14:30 WIB (pembanding jam yang sama, KPI, flags).');

// 2b. Uji pada jam 22:00 WIB (mencakup tx-prev-2 kemarin)
const snapshot2200 = buildAiSnapshot({
  dashboardData: mockDashboardData,
  selectedBranch: 'braga',
  period: 'today',
  outletsList: mockOutlets,
  cashiersList: mockCashiers,
  productsList: mockProducts,
  ingredientsList: mockDashboardData.ingredients,
  shiftTolerance: 10000,
  now: new Date('2026-11-04T22:00:00+07:00')
});
assert.strictEqual(snapshot2200.previous.omzet, 140000, 'Pembanding kemarin hingga pk 22:00 mencakup tx-prev-1 dan tx-prev-2 (140.000)');
console.log('✅ PASS: buildAiSnapshot akurat pada pukul 22:00 WIB (mencakup transaksi sore/malam kemarin).');

// 3. Batasan Snapshot: Ukuran JSON dan Keamanan Privasi
const jsonSnapshot = JSON.stringify(snapshot1430);
assert(jsonSnapshot.length < 6 * 1024, `Ukuran snapshot harus < 6 KB (aktual: ${jsonSnapshot.length} bytes)`);
assert(!jsonSnapshot.includes('invoice_no'), 'Snapshot TIDAK boleh memuat invoice_no');
assert(!jsonSnapshot.includes('PIN'), 'Snapshot TIDAK boleh memuat PIN');
assert(!jsonSnapshot.includes('token'), 'Snapshot TIDAK boleh memuat token');
assert(!jsonSnapshot.includes('http'), 'Snapshot TIDAK boleh memuat URL');
console.log(`✅ PASS: Ukuran snapshot aman (${jsonSnapshot.length} bytes < 6KB) dan bersih dari kredensial/PIN/URL.`);

// 4. Verifikasi appsscript.json memiliki oauthScopes eksternal
const appsscriptJson = JSON.parse(fs.readFileSync('google-apps-script/appsscript.json', 'utf8'));
assert(
  appsscriptJson.oauthScopes &&
  appsscriptJson.oauthScopes.includes('https://www.googleapis.com/auth/script.external_request'),
  'FAIL: appsscript.json wajib memuat oauthScope external_request untuk UrlFetchApp'
);
console.log('✅ PASS: appsscript.json memuat scope external_request.');

// 5. Verifikasi error mapping klien gasApi.ts
const gasApiTs = fs.readFileSync('pos-kasir/src/services/gasApi.ts', 'utf8')
  .replace(/import\.meta/g, '({ env: {} })');
const gasApiTranspiled = ts.transpileModule(gasApiTs, {
  compilerOptions: { module: ts.ModuleKind.CommonJS }
}).outputText;
const gasApiExports = {};
const evalGasApi = new Function('exports', 'require', gasApiTranspiled);
evalGasApi(gasApiExports, () => ({}));
const { mapAiErrorMessage } = gasApiExports;

assert.strictEqual(mapAiErrorMessage('Failed to fetch', false).code, 'AI_OFFLINE');
assert.strictEqual(mapAiErrorMessage('The user aborted a request', false).code, 'AI_TIMEOUT');
assert.strictEqual(mapAiErrorMessage('[AI_NOT_CONFIGURED] Kunci API belum diisi', false).code, 'AI_NOT_CONFIGURED');
assert.strictEqual(mapAiErrorMessage('[AI_FORBIDDEN] Kode akses salah', false).isAuthError, true);
assert.strictEqual(mapAiErrorMessage('[AI_QUOTA] Kuota habis', false).code, 'AI_QUOTA');
assert.strictEqual(mapAiErrorMessage('[AI_RATE_LIMIT] Limit harian tercapai', false).code, 'AI_RATE_LIMIT');
console.log('✅ PASS: mapAiErrorMessage memetakan seluruh status error ke pesan pengguna.');

console.log('\n--- SEMUA PENGUJIAN OTOMATIS BERHASIL! (100% PASS) ---');
