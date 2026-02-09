import React, { useState, useCallback, useMemo } from 'react';
import { ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { InsuranceSubNavigation, type InsuranceSubSection } from './InsuranceSubNavigation';
import { InsuranceTableView, type InsuranceData } from './InsuranceTableView';
import { InsuranceModal } from './InsuranceModal';
import { InsuranceDetailForm } from './InsuranceDetailForm';

interface InsuranceSectionContentProps {
  values: Record<string, string>;
  onValueChange: (fieldKey: string, value: string) => void;
  disabled?: boolean;
  propertyOptions?: { id: string; label: string }[];
  onBack?: () => void;
}

// Helper to extract insurances from values based on insurance prefix pattern
const extractInsurancesFromValues = (values: Record<string, string>): InsuranceData[] => {
  const insurances: InsuranceData[] = [];
  const insurancePrefixes = new Set<string>();
  
  // Find all insurance prefixes (insurance1, insurance2, etc.)
  Object.keys(values).forEach(key => {
    const match = key.match(/^(insurance\d+)\./);
    if (match) {
      insurancePrefixes.add(match[1]);
    }
  });
  
  // Build insurance objects from values
  insurancePrefixes.forEach(prefix => {
    const insurance: InsuranceData = {
      id: prefix,
      property: values[`${prefix}.property`] || '',
      description: values[`${prefix}.description`] || '',
      insuredName: values[`${prefix}.insured_name`] || '',
      companyName: values[`${prefix}.company_name`] || '',
      policyNumber: values[`${prefix}.policy_number`] || '',
      expiration: values[`${prefix}.expiration`] || '',
      coverage: values[`${prefix}.coverage`] || '',
      active: values[`${prefix}.active`] === 'true',
      agentName: values[`${prefix}.agent_name`] || '',
      businessAddress: values[`${prefix}.business_address`] || '',
      phoneNumber: values[`${prefix}.phone_number`] || '',
      faxNumber: values[`${prefix}.fax_number`] || '',
      email: values[`${prefix}.email`] || '',
      note: values[`${prefix}.note`] || '',
    };
    insurances.push(insurance);
  });
  
  // Sort to ensure insurance1 comes first
  insurances.sort((a, b) => {
    const numA = parseInt(a.id.replace('insurance', ''));
    const numB = parseInt(b.id.replace('insurance', ''));
    return numA - numB;
  });
  
  return insurances;
};

// Get the next available insurance prefix
const getNextInsurancePrefix = (values: Record<string, string>): string => {
  const insurancePrefixes = new Set<string>();
  Object.keys(values).forEach(key => {
    const match = key.match(/^(insurance\d+)\./);
    if (match) {
      insurancePrefixes.add(match[1]);
    }
  });
  
  let nextNum = 1;
  while (insurancePrefixes.has(`insurance${nextNum}`)) {
    nextNum++;
  }
  return `insurance${nextNum}`;
};

export const InsuranceSectionContent: React.FC<InsuranceSectionContentProps> = ({
  values,
  onValueChange,
  disabled = false,
  propertyOptions = [],
  onBack,
}) => {
  const [activeSubSection, setActiveSubSection] = useState<InsuranceSubSection>('insurances');
  const [selectedInsurancePrefix, setSelectedInsurancePrefix] = useState<string>('insurance1');
  const [modalOpen, setModalOpen] = useState(false);
  const [editingInsurance, setEditingInsurance] = useState<InsuranceData | null>(null);
  
  // Check if we're in detail view
  const isDetailView = activeSubSection === 'insurance_details';
  
  // Extract insurances from values
  const insurances = extractInsurancesFromValues(values);

  // Get the selected insurance for detail view
  const selectedInsurance = useMemo(() => {
    return insurances.find(i => i.id === selectedInsurancePrefix) || {
      id: selectedInsurancePrefix,
      property: '',
      description: '',
      insuredName: '',
      companyName: '',
      policyNumber: '',
      expiration: '',
      coverage: '',
      active: true,
      agentName: '',
      businessAddress: '',
      phoneNumber: '',
      faxNumber: '',
      email: '',
      note: '',
    };
  }, [insurances, selectedInsurancePrefix]);

  // Get the selected insurance name for detail view header
  const selectedInsuranceName = useMemo(() => {
    if (selectedInsurance.description) {
      return selectedInsurance.description;
    }
    if (selectedInsurance.companyName) {
      return selectedInsurance.companyName;
    }
    return `Insurance ${selectedInsurancePrefix.replace('insurance', '')}`;
  }, [selectedInsurance, selectedInsurancePrefix]);

  // Handle adding a new insurance
  const handleAddInsurance = useCallback(() => {
    setEditingInsurance(null);
    setModalOpen(true);
  }, []);

  // Handle editing an insurance
  const handleEditInsurance = useCallback((insurance: InsuranceData) => {
    setEditingInsurance(insurance);
    setModalOpen(true);
  }, []);

  // Handle row click - navigate to insurance details
  const handleRowClick = useCallback((insurance: InsuranceData) => {
    setSelectedInsurancePrefix(insurance.id);
    setActiveSubSection('insurance_details');
  }, []);

  // Handle back navigation
  const handleBackToTable = useCallback(() => {
    setActiveSubSection('insurances');
  }, []);

  // Handle saving insurance from modal
  const handleSaveInsurance = useCallback((insuranceData: InsuranceData) => {
    const prefix = editingInsurance ? editingInsurance.id : getNextInsurancePrefix(values);
    
    // Save all insurance fields
    onValueChange(`${prefix}.property`, insuranceData.property);
    onValueChange(`${prefix}.description`, insuranceData.description);
    onValueChange(`${prefix}.insured_name`, insuranceData.insuredName);
    onValueChange(`${prefix}.company_name`, insuranceData.companyName);
    onValueChange(`${prefix}.policy_number`, insuranceData.policyNumber);
    onValueChange(`${prefix}.expiration`, insuranceData.expiration);
    onValueChange(`${prefix}.coverage`, insuranceData.coverage);
    onValueChange(`${prefix}.active`, String(insuranceData.active));
    onValueChange(`${prefix}.agent_name`, insuranceData.agentName);
    onValueChange(`${prefix}.business_address`, insuranceData.businessAddress);
    onValueChange(`${prefix}.phone_number`, insuranceData.phoneNumber);
    onValueChange(`${prefix}.fax_number`, insuranceData.faxNumber);
    onValueChange(`${prefix}.email`, insuranceData.email);
    onValueChange(`${prefix}.note`, insuranceData.note);
    
    setModalOpen(false);
  }, [editingInsurance, values, onValueChange]);

  // Handle insurance field change in detail view
  const handleInsuranceFieldChange = useCallback((field: keyof InsuranceData, value: string | boolean) => {
    const fieldKeyMap: Record<keyof InsuranceData, string> = {
      id: 'id',
      property: 'property',
      description: 'description',
      insuredName: 'insured_name',
      companyName: 'company_name',
      policyNumber: 'policy_number',
      expiration: 'expiration',
      coverage: 'coverage',
      active: 'active',
      agentName: 'agent_name',
      businessAddress: 'business_address',
      phoneNumber: 'phone_number',
      faxNumber: 'fax_number',
      email: 'email',
      note: 'note',
    };
    const dbField = fieldKeyMap[field];
    if (dbField && dbField !== 'id') {
      onValueChange(`${selectedInsurancePrefix}.${dbField}`, String(value));
    }
  }, [selectedInsurancePrefix, onValueChange]);

  const renderSubSectionContent = () => {
    switch (activeSubSection) {
      case 'insurances':
        return (
          <InsuranceTableView
            insurances={insurances}
            onAddInsurance={handleAddInsurance}
            onEditInsurance={handleEditInsurance}
            onRowClick={handleRowClick}
            onBack={onBack}
            disabled={disabled}
          />
        );
      case 'insurance_details':
        return (
          <InsuranceDetailForm
            insurance={selectedInsurance}
            onChange={handleInsuranceFieldChange}
            disabled={disabled}
            propertyOptions={propertyOptions}
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
              {selectedInsuranceName}
            </span>
          </div>
        )}

        <div className="flex flex-1">
          {/* Sub-navigation tabs on the left - only shown in detail view */}
          <InsuranceSubNavigation
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

      {/* Add/Edit Insurance Modal */}
      <InsuranceModal
        open={modalOpen}
        onOpenChange={setModalOpen}
        insurance={editingInsurance}
        onSave={handleSaveInsurance}
        isEdit={!!editingInsurance}
        propertyOptions={propertyOptions}
      />
    </>
  );
};

export default InsuranceSectionContent;
