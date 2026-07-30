import type { MetadataRoute } from 'next';
import { fetchPublicProperties } from '../lib/api';

const rawSiteUrl = process.env.NEXT_PUBLIC_SITE_URL_PROPERTIES || 'https://crmdost.com';
const siteUrl = rawSiteUrl.replace(/\/$/, '');

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base: MetadataRoute.Sitemap = [
    {
      url: `${siteUrl}/`,
      changeFrequency: 'hourly',
      priority: 1,
    },
  ];

  const data = await fetchPublicProperties({ page: 1, perPage: 100, search: '', type: 'any' });
  const propertyUrls = (data.items || [])
    .filter((property) => !!property?.id)
    .map((property) => ({
      url: `${siteUrl}/properties/${property.id}`,
      changeFrequency: 'daily' as const,
      priority: 0.8,
    }));

  const companyUrls = Array.from(
    new Set((data.items || []).map((property) => property.companyId).filter(Boolean)),
  ).map((companyId) => ({
    url: `${siteUrl}/company/${companyId}`,
    changeFrequency: 'daily' as const,
    priority: 0.7,
  }));

  return [...base, ...propertyUrls, ...companyUrls];
}
