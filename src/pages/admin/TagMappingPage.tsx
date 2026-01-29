import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { toast } from 'sonner';
import {
  Plus,
  Search,
  Pencil,
  Trash2,
  Download,
  Tag,
  FileText,
  Hash,
} from 'lucide-react';

type MergeTagType = 'merge_tag' | 'label' | 'f_code';

interface MergeTagAlias {
  id: string;
  tag_name: string;
  field_key: string;
  tag_type: MergeTagType;
  replace_next: string | null;
  is_active: boolean;
  description: string | null;
  created_at: string;
  updated_at: string;
}

interface MergeTagForm {
  tag_name: string;
  field_key: string;
  tag_type: MergeTagType;
  replace_next: string;
  is_active: boolean;
  description: string;
}

const initialFormState: MergeTagForm = {
  tag_name: '',
  field_key: '',
  tag_type: 'merge_tag',
  replace_next: '',
  is_active: true,
  description: '',
};

const tagTypeIcons: Record<MergeTagType, React.ReactNode> = {
  merge_tag: <Tag className="h-4 w-4" />,
  label: <FileText className="h-4 w-4" />,
  f_code: <Hash className="h-4 w-4" />,
};

const tagTypeColors: Record<MergeTagType, string> = {
  merge_tag: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
  label: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
  f_code: 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200',
};

export default function TagMappingPage() {
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<MergeTagType | 'all'>('all');
  const [filterActive, setFilterActive] = useState<'all' | 'active' | 'inactive'>('all');
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [editingTag, setEditingTag] = useState<MergeTagAlias | null>(null);
  const [deleteTag, setDeleteTag] = useState<MergeTagAlias | null>(null);
  const [formData, setFormData] = useState<MergeTagForm>(initialFormState);

  // Fetch all merge tag aliases
  const { data: aliases = [], isLoading } = useQuery({
    queryKey: ['merge_tag_aliases'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('merge_tag_aliases')
        .select('*')
        .order('tag_type', { ascending: true })
        .order('tag_name', { ascending: true });

      if (error) throw error;
      return data as MergeTagAlias[];
    },
  });

  // Fetch field dictionary for suggestions
  const { data: fieldKeys = [] } = useQuery({
    queryKey: ['field_dictionary_keys'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('field_dictionary')
        .select('field_key')
        .order('field_key');

      if (error) throw error;
      return data.map((d) => d.field_key);
    },
  });

  // Create mutation
  const createMutation = useMutation({
    mutationFn: async (data: MergeTagForm) => {
      const { error } = await supabase.from('merge_tag_aliases').insert({
        tag_name: data.tag_name,
        field_key: data.field_key,
        tag_type: data.tag_type,
        replace_next: data.replace_next || null,
        is_active: data.is_active,
        description: data.description || null,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['merge_tag_aliases'] });
      toast.success('Tag mapping created successfully');
      setIsCreateOpen(false);
      setFormData(initialFormState);
    },
    onError: (error: any) => {
      toast.error(`Failed to create: ${error.message}`);
    },
  });

  // Update mutation
  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: MergeTagForm }) => {
      const { error } = await supabase
        .from('merge_tag_aliases')
        .update({
          tag_name: data.tag_name,
          field_key: data.field_key,
          tag_type: data.tag_type,
          replace_next: data.replace_next || null,
          is_active: data.is_active,
          description: data.description || null,
        })
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['merge_tag_aliases'] });
      toast.success('Tag mapping updated successfully');
      setEditingTag(null);
      setFormData(initialFormState);
    },
    onError: (error: any) => {
      toast.error(`Failed to update: ${error.message}`);
    },
  });

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('merge_tag_aliases')
        .delete()
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['merge_tag_aliases'] });
      toast.success('Tag mapping deleted');
      setDeleteTag(null);
    },
    onError: (error: any) => {
      toast.error(`Failed to delete: ${error.message}`);
    },
  });

  // Filter aliases
  const filteredAliases = aliases.filter((alias) => {
    const matchesSearch =
      alias.tag_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      alias.field_key.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (alias.description?.toLowerCase().includes(searchTerm.toLowerCase()) ?? false);
    const matchesType = filterType === 'all' || alias.tag_type === filterType;
    const matchesActive =
      filterActive === 'all' ||
      (filterActive === 'active' && alias.is_active) ||
      (filterActive === 'inactive' && !alias.is_active);
    return matchesSearch && matchesType && matchesActive;
  });

  // Export to CSV
  const handleExport = () => {
    const headers = ['tag_name', 'field_key', 'tag_type', 'replace_next', 'is_active', 'description'];
    const csvContent = [
      headers.join(','),
      ...filteredAliases.map((a) =>
        [
          `"${a.tag_name}"`,
          `"${a.field_key}"`,
          a.tag_type,
          `"${a.replace_next || ''}"`,
          a.is_active,
          `"${a.description || ''}"`,
        ].join(',')
      ),
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `merge_tag_aliases_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success('Exported to CSV');
  };

  const handleOpenCreate = () => {
    setFormData(initialFormState);
    setIsCreateOpen(true);
  };

  const handleOpenEdit = (tag: MergeTagAlias) => {
    setFormData({
      tag_name: tag.tag_name,
      field_key: tag.field_key,
      tag_type: tag.tag_type,
      replace_next: tag.replace_next || '',
      is_active: tag.is_active,
      description: tag.description || '',
    });
    setEditingTag(tag);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.tag_name.trim() || !formData.field_key.trim()) {
      toast.error('Tag name and field key are required');
      return;
    }

    if (editingTag) {
      updateMutation.mutate({ id: editingTag.id, data: formData });
    } else {
      createMutation.mutate(formData);
    }
  };

  const stats = {
    total: aliases.length,
    mergeTags: aliases.filter((a) => a.tag_type === 'merge_tag').length,
    labels: aliases.filter((a) => a.tag_type === 'label').length,
    fCodes: aliases.filter((a) => a.tag_type === 'f_code').length,
    active: aliases.filter((a) => a.is_active).length,
  };

  return (
    <div className="p-6">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Tag Mapping Manager</h1>
            <p className="text-muted-foreground">
              Manage merge tag aliases for document generation
            </p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={handleExport}>
              <Download className="mr-2 h-4 w-4" />
              Export CSV
            </Button>
            <Button onClick={handleOpenCreate}>
              <Plus className="mr-2 h-4 w-4" />
              Add Mapping
            </Button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
          <div className="rounded-lg border bg-card p-4">
            <div className="text-sm font-medium text-muted-foreground">Total Mappings</div>
            <div className="text-2xl font-bold">{stats.total}</div>
          </div>
          <div className="rounded-lg border bg-card p-4">
            <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
              <Tag className="h-4 w-4" /> Merge Tags
            </div>
            <div className="text-2xl font-bold">{stats.mergeTags}</div>
          </div>
          <div className="rounded-lg border bg-card p-4">
            <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
              <FileText className="h-4 w-4" /> Labels
            </div>
            <div className="text-2xl font-bold">{stats.labels}</div>
          </div>
          <div className="rounded-lg border bg-card p-4">
            <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
              <Hash className="h-4 w-4" /> F-Codes
            </div>
            <div className="text-2xl font-bold">{stats.fCodes}</div>
          </div>
          <div className="rounded-lg border bg-card p-4">
            <div className="text-sm font-medium text-muted-foreground">Active</div>
            <div className="text-2xl font-bold text-primary">{stats.active}</div>
          </div>
        </div>

        {/* Filters */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search by tag name, field key, or description..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
          <Select
            value={filterType}
            onValueChange={(value) => setFilterType(value as MergeTagType | 'all')}
          >
            <SelectTrigger className="w-40">
              <SelectValue placeholder="Tag Type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Types</SelectItem>
              <SelectItem value="merge_tag">Merge Tags</SelectItem>
              <SelectItem value="label">Labels</SelectItem>
              <SelectItem value="f_code">F-Codes</SelectItem>
            </SelectContent>
          </Select>
          <Select
            value={filterActive}
            onValueChange={(value) => setFilterActive(value as 'all' | 'active' | 'inactive')}
          >
            <SelectTrigger className="w-32">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All</SelectItem>
              <SelectItem value="active">Active</SelectItem>
              <SelectItem value="inactive">Inactive</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Table */}
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[200px]">Tag Name</TableHead>
                <TableHead className="w-[200px]">Field Key</TableHead>
                <TableHead className="w-[120px]">Type</TableHead>
                <TableHead>Replace Next</TableHead>
                <TableHead className="w-[80px]">Active</TableHead>
                <TableHead className="w-[100px]">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8">
                    Loading...
                  </TableCell>
                </TableRow>
              ) : filteredAliases.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                    No mappings found
                  </TableCell>
                </TableRow>
              ) : (
                filteredAliases.map((alias) => (
                  <TableRow key={alias.id} className={!alias.is_active ? 'opacity-50' : ''}>
                    <TableCell className="font-mono text-sm">{alias.tag_name}</TableCell>
                    <TableCell className="font-mono text-sm text-muted-foreground">
                      {alias.field_key}
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant="secondary"
                        className={`gap-1 ${tagTypeColors[alias.tag_type]}`}
                      >
                        {tagTypeIcons[alias.tag_type]}
                        {alias.tag_type.replace('_', ' ')}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {alias.replace_next || '—'}
                    </TableCell>
                    <TableCell>
                      <Badge variant={alias.is_active ? 'default' : 'secondary'}>
                        {alias.is_active ? 'Yes' : 'No'}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleOpenEdit(alias)}
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => setDeleteTag(alias)}
                        >
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>

        {/* Showing count */}
        <div className="text-sm text-muted-foreground">
          Showing {filteredAliases.length} of {aliases.length} mappings
        </div>
      </div>

      {/* Create/Edit Dialog */}
      <Dialog
        open={isCreateOpen || !!editingTag}
        onOpenChange={(open) => {
          if (!open) {
            setIsCreateOpen(false);
            setEditingTag(null);
            setFormData(initialFormState);
          }
        }}
      >
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{editingTag ? 'Edit Tag Mapping' : 'Add Tag Mapping'}</DialogTitle>
            <DialogDescription>
              {editingTag
                ? 'Update the mapping between a document tag and field key.'
                : 'Create a new mapping between a document tag and field key.'}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="tag_name">Tag Name *</Label>
              <Input
                id="tag_name"
                value={formData.tag_name}
                onChange={(e) => setFormData({ ...formData, tag_name: e.target.value })}
                placeholder="e.g., Borrower_Name or DATE OF NOTE:"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="field_key">Field Key *</Label>
              <Input
                id="field_key"
                value={formData.field_key}
                onChange={(e) => setFormData({ ...formData, field_key: e.target.value })}
                placeholder="e.g., borrower.full_name"
                list="field_key_suggestions"
              />
              <datalist id="field_key_suggestions">
                {fieldKeys.map((key) => (
                  <option key={key} value={key} />
                ))}
              </datalist>
            </div>

            <div className="space-y-2">
              <Label htmlFor="tag_type">Tag Type</Label>
              <Select
                value={formData.tag_type}
                onValueChange={(value) =>
                  setFormData({ ...formData, tag_type: value as MergeTagType })
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="merge_tag">Merge Tag ({"{{...}}"} or «...»)</SelectItem>
                  <SelectItem value="label">Label (static text replacement)</SelectItem>
                  <SelectItem value="f_code">F-Code (system field code)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {formData.tag_type === 'label' && (
              <div className="space-y-2">
                <Label htmlFor="replace_next">Replace Next</Label>
                <Input
                  id="replace_next"
                  value={formData.replace_next}
                  onChange={(e) => setFormData({ ...formData, replace_next: e.target.value })}
                  placeholder="Text following the label to replace"
                />
                <p className="text-xs text-muted-foreground">
                  For labels, this is the placeholder text that follows the label and should be replaced.
                </p>
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Optional description..."
                rows={2}
              />
            </div>

            <div className="flex items-center justify-between">
              <Label htmlFor="is_active">Active</Label>
              <Switch
                id="is_active"
                checked={formData.is_active}
                onCheckedChange={(checked) => setFormData({ ...formData, is_active: checked })}
              />
            </div>

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setIsCreateOpen(false);
                  setEditingTag(null);
                }}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={createMutation.isPending || updateMutation.isPending}
              >
                {editingTag ? 'Update' : 'Create'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={!!deleteTag} onOpenChange={(open) => !open && setDeleteTag(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Tag Mapping?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete the mapping for "{deleteTag?.tag_name}". This action
              cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deleteTag && deleteMutation.mutate(deleteTag.id)}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
