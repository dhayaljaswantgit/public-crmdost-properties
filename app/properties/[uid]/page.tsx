'use client';
import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Header from '../../../components/Header';
import { API_V1_BASE, shortMoney, listingTag, getCachedProperty, Property } from '../../../lib/api';

const toDateInputValue = (date: Date) => {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
};

const toTimeInputValue = (date: Date) => {
  const h = String(date.getHours()).padStart(2, '0');
  const m = String(date.getMinutes()).padStart(2, '0');
  return `${h}:${m}`;
};

export default function PropertyDetailPage() {
  const router = useRouter();
  const params = useParams();
  const uid = String(params.uid);
  const [property, setProperty] = useState<Property | null>(null);
  const [notFound, setNotFound] = useState(false);
  const [enquiry, setEnquiry] = useState({ name: '', phone: '', message: '' });
  const [sent, setSent] = useState(false);
  const [enquirySubmitting, setEnquirySubmitting] = useState(false);
  const [enquiryError, setEnquiryError] = useState('');
  const [meetingOpen, setMeetingOpen] = useState(false);
  const [meetingSubmitting, setMeetingSubmitting] = useState(false);
  const [meetingSent, setMeetingSent] = useState(false);
  const [meetingError, setMeetingError] = useState('');
  const [meeting, setMeeting] = useState({
    name: '',
    phone: '',
    email: '',
    date: '',
    time: '',
    type: 'onsite',
  });
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
  const lt = listingTag(property.id, property.listingType);
  const now = new Date();
  const minDate = toDateInputValue(now);
  const minTime = meeting.date === minDate ? toTimeInputValue(now) : undefined;
  const openLightbox = (i: number) => { setLightboxIdx(i); setLightboxOpen(true); };

  const openMeetingModal = () => {
    setMeetingOpen(true);
    setMeetingSent(false);
    setMeetingError('');
  };

  const closeMeetingModal = () => {
    if (meetingSubmitting) return;
    setMeetingOpen(false);
  };

  const submitMeeting = async () => {
    setMeetingError('');

    if (!meeting.name.trim() && !meeting.phone.trim() && !meeting.email.trim()) {
      setMeetingError('Please enter at least one contact detail.');
      return;
    }
    if (!meeting.date) {
      setMeetingError('Please choose a date.');
      return;
    }
    if (!meeting.time) {
      setMeetingError('Please choose a time.');
      return;
    }

    const selectedAt = new Date(`${meeting.date}T${meeting.time}`);
    if (isNaN(selectedAt.getTime()) || selectedAt <= new Date()) {
      setMeetingError('Please select a future date and time.');
      return;
    }

    setMeetingSubmitting(true);
    try {
      await submitInquiryRequest({
        name: meeting.name.trim(),
        phone: meeting.phone.trim(),
        email: meeting.email.trim() || undefined,
        meetingDate: meeting.date,
        meetingTime: meeting.time || undefined,
        meetingType: meeting.type,
      });

      setMeetingSent(true);
      setMeeting({ name: '', phone: '', email: '', date: '', time: '', type: 'onsite' });
    } catch (e: any) {
      setMeetingError(e?.message || 'Unable to submit meeting request right now.');
    } finally {
      setMeetingSubmitting(false);
    }
  };

  const submitInquiryRequest = async (payload: {
    name?: string;
    phone?: string;
    email?: string;
    message?: string;
    meetingDate?: string;
    meetingTime?: string;
    meetingType?: string;
  }) => {
    const search = new URLSearchParams();
    Object.entries(payload).forEach(([key, value]) => {
      if (value != null && String(value).trim() !== '') search.set(key, String(value));
    });

    const url = `${API_V1_BASE}/property/${encodeURIComponent(uid)}/inquiry?${search.toString()}`;
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    const json = await res.json().catch(() => ({}));
    if (!res.ok) {
      throw new Error(json?.message || `Failed to submit request (${res.status})`);
    }
    return json;
  };

  const submitEnquiry = async () => {
    setEnquiryError('');
    if (!enquiry.name.trim() && !enquiry.phone.trim()) {
      setEnquiryError('Please enter name or phone to continue.');
      return;
    }

    setEnquirySubmitting(true);
    try {
      await submitInquiryRequest({
        name: enquiry.name.trim() || undefined,
        phone: enquiry.phone.trim() || undefined,
        message: enquiry.message.trim() || undefined,
      });
      setSent(true);
      setEnquiry({ name: '', phone: '', message: '' });
    } catch (e: any) {
      setEnquiryError(e?.message || 'Unable to send enquiry right now.');
    } finally {
      setEnquirySubmitting(false);
    }
  };

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

            {lt.isRent ? (
              <div style={{ marginTop: 18, display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(170px,1fr))', gap: 10 }}>
                <div style={{ background: '#fff', border: '1px solid #EAE6E0', borderRadius: 12, padding: 13 }}>
                  <div style={{ fontSize: 11, fontWeight: 700, color: '#B8B4AE' }}>RENT FREQUENCY</div>
                  <div style={{ fontSize: 14, fontWeight: 700, marginTop: 4 }}>
                    {property.rentFrequency ? property.rentFrequency.toUpperCase() : '—'}
                  </div>
                </div>
                <div style={{ background: '#fff', border: '1px solid #EAE6E0', borderRadius: 12, padding: 13 }}>
                  <div style={{ fontSize: 11, fontWeight: 700, color: '#B8B4AE' }}>SECURITY DEPOSIT</div>
                  <div style={{ fontSize: 14, fontWeight: 700, marginTop: 4 }}>{property.securityDeposit || '—'}</div>
                </div>
                <div style={{ background: '#fff', border: '1px solid #EAE6E0', borderRadius: 12, padding: 13 }}>
                  <div style={{ fontSize: 11, fontWeight: 700, color: '#B8B4AE' }}>MAINTENANCE</div>
                  <div style={{ fontSize: 14, fontWeight: 700, marginTop: 4 }}>{property.maintenanceCharges || '—'}</div>
                </div>
                <div style={{ background: '#fff', border: '1px solid #EAE6E0', borderRadius: 12, padding: 13 }}>
                  <div style={{ fontSize: 11, fontWeight: 700, color: '#B8B4AE' }}>AVAILABLE FROM</div>
                  <div style={{ fontSize: 14, fontWeight: 700, marginTop: 4 }}>{property.availableFrom || '—'}</div>
                </div>
              </div>
            ) : null}
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

            {property.allowMeeting && (
              <div style={{ background: '#fff', border: '1px solid #EAE6E0', borderRadius: 16, padding: 18 }}>
                <div style={{ fontSize: 14, fontWeight: 800, color: '#1F2A37' }}>Take a tour</div>
                <div style={{ fontSize: 12.5, color: '#7A726A', marginTop: 4 }}>Book an on-site or online visit with the agent</div>
                <button
                  onClick={openMeetingModal}
                  style={{
                    marginTop: 12,
                    width: '100%',
                    background: '#fff',
                    color: '#3A3530',
                    border: '1px solid #ECE7DF',
                    borderRadius: 11,
                    padding: '10px 12px',
                    fontSize: 14,
                    fontWeight: 700,
                    cursor: 'pointer',
                  }}
                >
                  Book Appointment
                </button>
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
                  {enquiryError ? (
                    <div style={{ background: '#FCEBEB', border: '1px solid #F1C9C9', borderRadius: 9, color: '#A32D2D', padding: '9px 11px', fontSize: 12.5 }}>
                      {enquiryError}
                    </div>
                  ) : null}
                  <button
                    onClick={submitEnquiry}
                    disabled={enquirySubmitting}
                    style={{ background: '#E8650A', color: '#fff', border: 'none', borderRadius: 10, padding: 11, fontSize: 13.5, fontWeight: 700, cursor: enquirySubmitting ? 'not-allowed' : 'pointer', opacity: enquirySubmitting ? 0.75 : 1 }}
                  >
                    {enquirySubmitting ? 'Sending...' : 'Send enquiry'}
                  </button>
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

      {meetingOpen && (
        <div
          onClick={closeMeetingModal}
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(10,6,4,.55)',
            zIndex: 700,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: 16,
          }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              width: '100%',
              maxWidth: 500,
              background: '#fff',
              borderRadius: 18,
              border: '1px solid #EDE8E0',
              boxShadow: '0 16px 40px rgba(0,0,0,.2)',
              padding: 22,
            }}
          >
            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 10 }}>
              <div>
                <div style={{ fontSize: 18, fontWeight: 800, color: '#18212D' }}>Book a Meeting</div>
                <div style={{ fontSize: 15, color: '#6F7785', marginTop: 5 }}>Schedule a visit for "{property.name}"</div>
              </div>
              <button
                type="button"
                onClick={closeMeetingModal}
                style={{ background: 'transparent', border: 'none', color: '#8A95A6', fontSize: 26, lineHeight: 1, cursor: 'pointer' }}
              >
                ×
              </button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginTop: 14 }}>
              <div>
                <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 6, color: '#27303D' }}>Your Name</div>
                <input
                  value={meeting.name}
                  onChange={(e) => setMeeting({ ...meeting, name: e.target.value })}
                  placeholder="Enter your name"
                  style={{ width: '100%', border: '1.5px solid #D8DEE8', borderRadius: 9, padding: '11px 12px', fontSize: 16, outline: 'none' }}
                />
              </div>

              <div>
                <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 6, color: '#27303D' }}>Phone Number</div>
                <input
                  value={meeting.phone}
                  onChange={(e) => setMeeting({ ...meeting, phone: e.target.value })}
                  placeholder="+91 XXXXXXXXXX"
                  style={{ width: '100%', border: '1.5px solid #D8DEE8', borderRadius: 9, padding: '11px 12px', fontSize: 16, outline: 'none' }}
                />
              </div>

              <div>
                <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 6, color: '#27303D' }}>Email</div>
                <input
                  value={meeting.email}
                  onChange={(e) => setMeeting({ ...meeting, email: e.target.value })}
                  placeholder="you@example.com"
                  style={{ width: '100%', border: '1.5px solid #D8DEE8', borderRadius: 9, padding: '11px 12px', fontSize: 16, outline: 'none' }}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                <div>
                  <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 6, color: '#27303D' }}>Date</div>
                  <input
                    type="date"
                    value={meeting.date}
                    min={minDate}
                    onChange={(e) => {
                      const nextDate = e.target.value;
                      const shouldClearTime =
                        nextDate === minDate &&
                        meeting.time &&
                        meeting.time < (minTime || '00:00');

                      setMeeting({
                        ...meeting,
                        date: nextDate,
                        ...(shouldClearTime ? { time: '' } : {}),
                      });
                    }}
                    style={{ width: '100%', border: '1.5px solid #D8DEE8', borderRadius: 9, padding: '11px 12px', fontSize: 16, outline: 'none' }}
                  />
                </div>
                <div>
                  <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 6, color: '#27303D' }}>Time</div>
                  <input
                    type="time"
                    value={meeting.time}
                    min={minTime}
                    onChange={(e) => setMeeting({ ...meeting, time: e.target.value })}
                    style={{ width: '100%', border: '1.5px solid #D8DEE8', borderRadius: 9, padding: '11px 12px', fontSize: 16, outline: 'none' }}
                  />
                </div>
              </div>

              <div>
                <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 8, color: '#27303D' }}>Meeting Type</div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 16, fontSize: 14 }}>
                  <label style={{ display: 'inline-flex', alignItems: 'center', gap: 7, cursor: 'pointer' }}>
                    <input
                      type="radio"
                      checked={meeting.type === 'onsite'}
                      onChange={() => setMeeting({ ...meeting, type: 'onsite' })}
                    />
                    Onsite
                  </label>
                  <label style={{ display: 'inline-flex', alignItems: 'center', gap: 7, cursor: 'pointer' }}>
                    <input
                      type="radio"
                      checked={meeting.type === 'online'}
                      onChange={() => setMeeting({ ...meeting, type: 'online' })}
                    />
                    Online
                  </label>
                </div>
              </div>

              {meetingError ? (
                <div style={{ background: '#FCEBEB', border: '1px solid #F1C9C9', borderRadius: 9, color: '#A32D2D', padding: '9px 11px', fontSize: 13 }}>
                  {meetingError}
                </div>
              ) : null}

              {meetingSent ? (
                <div style={{ background: '#EAF3DE', border: '1px solid #C0DD97', borderRadius: 9, color: '#3B6D11', padding: '9px 11px', fontSize: 13, fontWeight: 600 }}>
                  Request submitted successfully. The agent will contact you soon.
                </div>
              ) : null}

              <button
                type="button"
                onClick={submitMeeting}
                disabled={meetingSubmitting}
                style={{
                  marginTop: 2,
                  width: '100%',
                  background: '#FF7A08',
                  color: '#fff',
                  border: 'none',
                  borderRadius: 9,
                  padding: '11px 12px',
                  fontSize: 16,
                  fontWeight: 700,
                  cursor: meetingSubmitting ? 'not-allowed' : 'pointer',
                  opacity: meetingSubmitting ? 0.75 : 1,
                }}
              >
                {meetingSubmitting ? 'Submitting...' : 'Request Meeting'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
