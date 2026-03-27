
## Deep analysis

I traced the full path for `{{br_ag_fullName}}` and found the current fix is still failing because of **selection order**, not tag resolution.

### What is confirmed working
- The generated document being produced is the template record:
  - `Personal Guaranty by Third Party`
  - template id `72ee9d10-e592-4389-b0ed-aaa0eeda6952`
- The tag mapping is valid:
  - `br_ag_fullName` exists in `field_dictionary`
  - `canonical_key = br_p_guarantoFullName`
- The document parser shows the final generated DOCX still has:
  - `Guarantor:` blank on page 4
- The deal has these participants:
  - borrower 1: `Adwait` with capacity `Borrower (Primary)`
  - borrower 2: `xyz abc` with capacity `Borrower`
- There is still no saved borrower-section field value for:
  - `br_ag_fullName`
  - `br_p_guarantoFullName`

## Root cause

The current fallback logic for guarantor is blocked by the **co-borrower fallback**.

Current flow in `generate-document/index.ts`:
1. `primaryBorrower` = participant with capacity containing `"primary"` or first borrower
2. `coBorrower` = participant with capacity containing `"co-borrower"` **or any non-primary borrower**
3. `guarantorParticipant` = participant with capacity containing `"additional guarantor"` **or any borrower that is not primary and not co-borrower**

For `DL-2026-0170`:
- no participant has capacity `"additional guarantor"`
- second borrower (`xyz abc`) gets picked as `coBorrower` by fallback
- guarantor fallback then excludes that same participant
- result: no guarantor participant remains, so `br_ag_fullName` is never injected

So the bug is not:
- template issue
- canonical key issue
- merge tag alias issue
- database schema issue

It is specifically this fallback collision:
```text
second borrower participant
  -> consumed by coBorrower fallback
  -> unavailable for guarantor fallback
  -> br_ag_fullName stays blank
```

## Minimal fix

Update only `supabase/functions/generate-document/index.ts` so that **Additional Guarantor selection happens before / independently from co-borrower fallback**.

### Targeted implementation
Use this precedence:

1. `primaryBorrower`
2. `guarantorParticipant`
   - explicit capacity contains `"additional guarantor"`
   - otherwise fallback to a non-primary borrower who is not trustee/co-trustee
3. `coBorrower`
   - explicit capacity contains `"co-borrower"`
   - otherwise fallback to a borrower who is not primary **and not the chosen guarantor**

## Exact change scope

### File
- `supabase/functions/generate-document/index.ts`

### Change
Reorder and tighten only the participant selection logic around:
- `primaryBorrower`
- `coBorrower`
- `guarantorParticipant`

### Result
For this deal:
- `Adwait` stays primary borrower
- `xyz abc` becomes guarantor
- `br_ag_fullName` / `br_p_guarantoFullName` get injected
- no template, UI, DB, or other document logic changes

## Why this is the safest fix
- It is isolated to one edge-function file
- It changes only borrower participant role assignment for document generation
- It preserves existing direct-capacity matches
- It only affects fallback behavior when capacities are incomplete/mislabeled
- It satisfies your requirement to avoid unrelated changes

## Validation plan
After implementation, verify:
1. Generate `Personal Guaranty by Third Party` again for `DL-2026-0170`
2. Confirm page 4 shows:
   - `Guarantor: xyz abc`
3. Confirm borrower fields still resolve to `Adwait`
4. Confirm no other templates are changed unless they rely on this same fallback path

## Technical details
Proposed logic shape:
```typescript
const primaryBorrower = ...;

const guarantorParticipant =
  explicitAdditionalGuarantor
  || borrowerParticipants.find(p => {
       if (!p.contact_id || p === primaryBorrower) return false;
       const capLower = ...;
       return !capLower.includes("primary")
         && !capLower.includes("co-borrower")
         && !capLower.includes("trustee")
         && !capLower.includes("co-trustee");
     });

const coBorrower =
  explicitCoBorrower
  || borrowerParticipants.find(p => {
       if (!p.contact_id || p === primaryBorrower || p === guarantorParticipant) return false;
       ...
     });
```

This is the minimal correction needed to make `{{br_ag_fullName}}` populate for the current deal.
