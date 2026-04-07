import React, { useEffect, useState } from 'react';
import { Input } from '@/components/ui/input';
import { PhoneInput } from '@/components/ui/phone-input';
import { EmailInput } from '@/components/ui/email-input';
import { ZipInput } from '@/components/ui/zip-input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { ChevronDown } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { AddFundingModal, FundingFormData } from './AddFundingModal';
import type { FieldDefinition } from '@/hooks/useDealFields';
import type { CalculationResult } from '@/lib/calculationEngine';
import { DirtyFieldWrapper } from './DirtyFieldWrapper';
import { US_STATES } from '@/lib/usStates';
import {
  numericKeyDown,
  numericPaste,
  formatCurrencyDisplay,
  unformatCurrencyDisplay,
  formatPercentageDisplay,
  unformatPercentageDisplay,
} from '@/lib/numericInputFilter';

const SERVICING_AGENT_OPTIONS = ['Company', 'Other Servicer', 'Lender', 'Broker'];

const AGENT_FK = {
  servicing_agent: 'origination_svc.servicing_agent',
  tp_name: 'origination_svc.third_party.name',
  tp_street: 'origination_svc.third_party.street',
  tp_city: 'origination_svc.third_party.city',
  tp_state: 'origination_svc.third_party.state',
  tp_zip: 'origination_svc.third_party.zip',
  tp_phone: 'origination_svc.third_party.phone',
  tp_email: 'origination_svc.third_party.email',
  sp_same_as_tp: 'origination_svc.send_payments.same_as_third_party',
  sp_name: 'origination_svc.send_payments.name',
  sp_street: 'origination_svc.send_payments.street',
  sp_city: 'origination_svc.send_payments.city',
  sp_state: 'origination_svc.send_payments.state',
  sp_zip: 'origination_svc.send_payments.zip',
  sp_phone: 'origination_svc.send_payments.phone',
  sp_email: 'origination_svc.send_payments.email',
};

// Source field keys for auto-populate by agent type
const COMPANY_SOURCE_KEYS = {
  name: 'loan_terms.details_company',
  street: '',
  city: '',
  state: '',
  zip: '',
  phone: '',
  email: '',
};

const BROKER_SOURCE_KEYS = {
  name: 'broker.company',
  street: 'broker.address.street',
  city: 'broker.address.city',
  state: 'broker.address.state',
  zip: 'broker.address.zip',
  phone: 'broker.phone.work',
  email: 'broker.email',
};

const LENDER_SOURCE_KEYS = {
  name: 'lender.full_name',
  street: 'lender.primary_address.street',
  city: 'lender.primary_address.city',
  state: 'lender.primary_address.state',
  zip: 'lender.primary_address.zip',
  phone: 'lender.phone.work',
  email: 'lender.email',
};

interface LoanTermsServicingFormProps {
  fields: FieldDefinition[];
  values: Record<string, string>;
  onValueChange: (fieldKey: string, value: string) => void;
  showValidation?: boolean;
  disabled?: boolean;
  calculationResults?: Record<string, CalculationResult>;
  dealId?: string;
}

const SERVICE_ROWS = [
  { key: 'standard_servicing', label: 'Standard Servicing', isHeader: false },
  { key: 'high_touch', label: 'High Touch', isHeader: false },
  { key: 'default', label: 'Default', isHeader: false, isLink: true },
  { key: 'minimum_fee', label: 'Minimum Fee', isHeader: false },
  { key: 'minimum_per_lender', label: 'Minimum Per Lender', isHeader: false },
  { key: 'spacer_1', label: '', isHeader: false, isSpacer: true },
  { key: 'calfirpta', label: 'CALFIRPTA', isHeader: false },
  { key: 'escrow_impound', label: 'Escrow Impound', isHeader: false },
  { key: 'insurance_tracking', label: 'Insurance Tracking', isHeader: false },
  { key: 'tax_tracking', label: 'Tax Tracking', isHeader: false },
  { key: 'senior_lien_tracking', label: 'Senior Lien tracking', isHeader: false },
  { key: 'additional_disbursements', label: 'Additional Disbursements', isHeader: false },
  { key: 'document_storage', label: 'Document Storage', isHeader: false },
  { key: 'mail', label: 'Mail', isHeader: false },
  { key: 'reserve_pass_through', label: 'Reserve Pass: Through', isHeader: false },
  { key: 'reserve_hold_and_pay', label: 'Reserve: Hold and Pay', isHeader: false },
  { key: 'late_notice', label: 'Late Notice', isHeader: false },
  { key: 'buyer_notice', label: 'Buyer Notice', isHeader: false },
  { key: 'seller_notice', label: 'Seller Notice', isHeader: false },
  { key: 'third_party_notice', label: '3rd Party Notice', isHeader: false },
];

const GRID_COLUMNS = [
  { key: 'cost', label: 'Cost' },
  { key: 'lender_percent', label: 'Lender(s) %' },
  { key: 'lenders_split', label: 'Lenders Split' },
  { key: 'borrower_amount', label: 'Borrower $' },
  { key: 'borrower_percent', label: 'Borrower %' },
  { key: 'broker', label: 'Broker' },
];

const CURRENCY_COLS = new Set(['cost', 'borrower_amount']);
const PERCENT_COLS = new Set(['lender_percent', 'borrower_percent']);

const ServicingInput: React.FC<{
  colKey: string;
  fieldKey: string;
  value: string;
  onValueChange: (fieldKey: string, value: string) => void;
  disabled: boolean;
}> = ({ colKey, fieldKey, value, onValueChange, disabled }) => {
  const isCurrency = CURRENCY_COLS.has(colKey);
  const isPercent = PERCENT_COLS.has(colKey);
  const [focused, setFocused] = React.useState(false);

  const displayValue = React.useMemo(() => {
    if (focused) return value;
    if (isCurrency) return formatCurrencyDisplay(value);
    if (isPercent) return formatPercentageDisplay(value);
    return value;
  }, [value, focused, isCurrency, isPercent]);

  const handleFocus = () => {
    setFocused(true);
    if (isCurrency) {
      onValueChange(fieldKey, unformatCurrencyDisplay(value));
    } else if (isPercent) {
      onValueChange(fieldKey, unformatPercentageDisplay(value));
    }
  };

  const handleBlur = () => {
    setFocused(false);
    if (isCurrency && value) {
      onValueChange(fieldKey, formatCurrencyDisplay(value));
    } else if (isPercent && value) {
      onValueChange(fieldKey, formatPercentageDisplay(value));
    }
  };

  const showDollar = isCurrency && !!displayValue;
  const showPercent = isPercent && !!displayValue && !focused;

  return (
    <div className="relative">
      {showDollar && (
        <span className="absolute left-1.5 top-1/2 -translate-y-1/2 text-xs text-muted-foreground pointer-events-none z-10">$</span>
      )}
      <Input
        value={displayValue}
        onChange={(e) => onValueChange(fieldKey, e.target.value)}
        onFocus={handleFocus}
        onBlur={handleBlur}
        {...(colKey !== 'broker' ? {
          onKeyDown: numericKeyDown,
          onPaste: (e: React.ClipboardEvent<HTMLInputElement>) => numericPaste(e, (v) => onValueChange(fieldKey, v)),
          inputMode: 'decimal' as const,
        } : {})}
        disabled={disabled}
        className={`h-7 text-xs border-border ${isCurrency || isPercent ? 'text-right' : ''} ${showDollar ? 'pl-4' : ''} ${isPercent ? 'pr-5' : ''}`}
      />
      {showPercent && (
        <span className="absolute right-1.5 top-1/2 -translate-y-1/2 text-xs text-muted-foreground pointer-events-none z-10">%</span>
      )}
    </div>
  );
};

export const LoanTermsServicingForm: React.FC<LoanTermsServicingFormProps> = ({
  fields,
  values,
  onValueChange,
  showValidation = false,
  disabled = false,
  calculationResults = {},
}) => {
  const v = (key: string) => values[key] || '';
  const sv = (key: string, val: string) => onValueChange(key, val);
  const bv = (key: string) => values[key] === 'true';
  const sbv = (key: string, val: boolean) => onValueChange(key, String(val));

  const agentValue = v(AGENT_FK.servicing_agent);
  const sameAsTP = bv(AGENT_FK.sp_same_as_tp);

  // Auto-populate 3rd party address when agent changes to Company/Broker/Lender
  useEffect(() => {
    if (!agentValue) return;
    let sourceKeys: Record<string, string> | null = null;
    if (agentValue === 'Company') sourceKeys = COMPANY_SOURCE_KEYS;
    else if (agentValue === 'Broker') sourceKeys = BROKER_SOURCE_KEYS;
    else if (agentValue === 'Lender') sourceKeys = LENDER_SOURCE_KEYS;

    if (sourceKeys) {
      const mappings: [string, string][] = [
        [sourceKeys.name, AGENT_FK.tp_name],
        [sourceKeys.street, AGENT_FK.tp_street],
        [sourceKeys.city, AGENT_FK.tp_city],
        [sourceKeys.state, AGENT_FK.tp_state],
        [sourceKeys.zip, AGENT_FK.tp_zip],
        [sourceKeys.phone, AGENT_FK.tp_phone],
        [sourceKeys.email, AGENT_FK.tp_email],
      ];
      mappings.forEach(([src, dst]) => {
        const srcVal = src ? (values[src] || '') : '';
        sv(dst, srcVal);
      });
    }
  }, [agentValue]);

  // Auto-copy 3rd party values when "Same as 3rd Party" is checked
  useEffect(() => {
    if (sameAsTP) {
      const mappings: [string, string][] = [
        [AGENT_FK.tp_name, AGENT_FK.sp_name], [AGENT_FK.tp_street, AGENT_FK.sp_street],
        [AGENT_FK.tp_city, AGENT_FK.sp_city], [AGENT_FK.tp_state, AGENT_FK.sp_state],
        [AGENT_FK.tp_zip, AGENT_FK.sp_zip], [AGENT_FK.tp_phone, AGENT_FK.sp_phone],
        [AGENT_FK.tp_email, AGENT_FK.sp_email],
      ];
      mappings.forEach(([src, dst]) => {
        if (v(src) !== v(dst)) sv(dst, v(src));
      });
    }
  }, [sameAsTP, values[AGENT_FK.tp_name], values[AGENT_FK.tp_street], values[AGENT_FK.tp_city], values[AGENT_FK.tp_state], values[AGENT_FK.tp_zip], values[AGENT_FK.tp_phone], values[AGENT_FK.tp_email]]);

  const renderTextField = (label: string, key: string, extraDisabled = false) => (
    <DirtyFieldWrapper fieldKey={key}>
      <div className="flex items-center gap-2">
        <Label className="w-[80px] text-sm shrink-0">{label}</Label>
        <Input value={v(key)} onChange={(e) => sv(key, e.target.value)} disabled={disabled || extraDisabled} className="h-7 text-sm" />
      </div>
    </DirtyFieldWrapper>
  );

  const renderAddressBlock = (keys: { name: string; street: string; city: string; state: string; zip: string; phone: string; email: string }, extraDisabled = false) => (
    <div className="space-y-2">
      {renderTextField('Name', keys.name, extraDisabled)}
      {renderTextField('Street', keys.street, extraDisabled)}
      {renderTextField('City', keys.city, extraDisabled)}
      <DirtyFieldWrapper fieldKey={keys.state}>
        <div className="flex items-center gap-2">
          <Label className="w-[80px] text-sm shrink-0">State</Label>
          <Select value={v(keys.state)} onValueChange={(val) => sv(keys.state, val)} disabled={disabled || extraDisabled}>
            <SelectTrigger className="h-7 text-sm">
              <SelectValue placeholder="Select..." />
            </SelectTrigger>
            <SelectContent className="bg-popover z-50">
              {US_STATES.map((st) => (
                <SelectItem key={st} value={st}>{st}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </DirtyFieldWrapper>
      <DirtyFieldWrapper fieldKey={keys.zip}>
        <div className="flex items-center gap-2">
          <Label className="w-[80px] text-sm shrink-0">ZIP</Label>
          <ZipInput value={v(keys.zip)} onValueChange={(val) => sv(keys.zip, val)} disabled={disabled || extraDisabled} className="h-7 text-sm" />
        </div>
      </DirtyFieldWrapper>
      <DirtyFieldWrapper fieldKey={keys.phone}>
        <div className="flex items-center gap-2">
          <Label className="w-[80px] text-sm shrink-0">Phone</Label>
          <PhoneInput value={v(keys.phone)} onValueChange={(val) => sv(keys.phone, val)} disabled={disabled || extraDisabled} className="h-7 text-sm" />
        </div>
      </DirtyFieldWrapper>
      <DirtyFieldWrapper fieldKey={keys.email}>
        <div className="flex items-center gap-2">
          <Label className="w-[80px] text-sm shrink-0">Email</Label>
          <EmailInput value={v(keys.email)} onValueChange={(val) => sv(keys.email, val)} disabled={disabled || extraDisabled} className="h-7 text-sm" />
        </div>
      </DirtyFieldWrapper>
    </div>
  );

  const getFieldKey = (rowKey: string, colKey: string) => 
    `loan_terms.servicing.${rowKey}.${colKey}`;

  return (
    <div className="p-6 space-y-6">
      {/* Servicing Agent Section */}
      <div className="space-y-3">
        <h3 className="text-sm font-semibold text-foreground border-b border-border pb-1">Servicing Agent</h3>
        <DirtyFieldWrapper fieldKey={AGENT_FK.servicing_agent}>
          <div className="flex items-center gap-2 max-w-xs">
            <Label className="w-[120px] text-sm shrink-0">Servicing Agent</Label>
            <Select value={v(AGENT_FK.servicing_agent)} onValueChange={(val) => sv(AGENT_FK.servicing_agent, val)} disabled={disabled}>
              <SelectTrigger className="h-7 text-sm">
                <SelectValue placeholder="Select..." />
              </SelectTrigger>
              <SelectContent className="bg-popover z-50">
                {SERVICING_AGENT_OPTIONS.map((opt) => (
                  <SelectItem key={opt} value={opt}>{opt}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </DirtyFieldWrapper>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-x-8 gap-y-6">
        {/* Complete if 3rd Party */}
        <div className="space-y-3">
          <h3 className="text-sm font-semibold text-foreground border-b border-border pb-1">Complete if 3rd Party</h3>
          {renderAddressBlock({ name: AGENT_FK.tp_name, street: AGENT_FK.tp_street, city: AGENT_FK.tp_city, state: AGENT_FK.tp_state, zip: AGENT_FK.tp_zip, phone: AGENT_FK.tp_phone, email: AGENT_FK.tp_email })}
        </div>

        {/* Send Payments To */}
        <div className="space-y-3">
          <div className="flex items-center justify-between border-b border-border pb-1">
            <h3 className="text-sm font-semibold text-foreground">Send Payments To</h3>
            <DirtyFieldWrapper fieldKey={AGENT_FK.sp_same_as_tp}>
              <div className="flex items-center gap-2">
                <Checkbox checked={sameAsTP} onCheckedChange={(c) => sbv(AGENT_FK.sp_same_as_tp, !!c)} disabled={disabled} />
                <Label className="text-sm cursor-pointer">Same as 3rd Party</Label>
              </div>
            </DirtyFieldWrapper>
          </div>
          {renderAddressBlock({ name: AGENT_FK.sp_name, street: AGENT_FK.sp_street, city: AGENT_FK.sp_city, state: AGENT_FK.sp_state, zip: AGENT_FK.sp_zip, phone: AGENT_FK.sp_phone, email: AGENT_FK.sp_email }, sameAsTP)}
        </div>
      </div>

      {/* Separator */}
      <div className="border-t border-border" />

      {/* Services and Rates heading */}
      <h3 className="text-sm font-semibold text-foreground">Services and Rates</h3>
      {/* Override and Lender Split Dropdown */}
      <div className="flex items-center justify-between gap-8">
        <DirtyFieldWrapper fieldKey="loan_terms.servicing.override">
          <div className="flex items-center gap-3">
            <Label className="text-sm font-medium">Override</Label>
            <Checkbox
              checked={values['loan_terms.servicing.override'] === 'true'}
              onCheckedChange={(checked) => 
                onValueChange('loan_terms.servicing.override', checked ? 'true' : 'false')
              }
              disabled={disabled}
            />
          </div>
        </DirtyFieldWrapper>
      </div>

      {/* Services Grid */}
      <div className="border border-border rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-muted/50 border-b border-border">
                <th className="text-left px-3 py-2 font-medium text-foreground w-48">Services</th>
                <th className="text-left px-1 py-2 font-medium text-foreground w-8"></th>
                {GRID_COLUMNS.map((col) => (
                  <th key={col.key} className="text-left px-2 py-2 font-medium text-foreground min-w-24">
                    {col.label}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {SERVICE_ROWS.map((row, index) => (
                <tr 
                  key={row.key} 
                  className={`border-b border-border last:border-b-0 ${
                    row.isSpacer ? 'h-6 bg-muted/20' : 'hover:bg-muted/30'
                  }`}
                >
                  <td className="px-3 py-1.5">
                    {row.isLink ? (
                      <span className="text-primary cursor-pointer hover:underline">{row.label}</span>
                    ) : (
                      <span className="text-foreground">{row.label}</span>
                    )}
                  </td>
                  <td className="px-1 py-1.5">
                    {!row.isSpacer && (
                      <DirtyFieldWrapper fieldKey={`loan_terms.servicing.${row.key}.enabled`}>
                        <Checkbox
                          checked={values[`loan_terms.servicing.${row.key}.enabled`] === 'true'}
                          onCheckedChange={(checked) => 
                            onValueChange(`loan_terms.servicing.${row.key}.enabled`, checked ? 'true' : 'false')
                          }
                          disabled={disabled}
                          className="h-4 w-4"
                        />
                      </DirtyFieldWrapper>
                    )}
                  </td>
                  {GRID_COLUMNS.map((col) => (
                    <td key={col.key} className="px-1 py-1">
                      {!row.isSpacer && (
                        <DirtyFieldWrapper fieldKey={getFieldKey(row.key, col.key)}>
                          {col.key === 'lenders_split' ? (
                            <Select
                              value={values[getFieldKey(row.key, col.key)] || ''}
                              onValueChange={(value) => onValueChange(getFieldKey(row.key, col.key), value)}
                              disabled={disabled}
                            >
                              <SelectTrigger className="h-7 text-xs border-border">
                                <SelectValue placeholder="Select..." />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="fee_per_lender">Fee Per Lender - No Split</SelectItem>
                                <SelectItem value="pro_rata">Pro Rata</SelectItem>
                                <SelectItem value="split_50_50">Split 50/50</SelectItem>
                              </SelectContent>
                            </Select>
                          ) : (
                            <ServicingInput
                              colKey={col.key}
                              fieldKey={getFieldKey(row.key, col.key)}
                              value={values[getFieldKey(row.key, col.key)] || ''}
                              onValueChange={onValueChange}
                              disabled={disabled}
                            />
                          )}
                        </DirtyFieldWrapper>
                      )}
                    </td>
                  ))}
                </tr>
              ))}
              {/* Extra row at the bottom for custom entry */}
              <tr className="border-b border-border hover:bg-muted/30">
                <td className="px-3 py-1.5">
                  <Input
                    value={values['loan_terms.servicing.custom.label'] || ''}
                    onChange={(e) => onValueChange('loan_terms.servicing.custom.label', e.target.value)}
                    disabled={disabled}
                    placeholder="Custom service..."
                    className="h-7 text-xs border-border"
                  />
                </td>
                <td className="px-1 py-1.5">
                  <DirtyFieldWrapper fieldKey="loan_terms.servicing.custom.enabled">
                    <Checkbox
                      checked={values['loan_terms.servicing.custom.enabled'] === 'true'}
                      onCheckedChange={(checked) => 
                        onValueChange('loan_terms.servicing.custom.enabled', checked ? 'true' : 'false')
                      }
                      disabled={disabled}
                      className="h-4 w-4"
                    />
                  </DirtyFieldWrapper>
                </td>
                {GRID_COLUMNS.map((col) => (
                  <td key={col.key} className="px-1 py-1">
                    <DirtyFieldWrapper fieldKey={`loan_terms.servicing.custom.${col.key}`}>
                      {col.key === 'lenders_split' ? (
                        <Select
                          value={values[`loan_terms.servicing.custom.${col.key}`] || ''}
                          onValueChange={(value) => onValueChange(`loan_terms.servicing.custom.${col.key}`, value)}
                          disabled={disabled}
                        >
                          <SelectTrigger className="h-7 text-xs border-border">
                            <SelectValue placeholder="Select..." />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="fee_per_lender">Fee Per Lender - No Split</SelectItem>
                            <SelectItem value="pro_rata">Pro Rata</SelectItem>
                            <SelectItem value="split_50_50">Split 50/50</SelectItem>
                          </SelectContent>
                        </Select>
                      ) : (
                        <ServicingInput
                          colKey={col.key}
                          fieldKey={`loan_terms.servicing.custom.${col.key}`}
                          value={values[`loan_terms.servicing.custom.${col.key}`] || ''}
                          onValueChange={onValueChange}
                          disabled={disabled}
                        />
                      )}
                    </DirtyFieldWrapper>
                  </td>
                ))}
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default LoanTermsServicingForm;
