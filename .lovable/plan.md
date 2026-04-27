# RE851A Amortization Checkbox — CHECK ONE Mapping

## Problem
The CSR → Loan → Amortization dropdown has six options, but the RE851A generator only derives boolean checkbox values for four of them:

| Dropdown option | Currently derived? |
|---|---|
| Fully Amortized | yes (`ln_p_amortized`) |
| Partially Amortized | yes (`ln_p_amortizedPartially`) |
| Interest Only | yes (`ln_p_interestOnly`) |
| **Constant Amortization** | **no** |
| **Add-On Interest** | **no** |
| Other | yes (`ln_p_other`) |

Because the two missing options aren't recognized, selecting them leaves every amortization checkbox unchecked in the generated document. The four existing options also need a sanity guarantee that only one fires at a time (the current code already does this, but we'll keep it explicit).

## Fix (single file)
Edit only `supabase/functions/generate-document/index.ts`, lines 813–825 — the existing amortization derivation block.

1. Compute six mutually-exclusive booleans from the lowercased dropdown value (with normalised aliases for each, e.g. `"add-on interest"`, `"add on interest"`, `"add_on_interest"`).
2. Set six `ln_p_*` boolean keys in `fieldValues`. Existing keys `ln_p_amortized`, `ln_p_amortizedPartially`, `ln_p_interestOnly`, `ln_p_other` keep their identifiers. Two new keys are added:
   - `ln_p_constantAmortization`
   - `ln_p_addOnInterest`
3. Set matching `*Glyph` keys (`☑`/`☐`) for templates that render checkboxes via static glyph merge tags (mirrors the existing `ln_p_interestOnlyGlyph` / `ln_p_otherGlyph` pattern).
4. Update the debug log line to include the two new flags.

That's the entire change.

## What is NOT changing
- No template edits (no formatting, spacing, alignment, or checkbox placement changes).
- No schema changes, no new field_dictionary rows (these are derived runtime keys, identical pattern to the existing amortization/servicing keys).
- No change to the dropdown UI, options list, or persistence path.
- No change to `effectiveLabelMap`, `processDocx`, or the document generation pipeline.
- No change to any other RE851A section.

## Acceptance criteria
- Selecting any of the six options produces exactly one `true` boolean (and one `☑` glyph); the other five stay `false` / `☐`.
- Existing four selections continue to behave identically in the generated document.
- Constant Amortization and Add-On Interest selections now produce a derived boolean + glyph available for the template.
- Document generates successfully without corruption.
