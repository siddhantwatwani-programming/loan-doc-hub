/**
 * Generate Document Edge Function
 * 
 * Orchestrates document generation by processing DOCX templates
 * with deal field values. Supports single document and packet generation.
 */

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

// Import shared modules
import type {
  OutputType,
  RequestType,
  GenerationStatus,
  GenerateDocumentRequest,
  TemplateFieldMap,
  FieldDefinition,
  Template,
  GenerationResult,
  JobResult,
  FieldValueData,
} from "../_shared/types.ts";
import { fetchMergeTagMappings, extractRawValueFromJsonb } from "../_shared/field-resolver.ts";
import { processDocx } from "../_shared/docx-processor.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

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

    const fieldTransforms = new Map<string, string>();
    mappedFields.forEach((fm) => {
      if (fm.transform_rule && fm.field_key) {
        fieldTransforms.set(fm.field_key, fm.transform_rule);
      }
    });

    // 3. Fetch ALL deal field values from deal_section_values
    const { data: sectionValues, error: svError } = await supabase
      .from("deal_section_values")
      .select("section, field_values")
      .eq("deal_id", dealId);

    if (svError) {
      console.error(`[generate-document] Failed to fetch deal_section_values:`, svError.message);
      result.error = "Failed to fetch deal section values";
      return result;
    }

    // Get all field_dictionary_ids from JSONB keys
    // Handle composite keys like "borrower1::uuid" used by multi-entity sections
    const allFieldDictIds: string[] = [];
    (sectionValues || []).forEach((sv: any) => {
      Object.keys(sv.field_values || {}).forEach((key: string) => {
        const fieldDictId = key.includes("::") ? key.split("::")[1] : key;
        if (fieldDictId && !allFieldDictIds.includes(fieldDictId)) allFieldDictIds.push(fieldDictId);
      });
    });

    console.log(`[generate-document] Found ${allFieldDictIds.length} unique field_dictionary IDs from deal section values`);
    
    // Fetch ALL field dictionary entries for deal values using batched queries
    // to avoid URL length limits with large .in() arrays
    const FD_BATCH_SIZE = 100;
    const allFieldDictEntries: any[] = [];
    for (let i = 0; i < allFieldDictIds.length; i += FD_BATCH_SIZE) {
      const chunk = allFieldDictIds.slice(i, i + FD_BATCH_SIZE);
      const { data: batchData, error: batchError } = await supabase
        .from("field_dictionary")
        .select("id, field_key, data_type, label")
        .in("id", chunk);
      if (batchError) {
        console.error(`[generate-document] field_dictionary batch fetch error (offset ${i}):`, batchError.message);
        continue;
      }
      allFieldDictEntries.push(...(batchData || []));
    }

    // Create a complete lookup map for all field dictionary entries
    const allFieldDictMap = new Map<string, FieldDefinition>();
    allFieldDictEntries.forEach((fd: any) => allFieldDictMap.set(fd.id, fd));
    console.log(`[generate-document] Built allFieldDictMap with ${allFieldDictMap.size} entries from ${allFieldDictIds.length} IDs`);

    const fieldValues = new Map<string, FieldValueData>();
    (sectionValues || []).forEach((sv: any) => {
      Object.entries(sv.field_values || {}).forEach(([key, data]: [string, any]) => {
        // Extract actual field_dictionary_id from composite keys (e.g., "borrower1::uuid" -> "uuid")
        const fieldDictId = key.includes("::") ? key.split("::")[1] : key;
        const fieldDict = allFieldDictMap.get(fieldDictId);
        if (fieldDict) {
          const dataType = fieldDict.data_type || "text";
          const rawValue = extractRawValueFromJsonb(data, dataType);
          // Use indexed_key if available for more specific field mapping, otherwise use canonical field_key
          const indexedKey = (data as any)?.indexed_key;
          const resolvedKey = indexedKey || fieldDict.field_key;
          fieldValues.set(resolvedKey, { rawValue, dataType });
          // Also set the canonical field_key so merge tags can match either way
          if (indexedKey && indexedKey !== fieldDict.field_key) {
            fieldValues.set(fieldDict.field_key, { rawValue, dataType });
          }
        }
      });
    });

    console.log(`[generate-document] Resolved ${fieldValues.size} field values for ${template.name}`);

    // Auto-compute borrower.borrower_description if not already set
    const existingDesc = fieldValues.get("borrower.borrower_description");
    if (!existingDesc || !existingDesc.rawValue) {
      const borrowerNames: { index: number; name: string }[] = [];
      for (const [key, val] of fieldValues.entries()) {
        const m = key.match(/^borrower(\d+)\.full_name$/);
        if (m && val.rawValue) {
          borrowerNames.push({ index: parseInt(m[1], 10), name: String(val.rawValue) });
        }
      }
      if (borrowerNames.length > 0) {
        borrowerNames.sort((a, b) => a.index - b.index);
        const description = borrowerNames.map(b => b.name).join(" and ");
        fieldValues.set("borrower.borrower_description", { rawValue: description, dataType: "text" });
        console.log(`[generate-document] Auto-computed borrower.borrower_description = "${description}"`);
      }
    }

    // Build set of ALL valid field keys from the complete field_dictionary (for direct tag matching)
    // Use pagination to fetch all rows (table has 1700+ entries, default limit is 1000)
    const PAGE_SIZE = 1000;
    const completeFieldDictionary: any[] = [];
    let fdFrom = 0;
    while (true) {
      const { data: page, error: fdErr } = await supabase
        .from("field_dictionary")
        .select("field_key")
        .range(fdFrom, fdFrom + PAGE_SIZE - 1);
      if (fdErr) { console.error("[generate-document] field_dictionary fetch error:", fdErr.message); break; }
      const rows = page || [];
      completeFieldDictionary.push(...rows);
      if (rows.length < PAGE_SIZE) break;
      fdFrom += PAGE_SIZE;
    }
    
    const validFieldKeys = new Set<string>();
    completeFieldDictionary.forEach((fd: any) => validFieldKeys.add(fd.field_key));
    console.log(`[generate-document] Built validFieldKeys set with ${validFieldKeys.size} entries`);

    // 4. Download template DOCX from storage
    let fileData: Blob | null = null;
    
    const { data: storageData, error: fileError } = await supabase.storage
      .from("templates")
      .download(template.file_path);

    if (!fileError && storageData) {
      fileData = storageData;
      console.log(`[generate-document] Downloaded template from storage: ${template.file_path}`);
    } else {
      // Fallback: Try public URL
      console.log(`[generate-document] Storage download failed, trying public URL fallback...`);
      const supabaseUrl = Deno.env.get("SUPABASE_URL") || "";
      const projectRef = supabaseUrl.replace("https://", "").split(".")[0];
      
      const publicUrls = [
        `https://${projectRef}.supabase.co/storage/v1/object/public/templates/${template.file_path}`,
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

    // 5. Fetch merge tag mappings and process the DOCX
    const { mergeTagMap, labelMap } = await fetchMergeTagMappings(supabase);
    const templateBuffer = new Uint8Array(await fileData.arrayBuffer());
    const processedDocx = await processDocx(templateBuffer, fieldValues, fieldTransforms, mergeTagMap, labelMap, validFieldKeys);

    console.log(`[generate-document] Processed DOCX: ${processedDocx.length} bytes`);

    // 6. Calculate version number
    const { data: existingDocs } = await supabase
      .from("generated_documents")
      .select("version_number")
      .eq("deal_id", dealId)
      .eq("template_id", templateId)
      .order("version_number", { ascending: false })
      .limit(1);

    const versionNumber = existingDocs && existingDocs.length > 0 ? existingDocs[0].version_number + 1 : 1;

    // 7. Upload generated document to storage
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

    // 8. Handle PDF conversion using CloudConvert
    let pdfPath: string | null = null;
    if (outputType === "docx_and_pdf") {
      pdfPath = await convertToPdf(supabase, processedDocx, dealId, templateId, versionNumber, timestamp);
    }

    // 9. Create generated_documents record
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

    // 10. Log activity
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
// PDF Conversion
// ============================================

async function convertToPdf(
  supabase: any,
  docxBuffer: Uint8Array,
  dealId: string,
  templateId: string,
  versionNumber: number,
  timestamp: number
): Promise<string | null> {
  const cloudConvertApiKey = Deno.env.get("CLOUDCONVERT_API_KEY");
  
  if (!cloudConvertApiKey) {
    console.log(`[generate-document] PDF conversion requested but CLOUDCONVERT_API_KEY not set`);
    return null;
  }

  try {
    console.log(`[generate-document] Starting PDF conversion via CloudConvert...`);
    
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
            file: btoa(String.fromCharCode(...docxBuffer)),
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
      return null;
    }

    const jobData = await jobResponse.json();
    const jobId = jobData.data.id;
    console.log(`[generate-document] CloudConvert job created: ${jobId}`);

    // Poll for job completion
    let attempts = 0;
    const maxAttempts = 30;
    let exportUrl: string | null = null;

    while (attempts < maxAttempts) {
      await new Promise(resolve => setTimeout(resolve, 2000));
      attempts++;

      const statusResponse = await fetch(`https://api.cloudconvert.com/v2/jobs/${jobId}`, {
        headers: {
          "Authorization": `Bearer ${cloudConvertApiKey}`,
        },
      });

      if (!statusResponse.ok) continue;

      const statusData = await statusResponse.json();
      const job = statusData.data;

      if (job.status === "finished") {
        const exportTask = job.tasks.find((t: any) => t.name === "export-pdf");
        if (exportTask?.result?.files?.[0]?.url) {
          exportUrl = exportTask.result.files[0].url;
        }
        break;
      } else if (job.status === "error") {
        console.error(`[generate-document] CloudConvert job failed:`, job);
        break;
      }
    }

    if (exportUrl) {
      // Download the PDF
      const pdfResponse = await fetch(exportUrl);
      if (pdfResponse.ok) {
        const pdfBlob = await pdfResponse.blob();
        const pdfBuffer = new Uint8Array(await pdfBlob.arrayBuffer());

        const pdfFileName = `${dealId}/${templateId}_v${versionNumber}_${timestamp}.pdf`;
        const { error: pdfUploadError } = await supabase.storage
          .from("generated-docs")
          .upload(pdfFileName, pdfBuffer, {
            contentType: "application/pdf",
            upsert: false,
          });

        if (!pdfUploadError) {
          console.log(`[generate-document] PDF uploaded: ${pdfFileName}`);
          return pdfFileName;
        } else {
          console.error(`[generate-document] PDF upload failed:`, pdfUploadError);
        }
      }
    }
  } catch (pdfError: any) {
    console.error(`[generate-document] PDF conversion error:`, pdfError);
  }

  return null;
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

      // Update deal status to generated if successful
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
