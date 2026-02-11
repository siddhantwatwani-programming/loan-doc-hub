import React, { useState, useEffect } from 'react';
import { Home } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import type { LienData } from './LiensTableView';

interface LienModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  lien: LienData | null;
  onSave: (lien: LienData) => void;
  isEdit: boolean;
  propertyOptions?: { id: string; label: string }[];
}

const LOAN_TYPE_OPTIONS = ['Conventional', 'Private Lender', 'Judgement', 'Other'];
const PRIORITY_OPTIONS = ['1st', '2nd', '3rd', '4th', '5th'];

const getDefaultLien = (): LienData => ({
  id: '',
  property: '',
  priority: '1st',
  holder: '',
  account: '',
  contact: '',
  phone: '',
  fax: '',
  email: '',
  loanType: '',
  anticipated: 'false',
  existingRemain: 'false',
  existingPaydown: 'false',
  existingPayoff: 'false',
  lienPriorityNow: '',
  lienPriorityAfter: '',
  interestRate: '',
  maturityDate: '',
  originalBalance: '',
  balanceAfter: '',
  currentBalance: '',
  regularPayment: '',
  recordingNumber: '',
  recordingDate: '',
  seniorLienTracking: 'false',
  lastVerified: '',
  lastChecked: '',
  note: '',
});

export const LienModal: React.FC<LienModalProps> = ({
  open,
  onOpenChange,
  lien,
  onSave,
  isEdit,
  propertyOptions = [],
}) => {
  const [formData, setFormData] = useState<LienData>(getDefaultLien());

  useEffect(() => {
    if (open) {
      if (lien) {
        setFormData(lien);
      } else {
        setFormData(getDefaultLien());
      }
    }
  }, [open, lien]);

  const handleChange = (field: keyof LienData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSave = () => {
    onSave(formData);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Home className="h-5 w-5 text-primary" />
            {isEdit ? 'Edit Property Lien' : 'New Property Lien'}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 mt-4">
          <div className="border-b border-border pb-2">
            <span className="font-semibold text-sm text-primary">Property Lien Information</span>
          </div>

          <div className="grid grid-cols-2 gap-x-6 gap-y-3">
            <div>
              <Label className="text-sm text-foreground">Related Property</Label>
              <Select value={formData.property} onValueChange={(val) => handleChange('property', val)}>
                <SelectTrigger className="h-9 text-sm mt-1"><SelectValue placeholder="Unassigned" /></SelectTrigger>
                <SelectContent className="bg-background border border-border z-50">
                  <SelectItem value="unassigned">Unassigned</SelectItem>
                  {propertyOptions.map(opt => (<SelectItem key={opt.id} value={opt.id}>{opt.label}</SelectItem>))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-sm text-foreground">Lien Priority Now</Label>
              <Select value={formData.lienPriorityNow} onValueChange={(val) => handleChange('lienPriorityNow', val)}>
                <SelectTrigger className="h-9 text-sm mt-1"><SelectValue placeholder="Select" /></SelectTrigger>
                <SelectContent className="bg-background border border-border z-50">
                  {PRIORITY_OPTIONS.map(opt => (<SelectItem key={opt} value={opt}>{opt}</SelectItem>))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label className="text-sm text-foreground">Lien Holder</Label>
              <Input value={formData.holder} onChange={(e) => handleChange('holder', e.target.value)} className="h-9 text-sm mt-1" />
            </div>
            <div>
              <Label className="text-sm text-foreground">Lien Priority After</Label>
              <Select value={formData.lienPriorityAfter} onValueChange={(val) => handleChange('lienPriorityAfter', val)}>
                <SelectTrigger className="h-9 text-sm mt-1"><SelectValue placeholder="Select" /></SelectTrigger>
                <SelectContent className="bg-background border border-border z-50">
                  {PRIORITY_OPTIONS.map(opt => (<SelectItem key={opt} value={opt}>{opt}</SelectItem>))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label className="text-sm text-foreground">Account Number</Label>
              <Input value={formData.account} onChange={(e) => handleChange('account', e.target.value)} className="h-9 text-sm mt-1" />
            </div>
            <div>
              <Label className="text-sm text-foreground">Interest Rate</Label>
              <div className="flex items-center gap-1 mt-1">
                <Input value={formData.interestRate} onChange={(e) => handleChange('interestRate', e.target.value)} className="h-9 text-sm text-right" inputMode="decimal" placeholder="0.000" />
                <span className="text-sm text-muted-foreground">%</span>
              </div>
            </div>

            <div>
              <Label className="text-sm text-foreground">Phone</Label>
              <Input value={formData.phone} onChange={(e) => handleChange('phone', e.target.value)} className="h-9 text-sm mt-1" />
            </div>
            <div>
              <Label className="text-sm text-foreground">Maturity Date</Label>
              <Input type="date" value={formData.maturityDate} onChange={(e) => handleChange('maturityDate', e.target.value)} className="h-9 text-sm mt-1" />
            </div>

            <div>
              <Label className="text-sm text-foreground">Fax</Label>
              <Input value={formData.fax} onChange={(e) => handleChange('fax', e.target.value)} className="h-9 text-sm mt-1" />
            </div>
            <div>
              <Label className="text-sm text-foreground">Original Balance</Label>
              <div className="flex items-center gap-1 mt-1">
                <span className="text-sm text-muted-foreground">$</span>
                <Input value={formData.originalBalance} onChange={(e) => handleChange('originalBalance', e.target.value)} className="h-9 text-sm text-right" inputMode="decimal" placeholder="0.00" />
              </div>
            </div>

            <div>
              <Label className="text-sm text-foreground">Email</Label>
              <Input value={formData.email} onChange={(e) => handleChange('email', e.target.value)} className="h-9 text-sm mt-1" />
            </div>
            <div>
              <Label className="text-sm text-foreground">Balance After</Label>
              <div className="flex items-center gap-1 mt-1">
                <span className="text-sm text-muted-foreground">$</span>
                <Input value={formData.balanceAfter} onChange={(e) => handleChange('balanceAfter', e.target.value)} className="h-9 text-sm text-right" inputMode="decimal" placeholder="0.00" />
              </div>
            </div>

            <div>
              <Label className="text-sm text-foreground">Loan Type</Label>
              <Select value={formData.loanType} onValueChange={(val) => handleChange('loanType', val)}>
                <SelectTrigger className="h-9 text-sm mt-1"><SelectValue placeholder="Select type" /></SelectTrigger>
                <SelectContent className="bg-background border border-border z-50">
                  {LOAN_TYPE_OPTIONS.map(opt => (<SelectItem key={opt} value={opt}>{opt}</SelectItem>))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-sm text-foreground">Regular Payment</Label>
              <div className="flex items-center gap-1 mt-1">
                <span className="text-sm text-muted-foreground">$</span>
                <Input value={formData.regularPayment} onChange={(e) => handleChange('regularPayment', e.target.value)} className="h-9 text-sm text-right" inputMode="decimal" placeholder="0.00" />
              </div>
            </div>
          </div>

          {/* Checkboxes + remaining fields */}
          <div className="grid grid-cols-2 gap-x-6 gap-y-3 mt-2">
            <div className="flex items-center gap-2">
              <Checkbox id="modal-anticipated" checked={formData.anticipated === 'true'} onCheckedChange={(c) => handleChange('anticipated', c ? 'true' : 'false')} />
              <Label htmlFor="modal-anticipated" className="text-sm text-foreground">Anticipated</Label>
            </div>
            <div>
              <Label className="text-sm text-foreground">Recording Number</Label>
              <Input value={formData.recordingNumber} onChange={(e) => handleChange('recordingNumber', e.target.value)} className="h-9 text-sm mt-1" />
            </div>

            <div className="flex items-center gap-2">
              <Checkbox id="modal-existingRemain" checked={formData.existingRemain === 'true'} onCheckedChange={(c) => handleChange('existingRemain', c ? 'true' : 'false')} />
              <Label htmlFor="modal-existingRemain" className="text-sm text-foreground">Existing - Remain</Label>
            </div>
            <div>
              <Label className="text-sm text-foreground">Recording Date</Label>
              <Input type="date" value={formData.recordingDate} onChange={(e) => handleChange('recordingDate', e.target.value)} className="h-9 text-sm mt-1" />
            </div>

            <div className="flex items-center gap-2">
              <Checkbox id="modal-existingPaydown" checked={formData.existingPaydown === 'true'} onCheckedChange={(c) => handleChange('existingPaydown', c ? 'true' : 'false')} />
              <Label htmlFor="modal-existingPaydown" className="text-sm text-foreground">Existing - Paydown</Label>
            </div>
            <div className="flex items-center gap-2">
              <Checkbox id="modal-seniorLienTracking" checked={formData.seniorLienTracking === 'true'} onCheckedChange={(c) => handleChange('seniorLienTracking', c ? 'true' : 'false')} />
              <Label htmlFor="modal-seniorLienTracking" className="text-sm text-foreground">Senior Lien Tracking</Label>
            </div>

            <div className="flex items-center gap-2">
              <Checkbox id="modal-existingPayoff" checked={formData.existingPayoff === 'true'} onCheckedChange={(c) => handleChange('existingPayoff', c ? 'true' : 'false')} />
              <Label htmlFor="modal-existingPayoff" className="text-sm text-foreground">Existing - Payoff</Label>
            </div>
            <div>
              <Label className="text-sm text-foreground">Last Verified</Label>
              <Input type="date" value={formData.lastVerified} onChange={(e) => handleChange('lastVerified', e.target.value)} className="h-9 text-sm mt-1" />
            </div>
          </div>
        </div>

        <div className="flex justify-end gap-2 pt-4 border-t border-border">
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={handleSave}>OK</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default LienModal;
