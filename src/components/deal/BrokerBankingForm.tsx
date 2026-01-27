import React, { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';

interface BrokerBankingFormProps {
  disabled?: boolean;
}

export const BrokerBankingForm: React.FC<BrokerBankingFormProps> = ({ disabled = false }) => {
  const [formData, setFormData] = useState({
    // ACH Section
    achStatus: '',
    bank: '',
    routingNumber: '',
    accountNumber: '',
    type: '',
    name: '',
    id: '',
    furtherCreditTo: '',
    // Check/Mailing Section
    byCheck: false,
    sameAsMailing: false,
    address: '',
    city: '',
    zipCode: '',
    achEmail1: '',
    achEmail2: '',
    // Credit Card Section
    cardName: '',
    cardNumber: '',
    securityCode: '',
    expiration: '',
    ccZipCode: '',
  });

  const handleChange = (field: string, value: string | boolean) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  return (
    <div className="space-y-6">
      {/* Three column layout matching screenshot */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Column 1 - ACH Section */}
        <div className="space-y-4">
          <h3 className="font-semibold text-sm text-foreground border-b border-border pb-2">ACH / Banking</h3>
          
          <div className="space-y-2">
            <Label htmlFor="achStatus" className="text-sm">ACH Status</Label>
            <Input
              id="achStatus"
              value={formData.achStatus}
              onChange={(e) => handleChange('achStatus', e.target.value)}
              disabled={disabled}
              className="h-9"
              placeholder="Enter ACH status"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="bank" className="text-sm">Bank</Label>
            <Input
              id="bank"
              value={formData.bank}
              onChange={(e) => handleChange('bank', e.target.value)}
              disabled={disabled}
              className="h-9"
              placeholder="Enter bank name"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="routingNumber" className="text-sm">Routing Number</Label>
            <Input
              id="routingNumber"
              value={formData.routingNumber}
              onChange={(e) => handleChange('routingNumber', e.target.value)}
              disabled={disabled}
              className="h-9"
              placeholder="Enter routing number"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="accountNumber" className="text-sm">Account Number</Label>
            <Input
              id="accountNumber"
              value={formData.accountNumber}
              onChange={(e) => handleChange('accountNumber', e.target.value)}
              disabled={disabled}
              className="h-9"
              placeholder="Enter account number"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="type" className="text-sm">Type</Label>
            <Input
              id="type"
              value={formData.type}
              onChange={(e) => handleChange('type', e.target.value)}
              disabled={disabled}
              className="h-9"
              placeholder="Enter account type"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="achName" className="text-sm">Name</Label>
            <Input
              id="achName"
              value={formData.name}
              onChange={(e) => handleChange('name', e.target.value)}
              disabled={disabled}
              className="h-9"
              placeholder="Enter account name"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="achId" className="text-sm">ID</Label>
            <Input
              id="achId"
              value={formData.id}
              onChange={(e) => handleChange('id', e.target.value)}
              disabled={disabled}
              className="h-9"
              placeholder="Enter ID"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="furtherCreditTo" className="text-sm">Further Credit To</Label>
            <Input
              id="furtherCreditTo"
              value={formData.furtherCreditTo}
              onChange={(e) => handleChange('furtherCreditTo', e.target.value)}
              disabled={disabled}
              className="h-9"
              placeholder="Enter further credit info"
            />
          </div>
        </div>

        {/* Column 2 - Check/Mailing Section */}
        <div className="space-y-4">
          <h3 className="font-semibold text-sm text-foreground border-b border-border pb-2">Check / Mailing</h3>
          
          <div className="flex items-center space-x-2">
            <Checkbox
              id="byCheck"
              checked={formData.byCheck}
              onCheckedChange={(checked) => handleChange('byCheck', !!checked)}
              disabled={disabled}
            />
            <Label htmlFor="byCheck" className="text-sm font-normal cursor-pointer">
              By Check
            </Label>
          </div>

          <div className="flex items-center space-x-2">
            <Checkbox
              id="sameAsMailing"
              checked={formData.sameAsMailing}
              onCheckedChange={(checked) => handleChange('sameAsMailing', !!checked)}
              disabled={disabled}
            />
            <Label htmlFor="sameAsMailing" className="text-sm font-normal cursor-pointer">
              Same as Mailing
            </Label>
          </div>

          <div className="space-y-2">
            <Label htmlFor="checkAddress" className="text-sm">Address</Label>
            <Input
              id="checkAddress"
              value={formData.address}
              onChange={(e) => handleChange('address', e.target.value)}
              disabled={disabled}
              className="h-9"
              placeholder="Enter mailing address"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="checkCity" className="text-sm">City</Label>
            <Input
              id="checkCity"
              value={formData.city}
              onChange={(e) => handleChange('city', e.target.value)}
              disabled={disabled}
              className="h-9"
              placeholder="Enter city"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="checkZipCode" className="text-sm">Zip Code</Label>
            <Input
              id="checkZipCode"
              value={formData.zipCode}
              onChange={(e) => handleChange('zipCode', e.target.value)}
              disabled={disabled}
              className="h-9"
              placeholder="Enter ZIP code"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="achEmail1" className="text-sm">Add ACH Email</Label>
            <Input
              id="achEmail1"
              type="email"
              value={formData.achEmail1}
              onChange={(e) => handleChange('achEmail1', e.target.value)}
              disabled={disabled}
              className="h-9"
              placeholder="Enter ACH email"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="achEmail2" className="text-sm">Add ACH Email</Label>
            <Input
              id="achEmail2"
              type="email"
              value={formData.achEmail2}
              onChange={(e) => handleChange('achEmail2', e.target.value)}
              disabled={disabled}
              className="h-9"
              placeholder="Enter ACH email"
            />
          </div>
        </div>

        {/* Column 3 - Credit Card Section */}
        <div className="space-y-4">
          <h3 className="font-semibold text-sm text-foreground border-b border-border pb-2">Credit Card</h3>
          
          <div className="space-y-2">
            <Label htmlFor="cardName" className="text-sm">Name</Label>
            <Input
              id="cardName"
              value={formData.cardName}
              onChange={(e) => handleChange('cardName', e.target.value)}
              disabled={disabled}
              className="h-9"
              placeholder="Enter cardholder name"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="cardNumber" className="text-sm">Card Number</Label>
            <Input
              id="cardNumber"
              value={formData.cardNumber}
              onChange={(e) => handleChange('cardNumber', e.target.value)}
              disabled={disabled}
              className="h-9"
              placeholder="Enter card number"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="securityCode" className="text-sm">Security Code</Label>
            <Input
              id="securityCode"
              value={formData.securityCode}
              onChange={(e) => handleChange('securityCode', e.target.value)}
              disabled={disabled}
              className="h-9"
              type="password"
              placeholder="Enter CVV"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="expiration" className="text-sm">Expiration</Label>
            <Input
              id="expiration"
              value={formData.expiration}
              onChange={(e) => handleChange('expiration', e.target.value)}
              disabled={disabled}
              className="h-9"
              placeholder="MM/YY"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="ccZipCode" className="text-sm">Zip Code</Label>
            <Input
              id="ccZipCode"
              value={formData.ccZipCode}
              onChange={(e) => handleChange('ccZipCode', e.target.value)}
              disabled={disabled}
              className="h-9"
              placeholder="Enter billing ZIP"
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default BrokerBankingForm;
