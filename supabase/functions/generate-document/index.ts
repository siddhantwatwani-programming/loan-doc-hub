import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import * as fflate from "https://esm.sh/fflate@0.8.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Types
interface TemplateFieldMap {
  field_key: string;
  transform_rule: string | null;
  required_flag: boolean;
}

interface FieldDefinition {
  field_key: string;
  data_type: string;
  label: string;
}

interface DealFieldValue {
  field_key: string;
  value_text: string | null;
  value_number: number | null;
  value_date: string | null;
}

interface GenerateDocumentRequest {
  dealId: string;
  templateId: string;
  outputType?: "docx_only" | "docx_and_pdf";
}

// ============================================
// Formatting Utilities (duplicated from fieldTransforms.ts for edge function context)
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
// Merge Tag Parsing
// ============================================

interface ParsedMergeTag {
  fullMatch: string;
  fieldKey: string;
  inlineTransform: string | null;
}

/**
 * Parse merge tags from content
 * Supports: {{FieldKey}} and {{FieldKey | transform}}
 */
function parseMergeTags(content: string): ParsedMergeTag[] {
  const tagPattern = /\{\{([^}|]+)(?:\s*\|\s*([^}]+))?\}\}/g;
  const tags: ParsedMergeTag[] = [];
  let match;

  while ((match = tagPattern.exec(content)) !== null) {
    tags.push({
      fullMatch: match[0],
      fieldKey: match[1].trim(),
      inlineTransform: match[2]?.trim() || null,
    });
  }

  return tags;
}

/**
 * Replace merge tags in content with resolved values
 */
function replaceMergeTags(
  content: string,
  fieldValues: Map<string, { rawValue: string | number | null; dataType: string }>,
  fieldTransforms: Map<string, string>
): string {
  const tags = parseMergeTags(content);

  let result = content;
  for (const tag of tags) {
    const fieldData = fieldValues.get(tag.fieldKey);
    let resolvedValue = "";

    if (fieldData) {
      // Priority: inline transform > templateFieldMap transform > default dataType formatting
      const transform = tag.inlineTransform || fieldTransforms.get(tag.fieldKey);

      if (transform) {
        resolvedValue = applyTransform(fieldData.rawValue, transform);
      } else {
        resolvedValue = formatByDataType(fieldData.rawValue, fieldData.dataType);
      }
    }

    // Replace all occurrences of this exact tag
    result = result.split(tag.fullMatch).join(resolvedValue);
  }

  return result;
}

// ============================================
// DOCX Processing
// ============================================

/**
 * Extract and process a DOCX file
 * DOCX is a ZIP archive containing XML files
 */
async function processDocx(
  docxBuffer: Uint8Array,
  fieldValues: Map<string, { rawValue: string | number | null; dataType: string }>,
  fieldTransforms: Map<string, string>
): Promise<Uint8Array> {
  // Decompress the DOCX (ZIP) file
  const decompressed = fflate.unzipSync(docxBuffer);

  // Process each XML file in the archive
  const processedFiles: { [key: string]: Uint8Array } = {};

  for (const [filename, content] of Object.entries(decompressed)) {
    if (filename.endsWith(".xml") || filename.endsWith(".rels")) {
      // Decode XML content as text
      const decoder = new TextDecoder("utf-8");
      let xmlContent = decoder.decode(content);

      // Replace merge tags in XML content
      xmlContent = replaceMergeTags(xmlContent, fieldValues, fieldTransforms);

      // Encode back to bytes
      const encoder = new TextEncoder();
      processedFiles[filename] = encoder.encode(xmlContent);
    } else {
      // Keep non-XML files as-is (images, etc.)
      processedFiles[filename] = content;
    }
  }

  // Recompress to DOCX
  const compressed = fflate.zipSync(processedFiles);
  return compressed;
}

// ============================================
// Main Handler
// ============================================

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Get authorization header for user context
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Missing authorization header" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Verify user and get their ID
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
    const { dealId, templateId, outputType = "docx_only" }: GenerateDocumentRequest = await req.json();

    if (!dealId || !templateId) {
      return new Response(JSON.stringify({ error: "dealId and templateId are required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    console.log(`[generate-document] Processing deal: ${dealId}, template: ${templateId}`);

    // 1. Verify deal exists and is in ready status
    const { data: deal, error: dealError } = await supabase
      .from("deals")
      .select("id, deal_number, status, packet_id")
      .eq("id", dealId)
      .single();

    if (dealError || !deal) {
      console.error("[generate-document] Deal not found:", dealError);
      return new Response(JSON.stringify({ error: "Deal not found" }), {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (deal.status !== "ready" && deal.status !== "generated") {
      return new Response(
        JSON.stringify({ error: "Deal must be in Ready or Generated status to generate documents" }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // 2. Fetch template info
    const { data: template, error: templateError } = await supabase
      .from("templates")
      .select("id, name, file_path, is_active")
      .eq("id", templateId)
      .single();

    if (templateError || !template) {
      console.error("[generate-document] Template not found:", templateError);
      return new Response(JSON.stringify({ error: "Template not found" }), {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (!template.file_path) {
      return new Response(JSON.stringify({ error: "Template has no DOCX file" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    console.log(`[generate-document] Template: ${template.name}, file: ${template.file_path}`);

    // 3. Fetch template field maps
    const { data: fieldMaps, error: fmError } = await supabase
      .from("template_field_maps")
      .select("field_key, transform_rule, required_flag")
      .eq("template_id", templateId);

    if (fmError) {
      console.error("[generate-document] Error fetching field maps:", fmError);
      return new Response(JSON.stringify({ error: "Failed to fetch template field maps" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const fieldKeys = (fieldMaps || []).map((fm: TemplateFieldMap) => fm.field_key);
    const fieldTransforms = new Map<string, string>();
    (fieldMaps || []).forEach((fm: TemplateFieldMap) => {
      if (fm.transform_rule) {
        fieldTransforms.set(fm.field_key, fm.transform_rule);
      }
    });

    console.log(`[generate-document] Field keys: ${fieldKeys.length}, transforms: ${fieldTransforms.size}`);

    // 4. Fetch field definitions
    const { data: fieldDefs, error: fdError } = await supabase
      .from("field_dictionary")
      .select("field_key, data_type, label")
      .in("field_key", fieldKeys.length > 0 ? fieldKeys : ["__none__"]);

    if (fdError) {
      console.error("[generate-document] Error fetching field definitions:", fdError);
    }

    const fieldDefMap = new Map<string, FieldDefinition>();
    (fieldDefs || []).forEach((fd: FieldDefinition) => {
      fieldDefMap.set(fd.field_key, fd);
    });

    // 5. Fetch deal field values
    const { data: dealFieldValues, error: dfvError } = await supabase
      .from("deal_field_values")
      .select("field_key, value_text, value_number, value_date")
      .eq("deal_id", dealId)
      .in("field_key", fieldKeys.length > 0 ? fieldKeys : ["__none__"]);

    if (dfvError) {
      console.error("[generate-document] Error fetching deal field values:", dfvError);
    }

    // Build field values map
    const fieldValues = new Map<string, { rawValue: string | number | null; dataType: string }>();
    (dealFieldValues || []).forEach((dfv: DealFieldValue) => {
      const fieldDef = fieldDefMap.get(dfv.field_key);
      const dataType = fieldDef?.data_type || "text";
      const rawValue = extractRawValue(dfv, dataType);
      fieldValues.set(dfv.field_key, { rawValue, dataType });
    });

    console.log(`[generate-document] Resolved ${fieldValues.size} field values`);

    // 6. Download template DOCX from storage
    const { data: fileData, error: fileError } = await supabase.storage
      .from("templates")
      .download(template.file_path);

    if (fileError || !fileData) {
      console.error("[generate-document] Error downloading template:", fileError);
      return new Response(JSON.stringify({ error: "Failed to download template file" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    console.log(`[generate-document] Downloaded template: ${fileData.size} bytes`);

    // 7. Process the DOCX
    const templateBuffer = new Uint8Array(await fileData.arrayBuffer());
    const processedDocx = await processDocx(templateBuffer, fieldValues, fieldTransforms);

    console.log(`[generate-document] Processed DOCX: ${processedDocx.length} bytes`);

    // 8. Calculate version number
    const { data: existingDocs, error: versionError } = await supabase
      .from("generated_documents")
      .select("version_number")
      .eq("deal_id", dealId)
      .eq("template_id", templateId)
      .order("version_number", { ascending: false })
      .limit(1);

    const versionNumber = existingDocs && existingDocs.length > 0 ? existingDocs[0].version_number + 1 : 1;

    // 9. Upload generated document to storage
    const timestamp = Date.now();
    const outputFileName = `generated/${dealId}/${templateId}_v${versionNumber}_${timestamp}.docx`;

    const { error: uploadError } = await supabase.storage
      .from("templates")
      .upload(outputFileName, processedDocx, {
        contentType: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        upsert: false,
      });

    if (uploadError) {
      console.error("[generate-document] Error uploading generated document:", uploadError);
      return new Response(JSON.stringify({ error: "Failed to save generated document" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    console.log(`[generate-document] Uploaded to: ${outputFileName}`);

    // 10. Create generated_documents record
    const { data: generatedDoc, error: insertError } = await supabase
      .from("generated_documents")
      .insert({
        deal_id: dealId,
        template_id: templateId,
        packet_id: deal.packet_id,
        output_docx_path: outputFileName,
        output_pdf_path: null, // PDF generation not implemented yet
        output_type: outputType,
        version_number: versionNumber,
        created_by: userId,
        generation_status: "success",
        error_message: null,
      })
      .select()
      .single();

    if (insertError) {
      console.error("[generate-document] Error creating document record:", insertError);
      return new Response(JSON.stringify({ error: "Failed to create document record" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    console.log(`[generate-document] Created document record: ${generatedDoc.id}`);

    // 11. Update deal status to generated if first successful generation
    if (deal.status === "ready") {
      await supabase.from("deals").update({ status: "generated" }).eq("id", dealId);
      console.log(`[generate-document] Updated deal status to generated`);
    }

    // Return success response
    return new Response(
      JSON.stringify({
        success: true,
        document: {
          id: generatedDoc.id,
          dealId: dealId,
          templateId: templateId,
          templateName: template.name,
          versionNumber: versionNumber,
          outputPath: outputFileName,
          generatedAt: generatedDoc.created_at,
        },
      }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("[generate-document] Unexpected error:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
