

## Problem

The foreign key constraint `generated_documents_template_id_fkey` prevents deleting a template when `generated_documents` rows reference it. This is expected database behavior to preserve referential integrity.

## Fix

**File: `src/pages/admin/TemplateManagementPage.tsx`** — Update `handleDelete` to delete associated `generated_documents` rows before deleting the template.

Before the existing `supabase.from('templates').delete()` call, add:

```typescript
// Delete associated generated_documents that reference this template
const { error: genDocsError } = await supabase
  .from('generated_documents')
  .delete()
  .eq('template_id', template.id);

if (genDocsError) throw genDocsError;

// Also delete any template_field_maps referencing this template
const { error: fieldMapsError } = await supabase
  .from('template_field_maps')
  .delete()
  .eq('template_id', template.id);

if (fieldMapsError) throw fieldMapsError;
```

Also delete associated `generation_jobs`:

```typescript
const { error: jobsError } = await supabase
  .from('generation_jobs')
  .delete()
  .eq('template_id', template.id);

if (jobsError) throw jobsError;
```

### Files Modified
| File | Change |
|------|--------|
| `src/pages/admin/TemplateManagementPage.tsx` | Delete dependent rows from `generated_documents`, `generation_jobs`, and `template_field_maps` before deleting the template |

