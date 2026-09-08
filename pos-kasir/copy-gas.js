import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const srcPath = path.resolve(__dirname, 'dist', 'index.html')
const destDir = path.resolve(__dirname, '..', 'google-apps-script')
const destPath = path.resolve(destDir, 'Index.html')

if (fs.existsSync(srcPath)) {
  if (!fs.existsSync(destDir)) {
    fs.mkdirSync(destDir, { recursive: true })
  }
  fs.copyFileSync(srcPath, destPath)
  console.log(`[OK] Berhasil menyalin bundle ke: ${destPath}`)
} else {
  console.error(`[Error] File ${srcPath} tidak ditemukan. Pastikan sudah menjalankan vite build.`)
}
