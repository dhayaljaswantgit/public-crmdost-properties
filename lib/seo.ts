/** Shared SEO / link-preview values for the public property pages. */

export const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL_PROPERTIES || 'https://crmdost.com').replace(/\/+$/, '');

export const SITE_NAME = 'CRM Dost Properties';

export const DEFAULT_DESCRIPTION =
  'Explore public listings from CRM Dost companies with photos, pricing, location context, and direct agent contact options.';

/** Share-card size used by WhatsApp, Facebook, LinkedIn and X. */
export const SHARE_IMAGE = { width: 1200, height: 630 } as const;

/** How long page metadata and share images may be reused before re-fetching (seconds). */
export const SEO_REVALIDATE = 300;

export const companyTitle = (companyName: string) =>
  `CRM Dost Properties | Public Listing | ${companyName}`;

export const propertyTitle = (propertyName: string, companyName: string) =>
  [propertyName, companyName, SITE_NAME].filter(Boolean).join(' | ');

/**
 * The first words of `text`, cut at a word boundary to fit a link preview
 * (~155 characters is what search engines and chat apps show).
 */
export function excerpt(text: string, max = 155): string {
  const flat = String(text || '').replace(/\s+/g, ' ').trim();
  if (flat.length <= max) return flat;
  const cut = flat.slice(0, max - 1);
  const atWord = cut.slice(0, cut.lastIndexOf(' ')).replace(/[\s,.;:!?-]+$/, '');
  return `${atWord || cut}…`;
}
