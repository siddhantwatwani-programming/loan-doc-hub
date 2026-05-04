## Root cause

The uploaded `Re851d_v2.docx` template uses two non-standard authoring patterns in the **ENCUMBRANCE(S) REMAINING** section that block resolution:

1. **No `{{ }}` braces** — every encumbrance tag is bare plain text, e.g. `pr_li_rem_priority`, `pr_li_rem_interestRate`, `pr_li_rem_balloonAmount_(N)_(S)`. The merge-tag parser only matches `{{tag}}` / `«tag»` / MERGEFIELD codes, so bare identifiers are passed through unchanged and printed verbatim (matching the screenshot).
2. **`_(N)_(S)` syntax with parentheses** — instead of the canonical `_N` / `_N_S` suffix the existing `RE851D` rewriter looks for. So even after the bare-identifier issue is solved, the rewriter wouldn't substitute the property-index `(N)` or per-slot `(S)`.

Confirmed by inspecting the unpacked `word/document.xml`:
```
pr_li_rem_priority</w:t> ... <w:t>_(N)_(S)
```
Fragmented across `<w:r>` runs, no braces, with `(N)` and `(S)` as literal parenthesized markers.

The downstream encumbrance publisher (`supabase/functions/generate-document/index.ts` lines 2361–2447) is correct — it already publishes `pr_li_rem_<field>_<N>_<S>` keys. The problem is purely template-tag recognition.

## Fix (single file: `supabase/functions/generate-document/index.ts`)

Add a **template-tag normalization pre-pass** in the existing RE851D `_N`-expansion block (the `if (/851d/i.test(template.name || ""))` section starting at line 2820) that runs **before** the existing rewrite loop. Strictly scoped to encumbrance tags only.

### Step A — Normalize `_(N)_(S)` / `_(N)` syntax

After the `normalizeWordXml(xml, ...)` call (line 3122) and before the indexed-tag rewrite, apply this conservative replacement:

```ts
// Normalize parenthesized index syntax used by some authored RE851D
// templates: pr_li_(rem|ant)_<field>_(N)_(S) -> _N_S, _(N) -> _N.
// Strictly scoped to encumbrance families so other prose with literal
// parens is never touched.
xml = xml.replace(
  /\b(pr_li_(?:rem|ant)_[A-Za-z]+)_\(N\)_\(S\)/g,
  "$1_N_S"
);
xml = xml.replace(
  /\b(pr_li_(?:rem|ant)_[A-Za-z]+)_\(N\)/g,
  "$1_N"
);
```

### Step B — Substitute bare encumbrance identifiers in-place

Inside each `PROPERTY #K` region (already detected by the existing `findAnchorOffsets` machinery), scan for bare encumbrance tokens and replace them directly with the rendered value from `fieldValues`. We resolve N from the region's forced index `K` and S from a per-region per-family counter (1, 2 within the property block, matching the template's two encumbrance columns).

Add this loop alongside the existing `for (const tag of tagsByLengthDesc)` rewriter at line 3217:

```ts
// Bare encumbrance-token rewrite inside PROPERTY #K regions.
// Templates may use pr_li_rem_<field>_N_S OR pr_li_rem_<field> (no
// suffix). Both are bare text (no {{ }} braces) and cannot be parsed
// by the merge-tag pass, so we substitute the resolved value here.
const encFields = [
  "priority", "interestRate", "beneficiary",
  "originalAmount", "principalBalance",
  "monthlyPayment", "maturityDate", "balloonAmount",
  "balloonYes", "balloonNo", "balloonUnknown",
];
const encTagRe = new RegExp(
  String.raw`\bpr_li_(rem|ant)_(` + encFields.join("|") + String.raw`)(?:_N(?:_S)?)?\b`,
  "g",
);
let m2: RegExpExecArray | null;
while ((m2 = encTagRe.exec(xml)) !== null) {
  const start = m2.index;
  const end = start + m2[0].length;
  if (isConsumed(start, end)) continue;
  const region = resolveRegion(start);
  // Only act inside PROPERTY #K blocks; skip GLOBAL/PART1/PART2 to
  // avoid accidental rewrites elsewhere in the document.
  if (region.forcedIndex === null) continue;
  const pIdx = region.forcedIndex;
  const family = `${m2[1]}_${m2[2]}`; // e.g. "rem_priority"
  // Per-region per-family slot counter (1, 2, ...).
  const slot = getRegionCounter(region.id, `__enc_${family}`);
  const lookupKey = `pr_li_${family}_${pIdx}_${slot}`;
  const v = fieldValues.get(lookupKey)
    || fieldValues.get(`pr_li_${family}_${pIdx}`); // legacy slot-1 alias
  let rendered = "";
  if (v && v.rawValue !== null && v.rawValue !== undefined) {
    rendered = formatByDataType(v.rawValue, v.dataType);
    if (v.dataType === "currency" && rendered.startsWith("$")) {
      rendered = rendered.substring(1); // template already prints "$"
    }
  }
  rewrites.push({ start, end, replacement: escapeXmlValue(rendered) });
  consumed.push([start, end]);
  bumpRegion(region.id);
  totalRewrites++;
}
```

`formatByDataType` and `escapeXmlValue` are already imported via `_shared/tag-parser.ts` (used elsewhere in this file). If they aren't currently imported into `index.ts`, import them at the top.

### Why this is safe

- All replacements are **strictly scoped to the encumbrance field whitelist** (`priority`, `interestRate`, `beneficiary`, `originalAmount`, `principalBalance`, `monthlyPayment`, `maturityDate`, `balloonAmount`, `balloonYes`, `balloonNo`, `balloonUnknown`). No other tags in the document are touched.
- Only fires inside detected `PROPERTY #K` regions — global/PART1/PART2 prose untouched.
- Step A's regex requires exact `_(N)_(S)` / `_(N)` suffixes after a known `pr_li_(rem|ant)_<field>` prefix, so user prose containing parens cannot match.
- Empty values render as empty string (template already paints the static `$` prefix), matching how the regular merge-tag pass handles missing currency values.

### Out of scope

- No template edits required (the broken-syntax template will now work as-is).
- No UI/schema changes.
- No new field_dictionary entries.
- The existing per-property/per-slot publisher at lines 2361–2447 already produces all keys this fix consumes.
