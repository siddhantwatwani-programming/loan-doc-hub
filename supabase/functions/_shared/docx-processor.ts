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

const W14_NS = 'http://schemas.microsoft.com/office/word/2010/wordml';

/**
 * If the processed XML contains any w14:* token (typically introduced by
 * convertGlyphsToSdtCheckboxes injecting <w14:checkbox> blocks) but the
 * part's root element does not declare the w14 namespace, inject the
 * declaration into the root opening tag. Without this, Google Docs and
 * strict XML parsers reject the file as namespace-invalid even though
 * Word's tolerant parser may still open it.
 *
 * This is a localized string edit on the root opening tag only — it does
 * NOT change content, formatting, layout, or template structure.
 */
function ensureW14Namespace(xml: string, partName: string): string {
  // Quick exit: no w14: usage means no injection needed.
  if (!/(<|\s)w14:/.test(xml)) return xml;

  // Determine root element name for this part.
  let rootName: string | null = null;
  if (partName === 'word/document.xml') rootName = 'w:document';
  else if (partName.startsWith('word/header')) rootName = 'w:hdr';
  else if (partName.startsWith('word/footer')) rootName = 'w:ftr';
  else if (partName.startsWith('word/footnotes')) rootName = 'w:footnotes';
  else if (partName.startsWith('word/endnotes')) rootName = 'w:endnotes';
  if (!rootName) return xml;

  // Match the root opening tag (first occurrence).
  const rootOpenRegex = new RegExp(`<${rootName.replace(':', '\\:')}\\b([^>]*)>`);
  const match = xml.match(rootOpenRegex);
  if (!match) return xml;

  const attrs = match[1] || '';
  // If w14 already declared, no-op.
  if (/\bxmlns:w14\s*=/.test(attrs)) return xml;

  // Inject xmlns:w14 (and add w14 to mc:Ignorable if present so older
  // readers ignore the new prefix gracefully).
  let newAttrs = attrs + ` xmlns:w14="${W14_NS}"`;
  const ignorableMatch = newAttrs.match(/\bmc:Ignorable\s*=\s*"([^"]*)"/);
  if (ignorableMatch) {
    const tokens = ignorableMatch[1].split(/\s+/).filter(Boolean);
    if (!tokens.includes('w14')) {
      tokens.push('w14');
      newAttrs = newAttrs.replace(
        /\bmc:Ignorable\s*=\s*"[^"]*"/,
        `mc:Ignorable="${tokens.join(' ')}"`
      );
    }
  }

  return xml.replace(rootOpenRegex, `<${rootName}${newAttrs}>`);

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

        // If the post-pass injected w14:* (e.g. <w14:checkbox>) into a part
        // whose root does not declare the w14 namespace, inject the
        // declaration. Required for Google Docs / strict parsers to open.
        processedXml = ensureW14Namespace(processedXml, filename);

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

  // Defensive integrity check: re-open the produced ZIP and assert that
  // EVERY processed content-bearing XML part is well-formed enough for
  // Word to open. The previous version only checked word/document.xml,
  // which let malformed headers/footers/footnotes/endnotes through and
  // caused Word's "file could not be opened" error on download.
  try {
    const verify = fflate.unzipSync(compressed);
    const verifyDecoder = new TextDecoder("utf-8");

    const docXmlBytes = verify["word/document.xml"];
    if (!docXmlBytes) {
      throw new Error("DOCX_INTEGRITY: word/document.xml missing from generated package");
    }

    // Identify every content-bearing XML part we may have edited. This
    // mirrors the isContentPart filter above.
    const contentPartNames = Object.keys(verify).filter((filename) =>
      filename === "word/document.xml" ||
      filename.startsWith("word/header") ||
      filename.startsWith("word/footer") ||
      filename.startsWith("word/footnotes") ||
      filename.startsWith("word/endnotes")
    ).filter((filename) => filename.endsWith(".xml"));

    const countOpens = (xml: string, tag: string) => {
      const re = new RegExp(`<${tag}(\\s[^>]*[^/])?>`, 'g');
      return (xml.match(re) || []).length;
    };
    const countCloses = (xml: string, tag: string) =>
      (xml.match(new RegExp(`</${tag}>`, 'g')) || []).length;

    for (const partName of contentPartNames) {
      const bytes = verify[partName];
      if (!bytes) continue;
      const xml = verifyDecoder.decode(bytes);
      const trimmed = xml.trim();

      if (!trimmed.startsWith("<?xml")) {
        throw new Error(`DOCX_INTEGRITY: ${partName} does not start with <?xml prolog`);
      }

      // Determine the expected closing root element for this part.
      let rootClose: string | null = null;
      if (partName === "word/document.xml") rootClose = "</w:document>";
      else if (partName.startsWith("word/header")) rootClose = "</w:hdr>";
      else if (partName.startsWith("word/footer")) rootClose = "</w:ftr>";
      else if (partName.startsWith("word/footnotes")) rootClose = "</w:footnotes>";
      else if (partName.startsWith("word/endnotes")) rootClose = "</w:endnotes>";

      if (rootClose && !trimmed.endsWith(rootClose)) {
        throw new Error(`DOCX_INTEGRITY: ${partName} is truncated (missing ${rootClose})`);
      }

      // Tag-balance check on the structural elements that, when unbalanced,
      // produce the "file could not be opened" error in Word. Orphaned
      // text-run tags from malformed merge-tag substitutions are the
      // historical root cause of corrupted .docx files.
      for (const tag of ['w:p', 'w:r', 'w:t']) {
        const opens = countOpens(xml, tag);
        const closes = countCloses(xml, tag);
        if (opens !== closes) {
          throw new Error(
            `DOCX_INTEGRITY: ${partName} has unbalanced <${tag}> tags (open=${opens}, close=${closes})`
          );
        }
      }

      // Reject any leftover \uFFFD or SDT placeholder markers — internal
      // artifacts of convertGlyphsToSdtCheckboxes that must never reach the
      // output. Google Docs rejects \uFFFD inside element / attribute names.
      if (xml.includes('\uFFFD')) {
        throw new Error(`DOCX_INTEGRITY: ${partName} contains stray U+FFFD replacement char`);
      }
      if (xml.includes('_SDT_PLACEHOLDER_')) {
        throw new Error(`DOCX_INTEGRITY: ${partName} contains unrestored SDT placeholder marker`);
      }

      // If this part uses the w14 prefix anywhere, its root element MUST
      // declare xmlns:w14. Without it, the file is namespace-invalid and
      // Google Docs / strict parsers will refuse to open it.
      if (/(<|\s)w14:/.test(xml)) {
        let rootOpenRegex: RegExp | null = null;
        if (partName === "word/document.xml") rootOpenRegex = /<w:document\b([^>]*)>/;
        else if (partName.startsWith("word/header")) rootOpenRegex = /<w:hdr\b([^>]*)>/;
        else if (partName.startsWith("word/footer")) rootOpenRegex = /<w:ftr\b([^>]*)>/;
        else if (partName.startsWith("word/footnotes")) rootOpenRegex = /<w:footnotes\b([^>]*)>/;
        else if (partName.startsWith("word/endnotes")) rootOpenRegex = /<w:endnotes\b([^>]*)>/;

        if (rootOpenRegex) {
          const m = xml.match(rootOpenRegex);
          if (!m || !/\bxmlns:w14\s*=/.test(m[1] || '')) {
            throw new Error(
              `DOCX_INTEGRITY: ${partName} uses w14:* but root element is missing xmlns:w14 declaration`
            );
          }
        }
      }
    }
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    if (!message.startsWith("DOCX_INTEGRITY")) {
      throw new Error(`DOCX_INTEGRITY: ${message}`);
    }
    throw err;
  }

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

  return updatedXml;
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
