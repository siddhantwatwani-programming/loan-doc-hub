import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import * as fflate from "https://esm.sh/fflate@0.8.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface ValidateTemplateRequest {
  templateId?: string;      // Validate existing template by ID
  templateFile?: string;    // Base64-encoded DOCX file for new upload validation
  includeDocumentText?: boolean;  // Return extracted document text
  includeFieldDictionary?: boolean; // Return field dictionary info for mapped tags
}

interface FoundTag {
  tag: string;
  tagName: string;
  tagType: "merge_tag" | "label" | "f_code" | "curly_brace";
  fieldKey: string | null;
  mapped: boolean;
  suggestions?: string[];
  fieldDictionaryInfo?: {
    id: string;
    label: string;
    data_type: string;
    section: string;
    description: string | null;
  } | null;
}

interface ValidationResult {
  valid: boolean;
  totalTagsFound: number;
  mappedTags: FoundTag[];
  unmappedTags: FoundTag[];
  warnings: string[];
  errors: string[];
  summary: {
    mergeTagCount: number;
    labelCount: number;
    fCodeCount: number;
    curlyBraceCount: number;
    mappedCount: number;
    unmappedCount: number;
  };
  documentText?: string;
}

// ============================================
// DOCX Parsing - Extract text from XML files
// ============================================

function extractTextFromXml(xmlContent: string): string {
  // Remove XML tags but keep text content
  // First, extract text from <w:t> tags specifically
  const textMatches: string[] = [];
  const wtPattern = /<w:t[^>]*>([^<]*)<\/w:t>/g;
  let match;
  while ((match = wtPattern.exec(xmlContent)) !== null) {
    textMatches.push(match[1]);
  }
  return textMatches.join(" ");
}

function normalizeWordXml(xmlContent: string): string {
  let result = xmlContent;
  
  // Pattern to find « possibly followed by fragmented XML until »
  const fragmentedPattern = /«((?:<[^>]*>|\s)*?)([A-Za-z0-9_]+)((?:<[^>]*>|\s)*?)»/g;
  result = result.replace(fragmentedPattern, (match, pre, fieldName, post) => {
    return `«${fieldName}»`;
  });
  
  // Handle fragmented underscores
  const fragmentedUnderscore = /([A-Za-z0-9]+)(<\/w:t><\/w:r><w:r(?:[^>]*)><w:t(?:[^>]*)>)_(<\/w:t><\/w:r><w:r(?:[^>]*)><w:t(?:[^>]*)>)?([A-Za-z0-9]+)/g;
  result = result.replace(fragmentedUnderscore, "$1_$4");
  
  return result;
}

// ============================================
// Tag Detection
// ============================================

function findMergeTags(content: string): { tag: string; tagName: string; tagType: "merge_tag" | "curly_brace" | "f_code" }[] {
  const tags: { tag: string; tagName: string; tagType: "merge_tag" | "curly_brace" | "f_code" }[] = [];
  const seenTags = new Set<string>();
  
  // Pattern 1: Unicode chevrons «field_name»
  const unicodePattern = /«([^»]+)»/g;
  let match;
  while ((match = unicodePattern.exec(content)) !== null) {
    const tagName = match[1].trim();
    if (!seenTags.has(tagName)) {
      seenTags.add(tagName);
      // Check if it looks like an F-code (F followed by digits)
      const isF_code = /^F\d{4,}$/.test(tagName);
      tags.push({
        tag: match[0],
        tagName,
        tagType: isF_code ? "f_code" : "merge_tag",
      });
    }
  }
  
  // Pattern 2: Double curly braces {{field_name}} or {{field_name|transform}}
  const curlyPattern = /\{\{([^}|]+)(?:\s*\|\s*([^}]+))?\}\}/g;
  while ((match = curlyPattern.exec(content)) !== null) {
    const tagName = match[1].trim();
    if (!seenTags.has(tagName)) {
      seenTags.add(tagName);
      tags.push({
        tag: match[0],
        tagName,
        tagType: "curly_brace",
      });
    }
  }
  
  // Pattern 3: Word MERGEFIELD in instrText
  const mergeFieldPattern = /MERGEFIELD\s+([A-Za-z0-9_]+)/gi;
  while ((match = mergeFieldPattern.exec(content)) !== null) {
    const fieldName = match[1].trim();
    if (!seenTags.has(fieldName)) {
      seenTags.add(fieldName);
      tags.push({
        tag: `«${fieldName}»`,
        tagName: fieldName,
        tagType: "merge_tag",
      });
    }
  }
  
  return tags;
}

function findLabels(content: string, labelMap: Map<string, { fieldKey: string; replaceNext?: string }>): { tag: string; tagName: string; fieldKey: string }[] {
  const labels: { tag: string; tagName: string; fieldKey: string }[] = [];
  
  for (const [labelText, mapping] of labelMap) {
    // Check if the content contains this label (case-insensitive)
    const pattern = new RegExp(labelText.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'gi');
    if (pattern.test(content)) {
      labels.push({
        tag: labelText,
        tagName: labelText,
        fieldKey: mapping.fieldKey,
      });
    }
  }
  
  return labels;
}

// ============================================
// Fuzzy Matching for Suggestions
// ============================================

function levenshteinDistance(a: string, b: string): number {
  const matrix: number[][] = [];
  
  for (let i = 0; i <= b.length; i++) {
    matrix[i] = [i];
  }
  for (let j = 0; j <= a.length; j++) {
    matrix[0][j] = j;
  }
  
  for (let i = 1; i <= b.length; i++) {
    for (let j = 1; j <= a.length; j++) {
      if (b.charAt(i - 1) === a.charAt(j - 1)) {
        matrix[i][j] = matrix[i - 1][j - 1];
      } else {
        matrix[i][j] = Math.min(
          matrix[i - 1][j - 1] + 1,
          matrix[i][j - 1] + 1,
          matrix[i - 1][j] + 1
        );
      }
    }
  }
  
  return matrix[b.length][a.length];
}

function findSuggestions(tagName: string, allFieldKeys: string[], maxSuggestions = 3): string[] {
  const normalizedTag = tagName.toLowerCase().replace(/[^a-z0-9]/g, '');
  
  const scored = allFieldKeys.map(key => ({
    key,
    distance: levenshteinDistance(normalizedTag, key.toLowerCase().replace(/[^a-z0-9]/g, '')),
    containsMatch: key.toLowerCase().includes(normalizedTag) || normalizedTag.includes(key.toLowerCase().replace(/\./g, '')),
  }));
  
  // Sort by distance, preferring contains matches
  scored.sort((a, b) => {
    if (a.containsMatch && !b.containsMatch) return -1;
    if (!a.containsMatch && b.containsMatch) return 1;
    return a.distance - b.distance;
  });
  
  return scored
    .slice(0, maxSuggestions)
    .filter(s => s.distance < 10) // Only suggest if reasonably close
    .map(s => s.key);
}

// ============================================
// Main Handler
// ============================================

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const body = await req.json() as ValidateTemplateRequest;
    const { templateId, templateFile, includeDocumentText, includeFieldDictionary } = body;

    if (!templateId && !templateFile) {
      return new Response(
        JSON.stringify({ error: "Either templateId or templateFile is required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    let docxBytes: Uint8Array;
    let templateName = "Uploaded Template";

    // 1. Get the DOCX file content
    if (templateId) {
      // Fetch template from database
      const { data: template, error: templateError } = await supabase
        .from("templates")
        .select("id, name, file_path")
        .eq("id", templateId)
        .single();

      if (templateError || !template) {
        return new Response(
          JSON.stringify({ error: "Template not found" }),
          { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      templateName = template.name;

      if (!template.file_path) {
        return new Response(
          JSON.stringify({ error: "Template has no file uploaded" }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      // Download from storage
      const { data: fileData, error: downloadError } = await supabase.storage
        .from("templates")
        .download(template.file_path);

      if (downloadError || !fileData) {
        return new Response(
          JSON.stringify({ error: `Failed to download template: ${downloadError?.message}` }),
          { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      docxBytes = new Uint8Array(await fileData.arrayBuffer());
    } else {
      // Decode base64 file
      const binaryString = atob(templateFile!);
      docxBytes = new Uint8Array(binaryString.length);
      for (let i = 0; i < binaryString.length; i++) {
        docxBytes[i] = binaryString.charCodeAt(i);
      }
    }

    // 2. Unzip and read document.xml
    const unzipped = fflate.unzipSync(docxBytes);
    const xmlFiles = ["word/document.xml", "word/header1.xml", "word/header2.xml", "word/footer1.xml", "word/footer2.xml"];
    
    let allContent = "";
    let allRawXml = "";
    
    for (const xmlFile of xmlFiles) {
      if (unzipped[xmlFile]) {
        const xmlContent = new TextDecoder().decode(unzipped[xmlFile]);
        const normalizedXml = normalizeWordXml(xmlContent);
        allRawXml += normalizedXml + " ";
        allContent += extractTextFromXml(normalizedXml) + " ";
      }
    }

    // 3. Fetch merge tag aliases from database
    const { data: aliases, error: aliasError } = await supabase
      .from("merge_tag_aliases")
      .select("tag_name, field_key, tag_type, replace_next, is_active")
      .eq("is_active", true);

    if (aliasError) {
      console.error("Failed to fetch merge tag aliases:", aliasError);
    }

    // Build lookup maps
    const mergeTagMap = new Map<string, string>();
    const labelMap = new Map<string, { fieldKey: string; replaceNext?: string }>();
    
    for (const alias of (aliases || [])) {
      if (alias.tag_type === "merge_tag" || alias.tag_type === "f_code") {
        mergeTagMap.set(alias.tag_name, alias.field_key);
        // Also add lowercase version for case-insensitive matching
        mergeTagMap.set(alias.tag_name.toLowerCase(), alias.field_key);
      } else if (alias.tag_type === "label") {
        labelMap.set(alias.tag_name, {
          fieldKey: alias.field_key,
          replaceNext: alias.replace_next || undefined,
        });
      }
    }

    // 4. Fetch all field keys from dictionary for suggestions (and metadata if requested)
    const { data: fieldDictionaryData } = await supabase
      .from("field_dictionary")
      .select("id, field_key, label, data_type, section, description");
    
    const allFieldKeys = (fieldDictionaryData || []).map(fd => fd.field_key);
    
    // Build a Set for efficient O(1) lookups (used for direct field_key matching)
    const validFieldKeys = new Set<string>(allFieldKeys);
    
    // Build a map for quick lookup of field dictionary info (case-insensitive)
    const fieldDictMap = new Map<string, {
      id: string;
      label: string;
      data_type: string;
      section: string;
      description: string | null;
    }>();
    for (const fd of (fieldDictionaryData || [])) {
      fieldDictMap.set(fd.field_key, {
        id: fd.id,
        label: fd.label,
        data_type: fd.data_type,
        section: fd.section,
        description: fd.description,
      });
      // Also map lowercase for case-insensitive lookup
      fieldDictMap.set(fd.field_key.toLowerCase(), {
        id: fd.id,
        label: fd.label,
        data_type: fd.data_type,
        section: fd.section,
        description: fd.description,
      });
    }
    
    console.log(`[validate-template] Built validFieldKeys set with ${validFieldKeys.size} entries`);

    // 5. Find all tags in the document
    const foundMergeTags = findMergeTags(allRawXml);
    const foundLabels = findLabels(allContent, labelMap);

    // 6. Check each tag against mappings
    const mappedTags: FoundTag[] = [];
    const unmappedTags: FoundTag[] = [];
    const warnings: string[] = [];
    const errors: string[] = [];

    // Process merge tags
    for (const tag of foundMergeTags) {
      // Priority 1: Check explicit alias mapping
      let fieldKey = mergeTagMap.get(tag.tagName) || mergeTagMap.get(tag.tagName.toLowerCase());
      let resolvedVia = "alias";
      
      // Priority 2: Check direct field_key match (new behavior)
      if (!fieldKey) {
        // Exact match
        if (validFieldKeys.has(tag.tagName)) {
          fieldKey = tag.tagName;
          resolvedVia = "direct";
        }
        // Case-insensitive match
        else {
          const lowerTag = tag.tagName.toLowerCase();
          for (const key of validFieldKeys) {
            if (key.toLowerCase() === lowerTag) {
              fieldKey = key;
              resolvedVia = "direct_case_insensitive";
              break;
            }
          }
        }
        // Try underscore-to-dot conversion
        if (!fieldKey) {
          const dotVersion = tag.tagName.replace(/_/g, ".");
          if (validFieldKeys.has(dotVersion)) {
            fieldKey = dotVersion;
            resolvedVia = "direct_underscore_converted";
          } else {
            for (const key of validFieldKeys) {
              if (key.toLowerCase() === dotVersion.toLowerCase()) {
                fieldKey = key;
                resolvedVia = "direct_underscore_case_insensitive";
                break;
              }
            }
          }
        }
      }
      
      if (fieldKey) {
        const dictInfo = includeFieldDictionary ? (fieldDictMap.get(fieldKey) || fieldDictMap.get(fieldKey.toLowerCase()) || null) : undefined;
        mappedTags.push({
          tag: tag.tag,
          tagName: tag.tagName,
          tagType: tag.tagType,
          fieldKey,
          mapped: true,
          fieldDictionaryInfo: includeFieldDictionary ? dictInfo : undefined,
        });
        
        // Add info message if resolved directly (no alias needed)
        if (resolvedVia !== "alias") {
          warnings.push(`Tag "${tag.tagName}" resolved directly to field "${fieldKey}" (${resolvedVia}) - no alias needed`);
        }
      } else {
        const suggestions = findSuggestions(tag.tagName, allFieldKeys);
        unmappedTags.push({
          tag: tag.tag,
          tagName: tag.tagName,
          tagType: tag.tagType,
          fieldKey: null,
          mapped: false,
          suggestions,
        });
      }
    }

    // Process labels
    for (const label of foundLabels) {
      const dictInfo = includeFieldDictionary ? (fieldDictMap.get(label.fieldKey) || fieldDictMap.get(label.fieldKey.toLowerCase()) || null) : undefined;
      mappedTags.push({
        tag: label.tag,
        tagName: label.tagName,
        tagType: "label",
        fieldKey: label.fieldKey,
        mapped: true,
        fieldDictionaryInfo: includeFieldDictionary ? dictInfo : undefined,
      });
    }

    // Count by type
    const summary = {
      mergeTagCount: foundMergeTags.filter(t => t.tagType === "merge_tag").length,
      labelCount: foundLabels.length,
      fCodeCount: foundMergeTags.filter(t => t.tagType === "f_code").length,
      curlyBraceCount: foundMergeTags.filter(t => t.tagType === "curly_brace").length,
      mappedCount: mappedTags.length,
      unmappedCount: unmappedTags.length,
    };

    // Add validation errors
    if (unmappedTags.length > 0) {
      errors.push(`${unmappedTags.length} tag(s) have no mapping and will not be replaced during document generation`);
    }

    if (foundMergeTags.length === 0 && foundLabels.length === 0) {
      warnings.push("No merge tags or labels found in this template. The document may not support data injection.");
    }

    const result: ValidationResult = {
      valid: unmappedTags.length === 0 && errors.length === 0,
      totalTagsFound: foundMergeTags.length + foundLabels.length,
      mappedTags,
      unmappedTags,
      warnings,
      errors,
      summary,
      documentText: includeDocumentText ? allContent.trim() : undefined,
    };

    console.log(`[validate-template] Validated "${templateName}": ${mappedTags.length} mapped, ${unmappedTags.length} unmapped`);

    return new Response(
      JSON.stringify(result),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error: any) {
    console.error("[validate-template] Error:", error);
    return new Response(
      JSON.stringify({ error: error.message || "Internal server error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
