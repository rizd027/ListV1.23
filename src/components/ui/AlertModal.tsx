'use client';

import React, { useEffect, useState } from 'react';
import { AlertTriangle, X } from 'lucide-react';
import { useBackInterceptor } from '@/hooks/useBackInterceptor';

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
  useBackInterceptor(isOpen, onCancel, 'alertModal');
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

  const confirmBg = type === 'danger'
    ? 'bg-rose-600 hover:bg-rose-500'
    : type === 'warning'
    ? 'bg-amber-600 hover:bg-amber-500'
    : 'bg-indigo-600 hover:bg-indigo-500';

  const iconColor = type === 'danger' ? 'text-rose-400' : 'text-amber-400';

  return (
    <div
      className="fixed inset-0 z-[2000] flex items-center justify-center p-4"
      style={{
        pointerEvents: isOpen ? 'auto' : 'none',
        visibility: isOpen || visible ? 'visible' : 'hidden',
        transition: 'visibility 0s linear',
        transitionDelay: isOpen ? '0s' : '0.2s'
      }}
    >
      {/* Backdrop */}
      <div
        className="absolute inset-0 transition-opacity duration-200"
        style={{ background: 'rgba(0,0,0,0.65)', opacity: visible ? 1 : 0 }}
        onClick={onCancel}
      />

      {/* Panel */}
      <div
        className="relative w-full max-w-[320px] overflow-hidden transition-all duration-200"
        style={{
          background: '#0f1220',
          border: '1px solid rgba(255,255,255,0.06)',
          boxShadow: '0 16px 48px rgba(0,0,0,0.7)',
          borderRadius: '8px',
          opacity: visible ? 1 : 0,
          transform: visible ? 'scale(1) translateY(0)' : 'scale(0.96) translateY(8px)',
        }}
      >
        <button
          onClick={onCancel}
          className="absolute top-3 right-3 p-1.5 rounded text-gray-600 hover:text-white hover:bg-white/[0.05] transition-colors"
        >
          <X className="w-3.5 h-3.5" />
        </button>

        <div className="flex flex-col items-center text-center px-6 pt-8 pb-6">
          <div className={`mb-4 ${iconColor}`}>
            <AlertTriangle className="w-8 h-8" />
          </div>
          <h3 className="text-[15px] font-bold text-white mb-2">{title}</h3>
          <p className="text-[12px] text-gray-400 mb-6 leading-relaxed">{message}</p>

          <div className="flex w-full gap-2">
            <button
              onClick={onCancel}
              className="flex-1 h-9 rounded text-[12px] font-medium text-gray-400 hover:text-white bg-white/[0.03] border border-white/[0.06] hover:bg-white/[0.06] transition-colors"
            >
              {cancelText}
            </button>
            <button
              onClick={() => { onConfirm(); onCancel(); }}
              className={`flex-1 h-9 rounded text-[12px] font-semibold text-white transition-colors ${confirmBg}`}
            >
              {confirmText}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
