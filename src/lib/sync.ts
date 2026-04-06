import { saveFilmData, deleteFilmData, Film } from './api';

export type SyncActionType = 'add' | 'edit' | 'delete';

// Data yang disimpan di offline queue
export interface SyncAction {
  queueId: string;
  type: SyncActionType;
  timestamp: number;
  data?: any;       // data Film penuh untuk add/edit
  rowIndex?: number; // untuk edit/delete film lama
  tempId?: number;  // jika menghapus/edit film yang belum sinkron (buatan lokal)
}

const QUEUE_KEY = 'film_offline_queue';

// Mengambil antrean
export function getOfflineQueue(): SyncAction[] {
  if (typeof window === 'undefined') return [];
  const q = localStorage.getItem(QUEUE_KEY);
  return q ? JSON.parse(q) : [];
}

// Menyimpan antrean
export function setOfflineQueue(queue: SyncAction[]) {
  if (typeof window !== 'undefined') {
    localStorage.setItem(QUEUE_KEY, JSON.stringify(queue));
  }
}

// Menghapus antrean seluruhnya
export function clearOfflineQueue() {
  if (typeof window !== 'undefined') {
    localStorage.removeItem(QUEUE_KEY);
  }
}

// Mengeksekusi seluruh antrean (sinkronisasi)
export async function syncOfflineData(user: string, pass: string, onProgress?: (msg: string) => void): Promise<boolean> {
  const queue = getOfflineQueue();
  if (queue.length === 0) return true; // Tidak ada yang perlu disinkronisasi

  // Proses satu-persatu berurutan agar aman (database google sheets)
  for (let i = 0; i < queue.length; i++) {
    const action = queue[i];
    if (onProgress) onProgress(`Menyinkronkan item ${i + 1} dari ${queue.length}...`);
    try {
      if (action.type === 'add' && action.data) {
        // App Script mendeteksi action 'add', ID tidak perlu persis sama dengan tempId.
        await saveFilmData(action.data, 'add', user, pass);
      } else if (action.type === 'edit') {
        if (action.rowIndex && action.data) {
          // Edit data yang berasal dari server
          await saveFilmData({ ...action.data, rowIndex: action.rowIndex }, 'edit', user, pass);
        } else {
          // Jika edit tapi tidak ada rowIndex (berarti edit item add yang belum tersinkronisasi)
          // Berdasarkan desain queue gabungan, sebetulnya ini tidak mungkin kalau kita sudah me-_merge_ queue di lokal.
          // Jadi kita anggap valid 'add' jika tidak ada rowIndex.
          if (action.data) {
             await saveFilmData(action.data, 'add', user, pass);
          }
        }
      } else if (action.type === 'delete') {
        if (action.rowIndex) {
          await deleteFilmData(action.rowIndex, user, pass);
        }
      }
    } catch (error) {
      console.error('Sync failed for item', action, error);
      // Stop syncing to prevent data corruption queue.
      // Keep remaining items in queue.
      setOfflineQueue(queue.slice(i));
      return false; // Sync terhenti karena error
    }
  }

  // Jika semua berhasil
  clearOfflineQueue();
  return true;
}

// ===========================================
// Manipulasi Antrean Lokal
// ===========================================

export function pushOfflineAction(newAction: Omit<SyncAction, 'queueId' | 'timestamp'>) {
  const queue = getOfflineQueue();
  const timestamp = Date.now();
  const queueId = timestamp.toString(36) + Math.random().toString(36).substring(2);

  // LOGIC PENGGABUNGAN (MERGE):
  // Jika ini adalah action EDIT atau DELETE terhadap data buatan lokal (add)
  // yang BELUM terkirim (belum punya rowIndex, melainkan tempId).
  
  if (newAction.type === 'edit' && newAction.tempId && !newAction.rowIndex) {
    // Cari aksi 'add' sebelumnya dengan tempId yang sama
    const existingAddIndex = queue.findIndex(q => q.type === 'add' && q.data?.id === newAction.tempId);
    if (existingAddIndex !== -1) {
      // Perbarui datanya saja, tidak perlu menambah aksi 'edit' terpisah
      queue[existingAddIndex].data = { ...queue[existingAddIndex].data, ...newAction.data };
      setOfflineQueue(queue);
      return;
    }
  }

  if (newAction.type === 'delete' && newAction.tempId && !newAction.rowIndex) {
     // Menghapus data buatan lokal yang belum tersinkron. Batal tambahkan!
     const filteredQueue = queue.filter(q => !(q.type === 'add' && q.data?.id === newAction.tempId));
     setOfflineQueue(filteredQueue);
     return;
  }

  // Tambahkan aksi ke antrean
  queue.push({
    ...newAction,
    queueId,
    timestamp
  });

  setOfflineQueue(queue);
}
