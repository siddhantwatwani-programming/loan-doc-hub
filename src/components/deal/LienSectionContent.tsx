import React, { useState, useCallback, useMemo } from 'react';
import { ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { LienSubNavigation, type LienSubSection } from './LienSubNavigation';
import { LiensTableView, type LienData } from './LiensTableView';
import { LienModal } from './LienModal';
import { LienDetailForm } from './LienDetailForm';

interface LienSectionContentProps {
  values: Record<string, string>;
  onValueChange: (fieldKey: string, value: string) => void;
  onRemoveValuesByPrefix?: (prefix: string) => void;
  disabled?: boolean;
  propertyOptions?: { id: string; label: string }[];
  onBack?: () => void;
}

const DEFAULT_LIEN: LienData = {
  id: '',
  property: '',
  priority: '',
  holder: '',
  account: '',
  contact: '',
  phone: '',
  fax: '',
  email: '',
  loanType: '',
  anticipated: 'false',
  existingRemain: 'false',
  existingPaydown: 'false',
  existingPayoff: 'false',
  existingPaydownAmount: '',
  existingPayoffAmount: '',
  lienPriorityNow: '',
  lienPriorityAfter: '',
  interestRate: '',
  maturityDate: '',
  originalBalance: '',
  balanceAfter: '',
  currentBalance: '',
  regularPayment: '',
  recordingNumber: '',
  recordingNumberFlag: 'false',
  recordingDate: '',
  seniorLienTracking: 'false',
  lastVerified: '',
  lastChecked: '',
  note: '',
};

const LIEN_FIELD_MAP: Record<string, string> = {
  property: 'property',
  priority: 'priority',
  holder: 'holder',
  account: 'account',
  contact: 'contact',
  phone: 'phone',
  fax: 'fax',
  email: 'email',
  loanType: 'loan_type',
  anticipated: 'anticipated',
  existingRemain: 'existing_remain',
  existingPaydown: 'existing_paydown',
  existingPayoff: 'existing_payoff',
  existingPaydownAmount: 'existing_paydown_amount',
  existingPayoffAmount: 'existing_payoff_amount',
  lienPriorityNow: 'lien_priority_now',
  lienPriorityAfter: 'lien_priority_after',
  interestRate: 'interest_rate',
  maturityDate: 'maturity_date',
  originalBalance: 'original_balance',
  balanceAfter: 'balance_after',
  currentBalance: 'current_balance',
  regularPayment: 'regular_payment',
  recordingNumber: 'recording_number',
  recordingNumberFlag: 'recording_number_flag',
  recordingDate: 'recording_date',
  seniorLienTracking: 'senior_lien_tracking',
  lastVerified: 'last_verified',
  lastChecked: 'last_checked',
  note: 'note',
};

// Reverse map: db field -> LienData key
const DB_TO_LIEN: Record<string, keyof LienData> = {};
Object.entries(LIEN_FIELD_MAP).forEach(([k, v]) => { DB_TO_LIEN[v] = k as keyof LienData; });

const extractLiensFromValues = (values: Record<string, string>): LienData[] => {
  const liens: LienData[] = [];
  const lienPrefixes = new Set<string>();

  Object.keys(values).forEach(key => {
    const match = key.match(/^(lien\d+)\./);
    if (match) lienPrefixes.add(match[1]);
  });

  lienPrefixes.forEach(prefix => {
    const lien: LienData = { ...DEFAULT_LIEN, id: prefix };
    Object.entries(LIEN_FIELD_MAP).forEach(([lienKey, dbField]) => {
      if (lienKey === 'id') return;
      const val = values[`${prefix}.${dbField}`];
      if (val !== undefined) {
        (lien as any)[lienKey] = val;
      }
    });
    liens.push(lien);
  });

  liens.sort((a, b) => {
    const numA = parseInt(a.id.replace('lien', ''));
    const numB = parseInt(b.id.replace('lien', ''));
    return numA - numB;
  });

  return liens;
};

const getNextLienPrefix = (values: Record<string, string>): string => {
  const lienPrefixes = new Set<string>();
  Object.keys(values).forEach(key => {
    const match = key.match(/^(lien\d+)\./);
    if (match) lienPrefixes.add(match[1]);
  });
  let nextNum = 1;
  while (lienPrefixes.has(`lien${nextNum}`)) nextNum++;
  return `lien${nextNum}`;
};

export const LienSectionContent: React.FC<LienSectionContentProps> = ({
  values,
  onValueChange,
  onRemoveValuesByPrefix,
  disabled = false,
  propertyOptions = [],
  onBack,
}) => {
  const [activeSubSection, setActiveSubSection] = useState<LienSubSection>('liens');
  const [selectedLienPrefix, setSelectedLienPrefix] = useState<string>('lien1');
  const [modalOpen, setModalOpen] = useState(false);
  const [editingLien, setEditingLien] = useState<LienData | null>(null);

  const isDetailView = activeSubSection === 'lien_details';
  const liens = extractLiensFromValues(values);

  const selectedLien = useMemo(() => {
    return liens.find(l => l.id === selectedLienPrefix) || { ...DEFAULT_LIEN, id: selectedLienPrefix };
  }, [liens, selectedLienPrefix]);

  const selectedLienName = useMemo(() => {
    return selectedLien.holder || `Lien ${selectedLienPrefix.replace('lien', '')}`;
  }, [selectedLien, selectedLienPrefix]);

  const handleAddLien = useCallback(() => { setEditingLien(null); setModalOpen(true); }, []);
  const handleEditLien = useCallback((lien: LienData) => { setEditingLien(lien); setModalOpen(true); }, []);
  const handleRowClick = useCallback((lien: LienData) => { setSelectedLienPrefix(lien.id); setActiveSubSection('lien_details'); }, []);
  const handleBackToTable = useCallback(() => { setActiveSubSection('liens'); }, []);

  const handleSaveLien = useCallback((lienData: LienData) => {
    const prefix = editingLien ? editingLien.id : getNextLienPrefix(values);
    Object.entries(LIEN_FIELD_MAP).forEach(([lienKey, dbField]) => {
      if (lienKey === 'id') return;
      onValueChange(`${prefix}.${dbField}`, (lienData as any)[lienKey] || '');
    });
    setModalOpen(false);
  }, [editingLien, values, onValueChange]);

  const handleDeleteLien = useCallback((lien: LienData) => {
    if (onRemoveValuesByPrefix) {
      onRemoveValuesByPrefix(lien.id);
    } else {
      Object.keys(values).forEach(key => {
        if (key.startsWith(`${lien.id}.`)) onValueChange(key, '');
      });
    }
  }, [values, onValueChange, onRemoveValuesByPrefix]);

  const handleLienFieldChange = useCallback((field: keyof LienData, value: string) => {
    const dbField = LIEN_FIELD_MAP[field];
    if (dbField && field !== 'id') {
      onValueChange(`${selectedLienPrefix}.${dbField}`, value);
    }
  }, [selectedLienPrefix, onValueChange]);

  const renderSubSectionContent = () => {
    switch (activeSubSection) {
      case 'liens':
        return (
          <LiensTableView liens={liens} onAddLien={handleAddLien} onEditLien={handleEditLien} onRowClick={handleRowClick} onDeleteLien={handleDeleteLien} onBack={onBack} disabled={disabled} />
        );
      case 'lien_details':
        return (
          <LienDetailForm lien={selectedLien} onChange={handleLienFieldChange} disabled={disabled} propertyOptions={propertyOptions} />
        );
      default:
        return null;
    }
  };

  return (
    <>
      <div className="flex flex-col border border-border rounded-lg bg-background overflow-hidden">
        {isDetailView && (
          <div className="flex items-center gap-3 px-4 py-3 border-b border-border bg-muted/20">
            <Button variant="ghost" size="sm" onClick={handleBackToTable} className="gap-1 h-8">
              <ArrowLeft className="h-4 w-4" />
              Back
            </Button>
            <span className="text-sm font-medium text-foreground">{selectedLienName}</span>
          </div>
        )}
        <div className="flex flex-1">
          <LienSubNavigation activeSubSection={activeSubSection} onSubSectionChange={setActiveSubSection} isDetailView={isDetailView} />
          <div className="flex-1 min-w-0 overflow-auto">{renderSubSectionContent()}</div>
        </div>
      </div>
      <LienModal open={modalOpen} onOpenChange={setModalOpen} lien={editingLien} onSave={handleSaveLien} isEdit={!!editingLien} propertyOptions={propertyOptions} />
    </>
  );
};

export default LienSectionContent;
