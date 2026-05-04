## Root cause

In the generated RE-851D, the encumbrance values are populating correctly (1st, 6.5, ABC Bank Ltd, $300,000.00, 01/01/2036, etc.). The trailing `_(N)_(S)` shown in the screenshot is **decorative annotation text** the template author placed in the docx as standalone `<w:t>` runs after each encumbrance field — it is not part of any merge tag.

Confirmed by unpacking `Re851d_v2.docx`: every encumbrance row contains a separate text run like `<w:r>...<w:t>_(N)_(S)</w:t></w:r>` (size 16) sitting next to the merge field. The merge-tag parser correctly leaves this alone (it isn't a tag), and the previous Step A normalization only touches `_(N)_(S)` when preceded by a `pr_li_(rem|ant)_<field>` identifier, so standalone annotations slip through and print verbatim.

## Fix — single file

**`supabase/functions/generate-document/index.ts`** — inside the existing `if (/851d/i.test(template.name || ""))` block, immediately after the Step A normalization (after line 3140), add a cleanup pass that strips any remaining `_(N)_(S)` and `_(N)` substrings that appear inside `<w:t>` text-run content.

```ts
// Strip leftover decorative "_(N)_(S)" / "_(N)" annotation labels that
// some authored RE851D templates place after each encumbrance field as
// a slot/property indicator. Step A above has already rewritten any
// suffix that belonged to a real pr_li_(rem|ant)_<field> identifier,
// so anything left is pure annotation prose. Restrict to <w:t> bodies
// so XML tag/attribute syntax can never be touched.
xml = xml.replace(
  /(<w:t(?:\s[^>]*)?>)([^<]*?)_\(N\)_\(S\)([^<]*?)(<\/w:t>)/g,
  "$1$2$3$4",
);
xml = xml.replace(
  /(<w:t(?:\s[^>]*)?>)([^<]*?)_\(N\)([^<]*?)(<\/w:t>)/g,
  "$1$2$3$4",
);
```

## Why this is safe

- Scoped to RE851D templates only (inside the existing `851d` template-name guard).
- Runs **after** Step A, so every legitimate `pr_li_(rem|ant)_<field>_(N)_(S)` has already been promoted to `_N_S` and cannot be matched here.
- Match restricted to text inside `<w:t>...</w:t>`; element names, attributes, and structural XML are untouched.
- `[^<]*?` cannot cross run boundaries — each strip stays within a single text run.
- Idempotent and leaves all surrounding text/formatting intact.

## Out of scope

- No template edits.
- No UI, schema, field_dictionary, packet, or permissions changes.
- No changes to the merge-tag parser or to the Step A/B encumbrance publishers.
- No changes to any other document or section.
