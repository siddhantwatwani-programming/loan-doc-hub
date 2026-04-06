

## Plan: Dropdown-to-Checkbox Auto-Mapping for Re851a Document

### Summary
When generating Re851a, derive boolean checkbox values from existing dropdown fields (Amortization and Payment Frequency), so checkboxes in the template are automatically checked based on the selected dropdown value. The generated DOCX remains editable.

### How It Works Today
The document engine already supports two checkbox mechanisms:
- **Native Word SDT checkboxes** (`processSdtCheckboxes` in tag-parser.ts) — reads `<w:tag>` values, resolves to field keys, toggles checked state. These remain editable in DOCX.
- **Static checkbox labels** (`replaceStaticCheckboxLabel`) — replaces ☐/☑ Unicode glyphs next to label text for boolean fields.

Both mechanisms look up boolean values from `fieldValues`. The fix is to **inject derived boolean values** into `fieldValues` based on the dropdown selections, before the template is processed.

### Field Mapping

| Dropdown Field | Stored Key | Dropdown Value | Derived Boolean Key | Value |
|---|---|---|---|---|
| Amortization | `ln_p_amortiza` | `Amortized Partially` | `ln_p_amortizedPartially` | `true` |
| Amortization | `ln_p_amortiza` | `Amortized` | `ln_p_amortized` | `true` |
| Payment Frequency | `ln_p_paymentFreque` | `Monthly` | `ln_p_paymentMonthly` | `true` |
| Payment Frequency | `ln_p_paymentFreque` | `Weekly` | `ln_p_paymentWeekly` | `true` |

All non-matching derived keys get set to `false`.

### Template Requirement
The Re851a template must have checkboxes tagged with these derived boolean key names (either as SDT `<w:tag>` values or as `{{ln_p_amortized|checkbox}}` merge tags next to labels). **No template format change needed** — we just need to confirm which mechanism the template uses. Both are already supported.

### Technical Changes

**File: `supabase/functions/generate-document/index.ts`** (1 change)

After the existing auto-compute blocks (around line 734), add a new block that:
1. Reads the amortization value from `fieldValues` (`ln_p_amortiza` or `loan_terms.amortization`)
2. Sets `ln_p_amortizedPartially` = `true`/`false` and `ln_p_amortized` = `true`/`false` based on the dropdown value
3. Reads the payment frequency value from `fieldValues` (`ln_p_paymentFreque` or `loan_terms.payment_frequency`)
4. Sets `ln_p_paymentMonthly` = `true`/`false` and `ln_p_paymentWeekly` = `true`/`false` based on the dropdown value

This ensures the boolean values exist in `fieldValues` before `processDocx` runs, so both SDT checkboxes and static checkbox labels will resolve correctly.

**File: `src/lib/legacyKeyMap.ts`** (add 4 entries)

Add legacy key mappings for the derived boolean keys so they are recognized by the resolver:
- `'loan_terms.amortized_partially': 'ln_p_amortizedPartially'`
- `'loan_terms.amortized': 'ln_p_amortized'`
- `'loan_terms.payment_monthly': 'ln_p_paymentMonthly'`
- `'loan_terms.payment_weekly': 'ln_p_paymentWeekly'`

### Editability
Native Word SDT checkboxes remain interactive in the generated DOCX — users can toggle them after generation. No additional work is needed for editability since the engine already preserves the SDT structure (it only updates `w14:checked` val and the display glyph).

### Validation
After implementation:
1. Set Amortization = "Amortized Partially" → generate Re851a → confirm "AMORTIZED PARTIALLY" checkbox is checked
2. Set Payment Frequency = "Monthly" → generate Re851a → confirm "MONTHLY" checkbox is checked
3. Open generated DOCX → confirm checkboxes can be toggled manually

