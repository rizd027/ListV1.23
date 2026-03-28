'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { GlassCard } from '@/components/ui/GlassCard';
import { fetchFilmData, deleteFilmData } from '@/lib/api';
import { Loader2, Edit2, Trash2, CheckCircle2, Activity, Eye, Calendar, Link as LinkIcon, FolderPlus, Sparkles, Film as FilmIcon, Tv, MonitorPlay, Video, Clapperboard } from 'lucide-react';
import { FilmModal } from '@/components/ui/FilmModal';
import { AlertModal } from '@/components/ui/AlertModal';
import { useFilters } from '@/context/FilterContext';
import { useToast } from '@/context/ToastContext';

export interface Film {
  id: number;
  title: string;
  cast?: string;
  type: string;
  episodes: number | null;
  status: string;
  date: string | null;
  notes: string;
  link?: string;
  count?: number;
  rowIndex: number;
}

export default function DashboardPage() {
  const dragRef = useRef(null);
  const isDragging = useRef(false);
  const [showHint, setShowHint] = useState(true);
  const [data, setData] = useState<Film[]>([]);
  const [filteredData, setFilteredData] = useState<Film[]>([]);
  const [loading, setLoading] = useState(true);
  const { showToast } = useToast();

  // Filters dari context (diatur di header)
  const { search, typeFilter, sortBy, statusFilter, setStatusFilter, viewMode } = useFilters();

  // Modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingFilm, setEditingFilm] = useState<Film | null>(null);

  // Alert Modal (Delete Confirm)
  const [isAlertOpen, setIsAlertOpen] = useState(false);
  const [itemToDelete, setItemToDelete] = useState<{ rowIndex: number, id: number } | null>(null);

  const loadData = useCallback(async (isSilent = false) => {
    if (!isSilent) setLoading(true);
    else showToast('Sinkronisasi data...', 'info');

    const user = localStorage.getItem('film_username');
    const pass = localStorage.getItem('film_password');
    if (user && pass) {
      try {
        const result = await fetchFilmData(user, pass);
        setData(result);
        setFilteredData(result);
        if (isSilent) showToast('Data diperbarui', 'success');
      } catch (err) {
        console.error(err);
        showToast('Gagal sinkron data', 'error');
      }
    }
    setLoading(false);
  }, [showToast]);

  useEffect(() => {
    loadData();
    // Tutup hint setelah 6 detik
    const timer = setTimeout(() => setShowHint(false), 6000);
    return () => clearTimeout(timer);
  }, [loadData]);

  useEffect(() => {
    // Apply filters and sorting
    const lowerSearch = search.toLowerCase();
    let filtered = data.filter(film => {
      const matchSearch = film.title.toLowerCase().includes(lowerSearch) ||
        film.type.toLowerCase().includes(lowerSearch) ||
        (film.cast || '').toLowerCase().includes(lowerSearch);
      const matchStatus = statusFilter === 'Semua Status' || film.status === statusFilter;
      const matchType = typeFilter === 'Semua Kategori' || film.type === typeFilter;
      return matchSearch && matchStatus && matchType;
    });

    // Sort
    filtered = [...filtered].sort((a, b) => {
      if (sortBy === 'ID A-Z') return a.id - b.id;
      if (sortBy === 'ID Z-A') return b.id - a.id;
      if (sortBy === 'Judul A-Z') return a.title.localeCompare(b.title);
      if (sortBy === 'Judul Z-A') return b.title.localeCompare(a.title);
      return a.id - b.id;
    });

    setFilteredData(filtered);
  }, [search, statusFilter, typeFilter, sortBy, data]);

  const confirmDelete = async () => {
    if (!itemToDelete) return;
    const { rowIndex, id } = itemToDelete;

    const user = localStorage.getItem('film_username')!;
    const pass = localStorage.getItem('film_password')!;

    // Optimistic UI Update
    const prevData = [...data];
    setData(data.filter(f => f.id !== id));

    try {
      await deleteFilmData(rowIndex, user, pass);
      showToast('Film berhasil dihapus', 'success');
      loadData(true);
    } catch {
      showToast('Gagal menghapus film', 'error');
      setData(prevData);
    } finally {
      setItemToDelete(null);
    }
  };

  const handleDelete = (rowIndex: number, id: number) => {
    setItemToDelete({ rowIndex, id });
    setIsAlertOpen(true);
  };

  const stats = {
    total: data.length,
    completed: data.filter(f => f.status === 'Selesai').length,
    watching: data.filter(f => f.status === 'Watching').length,
    planned: data.filter(f => f.status === 'Rencana').length,
  };

  return (
    <div className="space-y-4">
      {/* Stats overview */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 md:gap-6">
        {[
          { label: 'Total Koleksi', value: stats.total, color: 'text-indigo-400', bg: 'bg-indigo-500/5', border: 'border-indigo-500/20', activeBorder: 'border-indigo-500/60 shadow-[0_0_15px_-3px_rgba(99,102,241,0.3)]', Icon: Activity, filter: 'Semua Status' },
          { label: 'Selesai Ditonton', value: stats.completed, color: 'text-emerald-400', bg: 'bg-emerald-500/5', border: 'border-emerald-500/20', activeBorder: 'border-emerald-500/60 shadow-[0_0_15px_-3px_rgba(16,185,129,0.3)]', Icon: CheckCircle2, filter: 'Selesai' },
          { label: 'Watching', value: stats.watching, color: 'text-amber-400', bg: 'bg-amber-500/5', border: 'border-amber-500/20', activeBorder: 'border-amber-500/60 shadow-[0_0_15px_-3px_rgba(245,158,11,0.3)]', Icon: Eye, filter: 'Watching' },
          { label: 'Daftar Rencana', value: stats.planned, color: 'text-blue-400', bg: 'bg-blue-500/5', border: 'border-blue-500/20', activeBorder: 'border-blue-500/60 shadow-[0_0_15px_-3px_rgba(59,130,246,0.3)]', Icon: Calendar, filter: 'Rencana' },
        ].map((stat, i) => {
          const isActive = statusFilter === stat.filter;
          return (
            <GlassCard
              key={i}
              onClick={() => setStatusFilter(stat.filter)}
              className={`p-3 md:p-3.5 border cursor-pointer transition-all duration-300 relative group overflow-hidden ${isActive ? stat.activeBorder : `${stat.border} ${stat.bg}`} hover:border-white/20`}
            >
              <div className="flex items-center gap-3.5 relative z-10">
                <div className={`flex-none p-2 rounded-xl ${stat.bg} ${stat.border} border group-hover:scale-110 transition-transform duration-500 ${isActive ? 'bg-white/10' : ''}`}>
                  <stat.Icon className={`w-4 h-4 ${stat.color}`} />
                </div>
                <div className="min-w-0">
                  <p className="text-[10px] md:text-[11px] font-medium text-gray-500 tracking-wider uppercase">{stat.label}</p>
                  <p className="text-xl md:text-2xl font-black text-white mt-0.5">
                    {loading ? <Loader2 className="w-5 h-5 animate-spin opacity-20" /> : stat.value}
                  </p>
                </div>
              </div>
              
              {/* Subtle background icon for depth */}
              <stat.Icon className={`absolute -right-2 -bottom-2 w-14 h-14 ${stat.color} opacity-[0.03] group-hover:opacity-[0.06] transition-opacity duration-700 -rotate-12`} />
              
              {/* Decorative accent for active state */}
              {isActive && (
                <motion.div 
                  layoutId="active-nav-bg"
                  className="absolute inset-0 bg-gradient-to-br from-white/[0.03] to-transparent pointer-events-none"
                />
              )}
            </GlassCard>
          );
        })}
      </div>


      {/* Data Table / Grid View */}
      <GlassCard className={`!p-0 overflow-hidden ${viewMode === 'grid' ? '!bg-transparent !border-none !backdrop-blur-none !shadow-none' : ''}`}>
        <div className="w-full">
          {loading ? (
            <div className="flex justify-center items-center py-20 text-dark-600">
              <Loader2 className="animate-spin w-8 h-8 mr-3" /> Memuat Data...
            </div>
          ) : filteredData.length === 0 ? (
            <div className="text-center py-20 text-dark-600">
              <CheckCircle2 className="w-12 h-12 mx-auto mb-3 opacity-50" />
              <p>Tidak ada data ditemukan.</p>
            </div>
          ) : viewMode === 'grid' ? (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3 md:gap-5">
              <AnimatePresence>
                {filteredData.map((film, index) => {
                  const IconList = [FilmIcon, Tv, MonitorPlay, Video, Clapperboard];
                  return (
                    <motion.div
                      key={film.id}
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.95 }}
                      transition={{ duration: 0.2 }}
                      className="relative group flex flex-col bg-[#0f141f] hover:bg-[#131926] border border-white/[0.03] hover:border-indigo-500/20 rounded-[16px] md:rounded-[20px] p-3 md:p-5 transition-all duration-300 shadow-xl shadow-black/20 overflow-hidden"
                    >
                      {/* Animated Floating Background Icons */}
                      <div className="absolute inset-0 pointer-events-none opacity-[0.03] group-hover:opacity-[0.06] transition-opacity duration-500">
                        {[...Array(6)].map((_, i) => {
                          const Icon = IconList[(index + i) % IconList.length];
                          const row = Math.floor(i / 2);
                          const col = i % 2;
                          const baseTop = 15 + (row * 30);
                          const baseLeft = 15 + (col * 50);
                          const topPos = baseTop + ((index * 7) % 15) - 7;
                          const leftPos = baseLeft + ((index * 11) % 20) - 10;
                          const animDuration = 6 + ((i + index) % 4);
                          const yMove = i % 2 === 0 ? -12 : 12;

                          return (
                            <motion.div
                              key={i}
                              className="absolute text-indigo-200"
                              style={{ top: `${topPos}%`, left: `${leftPos}%` }}
                              animate={{
                                y: [0, yMove, 0],
                                x: [0, yMove / 2, 0],
                                rotate: [0, (i % 3) * 10 - 10, 0]
                              }}
                              transition={{
                                duration: animDuration,
                                repeat: Infinity,
                                ease: "easeInOut",
                                delay: i * 0.5
                              }}
                            >
                              <Icon className="w-8 h-8" />
                            </motion.div>
                          );
                        })}
                      </div>

                      {/* Section: ID */}
                      <div className="flex justify-between items-center mb-3 md:mb-5">
                        <span className="text-[9px] md:text-[10px] font-bold text-gray-500 uppercase tracking-wider">ID</span>
                        <span className="text-[11px] md:text-[12px] font-black text-white">#{index + 1}</span>
                      </div>

                      {/* Section: JUDUL */}
                      <div className="mb-3 md:mb-4">
                        <span className="block text-[8px] md:text-[9px] font-black text-gray-500 uppercase tracking-widest mb-1">Judul</span>
                        <h3 className="text-[14px] md:text-[16px] font-bold text-white leading-tight line-clamp-2">{film.title}</h3>
                      </div>

                      {/* Section: CAST */}
                      <div className="mb-4 md:mb-5">
                        <span className="block text-[8px] md:text-[9px] font-black text-gray-500 uppercase tracking-widest mb-1">Cast</span>
                        <p className="text-[11px] md:text-[13px] font-medium text-gray-300 line-clamp-2 leading-relaxed">{film.cast || '-'}</p>
                      </div>

                      {/* Section: TIPE & EPISODE */}
                      <div className="flex gap-2 md:gap-4 mb-4 md:mb-5">
                        <div className="flex-1">
                          <span className="block text-[8px] md:text-[9px] font-black text-gray-500 uppercase tracking-widest mb-1.5">Tipe</span>
                          <span className="inline-block px-2 md:px-3 py-1 md:py-1.5 rounded-lg bg-white/[0.03] border border-white/5 text-[10px] md:text-[11px] font-medium text-gray-300">
                            {film.type}
                          </span>
                        </div>
                        <div className="flex-1">
                          <span className="block text-[8px] md:text-[9px] font-black text-gray-500 uppercase tracking-widest mb-1.5">Episode</span>
                          <span className="text-[12px] md:text-[13px] font-bold text-white">{film.episodes || '-'}</span>
                        </div>
                      </div>

                      {/* Section: STATUS & TANGGAL */}
                      <div className="flex gap-2 md:gap-4 mb-4 md:mb-5">
                        <div className="flex-1">
                          <span className="block text-[8px] md:text-[9px] font-black text-gray-500 uppercase tracking-widest mb-1.5">Status</span>
                          <span className={`inline-block px-2 py-1 md:px-2.5 md:py-1.5 rounded-lg text-[9px] md:text-[10px] font-black tracking-wider uppercase
                            ${film.status === 'Selesai' ? 'bg-emerald-500/10 text-emerald-500' :
                              film.status === 'Sedang Ditonton' ? 'bg-amber-500/10 text-amber-500' :
                                film.status === 'Rencana' ? 'bg-blue-500/10 text-blue-500' :
                                  'bg-red-500/10 text-red-500'}`}
                          >
                            {film.status === 'Sedang Ditonton' ? 'Watching' : film.status}
                          </span>
                        </div>
                        <div className="flex-1">
                          <span className="block text-[8px] md:text-[9px] font-black text-gray-500 uppercase tracking-widest mb-1.5">Tanggal</span>
                          <span className="text-[11px] md:text-[13px] font-bold text-white">
                            {film.date ? (() => {
                              const d = new Date(film.date);
                              if (isNaN(d.getTime())) return '-';
                              const months = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'];
                              return `${d.getDate()} ${months[d.getMonth()]} ${d.getFullYear()}`;
                            })() : '-'}
                          </span>
                        </div>
                      </div>

                      {/* Section: LINK */}
                      <div className="mb-4 md:mb-6">
                        <span className="block text-[8px] md:text-[9px] font-black text-gray-500 uppercase tracking-widest mb-1.5">Link</span>
                        {film.link ? (
                          <a href={film.link} target="_blank" rel="noopener noreferrer" className="text-[11px] md:text-[13px] font-medium text-indigo-400 hover:text-indigo-300 transition-colors line-clamp-1 underline underline-offset-2">
                            {film.link}
                          </a>
                        ) : (
                          <span className="text-[14px] font-bold text-gray-300">-</span>
                        )}
                      </div>

                      {/* Section: AKSI & BUTTONS */}
                      <div className="mt-auto flex items-end justify-between">
                        <span className="text-[8px] md:text-[9px] font-black text-gray-500 uppercase tracking-widest mb-2 md:mb-3">Aksi</span>
                        <div className="flex gap-1.5 md:gap-2">
                          <button onClick={() => { setEditingFilm(film); setIsModalOpen(true); }} className="p-2 md:p-3 rounded-lg md:rounded-xl bg-white/[0.04] border border-white/[0.05] text-gray-400 hover:text-white hover:bg-indigo-500/30 transition-all active:scale-95" title="Edit">
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button onClick={() => handleDelete(film.rowIndex, film.id)} className="p-2 md:p-3 rounded-lg md:rounded-xl bg-white/[0.04] border border-white/[0.05] text-gray-400 hover:text-white hover:bg-red-500/30 transition-all active:scale-95" title="Hapus">
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    </motion.div>
                  );
                })}
              </AnimatePresence>
            </div>
          ) : (
            <div className="overflow-x-auto w-full">
              <table className="w-full text-left border-collapse min-w-[900px]">
                <thead>
                  <tr className="bg-white/[0.02] border-b border-white/5 text-gray-500 text-[10px] font-bold uppercase tracking-[0.15em]">
                    <th className="px-3 py-3 pl-4">ID</th>
                    <th className="px-3 py-3">JUDUL</th>
                    <th className="px-3 py-3">CAST</th>
                    <th className="px-3 py-3">TIPE</th>
                    <th className="px-3 py-3 text-center">EPS</th>
                    <th className="px-3 py-3">STATUS</th>
                    <th className="px-3 py-3">TANGGAL</th>
                    <th className="px-3 py-3">LINK</th>
                    <th className="px-3 py-3 text-right pr-4">AKSI</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  <AnimatePresence>
                    {filteredData.map((film, index) => (
                      <motion.tr
                        key={film.id}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.2 }}
                        className={`border-b border-white/[0.02] last:border-0 ${index % 2 === 0 ? 'bg-transparent' : 'bg-white/[0.01]'}`}
                      >
                        <td className="px-3 py-3 pl-4 text-[12px] font-bold text-gray-600">#{index + 1}</td>
                        <td className="px-3 py-3">
                          <span className="text-[13px] font-bold text-white line-clamp-1">{film.title}</span>
                        </td>
                        <td className="px-3 py-3 text-[12px] font-medium text-gray-400 max-w-[200px] truncate" title={film.cast}>{film.cast || '-'}</td>
                        <td className="px-3 py-3">
                          <span className="px-2 py-0.5 rounded bg-white/5 text-[10px] font-bold text-gray-500 border border-white/5">{film.type}</span>
                        </td>
                        <td className="px-3 py-3 text-center text-[13px] font-black text-indigo-400">{film.episodes || '0'}</td>
                        <td className="px-3 py-3">
                          <span className={`px-2 py-0.5 rounded-md text-[9px] font-black tracking-widest uppercase border
                            ${film.status === 'Selesai' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' :
                              film.status === 'Sedang Ditonton' ? 'bg-amber-500/10 text-amber-400 border-amber-500/20' :
                                film.status === 'Rencana' ? 'bg-blue-500/10 text-blue-400 border-blue-500/20' :
                                  'bg-red-500/10 text-red-400 border-red-500/20'}`}
                          >
                            {film.status === 'Sedang Ditonton' ? 'Watching' : film.status}
                          </span>
                        </td>
                        <td className="px-3 py-3 text-[11px] font-semibold text-gray-400">
                          {film.date ? (() => {
                            const d = new Date(film.date);
                            if (isNaN(d.getTime())) return '-';
                            const months = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'];
                            return `${d.getDate()} ${months[d.getMonth()]} ${d.getFullYear()}`;
                          })() : '-'}
                        </td>
                        <td className="px-3 py-3 text-center">
                          {film.link ? (
                            <a href={film.link} target="_blank" rel="noopener noreferrer" className="p-1.5 rounded-lg bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 hover:bg-indigo-500/25 transition-all inline-block">
                              <LinkIcon className="w-3 h-3" />
                            </a>
                          ) : (
                            <span className="text-gray-700">-</span>
                          )}
                        </td>
                        <td className="px-3 py-3 pr-4 text-right">
                          <div className="flex items-center justify-end gap-1">
                            <button
                              onClick={() => { setEditingFilm(film); setIsModalOpen(true); }}
                              className="p-2 rounded-lg text-gray-500 hover:text-indigo-400 hover:bg-indigo-500/10 transition-all active:scale-95"
                              title="Edit"
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => handleDelete(film.rowIndex, film.id)}
                              className="p-2 rounded-lg text-gray-500 hover:text-red-400 hover:bg-red-500/10 transition-all active:scale-95"
                              title="Hapus"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                      </motion.tr>
                    ))}
                  </AnimatePresence>
                </tbody>
              </table>
            </div>
          )}
        </div>
      </GlassCard>

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
        confirmText="Hapus Sekarang"
        type="danger"
      />

      <motion.div ref={dragRef} className="fixed inset-0 pointer-events-none z-40" />
      
      <motion.button
        drag
        dragConstraints={dragRef}
        dragElastic={0.05}
        dragMomentum={true}
        dragTransition={{ 
          power: 0.4, 
          bounceStiffness: 600, 
          bounceDamping: 60,
          timeConstant: 200 
        }}
        onPointerDown={() => {
          isDragging.current = false;
          setShowHint(false);
        }}
        onDrag={() => (isDragging.current = true)}
        whileDrag={{ scale: 1.1, cursor: 'grabbing', filter: 'brightness(1.1)' }}
        onTap={() => {
          if (!isDragging.current) {
            setEditingFilm(null);
            setIsModalOpen(true);
          }
        }}
        className="fixed bottom-6 right-6 z-[45] flex items-center justify-center p-0 w-[54px] h-[54px] md:w-[62px] md:h-[62px] rounded-full bg-gradient-to-tr from-indigo-600 via-indigo-500 to-purple-500 text-white shadow-[0_10px_40px_-6px_rgba(99,102,241,0.7)] group hover:shadow-[0_15px_50px_-6px_rgba(139,92,246,0.9)] pointer-events-auto active:scale-95"
        initial={{ scale: 0, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: 'spring', stiffness: 300, damping: 20, delay: 0.3 }}
        whileTap={{ scale: 0.95 }}
        title="Tambah Koleksi Baru"
      >
        <AnimatePresence>
          {showHint && (
            <motion.div
              initial={{ opacity: 0, y: 10, scale: 0.5 }}
              animate={{ opacity: 1, y: -45, scale: 1 }}
              exit={{ opacity: 0, y: 0, scale: 0.5 }}
              className="absolute right-0 whitespace-nowrap px-3 py-1.5 rounded-xl bg-white/20 backdrop-blur-md border border-white/30 text-[10px] md:text-[11px] font-bold text-white shadow-2xl pointer-events-none z-[60]"
              style={{ top: 0 }}
            >
              Coba gerakkan saya 👋
              <div className="absolute bottom-[-5px] right-[20px] md:right-[24px] w-0 h-0 border-l-[6px] border-l-transparent border-r-[6px] border-r-transparent border-t-[6px] border-t-white/30" />
            </motion.div>
          )}
        </AnimatePresence>

        <div className="relative w-full h-full flex items-center justify-center overflow-hidden rounded-full font-inherit">
          <div className="absolute inset-0 border-2 border-white/20 rounded-full scale-110 group-hover:scale-100 opacity-0 group-hover:opacity-100 transition-all duration-500" />
          <motion.div
            className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/30 to-transparent"
            animate={{ translateX: ['-100%', '200%'] }}
            transition={{ repeat: Infinity, duration: 2.5, ease: "easeInOut", repeatDelay: 1 }}
          />
          <div className="relative flex items-center justify-center">
            <Sparkles className="absolute -top-3 -right-3 w-[14px] h-[14px] text-purple-200 opacity-0 group-hover:opacity-100 group-hover:-top-[18px] group-hover:-right-[18px] transition-all duration-[400ms] delay-75 pointer-events-none" />
            <Sparkles className="absolute -bottom-3 -left-3 w-[10px] h-[10px] text-indigo-300 opacity-0 group-hover:opacity-100 group-hover:-bottom-[16px] group-hover:-left-[16px] transition-all duration-[400ms] pointer-events-none" />
            <FolderPlus className="w-[18px] h-[18px] md:w-[22px] md:h-[22px] group-hover:scale-110 transition-transform duration-300 flex-shrink-0 drop-shadow-md z-10 relative" strokeWidth={2.5} />
          </div>
        </div>
      </motion.button>
    </div>
  );
}
