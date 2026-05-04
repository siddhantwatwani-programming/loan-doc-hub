## Issue

In RE-851D's "Encumbrance Remaining" rows, four fields render blank for every property:
- PRIORITY (1ST, 2ND, ETC.)
- INTEREST RATE
- BENEFICIARY
- MATURITY DATE

## Findings

The template encodes each cell as a bare token (no `{{ }}`) followed by an `_(N)_(S)` annotation in a separate Word run, e.g. `pr_li_rem_priority` then a separate text-run `_(N)_(S)`.

After `normalizeWordXml` consolidates adjacent runs, the bare token becomes contiguous as `pr_li_rem_priority_(N)_(S)`. The existing parens-rewrite at `index.ts:3142–3149` then converts `_(N)_(S)` → `_N_S`, yielding `pr_li_rem_priority_N_S`.

The bare-encumbrance rewrite at `index.ts:3297–3341` is supposed to substitute resolved values for these tokens, but **two issues prevent the four fields from rendering**:

1. **Word-boundary mismatch.** The regex `\bpr_li_(rem|ant)_(<field>)(?:_N(?:_S)?)?\b` is anchored with `\b`. When the consolidated text reads `pr_li_rem_priority_N_S</w:t>`, the boundary at the `_S</` join works only if the trailing char after `_S` is non-word. In some run-merge cases an additional alphanumeric (e.g. another digit from a stray annotation) appears, defeating the boundary and skipping the match for that property's row.

2. **Source field naming for `priority`.** The publisher (`index.ts:2412`) reads `get("lien_priority_now")` for the `priority` field. UI also writes `lien1.priority` and `lien1.remaining_new_lien_priority` for the same concept. When liens were saved through `LienModal` (which uses key `n` mapped via legacyKeyMap to `pr_li_lienPrioriNow`), the value lands under a different field key, so `lien_priority_now` is empty for some liens and `pr_li_rem_priority_K_S` is published as "".

3. **Source field naming for `beneficiary`.** Publisher reads only `get("holder")`. Some lien saves use `beneficiary` or are stored only via the contact join (`account` → contact name). When `holder` is empty but the row clearly has a lender, the published value is "".

`interest_rate` and `maturity_date` are genuinely empty in the current deal's stored data — the user must enter those values for them to render. We will not fabricate them.

## Fix (minimal, RE-851D scoped)

### File: `supabase/functions/generate-document/index.ts`

**A. Strengthen the bare-encumbrance regex (~line 3312)**

Replace the strict trailing `\b` with a negative lookahead so trailing `<`, `}`, whitespace, or end-of-string all qualify as a boundary, preventing missed matches when run-consolidation leaves residual chars adjacent:

```ts
const encTagRe = new RegExp(
  "\\bpr_li_(rem|ant)_(" + encFields.join("|") + ")(?:_N(?:_S)?)?(?![A-Za-z0-9_])",
  "g",
);
```

**B. Broaden field aliases in the encumbrance publisher (~line 2411–2426)**

Extend the field-source list so priority and beneficiary fall back to their UI alternates — strictly reading existing keys, no schema changes:

```ts
const firstNonEmpty = (...sfx: string[]) => {
  for (const s of sfx) {
    const v = String(fieldValues.get(`${lp}.${s}`)?.rawValue ?? "").trim();
    if (v) return v;
  }
  return "";
};

const fields: Array<[string, string, string]> = [
  ["priority",         firstNonEmpty("lien_priority_now", "priority", "remaining_new_lien_priority", "n"), "text"],
  ["interestRate",     firstNonEmpty("interest_rate", "intRate"),                                          "percent"],
  ["beneficiary",      firstNonEmpty("holder", "lienHolder", "beneficiary"),                               "text"],
  ["originalAmount",   firstNonEmpty("original_balance", "originalBalance"),                               "currency"],
  ["principalBalance", firstNonEmpty("current_balance", "currentBalance", "new_remaining_balance"),        "currency"],
  ["monthlyPayment",   firstNonEmpty("regular_payment", "regularPayment"),                                 "currency"],
  ["maturityDate",     firstNonEmpty("maturity_date", "matDate"),                                          "date"],
  ["balloonAmount",    firstNonEmpty("balloon_amount", "balloonAmount"),                                   "currency"],
];
```

(Keep the existing `fieldAliases` block that publishes additional alias keys for backward compatibility.)

**C. Diagnostic log (~line 2454)**

Add a per-row debug line so future regressions are easy to trace:

```ts
debugLog(`[generate-document] RE851D enc row ${tagPrefix} P${pIdx} S${s}: priority="${fields[0][1]}" beneficiary="${fields[2][1]}" interestRate="${fields[1][1]}" maturityDate="${fields[6][1]}"`);
```

## Out of scope

- No template change.
- No UI / schema changes.
- No change to ANTICIPATED-section logic beyond the same publisher (it already shares the publisher).
- No change to `_N` indexed-tag rewriter, region detection, or Owner-Occupied logic.
- Does not invent values for liens whose `interest_rate` / `maturity_date` are genuinely blank — the user must enter those in CSR for them to print.

## Expected outcome

- PRIORITY column renders the lien's "Lien Priority Now" (e.g. "1st"), regardless of whether the lien was saved via `LienDetailForm` or `LienModal`.
- BENEFICIARY column renders the lien holder name when present.
- INTEREST RATE and MATURITY DATE render whenever those fields have values in CSR; remain blank otherwise (data-driven, not a generator bug).
- Per-property, per-slot indexing remains correct — no cross-property bleed.
