

# Plan: Fix Unpopulated Fields in Agency Disclosure Document

## Root Cause Analysis

### Issue 1: `{{bk_p_brokerLicens}}` showing wrong data ("Apurv Verma")
### Issue 2: `{{bk_p_firstName}} {{bk_p_lastName}}` not populating for "Broker's Representative"

**Both issues share the same root cause**: The `hasFragmentedDelimiters` gate in `consolidateFragmentedTagsInParagraphs` (tag-parser.ts, lines 356-373) is too restrictive.

When Word splits a tag like `{{bk_p_brokerLicens}}` across multiple `<w:t>` elements — e.g., `<w:t>{{bk_p_broker</w:t>` and `<w:t>Licens}}</w:t>` — the `{{` and `}}` delimiters are each intact in their own runs. The `hasFragmentedDelimiters` check strips `{{` and `}}` from each run and looks for leftover single `{` or `}`. Finding none, it concludes delimiters are NOT fragmented and **skips consolidation**, even though the field NAME is split across runs and the tag cannot be parsed.

This means:
- `bk_p_brokerLicens` is never detected as a merge tag → never replaced with its actual value (1478)
- The template likely has a Word MERGEFIELD with display text "Apurv Verma" (from a previous mail merge) that remains because the flattening also fails on the fragmented instruction
- `bk_p_firstName` and `bk_p_lastName` on the "Broker's Representative" line are similarly fragmented → not consolidated → not replaced at that location

**Secondary issue**: `bk_p_brokerLicens` has `data_type: "number"` and value `1478`. Even after fixing detection, `formatByDataType` would format it as "1,478" (with comma). License numbers should not be comma-formatted.

## Implementation

### Change 1: Remove `hasFragmentedDelimiters` gate (tag-parser.ts, lines 356-373)

The existing `allTagsComplete === false` check (line 354 returns early if true) already confirms tags ARE fragmented across runs. The additional `hasFragmentedDelimiters` gate is redundant and blocks valid consolidation. Remove it so any paragraph with confirmed cross-run fragmentation gets consolidated.

```typescript
// REMOVE lines 356-373 entirely (the hasFragmentedDelimiters block)
// After line 354, flow proceeds directly to consolidation at line 375+
```

### Change 2: Add license/ID fields to text-override (generate-document/index.ts, lines 216-224)

Extend the identifier detection to include license-related field keys so they aren't comma-formatted:

```typescript
if (lk.includes("loannumber") || lk.includes("loan_number") || 
    lk.includes("accountnumber") || lk.includes("account_number") ||
    lk.includes("licensenumber") || lk.includes("license_number") ||
    lk.includes("brokerlicens") || lk.includes("brokerid")) {
```

## What This Does NOT Change
- No UI/component changes
- No database/schema changes
- No template file changes
- No changes to regex-based consolidation, label replacement, or field resolution
- Existing formatting logic unchanged except for the license field override

