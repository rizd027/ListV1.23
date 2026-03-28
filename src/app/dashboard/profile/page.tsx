'use client';

import { useEffect, useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import NextImage from 'next/image';
import { Pencil, Camera, Loader2, Save, Shield, Film, Tv, MonitorPlay, Video, Clapperboard } from 'lucide-react';
import { useToast } from '@/context/ToastContext';
import { updateUserProfile } from '@/lib/api';

export default function ProfilePage() {
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const { showToast } = useToast();

  // Profile States
  const [username, setUsername] = useState<string>('');
  const [avatar, setAvatar] = useState<string>('');
  const [bio, setBio] = useState('');

  // Edit Modes
  const [isEditingUsername, setIsEditingUsername] = useState(false);
  const [isEditingBio, setIsEditingBio] = useState(false);

  // Form States
  const [newUsername, setNewUsername] = useState('');
  const [newBio, setNewBio] = useState('');
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');

  const fileInputRef = useRef<HTMLInputElement>(null);

  // For Slideshow
  const [currentSlide, setCurrentSlide] = useState(0);
  const slides = [
    'https://images.unsplash.com/photo-1536440136628-849c177e76a1?q=80&w=1925&auto=format&fit=crop',
    'https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?q=80&w=2070&auto=format&fit=crop',
    'https://images.unsplash.com/photo-1626814026160-2237a95fc5a0?q=80&w=2070&auto=format&fit=crop'
  ];

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % slides.length);
    }, 5000);
    return () => clearInterval(timer);
  }, [slides.length]);

  useEffect(() => {
    const user = localStorage.getItem('film_username');
    const savedAvatar = localStorage.getItem('film_avatar') || '';
    const savedBio = localStorage.getItem('film_bio') || 'Cinta Menonton Film & Seri...';
    if (!user) {
      router.replace('/');
    } else {
      setUsername(user);
      setNewUsername(user);
      setBio(savedBio);
      setNewBio(savedBio);
      setAvatar(savedAvatar);
      setLoading(false);
    }
  }, [router]);

  const initials = username.slice(0, 2).toUpperCase();

  const handleAvatarSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      showToast('Ukuran foto maksimal 5MB!', 'error');
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        // Resize image
        const canvas = document.createElement('canvas');
        const MAX_SIZE = 150;
        let width = img.width;
        let height = img.height;

        if (width > height) {
          if (width > MAX_SIZE) {
            height *= MAX_SIZE / width;
            width = MAX_SIZE;
          }
        } else {
          if (height > MAX_SIZE) {
            width *= MAX_SIZE / height;
            height = MAX_SIZE;
          }
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        ctx?.drawImage(img, 0, 0, width, height);

        const base64 = canvas.toDataURL('image/jpeg', 0.8);
        setAvatar(base64);
      };
      img.src = event.target?.result as string;
    };
    reader.readAsDataURL(file);
  };

  const handleSave = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();

    if (newPassword && newPassword.length < 5) {
      return showToast('Sandi baru minimal 5 karakter!', 'error');
    }
    if (newPassword && !oldPassword) {
      return showToast('Masukkan sandi lama untuk konfirmasi!', 'error');
    }

    try {
      setSaving(true);
      const currentPass = localStorage.getItem('film_password') || '';

      if (oldPassword && oldPassword !== currentPass) {
        setSaving(false);
        return showToast('Sandi lama Anda salah!', 'error');
      }

      const nUser = newUsername !== username ? newUsername : undefined;
      const nPass = newPassword ? newPassword : undefined;

      const res = await updateUserProfile(username, currentPass, nUser, nPass, avatar);

      if (res.status === 'success') {
        showToast('Berhasil di-Simpan!', 'success');

        if (nUser) {
          localStorage.setItem('film_username', nUser);
          setUsername(nUser);
        }
        if (nPass) {
          localStorage.setItem('film_password', nPass);
        }
        localStorage.setItem('film_avatar', avatar);
        
        // Simpan Bio statis ke browser
        localStorage.setItem('film_bio', newBio);
        setBio(newBio);

        setIsEditingUsername(false);
        setIsEditingBio(false);
        setOldPassword('');
        setNewPassword('');

        window.dispatchEvent(new Event('storage'));
      } else {
        showToast(res.message || 'Gagal tersinkron.', 'error');
      }
    } catch {
      showToast('Gagal terhubung dengan server Google.', 'error');
    } finally {
      setSaving(false);
    }
  };

  if (loading) return null;

  return (
    <div className="flex bg-[#0c0f1c] h-[calc(100vh-48px)] md:h-[calc(100vh-56px)] overflow-hidden">
      
      {/* ── Panel Kiri: Profile Editor ── */}
      <div className="w-full md:w-[300px] lg:w-[320px] xl:w-[340px] flex-none bg-[#080a12] border-r border-white/[0.06] flex flex-col overflow-hidden relative z-20">
        
        {/* Dynamic Background Icons */}
        <div className="absolute inset-0 pointer-events-none opacity-[0.03] z-0">
          {[...Array(10)].map((_, i) => {
            const IconList = [Film, Tv, MonitorPlay, Video, Clapperboard];
            const Icon = IconList[i % IconList.length];
            const top = (i * 15 + 7) % 100;
            const left = (i * 23 + 13) % 100;
            const duration = 15 + (i % 5) * 5;
            const delay = i * 0.7;

            return (
              <motion.div
                key={i}
                className="absolute text-indigo-400"
                style={{ top: `${top}%`, left: `${left}%` }}
                animate={{
                  y: [0, -40, 0],
                  x: [0, 20, 0],
                  rotate: [0, 15, -15, 0],
                  opacity: [0.3, 0.6, 0.3],
                }}
                transition={{
                  duration,
                  repeat: Infinity,
                  ease: "easeInOut",
                  delay,
                }}
              >
                <Icon size={40 + (i % 3) * 20} />
              </motion.div>
            );
          })}
        </div>
        
        {/* Subtle top accent line */}
        <div className="h-[2px] w-full bg-gradient-to-r from-transparent via-indigo-500/50 to-transparent flex-shrink-0" />

        {/* Scrollable content area */}
        <div className="flex-1 flex flex-col items-center justify-between py-8 px-8 md:py-6 md:px-6 overflow-hidden relative z-10">

          {/* ── Header ── */}
          <div className="w-full flex flex-col items-center flex-shrink-0">
            <div className="flex items-center gap-2 mb-1">
              <Shield className="w-4 h-4 md:w-3.5 md:h-3.5 text-indigo-400" />
              <span className="text-xs md:text-[10px] font-semibold text-indigo-400 tracking-[0.2em] uppercase">Profil Saya</span>
            </div>
            <div className="w-12 md:w-10 h-[1px] bg-gradient-to-r from-transparent via-white/20 to-transparent mt-2" />
          </div>

          {/* ── Avatar Section ── */}
          <div className="flex flex-col items-center flex-shrink-0 my-6 md:my-5">
            {/* Avatar with glow ring */}
            <div className="relative mb-5 md:mb-4">
              <div className="absolute -inset-[5px] md:-inset-[4px] rounded-full bg-gradient-to-br from-indigo-500/60 via-purple-500/30 to-transparent blur-sm" />
              <div
                className="relative w-[130px] h-[130px] md:w-[110px] md:h-[110px] rounded-full overflow-hidden cursor-pointer group shadow-xl border-2 border-white/5"
                onClick={() => fileInputRef.current?.click()}
              >
                {avatar ? (
                  <NextImage src={avatar} alt="Avatar" width={110} height={110} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-4xl md:text-3xl font-black bg-gradient-to-br from-indigo-900 to-slate-900 text-indigo-200">
                    {initials}
                  </div>
                )}
                <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-all duration-300 backdrop-blur-[1px]">
                  <Camera className="w-7 h-7 md:w-6 md:h-6 text-white" />
                </div>
              </div>
              <input type="file" accept="image/*" ref={fileInputRef} className="hidden" onChange={handleAvatarSelect} />
              
              {/* Online status node */}
              <div className="absolute top-2.5 right-2.5 md:top-2 md:right-2 z-20">
                <span className="relative flex h-4 w-4 md:h-3.5 md:w-3.5">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-4 w-4 md:h-3.5 md:w-3.5 bg-emerald-500 border-2 border-[#080a12] shadow-sm"></span>
                </span>
              </div>
            </div>

            {/* Username */}
            <div className="flex items-center gap-2 mb-2 md:mb-1.5">
              {isEditingUsername ? (
                <input
                  type="text" autoFocus
                  className="bg-white/5 border-b border-indigo-400/60 outline-none text-center text-xl md:text-base font-bold text-white px-2 py-0.5 w-48 md:w-40 rounded-sm"
                  value={newUsername}
                  onChange={e => setNewUsername(e.target.value.replace(/[^a-zA-Z0-9]/g, ''))}
                  onBlur={() => { if (!newUsername) setNewUsername(username); setIsEditingUsername(false); }}
                  onKeyDown={e => e.key === 'Enter' && setIsEditingUsername(false)}
                />
              ) : (
                <div className="flex items-center gap-2 cursor-pointer group" onClick={() => setIsEditingUsername(true)}>
                  <span className="text-xl md:text-lg font-bold text-white">{username}</span>
                  <Pencil className="w-3.5 h-3.5 md:w-3 md:h-3 text-indigo-400/60 group-hover:text-indigo-300 transition-colors" />
                </div>
              )}
            </div>

            {/* Bio */}
            <div className="flex items-center gap-1.5">
              {isEditingBio ? (
                <input
                  type="text" autoFocus
                  className="bg-white/5 border-b border-white/20 outline-none text-center text-sm md:text-xs text-gray-300 px-2 py-0.5 w-60 md:w-52 rounded-sm"
                  value={newBio}
                  onChange={e => setNewBio(e.target.value)}
                  onBlur={() => { if (!newBio) setNewBio(bio); setIsEditingBio(false); }}
                  onKeyDown={e => e.key === 'Enter' && setIsEditingBio(false)}
                />
              ) : (
                <div className="flex items-center gap-1.5 cursor-pointer group" onClick={() => setIsEditingBio(true)}>
                  <span className="text-sm md:text-xs text-gray-500 group-hover:text-gray-300 transition-colors max-w-[220px] md:max-w-[200px] truncate">{bio}</span>
                  <Pencil className="w-3 h-3 md:w-[10px] md:h-[10px] text-gray-600 group-hover:text-gray-300 transition-colors flex-shrink-0" />
                </div>
              )}
            </div>
          </div>


          {/* ── Divider ── */}
          <div className="w-full flex items-center gap-3 flex-shrink-0">
            <div className="flex-1 h-[1px] bg-white/[0.06]" />
            <span className="text-[10px] md:text-[9px] font-semibold text-white/30 tracking-[0.15em] uppercase">Keamanan</span>
            <div className="flex-1 h-[1px] bg-white/[0.06]" />
          </div>

          {/* ── Password Form ── */}
          <form onSubmit={handleSave} className="w-full flex flex-col gap-4 md:gap-3 flex-shrink-0">
            
            {/* Old Password */}
            <div className="w-full">
              <label className="block text-[11px] md:text-[9px] font-semibold text-white/40 tracking-[0.12em] uppercase mb-2 md:mb-1.5 pl-1">Sandi Saat Ini</label>
              <input
                type="password"
                value={oldPassword}
                placeholder="••••••••"
                onChange={e => setOldPassword(e.target.value)}
                className="w-full bg-white/[0.04] border border-white/[0.08] hover:border-white/[0.15] focus:border-indigo-500/60 focus:bg-indigo-500/5 rounded-xl h-11 md:h-9 px-4 text-sm text-white outline-none transition-all duration-200 placeholder:text-white/15"
              />
            </div>

            {/* New Password */}
            <div className="w-full">
              <label className="block text-[11px] md:text-[9px] font-semibold text-white/40 tracking-[0.12em] uppercase mb-2 md:mb-1.5 pl-1">Kata Sandi Baru</label>
              <input
                type="password"
                value={newPassword}
                placeholder="••••••••"
                onChange={e => setNewPassword(e.target.value)}
                className="w-full bg-white/[0.04] border border-white/[0.08] hover:border-white/[0.15] focus:border-indigo-500/60 focus:bg-indigo-500/5 rounded-xl h-11 md:h-9 px-4 text-sm text-white outline-none transition-all duration-200 placeholder:text-white/15"
              />
            </div>

            {/* Message + Save Button */}
            <div className="relative w-full mt-1">
              <button
                type="submit"
                disabled={saving || (!newUsername && !newPassword && !oldPassword && !avatar.startsWith('data:') && newBio === bio)}
                className="w-full h-11 md:h-9 flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 disabled:opacity-30 disabled:pointer-events-none text-white font-bold text-sm md:text-[12px] tracking-wide transition-all duration-200 shadow-lg shadow-indigo-900/30"
              >
                {saving ? (
                  <Loader2 className="w-4 h-4 md:w-3.5 md:h-3.5 animate-spin" />
                ) : (
                  <>
                    <Save className="w-4 h-4 md:w-3.5 md:h-3.5" />
                    Simpan Perubahan
                  </>
                )}
              </button>
            </div>
          </form>

          {/* ── Footer ── */}
          <div className="flex-shrink-0">
            <p className="text-[9px] text-white/15 text-center tracking-wider">ListV · Profil Aman Terenkripsi</p>
          </div>

        </div>
      </div>

      {/* ── Panel Kanan: Slideshow ── */}
      <div className="hidden md:flex flex-1 relative overflow-hidden items-center justify-center bg-[#06080f]">
        <AnimatePresence initial={false}>
          <motion.img
            key={currentSlide}
            src={slides[currentSlide]}
            alt="Cinematic Background"
            initial={{ opacity: 0, scale: 1.05 }}
            animate={{ opacity: 0.5, scale: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 1.5, ease: 'easeOut' }}
            className="absolute inset-0 w-full h-full object-cover"
          />
        </AnimatePresence>
        
        {/* Dynamic Background Icons (Right Panel) */}
        <div className="absolute inset-0 pointer-events-none opacity-[0.05] z-0">
          {[...Array(8)].map((_, i) => {
            const IconList = [Film, Tv, MonitorPlay, Video, Clapperboard];
            const Icon = IconList[(i + 2) % IconList.length];
            const top = (i * 20 + 10) % 100;
            const left = (i * 30 + 20) % 100;
            const duration = 20 + (i % 4) * 5;
            const delay = i * 0.5;

            return (
              <motion.div
                key={i}
                className="absolute text-white"
                style={{ top: `${top}%`, left: `${left}%` }}
                animate={{
                  y: [0, 60, 0],
                  x: [0, -30, 0],
                  rotate: [0, -20, 20, 0],
                  scale: [1, 1.2, 1],
                }}
                transition={{
                  duration,
                  repeat: Infinity,
                  ease: "easeInOut",
                  delay,
                }}
              >
                <Icon size={100 + (i % 2) * 50} />
              </motion.div>
            );
          })}
        </div>
        
        {/* Vignette */}
        <div className="absolute inset-0 bg-gradient-to-r from-[#080a12] via-transparent to-black/50" />
        <div className="absolute inset-0 bg-gradient-to-t from-[#080a12] via-transparent to-transparent" />
        
        {/* Teks Animasi */}
        <div className="relative z-10 text-center select-none pointer-events-none">
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2, duration: 1 }}
            className="text-4xl lg:text-5xl xl:text-7xl font-black text-white tracking-widest drop-shadow-[0_10px_30px_rgba(0,0,0,0.8)]"
          >
            Slideshow Gambar
          </motion.h1>
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.7 }}
            transition={{ delay: 0.8, duration: 1 }}
            className="text-xs lg:text-sm text-gray-300 mt-4 tracking-[0.3em] uppercase font-bold"
          >
            Film · Animasi · Sinema
          </motion.p>
        </div>
      </div>

    </div>
  );
}
