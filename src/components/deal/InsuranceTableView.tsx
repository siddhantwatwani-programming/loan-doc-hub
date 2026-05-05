import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Plus, ArrowLeft } from 'lucide-react';
import { DeleteConfirmationDialog } from './DeleteConfirmationDialog';
import { Badge } from '@/components/ui/badge';
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

export interface InsuranceData {
  id: string;
  property: string;
  description: string;
  companyName: string;
  policyNumber: string;
  expiration: string;
  annualPremium: string;
  frequency: string;
  active: boolean;
  agentName: string;
  businessAddress: string;
  businessAddressCity: string;
  businessAddressState: string;
  businessAddressZip: string;
  phoneNumber: string;
  faxNumber: string;
  email: string;
  note: string;
  paymentMailingStreet: string;
  paymentMailingCity: string;
  paymentMailingState: string;
  paymentMailingZip: string;
  insuranceTracking: boolean;
  lastVerified: string;
  trackingStatus: string;
  impoundsActive: boolean;
  impoundedStatus: string;
  redFlagTrigger: string;
  attemptAgent: boolean;
  attemptBorrower: boolean;
  lenderNotified: boolean;
  lenderNotifiedDate: string;
}

interface InsuranceTableViewProps {
  insurances: InsuranceData[];
  onAddInsurance: () => void;
  onEditInsurance: (insurance: InsuranceData) => void;
  onRowClick: (insurance: InsuranceData) => void;
  onDeleteInsurance?: (insurance: InsuranceData) => void;
  onBulkDelete?: (insurances: InsuranceData[]) => void;
  onBack?: () => void;
  onRefresh?: () => void;
  disabled?: boolean;
  currentPage?: number;
  totalPages?: number;
  totalCount?: number;
  onPageChange?: (page: number) => void;
}

const SEARCH_FIELDS = ['description', 'companyName', 'policyNumber', 'agentName', 'annualPremium', 'frequency'];

const FILTER_OPTIONS: FilterOption[] = [
  {
    id: 'active',
    label: 'Status',
    options: [
      { value: 'true', label: 'Active' },
      { value: 'false', label: 'Inactive' },
    ],
  },
];

const EXPORT_COLUMNS: ExportColumn[] = [
  { id: 'property', label: 'Property' },
  { id: 'description', label: 'Description' },
  { id: 'companyName', label: 'Company' },
  { id: 'policyNumber', label: 'Policy #' },
  { id: 'expiration', label: 'Expiration' },
  { id: 'annualPremium', label: 'Annual Premium' },
  { id: 'frequency', label: 'Frequency' },
  { id: 'active', label: 'Status' },
  { id: 'agentName', label: 'Agent' },
  { id: 'businessAddress', label: 'Bus. Address' },
  { id: 'businessAddressCity', label: 'Agent City' },
  { id: 'businessAddressState', label: 'Agent State' },
  { id: 'businessAddressZip', label: 'Agent ZIP' },
  { id: 'phoneNumber', label: 'Phone' },
  { id: 'faxNumber', label: 'Fax' },
  { id: 'email', label: 'Email' },
  { id: 'paymentMailingStreet', label: 'Street' },
  { id: 'paymentMailingCity', label: 'City' },
  { id: 'paymentMailingState', label: 'State' },
  { id: 'paymentMailingZip', label: 'ZIP' },
  { id: 'impoundsActive', label: 'Impounds' },
  { id: 'lastVerified', label: 'Last Verified' },
  { id: 'trackingStatus', label: 'Tracking Status' },
  { id: 'attemptAgent', label: 'Attempt Agent' },
  { id: 'attemptBorrower', label: 'Attempted Borrower' },
  { id: 'lenderNotified', label: 'Notified Lender' },
  { id: 'lenderNotifiedDate', label: 'Lender Notified Date' },
];

const DEFAULT_COLUMNS: ColumnConfig[] = [
  { id: 'property', label: 'Property', visible: true },
  { id: 'description', label: 'Description', visible: true },
  { id: 'companyName', label: 'Company', visible: true },
  { id: 'policyNumber', label: 'Policy #', visible: true },
  { id: 'expiration', label: 'Expiration', visible: true },
  { id: 'annualPremium', label: 'Annual Premium', visible: true },
  { id: 'frequency', label: 'Frequency', visible: true },
  { id: 'active', label: 'Status', visible: true },
  { id: 'agentName', label: 'Agent', visible: true },
  { id: 'businessAddress', label: 'Bus. Address', visible: false },
  { id: 'businessAddressCity', label: 'Agent City', visible: false },
  { id: 'businessAddressState', label: 'Agent State', visible: false },
  { id: 'businessAddressZip', label: 'Agent ZIP', visible: false },
  { id: 'phoneNumber', label: 'Phone', visible: false },
  { id: 'faxNumber', label: 'Fax', visible: false },
  { id: 'email', label: 'Email', visible: false },
  { id: 'paymentMailingStreet', label: 'Street', visible: false },
  { id: 'paymentMailingCity', label: 'City', visible: false },
  { id: 'paymentMailingState', label: 'State', visible: false },
  { id: 'paymentMailingZip', label: 'ZIP', visible: false },
  { id: 'impoundsActive', label: 'Impounds', visible: false },
  { id: 'lastVerified', label: 'Last Verified', visible: false },
  { id: 'trackingStatus', label: 'Tracking Status', visible: false },
  { id: 'attemptAgent', label: 'Attempt Agent', visible: false },
  { id: 'attemptBorrower', label: 'Attempted Borrower', visible: false },
  { id: 'lenderNotified', label: 'Notified Lender', visible: false },
  { id: 'lenderNotifiedDate', label: 'Lender Notified Date', visible: false },
];

const formatCurrency = (value: string) => {
  if (!value) return '';
  const num = parseFloat(value.replace(/[^0-9.-]/g, ''));
  if (isNaN(num)) return value;
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 2 }).format(num);
};

const formatDateValue = (val: string) => {
  if (!val) return '-';
  try {
    const d = new Date(val);
    if (isNaN(d.getTime())) return val;
    return `${String(d.getMonth() + 1).padStart(2, '0')}/${String(d.getDate()).padStart(2, '0')}/${d.getFullYear()}`;
  } catch { return val; }
};

const renderCellValue = (insurance: InsuranceData, columnId: string) => {
  switch (columnId) {
    case 'property': return insurance.property || 'Unassigned';
    case 'description': return insurance.description || '-';
    case 'companyName': return insurance.companyName || '-';
    case 'policyNumber': return insurance.policyNumber || '-';
    case 'expiration': return formatDateValue(insurance.expiration);
    case 'annualPremium': return formatCurrency(insurance.annualPremium) || '-';
    case 'frequency': return insurance.frequency || '-';
    case 'active': return (
      <Badge variant={insurance.active ? 'default' : 'secondary'}>
        {insurance.active ? 'Active' : 'Inactive'}
      </Badge>
    );
    case 'agentName': return insurance.agentName || '-';
    case 'businessAddress': return insurance.businessAddress || '-';
    case 'businessAddressCity': return insurance.businessAddressCity || '-';
    case 'businessAddressState': return insurance.businessAddressState || '-';
    case 'businessAddressZip': return insurance.businessAddressZip || '-';
    case 'phoneNumber': return insurance.phoneNumber || '-';
    case 'faxNumber': return insurance.faxNumber || '-';
    case 'email': return insurance.email || '-';
    case 'paymentMailingStreet': return insurance.paymentMailingStreet || '-';
    case 'paymentMailingCity': return insurance.paymentMailingCity || '-';
    case 'paymentMailingState': return insurance.paymentMailingState || '-';
    case 'paymentMailingZip': return insurance.paymentMailingZip || '-';
    case 'impoundsActive': return insurance.impoundsActive ? 'Yes' : 'No';
    case 'lastVerified': return formatDateValue(insurance.lastVerified);
    case 'trackingStatus': return insurance.trackingStatus || '-';
    case 'attemptAgent': return insurance.attemptAgent ? 'Yes' : 'No';
    case 'attemptBorrower': return insurance.attemptBorrower ? 'Yes' : 'No';
    case 'lenderNotified': return insurance.lenderNotified ? 'Yes' : 'No';
    case 'lenderNotifiedDate': return formatDateValue(insurance.lenderNotifiedDate);
    default: return '-';
  }
};

export const InsuranceTableView: React.FC<InsuranceTableViewProps> = ({
  insurances,
  onAddInsurance,
  onEditInsurance,
  onRowClick,
  onDeleteInsurance,
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
  const [columns, setColumns, resetColumns] = useTableColumnConfig('insurance', DEFAULT_COLUMNS);
  const visibleColumns = columns.filter((col) => col.visible);

  const {
    searchQuery, setSearchQuery, sortState, toggleSort,
    activeFilters, setFilter, clearFilters, activeFilterCount, filteredData,
  } = useGridSortFilter(insurances, SEARCH_FIELDS);

  // Clear search when insurance list changes (e.g., after modal save)
  const prevCountRef = React.useRef(insurances.length);
  React.useEffect(() => {
    if (insurances.length !== prevCountRef.current) {
      setSearchQuery('');
      prevCountRef.current = insurances.length;
    }
  }, [insurances.length, setSearchQuery]);

  const {
    selectedIds, selectedItems, toggleOne, toggleAll, clearSelection,
    isAllSelected, isSomeSelected, selectedCount,
  } = useGridSelection(filteredData);

  const handleBulkDelete = () => {
    if (onBulkDelete) {
      onBulkDelete(selectedItems);
    } else if (onDeleteInsurance) {
      selectedItems.forEach((item) => onDeleteInsurance(item));
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
          <h3 className="text-lg font-semibold text-foreground">Insurance</h3>
        </div>
        <div className="flex items-center gap-2">
          <ColumnConfigPopover
            columns={columns}
            onColumnsChange={setColumns}
            onResetColumns={resetColumns}
            disabled={disabled}
          />
          <Button size="sm" onClick={onAddInsurance} disabled={disabled} className="gap-1">
            <Plus className="h-4 w-4" />
            Add Insurance
          </Button>
        </div>
      </div>

      {/* Grid Toolbar */}
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
                    className={col.id === 'annualPremium' ? 'min-w-[120px] text-right' : 'min-w-[100px]'}
                  />
                ))}
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredData.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={visibleColumns.length + 1} className="text-center py-8 text-muted-foreground">
                    {insurances.length === 0 ? 'No insurance records added. Click "Add Insurance" to create one.' : 'No insurance records match your search or filters.'}
                  </TableCell>
                </TableRow>
              ) : (
                filteredData.map((insurance) => (
                  <TableRow key={insurance.id} className="cursor-pointer hover:bg-muted/50" onClick={() => onRowClick(insurance)}>
                    <TableCell onClick={(e) => e.stopPropagation()}>
                      <Checkbox checked={selectedIds.has(insurance.id)} onCheckedChange={() => toggleOne(insurance.id)} disabled={disabled} />
                    </TableCell>
                    {visibleColumns.map((col) => (
                      <TableCell key={col.id} className={col.id === 'description' ? 'font-medium' : col.id === 'annualPremium' ? 'text-right' : ''}>
                        {renderCellValue(insurance, col.id)}
                      </TableCell>
                    ))}
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <div className="text-sm text-muted-foreground">
            Showing {(currentPage - 1) * 10 + 1}–{Math.min(currentPage * 10, totalCount ?? insurances.length)} of {totalCount ?? insurances.length} records
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

      {/* Footer */}
      {insurances.length > 0 && (
        <div className="flex justify-end">
          <div className="text-sm text-muted-foreground">
            {filteredData.length !== insurances.length && `Showing ${filteredData.length} of `}
            Total Insurance Records: {totalCount ?? insurances.length}
          </div>
        </div>
      )}

      <DeleteConfirmationDialog
        open={bulkDeleteOpen}
        onOpenChange={setBulkDeleteOpen}
        onConfirm={handleBulkDelete}
        title={`Delete ${selectedCount} Insurance Records`}
        description={`Are you sure you want to delete ${selectedCount} selected insurance records? This action cannot be undone.`}
      />

      <GridExportDialog
        open={exportOpen}
        onOpenChange={setExportOpen}
        columns={EXPORT_COLUMNS}
        data={insurances}
        fileName="insurance"
      />
    </div>
  );
};

export default InsuranceTableView;
