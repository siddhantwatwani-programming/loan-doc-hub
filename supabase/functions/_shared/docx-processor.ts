/**
 * DOCX Processing Utilities
 * 
 * Handles ZIP/XML manipulation for Word documents,
 * including decompression, XML processing, and recompression.
 */

import * as fflate from "https://esm.sh/fflate@0.8.2";
import type { FieldValueData, LabelMapping } from "./types.ts";
import { replaceMergeTags } from "./tag-parser.ts";

/**
 * Process a DOCX file by replacing merge tags with field values
 * @param validFieldKeys - Set of valid field keys from field_dictionary for direct matching
 */
const PROCESSED_XML_COMPRESSION_LEVEL = 1;
const UNCHANGED_XML_COMPRESSION_LEVEL = 0;

const PROCESSED_XML_COMPRESSION_LEVEL = 0;
const UNCHANGED_XML_COMPRESSION_LEVEL = 0;

export async function processDocx(
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
        console.log(`[docx-processor] Processing content XML: ${filename} (${content.length} bytes)`);
        const originalXml = decoder.decode(content);
        let processedXml = replaceMergeTags(originalXml, fieldValues, fieldTransforms, mergeTagMap, labelMap, validFieldKeys);

        // Post-process: ensure Signature paragraph has a page break before it
        if (filename === "word/document.xml") {
          processedXml = ensureSignaturePageBreak(processedXml);
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
    console.log("[docx-processor] No Signature paragraph found; skipping page-break injection.");
  } else if (injectedPageBreak) {
    console.log("[docx-processor] Injected pageBreakBefore into Signature paragraph.");
  } else {
    console.log("[docx-processor] Signature paragraph already has pageBreakBefore.");
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
