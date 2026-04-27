## Goal

Add three new Boolean fields to the Field Dictionary under **Other Origination → Servicing**, alongside the existing `oo_svc_servicingAgent` dropdown, so they can be configured, persisted, and surfaced through the standard Field Dictionary pipeline.

## New Fields

All inserted into `public.field_dictionary` with:
- `section = 'origination_fees'` (the enum value used for "Other Origination")
- `form_type = 'servicing'` (the "Servicing" sub-section)
- `data_type = 'boolean'`
- `allowed_roles = ARRAY['admin','csr']`
- `read_only_roles = ARRAY[]::text[]`
- `is_calculated = false`, `is_repeatable = false`, `is_mandatory = false`

| field_key | label |
|---|---|
| `oo_svc_servicingAgentLender` | Servicing Agent – Lender |
| `oo_svc_servicingAgentBroker` | Servicing Agent – Broker |
| `oo_svc_servicingAgentOther`  | Servicing Agent – Other or Company |

Naming follows the existing `{section_abbr}_{form_abbr}_{fieldIdentifier}` convention (matches the existing `oo_svc_servicingAgent` dropdown).

## How It Persists

No schema or API changes. Values flow through the existing Field Dictionary → `deal_section_values` / `deal_field_values` save pipeline (the same path every other `oo_svc_*` field uses). The Admin → Field Dictionary screen will auto-refresh and show the new fields under Other Origination → Servicing because of the existing window-focus refetch behavior.

## Constraints Honored

- No changes to UI layout, components, save/update APIs, document generation logic, or other field mappings.
- No new tables, no schema changes — only three INSERTs into `field_dictionary`.
- Existing `oo_svc_servicingAgent` dropdown is left untouched.
- Existing data is unaffected (new keys, new rows only).

## Implementation Step

Single data insert via the Supabase insert tool:

```sql
INSERT INTO public.field_dictionary
  (field_key, label, section, form_type, data_type, allowed_roles, read_only_roles, is_calculated, is_repeatable, is_mandatory)
VALUES
  ('oo_svc_servicingAgentLender', 'Servicing Agent – Lender',           'origination_fees', 'servicing', 'boolean', ARRAY['admin','csr'], ARRAY[]::text[], false, false, false),
  ('oo_svc_servicingAgentBroker', 'Servicing Agent – Broker',           'origination_fees', 'servicing', 'boolean', ARRAY['admin','csr'], ARRAY[]::text[], false, false, false),
  ('oo_svc_servicingAgentOther',  'Servicing Agent – Other or Company', 'origination_fees', 'servicing', 'boolean', ARRAY['admin','csr'], ARRAY[]::text[], false, false, false);
```

## Verification

- Confirm the three rows exist in `field_dictionary` with `data_type = 'boolean'`.
- Open Admin → Field Dictionary → filter by section "Other Origination" / form "Servicing" — the three new boolean fields appear next to the existing `Servicing Agent` dropdown.
- No code files modified; no other fields touched.
