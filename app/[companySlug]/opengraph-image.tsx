import { fetchPublicCompany } from '../../lib/api';
import { SEO_REVALIDATE, SHARE_IMAGE } from '../../lib/seo';
import { renderShareImage } from '../../lib/share-image';

export const size = SHARE_IMAGE;
export const contentType = 'image/jpeg';
export const alt = 'Company property listings on CRM Dost Properties';
// Segment config must be a literal (Next rejects an imported identifier here); equals SEO_REVALIDATE.
export const revalidate = 300;

/** The company's first banner image (else the default banner), with its logo. */
export default async function Image({ params }: { params: Promise<{ companySlug: string }> }) {
  const { companySlug } = await params;
  const data = await fetchPublicCompany(companySlug, { revalidate: SEO_REVALIDATE }).catch(() => null);
  const image = await renderShareImage({
    photoUrl: data?.bannerImages[0],
    logoUrl: data?.company.brand.logo,
  });
  return new Response(new Uint8Array(image), {
    headers: { 'Content-Type': contentType, 'Cache-Control': `public, max-age=${SEO_REVALIDATE}` },
  });
}
