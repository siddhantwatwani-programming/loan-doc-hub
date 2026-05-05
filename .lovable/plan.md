I’ll fix this with a targeted RE851D document-generation change only. No UI, schema, permissions, or field-dictionary changes.

Deep analysis findings:

1. The per-property data publisher is currently destructive for non-owner values:
   - It reads each property occupancy value.
   - It computes `isYes = occRawNorm === "owner occupied"`.
   - But then it stores `pr_p_occupanc_N` as:
     - `"Owner Occupied"` when owner occupied
     - `""` for Tenant / Other, Vacant, NA, and blank
   - This means the downstream post-render safety pass can only distinguish owner vs not-owner, but loses the actual CSR value. It also makes template conditionals brittle when variants expect the literal non-owner values.

2. There are two owner-occupied safety passes:
   - A pre-render glyph-only pass around the template rewrite stage.
   - A post-render SDT-aware pass after `processDocx` converts glyphs into native Word checkboxes.
   - The post-render pass is the right place to fix the “both checked” Word behavior because Word renders native SDT checkbox state from `<w14:checked w14:val>`, not just the visible glyph.

3. The current post-render owner-occupied pass has two likely gaps causing the persistent issue:
   - It builds property regions using only `PROPERTY INFORMATION` anchors, unlike the earlier robust `findAnchorOffsets` helper that also supports `PROPERTY #K` fallback. If the generated XML structure varies, the pass may miss some or all property sections.
   - `findControlBefore()` searches backward from the Yes/No labels and returns the last SDT if present, before checking bare glyphs. In a local window containing both controls, this can choose the wrong checkbox when SDT blocks and labels are arranged differently or fragmented by Word.

Implementation plan:

1. Preserve the actual normalized CSR occupancy value per property.
   - For `pr_p_occupanc_1` through `pr_p_occupanc_5`, store one of:
     - `Owner Occupied`
     - `Tenant / Other`
     - `Vacant`
     - `NA`
     - empty only when truly missing/unknown
   - Keep the existing boolean/glyph aliases:
     - `pr_p_occupancySt_N_yes`
     - `pr_p_occupancySt_N_no`
     - `pr_p_occupancySt_N_yes_glyph`
     - `pr_p_occupancySt_N_no_glyph`
   - YES remains true only for exact `Owner Occupied`; NO remains true for every other value.

2. Strengthen the post-render RE851D owner-occupied safety pass.
   - Reuse the same robust property-boundary approach as the template preprocessor:
     - Prefer `PROPERTY INFORMATION` anchors.
     - Fall back to `PROPERTY #1` … `PROPERTY #5` headings when needed.
     - Cap to properties 1–5.
   - This ensures property #1 through #5 are independently scoped.

3. Replace the owner-occupied control finder with a local pair-based resolver.
   - For each `OWNER OCCUPIED` anchor inside a property region:
     - Find the local Yes label and No label only within that property block.
     - Locate the checkbox control closest to each label, supporting both:
       - native Word SDT checkbox blocks (`<w:sdt>...<w14:checkbox>...`)
       - bare glyph runs (`☐`, `☑`, `☒`)
     - Prefer the nearest control to each label instead of blindly choosing the last SDT in a large backward window.
     - Ensure the selected Yes and No controls are different before rewriting.

4. Rewrite both the visible glyph and native Word checkbox state.
   - For SDT checkbox controls, update:
     - `<w14:checked w14:val="1|0">`
     - the inner `<w:sdtContent>` glyph
   - For bare glyph runs, update the glyph directly.
   - Use one mutually-exclusive branch per property:
     - if `pr_p_occupanc_N === "Owner Occupied"`: YES checked, NO unchecked
     - else: YES unchecked, NO checked

5. Add targeted diagnostics for future verification.
   - Log how many owner-occupied YES/NO pairs were forced per document part.
   - Include property index and resolved occupancy in debug logging where useful.

Expected result:

- Property #1 uses `pr_p_occupanc_1` only.
- Property #2 uses `pr_p_occupanc_2` only.
- Property #3 uses `pr_p_occupanc_3` only.
- Property #4 uses `pr_p_occupanc_4` only.
- Property #5 uses `pr_p_occupanc_5` only.
- Only one checkbox is selected per property.
- YES is checked only for `Owner Occupied`.
- NO is checked for `Tenant / Other`, `Vacant`, `NA`, empty, or any other non-owner value.
- No double selection in the generated Word output.