import { motion } from 'framer-motion';
import { 
  Check, 
  X, 
  AlertTriangle, 
  Info 
} from 'lucide-react';

interface ToastProps {
  message: string;
  type: 'success' | 'error' | 'info' | 'warning';
  onClose: () => void;
}

const Toast = ({ message, type, onClose }: ToastProps) => {
  const config = {
    success: {
      label: 'BERHASIL',
      icon: (
        <div className="bg-gradient-to-br from-emerald-400 to-emerald-500 text-white rounded-full p-1 shadow-md shadow-emerald-500/20 flex items-center justify-center">
          <Check className="w-2.5 h-2.5" strokeWidth={4} />
        </div>
      ),
      borderLeft: 'border-l-emerald-500',
      titleColor: 'text-emerald-400',
      progressBarBg: 'bg-emerald-500/40'
    },
    error: {
      label: 'GAGAL',
      icon: (
        <div className="bg-gradient-to-br from-rose-400 to-rose-500 text-white rounded-full p-1 shadow-md shadow-rose-500/20 flex items-center justify-center">
          <X className="w-2.5 h-2.5" strokeWidth={4} />
        </div>
      ),
      borderLeft: 'border-l-rose-500',
      titleColor: 'text-rose-400',
      progressBarBg: 'bg-rose-500/40'
    },
    warning: {
      label: 'PERINGATAN',
      icon: (
        <div className="bg-gradient-to-br from-amber-400 to-amber-500 text-white rounded-full p-1 shadow-md shadow-amber-500/20 flex items-center justify-center">
          <AlertTriangle className="w-2.5 h-2.5" strokeWidth={3} />
        </div>
      ),
      borderLeft: 'border-l-amber-500',
      titleColor: 'text-amber-400',
      progressBarBg: 'bg-amber-500/40'
    },
    info: {
      label: 'INFORMASI',
      icon: (
        <div className="bg-gradient-to-br from-indigo-400 to-indigo-500 text-white rounded-full p-1 shadow-md shadow-indigo-500/20 flex items-center justify-center">
          <Info className="w-2.5 h-2.5" strokeWidth={3} />
        </div>
      ),
      borderLeft: 'border-l-indigo-500',
      titleColor: 'text-indigo-400',
      progressBarBg: 'bg-indigo-500/40'
    }
  };

  const { label, icon, borderLeft, titleColor, progressBarBg } = config[type];

  // Bersihkan karakter emoji mentah di awal pesan agar tidak dobel dengan flat icon
  const cleanMessage = message.replace(/^[\u{1F300}-\u{1F9FF}🌐📴✅❌⚠️✨\s]+/u, '').trim();

  return (
    <motion.div
      initial={{ opacity: 0, y: -15, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: -10, scale: 0.95, transition: { duration: 0.15 } }}
      className={`fixed top-[68px] right-4 sm:top-[76px] sm:right-6 z-[9999] flex items-start gap-2 p-2.5 rounded-xl border border-white/[0.08] bg-[#0b0e17]/95 backdrop-blur-xl shadow-[0_12px_30px_rgba(0,0,0,0.5)] border-l-4 ${borderLeft} w-[240px] overflow-hidden`}
    >
      <div className="flex-shrink-0 mt-0.5">
        {icon}
      </div>
      
      <div className="flex-1 min-w-0">
        <span className={`block text-[8px] font-black tracking-widest uppercase mb-0.5 ${titleColor}`}>
          {label}
        </span>
        <p className="text-[10px] font-bold text-white/90 leading-tight">
          {cleanMessage}
        </p>
      </div>

      <button 
        onClick={onClose}
        className="p-0.5 rounded hover:bg-white/5 text-white/30 hover:text-white transition-colors flex-shrink-0 mt-0.5"
        title="Tutup"
      >
        <X size={10} />
      </button>

      {/* Progress bar timer */}
      <motion.div 
        initial={{ scaleX: 1 }}
        animate={{ scaleX: 0 }}
        transition={{ duration: 3, ease: 'linear' }}
        className={`absolute bottom-0 left-0 h-[2px] w-full origin-left ${progressBarBg}`}
      />
    </motion.div>
  );
};

export default Toast;
