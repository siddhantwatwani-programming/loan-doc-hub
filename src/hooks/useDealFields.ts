import { useState, useEffect, useCallback, useMemo } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { 
  resolvePacketFields,
  resolveAllFields,
  getMissingRequiredFields as getResolverMissingFields,
  isSectionComplete as isResolverSectionComplete,
  SECTION_ORDER,
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

// JSONB field value structure
interface JsonbFieldValue {
  indexed_key?: string; // Preserves the indexed key (e.g., "lender1.first_name") for multi-entity support
  value_text: string | null;
  value_number: number | null;
  value_date: string | null;
  value_json: any | null;
  updated_at: string;
  updated_by: string | null;
}

// Extracts canonical key from indexed key
// e.g., "lender1.first_name" -> "lender.first_name"
// e.g., "borrower2.address.city" -> "borrower.address.city"
//
// IMPORTANT:
// - Borrower/Lender/Broker/Co-Borrower sections store dictionary keys as non-indexed (borrower.*, lender.*)
// - Property keys in the dictionary are primarily defined under property1.*
//   so we normalize propertyN.* -> property1.* for consistent lookup.
function getCanonicalKey(indexedKey: string): string {
  return indexedKey
    .replace(/^(borrower)\d+\./, '$1.')
    .replace(/^(coborrower)\d+\./, 'coborrower.')
    .replace(/^(co_borrower)\d+\./, 'co_borrower.')
    .replace(/^(lender)\d+\./, '$1.')
    .replace(/^(property)\d+\./, 'property1.')
    .replace(/^(broker)\d+\./, 'broker.');
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

// Extract typed value from JSONB structure
function extractTypedValueFromJsonb(fieldData: JsonbFieldValue, dataType: FieldDataType): string {
  switch (dataType) {
    case 'number':
    case 'currency':
    case 'percentage':
      return fieldData.value_number?.toString() || '';
    case 'date':
      return fieldData.value_date || '';
    case 'boolean':
      return fieldData.value_text || '';
    default:
      return fieldData.value_text || '';
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
    if (!dealId) {
      setLoading(false);
      return;
    }
    
    fetchData();
  }, [dealId, packetId]);

  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);

      // 1. Resolve fields - use packet fields if packet exists, otherwise all fields
      const resolved = packetId 
        ? await resolvePacketFields(packetId)
        : await resolveAllFields();

      // UI: Ensure all standard sections render as tabs when they exist in field_dictionary,
      // even if they are not mapped in TemplateFieldMap for the active packet.
      // NOTE: Required-field logic remains driven by TemplateFieldMap (resolved.requiredFieldKeys).
      const TMO_TAB_SECTIONS: FieldSection[] = [
        'borrower',
        'co_borrower',
        'property',
        'loan_terms',
        'lender',
        'broker',
        'charges',
        'dates',
        'escrow',
        'participants',
        'notes',
        'seller',
        'title',
        'other'
      ];

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

          // Use TMO_TAB_SECTIONS order for consistent tab display
          // Filter to sections that have fields in the merged set
          const mergedSections = TMO_TAB_SECTIONS.filter(
            (s) => (mergedFieldsBySection[s]?.length || 0) > 0
          );

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

      // 2. Fetch existing field values for this deal from deal_section_values
      if (mergedResolved.visibleFieldKeys.length > 0) {
        const { data: sectionValues, error: svError } = await supabase
          .from('deal_section_values')
          .select('section, field_values')
          .eq('deal_id', dealId);

        if (svError) throw svError;

        // Create lookup map from field_dictionary_id to field metadata
        const fieldDictIdToMeta = new Map<string, { field_key: string; data_type: FieldDataType }>();
        mergedResolved.fields.forEach(f => {
          fieldDictIdToMeta.set(f.field_dictionary_id, { field_key: f.field_key, data_type: f.data_type });
        });

        // Build values map - parse JSONB field_values keyed by field_dictionary_id
        // Use indexed_key if present to support multi-entity fields (lender1.*, borrower1.*, etc.)
        const valuesMap: Record<string, string> = {};
        ((sectionValues || []) as any[]).forEach((sv) => {
          const fieldValues = sv.field_values || {};
          Object.entries(fieldValues).forEach(([fieldDictId, fieldData]: [string, any]) => {
            const fieldMeta = fieldDictIdToMeta.get(fieldDictId);
            if (fieldMeta && fieldData) {
              const value = extractTypedValueFromJsonb(fieldData as JsonbFieldValue, fieldMeta.data_type);
              if (value) {
                // Use indexed_key if stored, otherwise fall back to canonical field_key
                const keyToUse = (fieldData as JsonbFieldValue).indexed_key || fieldMeta.field_key;
                valuesMap[keyToUse] = value;
              }
            }
          });
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

      // Group values by section and build JSONB structure
      if (fieldKeysToSave.length > 0) {
        // ---- Fallback dictionary lookup (ensures we can always persist even if packet-resolved fields are incomplete)
        const candidateKeys = new Set<string>();
        for (const fieldKey of fieldKeysToSave) {
          candidateKeys.add(fieldKey);
          candidateKeys.add(getCanonicalKey(fieldKey));
        }

        const keysMissingFromMap = [...candidateKeys].filter(k => !fieldIdMap[k]);
        const fallbackMetaByKey = new Map<string, { id: string; section: FieldSection; data_type: FieldDataType }>();

        if (keysMissingFromMap.length > 0) {
          const { data: fallbackRows, error: fbError } = await supabase
            .from('field_dictionary')
            .select('id, field_key, section, data_type')
            .in('field_key', keysMissingFromMap as any);

          if (fbError) throw fbError;

          (fallbackRows || []).forEach((r: any) => {
            if (r?.field_key && r?.id && r?.section && r?.data_type) {
              fallbackMetaByKey.set(r.field_key, {
                id: r.id,
                section: r.section,
                data_type: r.data_type,
              });
            }
          });
        }

        // Build section -> field_dictionary_id -> value object mapping
        const sectionUpdates: Record<string, Record<string, JsonbFieldValue>> = {};

        for (const fieldKey of fieldKeysToSave) {
          // Get canonical key for dictionary lookup (lender1.first_name -> lender.first_name)
          const canonicalKey = getCanonicalKey(fieldKey);

          const fallbackMeta = fallbackMetaByKey.get(canonicalKey) || fallbackMetaByKey.get(fieldKey);
          const fieldDictId = fieldIdMap[canonicalKey] || fieldIdMap[fieldKey] || fallbackMeta?.id;
          if (!fieldDictId) continue;

          // Prefer resolvedFields for section/type; fall back to dictionary lookup when not present
          const field = resolvedFields?.fields.find(
            f => f.field_key === canonicalKey || f.field_key === fieldKey
          );

          const section = field?.section || fallbackMeta?.section;
          if (!section) continue;

          if (!sectionUpdates[section]) {
            sectionUpdates[section] = {};
          }

          const dataType = (fieldDataTypes[canonicalKey] || fieldDataTypes[fieldKey] || fallbackMeta?.data_type || 'text') as FieldDataType;
          const stringValue = finalValues[fieldKey];

          // Build the JSONB field value object
          // Store indexed_key to preserve the full key (e.g., "lender1.first_name") for multi-entity support
          const fieldValueObj: JsonbFieldValue = {
            indexed_key: fieldKey !== canonicalKey ? fieldKey : undefined, // Only store if different from canonical
            value_text: null,
            value_number: null,
            value_date: null,
            value_json: null,
            updated_at: new Date().toISOString(),
            updated_by: user.id,
          };

          switch (dataType) {
            case 'number':
            case 'currency':
            case 'percentage': {
              const numValue = parseFloat(stringValue);
              fieldValueObj.value_number = isNaN(numValue) ? null : numValue;
              break;
            }
            case 'date':
              fieldValueObj.value_date = stringValue || null;
              break;
            case 'boolean':
              fieldValueObj.value_text = stringValue;
              break;
            default:
              fieldValueObj.value_text = stringValue;
          }

          sectionUpdates[section][fieldDictId] = fieldValueObj;
        }

        const sectionsToPersist = Object.entries(sectionUpdates).filter(([, v]) => Object.keys(v).length > 0);
        if (sectionsToPersist.length === 0) {
          throw new Error('Nothing to save (no matching field definitions found)');
        }

        // Persist each section: insert if missing, otherwise update
        for (const [section, newFieldValues] of sectionsToPersist) {
          const { data: existingSection, error: existingError } = await supabase
            .from('deal_section_values')
            .select('id, field_values, version')
            .eq('deal_id', dealId)
            .eq('section', section as FieldSection)
            .maybeSingle();

          if (existingError) throw existingError;

          // Merge new values with existing - cast through unknown for JSONB compatibility
          const existingFieldValues = (existingSection?.field_values as unknown as Record<string, JsonbFieldValue>) || {};
          const mergedFieldValues: Record<string, JsonbFieldValue> = {
            ...existingFieldValues,
            ...newFieldValues,
          };

          const newVersion = (existingSection?.version || 0) + 1;

          const payload = {
            deal_id: dealId,
            section: section as FieldSection,
            field_values: JSON.parse(JSON.stringify(mergedFieldValues)),
            updated_at: new Date().toISOString(),
            version: newVersion,
          };

          if (existingSection?.id) {
            const { error: updateError } = await supabase
              .from('deal_section_values')
              .update(payload)
              .eq('id', existingSection.id);

            if (updateError) throw updateError;
          } else {
            const { error: insertError } = await supabase
              .from('deal_section_values')
              .insert(payload);

            if (insertError) throw insertError;
          }
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
  }, [dealId, values, fieldDataTypes, fieldIdMap, resolvedFields, computeCalculatedFields, toast]);

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
