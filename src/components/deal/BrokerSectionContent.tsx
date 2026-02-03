import React, { useState, useCallback, useMemo } from 'react';
import { BrokerSubNavigation, BrokerSubSection } from './BrokerSubNavigation';
import { BrokerInfoForm } from './BrokerInfoForm';
import { BrokerBankingForm } from './BrokerBankingForm';
import { BrokersTableView, type BrokerData } from './BrokersTableView';
import { BrokerModal } from './BrokerModal';
import type { FieldDefinition } from '@/hooks/useDealFields';
import type { CalculationResult } from '@/lib/calculationEngine';

interface BrokerSectionContentProps {
  fields: FieldDefinition[];
  values: Record<string, string>;
  onValueChange: (fieldKey: string, value: string) => void;
  showValidation?: boolean;
  disabled?: boolean;
  calculationResults?: Record<string, CalculationResult>;
}

// Helper to extract brokers from values based on broker prefix pattern
const extractBrokersFromValues = (values: Record<string, string>): BrokerData[] => {
  const brokers: BrokerData[] = [];
  const brokerPrefixes = new Set<string>();
  
  // Find all broker prefixes (broker1, broker2, etc.)
  Object.keys(values).forEach(key => {
    const match = key.match(/^(broker\d+)\./);
    if (match) {
      brokerPrefixes.add(match[1]);
    }
  });
  
  // Build broker objects from values
  brokerPrefixes.forEach(prefix => {
    const broker: BrokerData = {
      id: prefix,
      brokerId: values[`${prefix}.id`] || '',
      license: values[`${prefix}.License`] || '',
      company: values[`${prefix}.company`] || '',
      firstName: values[`${prefix}.first_name`] || '',
      middleName: values[`${prefix}.middle_name`] || '',
      lastName: values[`${prefix}.last_name`] || '',
      email: values[`${prefix}.email`] || '',
      street: values[`${prefix}.address.street`] || '',
      city: values[`${prefix}.address.city`] || '',
      state: values[`${prefix}.address.state`] || '',
      zip: values[`${prefix}.address.zip`] || '',
      phoneWork: values[`${prefix}.phone.work`] || '',
      phoneCell: values[`${prefix}.phone.cell`] || '',
    };
    brokers.push(broker);
  });
  
  // Sort to ensure broker1 comes first
  brokers.sort((a, b) => {
    const numA = parseInt(a.id.replace('broker', ''));
    const numB = parseInt(b.id.replace('broker', ''));
    return numA - numB;
  });
  
  return brokers;
};

// Get the next available broker prefix
const getNextBrokerPrefix = (values: Record<string, string>): string => {
  const brokerPrefixes = new Set<string>();
  Object.keys(values).forEach(key => {
    const match = key.match(/^(broker\d+)\./);
    if (match) {
      brokerPrefixes.add(match[1]);
    }
  });
  
  let nextNum = 1;
  while (brokerPrefixes.has(`broker${nextNum}`)) {
    nextNum++;
  }
  return `broker${nextNum}`;
};

export const BrokerSectionContent: React.FC<BrokerSectionContentProps> = ({
  fields,
  values,
  onValueChange,
  showValidation = false,
  disabled = false,
  calculationResults = {},
}) => {
  const [activeSubSection, setActiveSubSection] = useState<BrokerSubSection>('brokers');
  const [selectedBrokerPrefix, setSelectedBrokerPrefix] = useState<string>('broker1');
  const [modalOpen, setModalOpen] = useState(false);
  const [editingBroker, setEditingBroker] = useState<BrokerData | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  
  // Check if we're in detail view
  const isDetailView = ['broker', 'banking'].includes(activeSubSection);
  
  // Extract brokers from values
  const brokers = extractBrokersFromValues(values);

  // Get the selected broker name for detail view header
  const selectedBrokerName = useMemo(() => {
    const broker = brokers.find(b => b.id === selectedBrokerPrefix);
    if (broker) {
      const fullName = [broker.firstName, broker.lastName].filter(Boolean).join(' ');
      return fullName || broker.company || `Broker ${selectedBrokerPrefix.replace('broker', '')}`;
    }
    return 'Broker';
  }, [brokers, selectedBrokerPrefix]);

  // Handle adding a new broker
  const handleAddBroker = useCallback(() => {
    setEditingBroker(null);
    setModalOpen(true);
  }, []);

  // Handle editing a broker
  const handleEditBroker = useCallback((broker: BrokerData) => {
    setEditingBroker(broker);
    setModalOpen(true);
  }, []);

  // Handle row click - navigate to broker details
  const handleRowClick = useCallback((broker: BrokerData) => {
    setSelectedBrokerPrefix(broker.id);
    setActiveSubSection('broker');
  }, []);

  // Handle back navigation
  const handleBackToTable = useCallback(() => {
    setActiveSubSection('brokers');
  }, []);

  // Handle saving broker from modal
  const handleSaveBroker = useCallback((brokerData: BrokerData) => {
    const prefix = editingBroker ? editingBroker.id : getNextBrokerPrefix(values);
    
    // Save all broker fields
    onValueChange(`${prefix}.id`, brokerData.brokerId);
    onValueChange(`${prefix}.License`, brokerData.license);
    onValueChange(`${prefix}.company`, brokerData.company);
    onValueChange(`${prefix}.first_name`, brokerData.firstName);
    onValueChange(`${prefix}.middle_name`, brokerData.middleName);
    onValueChange(`${prefix}.last_name`, brokerData.lastName);
    onValueChange(`${prefix}.email`, brokerData.email);
    onValueChange(`${prefix}.address.street`, brokerData.street);
    onValueChange(`${prefix}.address.city`, brokerData.city);
    onValueChange(`${prefix}.address.state`, brokerData.state);
    onValueChange(`${prefix}.address.zip`, brokerData.zip);
    onValueChange(`${prefix}.phone.work`, brokerData.phoneWork);
    onValueChange(`${prefix}.phone.cell`, brokerData.phoneCell);
    
    setModalOpen(false);
  }, [editingBroker, values, onValueChange]);

  // Create broker-specific values for the detail forms
  const getBrokerSpecificValues = (): Record<string, string> => {
    const result: Record<string, string> = {};
    Object.entries(values).forEach(([key, value]) => {
      // Replace the current broker prefix with broker for the form (removing the number)
      if (key.startsWith(`${selectedBrokerPrefix}.`)) {
        const fieldName = key.replace(`${selectedBrokerPrefix}.`, 'broker.');
        result[fieldName] = value;
      } else if (!key.match(/^broker\d+\./)) {
        // Include non-broker-indexed fields
        result[key] = value;
      }
    });
    return result;
  };

  // Handle value change for broker-specific forms
  const handleBrokerValueChange = (fieldKey: string, value: string) => {
    // Replace broker. with the selected broker prefix
    const actualKey = fieldKey.replace('broker.', `${selectedBrokerPrefix}.`);
    onValueChange(actualKey, value);
  };

  const renderSubSectionContent = () => {
    switch (activeSubSection) {
      case 'brokers':
        return (
          <BrokersTableView
            brokers={brokers}
            onAddBroker={handleAddBroker}
            onEditBroker={handleEditBroker}
            onRowClick={handleRowClick}
            disabled={disabled}
            isLoading={isLoading}
          />
        );
      case 'broker':
        return (
          <div className="p-6">
            <BrokerInfoForm 
              disabled={disabled} 
              values={getBrokerSpecificValues()}
              onValueChange={handleBrokerValueChange}
            />
          </div>
        );
      case 'banking':
        return (
          <div className="p-6">
            <BrokerBankingForm 
              disabled={disabled}
              values={getBrokerSpecificValues()}
              onValueChange={handleBrokerValueChange}
            />
          </div>
        );
      default:
        return null;
    }
  };

  // Render table view full-width (without left navigation)
  if (activeSubSection === 'brokers') {
    return (
      <>
        <div className="border border-border rounded-lg bg-background">
          {renderSubSectionContent()}
        </div>

        {/* Add/Edit Broker Modal */}
        <BrokerModal
          open={modalOpen}
          onOpenChange={setModalOpen}
          broker={editingBroker}
          onSave={handleSaveBroker}
          isEdit={!!editingBroker}
        />
      </>
    );
  }

  // Render detail view with left navigation
  return (
    <>
      <div className="flex border border-border rounded-lg bg-background">
        {/* Sub-navigation tabs on the left */}
        <BrokerSubNavigation
          activeSubSection={activeSubSection}
          onSubSectionChange={setActiveSubSection}
          isDetailView={isDetailView}
          onBackToTable={handleBackToTable}
          detailViewName={selectedBrokerName}
        />

        {/* Sub-section content on the right */}
        <div className="flex-1 min-w-0 overflow-auto">
          {renderSubSectionContent()}
        </div>
      </div>

      {/* Add/Edit Broker Modal */}
      <BrokerModal
        open={modalOpen}
        onOpenChange={setModalOpen}
        broker={editingBroker}
        onSave={handleSaveBroker}
        isEdit={!!editingBroker}
      />
    </>
  );
};

export default BrokerSectionContent;
