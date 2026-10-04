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
        className="relative w-full max-w-[340px] overflow-hidden transition-all duration-200"
        style={{
          background: '#0d1326',
          border: '1px solid rgba(255,255,255,0.14)',
          boxShadow: '0 24px 64px rgba(0,0,0,0.9), 0 0 1px 1px rgba(255,255,255,0.06)',
          borderRadius: '14px',
          opacity: visible ? 1 : 0,
          transform: visible ? 'scale(1) translateY(0)' : 'scale(0.96) translateY(8px)',
        }}
      >
        <button
          onClick={onCancel}
          className="absolute top-3 right-3 p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/[0.08] transition-colors"
        >
          <X className="w-4 h-4" />
        </button>

        <div className="flex flex-col items-center text-center px-6 pt-8 pb-6">
          <div className={`mb-4 ${iconColor} p-3 rounded-full bg-white/[0.04] border border-white/[0.08]`}>
            <AlertTriangle className="w-8 h-8" />
          </div>
          <h3 className="text-base font-bold text-white mb-2">{title}</h3>
          <p className="text-[13px] text-slate-300 mb-6 leading-relaxed">{message}</p>

          <div className="flex w-full gap-2.5">
            <button
              onClick={onCancel}
              className="flex-1 h-10 rounded-xl text-[13px] font-semibold text-slate-200 hover:text-white bg-[#141c33] border border-white/[0.12] hover:bg-[#1a2544] transition-colors"
            >
              {cancelText}
            </button>
            <button
              onClick={() => { onConfirm(); onCancel(); }}
              className={`flex-1 h-10 rounded-xl text-[13px] font-bold text-white transition-all shadow-md active:scale-95 ${confirmBg}`}
            >
              {confirmText}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
