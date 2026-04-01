/**
 * Shared Banking Validation & Masking Utilities
 * Used across Lender and Broker Banking forms.
 */

/** Validate 9-digit US routing number */
export const validateRoutingNumber = (value: string): boolean => {
  const digits = value.replace(/\D/g, '');
  if (digits.length !== 9) return false;
  // ABA checksum: 3×(d1+d4+d7) + 7×(d2+d5+d8) + (d3+d6+d9) mod 10 === 0
  const d = digits.split('').map(Number);
  const checksum = 3 * (d[0] + d[3] + d[6]) + 7 * (d[1] + d[4] + d[7]) + (d[2] + d[5] + d[8]);
  return checksum % 10 === 0;
};

/** Validate account number length: 6–17 digits */
export const validateAccountNumber = (value: string): boolean => {
  const digits = value.replace(/\D/g, '');
  return digits.length >= 6 && digits.length <= 17;
};

/** Luhn algorithm for credit card validation */
export const validateCardLuhn = (value: string): boolean => {
  const digits = value.replace(/\D/g, '');
  if (digits.length < 13 || digits.length > 19) return false;
  let sum = 0;
  let alternate = false;
  for (let i = digits.length - 1; i >= 0; i--) {
    let n = parseInt(digits[i], 10);
    if (alternate) {
      n *= 2;
      if (n > 9) n -= 9;
    }
    sum += n;
    alternate = !alternate;
  }
  return sum % 10 === 0;
};

/** Validate CVV: 3 or 4 digits */
export const validateCVV = (value: string): boolean => {
  const digits = value.replace(/\D/g, '');
  return digits.length === 3 || digits.length === 4;
};

/** Validate expiration is a future date in MM/YY format */
export const validateExpirationFuture = (value: string): boolean => {
  if (!/^\d{2}\/\d{2}$/.test(value)) return false;
  const [mm, yy] = value.split('/').map(Number);
  if (mm < 1 || mm > 12) return false;
  const now = new Date();
  const currentMonth = now.getMonth() + 1;
  const currentYear = now.getFullYear() % 100;
  if (yy < currentYear) return false;
  if (yy === currentYear && mm < currentMonth) return false;
  return true;
};

/** Mask account/card number → show last 4 digits: ••••1234 */
export const maskAccountNumber = (value: string): string => {
  if (!value || value.length <= 4) return value;
  return '•'.repeat(value.length - 4) + value.slice(-4);
};

/** Mask card number → **** **** **** 1234 style */
export const maskCardNumber = (value: string): string => {
  const digits = value.replace(/\D/g, '');
  if (digits.length <= 4) return digits;
  const masked = '•'.repeat(digits.length - 4) + digits.slice(-4);
  // Group into 4s for readability
  return masked.replace(/(.{4})/g, '$1 ').trim();
};

/** Validate alphabets + spaces only */
export const validateAlphaOnly = (value: string): boolean => {
  return /^[A-Za-z\s]+$/.test(value);
};

/** Validate bank name: required, max 100 */
export const validateBankName = (value: string): boolean => {
  return value.trim().length > 0 && value.length <= 100;
};

/** Strip non-numeric from input for numeric-only fields */
export const stripNonNumeric = (value: string): string => {
  return value.replace(/\D/g, '');
};
