import React, { useState, useEffect } from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';

import { US_STATES } from '@/lib/usStates';

interface TaxData {
  tinType: string; tin: string; accountNumber: string;
  street: string; city: string; state: string; zip: string;
  send1099: boolean; taxExempt: boolean;
}

interface Broker1099Props {
  values: Record<string, string>;
  onValueChange: (fieldKey: string, value: string) => void;
  onSave: () => Promise<void>;
}

const Broker1099: React.FC<Broker1099Props> = ({ values, onValueChange, onSave }) => {
  const [form, setForm] = useState<TaxData>({
    tinType: values['broker.1099.tin_type'] || '0',
    tin: values['broker.1099.tin'] || values['broker.tin'] || '',
    accountNumber: values['broker.1099.account_number'] || '',
    street: values['broker.1099.street'] || values['broker.primary_address.street'] || '',
    city: values['broker.1099.city'] || values['broker.city'] || '',
    state: values['broker.1099.state'] || values['broker.state'] || '',
    zip: values['broker.1099.zip'] || values['broker.primary_address.zip'] || '',
    send1099: values['broker.1099.send_1099'] === 'true',
    taxExempt: values['broker.1099.tax_exempt'] === 'true',
  });

  // Sync form changes to parent values
  const update = (field: keyof TaxData, value: any) => {
    setForm(p => ({ ...p, [field]: value }));
    const key = `broker.1099.${field === 'tinType' ? 'tin_type' : field === 'accountNumber' ? 'account_number' : field === 'send1099' ? 'send_1099' : field === 'taxExempt' ? 'tax_exempt' : field}`;
    onValueChange(key, typeof value === 'boolean' ? String(value) : value);
  };

  const handleSave = async () => {
    await onSave();
    toast.success('1099 information saved.');
  };

  return (
    <div className="space-y-6 max-w-2xl">
      <h4 className="text-lg font-semibold text-foreground">1099 Tax Reporting</h4>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label>TIN Type</Label>
          <Select value={form.tinType} onValueChange={v => update('tinType', v)}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="0">0 - Unknown</SelectItem>
              <SelectItem value="1">1 - EIN</SelectItem>
              <SelectItem value="2">2 - SSN</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div><Label>TIN</Label><Input value={form.tin} onChange={e => update('tin', e.target.value)} /></div>
        <div className="col-span-2"><Label>Account Number</Label><Input value={form.accountNumber} onChange={e => update('accountNumber', e.target.value)} /></div>
      </div>

      <div className="space-y-4">
        <h5 className="text-sm font-medium text-foreground border-b border-border pb-1">Address</h5>
        <div className="grid grid-cols-2 gap-4">
          <div className="col-span-2"><Label>Street</Label><Input value={form.street} onChange={e => update('street', e.target.value)} /></div>
          <div><Label>City</Label><Input value={form.city} onChange={e => update('city', e.target.value)} /></div>
          <div>
            <Label>State</Label>
            <Select value={form.state} onValueChange={v => update('state', v)}>
              <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
              <SelectContent>
                {US_STATES.map(s => (<SelectItem key={s} value={s}>{s}</SelectItem>))}
              </SelectContent>
            </Select>
          </div>
          <div><Label>ZIP</Label><Input value={form.zip} onChange={e => update('zip', e.target.value)} /></div>
        </div>
      </div>

      <div className="flex items-center gap-6">
        <div className="flex items-center gap-2">
          <Checkbox checked={form.send1099} onCheckedChange={v => update('send1099', !!v)} id="send1099" />
          <Label htmlFor="send1099">Send 1099</Label>
        </div>
        <div className="flex items-center gap-2">
          <Checkbox checked={form.taxExempt} onCheckedChange={v => update('taxExempt', !!v)} id="taxExempt" />
          <Label htmlFor="taxExempt">Tax Exempt</Label>
        </div>
      </div>

      <div className="flex justify-end gap-2">
        <Button onClick={handleSave}>Save 1099</Button>
      </div>
    </div>
  );
};

export default Broker1099;
