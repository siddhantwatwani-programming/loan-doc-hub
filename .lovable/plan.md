## Findings from the deep analysis

The CSR value is present and saved correctly:

```text
Field key: ln_p_subordinationProvision
Data type: boolean
Current deal value: value_text = "true"
```

The correct RE851A Handlebars condition should be:

```handlebars
{{#if ln_p_subordinationProvision}}☑{{else}}☐{{/if}} Yes
{{#if ln_p_subordinationProvision}}☐{{else}}☑{{/if}} No
```

I also found the likely remaining causes of the bad output:

1. The RE851A template mapping table does not currently include `ln_p_subordinationProvision`, so I will add that missing mapping entry for RE851A only.
2. The visible row appears to use Word checkbox controls/static checkbox glyphs. The current safety pass only handles some glyph shapes and does not reliably toggle native Word checkbox state (`w14:checked`) when the checkbox is an SDT/control. That can leave both boxes visually unchecked even when the data is true.

## Plan

### 1. Add the missing RE851A mapping entry only

Add a single missing mapping record linking the RE851A template to the existing field dictionary row:

```text
Template: re851a
Field: ln_p_subordinationProvision
Data type: boolean
Label: SUBORDINATION PROVISION
```

This is a configuration/data fix only. No database schema, permissions, UI, API, or template file replacement will be changed.

### 2. Keep the corrected template condition on the correct key

Confirm the RE851A condition uses the singular key:

```handlebars
{{#if ln_p_subordinationProvision}}☑{{else}}☐{{/if}} Yes
{{#if ln_p_subordinationProvision}}☐{{else}}☑{{/if}} No
```

The generation layer will continue accepting the equivalent persisted path `loan_terms.subordination_provision`, but the document condition should reference `ln_p_subordinationProvision`.

### 3. Make the existing RE851A row safety pass handle Word checkbox controls

Update only the Subordination Provision safety pass in `supabase/functions/_shared/tag-parser.ts` so it is strictly scoped to the row containing:

```text
There are subordination provisions.
```

Within that row only, force:

```text
CSR checked   -> ☑ Yes   ☐ No
CSR unchecked -> ☐ Yes   ☑ No
```

The pass will support both cases:

- Plain/static glyphs: `☐`, `☑`, `☒`
- Native Word checkbox controls: update both the visible glyph and the internal checked state

No other Yes/No checkbox logic in RE851A will be touched.

### 4. Keep the existing value normalization, with a narrow alias fallback

Preserve the current normalization in `generate-document/index.ts` that republishes the boolean under both:

```text
ln_p_subordinationProvision
loan_terms.subordination_provision
```

If needed, add only narrow aliases for this one field so typo/path variants cannot break this row, without affecting unrelated checkboxes.

### 5. Verify both states without changing unrelated behavior

After implementation, verify with a small controlled document-processing fixture for both boolean values:

```text
true  -> ☑ Yes / ☐ No
false -> ☐ Yes / ☑ No
```

Also confirm the current deal’s saved value (`true`) is included in the generation payload and that the generated RE851A XML contains the correct checkbox state for the Subordination Provision row.

## What will not change

- No UI changes
- No layout or component changes
- No API refactor
- No database schema or permission changes
- No document template upload/replacement unless the stored template is proven to contain the wrong key
- No changes to unrelated RE851A checkbox logic