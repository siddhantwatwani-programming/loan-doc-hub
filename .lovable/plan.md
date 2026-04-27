Root cause confirmed

This is not a missing CSR value. The backend logs show the field is present and normalized correctly:

```text
[generate-document] Derived ln_p_subordinationProvision from "false" (rawType=string): normalized=false
[tag-parser] Subordination Provision safety pass executed: isSubordination=false, windowLen=12000, sanitizedSdts=0, normalizedParas=1
```

Database evidence for the current deal also shows the saved loan_terms value is false under the correct field dictionary entry:

```text
field_key: ln_p_subordinationProvision
label: SUBORDINATION PROVISION
data_type: boolean
saved value_text: "false"
```

The remaining issue is rendering, specifically the live RE851A layout shown in your screenshot: the Yes checkbox is before the word `Yes`, but the No checkbox is effectively after/beside the `No` label and may have no existing checkbox glyph/SDT for the renderer to replace. The current safety pass only updates an existing checkbox/glyph adjacent to `No`; if the live template has no actual glyph before/after `No`, there is nothing to toggle, so No stays visually blank.

Plan to fix

1. Update the RE851A Subordination Provision safety pass in `supabase/functions/_shared/tag-parser.ts` so it handles the screenshot layout explicitly:
   - Find the local section beginning at `There are subordination provisions`.
   - Identify the Yes/No labels even when they are in separate columns/runs/paragraphs.
   - If an existing SDT checkbox or glyph exists, toggle it as today.
   - If the No label has no checkbox/glyph, inject a visible checkbox glyph immediately before the `No` text run.
   - For unchecked CSR value, force:
     - `☐ Yes`
     - `☑ No`
   - For checked CSR value, force:
     - `☑ Yes`
     - `☐ No`

2. Tighten the paragraph normalizer so it does not skip or under-process the live No row:
   - Current `normalizedParas=1` means only one paragraph was normalized, likely the Yes row/same-paragraph artifact.
   - The fix will count/normalize the No label row independently when it lacks a checkbox artifact.

3. Add a regression test matching the uploaded screenshot shape:

```text
There are subordination provisions.
☐ Yes
No
```

Expected test output when CSR value is false:

```text
☐ Yes
☑ No
```

4. Run the focused Deno tests for `tag-parser.subordination.test.ts`.

5. Deploy the updated `generate-document` backend function.

6. Regenerate RE851A for deal `0e3c8a36-8ae3-445e-9981-69cfec5dfb2e` and verify via logs that:
   - payload value is still `false`
   - Subordination safety pass executes
   - both Yes and No labels are normalized/forced

Expected outcome

After implementation:

```text
CSR checked   -> Yes ☑, No ☐
CSR unchecked -> Yes ☐, No ☑
```

Correct solution type

This is a document rendering/template-layout fix in the generation engine, not a data mapping fix. The data key and boolean value are already correct; the renderer must create/force the missing No checkbox in the live RE851A layout.