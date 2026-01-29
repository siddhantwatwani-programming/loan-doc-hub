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
 */
export async function processDocx(
  docxBuffer: Uint8Array,
  fieldValues: Map<string, FieldValueData>,
  fieldTransforms: Map<string, string>,
  mergeTagMap: Record<string, string>,
  labelMap: Record<string, LabelMapping>
): Promise<Uint8Array> {
  const decompressed = fflate.unzipSync(docxBuffer);
  const processedFiles: { [key: string]: Uint8Array } = {};

  for (const [filename, content] of Object.entries(decompressed)) {
    if (filename.endsWith(".xml") || filename.endsWith(".rels")) {
      const decoder = new TextDecoder("utf-8");
      let xmlContent = decoder.decode(content);
      xmlContent = replaceMergeTags(xmlContent, fieldValues, fieldTransforms, mergeTagMap, labelMap);
      const encoder = new TextEncoder();
      processedFiles[filename] = encoder.encode(xmlContent);
    } else {
      processedFiles[filename] = content;
    }
  }

  const compressed = fflate.zipSync(processedFiles);
  return compressed;
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
