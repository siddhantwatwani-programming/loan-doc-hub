import React, { useEffect, useRef } from 'react';
import { Input } from '@/components/ui/input';
import { PhoneInput } from '@/components/ui/phone-input';
import { EmailInput } from '@/components/ui/email-input';
import { ZipInput } from '@/components/ui/zip-input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { DirtyFieldWrapper } from './DirtyFieldWrapper';
import { US_STATES } from '@/lib/usStates';
import { supabase } from '@/integrations/supabase/client';
import type { CalculationResult } from '@/lib/calculationEngine';

interface OriginationServicingFormProps {
  values: Record<string, string>;
  onValueChange: (fieldKey: string, value: string) => void;
  showValidation?: boolean;
  disabled?: boolean;
  calculationResults?: Record<string, CalculationResult>;
}

const FK = {
  servicing_agent: 'origination_svc.servicing_agent',
  // 3rd Party
  tp_name: 'origination_svc.third_party.name',
  tp_street: 'origination_svc.third_party.street',
  tp_city: 'origination_svc.third_party.city',
  tp_state: 'origination_svc.third_party.state',
  tp_zip: 'origination_svc.third_party.zip',
  tp_phone: 'origination_svc.third_party.phone',
  tp_email: 'origination_svc.third_party.email',
  // Send Payments To
  sp_same_as_tp: 'origination_svc.send_payments.same_as_third_party',
  sp_name: 'origination_svc.send_payments.name',
  sp_street: 'origination_svc.send_payments.street',
  sp_city: 'origination_svc.send_payments.city',
  sp_state: 'origination_svc.send_payments.state',
  sp_zip: 'origination_svc.send_payments.zip',
  sp_phone: 'origination_svc.send_payments.phone',
  sp_email: 'origination_svc.send_payments.email',
  // Broker Servicing Fee
  fee_percent: 'origination_svc.broker_fee.percent',
  fee_plus: 'origination_svc.broker_fee.plus',
  fee_per: 'origination_svc.broker_fee.per',
  fee_payable: 'origination_svc.broker_fee.payable',
};

const AGENT_OPTIONS = ['Company', 'Broker', 'Lender'];

export const OriginationServicingForm: React.FC<OriginationServicingFormProps> = ({
  values,
  onValueChange,
  disabled = false,
}) => {
  const v = (key: string) => values[key] || '';
  const sv = (key: string, val: string) => onValueChange(key, val);
  const bv = (key: string) => values[key] === 'true';
  const sbv = (key: string, val: boolean) => onValueChange(key, String(val));

  // Track previous agent to detect user-initiated changes only
  const prevAgentRef = useRef<string>(v(FK.servicing_agent));

  // Auto-populate 3rd party address based on Servicing Agent selection
  const currentAgent = v(FK.servicing_agent);
  useEffect(() => {
    if (currentAgent === prevAgentRef.current) return;
    prevAgentRef.current = currentAgent;
    if (!currentAgent) return;

    const populateAddress = (data: {
      name?: string; street?: string; city?: string; state?: string; zip?: string; phone?: string; email?: string;
    }) => {
      sv(FK.tp_name, data.name || '');
      sv(FK.tp_street, data.street || '');
      sv(FK.tp_city, data.city || '');
      sv(FK.tp_state, data.state || '');
      sv(FK.tp_zip, data.zip || '');
      sv(FK.tp_phone, data.phone || '');
      sv(FK.tp_email, data.email || '');
    };

    if (currentAgent === 'Company') {
      // Fetch company name from system_settings; no address stored yet
      supabase.from('system_settings').select('setting_key, setting_value')
        .in('setting_key', ['company_name', 'company_street', 'company_city', 'company_state', 'company_zip', 'company_phone', 'company_email'])
        .then(({ data }) => {
          const map: Record<string, string> = {};
          (data || []).forEach(r => { map[r.setting_key] = r.setting_value || ''; });
          populateAddress({
            name: map['company_name'] || '',
            street: map['company_street'] || '',
            city: map['company_city'] || '',
            state: map['company_state'] || '',
            zip: map['company_zip'] || '',
            phone: map['company_phone'] || '',
            email: map['company_email'] || '',
          });
        });
    } else if (currentAgent === 'Broker') {
      // Use broker1 data from values
      populateAddress({
        name: values['broker1.company'] || values['broker1.first_name'] ? `${values['broker1.first_name'] || ''} ${values['broker1.last_name'] || ''}`.trim() : '',
        street: values['broker1.address.street'] || '',
        city: values['broker1.address.city'] || '',
        state: values['broker1.address.state'] || '',
        zip: values['broker1.address.zip'] || '',
        phone: values['broker1.phone.work'] || values['broker1.phone.cell'] || '',
        email: values['broker1.email'] || '',
      });
      // Use company name if available, fallback to individual name
      const brokerName = values['broker1.company'] || `${values['broker1.first_name'] || ''} ${values['broker1.last_name'] || ''}`.trim();
      if (brokerName) sv(FK.tp_name, brokerName);
    } else if (currentAgent === 'Lender') {
      // Use lender1 (first/primary lender) data from values
      populateAddress({
        name: values['lender1.full_name'] || `${values['lender1.first_name'] || ''} ${values['lender1.last_name'] || ''}`.trim(),
        street: values['lender1.primary_address.street'] || values['lender1.street'] || '',
        city: values['lender1.primary_address.city'] || values['lender1.city'] || '',
        state: values['lender1.primary_address.state'] || values['lender1.state'] || '',
        zip: values['lender1.primary_address.zip'] || values['lender1.zip'] || '',
        phone: values['lender1.phone.work'] || values['lender1.phone.cell'] || values['lender1.phone.home'] || '',
        email: values['lender1.email'] || '',
      });
    }
  }, [currentAgent]);

  // Auto-copy 3rd party values when "Same as 3rd Party" is checked
  const sameAsTP = bv(FK.sp_same_as_tp);
  useEffect(() => {
    if (sameAsTP) {
      const mappings = [
        [FK.tp_name, FK.sp_name], [FK.tp_street, FK.sp_street], [FK.tp_city, FK.sp_city],
        [FK.tp_state, FK.sp_state], [FK.tp_zip, FK.sp_zip], [FK.tp_phone, FK.sp_phone], [FK.tp_email, FK.sp_email],
      ];
      mappings.forEach(([src, dst]) => {
        if (v(src) !== v(dst)) sv(dst, v(src));
      });
    }
  }, [sameAsTP, values[FK.tp_name], values[FK.tp_street], values[FK.tp_city], values[FK.tp_state], values[FK.tp_zip], values[FK.tp_phone], values[FK.tp_email]]);

  const renderTextField = (label: string, key: string, extraDisabled = false) => (
    <DirtyFieldWrapper fieldKey={key}>
      <div className="flex items-center gap-2">
        <Label className="w-[80px] text-sm shrink-0">{label}</Label>
        <Input value={v(key)} onChange={(e) => sv(key, e.target.value)} disabled={disabled || extraDisabled} className="h-7 text-sm" />
      </div>
    </DirtyFieldWrapper>
  );

  const renderAddressBlock = (prefix: string, keys: { name: string; street: string; city: string; state: string; zip: string; phone: string; email: string }, extraDisabled = false) => (
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

  return (
    <div className="p-4 space-y-6">
      {/* Servicing Agent */}
      <div className="space-y-3">
        <h3 className="text-sm font-semibold text-foreground border-b border-border pb-1">Servicing Agent</h3>
        <DirtyFieldWrapper fieldKey={FK.servicing_agent}>
          <div className="flex items-center gap-2 max-w-xs">
            <Label className="w-[120px] text-sm shrink-0">Servicing Agent</Label>
            <Select value={v(FK.servicing_agent)} onValueChange={(val) => sv(FK.servicing_agent, val)} disabled={disabled}>
              <SelectTrigger className="h-7 text-sm">
                <SelectValue placeholder="Select..." />
              </SelectTrigger>
              <SelectContent className="bg-popover z-50">
                {AGENT_OPTIONS.map((opt) => (
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
          {renderAddressBlock('tp', { name: FK.tp_name, street: FK.tp_street, city: FK.tp_city, state: FK.tp_state, zip: FK.tp_zip, phone: FK.tp_phone, email: FK.tp_email })}
        </div>

        {/* Send Payments To */}
        <div className="space-y-3">
          <div className="flex items-center justify-between border-b border-border pb-1">
            <h3 className="text-sm font-semibold text-foreground">Send Payments To</h3>
            <DirtyFieldWrapper fieldKey={FK.sp_same_as_tp}>
              <div className="flex items-center gap-2">
                <Checkbox checked={sameAsTP} onCheckedChange={(c) => sbv(FK.sp_same_as_tp, !!c)} disabled={disabled} />
                <Label className="text-sm cursor-pointer">Same as 3rd Party</Label>
              </div>
            </DirtyFieldWrapper>
          </div>
          {renderAddressBlock('sp', { name: FK.sp_name, street: FK.sp_street, city: FK.sp_city, state: FK.sp_state, zip: FK.sp_zip, phone: FK.sp_phone, email: FK.sp_email }, sameAsTP)}
        </div>

      </div>
    </div>
  );
};

export default OriginationServicingForm;
