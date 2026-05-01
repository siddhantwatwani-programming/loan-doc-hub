## Findings from the current code/template

- The uploaded RE885 template does not appear to be driven by `_N` placeholder expansion. It primarily contains many direct merge tags such as `{{of_801_lenderLoanOriginationFee_others}}`, `{{ln_p_loanAmount}}`, `{{pr_li_lienHolder}}`, etc.
- The existing `_N` expansion block is already scoped to RE851D only, so it should not be running for RE885.
- The likely CPU bottleneck is systemic DOCX processing on large templates: repeated full-document XML scans in `replaceMergeTags`, label-based replacement, checkbox/conditional passes, and integrity verification.
- There is already partial RE885 instrumentation, but it is incomplete compared with the required log format and does not isolate every expensive stage.

## Plan

1. Add complete RE885 performance logging
   - Add exact required log markers:
     - `[RE885] Data Fetch: X ms`
     - `[RE885] Data Processing: X ms`
     - `[RE885] Template Compile: X ms`
     - `[RE885] DOCX Render: X ms`
     - `[RE885] Total CPU Time: X ms`
   - Keep existing lower-level `docx-processor` timings, but normalize the RE885 labels so logs are searchable and consistent.
   - Add counts for template size, content XML part sizes, merge tag count, label candidate count, SDT checkbox count, and unresolved tag count.

2. Profile and optimize the RE885 hot path without changing layout
   - Add a RE885-specific fast path in the DOCX processor/tag parser that skips expensive passes when the RE885 template does not contain the relevant constructs:
     - skip `_N` preprocessing entirely for RE885
     - skip `{{#each}}` processing when no each blocks exist
     - skip conditional processing when no conditionals exist
     - skip SDT checkbox processing when no native Word checkboxes exist
     - skip label replacement if the content part has explicit merge tags and no matching label needles
   - Keep these guards generic and safe, but make sure they are especially effective for RE885.

3. Replace repeated full-document merge replacement with a linear part-scoped pass
   - Build the tag replacement lookup once per XML part.
   - Avoid constructing huge combined regexes when there are many placeholders; use a callback-based scanner or chunked replacement strategy for `{{...}}` and `«...»` tags.
   - Cache resolved tag-to-field mappings for the request so duplicate fields do not call the resolver repeatedly.
   - Preserve existing formatting behavior including currency `$` handling and context-aware newline insertion.

4. Reduce unnecessary field/value work for RE885
   - Since RE885 currently has no rows in `template_field_maps`, generation falls back to all deal fields and all dictionary-derived values.
   - For RE885, derive the required field set directly from the parsed template tags and only perform expensive calculations/aliases needed by those tags where possible.
   - Do not remove existing global mappings used by other documents; scope any pruning to RE885.

5. Add safe handling for structured loops only if the template actually contains loops
   - If the active RE885 template or uploaded replacement contains `{{#items}}...{{/items}}` / `{{#each ...}}` sections, flatten the data before rendering and cap rows to the required form rows.
   - If the template contains no loop blocks, do not rewrite the template layout just to introduce loops, because that would be a layout/design change and is not needed for this RE885 file.

6. Keep RE851D and other document flows unchanged
   - Leave the RE851D `_N` placeholder logic intact and scoped to RE851D.
   - Ensure the new RE885 fast path does not affect RE851A checkbox automation, RE851D property/lien mappings, RE882/other templates, or packet generation.

7. Validate
   - Deploy the updated `generate-document` function.
   - Generate RE885 DOCX only and inspect logs for the required phase markers.
   - Confirm DOCX generation completes without CPU timeout.
   - Confirm output layout is unchanged by validating the produced DOCX and comparing visible extracted text/placeholder replacement behavior against the existing template.
   - Confirm no regressions to RE851D encumbrance logic by keeping its preprocessing path separate.

## Files to update

- `supabase/functions/generate-document/index.ts`
  - Add required RE885 phase timing.
  - Add RE885-specific data preparation/field pruning where safe.

- `supabase/functions/_shared/docx-processor.ts`
  - Improve content-part timing and expose RE885 render duration using required log labels.
  - Add safe short-circuiting for XML parts that do not need merge work.

- `supabase/functions/_shared/tag-parser.ts`
  - Optimize merge tag replacement and resolver caching.
  - Add guards to skip non-applicable expensive passes for RE885.

## Constraints honored

- No CPU-timeout increase.
- No document layout/design changes.
- No broad schema changes.
- No impact to RE851D or other document-specific mapping logic.