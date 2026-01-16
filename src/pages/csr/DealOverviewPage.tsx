import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { 
  ArrowLeft, 
  Loader2, 
  Package, 
  FileText,
  CheckCircle2,
  AlertCircle,
  Clock,
  Edit
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

interface FieldValue {
  field_key: string;
  field_value: string | null;
}

const modeLabels: Record<string, string> = {
  doc_prep: 'Document Preparation',
  servicing_only: 'Servicing Only',
};

const statusConfig: Record<string, { label: string; color: string; icon: React.ElementType }> = {
  draft: { label: 'Draft', color: 'bg-muted text-muted-foreground', icon: Clock },
  ready: { label: 'Ready', color: 'bg-primary/10 text-primary', icon: CheckCircle2 },
  generated: { label: 'Generated', color: 'bg-success/10 text-success', icon: CheckCircle2 },
};

export const DealOverviewPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const [deal, setDeal] = useState<Deal | null>(null);
  const [packet, setPacket] = useState<Packet | null>(null);
  const [templateSummaries, setTemplateSummaries] = useState<TemplateFieldSummary[]>([]);
  const [loading, setLoading] = useState(true);

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

        // Fetch templates in packet
        const { data: packetTemplates } = await supabase
          .from('packet_templates')
          .select('template_id, templates(id, name)')
          .eq('packet_id', dealData.packet_id)
          .order('display_order');

        // Fetch field values for this deal
        const { data: fieldValues } = await supabase
          .from('deal_field_values')
          .select('field_key, field_value')
          .eq('deal_id', id);

        const filledFieldKeys = new Set(
          (fieldValues || [])
            .filter((fv: FieldValue) => fv.field_value && fv.field_value.trim() !== '')
            .map((fv: FieldValue) => fv.field_key)
        );

        // Calculate summaries for each template
        const summaries: TemplateFieldSummary[] = [];
        
        for (const pt of (packetTemplates || [])) {
          const template = (pt as any).templates;
          if (!template) continue;

          // Fetch template field maps
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

  const totalRequiredFields = templateSummaries.reduce((sum, t) => sum + t.required_fields, 0);
  const totalFilledFields = templateSummaries.reduce((sum, t) => sum + t.filled_fields, 0);
  const totalMissingRequired = templateSummaries.reduce((sum, t) => sum + t.missing_required, 0);
  const totalFields = templateSummaries.reduce((sum, t) => sum + t.total_fields, 0);
  const completionPercent = totalFields > 0 ? Math.round((totalFilledFields / totalFields) * 100) : 0;

  const formatCurrency = (amount: number | null) => {
    if (!amount) return '—';
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
    }).format(amount);
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

  return (
    <div className="page-container">
      <div className="mb-6">
        <Button variant="ghost" onClick={() => navigate('/deals')} className="gap-2 mb-4">
          <ArrowLeft className="h-4 w-4" />
          Back to Deals
        </Button>
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-foreground">{deal.deal_number}</h1>
            <p className="text-muted-foreground mt-1">
              {deal.state} • {deal.product_type} • {modeLabels[deal.mode]}
            </p>
          </div>
          <div className="flex items-center gap-3">
            <span className={cn(
              'inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium',
              statusConfig[deal.status].color
            )}>
              <StatusIcon className="h-4 w-4" />
              {statusConfig[deal.status].label}
            </span>
            <Button variant="outline" onClick={() => navigate(`/deals/${deal.id}/edit`)} className="gap-2">
              <Edit className="h-4 w-4" />
              Enter Data
            </Button>
          </div>
        </div>
      </div>

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

            <div className="grid grid-cols-3 gap-4">
              <div className="text-center p-4 rounded-lg bg-muted/50">
                <p className="text-3xl font-bold text-foreground">{totalFields}</p>
                <p className="text-sm text-muted-foreground">Total Fields</p>
              </div>
              <div className="text-center p-4 rounded-lg bg-success/10">
                <p className="text-3xl font-bold text-success">{totalFilledFields}</p>
                <p className="text-sm text-muted-foreground">Filled</p>
              </div>
              <div className="text-center p-4 rounded-lg bg-destructive/10">
                <p className="text-3xl font-bold text-destructive">{totalMissingRequired}</p>
                <p className="text-sm text-muted-foreground">Missing Required</p>
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

          {/* Timestamps */}
          <div className="section-card">
            <h3 className="font-semibold text-foreground mb-4">Activity</h3>
            <dl className="space-y-3 text-sm">
              <div className="flex justify-between">
                <dt className="text-muted-foreground">Created</dt>
                <dd className="text-foreground">
                  {new Date(deal.created_at).toLocaleDateString()}
                </dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-muted-foreground">Last Updated</dt>
                <dd className="text-foreground">
                  {new Date(deal.updated_at).toLocaleDateString()}
                </dd>
              </div>
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
