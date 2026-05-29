'use client';

import { useEffect } from 'react';

export function ServiceWorkerRegistrar() {
  useEffect(() => {
    if (typeof window === 'undefined') return;
    console.log('[SW] Registrar: Initializing...', {
      isSecureContext: typeof window !== 'undefined' ? window.isSecureContext : undefined,
      hasServiceWorker: 'serviceWorker' in navigator,
      nodeEnv: process.env.NODE_ENV
    });

    if (!('serviceWorker' in navigator)) {
      console.warn('[SW] Registrar: Service workers are not supported by this browser or context (requires HTTPS or localhost).');
      return;
    }
    if (process.env.NODE_ENV === 'development') {
      console.log('[SW] Registrar: Disabled in development mode.');
      return;
    }

    navigator.serviceWorker
      .register('/sw.js', { scope: '/' })
      .then((registration) => {
        console.log('[SW] Registered:', registration.scope);

        // Auto-update: cek update setiap kali user buka halaman
        registration.addEventListener('updatefound', () => {
          const newWorker = registration.installing;
          if (!newWorker) return;
          newWorker.addEventListener('statechange', () => {
            if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
              // SW baru sudah siap — skip waiting untuk aktivasi langsung
              newWorker.postMessage({ type: 'SKIP_WAITING' });
            }
          });
        });
      })
      .catch((err) => {
        console.error('[SW] Registration failed:', err);
      });

    // Reload halaman saat SW baru aktif
    let refreshing = false;
    navigator.serviceWorker.addEventListener('controllerchange', () => {
      if (!refreshing) {
        refreshing = true;
        window.location.reload();
      }
    });
  }, []);

  return null;
}
