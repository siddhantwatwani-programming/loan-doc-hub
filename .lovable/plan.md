

## Plan: Conditional Co-Borrower Section in Document Generation

### Analysis

The system **already supports** `{{#if field_key}}...{{/if}}` conditional blocks with entity-existence checks. The `isConditionTruthy` function in `tag-parser.ts` checks if any field with a given prefix has data. No new conditional logic is needed.

### What needs to change

**1. `supabase/functions/generate-document/index.ts`** — Auto-inject `has_co_borrower` boolean flag

After the existing auto-compute blocks (around line 242), add logic to:
- Scan `fieldValues` for any key starting with `co_borrower` or `coborrower` that has a non-empty value
- Set `fieldValues.set("has_co_borrower", { rawValue: "true"/"false", dataType: "boolean" })`
- This gives template authors a clean `{{#if has_co_borrower}}` tag to use

This is the **only code change** required. The conditional block processing, paragraph removal, and gap-free cleanup already work correctly.

### How to use in templates

Template authors wrap Co-Borrower sections with:
```
{{#if has_co_borrower}}
Co-Borrower Name: {{coborrower.first_name}} {{coborrower.last_name}}
Co-Borrower Address: {{coborrower.address}}
...signature block...
{{/if}}
```

When `has_co_borrower` is false, the entire block (including all XML paragraphs) is removed with no blank gaps.

### Files Modified

| File | Change |
|------|--------|
| `supabase/functions/generate-document/index.ts` | Add ~15 lines to auto-compute `has_co_borrower` from existing co-borrower field data |

### No changes to
- Database schema
- UI components
- Tag parser / conditional block logic
- Document formatting or layout
- Existing field mappings

