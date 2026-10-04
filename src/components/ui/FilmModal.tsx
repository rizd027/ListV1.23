import { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { X, Loader2, Clapperboard, Link as LinkIcon, Layers, Activity, Hash, Calendar, Edit2, Plus, Minus, ChevronDown, Mic, Camera, Radio, Square, type LucideIcon } from 'lucide-react';
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
  const dropdownRef = useRef<HTMLDivElement>(null);
  const [coords, setCoords] = useState<{ top: number; left: number; width: number; placeAbove?: boolean }>({
    top: 0,
    left: 0,
    width: 0,
    placeAbove: false,
  });

  const updatePosition = () => {
    if (ref.current) {
      const rect = ref.current.getBoundingClientRect();
      const spaceBelow = window.innerHeight - rect.bottom;
      // If space below is less than 210px and space above is larger, open upwards
      const placeAbove = spaceBelow < 210 && rect.top > 210;
      setCoords({
        top: placeAbove ? rect.top - 4 : rect.bottom + 4,
        left: rect.left,
        width: rect.width,
        placeAbove,
      });
    }
  };

  const handleToggle = () => {
    if (!open) {
      updatePosition();
      setOpen(true);
    } else {
      setOpen(false);
    }
  };

  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (
        ref.current && !ref.current.contains(e.target as Node) &&
        dropdownRef.current && !dropdownRef.current.contains(e.target as Node)
      ) {
        setOpen(false);
      }
    };
    const handleScrollOrResize = () => {
      updatePosition();
    };

    document.addEventListener('mousedown', handler);
    window.addEventListener('resize', handleScrollOrResize);
    window.addEventListener('scroll', handleScrollOrResize, true);
    return () => {
      document.removeEventListener('mousedown', handler);
      window.removeEventListener('resize', handleScrollOrResize);
      window.removeEventListener('scroll', handleScrollOrResize, true);
    };
  }, [open]);

  const selected = options.find(o => o.value === value) || options[0];

  return (
    <div ref={ref} className="relative w-full">
      <button
        type="button"
        onClick={handleToggle}
        className="w-full flex items-center justify-between bg-[#13192f] border border-white/[0.14] hover:border-white/[0.25] rounded pl-9 pr-3 py-2.5 text-[12px] text-white focus:outline-none focus:border-indigo-400 focus:ring-1 focus:ring-indigo-500/40 transition-all font-medium"
      >
        <span className="absolute left-3 top-1/2 -translate-y-1/2">
          <Icon className="w-3.5 h-3.5 text-indigo-400 pointer-events-none" />
        </span>
        <span className="truncate text-slate-100">{selected?.label}</span>
        <ChevronDown className={`w-3.5 h-3.5 text-slate-400 transition-transform duration-150 ${open ? 'rotate-180 text-indigo-400' : ''}`} />
      </button>

      {/* Dropdown — rendered in Portal directly into document.body to avoid being clipped by any modal container */}
      {open && typeof document !== 'undefined' && createPortal(
        <div
          ref={dropdownRef}
          className="fixed z-[9999] p-1.5 flex flex-col gap-0.5 rounded-lg border border-white/[0.16] shadow-[0_20px_50px_rgba(0,0,0,0.95)] max-h-60 overflow-y-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden backdrop-blur-xl"
          style={{
            background: '#10162a',
            width: coords.width,
            left: coords.left,
            top: coords.placeAbove ? undefined : coords.top,
            bottom: coords.placeAbove ? (window.innerHeight - coords.top) : undefined,
          }}
        >
          {options.map((option) => (
            <button
              key={option.value}
              type="button"
              onClick={() => { onChange(option.value); setOpen(false); }}
              className={`w-full text-left px-3 py-2 rounded text-[12px] font-medium transition-colors ${
                value === option.value
                  ? 'bg-indigo-500/25 text-indigo-200 font-semibold border-l-2 border-indigo-400'
                  : 'text-slate-300 hover:bg-white/[0.08] hover:text-white'
              }`}
            >
              {option.label}
            </button>
          ))}
        </div>,
        document.body
      )}
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
      model: 'meta-llama/llama-4-scout-17b-16e-instruct',
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
  const [step, setStep] = useState(0);

  useEffect(() => { setMounted(true); }, []);

  // Cancel recording on close + reset step
  useEffect(() => {
    if (!isOpen) {
      cancelRecording();
      setStep(0);
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
      let safeDate = '';
      if (filmToEdit.date) {
        try {
          const d = new Date(filmToEdit.date);
          if (!isNaN(d.getTime())) {
            safeDate = d.toISOString().split('T')[0];
          } else if (typeof filmToEdit.date === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(filmToEdit.date)) {
            safeDate = filmToEdit.date;
          }
        } catch {
          safeDate = '';
        }
      }

      setFormData({
        ...filmToEdit,
        date: safeDate
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

  const handleSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();

    const trimmedTitle = formData.title?.trim();
    if (!trimmedTitle) {
      showToast('Judul koleksi wajib diisi!', 'error');
      setStep(0);
      return;
    }

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
      title: trimmedTitle,
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
          showToast('Data disimpan lokal & akan disinkron ke database', 'info');
        }
      });
    }
  };

  const inputCls = "w-full bg-[#13192f] border border-white/[0.14] hover:border-white/[0.22] focus:border-indigo-400 focus:ring-1 focus:ring-indigo-500/30 rounded pl-9 pr-3 py-2.5 text-[12px] text-white placeholder:text-slate-400 font-medium transition-colors";
  const inputNoIconCls = "w-full bg-[#13192f] border border-white/[0.14] hover:border-white/[0.22] focus:border-indigo-400 focus:ring-1 focus:ring-indigo-500/30 rounded px-3 py-2.5 text-[12px] text-white placeholder:text-slate-400 font-medium text-center transition-colors";
  const textareaCls = "w-full bg-[#13192f] border border-white/[0.14] hover:border-white/[0.22] focus:border-indigo-400 focus:ring-1 focus:ring-indigo-500/30 rounded px-3 py-2.5 text-[12px] text-white placeholder:text-slate-400 font-medium resize-none transition-colors";
  const labelCls = "text-[10px] font-bold text-slate-200 uppercase tracking-widest ml-0.5 block mb-1.5";

  if (!mounted || !isOpen) return null;

  const STEPS = ['Informasi', 'Detail', 'Catatan'];

  return createPortal(
    <div className="fixed inset-0 z-[999] flex items-end sm:items-center justify-center">
      <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={onClose} />

      <div className="relative w-full h-full sm:h-auto sm:max-w-[520px] z-10">
        <form
          onSubmit={e => {
            e.preventDefault();
            handleSubmit(e);
          }}
          className="w-full h-full sm:h-auto sm:rounded-lg overflow-hidden rounded-none flex flex-col"
          style={{
            background: '#0d1326',
            border: '1px solid rgba(255,255,255,0.12)',
            boxShadow: '0 24px 70px rgba(0,0,0,0.9), 0 0 1px 1px rgba(99,102,241,0.2)',
          }}
        >
          {/* ── Header ── */}
          <div className="flex-none px-4 pt-4 pb-0">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-[14px] font-bold text-white tracking-tight">
                {filmToEdit ? 'Edit Koleksi' : 'Tambah Koleksi'}
              </h2>
              <button type="button" onClick={onClose}
                className="p-1.5 rounded text-slate-400 hover:text-white hover:bg-white/[0.08] transition-colors">
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* ── Flat Stepper ── */}
            <div className="flex items-stretch border-b border-white/[0.1]">
              {STEPS.map((label, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => { if (i <= step || Boolean(formData.title?.trim())) setStep(i); }}
                  className="relative flex-1 flex flex-col items-center gap-1 pb-3"
                >
                  <div className="flex items-center gap-1.5">
                    <span className={`w-4 h-4 rounded flex items-center justify-center text-[9px] font-bold flex-none
                      ${i < step ? 'bg-indigo-500 text-white' :
                        i === step ? 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/40' :
                        'bg-white/[0.08] text-slate-300'}`}>
                      {i < step ? '✓' : i + 1}
                    </span>
                    <span className={`text-[11px] transition-colors
                      ${i === step ? 'text-white font-bold' : i < step ? 'text-indigo-300 font-medium' : 'text-slate-400 font-medium'}`}>
                      {label}
                    </span>
                  </div>
                  {/* Active underline */}
                  <div className={`absolute bottom-0 left-3 right-3 h-[2px] rounded-full transition-colors
                    ${i === step ? 'bg-indigo-500 shadow-[0_0_8px_rgba(99,102,241,0.8)]' : i < step ? 'bg-indigo-500/40' : 'bg-transparent'}`} />
                </button>
              ))}
            </div>
          </div>

          {/* ── Step Content ── */}
          <div className="flex-1 px-4 py-5 space-y-4 min-h-[220px] sm:min-h-[240px] sm:max-h-[60vh] overflow-y-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">

            {/* STEP 1 — Informasi */}
            {step === 0 && (
              <>
                <div>
                  <label className={labelCls}>Judul Koleksi <span className="text-rose-400">*</span></label>
                  <div className="relative">
                    <Clapperboard className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-indigo-400 pointer-events-none" />
                    <input
                      required type="text"
                      placeholder="Judul anime/donghua..."
                      value={formData.title}
                      onChange={e => setFormData({ ...formData, title: e.target.value })}
                      className={inputCls}
                      autoFocus
                    />
                  </div>
                </div>

                <div>
                  <label className={labelCls}>Link (Opsional)</label>
                  <div className="relative">
                    <LinkIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-indigo-400 pointer-events-none" />
                    <input
                      type="url" placeholder="https://..."
                      value={formData.link}
                      onChange={e => setFormData({ ...formData, link: e.target.value })}
                      className={inputCls}
                    />
                  </div>
                </div>

                {/* AI Input */}
                <div>
                  <label className={labelCls}>Input AI Cepat</label>
                  <input type="file" accept="image/*" ref={fileInputRef} className="hidden" onChange={handleImageSelected} />
                  {recording ? (
                    <div className="flex items-center justify-between gap-2 px-3 py-2.5 border border-rose-500/30 bg-rose-500/10 rounded">
                      <div className="flex items-center gap-2">
                        <Radio className="w-3.5 h-3.5 text-rose-500 animate-ping" />
                        <span className="text-[11px] text-rose-300 font-semibold">{formatDuration(recordingDuration)}</span>
                      </div>
                      <div className="flex gap-1">
                        <button type="button" onClick={stopRecording}
                          className="p-1.5 bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 hover:bg-emerald-500/30 rounded transition-colors">
                          <Square className="w-3.5 h-3.5 fill-emerald-300" />
                        </button>
                        <button type="button" onClick={cancelRecording}
                          className="p-1.5 text-slate-300 hover:text-white hover:bg-white/[0.08] rounded transition-colors">
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  ) : aiLoading ? (
                    <div className="flex items-center gap-2 px-3 py-2.5 border border-indigo-500/30 bg-indigo-500/10 rounded">
                      <Loader2 className="w-3.5 h-3.5 text-indigo-400 animate-spin flex-none" />
                      <span className="text-[11px] text-indigo-200 font-medium">{aiStatusText || 'AI sedang bekerja...'}</span>
                    </div>
                  ) : (
                    <div className="flex gap-2">
                      <button type="button" onClick={startRecording}
                        className="flex-1 flex items-center justify-center gap-2 py-2.5 text-[12px] font-semibold text-indigo-300 hover:text-white border border-indigo-500/30 bg-indigo-500/[0.08] hover:bg-indigo-500/[0.18] rounded transition-colors">
                        <Mic className="w-4 h-4 text-indigo-400" /> Input Suara
                      </button>
                      <button type="button" onClick={handleImageScanClick}
                        className="flex-1 flex items-center justify-center gap-2 py-2.5 text-[12px] font-semibold text-indigo-300 hover:text-white border border-indigo-500/30 bg-indigo-500/[0.08] hover:bg-indigo-500/[0.18] rounded transition-colors">
                        <Camera className="w-4 h-4 text-indigo-400" /> Scan Gambar
                      </button>
                    </div>
                  )}
                </div>
              </>
            )}

            {/* STEP 2 — Detail */}
            {step === 1 && (
              <>
                <div className="grid grid-cols-2 gap-2.5">
                  <div>
                    <label className={labelCls}>Tipe <span className="text-rose-400">*</span></label>
                    <CustomSelect
                      value={formData.type as string}
                      onChange={v => setFormData({ ...formData, type: v })}
                      options={TIPE_OPTIONS}
                      icon={Layers}
                    />
                  </div>
                  <div>
                    <label className={labelCls}>Status <span className="text-rose-400">*</span></label>
                    <CustomSelect
                      value={formData.status as string}
                      onChange={v => {
                        setFormData({ ...formData, status: v });
                        if (v === 'Selesai') {
                          if (!totalEps && watched) setTotalEps(watched);
                        } else {
                          if (totalEps && totalEps === watched) setTotalEps('');
                        }
                      }}
                      options={STATUS_OPTIONS}
                      icon={Activity}
                    />
                  </div>
                </div>

                {/* Episode — Full Width */}
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className={labelCls.replace('mb-1.5', '')}>Episode</label>
                    {totalEps && watched && (
                      <span className="text-[11px] font-mono font-bold text-indigo-300">
                        {Math.min(100, Math.round((parseInt(watched, 10) || 0) / (parseInt(totalEps, 10) || 1) * 100))}% Selesai
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    {/* Tonton Stepper */}
                    <div className="flex-1 flex items-center bg-[#13192f] border border-white/[0.14] hover:border-white/[0.22] rounded focus-within:border-indigo-400 focus-within:ring-1 focus-within:ring-indigo-500/30 transition-all overflow-hidden">
                      <button
                        type="button"
                        onClick={() => setWatched(prev => {
                          const val = parseInt(prev, 10);
                          if (isNaN(val) || val <= 0) return '';
                          return String(val - 1);
                        })}
                        className="w-9 h-9 flex items-center justify-center text-slate-300 hover:text-white hover:bg-white/[0.08] active:bg-white/[0.15] transition-colors border-r border-white/[0.08] flex-none"
                        title="Kurang 1 episode"
                      >
                        <Minus className="w-3.5 h-3.5" />
                      </button>
                      <input
                        type="number"
                        min="0"
                        placeholder="Tonton"
                        value={watched}
                        onChange={e => setWatched(e.target.value)}
                        className="w-full bg-transparent py-2 text-center text-[13px] font-bold text-white placeholder:text-slate-400 focus:outline-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none font-mono"
                      >
                      </input>
                      <button
                        type="button"
                        onClick={() => setWatched(prev => {
                          const val = parseInt(prev, 10);
                          const nextVal = isNaN(val) ? 1 : val + 1;
                          if (totalEps && nextVal >= parseInt(totalEps, 10)) {
                            setFormData(f => ({ ...f, status: 'Selesai' }));
                          }
                          return String(nextVal);
                        })}
                        className="w-9 h-9 flex items-center justify-center text-indigo-400 hover:text-indigo-300 hover:bg-indigo-500/20 active:bg-indigo-500/30 transition-colors border-l border-white/[0.08] flex-none"
                        title="Tambah 1 episode"
                      >
                        <Plus className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    <span className="text-slate-400 text-[12px] font-extrabold flex-none">/</span>

                    {/* Total Stepper */}
                    <div className="flex-1 flex items-center bg-[#13192f] border border-white/[0.14] hover:border-white/[0.22] rounded focus-within:border-indigo-400 focus-within:ring-1 focus-within:ring-indigo-500/30 transition-all overflow-hidden">
                      <button
                        type="button"
                        onClick={() => setTotalEps(prev => {
                          const val = parseInt(prev, 10);
                          if (isNaN(val) || val <= 0) return '';
                          return String(val - 1);
                        })}
                        className="w-9 h-9 flex items-center justify-center text-slate-300 hover:text-white hover:bg-white/[0.08] active:bg-white/[0.15] transition-colors border-r border-white/[0.08] flex-none"
                        title="Kurang total episode"
                      >
                        <Minus className="w-3.5 h-3.5" />
                      </button>
                      <input
                        type="number"
                        min="0"
                        placeholder="Total"
                        value={totalEps}
                        onChange={e => setTotalEps(e.target.value)}
                        className="w-full bg-transparent py-2 text-center text-[13px] font-medium text-white placeholder:text-slate-400 focus:outline-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none font-mono"
                      >
                      </input>
                      <button
                        type="button"
                        onClick={() => setTotalEps(prev => {
                          const val = parseInt(prev, 10);
                          return String(isNaN(val) ? 1 : val + 1);
                        })}
                        className="w-9 h-9 flex items-center justify-center text-slate-300 hover:text-white hover:bg-white/[0.08] active:bg-white/[0.15] transition-colors border-l border-white/[0.08] flex-none"
                        title="Tambah total episode"
                      >
                        <Plus className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>

                {/* Tanggal — Full Width below Episode */}
                <div>
                  <label className={labelCls}>Tanggal</label>
                  <div className="relative">
                    <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-indigo-400 pointer-events-none" />
                    <input
                      type="date"
                      value={formData.date || ''}
                      onChange={e => setFormData({ ...formData, date: e.target.value })}
                      className={`${inputCls} [color-scheme:dark]`}
                    />
                  </div>
                </div>
              </>
            )}

            {/* STEP 3 — Catatan */}
            {step === 2 && (
              <>
                <div>
                  <label className={labelCls}>Cast (Opsional)</label>
                  <textarea
                    placeholder="Aktor/Aktris..."
                    value={formData.cast}
                    onChange={e => setFormData({ ...formData, cast: e.target.value })}
                    rows={3}
                    className={textareaCls}
                  />
                </div>
                <div>
                  <label className={labelCls}>Review / Catatan</label>
                  <textarea
                    placeholder="Catatan pribadi..."
                    value={formData.notes || ''}
                    onChange={e => setFormData({ ...formData, notes: e.target.value })}
                    rows={3}
                    className={textareaCls}
                  />
                </div>
              </>
            )}
          </div>

          {/* ── Footer Navigation ── */}
          <div className="flex-none px-4 py-3.5 border-t border-white/[0.05] flex items-center justify-between gap-2">
            <button
              type="button"
              onClick={() => setStep(s => Math.max(0, s - 1))}
              disabled={step === 0}
              className="h-9 px-3.5 rounded text-[12px] font-medium text-gray-400 hover:text-white border border-white/[0.06] hover:bg-white/[0.05] transition-colors disabled:opacity-0 disabled:pointer-events-none"
            >
              ← Kembali
            </button>

            {/* Step dots */}
            <div className="flex items-center gap-1.5">
              {STEPS.map((_, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => { if (i <= step || Boolean(formData.title?.trim())) setStep(i); }}
                  className={`h-1.5 rounded-full transition-all duration-200 ${
                    i === step ? 'w-5 bg-indigo-500' : i < step ? 'w-2 bg-indigo-500/40' : 'w-2 bg-white/[0.08]'
                  }`}
                  title={STEPS[i]}
                />
              ))}
            </div>

            <div className="flex items-center gap-2">
              {step < 2 && (
                <button
                  type="button"
                  onClick={() => {
                    if (!formData.title?.trim()) {
                      showToast('Judul koleksi wajib diisi!', 'error');
                      return;
                    }
                    setStep(s => s + 1);
                  }}
                  className="h-9 px-3.5 rounded text-[12px] font-medium text-gray-300 hover:text-white bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.08] transition-colors"
                >
                  Lanjut →
                </button>
              )}

              <button
                type="submit"
                disabled={!formData.title?.trim() || loading}
                className="h-9 px-5 rounded text-[12px] font-semibold text-white bg-indigo-500 hover:bg-indigo-400 transition-colors disabled:opacity-30 disabled:pointer-events-none flex items-center gap-1.5 shadow-[0_2px_10px_rgba(99,102,241,0.25)]"
              >
                {loading && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                {filmToEdit ? 'Simpan' : 'Tambah'}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>,
    document.body
  );
}
