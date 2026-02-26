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
  
  // Strip Word spell-check markers (proofErr) that fragment merge tags
  // These self-closing elements have no content value and break tag detection
  result = result.replace(/<w:proofErr[^/]*\/>/g, '');
  
  // Strip run property blocks (<w:rPr>...</w:rPr>) that sit between <w:r> and <w:t>.
  // These contain formatting metadata (fonts, sizes, bold, etc.) but no text content.
  // Removing them lets the simple run-boundary regex work for styled runs too.
  result = result.replace(/<w:rPr>[\s\S]*?<\/w:rPr>/g, '');
  
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
  
  // Handle split opening braces: {</w:t></w:r><w:r><w:t>{ -> {{
  const splitOpenBraces = /\{((?:<\/w:t><\/w:r><w:r[^>]*><w:t[^>]*>)+)\{/g;
  result = result.replace(splitOpenBraces, (match) => {
    console.log(`[tag-parser] Consolidated fragmented opening braces {{`);
    return '{{';
  });
  
  // Handle split closing braces: }</w:t></w:r><w:r><w:t>} -> }}
  const splitCloseBraces = /\}((?:<\/w:t><\/w:r><w:r[^>]*><w:t[^>]*>)+)\}/g;
  result = result.replace(splitCloseBraces, (match) => {
    console.log(`[tag-parser] Consolidated fragmented closing braces }}`);
    return '}}';
  });

  // Handle dots fragmented across runs: field</w:t></w:r><w:r><w:t>.name -> field.name
  const fragmentedDot = /([A-Za-z0-9_]+)((?:<\/w:t><\/w:r><w:r[^>]*><w:t[^>]*>)+)\.([A-Za-z0-9_]+)/g;
  result = result.replace(fragmentedDot, (match, before, xmlTags, after) => {
    console.log(`[tag-parser] Consolidated fragmented dot: ${before}.${after}`);
    return `${before}.${after}`;
  });

  // Handle fragmented curly brace patterns {{...}}
  // Word splits tags like {{field_key}} into {{</w:t></w:r><w:r>field_key</w:t></w:r>}}
  const curlyFragmentedPattern = /\{\{((?:<[^>]*>|\s)*?)([A-Za-z0-9_.]+)((?:<[^>]*>|\s)*?)\}\}/g;
  result = result.replace(curlyFragmentedPattern, (match, pre, fieldName, post) => {
    if (pre.includes("<") || post.includes("<")) {
      console.log(`[tag-parser] Found fragmented curly tag, consolidating: {{${fieldName}}}`);
    }
    return `{{${fieldName}}}`;
  });

  // Handle curly tags with inline transforms after consolidation: {{field|transform}}
  const curlyTransformFragmented = /\{\{((?:<[^>]*>|\s)*?)([A-Za-z0-9_.]+)((?:<[^>]*>|\s)*?)\|((?:<[^>]*>|\s)*?)([A-Za-z0-9_]+)((?:<[^>]*>|\s)*?)\}\}/g;
  result = result.replace(curlyTransformFragmented, (match, pre1, fieldName, mid1, mid2, transform, post) => {
    if (pre1.includes("<") || mid1.includes("<") || mid2.includes("<") || post.includes("<")) {
      console.log(`[tag-parser] Found fragmented curly tag with transform, consolidating: {{${fieldName}|${transform}}}`);
    }
    return `{{${fieldName}|${transform}}}`;
  });

  // Handle fragmented conditional block tags: {{#if ...}} and {{/if}}
  const ifFragmented = /\{\{((?:<[^>]*>|\s)*?)#if\s*((?:<[^>]*>|\s)*?)([A-Za-z0-9_.]+)((?:<[^>]*>|\s)*?)\}\}/g;
  result = result.replace(ifFragmented, (match, pre, mid, fieldName, post) => {
    if (pre.includes("<") || mid.includes("<") || post.includes("<")) {
      console.log(`[tag-parser] Consolidated fragmented {{#if ${fieldName}}}`);
    }
    return `{{#if ${fieldName}}}`;
  });

  const unlessFragmented = /\{\{((?:<[^>]*>|\s)*?)#unless\s*((?:<[^>]*>|\s)*?)([A-Za-z0-9_.]+)((?:<[^>]*>|\s)*?)\}\}/g;
  result = result.replace(unlessFragmented, (match, pre, mid, fieldName, post) => {
    if (pre.includes("<") || mid.includes("<") || post.includes("<")) {
      console.log(`[tag-parser] Consolidated fragmented {{#unless ${fieldName}}}`);
    }
    return `{{#unless ${fieldName}}}`;
  });

  const endIfFragmented = /\{\{((?:<[^>]*>|\s)*?)\/((?:<[^>]*>|\s)*?)if((?:<[^>]*>|\s)*?)\}\}/g;
  result = result.replace(endIfFragmented, (match, pre, mid, post) => {
    if (pre.includes("<") || mid.includes("<") || post.includes("<")) {
      console.log(`[tag-parser] Consolidated fragmented {{/if}}`);
    }
    return `{{/if}}`;
  });

  const endUnlessFragmented = /\{\{((?:<[^>]*>|\s)*?)\/((?:<[^>]*>|\s)*?)unless((?:<[^>]*>|\s)*?)\}\}/g;
  result = result.replace(endUnlessFragmented, (match, pre, mid, post) => {
    if (pre.includes("<") || mid.includes("<") || post.includes("<")) {
      console.log(`[tag-parser] Consolidated fragmented {{/unless}}`);
    }
    return `{{/unless}}`;
  });
  
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
  labelMap: Record<string, LabelMapping>,
  replacedFieldKeys?: Set<string>
): { content: string; replacementCount: number } {
  let result = content;
  let replacementCount = 0;
  
  for (const [label, mapping] of Object.entries(labelMap)) {
    // Skip labels for fields that were already replaced by merge tags
    const fieldKeyLower = mapping.fieldKey.toLowerCase();
    const alreadyReplaced = replacedFieldKeys && [...replacedFieldKeys].some(k => k.toLowerCase() === fieldKeyLower);
    if (alreadyReplaced) {
      console.log(`[tag-parser] Label "${label}" -> skipped (field ${mapping.fieldKey} already replaced by merge tag)`);
      continue;
    }
    
    const fieldData = fieldValues.get(mapping.fieldKey);
    if (!fieldData || fieldData.rawValue === null) {
      // If mapped field is empty, leave the document field blank
      if (mapping.replaceNext) {
        const textToReplace = mapping.replaceNext;
        const escapedText = textToReplace.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
        // Use word boundaries to prevent partial word matches (e.g., "Date" matching "Dated")
        // Also skip if the match is immediately followed by a merge tag {{...}}
        const replaceNextPattern = new RegExp(`\\b${escapedText}\\b`, "gi");
        if (replaceNextPattern.test(result)) {
          result = result.replace(new RegExp(`\\b${escapedText}\\b`, "gi"), (match, offset) => {
            // Check if this occurrence is followed by a merge tag or by resolved text content
            // (merge tags may already be replaced at this point, leaving the value inline)
            const after = result.substring(offset + match.length, offset + match.length + 200);
            if (/^\s*(?:<[^>]*>\s*)*\{\{/.test(after)) {
              console.log(`[tag-parser] Label "${label}" -> skipped blanking (adjacent to merge tag)`);
              return match; // Keep static title
            }
            // Also skip if followed by non-whitespace text content (already-resolved merge tag value)
            // Extract first text content after any XML tags
            const textAfter = after.replace(/<[^>]*>/g, '').trim();
            if (textAfter.length > 0) {
              console.log(`[tag-parser] Label "${label}" -> skipped blanking (followed by text content "${textAfter.substring(0, 30)}")`);
              return match; // Keep static title
            }
            return "";
          });
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
      // Use word boundaries to prevent partial word matches
      // Also skip if the match is immediately followed by a merge tag {{...}}
      const replaceNextPattern = new RegExp(`\\b${escapedText}\\b`, 'gi');
      
      if (replaceNextPattern.test(result)) {
        result = result.replace(new RegExp(`\\b${escapedText}\\b`, 'gi'), (match, offset) => {
          const after = result.substring(offset + match.length, offset + match.length + 200);
          if (/^\s*(?:<[^>]*>\s*)*\{\{/.test(after)) {
            console.log(`[tag-parser] Label "${label}" -> skipped (adjacent to merge tag)`);
            return match; // Keep static title
          }
          // If the word is followed by a colon (e.g., "Date:"), keep the label and
          // insert the value after the colon instead of replacing the label word
          const immediateAfter = after.replace(/<[^>]*>/g, '').trimStart();
          if (immediateAfter.startsWith(':')) {
            console.log(`[tag-parser] Label "${label}" -> colon-detected, will insert value after colon`);
            // Don't replace the word itself; instead do a secondary replacement
            // on the full "Label: ___" or "Label:" pattern to append the value
            const fullPattern = new RegExp(
              `(\\b${escapedText}\\b(?:\\s|<[^>]*>)*:\\s*)(_+|\\s*)`,
              'gi'
            );
            result = result.replace(fullPattern, `$1${formattedValue} `);
            return match; // Keep the label word as-is in this pass
          }
          return formattedValue;
        });
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
 * Evaluate whether a conditional field value is truthy.
 * Checks: non-null, non-empty string, boolean true, non-zero number.
 * Also supports checking if any field with a given prefix has data (entity existence).
 */
function isConditionTruthy(
  fieldKey: string,
  fieldValues: Map<string, FieldValueData>,
  mergeTagMap: Record<string, string>,
  validFieldKeys?: Set<string>
): boolean {
  const canonicalKey = resolveFieldKeyWithMap(fieldKey, mergeTagMap, validFieldKeys);
  const resolved = getFieldData(canonicalKey, fieldValues);

  if (resolved?.data) {
    const raw = resolved.data.rawValue;
    if (raw === null || raw === "") return false;
    if (typeof raw === "string") {
      return !["false", "0", "no", "n"].includes(raw.toLowerCase());
    }
    if (typeof raw === "number") return raw !== 0;
    return Boolean(raw);
  }

  // Entity-existence check: if fieldKey looks like a prefix (e.g., "co_borrower1"),
  // check if ANY field starting with that prefix has data
  const prefixLower = canonicalKey.toLowerCase();
  for (const [k, v] of fieldValues.entries()) {
    if (k.toLowerCase().startsWith(prefixLower + ".") || k.toLowerCase().startsWith(prefixLower + "_")) {
      if (v.rawValue !== null && v.rawValue !== "") return true;
    }
  }

  return false;
}

/**
 * Process conditional blocks: {{#if field_key}}...{{/if}} and {{#unless field_key}}...{{/unless}}
 * 
 * Removes entire XML paragraphs (<w:p>...</w:p>) when conditions are false,
 * ensuring no blank gaps remain. Supports nesting via iterative innermost-first processing.
 */
export function processConditionalBlocks(
  content: string,
  fieldValues: Map<string, FieldValueData>,
  mergeTagMap: Record<string, string>,
  validFieldKeys?: Set<string>
): string {
  let result = content;
  let iterations = 0;
  const MAX_ITERATIONS = 20;

  while (iterations < MAX_ITERATIONS) {
    const ifPattern = /\{\{#if\s+([A-Za-z0-9_.]+)\}\}([\s\S]*?)\{\{\/if\}\}/;
    const unlessPattern = /\{\{#unless\s+([A-Za-z0-9_.]+)\}\}([\s\S]*?)\{\{\/unless\}\}/;

    const ifMatch = ifPattern.exec(result);
    const unlessMatch = unlessPattern.exec(result);

    if (!ifMatch && !unlessMatch) break;

    if (ifMatch && (!unlessMatch || ifMatch.index < unlessMatch.index)) {
      const fieldKey = ifMatch[1];
      const blockContent = ifMatch[2];
      const truthy = isConditionTruthy(fieldKey, fieldValues, mergeTagMap, validFieldKeys);
      console.log(`[tag-parser] Conditional {{#if ${fieldKey}}} = ${truthy}`);

      if (truthy) {
        // Keep inner content, remove tag markers
        result = result.substring(0, ifMatch.index) + blockContent + result.substring(ifMatch.index + ifMatch[0].length);
      } else {
        // Remove block and clean up surrounding empty paragraphs
        result = removeConditionalBlock(result, ifMatch.index, ifMatch[0].length);
      }
    } else if (unlessMatch) {
      const fieldKey = unlessMatch[1];
      const blockContent = unlessMatch[2];
      const truthy = isConditionTruthy(fieldKey, fieldValues, mergeTagMap, validFieldKeys);
      console.log(`[tag-parser] Conditional {{#unless ${fieldKey}}} = ${!truthy} (inverted)`);

      if (!truthy) {
        result = result.substring(0, unlessMatch.index) + blockContent + result.substring(unlessMatch.index + unlessMatch[0].length);
      } else {
        result = removeConditionalBlock(result, unlessMatch.index, unlessMatch[0].length);
      }
    }

    iterations++;
  }

  if (iterations >= MAX_ITERATIONS) {
    console.warn("[tag-parser] Hit max iterations for conditional processing — possible malformed tags");
  }

  return result;
}

/**
 * Remove a conditional block and clean up empty XML paragraphs.
 * 
 * When a block spans multiple paragraphs, removing its content may leave
 * empty <w:p> elements. This function removes those to prevent blank gaps.
 */
function removeConditionalBlock(content: string, startIndex: number, matchLength: number): string {
  // First, expand the removal range to include the containing paragraph(s)
  // if those paragraphs contain ONLY the conditional tag content
  
  let removeStart = startIndex;
  let removeEnd = startIndex + matchLength;

  // Check if the opening tag sits in a paragraph by itself
  // Look backwards for <w:p or <w:p ... to find paragraph start
  const beforeMatch = content.substring(Math.max(0, startIndex - 500), startIndex);
  const pOpenMatch = beforeMatch.match(/.*(<w:p\b[^>]*>(?:\s*<w:pPr>[\s\S]*?<\/w:pPr>)?(?:\s*<w:r\b[^>]*>(?:\s*<w:rPr>[\s\S]*?<\/w:rPr>)?\s*<w:t[^>]*>)?\s*)$/);
  
  if (pOpenMatch) {
    // Check if the text before the tag in this paragraph is only XML structure (no actual text)
    const preamble = pOpenMatch[1];
    const textBefore = preamble.replace(/<[^>]*>/g, '').trim();
    if (textBefore === '') {
      removeStart = startIndex - pOpenMatch[1].length;
    }
  }

  // Check if closing tag ends at a paragraph boundary
  const afterMatch = content.substring(removeEnd, removeEnd + 500);
  const pCloseMatch = afterMatch.match(/^(\s*(?:<\/w:t>\s*<\/w:r>)?\s*<\/w:p>)/);
  if (pCloseMatch) {
    removeEnd = removeEnd + pCloseMatch[1].length;
  }

  let result = content.substring(0, removeStart) + content.substring(removeEnd);

  // Clean up any remaining empty paragraphs
  result = result.replace(/<w:p\b[^>]*>(?:\s*<w:pPr>[\s\S]*?<\/w:pPr>)?\s*<\/w:p>/g, '');

  return result;
}

/**
 * Process native Word SDT (Structured Document Tag) checkboxes.
 * Finds <w:sdt> blocks containing <w14:checkbox>, reads the <w:tag> value,
 * resolves it to a field key, and toggles the checked state + display glyph.
 */
export function processSdtCheckboxes(
  content: string,
  fieldValues: Map<string, FieldValueData>,
  mergeTagMap: Record<string, string>,
  validFieldKeys?: Set<string>
): string {
  // Match entire <w:sdt>…</w:sdt> blocks that contain a w14:checkbox element
  const sdtPattern = /<w:sdt\b[\s\S]*?<\/w:sdt>/g;

  return content.replace(sdtPattern, (sdtBlock) => {
    // Only process SDTs that are checkboxes
    if (!/<w14:checkbox\b/.test(sdtBlock)) return sdtBlock;

    // Extract the tag value (the mapping key)
    const tagMatch = /<w:tag\s+w:val="([^"]+)"/i.exec(sdtBlock);
    if (!tagMatch) {
      console.log("[tag-parser] SDT checkbox found but no <w:tag> — skipping");
      return sdtBlock;
    }

    const tagName = tagMatch[1];
    const canonicalKey = resolveFieldKeyWithMap(tagName, mergeTagMap, validFieldKeys);
    const resolved = getFieldData(canonicalKey, fieldValues);

    // Determine boolean state
    let isChecked = false;
    if (resolved?.data) {
      const raw = resolved.data.rawValue;
      if (typeof raw === "string") {
        isChecked = ["true", "1", "yes"].includes(raw.toLowerCase());
      } else if (typeof raw === "number") {
        isChecked = raw !== 0;
      } else {
        isChecked = Boolean(raw);
      }
    }

    const checkedVal = isChecked ? "1" : "0";
    const displayChar = isChecked ? "\u2612" : "\u2610"; // ☒ or ☐

    console.log(`[tag-parser] SDT checkbox "${tagName}" -> ${canonicalKey} = ${isChecked} (${displayChar})`);

    // 1. Toggle <w14:checked w14:val="..."/>
    let result = sdtBlock.replace(
      /(<w14:checked\s+w14:val=")([^"]*)("\s*\/>)/,
      `$1${checkedVal}$3`
    );

    // 2. Replace the display character inside <w:sdtContent>
    result = result.replace(
      /(<w:sdtContent\b[\s\S]*?<w:t(?:\s[^>]*)?>)([\s\S]*?)(<\/w:t>)/,
      `$1${displayChar}$3`
    );

    return result;
  });
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

  // Process conditional blocks ({{#if}}/{{/if}}) before any tag replacement
  result = processConditionalBlocks(result, fieldValues, mergeTagMap, validFieldKeys);

  // Process native Word SDT checkboxes before text-based merge tags
  result = processSdtCheckboxes(result, fieldValues, mergeTagMap, validFieldKeys);
  
  // Parse and replace merge tags
  const tags = parseWordMergeFields(result);
  
  // Track which field keys were successfully replaced by merge tags
  // so label-based replacement can skip them (prevents label aliases from
  // damaging static document titles like "Loan No", "Current Lender", etc.)
  const replacedFieldKeys = new Set<string>();
  
  for (const tag of tags) {
    // Use validFieldKeys for direct field_key resolution
    const canonicalKey = resolveFieldKeyWithMap(tag.tagName, mergeTagMap, validFieldKeys);
    const resolved = getFieldData(canonicalKey, fieldValues);
    const fieldData = resolved?.data;
    let resolvedValue = "";
    
    // Always track merge tag fields so labels don't overwrite static titles
    replacedFieldKeys.add(canonicalKey);
    if (resolved?.key && resolved.key !== canonicalKey) {
      replacedFieldKeys.add(resolved.key);
    }
    
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
  console.log(`[tag-parser] Running label-based replacement (${tags.length} merge tags were processed, ${replacedFieldKeys.size} fields already resolved)`);
  const labelResult = replaceLabelBasedFields(result, fieldValues, fieldTransforms, labelMap, replacedFieldKeys);
  result = labelResult.content;
  console.log(`[tag-parser] Label-based replacement completed: ${labelResult.replacementCount} replacements`);
  
  return result;
}
