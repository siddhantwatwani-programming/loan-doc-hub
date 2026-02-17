

## Fix: Document Generation Field Data Not Populating

### Problem
The `generate-document` edge function fails to populate any merge tags because the field dictionary lookup query (`.in("id", allFieldDictIds)`) sends 415+ UUIDs in a single GET request URL. This exceeds the HTTP gateway URL length limit, causing a silent failure. The code does not check for query errors, so it proceeds with an empty field dictionary map, resulting in zero field values being resolved.

### Root Cause Details
- **Location**: `supabase/functions/generate-document/index.ts`, lines 131-134
- **Query**: `.from("field_dictionary").select(...).in("id", allFieldDictIds)` where `allFieldDictIds` contains 415 UUIDs
- **URL size**: 415 UUIDs x ~39 chars each = ~16KB URL query parameter
- **Missing error handling**: The `error` return from this query is never checked; `data` silently becomes `null`
- **Cascade**: Empty `allFieldDictMap` means the field value processing loop (lines 141-158) skips every entry, leaving `fieldValues` completely empty
- **Confirmation**: The log `[generate-document] Resolved X field values` never appears, confirming 0 values are resolved

### Fix (Single File Change)

**File**: `supabase/functions/generate-document/index.ts`

1. **Batch the `.in()` query** — Split `allFieldDictIds` into chunks of 100 and make multiple queries, merging results. This keeps each request URL well under any length limit.

2. **Add error handling** — Check the `error` return on the `deal_section_values` query (line 115) and the batched `field_dictionary` queries. Log errors and fail gracefully with a clear message.

3. **Add diagnostic logging** — Log `allFieldDictIds.length` and `allFieldDictMap.size` after the queries to make future debugging easier.

### Technical Implementation

```text
Lines 115-118: Add error check for deal_section_values query
  - Destructure { error: svError } alongside { data: sectionValues }
  - If svError, log it and set result.error

Lines 130-134: Replace single .in() with batched queries
  - Define BATCH_SIZE = 100
  - Loop through allFieldDictIds in chunks of BATCH_SIZE
  - For each chunk, query .in("id", chunk) with error checking
  - Merge all results into allFieldDictEntries array

Line 138: Add diagnostic log
  - Log allFieldDictIds.length and allFieldDictMap.size

Line 161: Already has logging (will now show actual count)
```

### What Will NOT Change
- No UI changes
- No database schema changes
- No changes to tag-parser, field-resolver, or docx-processor
- No changes to the template_field_maps or merge_tag_aliases
- No changes to any other edge function

