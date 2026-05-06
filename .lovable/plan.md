## Findings

The latest RE851D generation still did not run the new multiple-property post-render pass. The backend logs show the RE851D region rewrite and remain-unpaid safety pass running, but there are no `RE851D multi-properties post-render` log lines.

I found two likely root causes in the current code:

1. The post-render pass searches for the question text directly in raw Word XML:
   ```text
   /ADDITIONAL\s+SECURING\s+PROPERTY/
   ```
   But Word often splits visible text across `<w:t>` runs and XML tags, so the raw XML may look like:
   ```text
   ADDITIONAL</w:t>...<w:t>SECURING</w:t>...<w:t>PROPERTY
   ```
   In that case the visible document contains the label, but the regex never matches and the pass exits early.

2. The current post-render pass requires standalone `YES` and `NO` `<w:t>` runs. Some RE851D template variants have labels and checkbox glyphs in the same run, mixed case, or split labels. That can also make the pass skip without changing anything.

I also verified the reported loan `DL-2026-0235` has 3 property records (`property1`, `property2`, `property3`), so the correct output is:
```text
YES checked, NO unchecked
```

## Plan

Make one focused backend-only fix in `supabase/functions/generate-document/index.ts`.

1. Keep the existing publisher unchanged.
   - It already computes `pr_p_multipleProperties_yes/_no/_glyph` correctly from property count.
   - No template, UI, schema, API, or document packet changes.

2. Replace the fragile raw-XML question search in the RE851D post-render multiple-property pass with a text-map scanner.
   - Build a visible-text string from each DOCX XML part while keeping a map back to the original XML offsets.
   - Match both supported labels in visible text:
     ```text
     Are there multiple properties on the loan
     IS THERE ADDITIONAL SECURING PROPERTY
     ```
   - This will work even if Word splits the label across many XML runs.

3. Make the YES/NO control detection more tolerant.
   - Use the mapped visible-text offsets to define a local XML window after each question.
   - Within that window, detect checkbox controls by proximity to visible `YES` and `NO` labels.
   - Support:
     - native Word SDT checkbox blocks (`<w:sdt><w14:checkbox>...`)
     - bare glyph runs (`☐`, `☑`, `☒`)
     - glyph and label in the same `<w:t>` run (`☐ YES`, `YES ☐`, etc.)
     - labels split by Word XML run boundaries

4. Force the local pair from property count.
   - `property count > 1` → YES `☑`, NO `☐`
   - `property count == 1` → YES `☐`, NO `☑`
   - Update both the visible glyph and the internal Word checkbox state (`w14:checked`) when SDT controls are used.

5. Add diagnostic logging that reports skipped and successful cases.
   - On success: log the occurrence, property count, and forced state.
   - If the label is found but a YES/NO pair is not found, log that explicitly so future template-specific issues are visible.

6. Update the RE851D multiple-properties memory note to document the XML-tolerant visible-text scanner and supported template variants.

## Template guidance

You should not have to change the template after this backend fix.

For the cleanest future mapping, the recommended template pattern remains:
```text
IS THERE ADDITIONAL SECURING PROPERTY?
{{pr_p_multipleProperties_yes_glyph}} YES   {{pr_p_multipleProperties_no_glyph}} NO
```

But the fix will target the current template’s static checkbox variants too, so the template should not be required to change for this issue.