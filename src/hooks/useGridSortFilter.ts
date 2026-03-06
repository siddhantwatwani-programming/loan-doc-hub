import { useState, useMemo, useCallback } from 'react';

export type SortDirection = 'asc' | 'desc' | null;

export interface SortState {
  columnId: string | null;
  direction: SortDirection;
}

export interface GridFilterState {
  searchQuery: string;
  sortState: SortState;
  activeFilters: Record<string, string>;
}

export function useGridSortFilter<T extends Record<string, any>>(
  data: T[],
  searchableFields: string[]
) {
  const [searchQuery, setSearchQuery] = useState('');
  const [sortState, setSortState] = useState<SortState>({ columnId: null, direction: null });
  const [activeFilters, setActiveFilters] = useState<Record<string, string>>({});

  const toggleSort = useCallback((columnId: string) => {
    setSortState((prev) => {
      if (prev.columnId !== columnId) return { columnId, direction: 'asc' };
      if (prev.direction === 'asc') return { columnId, direction: 'desc' };
      return { columnId: null, direction: null };
    });
  }, []);

  const setFilter = useCallback((key: string, value: string) => {
    setActiveFilters((prev) => {
      if (!value || value === 'all') {
        const next = { ...prev };
        delete next[key];
        return next;
      }
      return { ...prev, [key]: value };
    });
  }, []);

  const clearFilters = useCallback(() => {
    setActiveFilters({});
    setSearchQuery('');
  }, []);

  const filteredAndSorted = useMemo(() => {
    let result = [...data];

    // Search
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter((item) =>
        searchableFields.some((field) => {
          const val = item[field];
          if (val == null) return false;
          return String(val).toLowerCase().includes(q);
        })
      );
    }

    // Active filters
    Object.entries(activeFilters).forEach(([key, value]) => {
      if (value && value !== 'all') {
        result = result.filter((item) => {
          const val = item[key];
          if (val == null) return false;
          return String(val).toLowerCase() === value.toLowerCase();
        });
      }
    });

    // Sort
    if (sortState.columnId && sortState.direction) {
      const col = sortState.columnId;
      const dir = sortState.direction === 'asc' ? 1 : -1;
      result.sort((a, b) => {
        const aVal = a[col] ?? '';
        const bVal = b[col] ?? '';
        // Try numeric comparison
        const aNum = parseFloat(String(aVal).replace(/[^0-9.-]/g, ''));
        const bNum = parseFloat(String(bVal).replace(/[^0-9.-]/g, ''));
        if (!isNaN(aNum) && !isNaN(bNum)) {
          return (aNum - bNum) * dir;
        }
        return String(aVal).localeCompare(String(bVal)) * dir;
      });
    }

    return result;
  }, [data, searchQuery, sortState, activeFilters, searchableFields]);

  const activeFilterCount = Object.keys(activeFilters).length;

  return {
    searchQuery,
    setSearchQuery,
    sortState,
    toggleSort,
    activeFilters,
    setFilter,
    clearFilters,
    activeFilterCount,
    filteredData: filteredAndSorted,
  };
}
