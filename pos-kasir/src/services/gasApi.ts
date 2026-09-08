import { Product, Ingredient, Recipe, PRODUCTS, INGREDIENTS, RECIPES } from '../data/mockData'
import { Outlet, Cashier } from '../context/AppContext'
import { queueOutbox } from './db'

const STORAGE_KEY = 'hasuka_gas_api_url'
export const DEFAULT_GAS_URL = 'https://script.google.com/macros/s/AKfycbyYRDinLFIMJ_d_DwyFvwNHfF3IjfnfivxMvG4Vh_kZA3U6RGQNMakFYV0H6RFJYRBK/exec'

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
  getUrl(): string {
    return localStorage.getItem(STORAGE_KEY) || DEFAULT_GAS_URL
  },

  setUrl(url: string): void {
    localStorage.setItem(STORAGE_KEY, url.trim())
  },

  isConfigured(): boolean {
    const url = this.getUrl()
    return url.length > 0 && url.startsWith('https://script.google.com/macros/s/')
  },

  async ping(customUrl?: string): Promise<{ success: boolean; message: string }> {
    const targetUrl = customUrl || this.getUrl()
    if (!targetUrl) {
      return { success: false, message: 'URL Google Apps Script belum diisi' }
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
        return { success: true, message: data.message || 'Koneksi Berhasil!' }
      }
      return { success: false, message: data.message || 'Respon tidak valid' }
    } catch (err) {
      return {
        success: false,
        message: err instanceof Error ? err.message : 'Gagal menghubungi server'
      }
    }
  },

  async getInitialData(): Promise<InitialDataResponse | null> {
    const url = this.getUrl()
    if (!url) return null;

    try {
      const res = await fetch(`${url}?action=getInitialData`)
      if (!res.ok) throw new Error('Gagal mengambil data dari Google Sheets')
      const json = await res.json()
      if (json.status === 'success' && json.data) {
        return json.data
      }
      throw new Error(json.message || 'Respon data kosong')
    } catch (err) {
      console.warn('Gagal fetch dari GAS:', err)
      return null
    }
  },

  // This is now purely used by syncWorker for pushing batches
  async postAction(action: string, data: any): Promise<any> {
    const url = this.getUrl()
    if (!url) {
      return { status: 'mock_success' }
    }

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

  // Offline-First Wrappers using Outbox
  async createTransaction(payload: TransactionPayload): Promise<any> {
    // Save locally to SQLite and queue for sync
    const client_generated_id = await queueOutbox('createTransaction', payload);
    return { status: 'success', transaction_id: client_generated_id, client_generated_id };
  },

  async saveRecipe(productId: number, recipes: { ingredient_id: number; qty_per_unit: number }[]): Promise<any> {
    await queueOutbox('saveRecipe', { product_id: productId, recipes });
    return { status: 'success' };
  },

  async saveStockOpname(items: { ingredient_id: number; system_stock: number; physical_count: number; notes?: string }[], recordedBy = 'Owner'): Promise<any> {
    await queueOutbox('saveStockOpname', { items, recorded_by: recordedBy });
    return { status: 'success' };
  },

  async saveOutlet(outlet: Outlet): Promise<any> {
    await queueOutbox('saveOutlet', outlet);
    return { status: 'success' };
  },

  async deleteOutlet(outletId: string): Promise<any> {
    await queueOutbox('deleteOutlet', { id: outletId });
    return { status: 'success' };
  },

  async saveCashier(cashier: Cashier): Promise<any> {
    await queueOutbox('saveCashier', cashier);
    return { status: 'success' };
  },

  async deleteCashier(cashierId: string): Promise<any> {
    await queueOutbox('deleteCashier', { id: cashierId });
    return { status: 'success' };
  },

  async saveShiftReport(reportData: any): Promise<any> {
    await queueOutbox('saveShiftReport', reportData);
    return { status: 'success' };
  },

  async saveProduct(productData: any): Promise<any> {
    await queueOutbox('saveProduct', productData);
    return { status: 'success' };
  },

  async saveIngredient(ingredientData: any): Promise<any> {
    await queueOutbox('saveIngredient', ingredientData);
    return { status: 'success' };
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

