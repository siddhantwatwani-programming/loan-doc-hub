import React, { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';

interface BrokerInfoFormProps {
  disabled?: boolean;
}

export const BrokerInfoForm: React.FC<BrokerInfoFormProps> = ({ disabled = false }) => {
  const [formData, setFormData] = useState({
    brokerId: '',
    license: '',
    company: '',
    firstName: '',
    middleName: '',
    lastName: '',
    email: '',
    street: '',
    city: '',
    state: '',
    zip: '',
    taxIdType: '',
    taxId: '',
    issue1099: '',
    phoneHome: '',
    phoneWork: '',
    phoneCell: '',
    phoneFax: '',
    preferredHome: false,
    preferredWork: false,
    preferredCell: false,
    preferredFax: false,
    paymentNotification: false,
    lateNotice: false,
    lenderStatement: false,
    borrowerStatement: false,
    maturityNotice: false,
  });

  const handleChange = (field: string, value: string | boolean) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  return (
    <div className="space-y-6">
      {/* Form grid layout matching screenshot */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Column 1 - Name Section */}
        <div className="space-y-4">
          <h3 className="font-semibold text-sm text-foreground border-b border-border pb-2">Name</h3>
          
          <div className="space-y-2">
            <Label htmlFor="brokerId" className="text-sm">Broker ID <span className="text-destructive">*</span></Label>
            <Input
              id="brokerId"
              value={formData.brokerId}
              onChange={(e) => handleChange('brokerId', e.target.value)}
              disabled={disabled}
              className="h-9"
              placeholder="Enter broker ID"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="license" className="text-sm">License:</Label>
            <Input
              id="license"
              value={formData.license}
              onChange={(e) => handleChange('license', e.target.value)}
              disabled={disabled}
              className="h-9"
              placeholder="Enter license number"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="company" className="text-sm">Company</Label>
            <Input
              id="company"
              value={formData.company}
              onChange={(e) => handleChange('company', e.target.value)}
              disabled={disabled}
              className="h-9"
              placeholder="Enter company name"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="firstName" className="text-sm">First</Label>
            <Input
              id="firstName"
              value={formData.firstName}
              onChange={(e) => handleChange('firstName', e.target.value)}
              disabled={disabled}
              className="h-9"
              placeholder="Enter first name"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="middleName" className="text-sm">Middle</Label>
            <Input
              id="middleName"
              value={formData.middleName}
              onChange={(e) => handleChange('middleName', e.target.value)}
              disabled={disabled}
              className="h-9"
              placeholder="Enter middle name"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="lastName" className="text-sm">Last</Label>
            <Input
              id="lastName"
              value={formData.lastName}
              onChange={(e) => handleChange('lastName', e.target.value)}
              disabled={disabled}
              className="h-9"
              placeholder="Enter last name"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="email" className="text-sm">Email</Label>
            <Input
              id="email"
              type="email"
              value={formData.email}
              onChange={(e) => handleChange('email', e.target.value)}
              disabled={disabled}
              className="h-9"
              placeholder="Enter email address"
            />
          </div>
        </div>

        {/* Column 2 - Primary Address Section */}
        <div className="space-y-4">
          <h3 className="font-semibold text-sm text-foreground border-b border-border pb-2">Primary Address</h3>
          
          <div className="space-y-2">
            <Label htmlFor="street" className="text-sm">Street</Label>
            <Input
              id="street"
              value={formData.street}
              onChange={(e) => handleChange('street', e.target.value)}
              disabled={disabled}
              className="h-9"
              placeholder="Enter street address"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="city" className="text-sm">City</Label>
            <Input
              id="city"
              value={formData.city}
              onChange={(e) => handleChange('city', e.target.value)}
              disabled={disabled}
              className="h-9"
              placeholder="Enter city"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="state" className="text-sm">State</Label>
            <Input
              id="state"
              value={formData.state}
              onChange={(e) => handleChange('state', e.target.value)}
              disabled={disabled}
              className="h-9"
              placeholder="Enter state"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="zip" className="text-sm">ZIP</Label>
            <Input
              id="zip"
              value={formData.zip}
              onChange={(e) => handleChange('zip', e.target.value)}
              disabled={disabled}
              className="h-9"
              placeholder="Enter ZIP code"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="taxIdType" className="text-sm">Tax ID Type</Label>
            <Input
              id="taxIdType"
              value={formData.taxIdType}
              onChange={(e) => handleChange('taxIdType', e.target.value)}
              disabled={disabled}
              className="h-9"
              placeholder="Enter tax ID type"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="taxId" className="text-sm">Tax ID</Label>
            <Input
              id="taxId"
              value={formData.taxId}
              onChange={(e) => handleChange('taxId', e.target.value)}
              disabled={disabled}
              className="h-9"
              placeholder="Enter tax ID"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="issue1099" className="text-sm">Issue 1099</Label>
            <Input
              id="issue1099"
              value={formData.issue1099}
              onChange={(e) => handleChange('issue1099', e.target.value)}
              disabled={disabled}
              className="h-9"
              placeholder="Enter 1099 status"
            />
          </div>
        </div>

        {/* Column 3 - Phone Section */}
        <div className="space-y-4">
          <h3 className="font-semibold text-sm text-foreground border-b border-border pb-2">Phone</h3>
          
          <div className="flex items-center gap-4">
            <div className="flex-1 space-y-2">
              <Label htmlFor="phoneHome" className="text-sm">Home</Label>
              <Input
                id="phoneHome"
                type="tel"
                value={formData.phoneHome}
                onChange={(e) => handleChange('phoneHome', e.target.value)}
                disabled={disabled}
                className="h-9"
                placeholder="Enter home phone"
              />
            </div>
          </div>

          <div className="flex items-center gap-4">
            <div className="flex-1 space-y-2">
              <Label htmlFor="phoneWork" className="text-sm">Work</Label>
              <Input
                id="phoneWork"
                type="tel"
                value={formData.phoneWork}
                onChange={(e) => handleChange('phoneWork', e.target.value)}
                disabled={disabled}
                className="h-9"
                placeholder="Enter work phone"
              />
            </div>
          </div>

          <div className="flex items-center gap-4">
            <div className="flex-1 space-y-2">
              <Label htmlFor="phoneCell" className="text-sm">Cell</Label>
              <Input
                id="phoneCell"
                type="tel"
                value={formData.phoneCell}
                onChange={(e) => handleChange('phoneCell', e.target.value)}
                disabled={disabled}
                className="h-9"
                placeholder="Enter cell phone"
              />
            </div>
          </div>

          <div className="flex items-center gap-4">
            <div className="flex-1 space-y-2">
              <Label htmlFor="phoneFax" className="text-sm">Fax</Label>
              <Input
                id="phoneFax"
                type="tel"
                value={formData.phoneFax}
                onChange={(e) => handleChange('phoneFax', e.target.value)}
                disabled={disabled}
                className="h-9"
                placeholder="Enter fax number"
              />
            </div>
          </div>

          {/* Send section */}
          <div className="space-y-3 pt-4">
            <Label className="text-sm font-medium">Send:</Label>
            
            <div className="flex items-center space-x-2">
              <Checkbox
                id="paymentNotification"
                checked={formData.paymentNotification}
                onCheckedChange={(checked) => handleChange('paymentNotification', !!checked)}
                disabled={disabled}
              />
              <Label htmlFor="paymentNotification" className="text-sm font-normal cursor-pointer">
                Payment Notification
              </Label>
            </div>

            <div className="flex items-center space-x-2">
              <Checkbox
                id="lateNotice"
                checked={formData.lateNotice}
                onCheckedChange={(checked) => handleChange('lateNotice', !!checked)}
                disabled={disabled}
              />
              <Label htmlFor="lateNotice" className="text-sm font-normal cursor-pointer">
                Late Notice
              </Label>
            </div>

            <div className="flex items-center space-x-2">
              <Checkbox
                id="lenderStatement"
                checked={formData.lenderStatement}
                onCheckedChange={(checked) => handleChange('lenderStatement', !!checked)}
                disabled={disabled}
              />
              <Label htmlFor="lenderStatement" className="text-sm font-normal cursor-pointer">
                Lender Statement
              </Label>
            </div>
          </div>
        </div>

        {/* Column 4 - Preferred Section */}
        <div className="space-y-4">
          <h3 className="font-semibold text-sm text-foreground border-b border-border pb-2">Preferred</h3>
          
          <div className="flex items-center space-x-2">
            <Checkbox
              id="preferredHome"
              checked={formData.preferredHome}
              onCheckedChange={(checked) => handleChange('preferredHome', !!checked)}
              disabled={disabled}
            />
            <Label htmlFor="preferredHome" className="text-sm font-normal cursor-pointer">
              Home
            </Label>
          </div>

          <div className="flex items-center space-x-2">
            <Checkbox
              id="preferredWork"
              checked={formData.preferredWork}
              onCheckedChange={(checked) => handleChange('preferredWork', !!checked)}
              disabled={disabled}
            />
            <Label htmlFor="preferredWork" className="text-sm font-normal cursor-pointer">
              Work
            </Label>
          </div>

          <div className="flex items-center space-x-2">
            <Checkbox
              id="preferredCell"
              checked={formData.preferredCell}
              onCheckedChange={(checked) => handleChange('preferredCell', !!checked)}
              disabled={disabled}
            />
            <Label htmlFor="preferredCell" className="text-sm font-normal cursor-pointer">
              Cell
            </Label>
          </div>

          <div className="flex items-center space-x-2">
            <Checkbox
              id="preferredFax"
              checked={formData.preferredFax}
              onCheckedChange={(checked) => handleChange('preferredFax', !!checked)}
              disabled={disabled}
            />
            <Label htmlFor="preferredFax" className="text-sm font-normal cursor-pointer">
              Fax
            </Label>
          </div>

          {/* Additional Send checkboxes in column 4 */}
          <div className="space-y-3 pt-8">
            <div className="flex items-center space-x-2">
              <Checkbox
                id="borrowerStatement"
                checked={formData.borrowerStatement}
                onCheckedChange={(checked) => handleChange('borrowerStatement', !!checked)}
                disabled={disabled}
              />
              <Label htmlFor="borrowerStatement" className="text-sm font-normal cursor-pointer">
                Borrower Statement
              </Label>
            </div>

            <div className="flex items-center space-x-2">
              <Checkbox
                id="maturityNotice"
                checked={formData.maturityNotice}
                onCheckedChange={(checked) => handleChange('maturityNotice', !!checked)}
                disabled={disabled}
              />
              <Label htmlFor="maturityNotice" className="text-sm font-normal cursor-pointer">
                Maturity Notice
              </Label>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BrokerInfoForm;
