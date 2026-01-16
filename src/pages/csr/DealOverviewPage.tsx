import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { resolvePacketFields, type ResolvedField } from '@/lib/requiredFieldsResolver';
import { ActivityLogViewer } from '@/components/deal/ActivityLogViewer';
import { useAuth } from '@/contexts/AuthContext';
import { 
  ArrowLeft, 
  Loader2, 
  Package, 
  FileText,
  CheckCircle2,
  AlertCircle,
  AlertTriangle,
  Clock,
  Edit,
  User,
  History,
  Play,
  XCircle,
  FileOutput
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface Deal {
  id: string;
  deal_number: string;
  state: string;
  product_type: string;
  mode: 'doc_prep' | 'servicing_only';
  status: 'draft' | 'ready' | 'generated';
  borrower_name: string | null;
  property_address: string | null;
  loan_amount: number | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
  packet_id: string | null;
}

interface Packet {
  id: string;
  name: string;
  description: string | null;
}

interface TemplateFieldSummary {
  template_id: string;
  template_name: string;
  total_fields: number;
  required_fields: number;
  filled_fields: number;
  missing_required: number;
}

interface LastUpdatedInfo {
  updated_at: string;
  updated_by_email: string | null;
}

const modeLabels: Record<string, string> = {
  doc_prep: 'Document Preparation',
  servicing_only: 'Servicing Only',
};

const statusConfig: Record<string, { label: string; color: string; icon: React.ElementType; bgColor: string }> = {
  draft: { label: 'Draft', color: 'text-muted-foreground', bgColor: 'bg-muted', icon: Clock },
  ready: { label: 'Ready', color: 'text-primary', bgColor: 'bg-primary/10', icon: CheckCircle2 },
  generated: { label: 'Generated', color: 'text-success', bgColor: 'bg-success/10', icon: CheckCircle2 },
};

export const DealOverviewPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { role } = useAuth();
  
  const [deal, setDeal] = useState<Deal | null>(null);
  const [packet, setPacket] = useState<Packet | null>(null);
  const [templateSummaries, setTemplateSummaries] = useState<TemplateFieldSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [totalMissingRequired, setTotalMissingRequired] = useState(0);
  const [totalRequiredFields, setTotalRequiredFields] = useState(0);
  const [lastUpdatedInfo, setLastUpdatedInfo] = useState<LastUpdatedInfo | null>(null);
  const [missingRequiredFields, setMissingRequiredFields] = useState<ResolvedField[]>([]);
  const [showMissingFieldsDialog, setShowMissingFieldsDialog] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);

  useEffect(() => {
    if (id) {
      fetchDealData();
    }
  }, [id]);

  const fetchDealData = async () => {
    try {
      // Fetch deal
      const { data: dealData, error: dealError } = await supabase
        .from('deals')
        .select('*')
        .eq('id', id)
        .single();

      if (dealError) throw dealError;
      setDeal(dealData);

      // Fetch packet if exists
      if (dealData.packet_id) {
        const { data: packetData } = await supabase
          .from('packets')
          .select('*')
          .eq('id', dealData.packet_id)
          .single();
        
        setPacket(packetData);

        // Use the resolver to get required fields
        const resolved = await resolvePacketFields(dealData.packet_id);
        setTotalRequiredFields(resolved.requiredFieldKeys.length);

        // Fetch field values for this deal
        const { data: fieldValues } = await supabase
          .from('deal_field_values')
          .select('field_key, value_text, value_number, value_date, updated_at, updated_by')
          .eq('deal_id', id);

        // Find filled field keys
        const filledFieldKeys = new Set(
          (fieldValues || [])
            .filter((fv: any) => 
              fv.value_text || fv.value_number !== null || fv.value_date
            )
            .map((fv: any) => fv.field_key)
        );

        // Count missing required fields and track which fields are missing
        const missingFields = resolved.fields.filter(
          field => field.is_required && !filledFieldKeys.has(field.field_key)
        );
        setMissingRequiredFields(missingFields);
        setTotalMissingRequired(missingFields.length);

        // Get last updated info
        if (fieldValues && fieldValues.length > 0) {
          // Sort by updated_at to get most recent
          const sorted = [...fieldValues].sort((a: any, b: any) => 
            new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime()
          );
          const mostRecent = sorted[0] as any;
          
          if (mostRecent.updated_by) {
            // Fetch user email from profiles
            const { data: profileData } = await supabase
              .from('profiles')
              .select('email, full_name')
              .eq('user_id', mostRecent.updated_by)
              .maybeSingle();

            setLastUpdatedInfo({
              updated_at: mostRecent.updated_at,
              updated_by_email: profileData?.full_name || profileData?.email || 'Unknown',
            });
          } else {
            setLastUpdatedInfo({
              updated_at: mostRecent.updated_at,
              updated_by_email: null,
            });
          }
        }

        // Fetch templates in packet for template breakdown
        const { data: packetTemplates } = await supabase
          .from('packet_templates')
          .select('template_id, templates(id, name)')
          .eq('packet_id', dealData.packet_id)
          .order('display_order');

        // Calculate summaries for each template
        const summaries: TemplateFieldSummary[] = [];
        
        for (const pt of (packetTemplates || [])) {
          const template = (pt as any).templates;
          if (!template) continue;

          const { data: fieldMaps } = await supabase
            .from('template_field_maps')
            .select('field_key, required_flag')
            .eq('template_id', template.id);

          const totalFields = fieldMaps?.length || 0;
          const requiredFields = fieldMaps?.filter((fm: any) => fm.required_flag).length || 0;
          const filledFields = fieldMaps?.filter((fm: any) => filledFieldKeys.has(fm.field_key)).length || 0;
          const missingRequired = fieldMaps?.filter(
            (fm: any) => fm.required_flag && !filledFieldKeys.has(fm.field_key)
          ).length || 0;

          summaries.push({
            template_id: template.id,
            template_name: template.name,
            total_fields: totalFields,
            required_fields: requiredFields,
            filled_fields: filledFields,
            missing_required: missingRequired,
          });
        }

        setTemplateSummaries(summaries);
      }
    } catch (error) {
      console.error('Error fetching deal:', error);
      toast({
        title: 'Error',
        description: 'Failed to load deal',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const totalFields = templateSummaries.reduce((sum, t) => sum + t.total_fields, 0);
  const totalFilledFields = templateSummaries.reduce((sum, t) => sum + t.filled_fields, 0);
  const completionPercent = totalFields > 0 ? Math.round((totalFilledFields / totalFields) * 100) : 0;

  const formatCurrency = (amount: number | null) => {
    if (!amount) return '—';
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  const formatDateTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    });
  };

  if (loading) {
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

  const StatusIcon = statusConfig[deal.status].icon;
  const isReady = deal.status === 'ready';
  const canBeReady = totalMissingRequired === 0 && totalRequiredFields > 0;
  
  // Preconditions for document generation
  const isCsr = role === 'csr' || role === 'admin';
  const canGenerate = isCsr && isReady && totalMissingRequired === 0 && packet !== null;
  
  const handleGenerateClick = async () => {
    // Check preconditions
    if (!isCsr) {
      toast({
        title: 'Permission Denied',
        description: 'Only CSR users can generate documents',
        variant: 'destructive',
      });
      return;
    }
    
    if (deal.status !== 'ready') {
      toast({
        title: 'Deal Not Ready',
        description: 'Deal must be in "Ready" status before generating documents',
        variant: 'destructive',
      });
      return;
    }
    
    if (totalMissingRequired > 0) {
      setShowMissingFieldsDialog(true);
      return;
    }
    
    if (!packet) {
      toast({
        title: 'No Packet Assigned',
        description: 'A packet must be assigned to the deal before generating documents',
        variant: 'destructive',
      });
      return;
    }
    
    // All preconditions met - proceed with generation
    setIsGenerating(true);
    try {
      // Use packet-based generation - the edge function handles all templates
      const { data, error } = await supabase.functions.invoke('generate-document', {
        body: {
          dealId: deal.id,
          packetId: packet.id,
          outputType: 'docx_only',
        },
      });

      if (error) {
        throw new Error(error.message || 'Generation failed');
      }

      if (data?.error) {
        throw new Error(data.error);
      }

      // Parse job result
      const jobResult = data as {
        jobId: string;
        status: string;
        successCount: number;
        failCount: number;
        results: Array<{
          templateName: string;
          success: boolean;
          error?: string;
          versionNumber?: number;
        }>;
      };

      console.log('Generation job result:', jobResult);

      // Show detailed result
      if (jobResult.failCount === 0 && jobResult.successCount > 0) {
        toast({
          title: 'Documents Generated',
          description: `Successfully generated ${jobResult.successCount} document${jobResult.successCount > 1 ? 's' : ''}`,
        });
        fetchDealData();
      } else if (jobResult.successCount > 0 && jobResult.failCount > 0) {
        // Partial success - show which ones failed
        const failedTemplates = jobResult.results
          .filter(r => !r.success)
          .map(r => r.templateName)
          .join(', ');
        toast({
          title: 'Partial Success',
          description: `Generated ${jobResult.successCount} document${jobResult.successCount > 1 ? 's' : ''}, ${jobResult.failCount} failed: ${failedTemplates}`,
          variant: 'destructive',
        });
        fetchDealData();
      } else {
        // All failed
        const firstError = jobResult.results.find(r => !r.success)?.error || 'Unknown error';
        toast({
          title: 'Generation Failed',
          description: firstError,
          variant: 'destructive',
        });
      }
    } catch (error: any) {
      console.error('Document generation error:', error);
      toast({
        title: 'Generation Failed',
        description: error.message || 'Failed to start document generation',
        variant: 'destructive',
      });
    } finally {
      setIsGenerating(false);
    }
  };

  // Section labels for display
  const sectionLabels: Record<string, string> = {
    borrower: 'Borrower',
    co_borrower: 'Co-Borrower',
    property: 'Property',
    loan_terms: 'Loan Terms',
    seller: 'Seller',
    title: 'Title',
    escrow: 'Escrow',
    other: 'Other',
  };

  return (
    <div className="page-container">
      <div className="mb-6">
        <Button variant="ghost" onClick={() => navigate('/deals')} className="gap-2 mb-4">
          <ArrowLeft className="h-4 w-4" />
          Back to Deals
        </Button>
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold text-foreground">{deal.deal_number}</h1>
              <Badge 
                variant="secondary" 
                className={cn(statusConfig[deal.status].bgColor, statusConfig[deal.status].color)}
              >
                <StatusIcon className="h-3.5 w-3.5 mr-1" />
                {statusConfig[deal.status].label}
              </Badge>
            </div>
            <p className="text-muted-foreground mt-1">
              {deal.state} • {deal.product_type} • {modeLabels[deal.mode]}
            </p>
          </div>
          <div className="flex items-center gap-3">
            <Button variant="outline" onClick={() => navigate(`/deals/${deal.id}/edit`)} className="gap-2">
              <Edit className="h-4 w-4" />
              Enter Data
            </Button>
            {/* Generate Button - Only show when preconditions can be met */}
            {isCsr && packet && (
              <Button 
                onClick={handleGenerateClick}
                disabled={!canGenerate || isGenerating}
                className="gap-2"
                variant={canGenerate ? 'default' : 'outline'}
              >
                {isGenerating ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Generating...
                  </>
                ) : (
                  <>
                    <FileOutput className="h-4 w-4" />
                    Generate Documents
                  </>
                )}
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* Missing Required Fields Dialog */}
      <Dialog open={showMissingFieldsDialog} onOpenChange={setShowMissingFieldsDialog}>
        <DialogContent className="max-w-md max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-destructive">
              <XCircle className="h-5 w-5" />
              Cannot Generate Documents
            </DialogTitle>
            <DialogDescription>
              The following required fields are missing values. Please complete them before generating documents.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <div className="space-y-4">
              {/* Group missing fields by section */}
              {Object.entries(
                missingRequiredFields.reduce((acc, field) => {
                  if (!acc[field.section]) acc[field.section] = [];
                  acc[field.section].push(field);
                  return acc;
                }, {} as Record<string, ResolvedField[]>)
              ).map(([section, fields]) => (
                <div key={section}>
                  <h4 className="text-sm font-medium text-foreground mb-2">
                    {sectionLabels[section] || section}
                  </h4>
                  <ul className="space-y-1">
                    {fields.map((field) => (
                      <li 
                        key={field.field_key}
                        className="flex items-center gap-2 text-sm text-muted-foreground pl-4"
                      >
                        <AlertCircle className="h-3 w-3 text-destructive flex-shrink-0" />
                        <span>{field.label}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
            <div className="mt-4 pt-4 border-t border-border">
              <p className="text-sm text-muted-foreground">
                <strong>{missingRequiredFields.length}</strong> required field{missingRequiredFields.length !== 1 ? 's' : ''} missing
              </p>
            </div>
          </div>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setShowMissingFieldsDialog(false)}>
              Close
            </Button>
            <Button onClick={() => {
              setShowMissingFieldsDialog(false);
              navigate(`/deals/${deal.id}/edit`);
            }}>
              <Edit className="h-4 w-4 mr-2" />
              Enter Data
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Status Banner */}
      {totalRequiredFields > 0 && (
        <div className={cn(
          'mb-6 px-4 py-3 rounded-lg flex items-center justify-between',
          totalMissingRequired > 0 
            ? 'bg-warning/10 border border-warning/20' 
            : 'bg-success/10 border border-success/20'
        )}>
          <div className="flex items-center gap-3">
            {totalMissingRequired > 0 ? (
              <>
                <AlertTriangle className="h-5 w-5 text-warning" />
                <div>
                  <p className="font-medium text-foreground">
                    {totalMissingRequired} required field{totalMissingRequired > 1 ? 's' : ''} missing
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
                  <p className="font-medium text-foreground">
                    {isReady ? 'Deal is ready for document generation' : 'All required fields complete'}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {totalRequiredFields} required field{totalRequiredFields > 1 ? 's' : ''} filled
                  </p>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Completion Summary */}
          <div className="section-card">
            <h2 className="text-lg font-semibold text-foreground mb-4">Completion Summary</h2>
            
            <div className="mb-6">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-foreground">Overall Progress</span>
                <span className="text-sm font-medium text-primary">{completionPercent}%</span>
              </div>
              <Progress value={completionPercent} className="h-2" />
            </div>

            <div className="grid grid-cols-4 gap-4">
              <div className="text-center p-4 rounded-lg bg-muted/50">
                <p className="text-2xl font-bold text-foreground">{totalFields}</p>
                <p className="text-xs text-muted-foreground">Total Fields</p>
              </div>
              <div className="text-center p-4 rounded-lg bg-primary/10">
                <p className="text-2xl font-bold text-primary">{totalRequiredFields}</p>
                <p className="text-xs text-muted-foreground">Required</p>
              </div>
              <div className="text-center p-4 rounded-lg bg-success/10">
                <p className="text-2xl font-bold text-success">{totalFilledFields}</p>
                <p className="text-xs text-muted-foreground">Filled</p>
              </div>
              <div className="text-center p-4 rounded-lg bg-destructive/10">
                <p className="text-2xl font-bold text-destructive">{totalMissingRequired}</p>
                <p className="text-xs text-muted-foreground">Missing Req.</p>
              </div>
            </div>
          </div>

          {/* Template Breakdown */}
          {packet && templateSummaries.length > 0 && (
            <div className="section-card">
              <div className="flex items-center gap-3 mb-4">
                <Package className="h-5 w-5 text-primary" />
                <h2 className="text-lg font-semibold text-foreground">
                  Packet: {packet.name}
                </h2>
              </div>

              <div className="space-y-3">
                {templateSummaries.map((summary) => {
                  const progress = summary.total_fields > 0
                    ? Math.round((summary.filled_fields / summary.total_fields) * 100)
                    : 0;
                  const isComplete = summary.missing_required === 0;

                  return (
                    <div
                      key={summary.template_id}
                      className="p-4 rounded-lg border border-border"
                    >
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <FileText className="h-4 w-4 text-muted-foreground" />
                          <span className="font-medium text-foreground">{summary.template_name}</span>
                        </div>
                        {isComplete ? (
                          <span className="text-xs px-2 py-1 rounded-full bg-success/10 text-success flex items-center gap-1">
                            <CheckCircle2 className="h-3 w-3" />
                            Complete
                          </span>
                        ) : (
                          <span className="text-xs px-2 py-1 rounded-full bg-warning/10 text-warning">
                            {summary.missing_required} missing
                          </span>
                        )}
                      </div>
                      <Progress value={progress} className="h-1.5 mb-2" />
                      <div className="flex justify-between text-xs text-muted-foreground">
                        <span>{summary.filled_fields} / {summary.total_fields} fields filled</span>
                        <span>{summary.required_fields} required</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {!packet && (
            <div className="section-card text-center py-8">
              <Package className="h-12 w-12 mx-auto text-muted-foreground mb-3" />
              <p className="text-muted-foreground">No packet assigned to this deal</p>
            </div>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Deal Info */}
          <div className="section-card">
            <h3 className="font-semibold text-foreground mb-4">Deal Information</h3>
            <dl className="space-y-3 text-sm">
              <div className="flex justify-between">
                <dt className="text-muted-foreground">Deal Number</dt>
                <dd className="font-medium text-foreground">{deal.deal_number}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-muted-foreground">Status</dt>
                <dd>
                  <Badge 
                    variant="secondary" 
                    className={cn(
                      'text-xs',
                      statusConfig[deal.status].bgColor, 
                      statusConfig[deal.status].color
                    )}
                  >
                    {statusConfig[deal.status].label}
                  </Badge>
                </dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-muted-foreground">State</dt>
                <dd className="font-medium text-foreground">{deal.state}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-muted-foreground">Product Type</dt>
                <dd className="font-medium text-foreground">{deal.product_type}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-muted-foreground">Mode</dt>
                <dd className="font-medium text-foreground">{modeLabels[deal.mode]}</dd>
              </div>
              {deal.borrower_name && (
                <div className="flex justify-between">
                  <dt className="text-muted-foreground">Borrower</dt>
                  <dd className="font-medium text-foreground">{deal.borrower_name}</dd>
                </div>
              )}
              {deal.loan_amount && (
                <div className="flex justify-between">
                  <dt className="text-muted-foreground">Loan Amount</dt>
                  <dd className="font-medium text-foreground">{formatCurrency(deal.loan_amount)}</dd>
                </div>
              )}
            </dl>
          </div>

          {/* Activity Log */}
          <div className="section-card">
            <div className="flex items-center gap-2 mb-4">
              <History className="h-4 w-4 text-muted-foreground" />
              <h3 className="font-semibold text-foreground">Activity Log</h3>
            </div>
            <ActivityLogViewer dealId={id!} maxHeight="300px" />
          </div>

          {/* Timestamps */}
          <div className="section-card">
            <h3 className="font-semibold text-foreground mb-4">Timestamps</h3>
            <dl className="space-y-3 text-sm">
              <div className="flex justify-between">
                <dt className="text-muted-foreground">Created</dt>
                <dd className="text-foreground">
                  {formatDateTime(deal.created_at)}
                </dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-muted-foreground">Deal Updated</dt>
                <dd className="text-foreground">
                  {formatDateTime(deal.updated_at)}
                </dd>
              </div>
              {lastUpdatedInfo && (
                <>
                  <div className="border-t border-border pt-3 mt-3">
                    <dt className="text-muted-foreground mb-1">Last Field Update</dt>
                    <dd className="text-foreground">
                      {formatDateTime(lastUpdatedInfo.updated_at)}
                    </dd>
                  </div>
                  {lastUpdatedInfo.updated_by_email && (
                    <div className="flex items-center gap-2">
                      <User className="h-4 w-4 text-muted-foreground" />
                      <span className="text-foreground">{lastUpdatedInfo.updated_by_email}</span>
                    </div>
                  )}
                </>
              )}
            </dl>
          </div>

          {/* Notes */}
          {deal.notes && (
            <div className="section-card">
              <h3 className="font-semibold text-foreground mb-2">Notes</h3>
              <p className="text-sm text-muted-foreground">{deal.notes}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default DealOverviewPage;
