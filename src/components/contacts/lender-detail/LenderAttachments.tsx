import React, { useState, useRef } from 'react';
import { Plus, Search, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';

interface Attachment { id: string; name: string; type: string; date: string; size: string; }

const LenderAttachments: React.FC<{ lenderId: string }> = () => {
  const [files, setFiles] = useState<Attachment[]>([]);
  const [search, setSearch] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  const filtered = files.filter(f => {
    if (!search) return true;
    return f.name.toLowerCase().includes(search.toLowerCase());
  });

  const handleUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const fileList = e.target.files;
    if (!fileList) return;
    const newFiles: Attachment[] = Array.from(fileList).map(f => ({
      id: crypto.randomUUID(), name: f.name, type: f.type || 'unknown',
      date: new Date().toLocaleDateString(), size: `${(f.size / 1024).toFixed(1)} KB`,
    }));
    setFiles(prev => [...prev, ...newFiles]);
    if (inputRef.current) inputRef.current.value = '';
  };

  const handleDelete = (id: string) => setFiles(prev => prev.filter(f => f.id !== id));

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h4 className="text-lg font-semibold text-foreground">Attachments</h4>
        <div className="flex items-center gap-2">
          <div className="relative">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input placeholder="Search..." value={search} onChange={e => setSearch(e.target.value)} className="pl-8 h-9 w-[200px]" />
          </div>
          <input ref={inputRef} type="file" multiple className="hidden" onChange={handleUpload} />
          <Button variant="outline" size="sm" onClick={() => inputRef.current?.click()} className="gap-1"><Plus className="h-4 w-4" /> Upload</Button>
        </div>
      </div>

      <div className="border border-border rounded-lg">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/50">
              <TableHead>Name</TableHead><TableHead>Type</TableHead><TableHead>Date</TableHead><TableHead>Size</TableHead><TableHead className="w-[60px]" />
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
                  <Button variant="ghost" size="sm" onClick={() => handleDelete(f.id)}><Trash2 className="h-4 w-4 text-destructive" /></Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
};

export default LenderAttachments;
