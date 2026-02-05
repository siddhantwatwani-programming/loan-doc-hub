import { useState, useEffect, useCallback } from 'react';
import { ColumnConfig } from '@/components/deal/ColumnConfigPopover';

const STORAGE_KEY_PREFIX = 'table_column_config_';

export function useTableColumnConfig(
  tableId: string,
  defaultColumns: ColumnConfig[]
): [ColumnConfig[], (columns: ColumnConfig[]) => void] {
  const storageKey = `${STORAGE_KEY_PREFIX}${tableId}`;

  const [columns, setColumns] = useState<ColumnConfig[]>(() => {
    try {
      const stored = localStorage.getItem(storageKey);
      if (stored) {
        const parsed = JSON.parse(stored) as ColumnConfig[];
        // Merge with defaults to handle new columns added after initial storage
        const storedIds = new Set(parsed.map((c) => c.id));
        const defaultIds = new Set(defaultColumns.map((c) => c.id));
        
        // Keep stored columns that still exist in defaults, in their stored order
        const mergedColumns = parsed.filter((c) => defaultIds.has(c.id));
        
        // Add any new default columns that weren't in storage
        defaultColumns.forEach((dc) => {
          if (!storedIds.has(dc.id)) {
            mergedColumns.push(dc);
          }
        });
        
        return mergedColumns;
      }
    } catch (e) {
      console.error('Failed to parse stored column config:', e);
    }
    return defaultColumns;
  });

  const updateColumns = useCallback(
    (newColumns: ColumnConfig[]) => {
      setColumns(newColumns);
      try {
        localStorage.setItem(storageKey, JSON.stringify(newColumns));
      } catch (e) {
        console.error('Failed to save column config:', e);
      }
    },
    [storageKey]
  );

  // Sync with defaults if they change
  useEffect(() => {
    const defaultIds = new Set(defaultColumns.map((c) => c.id));
    const currentIds = new Set(columns.map((c) => c.id));
    
    // Check if we need to add new columns from defaults
    const hasNewColumns = defaultColumns.some((dc) => !currentIds.has(dc.id));
    
    if (hasNewColumns) {
      const newColumns = [...columns];
      defaultColumns.forEach((dc) => {
        if (!currentIds.has(dc.id)) {
          newColumns.push(dc);
        }
      });
      updateColumns(newColumns);
    }
  }, [defaultColumns, columns, updateColumns]);

  return [columns, updateColumns];
}
