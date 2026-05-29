'use client';

import { useEffect, useState } from 'react';
import { Outfit } from 'next/font/google';
import { WifiOff, RefreshCw, Clapperboard } from 'lucide-react';
import { motion } from 'framer-motion';

const outfit = Outfit({ subsets: ['latin'], weight: ['400', '500', '600', '700', '800'] });

export default function OfflinePage() {
  const [retrying, setRetrying] = useState(false);

  useEffect(() => {
    // Auto redirect when connection restored
    const handleOnline = () => {
      window.location.reload();
    };
    window.addEventListener('online', handleOnline);
    return () => window.removeEventListener('online', handleOnline);
  }, []);

  const handleRetry = () => {
    setRetrying(true);
    setTimeout(() => {
      window.location.reload();
    }, 500);
  };

  return (
    <main
      className={`min-h-screen w-full flex flex-col items-center justify-center bg-[#0B1120] text-white relative overflow-hidden ${outfit.className}`}
    >
      {/* Ambient background blobs */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-indigo-600/10 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-1/4 right-1/4 w-64 h-64 bg-purple-600/10 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }} />
      </div>

      <div className="relative z-10 flex flex-col items-center gap-8 px-6 text-center max-w-md">
        {/* Logo */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="flex items-center gap-2.5 text-indigo-400"
        >
          <Clapperboard className="w-8 h-8" />
          <span className="text-3xl font-black tracking-tight text-white">ListV</span>
        </motion.div>

        {/* Offline Icon */}
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="relative"
        >
          <div className="w-24 h-24 rounded-3xl flex items-center justify-center"
            style={{ background: 'rgba(99,102,241,0.1)', border: '1px solid rgba(99,102,241,0.2)' }}
          >
            <WifiOff className="w-12 h-12 text-indigo-400" strokeWidth={1.5} />
          </div>
          {/* Pulse ring */}
          <div className="absolute inset-0 rounded-3xl animate-ping opacity-20"
            style={{ background: 'rgba(99,102,241,0.3)' }} />
        </motion.div>

        {/* Text */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.3 }}
          className="space-y-3"
        >
          <h1 className="text-2xl font-black text-white">Tidak Ada Koneksi</h1>
          <p className="text-gray-400 text-sm leading-relaxed">
            Anda sedang offline. Data terakhir yang tersimpan masih bisa diakses.
            Sambungkan kembali ke internet untuk menyinkronkan perubahan terbaru.
          </p>
        </motion.div>

        {/* Status Badge */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.4 }}
          className="flex items-center gap-2 px-4 py-2 rounded-full"
          style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.2)' }}
        >
          <div className="w-2 h-2 rounded-full bg-red-400 animate-pulse" />
          <span className="text-xs font-semibold text-red-400">Offline Mode</span>
        </motion.div>

        {/* Retry Button */}
        <motion.button
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.5 }}
          onClick={handleRetry}
          disabled={retrying}
          className="flex items-center gap-2.5 px-6 py-3 rounded-2xl text-sm font-bold text-white transition-all duration-300 disabled:opacity-60"
          style={{
            background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
            boxShadow: '0 8px 24px rgba(99,102,241,0.3)',
          }}
          whileHover={{ scale: 1.03, boxShadow: '0 12px 32px rgba(99,102,241,0.4)' }}
          whileTap={{ scale: 0.97 }}
        >
          <RefreshCw className={`w-4 h-4 ${retrying ? 'animate-spin' : ''}`} />
          {retrying ? 'Mencoba kembali...' : 'Coba Lagi'}
        </motion.button>

        {/* Hint */}
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.7 }}
          className="text-xs text-gray-600"
        >
          Halaman akan otomatis refresh saat koneksi kembali.
        </motion.p>
      </div>
    </main>
  );
}
