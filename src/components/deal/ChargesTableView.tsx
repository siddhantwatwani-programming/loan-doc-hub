import React, { useState } from 'react';
import { Search, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import { Skeleton } from '@/components/ui/skeleton';
import { ColumnConfigPopover, ColumnConfig } from './ColumnConfigPopover';
import { useTableColumnConfig } from '@/hooks/useTableColumnConfig';
import { DeleteConfirmationDialog } from './DeleteConfirmationDialog';
import { FilterOption } from './GridToolbar';
import { GridExportDialog, ExportColumn } from './GridExportDialog';
import { SortableTableHead } from './SortableTableHead';
import { useGridSortFilter } from '@/hooks/useGridSortFilter';
import { useGridSelection } from '@/hooks/useGridSelection';
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

export interface ChargeData {
  id: string;
  description: string;
  unpaidBalance: string;
  owedTo: string;
  owedFrom: string;
  totalDue: string;
  interestFrom: string;
  dateOfCharge: string;
  interestRate: string;
  notes: string;
  reference: string;
  chargeType: string;
  deferred: string;
  originalAmount: string;
  account: string;
  borrowerFullName: string;
  advancedByAccount: string;
  advancedByLenderName: string;
  advancedByAmount: string;
  onBehalfOfAccount: string;
  onBehalfOfLenderName: string;
  onBehalfOfAmount: string;
  amountOwedByBorrower: string;
  accruedInterest: string;
  distributeBetweenAllLenders: string;
}

interface ChargesTableViewProps {
  charges: ChargeData[];
  onAddCharge: () => void;
  onEditCharge: (charge: ChargeData) => void;
  onRowClick: (charge: ChargeData) => void;
  onDeleteCharge?: (charge: ChargeData) => void;
  onBulkDelete?: (charges: ChargeData[]) => void;
  onRefresh?: () => void;
  onSave?: () => void;
  disabled?: boolean;
  isLoading?: boolean;
  currentPage?: number;
  totalPages?: number;
  totalCount?: number;
  onPageChange?: (page: number) => void;
}

const DEFAULT_COLUMNS: ColumnConfig[] = [
  { id: 'dateOfCharge', label: 'Date', visible: true },
  { id: 'reference', label: 'Reference', visible: true },
  { id: 'chargeType', label: 'Type', visible: true },
  { id: 'description', label: 'Description', visible: true },
  { id: 'interestRate', label: 'Interest Rate', visible: true },
  { id: 'interestFrom', label: 'Interest From', visible: true },
  { id: 'deferred', label: 'Deferred', visible: true },
  { id: 'originalAmount', label: 'Original Balance', visible: true },
  { id: 'unpaidBalance', label: 'Unpaid Balance', visible: true },
  { id: 'accruedInterest', label: 'Accrued Interest', visible: true },
];

const SEARCH_FIELDS = ['description', 'reference', 'chargeType', 'dateOfCharge', 'owedTo', 'owedFrom'];

const FILTER_OPTIONS: FilterOption[] = [
  {
    id: 'chargeType',
    label: 'Charge Type',
    options: [
      { value: 'interest', label: 'Interest' },
      { value: 'fee', label: 'Fee' },
      { value: 'advance', label: 'Advance' },
      { value: 'escrow', label: 'Escrow' },
      { value: 'insurance', label: 'Insurance' },
      { value: 'tax', label: 'Tax' },
    ],
  },
  {
    id: 'deferred',
    label: 'Deferred',
    options: [
      { value: 'yes', label: 'Yes' },
      { value: 'no', label: 'No' },
    ],
  },
  {
    id: 'owedTo',
    label: 'Owed To',
    options: [
      { value: 'lender', label: 'Lender' },
      { value: 'servicer', label: 'Servicer' },
      { value: 'broker', label: 'Broker' },
      { value: 'other', label: 'Other' },
    ],
  },
  {
    id: 'owedFrom',
    label: 'Owed By',
    options: [
      { value: 'borrower', label: 'Borrower' },
      { value: 'co-borrower', label: 'Co-Borrower' },
      { value: 'guarantor', label: 'Guarantor' },
      { value: 'other', label: 'Other' },
    ],
  },
  {
    id: 'paid',
    label: 'Paid',
    options: [
      { value: 'yes', label: 'Yes' },
      { value: 'no', label: 'No' },
    ],
  },
  {
    id: 'deleted',
    label: 'Deleted',
    options: [
      { value: 'yes', label: 'Yes' },
      { value: 'no', label: 'No' },
    ],
  },
];

export const ChargesTableView: React.FC<ChargesTableViewProps> = ({
  charges,
  onAddCharge,
  onEditCharge,
  onRowClick,
  onDeleteCharge,
  onBulkDelete,
  onRefresh,
  onSave,
  disabled = false,
  isLoading = false,
  currentPage = 1,
  totalPages = 1,
  totalCount,
  onPageChange,
}) => {
  const [columns, setColumns, resetColumns] = useTableColumnConfig('charges_v6', DEFAULT_COLUMNS);
  const [bulkDeleteOpen, setBulkDeleteOpen] = useState(false);
  const [exportOpen, setExportOpen] = useState(false);
  const [showPaid, setShowPaid] = useState(false);
  const [filterOpen, setFilterOpen] = useState(false);
  const visibleColumns = columns.filter((col) => col.visible);

  const {
    searchQuery, setSearchQuery, sortState, toggleSort,
    activeFilters, setFilter, clearFilters, activeFilterCount, filteredData,
  } = useGridSortFilter(charges, SEARCH_FIELDS);

  const {
    selectedIds, selectedItems, toggleOne, toggleAll, clearSelection,
    isAllSelected, isSomeSelected, selectedCount,
  } = useGridSelection(filteredData);

  const parseCurrency = (value: string): number => {
    if (!value) return 0;
    const num = parseFloat(value);
    return isNaN(num) ? 0 : num;
  };

  const formatCurrency = (value: string | number) => {
    const num = typeof value === 'number' ? value : parseFloat(value as string);
    if (isNaN(num)) return '$0.00';
    return `$${num.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };

  const totals = {
    originalAmount: charges.reduce((sum, c) => sum + parseCurrency(c.originalAmount), 0),
    unpaidBalance: charges.reduce((sum, c) => sum + parseCurrency(c.unpaidBalance), 0),
    accruedInterest: charges.reduce((sum, c) => sum + parseCurrency(c.accruedInterest), 0),
  };

  const formatDateUS = (value: string) => {
    if (!value) return '-';
    try {
      const d = new Date(value);
      if (isNaN(d.getTime())) return value;
      return `${String(d.getMonth() + 1).padStart(2, '0')}/${String(d.getDate()).padStart(2, '0')}/${d.getFullYear()}`;
    } catch { return value; }
  };

  const renderCellValue = (charge: ChargeData, columnId: string) => {
    switch (columnId) {
      case 'description':
        return <span className="font-medium">{charge.description || '-'}</span>;
      case 'unpaidBalance':
      case 'totalDue':
      case 'originalAmount':
      case 'accruedInterest':
      case 'amountOwedByBorrower':
        return formatCurrency(charge[columnId as keyof ChargeData] as string);
      case 'interestRate':
        return charge.interestRate ? `${charge.interestRate}%` : '-';
      case 'date':
      case 'interestFrom':
        return formatDateUS(charge[columnId as keyof ChargeData] as string);
      default:
        return charge[columnId as keyof ChargeData] || '-';
    }
  };

  const handleBulkDelete = () => {
    if (onBulkDelete) {
      onBulkDelete(selectedItems);
    } else if (onDeleteCharge) {
      selectedItems.forEach((item) => onDeleteCharge(item));
    }
    clearSelection();
    setBulkDeleteOpen(false);
  };

  const exportColumns: ExportColumn[] = DEFAULT_COLUMNS.map(c => ({ id: c.id, label: c.label }));

  return (
    <div className="p-6 space-y-4">
      {/* Title */}
      <h3 className="font-semibold text-lg text-foreground">Charges</h3>

      {/* Toolbar: Search left, text-link actions right */}
      <div className="flex items-center gap-3 flex-wrap">
        {/* Search */}
        <div className="relative min-w-[140px] max-w-[180px]">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
          <Input
            placeholder="Search..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="h-8 pl-8 text-xs"
            disabled={disabled}
          />
          {searchQuery && (
            <Button
              variant="ghost"
              size="icon"
              className="absolute right-1 top-1/2 -translate-y-1/2 h-5 w-5"
              onClick={() => setSearchQuery('')}
            >
              <X className="h-3 w-3" />
            </Button>
          )}
        </div>

        {/* Spacer */}
        <div className="flex-1" />

        {/* Text-link action buttons */}
        <div className="flex items-center gap-1 flex-wrap">
          <Button variant="ghost" size="sm" className="h-7 text-xs font-semibold text-primary px-2" onClick={onAddCharge} disabled={disabled}>Add</Button>
          <Button variant="ghost" size="sm" className="h-7 text-xs font-semibold text-primary px-2" onClick={() => { if (selectedCount === 1) onEditCharge(selectedItems[0]); }} disabled={disabled || selectedCount !== 1}>Edit</Button>
          <Button variant="ghost" size="sm" className="h-7 text-xs font-semibold text-primary px-2" disabled={disabled}>History</Button>
          <Button variant="ghost" size="sm" className="h-7 text-xs font-semibold text-primary px-2" onClick={onSave} disabled={disabled}>Save</Button>
          <Button variant="ghost" size="sm" className="h-7 text-xs font-semibold text-primary px-2" onClick={onRefresh} disabled={disabled}>Refresh</Button>
          <Button variant="ghost" size="sm" className="h-7 text-xs font-semibold text-primary px-2" onClick={() => setShowPaid(!showPaid)} disabled={disabled}>{showPaid ? 'Hide Paid' : 'Show Paid'}</Button>
          <Button variant="ghost" size="sm" className="h-7 text-xs font-semibold text-primary px-2" onClick={() => setExportOpen(true)} disabled={disabled}>Export</Button>
          <Button variant="ghost" size="sm" className="h-7 text-xs font-semibold text-primary px-2" onClick={() => window.print()} disabled={disabled}>Print</Button>
          <Button variant="ghost" size="sm" className="h-7 text-xs font-semibold text-primary px-2" onClick={() => { if (selectedCount > 0) setBulkDeleteOpen(true); }} disabled={disabled || selectedCount === 0}>Delete</Button>
          <ColumnConfigPopover columns={columns} onColumnsChange={setColumns} onResetColumns={resetColumns} disabled={disabled} />
          {/* Filter popover */}
          {FILTER_OPTIONS.length > 0 && (
            <Popover open={filterOpen} onOpenChange={setFilterOpen}>
              <PopoverTrigger asChild>
                <Button variant="ghost" size="sm" className="h-7 text-xs font-semibold text-primary px-2 gap-1" disabled={disabled}>
                  Filter
                  {activeFilterCount > 0 && (
                    <Badge variant="secondary" className="ml-0.5 h-4 w-4 p-0 flex items-center justify-center text-[10px]">
                      {activeFilterCount}
                    </Badge>
                  )}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-72 p-3" align="end">
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Filters</span>
                    {activeFilterCount > 0 && (
                      <Button variant="ghost" size="sm" className="h-6 text-xs text-muted-foreground" onClick={clearFilters}>Clear All</Button>
                    )}
                  </div>
                  {FILTER_OPTIONS.map((filter) => (
                    <div key={filter.id} className="space-y-1">
                      <label className="text-xs text-muted-foreground">{filter.label}</label>
                      <Select value={activeFilters[filter.id] || 'all'} onValueChange={(value) => setFilter(filter.id, value)}>
                        <SelectTrigger className="h-8 text-xs">
                          <SelectValue placeholder={`All ${filter.label}`} />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">All</SelectItem>
                          {filter.options.map((opt) => (
                            <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  ))}
                </div>
              </PopoverContent>
            </Popover>
          )}
        </div>
      </div>

      {/* Table */}
      <div className="border border-border rounded-lg overflow-x-auto">
        <Table className="min-w-[900px]">
          <TableHeader>
            <TableRow className="bg-muted/50">
              <TableHead className="w-[40px]">
                <Checkbox
                  checked={isAllSelected}
                  ref={(el) => { if (el) (el as any).indeterminate = isSomeSelected; }}
                  onCheckedChange={toggleAll}
                  disabled={disabled || filteredData.length === 0}
                />
              </TableHead>
              {visibleColumns.map((col) => (
                <SortableTableHead
                  key={col.id}
                  columnId={col.id}
                  label={col.label.toUpperCase()}
                  sortColumnId={sortState.columnId}
                  sortDirection={sortState.direction}
                  onSort={toggleSort}
                />
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              Array.from({ length: 3 }).map((_, index) => (
                <TableRow key={`skeleton-${index}`}>
                  <TableCell><Skeleton className="h-4 w-4" /></TableCell>
                  {Array.from({ length: visibleColumns.length }).map((_, cellIndex) => (
                    <TableCell key={`skeleton-cell-${cellIndex}`}><Skeleton className="h-4 w-full" /></TableCell>
                  ))}
                </TableRow>
              ))
            ) : filteredData.length === 0 ? (
              <TableRow>
                <TableCell colSpan={visibleColumns.length + 1} className="text-center py-8 text-muted-foreground">
                  {charges.length === 0 ? 'No charges added. Click "Add Charge" to add one.' : 'No charges match your search or filters.'}
                </TableCell>
              </TableRow>
            ) : (
              filteredData.map((charge) => (
                <TableRow key={charge.id} className="cursor-pointer hover:bg-muted/30" onClick={() => onRowClick(charge)}>
                  <TableCell onClick={(e) => e.stopPropagation()}>
                    <Checkbox checked={selectedIds.has(charge.id)} onCheckedChange={() => toggleOne(charge.id)} disabled={disabled} />
                  </TableCell>
                  {visibleColumns.map((col) => (
                    <TableCell key={col.id}>{renderCellValue(charge, col.id)}</TableCell>
                  ))}
                </TableRow>
              ))
            )}
            {charges.length > 0 && (
              <TableRow className="bg-muted/50 font-semibold border-t-2 border-border">
                <TableCell />
                {visibleColumns.map((col) => {
                  const totalKey = col.id as keyof typeof totals;
                  if (totalKey in totals) {
                    return <TableCell key={col.id}>{formatCurrency(totals[totalKey])}</TableCell>;
                  }
                  return <TableCell key={col.id}>{col.id === visibleColumns[0]?.id ? 'TOTALS' : ''}</TableCell>;
                })}
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <div className="text-sm text-muted-foreground">
            Showing {(currentPage - 1) * 10 + 1}–{Math.min(currentPage * 10, totalCount ?? charges.length)} of {totalCount ?? charges.length} charges
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={() => onPageChange?.(1)} disabled={currentPage <= 1 || disabled}>First</Button>
            <Button variant="outline" size="sm" onClick={() => onPageChange?.(currentPage - 1)} disabled={currentPage <= 1 || disabled}>Previous</Button>
            <span className="px-3 py-1 bg-primary text-primary-foreground rounded text-sm">{currentPage}</span>
            <Button variant="outline" size="sm" onClick={() => onPageChange?.(currentPage + 1)} disabled={currentPage >= totalPages || disabled}>Next</Button>
            <Button variant="outline" size="sm" onClick={() => onPageChange?.(totalPages)} disabled={currentPage >= totalPages || disabled}>Last</Button>
          </div>
        </div>
      )}

      {/* Footer */}
      {charges.length > 0 && (
        <div className="flex justify-end">
          <div className="text-sm text-muted-foreground">
            Total Charges: {totalCount ?? charges.length}
          </div>
        </div>
      )}

      <DeleteConfirmationDialog
        open={bulkDeleteOpen}
        onOpenChange={setBulkDeleteOpen}
        onConfirm={handleBulkDelete}
        title={`Delete ${selectedCount} Charges`}
        description={`Are you sure you want to delete ${selectedCount} selected charges? This action cannot be undone.`}
      />

      <GridExportDialog
        open={exportOpen}
        onOpenChange={setExportOpen}
        columns={exportColumns}
        data={charges}
        fileName="charges"
      />
    </div>
  );
};

export default ChargesTableView;
