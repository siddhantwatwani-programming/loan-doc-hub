import { validateEmail } from '@/lib/emailValidation';

/**
 * Checks if a deal modal form has at least one meaningful field filled.
 * Skips id fields, boolean false values, and known default/empty values.
 */
export const hasModalFormData = (
  form: Record<string, any>,
  skipKeys: string[] = [],
  defaultValues: Record<string, any> = {}
): boolean => {
  const alwaysSkip = new Set([
    'id', ...skipKeys,
  ]);

  for (const [key, value] of Object.entries(form)) {
    if (alwaysSkip.has(key)) continue;

    // Skip if value matches the default
    if (key in defaultValues && value === defaultValues[key]) continue;

    if (typeof value === 'boolean') {
      if (value === true) return true;
      continue;
    }

    if (typeof value === 'string') {
      const trimmed = value.trim();
      if (trimmed === '' || trimmed === 'false' || trimmed === 'all') continue;
      return true;
    }

    if (Array.isArray(value)) {
      if (value.length > 0) return true;
      continue;
    }
  }
  return false;
};

/**
 * Returns true when every email field in the form is either empty or valid.
 * Pass the field keys that hold email addresses (e.g. 'email', 'appraiserEmail').
 */
export const hasValidEmails = (
  form: Record<string, any>,
  emailKeys: string[],
): boolean => {
  for (const key of emailKeys) {
    const value = form[key];
    if (typeof value === 'string' && value.trim() !== '') {
      if (validateEmail(value) !== null) return false;
    }
  }
  return true;
};
