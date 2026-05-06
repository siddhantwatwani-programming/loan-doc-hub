import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Plus, ArrowLeft } from 'lucide-react';
import { Checkbox } from '@/components/ui/checkbox';
import { DeleteConfirmationDialog } from './DeleteConfirmationDialog';
import { GridToolbar } from './GridToolbar';
import { GridExportDialog, ExportColumn } from './GridExportDialog';
import { SortableTableHead } from './SortableTableHead';
import { ColumnConfigPopover, ColumnConfig } from './ColumnConfigPopover';
import { useTableColumnConfig } from '@/hooks/useTableColumnConfig';
import { useGridSortFilter } from '@/hooks/useGridSortFilter';
import { useGridSelection } from '@/hooks/useGridSelection';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';

export interface LienData {
  id: string;
  property: string;
  priority: string;
  holder: string;
  account: string;
  contact: string;
  phone: string;
  fax: string;
  email: string;
  loanType: string;
  loanTypeDropdown: string;
  anticipated: string;
  anticipatedAmount: string;
  existingRemain: string;
  existingPaydown: string;
  existingPayoff: string;
  existingPaydownAmount: string;
  existingPayoffAmount: string;
  lienPriorityNow: string;
  lienPriorityAfter: string;
  remainingNewLienPriority: string;
  newRemainingBalance: string;
  interestRate: string;
  maturityDate: string;
  originalBalance: string;
  balanceAfter: string;
  currentBalance: string;
  regularPayment: string;
  balloon: string;
  balloonAmount: string;
  recordingNumber: string;
  recordingNumberFlag: string;
  recordingDate: string;
  seniorLienTracking: string;
  sltActive: string;
  lastVerified: string;
  lastChecked: string;
  sltCurrent: string;
  sltDelinquent: string;
  sltDelinquentDays: string;
  sltUnderModification: string;
  sltForeclosure: string;
  sltForeclosureDate: string;
  sltPaidOff: string;
  sltLastPaymentMade: string;
  sltNextPaymentDue: string;
  sltCurrentBalance: string;
  sltRequestSubmitted: string;
  sltResponseReceived: string;
  sltUnableToVerify: string;
  sltLenderNotified: string;
  sltLenderNotifiedDate: string;
  sltBorrowerNotified: string;
  sltBorrowerNotifiedDate: string;
  note: string;
  thisLoan: string;
  estimate: string;
  status: string;
  delinquencies60day: string;
  delinquenciesHowMany: string;
  currentlyDelinquent: string;
  currentlyDelinquentAmount: string;
  paidByLoan: string;
  sourceOfPayment: string;
  sourceOfInformation: string;
}

interface LiensTableViewProps {
  liens: LienData[];
  onAddLien: () => void;
  onEditLien: (lien: LienData) => void;
  onRowClick: (lien: LienData) => void;
  onDeleteLien?: (lien: LienData) => void;
  onBulkDelete?: (liens: LienData[]) => void;
  onRefresh?: () => void;
  onBack?: () => void;
  disabled?: boolean;
  currentPage?: number;
  totalPages?: number;
  totalCount?: number;
  onPageChange?: (page: number) => void;
}

const SEARCHABLE_FIELDS = ['property', 'holder', 'loanTypeDropdown', 'lienPriorityNow', 'remainingNewLienPriority', 'lastVerified'];

const FILTER_OPTIONS = [
  {
    id: 'loanType',
    label: 'Loan Type',
    options: [
      { value: 'conventional', label: 'Conventional' },
      { value: 'fha', label: 'FHA' },
      { value: 'va', label: 'VA' },
      { value: 'heloc', label: 'HELOC' },
      { value: 'commercial', label: 'Commercial' },
    ],
  },
];

const EXPORT_COLUMNS: ExportColumn[] = [
  { id: 'property', label: 'Related Property' },
  { id: 'holder', label: 'Lien Holder' },
  { id: 'loanTypeDropdown', label: 'Loan Type' },
  { id: 'lienPriorityNow', label: 'Lien Priority Now' },
  { id: 'lienPriorityAfter', label: 'Lien Priority After' },
  { id: 'interestRate', label: 'Interest Rate' },
  { id: 'originalBalance', label: 'Original Balance' },
  { id: 'balanceAfter', label: 'Balance After' },
  { id: 'regularPayment', label: 'Regular Payment' },
  { id: 'recordingNumber', label: 'Recording Number' },
  { id: 'lastVerified', label: 'Last Verified' },
];

const DEFAULT_COLUMNS: ColumnConfig[] = [
  { id: 'property', label: 'Related Property', visible: true },
  { id: 'holder', label: 'Lien Holder', visible: true },
  { id: 'anticipated', label: 'Anticipated', visible: true },
  { id: 'loanTypeDropdown', label: 'Loan Type', visible: true },
  { id: 'lienPriorityNow', label: 'Lien Priority Now', visible: true },
  { id: 'lienPriorityAfter', label: 'Lien Priority After', visible: true },
  { id: 'interestRate', label: 'Interest Rate', visible: true },
  { id: 'originalBalance', label: 'Original Balance', visible: true },
  { id: 'balanceAfter', label: 'Balance After', visible: true },
  { id: 'regularPayment', label: 'Regular Payment', visible: true },
  { id: 'recordingNumber', label: 'Recording Number', visible: true },
  { id: 'lastVerified', label: 'Last Verified', visible: true },
];

export const LiensTableView: React.FC<LiensTableViewProps> = ({
  liens, onAddLien, onEditLien, onRowClick, onDeleteLien, onBulkDelete, onRefresh, onBack, disabled = false,
  currentPage = 1, totalPages = 1, totalCount, onPageChange,
}) => {
  const [bulkDeleteOpen, setBulkDeleteOpen] = useState(false);
  const [exportOpen, setExportOpen] = useState(false);
  const [columns, setColumns, resetColumns] = useTableColumnConfig('liens_v2', DEFAULT_COLUMNS);
  const visibleColumns = columns.filter((col) => col.visible);

  const {
    searchQuery, setSearchQuery, sortState, toggleSort,
    activeFilters, setFilter, clearFilters, activeFilterCount, filteredData,
  } = useGridSortFilter(liens, SEARCHABLE_FIELDS);

  const {
    selectedIds, selectedItems, toggleOne, toggleAll, clearSelection,
    isAllSelected, isSomeSelected, selectedCount,
  } = useGridSelection(filteredData);

  const formatCurrency = (value: string) => {
    if (!value) return '';
    const num = parseFloat(value.replace(/[^0-9.-]/g, ''));
    if (isNaN(num)) return value;
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 2 }).format(num);
  };

  const handleBulkDelete = () => {
    if (onBulkDelete) {
      onBulkDelete(selectedItems);
    } else if (onDeleteLien) {
      selectedItems.forEach((l) => onDeleteLien(l));
    }
    clearSelection();
    setBulkDeleteOpen(false);
  };

  const renderCellValue = (lien: LienData, columnId: string) => {
    switch (columnId) {
      case 'property': return lien.property || 'Unassigned';
      case 'holder': return lien.holder || '-';
      case 'loanTypeDropdown': return lien.loanTypeDropdown || '-';
      case 'lienPriorityNow': return lien.lienPriorityNow || '-';
      case 'lienPriorityAfter': return lien.lienPriorityAfter || '-';
      case 'remainingNewLienPriority': return lien.remainingNewLienPriority || '-';
      case 'interestRate': return lien.interestRate ? `${lien.interestRate}%` : '-';
      case 'originalBalance': return formatCurrency(lien.originalBalance) || '-';
      case 'balanceAfter': return lien.lienPriorityAfter || '-';
      case 'currentBalance': return formatCurrency(lien.currentBalance) || '-';
      case 'regularPayment': return formatCurrency(lien.regularPayment) || '-';
      case 'recordingNumber': return lien.recordingNumber || '-';
      case 'lastVerified': {
        if (!lien.lastVerified) return '-';
        try {
          const d = new Date(lien.lastVerified);
          if (isNaN(d.getTime())) return lien.lastVerified;
          return `${String(d.getMonth() + 1).padStart(2, '0')}/${String(d.getDate()).padStart(2, '0')}/${d.getFullYear()}`;
        } catch { return lien.lastVerified; }
      }
      default: return '-';
    }
  };

  return (
    <div className="p-4">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          {onBack && (
            <Button variant="ghost" size="sm" onClick={onBack} className="gap-1 h-8">
              <ArrowLeft className="h-4 w-4" />
              Back
            </Button>
          )}
          <h3 className="text-lg font-semibold text-foreground">Liens</h3>
        </div>
        <div className="flex items-center gap-2">
          <ColumnConfigPopover
            columns={columns}
            onColumnsChange={setColumns}
            onResetColumns={resetColumns}
            disabled={disabled}
          />
          <Button variant="outline" size="sm" onClick={onAddLien} disabled={disabled} className="gap-1">
            <Plus className="h-4 w-4" />
            Add Lien
          </Button>
        </div>
      </div>

      <div className="mb-3">
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
          onExport={() => setExportOpen(true)}
          onPrint={() => window.print()}
        />
      </div>

      <div className="border border-border rounded-lg overflow-hidden">
        <div className="overflow-x-auto" style={{ minWidth: '100%' }}>
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/50">
                <TableHead className="w-[40px]">
                  <Checkbox checked={isAllSelected} onCheckedChange={() => toggleAll()} aria-label="Select all" />
                </TableHead>
                {visibleColumns.map((col) => (
                  <SortableTableHead
                    key={col.id}
                    columnId={col.id}
                    label={col.label}
                    sortColumnId={sortState.columnId}
                    sortDirection={sortState.direction}
                    onSort={toggleSort}
                    className={['originalBalance', 'balanceAfter', 'currentBalance', 'regularPayment'].includes(col.id) ? 'min-w-[120px] text-right' : 'min-w-[100px]'}
                  />
                ))}
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredData.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={visibleColumns.length + 1} className="text-center py-8 text-muted-foreground">
                    No liens added. Click "Add Lien" to create one.
                  </TableCell>
                </TableRow>
              ) : (
                filteredData.map((lien) => (
                  <TableRow key={lien.id} className="cursor-pointer hover:bg-muted/50" onClick={() => onRowClick(lien)}>
                    <TableCell onClick={(e) => e.stopPropagation()} className="w-[40px]">
                      <Checkbox checked={selectedIds.has(lien.id)} onCheckedChange={() => toggleOne(lien.id)} aria-label={`Select lien`} />
                    </TableCell>
                    {visibleColumns.map((col) => (
                      <TableCell key={col.id} className={['originalBalance', 'balanceAfter', 'currentBalance', 'regularPayment'].includes(col.id) ? 'text-right' : ''}>
                        {renderCellValue(lien, col.id)}
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
        <div className="flex items-center justify-between px-6 pb-2">
          <div className="text-sm text-muted-foreground">
            Showing {(currentPage - 1) * 10 + 1}–{Math.min(currentPage * 10, totalCount ?? liens.length)} of {totalCount ?? liens.length} liens
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
      {liens.length > 0 && (
        <div className="flex justify-end px-6 pb-4">
          <div className="text-sm text-muted-foreground">
            Total Liens: {totalCount ?? liens.length}
          </div>
        </div>
      )}

      <DeleteConfirmationDialog
        open={bulkDeleteOpen}
        onOpenChange={setBulkDeleteOpen}
        onConfirm={handleBulkDelete}
        title="Delete Selected Liens"
        description={`Are you sure you want to delete ${selectedCount} selected lien(s)? This action cannot be undone.`}
      />

      <GridExportDialog
        open={exportOpen}
        onOpenChange={setExportOpen}
        columns={EXPORT_COLUMNS}
        data={filteredData}
        fileName="liens_export"
      />
    </div>
  );
};

export default LiensTableView;
