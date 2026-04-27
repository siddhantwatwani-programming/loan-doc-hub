## Root Cause (deep analysis of the v7 docx you uploaded)

I unzipped `re851a_v7.docx` and inspected `word/document.xml` directly. Two distinct bugs are stacking on top of each other in the Subordination Provision row.

### Bug 1 — The TEMPLATE itself is malformed at the Subordination Provision checkboxes

The RE851A template does NOT actually use `{{#if ln_p_subordinationProvision}}☑{{else}}☐{{/if}}` for these two boxes. It uses native Word `<w:sdt>` checkboxes, but the author accidentally typed a literal `☑` glyph inside the run-property containers. The XML in the rendered file looks like this (verbatim, both for "Yes" and for "No"):

```text
<w:sdt>
  <w:sdtPr>
    <w:rPr>☑</w:rPr>          ← invalid: glyph as text inside <w:rPr>
    <w14:checkbox>
      <w14:checked w14:val="0"/>   ← still 0, never toggled
      ...
    </w14:checkbox>
  </w:sdtPr>
  <w:sdtContent>
    <w:r>
      <w:rPr>☑</w:rPr>         ← invalid: glyph as text inside <w:rPr>
      <w:t>☐</w:t>             ← still ☐, never toggled
    </w:r>
  </w:sdtContent>
</w:sdt>
<w:r>...<w:t> Yes</w:t></w:r>
```

Word renders text content inside `<w:rPr>` even though it's structurally invalid, so each checkbox shows THREE glyphs (`☑☑☐`) before the label instead of one. There is no `<w:tag>` on these SDTs and no Handlebars block at all here, so neither `processSdtCheckboxes` nor the Mustache evaluator can identify them through normal field bindings.

### Bug 2 — The subordination-specific safety pass is not toggling the SDTs in the output

Even after recent fixes to widen the scan window and tighten the `<w:sdt>` matcher, the v7 file still shows:

- `<w14:checked w14:val="0"/>` (unchanged from template default)
- `<w:t>☐</w:t>` (unchanged from template default)

I replayed the exact safety-pass regex against the v7 XML in isolation and it DID toggle correctly to `w14:val="1"` and `<w:t>☑</w:t>`. So the regex itself is fine; the deployed Edge Function did not execute the new safety-pass branch when it generated v7.

### Evidence

- Payload value (from edge logs at v7 generation): `Derived ln_p_subordinationProvision from "true" (rawType=string): normalized=true` — data side is correct.
- Field key on the deal (CSR persists it): `loan_terms.subordination_provision = "true"` (alias-bridged to `ln_p_subordinationProvision` upstream — already wired and logged).
- Output XML at the Subordination Provision row: both `<w14:checked w14:val="0"/>` and `<w:t>☐</w:t>` remain at the template default, plus stray `☑` text inside two `<w:rPr>` containers per checkbox.
- Balloon Payment uses pure `{{#if ln_p_balloonPaymen}}☑{{else}}☐{{/if}}` text (no native SDT, no stray rPr text), which is why it works.

## The Fix

Two coordinated changes, scoped strictly to the Subordination Provision row — no other checkbox, no other field, no other template, no schema or UI changes.

### 1. `supabase/functions/_shared/tag-parser.ts` — sanitize stray glyph text inside `<w:rPr>` for the subordination SDTs

Inside the existing "Subordination Provision Yes/No safety pass" block (the section anchored on `"There are subordination provisions"`), add a pre-step that runs ONLY on the section window already computed there:

- For every `<w:sdt>...</w:sdt>` in the window that contains `<w14:checkbox>`, strip any text characters that appear directly inside `<w:rPr>...</w:rPr>` children. Replace `<w:rPr>...text...</w:rPr>` with `<w:rPr></w:rPr>` (or simply remove text nodes between `<w:rPr>` and `</w:rPr>` while keeping any nested tags intact).
- This removes the two stray `☑` characters per SDT that Word was rendering as visible text.

Then keep the existing toggle of `<w14:checked w14:val="…"/>` and the `<w:sdtContent>` `<w:t>` glyph that the safety pass already does.

### 2. Force-redeploy `generate-document` so the new code is actually live

The current deployment is not executing the latest safety-pass logic for the v7 generation. After the code change above, redeploy the edge function and regenerate.

## Verification (both states)

After the fix is deployed, regenerate RE851A twice on this deal:

1. Subordination Provision = CHECKED in CSR
   - Open the generated DOCX, find the Subordination row.
   - Plain text must read exactly `☑ Yes` and `☐ No` (one glyph each).
   - XML must show `<w14:checked w14:val="1"/>` and `<w:t>☑</w:t>` for the Yes SDT, and `<w14:checked w14:val="0"/>` and `<w:t>☐</w:t>` for the No SDT.
   - No stray glyph text inside any `<w:rPr>` of either SDT.
2. Subordination Provision = UNCHECKED in CSR
   - Plain text must read exactly `☐ Yes` and `☑ No`.
   - XML mirrors the inverse of case 1.

I'll script the verification by unzipping the freshly generated DOCX and asserting both the plain-text and XML conditions above for each case.

## Out of scope (will not be touched)

- Balloon Payment logic and any other `{{#if}}` checkbox.
- The RE851A template file itself (the malformed `<w:rPr>☑</w:rPr>` markup stays — we sanitize at generation time).
- Field dictionary, merge_tag_aliases, RLS, UI inputs, document generation pipeline outside the named safety-pass block.
