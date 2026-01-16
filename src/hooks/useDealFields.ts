import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { 
  resolvePacketFields, 
  getMissingRequiredFields as getResolverMissingFields,
  isSectionComplete as isResolverSectionComplete,
  type ResolvedField,
  type ResolvedFieldSet 
} from '@/lib/requiredFieldsResolver';
import type { Database } from '@/integrations/supabase/types';

type FieldSection = Database['public']['Enums']['field_section'];
type FieldDataType = Database['public']['Enums']['field_data_type'];

// Re-export types for convenience
export type { ResolvedField as FieldDefinition, ResolvedFieldSet };

export interface FieldValue {
  field_key: string;
  value_text: string | null;
  value_number: number | null;
  value_date: string | null;
  value_json: any | null;
}

export interface DealFieldsData {
  fields: ResolvedField[];
  fieldsBySection: Record<FieldSection, ResolvedField[]>;
  sections: FieldSection[];
  values: Record<string, string>;
  visibleFieldKeys: string[];
  requiredFieldKeys: string[];
  loading: boolean;
  saving: boolean;
  error: string | null;
  isDirty: boolean;
}

export interface UseDealFieldsReturn extends DealFieldsData {
  updateValue: (fieldKey: string, value: string, isRequiredField?: boolean) => void;
  saveDraft: () => Promise<boolean>;
  getValidationErrors: (section?: FieldSection) => string[];
  getMissingRequiredFields: (section?: FieldSection) => ResolvedField[];
  isSectionComplete: (section: FieldSection) => boolean;
  isPacketComplete: () => boolean;
  computeCalculatedFields: () => Record<string, string>;
  hasRequiredFieldChanged: () => boolean;
  resetDirty: () => void;
}

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
      return record.value_text || '';
    default:
      return record.value_text || '';
  }
}

export function useDealFields(dealId: string, packetId: string | null): UseDealFieldsReturn {
  const { toast } = useToast();
  const [resolvedFields, setResolvedFields] = useState<ResolvedFieldSet | null>(null);
  const [values, setValues] = useState<Record<string, string>>({});
  const [fieldDataTypes, setFieldDataTypes] = useState<Record<string, FieldDataType>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isDirty, setIsDirty] = useState(false);
  const [requiredFieldChanged, setRequiredFieldChanged] = useState(false);

  // Fetch resolved fields and values
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

      // 1. Resolve required fields for this packet (deterministic resolver)
      const resolved = await resolvePacketFields(packetId!);
      setResolvedFields(resolved);

      // Build data type lookup for saving
      const dataTypeMap: Record<string, FieldDataType> = {};
      resolved.fields.forEach(f => {
        dataTypeMap[f.field_key] = f.data_type;
      });
      setFieldDataTypes(dataTypeMap);

      // 2. Fetch existing field values for this deal
      if (resolved.visibleFieldKeys.length > 0) {
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
        resolved.fields.forEach(field => {
          if (!valuesMap[field.field_key] && field.default_value) {
            valuesMap[field.field_key] = field.default_value;
          }
        });

        setValues(valuesMap);
      }
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

  const updateValue = useCallback((fieldKey: string, value: string, isRequiredField?: boolean) => {
    setValues(prev => ({
      ...prev,
      [fieldKey]: value
    }));
    setIsDirty(true);
    
    // Track if a required field was changed
    if (isRequiredField || resolvedFields?.requiredFieldKeys.includes(fieldKey)) {
      setRequiredFieldChanged(true);
    }
  }, [resolvedFields]);

  const computeCalculatedFields = useCallback((): Record<string, string> => {
    if (!resolvedFields) return values;
    
    const newValues = { ...values };
    
    resolvedFields.fields.forEach(field => {
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
  }, [resolvedFields, values]);

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
  }, [dealId, values, fieldDataTypes, computeCalculatedFields, toast]);

  const getMissingRequiredFields = useCallback((section?: FieldSection): ResolvedField[] => {
    if (!resolvedFields) return [];
    return getResolverMissingFields(resolvedFields, values, section);
  }, [resolvedFields, values]);

  const getValidationErrors = useCallback((section?: FieldSection): string[] => {
    return getMissingRequiredFields(section).map(field => `${field.label} is required`);
  }, [getMissingRequiredFields]);

  const isSectionComplete = useCallback((section: FieldSection): boolean => {
    if (!resolvedFields) return true;
    return isResolverSectionComplete(resolvedFields, values, section);
  }, [resolvedFields, values]);

  const isPacketComplete = useCallback((): boolean => {
    return getMissingRequiredFields().length === 0;
  }, [getMissingRequiredFields]);

  const hasRequiredFieldChanged = useCallback((): boolean => {
    return requiredFieldChanged;
  }, [requiredFieldChanged]);

  const resetDirty = useCallback(() => {
    setIsDirty(false);
    setRequiredFieldChanged(false);
  }, []);

  return {
    fields: resolvedFields?.fields || [],
    fieldsBySection: resolvedFields?.fieldsBySection || ({} as Record<FieldSection, ResolvedField[]>),
    sections: resolvedFields?.sections || [],
    values,
    visibleFieldKeys: resolvedFields?.visibleFieldKeys || [],
    requiredFieldKeys: resolvedFields?.requiredFieldKeys || [],
    loading,
    saving,
    error,
    isDirty,
    updateValue,
    saveDraft,
    getValidationErrors,
    getMissingRequiredFields,
    isSectionComplete,
    isPacketComplete,
    computeCalculatedFields,
    hasRequiredFieldChanged,
    resetDirty,
  };
}
