import React, { useState, useCallback } from 'react';
import { PropertySubNavigation, type PropertySubSection } from './PropertySubNavigation';
import { PropertyGrid, type PropertyData } from './PropertyGrid';
import { PropertyDetailsForm } from './PropertyDetailsForm';
import { PropertyLegalDescriptionForm } from './PropertyLegalDescriptionForm';
import { PropertyLiensForm } from './PropertyLiensForm';
import { PropertyInsuranceForm } from './PropertyInsuranceForm';
import { PropertyTaxForm } from './PropertyTaxForm';
import type { FieldDefinition } from '@/hooks/useDealFields';
import type { CalculationResult } from '@/lib/calculationEngine';

interface PropertySectionContentProps {
  fields: FieldDefinition[];
  values: Record<string, string>;
  onValueChange: (fieldKey: string, value: string) => void;
  showValidation?: boolean;
  disabled?: boolean;
  calculationResults?: Record<string, CalculationResult>;
}

// Helper to get property-indexed field key
const getPropertyFieldKey = (propertyIndex: number, field: string): string => {
  return `property${propertyIndex}.${field}`;
};

// Convert values object to PropertyData array
const parsePropertiesFromValues = (values: Record<string, string>): PropertyData[] => {
  const properties: PropertyData[] = [];
  
  // Check for property1, property2, etc.
  for (let i = 1; i <= 10; i++) {
    const prefix = `property${i}.`;
    const hasData = Object.keys(values).some(
      (key) => key.startsWith(prefix) && values[key]?.trim()
    );
    
    if (hasData || i === 1) {
      properties.push({
        id: `property${i}`,
        isPrimary: values[`${prefix}primary_property`] === 'true',
        description: values[`${prefix}description`] || '',
        street: values[`${prefix}street`] || '',
        city: values[`${prefix}city`] || '',
        state: values[`${prefix}state`] || '',
        zipCode: values[`${prefix}zip`] || '',
        county: values[`${prefix}county`] || '',
        propertyType: values[`${prefix}appraisal_property_type`] || '',
        occupancy: values[`${prefix}appraisal_occupancy`] || '',
        appraisedValue: values[`${prefix}appraised_value`] || '',
        appraisalDate: values[`${prefix}appraised_date`] || '',
        ltv: values[`${prefix}ltv`] || '',
        apn: values[`${prefix}apn`] || '',
        loanPriority: values[`${prefix}priority`] || '',
      });
    }
  }
  
  // If no properties exist, create a default one
  if (properties.length === 0) {
    properties.push({
      id: 'property1',
      isPrimary: true,
      description: '',
      street: '',
      city: '',
      state: '',
      zipCode: '',
      county: '',
      propertyType: '',
      occupancy: '',
      appraisedValue: '',
      appraisalDate: '',
      ltv: '',
      apn: '',
      loanPriority: '',
    });
  }
  
  return properties;
};

export const PropertySectionContent: React.FC<PropertySectionContentProps> = ({
  fields,
  values,
  onValueChange,
  showValidation = false,
  disabled = false,
  calculationResults = {},
}) => {
  const [activeSubSection, setActiveSubSection] = useState<PropertySubSection>('properties_grid');
  const [selectedPropertyIndex, setSelectedPropertyIndex] = useState<number>(1);
  
  // Parse properties from values
  const properties = parsePropertiesFromValues(values);

  // Handle property selection from grid (view details on row click)
  const handlePropertySelect = useCallback((property: PropertyData) => {
    const index = parseInt(property.id.replace('property', ''), 10);
    setSelectedPropertyIndex(index);
    setActiveSubSection('property_details');
  }, []);

  // Handle edit property action (same as select, opens edit form)
  const handleEditProperty = useCallback((property: PropertyData) => {
    const index = parseInt(property.id.replace('property', ''), 10);
    setSelectedPropertyIndex(index);
    setActiveSubSection('property_details');
  }, []);

  // Handle add new property
  const handleAddProperty = useCallback(() => {
    const nextIndex = properties.length + 1;
    // Initialize the new property with empty values
    onValueChange(`property${nextIndex}.street`, '');
    setSelectedPropertyIndex(nextIndex);
    setActiveSubSection('property_details');
  }, [properties.length, onValueChange]);

  // Handle primary property change
  const handlePrimaryChange = useCallback((propertyId: string, isPrimary: boolean) => {
    if (isPrimary) {
      // Unmark all other properties as primary
      properties.forEach((prop) => {
        const index = parseInt(prop.id.replace('property', ''), 10);
        onValueChange(`property${index}.primary_property`, prop.id === propertyId ? 'true' : 'false');
      });
    }
  }, [properties, onValueChange]);

  // Get prefixed values for the selected property
  const getPropertyPrefixedValues = useCallback((): Record<string, string> => {
    const prefix = `property${selectedPropertyIndex}.`;
    const result: Record<string, string> = {};
    
    // Copy all property-prefixed values
    Object.keys(values).forEach((key) => {
      if (key.startsWith(prefix)) {
        // Normalize to property1.* for the form
        const normalizedKey = `property1.${key.substring(prefix.length)}`;
        result[normalizedKey] = values[key];
      }
    });
    
    return result;
  }, [values, selectedPropertyIndex]);

  // Handle value change for the selected property
  const handlePropertyValueChange = useCallback((fieldKey: string, value: string) => {
    // Replace property1.* with propertyN.* where N is the selected index
    const actualKey = fieldKey.replace('property1.', `property${selectedPropertyIndex}.`);
    onValueChange(actualKey, value);
  }, [selectedPropertyIndex, onValueChange]);

  const renderSubSectionContent = () => {
    switch (activeSubSection) {
      case 'properties_grid':
        return (
          <div className="p-6">
            <PropertyGrid
              properties={properties}
              onPropertySelect={handlePropertySelect}
              onEditProperty={handleEditProperty}
              onAddProperty={handleAddProperty}
              onPrimaryChange={handlePrimaryChange}
              disabled={disabled}
            />
          </div>
        );
      case 'property_details':
        return (
          <PropertyDetailsForm
            fields={fields}
            values={getPropertyPrefixedValues()}
            onValueChange={handlePropertyValueChange}
            showValidation={showValidation}
            disabled={disabled}
            calculationResults={calculationResults}
            propertyIndex={selectedPropertyIndex}
            onBackToGrid={() => setActiveSubSection('properties_grid')}
          />
        );
      case 'legal_description':
        return (
          <PropertyLegalDescriptionForm
            fields={fields}
            values={getPropertyPrefixedValues()}
            onValueChange={handlePropertyValueChange}
            showValidation={showValidation}
            disabled={disabled}
            calculationResults={calculationResults}
          />
        );
      case 'liens':
        return (
          <PropertyLiensForm
            fields={fields}
            values={getPropertyPrefixedValues()}
            onValueChange={handlePropertyValueChange}
            showValidation={showValidation}
            disabled={disabled}
            calculationResults={calculationResults}
          />
        );
      case 'insurance':
        return (
          <PropertyInsuranceForm
            fields={fields}
            values={getPropertyPrefixedValues()}
            onValueChange={handlePropertyValueChange}
            showValidation={showValidation}
            disabled={disabled}
            calculationResults={calculationResults}
          />
        );
      case 'property_tax':
        return (
          <PropertyTaxForm
            fields={fields}
            values={getPropertyPrefixedValues()}
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

  return (
    <div className="flex border border-border rounded-lg bg-background overflow-hidden">
      {/* Sub-navigation tabs on the left */}
      <PropertySubNavigation
        activeSubSection={activeSubSection}
        onSubSectionChange={setActiveSubSection}
        showGridOption={true}
      />

      {/* Sub-section content on the right */}
      <div className="flex-1">
        {renderSubSectionContent()}
      </div>
    </div>
  );
};

export default PropertySectionContent;
