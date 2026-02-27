

## Plan: Fix Auth 401 + Add `co_borrower_section` Computed Field

### Fix A: Auth 401 Error

**File: `supabase/functions/generate-document/index.ts` (lines 596-612)**

The `authClient.auth.getUser(token)` call is unreliable in the Deno Supabase JS v2 runtime. Fix: use the **service role client** (already created on line 615) to validate the token via `supabase.auth.getUser(token)`. The service role client has admin privileges to validate any JWT.

- Move service role client creation **before** auth validation
- Call `serviceClient.auth.getUser(token)` instead of creating a separate `authClient`
- Remove the `authClient` entirely

### Fix B: Add `co_borrower_section` Computed Field

**File: `supabase/functions/generate-document/index.ts` (after line 288, after `has_co_borrower` computation)**

Add ~20 lines to compute `co_borrower_section`:

1. Check if `borrower.co_borrower_name` (or `borrower1.co_borrower_name`, `coborrower.name`, `co_borrower1.first_name` + `co_borrower1.last_name`) has a valid non-empty, non-whitespace value
2. If valid: build section string with co-borrower name and address
3. If invalid: set to empty string `""`
4. Set both `co_borrower_section` and `CoBorrower.Section` in `fieldValues`

The template can then use `{{co_borrower_section}}` — no conditionals needed.

### What is NOT changed
- No database, UI, routes, or schema changes
- No changes to tag-parser, validate-template, or docx-processor
- No changes to existing `has_co_borrower` logic (kept for backward compatibility)
- No changes to field mappings or document layout

