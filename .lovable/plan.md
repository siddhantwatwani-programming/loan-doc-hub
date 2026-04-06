

## Deep Analysis: Re851a Checkbox Issue

### Current State

**Derivation logic (generate-document/index.ts lines 736-747)**: Working correctly. It reads `ln_p_amortiza` and `ln_p_paymentFreque` dropdown values and derives boolean keys:
- `ln_p_amortizedPartially` = true/false
- `ln_p_amortized` = true/false  
- `ln_p_paymentMonthly` = true/false
- `ln_p_paymentWeekly` = true/false

**Payment Frequency**: Working via merge tags. The template contains `{{ln_p_paymentMonthly}}` and `{{ln_p_paymentWeekly}}` as merge tags, and the engine replaces them with ☑/☐. Logs confirm: `ln_p_paymentMonthly = "☑"`, `ln_p_paymentWeekly = "☐"`.

**Amortization**: NOT working. The template does NOT contain `{{ln_p_amortized}}` or `{{ln_p_amortizedPartially}}` as merge tags — they never appear in the logs. The template uses static checkbox characters (☐) next to text labels "FULLY AMORTIZED" and "AMORTIZED PARTIALLY", which require label-based replacement.

**Label aliases**: All 4 label aliases in `merge_tag_aliases` are currently **deactivated** (`is_active = false`) from a previous fix. This means:
- Payment Frequency labels (MONTHLY, WEEKLY): Deactivated, but doesn't matter because the template uses merge tags for these.
- Amortization labels (FULLY AMORTIZED, AMORTIZED PARTIALLY): Deactivated, and this IS the problem — there's no other mechanism to check these checkboxes.

### Root Cause (Two Issues)

**Issue 1 — Amortization checkboxes not being checked**: The label aliases are deactivated, and the template has no merge tags for these fields. Nothing in the engine can toggle them.

**Issue 2 — Formatting corruption when label replacement was active**: The `replaceStaticCheckboxLabel` function replaces the checkbox glyph character inside an XML run that likely uses a specific font (e.g., MS Gothic, Wingdings). Inserting a Unicode ☑ into a run styled with a symbol font causes rendering issues — wrong glyph display, shifted alignment, or broken layout.

### Proposed Fix

**1. Re-activate the amortization label aliases only**

Run a migration to set `is_active = true` for just:
- `FULLY AMORTIZED` → `ln_p_amortized`
- `AMORTIZED PARTIALLY` → `ln_p_amortizedPartially`

Keep MONTHLY and WEEKLY deactivated (they work via merge tags already).

**2. Fix `replaceStaticCheckboxLabel` to preserve XML font formatting**

The current replacement blindly swaps the glyph character, ignoring that it sits inside a `<w:r>` with specific `<w:rPr>` font properties. The fix: instead of just replacing the character, also ensure the replacement character is compatible with the run's font. Specifically, modify the function to:

- Detect if the glyph is inside a run with a symbol font (MS Gothic, Wingdings, etc.)
- Use the font-appropriate checked/unchecked character
- Or better: only replace the glyph character itself within the same `<w:t>` element, without touching any surrounding XML structure

The current regex `([☐☑☒])((?:\\s|<[^>]+>)*)(LABEL)` captures the glyph AND everything between it and the label. The replacement `${checkboxValue}${spacing}${labelText}` reconstructs this correctly, but the issue is that `checkboxValue` (☑ or ☐) may be a different byte-length than the original character, and the regex may be matching across XML run boundaries.

A safer approach: narrow the regex to only replace the single checkbox character within its `<w:t>` element, without spanning into the label's run. Pattern: find `<w:t>` containing ☐/☑/☒ that is followed (possibly with intervening XML) by the label text, and only replace the character inside that `<w:t>`.

### Files Changed

| Target | Change |
|---|---|
| Database migration | Re-activate `FULLY AMORTIZED` and `AMORTIZED PARTIALLY` label aliases |
| `supabase/functions/_shared/tag-parser.ts` | Fix `replaceStaticCheckboxLabel` to only swap the glyph character within its `<w:t>` element, preserving all surrounding XML/font formatting |

### What Does NOT Change
- No UI changes
- No template changes
- No schema changes
- No changes to derivation logic
- No changes to Payment Frequency handling (already working via merge tags)
- No changes to any other document template

