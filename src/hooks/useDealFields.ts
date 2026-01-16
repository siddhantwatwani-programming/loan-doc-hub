import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import type { Database } from '@/integrations/supabase/types';

type FieldSection = Database['public']['Enums']['field_section'];
type FieldDataType = Database['public']['Enums']['field_data_type'];

export interface FieldDefinition {
  id: string;
  field_key: string;
  label: string;
  section: FieldSection;
  data_type: FieldDataType;
  description: string | null;
  default_value: string | null;
  is_calculated: boolean;
  is_repeatable: boolean;
  validation_rule: string | null;
  is_required: boolean;
  transform_rules: string[];
}

export interface FieldValue {
  field_key: string;
  value_text: string | null;
  value_number: number | null;
  value_date: string | null;
  value_json: any | null;
}

export interface DealFieldsData {
  fields: FieldDefinition[];
  fieldsBySection: Record<FieldSection, FieldDefinition[]>;
  sections: FieldSection[];
  values: Record<string, string>;
  requiredFields: Set<string>;
  loading: boolean;
  saving: boolean;
  error: string | null;
}

export interface UseDealFieldsReturn extends DealFieldsData {
  updateValue: (fieldKey: string, value: string) => void;
  saveDraft: () => Promise<boolean>;
  getValidationErrors: (section?: FieldSection) => string[];
  getMissingRequiredFields: (section?: FieldSection) => FieldDefinition[];
  isSectionComplete: (section: FieldSection) => boolean;
  computeCalculatedFields: () => void;
}

// Section display order
const SECTION_ORDER: FieldSection[] = [
  'borrower',
  'co_borrower',
  'property',
  'loan_terms',
  'seller',
  'title',
  'escrow',
  'other'
];

// Map field data types to value columns
function getValueFromRecord(record: FieldValue, dataType: FieldDataType): string {
  switch (dataType) {
    case 'number':
    case 'currency':
    case 'percentage':
      return record.value_number?.toString() || '';
    case 'date':
      return record.value_date || '';
    case 'boolean':
      // Boolean stored as text 'true'/'false'
      return record.value_text || '';
    default:
      return record.value_text || '';
  }
}

export function useDealFields(dealId: string, packetId: string | null): UseDealFieldsReturn {
  const { toast } = useToast();
  const [fields, setFields] = useState<FieldDefinition[]>([]);
  const [values, setValues] = useState<Record<string, string>>({});
  const [requiredFields, setRequiredFields] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fieldDataTypes, setFieldDataTypes] = useState<Record<string, FieldDataType>>({});

  // Group fields by section
  const fieldsBySection = fields.reduce((acc, field) => {
    if (!acc[field.section]) {
      acc[field.section] = [];
    }
    acc[field.section].push(field);
    return acc;
  }, {} as Record<FieldSection, FieldDefinition[]>);

  // Get sections that have fields, in order
  const sections = SECTION_ORDER.filter(section => 
    fieldsBySection[section] && fieldsBySection[section].length > 0
  );

  // Fetch fields and values
  useEffect(() => {
    if (!dealId || !packetId) {
      setLoading(false);
      return;
    }
    
    fetchData();
  }, [dealId, packetId]);

  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);

      // 1. Get templates in this packet
      const { data: packetTemplates, error: ptError } = await supabase
        .from('packet_templates')
        .select('template_id')
        .eq('packet_id', packetId!);

      if (ptError) throw ptError;

      const templateIds = (packetTemplates || []).map(pt => pt.template_id);

      if (templateIds.length === 0) {
        setFields([]);
        setLoading(false);
        return;
      }

      // 2. Get all field mappings for these templates
      const { data: fieldMaps, error: fmError } = await supabase
        .from('template_field_maps')
        .select('field_key, required_flag, transform_rule')
        .in('template_id', templateIds);

      if (fmError) throw fmError;

      // Aggregate required fields and transform rules
      const requiredSet = new Set<string>();
      const transformRulesMap: Record<string, string[]> = {};

      (fieldMaps || []).forEach(fm => {
        if (fm.required_flag) {
          requiredSet.add(fm.field_key);
        }
        if (fm.transform_rule) {
          if (!transformRulesMap[fm.field_key]) {
            transformRulesMap[fm.field_key] = [];
          }
          if (!transformRulesMap[fm.field_key].includes(fm.transform_rule)) {
            transformRulesMap[fm.field_key].push(fm.transform_rule);
          }
        }
      });

      setRequiredFields(requiredSet);

      // Get unique field keys
      const fieldKeys = [...new Set((fieldMaps || []).map(fm => fm.field_key))];

      if (fieldKeys.length === 0) {
        setFields([]);
        setLoading(false);
        return;
      }

      // 3. Get field definitions from dictionary
      const { data: fieldDefs, error: fdError } = await supabase
        .from('field_dictionary')
        .select('*')
        .in('field_key', fieldKeys);

      if (fdError) throw fdError;

      // Build data type lookup
      const dataTypeMap: Record<string, FieldDataType> = {};
      (fieldDefs || []).forEach(fd => {
        dataTypeMap[fd.field_key] = fd.data_type;
      });
      setFieldDataTypes(dataTypeMap);

      // Build field definitions with required flag and transform rules
      const enrichedFields: FieldDefinition[] = (fieldDefs || []).map(fd => ({
        id: fd.id,
        field_key: fd.field_key,
        label: fd.label,
        section: fd.section,
        data_type: fd.data_type,
        description: fd.description,
        default_value: fd.default_value,
        is_calculated: fd.is_calculated,
        is_repeatable: fd.is_repeatable,
        validation_rule: fd.validation_rule,
        is_required: requiredSet.has(fd.field_key),
        transform_rules: transformRulesMap[fd.field_key] || [],
      }));

      // Sort fields by section and then by label
      enrichedFields.sort((a, b) => {
        const sectionOrderA = SECTION_ORDER.indexOf(a.section);
        const sectionOrderB = SECTION_ORDER.indexOf(b.section);
        if (sectionOrderA !== sectionOrderB) return sectionOrderA - sectionOrderB;
        return a.label.localeCompare(b.label);
      });

      setFields(enrichedFields);

      // 4. Fetch existing field values for this deal
      const { data: existingValues, error: evError } = await supabase
        .from('deal_field_values')
        .select('field_key, value_text, value_number, value_date, value_json')
        .eq('deal_id', dealId);

      if (evError) throw evError;

      // Build values map - convert typed values to strings for form display
      const valuesMap: Record<string, string> = {};
      (existingValues || []).forEach((ev: FieldValue) => {
        const dataType = dataTypeMap[ev.field_key] || 'text';
        const value = getValueFromRecord(ev, dataType);
        if (value) {
          valuesMap[ev.field_key] = value;
        }
      });

      // Apply default values for fields without values
      enrichedFields.forEach(field => {
        if (!valuesMap[field.field_key] && field.default_value) {
          valuesMap[field.field_key] = field.default_value;
        }
      });

      setValues(valuesMap);
    } catch (err: any) {
      console.error('Error fetching deal fields:', err);
      setError(err.message || 'Failed to load fields');
      toast({
        title: 'Error',
        description: 'Failed to load deal fields',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const updateValue = useCallback((fieldKey: string, value: string) => {
    setValues(prev => ({
      ...prev,
      [fieldKey]: value
    }));
  }, []);

  const computeCalculatedFields = useCallback(() => {
    // Example calculated field computations
    const newValues = { ...values };
    
    fields.forEach(field => {
      if (field.is_calculated) {
        // Example: loan_to_value calculation
        if (field.field_key === 'loan_terms.ltv') {
          const loanAmount = parseFloat(values['loan_terms.amount'] || '0');
          const propertyValue = parseFloat(values['property.value'] || '0');
          if (propertyValue > 0) {
            newValues[field.field_key] = ((loanAmount / propertyValue) * 100).toFixed(2);
          }
        }
        // Add more calculated field logic as needed
      }
    });

    setValues(newValues);
    return newValues;
  }, [fields, values]);

  const saveDraft = useCallback(async (): Promise<boolean> => {
    try {
      setSaving(true);

      // Get current user
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      // Compute calculated fields before saving
      const finalValues = computeCalculatedFields();

      // Get all field keys that have values
      const fieldKeysToSave = Object.keys(finalValues).filter(key => 
        finalValues[key] !== undefined && finalValues[key] !== ''
      );

      // Delete existing values for this deal
      const { error: deleteError } = await supabase
        .from('deal_field_values')
        .delete()
        .eq('deal_id', dealId);

      if (deleteError) throw deleteError;

      // Insert new values with correct typed columns
      if (fieldKeysToSave.length > 0) {
        const valuesToInsert = fieldKeysToSave.map(fieldKey => {
          const dataType = fieldDataTypes[fieldKey] || 'text';
          const stringValue = finalValues[fieldKey];
          
          // Build record with typed values
          const record: {
            deal_id: string;
            field_key: string;
            value_text: string | null;
            value_number: number | null;
            value_date: string | null;
            value_json: any | null;
            updated_by: string;
          } = {
            deal_id: dealId,
            field_key: fieldKey,
            value_text: null,
            value_number: null,
            value_date: null,
            value_json: null,
            updated_by: user.id,
          };

          switch (dataType) {
            case 'number':
            case 'currency':
            case 'percentage':
              const numValue = parseFloat(stringValue);
              record.value_number = isNaN(numValue) ? null : numValue;
              break;
            case 'date':
              record.value_date = stringValue || null;
              break;
            case 'boolean':
              record.value_text = stringValue;
              break;
            default:
              record.value_text = stringValue;
          }

          return record;
        });

        const { error: insertError } = await supabase
          .from('deal_field_values')
          .insert(valuesToInsert);

        if (insertError) throw insertError;
      }

      toast({
        title: 'Saved',
        description: 'Deal data saved successfully',
      });

      return true;
    } catch (err: any) {
      console.error('Error saving deal data:', err);
      toast({
        title: 'Error',
        description: err.message || 'Failed to save deal data',
        variant: 'destructive',
      });
      return false;
    } finally {
      setSaving(false);
    }
  }, [dealId, values, fields, fieldDataTypes, computeCalculatedFields, toast]);

  const getMissingRequiredFields = useCallback((section?: FieldSection): FieldDefinition[] => {
    return fields.filter(field => {
      if (section && field.section !== section) return false;
      if (!field.is_required) return false;
      const value = values[field.field_key];
      return !value || value.trim() === '';
    });
  }, [fields, values]);

  const getValidationErrors = useCallback((section?: FieldSection): string[] => {
    const errors: string[] = [];
    const missingFields = getMissingRequiredFields(section);
    
    missingFields.forEach(field => {
      errors.push(`${field.label} is required`);
    });

    return errors;
  }, [getMissingRequiredFields]);

  const isSectionComplete = useCallback((section: FieldSection): boolean => {
    return getMissingRequiredFields(section).length === 0;
  }, [getMissingRequiredFields]);

  return {
    fields,
    fieldsBySection,
    sections,
    values,
    requiredFields,
    loading,
    saving,
    error,
    updateValue,
    saveDraft,
    getValidationErrors,
    getMissingRequiredFields,
    isSectionComplete,
    computeCalculatedFields,
  };
}
