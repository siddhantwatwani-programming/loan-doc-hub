import React, { useState } from 'react';
import { Plus, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import { ColumnConfigPopover, ColumnConfig } from './ColumnConfigPopover';
import { useTableColumnConfig } from '@/hooks/useTableColumnConfig';
import { DeleteConfirmationDialog } from './DeleteConfirmationDialog';
import { GridToolbar, FilterOption } from './GridToolbar';
import { GridExportDialog, ExportColumn } from './GridExportDialog';
import { SortableTableHead } from './SortableTableHead';
import { useGridSortFilter } from '@/hooks/useGridSortFilter';
import { useGridSelection } from '@/hooks/useGridSelection';

export interface PropertyData {
  id: string;
  isPrimary: boolean;
  description: string;
  street: string;
  city: string;
  state: string;
  zipCode: string;
  county: string;
  propertyType: string;
  occupancy: string;
  appraisedValue: string;
  appraisedDate: string;
  ltv: string;
  apn: string;
  loanPriority: string;
  floodZone?: string;
  pledgedEquity?: string;
  zoning?: string;
  performedBy?: string;
  copyBorrowerAddress?: boolean;
  purchasePrice?: string;
  downPayment?: string;
  delinquentTaxes?: string;
  appraiserStreet?: string;
  appraiserCity?: string;
  appraiserState?: string;
  appraiserZip?: string;
  appraiserPhone?: string;
  appraiserEmail?: string;
  yearBuilt?: string;
  squareFeet?: string;
  constructionType?: string;
  monthlyIncome?: string;
  lienProtectiveEquity?: string;
  sourceLienInfo?: string;
  delinquencies60day?: boolean;
  delinquenciesHowMany?: string;
  currentlyDelinquent?: boolean;
  paidByLoan?: boolean;
  sourceOfPayment?: string;
  recordingNumber?: string;
  primaryCollateral?: boolean;
  purchaseDate?: string;
  propertyGeneratesIncome?: boolean;
  netMonthlyIncome?: string;
  fromRent?: string;
  fromOtherDescribe?: string;
  valuationDate?: string;
  valuationType?: string;
  thirdPartyFullName?: string;
  thirdPartyStreet?: string;
  thirdPartyCity?: string;
  thirdPartyState?: string;
  thirdPartyZip?: string;
  protectiveEquity?: string;
  cltv?: string;
}

interface PropertiesTableViewProps {
  properties: PropertyData[];
  onAddProperty: () => void;
  onEditProperty: (property: PropertyData) => void;
  onRowClick: (property: PropertyData) => void;
  onPrimaryChange: (propertyId: string, isPrimary: boolean) => void;
  onDeleteProperty?: (property: PropertyData) => void;
  onBulkDelete?: (properties: PropertyData[]) => void;
  onRefresh?: () => void;
  disabled?: boolean;
  currentPage?: number;
  totalPages?: number;
  totalCount?: number;
  onPageChange?: (page: number) => void;
}

const DEFAULT_COLUMNS: ColumnConfig[] = [
  { id: 'isPrimary', label: 'Primary', visible: true },
  { id: 'description', label: 'Description', visible: true },
  { id: 'street', label: 'Street', visible: true },
  { id: 'city', label: 'City', visible: true },
  { id: 'state', label: 'State', visible: true },
  { id: 'zipCode', label: 'Zip Code', visible: true },
  { id: 'county', label: 'County', visible: true },
  { id: 'propertyType', label: 'Property Type', visible: true },
  { id: 'occupancy', label: 'Occupancy', visible: true },
  { id: 'appraisedValue', label: 'Estimate of Value', visible: true },
  { id: 'appraisedDate', label: 'Valuation Date', visible: true },
  { id: 'purchasePrice', label: 'Purchase Price', visible: true },
  { id: 'ltv', label: 'Loan To Value', visible: true },
  { id: 'floodZone', label: 'Flood Zone', visible: true },
];

const SEARCH_FIELDS = ['description', 'street', 'city', 'state', 'zipCode', 'county', 'propertyType', 'apn'];

const FILTER_OPTIONS: FilterOption[] = [
  {
    id: 'propertyType',
    label: 'Property Type',
    options: [
      { value: 'single_family', label: 'Single Family' },
      { value: 'multi_family', label: 'Multi Family' },
      { value: 'commercial', label: 'Commercial' },
      { value: 'land', label: 'Land' },
      { value: 'condo', label: 'Condo' },
      { value: 'townhouse', label: 'Townhouse' },
    ],
  },
  {
    id: 'occupancy',
    label: 'Occupancy',
    options: [
      { value: 'owner_occupied', label: 'Owner Occupied' },
      { value: 'investment', label: 'Investment' },
      { value: 'second_home', label: 'Second Home' },
      { value: 'vacant', label: 'Vacant' },
    ],
  },
  {
    id: 'state',
    label: 'State',
    options: [
      { value: 'CA', label: 'CA' },
      { value: 'TX', label: 'TX' },
      { value: 'FL', label: 'FL' },
      { value: 'NY', label: 'NY' },
      { value: 'WA', label: 'WA' },
    ],
  },
];

export const PropertiesTableView: React.FC<PropertiesTableViewProps> = ({
  properties,
  onAddProperty,
  onEditProperty,
  onRowClick,
  onPrimaryChange,
  onDeleteProperty,
  onBulkDelete,
  onRefresh,
  disabled = false,
  currentPage = 1,
  totalPages = 1,
  totalCount,
  onPageChange,
}) => {
  const [columns, setColumns, resetColumns] = useTableColumnConfig('properties', DEFAULT_COLUMNS);
  const [bulkDeleteOpen, setBulkDeleteOpen] = useState(false);
  const [exportOpen, setExportOpen] = useState(false);
  const visibleColumns = columns.filter((col) => col.visible);

  const {
    searchQuery, setSearchQuery, sortState, toggleSort,
    activeFilters, setFilter, clearFilters, activeFilterCount, filteredData,
  } = useGridSortFilter(properties, SEARCH_FIELDS);

  const {
    selectedIds, selectedItems, toggleOne, toggleAll, clearSelection,
    isAllSelected, isSomeSelected, selectedCount,
  } = useGridSelection(filteredData);

  const formatCurrency = (value: string) => {
    if (!value) return '$0.00';
    const num = parseFloat(value);
    if (isNaN(num)) return '$0.00';
    return `$${num.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };

  const formatPercentage = (value: string) => {
    if (!value) return '0.000%';
    const num = parseFloat(value);
    if (isNaN(num)) return '0.000%';
    return `${num.toFixed(3)}%`;
  };

  const renderCellValue = (property: PropertyData, columnId: string) => {
    switch (columnId) {
      case 'isPrimary':
        return property.isPrimary ? (
          <Check className="h-4 w-4 text-primary" />
        ) : null;
      case 'appraisedValue':
        return formatCurrency(property.appraisedValue);
      case 'purchasePrice':
        return formatCurrency(property.purchasePrice || '');
      case 'ltv':
        return formatPercentage(property.ltv);
      case 'floodZone':
        return property.floodZone ? 'Yes' : 'No';
      case 'appraisedDate': {
        const val = property.appraisedDate;
        if (!val) return '-';
        try {
          const d = new Date(val);
          if (isNaN(d.getTime())) return val;
          return `${String(d.getMonth() + 1).padStart(2, '0')}/${String(d.getDate()).padStart(2, '0')}/${d.getFullYear()}`;
        } catch { return val; }
      }
      default:
        return property[columnId as keyof PropertyData] || '-';
    }
  };

  const handleBulkDelete = () => {
    if (onBulkDelete) {
      onBulkDelete(selectedItems);
    } else if (onDeleteProperty) {
      selectedItems.forEach((item) => onDeleteProperty(item));
    }
    clearSelection();
    setBulkDeleteOpen(false);
  };

  const exportColumns: ExportColumn[] = DEFAULT_COLUMNS.filter(c => c.id !== 'isPrimary').map(c => ({ id: c.id, label: c.label }));

  return (
    <div className="p-6 space-y-4">
      {/* Header with title and actions */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="font-semibold text-lg text-foreground">Properties</h3>
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
            onClick={onAddProperty}
            disabled={disabled}
            className="gap-1"
          >
            <Plus className="h-4 w-4" />
            Add Property
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
      />

      {/* Properties Table */}
      <div className="border border-border rounded-lg overflow-x-auto">
        <Table className="min-w-[1400px]">
          <TableHeader>
            <TableRow className="bg-muted/50">
              <TableHead className="w-[40px]">
                <Checkbox
                  checked={isAllSelected}
                  ref={(el) => {
                    if (el) (el as any).indeterminate = isSomeSelected;
                  }}
                  onCheckedChange={toggleAll}
                  disabled={disabled || filteredData.length === 0}
                />
              </TableHead>
              {visibleColumns.map((col) => (
                col.id === 'isPrimary' ? (
                  <TableHead key={col.id} className="w-[80px]">{col.label.toUpperCase()}</TableHead>
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
                <TableCell colSpan={visibleColumns.length + 1} className="text-center py-8 text-muted-foreground">
                  {properties.length === 0
                    ? 'No properties added. Click "Add Property" to add one.'
                    : 'No properties match your search or filters.'}
                </TableCell>
              </TableRow>
            ) : (
              filteredData.map((property) => (
                <TableRow
                  key={property.id}
                  className="cursor-pointer hover:bg-muted/30"
                  onClick={() => onRowClick(property)}
                >
                  <TableCell onClick={(e) => e.stopPropagation()}>
                    <Checkbox
                      checked={selectedIds.has(property.id)}
                      onCheckedChange={() => toggleOne(property.id)}
                      disabled={disabled}
                    />
                  </TableCell>
                  {visibleColumns.map((col) => (
                    <TableCell
                      key={col.id}
                      onClick={col.id === 'isPrimary' ? (e) => e.stopPropagation() : undefined}
                    >
                      {renderCellValue(property, col.id)}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <div className="text-sm text-muted-foreground">
            Showing {(currentPage - 1) * 10 + 1}–{Math.min(currentPage * 10, totalCount ?? properties.length)} of {totalCount ?? properties.length} properties
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

      {/* Footer with totals */}
      {properties.length > 0 && (
        <div className="flex justify-end">
          <div className="text-sm text-muted-foreground">
            Total Properties: {totalCount ?? properties.length} | 
            Total Estimate of Value: {formatCurrency(
              properties.reduce((sum, p) => sum + (parseFloat(p.appraisedValue) || 0), 0).toString()
            )}
          </div>
        </div>
      )}

      {/* Bulk Delete Confirmation */}
      <DeleteConfirmationDialog
        open={bulkDeleteOpen}
        onOpenChange={setBulkDeleteOpen}
        onConfirm={handleBulkDelete}
        title={`Delete ${selectedCount} Properties`}
        description={`Are you sure you want to delete ${selectedCount} selected properties? This action cannot be undone.`}
      />

      {/* Export Dialog */}
      <GridExportDialog
        open={exportOpen}
        onOpenChange={setExportOpen}
        columns={exportColumns}
        data={properties}
        fileName="properties"
      />
    </div>
  );
};

export default PropertiesTableView;
