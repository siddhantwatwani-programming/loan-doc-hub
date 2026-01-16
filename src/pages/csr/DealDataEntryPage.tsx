import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useDealFields } from '@/hooks/useDealFields';
import { DealSectionTab } from '@/components/deal/DealSectionTab';
import { 
  ArrowLeft, 
  Loader2, 
  Save,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';
import { cn } from '@/lib/utils';
import type { Database } from '@/integrations/supabase/types';

type FieldSection = Database['public']['Enums']['field_section'];

interface Deal {
  id: string;
  deal_number: string;
  state: string;
  product_type: string;
  mode: 'doc_prep' | 'servicing_only';
  status: 'draft' | 'ready' | 'generated';
  packet_id: string | null;
}

// Section labels for display
const SECTION_LABELS: Record<FieldSection, string> = {
  borrower: 'Borrower',
  co_borrower: 'Co-Borrower',
  property: 'Property',
  loan_terms: 'Loan Terms',
  seller: 'Seller',
  title: 'Title',
  escrow: 'Escrow',
  other: 'Other',
};

export const DealDataEntryPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const [deal, setDeal] = useState<Deal | null>(null);
  const [dealLoading, setDealLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<string>('');

  // Fetch deal info
  useEffect(() => {
    if (id) {
      fetchDeal();
    }
  }, [id]);

  const fetchDeal = async () => {
    try {
      const { data, error } = await supabase
        .from('deals')
        .select('id, deal_number, state, product_type, mode, status, packet_id')
        .eq('id', id)
        .single();

      if (error) throw error;
      setDeal(data);
    } catch (error) {
      console.error('Error fetching deal:', error);
      toast({
        title: 'Error',
        description: 'Failed to load deal',
        variant: 'destructive',
      });
    } finally {
      setDealLoading(false);
    }
  };

  const {
    fields,
    fieldsBySection,
    sections,
    values,
    loading: fieldsLoading,
    saving,
    updateValue,
    saveDraft,
    getMissingRequiredFields,
    isSectionComplete,
  } = useDealFields(id || '', deal?.packet_id || null);

  // Set initial active tab when sections load
  useEffect(() => {
    if (sections.length > 0 && !activeTab) {
      setActiveTab(sections[0]);
    }
  }, [sections, activeTab]);

  const handleSave = async () => {
    const success = await saveDraft();
    if (success) {
      // Optionally navigate back or stay
    }
  };

  const totalMissing = getMissingRequiredFields().length;

  if (dealLoading) {
    return (
      <div className="page-container flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!deal) {
    return (
      <div className="page-container text-center py-16">
        <AlertCircle className="h-12 w-12 mx-auto text-destructive mb-4" />
        <h2 className="text-xl font-semibold text-foreground mb-2">Deal Not Found</h2>
        <p className="text-muted-foreground mb-4">The deal you're looking for doesn't exist.</p>
        <Button onClick={() => navigate('/deals')}>Back to Deals</Button>
      </div>
    );
  }

  if (!deal.packet_id) {
    return (
      <div className="page-container text-center py-16">
        <AlertCircle className="h-12 w-12 mx-auto text-warning mb-4" />
        <h2 className="text-xl font-semibold text-foreground mb-2">No Packet Assigned</h2>
        <p className="text-muted-foreground mb-4">This deal doesn't have a packet assigned. Please assign a packet first.</p>
        <Button onClick={() => navigate(`/deals/${deal.id}`)}>Back to Deal</Button>
      </div>
    );
  }

  return (
    <div className="page-container">
      {/* Header */}
      <div className="mb-6">
        <Button variant="ghost" onClick={() => navigate(`/deals/${deal.id}`)} className="gap-2 mb-4">
          <ArrowLeft className="h-4 w-4" />
          Back to Deal Overview
        </Button>
        
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Enter Deal Data</h1>
            <p className="text-muted-foreground mt-1">
              {deal.deal_number} • {deal.state} • {deal.product_type}
            </p>
          </div>
          
          <div className="flex items-center gap-3">
            {totalMissing > 0 ? (
              <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium bg-warning/10 text-warning">
                <AlertCircle className="h-4 w-4" />
                {totalMissing} required field{totalMissing > 1 ? 's' : ''} missing
              </span>
            ) : fields.length > 0 ? (
              <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium bg-success/10 text-success">
                <CheckCircle2 className="h-4 w-4" />
                All required fields complete
              </span>
            ) : null}
            
            <Button onClick={handleSave} disabled={saving} className="gap-2">
              {saving ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Save className="h-4 w-4" />
              )}
              Save Draft
            </Button>
          </div>
        </div>
      </div>

      {/* Content */}
      {fieldsLoading ? (
        <div className="section-card flex items-center justify-center min-h-[300px]">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      ) : sections.length === 0 ? (
        <div className="section-card text-center py-12">
          <AlertCircle className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
          <h3 className="text-lg font-semibold text-foreground mb-2">No Fields Configured</h3>
          <p className="text-muted-foreground">
            No fields have been mapped to the templates in this packet.
          </p>
        </div>
      ) : (
        <div className="section-card">
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="mb-6 flex flex-wrap h-auto gap-1 bg-muted/50 p-1">
              {sections.map(section => {
                const isComplete = isSectionComplete(section);
                const sectionFields = fieldsBySection[section] || [];
                const requiredCount = sectionFields.filter(f => f.is_required).length;
                
                return (
                  <TabsTrigger
                    key={section}
                    value={section}
                    className={cn(
                      'gap-2 data-[state=active]:bg-background',
                      !isComplete && requiredCount > 0 && 'text-warning'
                    )}
                  >
                    {SECTION_LABELS[section]}
                    {!isComplete && requiredCount > 0 && (
                      <AlertCircle className="h-3.5 w-3.5" />
                    )}
                    {isComplete && requiredCount > 0 && (
                      <CheckCircle2 className="h-3.5 w-3.5 text-success" />
                    )}
                  </TabsTrigger>
                );
              })}
            </TabsList>

            {sections.map(section => (
              <TabsContent key={section} value={section} className="animate-fade-in">
                <DealSectionTab
                  fields={fieldsBySection[section] || []}
                  values={values}
                  onValueChange={updateValue}
                  missingRequiredFields={getMissingRequiredFields(section)}
                />
              </TabsContent>
            ))}
          </Tabs>
        </div>
      )}
    </div>
  );
};

export default DealDataEntryPage;
