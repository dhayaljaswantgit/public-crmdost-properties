import { permanentRedirect } from 'next/navigation';
import PropertyPage from '../../../components/PropertyPage';
import { lookupPublicProperty, propertyPath } from '../../../lib/api';
import { SEO_REVALIDATE } from '../../../lib/seo';

/** Legacy /properties/{slug} links (already shared) → /{companySlug}/{slug}. */
export default async function LegacyPropertyRoute({ params }: { params: { uid: string } }) {
  const lookup = await lookupPublicProperty(params.uid, { revalidate: SEO_REVALIDATE }).catch(() => null);
  if (lookup?.state === 'found' && lookup.property.companySlug) permanentRedirect(propertyPath(lookup.property));
  // Off the market: still move the old link to the canonical address, where
  // the "no longer available" page links the company's other listings.
  if (lookup?.state === 'unavailable' && lookup.company.slug) permanentRedirect(`/${lookup.company.slug}/${params.uid}`);
  return <PropertyPage uid={params.uid} />;
}
