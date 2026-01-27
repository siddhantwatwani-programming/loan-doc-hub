import React, { useEffect } from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Textarea } from '@/components/ui/textarea';
import { Home } from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import type { FieldDefinition } from '@/hooks/useDealFields';
import type { CalculationResult } from '@/lib/calculationEngine';

interface PropertyTaxFormProps {
  fields: FieldDefinition[];
  values: Record<string, string>;
  onValueChange: (fieldKey: string, value: string) => void;
  showValidation?: boolean;
  disabled?: boolean;
  calculationResults?: Record<string, CalculationResult>;
}

const FREQUENCY_OPTIONS = [
  'Once Only',
  'Monthly',
  'Quarterly',
  'Bi-Monthly',
  'Bi-Weekly',
  'Weekly',
  'Semi-Monthly',
  'Semi-Yearly',
  'Yearly'
];

export const PropertyTaxForm: React.FC<PropertyTaxFormProps> = ({
  fields,
  values,
  onValueChange,
  showValidation = false,
  disabled = false,
}) => {
  const getFieldValue = (key: string) => values[key] || '';

  // Auto-populate Ref from APN (Legal Description page)
  const apnValue = values['Property.Legal.APN'] || '';
  
  useEffect(() => {
    // Auto-populate the Ref field from APN if APN exists and Ref is empty
    if (apnValue && !getFieldValue('Property.Tax.Ref')) {
      onValueChange('Property.Tax.Ref', apnValue);
    }
  }, [apnValue]);

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center gap-2">
        <Home className="h-5 w-5 text-primary" />
        <span className="font-semibold text-lg text-foreground">Property Tax</span>
      </div>

      <div className="grid grid-cols-2 gap-8 max-w-4xl">
        {/* Left Column - Payee Section */}
        <div className="space-y-4">
          <div className="border-b border-border pb-2">
            <span className="font-semibold text-sm text-primary">Payee</span>
          </div>

          <div>
            <Label className="text-sm text-foreground">Payee Name</Label>
            <Input
              value={getFieldValue('Property.Tax.PayeeName')}
              onChange={(e) => onValueChange('Property.Tax.PayeeName', e.target.value)}
              disabled={disabled}
              className="h-8 text-sm mt-1"
              placeholder="SDTAXCOLL"
            />
          </div>

          <div>
            <Label className="text-sm text-foreground">Payee Address</Label>
            <Textarea
              value={getFieldValue('Property.Tax.PayeeAddress')}
              onChange={(e) => onValueChange('Property.Tax.PayeeAddress', e.target.value)}
              disabled={disabled}
              className="mt-1 min-h-[80px] text-sm"
              placeholder="Dan McAllister&#10;P.O. Box 129009&#10;San Diego CA 92112"
            />
          </div>

          <div>
            <Label className="text-sm text-foreground">Ref</Label>
            <Input
              value={getFieldValue('Property.Tax.Ref') || apnValue}
              onChange={(e) => onValueChange('Property.Tax.Ref', e.target.value)}
              disabled={disabled}
              className="h-8 text-sm mt-1"
              placeholder="APN: 578-012-76-09"
            />
            <p className="text-xs text-muted-foreground mt-1">
              Auto-populated from APN on Legal Description page
            </p>
          </div>

          <div>
            <Label className="text-sm text-foreground">Memo</Label>
            <Input
              value={getFieldValue('Property.Tax.Memo')}
              onChange={(e) => onValueChange('Property.Tax.Memo', e.target.value)}
              disabled={disabled}
              className="h-8 text-sm mt-1"
              placeholder="Enter memo"
            />
          </div>
        </div>

        {/* Right Column - Payment Details */}
        <div className="space-y-4">
          <div className="border-b border-border pb-2">
            <span className="font-semibold text-sm text-primary">Payment Details</span>
          </div>

          <div>
            <Label className="text-sm text-foreground">Next Due Date</Label>
            <Input
              type="date"
              value={getFieldValue('Property.Tax.NextDueDate')}
              onChange={(e) => onValueChange('Property.Tax.NextDueDate', e.target.value)}
              disabled={disabled}
              className="h-8 text-sm mt-1"
            />
          </div>

          <div>
            <Label className="text-sm text-foreground">Frequency</Label>
            <Select
              value={getFieldValue('Property.Tax.Frequency') || 'Once Only'}
              onValueChange={(val) => onValueChange('Property.Tax.Frequency', val)}
              disabled={disabled}
            >
              <SelectTrigger className="h-8 text-sm mt-1">
                <SelectValue placeholder="Once Only" />
              </SelectTrigger>
              <SelectContent className="bg-background border border-border z-50">
                {FREQUENCY_OPTIONS.map(opt => (
                  <SelectItem key={opt} value={opt}>{opt}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex items-center gap-2 pt-2">
            <Checkbox
              id="tax-hold"
              checked={getFieldValue('Property.Tax.Hold') === 'true'}
              onCheckedChange={(checked) => onValueChange('Property.Tax.Hold', checked ? 'true' : 'false')}
              disabled={disabled}
              className="h-4 w-4"
            />
            <Label htmlFor="tax-hold" className="text-sm text-foreground">
              Hold
            </Label>
          </div>

          <div>
            <Label className="text-sm text-foreground">Amount</Label>
            <div className="flex items-center gap-1 mt-1">
              <span className="text-sm text-muted-foreground">$</span>
              <Input
                value={getFieldValue('Property.Tax.Amount')}
                onChange={(e) => onValueChange('Property.Tax.Amount', e.target.value)}
                disabled={disabled}
                className="h-8 text-sm text-right"
                inputMode="decimal"
                placeholder="0.00"
              />
            </div>
          </div>

          <div>
            <Label className="text-sm text-foreground">Tax Year</Label>
            <Input
              value={getFieldValue('Property.Tax.TaxYear')}
              onChange={(e) => onValueChange('Property.Tax.TaxYear', e.target.value)}
              disabled={disabled}
              className="h-8 text-sm mt-1"
              placeholder="2024"
            />
          </div>
        </div>
      </div>

      <div className="pt-6 border-t border-border">
        <p className="text-sm text-muted-foreground">
          Property tax information is used to track tax obligations and payment schedules for the property.
        </p>
      </div>
    </div>
  );
};

export default PropertyTaxForm;
