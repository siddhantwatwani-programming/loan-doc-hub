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

interface LenderFundingFormProps {
  fields: FieldDefinition[];
  values: Record<string, string>;
  onValueChange: (fieldKey: string, value: string) => void;
  showValidation?: boolean;
  disabled?: boolean;
  calculationResults?: Record<string, CalculationResult>;
}

export const LenderFundingForm: React.FC<LenderFundingFormProps> = ({
  fields,
  values,
  onValueChange,
  showValidation = false,
  disabled = false,
  calculationResults = {},
}) => {
  const fundingDate = values['funding_date'] ? new Date(values['funding_date']) : undefined;

  return (
    <div className="p-6 space-y-6">
      <div className="text-sm text-muted-foreground mb-4">
        This assistant will guide you through the necessary steps to setup the initial funding or add additional funds to a loan.
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Loan Account & Information Section */}
        <div className="space-y-4">
          <h3 className="text-base font-semibold text-primary border-b pb-2">Loan Account & Information</h3>
          
          <div className="space-y-4">
            <div className="space-y-2">
              <Label className="text-sm text-muted-foreground">Account</Label>
              <Input
                value={values['funding_account'] || ''}
                onChange={(e) => onValueChange('funding_account', e.target.value)}
                disabled={disabled}
                placeholder="Enter account number"
              />
            </div>
            
            <div className="space-y-2">
              <Label className="text-sm text-muted-foreground">Borrower Name</Label>
              <Input
                value={values['funding_borrower_name'] || ''}
                onChange={(e) => onValueChange('funding_borrower_name', e.target.value)}
                disabled={disabled}
                placeholder="Enter borrower name"
              />
            </div>

            <div className="space-y-2">
              <Label className="text-sm text-muted-foreground">Borrower Address</Label>
              <Textarea
                value={values['funding_borrower_address'] || ''}
                onChange={(e) => onValueChange('funding_borrower_address', e.target.value)}
                disabled={disabled}
                placeholder="Enter borrower address"
                rows={3}
                className="resize-none"
              />
            </div>
          </div>
        </div>

        {/* Funding Details Section */}
        <div className="space-y-4">
          <h3 className="text-base font-semibold text-primary border-b pb-2">Funding Details</h3>
          
          <div className="space-y-4">
            <div className="space-y-2">
              <Label className="text-sm text-muted-foreground">Principal Balance</Label>
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium">$</span>
                <Input
                  type="text"
                  inputMode="decimal"
                  value={values['funding_principal_balance'] || ''}
                  onChange={(e) => {
                    const value = e.target.value.replace(/[^0-9.]/g, '');
                    onValueChange('funding_principal_balance', value);
                  }}
                  disabled={disabled}
                  placeholder="Enter principal balance"
                  className="flex-1"
                />
              </div>
            </div>
            
            <div className="space-y-2">
              <Label className="text-sm text-muted-foreground">Funding Date</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      'w-full justify-start text-left font-normal',
                      !fundingDate && 'text-muted-foreground'
                    )}
                    disabled={disabled}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {fundingDate ? format(fundingDate, 'MM/dd/yyyy') : 'Select date'}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={fundingDate}
                    onSelect={(date) => onValueChange('funding_date', date ? format(date, 'yyyy-MM-dd') : '')}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>
            
            <div className="space-y-2">
              <Label className="text-sm text-muted-foreground">Reference</Label>
              <Input
                value={values['funding_reference'] || ''}
                onChange={(e) => onValueChange('funding_reference', e.target.value)}
                disabled={disabled}
              />
            </div>
            
            <div className="space-y-2">
              <Label className="text-sm text-muted-foreground">Funding Amount</Label>
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium">$</span>
                <Input
                  type="text"
                  inputMode="decimal"
                  value={values['funding_amount'] || ''}
                  onChange={(e) => {
                    const value = e.target.value.replace(/[^0-9.]/g, '');
                    onValueChange('funding_amount', value);
                  }}
                  disabled={disabled}
                  className="flex-1"
                />
              </div>
              <Select
                value={values['funding_amount_type'] || 'None'}
                onValueChange={(value) => onValueChange('funding_amount_type', value)}
                disabled={disabled}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="None">None</SelectItem>
                  <SelectItem value="Initial Funding">Initial Funding</SelectItem>
                  <SelectItem value="Additional Funding">Additional Funding</SelectItem>
                  <SelectItem value="Partial Draw">Partial Draw</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <Label className="text-sm text-muted-foreground">Notes</Label>
              <Textarea
                value={values['funding_notes'] || ''}
                onChange={(e) => onValueChange('funding_notes', e.target.value)}
                disabled={disabled}
                rows={4}
                className="resize-none"
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LenderFundingForm;
