import { invoke } from '@tauri-apps/api/core';

export interface PrinterConfig {
  ip: string;
  port: number;
}

export const printReceipt = async (config: PrinterConfig, content: string): Promise<boolean> => {
  try {
    const result = await invoke('print_receipt', { 
      ip: config.ip, 
      port: config.port, 
      content 
    });
    console.log('Printer response:', result);
    return true;
  } catch (error) {
    console.error('Failed to print receipt:', error);
    return false;
  }
};
