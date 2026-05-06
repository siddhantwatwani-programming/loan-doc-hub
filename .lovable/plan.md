## Goal
Make the value entered in **Other Origination → Origination Fee → Estimated Cash at Closing** populate `{{origination_fees.re885_cash_at_closing_amount}}` in the RE885 document.

## Root cause
- The UI (`src/components/deal/RE885ProposedLoanTerms.tsx`) already writes the auto-computed Estimated Cash at Closing to the key `origination_fees.re885_cash_at_closing_amount` (lines 17, 117–119).
- `field_dictionary` has only 5 `origination_fees.re885_*` entries — and **`re885_cash_at_closing_amount` is not one of them**.
- Per project rule, persistence is strictly governed by `field_dictionary`; missing keys are **skipped on save**, so the value never reaches `deal_section_values` and the template tag stays blank.

## Fix (minimal, scoped to this one field)

1. Add a single dictionary entry via migration:
   - `field_key`: `origination_fees.re885_cash_at_closing_amount`
   - `label`: `Estimated Cash at Closing`
   - `data_type`: `currency`
   - `section`: `origination_fees`
   - `form_type`: `primary` (matching peers)
   - `is_calculated`: `true` (UI computes it from Loan Amount − Subtotal of Deductions; non-editable input)
   - `allowed_roles` / `read_only_roles`: same as the other `origination_fees.re885_*` peers

2. Add a small alias publisher in `supabase/functions/generate-document/index.ts` (mirrors the existing RE885 alias block at lines 718–776) so the template tag resolves even via flat aliases:
   ```ts
   const ec2 = fieldValues.get("origination_fees.re885_cash_at_closing_amount");
   if (ec2?.rawValue) {
     const data = { rawValue: ec2.rawValue, dataType: ec2.dataType || "currency" };
     for (const a of [
       "origination_fees.re885_cash_at_closing_amount",
       "origination_fees_re885_cash_at_closing_amount",
       "of_re_estimatedCashAtClosing",
       "re885_cash_at_closing_amount",
     ]) if (!fieldValues.has(a)) fieldValues.set(a, data);
   }
   ```
   plus a debug log line (`EstimatedCashAtClosing=...`) for verification.

3. No UI changes — existing field key already matches the template.
4. No template changes — `{{origination_fees.re885_cash_at_closing_amount}}` continues to work.
5. Backward compatible — only a new dictionary row + a new alias publisher are added.

## Validation
- After migration + redeploy: enter a value in UI → Save deal → row appears in `deal_section_values.field_values` keyed by the new dictionary id.
- Generate RE885 → edge logs show `EstimatedCashAtClosing=<value>` and `Field "origination_fees.re885_cash_at_closing_amount" = {...}` (not `NOT FOUND`).
- The amount renders next to the radio selection in the Estimated Cash at Closing line of the RE885 output.

Constraints respected: UI layout/behavior unchanged; no other fields touched.