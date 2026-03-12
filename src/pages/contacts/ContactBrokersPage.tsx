import React, { useState, useCallback } from 'react';
import { Plus, Download, Search, ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import { ContactBrokerModal } from '@/components/contacts/ContactBrokerModal';
import { ContactBrokerDetail } from '@/components/contacts/ContactBrokerDetail';
import { ColumnConfigPopover, ColumnConfig } from '@/components/deal/ColumnConfigPopover';
import { useTableColumnConfig } from '@/hooks/useTableColumnConfig';
import { useContactsList, createContact, type ContactRecord } from '@/hooks/useContactsList';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from '@/hooks/use-toast';

export interface ContactBroker {
  id: string;
  brokerId: string;
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
  { id: 'contact_id', label: 'Broker ID', visible: true },
  { id: 'full_name', label: 'Full Name', visible: true },
  { id: 'email', label: 'Email', visible: true },
  { id: 'phone', label: 'Phone', visible: true },
  { id: 'city', label: 'City', visible: true },
  { id: 'state', label: 'State', visible: true },
  { id: 'company', label: 'Company', visible: true },
];

const ContactBrokersPage: React.FC = () => {
  const { user } = useAuth();
  const {
    contacts, totalCount, totalPages, loading, page, setPage,
    searchQuery, setSearchQuery, refetch, pageSize,
  } = useContactsList('broker');
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedContact, setSelectedContact] = useState<ContactRecord | null>(null);
  const [columns, setColumns, resetColumns] = useTableColumnConfig('contact_brokers_v2', DEFAULT_COLUMNS);

  const visibleColumns = columns.filter((c) => c.visible);

  const handleCreate = useCallback(async (data: Omit<ContactBroker, 'id' | 'brokerId'>) => {
    if (!user) return;
    try {
      await createContact('broker', {
        full_name: data.fullName || `${data.firstName} ${data.lastName}`.trim(),
        first_name: data.firstName,
        last_name: data.lastName,
        email: data.email,
        phone: data.cellPhone || data.homePhone || data.workPhone,
        city: data.city,
        state: data.state,
        contact_data: {
          'broker.first_name': data.firstName,
          'broker.last_name': data.lastName,
          'broker.email': data.email,
          'broker.phone.cell': data.cellPhone,
          'broker.phone.home': data.homePhone,
          'broker.phone.work': data.workPhone,
          'broker.phone.fax': data.fax,
          'broker.address.street': data.street,
          'broker.address.city': data.city,
          'broker.address.state': data.state,
          'broker.address.zip': data.zip,
          'broker.tax_id': data.tin,
          'broker.issue_1099': String(data.send1099),
        },
      }, user.id);
      setModalOpen(false);
      refetch();
      toast({ title: 'Created', description: 'Broker contact created successfully.' });
    } catch (err) {
      console.error('Error creating contact:', err);
      toast({ title: 'Error', description: 'Failed to create contact.', variant: 'destructive' });
    }
  }, [user, refetch]);

  const handleExport = useCallback(() => {
    if (contacts.length === 0) return;
    const headers = visibleColumns.map((c) => c.label);
    const rows = contacts.map((c) =>
      visibleColumns.map((col) => String((c as any)[col.id] || ''))
    );
    const csv = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'contact_brokers.csv';
    a.click();
    URL.revokeObjectURL(url);
  }, [contacts, visibleColumns]);

  const renderCellValue = (contact: ContactRecord, columnId: string) => {
    const val = (contact as any)[columnId];
    if (columnId === 'full_name') return <span className="font-medium">{String(val || '-')}</span>;
    return String(val || '-');
  };

  const handleContactUpdated = useCallback((updated: ContactRecord) => {
    setSelectedContact(updated);
    refetch();
  }, [refetch]);

  if (selectedContact) {
    return (
      <div className="h-full flex flex-col">
        <ContactBrokerDetail
          contact={selectedContact}
          onBack={() => { setSelectedContact(null); refetch(); }}
          onUpdated={handleContactUpdated}
        />
      </div>
    );
  }

  return (
    <div className="p-6 space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold text-lg text-foreground">Contact Brokers</h3>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={handleExport} className="gap-1">
            <Download className="h-4 w-4" /> Export
          </Button>
          <div className="relative">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search..."
              value={searchQuery}
              onChange={(e) => { setSearchQuery(e.target.value); setPage(1); }}
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
        <Table className="min-w-[800px]">
          <TableHeader>
            <TableRow className="bg-muted/50">
              {visibleColumns.map((col) => (
                <TableHead key={col.id}>{col.label.toUpperCase()}</TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={visibleColumns.length} className="text-center py-8 text-muted-foreground">
                  Loading...
                </TableCell>
              </TableRow>
            ) : contacts.length === 0 ? (
              <TableRow>
                <TableCell colSpan={visibleColumns.length} className="text-center py-8 text-muted-foreground">
                  {searchQuery ? 'No brokers match your search.' : 'No contact brokers yet. Click "Create New" to add one.'}
                </TableCell>
              </TableRow>
            ) : (
              contacts.map((contact) => (
                <TableRow
                  key={contact.id}
                  className="cursor-pointer hover:bg-muted/30"
                  onClick={() => setSelectedContact(contact)}
                >
                  {visibleColumns.map((col) => (
                    <TableCell key={col.id}>{renderCellValue(contact, col.id)}</TableCell>
                  ))}
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {totalCount > 0 && (
        <div className="flex items-center justify-between">
          <div className="text-sm text-muted-foreground">
            Showing {(page - 1) * pageSize + 1}–{Math.min(page * pageSize, totalCount)} of {totalCount}
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage(page - 1)}>
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <span className="text-sm text-muted-foreground">Page {page} of {totalPages}</span>
            <Button variant="outline" size="sm" disabled={page >= totalPages} onClick={() => setPage(page + 1)}>
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}

      <ContactBrokerModal
        open={modalOpen}
        onOpenChange={setModalOpen}
        onSubmit={handleCreate}
      />
    </div>
  );
};

export default ContactBrokersPage;
