# Roadmap

Screen-by-screen plan to finish the front end of `CMarket-developer-spec-EN.pdf`.

Screens 1 (MKT) and 2 (DES) are built. The other 22 screens are placeholders: their route, menu
entry, permission and mockup layout exist, with the API each panel will call
(`src/pages/placeholder/config/plans.ts`). Login is not started.

DATA, HIST and EODH are planned with IMP, and ANLY and MOD with USER: in the mockups they are
panels of the same screen. Sizes are relative: S < M < L < XL.

## Order

| Step | Work                                                            | Status |
| ---- | --------------------------------------------------------------- | ------ |
| 1    | Shared groundwork, batch 1: form kit, `PriceChart`, XLSX export | Done   |
| 2    | DES                                                             | Done   |
| 3    | Watchlist editing (MKT), N, CAL, ALRT                           | To do  |
| 4    | EQS / FA, then YCRV / YAS                                       | To do  |
| 5    | PORT                                                            | To do  |
| 6    | PUB, then PUB NEW                                               | To do  |
| 7    | CFG, login and OTP (needed before connecting the real back end) | To do  |
| 8    | Back-office: IMP (with DATA, HIST, EODH), then CORR, then NEWS  | To do  |
| 9    | Admin: USER (with ANLY, MOD), then ADMCFG, AUDT, PAY            | To do  |

If the back end needs the import flow early, step 8 moves right after DES.

## Shared groundwork

Done in step 1, shown on `/_kit` in the prototype:

- **Form kit in `shared/ui`**: buttons, fields, selects, text, number and date inputs (in the
  user's format, amber border when editable), checkboxes, segmented choices, file drop zone,
  dialog and side form, confirmation with a required reason, toasts.
- **`PriceChart`** on Lightweight Charts (candles, bars or line, overlays such as MA20 / MA50,
  volume, amber last price, crosshair values, wheel zoom and drag pan) for DES and the "CMarket
  chart" block of PUB NEW. Moving averages and other indicators come from `/indicators`.
- **XLSX export** next to CSV in every data table, hidden without `analysis:export` (Student).

Done in step 2, with DES:

- **`PriceChart`** gained indicator panes (RSI, MACD), comparison rebased to 100 and drawings.
- **Embedded PDF viewer** (`shared/ui/PdfViewer`): the file is fetched through the API client, so
  the request carries the user's session, then shown by the browser's viewer.
- **Screen tabs** (`shared/ui/ScreenTabs`), one route per tab.

Still to do, with the first screen that needs it:

- **Recharts**, named by the spec for allocation and performance; it also draws the yield curves
  (log maturity axis) and the EQS comparison bars. PNG and PDF export of charts (spec section 3).
- **Pagination**: the `{ items, page, pageSize, totalCount }` convention and a pager (PUB, USER,
  HIST, AUDT).
- **Subscription gating** (Monitoring, Analysis, Portfolio, free trial): `/me` does not return the
  modules yet, so the contract needs them; a locked screen offers an upgrade instead of a 403.

## Done for every screen

- DTOs in `shared/api/contracts`, mock handlers and sample data from the mockup.
- A `pages/<screen>` slice, registered in `app/routes/pages.ts` and removed from `SCREEN_PLANS`.
- French and English strings; actions hidden or locked by permission and quota.
- Tables: sorting, right-click menu, export. Layout saved per user, one column below 1280 px.
- Vitest for the logic and one Playwright flow; README status updated.

## Client screens

### MKT · Market dashboard (remaining: S)

- Watchlist editing: create, rename and delete a list, choose its columns, add and remove
  securities (`POST / PUT / DELETE /watchlists...`). This enables the "Add to a list" right-click
  entry, disabled today.
- A click on a news item opens the N screen, not the article yet: done with N.

### DES · Security profile (screen 2): done

- **Built**: header (last price at 26 px, change, 7 key figures, delayed tag for Students) and
  the tabs DES, GP, DVD, N, DOC, HDS, each with its own saved layout (`DES`, `DES-GP`...). DES
  follows the mockup: price chart, order book with depth bars, latest trades, key data,
  dividends, documents and news. GP adds 1D to 10Y, candles / bars / line, Bollinger bands, RSI
  and MACD panes, comparison with securities and indices rebased to 100, and trend lines and
  levels saved per user. A bond gets its terms and redemption schedule instead of the key data
  and dividends, and no FA, DVD or HDS tab.
- **Still to do**: the FA tab comes with EQS (step 4), the ANA tab with PUB (step 6). PNG and PDF
  export of the chart stays in the shared groundwork.

### N · News (no mockup): M

- The list and article panels exist (`widgets/news-list-panel`, `news-article-panel`, built for
  the N tab of DES): the screen adds the filters and the documents tab.
- News list on the left, filtered by security, country and topic; the full article on the right
  (`/news/{id}`).
- Documents tab: full-text search (`/documents?q=`) and the embedded PDF viewer.
- New items arrive in real time through `NewsPublished`, already handled.

### CAL · Market calendar (no mockup): S-M

- Day or week view of sessions, auctions, ex-dividend dates, bond maturities, general meetings
  and earnings releases, filtered by type and country; a click opens the security (DES).
- Reuses the `calendar-event` entity and the auctions panel of YCRV.

### ALRT · Alerts (no mockup): M

- Alert list (condition, push / e-mail / SMS channels, on / off), create and edit form, history of
  triggered alerts (`/notifications`).
- The 6 alert types of spec section 5; quota by account type (10, 50, 100, unlimited) from
  `/me` quotas.
- Enables the "Create an alert" right-click entry, with the security filled in.

### EQS / FA · Equity screener and fundamental analysis (screen 3): L

- **UI**: criteria panel (9 criteria, active ones with an amber border, "+ Add a criterion",
  Run / Reset, saved screens, SAVE); results (sortable, configurable columns, XLSX / CSV; click =
  lower panels, double-click = DES); comparison (horizontal bars, the selected security in amber,
  the sector average as a dashed line; tabs P/E, Yield, ROE, Margin); financial statements (5
  years and CAGR; tabs Income, Balance, Cash flow).
- **Data**: `POST /analysis/screener`, `/analysis/screens`, `/analysis/compare`, `/ratios`,
  `/financials`. The mock needs 2021-2025 statements for the BVMAC equities.
- **Watch for**: the page holds the selected security, like the index selection of MKT. CAGR and
  sector averages come from the server (spec section 14). The comparison and statement panels are
  reused by the FA tab of DES.

### YCRV / YAS · Yield curves and bond calculator (screen 4): L

- **UI**: curves of the 6 CEMAC countries (log axis 3M to 10Y, dashed comparison with a past date,
  click a legend item to hide a country); bond calculator (amber inputs: settlement date, clean
  price or yield, face amount; results: yield to maturity, accrued interest, dirty price,
  settlement amount, average life, durations, spread vs the curve); BEAC auctions (cover ratio
  green above 1, red below).
- **Data**: `/yield-curves`, `/bonds`, `/bonds/{id}`, `POST /bonds/{id}/calculate`, `/auctions`.
- **Watch for**: recalculation under 300 ms (debounce, cancel stale requests). The mock should
  implement the section 14.1 formulas and test them against cases A and B: the mockup values
  differ, and the spec makes the test cases authoritative. US and European curves are in the spec
  but not in the mockup.

### PORT · Portfolio (screen 5): XL

- **UI**: header (portfolio selector, 7 metrics, "New transaction" opens a side form); 6 tabs
  Positions, Transactions, Performance, Risk, Income, Reports. The Positions tab has the 5 panels
  of the mockup; a weight above its limit shows in yellow with ▲, a breached risk limit in red
  with the limit below.
- **Functions**: create, edit and delete portfolios (currency, benchmark, limits); 9 transaction
  types; Excel / CSV import from a template; PDF report as an async job (`POST .../reports`, then
  poll `/reports/{jobId}`); model portfolios (the only type for Students, 3 at most).
- **Data**: the whole `/portfolios/*` group.
- **Watch for**: TWR and risk metrics (spec sections 14.2 and 14.3) come from the server, with
  "insufficient data" below 60 observations. To decide: when prices tick in real time, do Value
  and Unrealized follow? If so, the front end multiplies.

### PUB · Research library (screen 8): L

- **UI**: filter bar (subject, country, sector, access, rating, sort, search); list with tabs All
  / Purchased / Followed analysts; preview (before purchase: summary, locked contents, rating,
  price, Mobile money or Card, buy button; after purchase: full content, watermarked with the
  buyer's name); analyst panel with Follow.
- **Data**: `/library`, `/library/{id}`, `/purchase`, `/payments/{id}` (polled until confirmed),
  `/me/purchases`, `/pdf`, `/rating`, `/report`, `/analysts/{id}`, `/follow`.
- **Watch for**: the publication list is shared with the ANA tab of DES and the country page.
  Students pay the student price; Data admins and Admins only read free research.

### PUB NEW · Publishing studio (screen 7): XL

- **UI**: my publications (status badge, price), my earnings, editor (Company / Country, title,
  summary, TipTap with a "CMarket chart" block frozen at insertion), settings (Free / Paid, price
  within the Admin's range, student price, free after a delay, Buy / Hold / Sell or a country
  outlook, target, horizon, mandatory disclosures, attachment).
- **Rules**: autosave every 10 s; Submit only once every disclosure is ticked; a publication read
  for free never becomes paid; versions and archiving (`/versions`, `/archive`); concurrent edits
  detected (rowversion).
- **Depends on**: TipTap; "Reader preview" uses the PUB reader and the chart block uses
  `PriceChart`. An Analyst not yet approved only sees a waiting message.

### CFG · Settings (no mockup): M

- Profile (language, time zone: `GET / PUT /me`), organisation (members, invite, remove),
  subscription (plans, payment by card, mobile money or transfer), PDF invoices.

### Login, OTP, sign-up, password reset: M

- Not in `SCREENS`: outside the app shell, in the brand navy and green colours (spec section 8).
- Access token 15 min, refresh token 7 days: `shared/api/client.ts` refreshes on a 401. Automatic
  logout after inactivity; a logout entry in the user menu.
- Sign-up with the account type (Student needs a school e-mail or proof of enrolment, Analyst
  waits for an Admin's approval). The prototype account switch goes away with the real back end.

## Back-office

### IMP · Data import (screen 6): XL, with DATA, HIST, EODH (S each)

- **UI**: session coverage, EODHD connector, current upload (Upload → Format → Business checks →
  Preview → Publish, counters, rows with a Check column), upload history (Roll back with a
  reason). DATA, HIST and EODH are full-screen versions of these panels, with more filters.
- **Rules**: Publish stays disabled while an error remains or an alert is not ticked "checked".
  The checks report progress through `ImportStatusChanged`.
- **Mock**: a stateful pipeline that reads the `;` CSV templates and runs the business checks
  (unknown security, duplicate, date outside a session, change above ±15%, zero volume with a
  changed price).

### CORR · Data corrections (no mockup): S

- Pick a security and a date, see the stored OHLCV, edit it with a required reason
  (`PUT /data/securities/{id}/prices/{date}`).

### NEWS · News and documents (no mockup): M

- Form to publish news or a document (headline, text, PDF, related securities), list of published
  items, edit (`/data/news`, `/data/documents`).

### USER · Account administration (screen 9): L, with ANLY, MOD (S each)

- **UI**: 6 counters by account type (each type's colour reused across the screen); accounts
  (search, filters, server pagination, create, including Data admin and Admin with mandatory
  two-factor, CSV export); account details (Change type, Reset two-factor, View audit log → AUDT,
  Suspend with a reason and a confirmation); Analyst status requests (documents, Approve or Reject
  with a reason); moderation queue (Open, Approve, Take down).
- **Depends on**: ANLY and MOD are full-screen versions of the two lower panels; "Open" uses the
  PUB reader.

### ADMCFG · Platform settings (no mockup): M

- Quotas by account type, price range, commission, moderation mode (before or after publication),
  risk-free rate (spec section 14.3).
- Permission matrix: permissions as rows, account types as columns
  (`/admin/roles/{role}/permissions`).

### AUDT · Audit log (no mockup): S-M

- Paginated table (when, who, action, target, before / after), filtered by user, action and date;
  opened from USER with the user filled in.

### PAY · Analyst payouts (no mockup): S

- Payouts by analyst and month (sales, commission, net payable, status), "Mark paid" with a
  confirmation.

## Open questions for the spec author

- **Country page**: mentioned (`/macro?country=`, research on a country) but without a mockup,
  route or function code.
- **Admin**: section 6 lists statistics and the management of organisations, plans, trials and
  invoices, with no API or screen.
- **IMP**: the Discard and Replace file buttons have no endpoint; where is the "Alert checked"
  tick stored (a PATCH of the row?).
- **USER**: no endpoint returns the counters by account type.
- **Real time**: no event for the order book and latest trades; the prototype polls them every
  5 seconds.
- **Quote**: the security header shows the session's open, high and low, which the example of
  `GET /securities/{id}/quote` lacks; the prototype adds them to the response.
- **Subscriptions**: `/me` returns neither the subscribed modules nor the trial status.
- **In the spec, not in the mockups**: the bond profile, US and European curves,
  `/global/indices` and `/commodities` on MKT.
- **Calendar**: the Data admin "manages the calendar", but no API writes it.
