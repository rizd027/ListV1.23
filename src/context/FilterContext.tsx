'use client';

import { createContext, useContext, useState, useEffect, ReactNode, useTransition } from 'react';
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
  setFilms: (films: Film[]) => void;
  loadingFilms: boolean;
  setLoadingFilms: (v: boolean) => void;
  dataFetched: boolean;
  setDataFetched: (v: boolean) => void;
  isOnline: boolean;
  isSyncing: boolean;
  setIsSyncing: (v: boolean) => void;
}

const FilterContext = createContext<FilterState | null>(null);

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
  const [isOnline, setIsOnline] = useState(true);
  const [isSyncing, setIsSyncing] = useState(false);
  const [, startTransition] = useTransition();

  useEffect(() => {
    if (typeof window !== 'undefined') {
      setIsOnline(navigator.onLine);
      const handleOnline = () => setIsOnline(true);
      const handleOffline = () => setIsOnline(false);

      window.addEventListener('online', handleOnline);
      window.addEventListener('offline', handleOffline);

      const cached = localStorage.getItem('film_data_cache');
      if (cached) {
        try {
          const parsed = JSON.parse(cached);
          if (parsed && parsed.length > 0) {
            setFilms(parsed);
          }
        } catch (e) {}
      }

      return () => {
        window.removeEventListener('online', handleOnline);
        window.removeEventListener('offline', handleOffline);
      };
    }
  }, []);

  useEffect(() => {
    if (films.length > 0) {
      localStorage.setItem('film_data_cache', JSON.stringify(films));
    }
  }, [films]);

  const setViewMode = (v: 'list' | 'grid') => {
    startTransition(() => {
      setViewModeState(v);
    });
  };

  return (
    <FilterContext.Provider value={{
      search, setSearch,
      typeFilter, setTypeFilter,
      sortBy, setSortBy,
      statusFilter, setStatusFilter,
      viewMode, setViewMode,
      addModalOpen, setAddModalOpen,
      films, setFilms,
      loadingFilms, setLoadingFilms,
      dataFetched, setDataFetched,
      isOnline, isSyncing, setIsSyncing
    }}>
      {children}
    </FilterContext.Provider>
  );
}

export function useFilters() {
  const ctx = useContext(FilterContext);
  if (!ctx) throw new Error('useFilters must be used within FilterProvider');
  return ctx;
}
