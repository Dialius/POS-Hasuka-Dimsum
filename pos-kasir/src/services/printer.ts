import { webSerialPrinter } from './webSerialPrinter';

export interface PrinterConfig {
  ip?: string;
  port?: number;
  paperWidth?: '58mm' | '80mm' | 'auto';
  printerType?: 'system_browser' | 'bluetooth_serial' | 'auto_device' | 'browser' | 'network' | 'bluetooth' | 'tauri_rust' | 'usb_serial';
}

export type PrinterType = 'system_browser' | 'bluetooth_serial' | 'auto_device' | 'browser' | 'network' | 'bluetooth' | 'tauri_rust' | 'usb_serial';

export interface PrinterSettingsConfig {
  printerType: PrinterType;
  printerName: string;
  ip: string;
  port: number;
  paperWidth: '58mm' | '80mm' | 'auto';
  autoCut: boolean;
  openCashDrawer: boolean;
  autoPrintOnCheckout: boolean;
  chunkSize?: number;
  chunkDelayMs?: number;
}

export const detectDevicePlatform = () => {
  if (typeof window === 'undefined') {
    return {
      os: 'Perangkat Sistem',
      isMobile: false,
      recommendedPaper: '58mm' as const,
      description: 'Driver Printer Sistem'
    };
  }

  const ua = navigator.userAgent;
  const isMobile = /Android|iPhone|iPad|iPod|Mobile/i.test(ua) || window.innerWidth < 768;

  let os = 'Perangkat Komputer';
  if (/Windows/i.test(ua)) os = 'Windows PC';
  else if (/Android/i.test(ua)) os = 'Android POS / Tablet';
  else if (/Macintosh|Mac OS/i.test(ua)) os = 'Apple Mac';
  else if (/iPad|iPhone/i.test(ua)) os = 'Apple iPad / iPhone';
  else if (/Linux/i.test(ua)) os = 'Linux';

  return {
    os,
    isMobile,
    recommendedPaper: '58mm' as const,
    description: isMobile
      ? `${os} • Mendukung Thermal Bluetooth & Android Print Service`
      : `${os} • Terdeteksi Driver Printer Sistem & Bluetooth Serial`
  };
};

export const DEFAULT_PRINTER_SETTINGS: PrinterSettingsConfig = {
  printerType: 'bluetooth_serial',
  printerName: 'RPP02N 58mm (Bluetooth SPP)',
  ip: '192.168.1.200',
  port: 9100,
  paperWidth: '58mm',
  autoCut: true,
  openCashDrawer: false,
  autoPrintOnCheckout: false,
  chunkSize: 256,
  chunkDelayMs: 30
};

export const getStoredPrinterSettings = (): PrinterSettingsConfig => {
  try {
    const raw = localStorage.getItem('hasuka_printer_settings');
    if (raw) {
      const parsed = JSON.parse(raw);
      // Hapus field legacy copies jika ada
      delete (parsed as any).copies;

      // Normalisasi nilai tipe printer legacy ke format baru
      let normalizedType: PrinterType = parsed.printerType || 'bluetooth_serial';
      if (normalizedType === 'bluetooth' || normalizedType === 'system_browser' || normalizedType === 'browser' || normalizedType === 'auto_device') {
        normalizedType = 'bluetooth_serial';
      }

      return {
        ...DEFAULT_PRINTER_SETTINGS,
        ...parsed,
        printerType: normalizedType,
        chunkSize: parsed.chunkSize || 256,
        chunkDelayMs: parsed.chunkDelayMs !== undefined ? parsed.chunkDelayMs : 30
      };
    }
  } catch (e) {}
  return DEFAULT_PRINTER_SETTINGS;
};

export const savePrinterSettings = (settings: PrinterSettingsConfig): void => {
  try {
    localStorage.setItem('hasuka_printer_settings', JSON.stringify(settings));
    if (settings.paperWidth) {
      localStorage.setItem('hasuka_printer_paper_width', settings.paperWidth);
    }
  } catch (e) {}
};

export const isTauriEnvironment = (): boolean => {
  return typeof window !== 'undefined' && '__TAURI_INTERNALS__' in window;
};

/**
 * Cetak thermal receipt via iframe terisolasi (Web / Browser / PWA / GAS / Fallback)
 * Otomatis beradaptasi dengan ukuran printer (58mm / 80mm / auto)
 */
export const printThermalReceiptWeb = (content: string, paperWidth: '58mm' | '80mm' | 'auto' = '58mm'): Promise<boolean> => {
  return new Promise((resolve) => {
    try {
      let iframe = document.getElementById('hasuka-thermal-print-frame') as HTMLIFrameElement | null;
      if (!iframe) {
        iframe = document.createElement('iframe');
        iframe.id = 'hasuka-thermal-print-frame';
        iframe.style.position = 'fixed';
        iframe.style.top = '-9999px';
        iframe.style.left = '-9999px';
        iframe.style.width = '0';
        iframe.style.height = '0';
        iframe.style.border = '0';
        iframe.style.visibility = 'hidden';
        iframe.style.zIndex = '-9999';
        document.body.appendChild(iframe);
      }

      // 58mm standar kasir Hasuka = 32 kolom teks
      const is80 = paperWidth === '80mm';
      const widthMm = is80 ? '80mm' : '58mm';
      const maxChar = is80 ? '42ch' : '32ch';

      const doc = iframe.contentWindow?.document;
      if (!doc) {
        window.print();
        return resolve(false);
      }

      const escapedContent = content
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;');

      doc.open();
      doc.write(`
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8" />
          <title>Struk Pembayaran - Hasuka Dimsum</title>
          <style>
            @page {
              size: ${widthMm} auto;
              margin: 0mm;
            }
            @media print {
              html, body {
                width: 100% !important;
                max-width: ${widthMm} !important;
                margin: 0 !important;
                padding: 0 !important;
                background: #ffffff !important;
                color: #000000 !important;
                -webkit-print-color-adjust: exact;
                print-color-adjust: exact;
              }
            }
            body {
              font-family: 'Consolas', 'Courier New', Courier, monospace;
              font-size: 11px;
              line-height: 1.35;
              color: #000000;
              background: #ffffff;
              margin: 0;
              padding: 4mm 2mm;
              display: flex;
              flex-direction: column;
              align-items: center;
              box-sizing: border-box;
            }
            pre {
              margin: 0;
              padding: 0;
              font-family: inherit;
              font-size: inherit;
              line-height: inherit;
              white-space: pre-wrap;
              word-break: break-word;
              width: 100%;
              max-width: ${maxChar};
              letter-spacing: 0.02em;
            }
          </style>
        </head>
        <body>
          <pre>${escapedContent}</pre>
        </body>
        </html>
      `);
      doc.close();

      setTimeout(() => {
        try {
          iframe?.contentWindow?.focus();
          iframe?.contentWindow?.print();
          resolve(true);
        } catch (err) {
          console.error('Iframe print error, falling back:', err);
          window.print();
          resolve(false);
        }
      }, 250);
    } catch (e) {
      console.error('Failed thermal print via iframe:', e);
      window.print();
      resolve(false);
    }
  });
};

/**
 * Gerbang Utama Pencetakan Struk (printReceipt)
 * Aturan:
 * 1. Jika tipe printer adalah 'bluetooth_serial' dan Web Serial didukung:
 *    - Cetak langsung biner ESC/POS via Web Serial.
 *    - Jika gagal SEBELUM byte terkirim (port gagal buka / belum konek): Otomatis fallback ke printThermalReceiptWeb.
 *    - Jika gagal DI TENGAH pengiriman (partial: true): JANGAN fallback otomatis (agar tidak dobel struk).
 *      Kirim event 'hasuka_printer_partial_error' ke UI agar kasir bisa klik "Cetak Ulang".
 * 2. Jika tipe printer 'system_browser' atau lainnya:
 *    - Cetak via printThermalReceiptWeb (dialog sistem).
 * 3. Transaksi tidak boleh gagal tersimpan hanya karena printer error.
 */
export const printReceipt = async (config: PrinterConfig, content: string): Promise<boolean> => {
  const settings = getStoredPrinterSettings();
  const effectivePaperWidth = config.paperWidth || settings.paperWidth || '58mm';
  const effectiveType = config.printerType || settings.printerType;

  // Jalur 1: Bluetooth Serial (Web Serial ESC/POS)
  if (effectiveType === 'bluetooth_serial' || effectiveType === 'usb_serial') {
    if (webSerialPrinter.isSupported()) {
      try {
        const res = await webSerialPrinter.printText(content, {
          paperWidth: effectivePaperWidth,
          autoCut: settings.autoCut,
          openCashDrawer: settings.openCashDrawer,
          chunkSize: settings.chunkSize,
          chunkDelayMs: settings.chunkDelayMs
        });

        if (res.success) {
          return true;
        }

        // Jika gagal di tengah pengiriman (sebagian byte sudah masuk ke printer):
        // JANGAN fallback otomatis agar struk tidak tercetak dobel!
        if (res.partial) {
          console.warn('[Printer] Gagal parsial saat mencetak via Bluetooth:', res.error);
          if (typeof window !== 'undefined') {
            window.dispatchEvent(new CustomEvent('hasuka_printer_partial_error', { detail: { message: res.error } }));
          }
          return false;
        }

        // Jika gagal sebelum ada byte terkirim (misal port belum terhubung atau timeout):
        console.warn('[Printer] Bluetooth belum siap, mengalihkan ke cetak sistem (fallback):', res.error);
        if (typeof window !== 'undefined') {
          window.dispatchEvent(new CustomEvent('hasuka_printer_fallback_notice', { detail: { reason: res.error } }));
        }
        return await printThermalReceiptWeb(content, effectivePaperWidth);
      } catch (err) {
        console.warn('[Printer] Exception Bluetooth, beralih ke fallback sistem:', err);
        return await printThermalReceiptWeb(content, effectivePaperWidth);
      }
    } else {
      console.warn('[Printer] Web Serial tidak didukung, beralih ke Driver Sistem');
      return await printThermalReceiptWeb(content, effectivePaperWidth);
    }
  }

  // Jalur 2: Placeholder Tauri Rust (untuk masa depan)
  if (effectiveType === 'tauri_rust' && isTauriEnvironment()) {
    try {
      const { invoke } = await import('@tauri-apps/api/core');
      await invoke('print_receipt', {
        ip: config.ip || '',
        port: config.port || 9100,
        content
      });
      return true;
    } catch (error) {
      console.error('Failed to print receipt via Tauri, falling back to web print:', error);
    }
  }

  // Jalur 3: Default Driver Sistem (Browser / Iframe)
  if (typeof window !== 'undefined') {
    return printThermalReceiptWeb(content, effectivePaperWidth);
  }

  return false;
};

/**
 * Mencetak lembar uji coba printer kasir (Test Print)
 */
export const printTestReceipt = async (
  settings: PrinterSettingsConfig,
  outletName: string = 'HASUKA DIMSUM'
): Promise<boolean> => {
  const is58 = settings.paperWidth !== '80mm';
  const cols = is58 ? 32 : 42;
  const d = new Date();
  const dateStr = d.toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' });
  const timeStr = d.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });

  const center = (s: string) => {
    const left = Math.max(0, Math.floor((cols - s.length) / 2));
    return ' '.repeat(left) + s;
  };
  const row = (l: string, r: string) => {
    const sp = Math.max(1, cols - l.length - r.length);
    return l + ' '.repeat(sp) + r;
  };

  const divider = '='.repeat(cols);
  const dash = '-'.repeat(cols);

  let out = '';
  out += center('[ HASUKA DIMSUM ]') + '\n';
  out += center(outletName.toUpperCase()) + '\n';
  out += center('HALAMAN UJI COBA PRINTER') + '\n';
  out += divider + '\n';
  out += row('Tipe Printer', settings.printerType === 'bluetooth_serial' ? 'Bluetooth (ESC/POS SPP)' : settings.printerType === 'usb_serial' ? 'Kabel USB (ESC/POS)' : 'Driver Sistem (Browser)') + '\n';
  out += row('Nama Device', settings.printerName || 'RPP02N Thermal') + '\n';
  out += row('Ukuran Kertas', settings.paperWidth === '80mm' ? '80 mm (42 Kol)' : '58 mm (32 Kol)') + '\n';
  out += row('Waktu Uji', `${dateStr} ${timeStr}`) + '\n';
  out += divider + '\n';
  out += center('TEST KARAKTER & ALINYEMEN') + '\n';
  out += dash + '\n';
  out += '1234567890\n';
  out += 'abcdefghijklmnopqrstuvwxyz\n';
  out += 'ABCDEFGHIJKLMNOPQRSTUVWXYZ\n';
  out += '!@#$%^&*()_+-=[]{};:,.<>/?\n';
  out += dash + '\n';
  out += row('Cutter Otomatis', settings.autoCut ? 'AKTIF (GS V)' : 'NONAKTIF') + '\n';
  out += row('Buka Laci Uang', settings.openCashDrawer ? 'AKTIF (ESC p)' : 'NONAKTIF') + '\n';
  out += divider + '\n';
  out += center('PRINTER SIAP DIGUNAKAN!') + '\n';
  out += center('*** HASUKA POS ***') + '\n';
  out += '\n\n';

  return printReceipt({
    paperWidth: settings.paperWidth,
    printerType: settings.printerType
  }, out);
};
