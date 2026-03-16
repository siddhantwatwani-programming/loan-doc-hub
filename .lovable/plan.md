

## Fix: `{{bk_p_brokerLicens}}` not detected + Broker's Representative line broken

### Root Cause

Confirmed via edge function logs: after normalization, the template has **7 opening `{{` but only 6 closing `}}`**. The `bk_p_brokerLicens` tag loses its closing braces, leaving an orphaned `{{` in the output.

The bug is in `tag-parser.ts` line 102. The proofErr/bookmark cleanup only runs on paragraphs containing `{{` (double braces). But when Word splits the braces across runs (`{` in one run, `{` in another), the paragraph contains only single `{` characters. ProofErr elements between the runs then block the `splitOpenBraces`/`splitCloseBraces` regexes from consolidating.

Additionally, `broker1.License` in `deal_section_values` is `null`, but the broker contact record has `License: "344"` in its `contact_data`. The contact-lookup layer in the generator doesn't currently inject broker contact fields because there's no `details_broker_id` in loan terms — brokers are stored in `deal_section_values` under the `broker` section with `broker1.*` keys.

### Fix: Two changes

**1. Fix proofErr cleanup scope** (`supabase/functions/_shared/tag-parser.ts`, line 102)

Change the check from `{{` to `{` so paragraphs with split braces also get cleaned:

```javascript
// Before:
if (!para.includes('{{') && !para.includes('\u00AB') && !para.includes('\u00BB')) {

// After:
if (!para.includes('{') && !para.includes('\u00AB') && !para.includes('\u00BB')) {
```

This ensures proofErr elements are stripped before the brace-consolidation regexes run, allowing `{{bk_p_brokerLicens}}` to be properly detected.

**2. Bridge broker license from deal section data** (`supabase/functions/generate-document/index.ts`)

Add a bridging block after the existing Broker.Name auto-compute (around line 480) to populate `bk_p_brokerLicens` from `broker1.License` or `broker1.license_number`:

```javascript
// Auto-compute bk_p_brokerLicens from broker section data
const existingLicense = fieldValues.get("bk_p_brokerLicens");
if (!existingLicense || !existingLicense.rawValue) {
  const license = fieldValues.get("broker1.License")?.rawValue 
    || fieldValues.get("broker1.license_number")?.rawValue
    || fieldValues.get("broker.License")?.rawValue
    || fieldValues.get("broker.license_number")?.rawValue;
  if (license) {
    fieldValues.set("bk_p_brokerLicens", { rawValue: license, dataType: "text" });
  }
}
```

### What this fixes
- `{{bk_p_brokerLicens}}` will be detected as a merge tag and replaced (no leftover `{{`)
- `bk_p_brokerLicens` will resolve from broker section data (`broker1.License`)
- The Broker's Representative line (`{{bk_p_firstName}} {{bk_p_lastName}}`) already works per the logs — the visual issue is caused by the orphaned `{{` from the broken brokerLicens tag corrupting the preceding line's output

### What this does NOT change
- No UI changes, no database changes, no template changes
- Formatting preservation logic remains intact (only proofErr/bookmark stripping scope is widened)

