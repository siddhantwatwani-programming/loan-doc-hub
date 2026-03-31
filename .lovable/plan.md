

# Fix Field Data Types and State Dropdowns in Other Origination Module

## Summary

Five categories of UI input fixes across four Other Origination forms. All changes are purely presentational — no database, API, or schema modifications.

## Changes

### 1. OriginationApplicationForm.tsx

**A. Currency fields (Income & Expenses) — restrict to numeric input**

The `renderCurrencyField` function (line 133) currently uses `type="text"` with no input filtering. Update it to:
- Add `onKeyDown` handler that blocks non-numeric characters (allow digits, decimal point, backspace, delete, arrows, tab)
- Add `onPaste` handler that strips non-numeric characters
- Keep storing raw numeric string (backward compatible with existing string data)

**B. Contact field — use PhoneInput component**

Line 236 already uses `PhoneInput` for the "Phone" field. Line 253 renders "Credit Score" and line 236 "Contact" — the "Contact" field at line 236 is actually labeled "Contact" but the field at line 236 already uses PhoneInput for "Phone". Looking more carefully:
- Line 236: `renderTextField('Contact', FIELD_KEYS.contact)` — this is a plain text input. Replace with `PhoneInput` component (same as the Phone field pattern on line 237-242).

**C. Credit Score — restrict to numeric input**

Line 253: `renderTextField('Credit Score', FIELD_KEYS.credit_score)` — Replace with a numeric-only input using `inputMode="numeric"`, `onKeyDown` blocking non-digits, max 3 characters (range 300-850 is optional display validation).

### 2. OriginationFeesForm.tsx

**Currency fields in renderFeeRow, renderInsuranceRow, renderSimpleRow — restrict to numeric input**

Lines 513, 517, 543, 549, 553, 573: All `<Input inputMode="decimal">` fields accept any text. Add:
- `onKeyDown` handler blocking non-numeric characters (allow digits, `.`, `-`, backspace, delete, arrows, tab)
- `onPaste` handler stripping non-numeric characters

This covers all `$` fields across all HUD sections (800, 900, 1000, 1100, 1200, 1300).

### 3. OriginationServicingForm.tsx

**State fields → dropdowns**

Two State fields need changing:
- Line 87: `renderTextField('State', keys.state, extraDisabled)` inside `renderAddressBlock` — replace with a `Select` dropdown using `US_STATES` from `src/lib/usStates.ts`
- This affects both the "3rd Party" and "Send Payments To" address blocks

Import `US_STATES` from `@/lib/usStates.ts` and `Select` components (already imported).

### 4. OriginationEscrowTitleForm.tsx

**State fields → dropdowns**

Five State fields rendered as plain text inputs:
- Line 235: `renderTextField('State', FK.escrow_state)` (Escrow)
- Line 267: `renderTextField('State', FK.title_state)` (Title)
- Line 321: `renderTextField('State', FK.trustee_state)` (Trustee)
- Line 203: `<Input>` for `otherKeys.state` inside `renderDeliveryDropdown` (Document Delivery "Other" addresses — 3 instances for title policy, recorded deed, original docs)

Replace each with a `Select` dropdown using `US_STATES`. Import `US_STATES` from `@/lib/usStates.ts`.

### 5. OriginationInsuranceConditionsForm.tsx

**Currency fields — restrict to numeric input**

The `renderCurrencyInline` function (line 77) uses `type="text" inputMode="decimal"` with no filtering. Add:
- `onKeyDown` handler blocking non-numeric characters
- `onPaste` handler stripping non-numeric characters

This covers: max deductible, construction amount, specific dollar amount, flood building/contents, earthquake amount, loss of rents per month/total.

Also, `coverage_earthquake_percent` (line 181) and `coverage_loss_rents_months` (line 192) — add numeric-only restriction.

## Technical Approach

Create a shared numeric input filter utility (or inline it) to avoid code duplication:

```typescript
const numericKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
  const allowed = ['Backspace','Delete','ArrowLeft','ArrowRight','Tab','Home','End'];
  if (allowed.includes(e.key) || e.ctrlKey || e.metaKey) return;
  if (!/[\d.]/.test(e.key)) e.preventDefault();
  if (e.key === '.' && e.currentTarget.value.includes('.')) e.preventDefault();
};
const numericPaste = (e: React.ClipboardEvent<HTMLInputElement>, setter: (v:string)=>void) => {
  e.preventDefault();
  setter(e.clipboardData.getData('text').replace(/[^\d.]/g, ''));
};
```

## Files Modified

1. `src/components/deal/OriginationApplicationForm.tsx` — numeric restriction on currency/credit score fields, PhoneInput for Contact
2. `src/components/deal/OriginationFeesForm.tsx` — numeric restriction on all `$` input fields
3. `src/components/deal/OriginationServicingForm.tsx` — State text inputs → Select dropdowns
4. `src/components/deal/OriginationEscrowTitleForm.tsx` — State text inputs → Select dropdowns
5. `src/components/deal/OriginationInsuranceConditionsForm.tsx` — numeric restriction on all currency/numeric fields

## What Will NOT Change
- No database schema changes
- No API payload structure changes
- No changes to document generation or templates
- No changes to field dictionary entries
- Existing saved string values will still display (backward compatible)
- No layout or visual design changes beyond input type enforcement

