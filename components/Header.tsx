'use client';
import Link from 'next/link';
import { useEffect, useState } from 'react';
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
function CompanyMark({ brand, href, onDark = false }: { brand: CompanyBrand; href?: string; onDark?: boolean }) {
  const initials = (brand.name.match(/\b\w/g) || ['C']).slice(0, 2).join('').toUpperCase();
  const content = (
    <>
      {brand.logo ? (
        <img src={brand.logo} alt={`${brand.name} logo`} style={{ display: 'block', height: 36, width: 'auto', maxWidth: 160 }} />
      ) : (
        <span aria-hidden="true" style={{ width: 32, height: 32, borderRadius: 9, background: brand.color, color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12.5, fontWeight: 800 }}>{initials}</span>
      )}
      {brand.showName ? (
        <span style={{ fontSize: 13.5, fontWeight: 800, color: onDark ? '#fff' : brand.color, maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{brand.name}</span>
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

/** Relative luminance (0 dark … 1 light) of a #rrggbb colour. */
function hexLuminance(hex: string): number {
  const n = parseInt(hex.slice(1), 16);
  const [r, g, b] = [(n >> 16) & 255, (n >> 8) & 255, n & 255];
  return (0.2126 * r + 0.7152 * g + 0.0722 * b) / 255;
}

/**
 * Whether the company logo is mostly light or mostly dark, so the header can
 * put a contrasting backdrop behind it. The logo is drawn small on a canvas
 * and its visible (non-transparent) pixels averaged. Reading pixels needs the
 * image host to allow CORS; if it does not, the brand colour stands in.
 */
function useLogoIsLight(logo: string, fallbackColor: string): boolean {
  const [isLight, setIsLight] = useState(() => hexLuminance(fallbackColor) > 0.62);

  useEffect(() => {
    setIsLight(hexLuminance(fallbackColor) > 0.62);
    if (!logo) return;
    let cancelled = false;
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      if (cancelled) return;
      try {
        const size = 32;
        const canvas = document.createElement('canvas');
        canvas.width = size;
        canvas.height = size;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;
        ctx.drawImage(img, 0, 0, size, size);
        const { data } = ctx.getImageData(0, 0, size, size);
        let sum = 0;
        let weight = 0;
        for (let i = 0; i < data.length; i += 4) {
          const alpha = data[i + 3] / 255;
          // Near-white pixels are usually the logo's own background; skip
          // them so a dark mark on a white tile still counts as dark.
          const lum = (0.2126 * data[i] + 0.7152 * data[i + 1] + 0.0722 * data[i + 2]) / 255;
          if (alpha < 0.2 || lum > 0.94) continue;
          sum += lum * alpha;
          weight += alpha;
        }
        if (weight > 0) setIsLight(sum / weight > 0.62);
      } catch {
        // Canvas tainted (no CORS on the image host): keep the brand-colour guess.
      }
    };
    img.src = logo;
    return () => {
      cancelled = true;
    };
  }, [logo, fallbackColor]);

  return isLight;
}

/** Header height. An `overlay` page pulls its hero up by this much to sit behind it. */
export const HEADER_HEIGHT = 64;

/**
 * `overlay`: for pages that open on a full-width banner (the company page).
 * The header floats over the banner as frosted glass — enough to keep the
 * CRM Dost lockup and the company logo legible on any photo — and becomes the
 * normal solid bar once the page scrolls past the top.
 */
/**
 * `title` / `subtitle`: shown centred in the bar on wide screens only (see
 * `.cd-header-title` in globals.css) — e.g. the property's name and address,
 * so they stay in view while the visitor scrolls the photos and description.
 */
export default function Header({ brand, companyHref, overlay = false, title, subtitle }: { brand?: CompanyBrand; companyHref?: string; overlay?: boolean; title?: string; subtitle?: string }) {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    if (!overlay) return;
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, [overlay]);

  const floating = overlay && !scrolled;
  const logoIsLight = useLogoIsLight(brand?.logo || '', brand?.color || '#E8650A');

  /*
    A backdrop behind the company mark, fading in from the right edge, in the
    tone opposite to the logo: light behind a dark logo, dark behind a light
    one. Over a banner photo this is what keeps the logo readable; on the solid
    bar it only shows for light logos, which would vanish on white.
  */
  const markBackdrop = !brand?.name
    ? ''
    : logoIsLight
      ? 'linear-gradient(270deg, rgba(20,16,12,.82) 0, rgba(20,16,12,.6) 180px, rgba(20,16,12,0) 380px)'
      : floating
        ? 'linear-gradient(270deg, rgba(255,255,255,.96) 0, rgba(255,255,255,.78) 180px, rgba(255,255,255,0) 380px)'
        : '';
  const base = floating ? 'rgba(255,255,255,.72)' : '#fff';

  return (
    <div
      style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, height: HEADER_HEIGHT, padding: '0 28px',
        position: 'sticky', top: 0, zIndex: 100,
        // Frosted glass while floating: the banner shows through, blurred, so
        // both logos sit on an even surface. A fade left them over raw photo
        // mid-way down and washed them out. No border — a transparent border
        // repeats the background into a visible 1px line.
        background: markBackdrop ? `${markBackdrop}, linear-gradient(${base}, ${base})` : base,
        backdropFilter: floating ? 'blur(14px) saturate(160%)' : undefined,
        WebkitBackdropFilter: floating ? 'blur(14px) saturate(160%)' : undefined,
        boxShadow: floating ? 'none' : '0 1px 0 #F0EDE8',
        transition: 'background-color .2s ease, box-shadow .2s ease',
      }}
    >
      <Link href="/" aria-label="CRM Dost Properties" style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
        <img src="/crm-dost-logo.svg" alt="" style={{ height: 35 }} />
        <PropertiesMark />
      </Link>
      {title ? (
        <div className="cd-header-title" style={{ position: 'absolute', left: '50%', top: '50%', transform: 'translate(-50%, -50%)', maxWidth: 'min(46vw, 620px)', textAlign: 'center', pointerEvents: 'none' }}>
          <div style={{ fontSize: 15, fontWeight: 800, color: '#0A0604', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{title}</div>
          {subtitle ? <div style={{ fontSize: 12, color: '#8A8480', marginTop: 2, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{subtitle}</div> : null}
        </div>
      ) : null}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, minWidth: 0 }}>
        {brand?.name ? <CompanyMark brand={brand} href={companyHref} onDark={logoIsLight} /> : null}
      </div>
    </div>
  );
}
