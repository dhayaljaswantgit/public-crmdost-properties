import { permanentRedirect } from 'next/navigation';
import CompanyPage from '../../../components/CompanyPage';
import { fetchPublicCompany } from '../../../lib/api';
import { SEO_REVALIDATE } from '../../../lib/seo';

/** Legacy /company/{id} links (already shared) → the company's /{slug} page. */
export default async function LegacyCompanyRoute({ params }: { params: { uid: string } }) {
  const data = await fetchPublicCompany(params.uid, { revalidate: SEO_REVALIDATE }).catch(() => null);
  if (data?.company.slug) permanentRedirect(`/${data.company.slug}`);
  return <CompanyPage uid={params.uid} />;
}
