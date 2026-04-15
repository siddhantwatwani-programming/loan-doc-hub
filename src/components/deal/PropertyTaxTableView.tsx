import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Plus, ArrowLeft } from 'lucide-react';
import { DeleteConfirmationDialog } from './DeleteConfirmationDialog';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import { GridToolbar, FilterOption } from './GridToolbar';
import { GridExportDialog, ExportColumn } from './GridExportDialog';
import { SortableTableHead } from './SortableTableHead';
import { ColumnConfigPopover, ColumnConfig } from './ColumnConfigPopover';
import { useTableColumnConfig } from '@/hooks/useTableColumnConfig';
import { useGridSortFilter } from '@/hooks/useGridSortFilter';
import { useGridSelection } from '@/hooks/useGridSelection';

export interface PropertyTaxData {
  id: string;
  property: string;
  authority: string;
  address: string;
  type: string;
  apn: string;
  memo: string;
  annualPayment: string;
  amount: string;
  nextDue: string;
  frequency: string;
  escrowImpounds: string;
  passThrough: string;
  sourceOfInformation: string;
  active: boolean;
  lastVerified: string;
  lenderNotified: string;
  current: boolean;
  delinquent: boolean;
  delinquentAmount: string;
  borrowerNotified: boolean;
  borrowerNotifiedDate: string;
  lenderNotifiedDate: string;
  pmaStreet: string;
  pmaCity: string;
  pmaState: string;
  pmaZip: string;
}

interface PropertyTaxTableViewProps {
  taxes: PropertyTaxData[];
  onAddTax: () => void;
  onEditTax: (tax: PropertyTaxData) => void;
  onRowClick: (tax: PropertyTaxData) => void;
  onDeleteTax?: (tax: PropertyTaxData) => void;
  onBulkDelete?: (taxes: PropertyTaxData[]) => void;
  onBack?: () => void;
  onRefresh?: () => void;
  disabled?: boolean;
  currentPage?: number;
  totalPages?: number;
  totalCount?: number;
  onPageChange?: (page: number) => void;
}

const SEARCH_FIELDS = ['property', 'authority', 'type', 'frequency', 'apn', 'pmaStreet', 'pmaCity'];

const FILTER_OPTIONS: FilterOption[] = [
  {
    id: 'type',
    label: 'Type',
    options: [
      { value: 'Current Property Tax', label: 'Current Property Tax' },
      { value: 'Delinquent Property Tax', label: 'Delinquent Property Tax' },
      { value: 'Other', label: 'Other' },
    ],
  },
];

const EXPORT_COLUMNS: ExportColumn[] = [
  { id: 'property', label: 'Property' },
  { id: 'authority', label: 'Tax Authority' },
  { id: 'type', label: 'Type' },
  { id: 'apn', label: 'APN' },
  { id: 'memo', label: 'Memo' },
  { id: 'annualPayment', label: 'Annual Payment (est.)' },
  { id: 'amount', label: 'Amount' },
  { id: 'nextDue', label: 'Next Due' },
  { id: 'frequency', label: 'Frequency' },
  { id: 'escrowImpounds', label: 'Escrow Impounds' },
  { id: 'passThrough', label: 'Pass Through' },
  { id: 'sourceOfInformation', label: 'Source of Information' },
  { id: 'pmaStreet', label: 'Street' },
  { id: 'pmaCity', label: 'City' },
  { id: 'pmaState', label: 'State' },
  { id: 'pmaZip', label: 'ZIP' },
  { id: 'active', label: 'Active' },
  { id: 'lastVerified', label: 'Last Verified' },
  { id: 'lenderNotified', label: 'Lender Notified' },
  { id: 'current', label: 'Current' },
  { id: 'delinquent', label: 'Delinquent' },
  { id: 'borrowerNotified', label: 'Borrower Notified' },
  { id: 'borrowerNotifiedDate', label: 'Borrower Notified Date' },
  { id: 'lenderNotifiedDate', label: 'Lender Notified Date' },
];

const DEFAULT_COLUMNS: ColumnConfig[] = [
  { id: 'property', label: 'Property', visible: true },
  { id: 'authority', label: 'Tax Authority', visible: true },
  { id: 'type', label: 'Type', visible: true },
  { id: 'apn', label: 'APN', visible: false },
  { id: 'memo', label: 'Memo', visible: false },
  { id: 'annualPayment', label: 'Annual Payment (est.)', visible: true },
  { id: 'amount', label: 'Amount', visible: true },
  { id: 'nextDue', label: 'Next Due', visible: true },
  { id: 'frequency', label: 'Frequency', visible: true },
  { id: 'escrowImpounds', label: 'Escrow Impounds', visible: false },
  { id: 'passThrough', label: 'Pass Through', visible: false },
  { id: 'sourceOfInformation', label: 'Source of Information', visible: false },
  { id: 'pmaStreet', label: 'Street', visible: false },
  { id: 'pmaCity', label: 'City', visible: false },
  { id: 'pmaState', label: 'State', visible: false },
  { id: 'pmaZip', label: 'ZIP', visible: false },
  { id: 'active', label: 'Active', visible: true },
  { id: 'lastVerified', label: 'Last Verified', visible: true },
  { id: 'lenderNotified', label: 'Lender Notified', visible: true },
  { id: 'current', label: 'Current', visible: true },
  { id: 'delinquent', label: 'Delinquent', visible: true },
  { id: 'borrowerNotified', label: 'Borrower Notified', visible: false },
  { id: 'borrowerNotifiedDate', label: 'Borrower Notified Date', visible: false },
  { id: 'lenderNotifiedDate', label: 'Lender Notified Date', visible: false },
];

const formatCurrency = (value: string) => {
  if (!value) return '';
  const num = parseFloat(value.replace(/[^0-9.-]/g, ''));
  if (isNaN(num)) return value;
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 2 }).format(num);
};

const formatDate = (val: string) => {
  if (!val) return '-';
  try {
    const d = new Date(val);
    if (isNaN(d.getTime())) return val;
    return `${String(d.getMonth() + 1).padStart(2, '0')}/${String(d.getDate()).padStart(2, '0')}/${d.getFullYear()}`;
  } catch { return val; }
};

const renderCellValue = (tax: PropertyTaxData, columnId: string) => {
  switch (columnId) {
    case 'property': return tax.property || '-';
    case 'authority': return tax.authority || '-';
    
    case 'type': return tax.type || '-';
    case 'apn': return tax.apn || '-';
    case 'memo': return tax.memo || '-';
    case 'annualPayment': return formatCurrency(tax.annualPayment) || '-';
    case 'amount': return formatCurrency(tax.amount) || '-';
    case 'nextDue': return formatDate(tax.nextDue);
    case 'frequency': return tax.frequency || '-';
    case 'escrowImpounds': return tax.escrowImpounds || '-';
    case 'passThrough': return tax.passThrough || '-';
    case 'sourceOfInformation': return tax.sourceOfInformation || '-';
    case 'pmaStreet': return tax.pmaStreet || '-';
    case 'pmaCity': return tax.pmaCity || '-';
    case 'pmaState': return tax.pmaState || '-';
    case 'pmaZip': return tax.pmaZip || '-';
    case 'active': return tax.active ? '✓' : '-';
    case 'lastVerified': return formatDate(tax.lastVerified);
    case 'lenderNotified': return formatDate(tax.lenderNotified || tax.lenderNotifiedDate);
    case 'current': return tax.current ? '✓' : '-';
    case 'delinquent': return tax.delinquent ? (formatCurrency(tax.delinquentAmount) || '✓') : '-';
    case 'borrowerNotified': return tax.borrowerNotified ? '✓' : '-';
    case 'borrowerNotifiedDate': return formatDate(tax.borrowerNotifiedDate);
    case 'lenderNotifiedDate': return formatDate(tax.lenderNotifiedDate);
    default: return '-';
  }
};

export const PropertyTaxTableView: React.FC<PropertyTaxTableViewProps> = ({
  taxes,
  onAddTax,
  onRowClick,
  onDeleteTax,
  onBulkDelete,
  onBack,
  onRefresh,
  disabled = false,
  currentPage = 1,
  totalPages = 1,
  totalCount,
  onPageChange,
}) => {
  const [bulkDeleteOpen, setBulkDeleteOpen] = useState(false);
  const [exportOpen, setExportOpen] = useState(false);
  const [columns, setColumns, resetColumns] = useTableColumnConfig('property_tax', DEFAULT_COLUMNS);
  const visibleColumns = columns.filter((col) => col.visible);

  const {
    searchQuery, setSearchQuery, sortState, toggleSort,
    activeFilters, setFilter, clearFilters, activeFilterCount, filteredData,
  } = useGridSortFilter(taxes, SEARCH_FIELDS);

  const prevCountRef = React.useRef(taxes.length);
  React.useEffect(() => {
    if (taxes.length !== prevCountRef.current) {
      setSearchQuery('');
      prevCountRef.current = taxes.length;
    }
  }, [taxes.length, setSearchQuery]);

  const {
    selectedIds, selectedItems, toggleOne, toggleAll, clearSelection,
    isAllSelected, isSomeSelected, selectedCount,
  } = useGridSelection(filteredData);

  const handleBulkDelete = () => {
    if (onBulkDelete) {
      onBulkDelete(selectedItems);
    } else if (onDeleteTax) {
      selectedItems.forEach((item) => onDeleteTax(item));
    }
    clearSelection();
    setBulkDeleteOpen(false);
  };

  return (
    <div className="p-4 space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          {onBack && (
            <Button variant="ghost" size="sm" onClick={onBack} className="gap-1 h-8">
              <ArrowLeft className="h-4 w-4" />
              Back
            </Button>
          )}
          <h3 className="text-lg font-semibold text-foreground">Property Tax</h3>
        </div>
        <div className="flex items-center gap-2">
          <ColumnConfigPopover
            columns={columns}
            onColumnsChange={setColumns}
            onResetColumns={resetColumns}
            disabled={disabled}
          />
          <Button size="sm" onClick={onAddTax} disabled={disabled} className="gap-1">
            <Plus className="h-4 w-4" />
            Add Property Tax
          </Button>
        </div>
      </div>

      <GridToolbar
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        onRefresh={onRefresh}
        filterOptions={FILTER_OPTIONS}
        activeFilters={activeFilters}
        onFilterChange={setFilter}
        onClearFilters={clearFilters}
        activeFilterCount={activeFilterCount}
        disabled={disabled}
        selectedCount={selectedCount}
        onBulkDelete={() => setBulkDeleteOpen(true)}
        onExport={() => setExportOpen(true)}
        onPrint={() => window.print()}
      />

      <div className="border border-border rounded-lg overflow-hidden">
        <div className="overflow-x-auto" style={{ minWidth: '100%' }}>
          <Table>
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
                    label={col.label}
                    sortColumnId={sortState.columnId}
                    sortDirection={sortState.direction}
                    onSort={toggleSort}
                    className={col.id === 'annualPayment' || col.id === 'amount' ? 'min-w-[120px] text-right' : 'min-w-[100px]'}
                  />
                ))}
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredData.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={visibleColumns.length + 1} className="text-center py-8 text-muted-foreground">
                    {taxes.length === 0 ? 'No property tax records added. Click "Add Property Tax" to create one.' : 'No property tax records match your search or filters.'}
                  </TableCell>
                </TableRow>
              ) : (
                filteredData.map((tax) => (
                  <TableRow key={tax.id} className="cursor-pointer hover:bg-muted/50" onClick={() => onRowClick(tax)}>
                    <TableCell onClick={(e) => e.stopPropagation()}>
                      <Checkbox checked={selectedIds.has(tax.id)} onCheckedChange={() => toggleOne(tax.id)} disabled={disabled} />
                    </TableCell>
                    {visibleColumns.map((col) => (
                      <TableCell key={col.id} className={col.id === 'annualPayment' || col.id === 'amount' ? 'text-right' : col.id === 'authority' ? 'font-medium' : ''}>
                        {renderCellValue(tax, col.id)}
                      </TableCell>
                    ))}
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </div>

      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <div className="text-sm text-muted-foreground">
            Showing {(currentPage - 1) * 10 + 1}–{Math.min(currentPage * 10, totalCount ?? taxes.length)} of {totalCount ?? taxes.length} records
          </div>
          <div className="flex items-center gap-1">
            <Button variant="outline" size="sm" onClick={() => onPageChange?.(1)} disabled={currentPage <= 1 || disabled}>First</Button>
            <Button variant="outline" size="sm" onClick={() => onPageChange?.(currentPage - 1)} disabled={currentPage <= 1 || disabled}>Previous</Button>
            <span className="px-3 py-1 bg-primary text-primary-foreground rounded text-sm">{currentPage}</span>
            <Button variant="outline" size="sm" onClick={() => onPageChange?.(currentPage + 1)} disabled={currentPage >= totalPages || disabled}>Next</Button>
            <Button variant="outline" size="sm" onClick={() => onPageChange?.(totalPages)} disabled={currentPage >= totalPages || disabled}>Last</Button>
          </div>
        </div>
      )}

      {taxes.length > 0 && (
        <div className="flex justify-end">
          <div className="text-sm text-muted-foreground">
            {filteredData.length !== taxes.length && `Showing ${filteredData.length} of `}
            Total Property Tax Records: {totalCount ?? taxes.length}
          </div>
        </div>
      )}

      <DeleteConfirmationDialog
        open={bulkDeleteOpen}
        onOpenChange={setBulkDeleteOpen}
        onConfirm={handleBulkDelete}
        title={`Delete ${selectedCount} Property Tax Records`}
        description={`Are you sure you want to delete ${selectedCount} selected property tax records? This action cannot be undone.`}
      />

      <GridExportDialog
        open={exportOpen}
        onOpenChange={setExportOpen}
        columns={EXPORT_COLUMNS}
        data={taxes}
        fileName="property_tax"
      />
    </div>
  );
};

export default PropertyTaxTableView;
