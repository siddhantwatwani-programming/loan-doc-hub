/**
 * Shared TIN (Tax Identification Number) Validation & Formatting Utilities
 * Used across Lender and Broker 1099 forms. IRS-compliant.
 */

/** Validate SSN: 9 digits, not all zeros in any group */
export const validateSSN = (value: string): boolean => {
  const digits = value.replace(/\D/g, '');
  if (digits.length !== 9) return false;
  const area = digits.substring(0, 3);
  const group = digits.substring(3, 5);
  const serial = digits.substring(5, 9);
  if (area === '000' || group === '00' || serial === '0000') return false;
  if (area === '666' || parseInt(area) >= 900) return false;
  return true;
};

/** Validate EIN: 9 digits, first two digits must be valid IRS prefix */
export const validateEIN = (value: string): boolean => {
  const digits = value.replace(/\D/g, '');
  if (digits.length !== 9) return false;
  const prefix = parseInt(digits.substring(0, 2));
  const validPrefixes = [
    10,12,20,27,30,32,35,36,37,38,40,41,42,43,44,45,46,47,48,
    50,51,52,53,54,55,56,57,58,59,60,61,62,63,64,65,66,67,68,
    71,72,73,74,75,76,77,80,81,82,83,84,85,86,87,88,90,91,92,
    93,94,95,98,99
  ];
  return validPrefixes.includes(prefix);
};

/** Format SSN: 123456789 → 123-45-6789 */
export const formatSSN = (value: string): string => {
  const digits = value.replace(/\D/g, '').slice(0, 9);
  if (digits.length <= 3) return digits;
  if (digits.length <= 5) return `${digits.slice(0, 3)}-${digits.slice(3)}`;
  return `${digits.slice(0, 3)}-${digits.slice(3, 5)}-${digits.slice(5)}`;
};

/** Format EIN: 123456789 → 12-3456789 */
export const formatEIN = (value: string): string => {
  const digits = value.replace(/\D/g, '').slice(0, 9);
  if (digits.length <= 2) return digits;
  return `${digits.slice(0, 2)}-${digits.slice(2)}`;
};

/** Format TIN based on type */
export const formatTIN = (value: string, tinType: 'SSN' | 'EIN'): string => {
  return tinType === 'SSN' ? formatSSN(value) : formatEIN(value);
};

/** Mask SSN: 123-45-6789 → ***-**-6789 */
export const maskSSN = (value: string): string => {
  const digits = value.replace(/\D/g, '');
  if (digits.length < 4) return '•'.repeat(digits.length);
  return `•••-••-${digits.slice(-4)}`;
};

/** Mask EIN: 12-3456789 → ••-•••••89 */
export const maskEIN = (value: string): string => {
  const digits = value.replace(/\D/g, '');
  if (digits.length < 4) return '•'.repeat(digits.length);
  return `••-•••${digits.slice(-4)}`;
};

/** Mask TIN based on type */
export const maskTIN = (value: string, tinType: 'SSN' | 'EIN'): string => {
  return tinType === 'SSN' ? maskSSN(value) : maskEIN(value);
};

/** Validate TIN based on type */
export const validateTIN = (value: string, tinType: 'SSN' | 'EIN'): boolean => {
  return tinType === 'SSN' ? validateSSN(value) : validateEIN(value);
};

/** Strip non-digits from TIN input */
export const stripTINInput = (value: string): string => {
  return value.replace(/\D/g, '').slice(0, 9);
};
