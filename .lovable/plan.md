
Deep technical analysis: why `{{br_p_fullName}}` is not populating

What I confirmed
1. The placeholder is valid
   - The uploaded DOCX contains `{{br_p_fullName}}` twice.
   - It also contains `{{ln_p_loanNumber}}`, which confirms the template uses the normal merge-tag path.

2. The generator does not read Contacts
   - `supabase/functions/generate-document/index.ts` builds its merge-value map only from:
     - `template_field_maps`
     - `field_dictionary`
     - `deal_section_values`
   - I found no `contacts` query anywhere in the document-generation function or shared resolver.
   - So participant data that only exists in the Contacts module is invisible to generation.

3. The contact migration is only partially bridged today
   - `LoanTermsDetailsForm.tsx` uses `BorrowerIdSearch` / `BrokerIdSearch` against `contacts`.
   - When a borrower is selected, the deal stores only:
     - `loan_terms.details_borrower_id`
     - `loan_terms.details_borrower_name`
   - It does not hydrate a `borrower` deal section or copy full borrower contact fields into `deal_section_values`.
   - Contact detail pages save to `contacts.contact_data` via `useContactsCrud.ts`, not to deal participant sections.

4. The current deal proves this split
   - Deal: `e78b793b-94c9-4e22-866f-f3633330fd60`
   - Current persisted deal data contains:
     - `loan_terms.details_borrower_id = B-00002`
     - `loan_terms.details_borrower_name = Ravi`
     - a `broker` section with `broker1.*` fields
   - There is still no `borrower` section row in `deal_section_values`.
   - `deals.borrower_name` is still `null`.

5. `br_p_fullName` already has a fallback, but only from deal data
   - The generator already tries, in order:
     - `borrower1.full_name`
     - `borrower.full_name`
     - assembled borrower name parts
     - `loan_terms.details_borrower_name`
   - That means `br_p_fullName` can work only if the borrower name has been copied into deal data first.

Why the placeholder is blank
```text
Contact section data
  -> saved to contacts table
  -> NOT read by generate-document

Deal generation
  -> reads only deal_section_values
  -> expects borrower/lender/broker values there
  -> missing participant data => blank merge tags
```

Confirmed root cause
- Your architectural diagnosis is correct:
  the Borrower/Lender/Broker move to Contacts outpaced the document-generation data source.
- The generator still relies on deal-scoped participant values, while the source of truth is now often the Contacts table.
- Therefore:
  - borrower placeholders fail when borrower data exists only in Contacts
  - lender placeholders fail when lender data exists only in Contacts
  - broker placeholders fail unless broker data was also mirrored into deal data

Important finding about this specific deal
- The currently stored generated document for this template was created at `2026-03-16 16:37`.
- The borrower-name value now in `loan_terms.details_borrower_name` was saved later at about `16:56`.
- So the generated file you are likely viewing predates the borrower-name save.
- That explains why the existing output is still blank even though the deal now has a minimal borrower-name bridge.

Additional data-quality issue
- Contact `B-00002` currently has:
  - top-level `full_name = Ravi`
  - `first_name = Ravi`
  - `last_name = Chauhan`
- So even if generation reads the current loan-details bridge, it will likely populate `Ravi`, not `Ravi Chauhan`, unless name assembly or contact normalization is added.

Broader impact
- This is not limited to `{{br_p_fullName}}`.
- Any Borrower/Lender/Broker placeholder that depends on participant fields now living only in Contacts will remain blank unless one of these is true:
  1. the field is mirrored into `deal_section_values`, or
  2. the generator is enhanced to resolve participant contacts directly

Minimum safe implementation path if approved
1. Keep existing generation logic intact.
2. Add a narrow participant-contact lookup layer in `generate-document`:
   - Borrower: resolve from `loan_terms.details_borrower_id` / `details_borrower_name`
   - Broker: resolve from deal-stored broker/contact IDs where available
   - Lender: resolve from lender IDs already captured in funding/loan data
3. Map contact values into the existing field namespaces the generator already knows:
   - borrower / `br_p_*`
   - lender / `ld_p_*`
   - broker / `bk_p_*` / `Broker.*`
4. Preserve current deal-based values as highest priority so existing working templates do not regress.
5. Regenerate the document after lookup is added, because the currently stored generated file is stale.

Bottom line
- The placeholder is not failing because of DOCX parsing.
- It is failing because document generation still reads deal data, while participant data has moved to Contacts.
- For this exact deal, there is also a stale-output factor: the only generated file was created before the borrower name was saved into loan details.
