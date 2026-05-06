## RE851D – Multiple Properties Yes/No Checkbox

### Edge function publisher
File: `supabase/functions/generate-document/index.ts`

Inside the existing RE851D template-gated block (`if (/851d/i.test(template.name || ""))`), immediately after `sortedPropIndices` is computed (line 924), insert:

```ts
// ── RE851D: Multiple Properties Yes/No checkboxes ──
// YES if >1 property, NO if exactly 1.
{
  const isMultiple = sortedPropIndices.length > 1;
  const isSingle   = sortedPropIndices.length === 1;
  const base = "pr_p_multipleProperties";
  fieldValues.set(`${base}_yes`,       { rawValue: isMultiple ? "true" : "false", dataType: "boolean" });
  fieldValues.set(`${base}_no`,        { rawValue: isSingle   ? "true" : "false", dataType: "boolean" });
  fieldValues.set(`${base}_yes_glyph`, { rawValue: isMultiple ? "☒" : "☐",       dataType: "text" });
  fieldValues.set(`${base}_no_glyph`,  { rawValue: isSingle   ? "☒" : "☐",       dataType: "text" });
}
```

These are global (not per-property `_N`) tags, so no entry is needed in `RE851D_INDEXED_TAGS`.

### Field dictionary entries (migration)
Insert four rows (idempotent, `ON CONFLICT (field_key) DO NOTHING`), section `property`:

| field_key | label | data_type |
|---|---|---|
| `pr_p_multipleProperties_yes` | Multiple Properties – YES | boolean |
| `pr_p_multipleProperties_no` | Multiple Properties – NO | boolean |
| `pr_p_multipleProperties_yes_glyph` | Multiple Properties – YES Glyph | text |
| `pr_p_multipleProperties_no_glyph` | Multiple Properties – NO Glyph | text |

### Template tag mapping (to author into RE851D `.docx`)
Glyph approach (recommended, mirrors other RE851D pairs):
```
{{pr_p_multipleProperties_yes_glyph}} YES   {{pr_p_multipleProperties_no_glyph}} NO
```
Conditional alternative:
```
{{#if pr_p_multipleProperties_yes}}☒{{else}}☐{{/if}} YES
{{#if pr_p_multipleProperties_no}}☒{{else}}☐{{/if}} NO
```

### Acceptance
- 2+ properties → YES `☒`, NO `☐`
- 1 property → YES `☐`, NO `☒`
- 0 properties → both unchecked
- No other RE851D logic, schema, UI, or template-generation flow modified

### Memory
Add `mem://features/document-generation/re851d-multiple-properties-checkbox` describing the publisher and dictionary keys.

### Files modified
- `supabase/functions/generate-document/index.ts` (insert ~12 lines after line 924)
- `supabase/migrations/<new>.sql` (4 dictionary inserts)
