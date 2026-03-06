import { useState, useCallback, useMemo } from 'react';

export function useGridSelection<T extends { id: string }>(data: T[]) {
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  const toggleOne = useCallback((id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);

  const toggleAll = useCallback(() => {
    setSelectedIds((prev) => {
      if (prev.size === data.length) return new Set();
      return new Set(data.map((d) => d.id));
    });
  }, [data]);

  const clearSelection = useCallback(() => {
    setSelectedIds(new Set());
  }, []);

  const isAllSelected = useMemo(
    () => data.length > 0 && selectedIds.size === data.length,
    [data.length, selectedIds.size]
  );

  const isSomeSelected = useMemo(
    () => selectedIds.size > 0 && selectedIds.size < data.length,
    [data.length, selectedIds.size]
  );

  const selectedItems = useMemo(
    () => data.filter((d) => selectedIds.has(d.id)),
    [data, selectedIds]
  );

  return {
    selectedIds,
    selectedItems,
    toggleOne,
    toggleAll,
    clearSelection,
    isAllSelected,
    isSomeSelected,
    selectedCount: selectedIds.size,
  };
}
