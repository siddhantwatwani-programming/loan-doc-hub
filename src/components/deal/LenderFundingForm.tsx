import React from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { CalendarIcon } from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import type { FieldDefinition } from '@/hooks/useDealFields';
import type { CalculationResult } from '@/lib/calculationEngine';

const FIELD_KEYS = {
  account: 'lender.funding.account',
  borrowerName: 'lender.funding.borrower_name',
  borrowerAddress: 'lender.funding.borrower_address',
  principalBalance: 'lender.funding.principal_balance',
  fundingDate: 'lender.funding.funding_date',
  reference: 'lender.funding.reference',
  fundingAmount: 'lender.funding.funding_amount',
  none: 'lender.funding.none',
  notes: 'lender.funding.notes',
} as const;

interface LenderFundingFormProps {
  fields: FieldDefinition[];
  values: Record<string, string>;
  onValueChange: (fieldKey: string, value: string) => void;
  showValidation?: boolean;
  disabled?: boolean;
  calculationResults?: Record<string, CalculationResult>;
}

export const LenderFundingForm: React.FC<LenderFundingFormProps> = ({
  fields, values, onValueChange, showValidation = false, disabled = false, calculationResults = {},
}) => {
  const getValue = (key: keyof typeof FIELD_KEYS): string => values[FIELD_KEYS[key]] || '';
  const handleChange = (key: keyof typeof FIELD_KEYS, value: string) => onValueChange(FIELD_KEYS[key], value);
  const fundingDate = getValue('fundingDate') ? new Date(getValue('fundingDate')) : undefined;

  return (
    <div className="p-4 space-y-4">
      <p className="text-xs text-muted-foreground">This assistant will guide you through the necessary steps to setup the initial funding or add additional funds to a loan.</p>

      <div className="form-section-header">Loan Account & Information</div>
      <div className="form-grid-compact">
        <div className="inline-field">
          <Label className="inline-label">Account</Label>
          <Input value={getValue('account')} onChange={(e) => handleChange('account', e.target.value)} disabled={disabled} className="h-7 text-sm" placeholder="Enter account number" />
        </div>
        <div className="inline-field">
          <Label className="inline-label">Borrower Name</Label>
          <Input value={getValue('borrowerName')} onChange={(e) => handleChange('borrowerName', e.target.value)} disabled={disabled} className="h-7 text-sm" placeholder="Enter borrower name" />
        </div>
        <div className="inline-field col-span-full md:col-span-2">
          <Label className="inline-label">Borrower Addr</Label>
          <Textarea value={getValue('borrowerAddress')} onChange={(e) => handleChange('borrowerAddress', e.target.value)} disabled={disabled} placeholder="Enter borrower address" rows={2} className="resize-none text-sm" />
        </div>
      </div>

      <div className="form-section-header">Funding Details</div>
      <div className="form-grid-compact">
        <div className="inline-field">
          <Label className="inline-label">Principal Bal</Label>
          <div className="flex items-center gap-1 flex-1">
            <span className="text-sm text-muted-foreground">$</span>
            <Input type="text" inputMode="decimal" value={getValue('principalBalance')} onChange={(e) => handleChange('principalBalance', e.target.value.replace(/[^0-9.]/g, ''))} disabled={disabled} placeholder="0.00" className="h-7 text-sm" />
          </div>
        </div>
        <div className="inline-field">
          <Label className="inline-label">Funding Date</Label>
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" className={cn('w-full justify-start text-left font-normal h-7 text-sm', !fundingDate && 'text-muted-foreground')} disabled={disabled}>
                <CalendarIcon className="mr-2 h-3.5 w-3.5" />
                {fundingDate ? format(fundingDate, 'MM/dd/yyyy') : 'Select date'}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <Calendar mode="single" selected={fundingDate} onSelect={(date) => handleChange('fundingDate', date ? format(date, 'yyyy-MM-dd') : '')} initialFocus />
            </PopoverContent>
          </Popover>
        </div>
        <div className="inline-field">
          <Label className="inline-label">Reference</Label>
          <Input value={getValue('reference')} onChange={(e) => handleChange('reference', e.target.value)} disabled={disabled} className="h-7 text-sm" />
        </div>
        <div className="inline-field">
          <Label className="inline-label">Funding Amt</Label>
          <div className="flex items-center gap-1 flex-1">
            <span className="text-sm text-muted-foreground">$</span>
            <Input type="text" inputMode="decimal" value={getValue('fundingAmount')} onChange={(e) => handleChange('fundingAmount', e.target.value.replace(/[^0-9.]/g, ''))} disabled={disabled} className="h-7 text-sm" />
          </div>
        </div>
        <div className="inline-field">
          <Label className="inline-label">Type</Label>
          <Select value={getValue('none') || 'None'} onValueChange={(value) => handleChange('none', value)} disabled={disabled}>
            <SelectTrigger className="h-7 text-sm"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="None">None</SelectItem>
              <SelectItem value="Initial Funding">Initial Funding</SelectItem>
              <SelectItem value="Additional Funding">Additional Funding</SelectItem>
              <SelectItem value="Partial Draw">Partial Draw</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="inline-field col-span-full md:col-span-2">
          <Label className="inline-label">Notes</Label>
          <Textarea value={getValue('notes')} onChange={(e) => handleChange('notes', e.target.value)} disabled={disabled} rows={2} className="resize-none text-sm" />
        </div>
      </div>
    </div>
  );
};

export default LenderFundingForm;
