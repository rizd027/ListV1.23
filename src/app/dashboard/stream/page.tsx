'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { PlayCircle, ExternalLink, MonitorPlay, Sparkles, Plus, Trash2, Edit2, X, Link2, Search, Film, Tv, Video, Clapperboard } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useToast } from '@/context/ToastContext';

interface StreamLink {
  id: string;
  name: string;
  url: string;
  color: string;
  bg: string;
  border: string;
}

const DEFAULT_LINKS: StreamLink[] = [
  { id: '1', name: "Bstation", url: "https://www.bilibili.tv", color: "from-cyan-500 to-blue-500", bg: "rgba(6,182,212,0.15)", border: "rgba(6,182,212,0.3)" },
  { id: '2', name: "Netflix", url: "https://www.netflix.com", color: "from-red-600 to-red-800", bg: "rgba(220,38,38,0.15)", border: "rgba(220,38,38,0.3)" },
  { id: '3', name: "iQIYI", url: "https://www.iq.com", color: "from-green-500 to-emerald-600", bg: "rgba(16,185,129,0.15)", border: "rgba(16,185,129,0.3)" },
  { id: '4', name: "YouTube", url: "https://www.youtube.com", color: "from-red-500 to-red-700", bg: "rgba(239,68,68,0.15)", border: "rgba(239,68,68,0.3)" },
];

const PRESET_COLORS = [
  { color: "from-indigo-500 to-purple-500", bg: "rgba(99,102,241,0.15)", border: "rgba(99,102,241,0.3)" },
  { color: "from-pink-500 to-rose-500", bg: "rgba(236,72,153,0.15)", border: "rgba(236,72,153,0.3)" },
  { color: "from-amber-500 to-orange-500", bg: "rgba(245,158,11,0.15)", border: "rgba(245,158,11,0.3)" },
  { color: "from-emerald-500 to-teal-500", bg: "rgba(16,185,129,0.15)", border: "rgba(16,185,129,0.3)" },
  { color: "from-blue-500 to-cyan-500", bg: "rgba(59,130,246,0.15)", border: "rgba(59,130,246,0.3)" },
];

export default function StreamPage() {
  const router = useRouter();
  const { showToast } = useToast();
  const [links, setLinks] = useState<StreamLink[]>([]);
  const [loading, setLoading] = useState(true);
  const [username, setUsername] = useState('');

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState({ name: '', url: '' });
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    const user = localStorage.getItem('film_username');
    if (!user) {
      router.replace('/');
      return;
    }
    setUsername(user);
    const key = `listv_stream_links_${user}`;
    const saved = localStorage.getItem(key);
    if (saved) {
      try {
        setLinks(JSON.parse(saved));
      } catch {
        setLinks(DEFAULT_LINKS);
      }
    } else {
      setLinks(DEFAULT_LINKS);
      localStorage.setItem(key, JSON.stringify(DEFAULT_LINKS));
    }
    setLoading(false);
  }, [router]);

  const saveLinks = (newLinks: StreamLink[]) => {
    setLinks(newLinks);
    if (username) {
      localStorage.setItem(`listv_stream_links_${username}`, JSON.stringify(newLinks));
    }
  };

  const handleOpenModal = (link?: StreamLink) => {
    if (link) {
      setEditingId(link.id);
      setFormData({ name: link.name, url: link.url });
    } else {
      setEditingId(null);
      setFormData({ name: '', url: '' });
    }
    setIsModalOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim() || !formData.url.trim()) {
      showToast('Nama dan URL tujuan wajib diisi!', 'error');
      return;
    }

    let url = formData.url.trim();
    if (!/^https?:\/\//i.test(url)) {
      url = 'https://' + url;
    }

    if (editingId) {
      const newLinks = links.map(l => l.id === editingId ? { ...l, name: formData.name, url } : l);
      saveLinks(newLinks);
      showToast('Link berhasil diperbarui!', 'success');
    } else {
      const randomStyle = PRESET_COLORS[Math.floor(Math.random() * PRESET_COLORS.length)];
      const newLink: StreamLink = {
        id: Date.now().toString(),
        name: formData.name,
        url,
        ...randomStyle
      };
      saveLinks([...links, newLink]);
      showToast('Link berhasil ditambahkan!', 'success');
    }
    setIsModalOpen(false);
  };

  const handleDelete = (e: React.MouseEvent, id: string) => {
    e.preventDefault();
    e.stopPropagation();
    if (confirm('Apakah Anda yakin ingin menghapus link ini?')) {
      const newLinks = links.filter(l => l.id !== id);
      saveLinks(newLinks);
      showToast('Link berhasil dihapus!', 'success');
    }
  };

  const filteredLinks = links.filter(l => 
    l.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
    l.url.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (loading) return null;

  return (
    <div className="w-full flex-1 flex flex-col items-center min-h-[calc(100vh-80px)]">
      {/* Background Ornaments */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-indigo-600/10 rounded-full blur-[120px]" />
        <div className="absolute top-[20%] right-[-10%] w-[30%] h-[50%] bg-purple-600/10 rounded-full blur-[120px]" />
        
        {/* Dynamic Background Icons */}
        <div className="absolute inset-0 opacity-[0.03]">
          {(typeof window !== 'undefined' && window.innerWidth < 768 ? [...Array(4)] : [...Array(12)]).map((_, i) => {
            const IconList = [PlayCircle, Film, Tv, MonitorPlay, Video, Clapperboard, Link2];
            const Icon = IconList[i % IconList.length];
            const top = (i * 25 + 10) % 100;
            const left = (i * 30 + 15) % 100;
            const duration = 20 + (i % 5) * 5;
            const delay = i * 1;
            const isMobile = typeof window !== 'undefined' && window.innerWidth < 768;

            return (
              <motion.div
                key={i}
                className="absolute text-indigo-400"
                style={{ top: `${top}%`, left: `${left}%` }}
                animate={isMobile ? {
                  y: [0, -20, 0],
                  opacity: [0.15, 0.3, 0.15],
                } : {
                  y: [0, -30, 0],
                  x: [0, 20, 0],
                  rotate: [0, 15, -15, 0],
                  opacity: [0.2, 0.5, 0.2],
                  scale: [1, 1.1, 1],
                }}
                transition={{
                  duration: isMobile ? duration * 1.5 : duration,
                  repeat: Infinity,
                  ease: "easeInOut",
                  delay,
                }}
              >
                <Icon size={isMobile ? 24 : 30 + (i % 3) * 15} />
              </motion.div>
            );
          })}
        </div>
      </div>

      <div className="w-full max-w-3xl flex-1 flex flex-col pt-1 md:pt-4 pb-24 px-2 sm:px-4 relative z-10">
        
        {/* Header Section */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4 mb-4 md:mb-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 md:w-12 md:h-12 rounded-xl flex items-center justify-center shrink-0 shadow-[0_0_20px_rgba(99,102,241,0.2)] border border-indigo-500/30"
              style={{ background: 'linear-gradient(135deg, rgba(99,102,241,0.2), rgba(139,92,246,0.2))' }}>
              <MonitorPlay className="w-5 h-5 md:w-6 md:h-6 text-indigo-400 drop-shadow-[0_0_8px_rgba(99,102,241,0.8)]" />
            </div>
            <div>
              <h1 className="text-lg md:text-2xl font-black text-white tracking-tight flex items-center gap-2">
                Daftar <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-purple-500">Stream</span>
                <Sparkles className="w-3.5 h-3.5 md:w-5 md:h-5 text-purple-400 animate-pulse" />
              </h1>
              <p className="text-[10px] md:text-xs text-indigo-200/60 mt-0 md:mt-0.5 font-medium tracking-wide">Koleksi platform favorit Anda</p>
            </div>
          </div>
          
          <button
            onClick={() => handleOpenModal()}
            className="flex items-center justify-center self-start sm:self-auto gap-1.5 h-8 md:h-10 px-3 md:px-4 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-bold text-xs md:text-sm tracking-wide transition-all duration-200 shadow-lg shadow-indigo-900/40 active:scale-95 shrink-0"
          >
            <Plus className="w-3.5 h-3.5" />
            Tambah Link
          </button>
        </div>

        {/* Search Bar */}
        <div className="w-full relative mb-4 md:mb-5">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Cari platform stream..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full h-10 md:h-11 pl-10 pr-4 rounded-[14px] bg-white/[0.03] border border-white/5 hover:border-white/10 focus:border-indigo-500/50 focus:bg-indigo-500/5 outline-none text-[11px] md:text-xs text-white placeholder:text-gray-500 transition-all shadow-sm"
          />
        </div>

        {/* List View */}
        <div className="flex flex-col gap-2 md:gap-3">
          <AnimatePresence>
            {filteredLinks.length === 0 && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center py-12 text-gray-500 text-sm font-medium border border-dashed border-white/10 rounded-2xl bg-white/[0.01]">
                {searchQuery ? 'Tidak ada platform yang cocok.' : 'Belum ada data link stream.\nSilakan tekan "Tambah Link" untuk membuat.'}
              </motion.div>
            )}
            
            {filteredLinks.map((link, index) => (
              <motion.a
                href={link.url}
                target="_blank"
                rel="noopener noreferrer"
                key={link.id}
                layout
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, transition: { duration: 0.2 } }}
                transition={{ duration: 0.3, ease: "easeOut", delay: index * 0.04 }}
                className="group relative flex flex-row items-center gap-2 sm:gap-3 p-2 md:p-3 pr-3 md:pr-4 rounded-[16px] md:rounded-2xl transition-all duration-300 hover:scale-[1.01] overflow-hidden bg-white/[0.02] border border-white/5 hover:border-white/10 hover:bg-white/[0.04] shadow-md hover:shadow-xl hover:shadow-black/40"
              >
                {/* Glow Background on hover */}
                <div className={`absolute inset-0 opacity-0 group-hover:opacity-[0.05] transition-opacity duration-500 bg-gradient-to-r ${link.color}`} />
                
                {/* Icon Box */}
                <div className="w-9 h-9 md:w-12 md:h-12 shrink-0 rounded-xl flex items-center justify-center transition-all duration-300 group-hover:scale-105"
                     style={{ background: link.bg, border: `1px solid ${link.border}` }}>
                  <PlayCircle className="w-4 h-4 md:w-6 md:h-6 text-white/90 group-hover:text-white transition-colors drop-shadow-sm" strokeWidth={1.5} />
                </div>
                
                {/* Info */}
                <div className="flex-1 min-w-0 pr-1 md:pr-2">
                  <h3 className="text-[13px] md:text-sm font-bold text-white mb-0.5 truncate">{link.name}</h3>
                  <div className="flex items-center gap-1 text-[9px] md:text-[11px] text-gray-400 group-hover:text-purple-300 transition-colors">
                    <Link2 className="w-2.5 h-2.5 shrink-0" />
                    <span className="truncate">{link.url}</span>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-1 md:gap-1.5 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-all duration-300 translate-x-0 sm:translate-x-4 sm:group-hover:translate-x-0">
                  <button
                    onClick={(e) => { e.preventDefault(); e.stopPropagation(); handleOpenModal(link); }}
                    className="p-1.5 md:p-2 rounded-lg bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-400 transition-colors"
                  >
                    <Edit2 className="w-3 h-3 md:w-3.5 md:h-3.5" />
                  </button>
                  <button
                    onClick={(e) => handleDelete(e, link.id)}
                    className="p-1.5 md:p-2 rounded-lg bg-red-500/10 hover:bg-red-500/20 text-red-400 transition-colors"
                  >
                    <Trash2 className="w-3 h-3 md:w-3.5 md:h-3.5" />
                  </button>
                  <div className="w-px h-5 bg-white/10 mx-1 hidden sm:block" />
                  <ExternalLink className="w-3.5 h-3.5 md:w-4 md:h-4 text-gray-500 group-hover:text-white hidden sm:block transition-colors shrink-0" />
                </div>
              </motion.a>
            ))}
          </AnimatePresence>
        </div>
      </div>

      {/* Modal Tambah/Edit */}
      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-[150] flex items-center justify-center px-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsModalOpen(false)}
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              transition={{ duration: 0.2 }}
              className="relative w-full max-w-sm rounded-[24px] border border-white/[0.08] p-6 shadow-2xl overflow-hidden"
              style={{ background: 'rgba(15,23,42,0.95)', backdropFilter: 'blur(30px)' }}
            >
               <div className="absolute inset-0 border-[2px] border-indigo-500/20 rounded-[24px] pointer-events-none" style={{ maskImage: 'linear-gradient(to bottom, black, transparent)' }} />
              
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-lg font-bold text-white flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-indigo-500/20 flex items-center justify-center">
                    <Link2 className="w-4 h-4 text-indigo-400" />
                  </div>
                  {editingId ? 'Edit Link' : 'Tambah Link'}
                </h2>
                <button
                  onClick={() => setIsModalOpen(false)}
                  className="p-1.5 rounded-xl bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="flex flex-col gap-4 relative z-10">
                <div>
                  <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1.5 ml-1">Nama Platform</label>
                  <input
                    type="text"
                    required
                    placeholder="Contoh: Netflix"
                    value={formData.name}
                    onChange={e => setFormData({ ...formData, name: e.target.value })}
                    className="w-full h-11 rounded-xl bg-white/[0.03] border border-white/10 focus:border-indigo-500/50 focus:bg-indigo-500/5 px-4 text-sm text-white placeholder:text-gray-600 outline-none transition-all duration-200"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1.5 ml-1">URL Tujuan</label>
                  <input
                    type="text"
                    required
                    placeholder="https://..."
                    value={formData.url}
                    onChange={e => setFormData({ ...formData, url: e.target.value })}
                    className="w-full h-11 rounded-xl bg-white/[0.03] border border-white/10 focus:border-indigo-500/50 focus:bg-indigo-500/5 px-4 text-sm text-white placeholder:text-gray-600 outline-none transition-all duration-200"
                  />
                </div>
                
                <button
                  type="submit"
                  className="w-full h-11 mt-3 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-bold text-sm transition-all shadow-lg shadow-indigo-900/30 active:scale-[0.98]"
                >
                  {editingId ? 'Simpan Perubahan' : 'Tambahkan'}
                </button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
