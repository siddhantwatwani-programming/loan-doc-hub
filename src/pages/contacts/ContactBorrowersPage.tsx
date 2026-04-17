import React, { useState, useCallback, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useContactsCrud, type ContactRecord } from '@/hooks/useContactsCrud';
import { ContactsListView } from '@/components/contacts/ContactsListView';
import { CreateContactModal } from '@/components/contacts/CreateContactModal';
import ContactBorrowerDetailLayout from '@/components/contacts/borrower-detail/ContactBorrowerDetailLayout';
import type { ColumnConfig } from '@/components/deal/ColumnConfigPopover';
import type { FilterOption } from '@/components/deal/GridToolbar';
import { useFormPermissions } from '@/hooks/useFormPermissions';
import { useContactWorkspaceOptional } from '@/contexts/ContactWorkspaceContext';

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
      { value: 'CA', label: 'CA' },
      { value: 'TX', label: 'TX' },
      { value: 'FL', label: 'FL' },
      { value: 'NY', label: 'NY' },
      { value: 'WA', label: 'WA' },
    ],
  },
];

const ContactBorrowersPage: React.FC = () => {
  const { contactId } = useParams<{ contactId?: string }>();
  const navigate = useNavigate();
  const crud = useContactsCrud({ contactType: 'borrower' });
  const { loading: permissionsLoading, isFormViewOnly } = useFormPermissions();
  const contactWs = useContactWorkspaceOptional();
  const [selectedContact, setSelectedContact] = useState<ContactRecord | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [localSearch, setLocalSearch] = useState('');
  const debounceRef = useRef<ReturnType<typeof setTimeout>>();
  const deepLinkLoaded = useRef(false);
  const isReadOnly = permissionsLoading || isFormViewOnly('borrower');

  // Deep-link: auto-load contact by URL param
  useEffect(() => {
    if (!contactId || deepLinkLoaded.current) return;
    deepLinkLoaded.current = true;
    (async () => {
      const { supabase } = await import('@/integrations/supabase/client');
      const { data } = await supabase
        .from('contacts')
        .select('*')
        .eq('id', contactId)
        .maybeSingle();
      if (data) {
        setSelectedContact({
          id: data.id,
          contact_id: data.contact_id,
          contact_type: data.contact_type,
          full_name: data.full_name || '',
          first_name: data.first_name || '',
          last_name: data.last_name || '',
          email: data.email || '',
          phone: data.phone || '',
          city: data.city || '',
          state: data.state || '',
          company: data.company || '',
          contact_data: (data.contact_data || {}) as Record<string, string>,
          created_at: data.created_at || '',
          updated_at: data.updated_at || '',
        });
      }
    })();
  }, [contactId]);

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
    if (isReadOnly) return;
    await crud.createContact(data);
    setModalOpen(false);
  }, [crud, isReadOnly]);

  const handleSave = useCallback(async (id: string, contactData: Record<string, string>) => {
    if (isReadOnly) return false;
    const result = await crud.updateContact(id, contactData);
    if (result) {
      setSelectedContact(null);
    }
    return result;
  }, [crud, isReadOnly]);

  const handleDeleteSelected = useCallback(async (ids: string[]) => {
    if (isReadOnly) return;
    await crud.deleteContacts(ids);
  }, [crud, isReadOnly]);

  const renderCellValue = useCallback((contact: ContactRecord, columnId: string): React.ReactNode => {
    const cd = (contact.contact_data || {}) as Record<string, string>;

    // Computed preferred phone
    if (columnId === 'preferred_phone') {
      if (cd['preferred.home'] === 'true') return 'Home';
      if (cd['preferred.work'] === 'true') return 'Work';
      if (cd['preferred.cell'] === 'true') return 'Cell';
      if (cd['preferred.fax'] === 'true') return 'Fax';
      return '-';
    }

    // Cell phone: stored as phone.mobile or phone.cell
    if (columnId === 'phone.cell') {
      const val = cd['phone.cell'] || cd['phone.mobile'] || '';
      return val || '-';
    }

    // TIN: stored as tin or tax_id
    if (columnId === 'tax_id') {
      const val = cd['tax_id'] || cd['tin'] || '';
      return val || '-';
    }

    // Boolean columns
    if (BOOLEAN_COLUMNS.has(columnId)) {
      const val = cd[columnId];
      return val === 'true' ? '✓' : '';
    }

    // Top-level fields
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

    // contact_data (supports dot-notation keys like address.street, phone.home)
    const val = cd[columnId] || '';
    return val || '-';
  }, []);

  if (selectedContact) {
    return (
      <div className="h-full flex flex-col">
        <ContactBorrowerDetailLayout
          contact={selectedContact}
          onBack={() => { setSelectedContact(null); if (contactId) navigate('/contacts/borrowers'); }}
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
        searchQuery={localSearch}
        onSearchChange={setLocalSearch}
        searchPlaceholder="Search by Borrower ID, Type, or Name..."
        onPageChange={crud.setCurrentPage}
        onRowClick={setSelectedContact}
        onCreateNew={() => setModalOpen(true)}
        onDeleteSelected={isReadOnly ? undefined : handleDeleteSelected}
        defaultColumns={DEFAULT_COLUMNS}
        tableConfigKey="contact_borrowers_v4"
        addButtonLabel="Add Borrower"
        breadcrumbLabel="Borrowers"
        filterOptions={BORROWER_FILTER_OPTIONS}
        renderCellValue={renderCellValue}
        createDisabled={isReadOnly}
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
