'use client';
import Link from 'next/link';

export default function Header({ companyName, companyHref }: { companyName?: string; companyHref?: string }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', height: 60, padding: '0 28px', background: '#fff', borderBottom: '1px solid #F0EDE8', position: 'sticky', top: 0, zIndex: 100 }}>
      <Link href="/" style={{ display: 'flex', alignItems: 'center', gap: 9 }}>
        <img src="/crm-dost-logo.svg" alt="CRM Dost" style={{ height: 35 }} />
        <span style={{ fontSize: 14, fontWeight: 700, color: '#0A0604' }}><span style={{ fontWeight: 500, color: '#B8B4AE' }}>Properties</span></span>
      </Link>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        {companyName && companyHref && (
          <Link href={companyHref} style={{ fontSize: 12.5, fontWeight: 600, color: '#5A5048', padding: '7px 10px', borderRadius: 8 }}>{companyName}</Link>
        )}
        <div style={{ fontSize: 12, color: '#B8B4AE' }}>Powered by CRM Dost</div>
      </div>
    </div>
  );
}
