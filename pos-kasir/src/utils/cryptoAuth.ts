/**
 * cryptoAuth.ts - Utilitas Kriptografi Standar untuk Autentikasi Owner POS Hasuka Dimsum
 * Menggunakan Web Crypto API murni (zero external heavy dependencies).
 * Standar: PBKDF2 dengan HMAC-SHA256, 100.000 iterasi, 16-byte random salt.
 */

// Karakter aman untuk kode pemulihan (menghindari karakter ambigu seperti 0, O, 1, I, L)
const RECOVERY_ALPHABET = '23456789ABCDEFGHJKMNPQRSTUVWXYZ'

/**
 * Konversi ArrayBuffer / Uint8Array ke Hex String
 */
export function bufToHex(buffer: ArrayBuffer | Uint8Array): string {
  const bytes = buffer instanceof Uint8Array ? buffer : new Uint8Array(buffer)
  return Array.from(bytes)
    .map(b => b.toString(16).padStart(2, '0'))
    .join('')
}

/**
 * Konversi Hex String ke Uint8Array
 */
export function hexToBuf(hex: string): Uint8Array {
  const cleanHex = hex.trim().replace(/^0x/i, '')
  if (cleanHex.length % 2 !== 0) {
    throw new Error('Panjang string hex tidak valid.')
  }
  const bytes = new Uint8Array(cleanHex.length / 2)
  for (let i = 0; i < cleanHex.length; i += 2) {
    bytes[i / 2] = parseInt(cleanHex.substring(i, i + 2), 16)
  }
  return bytes
}

/**
 * Membangkitkan Cryptographic Salt acak dengan panjang tertentu (default 16 bytes)
 */
export function generateSalt(byteLength = 16): string {
  const cryptoObj = typeof window !== 'undefined' ? window.crypto : (globalThis as any).crypto
  if (!cryptoObj || !cryptoObj.getRandomValues) {
    throw new Error('Web Crypto API tidak tersedia pada runtime ini.')
  }
  const saltBytes = new Uint8Array(byteLength)
  cryptoObj.getRandomValues(saltBytes)
  return bufToHex(saltBytes)
}

/**
 * Menghitung PBKDF2 hash dari secret (password atau recovery key) menggunakan HMAC-SHA256
 */
export async function hashSecret(secret: string, saltHex: string, iterations = 100000): Promise<string> {
  const cryptoObj = typeof window !== 'undefined' ? window.crypto : (globalThis as any).crypto
  if (!cryptoObj || !cryptoObj.subtle) {
    throw new Error('crypto.subtle tidak tersedia pada runtime ini.')
  }

  const enc = new TextEncoder()
  const keyMaterial = await cryptoObj.subtle.importKey(
    'raw',
    enc.encode(secret),
    { name: 'PBKDF2' },
    false,
    ['deriveBits']
  )

  const saltBytes = hexToBuf(saltHex)

  const derivedBits = await cryptoObj.subtle.deriveBits(
    {
      name: 'PBKDF2',
      salt: saltBytes,
      iterations,
      hash: 'SHA-256',
    },
    keyMaterial,
    256 // 256 bits = 32 bytes (64 hex characters)
  )

  return bufToHex(derivedBits)
}

/**
 * Verifikasi apakah secret cocok dengan salt dan hash yang tersimpan
 * Menggunakan komparasi konstan (timing-safe)
 */
export async function verifySecret(
  secret: string,
  saltHex: string,
  expectedHashHex: string,
  iterations = 100000
): Promise<boolean> {
  try {
    if (!secret || !saltHex || !expectedHashHex) return false
    const computedHash = await hashSecret(secret, saltHex, iterations)
    
    // Constant-time string comparison untuk mencegah timing attack
    if (computedHash.length !== expectedHashHex.length) return false
    let diff = 0
    for (let i = 0; i < computedHash.length; i++) {
      diff |= computedHash.charCodeAt(i) ^ expectedHashHex.charCodeAt(i)
    }
    return diff === 0
  } catch (err) {
    console.error('[cryptoAuth] Gagal verifikasi secret:', err)
    return false
  }
}

/**
 * Menghasilkan Kode Pemulihan Darurat 16 karakter unik
 * Format: HSK-XXXX-XXXX-XXXX (12 karakter random)
 */
export function generateRecoveryKey(): string {
  const cryptoObj = typeof window !== 'undefined' ? window.crypto : (globalThis as any).crypto
  const randomBytes = new Uint8Array(12)
  if (cryptoObj && cryptoObj.getRandomValues) {
    cryptoObj.getRandomValues(randomBytes)
  } else {
    for (let i = 0; i < 12; i++) randomBytes[i] = Math.floor(Math.random() * 256)
  }

  let code = ''
  for (let i = 0; i < 12; i++) {
    code += RECOVERY_ALPHABET[randomBytes[i] % RECOVERY_ALPHABET.length]
  }

  const p1 = code.slice(0, 4)
  const p2 = code.slice(4, 8)
  const p3 = code.slice(8, 12)
  return `HSK-${p1}-${p2}-${p3}`
}

/**
 * Membersihkan dan memformat input kode pemulihan agar toleran terhadap spasi dan huruf kecil
 */
export function normalizeRecoveryKey(input: string): string {
  let cleaned = input.toUpperCase().replace(/[^A-Z0-9]/g, '')
  if (cleaned.startsWith('HSK')) {
    cleaned = cleaned.substring(3)
  }
  // Ambil maksimal 12 karakter berikutnya
  cleaned = cleaned.slice(0, 12)
  
  if (cleaned.length === 0) return ''
  
  let formatted = 'HSK'
  for (let i = 0; i < cleaned.length; i += 4) {
    formatted += '-' + cleaned.substring(i, i + 4)
  }
  return formatted
}

/**
 * Evaluasi Kekuatan Kata Sandi
 */
export interface PasswordStrength {
  score: number // 0 (sangat lemah) s/d 4 (sangat kuat)
  label: string
  color: string
  percent: number
  feedback?: string
}

export function evaluatePasswordStrength(password: string): PasswordStrength {
  if (!password) {
    return { score: 0, label: 'Kosong', color: '#9CA3AF', percent: 0 }
  }

  let score = 0
  if (password.length >= 8) score += 1
  if (password.length >= 12) score += 1
  if (/[a-z]/.test(password) && /[A-Z]/.test(password)) score += 1
  if (/[0-9]/.test(password)) score += 1
  if (/[^A-Za-z0-9]/.test(password)) score += 1

  // Normalisasi ke 0-4
  const normalizedScore = Math.min(4, Math.max(1, score - (password.length < 8 ? 1 : 0)))

  switch (normalizedScore) {
    case 1:
      return {
        score: 1,
        label: 'Lemah',
        color: '#DC2626',
        percent: 25,
        feedback: 'Gunakan minimal 8 karakter dengan kombinasi angka & huruf.',
      }
    case 2:
      return {
        score: 2,
        label: 'Cukup',
        color: '#D97706',
        percent: 50,
        feedback: 'Tambahkan huruf besar/kecil atau simbol untuk keamanan lebih baik.',
      }
    case 3:
      return {
        score: 3,
        label: 'Kuat',
        color: '#2563EB',
        percent: 75,
        feedback: 'Kata sandi kuat dan aman.',
      }
    case 4:
    default:
      return {
        score: 4,
        label: 'Sangat Kuat',
        color: '#059669',
        percent: 100,
        feedback: 'Kombinasi sempurna karakter, angka, dan simbol.',
      }
  }
}

/**
 * Helper Brute-Force Rate Limiting (Penyimpanan status percobaan login gagal)
 */
interface LockoutState {
  attempts: number
  lockUntil: number | null
}

const STORAGE_LOCKOUT_KEY = 'hasuka_owner_lockout_state'

export function getLockoutStatus(): { isLocked: boolean; remainingSeconds: number; attempts: number } {
  try {
    const raw = localStorage.getItem(STORAGE_LOCKOUT_KEY)
    if (!raw) return { isLocked: false, remainingSeconds: 0, attempts: 0 }
    
    const state: LockoutState = JSON.parse(raw)
    const now = Date.now()

    if (state.lockUntil && state.lockUntil > now) {
      const remaining = Math.ceil((state.lockUntil - now) / 1000)
      return { isLocked: true, remainingSeconds: remaining, attempts: state.attempts }
    }

    // Jika masa lockout telah lewat, reset lockUntil tetapi pertahankan attempts jika belum reset eksplisit
    return { isLocked: false, remainingSeconds: 0, attempts: state.attempts }
  } catch {
    return { isLocked: false, remainingSeconds: 0, attempts: 0 }
  }
}

export function recordFailedAttempt(): { isLocked: boolean; remainingSeconds: number; attempts: number } {
  try {
    const now = Date.now()
    let attempts = 1
    const raw = localStorage.getItem(STORAGE_LOCKOUT_KEY)
    if (raw) {
      const parsed: LockoutState = JSON.parse(raw)
      attempts = (parsed.attempts || 0) + 1
    }

    let lockUntil: number | null = null
    let remainingSeconds = 0

    if (attempts >= 8) {
      // Lockout tingkat 2: 15 menit
      remainingSeconds = 15 * 60
      lockUntil = now + remainingSeconds * 1000
    } else if (attempts >= 5) {
      // Lockout tingkat 1: 60 detik
      remainingSeconds = 60
      lockUntil = now + remainingSeconds * 1000
    }

    const state: LockoutState = { attempts, lockUntil }
    localStorage.setItem(STORAGE_LOCKOUT_KEY, JSON.stringify(state))

    return {
      isLocked: lockUntil !== null,
      remainingSeconds,
      attempts,
    }
  } catch {
    return { isLocked: false, remainingSeconds: 0, attempts: 1 }
  }
}

export function clearFailedAttempts(): void {
  try {
    localStorage.removeItem(STORAGE_LOCKOUT_KEY)
  } catch {
    // Ignore error
  }
}
