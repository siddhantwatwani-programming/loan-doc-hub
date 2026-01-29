import React, { useState, useMemo } from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Plus, Settings, X, Pencil } from 'lucide-react';
import { cn } from '@/lib/utils';

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
  appraisalDate: string;
  ltv: string;
  apn: string;
  loanPriority: string;
}

// PropertyGridColumn interface moved below PropertyColumnKey type

type PropertyColumnKey = keyof PropertyData | 'actions';

interface PropertyGridColumn {
  key: PropertyColumnKey;
  label: string;
  visible: boolean;
}

const DEFAULT_COLUMNS: PropertyGridColumn[] = [
  { key: 'isPrimary', label: 'Primary', visible: true },
  { key: 'description', label: 'Description', visible: true },
  { key: 'street', label: 'Street', visible: true },
  { key: 'city', label: 'City', visible: true },
  { key: 'state', label: 'State', visible: true },
  { key: 'zipCode', label: 'Zip Code', visible: true },
  { key: 'county', label: 'County', visible: true },
  { key: 'propertyType', label: 'Property Type', visible: true },
  { key: 'occupancy', label: 'Occupancy', visible: true },
  { key: 'appraisedValue', label: 'Appraised Value', visible: true },
  { key: 'appraisalDate', label: 'Appraisal Date', visible: true },
  { key: 'ltv', label: 'LTV', visible: true },
  { key: 'apn', label: 'APN', visible: true },
  { key: 'loanPriority', label: 'Loan Priority', visible: true },
  { key: 'actions', label: 'Actions', visible: true },
];

interface PropertyGridProps {
  properties: PropertyData[];
  onPropertySelect: (property: PropertyData) => void;
  onEditProperty: (property: PropertyData) => void;
  onAddProperty: () => void;
  onPrimaryChange: (propertyId: string, isPrimary: boolean) => void;
  disabled?: boolean;
}

export const PropertyGrid: React.FC<PropertyGridProps> = ({
  properties,
  onPropertySelect,
  onEditProperty,
  onAddProperty,
  onPrimaryChange,
  disabled = false,
}) => {
  const [columns, setColumns] = useState<PropertyGridColumn[]>(DEFAULT_COLUMNS);
  const [customizeOpen, setCustomizeOpen] = useState(false);

  const visibleColumns = useMemo(
    () => columns.filter((col) => col.visible),
    [columns]
  );

  const toggleColumn = (key: PropertyColumnKey) => {
    setColumns((prev) =>
      prev.map((col) =>
        col.key === key ? { ...col, visible: !col.visible } : col
      )
    );
  };

  const handlePrimaryChange = (propertyId: string, checked: boolean) => {
    if (checked) {
      onPrimaryChange(propertyId, true);
    }
  };

  const formatCellValue = (
    property: PropertyData,
    column: PropertyGridColumn
  ): React.ReactNode => {
    if (column.key === 'actions') {
      return (
        <Button
          variant="ghost"
          size="sm"
          onClick={(e) => {
            e.stopPropagation();
            onEditProperty(property);
          }}
          disabled={disabled}
          className="gap-1"
        >
          <Pencil className="h-4 w-4" />
          Edit
        </Button>
      );
    }

    const value = property[column.key as keyof PropertyData];

    if (column.key === 'isPrimary') {
      return (
        <Checkbox
          checked={property.isPrimary}
          onCheckedChange={(checked) =>
            handlePrimaryChange(property.id, !!checked)
          }
          disabled={disabled}
          onClick={(e) => e.stopPropagation()}
        />
      );
    }

    if (column.key === 'appraisedValue' && value) {
      const numValue = parseFloat(value.toString().replace(/[^0-9.-]/g, ''));
      return isNaN(numValue)
        ? value
        : `$${numValue.toLocaleString('en-US', { minimumFractionDigits: 2 })}`;
    }

    if (column.key === 'ltv' && value) {
      return `${value}%`;
    }

    return value || '';
  };

  return (
    <div className="space-y-4">
      {/* Header with actions */}
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-muted-foreground">
            Can have multiple properties on an acct, one is marked primary
          </p>
        </div>
        <div className="flex items-center gap-2">
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
          <Popover open={customizeOpen} onOpenChange={setCustomizeOpen}>
            <PopoverTrigger asChild>
              <Button variant="outline" size="sm" className="gap-1">
                <Settings className="h-4 w-4" />
                Customize Grid
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-64" align="end">
              <div className="space-y-2">
                <div className="flex items-center justify-between pb-2 border-b border-border">
                  <span className="text-sm font-medium">
                    Items that can be shown on the main grid
                  </span>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-6 w-6 p-0"
                    onClick={() => setCustomizeOpen(false)}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
                <div className="space-y-1 max-h-[300px] overflow-y-auto">
                  {columns.map((col) => (
                    <div
                      key={col.key}
                      className="flex items-center gap-2 py-1"
                    >
                      <Checkbox
                        id={`col-${col.key}`}
                        checked={col.visible}
                        onCheckedChange={() => toggleColumn(col.key)}
                      />
                      <label
                        htmlFor={`col-${col.key}`}
                        className="text-sm cursor-pointer"
                      >
                        {col.label}
                      </label>
                    </div>
                  ))}
                </div>
                <div className="flex gap-2 pt-2 border-t border-border">
                  <Button
                    size="sm"
                    onClick={() => setCustomizeOpen(false)}
                    className="flex-1"
                  >
                    OK
                  </Button>
                  <Button
                    size="sm"
                    variant="secondary"
                    onClick={() => setColumns(DEFAULT_COLUMNS)}
                    className="flex-1"
                  >
                    Reset
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => setCustomizeOpen(false)}
                    className="flex-1"
                  >
                    Cancel
                  </Button>
                </div>
              </div>
            </PopoverContent>
          </Popover>
        </div>
      </div>

      {/* Grid Table */}
      <div className="border border-border rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/50">
                {visibleColumns.map((col) => (
                  <TableHead
                    key={col.key}
                    className="text-xs font-semibold uppercase tracking-wider whitespace-nowrap"
                  >
                    {col.label}
                  </TableHead>
                ))}
              </TableRow>
            </TableHeader>
            <TableBody>
              {properties.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={visibleColumns.length}
                    className="text-center py-8 text-muted-foreground"
                  >
                    No properties added yet. Click "Add Property" to add one.
                  </TableCell>
                </TableRow>
              ) : (
                properties.map((property) => (
                  <TableRow
                    key={property.id}
                    className={cn(
                      'cursor-pointer hover:bg-muted/30 transition-colors',
                      property.isPrimary && 'bg-primary/5'
                    )}
                    onClick={() => onPropertySelect(property)}
                  >
                    {visibleColumns.map((col) => (
                      <TableCell key={col.key} className="text-sm whitespace-nowrap">
                        {formatCellValue(property, col)}
                      </TableCell>
                    ))}
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </div>

      {/* Pagination placeholder */}
      {properties.length > 0 && (
        <div className="flex items-center justify-end gap-2 text-sm text-muted-foreground">
          <Button variant="ghost" size="sm" disabled>
            First
          </Button>
          <Button variant="ghost" size="sm" disabled>
            Previous
          </Button>
          <span className="px-2 py-1 bg-primary text-primary-foreground rounded">
            1
          </span>
          <Button variant="ghost" size="sm" disabled>
            Next
          </Button>
          <Button variant="ghost" size="sm" disabled>
            Last
          </Button>
        </div>
      )}
    </div>
  );
};

export default PropertyGrid;
