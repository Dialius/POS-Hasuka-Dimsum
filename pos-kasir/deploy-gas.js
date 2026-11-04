import { execSync } from 'child_process'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const rootDir = path.resolve(__dirname, '..')

// Deployment ID tetap agar link /exec tidak pernah berubah
const DEPLOYMENT_ID = process.env.GAS_DEPLOYMENT_ID || 'AKfycbx-SOiWNNCEkO-hGSEvNRZWFzNCyakL_Zp6kngT8QnRnxn6lAXBV9XZu4a4u_d7BTA'

// Buat komentar versi otomatis dengan tanggal & waktu WIB
const now = new Date()
const dateStr = now.toLocaleDateString('id-ID', {
  timeZone: 'Asia/Jakarta',
  day: '2-digit',
  month: '2-digit',
  year: 'numeric'
})
const timeStr = now.toLocaleTimeString('id-ID', {
  timeZone: 'Asia/Jakarta',
  hour: '2-digit',
  minute: '2-digit'
})

const customDesc = process.argv.slice(2).join(' ').trim()
const comment = customDesc
  ? `Update: ${customDesc} (${dateStr} ${timeStr} WIB)`
  : `Update otomatis POS Kasir & API (${dateStr} ${timeStr} WIB)`

console.log('🚀 [1/3] Menjalankan build frontend & sinkronisasi script...')
execSync('npm run build', { cwd: __dirname, stdio: 'inherit' })

console.log('\n📤 [2/3] Mengunggah file ke Google Apps Script via clasp...')
execSync('clasp push -f', { cwd: rootDir, stdio: 'inherit' })

console.log(`\n🏷️  [3/3] Memperbarui deployment (${DEPLOYMENT_ID})...`)
console.log(`📝 Komentar versi otomatis: "${comment}"`)
execSync(`clasp deploy -i "${DEPLOYMENT_ID}" -d "${comment}"`, { cwd: rootDir, stdio: 'inherit' })

console.log('\n🎉 [SELESAI] Google Apps Script berhasil diperbarui!')
console.log(`🔗 Link Web App (TIDAK BERUBAH): https://script.google.com/macros/s/${DEPLOYMENT_ID}/exec\n`)

