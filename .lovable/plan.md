

# Fix: Enforce US Currency Formatting in Other Origination Sections

## Summary

Add a shared utility to format/unformat currency values with comma-separated thousands and 2 decimal places. Apply `onBlur` formatting and `onFocus` unformatting to all currency input fields across the origination forms. Values are stored as plain decimals (e.g., `3423.00`) and displayed as `3,423.00`.

## Approach

### Step 1: Add formatting utilities to `numericInputFilter.ts`

Add two new exported functions:

- **`formatCurrencyDisplay(value: string): string`** — Takes a raw numeric string, returns comma-formatted with 2 decimal places (e.g., `"3423"` → `"3,423.00"`, `"50.5"` → `"50.50"`). Returns empty string for empty/invalid input.
- **`unformatCurrencyDisplay(value: string): string`** — Strips commas, returns raw decimal string for editing (e.g., `"3,423.00"` → `"3423.00"`).

### Step 2: Add `onBlur`/`onFocus` handlers to currency inputs in each form

For each form, add `onBlur` to format the value and `onFocus` to strip commas for editing. Also update `numericKeyDown` to allow commas (since formatted values may contain them when the field gains focus before the unformat fires).

**Files to modify:**

| File | Currency helper | Fields affected |
|---|---|---|
| `src/lib/numericInputFilter.ts` | Add `formatCurrencyDisplay`, `unformatCurrencyDisplay` | N/A — utility only |
| `src/components/deal/OriginationApplicationForm.tsx` | Update `renderCurrencyField` | 11 income/expense fields |
| `src/components/deal/OriginationFeesForm.tsx` | Update `renderFeeRow`, `renderInsuranceRow` | All `_others` and `_broker` fee columns |
| `src/components/deal/RE885ProposedLoanTerms.tsx` | Update `CurrencyInput` component | ~10 currency fields |
| `src/components/deal/OriginationInsuranceConditionsForm.tsx` | Update `renderCurrencyInline` | ~6 coverage/deductible fields |
| `src/components/deal/OriginationPropertyForm.tsx` | Update `renderCurrencyField` | 5 currency fields (purchase price, down payment, etc.) |

### Step 3: Handle paste with comma stripping

Update `numericPaste` (or create a variant) to strip commas from pasted values before cleaning, so pasting `"3,423.00"` works correctly.

## What Will NOT Change
- No field keys modified
- No database schema changes
- No document generation changes
- No layout or UI structure changes
- Non-currency fields (text, checkbox, date, phone, email, ZIP) untouched
- Stored values remain plain decimals — commas are display-only

## Technical Detail

```typescript
// numericInputFilter.ts additions
export const formatCurrencyDisplay = (value: string): string => {
  if (!value) return '';
  const num = parseFloat(value.replace(/,/g, ''));
  if (isNaN(num)) return '';
  return num.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
};

export const unformatCurrencyDisplay = (value: string): string => {
  return value.replace(/,/g, '');
};
```

Usage pattern in each currency input:
```tsx
<Input
  value={getValue(key)}
  onChange={(e) => setValue(key, e.target.value.replace(/,/g, ''))}
  onBlur={() => { const raw = getValue(key); if (raw) setValue(key, formatCurrencyDisplay(raw)); }}
  onFocus={() => { const raw = getValue(key); if (raw) setValue(key, unformatCurrencyDisplay(raw)); }}
  onKeyDown={numericKeyDown}
  ...
/>
```

The `onChange` strips commas before storing, so the backend always receives clean decimals. `onBlur` adds formatting for display. `onFocus` strips formatting for easy editing.

