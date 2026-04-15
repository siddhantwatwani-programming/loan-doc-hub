import React, { useState } from 'react';
import { Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import { Skeleton } from '@/components/ui/skeleton';
import { ColumnConfigPopover, ColumnConfig } from './ColumnConfigPopover';
import { useTableColumnConfig } from '@/hooks/useTableColumnConfig';
import { DeleteConfirmationDialog } from './DeleteConfirmationDialog';
import { GridToolbar, FilterOption } from './GridToolbar';
import { GridExportDialog, ExportColumn } from './GridExportDialog';
import { SortableTableHead } from './SortableTableHead';
import { useGridSortFilter } from '@/hooks/useGridSortFilter';
import { useGridSelection } from '@/hooks/useGridSelection';

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
  department: string;
  category: string;
  details: string;
  currentBalance: string;
  balanceDueAsOf: string;
  balanceDue: string;
  advancedByDeferred: string;
  advancedByTotal: string;
  onBehalfOfBilling: string;
  onBehalfOfTotal: string;
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
  { id: 'department', label: 'Department', visible: true },
  { id: 'category', label: 'Category', visible: true },
  { id: 'notes', label: 'Notes', visible: true },
  { id: 'interestRate', label: 'Interest Rate', visible: true },
  { id: 'interestFrom', label: 'Interest From', visible: true },
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
      {/* Header with title and actions — matches Properties */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="font-semibold text-lg text-foreground">Charges</h3>
        </div>
        <div className="flex items-center gap-2">
          <ColumnConfigPopover
            columns={columns}
            onColumnsChange={setColumns}
            onResetColumns={resetColumns}
            disabled={disabled}
          />
          <Button
            variant="outline"
            size="sm"
            onClick={onAddCharge}
            disabled={disabled}
            className="gap-1"
          >
            <Plus className="h-4 w-4" />
            Add Charge
          </Button>
        </div>
      </div>

      {/* Grid Toolbar — matches Properties */}
      <GridToolbar
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        onRefresh={undefined}
        filterOptions={FILTER_OPTIONS}
        activeFilters={activeFilters}
        onFilterChange={setFilter}
        onClearFilters={clearFilters}
        activeFilterCount={activeFilterCount}
        disabled={disabled}
        selectedCount={selectedCount}
        onBulkDelete={() => setBulkDeleteOpen(true)}
        onEdit={() => { if (selectedCount === 1) onEditCharge(selectedItems[0]); }}
        onExport={() => setExportOpen(true)}
      />

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
          </TableBody>
        </Table>
      </div>

      {/* Pagination — matches Properties */}
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

      {/* Footer — matches Properties */}
      {charges.length > 0 && (
        <div className="flex justify-end">
          <div className="text-sm text-muted-foreground">
            Total Charges: {totalCount ?? charges.length} | 
            Total Unpaid Balance: {formatCurrency(totals.unpaidBalance)}
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
