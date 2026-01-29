/**
 * Merge Tag Parsing Utilities
 * 
 * Handles detection and parsing of merge tags from DOCX XML content,
 * including Word merge fields, curly brace placeholders, and label-based patterns.
 */

import type { ParsedMergeTag, FieldValueData, LabelMapping } from "./types.ts";
import { applyTransform, formatByDataType } from "./formatting.ts";
import { resolveFieldKeyWithMap, getFieldData } from "./field-resolver.ts";

/**
 * Normalize Word XML by consolidating fragmented text runs.
 * Word often splits text across multiple <w:t> elements.
 */
export function normalizeWordXml(xmlContent: string): string {
  let result = xmlContent;
  
  // Handle fragmented merge fields
  const fragmentedPattern = /«((?:<[^>]*>|\s)*?)([A-Za-z0-9_]+)((?:<[^>]*>|\s)*?)»/g;
  result = result.replace(fragmentedPattern, (match, pre, fieldName, post) => {
    if (pre.includes("<") || post.includes("<")) {
      console.log(`[tag-parser] Found fragmented merge field: ${fieldName}`);
    }
    return `«${fieldName}»`;
  });
  
  // Handle XML-fragmented chevron patterns
  const leftChevronFragmented = /«((?:<\/w:t><\/w:r><w:r(?:[^>]*)><w:t(?:[^>]*)>)+)/g;
  result = result.replace(leftChevronFragmented, () => "«");
  
  const rightChevronFragmented = /((?:<\/w:t><\/w:r><w:r(?:[^>]*)><w:t(?:[^>]*)>)+)»/g;
  result = result.replace(rightChevronFragmented, () => "»");
  
  // Handle underscores that get their own text runs
  const fragmentedUnderscore = /([A-Za-z0-9]+)(<\/w:t><\/w:r><w:r(?:[^>]*)><w:t(?:[^>]*)>)_(<\/w:t><\/w:r><w:r(?:[^>]*)><w:t(?:[^>]*)>)?([A-Za-z0-9]+)/g;
  result = result.replace(fragmentedUnderscore, "$1_$4");
  
  return result;
}

/**
 * Parse Word merge fields from XML content
 * Supports: «field_name», {{field_name}}, {{field_name|transform}}, MERGEFIELD instructions
 */
export function parseWordMergeFields(content: string): ParsedMergeTag[] {
  const tags: ParsedMergeTag[] = [];
  const seenTags = new Set<string>();
  
  // Pattern 1: Unicode chevrons «field_name»
  const unicodePattern = /«([^»]+)»/g;
  let match;
  while ((match = unicodePattern.exec(content)) !== null) {
    const tagName = match[1].trim();
    if (!seenTags.has(match[0])) {
      seenTags.add(match[0]);
      tags.push({
        fullMatch: match[0],
        tagName: tagName,
        inlineTransform: null,
      });
    }
  }
  
  // Pattern 2: Double curly braces {{field_name}} or {{field_name|transform}}
  const curlyPattern = /\{\{([^}|]+)(?:\s*\|\s*([^}]+))?\}\}/g;
  while ((match = curlyPattern.exec(content)) !== null) {
    if (!seenTags.has(match[0])) {
      seenTags.add(match[0]);
      tags.push({
        fullMatch: match[0],
        tagName: match[1].trim(),
        inlineTransform: match[2]?.trim() || null,
      });
    }
  }
  
  // Pattern 3: Word MERGEFIELD in instrText
  const mergeFieldPattern = /MERGEFIELD\s+([A-Za-z0-9_]+)/gi;
  while ((match = mergeFieldPattern.exec(content)) !== null) {
    const fieldName = match[1].trim();
    const syntheticTag = `«${fieldName}»`;
    if (!seenTags.has(syntheticTag)) {
      seenTags.add(syntheticTag);
      tags.push({
        fullMatch: syntheticTag,
        tagName: fieldName,
        inlineTransform: null,
      });
    }
  }
  
  console.log(`[tag-parser] Found ${tags.length} merge tags: ${tags.map(t => t.tagName).join(", ")}`);
  
  return tags;
}

/**
 * Perform label-based replacement for templates without explicit merge tags.
 */
export function replaceLabelBasedFields(
  content: string,
  fieldValues: Map<string, FieldValueData>,
  fieldTransforms: Map<string, string>,
  labelMap: Record<string, LabelMapping>
): { content: string; replacementCount: number } {
  let result = content;
  let replacementCount = 0;
  
  for (const [label, mapping] of Object.entries(labelMap)) {
    const fieldData = fieldValues.get(mapping.fieldKey);
    if (!fieldData || fieldData.rawValue === null) {
      // If mapped field is empty, leave the document field blank
      if (mapping.replaceNext) {
        const textToReplace = mapping.replaceNext;
        const escapedText = textToReplace.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
        const replaceNextPattern = new RegExp(escapedText, "gi");
        if (replaceNextPattern.test(result)) {
          result = result.replace(replaceNextPattern, "");
          replacementCount++;
          console.log(`[tag-parser] Label "${label}" -> No data; blanked "${textToReplace}"`);
        }
      } else if (label === "as of _") {
        const asOfPattern = /as of\s*_+/gi;
        if (asOfPattern.test(result)) {
          result = result.replace(asOfPattern, "as of ");
          replacementCount++;
          console.log(`[tag-parser] Label "${label}" -> No data; blanked "as of ___"`);
        }
      } else {
        console.log(`[tag-parser] Label "${label}" -> No data for ${mapping.fieldKey}`);
      }
      continue;
    }
    
    const transform = fieldTransforms.get(mapping.fieldKey);
    let formattedValue: string;
    if (transform) {
      formattedValue = applyTransform(fieldData.rawValue, transform);
    } else {
      formattedValue = formatByDataType(fieldData.rawValue, fieldData.dataType);
    }
    
    // Handle special case for execution date with underscores
    if (label === "as of _") {
      const asOfPattern = /as of\s*_+/gi;
      if (asOfPattern.test(result)) {
        result = result.replace(asOfPattern, `as of ${formattedValue}`);
        replacementCount++;
        console.log(`[tag-parser] Label-replaced "as of ___" -> "${formattedValue}"`);
      }
      continue;
    }
    
    // Handle replaceNext pattern
    if (mapping.replaceNext) {
      const textToReplace = mapping.replaceNext;
      const escapedText = textToReplace.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      const replaceNextPattern = new RegExp(escapedText, 'gi');
      
      if (replaceNextPattern.test(result)) {
        result = result.replace(replaceNextPattern, formattedValue);
        replacementCount++;
        console.log(`[tag-parser] Label-replaced "${textToReplace}" -> "${formattedValue}"`);
      }
      continue;
    }
    
    // Find the label in the XML content
    const labelEscaped = label.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const labelPattern = new RegExp(`(${labelEscaped})(\\s*)`, 'gi');
    
    if (labelPattern.test(result)) {
      result = result.replace(labelPattern, `$1$2${formattedValue} `);
      replacementCount++;
      console.log(`[tag-parser] Label-replaced "${label}" -> "${formattedValue}"`);
    } else if (label.endsWith(':')) {
      // Colon-tolerant match
      const labelNoColon = label.slice(0, -1);
      const labelNoColonEscaped = labelNoColon.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      const colonTolerantPattern = new RegExp(`(${labelNoColonEscaped})(?:\\s|<[^>]+>)*:`, 'gi');

      if (colonTolerantPattern.test(result)) {
        result = result.replace(colonTolerantPattern, `$&${formattedValue} `);
        replacementCount++;
        console.log(`[tag-parser] Label-replaced (colon-tolerant) "${label}" -> "${formattedValue}"`);
      }
    }
  }
  
  return { content: result, replacementCount };
}

/**
 * Main function to replace all merge tags in content
 * @param validFieldKeys - Set of valid field keys from field_dictionary for direct matching
 */
export function replaceMergeTags(
  content: string,
  fieldValues: Map<string, FieldValueData>,
  fieldTransforms: Map<string, string>,
  mergeTagMap: Record<string, string>,
  labelMap: Record<string, LabelMapping>,
  validFieldKeys?: Set<string>
): string {
  // First normalize the XML to handle fragmented merge fields
  let result = normalizeWordXml(content);
  
  // Parse and replace merge tags
  const tags = parseWordMergeFields(result);
  
  for (const tag of tags) {
    // Use validFieldKeys for direct field_key resolution
    const canonicalKey = resolveFieldKeyWithMap(tag.tagName, mergeTagMap, validFieldKeys);
    const resolved = getFieldData(canonicalKey, fieldValues);
    const fieldData = resolved?.data;
    let resolvedValue = "";
    
    if (fieldData) {
      const transformKey = resolved?.key || canonicalKey;
      const transform = tag.inlineTransform || fieldTransforms.get(transformKey);
      
      if (transform) {
        resolvedValue = applyTransform(fieldData.rawValue, transform);
      } else {
        resolvedValue = formatByDataType(fieldData.rawValue, fieldData.dataType);
      }
      console.log(`[tag-parser] Replacing ${tag.tagName} -> ${transformKey} = "${resolvedValue}"`);
    } else {
      console.log(`[tag-parser] No data for ${tag.tagName} (canonical: ${canonicalKey})`);
    }
    
    result = result.split(tag.fullMatch).join(resolvedValue);
  }
  
  // Always run label-based replacement after merge tag replacement
  console.log(`[tag-parser] Running label-based replacement (${tags.length} merge tags were processed)`);
  const labelResult = replaceLabelBasedFields(result, fieldValues, fieldTransforms, labelMap);
  result = labelResult.content;
  console.log(`[tag-parser] Label-based replacement completed: ${labelResult.replacementCount} replacements`);
  
  return result;
}
