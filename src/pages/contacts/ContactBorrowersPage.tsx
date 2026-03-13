import React, { useState, useCallback } from 'react';
import { useContactsCrud, type ContactRecord } from '@/hooks/useContactsCrud';
import { ContactsListView } from '@/components/contacts/ContactsListView';
import { CreateContactModal } from '@/components/contacts/CreateContactModal';
import ContactBorrowerDetailLayout from '@/components/contacts/borrower-detail/ContactBorrowerDetailLayout';
import type { ColumnConfig } from '@/components/deal/ColumnConfigPopover';
import type { FilterOption } from '@/components/deal/GridToolbar';

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
  { id: 'contact_id', label: 'Borrower ID', visible: true },
  { id: 'hold', label: 'Hold', visible: true },
  { id: 'borrower_type', label: 'Type', visible: true },
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

const BOOLEAN_COLUMNS = new Set(['hold', 'ach', 'agreement_on_file', 'issue_1099', 'tin_verified']);

const BORROWER_FILTER_OPTIONS: FilterOption[] = [
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
];

const ContactBorrowersPage: React.FC = () => {
  const crud = useContactsCrud({ contactType: 'borrower' });
  const [selectedContact, setSelectedContact] = useState<ContactRecord | null>(null);
  const [modalOpen, setModalOpen] = useState(false);

  const handleCreate = useCallback(async (data: Record<string, string>) => {
    await crud.createContact(data);
    setModalOpen(false);
  }, [crud]);

  const handleSave = useCallback(async (id: string, contactData: Record<string, string>) => {
    const result = await crud.updateContact(id, contactData);
    if (result) {
      setSelectedContact(null);
    }
    return result;
  }, [crud]);

  const handleDeleteSelected = useCallback(async (ids: string[]) => {
    await crud.deleteContacts(ids);
  }, [crud]);

  if (selectedContact) {
    return (
      <div className="h-full flex flex-col">
        <ContactBorrowerDetailLayout
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
        title="Borrowers"
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
        tableConfigKey="contact_borrowers_v3"
        addButtonLabel="Add Borrower"
        breadcrumbLabel="Borrowers"
        filterOptions={BORROWER_FILTER_OPTIONS}
      />
      <CreateContactModal
        open={modalOpen}
        onOpenChange={setModalOpen}
        contactType="borrower"
        onSubmit={handleCreate}
      />
    </>
  );
};

export default ContactBorrowersPage;
