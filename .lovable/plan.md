## Implemented — RE851A Subordination Provision Yes/No fix (v3, deep RCA)

### RCA findings (with evidence)
- CSR storage key is correct: UI uses `loan_terms.subordination_provision`; template tag is `ln_p_subordinationProvision`.
- Field dictionary entry exists: `id=e7be2147-6f7a-4295-b558-88216de7ae0b`, `data_type=boolean`, `section=loan_terms`.
- RE851A template field map exists: template `bb09b1c8-aead-4ec6-876e-15e3e54b3f38` → `ln_p_subordinationProvision`.
- For the current deal (`81c791a4-d988-4afb-b902-d4b600e0c86e`) the value is persisted in `deal_section_values.loan_terms.field_values[e7be2147-...]` as `value_text="true"` (string boolean, not native boolean). The backend already normalizes this to `true` and republishes the boolean under both `ln_p_subordinationProvision` and `loan_terms.subordination_provision` (see `generate-document/index.ts` lines 840–852).
- Edge logs confirm the field reaches the renderer (`ln_p_subordinationProvision` appears in the `Sample field keys` log) and `Resolved 95 field values for re851a`.
- Conditional evaluation (`isConditionTruthy`) correctly treats `"true"` as truthy.
- The template uses the supported `{{#if KEY}}☑{{else}}☐{{/if}} Yes` / `{{#if KEY}}☐{{else}}☑{{/if}} No` syntax; this engine does NOT evaluate sub-expression helpers like `{{#if (eq KEY true)}}…`, so the existing template syntax is the correct one to keep.

### Most likely remaining failure mode
RE851A places the Yes/No checkboxes in a separate right-hand table cell from the sentence "There are subordination provisions." When that right cell sits more than ~3000 chars after the sentence anchor (deeply nested table XML), the engine's row-scoped safety pass never reaches it, leaving any leftover static glyph or unconverted SDT untouched. Additionally, when the static glyph and the literal label "Yes"/"No" land in separate `<w:t>` runs, the existing run-local rewrites do not match.

### Minimal fix (no UI / schema / template changes)

In `supabase/functions/_shared/tag-parser.ts`, RE851A Subordination Provision safety pass:

1. Window expanded from 3000 → 8000 chars from the "There are subordination provisions" anchor so the right-cell Yes/No checkboxes are always reachable, while still strictly local to that row.
2. Added a fallback that rewrites a glyph immediately followed by intra-window XML and the literal label `<w:t>… Yes` or `<w:t>… No` (handles split-run authoring where the existing run-local matcher cannot see the label).
3. Added `console.log` lines that report:
   - The resolved raw value, type, and computed boolean.
   - Whether the safety pass was applied.

Nothing else in the engine, template logic, or other RE851A checkboxes was changed.

Edge function `generate-document` redeployed.

### Final supported template logic (kept as-is)

```handlebars
There are subordination provisions.

{{#if ln_p_subordinationProvision}}☑{{else}}☐{{/if}} Yes
{{#if ln_p_subordinationProvision}}☐{{else}}☑{{/if}} No
```

### Verification
Regenerate RE851A on the test deal and confirm:
- Checked CSR value → `☑ Yes`, `☐ No`.
- Unchecked CSR value → `☐ Yes`, `☑ No`.
- Edge logs print: `[tag-parser] RE851A Subordination Provision safety pass: rawValue="true" -> isChecked=true (Yes=☑, No=☐)` and `… safety pass applied (window=8000).`
