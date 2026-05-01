
## Problem

RE885 generation fails with **"Generation timed out (CPU limit exceeded)"**. The Edge Function exhausts its ~2s CPU budget while processing the 628 KB `word/document.xml`.

## Root cause (deep analysis)

`replaceMergeTags` and the RE851D publishers in `generate-document/index.ts` run a long sequence of **template-specific safety/normalization passes UNCONDITIONALLY** on every document, regardless of template. RE885 is a HUD-1 template and contains:

- ~640 paragraphs, ~2,700 `<w:t>` runs, 628 KB XML
- 0 `{{` merge tags, 0 `«»` MERGEFIELDs, 0 RE851A labels
- 1 SDT block, 1 checkbox glyph, 0 `[` brackets

Yet the engine still executes (each is one or more full-document regex sweeps on 628 KB):

1. **RE851A Subordination Provision pass** (~120 lines, multi-regex 12 KB windowed scan, runs whenever `ln_p_subordinationProvision` data is present — which it always is for any deal)
2. **RE851A Amortization safety pass** — 6 labels × 3 regex shapes = **18 full-document regex scans**
3. **RE851A Payable (Monthly/Annually) pass** — 4 full-document scans
4. **RE851A broker-capacity paragraph-split** — full document `<w:p>` walk
5. **RE851A broker-capacity A/B safety pass** — 4 full-document scans + 1 dedup
6. **RE851A Servicing Agent pass** — 6 full-document scans
7. **RE851D per-property publisher + anti-fallback shield** in `index.ts` lines 790–1292 — writes ~160 keys, scans liens/properties, even though RE885 has no per-property `_N` tags
8. **RE851A bracket-before-label normalization** — gated on `[` in document; safe for RE885 but adds cost on other templates
9. Several full-document `<w:t>` regex sweeps in `controlConsolidation`, `eachBlocks`, orphan `{{`/`}}` cleanups, and empty-paragraph cleanup that run unconditionally

None of these passes can possibly fire on RE885 (no matching anchors), but each one **builds large compound regexes and scans the entire 628 KB string**. The cumulative regex work pushes total CPU past Deno's 2 s isolate budget.

## Fix (minimal, non-intrusive)

Gate every RE851A-only and RE851D-only pass behind a **template-name check**, so RE885 (and any other unrelated template) skips them entirely. Output for RE851A and RE851D stays bit-for-bit identical because each gated block was already restricted to that template's labels — we are only short-circuiting the regex engine when the template is known not to need it.

### 1. `supabase/functions/_shared/tag-parser.ts`

- Add a new optional `templateName?: string` parameter to `replaceMergeTags`.
- Compute three booleans once at the top:
  - `is851A = /851a/i.test(templateName)`
  - `is851D = /851d/i.test(templateName)`
- Wrap each of these blocks in `if (is851A) { … }`:
  - Bracket-before-label normalization (line 2366)
  - Subordination Provision safety pass (line 2628)
  - Amortization safety pass (line 3114)
  - Payable safety pass (line 3263)
  - Broker-capacity paragraph-split (line 3333)
  - Broker-capacity A/B safety pass (line 3420)
  - Servicing Agent safety pass (line 3505)
- No logic inside any pass changes — output is byte-identical for RE851A.

### 2. `supabase/functions/_shared/docx-processor.ts`

- Pass `options.templateName` through to `replaceMergeTags(...)` (it already exists on `options` and is logged for `[885]` timing).

### 3. `supabase/functions/generate-document/index.ts`

- Wrap the RE851D multi-property publisher block (lines 790–1292, including the anti-fallback shield) in `if (/851d/i.test(template.name || "")) { … }`.
  - This block writes ~160 keys per generation today even for RE885; gating it removes pure overhead.
  - Other templates that depend on `pr_p_*` use the non-indexed publishers above line 790, which stay untouched.

### 4. Keep RE885 fast-paths intact

- `normalizeWordXml` already short-circuits when no fragmented merge tags are found — no change.
- `convertGlyphsToSdtCheckboxes` already short-circuits when no glyphs are present — no change.
- `replaceLabelBasedFields` already filters candidates by `quickNeedle` per paragraph — no change.

## Acceptance

- RE885 single-doc generation completes well under 2 s CPU and no longer throws "Generation timed out (CPU limit exceeded)".
- RE851A documents render with identical checkbox states (Subordination, Amortization, Payable, Broker-capacity A/B, Servicing) — no behavior change because all gated passes still run for `851a` template names.
- RE851D documents render with identical per-property data — the publisher is still triggered for `851d` template names.
- All other templates render identically (no merge-tag, label, or SDT logic was touched).

## Files to change

- `supabase/functions/_shared/tag-parser.ts` — add `templateName` param, gate 7 RE851A blocks
- `supabase/functions/_shared/docx-processor.ts` — forward `options.templateName` to `replaceMergeTags`
- `supabase/functions/generate-document/index.ts` — gate RE851D publisher block by template name
