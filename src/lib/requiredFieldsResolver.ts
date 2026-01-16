import { supabase } from '@/integrations/supabase/client';
import type { Database } from '@/integrations/supabase/types';

type FieldSection = Database['public']['Enums']['field_section'];
type FieldDataType = Database['public']['Enums']['field_data_type'];

export interface ResolvedField {
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

export interface ResolvedFieldSet {
  /** All unique field keys visible for this packet (required + optional) */
  visibleFieldKeys: string[];
  /** Field keys that are required (ANY template requires them) */
  requiredFieldKeys: string[];
  /** Full field definitions with metadata */
  fields: ResolvedField[];
  /** Fields grouped by section */
  fieldsBySection: Record<FieldSection, ResolvedField[]>;
  /** Sections that have fields, in display order */
  sections: FieldSection[];
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

/**
 * Deterministic resolver that computes the required field set for a deal
 * based on the selected packet.
 * 
 * Logic:
 * 1. Load all templates in the packet (via PacketTemplate → Template)
 * 2. Load all TemplateFieldMap rows for those templates
 * 3. Deduplicate by fieldKey
 * 4. Mark a field as required = true if ANY TemplateFieldMap.requiredFlag is true
 * 
 * @param packetId - The packet ID to resolve fields for
 * @returns ResolvedFieldSet with visible and required field keys
 */
export async function resolvePacketFields(packetId: string): Promise<ResolvedFieldSet> {
  // 1. Load all templates in the packet
  const { data: packetTemplates, error: ptError } = await supabase
    .from('packet_templates')
    .select('template_id')
    .eq('packet_id', packetId);

  if (ptError) throw ptError;

  const templateIds = (packetTemplates || []).map(pt => pt.template_id);

  if (templateIds.length === 0) {
    return {
      visibleFieldKeys: [],
      requiredFieldKeys: [],
      fields: [],
      fieldsBySection: {} as Record<FieldSection, ResolvedField[]>,
      sections: [],
    };
  }

  // 2. Load all TemplateFieldMap rows for those templates
  const { data: fieldMaps, error: fmError } = await supabase
    .from('template_field_maps')
    .select('field_key, required_flag, transform_rule')
    .in('template_id', templateIds);

  if (fmError) throw fmError;

  // 3. Deduplicate and aggregate
  // - requiredFieldKeys: field is required if ANY template requires it
  // - visibleFieldKeys: all unique field keys
  // - transformRulesMap: collect all transform rules per field
  const requiredSet = new Set<string>();
  const transformRulesMap: Record<string, string[]> = {};

  (fieldMaps || []).forEach(fm => {
    // Mark as required if ANY template requires this field
    if (fm.required_flag) {
      requiredSet.add(fm.field_key);
    }
    
    // Collect transform rules (deduplicated per field)
    if (fm.transform_rule) {
      if (!transformRulesMap[fm.field_key]) {
        transformRulesMap[fm.field_key] = [];
      }
      if (!transformRulesMap[fm.field_key].includes(fm.transform_rule)) {
        transformRulesMap[fm.field_key].push(fm.transform_rule);
      }
    }
  });

  // Get unique visible field keys
  const visibleFieldKeys = [...new Set((fieldMaps || []).map(fm => fm.field_key))];
  const requiredFieldKeys = [...requiredSet];

  if (visibleFieldKeys.length === 0) {
    return {
      visibleFieldKeys: [],
      requiredFieldKeys: [],
      fields: [],
      fieldsBySection: {} as Record<FieldSection, ResolvedField[]>,
      sections: [],
    };
  }

  // 4. Load field definitions from dictionary
  const { data: fieldDefs, error: fdError } = await supabase
    .from('field_dictionary')
    .select('*')
    .in('field_key', visibleFieldKeys);

  if (fdError) throw fdError;

  // Build resolved fields
  const fields: ResolvedField[] = (fieldDefs || []).map(fd => ({
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

  // Sort by section order, then by label
  fields.sort((a, b) => {
    const sectionOrderA = SECTION_ORDER.indexOf(a.section);
    const sectionOrderB = SECTION_ORDER.indexOf(b.section);
    if (sectionOrderA !== sectionOrderB) return sectionOrderA - sectionOrderB;
    return a.label.localeCompare(b.label);
  });

  // Group by section
  const fieldsBySection = fields.reduce((acc, field) => {
    if (!acc[field.section]) {
      acc[field.section] = [];
    }
    acc[field.section].push(field);
    return acc;
  }, {} as Record<FieldSection, ResolvedField[]>);

  // Get sections in order that have fields
  const sections = SECTION_ORDER.filter(section => 
    fieldsBySection[section] && fieldsBySection[section].length > 0
  );

  return {
    visibleFieldKeys,
    requiredFieldKeys,
    fields,
    fieldsBySection,
    sections,
  };
}

/**
 * Check if a specific field is required for a packet
 */
export function isFieldRequired(resolvedFields: ResolvedFieldSet, fieldKey: string): boolean {
  return resolvedFields.requiredFieldKeys.includes(fieldKey);
}

/**
 * Check if a specific field is visible for a packet
 */
export function isFieldVisible(resolvedFields: ResolvedFieldSet, fieldKey: string): boolean {
  return resolvedFields.visibleFieldKeys.includes(fieldKey);
}

/**
 * Get all required fields that are missing values
 */
export function getMissingRequiredFields(
  resolvedFields: ResolvedFieldSet,
  values: Record<string, string>,
  section?: FieldSection
): ResolvedField[] {
  return resolvedFields.fields.filter(field => {
    if (section && field.section !== section) return false;
    if (!field.is_required) return false;
    const value = values[field.field_key];
    return !value || value.trim() === '';
  });
}

/**
 * Check if all required fields in a section have values
 */
export function isSectionComplete(
  resolvedFields: ResolvedFieldSet,
  values: Record<string, string>,
  section: FieldSection
): boolean {
  return getMissingRequiredFields(resolvedFields, values, section).length === 0;
}

/**
 * Check if all required fields have values
 */
export function isPacketComplete(
  resolvedFields: ResolvedFieldSet,
  values: Record<string, string>
): boolean {
  return getMissingRequiredFields(resolvedFields, values).length === 0;
}
