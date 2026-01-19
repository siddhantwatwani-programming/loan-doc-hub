import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import * as fflate from "https://esm.sh/fflate@0.8.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// ============================================
// Types
// ============================================

type OutputType = "docx_only" | "docx_and_pdf";
type RequestType = "single_doc" | "packet";
type GenerationStatus = "queued" | "running" | "success" | "failed";

interface GenerateDocumentRequest {
  dealId: string;
  templateId?: string;  // For single doc
  packetId?: string;    // For packet generation
  outputType?: OutputType;
}

interface TemplateFieldMap {
  field_dictionary_id: string;
  field_key: string;
  transform_rule: string | null;
  required_flag: boolean;
}

interface FieldDefinition {
  id: string;
  field_key: string;
  data_type: string;
  label: string;
}

interface DealFieldValue {
  field_dictionary_id: string;
  field_key: string;
  value_text: string | null;
  value_number: number | null;
  value_date: string | null;
}

interface Template {
  id: string;
  name: string;
  file_path: string | null;
}

interface GenerationResult {
  templateId: string;
  templateName: string;
  success: boolean;
  documentId?: string;
  versionNumber?: number;
  outputPath?: string;
  error?: string;
}

interface JobResult {
  jobId: string;
  dealId: string;
  requestType: RequestType;
  status: GenerationStatus;
  results: GenerationResult[];
  successCount: number;
  failCount: number;
  startedAt: string;
  completedAt?: string;
}

// ============================================
// Formatting Utilities
// ============================================

function formatCurrency(value: string | number | null): string {
  if (value === null || value === undefined || value === "") return "";
  const num = typeof value === "string" ? parseFloat(value) : value;
  if (isNaN(num)) return "";
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(num);
}

function formatCurrencyInWords(value: string | number | null): string {
  if (value === null || value === undefined || value === "") return "";
  const num = typeof value === "string" ? parseFloat(value) : value;
  if (isNaN(num)) return "";

  const dollars = Math.floor(num);
  const cents = Math.round((num - dollars) * 100);

  const words = numberToWords(dollars);
  return `${words} and ${cents.toString().padStart(2, "0")}/100 Dollars`;
}

function numberToWords(num: number): string {
  const ones = ["", "One", "Two", "Three", "Four", "Five", "Six", "Seven", "Eight", "Nine"];
  const teens = ["Ten", "Eleven", "Twelve", "Thirteen", "Fourteen", "Fifteen", "Sixteen", "Seventeen", "Eighteen", "Nineteen"];
  const tens = ["", "", "Twenty", "Thirty", "Forty", "Fifty", "Sixty", "Seventy", "Eighty", "Ninety"];
  const thousands = ["", "Thousand", "Million", "Billion"];

  if (num === 0) return "Zero";
  if (num < 0) return "Negative " + numberToWords(-num);

  let words = "";
  let i = 0;

  while (num > 0) {
    if (num % 1000 !== 0) {
      let chunk = "";
      const n = num % 1000;

      if (n >= 100) {
        chunk += ones[Math.floor(n / 100)] + " Hundred ";
      }

      const remainder = n % 100;
      if (remainder >= 10 && remainder < 20) {
        chunk += teens[remainder - 10] + " ";
      } else {
        if (remainder >= 20) {
          chunk += tens[Math.floor(remainder / 10)] + " ";
        }
        if (remainder % 10 > 0) {
          chunk += ones[remainder % 10] + " ";
        }
      }

      words = chunk + thousands[i] + " " + words;
    }
    num = Math.floor(num / 1000);
    i++;
  }

  return words.trim();
}

function formatDateMMDDYYYY(value: string | null): string {
  if (!value) return "";
  try {
    const date = new Date(value);
    if (isNaN(date.getTime())) return "";
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    const year = date.getFullYear();
    return `${month}/${day}/${year}`;
  } catch {
    return "";
  }
}

function formatDateLong(value: string | null): string {
  if (!value) return "";
  try {
    const date = new Date(value);
    if (isNaN(date.getTime())) return "";
    return date.toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" });
  } catch {
    return "";
  }
}

function formatDateShort(value: string | null): string {
  if (!value) return "";
  try {
    const date = new Date(value);
    if (isNaN(date.getTime())) return "";
    return date.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
  } catch {
    return "";
  }
}

function formatPercentage(value: string | number | null, decimals = 3): string {
  if (value === null || value === undefined || value === "") return "";
  const num = typeof value === "string" ? parseFloat(value) : value;
  if (isNaN(num)) return "";
  return `${num.toFixed(decimals)}%`;
}

function formatUppercase(value: string | null): string {
  if (!value) return "";
  return value.toUpperCase();
}

function formatTitlecase(value: string | null): string {
  if (!value) return "";
  return value.replace(/\w\S*/g, (txt) => txt.charAt(0).toUpperCase() + txt.substring(1).toLowerCase());
}

function formatLowercase(value: string | null): string {
  if (!value) return "";
  return value.toLowerCase();
}

function formatPhone(value: string | null): string {
  if (!value) return "";
  const digits = value.replace(/\D/g, "");
  if (digits.length === 10) {
    return `(${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6)}`;
  }
  return value;
}

function formatSSNMasked(value: string | null): string {
  if (!value) return "";
  const digits = value.replace(/\D/g, "");
  if (digits.length === 9) {
    return `XXX-XX-${digits.slice(5)}`;
  }
  return value;
}

// ============================================
// Value Resolution
// ============================================

function extractRawValue(fieldValue: DealFieldValue | undefined, dataType: string): string | number | null {
  if (!fieldValue) return null;

  switch (dataType) {
    case "currency":
    case "number":
    case "percentage":
      return fieldValue.value_number;
    case "date":
      return fieldValue.value_date;
    case "text":
    case "boolean":
    default:
      return fieldValue.value_text;
  }
}

function formatByDataType(value: string | number | null, dataType: string): string {
  if (value === null || value === undefined) return "";

  switch (dataType) {
    case "currency":
      return formatCurrency(value);
    case "percentage":
      return formatPercentage(value, 3);
    case "date":
      return formatDateMMDDYYYY(String(value));
    case "number":
      if (typeof value === "number") {
        return new Intl.NumberFormat("en-US").format(value);
      }
      const num = parseFloat(String(value));
      return isNaN(num) ? String(value) : new Intl.NumberFormat("en-US").format(num);
    case "boolean":
      const boolStr = String(value).toLowerCase();
      if (boolStr === "true" || boolStr === "1" || boolStr === "yes") return "Yes";
      if (boolStr === "false" || boolStr === "0" || boolStr === "no") return "No";
      return String(value);
    case "text":
    default:
      return String(value);
  }
}

function applyTransform(value: string | number | null, transform: string): string {
  if (value === null || value === undefined) return "";
  const valueStr = String(value);
  const t = transform.toLowerCase().trim();

  switch (t) {
    case "currency":
      return formatCurrency(value);
    case "currency_words":
      return formatCurrencyInWords(value);
    case "date":
    case "date_mmddyyyy":
      return formatDateMMDDYYYY(valueStr);
    case "date_long":
      return formatDateLong(valueStr);
    case "date_short":
      return formatDateShort(valueStr);
    case "uppercase":
      return formatUppercase(valueStr);
    case "titlecase":
      return formatTitlecase(valueStr);
    case "lowercase":
      return formatLowercase(valueStr);
    case "percentage":
      return formatPercentage(value);
    case "phone":
      return formatPhone(valueStr);
    case "ssn_masked":
      return formatSSNMasked(valueStr);
    default:
      return valueStr;
  }
}

// ============================================
// Merge Tag Parsing - Supports multiple formats
// ============================================

interface ParsedMergeTag {
  fullMatch: string;
  tagName: string;  // The raw tag name from the document
  inlineTransform: string | null;
}

// Map document merge tags to canonical field keys
// This allows the document to use its own naming convention
const MERGE_TAG_TO_FIELD_MAP: Record<string, string> = {
  // Borrower mappings
  "Borrower_Name": "Borrower.Name",
  "Borrower_Address": "Borrower.Address",
  "Borrower_address": "Borrower.Address",
  "Borrower_City": "Borrower.City",
  "Borrower_State": "Borrower.State",
  "Borrower_Zip": "Borrower.Zip",
  
  // Broker mappings
  "Broker_Name": "Broker.Name",
  "Broker_address": "Broker.Address",
  "Broker_Address": "Broker.Address",
  "Broker_License_": "Broker.License",
  "Broker_License": "Broker.License",
  "Broker_Rep": "Broker.Representative",
  "Broker_License_1": "Broker.License",
  
  // Loan terms mappings
  "Loan_Number": "Terms.LoanNumber",
  "Loan_Amount": "Terms.LoanAmount",
  "Amount_Funded": "Terms.LoanAmount",
  "Interest_Rate": "Terms.InterestRate",
  "Term_Months": "Terms.TermMonths",
  "First_Payment_Date": "Terms.FirstPaymentDate",
  "Maturity_Date": "Terms.MaturityDate",
  "Payment_Amount": "Terms.PaymentAmount",
  
  // Property mappings
  "Property_Address": "Property1.Address",
  "Property_address": "Property1.Address",
  "Property_City": "Property1.City",
  "Property_State": "Property1.State",
  "Property_Zip": "Property1.Zip",
  "Market_Value": "Property1.MarketValue",
  
  // System mappings
  "Document_Date": "System.DocumentDate",
  
  // Lender mappings (from template)
  "Lender_Name": "Lender.Name",
  "Lender_Vesting": "Lender.Vesting",
  "Lender_address": "Lender.Address",
  "Beneficial_interest_": "Lender.BeneficialInterest",
};

function resolveFieldKey(tagName: string): string {
  // Clean the tag name (remove trailing underscores, etc.)
  const cleanedTag = tagName.replace(/_+$/, "").trim();
  return MERGE_TAG_TO_FIELD_MAP[tagName] || MERGE_TAG_TO_FIELD_MAP[cleanedTag] || tagName;
}

/**
 * Normalize Word XML by consolidating fragmented text runs.
 * Word often splits text across multiple <w:t> elements within a run or across runs.
 * This function consolidates text within each paragraph to enable merge field detection.
 */
function normalizeWordXml(xmlContent: string): string {
  // Pattern to match a paragraph and consolidate its text runs
  // Word paragraphs are wrapped in <w:p>...</w:p>
  
  // First, let's handle the case where «field» is split across multiple <w:t> tags
  // We need to consolidate text within run elements <w:r>...</w:r>
  
  // Strategy: Find all text between « and » that may be split, and consolidate
  
  // Step 1: Find occurrences of « and » that might be split
  // We'll process the content to handle fragmented merge fields
  
  let result = xmlContent;
  
  // Pattern to find « possibly followed by fragmented XML until »
  // This handles cases like: «</w:t></w:r><w:r><w:t>Field_Name</w:t></w:r><w:r><w:t>»
  const fragmentedPattern = /«((?:<[^>]*>|\s)*?)([A-Za-z0-9_]+)((?:<[^>]*>|\s)*?)»/g;
  
  result = result.replace(fragmentedPattern, (match, pre, fieldName, post) => {
    // If there's XML in between, it means the field was fragmented
    if (pre.includes("<") || post.includes("<")) {
      console.log(`[generate-document] Found fragmented merge field: ${fieldName}`);
    }
    return `«${fieldName}»`;
  });
  
  // Also handle MERGEFIELD instructions in Word's field code format
  // Pattern: <w:instrText ... >MERGEFIELD Field_Name</w:instrText> ... <w:t>«Field_Name»</w:t>
  // These can also be fragmented
  
  // Handle case where merge field chevrons are in separate text nodes
  // Pattern: </w:t>...<w:t>«...» or «...</w:t>...<w:t>...»
  
  // More aggressive cleanup: find XML-fragmented chevron patterns
  const leftChevronFragmented = /«((?:<\/w:t><\/w:r><w:r(?:[^>]*)><w:t(?:[^>]*)>)+)/g;
  result = result.replace(leftChevronFragmented, (match, xmlFragment) => {
    return "«";
  });
  
  const rightChevronFragmented = /((?:<\/w:t><\/w:r><w:r(?:[^>]*)><w:t(?:[^>]*)>)+)»/g;
  result = result.replace(rightChevronFragmented, (match, xmlFragment) => {
    return "»";
  });
  
  // Handle underscores that get their own text runs
  // Pattern: Field</w:t></w:r><w:r><w:t>_</w:t></w:r><w:r><w:t>Name
  const fragmentedUnderscore = /([A-Za-z0-9]+)(<\/w:t><\/w:r><w:r(?:[^>]*)><w:t(?:[^>]*)>)_(<\/w:t><\/w:r><w:r(?:[^>]*)><w:t(?:[^>]*)>)?([A-Za-z0-9]+)/g;
  result = result.replace(fragmentedUnderscore, "$1_$4");
  
  return result;
}

// Parse Word merge field format: «field_name»
// In the XML, these appear as MERGEFIELD codes or direct Unicode chars
function parseWordMergeFields(content: string): ParsedMergeTag[] {
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
    // Create a synthetic tag for MERGEFIELD
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
  
  console.log(`[generate-document] Found ${tags.length} merge tags: ${tags.map(t => t.tagName).join(", ")}`);
  
  return tags;
}

function replaceMergeTags(
  content: string,
  fieldValues: Map<string, { rawValue: string | number | null; dataType: string }>,
  fieldTransforms: Map<string, string>
): string {
  // First normalize the XML to handle fragmented merge fields
  let result = normalizeWordXml(content);
  
  // Parse and replace merge tags
  const tags = parseWordMergeFields(result);
  
  for (const tag of tags) {
    const canonicalKey = resolveFieldKey(tag.tagName);
    const fieldData = fieldValues.get(canonicalKey);
    let resolvedValue = "";
    
    if (fieldData) {
      const transform = tag.inlineTransform || fieldTransforms.get(canonicalKey);
      
      if (transform) {
        resolvedValue = applyTransform(fieldData.rawValue, transform);
      } else {
        resolvedValue = formatByDataType(fieldData.rawValue, fieldData.dataType);
      }
      console.log(`[generate-document] Replacing ${tag.tagName} -> ${canonicalKey} = "${resolvedValue}"`);
    } else {
      console.log(`[generate-document] No data for ${tag.tagName} (canonical: ${canonicalKey})`);
    }
    // Leave unmapped/empty tags blank (as per requirements)
    
    result = result.split(tag.fullMatch).join(resolvedValue);
  }
  
  return result;
}

// ============================================
// DOCX Processing
// ============================================

async function processDocx(
  docxBuffer: Uint8Array,
  fieldValues: Map<string, { rawValue: string | number | null; dataType: string }>,
  fieldTransforms: Map<string, string>
): Promise<Uint8Array> {
  const decompressed = fflate.unzipSync(docxBuffer);
  const processedFiles: { [key: string]: Uint8Array } = {};

  for (const [filename, content] of Object.entries(decompressed)) {
    if (filename.endsWith(".xml") || filename.endsWith(".rels")) {
      const decoder = new TextDecoder("utf-8");
      let xmlContent = decoder.decode(content);
      xmlContent = replaceMergeTags(xmlContent, fieldValues, fieldTransforms);
      const encoder = new TextEncoder();
      processedFiles[filename] = encoder.encode(xmlContent);
    } else {
      processedFiles[filename] = content;
    }
  }

  const compressed = fflate.zipSync(processedFiles);
  return compressed;
}

// ============================================
// Single Document Generation
// ============================================

async function generateSingleDocument(
  supabase: any,
  dealId: string,
  templateId: string,
  packetId: string | null,
  outputType: OutputType,
  userId: string
): Promise<GenerationResult> {
  const result: GenerationResult = {
    templateId,
    templateName: "",
    success: false,
  };

  try {
    // 1. Fetch template info
    const { data: template, error: templateError } = await supabase
      .from("templates")
      .select("id, name, file_path, is_active")
      .eq("id", templateId)
      .single();

    if (templateError || !template) {
      result.error = "Template not found";
      return result;
    }

    result.templateName = template.name;

    if (!template.file_path) {
      result.error = "Template has no DOCX file";
      return result;
    }

    console.log(`[generate-document] Processing template: ${template.name}`);

    // 2. Fetch template field maps
    const { data: fieldMaps, error: fmError } = await supabase
      .from("template_field_maps")
      .select("field_dictionary_id, transform_rule, required_flag")
      .eq("template_id", templateId);

    if (fmError) {
      result.error = "Failed to fetch template field maps";
      return result;
    }

    // Get unique field dictionary IDs
    const fieldDictIds = [...new Set((fieldMaps || []).map((fm: any) => fm.field_dictionary_id).filter(Boolean))];

    // Fetch field dictionary entries
    const { data: fieldDictEntries } = await supabase
      .from("field_dictionary")
      .select("id, field_key, data_type, label")
      .in("id", fieldDictIds);

    // Create lookup map for field dictionary by ID
    const fieldDictMap = new Map<string, FieldDefinition>();
    (fieldDictEntries || []).forEach((fd: any) => fieldDictMap.set(fd.id, fd));

    // Build field maps with field_key from lookup
    const mappedFields: TemplateFieldMap[] = (fieldMaps || []).map((fm: any) => {
      const fieldDict = fieldDictMap.get(fm.field_dictionary_id);
      return {
        field_dictionary_id: fm.field_dictionary_id,
        field_key: fieldDict?.field_key || "",
        transform_rule: fm.transform_rule,
        required_flag: fm.required_flag,
      };
    });

    const fieldKeys = mappedFields.map((fm) => fm.field_key).filter(Boolean);
    const fieldTransforms = new Map<string, string>();
    mappedFields.forEach((fm) => {
      if (fm.transform_rule && fm.field_key) {
        fieldTransforms.set(fm.field_key, fm.transform_rule);
      }
    });

    // Build field definitions from lookup
    const fieldDefMap = new Map<string, FieldDefinition>();
    fieldDictMap.forEach((fd, id) => {
      fieldDefMap.set(fd.field_key, fd);
    });

    // 3. Fetch deal field values
    const { data: dealFieldValues } = await supabase
      .from("deal_field_values")
      .select("field_dictionary_id, value_text, value_number, value_date")
      .eq("deal_id", dealId);

    const fieldValues = new Map<string, { rawValue: string | number | null; dataType: string }>();
    (dealFieldValues || []).forEach((dfv: any) => {
      const fieldDict = fieldDictMap.get(dfv.field_dictionary_id);
      if (fieldDict) {
        const fieldKey = fieldDict.field_key;
        const dataType = fieldDict.data_type || "text";
        const rawValue = extractRawValue({ field_dictionary_id: dfv.field_dictionary_id, field_key: fieldKey, value_text: dfv.value_text, value_number: dfv.value_number, value_date: dfv.value_date }, dataType);
        fieldValues.set(fieldKey, { rawValue, dataType });
      }
    });

    console.log(`[generate-document] Resolved ${fieldValues.size} field values for ${template.name}`);

    // 5. Download template DOCX from storage (or fallback to public URL)
    let fileData: Blob | null = null;
    
    // Try storage first
    const { data: storageData, error: fileError } = await supabase.storage
      .from("templates")
      .download(template.file_path);

    if (!fileError && storageData) {
      fileData = storageData;
      console.log(`[generate-document] Downloaded template from storage: ${template.file_path}`);
    } else {
      // Fallback: Try to fetch from public URL (for templates stored in public folder)
      console.log(`[generate-document] Storage download failed, trying public URL fallback...`);
      const supabaseUrl = Deno.env.get("SUPABASE_URL") || "";
      // Extract the project ref from the Supabase URL
      const projectRef = supabaseUrl.replace("https://", "").split(".")[0];
      
      // Try multiple public URL patterns
      const publicUrls = [
        `https://${projectRef}.supabase.co/storage/v1/object/public/templates/${template.file_path}`,
        // Also try the lovable preview URL pattern
      ];
      
      for (const url of publicUrls) {
        try {
          const response = await fetch(url);
          if (response.ok) {
            fileData = await response.blob();
            console.log(`[generate-document] Downloaded template from public URL: ${url}`);
            break;
          }
        } catch (e) {
          console.log(`[generate-document] Failed to fetch from ${url}: ${e}`);
        }
      }
    }

    if (!fileData) {
      console.error(`[generate-document] Failed to download template: ${template.file_path}`);
      result.error = "Failed to download template file. Please upload the template to storage.";
      return result;
    }

    // 6. Process the DOCX
    const templateBuffer = new Uint8Array(await fileData.arrayBuffer());
    const processedDocx = await processDocx(templateBuffer, fieldValues, fieldTransforms);

    console.log(`[generate-document] Processed DOCX: ${processedDocx.length} bytes`);

    // 7. Calculate version number (trigger handles this, but we track for response)
    const { data: existingDocs } = await supabase
      .from("generated_documents")
      .select("version_number")
      .eq("deal_id", dealId)
      .eq("template_id", templateId)
      .order("version_number", { ascending: false })
      .limit(1);

    const versionNumber = existingDocs && existingDocs.length > 0 ? existingDocs[0].version_number + 1 : 1;

    // 8. Upload generated document to storage (use generated-docs bucket)
    const timestamp = Date.now();
    const outputFileName = `${dealId}/${templateId}_v${versionNumber}_${timestamp}.docx`;

    const { error: uploadError } = await supabase.storage
      .from("generated-docs")
      .upload(outputFileName, processedDocx, {
        contentType: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        upsert: false,
      });

    if (uploadError) {
      console.error(`[generate-document] Upload error:`, uploadError);
      result.error = "Failed to save generated document";
      return result;
    }

    console.log(`[generate-document] Uploaded to generated-docs: ${outputFileName}`);

    // 9. Handle PDF conversion using CloudConvert
    let pdfPath: string | null = null;
    if (outputType === "docx_and_pdf") {
      const cloudConvertApiKey = Deno.env.get("CLOUDCONVERT_API_KEY");
      
      if (cloudConvertApiKey) {
        try {
          console.log(`[generate-document] Starting PDF conversion via CloudConvert...`);
          
          // Create a CloudConvert job for conversion
          const jobResponse = await fetch("https://api.cloudconvert.com/v2/jobs", {
            method: "POST",
            headers: {
              "Authorization": `Bearer ${cloudConvertApiKey}`,
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              tasks: {
                "import-docx": {
                  operation: "import/base64",
                  file: btoa(String.fromCharCode(...processedDocx)),
                  filename: `document.docx`,
                },
                "convert-pdf": {
                  operation: "convert",
                  input: ["import-docx"],
                  output_format: "pdf",
                },
                "export-pdf": {
                  operation: "export/url",
                  input: ["convert-pdf"],
                },
              },
            }),
          });

          if (!jobResponse.ok) {
            const errorText = await jobResponse.text();
            console.error(`[generate-document] CloudConvert job creation failed: ${errorText}`);
            throw new Error("PDF conversion job creation failed");
          }

          const jobData = await jobResponse.json();
          const jobId = jobData.data.id;
          console.log(`[generate-document] CloudConvert job created: ${jobId}`);

          // Poll for job completion (max 60 seconds)
          let completed = false;
          let exportUrl: string | null = null;
          const startTime = Date.now();
          
          while (!completed && (Date.now() - startTime) < 60000) {
            await new Promise(resolve => setTimeout(resolve, 2000));
            
            const statusResponse = await fetch(`https://api.cloudconvert.com/v2/jobs/${jobId}`, {
              headers: {
                "Authorization": `Bearer ${cloudConvertApiKey}`,
              },
            });

            if (!statusResponse.ok) continue;

            const statusData = await statusResponse.json();
            const jobStatus = statusData.data.status;

            if (jobStatus === "finished") {
              completed = true;
              // Find the export task result
              const exportTask = statusData.data.tasks.find((t: any) => t.operation === "export/url");
              if (exportTask?.result?.files?.[0]?.url) {
                exportUrl = exportTask.result.files[0].url;
              }
            } else if (jobStatus === "error") {
              console.error(`[generate-document] CloudConvert job failed`);
              break;
            }
          }

          if (exportUrl) {
            // Download the PDF from CloudConvert
            const pdfResponse = await fetch(exportUrl);
            if (pdfResponse.ok) {
              const pdfBuffer = new Uint8Array(await pdfResponse.arrayBuffer());
              
              // Upload PDF to storage
              const pdfFileName = outputFileName.replace('.docx', '.pdf');
              const { error: pdfUploadError } = await supabase.storage
                .from("generated-docs")
                .upload(pdfFileName, pdfBuffer, {
                  contentType: "application/pdf",
                  upsert: false,
                });

              if (!pdfUploadError) {
                pdfPath = pdfFileName;
                console.log(`[generate-document] PDF uploaded: ${pdfFileName}`);
              } else {
                console.error(`[generate-document] PDF upload failed:`, pdfUploadError);
              }
            }
          }
        } catch (pdfError: any) {
          console.error(`[generate-document] PDF conversion error:`, pdfError);
          // Continue without PDF - don't fail the whole generation
        }
      } else {
        console.log(`[generate-document] PDF conversion requested but CLOUDCONVERT_API_KEY not set`);
      }
    }

    // 10. Create generated_documents record
    const isRegeneration = versionNumber > 1;
    const { data: generatedDoc, error: insertError } = await supabase
      .from("generated_documents")
      .insert({
        deal_id: dealId,
        template_id: templateId,
        packet_id: packetId,
        output_docx_path: outputFileName,
        output_pdf_path: pdfPath,
        output_type: outputType,
        version_number: versionNumber,
        created_by: userId,
        generation_status: "success",
        error_message: null,
      })
      .select()
      .single();

    if (insertError) {
      result.error = "Failed to create document record";
      return result;
    }

    console.log(`[generate-document] Created document record: ${generatedDoc.id}`);

    // 11. Log activity
    const actionType = isRegeneration ? "DocumentRegenerated" : "DocumentGenerated";
    await supabase.from("activity_log").insert({
      deal_id: dealId,
      actor_user_id: userId,
      action_type: actionType,
      action_details: {
        templateId,
        templateName: result.templateName,
        versionNumber,
        documentId: generatedDoc.id,
        outputType,
      },
    });

    console.log(`[generate-document] Logged activity: ${actionType}`);

    result.success = true;
    result.documentId = generatedDoc.id;
    result.versionNumber = versionNumber;
    result.outputPath = outputFileName;

    return result;
  } catch (error: any) {
    console.error(`[generate-document] Error processing ${result.templateName}:`, error);
    result.error = error.message || "Unknown error";
    return result;
  }
}

// ============================================
// Main Handler
// ============================================

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const supabase = createClient(supabaseUrl, supabaseKey);

  try {
    // Authenticate user
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Missing authorization header" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const token = authHeader.replace("Bearer ", "");
    const { data: userData, error: userError } = await supabase.auth.getUser(token);
    if (userError || !userData.user) {
      return new Response(JSON.stringify({ error: "Invalid token" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const userId = userData.user.id;
    console.log(`[generate-document] User: ${userId}`);

    // Parse request
    const { dealId, templateId, packetId, outputType = "docx_only" }: GenerateDocumentRequest = await req.json();

    if (!dealId) {
      return new Response(JSON.stringify({ error: "dealId is required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (!templateId && !packetId) {
      return new Response(JSON.stringify({ error: "Either templateId or packetId is required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const requestType: RequestType = templateId ? "single_doc" : "packet";
    console.log(`[generate-document] Request type: ${requestType}, deal: ${dealId}`);

    // Verify deal exists and is in ready/generated status
    const { data: deal, error: dealError } = await supabase
      .from("deals")
      .select("id, deal_number, status, packet_id")
      .eq("id", dealId)
      .single();

    if (dealError || !deal) {
      return new Response(JSON.stringify({ error: "Deal not found" }), {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (deal.status !== "ready" && deal.status !== "generated") {
      return new Response(
        JSON.stringify({ error: "Deal must be in Ready or Generated status" }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // Create GenerationJob record
    const { data: job, error: jobError } = await supabase
      .from("generation_jobs")
      .insert({
        deal_id: dealId,
        requested_by: userId,
        request_type: requestType,
        packet_id: packetId || deal.packet_id,
        template_id: templateId || null,
        output_type: outputType,
        status: "running",
        started_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (jobError) {
      console.error("[generate-document] Failed to create job:", jobError);
      return new Response(JSON.stringify({ error: "Failed to create generation job" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    console.log(`[generate-document] Created job: ${job.id}`);

    const jobResult: JobResult = {
      jobId: job.id,
      dealId,
      requestType,
      status: "running",
      results: [],
      successCount: 0,
      failCount: 0,
      startedAt: job.started_at,
    };

    try {
      if (requestType === "single_doc" && templateId) {
        // Single document generation
        const result = await generateSingleDocument(
          supabase,
          dealId,
          templateId,
          deal.packet_id,
          outputType,
          userId
        );
        jobResult.results.push(result);
        
        if (result.success) {
          jobResult.successCount++;
        } else {
          jobResult.failCount++;
        }
      } else if (packetId || deal.packet_id) {
        // Packet generation - iterate all templates in order
        const effectivePacketId = packetId || deal.packet_id;
        
        const { data: packetTemplates, error: ptError } = await supabase
          .from("packet_templates")
          .select("template_id, templates(id, name, file_path)")
          .eq("packet_id", effectivePacketId)
          .order("display_order");

        if (ptError) {
          throw new Error("Failed to fetch packet templates");
        }

        console.log(`[generate-document] Processing ${packetTemplates?.length || 0} templates in packet`);

        for (const pt of (packetTemplates || [])) {
          const template = (pt as any).templates as Template;
          
          if (!template?.file_path) {
            jobResult.results.push({
              templateId: pt.template_id,
              templateName: template?.name || "Unknown",
              success: false,
              error: "Template has no DOCX file",
            });
            jobResult.failCount++;
            continue;
          }

          const result = await generateSingleDocument(
            supabase,
            dealId,
            pt.template_id,
            effectivePacketId,
            outputType,
            userId
          );
          
          jobResult.results.push(result);
          
          if (result.success) {
            jobResult.successCount++;
          } else {
            jobResult.failCount++;
          }
        }
      }

      // Determine final job status
      const completedAt = new Date().toISOString();
      let finalStatus: GenerationStatus;
      let errorMessage: string | null = null;

      if (jobResult.failCount === 0 && jobResult.successCount > 0) {
        finalStatus = "success";
      } else if (jobResult.successCount === 0 && jobResult.failCount > 0) {
        finalStatus = "failed";
        const failures = jobResult.results.filter(r => !r.success);
        errorMessage = failures.map(f => `${f.templateName}: ${f.error}`).join("; ");
      } else {
        // Partial success - still mark as success but include error details
        finalStatus = "success";
        const failures = jobResult.results.filter(r => !r.success);
        errorMessage = `Partial: ${failures.length} failed - ${failures.map(f => f.templateName).join(", ")}`;
      }

      // Update job record
      await supabase
        .from("generation_jobs")
        .update({
          status: finalStatus,
          completed_at: completedAt,
          error_message: errorMessage,
        })
        .eq("id", job.id);

      jobResult.status = finalStatus;
      jobResult.completedAt = completedAt;

      // Update deal status to generated if successful and was ready
      if (jobResult.successCount > 0 && deal.status === "ready") {
        await supabase.from("deals").update({ status: "generated" }).eq("id", dealId);
        console.log(`[generate-document] Updated deal status to generated`);
      }

      console.log(`[generate-document] Job ${job.id} completed: ${jobResult.successCount} success, ${jobResult.failCount} failed`);

      return new Response(JSON.stringify(jobResult), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });

    } catch (error: any) {
      // Mark job as failed
      const completedAt = new Date().toISOString();
      await supabase
        .from("generation_jobs")
        .update({
          status: "failed",
          completed_at: completedAt,
          error_message: error.message || "Unknown error",
        })
        .eq("id", job.id);

      jobResult.status = "failed";
      jobResult.completedAt = completedAt;

      console.error("[generate-document] Job failed:", error);

      return new Response(JSON.stringify({
        ...jobResult,
        error: error.message || "Unknown error",
      }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

  } catch (error: any) {
    console.error("[generate-document] Unexpected error:", error);
    return new Response(
      JSON.stringify({ error: error.message || "Unknown error" }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
