# Shared groundwork

Part of the [roadmap](../ROADMAP.md).

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
  - Keyboard, second pass: Tab no longer stays in the command bar (2.1.2), which completes only a
    word under way; the menu key or Shift + F10 opens a row's menu, where rows are not selected
    a cursor of the table's own (2.1.1), and screen readers hear the row reached; a menu takes the
    focus, goes through its entries with the arrows and gives the focus back (the user's menu,
    the row menus); the selected row is `aria-current`.
  - A panel moves and sizes without dragging, from the layout menu of its title bar's code, which
    also brings the screen's default layout back (2.5.7).
  - Each page names itself in the tab's title (2.4.2, `useDocumentTitle`); each chart is a figure
    named with its period, move and range (1.1.1, `useChartLabel`).
  - Windows contrast themes: the selection, the current page and the focus get an outline in the
    system colours, which keep no background or box shadow.
  - Narrow windows (a tablet, a zoomed page, down to 320 px): the top bar drops its least needed
    items, a title bar's options go to the next line, the tabs scroll, the security header wraps;
    no page scrolls sideways. A table's sr-only text no longer widened the page.
  - Links inside a sentence are underlined; the sign-up form's pairs of fields stack on a phone;
    the FR / EN buttons are named Français and English.
- **Mock session**: a logout no longer takes the user away from the requests already let through
  by the auth gate (`setRequestUser`, `endSession`): they were failing with 500 while they waited
  for their latency.
- **Failures**: a link to `/login?next=` with a tab or a line break (which the URL parser drops)
  showed the error screen; a browser that blocks the service worker or the site's storage left an
  empty page, it now says why the prototype cannot start; INDEX CHART and NEW UPLOAD waited for
  ever on a request that had failed, they show it with Retry; a server out of reach reads in the
  user's language. The mock's ids carry 32 random bits: those written in the same millisecond
  could repeat, and two rows of AUDT shared a key.
- **Moving the panels** (spec section 8): they moved and resized from 1280 px wide, but nothing
  showed it before the pointer was on them. A grip now comes before a panel's title, and the
  corner that resizes it shows at rest (the library drew it under the pointer only, which a
  touch screen lacks); stacked panels no longer take the move pointer. Under
  `prefers-reduced-motion`, a panel takes its place without sliding there.
- **Arranging the panels**, beyond the spec, from the layout menu of any panel:
  - Below 1280 px, where they stack, a panel goes a place up or down; this order is kept apart
    from the grid's (`stacked`), which it leaves as it is.
  - A panel hides, the others packing up, and comes back at its place from the menu of any
    other ("Show: Rates and FX"); the last one shown stays. Each panel has a name for this
    (`ScreenPanel.name`, `panels.*`), as its title may change ("Watchlist: My picks").
  - Undo and redo go through the changes made since the screen opened, per tab: drags, steps,
    hidden panels, a saved layout applied or the default one. Ctrl + Z and Ctrl + Y (⌘Z, ⇧⌘Z)
    do the same, except in a text field, the publication editor or a dialog, which keep theirs.
  - A locked layout neither drags nor resizes, and its menu changes nothing until unlocked; a
    padlock replaces the grip.
  - Up to 10 layouts per screen are kept under a name, applied (and undone) or deleted.
  - A layout the server could not give shows the screen's default, with a message, and is never
    saved over: a PUT from it would have deleted the saved layouts and the lock.
  - The mock checks what `PUT /me/layouts/{screen}` receives (`mocks/lib/layouts.ts`), and
    still reads the layouts saved before, the positions alone.
  - Menus are as wide as their longest entry (up to 400 px, then on two lines) and stay inside
    the window: "Disposition par défaut de l'écran" and the long names of panels were cut.
  - Playwright flows on each: a panel dragged and resized, hidden and shown, a change undone and
    redone, the layout locked, a layout saved then applied, the stacked order kept, a layout that
    failed to load left as it was on the server.
- **PAY flow**: the sample sales follow the date (a new month draws more of them), so the
  amount to pay is read from the row instead of a figure that held in October only.

Still to do, with the first screen that needs it:

- **PNG and PDF export of charts** (spec section 3), for the price chart, the comparison bars and
  the curves alike.
