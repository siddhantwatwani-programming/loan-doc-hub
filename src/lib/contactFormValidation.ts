/**
 * Checks if a contact form has at least one meaningful (non-default) field filled.
 * Ignores boolean fields set to false and empty strings.
 */
export const hasAtLeastOneFieldFilled = (form: Record<string, any>, skipKeys: string[] = []): boolean => {
  const defaultSkip = new Set([
    'id', 'borrowerId', 'brokerId', 'lenderId',
    // boolean defaults
    'sameAsPrimary', 'mailing_same_as_primary',
    ...skipKeys,
  ]);

  for (const [key, value] of Object.entries(form)) {
    if (defaultSkip.has(key)) continue;
    if (typeof value === 'boolean') {
      // Booleans like hold, ach, verified etc. - if true, it counts as filled
      if (value === true) return true;
      continue;
    }
    if (typeof value === 'string') {
      const trimmed = value.trim();
      // Skip default select values that are always pre-set
      if (trimmed === '' || trimmed === 'false' || trimmed === 'Individual' || trimmed === 'Cell' || trimmed === 'cell') continue;
      return true;
    }
  }
  return false;
};

/**
 * Validates phone fields in a form. Returns error messages for invalid phones.
 */
export const validatePhoneFields = (
  phones: { label: string; value: string }[]
): string[] => {
  const errors: string[] = [];
  for (const { label, value } of phones) {
    if (!value) continue;
    const digits = value.replace(/\D/g, '');
    if (digits.length > 0 && digits.length !== 10) {
      errors.push(`${label} must be a valid 10-digit US phone number`);
    }
  }
  return errors;
};
