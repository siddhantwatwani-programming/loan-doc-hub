

# Create Currency Fields for Origination Fee Others/Broker

## Analysis

The field dictionary already has **boolean** (checkbox) fields for "Others" and "Broker" for each fee item, plus a **currency** "(D)" field. What's missing are **currency amount** fields for the Others and Broker columns. These 20 new fields need to be inserted.

## Existing Pattern (per fee item)
- `of_fe_*Broker` → boolean (checkbox)
- `of_fe_*Others` → boolean (checkbox)  
- `of_fe_*D` → currency (dollar amount)
- **Missing**: currency fields for Others amount and Broker amount

## Fields to Create (20 total)

| # | Label | Field Key (Others) | Field Key (Broker) |
|---|-------|-------------------|-------------------|
| 1 | 801 Lender's Loan Origination Fee | `of_801_lenderLoanOriginationFee_others` | `of_801_lenderLoanOriginationFee_broker` |
| 2 | 802 Lender's Loan Discount Fee | `of_802_lenderLoanDiscountFee_others` | `of_802_lenderLoanDiscountFee_broker` |
| 3 | 803 Appraisal Fee | `of_803_appraisalFee_others` | `of_803_appraisalFee_broker` |
| 4 | 804 Credit Report Fee | `of_804_creditReportFee_others` | `of_804_creditReportFee_broker` |
| 5 | 805 Lender's Inspection Fee | `of_805_lenderInspectionFee_others` | `of_805_lenderInspectionFee_broker` |
| 6 | 808 Mortgage Broker Commission/Fee | `of_808_mortgageBrokerCommissionFee_others` | `of_808_mortgageBrokerCommissionFee_broker` |
| 7 | 809 Tax Service Fee | `of_809_taxServiceFee_others` | `of_809_taxServiceFee_broker` |
| 8 | 810 Processing Fee | `of_810_processingFee_others` | `of_810_processingFee_broker` |
| 9 | 811 Underwriting Fee | `of_811_underwritingFee_others` | `of_811_underwritingFee_broker` |
| 10 | 812 Wire Transfer Fee | `of_812_wireTransferFee_others` | `of_812_wireTransferFee_broker` |

## Implementation

**Single database migration** inserting 20 rows into `field_dictionary`:

- **section**: `origination_fees`
- **form_type**: `fees`
- **data_type**: `currency`
- **is_calculated**: false
- **is_repeatable**: false
- **is_mandatory**: false
- **allowed_roles**: `{admin, csr}`
- **read_only_roles**: `{}`

Each INSERT will use `ON CONFLICT (field_key) DO NOTHING` to prevent duplicates (since `field_key` has a unique-like usage pattern, we'll use a check query before insert to be safe).

## What Will NOT Change
- No UI, component, or layout changes
- No changes to existing fields or their data types
- No changes to document generation, templates, or APIs
- No schema alterations beyond inserting new dictionary rows

