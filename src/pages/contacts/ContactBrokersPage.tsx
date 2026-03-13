import React, { useState, useCallback } from 'react';
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
  { id: 'full_name', label: 'Full Name', visible: true },
  { id: 'first_name', label: 'First', visible: true },
  { id: 'last_name', label: 'Last', visible: true },
  { id: 'email', label: 'Email', visible: true },
  { id: 'phone', label: 'Phone', visible: true },
  { id: 'company', label: 'Company', visible: true },
  { id: 'city', label: 'City', visible: true },
  { id: 'state', label: 'State', visible: true },
];

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
        searchQuery={crud.searchQuery}
        onSearchChange={crud.setSearchQuery}
        onPageChange={crud.setCurrentPage}
        onRowClick={setSelectedContact}
        onCreateNew={() => setModalOpen(true)}
        onDeleteSelected={handleDeleteSelected}
        defaultColumns={DEFAULT_COLUMNS}
        tableConfigKey="contact_brokers_v3"
        addButtonLabel="Add Broker"
        breadcrumbLabel="Brokers"
        filterOptions={BROKER_FILTER_OPTIONS}
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
