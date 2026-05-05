I found why this is still happening with the uploaded `Re851d_v3.docx` / screenshot pattern.

The template is using inline conditional text like:

```text
{{#if (eq pr_p_occupanc_N "Owner Occupied")}} ☒ {{else}} ☐ {{/if}} Yes
{{#if (ne pr_p_occupanc_N "Owner Occupied")}} ☒ {{else}} ☐ {{/if}} No
```

The current engine has two gaps:

1. It only safely evaluates `(eq ...)`, but the template uses `(ne ...)` for the No checkbox.
2. The existing owner-occupied safety pass runs before the final template parser. It rewrites static glyph runs only, but then unresolved or partially-resolved inline conditional glyphs can still render later and leave both Yes and No checked.

Plan:

1. Extend the shared template conditional parser narrowly and safely:
   - Add support for `(ne FIELD "literal")` as the inverse of `(eq FIELD "literal")`.
   - Keep existing `(eq ...)` behavior unchanged.
   - Update the conditional detection regexes so both `#if (ne ...)` and `#unless (ne ...)` are resolved instead of stripped or left as visible text.

2. Harden the RE851D owner-occupied template normalization:
   - Keep the current correction for malformed `pr_p_occupanc_N"Owner"` / `"Owner"` expressions.
   - Also normalize owner-occupied `(ne ...)` expressions when they use the same malformed spacing/value pattern.
   - Scope this only to the `pr_p_occupanc` field family inside RE851D preprocessing.

3. Add a final RE851D-only post-render safety pass after `processDocx(...)`:
   - Re-open the processed DOCX XML.
   - For each PROPERTY #1–#5 region, find the `OWNER OCCUPIED` cell.
   - Replace that cell’s rendered checkbox/label content with exactly one mutually-exclusive pair based on `pr_p_occupanc_1` through `pr_p_occupanc_5`:
     - `Owner Occupied` → `☑ Yes` and `☐ No`
     - anything else → `☐ Yes` and `☑ No`
   - Remove any leftover `{{#if ...}}`, `{{else}}`, `{{/if}}`, duplicate glyphs, or duplicate labels in that OWNER OCCUPIED cell only.

4. Keep the change minimal and isolated:
   - No UI changes.
   - No database/schema changes.
   - No save/update API changes.
   - No unrelated document-generation flow changes.

Validation:

- Use the uploaded `Re851d_v3.docx` structure as the target pattern.
- Verify that all five `pr_p_occupanc_N` mappings are handled.
- Confirm final output cannot contain both Yes and No checked in the same OWNER OCCUPIED block.