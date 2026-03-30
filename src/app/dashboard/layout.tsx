'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { motion, AnimatePresence } from 'framer-motion';
import {
  LogOut, Clapperboard, Search, SlidersHorizontal,
  ChevronDown, User, X, LayoutGrid, List, ArrowLeft, FolderPlus, Link2
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
    <div ref={ref} className="relative flex-none" data-filter-dropdown>
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
              <Link href="/dashboard/stream" onClick={() => setOpen(false)} className="w-full flex items-center gap-2 md:gap-2.5 px-2 md:px-3 py-1.5 md:py-2 rounded-lg md:rounded-xl text-[10px] md:text-xs text-gray-400 hover:bg-white/[0.06] hover:text-gray-100 transition-all duration-150 group mt-0.5">
                <span className="w-5 h-5 md:w-6 md:h-6 rounded-md md:rounded-lg bg-white/5 flex items-center justify-center group-hover:bg-indigo-500/15 transition-colors">
                  <Link2 className="w-3 h-3 md:w-3.5 md:h-3.5" />
                </span>
                Link Stream
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

/* ── Mobile Bottom Bar ───────────────────────────────────── */
function MobileBottomBar({
  username, avatar, bio, onLogout, isDashboard
}: {
  username: string; avatar?: string | null; bio?: string | null;
  onLogout: () => void; isDashboard: boolean;
}) {
  const { viewMode, setViewMode, typeFilter, setTypeFilter, sortBy, setSortBy, statusFilter, setStatusFilter, setAddModalOpen } = useFilters();
  const [profileOpen, setProfileOpen] = useState(false);
  const [filterOpen, setFilterOpen] = useState(false);
  // Optimistic UI state for instant button feedback (INP fix)
  const [localViewMode, setLocalViewMode] = useState(viewMode);
  const profileRef = useRef<HTMLDivElement>(null);
  const filterRef = useRef<HTMLDivElement>(null);
  const profileBtnRef = useRef<HTMLButtonElement>(null);
  const filterBtnRef = useRef<HTMLButtonElement>(null);
  const initials = username.slice(0, 2).toUpperCase();

  // Sync local view mode with global context
  useEffect(() => {
    setLocalViewMode(viewMode);
  }, [viewMode]);

  const handleToggleView = () => {
    const next = localViewMode === 'list' ? 'grid' : 'list';
    // 1. Instant visual update for the button
    setLocalViewMode(next);
    // 2. Defer global context update so browser can paint the button first
    setTimeout(() => {
      setViewMode(next);
    }, 16);
  };

  // Close on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (
        profileRef.current && !profileRef.current.contains(e.target as Node) &&
        profileBtnRef.current && !profileBtnRef.current.contains(e.target as Node)
      ) {
        setProfileOpen(false);
      }
      if (
        filterRef.current && !filterRef.current.contains(e.target as Node) &&
        filterBtnRef.current && !filterBtnRef.current.contains(e.target as Node)
      ) {
        setFilterOpen(false);
      }
    };
    if (profileOpen || filterOpen) document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [profileOpen, filterOpen]);

  const activeFilterCount = [
    typeFilter !== 'Semua Kategori',
    sortBy !== 'ID A-Z',
    statusFilter !== 'Semua Status',
  ].filter(Boolean).length;

  const ChipGroup = ({ label, items, value, onChange }: {
    label: string; items: string[]; value: string; onChange: (v: string) => void;
  }) => (
    <div>
      <p className="text-[9px] font-black text-white/40 uppercase tracking-[0.15em] mb-2">{label}</p>
      <div className="flex flex-wrap gap-1.5">
        {items.map(v => {
          const active = value === v;
          const lbl = v.replace('Semua Kategori', 'Semua').replace('Semua Status', 'Semua');
          return (
            <button key={v} onClick={() => onChange(v)}
              className={`px-3 py-1.5 rounded-xl text-[10px] font-bold transition-all duration-200 border ${active
                ? 'bg-indigo-500 text-white border-indigo-500 shadow-lg shadow-indigo-500/20'
                : 'bg-white/[0.03] border-white/[0.05] text-gray-500 active:bg-white/[0.08]'
              }`}>
              {lbl}
            </button>
          );
        })}
      </div>
    </div>
  );

  return (
    <div className="md:hidden fixed bottom-0 left-0 right-0 z-[100]">
      {/* ── Popups ── */}
      <AnimatePresence>
        {profileOpen && (
          <motion.div
            ref={profileRef}
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            className="absolute bottom-[calc(100%+8px)] left-4 w-56 rounded-3xl border border-white/[0.08] shadow-2xl overflow-hidden backdrop-blur-2xl bg-[#0d121f]/95"
          >
            <div className="px-5 pt-5 pb-3.5 border-b border-white/[0.05] flex items-center gap-3.5">
              <div className="w-10 h-10 rounded-2xl flex items-center justify-center shrink-0 overflow-hidden ring-2 ring-indigo-500/20 shadow-inner"
                style={{ background: 'linear-gradient(135deg,#6366f1,#a855f7)' }}>
                {avatar
                  ? <Image src={avatar} alt="Avatar" width={40} height={40} className="w-full h-full object-cover" />
                  : <span className="text-xs font-black text-white">{initials}</span>}
              </div>
              <div className="min-w-0">
                <p className="text-[13px] font-black text-white truncate">{username}</p>
                <p className="text-[10px] text-gray-400 font-medium truncate">{bio || 'Premium User'}</p>
              </div>
            </div>
            <div className="p-2 space-y-1">
              <Link href="/dashboard/profile" onClick={() => setProfileOpen(false)}
                className="flex items-center gap-3 px-3.5 py-2.5 rounded-2xl text-[11px] font-bold text-gray-400 hover:bg-white/[0.05] hover:text-white transition-all active:scale-[0.98]">
                <User className="w-4 h-4 text-indigo-400" strokeWidth={2.5} />
                Edit Profil
              </Link>
              <Link href="/dashboard/stream" onClick={() => setProfileOpen(false)}
                className="flex items-center gap-3 px-3.5 py-2.5 rounded-2xl text-[11px] font-bold text-gray-400 hover:bg-white/[0.05] hover:text-white transition-all active:scale-[0.98]">
                <Link2 className="w-4 h-4 text-purple-400" strokeWidth={2.5} />
                Link Stream
              </Link>
              <button onClick={() => { setProfileOpen(false); onLogout(); }}
                className="w-full flex items-center gap-3 px-3.5 py-2.5 rounded-2xl text-[11px] font-bold text-gray-400 hover:bg-red-500/10 hover:text-red-400 transition-all active:scale-[0.98]">
                <LogOut className="w-4 h-4 text-red-400" strokeWidth={2.5} />
                Log Keluar
              </button>
            </div>
          </motion.div>
        )}

        {filterOpen && isDashboard && (
          <motion.div
            ref={filterRef}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
            transition={{ duration: 0.2, ease: "easeOut" }}
            className="absolute bottom-[calc(100%+8px)] left-4 right-4 rounded-3xl border border-white/[0.08] shadow-2xl overflow-hidden backdrop-blur-md md:backdrop-blur-2xl bg-[#0d121f]/95 p-5 space-y-5"
          >
            <ChipGroup label="Kategori Produk" items={['Semua Kategori','Film','Donghua','Anime','Series']} value={typeFilter} onChange={setTypeFilter} />
            <div className="h-px bg-white/[0.03]" />
            <ChipGroup label="Urut Berdasarkan" items={['ID A-Z','ID Z-A','Judul A-Z','Judul Z-A']} value={sortBy} onChange={setSortBy} />
            <div className="h-px bg-white/[0.03]" />
            <ChipGroup label="Status Nonton" items={['Semua Status','Selesai','Watching','Rencana','Ditunda']} value={statusFilter} onChange={setStatusFilter} />
            
            <button 
              onClick={() => { setTypeFilter('Semua Kategori'); setSortBy('ID A-Z'); setStatusFilter('Semua Status'); setFilterOpen(false); }}
              className="w-full pt-2 text-[10px] font-black text-indigo-400/60 uppercase tracking-widest text-center active:scale-95 transition-transform"
            >
              Hapus Semua Filter
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Bottom Navigation Bar ── */}
      <nav className="relative px-3 pb-safe-offset-4 pt-3 flex items-center justify-between gap-1 overflow-visible">
        {/* Background Layer */}
        <div className="absolute inset-0 z-[-1] bg-[#0b0f1a]/80 backdrop-blur-xl border-t border-white/5 rounded-t-[32px] md:hidden" 
             style={{ boxShadow: '0 -10px 40px rgba(0,0,0,0.6)' }} />

        {/* Tab: Profil */}
        <button
          ref={profileBtnRef}
          onClick={() => { setProfileOpen(o => !o); setFilterOpen(false); }}
          className="flex-1 flex flex-col items-center justify-center gap-1.5 py-1.5 active:scale-90 transition-transform duration-200"
        >
          <div className={`relative px-4 py-2 rounded-2xl transition-all duration-300 ${profileOpen ? 'bg-indigo-500/10' : ''}`}>
            <User className={`w-6 h-6 transition-colors duration-300 ${profileOpen ? 'text-indigo-400' : 'text-white/40'}`} strokeWidth={2.5} />
            {profileOpen && (
              <div className="absolute -bottom-1.5 left-1/2 -translate-x-1/2 w-1.5 h-1.5 rounded-full bg-indigo-500 shadow-[0_0_8px_rgba(99,102,241,1)] md:hidden block" />
            )}
            {profileOpen && (
              <motion.div layoutId="nav-dot" className="absolute -bottom-1.5 left-1/2 -translate-x-1/2 w-1.5 h-1.5 rounded-full bg-indigo-500 shadow-[0_0_8px_rgba(99,102,241,1)] hidden md:block" />
            )}
          </div>
          <span className={`text-[11px] font-black uppercase tracking-wider transition-colors duration-300 ${profileOpen ? 'text-indigo-400' : 'text-white/20'}`}>
            Akun
          </span>
        </button>

        {/* Tab: Filter */}
        {isDashboard && (
          <button
            ref={filterBtnRef}
            onClick={() => { setFilterOpen(o => !o); setProfileOpen(false); }}
            className="flex-1 flex flex-col items-center justify-center gap-1.5 py-1.5 active:scale-90 transition-transform duration-200"
          >
            <div className={`relative px-4 py-2 rounded-2xl transition-all duration-300 ${filterOpen ? 'bg-indigo-500/10' : ''}`}>
              <SlidersHorizontal className={`w-6 h-6 transition-colors duration-300 ${filterOpen ? 'text-indigo-400' : 'text-white/40'}`} strokeWidth={2.5} />
              {activeFilterCount > 0 && (
                <span className="absolute top-1 right-1 w-4 h-4 bg-indigo-500 text-white text-[10px] font-black rounded-full flex items-center justify-center ring-2 ring-[#0b0f1a]">
                  {activeFilterCount}
                </span>
              )}
              {filterOpen && (
                <div className="absolute -bottom-1.5 left-1/2 -translate-x-1/2 w-1.5 h-1.5 rounded-full bg-indigo-500 shadow-[0_0_8px_rgba(99,102,241,1)] md:hidden block" />
              )}
              {filterOpen && (
                <motion.div layoutId="nav-dot" className="absolute -bottom-1.5 left-1/2 -translate-x-1/2 w-1.5 h-1.5 rounded-full bg-indigo-500 shadow-[0_0_8px_rgba(99,102,241,1)] hidden md:block" />
              )}
            </div>
            <span className={`text-[11px] font-black uppercase tracking-wider transition-colors duration-300 ${filterOpen ? 'text-indigo-400' : 'text-white/20'}`}>
              Filter
            </span>
          </button>
        )}

        {/* Tab: Tambah */}
        {isDashboard && (
          <button
            onClick={() => { setAddModalOpen(true); setProfileOpen(false); setFilterOpen(false); }}
            className="flex-1 flex flex-col items-center justify-center gap-1.5 py-1.5 active:scale-90 transition-transform duration-200"
          >
            <div className="relative px-4 py-2 rounded-2xl bg-indigo-500/10 border border-indigo-500/20">
              <FolderPlus className="w-6 h-6 text-indigo-400" strokeWidth={2.5} />
            </div>
            <span className="text-[11px] font-black uppercase tracking-wider text-indigo-400">
              Tambah
            </span>
          </button>
        )}

        {/* Tab: Tampilan Toggle */}
        {isDashboard && (
          <button
            onClick={handleToggleView}
            className="flex-1 flex flex-col items-center justify-center gap-1.5 py-1.5 active:scale-90 transition-transform duration-150"
            aria-label="Toggle view mode"
          >
            <div className="relative px-4 py-2 rounded-2xl">
              {/* Grid icon */}
              <LayoutGrid
                className="w-6 h-6 text-white/40 absolute inset-0 m-auto transition-[opacity,transform] duration-150"
                style={{
                  opacity: localViewMode === 'list' ? 1 : 0,
                  transform: localViewMode === 'list' ? 'rotate(0deg) scale(1)' : 'rotate(90deg) scale(0.6)',
                  pointerEvents: 'none',
                }}
                strokeWidth={2.5}
              />
              {/* List icon */}
              <List
                className="w-6 h-6 text-indigo-400 transition-[opacity,transform] duration-150"
                style={{
                  opacity: localViewMode === 'grid' ? 1 : 0,
                  transform: localViewMode === 'grid' ? 'rotate(0deg) scale(1)' : 'rotate(-90deg) scale(0.6)',
                  pointerEvents: 'none',
                }}
                strokeWidth={2.5}
              />
            </div>
            <span className={`text-[11px] font-black uppercase tracking-wider transition-colors duration-150 ${localViewMode === 'grid' ? 'text-indigo-400' : 'text-white/20'}`}>
              Layout
            </span>
          </button>
        )}

        {/* Tab: Exit/Auth (Optional fallback or replacement for Profile if not on dashboard) */}
        {!isDashboard && (
          <button
            ref={profileBtnRef}
            onClick={() => { setProfileOpen(o => !o); }}
            className="flex-1 flex flex-col items-center justify-center gap-1.5 py-1.5 active:scale-90 transition-transform duration-200"
          >
             <div className="w-6 h-6 rounded-lg overflow-hidden ring-2 ring-white/10" style={{ background: 'linear-gradient(135deg,#6366f1,#a855f7)' }}>
                {avatar
                  ? <Image src={avatar} alt="av" width={24} height={24} className="w-full h-full object-cover" />
                  : <span className="flex items-center justify-center text-[9px] font-black text-white">{initials}</span>}
             </div>
             <span className="text-[11px] font-black uppercase tracking-wider text-white/20">Profil</span>
          </button>
        )}
      </nav>
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
          backdropFilter: typeof window !== 'undefined' && window.innerWidth < 768 ? 'blur(8px)' : 'blur(20px)',
        }}
      >
        <div className="max-w-[1550px] mx-auto px-3 md:px-6">
          <div className="flex items-center gap-3.5 md:gap-4 h-14 md:h-16">

            {/* ── Logo ── */}
            {isDashboard && (
              <div className="flex items-center gap-2.5 flex-none group cursor-pointer select-none">
                <div className="relative p-1.5 rounded-xl transition-all duration-300 group-hover:scale-105"
                  style={{ background: 'linear-gradient(135deg, rgba(99,102,241,0.2), rgba(139,92,246,0.2))', border: '1px solid rgba(99,102,241,0.3)' }}>
                  <motion.div
                    animate={{ scale: [1, 1.15, 1], opacity: [0.7, 1, 0.7] }}
                    transition={{ repeat: Infinity, duration: 2.5, ease: "easeInOut" }}
                  >
                    <Clapperboard className="w-6 h-6 md:w-7 md:h-7 text-indigo-400 drop-shadow-[0_0_8px_rgba(99,102,241,0.8)]" />
                  </motion.div>
                  {/* Glow */}
                  <div className="absolute inset-0 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-300 blur-md"
                    style={{ background: 'rgba(99,102,241,0.4)' }} />
                </div>

                <motion.span
                  className="block text-[19px] sm:text-[21px] font-black tracking-tight bg-clip-text text-transparent"
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
            )}

            {/* ── Header Actions ── */}
            {isDashboard ? (
              <>
                {/* ── Divider ── */}
                <div className="hidden sm:block w-px h-4 bg-white/10 flex-none" />

                {/* ── Search ── */}
                <div className={`relative ml-auto flex-1 min-w-[120px] max-w-[170px] transition-all duration-300 sm:max-w-[280px] ${searchFocused ? 'max-w-[230px] sm:max-w-[340px]' : ''}`}>
                  <Search className={`w-4 h-4 md:w-4.5 md:h-4.5 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none transition-colors duration-200 ${searchFocused ? 'text-indigo-400' : 'text-gray-600'}`} />
                  <input
                    type="text"
                    placeholder="Cari..."
                    value={search}
                    onChange={e => setSearch(e.target.value)}
                    onFocus={() => setSearchFocused(true)}
                    onBlur={() => setSearchFocused(false)}
                    className="w-full h-9 md:h-10 rounded-[10px] pl-9 p-3 md:pl-10 pr-8 text-xs md:text-sm text-white placeholder:text-gray-600 outline-none transition-all duration-200"
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
                          className="w-4 h-4 flex items-center justify-center rounded-full bg-gray-500/20 text-gray-400 hover:bg-gray-500/40 hover:text-white transition-all duration-200"
                        >
                          <X className="w-3 h-3" strokeWidth={2.5} />
                        </button>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>

                {/* ── Spacer ── */}
                <div className="hidden sm:block flex-1" />

                {/* ── View Toggle (desktop only) ── */}
                <div className="hidden md:flex bg-white/[0.04] p-0.5 md:p-1 rounded-lg border border-white/[0.08] mr-1 md:mr-2">
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

                {/* ── Filter (desktop only) ── */}
                <div className="hidden md:block">
                  <FilterDropdown />
                </div>
              </>
            ) : (pathname === '/dashboard/profile' || pathname === '/dashboard/stream') ? (
              <div className="flex-1 flex justify-start items-center md:pl-2">
                <button 
                  onClick={() => router.push('/dashboard')}
                  className="mr-3 md:mr-4 p-2 rounded-xl bg-white/[0.03] border border-white/[0.08] hover:bg-white/[0.1] transition-all text-gray-400 hover:text-white shadow-sm"
                >
                  <ArrowLeft className="w-4 h-4 md:w-5 md:h-5" />
                </button>
                <div className="min-w-0">
                  <h1 className="text-[15px] md:text-[17px] font-black text-white tracking-tight truncate">
                    {pathname === '/dashboard/profile' ? 'Profil Saya' : 'Link Stream'}
                  </h1>
                </div>
              </div>
            ) : (
              <div className="flex-1" />
            )}

            {/* ── Divider ── */}
            <div className="hidden md:block w-px h-4 bg-white/10 flex-none" />

            {/* ── User (desktop only) ── */}
            <div className="hidden md:block">
              <UserDropdown username={username} avatar={avatar} bio={bio} onLogout={handleLogout} />
            </div>
          </div>
        </div>
      </motion.header>

      <main className={`flex-1 w-full relative z-10 ${pathname === '/dashboard/profile' ? 'overflow-hidden p-0' : 'max-w-[1550px] mx-auto px-2 md:px-6 py-3 md:py-6 pb-24 md:pb-6'}`}>
        {children}
      </main>

      {/* ── Mobile Bottom Bar ── */}
      {isDashboard && (
        <MobileBottomBar
          username={username}
          avatar={avatar}
          bio={bio}
          onLogout={handleLogout}
          isDashboard={isDashboard}
        />
      )}
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
