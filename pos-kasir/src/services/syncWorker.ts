import { getPendingOutbox, markOutboxSynced, updateMasterData } from './db';
import { gasApi } from './gasApi';

let isSyncing = false;
let syncInterval: ReturnType<typeof setInterval> | null = null;
let onlineHandler: (() => void) | null = null;

export const startSyncWorker = (intervalMs: number = 30000) => {
  if (syncInterval) {
    clearInterval(syncInterval);
  }
  
  // Run immediately once
  sync();
  
  // Schedule recurring sync
  syncInterval = setInterval(() => {
    sync();
  }, intervalMs);

  // Auto sync as soon as internet connection is restored
  if (typeof window !== 'undefined' && !onlineHandler) {
    onlineHandler = () => {
      console.log('[SyncWorker] Internet terhubung kembali, memicu sinkronisasi...');
      sync();
    };
    window.addEventListener('online', onlineHandler);
  }
};

export const stopSyncWorker = () => {
  if (syncInterval) {
    clearInterval(syncInterval);
    syncInterval = null;
  }
  if (typeof window !== 'undefined' && onlineHandler) {
    window.removeEventListener('online', onlineHandler);
    onlineHandler = null;
  }
};

export const sync = async () => {
  if (isSyncing) return;
  if (typeof navigator !== 'undefined' && !navigator.onLine) {
    console.log('[SyncWorker] Mode offline, sinkronisasi ditunda.');
    return;
  }
  
  isSyncing = true;
  try {
    // 1. Push Pending Outbox
    const pendingItems = await getPendingOutbox();
    if (pendingItems.length > 0) {
      console.log(`[SyncWorker] Mengirim ${pendingItems.length} antrean offline ke Google Sheets...`);
      
      const payloads = pendingItems.map((item: any) => {
        let parsedData = item.payload;
        if (typeof parsedData === 'string') {
          try {
            parsedData = JSON.parse(parsedData);
          } catch (e) {
            console.error('[SyncWorker] Gagal parse JSON payload:', item.client_generated_id, e);
          }
        }
        return {
          client_generated_id: item.client_generated_id,
          action: item.action,
          data: parsedData
        };
      });
      
      const response = await gasApi.postAction('syncPush', { batch: payloads });
      
      if (response && (response.status === 'success' || response.synced_ids)) {
        const syncedIds: string[] = response.synced_ids || [];
        for (const id of syncedIds) {
          await markOutboxSynced(id);
        }
        console.log(`[SyncWorker] Berhasil menyinkronkan ${syncedIds.length} item.`);
        
        // Beritahu frontend bahwa antrean telah berhasil terkirim
        if (typeof window !== 'undefined' && syncedIds.length > 0) {
          window.dispatchEvent(new CustomEvent('hasuka_sync_completed', { detail: { count: syncedIds.length } }));
        }
      } else {
        console.warn('[SyncWorker] Gagal sync push:', response);
      }
    }
    
    // 2. Pull Master Data
    console.log('[SyncWorker] Memperbarui master data...');
    const masterData = await gasApi.getInitialData();
    if (masterData) {
      await updateMasterData(masterData);
      console.log('[SyncWorker] Master data lokal berhasil diperbarui.');
    }
    
  } catch (error) {
    console.error('[SyncWorker] Sync error:', error);
  } finally {
    isSyncing = false;
  }
};
