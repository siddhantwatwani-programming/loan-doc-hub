import React, { useState, useCallback, useMemo } from 'react';
import { ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { PropertySubNavigation, type PropertySubSection } from './PropertySubNavigation';
import { PropertyDetailsForm } from './PropertyDetailsForm';
import { PropertyLegalDescriptionForm } from './PropertyLegalDescriptionForm';
import { PropertyTaxForm } from './PropertyTaxForm';
import { PropertiesTableView, type PropertyData } from './PropertiesTableView';
import { PropertyModal } from './PropertyModal';
import { LienSectionContent } from './LienSectionContent';
import { InsuranceSectionContent } from './InsuranceSectionContent';
import type { FieldDefinition } from '@/hooks/useDealFields';
import type { CalculationResult } from '@/lib/calculationEngine';

interface PropertySectionContentProps {
  fields: FieldDefinition[];
  values: Record<string, string>;
  onValueChange: (fieldKey: string, value: string) => void;
  onRemoveValuesByPrefix?: (prefix: string) => void;
  showValidation?: boolean;
  disabled?: boolean;
  calculationResults?: Record<string, CalculationResult>;
}

// Helper to extract properties from values based on property prefix pattern
const extractPropertiesFromValues = (values: Record<string, string>): PropertyData[] => {
  const properties: PropertyData[] = [];
  const propertyPrefixes = new Set<string>();
  
  // Find all property prefixes (property1, property2, etc.)
  Object.keys(values).forEach(key => {
    const match = key.match(/^(property\d+)\./);
    if (match) {
      propertyPrefixes.add(match[1]);
    }
  });
  
  // Build property objects from values
  propertyPrefixes.forEach(prefix => {
    const property: PropertyData = {
      id: prefix,
      isPrimary: values[`${prefix}.primary_property`] === 'true',
      description: values[`${prefix}.description`] || '',
      street: values[`${prefix}.street`] || '',
      city: values[`${prefix}.city`] || '',
      state: values[`${prefix}.state`] || '',
      zipCode: values[`${prefix}.zip`] || '',
      county: values[`${prefix}.county`] || '',
      propertyType: values[`${prefix}.appraisal_property_type`] || '',
      occupancy: values[`${prefix}.appraisal_occupancy`] || '',
      appraisedValue: values[`${prefix}.appraised_value`] || '',
      appraisedDate: values[`${prefix}.appraised_date`] || '',
      ltv: values[`${prefix}.ltv`] || '',
      apn: values[`${prefix}.apn`] || '',
      loanPriority: values[`${prefix}.priority`] || '',
      floodZone: values[`${prefix}.flood_zone`] || '',
      pledgedEquity: values[`${prefix}.pledged_equity`] || '',
      zoning: values[`${prefix}.zoning`] || '',
      performedBy: values[`${prefix}.appraisal_performed_by`] || '',
    };
    properties.push(property);
  });
  
  // Sort to ensure property1 comes first
  properties.sort((a, b) => {
    const numA = parseInt(a.id.replace('property', ''));
    const numB = parseInt(b.id.replace('property', ''));
    return numA - numB;
  });
  
  return properties;
};

// Get the next available property prefix
const getNextPropertyPrefix = (values: Record<string, string>): string => {
  const propertyPrefixes = new Set<string>();
  Object.keys(values).forEach(key => {
    const match = key.match(/^(property\d+)\./);
    if (match) {
      propertyPrefixes.add(match[1]);
    }
  });
  
  let nextNum = 1;
  while (propertyPrefixes.has(`property${nextNum}`)) {
    nextNum++;
  }
  return `property${nextNum}`;
};

export const PropertySectionContent: React.FC<PropertySectionContentProps> = ({
  fields,
  values,
  onValueChange,
  onRemoveValuesByPrefix,
  showValidation = false,
  disabled = false,
  calculationResults = {},
}) => {
  const [activeSubSection, setActiveSubSection] = useState<PropertySubSection>('properties');
  const [selectedPropertyPrefix, setSelectedPropertyPrefix] = useState<string>('property1');
  const [modalOpen, setModalOpen] = useState(false);
  const [editingProperty, setEditingProperty] = useState<PropertyData | null>(null);
  
  // Check if we're in detail view (liens and insurance sections are handled separately)
  const isDetailView = ['property_details', 'legal_description', 'property_tax'].includes(activeSubSection);
  
  // Check if liens section is active (rendered separately)
  const isLiensSection = activeSubSection === 'liens';
  
  // Check if insurance section is active (rendered separately)
  const isInsuranceSection = activeSubSection === 'insurance';
  
  // Extract properties from values
  const properties = extractPropertiesFromValues(values);
  
  // Build property options for liens dropdown
  const propertyOptions = useMemo(() => {
    return properties.map(p => ({
      id: p.id,
      label: p.description || p.street || `Property ${p.id.replace('property', '')}`,
    }));
  }, [properties]);

  // Get the selected property name for detail view header
  const selectedPropertyName = useMemo(() => {
    const property = properties.find(p => p.id === selectedPropertyPrefix);
    if (property) {
      return property.description || property.street || `Property ${selectedPropertyPrefix.replace('property', '')}`;
    }
    return 'Property';
  }, [properties, selectedPropertyPrefix]);

  // Handle adding a new property
  const handleAddProperty = useCallback(() => {
    setEditingProperty(null);
    setModalOpen(true);
  }, []);

  // Handle editing a property
  const handleEditProperty = useCallback((property: PropertyData) => {
    setEditingProperty(property);
    setModalOpen(true);
  }, []);

  // Handle row click - navigate to property details
  const handleRowClick = useCallback((property: PropertyData) => {
    setSelectedPropertyPrefix(property.id);
    setActiveSubSection('property_details');
  }, []);

  // Handle back navigation
  const handleBackToTable = useCallback(() => {
    setActiveSubSection('properties');
  }, []);

  // Handle primary property change - only one can be primary
  const handlePrimaryChange = useCallback((propertyId: string, isPrimary: boolean) => {
    if (isPrimary) {
      // Unset all other properties as non-primary
      properties.forEach(p => {
        if (p.id !== propertyId) {
          onValueChange(`${p.id}.primary_property`, 'false');
        }
      });
    }
    onValueChange(`${propertyId}.primary_property`, String(isPrimary));
  }, [properties, onValueChange]);

  // Handle saving property from modal
  const handleSaveProperty = useCallback((propertyData: PropertyData) => {
    const prefix = editingProperty ? editingProperty.id : getNextPropertyPrefix(values);
    
    // Save all property fields
    onValueChange(`${prefix}.primary_property`, String(propertyData.isPrimary));
    onValueChange(`${prefix}.description`, propertyData.description);
    onValueChange(`${prefix}.street`, propertyData.street);
    onValueChange(`${prefix}.city`, propertyData.city);
    onValueChange(`${prefix}.state`, propertyData.state);
    onValueChange(`${prefix}.zip`, propertyData.zipCode);
    onValueChange(`${prefix}.county`, propertyData.county);
    onValueChange(`${prefix}.appraisal_property_type`, propertyData.propertyType);
    onValueChange(`${prefix}.appraisal_occupancy`, propertyData.occupancy);
    onValueChange(`${prefix}.appraised_value`, propertyData.appraisedValue);
    onValueChange(`${prefix}.appraised_date`, propertyData.appraisedDate);
    onValueChange(`${prefix}.ltv`, propertyData.ltv);
    onValueChange(`${prefix}.apn`, propertyData.apn);
    onValueChange(`${prefix}.priority`, propertyData.loanPriority);
    onValueChange(`${prefix}.flood_zone`, propertyData.floodZone || '');
    onValueChange(`${prefix}.pledged_equity`, propertyData.pledgedEquity || '');
    onValueChange(`${prefix}.zoning`, propertyData.zoning || '');
    onValueChange(`${prefix}.appraisal_performed_by`, propertyData.performedBy || '');
    
    // If this is marked as primary, unset others
    if (propertyData.isPrimary) {
      properties.forEach(p => {
        if (p.id !== prefix) {
          onValueChange(`${p.id}.primary_property`, 'false');
        }
      });
    }
    
    setModalOpen(false);
  }, [editingProperty, values, onValueChange, properties]);

  // Handle deleting a property
  const handleDeleteProperty = useCallback((property: PropertyData) => {
    if (onRemoveValuesByPrefix) {
      onRemoveValuesByPrefix(property.id);
    } else {
      Object.keys(values).forEach(key => {
        if (key.startsWith(`${property.id}.`)) {
          onValueChange(key, '');
        }
      });
    }
  }, [values, onValueChange, onRemoveValuesByPrefix]);

  // Create property-specific values for the detail forms
  const getPropertySpecificValues = (): Record<string, string> => {
    const result: Record<string, string> = {};
    Object.entries(values).forEach(([key, value]) => {
      // Replace the current property prefix with property1 for the form
      if (key.startsWith(`${selectedPropertyPrefix}.`)) {
        const fieldName = key.replace(`${selectedPropertyPrefix}.`, 'property1.');
        result[fieldName] = value;
      } else if (key.startsWith('property1.') && selectedPropertyPrefix !== 'property1') {
        // Don't include property1 fields if we're editing a different property
      } else {
        result[key] = value;
      }
    });
    return result;
  };

  // Handle value change for property-specific forms
  const handlePropertyValueChange = (fieldKey: string, value: string) => {
    // Replace property1 with the selected property prefix
    const actualKey = fieldKey.replace('property1.', `${selectedPropertyPrefix}.`);
    onValueChange(actualKey, value);
  };

  const renderSubSectionContent = () => {
    switch (activeSubSection) {
      case 'properties':
        return (
          <PropertiesTableView
            properties={properties}
            onAddProperty={handleAddProperty}
            onEditProperty={handleEditProperty}
            onRowClick={handleRowClick}
            onPrimaryChange={handlePrimaryChange}
            onDeleteProperty={handleDeleteProperty}
            disabled={disabled}
          />
        );
      case 'property_details':
        return (
          <PropertyDetailsForm
            fields={fields}
            values={getPropertySpecificValues()}
            onValueChange={handlePropertyValueChange}
            showValidation={showValidation}
            disabled={disabled}
            calculationResults={calculationResults}
          />
        );
      case 'legal_description':
        return (
          <PropertyLegalDescriptionForm
            fields={fields}
            values={getPropertySpecificValues()}
            onValueChange={handlePropertyValueChange}
            showValidation={showValidation}
            disabled={disabled}
            calculationResults={calculationResults}
          />
        );
      case 'liens':
        // Liens section is handled separately below
        return null;
      case 'insurance':
        // Insurance section is handled separately below
        return null;
      case 'property_tax':
        return (
          <PropertyTaxForm
            fields={fields}
            values={getPropertySpecificValues()}
            onValueChange={handlePropertyValueChange}
            showValidation={showValidation}
            disabled={disabled}
            calculationResults={calculationResults}
          />
        );
      default:
        return null;
    }
  };

  // Render Liens section separately (has its own table/detail view pattern)
  if (isLiensSection) {
    return (
      <>
        <div className="flex flex-col border border-border rounded-lg bg-background overflow-hidden">
          <div className="flex flex-1">
            {/* Sub-navigation tabs on the left */}
            <PropertySubNavigation
              activeSubSection={activeSubSection}
              onSubSectionChange={setActiveSubSection}
              isDetailView={false}
            />

            {/* Liens content */}
            <div className="flex-1 min-w-0 overflow-auto">
              <LienSectionContent
                values={values}
                onValueChange={onValueChange}
                onRemoveValuesByPrefix={onRemoveValuesByPrefix}
                disabled={disabled}
                propertyOptions={propertyOptions}
                onBack={handleBackToTable}
              />
            </div>
          </div>
        </div>
      </>
    );
  }

  // Render Insurance section separately (has its own table/detail view pattern)
  if (isInsuranceSection) {
    return (
      <>
        <div className="flex flex-col border border-border rounded-lg bg-background overflow-hidden">
          <div className="flex flex-1">
            {/* Sub-navigation tabs on the left */}
            <PropertySubNavigation
              activeSubSection={activeSubSection}
              onSubSectionChange={setActiveSubSection}
              isDetailView={false}
            />

            {/* Insurance content */}
            <div className="flex-1 min-w-0 overflow-auto">
              <InsuranceSectionContent
                values={values}
                onValueChange={onValueChange}
                onRemoveValuesByPrefix={onRemoveValuesByPrefix}
                disabled={disabled}
                propertyOptions={propertyOptions}
                onBack={handleBackToTable}
              />
            </div>
          </div>
        </div>
      </>
    );
  }

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
          </div>
        )}

        <div className="flex flex-1">
          {/* Sub-navigation tabs on the left - only shown in detail view */}
          <PropertySubNavigation
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

      {/* Add/Edit Property Modal */}
      <PropertyModal
        open={modalOpen}
        onOpenChange={setModalOpen}
        property={editingProperty}
        onSave={handleSaveProperty}
        isEdit={!!editingProperty}
      />
    </>
  );
};

export default PropertySectionContent;
