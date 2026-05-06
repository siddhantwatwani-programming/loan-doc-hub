## RE885 Broker Information — Field Alignment Fix

### Root Cause (Confirmed)

The misalignment is **in the Word template itself**, not in the data publisher.

Looking at the uploaded template snapshot (image 2), the broker row is authored as **inline flowing text on a single line above the label row**:

```
{{bk_p_company}}    {{bk_p_brokerLicens}}    {{bk_p_firstName}}{{bk_p_lastName}}    {{bk_p_brokerLicens}}
   Name of Broker         License #          Broker's Representative      License #
{{bk_p_brokerAddres}}
   Broker's Address
```

Because these tags share a single paragraph separated by spaces/tabs, once the values render at different lengths (e.g. `Mob`, `45677`, `Amal Singh`, `45677`) the tab stops shift and everything collapses left, exactly as shown in image 1.

The data side is already correct:
- `bk_p_company`, `bk_p_brokerLicens`, `bk_p_brokerAddres`, `bk_p_fullName`, `bk_p_repLicense`, `bk_p_brokerRepres` are all published in `supabase/functions/generate-document/index.ts` (lines 614–641). No code change is needed for the values to exist.

This cannot be fixed reliably from code — Word inline runs with variable‑length text will always re-flow. The only robust fix is to restructure the four broker cells as a real DOCX table.

### Plan

#### 1. Template change (RE885.docx) — required, this is the actual fix

Replace the current inline broker block with a 4‑column fixed‑width table directly above the label row, then merge the label row into the same table so labels and values share column geometry.

Recommended structure (single table, 2 rows × 4 columns, fixed column widths):

```text
| {{bk_p_company}}     | {{bk_p_brokerLicens}} | {{bk_p_fullName}}        | {{bk_p_repLicense}} |
| Name of Broker       | License #             | Broker's Representative  | License #           |
```

Then a second table (1 row × 1 column, full width) for the address:

```text
| {{bk_p_brokerAddres}} |
| Broker's Address      |
```

Important authoring rules inside Word:
- Use **fixed column widths** (DXA), not "auto fit to contents".
- Set table width = content width (e.g. 9360 DXA on US Letter with 1" margins).
- Each cell width must match the table's `columnWidths`.
- Remove all manual tabs / multiple spaces between the four tags.
- Keep cell borders only on the bottom (to preserve the underline look from the original).
- Use `{{bk_p_fullName}}` for the representative cell (already published) instead of `{{bk_p_firstName}}{{bk_p_lastName}}` — this removes the inline‑concatenation source of drift.
- Use `{{bk_p_repLicense}}` for the second License # column (already published) instead of repeating `{{bk_p_brokerLicens}}` — the duplicate is what makes both license columns shift identically.

This table-based authoring is the same pattern already used elsewhere in the RE885 template (e.g. signature block) and is the only layout that survives variable-length data.

#### 2. Code side — minimal safety patch only

In `supabase/functions/generate-document/index.ts`, the broker publisher (around lines 614–641) already sets every needed key. The only small adjustment to make the new template render cleanly:

- Stop appending `\u00A0` to `bk_p_firstName` / `bk_p_lastName` **only when** `bk_p_fullName` is the tag in use. Since the new template uses `bk_p_fullName`, leave the existing first/last NBSP behavior intact for backward compatibility with other templates — no change required.
- No new aliases. No schema change. No save/update API change.

So the code change is effectively **none** — the existing publishers are already correct.

#### 3. Validation

After the template is updated:
- Generate RE885 with short data (`Mob` / `45677`) and long data (`Some Long Brokerage LLC` / `CA-DRE-01234567`) to confirm columns no longer drift.
- Confirm:
  - Broker company sits exactly under "Name of Broker"
  - Broker license sits under the first "License #"
  - Representative full name sits under "Broker's Representative"
  - Rep license sits under the second "License #"
  - Address sits under "Broker's Address" on its own row
- No change to wording, field keys, or document content.

### Files Touched

- **Template only** — `RE885.docx` in the template library (uploaded via the Template Management page).
- **No code changes** in `supabase/functions/generate-document/index.ts`.
- **No schema changes**, no UI changes, no save/update API changes.

### Why not "fix it in code"

Code-side workarounds (forced widths via `\u00A0` padding, fixed‑length string padding, injecting tabs) cannot make Word inline text behave like a fixed grid — Word recomputes tab stops based on the actual rendered run width per font/size. A real table is the only deterministic fix and is exactly what the requirement document calls out as Fix 1 (Critical) and Fix 4 (Fixed Column Widths).