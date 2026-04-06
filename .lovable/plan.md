
## Plan: Preserve Re851a Formatting While Fixing Checkbox State

### Root Cause
The current engine already derives the correct boolean keys in `supabase/functions/generate-document/index.ts`:

- `ln_p_amortizedPartially`
- `ln_p_amortized`
- `ln_p_paymentMonthly`
- `ln_p_paymentWeekly`

But the output is still being altered because `supabase/functions/_shared/tag-parser.ts` runs **label-based checkbox glyph replacement** afterward:

- `FULLY AMORTIZED`
- `AMORTIZED PARTIALLY`
- `MONTHLY`
- `WEEKLY`

That logic replaces visible checkbox characters in text (`☐/☑/...`), which can shift labels and break the original Word layout.

### Minimal Fix
Use the existing derived boolean keys, but stop Re851a from using label-based glyph replacement for these checkbox fields.

### Changes
**1. Keep current boolean derivation logic**
- No change to `generate-document/index.ts`
- It already maps:
  - `ln_p_amortiza` → `ln_p_amortizedPartially` / `ln_p_amortized`
  - `ln_p_paymentFreque` → `ln_p_paymentMonthly` / `ln_p_paymentWeekly`

**2. Disable label-based checkbox aliasing for these Re851a fields**
- Add a database migration that deactivates the 4 label alias rows in `merge_tag_aliases` for:
  - `ln_p_amortizedPartially`
  - `ln_p_amortized`
  - `ln_p_paymentMonthly`
  - `ln_p_paymentWeekly`
- This prevents the engine from replacing visible checkbox symbols beside static labels.

**3. Preserve native template checkbox handling only**
- Let the template’s existing checkbox/merge-tag mechanism handle the checked state.
- The parser already has a separate `processSdtCheckboxes(...)` path for native Word checkbox controls, which is the format-preserving path.
- No change to generic checkbox rendering or non-Re851a templates.

### Why this is the safest fix
- No UI changes
- No schema changes
- No document layout rewriting
- No global parser refactor
- No formatting changes to the original template structure
- Only removes the specific fallback behavior that is causing Re851a formatting damage

### Files / Data Updated
| Target | Change |
|---|---|
| Database migration | Set `is_active = false` for the 4 Re851a checkbox label aliases in `merge_tag_aliases` |
| `supabase/functions/generate-document/index.ts` | No change |
| `supabase/functions/_shared/tag-parser.ts` | No change unless a tiny safeguard is needed after validation |

### Validation
After implementation, verify that:
1. `Amortized Partially` checks only the partially amortized box
2. `Amortized` checks only the fully amortized box
3. `Monthly` checks only monthly
4. `Weekly` checks only weekly
5. Re851a formatting in Transaction Information remains identical to the original template
6. No extra checkbox symbols appear
7. Balloon Payment layout remains unchanged

### Technical Notes
- Confirmed in code: `replaceStaticCheckboxLabel(...)` in `tag-parser.ts` is what swaps visible checkbox glyphs.
- Confirmed in database: active label aliases currently exist for:
  - `FULLY AMORTIZED`
  - `AMORTIZED PARTIALLY`
  - `MONTHLY`
  - `WEEKLY`
- Since those aliases are active, they override presentation in-place and are the most likely cause of the layout corruption.
