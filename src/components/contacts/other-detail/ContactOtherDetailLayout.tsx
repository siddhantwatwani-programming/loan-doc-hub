import React, { useState, useCallback, useMemo, useEffect } from 'react';
import { SaveConfirmationDialog } from '@/components/workspace/SaveConfirmationDialog';
import { ArrowLeft, Save } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useContactWorkspaceOptional } from '@/contexts/ContactWorkspaceContext';
import { logContactEvent, type ContactFieldChange } from '@/hooks/useContactEventJournal';
import OtherDetailSidebar, { type OtherSection } from './OtherDetailSidebar';
import { OtherProfileForm } from './OtherProfileForm';
import LenderConversationLog from '@/components/contacts/lender-detail/LenderConversationLog';
import LenderAttachments from '@/components/contacts/lender-detail/LenderAttachments';
import LenderEventsJournal from '@/components/contacts/lender-detail/LenderEventsJournal';
import type { ContactRecord } from '@/hooks/useContactsCrud';
import { useFormPermissions } from '@/hooks/useFormPermissions';

interface ContactOtherDetailLayoutProps {
  contact: ContactRecord;
  /** Display label e.g. "Additional Guarantor", "Authorized Party", "Attorney" */
  kindLabel: string;
  /** Form-permission key (uses 'borrower' as a safe default for read-only checks) */
  formPermissionKey?: string;
  onBack: () => void;
  onSave: (id: string, contactData: Record<string, string>) => Promise<boolean>;
}

const ContactOtherDetailLayout: React.FC<ContactOtherDetailLayoutProps> = ({
  contact,
  kindLabel,
  formPermissionKey,
  onBack,
  onSave,
}) => {
  const { loading: permissionsLoading, isFormViewOnly } = useFormPermissions();
  const [activeSection, setActiveSection] = useState<OtherSection>('profile');
  const [showSaveConfirm, setShowSaveConfirm] = useState(false);

  const [values, setValues] = useState<Record<string, string>>(() => {
    const result: Record<string, string> = {};
    Object.entries(contact.contact_data || {}).forEach(([key, value]) => {
      if (typeof value === 'string') result[`other.${key}`] = value;
    });
    return result;
  });

  const [initialValues, setInitialValues] = useState<Record<string, string>>(() => ({ ...values }));
  const isDirty = useMemo(
    () => JSON.stringify(values) !== JSON.stringify(initialValues),
    [values, initialValues],
  );
  const isReadOnly = formPermissionKey
    ? permissionsLoading || isFormViewOnly(formPermissionKey)
    : false;

  const handleValueChange = useCallback(
    (fieldKey: string, value: string) => {
      if (isReadOnly) return;
      setValues((prev) => ({ ...prev, [fieldKey]: value }));
    },
    [isReadOnly],
  );

  const handleSave = useCallback(async (): Promise<boolean> => {
    if (isReadOnly) return false;
    const contactData: Record<string, string> = {};
    Object.entries(values).forEach(([key, value]) => {
      const stripped = key.replace(/^other\./, '');
      contactData[stripped] = value;
    });
    // Promote core columns from JSON keys
    contactData.full_name =
      contactData.full_name ||
      [contactData.first_name, contactData.middle_name, contactData.last_name].filter(Boolean).join(' ');
    contactData.first_name = contactData.first_name || '';
    contactData.last_name = contactData.last_name || '';
    contactData.email = contactData.email || '';
    contactData.phone =
      contactData['phone.cell'] || contactData['phone.work'] || contactData['phone.home'] || '';
    contactData.city = contactData['address.city'] || '';
    contactData.state = contactData['address.state'] || '';
    contactData.company = contactData.company || '';

    const changes: ContactFieldChange[] = [];
    const allKeys = new Set([...Object.keys(values), ...Object.keys(initialValues)]);
    allKeys.forEach((key) => {
      const oldVal = initialValues[key] || '';
      const newVal = values[key] || '';
      if (oldVal !== newVal) {
        const label = key
          .replace(/^other\./, '')
          .replace(/[._]/g, ' ')
          .replace(/\b\w/g, (c) => c.toUpperCase());
        changes.push({ fieldLabel: label, oldValue: oldVal, newValue: newVal });
      }
    });
    const saved = await onSave(contact.id, contactData);
    if (saved && changes.length > 0) {
      await logContactEvent(contact.id, `${kindLabel} Profile`, changes);
    }
    if (saved) setInitialValues({ ...values });
    return !!saved;
  }, [isReadOnly, values, initialValues, contact.id, onSave, kindLabel]);

  const contactWs = useContactWorkspaceOptional();
  useEffect(() => {
    if (contactWs) contactWs.setContactDirty(contact.id, isDirty);
  }, [isDirty, contact.id, contactWs]);
  useEffect(() => {
    if (!contactWs) return;
    contactWs.registerSaveFn(contact.id, handleSave);
    return () => contactWs.unregisterSaveFn(contact.id);
  }, [contactWs, contact.id, handleSave]);

  const renderContent = () => {
    switch (activeSection) {
      case 'profile':
        return (
          <OtherProfileForm
            values={values}
            onValueChange={handleValueChange}
            disabled={isReadOnly}
            contactIdLabel={`${kindLabel} ID`}
            contactIdValue={contact.contact_id}
          />
        );
      case 'conversation-log':
        return (
          <div className="p-6">
            <LenderConversationLog
              lenderId={contact.contact_id}
              contactDbId={contact.id}
              disabled={isReadOnly}
            />
          </div>
        );
      case 'attachments':
        return (
          <div className="p-6">
            <LenderAttachments
              lenderId={contact.contact_id}
              contactDbId={contact.id}
              disabled={isReadOnly}
            />
          </div>
        );
      case 'events-journal':
        return (
          <div className="p-6">
            <LenderEventsJournal lenderId={contact.contact_id} contactDbId={contact.id} />
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between px-6 py-3 border-b border-border">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="sm" onClick={onBack}>
            <ArrowLeft className="h-4 w-4 mr-1" /> Back
          </Button>
          <h3 className="font-semibold text-lg text-foreground">
            {kindLabel} — {contact.contact_id}
          </h3>
        </div>
        {!isReadOnly && isDirty && (
          <Button size="sm" onClick={() => setShowSaveConfirm(true)} className="gap-1">
            <Save className="h-4 w-4" /> Save Changes
          </Button>
        )}
      </div>
      <div className="flex flex-1 overflow-hidden">
        <OtherDetailSidebar activeSection={activeSection} onSectionChange={setActiveSection} />
        <div className="flex-1 overflow-auto">{renderContent()}</div>
      </div>
      <SaveConfirmationDialog
        open={showSaveConfirm}
        onConfirm={() => {
          setShowSaveConfirm(false);
          handleSave();
        }}
        onCancel={() => setShowSaveConfirm(false)}
      />
    </div>
  );
};

export default ContactOtherDetailLayout;
