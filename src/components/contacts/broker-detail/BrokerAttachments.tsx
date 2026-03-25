import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Plus, Search, Trash2, Download, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface AttachmentMeta {
  id: string;
  name: string;
  type: string;
  date: string;
  size: string;
  storagePath: string;
}

interface BrokerAttachmentsProps {
  brokerId: string;
  contactDbId: string;
  disabled?: boolean;
}

const BUCKET = 'contact-attachments';

const BrokerAttachments: React.FC<BrokerAttachmentsProps> = ({ brokerId, contactDbId, disabled }) => {
  const [files, setFiles] = useState<AttachmentMeta[]>([]);
  const [search, setSearch] = useState('');
  const [uploading, setUploading] = useState(false);
  const [loading, setLoading] = useState(true);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      const { data } = await supabase
        .from('contacts')
        .select('contact_data')
        .eq('id', contactDbId)
        .single();
      if (data?.contact_data && typeof data.contact_data === 'object') {
        const cd = data.contact_data as Record<string, unknown>;
        if (Array.isArray(cd._attachments)) {
          setFiles(cd._attachments as AttachmentMeta[]);
        }
      }
      setLoading(false);
    };
    if (contactDbId) load();
  }, [contactDbId]);

  const persistAttachments = useCallback(async (updated: AttachmentMeta[]) => {
    const { data: current } = await supabase
      .from('contacts')
      .select('contact_data')
      .eq('id', contactDbId)
      .single();
    const existing = (current?.contact_data && typeof current.contact_data === 'object')
      ? current.contact_data as Record<string, unknown>
      : {};
    const merged = { ...existing, _attachments: updated };
    await supabase.from('contacts').update({ contact_data: merged as any, updated_at: new Date().toISOString() }).eq('id', contactDbId);
  }, [contactDbId]);

  const filtered = files.filter(f => {
    if (!search) return true;
    return f.name.toLowerCase().includes(search.toLowerCase());
  });

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (disabled) {
      toast.error('You have read-only access to attachments');
      if (inputRef.current) inputRef.current.value = '';
      return;
    }
    const fileList = e.target.files;
    if (!fileList || fileList.length === 0) return;
    setUploading(true);
    const newFiles: AttachmentMeta[] = [];
    for (const file of Array.from(fileList)) {
      const storagePath = `${contactDbId}/${crypto.randomUUID()}_${file.name}`;
      const { error } = await supabase.storage.from(BUCKET).upload(storagePath, file);
      if (error) {
        toast.error(`Failed to upload ${file.name}: ${error.message}`);
        continue;
      }
      newFiles.push({
        id: crypto.randomUUID(),
        name: file.name,
        type: file.type || 'unknown',
        date: new Date().toLocaleDateString(),
        size: `${(file.size / 1024).toFixed(1)} KB`,
        storagePath,
      });
    }
    const updated = [...files, ...newFiles];
    setFiles(updated);
    await persistAttachments(updated);
    toast.success(`${newFiles.length} file(s) uploaded`);
    setUploading(false);
    if (inputRef.current) inputRef.current.value = '';
  };

  const handleDelete = async (id: string) => {
    if (disabled) {
      toast.error('You have read-only access to attachments');
      return;
    }
    const file = files.find(f => f.id === id);
    if (file) {
      await supabase.storage.from(BUCKET).remove([file.storagePath]);
    }
    const updated = files.filter(f => f.id !== id);
    setFiles(updated);
    await persistAttachments(updated);
    toast.success('Attachment deleted');
  };

  const handleDownload = async (file: AttachmentMeta) => {
    const { data, error } = await supabase.storage.from(BUCKET).download(file.storagePath);
    if (error || !data) {
      toast.error('Failed to download file');
      return;
    }
    const url = URL.createObjectURL(data);
    const a = document.createElement('a');
    a.href = url;
    a.download = file.name;
    a.click();
    URL.revokeObjectURL(url);
  };

  if (loading) {
    return <div className="flex items-center justify-center py-12 text-muted-foreground"><Loader2 className="h-5 w-5 animate-spin mr-2" /> Loading attachments…</div>;
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h4 className="text-lg font-semibold text-foreground">Attachments</h4>
        <div className="flex items-center gap-2">
          <div className="relative">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input placeholder="Search..." value={search} onChange={e => setSearch(e.target.value)} className="pl-8 h-9 w-[200px]" />
          </div>
          {!disabled && (
            <>
              <input ref={inputRef} type="file" multiple className="hidden" onChange={handleUpload} />
              <Button variant="outline" size="sm" onClick={() => inputRef.current?.click()} className="gap-1" disabled={uploading}>
                {uploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
                {uploading ? 'Uploading...' : 'Upload'}
              </Button>
            </>
          )}
        </div>
      </div>

      <div className="border border-border rounded-lg">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/50">
              <TableHead>Name</TableHead><TableHead>Type</TableHead><TableHead>Date</TableHead><TableHead>Size</TableHead><TableHead className="w-[100px]" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.length === 0 ? (
              <TableRow><TableCell colSpan={5} className="text-center py-8 text-muted-foreground">No attachments.</TableCell></TableRow>
            ) : filtered.map(f => (
              <TableRow key={f.id}>
                <TableCell className="font-medium">{f.name}</TableCell>
                <TableCell>{f.type}</TableCell>
                <TableCell>{f.date}</TableCell>
                <TableCell>{f.size}</TableCell>
                <TableCell>
                   <div className="flex items-center gap-1">
                    <Button variant="ghost" size="sm" onClick={() => handleDownload(f)}><Download className="h-4 w-4 text-muted-foreground" /></Button>
                    {!disabled && <Button variant="ghost" size="sm" onClick={() => handleDelete(f.id)}><Trash2 className="h-4 w-4 text-destructive" /></Button>}
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
};

export default BrokerAttachments;
