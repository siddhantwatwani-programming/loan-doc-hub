import React from 'react';
import { Plus, Pencil } from 'lucide-react';
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
}

interface PropertiesTableViewProps {
  properties: PropertyData[];
  onAddProperty: () => void;
  onEditProperty: (property: PropertyData) => void;
  onRowClick: (property: PropertyData) => void;
  onPrimaryChange: (propertyId: string, isPrimary: boolean) => void;
  disabled?: boolean;
}

export const PropertiesTableView: React.FC<PropertiesTableViewProps> = ({
  properties,
  onAddProperty,
  onEditProperty,
  onRowClick,
  onPrimaryChange,
  disabled = false,
}) => {
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

  return (
    <div className="p-6 space-y-4">
      {/* Header with title and actions */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="font-semibold text-lg text-foreground">Properties</h3>
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
        </div>
      </div>

      {/* Properties Table */}
      <div className="border border-border rounded-lg overflow-x-auto">
        <Table className="min-w-[1400px]">
          <TableHeader>
            <TableRow className="bg-muted/50">
              <TableHead className="w-[80px]">PRIMARY</TableHead>
              <TableHead>DESCRIPTION</TableHead>
              <TableHead>STREET</TableHead>
              <TableHead>CITY</TableHead>
              <TableHead>STATE</TableHead>
              <TableHead>ZIP CODE</TableHead>
              <TableHead>COUNTY</TableHead>
              <TableHead>PROPERTY TYPE</TableHead>
              <TableHead>OCCUPANCY</TableHead>
              <TableHead>APPRAISED VALUE</TableHead>
              <TableHead>APPRAISAL DATE</TableHead>
              <TableHead>LTV</TableHead>
              <TableHead>APN</TableHead>
              <TableHead>LOAN PRIORITY</TableHead>
              <TableHead className="w-[80px]">ACTIONS</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {properties.length === 0 ? (
              <TableRow>
                <TableCell colSpan={15} className="text-center py-8 text-muted-foreground">
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
                  <TableCell onClick={(e) => e.stopPropagation()}>
                    <Checkbox
                      checked={property.isPrimary}
                      onCheckedChange={(checked) => onPrimaryChange(property.id, !!checked)}
                      disabled={disabled}
                    />
                  </TableCell>
                  <TableCell className="font-medium">{property.description || property.propertyType || '-'}</TableCell>
                  <TableCell>{property.street || '-'}</TableCell>
                  <TableCell>{property.city || '-'}</TableCell>
                  <TableCell>{property.state || '-'}</TableCell>
                  <TableCell>{property.zipCode || '-'}</TableCell>
                  <TableCell>{property.county || '-'}</TableCell>
                  <TableCell>{property.propertyType || '-'}</TableCell>
                  <TableCell>{property.occupancy || '-'}</TableCell>
                  <TableCell>{formatCurrency(property.appraisedValue)}</TableCell>
                  <TableCell>{property.appraisedDate || '-'}</TableCell>
                  <TableCell>{formatPercentage(property.ltv)}</TableCell>
                  <TableCell>{property.apn || '-'}</TableCell>
                  <TableCell>{property.loanPriority || '-'}</TableCell>
                  <TableCell onClick={(e) => e.stopPropagation()}>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => onEditProperty(property)}
                      disabled={disabled}
                      className="h-8 w-8"
                    >
                      <Pencil className="h-4 w-4" />
                    </Button>
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
    </div>
  );
};

export default PropertiesTableView;
