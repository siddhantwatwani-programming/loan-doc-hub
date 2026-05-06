## Findings

I reviewed the current RE851D generator code, the uploaded mapped template `Re851d_v1 (1) (2)(9)`, the generated `Re851d_v10`, and the saved CSR data for loan `DL-2026-0235`.

Key findings:

- The CSR data does have multiple property records. Current saved property prefixes are `property1`, `property2`, and `property3`, so the expected result is:
  ```text
  YES = checked
  NO  = unchecked
  ```
- The generator already publishes these global aliases:
  - `pr_p_multipleProperties_yes`
  - `pr_p_multipleProperties_no`
  - `pr_p_multipleProperties_yes_glyph`
  - `pr_p_multipleProperties_no_glyph`
- The mapped template does not use one single consistent pattern for this checkbox. It contains several variants across the property blocks, including:
  - Property #1: `☐ {{pr_p_multipleProperties_yes_glyph}} YES {{pr_p_multipleProperties_no_glyph}} NO`
  - Property #2: `☐ YES ☐ NO` followed by the glyph tags on separate lines
  - Property #3/#4/#5: plain static `YES ☐ / NO ☐` or `☐ YES ☐ NO` with no merge tags near the text
- The existing safety pass anchors only on this exact question text:
  ```text
  Are there multiple properties on the loan
  ```
  But the actual uploaded template uses:
  ```text
  IS THERE ADDITIONAL SECURING PROPERTY?
  ```
  Therefore the current safety pass never fires for the uploaded template.
- Because standalone checkbox glyphs are converted into Word checkbox controls after merge rendering, this should be fixed as a post-render safety pass that can update both visible glyphs and the internal Word checkbox checked state.

## Plan

I will make one focused backend-only change in `supabase/functions/generate-document/index.ts`.

1. Keep the existing publisher unchanged.
   - Continue computing property count from the detected CSR property records.
   - Continue publishing `pr_p_multipleProperties_yes/_no/_glyph` as it does now.
   - No schema, UI, API, packet, or template changes.

2. Add a RE851D post-render safety pass after `processDocx(...)`.
   - Strictly gated to RE851D templates.
   - It will scan rendered DOCX XML for both supported labels:
     ```text
     Are there multiple properties on the loan
     IS THERE ADDITIONAL SECURING PROPERTY?
     ```
   - It will find the local YES and NO checkbox controls around each label.
   - It will force the pair from property count:
     ```text
     property count > 1  => YES ☑, NO ☐
     property count == 1 => YES ☐, NO ☑
     ```

3. Support both template styles already present in the uploaded mapped file.
   - `☐ YES ☐ NO`
   - `YES ☐ / NO ☐`
   - merge-tag glyph variants where `{{pr_p_multipleProperties_yes_glyph}}` and `{{pr_p_multipleProperties_no_glyph}}` render separately from the YES/NO labels
   - Word checkbox SDT controls generated from those glyphs

4. Avoid unrelated checkbox changes.
   - The pass will be bounded to a short local window after the specific question label.
   - It will only touch the nearest YES/NO pair for that question.
   - It will not modify owner occupied, encumbrance, delinquency, property type, servicing, amortization, or any other checkbox logic.

5. Update the existing RE851D multiple-properties memory note to record the new accepted labels and post-render enforcement behavior.

## Template guidance

You should not need to change the template for this fix.

That said, the clean recommended template pattern is:

```text
IS THERE ADDITIONAL SECURING PROPERTY?
{{pr_p_multipleProperties_yes_glyph}} YES   {{pr_p_multipleProperties_no_glyph}} NO
```

The fix will still handle the current uploaded template variants, including the sections that currently only have static `☐ YES ☐ NO` without the merge tags.

## Expected result

For `DL-2026-0235`, since the CSR currently has more than one property, every RE851D occurrence of the additional/multiple securing property YES/NO pair should render as:

```text
☑ YES   ☐ NO
```

If a future loan has only one property, it should render as:

```text
☐ YES   ☑ NO
```