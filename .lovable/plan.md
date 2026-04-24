## Diagnosis
No field mapping change is needed. The failure is in the RE851A template authoring for Part 3, not in the UI mapping or database-backed value resolution.

## What is already correct
- UI source field is already the correct one: `loan_terms.balloon_payment`
- The document engine already derives and publishes:
  - `loan_terms.balloon_payment`
  - `ln_p_balloonPaymen` (legacy truncated alias)
  - `ln_p_balloonPayment` (full tag used by the template)
- The Loan UI checkbox is already bound to the same source field

So the mapping chain is already in place. Changing field mapping would not fix this issue.

## Root cause
The uploaded RE851A template is authored with the wrong conditional pattern in the Balloon Payment cell.

Current template pattern found in the uploaded file:
```handlebars
{{#if ln_p_balloonPayment}} [x] YES {{else}} [ ] NO {{/if}}
```

That pattern has two problems:

1. It renders only one branch
- When true, it outputs only the YES branch
- When false, it outputs only the NO branch
- Your requirement needs both labels to remain visible at all times, with only the symbols changing

2. It uses literal bracket markers (`[x]` / `[ ]`)
- The document engine is most reliable when checkboxes are authored as direct glyph toggles (`☑` / `☐`) or native Word checkbox controls
- A special bracket-normalization fallback was added for Part 2 Broker Capacity labels, but Balloon Payment YES/NO does not currently have that same scoped fallback path

## Why it still fails even if the boolean value is present
Even if `ln_p_balloonPayment` resolves correctly, the current template logic cannot meet the expected output because it is structurally wrong for a two-option checkbox row.

Expected requirement:
```text
true  -> ☑ YES   ☐ NO
false -> ☐ YES   ☑ NO
```

Current authoring can only produce one of these at a time:
```text
true  -> [x] YES
false -> [ ] NO
```

So this is primarily a template logic issue, not a data issue.

## Recommended fix
Update only the Balloon Payment line in the RE851A template to two independent Handlebars expressions:

```handlebars
{{#if ln_p_balloonPayment}}☑{{else}}☐{{/if}} YES
{{#if ln_p_balloonPayment}}☐{{else}}☑{{/if}} NO
```

## Template authoring guidance
- Retype the Balloon Payment content fresh in Word instead of editing character-by-character
- Use literal Unicode glyphs: `☑` and `☐`
- Do not use `[x]` / `[ ]` for this section
- Keep the same cell, font, spacing, and label text
- Ensure each Handlebars tag is typed as continuous text so Word does not fragment the control tags awkwardly

## Minimal implementation plan
1. Update only the RE851A Part 3 Balloon Payment cell in the `.docx` template
2. Replace the single conditional with the two-line YES/NO toggle logic above
3. Generate the document twice for validation:
   - Balloon Payment checked
   - Balloon Payment unchecked/null
4. Confirm:
   - both YES and NO remain visible
   - only the checkbox symbols switch
   - no formatting/layout regression in Part 3

## Fallback only if template cannot be edited
If you must keep the existing malformed template unchanged, the only code-based rescue would be a very narrow parser fallback in `tag-parser.ts` for the Balloon Payment YES/NO labels, similar to the Part 2 Broker Capacity workaround.

That is not the preferred path because:
- it touches document-generation logic
- your instruction said not to impact backend logic
- the template itself is currently authored incorrectly for the required output

## Technical details
Relevant existing code already confirms the mapping is present:
- `src/lib/fieldKeyMap.ts` maps Balloon Payment to `loan_terms.balloon_payment`
- `src/lib/legacyKeyMap.ts` maps it to legacy alias `ln_p_balloonPaymen`
- `supabase/functions/generate-document/index.ts` derives `ln_p_balloonPayment` from the stored value and treats null/empty as false

Conclusion: do not change field mapping. Fix the RE851A template authoring for Balloon Payment.