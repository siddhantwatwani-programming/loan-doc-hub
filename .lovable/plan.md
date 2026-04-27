# RE851A Servicing Checkboxes — Bind Labels to Derived Booleans

## Diagnosis
The derivation logic for the Servicing section is already wired correctly in `supabase/functions/generate-document/index.ts` (lines 894–924). It reads the Servicing Agent dropdown and publishes mutually-exclusive boolean + glyph aliases:

- `sv_p_noServicingArrangements*` → Lender
- `sv_p_brokerIsServicingAgent*` → Broker
- `sv_p_anotherQualifiedParty*` → Company / Other Servicer

What's missing is the **template-side binding**. Looking at the screenshot, each Servicing line has a static `☐` glyph immediately before the label text. The doc-gen engine can flip that exact glyph automatically — but only if it knows which `fieldKey` belongs to which label. This is the same mechanism already used for the broker A/B checkboxes (`effectiveLabelMap` at lines 1610–1651). No such entries exist yet for the Servicing labels, so the boxes never toggle even though the booleans are derived correctly. Result matches what the screenshot shows: a check appears somewhere on the row, but the static `☐` glyph in front of the actual label stays unchecked.

## Fix
Extend the in-memory `effectiveLabelMap` block in `supabase/functions/generate-document/index.ts` (right after the existing broker A/B entries, before the closing `};` on line 1651) with label→fieldKey bindings for the three Servicing labels, including realistic wording variants captured from the live template:

```ts
// RE851A Servicing section labels → derived boolean keys.
// Mirrors the broker A/B pattern above so the static ☐ glyph that
// sits immediately before each label flips to ☑ when the matching
// boolean is true. No template edits required.
"THERE ARE NO SERVICING ARRANGEMENTS":              { fieldKey: "sv_p_noServicingArrangements" },
"THERE ARE NO SERVICING ARRANGEMENTS (Does not apply to multi-lender transactions.)":
                                                    { fieldKey: "sv_p_noServicingArrangements" },
"THERE ARE NO SERVICING ARRANGEMENTS  (Does not apply to multi-lender transactions.)":
                                                    { fieldKey: "sv_p_noServicingArrangements" },

"BROKER IS THE SERVICING AGENT":                    { fieldKey: "sv_p_brokerIsServicingAgent" },
"BROKER IS THE SERVICING AGENT  -See attached \"Notes\"":
                                                    { fieldKey: "sv_p_brokerIsServicingAgent" },
"BROKER IS THE SERVICING AGENT -See attached \"Notes\"":
                                                    { fieldKey: "sv_p_brokerIsServicingAgent" },

"ANOTHER QUALIFIED PARTY WILL SERVICE THE LOAN":    { fieldKey: "sv_p_anotherQualifiedParty" },
"ANOTHER QUALIFIED PARTY WILL SERVICE THE LOAN CHECK BOX IF ANY PARTY OTHER THAN LENDER IS SELECTED AS SERVICER":
                                                    { fieldKey: "sv_p_anotherQualifiedParty" },
```

That's the only code change. The variants cover the trailing parenthetical/notes/spacing seen in the screenshot. The processor already normalises minor whitespace, but providing the most common variants makes the match deterministic.

## Why This Honours The Constraints
- **No template edit, no field mapping change, no schema change.**
- **No layout shift.** The label-binding mechanism only flips the existing static `☐` glyph (or SDT checkbox state) directly preceding the label — placement, spacing, and alignment are preserved.
- **No impact on other RE851A sections** — labels are scoped to exact Servicing wording.
- **Mutual exclusivity** is already guaranteed by the existing derivation logic; only one of the three booleans is ever `true`.

## File Touched
- `supabase/functions/generate-document/index.ts` — append three label entries inside the existing `effectiveLabelMap` literal (≈10–15 added lines, no other changes).

## Acceptance Criteria
- Servicing Agent = **Lender** → only "THERE ARE NO SERVICING ARRANGEMENTS" box is checked.
- Servicing Agent = **Broker** → only "BROKER IS THE SERVICING AGENT" box is checked.
- Servicing Agent = **Company** or **Other Servicer** → only "ANOTHER QUALIFIED PARTY WILL SERVICE THE LOAN" box is checked.
- The previously-visible spurious check disappears; the box directly in front of each label is the one that toggles.
- Document generates without corruption; no other RE851A checkboxes/fields are affected.
