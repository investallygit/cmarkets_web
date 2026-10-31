# CMarket web (prototype)

Front end of CMarket, built from `CMarket-developer-spec-EN.pdf`: the client terminal and the
back-office of the Data admin and of the Admin. This prototype runs without a back end: a mock
layer answers the REST API and simulates the real-time hub with the sample data of the mockups.

## Getting started

Requires Node 22 or later.

```bash
npm install
npm run dev        # http://localhost:5173
```

| Script                          | Purpose                                                                    |
| ------------------------------- | -------------------------------------------------------------------------- |
| `npm run dev`                   | Dev server with the mock back end                                          |
| `npm run build`                 | Type check, then production build in `dist/`                               |
| `npm run typecheck`             | TypeScript only                                                            |
| `npm run lint`                  | ESLint, including the layer rules below                                    |
| `npm test` / `npm run test:run` | Vitest unit and component tests                                            |
| `npm run e2e`                   | Playwright end-to-end tests (first run: `npx playwright install chromium`) |

The app opens on the home page: what CMarket does, its markets, its users and its plans, with the
free trial and the login; a user already logged in opens the terminal from it (`/app`, the home
screen of the account type). In the prototype, the login page lists a demo account per account
type (all with the password `cmarket2026`) and shows the one-time code the mock would have sent by
e-mail or SMS; a sign-up gets the 14-day free trial. Once in, the user badge at the top right opens the
settings (CFG), switches language (FR / EN) and, in the prototype, account type, so every menu and
permission of spec section 12 can be previewed, and logs out. `/_kit` shows the shared UI
components (form controls, dialogs, toasts, price chart, table export) with sample content. The
mock back end keeps the accounts, organisations, plans and invoices, and each user's watchlists,
alerts, saved screens, portfolios, purchases, layouts and chart drawings in localStorage, with the
research library that every account shares; it plays the browser's part for the refresh token
cookie. It sets off the alerts when a price crosses a threshold, a release comes out or a portfolio
limit is breached. For the Data admin it reads the CSV and Excel templates, runs the format and
business checks of spec section 11 and puts the published rows in place of its generated prices,
index closes, auctions, curves and dividends, until a rollback takes them out. It runs the bond calculator with the formulas of spec section 14.1 and values
portfolios with those of sections 14.2 and 14.3, each tested against the spec's cases; it plays
the mobile money and card payments of research and plans and watermarks the PDFs it writes.

## Stack (spec section 7)

React 18, strict TypeScript, Vite · TanStack Query (server data) · Zustand (layout, preferences,
selection) · TanStack Table + Virtual · TradingView Lightweight Charts (prices) · Recharts
(comparison bars, yield curves, portfolio performance) · react-grid-layout · `@microsoft/signalr`
· Tailwind CSS with the section 8 tokens · i18next (FR / EN) · Vitest, Testing Library,
Playwright · TipTap 3 (the editor of the publishing studio, loaded with that screen only).
Supporting choices: React Router 7, lucide-react icons, MSW 3 for the mock back end,
write-excel-file for the Excel export of tables, read-excel-file for the mock's Excel imports.

## Architecture

The code follows [Feature-Sliced Design](https://feature-sliced.design) (FSD): six layers, each
split into slices by business domain, each slice into segments (`ui`, `model`, `api`, `lib`,
`config`).

```
src/
  main.tsx    entry point: real back end or mocks
  app/        providers, router, app shell layout, global styles
  pages/      one slice per screen: market-dashboard, security-profile, equity-screener,
              yield-curves (YCRV and YAS), portfolio, research-library, publishing-studio, news,
              market-calendar, alerts, settings (CFG), data-import (IMP), data-session (DATA),
              upload-history (HIST), eodhd (EODH), data-corrections (CORR), content (NEWS),
              admin-users (USER), analyst-requests (ANLY), moderation (MOD), payouts (PAY),
              platform-settings (ADMCFG), audit-log (AUDT), home (the home page), auth (login,
              sign-up, password reset), status
  widgets/    self-contained blocks: the panels (indices-panel, order-book-panel, news-panel,
              subscription-panel, current-upload-panel...), the security header and the shell bars
              (top-bar, side-menu, status-bar, ticker-tape)
  features/   user actions: log-in, sign-up, reset-password, log-out, command-bar,
              security-actions, manage-watchlists, manage-alerts, screen-equities,
              manage-portfolios, record-transaction, generate-portfolio-report, buy-publication,
              rate-publication, report-publication, follow-analyst, create-publication,
              edit-publication, draw-on-chart, compare-securities, edit-profile, change-password,
              choose-plan, manage-members, upload-data-file, review-import, roll-back-import,
              correct-price, publish-content, create-account, manage-account,
              review-analyst-request, moderate-publication, mark-payout-paid,
              edit-platform-settings, edit-permissions, switch-language, switch-account,
              workspace-layout
  entities/   business data: session, subscription, organization, security, quote (live
              prices), market, bond, yield-curve, fundamentals, screener, portfolio, publication,
              analyst, document, chart-drawing, watchlist, alert, auction, rate, news,
              calendar-event, notification, data-import, data-provider (EODHD), stored-price,
              account, analyst-request, moderation, payout, platform-settings, audit
  shared/     no business knowledge: API client and contracts, real-time, routes and screen list,
              UI kit (panels, tables, charts, form controls, dialogs, toasts), i18n, formatting
  mocks/      fake back end for the prototype (MSW handlers, sample data, simulated hub)
```

ESLint (`no-restricted-imports` in `eslint.config.js`) enforces the FSD rules:

- A layer only imports the layers below it:
  `app -> pages -> widgets -> features -> entities -> shared`.
- A slice never imports another slice of its own layer: pages compose widgets, widgets compose
  features and entities.
- Another slice is reached only through its public `index.ts` (`@/entities/market`); inside a
  slice, imports are relative.
- `mocks/` only sees `shared/`, like a real server only shares the API contract; only `main.tsx`
  loads it.

Where new code goes:

| Code                                                         | Place                                                                      |
| ------------------------------------------------------------ | -------------------------------------------------------------------------- |
| A screen of the spec                                         | `SCREENS` in `shared/routes/screens.ts`, its page in `app/routes/pages.ts` |
| The page of a screen: which panels, default layout           | `pages/<screen>`                                                           |
| A panel, or any block shown on several screens               | `widgets/<name>`                                                           |
| A user action (add to a list, create an alert, buy a report) | `features/<verb>-<noun>`                                                   |
| A business object: types, API hooks, live state, small UI    | `entities/<object>`                                                        |
| A form opened from several screens (an alert, a list)        | `features/`, opened through a store in `entities/<object>/model`           |
| Anything without business knowledge                          | `shared/`                                                                  |

When two widgets of a page must talk (the Indices panel picks the index of the chart, a screener
row feeds the comparison and the statements), the page holds the state and passes props: see
`pages/market-dashboard/model/indexSelection.ts` and `pages/equity-screener/model/selection.ts`. When a
feature must open the form of another one ("Create an alert" in the right-click menu of a
security), it asks through the entity's store (`openAlertDialog`), since features never import
each other; the app shell mounts the form once.

### Data flow

- **REST**: `shared/api/client.ts` calls `/api/v1`, with errors as RFC 7807 `ApiError`.
  Each entity wraps its endpoints in TanStack Query hooks (`entities/*/api/queries.ts`).
  DTOs live in `shared/api/contracts`; they mirror spec section 10 and will be replaced by the
  client generated from the OpenAPI contract (Orval) once `CMarket.Api` exists.
- **Real time**: `shared/realtime` defines a `RealtimeClient` interface with a SignalR
  implementation (`/hubs/market`) and ref-counted symbol subscriptions. Each entity handles the
  hub events it owns (`use*RealtimeSync`, mounted once by `app/layouts/AppShell.tsx`). Live
  quotes go into a Zustand store (`entities/quote/model`), so a tick re-renders one table cell,
  which flashes for 400 ms. The order book and the latest trades have no hub event: they are
  polled every 5 seconds. `ImportStatusChanged` moves an upload through its checks, and
  `DataPublished` (a file published or rolled back, a price corrected) refreshes the quotes,
  histories, indices, auctions and curves the open screens show.
- **Layouts**: each page declares its panels and default grid (`pages/*/config`);
  `features/workspace-layout` saves the user's layout through `GET/PUT /me/layouts/{screen}`.
- **Session** (spec section 10): `shared/api/session.ts` keeps the access token (15 minutes) in
  memory only; the refresh token (7 days) is an HttpOnly cookie that `POST /auth/refresh` trades
  for a new access token, at start-up and when a token runs out. A 401 renews the token once and
  sends the request again; several requests share one renewal; a refused renewal ends the session
  and the login page opens on `?next=` the page asked for. The hub connects with the session and
  takes the same token. The tabs of a browser log in and out together (`BroadcastChannel`), and
  30 minutes without an action in any of them log the user out after a one-minute warning.
- **Permissions**: `/me` returns the user's permissions and the modules of their plan;
  `entities/session` decides which screens the menu, the command bar and the routes offer, and a
  screen outside the plan offers the plans instead of its content. The server stays the
  authority. The Admin edits the permissions of each account type and the quotas in ADMCFG; a
  user gets them with the next `/me`.
- **Admin's data**: the query keys of the Admin's screens start with `admin`
  (`shared/api/adminData.ts`). An Admin's action refreshes all of them, since it often changes
  several lists and always writes to the audit log; the mutation does not wait for the refresh,
  so its own callbacks run before the refreshed list removes the row that started it.

### Design system

`app/styles/index.css` holds the colour tokens of spec section 8 under their spec names
(`--bg-panel`, `--accent-amber`...) and maps them to Tailwind utilities (`bg-panel`,
`text-accent-amber`, `text-up`...). Tailwind's default palette is removed, so only these colours
exist. Numbers use `shared/lib/format.ts` (`52 500,25` in French, `52,500.25` in English, dates
`DD/MM/YYYY` in the time zone of the user's profile, Douala by default; a calendar day keeps its
date in every zone, and the session clock stays in Douala time), and inputs read them back with
`shared/lib/parse.ts`. The home page and the login pages use the brand navy and green, kept for
them and the logo (the "marketing pages" of spec section 8); the home page alone has larger type
(`text-lead`, `text-headline`, `text-display`), photos for its mood (from Pexels, free to use,
listed in `pages/home/config/photos.ts`) and motion: its hero rises into place over a city at
night closing in, the grid of a chart and price lines sliding by, two glows drift behind the page,
the photos of its sections move against the scroll, its sections come in as they scroll into
view, and its picture of the terminal types commands, moves its sample quotes with the 400 ms
flash of the screens and scrolls its tape, only while on screen and until its Pause button;
nothing moves under `prefers-reduced-motion`. The screens keep the flash alone.
Icons come from `lucide-react`.

Screens build on `shared/ui`: `Panel`, `PanelTabs` and `PanelSelect` (options of a title bar),
`ScreenTabs`, `Pager` (pages of a server list), `DataTable` (sorting, right-click menu, Excel and CSV export unless the user lacks
`analysis:export`; `exportRef` puts the export links in a title bar; a `footer` row stays out of
the sorting; `sorting` and `onSortingChange` leave the order to the server for a paged list), `charts/` (`PriceChart` with indicator panes, comparison rebased to 100 and
drawings; `AreaChart`; `useChartTheme`, the section 8 colours for Recharts, which draws in SVG,
and the `--chart-*` series palette checked for colour-blind separation), `PdfViewer`, `form/`
(buttons, fields, selects, number and date inputs in the user's format, password inputs,
checkboxes, segmented choices, file drop zone), `Dialog` (also as a side form), `ConfirmDialog`
(with a required reason) and `toast`. Entities add small business components, such as the security picker of
`entities/security`.

## Connecting the real back end

1. Set `VITE_USE_MOCKS=false` in `.env.local`.
2. Point `DEV_PROXY_TARGET` at `CMarket.Api` for local development, or set `VITE_API_BASE_URL`
   and `VITE_REALTIME_HUB_URL` for a deployed API.
3. Have `POST /auth/otp/verify` and `/auth/refresh` set the refresh token as an `HttpOnly`,
   `Secure` cookie on the `/auth` path. The login calls are sent with credentials; an API on
   another origin needs CORS with credentials for this site, and `SameSite=None` on the cookie.

The screens do not change: they only know the API contract. The prototype's account switch and
the demo accounts of the login page go with the mock.

## Status

| Screen                                                                    | State                                                         |
| ------------------------------------------------------------------------- | ------------------------------------------------------------- |
| Home page: the product, markets, users and plans; trial and login         | Done; the plans come from the server before login             |
| App shell: top bar, command bar, ticker, menu by account type, status bar | Done                                                          |
| Shared UI kit: form controls, dialogs, toasts, price chart, Excel export  | Done, shown on `/_kit`                                        |
| 1 · Market dashboard (MKT)                                                | Done on mock data, real-time quotes and indices, watchlists   |
| 2 · Security profile (DES, GP, FA, DVD, N, DOC, HDS, ANA)                 | Done on mock data                                             |
| 3 · Equity screener and fundamental analysis (EQS, FA)                    | Done on mock data, saved screens                              |
| 4 · Yield curves and bond calculator (YCRV, YAS)                          | Done; the mock computes spec section 14.1                     |
| 5 · Portfolio (PORT)                                                      | Done; the mock values portfolios with sections 14.2 and 14.3  |
| 7 · Publishing studio (PUB NEW)                                           | Done on mock data, autosave, versions, frozen charts          |
| 8 · Research library (PUB)                                                | Done; the mock plays mobile money and card payments           |
| News (N), market calendar (CAL), alerts (ALRT): no mockup                 | Done on mock data; the mock sets off the alerts               |
| Settings (CFG): profile, security, subscription, organisation, invoices   | Done; plans paid by card, mobile money or transfer            |
| Login, OTP, sign-up, password reset, token refresh, logout                | Done; logout after 30 minutes without activity                |
| 6 · Data import (IMP) with DATA, HIST and EODH                            | Done; the mock checks, publishes and rolls back the files     |
| Data corrections (CORR), news and documents (NEWS): no mockup             | Done on mock data; corrections logged with their reason       |
| 9 · Account administration (USER) with ANLY and MOD                       | Done; 1,959 accounts, requests, moderation queue on mock data |
| Platform settings (ADMCFG), audit log (AUDT), payouts (PAY): no mockup    | Done; every Data admin and Admin action is in the audit log   |

How the screens were built, step by step, and the open questions for the spec author are in
[ROADMAP.md](ROADMAP.md).
