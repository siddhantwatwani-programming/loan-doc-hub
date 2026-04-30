/**
 * Mirror namespaced contact form values into the canonical (unprefixed) keys
 * that the contacts list-view grid reads from (top-level columns +
 * contact_data fields like `phone.cell`, `address.city`, etc.).
 *
 * Used by Co-borrower, Additional Guarantor, and Authorized Party detail
 * pages so that data entered in the namespaced detail form (e.g.
 * `coborrower.first_name`, `borrower.guarantor.first_name`,
 * `borrower.authorized_party.first_name`) also appears in the grid columns
 * after save.
 *
 * The original namespaced keys are preserved unchanged — this only ADDS
 * canonical mirror keys so that:
 *   - `useContactsCrud.updateContact` picks them up for the top-level
 *     `contacts` columns (full_name, first_name, last_name, email, phone,
 *     city, state).
 *   - The grid's `renderCellValue` finds them in `contact_data` for the
 *     remaining columns (phone.cell, address.*, preferred.*, capacity,
 *     middle_initial, etc.).
 *
 * No schema or API changes — uses the existing `contacts` save path.
 */

/** Field-name suffixes that the contacts grid reads from contact_data. */
const GRID_CONTACT_DATA_SUFFIXES = [
  'phone.home', 'phone.home2', 'phone.work', 'phone.cell', 'phone.fax',
  'phone.mobile',
  'preferred.home', 'preferred.home2', 'preferred.work', 'preferred.cell',
  'preferred.fax',
  'address.street', 'address.city', 'address.state', 'address.zip',
  'mailing.street', 'mailing.city', 'mailing.state', 'mailing.zip',
  'middle_initial', 'middle_name',
  'capacity',
  'borrower_type',
  'tax_id', 'tin',
  'delivery_print', 'delivery_email', 'delivery_sms', 'agreement_on_file',
];

/** Top-level `contacts` columns that `useContactsCrud.updateContact` reads. */
const TOP_LEVEL_KEYS = [
  'full_name', 'first_name', 'last_name', 'email', 'phone',
  'city', 'state', 'company',
];

/**
 * Mirror values stored under `<prefix>` into the canonical unprefixed keys
 * the grid + useContactsCrud expect. The prefix MUST end with a dot.
 *
 * Mirroring rules:
 *  - `<prefix>first_name` → `first_name` (top-level + contact_data)
 *  - `<prefix>last_name`  → `last_name`  (top-level + contact_data)
 *  - `<prefix>full_name`  → `full_name`  (top-level + contact_data)
 *  - `<prefix>email`      → `email`      (top-level + contact_data)
 *  - `<prefix>company`    → `company`    (top-level + contact_data)
 *  - `<prefix>middle_initial` / `<prefix>middle_name` → `middle_initial` / `middle_name`
 *  - `<prefix>address.city`  → `city` (top-level) + `address.city` (contact_data)
 *  - `<prefix>address.state` → `state` (top-level) + `address.state` (contact_data)
 *  - `<prefix>phone.cell` (etc.) → `phone.cell` (contact_data); first non-empty
 *    phone (cell|mobile|home|work) also goes to top-level `phone`.
 *  - All other `<prefix>X` whose `X` matches GRID_CONTACT_DATA_SUFFIXES → `X` in contact_data.
 *
 * Returns a NEW object (does not mutate input).
 */
export function mirrorPrefixedToCanonical(
  contactData: Record<string, string>,
  prefix: string,
): Record<string, string> {
  if (!prefix.endsWith('.')) {
    throw new Error(`mirrorPrefixedToCanonical: prefix must end with '.', got "${prefix}"`);
  }
  const out: Record<string, string> = { ...contactData };
  const get = (k: string): string | undefined => {
    const v = contactData[prefix + k];
    return typeof v === 'string' && v.length > 0 ? v : undefined;
  };

  // Direct top-level + contact_data mirrors
  const directMirrors: Array<[string, string]> = [
    ['first_name', 'first_name'],
    ['last_name', 'last_name'],
    ['full_name', 'full_name'],
    ['email', 'email'],
    ['company', 'company'],
    ['middle_initial', 'middle_initial'],
    ['middle_name', 'middle_name'],
  ];
  for (const [src, dst] of directMirrors) {
    const v = get(src);
    if (v !== undefined && (out[dst] === undefined || out[dst] === '')) {
      out[dst] = v;
    }
  }

  // Compose full_name from first/last if missing
  if (!out.full_name) {
    const fn = out.first_name || '';
    const ln = out.last_name || '';
    const composed = `${fn} ${ln}`.trim();
    if (composed) out.full_name = composed;
  }

  // Address: top-level city/state come from address.city / address.state
  const addrCity = get('address.city');
  if (addrCity !== undefined && !out.city) out.city = addrCity;
  if (addrCity !== undefined && !out['address.city']) out['address.city'] = addrCity;

  const addrState = get('address.state');
  if (addrState !== undefined && !out.state) out.state = addrState;
  if (addrState !== undefined && !out['address.state']) out['address.state'] = addrState;

  // Mirror remaining grid-relevant suffixes into contact_data
  for (const suffix of GRID_CONTACT_DATA_SUFFIXES) {
    const v = get(suffix);
    if (v !== undefined && (out[suffix] === undefined || out[suffix] === '')) {
      out[suffix] = v;
    }
  }

  // Top-level `phone` — pick first non-empty among cell/mobile/home/work
  if (!out.phone) {
    const phone =
      get('phone.cell') ||
      get('phone.mobile') ||
      get('phone.home') ||
      get('phone.work') ||
      '';
    if (phone) out.phone = phone;
  }

  // Touch top-level keys to satisfy save shape (no-op if already set)
  for (const k of TOP_LEVEL_KEYS) {
    if (out[k] === undefined) out[k] = '';
  }

  return out;
}
