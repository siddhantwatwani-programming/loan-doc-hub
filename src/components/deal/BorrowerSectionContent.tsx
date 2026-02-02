import React, { useState, useCallback, useMemo } from 'react';
import { ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { BorrowerSubNavigation, type BorrowerSubSection } from './BorrowerSubNavigation';
import { BorrowersTableView, type BorrowerData } from './BorrowersTableView';
import { BorrowerModal } from './BorrowerModal';
import { BorrowerPrimaryForm } from './BorrowerPrimaryForm';
import { BorrowerAdditionalGuarantorForm } from './BorrowerAdditionalGuarantorForm';
import { BorrowerBankingForm } from './BorrowerBankingForm';
import { BorrowerTaxDetailForm } from './BorrowerTaxDetailForm';
import type { FieldDefinition } from '@/hooks/useDealFields';
import type { CalculationResult } from '@/lib/calculationEngine';

interface BorrowerSectionContentProps {
  fields: FieldDefinition[];
  values: Record<string, string>;
  onValueChange: (fieldKey: string, value: string) => void;
  showValidation?: boolean;
  disabled?: boolean;
  calculationResults?: Record<string, CalculationResult>;
}

const ITEMS_PER_PAGE = 10;

// Helper to extract borrowers from values based on borrower prefix pattern
const extractBorrowersFromValues = (values: Record<string, string>): BorrowerData[] => {
  const borrowers: BorrowerData[] = [];
  const borrowerPrefixes = new Set<string>();
  
  // Find all borrower prefixes (borrower1, borrower2, etc.)
  Object.keys(values).forEach(key => {
    const match = key.match(/^(borrower\d+)\./);
    if (match) {
      borrowerPrefixes.add(match[1]);
    }
  });
  
  // Also check for base borrower prefix (borrower. without number)
  const hasBorrowerBase = Object.keys(values).some(key => 
    key.startsWith('borrower.') && !key.match(/^borrower\d+\./)
  );
  if (hasBorrowerBase) {
    borrowerPrefixes.add('borrower');
  }
  
  // Build borrower objects from values
  borrowerPrefixes.forEach(prefix => {
    const borrower: BorrowerData = {
      id: prefix,
      isPrimary: values[`${prefix}.is_primary`] === 'true' || prefix === 'borrower',
      borrowerType: values[`${prefix}.borrower_type`] || '',
      fullName: values[`${prefix}.full_name`] || '',
      firstName: values[`${prefix}.first_name`] || '',
      middleName: values[`${prefix}.middle_initial`] || '',
      lastName: values[`${prefix}.last_name`] || '',
      email: values[`${prefix}.email`] || '',
      phone: values[`${prefix}.phone.mobile`] || values[`${prefix}.phone.home`] || '',
      street: values[`${prefix}.address.street`] || '',
      city: values[`${prefix}.address.city`] || '',
      state: values[`${prefix}.state`] || '',
      zipCode: values[`${prefix}.address.zip`] || '',
      taxIdType: values[`${prefix}.tax_id_type`] || '',
      taxId: values[`${prefix}.tax_id`] || '',
      creditScore: values[`${prefix}.credit_score`] || '',
      capacity: values[`${prefix}.capacity`] || '',
    };
    borrowers.push(borrower);
  });
  
  // Sort to ensure borrower (primary) comes first, then borrower1, borrower2, etc.
  borrowers.sort((a, b) => {
    if (a.id === 'borrower') return -1;
    if (b.id === 'borrower') return 1;
    const numA = parseInt(a.id.replace('borrower', '')) || 0;
    const numB = parseInt(b.id.replace('borrower', '')) || 0;
    return numA - numB;
  });
  
  return borrowers;
};

// Get the next available borrower prefix
const getNextBorrowerPrefix = (values: Record<string, string>): string => {
  const borrowerPrefixes = new Set<string>();
  Object.keys(values).forEach(key => {
    const match = key.match(/^(borrower\d+)\./);
    if (match) {
      borrowerPrefixes.add(match[1]);
    }
  });
  
  let nextNum = 1;
  while (borrowerPrefixes.has(`borrower${nextNum}`)) {
    nextNum++;
  }
  return `borrower${nextNum}`;
};

export const BorrowerSectionContent: React.FC<BorrowerSectionContentProps> = ({
  fields,
  values,
  onValueChange,
  showValidation = false,
  disabled = false,
  calculationResults = {},
}) => {
  const [activeSubSection, setActiveSubSection] = useState<BorrowerSubSection>('borrowers');
  const [selectedBorrowerPrefix, setSelectedBorrowerPrefix] = useState<string>('borrower');
  const [modalOpen, setModalOpen] = useState(false);
  const [editingBorrower, setEditingBorrower] = useState<BorrowerData | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);

  // Check if we're in detail view (any sub-section other than 'borrowers')
  const isDetailView = activeSubSection !== 'borrowers';

  // Extract borrowers from values
  const allBorrowers = useMemo(() => extractBorrowersFromValues(values), [values]);
  
  // Paginated borrowers
  const totalPages = Math.max(1, Math.ceil(allBorrowers.length / ITEMS_PER_PAGE));
  const paginatedBorrowers = useMemo(() => {
    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
    return allBorrowers.slice(startIndex, startIndex + ITEMS_PER_PAGE);
  }, [allBorrowers, currentPage]);

  // Handle adding a new borrower
  const handleAddBorrower = useCallback(() => {
    setEditingBorrower(null);
    setModalOpen(true);
  }, []);

  // Handle editing a borrower
  const handleEditBorrower = useCallback((borrower: BorrowerData) => {
    setEditingBorrower(borrower);
    setModalOpen(true);
  }, []);

  // Handle row click - navigate to borrower details
  const handleRowClick = useCallback((borrower: BorrowerData) => {
    setSelectedBorrowerPrefix(borrower.id);
    setActiveSubSection('primary');
  }, []);

  // Handle back navigation
  const handleBackToTable = useCallback(() => {
    setActiveSubSection('borrowers');
  }, []);

  // Handle primary borrower change - only one can be primary
  const handlePrimaryChange = useCallback((borrowerId: string, isPrimary: boolean) => {
    if (isPrimary) {
      // Unset all other borrowers as non-primary
      allBorrowers.forEach(b => {
        if (b.id !== borrowerId) {
          onValueChange(`${b.id}.is_primary`, 'false');
        }
      });
    }
    onValueChange(`${borrowerId}.is_primary`, String(isPrimary));
  }, [allBorrowers, onValueChange]);

  // Handle saving borrower from modal
  const handleSaveBorrower = useCallback((borrowerData: BorrowerData) => {
    setIsLoading(true);
    
    const prefix = editingBorrower ? editingBorrower.id : getNextBorrowerPrefix(values);
    
    // Save all borrower fields
    onValueChange(`${prefix}.is_primary`, String(borrowerData.isPrimary));
    onValueChange(`${prefix}.borrower_type`, borrowerData.borrowerType);
    onValueChange(`${prefix}.full_name`, borrowerData.fullName);
    onValueChange(`${prefix}.first_name`, borrowerData.firstName);
    onValueChange(`${prefix}.middle_initial`, borrowerData.middleName);
    onValueChange(`${prefix}.last_name`, borrowerData.lastName);
    onValueChange(`${prefix}.email`, borrowerData.email);
    onValueChange(`${prefix}.phone.mobile`, borrowerData.phone);
    onValueChange(`${prefix}.address.street`, borrowerData.street);
    onValueChange(`${prefix}.address.city`, borrowerData.city);
    onValueChange(`${prefix}.state`, borrowerData.state);
    onValueChange(`${prefix}.address.zip`, borrowerData.zipCode);
    onValueChange(`${prefix}.tax_id_type`, borrowerData.taxIdType);
    onValueChange(`${prefix}.tax_id`, borrowerData.taxId);
    onValueChange(`${prefix}.credit_score`, borrowerData.creditScore);
    onValueChange(`${prefix}.capacity`, borrowerData.capacity);
    
    // If this is marked as primary, unset others
    if (borrowerData.isPrimary) {
      allBorrowers.forEach(b => {
        if (b.id !== prefix) {
          onValueChange(`${b.id}.is_primary`, 'false');
        }
      });
    }
    
    setModalOpen(false);
    setIsLoading(false);
  }, [editingBorrower, values, onValueChange, allBorrowers]);

  // Handle page change
  const handlePageChange = useCallback((page: number) => {
    setCurrentPage(page);
  }, []);

  // Create borrower-specific values for the detail forms
  const getBorrowerSpecificValues = useCallback((): Record<string, string> => {
    const result: Record<string, string> = {};
    Object.entries(values).forEach(([key, value]) => {
      // Replace the current borrower prefix with 'borrower' for the form
      if (key.startsWith(`${selectedBorrowerPrefix}.`)) {
        const fieldName = key.replace(`${selectedBorrowerPrefix}.`, 'borrower.');
        result[fieldName] = value;
      } else if (!key.match(/^borrower\d+\./) && !key.startsWith('borrower.')) {
        // Include non-borrower fields as-is
        result[key] = value;
      }
    });
    return result;
  }, [values, selectedBorrowerPrefix]);

  // Handle value change for borrower-specific forms
  const handleBorrowerValueChange = useCallback((fieldKey: string, value: string) => {
    // Replace 'borrower.' with the selected borrower prefix
    const actualKey = fieldKey.replace('borrower.', `${selectedBorrowerPrefix}.`);
    onValueChange(actualKey, value);
  }, [selectedBorrowerPrefix, onValueChange]);

  // Get selected borrower name for display
  const selectedBorrowerName = useMemo(() => {
    const borrower = allBorrowers.find(b => b.id === selectedBorrowerPrefix);
    return borrower?.fullName || `${borrower?.firstName || ''} ${borrower?.lastName || ''}`.trim() || 'Borrower';
  }, [allBorrowers, selectedBorrowerPrefix]);

  const renderSubSectionContent = () => {
    switch (activeSubSection) {
      case 'borrowers':
        return (
          <BorrowersTableView
            borrowers={paginatedBorrowers}
            onAddBorrower={handleAddBorrower}
            onEditBorrower={handleEditBorrower}
            onRowClick={handleRowClick}
            onPrimaryChange={handlePrimaryChange}
            disabled={disabled}
            isLoading={isLoading}
            currentPage={currentPage}
            totalPages={totalPages}
            onPageChange={handlePageChange}
          />
        );
      case 'primary':
        return (
          <BorrowerPrimaryForm
            fields={fields}
            values={getBorrowerSpecificValues()}
            onValueChange={handleBorrowerValueChange}
            showValidation={showValidation}
            disabled={disabled}
            calculationResults={calculationResults}
          />
        );
      case 'additional_guarantor':
        return (
          <BorrowerAdditionalGuarantorForm
            fields={fields}
            values={getBorrowerSpecificValues()}
            onValueChange={handleBorrowerValueChange}
            showValidation={showValidation}
            disabled={disabled}
            calculationResults={calculationResults}
          />
        );
      case 'banking':
        return (
          <BorrowerBankingForm
            fields={fields}
            values={getBorrowerSpecificValues()}
            onValueChange={handleBorrowerValueChange}
            showValidation={showValidation}
            disabled={disabled}
            calculationResults={calculationResults}
          />
        );
      case 'tax_detail':
        return (
          <BorrowerTaxDetailForm
            fields={fields}
            values={getBorrowerSpecificValues()}
            onValueChange={handleBorrowerValueChange}
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
        {/* Back button and borrower name when in detail view */}
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
              {selectedBorrowerName}
            </span>
          </div>
        )}

        <div className="flex flex-1">
          {/* Sub-navigation tabs on the left */}
          <BorrowerSubNavigation
            activeSubSection={activeSubSection}
            onSubSectionChange={setActiveSubSection}
            showDetailTabs={isDetailView}
          />

          {/* Sub-section content on the right */}
          <div className="flex-1 min-w-0 overflow-auto">
            {renderSubSectionContent()}
          </div>
        </div>
      </div>

      {/* Add/Edit Borrower Modal */}
      <BorrowerModal
        open={modalOpen}
        onOpenChange={setModalOpen}
        borrower={editingBorrower}
        onSave={handleSaveBorrower}
        isEdit={!!editingBorrower}
      />
    </>
  );
};

export default BorrowerSectionContent;
