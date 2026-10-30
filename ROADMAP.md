# Roadmap

Screen-by-screen plan to finish the front end of `CMarket-developer-spec-EN.pdf`.

MKT, DES (with its FA tab), EQS, YCRV, YAS, N, CAL and ALRT are built. The other 16 screens are
placeholders: their route, menu entry, permission and mockup layout exist, with the API each panel
will call (`src/pages/placeholder/config/plans.ts`). Login is not started.

DATA, HIST and EODH are planned with IMP, and ANLY and MOD with USER: in the mockups they are
panels of the same screen. Sizes are relative: S < M < L < XL.

## Order

| Step | Work                                                            | Status |
| ---- | --------------------------------------------------------------- | ------ |
| 1    | Shared groundwork, batch 1: form kit, `PriceChart`, XLSX export | Done   |
| 2    | DES                                                             | Done   |
| 3    | Watchlist editing (MKT), N, CAL, ALRT                           | Done   |
| 4    | EQS / FA, then YCRV / YAS                                       | Done   |
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

Done in step 3, with the monitoring screens:

- **Security picker** (`entities/security`): code or name, suggestions from `/search`, arrow keys
  and Enter. Used by "+ Add" in a watchlist, the news filter and the alert form.
- **Forms opened from anywhere**: the right-click menu of any security opens the list and alert
  forms. Each entity holds a small store saying what to open (`openWatchlistDialog`,
  `openAlertDialog`), the feature holds the form, and the app shell mounts it once.
- **Dialogs** are rendered in `<body>`: a dialog opened from a panel title bar no longer inherits
  its upper-case text or sits inside its drag handle.
- **`PanelSelect`** for choices in a panel title bar ("ALL COUNTRIES"), **`useSearchParamsUpdate`**
  for filters kept in the URL, the CEMAC country list with the short names of the mockups.
- **BEAC auctions panel** (`widgets/auctions-panel`), shown by CAL and YCRV.

Done in step 4, with the analysis screens:

- **Recharts** for the EQS comparison bars and the yield curves (log maturity axis), with
  `useChartTheme` giving it the section 8 colours. Allocation and performance (PORT) come next.
- **Export links in a title bar** ("EXPORT XLSX · CSV" of the screen 3 mockup): `DataTable` hands
  its export through `exportRef`, so the rows go out as sorted.
- **`GET /securities`** (`useSecurities`): the equities of a market, for a peer group or the
  choices of a filter. `useDebouncedValue`, `addMonths`, and a unit after a change (`+0.3 pt`).

Still to do, with the first screen that needs it:

- **PNG and PDF export of charts** (spec section 3), for the price chart, the comparison bars and
  the curves alike.
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

### MKT · Market dashboard (screen 1): done

- **Built in step 3**: watchlist editing. "…" creates a list, changes its name and columns (name,
  last, change, change %, volume, 5-day chart) or deletes it; "+ Add" adds securities; the
  right-click menu of a row removes it. "Add to a list" in the right-click menu of any security
  ticks the lists that hold it and offers "New list…". A click on a news item opens the article
  on the N screen; a double-click on a calendar event opens the security.
- **Still to do**: sharing a list with colleagues of the same organisation (spec section 6) has no
  API yet.

### DES · Security profile (screen 2): done

- **Built**: header (last price at 26 px, change, 7 key figures, delayed tag for Students) and
  the tabs DES, GP, DVD, N, DOC, HDS, each with its own saved layout (`DES`, `DES-GP`...). DES
  follows the mockup: price chart, order book with depth bars, latest trades, key data,
  dividends, documents and news. GP adds 1D to 10Y, candles / bars / line, Bollinger bands, RSI
  and MACD panes, comparison with securities and indices rebased to 100, and trend lines and
  levels saved per user. A bond gets its terms and redemption schedule instead of the key data
  and dividends, and no FA, DVD or HDS tab.
- **Built in step 4**: the FA tab, with the panels of EQS (see below).
- **Still to do**: the ANA tab comes with PUB (step 6). PNG and PDF export of the chart stays in
  the shared groundwork.

### N · News (no mockup): done

- **Built**: two tabs, `/n` and `/n/documents`, each with its saved layout (`N`, `N-DOC`). News on
  the left, filtered by security, country and topic, the article on the right with links to the
  securities concerned; new items arrive through `NewsPublished`. Documents: full-text search
  (`/documents?q=`), type filter and the embedded PDF viewer. Filters and the open item are in
  the URL, so `/n?article=news-1` opens an article.
- **Still to do**: the list shows the 50 newest items; "load more" comes with the pagination of
  the shared groundwork.

### CAL · Market calendar (no mockup): done

- **Built**: week (Monday to Sunday, today in amber, weekends without a session) or day view
  (a table that sorts and exports) of sessions, auctions, ex-dividend dates, bond redemptions,
  general meetings and earnings releases, filtered by type and country; an event on a security
  opens its profile. Below, the latest BEAC auctions of the screen 4 mockup, cover ratio in green
  above 1 and red below. The view, the day and the filters are in the URL.
- **Mock**: holidays at fixed dates close BVMAC, redemptions come from the bond schedules, held
  auctions from the auction results.

### ALRT · Alerts (no mockup): done

- **Built**: the alert list (on / off, type, subject, condition, channels, last time it went off;
  edit, turn off and delete from the right-click menu), the form for the 6 types of spec
  section 5 with push, e-mail and SMS, and the history of triggered alerts (`/notifications`): a
  click marks it read and points at its alert. The quota of the account type (10, 50, 100,
  unlimited) comes from `/me`. "Create an alert" in the right-click menu of any security opens the
  form with the security filled in and its last price as a hint.
- **Mock**: the fake server sets off the user's alerts as a server would: price and volume alerts
  when a trade crosses their threshold (once a session), release and auction alerts when the news
  arrives.
- **Still to do**: choosing one portfolio for a limit alert comes with PORT (step 5), following
  analysts with PUB (step 6), the phone number and e-mail address for SMS and e-mail with CFG
  (step 7).

### EQS / FA · Equity screener and fundamental analysis (screen 3): done

- **Built**: criteria of the mockup (market, country, sector, then ranges "at least", "at most"
  or "between" for market cap, P/E, dividend yield, ROE, net debt / equity and 1-year change),
  amber while they filter; "+ Add a criterion" adds price-to-book, net margin, revenue growth and
  beta. Run, Reset (and run), "Criteria changed" until the next run; saved screens (High yield,
  Banks) load and run with a click, SAVE names the criteria, × deletes one. Results: "5 of 7
  securities", sortable, columns chosen in COLUMNS (kept in the browser), day change in real time,
  XLSX / CSV in the title bar and the right-click menu; a click feeds the lower panels, a
  double-click opens DES. Comparison: P/E, yield, ROE, margin bars, the selected security in amber
  first, its sector average dashed in yellow; a click on a bar selects it. Statements: income,
  balance sheet, cash flow over 2021-2025 with the CAGR (or the change in points for a
  percentage), and the balance sheet and cash flow key lines below. The criteria, the results and
  the selection survive a visit to DES.
- **FA tab of DES**: the same comparison against the other equities of the market, its sector
  first, the ratios next to the sector average, the statements and the price chart. Recharts loads
  with the tab, not with every profile.
- **Mock**: 2021-2025 accounts of the seven BVMAC equities, built so the screen 3 mockup's ratios
  come back at the mockup prices (SEMC grows as in the mockup); ratios follow the live price; the
  sector averages are a table, Beverages at the mockup's 6.3%.
- **Still to do**: the "ANNUAL" switch of the mockup: the statements file has half-years, the API
  no period parameter.

### YCRV / YAS · Yield curves and bond calculator (screen 4): done

- **Built**: the curves of the six CEMAC countries in the mockup's colours on a log axis from 3M
  to 10Y; a click on a legend item hides a country; "COMPARE TO" draws the curve of the
  calculator's bond country 1 week to 1 year earlier, dashed; the tooltip marks auction points.
  Calculator: settlement date (two business days after today, as in the mockup), clean price or
  yield (the figure typed last drives, the other follows), face amount, all amber; then the
  outstanding principal, accrued interest, dirty price, settlement amount, average life, Macaulay
  and modified durations, convexity, DV01 and the spread over the issuer's curve. The figures come
  back about 150 ms after typing stops (120 ms pause, a stale request is cancelled). `/ycrv` opens
  the first bond, `ECMR 6.25 2029 YAS` that bond; picking another goes to `/yas/{id}`. The BEAC
  auctions below.
- **Mock**: the section 14.1 formulas, tested against cases A and B to four decimals, with
  Newton-Raphson then bisection for the yield; curves from a weekly curve file and the auctions of
  the last 90 days (BTA rates converted, 4.95% on 182 days giving 5.0819%); earlier dates 0.15
  point lower a month back.
- **Still to do**: US and European curves (in the spec, not in the mockup); bond quotes on the
  CEMAC curves (left out by the mock).

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
- **Calendar**: the Data admin "manages the calendar", but no API writes it. The prototype adds a
  `country` filter to `/calendar` and accepts several `type` values; `/auctions` gets an
  `instrument` filter.
- **Watchlists**: the request bodies are not specified. The prototype sends `{ name, columns }`,
  with the first securities of a new list, and `POST .../items/{securityId}` returns the item.
  Sharing a list with colleagues (spec section 6) has no endpoint.
- **Alerts**: does the quota count alerts that are off (the prototype counts every alert)? Does a
  price alert go off at each crossing, or once (the prototype: once a session)? The notification
  text should be written in the user's language.
- **Screener**: the request and response bodies are not specified. The prototype sends
  `{ criteria: [{ field, values } | { field, min, max }] }` (bounds included) and gets
  `{ universe, items }`; saved screens are `{ name, criteria }`. No endpoint lists the sectors (the
  prototype reads them from `/securities`); section 10 filters on sector codes (`sector=BANK`) but
  the profile returns names, in English in both languages. The columns chosen have no endpoint.
- **Fundamentals**: over which equities is a sector average computed (the prototype uses a fixed
  table)? The line items of the "Financial statements" file need agreed codes (the prototype:
  `revenue`, `ebitda`, `operatingIncome`...).
- **Bond calculator**: the body is `{ settlementDate, faceAmount, cleanPrice | yieldPct }` in the
  prototype, with a 400 for a date before the issue or after the last payment and a 422 when no
  yield fits. Which settlement lag (the mockup shows two business days) and which curve date for
  the spread (the prototype: the settlement date, today at the latest)? "No extrapolation beyond
  the first and last points (shown dashed)": the prototype draws nothing outside the points and
  gives no spread there. `/yield-curves` without a country returns all six. Validation messages
  should come in the user's language.
