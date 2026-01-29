# Simplify Document Tag System: Use Field Keys Directly

## Status: ✅ COMPLETED

## Summary

The document generation system has been refactored to use `field_key` values directly from the Field Dictionary as document tags. This eliminates the need for mandatory merge tag aliases.

## What Changed

### New Behavior
- **Template tags like `{{Borrower.Address}}` now resolve directly** if `Borrower.Address` exists in the `field_dictionary` table
- **No alias required** for standard field keys
- **Case-insensitive matching** is supported
- **Underscore-to-dot conversion** is automatic (e.g., `{{Borrower_Address}}` → `Borrower.Address`)

### UI Changes
- **Removed**: Tag Mapping admin screen (`/admin/tag-mapping`)
- The Field Dictionary is now the single source of truth for document tags

### Files Modified
| File | Change |
|------|--------|
| `supabase/functions/_shared/field-resolver.ts` | Added `validFieldKeys` parameter for direct resolution |
| `supabase/functions/_shared/tag-parser.ts` | Pass `validFieldKeys` through to resolver |
| `supabase/functions/_shared/docx-processor.ts` | Accept and forward `validFieldKeys` |
| `supabase/functions/generate-document/index.ts` | Build `validFieldKeys` set from `field_dictionary` |
| `supabase/functions/validate-template/index.ts` | Same updates + clearer error messages |
| `src/App.tsx` | Removed Tag Mapping route |
| `src/components/layout/AppSidebar.tsx` | Removed Tag Mapping from navigation |
| `src/pages/admin/TagMappingPage.tsx` | **Deleted** |

### Resolution Priority
1. Check `merge_tag_aliases` for explicit override (legacy support)
2. Check if tag exists as `field_key` in `field_dictionary` (exact match)
3. Case-insensitive match against `field_dictionary`
4. Underscore-to-dot conversion match

### Backward Compatibility
The `merge_tag_aliases` table is retained for:
- Legacy templates using F-codes or non-standard naming
- Label-based replacement with `replaceNext` logic
- Explicit overrides when needed

But for new templates, simply use `{{field_key}}` directly from the Field Dictionary.

## How to Use

1. **Find the field key** in Admin → Field Dictionary (e.g., `Borrower.Name`)
2. **Use that exact key** in your DOCX template: `{{Borrower.Name}}`
3. **Generate document** - the value will be replaced automatically

No mapping configuration needed!
