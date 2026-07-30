import type { Metadata } from 'next';
import type { ReactNode } from 'react';
import './globals.css';

const rawSiteUrl = process.env.NEXT_PUBLIC_SITE_URL_PROPERTIES || 'https://crmdost.com';
const siteUrl = rawSiteUrl.replace(/\/$/, '');

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: 'CRM Dost Properties | Public Listings',
    template: '%s | CRM Dost Properties'
  },
  description:
    'Browse public property listings powered by CRM Dost. Discover verified homes and commercial spaces from trusted companies with rich details and direct contact options.',
  keywords: [
    'CRM Dost Properties',
    'Public Property Listings',
    'Property CRM',
    'Real Estate Listings',
    'Commercial Property',
    'Residential Property',
    'CRM Dost'
  ],
  alternates: {
    canonical: '/'
  },
  openGraph: {
    title: 'CRM Dost Properties | Public Listings',
    description:
      'Explore public listings from CRM Dost companies with photos, pricing, location context, and direct agent contact options.',
    url: siteUrl,
    siteName: 'CRM Dost Properties',
    type: 'website',
    images: [
      {
        url: '/media/crmdost.png',
        width: 1200,
        height: 630,
        alt: 'CRM Dost Properties'
      }
    ]
  },
  twitter: {
    card: 'summary_large_image',
    title: 'CRM Dost Properties | Public Listings',
    description:
      'Public property discovery experience powered by CRM Dost.',
    images: ['/media/crmdost.png']
  },
  icons: {
    icon: '/favicon.ico'
  }
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap" rel="stylesheet" />
      </head>
      <body>{children}</body>
    </html>
  );
}
