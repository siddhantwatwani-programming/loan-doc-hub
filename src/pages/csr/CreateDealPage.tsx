import React, { useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { logDealCreated } from '@/hooks/useActivityLog';
import { Loader2 } from 'lucide-react';

export const CreateDealPage: React.FC = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user } = useAuth();
  const startedRef = useRef(false);

  const generateDealNumber = async (): Promise<string> => {
    const { data, error } = await supabase.rpc('generate_deal_number');
    if (error) throw error;
    return data;
  };

  useEffect(() => {
    if (startedRef.current) return;
    startedRef.current = true;

    (async () => {
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

        await logDealCreated(data.id, {
          dealNumber,
          state: 'TBD',
          productType: 'TBD',
          mode: 'doc_prep',
        });

        toast({ title: 'File created successfully' });
        navigate(`/deals/${data.id}`, { replace: true });
      } catch (error: any) {
        console.error('Error creating deal:', error);
        toast({
          title: 'Error',
          description: error.message || 'Failed to create file',
          variant: 'destructive',
        });
        navigate('/deals', { replace: true });
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="page-container max-w-xl">
      <div className="flex items-center gap-2 text-muted-foreground">
        <Loader2 className="h-4 w-4 animate-spin" />
        Creating file...
      </div>
    </div>
  );
};

export default CreateDealPage;
