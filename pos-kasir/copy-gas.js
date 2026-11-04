import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const srcPath = path.resolve(__dirname, 'dist', 'index.html')
const spaFallbackPath = path.resolve(__dirname, 'dist', '404.html')
const destDir = path.resolve(__dirname, '..', 'google-apps-script')
const destPath = path.resolve(destDir, 'Index.html')

if (fs.existsSync(srcPath)) {
  // 1. Buat fallback SPA 404.html untuk static hosting (GitHub Pages)
  fs.copyFileSync(srcPath, spaFallbackPath)
  console.log(`[OK] Berhasil membuat SPA fallback: ${spaFallbackPath}`)

  // 2. Salin ke folder google-apps-script jika direktori ada (opsional untuk Apps Script)
  if (!fs.existsSync(destDir)) {
    fs.mkdirSync(destDir, { recursive: true })
  }
  fs.copyFileSync(srcPath, destPath)
  console.log(`[OK] Berhasil menyalin bundle ke: ${destPath}`)
} else {
  console.error(`[Error] File ${srcPath} tidak ditemukan. Pastikan sudah menjalankan vite build.`)
}

const codeSrc = path.resolve(__dirname, 'Code.js')
const codeDest = path.resolve(destDir, 'Code.gs')
if (fs.existsSync(codeSrc)) {
  fs.copyFileSync(codeSrc, codeDest)
  console.log(`[OK] Berhasil menyalin backend script ke: ${codeDest}`)
} else {
  console.error(`[Error] File ${codeSrc} tidak ditemukan.`)
}
