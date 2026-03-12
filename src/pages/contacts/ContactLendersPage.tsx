import React, { useState, useCallback } from 'react';

// Re-export for backward compatibility with existing components
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
import { useContactsCrud, type ContactRecord } from '@/hooks/useContactsCrud';
import { ContactsListView } from '@/components/contacts/ContactsListView';
import { CreateContactModal } from '@/components/contacts/CreateContactModal';
import ContactLenderDetailLayout from '@/components/contacts/lender-detail/ContactLenderDetailLayout';
import type { ColumnConfig } from '@/components/deal/ColumnConfigPopover';

const DEFAULT_COLUMNS: ColumnConfig[] = [
  { id: 'contact_id', label: 'Lender ID', visible: true },
  { id: 'full_name', label: 'Full Name', visible: true },
  { id: 'first_name', label: 'First', visible: true },
  { id: 'last_name', label: 'Last', visible: true },
  { id: 'email', label: 'Email', visible: true },
  { id: 'phone', label: 'Phone', visible: true },
  { id: 'city', label: 'City', visible: true },
  { id: 'state', label: 'State', visible: true },
  { id: 'company', label: 'Company', visible: false },
];

const ContactLendersPage: React.FC = () => {
  const crud = useContactsCrud({ contactType: 'lender' });
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

  if (selectedContact) {
    return (
      <div className="h-full flex flex-col">
        <ContactLenderDetailLayout
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
        title="Lenders"
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
        defaultColumns={DEFAULT_COLUMNS}
        tableConfigKey="contact_lenders_v2"
        addButtonLabel="Add Lender"
        breadcrumbLabel="Lenders"
      />
      <CreateContactModal
        open={modalOpen}
        onOpenChange={setModalOpen}
        contactType="lender"
        onSubmit={handleCreate}
      />
    </>
  );
};

export default ContactLendersPage;
