## Goal

Add a per-property derived currency tag `ln_p_totalWithLoan_N` for RE851D that equals `ln_p_totalEncumbrance_N + ln_p_loanAmount`. Template authors can then place `{{ln_p_totalWithLoan_N}}` in the "TOTAL (Total senior encumbrances + loan amount)" cell.

## Implementation (single file: `supabase/functions/generate-document/index.ts`)

### 1. Publish per-property `ln_p_totalWithLoan_N` (inside the existing per-property loop, right after `ln_p_totalEncumbrance_${idx}` is set at line 1337)

```ts
// RE851D: TOTAL (Total senior encumbrances + loan amount) per property.
{
  const loanAmtRaw =
    fieldValues.get("ln_p_loanAmount")?.rawValue ??
    fieldValues.get("loan_terms.loan_amount")?.rawValue ?? "";
  const loanAmtNum = parseFloat(String(loanAmtRaw).replace(/[^0-9.\-]/g, ""));
  const encNum = parseFloat(String(totalVal.rawValue).replace(/[^0-9.\-]/g, ""));
  const sum = (Number.isFinite(encNum) ? encNum : 0)
            + (Number.isFinite(loanAmtNum) ? loanAmtNum : 0);
  fieldValues.set(`ln_p_totalWithLoan_${idx}`, {
    rawValue: sum.toFixed(2),
    dataType: "currency",
  });
}
```

This runs inside the existing property loop, so each `_N` is computed in isolation. Null/missing encumbrance or loan amount is treated as 0. Output is currency-formatted by the existing currency renderer.

### 2. Register the new tag for `_N` expansion

Add `"ln_p_totalWithLoan_N"` to:

- The general `_N` expansion list near line 2792 (alongside `ln_p_totalEncumbrance_N`)
- `PART1_TAGS` at line 2842 (LTV table — same row as the encumbrance columns)
- `PART2_TAGS` at line 2858 (Securing Properties block — same row as the encumbrance columns)

### 3. Field Dictionary entry

Add one row to `field_dictionary` via migration:

| field_name | field_key | data_type | section |
|---|---|---|---|
| Total Encumbrance + Loan | `ln_p_totalWithLoan_N` | currency | document |

This is a derived/document-only key (computed at generation time, not user-editable), matching the existing pattern of other `ln_p_total*_N` derived entries.

## Edge cases handled

- Encumbrance null → uses 0
- Loan Amount null → uses 0
- Strings with `$` / commas → stripped before `parseFloat`
- Per-property isolation — uses the `idx` from the surrounding property loop, no cross-property bleed

## Out of scope

- No UI/form changes (purely a derived doc tag)
- No changes to `ln_p_totalEncumbrance_N` or `ln_p_loanAmount` source publishers
- No other templates touched
