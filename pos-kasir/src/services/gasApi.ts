import { Product, Ingredient, Recipe } from '../context/AppContext'
import { Outlet, Cashier } from '../context/AppContext'

// Feature flag: set to true to enable local SQLite outbox queueing (requires Tauri native desktop environment)
export const ENABLE_OFFLINE_QUEUE = false

export const isOfflineQueueActive = (): boolean => {
  if (!ENABLE_OFFLINE_QUEUE) return false
  if (typeof window === 'undefined') return false
  return '__TAURI_INTERNALS__' in window
}

async function safeQueueOutbox(action: string, payload: any) {
  if (isOfflineQueueActive()) {
    const { queueOutbox } = await import('./db')
    return await queueOutbox(action, payload)
  }
  return null
}

const STORAGE_KEY = 'hasuka_gas_api_url'
export const DEFAULT_GAS_URL = 'https://script.google.com/macros/s/AKfycbyx2mil7ssR0hH-vtc1-ScpLNV5EEhsEnmSQpEUEeNK6Z_amjmT2G0pkaaHu-rxqulQ/exec'

export interface InitialDataResponse {
  products: Product[]
  ingredients: Ingredient[]
  recipes: Recipe[]
  categories?: { id: number; name: string }[]
  settings?: Record<string, string>
  outlets?: Outlet[]
  cashiers?: Cashier[]
}

export interface TransactionPayload {
  invoice_no?: string
  cashier: string
  branch_id?: string
  shift_id?: number
  subtotal: number
  promo_discount: number
  manual_discount: number
  tax: number
  total: number
  payment_method: string
  cash_received?: number
  change_amount?: number
  items: {
    product_id: number
    product_name: string
    qty: number
    unit_price: number
    subtotal: number
  }[]
}

export const gasApi = {
  cleanUrl(url: string): string {
    let cleaned = (url || '').trim()
    // Hapus parameter query jika ada
    cleaned = cleaned.replace(/\?.*$/, '').replace(/\/+$/, '')
    // Jika user copy URL dari browser editor Apps Script (/edit), ubah ke /exec
    if (cleaned.endsWith('/edit')) {
      cleaned = cleaned.replace(/\/edit$/, '/exec')
    }
    // Jika URL Google Apps Script belum berakhiran /exec
    if (cleaned.includes('/macros/s/') && !cleaned.endsWith('/exec') && !cleaned.endsWith('/dev')) {
      cleaned = cleaned + '/exec'
    }
    return cleaned
  },

  getAutoDetectedUrl(): string | null {
    if (typeof window === 'undefined') return null
    
    // 1. Cek variabel global yang disuntikkan dari Code.gs (paling akurat)
    // @ts-ignore
    if (window.__GAS_URL__) {
      // @ts-ignore
      return this.cleanUrl(window.__GAS_URL__)
    }
    
    // 2. Jika dibuka langsung di browser address bar script.google.com
    if (window.location.hostname === 'script.google.com' && window.location.pathname.includes('/macros/s/')) {
      return this.cleanUrl(window.location.origin + window.location.pathname)
    }
    
    return null
  },

  getUrl(): string {
    // Prioritas 1: Otomatis deteksi jika sedang berjalan di dalam Google Apps Script (Zero-config!)
    const auto = this.getAutoDetectedUrl()
    if (auto) return auto

    // Prioritas 2: Ambil dari localStorage yang sudah disimpan manual
    try {
      const stored = localStorage.getItem(STORAGE_KEY)
      if (stored) return this.cleanUrl(stored)
    } catch { /* ignore */ }

    // Prioritas 3: Fallback ke default URL aktif
    return this.cleanUrl(DEFAULT_GAS_URL)
  },

  setUrl(url: string) {
    try {
      localStorage.setItem(STORAGE_KEY, this.cleanUrl(url))
    } catch { /* ignore */ }
  },

  isConfigured(): boolean {
    const url = this.getUrl()
    return url.length > 0 && url.startsWith('https://script.google.com/macros/s/')
  },

  async ping(customUrl?: string): Promise<{ success: boolean; message: string }> {
    const rawUrl = customUrl || this.getUrl()
    if (!rawUrl) {
      return { success: false, message: 'URL Google Apps Script belum diisi.' }
    }

    const targetUrl = this.cleanUrl(rawUrl)
    if (!targetUrl.startsWith('https://script.google.com/macros/s/')) {
      return {
        success: false,
        message: 'Format URL tidak valid. URL harus diawali dengan https://script.google.com/macros/s/...'
      }
    }

    try {
      const res = await fetch(`${targetUrl}?action=ping`, {
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

  async getInitialData(branchId?: string): Promise<InitialDataResponse | null> {
    const url = this.getUrl()
    if (!url) return null;

    try {
      // Coba gunakan google.script.run jika aplikasi dijalankan di dalam Web App Google Apps Script
      // @ts-ignore
      if (typeof window !== 'undefined' && window.google && window.google.script && window.google.script.run) {
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
                resolve(data);
              } else {
                reject(new Error(res?.message || 'Gagal memuat data awal via RPC'));
              }
            })
            .withFailureHandler((err: any) => reject(err))
            .rpcGetInitialData(branchId);
        });
      }

      // Fallback ke fetch (untuk testing di localhost)
      const fetchUrl = branchId ? `${url}?action=getInitialData&branchId=${encodeURIComponent(branchId)}` : `${url}?action=getInitialData`;
      const res = await fetch(fetchUrl)
      if (!res.ok) throw new Error('Gagal mengambil data dari Google Sheets')
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
        return data;
      }
      throw new Error(json.message || 'Respon data kosong')
    } catch (err) {
      console.warn('Gagal fetch dari GAS:', err)
      return null
    }
  },

  // This is now purely used by syncWorker for pushing batches
  // This is now purely used by syncWorker for pushing batches
  async postAction(action: string, data: any): Promise<any> {
    const url = this.getUrl()
    if (!url) {
      return { status: 'mock_success' }
    }

    // Coba gunakan google.script.run jika aplikasi dijalankan di dalam Web App Google Apps Script
    // @ts-ignore
    if (typeof window !== 'undefined' && window.google && window.google.script && window.google.script.run) {
      return await new Promise((resolve, reject) => {
        // @ts-ignore
        window.google.script.run
          .withSuccessHandler((res: any) => resolve(res))
          .withFailureHandler((err: any) => reject(err))
          .rpcPostAction(action, data);
      });
    }

    // Fallback ke fetch (untuk testing di localhost)
    const res = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'text/plain;charset=utf-8'
      },
      body: JSON.stringify({ action, data })
    })

    if (!res.ok) {
      throw new Error(`Gagal mengirim data: HTTP ${res.status}`)
    }

    return await res.json()
  },

  // Mutation Methods: Direct Online Mode by default, with fallback to local outbox if enabled
  async createTransaction(payload: TransactionPayload): Promise<any> {
    if (isOfflineQueueActive()) {
      const client_generated_id = await safeQueueOutbox('createTransaction', payload)
      return { status: 'success', transaction_id: client_generated_id, client_generated_id }
    }
    return await this.postAction('createTransaction', payload)
  },

  async saveRecipe(productId: number, recipes: { ingredient_id: number; qty_per_unit: number }[]): Promise<any> {
    if (isOfflineQueueActive()) {
      await safeQueueOutbox('saveRecipe', { product_id: productId, recipes })
      return { status: 'success' }
    }
    return await this.postAction('saveRecipe', { product_id: productId, recipes })
  },

  async saveStockOpname(items: { ingredient_id: number; system_stock: number; physical_count: number; notes?: string }[], recordedBy = 'Owner'): Promise<any> {
    if (isOfflineQueueActive()) {
      await safeQueueOutbox('saveStockOpname', { items, recorded_by: recordedBy })
      return { status: 'success' }
    }
    return await this.postAction('saveStockOpname', { items, recorded_by: recordedBy })
  },

  async saveOutlet(outlet: Outlet): Promise<any> {
    if (isOfflineQueueActive()) {
      await safeQueueOutbox('saveOutlet', outlet)
      return { status: 'success' }
    }
    return await this.postAction('saveOutlet', outlet)
  },

  async deleteOutlet(outletId: string): Promise<any> {
    if (isOfflineQueueActive()) {
      await safeQueueOutbox('deleteOutlet', { id: outletId })
      return { status: 'success' }
    }
    return await this.postAction('deleteOutlet', { id: outletId })
  },

  async saveCashier(cashier: Cashier): Promise<any> {
    if (isOfflineQueueActive()) {
      await safeQueueOutbox('saveCashier', cashier)
      return { status: 'success' }
    }
    return await this.postAction('saveCashier', cashier)
  },

  async deleteCashier(cashierId: string): Promise<any> {
    if (isOfflineQueueActive()) {
      await safeQueueOutbox('deleteCashier', { id: cashierId })
      return { status: 'success' }
    }
    return await this.postAction('deleteCashier', { id: cashierId })
  },

  async saveShiftReport(reportData: any): Promise<any> {
    if (isOfflineQueueActive()) {
      await safeQueueOutbox('saveShiftReport', reportData)
      return { status: 'success' }
    }
    return await this.postAction('saveShiftReport', reportData)
  },

  async saveProduct(productData: any): Promise<any> {
    if (isOfflineQueueActive()) {
      await safeQueueOutbox('saveProduct', productData)
      return { status: 'success' }
    }
    return await this.postAction('saveProduct', productData)
  },

  async saveStockIn(stockInData: any): Promise<any> {
    if (isOfflineQueueActive()) {
      await safeQueueOutbox('saveStockIn', stockInData)
      return { status: 'success' }
    }
    return await this.postAction('saveStockIn', stockInData)
  },

  async saveIngredient(ingredientData: any): Promise<any> {
    if (isOfflineQueueActive()) {
      await safeQueueOutbox('saveIngredient', ingredientData)
      return { status: 'success' }
    }
    return await this.postAction('saveIngredient', ingredientData)
  },

  async getOwnerDashboardData(): Promise<any> {
    return await this.postAction('getOwnerDashboardData', {})
  },

  async uploadImage(file: File): Promise<string> {
    // For images we still upload directly since we need the URL immediately.
    // Or we could store base64 in SQLite, but direct upload is easier for now.
    return new Promise((resolve, reject) => {
      const reader = new FileReader()
      reader.onload = async (e) => {
        try {
          const base64 = e.target?.result as string
          const res = await this.postAction('uploadImage', {
            filename: file.name,
            mimeType: file.type,
            base64: base64
          })
          if (res && res.url) {
            resolve(res.url)
          } else {
            reject(new Error('Gagal mengupload gambar (URL kosong)'))
          }
        } catch (err) {
          reject(err)
        }
      }
      reader.onerror = () => reject(new Error('Gagal membaca file lokal'))
      reader.readAsDataURL(file)
    })
  }
}

