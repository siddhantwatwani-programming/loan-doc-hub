

## Plan: Add "IS BROKER ALSO A BORROWER?" Boolean Field

### Summary
Add a new dual-checkbox field (YES/NO) to the Application → Document Request sub-section, positioned below "Periods Reviewed" and above "Additional Information Attached". Register it in the field dictionary for persistence and add document generation support.

### Changes

**1. Database Migration — Register field in `field_dictionary`**
- Insert `origination_app.doc.is_broker_also_borrower_yes` (boolean, section: origination, form_type: application) with canonical_key `or_p_isBrokerAlsoBorrower_yes`
- Insert `origination_app.doc.is_broker_also_borrower_no` (boolean, section: origination, form_type: application) with canonical_key `or_p_isBrokerAlsoBorrower_no`

**2. UI — `src/components/deal/OriginationApplicationForm.tsx`**
- Add field keys for the two checkboxes: `is_broker_borrower_yes` and `is_broker_borrower_no`
- Render a new row below "Periods Reviewed" (line 309) styled like "Income Statement Received" — label + two checkboxes (YES / NO)
- Implement mutual exclusivity: checking YES unchecks NO, and vice versa

**3. Document Generation — `supabase/functions/generate-document/index.ts`**
- After field resolution, derive `or_p_isBrokerAlsoBorrower` from the YES checkbox value
- Map to checked/unchecked glyphs so templates using `{{or_p_isBrokerAlsoBorrower_yes}}` and `{{or_p_isBrokerAlsoBorrower_no}}` render ☑/☐ correctly

### Technical Details
- The dual-checkbox pattern matches existing fields like "Balance Sheet Received" / "Reviewed" but with YES/NO semantics and mutual exclusivity
- Persistence uses existing `deal_section_values` JSONB via `onValueChange` — no schema changes
- Field dictionary entries ensure `saveDraft` persists the values

