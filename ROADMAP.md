# Roadmap

Screen-by-screen plan to finish the front end of `CMarket-developer-spec-EN.pdf`.

Every screen is built: the client terminal (MKT, DES with its FA and ANA tabs, EQS, YCRV, YAS,
PORT, PUB, PUB NEW, N, CAL, ALRT and CFG) with the login, sign-up and password reset pages, the
back-office of the Data admin (IMP with DATA, HIST and EODH, then CORR and NEWS) and that of the
Admin (USER with ANLY and MOD, then ADMCFG, AUDT and PAY), and the home page that visitors see
before login. What remains is listed under "Still to do" and in the open questions for the spec
author.

ANLY and MOD were built with USER: in the mockups they are panels of the same screen. Sizes are
relative: S < M < L < XL.

## Order

| Step | Work                                                            | Status |
| ---- | --------------------------------------------------------------- | ------ |
| 1    | Shared groundwork, batch 1: form kit, `PriceChart`, XLSX export | Done   |
| 2    | DES                                                             | Done   |
| 3    | Watchlist editing (MKT), N, CAL, ALRT                           | Done   |
| 4    | EQS / FA, then YCRV / YAS                                       | Done   |
| 5    | PORT                                                            | Done   |
| 6    | PUB, then PUB NEW                                               | Done   |
| 7    | CFG, login and OTP (needed before connecting the real back end) | Done   |
| 8    | Back-office: IMP (with DATA, HIST, EODH), then CORR, then NEWS  | Done   |
| 9    | Admin: USER (with ANLY, MOD), then ADMCFG, AUDT, PAY            | Done   |
| 10   | Home page, before login: the product, markets, users, plans     | Done   |

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
  `useChartTheme` giving it the section 8 colours.
- **Export links in a title bar** ("EXPORT XLSX · CSV" of the screen 3 mockup): `DataTable` hands
  its export through `exportRef`, so the rows go out as sorted.
- **`GET /securities`** (`useSecurities`): the equities of a market, for a peer group or the
  choices of a filter. `useDebouncedValue`, `addMonths`, and a unit after a change (`+0.3 pt`).

Done in step 5, with PORT:

- **Chart palette**: section 8 has none, so `--chart-1` to `--chart-8` colour series that only
  carry identity (allocation by sector or country), in a fixed order; they pass the lightness,
  colour-blind separation and 3:1 contrast checks on the panel background. Ordered classes (bond
  maturities) take a one-hue ramp, `--chart-ordinal-1` to `-5`. Both come with `useChartTheme`.
- **Uploads and jobs**: `apiClient.postForm` sends a multipart form (an import file, a logo); a
  job is asked for its progress until it is done (`useReportJob`), then its file is fetched with
  the session (`useReportFile`, `saveBlob`).
- **Live values**: `useLivePrices` follows several securities at once; `DataTable` takes a
  `footer` row outside the sorting (the cash of a portfolio); `useMarketDay` gives today in Douala
  without reading the clock during render.
- **Mock**: the daily history of the BVMAC and CMarket indices is chained from their members'
  closes, so an index and its securities move together; `read-excel-file` reads Excel uploads;
  MSW builds into a chunk of its own.

Done in step 6, with PUB and PUB NEW:

- **Pagination**: `Pager` under a list of `{ items, page, pageSize, totalCount }`, the page kept in
  the URL. USER, HIST and AUDT will use it.
- **Rich text**: TipTap for the studio, loaded with that screen only. The library draws the same
  JSON without the editor (`PublicationBody`) and follows safe links and images only; both share
  the `publication-text` styles, so the reader preview is what readers get. `shared/lib/richText`
  gives the contents, the page count and the text of a PDF to the front end and the mock alike.
- **Forms and charts**: one segment of `SegmentedControl` can be disabled (Paid once read for
  free); `AreaChart` takes a colour and a fixed mode for a chart inside a document;
  `format.month`.
- **Mock**: `sharedStore` keeps what every account sees (publications, analysts) next to each
  user's own data; the PDF writer prints a watermark.

Done in step 7, with CFG and the login pages:

- **Session**: `shared/api/session.ts` keeps the access token in memory and renews it with the
  refresh cookie (`POST /auth/refresh`) at start-up, before it expires and after a 401, once for
  all the requests waiting; a refused renewal ends the session. The app shell needs a session
  (`RequireSession`), the login page brings the user back to `?next=`, and the hub connects with
  the session (SignalR takes the token). The tabs of a browser log in and out together; 30 minutes
  without an action in any tab log the user out after a one-minute warning
  (`shared/lib/activity`). Logging in or out empties the query cache.
- **Subscription gating**: `/me` returns the modules of the user's plan (`modules`, and
  `trialEndsAt` while the free trial runs); each screen names its module (Monitoring: MKT, DES, N,
  CAL, ALRT; Analysis: EQS, YCRV, YAS and the FA tab; Portfolio: PORT); a screen outside the plan
  shows a lock in the menu and offers the plans instead of its content (`ModuleLocked`). The mock
  refuses the analysis and portfolio data the same way.
- **User time zone**: `useFormat` shows dates and times in the profile's time zone; a calendar
  day keeps its date in every zone; the session clock stays in Douala time.
- **Forms and payments**: `PasswordInput`, a brand-green button for the login pages,
  `shared/lib/billing` (VAT on a price per user, VAT inside a price) and `shared/lib/phone`. The
  mock's payments (`mocks/payments.ts`) serve research and plans alike; a confirmed purchase of
  research also issues its receipt.
- **Tests**: a Playwright `setup` project logs in once through the login page; the other tests
  start from that session.

Done in step 8, with the back-office of the Data admin:

- **Uploads**: `entities/data-import` holds the file types and their templates (CSV or Excel,
  downloaded with the session), the coverage of a session, the uploads and their rows. An upload
  is asked again every second while its checks run, should `ImportStatusChanged` not come; the
  reasons of the checks come as a code and figures, and the screen words them in the user's
  language. `DataPublished` refreshes the quotes, histories, indices, auctions and curves.
- **Forms and API**: `apiClient.putForm` (a document replaced with its PDF); `ConfirmDialog` with a
  required reason for the rollback; the security picker as a list of chips in the NEWS form.
- **Mock**: `mocks/lib/dataImport.ts` reads a file against its template and runs the checks of
  spec section 11 (tested); `mocks/imports.ts` keeps the uploads, puts the published rows and the
  corrections in place of the generated prices (`setStoredSessions` in `lib/bars`) and index
  closes, adds the auctions, curve points and dividends, and takes them out again on a rollback;
  `mocks/content.ts` keeps the news and documents entered. The CSV reader of the transaction
  import became `lib/templateFile`.

Done in step 9, with the back-office of the Admin:

- **Server sorting**: `DataTable` takes `sorting` and `onSortingChange` for a list the server
  sorts and pages (`?sort=-lastLoginAt`, spec section 10); the rows keep the order they come in.
- **Admin's data**: the query keys of the Admin's screens start with `admin`
  (`shared/api/adminData.ts`); an action refreshes them all, without waiting, so a toast still
  shows when the refreshed list removes the row that asked for it. The labels of the permissions
  are in `shared/config/permissions.ts`, for the matrix and the audit log alike.
- **No placeholder left**: every screen has its page, so `pages/placeholder` and its plans are
  gone and `app/routes/pages.ts` lists all of them.
- **Mock**: `mocks/admin.ts` lists the stored accounts with the 1,937 generated ones of
  `fixtures/population.ts`, so the counters show the screen 9 mockup (a generated account is
  copied into the stored ones when an Admin changes it; it cannot log in). The settings and the
  role -> permission table are stores that `/me`, `GET /publications/rules` and the portfolio
  engine read. `recordAudit` writes every action of a Data admin or an Admin (publish, rollback,
  discard, correction, news, document, then the Admin's), and the seeded uploads write theirs.
  Payouts are due until marked paid; reports have a status. The data kept in localStorage is
  dropped when `SEED_VERSION` changes, which ends the prototype's session once.

Done in step 10, with the home page:

- **Routes**: `/` is the home page, open without a session like the login pages; `/app` sends a
  user to the home screen of the account type (MKT, IMP or USER), and the login, the sign-up, the
  account switch, the logo of the top bar and "Back to home" go there. `signUpPath` opens the
  sign-up with an account type chosen (`/signup?type=analyst`).
- **UI**: `ButtonLink` (a link drawn as a button, `brand` or `outline`) and the `xl` size of
  `Button`; `LanguageSwitch` (FR / EN before login) for the home and login pages; `Logo` takes the
  page it leads to; the type sizes `text-lead`, `text-headline` and `text-display`, for the home
  page only.
- **Plans before login**: `usePublicPlans` asks `GET /subscription/plans` without the session; the
  mock answers every plan to a call without a token, and an account the plans of its type.
- **Motion**: `useInView` (`shared/lib`); the `rise`, `fade-in`, `draw`, `ticker`, `blink`,
  `drift`, `grid`, `lines`, `glow` and `parallax` animations, the `.reveal` class (blocks that
  come in once their section is seen) and the backdrop's `.home-grid`, `.home-glow` and photo
  shades in `app/styles`, all off under `prefers-reduced-motion`. `parallax` is driven by the
  scroll (`animation-timeline: view()`); a browser without it keeps the photos still.
  `ButtonLink` nudges its arrow on hover.
- **Photos**: seven photos from Pexels (free to use, credit not required; "Photos: Pexels" in the
  footer), cropped and saved as WebP at two widths in `pages/home/assets/photos`, about 790 kB in
  all: a city at night, Douala at sunset, a coastal city at dusk, and one for each client account
  type. `pages/home/config/photos.ts` gives the number and the photographer of each. They are
  decoration (`alt=""`), with no identifiable person, so none suggests a user's endorsement.
- **Translation by the browser**: Chrome's (and Cốc Cốc's) swaps text nodes for its own, so React
  updated nodes that were no longer on screen and threw on removing one ("Failed to execute
  'removeChild' on 'Node'") on the home page, MKT, PORT and YCRV. The terminal now turns it off
  while it is open, dialogs included (`useNoBrowserTranslation`, `shared/lib`): its live figures
  would otherwise freeze without a sign, and it speaks French and English itself. The home and
  login pages can still be translated; the picture of the terminal is `translate="no"`, and a
  text that changes stands alone in its element, which React rewrites whole. A Playwright flow
  translates the home page and waits for the command bar to type its next command.
- **Accessibility (WCAG 2.2 AA)**: axe-core finds nothing on any screen, tab or account type.
  - Contrast: on the selected background, secondary text and falling figures take
    `--text-secondary-selected` and `--down-selected` (4.7:1; the section 8 colours give 3.4:1
    and 3.5:1 there).
  - Targets of 24 px (2.5.8): panel and dialog title bars and the pager are 25 px (`h-bar`), so
    their buttons, the options of `PanelTabs` and the sort buttons of `DataTable` reach 24 px,
    while table rows keep their 22 px. A row has no button of its own any more: PAY's "Mark
    paid" and CFG's invoice PDF act on the selected row from the title bar (also by double click,
    Enter or the right-click menu).
  - Keyboard: a `DataTable` takes the focus, the arrows move from row to row as a click would and
    Enter opens a row as a double click; a box that scrolls with nothing to focus in it takes the
    focus itself (`ScrollArea`, `useKeyboardScrolling`), a panel's body included.
  - Links inside a sentence are underlined; the sign-up form's pairs of fields stack on a phone.
- **Mock session**: a logout no longer takes the user away from the requests already let through
  by the auth gate (`setRequestUser`, `endSession`): they were failing with 500 while they waited
  for their latency.

Still to do, with the first screen that needs it:

- **PNG and PDF export of charts** (spec section 3), for the price chart, the comparison bars and
  the curves alike.

## Done for every screen

- DTOs in `shared/api/contracts`, mock handlers and sample data from the mockup.
- A `pages/<screen>` slice, registered in `app/routes/pages.ts`.
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
- **Built in step 6**: the ANA tab, with the list, the preview and the analyst of PUB.
- **Still to do**: PNG and PDF export of the chart stays in the shared groundwork.

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
- **Built in step 5**: a portfolio limit alert watches one portfolio or all of them, and goes off
  when a transaction or a limit change breaches a limit.
- **Built in step 7**: SMS go to the mobile phone of the profile (CFG): without one, the SMS
  channel is off and the form says where to add it; e-mail goes to the login address.
- **Still to do**: setting off the publication alerts (a followed analyst, a security or a country)
  when a publication goes out: the analysts are followed from PUB since step 6.

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

### PORT · Portfolio (screen 5): done

- **Built**: header with the portfolio selector (new, settings, delete) and the 7 metrics of the
  mockup. Six tabs, one route each (`/port/{id}`, `/port/{id}/risk`...), each with its saved
  layout. Positions has the 5 panels of the mockup: the lines (a weight above the limit on one
  issuer in yellow with ▲, cash last, Excel / CSV export, IMPORT CSV), performance against the
  benchmark, allocation by sector, country or asset class, risk metrics (a breached limit in red
  with the limit below) and upcoming income with "Generate portfolio PDF report". Transactions:
  the history with the gain each sale realized; a right-click corrects or deletes one. Performance:
  portfolio in amber, benchmark in grey, base 100, YTD to inception, with TWR, annualized return,
  IRR and the returns by period. Risk: every metric of spec section 14.3 ("insufficient data"
  below 60 returns), the limits and their status, issuer concentration, the bonds by maturity.
  Income: upcoming and received. Reports: period, sections, comments and logo; the job is followed
  until the PDF shows. "New transaction" opens the side form for the 9 types, with the cash a share
  trade takes; "Buy" and "Sell" on a line fill it in. Import from the CSV or Excel template: all
  rows or none, errors listed by line. Model portfolios simulate an allocation (amount, start
  date, weights): the only kind a Student holds. The quota of the account type (3, 5, unlimited)
  comes from `/me`; PDF reports need the Portfolio manager account.
- **Real time**: value, unrealized gain, weights, day change and the year-to-date returns follow
  live prices: each line comes with its value per point of price and its accrued interest, and
  today's live return is chained onto the server's year to date.
- **Mock**: replays the transactions at each session's closing price, bonds on their principal
  outstanding with accrued interest (spec section 14.2); average cost, realized gains, TWR and the
  risk metrics follow sections 14.2 and 14.3 and are tested against their cases. The sample fund
  ends with the mockup's lines, bought in two tranches, with deposits, a withdrawal, custody fees
  and the dividends, coupons and redemption it received. A breach after a transaction or a limit
  change sets off the portfolio alerts.
- **Still to do**: sharing a portfolio with colleagues (spec section 6) has no endpoint; the mock
  leaves the logo out of the PDF; a portfolio in EUR holds XAF securities at the peg, no floating
  currency.

### PUB · Research library (screen 8): done

- **Built**: filter bar (subject, country, sector, access, rating, sort, free text) kept in the
  URL; the list with its tabs All / Purchased / Followed analysts, 20 a page: price in amber or FREE
  in green, title, subject, analyst, coloured rating, date, readers' score, Read or Bought. The
  preview: summary, locked contents, rating with the upside from the reference price, price (the
  student price for a Student), Mobile money or Card. The payment is followed until the operator
  confirms, with its dialog closed or not; the full content then replaces the preview with the
  buyer's name as a watermark, the disclosures, the watermarked PDF, the attachment, a 1 to 5 rating
  and "Report content". The analyst: Follow, the four figures of the mockup and each Buy / Hold /
  Sell against the price 12 months later. The same list and preview make the ANA tab of a security
  (a bond shows the research on its country).
- **Rules**: Data admins and Admins cannot buy (the server refuses, the preview says why); an
  author reads without buying or rating; a free publication read once cannot become paid; a
  withdrawn one stays readable by its buyers only.
- **Mock**: 128 publications by five analysts, the first eight those of the mockup. K. Atangana's
  profile gives the mockup's 42 publications, 4.4 / 5, 412 followers and 68% of ratings
  confirmed, worked out from the price history. Mobile money confirms after about 3 seconds; a
  number ending in 0000 is declined. Reads, sales and ratings are counted by month for screen 7.
- **Still to do**: the country page (open question); notifying the followers of an analyst or a
  subject (the hub sends `PublicationPublished`, alerts of type "publication" are not set off
  yet); card payment through the provider's page (3-D Secure) and its return. Employees read free
  research through the moderation queue (MOD, step 9): the library is a client screen.

### PUB NEW · Publishing studio (screen 7): done

- **Built**: my publications (status badge, access, "Update draft" when a published one has changes
  not out yet) with + New on a company or a country; my earnings for a month (reads, sales,
  revenue, CMarket's commission, net payable, rating, followers) and the monthly payouts; the
  editor (subject, title, summary, TipTap with B, I, H2, H3, list, table, image, CMarket chart and
  link); the settings (Free / Paid within the Admin's range, student price, free after a delay,
  rating or outlook, target, horizon, reference price, the three disclosures, PDF attachment,
  moderation mode). Reader preview, before and after purchase. Submit is enabled once the three
  disclosures are ticked and shows the automatic checks by field; a published publication gets
  Publish update; Archive or Withdraw takes a reason. An Analyst not approved yet sees why.
- **Rules**: autosave every 10 seconds, and on leaving the publication or the screen; each save
  carries the row version, and a 409 offers to reload the copy saved elsewhere. Closing a tab with
  unsaved changes asks first. A CMarket chart (security, period, line or candles) is frozen by the
  server at insertion and the body holds its id; images are uploaded as attachments. A new price
  applies to readers at once; a change of content becomes a new version.
- **Mock**: K. Atangana's 44 publications, with the SEMC update of the mockup in progress (the
  sources to tick again) and its chart frozen on 28/10/2026; October gives the mockup's earnings.
- **Still to do**: ratio and yield curve charts in a publication (price charts only); a version
  history readers can open (the library shows the latest version and its date).

### CFG · Settings (no mockup): done

- **Built**: five panels. Profile: the login address, the account type (an Analyst's status), the
  organisation, then the name, the mobile phone, the language and the time zone, which apply at
  once (`PUT /me`). Security: the password (`PUT /me/password`, which closes the sessions of other
  devices), where the login codes go (e-mail, or SMS once a phone is set), the automatic logout.
  Subscription: the plan that covers the user, with its modules, its renewal or the end of the
  trial, who pays (the user, or the organisation for its members), then the plans by month or year
  per user; Choose opens the checkout: card or mobile money followed until confirmed, or a bank
  transfer against an invoice due in 15 days, the plan applying at once. Organisation: the members
  and the invitations; an administrator invites by e-mail and, from the right-click menu, changes
  a role or removes a member (with a confirmation); the last administrator stays. Invoices: the
  plan's, the organisation's for its administrators and the receipts of research bought, each in
  PDF from the title bar once selected (or by double click); a transfer still due shows its date. Members of an organisation read its plan without
  changing it.
- **Mock**: four plans (Monitoring, Analysis, Professional, and Student for students), prices per
  user and month excluding VAT at 19.25%, a year for ten months. K. Atangana pays Professional
  yearly by card; Asset manager A pays Professional monthly and Bank C Analysis yearly (no
  Portfolio: PORT is locked for T. Bekale), both by transfer; University B has the student plan.
- **Still to do**: accepting an invitation (the e-mail link and its sign-up); the status of a
  Student's proof of enrolment.

### Home page (no mockup): done

- **Built**: `/`, in the brand navy and green of spec section 8, in French or English: what
  CMarket does and a picture of the terminal drawn with sample data, four figures, the three uses
  of spec section 1 with research and their function codes, the CEMAC and international markets,
  the client account types (each opening the sign-up with its type), the plans by month or year as
  the server prices them, why CMarket, then the trial. A visitor already logged in in the browser
  (the refresh cookie) gets "Open the terminal" instead of the trial and the login, and the plans
  lead to CFG. Motion: the hero rises into place and each section comes in as it scrolls into
  view; the picture types the commands of spec section 8, draws its charts, moves its sample
  quotes with the screens' 400 ms flash and scrolls its tape, only while on screen and until its
  Pause button (WCAG 2.2.2); a plan's price glides to the other billing cycle; the header gets a
  shadow once the page scrolls. Behind the hero, a city at night closes in slowly, the grid of a
  chart drifts and price lines slide by; two glows of the brand colours drift behind the whole
  page; the same button stops them. Photos set the mood: Douala at sunset above the markets, the
  work of each account type on its card, a coastal city at dusk behind the trial; those behind a
  section move against the scroll. The navy shades them where text stands on them (4.5:1 at
  least, measured behind each line of text at several scroll positions).
- **Still to do**: the texts are the prototype's, to be checked by the spec author.

### Login, OTP, sign-up, password reset: done

- **Built**: `/login`, `/signup` and `/reset-password`, outside the app shell in the brand navy and
  green, in French or English. Login: e-mail and password, then the one-time code of 6 digits sent
  by e-mail or SMS (`POST /auth/login` answers where it went; `/auth/otp/verify` gives the tokens),
  5 tries, a new code after 30 seconds by logging in again; wrong passwords lock the account for 15
  minutes after the fifth. Sign-up: the account type of spec section 12, the user, a proof of
  enrolment for a Student without a school address, an identity document and a CV (and a licence)
  for an Analyst, whose status then waits for an Admin; the code then confirms the address and the
  14-day trial of the account type's plan starts. Password reset: a code sent to the address, then
  the new password; the answer is the same whether an account uses the address or not. Logout from
  the user menu, in every tab; automatic logout after 30 minutes without activity.
- **Mock**: the accounts of the six demo users and of their colleagues (password `cmarket2026`),
  salted SHA-256 hashes, access tokens of 15 minutes, refresh tokens of 7 days in the cookie the
  mock keeps for the browser, codes shown by the prototype (`GET /_prototype/codes`). The account
  switch of the user menu opens a session for a demo user.

## Back-office

### IMP · Data import (screen 6): done, with DATA, HIST and EODH

- **Built**: the four panels of the mockup. Session coverage: each file expected for the session
  (daily prices and indices every session, auctions on an auction day, curves on Fridays) with
  its state, published (and when), being checked, expected (and when), missing, or none
  expected, the issuer news of the day; a click opens the latest upload; "Download file
  templates" lists the columns and checks of each file with its CSV and Excel template. Current
  upload: the five steps, the counters (rows read, new, changed, unchanged, alerts, errors; a
  click shows those rows only), the rows as read with ✓, ! or ✕ and the reason in the Check
  column (yellow for an alert, red for an error), a changed cell in amber with the stored value in
  its tooltip. The first row to look at is selected, with what to do; "Alert checked" ticks it.
  Publish N rows, Fix row (the cells typed again, then the whole file checked again), Replace file
  and Discard (with a confirmation). A published file shows who published it and offers Roll back
  (with a reason) and New upload; a rolled back one comes back to its preview with the reason.
  Upload history: the last 7 days, the status in colour ("Rolled back, republished" in yellow),
  a click opens the upload, the right-click menu rolls back. EODHD connector: state, the latest
  US, Europe and fundamentals bulk loads, calls today, quota used (with its bar), 429 answers in
  24 hours, the last error. The upload shown is in the URL (`/imp?import=`).
- **DATA**: the coverage of any session (picker and previous / next), its uploads, and the
  templates. **HIST**: the history over any period, by type, status and dates, 50 a page.
  **EODH**: the connector in detail and its loads of the last 7 days, by load and result.
- **Rules**: Publish stays disabled while an error remains or an alert is not ticked "checked";
  one upload at a time is checked for a type and a session (a second one is refused, with a
  link to open the first); only a file not published is replaced or discarded, only a published
  one rolled back.
- **Mock**: the upload is read now and its checks reported step by step (format, then business
  rules, about 2.5 seconds): required cells, dates, figures, the high and the low, unknown
  security, index or country, duplicates, a day without a session or of another session, a
  change above ±15% (5% for an index, 1 point for a rate) from the stored value, a zero volume
  with a moved close. The seeds follow the mockup: the files of the last five sessions by
  A. Mbarga and J. Ekane, the 29/10 prices rolled back and published again, and the BEAC
  auctions of the latest session waiting in their preview with the Gabon 13-week BTA 1.40 points
  above its previous auction. A published file replaces the generated prices of its sessions
  (today's last prices too), the index closes, adds the auctions to CAL and YCRV, the curve
  points and the dividends; the EODHD loads are generated, a 429 now and then retried 15
  minutes later.
- **Still to do**: the securities and financial statements files are checked and kept, but the
  security master and the statements of the screens do not read them yet; the curves of a
  published file apply from its date, without the shift of the sample file.

### CORR · Data corrections (no mockup): done

- **Built**: a security and a session (or a click on one of the two months of stored sessions,
  each with its source: daily prices file, initial history or correction), the stored open,
  high, low, close and volume typed again, a required reason; the log of corrections (when, the
  security, the session, the close before and after, the reason, who), a click opens one. Both
  are in the URL (`/data/corrections?security=SEMC&date=`).
- **Mock**: a correction replaces the session for every screen, today's last price too, and
  outlives the rollback of an earlier file.

### NEWS · News and documents (no mockup): done

- **Built**: the news and the documents published, newest first, in two tabs; a click opens one
  in the editor. News: headline, source, topic, country, securities and text, published at once
  to the terminals (`NewsPublished`); documents: type, title, source, securities and the PDF
  (20 MB), shown in the DOC tab of their securities and the N screen. An edit keeps the
  publication date; a document keeps its file unless another is dropped.
- **Mock**: the entries are kept with the sample news and documents; a PDF uploaded stays in the
  tab that sent it (a generated one stands in after a reload).
- **Still to do**: the PDF attached to a news item (spec section 11): for now the Data admin
  publishes it as a document of the same securities.

### USER · Account administration (screen 9): done, with ANLY and MOD

- **Built**: the five panels of the mockup. Counters: the active accounts by type in the type's
  colour, reused in the list, the details and the permission matrix; a click filters the list.
  Accounts: search by name, e-mail or organisation, type and status (active, under review,
  suspended) filters, sorting and pages by the server, "+ Create account" (any type; Data admin
  and Admin belong to CMarket and log in with a code every time) and "Export CSV" of every
  account of the filters. Account details: type with the Analyst approval, organisation,
  subscription, two-factor, publications, sales and reports of an analyst or research bought by a
  client, last login and its place; Change type (a client among the client types, an employee
  among the employee ones), Reset two-factor (codes by e-mail again, every session ended), View
  audit log (AUDT on the account), Suspend or Reactivate with a reason and a confirmation. An Admin
  neither changes nor suspends their own account. Analyst status requests: the applicant, the
  documents sent at sign-up (in the PDF viewer), Approve or Reject with a reason. Moderation
  queue: reports then publications waiting, Open (MOD), Approve, Take down with a reason. The
  account shown and the filters are in the URL (`/admin/users?id=&type=&status=&sort=`).
- **ANLY**: the requests waiting, approved or rejected, and one with its documents side by side.
  **MOD**: the queue by kind, and the publication opened in the PUB reader with its reports;
  approved, a publication waiting goes live and its followers are told, a reported one stays and
  its reports close; taken down, it leaves the library and its buyers keep their version.
- **Mock**: the counters add up to the mockup's 1,946 active accounts (1,959 with the suspended);
  the three requests, the two reports and C. Nguema's first publication of the mockup are seeded.
  Suspending ends the user's sessions at once; a type changed to Analyst is approved with it.

### ADMCFG · Platform settings (no mockup): done

- **Built**: quotas of portfolios and alerts by client type (empty for unlimited), the price
  range, CMarket's commission and the moderation mode of research, the risk-free rate of the
  Sharpe ratio, saved together with who changed them last. The permission matrix: the
  permissions by area as rows, the six account types as columns, the changes counted and saved
  role by role (`PUT /admin/roles/{role}/permissions`); the Admin keeps `settings:manage`.
- **Mock**: users get the new permissions and quotas with their next `/me`, the studio and the
  library the new price range, commission and moderation, PORT the new rate.

### AUDT · Audit log (no mockup): done

- **Built**: when, who, action, target, the values before and after and the reason, newest first
  and 50 a page, filtered by user (an account picker), action and dates, all in the URL
  (`/admin/audit?userId=&action=&from=&to=`); a click shows the entry with each value before and
  after. USER's "View audit log" opens it on the account: what it did and what was done to it.

### PAY · Analyst payouts (no mockup): done

- **Built**: by analyst and month, the sales, revenue, commission and net payable with its status
  (in progress for the current month, due once closed, paid), the total due in the title bar,
  filters by month, status and analyst in the URL, "Mark paid" for the selected payout in the title
  bar, with a confirmation (also by double click, Enter or the right-click menu). The analyst's
  earnings in PUB NEW show the payment.
- **Mock**: the months up to August are paid, K. Atangana's September too (on 5 October), the
  other analysts' September is due.

## Open questions for the spec author

- **Home page**: the spec names "marketing pages" (section 8) but gives no mockup, route or text.
  The prototype puts the home page at `/` and the app's home screen at `/app`, and reads the plans
  with `GET /subscription/plans` before login: is that endpoint public (the prototype: every plan
  without a token, those of the account type with one)?
- **Country page**: mentioned (`/macro?country=`, research on a country) but without a mockup,
  route or function code.
- **Admin**: section 6 lists statistics and the management of organisations, plans, trials and
  invoices, with no API or screen.
- **IMP**: the prototype adds `POST /data/imports/{id}/discard`, and Replace file sends the new
  file to `POST /data/imports` with `replacesId`; "Alert checked" is
  `PATCH /data/imports/{id}/rows/{rowId}` with `{ checked: true }`, Fix row the same PATCH with
  `{ values }`. `/data/imports/{id}/rows?status=` takes `error`, `alert`, `new`, `changed` or
  `unchanged` (the spec says `warning`). Each issue comes with a code, a severity, a column and
  its figures (`params`), so the screen words it in the user's language. `GET /data/import-types`
  lists `{ type, frequency, columns, checks, changeThreshold }`; `GET /data/coverage` answers
  `{ date, items }`, each item `{ type, status, published, lastPublishedAt, dueOn, importId }`,
  for the current session without a date. Which thresholds apply (the prototype: ±15% on a
  close, 5% on an index, 1 point on a rate), and are they Admin settings? Is a second upload of
  the same type and session refused while one is checked (the prototype: yes)? The screen 4
  mockup shows the 28/10 auctions published while the screen 6 mockup checks them: the prototype
  keeps the 26-week Cameroon BTA published, so the file shows it unchanged.
- **CORR**: only `PUT /data/securities/{id}/prices/{date}` is given; the prototype adds
  `GET /data/securities/{id}/prices?from=&to=` (the stored sessions and their source) and
  `GET /data/corrections` (the log). May a correction change the volume (the prototype: yes)?
- **NEWS**: the bodies are not specified. The prototype sends
  `{ headline, source, topic, country, securityIds, body }` to `POST /data/news` and
  `PUT /data/news/{id}`, and a multipart form (`type`, `title`, `source`, `securityIds`, `file`)
  to `/data/documents`. Is a news item or a document withdrawn (no endpoint)?
- **EODHD**: the status fields are not specified. The prototype answers
  `{ status, latest, runs, callsToday, dailyQuota, rateLimited24h, lastError, checkedAt }`.
- **Screens 6 and 9 mockups**: J. Ekane is a Data admin in both; the prototype's demo Admin is
  L. Mvogo.
- **USER**: no endpoint returns the counters by account type: the prototype adds
  `GET /admin/users/counts` (`{ student, analyst, ... }`, the active accounts). It also adds
  `GET /admin/users/export` (the CSV of every account of the filters), `GET /admin/organizations`
  (for the account form) and `?sort=` on `GET /admin/users`, whose items are
  `{ id, displayName, email, accountType, organization, status, analystStatus, createdAt,
lastLoginAt }`. `POST /admin/users` takes `{ displayName, email, accountType, organizationId,
phone, language }`, `PUT /admin/users/{id}/type` `{ accountType }`, the suspension, the
  reactivation, the rejection of a request and the takedown `{ reason }`. May a type change cross
  from client to employee (the prototype: no)? Is an account changed to Analyst approved with it
  (the prototype: yes)? What does "Reset two-factor" reset when the codes go by e-mail or SMS (the
  prototype: codes by e-mail again, every session ended)? Where does the place of the last login
  come from (the prototype: the time zone)?
- **ANLY and MOD**: the prototype adds `?status=approved|rejected` to
  `GET /admin/analyst-requests`, `GET /admin/analyst-requests/{id}/documents/{kind}` (the files
  sent at sign-up) and `GET /admin/publications/{id}` (the publication as readers will see it, a
  draft waiting included). Approve on a reported publication keeps it online and closes its
  reports. The screen 9 mockup reviews a first publication before it goes live although the
  moderation is after publication: the prototype does the same.
- **ADMCFG, AUDT, PAY**: the spec gives no body. The prototype sends the settings as
  `{ quotas, minPrice, maxPrice, commissionPct, moderation, riskFreeRatePct }`; R_f is one rate
  set by the Admin, where section 14.3 defaults it to the 52-week BTA rate of each portfolio's
  country. An audit entry is `{ at, actor, action, target, changes: [{ field, scope, before,
after }], reason }`; `?userId=` matches who acted or the account acted on, and `?action=` takes
  several actions. Which actions are logged (the prototype: publications, rollbacks, discards,
  corrections, news and documents of the Data admin, every action of the Admin, not each row
  fixed in an upload)? Marking a payout paid has no permission in section 12: the prototype adds
  `payouts:manage`. A closed month stays due until marked paid.
- **Screen 9 mockup**: T. Bekale, the demo Trader, is suspended: the prototype suspends his
  colleague F. Mba instead. "Gabon: oil price impact on auctions" is K. Atangana's note waiting
  in moderation on screen 7 but M. Ndong's reported note on screen 9: the prototype reports
  M. Ndong's Gabon note and keeps K. Atangana's waiting (2 reports, 2 pending). The details give
  K. Atangana 42 publications (3 withdrawn) and 412 sales; the prototype counts 43 (1 withdrawn)
  and 726 in the library of screens 7 and 8.
- **Real time**: no event for the order book and latest trades; the prototype polls them every
  5 seconds.
- **Quote**: the security header shows the session's open, high and low, which the example of
  `GET /securities/{id}/quote` lacks; the prototype adds them to the response.
- **Login**: the spec gives a JWT of 15 minutes, a refresh token of 7 days and a code, without
  saying where the refresh token lives, how the code goes or for how long. The prototype keeps the
  access token in memory and expects the refresh token in an `HttpOnly` cookie on `/auth`
  (`POST /auth/refresh` without a body answers `{ accessToken, tokenType, expiresIn }`).
  `/auth/login` answers `{ challengeId, channel, destination, codeLength, expiresAt, resendAt }`:
  6 digits valid 5 minutes, 5 tries, a new code by logging in again after 30 seconds; 401 for wrong
  credentials, 429 after 5 wrong passwords (locked 15 minutes), 410 for an expired code. Does every
  client log in with a code (the prototype: yes, by e-mail or SMS as chosen in CFG; section 12 says
  "mandatory" for employees only), and is an authenticator app (TOTP) wanted? Does the refresh
  token rotate, and how do two tabs renew it at once? How long is the inactivity (the prototype: 30
  minutes, with a warning in the last one)? Which password rules (the prototype: 8 characters, a
  letter and a digit)? `/auth/register` takes a multipart form with the documents and answers a code
  that confirms the address: which domains make a school address, and does an Admin check a proof
  of enrolment? Changing one's password has no endpoint: the prototype adds `PUT /me/password`.
- **Subscriptions**: `/me` returns neither the modules nor the trial: the prototype adds `modules`
  and `trialEndsAt`, with `phone` and `twoFactorChannel`. No plan, price or VAT is given: the
  prototype offers Monitoring, Analysis, Professional and Student, per user and month excluding
  VAT at 19.25%, a year for ten months, and a 14-day trial of every module of the account type.
  Which screens belong to which module (the prototype: Monitoring MKT, DES, N, CAL, ALRT; Analysis
  EQS, YCRV, YAS and the FA tab; Portfolio PORT; research and settings in none)?
  `POST /subscription/checkout` takes `{ planId, billingCycle, method, phone }` and answers
  `{ payment, invoice, subscription }`: a transfer applies the plan at once, the invoice due in 15
  days; a change of plan starts a new period, without proration. Does an organisation pay for
  each member (the prototype: yes), and how is an invitation accepted? `GET /organization` answers
  404 for an individual account; `PUT /organization/members/{id}` takes `{ role }`. Is VAT due on
  research sold for the analysts (the prototype's receipts include it)?
- **Time zone**: what does the profile's time zone change? The prototype shows dates and times in
  it; the session clock and the market's days stay in Douala time.
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
- **Portfolios**: the bodies are not specified. The prototype sends a transaction as
  `{ type, date, securityId, quantity, price, fees, amount, note }`, prices and fees in the
  security's currency, amounts in the portfolio's; the server adds a bond's accrued interest.
  Portfolios and transactions carry a `version` (409 when someone else saved meanwhile). Model
  portfolios have no endpoint: their `{ notional, startDate, lines }` go in the portfolio's
  settings. Which limits can a user set (the prototype: weight of one issuer, which also marks the
  lines with ▲, volatility, drawdown, beta, bond duration), and when are they checked (the
  prototype: after a change of transactions or limits, and when the risk is read)? The import
  template has no endpoint (the front end writes it); past reports have no list (the prototype
  shows those of the session). BVMAC-A is a price index: is there a total return index to use?
- **Screen 5 mockup**: its figures do not add up (lines worth XAF 1,202.7 M for a total of
  1,248.65 M; "Upcoming income (3 months)" of 18.4 M against 63.8 M listed). The prototype computes
  them, leaves principal out of upcoming income, and holds 15,000 and 11,000 bonds of XAF 10,000
  for the mockup's 1,500 and 1,100.
- **Research**: the bodies are not specified. The prototype saves the TipTap JSON as the body; a
  "CMarket chart" node holds the id of a chart frozen by `POST /publications/{id}/charts`
  (`{ securityId, period, type, title }`, answered with the bars as of today). The price range,
  commission and moderation mode come from `GET /publications/rules`, which the spec lacks (the
  Admin's settings are under /admin), and `/me` gets `analystStatus`. `/library` takes
  `followed=true` for the Followed analysts tab and `q` for the search; `/me/purchases` takes the
  same filters; `GET /library/{id}/attachment` serves the attachment to readers.
  `POST /library/{id}/purchase` takes `{ method, phone }` and answers 202 with the payment. When
  is a rating "confirmed at 12 months" (the prototype: a Buy by a rise, a Sell by a fall, a Hold by
  a move within ±10%)? Is a read counted once per reader (the prototype) or at each opening? Does
  an update need the disclosures ticked again and go through moderation again (the prototype: yes,
  as the moderation mode says)? May the price change after publication (the prototype applies it
  at once)?
- **Screens 7 and 8 mockups**: the SEMC note is a draft on screen 7 but published on 28/10/2026 on
  screen 8; the prototype publishes it and shows an update in progress in the studio. Screen 8
  lists Apple and TotalEnergies notes, but the prototype's master list has no US or European
  security yet: SCG-RE and REGIONALE notes take their places. Screen 7 shows a note in moderation
  although the moderation mode is "post-publication review".
- **Bond calculator**: the body is `{ settlementDate, faceAmount, cleanPrice | yieldPct }` in the
  prototype, with a 400 for a date before the issue or after the last payment and a 422 when no
  yield fits. Which settlement lag (the mockup shows two business days) and which curve date for
  the spread (the prototype: the settlement date, today at the latest)? "No extrapolation beyond
  the first and last points (shown dashed)": the prototype draws nothing outside the points and
  gives no spread there. `/yield-curves` without a country returns all six. Validation messages
  should come in the user's language.
