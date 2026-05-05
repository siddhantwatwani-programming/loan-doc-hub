import React, { useState, useCallback, useMemo } from 'react';
import { flushSync } from 'react-dom';
import { useDealNavigationOptional } from '@/contexts/DealNavigationContext';
import { ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { LiensTableView, type LienData } from './LiensTableView';
import { LienModal } from './LienModal';
import { LienDetailForm } from './LienDetailForm';
import { useDirtyFields } from '@/contexts/DirtyFieldsContext';
import { DirtyFieldsProvider } from '@/contexts/DirtyFieldsContext';

interface LienSectionContentProps {
  values: Record<string, string>;
  onValueChange: (fieldKey: string, value: string) => void;
  onRemoveValuesByPrefix?: (prefix: string) => void;
  onPersist?: () => Promise<boolean>;
  disabled?: boolean;
  propertyOptions?: { id: string; label: string }[];
  currentPropertyId?: string;
  onBack?: () => void;
  onRefresh?: () => void;
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
  loanTypeDropdown: '',
  anticipated: 'false',
  anticipatedAmount: '',
  existingRemain: 'false',
  existingPaydown: 'false',
  existingPayoff: 'false',
  existingPaydownAmount: '',
  existingPayoffAmount: '',
  lienPriorityNow: '',
  lienPriorityAfter: '',
  remainingNewLienPriority: '',
  newRemainingBalance: '',
  interestRate: '',
  maturityDate: '',
  originalBalance: '',
  balanceAfter: '',
  currentBalance: '',
  regularPayment: '',
  balloon: 'false',
  balloonAmount: '',
  recordingNumber: '',
  recordingNumberFlag: 'false',
  recordingDate: '',
  seniorLienTracking: 'false',
  sltActive: 'false',
  lastVerified: '',
  lastChecked: '',
  sltCurrent: 'false',
  sltDelinquent: 'false',
  sltDelinquentDays: '',
  sltUnderModification: 'false',
  sltForeclosure: 'false',
  sltForeclosureDate: '',
  sltPaidOff: 'false',
  sltLastPaymentMade: '',
  sltNextPaymentDue: '',
  sltCurrentBalance: '',
  sltRequestSubmitted: '',
  sltResponseReceived: '',
  sltUnableToVerify: 'false',
  sltLenderNotified: 'false',
  sltLenderNotifiedDate: '',
  sltBorrowerNotified: 'false',
  sltBorrowerNotifiedDate: '',
  note: '',
  thisLoan: 'false',
  estimate: 'false',
  status: '',
  delinquencies60day: 'false',
  delinquenciesHowMany: '',
  currentlyDelinquent: 'false',
  currentlyDelinquentAmount: '',
  paidByLoan: 'false',
  sourceOfPayment: '',
  sourceOfInformation: '',
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
  loanTypeDropdown: 'loan_type_dropdown',
  anticipated: 'anticipated',
  anticipatedAmount: 'anticipated_amount',
  existingRemain: 'existing_remain',
  existingPaydown: 'existing_paydown',
  existingPayoff: 'existing_payoff',
  existingPaydownAmount: 'existing_paydown_amount',
  existingPayoffAmount: 'existing_payoff_amount',
  lienPriorityNow: 'lien_priority_now',
  lienPriorityAfter: 'lien_priority_after',
  remainingNewLienPriority: 'remaining_new_lien_priority',
  newRemainingBalance: 'new_remaining_balance',
  interestRate: 'interest_rate',
  maturityDate: 'maturity_date',
  originalBalance: 'original_balance',
  balanceAfter: 'balance_after',
  currentBalance: 'current_balance',
  regularPayment: 'regular_payment',
  balloon: 'balloon',
  balloonAmount: 'balloon_amount',
  recordingNumber: 'recording_number',
  recordingNumberFlag: 'recording_number_flag',
  recordingDate: 'recording_date',
  seniorLienTracking: 'senior_lien_tracking',
  sltActive: 'slt_active',
  lastVerified: 'last_verified',
  lastChecked: 'last_checked',
  sltCurrent: 'slt_current',
  sltDelinquent: 'slt_delinquent',
  sltDelinquentDays: 'slt_delinquent_days',
  sltUnderModification: 'slt_under_modification',
  sltForeclosure: 'slt_foreclosure',
  sltForeclosureDate: 'slt_foreclosure_date',
  sltPaidOff: 'slt_paid_off',
  sltLastPaymentMade: 'slt_last_payment_made',
  sltNextPaymentDue: 'slt_next_payment_due',
  sltCurrentBalance: 'slt_current_balance',
  sltRequestSubmitted: 'slt_request_submitted',
  sltResponseReceived: 'slt_response_received',
  sltUnableToVerify: 'slt_unable_to_verify',
  sltLenderNotified: 'slt_lender_notified',
  sltLenderNotifiedDate: 'slt_lender_notified_date',
  sltBorrowerNotified: 'slt_borrower_notified',
  sltBorrowerNotifiedDate: 'slt_borrower_notified_date',
  note: 'note',
  thisLoan: 'this_loan',
  estimate: 'estimate',
  status: 'status',
  delinquencies60day: 'delinquencies_60day',
  delinquenciesHowMany: 'delinquencies_how_many',
  currentlyDelinquent: 'currently_delinquent',
  currentlyDelinquentAmount: 'currently_delinquent_amount',
  paidByLoan: 'paid_by_loan',
  sourceOfPayment: 'source_of_payment',
  sourceOfInformation: 'source_of_information',
};

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
    const hasData = Object.entries(LIEN_FIELD_MAP).some(([lienKey, dbField]) => {
      if (lienKey === 'id') return false;
      const val = values[`${prefix}.${dbField}`];
      return val !== undefined && val !== '';
    });
    if (hasData) {
      liens.push(lien);
    }
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

type LienView = 'table' | 'detail';

export const LienSectionContent: React.FC<LienSectionContentProps> = ({
  values,
  onValueChange,
  onRemoveValuesByPrefix,
  onPersist,
  disabled = false,
  propertyOptions = [],
  currentPropertyId,
  onBack,
  onRefresh,
}) => {
  const nav = useDealNavigationOptional();
  const selectedLienPrefix = nav?.getSelectedPrefix('lien') ?? 'lien1';
  const setSelectedLienPrefix = (prefix: string) => nav?.setSelectedPrefix('lien', prefix);
  
  // Use local state for view since we removed sub-navigation
  const [currentView, setCurrentView] = useState<LienView>('table');
  const [modalOpen, setModalOpen] = useState(false);
  const [editingLien, setEditingLien] = useState<LienData | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const PAGE_SIZE = 10;
  const { dirtyFieldKeys } = useDirtyFields();

  const allLiens = extractLiensFromValues(values);

  // Scope liens to the current property to prevent the bug where liens
  // appeared under every property. When no current property is provided,
  // fall back to showing all (legacy behavior).
  const liensForProperty = useMemo(() => {
    if (!currentPropertyId) return allLiens;
    return allLiens.filter(l => {
      // Backward-compat: legacy liens missing/unassigned property still
      // appear under the currently active property so they aren't lost.
      if (!l.property || l.property === 'unassigned') return true;
      return l.property === currentPropertyId;
    });
  }, [allLiens, currentPropertyId]);

  // Auto-compute 10A: "yes" if any lien has an existing type checked
  const hasExistingLien = allLiens.some(l =>
    l.existingRemain === 'true' || l.existingPaydown === 'true' || l.existingPayoff === 'true'
  );
  const current10A = values['liens.answer_10a'] || '';
  const expected10A = hasExistingLien ? 'yes' : 'no';
  React.useEffect(() => {
    if (current10A !== expected10A) {
      onValueChange('liens.answer_10a', expected10A);
    }
  }, [expected10A, current10A, onValueChange]);
  const totalLiens = liensForProperty.length;
  const totalPages = Math.max(1, Math.ceil(totalLiens / PAGE_SIZE));
  const safePage = Math.min(currentPage, totalPages);
  const paginatedLiens = liensForProperty.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE);

  // Remap dirty field keys for the selected lien
  const remappedDirtyKeys = useMemo(() => {
    const remapped = new Set<string>();
    dirtyFieldKeys.forEach(key => {
      if (key.startsWith(`${selectedLienPrefix}.`)) {
        remapped.add(key.replace(`${selectedLienPrefix}.`, 'lien1.'));
      }
    });
    return remapped;
  }, [dirtyFieldKeys, selectedLienPrefix]);

  const selectedLien = useMemo(() => {
    return allLiens.find(l => l.id === selectedLienPrefix) || { ...DEFAULT_LIEN, id: selectedLienPrefix };
  }, [allLiens, selectedLienPrefix]);

  const selectedLienName = useMemo(() => {
    return selectedLien.holder || `Lien ${selectedLienPrefix.replace('lien', '')}`;
  }, [selectedLien, selectedLienPrefix]);

  const handleAddLien = useCallback(() => { setEditingLien(null); setModalOpen(true); }, []);
  const handleEditLien = useCallback((lien: LienData) => { setEditingLien(lien); setModalOpen(true); }, []);
  const handleRowClick = useCallback((lien: LienData) => { setSelectedLienPrefix(lien.id); setCurrentView('detail'); }, []);
  const handleBackToTable = useCallback(() => { setCurrentView('table'); }, []);

  const handleSaveLien = useCallback(async (lienData: LienData) => {
    const prefix = editingLien ? editingLien.id : getNextLienPrefix(values);

    // Bind the lien to the current property when adding a new lien and the
    // user did not pick one explicitly (or left it as "unassigned").
    // This is what isolates liens per property and ensures the new lien shows
    // up in the current property's Liens grid after save.
    const isUnboundProperty = !lienData.property || lienData.property === 'unassigned';
    const boundLienData: LienData = {
      ...lienData,
      property: isUnboundProperty ? (currentPropertyId || lienData.property) : lienData.property,
    };

    flushSync(() => {
      Object.entries(LIEN_FIELD_MAP).forEach(([lienKey, dbField]) => {
        if (lienKey === 'id') return;
        const val = (boundLienData as any)[lienKey] || '';
        const defaultVal = (DEFAULT_LIEN as any)[lienKey] || '';
        if (val !== defaultVal || editingLien) {
          onValueChange(`${prefix}.${dbField}`, val);
        }
      });
    });

    const success = onPersist ? await onPersist() : true;
    if (success) {
      setSelectedLienPrefix(prefix);
      setModalOpen(false);
    }
    return success;
  }, [editingLien, values, onValueChange, onPersist, setSelectedLienPrefix, currentPropertyId]);

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

  return (
    <>
      <div className="flex flex-col border border-border rounded-lg bg-background overflow-hidden">
        {currentView === 'detail' && (
          <div className="flex items-center gap-3 px-4 py-3 border-b border-border bg-muted/20">
            <Button variant="ghost" size="sm" onClick={handleBackToTable} className="gap-1 h-8">
              <ArrowLeft className="h-4 w-4" />
              Back
            </Button>
            <span className="text-sm font-medium text-foreground">{selectedLienName}</span>
          </div>
        )}
        <div className="flex-1 min-w-0 overflow-auto">
          <DirtyFieldsProvider dirtyFieldKeys={remappedDirtyKeys}>
            {currentView === 'table' ? (
              <LiensTableView
                liens={paginatedLiens}
                onAddLien={handleAddLien}
                onEditLien={handleEditLien}
                onRowClick={handleRowClick}
                onDeleteLien={handleDeleteLien}
                onBack={onBack}
                disabled={disabled}
                onRefresh={onRefresh}
                currentPage={safePage}
                totalPages={totalPages}
                totalCount={totalLiens}
                onPageChange={setCurrentPage}
              />
            ) : (
              <LienDetailForm
                lien={selectedLien}
                onChange={handleLienFieldChange}
                disabled={disabled}
                propertyOptions={propertyOptions}
                loanValues={values}
              />
            )}
          </DirtyFieldsProvider>
        </div>
      </div>
      <LienModal open={modalOpen} onOpenChange={setModalOpen} lien={editingLien} onSave={handleSaveLien} isEdit={!!editingLien} propertyOptions={propertyOptions} loanValues={values} />
    </>
  );
};

export default LienSectionContent;
