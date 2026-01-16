import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useDealFields } from '@/hooks/useDealFields';
import { useEntryOrchestration } from '@/hooks/useEntryOrchestration';
import { useAuth } from '@/contexts/AuthContext';
import { DealSectionTab } from '@/components/deal/DealSectionTab';
import { 
  logDealUpdated, 
  logDealMarkedReady, 
  logDealRevertedToDraft 
} from '@/hooks/useActivityLog';
import { 
  ArrowLeft, 
  Loader2, 
  Save,
  CheckCircle2,
  AlertCircle,
  AlertTriangle,
  ChevronRight,
  Clock,
  Lock
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { getRoleDisplayName } from '@/lib/accessControl';
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
  const { isExternalUser, isInternalUser } = useAuth();
  
  const [deal, setDeal] = useState<Deal | null>(null);
  const [dealLoading, setDealLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<string>('');
  const [showValidation, setShowValidation] = useState(false);
  const [markingReady, setMarkingReady] = useState(false);
  const [completingSection, setCompletingSection] = useState(false);

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
    visibleFieldKeys,
    requiredFieldKeys,
    loading: fieldsLoading,
    saving,
    isDirty,
    updateValue,
    saveDraft,
    getMissingRequiredFields,
    isSectionComplete,
    isPacketComplete,
    hasRequiredFieldChanged,
    resetDirty,
    computeCalculatedFields,
    calculationResults,
  } = useDealFields(id || '', deal?.packet_id || null);

  // Entry orchestration for external users
  const {
    mode: orchestrationMode,
    canEdit: orchestrationCanEdit,
    isWaiting,
    currentParticipant,
    blockingParticipant,
    hasCompleted,
    loading: orchestrationLoading,
    completeSection,
  } = useEntryOrchestration(id || '');

  // Set initial active tab when sections load
  useEffect(() => {
    if (sections.length > 0 && !activeTab) {
      setActiveTab(sections[0]);
    }
  }, [sections, activeTab]);

  // Auto-revert to Draft if a required field is changed when status is Ready or Generated
  useEffect(() => {
    if ((deal?.status === 'ready' || deal?.status === 'generated') && hasRequiredFieldChanged() && isDirty) {
      // Revert status to draft
      revertToDraft();
    }
  }, [values, deal?.status, hasRequiredFieldChanged, isDirty]);

  const revertToDraft = async () => {
    const wasGenerated = deal?.status === 'generated';
    
    try {
      const { error } = await supabase
        .from('deals')
        .update({ status: 'draft' })
        .eq('id', id);

      if (error) throw error;

      // Log the revert
      if (id) {
        await logDealRevertedToDraft(id, {
          reason: wasGenerated 
            ? 'Required field modified after documents were generated'
            : 'Required field modified after ready status',
          previousStatus: deal?.status,
        });
      }

      setDeal(prev => prev ? { ...prev, status: 'draft' } : null);
      
      toast({
        title: 'Status changed to Draft',
        description: wasGenerated
          ? 'Deal status was reverted because a required field was modified. Documents should be regenerated.'
          : 'Deal status was reverted because a required field was modified',
        variant: wasGenerated ? 'destructive' : 'default',
      });
    } catch (error) {
      console.error('Error reverting to draft:', error);
    }
  };

  const handleSave = async () => {
    setShowValidation(true);
    // Run calculations before saving
    computeCalculatedFields();
    const success = await saveDraft();
    if (success) {
      // Log the save activity
      if (id) {
        const filledCount = Object.values(values).filter(v => v && v.trim() !== '').length;
        await logDealUpdated(id, {
          fieldsUpdated: filledCount,
          fieldsTotal: visibleFieldKeys.length,
        });
      }
      
      resetDirty();
      // Refresh deal to get updated timestamp
      fetchDeal();
      const missing = getMissingRequiredFields();
      if (missing.length > 0) {
        toast({
          title: 'Saved with incomplete fields',
          description: `${missing.length} required field${missing.length > 1 ? 's' : ''} still missing`,
          variant: 'default',
        });
      }
    }
  };

  const handleMarkReady = async () => {
    if (!isPacketComplete()) {
      toast({
        title: 'Cannot mark ready',
        description: 'Please complete all required fields first',
        variant: 'destructive',
      });
      return;
    }

    setMarkingReady(true);
    try {
      // Run calculations before saving
      computeCalculatedFields();
      
      // Save first
      const saveSuccess = await saveDraft();
      if (!saveSuccess) return;

      // Update deal status to ready
      const { error } = await supabase
        .from('deals')
        .update({ status: 'ready' })
        .eq('id', id);

      if (error) throw error;

      // Log the mark ready activity
      if (id) {
        await logDealMarkedReady(id, {
          requiredFieldsCount: requiredFieldKeys.length,
        });
      }

      resetDirty();
      toast({
        title: 'Deal marked as ready',
        description: 'All required fields are complete',
      });

      // Update local state
      setDeal(prev => prev ? { ...prev, status: 'ready' } : null);
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to mark deal as ready',
        variant: 'destructive',
      });
    } finally {
      setMarkingReady(false);
    }
  };

  const jumpToFirstMissing = () => {
    const missing = getMissingRequiredFields();
    if (missing.length === 0) return;

    const firstMissing = missing[0];
    // Switch to the tab containing the first missing field
    setActiveTab(firstMissing.section);
    setShowValidation(true);

    // Scroll to the field after tab switch
    setTimeout(() => {
      const element = document.getElementById(`field-${firstMissing.field_key}`);
      if (element) {
        element.scrollIntoView({ behavior: 'smooth', block: 'center' });
        // Focus the input
        const input = element.querySelector('input, textarea');
        if (input) {
          (input as HTMLElement).focus();
        }
      }
    }, 100);
  };

  // Handle Complete Section for external users
  const handleCompleteSection = async () => {
    // Validate that required fields visible to this user are filled
    const missing = getMissingRequiredFields();
    if (missing.length > 0) {
      setShowValidation(true);
      toast({
        title: 'Cannot complete section',
        description: `Please fill in all ${missing.length} required field(s) first`,
        variant: 'destructive',
      });
      return;
    }

    setCompletingSection(true);
    try {
      // Save first
      computeCalculatedFields();
      const saveSuccess = await saveDraft();
      if (!saveSuccess) {
        throw new Error('Failed to save changes');
      }

      // Complete the section
      const success = await completeSection();
      if (!success) {
        throw new Error('Failed to complete section');
      }

      toast({
        title: 'Section completed',
        description: 'Thank you! Your section has been submitted successfully.',
      });

      resetDirty();
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to complete section',
        variant: 'destructive',
      });
    } finally {
      setCompletingSection(false);
    }
  };

  const totalMissing = getMissingRequiredFields().length;
  const canMarkReady = isPacketComplete() && deal?.status === 'draft';
  const showCompleteSectionButton = isExternalUser && currentParticipant && !hasCompleted && orchestrationCanEdit;

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
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold text-foreground">Enter Deal Data</h1>
              {deal.status !== 'draft' && (
                <Badge variant={deal.status === 'ready' ? 'default' : 'secondary'} className="capitalize">
                  {deal.status}
                </Badge>
              )}
            </div>
            <p className="text-muted-foreground mt-1">
              {deal.deal_number} • {deal.state} • {deal.product_type}
            </p>
          </div>
          
          <div className="flex items-center gap-3">
            {/* Save button - always visible unless completed */}
            {(!isExternalUser || !hasCompleted) && (
              <Button 
                onClick={handleSave} 
                disabled={saving || (isExternalUser && !orchestrationCanEdit)} 
                variant="outline"
                className="gap-2"
              >
                {saving ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Save className="h-4 w-4" />
                )}
                Save Draft
              </Button>
            )}
            
            {/* Mark Ready button - CSR only */}
            {isInternalUser && (
              <Button 
                onClick={handleMarkReady} 
                disabled={!canMarkReady || markingReady || saving}
                className="gap-2"
              >
                {markingReady ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <CheckCircle2 className="h-4 w-4" />
                )}
                Mark Deal Ready
              </Button>
            )}

            {/* Complete Section button - External users only */}
            {showCompleteSectionButton && (
              <Button 
                onClick={handleCompleteSection} 
                disabled={completingSection || saving || totalMissing > 0}
                className="gap-2"
              >
                {completingSection ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <CheckCircle2 className="h-4 w-4" />
                )}
                Complete Section
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* Missing Fields Banner */}
      {!fieldsLoading && fields.length > 0 && (
        <div className={cn(
          'mb-6 px-4 py-3 rounded-lg flex items-center justify-between',
          totalMissing > 0 ? 'bg-warning/10 border border-warning/20' : 'bg-success/10 border border-success/20'
        )}>
          <div className="flex items-center gap-3">
            {totalMissing > 0 ? (
              <>
                <AlertTriangle className="h-5 w-5 text-warning" />
                <div>
                  <p className="font-medium text-foreground">
                    Missing {totalMissing} required field{totalMissing > 1 ? 's' : ''}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    Complete all required fields to mark deal as ready
                  </p>
                </div>
              </>
            ) : (
              <>
                <CheckCircle2 className="h-5 w-5 text-success" />
                <div>
                  <p className="font-medium text-foreground">All required fields complete</p>
                  <p className="text-sm text-muted-foreground">
                    {requiredFieldKeys.length} required field{requiredFieldKeys.length > 1 ? 's' : ''} filled
                  </p>
                </div>
              </>
            )}
          </div>
          
          {totalMissing > 0 && (
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={jumpToFirstMissing}
              className="gap-1 text-warning hover:text-warning hover:bg-warning/10"
            >
              Jump to first missing
              <ChevronRight className="h-4 w-4" />
            </Button>
          )}
        </div>
      )}

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
                const sectionMissing = getMissingRequiredFields(section).length;
                const isComplete = sectionMissing === 0;
                const sectionFields = fieldsBySection[section] || [];
                const hasRequiredFields = sectionFields.some(f => f.is_required);
                
                return (
                  <TabsTrigger
                    key={section}
                    value={section}
                    className={cn(
                      'gap-2 data-[state=active]:bg-background relative',
                      !isComplete && hasRequiredFields && showValidation && 'text-warning'
                    )}
                  >
                    {SECTION_LABELS[section]}
                    
                    {/* Badge with missing count */}
                    {!isComplete && hasRequiredFields && (
                      <Badge 
                        variant="destructive" 
                        className="h-5 min-w-[20px] px-1.5 text-xs font-medium"
                      >
                        {sectionMissing}
                      </Badge>
                    )}
                    
                    {/* Checkmark when complete */}
                    {isComplete && hasRequiredFields && (
                      <CheckCircle2 className="h-4 w-4 text-success" />
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
                  showValidation={showValidation}
                  calculationResults={calculationResults}
                  orchestrationCanEdit={orchestrationCanEdit}
                  isWaitingForPrevious={isWaiting}
                  blockingRole={blockingParticipant?.role}
                  hasCompleted={hasCompleted}
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
