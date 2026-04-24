## Diagnosis

For deal `DL-2026-0189`, the Balloon Payment value is already saved correctly in the backend.

Confirmed facts:
- The deal has a `loan_terms` row in `deal_section_values`
- The saved balloon field exists under the actual backend key `ln_p_balloonPaymen`
- Its saved value is `true`
- RE851A generation completed successfully after that save

So this is **not** a missing save issue and **not** a UI field-mapping issue.

## What is still wrong

The active RE851A template/control-tag path is the problem.

I checked the active RE851A template validation output and it still contains control tags for both:
- `{{#if ln_p_balloonPayment}}`
- `{{#if ln_p_balloonPaymen}}`

That means at least one of these is true:
1. the active template still contains mixed old/new balloon conditions
2. the Balloon Payment cell has duplicate logic left behind
3. Word has fragmented the inline `#if / else / /if` control tags in a way the generator is not resolving reliably in that cell

## Important conclusion

Changing the field mapping again will not fix this.

Your saved source of truth is already correct:
- persisted key: `ln_p_balloonPaymen`
- persisted value for this deal: `true`

If the document still does not populate, the remaining failure is in the **template authoring / document parser handling of inline conditionals**, not in the saved data.

## Most likely root cause now

The RE851A Balloon Payment row uses inline Handlebars control blocks inside a Word table cell. That is more fragile than normal merge tags because Word often splits these tags across XML runs.

The validator can see the control tags, but the generator may still fail to evaluate the full block reliably if the cell contains mixed or fragmented versions. In that case the symbols do not toggle correctly even though the boolean data exists.

## Minimal fix plan

1. Clean the Balloon Payment cell so it contains only one key version
   - use only `ln_p_balloonPaymen` in that row if you want to match the persisted backend key directly
   - remove any remaining `ln_p_balloonPayment` occurrence from the same row/cell

2. Re-author the cell fresh in Word
   - delete the entire Balloon Payment YES/NO content in that cell
   - retype it as fresh plain text so no hidden fragmented runs remain
   - keep only the checkbox logic, no layout changes

3. If it still fails after the cell is clean
   - add a very narrow document-engine fix in `supabase/functions/_shared/tag-parser.ts`
   - make conditional evaluation for RE851A Balloon Payment tolerate both aliases and fragmented inline `#if/else` blocks
   - keep the change scoped only to this checkbox logic to avoid regressions

## Technical details

Evidence gathered:
- Saved backend field present: `ln_p_balloonPaymen = true`
- Field dictionary contains the backend boolean key `ln_p_balloonPaymen`
- Active RE851A template validation still reports balloon control tags, including both spelling variants
- Therefore the generator is reaching the template, but the conditional rendering path is still the weak point

## Expected outcome after implementation

- No changes to UI, APIs, database schema, or unrelated mappings
- Balloon Payment checked -> `YES` checked, `NO` unchecked
- Balloon Payment unchecked -> `NO` checked, `YES` unchecked
- No RE851A layout changes