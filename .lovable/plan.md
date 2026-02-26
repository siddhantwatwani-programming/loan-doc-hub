

## Native Word SDT Checkbox Support

### Problem
The DOCX processor (`docx-processor.ts`) performs text-only XML replacement. It does not detect or modify Word Structured Document Tags (SDT) — the native checkbox controls inserted via Word's Developer tab. When a template contains an SDT checkbox with its **Tag** property set to a field key (e.g., `tax_exempt`), the checkbox state is not toggled based on the boolean database value.

### How Word SDT Checkboxes Work in XML

A checked checkbox in `word/document.xml` looks like:
```text
<w:sdt>
  <w:sdtPr>
    <w:tag w:val="tax_exempt"/>
    <w14:checkbox>
      <w14:checked w14:val="1"/>
    </w14:checkbox>
  </w:sdtPr>
  <w:sdtContent>
    <w:r><w:t>☒</w:t></w:r>
  </w:sdtContent>
</w:sdt>
```

To toggle it, two things must change:
1. `<w14:checked w14:val="1"/>` → `"0"` (or vice versa)
2. The display character inside `<w:t>` — typically `☒` ↔ `☐` (Unicode U+2612 / U+2610)

The `<w:tag w:val="..."/>` attribute is the mapping key that links the SDT to a database field.

### Changes

**File: `supabase/functions/_shared/tag-parser.ts`**

Add a new exported function `processSdtCheckboxes`:
- Takes XML content string, `fieldValues` map, `mergeTagMap`, and optional `validFieldKeys`
- Uses regex to find all `<w:sdt>` blocks containing `<w14:checkbox>`
- Extracts the `<w:tag w:val="..."/>` value from each SDT
- Resolves the tag value to a canonical field key using `resolveFieldKeyWithMap`
- Looks up the field value via `getFieldData`
- Evaluates as truthy (`true`, `1`, `yes`) or falsy
- If truthy: sets `w14:val="1"` on `<w14:checked>` and replaces the display character with `☒` (U+2612)
- If falsy: sets `w14:val="0"` and replaces display character with `☐` (U+2610)
- Also handles the `<w14:checkedState>` and `<w14:uncheckedState>` font references if present (preserves them)
- Returns the modified XML string

**File: `supabase/functions/_shared/tag-parser.ts` — `replaceMergeTags` function**

Add one call to `processSdtCheckboxes` after XML normalization but before merge tag parsing. This ensures SDT checkboxes are processed independently from text-based merge tags.

### What is NOT changed
- No changes to `docx-processor.ts`, `formatting.ts`, `field-resolver.ts`, `types.ts`, or `generate-document/index.ts`
- Existing text-based checkbox transforms (`{{field|checkbox}}` → ☑/☐) continue to work unchanged
- No database schema changes needed — uses existing `fieldValues` map

### Template Setup
1. In Word, go to Developer tab → Insert Content Control → Check Box
2. Click the checkbox, then click **Properties** in the Developer tab
3. Set the **Tag** field to the database field key (e.g., `tax_exempt`)
4. Save and upload the template
5. The generation engine will automatically toggle the checkbox based on the boolean value

