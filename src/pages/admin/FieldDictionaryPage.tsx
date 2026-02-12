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
import { fetchAllRows } from '@/lib/supabasePagination';
import { 
  Plus, 
  Search, 
  Key, 
  Loader2, 
  MoreHorizontal,
  Pencil,
  Trash2
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { cn } from '@/lib/utils';

interface FieldDictionary {
  id: string;
  field_key: string;
  label: string;
  section: string;
  data_type: string;
  is_calculated: boolean;
  is_repeatable: boolean;
  description: string | null;
  default_value: string | null;
  validation_rule: string | null;
  allowed_roles: string[];
  read_only_roles: string[];
}

const ROLES = [
  { value: 'admin', label: 'Admin' },
  { value: 'csr', label: 'CSR' },
  { value: 'borrower', label: 'Borrower' },
  { value: 'broker', label: 'Broker' },
  { value: 'lender', label: 'Lender' },
];

const SECTIONS = [
  { value: 'borrower', label: 'Borrower' },
  { value: 'co_borrower', label: 'Co-Borrower' },
  { value: 'loan_terms', label: 'Loan Terms' },
  { value: 'property', label: 'Property' },
  { value: 'seller', label: 'Seller' },
  { value: 'title', label: 'Title' },
  { value: 'escrow', label: 'Escrow' },
  { value: 'broker', label: 'Broker' },
  { value: 'lender', label: 'Lender' },
  { value: 'other', label: 'Other' },
];

const DATA_TYPES = [
  { value: 'text', label: 'Text' },
  { value: 'number', label: 'Number' },
  { value: 'currency', label: 'Currency' },
  { value: 'date', label: 'Date' },
  { value: 'percentage', label: 'Percentage' },
  { value: 'boolean', label: 'Boolean' },
];

export const FieldDictionaryPage: React.FC = () => {
  const [fields, setFields] = useState<FieldDictionary[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterSection, setFilterSection] = useState<string>('');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingField, setEditingField] = useState<FieldDictionary | null>(null);
  const [saving, setSaving] = useState(false);
  const { toast } = useToast();

  const [formData, setFormData] = useState({
    field_key: '',
    label: '',
    section: 'borrower',
    data_type: 'text',
    is_calculated: false,
    is_repeatable: false,
    description: '',
    default_value: '',
    validation_rule: '',
    allowed_roles: ['admin', 'csr'] as string[],
    read_only_roles: [] as string[],
  });

  useEffect(() => {
    fetchFields();
  }, []);

  const fetchFields = async () => {
    try {
      const data = await fetchAllRows((client) =>
        client
          .from('field_dictionary')
          .select('*')
          .order('section, label')
      );
      setFields(data || []);
    } catch (error) {
      console.error('Error fetching fields:', error);
      toast({
        title: 'Error',
        description: 'Failed to load field dictionary',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const generateFieldKey = (label: string, section: string) => {
    const sanitized = label.toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_|_$/g, '');
    return `${section}.${sanitized}`;
  };

  const handleLabelChange = (label: string) => {
    setFormData((prev) => ({
      ...prev,
      label,
      field_key: editingField ? prev.field_key : generateFieldKey(label, prev.section),
    }));
  };

  const handleSectionChange = (section: string) => {
    setFormData((prev) => ({
      ...prev,
      section,
      field_key: editingField ? prev.field_key : generateFieldKey(prev.label, section),
    }));
  };

  const handleSubmit = async () => {
    if (!formData.field_key || !formData.label || !formData.section) {
      toast({
        title: 'Validation error',
        description: 'Please fill in all required fields',
        variant: 'destructive',
      });
      return;
    }

    setSaving(true);
    try {
      const payload = {
        field_key: formData.field_key,
        label: formData.label,
        section: formData.section as any,
        data_type: formData.data_type as any,
        is_calculated: formData.is_calculated,
        is_repeatable: formData.is_repeatable,
        description: formData.description || null,
        default_value: formData.default_value || null,
        validation_rule: formData.validation_rule || null,
        allowed_roles: formData.allowed_roles,
        read_only_roles: formData.read_only_roles,
      };

      if (editingField) {
        const { error } = await supabase
          .from('field_dictionary')
          .update(payload)
          .eq('id', editingField.id);

        if (error) throw error;
        toast({ title: 'Field updated successfully' });
      } else {
        const { error } = await supabase.from('field_dictionary').insert(payload);
        if (error) throw error;
        toast({ title: 'Field created successfully' });
      }

      setIsDialogOpen(false);
      resetForm();
      fetchFields();
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to save field',
        variant: 'destructive',
      });
    } finally {
      setSaving(false);
    }
  };

  const handleEdit = (field: FieldDictionary) => {
    setEditingField(field);
    setFormData({
      field_key: field.field_key,
      label: field.label,
      section: field.section,
      data_type: field.data_type,
      is_calculated: field.is_calculated,
      is_repeatable: field.is_repeatable,
      description: field.description || '',
      default_value: field.default_value || '',
      validation_rule: field.validation_rule || '',
      allowed_roles: field.allowed_roles || ['admin', 'csr'],
      read_only_roles: field.read_only_roles || [],
    });
    setIsDialogOpen(true);
  };

  const handleDelete = async (field: FieldDictionary) => {
    if (!confirm(`Are you sure you want to delete "${field.label}"?`)) return;

    try {
      const { error } = await supabase
        .from('field_dictionary')
        .delete()
        .eq('id', field.id);

      if (error) throw error;
      toast({ title: 'Field deleted successfully' });
      fetchFields();
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to delete field',
        variant: 'destructive',
      });
    }
  };

  const resetForm = () => {
    setEditingField(null);
    setFormData({
      field_key: '',
      label: '',
      section: 'borrower',
      data_type: 'text',
      is_calculated: false,
      is_repeatable: false,
      description: '',
      default_value: '',
      validation_rule: '',
      allowed_roles: ['admin', 'csr'],
      read_only_roles: [],
    });
  };

  const toggleRole = (role: string, field: 'allowed_roles' | 'read_only_roles') => {
    setFormData(prev => {
      const currentRoles = prev[field];
      const otherField = field === 'allowed_roles' ? 'read_only_roles' : 'allowed_roles';
      
      if (currentRoles.includes(role)) {
        // Remove role
        return {
          ...prev,
          [field]: currentRoles.filter(r => r !== role),
        };
      } else {
        // Add role and ensure it's not in the other field
        return {
          ...prev,
          [field]: [...currentRoles, role],
          [otherField]: prev[otherField].filter(r => r !== role),
        };
      }
    });
  };

  const filteredFields = fields.filter((f) => {
    const matchesSearch =
      f.label.toLowerCase().includes(searchQuery.toLowerCase()) ||
      f.field_key.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesSection = !filterSection || f.section === filterSection;
    return matchesSearch && matchesSection;
  });

  // Group by section
  const groupedFields = filteredFields.reduce((acc, field) => {
    if (!acc[field.section]) acc[field.section] = [];
    acc[field.section].push(field);
    return acc;
  }, {} as Record<string, FieldDictionary[]>);

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
          <h1 className="text-2xl font-bold text-foreground">Field Dictionary</h1>
          <p className="text-muted-foreground mt-1">Define data fields for loan documents</p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={(open) => {
          setIsDialogOpen(open);
          if (!open) resetForm();
        }}>
          <DialogTrigger asChild>
            <Button className="gap-2">
              <Plus className="h-4 w-4" />
              Add Field
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle>{editingField ? 'Edit Field' : 'Create Field'}</DialogTitle>
              <DialogDescription>Define a new data field for the dictionary</DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4 max-h-[60vh] overflow-y-auto">
              <div className="space-y-2">
                <Label htmlFor="label">Label *</Label>
                <Input
                  id="label"
                  value={formData.label}
                  onChange={(e) => handleLabelChange(e.target.value)}
                  placeholder="e.g., Borrower First Name"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Section *</Label>
                  <Select value={formData.section} onValueChange={handleSectionChange}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {SECTIONS.map((s) => (
                        <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Data Type *</Label>
                  <Select
                    value={formData.data_type}
                    onValueChange={(value) => setFormData((prev) => ({ ...prev, data_type: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {DATA_TYPES.map((t) => (
                        <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="fieldKey">Field Key</Label>
                <Input
                  id="fieldKey"
                  value={formData.field_key}
                  onChange={(e) => setFormData((prev) => ({ ...prev, field_key: e.target.value }))}
                  placeholder="Auto-generated"
                  className="font-mono text-sm"
                  disabled={!!editingField}
                />
                <p className="text-xs text-muted-foreground">
                  Unique identifier used in templates (dot notation)
                </p>
              </div>
              <div className="flex gap-6">
                <div className="flex items-center gap-2">
                  <Switch
                    checked={formData.is_calculated}
                    onCheckedChange={(checked) => setFormData((prev) => ({ ...prev, is_calculated: checked }))}
                  />
                  <Label>Calculated</Label>
                </div>
                <div className="flex items-center gap-2">
                  <Switch
                    checked={formData.is_repeatable}
                    onCheckedChange={(checked) => setFormData((prev) => ({ ...prev, is_repeatable: checked }))}
                  />
                  <Label>Repeatable</Label>
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
                <Label htmlFor="defaultValue">Default Value</Label>
                <Input
                  id="defaultValue"
                  value={formData.default_value}
                  onChange={(e) => setFormData((prev) => ({ ...prev, default_value: e.target.value }))}
                  placeholder="Optional default"
                />
              </div>

              {/* Role-based Visibility Section */}
              <div className="border-t pt-4 mt-4">
                <h4 className="font-medium text-foreground mb-3">Field Visibility & Permissions</h4>
                <p className="text-xs text-muted-foreground mb-4">
                  Configure which roles can view and edit this field. CSR and Admin always have full access by default.
                </p>
                
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label className="text-sm">Can View & Edit (Allowed Roles)</Label>
                    <div className="flex flex-wrap gap-2">
                      {ROLES.map(role => (
                        <Button
                          key={role.value}
                          type="button"
                          size="sm"
                          variant={formData.allowed_roles.includes(role.value) ? 'default' : 'outline'}
                          className={cn(
                            'text-xs',
                            formData.allowed_roles.includes(role.value) && 'bg-primary'
                          )}
                          onClick={() => toggleRole(role.value, 'allowed_roles')}
                        >
                          {role.label}
                        </Button>
                      ))}
                    </div>
                    <p className="text-xs text-muted-foreground">
                      These roles can view and edit this field value
                    </p>
                  </div>

                  <div className="space-y-2">
                    <Label className="text-sm">View Only (Read-Only Roles)</Label>
                    <div className="flex flex-wrap gap-2">
                      {ROLES.filter(r => !['admin', 'csr'].includes(r.value)).map(role => (
                        <Button
                          key={role.value}
                          type="button"
                          size="sm"
                          variant={formData.read_only_roles.includes(role.value) ? 'secondary' : 'outline'}
                          className={cn(
                            'text-xs',
                            formData.read_only_roles.includes(role.value) && 'bg-secondary'
                          )}
                          onClick={() => toggleRole(role.value, 'read_only_roles')}
                          disabled={formData.allowed_roles.includes(role.value)}
                        >
                          {role.label}
                        </Button>
                      ))}
                    </div>
                    <p className="text-xs text-muted-foreground">
                      These roles can only view (not edit) this field
                    </p>
                  </div>
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsDialogOpen(false)}>Cancel</Button>
              <Button onClick={handleSubmit} disabled={saving}>
                {saving ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Saving...</> : (editingField ? 'Update' : 'Create')}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <div className="section-card mb-6">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search fields..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
          <Select value={filterSection || "all"} onValueChange={(v) => setFilterSection(v === "all" ? "" : v)}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="All Sections" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Sections</SelectItem>
              {SECTIONS.map((s) => (
                <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {Object.keys(groupedFields).length === 0 ? (
        <div className="section-card text-center py-12">
          <Key className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
          <h3 className="text-lg font-medium text-foreground mb-2">No fields found</h3>
          <p className="text-muted-foreground">Add your first field to the dictionary</p>
        </div>
      ) : (
        <div className="space-y-6">
          {Object.entries(groupedFields).map(([section, sectionFields]) => (
            <div key={section} className="section-card">
              <h3 className="text-lg font-semibold text-foreground mb-4 capitalize">
                {section.replace('_', ' ')}
                <span className="text-sm font-normal text-muted-foreground ml-2">
                  ({sectionFields.length} fields)
                </span>
              </h3>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-border">
                      <th className="text-left py-2 px-3 text-sm font-medium text-muted-foreground">Label</th>
                      <th className="text-left py-2 px-3 text-sm font-medium text-muted-foreground">Field Key</th>
                      <th className="text-left py-2 px-3 text-sm font-medium text-muted-foreground">Type</th>
                      <th className="text-left py-2 px-3 text-sm font-medium text-muted-foreground">Flags</th>
                      <th className="text-left py-2 px-3 text-sm font-medium text-muted-foreground">Visibility</th>
                      <th className="text-right py-2 px-3 text-sm font-medium text-muted-foreground">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {sectionFields.map((field) => (
                      <tr key={field.id} className="border-b border-border last:border-0">
                        <td className="py-3 px-3 font-medium text-foreground">{field.label}</td>
                        <td className="py-3 px-3 font-mono text-sm text-muted-foreground">{field.field_key}</td>
                        <td className="py-3 px-3">
                          <span className="inline-flex px-2 py-0.5 rounded text-xs font-medium bg-muted text-muted-foreground capitalize">
                            {field.data_type}
                          </span>
                        </td>
                        <td className="py-3 px-3">
                          <div className="flex gap-1">
                            {field.is_calculated && (
                              <span className="inline-flex px-2 py-0.5 rounded text-xs font-medium bg-primary/10 text-primary">
                                Calc
                              </span>
                            )}
                            {field.is_repeatable && (
                              <span className="inline-flex px-2 py-0.5 rounded text-xs font-medium bg-success/10 text-success">
                                Repeat
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="py-3 px-3">
                          <div className="flex flex-wrap gap-1">
                            {field.allowed_roles?.filter(r => !['admin', 'csr'].includes(r)).map(role => (
                              <span 
                                key={role} 
                                className="inline-flex px-1.5 py-0.5 rounded text-xs font-medium bg-success/10 text-success capitalize"
                                title="Can view & edit"
                              >
                                {role}
                              </span>
                            ))}
                            {field.read_only_roles?.map(role => (
                              <span 
                                key={role} 
                                className="inline-flex px-1.5 py-0.5 rounded text-xs font-medium bg-warning/10 text-warning capitalize"
                                title="View only"
                              >
                                {role} (RO)
                              </span>
                            ))}
                            {(!field.allowed_roles?.some(r => !['admin', 'csr'].includes(r)) && !field.read_only_roles?.length) && (
                              <span className="text-xs text-muted-foreground">Internal only</span>
                            )}
                          </div>
                        </td>
                        <td className="py-3 px-3 text-right">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="sm">
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem onClick={() => handleEdit(field)}>
                                <Pencil className="h-4 w-4 mr-2" />
                                Edit
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => handleDelete(field)} className="text-destructive">
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
          ))}
        </div>
      )}
    </div>
  );
};

export default FieldDictionaryPage;
