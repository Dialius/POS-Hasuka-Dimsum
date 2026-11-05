// Test verification for cryptoAuth.ts in Node.js
const { webcrypto } = require('crypto');
globalThis.crypto = webcrypto;

// Impor atau reimplementasi esensial untuk testing di node cjs
async function test() {
  console.log('--- Testing Web Crypto PBKDF2 ---');
  const enc = new TextEncoder();
  const salt = webcrypto.getRandomValues(new Uint8Array(16));
  const saltHex = Array.from(salt).map(b => b.toString(16).padStart(2, '0')).join('');
  
  const keyMaterial = await webcrypto.subtle.importKey(
    'raw',
    enc.encode('RahasiaHasuka2026!'),
    { name: 'PBKDF2' },
    false,
    ['deriveBits']
  );

  const derivedBits = await webcrypto.subtle.deriveBits(
    {
      name: 'PBKDF2',
      salt,
      iterations: 100000,
      hash: 'SHA-256'
    },
    keyMaterial,
    256
  );

  const hashHex = Array.from(new Uint8Array(derivedBits)).map(b => b.toString(16).padStart(2, '0')).join('');
  console.log('Salt Hex (32 chars):', saltHex, 'Length:', saltHex.length);
  console.log('Hash Hex (64 chars):', hashHex, 'Length:', hashHex.length);

  // Verifikasi hash ulang dengan password yang sama
  const keyMaterialVerify = await webcrypto.subtle.importKey(
    'raw',
    enc.encode('RahasiaHasuka2026!'),
    { name: 'PBKDF2' },
    false,
    ['deriveBits']
  );
  const derivedBitsVerify = await webcrypto.subtle.deriveBits(
    {
      name: 'PBKDF2',
      salt,
      iterations: 100000,
      hash: 'SHA-256'
    },
    keyMaterialVerify,
    256
  );
  const hashHexVerify = Array.from(new Uint8Array(derivedBitsVerify)).map(b => b.toString(16).padStart(2, '0')).join('');
  console.log('Match with same password:', hashHex === hashHexVerify);

  // Verifikasi hash ulang dengan password salah
  const keyMaterialWrong = await webcrypto.subtle.importKey(
    'raw',
    enc.encode('PasswordSalah'),
    { name: 'PBKDF2' },
    false,
    ['deriveBits']
  );
  const derivedBitsWrong = await webcrypto.subtle.deriveBits(
    {
      name: 'PBKDF2',
      salt,
      iterations: 100000,
      hash: 'SHA-256'
    },
    keyMaterialWrong,
    256
  );
  const hashHexWrong = Array.from(new Uint8Array(derivedBitsWrong)).map(b => b.toString(16).padStart(2, '0')).join('');
  console.log('Mismatch with wrong password:', hashHex !== hashHexWrong);

  if (hashHex === hashHexVerify && hashHex !== hashHexWrong) {
    console.log('>>> PBKDF2 HMAC-SHA256 test PASSED successfully!');
  } else {
    throw new Error('Test failed!');
  }
}

test().catch(e => {
  console.error(e);
  process.exit(1);
});
