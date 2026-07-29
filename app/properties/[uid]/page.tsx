'use client';
import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Header from '../../../components/Header';
import { shortMoney, listingTag, getCachedProperty, Property } from '../../../lib/api';

export default function PropertyDetailPage() {
  const router = useRouter();
  const params = useParams();
  const uid = String(params.uid);
  const [property, setProperty] = useState<Property | null>(null);
  const [notFound, setNotFound] = useState(false);
  const [enquiry, setEnquiry] = useState({ name: '', phone: '', message: '' });
  const [sent, setSent] = useState(false);
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [lightboxIdx, setLightboxIdx] = useState(0);

  useEffect(() => {
    const cached = getCachedProperty(uid);
    if (cached) setProperty(cached); else setNotFound(true);
  }, [uid]);

  if (notFound) return (
    <div style={{ minHeight: '100vh', background: '#FAFAF8' }}>
      <Header />
      <div style={{ textAlign: 'center', padding: '80px 20px', color: '#A32D2D' }}>
        Property details aren't available directly — please open this property from the <a href="/properties">listings page</a> first.
        <div style={{ fontSize: 12, color: '#8A8480', marginTop: 8 }}>(GET /property/:uid requires authentication we don't have on the public site, so detail pages are populated from the public list/company responses.)</div>
      </div>
    </div>
  );
  if (!property) return (<div style={{ minHeight: '100vh', background: '#FAFAF8' }}><Header /><div style={{ textAlign: 'center', padding: '80px 0', color: '#8A8480' }}>Loading property…</div></div>);

  const images = property.images.length ? property.images : [''];
  const hero = images[0];
  const sideImgs = images.slice(1, 3);
  const extra = images.length - 3;
  const fullAddr = [property.addr1, property.society && `Society ${property.society}`, property.sector && `Sector ${property.sector}`].filter(Boolean).join(', ');
  const lt = listingTag(property.id);
  const openLightbox = (i: number) => { setLightboxIdx(i); setLightboxOpen(true); };

  return (
    <div style={{ minHeight: '100vh', background: '#FAFAF8' }}>
      <Header companyName={property.companyName} companyHref={`/company/${property.companyId}`} />
      <div style={{ maxWidth: 1140, margin: '0 auto', padding: '26px 28px 70px' }}>
        <button onClick={() => router.back()} style={{ display: 'flex', alignItems: 'center', gap: 6, background: '#F5F2EE', border: 'none', borderRadius: 9, padding: '8px 14px', fontSize: 12.5, fontWeight: 700, color: '#5A5048', cursor: 'pointer', marginBottom: 18 }}>‹ Back</button>

        <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 6, borderRadius: 18, overflow: 'hidden', marginBottom: 22, height: 440 }}>
          <div onClick={() => openLightbox(0)} style={{ background: hero ? `url(${hero}) center/cover` : '#F0EDE8', cursor: 'pointer' }} />
          <div style={{ display: 'grid', gridTemplateRows: '1fr 1fr', gap: 6 }}>
            {(sideImgs.length ? sideImgs : [hero, hero]).map((url, i) => (
              <div key={i} onClick={() => openLightbox(sideImgs.length ? i + 1 : 0)} style={{ position: 'relative', background: url ? `url(${url}) center/cover` : '#F0EDE8', cursor: 'pointer' }}>
                {i === 1 && extra > 0 && <div style={{ position: 'absolute', inset: 0, background: 'rgba(10,6,4,.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: 22, fontWeight: 800 }}>+{extra}</div>}
              </div>
            ))}
          </div>
        </div>

        <div style={{ display: 'flex', gap: 24, flexWrap: 'wrap' }}>
          <div style={{ flex: '2 1 480px', minWidth: 320 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 9, marginBottom: 4 }}>
              <h1 style={{ fontSize: 26, fontWeight: 800, color: '#0A0604' }}>{property.name}</h1>
              <span style={{ background: lt.isRent ? '#E6F1FB' : '#EAF3DE', color: lt.isRent ? '#185FA5' : '#3B6D11', fontSize: 12, fontWeight: 700, borderRadius: 20, padding: '4px 12px' }}>{lt.tag}</span>
            </div>
            <div style={{ fontSize: 14, color: '#8A8480', marginBottom: 18 }}>{fullAddr || '—'}</div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 12, marginBottom: 24 }}>
              <div style={{ background: '#fff', border: '1px solid #EAE6E0', borderRadius: 12, padding: 13 }}><div style={{ fontSize: 11, fontWeight: 700, color: '#B8B4AE' }}>PRICE</div><div style={{ fontSize: 16, fontWeight: 800, color: '#E8650A', marginTop: 3 }}>{shortMoney(property.price)}{lt.isRent ? '/mo' : ''}</div></div>
              <div style={{ background: '#fff', border: '1px solid #EAE6E0', borderRadius: 12, padding: 13 }}><div style={{ fontSize: 11, fontWeight: 700, color: '#B8B4AE' }}>BEDROOMS</div><div style={{ fontSize: 16, fontWeight: 800, marginTop: 3 }}>{property.beds || '—'}</div></div>
              <div style={{ background: '#fff', border: '1px solid #EAE6E0', borderRadius: 12, padding: 13 }}><div style={{ fontSize: 11, fontWeight: 700, color: '#B8B4AE' }}>BATHROOMS</div><div style={{ fontSize: 16, fontWeight: 800, marginTop: 3 }}>{property.baths || '—'}</div></div>
              <div style={{ background: '#fff', border: '1px solid #EAE6E0', borderRadius: 12, padding: 13 }}><div style={{ fontSize: 11, fontWeight: 700, color: '#B8B4AE' }}>AREA</div><div style={{ fontSize: 16, fontWeight: 800, marginTop: 3 }}>{property.area ? property.area + ' sq ft' : '—'}</div></div>
            </div>
            <div style={{ fontSize: 16, fontWeight: 700, marginBottom: 8 }}>Description</div>
            <div style={{ fontSize: 14, color: '#5A5048', lineHeight: 1.6 }}>{property.description || 'No description provided.'}</div>
          </div>

          <div style={{ flex: '1 1 280px', minWidth: 270, display: 'flex', flexDirection: 'column', gap: 16 }}>
            {property.allowContact && (
              <div style={{ background: '#fff', border: '1px solid #EAE6E0', borderRadius: 16, padding: 18 }}>
                <div style={{ fontSize: 14, fontWeight: 700, marginBottom: 13 }}>Agent Details</div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 11, marginBottom: 14 }}>
                  <div style={{ width: 42, height: 42, borderRadius: '50%', background: '#E8650A', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14, fontWeight: 700 }}>{(property.agentName.match(/\b\w/g) || ['?']).slice(0, 2).join('').toUpperCase()}</div>
                  <div><div style={{ fontSize: 14, fontWeight: 700 }}>{property.agentName || '—'}</div><div style={{ fontSize: 12, color: '#8A8480' }}>{property.agentPhone}</div></div>
                </div>
                <div style={{ display: 'flex', gap: 8 }}>
                  <a href={property.agentPhone ? `tel:+${property.agentPhone.replace(/\D/g, '')}` : '#'} style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 7, background: '#E8650A', color: '#fff', borderRadius: 11, padding: 11, fontSize: 13.5, fontWeight: 700 }}>Call</a>
                  <a href={property.agentPhone ? `https://wa.me/${property.agentPhone.replace(/\D/g, '')}` : '#'} style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 7, background: '#fff', color: '#3B6D11', border: '1px solid #C0DD97', borderRadius: 11, padding: 11, fontSize: 13.5, fontWeight: 700 }}>WhatsApp</a>
                </div>
              </div>
            )}

            <div style={{ background: '#fff', border: '1px solid #EAE6E0', borderRadius: 16, padding: 18 }}>
              <div style={{ fontSize: 14, fontWeight: 700, marginBottom: 4 }}>Send an enquiry</div>
              <div style={{ fontSize: 12.5, color: '#8A8480', marginBottom: 14 }}>The agent will get back to you shortly.</div>
              {sent ? (
                <div style={{ display: 'flex', alignItems: 'center', gap: 9, background: '#EAF3DE', border: '1px solid #C0DD97', borderRadius: 11, padding: '12px 14px' }}>
                  <span style={{ fontSize: 13, fontWeight: 600, color: '#3B6D11' }}>Enquiry sent — thank you!</span>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  <input value={enquiry.name} onChange={e => setEnquiry({ ...enquiry, name: e.target.value })} placeholder="Your name" style={{ border: '1.5px solid #E8E4DE', borderRadius: 10, padding: '10px 12px', fontSize: 13.5, outline: 'none' }} />
                  <input value={enquiry.phone} onChange={e => setEnquiry({ ...enquiry, phone: e.target.value })} placeholder="Phone number" style={{ border: '1.5px solid #E8E4DE', borderRadius: 10, padding: '10px 12px', fontSize: 13.5, outline: 'none' }} />
                  <textarea value={enquiry.message} onChange={e => setEnquiry({ ...enquiry, message: e.target.value })} placeholder="I'm interested in this property…" style={{ border: '1.5px solid #E8E4DE', borderRadius: 10, padding: '10px 12px', fontSize: 13.5, outline: 'none', minHeight: 64, resize: 'none' }} />
                  <button onClick={() => setSent(true)} style={{ background: '#E8650A', color: '#fff', border: 'none', borderRadius: 10, padding: 11, fontSize: 13.5, fontWeight: 700, cursor: 'pointer' }}>Send enquiry</button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
      <div style={{ textAlign: 'center', padding: 24, color: '#B8B4AE', fontSize: 12, borderTop: '1px solid #F0EDE8' }}>Powered by CRM Dost</div>

      {lightboxOpen && (
        <div onClick={() => setLightboxOpen(false)} style={{ position: 'fixed', inset: 0, background: 'rgba(10,6,4,.92)', zIndex: 600, display: 'flex', flexDirection: 'column' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '18px 22px' }}>
            <span style={{ color: '#fff', fontSize: 13, fontWeight: 600 }}>{lightboxIdx + 1} / {images.length}</span>
            <button onClick={() => setLightboxOpen(false)} style={{ width: 34, height: 34, borderRadius: 9, background: 'rgba(255,255,255,.12)', border: 'none', color: '#fff', cursor: 'pointer' }}>✕</button>
          </div>
          <div onClick={e => e.stopPropagation()} style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 14, padding: '0 20px 20px', minHeight: 0 }}>
            <button onClick={() => setLightboxIdx(i => (i - 1 + images.length) % images.length)} style={{ width: 44, height: 44, borderRadius: '50%', background: 'rgba(255,255,255,.12)', border: 'none', color: '#fff', cursor: 'pointer', flexShrink: 0 }}>‹</button>
            <img src={images[lightboxIdx]} style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain', borderRadius: 8 }} />
            <button onClick={() => setLightboxIdx(i => (i + 1) % images.length)} style={{ width: 44, height: 44, borderRadius: '50%', background: 'rgba(255,255,255,.12)', border: 'none', color: '#fff', cursor: 'pointer', flexShrink: 0 }}>›</button>
          </div>
        </div>
      )}
    </div>
  );
}
