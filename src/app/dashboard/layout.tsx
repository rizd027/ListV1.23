'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';

import {
  LogOut, Clapperboard, Search, SlidersHorizontal,
  ChevronDown, User, X, LayoutGrid, List, ArrowLeft, FolderPlus, Link2, Loader2
} from 'lucide-react';
import { FilterProvider, useFilters } from '@/context/FilterContext';
import { useSyncEngine } from '@/context/SyncContext';
import { useBackInterceptor } from '@/hooks/useBackInterceptor';

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
      <p className="text-[10px] md:text-[11px] font-bold text-slate-300 uppercase tracking-wider mb-2">{label}</p>
      <div className="flex flex-wrap gap-1.5">
        {items.map(v => {
          const active = value === v;
          const label = v.replace('Semua Kategori', 'Semua').replace('Semua Status', 'Semua');
          return (
            <button key={v} onClick={() => onChange(v)}
              className={`px-2.5 py-1 md:px-3 md:py-1.5 rounded-md text-[10px] md:text-xs font-semibold transition-all duration-150 border ${active
                ? 'bg-indigo-500 text-white border-indigo-400 shadow-sm'
                : 'bg-[#141c33] border-white/[0.1] text-slate-300 hover:bg-[#1b2544] hover:text-white hover:border-white/[0.2]'
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
        className={`relative flex items-center gap-1.5 md:gap-2 h-8 md:h-9 px-2.5 md:px-3.5 rounded-lg text-xs font-semibold transition-all duration-200 border ${open
          ? 'bg-indigo-500/20 border-indigo-500/50 text-indigo-300'
          : 'bg-[#11192e] border-white/[0.12] text-slate-200 hover:bg-[#16203a] hover:text-white hover:border-white/[0.2]'
          }`}>
        <SlidersHorizontal className="w-3.5 h-3.5 text-indigo-400" />
        <span className="hidden sm:inline">Filter</span>
        {activeCount > 0 && (
          <span className="absolute -top-1.5 -right-1.5 bg-indigo-500 text-white text-[9px] font-bold rounded-full w-4 h-4 flex items-center justify-center shadow-sm">
            {activeCount}
          </span>
        )}
        <ChevronDown className={`w-3.5 h-3.5 text-slate-400 transition-transform duration-200 ${open ? 'rotate-180' : ''}`} />
      </button>

      {open && (
          <div
            className="absolute right-0 top-full mt-2 w-[270px] md:w-80 max-w-[calc(100vw-24px)] max-h-[85vh] overflow-y-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden z-50 rounded-xl border border-white/[0.12] shadow-2xl shadow-black/80"
            style={{ background: '#0d1326', backdropFilter: 'blur(20px)' }}
          >

            <div className="px-3.5 py-3 md:px-4 md:py-3.5 space-y-3.5 md:space-y-4">
              <ChipGroup label="Kategori"
                items={['Semua Kategori', 'Film', 'Donghua', 'Anime', 'Series']}
                value={typeFilter} onChange={setTypeFilter} />
              <div className="h-px bg-white/[0.08]" />
              <ChipGroup label="Urutan"
                items={['ID A-Z', 'ID Z-A', 'Judul A-Z', 'Judul Z-A']}
                value={sortBy} onChange={setSortBy} />
              <div className="h-px bg-white/[0.08]" />
              <ChipGroup label="Status"
                items={['Semua Status', 'Selesai', 'Watching', 'Rencana', 'Ditunda']}
                value={statusFilter} onChange={setStatusFilter} />
            </div>

            <div className="px-3.5 py-2.5 md:px-4 md:py-3 border-t border-white/[0.08] flex justify-end">
              <button
                onClick={() => { setTypeFilter('Semua Kategori'); setSortBy('ID A-Z'); setStatusFilter('Semua Status'); }}
                className="text-[11px] md:text-xs text-indigo-400 hover:text-indigo-300 transition-colors font-bold">
                Reset Semua Filter
              </button>
            </div>
          </div>
        )}
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
        className={`flex items-center gap-2 h-8 md:h-9 pl-1.5 pr-2.5 md:pr-3 rounded-lg border transition-all duration-200 ${open ? 'bg-indigo-500/20 border-indigo-500/50' : 'bg-[#11192e] border-white/[0.12] hover:bg-[#16203a] hover:border-white/[0.2]'
          }`}>
        {/* Avatar */}
        <div className="relative w-6 h-6 rounded-md flex items-center justify-center overflow-hidden shadow-sm"
          style={{ background: 'linear-gradient(135deg, #6366f1, #8b5cf6)' }}>
          {avatar ? (
            <Image src={avatar} alt="Avatar" width={24} height={24} className="w-full h-full object-cover" />
          ) : (
            <span className="text-[10px] font-bold text-white">{initials}</span>
          )}
        </div>
        <span className="hidden sm:block text-xs font-semibold text-slate-200">{username}</span>
        <ChevronDown className={`w-3.5 h-3.5 text-slate-400 transition-transform duration-200 ${open ? 'rotate-180' : ''}`} />
      </button>

      {open && (
          <div
            className="absolute right-0 top-full mt-2 w-[210px] md:w-56 max-h-[85vh] overflow-y-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden z-50 rounded-xl border border-white/[0.12] shadow-2xl shadow-black/80"
            style={{ background: '#0d1326', backdropFilter: 'blur(20px)' }}
          >
            {/* Profile card */}
            <div className="px-3.5 md:px-4 pt-3.5 md:pt-4 pb-2.5 md:pb-3 border-b border-white/[0.08]">
              <div className="flex items-center gap-2.5 md:gap-3">
                <div className="relative w-9 h-9 md:w-10 md:h-10 rounded-lg flex items-center justify-center flex-none shadow-lg shadow-indigo-500/20 overflow-hidden"
                  style={{ background: 'linear-gradient(135deg, #6366f1, #8b5cf6)' }}>
                  {avatar ? (
                    <Image src={avatar} alt="Avatar" width={40} height={40} className="w-full h-full object-cover" />
                  ) : (
                    <span className="text-xs md:text-sm font-black text-white">{initials}</span>
                  )}
                </div>
                <div className="min-w-0">
                  <p className="text-xs md:text-sm font-bold text-white truncate">{username}</p>
                  <p className="text-[10px] text-slate-300 mt-0.5 truncate leading-tight">
                    {bio || 'Administrator'}
                  </p>
                </div>
              </div>
            </div>

            {/* Menu */}
            <div className="p-1.5 md:p-2 space-y-0.5">
              <Link href="/dashboard/profile" onClick={() => setOpen(false)} className="w-full flex items-center gap-2.5 px-2.5 md:px-3 py-2 rounded-lg text-xs font-medium text-slate-200 hover:bg-white/[0.08] hover:text-white transition-colors duration-150">
                <User className="w-4 h-4 text-indigo-400" />
                Profil Saya
              </Link>
              <Link href="/dashboard/stream" onClick={() => setOpen(false)} className="w-full flex items-center gap-2.5 px-2.5 md:px-3 py-2 rounded-lg text-xs font-medium text-slate-200 hover:bg-white/[0.08] hover:text-white transition-colors duration-150">
                <Link2 className="w-4 h-4 text-indigo-400" />
                Link Stream
              </Link>
              <div className="h-px bg-white/[0.08] my-1 mx-2" />
              <button onClick={() => { setOpen(false); onLogout(); }}
                className="w-full flex items-center gap-2.5 px-2.5 md:px-3 py-2 rounded-lg text-xs font-semibold text-rose-400 hover:bg-rose-500/15 hover:text-rose-300 transition-colors duration-150">
                <LogOut className="w-4 h-4 text-rose-400" />
                Keluar
              </button>
            </div>
          </div>
        )}
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
  const router = useRouter();
  const { viewMode, setViewMode, typeFilter, setTypeFilter, sortBy, setSortBy, statusFilter, setStatusFilter, setAddModalOpen } = useFilters();
  const [profileOpen, setProfileOpen] = useState(false);
  const [filterOpen, setFilterOpen] = useState(false);
  useBackInterceptor(profileOpen, () => setProfileOpen(false), 'profileOpen');
  useBackInterceptor(filterOpen, () => setFilterOpen(false), 'filterOpen');
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
    <div className="space-y-2">
      <p className="text-[10px] font-bold text-slate-300 uppercase tracking-wider">{label}</p>
      <div className="flex flex-wrap gap-1.5">
        {items.map(v => {
          const active = value === v;
          const lbl = v.replace('Semua Kategori', 'Semua').replace('Semua Status', 'Semua');
          return (
            <button key={v} onClick={() => onChange(v)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all border ${active
                ? 'bg-indigo-500 text-white border-indigo-400 shadow-sm'
                : 'bg-[#141d35] border-white/[0.1] text-slate-300 hover:text-white hover:bg-[#1c2746]'
              }`}>
              {lbl}
            </button>
          );
        })}
      </div>
    </div>
  );

  return (
    <div className="md:hidden fixed bottom-5 left-4 right-4 z-[100] max-w-[480px] mx-auto">
      {/* ── Popups ── */}
        {profileOpen && (
          <div
            ref={profileRef}
            className="absolute bottom-[calc(100%+10px)] left-0 w-64 rounded-xl border border-white/[0.14] shadow-2xl overflow-hidden bg-[#0d1326]/98 backdrop-blur-2xl p-2"
          >
            <div className="px-3.5 py-3 border-b border-white/[0.08] flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0 overflow-hidden shadow-md"
                style={{ background: 'linear-gradient(135deg,#6366f1,#8b5cf6)' }}>
                {avatar
                  ? <Image src={avatar} alt="Avatar" width={36} height={36} className="w-full h-full object-cover" />
                  : <span className="text-[11px] font-black text-white">{initials}</span>}
              </div>
              <div className="min-w-0">
                <p className="text-[13px] font-bold text-white truncate">{username}</p>
                <p className="text-[10px] text-slate-300 truncate mt-0.5">{bio || 'Premium User'}</p>
              </div>
            </div>
            <div className="p-1 space-y-1">
              <button
                type="button"
                onClick={() => {
                  setProfileOpen(false);
                  setTimeout(() => router.push('/dashboard/profile'), 120);
                }}
                className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-xs font-semibold text-slate-200 hover:bg-white/[0.08] hover:text-white transition-all active:scale-[0.98]"
              >
                <User className="w-4 h-4 text-indigo-400" strokeWidth={2} />
                Edit Profil
              </button>
              <button
                type="button"
                onClick={() => {
                  setProfileOpen(false);
                  setTimeout(() => router.push('/dashboard/stream'), 120);
                }}
                className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-xs font-semibold text-slate-200 hover:bg-white/[0.08] hover:text-white transition-all active:scale-[0.98]"
              >
                <Link2 className="w-4 h-4 text-indigo-400" strokeWidth={2} />
                Link Stream
              </button>
              <div className="h-px bg-white/[0.08] my-1 mx-2" />
              <button
                type="button"
                onClick={() => {
                  setProfileOpen(false);
                  setTimeout(() => onLogout(), 120);
                }}
                className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-xs font-bold text-rose-400 hover:bg-rose-500/15 hover:text-rose-300 transition-all active:scale-[0.98]"
              >
                <LogOut className="w-4 h-4 text-rose-400" strokeWidth={2} />
                Log Keluar
              </button>
            </div>
          </div>
        )}

        {filterOpen && isDashboard && (
          <div
            ref={filterRef}
            className="absolute bottom-[calc(100%+10px)] left-0 right-0 max-h-[75vh] overflow-y-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden rounded-xl border border-white/[0.14] shadow-2xl bg-[#0d1326]/98 backdrop-blur-2xl p-4 md:p-5 space-y-4"
          >
            <ChipGroup label="Kategori Produk" items={['Semua Kategori','Film','Donghua','Anime','Series']} value={typeFilter} onChange={setTypeFilter} />
            <div className="h-px bg-white/[0.08]" />
            <ChipGroup label="Urut Berdasarkan" items={['ID A-Z','ID Z-A','Judul A-Z','Judul Z-A']} value={sortBy} onChange={setSortBy} />
            <div className="h-px bg-white/[0.08]" />
            <ChipGroup label="Status Nonton" items={['Semua Status','Selesai','Watching','Rencana','Ditunda']} value={statusFilter} onChange={setStatusFilter} />
            
            <button 
              onClick={() => { setTypeFilter('Semua Kategori'); setSortBy('ID A-Z'); setStatusFilter('Semua Status'); setFilterOpen(false); }}
              className="w-full pt-2 text-[11px] font-bold text-indigo-400 hover:text-indigo-300 uppercase tracking-widest text-center transition-colors active:scale-95"
            >
              Hapus Semua Filter
            </button>
          </div>
        )}

      {/* ── Bottom Navigation Bar ── */}
      <nav className="relative px-3 py-2 flex items-center justify-between gap-1.5 rounded-xl bg-[#0a0f1d]/95 backdrop-blur-2xl border border-white/[0.12] shadow-[0_8px_32px_rgba(0,0,0,0.8)]">
        
        {/* Tab: Profil */}
        <button
          ref={profileBtnRef}
          onClick={() => { setProfileOpen(o => !o); setFilterOpen(false); }}
          className="relative flex-1 flex flex-col items-center justify-center py-1 transition-colors duration-200 active:scale-95"
        >
          {profileOpen && (
            <div className="absolute inset-x-1 inset-y-0.5 bg-white/[0.08] border border-white/[0.08] rounded-lg z-0" />
          )}
          <div className="relative z-10 flex flex-col items-center">
            <User className={`w-5 h-5 transition-colors duration-200 ${profileOpen ? 'text-indigo-400' : 'text-slate-300'}`} strokeWidth={2} />
            <span className={`text-[10px] font-semibold tracking-wide mt-0.5 transition-colors duration-200 ${profileOpen ? 'text-indigo-400 font-bold' : 'text-slate-400'}`}>
              Profil
            </span>
          </div>
        </button>

        {/* Tab: Filter */}
        {isDashboard && (
          <button
            ref={filterBtnRef}
            onClick={() => { setFilterOpen(o => !o); setProfileOpen(false); }}
            className="relative flex-1 flex flex-col items-center justify-center py-1 transition-colors duration-200 active:scale-95"
          >
            {filterOpen && (
              <div className="absolute inset-x-1 inset-y-0.5 bg-white/[0.08] border border-white/[0.08] rounded-lg z-0" />
            )}
            <div className="relative z-10 flex flex-col items-center">
              <div className="relative">
                <SlidersHorizontal className={`w-5 h-5 transition-colors duration-200 ${filterOpen ? 'text-indigo-400' : 'text-slate-300'}`} strokeWidth={2} />
                {activeFilterCount > 0 && (
                  <span className="absolute -top-1.5 -right-1.5 w-3.5 h-3.5 bg-indigo-500 text-white text-[8px] font-bold rounded-full flex items-center justify-center ring-1 ring-[#090D1A]">
                    {activeFilterCount}
                  </span>
                )}
              </div>
              <span className={`text-[10px] font-semibold tracking-wide mt-0.5 transition-colors duration-200 ${filterOpen ? 'text-indigo-400 font-bold' : 'text-slate-400'}`}>
                Filter
              </span>
            </div>
          </button>
        )}

        {/* Tab: Tambah */}
        {isDashboard && (
          <button
            onClick={() => { setAddModalOpen(true); setProfileOpen(false); setFilterOpen(false); }}
            className="relative flex-1 flex flex-col items-center justify-center py-1 transition-colors duration-200 active:scale-95"
          >
            <div className="relative z-10 flex flex-col items-center">
              <div className="p-1 rounded-lg bg-indigo-500/20 border border-indigo-500/40 text-indigo-400">
                <FolderPlus className="w-5 h-5" strokeWidth={2} />
              </div>
              <span className="text-[10px] font-bold tracking-wide mt-0.5 text-indigo-400">
                Tambah
              </span>
            </div>
          </button>
        )}

        {/* Tab: Tampilan Toggle */}
        {isDashboard && (
          <button
            onClick={handleToggleView}
            className="relative flex-1 flex flex-col items-center justify-center py-1 transition-colors duration-200 active:scale-95"
            aria-label="Toggle view mode"
          >
            <div className="relative z-10 flex flex-col items-center">
              <div className="relative w-5 h-5 flex items-center justify-center">
                {/* Grid icon */}
                <LayoutGrid
                  className="w-5 h-5 text-slate-300 absolute transition-all duration-200"
                  style={{
                    opacity: localViewMode === 'list' ? 1 : 0,
                    transform: localViewMode === 'list' ? 'rotate(0deg) scale(1)' : 'rotate(90deg) scale(0.6)',
                  }}
                  strokeWidth={2}
                />
                {/* List icon */}
                <List
                  className="w-5 h-5 text-slate-300 absolute transition-all duration-200"
                  style={{
                    opacity: localViewMode === 'grid' ? 1 : 0,
                    transform: localViewMode === 'grid' ? 'rotate(0deg) scale(1)' : 'rotate(-90deg) scale(0.6)',
                  }}
                  strokeWidth={2}
                />
              </div>
              <span className="text-[10px] font-semibold tracking-wide mt-0.5 text-slate-400">
                Layout
              </span>
            </div>
          </button>
        )}

        {/* Tab: Exit/Auth (Optional fallback or replacement for Profile if not on dashboard) */}
        {!isDashboard && (
          <button
            ref={profileBtnRef}
            onClick={() => { setProfileOpen(o => !o); }}
            className="relative flex-1 flex flex-col items-center justify-center py-1 transition-colors duration-200 active:scale-95"
          >
             {profileOpen && (
               <div className="absolute inset-x-1 inset-y-0.5 bg-white/[0.05] border border-white/[0.04] rounded z-0" />
             )}
             <div className="relative z-10 flex flex-col items-center">
               <div className="w-5 h-5 rounded-sm overflow-hidden ring-1 ring-white/10" style={{ background: 'linear-gradient(135deg,#6366f1,#8b5cf6)' }}>
                  {avatar
                    ? <Image src={avatar} alt="av" width={20} height={20} className="w-full h-full object-cover" />
                    : <span className="flex items-center justify-center text-[8px] font-bold text-white">{initials}</span>}
               </div>
               <span className={`text-[9px] font-semibold tracking-wide mt-0.5 transition-colors duration-200 ${profileOpen ? 'text-indigo-400' : 'text-gray-500'}`}>
                 Profil
               </span>
             </div>
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
  const { isOnline, isSyncing, pendingCount } = useSyncEngine();

  // Show header on scroll up, hide on scroll down (throttled to state transitions only)
  useEffect(() => {
    let lastScrollY = window.scrollY;
    let visible = true;
    const handleScroll = () => {
      const currentY = window.scrollY;
      if (currentY <= 15) {
        if (!visible) {
          visible = true;
          setHeaderVisible(true);
        }
      } else if (currentY < lastScrollY - 6) {
        // Scrolling up
        if (!visible) {
          visible = true;
          setHeaderVisible(true);
        }
      } else if (currentY > lastScrollY + 8) {
        // Scrolling down
        if (visible) {
          visible = false;
          setHeaderVisible(false);
        }
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
      <header
        className="sticky top-0 z-40 w-full border-b border-white/[0.08] transition-transform duration-300"
        style={{
          background: 'rgba(10,15,29,0.95)',
          backdropFilter: 'blur(20px)',
          transform: headerVisible ? 'translateY(0)' : 'translateY(-100%)',
        }}
      >
        <div className="max-w-[1550px] mx-auto px-3 md:px-6">
          <div className="flex items-center gap-3.5 md:gap-4 h-14 md:h-16">

            {/* ── Logo ── */}
            {isDashboard && (
              <div className="flex items-center gap-2.5 flex-none cursor-pointer select-none">
                <div className="relative p-1.5 rounded-lg"
                  style={{ background: 'rgba(99,102,241,0.15)', border: '1px solid rgba(99,102,241,0.3)' }}>
                  {isSyncing ? (
                    <Loader2 className="w-6 h-6 md:w-7 md:h-7 text-indigo-400 animate-spin" />
                  ) : (
                    <Image
                      src="/listv-logo.png"
                      alt="ListV Logo"
                      width={28}
                      height={28}
                      className="w-6 h-6 md:w-7 md:h-7 rounded object-contain"
                    />
                  )}
                  {/* Status dot */}
                  {!isSyncing && (
                    <span 
                      className={`absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full border border-[#0a0f1d] z-20 transition-colors duration-300
                        ${!isOnline ? 'bg-red-500' : 
                          pendingCount > 0 ? 'bg-amber-500' : 
                          'bg-emerald-500'}`} 
                     />
                  )}
                </div>
                <span className="text-[18px] sm:text-[20px] font-extrabold tracking-tight text-white">
                  ListV
                </span>
              </div>
            )}

            {/* ── Header Actions ── */}
            {isDashboard ? (
              <>


                {/* ── Search ── */}
                <div className={`relative ml-auto flex-1 min-w-[120px] max-w-[170px] transition-all duration-300 sm:max-w-[280px] ${searchFocused ? 'max-w-[230px] sm:max-w-[340px]' : ''}`}>
                  <Search className={`w-4 h-4 md:w-4.5 md:h-4.5 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none transition-colors duration-200 ${searchFocused ? 'text-indigo-400' : 'text-slate-400'}`} />
                  <input
                    type="text"
                    placeholder="Cari..."
                    value={search}
                    onChange={e => setSearch(e.target.value)}
                    onFocus={() => setSearchFocused(true)}
                    onBlur={() => setSearchFocused(false)}
                    className="w-full h-9 md:h-10 rounded-lg pl-9 p-3 md:pl-10 pr-8 text-xs md:text-sm text-white placeholder:text-slate-400 outline-none transition-all duration-200"
                    style={{
                      background: searchFocused ? 'rgba(99,102,241,0.12)' : '#11192e',
                      border: `1px solid ${searchFocused ? 'rgba(99,102,241,0.5)' : 'rgba(255,255,255,0.14)'}`,
                      boxShadow: searchFocused ? '0 0 0 3px rgba(99,102,241,0.15)' : 'none',
                    }}
                  />
                  {search && (
                      <button
                        onClick={() => setSearch('')}
                        className="absolute right-2.5 top-1/2 -translate-y-1/2 w-4 h-4 flex items-center justify-center text-slate-400 hover:text-white transition-colors"
                      >
                        <X className="w-3.5 h-3.5" strokeWidth={2} />
                      </button>
                    )}
                </div>

                {/* ── Spacer ── */}
                <div className="hidden sm:block flex-1" />

                {/* ── View Toggle (desktop only) ── */}
                <div className="hidden md:flex bg-[#11192e] p-1 rounded-lg border border-white/[0.12] mr-1 md:mr-2">
                  <button
                    onClick={() => setViewMode('list')}
                    className={`p-1.5 rounded-md transition-all ${viewMode === 'list' ? 'bg-indigo-500/25 text-indigo-300 shadow-sm' : 'text-slate-400 hover:text-slate-200'}`}
                    title="List View"
                  >
                    <List className="w-3.5 h-3.5" strokeWidth={2} />
                  </button>
                  <button
                    onClick={() => setViewMode('grid')}
                    className={`p-1.5 rounded-md transition-all ${viewMode === 'grid' ? 'bg-indigo-500/25 text-indigo-300 shadow-sm' : 'text-slate-400 hover:text-slate-200'}`}
                    title="Grid View"
                  >
                    <LayoutGrid className="w-3.5 h-3.5" strokeWidth={2} />
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
                  className="mr-3 md:mr-4 p-1.5 rounded text-gray-400 hover:text-white hover:bg-white/[0.05] transition-colors"
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
      </header>

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
