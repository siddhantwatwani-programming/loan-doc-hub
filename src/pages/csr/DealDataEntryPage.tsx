import React, { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useDealFields } from '@/hooks/useDealFields';
import { useEntryOrchestration } from '@/hooks/useEntryOrchestration';
import { useFieldPermissions } from '@/hooks/useFieldPermissions';
import { useExternalModificationDetector } from '@/hooks/useExternalModificationDetector';
import { useAuth } from '@/contexts/AuthContext';
import { DealSectionTab } from '@/components/deal/DealSectionTab';
import { BorrowerSectionContent } from '@/components/deal/BorrowerSectionContent';
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
  Lock,
  User,
  Eye
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

// Section labels for display (partial - only includes displayable main sections)
const SECTION_LABELS: Partial<Record<FieldSection, string>> = {
  borrower: 'Borrower',
  co_borrower: 'Co-Borrower',
  property: 'Property',
  loan_terms: 'Loan Terms',
  lender: 'Lenders',
  broker: 'Broker',
  charges: 'Charges',
  dates: 'Dates',
  escrow: 'Escrow',
  participants: 'Participants',
  notes: 'Notes',
  seller: 'Seller',
  title: 'Titles',
  other: 'Other',
  system: 'System',
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

  // Field permissions for filtering visible fields/sections
  const { checkCanView, loading: permissionsLoading } = useFieldPermissions();

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

  // External modification detection for CSR warning banner
  const {
    hasExternalModifications,
    externalModifications,
    markAsReviewed,
    loading: modificationsLoading,
  } = useExternalModificationDetector(id || '');

  // Calculate visible fields and sections for external users
  const { 
    visibleSections, 
    visibleFieldsBySection, 
    visibleRequiredCount,
    visibleFilledRequiredCount,
    externalMissingFields 
  } = useMemo(() => {
    if (!isExternalUser) {
      // Internal users see everything
      const totalRequired = fields.filter(f => f.is_required).length;
      const filledRequired = fields.filter(f => f.is_required && values[f.field_key]?.trim()).length;
      return {
        visibleSections: sections,
        visibleFieldsBySection: fieldsBySection,
        visibleRequiredCount: totalRequired,
        visibleFilledRequiredCount: filledRequired,
        externalMissingFields: getMissingRequiredFields(),
      };
    }

    // For external users, filter fields by allowed_roles
    const filteredBySection: Record<FieldSection, typeof fields> = {} as any;
    let totalVisible = 0;
    let requiredCount = 0;
    let filledRequired = 0;
    const missing: typeof fields = [];

    sections.forEach(section => {
      const sectionFields = fieldsBySection[section] || [];
      const visibleFields = sectionFields.filter(f => checkCanView(f.field_key));
      if (visibleFields.length > 0) {
        filteredBySection[section] = visibleFields;
        totalVisible += visibleFields.length;
        
        visibleFields.forEach(f => {
          if (f.is_required) {
            requiredCount++;
            if (values[f.field_key]?.trim()) {
              filledRequired++;
            } else {
              missing.push(f);
            }
          }
        });
      }
    });

    const visibleSectionList = sections.filter(s => filteredBySection[s]?.length > 0);

    return {
      visibleSections: visibleSectionList,
      visibleFieldsBySection: filteredBySection,
      visibleRequiredCount: requiredCount,
      visibleFilledRequiredCount: filledRequired,
      externalMissingFields: missing,
    };
  }, [isExternalUser, sections, fieldsBySection, fields, values, checkCanView, getMissingRequiredFields]);

  // Set initial active tab when sections load (use visible sections for external users)
  useEffect(() => {
    const targetSections = isExternalUser ? visibleSections : sections;
    if (targetSections.length > 0 && !activeTab) {
      setActiveTab(targetSections[0]);
    }
  }, [sections, visibleSections, activeTab, isExternalUser]);

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
    const missing = isExternalUser ? externalMissingFields : getMissingRequiredFields();
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

  // Calculate missing/progress based on user type
  const totalMissing = isExternalUser ? externalMissingFields.length : getMissingRequiredFields().length;
  const canMarkReady = isPacketComplete() && deal?.status === 'draft';
  const showCompleteSectionButton = isExternalUser && currentParticipant && !hasCompleted && orchestrationCanEdit;
  const progressPercent = visibleRequiredCount > 0 
    ? Math.round((visibleFilledRequiredCount / visibleRequiredCount) * 100) 
    : 100;

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
        {/* Back button - external users go to deals list, internal users go to deal overview */}
        <Button 
          variant="ghost" 
          onClick={() => navigate(isExternalUser ? '/deals' : `/deals/${deal.id}`)} 
          className="gap-2 mb-4"
        >
          <ArrowLeft className="h-4 w-4" />
          {isExternalUser ? 'Back to Deals' : 'Back to Deal Overview'}
        </Button>
        
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold text-foreground">
                {isExternalUser ? 'Complete Your Information' : 'Enter Deal Data'}
              </h1>
              {/* Show deal status for CSR only */}
              {isInternalUser && deal.status !== 'draft' && (
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

      {/* External User Progress Banner */}
      {isExternalUser && !fieldsLoading && visibleSections.length > 0 && (
        <div className="mb-6 space-y-3">
          {/* Role and Status */}
          <div className="flex items-center gap-3 text-sm text-muted-foreground">
            <User className="h-4 w-4" />
            <span>Logged in as <span className="font-medium text-foreground">{getRoleDisplayName(currentParticipant?.role as any || 'borrower')}</span></span>
            {hasCompleted && (
              <Badge variant="secondary" className="bg-success/10 text-success border-success/20">
                <CheckCircle2 className="h-3 w-3 mr-1" />
                Completed
              </Badge>
            )}
          </div>
          
          {/* Progress bar */}
          <div className="px-4 py-4 rounded-lg bg-muted/30 border border-border">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-foreground">Your Progress</span>
              <span className="text-sm text-muted-foreground">
                {visibleFilledRequiredCount} of {visibleRequiredCount} required fields
              </span>
            </div>
            <Progress value={progressPercent} className="h-2" />
            <p className="text-xs text-muted-foreground mt-2">
              {progressPercent === 100 
                ? 'All your required fields are complete! You can now submit your section.'
                : `Complete the remaining ${totalMissing} required field${totalMissing > 1 ? 's' : ''} to submit.`
              }
            </p>
          </div>
        </div>
      )}

      {/* CSR External Modification Warning Banner */}
      {isInternalUser && !modificationsLoading && hasExternalModifications && (
        <div className="mb-4 px-4 py-3 rounded-lg bg-orange-50 dark:bg-orange-950/30 border border-orange-200 dark:border-orange-800">
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-start gap-3">
              <AlertTriangle className="h-5 w-5 text-orange-600 dark:text-orange-400 mt-0.5 flex-shrink-0" />
              <div>
                <p className="font-medium text-orange-800 dark:text-orange-200">
                  External data was modified
                </p>
                <p className="text-sm text-orange-700 dark:text-orange-300 mt-1">
                  {externalModifications.length} field{externalModifications.length > 1 ? 's were' : ' was'} updated by external participants. Review before generating documents.
                </p>
                <div className="flex flex-wrap gap-1.5 mt-2">
                  {externalModifications.slice(0, 5).map(mod => (
                    <Badge 
                      key={mod.field_key} 
                      variant="outline" 
                      className="text-xs bg-orange-100 dark:bg-orange-900/50 border-orange-300 dark:border-orange-700 text-orange-800 dark:text-orange-200"
                    >
                      {mod.field_key}
                    </Badge>
                  ))}
                  {externalModifications.length > 5 && (
                    <Badge 
                      variant="outline" 
                      className="text-xs bg-orange-100 dark:bg-orange-900/50 border-orange-300 dark:border-orange-700 text-orange-800 dark:text-orange-200"
                    >
                      +{externalModifications.length - 5} more
                    </Badge>
                  )}
                </div>
              </div>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={async () => {
                const success = await markAsReviewed();
                if (success) {
                  toast({
                    title: 'Marked as reviewed',
                    description: 'External modifications have been acknowledged',
                  });
                }
              }}
              className="gap-1.5 flex-shrink-0 border-orange-300 dark:border-orange-700 text-orange-700 dark:text-orange-300 hover:bg-orange-100 dark:hover:bg-orange-900/50"
            >
              <Eye className="h-4 w-4" />
              Mark Reviewed
            </Button>
          </div>
        </div>
      )}

      {/* CSR Missing Fields Banner */}
      {isInternalUser && !fieldsLoading && fields.length > 0 && (
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
      {fieldsLoading || permissionsLoading ? (
        <div className="section-card flex items-center justify-center min-h-[300px]">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      ) : (isExternalUser ? visibleSections : sections).length === 0 ? (
        <div className="section-card text-center py-12">
          <AlertCircle className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
          <h3 className="text-lg font-semibold text-foreground mb-2">
            {isExternalUser ? 'No Fields Available' : 'No Fields Configured'}
          </h3>
          <p className="text-muted-foreground">
            {isExternalUser 
              ? 'There are no fields assigned to your role for this deal.'
              : 'No fields have been mapped to the templates in this packet.'
            }
          </p>
        </div>
      ) : (
        <div className="section-card">
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="mb-6 flex flex-wrap h-auto gap-1 bg-muted/50 p-1">
              {(isExternalUser ? visibleSections : sections).map(section => {
                // For external users, use their filtered fields
                const sectionFields = isExternalUser 
                  ? (visibleFieldsBySection[section] || [])
                  : (fieldsBySection[section] || []);
                
                // Calculate missing for this section based on visible fields
                const sectionMissing = sectionFields.filter(f => 
                  f.is_required && !values[f.field_key]?.trim()
                ).length;
                const isComplete = sectionMissing === 0;
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

            {(isExternalUser ? visibleSections : sections).map(section => (
              <TabsContent key={section} value={section} className="animate-fade-in">
                {/* Use BorrowerSectionContent for the borrower section to show sub-navigation */}
                {section === 'borrower' ? (
                  <BorrowerSectionContent
                    fields={isExternalUser 
                      ? (visibleFieldsBySection[section] || [])
                      : (fieldsBySection[section] || [])
                    }
                    values={values}
                    onValueChange={updateValue}
                    showValidation={showValidation}
                    disabled={isExternalUser && (!orchestrationCanEdit || hasCompleted)}
                    calculationResults={calculationResults}
                  />
                ) : (
                  <DealSectionTab
                    fields={isExternalUser 
                      ? (visibleFieldsBySection[section] || [])
                      : (fieldsBySection[section] || [])
                    }
                    values={values}
                    onValueChange={updateValue}
                    missingRequiredFields={
                      (isExternalUser 
                        ? (visibleFieldsBySection[section] || [])
                        : (fieldsBySection[section] || [])
                      ).filter(f => f.is_required && !values[f.field_key]?.trim())
                    }
                    showValidation={showValidation}
                    calculationResults={calculationResults}
                    orchestrationCanEdit={orchestrationCanEdit}
                    isWaitingForPrevious={isWaiting}
                    blockingRole={blockingParticipant?.role}
                    hasCompleted={hasCompleted}
                  />
                )}
              </TabsContent>
            ))}
          </Tabs>
        </div>
      )}
    </div>
  );
};

export default DealDataEntryPage;
