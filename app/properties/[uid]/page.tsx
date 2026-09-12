import { permanentRedirect } from 'next/navigation';
import PropertyPage from '../../../components/PropertyPage';
import { fetchPublicProperty, propertyPath } from '../../../lib/api';
import { SEO_REVALIDATE } from '../../../lib/seo';

/** Legacy /properties/{slug} links (already shared) → /{companySlug}/{slug}. */
export default async function LegacyPropertyRoute({ params }: { params: { uid: string } }) {
  const property = await fetchPublicProperty(params.uid, { revalidate: SEO_REVALIDATE }).catch(() => null);
  if (property?.companySlug) permanentRedirect(propertyPath(property));
  return <PropertyPage uid={params.uid} />;
}
