'use client';

import { createContext, useContext, useState, ReactNode } from 'react';

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
}

const FilterContext = createContext<FilterState | null>(null);

export function FilterProvider({ children }: { children: ReactNode }) {
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('Semua Kategori');
  const [sortBy, setSortBy] = useState('ID A-Z');
  const [statusFilter, setStatusFilter] = useState('Semua Status');
  const [viewMode, setViewMode] = useState<'list' | 'grid'>('list');

  return (
    <FilterContext.Provider value={{ search, setSearch, typeFilter, setTypeFilter, sortBy, setSortBy, statusFilter, setStatusFilter, viewMode, setViewMode }}>
      {children}
    </FilterContext.Provider>
  );
}

export function useFilters() {
  const ctx = useContext(FilterContext);
  if (!ctx) throw new Error('useFilters must be used within FilterProvider');
  return ctx;
}
