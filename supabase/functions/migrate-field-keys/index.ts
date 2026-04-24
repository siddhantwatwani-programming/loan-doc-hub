import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

const SECTION_ABBR: Record<string, string> = {
  borrower: "br", co_borrower: "cb", loan_terms: "ln", property: "pr",
  lender: "ld", broker: "bk", charges: "ch", dates: "dt", escrow: "es",
  origination_fees: "of", insurance: "in", notes: "nt", seller: "sl",
  title: "tt", participants: "pt",
};

const FORM_ABBR: Record<string, string> = {
  primary: "p", authorized_party: "ap", banking: "b", tax: "t", notes: "n",
  attachment: "at", legal: "lg", insurance: "ins", liens: "li", detail: "d",
  servicing: "sv", funding: "fd", balances: "bl", penalties: "pn",
  guarantor: "g", general: "g", additional: "ad", "1098": "tx",
  application: "app", escrow_title: "et", fees: "fe", property_conditions: "pc",
};

function inferFormType(fieldKey: string, section: string): string {
  const key = fieldKey.toLowerCase();

  if (section === "borrower" || section === "co_borrower") {
    if (key.includes("authorized_party") || key.includes("auth_party")) return "authorized_party";
    if (key.includes(".bank.") || key.includes("routing_number") || key.includes("account_holder"))
      return "banking";
    if (key.includes(".1098.") || key.includes(".tax.") || key.includes("filing_status") || key.includes("annual_income") || key.match(/\btin\b/) || key.match(/\bssn\b/))
      return "tax";
    if (key.includes("_note") || key.includes(".note")) return "notes";
    if (key.includes("attach")) return "attachment";
  }

  if (section === "loan_terms") {
    if (key.includes("penalties.") || key.includes("late_charge") || key.includes("default_interest")) return "penalties";
    if (key.includes("servicing.") || key.includes("disbursement")) return "servicing";
    if (key.includes("funding.") || key.includes("wire") || key.includes("fund_")) return "funding";
    if (key.includes("balance") || key.includes("principal_balance") || key.includes("unpaid")) return "balances";
    if (key.includes("maturity") || key.includes("prepay")) return "penalties";
  }

  if (section === "property") {
    if (key.includes("legal") || key.includes("lot") || key.includes("parcel") || key.includes("tract")) return "legal";
    if (key.includes("insurance") || key.includes("policy")) return "insurance";
    if (key.includes("lien") || key.includes("mortgage")) return "liens";
    if (key.includes(".tax") || key.includes("assessed")) return "tax";
    if (key.includes("note") && !key.includes("notary")) return "notes";
  }

  if (section === "lender") {
    if (key.includes("authorized_party") || key.includes("auth_party")) return "authorized_party";
    if (key.includes(".bank.") || key.includes("routing") || key.includes(".account")) return "banking";
    if (key.includes(".tax.") || key.includes("1098") || key.match(/\btin\b/)) return "tax";
    if (key.includes("funding") || key.includes("wire")) return "funding";
  }

  if (section === "broker") {
    if (key.includes(".bank.") || key.includes("routing") || key.includes(".account")) return "banking";
  }

  if (section === "origination_fees") {
    if (key.includes("801") || key.includes("origination")) return "fees";
    if (key.includes("escrow") || key.includes("title")) return "escrow_title";
    if (key.includes("insurance")) return "insurance";
    return "fees";
  }

  return "primary";
}

function labelToIdentifier(label: string): string {
  const words = label.replace(/[^a-zA-Z0-9\s]/g, "").trim().split(/\s+/).filter(Boolean);
  if (words.length === 0) return "field";
  
  return words
    .slice(0, 4) // max 4 words
    .map((word, idx) => {
      const w = word.toLowerCase();
      if (idx === 0) return w.length > 8 ? w.substring(0, 8) : w;
      return (w.charAt(0).toUpperCase() + w.slice(1)).substring(0, 6);
    })
    .join("");
}

function generateNewKey(section: string, formType: string, label: string, usedKeys: Set<string>): string {
  const sAbbr = SECTION_ABBR[section] || section.substring(0, 2);
  const fAbbr = FORM_ABBR[formType] || formType.substring(0, 2);
  const ident = labelToIdentifier(label);
  let candidate = `${sAbbr}_${fAbbr}_${ident}`;

  if (usedKeys.has(candidate)) {
    let i = 2;
    while (usedKeys.has(`${candidate}${i}`)) i++;
    candidate = `${candidate}${i}`;
  }
  usedKeys.add(candidate);
  return candidate;
}

// Paginated fetch to get ALL rows (bypassing 1000 limit)
async function fetchAllFields(supabase: any, sections: string[]) {
  const allFields: any[] = [];
  const PAGE_SIZE = 500;
  let offset = 0;
  let hasMore = true;

  while (hasMore) {
    const { data, error } = await supabase
      .from("field_dictionary")
      .select("id, field_key, label, section, data_type")
      .in("section", sections)
      .order("section")
      .order("label")
      .range(offset, offset + PAGE_SIZE - 1);

    if (error) throw error;
    if (!data || data.length === 0) break;
    allFields.push(...data);
    hasMore = data.length === PAGE_SIZE;
    offset += PAGE_SIZE;
  }
  return allFields;
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

    const { mode = "preview", section_filter = null } = await req.json().catch(() => ({}));

    let targetSections = [
      "borrower", "co_borrower", "loan_terms", "property", "lender",
      "broker", "charges", "dates", "escrow", "origination_fees",
      "insurance", "notes", "seller", "title", "participants",
    ];
    
    // Allow filtering to one section at a time for apply mode
    if (section_filter) {
      targetSections = [section_filter];
    }

    const fields = await fetchAllFields(supabase, targetSections);

    if (fields.length === 0) {
      return new Response(JSON.stringify({ message: "No fields to migrate" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const usedKeys = new Set<string>();
    const migrations: Array<{
      id: string; old_key: string; new_key: string;
      form_type: string; section: string; label: string;
    }> = [];

    for (const field of fields) {
      const formType = inferFormType(field.field_key, field.section);
      const newKey = generateNewKey(field.section, formType, field.label, usedKeys);
      migrations.push({
        id: field.id, old_key: field.field_key, new_key: newKey,
        form_type: formType, section: field.section, label: field.label,
      });
    }

    if (mode === "preview") {
      const bySection = migrations.reduce((acc, m) => {
        acc[m.section] = (acc[m.section] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);

      return new Response(
        JSON.stringify({
          message: `Preview: ${migrations.length} fields would be migrated`,
          total: migrations.length,
          by_section: bySection,
          sample: migrations.slice(0, 30),
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (mode === "apply") {
      // Clear existing pending migrations
      await supabase.from("field_key_migrations").delete().eq("status", "pending");

      const BATCH_SIZE = 50;
      let insertedCount = 0;
      let updatedCount = 0;

      // Insert migration records
      for (let i = 0; i < migrations.length; i += BATCH_SIZE) {
        const batch = migrations.slice(i, i + BATCH_SIZE).map(m => ({
          old_key: m.old_key, new_key: m.new_key, status: "pending",
        }));
        const { error } = await supabase.from("field_key_migrations").insert(batch);
        if (!error) insertedCount += batch.length;
        else console.error(`Insert batch error at ${i}:`, error.message);
      }

      // Update field_dictionary
      for (const m of migrations) {
        const { error } = await supabase
          .from("field_dictionary")
          .update({
            field_key: m.new_key,
            form_type: m.form_type,
            canonical_key: m.old_key,
          })
          .eq("id", m.id);

        if (!error) updatedCount++;
        else console.error(`Update error ${m.old_key}:`, error.message);
      }

      // Mark as migrated
      await supabase
        .from("field_key_migrations")
        .update({ status: "migrated", migrated_at: new Date().toISOString() })
        .eq("status", "pending");

      return new Response(
        JSON.stringify({
          message: "Migration applied",
          inserted_migrations: insertedCount,
          updated_fields: updatedCount,
          total: migrations.length,
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    return new Response(
      JSON.stringify({ error: 'Use mode "preview" or "apply"' }),
      { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    console.error("Error:", err);
    const message = err instanceof Error ? err.message : String(err);
    return new Response(
      JSON.stringify({ error: message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
