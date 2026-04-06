

## Plan: Update Insurance Modal/Form and Table Grid

### Summary
Modify the Insurance modal (Add/Edit popup) to remove "Insured's Name" and "Coverage", convert "Insurance Company" to a contacts dropdown, and update the table grid columns accordingly. The modal already has Annual Premium, Frequency, Impounds, and Insurance Tracking fields — no changes needed there.

### What Changes

**1. InsuranceModal.tsx** — 3 edits:
- **Remove** line 164: `renderInlineField('insuredName', "Insured's Name")`
- **Remove** lines 168-184: The "Coverage" currency field block
- **Convert** line 165: Change `renderInlineField('companyName', 'Ins. Company')` to a Select dropdown that fetches contacts (all contact types) from the database, similar to the "Other" dropdown pattern in LoanTermsPenaltiesForm

**2. InsuranceTableView.tsx** — Update grid columns:
- **Remove** "Coverage" column (header + cell)
- **Add** "Annual Premium" column (currency formatted)
- **Add** "Frequency" column
- Update EXPORT_COLUMNS and SEARCH_FIELDS accordingly
- Update colSpan for empty state row

**3. PropertyInsuranceForm.tsx** — 3 edits:
- **Remove** the "Insured's Name" field block (lines 125-130)
- **Remove** the "Coverage" field block (lines 170-189)
- **Convert** "Company Name" (lines 132-137) to a Select dropdown fetching contacts
- **Add** "Annual Premium" currency field (new key `annualPremium`)
- **Add** "Frequency" dropdown (Monthly, Quarterly, Semiannually, Annually)
- **Add** "Impounds" section title above "Active" checkbox
- **Add** "Insurance Tracking" section with 3 checkboxes: Attempted Agent, Attempted Borrower, Notified Lender

**4. fieldKeyMap.ts** — Add new keys to `PROPERTY_INSURANCE_KEYS`:
- `annualPremium: 'property1.insurance_annual_premium'`
- `frequency: 'property1.insurance_frequency'`
- `impoundsActive: 'property1.insurance_impounds_active'`
- `attemptAgent: 'property1.insurance_attempt_agent'`
- `attemptBorrower: 'property1.insurance_attempt_borrower'`
- `lenderNotified: 'property1.insurance_lender_notified'`

**5. legacyKeyMap.ts** — Add corresponding legacy mappings for the new keys

### Contacts Dropdown Approach
The Insurance Company Select will use a `useEffect` to fetch from `supabase.from('contacts').select('id, full_name, company, contact_type')` and display as "Company (Name) — Type". The selected value (contact name/company) is stored as a string in the existing `companyName` field — no schema change needed.

### No Database/Schema Changes
All new fields persist via the existing JSONB `deal_section_values` store using the `insuranceN.xxx` prefix pattern already in place. No new tables or columns needed.

### Files Changed
| File | Change |
|---|---|
| `src/components/deal/InsuranceModal.tsx` | Remove Insured's Name + Coverage; Company → contacts dropdown |
| `src/components/deal/InsuranceTableView.tsx` | Remove Coverage column; add Annual Premium + Frequency columns |
| `src/components/deal/PropertyInsuranceForm.tsx` | Remove Insured's Name + Coverage; add Annual Premium, Frequency, Impounds, Insurance Tracking |
| `src/lib/fieldKeyMap.ts` | Add 6 new keys to PROPERTY_INSURANCE_KEYS |
| `src/lib/legacyKeyMap.ts` | Add 6 legacy mappings |

