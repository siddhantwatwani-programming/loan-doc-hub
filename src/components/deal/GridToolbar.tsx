import React, { useState } from 'react';
import { Search, Filter, RefreshCw, X, Trash2, Download, Printer } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';

export interface FilterOption {
  id: string;
  label: string;
  options: { value: string; label: string }[];
}

interface GridToolbarProps {
  searchQuery: string;
  onSearchChange: (query: string) => void;
  onRefresh?: () => void;
  filterOptions?: FilterOption[];
  activeFilters?: Record<string, string>;
  onFilterChange?: (key: string, value: string) => void;
  onClearFilters?: () => void;
  activeFilterCount?: number;
  disabled?: boolean;
  // Bulk delete
  selectedCount?: number;
  onBulkDelete?: () => void;
  // Edit
  onEdit?: () => void;
  // Export
  onExport?: () => void;
  // Print
  onPrint?: () => void;
  searchPlaceholder?: string;
}

export const GridToolbar: React.FC<GridToolbarProps> = ({
  searchQuery,
  onSearchChange,
  onRefresh,
  filterOptions = [],
  activeFilters = {},
  onFilterChange,
  onClearFilters,
  activeFilterCount = 0,
  disabled = false,
  selectedCount = 0,
  onBulkDelete,
  onEdit,
  onExport,
  onPrint,
  searchPlaceholder = 'Search...',
}) => {
  const [filterOpen, setFilterOpen] = useState(false);

  return (
    <div className="flex items-center gap-2 flex-wrap">
      {/* Search */}
      <div className="relative flex-1 min-w-[180px] max-w-[280px]">
        <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
        <Input
          placeholder={searchPlaceholder}
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
          className="h-8 pl-8 text-xs"
          disabled={disabled}
        />
        {searchQuery && (
          <Button
            variant="ghost"
            size="icon"
            className="absolute right-1 top-1/2 -translate-y-1/2 h-5 w-5"
            onClick={() => onSearchChange('')}
          >
            <X className="h-3 w-3" />
          </Button>
        )}
      </div>

      {/* Filter */}
      {filterOptions.length > 0 && (
        <Popover open={filterOpen} onOpenChange={setFilterOpen}>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              size="sm"
              className="h-8 gap-1 text-xs"
              disabled={disabled}
            >
              <Filter className="h-3.5 w-3.5" />
              Filters
              {activeFilterCount > 0 && (
                <Badge variant="secondary" className="ml-1 h-4 w-4 p-0 flex items-center justify-center text-[10px]">
                  {activeFilterCount}
                </Badge>
              )}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-72 p-3" align="start">
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Filters</span>
                {activeFilterCount > 0 && (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-6 text-xs text-muted-foreground"
                    onClick={() => {
                      onClearFilters?.();
                    }}
                  >
                    Clear All
                  </Button>
                )}
              </div>
              {filterOptions.map((filter) => (
                <div key={filter.id} className="space-y-1">
                  <label className="text-xs text-muted-foreground">{filter.label}</label>
                  <Select
                    value={activeFilters[filter.id] || 'all'}
                    onValueChange={(value) => onFilterChange?.(filter.id, value)}
                  >
                    <SelectTrigger className="h-8 text-xs">
                      <SelectValue placeholder={`All ${filter.label}`} />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All</SelectItem>
                      {filter.options.map((opt) => (
                        <SelectItem key={opt.value} value={opt.value}>
                          {opt.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              ))}
            </div>
          </PopoverContent>
        </Popover>
      )}

      {/* Bulk Delete */}
      {onBulkDelete && selectedCount > 0 && (
        <Button
          variant="destructive"
          size="sm"
          className="h-8 gap-1 text-xs"
          onClick={onBulkDelete}
          disabled={disabled}
        >
          <Trash2 className="h-3.5 w-3.5" />
          Delete ({selectedCount})
        </Button>
      )}

      {/* Edit */}
      {onEdit && selectedCount === 1 && (
        <Button
          variant="outline"
          size="sm"
          className="h-8 gap-1 text-xs"
          onClick={onEdit}
          disabled={disabled}
        >
          Edit
        </Button>
      )}

      {/* Export */}
      {onExport && (
        <Button
          variant="outline"
          size="sm"
          className="h-8 gap-1 text-xs"
          onClick={onExport}
          disabled={disabled}
        >
          <Download className="h-3.5 w-3.5" />
          Export
        </Button>
      )}

      {/* Print */}
      {onPrint && (
        <Button
          variant="outline"
          size="sm"
          className="h-8 gap-1 text-xs"
          onClick={onPrint}
          disabled={disabled}
        >
          <Printer className="h-3.5 w-3.5" />
          Print
        </Button>
      )}

      {/* Refresh */}
      {onRefresh && (
        <Button
          variant="outline"
          size="icon"
          className="h-8 w-8"
          onClick={onRefresh}
          disabled={disabled}
        >
          <RefreshCw className="h-3.5 w-3.5" />
        </Button>
      )}
    </div>
  );
};

export default GridToolbar;
