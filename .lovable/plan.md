## Plan: Fix RE851A Amortization checkbox population

### Goal
When generating RE851A, the Amortization dropdown value from CSR → Loan → Amortization will check exactly one matching checkbox in the document and leave all others unchecked.

### Confirmed cause
The dropdown value is being saved (example current deal has `ln_p_amortiza = other`) and the generation function already derives boolean values. However, the uploaded/generated RE851A document uses visible static checkbox markers next to labels such as `AMORTIZED PARTIALLY`, `AMORTIZED`, `INTEREST ONLY`, and `Other`. The existing label fallback only has partial label coverage and does not reliably force all Amortization labels, so the static document checkbox stays unchecked.

### Implementation steps
1. **Keep UI, database, APIs, template, and existing mappings unchanged**
   - No schema changes.
   - No template formatting or placement changes.
   - No dropdown behavior changes.

2. **Constrain the fix to document generation**
   - Update only the document-generation checkbox logic for RE851A Amortization.
   - Continue using existing source field `ln_p_amortiza` / `loan_terms.amortization`.

3. **Strengthen dropdown value normalization**
   - Normalize casing, spaces, underscores, hyphens, and punctuation so all saved variants match:
     - Fully Amortized
     - Partially Amortized
     - Interest Only
     - Constant Amortization
     - Add-On Interest
     - Other
   - Preserve the CHECK ONE behavior by setting all known Amortization booleans false except the selected option.

4. **Add RE851A Amortization label bindings at generation time**
   - Add runtime-only label mappings for the visible RE851A labels:
     - `AMORTIZED PARTIALLY` → `ln_p_amortizedPartially`
     - `AMORTIZED` / `FULLY AMORTIZED` → `ln_p_amortized`
     - `INTEREST ONLY` → `ln_p_interestOnly`
     - `Other` → `ln_p_other`
     - If field dictionary keys exist later for Constant Amortization / Add-On Interest, include those labels without creating schema.
   - This mirrors the existing broker-capacity and servicing checkbox fallback approach.

5. **Add a narrow final safety pass for the RE851A Amortization row**
   - In the local XML window around `INTEREST RATE` / `(CHECK ONE)` / `PAYMENT FREQUENCY`, force only the Amortization checkbox glyphs or native checkbox states to match the derived booleans.
   - Preserve surrounding text, spacing, table structure, alignment, and document formatting.
   - Do not touch other RE851A checkbox sections.

6. **Regression check**
   - Add/adjust a focused test using an XML fixture shaped like the RE851A Amortization row to verify:
     - Fully Amortized checks only `AMORTIZED`
     - Partially Amortized checks only `AMORTIZED PARTIALLY`
     - Interest Only checks only `INTEREST ONLY`
     - Other checks only `Other`
   - Confirm the document-generation code path still produces valid DOCX XML.

### Files expected to change
- `supabase/functions/generate-document/index.ts`
- `supabase/functions/_shared/tag-parser.ts`
- Possibly one focused regression test under `supabase/functions/_shared/`

### Explicit non-goals
- No changes to Contacts, Borrower, Loan UI layout, dropdown options, or save behavior.
- No database table, field dictionary, or migration changes.
- No RE851A template edits.
- No changes to unrelated document generation sections.