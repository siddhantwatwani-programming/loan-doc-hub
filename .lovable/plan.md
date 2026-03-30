

# Document Generation: Mapped Fields Not Populating

## Root Cause Analysis

After investigating the full document generation pipeline, I identified **two distinct root causes**:

### Problem 1: Template has no field mappings in `template_field_maps`

The template "MORTGAGE LOAN DISCLOSURE STATEMENT/ GOOD FAITH ESTIMATE" (ID: `cd143d34-...`) has **zero rows** in `template_field_maps`. The Field Map Editor page allows admins to map field_dictionary entries to templates, but this template has none configured.

However, this is **not the primary blocker** — the generate-document function fetches ALL deal field values regardless of field maps. Field maps are only used for transform rules.

### Problem 2: Merge tag names in the DOCX don't match field_key values (PRIMARY CAUSE)

The document generation engine resolves merge tags (e.g., `{{Escrow_Number}}`, `«Loan_Amount»`) to field values by:
1. Looking up the tag name in `merge_tag_aliases` 
2. Trying direct match against `field_dictionary.field_key`
3. Trying canonical_key and migration lookups
4. Case-insensitive fallback

**Borrower Name and Property Address work** because they have explicit `merge_tag_aliases` entries (e.g., `Borrower_Name` → `Borrower.Name`, `Property Address` label alias → `Property1.Address`).

**All other fields fail** because:
- The template uses legacy tag names (e.g., `Loan_Amount`, `Interest_Rate`, `Escrow_Number`, etc.)
- The field_dictionary stores keys like `origination_esc.escrow_number`, `ln_p_noteRate`, etc.
- There are **no merge_tag_aliases** bridging the template's tag names to these field_key values
- The case-insensitive fallback cannot match `Escrow_Number` to `origination_esc.escrow_number` since they are fundamentally different strings

### Data Verification
The deal DL-2026-0170 has data in ALL sections including `origination_fees` (79KB of field values). The `origination_esc.*` fields (escrow number, company, street, city, etc.) are all populated. The data exists — it just cannot be resolved during tag replacement.

## Proposed Fix

### Step 1: Extract template merge tags
Use the `validate-template` edge function to extract all merge tag names from the uploaded DOCX template.

### Step 2: Create merge_tag_aliases for unmapped tags
For each unresolved tag found in the template, create a `merge_tag_aliases` entry mapping the template's tag name to the corresponding `field_dictionary.field_key`. This bridges the gap between legacy template tag naming and the current field key schema.

### Step 3: Enhance the generate-document engine with broader key matching
Add a fallback resolution pass in the tag-parser that attempts fuzzy/suffix matching when exact, migration, canonical, and alias lookups all fail. This makes the system more robust for future templates:

- **File**: `supabase/functions/_shared/field-resolver.ts`
- **Change**: In `resolveFieldKeyWithBackwardCompat`, after all existing priority lookups fail, add a suffix-based fallback that strips common prefixes and tries to match the tag against field_key suffixes. For example, `Escrow_Number` would match `origination_esc.escrow_number` by normalizing underscores and comparing the trailing segment.

### Step 4: Add dot-notation field value bridging for origination fields
In `supabase/functions/generate-document/index.ts`, after building the `fieldValues` map, add bridging logic that creates short-form aliases for origination fields. For example:
- `origination_esc.escrow_number` → also set `escrow_number`
- `origination_esc.escrow_company` → also set `escrow_company`

This mirrors the existing pattern used for property fields (`pr_p_street` → `property1.street`).

### Step 5: Redeploy and test
Deploy the updated edge functions and regenerate the document for DL-2026-0170 to verify all mapped fields populate correctly.

## Files to Modify

1. **`supabase/functions/_shared/field-resolver.ts`** — Add suffix-based fallback resolution
2. **`supabase/functions/generate-document/index.ts`** — Add origination field bridging in the fieldValues map building section
3. **Database**: Insert `merge_tag_aliases` rows for the specific template tags (via migration)

## What Will NOT Change
- No UI layout changes
- No database schema changes
- No existing functionality modifications
- No template or document generation logic rewrites — only additive resolution fallbacks

