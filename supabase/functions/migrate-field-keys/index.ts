import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

// Section abbreviation map
const SECTION_ABBR: Record<string, string> = {
  borrower: "br",
  co_borrower: "cb",
  loan_terms: "ln",
  property: "pr",
  lender: "ld",
  broker: "bk",
  charges: "ch",
  dates: "dt",
  escrow: "es",
  origination_fees: "of",
  insurance: "in",
  notes: "nt",
  seller: "sl",
  title: "tt",
  participants: "pt",
};

// Form type abbreviation map
const FORM_ABBR: Record<string, string> = {
  primary: "p",
  authorized_party: "ap",
  banking: "b",
  tax: "t",
  notes: "n",
  attachment: "at",
  legal: "lg",
  insurance: "ins",
  liens: "li",
  detail: "d",
  servicing: "sv",
  funding: "fd",
  balances: "bl",
  penalties: "pn",
  guarantor: "g",
  general: "g",
  additional: "ad",
  "1098": "tx",
  application: "app",
  escrow_title: "et",
  fees: "fe",
  property_conditions: "pc",
};

// Infer form_type from the old field_key pattern
function inferFormType(fieldKey: string, section: string): string {
  const key = fieldKey.toLowerCase();

  // Borrower/Co-Borrower patterns
  if (section === "borrower" || section === "co_borrower") {
    if (key.includes("authorized_party") || key.includes("auth_party"))
      return "authorized_party";
    if (key.includes(".bank.") || key.includes("routing_number") || key.includes("account_holder") || key.includes("account_number") || key.includes("account_type"))
      return "banking";
    if (key.includes(".1098.") || key.includes(".tax.") || key.includes("filing_status") || key.includes("annual_income") || key.includes("tin") || key.includes("ssn"))
      return "tax";
    if (key.includes("_note") || key.includes(".note"))
      return "notes";
    if (key.includes("attach"))
      return "attachment";
  }

  // Loan terms patterns
  if (section === "loan_terms") {
    if (key.includes("penalties.") || key.includes("late_charge") || key.includes("default_interest") || key.includes("maturity"))
      return "penalties";
    if (key.includes("servicing.") || key.includes("disbursement"))
      return "servicing";
    if (key.includes("funding.") || key.includes("wire") || key.includes("fund_"))
      return "funding";
    if (key.includes("balance") || key.includes("principal_balance") || key.includes("unpaid"))
      return "balances";
  }

  // Property patterns
  if (section === "property") {
    if (key.includes("legal") || key.includes("lot") || key.includes("parcel") || key.includes("tract"))
      return "legal";
    if (key.includes("insurance") || key.includes("policy"))
      return "insurance";
    if (key.includes("lien") || key.includes("mortgage"))
      return "liens";
    if (key.includes("tax") || key.includes("assessed"))
      return "tax";
    if (key.includes("note") && !key.includes("notary"))
      return "notes";
  }

  // Lender patterns
  if (section === "lender") {
    if (key.includes("authorized_party") || key.includes("auth_party"))
      return "authorized_party";
    if (key.includes(".bank.") || key.includes("routing") || key.includes("account"))
      return "banking";
    if (key.includes(".tax.") || key.includes("1098") || key.includes("tin"))
      return "tax";
    if (key.includes("funding") || key.includes("wire"))
      return "funding";
  }

  // Broker patterns
  if (section === "broker") {
    if (key.includes(".bank.") || key.includes("routing") || key.includes("account"))
      return "banking";
  }

  return "primary";
}

// Generate a camelCase identifier from a label
function labelToIdentifier(label: string): string {
  return label
    .replace(/[^a-zA-Z0-9\s]/g, "")
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .map((word, idx) => {
      const lower = word.toLowerCase();
      if (idx === 0) return lower.length > 6 ? lower.substring(0, 6) : lower;
      const cap = lower.charAt(0).toUpperCase() + lower.slice(1);
      return cap.length > 5 ? cap.substring(0, 5) : cap;
    })
    .join("")
    .substring(0, 16) || "field";
}

function generateNewKey(
  section: string,
  formType: string,
  label: string,
  usedKeys: Set<string>
): string {
  const sAbbr = SECTION_ABBR[section] || section.substring(0, 2);
  const fAbbr = FORM_ABBR[formType] || formType.substring(0, 2);
  const ident = labelToIdentifier(label);

  let candidate = `${sAbbr}_${fAbbr}_${ident}`;

  // Handle collisions by appending a number
  if (usedKeys.has(candidate)) {
    let i = 2;
    while (usedKeys.has(`${candidate}${i}`)) {
      i++;
    }
    candidate = `${candidate}${i}`;
  }

  usedKeys.add(candidate);
  return candidate;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const { mode = "preview" } = await req.json().catch(() => ({}));

    // Fetch all migratable fields
    const targetSections = [
      "borrower", "co_borrower", "loan_terms", "property", "lender",
      "broker", "charges", "dates", "escrow", "origination_fees",
      "insurance", "notes", "seller", "title", "participants",
    ];

    const { data: fields, error: fetchErr } = await supabase
      .from("field_dictionary")
      .select("id, field_key, label, section, data_type")
      .in("section", targetSections)
      .order("section")
      .order("label");

    if (fetchErr) throw fetchErr;
    if (!fields || fields.length === 0) {
      return new Response(JSON.stringify({ message: "No fields to migrate" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Generate new keys
    const usedKeys = new Set<string>();
    const migrations: Array<{
      id: string;
      old_key: string;
      new_key: string;
      form_type: string;
      section: string;
      label: string;
    }> = [];

    for (const field of fields) {
      const formType = inferFormType(field.field_key, field.section);
      const newKey = generateNewKey(field.section, formType, field.label, usedKeys);

      migrations.push({
        id: field.id,
        old_key: field.field_key,
        new_key: newKey,
        form_type: formType,
        section: field.section,
        label: field.label,
      });
    }

    if (mode === "preview") {
      // Preview mode: just return the mappings without applying
      return new Response(
        JSON.stringify({
          message: `Preview: ${migrations.length} fields would be migrated`,
          total: migrations.length,
          sample: migrations.slice(0, 50),
          by_section: migrations.reduce((acc, m) => {
            acc[m.section] = (acc[m.section] || 0) + 1;
            return acc;
          }, {} as Record<string, number>),
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (mode === "apply") {
      // Step 1: Clear any existing pending migrations for these fields
      await supabase
        .from("field_key_migrations")
        .delete()
        .eq("status", "pending");

      // Step 2: Insert migration records in batches
      const BATCH_SIZE = 100;
      let insertedCount = 0;

      for (let i = 0; i < migrations.length; i += BATCH_SIZE) {
        const batch = migrations.slice(i, i + BATCH_SIZE).map((m) => ({
          old_key: m.old_key,
          new_key: m.new_key,
          status: "pending",
        }));

        const { error: insertErr } = await supabase
          .from("field_key_migrations")
          .insert(batch);

        if (insertErr) {
          console.error(`Batch insert error at offset ${i}:`, insertErr);
          // Continue with next batch
        } else {
          insertedCount += batch.length;
        }
      }

      // Step 3: Update field_dictionary with new keys and form_types
      let updatedCount = 0;
      for (let i = 0; i < migrations.length; i += BATCH_SIZE) {
        const batch = migrations.slice(i, i + BATCH_SIZE);

        for (const m of batch) {
          const { error: updateErr } = await supabase
            .from("field_dictionary")
            .update({
              field_key: m.new_key,
              form_type: m.form_type,
              canonical_key: m.old_key, // Preserve old key for backward compatibility
            })
            .eq("id", m.id);

          if (updateErr) {
            console.error(`Update error for ${m.old_key}:`, updateErr);
          } else {
            updatedCount++;
          }
        }
      }

      // Step 4: Mark migrations as applied
      await supabase
        .from("field_key_migrations")
        .update({
          status: "migrated",
          migrated_at: new Date().toISOString(),
        })
        .eq("status", "pending");

      return new Response(
        JSON.stringify({
          message: "Migration applied successfully",
          inserted_migrations: insertedCount,
          updated_fields: updatedCount,
          total_fields: migrations.length,
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    return new Response(
      JSON.stringify({ error: 'Invalid mode. Use "preview" or "apply"' }),
      { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    console.error("Migration error:", err);
    return new Response(
      JSON.stringify({ error: err.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
