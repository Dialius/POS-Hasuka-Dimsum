import { getPendingOutbox, markOutboxSynced, updateMasterData } from './db';
import { gasApi } from './gasApi';

let isSyncing = false;
let syncInterval: ReturnType<typeof setInterval> | null = null;

export const startSyncWorker = (intervalMs: number = 30000) => {
  if (syncInterval) {
    clearInterval(syncInterval);
  }
  
  // Run immediately once
  sync();
  
  // Then schedule
  syncInterval = setInterval(() => {
    sync();
  }, intervalMs);
};

export const stopSyncWorker = () => {
  if (syncInterval) {
    clearInterval(syncInterval);
    syncInterval = null;
  }
};

export const sync = async () => {
  if (isSyncing) return;
  if (!navigator.onLine) {
    console.log('[SyncWorker] Offline, skipping sync.');
    return;
  }
  
  isSyncing = true;
  try {
    // 1. Push Pending Outbox
    const pendingItems = await getPendingOutbox();
    if (pendingItems.length > 0) {
      console.log(`[SyncWorker] Pushing ${pendingItems.length} items to GAS`);
      
      // We can push them in batch or one by one. For now, let's push sequentially 
      // or implement a new batch endpoint in Apps Script.
      // Assuming gasApi.postAction can handle them. Let's push one by one for safety 
      // if batch isn't supported yet, or better, we modify gasApi to send batch.
      
      // Based on PRD we should use batch endpoint. 
      // We will assume `syncPush` action exists in GAS.
      const payloads = pendingItems.map(item => ({
        client_generated_id: item.client_generated_id,
        action: item.action,
        data: JSON.parse(item.payload)
      }));
      
      const response = await gasApi.postAction('syncPush', { batch: payloads });
      
      if (response && response.status === 'success') {
        const syncedIds = response.synced_ids || [];
        for (const id of syncedIds) {
          await markOutboxSynced(id);
        }
      } else {
        console.warn('[SyncWorker] Push failed:', response);
      }
    }
    
    // 2. Pull Master Data
    console.log('[SyncWorker] Pulling master data...');
    // We can use getInitialData
    const masterData = await gasApi.getInitialData();
    if (masterData) {
      await updateMasterData(masterData);
      console.log('[SyncWorker] Master data updated locally.');
    }
    
  } catch (error) {
    console.error('[SyncWorker] Sync error:', error);
  } finally {
    isSyncing = false;
  }
};
