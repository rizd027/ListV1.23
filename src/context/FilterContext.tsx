'use client';

import {
  createContext, useContext, useState, useEffect, useRef,
  ReactNode, useTransition, Dispatch, SetStateAction, useCallback, useMemo
} from 'react';
import { Film } from '@/lib/api';

interface FilterState {
  search: string;
  setSearch: (v: string) => void;
  typeFilter: string;
  setTypeFilter: (v: string) => void;
  sortBy: string;
  setSortBy: (v: string) => void;
  statusFilter: string;
  setStatusFilter: (v: string) => void;
  viewMode: 'list' | 'grid';
  setViewMode: (v: 'list' | 'grid') => void;
  addModalOpen: boolean;
  setAddModalOpen: (v: boolean) => void;
  films: Film[];
  setFilms: Dispatch<SetStateAction<Film[]>>;
  loadingFilms: boolean;
  setLoadingFilms: (v: boolean) => void;
  dataFetched: boolean;
  setDataFetched: (v: boolean) => void;
}

const FilterContext = createContext<FilterState | null>(null);

// Debounce helper for cache writes
function useDebounced<T>(value: T, delay: number): T {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const t = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(t);
  }, [value, delay]);
  return debounced;
}

export function FilterProvider({ children }: { children: ReactNode }) {
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('Semua Kategori');
  const [sortBy, setSortBy] = useState('ID A-Z');
  const [statusFilter, setStatusFilter] = useState('Semua Status');
  const [viewMode, setViewModeState] = useState<'list' | 'grid'>('list');
  const [addModalOpen, setAddModalOpen] = useState(false);
  const [films, setFilms] = useState<Film[]>([]);
  const [loadingFilms, setLoadingFilms] = useState(true);
  const [dataFetched, setDataFetched] = useState(false);
  const [, startTransition] = useTransition();
  const isMounted = useRef(false);

  // Load cache from localStorage once on mount
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const cached = localStorage.getItem('film_data_cache');
    if (cached) {
      try {
        const parsed: Film[] = JSON.parse(cached);
        if (Array.isArray(parsed) && parsed.length > 0) {
          setFilms(parsed);
          setLoadingFilms(false);
        }
      } catch {
        // Corrupt cache — ignore
      }
    }
    isMounted.current = true;
  }, []);

  // Debounce cache writes — write to localStorage only 1.5s after films settle
  // This prevents a write on every optimistic update keypress
  const debouncedFilms = useDebounced(films, 1500);
  useEffect(() => {
    if (!isMounted.current) return; // Skip the initial hydration write
    if (debouncedFilms.length > 0) {
      try {
        localStorage.setItem('film_data_cache', JSON.stringify(debouncedFilms));
      } catch {
        // localStorage full or SSR
      }
    }
  }, [debouncedFilms]);

  const setViewMode = useCallback((v: 'list' | 'grid') => {
    startTransition(() => setViewModeState(v));
  }, [startTransition]);

  const contextValue = useMemo(() => ({
    search, setSearch,
    typeFilter, setTypeFilter,
    sortBy, setSortBy,
    statusFilter, setStatusFilter,
    viewMode, setViewMode,
    addModalOpen, setAddModalOpen,
    films, setFilms,
    loadingFilms, setLoadingFilms,
    dataFetched, setDataFetched,
  }), [
    search, typeFilter, sortBy, statusFilter, viewMode, setViewMode,
    addModalOpen, films, loadingFilms, dataFetched
  ]);

  return (
    <FilterContext.Provider value={contextValue}>
      {children}
    </FilterContext.Provider>
  );
}

export function useFilters() {
  const ctx = useContext(FilterContext);
  if (!ctx) throw new Error('useFilters must be used within FilterProvider');
  return ctx;
}
