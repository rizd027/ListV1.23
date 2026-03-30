'use client';

import React, { useEffect, useState } from 'react';
import { AlertCircle, X } from 'lucide-react';

interface AlertModalProps {
  isOpen: boolean;
  title: string;
  message: string;
  onConfirm: () => void;
  onCancel: () => void;
  confirmText?: string;
  cancelText?: string;
  type?: 'danger' | 'warning' | 'info';
}

export const AlertModal = ({
  isOpen, title, message, onConfirm, onCancel,
  confirmText = 'Hapus', cancelText = 'Batal', type = 'danger'
}: AlertModalProps) => {
  const [visible, setVisible] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => { setMounted(true); }, []);

  useEffect(() => {
    if (isOpen) {
      const t = setTimeout(() => setVisible(true), 10);
      return () => clearTimeout(t);
    } else {
      setVisible(false);
    }
  }, [isOpen]);

  if (!mounted) return null;

  const confirmColor = type === 'danger'
    ? 'bg-rose-600 hover:bg-rose-500'
    : type === 'warning'
    ? 'bg-amber-600 hover:bg-amber-500'
    : 'bg-indigo-600 hover:bg-indigo-500';

  const iconColor = type === 'danger' ? 'bg-rose-500/10 text-rose-500' : 'bg-amber-500/10 text-amber-500';

  return (
    <div
      className="fixed inset-0 z-[2000] flex items-center justify-center p-4"
      style={{
        pointerEvents: isOpen ? 'auto' : 'none',
        visibility: isOpen || visible ? 'visible' : 'hidden', // to hide focus correctly
        transition: 'visibility 0s linear',
        transitionDelay: isOpen ? '0s' : '0.2s' // delay hide by 200ms when closing
      }}
    >
      {/* Backdrop — dark only, no blur */}
      <div
        className="absolute inset-0 transition-opacity duration-200"
        style={{ background: 'rgba(0,0,0,0.7)', opacity: visible ? 1 : 0 }}
        onClick={onCancel}
      />

      {/* Panel */}
      <div
        className="relative w-full max-w-[340px] rounded-2xl overflow-hidden transition-all duration-200"
        style={{
          background: '#0f1220',
          border: '1px solid rgba(255,255,255,0.06)',
          boxShadow: '0 20px 48px rgba(0,0,0,0.7)',
          opacity: visible ? 1 : 0,
          transform: visible ? 'scale(1) translateY(0)' : 'scale(0.95) translateY(8px)',
        }}
      >
        <button
          onClick={onCancel}
          className="absolute top-3 right-3 p-1.5 rounded-lg text-gray-600 hover:text-white hover:bg-white/[0.06] transition-colors"
        >
          <X className="w-4 h-4" />
        </button>

        <div className="flex flex-col items-center text-center px-6 pt-8 pb-6">
          <div className={`p-3.5 rounded-2xl mb-4 ${iconColor}`}>
            <AlertCircle className="w-7 h-7" />
          </div>
          <h3 className="text-lg font-black text-white mb-2">{title}</h3>
          <p className="text-sm text-gray-400 mb-6 leading-relaxed">{message}</p>

          <div className="flex w-full gap-2.5">
            <button
              onClick={onCancel}
              className="flex-1 h-10 rounded-xl bg-white/[0.04] border border-white/[0.06] text-sm font-semibold text-gray-400 hover:text-white hover:bg-white/[0.08] transition-colors"
            >
              {cancelText}
            </button>
            <button
              onClick={() => { onConfirm(); onCancel(); }}
              className={`flex-1 h-10 rounded-xl text-sm font-bold text-white transition-colors ${confirmColor}`}
            >
              {confirmText}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
