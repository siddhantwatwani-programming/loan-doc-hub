# RE851A: Amortization → Interest Only / Other Checkboxes

## Goal
When generating the RE851A document, populate the **Interest Only** and **Other** checkboxes in the Amortization section based on the value selected in the CSR → Loan → Amortization dropdown.

## Context
- The Amortization dropdown persists under `ln_p_amortiza` (legacy key) / `loan_terms.amortization`.
- The engine already derives `ln_p_amortized` and `ln_p_amortizedPartially` from this same dropdown in `supabase/functions/generate-document/index.ts` (around line 815).
- Field dictionary already has `ln_p_interestOnly` and `ln_p_other` (Boolean).
- No template, schema, dropdown, or UI changes required.

## Change

Extend the existing Amortization derivation block in `supabase/functions/generate-document/index.ts` to also publish booleans + glyph aliases for the two new checkboxes:

- If dropdown value (lowercased, trimmed) is `interest only` / `interest_only`:
  - `ln_p_interestOnly = true`, `ln_p_other = false`
- If dropdown value is `other`:
  - `ln_p_other = true`, `ln_p_interestOnly = false`
- Otherwise both remain `false`.

Also publish glyph aliases (`ln_p_interestOnlyGlyph`, `ln_p_otherGlyph` → `☑` / `☐`) for templates that use direct merge tags instead of `{{#if}}` conditionals — same pattern used for the Servicing Agent and Broker Capacity checkboxes.

Mutual exclusivity is guaranteed because both flags are derived from the single dropdown value.

## Files Touched
- `supabase/functions/generate-document/index.ts` — append derivation lines inside the existing Amortization block (no other code paths modified).

## Out of Scope
- No changes to the RE851A `.docx` template.
- No changes to the field dictionary, UI form, save/load APIs, or dropdown options.
- No changes to other RE851A merge tags or checkbox blocks.

## Acceptance
- Selecting **Interest Only** → only the Interest Only checkbox is checked in the generated RE851A.
- Selecting **Other** → only the Other checkbox is checked.
- Document generates successfully with no layout/format change.
