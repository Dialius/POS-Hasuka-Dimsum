import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const imgPath = path.resolve(__dirname, 'public', 'Hasuka-logo.png')
const outPath = path.resolve(__dirname, 'src', 'assets', 'logo.ts')

const buf = fs.readFileSync(imgPath)
const b64 = buf.toString('base64')
const dataUri = `data:image/png;base64,${b64}`

const content = `// Base64 embedded Hasuka Logo — auto-generated
export const HASUKA_LOGO = '${dataUri}';

export function getSafeLogo(url?: string): string {
  if (!url || typeof url !== 'string' || url.trim() === '') return HASUKA_LOGO;
  if (url.includes('drive.google.com')) return HASUKA_LOGO;
  return url;
}
`;

const outDir = path.dirname(outPath)
if (!fs.existsSync(outDir)) {
  fs.mkdirSync(outDir, { recursive: true })
}

fs.writeFileSync(outPath, content, 'utf-8')
console.log(`[OK] Logo converted, size: ${b64.length} chars`)
