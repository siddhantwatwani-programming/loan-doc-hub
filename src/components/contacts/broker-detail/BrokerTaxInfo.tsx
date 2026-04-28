import React from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { DirtyFieldWrapper } from '@/components/deal/DirtyFieldWrapper';

interface BrokerTaxInfoProps {
  values: Record<string, string>;
  onValueChange: (fieldKey: string, value: string) => void;
  disabled?: boolean;
}

const PREFIX = 'broker.tax_info.';

const KEYS = {
  designatedRecipient: `${PREFIX}designated_recipient`,
  issue1099: `${PREFIX}issue_1099`,
  tinNumber: `${PREFIX}tin_number`,
  tinType: `${PREFIX}tin_type`,
  tinVerified: `${PREFIX}tin_verified`,
  alternateReporting: `${PREFIX}alternate_reporting`,
  notes: `${PREFIX}notes`,
  brokerType: `${PREFIX}broker_type`,
  taxedAsCorp: `${PREFIX}taxed_as_corp`,
} as const;

const TIN_TYPE_OPTIONS = [
  { value: '0', label: '0 - Unknown' },
  { value: '1', label: '1 - EIN' },
  { value: '2', label: '2 - SSN' },
];

const BROKER_TYPE_OPTIONS = [
  { value: 'individual', label: 'Individual' },
  { value: 'joint', label: 'Joint' },
  { value: 'family_trust', label: 'Family Trust' },
  { value: 'llc', label: 'LLC' },
  { value: 'c_s_corp', label: 'C Corp / S Corp' },
  { value: 'ira_erisa', label: 'IRA / ERISA' },
  { value: 'investment_fund', label: 'Investment Fund' },
  { value: '401k', label: '401K' },
  { value: 'foreign_holder_w8', label: 'Foreign Holder W-8' },
  { value: 'non_profit', label: 'Non-profit' },
];

// Mapping per spec screenshot. 'situational' types depend on Taxed as Corp flag.
const ISSUE_1099_BY_TYPE: Record<string, 'Yes' | 'No' | 'situational'> = {
  individual: 'Yes',
  joint: 'Yes',
  family_trust: 'Yes',
  llc: 'situational',
  c_s_corp: 'No',
  ira_erisa: 'No',
  investment_fund: 'situational',
  '401k': 'No',
  foreign_holder_w8: 'No',
  non_profit: 'No',
};

const computeIssue1099 = (brokerType: string, taxedAsCorp: boolean): string => {
  const rule = ISSUE_1099_BY_TYPE[brokerType];
  if (!rule) return '';
  if (rule === 'situational') return taxedAsCorp ? 'No' : 'Yes';
  return rule;
};

const BrokerTaxInfo: React.FC<BrokerTaxInfoProps> = ({
  values,
  onValueChange,
  disabled = false,
}) => {
  const get = (k: string) => values[k] || '';
  const getBool = (k: string) => values[k] === 'true';
  const set = (k: string, v: string | boolean) => onValueChange(k, String(v));

  return (
    <div className="space-y-4 overflow-hidden">
      <h3 className="font-semibold text-base text-foreground border-b border-border pb-2">
        Tax Reporting
      </h3>

      <div className="max-w-[700px] space-y-3">
        {/* Designated Recipient (checkbox) */}
        <DirtyFieldWrapper fieldKey={KEYS.designatedRecipient}>
          <div className="flex items-center gap-3">
            <Label className="text-sm text-muted-foreground min-w-[140px] max-w-[140px] text-left shrink-0">
              Designated Recipient
            </Label>
            <div className="w-[200px] flex items-center">
              <Checkbox
                id="broker-tax-designated"
                checked={getBool(KEYS.designatedRecipient)}
                onCheckedChange={(c) => set(KEYS.designatedRecipient, !!c)}
                disabled={disabled}
              />
            </div>
          </div>
        </DirtyFieldWrapper>

        {/* Broker Type (drives Issue 1099) */}
        <DirtyFieldWrapper fieldKey={KEYS.brokerType}>
          <div className="flex items-center gap-3">
            <Label className="text-sm text-muted-foreground min-w-[140px] max-w-[140px] text-left shrink-0">
              Broker Type
            </Label>
            <Select
              value={get(KEYS.brokerType) || undefined}
              onValueChange={(v) => {
                set(KEYS.brokerType, v);
                const auto = computeIssue1099(v, getBool(KEYS.taxedAsCorp));
                if (auto) set(KEYS.issue1099, auto);
              }}
              disabled={disabled}
            >
              <SelectTrigger className="h-8 text-sm w-[200px]">
                <SelectValue placeholder="Select" />
              </SelectTrigger>
              <SelectContent className="z-[9999]">
                {BROKER_TYPE_OPTIONS.map((o) => (
                  <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </DirtyFieldWrapper>

        {/* Taxed as Corp (only relevant for situational types) */}
        {(get(KEYS.brokerType) === 'llc' || get(KEYS.brokerType) === 'investment_fund') && (
          <DirtyFieldWrapper fieldKey={KEYS.taxedAsCorp}>
            <div className="flex items-center gap-3">
              <Label className="text-sm text-muted-foreground min-w-[140px] max-w-[140px] text-left shrink-0">
                Taxed as Corp
              </Label>
              <div className="w-[200px] flex items-center">
                <Checkbox
                  id="broker-tax-taxed-as-corp"
                  checked={getBool(KEYS.taxedAsCorp)}
                  onCheckedChange={(c) => {
                    const checked = !!c;
                    set(KEYS.taxedAsCorp, checked);
                    const auto = computeIssue1099(get(KEYS.brokerType), checked);
                    if (auto) set(KEYS.issue1099, auto);
                  }}
                  disabled={disabled}
                />
              </div>
            </div>
          </DirtyFieldWrapper>
        )}

        {/* Issue 1099 (auto-populated, still editable) */}
        <DirtyFieldWrapper fieldKey={KEYS.issue1099}>
          <div className="flex items-center gap-3">
            <Label className="text-sm text-muted-foreground min-w-[140px] max-w-[140px] text-left shrink-0">
              Issue 1099
            </Label>
            <Input
              value={get(KEYS.issue1099)}
              onChange={(e) => set(KEYS.issue1099, e.target.value)}
              disabled={disabled}
              className="h-8 text-sm w-[200px]"
              maxLength={50}
              placeholder="Yes / No"
            />
          </div>
        </DirtyFieldWrapper>

        {/* TIN Number */}
        <DirtyFieldWrapper fieldKey={KEYS.tinNumber}>
          <div className="flex items-center gap-3">
            <Label className="text-sm text-muted-foreground min-w-[140px] max-w-[140px] text-left shrink-0">
              TIN Number
            </Label>
            <Input
              value={get(KEYS.tinNumber)}
              onChange={(e) => set(KEYS.tinNumber, e.target.value.replace(/[^0-9-]/g, '').slice(0, 11))}
              disabled={disabled}
              className="h-8 text-sm w-[200px]"
              inputMode="numeric"
              maxLength={11}
            />
          </div>
        </DirtyFieldWrapper>

        {/* TIN Type */}
        <DirtyFieldWrapper fieldKey={KEYS.tinType}>
          <div className="flex items-center gap-3">
            <Label className="text-sm text-muted-foreground min-w-[140px] max-w-[140px] text-left shrink-0">
              TIN Type
            </Label>
            <Select
              value={get(KEYS.tinType) || undefined}
              onValueChange={(v) => set(KEYS.tinType, v)}
              disabled={disabled}
            >
              <SelectTrigger className="h-8 text-sm w-[200px]">
                <SelectValue placeholder="Select" />
              </SelectTrigger>
              <SelectContent className="z-[9999]">
                {TIN_TYPE_OPTIONS.map((o) => (
                  <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </DirtyFieldWrapper>

        {/* TIN Verified (checkbox) */}
        <DirtyFieldWrapper fieldKey={KEYS.tinVerified}>
          <div className="flex items-center gap-3">
            <Label className="text-sm text-muted-foreground min-w-[140px] max-w-[140px] text-left shrink-0">
              TIN Verified
            </Label>
            <div className="w-[200px] flex items-center">
              <Checkbox
                id="broker-tax-tin-verified"
                checked={getBool(KEYS.tinVerified)}
                onCheckedChange={(c) => set(KEYS.tinVerified, !!c)}
                disabled={disabled}
              />
            </div>
          </div>
        </DirtyFieldWrapper>

        {/* Alternate Reporting */}
        <DirtyFieldWrapper fieldKey={KEYS.alternateReporting}>
          <div className="flex items-center gap-3">
            <Label className="text-sm text-muted-foreground min-w-[140px] max-w-[140px] text-left shrink-0">
              Alternate Reporting
            </Label>
            <Input
              value={get(KEYS.alternateReporting)}
              onChange={(e) => set(KEYS.alternateReporting, e.target.value)}
              disabled={disabled}
              className="h-8 text-sm w-[200px]"
              maxLength={100}
            />
          </div>
        </DirtyFieldWrapper>

        {/* Notes */}
        <DirtyFieldWrapper fieldKey={KEYS.notes}>
          <div className="flex flex-col gap-1 pt-2">
            <Label className="text-sm text-muted-foreground text-left">Notes</Label>
            <Textarea
              value={get(KEYS.notes)}
              onChange={(e) => set(KEYS.notes, e.target.value)}
              disabled={disabled}
              className="text-sm min-h-[100px] w-full"
              maxLength={1000}
            />
          </div>
        </DirtyFieldWrapper>
      </div>
    </div>
  );
};

export default BrokerTaxInfo;
