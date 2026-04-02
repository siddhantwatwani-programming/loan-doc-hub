import React, { useState, useCallback, useMemo } from 'react';
import { useDealNavigationOptional } from '@/contexts/DealNavigationContext';
import { ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ChargesSubNavigation, ChargesSubSection } from './ChargesSubNavigation';
import { ChargesDetailForm } from './ChargesDetailForm';
import { ChargesTableView, type ChargeData } from './ChargesTableView';
import { ChargesModal } from './ChargesModal';
import { useDirtyFields } from '@/contexts/DirtyFieldsContext';
import { DirtyFieldsProvider } from '@/contexts/DirtyFieldsContext';
import type { FieldDefinition } from '@/hooks/useDealFields';
import type { CalculationResult } from '@/lib/calculationEngine';

interface ChargesSectionContentProps {
  fields: FieldDefinition[];
  values: Record<string, string>;
  onValueChange: (fieldKey: string, value: string) => void;
  onRemoveValuesByPrefix?: (prefix: string) => void;
  showValidation?: boolean;
  disabled?: boolean;
  calculationResults?: Record<string, CalculationResult>;
  onRefresh?: () => void;
}

// Helper to extract charges from values based on charge prefix pattern
const extractChargesFromValues = (values: Record<string, string>): ChargeData[] => {
  const charges: ChargeData[] = [];
  const chargePrefixes = new Set<string>();
  
  Object.keys(values).forEach(key => {
    const match = key.match(/^(charge\d+)\./);
    if (match) {
      chargePrefixes.add(match[1]);
    }
  });
  
  chargePrefixes.forEach(prefix => {
    const charge: ChargeData = {
      id: prefix,
      description: values[`${prefix}.description`] || '',
      unpaidBalance: values[`${prefix}.unpaid_balance`] || '',
      owedTo: values[`${prefix}.owed_to`] || '',
      owedFrom: values[`${prefix}.owed_from`] || '',
      totalDue: values[`${prefix}.total_due`] || '',
      interestFrom: values[`${prefix}.interest_from`] || '',
      dateOfCharge: values[`${prefix}.date_of_charge`] || '',
      interestRate: values[`${prefix}.interest_rate`] || '',
      notes: values[`${prefix}.notes`] || '',
      reference: values[`${prefix}.reference`] || '',
      chargeType: values[`${prefix}.charge_type`] || values[`${prefix}.change_type`] || '',
      deferred: values[`${prefix}.deferred`] || '',
      originalAmount: values[`${prefix}.original_amount`] || '',
      account: values[`${prefix}.account`] || '',
      borrowerFullName: values[`${prefix}.borrower_full_name`] || '',
      advancedByAccount: values[`${prefix}.advanced_by_account`] || '',
      advancedByLenderName: values[`${prefix}.advanced_by_lender_name`] || '',
      advancedByAmount: values[`${prefix}.advanced_by_amount`] || '',
      onBehalfOfAccount: values[`${prefix}.on_behalf_of_account`] || '',
      onBehalfOfLenderName: values[`${prefix}.on_behalf_of_lender_name`] || '',
      onBehalfOfAmount: values[`${prefix}.on_behalf_of_amount`] || '',
      amountOwedByBorrower: values[`${prefix}.amount_owed_by_borrower`] || '',
      accruedInterest: values[`${prefix}.accrued_interest`] || '',
      distributeBetweenAllLenders: values[`${prefix}.distribute_between_all_lenders`] || '',
    };
    charges.push(charge);
  });
  
  charges.sort((a, b) => {
    const numA = parseInt(a.id.replace('charge', ''));
    const numB = parseInt(b.id.replace('charge', ''));
    return numA - numB;
  });
  
  return charges;
};

// Get the next available charge prefix
const getNextChargePrefix = (values: Record<string, string>): string => {
  const chargePrefixes = new Set<string>();
  Object.keys(values).forEach(key => {
    const match = key.match(/^(charge\d+)\./);
    if (match) {
      chargePrefixes.add(match[1]);
    }
  });
  
  let nextNum = 1;
  while (chargePrefixes.has(`charge${nextNum}`)) {
    nextNum++;
  }
  return `charge${nextNum}`;
};

export const ChargesSectionContent: React.FC<ChargesSectionContentProps> = ({
  fields,
  values,
  onValueChange,
  onRemoveValuesByPrefix,
  showValidation = false,
  disabled = false,
  calculationResults = {},
  onRefresh,
}) => {
  const nav = useDealNavigationOptional();
  const activeSubSection = (nav?.getSubSection('charges') ?? 'charges') as ChargesSubSection;
  const setActiveSubSection = (sub: ChargesSubSection) => nav?.setSubSection('charges', sub);
  const selectedChargePrefix = nav?.getSelectedPrefix('charges') ?? 'charge1';
  const setSelectedChargePrefix = (prefix: string) => nav?.setSelectedPrefix('charges', prefix);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingCharge, setEditingCharge] = useState<ChargeData | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const PAGE_SIZE = 10;
  const { dirtyFieldKeys } = useDirtyFields();

  // Remap dirty field keys: chargeN.xxx → charges.xxx for selected prefix
  const remappedDirtyKeys = useMemo(() => {
    const remapped = new Set<string>();
    dirtyFieldKeys.forEach(key => {
      if (key.startsWith(`${selectedChargePrefix}.`)) {
        remapped.add(key.replace(`${selectedChargePrefix}.`, 'charges.'));
      }
    });
    return remapped;
  }, [dirtyFieldKeys, selectedChargePrefix]);
  
  const isDetailView = activeSubSection === 'detail';
  const charges = extractChargesFromValues(values);

  const selectedChargeName = useMemo(() => {
    const charge = charges.find(c => c.id === selectedChargePrefix);
    if (charge) {
      return charge.description || `Charge ${selectedChargePrefix.replace('charge', '')}`;
    }
    return 'Charge';
  }, [charges, selectedChargePrefix]);

  const handleAddCharge = useCallback(() => {
    setEditingCharge(null);
    setModalOpen(true);
  }, []);

  const handleEditCharge = useCallback((charge: ChargeData) => {
    setEditingCharge(charge);
    setModalOpen(true);
  }, []);

  const handleRowClick = useCallback((charge: ChargeData) => {
    setSelectedChargePrefix(charge.id);
    setActiveSubSection('detail');
  }, []);

  const handleBackToTable = useCallback(() => {
    setActiveSubSection('charges');
  }, []);

  const handleSaveCharge = useCallback((chargeData: ChargeData) => {
    const prefix = editingCharge ? editingCharge.id : getNextChargePrefix(values);
    const isEdit = !!editingCharge;
    
    const fieldEntries: { key: keyof ChargeData; dbField: string }[] = [
      { key: 'description', dbField: 'description' },
      { key: 'unpaidBalance', dbField: 'unpaid_balance' },
      { key: 'owedTo', dbField: 'owed_to' },
      { key: 'owedFrom', dbField: 'owed_from' },
      { key: 'totalDue', dbField: 'total_due' },
      { key: 'interestFrom', dbField: 'interest_from' },
      { key: 'dateOfCharge', dbField: 'date_of_charge' },
      { key: 'interestRate', dbField: 'interest_rate' },
      { key: 'notes', dbField: 'notes' },
      { key: 'reference', dbField: 'reference' },
      { key: 'chargeType', dbField: 'charge_type' },
      { key: 'deferred', dbField: 'deferred' },
      { key: 'originalAmount', dbField: 'original_amount' },
      { key: 'account', dbField: 'account' },
      { key: 'borrowerFullName', dbField: 'borrower_full_name' },
      { key: 'advancedByAccount', dbField: 'advanced_by_account' },
      { key: 'advancedByLenderName', dbField: 'advanced_by_lender_name' },
      { key: 'advancedByAmount', dbField: 'advanced_by_amount' },
      { key: 'onBehalfOfAccount', dbField: 'on_behalf_of_account' },
      { key: 'onBehalfOfLenderName', dbField: 'on_behalf_of_lender_name' },
      { key: 'onBehalfOfAmount', dbField: 'on_behalf_of_amount' },
      { key: 'amountOwedByBorrower', dbField: 'amount_owed_by_borrower' },
      { key: 'accruedInterest', dbField: 'accrued_interest' },
    ];

    fieldEntries.forEach(({ key, dbField }) => {
      const val = chargeData[key] || '';
      // Only write fields with actual data to avoid false dirty flags on new entries
      if (val !== '' || isEdit) {
        onValueChange(`${prefix}.${dbField}`, val);
      }
    });
    
    setModalOpen(false);
  }, [editingCharge, values, onValueChange]);

  // Handle deleting a charge
  const handleDeleteCharge = useCallback((charge: ChargeData) => {
    if (onRemoveValuesByPrefix) {
      onRemoveValuesByPrefix(charge.id);
    } else {
      Object.keys(values).forEach(key => {
        if (key.startsWith(`${charge.id}.`)) {
          onValueChange(key, '');
        }
      });
    }
  }, [values, onValueChange, onRemoveValuesByPrefix]);

  const getChargeSpecificValues = (): Record<string, string> => {
    const result: Record<string, string> = {};
    Object.entries(values).forEach(([key, value]) => {
      if (key.startsWith(`${selectedChargePrefix}.`)) {
        const fieldName = key.replace(`${selectedChargePrefix}.`, 'charges.');
        result[fieldName] = value;
      } else if (!key.match(/^charge\d+\./)) {
        result[key] = value;
      }
    });
    return result;
  };

  const handleChargeValueChange = (fieldKey: string, value: string) => {
    const actualKey = fieldKey.replace('charges.', `${selectedChargePrefix}.`);
    onValueChange(actualKey, value);
  };

  const renderSubSectionContent = () => {
    switch (activeSubSection) {
      case 'charges':
        return (
          <ChargesTableView
            charges={charges}
            onAddCharge={handleAddCharge}
            onEditCharge={handleEditCharge}
            onRowClick={handleRowClick}
            onDeleteCharge={handleDeleteCharge}
            onRefresh={onRefresh}
            disabled={disabled}
            isLoading={isLoading}
          />
        );
      case 'detail':
        return (
          <div className="p-6">
            <ChargesDetailForm 
              disabled={disabled} 
              values={getChargeSpecificValues()}
              onValueChange={handleChargeValueChange}
            />
          </div>
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
            <Button
              variant="ghost"
              size="sm"
              onClick={handleBackToTable}
              className="gap-1 h-8"
            >
              <ArrowLeft className="h-4 w-4" />
              Back
            </Button>
            <span className="text-sm font-medium text-foreground">
              {selectedChargeName}
            </span>
          </div>
        )}

        <div className="flex flex-1">
          <ChargesSubNavigation
            activeSubSection={activeSubSection}
            onSubSectionChange={setActiveSubSection}
            isDetailView={isDetailView}
          />
          <div className="flex-1 min-w-0 overflow-auto">
            <DirtyFieldsProvider dirtyFieldKeys={remappedDirtyKeys}>
              {renderSubSectionContent()}
            </DirtyFieldsProvider>
          </div>
        </div>
      </div>

      <ChargesModal
        open={modalOpen}
        onOpenChange={setModalOpen}
        charge={editingCharge}
        onSave={handleSaveCharge}
        isEdit={!!editingCharge}
      />
    </>
  );
};

export default ChargesSectionContent;
