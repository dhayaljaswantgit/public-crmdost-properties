'use client';
import Link from 'next/link';
import { Orbitron } from 'next/font/google';
import type { CompanyBrand } from '../lib/api';

/** Wide, squared caps to match the logo's ".DOST"; self-hosted by next/font. */
const wordmarkFont = Orbitron({ subsets: ['latin'], weight: ['800'], display: 'swap' });

/**
 * The company's own mark on the right: its logo, and its name unless the
 * company chose "Logo only", in its brand colour. Falls back to initials in
 * that colour when there is no logo.
 *
 * The logo is drawn as uploaded — no frame, background, rounding or padding —
 * so the page never alters someone's branding.
 */
function CompanyMark({ brand, href }: { brand: CompanyBrand; href?: string }) {
  const initials = (brand.name.match(/\b\w/g) || ['C']).slice(0, 2).join('').toUpperCase();
  const content = (
    <>
      {brand.logo ? (
        <img src={brand.logo} alt={`${brand.name} logo`} style={{ display: 'block', height: 36, width: 'auto', maxWidth: 160 }} />
      ) : (
        <span aria-hidden="true" style={{ width: 32, height: 32, borderRadius: 9, background: brand.color, color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12.5, fontWeight: 800 }}>{initials}</span>
      )}
      {brand.showName ? (
        <span style={{ fontSize: 13.5, fontWeight: 800, color: brand.color, maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{brand.name}</span>
      ) : null}
    </>
  );
  const style = { display: 'flex', alignItems: 'center', gap: 9, minHeight: 44 } as const;
  return href ? <Link href={href} aria-label={brand.name} style={style}>{content}</Link> : <div style={style}>{content}</div>;
}

/**
 * "Properties" wordmark, built in the CRM Dost logo's own language: a big
 * sharp-edged initial in the "CRM" orange gradient (#FAAF40 → #F05A28, left to
 * right, like each CRM letter), then wide squared capitals in the ".DOST" blue
 * (#00AEEF). The P is drawn — its outline is a house with a pitched roof, its
 * counter is a house-shaped window, and the chimney carries the DOST blue.
 */
function PropertiesMark() {
  return (
    <span aria-hidden="true" style={{ display: 'flex', alignItems: 'flex-end', gap: 3 }}>
      <svg width="22" height="26" viewBox="0 0 28 33" style={{ display: 'block', flexShrink: 0, margin:'-7px 0 0 -7px' }}>
        <defs>
          <linearGradient id="cd-prop-grad" gradientUnits="userSpaceOnUse" x1="0" y1="0" x2="28" y2="0">
            <stop offset="0" stopColor="#FAAF40" />
            <stop offset="1" stopColor="#F05A28" />
          </linearGradient>
        </defs>
        <rect x="19.5" y="0.5" width="4" height="7" fill="#00AEEF" />
        <path
          fill="url(#cd-prop-grad)"
          fillRule="evenodd"
          d="M0 33V9.2L14 0l14 9.2V23.5H7.2V33Z M7.2 12.6 14 8.1l6.8 4.5V16.8H7.2Z"
        />
      </svg>
      <span
        className={wordmarkFont.className}
        style={{ fontSize: 13.5, fontWeight: 800, letterSpacing: '0.06em', lineHeight: 1, color: '#00AEEF', paddingBottom: 1 }}
      >
        ROPERTIES
      </span>
    </span>
  );
}

export default function Header({ brand, companyHref }: { brand?: CompanyBrand; companyHref?: string }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, height: 64, padding: '0 28px', background: '#fff', borderBottom: '1px solid #F0EDE8', position: 'sticky', top: 0, zIndex: 100 }}>
      <Link href="/" aria-label="CRM Dost Properties" style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
        <img src="/crm-dost-logo.svg" alt="" style={{ height: 35 }} />
        <PropertiesMark />
      </Link>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, minWidth: 0 }}>
        {brand?.name ? <CompanyMark brand={brand} href={companyHref} /> : null}
      </div>
    </div>
  );
}
