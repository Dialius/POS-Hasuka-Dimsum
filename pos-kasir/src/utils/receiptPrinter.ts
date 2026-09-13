export function generateReceiptString(data: any) {
  const { outlet, items, subtotal, discount, tax, total, received, change, receiptNo, waktu, cashier, tableName, paymentMethod, footer } = data
  const center = (str: string, len: number) => {
    const s = str.substring(0, len)
    const left = Math.max(0, Math.floor((len - s.length) / 2))
    return ' '.repeat(left) + s + ' '.repeat(Math.max(0, len - s.length - left))
  }
  const centerWrap = (str: string, len: number) => {
    if (!str) return []
    const words = str.split(' ')
    const lines = []
    let cur = ''
    for (const w of words) {
        if ((cur + ' ' + w).length <= len) {
            cur += (cur ? ' ' : '') + w
        } else {
            if (cur) lines.push(center(cur, len))
            cur = w
        }
    }
    if (cur) lines.push(center(cur, len))
    return lines
  }
  
  const f = (n: number) => n.toLocaleString('id-ID')
  const row = (left: string, right: string) => {
      const space = 32 - left.length - right.length
      if (space > 0) return left + ' '.repeat(space) + right + '\n'
      return left.substring(0, 32 - right.length - 1) + ' ' + right + '\n'
  }
  const meta = (label: string, value: string) => {
     const line = `${label.padEnd(10, ' ')}: ${value}`
     return line.substring(0, 32) + '\n'
  }
  
  let out = ''
  if (data.showLogo !== false) {
    out += center('[ LOGO HASUKA ]', 32) + '\n'
  }
  out += center(outlet.name.toUpperCase(), 32) + '\n'
  const addrLines = centerWrap(outlet.address, 32)
  addrLines.forEach(l => out += l + '\n')
  out += '================================\n'
  out += meta('Order ID', receiptNo)
  out += meta('Waktu', waktu)
  out += meta('Pelayan', cashier)
  out += meta('Meja/Nama', tableName)
  out += '================================\n'
  out += 'Items:\n'
  
  if (items && items.length > 0) {
    items.forEach((item: any, idx: number) => {
        const name = `${idx+1}. ${item.product_name || item.name}`.substring(0, 22)
        const priceStr = f(item.subtotal || item.total || 0)
        out += row(name, priceStr)
        out += `   ${item.qty} x ${f(item.unit_price || item.price || 0)}\n`
        if (item.promo) {
            out += `   (Promo Spesial)\n`
        }
    })
  }
  
  out += '--------------------------------\n'
  out += row('Total Item', String(items ? items.reduce((a: number, b: any) => a + (b.qty || 1), 0) : 0))
  out += '--------------------------------\n'
  
  out += row('Subtotal', f(subtotal))
  if (discount > 0) {
      const dLine = `Diskon Promo`
      const rLine = `-  ${f(discount)}`
      out += dLine + ' '.repeat(32 - dLine.length - rLine.length) + rLine + '\n'
  }
  const dpp = subtotal - discount
  out += row('Dasar Pengenaan Pajak', f(dpp))
  out += row('PPN 11%', f(tax))
  out += '--------------------------------\n'
  out += row('GRAND TOTAL', f(total))
  out += '--------------------------------\n'
  out += row('Tipe Bayar', paymentMethod)
  out += row('Diterima', f(received))
  out += row('Kembalian', f(change))
  out += '================================\n'
  
  if (footer) {
      const footerLines = footer.split('\n')
      footerLines.forEach((l: string) => {
          out += center(l.trim(), 32) + '\n'
      })
  }
  
  return out
}
