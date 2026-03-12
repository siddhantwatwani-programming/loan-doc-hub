import React, { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import type { ContactBroker } from '@/pages/contacts/ContactBrokersPage';

interface TaxData {
  tinType: string; tin: string; accountNumber: string;
  street: string; city: string; state: string; zip: string;
  send1099: boolean; taxExempt: boolean;
}

const Broker1099: React.FC<{ broker: ContactBroker; onUpdate: (b: ContactBroker) => void }> = ({ broker }) => {
  const [form, setForm] = useState<TaxData>({
    tinType: 'ssn', tin: broker.tin, accountNumber: '',
    street: broker.street, city: broker.city, state: broker.state, zip: broker.zip,
    send1099: broker.send1099, taxExempt: false,
  });

  const update = (field: keyof TaxData, value: any) => setForm(p => ({ ...p, [field]: value }));

  const handleSave = () => { toast.success('1099 information saved.'); };

  return (
    <div className="space-y-6 max-w-2xl">
      <h4 className="text-lg font-semibold text-foreground">1099 Tax Reporting</h4>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label>TIN Type</Label>
          <Select value={form.tinType} onValueChange={v => update('tinType', v)}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="ssn">SSN</SelectItem>
              <SelectItem value="ein">EIN</SelectItem>
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
          <div><Label>State</Label><Input value={form.state} onChange={e => update('state', e.target.value)} /></div>
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
