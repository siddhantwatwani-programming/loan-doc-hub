Plan to fix the RE851A “IS BROKER ALSO A BORROWER?” checkbox issue with minimal scope only.

Findings so far:
- The current deal shown in the URL stores the checked CSR value under:
  - `origination_app.doc.is_broker_also_borrower_yes`
  - stored value: `value_text: "true"`
- The related “No” field is also present and stored as `value_text: "false"`.
- The document generator already derives:
  - `or_p_isBrkBorrower = "true"` when the CSR checkbox is checked
  - `or_p_brkCapacityPrincipal = "true"`
  - `or_p_brkCapacityAgent = "false"`
- Recent generation logs confirm the payload currently reaches the backend as checked:
  - `Derived broker capacity checkboxes from "true": agent=false, principal=true, isBrkBorrower=true`
- Therefore the remaining failure is most likely in the RE851A DOCX rendering path for the checked branch, not in CSR storage.

Implementation scope:
1. Add a very narrow truthy-value helper for this broker-borrower condition path only.
   - Treat these checked values as true: `true`, `"true"`, `"Yes"`, `"Y"`, `1`, plus existing accepted values such as `"checked"` and `"on"`.
   - Treat unchecked/empty values as false.

2. Apply the helper only where RE851A broker-capacity booleans are derived in `generate-document`.
   - Keep existing field names and aliases intact.
   - Add `"y"` support to the checked value detection.
   - Continue publishing the same derived keys:
     - `or_p_isBrkBorrower`
     - `or_p_brkCapacityPrincipal`
     - `or_p_brkCapacityAgent`
     - glyph aliases for A/B fallback.

3. Apply the same `"y"` handling to the conditional evaluator fallback for `or_p_isBrkBorrower` only if needed.
   - This ensures the Handlebars condition remains correct even if a future template reads the raw field directly instead of the derived normalized boolean.
   - No broad checkbox behavior changes unless strictly necessary.

4. Verify the template condition remains the expected simple Handlebars condition:
   ```handlebars
   {{#if or_p_isBrkBorrower}}☐{{else}}☑{{/if}} A. Agent in arranging a loan on behalf of another

   {{#if or_p_isBrkBorrower}}☑{{else}}☐{{/if}} B. Principal as a borrower on funds from which broker will directly or indirectly benefit...
   ```

5. Test both cases without touching UI, schema, permissions, or the template file unless required:
   - Checked value examples: `true`, `"true"`, `"Yes"`, `"Y"`, `1` → A unchecked, B checked.
   - Unchecked values: `false`, `"false"`, `"No"`, `"N"`, `0`, empty → A checked, B unchecked.

Technical details:
- No database schema changes.
- No UI/layout/component changes.
- No document template replacement unless the code-level fix proves insufficient.
- Target files, if implementation is approved:
  - `supabase/functions/generate-document/index.ts`
  - possibly `supabase/functions/_shared/tag-parser.ts` for the narrow conditional truthiness fallback.

Deliverable after implementation:
- Confirm the actual payload includes `origination_app.doc.is_broker_also_borrower_yes = "true"` for the checked CSR field.
- Provide the corrected Handlebars condition above.
- Confirm generated RE851A output resolves:
  - checked CSR checkbox → Option A `☐`, Option B `☑`
  - unchecked CSR checkbox → Option A `☑`, Option B `☐`