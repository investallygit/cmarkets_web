# CMarket web

Front end of CMarket, built from `CMarket-developer-spec-EN.pdf` (third version, 10 November
2026, whose additions are under way): the client terminal with its professional directory and
messaging, and the back-office of the Data admin and of the Admin. It takes all its data from
`CMarket.Api`: the REST API and the SignalR hubs.

- [Introduction](#introduction): what the app does, its stack, the status of each screen
- [Installation](#installation): run it, log in, the scripts
- [Structure](#structure): the folders, the rules between them, the data flow, the design system
- [Guides](#guides): where new code goes, a new screen, translations, tests, the back end

## Introduction

The app opens on the home page: what CMarket does, its markets, its users and its plans, with the
free trial and the login; a user already logged in opens the terminal from it (`/app`, the home
screen of the account type). Once in, the user badge at the top right opens the settings (CFG),
switches language (FR / EN) and, with the API's development tools, account type, so every menu and permission of
spec section 12 can be previewed, and logs out. With the development tools, `/_kit` shows the
shared UI components (form controls, dialogs, toasts, price chart, table export) with sample
content.

`CMarket.Api` keeps the accounts, organisations, plans and invoices, each user's watchlists,
alerts, saved screens, portfolios, purchases, layouts and chart drawings, and what the accounts
share: the research library, the professional profiles and the conversations. It sets off the
alerts, applies the visibility and contact rules of spec section 15, runs the upload checks of
spec section 11, the bond calculator of section 14.1 and the portfolio valuation of sections 14.2
and 14.3, and takes the payments. The front end only knows the API contract.

### Stack (spec section 7)

React 18, strict TypeScript, Vite · TanStack Query (server data) · Zustand (layout, preferences,
selection) · TanStack Table + Virtual · TradingView Lightweight Charts (prices) · Recharts
(comparison bars, yield curves, portfolio performance) · react-grid-layout · `@microsoft/signalr`
· Tailwind CSS with the section 8 tokens · i18next (FR / EN) · Vitest, Testing Library,
Playwright · TipTap 3 (the editors of the publishing and news studios, loaded with them only).
Supporting choices: React Router 7, lucide-react icons, flag-icons for the countries' flags,
write-excel-file for the Excel export of tables, read-excel-file to read the Excel templates
before upload.

### Status

| Screen                                                                    | State                                                         |
| ------------------------------------------------------------------------- | ------------------------------------------------------------- |
| Home page: the product, markets, users and plans; trial and login         | Done; the plans come from the server before login             |
| App shell: top bar, command bar, ticker, menu by account type, status bar | Done; MSG in the menu counts the unread messages              |
| Shared UI kit: form controls, dialogs, toasts, price chart, Excel export  | Done, shown on `/_kit`                                        |
| 1 · Market dashboard (MKT)                                                | Done, real-time quotes and indices, watchlists                |
| 2 · Security profile (DES, GP, FA, DVD, N, DOC, HDS, ANA)                 | Done; DES opens the profile of the security's type            |
| 3 · Equity screener and fundamental analysis (EQS, FA)                    | Done, saved screens                                           |
| 4 · Yield curves and bond calculator (YCRV)                               | Done; the API computes spec section 14.1                      |
| 5 · Portfolio (PORT)                                                      | Done; the API values portfolios with sections 14.2 and 14.3   |
| 7 · Publishing studio (PUB NEW)                                           | Done, autosave, versions, frozen charts                       |
| 8 · Research library (PUB)                                                | Done; mobile money and card payments                          |
| News (N), market calendar (CAL), alerts (ALRT): no mockup                 | Done; each news item has a link to share                      |
| Settings (CFG): profile, security, subscription, organisation, invoices   | Done; plans paid by card, mobile money or transfer            |
| Login, OTP, sign-up, password reset, token refresh, logout                | Done; logout after 30 minutes without activity                |
| Journalist and CEO account types                                          | Done; a CEO reads the portfolios shared with the organisation |
| 10 · Professional directory (NET), public profile page                    | Done; the demo data lists 1,177 profiles                      |
| 11 · Messaging (MSG)                                                      | Done; read, typing and presence in real time                  |
| 12 · My profile, visibility and contact (NET ME)                          | Done; the API applies the contact rules of section 15         |
| 6 · Data import (IMP) with DATA, HIST and EODH                            | Done; the API checks, publishes and rolls back the files      |
| Data corrections (CORR), news and documents (NEWS): no mockup             | Done; NEWS moderates the news and names the publishers        |
| 9 · Account administration (USER) with ANLY and MOD                       | Done; MOD reviews the directory reports and the news too      |
| Platform settings (ADMCFG), audit log (AUDT), payouts (PAY): no mockup    | Done; ADMCFG also sets the directory; every action is logged  |
| News provider account type (third version)                                | Done; it writes in its studio, NEWS NEW                       |
| News rebuilt: ARTICLE and FLASH, newspapers, tags, unique clicks          | Done; the content shown 3 seconds counts a unique click       |
| 13 · News studio (NEWS NEW)                                               | Done; drafts, schedule, withdrawal, file import, earnings     |
| News sources (SRC), AI ingestion, international news: no mockup           | Done; the AI pushes signed items, EODHD news every 15 minutes |
| 18 · Media payments (MPAY)                                                | Done; a second Admin above XAF 300,000; disputes in NEWS NEW  |
| 17 · Bond screener (BS)                                                   | Done; computed each evening, model prices, yield to worst     |
| 16 · Bond pricing (BP), which YAS opens                                   | Done; a bond of the list or by hand, at the platform's yield  |
| 20 · Bond profile (DES on a bond: DES, GP, BP, CF, RAT, DOC)              | Done; a year of daily figures, model prices drawn lighter     |
| 15 · ETF screener (ETFS)                                                  | Done; figures computed each evening, saved screens, export    |
| 19 · ETF profile (DES on an ETF)                                          | Done; history with NAV, holdings, allocation, PERF, DIST      |
| 14 · Subscription management (SUBS)                                       | Done; renewals charged, failures retried, plans prorated      |
| Security descriptions on EQS (screen 3)                                   | To do, step 35                                                |

How the screens were built, step by step, what the second version of the spec added (the
Journalist and CEO account types, screens 10 to 12 and what they change on screen 9), the plan of
the third version (the News provider, the news rebuilt, screens 13 to 20) and the open questions
for the spec author are in [ROADMAP.md](ROADMAP.md). The screens follow WCAG 2.2 AA:
axe finds nothing on any of them for any account type, and each works from the keyboard and in a
window down to 320 px wide.

## Installation

Requires Node 22 or later.

```bash
npm install
npm run dev        # http://localhost:5173
```

The dev server needs `CMarket.Api` running on port 5001 (`dotnet run --project src/CMarket.Api
--launch-profile http` in its repository): it forwards `/api` and `/hubs` to it
(`.env.development`). Without the API, the login fails and no screen has data; see
[Connecting the back end](#connecting-the-back-end).

With the API's development tools, the login page lists a demo account per account type, all with
the password `cmarket2026`, and fills in the one-time code; a sign-up gets the 14-day free trial.

| Script                          | Purpose                                                                                    |
| ------------------------------- | ------------------------------------------------------------------------------------------ |
| `npm run dev`                   | Dev server on a `CMarket.Api` running on port 5001 (`.env.development`)                    |
| `npm run build`                 | Type check, then production build in `dist/`                                               |
| `npm run typecheck`             | TypeScript only                                                                            |
| `npm run lint`                  | ESLint, including the layer rules of [Structure](#structure)                               |
| `npm run format`                | Prettier, on every file                                                                    |
| `npm test` / `npm run test:run` | Vitest unit and component tests                                                            |
| `npm run test:api`              | The API module's reads against a running `CMarket.Api`, for each account                   |
| `npm run api:routes`            | Reads the routes of a running `CMarket.Api`'s OpenAPI document again                       |
| `npm run e2e`                   | Playwright flows on a running `CMarket.Api` (first run: `npx playwright install chromium`) |

## Structure

The code follows [Feature-Sliced Design](https://feature-sliced.design) (FSD): six layers, each
split into slices by business domain, each slice into segments (`ui`, `model`, `api`, `lib`,
`config`).

```
src/
  main.tsx    entry point: the hubs of CMarket.Api, then the app
  app/        providers, router, app shell layout, global styles
  pages/      one slice per screen: market-dashboard, security-profile (the profile of each
              security type: an equity's, screen 2, a bond's, screen 20, an ETF's, screen 19),
              equity-screener, etf-screener (ETFS), yield-curves (YCRV), bond-pricing (BP, which
              YAS opens), bond-screener (BS), portfolio,
              research-library, publishing-studio, news,
              market-calendar, alerts, settings (CFG), network-directory (NET), messages (MSG),
              network-profile (NET ME), public-profile (/p/{handle}), data-import (IMP),
              data-session (DATA), upload-history (HIST), eodhd (EODH), data-corrections (CORR),
              content (NEWS), admin-users (USER), subscription-management (SUBS), news-sources
              (SRC), media-payments (MPAY),
              analyst-requests (ANLY),
              moderation (MOD), payouts (PAY), platform-settings (ADMCFG), audit-log (AUDT), home,
              auth (login, sign-up, password reset), status, ui-kit (/_kit)
  widgets/    self-contained blocks: the panels (indices-panel, order-book-panel, news-panel,
              subscription-panel, current-upload-panel, messaging-panels, news-studio-panels,
              news-moderation-panels, news-sources-panels, media-payments-panels,
              subscription-admin-panels,
              bond-screener-results-panel, bond-analytics-panel, bond-pricing-panels,
              bond-profile-panels, etf-screener-results-panel, etf-blocks-panel,
              etf-profile-panels...),
              the security header and the shell bars (top-bar, side-menu, status-bar, ticker-tape)
  features/   user actions: log-in, sign-up, reset-password, log-out, command-bar,
              security-actions, manage-watchlists, manage-alerts, screen-equities, screen-bonds,
              screen-etfs, price-bond,
              manage-portfolios, record-transaction, generate-portfolio-report, buy-publication,
              rate-publication, report-publication, follow-analyst, report-profile,
              start-conversation, send-message, share-news, report-conversation, block-user,
              create-publication, edit-publication, edit-news, import-news, report-news,
              moderate-news, edit-publisher, edit-news-source, edit-news-settings,
              manage-ingest-clients, change-statement-status, decide-click-anomaly,
              edit-payment-terms, edit-payment-settings, resolve-statement-dispute,
              manage-subscription,
              dispute-statement, draw-on-chart,
              compare-securities, edit-profile, edit-network-profile, change-password,
              choose-plan, manage-members, upload-data-file, review-import, roll-back-import,
              correct-price, publish-content, create-account, manage-account,
              review-analyst-request, moderate-publication, moderate-report, mark-payout-paid,
              edit-platform-settings, edit-permissions, switch-language, switch-account,
              workspace-layout
  entities/   business data: session, subscription (CFG's plan and checkout, SUBS's
              subscriptions, payments and actions), organization, security, quote (live
              prices), market, bond (with BS's screener and labels, BP's pricing, the bond
              profile's history, ratings and payments), etf (ETFS's screener, an ETF's blocks,
              performance and distributions, the profile's history, holdings, allocation and
              calendar years, its labels), yield-curve, fundamentals,
              screener, portfolio, publication,
              analyst, document, chart-drawing, watchlist, alert, auction, rate, news, news-source
              (SRC's newspapers, the publishers, CMarket AI's settings and clients), news-statement
              (MPAY's statements, click anomalies and payment settings),
              calendar-event, notification, data-import, data-provider (EODHD), stored-price,
              account, analyst-request, moderation, payout, platform-settings, audit, profile
              (the professional profiles of the directory), conversation (the messaging)
  shared/     no business knowledge: the API (client, contracts and the module of its endpoints,
              api/endpoints), real-time, config (.env), routes, screen list and the profile of
              each security type (routes/profiles.ts), UI kit (panels, tables, charts, form
              controls with a multiple choice, dialogs, toasts, the countries' flags), i18n,
              formatting
e2e/          Playwright flows; auth.setup.ts logs in once and the other specs reuse the session;
              people.ts logs in the other people of a flow, msg.ts finds MSG's panels
public/       the favicon and the photos of the home page
```

### Layer rules

ESLint (`no-restricted-imports` in `eslint.config.js`) enforces the FSD rules:

- A layer only imports the layers below it:
  `app -> pages -> widgets -> features -> entities -> shared`.
- A slice never imports another slice of its own layer: pages compose widgets, widgets compose
  features and entities.
- Another slice is reached only through its public `index.ts` (`@/entities/market`); inside a
  slice, imports are relative and never go up two folders (`../../`).

### File organisation

- A file has at most 700 lines: source, styles, configuration and translation files alike;
  Markdown documents, `package-lock.json`, generated files and images aside.
- A file that grows past it is split. It stays as the parent, at the same path and with the same
  exports, and its parts move into a folder of the same name beside it, one concern per file:
  `src/shared/i18n/locales/en.ts` and `en/`. The code that
  imports the parent does not change; the parts never import their parent.
- No import cycles: when two parts would need each other, the lower one exposes a `set…`
  registration that the higher one calls.
- Inside an FSD slice, a file splits along the segments instead (UI in `ui/`, state in `model/`,
  pure logic in `lib/`, constants in `config/`, requests in `api/`), and the slice's `index.ts`
  stays its public API.
- Files that do the same job share a folder: the endpoints in `shared/api/endpoints/`, the
  translations of each area in `locales/en/` and `fr/`, the parts of a split file in the folder
  named after it.

### Data flow

- **REST**: every endpoint the front end calls is declared in `shared/api/endpoints`, one file
  per controller folder of `CMarket.Api` (`auth.ts`, `market.ts`, `portfolios.ts`...): a route
  table (method, path as the OpenAPI document writes it, type of the answer) and its calls
  (`portfoliosApi.positions(id, signal)`). The calls go through `shared/api/client.ts`, which adds
  the session, renews it on a 401 and turns errors into RFC 7807 `ApiError`s; ESLint lets no other
  code reach the client. Each entity wraps the calls in TanStack Query hooks
  (`entities/*/api/queries.ts`), which keep the query keys and the cache. DTOs live in
  `shared/api/contracts`: they mirror spec section 10 and `CMarket.Api` follows them. A test
  checks every route of the module against the API's OpenAPI document (`openapi-routes.txt`,
  written by `npm run api:routes` from a running API).
- **Addresses**: `.env` gives the API's origin (`VITE_API_URL`; empty, the site's own), from
  which `shared/config/env.ts` derives the REST API and both hubs; see
  [Connecting the back end](#connecting-the-back-end).
- **Real time**: `shared/realtime` defines two hub clients with their SignalR implementations:
  `RealtimeClient` for `/hubs/market`, with ref-counted symbol subscriptions, and `ChatClient`
  for `/hubs/chat`, with the conversations joined while their thread shows. Each entity handles
  the hub events it owns (`use*RealtimeSync`, mounted once by `app/layouts/AppShell.tsx`). Live
  quotes go into a Zustand store (`entities/quote/model`), so a tick re-renders one table cell,
  which flashes for 400 ms. The order book and the latest trades have no hub event: they are
  polled every 5 seconds. `ImportStatusChanged` moves an upload through its checks, and
  `DataPublished` (a file published or rolled back, a price corrected) refreshes the quotes,
  histories, indices, auctions and curves the open screens show. The chat hub connects for the
  users who write to others: a new message joins its thread and the count on MSG in the menu,
  "typing…" of an open thread and the online status go to a store of `entities/conversation`,
  `ConversationUpdated` (a CMarket.Api event beyond the spec: a request accepted, a member added
  or taken out) reads a conversation again, and a new connection reads them all again.
- **Layouts**: each page declares its panels, their default grid and their names
  (`pages/*/config`, `ScreenPanel`); `features/workspace-layout` saves the user's layout through
  `GET/PUT /me/layouts/{screen}`: the places in the grid, the hidden panels, their order stacked
  below 1280 px, the lock and up to 10 layouts kept under a name (`lib/arrangement.ts`). The
  function code of a panel's title bar opens its layout menu (`PanelLayoutMenu`): without
  dragging, a column or a panel aside, wider or narrower, taller or shorter
  (`shared/ui/workspaceLayout.ts`), or once stacked a place up or down; then hide the panel or
  show a hidden one back, undo or redo (also Ctrl + Z and Ctrl + Y, ⌘Z and ⇧⌘Z, wherever no text
  is typed), lock the layout, the saved layouts, or the screen's default back. A grip before the
  title and the corner, drawn at rest, show that a panel moves and resizes; a locked layout shows
  a padlock instead, and stacked panels neither.
- **Session** (spec section 10): `shared/api/session.ts` keeps the access token (15 minutes) in
  memory only; the refresh token (7 days) is an HttpOnly cookie that `POST /auth/refresh` trades
  for a new access token, at start-up and when a token runs out. A 401 renews the token once and
  sends the request again; several requests share one renewal; a refused renewal ends the session
  and the login page opens on `?next=` the page asked for. The hubs connect with the session and
  take the same token. The tabs of a browser log in and out together (`BroadcastChannel`), and
  30 minutes without an action in any of them log the user out after a one-minute warning. A
  server out of reach is an `ApiError` in the user's language (`fetchApi`), not the browser's
  "Failed to fetch"; `?next=` keeps a path of this site only, as the browser's URL parser reads
  it (`safeNextPath`).
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
`text-accent-amber`, `text-up`...), with the badge colour of each account type of section 9
(`--type-student`...), which `ACCOUNT_TYPE_COLORS` gives wherever a type shows, and the news tags
of section 16 (`--news-flash`, `--news-partner`...; the `news-tag` utility puts the colour at 15%
on the panel, opaque, so that a selected row keeps the text's contrast). Tailwind's default
palette is removed, so only these colours exist. Numbers use `shared/lib/format.ts` (`52 500,25`
in French, `52,500.25` in English, dates `DD/MM/YYYY` in the time zone of the user's profile,
Douala by default; a calendar day keeps its date in every zone, and the session clock stays in
Douala time), and inputs read them back with `shared/lib/parse.ts`. The home page and the login
pages use the brand navy and green, kept for them, the public profile page and the logo (the
"marketing pages" of spec section 8); the home page alone has larger type
(`text-lead`, `text-headline`, `text-display`), photos for its mood (from Pexels, free to use,
listed in `pages/home/config/photos.ts`) and motion: its hero rises into place over a city at
night closing in, the grid of a chart and price lines sliding by, two glows drift behind the page,
the photos of its sections move against the scroll, its sections come in as they scroll into
view, and its picture of the terminal types commands, moves its sample quotes with the 400 ms
flash of the screens and scrolls its tape, only while on screen and until its Pause button;
nothing moves under `prefers-reduced-motion`. The screens keep the flash alone.
Icons come from `lucide-react`; a country's flag from `flag-icons` (MIT), through
`shared/ui/CountryFlag`, which inlines the flags of the countries the platform names (add a
country's SVG there when a new one appears).

Screens build on `shared/ui`: `Panel`, `PanelTabs` and `PanelSelect` (options of a title bar),
`ScreenTabs`, `Pager` (pages of a server list), `ScrollArea` (a box that scrolls and takes the
focus when nothing in it can), `HoverCard` (a card under its trigger on hover and focus, which
stays while the pointer moves onto it, closes on Escape and follows its trigger when the page
scrolls: the newspaper of a news tag), `rich-text` (what the two studios' editors share: the
toolbar's `ToolButton`, `LinkDialog`, `ApiImage`; and `RichTextView`, which draws a document of
theirs for its readers, a publication's charts and a news item's security cards as nodes of their
own), `DataTable` (sorting, right-click menu, Excel and CSV export unless
the user lacks `analysis:export`; `exportRef` puts the export links in a title bar; a `footer` row
stays out of the sorting; `sorting` and `onSortingChange` leave the order to the server for a
paged list; the arrows move the selection, or a cursor where rows are not selected, Enter opens a
row and the menu key or Shift + F10 its menu; a column given as a share of the width keeps 56 px
at least, so that a table narrower than its columns scrolls sideways in its panel), `ContextMenu`
(takes the focus: arrows, Home, End, Escape; as wide as its longest entry, up to 400 px, then on
two lines; kept inside the window; under a button with `align="end"`; an entry's shortcut shown
and given as `aria-keyshortcuts`),
`charts/` (`PriceChart` with indicator panes, comparison rebased to 100 and drawings;
`AreaChart`; both named for screen readers by `useChartLabel`; `useChartTheme`, the section 8
colours for Recharts, which draws in SVG, and the `--chart-*` series palette checked for
colour-blind separation), `PdfViewer`, `form/` (buttons, fields, selects, a multiple choice that
lists its boxes under its field, number and date inputs in the user's format, password inputs,
checkboxes, switches, segmented choices, file drop zone), `CountryFlag`,
`Dialog` (also as a side form; on closing it gives the focus back to the control that opened it),
`ConfirmDialog` (with a required reason), `ReportForm` (the reason and comment of a report) and
`toast`. Entities add small business components, such as the security picker of
`entities/security` or the avatar, type badge and directory card of `entities/profile`.

## Guides

### Where new code goes

| Code                                                         | Place                                                                        |
| ------------------------------------------------------------ | ---------------------------------------------------------------------------- |
| A screen of the spec                                         | `SCREENS` in `shared/routes/screens.ts`, its page in `app/routes/pages.ts`   |
| The page of a screen: which panels, default layout           | `pages/<screen>`                                                             |
| The profile of a security type: its tabs, title, menu entry  | `SECURITY_PROFILES` in `shared/routes/profiles.ts`, `pages/security-profile` |
| A panel, or any block shown on several screens               | `widgets/<name>`                                                             |
| A user action (add to a list, create an alert, buy a report) | `features/<verb>-<noun>`                                                     |
| A business object: types, API hooks, live state, small UI    | `entities/<object>`                                                          |
| A call to the API (its route, its answer's type)             | `shared/api/endpoints/<API controller folder>.ts`                            |
| A form opened from several screens (an alert, a list)        | `features/`, opened through a store in `entities/<object>/model`             |
| Anything without business knowledge                          | `shared/`                                                                    |

When two widgets of a page must talk (the Indices panel picks the index of the chart, a screener
row feeds the comparison and the statements), the page holds the state and passes props: see
`pages/market-dashboard/model/indexSelection.ts` and `pages/equity-screener/model/selection.ts`.
When a feature must open the form of another one ("Create an alert" in the right-click menu of a
security), it asks through the entity's store (`openAlertDialog`), since features never import
each other; the app shell mounts the form once.

### A new screen

1. Add it to `SCREENS` in `shared/routes/screens.ts`, and its page to `app/routes/pages.ts`.
2. Write its DTOs in `shared/api/contracts`, its routes and calls in `shared/api/endpoints` (the
   file of the API's controller folder). A route the API does not serve yet fails the OpenAPI
   test until `CMarket.Api` has it and `npm run api:routes` reads it again.
3. Build the `pages/<screen>` slice: its panels, their default grid and their names in `config`.
4. Give every string in French and English, and hide or lock the actions by permission and quota.
5. Tables sort, have a right-click menu and export; the layout is saved per user and stacks in one
   column below 1280 px.
6. Cover its logic with Vitest and its main flow with Playwright, then update its line in
   [Status](#status) and in ROADMAP.md.

### Translations

Every UI string is in French and English, in `shared/i18n/locales/en/` and `fr/`: one JSON file
per area of the app (`core` for the shell and the shared UI, `home`, `account` for the login and
the settings, `monitoring`, `analysis`, `bonds`, `portfolio`, `research`, `network`, `messaging`,
`newsStudio`, `newsAdmin`, `payments`, `dataAdmin`, `admin`), which `en.ts` and `fr.ts` merge. Add a key to the same area file in both languages. Keys are typed:
`t('panels.indices')` is checked at compile time. A top-level key lives in one area file only, and
`locales.test.ts` checks it as well as that both languages have the same keys. A new area file
goes in both folders and is added to both `en.ts` and `fr.ts`.

### Tests

- Unit and component tests sit next to the code they test (`*.test.ts`, `*.test.tsx`).
  `npm test` watches, `npm run test:run` runs them once; one file:
  `npx vitest run src/shared/lib/format.test.ts`, one test: add `-t "<its name>"`.
- `npm run test:api` calls the reads of the API module (`shared/api/endpoints`) on a running
  `CMarket.Api` with its development tools and demo data (`CMARKET_API_URL`, port 5001 by
  default): each demo account logs in as the front end does and makes every read its permissions
  and plan allow, which must answer without an error and in the shape of its contract. It is
  apart from `npm run test:run`, which needs no back end.
- `npm run e2e` runs the Playwright flows at 1600 × 900, the resolution of the mockups, on a
  running `CMarket.Api` with its development tools, started on a fresh database, through the dev
  server: it starts one, or uses the one already on port 5173. `e2e/auth.setup.ts` logs in once
  as the demo Analyst and the other specs start from that session. One spec:
  `npx playwright test e2e/portfolio.spec.ts`, one test: add `-g "<its title>"`.
- A flow names a demo record with `demoId()` (`e2e/demoIds.ts`): the GUID the API's seed derives
  from its key. The flows share one database and the stored session, so they run one at a time: a
  flow that logs out takes a session of its own (`ownSession`), one that arranges a screen starts
  from its default layout (`defaultLayout`), one that changes the profile puts it back. The flows
  tagged `@fresh-db` need the demo data as seeded, which the other flows change:
  `E2E_FRESH_DB=1 npx playwright test e2e/<spec>.spec.ts` runs a spec's, on a fresh database.
- A flow where someone else takes part (the messaging in real time) imports `test` from
  `e2e/people.ts`: `person(email)` logs that person in, in a browser context of their own beside
  the test's page, and `apiAs(page)` calls the API as the page's user to set a flow up.
- A change is done when `npm run typecheck`, `npm run lint` and `npm run test:run` pass, and the
  Playwright flow of the screen it touches.

### Connecting the back end

On this machine: start `CMarket.Api` (`dotnet run --project src/CMarket.Api --launch-profile http`
in its repository, port 5001), then `npm run dev`. `.env.development` has the dev server forward
`/api` and `/hubs` to the API, so the site and the API share one origin as in production; the demo
accounts and the code come from the API's development tools. Another address: `DEV_PROXY_TARGET`
in `.env.development.local`. In general:

1. Point `DEV_PROXY_TARGET` at `CMarket.Api` for local development, or set `VITE_API_URL` to
   the origin of a deployed API (`https://api.cmarket.example`): the REST API and both hubs are
   served under it, and the images the API names by its own path (`/api/v1/profile-photos/…`) are
   shown from it. `VITE_API_BASE_URL`, `VITE_REALTIME_HUB_URL` and `VITE_CHAT_HUB_URL` replace one
   address each. A malformed `VITE_API_URL` stops the dev server and the build.
2. Have `POST /auth/otp/verify` and `/auth/refresh` set the refresh token as an `HttpOnly`,
   `Secure` cookie on the `/auth` path. The login calls are sent with credentials; an API on
   another origin needs CORS with credentials for this site, and an API on another site
   (another registrable domain) `SameSite=None` on the cookie, with the API's
   `Auth:RefreshCookie:Partitioned` so that Chrome, Edge and Firefox keep it where they block
   third-party cookies; Safari does not, so one domain (`app.` and `api.`) is the way for every
   browser. Without the cookie, a reload, a new tab or the end of the access token logs out.

The development helpers (the demo accounts of the login page, the code filled in, the account
switch, `/_kit`) follow `VITE_DEV_TOOLS`, true in `.env.development` only: `CMarket.Api` serves
their `/_prototype/*` routes in development. To check the front end against it:
`npm run test:api`, then `npm run e2e` (see
[Tests](#tests)); after a change to the API's routes, `npm run api:routes` and `npm run test:run`.
