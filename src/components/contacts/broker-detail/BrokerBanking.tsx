import React, { useState } from 'react';
import { MaskedInput } from '@/components/ui/masked-input';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import type { ContactBroker } from '@/pages/contacts/ContactBrokersPage';

interface BankingData {
  achEnabled: boolean; bankName: string; routingNumber: string; accountNumber: string;
  accountType: string; checkPayableTo: string; checkMailingStreet: string;
  checkMailingCity: string; checkMailingState: string; checkMailingZip: string;
}

const BrokerBanking: React.FC<{ broker: ContactBroker; onUpdate: (b: ContactBroker) => void }> = ({ broker }) => {
  const [form, setForm] = useState<BankingData>({
    achEnabled: broker.ach, bankName: '', routingNumber: '', accountNumber: '',
    accountType: 'checking', checkPayableTo: broker.fullName, checkMailingStreet: broker.street,
    checkMailingCity: broker.city, checkMailingState: broker.state, checkMailingZip: broker.zip,
  });

  const update = (field: keyof BankingData, value: any) => setForm(p => ({ ...p, [field]: value }));

  const handleSave = () => { toast.success('Banking information saved.'); };

  return (
    <div className="space-y-6 max-w-2xl">
      <h4 className="text-lg font-semibold text-foreground">Banking</h4>

      <div className="space-y-4">
        <h5 className="text-sm font-medium text-foreground border-b border-border pb-1">ACH / Direct Deposit</h5>
        <div className="flex items-center gap-2">
          <Checkbox checked={form.achEnabled} onCheckedChange={v => update('achEnabled', !!v)} id="ach" />
          <Label htmlFor="ach">ACH Enabled</Label>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div><Label>Bank Name</Label><Input value={form.bankName} onChange={e => update('bankName', e.target.value)} /></div>
          <div><Label>Routing Number</Label><Input value={form.routingNumber} onChange={e => update('routingNumber', e.target.value)} /></div>
          <div><Label>Account Number</Label><Input value={form.accountNumber} onChange={e => update('accountNumber', e.target.value)} /></div>
          <div>
            <Label>Account Type</Label>
            <Select value={form.accountType} onValueChange={v => update('accountType', v)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="checking">Checking</SelectItem>
                <SelectItem value="savings">Savings</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      <div className="space-y-4">
        <h5 className="text-sm font-medium text-foreground border-b border-border pb-1">Check / Mailing</h5>
        <div className="grid grid-cols-2 gap-4">
          <div className="col-span-2"><Label>Payable To</Label><Input value={form.checkPayableTo} onChange={e => update('checkPayableTo', e.target.value)} /></div>
          <div className="col-span-2"><Label>Street</Label><Input value={form.checkMailingStreet} onChange={e => update('checkMailingStreet', e.target.value)} /></div>
          <div><Label>City</Label><Input value={form.checkMailingCity} onChange={e => update('checkMailingCity', e.target.value)} /></div>
          <div><Label>State</Label><Input value={form.checkMailingState} onChange={e => update('checkMailingState', e.target.value)} /></div>
          <div><Label>ZIP</Label><Input value={form.checkMailingZip} onChange={e => update('checkMailingZip', e.target.value)} /></div>
        </div>
      </div>

      <div className="flex justify-end gap-2">
        <Button onClick={handleSave}>Save Banking</Button>
      </div>
    </div>
  );
};

export default BrokerBanking;
