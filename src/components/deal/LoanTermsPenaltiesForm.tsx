import React, { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Users } from 'lucide-react';
import type { FieldDefinition } from '@/hooks/useDealFields';
import type { CalculationResult } from '@/lib/calculationEngine';

interface LoanTermsPenaltiesFormProps {
  fields: FieldDefinition[];
  values: Record<string, string>;
  onValueChange: (fieldKey: string, value: string) => void;
  showValidation?: boolean;
  disabled?: boolean;
  calculationResults?: Record<string, CalculationResult>;
}

// Distribution fields component - reusable across sections
const DistributionFields: React.FC<{
  prefix: string;
  values: Record<string, string>;
  onValueChange: (fieldKey: string, value: string) => void;
  disabled?: boolean;
  showOther?: boolean;
}> = ({ prefix, values, onValueChange, disabled, showOther = true }) => {
  const [contactDialogOpen, setContactDialogOpen] = useState(false);

  return (
    <div className="space-y-3">
      <h4 className="text-sm font-medium text-foreground">Distribution</h4>
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1">
          <Label className="text-xs text-muted-foreground">Lenders</Label>
          <Input
            value={values[`${prefix}.distribution.lenders`] || ''}
            onChange={(e) => onValueChange(`${prefix}.distribution.lenders`, e.target.value)}
            disabled={disabled}
            className="h-8 text-sm"
          />
        </div>
        <div className="space-y-1">
          <Label className="text-xs text-muted-foreground">Origination Vendors</Label>
          <Input
            value={values[`${prefix}.distribution.origination_vendors`] || ''}
            onChange={(e) => onValueChange(`${prefix}.distribution.origination_vendors`, e.target.value)}
            disabled={disabled}
            className="h-8 text-sm"
          />
        </div>
        <div className="space-y-1">
          <Label className="text-xs text-muted-foreground">Company</Label>
          <Input
            value={values[`${prefix}.distribution.company`] || ''}
            onChange={(e) => onValueChange(`${prefix}.distribution.company`, e.target.value)}
            disabled={disabled}
            className="h-8 text-sm"
          />
        </div>
        <div className="space-y-1">
          <Label className="text-xs text-muted-foreground">Other</Label>
          <div className="flex gap-2">
            <Input
              value={values[`${prefix}.distribution.other`] || ''}
              onChange={(e) => onValueChange(`${prefix}.distribution.other`, e.target.value)}
              disabled={disabled}
              className="h-8 text-sm flex-1"
            />
            {showOther && (
              <Dialog open={contactDialogOpen} onOpenChange={setContactDialogOpen}>
                <DialogTrigger asChild>
                  <Button variant="outline" size="sm" className="h-8 px-2" disabled={disabled}>
                    <Users className="h-4 w-4" />
                  </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-md">
                  <DialogHeader>
                    <DialogTitle>Select Contact</DialogTitle>
                  </DialogHeader>
                  <div className="py-4">
                    <p className="text-sm text-muted-foreground">
                      Select a contact from the existing contacts list to distribute to.
                    </p>
                    <div className="mt-4 space-y-2">
                      <p className="text-xs text-muted-foreground italic">
                        Contact selection will use existing contacts from the deal.
                      </p>
                    </div>
                  </div>
                </DialogContent>
              </Dialog>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

// Late Charge Configuration Column
const LateChargeColumn: React.FC<{
  title: string;
  prefix: string;
  values: Record<string, string>;
  onValueChange: (fieldKey: string, value: string) => void;
  disabled?: boolean;
  showTriggeredBy?: boolean;
}> = ({ title, prefix, values, onValueChange, disabled, showTriggeredBy = false }) => {
  return (
    <div className="space-y-4 p-4 border border-border rounded-lg bg-card">
      {title && <h3 className="text-sm font-semibold text-foreground border-b pb-2">{title}</h3>}
      
      <div className="space-y-3">
        <div className="space-y-1">
          <Label className="text-xs text-muted-foreground">Type</Label>
          <Input
            value={values[`${prefix}.type`] || ''}
            onChange={(e) => onValueChange(`${prefix}.type`, e.target.value)}
            disabled={disabled}
            className="h-8 text-sm"
          />
        </div>
        
        <div className="space-y-1">
          <Label className="text-xs text-muted-foreground">Grace Period</Label>
          <Input
            value={values[`${prefix}.grace_period`] || ''}
            onChange={(e) => onValueChange(`${prefix}.grace_period`, e.target.value)}
            disabled={disabled}
            className="h-8 text-sm"
          />
        </div>
        
        {!showTriggeredBy ? (
          <div className="space-y-1">
            <Label className="text-xs text-muted-foreground">Calendar / Actual</Label>
            <Input
              value={values[`${prefix}.calendar_actual`] || ''}
              onChange={(e) => onValueChange(`${prefix}.calendar_actual`, e.target.value)}
              disabled={disabled}
              className="h-8 text-sm"
            />
          </div>
        ) : (
          <div className="space-y-1">
            <Label className="text-xs text-muted-foreground">Flat Rate</Label>
            <Input
              value={values[`${prefix}.flat_rate`] || ''}
              onChange={(e) => onValueChange(`${prefix}.flat_rate`, e.target.value)}
              disabled={disabled}
              className="h-8 text-sm"
            />
          </div>
        )}
        
        {!showTriggeredBy ? (
          <div className="space-y-1">
            <Label className="text-xs text-muted-foreground">Minimum Late Fee</Label>
            <Input
              value={values[`${prefix}.minimum_late_fee`] || ''}
              onChange={(e) => onValueChange(`${prefix}.minimum_late_fee`, e.target.value)}
              disabled={disabled}
              className="h-8 text-sm"
            />
          </div>
        ) : (
          <div className="space-y-1">
            <Label className="text-xs text-muted-foreground">Modifier</Label>
            <Input
              value={values[`${prefix}.modifier`] || ''}
              onChange={(e) => onValueChange(`${prefix}.modifier`, e.target.value)}
              disabled={disabled}
              className="h-8 text-sm"
            />
          </div>
        )}
        
        {!showTriggeredBy ? (
          <div className="space-y-1">
            <Label className="text-xs text-muted-foreground">Percentage of Payment</Label>
            <Input
              value={values[`${prefix}.percentage_of_payment`] || ''}
              onChange={(e) => onValueChange(`${prefix}.percentage_of_payment`, e.target.value)}
              disabled={disabled}
              className="h-8 text-sm"
            />
          </div>
        ) : (
          <div className="space-y-1">
            <Label className="text-xs text-muted-foreground">Active Until</Label>
            <Input
              type="date"
              value={values[`${prefix}.active_until`] || ''}
              onChange={(e) => onValueChange(`${prefix}.active_until`, e.target.value)}
              disabled={disabled}
              className="h-8 text-sm"
            />
          </div>
        )}
        
        <div className="space-y-1">
          <Label className="text-xs text-muted-foreground">Additional Daily Charge</Label>
          <Input
            value={values[`${prefix}.additional_daily_charge`] || ''}
            onChange={(e) => onValueChange(`${prefix}.additional_daily_charge`, e.target.value)}
            disabled={disabled}
            className="h-8 text-sm"
          />
        </div>
      </div>
      
      <DistributionFields
        prefix={prefix}
        values={values}
        onValueChange={onValueChange}
        disabled={disabled}
      />
    </div>
  );
};

// Triggered By Section
const TriggeredBySection: React.FC<{
  values: Record<string, string>;
  onValueChange: (fieldKey: string, value: string) => void;
  disabled?: boolean;
}> = ({ values, onValueChange, disabled }) => {
  const triggeredBy = values['loan_terms.penalties.triggered_by'] || 'late_payment_only';

  return (
    <div className="space-y-4 p-4 border border-border rounded-lg bg-card">
      <h3 className="text-sm font-semibold text-foreground border-b pb-2">Triggered By</h3>
      
      <RadioGroup
        value={triggeredBy}
        onValueChange={(value) => onValueChange('loan_terms.penalties.triggered_by', value)}
        disabled={disabled}
        className="space-y-2"
      >
        <div className="flex items-center space-x-2">
          <RadioGroupItem value="late_payment_only" id="late_payment_only" />
          <Label htmlFor="late_payment_only" className="text-sm">Late Payment Only</Label>
        </div>
        <div className="flex items-center space-x-2">
          <RadioGroupItem value="late_payment_maturity" id="late_payment_maturity" />
          <Label htmlFor="late_payment_maturity" className="text-sm">Late Payment & Maturity</Label>
        </div>
        <div className="flex items-center space-x-2">
          <RadioGroupItem value="maturity_only" id="maturity_only" />
          <Label htmlFor="maturity_only" className="text-sm">Maturity Only</Label>
        </div>
      </RadioGroup>
    </div>
  );
};

// Interest Guarantee Section
const InterestGuaranteeSection: React.FC<{
  values: Record<string, string>;
  onValueChange: (fieldKey: string, value: string) => void;
  disabled?: boolean;
}> = ({ values, onValueChange, disabled }) => {
  const isEnabled = values['loan_terms.penalties.interest_guarantee.enabled'] === 'true';

  return (
    <div className="space-y-4 p-4 border border-border rounded-lg bg-card">
      <div className="flex items-center gap-3 border-b pb-2">
        <h3 className="text-sm font-semibold text-foreground">Interest Guarantee</h3>
        <Checkbox
          checked={isEnabled}
          onCheckedChange={(checked) => 
            onValueChange('loan_terms.penalties.interest_guarantee.enabled', checked ? 'true' : 'false')
          }
          disabled={disabled}
        />
      </div>
      
      {isEnabled && (
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label className="text-xs text-muted-foreground">Months</Label>
              <Input
                value={values['loan_terms.penalties.interest_guarantee.months'] || ''}
                onChange={(e) => onValueChange('loan_terms.penalties.interest_guarantee.months', e.target.value)}
                disabled={disabled}
                className="h-8 text-sm"
              />
            </div>
            <div className="space-y-1">
              <Label className="text-xs text-muted-foreground">Include Odd Days Interest</Label>
              <div className="flex items-center h-8">
                <Checkbox
                  checked={values['loan_terms.penalties.interest_guarantee.include_odd_days'] === 'true'}
                  onCheckedChange={(checked) => 
                    onValueChange('loan_terms.penalties.interest_guarantee.include_odd_days', checked ? 'true' : 'false')
                  }
                  disabled={disabled}
                />
              </div>
            </div>
            <div className="space-y-1">
              <Label className="text-xs text-muted-foreground">Amount</Label>
              <Input
                value={values['loan_terms.penalties.interest_guarantee.amount'] || ''}
                onChange={(e) => onValueChange('loan_terms.penalties.interest_guarantee.amount', e.target.value)}
                disabled={disabled}
                className="h-8 text-sm"
              />
            </div>
          </div>
          
          <DistributionFields
            prefix="loan_terms.penalties.interest_guarantee"
            values={values}
            onValueChange={onValueChange}
            disabled={disabled}
          />
        </div>
      )}
    </div>
  );
};

// Prepayment Penalty Section
const PrepaymentPenaltySection: React.FC<{
  values: Record<string, string>;
  onValueChange: (fieldKey: string, value: string) => void;
  disabled?: boolean;
}> = ({ values, onValueChange, disabled }) => {
  const penaltyType = values['loan_terms.penalties.prepayment.type'] || 'none';

  return (
    <div className="space-y-4 p-4 border border-border rounded-lg bg-card">
      <div className="flex items-center gap-3 border-b pb-2">
        <h3 className="text-sm font-semibold text-foreground">Pre-payment Penalty</h3>
        <Checkbox
          checked={penaltyType !== 'none'}
          onCheckedChange={(checked) => 
            onValueChange('loan_terms.penalties.prepayment.type', checked ? 'any_payments' : 'none')
          }
          disabled={disabled}
        />
      </div>
      
      <RadioGroup
        value={penaltyType}
        onValueChange={(value) => onValueChange('loan_terms.penalties.prepayment.type', value)}
        disabled={disabled}
        className="space-y-3"
      >
        <div className="flex items-center space-x-2">
          <RadioGroupItem value="none" id="prepay_none" />
          <Label htmlFor="prepay_none" className="text-sm">No Prepayment Penalty</Label>
        </div>
        
        <div className="space-y-2">
          <div className="flex items-center space-x-2">
            <RadioGroupItem value="any_payments" id="prepay_any" />
            <Label htmlFor="prepay_any" className="text-sm">Any payments of principal in any calendar year in excess of</Label>
          </div>
          
          {penaltyType === 'any_payments' && (
            <div className="ml-6 space-y-3">
              <div className="flex items-center gap-2 flex-wrap">
                <Input
                  value={values['loan_terms.penalties.prepayment.excess_amount'] || ''}
                  onChange={(e) => onValueChange('loan_terms.penalties.prepayment.excess_amount', e.target.value)}
                  disabled={disabled}
                  className="h-8 text-sm w-24"
                  placeholder="%"
                />
                <span className="text-sm text-muted-foreground">of the</span>
                <Select
                  value={values['loan_terms.penalties.prepayment.balance_type'] || 'original_balance'}
                  onValueChange={(value) => onValueChange('loan_terms.penalties.prepayment.balance_type', value)}
                  disabled={disabled}
                >
                  <SelectTrigger className="h-8 w-36">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="original_balance">Original Balance</SelectItem>
                    <SelectItem value="unpaid_balance">Unpaid Balance</SelectItem>
                  </SelectContent>
                </Select>
                <span className="text-sm text-muted-foreground">will include a penalty not to exceed</span>
                <Input
                  value={values['loan_terms.penalties.prepayment.penalty_max'] || ''}
                  onChange={(e) => onValueChange('loan_terms.penalties.prepayment.penalty_max', e.target.value)}
                  disabled={disabled}
                  className="h-8 text-sm w-24"
                />
              </div>
              
              <div className="flex items-center gap-2 flex-wrap">
                <Input
                  value={values['loan_terms.penalties.prepayment.months_advance'] || ''}
                  onChange={(e) => onValueChange('loan_terms.penalties.prepayment.months_advance', e.target.value)}
                  disabled={disabled}
                  className="h-8 text-sm w-16"
                />
                <span className="text-sm text-muted-foreground">months advance interest on the</span>
                <Select
                  value={values['loan_terms.penalties.prepayment.advance_balance_type'] || 'unpaid_balance'}
                  onValueChange={(value) => onValueChange('loan_terms.penalties.prepayment.advance_balance_type', value)}
                  disabled={disabled}
                >
                  <SelectTrigger className="h-8 w-36">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="original_balance">Original Balance</SelectItem>
                    <SelectItem value="unpaid_balance">Unpaid Balance</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <p className="text-xs text-muted-foreground">
                at the note rate, but not more than the interest that would be charged if the loan were paid to maturity.
              </p>
            </div>
          )}
        </div>
        
        <div className="flex items-center space-x-2">
          <RadioGroupItem value="other" id="prepay_other" />
          <Label htmlFor="prepay_other" className="text-sm">Other</Label>
          {penaltyType === 'other' && (
            <Input
              value={values['loan_terms.penalties.prepayment.other_description'] || ''}
              onChange={(e) => onValueChange('loan_terms.penalties.prepayment.other_description', e.target.value)}
              disabled={disabled}
              className="h-8 text-sm flex-1 ml-2"
              placeholder="None"
            />
          )}
        </div>
      </RadioGroup>
      
      {/* Prepayment Penalty Expires - inside this section as required */}
      <div className="pt-3 border-t border-border">
        <div className="space-y-1">
          <Label className="text-xs text-muted-foreground">Prepayment Penalty Expires</Label>
          <Input
            type="date"
            value={values['loan_terms.penalties.prepayment.expires'] || ''}
            onChange={(e) => onValueChange('loan_terms.penalties.prepayment.expires', e.target.value)}
            disabled={disabled}
            className="h-8 text-sm w-48"
          />
        </div>
      </div>
      
      {/* Distribution section renamed as required */}
      <div className="pt-3 border-t border-border">
        <DistributionFields
          prefix="loan_terms.penalties.prepayment"
          values={values}
          onValueChange={onValueChange}
          disabled={disabled}
        />
      </div>
    </div>
  );
};

// Maturity Penalty Section
const MaturityPenaltySection: React.FC<{
  values: Record<string, string>;
  onValueChange: (fieldKey: string, value: string) => void;
  disabled?: boolean;
}> = ({ values, onValueChange, disabled }) => {
  const isEnabled = values['loan_terms.penalties.maturity.enabled'] === 'true';

  return (
    <div className="space-y-4 p-4 border border-border rounded-lg bg-card">
      <div className="flex items-center gap-3 border-b pb-2">
        <h3 className="text-sm font-semibold text-foreground">Maturity</h3>
        <Checkbox
          checked={isEnabled}
          onCheckedChange={(checked) => 
            onValueChange('loan_terms.penalties.maturity.enabled', checked ? 'true' : 'false')
          }
          disabled={disabled}
        />
      </div>
      
      {isEnabled && (
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label className="text-xs text-muted-foreground">Grace Period (Days)</Label>
              <Input
                value={values['loan_terms.penalties.maturity.grace_period_days'] || ''}
                onChange={(e) => onValueChange('loan_terms.penalties.maturity.grace_period_days', e.target.value)}
                disabled={disabled}
                className="h-8 text-sm"
              />
            </div>
            <div className="space-y-1">
              <Label className="text-xs text-muted-foreground">Standard 10% of Payment Only</Label>
              <div className="flex items-center h-8">
                <Checkbox
                  checked={values['loan_terms.penalties.maturity.standard_10_percent'] === 'true'}
                  onCheckedChange={(checked) => 
                    onValueChange('loan_terms.penalties.maturity.standard_10_percent', checked ? 'true' : 'false')
                  }
                  disabled={disabled}
                />
              </div>
            </div>
            <div className="space-y-1">
              <Label className="text-xs text-muted-foreground">Additional Flat Fee</Label>
              <Input
                value={values['loan_terms.penalties.maturity.additional_flat_fee'] || ''}
                onChange={(e) => onValueChange('loan_terms.penalties.maturity.additional_flat_fee', e.target.value)}
                disabled={disabled}
                className="h-8 text-sm"
              />
            </div>
          </div>
          
          <DistributionFields
            prefix="loan_terms.penalties.maturity"
            values={values}
            onValueChange={onValueChange}
            disabled={disabled}
          />
        </div>
      )}
    </div>
  );
};

export const LoanTermsPenaltiesForm: React.FC<LoanTermsPenaltiesFormProps> = ({
  fields,
  values,
  onValueChange,
  showValidation = false,
  disabled = false,
  calculationResults = {},
}) => {
  return (
    <div className="p-6 space-y-6">
      {/* Late Charge / Default Charge Configuration - 4 columns */}
      <div>
        <h2 className="text-base font-semibold text-foreground mb-4">Late Charge / Default Charge Configuration</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
          <LateChargeColumn
            title=""
            prefix="loan_terms.penalties.late_charge_1"
            values={values}
            onValueChange={onValueChange}
            disabled={disabled}
          />
          <LateChargeColumn
            title=""
            prefix="loan_terms.penalties.late_charge_2"
            values={values}
            onValueChange={onValueChange}
            disabled={disabled}
          />
          <LateChargeColumn
            title=""
            prefix="loan_terms.penalties.late_charge_3"
            values={values}
            onValueChange={onValueChange}
            disabled={disabled}
            showTriggeredBy
          />
          <TriggeredBySection
            values={values}
            onValueChange={onValueChange}
            disabled={disabled}
          />
        </div>
      </div>
      
      {/* Bottom Section - 3 columns */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <InterestGuaranteeSection
          values={values}
          onValueChange={onValueChange}
          disabled={disabled}
        />
        <PrepaymentPenaltySection
          values={values}
          onValueChange={onValueChange}
          disabled={disabled}
        />
        <MaturityPenaltySection
          values={values}
          onValueChange={onValueChange}
          disabled={disabled}
        />
      </div>
    </div>
  );
};

export default LoanTermsPenaltiesForm;
