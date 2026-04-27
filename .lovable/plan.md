## Findings so far

### Exact root cause
This is not a CSR UI persistence failure. The current deal stores the Subordination Provision value correctly, and the generation payload includes it.

The failure is in the RE851A rendering path for this specific row:

1. The CSR UI field uses the UI key `loan_terms.subordination_provision`, which is translated to the document/dictionary key `ln_p_subordinationProvision`.
2. The saved value is a string boolean (`"true"` / `"false"`), not a native boolean. The current conditional evaluator already handles string booleans correctly.
3. The RE851A uploaded template now contains both normal Handlebars-style text checkbox logic and/or native Word checkbox structures around the same Subordination Provision row. The native Word checkbox structures are tagless and can contain malformed run-property glyph text (`<w:rPr>☑</w:rPr>`), so the normal merge-tag conditional path alone is not reliable for this row.
4. The existing safety pass is anchored to `There are subordination provisions`, but the latest runtime log shows `sanitizedSdts=0`, meaning it did not detect/touch any native checkbox SDTs in the current template window. Therefore, if the template row is using native Word checkbox controls or malformed split markup, those controls remain in their template default state even though the payload value is correct.

### Evidence gathered

Database field dictionary:
```text
field_key: ln_p_subordinationProvision
label: SUBORDINATION PROVISION
data_type: boolean
section: loan_terms
```

Current deal value (`81c791a4-d988-4afb-b902-d4b600e0c86e`):
```text
ln_p_subordinationProvision stored value_text: "true"
ln_p_balloonPaymen stored value_text: "true"
```

UI mapping:
```text
LoanTermsDetailsForm uses FIELD_KEYS.subordinationProvision
FIELD_KEYS.subordinationProvision = loan_terms.subordination_provision
legacyKeyMap maps loan_terms.subordination_provision -> ln_p_subordinationProvision
```

Generation log evidence:
```text
[generate-document] Derived ln_p_subordinationProvision from "true" (rawType=string): normalized=true
[tag-parser] Subordination Provision safety pass executed: isSubordination=true, windowLen=12000, sanitizedSdts=0
```

This proves:
- the payload contains the value,
- the value normalizes to checked/true,
- the issue is not Balloon Payment,
- the remaining problem is the RE851A row-specific rendering/toggling pass not reliably replacing the final Yes/No output for the actual current template structure.

## Scoped fix plan

### 1. Keep the existing CSR UI and mappings unchanged
No changes to Loan Details UI, database schema, field dictionary, permissions, Balloon Payment logic, or general checkbox logic.

### 2. Harden only the RE851A Subordination Provision safety pass
File: `supabase/functions/_shared/tag-parser.ts`

Within the existing block already scoped to the anchor text `There are subordination provisions`:

- Resolve `ln_p_subordinationProvision` / `loan_terms.subordination_provision` as a strict boolean using the same inclusive value handling already present.
- Compute final expected glyphs:
  - checked/true: `Yes = ☑`, `No = ☐`
  - unchecked/false: `Yes = ☐`, `No = ☑`
- Apply a local replacement only inside the anchored section window, not document-wide.
- Support all current template shapes in that local window:
  1. clean text conditionals like `{{#if ln_p_subordinationProvision}}☑{{else}}☐{{/if}} Yes`,
  2. split Word XML conditionals,
  3. static glyphs adjacent to `Yes` / `No`,
  4. native Word SDT checkboxes adjacent to `Yes` / `No`,
  5. malformed SDT run-property glyph text by stripping only bare text inside checkbox `<w:rPr>` blocks while preserving formatting tags.
- Tighten the SDT/glyph label matching so it cannot cross paragraph boundaries or sibling checkbox blocks.

### 3. Add a regression fixture for both expected cases
File: `supabase/functions/_shared/tag-parser.subordination.test.ts`

Extend the existing test so it verifies both template shapes:

- native Word checkbox (`<w:sdt><w14:checkbox>...`) before `Yes` / `No`, including malformed `<w:rPr>☑</w:rPr>` text,
- clean Handlebars text checkbox conditionals using `ln_p_subordinationProvision`.

Assertions for checked:
```text
Yes: ☑ / w14:checked="1"
No:  ☐ / w14:checked="0"
```

Assertions for unchecked:
```text
Yes: ☐ / w14:checked="0"
No:  ☑ / w14:checked="1"
```

Also assert no stray checkbox glyph text remains inside checkbox `<w:rPr>` blocks.

### 4. Redeploy only the document generation backend function
Redeploy `generate-document` so the shared tag-parser change is live.

### 5. Verification after implementation
After approval, I will run the targeted regression test and confirm the latest logs. If permitted by available tooling, I will also regenerate RE851A once with the current checked value and inspect the generated DOCX XML/output. For the unchecked proof, I will use the regression fixture to avoid modifying the user’s current deal data unless you explicitly request a live unchecked regeneration.

## Final deliverable after implementation
I will report:

- root cause: rendering/template-structure handling, not missing mapping,
- evidence: saved field value + generation log + code mapping,
- exact corrected mapping/key reference:
  - UI: `loan_terms.subordination_provision`
  - document/template context: `ln_p_subordinationProvision`
- final fix: row-scoped RE851A rendering correction in `tag-parser.ts`,
- proof for both checked and unchecked outcomes.