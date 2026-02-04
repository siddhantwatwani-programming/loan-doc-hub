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
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
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

const PRIORITY_OPTIONS = ['1st', '2nd', '3rd', '4th', '5th'];

const getDefaultLien = (): LienData => ({
  id: '',
  property: '',
  priority: '1st',
  holder: '',
  account: '',
  contact: '',
  phone: '',
  originalBalance: '',
  currentBalance: '',
  regularPayment: '',
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
  const [activeTab, setActiveTab] = useState('general');

  useEffect(() => {
    if (open) {
      if (lien) {
        setFormData(lien);
      } else {
        setFormData(getDefaultLien());
      }
      setActiveTab('general');
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
      <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Home className="h-5 w-5 text-primary" />
            {isEdit ? 'Edit Property Lien' : 'New Property Lien'}
          </DialogTitle>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="general">General</TabsTrigger>
            <TabsTrigger value="notes">Notes</TabsTrigger>
          </TabsList>

          <TabsContent value="general" className="space-y-4 mt-4">
            <div className="border-b border-border pb-2">
              <span className="font-semibold text-sm text-primary">Property Lien Information</span>
            </div>

            <div>
              <Label className="text-sm text-foreground">Property</Label>
              <Select
                value={formData.property}
                onValueChange={(val) => handleChange('property', val)}
              >
                <SelectTrigger className="h-9 text-sm mt-1">
                  <SelectValue placeholder="Unassigned" />
                </SelectTrigger>
                <SelectContent className="bg-background border border-border z-50">
                  <SelectItem value="unassigned">Unassigned</SelectItem>
                  {propertyOptions.map(opt => (
                    <SelectItem key={opt.id} value={opt.id}>{opt.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label className="text-sm text-foreground">Priority</Label>
              <Select
                value={formData.priority}
                onValueChange={(val) => handleChange('priority', val)}
              >
                <SelectTrigger className="h-9 text-sm mt-1">
                  <SelectValue placeholder="Select priority" />
                </SelectTrigger>
                <SelectContent className="bg-background border border-border z-50">
                  {PRIORITY_OPTIONS.map(opt => (
                    <SelectItem key={opt} value={opt}>{opt}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label className="text-sm text-foreground">Lien Holder</Label>
              <Input
                value={formData.holder}
                onChange={(e) => handleChange('holder', e.target.value)}
                className="h-9 text-sm mt-1"
              />
            </div>

            <div>
              <Label className="text-sm text-foreground">Account</Label>
              <Input
                value={formData.account}
                onChange={(e) => handleChange('account', e.target.value)}
                className="h-9 text-sm mt-1"
              />
            </div>

            <div>
              <Label className="text-sm text-foreground">Contact</Label>
              <Input
                value={formData.contact}
                onChange={(e) => handleChange('contact', e.target.value)}
                className="h-9 text-sm mt-1"
              />
            </div>

            <div>
              <Label className="text-sm text-foreground">Phone</Label>
              <Input
                value={formData.phone}
                onChange={(e) => handleChange('phone', e.target.value)}
                className="h-9 text-sm mt-1"
              />
            </div>

            <div>
              <Label className="text-sm text-foreground">Original Balance</Label>
              <div className="flex items-center gap-1 mt-1">
                <span className="text-sm text-muted-foreground">$</span>
                <Input
                  value={formData.originalBalance}
                  onChange={(e) => handleChange('originalBalance', e.target.value)}
                  className="h-9 text-sm text-right"
                  inputMode="decimal"
                  placeholder="0.00"
                />
              </div>
            </div>

            <div>
              <Label className="text-sm text-foreground">Current Balance</Label>
              <div className="flex items-center gap-1 mt-1">
                <span className="text-sm text-muted-foreground">$</span>
                <Input
                  value={formData.currentBalance}
                  onChange={(e) => handleChange('currentBalance', e.target.value)}
                  className="h-9 text-sm text-right"
                  inputMode="decimal"
                  placeholder="0.00"
                />
              </div>
            </div>

            <div>
              <Label className="text-sm text-foreground">Regular Payment</Label>
              <div className="flex items-center gap-1 mt-1">
                <span className="text-sm text-muted-foreground">$</span>
                <Input
                  value={formData.regularPayment}
                  onChange={(e) => handleChange('regularPayment', e.target.value)}
                  className="h-9 text-sm text-right"
                  inputMode="decimal"
                  placeholder="0.00"
                />
              </div>
            </div>

            <div>
              <Label className="text-sm text-foreground">Last Checked</Label>
              <Input
                type="date"
                value={formData.lastChecked}
                onChange={(e) => handleChange('lastChecked', e.target.value)}
                className="h-9 text-sm mt-1"
              />
            </div>
          </TabsContent>

          <TabsContent value="notes" className="mt-4">
            <div className="border-b border-border pb-2 mb-4">
              <span className="font-semibold text-sm text-primary">Notes</span>
            </div>
            <Textarea
              value={formData.note}
              onChange={(e) => handleChange('note', e.target.value)}
              placeholder="Enter notes about this lien..."
              className="min-h-[200px]"
            />
          </TabsContent>
        </Tabs>

        <div className="flex justify-end gap-2 pt-4 border-t border-border">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleSave}>
            OK
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default LienModal;
