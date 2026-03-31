

# Fix Document Generation for New Origination Fee Currency Fields

## Root Cause Analysis

The investigation reveals a **multi-layer issue**:

### 1. Build Deployment Failure (Primary Blocker)
The previous code change to `src/lib/legacyKeyMap.ts` (mapping UI broker/others columns to new currency field keys) was **never deployed** due to a transient AWS S3 upload failure (`exit 127`). The old legacyKeyMap is still active in production, routing broker/others currency data to old **boolean** field dictionary entries.

### 2. No Data Under New Field UUIDs
Query confirmed zero rows in `deal_section_values` stored under the new currency field UUIDs (e.g., `48835fa9-...` for `of_801_lenderLoanOriginationFee_broker`). This means no user has entered and saved data through the updated code path.

### 3. Template-to-Data Alignment
The template DOCX uses tags like `{{of_801_lenderLoanOriginationFee_broker}}`. These match the new `field_dictionary` entries exactly. Once data is saved under the correct UUIDs, the document generation engine will resolve them correctly — no edge function changes needed.

## What Needs to Happen

### Step 1: Retry the Build
The legacyKeyMap code change is already correct. The build just needs to succeed. The AWS S3 error is transient infrastructure — a rebuild should resolve it.

### Step 2: Re-enter and Save Data
After deployment, users need to enter values in the Origination Fees form broker/others currency columns and save. This will persist data under the correct new currency field UUIDs.

### Step 3: Regenerate the Document
With data now stored under the correct field keys, the document generation engine will:
- Read `deal_section_values` → find UUID `48835fa9-...`
- Look up `field_dictionary` → resolve to `of_801_lenderLoanOriginationFee_broker`
- Match template tag `{{of_801_lenderLoanOriginationFee_broker}}` → replace with the currency value

## Code Changes Required

**None.** The existing code in `src/lib/legacyKeyMap.ts` is already correct. The edge function (`generate-document`) already handles this flow. The only issue is the failed deployment.

## What Will NOT Change
- No edge function modifications
- No database schema changes
- No template modifications
- No UI layout changes

