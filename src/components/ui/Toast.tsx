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
      icon: <Check className="w-3 h-3 text-emerald-400" strokeWidth={2.5} />,
      dot: 'bg-emerald-500',
      titleColor: 'text-emerald-400',
      label: 'Berhasil',
    },
    error: {
      icon: <X className="w-3 h-3 text-rose-400" strokeWidth={2.5} />,
      dot: 'bg-rose-500',
      titleColor: 'text-rose-400',
      label: 'Gagal',
    },
    warning: {
      icon: <AlertTriangle className="w-3 h-3 text-amber-400" strokeWidth={2} />,
      dot: 'bg-amber-500',
      titleColor: 'text-amber-400',
      label: 'Peringatan',
    },
    info: {
      icon: <Info className="w-3 h-3 text-indigo-400" strokeWidth={2} />,
      dot: 'bg-indigo-500',
      titleColor: 'text-indigo-400',
      label: 'Info',
    }
  };

  const { icon, dot, titleColor, label } = config[type];

  // Bersihkan karakter emoji mentah di awal pesan agar tidak dobel dengan flat icon
  const cleanMessage = message.replace(/^[\u{1F300}-\u{1F9FF}🌐📴✅❌⚠️✨\s]+/u, '').trim();

  return (
    <motion.div
      initial={{ opacity: 0, y: -10, scale: 0.97 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: -8, scale: 0.97, transition: { duration: 0.12 } }}
      className="fixed top-[68px] right-4 sm:top-[76px] sm:right-6 z-[9999] flex items-start gap-2.5 p-3 bg-[#0c0f1c] border border-white/[0.07] shadow-[0_8px_24px_rgba(0,0,0,0.5)] w-[220px] overflow-hidden"
      style={{ borderRadius: '6px' }}
    >
      {/* Icon */}
      <div className="flex-shrink-0 mt-0.5">
        {icon}
      </div>
      
      <div className="flex-1 min-w-0">
        <span className={`block text-[9px] font-bold tracking-wider uppercase mb-0.5 ${titleColor}`}>
          {label}
        </span>
        <p className="text-[11px] font-medium text-white/85 leading-tight">
          {cleanMessage}
        </p>
      </div>

      <button 
        onClick={onClose}
        className="p-0.5 rounded text-white/20 hover:text-white/60 transition-colors flex-shrink-0 mt-0.5"
        title="Tutup"
      >
        <X size={10} />
      </button>

      {/* Progress bar timer */}
      <motion.div 
        initial={{ scaleX: 1 }}
        animate={{ scaleX: 0 }}
        transition={{ duration: 3, ease: 'linear' }}
        className={`absolute bottom-0 left-0 h-[1px] w-full origin-left ${dot} opacity-60`}
      />
    </motion.div>
  );
};

export default Toast;
