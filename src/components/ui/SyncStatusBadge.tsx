'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { Cloud, CloudOff, RefreshCw, CheckCircle2 } from 'lucide-react';
import { useSyncEngine } from '@/context/SyncContext';

export function SyncStatusBadge() {
  const { isSyncing, pendingCount, isOnline } = useSyncEngine();

  if (isOnline && !isSyncing && pendingCount === 0) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, x: 20, scale: 0.9 }}
        animate={{ opacity: 1, x: 0, scale: 1 }}
        exit={{ opacity: 0, x: 20, scale: 0.9 }}
        transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
        className="flex items-center gap-2 px-2.5 py-1.5 rounded-xl text-[10px] md:text-[11px] font-semibold border"
        style={
          !isOnline
            ? {
                background: 'rgba(239,68,68,0.08)',
                borderColor: 'rgba(239,68,68,0.2)',
                color: '#f87171',
              }
            : isSyncing
            ? {
                background: 'rgba(99,102,241,0.08)',
                borderColor: 'rgba(99,102,241,0.2)',
                color: '#a5b4fc',
              }
            : pendingCount > 0
            ? {
                background: 'rgba(234,179,8,0.08)',
                borderColor: 'rgba(234,179,8,0.2)',
                color: '#fbbf24',
              }
            : {
                background: 'rgba(34,197,94,0.08)',
                borderColor: 'rgba(34,197,94,0.2)',
                color: '#4ade80',
              }
        }
      >
        {!isOnline ? (
          <>
            <CloudOff className="w-3 h-3 flex-none" />
            <span className="hidden sm:inline">Offline</span>
          </>
        ) : isSyncing ? (
          <>
            <RefreshCw className="w-3 h-3 flex-none animate-spin" />
            <span className="hidden sm:inline">Menyinkronkan...</span>
          </>
        ) : pendingCount > 0 ? (
          <>
            <Cloud className="w-3 h-3 flex-none" />
            <span>{pendingCount} tertunda</span>
          </>
        ) : (
          <>
            <CheckCircle2 className="w-3 h-3 flex-none" />
            <span className="hidden sm:inline">Tersinkron</span>
          </>
        )}
      </motion.div>
    </AnimatePresence>
  );
}
