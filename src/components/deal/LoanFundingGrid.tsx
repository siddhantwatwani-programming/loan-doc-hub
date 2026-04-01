import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import { Plus, History, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { AddFundingModal, FundingFormData } from './AddFundingModal';
import { DeleteConfirmationDialog } from './DeleteConfirmationDialog';
import { FundingHistoryDialog } from './FundingHistoryDialog';
import { ColumnConfigPopover, ColumnConfig } from './ColumnConfigPopover';
import { useTableColumnConfig } from '@/hooks/useTableColumnConfig';
import { GridToolbar, FilterOption } from './GridToolbar';
import { GridExportDialog, ExportColumn } from './GridExportDialog';
import { SortableTableHead } from './SortableTableHead';
import { useGridSortFilter } from '@/hooks/useGridSortFilter';
import { useGridSelection } from '@/hooks/useGridSelection';
import { formatCurrencyDisplay } from '@/lib/numericInputFilter';

const DEFAULT_COLUMNS: ColumnConfig[] = [
  { id: 'fundingDate', label: 'Funding Date', visible: true },
  { id: 'lenderAccount', label: 'Lender Account', visible: true },
  { id: 'lenderName', label: 'Lender Name', visible: true },
  { id: 'pctOwned', label: 'Pct Owned', visible: true },
  { id: 'lenderRate', label: 'Lender Rate', visible: true },
  { id: 'principalBalance', label: 'Principal Balance', visible: true },
  { id: 'originalAmount', label: 'Original Amount', visible: true },
  { id: 'regularPayment', label: 'Regular Payment', visible: true },
  
  { id: 'roundingError', label: 'Rounding Error', visible: true },
];

export interface FundingRecord {
  id: string;
  fundingDate: string;
  lenderAccount: string;
  lenderName: string;
  pctOwned: number;
  lenderRate: number;
  principalBalance: number;
  originalAmount: number;
  regularPayment: number;
  lenderShare: number;
  roundingError: boolean;
  rateSelection?: 'note_rate' | 'sold_rate' | 'lender_rate';
  rateNoteValue?: string;
  rateSoldValue?: string;
  rateLenderValue?: string;
  brokerParticipates?: boolean;
  interestFrom?: string;
  // Servicing fees
  overrideServicingFees?: boolean;
  companyServicingFee?: string;
  companyServicingFeePct?: string;
  companyMaxFee?: string;
  companyMaxFeePct?: string;
  companyMinFee?: string;
  companyMinFeePct?: string;
  brokerServicingFee?: string;
  brokerServicingFeePct?: string;
  brokerMaxFee?: string;
  brokerMaxFeePct?: string;
  brokerMinFee?: string;
  brokerMinFeePct?: string;
  // Default fees
  overrideDefaultFees?: boolean;
  lateFee1Lender?: string;
  lateFee1Company?: string;
  lateFee1Broker?: string;
  lateFee1Total?: string;
  lateFee2Lender?: string;
  lateFee2Company?: string;
  lateFee2Broker?: string;
  lateFee2Total?: string;
  defaultInterestLender?: string;
  defaultInterestCompany?: string;
  defaultInterestBroker?: string;
  defaultInterestTotal?: string;
  interestGuaranteeLender?: string;
  interestGuaranteeCompany?: string;
  interestGuaranteeBroker?: string;
  interestGuaranteeTotal?: string;
  prepaymentLender?: string;
  prepaymentCompany?: string;
  prepaymentBroker?: string;
  prepaymentTotal?: string;
  maturityLender?: string;
  maturityCompany?: string;
  maturityBroker?: string;
  maturityTotal?: string;
}

interface LoanFundingGridProps {
  dealId: string;
  loanNumber?: string;
  borrowerName?: string;
  fundingRecords: FundingRecord[];
  historyRecords?: any[];
  onAddFunding: (data: any) => void;
  onDeleteRecord?: (record: FundingRecord) => void;
  onBulkDelete?: (records: FundingRecord[]) => void;
  onUpdateRecord: (id: string, data: Partial<FundingRecord>) => void;
  onRefresh?: () => void;
  isLoading?: boolean;
  disabled?: boolean;
  currentPage: number;
  totalPages: number;
  pageSize: number;
  onPageChange: (page: number) => void;
  onPageSizeChange: (size: number) => void;
  noteRate?: string;
  soldRate?: string;
  totalPayment?: string;
  loanAmount?: string;
}

const SEARCH_FIELDS = ['lenderAccount', 'lenderName'];

const buildFundingFilterOptions = (records: FundingRecord[]): FilterOption[] => {
  const uniqueAccounts = [...new Set(records.map(r => r.lenderAccount).filter(Boolean))];
  const uniqueNames = [...new Set(records.map(r => r.lenderName).filter(Boolean))];
  const uniqueRates = [...new Set(records.map(r => r.lenderRate))].sort((a, b) => a - b);

  return [
    {
      id: 'lenderAccount',
      label: 'Lender Account',
      options: uniqueAccounts.map(a => ({ value: a, label: a })),
    },
    {
      id: 'lenderName',
      label: 'Lender Name',
      options: uniqueNames.map(n => ({ value: n, label: n })),
    },
    {
      id: 'lenderRate',
      label: 'Lender Rate',
      options: uniqueRates.map(r => ({ value: String(r), label: `${r.toFixed(3)}%` })),
    },
  ];
};

export const LoanFundingGrid: React.FC<LoanFundingGridProps> = ({
  dealId,
  loanNumber,
  borrowerName,
  fundingRecords,
  historyRecords = [],
  onAddFunding,
  onDeleteRecord,
  onBulkDelete,
  onUpdateRecord,
  onRefresh,
  isLoading = false,
  currentPage,
  totalPages,
  pageSize,
  onPageChange,
  onPageSizeChange,
  disabled = false,
  noteRate = '',
  soldRate = '',
  totalPayment = '',
  loanAmount = '',
}) => {
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const [selectedRecord, setSelectedRecord] = useState<FundingRecord | null>(null);
  const [bulkDeleteOpen, setBulkDeleteOpen] = useState(false);
  const [exportOpen, setExportOpen] = useState(false);
  const [editFundingData, setEditFundingData] = useState<FundingFormData | null>(null);
  const [columns, setColumns, resetColumns] = useTableColumnConfig('funding', DEFAULT_COLUMNS);
  const visibleColumns = columns.filter((col) => col.visible);

  const {
    searchQuery, setSearchQuery, sortState, toggleSort,
    activeFilters, setFilter, clearFilters, activeFilterCount, filteredData,
  } = useGridSortFilter(fundingRecords, SEARCH_FIELDS);

  const {
    selectedIds, selectedItems, toggleOne, toggleAll, clearSelection,
    isAllSelected, isSomeSelected, selectedCount,
  } = useGridSelection(filteredData);

  const totalOwnership = fundingRecords.reduce((sum, r) => sum + r.pctOwned, 0);
  const totalPrincipalBalance = fundingRecords.reduce((sum, r) => sum + r.principalBalance, 0);
  const totalPaymentSum = fundingRecords.reduce((sum, r) => sum + r.regularPayment, 0);
  
  const totalFundingAmount = fundingRecords.reduce((sum, r) => sum + r.originalAmount, 0);

  const formatCurrency = (value: number) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(value);
  const formatPercentage = (value: number) => `${value.toFixed(3)}%`;

  // Find which record has roundingError set
  const roundingErrorId = fundingRecords.find(r => r.roundingError)?.id || '';

  const handleRoundingErrorChange = (selectedId: string) => {
    // Clear all, then set the selected one
    fundingRecords.forEach((record) => {
      if (record.roundingError && record.id !== selectedId) {
        onUpdateRecord(record.id, { roundingError: false });
      }
    });
    onUpdateRecord(selectedId, { roundingError: true });
  };

  const handleRowClick = (record: FundingRecord) => {
    setEditFundingData({
      loan: loanNumber || '',
      borrower: borrowerName || '',
      lenderId: record.lenderAccount,
      lenderFullName: record.lenderName,
      lenderRate: String(record.lenderRate),
      fundingAmount: String(record.originalAmount),
      fundingDate: record.fundingDate || '',
      interestFrom: record.interestFrom || '',
      notes: '',
      brokerParticipates: record.brokerParticipates || false,
      percentOwned: String(record.pctOwned),
      regularPayment: String(record.regularPayment),
      lenderShare: String(record.lenderShare || ''),
      rateSelection: record.rateSelection || 'note_rate',
      rateNoteValue: record.rateNoteValue || noteRate,
      rateSoldValue: record.rateSoldValue || soldRate,
      rateLenderValue: record.rateLenderValue || '',
      overrideServicingFees: record.overrideServicingFees || false,
      companyServicingFee: record.companyServicingFee || '', companyServicingFeePct: record.companyServicingFeePct || '',
      companyMaxFee: record.companyMaxFee || '', companyMaxFeePct: record.companyMaxFeePct || '',
      companyMinFee: record.companyMinFee || '', companyMinFeePct: record.companyMinFeePct || '',
      brokerServicingFee: record.brokerServicingFee || '', brokerServicingFeePct: record.brokerServicingFeePct || '',
      brokerMaxFee: record.brokerMaxFee || '', brokerMaxFeePct: record.brokerMaxFeePct || '',
      brokerMinFee: record.brokerMinFee || '', brokerMinFeePct: record.brokerMinFeePct || '',
      overrideDefaultFees: record.overrideDefaultFees || false,
      lateFee1Lender: record.lateFee1Lender || '', lateFee1Company: record.lateFee1Company || '', lateFee1Broker: record.lateFee1Broker || '', lateFee1Total: record.lateFee1Total || '',
      lateFee2Lender: record.lateFee2Lender || '', lateFee2Company: record.lateFee2Company || '', lateFee2Broker: record.lateFee2Broker || '', lateFee2Total: record.lateFee2Total || '',
      defaultInterestLender: record.defaultInterestLender || '', defaultInterestCompany: record.defaultInterestCompany || '', defaultInterestBroker: record.defaultInterestBroker || '', defaultInterestTotal: record.defaultInterestTotal || '',
      interestGuaranteeLender: record.interestGuaranteeLender || '', interestGuaranteeCompany: record.interestGuaranteeCompany || '', interestGuaranteeBroker: record.interestGuaranteeBroker || '', interestGuaranteeTotal: record.interestGuaranteeTotal || '',
      prepaymentLender: record.prepaymentLender || '', prepaymentCompany: record.prepaymentCompany || '', prepaymentBroker: record.prepaymentBroker || '', prepaymentTotal: record.prepaymentTotal || '',
      maturityLender: record.maturityLender || '', maturityCompany: record.maturityCompany || '', maturityBroker: record.maturityBroker || '', maturityTotal: record.maturityTotal || '',
    });
    setSelectedRecord(record);
    setIsAddModalOpen(true);
  };

  const handleAddFundingClick = () => {
    // Explicitly clear edit state when adding new
    setSelectedRecord(null);
    setEditFundingData(null);
    setIsAddModalOpen(true);
  };

  const renderCellValue = (record: FundingRecord, columnId: string) => {
    switch (columnId) {
      case 'fundingDate':
        return record.fundingDate || '-';
      case 'lenderAccount':
        return <span className="font-medium">{record.lenderAccount || '-'}</span>;
      case 'lenderName':
        return record.lenderName || '-';
      case 'pctOwned':
        return <span>{formatPercentage(record.pctOwned)}</span>;
      case 'lenderRate':
        return <span>{formatPercentage(record.lenderRate)}</span>;
      case 'principalBalance':
        return <span>{formatCurrency(record.principalBalance)}</span>;
      case 'originalAmount':
        return <span>{formatCurrency(record.originalAmount)}</span>;
      case 'regularPayment':
        return <span>{formatCurrency(record.regularPayment)}</span>;
      case 'roundingError':
        return (
          <div className="text-center" onClick={(e) => e.stopPropagation()}>
            <RadioGroup value={roundingErrorId} onValueChange={handleRoundingErrorChange} className="inline-flex">
              <RadioGroupItem value={record.id} className="h-3.5 w-3.5" />
            </RadioGroup>
          </div>
        );
      default:
        return '-';
    }
  };

  const handleBulkDelete = () => {
    if (onBulkDelete) {
      onBulkDelete(selectedItems);
    } else if (onDeleteRecord) {
      selectedItems.forEach((item) => onDeleteRecord(item));
    }
    clearSelection();
    setBulkDeleteOpen(false);
  };

  const exportColumns: ExportColumn[] = DEFAULT_COLUMNS.map(c => ({ id: c.id, label: c.label }));

  return (
    <div className="p-6 space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h3 className="font-semibold text-lg text-foreground">Loan Funding</h3>
        <div className="flex items-center gap-2">
          <ColumnConfigPopover columns={columns} onColumnsChange={setColumns} onResetColumns={resetColumns} />
          <Button variant="outline" size="sm" onClick={handleAddFundingClick} className="gap-1" disabled={disabled}>
            <Plus className="h-4 w-4" />
            Add Funding
          </Button>
          <Button variant="outline" size="sm" onClick={() => setIsHistoryOpen(true)} className="gap-1" disabled={disabled}>
            <History className="h-4 w-4" />
            History
          </Button>
        </div>
      </div>

      {/* Grid Toolbar */}
      <GridToolbar
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        onRefresh={onRefresh}
        filterOptions={buildFundingFilterOptions(fundingRecords)}
        activeFilters={activeFilters}
        onFilterChange={setFilter}
        onClearFilters={clearFilters}
        activeFilterCount={activeFilterCount}
        disabled={disabled}
        selectedCount={selectedCount}
        onBulkDelete={() => setBulkDeleteOpen(true)}
        onExport={() => setExportOpen(true)}
      />

      {/* Grid */}
      <div className="border border-border rounded-lg overflow-x-auto">
        {isLoading ? (
          <div className="flex items-center justify-center min-h-[200px]">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : (
          <Table className="min-w-[900px]">
            <TableHeader>
              <TableRow className="bg-muted/50">
                <TableHead className="w-[40px]">
                  <input
                    type="checkbox"
                    checked={isAllSelected}
                    ref={(el) => { if (el) el.indeterminate = isSomeSelected; }}
                    onChange={() => toggleAll()}
                    disabled={filteredData.length === 0}
                    className="h-4 w-4"
                  />
                </TableHead>
                {visibleColumns.map((col) => (
                  col.id === 'roundingError' ? (
                    <TableHead key={col.id} className="text-center">{col.label.toUpperCase()}</TableHead>
                  ) : (
                    <SortableTableHead
                      key={col.id}
                      columnId={col.id}
                      label={col.label.toUpperCase()}
                      sortColumnId={sortState.columnId}
                      sortDirection={sortState.direction}
                      onSort={toggleSort}
                    />
                  )
                ))}
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredData.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={visibleColumns.length + 1} className="text-center text-muted-foreground py-8">
                    {fundingRecords.length === 0 ? 'No funding records found. Click "Add Funding" to add a new funding record.' : 'No funding records match your search.'}
                  </TableCell>
                </TableRow>
              ) : (
                filteredData.map((record) => (
                  <TableRow
                    key={record.id}
                    className={cn(!disabled && 'cursor-pointer hover:bg-muted/30', selectedRecord?.id === record.id && 'bg-primary/10')}
                    onClick={() => !disabled && handleRowClick(record)}
                  >
                    <TableCell onClick={(e) => e.stopPropagation()}>
                      <input
                        type="checkbox"
                        checked={selectedIds.has(record.id)}
                        onChange={() => toggleOne(record.id)}
                        disabled={disabled}
                        className="h-4 w-4"
                      />
                    </TableCell>
                     {visibleColumns.map((col) => (
                      <TableCell key={col.id} className="text-left">{renderCellValue(record, col.id)}</TableCell>
                    ))}
                  </TableRow>
                ))
              )}
              {fundingRecords.length > 0 && (
                <TableRow className="bg-muted/30 font-semibold border-t-2">
                  <TableCell />
                  {visibleColumns.map((col, idx) => {
                    if (col.id === 'pctOwned') return <TableCell key={col.id} className="text-left"><span className="text-foreground">{formatPercentage(totalOwnership)}</span></TableCell>;
                    if (col.id === 'principalBalance') return <TableCell key={col.id} className="text-left">{formatCurrency(totalPrincipalBalance)}</TableCell>;
                    if (col.id === 'regularPayment') return <TableCell key={col.id} className="text-left">{formatCurrency(totalPaymentSum)}</TableCell>;
                    
                    if (col.id === 'originalAmount') return <TableCell key={col.id} className="text-left">{formatCurrency(totalFundingAmount)}</TableCell>;
                    if (idx === 0) return <TableCell key={col.id} className="font-semibold">Totals:</TableCell>;
                    return <TableCell key={col.id}></TableCell>;
                  })}
                </TableRow>
              )}
            </TableBody>
          </Table>
        )}
      </div>

      {/* Pagination */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <span>Show</span>
          <Select value={pageSize.toString()} onValueChange={(value) => onPageSizeChange(Number(value))}>
            <SelectTrigger className="w-[70px] h-8"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="10">10</SelectItem>
              <SelectItem value="25">25</SelectItem>
              <SelectItem value="50">50</SelectItem>
              <SelectItem value="100">100</SelectItem>
            </SelectContent>
          </Select>
          <span>entries</span>
        </div>
        <div className="flex items-center gap-1">
          <Button variant="outline" size="sm" onClick={() => onPageChange(1)} disabled={currentPage === 1}>First</Button>
          <Button variant="outline" size="sm" onClick={() => onPageChange(currentPage - 1)} disabled={currentPage === 1}>Previous</Button>
          <span className="px-3 py-1 bg-primary text-primary-foreground rounded text-sm">{currentPage}</span>
          <Button variant="outline" size="sm" onClick={() => onPageChange(currentPage + 1)} disabled={currentPage >= totalPages}>Next</Button>
          <Button variant="outline" size="sm" onClick={() => onPageChange(totalPages)} disabled={currentPage >= totalPages}>Last</Button>
        </div>
      </div>

      {totalOwnership > 100 && fundingRecords.length > 0 && (
        <p className="text-sm text-destructive font-medium">⚠ Total ownership exceeds 100% ({formatPercentage(totalOwnership)}). Cannot save new funding until resolved.</p>
      )}
      {totalOwnership !== 100 && totalOwnership <= 100 && fundingRecords.length > 0 && (
        <p className="text-sm text-foreground">Total ownership must equal 100% (currently {formatPercentage(totalOwnership)})</p>
      )}

      {fundingRecords.length > 0 && (
        <div className="flex justify-end">
          <div className="text-sm text-muted-foreground">
            {filteredData.length !== fundingRecords.length && `Showing ${filteredData.length} of `}
            Total Funding Records: {fundingRecords.length} | Total Funding Amount: {formatCurrency(totalFundingAmount)}
          </div>
        </div>
      )}

      <AddFundingModal
        open={isAddModalOpen}
        onOpenChange={(open) => { setIsAddModalOpen(open); if (!open) { setEditFundingData(null); setSelectedRecord(null); } }}
        loanNumber={loanNumber}
        borrowerName={borrowerName}
        onSubmit={(data) => {
          if (selectedRecord) {
            // Determine lender rate from rate selection
            let lenderRate = 0;
            if (data.rateSelection === 'note_rate') lenderRate = parseFloat(data.rateNoteValue) || 0;
            else if (data.rateSelection === 'sold_rate') lenderRate = parseFloat(data.rateSoldValue) || 0;
            else if (data.rateSelection === 'lender_rate') lenderRate = parseFloat(data.rateLenderValue) || 0;

            onUpdateRecord(selectedRecord.id, {
              fundingDate: data.fundingDate || '',
              lenderAccount: data.lenderId,
              lenderName: data.lenderFullName,
              lenderRate,
              originalAmount: parseFloat(data.fundingAmount) || 0,
              principalBalance: parseFloat(data.fundingAmount) || 0,
              pctOwned: parseFloat(data.percentOwned) || 0,
              regularPayment: parseFloat(data.regularPayment) || 0,
              lenderShare: parseFloat(data.lenderShare) || 0,
              rateSelection: data.rateSelection,
              rateNoteValue: data.rateNoteValue,
              rateSoldValue: data.rateSoldValue,
              rateLenderValue: data.rateLenderValue,
              brokerParticipates: data.brokerParticipates,
              interestFrom: data.interestFrom,
              overrideServicingFees: data.overrideServicingFees,
              companyServicingFee: data.companyServicingFee, companyServicingFeePct: data.companyServicingFeePct,
              companyMaxFee: data.companyMaxFee, companyMaxFeePct: data.companyMaxFeePct,
              companyMinFee: data.companyMinFee, companyMinFeePct: data.companyMinFeePct,
              brokerServicingFee: data.brokerServicingFee, brokerServicingFeePct: data.brokerServicingFeePct,
              brokerMaxFee: data.brokerMaxFee, brokerMaxFeePct: data.brokerMaxFeePct,
              brokerMinFee: data.brokerMinFee, brokerMinFeePct: data.brokerMinFeePct,
              overrideDefaultFees: data.overrideDefaultFees,
              lateFee1Lender: data.lateFee1Lender, lateFee1Company: data.lateFee1Company, lateFee1Broker: data.lateFee1Broker, lateFee1Total: data.lateFee1Total,
              lateFee2Lender: data.lateFee2Lender, lateFee2Company: data.lateFee2Company, lateFee2Broker: data.lateFee2Broker, lateFee2Total: data.lateFee2Total,
              defaultInterestLender: data.defaultInterestLender, defaultInterestCompany: data.defaultInterestCompany, defaultInterestBroker: data.defaultInterestBroker, defaultInterestTotal: data.defaultInterestTotal,
              interestGuaranteeLender: data.interestGuaranteeLender, interestGuaranteeCompany: data.interestGuaranteeCompany, interestGuaranteeBroker: data.interestGuaranteeBroker, interestGuaranteeTotal: data.interestGuaranteeTotal,
              prepaymentLender: data.prepaymentLender, prepaymentCompany: data.prepaymentCompany, prepaymentBroker: data.prepaymentBroker, prepaymentTotal: data.prepaymentTotal,
              maturityLender: data.maturityLender, maturityCompany: data.maturityCompany, maturityBroker: data.maturityBroker, maturityTotal: data.maturityTotal,
            });
          } else {
            onAddFunding(data);
          }
        }}
        editData={editFundingData}
        isEditing={!!selectedRecord}
        noteRate={noteRate}
        soldRate={soldRate}
        totalPayment={totalPayment}
        loanAmount={loanAmount}
        existingRecords={fundingRecords.map(r => ({ id: r.id, roundingError: r.roundingError, pctOwned: r.pctOwned }))}
        editingRecordId={selectedRecord?.id}
      />

      <FundingHistoryDialog open={isHistoryOpen} onOpenChange={setIsHistoryOpen} dealId={dealId} historyRecords={historyRecords} />

      <DeleteConfirmationDialog
        open={bulkDeleteOpen}
        onOpenChange={setBulkDeleteOpen}
        onConfirm={handleBulkDelete}
        title="Delete Selected Funding Records"
        description={`Are you sure you want to delete ${selectedCount} selected funding record(s)? This action cannot be undone.`}
      />
      <GridExportDialog
        open={exportOpen}
        onOpenChange={setExportOpen}
        columns={exportColumns}
        data={fundingRecords}
        fileName="funding_records"
      />
    </div>
  );
};

export default LoanFundingGrid;
