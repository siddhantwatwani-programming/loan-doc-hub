## Root cause (deep analysis)

I unzipped the uploaded template (`Re851d_v1_1_2_4-2.docx`) and the generated output (`Re851d_v4.docx`) and compared the OWNER OCCUPIED region per property.

**Template authoring (correct):** each of the 5 OWNER OCCUPIED blocks contains:
```
{{#if (eq pr_p_occupanc_N "Owner Occupied")}}
☑ Yes
☐ No
{{else}}
☐ Yes
☑ No
{{/if}}
```
…where the literal in the XML is actually `&quot;Owner Occupied&quot;` (DOCX entity-encoded quotes).

**Generated output (broken):** every property prints all four glyphs:
```
☑ Yes   ☐ No   ☐ Yes   ☑ No
```
i.e. **both branches survive verbatim**, regardless of CSR occupancy. Two compounding bugs cause this:

### Bug 1 — `(eq …)` sub-expression doesn't match when quotes are XML-entity-encoded
`processConditionalBlocks` in `supabase/functions/_shared/tag-parser.ts` (lines 1886–1912) uses:
```
/\{\{#if\s+\(\s*((eq|ne)\s+[A-Za-z0-9_.]+\s+(?:"[^"]*"|'[^']*'|[A-Za-z0-9_.\-]+))\s*\)\s*\}\}/
```
This only accepts raw `"…"` or `'…'`, not `&quot;…&quot;`. Because the template stores `&quot;Owner Occupied&quot;`, the eq regex never matches, the block is **not** evaluated, and the post-loop safety net at lines 1990–2002 strips `{{#if (...)}}`, `{{else}}`, and `{{/if}}` **markers only** while leaving both branches' content. Result: both `☑ Yes ☐ No` and `☐ Yes ☑ No` render, side by side.

### Bug 2 — Owner-Occupied post-render safety pass cannot find the labels
`supabase/functions/generate-document/index.ts` lines 3885–3886 use:
```
yesLabelRe = /<w:t(?:\s[^>]*)?>\s*Yes\s*<\/w:t>/gi
noLabelRe  = /<w:t(?:\s[^>]*)?>\s*No\s*<\/w:t>/gi
```
But in this template each Yes/No label sits in the same `<w:t>` as its glyph: `<w:t>☑ Yes</w:t>` and `<w:t>☐ No</w:t>`. The label regex never matches, the safety pass aborts at `if (!yL || !nL) continue;` (line 3962), and the corrupt double-checked output is never repaired.

### Bug 3 (latent) — `pr_p_occupanc_N` index expansion still required
The RE851D `_N` rewrite at lines 3376–3416 already rewrites `pr_p_occupanc_N` → `pr_p_occupanc_K` per PROPERTY #K region. This is working today, but bug 1 makes it irrelevant. Once bug 1 is fixed, the per-property eq evaluation will fire correctly.

## Fix (minimal, scoped, no schema/UI/API changes)

All changes are in the two existing edge function files. No new templates, no new fields, no new dictionary entries.

### File 1 — `supabase/functions/_shared/tag-parser.ts`

In `processConditionalBlocks` (around lines 1886–1887), extend the eq/ne sub-expression regexes so the literal can be `"…"`, `'…'`, **or** `&quot;…&quot;`:

```
const eqIfPattern = /\{\{#if\s+\(\s*((eq|ne)\s+[A-Za-z0-9_.]+\s+(?:&quot;[^"<]*?&quot;|"[^"]*"|'[^']*'|[A-Za-z0-9_.\-]+))\s*\)\s*\}\}([\s\S]*?)\{\{\/if\}\}/;
const eqUnlessPattern = /\{\{#unless\s+\(\s*((eq|ne)\s+[A-Za-z0-9_.]+\s+(?:&quot;[^"<]*?&quot;|"[^"]*"|'[^']*'|[A-Za-z0-9_.\-]+))\s*\)\s*\}\}([\s\S]*?)\{\{\/unless\}\}/;
```

Then, immediately before calling `evaluateEqExpression`, decode `&quot;` → `"` on the captured expression:
```
const eqExpr = (head === 'ne' ? m[1].replace(/^\s*ne\b/i, 'eq') : m[1])
                 .replace(/&quot;/g, '"');
```
Also extend the cheap pre-check `hasEqSexp` so it triggers when `(eq ` or `(ne ` is present even with `&quot;` quoting (no functional change beyond not skipping the regex pass).

### File 2 — `supabase/functions/generate-document/index.ts`

Two small reinforcements so even older/variant templates self-heal:

**(a)** In the RE851D pre-rewrite block (around lines 3253–3270 — the existing "Owner Occupied condition normalizer"), additionally decode `&quot;` → `"` **only inside `{{#if (eq pr_p_occupanc… )}}` and `{{#unless (ne pr_p_occupanc… )}}` openers** so the tag-parser's eq matcher always sees raw quotes. Strictly limited to the `pr_p_occupanc` field family. Pattern:
```
/(\{\{#(?:if|unless)\s+\(\s*(?:eq|ne)\s+pr_p_occupanc(?:_(?:N|[1-5]))?\s+)&quot;([^"<]*?)&quot;(\s*\)\s*\}\})/g
```
→ `$1"$2"$3`

**(b)** Loosen the Owner-Occupied post-render safety pass label regexes (lines 3885–3886) so they match `Yes`/`No` even when preceded by a leading glyph (`☐`, `☑`, `☒`) and optional whitespace inside the same `<w:t>` run:
```
const yesLabelRe = /<w:t(?:\s[^>]*)?>\s*[☐☑☒]?\s*Yes\s*<\/w:t>/gi;
const noLabelRe  = /<w:t(?:\s[^>]*)?>\s*[☐☑☒]?\s*No\s*<\/w:t>/gi;
```
The downstream "nearest glyph control" picker already handles glyph-or-SDT controls correctly, so once the labels are found the existing per-property mutually-exclusive enforcement does the rest.

### Why this is safe

- Bug 1's fix is the single source-of-truth change: the eq evaluator now handles entity-encoded quotes — the same fix benefits every other RE851D `(eq …)` checkbox (e.g. property type, lien priority) without touching them individually.
- The two `index.ts` reinforcements are belt-and-suspenders: even if a future template is authored with already-evaluated content or odd run fragmentation, the safety pass will repair it.
- All other conditional flows (raw-quote literals, bare-key `{{#if KEY}}`, unless blocks) keep working unchanged — the regexes only **add** an alternation branch.
- No changes to: `field_dictionary`, `deal_section_values`, RLS, the UI, the Property/Liens/Occupancy forms, or the document generation pipeline ordering.

## Acceptance criteria

- For DL-2026-0235 (Property 1 = Owner Occupied, Property 2 = Tenant/Other), the regenerated RE851D shows:
  - Property 1 OWNER OCCUPIED → ☑ Yes / ☐ No
  - Property 2 OWNER OCCUPIED → ☐ Yes / ☑ No
- Properties 3–5 reflect their own `pr_p_occupanc_K` value, with exactly one box checked per property.
- No regression for any other `(eq …)` / `(ne …)` conditional in any template.

## Files touched

- `supabase/functions/_shared/tag-parser.ts` — extend eq/ne regex + decode `&quot;` before evaluation.
- `supabase/functions/generate-document/index.ts` — entity-decode quotes inside `pr_p_occupanc` eq/ne openers; loosen post-render label regex to allow leading glyph in same `<w:t>`.

## Out of scope

- No template re-authoring required.
- No new field dictionary keys, no new aliases, no schema migrations.
- No changes to the Lien/Property persistence flows from prior turns.
