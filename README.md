# CMarket web (prototype)

Front end of CMarket, built from `CMarket-developer-spec-EN.pdf`. This prototype runs without
a back end: a mock layer answers the REST API and simulates the real-time hub with the sample
data of the mockups.

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

In the prototype, the user badge at the top right switches language (FR / EN) and account type,
so every menu and permission of spec section 12 can be previewed. `/_kit` shows the shared UI
components (form controls, dialogs, toasts, price chart, table export) with sample content. The
mock back end keeps each demo user's watchlists, alerts, saved screens, layouts and chart drawings
in localStorage, sets off their alerts when a price crosses a threshold or a release comes out, and
runs the bond calculator with the formulas of spec section 14.1, tested against its cases A and B.

## Stack (spec section 7)

React 18, strict TypeScript, Vite · TanStack Query (server data) · Zustand (layout, preferences,
selection) · TanStack Table + Virtual · TradingView Lightweight Charts (prices) · Recharts
(comparison bars, yield curves; allocation and performance next) · react-grid-layout ·
`@microsoft/signalr` · Tailwind CSS with the section 8 tokens · i18next (FR / EN) · Vitest,
Testing Library, Playwright. Supporting choices: React Router 7, lucide-react icons,
MSW 3 for the mock back end, write-excel-file for the Excel export of tables.

TipTap (publishing studio) is added with the screen that uses it.

## Architecture

The code follows [Feature-Sliced Design](https://feature-sliced.design) (FSD): six layers, each
split into slices by business domain, each slice into segments (`ui`, `model`, `api`, `lib`,
`config`).

```
src/
  main.tsx    entry point: real back end or mocks
  app/        providers, router, app shell layout, global styles
  pages/      one slice per screen: market-dashboard, security-profile, equity-screener,
              yield-curves (YCRV and YAS), news, market-calendar, alerts, placeholder (screens
              not built yet), status
  widgets/    self-contained blocks: the panels (indices-panel, order-book-panel, news-panel...),
              the security header and the shell bars (top-bar, side-menu, status-bar, ticker-tape)
  features/   user actions: command-bar, security-actions, manage-watchlists, manage-alerts,
              screen-equities, draw-on-chart, compare-securities, switch-language, switch-account,
              workspace-layout
  entities/   business data: session, security, quote (live prices), market, bond, yield-curve,
              fundamentals, screener, document, chart-drawing, watchlist, alert, auction, rate,
              news, calendar-event, notification
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
  polled every 5 seconds.
- **Layouts**: each page declares its panels and default grid (`pages/*/config`);
  `features/workspace-layout` saves the user's layout through `GET/PUT /me/layouts/{screen}`.
- **Permissions**: `/me` returns the user's permissions; `entities/session` decides which
  screens the menu, the command bar and the routes offer. The server stays the authority.

### Design system

`app/styles/index.css` holds the colour tokens of spec section 8 under their spec names
(`--bg-panel`, `--accent-amber`...) and maps them to Tailwind utilities (`bg-panel`,
`text-accent-amber`, `text-up`...). Tailwind's default palette is removed, so only these colours
exist. Numbers use `shared/lib/format.ts` (`52 500,25` in French, `52,500.25` in English, dates
`DD/MM/YYYY`, Douala time), and inputs read them back with `shared/lib/parse.ts`. Icons come from
`lucide-react`.

Screens build on `shared/ui`: `Panel`, `PanelTabs` and `PanelSelect` (options of a title bar),
`ScreenTabs`, `DataTable` (sorting, right-click menu, Excel and CSV export unless the user lacks
`analysis:export`; `exportRef` puts the export links in a title bar), `charts/` (`PriceChart`
with indicator panes, comparison rebased to 100 and drawings; `AreaChart`; `useChartTheme`, the
section 8 colours for Recharts, which draws in SVG), `PdfViewer`, `form/` (buttons, fields, selects, number and date inputs in
the user's format, checkboxes, segmented choices, file drop zone), `Dialog` (also as a side form),
`ConfirmDialog` (with a required reason) and `toast`. Entities add small business components, such
as the security picker of `entities/security`.

## Connecting the real back end

1. Set `VITE_USE_MOCKS=false` in `.env.local`.
2. Point `DEV_PROXY_TARGET` at `CMarket.Api` for local development, or set `VITE_API_BASE_URL`
   and `VITE_REALTIME_HUB_URL` for a deployed API.

The screens do not change: they only know the API contract.

## Status

| Screen                                                                    | State                                                         |
| ------------------------------------------------------------------------- | ------------------------------------------------------------- |
| App shell: top bar, command bar, ticker, menu by account type, status bar | Done                                                          |
| Shared UI kit: form controls, dialogs, toasts, price chart, Excel export  | Done, shown on `/_kit`                                        |
| 1 · Market dashboard (MKT)                                                | Done on mock data, real-time quotes and indices, watchlists   |
| 2 · Security profile (DES, GP, FA, DVD, N, DOC, HDS)                      | Done on mock data; ANA comes with PUB                         |
| 3 · Equity screener and fundamental analysis (EQS, FA)                    | Done on mock data, saved screens                              |
| 4 · Yield curves and bond calculator (YCRV, YAS)                          | Done; the mock computes spec section 14.1                     |
| News (N), market calendar (CAL), alerts (ALRT): no mockup                 | Done on mock data; the mock sets off the alerts               |
| 5 to 9 and the back-office screens                                        | Placeholders with the mockup layout and the API of each panel |
| Login, OTP, token refresh                                                 | Not started                                                   |

The plan for the remaining screens, step by step, is in [ROADMAP.md](ROADMAP.md).
