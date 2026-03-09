

## Problem

There are two "Other Origination" tabs appearing in the deal data entry page:

1. **Generic tab** — rendered by the section loop (lines 936-1054), which shows all `origination_fees` fields as a flat grid via `DealSectionTab` (the raw fields shown in your screenshot)
2. **Custom tab** — rendered explicitly at lines 928-933 and 1076-1087 with `OriginationFeesSectionContent`, which has the proper left-side sub-navigation with Application, Escrow & Title, etc.

The generic one should be removed because the custom one already handles all origination fields with proper sub-navigation and forms.

## Plan

**Single file change: `src/pages/csr/DealDataEntryPage.tsx`**

1. **Exclude `origination_fees` from the generic section tab loop** — add `origination_fees` to the filter alongside `dates` at line 837 and line 937, so it's excluded from the generic rendering:
   - Line 837: `.filter(s => SECTION_LABELS[s] && s !== 'dates')` → `.filter(s => SECTION_LABELS[s] && s !== 'dates' && s !== 'origination_fees')`
   - Line 937: same filter update

This removes the duplicate tab with the flat field grid while preserving the custom `OriginationFeesSectionContent` tab with its sub-navigation and organized forms.

