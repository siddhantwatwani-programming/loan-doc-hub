## RCA findings already verified

- The CSR field is stored and mapped correctly for deal `DL-2026-0219`.
- Backend field dictionary entry exists exactly as:
  - `field_key`: `ln_p_subordinationProvision`
  - `data_type`: `boolean`
  - `label`: `SUBORDINATION PROVISION`
  - `section`: `loan_terms`
  - `form_type`: `details`
- The RE851A template field map points to the same exact key: `ln_p_subordinationProvision`.
- No plural-key mismatch was found: `ln_p_subordinationProvisions` does not exist.
- The current deal value is present in stored deal data as:
  ```text
  section: loan_terms
  field: ln_p_subordinationProvision
  stored value: value_text = "true"
  ```
- Recent document-generation logs confirm the payload contains the key:
  ```text
  Sample field keys: ..., ln_p_subordinationProvision, ln_p_balloonPaymen, ...
  ```
- The field is not missing, not nested under an unexpected object, and not blocked by document-generation caching for the current generated document.
- The existing conditional evaluator already treats string values safely:
  - `"true"`, `"yes"`, `"1"`, `"checked"`, `"on"` => true
  - `"false"`, `"no"`, `"0"`, `"unchecked"`, `"off"` => false

## Root cause

The failing part is not the CSR save, the field key, or the basic boolean conversion. The failure is in the RE851A-specific native Word checkbox safety pass for the row containing:

```text
There are subordination provisions.
```

That row contains two native Word checkbox controls near `Yes` and `No`. The current safety pass uses a broad SDT matcher like this conceptually:

```ts
(<w:sdt ... </w:sdt>) ... Yes/No
```

Because the SDT block matcher can span across more than one `<w:sdt>` checkbox when searching for the `No` label, the `No` pass can accidentally capture the `Yes` checkbox plus the `No` checkbox together, then toggle only the first checkbox inside that captured block. Result: the `Yes` checkbox can be toggled twice, while the `No` checkbox remains stale/unchecked.

This explains the observed output where the CSR value is true but the generated RE851A still shows unchecked boxes.

## Minimal fix to implement

Only update the RE851A Subordination Provision safety pass in:

```text
supabase/functions/_shared/tag-parser.ts
```

No UI, database schema, APIs, template structure, permissions, document templates, or unrelated checkbox logic will be changed.

### Code-level fix

Replace the broad SDT matching inside the Subordination Provision row pass with a single-SDT matcher that cannot cross into another checkbox:

```ts
const singleSdtCheckboxPattern = `<w:sdt\\b(?:(?!<w:sdt\\b)[\\s\\S])*?<\\/w:sdt>`;
```

Then use that pattern for both orientations:

```ts
// Checkbox before label: [checkbox] Yes / [checkbox] No
const sdtBeforeWord = new RegExp(
  `(${singleSdtCheckboxPattern})((?:\\s|<[^>]+>)*?\\b${word}\\b)`,
  "g"
);

// Checkbox after label: Yes [checkbox] / No [checkbox]
const sdtAfterWord = new RegExp(
  `(\\b${word}\\b)((?:\\s|<[^>]+>)*?)(${singleSdtCheckboxPattern})`,
  "g"
);
```

Keep the existing `toggleSdtBlock()` behavior, which updates both:

```ts
<w14:checked w14:val="1|0"/>
```

and the visible glyph:

```text
☑ / ☐
```

## Final working template logic

The template logic itself is valid and can remain:

```handlebars
There are subordination provisions.
{{#if ln_p_subordinationProvision}}☑{{else}}☐{{/if}} Yes
{{#if ln_p_subordinationProvision}}☐{{else}}☑{{/if}} No
```

If the template is edited later to use explicit equality, that is also compatible, but the minimal fix is backend row targeting, not a template rewrite.

## Testing after patch

1. Run a local parser test with a synthetic RE851A row containing two native Word SDT checkboxes:
   - Case A: `ln_p_subordinationProvision = "true"`
     - Expected: Yes `w14:val="1"` / visible `☑`
     - Expected: No `w14:val="0"` / visible `☐`
   - Case B: `ln_p_subordinationProvision = "false"`
     - Expected: Yes `w14:val="0"` / visible `☐`
     - Expected: No `w14:val="1"` / visible `☑`

2. Regenerate RE851A for the current checked deal and confirm the output row shows:

```text
☑ Yes
☐ No
```

3. Validate from logs that the field remains present in the payload and resolves from `ln_p_subordinationProvision`.

## Scope guard

This fix will be limited to the local RE851A row-scoped block anchored on:

```text
There are subordination provisions
```

No other checkbox rows, Balloon Payment logic, Investor Questionnaire logic, document engine-wide checkbox conversion, UI fields, mappings, or templates will be modified.