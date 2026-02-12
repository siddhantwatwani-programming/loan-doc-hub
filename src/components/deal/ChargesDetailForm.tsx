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
  accruedInterest: 'charges.accrued_interest',
  distributeBetweenAllLenders: 'charges.distribute_between_all_lenders',
};

const renderInlineField = (key: string, label: string, values: Record<string, string>, onValueChange: (k: string, v: string) => void, disabled: boolean, props: Record<string, any> = {}) => (
  <div className="flex items-center gap-3">
    <Label className="text-sm text-muted-foreground min-w-[120px] text-left shrink-0">{label}</Label>
    <Input value={values[key] || ''} onChange={(e) => onValueChange(key, e.target.value)} disabled={disabled} className="h-7 text-sm flex-1" {...props} />
  </div>
);

const renderCurrencyField = (key: string, label: string, values: Record<string, string>, onValueChange: (k: string, v: string) => void, disabled: boolean) => (
  <div className="flex items-center gap-3">
    <Label className="text-sm text-muted-foreground min-w-[120px] text-left shrink-0">{label}</Label>
    <div className="relative flex-1">
      <span className="absolute left-2 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">$</span>
      <Input type="number" step="0.01" value={values[key] || ''} onChange={(e) => onValueChange(key, e.target.value)} disabled={disabled} className="h-7 text-sm pl-6" placeholder="0.00" />
    </div>
  </div>
);

export const ChargesDetailForm: React.FC<ChargesDetailFormProps> = ({
  values,
  onValueChange,
  disabled = false,
}) => {
  return (
    <div className="space-y-4">
      {/* Loan Information */}
      <div>
        <div className="bg-primary/10 border border-primary/20 rounded px-3 py-1.5 mb-3">
          <span className="font-semibold text-sm text-primary">Loan Information</span>
        </div>
        <div className="space-y-2 px-1">
          {renderInlineField(FIELD_KEYS.account, 'Account', values, onValueChange, disabled, { placeholder: 'Enter account' })}
          {renderInlineField(FIELD_KEYS.borrowerFullName, 'Borrower Name', values, onValueChange, disabled, { placeholder: 'Enter name' })}
        </div>
      </div>

      {/* Charge Information */}
      <div>
        <div className="bg-primary/10 border border-primary/20 rounded px-3 py-1.5 mb-3">
          <span className="font-semibold text-sm text-primary">Charge Information</span>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-2 px-1">
          {renderInlineField(FIELD_KEYS.dateOfCharge, 'Date of Charge', values, onValueChange, disabled, { type: 'date' })}
          {renderInlineField(FIELD_KEYS.interestFrom, 'Interest From', values, onValueChange, disabled, { type: 'date' })}
          {renderInlineField(FIELD_KEYS.reference, 'Reference', values, onValueChange, disabled, { placeholder: 'Enter reference' })}
          {renderInlineField(FIELD_KEYS.chargeType, 'Charge Type', values, onValueChange, disabled, { placeholder: 'Enter type' })}
          {renderCurrencyField(FIELD_KEYS.originalAmount, 'Original Amount', values, onValueChange, disabled)}
          {renderInlineField(FIELD_KEYS.description, 'Description', values, onValueChange, disabled, { placeholder: 'Enter description' })}
          <div className="flex items-center gap-3">
            <Label className="text-sm text-muted-foreground min-w-[120px] text-left shrink-0">Interest Rate</Label>
            <div className="relative flex-1">
              <Input type="number" step="0.01" value={values[FIELD_KEYS.interestRate] || ''} onChange={(e) => onValueChange(FIELD_KEYS.interestRate, e.target.value)} disabled={disabled} className="h-7 text-sm pr-6" placeholder="0.00" />
              <span className="absolute right-2 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">%</span>
            </div>
          </div>
          {renderInlineField(FIELD_KEYS.owedTo, 'Owed To', values, onValueChange, disabled, { placeholder: 'Enter owed to' })}
          {renderInlineField(FIELD_KEYS.owedFrom, 'Owed From', values, onValueChange, disabled, { placeholder: 'Enter owed from' })}
          {renderCurrencyField(FIELD_KEYS.unpaidBalance, 'Unpaid Balance', values, onValueChange, disabled)}
          {renderCurrencyField(FIELD_KEYS.totalDue, 'Total Due', values, onValueChange, disabled)}
          <div className="flex items-start gap-3">
            <Label className="text-sm text-muted-foreground min-w-[120px] text-left shrink-0 pt-2">Notes</Label>
            <Textarea value={values[FIELD_KEYS.notes] || ''} onChange={(e) => onValueChange(FIELD_KEYS.notes, e.target.value)} disabled={disabled} className="text-sm min-h-[50px] flex-1" placeholder="Enter notes" />
          </div>
        </div>
        <div className="flex items-center gap-2 px-1 pt-2">
          <Checkbox id="detail-deferred" checked={values[FIELD_KEYS.deferred] === 'true'} onCheckedChange={(checked) => onValueChange(FIELD_KEYS.deferred, checked ? 'true' : 'false')} disabled={disabled} />
          <Label htmlFor="detail-deferred" className="text-sm text-foreground cursor-pointer">Deferred</Label>
        </div>
      </div>

      {/* Distribution Section - keep existing table structure */}
      <div>
        <div className="bg-primary/10 border border-primary/20 rounded px-3 py-1.5 mb-3">
          <span className="font-semibold text-sm text-primary">Distribution</span>
        </div>
        <div className="px-1">
          <div className="border border-border rounded-lg overflow-hidden">
            <div className="grid grid-cols-[140px_1fr_1fr_1fr] bg-muted/50 border-b border-border">
              <div className="px-3 py-2 text-xs font-semibold text-muted-foreground"></div>
              <div className="px-3 py-2 text-xs font-semibold text-muted-foreground">ACCOUNT</div>
              <div className="px-3 py-2 text-xs font-semibold text-muted-foreground">LENDER NAME</div>
              <div className="px-3 py-2 text-xs font-semibold text-muted-foreground">AMOUNT</div>
            </div>
            <div className="grid grid-cols-[140px_1fr_1fr_1fr] border-b border-border items-center">
              <div className="px-3 py-2 text-sm font-medium text-foreground">Advanced By</div>
              <div className="px-2 py-1.5"><Input value={values[FIELD_KEYS.advancedByAccount] || ''} onChange={(e) => onValueChange(FIELD_KEYS.advancedByAccount, e.target.value)} disabled={disabled} className="h-7 text-sm" /></div>
              <div className="px-2 py-1.5"><Input value={values[FIELD_KEYS.advancedByLenderName] || ''} onChange={(e) => onValueChange(FIELD_KEYS.advancedByLenderName, e.target.value)} disabled={disabled} className="h-7 text-sm" /></div>
              <div className="px-2 py-1.5"><div className="relative"><span className="absolute left-2 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">$</span><Input type="number" step="0.01" value={values[FIELD_KEYS.advancedByAmount] || ''} onChange={(e) => onValueChange(FIELD_KEYS.advancedByAmount, e.target.value)} disabled={disabled} className="h-7 text-sm pl-6" placeholder="0.00" /></div></div>
            </div>
            <div className="grid grid-cols-[140px_1fr_1fr_1fr] border-b border-border items-center">
              <div className="px-3 py-2 text-sm font-medium text-foreground">On Behalf Of</div>
              <div className="px-2 py-1.5"><Input value={values[FIELD_KEYS.onBehalfOfAccount] || ''} onChange={(e) => onValueChange(FIELD_KEYS.onBehalfOfAccount, e.target.value)} disabled={disabled} className="h-7 text-sm" /></div>
              <div className="px-2 py-1.5"><Input value={values[FIELD_KEYS.onBehalfOfLenderName] || ''} onChange={(e) => onValueChange(FIELD_KEYS.onBehalfOfLenderName, e.target.value)} disabled={disabled} className="h-7 text-sm" /></div>
              <div className="px-2 py-1.5"><div className="relative"><span className="absolute left-2 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">$</span><Input type="number" step="0.01" value={values[FIELD_KEYS.onBehalfOfAmount] || ''} onChange={(e) => onValueChange(FIELD_KEYS.onBehalfOfAmount, e.target.value)} disabled={disabled} className="h-7 text-sm pl-6" placeholder="0.00" /></div></div>
            </div>
            <div className="grid grid-cols-[140px_1fr_1fr_1fr] items-center">
              <div className="px-3 py-2 flex items-center gap-2">
                <Checkbox id="distributeBetweenAllLendersDetail" checked={values[FIELD_KEYS.distributeBetweenAllLenders] === 'true'} onCheckedChange={(checked) => onValueChange(FIELD_KEYS.distributeBetweenAllLenders, checked ? 'true' : 'false')} disabled={disabled} />
                <Label htmlFor="distributeBetweenAllLendersDetail" className="text-sm font-medium text-foreground cursor-pointer whitespace-nowrap">Distribute All</Label>
              </div>
              <div className="px-3 py-2 text-sm font-medium text-foreground col-span-2 text-right pr-4">Amount Owed by Borrower:</div>
              <div className="px-2 py-1.5"><div className="relative"><span className="absolute left-2 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">$</span><Input type="number" step="0.01" value={values[FIELD_KEYS.amountOwedByBorrower] || ''} onChange={(e) => onValueChange(FIELD_KEYS.amountOwedByBorrower, e.target.value)} disabled={disabled} className="h-7 text-sm pl-6" placeholder="0.00" /></div></div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ChargesDetailForm;
