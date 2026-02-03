import React, { useState, useCallback, useMemo } from 'react';
import { ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { LenderSubNavigation, type LenderSubSection } from './LenderSubNavigation';
import { LenderInfoForm } from './LenderInfoForm';
import { LenderAuthorizedPartyForm } from './LenderAuthorizedPartyForm';
import { LenderFundingForm } from './LenderFundingForm';
import { LenderBankingForm } from './LenderBankingForm';
import { LendersTableView, type LenderData } from './LendersTableView';
import { LenderModal } from './LenderModal';
import type { FieldDefinition } from '@/hooks/useDealFields';
import type { CalculationResult } from '@/lib/calculationEngine';

interface LenderSectionContentProps {
  fields: FieldDefinition[];
  values: Record<string, string>;
  onValueChange: (fieldKey: string, value: string) => void;
  showValidation?: boolean;
  disabled?: boolean;
  calculationResults?: Record<string, CalculationResult>;
}

// Helper to extract lenders from values based on lender prefix pattern
const extractLendersFromValues = (values: Record<string, string>): LenderData[] => {
  const lenders: LenderData[] = [];
  const lenderPrefixes = new Set<string>();
  
  // Find all lender prefixes (lender1, lender2, etc.)
  Object.keys(values).forEach(key => {
    const match = key.match(/^(lender\d+)\./);
    if (match) {
      lenderPrefixes.add(match[1]);
    }
  });
  
  // Build lender objects from values
  lenderPrefixes.forEach(prefix => {
    const lender: LenderData = {
      id: prefix,
      isPrimary: values[`${prefix}.is_primary`] === 'true',
      type: values[`${prefix}.type`] || '',
      fullName: values[`${prefix}.full_name`] || '',
      firstName: values[`${prefix}.first_name`] || '',
      lastName: values[`${prefix}.last_name`] || '',
      email: values[`${prefix}.email`] || '',
      phone: values[`${prefix}.phone.cell`] || values[`${prefix}.phone.work`] || '',
      city: values[`${prefix}.primary_address.city`] || values[`${prefix}.city`] || '',
      state: values[`${prefix}.primary_address.state`] || values[`${prefix}.state`] || '',
      taxId: values[`${prefix}.tax_id`] || '',
    };
    lenders.push(lender);
  });
  
  // Sort to ensure lender1 comes first
  lenders.sort((a, b) => {
    const numA = parseInt(a.id.replace('lender', ''));
    const numB = parseInt(b.id.replace('lender', ''));
    return numA - numB;
  });
  
  return lenders;
};

// Get the next available lender prefix
const getNextLenderPrefix = (values: Record<string, string>): string => {
  const lenderPrefixes = new Set<string>();
  Object.keys(values).forEach(key => {
    const match = key.match(/^(lender\d+)\./);
    if (match) {
      lenderPrefixes.add(match[1]);
    }
  });
  
  let nextNum = 1;
  while (lenderPrefixes.has(`lender${nextNum}`)) {
    nextNum++;
  }
  return `lender${nextNum}`;
};

export const LenderSectionContent: React.FC<LenderSectionContentProps> = ({
  fields,
  values,
  onValueChange,
  showValidation = false,
  disabled = false,
  calculationResults = {},
}) => {
  const [activeSubSection, setActiveSubSection] = useState<LenderSubSection>('lenders');
  const [selectedLenderPrefix, setSelectedLenderPrefix] = useState<string>('lender1');
  const [modalOpen, setModalOpen] = useState(false);
  const [editingLender, setEditingLender] = useState<LenderData | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  
  // Check if we're in detail view
  const isDetailView = ['lender', 'authorized_party', 'funding', 'banking'].includes(activeSubSection);
  
  // Extract lenders from values
  const lenders = useMemo(() => extractLendersFromValues(values), [values]);

  // Get the selected lender name for detail view header
  const selectedLenderName = useMemo(() => {
    const lender = lenders.find(l => l.id === selectedLenderPrefix);
    if (lender) {
      return lender.fullName || `${lender.firstName} ${lender.lastName}`.trim() || `Lender ${selectedLenderPrefix.replace('lender', '')}`;
    }
    return 'Lender';
  }, [lenders, selectedLenderPrefix]);

  // Handle adding a new lender
  const handleAddLender = useCallback(() => {
    setEditingLender(null);
    setModalOpen(true);
  }, []);

  // Handle editing a lender
  const handleEditLender = useCallback((lender: LenderData) => {
    setEditingLender(lender);
    setModalOpen(true);
  }, []);

  // Handle row click - navigate to lender details
  const handleRowClick = useCallback((lender: LenderData) => {
    setSelectedLenderPrefix(lender.id);
    setActiveSubSection('lender');
  }, []);

  // Handle back navigation
  const handleBackToTable = useCallback(() => {
    setActiveSubSection('lenders');
  }, []);

  // Handle primary lender change - only one can be primary
  const handlePrimaryChange = useCallback((lenderId: string, isPrimary: boolean) => {
    if (isPrimary) {
      // Unset all other lenders as non-primary
      lenders.forEach(l => {
        if (l.id !== lenderId) {
          onValueChange(`${l.id}.is_primary`, 'false');
        }
      });
    }
    onValueChange(`${lenderId}.is_primary`, String(isPrimary));
  }, [lenders, onValueChange]);

  // Handle saving lender from modal
  const handleSaveLender = useCallback((lenderData: LenderData) => {
    const prefix = editingLender ? editingLender.id : getNextLenderPrefix(values);
    
    // Save all lender fields
    onValueChange(`${prefix}.is_primary`, String(lenderData.isPrimary));
    onValueChange(`${prefix}.type`, lenderData.type);
    onValueChange(`${prefix}.full_name`, lenderData.fullName);
    onValueChange(`${prefix}.first_name`, lenderData.firstName);
    onValueChange(`${prefix}.last_name`, lenderData.lastName);
    onValueChange(`${prefix}.email`, lenderData.email);
    onValueChange(`${prefix}.phone.cell`, lenderData.phone);
    onValueChange(`${prefix}.primary_address.city`, lenderData.city);
    onValueChange(`${prefix}.primary_address.state`, lenderData.state);
    onValueChange(`${prefix}.tax_id`, lenderData.taxId);
    
    // If this is marked as primary, unset others
    if (lenderData.isPrimary) {
      lenders.forEach(l => {
        if (l.id !== prefix) {
          onValueChange(`${l.id}.is_primary`, 'false');
        }
      });
    }
    
    setModalOpen(false);
  }, [editingLender, values, onValueChange, lenders]);

  // Create lender-specific values for the detail forms
  const getLenderSpecificValues = (): Record<string, string> => {
    const result: Record<string, string> = {};
    Object.entries(values).forEach(([key, value]) => {
      // Replace the current lender prefix with lender. for the form
      if (key.startsWith(`${selectedLenderPrefix}.`)) {
        const fieldName = key.replace(`${selectedLenderPrefix}.`, 'lender.');
        result[fieldName] = value;
      } else if (!key.match(/^lender\d+\./)) {
        // Include non-lender prefixed fields
        result[key] = value;
      }
    });
    return result;
  };

  // Handle value change for lender-specific forms
  const handleLenderValueChange = (fieldKey: string, value: string) => {
    // Replace lender. with the selected lender prefix
    const actualKey = fieldKey.replace('lender.', `${selectedLenderPrefix}.`);
    onValueChange(actualKey, value);
  };

  const renderSubSectionContent = () => {
    switch (activeSubSection) {
      case 'lenders':
        return (
          <LendersTableView
            lenders={lenders}
            onAddLender={handleAddLender}
            onEditLender={handleEditLender}
            onRowClick={handleRowClick}
            onPrimaryChange={handlePrimaryChange}
            disabled={disabled}
            isLoading={isLoading}
          />
        );
      case 'lender':
        return (
          <LenderInfoForm
            fields={fields}
            values={getLenderSpecificValues()}
            onValueChange={handleLenderValueChange}
            showValidation={showValidation}
            disabled={disabled}
            calculationResults={calculationResults}
          />
        );
      case 'authorized_party':
        return (
          <LenderAuthorizedPartyForm
            fields={fields}
            values={getLenderSpecificValues()}
            onValueChange={handleLenderValueChange}
            showValidation={showValidation}
            disabled={disabled}
            calculationResults={calculationResults}
          />
        );
      case 'funding':
        return (
          <LenderFundingForm
            fields={fields}
            values={getLenderSpecificValues()}
            onValueChange={handleLenderValueChange}
            showValidation={showValidation}
            disabled={disabled}
            calculationResults={calculationResults}
          />
        );
      case 'banking':
        return (
          <LenderBankingForm
            fields={fields}
            values={getLenderSpecificValues()}
            onValueChange={handleLenderValueChange}
            showValidation={showValidation}
            disabled={disabled}
            calculationResults={calculationResults}
          />
        );
      default:
        return null;
    }
  };

  return (
    <>
      <div className="flex flex-col border border-border rounded-lg bg-background overflow-hidden">
        {/* Full-width breadcrumb header when in detail view */}
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
              {selectedLenderName}
            </span>
          </div>
        )}

        <div className="flex flex-1">
          {/* Sub-navigation tabs on the left - only shown in detail view */}
          <LenderSubNavigation
            activeSubSection={activeSubSection}
            onSubSectionChange={setActiveSubSection}
            isDetailView={isDetailView}
          />

          {/* Sub-section content on the right */}
          <div className="flex-1 min-w-0 overflow-auto">
            {renderSubSectionContent()}
          </div>
        </div>
      </div>

      {/* Add/Edit Lender Modal */}
      <LenderModal
        open={modalOpen}
        onOpenChange={setModalOpen}
        lender={editingLender}
        onSave={handleSaveLender}
        isEdit={!!editingLender}
      />
    </>
  );
};

export default LenderSectionContent;
