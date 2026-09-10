export interface PrinterConfig {
  ip?: string;
  port?: number;
}

export const isTauriEnvironment = (): boolean => {
  return typeof window !== 'undefined' && '__TAURI_INTERNALS__' in window;
};

export const printReceipt = async (config: PrinterConfig, content: string): Promise<boolean> => {
  if (isTauriEnvironment()) {
    try {
      const { invoke } = await import('@tauri-apps/api/core');
      const result = await invoke('print_receipt', { 
        ip: config.ip || '', 
        port: config.port || 9100, 
        content 
      });
      console.log('Printer response (Tauri):', result);
      return true;
    } catch (error) {
      console.error('Failed to print receipt via Tauri:', error);
    }
  }

  // Fallback for Pure Web Browser
  if (typeof window !== 'undefined') {
    try {
      window.print();
      return true;
    } catch (err) {
      console.error('Browser print error:', err);
      return false;
    }
  }

  return false;
};

