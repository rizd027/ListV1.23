import { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { X, Loader2, Clapperboard, Link as LinkIcon, Layers, Activity, Hash, Calendar, Edit2, PlusCircle, ChevronDown, Mic, Camera, Radio, Square, type LucideIcon } from 'lucide-react';
import type { Film } from '@/lib/api';
import { useFilters } from '@/context/FilterContext';
import { pushOfflineAction } from '@/lib/sync';
import { useSyncEngine } from '@/context/SyncContext';
import { useToast } from '@/context/ToastContext';
import { useBackInterceptor } from '@/hooks/useBackInterceptor';

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
        className="w-full flex items-center justify-between bg-slate-900/40 border border-white/8 rounded-lg pl-9 pr-3 py-2.5 text-[12px] text-white focus:outline-none focus:border-indigo-500/40 transition-colors font-medium"
      >
        <span className="absolute left-3 top-1/2 -translate-y-1/2">
          <Icon className="w-3.5 h-3.5 text-indigo-400/60 pointer-events-none" />
        </span>
        <span className="truncate">{selected?.label}</span>
        <ChevronDown className={`w-3 h-3 text-gray-500 transition-transform duration-150 ${open ? 'rotate-180' : ''}`} />
      </button>

      {/* Dropdown — CSS visibility, no motion */}
      <div
        className="absolute z-[80] w-full mt-1 p-1 flex flex-col gap-0.5 rounded-lg border border-white/8 shadow-xl overflow-hidden transition-all duration-150"
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
            className={`w-full text-left px-3 py-2 rounded-md text-[12px] font-medium transition-colors ${value === option.value
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
  { label: 'Drama', value: 'Drama' },
];

const STATUS_OPTIONS = [
  { label: 'Watching', value: 'Watching' },
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

/* ── API Helpers for Groq ── */
const callGroqWhisper = async (audioBlob: Blob): Promise<string> => {
  const apiKey = process.env.NEXT_PUBLIC_GROQ_API_KEY;
  if (!apiKey) {
    throw new Error('API Key Groq tidak ditemukan. Atur NEXT_PUBLIC_GROQ_API_KEY di .env.local.');
  }

  const formData = new FormData();
  formData.append('file', audioBlob, 'recording.webm');
  formData.append('model', 'whisper-large-v3');
  formData.append('response_format', 'json');

  const response = await fetch('https://api.groq.com/openai/v1/audio/transcriptions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`
    },
    body: formData
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error?.message || `HTTP error! status: ${response.status}`);
  }

  const result = await response.json();
  return result.text || '';
};

const extractMetadataFromTranscript = async (transcript: string): Promise<any> => {
  const apiKey = process.env.NEXT_PUBLIC_GROQ_API_KEY;
  if (!apiKey) {
    throw new Error('API Key Groq tidak ditemukan. Atur NEXT_PUBLIC_GROQ_API_KEY di .env.local.');
  }

  const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      model: 'llama-3.3-70b-versatile',
      messages: [
        {
          role: 'system',
          content: `You are an expert AI assistant that extracts movie, anime, donghua, or TV series metadata from voice transcriptions. 
Analyze the user's speech transcript and extract fields. Fill 'watched' with the current episode the user is watching or has finished. Fill 'totalEps' with the total number of episodes if mentioned. If they say 'statusnya selesai' or 'sudah selesai nonton' set status to 'Selesai'. If they are currently watching, set status to 'Watching'. If they plan to watch, set status to 'Rencana'.
Respond ONLY with a valid JSON object matching this structure (do not include any markdown formatting, backticks, or explanation):
{
  "title": "...",
  "type": "Anime" | "Donghua" | "Movie" | "Series" | "Drama",
  "status": "Watching" | "Selesai" | "Rencana" | "Ditunda" | "Drop",
  "watched": "string (number of episodes watched, or null if unknown)",
  "totalEps": "string (total episodes, or null if unknown)",
  "notes": "string (brief description or user review, or null)",
  "cast": "string (cast/actor names, or null)"
}`
        },
        {
          role: 'user',
          content: `Transcription: "${transcript}"`
        }
      ],
      response_format: { type: 'json_object' },
      temperature: 0.1
    })
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error?.message || `HTTP error! status: ${response.status}`);
  }

  const result = await response.json();
  const textResponse = result.choices[0]?.message?.content || '{}';
  return JSON.parse(textResponse);
};

const callGroqVision = async (base64Image: string): Promise<any> => {
  const apiKey = process.env.NEXT_PUBLIC_GROQ_API_KEY;
  if (!apiKey) {
    throw new Error('API Key Groq tidak ditemukan. Atur NEXT_PUBLIC_GROQ_API_KEY di .env.local.');
  }

  const base64Data = base64Image.replace(/^data:image\/[a-z]+;base64,/, '');

  const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      model: 'llama-3.2-11b-vision-preview',
      messages: [
        {
          role: 'user',
          content: [
            {
              type: 'text',
              text: `Identify the movie, anime, donghua, or TV series shown in this image. 
Extract the following fields and respond ONLY with a valid JSON object matching this structure (do not include any markdown formatting, backticks, or explanation):
{
  "title": "...",
  "type": "Anime" | "Donghua" | "Movie" | "Series" | "Drama",
  "status": "Watching" | "Selesai" | "Rencana" | "Ditunda" | "Drop",
  "watched": "string (number of episodes watched, or null if unknown)",
  "totalEps": "string (total episodes, or null if unknown)",
  "notes": "string (brief summary or review, or null)",
  "cast": "string (cast/actor names, or null)"
}`
            },
            {
              type: 'image_url',
              image_url: {
                url: `data:image/jpeg;base64,${base64Data}`
              }
            }
          ]
        }
      ],
      response_format: { type: 'json_object' },
      temperature: 0.1
    })
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error?.message || `HTTP error! status: ${response.status}`);
  }

  const result = await response.json();
  const textResponse = result.choices[0]?.message?.content || '{}';
  return JSON.parse(textResponse);
};

export function FilmModal({ isOpen, onClose, filmToEdit, onSuccess }: FilmModalProps) {
  const { films, setFilms } = useFilters();
  const { isOnline, triggerSync } = useSyncEngine();
  const { showToast } = useToast();
  useBackInterceptor(isOpen, onClose, 'filmModal');
  const [loading, setLoading] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [formData, setFormData] = useState<Partial<Film>>({
    title: '', type: 'Anime', cast: '', link: '', episodes: null, status: 'Rencana', date: '', notes: ''
  });
  const [watched, setWatched] = useState('');
  const [totalEps, setTotalEps] = useState('');

  /* ── AI State ── */
  const [aiLoading, setAiLoading] = useState(false);
  const [aiStatusText, setAiStatusText] = useState('');
  const [recording, setRecording] = useState(false);
  const [recordingDuration, setRecordingDuration] = useState(0);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const durationIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => { setMounted(true); }, []);

  // Cancel recording on close
  useEffect(() => {
    if (!isOpen) {
      cancelRecording();
    }
  }, [isOpen]);

  useEffect(() => {
    return () => {
      if (durationIntervalRef.current) clearInterval(durationIntervalRef.current);
    };
  }, []);

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  const prefillFormWithAiData = (data: any) => {
    if (!data) return;
    
    const validTypes = ['Anime', 'Donghua', 'Movie', 'Series', 'Drama'];
    const validStatuses = ['Watching', 'Selesai', 'Rencana', 'Ditunda', 'Drop'];
    
    const matchedType = validTypes.find(t => t.toLowerCase() === String(data.type || '').toLowerCase()) || formData.type || 'Anime';
    const matchedStatus = validStatuses.find(s => s.toLowerCase() === String(data.status || '').toLowerCase()) || formData.status || 'Rencana';

    setFormData(prev => ({
      ...prev,
      title: data.title || prev.title,
      type: matchedType,
      status: matchedStatus,
      cast: data.cast || prev.cast,
      notes: data.notes || prev.notes,
    }));

    if (data.watched !== undefined && data.watched !== null && data.watched !== '') {
      setWatched(String(data.watched));
    }
    if (data.totalEps !== undefined && data.totalEps !== null && data.totalEps !== '') {
      setTotalEps(String(data.totalEps));
    }
  };

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = async () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        stream.getTracks().forEach(track => track.stop());

        setAiLoading(true);
        setAiStatusText('Mengirim audio ke transkripsi Groq...');
        try {
          const transcript = await callGroqWhisper(audioBlob);
          if (!transcript.trim()) {
            throw new Error('Tidak ada suara yang terdeteksi. Silakan coba lagi.');
          }
          
          setAiStatusText('Mengekstrak informasi film...');
          const data = await extractMetadataFromTranscript(transcript);
          prefillFormWithAiData(data);
          showToast('Berhasil mendeteksi data suara!', 'success');
        } catch (error: any) {
          console.error('[AI Voice Error]', error);
          showToast(error.message || 'Gagal memproses input suara.', 'error');
        } finally {
          setAiLoading(false);
          setAiStatusText('');
        }
      };

      mediaRecorder.start();
      setRecording(true);
      setRecordingDuration(0);

      durationIntervalRef.current = setInterval(() => {
        setRecordingDuration(prev => prev + 1);
      }, 1000);

    } catch (error: any) {
      console.error('[Microphone Permission Error]', error);
      showToast('Gagal mengakses mikrofon. Pastikan izin mikrofon diaktifkan.', 'error');
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && recording) {
      mediaRecorderRef.current.stop();
      setRecording(false);
      if (durationIntervalRef.current) {
        clearInterval(durationIntervalRef.current);
      }
    }
  };

  const cancelRecording = () => {
    if (mediaRecorderRef.current && recording) {
      mediaRecorderRef.current.onstop = null;
      mediaRecorderRef.current.stop();
      mediaRecorderRef.current.stream.getTracks().forEach(track => track.stop());
      setRecording(false);
      if (durationIntervalRef.current) {
        clearInterval(durationIntervalRef.current);
      }
    }
  };

  const handleImageScanClick = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  const handleImageSelected = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    e.target.value = '';

    setAiLoading(true);
    setAiStatusText('Membaca gambar...');

    try {
      const base64 = await convertFileToBase64(file);
      setAiStatusText('Menganalisis gambar menggunakan Groq Vision...');
      const data = await callGroqVision(base64);
      prefillFormWithAiData(data);
      showToast('Berhasil menganalisis gambar!', 'success');
    } catch (error: any) {
      console.error('[AI Vision Error]', error);
      showToast(error.message || 'Gagal memproses gambar.', 'error');
    } finally {
      setAiLoading(false);
      setAiStatusText('');
    }
  };

  const convertFileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = error => reject(error);
    });
  };

  useEffect(() => {
    if (filmToEdit) {
      setFormData({
        ...filmToEdit,
        date: filmToEdit.date ? new Date(filmToEdit.date).toISOString().split('T')[0] : ''
      });
      const epsStr = String(filmToEdit.episodes || '');
      if (epsStr.includes('/')) {
        const parts = epsStr.split('/');
        setWatched(parts[0].trim() === '?' || parts[0].trim() === '~' ? '' : parts[0].trim());
        setTotalEps(parts[1].trim() === '?' || parts[1].trim() === '~' ? '' : parts[1].trim());
      } else {
        setWatched(epsStr);
        setTotalEps('');
      }
    } else {
      setFormData({
        title: '', type: 'Anime', cast: '', link: '', episodes: null, status: 'Rencana',
        date: new Date().toISOString().split('T')[0], notes: ''
      });
      setWatched('');
      setTotalEps('');
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
    const action = filmToEdit ? 'edit' : 'add';

    let combinedEps: string | null = null;
    if (watched && totalEps) combinedEps = `${watched} / ${totalEps}`;
    else if (watched) combinedEps = `${watched} / ?`;
    else if (totalEps) combinedEps = `? / ${totalEps}`;

    // Tentukan ID baru jika menambah data (gunakan ID positif berurutan agar diurutkan di posisi bawah yang benar secara instan)
    const newId = filmToEdit 
      ? filmToEdit.id 
      : (films.length > 0 ? Math.max(...films.map(f => f.id)) + 1 : 1);
      
    const dataToSave = {
      ...formData,
      episodes: combinedEps,
      id: newId,
      rowIndex: filmToEdit ? filmToEdit.rowIndex : undefined,
    } as Film;

    // Pembaruan UI secara Optimis menggunakan functional updater agar instan & terhindar dari state usang
    setFilms((prevFilms: Film[]) => {
      if (action === 'add') {
        return [...prevFilms, dataToSave];
      } else {
        return prevFilms.map(f => f.id === filmToEdit!.id ? dataToSave : f);
      }
    });

    // Masukkan ke antrean sinkronisasi
    pushOfflineAction({
      type: action as 'edit' | 'add',
      data: dataToSave,
      rowIndex: dataToSave.rowIndex,
      tempId: filmToEdit ? filmToEdit.id : newId
    });

    // Tampilkan notifikasi instan ke user
    if (action === 'add') {
      showToast('Film berhasil ditambahkan', 'success');
    } else {
      showToast('Film berhasil diperbarui', 'success');
    }

    // Tutup modal langsung agar user tidak menunggu
    onClose();
    setLoading(false);

    // Jalankan sinkronisasi latar belakang jika online
    if (isOnline) {
      triggerSync(false).then(success => {
        if (success) {
          onSuccess(); // silent refresh untuk menyinkronkan rowIndex dan data terbaru
        } else {
          console.warn('[Sync] Gagal menyimpan ke server, akan dicoba lagi nanti.');
        }
      });
    }
  };

  const inputCls = "w-full bg-[#0d1020] border border-white/[0.07] rounded-lg pl-9 pr-3 py-2.5 text-[12px] text-white placeholder:text-gray-600 focus:outline-none focus:border-indigo-500/40 transition-colors font-medium";
  const inputNoIconCls = "w-full bg-[#0d1020] border border-white/[0.07] rounded-lg px-3 py-2.5 text-[12px] text-white placeholder:text-gray-600 focus:outline-none focus:border-indigo-500/40 transition-colors font-medium text-center";
  const textareaCls = "w-full bg-[#0d1020] border border-white/[0.07] rounded-lg px-3 py-2.5 text-[12px] text-white placeholder:text-gray-600 focus:outline-none focus:border-indigo-500/40 transition-colors font-medium resize-none";
  const labelCls = "text-[9px] font-bold text-gray-500 uppercase tracking-widest ml-0.5 block mb-1";

  if (!mounted || !isOpen) return null;

  return createPortal(
    <div className="fixed inset-0 z-[999] flex items-end sm:items-center justify-center">
      {/* Backdrop — dark only, no blur, no transition */}
      <div
        className="absolute inset-0 bg-black/75"
        onClick={onClose}
      />

      {/* Modal panel — no transition */}
      <div className="relative w-full h-full sm:h-auto sm:max-w-[560px] z-10">
        <form
          onSubmit={handleSubmit}
          className="w-full h-full sm:h-auto sm:rounded-xl overflow-hidden rounded-none flex flex-col"
          style={{
            background: '#0e1120',
            border: '1px solid rgba(255,255,255,0.07)',
            boxShadow: '0 24px 60px rgba(0,0,0,0.7)',
          }}
        >
          {/* Header */}
          <div className="flex-none flex items-center justify-between px-4 py-3.5 border-b border-white/[0.05]">
            <div className="flex items-center gap-2">
              <div className="p-1 bg-indigo-500/10 border border-indigo-500/20 rounded-sm">
                {filmToEdit
                  ? <Edit2 className="w-3.5 h-3.5 text-indigo-400" />
                  : <PlusCircle className="w-3.5 h-3.5 text-indigo-400" />}
              </div>
              <h2 className="text-sm font-bold text-white tracking-tight">
                {filmToEdit ? 'Edit Koleksi' : 'Tambah Koleksi'}
              </h2>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="p-1.5 rounded-md text-gray-500 hover:text-white hover:bg-white/[0.06] transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Scrollable Form Fields */}
          <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4 sm:max-h-[60vh]">
            {/* Judul */}
            <div>
              <label className={labelCls}>Judul Koleksi <span className="text-red-400">*</span></label>
              <div className="relative">
                <Clapperboard className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-indigo-400/60 pointer-events-none" />
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
                <LinkIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-indigo-400/60 pointer-events-none" />
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
                  onChange={v => {
                    setFormData({ ...formData, status: v });
                    if (v === 'Selesai') {
                      if (!totalEps && watched) {
                        setTotalEps(watched);
                      }
                    } else {
                      if (totalEps && totalEps === watched) {
                        setTotalEps('');
                      }
                    }
                  }}
                  options={STATUS_OPTIONS}
                  icon={Activity}
                />
              </div>
            </div>

            {/* Episode & Tanggal */}
            <div className="grid grid-cols-2 gap-2.5">
              <div>
                <label className={labelCls}>Episode</label>
                <div className="flex items-center gap-1.5">
                  <div className="relative flex-1">
                    <Hash className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-indigo-400/60 pointer-events-none" />
                    <input
                      type="number" min="0" placeholder="Tonton"
                      value={watched}
                      onChange={e => setWatched(e.target.value)}
                      className={inputCls}
                    />
                  </div>
                  <span className="text-gray-500 font-bold text-[10px]">/</span>
                  <div className="relative flex-1">
                    <input
                      type="number" min="0" placeholder="Total"
                      value={totalEps}
                      onChange={e => setTotalEps(e.target.value)}
                      className={inputNoIconCls}
                    />
                  </div>
                </div>
              </div>
              <div>
                <label className={labelCls}>Tanggal</label>
                <div className="relative">
                  <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-indigo-400/60 pointer-events-none" />
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
          </div>

          {/* Footer (Actions & AI Input in one single row) */}
          <div className="flex-none p-4 border-t border-white/[0.05] bg-[#0e1120]">
            <input 
              type="file" 
              accept="image/*" 
              ref={fileInputRef} 
              className="hidden" 
              onChange={handleImageSelected} 
            />

            {recording ? (
              /* Recording Mode takes the full row */
              <div className="p-2.5 rounded-lg bg-rose-500/10 border border-rose-500/25 flex items-center justify-between gap-3 shadow-lg shadow-rose-500/5 animate-pulse w-full">
                <div className="flex items-center gap-2">
                  <Radio className="w-4 h-4 text-rose-500 animate-ping" />
                  <span className="text-[10px] font-bold text-rose-300 uppercase tracking-widest">
                    Mendengarkan... ({formatDuration(recordingDuration)})
                  </span>
                </div>
                <div className="flex gap-1.5">
                  <button
                    type="button"
                    onClick={stopRecording}
                    className="p-1.5 rounded-md bg-emerald-500 text-white hover:bg-emerald-600 active:scale-90 transition-all"
                    title="Selesai dan Transkripsi"
                  >
                    <Square className="w-3.5 h-3.5 fill-white" />
                  </button>
                  <button
                    type="button"
                    onClick={cancelRecording}
                    className="p-1.5 rounded-md bg-white/5 text-gray-400 hover:text-white hover:bg-white/10 active:scale-90 transition-all"
                    title="Batal"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ) : aiLoading ? (
              /* AI Loading Mode takes the full row */
              <div className="p-2.5 rounded-lg bg-indigo-500/10 border border-indigo-500/25 flex items-center gap-2.5 shadow-lg shadow-indigo-500/5 w-full">
                <Loader2 className="w-4 h-4 text-indigo-400 animate-spin" />
                <span className="text-[10px] font-bold text-indigo-300 uppercase tracking-widest leading-none">
                  {aiStatusText || 'AI sedang bekerja...'}
                </span>
              </div>
            ) : (
              /* Normal Mode: Voice, Camera, and Simpan in one single row */
              <div className="flex items-center justify-between gap-2.5 w-full">
                {/* Voice & Camera buttons on the left */}
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={startRecording}
                    className="flex items-center justify-center gap-1.5 p-3 rounded-lg bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 hover:bg-indigo-500/20 active:scale-95 transition-all text-xs font-bold min-w-[44px] min-h-[44px]"
                  >
                    <Mic className="w-[18px] h-[18px]" />
                    <span className="hidden sm:inline">Input Suara</span>
                  </button>
                  <button
                    type="button"
                    onClick={handleImageScanClick}
                    className="flex items-center justify-center gap-1.5 p-3 rounded-lg bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 hover:bg-indigo-500/20 active:scale-95 transition-all text-xs font-bold min-w-[44px] min-h-[44px]"
                  >
                    <Camera className="w-[18px] h-[18px]" />
                    <span className="hidden sm:inline">Scan Gambar</span>
                  </button>
                </div>

                {/* Submit button on the right */}
                <button
                  type="submit" disabled={loading}
                  className="flex items-center justify-center gap-1.5 bg-indigo-500 hover:bg-indigo-600 text-white min-w-[110px] px-6 py-3 rounded-lg text-[13px] font-bold active:scale-95 transition-all disabled:opacity-50 min-h-[44px]"
                >
                  {loading ? (
                    <Loader2 className="animate-spin w-4 h-4" />
                  ) : (
                    <span>{filmToEdit ? 'Simpan' : 'Tambah'}</span>
                  )}
                </button>
              </div>
            )}
          </div>
        </form>
      </div>
    </div>,
    document.body
  );
}
