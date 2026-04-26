## Goal

Fix only the RE851A “IS BROKER ALSO A BORROWER?” A/B checkbox population so the generated document reflects the CSR checkbox selection.

## Correct Handlebars template condition

Use the existing normalized boolean field `or_p_isBrkBorrower`:

```handlebars
{{#if or_p_isBrkBorrower}}☐{{else}}☑{{/if}} A. Agent in arranging a loan on behalf of another
{{#if or_p_isBrkBorrower}}☑{{else}}☐{{/if}} B. Principal as a borrower on funds from which broker will directly or indirectly benefit...
```

Expected output:

```text
IS BROKER ALSO A BORROWER? checked:
☐ A. Agent
☑ B. Principal

IS BROKER ALSO A BORROWER? unchecked:
☑ A. Agent
☐ B. Principal
```

## Current findings

- The CSR UI field is saved as `origination_app.doc.is_broker_also_borrower_yes`.
- The document payload logic already derives and publishes:
  - `or_p_isBrkBorrower`
  - `or_p_brkCapacityPrincipal`
  - `or_p_brkCapacityAgent`
  - principal/agent checkbox glyph aliases
- The template condition above is logically correct.
- The likely failure point is Word/DOCX XML fragmentation of inline `{{#if}}...{{else}}...{{/if}}` checkbox glyph blocks, so the document engine may not always see the condition as one valid Handlebars block.

## Implementation plan

### 1. Keep UI, schema, APIs, templates, and document flow unchanged

No changes will be made to:
- CSR UI layout or components
- database schema
- save/update APIs
- RE851A template file
- unrelated document generation behavior

### 2. Apply the minimal engine-side fix if not already active in the running backend

In `supabase/functions/_shared/tag-parser.ts`, ensure the existing checkbox conditional consolidation handles the RE851A A/B rows safely:

- Consolidate fragmented inline checkbox conditionals of this shape:
  ```handlebars
  {{#if FIELD}}☑/☐{{else}}☐/☑{{/if}}
  ```
- Continue to bail out across paragraph boundaries.
- Continue to bail out if nested or extra control tags are present.
- Do not bail out just because plain merge tags appear nearby in the same cell/paragraph.

This is scoped to checkbox glyph conditionals only and should not affect non-checkbox template logic.

### 3. Confirm alias safety for the broker-borrower field

Ensure `or_p_isBrkBorrower` can resolve from the saved CSR field if needed:

```text
or_p_isBrkBorrower
→ or_p_brkCapacityPrincipal
→ or_p_isBrokerAlsoBorrower_yes
→ origination_app.doc.is_broker_also_borrower_yes
```

### 4. Verify payload and output behavior

After implementation, regenerate RE851A and confirm:

- Payload/derived fields include `or_p_isBrkBorrower` as `true` when the CSR checkbox is checked.
- Checked CSR checkbox renders:
  ```text
  ☐ A. Agent
  ☑ B. Principal
  ```
- Unchecked CSR checkbox renders:
  ```text
  ☑ A. Agent
  ☐ B. Principal
  ```

## Files expected to be touched

- `supabase/functions/_shared/tag-parser.ts` only, if the active code still needs the scoped consolidation/alias safeguard.

No database migrations, UI edits, API changes, or template-file edits.