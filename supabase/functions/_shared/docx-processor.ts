/**
 * DOCX Processing Utilities
 * 
 * Handles ZIP/XML manipulation for Word documents,
 * including decompression, XML processing, and recompression.
 */

import * as fflate from "https://esm.sh/fflate@0.8.2";
import type { FieldValueData, LabelMapping } from "./types.ts";
import { replaceMergeTags } from "./tag-parser.ts";

const DOC_GEN_DEBUG = Deno.env.get("DOC_GEN_DEBUG") === "true";
const debugLog = (...args: unknown[]) => {
  if (DOC_GEN_DEBUG) {
    console.log(...args);
  }
};

/**
 * Process a DOCX file by replacing merge tags with field values.
 * @param docxBuffer - The source DOCX file bytes
 * @param validFieldKeys - Set of valid field keys from field_dictionary for direct matching
 */
const PROCESSED_XML_COMPRESSION_LEVEL = 0;
const UNCHANGED_XML_COMPRESSION_LEVEL = 0;

function hasLikelyMergeWork(xml: string, labelMap: Record<string, LabelMapping>): boolean {
  if (
    xml.includes("{{") ||
    xml.includes("}}") ||
    xml.includes("«") ||
    xml.includes("»") ||
    xml.includes("MERGEFIELD") ||
    xml.includes("w:fldChar") ||
    xml.includes("w:fldSimple") ||
    xml.includes("w:instrText") ||
    (xml.includes("<w14:checkbox") && xml.includes("<w:sdt"))
  ) {
    return true;
  }

  if (Object.keys(labelMap).length === 0) {
    return false;
  }

  const xmlLower = xml.toLowerCase();
  return Object.entries(labelMap).some(([label, mapping]) => {
    const quickNeedle = (mapping.replaceNext || (label === "as of _"
      ? "as of"
      : label.endsWith(":")
        ? label.slice(0, -1)
        : label)).toLowerCase();
    return quickNeedle.length > 0 && xmlLower.includes(quickNeedle);
  });
}

export async function processDocx(
  docxBuffer: Uint8Array,
  fieldValues: Map<string, FieldValueData>,
  fieldTransforms: Map<string, string>,
  mergeTagMap: Record<string, string>,
  labelMap: Record<string, LabelMapping>,
  validFieldKeys?: Set<string>
): Promise<Uint8Array> {
  const decompressed = fflate.unzipSync(docxBuffer);
  const processedFiles: fflate.Zippable = {};
  const decoder = new TextDecoder("utf-8");
  const encoder = new TextEncoder();

  for (const [filename, content] of Object.entries(decompressed)) {
    if (filename.endsWith(".xml") || filename.endsWith(".rels")) {
      // Only run merge tag replacement on content-bearing XML parts.
      // Processing styles, numbering, settings, themes, etc. risks corrupting
      // their XML structure (no merge tags exist there anyway).
      const isContentPart = filename === "word/document.xml" ||
        filename.startsWith("word/header") ||
        filename.startsWith("word/footer") ||
        filename.startsWith("word/footnotes") ||
        filename.startsWith("word/endnotes");

      if (isContentPart) {
        debugLog(`[docx-processor] Processing content XML: ${filename} (${content.length} bytes)`);
        const originalXml = decoder.decode(content);

        if (!hasLikelyMergeWork(originalXml, labelMap)) {
          processedFiles[filename] = [content, { level: UNCHANGED_XML_COMPRESSION_LEVEL }];
          continue;
        }

        let processedXml = replaceMergeTags(originalXml, fieldValues, fieldTransforms, mergeTagMap, labelMap, validFieldKeys);
        processedXml = ensureWordCheckboxNamespaces(processedXml);

        // Post-process: ensure Signature paragraph has a page break before it,
        // but ONLY if the original template already contains page breaks or section
        // breaks. Single-page templates (like Addendum to LPDS) must not have
        // page breaks injected, as that would push content to a second page.
        if (filename === "word/document.xml") {
          const hasExistingPageBreaks = originalXml.includes('w:pageBreakBefore') ||
            originalXml.includes('<w:br w:type="page"') ||
            originalXml.includes('w:type="nextPage"') ||
            originalXml.includes('w:type="oddPage"') ||
            originalXml.includes('w:type="evenPage"');
          if (hasExistingPageBreaks) {
            processedXml = ensureSignaturePageBreak(processedXml);
          } else {
            debugLog("[docx-processor] Skipping signature page-break injection (single-page template — no existing page breaks).");
          }
        }

        if (processedXml === originalXml) {
          processedFiles[filename] = [content, { level: UNCHANGED_XML_COMPRESSION_LEVEL }];
        } else {
          processedFiles[filename] = [encoder.encode(processedXml), { level: PROCESSED_XML_COMPRESSION_LEVEL }];
        }
      } else {
        // Non-content XML: preserve original bytes with minimal recompression to reduce CPU time
        processedFiles[filename] = [content, { level: UNCHANGED_XML_COMPRESSION_LEVEL }];
      }
    } else {
      // Binary files: store without recompression to preserve exact bytes
      processedFiles[filename] = [content, { level: 0 }];
    }
  }

  const compressed = fflate.zipSync(processedFiles);
  return compressed;
}

function processWordParagraphs(xml: string, fn: (para: string) => string): string {
  const chunks: string[] = [];
  let pos = 0;

  while (pos < xml.length) {
    const pStart = xml.indexOf("<w:p", pos);
    if (pStart === -1) {
      chunks.push(xml.substring(pos));
      break;
    }

    if (pStart > pos) {
      chunks.push(xml.substring(pos, pStart));
    }

    const pEnd = xml.indexOf("</w:p>", pStart);
    if (pEnd === -1) {
      chunks.push(xml.substring(pStart));
      break;
    }

    const paraEnd = pEnd + 6;
    const para = xml.substring(pStart, paraEnd);
    chunks.push(fn(para));
    pos = paraEnd;
  }

  return chunks.join("");
}

/**
 * Ensure the paragraph containing "Signature:" + underscores always starts on a new page.
 * Injects <w:pageBreakBefore w:val="1"/> into its <w:pPr> block if not already present.
 */
function ensureSignaturePageBreak(xml: string): string {
  let foundSignatureParagraph = false;
  let injectedPageBreak = false;

  const updatedXml = processWordParagraphs(xml, (para) => {
    if (foundSignatureParagraph) return para;
    if (!para.includes("Signature") || !para.includes("_")) return para;

    const textOnly = para.replace(/<[^>]*>/g, "");
    if (!textOnly.includes("Signature:") || !textOnly.includes("_")) {
      return para;
    }

    foundSignatureParagraph = true;

    if (para.includes("w:pageBreakBefore")) {
      return para;
    }

    injectedPageBreak = true;

    const pPrMatch = para.match(/(<w:pPr\b[^>]*>)/);
    if (pPrMatch) {
      return para.replace(
        pPrMatch[1],
        pPrMatch[1] + '<w:pageBreakBefore w:val="1"/>'
      );
    }

    return para.replace(
      /(<w:p\b[^>]*>)/,
      '$1<w:pPr><w:pageBreakBefore w:val="1"/></w:pPr>'
    );
  });

  if (!foundSignatureParagraph) {
    debugLog("[docx-processor] No Signature paragraph found; skipping page-break injection.");
  } else if (injectedPageBreak) {
    debugLog("[docx-processor] Injected pageBreakBefore into Signature paragraph.");
  } else {
    debugLog("[docx-processor] Signature paragraph already has pageBreakBefore.");
  }

}

function ensureWordCheckboxNamespaces(xml: string): string {
  if (!xml.includes('<w14:checkbox')) return xml;

  let result = xml;

  result = result.replace(/<w:document\b([^>]*)>/, (match, attrs) => {
    let nextAttrs = attrs;

    if (!/\sxmlns:w14=/.test(nextAttrs)) {
      nextAttrs += ' xmlns:w14="http://schemas.microsoft.com/office/word/2010/wordml"';
    }

    const ignorableMatch = nextAttrs.match(/\smc:Ignorable="([^"]*)"/);
    if (ignorableMatch) {
      const tokens = ignorableMatch[1].split(/\s+/).filter(Boolean);
      if (!tokens.includes('w14')) {
        const updated = [...tokens, 'w14'].join(' ');
        nextAttrs = nextAttrs.replace(/\smc:Ignorable="([^"]*)"/, ` mc:Ignorable="${updated}"`);
      }
    } else {
      nextAttrs += ' mc:Ignorable="w14"';
    }

    if (!/\sxmlns:mc=/.test(nextAttrs)) {
      nextAttrs += ' xmlns:mc="http://schemas.openxmlformats.org/markup-compatibility/2006"';
    }

    return `<w:document${nextAttrs}>`;
  });

  return result;
}

/**
 * Extract XML content from a DOCX file without processing
 * Useful for validation and tag extraction
 */
export function extractDocxXml(docxBuffer: Uint8Array): Map<string, string> {
  const decompressed = fflate.unzipSync(docxBuffer);
  const xmlContents = new Map<string, string>();
  const decoder = new TextDecoder("utf-8");

  for (const [filename, content] of Object.entries(decompressed)) {
    if (filename.endsWith(".xml") || filename.endsWith(".rels")) {
      xmlContents.set(filename, decoder.decode(content));
    }
  }

  return xmlContents;
}

/**
 * Get the main document XML from a DOCX file
 */
export function getMainDocumentXml(docxBuffer: Uint8Array): string | null {
  const xmlContents = extractDocxXml(docxBuffer);
  
  // The main document is typically at word/document.xml
  return xmlContents.get("word/document.xml") || null;
}
