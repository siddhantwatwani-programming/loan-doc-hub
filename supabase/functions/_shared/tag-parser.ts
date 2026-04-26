/**
 * Merge Tag Parsing Utilities
 * 
 * Handles detection and parsing of merge tags from DOCX XML content,
 * including Word merge fields, curly brace placeholders, and label-based patterns.
 */

import type { ParsedMergeTag, FieldValueData, LabelMapping } from "./types.ts";
import { applyTransform, formatByDataType, formatCheckbox } from "./formatting.ts";
import { resolveFieldKeyWithMap, getFieldData } from "./field-resolver.ts";

const DOC_GEN_DEBUG = Deno.env.get("DOC_GEN_DEBUG") === "true";
const debugLog = (...args: unknown[]) => {
  if (DOC_GEN_DEBUG) {
    console.log(...args);
  }
};

/**
 * Flatten Word MERGEFIELD structures into plain «fieldName» text runs.
 * 
 * Word templates using Mail Merge store fields as complex XML structures:
 *   Pattern A (complex fields): <w:fldChar begin/> + <w:instrText> + <w:fldChar separate/> + display run + <w:fldChar end/>
 *   Pattern B (simple fields): <w:fldSimple w:instr="MERGEFIELD ...">inner runs</w:fldSimple>
 * 
 * This function converts both patterns into a single <w:r> with «fieldName» text,
 * preserving the display run's formatting (<w:rPr>).
 */
function flattenMergeFieldStructures(xml: string): string {
  // Process paragraph-by-paragraph to avoid catastrophic regex backtracking
  // on large documents (628KB+). MERGEFIELD structures are always within a single <w:p>.
  let totalComplexCount = 0;
  let totalSimpleCount = 0;
  let totalNoSeparateCount = 0;
  let totalInstrFallbackCount = 0;
  let totalOrphanedFldCharCount = 0;

  const result = processParaByPara(xml, (para) => {
    // Quick skip: only process paragraphs that contain fldChar or fldSimple
    if (!para.includes('w:fldChar') && !para.includes('w:fldSimple') && !para.includes('w:instrText')) {
      return para;
    }

    let p = para;

    // Pattern A: Complex MERGEFIELD structures spanning multiple <w:r> elements.
    const complexFieldPattern = /<w:r\b[^>]*>\s*(?:<w:rPr>[\s\S]*?<\/w:rPr>\s*)?<w:fldChar\s+[^>]*?w:fldCharType="begin"[^>]*(?:\/>|><\/w:fldChar>)\s*<\/w:r>([\s\S]*?)<w:r\b[^>]*>\s*(?:<w:rPr>[\s\S]*?<\/w:rPr>\s*)?<w:fldChar\s+[^>]*?w:fldCharType="separate"[^>]*(?:\/>|><\/w:fldChar>)\s*<\/w:r>([\s\S]*?)<w:r\b[^>]*>\s*(?:<w:rPr>[\s\S]*?<\/w:rPr>\s*)?<w:fldChar\s+[^>]*?w:fldCharType="end"[^>]*(?:\/>|><\/w:fldChar>)\s*<\/w:r>/g;

    p = p.replace(complexFieldPattern, (fullMatch, instrSection, displaySection) => {
      const instrMatch = instrSection.match(/MERGEFIELD\s+"?([A-Za-z0-9_.]+)"?/i);
      let fieldName: string | null = null;
      let useCurlySyntax = false;

      if (instrMatch) {
        fieldName = instrMatch[1];
      } else {
        const instrText = instrSection.match(/<w:instrText[^>]*>([\s\S]*?)<\/w:instrText>/i);
        if (instrText) {
          const curlyMatch = instrText[1].match(/\{\{([A-Za-z0-9_.]+)\}\}/);
          if (curlyMatch) {
            fieldName = curlyMatch[1];
            useCurlySyntax = true;
          } else {
            const bareMatch = instrText[1].trim().match(/^([A-Za-z][A-Za-z0-9_.]+)$/);
            if (bareMatch) {
              fieldName = bareMatch[1];
            }
          }
        }
      }

      if (!fieldName) return fullMatch;

      const rPrMatch = displaySection.match(/<w:rPr>([\s\S]*?)<\/w:rPr>/);
      const rPr = rPrMatch ? `<w:rPr>${rPrMatch[1]}</w:rPr>` : '';

      totalComplexCount++;
      const tagText = useCurlySyntax ? `{{${fieldName}}}` : `\u00AB${fieldName}\u00BB`;
      return `<w:r>${rPr}<w:t>${tagText}</w:t></w:r>`;
    });

    // Pattern C: Field codes WITHOUT a `separate` marker: begin → instrText → end.
    const noSeparatePattern = /<w:r\b[^>]*>\s*(?:<w:rPr>([\s\S]*?)<\/w:rPr>\s*)?<w:fldChar\s+[^>]*?w:fldCharType="begin"[^>]*(?:\/>|><\/w:fldChar>)\s*<\/w:r>([\s\S]*?)<w:r\b[^>]*>\s*(?:<w:rPr>[\s\S]*?<\/w:rPr>\s*)?<w:fldChar\s+[^>]*?w:fldCharType="end"[^>]*(?:\/>|><\/w:fldChar>)\s*<\/w:r>/g;

    p = p.replace(noSeparatePattern, (fullMatch, beginRPr, middleSection) => {
      if (/w:fldCharType="separate"/.test(middleSection)) return fullMatch;

      const allInstrText = (middleSection.match(/<w:instrText[^>]*>([\s\S]*?)<\/w:instrText>/g) || [])
        .map((m: string) => m.replace(/<\/?w:instrText[^>]*>/g, ''))
        .join('');

      let fieldName: string | null = null;
      let useCurly = false;

      const mergeMatch = allInstrText.match(/MERGEFIELD\s+"?([A-Za-z0-9_.]+)"?/i);
      const curlyMatch = allInstrText.match(/\{\{([A-Za-z0-9_.]+)\}\}/);
      const bareMatch = allInstrText.trim().match(/^([A-Za-z][A-Za-z0-9_.]{2,})$/);

      if (curlyMatch) { fieldName = curlyMatch[1]; useCurly = true; }
      else if (mergeMatch) { fieldName = mergeMatch[1]; }
      else if (bareMatch) { fieldName = bareMatch[1]; }

      if (!fieldName) return fullMatch;

      totalNoSeparateCount++;
      const rPr = '';
      const tagText = useCurly ? `{{${fieldName}}}` : `{{${fieldName}}}`;
      return `<w:r>${rPr}<w:t>${tagText}</w:t></w:r>`;
    });

    // Pattern B: Simple field wrappers
    const simpleFieldPattern = /<w:fldSimple\s+[^>]*w:instr="[^"]*MERGEFIELD\s+"?([A-Za-z0-9_.]+)"?[^"]*"[^>]*>([\s\S]*?)<\/w:fldSimple>/g;

    p = p.replace(simpleFieldPattern, (fullMatch, fieldName, innerContent) => {
      const rPrMatch = innerContent.match(/<w:rPr>([\s\S]*?)<\/w:rPr>/);
      const rPr = rPrMatch ? `<w:rPr>${rPrMatch[1]}</w:rPr>` : '';
      totalSimpleCount++;
      return `<w:r>${rPr}<w:t>\u00AB${fieldName}\u00BB</w:t></w:r>`;
    });

    // Fallback pass: convert remaining instrText containing merge tags
    const instrTextFallbackPattern = /<w:r\b[^>]*>\s*(?:<w:rPr>([\s\S]*?)<\/w:rPr>\s*)?<w:instrText[^>]*>([\s\S]*?)<\/w:instrText>\s*<\/w:r>/g;
    p = p.replace(instrTextFallbackPattern, (fullMatch, rPrContent, instrContent) => {
      const curlyMatch = instrContent.match(/\{\{([A-Za-z0-9_.]+)\}\}/);
      const mergeMatch = instrContent.match(/MERGEFIELD\s+"?([A-Za-z0-9_.]+)"?/i);
      const bareMatch = instrContent.trim().match(/^([A-Za-z][A-Za-z0-9_.]{2,})$/);

      let fieldName: string | null = null;
      let useCurly = false;
      if (curlyMatch) { fieldName = curlyMatch[1]; useCurly = true; }
      else if (mergeMatch) { fieldName = mergeMatch[1]; }
      else if (bareMatch) { fieldName = bareMatch[1]; }

      if (!fieldName) return fullMatch;

      totalInstrFallbackCount++;
      const rPr = rPrContent ? `<w:rPr>${rPrContent}</w:rPr>` : '';
      const tagText = useCurly ? `{{${fieldName}}}` : `\u00AB${fieldName}\u00BB`;
      return `<w:r>${rPr}<w:t>${tagText}</w:t></w:r>`;
    });

    // Orphaned fldChar cleanup
    const orphanedFldCharPattern = /<w:r\b[^>]*>\s*(?:<w:rPr>[\s\S]*?<\/w:rPr>\s*)?<w:fldChar\s+[^>]*?w:fldCharType="begin"[^>]*(?:\/>|><\/w:fldChar>)\s*<\/w:r>(\s*(?:<w:r\b[^>]*>\s*(?:<w:rPr>[\s\S]*?<\/w:rPr>\s*)?<w:t[^>]*>[^<]*<\/w:t>\s*<\/w:r>\s*)*)<w:r\b[^>]*>\s*(?:<w:rPr>[\s\S]*?<\/w:rPr>\s*)?<w:fldChar\s+[^>]*?w:fldCharType="end"[^>]*(?:\/>|><\/w:fldChar>)\s*<\/w:r>/g;
    p = p.replace(orphanedFldCharPattern, (fullMatch, betweenContent) => {
      if (/<w:instrText/.test(betweenContent) || /w:fldCharType="separate"/.test(betweenContent)) {
        return fullMatch;
      }
      totalOrphanedFldCharCount++;
      return betweenContent.trim();
    });

    return p;
  });

  if (totalComplexCount > 0 || totalSimpleCount > 0) {
    debugLog(`[tag-parser] Flattened MERGEFIELD structures: ${totalComplexCount} complex, ${totalSimpleCount} simple`);
  }
  if (totalNoSeparateCount > 0) {
    debugLog(`[tag-parser] Pattern C flattened ${totalNoSeparateCount} field codes without separate marker`);
  }
  if (totalInstrFallbackCount > 0) {
    debugLog(`[tag-parser] instrText fallback converted ${totalInstrFallbackCount} hidden merge tags to visible text`);
  }
  if (totalOrphanedFldCharCount > 0) {
    debugLog(`[tag-parser] Removed ${totalOrphanedFldCharCount} orphaned fldChar begin/end pairs`);
  }

  return result;
}

/**
 * Efficiently iterate over <w:p>...</w:p> paragraphs using indexOf
 * instead of regex to avoid catastrophic backtracking on large documents (600KB+).
 */
function processParaByPara(xml: string, fn: (para: string) => string): string {
  const chunks: string[] = [];
  let pos = 0;

  while (pos < xml.length) {
    // Find next <w:p> or <w:p ...> (skip <w:pPr>, <w:proofErr>, etc.)
    let pStart = -1;
    let searchFrom = pos;
    while (searchFrom < xml.length) {
      const idx = xml.indexOf('<w:p', searchFrom);
      if (idx === -1) break;
      const next = xml[idx + 4];
      if (next === '>' || next === ' ' || next === '/' || next === undefined) {
        pStart = idx;
        break;
      }
      searchFrom = idx + 4;
    }

    if (pStart === -1) {
      chunks.push(xml.substring(pos));
      break;
    }

    if (pStart > pos) {
      chunks.push(xml.substring(pos, pStart));
    }

    const pEnd = xml.indexOf('</w:p>', pStart);
    if (pEnd === -1) {
      chunks.push(xml.substring(pStart));
      break;
    }

    const paraEnd = pEnd + 6; // '</w:p>'.length
    const para = xml.substring(pStart, paraEnd);
    chunks.push(fn(para));
    pos = paraEnd;
  }

  return chunks.join('');
}

/**
 * Normalize Word XML by consolidating fragmented text runs.
 * Word often splits text across multiple <w:t> elements.
 */
export function normalizeWordXml(xmlContent: string): string {
  // First: flatten Word MERGEFIELD structures into plain «fieldName» text runs
  let result = flattenMergeFieldStructures(xmlContent);
  
  // Strip proofErr, lastRenderedPageBreak, and bookmark elements ONLY inside
  // paragraphs that contain merge-tag delimiters. This preserves page layout,
  // bookmarks, and structural XML in all non-tag paragraphs.
  result = processParaByPara(result, (para) => {
    // Only strip in paragraphs that contain merge tag delimiters
    if (!para.includes('{') && !para.includes('\u00AB') && !para.includes('\u00BB')) {
      return para;
    }
    let cleaned = para;
    cleaned = cleaned.replace(/<w:proofErr[^/]*\/>/g, '');
    cleaned = cleaned.replace(/<w:lastRenderedPageBreak\/>/g, '');
    cleaned = cleaned.replace(/<w:bookmarkStart[^/]*\/>/g, '');
    cleaned = cleaned.replace(/<w:bookmarkEnd[^/]*\/>/g, '');
    return cleaned;
  });
  
  // NOTE: We intentionally preserve <w:rPr> blocks (run properties) which contain
  // font names, sizes, bold, italic, colors, etc. Stripping them would collapse
  // formatted documents to default styling. The run-consolidation regex below
  // handles skipping over <w:rPr> blocks between adjacent runs.
  
  
  // Handle fragmented merge fields, braces, conditionals — all paragraph-scoped
  // to avoid catastrophic backtracking on large documents (628KB+).
  result = processParaByPara(result, (para) => {
    // Quick skip: only process paragraphs with potential merge tag delimiters
    if (!para.includes('{') && !para.includes('\u00AB') && !para.includes('\u00BB') && !para.includes('instrText')) {
      return para;
    }

    let p = para;

    // Handle fragmented merge fields
    const fragmentedPattern = /«((?:<(?!\/w:p>|w:p[\s>\/])[^>]*>|\s)*?)([A-Za-z0-9_.]+)((?:<(?!\/w:p>|w:p[\s>\/])[^>]*>|\s)*?)»/g;
    p = p.replace(fragmentedPattern, (match, pre, fieldName, post) => {
      if (pre.includes("<") || post.includes("<")) {
        debugLog(`[tag-parser] Found fragmented merge field: ${fieldName}`);
      }
      return `«${fieldName}»`;
    });

    // Handle XML-fragmented chevron patterns
    const leftChevronFragmented = /«((?:\s*<\/w:t>\s*<\/w:r>\s*<w:r(?:[^>]*)>\s*<w:t(?:[^>]*)>)+)/g;
    p = p.replace(leftChevronFragmented, () => "«");

    const rightChevronFragmented = /((?:\s*<\/w:t>\s*<\/w:r>\s*<w:r(?:[^>]*)>\s*<w:t(?:[^>]*)>)+)»/g;
    p = p.replace(rightChevronFragmented, () => "»");

    // Handle split opening braces
    // Guard: reject if intermediate runs contain meaningful text (letters/digits),
    // which indicates two separate tags rather than a single fragmented brace pair.
    const splitOpenBraces = /\{((?:\s*<\/w:t>\s*<\/w:r>\s*<w:r[^>]*>(?:\s*<w:rPr>[\s\S]*?<\/w:rPr>)?\s*<w:t[^>]*>)+)\{/g;
    p = p.replace(splitOpenBraces, (match, runBreak) => {
      if (/<\/w:p>/.test(runBreak) || /<w:p[\s>]/.test(runBreak)) {
        return match;
      }
      // Reject if any intermediate <w:t> contains actual text content (not just whitespace/braces)
      if (/<w:t[^>]*>[^<]*[A-Za-z0-9$#@!%^&*][^<]*<\/w:t>/.test(runBreak)) {
        return match;
      }
      return '{{';
    });

    // Handle split closing braces
    // Guard: reject if intermediate runs contain meaningful text content,
    // preventing cross-tag matching in paragraphs with multiple merge tags.
    const splitCloseBraces = /\}((?:\s*<\/w:t>\s*<\/w:r>\s*<w:r[^>]*>(?:\s*<w:rPr>[\s\S]*?<\/w:rPr>)?\s*<w:t[^>]*>)+)\}/g;
    p = p.replace(splitCloseBraces, (match, runBreak) => {
      if (/<\/w:p>/.test(runBreak) || /<w:p[\s>]/.test(runBreak)) {
        return match;
      }
      // Reject if any intermediate <w:t> contains actual text content (not just whitespace/braces)
      if (/<w:t[^>]*>[^<]*[A-Za-z0-9$#@!%^&*][^<]*<\/w:t>/.test(runBreak)) {
        return match;
      }
      return '}}';
    });

    // Consolidate adjacent <w:instrText> elements
    const instrTextConsolidate = /(<w:instrText[^>]*>)([\s\S]*?)(<\/w:instrText>)\s*<\/w:r>\s*<w:r[^>]*>\s*(?:<w:rPr>[\s\S]*?<\/w:rPr>\s*)?<w:instrText[^>]*>([\s\S]*?)(<\/w:instrText>)/g;
    let prevInstr = p;
    do {
      prevInstr = p;
      p = p.replace(instrTextConsolidate, '$1$2$4$3');
    } while (p !== prevInstr);

    // Handle fragmented curly brace patterns {{...}}
    const curlyFragmentedPattern = /\{\{((?:[A-Za-z0-9_.| ]|<(?!\/w:p>|w:p[\s>\/])[^>]*>|\s)*?)\}\}/g;
    p = p.replace(curlyFragmentedPattern, (match, innerContent) => {
      const cleanText = innerContent.replace(/<[^>]*>/g, '').replace(/\s+/g, '').trim();
      if (!cleanText) return match;
      if (/^[#/]/.test(cleanText) || cleanText === 'else') return match;

      const pipeIdx = cleanText.indexOf('|');
      if (pipeIdx > 0) {
        const fieldName = cleanText.substring(0, pipeIdx);
        const transform = cleanText.substring(pipeIdx + 1);
        if (/^[A-Za-z0-9_.]+$/.test(fieldName) && /^[A-Za-z0-9_]+$/.test(transform)) {
          if (innerContent.includes('<')) {
            debugLog(`[tag-parser] Found fragmented curly tag with transform, consolidating: {{${fieldName}|${transform}}}`);
          }
          return `{{${fieldName}|${transform}}}`;
        }
      }

      if (/^[A-Za-z0-9_.]+$/.test(cleanText)) {
        if (innerContent.includes('<')) {
          debugLog(`[tag-parser] Found fragmented curly tag, consolidating: {{${cleanText}}}`);
        }
        return `{{${cleanText}}}`;
      }

      return match;
    });

    // Pre-pass: consolidate fragmented inline checkbox conditionals of the form
    //   {{#if KEY}}☑{{else}}☐{{/if}}  (or any combination of ☑ / ☒ / ☐)
    // Word frequently splits the inline #if/else//if blocks across multiple
    // <w:r>/<w:t> runs in a single table cell (notably the RE851A YES/NO rows
    // such as Balloon Payment), which can prevent the downstream Mustache
    // evaluator from seeing a clean block. We rewrite the entire triplet into
    // a single clean expression. Scoped strictly to checkbox-glyph payloads so
    // it never touches unrelated conditionals.
    const CHECKBOX_GLYPHS = "\u2610\u2611\u2612"; // ☐ ☑ ☒
    const checkboxIfElsePattern = new RegExp(
      // {{ ... #if ... KEY ... }}
      "\\{\\{(?:<[^>]*>|\\s)*?#if(?:<[^>]*>|\\s)+([A-Za-z0-9_.]+)(?:<[^>]*>|\\s)*?\\}\\}" +
      // arbitrary XML runs, then a single checkbox glyph (possibly wrapped)
      "([\\s\\S]*?)([" + CHECKBOX_GLYPHS + "])([\\s\\S]*?)" +
      // {{ ... else ... }}
      "\\{\\{(?:<[^>]*>|\\s)*?else(?:<[^>]*>|\\s)*?\\}\\}" +
      // arbitrary XML runs, then second checkbox glyph
      "([\\s\\S]*?)([" + CHECKBOX_GLYPHS + "])([\\s\\S]*?)" +
      // {{ ... /if ... }}
      "\\{\\{(?:<[^>]*>|\\s)*?\\/(?:<[^>]*>|\\s)*?if(?:<[^>]*>|\\s)*?\\}\\}",
      "g"
    );
    p = p.replace(
      checkboxIfElsePattern,
      (match, fieldName, midA, glyphTrue, midB, midC, glyphFalse, midD) => {
        // Safety guards: never cross paragraph boundaries.
        if (/<\/w:p>|<w:p[\s>\/]/.test(match)) return match;
        // Validate per-branch: each of the 4 inter-marker segments
        // (midA: #if→glyphTrue, midB: glyphTrue→else, midC: else→glyphFalse,
        // midD: glyphFalse→/if) must contain NO Handlebars control tags
        // and NO additional checkbox glyphs. Plain value merge tags like
        // {{br_p_fullName}} appearing outside the branches are fine and a
        // sibling row's control tag captured by greedy regex no longer
        // forces a bail-out, so the RE851A B-line rewrite succeeds.
        const controlTagRe = /\{\{\s*(?:#if\b|#unless\b|#each\b|else\b|\/if\b|\/unless\b|\/each\b)/;
        const extraGlyphRe = new RegExp(`[${CHECKBOX_GLYPHS}]`);
        for (const seg of [midA, midB, midC, midD]) {
          const segNoXml = String(seg ?? "").replace(/<[^>]*>/g, "");
          if (controlTagRe.test(segNoXml)) return match;
          if (extraGlyphRe.test(segNoXml)) return match;
        }
        debugLog(
          `[tag-parser] Consolidated fragmented checkbox conditional for ${fieldName} (true=${glyphTrue}, false=${glyphFalse})`
        );
        return `{{#if ${fieldName}}}${glyphTrue}{{else}}${glyphFalse}{{/if}}`;
      }
    );

    // Defensive fallback: after the strict consolidator, if a paragraph still
    // contains a checkbox-glyph #if/else/#if triplet for the SAME field that
    // is interleaved with arbitrary inline XML (Word run wrappers), rewrite
    // it into the canonical clean form. Scoped to the exact shape:
    //   {{#if KEY}} ...xml... GLYPH ...xml... {{else}} ...xml... GLYPH ...xml... {{/if}}
    // where each branch contains exactly one checkbox glyph and no nested
    // control tags. This catches the RE851A B-line shape when the strict
    // pattern's per-branch greedy capture would otherwise leave the block
    // un-consolidated and the orphan-strip would drop the #if branch glyph.
    const checkboxFallbackPattern = new RegExp(
      "\\{\\{\\s*#if\\s+([A-Za-z0-9_.]+)\\s*\\}\\}" +
      "((?:(?!\\{\\{)[\\s\\S])*?)([" + CHECKBOX_GLYPHS + "])((?:(?!\\{\\{)[\\s\\S])*?)" +
      "\\{\\{\\s*else\\s*\\}\\}" +
      "((?:(?!\\{\\{)[\\s\\S])*?)([" + CHECKBOX_GLYPHS + "])((?:(?!\\{\\{)[\\s\\S])*?)" +
      "\\{\\{\\s*\\/if\\s*\\}\\}",
      "g"
    );
    p = p.replace(
      checkboxFallbackPattern,
      (match, fieldName, _a, glyphTrue, _b, _c, glyphFalse, _d) => {
        if (/<\/w:p>|<w:p[\s>\/]/.test(match)) return match;
        debugLog(
          `[tag-parser] Fallback-consolidated checkbox conditional for ${fieldName} (true=${glyphTrue}, false=${glyphFalse})`
        );
        return `{{#if ${fieldName}}}${glyphTrue}{{else}}${glyphFalse}{{/if}}`;
      }
    );

    // Handle fragmented conditional block tags
    // Also tolerate control tags that Word has split into separate <w:t> runs,
    // e.g. "{{#if" + " ln_p_balloonPayment" + "}}".
    const ifFragmented = /\{\{((?:<[^>]*>|\s)*?)#if\s*((?:<[^>]*>|\s)*?)([A-Za-z0-9_.]+)((?:<[^>]*>|\s)*?)\}\}/g;
    p = p.replace(ifFragmented, (_match, pre, mid, fieldName, post) => {
      if (pre.includes("<") || mid.includes("<") || post.includes("<")) {
        debugLog(`[tag-parser] Consolidated fragmented {{#if ${fieldName}}}`);
      }
      return `{{#if ${fieldName}}}`;
    });

    const ifOpenFragmented = /\{\{#if((?:<[^>]*>|\s)+)([A-Za-z0-9_.]+)((?:<[^>]*>|\s)*)\}\}/g;
    p = p.replace(ifOpenFragmented, (_match, mid, fieldName, post) => {
      if (mid.includes("<") || post.includes("<")) {
        debugLog(`[tag-parser] Consolidated split-open {{#if ${fieldName}}}`);
      }
      return `{{#if ${fieldName}}}`;
    });

    const unlessFragmented = /\{\{((?:<[^>]*>|\s)*?)#unless\s*((?:<[^>]*>|\s)*?)([A-Za-z0-9_.]+)((?:<[^>]*>|\s)*?)\}\}/g;
    p = p.replace(unlessFragmented, (_match, pre, mid, fieldName, post) => {
      if (pre.includes("<") || mid.includes("<") || post.includes("<")) {
        debugLog(`[tag-parser] Consolidated fragmented {{#unless ${fieldName}}}`);
      }
      return `{{#unless ${fieldName}}}`;
    });

    const unlessOpenFragmented = /\{\{#unless((?:<[^>]*>|\s)+)([A-Za-z0-9_.]+)((?:<[^>]*>|\s)*)\}\}/g;
    p = p.replace(unlessOpenFragmented, (_match, mid, fieldName, post) => {
      if (mid.includes("<") || post.includes("<")) {
        debugLog(`[tag-parser] Consolidated split-open {{#unless ${fieldName}}}`);
      }
      return `{{#unless ${fieldName}}}`;
    });

    const endIfFragmented = /\{\{((?:<[^>]*>|\s)*?)\/((?:<[^>]*>|\s)*?)if((?:<[^>]*>|\s)*?)\}\}/g;
    p = p.replace(endIfFragmented, (_match, pre, mid, post) => {
      if (pre.includes("<") || mid.includes("<") || post.includes("<")) {
        debugLog(`[tag-parser] Consolidated fragmented {{/if}}`);
      }
      return `{{/if}}`;
    });

    const endUnlessFragmented = /\{\{((?:<[^>]*>|\s)*?)\/((?:<[^>]*>|\s)*?)unless((?:<[^>]*>|\s)*?)\}\}/g;
    p = p.replace(endUnlessFragmented, (_match, pre, mid, post) => {
      if (pre.includes("<") || mid.includes("<") || post.includes("<")) {
        debugLog(`[tag-parser] Consolidated fragmented {{/unless}}`);
      }
      return `{{/unless}}`;
    });

    // Handle fragmented {{else}} tags
    const elseFragmented = /\{\{((?:<[^>]*>|\s)*?)else((?:<[^>]*>|\s)*?)\}\}/g;
    p = p.replace(elseFragmented, (_match, pre, post) => {
      if (pre.includes("<") || post.includes("<")) {
        debugLog(`[tag-parser] Consolidated fragmented {{else}}`);
      }
      return `{{else}}`;
    });

    const elseOpenFragmented = /\{\{((?:<[^>]*>|\s)+)else((?:<[^>]*>|\s)*)\}\}/g;
    p = p.replace(elseOpenFragmented, (_match, pre, post) => {
      if (pre.includes("<") || post.includes("<")) {
        debugLog(`[tag-parser] Consolidated split-open {{else}}`);
      }
      return `{{else}}`;
    });

    // Handle fragmented {{#each ...}} tags
    const eachFragmented = /\{\{((?:<[^>]*>|\s)*?)#each\s*((?:<[^>]*>|\s)*?)([A-Za-z0-9_.]+)((?:<[^>]*>|\s)*?)\}\}/g;
    p = p.replace(eachFragmented, (_match, pre, mid, collectionName, post) => {
      if (pre.includes("<") || mid.includes("<") || post.includes("<")) {
        debugLog(`[tag-parser] Consolidated fragmented {{#each ${collectionName}}}`);
      }
      return `{{#each ${collectionName}}}`;
    });

    // Handle fragmented {{/each}} tags
    const endEachFragmented = /\{\{((?:<[^>]*>|\s)*?)\/((?:<[^>]*>|\s)*?)each((?:<[^>]*>|\s)*?)\}\}/g;
    p = p.replace(endEachFragmented, (_match, pre, mid, post) => {
      if (pre.includes("<") || mid.includes("<") || post.includes("<")) {
        debugLog(`[tag-parser] Consolidated fragmented {{/each}}`);
      }
      return `{{/each}}`;
    });

    // Final pass: consolidate any remaining fragmented chevron tags
    const chevronFragmented = /«((?:[^»<]|<(?!\/w:p>|w:p[\s>\/])[^>]*>)*)»/g;
    p = p.replace(chevronFragmented, (match, inner) => {
      const cleanText = inner.replace(/<[^>]*>/g, '').replace(/\s+/g, '').trim();
      if (/^[A-Za-z0-9_.]+$/.test(cleanText)) {
        if (inner.includes('<')) {
          debugLog(`[tag-parser] Consolidated fragmented chevron tag: «${cleanText}»`);
        }
        return `«${cleanText}»`;
      }
      return match;
    });

    return p;
  });

  // Diagnostic: count tags BEFORE paragraph-level consolidation
  const preConsolidationCurly = (result.match(/\{\{[A-Za-z0-9_.| ]+\}\}/g) || []).length;
  const preConsolidationChevron = (result.match(/\u00AB[A-Za-z0-9_.]+\u00BB/g) || []).length;
  debugLog(`[tag-parser] Before paragraph consolidation: ${preConsolidationCurly} curly tags, ${preConsolidationChevron} chevron tags`);

  // Safety-net: paragraph-level consolidation for tags that span multiple <w:t> runs.
  result = consolidateFragmentedTagsInParagraphs(result);

  return result;
}

/**
 * Paragraph-level safety net for fragmented merge tags.
 * 
 * For each <w:p> paragraph, extracts text from all <w:t> elements,
 * joins them, and checks if the joined text reveals complete merge tags
 * that don't exist in any single <w:t> element. If so, consolidates
 * all text into the first <w:t> element to make tags parseable.
 * 
 * This handles ANY fragmentation pattern that the regex-based
 * normalization above might miss (e.g., unusual whitespace, nested
 * formatting, or Word-specific XML structures).
 */
function consolidateFragmentedTagsInParagraphs(xml: string): string {
  let parasWithBraces = 0;
  let parasConsolidated = 0;
  let parasSkippedComplete = 0;
  let parasSkippedNoTags = 0;

  // Use indexOf-based paragraph scanning instead of regex /<w:p[\s>\/][\s\S]*?<\/w:p>/g
  // to avoid catastrophic backtracking on large documents (600KB+)
  const result = processParaByPara(xml, (para) => {
    // Quick check: skip paragraphs without potential merge tags
    if (!para.includes('{') && !para.includes('\u00AB')) return para;
    parasWithBraces++;

    // Extract text content from each <w:t> element
    const tTexts: string[] = [];
    para.replace(/<w:t(?:\s[^>]*)?>([^<]*)<\/w:t>/g, (_, text) => {
      tTexts.push(text);
      return '';
    });

    if (tTexts.length < 2) return para; // Single or no text runs — no cross-run fragmentation

    const joined = tTexts.join('');

    // Find complete merge tags in the joined text
    const tagPattern = /\{\{[A-Za-z0-9_.#/| ]+\}\}|\u00AB[A-Za-z0-9_.]+\u00BB/g;
    const joinedTags = joined.match(tagPattern) || [];

    if (joinedTags.length === 0) { parasSkippedNoTags++; return para; }

    // Check if every found tag already exists completely within a single <w:t> element
    const allTagsComplete = joinedTags.every(tag =>
      tTexts.some(t => t.includes(tag))
    );

    if (allTagsComplete) { parasSkippedComplete++; return para; }

    // Tags are fragmented across runs — proceed to consolidation
    parasConsolidated++;
    debugLog(`[tag-parser] Paragraph-level consolidation: "${joined.substring(0, 120)}${joined.length > 120 ? '...' : ''}"`);

    let isFirst = true;
    return para.replace(/<w:t(\s[^>]*)?>([^<]*)<\/w:t>/g, (match, attrs, _text) => {
      if (isFirst) {
        isFirst = false;
        return `<w:t xml:space="preserve">${joined}</w:t>`;
      }
      return `<w:t${attrs || ''}></w:t>`;
    });
  });

  debugLog(`[tag-parser] Paragraph consolidation stats: ${parasWithBraces} paragraphs with braces, ${parasConsolidated} consolidated, ${parasSkippedComplete} already complete, ${parasSkippedNoTags} no tags in joined text`);
  return result;
}

/**
 * Parse Word merge fields from XML content
 * Supports: «field_name», {{field_name}}, {{field_name|transform}}, MERGEFIELD instructions
 */
export function parseWordMergeFields(content: string): ParsedMergeTag[] {
  const tags: ParsedMergeTag[] = [];
  const seenTags = new Set<string>();
  let match;

  if (content.includes('«') && content.includes('»')) {
    const unicodePattern = /«([^»<]+)»/g;
    while ((match = unicodePattern.exec(content)) !== null) {
      const tagName = match[1].trim();
      if (!seenTags.has(match[0])) {
        seenTags.add(match[0]);
        tags.push({
          fullMatch: match[0],
          tagName,
          inlineTransform: null,
        });
      }
    }
  }

  if (content.includes('{{') && content.includes('}}')) {
    const curlyPattern = /\{\{([^{}<|]+)(?:\s*\|\s*([^{}<]+))?\}\}/g;
    while ((match = curlyPattern.exec(content)) !== null) {
      const tagName = match[1].trim();
      // Skip conditional/control tags — these are handled by processConditionalBlocks
      if (/^#if\s|^#unless\s|^#each\s|^\/if$|^\/unless$|^\/each$|^else$/.test(tagName)) {
        continue;
      }
      if (!seenTags.has(match[0])) {
        seenTags.add(match[0]);
        tags.push({
          fullMatch: match[0],
          tagName,
          inlineTransform: match[2]?.trim() || null,
        });
      }
    }
  }

  if (content.includes('MERGEFIELD')) {
    const mergeFieldPattern = /MERGEFIELD\s+"?([A-Za-z0-9_.]+)"?/gi;
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
  }

  debugLog(`[tag-parser] Found ${tags.length} merge tags: ${tags.map(t => t.tagName).join(", ")}`);

  return tags;
}

function getLabelQuickNeedle(label: string, mapping: LabelMapping): string {
  if (mapping.replaceNext) return mapping.replaceNext.toLowerCase();
  if (label === "as of _") return "as of";
  if (label.endsWith(':')) return label.slice(0, -1).toLowerCase();
  return label.toLowerCase();
}

/**
 * Build a native Word SDT (Structured Document Tag) checkbox XML block.
 * This produces an interactive, clickable checkbox in Word — matching the
 * appearance and behaviour of existing SDT checkboxes in the template.
 *
 * @param isChecked  Whether the checkbox should be in the checked state
 * @param rPr        Optional run-property XML string to preserve font/size styling
 */
function buildSdtCheckboxXml(isChecked: boolean, rPr?: string): string {
  const checkedVal = isChecked ? '1' : '0';
  const displayChar = isChecked ? '\u2611' : '\u2610'; // ☑ or ☐
  const wrappedRPr = rPr
    ? (rPr.startsWith('<w:rPr>') ? rPr : `<w:rPr>${rPr}</w:rPr>`)
    : `<w:rPr><w:rFonts w:ascii="MS Gothic" w:hAnsi="MS Gothic" w:eastAsia="MS Gothic" w:hint="eastAsia"/></w:rPr>`;

  return `<w:sdt><w:sdtPr>${wrappedRPr}<w14:checkbox><w14:checked w14:val="${checkedVal}"/><w14:checkedState w14:val="2611" w14:font="MS Gothic"/><w14:uncheckedState w14:val="2610" w14:font="MS Gothic"/></w14:checkbox></w:sdtPr><w:sdtContent><w:r>${wrappedRPr}<w:t>${displayChar}</w:t></w:r></w:sdtContent></w:sdt>`;
}

/**
 * Post-processing pass: convert any <w:r> whose <w:t> contains ONLY a
 * checkbox glyph (☐, ☑, or ☒) into a native Word SDT checkbox.
 * This runs after all merge-tag and label-based replacements are complete,
 * so every checkbox glyph — regardless of origin — becomes interactive.
 */
function convertGlyphsToSdtCheckboxes(xml: string): string {
  let count = 0;
  // Match ONLY a single run whose content is exactly: optional <w:rPr>, one
  // checkbox glyph text node, then closing </w:r>. The prior pattern could
  // overrun across many paragraphs until the first glyph in the document,
  // corrupting existing <w:sdt> blocks in RE851A.
  const runWithGlyphOnly = /<w:r\b[^>]*>\s*(?:<w:rPr>((?:(?!<\/w:rPr>|<w:r\b|<w:p\b|<w:tbl\b)[\s\S])*?)<\/w:rPr>)?\s*<w:t[^>]*>([☐☑☒])<\/w:t>\s*<\/w:r>/g;

  // To avoid nesting <w:sdt> inside existing <w:sdt> (which corrupts the document),
  // extract existing SDT blocks using depth-aware matching, process the remaining
  // content, then restore them. Uses a valid XML placeholder character (\uFFFD)
  // instead of \uFFFE (which is illegal in XML 1.0 and causes document corruption).
  const sdtPlaceholders: string[] = [];
  const sdtMarkerPrefix = '\uFFFD_SDT_PLACEHOLDER_';
  const sdtMarkerSuffix = '_END';

  // Depth-aware SDT extraction: handle nested <w:sdt> blocks correctly
  // by finding matching open/close pairs from innermost outward.
  let safeguardedXml = xml;
  let extractionPass = 0;
  const MAX_EXTRACTION_PASSES = 20;
  while (extractionPass < MAX_EXTRACTION_PASSES) {
    // Find SDT blocks that do NOT contain other <w:sdt> (i.e., innermost first)
    const innerSdtPattern = /<w:sdt\b[^>]*>(?:(?!<w:sdt\b)[\s\S])*?<\/w:sdt>/g;
    let foundAny = false;
    safeguardedXml = safeguardedXml.replace(innerSdtPattern, (sdtBlock) => {
      foundAny = true;
      const idx = sdtPlaceholders.length;
      sdtPlaceholders.push(sdtBlock);
      return `${sdtMarkerPrefix}${idx}${sdtMarkerSuffix}`;
    });
    if (!foundAny) break;
    extractionPass++;
  }

  safeguardedXml = safeguardedXml.replace(runWithGlyphOnly, (_match, _rPrGroup, innerRPr, glyph) => {
    const isChecked = glyph === '☑' || glyph === '☒';
    count++;
    return buildSdtCheckboxXml(isChecked, innerRPr || undefined);
  });

  // Restore SDT blocks (reverse order to handle nesting correctly — inner restored first)
  for (let pass = 0; pass < MAX_EXTRACTION_PASSES; pass++) {
    const markerPattern = new RegExp(
      escapeRegex(sdtMarkerPrefix) + '(\\d+)' + escapeRegex(sdtMarkerSuffix),
      'g'
    );
    if (!markerPattern.test(safeguardedXml)) break;
    safeguardedXml = safeguardedXml.replace(
      new RegExp(escapeRegex(sdtMarkerPrefix) + '(\\d+)' + escapeRegex(sdtMarkerSuffix), 'g'),
      (_m, idx) => sdtPlaceholders[parseInt(idx, 10)] || ''
    );
  }

  // DEFENSIVE FINAL SWEEP: under no circumstances may the placeholder marker
  // (which contains \uFFFD) reach the output XML. \uFFFD inside element /
  // attribute names is rejected by strict XML parsers (Google Docs) and
  // produces "File could not open" errors. If any survived (e.g. extraction
  // depth exceeded MAX_EXTRACTION_PASSES), restore from the stored block or
  // strip to empty as a last resort.
  if (safeguardedXml.includes(sdtMarkerPrefix)) {
    safeguardedXml = safeguardedXml.replace(
      new RegExp(escapeRegex(sdtMarkerPrefix) + '(\\d+)' + escapeRegex(sdtMarkerSuffix), 'g'),
      (_m, idx) => sdtPlaceholders[parseInt(idx, 10)] || ''
    );
  }
  // Belt-and-suspenders: nuke any stray \uFFFD that may have leaked in from
  // any other source. \uFFFD is the Unicode replacement char and is not
  // valid inside XML names.
  if (safeguardedXml.includes('\uFFFD')) {
    safeguardedXml = safeguardedXml.replace(/\uFFFD/g, '');
  }

  if (count > 0) {
    debugLog(`[tag-parser] Converted ${count} checkbox glyphs to SDT checkboxes`);
  }
  return safeguardedXml;
}

function escapeRegex(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/**
 * Escape characters that have special meaning in XML so resolved field
 * values cannot break the well-formedness of word/document.xml.
 *
 * NOTE: Newlines are intentionally NOT converted here. Emitting
 * `</w:t><w:br/><w:t xml:space="preserve">` is only valid when the value
 * is being injected inside an open <w:t> element. When the substitution
 * site is outside a text run (e.g. between runs, inside table-cell
 * markup, or inside an SDT wrapper), that fragment produces an orphan
 * </w:t> and an unclosed <w:t>, which Word rejects with
 * "File could not open. Try refreshing the page."
 *
 * Callers should use `formatValueForInsertion(value, surroundingXml, index)`
 * (below) so newline handling is decided based on the actual call site.
 */
export function escapeXmlValue(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

/**
 * Determine whether a position in the XML lies inside an open <w:t> element.
 * Returns true when the most recent <w:t ...> open tag before `index` has no
 * matching </w:t> close tag between it and `index`.
 */
export function isInsideTextRun(xml: string, index: number): boolean {
  const lastOpen = xml.lastIndexOf('<w:t', index);
  if (lastOpen === -1) return false;
  const tagEnd = xml.indexOf('>', lastOpen);
  if (tagEnd === -1 || tagEnd >= index) return false;
  const tagHead = xml.substring(lastOpen, tagEnd + 1);
  // Must be <w:t> or <w:t ...> — not <w:tbl>, <w:tr>, <w:tc>, <w:tab/>, etc.
  if (!/^<w:t(\s[^>]*)?>$/.test(tagHead)) return false;
  const lastClose = xml.lastIndexOf('</w:t>', index);
  return lastClose < lastOpen;
}

/**
 * Format a resolved field value for safe insertion into Word XML at the given
 * position. Escapes XML-special characters; converts newlines into a Word
 * in-run line break ONLY when the insertion point is inside an open <w:t>.
 * Otherwise newlines collapse to a single space so the package stays valid.
 */
export function formatValueForInsertion(
  value: string,
  surroundingXml: string,
  index: number,
): string {
  const escaped = escapeXmlValue(value);
  if (!escaped.includes('\n')) return escaped;
  if (isInsideTextRun(surroundingXml, index)) {
    return escaped.replace(/\n/g, '</w:t><w:br/><w:t xml:space="preserve">');
  }
  return escaped.replace(/\n/g, ' ');
}

function buildXmlFlexibleLabelPattern(label: string): string {
  const parts = label.split(/\s+/).filter(Boolean).map(escapeRegex);
  if (parts.length === 0) return '';
  return parts.join('(?:\\s|<[^>]+>)*');
}

function replaceStaticCheckboxLabel(
  content: string,
  label: string,
  checkboxValue: string,
): { content: string; replaced: boolean } {
  const labelPattern = buildXmlFlexibleLabelPattern(label);
  if (!labelPattern) {
    return { content, replaced: false };
  }

  // Strategy: find a <w:t> containing a checkbox glyph that is followed
  // (possibly with intervening XML tags / whitespace) by the label text,
  // then ONLY replace the glyph character inside its <w:t> element.
  // This preserves font styling (<w:rPr>) and run boundaries.
  const glyphInWtPattern = new RegExp(
    `(<w:t[^>]*>)([^<]*?)([☐☑☒])([^<]*?</w:t>)((?:\\s|<[^>]+>)*?${labelPattern})(?![A-Za-z])`,
    'gi'
  );

  if (glyphInWtPattern.test(content)) {
    glyphInWtPattern.lastIndex = 0;
    let result = content.replace(glyphInWtPattern, (_match, wtOpen, pre, _glyph, wtTail, labelPart) => {
      return `${wtOpen}${pre}${checkboxValue}${wtTail}${labelPart}`;
    });
    // Remove duplicate adjacent checkbox glyphs that arise when a merge tag
    // already resolved to ☑/☐ AND the template had a static glyph.
    // Pattern: two checkbox glyphs separated only by XML tags / whitespace.
    result = result.replace(
      /([☐☑☒])((?:\s|<[^>]*>)*?)([☐☑☒])((?:\s|<[^>]*>)*?)/g,
      (_m, g1, mid, _g2, trail) => `${g1}${mid}${trail}`
    );
    return { content: result, replaced: true };
  }

  // Support templates where the visible checkbox glyph appears after the label
  // (e.g. "Lender(s) as Additional Insured☑") rather than before it.
  const trailingGlyphPattern = new RegExp(
    `(${labelPattern})((?:\\s|<[^>]+>)*)([☐☑☒])`,
    'gi'
  );

  if (trailingGlyphPattern.test(content)) {
    trailingGlyphPattern.lastIndex = 0;
    let result = content.replace(trailingGlyphPattern, (_match, labelText, spacing) => {
      return `${labelText}${spacing}${checkboxValue}`;
    });
    result = result.replace(
      /([☐☑☒])((?:\s|<[^>]*>)*?)([☐☑☒])((?:\s|<[^>]*>)*?)/g,
      (_m, g1, mid, _g2, trail) => `${g1}${mid}${trail}`
    );
    return { content: result, replaced: true };
  }

  // Fallback: plain-text glyph adjacent to label (no <w:t> wrapper)
  const plainPattern = new RegExp(`([☐☑☒])((?:\\s|<[^>]+>)*)(${labelPattern})(?![A-Za-z])`, 'gi');
  if (!plainPattern.test(content)) {
    return { content, replaced: false };
  }
  plainPattern.lastIndex = 0;
  let result = content.replace(plainPattern, (_match, _glyph, spacing, labelText) => {
    return `${checkboxValue}${spacing}${labelText}`;
  });
  // Same dedup for plain-text path
  result = result.replace(
    /([☐☑☒])((?:\s|<[^>]*>)*?)([☐☑☒])((?:\s|<[^>]*>)*?)/g,
    (_m, g1, mid, _g2, trail) => `${g1}${mid}${trail}`
  );
  return { content: result, replaced: true };
}


/**
 * Perform label-based replacement for templates without explicit merge tags.
 */
export function replaceLabelBasedFields(
  content: string,
  fieldValues: Map<string, FieldValueData>,
  fieldTransforms: Map<string, string>,
  labelMap: Record<string, LabelMapping>,
  replacedFieldKeys?: Set<string>,
  mergeTagMap?: Record<string, string>,
  validFieldKeys?: Set<string>
): { content: string; replacementCount: number } {
  let replacementCount = 0;
  const labelEntries = Object.entries(labelMap);

  if (labelEntries.length === 0) {
    return { content, replacementCount };
  }

  const replacedFieldKeyLowers = replacedFieldKeys
    ? new Set([...replacedFieldKeys].map((key) => key.toLowerCase()))
    : null;
  const contentLower = content.toLowerCase();
  const candidateLabels = labelEntries
    .map(([label, mapping]) => ({
      label,
      mapping,
      quickNeedle: getLabelQuickNeedle(label, mapping),
    }))
    .filter(({ quickNeedle }) => !quickNeedle || contentLower.includes(quickNeedle))
    .sort((a, b) => b.label.length - a.label.length);

  if (candidateLabels.length === 0) {
    return { content, replacementCount };
  }

  // Track resolved keys that have already been replaced by labels in this pass
  const labelResolvedKeys = new Set<string>();

  const processedContent = processParaByPara(content, (segment) => {
    let result = segment;
    let resultLower = result.toLowerCase();

    for (const { label, mapping, quickNeedle } of candidateLabels) {
      if (replacedFieldKeyLowers?.has(mapping.fieldKey.toLowerCase())) {
        continue;
      }

      if (quickNeedle && !resultLower.includes(quickNeedle)) {
        continue;
      }

      const resolvedKey = mergeTagMap && validFieldKeys
        ? resolveFieldKeyWithMap(mapping.fieldKey, mergeTagMap, validFieldKeys)
        : mapping.fieldKey;

      // Dedup: skip if the resolved canonical key was already replaced by a merge tag
      if (resolvedKey !== mapping.fieldKey && replacedFieldKeyLowers?.has(resolvedKey.toLowerCase())) {
        continue;
      }

      // Dedup: skip if another label already replaced this same resolved key in this pass
      if (labelResolvedKeys.has(resolvedKey.toLowerCase())) {
        continue;
      }

      const resolved = getFieldData(resolvedKey, fieldValues);
      const fieldData = resolved?.data || null;

      if (fieldData && fieldData.dataType === 'boolean') {
        const checkboxResult = replaceStaticCheckboxLabel(
          result,
          label,
          formatCheckbox(fieldData.rawValue),
        );

        if (checkboxResult.replaced) {
          result = checkboxResult.content;
          resultLower = result.toLowerCase();
          replacementCount++;
          labelResolvedKeys.add(resolvedKey.toLowerCase());
          debugLog(`[tag-parser] Checkbox label-replaced "${label}" -> "${formatCheckbox(fieldData.rawValue)}"`);
          continue;
        }
      }

      if (!fieldData || fieldData.rawValue === null) {
        if (mapping.replaceNext) {
          const textToReplace = mapping.replaceNext;
          const escapedText = textToReplace.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
          const replaceNextPattern = new RegExp(`\\b${escapedText}\\b`, "gi");
          if (replaceNextPattern.test(result)) {
            result = result.replace(new RegExp(`\\b${escapedText}\\b`, "gi"), (match, offset) => {
              const after = result.substring(offset + match.length, offset + match.length + 200);
              if (/^\s*(?:<[^>]*>\s*)*\{\{/.test(after)) {
                return match;
              }
              const textAfter = after.replace(/<[^>]*>/g, '').trim();
              if (textAfter.length > 0) {
                return match;
              }
              return "";
            });
            resultLower = result.toLowerCase();
            replacementCount++;
            debugLog(`[tag-parser] Label "${label}" -> No data; blanked "${textToReplace}"`);
          }
        } else if (label === "as of _") {
          const asOfPattern = /as of\s*_+/gi;
          if (asOfPattern.test(result)) {
            result = result.replace(asOfPattern, "as of ");
            resultLower = result.toLowerCase();
            replacementCount++;
            debugLog(`[tag-parser] Label "${label}" -> No data; blanked "as of ___"`);
          }
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
      // Strip leading "$" from currency values — the template already contains a literal "$" prefix
      if (fieldData.dataType === 'currency' && formattedValue.startsWith('$')) {
        formattedValue = formattedValue.substring(1);
      }

      // XML-escape resolved value for safe injection. Newlines are preserved
      // as literal "\n" here and converted to Word XML in-run breaks ONLY at
      // insertion sites that are inside an open <w:t> element (see
      // formatValueForInsertion). This prevents orphan </w:t> tags that
      // otherwise corrupt the generated .docx.
      formattedValue = escapeXmlValue(formattedValue);

      const insertAt = (src: string, offset: number) =>
        formatValueForInsertion(formattedValue, src, offset).replace(/\$/g, '$$$$');

      if (label === "as of _") {
        const asOfPattern = /as of\s*_+/gi;
        if (asOfPattern.test(result)) {
          result = result.replace(asOfPattern, (match, offset: number) =>
            `as of ${insertAt(result, offset + match.length)}`);
          resultLower = result.toLowerCase();
          replacementCount++;
          labelResolvedKeys.add(resolvedKey.toLowerCase());
          debugLog(`[tag-parser] Label-replaced "as of ___" -> "${formattedValue}"`);
        }
        continue;
      }

      if (mapping.replaceNext) {
        const textToReplace = mapping.replaceNext;
        const escapedText = textToReplace.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        const replaceNextPattern = new RegExp(`\\b${escapedText}\\b`, 'gi');

        if (replaceNextPattern.test(result)) {
          let colonDetected = false;

          result = result.replace(new RegExp(`\\b${escapedText}\\b`, 'gi'), (match, offset) => {
            const after = result.substring(offset + match.length, offset + match.length + 200);
            if (/^\s*(?:<[^>]*>\s*)*\{\{/.test(after)) {
              return match;
            }
            const immediateAfter = after.replace(/<[^>]*>/g, '').trimStart();
            if (immediateAfter.startsWith(':')) {
              colonDetected = true;
              return match;
            }
            return formatValueForInsertion(formattedValue, result, offset);
          });

          if (colonDetected) {
            const fullPattern = new RegExp(
              `(\\b${escapedText}\\b(?:\\s|<[^>]*>)*:\\s*)(_+|\\s*)`,
              'gi'
            );
            result = result.replace(fullPattern, (match, prefix: string, _filler: string, offset: number) =>
              `${prefix}${insertAt(result, offset + prefix.length)} `);
          }

          resultLower = result.toLowerCase();
          replacementCount++;
          labelResolvedKeys.add(resolvedKey.toLowerCase());
          debugLog(`[tag-parser] Label-replaced "${textToReplace}" -> "${formattedValue}"`);
        }
        continue;
      }

      const labelEscaped = label.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      const labelPattern = new RegExp(`(${labelEscaped})(\\s*)`, 'gi');

      if (labelPattern.test(result)) {
        result = result.replace(labelPattern, (match, g1: string, g2: string, offset: number) =>
          `${g1}${g2}${insertAt(result, offset + match.length)} `);
        resultLower = result.toLowerCase();
        replacementCount++;
        labelResolvedKeys.add(resolvedKey.toLowerCase());
        debugLog(`[tag-parser] Label-replaced "${label}" -> "${formattedValue}"`);
      } else if (label.endsWith(':')) {
        const labelNoColon = label.slice(0, -1);
        const labelNoColonEscaped = labelNoColon.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        const colonTolerantPattern = new RegExp(`(${labelNoColonEscaped})(?:\\s|<[^>]+>)*:`, 'gi');

        if (colonTolerantPattern.test(result)) {
          result = result.replace(colonTolerantPattern, (match, _g1: string, offset: number) =>
            `${match}${insertAt(result, offset + match.length)} `);
          resultLower = result.toLowerCase();
          replacementCount++;
          labelResolvedKeys.add(resolvedKey.toLowerCase());
          debugLog(`[tag-parser] Label-replaced (colon-tolerant) "${label}" -> "${formattedValue}"`);
        }
      }
    }

    return result;
  });

  return { content: processedContent, replacementCount };
}

/**
 * Evaluate whether a conditional field value is truthy.
 * Checks: non-null, non-empty string, boolean true, non-zero number.
 * Also supports checking if any field with a given prefix has data (entity existence).
 */
// Module-level cache for entity-existence prefix lookups
let _entityPrefixCache: Map<string, boolean> | null = null;
let _entityPrefixCacheSource: Map<string, FieldValueData> | null = null;

function buildEntityPrefixCache(fieldValues: Map<string, FieldValueData>): Map<string, boolean> {
  if (_entityPrefixCache && _entityPrefixCacheSource === fieldValues) {
    return _entityPrefixCache;
  }
  const prefixes = new Map<string, boolean>();
  for (const [k, v] of fieldValues.entries()) {
    if (v.rawValue === null || v.rawValue === "") continue;
    const kLower = k.toLowerCase();
    // Extract all possible prefixes: e.g. "co_borrower1.first_name" -> "co_borrower1"
    const dotIdx = kLower.indexOf(".");
    if (dotIdx > 0) {
      prefixes.set(kLower.substring(0, dotIdx), true);
    }
    const underIdx = kLower.indexOf("_");
    // For underscore prefixes, try first segment that contains digits
    const match = kLower.match(/^([a-z_]+\d+)/);
    if (match) {
      prefixes.set(match[1], true);
    }
  }
  _entityPrefixCache = prefixes;
  _entityPrefixCacheSource = fieldValues;
  return prefixes;
}

function getConditionalAliasCandidates(fieldKey: string): string[] {
  const normalized = fieldKey.trim();
  const lower = normalized.toLowerCase();

  if (lower === "ln_p_balloonpayment") {
    return [normalized, "ln_p_balloonPaymen", "loan_terms.balloon_payment"];
  }

  if (lower === "ln_p_balloonpaymen") {
    return [normalized, "ln_p_balloonPayment", "loan_terms.balloon_payment"];
  }

  if (lower === "loan_terms.balloon_payment") {
    return [normalized, "ln_p_balloonPaymen", "ln_p_balloonPayment"];
  }

  // "Is Broker Also a Borrower?" — RE851A Part 2 A/B capacity checkboxes.
  // Falls back to the engine-published sibling boolean and the UI persistence key
  // so the conditional resolves correctly even if the primary key is missing.
  if (lower === "or_p_isbrkborrower") {
    return [
      normalized,
      "or_p_brkCapacityPrincipal",
      "or_p_isBrokerAlsoBorrower_yes",
      "origination_app.doc.is_broker_also_borrower_yes",
    ];
  }

  return [normalized];
}

function isConditionTruthy(
  fieldKey: string,
  fieldValues: Map<string, FieldValueData>,
  mergeTagMap: Record<string, string>,
  validFieldKeys?: Set<string>
): boolean {
  const aliasCandidates = getConditionalAliasCandidates(fieldKey);
  let canonicalKey = resolveFieldKeyWithMap(fieldKey, mergeTagMap, validFieldKeys);
  let resolved = getFieldData(canonicalKey, fieldValues);

  if (!resolved?.data) {
    for (const aliasKey of aliasCandidates) {
      const aliasCanonicalKey = resolveFieldKeyWithMap(aliasKey, mergeTagMap, validFieldKeys);
      const aliasResolved = getFieldData(aliasCanonicalKey, fieldValues);
      if (aliasResolved?.data) {
        canonicalKey = aliasCanonicalKey;
        resolved = aliasResolved;
        debugLog(`[tag-parser] Conditional alias fallback: ${fieldKey} -> ${aliasCanonicalKey}`);
        break;
      }
    }
  }

  if (resolved?.data) {
    const raw = resolved.data.rawValue;
    if (raw === null || raw === "") return false;
    if (typeof raw === "string") {
      return !["false", "0", "no", "n"].includes(raw.toLowerCase());
    }
    if (typeof raw === "number") return raw !== 0;
    return Boolean(raw);
  }

  // Entity-existence check using pre-built prefix cache (O(1) lookup)
  const prefixCache = buildEntityPrefixCache(fieldValues);
  const lowerKey = canonicalKey.toLowerCase();
  if (prefixCache.has(lowerKey)) return true;

  return false;
}

/**
 * Clean up paragraphs that contain no visible text content after tag removal.
 * Targets paragraphs whose <w:t> elements are all empty or whitespace-only,
 * removing them to prevent blank gaps in the generated document.
 * Only cleans within a localized region around `centerIndex` to avoid
 * stripping intentional spacing paragraphs elsewhere.
 */
function cleanEmptyParagraphsNear(content: string, centerIndex: number, radius = 500): string {
  const cleanupStart = Math.max(0, centerIndex - radius);
  const cleanupEnd = Math.min(content.length, centerIndex + radius);
  const before = content.substring(0, cleanupStart);
  const region = content.substring(cleanupStart, cleanupEnd);
  const after = content.substring(cleanupEnd);

  // Match paragraphs that have NO text content (all <w:t> elements are empty/whitespace)
  const cleanedRegion = region.replace(
    /<w:p\b[^>]*>(?:\s*<w:pPr>[\s\S]*?<\/w:pPr>)?(?:\s*<w:r\b[^>]*>(?:\s*<w:rPr>[\s\S]*?<\/w:rPr>)?\s*<w:t[^>]*>\s*<\/w:t>\s*<\/w:r>)*\s*<\/w:p>/g,
    (paraMatch) => {
      // Double-check: extract all text from <w:t> elements
      const textContent = paraMatch.replace(/<[^>]*>/g, '').trim();
      if (textContent === '') {
        debugLog(`[tag-parser] Removing empty paragraph after tag cleanup (${paraMatch.length} bytes)`);
        return '';
      }
      return paraMatch;
    }
  );

  return before + cleanedRegion + after;
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
  const MAX_ITERATIONS = 100;

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
      debugLog(`[tag-parser] Conditional {{#if ${fieldKey}}} = ${truthy}`);

      // Check for {{else}} within the block
      const elseIndex = blockContent.indexOf('{{else}}');

      if (truthy) {
        // Keep the true branch (content before {{else}}, or all if no else)
        const keepContent = elseIndex !== -1 ? blockContent.substring(0, elseIndex) : blockContent;
        const insertionPoint = ifMatch.index;
        result = result.substring(0, ifMatch.index) + keepContent + result.substring(ifMatch.index + ifMatch[0].length);
        // Clean up empty paragraphs left behind by the removed {{#if}} and {{/if}} tags
        result = cleanEmptyParagraphsNear(result, insertionPoint);
      } else {
        if (elseIndex !== -1) {
          // Keep the else branch (content after {{else}})
          const elseContent = blockContent.substring(elseIndex + '{{else}}'.length);
          const insertionPoint = ifMatch.index;
          result = result.substring(0, ifMatch.index) + elseContent + result.substring(ifMatch.index + ifMatch[0].length);
          // Clean up empty paragraphs left behind by removed {{else}} / {{/if}} tags
          result = cleanEmptyParagraphsNear(result, insertionPoint);
        } else {
          // No else branch — remove block and clean up surrounding empty paragraphs
          result = removeConditionalBlock(result, ifMatch.index, ifMatch[0].length);
        }
      }
    } else if (unlessMatch) {
      const fieldKey = unlessMatch[1];
      const blockContent = unlessMatch[2];
      const truthy = isConditionTruthy(fieldKey, fieldValues, mergeTagMap, validFieldKeys);
      debugLog(`[tag-parser] Conditional {{#unless ${fieldKey}}} = ${!truthy} (inverted)`);

      // Check for {{else}} within the block
      const elseIndex = blockContent.indexOf('{{else}}');

      if (!truthy) {
        const keepContent = elseIndex !== -1 ? blockContent.substring(0, elseIndex) : blockContent;
        const insertionPoint = unlessMatch.index;
        result = result.substring(0, unlessMatch.index) + keepContent + result.substring(unlessMatch.index + unlessMatch[0].length);
        result = cleanEmptyParagraphsNear(result, insertionPoint);
      } else {
        if (elseIndex !== -1) {
          const elseContent = blockContent.substring(elseIndex + '{{else}}'.length);
          const insertionPoint = unlessMatch.index;
          result = result.substring(0, unlessMatch.index) + elseContent + result.substring(unlessMatch.index + unlessMatch[0].length);
          result = cleanEmptyParagraphsNear(result, insertionPoint);
        } else {
          result = removeConditionalBlock(result, unlessMatch.index, unlessMatch[0].length);
        }
      }
    }

    iterations++;
  }

  if (iterations >= MAX_ITERATIONS) {
    console.warn("[tag-parser] Hit max iterations for conditional processing — possible malformed tags");
  }

  // Safety net: strip any unmatched conditional markers that survived
  // (e.g. an {{#if x}} with no {{/if}}). Leaving them in place would either
  // render as literal text or, worse, leave broken paragraph fragments that
  // can corrupt word/document.xml. We only remove the markers themselves
  // and keep the surrounding content unchanged.
  result = result.replace(/\{\{#if\s+[A-Za-z0-9_.]+\}\}/g, "");
  result = result.replace(/\{\{#unless\s+[A-Za-z0-9_.]+\}\}/g, "");
  result = result.replace(/\{\{\/if\}\}/g, "");
  result = result.replace(/\{\{\/unless\}\}/g, "");
  result = result.replace(/\{\{else\}\}/g, "");

  // Extended safety net: also strip Handlebars-style sub-expression openers
  // such as {{#if (eq ld_p_lenderType "Individual")}} or {{#unless (ne ...)}}.
  // The engine does not evaluate sub-expressions, so leaving these in would
  // print as literal text in the generated document.
  result = result.replace(/\{\{#if\s*\([^}]*?\)\s*\}\}/g, "");
  result = result.replace(/\{\{#unless\s*\([^}]*?\)\s*\}\}/g, "");
  result = result.replace(/\{\{#each\s*\([^}]*?\)\s*\}\}/g, "");

  // Extended safety net: strip BARE (unwrapped) conditional directives that
  // template authors sometimes leave inside DOCX paragraphs as plain text,
  // e.g. a paragraph whose run text is exactly:
  //   #if (eq ld_p_lenderType "Individual")
  // Without this, the literal control text appears in the generated document.
  // We only remove text inside <w:t>…</w:t> runs whose entire content matches
  // a conditional directive; surrounding prose is never touched.
  result = result.replace(
    /<w:t(\s[^>]*)?>\s*(?:#if|#unless|#each)\s*\([^<]*?\)\s*<\/w:t>/g,
    (m) => m.replace(/>\s*(?:#if|#unless|#each)\s*\([^<]*?\)\s*</, "><"),
  );
  result = result.replace(
    /<w:t(\s[^>]*)?>\s*(?:#if|#unless|#each)\s+[A-Za-z0-9_.]+\s*<\/w:t>/g,
    (m) => m.replace(/>\s*(?:#if|#unless|#each)\s+[A-Za-z0-9_.]+\s*</, "><"),
  );
  result = result.replace(
    /<w:t(\s[^>]*)?>\s*(?:\/if|\/unless|\/each|else)\s*<\/w:t>/g,
    (m) => m.replace(/>\s*(?:\/if|\/unless|\/each|else)\s*</, "><"),
  );

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

  // Clean up empty paragraphs only near the removed block (within 500 chars)
  // to avoid stripping intentional spacing paragraphs elsewhere in the document
  const cleanupStart = Math.max(0, removeStart - 500);
  const cleanupEnd = Math.min(result.length, removeStart + 500);
  const before = result.substring(0, cleanupStart);
  const region = result.substring(cleanupStart, cleanupEnd);
  const after = result.substring(cleanupEnd);
  const cleanedRegion = region.replace(/<w:p\b[^>]*>(?:\s*<w:pPr>[\s\S]*?<\/w:pPr>)?\s*<\/w:p>/g, '');
  result = before + cleanedRegion + after;

  return result;
}

/**
 * Process native Word SDT (Structured Document Tag) checkboxes.
 * Finds <w:sdt> blocks containing <w14:checkbox>, reads the <w:tag> value,
 * resolves it to a field key, and toggles the checked state + display glyph.
 * For tagless SDT checkboxes, attempts to match nearby label text from labelMap.
 */
export function processSdtCheckboxes(
  content: string,
  fieldValues: Map<string, FieldValueData>,
  mergeTagMap: Record<string, string>,
  validFieldKeys?: Set<string>,
  labelMap?: Record<string, LabelMapping>
): string {
  // Match entire <w:sdt>…</w:sdt> blocks that contain a w14:checkbox element
  const sdtPattern = /<w:sdt\b[\s\S]*?<\/w:sdt>/g;

  return content.replace(sdtPattern, (sdtBlock, offset) => {
    // Only process SDTs that are checkboxes
    if (!/<w14:checkbox\b/.test(sdtBlock)) return sdtBlock;

    // Extract the tag value (the mapping key)
    const tagMatch = /<w:tag\s+w:val="([^"]+)"/i.exec(sdtBlock);

    let canonicalKey: string | null = null;

    if (tagMatch) {
      // Tagged SDT — resolve via tag name
      const tagName = tagMatch[1];
      canonicalKey = resolveFieldKeyWithMap(tagName, mergeTagMap, validFieldKeys);
    } else if (labelMap) {
      // Tagless SDT — look at surrounding text in the same table row or paragraph
      // to find a matching label from the labelMap
      const afterSdt = content.substring(offset + sdtBlock.length, offset + sdtBlock.length + 1000);
      // Extract plain text from the region after this SDT (same row / paragraph)
      const rowEnd = afterSdt.indexOf('</w:tr>');
      const paraEnd = afterSdt.indexOf('</w:p>');
      const searchEnd = Math.min(
        rowEnd >= 0 ? rowEnd : afterSdt.length,
        paraEnd >= 0 ? paraEnd : afterSdt.length,
        500
      );
      const searchRegion = afterSdt.substring(0, searchEnd);
      const textFragments = searchRegion.match(/<w:t[^>]*>([^<]+)<\/w:t>/g) || [];
      const plainText = textFragments
        .map((t) => t.replace(/<[^>]+>/g, ''))
        .join(' ')
        .replace(/\s+/g, ' ')
        .trim();

      // Try to find a matching label
      const normalizedPlainText = plainText.toLowerCase();
      const sortedLabelEntries = Object.entries(labelMap)
        .sort((a, b) => b[0].length - a[0].length);

      for (const [label, mapping] of sortedLabelEntries) {
        const normalizedLabel = label.toLowerCase().replace(/\s+/g, ' ').trim();
        if (normalizedPlainText.includes(normalizedLabel)) {
          canonicalKey = mapping.fieldKey;
          debugLog(`[tag-parser] Tagless SDT checkbox matched label "${label}" -> ${canonicalKey}`);
          break;
        }
      }

      if (!canonicalKey) {
        debugLog("[tag-parser] SDT checkbox found but no <w:tag> and no label match — skipping");
        return sdtBlock;
      }
    } else {
      debugLog("[tag-parser] SDT checkbox found but no <w:tag> — skipping");
      return sdtBlock;
    }

    const resolved = getFieldData(canonicalKey, fieldValues);

    // Determine boolean state — default to unchecked when no data exists
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
    const displayChar = isChecked ? "\u2611" : "\u2610"; // ☑ or ☐

    debugLog(`[tag-parser] SDT checkbox "${tagMatch?.[1] || '(tagless)'}" -> ${canonicalKey} = ${isChecked} (${displayChar})`);

    // 1. Toggle <w14:checked w14:val="..."/>
    let result = sdtBlock.replace(
      /(<w14:checked\s+w14:val=")([^"]*)("\s*\/>)/,
      `$1${checkedVal}$3`
    );

    result = result.replace(
      /(<w14:checkedState\s+w14:val=")([^"]*)("\s+w14:font="MS Gothic"\s*\/>)/,
      '$12611$3'
    );

    result = result.replace(
      /(<w14:uncheckedState\s+w14:val=")([^"]*)("\s+w14:font="MS Gothic"\s*\/>)/,
      '$12610$3'
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
 * Process {{#each collection}}...{{/each}} iteration blocks.
 * 
 * Finds all entities matching the collection prefix (e.g., "property" matches
 * property1, property2, etc.) and repeats the block content for each entity,
 * resolving inner tags like {{address}} to propertyN.address.
 */
export function processEachBlocks(
  content: string,
  fieldValues: Map<string, FieldValueData>,
  mergeTagMap: Record<string, string>,
  validFieldKeys?: Set<string>
): string {
  let result = content;
  let iterations = 0;
  const MAX_ITERATIONS = 20;

  while (iterations < MAX_ITERATIONS) {
    const eachPattern = /\{\{#each\s+([A-Za-z0-9_.]+)\}\}([\s\S]*?)\{\{\/each\}\}/;
    const eachMatch = eachPattern.exec(result);

    if (!eachMatch) break;

    const collectionPrefix = eachMatch[1]; // e.g., "property"
    const blockTemplate = eachMatch[2]; // content between {{#each}} and {{/each}}

    debugLog(`[tag-parser] Processing {{#each ${collectionPrefix}}}`);

    // Find all indexed entities matching this prefix (e.g., property1, property2, ...)
    const entityIndices = new Set<number>();
    const prefixLower = collectionPrefix.toLowerCase();

    // Use simple string matching instead of RegExp construction per key
    for (const [key] of fieldValues.entries()) {
      const keyLower = key.toLowerCase();
      if (!keyLower.startsWith(prefixLower)) continue;
      // Extract digits immediately after the prefix, followed by "."
      const rest = keyLower.substring(prefixLower.length);
      const dotIdx = rest.indexOf(".");
      if (dotIdx <= 0) continue;
      const numPart = rest.substring(0, dotIdx);
      if (/^\d+$/.test(numPart)) {
        entityIndices.add(parseInt(numPart, 10));
      }
    }

    // Sort indices numerically
    const sortedIndices = [...entityIndices].sort((a, b) => a - b);
    debugLog(`[tag-parser] Found ${sortedIndices.length} entities for "${collectionPrefix}": [${sortedIndices.join(', ')}]`);

    if (sortedIndices.length === 0) {
      // No entities found — remove the entire block
      result = result.substring(0, eachMatch.index) + result.substring(eachMatch.index + eachMatch[0].length);
    } else {
      // For each entity, clone the block and replace inner field references
      const expandedBlocks: string[] = [];

      for (const idx of sortedIndices) {
        let blockContent = blockTemplate;
        const entityPrefix = `${collectionPrefix}${idx}`; // e.g., "property1"

        // Find all merge tags within the block: {{fieldName}}, {{fieldName|transform}}, «fieldName»
        const innerCurlyTags = [...blockContent.matchAll(/\{\{([^}#/|]+)(?:\|([^}]+))?\}\}/g)];
        const innerChevronTags = [...blockContent.matchAll(/«([^»]+)»/g)];

        for (const tag of innerCurlyTags) {
          const innerFieldName = tag[1].trim();
          // Skip control tags
          if (innerFieldName.startsWith('#') || innerFieldName.startsWith('/') || innerFieldName === 'else') continue;

          const qualifiedKey = `${entityPrefix}.${innerFieldName}`; // e.g., "property1.address"
          const transform = tag[2]?.trim() || null;

          // Resolve the qualified key
          const canonicalKey = resolveFieldKeyWithMap(qualifiedKey, mergeTagMap, validFieldKeys);
          const resolved = getFieldData(canonicalKey, fieldValues);

          let resolvedValue = "";
          if (resolved?.data) {
            if (transform) {
              resolvedValue = applyTransform(resolved.data.rawValue, transform);
            } else {
              resolvedValue = formatByDataType(resolved.data.rawValue, resolved.data.dataType);
            }
          }

          // XML-escape resolved value before injecting into document XML.
          // Without this, values containing &, <, > break word/document.xml.
          // Use context-aware newline handling so we never emit an orphan
          // </w:t> outside an open text run (Word rejects such files).
          {
            const tagText = tag[0];
            const parts = blockContent.split(tagText);
            if (parts.length > 1) {
              let rebuilt = parts[0];
              for (let pi = 1; pi < parts.length; pi++) {
                rebuilt += formatValueForInsertion(resolvedValue, rebuilt, rebuilt.length);
                rebuilt += parts[pi];
              }
              blockContent = rebuilt;
            }
          }
        }

        for (const tag of innerChevronTags) {
          const innerFieldName = tag[1].trim();
          const qualifiedKey = `${entityPrefix}.${innerFieldName}`;
          const canonicalKey = resolveFieldKeyWithMap(qualifiedKey, mergeTagMap, validFieldKeys);
          const resolved = getFieldData(canonicalKey, fieldValues);

          let resolvedValue = "";
          if (resolved?.data) {
            resolvedValue = formatByDataType(resolved.data.rawValue, resolved.data.dataType);
          }

          {
            const tagText = tag[0];
            const parts = blockContent.split(tagText);
            if (parts.length > 1) {
              let rebuilt = parts[0];
              for (let pi = 1; pi < parts.length; pi++) {
                rebuilt += formatValueForInsertion(resolvedValue, rebuilt, rebuilt.length);
                rebuilt += parts[pi];
              }
              blockContent = rebuilt;
            }
          }
        }

        expandedBlocks.push(blockContent);
      }

      // Separate each iteration safely for Word XML:
      // - Paragraph blocks already contain their own structure, so concatenate directly
      // - Inline blocks inside <w:t> need an in-run Word break (<w:br/>)
      // - Fallback to plain newline when not in a text-run context
      const hasParagraphs = expandedBlocks.some(b => b.includes('<w:p>') || b.includes('<w:p '));
      const insideTextRun = (() => {
        const beforeIndex = eachMatch.index;
        const lastOpenText = result.lastIndexOf('<w:t', beforeIndex);
        const lastCloseText = result.lastIndexOf('</w:t>', beforeIndex);
        return lastOpenText > lastCloseText;
      })();

      const separator = hasParagraphs
        ? ''
        : insideTextRun
          ? '</w:t><w:br/><w:t xml:space="preserve">'
          : '\n';

      const expandedContent = expandedBlocks.join(separator);
      result = result.substring(0, eachMatch.index) + expandedContent + result.substring(eachMatch.index + eachMatch[0].length);
    }

    iterations++;
  }

  if (iterations >= MAX_ITERATIONS) {
    console.warn("[tag-parser] Hit max iterations for {{#each}} processing — stripping any remaining unmatched block markers to keep XML valid");
  }

  // Safety net: if any unmatched {{#each ...}} / {{/each}} markers survived
  // (malformed template, MAX_ITERATIONS hit, etc.), strip the literal markers
  // so they cannot end up rendered as text or mistaken for XML by Word.
  // Removing only the markers (not the content between them) preserves layout.
  result = result.replace(/\{\{#each\s+[A-Za-z0-9_.]+\}\}/g, "");
  result = result.replace(/\{\{\/each\}\}/g, "");

  return result;
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
  const contentLower = content.toLowerCase();
  const hasMergeMarkers = content.includes('{{') || content.includes('}}') || content.includes('«') || content.includes('»') || content.includes('MERGEFIELD') || content.includes('w:fldChar') || content.includes('w:fldSimple') || content.includes('w:instrText');
  const hasCheckboxes = content.includes('<w14:checkbox') && content.includes('<w:sdt');
  const hasRelevantLabel = Object.entries(labelMap).some(([label, mapping]) => {
    const quickNeedle = getLabelQuickNeedle(label, mapping);
    return quickNeedle ? contentLower.includes(quickNeedle) : false;
  });

  if (!hasMergeMarkers && !hasCheckboxes && !hasRelevantLabel) {
    return content;
  }

  // First normalize the XML to handle fragmented merge fields
  let result = normalizeWordXml(content);

  // Document-wide consolidation for control tags whose {{ ... }} brackets get
  // split by Word across multiple <w:r> or <w:p> boundaries. The paragraph-
  // scoped pass in normalizeWordXml() does not catch tags whose opening "{{"
  // and closing "}}" land in different paragraphs (common in table cells like
  // RE851A's Balloon Payment YES/NO checkboxes). We only collapse XML markup
  // between recognized control tokens — surrounding prose is never touched.
  const stripXmlBetween = (raw: string): string =>
    raw.replace(/<[^>]+>/g, "").replace(/\s+/g, " ").trim();

  result = result.replace(/\{\{([\s\S]{0,400}?)\}\}/g, (full, inner: string) => {
    // Only act if the inner span actually contains XML markup (i.e. fragmented).
    if (!inner.includes("<")) return full;
    const cleaned = stripXmlBetween(inner);
    if (/^#if\s+[A-Za-z0-9_.]+$/.test(cleaned)) {
      debugLog(`[tag-parser] Cross-run consolidated {{${cleaned}}}`);
      return `{{${cleaned}}}`;
    }
    if (/^#unless\s+[A-Za-z0-9_.]+$/.test(cleaned)) {
      debugLog(`[tag-parser] Cross-run consolidated {{${cleaned}}}`);
      return `{{${cleaned}}}`;
    }
    if (cleaned === "else" || cleaned === "/if" || cleaned === "/unless") {
      debugLog(`[tag-parser] Cross-run consolidated {{${cleaned}}}`);
      return `{{${cleaned}}}`;
    }
    return full;
  });

  // Unconditional safety net: strip BARE Handlebars-style control directives
  // that template authors sometimes leave in DOCX paragraphs as plain text
  // (i.e. NOT wrapped in {{ }}), e.g. a paragraph whose run text reads:
  //     #if (eq ld_p_lenderType "Individual")
  // The engine cannot evaluate such directives and they would otherwise print
  // verbatim. We only clear matching <w:t> run text; the surrounding run and
  // paragraph wrappers are kept so the template's layout/spacing is preserved.
  result = result.replace(
    /<w:t(\s[^>]*)?>\s*(?:#if|#unless|#each)\s*\([^<]*?\)\s*<\/w:t>/g,
    (m) => m.replace(/>\s*(?:#if|#unless|#each)\s*\([^<]*?\)\s*</, "><"),
  );
  result = result.replace(
    /<w:t(\s[^>]*)?>\s*(?:#if|#unless|#each)\s+[A-Za-z0-9_.]+\s*<\/w:t>/g,
    (m) => m.replace(/>\s*(?:#if|#unless|#each)\s+[A-Za-z0-9_.]+\s*</, "><"),
  );
  result = result.replace(
    /<w:t(\s[^>]*)?>\s*(?:\/if|\/unless|\/each|else)\s*<\/w:t>/g,
    (m) => m.replace(/>\s*(?:\/if|\/unless|\/each|else)\s*</, "><"),
  );

  if (result.includes('{{#each')) {
    result = processEachBlocks(result, fieldValues, mergeTagMap, validFieldKeys);
  }

  if (result.includes('{{#if') || result.includes('{{#unless')) {
    result = processConditionalBlocks(result, fieldValues, mergeTagMap, validFieldKeys);
  }

  if (result.includes('<w14:checkbox') && result.includes('<w:sdt')) {
    result = processSdtCheckboxes(result, fieldValues, mergeTagMap, validFieldKeys, labelMap);
  }

  // RE851A Part 2 fallback: some authored templates use literal bracket
  // markers ("[ ]", "[x]", "[X]") instead of checkbox glyphs (☐/☑) next to
  // the A. / B. broker-capacity labels. The downstream label-based replacer
  // only knows how to swap glyph characters, so we normalize bracket markers
  // immediately preceding any boolean label in labelMap into the equivalent
  // glyph here. The replacement is strictly bounded to the marker region —
  // surrounding text, spacing, and XML structure are preserved unchanged.
  if (result.includes('[') && result.includes(']')) {
    const booleanLabels = Object.entries(labelMap)
      .filter(([, mapping]) => {
        const fd = fieldValues.get(mapping.fieldKey);
        return fd?.dataType === 'boolean';
      })
      .map(([label]) => label)
      .sort((a, b) => b.length - a.length);

    for (const label of booleanLabels) {
      const labelPattern = buildXmlFlexibleLabelPattern(label);
      if (!labelPattern) continue;
      // [ ] or [x]/[X] possibly wrapped in XML, then optional whitespace/XML,
      // then the label text. Only the bracket marker is rewritten.
      const bracketBeforeLabel = new RegExp(
        `(<w:t[^>]*>)([^<]*?)\\[\\s*([xX]?)\\s*\\]([^<]*?</w:t>)((?:\\s|<[^>]+>)*?${labelPattern})(?![A-Za-z])`,
        'g'
      );
      result = result.replace(
        bracketBeforeLabel,
        (_m, wtOpen, pre, mark, wtTail, labelPart) => {
          const glyph = mark ? '☑' : '☐';
          return `${wtOpen}${pre}${glyph}${wtTail}${labelPart}`;
        }
      );
      // Plain-text fallback (no <w:t> wrapper) — same scoping, marker only.
      const plainBracketBeforeLabel = new RegExp(
        `\\[\\s*([xX]?)\\s*\\]((?:\\s|<[^>]+>)*?)(${labelPattern})(?![A-Za-z])`,
        'g'
      );
      result = result.replace(
        plainBracketBeforeLabel,
        (_m, mark, spacing, labelText) => {
          const glyph = mark ? '☑' : '☐';
          return `${glyph}${spacing}${labelText}`;
        }
      );
    }
  }

  if (result.includes('{{') || result.includes('}}')) {
    const openBraceCount = (result.match(/\{\{/g) || []).length;
    const closeBraceCount = (result.match(/\}\}/g) || []).length;
    if (openBraceCount > 0 || closeBraceCount > 0) {
      debugLog(`[tag-parser] After normalization: ${openBraceCount} opening {{ and ${closeBraceCount} closing }} detected`);
    }
  }

  // Parse and replace merge tags
  const tags = parseWordMergeFields(result);
  
  // Track which field keys were successfully replaced by merge tags
  // so label-based replacement can skip them (prevents label aliases from
  // damaging static document titles like "Loan No", "Current Lender", etc.)
  const replacedFieldKeys = new Set<string>();
  
  // Pre-resolve all tags and build a replacement map for single-pass replacement
  const tagReplacementMap = new Map<string, string>();
  const resolvedDataKeys = new Set<string>();
  for (const tag of tags) {
    // Use validFieldKeys for direct field_key resolution
    const canonicalKey = resolveFieldKeyWithMap(tag.tagName, mergeTagMap, validFieldKeys);
    // Resolve further through migration to find the "ultimate" field key
    const ultimateKey = resolveFieldKeyWithMap(canonicalKey, mergeTagMap, validFieldKeys);
    const ultimateKeyLower = ultimateKey.toLowerCase();
    
    // Always track merge tag fields so labels don't overwrite static titles
    replacedFieldKeys.add(canonicalKey);
    replacedFieldKeys.add(ultimateKey);
    if (canonicalKey !== ultimateKey) {
      debugLog(`[tag-parser] Tag ${tag.tagName}: canonical=${canonicalKey}, ultimate=${ultimateKey}`);
    }

    // Dedup: if another merge tag already resolved to same ultimate key, blank this one
    if (resolvedDataKeys.has(ultimateKeyLower)) {
      debugLog(`[tag-parser] Dedup: skipping ${tag.tagName} (ultimate ${ultimateKey} already resolved)`);
      tagReplacementMap.set(tag.fullMatch, "");
      continue;
    }
    resolvedDataKeys.add(ultimateKeyLower);

    // Use ultimateKey for data lookup (gets multi-property value when available)
    const resolved = getFieldData(ultimateKey, fieldValues) || getFieldData(canonicalKey, fieldValues);
    const fieldData = resolved?.data;
    let resolvedValue = "";
    
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
      // Strip leading "$" from currency values — the template already contains a literal "$" prefix
      if (fieldData.dataType === 'currency' && resolvedValue.startsWith('$')) {
        resolvedValue = resolvedValue.substring(1);
      }
      console.log(`[tag-parser] Replacing ${tag.tagName} -> ${transformKey} = "${resolvedValue.substring(0, 50)}"`);
    } else {
      console.log(`[tag-parser] No data for ${tag.tagName} (canonical: ${canonicalKey}, ultimate: ${ultimateKey})`);
    }
    
    // XML-escape the value to prevent corruption from &, <, >, ", ' characters.
    // Newline handling is deferred until insertion (see combinedRegex below) so
    // we never emit </w:t><w:br/><w:t> outside an open text run, which would
    // produce orphan tags and cause Word to refuse to open the file.
    const xmlSafeValue = escapeXmlValue(resolvedValue);
    tagReplacementMap.set(tag.fullMatch, xmlSafeValue);
  }

  // Single-pass replacement: build regex from all tag patterns and replace in one go
  if (tagReplacementMap.size > 0) {
    const escapedPatterns = [...tagReplacementMap.keys()].map(k =>
      k.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
    );
    const combinedRegex = new RegExp(escapedPatterns.join('|'), 'g');
    result = result.replace(combinedRegex, (match, offset: number) => {
      const replacement = tagReplacementMap.get(match);
      if (replacement === undefined) return match;
      if (!replacement.includes('\n')) return replacement;
      // Context-aware newline handling: only emit Word's in-run break form
      // when we're substituting inside an open <w:t> element. Otherwise the
      // </w:t><w:br/><w:t> fragment would create orphan tags and corrupt
      // the file.
      if (isInsideTextRun(result, offset)) {
        return replacement.replace(/\n/g, '</w:t><w:br/><w:t xml:space="preserve">');
      }
      return replacement.replace(/\n/g, ' ');
    });

    // Dedup: after merge tag replacement, collapse adjacent duplicate checkbox
    // glyphs that arise when a merge tag resolves to ☑/☐ next to a static ☐
    // already present in the template (e.g., "☑☐ Label" → "☑ Label").
    result = result.replace(
      /([☐☑☒])((?:\s|<[^>]*>)*?)([☐☑☒])/g,
      (_m, g1, mid, _g2) => `${g1}${mid}`
    );
  }
  
  // Always run label-based replacement after merge tag replacement
  debugLog(`[tag-parser] Running label-based replacement (${tags.length} merge tags were processed, ${replacedFieldKeys.size} fields already resolved)`);
  const labelResult = replaceLabelBasedFields(result, fieldValues, fieldTransforms, labelMap, replacedFieldKeys, mergeTagMap, validFieldKeys);
  result = labelResult.content;
  debugLog(`[tag-parser] Label-based replacement completed: ${labelResult.replacementCount} replacements`);

  // Final safety net: remove only merge tags that were explicitly parsed
  // and had no data. Do NOT globally remove all {{...}} patterns — that can
  // blank tags that normalization failed to consolidate but are still valid.
  if (tags.length > 0) {
    const noDataPatterns: string[] = [];
    for (const tag of tags) {
      const ck = resolveFieldKeyWithMap(tag.tagName, mergeTagMap, validFieldKeys);
      const resolved = getFieldData(ck, fieldValues);
      if (!resolved?.data) {
        noDataPatterns.push(tag.fullMatch.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'));
      }
    }
    if (noDataPatterns.length > 0) {
      debugLog(`[tag-parser] Cleaning ${noDataPatterns.length} no-data tags`);
      const noDataRegex = new RegExp(noDataPatterns.join('|'), 'g');
      result = result.replace(noDataRegex, '');
    }
  }

  // Post-replacement cleanup: remove paragraphs that now contain only empty
  // text runs (their merge tags were replaced with "" by no-data cleanup).
  // This prevents blank lines / extra spacing in the generated document.
  {
    let emptyParaCount = 0;
    result = processParaByPara(result, (para) => {
      // Extract all text content from the paragraph
      const textContent = para.replace(/<[^>]*>/g, '').trim();
      if (textContent !== '') return para;

      // Paragraph has no visible text — but only remove it if it previously
      // contained a merge tag (i.e., has empty <w:t> elements that likely
      // held tags). Paragraphs that were always empty are intentional spacing.
      if (/<w:t[^>]*>\s*<\/w:t>/.test(para) && /<w:r\b/.test(para)) {
        emptyParaCount++;
        return '';
      }
      return para;
    });
    if (emptyParaCount > 0) {
      debugLog(`[tag-parser] Removed ${emptyParaCount} empty paragraphs after tag replacement`);
    }
  }

  // Clean up orphaned {{ that remain as literal text after tag replacement.
  // These are artifacts of Word XML fragmentation where {{ was in a separate run
  // from the field code structure. The tag was resolved but {{ survived as text.
  // Only remove {{ that are NOT followed by }} within the same <w:t> context
  // (i.e., they are genuinely orphaned, not part of a valid {{tag}}).
  {
    let orphanCount = 0;
    // Match {{ in <w:t> elements that are NOT part of a valid {{...}} tag
    result = result.replace(/<w:t([^>]*)>([^<]*)<\/w:t>/g, (fullMatch, attrs, textContent) => {
      // If text contains {{ but NOT a complete {{...}} tag, strip the orphaned {{
      if (textContent.includes('{{') && !/\{\{[A-Za-z0-9_.| ]+\}\}/.test(textContent)) {
        const cleaned = textContent.replace(/\{\{/g, '');
        if (cleaned !== textContent) {
          orphanCount++;
          if (!cleaned.trim()) {
            // If the text is now empty or whitespace-only, preserve space
            return `<w:t${attrs}>${cleaned}</w:t>`;
          }
          return `<w:t${attrs}>${cleaned}</w:t>`;
        }
      }
      return fullMatch;
    });
    if (orphanCount > 0) {
      debugLog(`[tag-parser] Cleaned ${orphanCount} orphaned {{ from text runs`);
    }
  }

  // Clean up orphaned }} that remain as literal text after tag replacement.
  // Mirror of the orphaned {{ cleanup above — handles cases where Word splits
  // }} into a separate run from the resolved tag content.
  {
    let orphanCount = 0;
    result = result.replace(/<w:t([^>]*)>([^<]*)<\/w:t>/g, (fullMatch, attrs, textContent) => {
      if (textContent.includes('}}') && !/\{\{[A-Za-z0-9_.| ]+\}\}/.test(textContent)) {
        const cleaned = textContent.replace(/\}\}/g, '');
        if (cleaned !== textContent) {
          orphanCount++;
          return `<w:t${attrs}>${cleaned}</w:t>`;
        }
      }
      return fullMatch;
    });
    if (orphanCount > 0) {
      debugLog(`[tag-parser] Cleaned ${orphanCount} orphaned }} from text runs`);
    }
  }

  // Final pass: convert any remaining checkbox glyphs (☐/☑/☒) in <w:r>
  // elements into native Word SDT checkboxes so they are editable/clickable.
  result = convertGlyphsToSdtCheckboxes(result);

  return result;
}
