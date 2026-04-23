

## Fix: Investor Questionnaire Due checkbox not rendering in generated DOCX

### Root Cause
The Lender's "Investor Questionnaire Due" checkbox is stored on the Contact record at `contacts.contact_data.investor_questionnaire_due` (as `'true'`/`'false'`).

The document generation engine (`generate-document` edge function) **does** support `{{#if x}}☒{{else}}☐{{/if}}` syntax — that part of the engine works correctly.

The bug is in the lender-bridging block inside `supabase/functions/generate-document/index.ts` (around lines 504–515): it bridges `lcd.type` and `lcd.investor_questionnaire_due_date` from contact_data into the deal's field-value map, but it **does NOT bridge** `lcd.investor_questionnaire_due`. So the merge-field `ld_p_investorQuestiDue` is always empty → conditional always evaluates falsy → output is always `☐`.

The unchecked-glyph artifact in the existing template proves the conditional engine itself executes correctly — only the data is missing.

### Fix (Minimal Change)
Add a single bridging block in `supabase/functions/generate-document/index.ts` directly after the existing `investor_questionnaire_due_date` bridge. This:

1. Bridges the boolean to the merge keys consumers already expect:
   - `ld_p_investorQuestiDue`
   - `lender1.investor_questionnaire_due`
   - `lender.investor_questionnaire_due`
2. Also seeds a pre-rendered glyph alias `ld_p_investorQuestiDueCheckbox` set to `☒` or `☐`, so templates can use the simpler single-placeholder form `{{ld_p_investorQuestiDueCheckbox}}` per the user's fallback requirement.

This keeps **both** template patterns working:
- Existing template using `{{#if ld_p_investorQuestiDue}}☒{{else}}☐{{/if}}` → now evaluates correctly.
- Any future template using `{{ld_p_investorQuestiDueCheckbox}}` → renders the right glyph directly.

### Technical Details
File touched: `supabase/functions/generate-document/index.ts` (one location, ~6 lines added)

Logic added immediately after the existing `lcd.investor_questionnaire_due_date` block:

```ts
// Bridge investor questionnaire due (boolean checkbox) from contact_data
const iqDueRaw = lcd.investor_questionnaire_due;
const iqDueChecked =
  iqDueRaw === true || iqDueRaw === 'true' || iqDueRaw === 1 || iqDueRaw === '1' || iqDueRaw === 'yes';
setIfEmpty("ld_p_investorQuestiDue", iqDueChecked ? "true" : "false");
setIfEmpty("lender1.investor_questionnaire_due", iqDueChecked ? "true" : "false");
setIfEmpty("lender.investor_questionnaire_due", iqDueChecked ? "true" : "false");
// Pre-rendered checkbox glyph for templates that prefer a single placeholder
setIfEmpty("ld_p_investorQuestiDueCheckbox", iqDueChecked ? "☒" : "☐");
```

### What is NOT changed
- No DB schema changes
- No template files touched
- No changes to UI / Lender form / contact storage
- No changes to the conditional-block engine, field-resolver, or any other edge function
- No change to formatting, layout, or other lender mappings
- Other contact fields (date, type) remain bridged exactly as they are today

### Validation
After deployment:
- Check the box in Contacts → Lender → save → regenerate Investor Questionnaire doc → renders `☒`
- Uncheck the box → regenerate → renders `☐`
- All other lender merge fields and templates remain unaffected

