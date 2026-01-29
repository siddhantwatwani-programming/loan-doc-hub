import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { logDealCreated } from '@/hooks/useActivityLog';
import { ArrowLeft, Loader2, FolderOpen } from 'lucide-react';

export const CreateDealPage: React.FC = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);

  const generateDealNumber = async (): Promise<string> => {
    const { data, error } = await supabase.rpc('generate_deal_number');
    if (error) throw error;
    return data;
  };

  const handleCreateDeal = async () => {
    setLoading(true);
    try {
      const dealNumber = await generateDealNumber();

      const { data, error } = await supabase
        .from('deals')
        .insert({
          deal_number: dealNumber,
          state: 'TBD',
          product_type: 'TBD',
          mode: 'doc_prep',
          status: 'draft',
          created_by: user?.id,
        })
        .select()
        .single();

      if (error) throw error;

      // Log the activity
      await logDealCreated(data.id, {
        dealNumber: dealNumber,
        state: 'TBD',
        productType: 'TBD',
        mode: 'doc_prep',
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

  return (
    <div className="page-container max-w-xl">
      <div className="mb-6">
        <Button variant="ghost" onClick={() => navigate('/deals')} className="gap-2 mb-4">
          <ArrowLeft className="h-4 w-4" />
          Back to Deals
        </Button>
        <h1 className="text-2xl font-bold text-foreground">Create New Deal</h1>
        <p className="text-muted-foreground mt-1">Start a new loan document package</p>
      </div>

      <div className="section-card">
        <p className="text-muted-foreground mb-6">
          Click the button below to create a new deal. You'll be taken to the deal page where you can fill in all the required information.
        </p>

        <div className="flex gap-3">
          <Button variant="outline" onClick={() => navigate('/deals')} disabled={loading}>
            Cancel
          </Button>
          <Button onClick={handleCreateDeal} disabled={loading} className="gap-2">
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
