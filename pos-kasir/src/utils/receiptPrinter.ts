export interface GenerateReceiptOptions {
  outlet: { name?: string; address?: string };
  items: any[];
  subtotal: number;
  discount?: number;
  promoName?: string;
  tax?: number;
  serviceChargeAmount?: number;
  total: number;
  received?: number;
  change?: number;
  receiptNo: string;
  waktu: string;
  cashier: string;
  tableName: string;
  paymentMethod: string;
  footer?: string;
  taxRate?: number;
  serviceRate?: number;
  paperWidth?: '58mm' | '80mm' | 'auto';
  showLogo?: boolean;
}

export function resolveEffectivePaperWidth(width?: '58mm' | '80mm' | 'auto'): '58mm' | '80mm' {
  if (width === '58mm') return '58mm'
  if (width === '80mm') return '80mm'
  if (typeof window !== 'undefined') {
    const saved = localStorage.getItem('hasuka_printer_paper_width')
    if (saved === '58mm' || saved === '80mm') return saved
    if (window.innerWidth < 768) return '58mm'
  }
  return '80mm'
}

export function generateReceiptString(data: GenerateReceiptOptions): string {
  const {
    outlet,
    items,
    subtotal,
    discount = 0,
    promoName,
    tax = 0,
    serviceChargeAmount = 0,
    total,
    received = 0,
    change = 0,
    receiptNo,
    waktu,
    cashier,
    tableName,
    paymentMethod,
    footer,
    taxRate = 0,
    serviceRate = 0,
    paperWidth = 'auto'
  } = data

  const effectiveWidth = resolveEffectivePaperWidth(paperWidth)
  const cols = effectiveWidth === '80mm' ? 42 : 32

  const center = (str: string, len: number = cols): string => {
    const s = str.length > len ? str.substring(0, len) : str
    const left = Math.max(0, Math.floor((len - s.length) / 2))
    return ' '.repeat(left) + s + ' '.repeat(Math.max(0, len - s.length - left))
  }

  const centerWrap = (str: string, len: number = cols): string[] => {
    if (!str) return []
    const words = str.split(' ')
    const lines: string[] = []
    let cur = ''
    for (const w of words) {
      if ((cur ? cur + ' ' + w : w).length <= len) {
        cur += (cur ? ' ' : '') + w
      } else {
        if (cur) lines.push(center(cur, len))
        if (w.length > len) {
          lines.push(center(w.substring(0, len), len))
          cur = w.substring(len)
        } else {
          cur = w
        }
      }
    }
    if (cur) lines.push(center(cur, len))
    return lines
  }

  const wordWrap = (str: string, maxLen: number): string[] => {
    if (!str) return []
    const words = str.split(' ')
    const lines: string[] = []
    let cur = ''
    for (const w of words) {
      if ((cur ? cur + ' ' + w : w).length <= maxLen) {
        cur += (cur ? ' ' : '') + w
      } else {
        if (cur) lines.push(cur)
        if (w.length > maxLen) {
          lines.push(w.substring(0, maxLen))
          cur = w.substring(maxLen)
        } else {
          cur = w
        }
      }
    }
    if (cur) lines.push(cur)
    return lines
  }

  const f = (n: number) => Math.round(n || 0).toLocaleString('id-ID')

  const row = (left: string, right: string): string => {
    const space = cols - left.length - right.length
    if (space > 0) return left + ' '.repeat(space) + right + '\n'
    return left.substring(0, Math.max(0, cols - right.length - 1)) + ' ' + right + '\n'
  }

  const dividerDouble = '='.repeat(cols) + '\n'
  const dividerSingle = '-'.repeat(cols) + '\n'

  const meta = (label: string, value: string): string => {
    const labelStr = (label + ':').padEnd(11, ' ')
    if (labelStr.length + value.length <= cols) {
      return labelStr + value + '\n'
    }
    // Jika value panjang, pisah baris dengan indent rapi
    const maxValLen = cols - 11
    const lines: string[] = []
    let remaining = value
    while (remaining.length > 0) {
      if (lines.length === 0) {
        lines.push(labelStr + remaining.substring(0, maxValLen))
        remaining = remaining.substring(maxValLen)
      } else {
        lines.push(' '.repeat(11) + remaining.substring(0, maxValLen))
        remaining = remaining.substring(maxValLen)
      }
    }
    return lines.join('\n') + '\n'
  }

  let out = ''
  if (data.showLogo !== false) {
    out += center('[ HASUKA DIMSUM ]') + '\n'
  }
  out += center((outlet?.name || 'HASUKA DIMSUM').toUpperCase()) + '\n'
  if (outlet?.address) {
    const addrLines = centerWrap(outlet.address, cols)
    addrLines.forEach(l => out += l + '\n')
  }
  if ((outlet as any)?.phone) {
    out += center('Telp: ' + (outlet as any).phone) + '\n'
  }
  out += dividerDouble
  out += meta('Order ID', receiptNo || '-')
  out += meta('Waktu', waktu || '-')
  out += meta('Kasir', cashier || 'Kasir')
  out += meta('Meja/Tipe', tableName || 'Dine In')
  out += dividerDouble
  out += 'Items:\n'

  if (items && items.length > 0) {
    items.forEach((item: any, idx: number) => {
      const name = item.product_name || item.name || 'Item'
      const prefix = `${idx + 1}. `
      const qtyStr = `${item.qty || 1} x ${f(item.unit_price || item.price || 0)}`
      const priceStr = f(item.subtotal || item.total || 0)

      // Cetak Nama Produk (Wrap per kata jika panjang tanpa memotong di tengah harga)
      const words = name.split(' ')
      const nameLines: string[] = []
      let curLine = prefix
      for (const w of words) {
        if ((curLine + (curLine === prefix ? '' : ' ') + w).length <= cols) {
          curLine += (curLine === prefix ? '' : ' ') + w
        } else {
          nameLines.push(curLine)
          curLine = '   ' + w // Indentasi baris nama lanjutan
        }
      }
      if (curLine) nameLines.push(curLine)

      nameLines.forEach(l => {
        out += l + '\n'
      })

      // Baris kuantitas & subtotal item (selalu sejajar rapi di kanan)
      out += row(`   ${qtyStr}`, priceStr)

      if (item.promo && !item.is_bundle) {
        out += `   * Diskon Promo Khusus\n`
      }

      // Rincian komposisi bundle atau catatan item
      const bundleDetail = item.bundle_items
        ? item.bundle_items.map((b: any) => `${b.qty || 1}x ${b.productName || b.product_name}`).join(', ')
        : (item.bundleProducts ? item.bundleProducts.map((b: any) => `${b.qty || 1}x ${b.productName}`).join(', ') : '')

      const rawNote = item.notes || (bundleDetail ? `Isi: ${bundleDetail}` : '')
      if (rawNote) {
        const cleanNote = rawNote.startsWith('Isi:') ? rawNote : (rawNote.startsWith('Catatan:') ? rawNote : `Catatan: ${rawNote}`)
        const wrappedNotes = wordWrap(cleanNote, cols - 6)
        wrappedNotes.forEach((wn, wIdx) => {
          if (wIdx === 0) {
            out += `   * ${wn}\n`
          } else {
            out += `     ${wn}\n`
          }
        })
      }
    })
  }

  out += dividerSingle
  const totalQty = items ? items.reduce((a: number, b: any) => a + (b.qty || 1), 0) : 0
  out += row('Total Items', String(totalQty))
  out += dividerSingle

  out += row('Subtotal', f(subtotal))
  if (discount > 0) {
    const pLabel = promoName ? `Promo (${promoName})` : 'Diskon Promo'
    const rLine = `- ${f(discount)}`
    if (pLabel.length + rLine.length <= cols) {
      out += pLabel + ' '.repeat(cols - pLabel.length - rLine.length) + rLine + '\n'
    } else {
      out += row('Diskon Promo', rLine)
      if (promoName) {
        out += `   (${promoName})\n`
      }
    }
  }
  if (taxRate > 0 || tax > 0) {
    const dpp = subtotal - discount
    out += row('Dasar Pajak', f(dpp))
    out += row(`PB1/Pajak (${taxRate}%)`, f(tax))
  }
  if (serviceRate > 0 || serviceChargeAmount > 0) {
    out += row(`Layanan (${serviceRate}%)`, f(serviceChargeAmount))
  }
  out += dividerSingle
  out += row('TOTAL AKHIR', f(total))
  out += dividerSingle
  out += row('Metode Bayar', paymentMethod || 'TUNAI')
  if (paymentMethod === 'QRIS') {
    out += row('Status', 'LUNAS (QRIS)')
  } else {
    out += row('Tunai Diterima', f(received || total))
    out += row('Kembalian', f(change || 0))
  }
  out += dividerDouble

  if (footer) {
    const footerLines = footer.split('\n')
    footerLines.forEach((l: string) => {
      const cleanL = l.trim()
      if (cleanL) {
        const wrapped = centerWrap(cleanL, cols)
        wrapped.forEach(wl => out += wl + '\n')
      } else {
        out += '\n'
      }
    })
  }

  return out
}
