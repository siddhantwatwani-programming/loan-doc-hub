/**
 * Canonical list of US states and territories.
 * Import from here instead of defining local arrays.
 * Standard format: two-letter USPS abbreviation.
 */
export const US_STATES: string[] = [
  'AL', 'AK', 'AZ', 'AR', 'CA', 'CO', 'CT', 'DE', 'DC', 'FL', 'GA',
  'HI', 'ID', 'IL', 'IN', 'IA', 'KS', 'KY', 'LA', 'ME', 'MD',
  'MA', 'MI', 'MN', 'MS', 'MO', 'MT', 'NE', 'NV', 'NH', 'NJ',
  'NM', 'NY', 'NC', 'ND', 'OH', 'OK', 'OR', 'PA', 'RI', 'SC',
  'SD', 'TN', 'TX', 'UT', 'VT', 'VA', 'WA', 'WV', 'WI', 'WY',
  'AS', 'GU', 'MP', 'PR', 'VI',
];

/** Convenience alias used by some components */
export const STATE_OPTIONS = US_STATES;

/** State filter options for table views (value & label both use abbreviation) */
export const STATE_FILTER_OPTIONS = US_STATES.map(s => ({ value: s, label: s }));
