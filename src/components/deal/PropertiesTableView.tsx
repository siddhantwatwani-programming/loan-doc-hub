import React, { useState } from 'react';
import { Plus, Pencil, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { ColumnConfigPopover, ColumnConfig } from './ColumnConfigPopover';
import { useTableColumnConfig } from '@/hooks/useTableColumnConfig';
import { DeleteConfirmationDialog } from './DeleteConfirmationDialog';

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
}

interface PropertiesTableViewProps {
  properties: PropertyData[];
  onAddProperty: () => void;
  onEditProperty: (property: PropertyData) => void;
  onRowClick: (property: PropertyData) => void;
  onPrimaryChange: (propertyId: string, isPrimary: boolean) => void;
  onDeleteProperty?: (property: PropertyData) => void;
  disabled?: boolean;
}

const DEFAULT_COLUMNS: ColumnConfig[] = [
  { id: 'isPrimary', label: 'Primary', visible: true },
  { id: 'street', label: 'Street', visible: true },
  { id: 'city', label: 'City', visible: true },
  { id: 'state', label: 'State', visible: true },
  { id: 'zipCode', label: 'Zip Code', visible: true },
  { id: 'county', label: 'County', visible: true },
  { id: 'propertyType', label: 'Property Type', visible: true },
  { id: 'occupancy', label: 'Occupancy', visible: true },
  { id: 'appraisedValue', label: 'Appraised Value', visible: true },
  { id: 'appraisedDate', label: 'Appraisal Date', visible: true },
  { id: 'ltv', label: 'Loan To Value', visible: true },
  { id: 'loanPriority', label: 'Priority', visible: true },
];

export const PropertiesTableView: React.FC<PropertiesTableViewProps> = ({
  properties,
  onAddProperty,
  onEditProperty,
  onRowClick,
  onPrimaryChange,
  onDeleteProperty,
  disabled = false,
}) => {
  const [columns, setColumns] = useTableColumnConfig('properties', DEFAULT_COLUMNS);
  const [deleteTarget, setDeleteTarget] = useState<PropertyData | null>(null);
  const visibleColumns = columns.filter((col) => col.visible);

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
        return (
          <Checkbox
            checked={property.isPrimary}
            onCheckedChange={(checked) => onPrimaryChange(property.id, !!checked)}
            disabled={disabled}
          />
        );
      case 'appraisedValue':
        return formatCurrency(property.appraisedValue);
      case 'ltv':
        return formatPercentage(property.ltv);
      default:
        return property[columnId as keyof PropertyData] || '-';
    }
  };

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

      {/* Properties Table */}
      <div className="border border-border rounded-lg overflow-x-auto">
        <Table className="min-w-[1400px]">
          <TableHeader>
            <TableRow className="bg-muted/50">
              {visibleColumns.map((col) => (
                <TableHead key={col.id} className={col.id === 'isPrimary' ? 'w-[80px]' : undefined}>
                  {col.label.toUpperCase()}
                </TableHead>
              ))}
              <TableHead className="w-[80px]">ACTIONS</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {properties.length === 0 ? (
              <TableRow>
                <TableCell colSpan={visibleColumns.length + 1} className="text-center py-8 text-muted-foreground">
                  No properties added. Click "Add Property" to add one.
                </TableCell>
              </TableRow>
            ) : (
              properties.map((property) => (
                <TableRow
                  key={property.id}
                  className="cursor-pointer hover:bg-muted/30"
                  onClick={() => onRowClick(property)}
                >
                  {visibleColumns.map((col) => (
                    <TableCell
                      key={col.id}
                      onClick={col.id === 'isPrimary' ? (e) => e.stopPropagation() : undefined}
                    >
                      {renderCellValue(property, col.id)}
                    </TableCell>
                  ))}
                  <TableCell onClick={(e) => e.stopPropagation()}>
                    <div className="flex items-center gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => onEditProperty(property)}
                        disabled={disabled}
                        className="h-8 w-8"
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      {onDeleteProperty && (
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => setDeleteTarget(property)}
                          disabled={disabled}
                          className="h-8 w-8 text-destructive hover:text-destructive"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Footer with totals */}
      {properties.length > 0 && (
        <div className="flex justify-end">
          <div className="text-sm text-muted-foreground">
            Total Properties: {properties.length} | 
            Total Appraised Value: {formatCurrency(
              properties.reduce((sum, p) => sum + (parseFloat(p.appraisedValue) || 0), 0).toString()
            )}
          </div>
        </div>
      )}
      {/* Delete Confirmation Dialog */}
      <DeleteConfirmationDialog
        open={!!deleteTarget}
        onOpenChange={(open) => { if (!open) setDeleteTarget(null); }}
        onConfirm={() => {
          if (deleteTarget && onDeleteProperty) {
            onDeleteProperty(deleteTarget);
          }
          setDeleteTarget(null);
        }}
        title="Delete Property"
        description="Are you sure you want to delete this property? This action cannot be undone."
      />
    </div>
  );
};

export default PropertiesTableView;
