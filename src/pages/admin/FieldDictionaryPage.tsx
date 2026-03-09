import React, { useState, useEffect, useMemo } from 'react';
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
import { Checkbox } from '@/components/ui/checkbox';
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
  Trash2,
  Download,
  Asterisk
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
  form_type: string;
  is_calculated: boolean;
  is_repeatable: boolean;
  is_mandatory: boolean;
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

// Primary UI sections — excludes 'other' and system/UI-only sections
const SECTIONS = [
  { value: 'borrower', label: 'Borrower' },
  { value: 'co_borrower', label: 'Co-Borrower' },
  { value: 'loan_terms', label: 'Loan Terms' },
  { value: 'property', label: 'Property' },
  { value: 'lender', label: 'Lender' },
  { value: 'broker', label: 'Broker' },
  { value: 'charges', label: 'Charges' },
  { value: 'dates', label: 'Dates' },
  { value: 'escrow', label: 'Escrow' },
  { value: 'origination_fees', label: 'Origination Fees' },
  { value: 'insurance', label: 'Insurance' },
  { value: 'notes', label: 'Notes' },
  { value: 'seller', label: 'Seller' },
  { value: 'title', label: 'Title' },
];

const FORM_TYPES = [
  { value: 'primary', label: 'Primary' },
  { value: 'additional', label: 'Additional' },
  { value: 'guarantor', label: 'Guarantor' },
  { value: 'banking', label: 'Banking' },
  { value: 'tax', label: 'Tax' },
  { value: 'notes', label: 'Notes' },
  { value: 'attachment', label: 'Attachment' },
  { value: 'legal', label: 'Legal' },
  { value: 'insurance', label: 'Insurance' },
  { value: 'liens', label: 'Liens' },
  { value: 'detail', label: 'Detail' },
  { value: 'servicing', label: 'Servicing' },
  { value: 'funding', label: 'Funding' },
  { value: 'balances', label: 'Balances' },
  { value: 'penalties', label: 'Penalties' },
  { value: 'general', label: 'General' },
];

const DATA_TYPES = [
  { value: 'text', label: 'Text' },
  { value: 'number', label: 'Number' },
  { value: 'currency', label: 'Currency' },
  { value: 'date', label: 'Date' },
  { value: 'percentage', label: 'Percentage' },
  { value: 'boolean', label: 'Boolean' },
  { value: 'phone', label: 'Phone' },
  { value: 'dropdown', label: 'Dropdown' },
  { value: 'integer', label: 'Integer' },
  { value: 'decimal', label: 'Decimal' },
];

// Section abbreviation map for field key generation
const SECTION_ABBR: Record<string, string> = {
  borrower: 'br',
  co_borrower: 'cb',
  loan_terms: 'ln',
  property: 'pr',
  lender: 'ld',
  broker: 'bk',
  charges: 'ch',
  dates: 'dt',
  escrow: 'es',
  origination_fees: 'of',
  insurance: 'in',
  notes: 'nt',
  seller: 'sl',
  title: 'tt',
};

const FORM_ABBR: Record<string, string> = {
  primary: 'p',
  additional: 'a',
  guarantor: 'g',
  banking: 'b',
  tax: 't',
  notes: 'n',
  attachment: 'at',
  legal: 'lg',
  insurance: 'in',
  liens: 'li',
  detail: 'd',
  servicing: 'sv',
  funding: 'fd',
  balances: 'bl',
  penalties: 'pn',
  general: 'g',
};

function generateFieldKeyFromConvention(label: string, section: string, formType: string): string {
  const sectionAbbr = SECTION_ABBR[section] || section.substring(0, 2);
  const formAbbr = FORM_ABBR[formType] || formType.substring(0, 1);
  // Create a camelCase-ish identifier from the label
  const identifier = label
    .replace(/[^a-zA-Z0-9\s]/g, '')
    .split(/\s+/)
    .map((word, idx) => {
      if (idx === 0) return word.charAt(0).toLowerCase() + word.slice(1).toLowerCase();
      return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();
    })
    .join('')
    .substring(0, 12);
  return `${sectionAbbr}_${formAbbr}_${identifier}`;
}

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
    form_type: 'primary',
    data_type: 'text',
    is_calculated: false,
    is_repeatable: false,
    is_mandatory: false,
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
      setFields((data || []).map((d: any) => ({
        ...d,
        form_type: d.form_type || 'primary',
        is_mandatory: d.is_mandatory || false,
        allowed_roles: d.allowed_roles || ['admin', 'csr'],
        read_only_roles: d.read_only_roles || [],
      })));
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

  const handleLabelChange = (label: string) => {
    setFormData((prev) => ({
      ...prev,
      label,
      field_key: editingField ? prev.field_key : generateFieldKeyFromConvention(label, prev.section, prev.form_type),
    }));
  };

  const handleSectionChange = (section: string) => {
    setFormData((prev) => ({
      ...prev,
      section,
      field_key: editingField ? prev.field_key : generateFieldKeyFromConvention(prev.label, section, prev.form_type),
    }));
  };

  const handleFormTypeChange = (formType: string) => {
    setFormData((prev) => ({
      ...prev,
      form_type: formType,
      field_key: editingField ? prev.field_key : generateFieldKeyFromConvention(prev.label, prev.section, formType),
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

    // Duplicate field_key check
    const duplicateExists = fields.some(
      (f) => f.field_key === formData.field_key && f.id !== editingField?.id
    );
    if (duplicateExists) {
      toast({
        title: 'Duplicate Field Key',
        description: `The field key "${formData.field_key}" already exists. Please use a unique key.`,
        variant: 'destructive',
      });
      return;
    }

    setSaving(true);
    try {
      const payload: Record<string, any> = {
        field_key: formData.field_key,
        label: formData.label,
        section: formData.section as any,
        form_type: formData.form_type,
        data_type: formData.data_type as any,
        is_calculated: formData.is_calculated,
        is_repeatable: formData.is_repeatable,
        is_mandatory: formData.is_mandatory,
        description: formData.description || null,
        default_value: formData.default_value || null,
        validation_rule: formData.validation_rule || null,
        allowed_roles: formData.allowed_roles,
        read_only_roles: formData.read_only_roles,
      };

      if (editingField) {
        const { error } = await supabase
          .from('field_dictionary')
          .update(payload as any)
          .eq('id', editingField.id);

        if (error) throw error;
        toast({ title: 'Field updated successfully' });
      } else {
        const { error } = await supabase.from('field_dictionary').insert(payload as any);
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
      form_type: field.form_type || 'primary',
      data_type: field.data_type,
      is_calculated: field.is_calculated,
      is_repeatable: field.is_repeatable,
      is_mandatory: field.is_mandatory,
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

  const handleToggleMandatory = async (field: FieldDictionary) => {
    try {
      const { error } = await supabase
        .from('field_dictionary')
        .update({ is_mandatory: !field.is_mandatory } as any)
        .eq('id', field.id);

      if (error) throw error;

      setFields(prev => prev.map(f => 
        f.id === field.id ? { ...f, is_mandatory: !f.is_mandatory } : f
      ));
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to update mandatory status',
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
      form_type: 'primary',
      data_type: 'text',
      is_calculated: false,
      is_repeatable: false,
      is_mandatory: false,
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
        return {
          ...prev,
          [field]: currentRoles.filter(r => r !== role),
        };
      } else {
        return {
          ...prev,
          [field]: [...currentRoles, role],
          [otherField]: prev[otherField].filter(r => r !== role),
        };
      }
    });
  };

  // CSV export
  const handleExportCSV = () => {
    const rows = filteredFields.map(f => ({
      Section: f.section,
      'Form Type': f.form_type,
      'Field Label': f.label,
      'Field Key': f.field_key,
      'Field Type': f.data_type,
      Mandatory: f.is_mandatory ? 'Yes' : 'No',
      Calculated: f.is_calculated ? 'Yes' : 'No',
      Repeatable: f.is_repeatable ? 'Yes' : 'No',
    }));

    const headers = Object.keys(rows[0] || {});
    const csvContent = [
      headers.join(','),
      ...rows.map(row => headers.map(h => `"${(row as any)[h] || ''}"`).join(',')),
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `field_dictionary${filterSection ? `_${filterSection}` : ''}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const filteredFields = useMemo(() => {
    return fields
      .filter(f => f.section !== 'other') // Exclude 'other' section from display
      .filter((f) => {
        const matchesSearch =
          f.label.toLowerCase().includes(searchQuery.toLowerCase()) ||
          f.field_key.toLowerCase().includes(searchQuery.toLowerCase());
        const matchesSection = !filterSection || f.section === filterSection;
        return matchesSearch && matchesSection;
      });
  }, [fields, searchQuery, filterSection]);

  // Group by section
  const groupedFields = useMemo(() => {
    return filteredFields.reduce((acc, field) => {
      if (!acc[field.section]) acc[field.section] = [];
      acc[field.section].push(field);
      return acc;
    }, {} as Record<string, FieldDictionary[]>);
  }, [filteredFields]);

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
          <p className="text-muted-foreground mt-1">
            Manage data fields — {filteredFields.length} of {fields.filter(f => f.section !== 'other').length} fields shown
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" className="gap-2" onClick={handleExportCSV} disabled={filteredFields.length === 0}>
            <Download className="h-4 w-4" />
            Export CSV
          </Button>
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
                    <Label>Form Type *</Label>
                    <Select value={formData.form_type} onValueChange={handleFormTypeChange}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {FORM_TYPES.map((t) => (
                          <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
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
                <div className="space-y-2">
                  <Label htmlFor="fieldKey">Field Key</Label>
                  <Input
                    id="fieldKey"
                    value={formData.field_key}
                    onChange={(e) => setFormData((prev) => ({ ...prev, field_key: e.target.value }))}
                    placeholder="Auto-generated from convention"
                    className="font-mono text-sm"
                  />
                  <p className="text-xs text-muted-foreground">
                    Format: <code className="bg-muted px-1 rounded">{'{section}_{form}_{field}'}</code> — e.g. <code className="bg-muted px-1 rounded">br_p_fn</code>
                  </p>
                </div>
                <div className="flex gap-6">
                  <div className="flex items-center gap-2">
                    <Switch
                      checked={formData.is_mandatory}
                      onCheckedChange={(checked) => setFormData((prev) => ({ ...prev, is_mandatory: checked }))}
                    />
                    <Label className="flex items-center gap-1">
                      Mandatory
                      <Asterisk className="h-3 w-3 text-destructive" />
                    </Label>
                  </div>
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
      </div>

      <div className="section-card mb-6">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search by label or field key..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
          <Select value={filterSection || "all"} onValueChange={(v) => setFilterSection(v === "all" ? "" : v)}>
            <SelectTrigger className="w-[200px]">
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
                {section.replace(/_/g, ' ')}
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
                      <th className="text-left py-2 px-3 text-sm font-medium text-muted-foreground">Form</th>
                      <th className="text-left py-2 px-3 text-sm font-medium text-muted-foreground">Type</th>
                      <th className="text-center py-2 px-3 text-sm font-medium text-muted-foreground">Mandatory</th>
                      <th className="text-left py-2 px-3 text-sm font-medium text-muted-foreground">Flags</th>
                      <th className="text-right py-2 px-3 text-sm font-medium text-muted-foreground">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {sectionFields.map((field) => (
                      <tr key={field.id} className="border-b border-border last:border-0 hover:bg-muted/50">
                        <td className="py-2.5 px-3 font-medium text-foreground text-sm">{field.label}</td>
                        <td className="py-2.5 px-3 font-mono text-xs text-muted-foreground">{field.field_key}</td>
                        <td className="py-2.5 px-3">
                          <span className="inline-flex px-2 py-0.5 rounded text-xs font-medium bg-accent/50 text-accent-foreground capitalize">
                            {field.form_type || 'primary'}
                          </span>
                        </td>
                        <td className="py-2.5 px-3">
                          <span className="inline-flex px-2 py-0.5 rounded text-xs font-medium bg-muted text-muted-foreground capitalize">
                            {field.data_type}
                          </span>
                        </td>
                        <td className="py-2.5 px-3 text-center">
                          <Checkbox
                            checked={field.is_mandatory}
                            onCheckedChange={() => handleToggleMandatory(field)}
                            className="mx-auto"
                          />
                        </td>
                        <td className="py-2.5 px-3">
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
                        <td className="py-2.5 px-3 text-right">
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
