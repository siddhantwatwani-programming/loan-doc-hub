import { useState, useEffect, useCallback, useMemo } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { 
  resolvePacketFields, 
  getMissingRequiredFields as getResolverMissingFields,
  isSectionComplete as isResolverSectionComplete,
  type ResolvedField,
  type ResolvedFieldSet 
} from '@/lib/requiredFieldsResolver';
import { 
  computeCalculatedFields as runCalculations,
  mergeCalculatedValues,
  type CalculatedField,
  type CalculationResult
} from '@/lib/calculationEngine';
import type { Database } from '@/integrations/supabase/types';

type FieldSection = Database['public']['Enums']['field_section'];
type FieldDataType = Database['public']['Enums']['field_data_type'];

// Re-export types for convenience
export type { ResolvedField as FieldDefinition, ResolvedFieldSet };

export interface FieldValue {
  field_dictionary_id: string;
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
  calculationResults: Record<string, CalculationResult>;
  calculatedFields: CalculatedField[];
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
  const [fieldIdMap, setFieldIdMap] = useState<Record<string, string>>({}); // field_key -> field_dictionary_id
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

      // UI: Ensure certain sections render as tabs when they exist in field_dictionary,
      // even if they are not mapped in TemplateFieldMap for the active packet.
      // NOTE: Required-field logic remains driven by TemplateFieldMap (resolved.requiredFieldKeys).
      const TMO_TAB_SECTIONS: FieldSection[] = ['lender', 'participants', 'title'];

      let mergedResolved = resolved;
      try {
        const { data: tmoFields, error: tmoError } = await supabase
          .from('field_dictionary')
          .select(
            'id, field_key, label, section, data_type, description, default_value, is_calculated, is_repeatable, validation_rule, calculation_formula, calculation_dependencies'
          )
          .in('section', TMO_TAB_SECTIONS as any);

        if (tmoError) throw tmoError;

        const existingIds = new Set(resolved.fields.map(f => f.field_dictionary_id));
        const existingKeys = new Set(resolved.fields.map(f => f.field_key));

        const appendedFields: ResolvedField[] = (tmoFields || [])
          .filter((fd: any) => fd?.id && fd?.field_key)
          .filter((fd: any) => !existingIds.has(fd.id) && !existingKeys.has(fd.field_key))
          .map((fd: any) => ({
            field_dictionary_id: fd.id,
            field_key: fd.field_key,
            label: fd.label,
            section: fd.section,
            data_type: fd.data_type,
            description: fd.description,
            default_value: fd.default_value,
            is_calculated: !!fd.is_calculated,
            is_repeatable: !!fd.is_repeatable,
            validation_rule: fd.validation_rule,
            // Keep required-field logic unchanged: only TemplateFieldMap determines required.
            is_required: false,
            transform_rules: [],
            calculation_formula: fd.calculation_formula || null,
            calculation_dependencies: fd.calculation_dependencies || [],
          }));

        if (appendedFields.length > 0) {
          // Merge fields
          const mergedFields = [...resolved.fields, ...appendedFields];

          // Rebuild groups
          const mergedFieldsBySection = mergedFields.reduce((acc, field) => {
            (acc[field.section] ||= []).push(field);
            return acc;
          }, {} as Record<FieldSection, ResolvedField[]>);

          // Append the requested tabs after whatever the packet already exposes
          const appendedSectionsInOrder = TMO_TAB_SECTIONS.filter(
            (s) => (mergedFieldsBySection[s]?.length || 0) > 0 && !resolved.sections.includes(s)
          );
          const mergedSections = [...resolved.sections, ...appendedSectionsInOrder];

          mergedResolved = {
            ...resolved,
            visibleFieldIds: [...new Set([...resolved.visibleFieldIds, ...appendedFields.map(f => f.field_dictionary_id)])],
            visibleFieldKeys: [...new Set([...resolved.visibleFieldKeys, ...appendedFields.map(f => f.field_key)])],
            fields: mergedFields,
            fieldsBySection: mergedFieldsBySection,
            sections: mergedSections,
          };
        }
      } catch (e) {
        // Non-blocking: if the dictionary lookup fails, fall back to the packet-resolved set
        console.warn('Unable to load additional TMO tab sections from field_dictionary:', e);
      }

      setResolvedFields(mergedResolved);

      // Build data type and ID lookup maps
      const dataTypeMap: Record<string, FieldDataType> = {};
      const idMap: Record<string, string> = {};
      mergedResolved.fields.forEach(f => {
        dataTypeMap[f.field_key] = f.data_type;
        idMap[f.field_key] = f.field_dictionary_id;
      });
      setFieldDataTypes(dataTypeMap);
      setFieldIdMap(idMap);

      // 2. Fetch existing field values for this deal
      if (mergedResolved.visibleFieldKeys.length > 0) {
        const { data: existingValues, error: evError } = await supabase
          .from('deal_field_values')
          .select('field_dictionary_id, value_text, value_number, value_date, value_json')
          .eq('deal_id', dealId);

        if (evError) throw evError;

        // Create lookup map from field_dictionary_id to field metadata
        const fieldDictIdToMeta = new Map<string, { field_key: string; data_type: FieldDataType }>();
        mergedResolved.fields.forEach(f => {
          fieldDictIdToMeta.set(f.field_dictionary_id, { field_key: f.field_key, data_type: f.data_type });
        });

        // Build values map - convert typed values to strings for form display
        const valuesMap: Record<string, string> = {};
        ((existingValues || []) as any[]).forEach((ev) => {
          const fieldMeta = fieldDictIdToMeta.get(ev.field_dictionary_id);
          if (fieldMeta) {
            const fieldValue: FieldValue = {
              field_dictionary_id: ev.field_dictionary_id,
              field_key: fieldMeta.field_key,
              value_text: ev.value_text,
              value_number: ev.value_number,
              value_date: ev.value_date,
              value_json: ev.value_json,
            };
            const value = getValueFromRecord(fieldValue, fieldMeta.data_type);
            if (value) {
              valuesMap[fieldMeta.field_key] = value;
            }
          }
        });

        // Apply default values for fields without values
        mergedResolved.fields.forEach(field => {
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

  // Memoize calculated fields list
  const calculatedFieldsList = useMemo((): CalculatedField[] => {
    if (!resolvedFields) return [];
    return resolvedFields.fields
      .filter(f => f.is_calculated && f.calculation_formula)
      .map(f => ({
        field_key: f.field_key,
        calculation_formula: f.calculation_formula!,
        calculation_dependencies: f.calculation_dependencies,
        data_type: f.data_type,
      }));
  }, [resolvedFields]);

  // Store calculation results
  const [calculationResults, setCalculationResults] = useState<Record<string, CalculationResult>>({});

  const computeCalculatedFields = useCallback((): Record<string, string> => {
    if (!resolvedFields || calculatedFieldsList.length === 0) return values;
    
    // Run the calculation engine
    const results = runCalculations(calculatedFieldsList, values);
    setCalculationResults(results);
    
    // Merge computed values
    const newValues = mergeCalculatedValues(values, results);
    setValues(newValues);
    
    return newValues;
  }, [resolvedFields, calculatedFieldsList, values]);

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

      // Use upsert with field_dictionary_id
      if (fieldKeysToSave.length > 0) {
        const valuesToUpsert = fieldKeysToSave
          .filter(fieldKey => fieldIdMap[fieldKey]) // Only save fields we have IDs for
          .map(fieldKey => {
            const dataType = fieldDataTypes[fieldKey] || 'text';
            const stringValue = finalValues[fieldKey];
            const fieldDictId = fieldIdMap[fieldKey];
            
            const record: {
              deal_id: string;
              field_dictionary_id: string;
              value_text: string | null;
              value_number: number | null;
              value_date: string | null;
              value_json: any | null;
              updated_by: string;
            } = {
              deal_id: dealId,
              field_dictionary_id: fieldDictId,
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

        if (valuesToUpsert.length > 0) {
          const { error: upsertError } = await supabase
            .from('deal_field_values')
            .upsert(valuesToUpsert, { onConflict: 'deal_id,field_dictionary_id' });

          if (upsertError) throw upsertError;
        }
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
  }, [dealId, values, fieldDataTypes, fieldIdMap, computeCalculatedFields, toast]);

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
    calculationResults,
    calculatedFields: calculatedFieldsList,
    hasRequiredFieldChanged,
    resetDirty,
  };
}
