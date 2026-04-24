## Recommended fix
No field mapping, UI, API, or database change is needed.

The existing source path is already wired correctly:
- UI checkbox saves to `loan_terms.balloon_payment`
- legacy alias exists as `ln_p_balloonPaymen`
- document generation already derives `ln_p_balloonPayment` and treats missing values as false

The failure is most likely in the RE851A template/rendering layer, not the data mapping. The screenshot shows the conditional tags printing literally, which means the checkbox block is not being resolved during document generation.

## Plan
1. Keep the current field mapping exactly as-is.
   - Do not change `loan_terms.balloon_payment`
   - Do not change `{{ln_p_balloonPayment}}`
   - Do not touch UI, backend data model, or other RE851A fields

2. Fix only the Balloon Payment checkbox block in the RE851A template.
   - Update the two Part 3 checkbox lines so they use the existing supported conditional syntax cleanly:
     - `{{#if ln_p_balloonPayment}}☑{{else}}☐{{/if}} YES`
     - `{{#if ln_p_balloonPayment}}☐{{else}}☑{{/if}} NO`
   - Preserve the exact layout, spacing, label text, and document formatting
   - Change only the checkbox symbols and malformed control-tag wrapping in that section if needed

3. If the template is already authored that way but Word has fragmented the tags, harden the parser only for this existing syntax.
   - Support fragmented `{{#if ln_p_balloonPayment}}`, `{{else}}`, and `{{/if}}` runs in the Balloon Payment paragraph
   - Do not introduce new helpers or new business mappings
   - Do not affect other sections unless they already rely on the same supported syntax

4. Validate both document outcomes.
   - `true`/checked -> YES checked, NO unchecked
   - `false`/null/undefined -> YES unchecked, NO checked
   - Confirm no raw Handlebars tags appear in the output
   - Confirm no layout shift or formatting regression in RE851A

## Technical details
Relevant files already confirm the mapping is present:
- `src/lib/fieldKeyMap.ts` -> `balloonPayment: 'loan_terms.balloon_payment'`
- `src/lib/legacyKeyMap.ts` -> `'loan_terms.balloon_payment': 'ln_p_balloonPaymen'`
- `supabase/functions/generate-document/index.ts` -> derives both `ln_p_balloonPayment` and `ln_p_balloonPaymen`
- `supabase/functions/_shared/tag-parser.ts` -> supports basic `#if / else / /if` blocks, so literal output indicates malformed or insufficiently consolidated template tags

## Expected outcome
- No mapping change required
- No database/UI/API change required
- Only the RE851A Balloon Payment checkbox rendering is corrected
- The generated document shows the correct YES/NO selection without exposing template tags