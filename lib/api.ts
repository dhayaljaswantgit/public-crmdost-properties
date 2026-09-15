import { normalizeFurnished, normalizeStatus, toWholeNumber, type Furnished, type PropertyStatus } from './property-fields';

const PROD_API_FALLBACK = 'https://test.apis.crmdost.com';
const DEV_API_FALLBACK = 'http://localhost:3004';

const rawApiBase =
  process.env.NEXT_PUBLIC_API_URL ||
  (process.env.NODE_ENV === 'production' ? PROD_API_FALLBACK : DEV_API_FALLBACK);

const apiBaseHasProtocol = /^https?:\/\//i.test(String(rawApiBase));

export const API_BASE = apiBaseHasProtocol
  ? String(rawApiBase).replace(/\/+$/, '')
  : (process.env.NODE_ENV === 'production' ? PROD_API_FALLBACK : DEV_API_FALLBACK);

export const API_V1_BASE = `${API_BASE}/v1`;

/**
 * How a company chose to present itself (CRM → Settings → Workspace →
 * Branding). Values are sanitised here: the colour must be a #rrggbb hex and
 * the logo an https URL, so nothing else from the API reaches a style or src.
 */
export type CompanyBrand = {
  name: string;
  logo: string;
  color: string;
  showName: boolean;
};

export const DEFAULT_BRAND_COLOR = '#E8650A';

export function toBrand(name: unknown, logo: unknown, color: unknown, displayMode: unknown): CompanyBrand {
  const hex = String(color || '');
  const url = String(logo || '');
  const hasLogo = /^https:\/\//i.test(url);
  return {
    name: String(name || ''),
    logo: hasLogo ? url : '',
    // "none" is the CRM's "no colour" (transparent) swatch: a neutral dark,
    // not the orange a never-set colour falls back to.
    color: hex === 'none' ? '#3A3530' : /^#[0-9a-f]{6}$/i.test(hex) ? hex : DEFAULT_BRAND_COLOR,
    // "Logo only" needs a logo to show; without one the name must stay.
    showName: !(hasLogo && displayMode === 'logo'),
  };
}

export type Property = {
  id: string; companyId: string; companyName: string; name: string;
  /** The company's public-site slug; '' on copies cached before slugs existed. */
  companySlug: string;
  /** Optional: copies cached before branding existed do not carry it. */
  brand?: CompanyBrand;
  price: string; currency: string; type: string; beds: string; baths: string; area: string; areaUnit: string;
  /** Optional: copies cached before these fields were shown do not carry them. */
  subType?: string;
  societyArea?: string;
  societyAreaUnit?: string;
  listingType: 'sale' | 'rent';
  rentFrequency: 'monthly' | 'quarterly' | 'yearly' | '';
  securityDeposit: string;
  maintenanceCharges: string;
  /** `YYYY-MM-DD`; applies to sale and rent listings alike. */
  availableFrom: string;
  /**
   * Optional (copies cached before CRMDOST-352 do not carry them). The API
   * only ever serves AVAILABLE and UNDER_OFFER listings here.
   */
  status?: PropertyStatus;
  furnished?: Furnished | '';
  floorNumber?: number | null;
  parkingSpaces?: number | null;
  yearBuilt?: number | null;
  society: string; sector: string; addr1: string; addr2: string; description: string; images: string[];
  agentName: string; agentPhone: string; allowContact: boolean; allowMeeting: boolean;
};

/**
 * What a public property address resolves to: the listing, a listing that has
 * left the market (the API answers 410 with the company to fall back to), or
 * nothing at all.
 */
export type PropertyLookup =
  | { state: 'found'; property: Property }
  | { state: 'unavailable'; company: { id: string; slug: string; name: string } }
  | { state: 'missing' };

export type Company = { id: string; slug: string; name: string; initials: string; address: string; brand: CompanyBrand };

/**
 * Public URLs: a company at /{companySlug}, a property at
 * /{companySlug}/{propertySlug}. Without a slug (a copy cached before slugs
 * existed) the legacy path is used; it redirects to the canonical one.
 */
export const companyPath = (slug: string | undefined, id: string) =>
  slug ? `/${slug}` : `/company/${id}`;
export const propertyPath = (p: Pick<Property, 'id' | 'companySlug'>) =>
  p.companySlug ? `/${p.companySlug}/${p.id}` : `/properties/${p.id}`;

/**
 * Fetch options: the browser always wants fresh data (`no-store`); server
 * renders (page metadata, share images, redirects) pass `revalidate` seconds
 * so a burst of link previews does not hit the API every time.
 */
type FetchFreshness = { revalidate?: number };
const freshness = ({ revalidate }: FetchFreshness = {}): RequestInit =>
  revalidate === undefined ? { cache: 'no-store' } : ({ next: { revalidate } } as RequestInit);

// Adapter for the real CRM Dost API shape: { statusCode, message, data: { properties: [...], total } }
function mapProperty(raw: any): Property {
  const listingType = String(raw?.listing_type || 'sale').toLowerCase() === 'rent' ? 'rent' : 'sale';
  const rentFrequencyRaw = String(raw?.rent_frequency || '').toLowerCase();
  const rentFrequency = ['monthly', 'quarterly', 'yearly'].includes(rentFrequencyRaw)
    ? (rentFrequencyRaw as 'monthly' | 'quarterly' | 'yearly')
    : '';
  const agentName = [raw.contactUserFirstName, raw.contactUserLastName].filter(Boolean).join(' ') || raw.contact_name || '';
  const agentPhone = raw.contactUserMobile || raw.contact_phone || '';
  return {
    id: raw.uid || String(raw.id || ''), companyId: String(raw.companyId ?? raw.companyUid ?? ''),
    companyName: raw.companyName || '',
    companySlug: String(raw.companySlug || ''),
    brand: toBrand(raw.companyName, raw.companyLogo, raw.companyBrandColor, raw.companyDisplayMode),
    name: raw.name || 'Untitled property',
    price: String(raw.price || 0), currency: String(raw.currency_code || 'INR').toUpperCase(),
    type: raw.property_type_name || '', subType: raw.property_sub_type_name || '',
    beds: String(raw.beds || ''), baths: String(raw.baths || ''),
    listingType,
    rentFrequency,
    securityDeposit: String(raw.security_deposit || ''),
    maintenanceCharges: String(raw.maintenance_charges || ''),
    // The API serialises the DATE column as an ISO datetime; keep the day only.
    availableFrom: String(raw.available_from || '').slice(0, 10),
    status: normalizeStatus(raw.status),
    furnished: normalizeFurnished(raw.furnished),
    floorNumber: toWholeNumber(raw.floor_number),
    parkingSpaces: toWholeNumber(raw.parking_spaces),
    yearBuilt: toWholeNumber(raw.year_built),
    area: String(raw.sqft || ''), areaUnit: String(raw.area_unit || ''),
    societyArea: String(raw.society_area || ''), societyAreaUnit: String(raw.society_area_unit || ''),
    society: raw.society_name || '', sector: raw.sector || '',
    addr1: raw.address || '', addr2: raw.address2nd || '', description: raw.description || '',
    images: Array.isArray(raw.images) ? raw.images : [],
    agentName, agentPhone, allowContact: !!raw.allow_contact, allowMeeting: !!raw.allow_meeting
  };
}

function mapCompany(raw: any): Company {
  const name = raw.name || 'Company';
  const initials = (name.match(/\b\w/g) || ['C']).slice(0, 2).join('').toUpperCase();
  return {
    id: String(raw.id ?? ''), slug: String(raw.slug || ''), name, initials, address: raw.address || '',
    brand: toBrand(name, raw.logo, raw.brandColor, raw.displayMode),
  };
}

// Prefer server-provided listing type; keep deterministic fallback for legacy records.
export function listingTag(id: string, listingType?: string): { tag: 'For Sale' | 'For Rent'; isRent: boolean } {
  const normalized = String(listingType || '').toLowerCase();
  if (normalized === 'rent') return { tag: 'For Rent', isRent: true };
  if (normalized === 'sale') return { tag: 'For Sale', isRent: false };

  let hash = 0; for (let i = 0; i < id.length; i++) hash = (hash * 31 + id.charCodeAt(i)) >>> 0;
  const isRent = hash % 2 === 0;
  return { tag: isRent ? 'For Rent' : 'For Sale', isRent };
}

/**
 * A price in the listing's own currency. Rupees use lakh/crore; every other
 * currency is compacted by Intl in its own symbol ("$450K", "€1.2M"). Every
 * price used to be printed as rupees whatever currency the agent had chosen.
 */
export function formatMoney(v: string | number, currency = 'INR'): string {
  const n = Number(String(v ?? '').replace(/[^\d.]/g, ''));
  if (!Number.isFinite(n) || n <= 0) return '—';
  const code = String(currency || 'INR').toUpperCase();
  if (code === 'INR') {
    if (n >= 10000000) return '₹' + (n / 10000000).toFixed(2).replace(/\.?0+$/, '') + ' Cr';
    if (n >= 100000) return '₹' + (n / 100000).toFixed(2).replace(/\.?0+$/, '') + ' L';
    return '₹' + Math.round(n).toLocaleString('en-IN');
  }
  try {
    return new Intl.NumberFormat('en', {
      style: 'currency',
      currency: code,
      notation: n >= 10000 ? 'compact' : 'standard',
      compactDisplay: 'short',
      maximumFractionDigits: n >= 10000 ? 2 : 0,
    }).format(n);
  } catch {
    return `${code} ${Math.round(n).toLocaleString('en')}`;
  }
}

/** "/mo", "/qtr" or "/yr" after a rent; nothing for a sale. */
export function rentSuffix(listingType: string | undefined, rentFrequency: string | undefined): string {
  if (String(listingType || '').toLowerCase() !== 'rent') return '';
  const freq = String(rentFrequency || 'monthly').toLowerCase();
  return freq === 'yearly' ? '/yr' : freq === 'quarterly' ? '/qtr' : '/mo';
}

/** The currency most of a company's listings use, for its price range and filter. */
export function dominantCurrency(list: Array<Pick<Property, 'currency'>>): string {
  const counts = new Map<string, number>();
  for (const item of list) {
    const code = String(item.currency || 'INR').toUpperCase();
    counts.set(code, (counts.get(code) || 0) + 1);
  }
  let best = 'INR';
  let bestCount = 0;
  counts.forEach((count, code) => { if (count > bestCount) { best = code; bestCount = count; } });
  return best;
}

export type PriceBucket = { value: string; label: string; match: (n: number) => boolean };

/**
 * Price filter steps in the listings' currency: 50 L / 1 Cr / 2 Cr for
 * rupees, 250K / 500K / 1M for everything else.
 */
export function priceBuckets(currency: string): PriceBucket[] {
  const [a, b, c] = currency === 'INR' ? [5000000, 10000000, 20000000] : [250000, 500000, 1000000];
  return [
    { value: 'any', label: 'Any price', match: () => true },
    { value: 'b1', label: `Under ${formatMoney(a, currency)}`, match: (n) => n < a },
    { value: 'b2', label: `${formatMoney(a, currency)} – ${formatMoney(b, currency)}`, match: (n) => n >= a && n < b },
    { value: 'b3', label: `${formatMoney(b, currency)} – ${formatMoney(c, currency)}`, match: (n) => n >= b && n < c },
    { value: 'b4', label: `${formatMoney(c, currency)}+`, match: (n) => n >= c },
  ];
}

export async function fetchPublicProperties(params: { page?: number; perPage?: number; search?: string; type?: string }) {
  const qs = new URLSearchParams();
  if (params.page) qs.set('page', String(params.page));
  if (params.perPage) qs.set('per_page', String(params.perPage));
  if (params.search) qs.set('search', params.search);
  if (params.type && params.type !== 'any') qs.set('type', params.type);
  const res = await fetch(`${API_V1_BASE}/property/public?${qs.toString()}`, { cache: 'no-store' });
  if (!res.ok) throw new Error('Failed to load properties (' + res.status + ')');
  const json = await res.json();
  const data = json.data || {};
  const items = (Array.isArray(data.properties) ? data.properties : []).map(mapProperty);
  return { items, total: typeof data.total === 'number' ? data.total : items.length };
}

/** A company by slug, or by id for legacy links. */
export async function fetchPublicCompany(uid: string, opts?: FetchFreshness) {
  const res = await fetch(`${API_V1_BASE}/property/public/company/${encodeURIComponent(uid)}`, freshness(opts));
  if (!res.ok) throw new Error('Failed to load company (' + res.status + ')');
  const json = await res.json();
  const data = json.data || {};
  const propsRaw = Array.isArray(data.properties) ? data.properties : [];
  // The banner set in CRM → Properties → Manage banner.
  const bannerImages = (Array.isArray(data.sliderImages) ? data.sliderImages : [])
    .map((url: unknown) => String(url || '').trim())
    .filter((url: string) => /^https?:\/\//i.test(url));
  return { company: mapCompany(data.company || {}), properties: propsRaw.map(mapProperty), bannerImages };
}

/**
 * One published property address, always fresh from the API.
 *
 * 410 means the listing was public but is sold, rented or a draft now: the
 * API sends the company so the page can point at its other listings. Any
 * other 4xx (missing, never published) is "missing", so an unpublished
 * listing can never be shown from a stale copy. Throws on a network/server
 * failure so the caller can fall back to a cached copy rather than claim the
 * property is gone.
 */
export async function lookupPublicProperty(uid: string, opts?: FetchFreshness): Promise<PropertyLookup> {
  const res = await fetch(`${API_V1_BASE}/property/${encodeURIComponent(uid)}`, freshness(opts));
  if (res.status === 410) {
    const json = await res.json().catch(() => ({}));
    const data = json?.data || {};
    return {
      state: 'unavailable',
      company: { id: String(data.companyId ?? ''), slug: String(data.companySlug || ''), name: String(data.companyName || '') },
    };
  }
  if (res.status >= 400 && res.status < 500) return { state: 'missing' };
  if (!res.ok) throw new Error('Failed to load property (' + res.status + ')');
  const json = await res.json();
  return json?.data ? { state: 'found', property: mapProperty(json.data) } : { state: 'missing' };
}

/** The listing at a public address, or null when there is nothing to show (missing or off the market). */
export async function fetchPublicProperty(uid: string, opts?: FetchFreshness): Promise<Property | null> {
  const lookup = await lookupPublicProperty(uid, opts);
  return lookup.state === 'found' ? lookup.property : null;
}

// A copy of each property seen on the list/company pages, so opening one from
// there paints instantly. The detail page still re-fetches — this is only a
// head start, never the source of truth.
export function cacheProperty(p: Property) {
  if (typeof window === 'undefined') return;
  try { sessionStorage.setItem('crmdost:property:' + p.id, JSON.stringify(p)); } catch {}
}
export function getCachedProperty(id: string): Property | null {
  if (typeof window === 'undefined') return null;
  try { const raw = sessionStorage.getItem('crmdost:property:' + id); return raw ? JSON.parse(raw) : null; } catch { return null; }
}

export function forgetCachedProperty(id: string) {
  if (typeof window === 'undefined') return;
  try { sessionStorage.removeItem('crmdost:property:' + id); } catch {}
}
