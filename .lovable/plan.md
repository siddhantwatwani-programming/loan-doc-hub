I’ll keep this narrowly scoped to the document generation backend only. No UI, database schema, CSR forms, template management UI, or unrelated document flows will be changed.

## Findings from the deep analysis

The timeout is happening in the DOCX XML rendering path, not in the UI.

Recent backend logs show RE885 failing here:

```text
[885] Data Mapping: 1771 ms (fieldValues=643)
[885] Template Load: 690 ms
[tag-parser] phases total=5348ms size=635710B top5: normalizeWordXml=5287ms
[885] DOCX Render: 5358 ms (replace=5355 ms, parts=5, slowest=word/document.xml:5349 ms)
CPU Time exceeded
```

The exact bottleneck is `normalizeWordXml()` in `supabase/functions/_shared/tag-parser.ts`. RE885 is large and table-heavy, and the parser is entering the expensive fragmented-run normalization path across the full 635KB `word/document.xml`. That path is intended for malformed Word merge tags split across XML runs, but for RE885 most placeholders are regular `{{...}}` HUD fee fields. The engine is spending several seconds scanning and normalizing the whole XML before the actual replacements happen.

There is also extra overhead from RE851A-specific derived checkbox aliases and RE851A label maps being built for unrelated templates. That overhead is smaller than `normalizeWordXml`, but it is still visible in logs during RE885 generation and should be gated by template type.

## Implementation plan

### 1. Add an RE885-safe fast path in the tag parser

File: `supabase/functions/_shared/tag-parser.ts`

- Add a lightweight template profile inside `replaceMergeTags()` using `templateName`:
  - `is885 = /885/i.test(templateName || "")`
  - keep existing `is851A` behavior intact.
- Before calling `normalizeWordXml()`, determine whether the XML truly needs fragmented-run normalization:
  - field codes present: `w:fldChar`, `w:fldSimple`, `w:instrText`
  - real split placeholders across Word runs
  - control blocks needing XML consolidation: `{{#if`, `{{#unless`, `{{#each`, `{{else}}`, `{{/if}}`, etc.
- For RE885, when the XML only contains intact `{{field}}` placeholders, skip the heavy fragmented normalization and go directly to parse/replace.
- Preserve the existing normalization path for templates that need it, especially RE851A and templates with actual fragmented tags.

Expected impact: remove the current 5.2s `normalizeWordXml` cost for RE885.

### 2. Make placeholder replacement more single-pass and avoid oversized combined regexes

File: `supabase/functions/_shared/tag-parser.ts`

- Keep the existing single-pass replacement concept, but optimize it for large documents:
  - parse unique placeholders once,
  - resolve each unique tag once,
  - replace direct curly placeholders with a callback regex instead of building a huge alternation regex when many tags exist.
- This avoids expensive regex construction and backtracking on HUD templates with many fee placeholders.
- Maintain current behavior for transforms, currency stripping, XML escaping, and newline handling.

### 3. Skip label-based replacement when a template has no relevant labels

File: `supabase/functions/_shared/tag-parser.ts`

- The code already filters label candidates, but RE885 should avoid label processing entirely when:
  - all placeholders are merge tags, and
  - no label quick needles are present.
- Add timing around this decision so logs clearly show whether label replacement was skipped or how many labels were candidates.

### 4. Gate RE851A-only mapping and label additions by template name

File: `supabase/functions/generate-document/index.ts`

- Introduce `isTemplate851A = /851a/i.test(template.name || "")` near the existing `isTemplate885`.
- Wrap RE851A-only derivations so they only run for RE851A:
  - amortization checkbox aliases,
  - subordination provision aliases,
  - broker-capacity aliases,
  - servicing-agent aliases,
  - payable-frequency aliases.
- Build `effectiveLabelMap` conditionally:
  - start with the database `labelMap`,
  - add the large RE851A hardcoded label bindings only for RE851A.
- Leave RE851D-specific `_N` preprocessing gated exactly as it is.

This preserves RE851A behavior while removing irrelevant work and noisy logs from RE885.

### 5. Optimize data mapping diagnostics without changing data results

File: `supabase/functions/generate-document/index.ts`

- Add timing logs for major data-mapping subsections, only for RE885 or large templates:
  - field dictionary loading,
  - deal section value expansion,
  - participant/contact mapping,
  - HUD totals,
  - valid field key cache.
- Do not change the field mapping output unless a clearly redundant loop is safe to bypass.

### 6. Add fail-safe timeout diagnostics

Files:
- `supabase/functions/generate-document/index.ts`
- `supabase/functions/_shared/docx-processor.ts`
- `supabase/functions/_shared/tag-parser.ts`

- Add a lightweight elapsed-time guard around major stages.
- If generation approaches the CPU-risk zone, log partial diagnostics before the platform terminates the function:
  - template name,
  - XML part name,
  - XML byte size,
  - phase timings already collected,
  - number of parsed tags,
  - whether normalization was skipped or required.
- Return a clearer error message when an internal guard catches the issue before the runtime kills the function.

### 7. Add malformed-placeholder validation diagnostics

File: `supabase/functions/_shared/tag-parser.ts`

- Add a non-mutating validation pass for large templates to detect likely malformed placeholders:
  - unmatched `{{` / `}}`,
  - placeholders containing XML markup,
  - tags with leading/trailing spaces like `{{ of_re_loanTermValue }}`,
  - placeholders not matching valid field key format.
- Log counts and a few safe examples; do not remove or rewrite placeholders unless the current engine already would.

### 8. Verify behavior with existing document-specific tests

Files:
- existing `supabase/functions/_shared/tag-parser.*.test.ts`
- add or adjust focused RE885 parser test if needed.

Validation targets:

- RE885 no longer spends seconds in `normalizeWordXml`.
- RE885 placeholders like `{{br_p_fullName}}`, `{{pr_p_address}}`, `{{of_1302_pest_o}}`, and spaced tags like `{{ of_re_loanTermValue }}` still populate correctly.
- RE851A checkbox behavior remains unchanged because its paths still run only for RE851A templates.
- RE851D `_N` expansion remains unchanged.

## Expected result

After implementation, RE885 should generate successfully without CPU timeout. The primary improvement should be visible in logs as the `normalizeWordXml` phase dropping from ~5.2 seconds to near-zero or being skipped entirely for intact-placeholder RE885 templates.