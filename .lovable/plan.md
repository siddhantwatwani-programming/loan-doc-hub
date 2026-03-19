

# Plan: Remove Product Type, States, and State/Product Columns

## Summary

Remove three fields from the Packet modal (Product Type, All States, States) and two columns from the Template Management table (State, Product).

## Changes

### 1. PacketManagementPage.tsx

**Validation (lines 171-188)**: Remove the `product_type` required check and the `all_states`/`states` validation block. Only validate `name`.

**Submit logic (lines 190-224)**: Remove `product_type`, `all_states`, `states` from the insert/update payloads. Keep hardcoded defaults: `state: 'TBD'`, `product_type: 'TBD'`, `all_states: false`, `states: []`.

**Modal form (lines 414-492)**: Remove the Product Type select, All States checkbox, and the entire States multi-select section. Keep Packet Name, Description, and Active toggle.

**Packet card subtitle (line 613-615)**: Remove the `{getStatesDisplay(packet)} • {packet.product_type}` display line or simplify it.

**Search filter (lines 348-353)**: Remove state/product_type from the search filter logic; search by name only.

### 2. TemplateManagementPage.tsx

**Table header (lines 1226-1227)**: Remove the State and Product `<th>` elements.

**Table body (lines 1238-1239)**: Remove the State and Product `<td>` elements.

**Preview dialog (lines 924-933)**: Remove the State and Product Type display grid from the template preview.

**Search filter (lines 731-734)**: Remove `state` and `product_type` from the search filter; search by name only.

### 3. No Backend/Schema Changes Required

The `packets` table columns (`state`, `product_type`, `all_states`, `states`) remain in the schema. The insert/update will simply send hardcoded default values (`'TBD'`, `false`, `[]`) so existing NOT NULL constraints are satisfied.

