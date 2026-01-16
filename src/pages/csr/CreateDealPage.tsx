import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { logDealCreated } from '@/hooks/useActivityLog';
import { ArrowLeft, Loader2, FolderOpen, Package, FileText } from 'lucide-react';
import { cn } from '@/lib/utils';

interface Packet {
  id: string;
  name: string;
  state: string;
  product_type: string;
  description: string | null;
}

const US_STATES = [
  { value: 'CA', label: 'California' },
  { value: 'TX', label: 'Texas' },
  { value: 'FL', label: 'Florida' },
  { value: 'NY', label: 'New York' },
  { value: 'AZ', label: 'Arizona' },
  { value: 'NV', label: 'Nevada' },
  { value: 'CO', label: 'Colorado' },
  { value: 'WA', label: 'Washington' },
  { value: 'OR', label: 'Oregon' },
  { value: 'GA', label: 'Georgia' },
];

const PRODUCT_TYPES = [
  { value: 'Conventional', label: 'Conventional' },
  { value: 'FHA', label: 'FHA' },
  { value: 'VA', label: 'VA' },
  { value: 'USDA', label: 'USDA' },
  { value: 'Jumbo', label: 'Jumbo' },
  { value: 'Reverse Mortgage', label: 'Reverse Mortgage' },
  { value: 'HELOC', label: 'HELOC' },
  { value: 'Construction', label: 'Construction' },
];

export const CreateDealPage: React.FC = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [packets, setPackets] = useState<Packet[]>([]);
  const [loadingPackets, setLoadingPackets] = useState(false);

  const [formData, setFormData] = useState({
    state: '',
    product_type: '',
    packet_id: '',
    mode: 'doc_prep' as 'doc_prep' | 'servicing_only',
  });

  // Fetch packets when state/product changes
  useEffect(() => {
    if (formData.state && formData.product_type) {
      fetchPackets();
    } else {
      setPackets([]);
      setFormData((prev) => ({ ...prev, packet_id: '' }));
    }
  }, [formData.state, formData.product_type]);

  const fetchPackets = async () => {
    setLoadingPackets(true);
    try {
      const { data, error } = await supabase
        .from('packets')
        .select('*')
        .eq('state', formData.state)
        .eq('product_type', formData.product_type)
        .eq('is_active', true)
        .order('name');

      if (error) throw error;
      setPackets(data || []);

      // Auto-select if only one packet
      if (data && data.length === 1) {
        setFormData((prev) => ({ ...prev, packet_id: data[0].id }));
      } else {
        setFormData((prev) => ({ ...prev, packet_id: '' }));
      }
    } catch (error) {
      console.error('Error fetching packets:', error);
    } finally {
      setLoadingPackets(false);
    }
  };

  const generateDealNumber = async (): Promise<string> => {
    const { data, error } = await supabase.rpc('generate_deal_number');
    if (error) throw error;
    return data;
  };

  const handleSubmit = async () => {
    if (!formData.state || !formData.product_type) {
      toast({
        title: 'Validation error',
        description: 'Please select a state and product type',
        variant: 'destructive',
      });
      return;
    }

    if (!formData.packet_id && packets.length > 0) {
      toast({
        title: 'Validation error',
        description: 'Please select a packet',
        variant: 'destructive',
      });
      return;
    }

    setLoading(true);
    try {
      const dealNumber = await generateDealNumber();

      const { data, error } = await supabase
        .from('deals')
        .insert({
          deal_number: dealNumber,
          state: formData.state,
          product_type: formData.product_type,
          packet_id: formData.packet_id || null,
          mode: formData.mode,
          status: 'draft',
          created_by: user?.id,
        })
        .select()
        .single();

      if (error) throw error;

      // Log the activity
      await logDealCreated(data.id, {
        dealNumber: dealNumber,
        state: formData.state,
        productType: formData.product_type,
        mode: formData.mode,
      });

      toast({ title: 'Deal created successfully' });
      navigate(`/deals/${data.id}`);
    } catch (error: any) {
      console.error('Error creating deal:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to create deal',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const selectedPacket = packets.find((p) => p.id === formData.packet_id);

  return (
    <div className="page-container max-w-3xl">
      <div className="mb-6">
        <Button variant="ghost" onClick={() => navigate('/deals')} className="gap-2 mb-4">
          <ArrowLeft className="h-4 w-4" />
          Back to Deals
        </Button>
        <h1 className="text-2xl font-bold text-foreground">Create New Deal</h1>
        <p className="text-muted-foreground mt-1">Start a new loan document package</p>
      </div>

      <div className="space-y-6">
        {/* Step 1: State & Product Type */}
        <div className="section-card">
          <div className="flex items-center gap-3 mb-4">
            <div className="h-8 w-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-sm font-medium">
              1
            </div>
            <h2 className="text-lg font-semibold text-foreground">Select State & Product</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>State *</Label>
              <Select
                value={formData.state}
                onValueChange={(value) => setFormData((prev) => ({ ...prev, state: value }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select state" />
                </SelectTrigger>
                <SelectContent>
                  {US_STATES.map((s) => (
                    <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Product Type *</Label>
              <Select
                value={formData.product_type}
                onValueChange={(value) => setFormData((prev) => ({ ...prev, product_type: value }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select product type" />
                </SelectTrigger>
                <SelectContent>
                  {PRODUCT_TYPES.map((p) => (
                    <SelectItem key={p.value} value={p.value}>{p.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>

        {/* Step 2: Select Packet */}
        <div className={cn(
          'section-card transition-opacity',
          (!formData.state || !formData.product_type) && 'opacity-50 pointer-events-none'
        )}>
          <div className="flex items-center gap-3 mb-4">
            <div className="h-8 w-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-sm font-medium">
              2
            </div>
            <h2 className="text-lg font-semibold text-foreground">Select Document Packet</h2>
          </div>

          {loadingPackets ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-primary" />
            </div>
          ) : packets.length === 0 ? (
            <div className="text-center py-8">
              <Package className="h-12 w-12 mx-auto text-muted-foreground mb-3" />
              <p className="text-muted-foreground">
                {formData.state && formData.product_type
                  ? `No packets available for ${formData.state} - ${formData.product_type}`
                  : 'Select state and product type first'}
              </p>
              <p className="text-sm text-muted-foreground mt-1">
                Contact an administrator to create a packet for this combination
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {packets.map((packet) => (
                <button
                  key={packet.id}
                  onClick={() => setFormData((prev) => ({ ...prev, packet_id: packet.id }))}
                  className={cn(
                    'p-4 rounded-lg border-2 text-left transition-all',
                    formData.packet_id === packet.id
                      ? 'border-primary bg-primary/5'
                      : 'border-border hover:border-primary/50'
                  )}
                >
                  <div className="flex items-start gap-3">
                    <Package className={cn(
                      'h-5 w-5 mt-0.5',
                      formData.packet_id === packet.id ? 'text-primary' : 'text-muted-foreground'
                    )} />
                    <div>
                      <p className="font-medium text-foreground">{packet.name}</p>
                      {packet.description && (
                        <p className="text-sm text-muted-foreground mt-1">{packet.description}</p>
                      )}
                    </div>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Step 3: Mode Selection */}
        <div className={cn(
          'section-card transition-opacity',
          (!formData.state || !formData.product_type) && 'opacity-50 pointer-events-none'
        )}>
          <div className="flex items-center gap-3 mb-4">
            <div className="h-8 w-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-sm font-medium">
              3
            </div>
            <h2 className="text-lg font-semibold text-foreground">Select Mode</h2>
          </div>

          <RadioGroup
            value={formData.mode}
            onValueChange={(value) => setFormData((prev) => ({ ...prev, mode: value as 'doc_prep' | 'servicing_only' }))}
            className="grid grid-cols-1 md:grid-cols-2 gap-3"
          >
            <label
              className={cn(
                'flex items-start gap-3 p-4 rounded-lg border-2 cursor-pointer transition-all',
                formData.mode === 'doc_prep'
                  ? 'border-primary bg-primary/5'
                  : 'border-border hover:border-primary/50'
              )}
            >
              <RadioGroupItem value="doc_prep" className="mt-1" />
              <div>
                <p className="font-medium text-foreground">Document Preparation</p>
                <p className="text-sm text-muted-foreground mt-1">
                  Full document generation and preparation workflow
                </p>
              </div>
            </label>
            <label
              className={cn(
                'flex items-start gap-3 p-4 rounded-lg border-2 cursor-pointer transition-all',
                formData.mode === 'servicing_only'
                  ? 'border-primary bg-primary/5'
                  : 'border-border hover:border-primary/50'
              )}
            >
              <RadioGroupItem value="servicing_only" className="mt-1" />
              <div>
                <p className="font-medium text-foreground">Servicing Only</p>
                <p className="text-sm text-muted-foreground mt-1">
                  Data entry for loan servicing without document generation
                </p>
              </div>
            </label>
          </RadioGroup>
        </div>

        {/* Summary & Create */}
        <div className="section-card bg-muted/50">
          <h3 className="font-semibold text-foreground mb-3">Summary</h3>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <span className="text-muted-foreground">State:</span>
              <span className="ml-2 font-medium text-foreground">{formData.state || '—'}</span>
            </div>
            <div>
              <span className="text-muted-foreground">Product:</span>
              <span className="ml-2 font-medium text-foreground">{formData.product_type || '—'}</span>
            </div>
            <div>
              <span className="text-muted-foreground">Packet:</span>
              <span className="ml-2 font-medium text-foreground">{selectedPacket?.name || '—'}</span>
            </div>
            <div>
              <span className="text-muted-foreground">Mode:</span>
              <span className="ml-2 font-medium text-foreground capitalize">
                {formData.mode === 'doc_prep' ? 'Doc Prep' : 'Servicing Only'}
              </span>
            </div>
          </div>
        </div>

        <div className="flex justify-end gap-3">
          <Button variant="outline" onClick={() => navigate('/deals')} disabled={loading}>
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={loading || !formData.state || !formData.product_type}
            className="gap-2"
          >
            {loading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Creating...
              </>
            ) : (
              <>
                <FolderOpen className="h-4 w-4" />
                Create Deal
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
};

export default CreateDealPage;
