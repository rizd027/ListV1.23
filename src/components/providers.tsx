'use client';

import { MotionConfig } from 'framer-motion';
import { ToastProvider } from '@/context/ToastContext';
import { SyncProvider } from '@/context/SyncContext';
import { ServiceWorkerRegistrar } from '@/components/ServiceWorkerRegistrar';

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <MotionConfig reducedMotion="user">
      <ToastProvider>
        <SyncProvider>
          <ServiceWorkerRegistrar />
          {children}
        </SyncProvider>
      </ToastProvider>
    </MotionConfig>
  );
}

