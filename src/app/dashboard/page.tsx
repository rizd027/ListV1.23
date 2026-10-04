'use client';

import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { Film } from '@/lib/api';
import { Loader2, Edit2, Trash2, CheckCircle2, Activity, Eye, Calendar, Link as LinkIcon, FolderPlus, Film as FilmIcon, ChevronDown, WifiOff, Plus } from 'lucide-react';
import { FilmModal } from '@/components/ui/FilmModal';
import { AlertModal } from '@/components/ui/AlertModal';
import { useFilters } from '@/context/FilterContext';
import { useToast } from '@/context/ToastContext';
import { pushOfflineAction } from '@/lib/sync';
import { useSyncEngine } from '@/context/SyncContext';
import { fetchFilmData } from '@/lib/api';

// ── Stat Card (memoized to prevent re-render from parent) ──
const StatCard = ({
  label, value, color, Icon, isActive, loading, onClick
}: {
  label: string; value: number; color: string;
  Icon: React.ComponentType<{ className?: string }>;
  isActive: boolean; loading: boolean;
  onClick: () => void;
}) => (
  <button
    onClick={onClick}
    className={`text-left p-3.5 md:p-4 rounded-xl border transition-all duration-200 group
      ${isActive
        ? 'bg-indigo-950/50 border-indigo-500/60 shadow-[0_0_20px_rgba(99,102,241,0.2)]'
        : 'bg-[#0e1528] border-white/[0.1] hover:border-indigo-500/40 hover:bg-[#121c35]'
      }`}
  >
    <div className="flex items-center justify-between mb-2.5">
      <span className="text-[11px] font-bold text-slate-300 uppercase tracking-wider">{label}</span>
      <Icon className={`w-4 h-4 ${color} opacity-90`} />
    </div>
    <p className="text-2xl md:text-3xl font-extrabold text-white">
      {loading ? <Loader2 className="w-5 h-5 animate-spin opacity-40 text-indigo-400" /> : value}
    </p>
  </button>
);

// ── Film Row (memoized, prevents grid/table row re-render) ──
const GridCard = React.memo(({ film, onEdit, onDelete }: {
  film: Film;
  onEdit: (film: Film) => void;
  onDelete: (rowIndex: number, id: number) => void;
}) => (
  <div
    onClick={() => onEdit(film)}
    className="relative group flex flex-col bg-[#0e1528] hover:bg-[#121c35] border border-white/[0.1] hover:border-indigo-500/50 rounded-xl p-4 md:p-5 transition-all shadow-md hover:shadow-xl hover:shadow-black/50 overflow-hidden cursor-pointer"
  >
    {/* Top row: ID + Actions */}
    <div className="flex justify-between items-start mb-3">
      <span className="text-[10px] font-mono font-bold text-indigo-300 bg-indigo-500/15 border border-indigo-500/30 px-2 py-0.5 rounded">
        #{film.id}
      </span>
      <div className="flex gap-1.5 opacity-90 md:opacity-0 group-hover:opacity-100 transition-opacity duration-150" onClick={e => e.stopPropagation()}>
        <button
          onClick={(e) => { e.stopPropagation(); onEdit(film); }}
          className="p-1.5 text-slate-300 hover:text-white bg-white/[0.08] hover:bg-white/[0.16] border border-white/[0.1] transition-colors rounded-md"
          title="Edit"
        >
          <Edit2 className="w-3.5 h-3.5" />
        </button>
        <button
          onClick={(e) => { e.stopPropagation(); onDelete(film.rowIndex, film.id); }}
          className="p-1.5 text-slate-300 hover:text-rose-300 bg-white/[0.08] hover:bg-rose-500/20 border border-white/[0.1] hover:border-rose-500/30 transition-colors rounded-md"
          title="Hapus"
        >
          <Trash2 className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>

    <h3 className="text-[14px] md:text-[15px] font-bold text-white group-hover:text-indigo-200 leading-snug line-clamp-2 mb-3 transition-colors">
      {film.title}
    </h3>

    <div className="flex items-center gap-2 mb-3 flex-wrap">
      <span className="inline-block px-2.5 py-0.5 text-[10px] font-semibold text-indigo-300 bg-indigo-500/15 border border-indigo-500/30 rounded">
        {film.type}
      </span>
      <span className={`inline-block px-2.5 py-0.5 text-[10px] font-bold rounded border
        ${film.status === 'Selesai' ? 'text-emerald-300 bg-emerald-500/15 border-emerald-500/35' :
          film.status === 'Watching' ? 'text-amber-300 bg-amber-500/15 border-amber-500/35' :
          film.status === 'Rencana' ? 'text-sky-300 bg-sky-500/15 border-sky-500/35' :
          'text-rose-300 bg-rose-500/15 border-rose-500/35'}`}
      >
        {film.status}
      </span>
      {film.episodes && (
        <span className="text-[10px] font-mono font-semibold text-indigo-300 bg-indigo-500/10 border border-indigo-500/20 px-2 py-0.5 rounded">
          {film.episodes} eps
        </span>
      )}
    </div>

    {film.cast && (
      <p className="text-[12px] text-slate-300 line-clamp-1 mb-2 font-medium">{film.cast}</p>
    )}

    <div className="mt-auto pt-3 flex items-center justify-between border-t border-white/[0.08]">
      <span className="text-[11px] font-medium text-slate-400">{formatDate(film.date)}</span>
      {film.link && (
        <a
          href={film.link}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-1.5 text-[11px] font-semibold text-indigo-300 hover:text-white bg-indigo-500/15 hover:bg-indigo-500/25 border border-indigo-500/30 px-2.5 py-0.5 rounded transition-colors"
          onClick={e => e.stopPropagation()}
        >
          <LinkIcon className="w-3 h-3" />
          Link
        </a>
      )}
    </div>
  </div>
));
GridCard.displayName = 'GridCard';

const TableRow = React.memo(({ film, index, onEdit, onDelete }: {
  film: Film; index: number;
  onEdit: (film: Film) => void;
  onDelete: (rowIndex: number, id: number) => void;
}) => (
  <tr
    onClick={() => onEdit(film)}
    className="border-b border-white/[0.06] last:border-0 hover:bg-white/[0.04] transition-colors group cursor-pointer"
  >
    <td className="px-3 py-3.5 pl-5 text-[11px] font-mono font-bold text-indigo-300">#{film.id}</td>
    <td className="px-3 py-3.5">
      <span className="text-[13px] font-semibold text-white group-hover:text-indigo-200 line-clamp-1 transition-colors">
        {film.title}
      </span>
    </td>
    <td className="px-3 py-3.5 text-[12px] text-slate-300 max-w-[180px] truncate font-medium" title={film.cast}>{film.cast || '—'}</td>
    <td className="px-3 py-3.5">
      <span className="px-2.5 py-0.5 text-[10px] font-semibold text-indigo-300 bg-indigo-500/15 border border-indigo-500/30 rounded">
        {film.type}
      </span>
    </td>
    <td className="px-3 py-3.5 text-center text-[12px] font-mono font-bold text-indigo-300">{film.episodes || '—'}</td>
    <td className="px-3 py-3.5">
      <span className={`px-2 py-0.5 text-[10px] font-bold tracking-wide uppercase border rounded
        ${film.status === 'Selesai' ? 'bg-emerald-500/15 text-emerald-300 border-emerald-500/35' :
          film.status === 'Watching' ? 'bg-amber-500/15 text-amber-300 border-amber-500/35' :
          film.status === 'Rencana' ? 'bg-sky-500/15 text-sky-300 border-sky-500/35' :
          'bg-rose-500/15 text-rose-300 border-rose-500/35'}`}
      >
        {film.status}
      </span>
    </td>
    <td className="px-3 py-3.5 text-[11px] font-medium text-slate-400">{formatDate(film.date)}</td>
    <td className="px-3 py-3.5 text-center" onClick={e => e.stopPropagation()}>
      {film.link ? (
        <a href={film.link} target="_blank" rel="noopener noreferrer"
          className="inline-flex items-center justify-center w-7 h-7 text-indigo-300 hover:text-white bg-indigo-500/15 hover:bg-indigo-500/25 border border-indigo-500/30 rounded transition-colors"
          title="Buka link"
        >
          <LinkIcon className="w-3.5 h-3.5" />
        </a>
      ) : <span className="text-slate-600">—</span>}
    </td>
    <td className="px-3 py-3.5 pr-5 text-right" onClick={e => e.stopPropagation()}>
      <div className="flex items-center justify-end gap-1.5 opacity-90 md:opacity-0 group-hover:opacity-100 transition-opacity duration-150">
        <button onClick={(e) => { e.stopPropagation(); onEdit(film); }} className="p-1.5 text-slate-300 hover:text-white bg-white/[0.08] hover:bg-white/[0.16] border border-white/[0.1] transition-colors rounded-md" title="Edit">
          <Edit2 className="w-3.5 h-3.5" />
        </button>
        <button onClick={(e) => { e.stopPropagation(); onDelete(film.rowIndex, film.id); }} className="p-1.5 text-slate-300 hover:text-rose-300 bg-white/[0.08] hover:bg-rose-500/20 border border-white/[0.1] hover:border-rose-500/30 transition-colors rounded-md" title="Hapus">
          <Trash2 className="w-3.5 h-3.5" />
        </button>
      </div>
    </td>
  </tr>
));
TableRow.displayName = 'TableRow';

// ── Helper ──
function formatDate(date: string | null | undefined): string {
  if (!date) return '';
  const d = new Date(date);
  if (isNaN(d.getTime())) return '';
  const months = ['Jan','Feb','Mar','Apr','Mei','Jun','Jul','Agu','Sep','Okt','Nov','Des'];
  return `${d.getDate()} ${months[d.getMonth()]} ${d.getFullYear()}`;
}

// Need React for React.memo
import React from 'react';

const ITEMS_PER_PAGE = 20;
const STATS = [
  { label: 'Total', color: 'text-indigo-400', Icon: Activity, filter: 'Semua Status', key: 'total' as const },
  { label: 'Selesai', color: 'text-emerald-400', Icon: CheckCircle2, filter: 'Selesai', key: 'completed' as const },
  { label: 'Watching', color: 'text-amber-400', Icon: Eye, filter: 'Watching', key: 'watching' as const },
  { label: 'Rencana', color: 'text-blue-400', Icon: Calendar, filter: 'Rencana', key: 'planned' as const },
] as const;

export default function DashboardPage() {
  const dragRef = useRef<HTMLDivElement>(null);
  const [visibleCount, setVisibleCount] = useState(ITEMS_PER_PAGE);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingFilm, setEditingFilm] = useState<Film | null>(null);
  const [isAlertOpen, setIsAlertOpen] = useState(false);
  const [itemToDelete, setItemToDelete] = useState<{ rowIndex: number; id: number } | null>(null);

  const { showToast } = useToast();
  const { isOnline, triggerSync } = useSyncEngine();
  const {
    search, typeFilter, sortBy, statusFilter, setStatusFilter, viewMode,
    addModalOpen, setAddModalOpen,
    films, setFilms, loadingFilms, setLoadingFilms, dataFetched, setDataFetched
  } = useFilters();

  const filmsRef = useRef(films);
  filmsRef.current = films;

  // Reset pagination on filter change
  useEffect(() => { setVisibleCount(ITEMS_PER_PAGE); }, [typeFilter, sortBy, statusFilter, search]);

  // Open modal from bottom bar
  useEffect(() => {
    if (addModalOpen) {
      setEditingFilm(null);
      setIsModalOpen(true);
      setAddModalOpen(false);
    }
  }, [addModalOpen, setAddModalOpen]);

  const loadData = useCallback(async (isSilent = false) => {
    const silent = isSilent || filmsRef.current.length > 0;
    if (!isOnline) { setDataFetched(true); return; }
    if (!silent) setLoadingFilms(true);

    const user = localStorage.getItem('film_username');
    const pass = localStorage.getItem('film_password');
    if (user && pass) {
      try {
        const result = await fetchFilmData(user, pass);
        setFilms(result);
        setDataFetched(true);
      } catch {
        if (!silent) showToast('Gagal memuat data', 'error');
      }
    }
    setLoadingFilms(false);
  }, [setFilms, setDataFetched, setLoadingFilms, isOnline, showToast]);

  useEffect(() => {
    if (!dataFetched) loadData();
  }, [dataFetched, loadData]);

  // Direct memoized filter + sort: zero extra re-render on search or filter change
  const filteredData = useMemo(() => {
    const lower = search.toLowerCase().trim();
    let result = films;

    if (statusFilter !== 'Semua Status' || typeFilter !== 'Semua Kategori' || lower) {
      result = films.filter(f => {
        if (statusFilter !== 'Semua Status' && f.status !== statusFilter) return false;
        if (typeFilter !== 'Semua Kategori' && f.type !== typeFilter) return false;
        if (lower && !f.title.toLowerCase().includes(lower) &&
            !f.type.toLowerCase().includes(lower) &&
            !(f.cast || '').toLowerCase().includes(lower)) return false;
        return true;
      });
    }

    if (sortBy === 'ID Z-A') return [...result].sort((a, b) => b.id - a.id);
    if (sortBy === 'Judul A-Z') return [...result].sort((a, b) => a.title.localeCompare(b.title));
    if (sortBy === 'Judul Z-A') return [...result].sort((a, b) => b.title.localeCompare(a.title));
    return [...result].sort((a, b) => a.id - b.id); // default: ID A-Z
  }, [search, statusFilter, typeFilter, sortBy, films]);

  // Single-pass O(N) stats computation
  const stats = useMemo(() => {
    let completed = 0;
    let watching = 0;
    let planned = 0;
    for (let i = 0; i < films.length; i++) {
      const s = films[i].status;
      if (s === 'Selesai') completed++;
      else if (s === 'Watching') watching++;
      else if (s === 'Rencana') planned++;
    }
    return {
      total: films.length,
      completed,
      watching,
      planned,
    };
  }, [films]);

  const handleEditClick = useCallback((film: Film) => {
    setEditingFilm(film);
    setIsModalOpen(true);
  }, []);

  const handleDeleteClick = useCallback((rowIndex: number, id: number) => {
    setItemToDelete({ rowIndex, id });
    setIsAlertOpen(true);
  }, []);

  const confirmDelete = useCallback(async () => {
    if (!itemToDelete) return;
    const { rowIndex, id } = itemToDelete;
    setFilms(prev => prev.filter(f => f.id !== id));
    pushOfflineAction({ type: 'delete', rowIndex, tempId: id });
    showToast('Film berhasil dihapus', 'success');
    setItemToDelete(null);
    setIsAlertOpen(false);
    if (isOnline) {
      triggerSync(false).then(ok => { if (ok) loadData(true); });
    }
  }, [itemToDelete, setFilms, showToast, isOnline, triggerSync, loadData]);

  // Only render the active view — don't compute both
  const visibleData = filteredData.slice(0, visibleCount);

  return (
    <div className="space-y-4">
      {/* Offline Banner */}
      {!isOnline && (
        <div className="bg-amber-500/[0.06] border border-amber-500/20 rounded-lg p-3.5 flex items-center gap-3">
          <WifiOff className="w-4 h-4 text-amber-500 flex-none" />
          <div>
            <p className="text-[12px] font-semibold text-amber-400">Offline</p>
            <p className="text-[10px] text-amber-500/60 mt-0.5">Perubahan disimpan lokal dan disinkron saat online.</p>
          </div>
        </div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 md:gap-3">
        {STATS.map(s => (
          <StatCard
            key={s.filter}
            label={s.label}
            value={stats[s.key]}
            color={s.color}
            Icon={s.Icon}
            isActive={statusFilter === s.filter}
            loading={loadingFilms}
            onClick={() => setStatusFilter(s.filter)}
          />
        ))}
      </div>

      {/* Data View */}
      <div className={`overflow-hidden ${viewMode === 'grid' ? '' : 'bg-[#0e1528] border border-white/[0.1] rounded-xl shadow-lg'}`}>
        {loadingFilms ? (
          <div className="flex justify-center items-center py-20 gap-3 text-slate-300 text-sm font-semibold">
            <Loader2 className="animate-spin w-5 h-5 text-indigo-400" />
            Memuat data...
          </div>
        ) : filteredData.length === 0 ? (
          <div className="text-center py-20 text-slate-400">
            <FilmIcon className="w-12 h-12 mx-auto mb-3 text-indigo-400/40" />
            <p className="text-base font-semibold text-slate-200">Tidak ada data ditemukan</p>
            <p className="text-xs text-slate-400 mt-1">Coba sesuaikan kata kunci pencarian atau filter Anda</p>
          </div>
        ) : viewMode === 'grid' ? (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3 md:gap-4">
              {visibleData.map(film => (
                <GridCard key={film.id} film={film} onEdit={handleEditClick} onDelete={handleDeleteClick} />
              ))}
            </div>
            {visibleCount < filteredData.length && (
              <div className="flex justify-center py-6">
                <button onClick={() => setVisibleCount(p => p + ITEMS_PER_PAGE)}
                  className="flex items-center gap-2 px-6 py-2.5 text-[12px] font-semibold text-slate-200 hover:text-white bg-[#131b32] hover:bg-[#1a2544] border border-white/[0.14] rounded-xl shadow-sm transition-all duration-200 active:scale-98">
                  Tampilkan lebih banyak <ChevronDown className="w-4 h-4 text-indigo-400" />
                </button>
              </div>
            )}
          </>
        ) : (
          <>
            <div className="overflow-x-auto w-full pb-8">
              <table className="w-full text-left border-collapse min-w-[900px]">
                <thead>
                  <tr className="border-b border-white/[0.1] bg-white/[0.04] text-slate-200 text-[11px] font-bold uppercase tracking-[0.12em]">
                    {['ID','JUDUL','CAST','TIPE','EPS','STATUS','TANGGAL','LINK','AKSI'].map((h, i) => (
                      <th key={h} className={`px-3 py-3.5 ${i === 0 ? 'pl-5' : ''} ${i === 8 ? 'text-right pr-5' : ''} ${i === 4 ? 'text-center' : ''}`}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {visibleData.map((film, index) => (
                    <TableRow key={film.id} film={film} index={index} onEdit={handleEditClick} onDelete={handleDeleteClick} />
                  ))}
                </tbody>
              </table>
            </div>
            {visibleCount < filteredData.length && (
              <div className="flex justify-center py-6">
                <button onClick={() => setVisibleCount(p => p + ITEMS_PER_PAGE)}
                  className="flex items-center gap-2 px-6 py-2.5 text-[12px] font-semibold text-slate-200 hover:text-white bg-[#131b32] hover:bg-[#1a2544] border border-white/[0.14] rounded-xl shadow-sm transition-all duration-200 active:scale-98">
                  Tampilkan lebih banyak <ChevronDown className="w-4 h-4 text-indigo-400" />
                </button>
              </div>
            )}
          </>
        )}
      </div>

      <FilmModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        filmToEdit={editingFilm}
        onSuccess={() => loadData(true)}
      />

      <AlertModal
        isOpen={isAlertOpen}
        onCancel={() => setIsAlertOpen(false)}
        onConfirm={confirmDelete}
        title="Hapus Film?"
        message="Tindakan ini tidak dapat dibatalkan. Film akan dihapus permanen dari koleksi Anda."
        confirmText="Hapus"
        type="danger"
      />

      {/* FAB — desktop only */}
      <div ref={dragRef} className="fixed inset-0 pointer-events-none z-40 hidden md:block" />
      <button
        className="hidden md:flex fixed bottom-6 right-6 z-[45] items-center justify-center w-12 h-12 rounded-lg bg-indigo-500 hover:bg-indigo-400 text-white shadow-[0_4px_20px_rgba(99,102,241,0.35)] pointer-events-auto transition-colors duration-150"
        onClick={() => { setEditingFilm(null); setIsModalOpen(true); }}
        title="Tambah Koleksi Baru"
      >
        <Plus className="w-5 h-5" strokeWidth={2} />
      </button>
    </div>
  );
}
