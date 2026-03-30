import { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { X, Loader2, Clapperboard, Link as LinkIcon, Layers, Activity, Hash, Calendar, Edit2, PlusCircle, ChevronDown, type LucideIcon } from 'lucide-react';
import { saveFilmData } from '@/lib/api';
import type { Film } from '@/lib/api';

/* ── Custom Select (CSS-only, no motion) ── */
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
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const selected = options.find(o => o.value === value) || options[0];

  return (
    <div ref={ref} className="relative w-full">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between bg-slate-900/40 border border-white/8 rounded-lg pl-8 pr-3 py-2 text-[11px] text-white focus:outline-none focus:border-indigo-500/40 transition-colors font-medium"
      >
        <span className="absolute left-2.5 top-1/2 -translate-y-1/2">
          <Icon className="w-3 h-3 text-indigo-400/60 pointer-events-none" />
        </span>
        <span className="truncate">{selected?.label}</span>
        <ChevronDown className={`w-3 h-3 text-gray-500 transition-transform duration-150 ${open ? 'rotate-180' : ''}`} />
      </button>

      {/* Dropdown — CSS visibility, no motion */}
      <div
        className="absolute z-[80] w-full mt-1 p-1 flex flex-col gap-0.5 rounded-xl border border-white/8 shadow-xl overflow-hidden transition-all duration-150"
        style={{
          background: '#0c0f1d',
          opacity: open ? 1 : 0,
          transform: open ? 'translateY(0) scaleY(1)' : 'translateY(-4px) scaleY(0.95)',
          pointerEvents: open ? 'auto' : 'none',
          transformOrigin: 'top',
        }}
      >
        {options.map((option) => (
          <button
            key={option.value}
            type="button"
            onClick={() => { onChange(option.value); setOpen(false); }}
            className={`w-full text-left px-2.5 py-1.5 rounded-lg text-[11px] font-medium transition-colors ${
              value === option.value
                ? 'bg-indigo-500/20 text-indigo-300'
                : 'text-gray-400 hover:bg-white/5 hover:text-gray-200'
            }`}
          >
            {option.label}
          </button>
        ))}
      </div>
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
  const [visible, setVisible] = useState(false);
  const [formData, setFormData] = useState<Partial<Film>>({
    title: '', type: 'Anime', cast: '', link: '', episodes: null, status: 'Rencana', date: '', notes: ''
  });

  useEffect(() => { setMounted(true); }, []);

  // Trigger CSS transition after mount
  useEffect(() => {
    if (isOpen) {
      // Small delay to allow DOM to paint before animating
      const t = setTimeout(() => setVisible(true), 10);
      return () => clearTimeout(t);
    } else {
      setVisible(false);
    }
  }, [isOpen]);

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

  // Lock body scroll when open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => { document.body.style.overflow = ''; };
  }, [isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const user = localStorage.getItem('film_username')!;
    const pass = localStorage.getItem('film_password')!;
    const action = filmToEdit ? 'edit' : 'add';
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

  const inputCls = "w-full bg-[#0d1020] border border-white/[0.07] rounded-lg pl-8 pr-2.5 py-2 text-[11px] text-white placeholder:text-gray-600 focus:outline-none focus:border-indigo-500/40 transition-colors font-medium";
  const textareaCls = "w-full bg-[#0d1020] border border-white/[0.07] rounded-lg px-2.5 py-2 text-[11px] text-white placeholder:text-gray-600 focus:outline-none focus:border-indigo-500/40 transition-colors font-medium resize-none";
  const labelCls = "text-[9px] font-bold text-gray-500 uppercase tracking-widest ml-0.5 block mb-1";

  if (!mounted) return null;

  return createPortal(
    <div
      className="fixed inset-0 z-[999] flex items-end sm:items-center justify-center"
      style={{
        pointerEvents: isOpen ? 'auto' : 'none',
        visibility: isOpen || visible ? 'visible' : 'hidden', // to hide focus correctly
        transition: 'visibility 0s linear',
        transitionDelay: isOpen ? '0s' : '0.2s' // delay hide by 200ms when closing
      }}
    >
      {/* Backdrop — dark only, no blur */}
      <div
        className="absolute inset-0 transition-opacity duration-200"
        style={{
          background: 'rgba(0,0,0,0.75)',
          opacity: visible ? 1 : 0,
        }}
        onClick={onClose}
      />

      {/* Modal panel */}
      <div
        className="relative w-full sm:max-w-[560px] z-10 transition-all duration-200"
        style={{
          opacity: visible ? 1 : 0,
          transform: visible ? 'translateY(0)' : 'translateY(20px)',
        }}
      >
        <div
          className="w-full sm:rounded-2xl overflow-hidden rounded-t-2xl"
          style={{
            background: '#0e1120',
            border: '1px solid rgba(255,255,255,0.07)',
            boxShadow: '0 24px 60px rgba(0,0,0,0.7)',
          }}
        >
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-white/[0.05]">
            <div className="flex items-center gap-2">
              <div className="p-1 bg-indigo-500/10 border border-indigo-500/20 rounded-md">
                {filmToEdit
                  ? <Edit2 className="w-3.5 h-3.5 text-indigo-400" />
                  : <PlusCircle className="w-3.5 h-3.5 text-indigo-400" />}
              </div>
              <h2 className="text-sm font-bold text-white tracking-tight">
                {filmToEdit ? 'Edit Koleksi' : 'Tambah Koleksi'}
              </h2>
            </div>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-gray-500 hover:text-white hover:bg-white/[0.06] transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="px-4 py-3 space-y-3 max-h-[75vh] overflow-y-auto">

            {/* Judul */}
            <div>
              <label className={labelCls}>Judul Koleksi <span className="text-red-400">*</span></label>
              <div className="relative">
                <Clapperboard className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3 h-3 text-indigo-400/60 pointer-events-none" />
                <input
                  required type="text"
                  placeholder="Judul anime/donghua..."
                  value={formData.title}
                  onChange={e => setFormData({ ...formData, title: e.target.value })}
                  className={inputCls}
                />
              </div>
            </div>

            {/* Link */}
            <div>
              <label className={labelCls}>Link (Opsional)</label>
              <div className="relative">
                <LinkIcon className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3 h-3 text-indigo-400/60 pointer-events-none" />
                <input
                  type="url" placeholder="URL..."
                  value={formData.link}
                  onChange={e => setFormData({ ...formData, link: e.target.value })}
                  className={inputCls}
                />
              </div>
            </div>

            {/* Tipe & Status */}
            <div className="grid grid-cols-2 gap-2.5">
              <div>
                <label className={labelCls}>Tipe <span className="text-red-400">*</span></label>
                <CustomSelect
                  value={formData.type as string}
                  onChange={v => setFormData({ ...formData, type: v })}
                  options={TIPE_OPTIONS}
                  icon={Layers}
                />
              </div>
              <div>
                <label className={labelCls}>Status <span className="text-red-400">*</span></label>
                <CustomSelect
                  value={formData.status as string}
                  onChange={v => setFormData({ ...formData, status: v })}
                  options={STATUS_OPTIONS}
                  icon={Activity}
                />
              </div>
            </div>

            {/* Episode & Tanggal */}
            <div className="grid grid-cols-2 gap-2.5">
              <div>
                <label className={labelCls}>Episode</label>
                <div className="relative">
                  <Hash className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3 h-3 text-indigo-400/60 pointer-events-none" />
                  <input
                    type="number" min="1" placeholder="Total"
                    value={formData.episodes || ''}
                    onChange={e => setFormData({ ...formData, episodes: parseInt(e.target.value) || null })}
                    className={inputCls}
                  />
                </div>
              </div>
              <div>
                <label className={labelCls}>Tanggal</label>
                <div className="relative">
                  <Calendar className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3 h-3 text-indigo-400/60 pointer-events-none" />
                  <input
                    type="date"
                    value={formData.date || ''}
                    onChange={e => setFormData({ ...formData, date: e.target.value })}
                    className={`${inputCls} [color-scheme:dark]`}
                  />
                </div>
              </div>
            </div>

            {/* Cast & Review */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              <div>
                <label className={labelCls}>Cast (Opsi)</label>
                <textarea
                  placeholder="Aktor/Aktris..."
                  value={formData.cast}
                  onChange={e => setFormData({ ...formData, cast: e.target.value })}
                  rows={2}
                  className={textareaCls}
                />
              </div>
              <div>
                <label className={labelCls}>Review</label>
                <textarea
                  placeholder="Catatan..."
                  value={formData.notes || ''}
                  onChange={e => setFormData({ ...formData, notes: e.target.value })}
                  rows={2}
                  className={textareaCls}
                />
              </div>
            </div>

            {/* Actions */}
            <div className="flex justify-end gap-2 pt-1">
              <button
                type="button" onClick={onClose}
                className="px-4 py-2 rounded-lg text-[11px] font-semibold text-gray-400 hover:text-white bg-white/[0.04] hover:bg-white/[0.08] transition-colors"
              >
                Batal
              </button>
              <button
                type="submit" disabled={loading}
                className="flex items-center justify-center gap-1.5 bg-indigo-500 hover:bg-indigo-600 text-white min-w-[88px] px-4 py-2 rounded-lg text-[11px] font-bold transition-colors disabled:opacity-50"
              >
                {loading
                  ? <Loader2 className="animate-spin w-3.5 h-3.5" />
                  : <span>{filmToEdit ? 'Simpan' : 'Tambah'}</span>
                }
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>,
    document.body
  );
}
