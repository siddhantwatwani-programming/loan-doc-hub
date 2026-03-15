import React, { useState, useCallback, useEffect, useRef } from 'react';
import { useContactsCrud, type ContactRecord } from '@/hooks/useContactsCrud';
import { ContactsListView } from '@/components/contacts/ContactsListView';
import { CreateContactModal } from '@/components/contacts/CreateContactModal';
import ContactBrokerDetailLayout from '@/components/contacts/broker-detail/ContactBrokerDetailLayout';
import type { ColumnConfig } from '@/components/deal/ColumnConfigPopover';
import type { FilterOption } from '@/components/deal/GridToolbar';

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
  { id: 'frozen', label: 'Frozen', visible: true },
  { id: 'company', label: 'Type', visible: true },
  { id: 'ach', label: 'ACH', visible: true },
  { id: 'email', label: 'Email', visible: true },
  { id: 'agreement_on_file', label: 'Agreement on File', visible: true },
  { id: 'full_name', label: 'Full Name', visible: true },
  { id: 'first_name', label: 'First', visible: true },
  { id: 'last_name', label: 'Last', visible: true },
  { id: 'address.street', label: 'Street', visible: true },
  { id: 'city', label: 'City', visible: true },
  { id: 'state', label: 'State', visible: true },
  { id: 'address.zip', label: 'ZIP', visible: true },
  { id: 'phone.home', label: 'Home Phone', visible: true },
  { id: 'phone.work', label: 'Work Phone', visible: true },
  { id: 'phone.cell', label: 'Cell Phone', visible: true },
  { id: 'phone.fax', label: 'Fax', visible: true },
  { id: 'preferred_phone', label: 'Preferred Phone', visible: true },
  { id: 'tax_id', label: 'TIN', visible: true },
  { id: 'issue_1099', label: 'Send 1099', visible: true },
  { id: 'tin_verified', label: 'Verified', visible: true },
  { id: 'mailing.street', label: 'Mailing Street', visible: true },
  { id: 'mailing.city', label: 'Mailing City', visible: true },
  { id: 'mailing.state', label: 'Mailing State', visible: true },
  { id: 'mailing.zip', label: 'Mailing ZIP', visible: true },
];

const BOOLEAN_COLUMNS = new Set(['frozen', 'ach', 'agreement_on_file', 'issue_1099', 'tin_verified']);

const BROKER_FILTER_OPTIONS: FilterOption[] = [
  {
    id: 'state',
    label: 'State',
    options: [
      { value: 'CA', label: 'California' },
      { value: 'TX', label: 'Texas' },
      { value: 'FL', label: 'Florida' },
      { value: 'NY', label: 'New York' },
      { value: 'WA', label: 'Washington' },
    ],
  },
  {
    id: 'company',
    label: 'Company',
    options: [],
  },
];

const ContactBrokersPage: React.FC = () => {
  const crud = useContactsCrud({ contactType: 'broker' });
  const [selectedContact, setSelectedContact] = useState<ContactRecord | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [localSearch, setLocalSearch] = useState('');
  const debounceRef = useRef<ReturnType<typeof setTimeout>>();

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      crud.setSearchQuery(localSearch);
    }, 350);
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [localSearch]);

  const handleCreate = useCallback(async (data: Record<string, string>) => {
    await crud.createContact(data);
    setModalOpen(false);
  }, [crud]);

  const handleSave = useCallback(async (id: string, contactData: Record<string, string>) => {
    const result = await crud.updateContact(id, contactData);
    return result;
  }, [crud]);

  const handleDeleteSelected = useCallback(async (ids: string[]) => {
    await crud.deleteContacts(ids);
  }, [crud]);

  const renderCellValue = useCallback((contact: ContactRecord, columnId: string): React.ReactNode => {
    const cd = (contact.contact_data || {}) as Record<string, string>;

    if (columnId === 'preferred_phone') {
      if (cd['preferred.home'] === 'true') return 'Home';
      if (cd['preferred.work'] === 'true') return 'Work';
      if (cd['preferred.cell'] === 'true') return 'Cell';
      if (cd['preferred.fax'] === 'true') return 'Fax';
      return '-';
    }

    if (BOOLEAN_COLUMNS.has(columnId)) {
      const val = cd[columnId];
      return val === 'true' ? '✓' : '';
    }

    const topLevel: Record<string, string | null | undefined> = {
      contact_id: contact.contact_id,
      full_name: contact.full_name,
      first_name: contact.first_name,
      last_name: contact.last_name,
      email: contact.email,
      phone: contact.phone,
      city: contact.city,
      state: contact.state,
      company: contact.company,
    };
    if (columnId in topLevel) {
      const val = topLevel[columnId] || '';
      if (columnId === 'full_name') return <span className="font-medium">{val || '-'}</span>;
      return val || '-';
    }

    const val = cd[columnId] || '';
    return val || '-';
  }, []);

  if (selectedContact) {
    return (
      <div className="h-full flex flex-col">
        <ContactBrokerDetailLayout
          contact={selectedContact}
          onBack={() => setSelectedContact(null)}
          onSave={handleSave}
        />
      </div>
    );
  }

  return (
    <>
      <ContactsListView
        title="Brokers"
        contacts={crud.contacts}
        totalCount={crud.totalCount}
        totalPages={crud.totalPages}
        currentPage={crud.currentPage}
        isLoading={crud.isLoading}
        searchQuery={localSearch}
        onSearchChange={setLocalSearch}
        searchPlaceholder="Search by Broker ID, Type, or Name..."
        onPageChange={crud.setCurrentPage}
        onRowClick={setSelectedContact}
        onCreateNew={() => setModalOpen(true)}
        onDeleteSelected={handleDeleteSelected}
        defaultColumns={DEFAULT_COLUMNS}
        tableConfigKey="contact_brokers_v4"
        addButtonLabel="Add Broker"
        breadcrumbLabel="Brokers"
        filterOptions={BROKER_FILTER_OPTIONS}
        renderCellValue={renderCellValue}
      />
      <CreateContactModal
        open={modalOpen}
        onOpenChange={setModalOpen}
        contactType="broker"
        onSubmit={handleCreate}
      />
    </>
  );
};

export default ContactBrokersPage;
