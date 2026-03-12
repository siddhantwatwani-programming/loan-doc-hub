import React, { useState } from 'react';
import { Download, Search } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';

interface ContactImportButtonProps {
  contactType: 'lender' | 'broker' | 'borrower';
  /** Called with the contact_data values to populate the deal form. Keys use the prefix (e.g. lender., broker., borrower.) */
  onImport: (contactData: Record<string, string>) => void;
  /** The prefix to use for deal values (e.g. lender1, broker1, borrower1) */
  dealPrefix: string;
}

interface SearchResult {
  id: string;
  contact_id: string;
  full_name: string;
  email: string;
  phone: string;
  city: string;
  state: string;
  contact_data: Record<string, any>;
}

export const ContactImportButton: React.FC<ContactImportButtonProps> = ({
  contactType,
  onImport,
  dealPrefix,
}) => {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);

  const handleSearch = async () => {
    if (!query.trim()) return;
    setLoading(true);
    try {
      const q = `%${query.trim()}%`;
      const { data, error } = await (supabase as any)
        .from('contacts')
        .select('id, contact_id, full_name, email, phone, city, state, contact_data')
        .eq('contact_type', contactType)
        .or(`full_name.ilike.${q},email.ilike.${q},contact_id.ilike.${q},company.ilike.${q}`)
        .limit(20);

      if (error) throw error;
      setResults((data || []) as SearchResult[]);
    } catch (err) {
      console.error('Error searching contacts:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSelect = (contact: SearchResult) => {
    const contactData = contact.contact_data || {};
    const mappedValues: Record<string, string> = {};

    // The contact_data stores keys like "lender.full_name", "broker.first_name", etc.
    // We need to remap them to use the deal prefix: "lender1.full_name", "broker1.first_name"
    const typePrefix = `${contactType}.`;
    Object.entries(contactData).forEach(([key, value]) => {
      if (key.startsWith(typePrefix)) {
        const fieldPart = key.slice(typePrefix.length);
        mappedValues[`${dealPrefix}.${fieldPart}`] = String(value ?? '');
      }
    });

    onImport(mappedValues);
    setOpen(false);
    setQuery('');
    setResults([]);
    toast({
      title: 'Contact imported',
      description: `Data from ${contact.full_name || contact.contact_id} has been populated.`,
    });
  };

  const typeLabel = contactType.charAt(0).toUpperCase() + contactType.slice(1);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="gap-1 h-8">
          <Download className="h-3.5 w-3.5" />
          Import from Contact
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Import {typeLabel} from Contacts</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder={`Search by name, email, or ${typeLabel} ID...`}
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                className="pl-8"
              />
            </div>
            <Button onClick={handleSearch} disabled={loading}>
              {loading ? 'Searching...' : 'Search'}
            </Button>
          </div>

          {results.length > 0 ? (
            <div className="border border-border rounded-lg max-h-[400px] overflow-auto">
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/50">
                    <TableHead>ID</TableHead>
                    <TableHead>Name</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>City</TableHead>
                    <TableHead>State</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {results.map((r) => (
                    <TableRow
                      key={r.id}
                      className="cursor-pointer hover:bg-muted/30"
                      onClick={() => handleSelect(r)}
                    >
                      <TableCell className="font-mono text-xs">{r.contact_id}</TableCell>
                      <TableCell className="font-medium">{r.full_name || '-'}</TableCell>
                      <TableCell>{r.email || '-'}</TableCell>
                      <TableCell>{r.city || '-'}</TableCell>
                      <TableCell>{r.state || '-'}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          ) : (
            <p className="text-sm text-muted-foreground text-center py-4">
              {loading ? 'Searching...' : 'Search for a contact to import their data.'}
            </p>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};
