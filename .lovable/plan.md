## Root cause confirmed

This is not a missing CSR field, wrong template key, or database persistence issue.

The value is reaching document generation, but the RE851A template structure is not being normalized correctly at render time. The current safety pass detects the Subordination Provision section, but it only normalizes one Yes/No label per Word paragraph. The live template can place both conditional rows in one Word paragraph/textbox or split the Handlebars control tags across runs/line breaks, leaving one side unresolved or leaving literal `{{#if ...}}` text visible.

## Evidence

Database / mapping evidence:

```text
field_dictionary:
field_key = ln_p_subordinationProvision
data_type = boolean
section = loan_terms
label = SUBORDINATION PROVISION
```

Current deal evidence for `81c791a4-d988-4afb-b902-d4b600e0c86e`:

```text
ln_p_subordinationProvision value_text = "false"
ln_p_balloonPaymen value_text = "true"
```

Generation log evidence:

```text
[generate-document] Sample field keys: ... ln_p_subordinationProvision, ln_p_balloonPaymen, ...
[generate-document] Derived ln_p_subordinationProvision from "false" (rawType=string): normalized=false
[tag-parser] Subordination Provision safety pass executed: isSubordination=false, windowLen=12000, sanitizedSdts=0, normalizedParas=1
```

This proves:

- `ln_p_subordinationProvision` is present in the generation payload.
- The value is normalized as a boolean-compatible string.
- The renderer finds the Subordination Provision section.
- The remaining failure is row rendering/Word XML normalization, not the UI checkbox or field mapping.

## Correct mapping/key reference

Use this relationship:

```text
CSR UI/internal key: loan_terms.subordination_provision
Document/template key: ln_p_subordinationProvision
```

The existing template condition is conceptually correct:

```text
{{#if ln_p_subordinationProvision}}☑{{else}}☐{{/if}} Yes
{{#if ln_p_subordinationProvision}}☐{{else}}☑{{/if}} No
```

No database schema change is needed.

## Fix plan

### 1. Keep all existing behavior unchanged

No changes to:

- CSR Loan Details UI
- database schema
- permissions
- Balloon Payment logic
- general checkbox logic
- template upload/document pipeline
- unrelated templates

### 2. Patch only the RE851A Subordination Provision safety pass

File:

```text
supabase/functions/_shared/tag-parser.ts
```

Inside the existing local window anchored to:

```text
There are subordination provisions
```

update the paragraph-scoped normalizer so it handles both of these current RE851A shapes:

```text
Shape A: separate paragraphs
☐ Yes
☑ No
```

```text
Shape B: same Word paragraph/textbox with line break
{{#if ln_p_subordinationProvision}}☑{{else}}☐{{/if}} Yes
{{#if ln_p_subordinationProvision}}☐{{else}}☑{{/if}} No
```

Implementation detail:

- Treat `Yes` and `No` independently within the same paragraph.
- Strip leftover Subordination-only Handlebars markers, including both simple and sub-expression forms.
- Remove only checkbox glyphs from the tight Yes/No checkbox cell/paragraph.
- Reinsert exactly one glyph before each label:

```text
checked=true  -> ☑ Yes, ☐ No
checked=false -> ☐ Yes, ☑ No
```

- Add guards so the replacement does not touch explanatory text like `If YES, explain here...`.
- Tighten the static-glyph helper patterns so they do not cross paragraph boundaries.

### 3. Add regression tests for the failing shape

File:

```text
supabase/functions/_shared/tag-parser.subordination.test.ts
```

Add/extend tests for:

1. Separate paragraph Yes/No rows.
2. Native Word checkbox rows.
3. Same-paragraph/same-textbox Yes + No rows, matching the uploaded screenshot shape.
4. Both boolean values:

```text
ln_p_subordinationProvision = "true"
Expected:  ☑ Yes / ☐ No

ln_p_subordinationProvision = "false"
Expected:  ☐ Yes / ☑ No
```

Also assert that rendered output does not contain leftover:

```text
{{#if
{{else}}
{{/if}}
```

### 4. Deploy only the document generation backend function

Redeploy:

```text
generate-document
```

No UI deployment or schema migration is required.

### 5. Verification after implementation

After approval, I will:

- Run the targeted Subordination Provision regression tests.
- Confirm logs still show the payload value and normalized boolean.
- Regenerate RE851A for the current unchecked case and confirm:

```text
CSR unchecked -> Yes ☐ and No ☑
```

For the checked case, I will prove it through the regression fixture unless you explicitly want the live deal value changed for an end-to-end checked regeneration.