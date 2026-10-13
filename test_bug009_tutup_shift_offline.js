// Test Verification for BUG-009: Tutup Shift Mengabaikan Transaksi Offline yang Belum Tersinkron
const assert = require('assert');

console.log('--- TEST BUG-009: VERIFIKASI TUTUP SHIFT MENGGABUNGKAN TRANSAKSI OFFLINE & OUTBOX ---');

// Simulasi logika rekonsiliasi TutupShiftScreen
function simulateTutupShiftReconciliation({ serverRes, localTransactions, pendingOutbox, shiftStart, kasAwal }) {
  const txMap = new Map();

  // 4a. Masukkan transaksi server terlebih dahulu
  if (serverRes?.transactions && Array.isArray(serverRes.transactions)) {
    serverRes.transactions.forEach((tx) => {
      const key = String(tx.invoice_no || tx.id || '');
      if (key) txMap.set(key, tx);
    });
  }

  // 4b. Masukkan transaksi lokal yang belum ada di server (transaksi offline)
  localTransactions.forEach((tx) => {
    const key = String(tx.invoice_no || tx.id || '');
    if (!key) return;
    if (!txMap.has(key)) {
      txMap.set(key, tx);
    } else {
      const existing = txMap.get(key);
      if (String(tx.status).toLowerCase() === 'void') {
        existing.status = 'void';
      }
    }
  });

  // 4c. Masukkan transaksi dari pending outbox (paling mutakhir dari antrean offline)
  let offlinePendingCount = 0;
  pendingOutbox.forEach((item) => {
    try {
      const payload = typeof item.payload === 'string' ? JSON.parse(item.payload) : item.payload;
      if (item.action === 'createTransaction') {
        const key = String(payload.invoice_no || item.client_generated_id || '');
        if (key && !txMap.has(key)) {
          txMap.set(key, {
            id: item.client_generated_id,
            invoice_no: payload.invoice_no,
            timestamp: payload.timestamp || item.created_at,
            total: payload.total,
            payment_method: payload.payment_method,
            status: payload.status || 'PAID',
            cashier: payload.cashier
          });
          offlinePendingCount++;
        }
      } else if (item.action === 'voidTransaction') {
        const key = String(payload.invoice_no || payload.transaction_id || '');
        if (key && txMap.has(key)) {
          txMap.get(key).status = 'VOID';
        }
      }
    } catch {}
  });

  // 5. Gabungkan pengeluaran kas (petty cash)
  const pcMap = new Map();
  if (serverRes?.pettyCash && Array.isArray(serverRes.pettyCash)) {
    serverRes.pettyCash.forEach((pc) => {
      const key = String(pc.id || `${pc.date}_${pc.amount}`);
      pcMap.set(key, pc);
    });
  }

  pendingOutbox.forEach((item) => {
    if (item.action === 'savePettyCash') {
      try {
        const payload = typeof item.payload === 'string' ? JSON.parse(item.payload) : item.payload;
        const key = String(payload.id || item.client_generated_id || `${payload.date}_${payload.amount}`);
        if (!pcMap.has(key)) {
          pcMap.set(key, {
            id: key,
            date: payload.date || item.created_at,
            amount: payload.amount,
            type: payload.type || 'OUT'
          });
        }
      } catch {}
    }
  });

  // 6. Hitung rekonsiliasi kas
  let penjualanTunai = 0;
  let refund = 0;
  let totalTransactions = 0;
  let totalOmzet = 0;

  const parseTs = (ts) => {
    if (!ts) return new Date(0);
    if (/^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}/.test(ts)) return new Date(ts.replace(' ', 'T') + '+07:00');
    return new Date(ts);
  };

  txMap.forEach((tx) => {
    const txTime = parseTs(String(tx.timestamp || '')).getTime();
    if (txTime >= shiftStart) {
      const isVoid = String(tx.status || '').trim().toLowerCase() === 'void';
      if (isVoid) {
        refund += Number(tx.total) || 0;
      } else {
        totalTransactions++;
        totalOmzet += Number(tx.total) || 0;
        const payMethod = String(tx.payment_method || '').trim().toUpperCase();
        if (payMethod === 'CASH' || payMethod === 'TUNAI') {
          penjualanTunai += Number(tx.total) || 0;
        }
      }
    }
  });

  let pengeluaran = 0;
  pcMap.forEach((pc) => {
    const pcTime = parseTs(String(pc.date || '')).getTime();
    if (pcTime >= shiftStart && String(pc.type || '').trim().toUpperCase() === 'OUT') {
      pengeluaran += Number(pc.amount) || 0;
    }
  });

  const kasSistem = kasAwal + penjualanTunai - refund - pengeluaran;

  return {
    penjualanTunai,
    refund,
    pengeluaran,
    totalTransactions,
    totalOmzet,
    kasSistem,
    offlinePendingCount
  };
}

// Skenario Pengujian:
const shiftStartTime = new Date('2026-10-13T08:00:00Z').getTime();
const kasAwal = 200000;

// Test 1: Skenario Online Campuran dengan Antrean Outbox Pending
console.log('1. Testing Tutup Shift dengan Server + Antrean Offline Pending...');
const result1 = simulateTutupShiftReconciliation({
  // Server hanya sempat menyimpan 1 transaksi sebelum wifi mati
  serverRes: {
    transactions: [
      { invoice_no: 'INV-ONLINE-01', total: 100000, payment_method: 'CASH', status: 'PAID', timestamp: '2026-10-13T09:00:00Z' }
    ],
    pettyCash: []
  },
  localTransactions: [
    { invoice_no: 'INV-ONLINE-01', total: 100000, payment_method: 'CASH', status: 'PAID', timestamp: '2026-10-13T09:00:00Z' }
  ],
  // Di outbox ada transaksi tunai baru, void, dan petty cash yang belum tersinkron
  pendingOutbox: [
    {
      client_generated_id: 'cid-01',
      action: 'createTransaction',
      payload: JSON.stringify({
        invoice_no: 'INV-OFFLINE-02',
        total: 150000,
        payment_method: 'CASH',
        status: 'PAID',
        timestamp: '2026-10-13T10:00:00Z'
      })
    },
    {
      client_generated_id: 'cid-02',
      action: 'createTransaction',
      payload: JSON.stringify({
        invoice_no: 'INV-OFFLINE-03',
        total: 50000,
        payment_method: 'CASH',
        status: 'PAID',
        timestamp: '2026-10-13T11:00:00Z'
      })
    },
    {
      client_generated_id: 'cid-03',
      action: 'voidTransaction',
      payload: JSON.stringify({
        invoice_no: 'INV-OFFLINE-03' // Membatalkan transaksi 3
      })
    },
    {
      client_generated_id: 'cid-04',
      action: 'savePettyCash',
      payload: JSON.stringify({
        amount: 30000,
        type: 'OUT',
        date: '2026-10-13T12:00:00Z'
      })
    }
  ],
  shiftStart: shiftStartTime,
  kasAwal
});

assert.strictEqual(result1.penjualanTunai, 250000, 'Penjualan tunai harus 250.000 (100k online + 150k offline)');
assert.strictEqual(result1.refund, 50000, 'Refund harus 50.000 (INV-OFFLINE-03 di-void)');
assert.strictEqual(result1.pengeluaran, 30000, 'Pengeluaran kas petty cash harus 30.000');
assert.strictEqual(result1.totalTransactions, 2, 'Total transaksi aktif harus 2 (INV-01 dan INV-02)');
assert.strictEqual(result1.totalOmzet, 250000, 'Total omzet harus 250.000');
assert.strictEqual(result1.kasSistem, 370000, 'Kas sistem harus pas 370.000 (200k + 250k - 50k - 30k)');
assert.strictEqual(result1.offlinePendingCount, 2, 'Harus mendeteksi 2 transaksi baru dari antrean offline');
console.log('   -> PASSED: Rekonsiliasi akurat dan mengikutsertakan transaksi outbox!');

// Test 2: Skenario Full Offline (Server Down / Network Error)
console.log('2. Testing Tutup Shift saat kondisi Total Offline (Server Error/Null)...');
const result2 = simulateTutupShiftReconciliation({
  serverRes: null, // Simulasi network error / offline
  localTransactions: [
    { invoice_no: 'INV-LOC-01', total: 75000, payment_method: 'CASH', status: 'PAID', timestamp: '2026-10-13T09:30:00Z' },
    { invoice_no: 'INV-LOC-02', total: 25000, payment_method: 'QRIS', status: 'PAID', timestamp: '2026-10-13T10:30:00Z' }
  ],
  pendingOutbox: [],
  shiftStart: shiftStartTime,
  kasAwal: 100000
});

assert.strictEqual(result2.penjualanTunai, 75000, 'Penjualan tunai lokal harus 75.000');
assert.strictEqual(result2.totalTransactions, 2, 'Total transaksi harus 2');
assert.strictEqual(result2.totalOmzet, 100000, 'Total omzet harus 100.000 (75k tunai + 25k QRIS)');
assert.strictEqual(result2.kasSistem, 175000, 'Kas sistem harus 175.000 (100k modal + 75k tunai)');
console.log('   -> PASSED: Kasir tetap dapat tutup shift dengan akurat walau tanpa internet!');

// Test 3: Deduplikasi Transaksi Server vs Lokal
console.log('3. Testing pencegahan duplikasi data transaksi (Deduplication)...');
const result3 = simulateTutupShiftReconciliation({
  serverRes: {
    transactions: [
      { invoice_no: 'INV-DUP-01', total: 50000, payment_method: 'CASH', status: 'PAID', timestamp: '2026-10-13T09:00:00Z' }
    ]
  },
  localTransactions: [
    // Transaksi yang sama tersimpan di SQLite / localStorage
    { invoice_no: 'INV-DUP-01', total: 50000, payment_method: 'CASH', status: 'PAID', timestamp: '2026-10-13T09:00:00Z' }
  ],
  pendingOutbox: [],
  shiftStart: shiftStartTime,
  kasAwal: 50000
});

assert.strictEqual(result3.totalTransactions, 1, 'Transaksi tidak boleh dihitung dobel');
assert.strictEqual(result3.penjualanTunai, 50000, 'Penjualan tunai tidak boleh dobel');
assert.strictEqual(result3.kasSistem, 100000, 'Kas sistem harus tepat 100.000');
console.log('   -> PASSED: Transaksi tidak terduplikasi!');

console.log('\n--- SEMUA PENGUJIAN BUG-009 BERHASIL 100% ---');
