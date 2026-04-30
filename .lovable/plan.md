I confirmed this is not a missing CSR data problem. The deal currently has distinct stored values:

```text
property1: Doveson Street, Boston, AL, 10002 | appraised 5,000,000 | type Multi-family
property2: MG Road, Noida, AZ, 98454       | appraised 323       | type Condo / Townhouse
property3: MG Ringh, Noida, 98454          | appraised 343       | type Commercial
```

The generated `Re851d_v9.docx` still repeats Property #1 values because some RE851D template placeholders are still generic or unindexed. The uploaded template includes patterns such as:

```text
{{pr_p_address_N}}
{{pr_p_appraiseValue_N}}
{{ln_p_loanToValueRatio_N}}
```

but also has later property sections with blank placeholders or unindexed tags like:

```text
{{pr_p_address}}
{{pr_p_squareFeet}}
{{ propertytax.annual_payment }}
```

Those unindexed tags resolve to the first/canonical property value, so repeated sections can show Property[0] over and over.

Plan to fix, with minimal scope:

1. Update only RE851D document generation binding logic
   - Modify `supabase/functions/generate-document/index.ts` only.
   - Do not change UI, database schema, field dictionary, storage model, or general document generation flow.

2. Replace the fragile global `_N` occurrence counter with RE851D section-scoped index binding
   - Detect RE851D property sections by document structure:
     - Part 2 repeated `PROPERTY TYPE / PROPERTY OWNER / PROPERTY` blocks.
     - Explicit `PROPERTY #1`, `PROPERTY #2`, `PROPERTY #3`, etc. sections.
   - Assign one property index per section/block.
   - Rewrite all property-related placeholders inside that block to the same index.

3. Support both generic `_N` tags and unindexed RE851D property tags
   - Convert within each detected property block:
     - `pr_p_address_N` -> `pr_p_address_2` for Property #2, etc.
     - `pr_p_appraiseValue_N` -> `pr_p_appraiseValue_2`, etc.
     - `ln_p_loanToValueRatio_N` -> `ln_p_loanToValueRatio_2`, etc.
   - Also convert unsafe unindexed tags inside explicit repeated RE851D property blocks:
     - `pr_p_address` -> `pr_p_address_2`
     - `pr_p_squareFeet` -> `pr_p_squareFeet_2`
     - `pr_p_construcType` -> `pr_p_construcType_2`
     - `propertytax.annual_payment` -> `propertytax_annual_payment_2`
   - Keep non-property/global fields unchanged.

4. Add missing per-index aliases already needed by the template
   - Ensure existing per-property alias publishing covers the actual template tags used for:
     - Address
     - Market/appraised value
     - Loan-to-value
     - Property type
     - Square feet
     - Construction type
     - Property tax aliases
     - Encumbrance totals
   - Preserve current formatting rules: US currency and percentage formatting.

5. Prevent cross-index fallback
   - If Property #2 or #3 does not have a field value, render blank for that property-specific field.
   - Do not fall back to Property #1.

6. Add targeted diagnostics
   - Add RE851D-only logs summarizing:
     - Detected property sections and assigned indices.
     - Rewritten placeholder counts.
     - Available property aliases for property1/property2/property3.
   - This will help verify the next generated document without changing user-facing behavior.

7. Validate against the uploaded failure case
   - Use the uploaded template/output analysis and the live deal data to verify expected binding:
     - Property #1 -> Doveson Street
     - Property #2 -> MG Road
     - Property #3 -> MG Ringh
   - Ensure Part 2 table rows and detailed Property sections use their own per-index values for market value, LTV, encumbrances, and property type.

Files expected to change:

```text
supabase/functions/generate-document/index.ts
```

No database changes, no UI changes, no template overwrite, and no refactor outside the RE851D-specific generation path.