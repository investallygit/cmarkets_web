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
so every menu and permission of spec section 12 can be previewed.

## Stack (spec section 7)

React 18, strict TypeScript, Vite · TanStack Query (server data) · Zustand (layout, preferences,
selection) · TanStack Table + Virtual · TradingView Lightweight Charts · react-grid-layout ·
`@microsoft/signalr` · Tailwind CSS with the section 8 tokens · i18next (FR / EN) · Vitest,
Testing Library, Playwright. Supporting choices: React Router 7, lucide-react icons,
MSW 3 for the mock back end.

Recharts (allocation, performance) and TipTap (publishing studio) are added with the screens
that use them.

## Architecture

```
src/
  main.tsx    composition root: real back end or mocks
  app/        router, app shell (top bar, command bar, ticker, menu, status bar), navigation
  screens/    one folder per screen; arranges feature panels in a workspace
  features/   business modules: API hooks, state, panels (market, watchlists, news...)
  shared/     no business knowledge: API client and contracts, real-time, UI kit, i18n, formatting
  mocks/      fake back end for the prototype (MSW handlers, sample data, simulated hub)
```

A layer only imports the layers below it: `app -> screens -> features -> shared`. Features
import each other through their `index.ts` only; `mocks/` only sees `shared/`, like a real
server only shares the API contract. ESLint (`no-restricted-imports`) enforces these rules.

### Data flow

- **REST**: `shared/api/client.ts` calls `/api/v1`, with errors as RFC 7807 `ApiError`.
  Each feature wraps its endpoints in TanStack Query hooks (`features/*/api.ts`).
  DTOs live in `shared/api/contracts`; they mirror spec section 10 and will be replaced by the
  client generated from the OpenAPI contract (Orval) once `CMarket.Api` exists.
- **Real time**: `shared/realtime` defines a `RealtimeClient` interface with a SignalR
  implementation (`/hubs/market`) and ref-counted symbol subscriptions. Live quotes go into a
  Zustand store (`features/market/live`), so a tick re-renders one table cell, which flashes
  for 400 ms.
- **Layouts**: each screen declares its panels and default grid; the user's layout is saved
  through `GET/PUT /me/layouts/{screen}`.
- **Permissions**: `/me` returns the user's permissions; the menu, the command bar and the
  routes only offer allowed screens. The server stays the authority.

### Design system

`app/styles/index.css` holds the colour tokens of spec section 8 under their spec names
(`--bg-panel`, `--accent-amber`...) and maps them to Tailwind utilities (`bg-panel`,
`text-accent-amber`, `text-up`...). Tailwind's default palette is removed, so only these colours
exist. Numbers use `shared/lib/format.ts` (`52 500,25` in French, `52,500.25` in English, dates
`DD/MM/YYYY`, Douala time). Icons come from `lucide-react`.

## Connecting the real back end

1. Set `VITE_USE_MOCKS=false` in `.env.local`.
2. Point `DEV_PROXY_TARGET` at `CMarket.Api` for local development, or set `VITE_API_BASE_URL`
   and `VITE_REALTIME_HUB_URL` for a deployed API.

The screens do not change: they only know the API contract.

## Status

| Screen                                                                    | State                                                         |
| ------------------------------------------------------------------------- | ------------------------------------------------------------- |
| App shell: top bar, command bar, ticker, menu by account type, status bar | Done                                                          |
| 1 · Market dashboard (MKT)                                                | Done on mock data, real-time quotes and indices               |
| 2 to 9 and the back-office screens                                        | Placeholders with the mockup layout and the API of each panel |
| Login, OTP, token refresh                                                 | Not started                                                   |
