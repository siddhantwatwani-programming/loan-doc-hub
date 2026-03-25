

# Clean Up Corrupted Merge Tag Aliases and Orphaned Data

## Findings

After reviewing the database, two categories of accumulated edge cases were identified:

### 1. Corrupted `merge_tag_aliases` Entries (16 rows)

When templates were uploaded repeatedly, the validation process sometimes stored **raw XML fragments** as tag names instead of clean tag names. These rows have:
- `tag_name` values containing OOXML markup (e.g., `</w:t></w:r><w:proofErr...`)
- `field_key` values like `{{Arial}}` (nonsensical — pulled from font metadata in the XML)
- Or `field_key` values with double-wrapped curly braces like `{{Borrower.Name}}` (the engine expects `Borrower.Name`, not `{{Borrower.Name}}`)

These 16 rows are never matched during document generation (the parser would never produce XML-fragment tag names), but they add noise to alias lookups and slow down resolution.

**IDs to delete:**
`1047be94`, `1318c7af`, `1570df4e`, `1af88c93`, `5412f9d0`, `5c3cc5a0`, `60716fb1`, `77c42619`, `a2b0d023`, `a45d8b15`, `c30681f6`, `cd1df73b`, `da05550a`, `da414578`, `ff75c4e7` (and one more from the query — 16 total)

### 2. No Orphaned Templates to Remove

All 17 templates have been used for document generation. "Test Version-1" has 4 generations and is in a packet. The only template not in a packet is the RE885 (recently added), which is actively needed. No templates should be deleted.

## Changes

### Database Migration: Delete 16 corrupted `merge_tag_aliases` rows

A single migration that deletes all `merge_tag_aliases` rows where:
- `tag_name` contains raw XML (`LIKE '%</w:%'` OR `LIKE '%<w:%'`), OR
- `field_key = '{{Arial}}'`

```sql
DELETE FROM merge_tag_aliases
WHERE tag_name LIKE '%</w:%'
   OR tag_name LIKE '%<w:%'
   OR field_key = '{{Arial}}';
```

This removes exactly the 16 corrupted rows. All 151 legitimate aliases remain untouched.

### No Code Changes

No edge function code, UI components, or other files are modified. The tag parser and field resolver already handle valid aliases correctly — removing the corrupted rows simply eliminates dead weight from the lookup table.

