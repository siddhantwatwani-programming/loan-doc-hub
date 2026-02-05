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
  
  // Find all charge prefixes (charge1, charge2, etc.)
  Object.keys(values).forEach(key => {
    const match = key.match(/^(charge\d+)\./);
    if (match) {
      chargePrefixes.add(match[1]);
    }
  });
  
  // Build charge objects from values
  chargePrefixes.forEach(prefix => {
    const charge: ChargeData = {
      id: prefix,
      description: values[`${prefix}.description`] || '',
      unpaidBalance: values[`${prefix}.unpaid_balance`] || '',
      owedTo: values[`${prefix}.owed_to`] || '',
      owedFrom: values[`${prefix}.owed_from`] || '',
      totalDue: values[`${prefix}.total_due`] || '',
      interestFrom: values[`${prefix}.interest_from`] || '',
    };
    charges.push(charge);
  });
  
  // Sort to ensure charge1 comes first
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
  
  // Check if we're in detail view
  const isDetailView = activeSubSection === 'detail';
  
  // Extract charges from values
  const charges = extractChargesFromValues(values);

  // Get the selected charge name for detail view header
  const selectedChargeName = useMemo(() => {
    const charge = charges.find(c => c.id === selectedChargePrefix);
    if (charge) {
      return charge.description || `Charge ${selectedChargePrefix.replace('charge', '')}`;
    }
    return 'Charge';
  }, [charges, selectedChargePrefix]);

  // Handle adding a new charge
  const handleAddCharge = useCallback(() => {
    setEditingCharge(null);
    setModalOpen(true);
  }, []);

  // Handle editing a charge
  const handleEditCharge = useCallback((charge: ChargeData) => {
    setEditingCharge(charge);
    setModalOpen(true);
  }, []);

  // Handle row click - navigate to charge details
  const handleRowClick = useCallback((charge: ChargeData) => {
    setSelectedChargePrefix(charge.id);
    setActiveSubSection('detail');
  }, []);

  // Handle back navigation
  const handleBackToTable = useCallback(() => {
    setActiveSubSection('charges');
  }, []);

  // Handle saving charge from modal
  const handleSaveCharge = useCallback((chargeData: ChargeData) => {
    const prefix = editingCharge ? editingCharge.id : getNextChargePrefix(values);
    
    // Save all charge fields
    onValueChange(`${prefix}.description`, chargeData.description);
    onValueChange(`${prefix}.unpaid_balance`, chargeData.unpaidBalance);
    onValueChange(`${prefix}.owed_to`, chargeData.owedTo);
    onValueChange(`${prefix}.owed_from`, chargeData.owedFrom);
    onValueChange(`${prefix}.total_due`, chargeData.totalDue);
    onValueChange(`${prefix}.interest_from`, chargeData.interestFrom);
    
    setModalOpen(false);
  }, [editingCharge, values, onValueChange]);

  // Create charge-specific values for the detail forms
  const getChargeSpecificValues = (): Record<string, string> => {
    const result: Record<string, string> = {};
    Object.entries(values).forEach(([key, value]) => {
      // Replace the current charge prefix with charges for the form (removing the number)
      if (key.startsWith(`${selectedChargePrefix}.`)) {
        const fieldName = key.replace(`${selectedChargePrefix}.`, 'charges.');
        result[fieldName] = value;
      } else if (!key.match(/^charge\d+\./)) {
        // Include non-charge-indexed fields
        result[key] = value;
      }
    });
    return result;
  };

  // Handle value change for charge-specific forms
  const handleChargeValueChange = (fieldKey: string, value: string) => {
    // Replace charges. with the selected charge prefix
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
              {selectedChargeName}
            </span>
          </div>
        )}

        <div className="flex flex-1">
          {/* Sub-navigation tabs on the left - only shown in detail view */}
          <ChargesSubNavigation
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

      {/* Add/Edit Charge Modal */}
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
