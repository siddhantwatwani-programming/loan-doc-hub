## Root cause (this is NOT an `_N` expansion bug)

The `_N → _1/_2/_3` per-property rewrite is already working correctly. The bug is a **literal mismatch** in the conditional comparison.

Template (your screenshot) contains:
```
{{#if (eq pr_p_occupanc_N "Owner")}}☐{{else}}☑{{/if}} Yes
{{#if (eq pr_p_occupanc_N "Owner")}}☑{{else}}☐{{/if}} No
```

Publisher (`generate-document/index.ts` line ~1192) sets:
```ts
pr_p_occupanc_${idx} = isYes ? "Owner Occupied" : ""
```

Because `"Owner Occupied" !== "Owner"` (and `"" !== "Owner"`), the `eq` always returns **false** for every property → the `else` branch always wins → **☑ Yes / ☐ No on every property**, exactly the symptom reported.

Additionally, the existing "Owner-Occupied YES/NO safety pass" (line ~3479) anchors on the literal text `"Owner Occupied"` in the document. In the rendered PROPERTY #2 screenshot that anchor still appears, but the safety pass currently collides with the inline `{{#if}}` glyphs (overlap detection skips it), so it cannot correct the wrong result.

## Fix (minimal, scoped to RE851D occupancy only)

### 1. `supabase/functions/generate-document/index.ts` — publisher (~line 1192)
Change the published value so it matches the template literal `"Owner"` exactly, while still per-property:
```ts
fieldValues.set(`pr_p_occupanc_${idx}`, {
  rawValue: isYes ? "Owner" : "",
  dataType: "text",
});
if (idx === 1) {
  fieldValues.set("pr_p_occupanc", {
    rawValue: isYes ? "Owner" : "",
    dataType: "text",
  });
}
```
This makes `(eq pr_p_occupanc_1 "Owner")` evaluate true only for the property whose own occupancy is "Owner Occupied". Each property uses its own indexed value — Property 1 uses `_1`, Property 2 uses `_2`, etc.

### 2. Safety pass (~line 3521) — same alignment
Update the comparison so the safety pass agrees with the new published value:
```ts
const isOwner = occVal === "owner occupied" || occVal === "owner";
```
(Accept both so the pass works whether the value was published by the new code or read from a legacy alias.)

### 3. No template change required
You do **not** need to edit the RE851D Word template. Keep `(eq pr_p_occupanc_N "Owner")` as-is; the data layer now publishes the matching literal per property index.

## Out of scope
- No UI / dropdown changes (CSR keeps `Owner Occupied | Tenant / Other | Vacant | NA`).
- No schema / database changes.
- No changes to `_N` expansion logic (already correct).
- No changes to other YES/NO checkboxes (Annual Property Taxes, Remain Unpaid, etc.).

## Expected result

| Property | CSR Occupancy   | YES | NO |
|----------|-----------------|-----|----|
| 1        | Owner Occupied  | ☑   | ☐  |
| 2        | Vacant          | ☐   | ☑  |
| 3        | NA              | ☐   | ☑  |
| 4        | Tenant / Other  | ☐   | ☑  |

Each property's checkbox is driven independently by its own `pr_p_occupanc_K` value with no cross-property bleed.
