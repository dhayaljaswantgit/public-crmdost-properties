# CRM Dost — Public Properties (Next.js, live API)

Three routes wired to real REST endpoints on `test.apis.crmdost.com`-style API. `NEXT_PUBLIC_API_ENDPOINT` should be the API origin only, and `/v1` is appended in code:

- `/` — All properties (canonical): search, type filter, **Buy/Rent filter**, **company filter**, windowed pagination → `GET /v1/property/public`
- `/properties` — Legacy alias that redirects to `/`
- `/company/[uid]` — Public company page (canonical): banner, stats, search/filters → `GET /v1/property/public/company/:uid`
- `/properties/company/[uid]` — Legacy alias that redirects to `/company/[uid]`
- `/properties/[uid]` — Property detail: photo lightbox (click any image, prev/next nav), price/beds/baths/area, agent card, enquiry form

## Run
```bash
npm install
npm run dev
```
Set `NEXT_PUBLIC_API_ENDPOINT` to the API origin, for example `http://localhost:3004`.

## Notes
- `GET /property/:uid` requires auth we don't have on the public site, so **detail pages are populated from data already fetched** on the list/company pages (cached in `sessionStorage` by `lib/api.ts`'s `cacheProperty`/`getCachedProperty`) instead of calling that endpoint. Opening a detail URL directly (not via a card click) shows a friendly message pointing back to `/`.
- Listing type now comes from backend `listing_type` (`sale` or `rent`) and supports rent metadata fields (`rent_frequency`, `security_deposit`, `maintenance_charges`, `available_from`) on the detail page.
- `listingTag()` in `lib/api.ts` still includes a deterministic fallback only for legacy records that do not yet return `listing_type`.
- ngrok free tunnels return an HTML interstitial to browser-like requests unless `ngrok-skip-browser-warning: true` is sent — already wired into every fetch call.
