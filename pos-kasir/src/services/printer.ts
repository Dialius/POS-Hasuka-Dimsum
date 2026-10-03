export interface PrinterConfig {
  ip?: string;
  port?: number;
  paperWidth?: '58mm' | '80mm' | 'auto';
}

export interface PrinterSettingsConfig {
  printerType: 'auto_device' | 'browser' | 'network' | 'bluetooth';
  printerName: string;
  ip: string;
  port: number;
  paperWidth: '58mm' | '80mm' | 'auto';
  autoCut: boolean;
  openCashDrawer: boolean;
  autoPrintOnCheckout: boolean;
}

export const detectDevicePlatform = () => {
  if (typeof window === 'undefined') {
    return {
      os: 'Perangkat Sistem',
      isMobile: false,
      recommendedPaper: '80mm' as const,
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
    recommendedPaper: isMobile ? ('58mm' as const) : ('80mm' as const),
    description: isMobile
      ? `${os} • Mendukung Thermal Bluetooth & Android Print Service`
      : `${os} • Terdeteksi Driver Printer Sistem (USB / Spooler Windows)`
  };
};

export const DEFAULT_PRINTER_SETTINGS: PrinterSettingsConfig = {
  printerType: 'auto_device',
  printerName: 'Printer Bawaan Perangkat (Otomatis)',
  ip: '192.168.1.200',
  port: 9100,
  paperWidth: 'auto',
  autoCut: true,
  openCashDrawer: false,
  autoPrintOnCheckout: false
};

export const getStoredPrinterSettings = (): PrinterSettingsConfig => {
  try {
    const raw = localStorage.getItem('hasuka_printer_settings');
    if (raw) {
      const parsed = JSON.parse(raw);
      // Hapus field legacy copies jika ada
      delete (parsed as any).copies;
      return { ...DEFAULT_PRINTER_SETTINGS, ...parsed };
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
 * Cetak thermal receipt via iframe terisolasi (Web / Browser / PWA / GAS)
 * Otomatis beradaptasi dengan ukuran printer (58mm / 80mm / auto)
 */
export const printThermalReceiptWeb = (content: string, paperWidth: '58mm' | '80mm' | 'auto' = 'auto'): Promise<boolean> => {
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

      // Deteksi otomatis jika 'auto': layar kecil (<768px) pakai 58mm, desktop/POS pakai 80mm
      const is58 = paperWidth === '58mm' || (paperWidth === 'auto' && typeof window !== 'undefined' && window.innerWidth < 768);
      const is80 = paperWidth === '80mm';
      const widthMm = is58 ? '58mm' : (is80 ? '80mm' : 'auto');
      const maxChar = is58 ? '32ch' : '42ch';

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
              size: ${widthMm === 'auto' ? 'auto' : `${widthMm} auto`};
              margin: 0mm;
            }
            @media print {
              html, body {
                width: 100% !important;
                max-width: ${widthMm === 'auto' ? '100%' : widthMm} !important;
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

export const printReceipt = async (config: PrinterConfig, content: string): Promise<boolean> => {
  if (isTauriEnvironment()) {
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

  // Pure Web Browser / Fallback
  if (typeof window !== 'undefined') {
    return printThermalReceiptWeb(content, config.paperWidth || 'auto');
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
  const is58 = settings.paperWidth === '58mm' || (settings.paperWidth === 'auto' && typeof window !== 'undefined' && window.innerWidth < 768);
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
  out += row('Tipe Printer', settings.printerType === 'network' ? 'Network (ESC/POS)' : (settings.printerType === 'bluetooth' ? 'Bluetooth POS' : 'Printer Driver Sistem')) + '\n';
  out += row('Nama Device', settings.printerName || 'POS Thermal') + '\n';
  if (settings.printerType === 'network') {
    out += row('IP:Port', `${settings.ip}:${settings.port}`) + '\n';
  }
  out += row('Ukuran Kertas', settings.paperWidth === '58mm' ? '58 mm (32 Kol)' : (settings.paperWidth === '80mm' ? '80 mm (42 Kol)' : 'Auto Adaptif')) + '\n';
  out += row('Waktu Uji', `${dateStr} ${timeStr}`) + '\n';
  out += divider + '\n';
  out += center('TEST KARAKTER & ALINYEMEN') + '\n';
  out += dash + '\n';
  out += '1234567890\n';
  out += 'abcdefghijklmnopqrstuvwxyz\n';
  out += 'ABCDEFGHIJKLMNOPQRSTUVWXYZ\n';
  out += '!@#$%^&*()_+-=[]{};:,.<>/?\n';
  out += dash + '\n';
  out += row('Cutter Otomatis', settings.autoCut ? 'AKTIF' : 'NONAKTIF') + '\n';
  out += row('Buka Laci Uang', settings.openCashDrawer ? 'AKTIF' : 'NONAKTIF') + '\n';
  out += divider + '\n';
  out += center('PRINTER SIAP DIGUNAKAN!') + '\n';
  out += center('*** HASUKA POS ***') + '\n';
  out += '\n\n';

  return printReceipt({
    paperWidth: settings.paperWidth,
    ip: settings.ip,
    port: settings.port
  }, out);
};
