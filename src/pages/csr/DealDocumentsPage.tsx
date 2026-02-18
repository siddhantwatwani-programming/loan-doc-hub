import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { 
  ArrowLeft, 
  Loader2, 
  Package, 
  FileText,
  CheckCircle2,
  AlertCircle,
  AlertTriangle,
  Download,
  RefreshCw,
  Play,
  Clock,
  XCircle,
  FileOutput,
  File,
  ChevronDown,
  ChevronRight,
  History,
  User,
  Eye,
  Upload
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';

interface Deal {
  id: string;
  deal_number: string;
  state: string;
  product_type: string;
  status: 'draft' | 'ready' | 'generated';
  packet_id: string | null;
}

interface Packet {
  id: string;
  name: string;
  description: string | null;
  all_states?: boolean;
  states?: string[];
}

interface Template {
  id: string;
  name: string;
  file_path: string | null;
  version: number;
}

interface PacketTemplate {
  template_id: string;
  display_order: number;
  is_required: boolean;
  templates: Template;
}

interface Profile {
  user_id: string;
  full_name: string | null;
  email: string | null;
}

interface GeneratedDocument {
  id: string;
  template_id: string;
  output_docx_path: string;
  output_pdf_path: string | null;
  output_type: 'docx_only' | 'docx_and_pdf';
  version_number: number;
  generation_status: 'queued' | 'running' | 'success' | 'failed';
  error_message: string | null;
  created_at: string;
  created_by: string;
}

interface GenerationJob {
  id: string;
  request_type: 'single_doc' | 'packet';
  status: 'queued' | 'running' | 'success' | 'failed';
  started_at: string | null;
  completed_at: string | null;
  error_message: string | null;
}

type OutputType = 'docx_only' | 'docx_and_pdf';

const statusConfig = {
  queued: { label: 'Queued', color: 'text-muted-foreground', bgColor: 'bg-muted', icon: Clock },
  running: { label: 'Running', color: 'text-primary', bgColor: 'bg-primary/10', icon: Loader2 },
  success: { label: 'Success', color: 'text-success', bgColor: 'bg-success/10', icon: CheckCircle2 },
  failed: { label: 'Failed', color: 'text-destructive', bgColor: 'bg-destructive/10', icon: XCircle },
};

export const DealDocumentsPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { role } = useAuth();

  const [deal, setDeal] = useState<Deal | null>(null);
  const [packet, setPacket] = useState<Packet | null>(null);
  const [packetTemplates, setPacketTemplates] = useState<PacketTemplate[]>([]);
  const [allTemplates, setAllTemplates] = useState<Template[]>([]);
  const [availablePackets, setAvailablePackets] = useState<Packet[]>([]);
  const [selectedPacketId, setSelectedPacketId] = useState<string | null>(null);
  const [generatedDocuments, setGeneratedDocuments] = useState<GeneratedDocument[]>([]);
  const [recentJobs, setRecentJobs] = useState<GenerationJob[]>([]);
  const [profiles, setProfiles] = useState<Map<string, Profile>>(new Map());
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [uploadingTemplate, setUploadingTemplate] = useState(false);
  const [selectedTemplateId, setSelectedTemplateId] = useState<string | null>(null);
  const [outputType, setOutputType] = useState<OutputType>('docx_only');
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [generationMode, setGenerationMode] = useState<'single' | 'packet'>('packet');
  const [expandedTemplates, setExpandedTemplates] = useState<Set<string>>(new Set());
  const [activeTab, setActiveTab] = useState<'generate' | 'history'>('generate');

  const isCsr = role === 'csr' || role === 'admin';
  const isAdminViewOnly = role === 'admin';
  const canGenerate = (role === 'csr' || role === 'admin') && (deal?.status === 'ready' || deal?.status === 'generated');

  useEffect(() => {
    if (id) {
      fetchData();
    }
  }, [id]);

  // Subscribe to real-time updates for generated documents
  useEffect(() => {
    if (!id) return;

    const channel = supabase
      .channel('generated-docs-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'generated_documents',
          filter: `deal_id=eq.${id}`,
        },
        () => {
          fetchGeneratedDocuments();
        }
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'generation_jobs',
          filter: `deal_id=eq.${id}`,
        },
        () => {
          fetchRecentJobs();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [id]);

  const fetchData = async () => {
    setLoading(true);
    try {
      await Promise.all([
        fetchDeal(),
        fetchGeneratedDocuments(),
        fetchRecentJobs(),
      ]);
    } finally {
      setLoading(false);
    }
  };

  const fetchDeal = async () => {
    const { data: dealData, error: dealError } = await supabase
      .from('deals')
      .select('*')
      .eq('id', id)
      .single();

    if (dealError) throw dealError;
    setDeal(dealData);

    if (dealData.packet_id) {
      // Fetch packet
      const { data: packetData } = await supabase
        .from('packets')
        .select('*')
        .eq('id', dealData.packet_id)
        .single();
      setPacket(packetData);

      // Fetch packet templates with template info
      const { data: ptData } = await supabase
        .from('packet_templates')
        .select('template_id, display_order, is_required, templates(id, name, file_path, version)')
        .eq('packet_id', dealData.packet_id)
        .order('display_order');
      
      setPacketTemplates((ptData || []) as any);
    } else {
      // No packet - fetch all active templates and available packets for selection
      const [templatesRes, packetsRes] = await Promise.all([
        supabase
          .from('templates')
          .select('id, name, file_path, version')
          .eq('is_active', true)
          .order('name'),
        supabase
          .from('packets')
          .select('*')
          .eq('is_active', true)
          .order('name'),
      ]);
      
      setAllTemplates((templatesRes.data || []) as Template[]);

      // Filter packets by deal state: all_states=true OR deal's state is in packet's states array
      const dealState = dealData.state;
      const filtered = (packetsRes.data || []).filter((p: any) => 
        p.all_states || (p.states && p.states.includes(dealState))
      );
      setAvailablePackets(filtered);
    }
  };

  const fetchGeneratedDocuments = async () => {
    const { data } = await supabase
      .from('generated_documents')
      .select('*')
      .eq('deal_id', id)
      .order('created_at', { ascending: false });

    setGeneratedDocuments(data || []);
    
    // Fetch profiles for creators
    if (data && data.length > 0) {
      const creatorIds = [...new Set(data.map(d => d.created_by))];
      const { data: profilesData } = await supabase
        .from('profiles')
        .select('user_id, full_name, email')
        .in('user_id', creatorIds);
      
      if (profilesData) {
        const profilesMap = new Map(profilesData.map(p => [p.user_id, p]));
        setProfiles(profilesMap);
      }
    }
  };

  const fetchRecentJobs = async () => {
    const { data } = await supabase
      .from('generation_jobs')
      .select('*')
      .eq('deal_id', id)
      .order('created_at', { ascending: false })
      .limit(5);

    setRecentJobs(data || []);
  };

  const handleGenerateClick = (mode: 'single' | 'packet', templateId?: string) => {
    setGenerationMode(mode);
    setSelectedTemplateId(templateId || null);
    setShowConfirmDialog(true);
  };

  const handleGenerate = async () => {
    setShowConfirmDialog(false);
    setGenerating(true);

    try {
      const body: any = {
        dealId: deal!.id,
        outputType,
      };

      if (generationMode === 'single' && selectedTemplateId) {
        body.templateId = selectedTemplateId;
      } else {
        // Use deal's assigned packet or the user-selected packet
        const packetIdToUse = packet?.id || selectedPacketId;
        if (!packetIdToUse) throw new Error('No packet selected');
        body.packetId = packetIdToUse;
      }

      const { data, error } = await supabase.functions.invoke('generate-document', {
        body,
      });

      if (error) throw error;
      if (data?.error) throw new Error(data.error);

      const result = data as {
        successCount: number;
        failCount: number;
        results: Array<{ templateName: string; success: boolean; error?: string }>;
      };

      if (result.failCount === 0) {
        toast({
          title: 'Documents Generated',
          description: `Successfully generated ${result.successCount} document${result.successCount > 1 ? 's' : ''}`,
        });
      } else if (result.successCount > 0) {
        toast({
          title: 'Partial Success',
          description: `${result.successCount} succeeded, ${result.failCount} failed`,
          variant: 'destructive',
        });
      } else {
        const firstError = result.results.find(r => !r.success)?.error || 'Unknown error';
        toast({
          title: 'Generation Failed',
          description: firstError,
          variant: 'destructive',
        });
      }

      // Refresh data
      fetchData();
    } catch (error: any) {
      toast({
        title: 'Generation Failed',
        description: error.message || 'Failed to generate documents',
        variant: 'destructive',
      });
    } finally {
      setGenerating(false);
    }
  };

  const handleDownload = async (path: string, filename: string) => {
    try {
      const { data, error } = await supabase.storage
        .from('generated-docs')
        .download(path);

      if (error) throw error;

      // Create download link
      const url = URL.createObjectURL(data);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (error: any) {
      toast({
        title: 'Download Failed',
        description: error.message || 'Failed to download file',
        variant: 'destructive',
      });
    }
  };

  const getLatestDocumentForTemplate = (templateId: string): GeneratedDocument | undefined => {
    return generatedDocuments.find(
      doc => doc.template_id === templateId && doc.generation_status === 'success'
    );
  };

  const getDocumentHistory = (templateId: string): GeneratedDocument[] => {
    return generatedDocuments.filter(doc => doc.template_id === templateId);
  };

  const getCreatorName = (userId: string): string => {
    const profile = profiles.get(userId);
    return profile?.full_name || profile?.email || 'Unknown';
  };

  const toggleTemplateExpanded = (templateId: string) => {
    setExpandedTemplates(prev => {
      const next = new Set(prev);
      if (next.has(templateId)) {
        next.delete(templateId);
      } else {
        next.add(templateId);
      }
      return next;
    });
  };

  const getDocumentsGroupedByTemplate = () => {
    const grouped = new Map<string, { template: Template | null; documents: GeneratedDocument[] }>();
    
    // Initialize with packet templates
    packetTemplates.forEach(pt => {
      grouped.set(pt.template_id, { template: pt.templates, documents: [] });
    });
    
    // Add documents to groups
    generatedDocuments.forEach(doc => {
      if (grouped.has(doc.template_id)) {
        grouped.get(doc.template_id)!.documents.push(doc);
      } else {
        // Document for a template not in current packet (edge case)
        grouped.set(doc.template_id, { template: null, documents: [doc] });
      }
    });
    
    return grouped;
  };

  const getFailedDocuments = (): GeneratedDocument[] => {
    return generatedDocuments.filter(doc => doc.generation_status === 'failed');
  };

  // Handle template file upload for templates without files
  const handleTemplateUpload = async (templateId: string, e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.name.endsWith('.docx')) {
      toast({
        title: 'Invalid file type',
        description: 'Please upload a .docx file',
        variant: 'destructive',
      });
      return;
    }

    setUploadingTemplate(true);
    try {
      const fileName = `${Date.now()}_${file.name}`;
      const { error: uploadError } = await supabase.storage
        .from('templates')
        .upload(fileName, file, { upsert: true });

      if (uploadError) throw uploadError;

      // Update the template record with the file path
      const { error: updateError } = await supabase
        .from('templates')
        .update({ file_path: fileName })
        .eq('id', templateId);

      if (updateError) throw updateError;

      toast({
        title: 'Template Uploaded',
        description: 'Template file uploaded successfully. You can now generate documents.',
      });

      // Refresh data
      fetchData();
    } catch (error: any) {
      console.error('Upload error:', error);
      toast({
        title: 'Upload Failed',
        description: error.message || 'Failed to upload template file',
        variant: 'destructive',
      });
    } finally {
      setUploadingTemplate(false);
    }
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
        <h2 className="text-xl font-semibold text-foreground mb-2">File Not Found</h2>
        <Button onClick={() => navigate('/deals')}>Back to Files</Button>
      </div>
    );
  }

  return (
    <div className="page-container">
      {/* Header */}
      <div className="mb-6">
        <Button variant="ghost" onClick={() => navigate(`/deals/${id}`)} className="gap-2 mb-4">
          <ArrowLeft className="h-4 w-4" />
          Back to File
        </Button>
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-foreground">File Documents</h1>
            <p className="text-muted-foreground mt-1">
              {deal.deal_number} • {deal.state} • {deal.product_type}
            </p>
          </div>
          <div className="flex items-center gap-3">
            {role === 'admin' && (
              <Badge variant="outline" className="gap-1">
                <Eye className="h-3 w-3" />
                Admin View
              </Badge>
            )}
            <Badge 
              className={cn(
                'text-sm px-3 py-1',
                deal.status === 'ready' ? 'bg-primary/10 text-primary' :
                deal.status === 'generated' ? 'bg-success/10 text-success' :
                'bg-muted text-muted-foreground'
              )}
            >
              {deal.status.charAt(0).toUpperCase() + deal.status.slice(1)}
            </Badge>
          </div>
        </div>
      </div>

      {/* Status Banner */}
      {deal.status === 'draft' && (
        <div className="mb-6 px-4 py-3 rounded-lg bg-warning/10 border border-warning/20 flex items-center gap-3">
          <AlertTriangle className="h-5 w-5 text-warning" />
          <div>
            <p className="font-medium text-foreground">File Not Ready</p>
            <p className="text-sm text-muted-foreground">
              Complete all required fields and mark the file as Ready before generating documents.
            </p>
          </div>
          <Button 
            variant="outline" 
            size="sm" 
            className="ml-auto"
            onClick={() => navigate(`/deals/${id}/edit`)}
          >
            Enter Data
          </Button>
        </div>
      )}

      {/* Tabs for Generate / History */}
      <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as 'generate' | 'history')} className="mb-6">
        <TabsList>
          <TabsTrigger value="generate" className="gap-2">
            <Play className="h-4 w-4" />
            Generate
          </TabsTrigger>
          <TabsTrigger value="history" className="gap-2">
            <History className="h-4 w-4" />
            Document History
            {generatedDocuments.length > 0 && (
              <Badge variant="secondary" className="ml-1 h-5 px-1.5">
                {generatedDocuments.length}
              </Badge>
            )}
          </TabsTrigger>
        </TabsList>
      </Tabs>

      {activeTab === 'generate' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column - Templates & Generation */}
          <div className="lg:col-span-2 space-y-6">
            {/* Packet Info - only if packet exists */}
            {packet && (
              <div className="section-card">
                <div className="flex items-center gap-3 mb-4">
                  <Package className="h-5 w-5 text-primary" />
                  <div>
                    <h2 className="text-lg font-semibold text-foreground">{packet.name}</h2>
                    {packet.description && (
                      <p className="text-sm text-muted-foreground">{packet.description}</p>
                    )}
                  </div>
                </div>

                {/* Output Type Selector */}
                <div className="flex items-center gap-4 mb-4 p-3 bg-muted/50 rounded-lg">
                  <span className="text-sm font-medium text-foreground">Output Format:</span>
                  <Select value={outputType} onValueChange={(v) => setOutputType(v as OutputType)}>
                    <SelectTrigger className="w-48">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="docx_only">DOCX Only</SelectItem>
                      <SelectItem value="docx_and_pdf">DOCX + PDF</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Generate Full Packet Button */}
                <Button 
                  onClick={() => handleGenerateClick('packet')}
                  disabled={!canGenerate || generating}
                  className="w-full gap-2"
                  size="lg"
                >
                  {generating ? (
                    <>
                      <Loader2 className="h-5 w-5 animate-spin" />
                      Generating...
                    </>
                  ) : (
                    <>
                      <Play className="h-5 w-5" />
                      Generate Full Packet ({packetTemplates.length} templates)
                    </>
                  )}
                </Button>
              </div>
            )}

            {/* No Packet - Packet Selector + Template Selector Mode */}
            {!packet && (
              <div className="section-card space-y-6">
                {/* Packet Selector */}
                {availablePackets.length > 0 && (
                  <div>
                    <div className="flex items-center gap-3 mb-4">
                      <Package className="h-5 w-5 text-primary" />
                      <div>
                        <h2 className="text-lg font-semibold text-foreground">Generate from Packet</h2>
                        <p className="text-sm text-muted-foreground">
                          Select a packet to generate all its templates at once.
                        </p>
                      </div>
                    </div>
                    <div className="space-y-4">
                      <div className="flex items-center gap-4 p-3 bg-muted/50 rounded-lg">
                        <span className="text-sm font-medium text-foreground">Packet:</span>
                        <Select
                          value={selectedPacketId || ''}
                          onValueChange={async (v) => {
                            setSelectedPacketId(v);
                            // Fetch templates for this packet
                            const { data: ptData } = await supabase
                              .from('packet_templates')
                              .select('template_id, display_order, is_required, templates(id, name, file_path, version)')
                              .eq('packet_id', v)
                              .order('display_order');
                            setPacketTemplates((ptData || []) as any);
                          }}
                        >
                          <SelectTrigger className="flex-1">
                            <SelectValue placeholder="Select a packet..." />
                          </SelectTrigger>
                          <SelectContent>
                            {availablePackets.map(p => (
                              <SelectItem key={p.id} value={p.id}>
                                {p.name} {p.all_states ? '(All States)' : `(${(p.states || []).join(', ')})`}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      {/* Show selected packet templates preview */}
                      {selectedPacketId && packetTemplates.length > 0 && (
                        <div className="p-3 bg-muted/30 rounded-lg space-y-2">
                          <p className="text-sm font-medium text-foreground">Templates in Packet ({packetTemplates.length}):</p>
                          {packetTemplates.map((pt, idx) => (
                            <div key={pt.template_id} className="flex items-center gap-2 text-sm text-muted-foreground">
                              <span className="font-medium w-5">{idx + 1}.</span>
                              <FileText className="h-3.5 w-3.5" />
                              <span>{pt.templates?.name || 'Unknown'}</span>
                            </div>
                          ))}
                        </div>
                      )}

                      <div className="flex items-center gap-4 p-3 bg-muted/50 rounded-lg">
                        <span className="text-sm font-medium text-foreground">Output Format:</span>
                        <Select value={outputType} onValueChange={(v) => setOutputType(v as OutputType)}>
                          <SelectTrigger className="w-48">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="docx_only">DOCX Only</SelectItem>
                            <SelectItem value="docx_and_pdf">DOCX + PDF</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <Button 
                        onClick={() => handleGenerateClick('packet')}
                        disabled={!canGenerate || generating || !selectedPacketId}
                        className="w-full gap-2"
                        size="lg"
                      >
                        {generating ? (
                          <>
                            <Loader2 className="h-5 w-5 animate-spin" />
                            Generating...
                          </>
                        ) : (
                          <>
                            <Play className="h-5 w-5" />
                            Generate Full Packet ({packetTemplates.length} templates)
                          </>
                        )}
                      </Button>
                    </div>

                    <div className="my-4 border-t border-border" />
                  </div>
                )}

                {/* Single Template Selector */}
                <div>
                  <div className="flex items-center gap-3 mb-4">
                    <FileText className="h-5 w-5 text-primary" />
                    <div>
                      <h2 className="text-lg font-semibold text-foreground">Single Template Generation</h2>
                      <p className="text-sm text-muted-foreground">
                        Select a template to generate a single document.
                      </p>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div className="flex items-center gap-4 p-3 bg-muted/50 rounded-lg">
                      <span className="text-sm font-medium text-foreground">Template:</span>
                      <Select 
                        value={selectedTemplateId || ''} 
                        onValueChange={(v) => setSelectedTemplateId(v)}
                      >
                        <SelectTrigger className="flex-1">
                          <SelectValue placeholder="Select a template..." />
                        </SelectTrigger>
                        <SelectContent>
                          {allTemplates.map(template => (
                            <SelectItem key={template.id} value={template.id}>
                              {template.name} (v{template.version})
                              {!template.file_path && ' - No file'}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    {!availablePackets.length && (
                      <div className="flex items-center gap-4 p-3 bg-muted/50 rounded-lg">
                        <span className="text-sm font-medium text-foreground">Output Format:</span>
                        <Select value={outputType} onValueChange={(v) => setOutputType(v as OutputType)}>
                          <SelectTrigger className="w-48">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="docx_only">DOCX Only</SelectItem>
                            <SelectItem value="docx_and_pdf">DOCX + PDF</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    )}

                    <Button 
                      onClick={() => handleGenerateClick('single', selectedTemplateId || undefined)}
                      disabled={!canGenerate || generating || !selectedTemplateId}
                      className="w-full gap-2"
                      size="lg"
                    >
                      {generating ? (
                        <>
                          <Loader2 className="h-5 w-5 animate-spin" />
                          Generating...
                        </>
                      ) : (
                        <>
                          <Play className="h-5 w-5" />
                          Generate Document
                        </>
                      )}
                    </Button>
                  </div>
                </div>
              </div>
            )}

          {/* Templates List - only show if packet exists */}
          {packet && packetTemplates.length > 0 && (
          <div className="section-card">
            <h3 className="text-lg font-semibold text-foreground mb-4">Templates in Packet</h3>
            
            <div className="space-y-3">
              {packetTemplates.map((pt, index) => {
                const template = pt.templates;
                const latestDoc = getLatestDocumentForTemplate(template.id);
                const history = getDocumentHistory(template.id);
                const hasFile = !!template.file_path;

                return (
                  <div
                    key={pt.template_id}
                    className="p-4 rounded-lg border border-border hover:border-primary/30 transition-colors"
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex items-start gap-3">
                        <div className="flex items-center justify-center w-8 h-8 rounded-full bg-muted text-sm font-medium">
                          {index + 1}
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-medium text-foreground">{template.name}</span>
                            <span className="text-xs text-muted-foreground">v{template.version}</span>
                            {pt.is_required && (
                              <Badge variant="outline" className="text-xs">Required</Badge>
                            )}
                          </div>
                          
                          {latestDoc ? (
                            <div className="flex items-center gap-2 mt-1">
                              <CheckCircle2 className="h-3.5 w-3.5 text-success" />
                              <span className="text-sm text-success">
                                Generated v{latestDoc.version_number}
                              </span>
                              <span className="text-xs text-muted-foreground">
                                {format(new Date(latestDoc.created_at), 'MMM d, h:mm a')}
                              </span>
                            </div>
                          ) : hasFile ? (
                            <div className="flex items-center gap-2 mt-1 text-sm text-muted-foreground">
                              <FileText className="h-3.5 w-3.5" />
                              <span>Ready to generate</span>
                            </div>
                          ) : (
                            <div className="flex items-center gap-2 mt-1 text-sm text-destructive">
                              <AlertCircle className="h-3.5 w-3.5" />
                              <span>No template file</span>
                            </div>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        {/* Download buttons */}
                        {latestDoc && (
                          <div className="flex items-center gap-1">
                            <Button
                              variant="outline"
                              size="sm"
                              className="gap-1"
                              onClick={() => handleDownload(
                                latestDoc.output_docx_path,
                                `${template.name}_v${latestDoc.version_number}.docx`
                              )}
                            >
                              <Download className="h-3.5 w-3.5" />
                              DOCX
                            </Button>
                            {latestDoc.output_pdf_path && (
                              <Button
                                variant="outline"
                                size="sm"
                                className="gap-1"
                                onClick={() => handleDownload(
                                  latestDoc.output_pdf_path!,
                                  `${template.name}_v${latestDoc.version_number}.pdf`
                                )}
                              >
                                <Download className="h-3.5 w-3.5" />
                                PDF
                              </Button>
                            )}
                          </div>
                        )}
                        
                        {/* Regenerate / Generate button */}
                        {hasFile && (
                          <Button
                            variant={latestDoc ? 'ghost' : 'outline'}
                            size="sm"
                            disabled={!canGenerate || generating}
                            onClick={() => handleGenerateClick('single', template.id)}
                            className="gap-1"
                          >
                            <RefreshCw className="h-3.5 w-3.5" />
                            {latestDoc ? 'Regenerate' : 'Generate'}
                          </Button>
                        )}

                        {/* Upload button for templates without files */}
                        {!hasFile && (role === 'admin' || role === 'csr') && (
                          <label className="cursor-pointer">
                            <input
                              type="file"
                              accept=".docx"
                              className="hidden"
                              onChange={(e) => handleTemplateUpload(template.id, e)}
                              disabled={uploadingTemplate}
                            />
                            <Button
                              variant="outline"
                              size="sm"
                              className="gap-1"
                              asChild
                              disabled={uploadingTemplate}
                            >
                              <span>
                                {uploadingTemplate ? (
                                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                                ) : (
                                  <Upload className="h-3.5 w-3.5" />
                                )}
                                Upload DOCX
                              </span>
                            </Button>
                          </label>
                        )}
                      </div>
                    </div>

                    {/* Version History */}
                    {history.length > 1 && (
                      <div className="mt-3 pt-3 border-t border-border">
                        <p className="text-xs text-muted-foreground mb-2">Previous Versions</p>
                        <div className="space-y-1">
                          {history.slice(1, 4).map((doc) => (
                            <div key={doc.id} className="flex items-center justify-between text-xs">
                              <span className="text-muted-foreground">
                                v{doc.version_number} - {format(new Date(doc.created_at), 'MMM d, h:mm a')}
                              </span>
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-6 px-2 text-xs"
                                onClick={() => handleDownload(
                                  doc.output_docx_path,
                                  `${template.name}_v${doc.version_number}.docx`
                                )}
                              >
                                <Download className="h-3 w-3" />
                              </Button>
                            </div>
                          ))}
                          {history.length > 4 && (
                            <p className="text-xs text-muted-foreground">
                              +{history.length - 4} more versions
                            </p>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
          )}
        </div>

        {/* Right Column - Status & History */}
        <div className="space-y-6">
          {/* Generation Summary */}
          <div className="section-card">
            <h3 className="font-semibold text-foreground mb-4">Generation Summary</h3>
            
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Templates</span>
                <span className="font-medium text-foreground">{packetTemplates.length}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Generated</span>
                <span className="font-medium text-success">
                  {new Set(generatedDocuments.filter(d => d.generation_status === 'success').map(d => d.template_id)).size}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Total Versions</span>
                <span className="font-medium text-foreground">
                  {generatedDocuments.filter(d => d.generation_status === 'success').length}
                </span>
              </div>
            </div>

            {/* Progress */}
            {packetTemplates.length > 0 && (
              <div className="mt-4">
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-muted-foreground">Completion</span>
                  <span className="font-medium">
                    {Math.round(
                      (new Set(generatedDocuments.filter(d => d.generation_status === 'success').map(d => d.template_id)).size / 
                       packetTemplates.length) * 100
                    )}%
                  </span>
                </div>
                <Progress 
                  value={
                    (new Set(generatedDocuments.filter(d => d.generation_status === 'success').map(d => d.template_id)).size / 
                     packetTemplates.length) * 100
                  }
                  className="h-2"
                />
              </div>
            )}
          </div>

          {/* Recent Jobs */}
          {recentJobs.length > 0 && (
            <div className="section-card">
              <h3 className="font-semibold text-foreground mb-4">Recent Jobs</h3>
              
              <div className="space-y-3">
                {recentJobs.map((job) => {
                  const StatusIcon = statusConfig[job.status].icon;
                  return (
                    <div key={job.id} className="p-3 rounded-lg bg-muted/50">
                      <div className="flex items-center justify-between mb-1">
                        <Badge 
                          className={cn(
                            'text-xs',
                            statusConfig[job.status].bgColor,
                            statusConfig[job.status].color
                          )}
                        >
                          <StatusIcon className={cn(
                            'h-3 w-3 mr-1',
                            job.status === 'running' && 'animate-spin'
                          )} />
                          {statusConfig[job.status].label}
                        </Badge>
                        <span className="text-xs text-muted-foreground capitalize">
                          {job.request_type.replace('_', ' ')}
                        </span>
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {job.started_at && format(new Date(job.started_at), 'MMM d, h:mm:ss a')}
                      </div>
                      {job.error_message && (
                        <p className="text-xs text-destructive mt-1 line-clamp-2">
                          {job.error_message}
                        </p>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Quick Actions */}
          <div className="section-card">
            <h3 className="font-semibold text-foreground mb-4">Quick Actions</h3>
            <div className="space-y-2">
              <Button 
                variant="outline" 
                className="w-full justify-start gap-2"
                onClick={() => navigate(`/deals/${id}`)}
              >
                <FileText className="h-4 w-4" />
                View Deal Overview
              </Button>
              <Button 
                variant="outline" 
                className="w-full justify-start gap-2"
                onClick={() => navigate(`/deals/${id}/edit`)}
              >
                <File className="h-4 w-4" />
                Edit Deal Data
              </Button>
            </div>
          </div>
        </div>
      </div>
      )}

      {/* Document History Tab Content */}
      {activeTab === 'history' && (
        <div className="space-y-6">
          {/* Failed Generations Alert */}
          {getFailedDocuments().length > 0 && (
            <div className="section-card border-destructive/50 bg-destructive/5">
              <div className="flex items-center gap-3 mb-4">
                <XCircle className="h-5 w-5 text-destructive" />
                <h3 className="font-semibold text-destructive">
                  Failed Generations ({getFailedDocuments().length})
                </h3>
              </div>
              <div className="space-y-3">
                {getFailedDocuments().map((doc) => {
                  const template = packetTemplates.find(pt => pt.template_id === doc.template_id)?.templates;
                  return (
                    <div key={doc.id} className="p-3 rounded-lg bg-destructive/10 border border-destructive/20">
                      <div className="flex items-start justify-between gap-4">
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-medium text-foreground">
                              {template?.name || 'Unknown Template'}
                            </span>
                            <Badge variant="destructive" className="text-xs">Failed</Badge>
                          </div>
                          <div className="text-xs text-muted-foreground mt-1">
                            {format(new Date(doc.created_at), 'MMM d, yyyy h:mm a')} • by {getCreatorName(doc.created_by)}
                          </div>
                          {doc.error_message && (
                            <p className="text-sm text-destructive mt-2 p-2 bg-background rounded">
                              {doc.error_message}
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Documents Grouped by Template */}
          <div className="section-card">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-foreground flex items-center gap-2">
                <History className="h-5 w-5 text-primary" />
                Generated Documents
              </h3>
              <span className="text-sm text-muted-foreground">
                {generatedDocuments.filter(d => d.generation_status === 'success').length} versions total
              </span>
            </div>

            {generatedDocuments.length === 0 ? (
              <div className="text-center py-12">
                <FileText className="h-12 w-12 mx-auto text-muted-foreground/50 mb-4" />
                <p className="text-muted-foreground">No documents generated yet</p>
                <Button 
                  variant="outline" 
                  className="mt-4"
                  onClick={() => setActiveTab('generate')}
                >
                  Go to Generate
                </Button>
              </div>
            ) : (
              <div className="space-y-4">
                {Array.from(getDocumentsGroupedByTemplate().entries()).map(([templateId, { template, documents }]) => {
                  if (documents.length === 0) return null;
                  
                  const isExpanded = expandedTemplates.has(templateId);
                  const successDocs = documents.filter(d => d.generation_status === 'success');
                  const failedDocs = documents.filter(d => d.generation_status === 'failed');
                  
                  return (
                    <Collapsible 
                      key={templateId} 
                      open={isExpanded}
                      onOpenChange={() => toggleTemplateExpanded(templateId)}
                    >
                      <div className="rounded-lg border border-border overflow-hidden">
                        <CollapsibleTrigger asChild>
                          <button className="w-full p-4 flex items-center justify-between hover:bg-muted/50 transition-colors text-left">
                            <div className="flex items-center gap-3">
                              <FileText className="h-5 w-5 text-primary" />
                              <div>
                                <span className="font-medium text-foreground">
                                  {template?.name || 'Unknown Template'}
                                </span>
                                <div className="flex items-center gap-3 text-xs text-muted-foreground mt-0.5">
                                  <span>{successDocs.length} version{successDocs.length !== 1 ? 's' : ''}</span>
                                  {failedDocs.length > 0 && (
                                    <span className="text-destructive">{failedDocs.length} failed</span>
                                  )}
                                </div>
                              </div>
                            </div>
                            <div className="flex items-center gap-2">
                              {successDocs.length > 0 && (
                                <Badge className="bg-success/10 text-success text-xs">
                                  Latest: v{successDocs[0].version_number}
                                </Badge>
                              )}
                              {isExpanded ? (
                                <ChevronDown className="h-4 w-4 text-muted-foreground" />
                              ) : (
                                <ChevronRight className="h-4 w-4 text-muted-foreground" />
                              )}
                            </div>
                          </button>
                        </CollapsibleTrigger>
                        
                        <CollapsibleContent>
                          <div className="border-t border-border">
                            <div className="divide-y divide-border">
                              {documents.map((doc) => (
                                <div 
                                  key={doc.id} 
                                  className={cn(
                                    "p-4 flex items-center justify-between gap-4",
                                    doc.generation_status === 'failed' && "bg-destructive/5"
                                  )}
                                >
                                  <div className="flex-1">
                                    <div className="flex items-center gap-2">
                                      <span className="font-medium text-foreground">
                                        Version {doc.version_number}
                                      </span>
                                      {doc.generation_status === 'success' ? (
                                        <Badge className="bg-success/10 text-success text-xs">Success</Badge>
                                      ) : doc.generation_status === 'failed' ? (
                                        <Badge variant="destructive" className="text-xs">Failed</Badge>
                                      ) : (
                                        <Badge variant="secondary" className="text-xs">
                                          {doc.generation_status}
                                        </Badge>
                                      )}
                                    </div>
                                    <div className="flex items-center gap-4 text-xs text-muted-foreground mt-1">
                                      <span className="flex items-center gap-1">
                                        <Clock className="h-3 w-3" />
                                        {format(new Date(doc.created_at), 'MMM d, yyyy h:mm a')}
                                      </span>
                                      <span className="flex items-center gap-1">
                                        <User className="h-3 w-3" />
                                        {getCreatorName(doc.created_by)}
                                      </span>
                                    </div>
                                    {doc.error_message && (
                                      <p className="text-sm text-destructive mt-2">
                                        {doc.error_message}
                                      </p>
                                    )}
                                  </div>
                                  
                                  {doc.generation_status === 'success' && (
                                    <div className="flex items-center gap-2">
                                      <Button
                                        variant="outline"
                                        size="sm"
                                        className="gap-1"
                                        onClick={() => handleDownload(
                                          doc.output_docx_path,
                                          `${template?.name || 'document'}_v${doc.version_number}.docx`
                                        )}
                                      >
                                        <Download className="h-3.5 w-3.5" />
                                        DOCX
                                      </Button>
                                      {doc.output_pdf_path && (
                                        <Button
                                          variant="outline"
                                          size="sm"
                                          className="gap-1"
                                          onClick={() => handleDownload(
                                            doc.output_pdf_path!,
                                            `${template?.name || 'document'}_v${doc.version_number}.pdf`
                                          )}
                                        >
                                          <Download className="h-3.5 w-3.5" />
                                          PDF
                                        </Button>
                                      )}
                                    </div>
                                  )}
                                </div>
                              ))}
                            </div>
                          </div>
                        </CollapsibleContent>
                      </div>
                    </Collapsible>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}
      <Dialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <FileOutput className="h-5 w-5" />
              {generationMode === 'packet' ? 'Generate Full Packet' : 'Generate Document'}
            </DialogTitle>
            <DialogDescription>
              {generationMode === 'packet' ? (
                <>
                  This will generate all {packetTemplates.length} templates in the packet.
                  Existing documents will receive new version numbers.
                </>
              ) : (
                <>
                  This will generate a new version of the selected template.
                  Previous versions will remain accessible.
                </>
              )}
            </DialogDescription>
          </DialogHeader>
          
          <div className="py-4">
            <div className="p-3 rounded-lg bg-muted/50 space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Deal</span>
                <span className="font-medium">{deal.deal_number}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Output Type</span>
                <span className="font-medium">
                  {outputType === 'docx_only' ? 'DOCX Only' : 'DOCX + PDF'}
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Templates</span>
                <span className="font-medium">
                  {generationMode === 'packet' 
                    ? `${packetTemplates.length} templates` 
                    : packetTemplates.find(pt => pt.template_id === selectedTemplateId)?.templates.name
                  }
                </span>
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowConfirmDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleGenerate} disabled={generating}>
              {generating ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Generating...
                </>
              ) : (
                <>
                  <Play className="h-4 w-4 mr-2" />
                  Generate
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default DealDocumentsPage;
