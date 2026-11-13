# Step 20 · Connecting CMarket.Api (L): done

Step 20 of the [roadmap](../../ROADMAP.md#order).

`CMarket.Api` (the back end's repository, phases 0 to 16) serves the routes, JSON and errors of
the mock: 202 of the mock's 203 routes are among its controllers, the last one being the
`accept`/`decline` pair of a contact request. The front end moves onto it in ten steps; each ends
with the type check, the lint, the unit tests and the flows of the screens it touches.

1. **Addresses in `.env`: done.** `VITE_API_URL`, the API's origin, gives the REST API and both
   hubs; a malformed one stops the dev server and the build. The images the API names by its own
   path (profile photos, a publication's images) show from its origin, and the studio keeps the
   path the API checks on save.
2. **`npm run dev:api`: done.** The mode `api` turns the mock off and forwards `/api` and `/hubs`
   to the API on port 5001: one origin, so the session cookie works as in production.
3. **The prototype's helpers on the API: done.** The demo accounts, the code filled in and the
   account switch follow `VITE_DEV_TOOLS`, on in the mode `api`: the API serves `/_prototype/*` in
   development. Checked in a browser: login, MKT with prices through the hub, a reload that keeps
   the session, the switch to the Data admin.
4. **Every screen on the API: done.** Each of the eight demo accounts opened every screen it may
   (the client screens with the eight tabs of a security and YAS, the Data admin's six, the
   Admin's six) on a fresh database: no request failed, the console stayed clean and no panel
   showed an error. The account form's `org-cmarket`, the mock's id, does no harm: the API leaves
   CMarket's organisation out of the list and places its employees itself.
5. **The API module: done** (`src/shared/api/endpoints/`): one file per controller folder of
   the API, each a route table and its calls; `routes.test.ts` checks every route against the
   API's OpenAPI (`openapi-routes.txt`, from `npm run api:routes`), and the mock's
   `routes.test.ts` that each has a handler.
6. **The hooks onto the module: done**, area by area: Auth, Me and the development tools; Market
   and Securities; Watchlists and Charts; Bonds and Analysis; Portfolios; Content and Alerts;
   Subscriptions and Organization; Research; the Data admin; the Admin; Network and Messaging.
7. **The module locked: done.** Only `src/shared/api/` imports the client (ESLint).
8. **`npm run test:api`: done.** About seventy reads, each made by every demo account its
   permissions and plan allow: 391 pass, 169 skipped as not allowed. It found one probe of ours
   wrong (the Admin may not read `/me/blocks`), nothing in the API.
9. **`npm run e2e:api`: done.** 77 of the 92 flows pass on the API, twice in a row from a fresh
   database, its rate limits on. They name demo records with `demoId()` (the API's GUIDs derive
   from the mock's ids); a flow that logs out takes a session of its own, one that arranges MKT
   starts from the default layout, one that changes the profile puts it back. The 15 tagged
   `@mock` stay on the mock: its simulated people (3) and service worker (1), its sample sector
   averages (2), and the data as seeded, which the other flows change on the one database (9:
   counts, the newest note first, P. Owona's password reset, the latest conversation). Each spec
   run alone on a fresh database passes on the API but for the first six.
10. **Wrap-up: done.** README: the scripts, the tests, the guide to the real back end.

What the check of 8 November found, all flows run on the API and each call of the module compared
with its OpenAPI (queries, bodies, answers: they match):

- `src/mocks/reports.test.ts` ("the referred account first") failed from 7 November: the reported
  conversation's times counted back from today, the profile reports' were fixed, and the newer of
  the two came first. The conversation now keeps fixed times as well.
- A layout change in its last 800 ms was lost when the tab closed or reloaded (no React cleanup
  runs then), and a save under way was cut short. The save now goes out on `pagehide`, kept alive.
- A build for the API (`VITE_USE_MOCKS=false`) still carried the mock and MSW, never loaded:
  `main.tsx` now tests `VITE_USE_MOCKS` as Vite writes it into the code, and such a build leaves
  them out (4.0 MB instead of 4.8).
- `CMarket.Api`, fixed there (its ADR-040): a GET of a route its output cache keeps
  (`/subscription/plans`, `/directory/specialties`, `/public/profiles/{slug}`) answered 500 when it
  waited on the cache's fill and the request filling it was cancelled by its browser:
  `OutputCacheMiddleware` shared the fill and its cancellation (reproduced, 2 rounds in 10). The
  three policies now turn the lock off (`SetLocking(false)`): each request that misses runs its
  own query. The same script then gave no 500 in 300 rounds.

Deployment (the environments' `.env` files, the site and the API on one domain, CORS) comes after.
The API's Bicep template gives it its default `*.azurecontainerapps.io` address while the site is
`staging.cmarket.example`: two sites, so the `SameSite=Strict` refresh cookie would not be kept.
The API needs a custom domain on the site's (`api.cmarket.example`), or a proxy on the site's
origin.
