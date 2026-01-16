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
  Upload, 
  Loader2, 
  MoreHorizontal,
  Pencil,
  Trash2,
  Eye
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { cn } from '@/lib/utils';

interface Template {
  id: string;
  name: string;
  state: string;
  product_type: string;
  version: number;
  is_active: boolean;
  description: string | null;
  file_path: string | null;
  created_at: string;
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
  const [editingTemplate, setEditingTemplate] = useState<Template | null>(null);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const { toast } = useToast();

  const [formData, setFormData] = useState({
    name: '',
    state: '',
    product_type: '',
    version: 1,
    is_active: true,
    description: '',
    file_path: '',
  });

  useEffect(() => {
    fetchTemplates();
  }, []);

  const fetchTemplates = async () => {
    try {
      const { data, error } = await supabase
        .from('templates')
        .select('*')
        .order('name');

      if (error) throw error;
      setTemplates(data || []);
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

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
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

    setUploading(true);
    try {
      const fileName = `${Date.now()}_${file.name}`;
      const { error } = await supabase.storage
        .from('templates')
        .upload(fileName, file);

      if (error) throw error;

      setFormData((prev) => ({ ...prev, file_path: fileName }));
      toast({
        title: 'File uploaded',
        description: 'Template file uploaded successfully',
      });
    } catch (error: any) {
      console.error('Upload error:', error);
      toast({
        title: 'Upload failed',
        description: error.message || 'Failed to upload file',
        variant: 'destructive',
      });
    } finally {
      setUploading(false);
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
    });
    setIsDialogOpen(true);
  };

  const handleDelete = async (template: Template) => {
    if (!confirm(`Are you sure you want to delete "${template.name}"?`)) return;

    try {
      // Delete file from storage if exists
      if (template.file_path) {
        await supabase.storage.from('templates').remove([template.file_path]);
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
          <DialogContent className="max-w-lg">
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
                  />
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
              <div className="space-y-2">
                <Label>Template File (DOCX)</Label>
                <div className="flex gap-2">
                  <Input
                    type="file"
                    accept=".docx"
                    onChange={handleFileUpload}
                    disabled={uploading}
                    className="flex-1"
                  />
                </div>
                {formData.file_path && (
                  <p className="text-sm text-muted-foreground">
                    File: {formData.file_path}
                  </p>
                )}
                {uploading && (
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Uploading...
                  </div>
                )}
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
                  <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">File</th>
                  <th className="text-right py-3 px-4 text-sm font-medium text-muted-foreground">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredTemplates.map((template) => (
                  <tr key={template.id} className="border-b border-border last:border-0">
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
                      {template.file_path ? (
                        <span className="text-sm text-primary">Uploaded</span>
                      ) : (
                        <span className="text-sm text-muted-foreground">None</span>
                      )}
                    </td>
                    <td className="py-4 px-4 text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="sm">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => handleEdit(template)}>
                            <Pencil className="h-4 w-4 mr-2" />
                            Edit
                          </DropdownMenuItem>
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
