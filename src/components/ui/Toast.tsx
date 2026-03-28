'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { 
  CheckCircle2, 
  XCircle, 
  AlertCircle, 
  Info, 
  X 
} from 'lucide-react';

interface ToastProps {
  message: string;
  type: 'success' | 'error' | 'info' | 'warning';
  onClose: () => void;
}

const Toast = ({ message, type, onClose }: ToastProps) => {
  const config = {
    success: {
      icon: <CheckCircle2 className="w-5 h-5 text-emerald-400" />,
      bg: 'bg-emerald-500/10',
      border: 'border-emerald-500/20',
      glow: 'shadow-emerald-500/10'
    },
    error: {
      icon: <XCircle className="w-5 h-5 text-rose-400" />,
      bg: 'bg-rose-500/10',
      border: 'border-rose-500/20',
      glow: 'shadow-rose-500/10'
    },
    warning: {
      icon: <AlertCircle className="w-5 h-5 text-amber-400" />,
      bg: 'bg-amber-500/10',
      border: 'border-amber-500/20',
      glow: 'shadow-amber-500/10'
    },
    info: {
      icon: <Info className="w-5 h-5 text-[#6366f1]" />,
      bg: 'bg-indigo-500/10',
      border: 'border-indigo-500/20',
      glow: 'shadow-indigo-500/10'
    }
  };

  const { icon, bg, border, glow } = config[type];

  return (
    <motion.div
      initial={{ opacity: 0, y: -50, x: '-50%', scale: 0.9 }}
      animate={{ opacity: 1, y: 0, x: '-50%', scale: 1 }}
      exit={{ opacity: 0, y: -20, x: '-50%', scale: 0.9, transition: { duration: 0.2 } }}
      className={`fixed top-12 left-1/2 -translate-x-1/2 z-[9999] flex items-center gap-3 px-4 py-3 rounded-2xl border ${bg} ${border} backdrop-blur-md shadow-2xl ${glow} min-w-[300px] max-w-sm`}
    >
      <div className="flex-shrink-0">
        {icon}
      </div>
      
      <div className="flex-1 text-sm font-semibold text-white/90">
        {message}
      </div>

      <button 
        onClick={onClose}
        className="p-1 rounded-lg hover:bg-white/5 text-white/30 hover:text-white transition-colors"
      >
        <X size={14} />
      </button>

      {/* Progress bar timer */}
      <motion.div 
        initial={{ scaleX: 1 }}
        animate={{ scaleX: 0 }}
        transition={{ duration: 3, ease: 'linear' }}
        className={`absolute bottom-0 left-0 h-[2px] w-full origin-left bg-gradient-to-r from-transparent via-white/20 to-transparent`}
      />
    </motion.div>
  );
};

export default Toast;
