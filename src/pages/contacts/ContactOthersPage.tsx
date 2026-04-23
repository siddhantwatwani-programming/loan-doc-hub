import React, { useState, useCallback, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import type { FilterOption } from '@/components/deal/GridToolbar';
import { useContactsCrud, type ContactRecord, type ContactType } from '@/hooks/useContactsCrud';
import { ContactsListView } from '@/components/contacts/ContactsListView';
import { CreateOtherContactModal } from '@/components/contacts/CreateOtherContactModal';
import ContactOtherDetailLayout from '@/components/contacts/other-detail/ContactOtherDetailLayout';
import { useContactWorkspaceOptional } from '@/contexts/ContactWorkspaceContext';
import type { ColumnConfig } from '@/components/deal/ColumnConfigPopover';

interface ContactOthersPageProps {
  contactType: ContactType;
  /** e.g. "Additional Guarantor" */
  kindLabel: string;
  /** e.g. "Additional Guarantors" */
  pluralLabel: string;
  /** Route base, e.g. "/contacts/others/additional-guarantor" */
  routeBase: string;
  /** Workspace kind discriminator */
  workspaceKind: 'additional_guarantor' | 'authorized_party' | 'attorney';
  /** Storage key for column config */
  tableConfigKey: string;
}

const DEFAULT_COLUMNS: ColumnConfig[] = [
  { id: 'contact_id', label: 'ID', visible: true },
  { id: 'full_name', label: 'Full Name', visible: true },
  { id: 'company', label: 'Company', visible: true },
  { id: 'email', label: 'Email', visible: true },
  { id: 'phone.cell', label: 'Cell Phone', visible: true },
  { id: 'phone.work', label: 'Work Phone', visible: false },
  { id: 'address.city', label: 'City', visible: true },
  { id: 'address.state', label: 'State', visible: true },
  { id: 'address.zip', label: 'ZIP', visible: false },
  { id: 'title', label: 'Title / Role', visible: true },
];

const FILTER_OPTIONS: FilterOption[] = [
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

const ContactOthersPage: React.FC<ContactOthersPageProps> = ({
  contactType,
  kindLabel,
  pluralLabel,
  routeBase,
  workspaceKind,
  tableConfigKey,
}) => {
  const { contactId } = useParams<{ contactId?: string }>();
  const navigate = useNavigate();
  const crud = useContactsCrud({ contactType });
  const contactWs = useContactWorkspaceOptional();
  const [selectedContact, setSelectedContact] = useState<ContactRecord | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const deepLinkLoaded = useRef(false);

  // Deep-link: auto-load contact by URL param
  useEffect(() => {
    if (!contactId || deepLinkLoaded.current) return;
    deepLinkLoaded.current = true;
    (async () => {
      const { supabase } = await import('@/integrations/supabase/client');
      const { data } = await supabase.from('contacts').select('*').eq('id', contactId).maybeSingle();
      if (data) {
        const rec: ContactRecord = {
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
        };
        setSelectedContact(rec);
        if (contactWs) {
          contactWs.openContact({
            id: rec.id,
            kind: workspaceKind as any,
            contactId: rec.contact_id,
            fullName: rec.full_name || [rec.first_name, rec.last_name].filter(Boolean).join(' '),
            openedAt: Date.now(),
          });
        }
      }
    })();
  }, [contactId, contactWs, workspaceKind]);

  // Debounced search
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

  const handleCreate = useCallback(
    async (data: Record<string, string>) => {
      await crud.createContact(data);
      setModalOpen(false);
    },
    [crud],
  );

  const handleSave = useCallback(
    async (id: string, contactData: Record<string, string>) => {
      const result = await crud.updateContact(id, contactData);
      return result;
    },
    [crud],
  );

  const handleDeleteSelected = useCallback(
    async (ids: string[]) => {
      await crud.deleteContacts(ids);
    },
    [crud],
  );

  const handleRowClick = useCallback(
    (c: ContactRecord) => {
      if (contactWs) {
        const ok = contactWs.openContact({
          id: c.id,
          kind: workspaceKind as any,
          contactId: c.contact_id,
          fullName: c.full_name || [c.first_name, c.last_name].filter(Boolean).join(' '),
          openedAt: Date.now(),
        });
        if (!ok) return;
      }
      setSelectedContact(c);
      navigate(`${routeBase}/${c.id}`);
    },
    [contactWs, navigate, routeBase, workspaceKind],
  );

  useEffect(() => {
    if (contactWs && contactId) contactWs.switchToContact(contactId);
    if (!contactId) setSelectedContact(null);
  }, [contactId]);

  const renderCellValue = useCallback((contact: ContactRecord, columnId: string): React.ReactNode => {
    if (columnId === 'phone.cell') return contact.contact_data?.['phone.cell'] || contact.phone || '';
    if (columnId === 'phone.work') return contact.contact_data?.['phone.work'] || '';
    if (columnId === 'address.city') return contact.contact_data?.['address.city'] || contact.city || '';
    if (columnId === 'address.state') return contact.contact_data?.['address.state'] || contact.state || '';
    if (columnId === 'address.zip') return contact.contact_data?.['address.zip'] || '';
    if (columnId === 'title') return contact.contact_data?.['title'] || '';
    return undefined;
  }, []);

  if (selectedContact) {
    return (
      <div className="h-full flex flex-col">
        <ContactOtherDetailLayout
          contact={selectedContact}
          kindLabel={kindLabel}
          onBack={() => {
            if (contactWs) contactWs.closeContact(selectedContact.id);
            setSelectedContact(null);
            navigate(routeBase);
          }}
          onSave={handleSave}
        />
      </div>
    );
  }

  return (
    <>
      <ContactsListView
        title={pluralLabel}
        contacts={crud.contacts}
        totalCount={crud.totalCount}
        totalPages={crud.totalPages}
        currentPage={crud.currentPage}
        isLoading={crud.isLoading}
        searchQuery={localSearch}
        onSearchChange={setLocalSearch}
        onPageChange={crud.setCurrentPage}
        onRowClick={handleRowClick}
        onCreateNew={() => setModalOpen(true)}
        onDeleteSelected={handleDeleteSelected}
        defaultColumns={DEFAULT_COLUMNS}
        tableConfigKey={tableConfigKey}
        addButtonLabel={`Add ${kindLabel}`}
        breadcrumbLabel={pluralLabel}
        filterOptions={FILTER_OPTIONS}
        searchPlaceholder={`Search by ID, Name, Email, or Company...`}
        renderCellValue={renderCellValue}
      />
      <CreateOtherContactModal
        open={modalOpen}
        onOpenChange={setModalOpen}
        kindLabel={kindLabel}
        onSubmit={handleCreate}
      />
    </>
  );
};

export default ContactOthersPage;
