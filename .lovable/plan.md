
# Complete Field Key Reference & Sample Data Population

## Overview

This plan addresses two requests:
1. **Populate a deal with sample data** - Fill all form fields under deal DL-2026-0061
2. **Provide complete merge tag reference** - List all field keys for use as `{{field_key}}` in document templates

---

## Part 1: Sample Data Population

I will insert comprehensive sample data into deal **DL-2026-0061** (`51afe8fc-d3d2-403f-bc18-8dd51b49081d`) covering all sections.

### Sections to Populate:
- **Borrower** - Name, contact, address, tax info, banking
- **Broker** - Company, license, contact, banking
- **Lender** - Entity info, contact, authorized party, banking, funding
- **Property** - Address, appraisal, insurance, liens, taxes, legal description
- **Loan Terms** - Amounts, rates, dates, payment schedule

---

## Part 2: Complete Merge Tag Reference

Below is the comprehensive list of field keys you can use with `{{curly_braces}}` in your document templates.

### BORROWER Section (`{{borrower.*}}`)

| Merge Tag | Label | Data Type |
|-----------|-------|-----------|
| `{{borrower.first_name}}` | First Name | text |
| `{{borrower.last_name}}` | Last Name | text |
| `{{borrower.middle_initial}}` | Middle Initial | text |
| `{{borrower.full_name}}` | Full Name | text |
| `{{borrower.salutation}}` | Salutation | text |
| `{{borrower.generation}}` | Generation | text |
| `{{borrower.email}}` | Email Address | text |
| `{{borrower.phone.home}}` | Home Phone | text |
| `{{borrower.phone.mobile}}` | Mobile Phone | text |
| `{{borrower.phone.work}}` | Work Phone | text |
| `{{borrower.phone.fax}}` | Fax | text |
| `{{borrower.address.street}}` | Street Address | text |
| `{{borrower.address.city}}` | City | text |
| `{{borrower.address.state}}` | State | text |
| `{{borrower.address.zip}}` | ZIP Code | text |
| `{{borrower.street}}` | Mailing Street | text |
| `{{borrower.city}}` | Mailing City | text |
| `{{borrower.zip}}` | Mailing ZIP | text |
| `{{borrower.tax_id}}` | TIN / SSN | text |
| `{{borrower.tax_id_type}}` | Tax ID Type | text |
| `{{borrower.dob}}` | Date of Birth | date |
| `{{borrower.credit_score}}` | Credit Score | number |
| `{{borrower.borrower_type}}` | Borrower Type | text |
| `{{borrower.capacity}}` | Capacity | text |
| `{{borrower.account.number}}` | Account Number | text |
| `{{Borrower.Name}}` | Borrower Name (legacy) | text |
| `{{Borrower.Address}}` | Borrower Address (legacy) | text |
| `{{Borrower.City}}` | Borrower City (legacy) | text |
| `{{Borrower.State}}` | Borrower State (legacy) | text |
| `{{Borrower.Zip}}` | Borrower ZIP (legacy) | text |

### BROKER Section (`{{broker.*}}`)

| Merge Tag | Label | Data Type |
|-----------|-------|-----------|
| `{{broker.first_name}}` | First Name | text |
| `{{broker.last_name}}` | Last Name | text |
| `{{broker.middle_name}}` | Middle Name | text |
| `{{broker.company}}` | Company | text |
| `{{broker.License}}` | License Number | text |
| `{{broker.email}}` | Email | text |
| `{{broker.phone.work}}` | Work Phone | phone |
| `{{broker.phone.cell}}` | Cell Phone | phone |
| `{{broker.phone.home}}` | Home Phone | phone |
| `{{broker.phone.fax}}` | Fax | phone |
| `{{broker.address.street}}` | Street | text |
| `{{broker.address.city}}` | City | text |
| `{{broker.address.state}}` | State | text |
| `{{broker.address.zip}}` | ZIP | text |
| `{{broker.tax_id}}` | Tax ID | text |
| `{{broker.tax_id_type}}` | Tax ID Type | text |
| `{{broker.id}}` | Broker ID | text |
| `{{broker.banking.bank}}` | Bank | text |
| `{{broker.banking.account_name}}` | Account Name | text |
| `{{broker.banking.account_number}}` | Account Number | text |
| `{{broker.banking.routing_number}}` | Routing Number | text |
| `{{broker.banking.account_type}}` | Account Type | text |
| `{{Broker.Name}}` | Broker Name (legacy) | text |
| `{{Broker.Address}}` | Broker Address (legacy) | text |
| `{{Broker.License}}` | Broker License (legacy) | text |
| `{{Broker.Representative}}` | Broker Representative | text |

### LENDER Section (`{{lender.*}}`)

| Merge Tag | Label | Data Type |
|-----------|-------|-----------|
| `{{lender.first_name}}` | First Name | text |
| `{{lender.last_name}}` | Last Name | text |
| `{{lender.full_name}}` | Full Name | text |
| `{{lender.email}}` | Email | text |
| `{{lender.city}}` | Mailing City | text |
| `{{lender.street}}` | Mailing Street | text |
| `{{lender.state}}` | Mailing State | text |
| `{{lender.zip}}` | Mailing ZIP | text |
| `{{lender.ford}}` | FORD | text |
| `{{lender.capacity}}` | Capacity | text |
| `{{lender.tax_id}}` | Tax ID | text |
| `{{lender.tax_id_type}}` | Tax ID Type | text |
| `{{lender.contact.email}}` | Contact Email | text |
| `{{lender.contact.phone}}` | Contact Phone | phone |
| `{{lender.authorized_party.name}}` | Authorized Party Name | text |
| `{{lender.authorized_party.email}}` | Authorized Party Email | text |
| `{{lender.authorized_party.first_name}}` | AP First Name | text |
| `{{lender.authorized_party.last_name}}` | AP Last Name | text |
| `{{lender.banking.bank}}` | Bank | text |
| `{{lender.banking.account_name}}` | Account Name | text |
| `{{lender.banking.account_number}}` | Account Number | text |
| `{{lender.banking.routing_number}}` | Routing Number | text |
| `{{lender.funding.lender_amount}}` | Funding Amount | currency |
| `{{lender.funding.funding_date}}` | Funding Date | date |
| `{{Lender.Name}}` | Lender Name (legacy) | text |
| `{{Lender.Address}}` | Lender Address (legacy) | text |

### PROPERTY Section (`{{property1.*}}`)

Note: Properties use indexed prefixes (`property1`, `property2`, etc.)

| Merge Tag | Label | Data Type |
|-----------|-------|-----------|
| `{{property1.street}}` | Street Address | text |
| `{{property1.city}}` | City | text |
| `{{property1.state}}` | State | text |
| `{{property1.zip}}` | ZIP | text |
| `{{property1.county}}` | County | text |
| `{{property1.apn}}` | APN (Parcel Number) | text |
| `{{property1.legal_description}}` | Legal Description | text |
| `{{property1.appraised_value}}` | Appraised Value | currency |
| `{{property1.appraised_date}}` | Appraised Date | date |
| `{{property1.appraisal_property_type}}` | Property Type | text |
| `{{property1.appraisal_occupancy}}` | Occupancy | text |
| `{{property1.lot}}` | Lot | text |
| `{{property1.block}}` | Block | text |
| `{{property1.tract}}` | Tract | text |
| `{{property1.insurance_company_name}}` | Insurance Company | text |
| `{{property1.insurance_policy_number}}` | Policy Number | text |
| `{{property1.insurance_coverage}}` | Coverage Amount | currency |
| `{{property1.insurance_expiration}}` | Insurance Expiration | date |
| `{{property1.lien_holder}}` | Lien Holder | text |
| `{{property1.lien_position}}` | Lien Position | number |
| `{{property1.lien_current_balance}}` | Lien Balance | currency |
| `{{property1.tax_parcel_number}}` | Tax Parcel Number | text |
| `{{property1.tax_annual_amount}}` | Annual Tax Amount | currency |
| `{{Property1.Address}}` | Property Address (legacy) | text |
| `{{Property1.City}}` | Property City (legacy) | text |

### LOAN TERMS Section (`{{loan.*}}`)

| Merge Tag | Label | Data Type |
|-----------|-------|-----------|
| `{{loan.original_amount}}` | Original Amount | currency |
| `{{loan.note_rate}}` | Note Rate | percentage |
| `{{loan.sold_rate}}` | Sold Rate | percentage |
| `{{loan.loanType}}` | Loan Type | text |
| `{{loan.amortizationType}}` | Amortization Type | text |
| `{{loan.rateType}}` | Rate Type | text |
| `{{loan.priority}}` | Priority | text |
| `{{loan.closing_date}}` | Closing Date | date |
| `{{loan.first_payment_date}}` | First Payment Date | date |
| `{{loan.maturity_date}}` | Maturity Date | date |
| `{{loan.next_payment_date}}` | Next Payment Date | date |
| `{{loan.booking_date}}` | Booking Date | date |
| `{{loan.purchase_date}}` | Purchase Date | date |
| `{{loan.payment.total}}` | Total Payment | currency |
| `{{loan.payment.principal_interest}}` | P&I Payment | currency |
| `{{loan.payment.reserves}}` | Reserves | currency |
| `{{loan.payment.due_day}}` | Due Day | number |
| `{{loan.payment.frequency}}` | Payment Frequency | text |
| `{{loan.balance.principal}}` | Principal Balance | currency |
| `{{loan.balance.unpaid_interest}}` | Unpaid Interest | currency |
| `{{lenderRate.noteRate}}` | Lender Note Rate | percentage |
| `{{lenderRate.effectiveRate}}` | Effective Rate | percentage |
| `{{lenderRate.soldRate}}` | Lender Sold Rate | percentage |
| `{{lateCharge.graceDays}}` | Grace Days | number |
| `{{lateCharge.method}}` | Late Charge Method | text |

---

## Implementation Steps

Upon approval, I will:

1. **Insert sample data** into `deal_section_values` for deal DL-2026-0061 across all sections
2. The data will be structured in the JSONB format using `field_dictionary_id` as keys
3. All major form fields will have realistic sample values

---

## Technical Notes

- **Field Resolution**: The document generator uses case-insensitive matching and supports both `borrower.first_name` and `Borrower.Name` formats
- **Property Indexing**: Multiple properties use `property1.*`, `property2.*` prefixes
- **Legacy Tags**: Some templates use capitalized formats like `{{Borrower.Name}}` which map to their lowercase equivalents
