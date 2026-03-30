'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import Image from 'next/image';
import { Eye, EyeOff, Loader2, Clapperboard, User, Lock, Film, PlayCircle, MonitorPlay, Star } from 'lucide-react';
import { Outfit } from 'next/font/google';
import { loginAppScript } from '@/lib/api';

const outfit = Outfit({ subsets: ['latin'], weight: ['400', '500', '600', '700'] });
const MotionImage = motion(Image);

export default function LoginPage() {
  const router = useRouter();
  const [isLogin, setIsLogin] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [formData, setFormData] = useState({ username: '', password: '', confirmPassword: '' });
  const [currentImageIndex, setCurrentImageIndex] = useState(1);

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentImageIndex((prev) => (prev % 25) + 1);
    }, 4000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    // Check if already logged in
    const user = localStorage.getItem('film_username');
    const pass = localStorage.getItem('film_password');
    if (user && pass) {
      router.push('/dashboard');
    }
  }, [router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.username || !formData.password || (!isLogin && !formData.confirmPassword)) {
      setError('Harap isi semua kolom!');
      return;
    }

    if (!isLogin && formData.password !== formData.confirmPassword) {
      setError('Password tidak cocok!');
      return;
    }

    setLoading(true);
    setError('');
    setSuccess('');

    try {
      const result = await loginAppScript(formData.username, formData.password, !isLogin);

      if (result.status === 'success') {
        if (!isLogin) {
          setSuccess('Pendaftaran berhasil! Silakan login.');
          setIsLogin(true);
          setFormData(prev => ({ ...prev, password: '' }));
        } else {
          setSuccess('Berhasil Masuk!');
          const cleanUser = formData.username.replace(/[^a-z0-9]/g, '_');
          localStorage.setItem('film_username', cleanUser);
          localStorage.setItem('film_password', formData.password);
          if (result.data?.avatar) {
            localStorage.setItem('film_avatar', result.data.avatar);
          } else {
            localStorage.removeItem('film_avatar');
          }
          setTimeout(() => {
            router.push('/dashboard');
          }, 800);
        }
      } else {
        setError(result.message || 'Gagal tersambung');
      }
    } catch {
      setError('Koneksi gagal atau server error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className={`min-h-screen w-full relative flex flex-col lg:flex-row bg-[#0B1120] text-white overflow-hidden ${outfit.className}`}>
      
      {/* 
        1. Desktop Slideshow Column (Always visible on Left in Desktop) 
      */}
      <div className="hidden lg:block lg:w-1/2 relative overflow-hidden bg-black/20">
        <div className="absolute inset-0 z-0">
          <AnimatePresence mode='wait'>
            <MotionImage
              key={currentImageIndex}
              src={`/assets/PNG_Preview/a${currentImageIndex}.png`}
              alt="Preview"
              width={1000}
              height={1000}
              initial={{ opacity: 0, scale: 1.05 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 1.5, ease: "easeInOut" }}
              className="absolute inset-0 w-full h-full object-cover object-center"
              priority
            />
          </AnimatePresence>
        </div>
        {/* Desktop Gradient Overlay to blend with form side */}
        <div className="absolute inset-0 bg-gradient-to-r from-transparent to-[#0B1120] z-10" />
      </div>

      {/* 
        2. Mobile Background Slideshow (Only visible on Mobile as background) 
      */}
      <div className="lg:hidden absolute inset-0 z-0 overflow-hidden pointer-events-none">
        <div className="absolute inset-0 opacity-40">
           <AnimatePresence>
            <MotionImage
              key={currentImageIndex}
              src={`/assets/PNG_Preview/a${currentImageIndex}.png`}
              alt="Background"
              width={500}
              height={500}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 1.5, ease: "easeInOut" }}
              className="absolute inset-0 w-full h-full object-cover object-center"
            />
          </AnimatePresence>
        </div>
        {/* Mobile Dark Overlay for better contrast */}
        <div className="absolute inset-0 bg-[#0B1120]/80 z-10" />
      </div>

      {/* 3. Form Content Column (Right on Desktop, Full on Mobile) */}
      <div className="flex-1 w-full lg:w-1/2 relative flex items-center justify-center p-6 lg:p-8 z-20 overflow-y-auto custom-scrollbar lg:bg-transparent">
        {/* Dynamic Background Icons - Small & Numerous */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none z-0 opacity-40">
          {[
            { Icon: Film, size: 24, pos: { top: '8%', left: '12%' }, d: 0, dur: 8, c: 'text-indigo-500/20' },
            { Icon: MonitorPlay, size: 28, pos: { top: '15%', right: '15%' }, d: 1, dur: 10, c: 'text-purple-500/20' },
            { Icon: PlayCircle, size: 20, pos: { top: '35%', left: '5%' }, d: 2, dur: 12, c: 'text-blue-500/20' },
            { Icon: Star, size: 16, pos: { top: '65%', right: '8%' }, d: 0.5, dur: 9, c: 'text-indigo-400/20' },
            { Icon: Clapperboard, size: 22, pos: { bottom: '12%', left: '15%' }, d: 1.5, dur: 11, c: 'text-indigo-300/20' },
            { Icon: Film, size: 18, pos: { top: '50%', right: '20%' }, d: 2.5, dur: 13, c: 'text-purple-300/20' },
            { Icon: PlayCircle, size: 26, pos: { bottom: '25%', right: '10%' }, d: 0.8, dur: 7, c: 'text-blue-300/20' },
            { Icon: MonitorPlay, size: 14, pos: { top: '55%', left: '8%' }, d: 3, dur: 15, c: 'text-indigo-400/20' },
            { Icon: Star, size: 20, pos: { bottom: '45%', left: '22%' }, d: 1.2, dur: 14, c: 'text-purple-400/20' },
            { Icon: Clapperboard, size: 16, pos: { top: '25%', left: '30%' }, d: 4, dur: 18, c: 'text-indigo-500/10' },
            { Icon: Film, size: 20, pos: { bottom: '5%', right: '35%' }, d: 0.2, dur: 10, c: 'text-blue-400/10' },
          ].map((item, i) => (
            <motion.div
              key={i}
              animate={{
                y: [0, i % 2 === 0 ? -20 : 20, 0],
                x: [0, i % 3 === 0 ? 15 : -15, 0],
                rotate: [0, i % 2 === 0 ? 10 : -10, 0]
              }}
              transition={{ duration: item.dur, repeat: Infinity, ease: "easeInOut", delay: item.d }}
              style={item.pos}
              className={`absolute ${item.c}`}
            >
              <item.Icon style={{ width: item.size, height: item.size }} />
            </motion.div>
          ))}
        </div>

        <div className="w-full max-w-[380px] flex flex-col space-y-6 relative z-10">

          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-center space-y-1.5"
          >
            <div className="flex items-center justify-center space-x-2 text-indigo-500 mb-2">
              <Clapperboard className="w-7 h-7" />
              <h1 className="text-3xl font-bold tracking-tight text-white">ListV</h1>
            </div>
            <p className="text-gray-400 text-[13px] leading-snug px-4">
              Kelola koleksi Film & Donghua Anda dengan mudah.
            </p>
          </motion.div>

          {/* Auth Tabs */}
          <div className="flex p-1 bg-white/5 border border-white/5 rounded-xl">
            <button
              onClick={() => { setIsLogin(true); setError(''); setSuccess(''); }}
              className={`flex-1 flex items-center justify-center py-2 text-sm font-semibold rounded-lg transition-all duration-300 ${isLogin ? 'bg-indigo-500 text-white shadow-md shadow-indigo-500/25' : 'text-gray-400 hover:text-white'
                }`}
            >
              Masuk
            </button>
            <button
              onClick={() => { setIsLogin(false); setError(''); setSuccess(''); }}
              className={`flex-1 flex items-center justify-center py-2 text-sm font-semibold rounded-lg transition-all duration-300 ${!isLogin ? 'bg-indigo-500 text-white shadow-md shadow-indigo-500/25' : 'text-gray-400 hover:text-white'
                }`}
            >
              Daftar
            </button>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <AnimatePresence mode="wait">
              {error && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="bg-red-500/10 border border-red-500/20 text-red-400 px-3 py-2.5 rounded-lg text-xs font-medium"
                >
                  {error}
                </motion.div>
              )}
              {success && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 px-3 py-2.5 rounded-lg text-xs font-medium"
                >
                  {success}
                </motion.div>
              )}
            </AnimatePresence>

            <div className="space-y-1.5">
              <label className="text-[13px] font-semibold text-gray-300 ml-1">
                {isLogin ? 'Username' : 'Username Baru'}
              </label>
              <div className="relative flex items-center">
                <User className="absolute left-3.5 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  value={formData.username}
                  onChange={(e) => setFormData(prev => ({ ...prev, username: e.target.value.toLowerCase() }))}
                  className="w-full bg-slate-900/50 border border-white/10 rounded-xl pl-10 pr-4 py-2.5 text-sm text-white placeholder:text-gray-500 focus:outline-none focus:border-indigo-500/50 focus:ring-1 focus:ring-indigo-500/50 transition-all"
                  placeholder="Masukkan username"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-[13px] font-semibold text-gray-300 ml-1">
                {isLogin ? 'Password' : 'Password Baru'}
              </label>
              <div className="relative flex items-center">
                <Lock className="absolute left-3.5 w-4 h-4 text-gray-400" />
                <input
                  type={showPassword ? "text" : "password"}
                  value={formData.password}
                  onChange={(e) => setFormData(prev => ({ ...prev, password: e.target.value }))}
                  className="w-full bg-slate-900/50 border border-white/10 rounded-xl pl-10 pr-10 py-2.5 text-sm text-white placeholder:text-gray-500 focus:outline-none focus:border-indigo-500/50 focus:ring-1 focus:ring-indigo-500/50 transition-all"
                  placeholder="Masukkan password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 text-gray-400 hover:text-white transition-colors"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <AnimatePresence>
              {!isLogin && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="space-y-1.5"
                >
                  <label className="text-[13px] font-semibold text-gray-300 ml-1">Konfirmasi Password</label>
                  <div className="relative flex items-center">
                    <Lock className="absolute left-3.5 w-4 h-4 text-gray-400" />
                    <input
                      type={showPassword ? "text" : "password"}
                      value={formData.confirmPassword}
                      onChange={(e) => setFormData(prev => ({ ...prev, confirmPassword: e.target.value }))}
                      className="w-full bg-slate-900/50 border border-white/10 rounded-xl pl-10 pr-10 py-2.5 text-sm text-white placeholder:text-gray-500 focus:outline-none focus:border-indigo-500/50 focus:ring-1 focus:ring-indigo-500/50 transition-all font-medium"
                      placeholder="Ulangi password"
                    />
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            <button
              type="submit"
              disabled={loading}
              className={`w-full py-3 mt-2 rounded-xl text-sm font-bold text-white shadow-lg flex items-center justify-center transition-all ${loading ? 'bg-indigo-500/70 cursor-not-allowed' : 'bg-indigo-500 hover:bg-indigo-600 hover:-translate-y-0.5 shadow-indigo-500/25'
                }`}
            >
              {loading ? (
                <Loader2 className="animate-spin w-4 h-4" />
              ) : isLogin ? (
                'Masuk Sekarang'
              ) : (
                'Daftar Sekarang'
              )}
            </button>
          </form>

          {/* Footer */}
          <div className="pt-2 text-center">
            <p className="text-[13px] text-gray-400 font-medium tracking-wide">
              Lupa password? <a href="https://wa.me/6287787525867" target="_blank" rel="noopener noreferrer" className="text-indigo-400 hover:text-indigo-300 transition-colors">Hubungi WhatsApp</a>
            </p>
          </div>

        </div>
      </div>
    </main>
  );
}
