

## Plan: Fix Re851a Part 3 Checkbox Mapping for Amortization & Payment Frequency

### Root Cause

The amortization dropdown in the UI stores values `"fully_amortized"` and `"partially_amortized"`, but the document generator compares against `"amortized"` and `"amortized partially"` — so the comparisons never match, and both checkboxes stay unchecked (☐).

Payment frequency values (`"monthly"`, `"weekly"`) already match correctly, but the amortization mismatch means the derive logic silently fails for those two checkboxes.

### Change (single file)

**File: `supabase/functions/generate-document/index.ts`** (~lines 738-740)

Update the amortization comparison strings to match the actual UI dropdown values:

- `"amortized partially"` → also match `"partially_amortized"` and `"partially amortized"`
- `"amortized"` → also match `"fully_amortized"` and `"fully amortized"`

Specifically, change the two boolean derivation lines to use inclusive checks:

```typescript
// Current (broken):
fieldValues.set("ln_p_amortizedPartially", { rawValue: amortVal === "amortized partially" ? "true" : "false", ... });
fieldValues.set("ln_p_amortized", { rawValue: amortVal === "amortized" ? "true" : "false", ... });

// Fixed:
fieldValues.set("ln_p_amortizedPartially", { 
  rawValue: ["partially_amortized", "partially amortized", "amortized partially"].includes(amortVal) ? "true" : "false", ... 
});
fieldValues.set("ln_p_amortized", { 
  rawValue: ["fully_amortized", "fully amortized", "amortized"].includes(amortVal) ? "true" : "false", ... 
});
```

### What is NOT changed
- No template modifications — the existing `{{ln_p_amortizedPartially}}` and `{{ln_p_amortized}}` merge tags stay as-is
- No label-based replacement changes
- No formatting, layout, font, or alignment changes
- No UI changes
- No database or schema changes
- Payment frequency logic remains unchanged (already works correctly)

### Why this fixes the formatting concern
The template already contains merge tags (`{{ln_p_amortizedPartially}}`, `{{ln_p_amortized}}`) that get replaced with `☑`/`☐` glyphs within existing `<w:t>` elements. This preserves the original Word XML run properties (fonts, alignment, spacing). The formatting issue the user sees is caused by the checkboxes being unchecked when they should be checked — not by any structural XML change.

