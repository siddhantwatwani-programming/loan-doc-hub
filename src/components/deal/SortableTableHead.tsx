import React from 'react';
import { ArrowUp, ArrowDown, ArrowUpDown } from 'lucide-react';
import { TableHead } from '@/components/ui/table';
import { type SortDirection } from '@/hooks/useGridSortFilter';

interface SortableTableHeadProps {
  columnId: string;
  label: string;
  sortColumnId: string | null;
  sortDirection: SortDirection;
  onSort: (columnId: string) => void;
  className?: string;
}

export const SortableTableHead: React.FC<SortableTableHeadProps> = ({
  columnId,
  label,
  sortColumnId,
  sortDirection,
  onSort,
  className,
}) => {
  const isActive = sortColumnId === columnId;

  return (
    <TableHead
      className={`cursor-pointer select-none hover:bg-muted/70 transition-colors ${className || ''}`}
      onClick={() => onSort(columnId)}
    >
      <div className="flex items-center gap-1">
        <span>{label}</span>
        {isActive && sortDirection === 'asc' && <ArrowUp className="h-3 w-3 text-primary" />}
        {isActive && sortDirection === 'desc' && <ArrowDown className="h-3 w-3 text-primary" />}
        {!isActive && <ArrowUpDown className="h-3 w-3 text-muted-foreground/50" />}
      </div>
    </TableHead>
  );
};

export default SortableTableHead;
