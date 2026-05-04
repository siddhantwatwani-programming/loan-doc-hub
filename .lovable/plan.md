I found why the two shown RE851D fields are not populating:

1. The template is using indexed document tags such as:
   - `{{pr_p_delinquHowMany_N}}`
   - `{{pr_li_sourceOfPayment_N}}`

2. The UI fields being used are in CSR / Enter File Data → Property → Liens:
   - Modal: `src/components/deal/LienModal.tsx`
     - “60-day + Delinquencies” → `delinquencies60day`
     - “How Many” → `delinquenciesHowMany`
     - “Currently Delinquent” → `currentlyDelinquent`
     - “Will be Paid by this Loan” → `paidByLoan`
     - “If No, Source of Payment” → `sourceOfPayment`
   - Detail form: `src/components/deal/LienDetailForm.tsx`
     - “Number of 60-day in 12 months” → `delinquenciesHowMany`
     - “If No, Provide Source” → `sourceOfPayment`
     - plus the related delinquency checkboxes.

3. The saved dictionary mappings already exist for these UI fields:
   - `lien.delinquencies_60day` → `pr_li_delinqu60day`
   - `lien.delinquencies_how_many` → `pr_li_delinquHowMany`
   - `lien.currently_delinquent` → `pr_li_currentDelinqu`
   - `lien.paid_by_loan` → `pr_li_paidByLoan`
   - `lien.source_of_payment` → `pr_li_sourceOfPayment`

4. The current document generator reads the wrong stored key for the “paid by loan” UI field. It currently looks for `lienN.paid_by_loan`, but the saved/loaded field key resolves from dictionary as `lienN.paidByLoan` because the dictionary key is `pr_li_paidByLoan`.

5. The current generator also only aggregates lien delinquency data when the lien has `lienN.property` populated exactly as `property1`, `property2`, etc. If the lien property association is missing or not normalized, `{{..._N}}` fields remain blank even when the UI fields have values.

Implementation plan:

1. Update only `supabase/functions/generate-document/index.ts`.

2. In the existing RE851D lien delinquency mapping block, make the value lookups tolerant of both stored/UI key forms, without changing UI, schema, APIs, or template flow:
   - Read `paidByLoan` from either:
     - `lienN.paid_by_loan`
     - `lienN.paidByLoan`
     - `pr_li_paidByLoan_N` / existing canonical aliases if present
   - Read `sourceOfPayment` from either:
     - `lienN.source_of_payment`
     - `lienN.sourceOfPayment`
   - Read `delinquenciesHowMany` from either:
     - `lienN.delinquencies_how_many`
     - `lienN.delinquenciesHowMany`
   - Read `delinquencies60day` and `currentlyDelinquent` similarly for both snake_case and camelCase variants.

3. Keep the existing conditional behavior but make numeric checks explicit:
   - Treat “How Many” as populated only when numeric value is greater than 0.
   - Use `howMany > 0` to derive the 60-day delinquency YES checkbox when the explicit checkbox is not set.
   - Normalize null/undefined/blank values to empty strings.

4. Preserve existing per-property indexing logic, but add a safe fallback:
   - If a lien has `property=propertyN`, continue using that N.
   - If no property is set and the document has only one property context, map it to property 1 so `{{..._N}}` can populate instead of staying blank.
   - Do not overwrite valid indexed values from correctly associated liens.

5. Ensure both aliases needed by the screenshots are populated:
   - `pr_p_delinquHowMany_N` for `{{pr_p_delinquHowMany_N}}`
   - `pr_li_sourceOfPayment_N` for `{{pr_li_sourceOfPayment_N}}`

6. Add a very small debug log inside the existing document generator logging path showing which lien UI keys were resolved for RE851D delinquency mapping. This will help confirm payload data is present without changing any user-facing UI.

No database schema changes, no new tables, no UI layout changes, no API changes, and no document template changes.