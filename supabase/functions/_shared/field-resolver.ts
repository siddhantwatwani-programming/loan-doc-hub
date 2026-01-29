/**
 * Field Resolution Utilities
 * 
 * Handles extracting raw values from deal field values,
 * case-insensitive field lookups, and merge tag mapping resolution.
 */

import type { 
  FieldValueData, 
  LabelMapping, 
  MergeTagAlias, 
  MergeTagMappings 
} from "./types.ts";

// In-memory cache for merge tag aliases with TTL
let cachedMergeTagMap: Record<string, string> | null = null;
let cachedLabelMap: Record<string, LabelMapping> | null = null;
let cacheTimestamp = 0;
const CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes

/**
 * Fetch merge tag aliases from database and build lookup maps
 */
export async function fetchMergeTagMappings(supabase: any): Promise<MergeTagMappings> {
  const now = Date.now();
  
  // Return cached values if still valid
  if (cachedMergeTagMap && cachedLabelMap && (now - cacheTimestamp) < CACHE_TTL_MS) {
    console.log("[field-resolver] Using cached merge tag mappings");
    return { mergeTagMap: cachedMergeTagMap, labelMap: cachedLabelMap };
  }
  
  console.log("[field-resolver] Fetching merge tag mappings from database");
  
  const { data: aliases, error } = await supabase
    .from("merge_tag_aliases")
    .select("tag_name, field_key, tag_type, replace_next, is_active")
    .eq("is_active", true);
  
  if (error) {
    console.error("[field-resolver] Failed to fetch merge tag aliases:", error);
    return { mergeTagMap: {}, labelMap: {} };
  }
  
  const mergeTagMap: Record<string, string> = {};
  const labelMap: Record<string, LabelMapping> = {};
  
  for (const alias of (aliases || []) as MergeTagAlias[]) {
    if (alias.tag_type === 'merge_tag' || alias.tag_type === 'f_code') {
      mergeTagMap[alias.tag_name] = alias.field_key;
    } else if (alias.tag_type === 'label') {
      labelMap[alias.tag_name] = {
        fieldKey: alias.field_key,
        replaceNext: alias.replace_next || undefined,
      };
    }
  }
  
  // Update cache
  cachedMergeTagMap = mergeTagMap;
  cachedLabelMap = labelMap;
  cacheTimestamp = now;
  
  console.log(`[field-resolver] Loaded ${Object.keys(mergeTagMap).length} merge tags and ${Object.keys(labelMap).length} labels from database`);
  
  return { mergeTagMap, labelMap };
}

/**
 * Resolve a tag name to its canonical field key using the mapping
 * Priority: 1. Explicit alias 2. Direct field_key match 3. Case-insensitive fallback
 */
export function resolveFieldKeyWithMap(
  tagName: string, 
  mergeTagMap: Record<string, string>,
  validFieldKeys?: Set<string>
): string {
  const cleanedTag = tagName.replace(/_+$/, "").trim();
  
  // Priority 1: Explicit alias mapping
  if (mergeTagMap[tagName]) return mergeTagMap[tagName];
  if (mergeTagMap[cleanedTag]) return mergeTagMap[cleanedTag];
  
  // Priority 2: Direct field_key match (if validFieldKeys provided)
  if (validFieldKeys) {
    if (validFieldKeys.has(tagName)) return tagName;
    if (validFieldKeys.has(cleanedTag)) return cleanedTag;
    
    // Case-insensitive check against field dictionary
    const lowerTag = tagName.toLowerCase();
    for (const key of validFieldKeys) {
      if (key.toLowerCase() === lowerTag) return key;
    }
    
    // Also try with underscores converted to dots
    const dotVersion = tagName.replace(/_/g, ".");
    if (validFieldKeys.has(dotVersion)) return dotVersion;
    for (const key of validFieldKeys) {
      if (key.toLowerCase() === dotVersion.toLowerCase()) return key;
    }
  }
  
  // Fallback: return as-is (might not match)
  return tagName;
}

/**
 * Case-insensitive field value lookup
 */
export function getFieldData(
  canonicalKey: string, 
  fieldValues: Map<string, FieldValueData>
): { key: string; data: FieldValueData } | null {
  const exact = fieldValues.get(canonicalKey);
  if (exact) return { key: canonicalKey, data: exact };

  const target = canonicalKey.toLowerCase();
  for (const [k, v] of fieldValues.entries()) {
    if (k.toLowerCase() === target) return { key: k, data: v };
  }
  return null;
}

/**
 * Extract raw value from JSONB structure based on data type
 */
export function extractRawValueFromJsonb(data: any, dataType: string): string | number | null {
  switch (dataType) {
    case "currency":
    case "number":
    case "percentage":
      return data.value_number;
    case "date":
      return data.value_date;
    case "text":
    case "boolean":
    default:
      return data.value_text;
  }
}

/**
 * Clear the merge tag cache (useful for testing or forced refresh)
 */
export function clearMergeTagCache(): void {
  cachedMergeTagMap = null;
  cachedLabelMap = null;
  cacheTimestamp = 0;
}
