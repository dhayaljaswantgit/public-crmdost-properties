import type { Metadata } from 'next';
import { permanentRedirect } from 'next/navigation';
import PropertyPage from '../../../components/PropertyPage';
import { fetchPublicProperty, listingTag, propertyPath } from '../../../lib/api';
import { DEFAULT_DESCRIPTION, SEO_REVALIDATE, SITE_NAME, SITE_URL, excerpt, propertyTitle } from '../../../lib/seo';

type Props = { params: { companySlug: string; propertySlug: string } };

const loadProperty = (slug: string) =>
  fetchPublicProperty(slug, { revalidate: SEO_REVALIDATE }).catch(() => null);

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const property = await loadProperty(params.propertySlug);
  if (!property) return { title: { absolute: SITE_NAME }, robots: { index: false } };

  const title = propertyTitle(property.name, property.companyName);
  // The listing's own words first; a generic line only when it has none.
  const place = [property.society, property.sector, property.addr1].filter(Boolean).join(', ');
  const description =
    excerpt(property.description) ||
    excerpt(`${listingTag(property.id, property.listingType).tag}${place ? ` in ${place}` : ''}. ${DEFAULT_DESCRIPTION}`);
  const url = `${SITE_URL}${propertyPath(property)}`;
  return {
    title: { absolute: title },
    description,
    alternates: { canonical: url },
    openGraph: { title, description, url, siteName: SITE_NAME, type: 'website' },
    twitter: { card: 'summary_large_image', title, description },
  };
}

export default async function PropertyRoute({ params }: Props) {
  const property = await loadProperty(params.propertySlug);
  // Listed under another company's address (or old casing): go to the real one.
  if (property?.companySlug && property.companySlug !== params.companySlug) {
    permanentRedirect(propertyPath(property));
  }
  return <PropertyPage uid={params.propertySlug} />;
}
