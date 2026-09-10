import type { MetadataRoute } from 'next';
import { companyPath, fetchPublicProperties, propertyPath } from '../lib/api';
import { SITE_URL } from '../lib/seo';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base: MetadataRoute.Sitemap = [
    {
      url: `${SITE_URL}/`,
      changeFrequency: 'hourly',
      priority: 1,
    },
  ];

  const data = await fetchPublicProperties({ page: 1, perPage: 100, search: '', type: 'any' });
  const items = (data.items || []).filter((property) => !!property?.id);

  // Canonical addresses only (/{company}/{property}), never the legacy
  // /properties/… and /company/… ones that redirect.
  const propertyUrls = items.map((property) => ({
    url: `${SITE_URL}${propertyPath(property)}`,
    changeFrequency: 'daily' as const,
    priority: 0.8,
  }));

  const companies = new Map<string, string>(items.map((property) => [property.companyId, property.companySlug]));
  const companyUrls = Array.from(companies.entries())
    .filter(([companyId]) => !!companyId)
    .map(([companyId, slug]) => ({
      url: `${SITE_URL}${companyPath(slug, companyId)}`,
      changeFrequency: 'daily' as const,
      priority: 0.7,
    }));

  return [...base, ...propertyUrls, ...companyUrls];
}
