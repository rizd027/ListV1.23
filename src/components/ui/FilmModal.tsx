import { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Loader2, Clapperboard, Link as LinkIcon, Layers, Activity, Hash, Calendar, Edit2, PlusCircle, ChevronDown, type LucideIcon } from 'lucide-react';
import { GlassCard } from '@/components/ui/GlassCard';
import { saveFilmData } from '@/lib/api';
import type { Film } from '@/app/dashboard/page';

interface CustomSelectProps {
  value: string;
  onChange: (value: string) => void;
  options: { label: string; value: string }[];
  icon: LucideIcon;
}

function CustomSelect({ value, onChange, options, icon: Icon }: CustomSelectProps) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const selectedOption = options.find(o => o.value === value) || options[0];

  return (
    <div ref={ref} className="relative w-full">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between bg-slate-900/30 border border-white/10 hover:border-indigo-500/40 rounded-md pl-8 pr-3 py-1.5 text-[11px] text-white focus:outline-none focus:ring-1 focus:ring-indigo-500/20 transition-all font-medium"
      >
        <span className="absolute left-2.5 top-1/2 -translate-y-1/2">
          <Icon className="w-3 h-3 text-indigo-400 opacity-60 pointer-events-none" />
        </span>
        <span className="truncate">{selectedOption?.label}</span>
        <ChevronDown className={`w-3 h-3 text-gray-500 transition-transform duration-200 ${open ? 'rotate-180' : ''}`} />
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -5, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -5, scale: 0.95 }}
            transition={{ duration: 0.15 }}
            className="absolute z-[80] w-full mt-1.5 p-1.5 flex flex-col gap-0.5 bg-[#0a0e1a] border border-white/10 rounded-xl shadow-2xl shadow-black/80 overflow-hidden"
          >
            {options.map((option) => (
              <button
                key={option.value}
                type="button"
                onClick={() => {
                  onChange(option.value);
                  setOpen(false);
                }}
                className={`w-full text-left px-2.5 py-1.5 rounded-lg text-[11px] font-medium transition-all ${
                  value === option.value 
                    ? 'bg-indigo-500/20 text-indigo-300' 
                    : 'text-gray-400 hover:bg-white/[0.06] hover:text-gray-200'
                }`}
              >
                {option.label}
              </button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

const TIPE_OPTIONS = [
  { label: 'Anime', value: 'Anime' },
  { label: 'Donghua', value: 'Donghua' },
  { label: 'Movie', value: 'Movie' },
  { label: 'Series', value: 'Series' },
  { label: 'Dorama', value: 'Dorama' },
];

const STATUS_OPTIONS = [
  { label: 'Watching', value: 'Sedang Ditonton' },
  { label: 'Selesai', value: 'Selesai' },
  { label: 'Rencana', value: 'Rencana' },
  { label: 'Ditunda', value: 'Ditunda' },
  { label: 'Drop', value: 'Drop' },
];

interface FilmModalProps {
  isOpen: boolean;
  onClose: () => void;
  filmToEdit: Film | null;
  onSuccess: () => void;
}

export function FilmModal({ isOpen, onClose, filmToEdit, onSuccess }: FilmModalProps) {
  const [loading, setLoading] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [formData, setFormData] = useState<Partial<Film>>({
    title: '', type: 'Anime', cast: '', link: '', episodes: null, status: 'Rencana', date: '', notes: ''
  });

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (filmToEdit) {
      setFormData({
        ...filmToEdit,
        date: filmToEdit.date ? new Date(filmToEdit.date).toISOString().split('T')[0] : ''
      });
    } else {
      setFormData({
        title: '', type: 'Anime', cast: '', link: '', episodes: null, status: 'Rencana',
        date: new Date().toISOString().split('T')[0], notes: ''
      });
    }
  }, [filmToEdit, isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    const user = localStorage.getItem('film_username')!;
    const pass = localStorage.getItem('film_password')!;
    const action = filmToEdit ? 'edit' : 'add';

    // We expect the Google Script to handle assigning the new rowIndex/ID if add
    const dataToSave = {
      ...formData,
      id: filmToEdit ? filmToEdit.id : undefined,
      rowIndex: filmToEdit ? filmToEdit.rowIndex : undefined,
    };

    try {
      await saveFilmData(dataToSave, action, user, pass);
      onSuccess();
      onClose();
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Gagal menyimpan data');
    } finally {
      setLoading(false);
    }
  };

  if (!mounted) return null;

  return createPortal(
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-slate-950/70 backdrop-blur-md z-[50]"
          />

          {/* Modal Content */}
          <div className="fixed inset-0 flex items-center justify-center p-4 z-[60] pointer-events-none">
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 30 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 30 }}
              transition={{ type: "spring", damping: 25, stiffness: 300 }}
              className="w-full max-w-[650px] pointer-events-auto"
            >
              <GlassCard className="p-0 md:p-0 overflow-hidden border-white/10 shadow-[0_32px_64px_-12px_rgba(0,0,0,0.6)]">
                <div className="flex justify-between items-center px-4 py-3 border-b border-white/5 bg-slate-900/40">
                  <div className="flex items-center gap-2">
                    <div className="p-1 bg-indigo-500/10 border border-indigo-500/20 rounded-md">
                      {filmToEdit ? <Edit2 className="w-3.5 h-3.5 text-indigo-400" /> : <PlusCircle className="w-3.5 h-3.5 text-indigo-400" />}
                    </div>
                    <h2 className="text-base font-bold font-outfit text-white tracking-tight">
                      {filmToEdit ? 'Edit Koleksi' : 'Tambah Koleksi'}
                    </h2>
                  </div>
                  <button
                    onClick={onClose}
                    className="p-1 -mr-1 text-gray-400 hover:text-white rounded-md hover:bg-white/5 transition-all active:scale-90"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>

                <form onSubmit={handleSubmit} className="px-4 py-3 space-y-2.5">
                  <div className="space-y-1">
                    <label className="text-[9px] font-bold text-gray-400 uppercase tracking-widest ml-0.5">Judul Koleksi <span className="text-red-400">*</span></label>
                    <div className="relative">
                      <Clapperboard className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3 h-3 text-indigo-400 opacity-60 pointer-events-none" />
                      <input
                        required
                        type="text"
                        placeholder="Judul anime/donghua..."
                        value={formData.title}
                        onChange={e => setFormData({ ...formData, title: e.target.value })}
                        className="w-full bg-slate-900/30 border border-white/10 rounded-md pl-8 pr-2.5 py-1.5 text-[11px] text-white placeholder:text-gray-600 focus:outline-none focus:border-indigo-500/50 focus:ring-1 focus:ring-indigo-500/20 transition-all font-medium"
                      />
                    </div>
                  </div>

                  <div className="space-y-1">
                    <label className="text-[9px] font-bold text-gray-400 uppercase tracking-widest ml-0.5">Link (Opsional)</label>
                    <div className="relative">
                      <LinkIcon className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3 h-3 text-indigo-400 opacity-60 pointer-events-none" />
                      <input
                        type="url"
                        placeholder="URL..."
                        value={formData.link}
                        onChange={e => setFormData({ ...formData, link: e.target.value })}
                        className="w-full bg-slate-900/30 border border-white/10 rounded-md pl-8 pr-2.5 py-1.5 text-[11px] text-white placeholder:text-gray-600 focus:outline-none focus:border-indigo-500/50 focus:ring-1 focus:ring-indigo-500/20 transition-all font-medium"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2.5">
                    {/* Tipe & Status */}
                    <div className="space-y-1">
                      <label className="text-[9px] font-bold text-gray-400 uppercase tracking-widest ml-0.5">Tipe <span className="text-red-400">*</span></label>
                      <CustomSelect
                        value={formData.type as string}
                        onChange={(v) => setFormData({ ...formData, type: v })}
                        options={TIPE_OPTIONS}
                        icon={Layers}
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-[9px] font-bold text-gray-400 uppercase tracking-widest ml-0.5">Status <span className="text-red-400">*</span></label>
                      <CustomSelect
                        value={formData.status as string}
                        onChange={(v) => setFormData({ ...formData, status: v })}
                        options={STATUS_OPTIONS}
                        icon={Activity}
                      />
                    </div>

                    {/* Episode & Tanggal */}
                    <div className="space-y-1">
                      <label className="text-[9px] font-bold text-gray-400 uppercase tracking-widest ml-0.5">Episode</label>
                      <div className="relative">
                        <Hash className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3 h-3 text-indigo-400 opacity-60 pointer-events-none" />
                        <input
                          type="number"
                          min="1"
                          placeholder="Total"
                          value={formData.episodes || ''}
                          onChange={e => setFormData({ ...formData, episodes: parseInt(e.target.value) || null })}
                          className="w-full bg-slate-900/30 border border-white/10 rounded-md pl-8 pr-2.5 py-1.5 text-[11px] text-white placeholder:text-gray-600 focus:outline-none focus:border-indigo-500/50 focus:ring-1 focus:ring-indigo-500/20 transition-all font-medium"
                        />
                      </div>
                    </div>

                    <div className="space-y-1">
                      <label className="text-[9px] font-bold text-gray-400 uppercase tracking-widest ml-0.5">Tanggal</label>
                      <div className="relative">
                        <Calendar className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3 h-3 text-indigo-400 opacity-60 pointer-events-none" />
                        <input
                          type="date"
                          value={formData.date || ''}
                          onChange={e => setFormData({ ...formData, date: e.target.value })}
                          className="w-full bg-slate-900/30 border border-white/10 rounded-md pl-8 pr-2.5 py-1.5 text-[11px] text-white placeholder:text-gray-600 focus:outline-none focus:border-indigo-500/50 focus:ring-1 focus:ring-indigo-500/20 transition-all font-medium [color-scheme:dark]"
                        />
                      </div>
                    </div>

                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
                    {/* Cast & Review */}
                    <div className="space-y-1">
                      <label className="text-[9px] font-bold text-gray-400 uppercase tracking-widest ml-0.5">Cast (Opsi)</label>
                      <textarea
                        placeholder="Aktor/Aktris..."
                        value={formData.cast}
                        onChange={e => setFormData({ ...formData, cast: e.target.value })}
                        rows={2}
                        className="w-full bg-slate-900/30 border border-white/10 rounded-md px-2.5 py-1.5 text-[11px] text-white placeholder:text-gray-600 focus:outline-none focus:border-indigo-500/50 focus:ring-1 focus:ring-indigo-500/20 transition-all font-medium resize-none shadow-inner"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-[9px] font-bold text-gray-400 uppercase tracking-widest ml-0.5">Review</label>
                      <textarea
                        placeholder="Catatan..."
                        value={formData.notes || ''}
                        onChange={e => setFormData({ ...formData, notes: e.target.value })}
                        rows={2}
                        className="w-full bg-slate-900/30 border border-white/10 rounded-md px-2.5 py-1.5 text-[11px] text-white placeholder:text-gray-600 focus:outline-none focus:border-indigo-500/50 focus:ring-1 focus:ring-indigo-500/20 transition-all font-medium resize-none shadow-inner"
                      />
                    </div>
                  </div>

                  <div className="pt-1.5 flex justify-end gap-2">
                    <button
                      type="button"
                      onClick={onClose}
                      className="px-4 py-1.5 rounded-md font-bold text-[11px] text-gray-400 hover:text-white bg-white/5 hover:bg-white/10 transition-all active:scale-95"
                    >
                      Batal
                    </button>
                    <button
                      disabled={loading}
                      type="submit"
                      className="flex items-center justify-center gap-1.5 bg-indigo-500 hover:bg-indigo-600 text-white min-w-[90px] px-4 py-1.5 rounded-md font-bold text-[11px] shadow-xl shadow-indigo-500/20 hover:shadow-indigo-500/40 transition-all disabled:opacity-50 active:scale-95 group"
                    >
                      {loading ? (
                        <Loader2 className="animate-spin w-3 h-3" />
                      ) : (
                        <span>{filmToEdit ? 'Simpan' : 'Tambah'}</span>
                      )}
                    </button>
                  </div>
                </form>
              </GlassCard>
            </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>,
    document.body
  );
}
