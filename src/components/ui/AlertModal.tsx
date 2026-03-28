'use client';

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
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
  isOpen,
  title,
  message,
  onConfirm,
  onCancel,
  confirmText = 'Hapus',
  cancelText = 'Batal',
  type = 'danger'
}: AlertModalProps) => {
  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[100] flex items-start justify-center p-4 pt-24 md:pt-32">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={onCancel}
          />
          
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: -20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: -20 }}
            className="relative w-full max-w-sm bg-[#0f141f] border border-white/5 rounded-3xl p-6 shadow-2xl overflow-hidden"
          >
            {/* Background Glow */}
            <div className={`absolute -top-24 -right-24 w-48 h-48 blur-[80px] opacity-20 pointer-events-none
              ${type === 'danger' ? 'bg-rose-500' : type === 'warning' ? 'bg-amber-500' : 'bg-indigo-500'}`} 
            />

            <div className="flex flex-col items-center text-center">
              <div className={`p-4 rounded-2xl mb-4 ${type === 'danger' ? 'bg-rose-500/10 text-rose-500' : 'bg-amber-500/10 text-amber-500'}`}>
                <AlertCircle size={32} />
              </div>
              
              <h3 className="text-xl font-black text-white mb-2">{title}</h3>
              <p className="text-sm font-medium text-gray-400 mb-8 leading-relaxed">
                {message}
              </p>
              
              <div className="flex w-full gap-3">
                <button
                  onClick={onCancel}
                  className="flex-1 h-12 rounded-2xl bg-white/5 border border-white/5 text-sm font-bold text-gray-400 hover:bg-white/10 hover:text-white transition-all"
                >
                  {cancelText}
                </button>
                <button
                  onClick={() => {
                    onConfirm();
                    onCancel();
                  }}
                  className={`flex-1 h-12 rounded-2xl text-sm font-bold text-white transition-all shadow-lg
                    ${type === 'danger' ? 'bg-gradient-to-r from-rose-600 to-red-600 hover:from-rose-500 hover:to-red-500 shadow-rose-900/20' : 
                      'bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 shadow-indigo-900/20'}`}
                >
                  {confirmText}
                </button>
              </div>
            </div>

            <button 
              onClick={onCancel}
              className="absolute top-4 right-4 p-2 rounded-xl text-gray-600 hover:text-white hover:bg-white/5 transition-all"
            >
              <X size={20} />
            </button>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
