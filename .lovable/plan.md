
Problem confirmed: this is no longer a Contacts-source issue. The logs show the generator already fetches Broker data from Contacts and successfully resolves/replaces both `bk_p_firstName` and `bk_p_lastName`. The remaining bug is in the DOCX tag/XML handling path, where the paragraph containing “Broker’s Representative:” is still being hidden or structurally broken after replacement.

What I found:
- `generate-document/index.ts` already force-injects broker data from Contacts into:
  - `bk_p_firstName`
  - `bk_p_lastName`
  - related broker keys
- Logs confirm replacements happen:
  - `Replacing bk_p_firstName -> ... = "Abhijit "`
  - `Replacing bk_p_lastName -> ... = "Gadge"`
- So the missing line is happening after data resolution, inside `tag-parser.ts`.

Most likely root cause:
- The template line is still stored in a Word field-code structure that the current normalization does not fully flatten in this specific case.
- The parser currently:
  - converts some hidden field-code forms,
  - removes orphaned `{{`,
  - removes orphaned `fldChar` begin/end pairs,
  - may also remove surrounding structure when a block looks empty.
- That combination can leave the visible text replaced in XML but still hidden to Word, or can collapse the paragraph in a way that drops the full “Broker’s Representative:” line.

Minimal implementation plan:
1. Tighten the Word field-code flattening in `supabase/functions/_shared/tag-parser.ts`
   - Add one more targeted normalization path for the specific field-code/run pattern where visible label text and hidden field text coexist in the same paragraph.
   - Ensure `{{bk_p_firstName}} {{bk_p_lastName}}` becomes plain visible text runs before replacement, without leaving hidden field wrappers around it.

2. Make orphaned `fldChar` cleanup safer
   - Preserve visible text runs exactly as-is.
   - Only remove the hidden Word control runs, not any surrounding label or spacing content.
   - This is the most likely place where the full line is disappearing even though replacement succeeded.

3. Make orphaned `{{` cleanup more conservative
   - Clean leftover braces only when they are clearly stray artifacts.
   - Avoid touching text runs that already contain resolved visible text on the same line.

4. Do not change broker data retrieval
   - Keep the current Contacts-based broker injection exactly as implemented.
   - No database changes, no template changes, no UI changes.

5. Verify with the affected document only
   - Regenerate “Agency Disclosure CA DRE Broker With Field Codes_v1”.
   - Confirm the output is:
     `Broker’s Representative: John Peterson`
     or the current contact name in that deal.
   - Confirm the label remains, both values appear on the same line, and formatting/layout remain identical.

Files to update:
- `supabase/functions/_shared/tag-parser.ts`

Files not to change:
- `supabase/functions/generate-document/index.ts`
- database schema
- template files
- UI/components
- document layout/styling logic beyond the minimal XML visibility fix

Expected result:
- Broker data continues to come from Contacts
- `{{bk_p_firstName}}` and `{{bk_p_lastName}}` both populate
- The full line “Broker’s Representative:” remains visible
- No template formatting, structure, or styling changes
