'use client';

import { createContext, useContext, useState, ReactNode, useTransition } from 'react';
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
  const [, startTransition] = useTransition();

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
