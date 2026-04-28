import React, { useState, useCallback, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Save } from 'lucide-react';
import { useContactsCrud, type ContactRecord } from '@/hooks/useContactsCrud';
import { ContactsListView } from '@/components/contacts/ContactsListView';
import { CreateContactModal } from '@/components/contacts/CreateContactModal';
import { BorrowerAdditionalGuarantorForm } from '@/components/deal/BorrowerAdditionalGuarantorForm';
import { Button } from '@/components/ui/button';
import { SaveConfirmationDialog } from '@/components/workspace/SaveConfirmationDialog';
import { DirtyFieldsProvider } from '@/contexts/DirtyFieldsContext';
import type { ColumnConfig } from '@/components/deal/ColumnConfigPopover';
import type { FilterOption } from '@/components/deal/GridToolbar';
import { useFormPermissions } from '@/hooks/useFormPermissions';

const DEFAULT_COLUMNS: ColumnConfig[] = [
  { id: 'contact_id', label: 'Contact ID', visible: true },
  { id: 'full_name', label: 'Entity Name', visible: true },
  { id: 'first_name', label: 'First', visible: true },
  { id: 'last_name', label: 'Last', visible: true },
  { id: 'email', label: 'Email', visible: true },
  { id: 'city', label: 'City', visible: true },
  { id: 'state', label: 'State', visible: true },
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

const NON_BORROWER_PREFIXES = ['ach.', 'coborrower.', 'borrower.guarantor.', 'borrower.authorized_party.', 'borrower.1098.'];

interface AdditionalGuarantorDetailProps {
  contact: ContactRecord;
  onBack: () => void;
  onSave: (id: string, contactData: Record<string, string>) => Promise<boolean>;
  isReadOnly: boolean;
}

const AdditionalGuarantorDetail: React.FC<AdditionalGuarantorDetailProps> = ({ contact, onBack, onSave, isReadOnly }) => {
  const [values, setValues] = useState<Record<string, string>>(() => {
    const result: Record<string, string> = {};
    Object.entries(contact.contact_data || {}).forEach(([key, value]) => {
      if (typeof value !== 'string') return;
      const needsPrefix = !NON_BORROWER_PREFIXES.some(p => key.startsWith(p)) && !key.startsWith('borrower.');
      result[needsPrefix ? `borrower.${key}` : key] = value;
    });
    return result;
  });

  const initialRef = useRef<Record<string, string>>({ ...values });
  const isDirty = JSON.stringify(values) !== JSON.stringify(initialRef.current);
  const [showSaveConfirm, setShowSaveConfirm] = useState(false);

  const handleValueChange = useCallback((fieldKey: string, value: string) => {
    if (isReadOnly) return;
    setValues(prev => ({ ...prev, [fieldKey]: value }));
  }, [isReadOnly]);

  const handleSave = useCallback(async (): Promise<boolean> => {
    if (isReadOnly) return false;
    const contactData: Record<string, string> = {};
    Object.entries(values).forEach(([key, value]) => {
      const stripped = NON_BORROWER_PREFIXES.some(p => key.startsWith(p)) ? key : key.replace(/^borrower\./, '');
      contactData[stripped] = value;
    });
    const saved = await onSave(contact.id, contactData);
    if (saved) initialRef.current = { ...values };
    return !!saved;
  }, [values, contact.id, onSave, isReadOnly]);

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between px-6 py-3 border-b border-border">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="sm" onClick={onBack}>
            <ArrowLeft className="h-4 w-4 mr-1" /> Back to Additional Guarantors
          </Button>
          <h3 className="font-semibold text-lg text-foreground">
            Additional Guarantor — {contact.contact_id}
          </h3>
        </div>
        {!isReadOnly && isDirty && (
          <Button size="sm" onClick={() => setShowSaveConfirm(true)} className="gap-1">
            <Save className="h-4 w-4" /> Save Changes
          </Button>
        )}
      </div>
      <div className="flex-1 overflow-auto p-4">
        <DirtyFieldsProvider dirtyFieldKeys={new Set<string>()}>
          <BorrowerAdditionalGuarantorForm
            fields={[]}
            values={values}
            onValueChange={handleValueChange}
            disabled={isReadOnly}
          />
        </DirtyFieldsProvider>
      </div>
      <SaveConfirmationDialog
        open={showSaveConfirm}
        onConfirm={() => { setShowSaveConfirm(false); handleSave(); }}
        onCancel={() => setShowSaveConfirm(false)}
      />
    </div>
  );
};

const ContactAdditionalGuarantorsPage: React.FC = () => {
  const { contactId } = useParams<{ contactId?: string }>();
  const navigate = useNavigate();
  const crud = useContactsCrud({ contactType: 'additional_guarantor' });
  const { loading: permissionsLoading, isFormViewOnly } = useFormPermissions();
  const [selectedContact, setSelectedContact] = useState<ContactRecord | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [localSearch, setLocalSearch] = useState('');
  const debounceRef = useRef<ReturnType<typeof setTimeout>>();
  const deepLinkLoaded = useRef(false);
  const isReadOnly = permissionsLoading || isFormViewOnly('borrower');

  useEffect(() => {
    if (!contactId || deepLinkLoaded.current) return;
    deepLinkLoaded.current = true;
    (async () => {
      const { supabase } = await import('@/integrations/supabase/client');
      const { data } = await supabase.from('contacts').select('*').eq('id', contactId).maybeSingle();
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
    debounceRef.current = setTimeout(() => crud.setSearchQuery(localSearch), 350);
    return () => { if (debounceRef.current) clearTimeout(debounceRef.current); };
  }, [localSearch]);

  const handleCreate = useCallback(async (data: Record<string, string>) => {
    if (isReadOnly) return;
    await crud.createContact(data);
    setModalOpen(false);
  }, [crud, isReadOnly]);

  const handleSave = useCallback(async (id: string, contactData: Record<string, string>) => {
    if (isReadOnly) return false;
    return await crud.updateContact(id, contactData);
  }, [crud, isReadOnly]);

  const handleDeleteSelected = useCallback(async (ids: string[]) => {
    if (isReadOnly) return;
    await crud.deleteContacts(ids);
  }, [crud, isReadOnly]);

  const handleRowClick = useCallback((c: ContactRecord) => {
    setSelectedContact(c);
    navigate(`/contacts/additional-guarantors/${c.id}`);
  }, [navigate]);

  useEffect(() => {
    if (!contactId) setSelectedContact(null);
  }, [contactId]);

  const renderCellValue = useCallback((contact: ContactRecord, columnId: string): React.ReactNode => {
    const cd = (contact.contact_data || {}) as Record<string, string>;
    const topLevel: Record<string, string | null | undefined> = {
      contact_id: contact.contact_id,
      full_name: contact.full_name,
      first_name: contact.first_name,
      last_name: contact.last_name,
      email: contact.email,
      city: contact.city,
      state: contact.state,
    };
    if (columnId in topLevel) {
      const val = topLevel[columnId] || '';
      if (columnId === 'full_name') return <span className="font-medium">{val || '-'}</span>;
      return val || '-';
    }
    return cd[columnId] || '-';
  }, []);

  if (selectedContact) {
    return (
      <AdditionalGuarantorDetail
        contact={selectedContact}
        onBack={() => {
          setSelectedContact(null);
          navigate('/contacts/additional-guarantors');
        }}
        onSave={handleSave}
        isReadOnly={isReadOnly}
      />
    );
  }

  return (
    <>
      <ContactsListView
        title="Additional Guarantors"
        contacts={crud.contacts}
        totalCount={crud.totalCount}
        totalPages={crud.totalPages}
        currentPage={crud.currentPage}
        isLoading={crud.isLoading}
        searchQuery={localSearch}
        onSearchChange={setLocalSearch}
        searchPlaceholder="Search Additional Guarantors..."
        onPageChange={crud.setCurrentPage}
        onRowClick={handleRowClick}
        onCreateNew={() => setModalOpen(true)}
        onDeleteSelected={isReadOnly ? undefined : handleDeleteSelected}
        defaultColumns={DEFAULT_COLUMNS}
        tableConfigKey="contact_additional_guarantors_v1"
        addButtonLabel="Add Additional Guarantor"
        breadcrumbLabel="Additional Guarantors"
        filterOptions={FILTER_OPTIONS}
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

export default ContactAdditionalGuarantorsPage;
