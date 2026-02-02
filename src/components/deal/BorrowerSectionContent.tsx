import React, { useState, useCallback, useMemo } from 'react';
import { ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { BorrowerSubNavigation, type BorrowerSubSection } from './BorrowerSubNavigation';
import { BorrowersTableView, type BorrowerData } from './BorrowersTableView';
import { CoBorrowersTableView, type CoBorrowerData } from './CoBorrowersTableView';
import { BorrowerModal } from './BorrowerModal';
import { CoBorrowerModal } from './CoBorrowerModal';
import { BorrowerPrimaryForm } from './BorrowerPrimaryForm';
import { BorrowerAdditionalGuarantorForm } from './BorrowerAdditionalGuarantorForm';
import { BorrowerBankingForm } from './BorrowerBankingForm';
import { BorrowerTaxDetailForm } from './BorrowerTaxDetailForm';
import { CoBorrowerPrimaryForm } from './CoBorrowerPrimaryForm';
import { CoBorrowerBankingForm } from './CoBorrowerBankingForm';
import { CoBorrowerTaxDetailForm } from './CoBorrowerTaxDetailForm';
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

// Helper to extract co-borrowers from values based on coborrower prefix pattern
const extractCoBorrowersFromValues = (values: Record<string, string>): CoBorrowerData[] => {
  const coBorrowers: CoBorrowerData[] = [];
  const coBorrowerPrefixes = new Set<string>();
  
  // Find all co-borrower prefixes (coborrower1, coborrower2, etc.)
  Object.keys(values).forEach(key => {
    const match = key.match(/^(coborrower\d+)\./);
    if (match) {
      coBorrowerPrefixes.add(match[1]);
    }
  });
  
  // Also check for base coborrower prefix (coborrower. without number)
  const hasCoBorrowerBase = Object.keys(values).some(key => 
    key.startsWith('coborrower.') && !key.match(/^coborrower\d+\./)
  );
  if (hasCoBorrowerBase) {
    coBorrowerPrefixes.add('coborrower');
  }
  
  // Build co-borrower objects from values
  coBorrowerPrefixes.forEach(prefix => {
    const coBorrower: CoBorrowerData = {
      id: prefix,
      fullName: values[`${prefix}.full_name`] || '',
      firstName: values[`${prefix}.first_name`] || '',
      middleName: values[`${prefix}.middle_name`] || '',
      lastName: values[`${prefix}.last_name`] || '',
      salutation: values[`${prefix}.salutation`] || '',
      generation: values[`${prefix}.generation`] || '',
      email: values[`${prefix}.email`] || '',
      homePhone: values[`${prefix}.phone.home`] || '',
      workPhone: values[`${prefix}.phone.work`] || '',
      mobilePhone: values[`${prefix}.phone.mobile`] || '',
      fax: values[`${prefix}.fax`] || '',
      street: values[`${prefix}.address.street`] || '',
      city: values[`${prefix}.address.city`] || '',
      state: values[`${prefix}.state`] || '',
      zipCode: values[`${prefix}.address.zip`] || '',
      loanNumber: values[`${prefix}.loan_number`] || '',
      tin: values[`${prefix}.tin`] || '',
      relation: values[`${prefix}.relation`] || 'None',
      type: values[`${prefix}.type`] || 'Co-Borrower',
      dob: values[`${prefix}.dob`] || '',
      creditReporting: values[`${prefix}.credit_reporting`] === 'true',
      resCode: values[`${prefix}.res_code`] || '',
      addressIndicator: values[`${prefix}.address_indicator`] || '',
      sendBorrowerNotifications: values[`${prefix}.send_borrower_notifications`] === 'true',
      format: values[`${prefix}.format`] || 'HTML',
      deliveryPrint: values[`${prefix}.delivery_print`] !== 'false',
      deliveryEmail: values[`${prefix}.delivery_email`] === 'true',
      deliverySms: values[`${prefix}.delivery_sms`] === 'true',
    };
    coBorrowers.push(coBorrower);
  });
  
  // Sort coborrower, coborrower1, coborrower2, etc.
  coBorrowers.sort((a, b) => {
    if (a.id === 'coborrower') return -1;
    if (b.id === 'coborrower') return 1;
    const numA = parseInt(a.id.replace('coborrower', '')) || 0;
    const numB = parseInt(b.id.replace('coborrower', '')) || 0;
    return numA - numB;
  });
  
  return coBorrowers;
};

// Get the next available co-borrower prefix
const getNextCoBorrowerPrefix = (values: Record<string, string>): string => {
  const coBorrowerPrefixes = new Set<string>();
  Object.keys(values).forEach(key => {
    const match = key.match(/^(coborrower\d+)\./);
    if (match) {
      coBorrowerPrefixes.add(match[1]);
    }
  });
  
  let nextNum = 1;
  while (coBorrowerPrefixes.has(`coborrower${nextNum}`)) {
    nextNum++;
  }
  return `coborrower${nextNum}`;
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
  
  // Co-Borrower state
  const [coBorrowerModalOpen, setCoBorrowerModalOpen] = useState(false);
  const [editingCoBorrower, setEditingCoBorrower] = useState<CoBorrowerData | null>(null);
  const [coBorrowerCurrentPage, setCoBorrowerCurrentPage] = useState(1);
  const [selectedCoBorrowerPrefix, setSelectedCoBorrowerPrefix] = useState<string>('coborrower');

  // Check if we're in detail view (any sub-section other than 'borrowers' or 'co_borrowers')
  const isBorrowerDetailView = ['primary', 'additional_guarantor', 'banking', 'tax_detail'].includes(activeSubSection);
  const isCoBorrowerDetailView = ['coborrower_primary', 'coborrower_banking', 'coborrower_tax_detail'].includes(activeSubSection);
  const isDetailView = isBorrowerDetailView || isCoBorrowerDetailView;

  // Extract borrowers from values
  const allBorrowers = useMemo(() => extractBorrowersFromValues(values), [values]);
  
  // Extract co-borrowers from values
  const allCoBorrowers = useMemo(() => extractCoBorrowersFromValues(values), [values]);
  
  // Paginated borrowers
  const totalPages = Math.max(1, Math.ceil(allBorrowers.length / ITEMS_PER_PAGE));
  const paginatedBorrowers = useMemo(() => {
    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
    return allBorrowers.slice(startIndex, startIndex + ITEMS_PER_PAGE);
  }, [allBorrowers, currentPage]);
  
  // Paginated co-borrowers
  const coBorrowerTotalPages = Math.max(1, Math.ceil(allCoBorrowers.length / ITEMS_PER_PAGE));
  const paginatedCoBorrowers = useMemo(() => {
    const startIndex = (coBorrowerCurrentPage - 1) * ITEMS_PER_PAGE;
    return allCoBorrowers.slice(startIndex, startIndex + ITEMS_PER_PAGE);
  }, [allCoBorrowers, coBorrowerCurrentPage]);

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
    if (isCoBorrowerDetailView) {
      setActiveSubSection('co_borrowers');
    } else {
      setActiveSubSection('borrowers');
    }
  }, [isCoBorrowerDetailView]);

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

  // Co-Borrower handlers
  const handleAddCoBorrower = useCallback(() => {
    setEditingCoBorrower(null);
    setCoBorrowerModalOpen(true);
  }, []);

  const handleEditCoBorrower = useCallback((coBorrower: CoBorrowerData) => {
    setEditingCoBorrower(coBorrower);
    setCoBorrowerModalOpen(true);
  }, []);

  const handleCoBorrowerRowClick = useCallback((coBorrower: CoBorrowerData) => {
    // Navigate to co-borrower detail view
    setSelectedCoBorrowerPrefix(coBorrower.id);
    setActiveSubSection('coborrower_primary');
  }, []);

  const handleSaveCoBorrower = useCallback((coBorrowerData: CoBorrowerData) => {
    setIsLoading(true);
    
    const prefix = editingCoBorrower ? editingCoBorrower.id : getNextCoBorrowerPrefix(values);
    
    // Save all co-borrower fields
    onValueChange(`${prefix}.full_name`, coBorrowerData.fullName);
    onValueChange(`${prefix}.first_name`, coBorrowerData.firstName);
    onValueChange(`${prefix}.middle_name`, coBorrowerData.middleName);
    onValueChange(`${prefix}.last_name`, coBorrowerData.lastName);
    onValueChange(`${prefix}.salutation`, coBorrowerData.salutation);
    onValueChange(`${prefix}.generation`, coBorrowerData.generation);
    onValueChange(`${prefix}.email`, coBorrowerData.email);
    onValueChange(`${prefix}.phone.home`, coBorrowerData.homePhone);
    onValueChange(`${prefix}.phone.work`, coBorrowerData.workPhone);
    onValueChange(`${prefix}.phone.mobile`, coBorrowerData.mobilePhone);
    onValueChange(`${prefix}.fax`, coBorrowerData.fax);
    onValueChange(`${prefix}.address.street`, coBorrowerData.street);
    onValueChange(`${prefix}.address.city`, coBorrowerData.city);
    onValueChange(`${prefix}.state`, coBorrowerData.state);
    onValueChange(`${prefix}.address.zip`, coBorrowerData.zipCode);
    onValueChange(`${prefix}.loan_number`, coBorrowerData.loanNumber);
    onValueChange(`${prefix}.tin`, coBorrowerData.tin);
    onValueChange(`${prefix}.relation`, coBorrowerData.relation);
    onValueChange(`${prefix}.type`, coBorrowerData.type);
    onValueChange(`${prefix}.dob`, coBorrowerData.dob);
    onValueChange(`${prefix}.credit_reporting`, String(coBorrowerData.creditReporting));
    onValueChange(`${prefix}.res_code`, coBorrowerData.resCode);
    onValueChange(`${prefix}.address_indicator`, coBorrowerData.addressIndicator);
    onValueChange(`${prefix}.send_borrower_notifications`, String(coBorrowerData.sendBorrowerNotifications));
    onValueChange(`${prefix}.format`, coBorrowerData.format);
    onValueChange(`${prefix}.delivery_print`, String(coBorrowerData.deliveryPrint));
    onValueChange(`${prefix}.delivery_email`, String(coBorrowerData.deliveryEmail));
    onValueChange(`${prefix}.delivery_sms`, String(coBorrowerData.deliverySms));
    
    setCoBorrowerModalOpen(false);
    setIsLoading(false);
  }, [editingCoBorrower, values, onValueChange]);

  const handleCoBorrowerPageChange = useCallback((page: number) => {
    setCoBorrowerCurrentPage(page);
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

  // Get selected co-borrower name for display
  const selectedCoBorrowerName = useMemo(() => {
    const coBorrower = allCoBorrowers.find(c => c.id === selectedCoBorrowerPrefix);
    return coBorrower?.fullName || `${coBorrower?.firstName || ''} ${coBorrower?.lastName || ''}`.trim() || 'Co-Borrower';
  }, [allCoBorrowers, selectedCoBorrowerPrefix]);

  // Create co-borrower-specific values for the detail forms
  const getCoBorrowerSpecificValues = useCallback((): Record<string, string> => {
    const result: Record<string, string> = {};
    Object.entries(values).forEach(([key, value]) => {
      // Replace the current coborrower prefix with 'coborrower' for the form
      if (key.startsWith(`${selectedCoBorrowerPrefix}.`)) {
        const fieldName = key.replace(`${selectedCoBorrowerPrefix}.`, 'coborrower.');
        result[fieldName] = value;
      } else if (!key.match(/^coborrower\d+\./) && !key.startsWith('coborrower.')) {
        // Include non-coborrower fields as-is
        result[key] = value;
      }
    });
    return result;
  }, [values, selectedCoBorrowerPrefix]);

  // Handle value change for co-borrower-specific forms
  const handleCoBorrowerValueChange = useCallback((fieldKey: string, value: string) => {
    // Replace 'coborrower.' with the selected coborrower prefix
    const actualKey = fieldKey.replace('coborrower.', `${selectedCoBorrowerPrefix}.`);
    onValueChange(actualKey, value);
  }, [selectedCoBorrowerPrefix, onValueChange]);

  // Get the display name for detail view header
  const detailViewName = isCoBorrowerDetailView ? selectedCoBorrowerName : selectedBorrowerName;

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
      case 'co_borrowers':
        return (
          <CoBorrowersTableView
            coBorrowers={paginatedCoBorrowers}
            onAddCoBorrower={handleAddCoBorrower}
            onEditCoBorrower={handleEditCoBorrower}
            onRowClick={handleCoBorrowerRowClick}
            disabled={disabled}
            isLoading={isLoading}
            currentPage={coBorrowerCurrentPage}
            totalPages={coBorrowerTotalPages}
            onPageChange={handleCoBorrowerPageChange}
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
      case 'coborrower_primary':
        return (
          <CoBorrowerPrimaryForm
            fields={fields}
            values={getCoBorrowerSpecificValues()}
            onValueChange={handleCoBorrowerValueChange}
            showValidation={showValidation}
            disabled={disabled}
            calculationResults={calculationResults}
          />
        );
      case 'coborrower_banking':
        return (
          <CoBorrowerBankingForm
            fields={fields}
            values={getCoBorrowerSpecificValues()}
            onValueChange={handleCoBorrowerValueChange}
            showValidation={showValidation}
            disabled={disabled}
            calculationResults={calculationResults}
          />
        );
      case 'coborrower_tax_detail':
        return (
          <CoBorrowerTaxDetailForm
            fields={fields}
            values={getCoBorrowerSpecificValues()}
            onValueChange={handleCoBorrowerValueChange}
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
        {/* Back button and borrower/co-borrower name when in detail view */}
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
              {detailViewName}
            </span>
          </div>
        )}

        <div className="flex flex-1">
          {/* Sub-navigation tabs on the left */}
          <BorrowerSubNavigation
            activeSubSection={activeSubSection}
            onSubSectionChange={setActiveSubSection}
            showDetailTabs={isDetailView}
            isCoBorrowerDetail={isCoBorrowerDetailView}
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

      {/* Add/Edit Co-Borrower Modal */}
      <CoBorrowerModal
        open={coBorrowerModalOpen}
        onOpenChange={setCoBorrowerModalOpen}
        coBorrower={editingCoBorrower}
        onSave={handleSaveCoBorrower}
        isEdit={!!editingCoBorrower}
      />
    </>
  );
};

export default BorrowerSectionContent;
