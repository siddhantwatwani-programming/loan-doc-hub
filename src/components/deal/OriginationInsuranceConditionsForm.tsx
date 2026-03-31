import React from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Textarea } from '@/components/ui/textarea';
import { DirtyFieldWrapper } from './DirtyFieldWrapper';
import { numericKeyDown, numericPaste, integerKeyDown, integerPaste } from '@/lib/numericInputFilter';
import type { CalculationResult } from '@/lib/calculationEngine';

interface OriginationInsuranceConditionsFormProps {
  values: Record<string, string>;
  onValueChange: (fieldKey: string, value: string) => void;
  showValidation?: boolean;
  disabled?: boolean;
  calculationResults?: Record<string, CalculationResult>;
}

const FK = {
  // Insurance section
  carrier_a_minus: 'origination_ins.carrier_rating_a_minus',
  carrier_a: 'origination_ins.carrier_rating_a',
  carrier_a_plus: 'origination_ins.carrier_rating_a_plus',
  carrier_other: 'origination_ins.carrier_rating_other',
  carrier_other_text: 'origination_ins.carrier_rating_other_text',
  lender_control_proceeds: 'origination_ins.lender_control_proceeds',
  max_deductible: 'origination_ins.max_deductible',
  additional_insured_liability: 'origination_ins.additional_insured_liability',
  additional_insured_builders_risk: 'origination_ins.additional_insured_builders_risk',
  mortgagee: 'origination_ins.mortgagee',
  mortgage_clause: 'origination_ins.mortgage_clause',

  // Policy Types
  policy_property_hazard: 'origination_ins.policy_property_hazard',
  policy_dwelling_fire: 'origination_ins.policy_dwelling_fire',
  policy_builders_risk: 'origination_ins.policy_builders_risk',
  policy_general_liability: 'origination_ins.policy_general_liability',
  policy_flood: 'origination_ins.policy_flood',
  policy_earthquake: 'origination_ins.policy_earthquake',
  policy_wind_hail: 'origination_ins.policy_wind_hail',
  policy_umbrella: 'origination_ins.policy_umbrella',
  policy_loss_of_rents: 'origination_ins.policy_loss_of_rents',
  policy_vacancy: 'origination_ins.policy_vacancy',
  policy_construction_amount: 'origination_ins.policy_construction_amount',

  // Coverage Limits
  coverage_loan_amount: 'origination_ins.coverage_loan_amount',
  coverage_replacement_cost: 'origination_ins.coverage_replacement_cost',
  coverage_specific_dollar: 'origination_ins.coverage_specific_dollar',
  coverage_specific_dollar_amount: 'origination_ins.coverage_specific_dollar_amount',
  coverage_flood_building: 'origination_ins.coverage_flood_building',
  coverage_flood_contents: 'origination_ins.coverage_flood_contents',
  coverage_earthquake_amount: 'origination_ins.coverage_earthquake_amount',
  coverage_earthquake_percent: 'origination_ins.coverage_earthquake_percent',
  coverage_loss_rents_per_month: 'origination_ins.coverage_loss_rents_per_month',
  coverage_loss_rents_months: 'origination_ins.coverage_loss_rents_months',
  coverage_loss_rents_total: 'origination_ins.coverage_loss_rents_total',
};

export const OriginationInsuranceConditionsForm: React.FC<OriginationInsuranceConditionsFormProps> = ({
  values,
  onValueChange,
  disabled = false,
}) => {
  const v = (key: string) => values[key] || '';
  const sv = (key: string, val: string) => onValueChange(key, val);
  const bv = (key: string) => values[key] === 'true';
  const sbv = (key: string, val: boolean) => onValueChange(key, String(val));

  const renderCheckbox = (label: string, key: string) => (
    <DirtyFieldWrapper fieldKey={key}>
      <div className="flex items-center gap-2">
        <Checkbox checked={bv(key)} onCheckedChange={(c) => sbv(key, !!c)} disabled={disabled} />
        <Label className="text-sm cursor-pointer">{label}</Label>
      </div>
    </DirtyFieldWrapper>
  );

  const renderCurrencyInline = (key: string, placeholder?: string) => (
    <div className="relative inline-flex w-[120px]">
      <span className="absolute left-2 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">$</span>
      <Input
        type="text" inputMode="decimal" value={v(key)} onChange={(e) => sv(key, e.target.value)}
        onKeyDown={numericKeyDown} onPaste={(e) => numericPaste(e, (val) => sv(key, val))}
        disabled={disabled} placeholder={placeholder || '0.00'} className="h-7 text-sm pl-6 text-right"
      />
      />
    </div>
  );

  return (
    <div className="p-4 space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-x-8 gap-y-6">
        {/* Column 1: Insurance */}
        <div className="space-y-3">
          <h3 className="text-sm font-semibold text-foreground border-b border-border pb-1">Insurance</h3>
          <div>
            <Label className="text-sm">Minimum Carrier Rating:</Label>
            <div className="flex items-center gap-4 mt-1 flex-wrap">
              {renderCheckbox('A-', FK.carrier_a_minus)}
              {renderCheckbox('A', FK.carrier_a)}
              {renderCheckbox('A+', FK.carrier_a_plus)}
              <DirtyFieldWrapper fieldKey={FK.carrier_other}>
                <div className="flex items-center gap-2">
                  <Checkbox checked={bv(FK.carrier_other)} onCheckedChange={(c) => sbv(FK.carrier_other, !!c)} disabled={disabled} />
                  <Label className="text-sm">Other:</Label>
                  <Input value={v(FK.carrier_other_text)} onChange={(e) => sv(FK.carrier_other_text, e.target.value)}
                    disabled={disabled} className="h-7 text-sm w-[100px]" />
                </div>
              </DirtyFieldWrapper>
            </div>
          </div>
          <div className="space-y-2 pt-1">
            {renderCheckbox('Lender to control insurance proceeds', FK.lender_control_proceeds)}
            <DirtyFieldWrapper fieldKey={FK.max_deductible}>
              <div className="flex items-center gap-2">
                <Label className="text-sm shrink-0">Max Allowable Deductible:</Label>
                {renderCurrencyInline(FK.max_deductible)}
              </div>
            </DirtyFieldWrapper>
            {renderCheckbox('Additional Insured on Liability Policy', FK.additional_insured_liability)}
            {renderCheckbox("Additional Insured on Builder's Risk", FK.additional_insured_builders_risk)}
            {renderCheckbox('Mortgagee', FK.mortgagee)}
          </div>
          <DirtyFieldWrapper fieldKey={FK.mortgage_clause}>
            <div className="pt-1">
              <Label className="text-sm">Mortgage Clause</Label>
              <Textarea value={v(FK.mortgage_clause)} onChange={(e) => sv(FK.mortgage_clause, e.target.value)}
                disabled={disabled} className="mt-1 text-sm min-h-[60px]" />
            </div>
          </DirtyFieldWrapper>
        </div>

        {/* Column 2: Policy Types / Endorsements */}
        <div className="space-y-3">
          <h3 className="text-sm font-semibold text-foreground border-b border-border pb-1">Policy Types / Endorsements</h3>
          <div className="space-y-2">
            {renderCheckbox('Property (Hazard) / Homeowners', FK.policy_property_hazard)}
            {renderCheckbox('Dwelling Fire / Landlord Policy', FK.policy_dwelling_fire)}
            {renderCheckbox("Builder's Risk Construction, Rehab, Ground-up", FK.policy_builders_risk)}
            {renderCheckbox('General Liability', FK.policy_general_liability)}
            {renderCheckbox('Flood', FK.policy_flood)}
            {renderCheckbox('Earthquake', FK.policy_earthquake)}
            {renderCheckbox('Wind/Hail Named Storm', FK.policy_wind_hail)}
            {renderCheckbox('Umbrella / Excess Liability', FK.policy_umbrella)}
            {renderCheckbox('Loss of Rents / Business Income', FK.policy_loss_of_rents)}
            {renderCheckbox('Vacancy Endorsement', FK.policy_vacancy)}
            <DirtyFieldWrapper fieldKey="origination_ins.coverage_construction_checkbox">
              <div className="flex items-center gap-2 pt-1">
                <Checkbox checked={bv('origination_ins.coverage_construction_checkbox')} onCheckedChange={(c) => sbv('origination_ins.coverage_construction_checkbox', !!c)} disabled={disabled} />
                <Label className="text-sm shrink-0">Course-of-Construction Coverage Amount:</Label>
                {renderCurrencyInline(FK.policy_construction_amount)}
              </div>
            </DirtyFieldWrapper>
          </div>
        </div>

        {/* Column 3: Coverage Limits */}
        <div className="space-y-3">
          <h3 className="text-sm font-semibold text-foreground border-b border-border pb-1">Coverage Limits</h3>
          <div className="space-y-2">
            {renderCheckbox('At least the loan amount', FK.coverage_loan_amount)}
            {renderCheckbox('Replacement cost estimate (from insurer)', FK.coverage_replacement_cost)}
            <DirtyFieldWrapper fieldKey={FK.coverage_specific_dollar}>
              <div className="flex items-center gap-2">
                {renderCheckbox('A specific dollar amount:', FK.coverage_specific_dollar)}
                {renderCurrencyInline(FK.coverage_specific_dollar_amount)}
              </div>
            </DirtyFieldWrapper>
            <DirtyFieldWrapper fieldKey="origination_ins.coverage_flood_checkbox">
              <div className="flex items-center gap-2 flex-wrap">
                <Checkbox checked={bv('origination_ins.coverage_flood_checkbox')} onCheckedChange={(c) => sbv('origination_ins.coverage_flood_checkbox', !!c)} disabled={disabled} />
                <Label className="text-sm shrink-0">Flood: Building</Label>
                {renderCurrencyInline(FK.coverage_flood_building)}
                <Label className="text-sm shrink-0">/ Contents</Label>
                {renderCurrencyInline(FK.coverage_flood_contents)}
              </div>
            </DirtyFieldWrapper>
            <DirtyFieldWrapper fieldKey="origination_ins.coverage_earthquake_checkbox">
              <div className="flex items-center gap-2 flex-wrap">
                <Checkbox checked={bv('origination_ins.coverage_earthquake_checkbox')} onCheckedChange={(c) => sbv('origination_ins.coverage_earthquake_checkbox', !!c)} disabled={disabled} />
                <Label className="text-sm shrink-0">Earthquake:</Label>
                {renderCurrencyInline(FK.coverage_earthquake_amount)}
                <Label className="text-sm shrink-0">or</Label>
                <Input value={v(FK.coverage_earthquake_percent)} onChange={(e) => sv(FK.coverage_earthquake_percent, e.target.value)}
                  onKeyDown={integerKeyDown} onPaste={(e) => integerPaste(e, (val) => sv(FK.coverage_earthquake_percent, val))}
                  disabled={disabled} placeholder="0" inputMode="numeric" className="h-7 text-sm w-[60px] text-right" />
                <Label className="text-sm shrink-0">% of value</Label>
              </div>
            </DirtyFieldWrapper>
            <DirtyFieldWrapper fieldKey="origination_ins.coverage_loss_rents_checkbox">
              <div className="flex items-center gap-2 flex-wrap">
                <Checkbox checked={bv('origination_ins.coverage_loss_rents_checkbox')} onCheckedChange={(c) => sbv('origination_ins.coverage_loss_rents_checkbox', !!c)} disabled={disabled} />
                <Label className="text-sm shrink-0">Loss of Rents:</Label>
                {renderCurrencyInline(FK.coverage_loss_rents_per_month)}
                <Label className="text-sm shrink-0">per month for</Label>
                <Input value={v(FK.coverage_loss_rents_months)} onChange={(e) => sv(FK.coverage_loss_rents_months, e.target.value)}
                  onKeyDown={integerKeyDown} onPaste={(e) => integerPaste(e, (val) => sv(FK.coverage_loss_rents_months, val))}
                  disabled={disabled} placeholder="0" inputMode="numeric" className="h-7 text-sm w-[50px] text-right" />
                <Label className="text-sm shrink-0">months or</Label>
                {renderCurrencyInline(FK.coverage_loss_rents_total)}
                <Label className="text-sm shrink-0">total</Label>
              </div>
            </DirtyFieldWrapper>
          </div>
        </div>
      </div>
    </div>
  );
};

export default OriginationInsuranceConditionsForm;
