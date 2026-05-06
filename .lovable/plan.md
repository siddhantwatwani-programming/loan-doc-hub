I did a deep read of the current RE851D generation logic, the generated `Re851d_v25.docx`, and the uploaded mapped template variant.

Findings

1. This is not only a template issue.
   The generated document already receives some lien values:
   - Property #1 B/If YES how many = `4`
   - Property #1 source = `Adwait`
   - Property #2 G/If YES how many = `34`
   - Property #2 source = `dfgd`

   That proves the lien data is being read and grouped by property at least partially.

2. The main failure is checkbox rendering and field alias mismatch.
   In the generated document, several YES/NO rows show plain text `YES` / `NO`, duplicated `[ ] YES [ ] NO`, or no checkmark at all. This means the template is not consistently using merge tags/checkbox controls that match the aliases published by `generate-document`.

3. The generator currently publishes lien aliases like:
   - `pr_li_encumbranceOfRecord_1_yes/_no/_glyph`
   - `pr_li_delinqu60day_1_yes/_no/_glyph`
   - `pr_li_currentDelinqu_1_yes/_no/_glyph`
   - `pr_li_delinquencyPaidByLoan_1_yes/_no/_glyph`
   - `pr_li_delinquHowMany_1`
   - `pr_li_sourceOfPayment_1`

   But the actual template appears to have a mix of static text, old property-level aliases, and/or placeholders that are not being replaced by these newer `pr_li_*` aliases.

4. There is also a real code-side bug for the requested rules:
   The UI label says “Remaining Balance”, but the save key is `existing_payoff_amount`. The generation logic currently uses `new_remaining_balance` for Q4. That can produce wrong “Do any payments remain unpaid?” results when the user is entering the visible Remaining Balance field.

5. The post-render safety passes exist, but they are too narrow for this template variant.
   The current safety passes look for anchors and nearby controls, but `Re851d_v25` has unusual layout/line breaks and sometimes has labels without nearby checkbox glyphs/SDTs. That is why the logs only show the remain-unpaid safety pass firing once, while encumbrance, 60-day, and cure-delinquency are not visibly fixed.

Plan to fix with minimal changes

1. Update only the RE851D document generation logic in `supabase/functions/generate-document/index.ts`.
   No schema changes. No UI refactor. No database changes. No save API changes.

2. Make the lien-questionnaire publisher more robust:
   - Q1: Encumbrance of record = `slt_paid_off` true for liens belonging to the current property.
   - Q2: 60 days late = `delinquencies_how_many > 0` for liens belonging to the current property.
   - Q3: How many = sum/populate the `delinquencies_how_many` value per property.
   - Q4: Remain unpaid = use the visible Remaining Balance key first (`existing_payoff_amount`) and fallback to `new_remaining_balance` / `currently_delinquent_amount` if needed.
   - Q5: Cure delinquency = `paid_by_loan` true for liens belonging to the current property.
   - Q6: Source of funds = `source_of_payment`, joined per property when multiple matching liens exist.

3. Publish both existing `pr_li_*` aliases and compatibility `pr_p_*` aliases for the same per-property results.
   This is important because the mapped template may still be using older property-questionnaire field names. I will publish aliases such as:
   - `pr_p_paidByLoan_N`
   - `pr_p_currentDelinqu_N`
   - `pr_p_delinqu60day_N`
   - `pr_p_delinquHowMany_N`
   - `pr_p_sourceOfPaymen_N`

   This avoids forcing a template change for every existing old tag.

4. Expand the `_N` template preprocessing list to include the missing property-level compatibility tags.
   This ensures tags like `{{pr_p_currentDelinqu_N}}` become `{{pr_p_currentDelinqu_1}}`, `{{pr_p_currentDelinqu_2}}`, etc. inside each property block.

5. Harden the post-render safety passes for this exact RE851D template style.
   I will make the safety passes tolerate:
   - `payments more than 60 days late` wording, not only `60-day delinquent`
   - line breaks between the question and YES/NO labels
   - labels/glyphs that appear before or after the question across a page break
   - static `YES`/`NO` labels when checkbox controls are missing

   The goal is mutually exclusive output for all four YES/NO pairs per property, without touching unrelated document logic.

6. Add focused diagnostics only around this RE851D lien block.
   The logs should show, per property:
   - which lien prefixes were included
   - paidOff / howMany / remainingBalance / paidByLoan / source values
   - final boolean results for Q1, Q2, Q4, Q5

7. Template recommendation.
   You do not strictly need to change the template if we implement the compatibility aliases and stronger safety passes. However, the clean long-term template setup is to use these per-property tags inside each property block:

```text
Q1 Encumbrance of record:
{{pr_li_encumbranceOfRecord_N_yes_glyph}} YES  {{pr_li_encumbranceOfRecord_N_no_glyph}} NO

Q2 60 days late:
{{pr_li_delinqu60day_N_yes_glyph}} YES  {{pr_li_delinqu60day_N_no_glyph}} NO

Q3 How many:
{{pr_li_delinquHowMany_N}}

Q4 Payments remain unpaid:
{{pr_li_currentDelinqu_N_yes_glyph}} YES  {{pr_li_currentDelinqu_N_no_glyph}} NO

Q5 Loan cure delinquency:
{{pr_li_delinquencyPaidByLoan_N_yes_glyph}} YES  {{pr_li_delinquencyPaidByLoan_N_no_glyph}} NO

Q6 Source of funds:
{{pr_li_sourceOfPayment_N}}
```

Expected result after implementation

- Property #1 only uses liens where Related Property = `property1`.
- Property #2 only uses liens where Related Property = `property2`.
- Property #3 only uses liens where Related Property = `property3`.
- YES/NO values are mutually exclusive.
- The “how many” and source fields continue to populate.
- Existing document generation flow remains intact.