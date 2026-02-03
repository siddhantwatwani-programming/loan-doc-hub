
# Plan: Fix Missing Field Mappings for Assignment of Beneficiary Template

## Problem Analysis

After thorough investigation, I found **two distinct issues** with the Assignment of Beneficiary template:

### Issue 1: XML Fragmentation (Root Cause of Tag Not Populating)

The validation revealed that **8 merge tags are fragmented** in the DOCX file. Word has split these tags across multiple XML runs:

| Intended Tag | Issue |
|--------------|-------|
| `{{other.old_beneficiary_address}}` | Fragmented across XML runs |
| `{{other.new_beneficiary_address}}` | Fragmented across XML runs |
| `{{other.old_beneficiary_phone}}` | Fragmented across XML runs |
| `{{other.new_beneficiary_phone}}` | Fragmented across XML runs |
| `{{other.old_beneficiary_email}}` | Fragmented across XML runs |
| `{{other.new_beneficiary_email}}` | Fragmented across XML runs |
| `{{other.old_beneficiary_email_dtls_acct}}` | Fragmented across XML runs |
| `{{other.new_beneficiary_email_dtls_acct}}` | Fragmented across XML runs |

Example of what the parser sees:
```text
{{</w:t></w:r><w:r>other.old_beneficiary_address</w:t></w:r>}}
```

### Issue 2: Template Field Mappings Already Exist

All 8 fields ARE correctly mapped to the template in `template_field_maps`. The current mapping count is 23 fields.

---

## Current State

| Component | Status |
|-----------|--------|
| Fields in dictionary | 8/8 exist |
| Fields mapped to template | 8/8 mapped |
| Tags recognized by parser | 0/8 (fragmented) |
| Document generation works | No (tags remain unreplaced) |

---

## Solution

### Approach: Fix XML Normalization for Curly Brace Tags

The `normalizeWordXml()` function in `tag-parser.ts` currently handles fragmentation for chevron-style tags (`«»`) but NOT for curly brace tags (`{{}}`). We need to add normalization for curly brace merge tags.

### Code Changes

**File: `supabase/functions/_shared/tag-parser.ts`**

Add curly brace fragmentation handling to the `normalizeWordXml()` function:

```text
// Handle fragmented curly brace patterns {{...}}
// Word splits tags like {{field_key}} into {{</w:t></w:r><w:r>field_key</w:t></w:r>}}
const curlyFragmentedPattern = /\{\{((?:<[^>]*>|\s)*?)([A-Za-z0-9_.]+)((?:<[^>]*>|\s)*?)\}\}/g;
result = result.replace(curlyFragmentedPattern, (match, pre, fieldName, post) => {
  if (pre.includes("<") || post.includes("<")) {
    console.log(`[tag-parser] Found fragmented curly tag, consolidating: {{${fieldName}}}`);
  }
  return `{{${fieldName}}}`;
});
```

This pattern will:
1. Match curly brace tags that have XML elements between `{{` and `}}`
2. Extract the field name (alphanumeric + underscores + dots)
3. Replace the fragmented tag with a clean `{{field_name}}` version
4. Log when fragmentation is detected for debugging

---

## Technical Details

### How Fragmentation Occurs

When editing a Word document, if you format part of the merge tag (e.g., change font), Word creates separate "runs" (`<w:r>`) for each formatting change. This splits the tag in the underlying XML:

```xml
<!-- Clean tag -->
<w:t>{{other.old_beneficiary_address}}</w:t>

<!-- Fragmented tag (after editing) -->
<w:t>{{</w:t></w:r><w:r><w:t>other.old_beneficiary_address</w:t></w:r><w:r><w:t>}}</w:t>
```

### Prevention for Future Templates

When creating or editing templates, users should:
1. Type merge tags in one action without stopping
2. Apply formatting to the entire tag at once
3. Use the "Validate DOCX Tags" tool to check for fragmentation before using templates

---

## Files to Modify

| File | Change |
|------|--------|
| `supabase/functions/_shared/tag-parser.ts` | Add curly brace fragmentation normalization to `normalizeWordXml()` |

---

## Expected Outcome

After this change:
1. The 8 fragmented tags will be normalized during document generation
2. All 26 merge tags in the template will resolve correctly
3. Fields will populate with data from the deal
4. No database or UI changes needed
5. Fix applies to all templates with similar fragmentation issues
