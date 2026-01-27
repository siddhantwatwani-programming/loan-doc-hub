import React from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Home } from 'lucide-react';
import type { FieldDefinition } from '@/hooks/useDealFields';
import type { CalculationResult } from '@/lib/calculationEngine';

interface PropertyLegalDescriptionFormProps {
  fields: FieldDefinition[];
  values: Record<string, string>;
  onValueChange: (fieldKey: string, value: string) => void;
  showValidation?: boolean;
  disabled?: boolean;
  calculationResults?: Record<string, CalculationResult>;
}

export const PropertyLegalDescriptionForm: React.FC<PropertyLegalDescriptionFormProps> = ({
  fields,
  values,
  onValueChange,
  showValidation = false,
  disabled = false,
}) => {
  const getFieldValue = (key: string) => values[key] || '';

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center gap-2">
        <Home className="h-5 w-5 text-primary" />
        <span className="font-semibold text-lg text-foreground">New Property</span>
      </div>

      {/* Property Legal Description Section */}
      <div className="space-y-4">
        <div className="border-b border-border pb-2">
          <span className="font-semibold text-sm text-primary">Property Legal Description</span>
        </div>

        <div>
          <Label className="text-sm text-foreground">APN (Assessor's Parcel Number)</Label>
          <Input
            value={getFieldValue('Property.Legal.APN')}
            onChange={(e) => onValueChange('Property.Legal.APN', e.target.value)}
            disabled={disabled}
            className="h-8 text-sm mt-1 max-w-md"
            placeholder="Enter APN"
          />
        </div>

        <div>
          <Label className="text-sm text-foreground">Legal Description</Label>
          <Textarea
            value={getFieldValue('Property.Legal.Description')}
            onChange={(e) => onValueChange('Property.Legal.Description', e.target.value)}
            disabled={disabled}
            className="mt-1 min-h-[200px] text-sm"
            placeholder="Enter the legal description of the property..."
          />
        </div>

        <div className="grid grid-cols-2 gap-4 max-w-2xl">
          <div>
            <Label className="text-sm text-foreground">Lot</Label>
            <Input
              value={getFieldValue('Property.Legal.Lot')}
              onChange={(e) => onValueChange('Property.Legal.Lot', e.target.value)}
              disabled={disabled}
              className="h-8 text-sm mt-1"
            />
          </div>

          <div>
            <Label className="text-sm text-foreground">Block</Label>
            <Input
              value={getFieldValue('Property.Legal.Block')}
              onChange={(e) => onValueChange('Property.Legal.Block', e.target.value)}
              disabled={disabled}
              className="h-8 text-sm mt-1"
            />
          </div>

          <div>
            <Label className="text-sm text-foreground">Tract</Label>
            <Input
              value={getFieldValue('Property.Legal.Tract')}
              onChange={(e) => onValueChange('Property.Legal.Tract', e.target.value)}
              disabled={disabled}
              className="h-8 text-sm mt-1"
            />
          </div>

          <div>
            <Label className="text-sm text-foreground">Unit</Label>
            <Input
              value={getFieldValue('Property.Legal.Unit')}
              onChange={(e) => onValueChange('Property.Legal.Unit', e.target.value)}
              disabled={disabled}
              className="h-8 text-sm mt-1"
            />
          </div>
        </div>
      </div>

      <div className="pt-6 border-t border-border">
        <p className="text-sm text-muted-foreground">
          The legal description is used to identify the property in legal documents such as deeds and mortgages.
        </p>
      </div>
    </div>
  );
};

export default PropertyLegalDescriptionForm;
