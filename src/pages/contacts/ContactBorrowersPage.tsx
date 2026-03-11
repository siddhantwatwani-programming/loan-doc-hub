import React, { useState, useCallback } from 'react';
import { Plus, Download, Search, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import { ContactBorrowerModal } from '@/components/contacts/ContactBorrowerModal';
import { ContactBorrowerDetailForm } from '@/components/contacts/ContactBorrowerDetailForm';
import { ColumnConfigPopover, ColumnConfig } from '@/components/deal/ColumnConfigPopover';
import { useTableColumnConfig } from '@/hooks/useTableColumnConfig';

export interface ContactBorrower {
  id: string;
  borrowerId: string;
  hold: boolean;
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
  street: string;
  zip: string;
  mailingStreet: string;
  mailingCity: string;
  mailingState: string;
  mailingZip: string;
  sameAsPrimary: boolean;
}

const DEFAULT_COLUMNS: ColumnConfig[] = [
  { id: 'borrowerId', label: 'Borrower ID', visible: true },
  { id: 'hold', label: 'Hold', visible: true },
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
function generateBorrowerId() {
  return `B-${String(nextId++).padStart(5, '0')}`;
}

const ContactBorrowersPage: React.FC = () => {
  const [borrowers, setBorrowers] = useState<ContactBorrower[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedBorrower, setSelectedBorrower] = useState<ContactBorrower | null>(null);
  const [columns, setColumns, resetColumns] = useTableColumnConfig('contact_borrowers_v1', DEFAULT_COLUMNS);

  const visibleColumns = columns.filter((c) => c.visible);

  const filteredBorrowers = borrowers.filter((b) => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return (
      b.borrowerId.toLowerCase().includes(q) ||
      b.fullName.toLowerCase().includes(q) ||
      b.email.toLowerCase().includes(q) ||
      b.city.toLowerCase().includes(q) ||
      b.state.toLowerCase().includes(q) ||
      b.cellPhone.toLowerCase().includes(q) ||
      b.type.toLowerCase().includes(q)
    );
  });

  const handleCreate = useCallback((data: Omit<ContactBorrower, 'id' | 'borrowerId'>) => {
    const newBorrower: ContactBorrower = {
      ...data,
      id: crypto.randomUUID(),
      borrowerId: generateBorrowerId(),
    };
    setBorrowers((prev) => [...prev, newBorrower]);
    setModalOpen(false);
  }, []);

  const handleUpdate = useCallback((updated: ContactBorrower) => {
    setBorrowers((prev) => prev.map((b) => (b.id === updated.id ? updated : b)));
    setSelectedBorrower(null);
  }, []);

  const handleExport = useCallback(() => {
    if (borrowers.length === 0) return;
    const headers = DEFAULT_COLUMNS.map((c) => c.label);
    const rows = borrowers.map((b) =>
      DEFAULT_COLUMNS.map((c) => {
        const val = b[c.id as keyof ContactBorrower];
        return typeof val === 'boolean' ? (val ? 'Yes' : 'No') : String(val || '');
      })
    );
    const csv = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'contact_borrowers.csv';
    a.click();
    URL.revokeObjectURL(url);
  }, [borrowers]);

  const renderCellValue = (borrower: ContactBorrower, columnId: string) => {
    const val = borrower[columnId as keyof ContactBorrower];
    if (typeof val === 'boolean') return val ? '✓' : '';
    if (columnId === 'fullName') return <span className="font-medium">{String(val || '-')}</span>;
    return String(val || '-');
  };

  if (selectedBorrower) {
    return (
      <div className="p-6 space-y-4">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="sm" onClick={() => setSelectedBorrower(null)}>
            <ArrowLeft className="h-4 w-4 mr-1" /> Back to Borrowers
          </Button>
          <h3 className="font-semibold text-lg text-foreground">
            {selectedBorrower.fullName || 'Borrower Detail'}
          </h3>
        </div>
        <ContactBorrowerDetailForm
          borrower={selectedBorrower}
          onSave={handleUpdate}
          onCancel={() => setSelectedBorrower(null)}
        />
      </div>
    );
  }

  return (
    <div className="p-6 space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold text-lg text-foreground">Contact Borrowers</h3>
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
            {filteredBorrowers.length === 0 ? (
              <TableRow>
                <TableCell colSpan={visibleColumns.length} className="text-center py-8 text-muted-foreground">
                  {borrowers.length === 0
                    ? 'No contact borrowers yet. Click "Create New" to add one.'
                    : 'No borrowers match your search.'}
                </TableCell>
              </TableRow>
            ) : (
              filteredBorrowers.map((borrower) => (
                <TableRow
                  key={borrower.id}
                  className="cursor-pointer hover:bg-muted/30"
                  onClick={() => setSelectedBorrower(borrower)}
                >
                  {visibleColumns.map((col) => (
                    <TableCell key={col.id}>{renderCellValue(borrower, col.id)}</TableCell>
                  ))}
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {borrowers.length > 0 && (
        <div className="flex justify-end">
          <div className="text-sm text-muted-foreground">
            {filteredBorrowers.length !== borrowers.length && `Showing ${filteredBorrowers.length} of `}
            Total: {borrowers.length}
          </div>
        </div>
      )}

      <ContactBorrowerModal
        open={modalOpen}
        onOpenChange={setModalOpen}
        onSubmit={handleCreate}
      />
    </div>
  );
};

export default ContactBorrowersPage;
