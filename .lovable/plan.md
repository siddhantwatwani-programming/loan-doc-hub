## Root cause found

The CSR field is saved correctly as a boolean field in the backend:

- Field dictionary key: `ln_p_subordinationProvision`
- Data type: `boolean`
- Saved value examples: `value_text = "true"`

The previous alias-only fix is present, but the live RE851A output still shows the Yes/No checkboxes not reflecting the saved value. The screenshot shows this row is authored as a normal document row with static checkbox glyphs near the label text:

```text
There are subordination provisions.  ☐ Yes
                                      ☐ No
```

This means the failure is not only a key lookup issue. The live template can leave stale/static glyphs in place after the conditional pass, or the conditional may be fragmented in Word XML in a way that is not reliably handled by the generic checkbox logic.

## Minimal scoped fix

Make a RE851A-only safety pass for this exact row, similar in concept to the existing broker-capacity A/B safety pass, but strictly scoped to the literal Subordination Provision row labels.

### 1. Keep the existing template condition

No DOCX template edit is required. The corrected/confirmed Handlebars logic remains:

```handlebars
{{#if ln_p_subordinationProvision}}☑{{else}}☐{{/if}} Yes
{{#if ln_p_subordinationProvision}}☐{{else}}☑{{/if}} No
```

### 2. Normalize the source value in document generation

In `supabase/functions/generate-document/index.ts`, add a small derived-key block near the existing RE851A checkbox derivations. It will read the value from all known equivalent keys and republish the normalized boolean under both names:

```ts
const subordinationRaw = (
  fieldValues.get("ln_p_subordinationProvision")?.rawValue ??
  fieldValues.get("loan_terms.subordination_provision")?.rawValue ??
  ""
).toString().trim().toLowerCase();

const subordinationTrue = ["true", "yes", "y", "1", "checked", "on"].includes(subordinationRaw);

fieldValues.set("ln_p_subordinationProvision", {
  rawValue: subordinationTrue ? "true" : "false",
  dataType: "boolean",
});
fieldValues.set("loan_terms.subordination_provision", {
  rawValue: subordinationTrue ? "true" : "false",
  dataType: "boolean",
});
```

This ensures the RE851A payload always contains the template key even if data arrives through the CSR persistence key.

### 3. Add a row-scoped final safety pass only for this RE851A line

In `supabase/functions/_shared/tag-parser.ts`, after conditional/label replacement and before converting glyphs to native Word checkboxes, add a narrowly-scoped pass that:

- Reads `ln_p_subordinationProvision` / `loan_terms.subordination_provision`.
- Forces the glyph immediately associated with `Yes` to `☑` when true and `☐` when false.
- Forces the glyph immediately associated with `No` to `☐` when true and `☑` when false.
- Only runs inside a local XML window containing the literal text `There are subordination provisions`.
- Does not affect any other Yes/No checkbox pairs in RE851A.

Expected final behavior:

```text
CSR checked     ->  ☑ Yes   ☐ No
CSR unchecked   ->  ☐ Yes   ☑ No
```

## What will not be changed

- No UI changes.
- No database schema or permissions changes.
- No document template upload/replacement.
- No broad document generation refactor.
- No changes to unrelated RE851A checkbox logic.
- No changes to other templates.

## Verification

After implementation, verify the generated XML logic against both states:

1. With Subordination Provision saved as `true`, the RE851A row renders `☑ Yes` and `☐ No`.
2. With Subordination Provision saved as `false`/missing, the RE851A row renders `☐ Yes` and `☑ No`.
3. Confirm existing broker-capacity and balloon-payment checkbox handling remains untouched.