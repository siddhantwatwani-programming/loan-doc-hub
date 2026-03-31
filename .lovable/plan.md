

# Fix: State Dropdowns Missing in Lender Contact Forms

## Problem
In both the **Create Lender** modal (`CreateContactModal.tsx`) and the **Lender Detail** form (`ContactLenderDetailForm.tsx`), the State fields for Primary Address and Mailing Address are plain text `Input` fields instead of `Select` dropdowns using `US_STATES`.

## Fix

### File 1: `src/components/contacts/CreateContactModal.tsx`
- **Lines 307 and 317**: Replace `renderInline('State', 'primary_address.state')` and `renderInline('State', 'mailing.state', 'text', isSameAsPrimary)` with `Select` dropdowns using `US_STATES`, matching the existing `renderSelect` pattern but with disabled support for the mailing field when `isSameAsPrimary` is true.

### File 2: `src/components/contacts/ContactLenderDetailForm.tsx`
- **Line 227**: Replace the Primary Address State `Input` with a `Select` dropdown using `US_STATES`.
- **Lines 272-277**: Replace the Mailing Address State `Input` with a `Select` dropdown using `US_STATES`, with disabled state when `sameAsPrimary` is true.
- Add import for `US_STATES` from `@/lib/usStates`.

### Pattern (from existing codebase)
```tsx
import { US_STATES } from '@/lib/usStates';

<Select value={form.state} onValueChange={(v) => set('state', v)} disabled={isDisabled}>
  <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
  <SelectContent>
    {US_STATES.map(s => (<SelectItem key={s} value={s}>{s}</SelectItem>))}
  </SelectContent>
</Select>
```

## Files Modified
| File | Change |
|---|---|
| `src/components/contacts/CreateContactModal.tsx` | Replace 2 State text inputs with Select dropdowns |
| `src/components/contacts/ContactLenderDetailForm.tsx` | Replace 2 State text inputs with Select dropdowns, add US_STATES import |

## What Will NOT Change
- No database, API, layout, or other component changes
- Borrower and Broker forms are unaffected

