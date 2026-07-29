export const API_BASE = process.env.NEXT_PUBLIC_API_BASE || 'https://elegant-oriole-sunny.ngrok-free.app/v1';
// ngrok free tunnels show an HTML interstitial warning to browser-like requests unless this header is sent.
const NGROK_HEADERS: Record<string, string> = { 'ngrok-skip-browser-warning': 'true' };

export type Property = {
  id: string; companyId: string; companyName: string; name: string;
  price: string; currency: string; type: string; beds: string; baths: string; area: string;
  society: string; sector: string; addr1: string; addr2: string; description: string; images: string[];
  agentName: string; agentPhone: string; allowContact: boolean; allowMeeting: boolean;
};

export type Company = { id: string; name: string; initials: string; address: string };

// Adapter for the real CRM Dost API shape: { statusCode, message, data: { properties: [...], total } }
function mapProperty(raw: any): Property {
  const agentName = [raw.contactUserFirstName, raw.contactUserLastName].filter(Boolean).join(' ') || raw.contact_name || '';
  const agentPhone = raw.contactUserMobile || raw.contact_phone || '';
  return {
    id: raw.uid || String(raw.id || ''), companyId: String(raw.companyId ?? raw.companyUid ?? ''),
    companyName: raw.companyName || '',
    name: raw.name || 'Untitled property',
    price: String(raw.price || 0), currency: raw.currency_code || 'INR',
    type: raw.property_type_name || '', beds: String(raw.beds || ''), baths: String(raw.baths || ''),
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

// Stable pseudo-random Sale/Rent tag derived from id (listing type isn't in the API yet).
export function listingTag(id: string): { tag: 'For Sale' | 'For Rent'; isRent: boolean } {
  let hash = 0; for (let i = 0; i < id.length; i++) hash = (hash * 31 + id.charCodeAt(i)) >>> 0;
  const isRent = hash % 3 === 0;
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
  const res = await fetch(`${API_BASE}/property/public?${qs.toString()}`, { cache: 'no-store', headers: NGROK_HEADERS });
  if (!res.ok) throw new Error('Failed to load properties (' + res.status + ')');
  const json = await res.json();
  const data = json.data || {};
  const items = (Array.isArray(data.properties) ? data.properties : []).map(mapProperty);
  return { items, total: typeof data.total === 'number' ? data.total : items.length };
}

export async function fetchPublicCompany(uid: string) {
  const res = await fetch(`${API_BASE}/property/public/company/${encodeURIComponent(uid)}`, { cache: 'no-store', headers: NGROK_HEADERS });
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
