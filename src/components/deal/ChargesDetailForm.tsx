import React from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';

interface ChargesDetailFormProps {
  values: Record<string, string>;
  onValueChange: (fieldKey: string, value: string) => void;
  disabled?: boolean;
}


const FIELD_KEYS = {
  description: 'charges.description',
  unpaidBalance: 'charges.unpaid_balance',
  owedTo: 'charges.owed_to',
  owedFrom: 'charges.owed_from',
  totalDue: 'charges.total_due',
  interestFrom: 'charges.interest_from',
  dateOfCharge: 'charges.date_of_charge',
  interestRate: 'charges.interest_rate',
  notes: 'charges.notes',
  reference: 'charges.reference',
  chargeType: 'charges.charge_type',
  deferred: 'charges.deferred',
  originalAmount: 'charges.original_amount',
  account: 'charges.account',
  borrowerFullName: 'charges.borrower_full_name',
  advancedByAccount: 'charges.advanced_by_account',
  advancedByLenderName: 'charges.advanced_by_lender_name',
  advancedByAmount: 'charges.advanced_by_amount',
  onBehalfOfAccount: 'charges.on_behalf_of_account',
  onBehalfOfLenderName: 'charges.on_behalf_of_lender_name',
  onBehalfOfAmount: 'charges.on_behalf_of_amount',
  amountOwedByBorrower: 'charges.amount_owed_by_borrower',
};

export const ChargesDetailForm: React.FC<ChargesDetailFormProps> = ({
  values,
  onValueChange,
  disabled = false,
}) => {
  return (
    <div className="space-y-6">
      {/* === Loan Information Section === */}
      <div>
        <div className="bg-primary/10 border border-primary/20 rounded px-3 py-1.5 mb-3">
          <span className="font-semibold text-sm text-primary">Loan Information</span>
        </div>
        <div className="space-y-3 px-1">
          <div>
            <Label className="text-sm text-foreground">Account</Label>
            <Input
              value={values[FIELD_KEYS.account] || ''}
              onChange={(e) => onValueChange(FIELD_KEYS.account, e.target.value)}
              disabled={disabled}
              className="h-8 text-sm mt-1"
              placeholder="Enter account"
            />
          </div>
          <div>
            <Label className="text-sm text-foreground">Borrower Full Name</Label>
            <Input
              value={values[FIELD_KEYS.borrowerFullName] || ''}
              onChange={(e) => onValueChange(FIELD_KEYS.borrowerFullName, e.target.value)}
              disabled={disabled}
              className="h-8 text-sm mt-1"
              placeholder="Enter borrower full name"
            />
          </div>
        </div>
      </div>

      {/* === Charge Information Section === */}
      <div>
        <div className="bg-primary/10 border border-primary/20 rounded px-3 py-1.5 mb-3">
          <span className="font-semibold text-sm text-primary">Charge Information</span>
        </div>
        <div className="space-y-3 px-1">
          {/* Row 1: Date of Charge | Interest From */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label className="text-sm text-foreground">Date of Charge</Label>
              <Input
                type="date"
                value={values[FIELD_KEYS.dateOfCharge] || ''}
                onChange={(e) => onValueChange(FIELD_KEYS.dateOfCharge, e.target.value)}
                disabled={disabled}
                className="h-8 text-sm mt-1"
              />
            </div>
            <div>
              <Label className="text-sm text-foreground">Interest From</Label>
              <Input
                type="date"
                value={values[FIELD_KEYS.interestFrom] || ''}
                onChange={(e) => onValueChange(FIELD_KEYS.interestFrom, e.target.value)}
                disabled={disabled}
                className="h-8 text-sm mt-1"
              />
            </div>
          </div>

          {/* Row 2: Reference | Charge Type */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label className="text-sm text-foreground">Reference</Label>
              <Input
                value={values[FIELD_KEYS.reference] || ''}
                onChange={(e) => onValueChange(FIELD_KEYS.reference, e.target.value)}
                disabled={disabled}
                className="h-8 text-sm mt-1"
                placeholder="Enter reference"
              />
            </div>
            <div>
              <Label className="text-sm text-foreground">Charge Type</Label>
              <Input
                value={values[FIELD_KEYS.chargeType] || ''}
                onChange={(e) => onValueChange(FIELD_KEYS.chargeType, e.target.value)}
                disabled={disabled}
                className="h-8 text-sm mt-1"
                placeholder="Enter charge type"
              />
            </div>
          </div>

          {/* Row 3: Original Amount | Description */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label className="text-sm text-foreground">Original Amount</Label>
              <div className="relative mt-1">
                <span className="absolute left-2 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">$</span>
                <Input
                  type="number"
                  step="0.01"
                  value={values[FIELD_KEYS.originalAmount] || ''}
                  onChange={(e) => onValueChange(FIELD_KEYS.originalAmount, e.target.value)}
                  disabled={disabled}
                  className="h-8 text-sm pl-6"
                  placeholder="0.00"
                />
              </div>
            </div>
            <div>
              <Label className="text-sm text-foreground">Description</Label>
              <Input
                value={values[FIELD_KEYS.description] || ''}
                onChange={(e) => onValueChange(FIELD_KEYS.description, e.target.value)}
                disabled={disabled}
                className="h-8 text-sm mt-1"
                placeholder="Enter description"
              />
            </div>
          </div>

          {/* Row 4: Interest Rate */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label className="text-sm text-foreground">Interest Rate</Label>
              <div className="relative mt-1">
                <Input
                  type="number"
                  step="0.01"
                  value={values[FIELD_KEYS.interestRate] || ''}
                  onChange={(e) => onValueChange(FIELD_KEYS.interestRate, e.target.value)}
                  disabled={disabled}
                  className="h-8 text-sm pr-6"
                  placeholder="0.00"
                />
                <span className="absolute right-2 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">%</span>
              </div>
            </div>
          </div>

          {/* Row 5: Unpaid Balance | Owed To */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label className="text-sm text-foreground">Unpaid Balance</Label>
              <div className="relative mt-1">
                <span className="absolute left-2 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">$</span>
                <Input
                  type="number"
                  step="0.01"
                  value={values[FIELD_KEYS.unpaidBalance] || ''}
                  onChange={(e) => onValueChange(FIELD_KEYS.unpaidBalance, e.target.value)}
                  disabled={disabled}
                  className="h-8 text-sm pl-6"
                  placeholder="0.00"
                />
              </div>
            </div>
            <div>
              <Label className="text-sm text-foreground">Owed To</Label>
              <Input
                value={values[FIELD_KEYS.owedTo] || ''}
                onChange={(e) => onValueChange(FIELD_KEYS.owedTo, e.target.value)}
                disabled={disabled}
                className="h-8 text-sm mt-1"
                placeholder="Enter owed to"
              />
            </div>
          </div>

          {/* Row 6: Owed From | Total Due */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label className="text-sm text-foreground">Owed From</Label>
              <Input
                value={values[FIELD_KEYS.owedFrom] || ''}
                onChange={(e) => onValueChange(FIELD_KEYS.owedFrom, e.target.value)}
                disabled={disabled}
                className="h-8 text-sm mt-1"
                placeholder="Enter owed from"
              />
            </div>
            <div>
              <Label className="text-sm text-foreground">Total Due</Label>
              <div className="relative mt-1">
                <span className="absolute left-2 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">$</span>
                <Input
                  type="number"
                  step="0.01"
                  value={values[FIELD_KEYS.totalDue] || ''}
                  onChange={(e) => onValueChange(FIELD_KEYS.totalDue, e.target.value)}
                  disabled={disabled}
                  className="h-8 text-sm pl-6"
                  placeholder="0.00"
                />
              </div>
            </div>
          </div>

          {/* Row 7: Notes */}
          <div>
            <Label className="text-sm text-foreground">Notes</Label>
            <Textarea
              value={values[FIELD_KEYS.notes] || ''}
              onChange={(e) => onValueChange(FIELD_KEYS.notes, e.target.value)}
              disabled={disabled}
              className="text-sm mt-1 min-h-[60px]"
              placeholder="Enter notes"
            />
          </div>

          {/* Row 8: Deferred checkbox */}
          <div className="flex items-center gap-2">
            <Checkbox
              id="detail-deferred"
              checked={values[FIELD_KEYS.deferred] === 'true'}
              onCheckedChange={(checked) => onValueChange(FIELD_KEYS.deferred, checked ? 'true' : 'false')}
              disabled={disabled}
            />
            <Label htmlFor="detail-deferred" className="text-sm text-foreground cursor-pointer">
              Deferred
            </Label>
          </div>
        </div>
      </div>

      {/* === Distribution Section === */}
      <div>
        <div className="bg-primary/10 border border-primary/20 rounded px-3 py-1.5 mb-3">
          <span className="font-semibold text-sm text-primary">Distribution</span>
        </div>
        <div className="px-1">
          <div className="border border-border rounded-lg overflow-hidden">
            {/* Header row */}
            <div className="grid grid-cols-[140px_1fr_1fr_1fr] bg-muted/50 border-b border-border">
              <div className="px-3 py-2 text-xs font-semibold text-muted-foreground"></div>
              <div className="px-3 py-2 text-xs font-semibold text-muted-foreground">ACCOUNT</div>
              <div className="px-3 py-2 text-xs font-semibold text-muted-foreground">LENDER NAME</div>
              <div className="px-3 py-2 text-xs font-semibold text-muted-foreground">AMOUNT</div>
            </div>

            {/* Advanced By row */}
            <div className="grid grid-cols-[140px_1fr_1fr_1fr] border-b border-border items-center">
              <div className="px-3 py-2 text-sm font-medium text-foreground">Advanced By</div>
              <div className="px-2 py-1.5">
                <Input
                  value={values[FIELD_KEYS.advancedByAccount] || ''}
                  onChange={(e) => onValueChange(FIELD_KEYS.advancedByAccount, e.target.value)}
                  disabled={disabled}
                  className="h-7 text-sm"
                />
              </div>
              <div className="px-2 py-1.5">
                <Input
                  value={values[FIELD_KEYS.advancedByLenderName] || ''}
                  onChange={(e) => onValueChange(FIELD_KEYS.advancedByLenderName, e.target.value)}
                  disabled={disabled}
                  className="h-7 text-sm"
                />
              </div>
              <div className="px-2 py-1.5">
                <div className="relative">
                  <span className="absolute left-2 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">$</span>
                  <Input
                    type="number"
                    step="0.01"
                    value={values[FIELD_KEYS.advancedByAmount] || ''}
                    onChange={(e) => onValueChange(FIELD_KEYS.advancedByAmount, e.target.value)}
                    disabled={disabled}
                    className="h-7 text-sm pl-6"
                    placeholder="0.00"
                  />
                </div>
              </div>
            </div>

            {/* On Behalf Of row */}
            <div className="grid grid-cols-[140px_1fr_1fr_1fr] border-b border-border items-center">
              <div className="px-3 py-2 text-sm font-medium text-foreground">On Behalf Of</div>
              <div className="px-2 py-1.5">
                <Input
                  value={values[FIELD_KEYS.onBehalfOfAccount] || ''}
                  onChange={(e) => onValueChange(FIELD_KEYS.onBehalfOfAccount, e.target.value)}
                  disabled={disabled}
                  className="h-7 text-sm"
                />
              </div>
              <div className="px-2 py-1.5">
                <Input
                  value={values[FIELD_KEYS.onBehalfOfLenderName] || ''}
                  onChange={(e) => onValueChange(FIELD_KEYS.onBehalfOfLenderName, e.target.value)}
                  disabled={disabled}
                  className="h-7 text-sm"
                />
              </div>
              <div className="px-2 py-1.5">
                <div className="relative">
                  <span className="absolute left-2 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">$</span>
                  <Input
                    type="number"
                    step="0.01"
                    value={values[FIELD_KEYS.onBehalfOfAmount] || ''}
                    onChange={(e) => onValueChange(FIELD_KEYS.onBehalfOfAmount, e.target.value)}
                    disabled={disabled}
                    className="h-7 text-sm pl-6"
                    placeholder="0.00"
                  />
                </div>
              </div>
            </div>

            {/* Amount Owed by Borrower row */}
            <div className="grid grid-cols-[140px_1fr_1fr_1fr] items-center">
              <div className="px-3 py-2 text-sm font-medium text-foreground col-span-3 text-right pr-4">
                Amount Owed by Borrower:
              </div>
              <div className="px-2 py-1.5">
                <div className="relative">
                  <span className="absolute left-2 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">$</span>
                  <Input
                    type="number"
                    step="0.01"
                    value={values[FIELD_KEYS.amountOwedByBorrower] || ''}
                    onChange={(e) => onValueChange(FIELD_KEYS.amountOwedByBorrower, e.target.value)}
                    disabled={disabled}
                    className="h-7 text-sm pl-6"
                    placeholder="0.00"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ChargesDetailForm;
