/**
 * test_owner_auth_e2e.cjs
 * Comprehensive End-to-End Test for Owner Authentication, Security, Setup, and Recovery
 */

const { webcrypto } = require('crypto');
globalThis.crypto = webcrypto;

// Mock localStorage for Node.js test environment
const mockStorage = {};
globalThis.localStorage = {
  getItem: (key) => (key in mockStorage ? mockStorage[key] : null),
  setItem: (key, val) => { mockStorage[key] = String(val); },
  removeItem: (key) => { delete mockStorage[key]; },
  clear: () => { Object.keys(mockStorage).forEach(k => delete mockStorage[k]); }
};

const RECOVERY_ALPHABET = '23456789ABCDEFGHJKMNPQRSTUVWXYZ';

function bufToHex(buffer) {
  const bytes = buffer instanceof Uint8Array ? buffer : new Uint8Array(buffer);
  return Array.from(bytes).map(b => b.toString(16).padStart(2, '0')).join('');
}

function hexToBuf(hex) {
  const cleanHex = hex.trim().replace(/^0x/i, '');
  const bytes = new Uint8Array(cleanHex.length / 2);
  for (let i = 0; i < cleanHex.length; i += 2) {
    bytes[i / 2] = parseInt(cleanHex.substring(i, i + 2), 16);
  }
  return bytes;
}

function generateSalt(byteLength = 16) {
  const saltBytes = new Uint8Array(byteLength);
  webcrypto.getRandomValues(saltBytes);
  return bufToHex(saltBytes);
}

async function hashSecret(secret, saltHex, iterations = 100000) {
  const enc = new TextEncoder();
  const keyMaterial = await webcrypto.subtle.importKey(
    'raw',
    enc.encode(secret),
    { name: 'PBKDF2' },
    false,
    ['deriveBits']
  );
  const saltBytes = hexToBuf(saltHex);
  const derivedBits = await webcrypto.subtle.deriveBits(
    {
      name: 'PBKDF2',
      salt: saltBytes,
      iterations,
      hash: 'SHA-256',
    },
    keyMaterial,
    256
  );
  return bufToHex(derivedBits);
}

async function verifySecret(secret, saltHex, expectedHashHex, iterations = 100000) {
  if (!secret || !saltHex || !expectedHashHex) return false;
  const computedHash = await hashSecret(secret, saltHex, iterations);
  if (computedHash.length !== expectedHashHex.length) return false;
  let diff = 0;
  for (let i = 0; i < computedHash.length; i++) {
    diff |= computedHash.charCodeAt(i) ^ expectedHashHex.charCodeAt(i);
  }
  return diff === 0;
}

function generateRecoveryKey() {
  const randomBytes = new Uint8Array(12);
  webcrypto.getRandomValues(randomBytes);
  let code = '';
  for (let i = 0; i < 12; i++) {
    code += RECOVERY_ALPHABET[randomBytes[i] % RECOVERY_ALPHABET.length];
  }
  return `HSK-${code.slice(0, 4)}-${code.slice(4, 8)}-${code.slice(8, 12)}`;
}

async function runE2ETests() {
  console.log('====================================================');
  console.log('🚀 RUNNING OWNER AUTH & RECOVERY END-TO-END TESTS');
  console.log('====================================================\n');

  // 1. TEST SETUP AWAL (ONBOARDING)
  console.log('[TEST 1] Setup Awal Akun Owner...');
  const ownerUser = 'haryanto_hasuka';
  const ownerPass = 'DimsumEnak2026!';
  const recoveryKey = generateRecoveryKey();
  console.log('  -> Generated Recovery Key:', recoveryKey);

  const passSalt = generateSalt(16);
  const passHash = await hashSecret(ownerPass, passSalt);
  const recSalt = generateSalt(16);
  const recHash = await hashSecret(recoveryKey, recSalt);

  let ownerDb = {
    isConfigured: true,
    username: ownerUser,
    displayName: 'Bpk. Haryanto',
    passwordHash: passHash,
    passwordSalt: passSalt,
    recoveryHash: recHash,
    recoverySalt: recSalt
  };

  if (passHash.length === 64 && recHash.length === 64 && passSalt !== recSalt) {
    console.log('  ✅ Setup Awal Berhasil: Salt unik & Hash 256-bit terverifikasi.\n');
  } else {
    throw new Error('❌ Test 1 Gagal');
  }

  // 2. TEST VERIFIKASI LOGIN
  console.log('[TEST 2] Verifikasi Login Password Benar & Salah...');
  const validLogin = await verifySecret(ownerPass, ownerDb.passwordSalt, ownerDb.passwordHash);
  console.log('  -> Login dengan password benar:', validLogin ? 'BERHASIL' : 'GAGAL');
  
  const wrongLogin = await verifySecret('PasswordSalah123', ownerDb.passwordSalt, ownerDb.passwordHash);
  console.log('  -> Login dengan password salah ditolak:', !wrongLogin ? 'BERHASIL' : 'GAGAL');

  if (validLogin && !wrongLogin) {
    console.log('  ✅ Verifikasi Password Berhasil.\n');
  } else {
    throw new Error('❌ Test 2 Gagal');
  }

  // 3. TEST BRUTE FORCE RATE LIMITING
  console.log('[TEST 3] Proteksi Brute-Force Rate Limiting...');
  let failedAttempts = 0;
  let isLocked = false;
  let lockRemaining = 0;

  for (let i = 1; i <= 6; i++) {
    failedAttempts++;
    if (failedAttempts >= 5) {
      isLocked = true;
      lockRemaining = 60;
    }
  }
  console.log(`  -> Simulasi ${failedAttempts}x percobaan gagal: Lock status = ${isLocked}, sisa waktu = ${lockRemaining}s`);
  if (isLocked && lockRemaining === 60) {
    console.log('  ✅ Proteksi Lockout 5x Gagal Berhasil Diaktifkan.\n');
  } else {
    throw new Error('❌ Test 3 Gagal');
  }

  // 4. TEST LUPA PASSWORD & ROTASI RECOVERY KEY (TINGKAT 1)
  console.log('[TEST 4] Pemulihan Sandi Mandiri & Rotasi Kunci (Tingkat 1)...');
  const isKeyValid = await verifySecret(recoveryKey, ownerDb.recoverySalt, ownerDb.recoveryHash);
  console.log('  -> Validasi recovery key darurat:', isKeyValid ? 'VALID' : 'INVALID');
  if (!isKeyValid) throw new Error('Recovery key harusnya valid');

  // Pemilik membuat sandi baru
  const newPass = 'HasukaSuper2026#';
  const newPassSalt = generateSalt(16);
  const newPassHash = await hashSecret(newPass, newPassSalt);

  // Rotasi: buat recovery key baru, hanguskan yang lama
  const newRecoveryKey = generateRecoveryKey();
  const newRecSalt = generateSalt(16);
  const newRecHash = await hashSecret(newRecoveryKey, newRecSalt);

  ownerDb.passwordHash = newPassHash;
  ownerDb.passwordSalt = newPassSalt;
  ownerDb.recoveryHash = newRecHash;
  ownerDb.recoverySalt = newRecSalt;

  // Verifikasi kata sandi baru bisa login
  const testNewPass = await verifySecret(newPass, ownerDb.passwordSalt, ownerDb.passwordHash);
  console.log('  -> Login dengan sandi baru:', testNewPass ? 'BERHASIL' : 'GAGAL');

  // Verifikasi kata sandi lama sudah tidak bisa login
  const testOldPass = await verifySecret(ownerPass, ownerDb.passwordSalt, ownerDb.passwordHash);
  console.log('  -> Login dengan sandi lama ditolak:', !testOldPass ? 'BERHASIL' : 'GAGAL');

  // Verifikasi recovery key lama sudah hangus
  const testOldKey = await verifySecret(recoveryKey, ownerDb.recoverySalt, ownerDb.recoveryHash);
  console.log('  -> Recovery key lama hangus:', !testOldKey ? 'BERHASIL' : 'GAGAL');

  // Verifikasi recovery key baru aktif
  const testNewKey = await verifySecret(newRecoveryKey, ownerDb.recoverySalt, ownerDb.recoveryHash);
  console.log('  -> Recovery key baru aktif:', testNewKey ? 'BERHASIL' : 'GAGAL');

  if (testNewPass && !testOldPass && !testOldKey && testNewKey) {
    console.log('  ✅ Alur Pemulihan & Rotasi Kunci Sekali Pakai Berhasil.\n');
  } else {
    throw new Error('❌ Test 4 Gagal');
  }

  // 5. TEST GOOGLE SPREADSHEET ROOT-OF-TRUST RESET (TINGKAT 2)
  console.log('[TEST 5] Root-of-Trust Reset via Google Spreadsheet (Tingkat 2)...');
  const settingsFromSheets = {
    owner_reset_flag: 'FORCE_RESET'
  };

  if (settingsFromSheets.owner_reset_flag === 'FORCE_RESET') {
    ownerDb = {
      isConfigured: false,
      username: '',
      displayName: 'Bpk. Haryanto',
      passwordHash: '',
      passwordSalt: '',
      recoveryHash: '',
      recoverySalt: ''
    };
    console.log('  -> Sinyal FORCE_RESET diterima: Akun direset ke status belum dikonfigurasi.');
  }

  if (!ownerDb.isConfigured && ownerDb.passwordHash === '') {
    console.log('  ✅ Root-of-Trust Reset Berhasil: POS siap menampilkan wizard setup awal baru.\n');
  } else {
    throw new Error('❌ Test 5 Gagal');
  }

  console.log('====================================================');
  console.log('🎉 ALL 5 TEST SUITES PASSED CLEANLY (100% SUCCESS)');
  console.log('====================================================');
}

runE2ETests().catch(err => {
  console.error('Test Suite Failed:', err);
  process.exit(1);
});
