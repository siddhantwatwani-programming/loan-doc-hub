

## Plan: Fix "Same as Primary Address" Logic Across All Main Forms

### Problem
The "Same as Primary Address" checkboxes across forms only copy values once on check. They do not dynamically sync when the primary address is updated, breaking the expected behavior. The Property form's "Copy Borrower's Address" checkbox has no copy logic at all.

### Root Cause
Each form's `handleSameAsPrimaryChange` copies the four address fields on checkbox click but has no `useEffect` to watch for subsequent primary address changes. The `OriginationServicingForm` already implements this correctly with a `useEffect` -- the same pattern needs to be applied everywhere.

### Changes (5 files)

**1. `src/components/deal/BorrowerPrimaryForm.tsx`**
- Add `useEffect` that watches `mailingSameAsPrimary` and all four primary address values (`primaryStreet`, `primaryCity`, `primaryState`, `primaryZip`)
- When `mailingSameAsPrimary` is true, auto-copy primary values to mailing fields on every primary address change
- Mailing fields are already disabled when checked (line 310-326) -- no change needed there

**2. `src/components/deal/CoBorrowerPrimaryForm.tsx`**
- Add `useEffect` watching `mailing_same_as_primary` and all four primary address values
- Same dynamic sync pattern: when checked, copy `primary_address.*` to `mailing_address.*`
- Fields already disabled when checked (line 216-231)

**3. `src/components/deal/BorrowerAdditionalGuarantorForm.tsx`**
- Add `useEffect` watching `mailingSameAsPrimary` and primary address fields
- Same sync pattern as Borrower

**4. `src/components/deal/LenderInfoForm.tsx`**
- Add `useEffect` watching `mailingSameAsPrimary` and primary address fields (`primaryStreet`, `primaryCity`, `primaryState`, `primaryZip`)
- Same sync pattern
- Refactor the inline checkbox handler (lines 435-443) to only toggle the flag (the `useEffect` handles the copy)

**5. `src/components/deal/PropertyDetailsForm.tsx`**
- Add actual copy logic for "Copy Borrower's Address" checkbox
- When `copyBorrowerAddress` is true, read `borrower.address.street`, `borrower.address.city`, `borrower.state`, `borrower.address.zip` from `values` and copy to `property1.street`, `property1.city`, `property1.state`, `property1.zip`
- Add `useEffect` for dynamic sync when borrower address changes while checkbox is checked
- Disable address fields (street, city, state, zip) when checkbox is checked

### Pattern (same as existing OriginationServicingForm)
```typescript
const isSameAsPrimary = getBoolValue('mailingSameAsPrimary');
useEffect(() => {
  if (isSameAsPrimary) {
    const mappings = [
      ['primaryStreet', 'mailingStreet'],
      ['primaryCity', 'mailingCity'],
      ['primaryState', 'mailingState'],
      ['primaryZip', 'mailingZip'],
    ];
    mappings.forEach(([src, dst]) => {
      if (getValue(src) !== getValue(dst)) handleChange(dst, getValue(src));
    });
  }
}, [isSameAsPrimary, /* primary address values */]);
```

### What This Preserves
- All existing field keys and database mappings remain unchanged
- No changes to modals, APIs, database schema, or document generation
- No changes to UI layout or component structure
- Existing disable logic on mailing fields stays as-is

