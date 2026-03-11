import React, { useState, useCallback } from 'react';
import { Plus, Download, Search, Settings2, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import { ContactLenderModal } from '@/components/contacts/ContactLenderModal';
import { ContactLenderDetailForm } from '@/components/contacts/ContactLenderDetailForm';
import { ColumnConfigPopover, ColumnConfig } from '@/components/deal/ColumnConfigPopover';
import { useTableColumnConfig } from '@/hooks/useTableColumnConfig';

export interface ContactLender {
  id: string;
  lenderId: string;
  frozen: boolean;
  type: string;
  ach: boolean;
  email: string;
  agreement: boolean;
  fullName: string;
  firstName: string;
  lastName: string;
  city: string;
  state: string;
  cellPhone: string;
  homePhone: string;
  workPhone: string;
  fax: string;
  preferredPhone: string;
  verified: boolean;
  send1099: boolean;
  tin: string;
  investorQuestionnaire: string;
  street: string;
  zip: string;
  mailingStreet: string;
  mailingCity: string;
  mailingState: string;
  mailingZip: string;
  sameAsPrimary: boolean;
}

const DEFAULT_COLUMNS: ColumnConfig[] = [
  { id: 'lenderId', label: 'Lender ID', visible: true },
  { id: 'frozen', label: 'Frozen', visible: true },
  { id: 'type', label: 'Type', visible: true },
  { id: 'ach', label: 'ACH', visible: true },
  { id: 'email', label: 'Email', visible: true },
  { id: 'agreement', label: 'Agreement', visible: true },
  { id: 'fullName', label: 'Full Name', visible: true },
  { id: 'city', label: 'City', visible: true },
  { id: 'state', label: 'State', visible: true },
  { id: 'cellPhone', label: 'Cell Phone', visible: true },
  { id: 'verified', label: 'Verified', visible: true },
  { id: 'send1099', label: '1099', visible: true },
];

let nextId = 1;
function generateLenderId() {
  return `L-${String(nextId++).padStart(5, '0')}`;
}

const ContactLendersPage: React.FC = () => {
  const [lenders, setLenders] = useState<ContactLender[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedLender, setSelectedLender] = useState<ContactLender | null>(null);
  const [columns, setColumns, resetColumns] = useTableColumnConfig('contact_lenders_v1', DEFAULT_COLUMNS);

  const visibleColumns = columns.filter((c) => c.visible);

  const filteredLenders = lenders.filter((l) => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return (
      l.lenderId.toLowerCase().includes(q) ||
      l.fullName.toLowerCase().includes(q) ||
      l.email.toLowerCase().includes(q) ||
      l.city.toLowerCase().includes(q) ||
      l.state.toLowerCase().includes(q) ||
      l.cellPhone.toLowerCase().includes(q) ||
      l.type.toLowerCase().includes(q)
    );
  });

  const handleCreate = useCallback((data: Omit<ContactLender, 'id' | 'lenderId'>) => {
    const newLender: ContactLender = {
      ...data,
      id: crypto.randomUUID(),
      lenderId: generateLenderId(),
    };
    setLenders((prev) => [...prev, newLender]);
    setModalOpen(false);
  }, []);

  const handleUpdate = useCallback((updated: ContactLender) => {
    setLenders((prev) => prev.map((l) => (l.id === updated.id ? updated : l)));
    setSelectedLender(null);
  }, []);

  const handleExport = useCallback(() => {
    if (lenders.length === 0) return;
    const headers = DEFAULT_COLUMNS.map((c) => c.label);
    const rows = lenders.map((l) =>
      DEFAULT_COLUMNS.map((c) => {
        const val = l[c.id as keyof ContactLender];
        return typeof val === 'boolean' ? (val ? 'Yes' : 'No') : String(val || '');
      })
    );
    const csv = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'contact_lenders.csv';
    a.click();
    URL.revokeObjectURL(url);
  }, [lenders]);

  const renderCellValue = (lender: ContactLender, columnId: string) => {
    const val = lender[columnId as keyof ContactLender];
    if (typeof val === 'boolean') {
      return val ? '✓' : '';
    }
    if (columnId === 'fullName') {
      return <span className="font-medium">{String(val || '-')}</span>;
    }
    return String(val || '-');
  };

  // Detail view
  if (selectedLender) {
    return (
      <div className="p-6 space-y-4">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="sm" onClick={() => setSelectedLender(null)}>
            <ArrowLeft className="h-4 w-4 mr-1" /> Back to Lenders
          </Button>
          <h3 className="font-semibold text-lg text-foreground">
            {selectedLender.fullName || 'Lender Detail'}
          </h3>
        </div>
        <ContactLenderDetailForm
          lender={selectedLender}
          onSave={handleUpdate}
          onCancel={() => setSelectedLender(null)}
        />
      </div>
    );
  }

  return (
    <div className="p-6 space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h3 className="font-semibold text-lg text-foreground">Contact Lenders</h3>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={handleExport} className="gap-1">
            <Download className="h-4 w-4" /> Export
          </Button>
          <div className="relative">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-8 h-9 w-[200px]"
            />
          </div>
          <ColumnConfigPopover columns={columns} onColumnsChange={setColumns} onResetColumns={resetColumns} />
          <Button variant="outline" size="sm" onClick={() => setModalOpen(true)} className="gap-1">
            <Plus className="h-4 w-4" /> Create New
          </Button>
        </div>
      </div>

      {/* Table */}
      <div className="border border-border rounded-lg overflow-x-auto">
        <Table className="min-w-[1000px]">
          <TableHeader>
            <TableRow className="bg-muted/50">
              {visibleColumns.map((col) => (
                <TableHead key={col.id}>{col.label.toUpperCase()}</TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredLenders.length === 0 ? (
              <TableRow>
                <TableCell colSpan={visibleColumns.length} className="text-center py-8 text-muted-foreground">
                  {lenders.length === 0
                    ? 'No contact lenders yet. Click "Create New" to add one.'
                    : 'No lenders match your search.'}
                </TableCell>
              </TableRow>
            ) : (
              filteredLenders.map((lender) => (
                <TableRow
                  key={lender.id}
                  className="cursor-pointer hover:bg-muted/30"
                  onClick={() => setSelectedLender(lender)}
                >
                  {visibleColumns.map((col) => (
                    <TableCell key={col.id}>{renderCellValue(lender, col.id)}</TableCell>
                  ))}
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Footer */}
      {lenders.length > 0 && (
        <div className="flex justify-end">
          <div className="text-sm text-muted-foreground">
            {filteredLenders.length !== lenders.length && `Showing ${filteredLenders.length} of `}
            Total: {lenders.length}
          </div>
        </div>
      )}

      <ContactLenderModal
        open={modalOpen}
        onOpenChange={setModalOpen}
        onSubmit={handleCreate}
      />
    </div>
  );
};

export default ContactLendersPage;
