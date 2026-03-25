import React, { useState, useCallback } from 'react';
import { Plus, Search } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { EmailInput } from '@/components/ui/email-input';
import { Label } from '@/components/ui/label';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';

interface AuthParty { id: string; name: string; email: string; phone: string; title: string; }

const BrokerAuthorizedParty: React.FC<{ brokerId: string; disabled?: boolean }> = ({ disabled = false }) => {
  const [parties, setParties] = useState<AuthParty[]>([]);
  const [search, setSearch] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [form, setForm] = useState({ name: '', email: '', phone: '', title: '' });

  const filtered = parties.filter(p => {
    if (!search) return true;
    const q = search.toLowerCase();
    return p.name.toLowerCase().includes(q) || p.email.toLowerCase().includes(q) || p.title.toLowerCase().includes(q);
  });

  const handleAdd = useCallback(() => {
    if (disabled || !form.name) return;
    setParties(prev => [...prev, { ...form, id: crypto.randomUUID() }]);
    setForm({ name: '', email: '', phone: '', title: '' });
    setModalOpen(false);
  }, [disabled, form]);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h4 className="text-lg font-semibold text-foreground">Authorized Parties</h4>
        <div className="flex items-center gap-2">
          <div className="relative">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input placeholder="Search..." value={search} onChange={e => setSearch(e.target.value)} className="pl-8 h-9 w-[200px]" />
          </div>
          <Button variant="outline" size="sm" onClick={() => setModalOpen(true)} className="gap-1" disabled={disabled}><Plus className="h-4 w-4" /> Add Party</Button>
        </div>
      </div>

      <div className="border border-border rounded-lg">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/50">
              <TableHead>Name</TableHead><TableHead>Email</TableHead><TableHead>Phone</TableHead><TableHead>Role / Title</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.length === 0 ? (
              <TableRow><TableCell colSpan={4} className="text-center py-8 text-muted-foreground">No authorized parties.</TableCell></TableRow>
            ) : filtered.map(p => (
              <TableRow key={p.id}>
                <TableCell className="font-medium">{p.name}</TableCell>
                <TableCell>{p.email || '-'}</TableCell>
                <TableCell>{p.phone || '-'}</TableCell>
                <TableCell>{p.title || '-'}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <Dialog open={modalOpen} onOpenChange={(open) => { if (!disabled) setModalOpen(open); }}>
        <DialogContent>
          <DialogHeader><DialogTitle>Add Authorized Party</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div><Label>Name</Label><Input value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))} disabled={disabled} /></div>
            <div><Label>Email</Label><EmailInput value={form.email} onValueChange={(v) => setForm(p => ({ ...p, email: v }))} disabled={disabled} /></div>
            <div><Label>Phone</Label><Input value={form.phone} onChange={e => setForm(p => ({ ...p, phone: e.target.value }))} disabled={disabled} /></div>
            <div><Label>Role / Title</Label><Input value={form.title} onChange={e => setForm(p => ({ ...p, title: e.target.value }))} disabled={disabled} /></div>
          </div>
          <DialogFooter><Button onClick={handleAdd} disabled={disabled}>Add</Button></DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default BrokerAuthorizedParty;
