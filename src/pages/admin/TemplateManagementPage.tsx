import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
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
  DialogTrigger,
} from '@/components/ui/dialog';
import { Switch } from '@/components/ui/switch';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { 
  Plus, 
  Search, 
  FileText, 
  Loader2, 
  MoreHorizontal,
  Pencil,
  Trash2,
  Eye,
  Copy,
  Calendar,
  Info,
  FileUp,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  ClipboardCheck,
  AlertCircle
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';

interface Template {
  id: string;
  name: string;
  state: string;
  product_type: string;
  version: number;
  is_active: boolean;
  description: string | null;
  file_path: string | null;
  reference_pdf_path?: string | null;
  created_at: string;
  updated_at: string;
}

interface TemplateFieldMap {
  id: string;
  template_id: string;
  field_dictionary_id: string;
  field_key?: string;
  required_flag: boolean;
  transform_rule: string | null;
  display_order: number | null;
}

interface FieldDictionaryEntry {
  field_key: string;
  label: string;
  data_type: string;
  section: string;
}

interface ValidationResult {
  template: Template;
  fieldMaps: TemplateFieldMap[];
  fieldDictionary: Map<string, FieldDictionaryEntry>;
  missingFields: string[];
  duplicateFields: { fieldKey: string; count: number }[];
  inconsistentMappings: { fieldKey: string; issue: string }[];
  validFields: string[];
}

const US_STATES = [
  'AL', 'AK', 'AZ', 'AR', 'CA', 'CO', 'CT', 'DE', 'FL', 'GA',
  'HI', 'ID', 'IL', 'IN', 'IA', 'KS', 'KY', 'LA', 'ME', 'MD',
  'MA', 'MI', 'MN', 'MS', 'MO', 'MT', 'NE', 'NV', 'NH', 'NJ',
  'NM', 'NY', 'NC', 'ND', 'OH', 'OK', 'OR', 'PA', 'RI', 'SC',
  'SD', 'TN', 'TX', 'UT', 'VT', 'VA', 'WA', 'WV', 'WI', 'WY'
];

const PRODUCT_TYPES = [
  'Conventional',
  'FHA',
  'VA',
  'USDA',
  'Jumbo',
  'Reverse Mortgage',
  'HELOC',
  'Construction'
];

export const TemplateManagementPage: React.FC = () => {
  const [templates, setTemplates] = useState<Template[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [isValidationOpen, setIsValidationOpen] = useState(false);
  const [validating, setValidating] = useState(false);
  const [validationResult, setValidationResult] = useState<ValidationResult | null>(null);
  const [previewTemplate, setPreviewTemplate] = useState<Template | null>(null);
  const [editingTemplate, setEditingTemplate] = useState<Template | null>(null);
  const [saving, setSaving] = useState(false);
  const [uploadingDocx, setUploadingDocx] = useState(false);
  const [uploadingPdf, setUploadingPdf] = useState(false);
  const { toast } = useToast();

  const [formData, setFormData] = useState({
    name: '',
    state: '',
    product_type: '',
    version: 1,
    is_active: true,
    description: '',
    file_path: '',
    reference_pdf_path: '',
  });

  useEffect(() => {
    fetchTemplates();
  }, []);

  const fetchTemplates = async () => {
    try {
      const { data, error } = await supabase
        .from('templates')
        .select('*')
        .order('name')
        .order('version', { ascending: false });

      if (error) throw error;
      setTemplates((data || []) as Template[]);
    } catch (error) {
      console.error('Error fetching templates:', error);
      toast({
        title: 'Error',
        description: 'Failed to load templates',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDocxUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
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

    setUploadingDocx(true);
    try {
      // Sanitize filename: replace spaces and special chars with underscores
      const sanitizedName = file.name.replace(/[^a-zA-Z0-9._-]/g, '_');
      const fileName = `${Date.now()}_${sanitizedName}`;
      const { error } = await supabase.storage
        .from('templates')
        .upload(fileName, file);

      if (error) throw error;

      setFormData((prev) => ({ ...prev, file_path: fileName }));
      toast({
        title: 'File uploaded',
        description: 'Template DOCX file uploaded successfully',
      });
    } catch (error: any) {
      console.error('Upload error:', error);
      toast({
        title: 'Upload failed',
        description: error.message || 'Failed to upload file',
        variant: 'destructive',
      });
    } finally {
      setUploadingDocx(false);
    }
  };

  const handlePdfUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.name.endsWith('.pdf')) {
      toast({
        title: 'Invalid file type',
        description: 'Please upload a .pdf file',
        variant: 'destructive',
      });
      return;
    }

    setUploadingPdf(true);
    try {
      // Sanitize filename: replace spaces and special chars with underscores
      const sanitizedName = file.name.replace(/[^a-zA-Z0-9._-]/g, '_');
      const fileName = `ref_${Date.now()}_${sanitizedName}`;
      const { error } = await supabase.storage
        .from('templates')
        .upload(fileName, file);

      if (error) throw error;

      setFormData((prev) => ({ ...prev, reference_pdf_path: fileName }));
      toast({
        title: 'File uploaded',
        description: 'Reference PDF uploaded successfully',
      });
    } catch (error: any) {
      console.error('Upload error:', error);
      toast({
        title: 'Upload failed',
        description: error.message || 'Failed to upload file',
        variant: 'destructive',
      });
    } finally {
      setUploadingPdf(false);
    }
  };

  const handleSubmit = async () => {
    if (!formData.name || !formData.state || !formData.product_type) {
      toast({
        title: 'Validation error',
        description: 'Please fill in all required fields',
        variant: 'destructive',
      });
      return;
    }

    // Require DOCX file for new templates
    if (!editingTemplate && !formData.file_path) {
      toast({
        title: 'Template file required',
        description: 'Please upload a DOCX template file',
        variant: 'destructive',
      });
      return;
    }

    setSaving(true);
    try {
      if (editingTemplate) {
        const { error } = await supabase
          .from('templates')
          .update({
            name: formData.name,
            state: formData.state,
            product_type: formData.product_type,
            version: formData.version,
            is_active: formData.is_active,
            description: formData.description || null,
            file_path: formData.file_path || null,
            reference_pdf_path: formData.reference_pdf_path || null,
          })
          .eq('id', editingTemplate.id);

        if (error) throw error;
        toast({ title: 'Template updated successfully' });
      } else {
        const { error } = await supabase.from('templates').insert({
          name: formData.name,
          state: formData.state,
          product_type: formData.product_type,
          version: formData.version,
          is_active: formData.is_active,
          description: formData.description || null,
          file_path: formData.file_path || null,
          reference_pdf_path: formData.reference_pdf_path || null,
        });

        if (error) throw error;
        toast({ title: 'Template created successfully' });
      }

      setIsDialogOpen(false);
      resetForm();
      fetchTemplates();
    } catch (error: any) {
      console.error('Save error:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to save template',
        variant: 'destructive',
      });
    } finally {
      setSaving(false);
    }
  };

  const handleCreateNewVersion = async (template: Template) => {
    // Find the highest version for this template configuration
    const existingVersions = templates.filter(
      t => t.name === template.name && 
           t.state === template.state && 
           t.product_type === template.product_type
    );
    const maxVersion = Math.max(...existingVersions.map(t => t.version));
    
    setEditingTemplate(null);
    setFormData({
      name: template.name,
      state: template.state,
      product_type: template.product_type,
      version: maxVersion + 1,
      is_active: true,
      description: template.description || '',
      file_path: '', // Require new file upload for new version
      reference_pdf_path: '',
    });
    setIsDialogOpen(true);
  };

  const handleEdit = (template: Template) => {
    setEditingTemplate(template);
    setFormData({
      name: template.name,
      state: template.state,
      product_type: template.product_type,
      version: template.version,
      is_active: template.is_active,
      description: template.description || '',
      file_path: template.file_path || '',
      reference_pdf_path: template.reference_pdf_path || '',
    });
    setIsDialogOpen(true);
  };

  const handlePreview = (template: Template) => {
    setPreviewTemplate(template);
    setIsPreviewOpen(true);
  };

  const handleValidateMapping = async (template: Template) => {
    setValidating(true);
    setIsValidationOpen(true);
    setValidationResult(null);

    try {
      // Fetch template field maps with joined field dictionary
      const { data: fieldMapsData, error: fieldMapsError } = await supabase
        .from('template_field_maps')
        .select('*, field_dictionary!fk_template_field_maps_field_dictionary(field_key, label, data_type, section)')
        .eq('template_id', template.id)
        .order('display_order');

      if (fieldMapsError) throw fieldMapsError;

      // Map to include field_key from joined field_dictionary
      const fieldMaps: TemplateFieldMap[] = (fieldMapsData || []).map((fm: any) => ({
        ...fm,
        field_key: fm.field_dictionary?.field_key || '',
      }));

      // Get unique field keys from mappings
      const fieldKeys = fieldMaps.map(fm => fm.field_key).filter(Boolean);
      const uniqueFieldKeys = [...new Set(fieldKeys)];

      // Build field dictionary from joined data
      const fieldDictionary = new Map<string, FieldDictionaryEntry>(
        (fieldMapsData || [])
          .filter((fm: any) => fm.field_dictionary)
          .map((fm: any) => [fm.field_dictionary.field_key, fm.field_dictionary])
      );

      // Find missing fields (in template map but field_dictionary join failed)
      const missingFields = fieldMaps
        .filter(fm => !fm.field_key)
        .map(fm => fm.field_dictionary_id);

      // Find duplicate fields (same field key mapped multiple times)
      const fieldCounts = new Map<string, number>();
      fieldKeys.forEach(fk => {
        fieldCounts.set(fk, (fieldCounts.get(fk) || 0) + 1);
      });
      const duplicateFields = Array.from(fieldCounts.entries())
        .filter(([_, count]) => count > 1)
        .map(([fieldKey, count]) => ({ fieldKey, count }));

      // Find inconsistent mappings
      const inconsistentMappings: { fieldKey: string; issue: string }[] = [];
      
      // Check for transform rules that reference invalid transforms
      const validTransforms = ['uppercase', 'lowercase', 'titlecase', 'date', 'currency', 'percentage', 'phone', 'ssn'];
      fieldMaps.forEach(fm => {
        if (fm.transform_rule) {
          const transform = fm.transform_rule.toLowerCase().trim();
          if (!validTransforms.includes(transform)) {
            inconsistentMappings.push({
              fieldKey: fm.field_key || fm.field_dictionary_id,
              issue: `Unknown transform rule: "${fm.transform_rule}"`
            });
          }
        }
      });

      // Check for fields marked required in mapping but optional-looking in dictionary
      fieldMaps.forEach(fm => {
        const dictEntry = fieldDictionary.get(fm.field_key);
        if (dictEntry && fm.required_flag) {
          // Check if it's a calculated field - those shouldn't be marked required for input
          // This would need additional data, so we'll skip for now
        }
      });

      // Valid fields are those that exist in dictionary and have no issues
      const problemFieldKeys = new Set([
        ...missingFields,
        ...duplicateFields.map(d => d.fieldKey),
        ...inconsistentMappings.map(i => i.fieldKey)
      ]);
      const validFields = uniqueFieldKeys.filter(fk => !problemFieldKeys.has(fk));

      setValidationResult({
        template,
        fieldMaps,
        fieldDictionary,
        missingFields,
        duplicateFields,
        inconsistentMappings,
        validFields
      });
    } catch (error: any) {
      console.error('Validation error:', error);
      toast({
        title: 'Validation Failed',
        description: error.message || 'Failed to validate template mapping',
        variant: 'destructive',
      });
      setIsValidationOpen(false);
    } finally {
      setValidating(false);
    }
  };

  const handleDelete = async (template: Template) => {
    if (!confirm(`Are you sure you want to delete "${template.name}" v${template.version}?`)) return;

    try {
      // Delete files from storage if exists
      const filesToDelete: string[] = [];
      if (template.file_path) filesToDelete.push(template.file_path);
      if (template.reference_pdf_path) filesToDelete.push(template.reference_pdf_path);
      
      if (filesToDelete.length > 0) {
        await supabase.storage.from('templates').remove(filesToDelete);
      }

      const { error } = await supabase
        .from('templates')
        .delete()
        .eq('id', template.id);

      if (error) throw error;

      toast({ title: 'Template deleted successfully' });
      fetchTemplates();
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to delete template',
        variant: 'destructive',
      });
    }
  };

  const toggleActive = async (template: Template) => {
    try {
      const { error } = await supabase
        .from('templates')
        .update({ is_active: !template.is_active })
        .eq('id', template.id);

      if (error) throw error;
      fetchTemplates();
      toast({
        title: template.is_active ? 'Template deactivated' : 'Template activated',
        description: template.is_active 
          ? 'This template can no longer be used in packets' 
          : 'This template is now available for use in packets',
      });
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to update template',
        variant: 'destructive',
      });
    }
  };

  const resetForm = () => {
    setEditingTemplate(null);
    setFormData({
      name: '',
      state: '',
      product_type: '',
      version: 1,
      is_active: true,
      description: '',
      file_path: '',
      reference_pdf_path: '',
    });
  };

  const filteredTemplates = templates.filter(
    (t) =>
      t.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.state.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.product_type.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (loading) {
    return (
      <div className="page-container flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="page-container">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Template Management</h1>
          <p className="text-muted-foreground mt-1">Create and manage document templates</p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={(open) => {
          setIsDialogOpen(open);
          if (!open) resetForm();
        }}>
          <DialogTrigger asChild>
            <Button className="gap-2">
              <Plus className="h-4 w-4" />
              New Template
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{editingTemplate ? 'Edit Template' : 'Create Template'}</DialogTitle>
              <DialogDescription>
                {editingTemplate ? 'Update template details' : 'Add a new document template'}
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="name">Template Name *</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData((prev) => ({ ...prev, name: e.target.value }))}
                  placeholder="e.g., Deed of Trust"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
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
                      {US_STATES.map((state) => (
                        <SelectItem key={state} value={state}>{state}</SelectItem>
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
                      <SelectValue placeholder="Select type" />
                    </SelectTrigger>
                    <SelectContent>
                      {PRODUCT_TYPES.map((type) => (
                        <SelectItem key={type} value={type}>{type}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="version">Version</Label>
                  <Input
                    id="version"
                    type="number"
                    min="1"
                    value={formData.version}
                    onChange={(e) => setFormData((prev) => ({ ...prev, version: parseInt(e.target.value) || 1 }))}
                    disabled={!!editingTemplate}
                  />
                  {editingTemplate && (
                    <p className="text-xs text-muted-foreground">Use "Create New Version" to increment</p>
                  )}
                </div>
                <div className="space-y-2 flex items-end pb-2">
                  <div className="flex items-center gap-2">
                    <Switch
                      checked={formData.is_active}
                      onCheckedChange={(checked) => setFormData((prev) => ({ ...prev, is_active: checked }))}
                    />
                    <Label>Active</Label>
                  </div>
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Input
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData((prev) => ({ ...prev, description: e.target.value }))}
                  placeholder="Optional description"
                />
              </div>
              
              {/* DOCX Template File - Required */}
              <div className="space-y-2">
                <Label className="flex items-center gap-1">
                  <FileUp className="h-4 w-4" />
                  Template File (DOCX) *
                </Label>
                <div className="flex gap-2">
                  <Input
                    type="file"
                    accept=".docx"
                    onChange={handleDocxUpload}
                    disabled={uploadingDocx}
                    className="flex-1"
                  />
                </div>
                {formData.file_path && (
                  <p className="text-sm text-success flex items-center gap-1">
                    <FileText className="h-3 w-3" />
                    {formData.file_path}
                  </p>
                )}
                {uploadingDocx && (
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Uploading DOCX...
                  </div>
                )}
                {!editingTemplate && !formData.file_path && (
                  <p className="text-xs text-muted-foreground">
                    A DOCX template file is required for document generation
                  </p>
                )}
              </div>

              {/* Reference PDF - Optional */}
              <div className="space-y-2">
                <Label className="flex items-center gap-1">
                  <Eye className="h-4 w-4" />
                  Reference PDF (Optional)
                </Label>
                <div className="flex gap-2">
                  <Input
                    type="file"
                    accept=".pdf"
                    onChange={handlePdfUpload}
                    disabled={uploadingPdf}
                    className="flex-1"
                  />
                </div>
                {formData.reference_pdf_path && (
                  <p className="text-sm text-muted-foreground flex items-center gap-1">
                    <FileText className="h-3 w-3" />
                    {formData.reference_pdf_path}
                  </p>
                )}
                {uploadingPdf && (
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Uploading PDF...
                  </div>
                )}
                <p className="text-xs text-muted-foreground">
                  Optional reference PDF for preview purposes only
                </p>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleSubmit} disabled={saving}>
                {saving ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Saving...
                  </>
                ) : (
                  editingTemplate ? 'Update' : 'Create'
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Template Preview Metadata Dialog */}
      <Dialog open={isPreviewOpen} onOpenChange={setIsPreviewOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Info className="h-5 w-5" />
              Template Metadata
            </DialogTitle>
            <DialogDescription>
              Preview template information and configuration
            </DialogDescription>
          </DialogHeader>
          {previewTemplate && (
            <div className="space-y-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <p className="text-xs text-muted-foreground uppercase tracking-wide">Name</p>
                  <p className="font-medium text-foreground">{previewTemplate.name}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-xs text-muted-foreground uppercase tracking-wide">Version</p>
                  <p className="font-medium text-foreground">v{previewTemplate.version}</p>
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <p className="text-xs text-muted-foreground uppercase tracking-wide">State</p>
                  <p className="font-medium text-foreground">{previewTemplate.state}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-xs text-muted-foreground uppercase tracking-wide">Product Type</p>
                  <p className="font-medium text-foreground">{previewTemplate.product_type}</p>
                </div>
              </div>

              <div className="space-y-1">
                <p className="text-xs text-muted-foreground uppercase tracking-wide">Status</p>
                <span className={cn(
                  'inline-flex px-2.5 py-1 rounded-full text-xs font-medium',
                  previewTemplate.is_active
                    ? 'bg-success/10 text-success'
                    : 'bg-muted text-muted-foreground'
                )}>
                  {previewTemplate.is_active ? 'Active' : 'Inactive'}
                </span>
              </div>

              {previewTemplate.description && (
                <div className="space-y-1">
                  <p className="text-xs text-muted-foreground uppercase tracking-wide">Description</p>
                  <p className="text-sm text-foreground">{previewTemplate.description}</p>
                </div>
              )}

              <div className="border-t border-border pt-4 space-y-3">
                <div className="flex items-center gap-2 text-sm">
                  <FileText className="h-4 w-4 text-muted-foreground" />
                  <span className="text-muted-foreground">Template File:</span>
                  <span className={previewTemplate.file_path ? 'text-success' : 'text-destructive'}>
                    {previewTemplate.file_path ? 'Uploaded' : 'Missing'}
                  </span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <Eye className="h-4 w-4 text-muted-foreground" />
                  <span className="text-muted-foreground">Reference PDF:</span>
                  <span className={previewTemplate.reference_pdf_path ? 'text-primary' : 'text-muted-foreground'}>
                    {previewTemplate.reference_pdf_path ? 'Available' : 'None'}
                  </span>
                </div>
              </div>

              <div className="border-t border-border pt-4">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Calendar className="h-4 w-4" />
                  <span>Last updated: {format(new Date(previewTemplate.updated_at), 'MMM d, yyyy h:mm a')}</span>
                </div>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsPreviewOpen(false)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Validation Dialog */}
      <Dialog open={isValidationOpen} onOpenChange={setIsValidationOpen}>
        <DialogContent className="max-w-2xl max-h-[85vh] overflow-hidden flex flex-col">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <ClipboardCheck className="h-5 w-5 text-primary" />
              Validate Template Mapping
            </DialogTitle>
            <DialogDescription>
              {validationResult?.template.name} v{validationResult?.template.version} — Configuration consistency check
            </DialogDescription>
          </DialogHeader>
          
          {validating ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : validationResult ? (
            <ScrollArea className="flex-1 pr-4">
              <div className="space-y-6 py-4">
                {/* Summary Stats */}
                <div className="grid grid-cols-4 gap-3">
                  <div className="p-3 rounded-lg bg-muted/50 text-center">
                    <p className="text-2xl font-bold text-foreground">{validationResult.fieldMaps.length}</p>
                    <p className="text-xs text-muted-foreground">Total Mappings</p>
                  </div>
                  <div className="p-3 rounded-lg bg-success/10 text-center">
                    <p className="text-2xl font-bold text-success">{validationResult.validFields.length}</p>
                    <p className="text-xs text-muted-foreground">Valid</p>
                  </div>
                  <div className="p-3 rounded-lg bg-destructive/10 text-center">
                    <p className="text-2xl font-bold text-destructive">{validationResult.missingFields.length}</p>
                    <p className="text-xs text-muted-foreground">Missing</p>
                  </div>
                  <div className="p-3 rounded-lg bg-warning/10 text-center">
                    <p className="text-2xl font-bold text-warning">
                      {validationResult.duplicateFields.length + validationResult.inconsistentMappings.length}
                    </p>
                    <p className="text-xs text-muted-foreground">Issues</p>
                  </div>
                </div>

                {/* Overall Status */}
                {validationResult.missingFields.length === 0 && 
                 validationResult.duplicateFields.length === 0 && 
                 validationResult.inconsistentMappings.length === 0 ? (
                  <div className="flex items-center gap-3 p-4 rounded-lg bg-success/10 border border-success/20">
                    <CheckCircle2 className="h-6 w-6 text-success" />
                    <div>
                      <p className="font-medium text-success">All mappings are valid</p>
                      <p className="text-sm text-muted-foreground">
                        This template is ready for document generation
                      </p>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center gap-3 p-4 rounded-lg bg-warning/10 border border-warning/20">
                    <AlertTriangle className="h-6 w-6 text-warning" />
                    <div>
                      <p className="font-medium text-warning">Issues detected</p>
                      <p className="text-sm text-muted-foreground">
                        Review and fix the issues below to prevent generation failures
                      </p>
                    </div>
                  </div>
                )}

                {/* Missing Fields */}
                {validationResult.missingFields.length > 0 && (
                  <div className="space-y-3">
                    <div className="flex items-center gap-2">
                      <XCircle className="h-4 w-4 text-destructive" />
                      <h4 className="font-medium text-foreground">
                        Missing Field Dictionary Entries ({validationResult.missingFields.length})
                      </h4>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      These field keys are mapped to the template but don't exist in the Field Dictionary.
                    </p>
                    <div className="space-y-2">
                      {validationResult.missingFields.map((fieldKey) => {
                        const mapping = validationResult.fieldMaps.find(fm => fm.field_key === fieldKey);
                        return (
                          <div 
                            key={fieldKey}
                            className="flex items-center justify-between p-3 rounded-lg bg-destructive/5 border border-destructive/20"
                          >
                            <div>
                              <code className="text-sm font-mono text-destructive">{fieldKey}</code>
                              {mapping?.required_flag && (
                                <Badge variant="destructive" className="ml-2 text-xs">Required</Badge>
                              )}
                            </div>
                            <Badge variant="outline" className="text-destructive border-destructive/30">
                              Not in Dictionary
                            </Badge>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Duplicate Fields */}
                {validationResult.duplicateFields.length > 0 && (
                  <div className="space-y-3">
                    <div className="flex items-center gap-2">
                      <AlertTriangle className="h-4 w-4 text-warning" />
                      <h4 className="font-medium text-foreground">
                        Duplicate Mappings ({validationResult.duplicateFields.length})
                      </h4>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      These field keys appear multiple times in the template mapping.
                    </p>
                    <div className="space-y-2">
                      {validationResult.duplicateFields.map(({ fieldKey, count }) => (
                        <div 
                          key={fieldKey}
                          className="flex items-center justify-between p-3 rounded-lg bg-warning/5 border border-warning/20"
                        >
                          <code className="text-sm font-mono text-warning">{fieldKey}</code>
                          <Badge variant="outline" className="text-warning border-warning/30">
                            {count} occurrences
                          </Badge>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Inconsistent Mappings */}
                {validationResult.inconsistentMappings.length > 0 && (
                  <div className="space-y-3">
                    <div className="flex items-center gap-2">
                      <AlertCircle className="h-4 w-4 text-warning" />
                      <h4 className="font-medium text-foreground">
                        Inconsistent Mappings ({validationResult.inconsistentMappings.length})
                      </h4>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      These mappings have configuration issues that may cause problems.
                    </p>
                    <div className="space-y-2">
                      {validationResult.inconsistentMappings.map(({ fieldKey, issue }, index) => (
                        <div 
                          key={`${fieldKey}-${index}`}
                          className="p-3 rounded-lg bg-warning/5 border border-warning/20"
                        >
                          <div className="flex items-center justify-between mb-1">
                            <code className="text-sm font-mono text-foreground">{fieldKey}</code>
                          </div>
                          <p className="text-sm text-warning">{issue}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Valid Fields */}
                {validationResult.validFields.length > 0 && (
                  <div className="space-y-3">
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="h-4 w-4 text-success" />
                      <h4 className="font-medium text-foreground">
                        Valid Mappings ({validationResult.validFields.length})
                      </h4>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {validationResult.validFields.map((fieldKey) => {
                        const dictEntry = validationResult.fieldDictionary.get(fieldKey);
                        const mapping = validationResult.fieldMaps.find(fm => fm.field_key === fieldKey);
                        return (
                          <div 
                            key={fieldKey}
                            className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-success/5 border border-success/20"
                          >
                            <CheckCircle2 className="h-3 w-3 text-success" />
                            <span className="text-sm font-mono text-foreground">{fieldKey}</span>
                            {mapping?.required_flag && (
                              <Badge variant="secondary" className="text-xs">Req</Badge>
                            )}
                            {mapping?.transform_rule && (
                              <Badge variant="outline" className="text-xs">{mapping.transform_rule}</Badge>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* No Mappings */}
                {validationResult.fieldMaps.length === 0 && (
                  <div className="text-center py-8">
                    <AlertCircle className="h-12 w-12 mx-auto text-muted-foreground/50 mb-4" />
                    <p className="text-muted-foreground">No field mappings configured for this template</p>
                    <p className="text-sm text-muted-foreground mt-1">
                      Add mappings in the Field Map Editor to enable document generation
                    </p>
                  </div>
                )}
              </div>
            </ScrollArea>
          ) : null}
          
          <DialogFooter className="border-t border-border pt-4">
            <Button variant="outline" onClick={() => setIsValidationOpen(false)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <div className="section-card mb-6">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search templates..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
      </div>

      {filteredTemplates.length === 0 ? (
        <div className="section-card text-center py-12">
          <FileText className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
          <h3 className="text-lg font-medium text-foreground mb-2">No templates found</h3>
          <p className="text-muted-foreground">Create your first template to get started</p>
        </div>
      ) : (
        <div className="section-card">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">Name</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">State</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">Product</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">Version</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">Status</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">Files</th>
                  <th className="text-right py-3 px-4 text-sm font-medium text-muted-foreground">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredTemplates.map((template) => (
                  <tr key={template.id} className="border-b border-border last:border-0 hover:bg-muted/50 transition-colors">
                    <td className="py-4 px-4 font-medium text-foreground">{template.name}</td>
                    <td className="py-4 px-4 text-foreground">{template.state}</td>
                    <td className="py-4 px-4 text-foreground">{template.product_type}</td>
                    <td className="py-4 px-4 text-muted-foreground">v{template.version}</td>
                    <td className="py-4 px-4">
                      <button
                        onClick={() => toggleActive(template)}
                        className={cn(
                          'inline-flex px-2.5 py-1 rounded-full text-xs font-medium cursor-pointer transition-colors',
                          template.is_active
                            ? 'bg-success/10 text-success hover:bg-success/20'
                            : 'bg-muted text-muted-foreground hover:bg-muted/80'
                        )}
                      >
                        {template.is_active ? 'Active' : 'Inactive'}
                      </button>
                    </td>
                    <td className="py-4 px-4">
                      <div className="flex items-center gap-2">
                        {template.file_path ? (
                          <span className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded">DOCX</span>
                        ) : (
                          <span className="text-xs bg-destructive/10 text-destructive px-2 py-0.5 rounded">No DOCX</span>
                        )}
                        {template.reference_pdf_path && (
                          <span className="text-xs bg-muted text-muted-foreground px-2 py-0.5 rounded">PDF</span>
                        )}
                      </div>
                    </td>
                    <td className="py-4 px-4 text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="sm">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => handlePreview(template)}>
                            <Eye className="h-4 w-4 mr-2" />
                            View Metadata
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleValidateMapping(template)}>
                            <ClipboardCheck className="h-4 w-4 mr-2" />
                            Validate Mapping
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem onClick={() => handleEdit(template)}>
                            <Pencil className="h-4 w-4 mr-2" />
                            Edit
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleCreateNewVersion(template)}>
                            <Copy className="h-4 w-4 mr-2" />
                            Create New Version
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem 
                            onClick={() => handleDelete(template)}
                            className="text-destructive"
                          >
                            <Trash2 className="h-4 w-4 mr-2" />
                            Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

export default TemplateManagementPage;
