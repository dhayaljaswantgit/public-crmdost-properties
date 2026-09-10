import { fetchPublicCompany } from '../../lib/api';
import { SEO_REVALIDATE, SHARE_IMAGE } from '../../lib/seo';
import { renderShareImage } from '../../lib/share-image';

export const size = SHARE_IMAGE;
export const contentType = 'image/jpeg';
export const alt = 'Company property listings on CRM Dost Properties';
export const revalidate = SEO_REVALIDATE;

/** The company's first banner image (else the default banner), with its logo. */
export default async function Image({ params }: { params: { companySlug: string } }) {
  const data = await fetchPublicCompany(params.companySlug, { revalidate: SEO_REVALIDATE }).catch(() => null);
  const image = await renderShareImage({
    photoUrl: data?.bannerImages[0],
    logoUrl: data?.company.brand.logo,
  });
  return new Response(new Uint8Array(image), {
    headers: { 'Content-Type': contentType, 'Cache-Control': `public, max-age=${SEO_REVALIDATE}` },
  });
}
