/**
 * Email validation utility following RFC 5321/5322 rules.
 *
 * Rules enforced:
 * - Must have local@domain.tld structure
 * - Local part: letters, digits, !#$%&'*+\-/=?^_`{|}~ and dots (not leading/trailing/consecutive)
 * - No spaces or forbidden chars (),:;<>[]
 * - Domain: letters, digits, hyphens; labels separated by dots
 * - TLD: at least 2 alpha chars, cannot be all numeric
 */

const EMAIL_REGEX =
  /^[a-zA-Z0-9!#$%&'*+\-/=?^_`{|}~](?:[a-zA-Z0-9!#$%&'*+\-/=?^_`{|}~.]*[a-zA-Z0-9!#$%&'*+\-/=?^_`{|}~])?@[a-zA-Z0-9](?:[a-zA-Z0-9-]*[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]*[a-zA-Z0-9])?)*\.[a-zA-Z]{2,}$/;

export function validateEmail(value: string): string | null {
  if (!value || !value.trim()) return null; // empty is OK (not required by default)
  const trimmed = value.trim();

  if (trimmed.length > 254) return 'Email is too long';
  if (trimmed.includes(' ')) return 'Email cannot contain spaces';
  if (!trimmed.includes('@')) return 'Email must contain @';

  const [local, ...rest] = trimmed.split('@');
  if (!local) return 'Missing local part before @';
  if (rest.length !== 1) return 'Email must contain exactly one @';

  const domain = rest[0];
  if (!domain || !domain.includes('.')) return 'Domain must include a TLD (e.g. .com)';

  if (local.startsWith('.') || local.endsWith('.')) return 'Dots cannot be first or last in local part';
  if (local.includes('..')) return 'Consecutive dots are not allowed';

  const tld = domain.split('.').pop() || '';
  if (/^\d+$/.test(tld)) return 'TLD cannot be entirely numeric';

  if (!EMAIL_REGEX.test(trimmed)) return 'Invalid email format';

  return null;
}
