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
    className={`text-left p-3.5 md:p-4 rounded-lg border transition-colors group
      ${isActive
        ? 'bg-white/[0.04] border-white/[0.12]'
        : 'bg-[#0c1018] border-white/[0.04] hover:border-white/[0.08] hover:bg-[#0f1520]'
      }`}
  >
    <div className="flex items-center justify-between mb-2.5">
      <span className="text-[10px] font-medium text-gray-500 uppercase tracking-wider">{label}</span>
      <Icon className={`w-3.5 h-3.5 ${color} opacity-50`} />
    </div>
    <p className={`text-2xl md:text-3xl font-bold ${isActive ? 'text-white' : 'text-gray-200'}`}>
      {loading ? <Loader2 className="w-5 h-5 animate-spin opacity-30" /> : value}
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
    className="relative group flex flex-col bg-[#0c1018] hover:bg-[#0f1520] border border-white/[0.04] hover:border-indigo-500/30 rounded-lg p-4 md:p-5 transition-all overflow-hidden cursor-pointer"
  >
    {/* Top row: ID + Actions */}
    <div className="flex justify-between items-start mb-4">
      <span className="text-[10px] font-mono text-gray-600">#{film.id}</span>
      <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity duration-100" onClick={e => e.stopPropagation()}>
        <button
          onClick={(e) => { e.stopPropagation(); onEdit(film); }}
          className="p-1.5 text-gray-500 hover:text-white hover:bg-white/[0.06] transition-colors rounded"
          title="Edit"
        >
          <Edit2 className="w-3.5 h-3.5" />
        </button>
        <button
          onClick={(e) => { e.stopPropagation(); onDelete(film.rowIndex, film.id); }}
          className="p-1.5 text-gray-500 hover:text-red-400 hover:bg-red-500/[0.08] transition-colors rounded"
          title="Hapus"
        >
          <Trash2 className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>

    <h3 className="text-[14px] md:text-[15px] font-semibold text-white group-hover:text-indigo-300 leading-snug line-clamp-2 mb-3 transition-colors">
      {film.title}
    </h3>

    <div className="flex items-center gap-2 mb-3 flex-wrap">
      <span className="inline-block px-2 py-0.5 text-[10px] font-medium text-gray-400 bg-white/[0.04] border border-white/[0.05] rounded">
        {film.type}
      </span>
      <span className={`inline-block px-2 py-0.5 text-[10px] font-semibold rounded border
        ${film.status === 'Selesai' ? 'text-emerald-400 bg-emerald-500/[0.08] border-emerald-500/20' :
          film.status === 'Watching' ? 'text-amber-400 bg-amber-500/[0.08] border-amber-500/20' :
          film.status === 'Rencana' ? 'text-blue-400 bg-blue-500/[0.08] border-blue-500/20' :
          'text-red-400 bg-red-500/[0.08] border-red-500/20'}`}
      >
        {film.status}
      </span>
      {film.episodes && (
        <span className="text-[10px] font-mono text-gray-500">{film.episodes} eps</span>
      )}
    </div>

    {film.cast && (
      <p className="text-[11px] text-gray-500 line-clamp-1 mb-2">{film.cast}</p>
    )}

    <div className="mt-auto pt-3 flex items-center justify-between border-t border-white/[0.04]">
      <span className="text-[10px] text-gray-600">{formatDate(film.date)}</span>
      {film.link && (
        <a
          href={film.link}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-1 text-[10px] text-indigo-400 hover:text-indigo-300 transition-colors"
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
    className="border-b border-white/[0.03] last:border-0 hover:bg-white/[0.03] transition-colors group cursor-pointer"
  >
    <td className="px-3 py-3.5 pl-5 text-[11px] font-mono text-gray-600">#{film.id}</td>
    <td className="px-3 py-3.5">
      <span className="text-[13px] font-semibold text-white group-hover:text-indigo-300 line-clamp-1 transition-colors">
        {film.title}
      </span>
    </td>
    <td className="px-3 py-3.5 text-[11px] text-gray-500 max-w-[180px] truncate" title={film.cast}>{film.cast || '—'}</td>
    <td className="px-3 py-3.5">
      <span className="px-2 py-0.5 text-[10px] font-medium text-gray-400 bg-white/[0.04] border border-white/[0.05] rounded">
        {film.type}
      </span>
    </td>
    <td className="px-3 py-3.5 text-center text-[12px] font-mono text-indigo-400">{film.episodes || '—'}</td>
    <td className="px-3 py-3.5">
      <span className={`px-2 py-0.5 text-[9px] font-semibold tracking-wide uppercase border rounded
        ${film.status === 'Selesai' ? 'bg-emerald-500/[0.08] text-emerald-400 border-emerald-500/20' :
          film.status === 'Watching' ? 'bg-amber-500/[0.08] text-amber-400 border-amber-500/20' :
          film.status === 'Rencana' ? 'bg-blue-500/[0.08] text-blue-400 border-blue-500/20' :
          'bg-red-500/[0.08] text-red-400 border-red-500/20'}`}
      >
        {film.status}
      </span>
    </td>
    <td className="px-3 py-3.5 text-[11px] text-gray-500">{formatDate(film.date)}</td>
    <td className="px-3 py-3.5 text-center" onClick={e => e.stopPropagation()}>
      {film.link ? (
        <a href={film.link} target="_blank" rel="noopener noreferrer"
          className="inline-flex items-center justify-center w-6 h-6 text-indigo-400 hover:text-indigo-300 rounded transition-colors"
          title="Buka link"
        >
          <LinkIcon className="w-3 h-3" />
        </a>
      ) : <span className="text-gray-700">—</span>}
    </td>
    <td className="px-3 py-3.5 pr-5 text-right" onClick={e => e.stopPropagation()}>
      <div className="flex items-center justify-end gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity duration-100">
        <button onClick={(e) => { e.stopPropagation(); onEdit(film); }} className="p-1.5 text-gray-500 hover:text-white hover:bg-white/[0.06] transition-colors rounded" title="Edit">
          <Edit2 className="w-3.5 h-3.5" />
        </button>
        <button onClick={(e) => { e.stopPropagation(); onDelete(film.rowIndex, film.id); }} className="p-1.5 text-gray-500 hover:text-red-400 hover:bg-red-500/[0.08] transition-colors rounded" title="Hapus">
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
      <div className={`overflow-hidden ${viewMode === 'grid' ? '' : 'bg-[#0c1018] border border-white/[0.04] rounded-lg'}`}>
        {loadingFilms ? (
          <div className="flex justify-center items-center py-20 gap-2.5 text-gray-600 text-sm">
            <Loader2 className="animate-spin w-4 h-4" />
            Memuat data...
          </div>
        ) : filteredData.length === 0 ? (
          <div className="text-center py-20 text-gray-600">
            <FilmIcon className="w-10 h-10 mx-auto mb-3 opacity-20" />
            <p className="text-sm font-medium">Tidak ada data ditemukan</p>
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
                  className="flex items-center gap-2 px-5 py-2 text-[11px] font-medium text-gray-400 hover:text-white bg-white/[0.04] hover:bg-white/[0.07] border border-white/[0.06] rounded transition-colors">
                  Tampilkan lebih banyak <ChevronDown className="w-3.5 h-3.5" />
                </button>
              </div>
            )}
          </>
        ) : (
          <>
            <div className="overflow-x-auto w-full pb-8">
              <table className="w-full text-left border-collapse min-w-[900px]">
                <thead>
                  <tr className="border-b border-white/[0.05] text-gray-600 text-[10px] font-semibold uppercase tracking-[0.12em]">
                    {['ID','JUDUL','CAST','TIPE','EPS','STATUS','TANGGAL','LINK','AKSI'].map((h, i) => (
                      <th key={h} className={`px-3 py-3 ${i === 0 ? 'pl-5' : ''} ${i === 8 ? 'text-right pr-5' : ''} ${i === 4 ? 'text-center' : ''}`}>{h}</th>
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
                  className="flex items-center gap-2 px-5 py-2 text-[11px] font-medium text-gray-400 hover:text-white bg-white/[0.04] hover:bg-white/[0.07] border border-white/[0.06] rounded transition-colors">
                  Tampilkan lebih banyak <ChevronDown className="w-3.5 h-3.5" />
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
