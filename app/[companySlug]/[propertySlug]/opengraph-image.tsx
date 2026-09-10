import { fetchPublicProperty } from '../../../lib/api';
import { SEO_REVALIDATE, SHARE_IMAGE } from '../../../lib/seo';
import { renderShareImage } from '../../../lib/share-image';

export const size = SHARE_IMAGE;
export const contentType = 'image/jpeg';
export const alt = 'Property listing on CRM Dost Properties';
export const revalidate = SEO_REVALIDATE;

/** The property's first photo, cropped, with the company logo. */
export default async function Image({ params }: { params: { propertySlug: string } }) {
  const property = await fetchPublicProperty(params.propertySlug, { revalidate: SEO_REVALIDATE }).catch(() => null);
  const image = await renderShareImage({
    photoUrl: property?.images[0],
    logoUrl: property?.brand?.logo,
  });
  return new Response(new Uint8Array(image), {
    headers: { 'Content-Type': contentType, 'Cache-Control': `public, max-age=${SEO_REVALIDATE}` },
  });
}
