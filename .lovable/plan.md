

## Plan: Borrower Form Updates & Global Calendar Fix

### Changes Overview

| # | Requirement | Files |
|---|------------|-------|
| 1 | Move Capacity below "Last" in Borrower Primary | `BorrowerPrimaryForm.tsx` |
| 2 | Update Capacity dropdown options (Borrower, Co-borrower, Trustee, Co-Trustee, Managing Member, Authorized Signer, Additional Guarantor) | `BorrowerPrimaryForm.tsx` |
| 3 | Add "Notes" textarea below Account Type in Banking | `BorrowerBankingForm.tsx`, `fieldKeyMap.ts` |
| 4 | Update 1098 Designated Recipient dropdown (Primary, Co-borrower, Additional Guarantor, Other) + auto-populate logic | `BorrowerTaxDetailForm.tsx` |
| 5 | Move Capacity below "Last" globally | `BorrowerAdditionalGuarantorForm.tsx`, `CoBorrowerPrimaryForm.tsx`, `BorrowerModal.tsx`, `CoBorrowerModal.tsx`, `LenderInfoForm.tsx` |
| 6 | Fix calendar close on date select globally | `DealFieldInput.tsx`, `BorrowerBankingForm.tsx`, `OriginationEscrowTitleForm.tsx`, `OriginationApplicationForm.tsx`, `AddFundingModal.tsx`, `NotesModal.tsx`, `LenderInfoForm.tsx`, and any other file with `<Popover>` + `<Calendar>` |

### Technical Details

**1-2. Capacity position & options (BorrowerPrimaryForm)**
Move the Capacity `<InlineField>` block from after "Borrower Type" (line 179-186) to after "Last" (line 212-214). Update `CAPACITY_OPTIONS` array to: `['Borrower', 'Co-borrower', 'Trustee', 'Co-Trustee', 'Managing Member', 'Authorized Signer', 'Additional Guarantor']`.

**3. Banking Notes field**
Add `notes: 'ach.notes'` to `BORROWER_BANKING_KEYS` in `fieldKeyMap.ts`. Add a "Notes" `<Textarea>` below the Account Type field in `BorrowerBankingForm.tsx`. Add `ach.notes` to `legacyKeyMap.ts` mapping to a new field dictionary entry. Database migration: insert `field_dictionary` row for `br_b_notes` (section: borrower, form_type: banking, data_type: text).

**4. 1098 Designated Recipient update**
Change `DESIGNATED_RECIPIENT_OPTIONS` to: Primary, Co-borrower, Additional Guarantor, Other. When Primary/Co-borrower/Additional Guarantor is selected, auto-populate 1098 fields from the corresponding entity's primary form data (name, address, city, state, zip, TIN, TIN type). When "Other" is selected, clear all fields. The component already receives `values` which contains all deal field data with the borrower prefix, so it can read from `borrower.*`, `coborrower.*`, and `borrower.guarantor.*` keys.

**5. Move Capacity below "Last" globally**
In each form that has Capacity before First/Middle/Last, move it to after "Last":
- `BorrowerAdditionalGuarantorForm.tsx`: move lines 163-170 to after line 197
- `CoBorrowerPrimaryForm.tsx`: move lines 300-307 to after the Last field
- `BorrowerModal.tsx`: move `renderInlineSelect('capacity',...)` from line 139 to after `renderInlineField('lastName',...)`
- `CoBorrowerModal.tsx`: move capacity select from line 129 to after lastName
- `LenderInfoForm.tsx`: move capacity block (lines 215-233) to after lastName block (line 279)
- `BorrowerAuthorizedPartyForm.tsx`: already correct (Capacity is after Last)

**6. Calendar close on date select — global fix**
Every `<Popover>` + `<Calendar>` pattern needs controlled open state. Add `const [open, setOpen] = useState(false)` and pass `open`/`onOpenChange` to `<Popover>`, then call `setOpen(false)` in the `onSelect` callback after setting the value. 

For `DealFieldInput.tsx` (handles most date fields via `renderDatePicker`): add `const [datePickerOpen, setDatePickerOpen] = useState(false)` and wire it to the Popover. In `handleDateSelect`, add `setDatePickerOpen(false)`.

For each inline calendar in `BorrowerBankingForm.tsx` (2 calendars), `OriginationEscrowTitleForm.tsx`, `OriginationApplicationForm.tsx`, `AddFundingModal.tsx` (2 calendars), `NotesModal.tsx`, `LenderInfoForm.tsx`: same pattern — controlled Popover state, close on select.

### Backend / Persistence

**Database migration** — 1 new field_dictionary row:
```sql
INSERT INTO public.field_dictionary (field_key, section, data_type, label, form_type, canonical_key)
VALUES ('br_b_notes', 'borrower', 'text', 'Notes', 'banking', 'br_b_notes');
```

**Legacy key map** — Add mapping:
```typescript
'ach.notes': 'br_b_notes',
```

No new tables, no schema changes, no new APIs. Uses existing save/update flow.

