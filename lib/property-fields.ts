/**
 * Property status and detail fields (CRMDOST-352), as the public site shows
 * them. Mirrors `nodejs-server/src/modules/property/property-fields.ts` and
 * `ionic-frontend/src/pages/Property/property-fields.ts`; keep the three
 * identical.
 */

export const PROPERTY_STATUSES = ['AVAILABLE', 'UNDER_OFFER', 'SOLD', 'RENTED', 'DRAFT'] as const;
export type PropertyStatus = (typeof PROPERTY_STATUSES)[number];

/** The API only serves these publicly; anything else answers 410. */
export const PUBLIC_LISTED_STATUSES: readonly PropertyStatus[] = ['AVAILABLE', 'UNDER_OFFER'];

export const normalizeStatus = (value: unknown): PropertyStatus => {
  const key = String(value ?? '').trim().toUpperCase().replace(/[\s-]+/g, '_');
  return (PROPERTY_STATUSES as readonly string[]).includes(key) ? (key as PropertyStatus) : 'AVAILABLE';
};

export const isUnderOffer = (status: unknown) => normalizeStatus(status) === 'UNDER_OFFER';

export const FURNISHED_OPTIONS = [
  { value: 'FURNISHED', label: 'Furnished' },
  { value: 'SEMI_FURNISHED', label: 'Semi-furnished' },
  { value: 'UNFURNISHED', label: 'Unfurnished' },
] as const;
export type Furnished = (typeof FURNISHED_OPTIONS)[number]['value'];

export const normalizeFurnished = (value: unknown): Furnished | '' => {
  const key = String(value ?? '').trim().toUpperCase().replace(/[\s-]+/g, '_');
  return (FURNISHED_OPTIONS.find((option) => option.value === key)?.value ?? '') as Furnished | '';
};

export const furnishedLabel = (value: unknown): string =>
  FURNISHED_OPTIONS.find((option) => option.value === normalizeFurnished(value))?.label ?? '';

/** A whole number from the API, else null (the API sends null when unset). */
export const toWholeNumber = (value: unknown): number | null => {
  const text = String(value ?? '').trim();
  return /^-?\d+$/.test(text) ? Number(text) : null;
};

/** "Ground", "Basement 2" or the floor number; "" when unset. */
export const formatFloor = (value: number | null): string => {
  if (value === null) return '';
  if (value === 0) return 'Ground';
  if (value < 0) return `Basement ${Math.abs(value)}`;
  return String(value);
};

/** "None", "1 space" or "n spaces"; "" when unset. */
export const formatParking = (value: number | null): string => {
  if (value === null || value < 0) return '';
  if (value === 0) return 'None';
  return `${value} ${value === 1 ? 'space' : 'spaces'}`;
};

/** "1 Oct 2026" from `YYYY-MM-DD` or an ISO datetime; "" when unset. UTC so server and browser agree. */
export const formatAvailableFrom = (value: unknown): string => {
  const text = String(value ?? '').trim();
  if (!/^\d{4}-\d{2}-\d{2}(T|$)/.test(text)) return '';
  const [y, m, d] = text.slice(0, 10).split('-').map(Number);
  return new Date(Date.UTC(y, m - 1, d)).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric', timeZone: 'UTC' });
};
