import { Product, Ingredient, Recipe } from '../context/AppContext'
import { Outlet, Cashier } from '../context/AppContext'

// Feature flag: set to true to enable local outbox queueing (supports both SQLite on Tauri & localStorage on Web)
export const ENABLE_OFFLINE_QUEUE = true

export const isOfflineQueueActive = (): boolean => {
  return ENABLE_OFFLINE_QUEUE && typeof window !== 'undefined'
}

async function safeQueueOutbox(action: string, payload: any) {
  if (isOfflineQueueActive()) {
    try {
      const { queueOutbox } = await import('./db')
      return await queueOutbox(action, payload)
    } catch (err) {
      console.error('Gagal memasukkan ke antrean offline:', err)
      return null
    }
  }
  return null
}

const STORAGE_KEY = 'hasuka_gas_api_url'

// Timeout eksplisit agar UI tidak menggantung tanpa batas (Apps Script bisa lambat)
const FETCH_TIMEOUT_MS = 15000

function fetchWithTimeout(url: string, options: RequestInit = {}, timeoutMs = FETCH_TIMEOUT_MS): Promise<Response> {
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), timeoutMs)
  return fetch(url, { ...options, signal: controller.signal })
    .finally(() => clearTimeout(timer))
}


function fixDates(obj: any): any {
  if (obj === null || obj === undefined) return obj;
  if (obj instanceof Date) return obj;
  if (typeof obj === 'string') {
    if (/^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}(?:\.\d{3}Z)?$/.test(obj)) {
      return obj.replace(' ', 'T') + '+07:00'
    }
    return obj;
  }
  if (Array.isArray(obj)) return obj.map(fixDates)
  if (typeof obj === 'object') {
    const res: any = {}
    for (const key in obj) {
      if (Object.prototype.hasOwnProperty.call(obj, key)) {
        res[key] = fixDates(obj[key])
      }
    }
    return res
  }
  return obj
}

export interface InitialDataResponse {
  products: Product[]
  ingredients: Ingredient[]
  recipes: Recipe[]
  categories?: { id: number; name: string }[]
  promos?: any[]
  settings?: Record<string, string>
  outlets?: Outlet[]
  cashiers?: Cashier[]
  activeShift?: {
    id: string
    cashierName: string
    startTime: string
    nominal: number
    outlet?: string
  } | null
}

export interface TransactionPayload {
  invoice_no?: string
  cashier: string
  branch_id: string
  shift_id?: string | number
  subtotal: number
  promo_discount: number
  manual_discount: number
  tax: number
  service_charge?: number
  total: number
  payment_method: string
  cash_received?: number
  change_amount?: number
  table_name?: string
  promo_name?: string
  timestamp?: string
  items: {
    product_id: number
    product_name: string
    qty: number
    unit_price: number
    subtotal: number
    is_bundle?: boolean
    bundle_id?: any
    bundle_items?: any
    notes?: string
  }[]
}

export interface AiInsightResponse {
  insight: {
    headline: string
    highlights: { type: 'naik' | 'turun' | 'info' | 'peringatan'; text: string }[]
    bestSeller: { name: string; note: string } | null
    recommendations: string[]
    caveat: string
    degraded?: boolean
  }
  meta: {
    provider: string
    model: string
    cached: boolean
    generatedAt: string
    remainingToday: number
    isStale?: boolean
  }
}

export interface AiAnalyzePayload {
  scope: string
  snapshot: any
  ownerKey?: string
  force?: boolean
  question?: string
}

const AI_CACHE_STORAGE_KEY = 'hasuka_ai_cache_v1'
const AI_CACHE_TTL_MS = 15 * 60 * 1000 // 15 menit
const AI_CACHE_MAX_ENTRIES = 5

interface AiCacheItem {
  key: string
  data: AiInsightResponse
  timestamp: number
}

const memoryAiCache: Record<string, { data: AiInsightResponse; timestamp: number }> = {}

function fastHash(str: string): string {
  let hash = 0
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i)
    hash = (hash << 5) - hash + char
    hash |= 0
  }
  return (hash >>> 0).toString(36)
}

function getLocalAiCache(key: string): AiInsightResponse | null {
  const now = Date.now()
  if (memoryAiCache[key] && now - memoryAiCache[key].timestamp < AI_CACHE_TTL_MS) {
    return { ...memoryAiCache[key].data, meta: { ...memoryAiCache[key].data.meta, cached: true } }
  }
  try {
    const raw = localStorage.getItem(AI_CACHE_STORAGE_KEY)
    if (!raw) return null
    const list: AiCacheItem[] = JSON.parse(raw)
    const match = list.find(item => item.key === key)
    if (match && now - match.timestamp < AI_CACHE_TTL_MS) {
      memoryAiCache[key] = { data: match.data, timestamp: match.timestamp }
      return { ...match.data, meta: { ...match.data.meta, cached: true } }
    }
  } catch { /* ignore */ }
  return null
}

function getAnyStaleAiCache(preferredKey?: string): AiInsightResponse | null {
  try {
    if (preferredKey && memoryAiCache[preferredKey]) {
      return memoryAiCache[preferredKey].data
    }
    const memEntries = Object.values(memoryAiCache)
    if (memEntries.length > 0) {
      return memEntries[memEntries.length - 1].data
    }
    const raw = localStorage.getItem(AI_CACHE_STORAGE_KEY)
    if (!raw) return null
    const list: AiCacheItem[] = JSON.parse(raw)
    if (list.length === 0) return null
    const match = preferredKey ? list.find(item => item.key === preferredKey) : null
    if (match) return match.data
    list.sort((a, b) => b.timestamp - a.timestamp)
    return list[0].data
  } catch {
    return null
  }
}

function setLocalAiCache(key: string, data: AiInsightResponse) {
  const now = Date.now()
  memoryAiCache[key] = { data, timestamp: now }
  try {
    const raw = localStorage.getItem(AI_CACHE_STORAGE_KEY)
    let list: AiCacheItem[] = raw ? JSON.parse(raw) : []
    list = list.filter(item => item.key !== key)
    list.unshift({ key, data, timestamp: now })
    if (list.length > AI_CACHE_MAX_ENTRIES) {
      list = list.slice(0, AI_CACHE_MAX_ENTRIES)
    }
    localStorage.setItem(AI_CACHE_STORAGE_KEY, JSON.stringify(list))
  } catch { /* ignore */ }
}

export function mapAiErrorMessage(rawMsg: string, isOffline?: boolean): { code: string; message: string; isAuthError?: boolean } {
  if (isOffline || rawMsg.includes('Failed to fetch') || rawMsg.includes('NetworkError') || rawMsg.includes('Load failed')) {
    return {
      code: 'AI_OFFLINE',
      message: 'Perangkat sedang offline atau gagal terhubung ke server.'
    }
  }
  if (rawMsg.includes('The user aborted a request') || rawMsg.includes('aborted') || rawMsg.includes('timeout')) {
    return {
      code: 'AI_TIMEOUT',
      message: 'Waktu permintaan AI habis (timeout). Silakan coba lagi.'
    }
  }
  if (rawMsg.includes('[AI_MODEL_INVALID]')) {
    return {
      code: 'AI_MODEL_INVALID',
      message: 'Model AI sudah tidak tersedia. Ganti AI_MODEL di Script Properties dengan ID model dari hasil aiListModels.'
    }
  }
  if (rawMsg.includes('[AI_NOT_CONFIGURED]')) {
    return {
      code: 'AI_NOT_CONFIGURED',
      message: 'AI belum disiapkan di server. Isi AI_API_KEY di Script Properties.'
    }
  }
  if (rawMsg.includes('[AI_FORBIDDEN]')) {
    return {
      code: 'AI_FORBIDDEN',
      message: 'Kode akses AI salah.',
      isAuthError: true
    }
  }
  if (rawMsg.includes('[AI_QUOTA]')) {
    return {
      code: 'AI_QUOTA',
      message: 'Kuota AI gratis sedang habis, coba lagi nanti.'
    }
  }
  if (rawMsg.includes('[AI_RATE_LIMIT]')) {
    return {
      code: 'AI_RATE_LIMIT',
      message: 'Batas analisis hari ini tercapai.'
    }
  }
  return {
    code: 'AI_ERROR',
    message: rawMsg.replace(/\[[A-Z_]+\]\s*/, '') || 'Gagal memproses analisis AI.'
  }
}

export const gasApi = {
  cleanUrl(url: string): string {
    let cleaned = (url || '').trim()
    cleaned = cleaned.replace(/\?.*$/, '').replace(/\/+$/, '')
    if (cleaned.endsWith('/edit')) {
      cleaned = cleaned.replace(/\/edit$/, '/exec')
    }
    if (cleaned.includes('/macros/s/') && !cleaned.endsWith('/exec') && !cleaned.endsWith('/dev')) {
      cleaned = cleaned + '/exec'
    }
    return cleaned
  },

  getUrl(): string {
    // 1. Ambil dari localStorage yang disimpan manual di Pengaturan
    try {
      const stored = localStorage.getItem(STORAGE_KEY)
      if (stored && stored.trim()) return this.cleanUrl(stored)
    } catch { /* ignore */ }

    // 2. Ambil dari window.__GAS_URL__ yang disuntikkan langsung oleh server Apps Script
    if (typeof window !== 'undefined' && (window as any).__GAS_URL__) {
      const injected = (window as any).__GAS_URL__
      if (typeof injected === 'string' && injected.trim()) {
        const cleaned = this.cleanUrl(injected)
        try { localStorage.setItem(STORAGE_KEY, cleaned) } catch { /* ignore */ }
        return cleaned
      }
    }

    // 3. Ambil dari environment variable build-time jika ada (VITE_GAS_URL)
    const envUrl = (import.meta as any).env?.VITE_GAS_URL
    if (envUrl && typeof envUrl === 'string' && envUrl.trim()) {
      const cleaned = this.cleanUrl(envUrl)
      try { localStorage.setItem(STORAGE_KEY, cleaned) } catch { /* ignore */ }
      return cleaned
    }

    // 4. Fallback URL deployment tetap Hasuka Dimsum (tersimpan otomatis untuk perangkat baru)
    const defaultUrl = 'https://script.google.com/macros/s/AKfycbx-SOiWNNCEkO-hGSEvNRZWFzNCyakL_Zp6kngT8QnRnxn6lAXBV9XZu4a4u_d7BTA/exec'
    if (typeof window !== 'undefined') {
      try { localStorage.setItem(STORAGE_KEY, defaultUrl) } catch { /* ignore */ }
    }
    return defaultUrl
  },

  setUrl(url: string) {
    try {
      localStorage.setItem(STORAGE_KEY, this.cleanUrl(url))
    } catch { /* ignore */ }
  },

  isConfigured(): boolean {
    const url = this.getUrl()
    const token = this.getApiToken()
    return Boolean(url && url.startsWith('https://script.google.com/macros/s/') && token.length > 0)
  },

  getApiToken(): string {
    // 1. Ambil dari localStorage yang disimpan di Pengaturan
    try {
      const stored = localStorage.getItem('hasuka_api_secret_key')
      if (stored && stored.trim()) return stored.trim()
    } catch { /* ignore */ }

    // 2. Ambil dari window.__GAS_TOKEN__ yang disuntikkan langsung oleh server Apps Script
    if (typeof window !== 'undefined' && (window as any).__GAS_TOKEN__) {
      const injected = (window as any).__GAS_TOKEN__
      if (typeof injected === 'string' && injected.trim()) {
        const token = injected.trim()
        try { localStorage.setItem('hasuka_api_secret_key', token) } catch { /* ignore */ }
        return token
      }
    }

    // 3. Ambil dari environment variable build-time jika ada
    const envToken = (import.meta as any).env?.VITE_GAS_TOKEN || (import.meta as any).env?.VITE_API_SECRET_KEY
    if (envToken && typeof envToken === 'string' && envToken.trim()) {
      const token = envToken.trim()
      try { localStorage.setItem('hasuka_api_secret_key', token) } catch { /* ignore */ }
      return token
    }

    // 4. Fallback default token Hasuka POS agar perangkat baru langsung sinkron
    const defaultToken = 'HASUKA_POS_SECRET_2026'
    try { localStorage.setItem('hasuka_api_secret_key', defaultToken) } catch { /* ignore */ }
    return defaultToken
  },

  setApiToken(token: string) {
    try {
      localStorage.setItem('hasuka_api_secret_key', (token || '').trim())
    } catch { /* ignore */ }
  },

  async ping(customUrl?: string, customToken?: string): Promise<{ success: boolean; message: string }> {
    const rawUrl = customUrl || this.getUrl()
    if (!rawUrl) {
      return { success: false, message: 'URL Google Apps Script belum diisi.' }
    }

    const token = customToken !== undefined ? customToken.trim() : this.getApiToken()
    if (!token) {
      return { success: false, message: 'Kunci Keamanan API (Token) belum diisi.' }
    }

    const targetUrl = this.cleanUrl(rawUrl)
    if (!targetUrl.startsWith('https://script.google.com/macros/s/')) {
      return {
        success: false,
        message: 'Format URL tidak valid. URL harus diawali dengan https://script.google.com/macros/s/...'
      }
    }

    try {
      const res = await fetchWithTimeout(`${targetUrl}?action=ping&token=${encodeURIComponent(token)}`, {
        method: 'GET',
        headers: { 'Accept': 'application/json' }
      })
      if (!res.ok) {
        throw new Error(`HTTP ${res.status}: ${res.statusText}`)
      }
      const data = await res.json()
      if (data.status === 'success') {
        return { success: true, message: data.message || 'Koneksi Berhasil! Google Apps Script siap digunakan.' }
      }
      return { success: false, message: data.message || 'Respon tidak valid dari server.' }
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Gagal menghubungi server'
      if (msg.includes('Failed to fetch') || msg.includes('NetworkError') || msg.includes('Load failed')) {
        return {
          success: false,
          message: 'Gagal terhubung (Failed to fetch). Pastikan saat Deploy di Apps Script: "Who has access" disetel ke "Anyone" (Siapa saja), bukan "Hanya saya", dan gunakan URL deployment yang masih aktif.'
        }
      }
      return {
        success: false,
        message: msg
      }
    }
  },

  async saveSettings(settings: Record<string, string>): Promise<any> {
    try {
      return await this.executeMutation('saveSettings', { settings })
    } catch (e) {
      return { status: 'error', message: e instanceof Error ? e.message : String(e) }
    }
  },

  async getInitialData(branchId?: string): Promise<InitialDataResponse | null> {
    const url = this.getUrl()
    const token = this.getApiToken()
    if (!url || !token) {
      console.warn('[gasApi] URL atau API Token belum dikonfigurasi.')
      return null
    }

    try {
      // 1. Coba gunakan google.script.run HANYA jika benar-benar tersedia (Web App Apps Script lama)
      // @ts-ignore
      if (typeof window !== 'undefined' && window.google?.script?.run) {
        try {
          return await new Promise((resolve, reject) => {
            // @ts-ignore
            window.google.script.run
              .withSuccessHandler((res: any) => {
                if (res && res.status === 'success') {
                  const data = res.data as InitialDataResponse;
                  if (data?.products) {
                    data.products = data.products.map(p => {
                      if (p.img && p.img.includes('uc?export=view&id=')) {
                        const id = p.img.split('id=')[1]?.split('&')[0];
                        if (id) p.img = `https://drive.google.com/thumbnail?id=${id}&sz=w1000`;
                      }
                      return p;
                    });
                  }
                  if (data?.settings && data.settings['logo_url']) {
                    let u = data.settings['logo_url'];
                    if (u.includes('uc?export=view&id=')) {
                      const id = u.split('id=')[1]?.split('&')[0];
                      if (id) data.settings['logo_url'] = `https://drive.google.com/thumbnail?id=${id}&sz=w1000`;
                    } else if (u.includes('file/d/')) {
                      const id = u.split('file/d/')[1]?.split('/')[0];
                      if (id) data.settings['logo_url'] = `https://drive.google.com/thumbnail?id=${id}&sz=w1000`;
                    }
                  }
                  resolve(data);
                } else {
                  reject(new Error(res?.message || 'Gagal memuat data awal via RPC'));
                }
              })
              .withFailureHandler((err: any) => reject(err))
              .rpcGetInitialData(branchId);
          });
        } catch (rpcErr) {
          console.warn('RPC gagal, mencoba fallback fetch...', rpcErr);
        }
      }

      // 2. Jalur Standar Fetch (Static Hosting): Simple GET request tanpa custom headers
      const tokenParam = `&token=${encodeURIComponent(token)}`;
      const fetchUrl = branchId
        ? `${url}?action=getInitialData&branchId=${encodeURIComponent(branchId)}${tokenParam}`
        : `${url}?action=getInitialData${tokenParam}`;
      const res = await fetchWithTimeout(fetchUrl, {
        method: 'GET',
        headers: { 'Accept': 'application/json' }
      })
      if (!res.ok) throw new Error(`Gagal mengambil data dari Google Sheets (HTTP ${res.status})`)
      const json = await res.json()
      if (json.status === 'success') {
        const data = json.data as InitialDataResponse;
        if (data?.products) {
          data.products = data.products.map(p => {
            if (p.img && p.img.includes('uc?export=view&id=')) {
              const id = p.img.split('id=')[1]?.split('&')[0];
              if (id) p.img = `https://drive.google.com/thumbnail?id=${id}&sz=w1000`;
            }
            return p;
          });
        }
        if (data?.settings && data.settings['logo_url']) {
          let u = data.settings['logo_url'];
          if (u.includes('uc?export=view&id=')) {
            const id = u.split('id=')[1]?.split('&')[0];
            if (id) data.settings['logo_url'] = `https://drive.google.com/thumbnail?id=${id}&sz=w1000`;
          } else if (u.includes('file/d/')) {
            const id = u.split('file/d/')[1]?.split('/')[0];
            if (id) data.settings['logo_url'] = `https://drive.google.com/thumbnail?id=${id}&sz=w1000`;
          }
        }
        return data;
      }
      throw new Error(json.message || 'Respon data kosong')
    } catch (err) {
      const errMsg = err instanceof Error ? err.message : String(err)
      const isTimeout = err instanceof Error && (err.name === 'AbortError' || errMsg.toLowerCase().includes('abort'))
      const friendlyMsg = isTimeout
        ? 'Waktu koneksi ke Google Sheets habis (Timeout). Database cloud tidak merespon.'
        : `Tidak dapat terhubung ke database Google Sheets: ${errMsg}`

      console.warn('[gasApi] Gagal memuat data awal:', friendlyMsg)
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('gas-sync-error', { detail: { message: friendlyMsg } }))
      }
      return null
    }
  },

  async postAction(action: string, data: any, retries = 3, timeoutMs = FETCH_TIMEOUT_MS): Promise<any> {
    const url = this.getUrl()
    const token = this.getApiToken()
    if (!url) {
      throw new Error('URL Google Apps Script belum dikonfigurasi.')
    }
    if (!token) {
      throw new Error('Kunci Keamanan API (Token) belum dikonfigurasi.')
    }

    let attempt = 0;
    while (attempt < retries) {
      try {
        // Cek google.script.run HANYA jika benar-benar ada di window
        // @ts-ignore
        if (typeof window !== 'undefined' && window.google?.script?.run) {
          try {
            return await new Promise((resolve, reject) => {
              // @ts-ignore
              window.google.script.run
                .withSuccessHandler((res: any) => {
                  if (res && res.status === 'error') {
                    reject(new Error(res.message || 'Gagal memproses aksi pada server'));
                  } else {
                    resolve(fixDates(res));
                  }
                })
                .withFailureHandler((err: any) => {
                  const msg = err && err.message ? err.message : String(err);
                  reject(new Error(msg));
                })
                .rpcPostAction(action, data);
            });
          } catch (rpcErr: any) {
            throw rpcErr;
          }
        }

        // Standar Fetch (Static Hosting HTTPS): Simple POST request tanpa custom headers
        // Content-Type: text/plain;charset=utf-8 mencegah CORS preflight OPTIONS yang ditolak Apps Script
        const res = await fetchWithTimeout(url, {
          method: 'POST',
          headers: {
            'Content-Type': 'text/plain;charset=utf-8'
          },
          body: JSON.stringify({ action, data, token })
        }, timeoutMs)

        if (!res.ok) {
          throw new Error(`Gagal mengirim data: HTTP ${res.status}`)
        }

        const json = await res.json()
        if (json.status === 'error') {
          throw new Error(json.message || 'Terjadi kesalahan pada server');
        }
        return fixDates(json);
      } catch (err: any) {
        attempt++;
        const errMsg = String(err);
        if (attempt >= retries) {
          throw err;
        }
        if (errMsg.includes('sibuk') || errMsg.includes('busy') || errMsg.includes('fetch') || errMsg.includes('Network') || errMsg.includes('Failed to fetch')) {
          const delay = Math.pow(2, attempt) * 1000 + Math.random() * 1000;
          console.warn(`Server sibuk/gagal, mencoba ulang (${attempt}/${retries}) dalam ${Math.round(delay)}ms...`);
          await new Promise(resolve => setTimeout(resolve, delay));
        } else {
          throw err;
        }
      }
    }
  },

  // Helper mutasi: kirim langsung jika online, otomatis antre ke outbox jika offline / gagal koneksi
  async executeMutation(action: string, payload: any): Promise<any> {
    if (typeof navigator !== 'undefined' && !navigator.onLine) {
      const queuedId = await safeQueueOutbox(action, payload)
      return { status: 'success', queued: true, client_generated_id: queuedId, offline: true }
    }
    try {
      return await this.postAction(action, payload)
    } catch (err) {
      console.warn(`Gagal mengirim aksi ${action} secara online, menyimpan ke antrean offline:`, err)
      const queuedId = await safeQueueOutbox(action, payload)
      if (!queuedId) throw err
      return { status: 'success', queued: true, client_generated_id: queuedId, offline: true }
    }
  },

  // Mutation Methods: Direct Online Mode by default, with fallback to local outbox if offline/error
  async createTransaction(payload: TransactionPayload): Promise<any> {
    const txId = new Date().getTime().toString()
    const invoiceNo = payload.invoice_no || `HSK-${new Date().toISOString().replace(/\D/g,'').slice(0,14)}`
    payload.invoice_no = invoiceNo
    
    // Save to local history for cashier to view later
    try {
      const { saveLocalTransaction } = await import('./db');
      await saveLocalTransaction(txId, invoiceNo, payload);
    } catch (e) {
      console.error('Failed saving local transaction', e);
    }

    // Jika perangkat sedang offline, langsung simpan ke antrean outbox lokal tanpa menunggu timeout
    if (typeof navigator !== 'undefined' && !navigator.onLine) {
      const client_generated_id = await safeQueueOutbox('createTransaction', payload)
      return { status: 'success', transaction_id: txId, client_generated_id, offline: true, invoice_no: invoiceNo }
    }

    try {
      const res = await this.postAction('createTransaction', payload)
      return { ...res, transaction_id: txId, invoice_no: invoiceNo }
    } catch (err) {
      console.warn('API Error, saving to outbox:', err)
      const client_generated_id = await safeQueueOutbox('createTransaction', payload)
      if (!client_generated_id) {
        throw new Error('Koneksi terputus dan gagal menyimpan ke antrean offline.')
      }
      return { status: 'success', transaction_id: txId, client_generated_id, offline: true, invoice_no: invoiceNo }
    }
  },

  async voidTransaction(data: {
    invoice_no: string
    transaction_id?: string
    return_stock: boolean
    branch_id?: string
    items?: { product_id: number; qty: number }[]
  }): Promise<any> {
    return await this.executeMutation('voidTransaction', data)
  },

  async saveRecipe(productId: number, recipes: { ingredient_id: number; qty_per_unit: number }[]): Promise<any> {
    return await this.executeMutation('saveRecipe', { product_id: productId, recipes })
  },

  async saveStockOpname(items: { ingredient_id: number; system_stock: number; physical_count: number; notes?: string }[], recordedBy = 'Owner', branchId?: string): Promise<any> {
    const payload = { items, recorded_by: recordedBy, branch_id: branchId }
    return await this.executeMutation('saveStockOpname', payload)
  },

  async saveOutlet(outlet: Outlet): Promise<any> {
    return await this.executeMutation('saveOutlet', outlet)
  },

  async deleteOutlet(outletId: string): Promise<any> {
    return await this.executeMutation('deleteOutlet', { id: outletId })
  },

  async saveCashier(cashier: Cashier): Promise<any> {
    return await this.executeMutation('saveCashier', cashier)
  },

  async deleteCashier(cashierId: string): Promise<any> {
    return await this.executeMutation('deleteCashier', { id: cashierId })
  },

  async saveShiftReport(reportData: any): Promise<any> {
    return await this.executeMutation('saveShiftReport', reportData)
  },

  async saveProduct(productData: any): Promise<any> {
    return await this.executeMutation('saveProduct', productData)
  },

  async deleteProduct(productId: number): Promise<any> {
    return await this.executeMutation('deleteProduct', { id: productId })
  },

  async savePromo(promo: any): Promise<any> {
    const res = await this.executeMutation('savePromo', promo)
    return { id: promo.id, ...res }
  },

  async deletePromo(id: number): Promise<any> {
    const res = await this.executeMutation('deletePromo', { id })
    return { id, ...res }
  },

  async saveStockIn(stockInData: any): Promise<any> {
    return await this.executeMutation('saveStockIn', stockInData)
  },

  async saveIngredient(ingredientData: any): Promise<any> {
    return await this.executeMutation('saveIngredient', ingredientData)
  },

  async deleteIngredient(id: number | string): Promise<any> {
    return await this.executeMutation('deleteIngredient', { id })
  },

  async aiAnalyze(payload: AiAnalyzePayload): Promise<AiInsightResponse> {
    const isOnline = typeof navigator === 'undefined' ? true : navigator.onLine

    const snapshotClean = payload.snapshot ? { ...payload.snapshot } : {}
    if (snapshotClean.meta) {
      const { generatedAtWib, ...restMeta } = snapshotClean.meta
      snapshotClean.meta = restMeta
    }
    const questionPart = payload.question ? `_q${fastHash(payload.question)}` : ''
    const cacheKey = `${payload.scope || 'all'}_${fastHash(JSON.stringify(snapshotClean))}${questionPart}`

    if (!payload.force) {
      const cached = getLocalAiCache(cacheKey)
      if (cached) {
        return cached
      }
    }

    if (!isOnline) {
      const stale = getAnyStaleAiCache(cacheKey)
      if (stale) {
        return {
          ...stale,
          meta: { ...stale.meta, isStale: true }
        }
      }
      throw new Error('[AI_OFFLINE] Perangkat sedang offline. Menampilkan analisis tersimpan jika ada.')
    }

    try {
      const res = await this.postAction('aiAnalyze', payload, 1, 45000)
      const data: AiInsightResponse = res?.data || res
      if (!data || !data.insight) {
        throw new Error('[AI_BAD_RESPONSE] Respon AI tidak valid dari server.')
      }
      setLocalAiCache(cacheKey, data)
      return data
    } catch (err: any) {
      const rawMsg = err instanceof Error ? err.message : String(err)
      if (rawMsg.includes('AI_QUOTA') || rawMsg.includes('AI_RATE_LIMIT') || rawMsg.includes('fetch') || rawMsg.includes('timeout') || rawMsg.includes('aborted')) {
        const stale = getAnyStaleAiCache(cacheKey)
        if (stale) {
          return {
            ...stale,
            meta: { ...stale.meta, isStale: true }
          }
        }
      }
      throw err
    }
  },
  async getOwnerDashboardData(): Promise<any> {
    const res = await this.postAction('getOwnerDashboardData', {})
    // Unwrap: Code.gs returns { status, data: { transactions, shiftReports, ingredients } }
    if (res && res.status === 'success' && res.data) return res.data
    return res
  },

  async getBranchReportData(branchId: string): Promise<any> {
    const res = await this.postAction('getBranchReportData', { branchId })
    // Unwrap: Code.gs returns { status, data: { transactions, transactionItems, pettyCash, shiftReports } }
    if (res && res.status === 'success' && res.data) return res.data
    return res
  },

  async openShift(shiftData: any): Promise<any> {
    return await this.executeMutation('openShift', shiftData)
  },

  async savePettyCash(data: { id?: string; branch_id: string; shift_id: string; date: string; type: string; amount: number; description: string; recorded_by: string; receipt_url?: string }): Promise<any> {
    return await this.executeMutation('savePettyCash', data)
  },

  async deletePettyCash(id: string, branch_id: string): Promise<any> {
    return await this.executeMutation('deletePettyCash', { id, branch_id })
  },

  async uploadImage(
    file: File,
    customFilename?: string,
    isLogo: boolean = false,
    extraMeta?: { type?: string; branch_name?: string; category?: string; amount?: number }
  ): Promise<string> {
    const { base64, mimeType } = await compressImageFile(file, isLogo ? 800 : 1280, isLogo ? 800 : 1280, 0.75)
    const res = await this.postAction('uploadImage', {
      filename: customFilename || file.name,
      mimeType: mimeType,
      base64: base64,
      isLogo: isLogo,
      ...extraMeta
    })
    if (res && res.url) {
      return res.url
    }
    throw new Error('Gagal mengupload gambar (URL kosong)')
  }
}

/**
 * Kompresi gambar client-side dengan HTML5 Canvas sebelum upload ke Google Apps Script (BUG-014)
 * Menjamin file kamera resolusi tinggi (>5-10MB) di-resize dan dikompresi menjadi ukuran optimal (<500KB)
 */
export function compressImageFile(
  file: File,
  maxWidth = 1280,
  maxHeight = 1280,
  quality = 0.75
): Promise<{ base64: string; mimeType: string }> {
  return new Promise((resolve, reject) => {
    // Fallback jika tidak ada objek DOM (misal di Node test environment)
    if (typeof window === 'undefined' || typeof document === 'undefined' || !file.type.startsWith('image/')) {
      const reader = new FileReader()
      reader.onload = (e) => resolve({ base64: e.target?.result as string, mimeType: file.type || 'image/jpeg' })
      reader.onerror = () => reject(new Error('Gagal membaca file gambar'))
      reader.readAsDataURL(file)
      return
    }

    const img = new Image()
    const objectUrl = URL.createObjectURL(file)
    img.onload = () => {
      URL.revokeObjectURL(objectUrl)
      let { width, height } = img

      if (width > maxWidth || height > maxHeight) {
        if (width / height > maxWidth / maxHeight) {
          height = Math.round((height * maxWidth) / width)
          width = maxWidth
        } else {
          width = Math.round((width * maxHeight) / height)
          height = maxHeight
        }
      }

      const canvas = document.createElement('canvas')
      canvas.width = width
      canvas.height = height
      const ctx = canvas.getContext('2d')
      if (!ctx) {
        const reader = new FileReader()
        reader.onload = (e) => resolve({ base64: e.target?.result as string, mimeType: file.type })
        reader.onerror = () => reject(new Error('Gagal membaca file lokal'))
        reader.readAsDataURL(file)
        return
      }

      ctx.drawImage(img, 0, 0, width, height)
      // Pertahankan PNG untuk logo berlatar transparan, gunakan JPEG untuk foto nota/produk
      const isPng = file.type === 'image/png'
      const targetMime = isPng ? 'image/png' : 'image/jpeg'
      const compressedBase64 = canvas.toDataURL(targetMime, isPng ? undefined : quality)
      resolve({ base64: compressedBase64, mimeType: targetMime })
    }
    img.onerror = () => {
      URL.revokeObjectURL(objectUrl)
      reject(new Error('Gagal memuat gambar untuk kompresi'))
    }
    img.src = objectUrl
  })
}

