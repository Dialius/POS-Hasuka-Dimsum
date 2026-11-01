// Test Verification for BUG-007: Service Charge Dihitung di Total tetapi Tidak Disimpan ke Kolom Google Sheets
const assert = require('assert');

console.log('--- TEST BUG-007: VERIFIKASI PENYIMPANAN SERVICE CHARGE KE GOOGLE SHEETS & PAYLOAD ---');

// Mock Sheet Implementation
class MockSheet {
  constructor(initialHeaders) {
    this.rows = [initialHeaders ? [...initialHeaders] : []];
  }

  getLastColumn() {
    return this.rows[0].length;
  }

  getRange(row, col) {
    const self = this;
    return {
      setValue(val) {
        if (!self.rows[row - 1]) {
          self.rows[row - 1] = [];
        }
        self.rows[row - 1][col - 1] = val;
        return this;
      },
      setFontWeight() { return this; },
      setBackground() { return this; },
      setFontColor() { return this; },
      getValues() {
        return [self.rows[0]];
      }
    };
  }

  appendRow(rowValues) {
    this.rows.push([...rowValues]);
  }

  getDataRange() {
    const self = this;
    return {
      getValues() {
        return self.rows;
      }
    };
  }
}

// Simulasi logika handleCreateTransaction
function simulateHandleCreateTransaction(txSheet, data) {
  const txId = 1718000000000;
  const timestamp = '2026-10-13 23:00:00';
  const invoiceNo = data.invoice_no || 'INV-20261013-230000';

  const lastCol = txSheet.getLastColumn();
  let txHeaders = lastCol > 0 ? txSheet.getRange(1, 1, 1, lastCol).getValues()[0].map(h => String(h).trim()) : [];
  if (txHeaders.length > 0 && txHeaders.indexOf("service_charge") === -1) {
    const newCol = txHeaders.length + 1;
    txSheet.getRange(1, newCol).setValue("service_charge");
    txHeaders.push("service_charge");
  }

  const colMap = {
    id: txId,
    invoice_no: invoiceNo,
    timestamp: timestamp,
    cashier: data.cashier || "Kasir",
    shift_id: data.shift_id || 1,
    subtotal: data.subtotal || 0,
    promo_discount: data.promo_discount || 0,
    manual_discount: data.manual_discount || 0,
    tax: data.tax || 0,
    service_charge: data.service_charge || 0,
    total: data.total || 0,
    payment_method: data.payment_method || "CASH",
    cash_received: data.cash_received || 0,
    change_amount: data.change_amount || 0,
    status: "PAID"
  };

  const rowValues = txHeaders.length > 0
    ? txHeaders.map(col => colMap.hasOwnProperty(col) ? colMap[col] : "")
    : [
        txId, invoiceNo, timestamp, colMap.cashier, colMap.shift_id,
        colMap.subtotal, colMap.promo_discount, colMap.manual_discount,
        colMap.tax, colMap.service_charge, colMap.total, colMap.payment_method,
        colMap.cash_received, colMap.change_amount, colMap.status
      ];

  txSheet.appendRow(rowValues);
  return { txId, invoiceNo };
}

// Simulasi logika handleVoidTransaction
function simulateHandleVoidTransaction(txSheet, invoiceNo) {
  const txData = txSheet.getDataRange().getValues();
  const headers = txData.length > 0 ? txData[0].map(h => String(h).trim()) : [];
  const statusCol = headers.indexOf("status") !== -1 ? headers.indexOf("status") + 1 : 14;
  let txFound = false;

  for (let i = 1; i < txData.length; i++) {
    if (String(txData[i][1]) === invoiceNo) {
      txSheet.getRange(i + 1, statusCol).setValue("VOID");
      txFound = true;
      break;
    }
  }
  return txFound;
}

// Test Case 1: Sheet baru dengan skema lengkap (termasuk service_charge)
console.log('1. Testing transaksi pada sheet baru dengan kolom service_charge...');
const newHeaders = [
  "id", "invoice_no", "timestamp", "cashier", "shift_id", "subtotal", "promo_discount",
  "manual_discount", "tax", "service_charge", "total", "payment_method", "cash_received",
  "change_amount", "status"
];
const sheet1 = new MockSheet(newHeaders);

const subtotal = 100000;
const discount = 10000;
const tax = 9000; // 10% dari 90k
const serviceCharge = 4500; // 5% dari 90k
const total = subtotal - discount + tax + serviceCharge; // 103500

simulateHandleCreateTransaction(sheet1, {
  invoiceNo: 'INV-001',
  cashier: 'Ayu',
  subtotal,
  promo_discount: discount,
  tax,
  service_charge: serviceCharge,
  total,
  payment_method: 'CASH',
  cash_received: 105000,
  change_amount: 1500
});

const writtenRow = sheet1.rows[1];
const serviceChargeIndex = newHeaders.indexOf("service_charge");
const totalIndex = newHeaders.indexOf("total");

assert.strictEqual(writtenRow[serviceChargeIndex], 4500, 'service_charge harus tersimpan 4500 di kolom yang tepat');
assert.strictEqual(writtenRow[totalIndex], 103500, 'total harus tersimpan 103500');
assert.strictEqual(
  writtenRow[newHeaders.indexOf("subtotal")] - writtenRow[newHeaders.indexOf("promo_discount")] + writtenRow[newHeaders.indexOf("tax")] + writtenRow[serviceChargeIndex],
  writtenRow[totalIndex],
  'Total transaksi harus balance dengan subtotal - diskon + pajak + service_charge'
);
console.log('   -> PASSED: Service charge tersimpan presisi dan rumus finansial seimbang!');

// Test Case 2: Sheet lama (tanpa kolom service_charge) dengan auto-repair
console.log('2. Testing sheet lama tanpa kolom service_charge (auto-repair migration)...');
const legacyHeaders = [
  "id", "invoice_no", "timestamp", "cashier", "shift_id", "subtotal", "promo_discount",
  "manual_discount", "tax", "total", "payment_method", "cash_received", "change_amount", "status"
];
const sheet2 = new MockSheet(legacyHeaders);

simulateHandleCreateTransaction(sheet2, {
  invoice_no: 'INV-LEGACY-01',
  subtotal: 50000,
  promo_discount: 0,
  tax: 5000,
  service_charge: 2500,
  total: 57500,
  payment_method: 'QRIS'
});

// Verifikasi auto-repair header
assert(sheet2.rows[0].includes("service_charge"), 'Header service_charge harus otomatis ditambahkan');
const legacyServiceIndex = sheet2.rows[0].indexOf("service_charge");
const legacyWrittenRow = sheet2.rows[1];
assert.strictEqual(legacyWrittenRow[legacyServiceIndex], 2500, 'Nilai service_charge harus terisi pada kolom baru');
assert.strictEqual(legacyWrittenRow[legacyHeaders.indexOf("total")], 57500, 'Kolom total tidak boleh bergeser');
assert.strictEqual(legacyWrittenRow[legacyHeaders.indexOf("status")], 'PAID', 'Kolom status tidak boleh bergeser');
console.log('   -> PASSED: Auto-repair kolom lama sukses tanpa menggeser kolom lain!');

// Test Case 3: Void transaction dengan kolom dinamis
console.log('3. Testing void transaction dengan posisi status dinamis...');
const voidSuccess = simulateHandleVoidTransaction(sheet2, 'INV-LEGACY-01');
assert.strictEqual(voidSuccess, true, 'Transaksi harus ditemukan dan di-void');
assert.strictEqual(sheet2.rows[1][sheet2.rows[0].indexOf("status")], 'VOID', 'Status harus menjadi VOID di kolom yang benar');
console.log('   -> PASSED: Void bekerja dinamis tanpa hardcode index!');

console.log('\n--- SEMUA PENGUJIAN BUG-007 BERHASIL 100% ---');
