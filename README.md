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

- `/` — Canonical listings page: search, property type filter, buy/rent filter, company filter, and paginated results
- `/properties` — Legacy alias that redirects to `/`
- `/company/[uid]` — Canonical company page with banner, stats, search, and filters
- `/properties/company/[uid]` — Legacy alias that redirects to `/company/[uid]`
- `/properties/[uid]` — Property detail page populated from data already fetched on the listings/company pages

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

- The public site does not have access to the authenticated `GET /property/:uid` endpoint, so detail pages are populated from cached data fetched earlier from the public list/company responses.
- If a property is opened directly without first visiting it from the listings or company page, the app shows a friendly fallback message instead of failing silently.
- Listing type is derived from the backend `listing_type` field (`sale` or `rent`), with a deterministic fallback for older records that do not yet return it.
- Requests include the `ngrok-skip-browser-warning` header so browser-like requests work correctly against ngrok tunnels.

## Analytics

PostHog is initialised by `components/AnalyticsProvider.tsx` (mounted in `app/layout.tsx`) when
`NEXT_PUBLIC_POSTHOG_KEY` is set; without the key it no-ops. Event names are constants in
`lib/analytics.ts` — never write an event string at a call site. Track property views, agent contact, enquiries and meeting requests. Session recording is disabled — the enquiry forms collect visitor PII.

Use the **same PostHog project key as the CRM app** so the anonymous visitor id carries across
subdomains via the root-domain cookie and cross-site funnels join up. See
`docs/integrations/POSTHOG.md` for the platform-wide contract.
