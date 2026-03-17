

## Problem Analysis

The document generation for broker fields has two distinct issues:

### Issue 1: `{{bk_p_brokerLicens}}` outputs `{{John Peterson` (wrong value + leftover braces)

**Root cause**: The broker contact lookup relies solely on `loan_terms.details_originating_vendor` containing a `BR-XXXXX` ID. If this field is empty or missing, the broker contact is never fetched from the `contacts` table. Meanwhile, deal_section_values may contain stale broker data from the old deal-based entry. Additionally, the `setIfEmpty` function never overrides existing values — so if the deal section has wrong data for `bk_p_brokerLicens` (e.g., the broker's name instead of the license), it persists.

The leftover `{{` suggests Word XML fragmentation where `{{` is in a separate run from the field code structure. The tag parser detects part of the tag but `{{` survives as literal text.

### Issue 2: `{{bk_p_firstName}} {{bk_p_lastName}}` — entire line missing

**Root cause**: If the broker contact is not found (no BR- ID detected), these fields remain empty. The tag parser's no-data cleanup removes the empty tags, which may also remove the entire paragraph including the label text "Broker's Representative:".

---

## Plan

### 1. Expand broker contact ID detection (`generate-document/index.ts`)

Currently only checks `loan_terms.details_originating_vendor`. Add fallback scans for:
- `bk_p_brokerId` field value (the deal's broker section stores the broker ID here)
- `broker.id` / `broker1.id` field values
- Scan all field values for any value matching the `BR-XXXXX` pattern

This ensures the broker contact is fetched from the `contacts` table even when `loan_terms.details_originating_vendor` is not populated.

### 2. Force-override broker fields from contact data (`generate-document/index.ts`)

Change the broker contact injection block to use a force-set function instead of `setIfEmpty` for broker-specific fields. Since the user states broker data has moved to Contacts, the contact data should take priority over any stale deal_section_values broker data.

Specifically, create a `forceSet` helper alongside `setIfEmpty` and use it when injecting broker contact fields (firstName, lastName, fullName, license, etc. under the `bk_p_*` and `broker.*` namespaces).

### 3. Fix broker license key resolution from contact_data (`generate-document/index.ts`)

The broker form saves the license field as `broker.License` → stripped to `License` in `contact_data`. The current code already checks `cd.License`. However, it should also check the `cd["License"]` key directly (capital L). Confirm and add `cd.license` (lowercase) as an additional fallback.

### 4. Clean up orphaned `{{` before replaced values (`tag-parser.ts`)

Add a targeted cleanup pass in the `replaceMergeTags` function after all tag replacements. This pass will detect and remove orphaned `{{` that appear immediately before (possibly with XML tags in between) a resolved value — these are artifacts of Word field code structures where `{{` was literal text preceding an instrText-based merge field.

Pattern: remove `{{` that are NOT followed by a closing `}}` within a reasonable distance (i.e., they are orphaned opening braces from a partially-fragmented tag).

### 5. Preserve label text for empty broker fields (`tag-parser.ts`)

The no-data tag cleanup currently removes empty placeholder tags. When a tag with no data is removed, if it leaves a label-only line (like "Broker's Representative:"), the label should be preserved with an empty value rather than having the entire line disappear.

Modify the no-data tag cleanup to replace empty tags with an empty string (already the behavior) but NOT remove the surrounding paragraph. The current code at lines 1090-1101 already does `result.split(tag.fullMatch).join('')` which should keep labels. The issue may be in the paragraph consolidation — if the entire paragraph text becomes just the label with no other content, it should still be preserved.

---

### Files Modified

| File | Change |
|------|--------|
| `supabase/functions/generate-document/index.ts` | Expand broker ID detection; force-override broker fields from contacts; add lowercase license fallback |
| `supabase/functions/_shared/tag-parser.ts` | Add orphaned `{{` cleanup pass after tag replacement |

### No Changes To

- Database schema
- UI components
- Template files
- Other edge functions
- Client-side code

