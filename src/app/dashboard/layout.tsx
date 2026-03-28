'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { motion, AnimatePresence } from 'framer-motion';
import {
  LogOut, Clapperboard, Search, SlidersHorizontal,
  ChevronDown, User, X, LayoutGrid, List, ArrowLeft
} from 'lucide-react';
import { FilterProvider, useFilters } from '@/context/FilterContext';

/* ── Filter Dropdown ─────────────────────────────────────── */
function FilterDropdown() {
  const { typeFilter, setTypeFilter, sortBy, setSortBy, statusFilter, setStatusFilter } = useFilters();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const activeCount = [
    typeFilter !== 'Semua Kategori',
    sortBy !== 'Terbaru',
    statusFilter !== 'Semua Status',
  ].filter(Boolean).length;

  const ChipGroup = ({ label, items, value, onChange }: {
    label: string; items: string[]; value: string; onChange: (v: string) => void;
  }) => (
    <div>
      <p className="text-[8px] md:text-[9px] font-black text-gray-600 uppercase tracking-[0.2em] mb-1.5">{label}</p>
      <div className="flex flex-wrap gap-1">
        {items.map(v => {
          const active = value === v;
          const label = v.replace('Semua Kategori', 'Semua').replace('Semua Status', 'Semua');
          return (
            <button key={v} onClick={() => onChange(v)}
              className={`px-2 py-1 md:px-2.5 md:py-1 rounded-lg text-[9px] md:text-[11px] font-medium transition-all duration-150 border ${active
                ? 'bg-indigo-500/25 border-indigo-500/40 text-indigo-300'
                : 'bg-white/[0.04] border-white/[0.06] text-gray-500 hover:bg-white/[0.08] hover:text-gray-300 hover:border-white/10'
                }`}>
              {label}
            </button>
          );
        })}
      </div>
    </div>
  );

  return (
    <div ref={ref} className="relative flex-none">
      <button onClick={() => setOpen(o => !o)}
        className={`relative flex items-center gap-1.5 md:gap-2 h-7 md:h-8 px-2 md:px-3.5 rounded-lg text-[10px] md:text-xs font-medium transition-all duration-200 border ${open
          ? 'bg-indigo-500/15 border-indigo-500/50 text-indigo-300 shadow-lg shadow-indigo-500/10'
          : 'bg-white/[0.06] border-white/[0.08] text-gray-300 hover:bg-white/10 hover:border-white/15'
          }`}>
        <SlidersHorizontal className="w-3.5 h-3.5" />
        <span className="hidden sm:inline">Filter</span>
        {activeCount > 0 && (
          <motion.span
            initial={{ scale: 0 }} animate={{ scale: 1 }}
            className="absolute -top-1.5 -right-1.5 bg-indigo-500 text-white text-[9px] font-black rounded-full w-4 h-4 flex items-center justify-center shadow-sm shadow-indigo-500/50"
          >
            {activeCount}
          </motion.span>
        )}
        <ChevronDown className={`w-3 h-3 opacity-60 transition-transform duration-200 ${open ? 'rotate-180' : ''}`} />
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -8, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -8, scale: 0.95 }}
            transition={{ duration: 0.18, ease: [0.16, 1, 0.3, 1] }}
            className="absolute -right-8 sm:right-0 top-full mt-2.5 w-[250px] md:w-72 z-50 rounded-2xl border border-white/[0.08] shadow-2xl shadow-black/60 overflow-hidden origin-top-right sm:origin-top"
            style={{ background: 'rgba(10,14,30,0.95)', backdropFilter: 'blur(24px)' }}
          >
            <div className="px-3 py-2.5 md:px-4 md:py-3 space-y-3 md:space-y-3.5">
              <ChipGroup label="Kategori"
                items={['Semua Kategori', 'Film', 'Donghua', 'Anime', 'Series']}
                value={typeFilter} onChange={setTypeFilter} />
              <div className="h-px bg-white/[0.05]" />
              <ChipGroup label="Urutan"
                items={['ID A-Z', 'ID Z-A', 'Judul A-Z', 'Judul Z-A']}
                value={sortBy} onChange={setSortBy} />
              <div className="h-px bg-white/[0.05]" />
              <ChipGroup label="Status"
                items={['Semua Status', 'Selesai', 'Watching', 'Rencana', 'Ditunda']}
                value={statusFilter} onChange={setStatusFilter} />
            </div>

            <div className="px-3 py-2 md:px-4 md:py-2 border-t border-white/[0.05] flex justify-end">
              <button
                onClick={() => { setTypeFilter('Semua Kategori'); setSortBy('ID A-Z'); setStatusFilter('Semua Status'); }}
                className="text-[9px] md:text-[10px] text-gray-600 hover:text-indigo-400 transition-colors font-medium">
                Reset
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}


/* ── User Dropdown ───────────────────────────────────────── */
function UserDropdown({ username, avatar, bio, onLogout }: { username: string; avatar?: string | null; bio?: string | null; onLogout: () => void }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const initials = username.slice(0, 2).toUpperCase();

  return (
    <div ref={ref} className="relative flex-none">
      <button onClick={() => setOpen(o => !o)}
        className={`flex items-center gap-1.5 md:gap-2 h-7 md:h-8 pl-1.5 pr-2 md:pr-3 rounded-xl border transition-all duration-200 ${open ? 'bg-indigo-500/10 border-indigo-500/40' : 'bg-white/[0.06] border-white/[0.08] hover:bg-white/10 hover:border-white/15'
          }`}>
        {/* Avatar */}
        <div className="relative w-5 h-5 rounded-lg flex items-center justify-center overflow-hidden"
          style={{ background: 'linear-gradient(135deg, #6366f1, #8b5cf6)' }}>
          {avatar ? (
            <Image src={avatar} alt="Avatar" width={20} height={20} className="w-full h-full object-cover" />
          ) : (
            <span className="text-[9px] font-black text-white">{initials}</span>
          )}
          <span className="absolute -bottom-0.5 -right-0.5 w-2 h-2 bg-emerald-400 rounded-full border border-[#0B1120] z-10" />
        </div>
        <span className="hidden sm:block text-xs font-semibold text-gray-200">{username}</span>
        <ChevronDown className={`w-3 h-3 text-gray-500 transition-transform duration-200 ${open ? 'rotate-180' : ''}`} />
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -8, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -8, scale: 0.95 }}
            transition={{ duration: 0.18, ease: [0.16, 1, 0.3, 1] }}
            className="absolute right-0 top-full mt-2.5 w-[190px] md:w-52 z-50 rounded-xl md:rounded-2xl border border-white/[0.08] shadow-2xl shadow-black/60 overflow-hidden"
            style={{ background: 'rgba(10,14,30,0.92)', backdropFilter: 'blur(24px)' }}
          >
            {/* Profile card */}
            <div className="px-3 md:px-4 pt-3 md:pt-4 pb-2 md:pb-3 border-b border-white/[0.06]">
              <div className="flex items-center gap-2.5 md:gap-3">
                <div className="relative w-8 h-8 md:w-10 md:h-10 rounded-lg md:rounded-xl flex items-center justify-center flex-none shadow-lg shadow-indigo-500/20 overflow-hidden"
                  style={{ background: 'linear-gradient(135deg, #6366f1, #8b5cf6)' }}>
                  {avatar ? (
                    <Image src={avatar} alt="Avatar" width={40} height={40} className="w-full h-full object-cover" />
                  ) : (
                    <span className="text-xs md:text-sm font-black text-white">{initials}</span>
                  )}
                </div>
                <div className="min-w-0">
                  <p className="text-xs md:text-sm font-bold text-white truncate">{username}</p>
                  <p className="text-[9px] md:text-[10px] text-gray-400 mt-0.5 truncate leading-tight">
                    {bio || 'Administrator'}
                  </p>
                </div>
              </div>
            </div>

            {/* Menu */}
            <div className="p-1.5 md:p-2">
              <Link href="/dashboard/profile" onClick={() => setOpen(false)} className="w-full flex items-center gap-2 md:gap-2.5 px-2 md:px-3 py-1.5 md:py-2 rounded-lg md:rounded-xl text-[10px] md:text-xs text-gray-400 hover:bg-white/[0.06] hover:text-gray-100 transition-all duration-150 group">
                <span className="w-5 h-5 md:w-6 md:h-6 rounded-md md:rounded-lg bg-white/5 flex items-center justify-center group-hover:bg-indigo-500/15 transition-colors">
                  <User className="w-3 h-3 md:w-3.5 md:h-3.5" />
                </span>
                Profil Saya
              </Link>
              <button onClick={() => { setOpen(false); onLogout(); }}
                className="w-full flex items-center gap-2 md:gap-2.5 px-2 md:px-3 py-1.5 md:py-2 rounded-lg md:rounded-xl text-[10px] md:text-xs text-gray-400 hover:bg-red-500/10 hover:text-red-400 transition-all duration-150 group mt-0.5">
                <span className="w-5 h-5 md:w-6 md:h-6 rounded-md md:rounded-lg bg-white/5 flex items-center justify-center group-hover:bg-red-500/15 transition-colors">
                  <LogOut className="w-3 h-3 md:w-3.5 md:h-3.5" />
                </span>
                Keluar
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

/* ── Shell ───────────────────────────────────────────────── */
function DashboardShell({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const isDashboard = pathname === '/dashboard';
  const [username, setUsername] = useState<string | null>(null);
  const [avatar, setAvatar] = useState<string | null>(null);
  const [bio, setBio] = useState<string | null>(null);
  const [searchFocused, setSearchFocused] = useState(false);
  const [headerVisible, setHeaderVisible] = useState(true);
  const { search, setSearch, viewMode, setViewMode } = useFilters();

  // Show header on scroll up, hide on scroll down
  useEffect(() => {
    let lastScrollY = window.scrollY;
    const handleScroll = () => {
      const currentY = window.scrollY;
      if (currentY <= 0) {
        setHeaderVisible(true);
      } else if (currentY < lastScrollY) {
        // Scrolling up → show header
        setHeaderVisible(true);
      } else if (currentY > lastScrollY + 5) {
        // Scrolling down (threshold 5px to avoid micro-jitter) → hide header
        setHeaderVisible(false);
      }
      lastScrollY = currentY;
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    const checkUser = () => {
      const u = localStorage.getItem('film_username');
      if (!u) router.push('/');
      else setUsername(u);
      
      const av = localStorage.getItem('film_avatar');
      setAvatar(av);

      const b = localStorage.getItem('film_bio');
      setBio(b);
    };

    checkUser();
    window.addEventListener('storage', checkUser);
    return () => window.removeEventListener('storage', checkUser);
  }, [router]);

  const handleLogout = () => {
    localStorage.removeItem('film_username');
    localStorage.removeItem('film_password');
    router.replace('/');
  };

  if (!username) return null;

  return (
    <div className={`bg-[#0B1120] text-white flex flex-col relative selection:bg-indigo-500/30 ${pathname === '/dashboard/profile' ? 'h-screen overflow-hidden' : 'min-h-screen'}`}>
      <div className="absolute inset-0 overflow-x-hidden pointer-events-none" />
      <motion.header
        animate={{
          y: headerVisible ? 0 : -88,
          opacity: headerVisible ? 1 : 0,
        }}
        initial={{ y: -88, opacity: 0 }}
        transition={{
          duration: headerVisible ? 0.55 : 0.7,
          ease: headerVisible ? [0.16, 1, 0.3, 1] : [0.4, 0, 0.2, 1],
          opacity: { duration: headerVisible ? 0.4 : 0.6 }
        }}
        className="sticky top-0 z-40 w-full border-b border-blue-900/40"
        style={{
          background: 'rgba(11,17,32,0.88)',
          backdropFilter: 'blur(20px)',
        }}
      >
        <div className="max-w-[1550px] mx-auto px-2 md:px-6">
          <div className="flex items-center gap-1.5 md:gap-4 h-12 md:h-14">

            {/* ── Logo ── */}
            <div className="flex items-center gap-2.5 flex-none group cursor-pointer select-none">
              <div className="relative p-1.5 rounded-xl transition-all duration-300 group-hover:scale-105"
                style={{ background: 'linear-gradient(135deg, rgba(99,102,241,0.2), rgba(139,92,246,0.2))', border: '1px solid rgba(99,102,241,0.3)' }}>
                <motion.div
                  animate={{ scale: [1, 1.15, 1], opacity: [0.7, 1, 0.7] }}
                  transition={{ repeat: Infinity, duration: 2.5, ease: "easeInOut" }}
                >
                  <Clapperboard className="w-[18px] h-[18px] text-indigo-400 drop-shadow-[0_0_8px_rgba(99,102,241,0.8)]" />
                </motion.div>
                {/* Glow */}
                <div className="absolute inset-0 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-300 blur-md"
                  style={{ background: 'rgba(99,102,241,0.4)' }} />
              </div>

              <motion.span
                className="hidden sm:block text-[17px] font-black tracking-tight bg-clip-text text-transparent"
                style={{
                  backgroundImage: 'linear-gradient(90deg, #e2e8f0 0%, #a5b4fc 40%, #ffffff 50%, #a5b4fc 60%, #e2e8f0 100%)',
                  backgroundSize: '200% auto'
                }}
                animate={{ backgroundPosition: ['200% center', '-200% center'] }}
                transition={{ repeat: Infinity, duration: 3.5, ease: "linear" }}
              >
                ListV
              </motion.span>
            </div>

            {/* ── Header Actions ── */}
            {isDashboard ? (
              <>
                {/* ── Divider ── */}
                <div className="hidden sm:block w-px h-4 bg-white/10 flex-none" />

                {/* ── Search ── */}
                <div className={`relative flex-1 min-w-[120px] transition-all duration-300 sm:max-w-[280px] ${searchFocused ? 'sm:max-w-[340px]' : ''}`}>
                  <Search className={`w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none transition-colors duration-200 ${searchFocused ? 'text-indigo-400' : 'text-gray-600'}`} />
                  <input
                    type="text"
                    placeholder="Cari..."
                    value={search}
                    onChange={e => setSearch(e.target.value)}
                    onFocus={() => setSearchFocused(true)}
                    onBlur={() => setSearchFocused(false)}
                    className="w-full h-7 md:h-8 rounded-lg pl-7 md:pl-8 pr-7 text-[10px] md:text-xs text-white placeholder:text-gray-600 outline-none transition-all duration-200"
                    style={{
                      background: searchFocused ? 'rgba(99,102,241,0.08)' : 'rgba(255,255,255,0.05)',
                      border: `1px solid ${searchFocused ? 'rgba(99,102,241,0.4)' : 'rgba(255,255,255,0.07)'}`,
                      boxShadow: searchFocused ? '0 0 0 3px rgba(99,102,241,0.08)' : 'none',
                    }}
                  />
                  <AnimatePresence>
                    {search && (
                      <motion.div
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.8 }}
                        className="absolute right-0 top-0 bottom-0 w-7 flex items-center justify-center"
                      >
                        <button
                          onClick={() => setSearch('')}
                          className="w-3.5 h-3.5 md:w-4 md:h-4 flex items-center justify-center rounded-full bg-gray-500/20 text-gray-400 hover:bg-gray-500/40 hover:text-white transition-all duration-200"
                        >
                          <X className="w-2.5 h-2.5" strokeWidth={2.5} />
                        </button>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>

                {/* ── Spacer ── */}
                <div className="hidden sm:block flex-1" />

                {/* ── View Toggle ── */}
                <div className="flex bg-white/[0.04] p-0.5 md:p-1 rounded-lg border border-white/[0.08] mr-1 md:mr-2">
                  <button
                    onClick={() => setViewMode('list')}
                    className={`p-1 md:p-1.5 rounded-md transition-all ${viewMode === 'list' ? 'bg-indigo-500/20 text-indigo-400 shadow-sm' : 'text-gray-500 hover:text-gray-300 hover:bg-white/5'}`}
                    title="List View"
                  >
                    <List className="w-3 h-3 md:w-3.5 md:h-3.5" strokeWidth={2.5} />
                  </button>
                  <button
                    onClick={() => setViewMode('grid')}
                    className={`p-1 md:p-1.5 rounded-md transition-all ${viewMode === 'grid' ? 'bg-indigo-500/20 text-indigo-400 shadow-sm' : 'text-gray-500 hover:text-gray-300 hover:bg-white/5'}`}
                    title="Grid View"
                  >
                    <LayoutGrid className="w-3 h-3 md:w-3.5 md:h-3.5" strokeWidth={2.5} />
                  </button>
                </div>

                {/* ── Filter ── */}
                <FilterDropdown />
              </>
            ) : pathname === '/dashboard/profile' ? (
              <div className="flex-1 flex justify-start items-center ml-2 border-l border-white/10 pl-3 md:pl-4">
                <button 
                  onClick={() => router.push('/dashboard')}
                  className="mr-2 md:mr-3 p-1.5 rounded-lg bg-white/[0.03] border border-white/[0.08] hover:bg-white/[0.1] transition-all text-gray-400 hover:text-white"
                >
                  <ArrowLeft className="w-3.5 h-3.5 md:w-4 md:h-4" />
                </button>
                <div className="min-w-0">
                  <h1 className="text-[13px] md:text-[15px] font-black text-white tracking-tight truncate">Profil Saya</h1>
                </div>
              </div>
            ) : (
              <div className="flex-1" />
            )}

            {/* ── Divider ── */}
            <div className="w-px h-4 bg-white/10 flex-none" />

            {/* ── User ── */}
            <UserDropdown username={username} avatar={avatar} bio={bio} onLogout={handleLogout} />
          </div>
        </div>
      </motion.header>

      <main className={`flex-1 w-full relative z-10 ${pathname === '/dashboard/profile' ? 'overflow-hidden p-0' : 'max-w-[1550px] mx-auto px-2 md:px-6 py-3 md:py-6'}`}>
        {children}
      </main>
    </div>
  );
}

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <FilterProvider>
      <DashboardShell>{children}</DashboardShell>
    </FilterProvider>
  );
}
