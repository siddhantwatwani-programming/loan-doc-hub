

## Root cause (confirmed)

`src/components/deal/LoanTermsBalancesForm.tsx` lines 327-332 perform a **render-time auto-write** of the read-only "Vendor Company" field (`soldRateOtherClient2`):

```ts
const persistedVendor = getValue(FIELD_KEYS.soldRateOtherClient2);
if (vendorCompanyDisplay !== persistedVendor) {
  queueMicrotask(() => setValue(FIELD_KEYS.soldRateOtherClient2, vendorCompanyDisplay));
}
```

`vendorCompanyDisplay` is built with `remainder.toFixed(2)` (e.g. `"33.00"`). The DB persists whatever string was saved (e.g. `"33"`). On opening DL-2026-0191:

1. Form mounts with persisted Lenders=`"34"`, Origination=`"33"`, Vendor=`"33"`.
2. Recomputed `vendorCompanyDisplay` = `"33.00"`.
3. String compare `"33.00" !== "33"` → microtask fires `setValue('...sold_rate_other_client_2', '33.00')`.
4. `updateValue` (useDealFields.ts:573) compares against `savedValuesSnapshotRef` (`"33"`) → marks key dirty → `setIsDirty(true)`.
5. `DealDataEntryPage` effect (line 296-300) propagates to `setFileDirty(id, true)` → tab dot lights up.

This matches the screenshot exactly: only the "Vendor Company" row shows the orange `DirtyFieldWrapper` highlight, and the tab dot appears with no user input.

The previously-shipped clean-load fix in `useDealFields.ts` is correct and stays. The remaining bug is form-side: a render-time write that re-dirties the file the moment the Loan tab renders.

## Fix (single, surgical change)

In `src/components/deal/LoanTermsBalancesForm.tsx`, lines 327-332: change the resync guard from string-equality to **numeric equality** so that formatting differences (`"33"` vs `"33.00"`, `""` vs `"0.00"`) do not trigger a write.

Replacement logic:

```ts
const persistedVendor = getValue(FIELD_KEYS.soldRateOtherClient2);
const persistedNum = parseFloat((persistedVendor || '').replace(/[^0-9.]/g, ''));
const displayNum = parseFloat(vendorCompanyDisplay);
const numericallyEqual =
  (isNaN(persistedNum) && isNaN(displayNum)) ||
  (!isNaN(persistedNum) && !isNaN(displayNum) && persistedNum === displayNum);

// Only write back when the underlying number actually changed (e.g. user edited
// Lenders/Origination), not when it's just a formatting difference on load.
if (!numericallyEqual && vendorCompanyDisplay !== '') {
  queueMicrotask(() => setValue(FIELD_KEYS.soldRateOtherClient2, vendorCompanyDisplay));
}
```

This preserves the live-recalc behavior when the user edits Lenders or Origination (numeric value changes → write happens → field saves correctly), and stops the phantom write on initial render when the persisted value already represents the same number.

## Why this is the minimal change

- No schema, API, save workflow, calculation engine, dirty-tracking, tab logic, or other forms touched.
- No change to DirtyFieldWrapper, useDealFields, DealDataEntryPage, or WorkspaceContext.
- Vendor Company stays read-only and continues to display `remainder.toFixed(2)` exactly as before.
- Save still persists the formatted value correctly when a user actually changes inputs.

## Files touched

- `src/components/deal/LoanTermsBalancesForm.tsx` — replace lines 327-332 with the numeric-equality guard above. No other files modified.

## Acceptance check

1. Open DL-2026-0191 → no tab dot, Vendor Company row not highlighted.
2. Open any other previously-saved file with Sold Rate set → no dot.
3. Edit Lenders or Origination → Vendor Company recomputes live, dot appears (real edit).
4. Save → dot disappears.
5. Switch tabs → no random dots.

