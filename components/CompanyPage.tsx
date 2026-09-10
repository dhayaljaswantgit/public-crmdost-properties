'use client';
import { formatArea } from '@/lib/area';
import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Header, { HEADER_HEIGHT } from './Header';
import Footer from './Footer';
import { SearchIcon } from './icons';
import { fetchPublicCompany, shortMoney, listingTag, cacheProperty, propertyPath, Property, Company } from '../lib/api';

const selectStyle: React.CSSProperties = {
  border: '1px solid #E8E4DE',
  borderRadius: 11,
  padding: '10px 36px 10px 12px',
  fontSize: 13,
  cursor: 'pointer',
  appearance: 'none',
  WebkitAppearance: 'none',
  MozAppearance: 'none',
  backgroundColor: '#fff',
  backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%236b6460' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpolyline points='6 9 12 15 18 9'%3E%3C/polyline%3E%3C/svg%3E")`,
  backgroundRepeat: 'no-repeat',
  backgroundPosition: 'right 12px center',
  backgroundSize: '12px 12px',
};

function StatIcons({ p }: { p: Property }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginTop: 9, paddingTop: 9, borderTop: '1px solid #F4F1EC', fontSize: 12.5, color: '#5A5048' }}>
      <span style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
        <svg width={14} height={14} viewBox="0 0 24 24" fill="none" stroke="#B8B4AE" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round"><path d="M3 18v-6a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v6" /><path d="M3 11V8a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v3" /><path d="M3 18h18M21 18v-3" /></svg>
        {p.beds || '—'} Beds
      </span>
      <span style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
        <svg width={14} height={14} viewBox="0 0 24 24" fill="none" stroke="#B8B4AE" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round"><path d="M9 6V4a2 2 0 0 1 4 0v2" /><path d="M4 11h16v3a5 5 0 0 1-5 5H9a5 5 0 0 1-5-5v-3Z" /><path d="M6 19v1M14 19v1" /></svg>
        {p.baths || '—'} Baths
      </span>
      <span style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
        <svg width={14} height={14} viewBox="0 0 24 24" fill="none" stroke="#B8B4AE" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round"><path d="M3 3h7v7H3zM14 3h7v7h-7zM14 14h7v7h-7zM3 14h7v7H3z" /></svg>
        {formatArea(p.area, p.areaUnit)}
      </span>
    </div>
  );
}

/** Mirrors ionic-frontend/public/property-demo/banner, the CRM's default banner. */
const DEFAULT_BANNERS = ['/media/banner/1.jpg', '/media/banner/2.jpg', '/media/banner/3.jpg'];

/** A company's public page. `uid` is its slug (or numeric id on legacy links). */
export default function CompanyPage({ uid }: { uid: string }) {
  const router = useRouter();
  const [company, setCompany] = useState<Company | null>(null);
  const [properties, setProperties] = useState<Property[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [priceFilter, setPriceFilter] = useState('any');
  const [listing, setListing] = useState('any');
  const [bannerIdx, setBannerIdx] = useState(0);
  const [bannerImages, setBannerImages] = useState<string[]>([]);

  const load = useCallback(async () => {
    setLoading(true); setError('');
    try {
      const { company, properties, bannerImages } = await fetchPublicCompany(uid);
      setCompany(company); setProperties(properties); setBannerImages(bannerImages);
      properties.forEach(cacheProperty);
    } catch (e: any) { setError(e.message || 'Could not load this company'); }
    finally { setLoading(false); }
  }, [uid]);

  useEffect(() => { load(); }, [load]);

  const matchPrice = (price: string, filter: string) => {
    const n = parseInt(price || '0', 10);
    if (filter === 'u50l') return n < 5000000;
    if (filter === '50l-1cr') return n >= 5000000 && n < 10000000;
    if (filter === '1cr-2cr') return n >= 10000000 && n < 20000000;
    if (filter === '2crplus') return n >= 20000000;
    return true;
  };
  const filtered = properties.filter(p => {
    if (search && !`${p.name} ${p.society} ${p.addr1}`.toLowerCase().includes(search.toLowerCase())) return false;
    if (!matchPrice(p.price, priceFilter)) return false;
    const lt = listingTag(p.id, p.listingType);
    if (listing !== 'any' && (listing === 'rent') !== lt.isRent) return false;
    return true;
  });
  /*
    Same banner as the CRM's Properties page: the images set under "Manage
    banner", else the same stock banners the CRM shows when none are set. It
    used to rotate listing photos instead, so the two never matched.
  */
  const bannerImgs = bannerImages.length ? bannerImages : DEFAULT_BANNERS;
  useEffect(() => {
    setBannerIdx(0);
    if (bannerImgs.length < 2) return;
    const t = setInterval(() => setBannerIdx(i => (i + 1) % bannerImgs.length), 4500);
    return () => clearInterval(t);
  }, [bannerImgs.length]);
  const prices = properties.map(p => parseInt(p.price, 10)).filter(Boolean);
  const priceRange = prices.length ? (Math.min(...prices) === Math.max(...prices) ? shortMoney(Math.min(...prices)) : `${shortMoney(Math.min(...prices))} – ${shortMoney(Math.max(...prices))}`) : '—';

  const openDetail = (p: Property) => { cacheProperty(p); router.push(propertyPath(p)); };

  if (loading) return (<div className="cd-page"><Header /><div style={{ textAlign: 'center', padding: '80px 0', color: '#8A8480' }}>Loading company…</div><Footer /></div>);
  if (error || !company) return (<div className="cd-page"><Header /><div style={{ textAlign: 'center', padding: '80px 20px', color: '#A32D2D' }}>{error || 'Company not found'}</div><Footer /></div>);

  return (
    <div className="cd-page">
      <Header brand={company.brand} overlay />
      {/*
        Banner, shown whole. Banners are cropped to exactly 3:1 when uploaded
        in the CRM, so the image band is 3:1 too (capped at 480px on very wide
        screens) and starts BELOW the header — squeezing it into a shorter box
        cut off its top and bottom, and the header hid a further 64px. The strip
        behind the glass header is a blurred copy of the same image, so the
        header still floats over the banner.
      */}
      <div style={{ position: 'relative', overflow: 'hidden', marginTop: -HEADER_HEIGHT, paddingTop: HEADER_HEIGHT }}>
        {bannerImgs.map((url, i) => (
          <div key={i} aria-hidden="true" style={{ position: 'absolute', inset: -40, background: `url(${url}) center top/cover`, filter: 'blur(28px) saturate(140%)', opacity: i === bannerIdx ? 1 : 0, transition: 'opacity .8s ease' }} />
        ))}
        <div style={{ position: 'relative', height: 'min(33.333vw, 480px)', minHeight: 170 }}>
          {bannerImgs.map((url, i) => (
            <div key={i} style={{ position: 'absolute', inset: 0, background: `url(${url}) center/cover`, opacity: i === bannerIdx ? 1 : 0, transition: 'opacity .8s ease' }} />
          ))}
          <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(0deg,rgba(10,6,4,.35) 0%,rgba(10,6,4,0) 45%)' }} />
        </div>
      </div>

      <div className="cd-container cd-company-overlap" style={{ maxWidth: 1180, margin: '-15vh auto 0', padding: '0 28px 70px', position: 'relative' }}>
        {/*
          One card: who the company is, its numbers, and the search. The name
          stays as the page's H1 — the header may show the logo alone, and the
          page needs a real heading for search engines and screen readers.
        */}
        <div style={{ background: '#fff', border: '1px solid #EAE6E0', borderRadius: 18, boxShadow: '0 10px 30px rgba(0,0,0,.08)', marginBottom: 24 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 16, flexWrap: 'wrap', padding: '20px 24px' }}>
            {company.brand.logo ? (
              <img src={company.brand.logo} alt={`${company.name} logo`} style={{ display: 'block', height: 52, width: 'auto', maxWidth: 150, flexShrink: 0 }} />
            ) : (
              <div style={{ width: 52, height: 52, borderRadius: 14, background: company.brand.color, color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 19, fontWeight: 800, flexShrink: 0 }}>{company.initials}</div>
            )}
            <div style={{ flex: '1 1 180px', minWidth: 0 }}>
              <h1 style={{ fontSize: 20, fontWeight: 800, color: company.brand.color, lineHeight: 1.2 }}>{company.name}</h1>
              {company.address ? <div style={{ fontSize: 12.5, color: '#8A8480', marginTop: 3 }}>{company.address}</div> : null}
            </div>
            <div style={{ display: 'flex', alignItems: 'stretch', flexWrap: 'wrap', rowGap: 10 }}>
              {[
                { label: 'Listings', value: properties.length, color: '#0A0604' },
                { label: 'Price range', value: priceRange, color: '#E8650A' },
                { label: 'Locations', value: new Set(properties.map(p => p.society)).size || properties.length, color: '#185FA5' },
              ].map((stat, i) => (
                <div key={stat.label} style={{ padding: '2px 20px', borderLeft: i ? '1px solid #F0EDE8' : 'none' }}>
                  <div style={{ fontSize: 10.5, fontWeight: 700, letterSpacing: '.05em', color: '#A8A29B', textTransform: 'uppercase' }}>{stat.label}</div>
                  <div style={{ fontSize: 19, fontWeight: 800, marginTop: 4, color: stat.color, whiteSpace: 'nowrap' }}>{stat.value}</div>
                </div>
              ))}
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap', padding: '14px 24px 18px', borderTop: '1px solid #F4F1EC' }}>
            <label className="cd-filter-search" style={{ display: 'flex', alignItems: 'center', gap: 8, background: '#FAFAF8', border: '1px solid #E8E4DE', borderRadius: 11, padding: '0 14px', minHeight: 44, minWidth: 220, flex: '2 1 220px' }}>
              <SearchIcon size={16} color="#A8A29B" />
              <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search by property name or address" aria-label="Search listings" style={{ flex: 1, border: 'none', outline: 'none', background: 'transparent', fontSize: 13.5, minWidth: 0 }} />
            </label>
            <select value={priceFilter} onChange={e => setPriceFilter(e.target.value)} aria-label="Price" className="cd-filter-select" style={{ ...selectStyle, minHeight: 44 }}>
              <option value="any">Any price</option><option value="u50l">Under ₹50 L</option><option value="50l-1cr">₹50L – ₹1 Cr</option><option value="1cr-2cr">₹1 Cr – ₹2 Cr</option><option value="2crplus">₹2 Cr+</option>
            </select>
            <select value={listing} onChange={e => setListing(e.target.value)} aria-label="Buy or rent" className="cd-filter-select" style={{ ...selectStyle, minHeight: 44 }}>
              <option value="any">Buy or Rent</option><option value="sale">For Sale</option><option value="rent">For Rent</option>
            </select>
          </div>
        </div>

        {filtered.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '70px 20px', background: '#fff', border: '1px dashed #E0DCD5', borderRadius: 18 }}>
            <div style={{ fontSize: 16, fontWeight: 700 }}>No listings match</div>
            <div style={{ fontSize: 13, color: '#8A8480', marginTop: 4 }}>Try a different search or filter.</div>
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(280px,1fr))', gap: 18 }}>
            {filtered.map(p => {
              const lt = listingTag(p.id, p.listingType);
              return (
                <div key={p.id} style={{ background: '#fff', border: '1px solid #EAE6E0', borderRadius: 16, overflow: 'hidden', boxShadow: '0 4px 16px rgba(0,0,0,.05)' }}>
                  <div style={{ position: 'relative', height: 170, background: p.images[0] ? `url(${p.images[0]}) center/cover` : '#F0EDE8' }}>
                    <span style={{ position: 'absolute', top: 10, left: 10, background: '#EAF3DE', color: '#3B6D11', fontSize: 11, fontWeight: 700, borderRadius: 20, padding: '4px 11px' }}>Public</span>
                    <span style={{ position: 'absolute', top: 10, right: 10, background: lt.isRent ? '#E6F1FB' : '#EAF3DE', color: lt.isRent ? '#185FA5' : '#3B6D11', fontSize: 11, fontWeight: 700, borderRadius: 20, padding: '4px 11px' }}>{lt.tag}</span>
                    <button onClick={() => openDetail(p)} style={{ position: 'absolute', bottom: 10, right: 10, background: 'rgba(255,255,255,.95)', border: 'none', borderRadius: 9, padding: '7px 13px', fontSize: 12, fontWeight: 700, cursor: 'pointer' }}>View</button>
                  </div>
                  <div style={{ padding: 16 }}>
                    <div style={{ fontSize: 16, fontWeight: 700 }}>{p.name}</div>
                    <div style={{ fontSize: 12.5, color: '#8A8480', marginTop: 3 }}>{[p.society, p.sector && `Sector ${p.sector}`].filter(Boolean).join(' · ') || p.addr1}</div>
                    <div style={{ fontSize: 18, fontWeight: 800, color: '#E8650A', marginTop: 9 }}>{shortMoney(p.price)}{lt.isRent ? '/mo' : ''}</div>
                    <StatIcons p={p} />
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
      <Footer />
    </div>
  );
}
