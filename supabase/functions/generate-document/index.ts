/**
 * Generate Document Edge Function
 * 
 * Orchestrates document generation by processing DOCX templates
 * with deal field values. Supports single document and packet generation.
 */

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import * as fflate from "https://esm.sh/fflate@0.8.2";

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
import { fetchMergeTagMappings, fetchFieldKeyMappings, extractRawValueFromJsonb, getFieldData } from "../_shared/field-resolver.ts";
import { processDocx } from "../_shared/docx-processor.ts";

const DOC_GEN_DEBUG = Deno.env.get("DOC_GEN_DEBUG") === "true";
const debugLog = (...args: unknown[]) => {
  if (DOC_GEN_DEBUG) {
    console.log(...args);
  }
};

let cachedValidFieldKeys: Set<string> | null = null;
let validFieldKeysCacheTimestamp = 0;
const VALID_FIELD_KEYS_TTL_MS = 5 * 60 * 1000;

async function getValidFieldKeys(supabase: any): Promise<Set<string>> {
  const now = Date.now();
  if (cachedValidFieldKeys && now - validFieldKeysCacheTimestamp < VALID_FIELD_KEYS_TTL_MS) {
    debugLog(`[generate-document] Using cached validFieldKeys set with ${cachedValidFieldKeys.size} entries`);
    return cachedValidFieldKeys;
  }

  const PAGE_SIZE = 1000;
  const completeFieldDictionary: Array<{ field_key: string; canonical_key: string | null }> = [];
  let fdFrom = 0;

  while (true) {
    const { data: page, error: fdErr } = await supabase
      .from("field_dictionary")
      .select("field_key, canonical_key")
      .range(fdFrom, fdFrom + PAGE_SIZE - 1);

    if (fdErr) {
      console.error("[generate-document] field_dictionary fetch error:", fdErr.message);
      break;
    }

    const rows = page || [];
    completeFieldDictionary.push(...rows);
    if (rows.length < PAGE_SIZE) break;
    fdFrom += PAGE_SIZE;
  }

  const nextValidFieldKeys = new Set<string>();
  completeFieldDictionary.forEach((fd) => {
    nextValidFieldKeys.add(fd.field_key);
    if (fd.canonical_key) nextValidFieldKeys.add(fd.canonical_key);
  });

  cachedValidFieldKeys = nextValidFieldKeys;
  validFieldKeysCacheTimestamp = now;
  debugLog(`[generate-document] Built validFieldKeys set with ${nextValidFieldKeys.size} entries (including canonical keys)`);

  return nextValidFieldKeys;
}

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
  packetName: string | null,
  outputType: OutputType,
  userId: string,
  generationBatchId: string | null
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
    const isTemplate885 = /885/i.test(template.name || "");
    const tDataMappingStart = performance.now();

    if (!template.file_path) {
      result.error = "Template has no DOCX file";
      return result;
    }

    debugLog(`[generate-document] Processing template: ${template.name}`);

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

    // Fetch field dictionary entries (include canonical_key for backward compat)
    const { data: fieldDictEntries } = await supabase
      .from("field_dictionary")
      .select("id, field_key, data_type, label, canonical_key")
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
    const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    const allFieldDictIdSet = new Set<string>();
    (sectionValues || []).forEach((sv: any) => {
      Object.keys(sv.field_values || {}).forEach((key: string) => {
        const fieldDictId = key.includes("::") ? key.split("::")[1] : key;
        if (fieldDictId && UUID_RE.test(fieldDictId)) allFieldDictIdSet.add(fieldDictId);
      });
    });
    const allFieldDictIds = [...allFieldDictIdSet];

    debugLog(`[generate-document] Found ${allFieldDictIds.length} unique field_dictionary IDs from deal section values`);
    
    // Fetch ALL field dictionary entries for deal values using batched queries
    // to avoid URL length limits with large .in() arrays
    const FD_BATCH_SIZE = 100;
    const allFieldDictEntries: any[] = [];
    for (let i = 0; i < allFieldDictIds.length; i += FD_BATCH_SIZE) {
      const chunk = allFieldDictIds.slice(i, i + FD_BATCH_SIZE);
      const { data: batchData, error: batchError } = await supabase
        .from("field_dictionary")
        .select("id, field_key, data_type, label, canonical_key")
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
    debugLog(`[generate-document] Built allFieldDictMap with ${allFieldDictMap.size} entries from ${allFieldDictIds.length} IDs`);

    // Property field_key to short suffix mapping for bridging propertyN.* keys
    const prKeyToSuffix: Record<string, string> = {
      'pr_p_street': 'street', 'pr_p_city': 'city', 'pr_p_state': 'state',
      'pr_p_zip': 'zip', 'pr_p_county': 'county', 'pr_p_address': 'address',
      'pr_p_apn': 'apn', 'pr_p_marketValue': 'marketValue',
      'pr_p_legalDescri': 'legalDescription', 'pr_p_propertyTyp': 'propertyType',
      'pr_p_occupancySt': 'occupancyStatus', 'pr_p_yearBuilt': 'yearBuilt',
      'pr_p_lotSize': 'lotSize', 'pr_p_squareFeet': 'squareFeet',
      'pr_p_numberOfUni': 'numberOfUnits', 'pr_p_country': 'country',
      // RE851D multi-property bridging — UI form keys (PropertyDetailsForm)
      'pr_p_appraiseValue': 'appraised_value',
      'pr_p_owner': 'owner',
      'pr_p_remainingSenior': 'remaining_senior',
      'pr_p_expectedSenior': 'expected_senior',
      // RE851D bridging — additional CSR-saved keys (PropertyDetailsForm)
      'pr_p_propertyType': 'appraisal_property_type',
      'pr_p_occupanc': 'appraisal_occupancy',
      'pr_p_appraiseDate': 'appraised_date',
      'pr_p_ltv': 'ltv',
      'pr_p_cltv': 'cltv',
      'pr_p_descript': 'description',
      'pr_p_purchasePrice': 'purchase_price',
      'pr_p_downPayme': 'down_payment',
      'pr_p_construcType': 'construction_type',
      'pr_p_protectiveEquity': 'protective_equity',
      'pr_p_appraiserStreet': 'appraiser_street',
      'pr_p_appraiserCity': 'appraiser_city',
      'pr_p_appraiserState': 'appraiser_state',
      'pr_p_appraiserZip': 'appraiser_zip',
      'pr_p_appraiserPhone': 'appraiser_phone',
      'pr_p_appraiserEmail': 'appraiser_email',
      'pr_p_zoning': 'zoning',
      'pr_p_floodZone': 'flood_zone',
      'pr_p_pledgedEquity': 'pledged_equity',
    };

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
          // BUT only if the canonical key doesn't already belong to a different indexed entity
          // e.g., don't overwrite property1.street (canonical) with property2's data
          if (indexedKey && indexedKey !== fieldDict.field_key) {
            const canonicalHasIndex = /^[a-zA-Z_]+\d+\./.test(fieldDict.field_key);
            if (!canonicalHasIndex && !fieldValues.has(fieldDict.field_key)) {
              fieldValues.set(fieldDict.field_key, { rawValue, dataType });
            }
          }

          // Bridge property composite keys (e.g., "property2::uuid") to propertyN.suffix format
          // so multi-property auto-compute works correctly
          if (key.includes("::")) {
            const entityPrefix = key.split("::")[0]; // e.g., "property1", "property2"
            if (/^property\d+$/i.test(entityPrefix)) {
              const suffix = prKeyToSuffix[fieldDict.field_key];
              if (suffix) {
                const bridgedKey = `${entityPrefix}.${suffix}`;
                fieldValues.set(bridgedKey, { rawValue, dataType });
                debugLog(`[generate-document] Bridged ${key} -> ${bridgedKey} = "${rawValue}"`);
              }
            }
            // RE851D: bridge propertytax{N}::uuid composite keys to propertytax{N}.<suffix>
            // Dictionary keys are propertytax.<suffix>; we strip the canonical prefix
            // and re-attach the indexed entity prefix so per-index publishers below
            // can read propertytax{N}.annual_payment / .delinquent / .delinquent_amount /
            // .source_of_information directly. No cross-index fallback.
            else if (/^propertytax\d+$/i.test(entityPrefix)) {
              const fk = fieldDict.field_key || "";
              if (fk.startsWith("propertytax.")) {
                const suffix = fk.substring("propertytax.".length);
                if (suffix) {
                  const bridgedKey = `${entityPrefix}.${suffix}`;
                  fieldValues.set(bridgedKey, { rawValue, dataType });
                  debugLog(`[generate-document] Bridged ${key} -> ${bridgedKey} = "${rawValue}"`);
                }
              }
            }
          }
        }
      });
    });

    // Ensure field_dictionary field_key is populated even when indexed_key took priority
    for (const sv of (sectionValues || [])) {
      for (const [key, data] of Object.entries((sv as any).field_values || {})) {
        const fieldDictId = key.includes("::") ? key.split("::")[1] : key;
        const fieldDict = allFieldDictMap.get(fieldDictId);
        if (fieldDict && !fieldValues.has(fieldDict.field_key)) {
          const rawValue = extractRawValueFromJsonb(data, fieldDict.data_type || "text");
          fieldValues.set(fieldDict.field_key, { rawValue, dataType: fieldDict.data_type || "text" });
        }
      }
    }

    // ── Participant-based contact lookup ──
    // Fetch participants from deal_participants, then resolve their contact records
    {
      const { data: participants, error: partError } = await supabase
        .from("deal_participants")
        .select("role, contact_id, name, email, phone")
        .eq("deal_id", dealId);

      if (partError) {
        console.error(`[generate-document] Failed to fetch deal_participants:`, partError.message);
      }

      const participantRows = participants || [];
      debugLog(`[generate-document] Found ${participantRows.length} participant(s) for deal`);

      // Collect unique contact_id UUIDs (these are UUID references to contacts.id)
      const contactUuids = [...new Set(
        participantRows.map((p: any) => p.contact_id).filter(Boolean)
      )];

      // Fetch full contact records by UUID id
      let contactRowsByUuid = new Map<string, any>();
      if (contactUuids.length > 0) {
        const { data: contactRows } = await supabase
          .from("contacts")
          .select("id, contact_id, contact_type, full_name, first_name, last_name, email, phone, city, state, company, contact_data")
          .in("id", contactUuids);

        if (contactRows) {
          for (const cr of contactRows) {
            contactRowsByUuid.set(cr.id, cr);
          }
          debugLog(`[generate-document] Fetched ${contactRows.length} contact(s) via participant lookup`);
        }
      }

      const setIfEmpty = (key: string, value: string) => {
        if (value && (!fieldValues.has(key) || !fieldValues.get(key)?.rawValue)) {
          fieldValues.set(key, { rawValue: value, dataType: "text" });
        }
      };

      const forceSet = (key: string, value: string) => {
        if (value) {
          fieldValues.set(key, { rawValue: value, dataType: "text" });
        }
      };

      const injectContact = (contact: any, dotPrefixes: string[], shortPrefix?: string) => {
        const cd = contact.contact_data || {};
        const firstName = cd.first_name || contact.first_name || "";
        const middleName = cd.middle_initial || "";
        const lastName = cd.last_name || contact.last_name || "";
        const assembledName = [firstName, middleName, lastName].filter(Boolean).join(" ");
        const fullName = assembledName || cd.full_name || contact.full_name || "";
        const email = cd.email || contact.email || "";
        const company = cd.company || contact.company || "";
        const phone = cd["phone.cell"] || cd["phone.work"] || cd["phone.home"] || contact.phone || "";
        const fax = cd["phone.fax"] || "";

        // Dot-notation prefixes (e.g., borrower1.full_name, borrower.full_name)
        for (const prefix of dotPrefixes) {
          setIfEmpty(`${prefix}.full_name`, fullName);
          setIfEmpty(`${prefix}.first_name`, firstName);
          setIfEmpty(`${prefix}.last_name`, lastName);
          setIfEmpty(`${prefix}.middle_initial`, middleName);
          setIfEmpty(`${prefix}.email`, email);
          setIfEmpty(`${prefix}.company`, company);
          setIfEmpty(`${prefix}.phone`, phone);
          setIfEmpty(`${prefix}.fax`, fax);
          if (cd["address.street"]) setIfEmpty(`${prefix}.address.street`, cd["address.street"]);
          if (cd["address.city"] || contact.city) setIfEmpty(`${prefix}.address.city`, cd["address.city"] || contact.city);
          if (cd["address.state"] || contact.state) setIfEmpty(`${prefix}.state`, cd["address.state"] || contact.state);
          if (cd["address.zip"]) setIfEmpty(`${prefix}.address.zip`, cd["address.zip"]);
          if (cd["mailing.street"]) setIfEmpty(`${prefix}.mailing_address.street`, cd["mailing.street"]);
          if (cd["mailing.city"]) setIfEmpty(`${prefix}.mailing_address.city`, cd["mailing.city"]);
          if (cd["mailing.state"]) setIfEmpty(`${prefix}.mailing_address.state`, cd["mailing.state"]);
          if (cd["mailing.zip"]) setIfEmpty(`${prefix}.mailing_address.zip`, cd["mailing.zip"]);
          if (cd.tax_id) setIfEmpty(`${prefix}.tax_id`, cd.tax_id);
          if (cd.dob) setIfEmpty(`${prefix}.dob`, cd.dob);
          if (cd.capacity) setIfEmpty(`${prefix}.capacity`, cd.capacity);
          if (cd.vesting) setIfEmpty(`${prefix}.vesting`, cd.vesting);
          if (cd.borrower_type) setIfEmpty(`${prefix}.borrower_type`, cd.borrower_type);
          if (cd.license_number) setIfEmpty(`${prefix}.license_number`, cd.license_number);
        }

        // Short-prefix keys (e.g., br_p_fullName, ld_p_fullName)
        if (shortPrefix) {
          setIfEmpty(`${shortPrefix}_fullName`, fullName);
          setIfEmpty(`${shortPrefix}_firstName`, firstName);
          setIfEmpty(`${shortPrefix}_lastName`, lastName);
          setIfEmpty(`${shortPrefix}_middleInitia`, middleName);
          setIfEmpty(`${shortPrefix}_email`, email);
          setIfEmpty(`${shortPrefix}_company`, company);
          setIfEmpty(`${shortPrefix}_phone`, phone);
          setIfEmpty(`${shortPrefix}_fax`, fax);
          if (cd.tax_id) setIfEmpty(`${shortPrefix}_taxId`, cd.tax_id);
          if (cd["address.street"]) {
            setIfEmpty(`${shortPrefix}_street`, cd["address.street"]);
            setIfEmpty(`${shortPrefix}_address`, cd["address.street"]);
          }
          if (cd["address.city"] || contact.city) setIfEmpty(`${shortPrefix}_city`, cd["address.city"] || contact.city);
          if (cd["address.state"] || contact.state) setIfEmpty(`${shortPrefix}_state`, cd["address.state"] || contact.state);
          if (cd["address.zip"]) setIfEmpty(`${shortPrefix}_zip`, cd["address.zip"]);
          if (cd.capacity) setIfEmpty(`${shortPrefix}_capacity`, cd.capacity);
          if (cd.vesting) setIfEmpty(`${shortPrefix}_vesting`, cd.vesting);
        }
      };

      // Group participants by role
      const borrowerParticipants = participantRows.filter((p: any) => p.role === "borrower");
      const lenderParticipants = participantRows.filter((p: any) => p.role === "lender");
      const brokerParticipants = participantRows.filter((p: any) => p.role === "broker");

      // Select primary borrower (check contact_data.capacity from resolved contacts)
      const primaryBorrower = borrowerParticipants.find((p: any) => {
        if (!p.contact_id) return false;
        const c = contactRowsByUuid.get(p.contact_id);
        const cap = c?.contact_data?.capacity;
        return cap && String(cap).toLowerCase().includes("primary");
      }) || borrowerParticipants[0];

      // Select additional guarantor BEFORE co-borrower to prevent fallback collision
      console.log(`[generate-document] Borrower participants: ${borrowerParticipants.length}, primary: ${primaryBorrower?.name || 'none'}`);
      for (const bp of borrowerParticipants) {
        const bpc = bp.contact_id ? contactRowsByUuid.get(bp.contact_id) : null;
        const bpCap = bpc?.contact_data?.capacity;
        console.log(`[generate-document]   participant: name=${bp.name}, contact_id=${bp.contact_id}, capacity=${bpCap}, isPrimary=${bp === primaryBorrower}`);
      }
      const guarantorParticipant = borrowerParticipants.find((p: any) => {
        if (!p.contact_id) return false;
        const c = contactRowsByUuid.get(p.contact_id);
        const cap = c?.contact_data?.capacity;
        return cap && String(cap).toLowerCase().includes("additional guarantor");
      }) || borrowerParticipants.find((p: any) => {
        // Fallback: any borrower participant that is NOT primary and not trustee
        if (!p.contact_id) return false;
        if (p === primaryBorrower) return false;
        const c = contactRowsByUuid.get(p.contact_id);
        const cap = c?.contact_data?.capacity;
        const capLower = cap ? String(cap).toLowerCase() : "";
        return !capLower.includes("primary") && !capLower.includes("co-borrower")
          && !capLower.includes("co-trustee") && !capLower.includes("trustee");
      });

      console.log(`[generate-document] Guarantor selected: ${guarantorParticipant?.name || 'NONE'}, contact_id=${guarantorParticipant?.contact_id || 'NONE'}`);

      // Select co-borrower (check contact_data.capacity, or fall back to second borrower excluding guarantor)
      const coBorrower = borrowerParticipants.find((p: any) => {
        if (!p.contact_id) return false;
        const c = contactRowsByUuid.get(p.contact_id);
        const cap = c?.contact_data?.capacity;
        return cap && String(cap).toLowerCase().includes("co-borrower");
      }) || borrowerParticipants.find((p: any) => p !== primaryBorrower && p !== guarantorParticipant);

      // Inject primary borrower
      if (primaryBorrower?.contact_id) {
        const bc = contactRowsByUuid.get(primaryBorrower.contact_id);
        if (bc) {
          injectContact(bc, ["borrower1", "borrower"], "br_p");
          debugLog(`[generate-document] Injected borrower contact fields from participant (contact ${bc.contact_id})`);
        }
      }

      // Inject co-borrower (only if different from primary)
      if (coBorrower?.contact_id && coBorrower.contact_id !== primaryBorrower?.contact_id) {
        const cbc = contactRowsByUuid.get(coBorrower.contact_id);
        if (cbc) {
          injectContact(cbc, ["co_borrower1", "coborrower", "co_borrower"], undefined);
          debugLog(`[generate-document] Injected co-borrower contact fields from participant (contact ${cbc.contact_id})`);
        }
      }

      if (guarantorParticipant?.contact_id) {
        const gc = contactRowsByUuid.get(guarantorParticipant.contact_id);
        if (gc) {
          const cd = gc.contact_data || {};
          const firstName = cd.first_name || gc.first_name || "";
          const middleName = cd.middle_initial || "";
          const lastName = cd.last_name || gc.last_name || "";
          const assembledName = [firstName, middleName, lastName].filter(Boolean).join(" ");
          const fullName = assembledName || cd.full_name || gc.full_name || "";
          const email = cd.email || gc.email || "";
          const phone = cd["phone.cell"] || cd["phone.work"] || cd["phone.home"] || gc.phone || "";

          console.log(`[generate-document] Guarantor injection: fullName="${fullName}", firstName="${firstName}", lastName="${lastName}"`);

          setIfEmpty("br_p_guarantoFullName", fullName);
          setIfEmpty("br_p_guarantoFirstName", firstName);
          setIfEmpty("br_p_guarantoLastName", lastName);
          setIfEmpty("br_p_guarantoMiddleInitia", middleName);
          setIfEmpty("br_ag_fullName", fullName);
          setIfEmpty("br_ag_firstName", firstName);
          setIfEmpty("br_ag_lastName", lastName);
          setIfEmpty("br_ag_email", email);
          setIfEmpty("br_ag_phone", phone);

          console.log(`[generate-document] After setIfEmpty, br_ag_fullName = "${fieldValues.get("br_ag_fullName")?.rawValue}"`);
          debugLog(`[generate-document] Injected guarantor contact fields from participant (contact ${gc.contact_id})`);
        }
      } else {
        console.log(`[generate-document] WARNING: No guarantor participant found!`);
      }

      // Inject lender
      const primaryLender = lenderParticipants[0];
      if (primaryLender?.contact_id) {
        const lc = contactRowsByUuid.get(primaryLender.contact_id);
        if (lc) {
          injectContact(lc, ["lender1", "lender"], "ld_p");

          // Bridge lender name to ld_p_lenderName / lender.name so template tags
          // like «Lender_Name» (which resolve via alias to lender.name → ld_p_lenderName)
          // can find the value.
          const lcd = lc.contact_data || {};
          const lFirstName = lcd.first_name || lc.first_name || "";
          const lMiddleName = lcd.middle_initial || "";
          const lLastName = lcd.last_name || lc.last_name || "";
          const lAssembledName = [lFirstName, lMiddleName, lLastName].filter(Boolean).join(" ");
          const lFullName = lAssembledName || lcd.full_name || lc.full_name || "";
          setIfEmpty("ld_p_lenderName", lFullName);
          setIfEmpty("lender.name", lFullName);
          setIfEmpty("Lender.Name", lFullName);
          setIfEmpty("ld_p_fullNameIfEntity", lFullName);

          // Bridge lender type from contact_data
          if (lcd.type) {
            setIfEmpty("ld_p_lenderType", lcd.type);
            setIfEmpty("lender1.type", lcd.type);
            setIfEmpty("lender.type", lcd.type);
          }

          // Bridge investor questionnaire due date from contact_data
          if (lcd.investor_questionnaire_due_date) {
            setIfEmpty("ld_p_investorQuestiDueDate", lcd.investor_questionnaire_due_date);
            setIfEmpty("lender1.investor_questionnaire_due_date", lcd.investor_questionnaire_due_date);
          }

          // Bridge investor questionnaire due (boolean checkbox) from contact_data
          const iqDueRaw = lcd.investor_questionnaire_due;
          const iqDueChecked =
            iqDueRaw === true || iqDueRaw === 'true' || iqDueRaw === 1 || iqDueRaw === '1' || iqDueRaw === 'yes';
          setIfEmpty("ld_p_investorQuestiDue", iqDueChecked ? "true" : "false");
          setIfEmpty("lender1.investor_questionnaire_due", iqDueChecked ? "true" : "false");
          setIfEmpty("lender.investor_questionnaire_due", iqDueChecked ? "true" : "false");
          // Pre-rendered checkbox glyph for templates that prefer a single placeholder
          setIfEmpty("ld_p_investorQuestiDueCheckbox", iqDueChecked ? "☒" : "☐");

          debugLog(`[generate-document] Injected lender contact fields from participant (contact ${lc.contact_id}), lenderName="${lFullName}"`);
        }
      }

      // Inject broker (force-override since broker data is authoritative from Contacts)
      const primaryBroker = brokerParticipants[0];
      if (primaryBroker?.contact_id) {
        const cr = contactRowsByUuid.get(primaryBroker.contact_id);
        if (cr) {
          const cd = cr.contact_data || {};
          const firstName = cd.first_name || cr.first_name || "";
          const middleName = cd.middle_initial || "";
          const lastName = cd.last_name || cr.last_name || "";
          const assembledName = [firstName, middleName, lastName].filter(Boolean).join(" ");
          const fullName = assembledName || cd.full_name || cr.full_name || "";
          const email = cd.email || cr.email || "";
          const company = cd.company || cr.company || "";
          const phone = cd["phone.cell"] || cd["phone.work"] || cd["phone.home"] || cr.phone || "";
          const fax = cd["phone.fax"] || "";
          const license = cd.license_number || cd.License || cd.license || cr.license_number || "";

          // Build full broker address from components
          const addrStreet = cd["address.street"] || "";
          const addrCity = cd["address.city"] || cr.city || "";
          const addrState = cd["address.state"] || cr.state || "";
          const addrZip = cd["address.zip"] || "";
          const fullAddress = [addrStreet, [addrCity, addrState, addrZip].filter(Boolean).join(" ")].filter(Boolean).join(", ");

          // Representative name: use explicit broker_representative if set, else assemble from first/last
          const representativeName = cd.broker_representative || cd.representative || fullName;
          // Representative license: use rep_license if available, else fall back to broker license
          const repLicense = cd.rep_license || cd.representative_license || license;

          // Force-set short prefix keys (bk_p_*)
          forceSet("bk_p_fullName", fullName);
          // Add trailing non-breaking space (\u00A0) to firstName and lastName so adjacent tags like
          // {{bk_p_firstName}}{{bk_p_lastName}}{{bk_p_license}} render with proper spacing.
          // Regular spaces get stripped by Word XML; \u00A0 is preserved.
          forceSet("bk_p_firstName", firstName ? firstName + "\u00A0" : "");
          forceSet("bk_p_lastName", lastName ? lastName + "\u00A0" : "");
          forceSet("bk_p_middleInitia", middleName);
          forceSet("bk_p_email", email);
          forceSet("bk_p_company", company);
          forceSet("bk_p_phone", phone);
          forceSet("bk_p_cellPhone", cd["phone.cell"] || cd["phone.mobile"] || "");
          forceSet("bk_p_fax", fax);
          forceSet("bk_p_brokerName", company);
          forceSet("bk_p_brokerRepres", representativeName);
          forceSet("bk_p_brokerSignat", fullName);
          forceSet("bk_p_repSignature", representativeName);
          if (fullAddress) forceSet("bk_p_brokerAddres", fullAddress);
          if (license) {
            forceSet("bk_p_brokerLicens", String(license));
            forceSet("bk_p_license", String(license));
            forceSet("broker.License", String(license));
            forceSet("broker.license_number", String(license));
            forceSet("broker1.license_number", String(license));
          }
          if (repLicense) {
            forceSet("bk_p_repLicense", String(repLicense));
          }

          // Force-set dot-notation keys
          for (const prefix of ["broker1", "broker"]) {
            forceSet(`${prefix}.full_name`, fullName);
            forceSet(`${prefix}.first_name`, firstName);
            forceSet(`${prefix}.last_name`, lastName);
            forceSet(`${prefix}.middle_initial`, middleName);
            forceSet(`${prefix}.email`, email);
            forceSet(`${prefix}.company`, company);
            forceSet(`${prefix}.phone`, phone);
            forceSet(`${prefix}.fax`, fax);
            if (addrStreet) forceSet(`${prefix}.address.street`, addrStreet);
            if (addrCity) forceSet(`${prefix}.address.city`, addrCity);
            if (addrState) forceSet(`${prefix}.state`, addrState);
            if (addrZip) forceSet(`${prefix}.address.zip`, addrZip);
            if (cd.tax_id) forceSet(`${prefix}.tax_id`, cd.tax_id);
            if (license) forceSet(`${prefix}.License`, String(license));
          }

          debugLog(`[generate-document] Force-injected broker contact fields from participant (contact ${cr.contact_id}, license: ${license || 'n/a'}, rep: ${representativeName || 'n/a'}, address: ${fullAddress || 'n/a'})`);
        }
      }
    }
    // Bridge indexed entity keys (e.g., borrower1.full_name) to non-indexed aliases
    // (e.g., borrower.full_name) so legacy merge tag aliases can resolve
    const indexedPattern = /^([a-zA-Z_]+?)(\d+)\.(.+)$/;
    for (const [key, val] of [...fieldValues.entries()]) {
      const m = key.match(indexedPattern);
      if (m && m[2] === "1") {
        const nonIndexedKey = `${m[1]}.${m[3]}`;
        if (!fieldValues.has(nonIndexedKey)) {
          fieldValues.set(nonIndexedKey, val);
        }
      }
    }

    // Force text dataType for identifier fields that should never be number-formatted
    for (const [key, val] of fieldValues.entries()) {
      const lk = key.toLowerCase();
      if (lk.includes("loannumber") || lk.includes("loan_number") || lk.includes("accountnumber") || lk.includes("account_number") || lk.includes("licensenumber") || lk.includes("license_number") || lk.includes("brokerlicens") || lk.includes("brokerid")) {
        if (val.dataType !== "text") {
          debugLog(`[generate-document] Overriding dataType for ${key}: ${val.dataType} -> text`);
          fieldValues.set(key, { ...val, dataType: "text" });
        }
      }
    }

    // Bridge dot-notation origination keys to short-form aliases
    // e.g., origination_esc.escrow_number -> escrow_number
    // This ensures legacy template tags can resolve origination fields
    for (const [key, val] of [...fieldValues.entries()]) {
      if (key.startsWith("origination_")) {
        const dotIdx = key.indexOf(".");
        if (dotIdx > 0) {
          const shortKey = key.substring(dotIdx + 1);
          if (shortKey && !fieldValues.has(shortKey)) {
            fieldValues.set(shortKey, val);
          }
        }
      }
    }

    console.log(`[generate-document] Resolved ${fieldValues.size} field values for ${template.name}`);
    // Log a sample of field values for debugging
    const sampleKeys = [...fieldValues.keys()].slice(0, 30);
    console.log(`[generate-document] Sample field keys: ${sampleKeys.join(", ")}`);
    // Log specific fields we expect to find
    const debugFields = ["ln_p_loanAmount", "of_fe_801LenderLoanOrigin", "pr_p_street", "br_p_fullName", "of_re_interestRate", "of_re_impoundHazardIns"];
    for (const df of debugFields) {
      const val = fieldValues.get(df);
      console.log(`[generate-document] Field "${df}" = ${val ? JSON.stringify(val) : "NOT FOUND"}`);
    }

    // Inject systemDate so only templates using {{systemDate}} get the current date
    const systemDate = new Date().toISOString().split("T")[0]; // YYYY-MM-DD
    fieldValues.set("systemDate", { rawValue: systemDate, dataType: "date" });
    fieldValues.set("currentDate", { rawValue: systemDate, dataType: "date" });
    debugLog(`[generate-document] Injected systemDate and currentDate: ${systemDate}`);

    // Auto-compute origination_app.income.total_income as the sum of all income components.
    // Treats null/undefined/non-numeric values as 0. Does not overwrite if already provided.
    {
      const incomeKeys = [
        "origination_app.income.salary",
        "origination_app.income.interest",
        "origination_app.income.dividend",
        "origination_app.income.rental",
        "origination_app.income.other",
      ];
      const toNumber = (v: unknown): number => {
        if (v === null || v === undefined || v === "") return 0;
        const n = typeof v === "number" ? v : parseFloat(String(v).replace(/[$,\s]/g, ""));
        return isNaN(n) ? 0 : n;
      };
      const totalIncomeKey = "origination_app.income.total_income";
      const existingTotal = fieldValues.get(totalIncomeKey);
      if (!existingTotal || existingTotal.rawValue === null || existingTotal.rawValue === undefined || existingTotal.rawValue === "") {
        let total = 0;
        for (const k of incomeKeys) {
          const fd = getFieldData(k, fieldValues);
          if (fd) total += toNumber(fd.data.rawValue);
        }
        fieldValues.set(totalIncomeKey, { rawValue: total, dataType: "currency" });
        debugLog(`[generate-document] Computed ${totalIncomeKey} = ${total}`);
      }
    }

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
        debugLog(`[generate-document] Auto-computed borrower.borrower_description = "${description}"`);
      }
    }

    // Auto-compute propertyN.address from component fields for all properties
    // First, discover all property indices from field values
    const propertyIndices = new Set<number>();
    for (const [key] of fieldValues.entries()) {
      const propMatch = key.match(/^property(\d+)\./i);
      if (propMatch) {
        propertyIndices.add(parseInt(propMatch[1], 10));
      }
    }
    // Ensure at least property1 is checked
    propertyIndices.add(1);

    for (const idx of [...propertyIndices].sort((a, b) => a - b)) {
      const prefix = `property${idx}`;
      const existingAddr = fieldValues.get(`${prefix}.address`) || fieldValues.get(`Property${idx}.Address`);
      if (!existingAddr || !existingAddr.rawValue) {
        const street = fieldValues.get(`${prefix}.street`)?.rawValue;
        const city = fieldValues.get(`${prefix}.city`)?.rawValue;
        const state = fieldValues.get(`${prefix}.state`)?.rawValue;
        const zip = fieldValues.get(`${prefix}.zip`)?.rawValue;
        const county = fieldValues.get(`${prefix}.county`)?.rawValue;
        const country = fieldValues.get(`${prefix}.country`)?.rawValue;

        const parts = [street, city, state, country, zip].filter(Boolean).map(String);
        if (parts.length > 0) {
          const fullAddress = parts.join(", ");
          fieldValues.set(`${prefix}.address`, { rawValue: fullAddress, dataType: "text" });
          fieldValues.set(`Property${idx}.Address`, { rawValue: fullAddress, dataType: "text" });
          debugLog(`[generate-document] Auto-computed ${prefix}.address = "${fullAddress}"`);
        }
      }
    }

    // ── RE851D Multi-Property: publish per-index aliases (_1 ... _5) ──
    // For each property record present in CSR (property1..propertyN), publish
    // pr_p_<short>_<N>, propertytax_annual_payment_<N>, pr_p_delinquHowMany_<N>,
    // and computed pr_p_totalSenior_<N> / pr_p_totalSeniorPlusLoan_<N> /
    // ln_p_loanToValueRatio_<N>. Indices not present in CSR get NO alias set,
    // so the resolver falls through to empty string and the corresponding
    // RE851D block stays blank. Capped at 5 per spec; extras ignored.
    // Template-gated: only run for RE851D templates. The publisher writes
    // ~160 _N alias keys per generation; running it for unrelated templates
    // (e.g. RE885 HUD-1) is pure overhead that contributed to the
    // "Generation timed out (CPU limit exceeded)" failure.
    if (/851d/i.test(template.name || "")) {
      const MAX_PROPERTIES = 5;
      // Reverse: short suffix -> pr_p_* full key (mirrors prKeyToSuffix above)
      const suffixToPrKey: Record<string, string> = {};
      for (const [prKey, sfx] of Object.entries(prKeyToSuffix)) {
        suffixToPrKey[sfx] = prKey;
      }

      // Pre-compute total of all lien current_balance values per property name
      // (lien.property carries the property identifier the lien belongs to).
      const lienTotalsByPropertyName: Record<string, number> = {};
      for (const [key, val] of fieldValues.entries()) {
        const m = key.match(/^lien(\d*)\.current_balance$/);
        if (!m || !val.rawValue) continue;
        const lienIdx = m[1] ? parseInt(m[1], 10) : 0;
        const propKey = lienIdx > 0 ? `lien${lienIdx}.property` : "lien.property";
        const propName = String(fieldValues.get(propKey)?.rawValue || "").trim().toLowerCase();
        if (!propName) continue;
        const num = parseFloat(String(val.rawValue).replace(/[^0-9.-]/g, ""));
        if (!isNaN(num)) {
          lienTotalsByPropertyName[propName] = (lienTotalsByPropertyName[propName] || 0) + num;
        }
      }

      const loanAmountForLtv = parseFloat(
        String(
          fieldValues.get("ln_p_loanAmount")?.rawValue ||
          fieldValues.get("loan_terms.loan_amount")?.rawValue ||
          ""
        ).replace(/[^0-9.-]/g, "")
      );

      const sortedPropIndices = [...propertyIndices].sort((a, b) => a - b).slice(0, MAX_PROPERTIES);

      // ── RE851D: Build property-address → property-index map ──
      // Used to route propertytax{N} rows to their associated property by the
      // tax row's `.property` field (which carries the property's address).
      const normAddr = (s: string) => String(s || "").trim().toLowerCase().replace(/\s+/g, " ");
      const addressToPropIndex = new Map<string, number>();
      for (const pi of sortedPropIndices) {
        const a = normAddr(String(fieldValues.get(`property${pi}.address`)?.rawValue || ""));
        if (a && !addressToPropIndex.has(a)) addressToPropIndex.set(a, pi);
      }

      // ── RE851D: Pre-bridge propertytax{srcIdx} → propertytax{destIdx} by address match ──
      // Scan all propertytax{srcIdx}.property values; if they match a property's
      // normalized address, copy the four spec'd tax fields into the destination
      // index so the per-index tax publisher below emits per-property aliases.
      // Strict: only copy when destination key is empty; idx==1 canonical fallback
      // remains intact.
      {
        const TAX_FIELDS = ["annual_payment", "delinquent", "delinquent_amount", "source_of_information"];
        const srcIndices = new Set<number>();
        for (const [k] of fieldValues.entries()) {
          const m = k.match(/^propertytax(\d+)\./);
          if (m) srcIndices.add(parseInt(m[1], 10));
        }
        const bridgeLog: string[] = [];
        for (const srcIdx of srcIndices) {
          const propAddrRaw = String(fieldValues.get(`propertytax${srcIdx}.property`)?.rawValue || "");
          if (!propAddrRaw) continue;
          // Address may be stored as "Borrower - Street, City, ST, ZIP" — try
          // exact match first, then a relaxed match where the property address
          // is a substring of the tax-row property string.
          const propAddrNorm = normAddr(propAddrRaw);
          let destIdx = addressToPropIndex.get(propAddrNorm);
          if (!destIdx) {
            for (const [a, pi] of addressToPropIndex.entries()) {
              if (a && propAddrNorm.includes(a)) { destIdx = pi; break; }
            }
          }
          if (!destIdx || destIdx === srcIdx) continue;
          for (const tf of TAX_FIELDS) {
            const srcKey = `propertytax${srcIdx}.${tf}`;
            const destKey = `propertytax${destIdx}.${tf}`;
            const srcVal = fieldValues.get(srcKey);
            if (
              srcVal &&
              srcVal.rawValue !== undefined &&
              srcVal.rawValue !== null &&
              srcVal.rawValue !== "" &&
              !fieldValues.has(destKey)
            ) {
              fieldValues.set(destKey, { rawValue: srcVal.rawValue, dataType: srcVal.dataType });
            }
          }
          bridgeLog.push(`${srcIdx}->${destIdx}`);
        }
        if (bridgeLog.length > 0) {
          debugLog(`[generate-document] RE851D propertytax bridge (address-keyed): ${bridgeLog.join(", ")}`);
        }
      }

      for (const idx of sortedPropIndices) {
        const prefix = `property${idx}`;
        // Per-property field aliases (pr_p_<short>_<N> -> property{N}.<short>)
        for (const [sfx, prKey] of Object.entries(suffixToPrKey)) {
          const v = fieldValues.get(`${prefix}.${sfx}`);
          if (v && v.rawValue !== undefined && v.rawValue !== null && v.rawValue !== "") {
            fieldValues.set(`${prKey}_${idx}`, { rawValue: v.rawValue, dataType: v.dataType });
          }
        }
        // Annual property tax (UI: propertytax.annual_payment) per property
        const taxV =
          fieldValues.get(`${prefix}.annual_property_taxes`) ||
          fieldValues.get(`${prefix}.annual_tax`) ||
          fieldValues.get(`${prefix}.propertytax_annual_payment`);
        if (taxV?.rawValue) {
          fieldValues.set(`propertytax_annual_payment_${idx}`, { rawValue: taxV.rawValue, dataType: taxV.dataType || "currency" });
        }
        // Delinquent payment count
        const delinqV =
          fieldValues.get(`${prefix}.delinquent_how_many`) ||
          fieldValues.get(`${prefix}.delinqHowMany`) ||
          fieldValues.get(`${prefix}.pr_p_delinquHowMany`);
        if (delinqV?.rawValue) {
          fieldValues.set(`pr_p_delinquHowMany_${idx}`, { rawValue: delinqV.rawValue, dataType: delinqV.dataType || "number" });
        }
        // Per-property appraise value & owner (handle alternate canonical keys)
        // UI saves under `propertyN.appraised_value` (PropertyDetailsForm/fieldKeyMap.appraisedValue)
        const appraiseV =
          fieldValues.get(`${prefix}.appraised_value`) ||
          fieldValues.get(`${prefix}.appraise_value`) ||
          fieldValues.get(`${prefix}.appraiseValue`);
        if (appraiseV?.rawValue && !fieldValues.has(`pr_p_appraiseValue_${idx}`)) {
          fieldValues.set(`pr_p_appraiseValue_${idx}`, { rawValue: appraiseV.rawValue, dataType: appraiseV.dataType || "currency" });
        }
        const ownerV = fieldValues.get(`${prefix}.owner`) || fieldValues.get(`${prefix}.vesting`);
        if (ownerV?.rawValue && !fieldValues.has(`pr_p_owner_${idx}`)) {
          fieldValues.set(`pr_p_owner_${idx}`, { rawValue: ownerV.rawValue, dataType: ownerV.dataType || "text" });
        }

        // Computed: per-property total senior encumbrances.
        // Match lien.property by either property index ("property1") or by
        // property address (so users tagging by address still get totals).
        const propAddrLower = String(fieldValues.get(`${prefix}.address`)?.rawValue || "").trim().toLowerCase();
        const totalSenior =
          (lienTotalsByPropertyName[prefix.toLowerCase()] || 0) +
          (propAddrLower ? (lienTotalsByPropertyName[propAddrLower] || 0) : 0);
        if (totalSenior > 0) {
          const tsStr = totalSenior.toFixed(2);
          fieldValues.set(`pr_p_totalSenior_${idx}`, { rawValue: tsStr, dataType: "currency" });
          if (!isNaN(loanAmountForLtv)) {
            const tsPlusLoan = (totalSenior + loanAmountForLtv).toFixed(2);
            fieldValues.set(`pr_p_totalSeniorPlusLoan_${idx}`, { rawValue: tsPlusLoan, dataType: "currency" });
          }
        }

        // Computed: per-property LTV ratio = loan_amount / property{N}.appraised_value
        const appraiseNum = parseFloat(
          String(
            fieldValues.get(`pr_p_appraiseValue_${idx}`)?.rawValue ||
            fieldValues.get(`${prefix}.appraised_value`)?.rawValue ||
            fieldValues.get(`${prefix}.appraise_value`)?.rawValue ||
            ""
          ).replace(/[^0-9.-]/g, "")
        );
        if (!isNaN(loanAmountForLtv) && !isNaN(appraiseNum) && appraiseNum > 0) {
          const ltv = (loanAmountForLtv / appraiseNum) * 100;
          fieldValues.set(`ln_p_loanToValueRatio_${idx}`, { rawValue: ltv.toFixed(2), dataType: "percentage" });
        }

        // ── RE851D Part 2: per-property Property Type checkbox booleans ──
        // Each property block in Part 2 has its own checkbox group. Publish a
        // boolean alias per type for THIS property index only, sourced strictly
        // from property{idx}.propertyType. Missing type => all-false (no fallback
        // to another property — matches "If any field is missing: do NOT fallback"
        // acceptance criterion).
        {
          const PROPERTY_TYPES = [
            "singleFamily", "condominium", "multiUnit", "commercial",
            "land", "mobileHome", "industrial", "other",
          ];
          // Aliases: dropdown raw value → canonical type slug.
          const TYPE_ALIASES: Record<string, string> = {
            "single family": "singleFamily", "single-family": "singleFamily",
            "singlefamily": "singleFamily", "single_family": "singleFamily",
            "sfr": "singleFamily", "sfr 1-4": "singleFamily", "1-4 family": "singleFamily",
            "condo": "condominium", "condominium": "condominium",
            "condo / townhouse": "condominium", "condo/townhouse": "condominium",
            "townhouse": "condominium",
            "multi-unit": "multiUnit", "multi unit": "multiUnit",
            "multiunit": "multiUnit", "multi_unit": "multiUnit",
            "multifamily": "multiUnit", "multi family": "multiUnit",
            "multi-family": "multiUnit",
            "2-4 unit": "multiUnit", "5+ unit": "multiUnit",
            "commercial": "commercial", "office": "commercial", "retail": "commercial",
            "mixed-use": "commercial", "mixed use": "commercial",
            "restaurant / bar": "commercial", "restaurant/bar": "commercial",
            "group housing": "commercial",
            "land": "land", "vacant land": "land", "lot": "land", "farm": "land",
            "mobile home": "mobileHome", "mobile-home": "mobileHome",
            "mobilehome": "mobileHome", "manufactured": "mobileHome",
            "industrial": "industrial", "warehouse": "industrial",
            "other": "other",
          };
          const ptRaw = String(
            fieldValues.get(`pr_p_propertyTyp_${idx}`)?.rawValue ||
            fieldValues.get(`pr_p_propertyType_${idx}`)?.rawValue ||
            fieldValues.get(`${prefix}.propertyType`)?.rawValue ||
            fieldValues.get(`${prefix}.appraisal_property_type`)?.rawValue ||
            ""
          ).trim();
          const ptKey = TYPE_ALIASES[ptRaw.toLowerCase()] ||
            (PROPERTY_TYPES.includes(ptRaw) ? ptRaw : "");
          for (const t of PROPERTY_TYPES) {
            const isMatch = ptKey === t;
            // Only publish booleans when a real selection exists. If ptKey is empty
            // (no source value), do NOT publish — leaves SDT defaults intact and
            // keeps absent property blocks fully blank.
            if (ptKey) {
              fieldValues.set(`pr_p_propertyTyp_${idx}_${t}`, {
                rawValue: isMatch ? "true" : "false",
                dataType: "boolean",
              });
              // Glyph alias for templates using static check-mark fallbacks.
              fieldValues.set(`pr_p_propertyTyp_${idx}_${t}_glyph`, {
                rawValue: isMatch ? "☒" : "☐",
                dataType: "text",
              });
            }
          }
        }

        // ── RE851D: per-property Property Type → 7-checkbox mapping ──
        // Spec mapping (CSR Property Type dropdown → RE851D checkboxes):
        //   SFR 1-4                       → property_type_sfr_owner
        //   Condo / Townhouse             → property_type_sfr_non_owner
        //   Multi-family                  → property_type_commercial
        //   Commercial                    → property_type_commercial
        //   Commercial Income             → property_type_commercial
        //   Mixed-use                     → property_type_commercial
        //   Land SFR Residential          → property_type_sfr_zoned
        //   Land Residential              → property_type_land_zoned
        //   Land Commercial               → property_type_land_zoned
        //   Land Income Producing         → property_type_land_income
        //   <anything else>               → property_type_other (+ property_type_other_text = raw value)
        // Publishes booleans, glyphs, and text for index N. Mirrors as bare
        // (non-_N) aliases for index 1 so single-property templates work.
        {
          const RE851D_TARGETS = [
            "property_type_sfr_owner",
            "property_type_sfr_non_owner",
            "property_type_sfr_zoned",
            "property_type_commercial",
            "property_type_land_zoned",
            "property_type_land_income",
            "property_type_other",
          ];
          const SPEC_MAP: Record<string, string> = {
            "sfr 1-4": "property_type_sfr_owner",
            "sfr1-4": "property_type_sfr_owner",
            "sfr": "property_type_sfr_owner",
            "single family": "property_type_sfr_owner",
            "single-family": "property_type_sfr_owner",
            "singlefamily": "property_type_sfr_owner",
            "condo / townhouse": "property_type_sfr_non_owner",
            "condo/townhouse": "property_type_sfr_non_owner",
            "condo": "property_type_sfr_non_owner",
            "townhouse": "property_type_sfr_non_owner",
            "condominium": "property_type_sfr_non_owner",
            "multi-family": "property_type_commercial",
            "multi family": "property_type_commercial",
            "multifamily": "property_type_commercial",
            "commercial": "property_type_commercial",
            "commercial income": "property_type_commercial",
            "mixed-use": "property_type_commercial",
            "mixed use": "property_type_commercial",
            "land sfr residential": "property_type_sfr_zoned",
            "land residential": "property_type_land_zoned",
            "land commercial": "property_type_land_zoned",
            "land income producing": "property_type_land_income",
          };
          const ptRawSpec = String(
            fieldValues.get(`pr_p_propertyTyp_${idx}`)?.rawValue ||
            fieldValues.get(`pr_p_propertyType_${idx}`)?.rawValue ||
            fieldValues.get(`${prefix}.propertyType`)?.rawValue ||
            fieldValues.get(`${prefix}.appraisal_property_type`)?.rawValue ||
            ""
          ).trim();
          if (ptRawSpec) {
            const matched = SPEC_MAP[ptRawSpec.toLowerCase()] || "";
            const useOther = !matched;
            const otherText = useOther ? ptRawSpec : "";
            for (const t of RE851D_TARGETS) {
              const isMatch = useOther ? (t === "property_type_other") : (t === matched);
              fieldValues.set(`${t}_${idx}`, {
                rawValue: isMatch ? "true" : "false",
                dataType: "boolean",
              });
              fieldValues.set(`${t}_${idx}_glyph`, {
                rawValue: isMatch ? "☒" : "☐",
                dataType: "text",
              });
              if (idx === 1) {
                fieldValues.set(t, {
                  rawValue: isMatch ? "true" : "false",
                  dataType: "boolean",
                });
                fieldValues.set(`${t}_glyph`, {
                  rawValue: isMatch ? "☒" : "☐",
                  dataType: "text",
                });
              }
            }
            fieldValues.set(`property_type_other_text_${idx}`, {
              rawValue: otherText,
              dataType: "text",
            });
            if (idx === 1) {
              fieldValues.set("property_type_other_text", {
                rawValue: otherText,
                dataType: "text",
              });
            }
          }
        }

        // ── RE851D: per-property Owner-Occupied Yes/No checkbox booleans ──
        // Source strictly from property{idx}.occupancyStatus. Missing => no aliases.
        {
          const occRaw = String(
            fieldValues.get(`pr_p_occupancySt_${idx}`)?.rawValue ||
            fieldValues.get(`pr_p_occupanc_${idx}`)?.rawValue ||
            fieldValues.get(`${prefix}.occupancyStatus`)?.rawValue ||
            fieldValues.get(`${prefix}.appraisal_occupancy`)?.rawValue ||
            ""
          ).trim().toLowerCase();
          const isYes = [
            "yes", "y", "true", "owner occupied", "owner-occupied", "owneroccupied",
            "owner", "primary borrower",
          ].includes(occRaw);
          const isNo = [
            "no", "n", "false", "non-owner occupied", "non owner occupied", "nonowneroccupied",
            "investor", "tenant", "vacant", "secondary borrower", "other", "unknown",
          ].includes(occRaw);
          if (isYes || isNo) {
            fieldValues.set(`pr_p_occupancySt_${idx}_yes`, { rawValue: isYes ? "true" : "false", dataType: "boolean" });
            fieldValues.set(`pr_p_occupancySt_${idx}_no`, { rawValue: isNo ? "true" : "false", dataType: "boolean" });
            fieldValues.set(`pr_p_occupancySt_${idx}_yes_glyph`, { rawValue: isYes ? "☒" : "☐", dataType: "text" });
            fieldValues.set(`pr_p_occupancySt_${idx}_no_glyph`, { rawValue: isNo ? "☒" : "☐", dataType: "text" });
          }
        }

        // ── RE851D: per-property Expected / Remaining Senior Encumbrance from Lien data ──
        // Source: Lien section (lien{k}.anticipated, lien{k}.anticipated_amount,
        // lien{k}.new_remaining_balance, lien{k}.property). For each property index
        // we sum across every lien whose `lien{k}.property` matches either the
        // entity prefix ("property{idx}") OR the property's normalized address.
        // Strict per-index — no cross-index fallback.
        let lienExpectedSum = 0;
        let lienRemainingSum = 0;
        let lienExpectedHit = false;
        let lienRemainingHit = false;
        {
          const propAddrNorm = String(
            fieldValues.get(`${prefix}.address`)?.rawValue || ""
          ).trim().toLowerCase();
          const prefixLower = prefix.toLowerCase();
          // Discover all lien indices present (lien1.*, lien2.*, ...).
          const lienIndices = new Set<string>();
          for (const [k] of fieldValues.entries()) {
            const m = k.match(/^lien(\d*)\./);
            if (m) lienIndices.add(m[1]); // "" for canonical "lien."
          }
          for (const li of lienIndices) {
            const base = li ? `lien${li}` : "lien";
            const propRaw = String(fieldValues.get(`${base}.property`)?.rawValue || "")
              .trim().toLowerCase();
            if (!propRaw) continue;
            const matches =
              propRaw === prefixLower ||
              (!!propAddrNorm && (propRaw === propAddrNorm || propRaw.includes(propAddrNorm)));
            if (!matches) continue;
            const anticipatedRaw = String(
              fieldValues.get(`${base}.anticipated`)?.rawValue || ""
            ).trim().toLowerCase();
            const isAnticipated = ["true", "yes", "y", "1"].includes(anticipatedRaw);
            if (isAnticipated) {
              const amt = parseFloat(
                String(fieldValues.get(`${base}.anticipated_amount`)?.rawValue || "")
                  .replace(/[^0-9.-]/g, "")
              );
              if (!isNaN(amt)) {
                lienExpectedSum += amt;
                lienExpectedHit = true;
              }
            }
            const remAmt = parseFloat(
              String(fieldValues.get(`${base}.new_remaining_balance`)?.rawValue || "")
                .replace(/[^0-9.-]/g, "")
            );
            if (!isNaN(remAmt)) {
              lienRemainingSum += remAmt;
              lienRemainingHit = true;
            }
          }
          if (lienExpectedHit) {
            const v = { rawValue: lienExpectedSum.toFixed(2), dataType: "currency" as const };
            if (!fieldValues.has(`ln_p_expectedEncumbrance_${idx}`)) {
              fieldValues.set(`ln_p_expectedEncumbrance_${idx}`, v);
            }
            // Backfill legacy alias only if the static PropertyDetailsForm field is empty.
            const staticExpected = String(
              fieldValues.get(`${prefix}.expected_senior`)?.rawValue || ""
            ).trim();
            if (!staticExpected && !fieldValues.has(`pr_p_expectedSenior_${idx}`)) {
              fieldValues.set(`pr_p_expectedSenior_${idx}`, v);
            }
          }
          if (lienRemainingHit) {
            const v = { rawValue: lienRemainingSum.toFixed(2), dataType: "currency" as const };
            if (!fieldValues.has(`ln_p_remainingEncumbrance_${idx}`)) {
              fieldValues.set(`ln_p_remainingEncumbrance_${idx}`, v);
            }
            const staticRemaining = String(
              fieldValues.get(`${prefix}.remaining_senior`)?.rawValue || ""
            ).trim();
            if (!staticRemaining && !fieldValues.has(`pr_p_remainingSenior_${idx}`)) {
              fieldValues.set(`pr_p_remainingSenior_${idx}`, v);
            }
          }
        }

        // ── RE851D: per-property total encumbrance (remaining + expected senior) ──
        // Computed from property{idx}.* components, with fallback to the Lien-derived
        // sums computed just above. No cross-index fallback.
        {
          let remainingNum = parseFloat(
            String(fieldValues.get(`${prefix}.remaining_senior`)?.rawValue || "")
              .replace(/[^0-9.-]/g, "")
          );
          let expectedNum = parseFloat(
            String(fieldValues.get(`${prefix}.expected_senior`)?.rawValue || "")
              .replace(/[^0-9.-]/g, "")
          );
          if (isNaN(remainingNum) && lienRemainingHit) remainingNum = lienRemainingSum;
          if (isNaN(expectedNum) && lienExpectedHit) expectedNum = lienExpectedSum;
          const haveRemaining = !isNaN(remainingNum);
          const haveExpected = !isNaN(expectedNum);
          if (haveRemaining || haveExpected) {
            const total = (haveRemaining ? remainingNum : 0) + (haveExpected ? expectedNum : 0);
            if (!fieldValues.has(`pr_p_totalEncumbrance_${idx}`)) {
              fieldValues.set(`pr_p_totalEncumbrance_${idx}`, {
                rawValue: total.toFixed(2),
                dataType: "currency",
              });
            }
          }
        }

        // ── RE851D: per-property tax publisher ──
        // PropertyTax UI saves under propertytax{idx}.<field>. We publish four
        // per-index aliases (both underscore and dotted forms so either
        // {{propertytax.X_N}} or {{propertytax_X_N}} merge tags resolve after
        // the _N rewrite). Strictly per-index — no cross-index fallback for
        // idx >= 2. For idx === 1, fall back to the singular canonical
        // propertytax.<field> so legacy single-tax-record deals continue to
        // populate Property #1.
        {
          const taxFields: Array<[string, string]> = [
            ["annual_payment", "currency"],
            ["delinquent", "boolean"],
            ["delinquent_amount", "currency"],
            ["source_of_information", "text"],
          ];
          const taxPrefix = `propertytax${idx}`;
          for (const [tf, dt] of taxFields) {
            // Per-index source first (strict, no cross-index fallback)
            let v = fieldValues.get(`${taxPrefix}.${tf}`);
            // For idx === 1 only, fall back to canonical singular
            if ((!v || v.rawValue === undefined || v.rawValue === null || v.rawValue === "") && idx === 1) {
              v = fieldValues.get(`propertytax.${tf}`);
            }
            // Backward-compat: annual_payment also accepts the property{idx} variant
            if ((!v || v.rawValue === undefined || v.rawValue === null || v.rawValue === "") && tf === "annual_payment") {
              v =
                fieldValues.get(`${prefix}.annual_property_taxes`) ||
                fieldValues.get(`${prefix}.annual_tax`) ||
                fieldValues.get(`${prefix}.propertytax_annual_payment`);
            }
            if (v && v.rawValue !== undefined && v.rawValue !== null && v.rawValue !== "") {
              const dataType = v.dataType || dt;
              // Underscore form
              const underscoreKey = `propertytax_${tf}_${idx}`;
              if (!fieldValues.has(underscoreKey)) {
                fieldValues.set(underscoreKey, { rawValue: v.rawValue, dataType });
              }
              // Dotted form (matches {{propertytax.X_N}} after _N rewrite)
              const dottedKey = `propertytax.${tf}_${idx}`;
              if (!fieldValues.has(dottedKey)) {
                fieldValues.set(dottedKey, { rawValue: v.rawValue, dataType });
              }
            }
          }
        }

        // ── RE851D: per-property TAX DELINQUENT Yes/No checkbox booleans ──
        // After the propertytax bridge + per-index publisher, emit boolean +
        // glyph aliases so any {{propertytax_delinquent_N_yes}}-style tag in
        // the template resolves correctly. true → YES ☒ / false → NO ☒.
        {
          const delRaw = String(
            fieldValues.get(`propertytax_delinquent_${idx}`)?.rawValue ||
            fieldValues.get(`propertytax.delinquent_${idx}`)?.rawValue ||
            (idx === 1 ? fieldValues.get(`propertytax.delinquent`)?.rawValue : "") ||
            ""
          ).trim().toLowerCase();
          const isYes = ["true", "yes", "y", "1"].includes(delRaw);
          const isNo = ["false", "no", "n", "0"].includes(delRaw);
          if (isYes || isNo) {
            for (const base of [`propertytax_delinquent_${idx}`, `propertytax.delinquent_${idx}`]) {
              if (!fieldValues.has(`${base}_yes`)) {
                fieldValues.set(`${base}_yes`, { rawValue: isYes ? "true" : "false", dataType: "boolean" });
              }
              if (!fieldValues.has(`${base}_no`)) {
                fieldValues.set(`${base}_no`, { rawValue: isNo ? "true" : "false", dataType: "boolean" });
              }
              if (!fieldValues.has(`${base}_yes_glyph`)) {
                fieldValues.set(`${base}_yes_glyph`, { rawValue: isYes ? "☒" : "☐", dataType: "text" });
              }
              if (!fieldValues.has(`${base}_no_glyph`)) {
                fieldValues.set(`${base}_no_glyph`, { rawValue: isNo ? "☒" : "☐", dataType: "text" });
              }
            }
          }
        }
      }
      debugLog(`[generate-document] RE851D multi-property: published indexed aliases for properties [${sortedPropIndices.join(", ")}]`);

      // ── RE851D anti-fallback shield ──
      // For every _N-family tag that the rewrite block (line 2066) will produce
      // for indices 1..5, ensure a per-index entry exists in fieldValues. If
      // the publishers above did not set one (because no per-index source data
      // existed), write an empty string so the resolver's canonical_key
      // fallback cannot collapse pr_p_address_2 → pr_p_address (which would
      // print Property #1's data inside Property #2's block — the reported bug).
      {
        const SHIELD_BASES = [
          "pr_p_address", "pr_p_street", "pr_p_city", "pr_p_state",
          "pr_p_zip", "pr_p_county", "pr_p_country", "pr_p_apn",
          "pr_p_owner", "pr_p_marketValue", "pr_p_appraiseValue",
          "pr_p_appraiseDate", "pr_p_appraiserStreet", "pr_p_appraiserCity",
          "pr_p_appraiserState", "pr_p_appraiserZip", "pr_p_appraiserPhone",
          "pr_p_appraiserEmail", "pr_p_legalDescri", "pr_p_yearBuilt",
          "pr_p_squareFeet", "pr_p_lotSize", "pr_p_numberOfUni",
          "pr_p_propertyTyp", "pr_p_propertyType", "pr_p_occupancySt",
          "pr_p_occupanc", "pr_p_remainingSenior", "pr_p_expectedSenior",
          "pr_p_totalSenior", "pr_p_totalEncumbrance", "pr_p_totalSeniorPlusLoan",
          "pr_p_construcType", "pr_p_purchasePrice", "pr_p_downPayme",
          "pr_p_protectiveEquity", "pr_p_descript", "pr_p_ltv", "pr_p_cltv",
          "pr_p_zoning", "pr_p_floodZone", "pr_p_pledgedEquity",
          "pr_p_delinquHowMany",
          "ln_p_loanToValueRatio",
          "propertytax_annual_payment", "propertytax.annual_payment",
          "propertytax_delinquent", "propertytax.delinquent",
          "propertytax_delinquent_amount", "propertytax.delinquent_amount",
          "propertytax_source_of_information", "propertytax.source_of_information",
          "property_type_sfr_owner", "property_type_sfr_non_owner",
          "property_type_sfr_zoned", "property_type_commercial",
          "property_type_land_zoned", "property_type_land_income",
          "property_type_other", "property_type_other_text",
        ];
        const blanked: number[] = [];
        for (let idx = 1; idx <= MAX_PROPERTIES; idx++) {
          let blankedThisIdx = false;
          for (const base of SHIELD_BASES) {
            const key = `${base}_${idx}`;
            if (!fieldValues.has(key)) {
              fieldValues.set(key, { rawValue: "", dataType: "text" });
              blankedThisIdx = true;
            }
          }
          if (blankedThisIdx) blanked.push(idx);
        }
        if (blanked.length > 0) {
          debugLog(`[generate-document] RE851D anti-fallback shield: blanked unpublished _N tags for indices [${blanked.join(", ")}]`);
        }
      }
    }

    // Auto-compute pr_p_address from pr_p_* component fields (new naming convention)
    const existingPrPAddr = fieldValues.get("pr_p_address");
    if (!existingPrPAddr || !existingPrPAddr.rawValue) {
      const street = fieldValues.get("pr_p_street")?.rawValue;
      const city = fieldValues.get("pr_p_city")?.rawValue;
      const state = fieldValues.get("pr_p_state")?.rawValue;
      const zip = fieldValues.get("pr_p_zip")?.rawValue;
      const county = fieldValues.get("pr_p_county")?.rawValue;
      const country = fieldValues.get("pr_p_country")?.rawValue;
      const parts = [street, city, state, country, zip].filter(Boolean).map(String);
      if (parts.length > 0) {
        const fullAddress = parts.join(", ");
        fieldValues.set("pr_p_address", { rawValue: fullAddress, dataType: "text" });
        debugLog(`[generate-document] Auto-computed pr_p_address = "${fullAddress}"`);
      }
    }

    // Auto-compute ln_p_loanToValueRatio if not already set
    const existingLtv = fieldValues.get("ln_p_loanToValueRatio");
    if (!existingLtv || !existingLtv.rawValue) {
      const loanAmountVal = fieldValues.get("ln_p_loanAmount")?.rawValue || fieldValues.get("loan_terms.loan_amount")?.rawValue;
      const appraiseVal = fieldValues.get("pr_p_appraiseValue")?.rawValue || fieldValues.get("property1.appraise_value")?.rawValue;
      const loanNum = parseFloat(String(loanAmountVal || "").replace(/[^0-9.-]/g, ""));
      const appraiseNum = parseFloat(String(appraiseVal || "").replace(/[^0-9.-]/g, ""));
      if (!isNaN(loanNum) && !isNaN(appraiseNum) && appraiseNum > 0) {
        const ltv = (loanNum / appraiseNum) * 100;
        const ltvStr = ltv.toFixed(2);
        fieldValues.set("ln_p_loanToValueRatio", { rawValue: ltvStr, dataType: "percentage" });
        fieldValues.set("loan_terms.loan_to_value_ratio", { rawValue: ltvStr, dataType: "percentage" });
        debugLog(`[generate-document] Auto-computed ln_p_loanToValueRatio = ${ltvStr}%`);
      }
    }

    // Auto-compute ln_p_loanAmountDivByEstimateValue if not already set
    // Formula: Loan Amount / Estimate of Value (pr_p_appraiseValue)
    // Renders blank when Estimate is missing or 0 (no divide-by-zero).
    const existingLoanDivEstimate = fieldValues.get("ln_p_loanAmountDivByEstimateValue");
    if (!existingLoanDivEstimate || !existingLoanDivEstimate.rawValue) {
      const loanAmountVal2 = fieldValues.get("ln_p_loanAmount")?.rawValue || fieldValues.get("loan_terms.loan_amount")?.rawValue;
      const estimateVal = fieldValues.get("pr_p_appraiseValue")?.rawValue || fieldValues.get("property1.appraise_value")?.rawValue;
      const loanNum2 = parseFloat(String(loanAmountVal2 || "").replace(/[^0-9.-]/g, ""));
      const estimateNum = parseFloat(String(estimateVal || "").replace(/[^0-9.-]/g, ""));
      if (!isNaN(loanNum2) && !isNaN(estimateNum) && estimateNum > 0) {
        const ratio = loanNum2 / estimateNum;
        const ratioStr = ratio.toFixed(4);
        const pctStr = (ratio * 100).toFixed(2);
        fieldValues.set("ln_p_loanAmountDivByEstimateValue", { rawValue: ratioStr, dataType: "number" });
        fieldValues.set("ln_p_loanAmountDivByEstimateValue_pct", { rawValue: pctStr, dataType: "percentage" });
        debugLog(`[generate-document] Auto-computed ln_p_loanAmountDivByEstimateValue = ${ratioStr} (pct=${pctStr}%)`);
      }
    }

    // Alias pr_pd_estimateValue from pr_p_appraiseValue if not already set
    // (RE851A "MARKET VALUE OF PROPERTY (SEE PART 9)" uses {{pr_pd_estimateValue}})
    const existingEstimate = fieldValues.get("pr_pd_estimateValue");
    if (!existingEstimate || existingEstimate.rawValue === undefined || existingEstimate.rawValue === null || existingEstimate.rawValue === "") {
      const sourceEstimate = fieldValues.get("pr_p_appraiseValue") || fieldValues.get("property1.appraise_value");
      if (sourceEstimate && sourceEstimate.rawValue !== undefined && sourceEstimate.rawValue !== null && sourceEstimate.rawValue !== "") {
        fieldValues.set("pr_pd_estimateValue", { rawValue: sourceEstimate.rawValue, dataType: sourceEstimate.dataType || "currency" });
        debugLog(`[generate-document] Aliased pr_pd_estimateValue from pr_p_appraiseValue = ${sourceEstimate.rawValue}`);
      }
    }

    // Auto-compute ln_p_months if not already set (bridge from number_of_payments)
    const existingMonths = fieldValues.get("ln_p_months");
    if (!existingMonths || !existingMonths.rawValue) {
      const numPayments = fieldValues.get("ln_p_numberOfPaymen")?.rawValue || fieldValues.get("loan_terms.number_of_payments")?.rawValue;
      if (numPayments) {
        fieldValues.set("ln_p_months", { rawValue: String(numPayments), dataType: "number" });
        fieldValues.set("loan_terms.months", { rawValue: String(numPayments), dataType: "number" });
        debugLog(`[generate-document] Auto-bridged ln_p_months from number_of_payments = ${numPayments}`);
      }
    }

    // Bridge ld_fd_fundingAmount from lender funding data or loan amount if not set
    const existingFundingAmt = fieldValues.get("ld_fd_fundingAmount");
    if (!existingFundingAmt || !existingFundingAmt.rawValue) {
      const lenderFunding = fieldValues.get("lender.funding.amount")?.rawValue;
      const loanAmount = fieldValues.get("ln_p_loanAmount")?.rawValue || fieldValues.get("loan_terms.loan_amount")?.rawValue;
      const fundingVal = lenderFunding || loanAmount;
      if (fundingVal) {
        fieldValues.set("ld_fd_fundingAmount", { rawValue: String(fundingVal), dataType: "currency" });
        debugLog(`[generate-document] Auto-bridged ld_fd_fundingAmount = ${fundingVal}`);
      }
    }

    // Auto-compute ln_p_estimateBallooPaymen (Estimated Balloon Payment) if not already set.
    // Mirrors the read-only UI calculation in LoanTermsBalancesForm:
    //   estimatedBalloon = totalBalanceDue + (loanAmount * noteRate / 100) / 12
    // where totalBalanceDue = principal + unpaidInterest + accruedInterest
    //                       + chargesOwed + chargesInterest + unpaidOther
    const existingEstBalloon = fieldValues.get("ln_p_estimateBallooPaymen");
    if (!existingEstBalloon || !existingEstBalloon.rawValue) {
      const numFromKeys = (...keys: string[]): number => {
        for (const k of keys) {
          const raw = fieldValues.get(k)?.rawValue;
          if (raw === undefined || raw === null || raw === "") continue;
          const n = parseFloat(String(raw).replace(/[^0-9.-]/g, ""));
          if (!isNaN(n)) return n;
        }
        return 0;
      };
      const principal = numFromKeys("ln_p_principa", "loan_terms.principal");
      const unpaidInterest = numFromKeys("ln_bl_unpaidIntere", "loan_terms.unpaid_interest");
      const accruedInterest = numFromKeys("ln_p_accruedIntere", "loan_terms.accrued_interest");
      const chargesOwed = numFromKeys("ln_p_chargesOwed", "loan_terms.charges_owed");
      const chargesInterest = numFromKeys("ln_p_chargesIntere", "loan_terms.charges_interest");
      const unpaidOther = numFromKeys("ln_p_unpaidOther", "loan_terms.unpaid_other");
      const loanAmt = numFromKeys("ln_p_loanAmount", "loan_terms.loan_amount");
      const noteRate = numFromKeys("ln_p_noteRate", "loan_terms.note_rate");

      const totalBalanceDue =
        principal + unpaidInterest + accruedInterest +
        chargesOwed + chargesInterest + unpaidOther;
      const oneMonthInterest = (loanAmt * (noteRate / 100)) / 12;
      const estimatedBalloon = totalBalanceDue + oneMonthInterest;

      if (estimatedBalloon > 0 || loanAmt > 0 || principal > 0) {
        const estStr = estimatedBalloon.toFixed(2);
        fieldValues.set("ln_p_estimateBallooPaymen", { rawValue: estStr, dataType: "currency" });
        fieldValues.set("loan_terms.estimated_balloon_payment", { rawValue: estStr, dataType: "currency" });
        debugLog(`[generate-document] Auto-computed ln_p_estimateBallooPaymen = ${estStr} (totalBalanceDue=${totalBalanceDue}, oneMonthInterest=${oneMonthInterest})`);
      }
    }

    // ── Dropdown-to-Checkbox derivation for Re851a ──
    // Amortization dropdown → boolean checkbox keys (CHECK ONE — mutually exclusive)
    const amortVal = (fieldValues.get("ln_p_amortiza")?.rawValue || fieldValues.get("loan_terms.amortization")?.rawValue || "").toString().trim().toLowerCase();
    const isFullyAmortized = ["fully_amortized", "fully amortized", "amortized"].includes(amortVal);
    const isPartiallyAmortized = ["partially_amortized", "partially amortized", "amortized partially"].includes(amortVal);
    const isInterestOnly = ["interest_only", "interest only", "interestonly"].includes(amortVal);
    const isConstantAmortization = ["constant_amortization", "constant amortization", "constantamortization"].includes(amortVal);
    const isAddOnInterest = ["add_on_interest", "add-on interest", "add on interest", "addoninterest", "addon interest"].includes(amortVal);
    const isAmortOther = amortVal === "other";
    fieldValues.set("ln_p_amortized", { rawValue: isFullyAmortized ? "true" : "false", dataType: "boolean" });
    fieldValues.set("ln_p_amortizedPartially", { rawValue: isPartiallyAmortized ? "true" : "false", dataType: "boolean" });
    fieldValues.set("ln_p_interestOnly", { rawValue: isInterestOnly ? "true" : "false", dataType: "boolean" });
    fieldValues.set("ln_p_constantAmortization", { rawValue: isConstantAmortization ? "true" : "false", dataType: "boolean" });
    fieldValues.set("ln_p_addOnInterest", { rawValue: isAddOnInterest ? "true" : "false", dataType: "boolean" });
    fieldValues.set("ln_p_other", { rawValue: isAmortOther ? "true" : "false", dataType: "boolean" });
    // Glyph aliases for templates that render static ☐/☑ via merge tag instead of a boolean checkbox.
    fieldValues.set("ln_p_amortizedGlyph", { rawValue: isFullyAmortized ? "☑" : "☐", dataType: "text" });
    fieldValues.set("ln_p_amortizedPartiallyGlyph", { rawValue: isPartiallyAmortized ? "☑" : "☐", dataType: "text" });
    fieldValues.set("ln_p_interestOnlyGlyph", { rawValue: isInterestOnly ? "☑" : "☐", dataType: "text" });
    fieldValues.set("ln_p_constantAmortizationGlyph", { rawValue: isConstantAmortization ? "☑" : "☐", dataType: "text" });
    fieldValues.set("ln_p_addOnInterestGlyph", { rawValue: isAddOnInterest ? "☑" : "☐", dataType: "text" });
    fieldValues.set("ln_p_otherGlyph", { rawValue: isAmortOther ? "☑" : "☐", dataType: "text" });
    debugLog(`[generate-document] Derived amortization checkboxes from "${amortVal}": amortized=${isFullyAmortized}, amortizedPartially=${isPartiallyAmortized}, interestOnly=${isInterestOnly}, constantAmortization=${isConstantAmortization}, addOnInterest=${isAddOnInterest}, other=${isAmortOther}`);

    // Payment Frequency dropdown → boolean checkbox keys
    const payFreqVal = (fieldValues.get("ln_p_paymentFreque")?.rawValue || fieldValues.get("loan_terms.payment_frequency")?.rawValue || "").toString().trim().toLowerCase();
    fieldValues.set("ln_p_paymentMonthly", { rawValue: payFreqVal === "monthly" ? "true" : "false", dataType: "boolean" });
    fieldValues.set("ln_p_paymentWeekly", { rawValue: payFreqVal === "weekly" ? "true" : "false", dataType: "boolean" });
    debugLog(`[generate-document] Derived payment frequency checkboxes from "${payFreqVal}": monthly=${payFreqVal === "monthly"}, weekly=${payFreqVal === "weekly"}`);

    // Balloon Payment (RE851A Part 3) → boolean checkbox key
    // UI persists under loan_terms.balloon_payment (legacy alias ln_p_balloonPaymen, note truncated key).
    // Template uses {{ln_p_balloonPayment}} (full spelling) for YES/NO conditional checkboxes.
    const balloonRaw = (
      fieldValues.get("loan_terms.balloon_payment")?.rawValue ??
      fieldValues.get("ln_p_balloonPaymen")?.rawValue ??
      fieldValues.get("ln_p_balloonPayment")?.rawValue ?? ""
    ).toString().trim().toLowerCase();
    const balloonTrue = ["true", "1", "yes", "on", "checked"].includes(balloonRaw);
    fieldValues.set("ln_p_balloonPayment", { rawValue: balloonTrue ? "true" : "false", dataType: "boolean" });
    fieldValues.set("ln_p_balloonPaymen", { rawValue: balloonTrue ? "true" : "false", dataType: "boolean" });
    fieldValues.set("loan_terms.balloon_payment", { rawValue: balloonTrue ? "true" : "false", dataType: "boolean" });
    debugLog(`[generate-document] Derived ln_p_balloonPayment from "${balloonRaw}": ${balloonTrue}`);

    // Subordination Provision (RE851A Yes/No row) → boolean checkbox key.
    // CSR persists under loan_terms.subordination_provision; template references
    // {{ln_p_subordinationProvision}}. Republish normalized boolean under both
    // names so the conditional always evaluates against the saved value.
    const subordinationRaw = (
      fieldValues.get("ln_p_subordinationProvision")?.rawValue ??
      fieldValues.get("loan_terms.subordination_provision")?.rawValue ??
      ""
    ).toString().trim().toLowerCase();
    const subordinationTrue = ["true", "yes", "y", "1", "checked", "on"].includes(subordinationRaw);
    fieldValues.set("ln_p_subordinationProvision", { rawValue: subordinationTrue ? "true" : "false", dataType: "boolean" });
    fieldValues.set("loan_terms.subordination_provision", { rawValue: subordinationTrue ? "true" : "false", dataType: "boolean" });
    console.log(`[generate-document] Derived ln_p_subordinationProvision from "${subordinationRaw}" (rawType=${typeof subordinationRaw}): normalized=${subordinationTrue}`);

    // Broker Capacity in Transaction (RE851A Part 2) → boolean checkbox keys
    // Derived from "Is Broker Also a Borrower?" UI checkbox. The UI persists this
    // under origination_app.doc.is_broker_also_borrower_yes (legacy alias
    // or_p_isBrokerAlsoBorrower_yes); also accept legacy variants.
    const brkBorrowerRaw = (
      fieldValues.get("or_p_isBrokerAlsoBorrower_yes")?.rawValue ??
      fieldValues.get("origination_app.doc.is_broker_also_borrower_yes")?.rawValue ??
      fieldValues.get("or_p_isBrkBorrower")?.rawValue ??
      fieldValues.get("origination.is_broker_also_a_borrower")?.rawValue ??
      ""
    ).toString().trim().toLowerCase();
    const brkBorrowerTrue = ["true", "yes", "y", "1", "checked", "on"].includes(brkBorrowerRaw);
    fieldValues.set("or_p_brkCapacityPrincipal", { rawValue: brkBorrowerTrue ? "true" : "false", dataType: "boolean" });
    fieldValues.set("or_p_brkCapacityAgent", { rawValue: brkBorrowerTrue ? "false" : "true", dataType: "boolean" });
    // Also publish under or_p_isBrkBorrower so any {{#if or_p_isBrkBorrower}} blocks
    // in the RE851A template evaluate against the same source of truth.
    fieldValues.set("or_p_isBrkBorrower", { rawValue: brkBorrowerTrue ? "true" : "false", dataType: "boolean" });
    // Also publish glyph-form aliases so simple {{or_p_isBrkBorrower_glyph}} or
    // direct A/B glyph merge tags resolve correctly without altering layout.
    fieldValues.set("or_p_brkCapacityAgentGlyph", { rawValue: brkBorrowerTrue ? "☐" : "☑", dataType: "text" });
    fieldValues.set("or_p_brkCapacityPrincipalGlyph", { rawValue: brkBorrowerTrue ? "☑" : "☐", dataType: "text" });
    console.log(`[generate-document] Derived broker capacity checkboxes from "${brkBorrowerRaw}": agent=${!brkBorrowerTrue}, principal=${brkBorrowerTrue}, isBrkBorrower=${brkBorrowerTrue}`);

    // Servicing Agent (RE851A Servicing section) → boolean checkbox keys.
    // CSR persists the dropdown under origination_svc.servicing_agent. The
    // RE851A template has three mutually-exclusive checkboxes that toggle
    // based on the selected value:
    //   - Lender                 → "THERE ARE NO SERVICING ARRANGEMENTS"
    //   - Broker                 → "BROKER IS THE SERVICING AGENT"
    //   - Company / Other Servicer → "ANOTHER QUALIFIED PARTY WILL SERVICE THE LOAN"
    // We publish boolean + glyph aliases under several plausible merge-tag
    // names so the template's existing {{#if ...}} blocks resolve correctly
    // without requiring template edits.
    const servicingAgentRaw = (
      fieldValues.get("origination_svc.servicing_agent")?.rawValue ??
      fieldValues.get("sv_p_servicingAgent")?.rawValue ??
      fieldValues.get("loan_terms.servicing_agent")?.rawValue ??
      ""
    ).toString().trim().toLowerCase();
    const isLenderServicing = servicingAgentRaw === "lender";
    const isBrokerServicing = servicingAgentRaw === "broker";
    const isOtherServicing = servicingAgentRaw === "company" || servicingAgentRaw === "other servicer" || servicingAgentRaw === "other";
    const setBool = (k: string, v: boolean) => fieldValues.set(k, { rawValue: v ? "true" : "false", dataType: "boolean" });
    const setGlyph = (k: string, v: boolean) => fieldValues.set(k, { rawValue: v ? "☑" : "☐", dataType: "text" });
    // "No servicing arrangements" (Lender)
    setBool("sv_p_noServicingArrangements", isLenderServicing);
    setBool("sv_p_lenderServicing", isLenderServicing);
    setBool("sv_p_isLenderServicing", isLenderServicing);
    setGlyph("sv_p_noServicingArrangementsGlyph", isLenderServicing);
    setGlyph("sv_p_lenderServicingGlyph", isLenderServicing);
    // "Broker is the servicing agent"
    setBool("sv_p_brokerIsServicingAgent", isBrokerServicing);
    setBool("sv_p_brokerServicing", isBrokerServicing);
    setBool("sv_p_isBrokerServicing", isBrokerServicing);
    setGlyph("sv_p_brokerIsServicingAgentGlyph", isBrokerServicing);
    setGlyph("sv_p_brokerServicingGlyph", isBrokerServicing);
    // "Another qualified party will service the loan" (Company / Other Servicer)
    setBool("sv_p_anotherQualifiedParty", isOtherServicing);
    setBool("sv_p_otherServicing", isOtherServicing);
    setBool("sv_p_isOtherServicing", isOtherServicing);
    setBool("sv_p_qualifiedPartyServicing", isOtherServicing);
    setGlyph("sv_p_anotherQualifiedPartyGlyph", isOtherServicing);
    setGlyph("sv_p_otherServicingGlyph", isOtherServicing);
    // Publish the canonical merge key the RE851A template references directly
    // in {{#if (eq sv_p_servicingAgent "Lender" | "Broker" | "Company" | "Other Servicer")}}.
    // Title-case so even non-case-insensitive consumers resolve correctly; the
    // (eq ...) evaluator already lowercases both sides for the comparison.
    const canonicalServicingAgent =
      isLenderServicing ? "Lender" :
      isBrokerServicing ? "Broker" :
      servicingAgentRaw === "company" ? "Company" :
      (servicingAgentRaw === "other servicer" || servicingAgentRaw === "other") ? "Other Servicer" :
      "";
    fieldValues.set("sv_p_servicingAgent", { rawValue: canonicalServicingAgent, dataType: "text" });
    // Also publish under the oo_svc_* prefix (Other Origination → Servicing) used
    // by newer RE851A template revisions: {{#if (eq oo_svc_servicingAgent "Broker")}}.
    fieldValues.set("oo_svc_servicingAgent", { rawValue: canonicalServicingAgent, dataType: "text" });
    console.log(`[generate-document] Derived servicing-agent checkboxes from "${servicingAgentRaw}": lender=${isLenderServicing}, broker=${isBrokerServicing}, other=${isOtherServicing}, sv_p_servicingAgent="${canonicalServicingAgent}", oo_svc_servicingAgent="${canonicalServicingAgent}"`);

    // Loan -> Servicing Details -> Payable (Monthly / Quarterly / Annually).
    // CSR persists the dropdown under loan_terms.servicing.payable (and the
    // legacy `origination_svc.payable`). The RE851A template references
    // `loan_terms.servicing.payable_annually` inside its
    // {{#if (eq loan_terms.servicing.payable_annually "Monthly")}} /
    // {{#if (eq loan_terms.servicing.payable_annually "Annually")}} blocks.
    // Publish a canonical (title-cased) alias under the template's expected
    // key so those blocks resolve correctly without altering the template,
    // the UI field key, or the database mapping. Also publish boolean +
    // glyph aliases for downstream consumers, mirroring the Servicing Agent
    // pattern above.
    const payableRaw = (
      fieldValues.get("loan_terms.servicing.payable")?.rawValue ??
      fieldValues.get("origination_svc.payable")?.rawValue ??
      fieldValues.get("loan_terms.servicing.payable_annually")?.rawValue ??
      ""
    ).toString().trim().toLowerCase();
    const isPayableMonthly = payableRaw === "monthly";
    const isPayableQuarterly = payableRaw === "quarterly";
    const isPayableAnnually = payableRaw === "annually" || payableRaw === "annual" || payableRaw === "yearly";
    const canonicalPayable =
      isPayableMonthly ? "Monthly" :
      isPayableQuarterly ? "Quarterly" :
      isPayableAnnually ? "Annually" :
      "";
    if (canonicalPayable) {
      fieldValues.set("loan_terms.servicing.payable_annually", { rawValue: canonicalPayable, dataType: "text" });
      fieldValues.set("loan_terms.servicing.payable", { rawValue: canonicalPayable, dataType: "text" });
      fieldValues.set("origination_svc.payable", { rawValue: canonicalPayable, dataType: "text" });
      setBool("sv_p_payableMonthly", isPayableMonthly);
      setBool("sv_p_payableAnnually", isPayableAnnually);
      setGlyph("sv_p_payableMonthlyGlyph", isPayableMonthly);
      setGlyph("sv_p_payableAnnuallyGlyph", isPayableAnnually);
    }
    console.log(`[generate-document] Derived payable-frequency checkboxes from "${payableRaw}": monthly=${isPayableMonthly}, annually=${isPayableAnnually}, canonical="${canonicalPayable}"`);


    // Build all_properties_list and multi-property pr_p_address
    if (propertyIndices.size > 0) {
      const sortedIndices = [...propertyIndices].sort((a, b) => a - b);
      const propertyLines: string[] = [];
      const seenAddresses = new Set<string>();
      for (const idx of sortedIndices) {
        const addr = fieldValues.get(`property${idx}.address`)?.rawValue || fieldValues.get(`Property${idx}.Address`)?.rawValue;
        if (addr) {
          const addrStr = String(addr);
          if (!seenAddresses.has(addrStr)) {
            seenAddresses.add(addrStr);
            propertyLines.push(addrStr.trim());
          }
        }
      }
      if (propertyLines.length > 0) {
        const normalizedPropertyLines = propertyLines.map((line) =>
          String(line)
            .replace(/\r\n?/g, "\n")
            .split("\n")
            .map((part) => part.trim())
            .filter(Boolean)
            .join(" ")
            .replace(/\t+/g, " ")
            .replace(/ {2,}/g, " ")
            .trim()
        );
        const allPropertiesText = normalizedPropertyLines.join("\n");
        fieldValues.set("all_properties_list", { rawValue: allPropertiesText, dataType: "text" });
        debugLog(`[generate-document] Built all_properties_list with ${propertyLines.length} properties`);
      }
      // NOTE: Do NOT overwrite pr_p_address / property1.address / Property1.Address with the
      // joined multi-line string when multiple properties exist. RE851D and similar multi-block
      // templates rely on per-index aliases (pr_p_address_1, pr_p_address_2, ...) so each
      // property block populates with its own data. Concatenating all addresses into
      // pr_p_address caused every property block to display the same combined list.
      // Templates that need the combined list can use {{all_properties_list}}.
    }


    const existingBrPFullName = fieldValues.get("br_p_fullName");
    if (!existingBrPFullName || !existingBrPFullName.rawValue) {
      // Check indexed borrower keys first
      const b1FullName = fieldValues.get("borrower1.full_name") || fieldValues.get("borrower.full_name");
      if (b1FullName && b1FullName.rawValue) {
        fieldValues.set("br_p_fullName", { rawValue: b1FullName.rawValue, dataType: "text" });
        debugLog(`[generate-document] Auto-computed br_p_fullName = "${b1FullName.rawValue}"`);
      } else {
        // Try assembling from borrower name components
        const bFirstName = fieldValues.get("borrower1.first_name")?.rawValue || fieldValues.get("borrower.first_name")?.rawValue || fieldValues.get("br_p_firstName")?.rawValue;
        const bMiddleName = fieldValues.get("borrower1.middle_initial")?.rawValue || fieldValues.get("borrower.middle_initial")?.rawValue || fieldValues.get("br_p_middleInitia")?.rawValue;
        const bLastName = fieldValues.get("borrower1.last_name")?.rawValue || fieldValues.get("borrower.last_name")?.rawValue || fieldValues.get("br_p_lastName")?.rawValue;
        const bNameParts = [bFirstName, bMiddleName, bLastName].filter(Boolean).map(String);
        if (bNameParts.length > 0) {
          const fullName = bNameParts.join(" ");
          fieldValues.set("br_p_fullName", { rawValue: fullName, dataType: "text" });
          debugLog(`[generate-document] Auto-computed br_p_fullName from components = "${fullName}"`);
        } else {
          // Final fallback: check Loan Details borrower name field
          const loanDetailsBorrowerName = fieldValues.get("loan_terms.details_borrower_name");
          if (loanDetailsBorrowerName?.rawValue) {
            fieldValues.set("br_p_fullName", { rawValue: loanDetailsBorrowerName.rawValue, dataType: "text" });
            debugLog(`[generate-document] Auto-computed br_p_fullName from loan_terms.details_borrower_name = "${loanDetailsBorrowerName.rawValue}"`);
          }
        }
      }
    }
    // Bridge reverse: if br_p_fullName has data but dot-notation variants don't
    const resolvedBrPFullName = fieldValues.get("br_p_fullName");
    if (resolvedBrPFullName?.rawValue) {
      if (!fieldValues.has("borrower.full_name")) {
        fieldValues.set("borrower.full_name", resolvedBrPFullName);
      }
      if (!fieldValues.has("borrower1.full_name")) {
        fieldValues.set("borrower1.full_name", resolvedBrPFullName);
      }
    }

    // Auto-compute Broker.Name from broker1 name components if not already set
    const existingBrokerName = fieldValues.get("Broker.Name") || fieldValues.get("broker.name");
    if (!existingBrokerName || !existingBrokerName.rawValue) {
      const firstName = fieldValues.get("broker1.first_name")?.rawValue;
      const middleName = fieldValues.get("broker1.middle_name")?.rawValue;
      const lastName = fieldValues.get("broker1.last_name")?.rawValue;
      const company = fieldValues.get("broker1.company")?.rawValue;

      const nameParts = [firstName, middleName, lastName].filter(Boolean).map(String);
      const brokerName = nameParts.length > 0 ? nameParts.join(" ") : (company ? String(company) : null);

      if (brokerName) {
        fieldValues.set("Broker.Name", { rawValue: brokerName, dataType: "text" });
        fieldValues.set("broker.name", { rawValue: brokerName, dataType: "text" });
        debugLog(`[generate-document] Auto-computed Broker.Name = "${brokerName}"`);
      }
    }

    // Auto-compute bk_p_brokerLicens from broker section data
    const existingLicense = fieldValues.get("bk_p_brokerLicens");
    if (!existingLicense || !existingLicense.rawValue) {
      const license = fieldValues.get("broker1.License")?.rawValue 
        || fieldValues.get("broker1.license_number")?.rawValue
        || fieldValues.get("broker.License")?.rawValue
        || fieldValues.get("broker.license_number")?.rawValue;
      if (license) {
        fieldValues.set("bk_p_brokerLicens", { rawValue: String(license), dataType: "text" });
        debugLog(`[generate-document] Auto-computed bk_p_brokerLicens = "${license}"`);
      }
    }

    // Auto-compute Borrower.Address from component fields if not already set
    const existingBorrowerAddr = fieldValues.get("Borrower.Address") || fieldValues.get("borrower.address");
    if (!existingBorrowerAddr || !existingBorrowerAddr.rawValue) {
      const street = fieldValues.get("borrower1.address.street")?.rawValue || fieldValues.get("borrower.address.street")?.rawValue;
      const city = fieldValues.get("borrower1.address.city")?.rawValue || fieldValues.get("borrower.address.city")?.rawValue;
      const state = fieldValues.get("borrower1.state")?.rawValue || fieldValues.get("borrower.state")?.rawValue;
      const zip = fieldValues.get("borrower1.address.zip")?.rawValue || fieldValues.get("borrower.address.zip")?.rawValue;

      const parts = [street, city, state, zip].filter(Boolean).map(String);
      if (parts.length > 0) {
        const fullAddress = parts.join(", ");
        fieldValues.set("Borrower.Address", { rawValue: fullAddress, dataType: "text" });
        fieldValues.set("borrower.address", { rawValue: fullAddress, dataType: "text" });
        debugLog(`[generate-document] Auto-computed Borrower.Address = "${fullAddress}"`);
      }
    }

    // Auto-compute Lender.Address from component fields if not already set
    const existingLenderAddr = fieldValues.get("Lender.Address") || fieldValues.get("lender.address");
    if (!existingLenderAddr || !existingLenderAddr.rawValue) {
      const street = fieldValues.get("lender1.primary_address.street")?.rawValue || fieldValues.get("lender.primary_address.street")?.rawValue;
      const city = fieldValues.get("lender1.primary_address.city")?.rawValue || fieldValues.get("lender.primary_address.city")?.rawValue;
      const state = fieldValues.get("lender1.primary_address.state")?.rawValue || fieldValues.get("lender.primary_address.state")?.rawValue;
      const zip = fieldValues.get("lender1.primary_address.zip")?.rawValue || fieldValues.get("lender.primary_address.zip")?.rawValue;

      const parts = [street, city, state, zip].filter(Boolean).map(String);
      if (parts.length > 0) {
        const fullAddress = parts.join(", ");
        fieldValues.set("Lender.Address", { rawValue: fullAddress, dataType: "text" });
        fieldValues.set("lender.address", { rawValue: fullAddress, dataType: "text" });
        debugLog(`[generate-document] Auto-computed Lender.Address = "${fullAddress}"`);
      }
    }

    // Auto-compute has_co_borrower boolean flag from existing co-borrower field data
    // Co-borrower keys can appear as: co_borrower1.*, coborrower.*, or borrower1.coborrower.*
    let hasCoBorrowerData = false;
    for (const [key, val] of fieldValues.entries()) {
      const lk = key.toLowerCase();
      const isCoBorrowerKey = lk.startsWith("co_borrower") || lk.startsWith("coborrower") ||
        lk.includes(".coborrower.") || lk.includes(".co_borrower.");
      if (isCoBorrowerKey && val.rawValue != null && String(val.rawValue).trim() !== "") {
        hasCoBorrowerData = true;
        break;
      }
    }
    fieldValues.set("has_co_borrower", { rawValue: hasCoBorrowerData ? "true" : "false", dataType: "boolean" });
    debugLog(`[generate-document] Auto-computed has_co_borrower = ${hasCoBorrowerData}`);

    // Auto-compute co_borrower_section: conditionally rendered content block
    // Check for co-borrower name across common field key patterns
    let coBorrowerName = "";
    const coBorrowerNameKeys = [
      "borrower.co_borrower_name", "borrower1.co_borrower_name",
      "coborrower.name", "co_borrower.name",
      "co_borrower1.first_name", "coborrower.first_name",
      "borrower1.coborrower.full_name", "borrower1.co_borrower.full_name",
    ];
    for (const nameKey of coBorrowerNameKeys) {
      const match = fieldValues.get(nameKey);
      if (match && match.rawValue != null && String(match.rawValue).trim() !== "") {
        coBorrowerName = String(match.rawValue).trim();
        break;
      }
    }
    // Also try assembling from first + last name (check all common key patterns)
    if (!coBorrowerName) {
      const firstKeys = [
        "co_borrower1.first_name", "coborrower.first_name", "co_borrower.first_name",
        "borrower1.coborrower.first_name", "borrower1.co_borrower.first_name",
      ];
      const lastKeys = [
        "co_borrower1.last_name", "coborrower.last_name", "co_borrower.last_name",
        "borrower1.coborrower.last_name", "borrower1.co_borrower.last_name",
      ];
      let first = "", last = "";
      for (const k of firstKeys) { const m = fieldValues.get(k); if (m?.rawValue && String(m.rawValue).trim()) { first = String(m.rawValue).trim(); break; } }
      for (const k of lastKeys) { const m = fieldValues.get(k); if (m?.rawValue && String(m.rawValue).trim()) { last = String(m.rawValue).trim(); break; } }
      if (first || last) coBorrowerName = [first, last].filter(Boolean).join(" ");
    }
    // Fallback: scan all field values for any co-borrower name-like fields
    if (!coBorrowerName) {
      for (const [key, val] of fieldValues.entries()) {
        const lk = key.toLowerCase();
        if ((lk.includes("coborrower") || lk.includes("co_borrower")) && 
            (lk.endsWith(".first_name") || lk.endsWith(".full_name") || lk.endsWith(".name")) &&
            val.rawValue != null && String(val.rawValue).trim() !== "") {
          coBorrowerName = String(val.rawValue).trim();
          // If it's first_name, try to find matching last_name
          if (lk.endsWith(".first_name")) {
            const lastKey = key.replace(/\.first_name$/, ".last_name");
            const lastVal = fieldValues.get(lastKey);
            if (lastVal?.rawValue && String(lastVal.rawValue).trim()) {
              coBorrowerName += " " + String(lastVal.rawValue).trim();
            }
          }
          break;
        }
      }
    }

    let coBorrowerSection = "";
    let coBorrowerAddress = "";
    if (coBorrowerName) {
      // Resolve co-borrower address from common keys
      const addrKeys = [
        "borrower.co_borrower_address", "coborrower.address", "co_borrower.address",
        "co_borrower1.address", "coborrower.full_address",
        "borrower1.coborrower.address", "borrower1.co_borrower.address",
      ];
      for (const ak of addrKeys) {
        const m = fieldValues.get(ak);
        if (m?.rawValue && String(m.rawValue).trim()) { coBorrowerAddress = String(m.rawValue).trim(); break; }
      }
      // Fallback: assemble from component address fields (coborrower.primary_address.*)
      if (!coBorrowerAddress) {
        const coPrefixes = ["coborrower", "co_borrower", "co_borrower1", "borrower1.coborrower", "borrower1.co_borrower", "borrower2.coborrower", "borrower2.co_borrower"];
        for (const cp of coPrefixes) {
          const street = fieldValues.get(`${cp}.primary_address.street`)?.rawValue;
          const city = fieldValues.get(`${cp}.primary_address.city`)?.rawValue;
          const state = fieldValues.get(`${cp}.primary_address.state`)?.rawValue;
          const zip = fieldValues.get(`${cp}.primary_address.zip`)?.rawValue;
          const parts = [street, city, state, zip].filter(Boolean).map(String);
          if (parts.length > 0) {
            coBorrowerAddress = parts.join(", ");
            break;
          }
        }
      }
      // Fallback: scan for any co-borrower address/full_address field
      if (!coBorrowerAddress) {
        for (const [key, val] of fieldValues.entries()) {
          const lk = key.toLowerCase();
          if ((lk.includes("coborrower") || lk.includes("co_borrower")) && 
              (lk.endsWith(".address") || lk.endsWith(".full_address")) &&
              val.rawValue != null && String(val.rawValue).trim() !== "") {
            coBorrowerAddress = String(val.rawValue).trim();
            break;
          }
        }
      }

      coBorrowerSection = `☐ Co-Borrower Included\n\nCo-Borrower Name: ${coBorrowerName}`;
      if (coBorrowerAddress) {
        coBorrowerSection += `\nCo-Borrower Address: ${coBorrowerAddress}`;
      }
    }
    fieldValues.set("co_borrower_section", { rawValue: coBorrowerSection, dataType: "text" });
    fieldValues.set("CoBorrower.Section", { rawValue: coBorrowerSection, dataType: "text" });
    // Also set the co-borrower name and address as individual merge tag values for direct tag usage
    if (coBorrowerName) {
      fieldValues.set("borrower.co_borrower_name", { rawValue: coBorrowerName, dataType: "text" });
      fieldValues.set("coborrower.name", { rawValue: coBorrowerName, dataType: "text" });
      fieldValues.set("co_borrower.name", { rawValue: coBorrowerName, dataType: "text" });
    }
    if (coBorrowerAddress) {
      fieldValues.set("borrower.co_borrower_address", { rawValue: coBorrowerAddress, dataType: "text" });
      fieldValues.set("coborrower.address", { rawValue: coBorrowerAddress, dataType: "text" });
      fieldValues.set("co_borrower.address", { rawValue: coBorrowerAddress, dataType: "text" });
    }
    debugLog(`[generate-document] Auto-computed co_borrower_section = "${coBorrowerSection ? "populated" : "empty"}", name = "${coBorrowerName || "none"}", address = "${coBorrowerAddress || "none"}"`);

    // ── Lien field bridging: map lien1.* / lien.* dot-notation to pr_li_* keys ──
    {
      const lienFieldToPrLi: Record<string, string> = {
        "property": "pr_li_lienProper",
        "priority": "pr_li_lienPriori",
        "holder": "pr_li_lienHolder",
        "account": "pr_li_lienAccoun",
        "contact": "pr_li_lienContac",
        "phone": "pr_li_lienPhone",
        "original_balance": "pr_li_lienOriginBalanc",
        "current_balance": "pr_li_lienCurrenBalanc",
        "regular_payment": "pr_li_lienRegulaPaymen",
        "last_checked": "pr_li_lienLastChecke",
        "recording_number": "pr_li_lienAccoun2",
        "balance_after": "pr_li_lienCurrenBalanc2",
        "last_verified": "pr_li_lienLastChecke2",
        "senior_lien_tracking": "pr_li_seniorLienTracki",
        "note": "pr_li_lienHolder2",
        "status": "pr_li_lienHolder3",
      };

      // Also bridge to property1.lien_* canonical keys
      const lienFieldToCanonical: Record<string, string> = {
        "property": "property1.lien_property",
        "priority": "property1.lien_priority",
        "holder": "property1.lien_holder",
        "account": "property1.lien_account",
        "contact": "property1.lien_contact",
        "phone": "property1.lien_phone",
        "original_balance": "property1.lien_original_balance",
        "current_balance": "property1.lien_current_balance",
        "regular_payment": "property1.lien_regular_payment",
        "last_checked": "property1.lien_last_checked",
      };

      // Bridge to new Liens section li_gd_*, li_bp_*, li_rt_* keys
      const lienFieldToLiKeys: Record<string, string> = {
        "interest_rate": "li_gd_interestRate",
        "priority": "ln_p_lienPositi",
        "lien_priority_now": "li_gd_lienPriorityNow",
        "lien_priority_after": "li_gd_lienPriorityAfter",
        "maturity_date": "li_gd_maturityDate",
        "email": "li_gd_email",
        "fax": "li_gd_fax",
        "loan_type": "li_gd_loanType",
        "this_loan": "li_gd_thisLoan",
        "recording_date": "li_rt_recordingDate",
        "existing_paydown_amount": "li_bp_existingPaydownAmount",
        "existing_payoff_amount": "li_bp_existingPayoffAmount",
        "existing_remain": "li_lt_existingRemain",
      };

      // Additional lien bridging: pr_li_* and li_bp_* variants for template tags
      const lienFieldToAltKeys: Record<string, string> = {
        "lien_priority_now": "pr_li_lienPrioriNow",
        "lien_priority_after": "pr_li_lienPrioriAfter",
        "balance_after": "li_bp_balanceAfter",
      };

      // Reverse map: property1.lien_* canonical keys -> pr_li_* short keys
      const canonicalToPrLi: Record<string, string> = {};
      for (const [field, canonKey] of Object.entries(lienFieldToCanonical)) {
        const prLiKey = lienFieldToPrLi[field];
        if (prLiKey) {
          canonicalToPrLi[canonKey] = prLiKey;
        }
      }

      // ── Multi-lien aggregation: collect indexed lien values per field ──
      // Group values by (field, lienIndex) so we can aggregate multi-lien data
      // into newline-separated strings for template fields that sit inside table cells.
      const lienFieldCollector: Record<string, { index: number; value: string }[]> = {};

      for (const [key, val] of [...fieldValues.entries()]) {
        // Match lien1.holder, lien2.holder, lien.holder etc.
        const lienMatch = key.match(/^lien(\d*)\.(.+)$/);
        if (lienMatch && val.rawValue) {
          const lienIndex = lienMatch[1] ? parseInt(lienMatch[1], 10) : 0;
          const field = lienMatch[2];

          // Collect values for multi-lien aggregation
          if (!lienFieldCollector[field]) lienFieldCollector[field] = [];
          lienFieldCollector[field].push({ index: lienIndex, value: String(val.rawValue) });

          // Still bridge canonical and li_* keys for single-lien compatibility
          const canonKey = lienFieldToCanonical[field];
          if (canonKey && !fieldValues.has(canonKey)) {
            fieldValues.set(canonKey, val);
          }
          const liKey = lienFieldToLiKeys[field];
          if (liKey && !fieldValues.has(liKey)) {
            fieldValues.set(liKey, val);
          }
        }

        // Match property1.lien_holder, property.lien_holder etc.
        const propLienMatch = key.match(/^property\d*\.lien_(.+)$/);
        if (propLienMatch && val.rawValue) {
          const mapped = canonicalToPrLi[key];
          if (mapped && !fieldValues.has(mapped)) {
            fieldValues.set(mapped, val);
            debugLog(`[generate-document] Bridged ${key} -> ${mapped}`);
          }
        }
      }

      // Now set pr_li_*, li_*, and alt keys: if multiple liens exist, join values with newlines
      // so each lien's data appears on its own line within the table cell.
      for (const [field, entries] of Object.entries(lienFieldCollector)) {
        // Sort by lien index for consistent ordering
        entries.sort((a, b) => a.index - b.index);
        const aggregated = entries.map(e => e.value).join("\n");
        const dataType = (field === "current_balance" || field === "original_balance" || 
                          field === "regular_payment" || field === "balance_after") ? "currency" : "text";

        // Set pr_li_* key with aggregated value
        const prLiKey = lienFieldToPrLi[field];
        if (prLiKey) {
          fieldValues.set(prLiKey, { rawValue: aggregated, dataType });
          debugLog(`[generate-document] Multi-lien bridged ${field} -> ${prLiKey} (${entries.length} liens)`);
        }

        // Set li_* key with aggregated value
        const liKey = lienFieldToLiKeys[field];
        if (liKey) {
          fieldValues.set(liKey, { rawValue: aggregated, dataType });
          debugLog(`[generate-document] Multi-lien li bridged ${field} -> ${liKey} (${entries.length} liens)`);
        }

        // Set alt key (pr_li_lienPrioriNow, pr_li_lienPrioriAfter, li_bp_balanceAfter)
        const altKey = lienFieldToAltKeys[field];
        if (altKey) {
          fieldValues.set(altKey, { rawValue: aggregated, dataType });
          debugLog(`[generate-document] Multi-lien alt bridged ${field} -> ${altKey} (${entries.length} liens)`);
        }
      }
      debugLog(`[generate-document] Lien field bridging complete`);
      // Bridge ln_p_lienPosit (template tag) -> ln_p_lienPositi (actual field key)
      const lienPosVal = fieldValues.get("ln_p_lienPositi");
      if (lienPosVal && !fieldValues.has("ln_p_lienPosit")) {
        fieldValues.set("ln_p_lienPosit", lienPosVal);
        debugLog(`[generate-document] Bridged ln_p_lienPositi -> ln_p_lienPosit`);
      }

      // ── Auto-compute li_bp_balanceAfter as SUM of balance_after for all liens
      // with lien_priority_now < current loan's lien position ──
      {
        // Get current loan's lien position from loan_terms.lien_position or ln_p_lienPositi
        const lienPosRaw = fieldValues.get("ln_p_lienPositi")?.rawValue
          || fieldValues.get("loan_terms.lien_position")?.rawValue
          || "";
        // Parse priority: extract leading digits from values like "1st", "2nd", "3"
        const parsePriority = (val: string): number => {
          if (!val) return NaN;
          const cleaned = String(val).trim().toLowerCase();
          const numMatch = cleaned.match(/^(\d+)/);
          return numMatch ? parseInt(numMatch[1], 10) : NaN;
        };
        const currentPriority = parsePriority(String(lienPosRaw));
        debugLog(`[generate-document] Senior lien calc: currentLoanPriority = ${currentPriority} (raw: "${lienPosRaw}")`);

        if (!isNaN(currentPriority)) {
          // Collect all lien entries with their priority and balance_after
          const lienPriorityCollector = lienFieldCollector["lien_priority_now"] || [];
          const lienBalanceCollector = lienFieldCollector["balance_after"] || [];

          // Build a map of lienIndex -> priority
          const lienPriorityMap = new Map<number, number>();
          for (const entry of lienPriorityCollector) {
            const p = parsePriority(entry.value);
            if (!isNaN(p)) lienPriorityMap.set(entry.index, p);
          }

          // Build a map of lienIndex -> balance_after (numeric)
          const lienBalanceMap = new Map<number, number>();
          for (const entry of lienBalanceCollector) {
            const num = parseFloat(String(entry.value).replace(/[,$]/g, ""));
            if (!isNaN(num)) lienBalanceMap.set(entry.index, num);
          }

          // Sum balance_after for all liens where priority < currentPriority
          let seniorLienTotal = 0;
          for (const [lienIdx, priority] of lienPriorityMap.entries()) {
            if (priority < currentPriority) {
              seniorLienTotal += lienBalanceMap.get(lienIdx) || 0;
            }
          }

          // If current loan is 1st position, total = 0
          if (currentPriority === 1) seniorLienTotal = 0;

          const formattedTotal = seniorLienTotal.toFixed(2);
          fieldValues.set("li_bp_balanceAfter", { rawValue: formattedTotal, dataType: "currency" });
          debugLog(`[generate-document] Auto-computed li_bp_balanceAfter (senior lien balance) = ${formattedTotal} from ${lienPriorityMap.size} liens`);
          console.log(`[generate-document] li_bp_balanceAfter = ${formattedTotal} (currentPriority=${currentPriority}, liens with priority data: ${lienPriorityMap.size})`);
        } else {
          debugLog(`[generate-document] Could not determine current loan priority for li_bp_balanceAfter calculation`);
        }
      }
    }

    // ── Derive or_p_isBrokerAlsoBorrower checkbox glyphs for document generation ──
    {
      const yesVal = fieldValues.get("or_p_isBrokerAlsoBorrower_yes")
        || fieldValues.get("origination_app.doc.is_broker_also_borrower_yes");
      const rawYes = yesVal?.rawValue;
      const isYes = typeof rawYes === "string"
        ? ["true", "yes", "y", "1", "checked", "on"].includes(rawYes.trim().toLowerCase())
        : typeof rawYes === "number"
          ? rawYes !== 0
          : Boolean(rawYes);
      fieldValues.set("or_p_isBrokerAlsoBorrower_yes", { rawValue: isYes ? "true" : "false", dataType: "boolean" });
      fieldValues.set("or_p_isBrokerAlsoBorrower_no", { rawValue: isYes ? "false" : "true", dataType: "boolean" });
      debugLog(`[generate-document] or_p_isBrokerAlsoBorrower: YES=${isYes}`);
    }

    // ── Auto-compute HUD-1 column totals: Paid to Others, Paid to Broker, Grand Total ──
    // Uses dynamic scanning of ALL origination fee currency fields plus explicit key lists
    // to ensure no fee values are missed.
    {
      // Explicit currency keys for "Paid to Others" column
      const othersKeys = [
        // 800 series
        'of_801_lenderLoanOriginationFee_others', 'of_802_lenderLoanDiscountFee_others',
        'of_803_appraisalFee_others', 'of_804_creditReportFee_others',
        'of_805_lenderInspectionFee_others', 'of_808_mortgageBrokerCommissionFee_others',
        'of_809_taxServiceFee_others', 'of_810_processingFee_others',
        'of_811_underwritingFee_others', 'of_812_wireTransferFee_others',
        // 900 series
        'of_900_desc_o', 'of_901_int_o', 'of_902_mi_o', 'of_903_hi_o', 'of_904_tax_o', 'of_905_va_o',
        // 1000 series
        'of_1000_desc_o', 'of_1001_hi_o', 'of_1002_mi_o', 'of_1004_tax_o',
        // 1100 series
        'of_1101_set_o', 'of_1105_doc_o', 'of_1106_not_o', 'of_1108_ti_o',
        // 1200 series
        'of_1200_desc_o', 'of_1201_rec_o', 'of_1202_ts_o',
        // 1300 series
        'of_1302_pest_o',
      ];
      // Explicit currency keys for "Paid to Broker" column
      const brokerKeys = [
        // 800 series
        'of_801_lenderLoanOriginationFee_broker', 'of_802_lenderLoanDiscountFee_broker',
        'of_803_appraisalFee_broker', 'of_804_creditReportFee_broker',
        'of_805_lenderInspectionFee_broker', 'of_808_mortgageBrokerCommissionFee_broker',
        'of_809_taxServiceFee_broker', 'of_810_processingFee_broker',
        'of_811_underwritingFee_broker', 'of_812_wireTransferFee_broker',
        // 900 series
        'of_900_desc_b', 'of_901_int_b', 'of_902_mi_b', 'of_903_hi_b', 'of_904_tax_b', 'of_905_va_b',
        // 1000 series
        'of_1000_desc_b', 'of_1001_hi_b', 'of_1002_mi_b', 'of_1004_tax_b',
        // 1100 series
        'of_1101_set_b', 'of_1105_doc_b', 'of_1106_not_b', 'of_1108_ti_b',
        // 1200 series
        'of_1200_desc_b', 'of_1201_rec_b', 'of_1202_ts_b',
        // 1300 series
        'of_1302_pest_b',
      ];

      const parseNum = (key: string): number => {
        const val = fieldValues.get(key);
        if (!val || val.rawValue == null) return 0;
        // Skip boolean-typed fields (checkboxes) — they are not currency amounts
        if (val.dataType === 'boolean') return 0;
        const cleaned = String(val.rawValue).replace(/[,$\s]/g, '');
        const n = parseFloat(cleaned);
        return isNaN(n) ? 0 : n;
      };

      // Also dynamically scan fieldValues for any origination fee currency fields
      // matching broker/others patterns that might not be in the explicit lists
      const dynamicOthersKeys = new Set<string>(othersKeys);
      const dynamicBrokerKeys = new Set<string>(brokerKeys);
      for (const [key, data] of fieldValues.entries()) {
        if (!key.startsWith('of_') || data.dataType !== 'currency') continue;
        // Skip the total fields themselves
        if (key === 'of_tot_oth' || key === 'of_tot_brk' || key === 'of_tot_all') continue;
        // Skip subtotal display fields
        if (key === 'of_fe_subtotalOthers' || key === 'of_fe_subtotalJ' || key === 'of_fe_totalJ') continue;
        // Match "others" pattern: ends with _others, _o, or Others
        if (key.endsWith('_others') || (key.endsWith('_o') && /^of_\d+_/.test(key)) || key.endsWith('Others')) {
          dynamicOthersKeys.add(key);
        }
        // Match "broker" pattern: ends with _broker, _b, or Broker
        if (key.endsWith('_broker') || (key.endsWith('_b') && /^of_\d+_/.test(key)) || key.endsWith('Broker')) {
          dynamicBrokerKeys.add(key);
        }
      }

      let totalOthers = 0;
      for (const k of dynamicOthersKeys) totalOthers += parseNum(k);
      let totalBroker = 0;
      for (const k of dynamicBrokerKeys) totalBroker += parseNum(k);
      const grandTotal = totalOthers + totalBroker;
      fieldValues.set('of_tot_oth', { rawValue: totalOthers.toFixed(2), dataType: 'currency' });
      fieldValues.set('of_tot_brk', { rawValue: totalBroker.toFixed(2), dataType: 'currency' });
      fieldValues.set('of_tot_all', { rawValue: grandTotal.toFixed(2), dataType: 'currency' });
      // Also set the display-field aliases so templates using either tag name resolve correctly
      fieldValues.set('of_fe_subtotalOthers', { rawValue: totalOthers.toFixed(2), dataType: 'currency' });
      fieldValues.set('of_fe_subtotalJ', { rawValue: totalBroker.toFixed(2), dataType: 'currency' });
      fieldValues.set('of_fe_totalJ', { rawValue: grandTotal.toFixed(2), dataType: 'currency' });
      console.log(`[generate-document] Auto-computed HUD totals: Others=${totalOthers.toFixed(2)} (${dynamicOthersKeys.size} keys), Broker=${totalBroker.toFixed(2)} (${dynamicBrokerKeys.size} keys), Grand=${grandTotal.toFixed(2)}`);
    }

    // ── Investor Questionnaire field aliases ──
    // ld_p_firstIfEntityUse, ld_p_middle, ld_p_last are separate field_dictionary
    // entries that the Investor Questionnaire template references.
    // Populate them from the primary lender name fields if not already set.
    {
      const lenderTypeRaw = (fieldValues.get('ld_p_lenderType')?.rawValue ?? '').toString().trim();
      const isIndividual = lenderTypeRaw.toLowerCase() === 'individual';

      // Always alias the lender's name parts to first/middle/last so the name
      // prints exactly once. Add a trailing space after each non-empty part so
      // the template tags `{{first}}{{middle}}{{last}}` render as "F M L".
      const firstRaw = (fieldValues.get('ld_p_firstName')?.rawValue ?? '').toString();
      const middleRaw = (fieldValues.get('ld_p_middleName')?.rawValue ?? '').toString();
      const lastRaw = (fieldValues.get('ld_p_lastName')?.rawValue ?? '').toString();
      const withTrailingSpace = (v: string) => {
        const t = v.trim();
        return t ? `${t} ` : '';
      };
      fieldValues.set('ld_p_firstIfEntityUse', { rawValue: withTrailingSpace(firstRaw), dataType: 'text' });
      fieldValues.set('ld_p_middle', { rawValue: withTrailingSpace(middleRaw), dataType: 'text' });
      // Last name has no trailing space (end of name block).
      fieldValues.set('ld_p_last', { rawValue: lastRaw.trim(), dataType: 'text' });

      if (isIndividual) {
        // Individual → vesting must NOT appear in the document.
        fieldValues.set('ld_p_vesting', { rawValue: '', dataType: 'text' });
      } else {
        // Joint / Family Trust / LLC / Corp / IRA / ERISA / Investment Fund /
        // 401k / Foreign Holder W-8 / Non-profit → vesting prints first,
        // followed by the name parts. Append a trailing space when present so
        // it visually separates from the following first name.
        const vestingRaw = (fieldValues.get('ld_p_vesting')?.rawValue ?? '').toString().trim();
        fieldValues.set('ld_p_vesting', {
          rawValue: vestingRaw ? `${vestingRaw} ` : '',
          dataType: 'text',
        });
      }
    }

    // Build set of all valid field keys once and reuse it across invocations.
    const validFieldKeys = await getValidFieldKeys(supabase);
    if (isTemplate885) {
      console.log(`[885] Data Mapping: ${Math.round(performance.now() - tDataMappingStart)} ms (fieldValues=${fieldValues.size})`);
    }

    // 4. Download template DOCX from storage
    const tTemplateLoadStart = performance.now();
    let fileData: Blob | null = null;
    
    const { data: storageData, error: fileError } = await supabase.storage
      .from("templates")
      .download(template.file_path);

    if (!fileError && storageData) {
      fileData = storageData;
      debugLog(`[generate-document] Downloaded template from storage: ${template.file_path}`);
    } else {
      // Fallback: Try public URL
      debugLog(`[generate-document] Storage download failed, trying public URL fallback...`);
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
            debugLog(`[generate-document] Downloaded template from public URL: ${url}`);
            break;
          }
        } catch (e) {
          debugLog(`[generate-document] Failed to fetch from ${url}: ${e}`);
        }
      }
    }

    if (!fileData) {
      console.error(`[generate-document] Failed to download template: ${template.file_path}`);
      result.error = "Failed to download template file. Please upload the template to storage.";
      return result;
    }
    if (isTemplate885) {
      console.log(`[885] Template Load: ${Math.round(performance.now() - tTemplateLoadStart)} ms`);
    }

    // 5. Fetch merge tag mappings AND field key migration maps, then process the DOCX
    // fetchFieldKeyMappings populates the in-memory cache used by resolveFieldKeyWithMap
    const [{ mergeTagMap, labelMap }, _fieldKeyMappings] = await Promise.all([
      fetchMergeTagMappings(supabase),
      fetchFieldKeyMappings(supabase),
    ]);

    // RE851A Part 2 broker-capacity checkboxes are often authored as native Word
    // checkboxes or static glyphs beside the literal A./B. labels rather than as
    // explicit merge tags. Inject these label bindings at generation time so the
    // existing layout remains untouched while the checkbox state still resolves
    // from the already-derived boolean keys.
    //
    // Template-gated: only RE851A needs these label bindings. Adding ~30
    // labels for unrelated templates (e.g. RE885 HUD-1) forces the
    // label-based replacement candidate filter to scan every paragraph
    // for needles that can never match, contributing to CPU pressure on
    // large templates. Behavior for RE851A is unchanged.
    const isTemplate851A = /851a/i.test(template.name || "");
    const re851aLabelAdditions: Record<string, { fieldKey: string }> = isTemplate851A
      ? {
          "A. Agent in arranging a loan on behalf of another": {
            fieldKey: "or_p_brkCapacityAgent",
          },
          "A. Agent in arranging a loan": {
            fieldKey: "or_p_brkCapacityAgent",
          },
          "A. Agent": {
            fieldKey: "or_p_brkCapacityAgent",
          },
          "B. Principal as a borrower on funds from which broker will directly or indirectly benefit": {
            fieldKey: "or_p_brkCapacityPrincipal",
          },
          // Shorter variant used in the live RE851A wording — matches both static
          // glyph templates and tagless SDT checkboxes during label fallback.
          "B. Principal as a borrower on funds from which broker will benefit": {
            fieldKey: "or_p_brkCapacityPrincipal",
          },
          "B. Principal as a borrower on funds": {
            fieldKey: "or_p_brkCapacityPrincipal",
          },
          "B. Principal as a borrower": {
            fieldKey: "or_p_brkCapacityPrincipal",
          },
          // RE851A live wording prefixes "Principal" with a literal asterisk
          // ("B. *Principal as a borrower..."). Without these label variants
          // the broker-capacity B checkbox falls back to its static unchecked
          // glyph even when the CSR "IS BROKER ALSO A BORROWER?" box is true.
          "B. *Principal as a borrower on funds from which broker will directly or indirectly benefit": {
            fieldKey: "or_p_brkCapacityPrincipal",
          },
          "B. *Principal as a borrower on funds from which broker will benefit": {
            fieldKey: "or_p_brkCapacityPrincipal",
          },
          "B. *Principal as a borrower on funds": {
            fieldKey: "or_p_brkCapacityPrincipal",
          },
          "B. *Principal as a borrower": {
            fieldKey: "or_p_brkCapacityPrincipal",
          },
          // RE851A Servicing section labels → derived boolean keys.
          // Mirrors the broker A/B pattern above so the static ☐ glyph that
          // sits immediately before each label flips to ☑ when the matching
          // boolean is true. No template edits required.
          "THERE ARE NO SERVICING ARRANGEMENTS": {
            fieldKey: "sv_p_noServicingArrangements",
          },
          "THERE ARE NO SERVICING ARRANGEMENTS (Does not apply to multi-lender transactions.)": {
            fieldKey: "sv_p_noServicingArrangements",
          },
          "THERE ARE NO SERVICING ARRANGEMENTS  (Does not apply to multi-lender transactions.)": {
            fieldKey: "sv_p_noServicingArrangements",
          },
          "BROKER IS THE SERVICING AGENT": {
            fieldKey: "sv_p_brokerIsServicingAgent",
          },
          "BROKER IS THE SERVICING AGENT -See attached \"Notes\"": {
            fieldKey: "sv_p_brokerIsServicingAgent",
          },
          "BROKER IS THE SERVICING AGENT  -See attached \"Notes\"": {
            fieldKey: "sv_p_brokerIsServicingAgent",
          },
          "ANOTHER QUALIFIED PARTY WILL SERVICE THE LOAN": {
            fieldKey: "sv_p_anotherQualifiedParty",
          },
          "ANOTHER QUALIFIED PARTY WILL SERVICE THE LOAN CHECK BOX IF ANY PARTY OTHER THAN LENDER IS SELECTED AS SERVICER": {
            fieldKey: "sv_p_anotherQualifiedParty",
          },
          // RE851A Part 3 Amortization labels (CHECK ONE) — derived booleans are
          // already populated by the dropdown→checkbox derivation step. These
          // label bindings let the existing static glyph-before-label fallback
          // toggle the correct checkbox without any template edits.
          "FULLY AMORTIZED": { fieldKey: "ln_p_amortized" },
          "AMORTIZED": { fieldKey: "ln_p_amortized" },
          "AMORTIZED PARTIALLY": { fieldKey: "ln_p_amortizedPartially" },
          "PARTIALLY AMORTIZED": { fieldKey: "ln_p_amortizedPartially" },
          "INTEREST ONLY": { fieldKey: "ln_p_interestOnly" },
          "CONSTANT AMORTIZATION": { fieldKey: "ln_p_constantAmortization" },
          "ADD-ON INTEREST": { fieldKey: "ln_p_addOnInterest" },
          "ADD ON INTEREST": { fieldKey: "ln_p_addOnInterest" },
        }
      : {};
    const effectiveLabelMap = { ...labelMap, ...re851aLabelAdditions };

    let templateBuffer = new Uint8Array(await fileData.arrayBuffer());

    // ── RE851D: expand literal "_N" placeholders into per-occurrence "_1", "_2", ... ──
    // Some authored RE851D templates leave generic placeholders (e.g.
    // {{pr_p_address_N}}) inside each PROPERTY block instead of the resolved
    // indexed form. Without this preprocessing, the merge-tag resolver treats
    // "_N" as a literal field key and prints nothing, so all PROPERTY blocks
    // remain blank. We rewrite each occurrence by document order, capped at 5
    // (the spec's maximum properties per RE851D). Strictly scoped to known
    // RE851D placeholder families — no other tags are touched.
    if (/851d/i.test(template.name || "")) {
      try {
        // Full set of _N families that appear inside PROPERTY #K blocks.
        const RE851D_INDEXED_TAGS = [
          "pr_p_address_N", "pr_p_street_N", "pr_p_city_N", "pr_p_state_N",
          "pr_p_zip_N", "pr_p_county_N", "pr_p_country_N", "pr_p_apn_N",
          "pr_p_owner_N", "pr_p_marketValue_N", "pr_p_appraiseValue_N",
          "pr_p_appraiseDate_N", "pr_p_appraiserStreet_N", "pr_p_appraiserCity_N",
          "pr_p_appraiserState_N", "pr_p_appraiserZip_N", "pr_p_appraiserPhone_N",
          "pr_p_appraiserEmail_N", "pr_p_legalDescri_N", "pr_p_yearBuilt_N",
          "pr_p_squareFeet_N", "pr_p_lotSize_N", "pr_p_numberOfUni_N",
          "pr_p_propertyTyp_N", "pr_p_propertyType_N", "pr_p_occupancySt_N",
          "pr_p_occupanc_N", "pr_p_remainingSenior_N", "pr_p_expectedSenior_N",
          "pr_p_totalSenior_N", "pr_p_totalEncumbrance_N", "pr_p_totalSeniorPlusLoan_N",
          "pr_p_construcType_N", "pr_p_purchasePrice_N", "pr_p_downPayme_N",
          "pr_p_protectiveEquity_N", "pr_p_descript_N", "pr_p_ltv_N", "pr_p_cltv_N",
          "pr_p_zoning_N", "pr_p_floodZone_N", "pr_p_pledgedEquity_N",
          "pr_p_delinquHowMany_N",
          "ln_p_loanToValueRatio_N", "propertytax_annual_payment_N",
          // RE851D propertytax dotted-form _N tags. Order is critical: longer
          // matches FIRST so "delinquent_amount_N" wins before "delinquent_N".
          "propertytax.delinquent_amount_N",
          "propertytax.source_of_information_N",
          "propertytax.annual_payment_N",
          "propertytax.delinquent_N",
        ];
        // Tags that appear in the repeating PART 1 / PART 2 row blocks.
        const PART1_TAGS = ["pr_p_appraiseValue_N", "ln_p_loanToValueRatio_N"];
        const PART2_TAGS = ["pr_p_address_N", "pr_p_appraiseValue_N", "ln_p_loanToValueRatio_N"];

        const decoder = new TextDecoder("utf-8");
        const encoder = new TextEncoder();
        const decompressed = fflate.unzipSync(templateBuffer);
        const out: fflate.Zippable = {};
        let totalRewrites = 0;
        const regionRewriteCounts: Record<string, number> = {};

        // Strip XML tags to find anchor text (PART 1 / PART 2 / PROPERTY #K)
        // even when the heading is split across multiple <w:r> runs. We build
        // a parallel offset map: stripped-index -> original-index, so anchor
        // matches in the stripped text translate back to character offsets
        // in the original XML for region boundary computation.
        const findAnchorOffsets = (xml: string): {
          partA: [number, number] | null;
          partB: [number, number] | null;
          props: Array<{ k: number; range: [number, number] }>;
        } => {
          // Build stripped text + offset map (skip <...> tag content).
          // CRITICAL: insert a synthetic space wherever a tag boundary is
          // consumed so that text like "PROPERTY</w:t>...<w:t>INFORMATION"
          // does not collapse to "PROPERTYINFORMATION" (which would defeat
          // every anchor regex below). The synthetic space is mapped back
          // to the original offset of the '<' so downstream offset math
          // remains stable.
          const strippedChars: string[] = [];
          const map: number[] = []; // strippedChars[i] originated at map[i] in xml
          let i = 0;
          while (i < xml.length) {
            const ch = xml[i];
            if (ch === "<") {
              const tagStart = i;
              const end = xml.indexOf(">", i);
              if (end === -1) break;
              // Insert one synthetic space per tag-skip if the previous
              // stripped char wasn't already whitespace. Mapped to the
              // tag's '<' offset so collapsedToOriginal lands at a real
              // boundary in the source XML.
              const prev = strippedChars.length > 0 ? strippedChars[strippedChars.length - 1] : "";
              if (prev !== " " && prev !== "\n" && prev !== "\t" && prev !== "\r" && prev !== "") {
                strippedChars.push(" ");
                map.push(tagStart);
              }
              i = end + 1;
              continue;
            }
            strippedChars.push(ch);
            map.push(i);
            i++;
          }
          const stripped = strippedChars.join("");
          const collapsed = stripped.replace(/\s+/g, " ");
          // Build collapsed -> stripped index map (1:1 except runs of ws collapse to 1 space).
          const collapsedToStripped: number[] = [];
          {
            let lastWasWs = false;
            for (let j = 0; j < stripped.length; j++) {
              const c = stripped[j];
              const isWs = /\s/.test(c);
              if (isWs) {
                if (!lastWasWs) collapsedToStripped.push(j);
                lastWasWs = true;
              } else {
                collapsedToStripped.push(j);
                lastWasWs = false;
              }
            }
          }
          const strippedToOriginal = (sIdx: number): number => {
            if (sIdx < 0) return 0;
            if (sIdx >= map.length) return xml.length;
            return map[sIdx];
          };
          const collapsedToOriginal = (cIdx: number): number => {
            if (cIdx < 0) return 0;
            if (cIdx >= collapsedToStripped.length) return xml.length;
            return strippedToOriginal(collapsedToStripped[cIdx]);
          };
          const findOne = (re: RegExp): number => {
            const m = re.exec(collapsed);
            return m ? collapsedToOriginal(m.index) : -1;
          };
          const findAll = (re: RegExp): Array<{ k: number; orig: number }> => {
            const res: Array<{ k: number; orig: number }> = [];
            re.lastIndex = 0;
            let m: RegExpExecArray | null;
            while ((m = re.exec(collapsed)) !== null) {
              const k = parseInt(m[1], 10);
              if (k >= 1 && k <= 5) res.push({ k, orig: collapsedToOriginal(m.index) });
              if (m.index === re.lastIndex) re.lastIndex++;
            }
            return res;
          };

          const part1Start = findOne(/PART\s*1\b|LOAN\s+TO\s+VALUE\s+RATIO/i);
          const part2Start = findOne(/PART\s*2\b|SECURING\s+PROPERTIES/i);
          // Loosened heading match: detect "PROPERTY #K" headings on their own.
          // Some templates put "PROPERTY INFORMATION" on a separate line/cell or
          // omit it entirely, so the strict variant returned zero anchors. We
          // accept any "PROPERTY #K" occurrence (case-insensitive) but exclude
          // inline mentions like "secured by Property #1" by:
          //   1) requiring the match to be at/after PART 2 start (property
          //      detail blocks always come after PART 2), and
          //   2) skipping anchors followed within ~80 chars by phrases that
          //      indicate prose ("secured", "deed of trust", "trust deed").
          // Primary property-section detector: each Property #K block in the
          // RE851D template begins with a "PROPERTY INFORMATION" heading bar.
          // Use those headings as the section anchors and number them 1..5 by
          // document order. This is robust against Word splitting "PROPERTY",
          // "#", and the digit across runs/cells (which made the strict
          // "PROPERTY #K" regex return zero matches in some templates).
          const findAllNoCapture = (re: RegExp): Array<{ orig: number }> => {
            const res: Array<{ orig: number }> = [];
            re.lastIndex = 0;
            let m: RegExpExecArray | null;
            while ((m = re.exec(collapsed)) !== null) {
              res.push({ orig: collapsedToOriginal(m.index) });
              if (m.index === re.lastIndex) re.lastIndex++;
            }
            return res;
          };
          const part2Floor = part2Start >= 0 ? part2Start : -1;
          // "PROPERTY INFORMATION" gray-bar headings — one per property block.
          const propInfoRaw = findAllNoCapture(/\bPROPERTY\s+INFORMATION\b/gi);
          const propInfoOrdered = propInfoRaw
            .filter(p => part2Floor < 0 || p.orig >= part2Floor)
            .sort((a, b) => a.orig - b.orig)
            .slice(0, 5)
            .map((p, i) => ({ k: i + 1, orig: p.orig }));

          // Fallback: if no "PROPERTY INFORMATION" anchors were found, fall
          // back to the previous "PROPERTY #K" detector (with inline-prose
          // filter) so legacy templates without the gray-bar heading still
          // resolve. Strictly capped to 1..5.
          let propsOrdered: Array<{ k: number; orig: number }>;
          if (propInfoOrdered.length > 0) {
            propsOrdered = propInfoOrdered;
          } else {
            const rawPropMatches = findAll(/\bPROPERTY\s*#?\s*([1-5])\b/gi);
            const propMatches = rawPropMatches.filter(p => {
              if (part2Floor >= 0 && p.orig < part2Floor) return false;
              const tail = xml.slice(p.orig, p.orig + 400).replace(/<[^>]+>/g, " ");
              if (/\b(secured|deed of trust|trust deed)\b/i.test(tail.slice(0, 80))) {
                return false;
              }
              return true;
            });
            const seen = new Set<number>();
            propsOrdered = propMatches
              .filter(p => (seen.has(p.k) ? false : (seen.add(p.k), true)))
              .sort((a, b) => a.orig - b.orig);
          }
          const xmlEnd = xml.length;
          const firstPropOffset = propsOrdered.length > 0 ? propsOrdered[0].orig : xmlEnd;
          const partA: [number, number] | null = part1Start >= 0
            ? [part1Start, part2Start >= 0 ? part2Start : (firstPropOffset >= 0 ? firstPropOffset : xmlEnd)]
            : null;
          const partB: [number, number] | null = part2Start >= 0
            ? [part2Start, firstPropOffset >= 0 ? firstPropOffset : xmlEnd]
            : null;
          const props: Array<{ k: number; range: [number, number] }> = [];
          for (let pi = 0; pi < propsOrdered.length; pi++) {
            const start = propsOrdered[pi].orig;
            const end = pi + 1 < propsOrdered.length ? propsOrdered[pi + 1].orig : xmlEnd;
            props.push({ k: propsOrdered[pi].k, range: [start, end] });
          }
          return { partA, partB, props };
        };

        // Process content parts in a deterministic order so per-tag occurrence
        // numbering follows document reading order (header, document, footer).
        const orderedNames = Object.keys(decompressed).sort((a, b) => {
          const rank = (n: string) =>
            n === "word/document.xml" ? 1 :
            n.startsWith("word/header") ? 0 :
            n.startsWith("word/footer") ? 2 :
            n.startsWith("word/footnotes") ? 3 :
            n.startsWith("word/endnotes") ? 4 : 5;
          const ra = rank(a), rb = rank(b);
          return ra !== rb ? ra - rb : a.localeCompare(b);
        });

        // Global fallback counters (used when no region matches the offset).
        const globalCounters = new Map<string, number>();
        // Region log buffer for diagnostics.
        const regionLog: string[] = [];

        for (const filename of orderedNames) {
          const bytes = decompressed[filename];
          const isContentPart =
            filename === "word/document.xml" ||
            filename.startsWith("word/header") ||
            filename.startsWith("word/footer") ||
            filename.startsWith("word/footnotes") ||
            filename.startsWith("word/endnotes");
          if (!isContentPart) {
            out[filename] = bytes;
            continue;
          }
          let xml = decoder.decode(bytes);
          if (!xml.includes("_N")) {
            out[filename] = bytes;
            continue;
          }

          // Detect region boundaries (only meaningful in word/document.xml,
          // but harmless to attempt elsewhere — anchors won't be present).
          let regions: ReturnType<typeof findAnchorOffsets>;
          try {
            regions = findAnchorOffsets(xml);
          } catch (e) {
            regions = { partA: null, partB: null, props: [] };
          }
          if (filename === "word/document.xml") {
            regionLog.push(
              `${filename}: PART1=${regions.partA ? `[${regions.partA[0]},${regions.partA[1]}]` : "none"}, ` +
              `PART2=${regions.partB ? `[${regions.partB[0]},${regions.partB[1]}]` : "none"}, ` +
              `PROPS=[${regions.props.map(p => `#${p.k}@[${p.range[0]},${p.range[1]}]`).join(", ")}]`
            );
          }

          // Per-region counters: regionId -> tag -> count
          const regionCounters = new Map<string, Map<string, number>>();
          const bumpRegion = (id: string) => {
            if (!regionRewriteCounts[id]) regionRewriteCounts[id] = 0;
            regionRewriteCounts[id]++;
          };
          const getRegionCounter = (id: string, tag: string): number => {
            let m = regionCounters.get(id);
            if (!m) { m = new Map(); regionCounters.set(id, m); }
            const next = (m.get(tag) || 0) + 1;
            m.set(tag, next);
            return next;
          };

          // Resolve which region contains a given character offset.
          // Returns { id, forcedIndex?, allowedTags? }.
          const resolveRegion = (offset: number): {
            id: string;
            forcedIndex: number | null;
            allowedTags: Set<string> | null;
          } => {
            // Property sections take precedence (they sit after PART 2).
            for (const p of regions.props) {
              if (offset >= p.range[0] && offset < p.range[1]) {
                return {
                  id: `PROP#${p.k}`,
                  forcedIndex: p.k,
                  allowedTags: new Set(RE851D_INDEXED_TAGS),
                };
              }
            }
            if (regions.partB && offset >= regions.partB[0] && offset < regions.partB[1]) {
              return {
                id: "PART2",
                forcedIndex: null,
                allowedTags: new Set(PART2_TAGS),
              };
            }
            if (regions.partA && offset >= regions.partA[0] && offset < regions.partA[1]) {
              return {
                id: "PART1",
                forcedIndex: null,
                allowedTags: new Set(PART1_TAGS),
              };
            }
            return { id: "GLOBAL", forcedIndex: null, allowedTags: null };
          };

          // Use exec-based scan so we can read each match's offset and decide
          // its region. Process tags longest-first to avoid prefix collisions
          // (e.g. "propertytax.delinquent_amount_N" before "...delinquent_N").
          const tagsByLengthDesc = [...RE851D_INDEXED_TAGS].sort((a, b) => b.length - a.length);
          // We collect all rewrites first, then apply them in reverse order so
          // earlier offsets remain valid. Each rewrite is (start, end, replacement).
          type Rewrite = { start: number; end: number; replacement: string };
          const rewrites: Rewrite[] = [];

          // Track consumed [start,end) ranges to avoid double-matching when
          // a shorter tag is a substring of a longer one already matched.
          const consumed: Array<[number, number]> = [];
          const isConsumed = (s: number, e: number): boolean => {
            for (const [cs, ce] of consumed) {
              if (s < ce && e > cs) return true;
            }
            return false;
          };

          for (const tag of tagsByLengthDesc) {
            const re = new RegExp(tag.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "g");
            let m: RegExpExecArray | null;
            while ((m = re.exec(xml)) !== null) {
              const start = m.index;
              const end = start + m[0].length;
              if (isConsumed(start, end)) continue;
              const region = resolveRegion(start);
              // If the region restricts allowed tags and this tag isn't in the
              // allowlist, skip it (don't rewrite, don't consume the counter).
              if (region.allowedTags && !region.allowedTags.has(tag)) continue;

              let indexNum: number;
              if (region.forcedIndex !== null) {
                // PROPERTY #K: force every _N inside this block to _K.
                indexNum = region.forcedIndex;
                // Still bump the region counter so logs reflect activity.
                getRegionCounter(region.id, tag);
              } else if (region.id === "GLOBAL") {
                // Outside known regions: preserve previous global behavior.
                indexNum = (globalCounters.get(tag) || 0) + 1;
                globalCounters.set(tag, indexNum);
              } else {
                // PART1 / PART2: per-region running counter that resets at
                // the region boundary (each region has its own counter map).
                indexNum = getRegionCounter(region.id, tag);
              }

              let replacement: string;
              if (indexNum > 5) {
                // Beyond Property #5: blank by mapping to a guaranteed-empty key.
                replacement = tag.replace(/_N$/, `_overflow${indexNum}`);
              } else {
                replacement = tag.replace(/_N$/, `_${indexNum}`);
              }
              rewrites.push({ start, end, replacement });
              consumed.push([start, end]);
              bumpRegion(region.id);
              totalRewrites++;
            }
          }

          // ── RE851D contextual bare-tag rewrite ──
          // The uploaded RE851D template contains bare (non-_N) tags inside
          // some PROPERTY #K detail sections, e.g.
          //   PROPERTY #2 AGE  -> {{ pr_p_yearBuilt}}
          //   PROPERTY #3 SQUARE FEET -> {{pr_p_squareFeet}}
          //   {{#if propertytax.delinquent}}
          // Without rewriting, these resolve against Property #1's data
          // (or empty) regardless of which PROPERTY #K block they sit in.
          // Strictly scoped to the detected PROPERTY #K ranges.
          if (regions.props.length > 0) {
            const BARE_TAGS = [
              "pr_p_yearBuilt",
              "pr_p_squareFeet",
              "pr_p_appraiseValue",
              "pr_p_appraiseDate",
              "pr_p_construcType",
              "pr_p_descript",
              "pr_p_address",
              "pr_p_occupanc",
              "propertytax.annual_payment",
              "propertytax.delinquent_amount",
              "propertytax.source_of_information",
              "propertytax.delinquent",
            ];
            const isInRewriteSpan = (s: number, e: number): boolean => {
              for (const r of rewrites) {
                if (s < r.end && e > r.start) return true;
              }
              return false;
            };
            // Sort longest-first so dotted longer keys win over shorter prefixes.
            const bareSorted = [...BARE_TAGS].sort((a, b) => b.length - a.length);
            for (const p of regions.props) {
              for (const tag of bareSorted) {
                // Match the bare token only when it is NOT already followed by _<digit>
                // (so we don't double-rewrite tags that already have a numeric suffix).
                const escaped = tag.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
                const re = new RegExp(`${escaped}(?!_\\d|[A-Za-z0-9_])`, "g");
                let m: RegExpExecArray | null;
                while ((m = re.exec(xml)) !== null) {
                  const start = m.index;
                  const end = start + m[0].length;
                  if (start < p.range[0] || end > p.range[1]) continue;
                  if (isInRewriteSpan(start, end)) continue;
                  rewrites.push({
                    start,
                    end,
                    replacement: `${tag}_${p.k}`,
                  });
                  totalRewrites++;
                  if (!regionRewriteCounts[`PROP#${p.k}`]) regionRewriteCounts[`PROP#${p.k}`] = 0;
                  regionRewriteCounts[`PROP#${p.k}`]++;
                }
              }
            }
          }

          // Apply rewrites in reverse offset order so earlier offsets are stable.
          rewrites.sort((a, b) => b.start - a.start);
          for (const r of rewrites) {
            xml = xml.slice(0, r.start) + r.replacement + xml.slice(r.end);
          }

          out[filename] = encoder.encode(xml);
        }

        if (totalRewrites > 0) {
          templateBuffer = new Uint8Array(fflate.zipSync(out, { level: 0 }));
          console.log(
            `[generate-document] RE851D regions: ${regionLog.join(" | ")}; ` +
            `rewrites per region: ${
              Object.entries(regionRewriteCounts).map(([k, v]) => `${k}=${v}`).join(", ")
            }; total=${totalRewrites}`
          );
        }
      } catch (err) {
        console.error(
          `[generate-document] RE851D _N preprocessing failed (continuing with original template):`,
          err instanceof Error ? err.message : String(err)
        );
      }
    }

    let processedDocx: Uint8Array;
    try {
      processedDocx = await processDocx(templateBuffer, fieldValues, fieldTransforms, mergeTagMap, effectiveLabelMap, validFieldKeys, { templateName: template.name });
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      // Surface DOCX integrity failures as a real generation failure rather
      // than uploading a corrupted file that Word will refuse to open.
      if (message.startsWith("DOCX_INTEGRITY")) {
        console.error(`[generate-document] DOCX integrity check failed for template ${templateId}: ${message}`);
        result.error = `Generated document failed integrity check (${message.replace(/^DOCX_INTEGRITY:\s*/, "")}). Please review the template for unbalanced tags or invalid placeholders.`;
        return result;
      }
      throw err;
    }

    debugLog(`[generate-document] Processed DOCX: ${processedDocx.length} bytes`);

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
    const tFileExportStart = performance.now();
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
    if (isTemplate885) {
      console.log(`[885] File Export: ${Math.round(performance.now() - tFileExportStart)} ms`);
    }

    debugLog(`[generate-document] Uploaded to generated-docs: ${outputFileName}`);

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
        template_name: result.templateName,
        packet_name: packetName,
        generation_batch_id: generationBatchId,
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

    debugLog(`[generate-document] Created document record: ${generatedDoc.id}`);

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

    debugLog(`[generate-document] Logged activity: ${actionType}`);

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
    debugLog(`[generate-document] PDF conversion requested but CLOUDCONVERT_API_KEY not set`);
    return null;
  }

  try {
    debugLog(`[generate-document] Starting PDF conversion via CloudConvert...`);
    
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
    debugLog(`[generate-document] CloudConvert job created: ${jobId}`);

    // Poll for job completion using bounded exponential backoff.
    // Total worst-case wait ≈ 45s (vs. previous 60s flat × 30 polls), with
    // faster early polls so quick jobs return in 1–2s instead of always 2s.
    const pollDelaysMs = [1000, 1000, 2000, 2000, 3000, 3000, 4000, 4000, 4000, 4000, 4000, 4000, 4000, 4000]; // sum ≈ 45s
    let exportUrl: string | null = null;

    for (const delay of pollDelaysMs) {
      await new Promise(resolve => setTimeout(resolve, delay));

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
          debugLog(`[generate-document] PDF uploaded: ${pdfFileName}`);
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
  const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

  try {
    // Authenticate user
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(JSON.stringify({ error: "Missing or invalid authorization header" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Use service role client for all data operations (bypasses RLS)
    // and for token validation
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const token = authHeader.replace("Bearer ", "").trim();
    let userId: string | null = null;

    // Preferred path: validate JWT claims directly (doesn't depend on an active auth session row)
    const { data: claimsData, error: claimsError } = await supabase.auth.getClaims(token);
    if (!claimsError && claimsData?.claims?.sub) {
      userId = claimsData.claims.sub;
    } else {
      // Fallback path: fetch user from token
      const { data: userData, error: userError } = await supabase.auth.getUser(token);
      if (userError || !userData?.user) {
        console.error("[generate-document] Auth error:", claimsError?.message || userError?.message);
        return new Response(JSON.stringify({ error: "Invalid token" }), {
          status: 401,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      userId = userData.user.id;
    }

    debugLog(`[generate-document] User: ${userId}`);

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
    debugLog(`[generate-document] Request type: ${requestType}, deal: ${dealId}`);

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

    debugLog(`[generate-document] Created job: ${job.id}`);

    // Clean up stale jobs: mark any "running" jobs older than 120 seconds as "failed"
    const staleThreshold = new Date(Date.now() - 120_000).toISOString();
    await supabase
      .from("generation_jobs")
      .update({
        status: "failed",
        completed_at: new Date().toISOString(),
        error_message: "Generation timed out (CPU limit exceeded)",
      })
      .eq("deal_id", dealId)
      .eq("status", "running")
      .lt("started_at", staleThreshold)
      .neq("id", job.id);

    // Return immediately with "running" status — process in background
    const immediateResponse: JobResult = {
      jobId: job.id,
      dealId,
      requestType,
      status: "running",
      results: [],
      successCount: 0,
      failCount: 0,
      startedAt: job.started_at,
    };

    // Background processing via EdgeRuntime.waitUntil
    const backgroundTask = (async () => {
      const jobResult: JobResult = { ...immediateResponse };

      try {
        if (requestType === "single_doc" && templateId) {
          // Single document generation
          const result = await generateSingleDocument(
            supabase,
            dealId,
            templateId,
            deal.packet_id,
            null,
            outputType,
            userId,
            null
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
          
          // Fetch packet name for denormalization
          const { data: packetRecord } = await supabase
            .from("packets")
            .select("name")
            .eq("id", effectivePacketId)
            .single();
          const effectivePacketName = packetRecord?.name || null;

          // Generate a unique batch ID for this packet generation run
          const batchId = crypto.randomUUID();

          const { data: packetTemplates, error: ptError } = await supabase
            .from("packet_templates")
            .select("template_id, templates(id, name, file_path)")
            .eq("packet_id", effectivePacketId)
            .order("display_order");

          if (ptError) {
            throw new Error("Failed to fetch packet templates");
          }

          debugLog(`[generate-document] Processing ${packetTemplates?.length || 0} templates in packet (batch: ${batchId})`);

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
              effectivePacketName,
              outputType,
              userId,
              batchId
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

        // Update deal status to generated if successful
        if (jobResult.successCount > 0 && deal.status === "ready") {
          await supabase.from("deals").update({ status: "generated" }).eq("id", dealId);
          debugLog(`[generate-document] Updated deal status to generated`);
        }

        debugLog(`[generate-document] Job ${job.id} completed: ${jobResult.successCount} success, ${jobResult.failCount} failed`);

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

        console.error("[generate-document] Job failed:", error);
      }
    })();

    // Use EdgeRuntime.waitUntil if available (Deno Deploy / Supabase Edge Functions)
    // This allows the response to be sent immediately while processing continues
    if (typeof (globalThis as any).EdgeRuntime !== "undefined" && typeof (globalThis as any).EdgeRuntime.waitUntil === "function") {
      (globalThis as any).EdgeRuntime.waitUntil(backgroundTask);
      debugLog(`[generate-document] Background processing started via EdgeRuntime.waitUntil`);
    } else {
      // Fallback: await the task directly (local dev / environments without waitUntil)
      await backgroundTask;
      debugLog(`[generate-document] Processing completed synchronously (no EdgeRuntime.waitUntil)`);
    }

    return new Response(JSON.stringify(immediateResponse), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

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
