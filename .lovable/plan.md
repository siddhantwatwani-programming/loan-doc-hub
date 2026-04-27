## Implemented — RE851A Subordination Provision Yes/No fix (v3)

Root cause: the row-scoped SDT regex in `tag-parser.ts` used a lazy
`<w:sdt>...</w:sdt>` matcher that could span across the sibling Yes
checkbox while locating the No label, causing a single toggled block to
replace both checkboxes and leaving No stale.

Minimal fix:
- Introduced a single-SDT matcher with negative lookahead so each captured
  block is exactly one `<w:sdt>` checkbox:
  ```
  <w:sdt\b(?:(?!<w:sdt\b)[\s\S])*?</w:sdt>
  ```
- Used it in both `forceSdtBeforeWord` and `forceSdtAfterWord` inside the
  Subordination Provision row safety pass (anchored on
  "There are subordination provisions").
- All other RE851A logic (Balloon Payment, Investor Questionnaire, A/B
  broker capacity, glyph dedup, SDT conversion) is untouched.
- `generate-document` redeployed.

Template logic unchanged and remains valid:
- `{{#if ln_p_subordinationProvision}}☑{{else}}☐{{/if}} Yes`
- `{{#if ln_p_subordinationProvision}}☐{{else}}☑{{/if}} No`

Backend payload normalization unchanged (boolean republished under both
`ln_p_subordinationProvision` and `loan_terms.subordination_provision`,
accepting truthy variants `true/yes/y/1/checked/on`).
