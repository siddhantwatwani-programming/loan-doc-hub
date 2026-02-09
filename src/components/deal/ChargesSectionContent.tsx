import React, { useState, useCallback, useMemo } from 'react';
import { ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ChargesSubNavigation, ChargesSubSection } from './ChargesSubNavigation';
import { ChargesDetailForm } from './ChargesDetailForm';
import { ChargesTableView, type ChargeData } from './ChargesTableView';
import { ChargesModal } from './ChargesModal';
import type { FieldDefinition } from '@/hooks/useDealFields';
import type { CalculationResult } from '@/lib/calculationEngine';

interface ChargesSectionContentProps {
  fields: FieldDefinition[];
  values: Record<string, string>;
  onValueChange: (fieldKey: string, value: string) => void;
  showValidation?: boolean;
  disabled?: boolean;
  calculationResults?: Record<string, CalculationResult>;
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
  showValidation = false,
  disabled = false,
  calculationResults = {},
}) => {
  const [activeSubSection, setActiveSubSection] = useState<ChargesSubSection>('charges');
  const [selectedChargePrefix, setSelectedChargePrefix] = useState<string>('charge1');
  const [modalOpen, setModalOpen] = useState(false);
  const [editingCharge, setEditingCharge] = useState<ChargeData | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  
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
    setEditingCharge(charge);
    setModalOpen(true);
  }, []);

  const handleBackToTable = useCallback(() => {
    setActiveSubSection('charges');
  }, []);

  const handleSaveCharge = useCallback((chargeData: ChargeData) => {
    const prefix = editingCharge ? editingCharge.id : getNextChargePrefix(values);
    
    onValueChange(`${prefix}.description`, chargeData.description);
    onValueChange(`${prefix}.unpaid_balance`, chargeData.unpaidBalance);
    onValueChange(`${prefix}.owed_to`, chargeData.owedTo);
    onValueChange(`${prefix}.owed_from`, chargeData.owedFrom);
    onValueChange(`${prefix}.total_due`, chargeData.totalDue);
    onValueChange(`${prefix}.interest_from`, chargeData.interestFrom);
    onValueChange(`${prefix}.date_of_charge`, chargeData.dateOfCharge);
    onValueChange(`${prefix}.interest_rate`, chargeData.interestRate);
    onValueChange(`${prefix}.notes`, chargeData.notes);
    onValueChange(`${prefix}.reference`, chargeData.reference);
    onValueChange(`${prefix}.charge_type`, chargeData.chargeType);
    onValueChange(`${prefix}.deferred`, chargeData.deferred);
    onValueChange(`${prefix}.original_amount`, chargeData.originalAmount);
    onValueChange(`${prefix}.account`, chargeData.account);
    onValueChange(`${prefix}.borrower_full_name`, chargeData.borrowerFullName);
    onValueChange(`${prefix}.advanced_by_account`, chargeData.advancedByAccount);
    onValueChange(`${prefix}.advanced_by_lender_name`, chargeData.advancedByLenderName);
    onValueChange(`${prefix}.advanced_by_amount`, chargeData.advancedByAmount);
    onValueChange(`${prefix}.on_behalf_of_account`, chargeData.onBehalfOfAccount);
    onValueChange(`${prefix}.on_behalf_of_lender_name`, chargeData.onBehalfOfLenderName);
    onValueChange(`${prefix}.on_behalf_of_amount`, chargeData.onBehalfOfAmount);
    onValueChange(`${prefix}.amount_owed_by_borrower`, chargeData.amountOwedByBorrower);
    onValueChange(`${prefix}.accrued_interest`, chargeData.accruedInterest);
    
    setModalOpen(false);
  }, [editingCharge, values, onValueChange]);

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
            {renderSubSectionContent()}
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
