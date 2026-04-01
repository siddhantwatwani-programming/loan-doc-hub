

# Fix: US Currency Formatting Preventing Data From Saving

## Problem
Multiple form components (Servicing, Penalties, Lien, Insurance, Charges, Origination, Property, etc.) store **formatted** currency values with commas (e.g., "3,423.00") back into the values state on blur via `formatCurrencyDisplay()`. When `saveDraft` runs, it calls `parseFloat(stringValue)` on these values. `parseFloat("3,423.00")` returns `3` (stops at the first comma), so the backend stores the wrong number. On reload, the corrupted value appears blank or wrong.

## Root Cause
`src/hooks/useDealFields.ts` line 881: `parseFloat(stringValue)` does not strip commas before parsing.

## Fix (single file: `src/hooks/useDealFields.ts`)

**Line 881** — Strip commas and dollar signs before parsing numeric values:

```typescript
// Before
const numValue = parseFloat(stringValue);

// After
const numValue = parseFloat(stringValue.replace(/[,$]/g, ''));
```

This is a single-line fix in the save path that ensures all currency/number/percentage values are cleaned before storage, regardless of which form component produced them. It fixes all 10+ affected forms at once without touching any UI code.

## What Will NOT Change
- No UI formatting changes — fields still display `$3,423.00`
- No database schema changes
- No API changes
- No changes to any form components
- No changes to document generation logic

