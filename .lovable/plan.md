

## Plan: Fix Re851a Checkbox Labels Not Getting Checked

### Root Cause

The engine derives the correct boolean values (`ln_p_amortizedPartially`, `ln_p_amortized`, `ln_p_paymentMonthly`, `ln_p_paymentWeekly`) at lines 736-747 of `generate-document/index.ts`. However, the Re851a template uses **static checkbox glyphs** (☐ followed by label text like "AMORTIZED PARTIALLY"), and the label-based replacement mechanism (`replaceStaticCheckboxLabel`) only processes labels that are registered in the `merge_tag_aliases` table with `tag_type = 'label'`.

Currently, **no `merge_tag_aliases` entries exist** for these checkbox labels. Without them, the engine never matches the checkbox glyphs to the boolean field values, so they remain unchecked (☐) in the output.

### Fix

**Database migration** — INSERT 4 rows into `merge_tag_aliases`:

| tag_name | field_key | tag_type | is_active |
|---|---|---|---|
| `AMORTIZED PARTIALLY` | `ln_p_amortizedPartially` | `label` | `true` |
| `AMORTIZED` | `ln_p_amortized` | `label` | `true` |
| `MONTHLY` | `ln_p_paymentMonthly` | `label` | `true` |
| `WEEKLY` | `ln_p_paymentWeekly` | `label` | `true` |

These entries tell the label-based replacement engine to:
1. Find `☐ AMORTIZED PARTIALLY` in the template XML
2. Look up `ln_p_amortizedPartially` in `fieldValues`
3. If `true`, replace `☐` with `☑`; if `false`, keep `☐`

### How It Works (already implemented)

```text
Dropdown selected → Edge function derives boolean (line 739) →
labelMap loaded from merge_tag_aliases → replaceStaticCheckboxLabel
matches "☐ AMORTIZED PARTIALLY" → replaces glyph with ☑
```

### No Code Changes Required

The edge function logic (lines 736-747) and the static checkbox replacement mechanism are already fully functional. Only the database mapping entries are missing.

### Files Changed

| File | Change |
|---|---|
| Database migration | INSERT 4 rows into `merge_tag_aliases` |

