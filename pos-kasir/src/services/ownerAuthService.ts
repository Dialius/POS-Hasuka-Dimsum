/**
 * ownerAuthService.ts - Layanan Manajemen Autentikasi & Kredensial Owner POS Hasuka Dimsum
 * Mengintegrasikan kriptografi PBKDF2 (cryptoAuth.ts) dengan Google Apps Script backend dan Offline Cache.
 */

import {
  generateSalt,
  hashSecret,
  verifySecret,
  generateRecoveryKey,
  getLockoutStatus,
  recordFailedAttempt,
  clearFailedAttempts,
} from '../utils/cryptoAuth'
import { gasApi } from './gasApi'

export interface OwnerAuthConfig {
  isConfigured: boolean
  username: string
  displayName: string
  passwordHash: string
  passwordSalt: string
  recoveryHash: string
  recoverySalt: string
  updatedAt?: string
}

const STORAGE_AUTH_KEY = 'hasuka_owner_auth_v2'

/**
 * Membaca konfigurasi autentikasi owner dari cache lokal (localStorage)
 */
export function getStoredOwnerAuth(): OwnerAuthConfig {
  try {
    const raw = localStorage.getItem(STORAGE_AUTH_KEY)
    if (raw) {
      const parsed = JSON.parse(raw)
      return {
        isConfigured: Boolean(parsed.isConfigured),
        username: parsed.username || '',
        displayName: parsed.displayName || 'Bpk. Haryanto',
        passwordHash: parsed.passwordHash || '',
        passwordSalt: parsed.passwordSalt || '',
        recoveryHash: parsed.recoveryHash || '',
        recoverySalt: parsed.recoverySalt || '',
        updatedAt: parsed.updatedAt,
      }
    }
  } catch (err) {
    console.warn('[ownerAuthService] Gagal membaca auth lokal:', err)
  }

  return {
    isConfigured: false,
    username: '',
    displayName: 'Bpk. Haryanto',
    passwordHash: '',
    passwordSalt: '',
    recoveryHash: '',
    recoverySalt: '',
  }
}

/**
 * Menyimpan konfigurasi autentikasi ke cache lokal
 */
export function setStoredOwnerAuth(auth: OwnerAuthConfig): void {
  try {
    localStorage.setItem(STORAGE_AUTH_KEY, JSON.stringify(auth))
    // Hapus sisa kredensial plaintext lama jika masih ada
    localStorage.removeItem('hasuka_owner_username')
    localStorage.removeItem('hasuka_owner_password')
  } catch (err) {
    console.error('[ownerAuthService] Gagal menyimpan auth lokal:', err)
  }
}

/**
 * Sinkronisasi konfigurasi auth dari settings Google Sheets (dipanggil saat getInitialData / refreshData)
 */
export function syncOwnerAuthFromSettings(settings: Record<string, string>): OwnerAuthConfig {
  // Cek apakah ada instruksi reset darurat dari Google Sheet
  if (settings['owner_reset_flag'] === 'FORCE_RESET') {
    const resetConfig: OwnerAuthConfig = {
      isConfigured: false,
      username: '',
      displayName: settings['owner_display_name'] || 'Bpk. Haryanto',
      passwordHash: '',
      passwordSalt: '',
      recoveryHash: '',
      recoverySalt: '',
      updatedAt: new Date().toISOString(),
    }
    setStoredOwnerAuth(resetConfig)
    return resetConfig
  }

  // Jika owner_is_configured bernilai true di Google Sheets
  if (settings['owner_is_configured'] === 'true' && settings['owner_password_hash']) {
    const synchedConfig: OwnerAuthConfig = {
      isConfigured: true,
      username: (settings['owner_username'] || '').toLowerCase().trim(),
      displayName: settings['owner_display_name'] || 'Bpk. Haryanto',
      passwordHash: settings['owner_password_hash'],
      passwordSalt: settings['owner_password_salt'] || '',
      recoveryHash: settings['owner_recovery_hash'] || '',
      recoverySalt: settings['owner_recovery_salt'] || '',
      updatedAt: settings['owner_updated_at'] || new Date().toISOString(),
    }
    setStoredOwnerAuth(synchedConfig)
    return synchedConfig
  }

  // Jika di server belum ada atau bernilai false, gunakan status lokal
  return getStoredOwnerAuth()
}

/**
 * Inisialisasi Setup Awal Akun Pemilik (First-Run Onboarding)
 */
export async function setupOwnerAccount(params: {
  username: string
  displayName: string
  password: string
  recoveryKey: string
}): Promise<{ success: boolean; error?: string }> {
  try {
    const cleanUsername = params.username.toLowerCase().trim()
    if (!cleanUsername || cleanUsername.length < 4) {
      return { success: false, error: 'Username minimal 4 karakter.' }
    }
    if (!params.password || params.password.length < 8) {
      return { success: false, error: 'Kata sandi minimal 8 karakter.' }
    }
    if (!params.recoveryKey) {
      return { success: false, error: 'Kode pemulihan darurat tidak valid.' }
    }

    // 1. Generate salt dan hash untuk kata sandi
    const passwordSalt = generateSalt(16)
    const passwordHash = await hashSecret(params.password, passwordSalt)

    // 2. Generate salt dan hash untuk kode pemulihan
    const cleanRecoveryKey = params.recoveryKey.trim().toUpperCase()
    const recoverySalt = generateSalt(16)
    const recoveryHash = await hashSecret(cleanRecoveryKey, recoverySalt)

    const now = new Date().toISOString()

    const authConfig: OwnerAuthConfig = {
      isConfigured: true,
      username: cleanUsername,
      displayName: params.displayName.trim() || 'Bpk. Haryanto',
      passwordHash,
      passwordSalt,
      recoveryHash,
      recoverySalt,
      updatedAt: now,
    }

    // 3. Simpan ke local cache segera agar offline tetap bekerja
    setStoredOwnerAuth(authConfig)
    clearFailedAttempts()

    // 4. Kirim ke Google Apps Script backend untuk disimpan di master Google Sheet
    if (gasApi.isConfigured()) {
      try {
        await gasApi.saveSettings({
          owner_is_configured: 'true',
          owner_username: cleanUsername,
          owner_display_name: authConfig.displayName,
          owner_password_hash: passwordHash,
          owner_password_salt: passwordSalt,
          owner_recovery_hash: recoveryHash,
          owner_recovery_salt: recoverySalt,
          owner_reset_flag: 'NONE',
          owner_updated_at: now,
        })
      } catch (err) {
        console.warn('[ownerAuthService] Gagal sinkron setup ke server, antrean outbox aktif:', err)
      }
    }

    return { success: true }
  } catch (err: any) {
    console.error('[ownerAuthService] Error saat setup owner:', err)
    return { success: false, error: err.message || 'Gagal menyimpan konfigurasi akun.' }
  }
}

/**
 * Verifikasi Login Owner dengan Proteksi Brute-Force
 */
export async function verifyOwnerLogin(
  usernameInput: string,
  passwordInput: string
): Promise<{ success: boolean; error?: string; remainingSeconds?: number }> {
  // 1. Cek proteksi lockout
  const lockout = getLockoutStatus()
  if (lockout.isLocked) {
    return {
      success: false,
      error: `Terlalu banyak percobaan gagal. Silakan tunggu ${lockout.remainingSeconds} detik lagi.`,
      remainingSeconds: lockout.remainingSeconds,
    }
  }

  const auth = getStoredOwnerAuth()

  // 2. Jika sistem belum dikonfigurasi sama sekali
  if (!auth.isConfigured || !auth.passwordHash) {
    return {
      success: false,
      error: 'Akun Pemilik belum dikonfigurasi. Silakan lakukan Setup Awal terlebih dahulu.',
    }
  }

  // 3. Verifikasi username (case-insensitive)
  const cleanInputUser = usernameInput.toLowerCase().trim()
  if (cleanInputUser !== auth.username) {
    const lockResult = recordFailedAttempt()
    return {
      success: false,
      error: 'Username atau kata sandi salah. Silakan periksa kembali.',
      remainingSeconds: lockResult.isLocked ? lockResult.remainingSeconds : undefined,
    }
  }

  // 4. Verifikasi kata sandi dengan PBKDF2 hash
  const isValid = await verifySecret(passwordInput, auth.passwordSalt, auth.passwordHash)

  if (isValid) {
    clearFailedAttempts()
    return { success: true }
  } else {
    const lockResult = recordFailedAttempt()
    const errMsg = lockResult.isLocked
      ? `Terlalu banyak percobaan gagal. Akses dikunci selama ${lockResult.remainingSeconds} detik.`
      : 'Username atau kata sandi salah. Silakan periksa kembali.'
    return {
      success: false,
      error: errMsg,
      remainingSeconds: lockResult.isLocked ? lockResult.remainingSeconds : undefined,
    }
  }
}

/**
 * Pemulihan Kata Sandi Menggunakan Emergency Recovery Key (Tingkat 1)
 * Menghanguskan kode pemulihan lama dan mengembalikan kode pemulihan BARU (One-Time Rotation)
 */
export async function recoverOwnerPassword(params: {
  username: string
  recoveryKey: string
  newPassword: string
}): Promise<{ success: boolean; newRecoveryKey?: string; error?: string }> {
  try {
    const auth = getStoredOwnerAuth()
    if (!auth.isConfigured || !auth.recoveryHash) {
      return { success: false, error: 'Sistem belum memiliki konfigurasi kode pemulihan.' }
    }

    const cleanInputUser = params.username.toLowerCase().trim()
    if (cleanInputUser !== auth.username) {
      return { success: false, error: 'Username tidak ditemukan.' }
    }

    const cleanKey = params.recoveryKey.trim().toUpperCase()
    const isRecoveryValid = await verifySecret(cleanKey, auth.recoverySalt, auth.recoveryHash)

    if (!isRecoveryValid) {
      return { success: false, error: 'Kode pemulihan darurat tidak cocok atau sudah tidak berlaku.' }
    }

    if (!params.newPassword || params.newPassword.length < 8) {
      return { success: false, error: 'Kata sandi baru minimal 8 karakter.' }
    }

    // Rotasi: Terbitkan Kode Pemulihan BARU
    const newRecoveryKey = generateRecoveryKey()
    const newRecoverySalt = generateSalt(16)
    const newRecoveryHash = await hashSecret(newRecoveryKey, newRecoverySalt)

    // Hash kata sandi baru
    const newPasswordSalt = generateSalt(16)
    const newPasswordHash = await hashSecret(params.newPassword, newPasswordSalt)

    const now = new Date().toISOString()

    const updatedAuth: OwnerAuthConfig = {
      ...auth,
      passwordHash: newPasswordHash,
      passwordSalt: newPasswordSalt,
      recoveryHash: newRecoveryHash,
      recoverySalt: newRecoverySalt,
      updatedAt: now,
    }

    setStoredOwnerAuth(updatedAuth)
    clearFailedAttempts()

    // Sinkron ke backend
    if (gasApi.isConfigured()) {
      try {
        await gasApi.saveSettings({
          owner_password_hash: newPasswordHash,
          owner_password_salt: newPasswordSalt,
          owner_recovery_hash: newRecoveryHash,
          owner_recovery_salt: newRecoverySalt,
          owner_reset_flag: 'NONE',
          owner_updated_at: now,
        })
      } catch (err) {
        console.warn('[ownerAuthService] Gagal sinkron reset ke server, outbox aktif:', err)
      }
    }

    return { success: true, newRecoveryKey }
  } catch (err: any) {
    console.error('[ownerAuthService] Gagal reset kata sandi:', err)
    return { success: false, error: err.message || 'Terjadi kesalahan sistem.' }
  }
}

/**
 * Mengubah Kata Sandi & Username dari Pengaturan (Owner sedang login)
 */
export async function updateOwnerCredentials(params: {
  currentPassword: string
  newPassword?: string
  newUsername?: string
  newDisplayName?: string
}): Promise<{ success: boolean; error?: string }> {
  try {
    const auth = getStoredOwnerAuth()
    if (!auth.isConfigured) {
      return { success: false, error: 'Akun owner belum dikonfigurasi.' }
    }

    // Verifikasi kata sandi saat ini
    const isCurrentValid = await verifySecret(params.currentPassword, auth.passwordSalt, auth.passwordHash)
    if (!isCurrentValid) {
      return { success: false, error: 'Kata sandi saat ini salah.' }
    }

    let passwordHash = auth.passwordHash
    let passwordSalt = auth.passwordSalt

    if (params.newPassword) {
      if (params.newPassword.length < 8) {
        return { success: false, error: 'Kata sandi baru minimal 8 karakter.' }
      }
      passwordSalt = generateSalt(16)
      passwordHash = await hashSecret(params.newPassword, passwordSalt)
    }

    const username = params.newUsername ? params.newUsername.toLowerCase().trim() : auth.username
    const displayName = params.newDisplayName ? params.newDisplayName.trim() : auth.displayName
    const now = new Date().toISOString()

    const updatedAuth: OwnerAuthConfig = {
      ...auth,
      username,
      displayName,
      passwordHash,
      passwordSalt,
      updatedAt: now,
    }

    setStoredOwnerAuth(updatedAuth)

    if (gasApi.isConfigured()) {
      await gasApi.saveSettings({
        owner_username: username,
        owner_display_name: displayName,
        owner_password_hash: passwordHash,
        owner_password_salt: passwordSalt,
        owner_updated_at: now,
      })
    }

    return { success: true }
  } catch (err: any) {
    return { success: false, error: err.message || 'Gagal memperbarui kredensial.' }
  }
}

/**
 * Menerbitkan Kunci Pemulihan Darurat Baru Kapan Saja dari Pengaturan
 */
export async function regenerateOwnerRecoveryKey(
  currentPassword: string
): Promise<{ success: boolean; newRecoveryKey?: string; error?: string }> {
  try {
    const auth = getStoredOwnerAuth()
    if (!auth.isConfigured) {
      return { success: false, error: 'Akun owner belum dikonfigurasi.' }
    }

    // Verifikasi kata sandi saat ini untuk keamanan
    const isCurrentValid = await verifySecret(currentPassword, auth.passwordSalt, auth.passwordHash)
    if (!isCurrentValid) {
      return { success: false, error: 'Kata sandi saat ini salah.' }
    }

    const newRecoveryKey = generateRecoveryKey()
    const newRecoverySalt = generateSalt(16)
    const newRecoveryHash = await hashSecret(newRecoveryKey, newRecoverySalt)
    const now = new Date().toISOString()

    const updatedAuth: OwnerAuthConfig = {
      ...auth,
      recoveryHash: newRecoveryHash,
      recoverySalt: newRecoverySalt,
      updatedAt: now,
    }

    setStoredOwnerAuth(updatedAuth)

    if (gasApi.isConfigured()) {
      await gasApi.saveSettings({
        owner_recovery_hash: newRecoveryHash,
        owner_recovery_salt: newRecoverySalt,
        owner_updated_at: now,
      })
    }

    return { success: true, newRecoveryKey }
  } catch (err: any) {
    return { success: false, error: err.message || 'Gagal menerbitkan kunci pemulihan baru.' }
  }
}

/**
 * Menghapus Kredensial Owner & Mereset Status Akun ke Bersih (Unconfigured)
 * Membutuhkan kata sandi saat ini untuk konfirmasi keamanan
 */
export async function deleteOwnerAccount(
  currentPassword: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const auth = getStoredOwnerAuth()
    if (!auth.isConfigured) {
      return { success: false, error: 'Akun owner belum dikonfigurasi.' }
    }

    // Verifikasi kata sandi saat ini untuk keamanan
    const isCurrentValid = await verifySecret(currentPassword, auth.passwordSalt, auth.passwordHash)
    if (!isCurrentValid) {
      return { success: false, error: 'Kata sandi saat ini salah.' }
    }

    const resetConfig: OwnerAuthConfig = {
      isConfigured: false,
      username: '',
      displayName: 'Bpk. Haryanto',
      passwordHash: '',
      passwordSalt: '',
      recoveryHash: '',
      recoverySalt: '',
      updatedAt: new Date().toISOString(),
    }

    setStoredOwnerAuth(resetConfig)
    clearFailedAttempts()

    if (gasApi.isConfigured()) {
      await gasApi.saveSettings({
        owner_is_configured: 'false',
        owner_username: '',
        owner_password_hash: '',
        owner_password_salt: '',
        owner_recovery_hash: '',
        owner_recovery_salt: '',
        owner_reset_flag: 'FORCE_RESET',
        owner_updated_at: new Date().toISOString(),
      })
    }

    return { success: true }
  } catch (err: any) {
    return { success: false, error: err.message || 'Gagal mereset akun.' }
  }
}
