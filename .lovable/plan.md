I checked the RE851D mapping path against the current code, the field dictionary, and the saved deal data for the deal on your screen.

Findings

1. The saved lien data is present and property-scoped

For deal `db7517e9-f124-4031-98c8-3e0f33caf889`, the relevant lien values are saved with indexed keys:

```text
lien1.property = property1
lien1.slt_paid_off = true
lien1.delinquencies_how_many = 4
lien1.existing_payoff_amount = 57
lien1.new_remaining_balance = 24
lien1.currently_delinquent_amount = 234234
lien1.paid_by_loan = true
lien1.source_of_payment = Adwait

lien2.property = property2
lien2.slt_paid_off = true
lien2.delinquencies_how_many = 34
lien2.existing_payoff_amount = 678
lien2.new_remaining_balance = 23423
lien2.currently_delinquent_amount = 55676
lien2.paid_by_loan = true
lien2.source_of_payment = dfgd

lien3.property = property3
```

So this is not a missing-data issue. The data exists and is already tied to Related Property correctly.

2. The source field dictionary mappings are present

The UI/source fields needed for this requirement are present in the field dictionary:

```text
li_slt_paidOff                         Paid Off
pr_li_delinquHowMany                   How Many
li_lt_existingPayoffAmount             Payoff Amount / Remaining Balance
li_gd_newRemainingBalance              New / Remaining Balance
li_gd_currentlyDelinquentAmount        Currently Delinquent Amount
pr_li_paidByLoan                       Will be Paid by this Loan
pr_li_sourceOfPayment                  Source of Payment
pr_li_lienProper                       Related Property
```

The generated/runtime document aliases such as these are not all in the field dictionary:

```text
pr_li_encumbranceOfRecord_N_yes_glyph
pr_li_encumbranceOfRecord_N_no_glyph
pr_li_delinqu60day_N_yes_glyph
pr_li_currentDelinqu_N_yes_glyph
pr_li_delinquencyPaidByLoan_N_yes_glyph
```

That is acceptable because these are generated aliases, not directly persisted UI fields. Adding dozens of indexed/glyph aliases to the field dictionary is not the right fix.

3. Primary root cause: the `_N` rewrite does not handle tags where `_N` is in the middle

Your template uses tags like:

```text
{{pr_li_encumbranceOfRecord_N_yes_glyph}}
{{pr_li_encumbranceOfRecord_N_no_glyph}}
{{pr_li_delinqu60day_N_yes_glyph}}
{{pr_li_currentDelinqu_N_yes_glyph}}
{{pr_li_delinquencyPaidByLoan_N_yes_glyph}}
```

The current RE851D preprocessing allowlist includes these tags, but the replacement logic only replaces `_N` when it appears at the end of the tag:

```text
pr_li_sourceOfPayment_N        -> rewrites correctly to pr_li_sourceOfPayment_1
pr_li_delinquHowMany_N         -> rewrites correctly to pr_li_delinquHowMany_1

pr_li_currentDelinqu_N_yes_glyph -> does not rewrite, because _N is not at the end
```

That means the checkbox glyph tags remain as literal `_N_yes_glyph` tags and then cannot resolve to the published per-property values like:

```text
pr_li_currentDelinqu_1_yes_glyph
pr_li_currentDelinqu_2_yes_glyph
```

This explains why the YES/NO checkbox fields are still blank or unresolved.

4. Secondary root cause: the previous fallback shield writes some defaults in the wrong key order

The generator currently defaults some glyph aliases as:

```text
pr_li_encumbranceOfRecord_yes_glyph_1
```

But the template/publisher expects:

```text
pr_li_encumbranceOfRecord_1_yes_glyph
```

So even the default NO-checked fallback does not help for no-lien / missing-bucket cases.

5. Template change is not required

The template pattern is conceptually fine:

```text
{{pr_li_<question>_N_yes_glyph}} YES
{{pr_li_<question>_N_no_glyph}} NO
```

I do not recommend changing the template to hard-coded `_1`, `_2`, etc. That would make it fragile and would not scale cleanly across property sections.

One minor template note: the screenshot shows Q3 as `{{pr_p_delinquHowMany_N}}` while the requirement is lien-based. The code already mirrors the lien-derived count into `pr_p_delinquHowMany_N`, so this can remain as-is. For consistency it could be changed later to `{{pr_li_delinquHowMany_N}}`, but it is not required for the fix.

Implementation plan

1. Fix the RE851D `_N` rewrite logic in `supabase/functions/generate-document/index.ts`

Update the indexed tag replacement so it replaces `_N` wherever it appears as the property index token, not only at the end.

Expected transformations:

```text
pr_li_encumbranceOfRecord_N_yes_glyph  -> pr_li_encumbranceOfRecord_1_yes_glyph
pr_li_encumbranceOfRecord_N_no_glyph   -> pr_li_encumbranceOfRecord_1_no_glyph
pr_li_delinqu60day_N_yes_glyph         -> pr_li_delinqu60day_1_yes_glyph
pr_li_currentDelinqu_N_yes_glyph       -> pr_li_currentDelinqu_1_yes_glyph
pr_li_delinquencyPaidByLoan_N_yes_glyph -> pr_li_delinquencyPaidByLoan_1_yes_glyph
pr_li_sourceOfPayment_N                -> pr_li_sourceOfPayment_1
```

2. Correct the anti-fallback shield for glyph aliases

Generate default keys in the same order the template uses:

```text
pr_li_<question>_<propertyIndex>_yes_glyph
pr_li_<question>_<propertyIndex>_no_glyph
```

Instead of:

```text
pr_li_<question>_yes_glyph_<propertyIndex>
```

Defaults for properties with no matching lien should be:

```text
YES = ☐
NO  = ☒
```

3. Keep the per-property aggregation logic, but make it more explicit

For each property, aggregate only liens where:

```text
lienK.property === propertyN
```

Then publish:

```text
Q1 pr_li_encumbranceOfRecord_N = any linked lien has slt_paid_off checked
Q2 pr_li_delinqu60day_N = sum/count field > 0
Q3 pr_li_delinquHowMany_N = summed Times 60-days Delinquent value
Q4 pr_li_currentDelinqu_N = remaining balance amount > 0
Q5 pr_li_delinquencyPaidByLoan_N = any linked lien has paid_by_loan checked
Q6 pr_li_sourceOfPayment_N = source_of_payment text from linked liens
```

4. Add a safety pass for all four YES/NO question rows

There is currently a safety pass only for “Do any of these payments remain unpaid?”. I will add the same style of anchored safety for:

```text
Are there any encumbrances of record
Over the last 12 months, were any payments more than 60 days late
Do any of these payments remain unpaid
will the proceeds of the subject loan be used to cure the delinquency
```

This makes the output resilient even if Word splits the merge tags or glyph runs unexpectedly.

5. No database/schema change and no template change

I will not change the field dictionary unless you explicitly want validation-only aliases added. For generation, the correct fix is in the document-generation logic.

Expected output after the fix using current saved data

```text
Property 1:
Q1 Paid Off             YES checked
Q2 60-day count > 0     YES checked
Q3 How many             4
Q4 Remaining Balance    YES checked
Q5 Paid by this Loan    YES checked
Q6 Source               Adwait

Property 2:
Q1 Paid Off             YES checked
Q2 60-day count > 0     YES checked
Q3 How many             34
Q4 Remaining Balance    YES checked
Q5 Paid by this Loan    YES checked
Q6 Source               dfgd

Property 3:
No populated lien questionnaire values beyond its linked/available lien data; YES/NO fields default to NO checked where no relevant lien values exist.
```

After implementation, regenerate RE851D and verify the generated document, not only the mapped template.