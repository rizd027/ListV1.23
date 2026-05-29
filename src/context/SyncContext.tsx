'use client';

import React, { createContext, useContext, useEffect, useRef, useState, useCallback } from 'react';
import { syncOfflineData, getOfflineQueue } from '@/lib/sync';
import { useToast } from '@/context/ToastContext';

interface SyncState {
  isSyncing: boolean;
  pendingCount: number;
  lastSyncAt: Date | null;
  isOnline: boolean;
}

interface SyncContextValue extends SyncState {
  triggerSync: () => Promise<void>;
}

const SyncContext = createContext<SyncContextValue | null>(null);

export function useSyncEngine() {
  const ctx = useContext(SyncContext);
  if (!ctx) throw new Error('useSyncEngine must be used within SyncProvider');
  return ctx;
}

export function SyncProvider({ children }: { children: React.ReactNode }) {
  const { showToast } = useToast();
  const [isSyncing, setIsSyncing] = useState(false);
  const [pendingCount, setPendingCount] = useState(0);
  const [lastSyncAt, setLastSyncAt] = useState<Date | null>(null);
  const [isOnline, setIsOnline] = useState(
    typeof navigator !== 'undefined' ? navigator.onLine : true
  );
  const syncLockRef = useRef(false); // Prevent concurrent syncs

  // Update pending count from queue
  const refreshPendingCount = useCallback(() => {
    if (typeof window === 'undefined') return;
    const queue = getOfflineQueue();
    setPendingCount(queue.length);
  }, []);

  // Main sync function
  const triggerSync = useCallback(async () => {
    if (typeof window === 'undefined') return;
    if (syncLockRef.current) return; // Already syncing
    if (!navigator.onLine) return; // Offline, skip

    const queue = getOfflineQueue();
    if (queue.length === 0) {
      refreshPendingCount();
      return;
    }

    const user = localStorage.getItem('film_username');
    const pass = localStorage.getItem('film_password');
    if (!user || !pass) return;

    syncLockRef.current = true;
    setIsSyncing(true);

    try {
      const success = await syncOfflineData(user, pass, (msg) => {
        console.log('[SyncEngine]', msg);
      });

      if (success) {
        setLastSyncAt(new Date());
        refreshPendingCount();
        const syncedCount = queue.length;
        if (syncedCount > 0) {
          showToast(`✅ ${syncedCount} perubahan berhasil disinkronkan!`, 'success');
        }
      } else {
        showToast('⚠️ Sebagian data gagal sync, mencoba lagi nanti...', 'error');
        refreshPendingCount();
      }
    } catch (err) {
      console.error('[SyncEngine] Unexpected error:', err);
      showToast('❌ Sync gagal, periksa koneksi Anda.', 'error');
    } finally {
      syncLockRef.current = false;
      setIsSyncing(false);
    }
  }, [refreshPendingCount, showToast]);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    // Initial count
    refreshPendingCount();

    // Online/offline listeners
    const handleOnline = () => {
      setIsOnline(true);
      showToast('🌐 Koneksi kembali! Menyinkronkan data...', 'success');
      // Small delay to let network stabilize
      setTimeout(() => triggerSync(), 1500);
    };

    const handleOffline = () => {
      setIsOnline(false);
      showToast('📴 Offline — perubahan akan disimpan lokal', 'error');
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Try sync on mount (in case there are pending items from last session)
    const mountTimer = setTimeout(() => triggerSync(), 3000);

    // Periodic sync every 5 minutes
    const intervalId = setInterval(() => triggerSync(), 5 * 60 * 1000);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      clearTimeout(mountTimer);
      clearInterval(intervalId);
    };
  }, [triggerSync, refreshPendingCount, showToast]);

  return (
    <SyncContext.Provider value={{ isSyncing, pendingCount, lastSyncAt, isOnline, triggerSync }}>
      {children}
    </SyncContext.Provider>
  );
}
