/**
 * Print a property's area with its unit.
 *
 * Kept in step with AREA_UNITS in nodejs-server's property controller and
 * ionic-frontend/src/pages/Property/area-units.ts. Listings saved before units
 * existed have none and always showed "sq ft", so that stays the default; older
 * free-text values that already carry a unit are shown as written.
 */
const AREA_UNIT_LABELS: Record<string, string> = {
  sqft: 'sq ft',
  sqyd: 'sq yd',
  sqm: 'sq m',
  acre: 'acre',
  hectare: 'hectare',
};

export const formatArea = (value: unknown, unit?: string | null, empty = '—'): string => {
  const text = String(value ?? '').trim();
  if (!text) return empty;
  if (/[a-z]/i.test(text)) return text;
  return `${text} ${AREA_UNIT_LABELS[String(unit || '')] ?? 'sq ft'}`;
};
