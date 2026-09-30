'use client';

import { createContext, useContext, useState, useCallback, ReactNode, useRef } from 'react';
import { AnimatePresence } from 'framer-motion';
import Toast from '@/components/ui/Toast';

type ToastType = 'success' | 'error' | 'info' | 'warning';

interface ToastContextType {
  showToast: (message: string, type?: ToastType) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export const ToastProvider = ({ children }: { children: ReactNode }) => {
  const [toast, setToast] = useState<{ message: string; type: ToastType; id: number } | null>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const showToast = useCallback((message: string, type: ToastType = 'info') => {
    // Cancel any pending auto-dismiss
    if (timerRef.current) clearTimeout(timerRef.current);

    // Strip emoji from message (handled in Toast component too, but clean here too)
    const clean = message.replace(/^[\u{1F300}-\u{1F9FF}🌐📴✅❌⚠️✨\s]+/u, '').trim();

    setToast({ message: clean, type, id: Date.now() });
    timerRef.current = setTimeout(() => setToast(null), 3000);
  }, []);

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      <AnimatePresence>
        {toast && (
          <Toast
            key={toast.id}
            message={toast.message}
            type={toast.type}
            onClose={() => {
              if (timerRef.current) clearTimeout(timerRef.current);
              setToast(null);
            }}
          />
        )}
      </AnimatePresence>
    </ToastContext.Provider>
  );
};

export const useToast = () => {
  const context = useContext(ToastContext);
  if (!context) throw new Error('useToast must be used within a ToastProvider');
  return context;
};
