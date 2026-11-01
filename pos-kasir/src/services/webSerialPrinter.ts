/**
 * Web Serial Thermal Printer Service (ESC/POS over Bluetooth SPP / Virtual COM)
 * POS Hasuka Dimsum
 *
 * Mengendalikan printer thermal Bluetooth SPP (seperti RPP02N 58mm) via Web Serial API.
 * Fitur:
 * - Direct silent print via ESC/POS
 * - Timeout 5 detik pada port.open()
 * - Auto-reconnect jika tepat 1 port terdaftar
 * - Mutex antrean cetak agar tidak tumpang tindih
 * - Pencegahan InvalidStateError
 * - Pengiriman per chunk (default 256 byte, jeda 30ms) anti buffer-overflow
 * - Deteksi kegagalan parsial (partial: true) agar tidak mendobelkan struk
 */

export interface SerialDeviceInfo {
  name: string;
  usbVendorId?: number;
  usbProductId?: number;
}

export interface PrintOptions {
  paperWidth?: '58mm' | '80mm' | 'auto';
  autoCut?: boolean;
  openCashDrawer?: boolean;
  chunkSize?: number;
  chunkDelayMs?: number;
}

export type WebSerialStatus = 'connected' | 'disconnected' | 'connecting' | 'unsupported';

// Type shim untuk Web Serial API
interface SerialPort {
  open(options: { baudRate: number }): Promise<void>;
  close(): Promise<void>;
  readable: ReadableStream | null;
  writable: WritableStream | null;
  getInfo?(): { usbVendorId?: number; usbProductId?: number };
  addEventListener(type: string, listener: (ev: Event) => void): void;
  removeEventListener(type: string, listener: (ev: Event) => void): void;
}

class WebSerialPrinterService {
  private activePort: SerialPort | null = null;
  private portStatus: WebSerialStatus = 'disconnected';
  private portName: string = '';
  private printMutex: Promise<any> = Promise.resolve();
  private disconnectListenerAttached = false;
  private listeners: Array<(status: WebSerialStatus, name: string) => void> = [];

  constructor() {
    if (this.isSupported()) {
      this.attachGlobalListeners();
    }
  }

  public isSupported(): boolean {
    if (typeof navigator === 'undefined' || !('serial' in navigator)) {
      return false;
    }
    // Jika berjalan di dalam iframe (misal Web App Google Apps Script),
    // cek apakah permissionsPolicy secara eksplisit memblokir fitur serial
    if (typeof window !== 'undefined' && window.self !== window.top) {
      if (typeof document !== 'undefined' && (document as any).permissionsPolicy?.allowsFeature) {
        try {
          if (!(document as any).permissionsPolicy.allowsFeature('serial')) {
            return false;
          }
        } catch (e) {}
      }
    }
    return true;
  }

  public getStatus(): WebSerialStatus {
    if (!this.isSupported()) return 'unsupported';
    return this.portStatus;
  }

  public getPortName(): string {
    return this.portName || (this.portStatus === 'connected' ? 'RPP02N (Bluetooth COM)' : '');
  }

  public subscribe(fn: (status: WebSerialStatus, name: string) => void): () => void {
    this.listeners.push(fn);
    fn(this.getStatus(), this.getPortName());
    return () => {
      this.listeners = this.listeners.filter(l => l !== fn);
    };
  }

  private notify() {
    const s = this.getStatus();
    const n = this.getPortName();
    this.listeners.forEach(fn => {
      try { fn(s, n); } catch (e) {}
    });
  }

  private attachGlobalListeners() {
    if (this.disconnectListenerAttached || typeof navigator === 'undefined' || !('serial' in navigator)) return;
    try {
      (navigator as any).serial.addEventListener('disconnect', (event: any) => {
        if (event && event.target && event.target === this.activePort) {
          console.warn('[WebSerialPrinter] Port serial terputus secara fisik (Bluetooth/Kabel mati).');
          this.activePort = null;
          this.portStatus = 'disconnected';
          this.notify();
        }
      });
      this.disconnectListenerAttached = true;
    } catch (e) {
      console.warn('[WebSerialPrinter] Gagal memasang event listener disconnect:', e);
    }
  }

  /**
   * Buka port dengan perlindungan timeout 5 detik dan InvalidStateError
   */
  private async safeOpenPort(port: SerialPort, baudRate = 9600, timeoutMs = 5000): Promise<boolean> {
    // Jika port sudah terbuka (writable/readable aktif), lewati open() untuk mencegah InvalidStateError
    if (port.writable && port.readable) {
      return true;
    }

    const openPromise = port.open({ baudRate });
    const timeoutPromise = new Promise<never>((_, reject) => {
      setTimeout(() => reject(new Error('Waktu tunggu koneksi printer habis (Timeout 5 detik). Pastikan printer menyala dan dalam jangkauan Bluetooth.')), timeoutMs);
    });

    try {
      await Promise.race([openPromise, timeoutPromise]);
      return true;
    } catch (err: any) {
      const msg = err?.message || String(err);
      console.error('[WebSerialPrinter] Gagal membuka port serial:', msg);
      throw new Error(msg);
    }
  }

  /**
   * Minta izin port baru via dialog navigator.serial.requestPort()
   */
  public async requestAndConnect(baudRate = 9600): Promise<{ success: boolean; portName?: string; error?: string }> {
    if (!this.isSupported()) {
      const inIframe = typeof window !== 'undefined' && window.self !== window.top;
      return {
        success: false,
        error: inIframe
          ? 'Web Serial diblokir oleh sandbox iframe Google Apps Script. Silakan beralih ke mode "Driver Sistem (Browser)" di Pengaturan untuk mencetak.'
          : 'Web Serial API tidak didukung pada browser ini. Gunakan Google Chrome atau Microsoft Edge desktop.'
      };
    }

    try {
      this.portStatus = 'connecting';
      this.notify();

      // PENTING: Panggil requestPort() langsung saat klik user (User Gesture).
      // JANGAN jalankan await this.disconnect() sebelum requestPort() karena jeda asinkron
      // dapat membatalkan transient user activation di Chrome.
      const port = await (navigator as any).serial.requestPort();
      if (!port) {
        this.portStatus = 'disconnected';
        this.notify();
        return { success: false, error: 'Tidak ada port serial yang dipilih.' };
      }

      // Jika ada port lama yang sedang aktif, tutup setelah port baru berhasil dipilih
      if (this.activePort) {
        try {
          await this.disconnect();
        } catch (e) {
          console.warn('[WebSerialPrinter] Catatan saat menutup port lama:', e);
        }
      }

      await this.safeOpenPort(port, baudRate, 5000);
      this.activePort = port;
      this.portStatus = 'connected';
      this.portName = 'RPP02N (Bluetooth SPP)';
      try {
        localStorage.setItem('hasuka_printer_serial_configured', 'true');
      } catch (e) {}

      this.notify();
      return { success: true, portName: this.portName };
    } catch (err: any) {
      // Jika port lama masih valid dan user membatalkan dialog, pertahankan port lama
      if (this.activePort && this.activePort.readable && this.activePort.writable) {
        this.portStatus = 'connected';
      } else {
        this.activePort = null;
        this.portStatus = 'disconnected';
      }
      this.notify();

      const msg = err?.message || String(err);
      if (msg.toLowerCase().includes('cancelled') || msg.toLowerCase().includes('user cancelled') || err?.name === 'NotFoundError') {
        return { success: false, error: 'Pemilihan port dibatalkan oleh pengguna.' };
      }
      if (msg.toLowerCase().includes('current frame is not allowed') || msg.toLowerCase().includes('permissions policy') || err?.name === 'SecurityError') {
        return {
          success: false,
          error: 'Web Serial diblokir oleh sandbox iframe Google Apps Script. Silakan pilih opsi "Driver Sistem (Browser)" di Pengaturan untuk mencetak struk secara andal di web app ini.'
        };
      }
      if (msg.toLowerCase().includes('user gesture')) {
        return { success: false, error: 'Klik tombol Hubungkan Printer langsung untuk membuka jendela pemilihan perangkat.' };
      }
      return { success: false, error: msg };
    }
  }

  /**
   * Coba sambung ulang otomatis via navigator.serial.getPorts()
   * Aturan:
   * - Tepat 1 port terdaftar -> Langsung buka otomatis (timeout 5 detik)
   * - Lebih dari 1 port terdaftar -> JANGAN tebak, minta kasir memilih via tombol Hubungkan
   * - 0 port -> status disconnected
   */
  public async autoReconnect(baudRate = 9600): Promise<{ success: boolean; portName?: string; error?: string }> {
    if (!this.isSupported()) {
      return { success: false, error: 'Web Serial tidak didukung' };
    }

    if (this.portStatus === 'connected' && this.activePort?.writable) {
      return { success: true, portName: this.portName };
    }

    try {
      const ports: SerialPort[] = await (navigator as any).serial.getPorts();
      if (ports.length === 0) {
        this.portStatus = 'disconnected';
        this.notify();
        return { success: false, error: 'Belum ada printer Bluetooth/Serial yang pernah diizinkan.' };
      }

      if (ports.length > 1) {
        this.portStatus = 'disconnected';
        this.notify();
        return {
          success: false,
          error: `Ditemukan ${ports.length} port serial. Silakan klik "Hubungkan Printer" untuk memilih port COM yang tepat.`
        };
      }

      // Tepat 1 port terdaftar
      const port = ports[0];
      this.portStatus = 'connecting';
      this.notify();

      await this.safeOpenPort(port, baudRate, 5000);
      this.activePort = port;
      this.portStatus = 'connected';
      this.portName = 'RPP02N (Bluetooth SPP)';
      this.notify();
      return { success: true, portName: this.portName };
    } catch (err: any) {
      this.activePort = null;
      this.portStatus = 'disconnected';
      this.notify();
      return { success: false, error: err?.message || 'Gagal menyambung ulang port serial otomatis.' };
    }
  }

  public async disconnect(): Promise<void> {
    if (!this.activePort) {
      this.portStatus = 'disconnected';
      this.notify();
      return;
    }

    try {
      // Tunggu antrean cetak selesai jika ada
      await this.printMutex;
      if (this.activePort.writable) {
        await this.activePort.close();
      }
    } catch (e) {
      console.warn('[WebSerialPrinter] Catatan saat menutup port:', e);
    } finally {
      this.activePort = null;
      this.portStatus = 'disconnected';
      this.notify();
    }
  }

  /**
   * Konversi string teks ke format ESC/POS dengan penanganan karakter non-ASCII yang aman
   */
  public buildEscPosBytes(content: string, options: PrintOptions = {}): Uint8Array {
    const bytes: number[] = [];

    // 1. Inisialisasi printer (ESC @)
    bytes.push(0x1b, 0x40);

    // 2. Set Code Page ke PC437 / Standard (ESC t 0)
    bytes.push(0x1b, 0x74, 0x00);

    // 3. Set line spacing default (ESC 2)
    bytes.push(0x1b, 0x32);

    // Filter karakter non-ASCII: ganti dengan padanan ASCII atau '?'
    const sanitizeText = (txt: string): string => {
      return txt
        .replace(/[\u2018\u2019]/g, "'")
        .replace(/[\u201C\u201D]/g, '"')
        .replace(/[\u2013\u2014]/g, '-')
        .replace(/\u2022/g, '*')
        .replace(/\u00A0/g, ' ')
        .replace(/[^\x00-\x7F]/g, '?');
    };

    const cleanContent = sanitizeText(content);
    const lines = cleanContent.split('\n');

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];

      // Baris judul utama tebal
      if (line.includes('[ HASUKA DIMSUM ]') || line.includes('TOTAL AKHIR')) {
        bytes.push(0x1b, 0x45, 0x01); // Bold ON
        for (let c = 0; c < line.length; c++) bytes.push(line.charCodeAt(c));
        bytes.push(0x1b, 0x45, 0x00); // Bold OFF
      } else {
        for (let c = 0; c < line.length; c++) bytes.push(line.charCodeAt(c));
      }
      bytes.push(0x0a); // Line feed (LF)
    }

    // 4. Feed tambahan di akhir agar kertas melewati pisau sobek RPP02N (5 baris kosong)
    bytes.push(0x0a, 0x0a, 0x0a, 0x0a);

    // 5. Potong kertas jika aktif (GS V 0)
    if (options.autoCut) {
      bytes.push(0x1d, 0x56, 0x00);
    }

    // 6. Buka laci kasir jika aktif (ESC p 0 25 250)
    if (options.openCashDrawer) {
      bytes.push(0x1b, 0x70, 0x00, 0x19, 0xfa);
    }

    return new Uint8Array(bytes);
  }

  /**
   * Eksekusi cetak teks via antrean mutex dengan pengiriman per chunk (anti-overflow buffer)
   */
  public async printText(content: string, options: PrintOptions = {}): Promise<{ success: boolean; partial: boolean; error?: string }> {
    if (!this.isSupported()) {
      return { success: false, partial: false, error: 'Web Serial tidak didukung di browser ini.' };
    }

    // Antrekan eksekusi agar dua cetakan tidak berjalan bersamaan
    return new Promise((resolve) => {
      this.printMutex = this.printMutex.then(async () => {
        try {
          const res = await this.doPrintInternal(content, options);
          resolve(res);
        } catch (err: any) {
          resolve({ success: false, partial: false, error: err?.message || String(err) });
        }
      });
    });
  }

  private async doPrintInternal(content: string, options: PrintOptions): Promise<{ success: boolean; partial: boolean; error?: string }> {
    // Pastikan port terhubung
    if (!this.activePort || !this.activePort.writable) {
      const reconnectResult = await this.autoReconnect();
      if (!reconnectResult.success || !this.activePort || !this.activePort.writable) {
        return {
          success: false,
          partial: false,
          error: reconnectResult.error || 'Printer Bluetooth belum terhubung. Silakan buka menu Pengaturan dan klik "Hubungkan Printer".'
        };
      }
    }

    const bytes = this.buildEscPosBytes(content, options);
    const chunkSize = options.chunkSize && options.chunkSize > 0 ? options.chunkSize : 256;
    const chunkDelayMs = options.chunkDelayMs !== undefined ? options.chunkDelayMs : 30;

    let bytesSent = 0;
    let writer: any = null;

    try {
      writer = this.activePort.writable.getWriter();
    } catch (lockErr: any) {
      return {
        success: false,
        partial: false,
        error: 'Port printer sedang sibuk atau terkunci oleh proses lain. Coba beberapa saat lagi.'
      };
    }

    try {
      for (let offset = 0; offset < bytes.length; offset += chunkSize) {
        const chunk = bytes.subarray(offset, Math.min(offset + chunkSize, bytes.length));
        await writer.write(chunk);
        bytesSent += chunk.length;

        if (offset + chunkSize < bytes.length && chunkDelayMs > 0) {
          await new Promise(r => setTimeout(r, chunkDelayMs));
        }
      }

      return { success: true, partial: false };
    } catch (writeErr: any) {
      console.error('[WebSerialPrinter] Gagal mengirim data ke printer Bluetooth:', writeErr);
      const isPartial = bytesSent > 0;
      return {
        success: false,
        partial: isPartial,
        error: isPartial
          ? `Koneksi Bluetooth terputus saat mencetak (${bytesSent}/${bytes.length} byte terkirim). Jangan langsung cetak sistem agar tidak dobel; silakan periksa kertas/koneksi printer dan klik "Cetak Ulang".`
          : (writeErr?.message || 'Gagal mengirim data ke printer Bluetooth.')
      };
    } finally {
      try {
        if (writer) {
          writer.releaseLock();
        }
      } catch (e) {}
    }
  }

  /**
   * Mengirim sinyal buka laci kasir (Cash Drawer Kick) saja
   */
  public async openCashDrawer(): Promise<{ success: boolean; error?: string }> {
    if (!this.isSupported()) {
      return { success: false, error: 'Web Serial tidak didukung.' };
    }

    if (!this.activePort || !this.activePort.writable) {
      const recon = await this.autoReconnect();
      if (!recon.success || !this.activePort || !this.activePort.writable) {
        return { success: false, error: recon.error || 'Printer belum terhubung.' };
      }
    }

    // ESC p 0 25 250 (Buka pin laci 1) & ESC p 1 25 250 (Buka pin laci 2)
    const kickBytes = new Uint8Array([0x1b, 0x70, 0x00, 0x19, 0xfa, 0x1b, 0x70, 0x01, 0x19, 0xfa]);
    let writer: any = null;
    try {
      writer = this.activePort.writable.getWriter();
      await writer.write(kickBytes);
      return { success: true };
    } catch (e: any) {
      return { success: false, error: e?.message || 'Gagal membuka laci kasir.' };
    } finally {
      if (writer) {
        try { writer.releaseLock(); } catch (e) {}
      }
    }
  }
}

export const webSerialPrinter = new WebSerialPrinterService();
