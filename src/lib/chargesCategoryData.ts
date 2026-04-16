/**
 * Charges Department → Category → Details hierarchy.
 * Source: Charges_Categories.docx
 */

export const DEPARTMENT_OPTIONS = [
  'General',
  'Broker Services: Origination',
  'Broker Services: New Accounts',
  'Loan Servicing',
  'Default Management',
  'Foreclosure',
  'Bankruptcy',
  'Legal / Litigation',
  'Accounting / Financial',
  'Third Party / Pass Through',
] as const;

export const CATEGORY_OPTIONS: Record<string, string[]> = {
  'General': [
    'Account Maintenance',
    'Account Research',
    'Lender Vote Administration',
    'File Retrieval',
    'Document Copy Fee',
    'Courier / Overnight Delivery',
    'Client Credit / Adjustment',
    'Recording Coordination',
    'Default Interest Adjustment',
    'Insurance Tracking',
    'Tax Tracking',
  ],
  'Broker Services: Origination': [
    'Document Preparation',
    'Escrow: In House',
    'Loan Processing',
    'Admin / High Touch',
  ],
  'Broker Services: New Accounts': [
    'New Account Setup',
    'Account Close-out',
  ],
  'Loan Servicing': [
    'Document Preparation (Servicing)',
    'Verification of Mortgage',
    'Payoff Demand',
    'Reinstatement Quote',
    'Admin / High Touch',
  ],
  'Default Management': [
    'Loss Mitigation',
  ],
  'Foreclosure': [
    'Document Preparation',
    'Investor Vote',
    'Compliance Review',
    'Foreclosure Postponement',
    'Account Maintenance',
    'Cancellation',
    'Outside Assistance',
  ],
  'Bankruptcy': [
    'Document Preparation',
    'Bankruptcy Compliance Review',
    'Bankruptcy Account Setup',
    'Bankruptcy Assistance',
    'Bankruptcy Legal Coordination',
    'Bankruptcy Maintenance',
    'Administrative Assistance',
    'Professional Assistance',
  ],
  'Legal / Litigation': [
    'Service of Complaint',
    'Legal Document Preparation',
    'Deposition Preparation',
    'Court Appearance',
    'Administrative Assistance',
    'Professional Assistance',
  ],
  'Accounting / Financial': [
    'Payment Maintenance',
    'Payment Audit Report',
    'Away from Us',
    'Escrow Analysis (Original)',
    'Escrow Analysis (Supplemental)',
    'Escrow Cancellation',
    'Bank Charge',
  ],
  'Third Party / Pass Through': [
    'Trustee Fee',
    'Attorney Fee',
    'Court Filing Fee',
    'Recording Fee',
    'Title Search',
    'Property Inspection',
    'Property Preservation',
    'Publication Fee',
    'Posting Fee',
    'Courier Expense',
    'Overnight Delivery',
    'Certified Mail',
  ],
};

export const DETAILS_OPTIONS: Record<string, string[]> = {
  // General
  'Account Maintenance': ['XXX', 'YYY', 'ZZZ', 'AAA'],
  'Account Research': ['Standard', 'High Touch'],
  'Client Credit / Adjustment': ['Courtesy', 'Company Error'],

  // Broker Services: Origination
  'Document Preparation': ['Origination', 'Assignment', 'Other'],

  // Broker Services: New Accounts
  'New Account Setup': ['In House Transfer', 'New Origination', 'Transfer'],
  'Account Close-out': ['Payoff', 'Transfer', 'Dead Loan'],

  // Loan Servicing
  'Payoff Demand': ['Preparation', 'Update'],

  // Default Management → Loss Mitigation
  'Loss Mitigation': [
    'Document Preparation',
    'Loss Mitigation Assistance',
    'Compliance Review',
    'Investor Vote',
    'Default Management Fee',
    'Admin / High Touch',
    'Administrative Assistance',
    'Professional Assistance',
  ],

  // Foreclosure → Document Preparation (uses department-scoped key below)

  // Bankruptcy
  // Note: "Document Preparation" under Bankruptcy has different details than under Origination/Foreclosure.
  // We use department-scoped keys to disambiguate (see getCategoryDetails helper).
  'Bankruptcy Assistance': ['Payment Plan Monitoring', 'Bankruptcy Status Review'],

  // Legal / Litigation
  'Service of Complaint': ['Compliance Review', 'Subpoena Response', 'Litigation Coordination'],
  'Deposition Preparation': ['Travel', 'Appearance'],
  'Court Appearance': ['Travel', 'Appearance'],

  // Accounting / Financial
  'Payment Maintenance': ['Payment Research (Per Hour)', 'Payment Reversal (Per Month)'],
  'Away from Us': ['Payment', 'Payoff'],
  'Bank Charge': ['Returned Payment Fee', 'Bank Wire Processing', 'Recall ACH / Stop Payment'],
};

/**
 * Some category names (e.g., "Document Preparation") appear under multiple departments
 * with different details. This helper resolves the correct details list.
 */
const DEPARTMENT_SCOPED_DETAILS: Record<string, Record<string, string[]>> = {
  'Foreclosure': {
    'Document Preparation': [
      'Notice of Default',
      'Notice of Sale',
      'Bidding Instructions',
      'TSG',
      'Recission',
    ],
  },
  'Bankruptcy': {
    'Document Preparation': ['Proof of Claim', 'Motion for Relief'],
  },
};

/**
 * Get the details options for a given department + category combination.
 */
export function getCategoryDetails(department: string, category: string): string[] {
  // Check department-scoped overrides first
  const scoped = DEPARTMENT_SCOPED_DETAILS[department]?.[category];
  if (scoped) return scoped;

  return DETAILS_OPTIONS[category] || [];
}

/**
 * Get category options for a given department.
 */
export function getDepartmentCategories(department: string): string[] {
  return CATEGORY_OPTIONS[department] || [];
}
