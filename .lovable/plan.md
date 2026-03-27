

## Problem

The template placeholder `{{br_ag_fullName}}` is not populating because:

1. `br_ag_fullName` exists in `field_dictionary` (id: `041611a1-28a6-41f2-bd8c-19ccf106f768`) but has **no `canonical_key`** set
2. The actual guarantor data is stored under field key `br_p_guarantoFullName` (id: `b092c126-af2e-40d3-b8f9-1ffa15ac49e8`)
3. No `field_key_migrations` or `merge_tag_aliases` entry bridges these two keys
4. During document generation, the field resolver cannot find any data for `br_ag_fullName` because there's no mapping to the actual data key

## Fix

**Set the `canonical_key`** on the `br_ag_fullName` field dictionary entry to point to `br_p_guarantoFullName`. This is the standard mechanism the field resolver already uses to resolve alternative keys to the correct data source.

### Database Migration

```sql
UPDATE field_dictionary
SET canonical_key = 'br_p_guarantoFullName'
WHERE field_key = 'br_ag_fullName';
```

This single update enables the existing resolution chain in `field-resolver.ts` (`resolveFieldKeyWithBackwardCompat` → canonical key lookup) to automatically resolve `{{br_ag_fullName}}` to `br_p_guarantoFullName` during document generation.

### No code changes required
The field resolver already handles canonical_key resolution. Only the data mapping is missing.

### Files Changed
- Database migration only (1 SQL statement)

### No Changes To
- Edge function code
- Frontend code
- Template files
- Any other field mappings

