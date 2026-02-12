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

const FIELD_KEYS = {
  apn: 'property1.apn',
  legalDescription: 'property1.legal_description',
  lot: 'property1.lot',
  block: 'property1.block',
  tract: 'property1.tract',
  unit: 'property1.unit',
} as const;

export const PropertyLegalDescriptionForm: React.FC<PropertyLegalDescriptionFormProps> = ({
  fields,
  values,
  onValueChange,
  showValidation = false,
  disabled = false,
}) => {
  const getFieldValue = (key: string) => values[key] || '';

  return (
    <div className="p-4 space-y-4">
      <div className="flex items-center gap-2">
        <Home className="h-5 w-5 text-primary" />
        <span className="font-semibold text-lg text-foreground">New Property</span>
      </div>

      <div className="space-y-3">
        <div className="border-b border-border pb-2">
          <span className="font-semibold text-sm text-primary">Property Legal Description</span>
        </div>

        <div className="flex items-center gap-3">
          <Label className="text-sm text-muted-foreground min-w-[120px] text-left shrink-0">APN</Label>
          <Input value={getFieldValue(FIELD_KEYS.apn)} onChange={(e) => onValueChange(FIELD_KEYS.apn, e.target.value)} disabled={disabled} className="h-7 text-sm max-w-md" placeholder="Enter APN" />
        </div>

        <div className="flex items-start gap-3">
          <Label className="text-sm text-muted-foreground min-w-[120px] text-left shrink-0 pt-2">Legal Description</Label>
          <Textarea value={getFieldValue(FIELD_KEYS.legalDescription)} onChange={(e) => onValueChange(FIELD_KEYS.legalDescription, e.target.value)} disabled={disabled} className="min-h-[150px] text-sm" placeholder="Enter legal description..." />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-w-2xl">
          <div className="flex items-center gap-3">
            <Label className="text-sm text-muted-foreground min-w-[120px] text-left shrink-0">Lot</Label>
            <Input value={getFieldValue(FIELD_KEYS.lot)} onChange={(e) => onValueChange(FIELD_KEYS.lot, e.target.value)} disabled={disabled} className="h-7 text-sm" />
          </div>
          <div className="flex items-center gap-3">
            <Label className="text-sm text-muted-foreground min-w-[120px] text-left shrink-0">Block</Label>
            <Input value={getFieldValue(FIELD_KEYS.block)} onChange={(e) => onValueChange(FIELD_KEYS.block, e.target.value)} disabled={disabled} className="h-7 text-sm" />
          </div>
          <div className="flex items-center gap-3">
            <Label className="text-sm text-muted-foreground min-w-[120px] text-left shrink-0">Tract</Label>
            <Input value={getFieldValue(FIELD_KEYS.tract)} onChange={(e) => onValueChange(FIELD_KEYS.tract, e.target.value)} disabled={disabled} className="h-7 text-sm" />
          </div>
          <div className="flex items-center gap-3">
            <Label className="text-sm text-muted-foreground min-w-[120px] text-left shrink-0">Unit</Label>
            <Input value={getFieldValue(FIELD_KEYS.unit)} onChange={(e) => onValueChange(FIELD_KEYS.unit, e.target.value)} disabled={disabled} className="h-7 text-sm" />
          </div>
        </div>
      </div>

      <div className="pt-4 border-t border-border">
        <p className="text-sm text-muted-foreground">
          The legal description is used to identify the property in legal documents such as deeds and mortgages.
        </p>
      </div>
    </div>
  );
};

export default PropertyLegalDescriptionForm;
