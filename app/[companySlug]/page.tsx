import type { Metadata } from 'next';
import { permanentRedirect } from 'next/navigation';
import CompanyPage from '../../components/CompanyPage';
import { fetchPublicCompany } from '../../lib/api';
import { DEFAULT_DESCRIPTION, SEO_REVALIDATE, SITE_NAME, SITE_URL, companyTitle } from '../../lib/seo';

type Props = { params: { companySlug: string } };

/** Same URL + options in metadata and page, so Next de-duplicates the request. */
const loadCompany = (slug: string) =>
  fetchPublicCompany(slug, { revalidate: SEO_REVALIDATE }).catch(() => null);

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const data = await loadCompany(params.companySlug);
  if (!data) return { title: { absolute: SITE_NAME }, robots: { index: false } };

  const title = companyTitle(data.company.name);
  const url = `${SITE_URL}/${data.company.slug || params.companySlug}`;
  return {
    title: { absolute: title },
    description: DEFAULT_DESCRIPTION,
    alternates: { canonical: url },
    // og:image comes from ./opengraph-image.tsx (the company banner, cropped).
    openGraph: { title, description: DEFAULT_DESCRIPTION, url, siteName: SITE_NAME, type: 'website' },
    twitter: { card: 'summary_large_image', title, description: DEFAULT_DESCRIPTION },
  };
}

export default async function CompanyRoute({ params }: Props) {
  const data = await loadCompany(params.companySlug);
  // A numeric id, or different casing, lands on the canonical address.
  if (data?.company.slug && data.company.slug !== params.companySlug) {
    permanentRedirect(`/${data.company.slug}`);
  }
  return <CompanyPage uid={params.companySlug} />;
}
