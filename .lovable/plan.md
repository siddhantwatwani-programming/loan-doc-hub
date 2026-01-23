
# Plan: Upload Assignment (WA) Template with Field Mappings

## Overview
Upload the "Assignment of Deed of Trust" (Washington state) template and create all necessary field mappings. This follows the same pattern as the existing "Lender Disclosures" template.

## Document Analysis
Based on the parsed DOCX content, this is a **2-page Washington State Assignment of Deed of Trust** with blank fields for:
- Assignee information (name, address)
- Original Deed of Trust details (date, grantor, trustee, recording info)
- Property legal description
- Vesting and signature blocks
- Two notary acknowledgment sections

---

## Part 1: Create Missing Fields in `field_dictionary`

Based on your extracted field list and cross-referencing with existing fields, the following **new fields need to be created** in the `other` section:

### Return Information Fields
| Field Key | Label | Data Type |
|-----------|-------|-----------|
| `return.name` | Return Name | text |
| `return.address` | Return Address | text |
| `return.cityStateZip` | Return City, State, Zip | text |

### Document Header Fields
| Field Key | Label | Data Type |
|-----------|-------|-----------|
| `assignment.lpbNumber` | LPB Number | text |

### Assignment Details Fields
| Field Key | Label | Data Type |
|-----------|-------|-----------|
| `assignee.name` | Assignee Name | text |
| `assignee.address` | Assignee Address | text |
| `deedOfTrust.date` | Deed of Trust Date | date |
| `deedOfTrust.grantor` | Grantor Name | text |
| `deedOfTrust.trustee` | Trustee Name | text |
| `recording.date` | Recording Date | date |
| `recording.mortgageVolume` | Volume of Mortgages | text |
| `recording.mortgagePage` | Page Number | text |
| `recording.auditorsFileNumber` | Auditor's File Number | text |
| `recording.county` | Recording County | text |
| `property.legalDescription` | Property Legal Description | text |

### Financial/Rights Section
| Field Key | Label | Data Type |
|-----------|-------|-----------|
| `assignment.noteDescription` | Associated Note Description | text |
| `assignment.moneyDueDescription` | Money Due Description | text |
| `assignment.interestDescription` | Interest Description | text |

### Vesting & Execution
| Field Key | Label | Data Type |
|-----------|-------|-----------|
| `assignment.vesting` | Vesting | text |
| `assignment.authorizedSignature` | Authorized Signature | text |
| `assignment.signerCapacity` | Signer Capacity | text |

### Notary Section - Acknowledgment 1
| Field Key | Label | Data Type |
|-----------|-------|-----------|
| `notary1.state` | Notary State (Ack 1) | text |
| `notary1.county` | Notary County (Ack 1) | text |
| `notary1.ackDay` | Acknowledgment Day (Ack 1) | integer |
| `notary1.ackMonth` | Acknowledgment Month (Ack 1) | text |
| `notary1.ackYear` | Acknowledgment Year (Ack 1) | integer |
| `notary1.appearingPartyName` | Appearing Party Name (Ack 1) | text |
| `notary1.signature` | Notary Signature (Ack 1) | text |
| `notary1.printedName` | Notary Printed Name (Ack 1) | text |
| `notary1.residence` | Notary Residence (Ack 1) | text |
| `notary1.expirationDate` | Notary Expiration Date (Ack 1) | date |

### Notary Section - Acknowledgment 2
| Field Key | Label | Data Type |
|-----------|-------|-----------|
| `notary2.state` | Notary State (Ack 2) | text |
| `notary2.county` | Notary County (Ack 2) | text |
| `notary2.authorizedPersonName` | Authorized Person Name (Ack 2) | text |
| `notary2.authorizationStatement` | Authorization Statement (Ack 2) | text |
| `notary2.representativeCapacity` | Representative Capacity (Ack 2) | text |
| `notary2.representedEntityName` | Represented Entity Name (Ack 2) | text |
| `notary2.ackDate` | Acknowledgment Date (Ack 2) | date |
| `notary2.signature` | Notary Signature (Ack 2) | text |
| `notary2.printedName` | Notary Printed Name (Ack 2) | text |
| `notary2.residence` | Notary Residence (Ack 2) | text |
| `notary2.expirationDate` | Notary Expiration Date (Ack 2) | date |

**Total: ~40 new fields** to be inserted into `field_dictionary` with `section = 'other'`

---

## Part 2: Existing Fields to Reuse

The following fields **already exist** and can be mapped:
| Existing Field Key | Maps To Document Field |
|--------------------|------------------------|
| `title.companyName` | Title Company Name |
| `Lender.Name` | (if needed for assignee context) |

---

## Part 3: Create Template Record

Insert a new template record:
```text
Name: Assignment (WA)
State: WA
Product Type: Conventional
Version: 1
Is Active: true
```

---

## Part 4: Upload DOCX File

1. Copy the uploaded `Assignment_WA.docx` to the project's templates storage
2. Call the `upload-template` edge function to store in the `templates` bucket
3. Update the template record with the file path

---

## Part 5: Create Template Field Maps

After creating the template and fields, insert `template_field_maps` records linking:
- Each new field dictionary entry to the template
- Set `required_flag` appropriately (key identifying fields like assignee name, grantor, trustee = required)
- Set `display_order` for logical grouping

---

## Implementation Steps

1. **Database Insert - New Fields**  
   Insert ~40 new field dictionary entries into `field_dictionary` table

2. **Database Insert - Template Record**  
   Create template record for "Assignment (WA)"

3. **Copy & Upload DOCX**  
   - Copy `user-uploads://Assignment_WA.docx` to `public/templates/`
   - Upload to Supabase storage bucket

4. **Database Insert - Field Mappings**  
   Create `template_field_maps` entries linking fields to template

5. **Verification**  
   - Verify template appears in Template Management
   - Validate field mapping in Field Map Editor
   - Test document generation flow

---

## Technical Details

### SQL for Field Dictionary Inserts
All fields will be inserted with:
- `section`: `'other'` (as specified)
- `is_calculated`: `false`
- `is_repeatable`: `false`
- `allowed_roles`: `ARRAY['admin', 'csr']::text[]`

### Field Mapping Rules
Fields will be mapped to support the document merge tag patterns:
- `{{FieldKey}}` format for programmatic replacement
- Word MERGEFIELD format (`« field »`) for legacy support
