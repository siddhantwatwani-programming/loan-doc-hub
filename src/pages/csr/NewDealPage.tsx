import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { ArrowLeft, Save, Loader2 } from 'lucide-react';
import { z } from 'zod';

const dealSchema = z.object({
  borrowerFirstName: z.string().trim().min(1, 'First name is required').max(50),
  borrowerLastName: z.string().trim().min(1, 'Last name is required').max(50),
  borrowerEmail: z.string().trim().email('Valid email is required'),
  borrowerPhone: z.string().trim().min(10, 'Valid phone number is required'),
  propertyAddress: z.string().trim().min(5, 'Property address is required'),
  propertyCity: z.string().trim().min(1, 'City is required'),
  propertyState: z.string().trim().min(1, 'State is required'),
  propertyZip: z.string().trim().min(5, 'ZIP code is required'),
  loanAmount: z.string().min(1, 'Loan amount is required'),
  loanType: z.string().min(1, 'Loan type is required'),
  notes: z.string().optional(),
});

export const NewDealPage: React.FC = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const [formData, setFormData] = useState({
    borrowerFirstName: '',
    borrowerLastName: '',
    borrowerEmail: '',
    borrowerPhone: '',
    propertyAddress: '',
    propertyCity: '',
    propertyState: '',
    propertyZip: '',
    loanAmount: '',
    loanType: '',
    notes: '',
  });

  const handleChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: '' }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});
    setIsLoading(true);

    const result = dealSchema.safeParse(formData);
    if (!result.success) {
      const fieldErrors: Record<string, string> = {};
      result.error.errors.forEach((err) => {
        if (err.path[0]) {
          fieldErrors[err.path[0].toString()] = err.message;
        }
      });
      setErrors(fieldErrors);
      setIsLoading(false);
      return;
    }

    // Simulate API call
    await new Promise((resolve) => setTimeout(resolve, 1000));

    toast({
      title: 'Deal created',
      description: 'The new deal has been saved as a draft.',
    });

    setIsLoading(false);
    navigate('/deals');
  };

  return (
    <div className="page-container">
      <div className="mb-6">
        <Button
          variant="ghost"
          onClick={() => navigate('/deals')}
          className="gap-2 mb-4"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Deals
        </Button>
        <h1 className="text-2xl font-bold text-foreground">New Deal</h1>
        <p className="text-muted-foreground mt-1">Enter borrower and loan information</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-8">
        {/* Borrower Information */}
        <div className="section-card">
          <h2 className="text-lg font-semibold text-foreground mb-4">Borrower Information</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="borrowerFirstName">First Name *</Label>
              <Input
                id="borrowerFirstName"
                value={formData.borrowerFirstName}
                onChange={(e) => handleChange('borrowerFirstName', e.target.value)}
                placeholder="John"
                disabled={isLoading}
              />
              {errors.borrowerFirstName && (
                <p className="text-sm text-destructive">{errors.borrowerFirstName}</p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="borrowerLastName">Last Name *</Label>
              <Input
                id="borrowerLastName"
                value={formData.borrowerLastName}
                onChange={(e) => handleChange('borrowerLastName', e.target.value)}
                placeholder="Smith"
                disabled={isLoading}
              />
              {errors.borrowerLastName && (
                <p className="text-sm text-destructive">{errors.borrowerLastName}</p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="borrowerEmail">Email *</Label>
              <Input
                id="borrowerEmail"
                type="email"
                value={formData.borrowerEmail}
                onChange={(e) => handleChange('borrowerEmail', e.target.value)}
                placeholder="john.smith@email.com"
                disabled={isLoading}
              />
              {errors.borrowerEmail && (
                <p className="text-sm text-destructive">{errors.borrowerEmail}</p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="borrowerPhone">Phone *</Label>
              <Input
                id="borrowerPhone"
                type="tel"
                value={formData.borrowerPhone}
                onChange={(e) => handleChange('borrowerPhone', e.target.value)}
                placeholder="(555) 123-4567"
                disabled={isLoading}
              />
              {errors.borrowerPhone && (
                <p className="text-sm text-destructive">{errors.borrowerPhone}</p>
              )}
            </div>
          </div>
        </div>

        {/* Property Information */}
        <div className="section-card">
          <h2 className="text-lg font-semibold text-foreground mb-4">Property Information</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="propertyAddress">Street Address *</Label>
              <Input
                id="propertyAddress"
                value={formData.propertyAddress}
                onChange={(e) => handleChange('propertyAddress', e.target.value)}
                placeholder="123 Main Street"
                disabled={isLoading}
              />
              {errors.propertyAddress && (
                <p className="text-sm text-destructive">{errors.propertyAddress}</p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="propertyCity">City *</Label>
              <Input
                id="propertyCity"
                value={formData.propertyCity}
                onChange={(e) => handleChange('propertyCity', e.target.value)}
                placeholder="Los Angeles"
                disabled={isLoading}
              />
              {errors.propertyCity && (
                <p className="text-sm text-destructive">{errors.propertyCity}</p>
              )}
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="propertyState">State *</Label>
                <Select
                  value={formData.propertyState}
                  onValueChange={(value) => handleChange('propertyState', value)}
                  disabled={isLoading}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="CA">California</SelectItem>
                    <SelectItem value="TX">Texas</SelectItem>
                    <SelectItem value="FL">Florida</SelectItem>
                    <SelectItem value="NY">New York</SelectItem>
                    <SelectItem value="AZ">Arizona</SelectItem>
                  </SelectContent>
                </Select>
                {errors.propertyState && (
                  <p className="text-sm text-destructive">{errors.propertyState}</p>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="propertyZip">ZIP Code *</Label>
                <Input
                  id="propertyZip"
                  value={formData.propertyZip}
                  onChange={(e) => handleChange('propertyZip', e.target.value)}
                  placeholder="90210"
                  disabled={isLoading}
                />
                {errors.propertyZip && (
                  <p className="text-sm text-destructive">{errors.propertyZip}</p>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Loan Information */}
        <div className="section-card">
          <h2 className="text-lg font-semibold text-foreground mb-4">Loan Information</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="loanAmount">Loan Amount *</Label>
              <Input
                id="loanAmount"
                type="number"
                value={formData.loanAmount}
                onChange={(e) => handleChange('loanAmount', e.target.value)}
                placeholder="450000"
                disabled={isLoading}
              />
              {errors.loanAmount && (
                <p className="text-sm text-destructive">{errors.loanAmount}</p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="loanType">Loan Type *</Label>
              <Select
                value={formData.loanType}
                onValueChange={(value) => handleChange('loanType', value)}
                disabled={isLoading}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select loan type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="conventional">Conventional</SelectItem>
                  <SelectItem value="fha">FHA</SelectItem>
                  <SelectItem value="va">VA</SelectItem>
                  <SelectItem value="jumbo">Jumbo</SelectItem>
                  <SelectItem value="usda">USDA</SelectItem>
                </SelectContent>
              </Select>
              {errors.loanType && (
                <p className="text-sm text-destructive">{errors.loanType}</p>
              )}
            </div>
            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="notes">Notes (Optional)</Label>
              <Textarea
                id="notes"
                value={formData.notes}
                onChange={(e) => handleChange('notes', e.target.value)}
                placeholder="Additional notes about this deal..."
                rows={4}
                disabled={isLoading}
              />
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex justify-end gap-3">
          <Button
            type="button"
            variant="outline"
            onClick={() => navigate('/deals')}
            disabled={isLoading}
          >
            Cancel
          </Button>
          <Button type="submit" disabled={isLoading} className="gap-2">
            {isLoading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <Save className="h-4 w-4" />
                Save Deal
              </>
            )}
          </Button>
        </div>
      </form>
    </div>
  );
};

export default NewDealPage;
