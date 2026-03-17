

## Fix: Remove Duplicate Email Field in LienModal

### Problem
In `src/components/deal/LienModal.tsx`, the Email field is rendered twice at lines 176 and 178:
```
Line 176: {renderInlineField('email', 'Email', 'text', isThisLoan)}
Line 178: {renderInlineField('email', 'Email', 'text', isThisLoan)}
```

### Fix
**File: `src/components/deal/LienModal.tsx`**

Remove line 178 (the second `renderInlineField('email', ...)` call). The first instance at line 176 (paired with `balanceAfter` on the right column) remains. The second instance at line 178 (paired with `regularPayment`) is replaced with the `contact` field which is currently missing from the modal grid — or simply replaced with a spacer/nothing to maintain the 2-column grid alignment.

Looking at the grid layout, line 176 has Email on the left and Balance After on the right. Line 178 has the duplicate Email on the left and Regular Payment on the right. Removing line 178 shifts Regular Payment up. To keep the grid intact, we replace line 178 with the `contact` field (which exists in `LienData` but is missing from the modal), maintaining the 2-column layout.

**Single change**: Replace line 178 from:
```typescript
{renderInlineField('email', 'Email', 'text', isThisLoan)}
```
to:
```typescript
{renderInlineField('contact', 'Contact', 'text', isThisLoan)}
```

No other files changed. No database, API, or layout changes.

