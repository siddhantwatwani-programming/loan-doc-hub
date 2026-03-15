import React, { useState, useCallback, useEffect, useRef } from 'react';
import type { FilterOption } from '@/components/deal/GridToolbar';

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
  { id: 'type', label: 'Lender Type', visible: true },
  { id: 'full_name', label: 'Full Name', visible: true },
  { id: 'first_name', label: 'First', visible: true },
  { id: 'middle_name', label: 'Middle', visible: false },
  { id: 'last_name', label: 'Last', visible: true },
  { id: 'capacity', label: 'Capacity', visible: false },
  { id: 'email', label: 'Email', visible: true },
  { id: 'dob', label: 'DOB', visible: false },
  { id: 'phone.home', label: 'Home Phone', visible: false },
  { id: 'phone.work', label: 'Work Phone', visible: false },
  { id: 'phone.cell', label: 'Cell Phone', visible: true },
  { id: 'phone.fax', label: 'Fax', visible: false },
  { id: 'primary_address.street', label: 'Street', visible: false },
  { id: 'primary_address.city', label: 'City', visible: true },
  { id: 'primary_address.state', label: 'State', visible: true },
  { id: 'primary_address.zip', label: 'ZIP', visible: false },
  { id: 'mailing.street', label: 'Mailing Street', visible: false },
  { id: 'mailing.city', label: 'Mailing City', visible: false },
  { id: 'mailing.state', label: 'Mailing State', visible: false },
  { id: 'mailing.zip', label: 'Mailing ZIP', visible: false },
  { id: 'tax_id_type', label: 'Tax ID Type', visible: false },
  { id: 'tax_id', label: 'TIN', visible: false },
  { id: 'tin_verified', label: 'TIN Verified', visible: false },
  { id: 'ach', label: 'ACH', visible: false },
  { id: 'servicing_agreement_on_file', label: 'Agreement', visible: false },
  { id: 'freeze_outgoing_disbursements', label: 'Frozen', visible: false },
  { id: 'vesting', label: 'Vesting', visible: false },
  { id: 'delivery.print', label: 'Delivery Print', visible: false },
  { id: 'delivery.email', label: 'Delivery Email', visible: false },
  { id: 'delivery.sms', label: 'Delivery SMS', visible: false },
  { id: 'send_pref.payment_notification', label: 'Send Payment Notif', visible: false },
  { id: 'send_pref.late_notice', label: 'Send Late Notice', visible: false },
  { id: 'send_pref.borrower_statement', label: 'Send Borrower Stmt', visible: false },
  { id: 'send_pref.maturity_notice', label: 'Send Maturity Notice', visible: false },
  { id: 'company', label: 'Company', visible: false },
];

const LENDER_FILTER_OPTIONS: FilterOption[] = [
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

const ContactLendersPage: React.FC = () => {
  const crud = useContactsCrud({ contactType: 'lender' });
  const [selectedContact, setSelectedContact] = useState<ContactRecord | null>(null);
  const [modalOpen, setModalOpen] = useState(false);

  // Debounced search: local input state + delayed sync to crud
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
        searchQuery={localSearch}
        onSearchChange={setLocalSearch}
        onPageChange={crud.setCurrentPage}
        onRowClick={setSelectedContact}
        onCreateNew={() => setModalOpen(true)}
        onDeleteSelected={handleDeleteSelected}
        defaultColumns={DEFAULT_COLUMNS}
        tableConfigKey="contact_lenders_v5"
        addButtonLabel="Add Lender"
        breadcrumbLabel="Lenders"
        filterOptions={LENDER_FILTER_OPTIONS}
        searchPlaceholder="Search by Lender ID, Type, or Name..."
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
