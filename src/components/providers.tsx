'use client';

import { ToastProvider } from '@/context/ToastContext';
import { SyncProvider } from '@/context/SyncContext';
import { ServiceWorkerRegistrar } from '@/components/ServiceWorkerRegistrar';

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <ToastProvider>
      <SyncProvider>
        <ServiceWorkerRegistrar />
        {children}
      </SyncProvider>
    </ToastProvider>
  );
}

