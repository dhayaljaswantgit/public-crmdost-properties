# CRM Dost — Public Properties

A Next.js public-facing property site that connects to the CRM Dost REST API and exposes a polished browsing experience for listings, companies, and property details.

## What this app does

The site is wired to the public API endpoints and supports:

- A searchable, filterable listings homepage at `/`
- Company pages at `/company/[uid]`
- Property detail pages at `/properties/[uid]`
- Buy/rent filtering and company-based filtering
- A photo lightbox, agent/contact actions, and enquiry/meeting forms
- Rent-specific metadata such as rent frequency, security deposit, maintenance charges, and availability

## Routes

- `/` — Listings page: search, property type filter, buy/rent filter, company filter, and paginated results
- `/[companySlug]` — Company page (banner, stats, search, filters). Canonical company URL.
- `/[companySlug]/[propertySlug]` — Property detail. Canonical property URL; a property opened under the wrong company slug redirects to its own.
- `/company/[id]`, `/properties/[slug]`, `/properties/company/[id]`, `/properties` — legacy links; permanent (308) redirects to the canonical URLs so links already shared keep working.

Company slugs sit at the site root, so they must never equal a top-level route or `public/` file. The backend refuses those (`RESERVED_SLUGS` in `nodejs-server/src/utils/slug.ts`) — add any new top-level route or public file there too.

## Link previews and SEO

`app/[companySlug]/page.tsx` and `app/[companySlug]/[propertySlug]/page.tsx` are server components that set the title, description, canonical URL and Open Graph / Twitter tags (`lib/seo.ts`), then render the client pages in `components/`.

- Company: `CRM Dost Properties | Public Listing | {company}` with the site description.
- Property: `{property} | {company} | CRM Dost Properties`; description is the first ~155 characters of the listing's own description.
- Share image (`opengraph-image.tsx` in each segment): the company's first banner image, or the property's first photo, cropped to 1200×630 on the fly with `sharp`, with the company logo on a white card. JPEG (~30–120 KB) because chat apps drop heavy previews. Falls back to the default banner.

Metadata and share images re-fetch from the API at most every 5 minutes (`SEO_REVALIDATE`).

## API configuration

Set the API origin in the environment variable below. The app appends `/v1` internally, so this should be the base origin only.

```bash
NEXT_PUBLIC_API_URL=http://localhost:3004
```

Production safety: if no API origin env var is provided, the app falls back to `https://test.apis.crmdost.com` (to avoid accidental same-origin `/v1` calls on the public site domain).

Example:

```bash
npm install
npm run dev
```

## Build

```bash
npm run build
```

Docker image builds use `npm ci` for reproducible dependency installation and a `.dockerignore` that excludes local artifacts (`node_modules`, `.next`, `.env`, `.git`).

## Notes

- `sharp` is a runtime dependency (share images). `npm ci` installs the right native build per platform, including Alpine (musl) in Docker.
- Listing type is derived from the backend `listing_type` field (`sale` or `rent`), with a deterministic fallback for older records that do not yet return it.
- Requests include the `ngrok-skip-browser-warning` header so browser-like requests work correctly against ngrok tunnels.

## Analytics

PostHog is initialised by `components/AnalyticsProvider.tsx` (mounted in `app/layout.tsx`) when
`NEXT_PUBLIC_POSTHOG_KEY` is set; without the key it no-ops. Event names are constants in
`lib/analytics.ts` — never write an event string at a call site. Track property views, agent contact, enquiries and meeting requests. Session recording is disabled — the enquiry forms collect visitor PII.

Use the **same PostHog project key as the CRM app** so the anonymous visitor id carries across
subdomains via the root-domain cookie and cross-site funnels join up. See
`docs/integrations/POSTHOG.md` for the platform-wide contract.
