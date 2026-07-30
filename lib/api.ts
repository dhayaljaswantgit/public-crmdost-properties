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

export type Property = {
  id: string; companyId: string; companyName: string; name: string;
  price: string; currency: string; type: string; beds: string; baths: string; area: string;
  listingType: 'sale' | 'rent';
  rentFrequency: 'monthly' | 'quarterly' | 'yearly' | '';
  securityDeposit: string;
  maintenanceCharges: string;
  availableFrom: string;
  society: string; sector: string; addr1: string; addr2: string; description: string; images: string[];
  agentName: string; agentPhone: string; allowContact: boolean; allowMeeting: boolean;
};

export type Company = { id: string; name: string; initials: string; address: string };

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
    name: raw.name || 'Untitled property',
    price: String(raw.price || 0), currency: raw.currency_code || 'INR',
    type: raw.property_type_name || '', beds: String(raw.beds || ''), baths: String(raw.baths || ''),
    listingType,
    rentFrequency,
    securityDeposit: String(raw.security_deposit || ''),
    maintenanceCharges: String(raw.maintenance_charges || ''),
    availableFrom: String(raw.available_from || ''),
    area: String(raw.sqft || ''), society: raw.society_name || '', sector: raw.sector || '',
    addr1: raw.address || '', addr2: raw.address2nd || '', description: raw.description || '',
    images: Array.isArray(raw.images) ? raw.images : [],
    agentName, agentPhone, allowContact: !!raw.allow_contact, allowMeeting: !!raw.allow_meeting
  };
}

function mapCompany(raw: any): Company {
  const name = raw.name || 'Company';
  const initials = (name.match(/\b\w/g) || ['C']).slice(0, 2).join('').toUpperCase();
  return { id: String(raw.id ?? ''), name, initials, address: raw.address || '' };
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

export function shortMoney(v: string | number): string {
  const n = parseInt(String(v || '0'), 10);
  if (!n) return '—';
  if (n >= 10000000) return '₹' + (n / 10000000).toFixed(2).replace(/\.?0+$/, '') + ' Cr';
  if (n >= 100000) return '₹' + (n / 100000).toFixed(2).replace(/\.?0+$/, '') + ' L';
  return '₹' + n.toLocaleString('en-IN');
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

export async function fetchPublicCompany(uid: string) {
  const res = await fetch(`${API_V1_BASE}/property/public/company/${encodeURIComponent(uid)}`, { cache: 'no-store' });
  if (!res.ok) throw new Error('Failed to load company (' + res.status + ')');
  const json = await res.json();
  const data = json.data || {};
  const propsRaw = Array.isArray(data.properties) ? data.properties : [];
  return { company: mapCompany(data.company || {}), properties: propsRaw.map(mapProperty) };
}

// GET /property/:uid requires an auth token we don't have on the public site, so instead of calling it,
// we cache each property object as soon as it's fetched from the public list/company endpoints and
// look it up again when the user opens its detail page.
export function cacheProperty(p: Property) {
  if (typeof window === 'undefined') return;
  try { sessionStorage.setItem('crmdost:property:' + p.id, JSON.stringify(p)); } catch {}
}
export function getCachedProperty(id: string): Property | null {
  if (typeof window === 'undefined') return null;
  try { const raw = sessionStorage.getItem('crmdost:property:' + id); return raw ? JSON.parse(raw) : null; } catch { return null; }
}
