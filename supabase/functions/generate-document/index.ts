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
import { fetchMergeTagMappings, fetchFieldKeyMappings, extractRawValueFromJsonb } from "../_shared/field-resolver.ts";
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
    const allFieldDictIdSet = new Set<string>();
    (sectionValues || []).forEach((sv: any) => {
      Object.keys(sv.field_values || {}).forEach((key: string) => {
        const fieldDictId = key.includes("::") ? key.split("::")[1] : key;
        if (fieldDictId) allFieldDictIdSet.add(fieldDictId);
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
          if (cd["address.street"]) setIfEmpty(`${shortPrefix}_street`, cd["address.street"]);
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
          debugLog(`[generate-document] Injected lender contact fields from participant (contact ${lc.contact_id})`);
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

          // Force-set short prefix keys (bk_p_*)
          forceSet("bk_p_fullName", fullName);
          forceSet("bk_p_firstName", firstName);
          forceSet("bk_p_lastName", lastName);
          forceSet("bk_p_middleInitia", middleName);
          forceSet("bk_p_email", email);
          forceSet("bk_p_company", company);
          forceSet("bk_p_phone", phone);
          forceSet("bk_p_fax", fax);
          if (license) {
            forceSet("bk_p_brokerLicens", String(license));
            forceSet("broker.License", String(license));
            forceSet("broker.license_number", String(license));
            forceSet("broker1.license_number", String(license));
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
            if (cd["address.street"]) forceSet(`${prefix}.address.street`, cd["address.street"]);
            if (cd["address.city"] || cr.city) forceSet(`${prefix}.address.city`, cd["address.city"] || cr.city);
            if (cd["address.state"] || cr.state) forceSet(`${prefix}.state`, cd["address.state"] || cr.state);
            if (cd["address.zip"]) forceSet(`${prefix}.address.zip`, cd["address.zip"]);
            if (cd.tax_id) forceSet(`${prefix}.tax_id`, cd.tax_id);
            if (license) forceSet(`${prefix}.License`, String(license));
          }

          debugLog(`[generate-document] Force-injected broker contact fields from participant (contact ${cr.contact_id}, license: ${license || 'n/a'})`);
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
            propertyLines.push(addrStr);
          }
        }
      }
      if (propertyLines.length > 0) {
        const allPropertiesText = propertyLines.join("\n");
        fieldValues.set("all_properties_list", { rawValue: allPropertiesText, dataType: "text" });
        debugLog(`[generate-document] Built all_properties_list with ${propertyLines.length} properties`);
      }
      // When multiple properties exist, rebuild pr_p_address with all addresses separated by line breaks
      if (propertyLines.length > 1) {
        fieldValues.set("pr_p_address", { rawValue: propertyLines.join("\n"), dataType: "text" });
        debugLog(`[generate-document] Rebuilt pr_p_address with ${propertyLines.length} properties (multi-line)`);
      }
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

      for (const [key, val] of [...fieldValues.entries()]) {
        // Match lien1.holder, lien2.holder, lien.holder etc.
        const lienMatch = key.match(/^lien(\d*)\.(.+)$/);
        if (lienMatch && val.rawValue) {
          const field = lienMatch[2];
          const prLiKey = lienFieldToPrLi[field];
          if (prLiKey && !fieldValues.has(prLiKey)) {
            fieldValues.set(prLiKey, val);
          }
          const canonKey = lienFieldToCanonical[field];
          if (canonKey && !fieldValues.has(canonKey)) {
            fieldValues.set(canonKey, val);
          }
          const liKey = lienFieldToLiKeys[field];
          if (liKey && !fieldValues.has(liKey)) {
            fieldValues.set(liKey, val);
          }
          const altKey = lienFieldToAltKeys[field];
          if (altKey && !fieldValues.has(altKey)) {
            fieldValues.set(altKey, val);
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
      debugLog(`[generate-document] Lien field bridging complete`);
      // Bridge ln_p_lienPosit (template tag) -> ln_p_lienPositi (actual field key)
      const lienPosVal = fieldValues.get("ln_p_lienPositi");
      if (lienPosVal && !fieldValues.has("ln_p_lienPosit")) {
        fieldValues.set("ln_p_lienPosit", lienPosVal);
        debugLog(`[generate-document] Bridged ln_p_lienPositi -> ln_p_lienPosit`);
      }
    }

    // Build set of all valid field keys once and reuse it across invocations.
    const validFieldKeys = await getValidFieldKeys(supabase);

    // 4. Download template DOCX from storage
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

    // 5. Fetch merge tag mappings AND field key migration maps, then process the DOCX
    // fetchFieldKeyMappings populates the in-memory cache used by resolveFieldKeyWithMap
    const [{ mergeTagMap, labelMap }, _fieldKeyMappings] = await Promise.all([
      fetchMergeTagMappings(supabase),
      fetchFieldKeyMappings(supabase),
    ]);
    const templateBuffer = new Uint8Array(await fileData.arrayBuffer());
    const processedDocx = await processDocx(templateBuffer, fieldValues, fieldTransforms, mergeTagMap, labelMap, validFieldKeys);

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
