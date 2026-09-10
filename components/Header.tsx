'use client';
import Link from 'next/link';
import type { CompanyBrand } from '../lib/api';

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

export default function Header({ brand, companyHref }: { brand?: CompanyBrand; companyHref?: string }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, height: 64, padding: '0 28px', background: '#fff', borderBottom: '1px solid #F0EDE8', position: 'sticky', top: 0, zIndex: 100 }}>
      <Link href="/" style={{ display: 'flex', alignItems: 'center', gap: 9, flexShrink: 0 }}>
        <img src="/crm-dost-logo.svg" alt="CRM Dost" style={{ height: 35 }} />
        <span style={{ fontSize: 14, fontWeight: 500, color: '#B8B4AE' }}>Properties</span>
      </Link>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, minWidth: 0 }}>
        {brand?.name ? <CompanyMark brand={brand} href={companyHref} /> : null}
        {brand?.name ? null : <div style={{ fontSize: 12, color: '#B8B4AE' }}>Powered by CRM Dost</div>}
      </div>
    </div>
  );
}
