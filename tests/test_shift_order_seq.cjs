const assert = require('assert');

// Simulasi shift order sequence storage & generator
const storage = {};

function openShift(shiftId) {
  storage['hasuka_active_shift'] = JSON.stringify({ id: shiftId });
  storage[`hasuka_shift_seq_${shiftId}`] = '0';
}

function getNextOrderNumber(shiftId) {
  const seqKey = `hasuka_shift_seq_${shiftId}`;
  let cur = parseInt(storage[seqKey] || '0', 10);
  const next = cur + 1;
  storage[seqKey] = String(next);
  return String(next).padStart(3, '0');
}

// 1. Shift 1 - Aji (09.00 - 15.00)
const shift1Id = 'shift_aji_001';
openShift(shift1Id);

console.log('--- Shift 1 (Aji) ---');
const ajiTx1 = getNextOrderNumber(shift1Id);
console.log('Pesanan 1:', ajiTx1);
assert.strictEqual(ajiTx1, '001');

const ajiTx2 = getNextOrderNumber(shift1Id);
console.log('Pesanan 2:', ajiTx2);
assert.strictEqual(ajiTx2, '002');

// Lompati sampai pesanan 25
for (let i = 3; i < 25; i++) getNextOrderNumber(shift1Id);
const ajiTx25 = getNextOrderNumber(shift1Id);
console.log('Pesanan 25:', ajiTx25);
assert.strictEqual(ajiTx25, '025');

// 2. Tutup Shift 1 & Buka Shift 2 - Onik (15.00 - Selesai)
const shift2Id = 'shift_onik_002';
openShift(shift2Id);

console.log('--- Shift 2 (Onik) ---');
const onikTx1 = getNextOrderNumber(shift2Id);
console.log('Pesanan 1:', onikTx1);
assert.strictEqual(onikTx1, '001', 'Shift 2 order 1 must reset back to 001');

const onikTx2 = getNextOrderNumber(shift2Id);
console.log('Pesanan 2:', onikTx2);
assert.strictEqual(onikTx2, '002', 'Shift 2 order 2 must be 002');

// Cek apakah nomor pesanan shift 1 tetap utuh di historisnya
assert.strictEqual(storage[`hasuka_shift_seq_${shift1Id}`], '25', 'Shift 1 count preserved');
assert.strictEqual(storage[`hasuka_shift_seq_${shift2Id}`], '2', 'Shift 2 count is at 2');

console.log('VERIFIKASI RESET NOMOR URUT PER SHIFT LULUS 100%!');
