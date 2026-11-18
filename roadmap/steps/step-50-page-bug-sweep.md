# Step 50 · Every page checked for bugs, then fixed (XL): to do

Step 50 of the [roadmap](../../ROADMAP.md#order), after the fourth version (steps 37 to 49).

Each screen was built with its Playwright flows, and steps 19, 36 and 48 opened every screen of
every account type for axe, the widths, the keyboard, raw keys and the console; step 49 read the
live site the same way. Those checks open a page and look at it. This step uses every page: each
control and each form, with good values and bad ones; the unhappy paths (the API failing or slow,
an empty answer, a session that ends, the network gone); the figures a page shows against the API
and against the other pages; the real time between two accounts; French; the time zones; the
WebKit and Firefox engines.

**First every page is checked and each bug written in the [bug log](#bug-log); the fixes come
after, in [phase 6](#phase-6--the-fixes), once the user has read the log.** Only a bug that stops
the checks themselves is fixed at once.

## Scope

- The 45 screens of `SCREENS` (`shared/routes/screens.ts`; one page serves RFQ AGR, AGR and the
  Admin's RFQ); DES in its four profiles with their tabs (an equity: DES, GP, FA, DVD, N, DOC,
  HDS, ANA; a bond: DES, GP, BP, CF, RAT, DOC, N, ANA; an ETF: DES, GP, HLD, PERF, DIST, DOC, N,
  ANA; a commodity: DES, GP, CMP, N); the app shell (top bar, command bar, ticker tape, menu,
  status bar, the session); the pages outside it: the home page, the login, the sign-up, the
  password reset, the public profile `/p/{handle}`, `/_kit`.
- The ten account types, an account waiting for approval, and the visitor.
- CMarket.Api as the pages show it: a 5xx, a wrong answer or a missing check behind a page is a
  bug of this log, fixed in CMarket.Api.
- Not bugs: what the roadmap lists under "Still to do" for a screen, and the
  [open questions](../open-questions.md). A control that shows and does nothing is a bug all the
  same.

## What counts as a bug

- **S1 · blocker**: a page or a flow that cannot be used, data lost or wrong on the server, an
  access the account should not have: a white page, the error boundary, a 5xx, a form that never
  saves, another bank's agreement opened by its address.
- **S2 · major**: a wrong result the user may act on, an action that does nothing or something
  else, a page that does not follow a change: a wrong figure or total, a filter that does not
  filter, a list not refreshed after a save, the real time stopped, a link that opens the wrong
  item.
- **S3 · minor**: shown wrong but usable: a cut text, a raw key, English left in French, a number
  or a date not formatted or in the wrong zone, an axe finding, a target under 24 px, a console
  error or a React warning.
- **S4 · polish**: alignment, spacing, an inconsistent wording.

## How the checks run

- **Where**: CMarket.Api from a `git archive HEAD` copy in the scratchpad, never the user's
  checkout: on SQLite, without the API's `.env` (which points Development at the shared Azure
  database), `RateLimiting__Enabled=false`, a fresh database for each group of checks (its
  `cmarket.dev.db` and `storage` removed by name). The web from a `git archive HEAD` copy too
  (Vite on 5174, its own `cacheDir`), so that a fix or an edit of this file never reloads a page
  in the middle of a check; `npm run e2e` from the repository while nothing else runs. The
  e-mails (codes, tickets, invoices, the BEAC's report) read in Mailpit (http://localhost:8025,
  the compose stack on Colima).
- **The machine**: its load looked at before each batch (free memory at 42 % or more, a load under
  6), one heavy job at a time under `nice -n 10`, long runs in the background, small batches (one
  account, or one group of pages), every process started for a check stopped after it.
- **Accounts**: password `cmarket2026`, the code from the development tools' "Fill in".

| Type          | Account                          | For the flows with two sides                      |
| ------------- | -------------------------------- | ------------------------------------------------- |
| Student       | S. Mvondo                        | E. Nkoulou (University B's administrator)         |
| Analyst       | K. Atangana                      | M. Ndong; C. Nguema (a publication in moderation) |
| Manager       | P. Owona (Asset manager A)       | M. Ngono, C. Abena; B. Ngoma (Pension G, French)  |
| Trader        | T. Bekale (Bank C, codes by SMS) | L. Ella; F. Mba (suspended)                       |
| Journalist    | R. Tamba                         |                                                   |
| CEO           | E. Fouda (Asset manager A)       |                                                   |
| News provider | L. Mballa (Media I)              | S. Nana, J. Edzoa (French)                        |
| SVT           | B. Sima (Bank E)                 | A. Okala (Bank D), M. Ondoa (Bank G), both French |
| Data admin    | A. Mbarga                        | J. Ekane                                          |
| Admin         | L. Mvogo                         | another Admin of the demo, for MPAY's four eyes   |
| Waiting       | F. Biyong (Analyst)              | R. Essomba, D. Moussavou                          |

- **Matrix**: every page at 1600 × 900 (the mockups) and 390 px, in English and in French. French
  is switched from the user menu, since a language put in `localStorage` gives way to the
  profile's once `/me` answers; each result prints the page's `lang`, and English comes back
  before the account is left. The other widths (1280 and 1279, where the panels stack; 1024;
  768; 320) in English with the page's main account. The browser in Europe/Paris, where the
  customers are, the profiles in Douala as seeded; other zones in phase 4. Chromium throughout;
  WebKit and Firefox in phase 4.

## How a bug is written down

Each bug gets its line in the [bug log](#bug-log), numbered B01, B02…, and its notes below the
table: the page and the panel; the account, the language, the width and the browser; the
severity; what happens and what should; the steps from a fresh database; the lines of the
console, of the network or of the API's log. Once fixed: its cause, the commit, the test that now
covers it. A bug seen on several pages is one entry naming them all: its cause is usually a shared
component.

## Phase 0 · The baseline

1. `git status` and `git log` of both repositories; the copies made from their `HEAD`.
2. The type check, the lint, the unit tests (`--maxWorkers=50%`), the files over 700 lines.
3. Every Playwright flow on CMarket.Api from a fresh database: the usual run, then each
   `@fresh-db` spec on a fresh database of its own. A flow that fails runs three times more
   (`rfq.spec.ts`'s fresh-database flows failed once at step 48, cause unknown).
4. The API's log of those runs: `responded 5`, `ERR]`, a warning with an exception.
5. `npm run build`: its warnings and the size of each page's chunk.

Each failure is a bug of the log before any page is opened.

## Phase 1 · Every page swept by a script

A Playwright script, kept in the repository (`scripts/page-sweep/`, `npm run sweep`) so that it
runs again before each release, on CMarket.Api locally or read only on the live site (step 49's
guard). As each account it visits every page it may open: the menu's entries; the screens its
command bar opens (DES on an equity, a bond, an ETF and a commodity with every tab; OPT RES after
a run; RFQ AGR and RFQ REP; NET ME; CAL; PUB NEW); every tab and sub-route; the addresses that
name an item (`/n?article=`, `/pub?id=`, `/msg?c=`, `/admin/users?id=`, `/imp?import=`, …), with
an id that exists and one that does not; the screens it may not open, by their address. It moves
through the menu and `history.pushState`, and reloads each page once.

What it records on each page, for each account, language and width:

- **D1** a page error (an exception nobody caught), the error boundary, a white page.
- **D2** the console's errors and warnings, React's among them (a missing key, an update while
  rendering, the maximum update depth, an update after unmount), Recharts' size warnings.
- **D3** every API answer: a 5xx; a 4xx not designed (each designed one listed with its reason,
  as F. Biyong's `GET /subscription` 404); an answer over 2 s; the same GET sent again and again,
  or still sent once the page is idle; a call for a screen the account cannot open.
- **D4** text that should never show: `undefined`, `null`, `NaN`, `Infinity`, `Invalid Date`,
  `[object Object]`, `-0`, a translation key, `{{`, a year 1970 or 0001.
- **D5** a number written the other language's way (`52,500.25` on a French page, `52 500,25` on
  an English one), a time out of the profile's zone.
- **D6** a page wider than the window; a text, a figure or a header cut in its cell or button (its
  `scrollWidth` above its `clientWidth` without an ellipsis meant); content out of its panel.
- **D7** a "Loading" or a skeleton still there after 10 s; an empty panel where the demo has data.
- **D8** a broken image; a link to a route that does not exist; `href="#"`.
- **D9** axe-core (WCAG 2.2 AA) at 1600 and 390 px, in both languages.
- **D10** the hubs: each subscription a page asks of `/hubs/market`, `/hubs/chat` or `/hubs/rfq`
  given back once it is left (the WebSocket's frames, which Playwright reads), one connection per
  hub, MKT's quotes moving.
- **D11** a screenshot of each distinct page, as its main account, at 1600 px in English and 390
  px in French, which I look at one by one: overlaps, alignment, a colour off the tokens, a panel
  too short for its rows. Another account's page gets its screenshot where it differs (PORT read
  only, the SVT's CFG).

Then the **explorer** (`npm run sweep -- --explore`), on each page as its main account: it opens
every tab, menu, right-click menu, dialog, drop-down and side form and closes it again (Escape,
then Cancel), sorts each column of each table, and types bad values in each field (empty, `-1`,
`0`, `1e309`, letters, `1,5` and `1.5`, 5,000 characters, an emoji, `<img src=x onerror=…>`). A
deletion, a suspension, a rollback or a logout is opened and cancelled, never confirmed. D1 to D4
run all along.

Its reports (JSON, one per batch) and screenshots stay in the scratchpad, which a restart wipes:
what matters goes to the log the same day.

## Phase 2 · Each page, every control

Playwright steps written page by page, on a fresh database for each group, writes allowed: each
action done, then its result checked on the page, in the API (`apiAs`) and on the other pages
that show it. First the common checks, on every page; then each page's own. "Flows today" names
the specs of `e2e/` that already cover a part of it.

### Common checks

- **C1 Getting there**: from the menu, from its code in the command bar, by its address and after
  a reload; Back and Forward; what the address holds (filters, tab, the item open) comes back; the
  menu's entry lit (NEWS for NEWS NEW, RFQ for RFQ AGR and RFQ REP, OPT for OPT RES).
- **C2 Data**: every panel filled; the same figure equal in every panel and in the API; up in
  green, down in red; an empty state when a filter finds nothing; numbers, amounts, percentages,
  dates and times through `format.ts` in both languages, in the profile's zone.
- **C3 Actions**: each button, menu item, right-click item and shortcut does what it says; busy
  while it runs, sent once on a double click; its toast; every list that shows the change
  refreshed; Cancel and Escape leave nothing changed.
- **C4 Forms**: the required fields; the message of each wrong value, the API's 400 shown on its
  field and not as a raw problem; decimals typed the French way (`100,2`) and the English way;
  thousands; leaving with unsaved changes; the API's 409 from two tabs.
- **C5 Tables**: each column sorted (numbers, dates, accented names), the pages, the selection
  from the keyboard, the right-click menu, the XLSX and CSV export (the file opened: the headers
  in the language, the rows shown, numbers as numbers, the dates, no `undefined`).
- **C6 Layout**: a panel moved, resized, hidden and shown, the default back, the layout kept after
  a reload, per tab where the page has tabs; the panels stacked below 1280 px.
- **C7 Access**: for each account type that sees the page, the actions hidden or locked with their
  reason; a quota reached; the page by its address for an account without it; the API refusing
  what the page hides (one call each).
- **C8 Real time**: what the page shows live changes when another account or the demo market
  acts; live again after the network drops and comes back (`context.setOffline`).
- **C9 Language**: switched on the page, everything follows (the charts' axes, toasts, dates); no
  English left in French; no French text cut; plurals at 0, 1 and 2.
- **C10 Keyboard**: Tab through the page, the focus seen at each stop, never stuck; a dialog keeps
  the focus and gives it back; Escape closes; 24 px targets; `prefers-reduced-motion`; zoom at
  200 %.
- **C11 Failures**: each query of the page answering 500, 503, a timeout or an empty list in turn
  (Playwright's `route`): a message and a way to try again, never a white page; a slow network
  (CDP throttling): nothing jumps, nothing is sent twice.
- **C12 Console and network**: as D1 to D3.

### Outside the terminal

Flows today: `home`, `auth`, `settings` (the sign-up), `directory` (the public profile).

- **Home** (`/`; the visitor, then a visitor whose browser keeps a session): the plans the server
  prices, by month and by year; each account type opening the sign-up with its type; the language
  before login (the browser's, then the switch); Pause and `prefers-reduced-motion` stopping
  every motion; "Open the terminal" in place of the trial and the login; every link and anchor;
  the text over the photos readable in both languages.
- **Login** (`/login`): a wrong password five times (locked 15 minutes, said); a wrong code five
  times; a new code after 30 s; codes by SMS (T. Bekale); `?next=` back to the page asked, an
  address of another site refused (`//site`, `/\t/site`, `https:`); a suspended account (F. Mba);
  an account waiting (F. Biyong); Enter sends.
- **Sign-up** (`/signup`, `?type=`): each of the seven client types with its documents (a Student
  with and without a school address, an Analyst, a Journalist, a CEO and its organisation, a News
  provider and its media); a file refused (its type, its size, a virus); an address already
  used; the code; the trial started or the status waiting; Back between the steps keeps what was
  typed.
- **Password reset** (`/reset-password`): a known and an unknown address answered the same; a
  wrong code; the password's rules; the old password refused after.
- **Public profile** (`/p/{handle}`): as a visitor and logged in, what each visibility rule shows;
  an unknown handle; Contact leading to the login and back.
- **Addresses**: `/app` opens each type's home screen, `/yas/{id}` BP, an unknown address the
  not-found page.

### The shell, on every screen

Flows today: `smoke`, `keyboard`, `workspace`, `auth`.

- **Top bar**: the market's state (open, closed, a holiday), the clock in the profile's zone, the
  user menu (language, NET ME, logout, the development tools' account switch), the
  notifications.
- **Command bar**: every code the account has and none it has not; the securities by code and by
  name (`SEMC DES`, `ECMR 6.25 2029 YAS`, `BRENT CMP`, `cacao`, `IWDA HLD`, `ECO CMR`, `CMR ECO`);
  a code it does not know; the arrows, Tab, Enter, Escape.
- **Ticker tape**: quotes and indices move; a click opens DES; it stops under reduced motion and
  on hover or focus.
- **Menu**: each type's entries in the spec's order; MSG's unread count; at 900 px the active entry
  in view; at 390 px.
- **Session**: the access token renewed at 15 minutes (`page.clock`); the warning, then the
  logout after 30 minutes idle; logout in every tab; a reload keeps the session; the requests
  waiting on a 401 all sent again after one renewal.

### Market screens

Flows today: `smoke`, `monitoring`, `fx`, `eco`, `commodities`, `bond-profile`, `etf-profile`,
`back-office` (CAL).

- **MKT** (`/mkt`; K. Atangana, S. Mvondo for the delayed prices, T. Bekale, B. Sima from the
  command bar): Indices live, a click choosing the chart's index; the index chart's periods and
  tooltips; Top movers, a click opening DES; the watchlist (create, rename, columns, delete,
  "+ Add", remove from the right-click menu, another list, an empty list, "Optimise" from two
  securities and not one); "Add to a list" from any security's right-click menu (the lists that
  hold it ticked, "New list…"); Rates and FX opening FX (title bar, Enter, double click); News
  (its tags filtering N, an item opening its article, new items every 45 s in the demo); the
  calendar (a double click opening the security); the day's alerts; the session summary against
  the indices.
- **CMDTY** (`/cmdty`, then `/securities/{code}/{des|gp|cmp|n}`): the 28 series by category,
  yellow past 10 or 50 days, D, W or M, the change; a click opening another (its address); the
  right-click menu (a list, an alert); DES (by day, week or month, the 50-value average, the
  statistics, the description in both languages, the data, the CEMAC links); GP; CMP (five
  series at most rebased to 100, a sixth refused, one removed, the correlations); N; an alert on a
  commodity going off when CORR or a file gives a new value.
- **ECO** (`/eco`, `?country=`): the country bar (the CEMAC's six, SSF, the Admin's comparison
  countries, WLD); `ECO CMR` and `CMR ECO`, an economy ECO does not offer; the six tiles (a
  figure, its year and its seven years; "n/a"; "no figure since 1999"; a Data admin's source);
  the chart (each of the 37 indicators, six economies at most, 10Y, 15Y, 30Y, MAX, XLSX); the
  rates (the CEMAC's in amber, each point described on hover); the comparison (a figure's year
  when not its row's; XLSX).
- **FX** (`/fx`, `?currency=`): the day of the ECB's rates; the cross rates (the yen per 100, the
  changes over a day, a month, the year, a year); a click drawing the currency, an unknown
  `?currency=`; the chart from 1M to MAX with the last rate, the year's high, low and volatility;
  the converter both ways (French decimals, 0, negative, huge, letters); the matrix; the euro's
  benchmarks; the note; a weekend and an ECB holiday.
- **N** (`/n`, `/n/documents`): the filters (security, country, category, type, newspaper),
  combined and kept in the address; the article (newspaper, author, original link, "Updated on",
  its securities); its unique click counted after 3 s, once; Copy link, and Share to a
  conversation for whoever writes messages; Report; a removed article; new items arriving without
  moving the one read; documents: the full-text search, the type filter, the PDF viewer, a search
  that finds nothing.
- **CAL** (`/cal`): the week (Monday to Sunday, today in amber in the profile's zone, the weekend
  without a session) and the day (its table sorted and exported); previous, next, today; the
  filters by type and country; an event opening its security; the auctions' cover ratio in green
  or red; the address; a week across a month's and a year's end.
- **ALRT** (`/alrt`): the list (on and off, edit, turn off, delete from the right-click menu); the
  form for each type (price, volume, release, auction, portfolio limit on one portfolio or all,
  news on a security or a country, a commodity), no portfolio alert for the Journalist; push,
  e-mail and SMS (SMS off without a phone, the way to CFG); the quota of each type reached; the
  history (a click marks it read and points at its alert); an alert going off live (a price
  crossed by the demo market, a FLASH), in the history and as a notification; "Create an alert"
  from a security's right-click menu, its last price as a hint.
- **DES on an equity** (`/securities/{id}/{fn}`, SEMC): the header (the last price, the change,
  the seven key figures, the Student's delayed tag); DES (the price chart, the order book's depth
  bars, the trades live, the key data, the dividends, the documents in the PDF viewer, the news);
  GP (1D to 10Y, candles, bars and line, Bollinger, RSI, MACD, securities and indices compared at
  100, lines and levels drawn and kept after a reload, none for the Journalist and the CEO); FA;
  DVD; N; DOC; HDS; ANA (the list, the preview, the analyst); each tab's own layout; a tab of
  another profile (`/securities/SEMC/hld`); an unknown security.
- **DES on a bond** (ECMR, COMPANY X): DES (the price and yield history, model prices lighter,
  the volumes, the day's analytics, ratings, characteristics, the cash flows to come, documents
  and news); GP; BP; CF (the whole schedule); RAT; DOC; N; ANA (its country's research); "Request
  a price (RFQ)" on a BEAC BTA or OTA only, for a Trader or a Manager, while the RFQ is on.
- **DES on an ETF** (IWDA, VUSA): DES (price and NAV, performance against the index, risk, the
  top ten, the allocation, structure and costs); GP; HLD (every line; a fund of funds' lines
  opening the ETFs it holds; at 390 px); PERF (every period, the calendar years, the risk; the 3Y
  chart waits about 3 s); DIST (VUSA's quarterly; IWDA accumulates); DOC; N; ANA; the dollar
  prices in both languages.

### Analysis screens and portfolios

Flows today: `analysis`, `etf-screener`, `bond-screener`, `bond-pricing`, `optimizer`,
`portfolio`, `account-types`.

- **EQS and FA** (`/eqs`): the criteria (market, country, sector; at least, at most, between for
  each range; amber while they filter; "+ Add a criterion" and one removed); Run, Reset, "Criteria
  changed"; the saved screens (one loaded and run, SAVE under a name, a name used twice, ×
  deleting; none for the Journalist and the CEO); "N of M securities", sorting, COLUMNS kept in
  the browser, the day's change live, XLSX and CSV from the title bar and the right-click menu; a
  click feeding the panels below, a double click opening DES; the comparison (the security in
  amber first, its sector's average dashed, a bar clicked selecting it); the statements with
  their CAGR or change in points; the description (its language, source, FR and EN, the other
  language marked); everything as it was after DES and Back; a screen that finds nothing.
- **ETFS** (`/etfs`): the criteria, the results with the domicile's flag, the five blocks of the
  ETF picked, the saved screens, XLSX and CSV, a double click opening its profile, no result.
- **YCRV** (`/ycrv`, `/ycrv/{bondId}`): the six curves on a log axis; a legend item hiding its
  country; COMPARE TO from 1 week to 1 year, dashed; the tooltip (an auction, a BVMAC close, a
  series' type, source and security, an RFQ agreement; a stale point hollow and amber); the
  calculator (the settlement two business days ahead, a holiday, a date before the issue or after
  maturity; the clean price or the yield, whichever was typed last driving; the face amount; each
  result); typing fast (no older answer shown last); "Full pricing in BP"; the auctions.
- **BP** (`/bp`, `/bp/{bondId}`, `/yas/{bondId}`): a bond of the list, then one by hand (coupon,
  maturity, frequency, day count, amortization, each wrong value); the platform's yield changed
  and given back; the face; the three blocks; the cash flows with their total and XLSX; the
  price-yield curve; the sensitivity; case A (101.3999 and XAF 107,564,262 at 5.7302 %); an
  unknown bond.
- **BS** (`/bs`): the criteria, the results (model prices starred), the four blocks, the saved
  screens, XLSX, "Open in BP", "Request a price (RFQ)" on a BEAC BTA or OTA for a Trader or a
  Manager only, gone while the RFQ is off.
- **PORT** (`/port/{id}/{tab}`; P. Owona, K. Atangana, S. Mvondo with model portfolios only, T.
  Bekale without the module, M. Ngono and E. Fouda reading the shared fund): the selector (new,
  up to the type's quota; settings: name, currency, benchmark, limits, sharing; delete, then the
  next portfolio open); the seven figures, live; Positions (a weight over the issuer limit in
  yellow with ▲, the cash last, Excel and CSV, IMPORT CSV from the template: all rows or none, the
  errors by line; Buy and Sell filling the form); a new transaction of each of the nine types
  (the cash a trade takes, a sale above what is held refused, a date ahead, French decimals, a
  bond's accrued interest); Transactions (the realized gain; corrected and deleted from the
  right-click menu, every figure following); Performance (base 100, YTD to inception, TWR,
  annualized, IRR, by period); Risk ("insufficient data" under 60 returns, the limits and their
  state, concentration, maturities); Income (to come, received); Reports (a Manager only: period,
  sections, comments, logo; followed until the PDF, which opens); a model portfolio (amount,
  start, weights adding to 100 %); the shared fund (SHARED for its owner, READ ONLY and "Shared
  by P. Owona" for the others, nothing to change, no report); T. Bekale's lock and its way to a
  plan; "Optimise"; a portfolio without transactions.
- **OPT** (`/opt`, `?portfolio=`, `?watchlist=`, `?scenario=`, each with an unknown id too): the
  universe (2 to 20; searched; from a portfolio or a watchlist; a 21st refused); the estimate
  against the value typed (amber, given back); the weights' bounds; the flags (under a year,
  quoted seldom, no price); the four objectives and their targets; the constraints (100 %
  invested, no short sale, the maximum per security, each security's bounds, the totals by class,
  country, ETF market and currency, added and removed); the capital; the history (1, 3 or 5
  years, weekly or daily); the risk-free rate; the portfolio compared; the correlations (a cell
  typed, Delete giving it back, a value outside -1 to 1); the checks naming the constraints in
  conflict and holding OPTIMISE back; the scenarios (opened, saved on today's data, saved as a
  copy, deleted, a new setup).
- **OPT RES** (`/opt/result`): the six indicators (section 14.6's case: 8.01 %, 5.41 %, 0.65,
  0.56 %); the allocation (whole securities, amounts, risk shares, "max" and "min", the cash
  left); the frontier (25 points, another picked on the curve and from its list); the breakdowns;
  the binding constraints; the comparison; a model portfolio, a portfolio (francs and euros only),
  the trades that adjust one, XLSX and PDF, back to the setup; a reload of the page; a Student.

### Research, network and messages

Flows today: `research`, `admin` (MOD), `directory`, `network`, `messaging`,
`messaging-realtime`, `svt-messaging`, `keyboard`, `news-studio`, `media-payments`.

- **PUB** (`/pub`, `?id=`, `?analyst=`): the filters (subject, country, sector, access, rating,
  sort, free text), combined and kept in the address; All, Purchased, Followed analysts; 20 a page
  and the pages; the preview (summary, locked contents, rating and upside, the price or the
  student price, FREE); a purchase by mobile money (confirmed after about 3 s; a number ending in
  0000 declined; the dialog closed meanwhile) and by card; then the content (the buyer's name as
  watermark, the disclosures, the PDF, the attachment), a rating from 1 to 5, Report content;
  Follow and unfollow; a Data admin and an Admin who cannot buy, told why; the author reading
  without buying; an unknown or withdrawn `?id=`.
- **PUB NEW** (`/pub/new`, `?id=`; K. Atangana, F. Biyong not approved): my publications by
  status, "Update draft"; + New on a company or a country; the earnings of a month and the
  payouts PAY marked; the editor (B, I, H2, H3, list, table, an image uploaded, a CMarket chart
  frozen, a link; pasted from a word processor; undo); the settings (free or paid within the
  Admin's range, the student price, free after a delay, rating or outlook, target, horizon,
  reference price, the three disclosures, the PDF, the moderation); the preview before and after
  purchase; Submit once the disclosures are ticked, the checks by field; Publish update; Archive
  and Withdraw with a reason; the autosave every 10 s and on leaving; a 409 from two tabs; a tab
  closed with changes.
- **NET** (`/net`, `?profile=`): each filter, combined, cleared; the counts (1,177 profiles, by
  type); a profile opened; Contact, Send a message, a profile closed to messages (a request),
  block, report; an unknown `?profile=`; the pages.
- **NET ME** (`/net/me`): the fields saved and cancelled, each limit; the photo (type, size); an
  experience added, edited and deleted; the visibility and the seven rows of "Who can contact
  me", the card's preview following each change; the people blocked, unblocked; a CMarket
  employee by its address.
- **MSG** (`/msg`, `?c=`, `?m=`, `?to=`): the conversations (filter, search); a thread (Enter and
  Shift+Enter, a long message, a link, an address of the site made a link); files (seven chosen,
  five a message, scanned, a virus blocked, downloaded); securities, charts, publications and
  news shared, each card opening its screen; contact requests accepted and declined; groups (made,
  a member added and taken out, who reads it closed at once; never with an SVT); block, report;
  "+ NEW" (an SVT's linked traders, a trader's SVTs); live with the other person in a second
  context (typing, read, presence, the menu's count); a message older than the first 50; an
  unknown `?c=`.
- **NEWS NEW** (`/n/new`; L. Mballa, S. Nana in French): My news by status, its badges and unique
  clicks; the month's earnings; the editor (the headline and its counter, the standfirst or a
  FLASH of 500 characters, the body with images, credits and security cards, the PDF, source,
  author, original link, the rights box); publishing (category, countries with the CEMAC's six,
  securities, language, type; now or at a Douala time, a time already past; Preview, Publish,
  Schedule, Update, Withdraw with a reason; a newspaper reviewed first sending it for review); the
  file import (templates, the drop zone, the last import, its rows in error, Fix row, details,
  Publish); the statements (downloaded, disputed, MPAY's answer).

### RFQ and SVT screens

Flows today: `rfq`, `rfq-trading`, `rfq-agreements`, `rfq-reporting`, `svt-approval`,
`svt-messaging`. Two or three browser contexts at once: the requester, the responder, the SVTs.

- **RFQ** (`/rfq`, `?security=`; T. Bekale, P. Owona, B. Ngoma in French, E. Fouda reading only):
  My SVTs (each status, Add an SVT, a link removed, live); a new request (BTA or OTA, buy or
  sell, the face from the minimum, a BTA in rate and an OTA in price or yield, a settlement among
  the BEAC's next ten days, 1 to 30 minutes, a confirmed SVT, anonymous or not, the curve's
  reference; each wrong value); My request (the countdown, the answers ranked, the allocation,
  the weighted average, Confirm selection at the version shown and after an answer changed
  meanwhile, Cancel request, the 10 minutes of the confirmation, no answer by the end, the
  agreements awaiting the SVTs); the board (the others' requests, an anonymous requester hidden,
  the time left; an answer as a price or a rate with the other worked out, a quantity, an SVT, a
  validity; sent, improved, withdrawn; past its validity); the blotter; the CEO changing nothing;
  the RFQ switched off in ADMCFG (menus and addresses closed) and on again.
- **RFQ AGR** (`/rfq/agreements`), **AGR** (`/svt/agreements`), **the Admin's RFQ**
  (`/admin/rfq`): the filters and saved filters; the count and the total face; sorted and paged by
  the API; XLSX and CSV of every agreement the filters keep, not of the page shown; each reader's
  side (a party, an SVT, the Admin's buyer and seller); the detail (the request and the rank, the
  parties and their SVTs, the security and its CRCT code, the amounts, each approval, the e-mails
  by recipient, the ticket and its fingerprint); the ticket's PDF; Resend to all or to one (in
  Mailpit); a concluded agreement cancelled on both parties' letters, by a Trader or a Manager of
  either; another bank's agreement by its address.
- **SVT** (`/svt`; B. Sima, A. Okala in French): the counters; the agreements to approve by time
  left with their checks (OK, Limit, Link; four eyes); the day's decisions; the trader links; the
  settings (the Admin's window and cut-off shown, the four-eyes threshold, the approvers, the
  default limit, the channels; edited in place; each wrong value); the agreement picked: Approve,
  Reject with each of the six reasons ("other" and its text), both approvals and their
  countdowns; live (a new agreement, the reminder 15 minutes before the deadline with
  `page.clock`, a decision); an approval that expires; after the cut-off, the deadline the next
  business day at 10:00.
- **TRD** (`/svt/traders`): the bank's requests, oldest first; confirmed with a daily limit (the
  bank's default offered) or declined; the linked traders (sorted, exported); a limit changed; a
  link removed; "Write to …" opening MSG; live (a colleague's decision, a new request).

### CFG, for each account type

Flows today: `settings`, `network`, `subscription-management`, `account-types`.

- **CFG** (`/cfg`): Profile (name, phone, language and time zone applying at once, a wrong phone);
  Security (the password: its rules, a wrong current one, the other devices' sessions closed; the
  codes by e-mail or SMS; the automatic logout); Subscription (the plan, its modules, the renewal
  or the trial's end, who pays; the plans by month and by year; Choose: a card or mobile money
  followed until confirmed, a transfer and its invoice due in 15 days; a member reading only);
  Organisation (the members, an invitation sent and withdrawn, a role changed, a member removed
  with a confirmation, the last administrator kept); Invoices (each PDF; a transfer still due and
  its date); the SVT's (no subscription nor invoices, its bank's members); F. Biyong's.

### The Data admin's screens

Flows today: `back-office`, `bond-screener`, `eco`, `commodities`, `news-admin`. A. Mbarga; J.
Ekane for a second upload.

- **DATA** (`/data/session`): the session picked and previous, next (a holiday, a weekend, the
  first session, a day ahead); each file's state; the uploads; the templates (CSV and Excel
  downloaded and opened).
- **IMP** (`/imp`, `?import=`): each file type with a good file and a bad one (daily prices,
  indices, BEAC auctions, CEMAC sovereign yields, bond list, bond ratings, ETF profiles, ETF NAV,
  macro indicators, commodity prices, securities, statements): the five steps; the counters
  filtering the rows; the Check column; a changed cell and its stored value; the row to look at;
  "Alert checked"; Publish N rows, held while an error or an alert is left; Fix row; Replace file;
  Discard; Roll back with a reason; New upload; a second upload of a type and session refused,
  with its link; another format, an empty file, a large one, a CSV with `;` and French decimals,
  an Excel file; an unknown `?import=`; what a publish changes on MKT, DES, YCRV, CAL, ECO, CMDTY,
  BS and ETFS, and what a rollback puts back.
- **HIST** (`/data/history`): the period, type, status and dates (from after to), 50 a page, a
  click opening the upload, a rollback from the right-click menu.
- **EODH** (`/data/eodhd`): the connector's state, the loads of seven days by load and result, the
  quota, the 429s, the last error; locally, without a key, its empty state.
- **CORR** (`/data/corrections`, `?security=&date=`): a security and a session (one of the two
  months clicked); open, high, low, close and volume typed again (a high under the low, a
  negative, the same values), the reason required; the log; the description in French and
  English (2,000 characters, empty removes a language), who wrote it; a commodity's names, texts,
  countries and related securities (ten at most); each change in AUDT and on the terminals.
- **NEWS** (`/data/content`): the news and documents tabs; an ARTICLE and a FLASH (500
  characters) with subject, category, countries, language and securities; a document (type,
  title, source, securities, a PDF up to 20 MB, a larger one and another type refused); an edit
  keeping the date; Moderation (reported, then waiting: approve or keep, take down, retype);
  Publishers (the domains); N and DOC after.

### The Admin's screens

Flows today: `admin`, `subscription-management`, `media-payments`, `news-admin`, `rfq`,
`rfq-agreements`, `rfq-reporting`, `fx`, `eco`. L. Mvogo; another Admin for the four eyes.

- **USER** (`/admin/users`, `?id=&type=&status=&sort=`): the ten counters, a click filtering; the
  search by name, e-mail or organisation; the type and status filters; sorting; the pages;
  "+ Create account" of each type (a client, a Data admin, an Admin, an SVT of a licensed bank; an
  address already used; the code in Mailpit); Export CSV of the filters; the details (the type and
  its approval, organisation, subscription, two-factor, publications, sales and reports, research
  bought, the last login and its place, "Reports received"); Change type; Reset two-factor; View
  audit log; Suspend and Reactivate (a reason, a confirmation, never one's own account; the user
  logged out at once); the status requests (the documents in the PDF viewer, Approve, Reject with
  a reason); the moderation queue (Open, Approve, Take down).
- **ANLY** (`/admin/analysts`, `?id=`): waiting, approved and rejected; the documents side by side;
  Approve and Reject.
- **MOD** (`/admin/moderation`, `?id=`): the queue by kind; a publication in PUB's reader with its
  reports; Approve, Take down with a reason; the reported profiles and conversations (read,
  logged; the account suspended; a report dismissed); the news panel.
- **SUBS** (`/admin/subscriptions`): the counters filtering; search, plan, status and expiry
  filters, sorted by expiry, CSV; an account's subscription, payments and invoices (each PDF);
  Extend, Change plan (prorated by the day), Resend last invoice (Mailpit), Suspend and lift it;
  "via organisation".
- **MPAY** (`/admin/media-payments`): the month (previous, next, a month without clicks); the
  statements by newspaper and their total; the global settings; the transfer file; the click
  anomalies (Invalidate, Keep); a statement's status; a change above XAF 300,000 waiting for a
  second Admin, whom the first cannot stand in for; a dispute from NEWS NEW; Release,
  Recalculate, the PDF; a newspaper's settings by month.
- **SRC** (`/admin/sources`): the newspapers by channel (contract, review mode, logo, News
  providers); CMarket AI's review mode and threshold; the views an hour; the ingestion clients (a
  client created, its secret shown once; revoked).
- **PAY** (`/admin/payouts`): the filters (month, status, analyst) in the address; the total due;
  Mark paid with its confirmation (the button, a double click, Enter, the right-click menu); a
  payout already paid; PUB NEW's earnings after.
- **RFQ REP** (`/admin/rfq/reports`): the header of the automatic send; the month's reports by
  business day, other months; a day's PDF summary as sent or to be sent; Send now and Resend (the
  PDF and the Excel in Mailpit), the sends logged; the settings (send time, the BEAC's address,
  the copies, the nil report; each wrong value).
- **ADMCFG** (`/admin/settings`): each panel saved alone, then several together: the quotas of
  each type (empty for unlimited, 0, negative); the research price range, commission and
  moderation; the risk-free rate of each currency; the reference curve; the stale point age (1 to
  3,650); the permission matrix (role by role; the Admin keeps `settings:manage`); the directory
  and messaging (defaults, conversations a day, report threshold); the specialties (added,
  renamed, one in use removed); Macro and FX (FX's table 1 to 20, its matrix 2 to 8, ECO's
  countries 8 at most, the six tiles; moved, removed, added); the RFQ (the switch, the minimum,
  the link's duration, the SVT banks and their address, the approval window, the curve feed and
  its amount from 1 million to 10 billion); each change in AUDT and on the screen it rules; a
  field the API does not send (no "NaN").
- **AUDT** (`/admin/audit`, `?userId=&action=&from=&to=`): the filters (an account picked, an
  action, the dates, from after to); 50 a page; an entry's values before and after; USER's "View
  audit log"; the RFQ compliance export between two days (none in the range).

### The waiting account and the kit

- **F. Biyong** (an Analyst waiting): every page it may open, the reason it waits, no 4xx left
  unhandled.
- **`/_kit`**: it renders locally; absent from the live site.

## Phase 3 · Across pages and accounts

Each on a fresh database, two or three browser contexts at once, every page that shows the result
checked:

1. **Prices**: A. Mbarga publishes a daily prices file: MKT, DES, PORT's values, EQS's ratios, the
   price alerts going off; rolled back, all as before. A CORR correction: everywhere, and kept
   after the rollback of an earlier file; AUDT.
2. **Research**: K. Atangana submits a note; L. Mvogo approves it in MOD; PUB lists it; P. Owona
   buys it by mobile money, S. Mvondo at the student price; ratings; PAY's figures, Mark paid;
   PUB NEW's earnings; a reader's report reaching MOD.
3. **News**: L. Mballa's FLASH, now and scheduled: N live, MKT's news, the security's N tab, an
   alert on its security or country (ALRT's history, the e-mail in Mailpit); its unique clicks;
   MPAY's statement; the newspaper's dispute; the Admin's answer.
4. **RFQ**: T. Bekale asks Bank E for a link; B. Sima confirms it on TRD; T. Bekale requests; B.
   Ngoma answers and improves; T. Bekale confirms; B. Sima and A. Okala approve (one rejects, on
   another run); RFQ AGR for each reader; the four ticket e-mails; a cancellation on both letters;
   RFQ REP's next report; with the curve feed on, YCRV's point.
5. **The SVT's messages**: the link above opens MSG both ways at once; the link removed, the
   conversation stays.
6. **Accounts**: a sign-up of each type that needs an approval, ANLY, then its menu; an SVT
   created by the Admin, its first login; a suspension logging the user out at once and refusing
   the next login; Change type, the menu changing at the next `/me`.
7. **Platform settings**: ADMCFG changes a quota, a permission, the price range, the RFQ switch,
   FX's currencies, ECO's tiles: each user's screens follow at their next `/me`.
8. **Portfolio**: P. Owona makes a portfolio and its transactions, a limit breached sets off its
   alert, the PDF report; shared, M. Ngono and E. Fouda read it; unshared, it is gone for them.
9. **Optimisation**: a watchlist's Optimise, OPT RES, a portfolio made, PORT, Optimise again, the
   trades that adjust it.
10. **Directory**: a contact request from NET, accepted; messages, files, a news item and a
    security shared; the unread counts; a block; a report reaching MOD.
11. **Subscription**: T. Bekale upgrades by mobile money, PORT unlocked; another plan by transfer,
    its invoice in CFG and in SUBS; Extend and Change plan in SUBS, CFG following.
12. **Two tabs of one user**: a logout, a language changed, a layout changed, one form saved from
    both (409).

## Phase 4 · Failures, security, time, browsers

- **Failures**: C11 on every page by the script, each main query in turn answering 500, a timeout
  and an empty list.
- **Network**: offline and back on every live page (MKT, DES, RFQ, SVT, TRD, MSG, N): the hubs
  connect again and subscribe again, no event shown twice.
- **Session**: the access token ending with requests in flight; the renewal refused (the cookie
  removed): the login with `?next=`, then back to the page; the idle logout with a form open.
- **Leaks**: 60 moves across the menu: the heap (Chromium's `performance.memory`) and the hubs'
  subscriptions back where they started.
- **Security**: a script in every text another user reads (the names of watchlists, portfolios
  and groups, alerts, messages, profile fields, publications, news, reasons, file names), shown
  as text and never run; the address of another user's object (a portfolio, a conversation, an
  agreement, an upload, an invoice's PDF) refused by the API and said by the page; a paid
  publication's content absent from every answer before its purchase; uploads (an `.exe` named
  `.pdf`, 21 MB, the EICAR test file); `?next=` to another site.
- **Time**: the browser in Europe/Paris, Africa/Douala and America/New_York with the profile in
  Douala, then the profile in Europe/Paris; `page.clock` at 23:30 and 00:30 in Douala, a Friday
  evening, a Sunday, the night Paris changes its hour: CAL's today, the sessions, the RFQ's
  settlement days and countdowns, the studio's schedule, RFQ REP's send time, "today" in every
  date field.
- **Browsers**: WebKit and Firefox, every page once at 1600 and 390 px (D1 to D7 and the
  screenshots), then the login, a form, a dialog, a chart and a PDF in each.
- **Motion and zoom**: reduced motion on the home page, the ticker and the price flashes; zoom at
  200 % on MKT, DES, PORT, RFQ and USER.

## Phase 5 · Against the spec (on the user's word)

The mockups of `docs/CMarket-developer-spec-EN.pdf` (`pdfimages`) beside each screen's
screenshot at 1600 × 900, with the rules the spec gives each screen: a difference no decision of
the roadmap explains goes to the log (S3 or S4) or to the open questions.

## Phase 6 · The fixes

Once the user has read the log:

- Grouped by cause; a shared component or rule first (`shared/ui`, `format.ts`, the real-time
  clients), as it fixes several pages at once; then S1, S2, S3, S4.
- Each fix with a test that failed before it: Vitest for the logic, a step in the page's
  Playwright flow for the screen; while working, only the checks of what changed.
- A bug of CMarket.Api fixed there, with its tests, in its own commit; when the web needs the
  API's change, the API is released first.
- Commits by theme on `main`, on the user's word; the user pushes.
- At the end, once: the type check, the lint, every unit test, every flow (the usual run and each
  `@fresh-db` spec), the sweep of phase 1 again for every account; this file's record of what was
  found and fixed, ROADMAP, the screens touched, README.
- Once released: the live site read only, as at step 49 (every write blocked, the twelve
  accounts, the widths, axe).

## Order

| Part | Work                                                                               |
| ---- | ---------------------------------------------------------------------------------- |
| 1    | Phase 0; the sweep script; phase 1 for every account, the waiting one, the visitor |
| 2    | Phase 2: outside the terminal, the shell, the market screens                       |
| 3    | Phase 2: the analysis screens, PORT, OPT, OPT RES                                  |
| 4    | Phase 2: research, network and messages, NEWS NEW, CFG                             |
| 5    | Phase 2: the RFQ and SVT screens, the Data admin's and the Admin's                 |
| 6    | Phases 3 and 4 (and 5 if asked); the log read with the user                        |
| 7    | Phase 6: the fixes, then the final checks and the live site                        |

Each part is about one working session and ends with its bugs in the log.

## Known before starting

Carried into the log at phase 0:

- PORT values a line quoted in dollars (IWDA) at a rate of 1 (found at step 42; decision 25 is
  still open).
- CMarket.Api logs `ChatHub.OnConnectedAsync`'s `TaskCanceledException` as an error when a page
  reloads (seen at step 49).
- `rfq.spec.ts`'s fresh-database flows failed once in step 48's run of every flow, cause unknown.
- On the live site the top bar reads "MARKET OPEN" at night: Azure runs CMarket.Api as
  Development, whose `Market:AlwaysOpen` is on; a setting of the deployment, for the user to
  decide.

## Done so far

### Phase 0, 16 November 2026

On `main` at web b3116ce and API b006a0f, both as pushed; the API from a `git archive` copy on
SQLite, a fresh database for each run.

- Type check and lint: clean. Unit tests: 451, all passing. No file over 700 lines.
- Playwright on CMarket.Api: the usual run, 136 flows, all passing (3.6 minutes); the ten
  `@fresh-db` specs on a fresh database each, 23 flows, all passing (`rfq.spec.ts` among them:
  B03 not seen). The API answered no 5xx and logged no error.
- The dev server's log of those runs holds only what the flows cause themselves: the inactivity
  flow's clock moved 30 minutes on (SignalR's "Server timeout elapsed"), the layout flow's
  refused saves, the hubs of a browser context closed mid-connection.
- `npm run build`: no warning. The largest chunks: `i18n` 478 kB (both languages' strings) and
  `ToolButton` 469 kB; to look at with the performance, not a bug.
- `npm audit`: nothing in the production dependencies; 9 moderate in the development tools only
  (`minimatch` under ESLint).
- The sweep script (`scripts/page-sweep/`, `npm run sweep`) needs axe-core: added as a
  development dependency, 4.14.0 (4.14.1 was a day old).

### Phase 1, 16 November 2026

The sweep (`scripts/page-sweep/`): `sweep.mjs` runs the passes, `lib/screens.mjs` lists the 45
screens with what opens each (`expectedFor` reads `/me` as `entities/session` does), the accounts
and each account's pages beyond its menu (the four profiles' tabs, PORT's tabs, the addresses
that name an item, with an unknown id too), `lib/detect.mjs` holds the detectors that run in the
page, `lib/watch.mjs` what is heard (console, page errors, the API's answers, the hubs' frames),
`lib/explore.mjs` the explorer, `lib/report.mjs` the findings grouped by kind and cause into
`summary.md`. Against the API copy on a fresh database, the web copy on port 5174, the browser
in Europe/Paris:

- as each of the eleven accounts, every page it may open in English then French (the profile's
  language switched from the user menu, then back), at 1600 px (each page reached in the app,
  then again by its address) and 390 px, the main account's pages again at 1280, 1279, 1024,
  768 and 320 px; the screens it may not open, by their address; the visitor's pages;
- after each page of the first pass, a neutral page (CFG, HIST, AUDT) to check that the page
  gave back every subscription it took on `/hubs/market` and every conversation it joined;
- the screenshots of the main account at 1600 px in English and 390 px in French, looked at four
  to a picture, and closer where something looked wrong.

The first sweep's detectors missed what a cell's ellipsis does not draw (B16) and controls a box
clips (B13): `detect.mjs` now reports both, and tabs out of their list's view; a second pass at
the narrow widths runs them.

The main pass made 2,748 visits (597 pages across the accounts) in 46 minutes; no page crashed, came
up blank, showed a translation key, `undefined`, `NaN` or an epoch date, stayed loading, answered
a 5xx, gave the wrong one of page, "forbidden" and "locked" for `/me`, or kept a subscription or
a conversation after it closed. Its 2,617 findings fall into 36 groups: B05 to B22 above, and
what follows, which is not a bug:

- the console line Chromium writes for each refused request: the visitor's `/auth/refresh` (401)
  and the waiting account's `/subscription` (404) are by design; the SVT's 403s are B21;
- an unknown id's 404 heard on the first page of the 390 px pass (`/data/session`,
  `/admin/users`): resizing re-mounts the previous page's panels (`/imp?import={unknown}`,
  `/admin/users?id={unknown}`), whose failed query asks again. The sweep now waits for the page
  after each resize;
- the home page's contrast, measured during its intro animation (`motion-safe:animate-rise`):
  once the animations end, axe finds nothing at 1600 or 390 px;
- `/market/status` and `/market/ticker`, refreshed every 60 s, heard three times on an idle page;
- English on French pages that is content or a name: the demo publication's table (Revenue, Net
  income), SEMC's document titles (Articles of association), the ingestion client "CMarket AI",
  the Admin's specialties (English and French side by side, by design), "Trading" (the same in
  French), the logo's "Market", bond names ("ECMR 6.25% 29"); the ticker cut at its edge is B14.

The narrow pass (1,987 visits in 34 minutes: every page of each account at 390 and 320 px in
both languages, the main account's pages at 1280, 1024 and 768 px, without axe) gave B23 to
B30 and widened B13, B16, B20 and B25; each finding was looked at on a screenshot of its panel
before it went into the log. It found no tab out of its list's view: PORT's tabs (B15) are a
`nav` of links, which that check does not read. Two detectors were sharpened after it: a cut is
judged by the text that crosses the box's edge where the box shows (text on the box's own line
gets its ellipsis: ETFS's tickers were wrongly reported; a line a clamp hides is no cut: ECO's
two-line titles), and a designed refusal's console line is no longer a finding.

A fault of the sweep showed then: it gave each page to the first account that visited it, the
Analyst for the 45 screens, even where it saw the refusal only. So the SVT's, the Data admin's
and the Admin's screens, AGR and the portfolios of the Manager and the Student had no
screenshot looked at, no pass at 1280, 1024 and 768 px, and the explorer would have skipped
them. A page's main account is now the first that may open it. Their 92 screenshots (1600 px in
English, 390 px in French) were looked at four to a picture: B31 to B35, and B15, B25 and B29
wider, came from them; two of those (B33, a price wider than its field, and MPAY's figure
behind its currency) are now detected too. Those pages' widths and the visitor's at 1280, 1024
and 768 px run after the explorer.

The explorer took 35 minutes over 110 pages, each as its main account at 1600 px: 1,679
controls clicked and closed again, 104 dialogs or side forms opened, bad values typed in 212
fields. Nothing broke: no page error, no console error, no 5xx, no `undefined` or key on
screen, no script run from a typed value. Thirty controls did not take a click within 2 s; each
had been disabled by one of the explorer's own clicks before, rightly (ECO's sixth economy,
CMP's sixth series, BP's schedule and OPT's setup left incomplete, ADMCFG's "Move up" on the
first country), and the explorer now passes over a control disabled when its turn comes.
Replaying OPT's sequence by hand showed B36.

Last, the pages that had missed them at 1280, 1024 and 768 px (609 visits, in English) and the
visitor's (60 visits, both languages): nothing new, B13, B14, B17, B21 and B23 again; the back
office holds at those widths. The script as committed ran once more (the explorer as the SVT,
the visitor at 1600 px) and reported only what the log holds; axe now waits for the animations
that end, so the home page's fade-in no longer reads as a contrast failure.

### Phase 2, part 2: outside the terminal, the shell, the market screens, 16 November 2026

Scripts in the scratchpad (`p2/`), on the API copy and the web copy as in phase 1, writes allowed;
the codes from the development tools (the API copy logs them: `Notifications:OtpSender` Log),
e-mails therefore not in Mailpit. About 900 checks; B37 to B50 came out of them. What held:

- **Login**: an unknown address answered as a wrong password; five wrong passwords lock the
  account, said at the next try ("Too many wrong passwords: try again in 15 minutes"), the right
  one refused meanwhile; wrong codes count down to "Too many wrong codes"; a new code after 30
  s, the first one then refused; T. Bekale's code by SMS, masked ("+241 ••• ••• 56"); F. Mba
  told the account is suspended, no code asked; Enter sends; `?next=` leads back to `/fx` or
  `/securities/SEMC/gp`, and `//evil.example`, `/\t/evil.example`, `https://…`,
  `/%2F%2Fevil.example` and `javascript:` all stay on CMarket.
- **Reset**: a known and an unknown address answered alike, a code for the known one only; the
  password's rules; a wrong code counted; the old password refused after, the new one taken; a
  code used once refused.
- **Sign-up**: the form's own checks (e-mail, rule, the two passwords, phone, terms); an address
  already used said; a program and a file of 11 MB refused; each of the seven types signed up to
  the end, on a trial of its plan, Analyst, Journalist, CEO and News provider waiting; a CEO
  without organisation and a Student with neither school address nor proof refused, said on
  the field.
- **Home**: the plans' monthly and yearly prices as the API gives them; each type's sign-up
  link with its type chosen; a French browser reads it in French, the switch back too; Pause
  stops the illustration (the photo's parallax on scroll stays, and goes under reduced motion);
  every anchor has its section. **Addresses**: `/app` opens a screen of each type's own (F.
  Biyong, waiting without a plan, lands on a locked MKT: the plan's choice); `/yas/{bond}`
  opens BP. **Public profile**: "Log in to contact" leads through the login back to the
  profile in NET.
- **Shell**: 29 commands open their screen (codes, `semc des`, `ECMR 6.25 2029 YAS`, `cacao`,
  `ECO CMR`, `CMR ECO`, a name); the codes an account has not are refused (B39 aside); the clock
  in Douala time in a New York browser; the user menu's items; MSG's count is the unread
  messages and requests; the active entry lit and in view at 1600 × 900 and 390 px; a reload
  keeps the session; a token past its 15 minutes renewed by the next request; four requests
  refused 401 at once do not end the session. The ticker is a still line of text: no click, no
  motion (the spec asks for neither).
- **MKT**: a watchlist created (a double click sends one request), filled by code and by name,
  never twice the same security, renamed, its columns changed, Escape changing nothing, a
  security removed from the right-click menu, deleted after a confirmation naming it, Cancel
  keeping it; Optimise offered from two securities; "Add to a list" from Top movers; an index
  clicked draws its chart, six periods; movers, FX rows, the calendar's dividends and
  meetings open their screens (auctions and sessions have none).
- **ALRT**: thresholds empty, letters, negative, zero, too large refused; the six types saved;
  the right-click menu's Edit, Turn off and Delete (confirmed by name); the Student stops at
  10; no portfolio alert for the Journalist; an alert set by a hair went off within 10 s, in the
  history and the top bar's count, without a reload; a click in the history marks it read and
  selects its alert; "Create an alert" from a row prefills the security and its last price.
- **FX, ECO, CMDTY, N, CAL, DES**: the cross rates, the yen per 100 and the matrix agree (EUR →
  XAF 655.957); a currency picked is drawn, in the address; CMP stops at five series, saying
  why, and shows their correlations; N's filters combine, sit in the address and survive a
  reload, an article's view is counted once after 3 s, Copy link copies it, Report opens and
  cancels; the documents' search finds; CAL crosses the year's end, keeps its week in the
  address and comes back with Today; GP's lines and levels are saved, kept after a reload and
  cleared; no drawing tools for the Journalist and the CEO; a comparison rebases both series to
  100; "Request a price (RFQ)" on BEAC's BTA and OTA for the Manager and the Trader only.
- **Common checks on the 25 market pages**: C1 (a reload, Back and Forward) and the exports
  (XLSX and CSV open, numbers as numbers) hold, B45 aside; C9 found B41; C10 every Tab stop
  shows its focus (photographed focused and left, since the fields draw their focus on their
  frame) and none is out of sight; C5 found B42 and B43. C11, each query failing in turn (500,
  empty, timeout) on 16 pages, 388 cases: no page crashed, went blank or showed `undefined`;
  the main panels say so with a Retry that brings the data back; B48 and B50 came out of the
  silent ones, the rest are counts, filters' lists or a header's dashes. C8: the network cut
  for 50 s, the status bar reads RECONNECTING from the 30th second, CONNECTED again 25 s after,
  the quotes moving, no panel failed (cut for 12 s, SignalR has not noticed yet).

### Phase 2, part 3: the analysis screens, PORT, OPT, OPT RES, 17 November 2026

Scripts in the scratchpad (`p3/`), with part 2's helpers, on the API copy and the web copy,
writes allowed; the API copy started again on a fresh database before the common checks. About
1,100 checks; B51 to B64 came out of them, and they add pages to B07, B36, B41, B42 and B44.
The API copy's log: no error, no answer in 5xx. What held:

- **EQS and FA**: each list and range criterion against the rows (country, sector, P/E at least,
  at most, between; inverted bounds said, Run and Enter held back), amber while they filter,
  "Criteria changed" until Run; Beta added and removed, the page equal to the API; Reset; nothing
  found said, the lower panels asking for a row. Saved screens: loaded and run, a name used twice
  refused, Delete confirmed by name, Cancel keeping it; none for the Journalist and the CEO, the
  API refusing them too. COLUMNS kept after a reload; the right-click CSV with every row; a click
  feeding the panels below, a bar of the comparison selecting its security, the security first
  in amber, its sector's average dashed, the comparison's figures equal to the results' and FA's;
  the CAGR right, the margins in points; the description's source, EN first, FR marked; DES and
  Back keep the criteria, the selection and the sort. FA by a bond's or an ETF's address says it
  does not apply.
- **ETFS**: each category, issuer and exchange against the rows, the TER, YTD and Sharpe
  thresholds; each result's domicile flag; the five blocks equal to the row (one decimal fewer);
  a name used twice refused; a saved screen back; nothing found said; the profile and Back keep
  the screen.
- **YCRV**: the maturities on a log axis; six curves and the comparison dashed, each offset of
  COMPARE TO named; a country hidden and back; the tooltips name each point's source (auction,
  BEAC model, stale). The calculator: case B, the yield driving, half the face, a date before the
  issue or after the last payment said on the field, answers coming back out of order (the last
  price's yield shown). The auctions' filters.
- **BP**: dirty = clean + accrued, the settlement amount, the present values adding up to the
  dirty price and the total row, the XLSX's numbers, the curve's point, the sensitivity falling;
  the platform's yield replaced, then given back by "Use it"; half the face; case A to the franc;
  YCRV's calculator giving the same price; French decimals; the repayments' total said; `/yas/`
  opening BP.
- **BS**: each criterion against the rows (categories, markets, yield, duration, maturity,
  rating, coupon type); model prices starred; the four blocks equal to the row; a name used twice
  refused; DES and Back; Open in BP; "Request a price (RFQ)" on BEAC's BTA and OTA for the Manager
  and the Trader only, gone once the Admin turns the RFQ off (turned back on).
- **PORT**: the total value equal to its lines and the cash, the weights adding up to 100 %,
  moving live; a portfolio created once on a double click, renamed, shared, limited; the nine
  types (the cash to the franc; a sale above what is held, a date ahead and 2.5 shares refused;
  the realized gain; a dividend offering only shares, a coupon only bonds); a transaction
  corrected and deleted from the right-click menu, the average cost and the realized gain
  following; the import all or none, its errors by line, French numbers, a comma-separated file,
  an empty or unreadable one said; the report followed until Ready and its PDF, its logo checked
  (size, kind, content) and its dates; a 409 from two tabs said; a model portfolio's weights
  checked; the next portfolio open after a delete. The Analyst stops at five (the API answers 409
  at a sixth), the Student holds models only, T. Bekale is offered the plans, M. Ngono and E. Fouda
  read the shared fund and the API refuses each of their writes.
- **OPT and OPT RES**: twenty securities and no more, none twice; an estimate typed in amber and
  given back; each objective and its target, a target out of reach said; constraints by country
  and currency added and removed, a conflict named; history and frequency, daily returns refused
  for a bond quoted seldom; correlations typed, given back by Delete, clamped to ±1 (as the code
  means), a set that cannot hold said; a copy saved and opened. OPT RES: the spec's case (8.00 %,
  5.40 %, 0.65, 0.56 %), Sharpe and VaR computed again, the allocation adding up to the capital to
  the franc and its risk shares to 100 %, 25 points rising, a point picked from the list and on
  the curve, the breakdowns, the trades, the XLSX and the PDF; a real portfolio refused for IWDA
  (francs and euros only); the Student's next steps.
- **Common checks**: C1 (a reload, Back and Forward) on the 13 pages; C5's sorts and the exports
  (XLSX and CSV open, numbers as numbers), B42 and B64 aside; C9 found B41 on four more screens;
  C10 every Tab stop shows its focus, none out of sight. C6 on 23 pages (the analysis screens,
  PORT's six tabs, ten market screens, part 2's left over): a panel made wider and taller from
  its menu, saved, kept after a reload; hidden, shown again from another panel's menu; the default
  back; one column at 1180 px; a change on one of PORT's tabs leaving the next as it was. C11 on
  the 13 pages, each GET failing in turn (500, empty, timeout), 261 cases, and OPT's own requests
  (the check, the run, a frontier point, the export): no page crashed or went blank; the main
  panels say it with a Retry; B58 and B63 came out of the silent ones, the rest are the top bar's
  counts, filters' lists or a header's dashes.

### Phase 2, part 4: research, network and messages, NEWS NEW, CFG, 17 November 2026

Scripts in the scratchpad (`p4/`), with part 2's helpers, on the API copy and the web copy,
writes allowed; the API copy started again on a fresh database before NEWS NEW's last checks,
CFG, PUB NEW and the common checks. About 800 checks; B65 to B78 came out of them, and they
add pages to B07 and B63. The API copy's logs: no error, no answer in 5xx. What held:

- **PUB**: each filter alone and the four combined against `GET /library` (the count, the
  titles, their order), kept in the address and after a reload; the free text with and without
  accents ("Société", "Societe"); the three sorts; the seven pages, the last holding eight, a
  filter starting again at page 1, nonsense in the address ignored; Purchased, Followed analysts,
  `?analyst=` and "All the analysts". A paid note before purchase: summary, contents locked, no
  PDF, attachment or rating. Mobile money: a wrong number said, a double click on Pay starting one
  payment, confirmed about 3 s later on the note (B65 elsewhere), a number ending in 0000 declined
  then Try again; a card confirmed in 3.4 s; the note bought: the buyer's watermark, the
  disclosures, the PDF naming the buyer; a second purchase refused (409). The Student pays XAF
  10,000 instead of 25,000. A rating of 3 then 5 counted once, the average moving, kept after a
  reload; a report sent once on a double click, a second one kept as one by the API; Follow and
  unfollow. The Journalist, the CEO and the News provider buy, as the spec allows; the SVT, the
  Data admin and the Admin are refused by the API too (403), PUB being a client screen; the author
  reads the note without buying, and can neither rate it nor follow the own profile (403, 409).
- **PUB NEW**: the list by status against the API, "Update draft" on SEMC; + New with no
  subject said, on a company or one of the six countries; the month's earnings and the payouts
  against the API (B09 still there). The editor: 160 and 800 characters said; bold, italic, H2,
  H3, a list, a table, undo; a link opening in a new tab (noopener), `javascript:` refused; a
  paste from a word processor cleaned of its styles (B77 for its pictures); an image (a PDF and
  2.5 MB refused on the spot); a chart frozen, "Choose a security." without one. The settings:
  the Admin's range (XAF 2,000 to 100,000), the student price below the price, free after 1 to
  36 months, the target, the horizon, saved. Submit held back until the three disclosures, then
  each missing field said; the reader preview before and after purchase, watermarked; the
  autosave within 10 s and on leaving; a 409 from a second tab said, with Reload; a tab closed
  with changes asks first; Publish update once the disclosures are ticked, the buyer reading the
  new version; Withdraw asking a reason, the note out of the library, its buyer keeping it. F.
  Biyong, not approved, reads that an Admin checks the status; the API refuses a draft (403).
- **NET**: the 1,177 profiles and each type's count, each type alone and two together, each
  country, specialty, organisation and language at the count its option shows, combined, kept
  after a reload, Reset; "Only profiles I can contact" (no card closed to the viewer), the
  analysts of the last 90 days; the three sorts; the free text with and without accents, the
  staff never found; the 59 pages, the last holding 17. A profile against the API, kept in the
  address after a reload, its PUB link and Back; each card's button as its contact mode; Contact
  and a request leading to MSG, a closed profile saying so; a report, a second one refused ("You
  already reported this profile."); an unknown, a malformed or an employee's `?profile=` said.
- **NET ME**: a change saved, the directory showing it; each field's limit (80 characters, the
  e-mail, the phone, LinkedIn, About at 600); eight specialties at most; the photo (a GIF, 2.2 MB
  and a fake PNG refused, a PNG shown in the card and the directory); an experience refused with
  no title, a start after its end, 1900 or 2031, then added once on a double click, edited (to
  this day), deleted after a confirmation; the seven rows of "Who can contact me" followed by the
  card from each viewpoint and by the directory (the Student then sees "No"); the phone hidden
  and the e-mail shown as a Student reads them; Hidden: out of the directory, the profile 404; a
  person blocked, then unblocked from the list.
- **MSG**: Enter sends and Shift+Enter adds a line, kept in the message and live on the other
  side; 4,001 characters held back, 3,999 sent whole; the site's own address made a link in the
  app (other sites' stay text, by design), `javascript:` and HTML shown as text; a wrong type,
  10 MB and more refused on their chips and left out of the message; a file scanned, downloaded
  the same, in the other side's shared files; a chart, a paid note (its preview only, for P.
  Owona who had not bought it) and a news item from N shared, each card opening its screen; the
  tabs; the search (any case); odd `?c=` and `?to=` said. A request declined (the requester
  keeps waiting, B70); a report, a second one refused; a block closing the conversation (R.
  Tamba refused by the API, 403, the profile 404; R. Tamba's page says so at the next send and
  after a reload), unblocked; muted; a conversation kept open after the rules changed; a group
  made, a member added from the search and one taken out (closed for L. Fotso); 60 messages loaded
  50 then all, in order; the Student's sixth new conversation of the day refused (429, said in
  the page); a trader's group refusing a second member once an SVT is in.
- **NEWS NEW**: each tab's count against the API, the unique clicks row by row, the month's
  earnings; the limits said (headline 150, standfirst 400), the original link (`javascript:` and
  `ftp:` refused); an image refused with no file, no credit, a GIF or 2.2 MB, then inserted with
  its credit; a security card; the PDF (a PNG and 10 MB refused); CEMAC (6) ticking the six and
  unticked when one goes; ten securities at most; a time already past refused; the preview;
  Publish, Update and "Updated on" in N; "Send for review" once the Admin reviews Media I first,
  then "Waiting for CMarket's review"; the templates (CSV and XLSX), a wrong file said, a file
  with a bad row checked (four errors named on row 4), its details, its two valid rows
  published; the statements against the API. S. Nana's studio in French, the drop zones'
  messages included.
- **CFG**: each account type's panels and plan against the API (the SVT without Subscription
  and Invoices, its bank's members; F. Biyong offered the plans); the profile's checks, the time
  zone and the language applied at once; SMS codes off without a phone; the password's rule and
  each refusal on its field, a new password closing the other session (the old one refused,
  401); the logout after 30 minutes without activity, its warning a minute before (on a fake
  clock); the plans by month and by year (yearly −17 %), a card checkout's VAT and total, the
  plan and its invoice; an invitation (a wrong e-mail, a member's in any case said), sent once on
  a double click, withdrawn; the last administrator kept (409); a role changed; a member removed
  after a confirmation, the seats following, L. Ella's plan gone with the organisation; the
  invoices' five PDFs.
- **Common checks**: C1 (a reload, Back and Forward) on the seven pages; C5's sorts (CFG's
  invoices) and NEWS NEW's templates (CSV and XLSX open); C9 switched on the page, nothing left in
  English; C10 every Tab stop shows its focus, none out of sight (the "Tab moves on" flags are
  repeated names: radio groups, headlines alike). C6 on the seven pages: a panel made wider and
  taller from its menu, saved, kept after a reload; hidden, shown again from another panel; the
  default back; one column at 1180 px. C11 on the seven pages, each GET failing in turn (500,
  empty, timeout), about 150 cases: no page crashed or went blank; the main panels say it with a
  Retry; B74, B75 and B63's three lists came out of the silent ones, the rest are the top bar's
  counts and filters' lists.

### Phase 2, part 5: the RFQ and SVT screens, the Data admin's and the Admin's, 17 November 2026

Scripts in the scratchpad (`p5/`), with part 2's helpers, on the API copy and the web copy,
writes allowed, on one database started that morning. CMarket.Api's e-mails go to its log
(`EmailSender: Log`), read there rather than in Mailpit. About 1,500 checks; B79 to B94 came out
of them, and they add pages to B07, B18, B41, B66 and B76. The API copy's logs: no error, no answer
in 5xx. What held:

- **RFQ**: the form against `/rfq/setup` (the BTA in rate, the OTA in price or yield, the ten
  settlement days without a weekend, the confirmed SVTs) and the curve's reference against
  `/rfq/pricing` at two dates; each wrong face amount said; a request published once on a
  double click, on the other trader's board at once with its time left counting, an anonymous
  requester hidden on the page and in the API; the answer's checks (a value, a quantity from
  the minimum to the face, whole francs), the worked-out yield and price equal to the API's; an
  answer on the requester's page 62 ms after it was sent, ranked, the selection and its
  weighted average following each improvement; a worse price refused on its field; a stale
  selection refused (409), shown again, then confirmed; a cancellation asking first, off the
  board at once; an answer of one minute marked expired and out of the selection; a request of
  one minute without an answer waiting ten minutes for "Confirm before", as the spec says. My
  SVTs against `/me/svt`, Add an SVT (the SVTs without a link in force, none chosen said, once
  on a double click), a removal asking first; `?security=`; P. Owona without a confirmed SVT
  reading the board only; E. Fouda's organisation requests, no button (403 from the API); the
  RFQ switched off (menus, routes and API closed, the SVT's three screens too) and on again.
- **RFQ AGR, AGR, the Admin's RFQ**: the count, the total face and the rows against
  `/rfq/agreements` for each status, e-mail status, side, type, role, SVT, trader, security,
  country, face range, search and period, two statuses together; each column sorted by the API
  both ways; the CSV and XLSX of every agreement kept (numbers as numbers); the period and face
  checks; the detail, the ticket's PDF, Resend to all and to one, a cancellation needing the
  reason and both letters (a letter over 10 MB refused), once on a double click; another bank's
  agreement refused (404). The SVT reads the agreements naming its bank without RFQ's tabs; the
  Admin buyer and seller, no side nor role; E. Fouda the ticket only (Resend 403).
- **SVT**: the agreements to approve by deadline and the decisions against the API; the four-eyes
  threshold's limits and the default limit, saved and put back; a new agreement on the page at
  once; Approve, A. Okala's approval in French concluding it, read at once; the six reasons,
  "other" needing its text, 500 characters at most, rejected once on a double click; after the
  Admin's cut-off, the deadline the next business day at 10:00 (19:24:24 left).
- **TRD**: the requests oldest first; each wrong limit said, the bank's default offered; P.
  Owona confirmed and able to publish without a reload, L. Ella declined and told at once; the
  linked traders against the API, sorted; a limit changed; "Write to" opening MSG; a removal
  read by its trader at once; M. Ngono's request appearing live.
- **IMP, DATA, HIST, EODH**: each of the fourteen types' template checked, and a broken copy (a
  required value emptied, an unknown code, a word for a figure) held with each row's reason; a
  comma file, French decimals and the Excel template read; a text file, 6 MB, an empty file, a
  header only and a PDF named .csv refused with their reason; a second upload of a type and
  session refused with its link; the counters filtering the rows; Fix row checking the file
  again; Publish held until each alert is ticked; the price published, then rolled back with
  its reason, the terminals' history following both ways. DATA's previous and next over a
  weekend, the twenty-eight templates opened with their columns; HIST's type and status against
  the API, a row opening its upload, Roll back from its menu; EODH against the API (the demo's
  runs).
- **CORR**: each wrong value said; a correction with its reason, once on a double click, stored,
  in the log with before and after, in AUDT and in the terminals' history; the description
  emptied in both languages removed; a commodity saved.
- **NEWS**: the news item's limits said; published, edited with its date kept; a PNG and 21 MB
  refused as documents; Moderation's queue.
- **USER, ANLY**: the type and status filters and the counters against the API; Export CSV of the
  filters; accounts created of four kinds, once on a double click, their invitations in the log,
  an address in use refused; the details against the API; a suspension needing a reason, the
  hubs closed and the user sent to the login at the next request, the login refused (403), then
  Reactivate; one's own account refused (409); Change type and Reset two-factor, each in AUDT;
  ANLY's three tabs, Approve asking first, Reject needing a reason.
- **SUBS, PAY**: each plan, status and expiry filter against the answer the page gets; Export
  CSV of the filters; Change plan prorated by the day, as the spec says; Extend refusing an
  earlier day; Suspend and lift; Resend last invoice in the log. PAY's filters kept in the
  address after a reload; Mark paid asking first; a payout already paid refused (409).
- **MPAY, SRC**: the statements' total against the rows; an anomaly invalidated with its reason,
  the statement computed again; the PDF and the transfer files; each wrong rate and cap said; an
  approval above XAF 300,000 waiting, L. Mvogo able to drop it only, O. Ntoutoume confirming it
  (in French); a month without clicks at zero. SRC's newspapers by channel, CMarket AI's limits,
  an ingestion client created (its secret once), revoked.
- **RFQ REP**: the business days of November and October against the API, a day as sent, its PDF
  and Excel (18 columns), Send now and Resend asking first and logged, the BEAC's address
  checked.
- **ADMCFG, AUDT**: no "NaN"; the research prices, the commission, the risk-free rates and the
  RFQ's amounts said when wrong; a quota saved, kept after a reload, in AUDT; the Admin's
  "Settings and permissions" locked on; a specialty added, a name in use refused, removed, one
  in use not removable; ECO's countries stopping at eight. AUDT's actions against the API, an
  entry's values before and after, the RFQ export of two days without events (its header).
- **MOD**: the queue's tabs; a reported note read with its report, taken down with its reason
  (out of PUB), a first note approved (in PUB); a reported conversation read only on demand,
  reports dismissed; news kept, approved, retyped after a confirmation.
- **F. Biyong and `/_kit`**: the seventeen entries of F. Biyong's menu, the modules not in a
  plan locked with their reason and the plans' link, PUB and NET open, MSG and PUB NEW saying
  the status waits for an Admin, CFG's `/subscription` 404 handled (part 1); `/_kit` renders
  for an account and sends a visitor to the login.
- **Common checks**: C1 (a reload, Back and Forward) on the 22 pages, IMP opening its latest
  upload in the address by design; C9 switched on the page, the tables' translated cells left
  in English on thirteen of them (B41), nothing else; C10 every Tab stop shows its focus (MPAY's
  month draws it on its frame), none out of sight; C5's sorts and exports (B94; the tables the
  API sorts checked by hand, B81). C6 on the 22 pages: a panel made wider and taller, saved,
  kept after a reload, hidden and shown again, the default back, one column at 1180 px (TRD,
  HIST and PAY hold one panel). C11 on the 22 pages, each GET failing in turn (500, empty,
  timeout), about 560 cases: no page crashed or went blank (one crash came with the Mac's
  network changing and did not come again); the main panels say it with a Retry; the silent
  ones are the top bar's counts, the filters' lists, the counters and tiles (a dash), the RFQ's
  curve reference and RFQ REP's header.

### Phases 3 and 4, part 6: across pages and accounts; failures, security, time, browsers, 17 November 2026

Scripts in the scratchpad (`p6/`), with part 2's helpers, on the API copy and the web copy, a fresh
database for each flow or group of checks, the API copy sending its e-mails to Mailpit
(`Notifications__EmailSender=Smtp`) and, where only the accounts should move the prices, without
the demo market's simulator. About 600 checks; B95 to B102 came out of them, and they add pages to
B11 and B85. Phase 5 was not asked for. What held:

- **Prices**: A. Mbarga's daily prices file of the day (SEMC 53,500, BANGE 27,500) reached K.
  Atangana's MKT, the ticker, DES and EQS's change and P. Owona's PORT without a reload, and the
  API; both SEMC alerts went off, the e-mail one in Mailpit; rolled back, every page as before. The
  rolled-back file published again, then CORR's correction of SEMC's session (53,200) everywhere at
  once; the file rolled back again: SEMC keeps 53,200 (the stored session's source "correction",
  no file), BANGE as before; AUDT holds the publication, the correction (Close 53,500 → 53,200
  with its reason) and the rollbacks.
- **Research**: K. Atangana's paid note on SEMC (XAF 15,000, students 5,000) published at once,
  in P. Owona's PUB after a reload; P. Owona bought it by mobile money, S. Mvondo at XAF 5,000,
  each reading the whole note at once; rated 4 and 2: 3.0 from 2 in the API, PUB and PUB NEW;
  20,000 of revenue, 4,000 of commission (20 %), 16,000 net alike in the API, PUB NEW's earnings
  and PAY; the month in progress not payable ("Select a due payout to mark it paid."), October
  marked paid and read "Paid on 17/11/2026" in PUB NEW after a reload; P. Owona's report in MOD
  with its reason; C. Nguema's first note approved, first in PUB.
- **News**: L. Mballa's FLASH on SEMC and Cameroon in K. Atangana's N, MKT's news and DES's N tab
  without a reload, both alerts in the notification centre, the e-mail of the Cameroon alert with
  its Douala time; one scheduled three minutes ahead published at its minute, live the same way;
  unique clicks once per reader, excluded as two accounts on one address (the copy's 127.0.0.1);
  October's statement approved by two Admins, disputed within its 15 days, answered "Maintain",
  each step in the newspaper's notification centre.
- **RFQ**: P. Owona's link to Bank G asked, e-mailed to M. Ondoa in French, on TRD at once,
  confirmed: P. Owona's My SVTs and form follow live; T. Bekale's request through Bank D, B.
  Ngoma's answer through Bank E and its improvement, the selection live, confirmed; both SVT pages
  at once, B. Sima's approval then A. Okala's concluding it, read live; RFQ AGR alike for the four
  readers and the Admin; the approval e-mails, four tickets (the traders, both back offices, each
  side right, in French where the reader is), the rejection told to both traders, a cancellation
  on both letters read by every side with its four e-mails. With the curve feed on, the
  agreement's point stored but the file's point of the same day kept (decision 27). RFQ REP's day
  closes at its send time; Resend reached the BEAC.
- **The SVT's messages**: M. Ondoa wrote from TRD, P. Owona answered, live both ways, and found
  M. Ondoa in a new conversation; the link removed, P. Owona's My SVTs follows at once and the
  conversation stays open on both sides (step 48).
- **Accounts**: the four sign-ups that wait (analyst, journalist, CEO, news provider) in ANLY,
  approved there; an SVT created in USER, its invitation in Mailpit (French, the reset to choose
  a password), its first login on SVT; a suspension refusing the next login, Reactivate needing a
  reason; Change type: the menu at the next reload, the API refusing the old token's rights at
  once.
- **Platform settings**: a quota, a permission, the research price range, the RFQ switch, FX's
  currencies and ECO's tiles each reach the users at their next `/me` (a reload), the API at once.
- **Portfolio**: an issuer limit breached by a buy notified within 30 s and by e-mail; the PDF
  report, refused to M. Ngono (404); shared: M. Ngono's and E. Fouda's selector and page (Read
  only) after a reload; unshared: gone (B11), refused by the API.
- **Optimisation**: OPT from the watchlist with its nine securities; a portfolio made from the
  allocation at its weights; PORT's Optimise with its holdings; the trades dialog on that
  portfolio, each trade's held ± quantity equal to its target.
- **Directory**: S. Mvondo's request from NET to M. Ndong, accepted; a message, a file, SEMC and a
  news item read on the other side; a block closing the conversation (403 "Conversation closed");
  the report in MOD.
- **Subscription**: T. Bekale's Professional by mobile money (B99): PORT open at once, for L. Ella
  of Bank C after a reload; a plan by transfer with its invoice in CFG and SUBS; Extend and Change
  plan (prorated) followed by CFG; PORT locked again with its reason.
- **Two tabs**: a logout ends the other tab at once; a layout and a language reach the other tab
  at its reload; two tabs hiding panels in turn keep both.
- **Failures**: C11 ran in phase 2 on every page (parts 2 to 5).
- **Network**: seven live pages (MKT, N, DES, MSG, RFQ in French, SVT, TRD) offline 45 s with the
  demo market on: "Reconnecting", then connected within 40 s, the hubs' events again; what
  happened offline (a request, a message, an agreement, a link request, a news item) shown without
  a reload, once; the next events live, once.
- **Session**: the refresh cookie gone and a request refused: the login with `?next=`, then back
  on the page; idle: "Still there?" at 29 minutes, the logout at 30 with `?next=` to PUB NEW's
  draft, autosaved before.
- **Leaks**: 60 and 120 moves across the menu: the quote subscriptions back to MKT's 16, the
  elements as many, the same sockets; the heap grows with the screens' code and caches and levels
  off (between MKT and EQS: 45.0, 45.6, 45.6 MB).
- **Security**: a script in eleven texts that another account reads (a watchlist, a shared fund,
  a group, messages, a file's name, a profile, a note, a FLASH, a rejection comment) shown as text,
  nothing run; another user's portfolio, conversation, invoice, alert, watchlist refused (404),
  an upload (403), nothing changed; a paid note's paid part in no answer before its purchase; an
  .exe named .pdf and 21 MB refused (B102 aside); `?next=` to another site in part 2.
- **Time**: the top bar's clock in Douala time in Paris, Douala and New York browsers and at 00:30
  on a fake clock; with the profile in Paris, AUDT's times right on both sides of 25 October and
  ADMCFG's last change in summer time.
- **Browsers**: WebKit and Firefox, eight accounts at 1600 and 390 px in English (601 visits
  each): no page error, blank page or raw key; their finds are Chromium's (B14, B24, B30, B33, the
  SVT's `/indicators` 403, the specialties' French names, EODH's Load at 390 px). In each, the
  login, a form (a new alert), a dialog (the focus inside, Escape, the focus back), DES's chart, an
  invoice's PDF. The sweep takes `--browser`; WebKit keeps no Secure cookie over
  http://localhost, so there the sweep drops that flag from the session cookie (production runs
  https).
- **Motion and zoom**: under reduced motion the home page runs no animation (47 without), the
  ticker stays a still line, MKT's prices still flash their 400 ms background (a colour, nothing
  moves; spec section 8). At 200 % (800 × 450 CSS pixels) MKT, DES, PORT, RFQ and USER scroll
  no sideways, cut nothing and keep their menu.

### Phase 6, part 7: the fixes, 18 November 2026

The bugs fixed by cause, the shared ones first, each with the test that failed before it (Vitest,
an Application test of CMarket.Api, or a step of a Playwright flow), in the web's working tree and
the API's; commits on the user's word. What stays open is at the end.

- **`DataTable`** (`shared/ui`): the rows are built again when the columns change, so a cell, the
  sorting and the export read the language and the clock of now (B41, B80); `aria-sort` on the
  sorted header (B43); a server's order flips on the third click, never asks for none, and the
  whole header sorts (B81); words sort as a dictionary does, accents and case aside (B94); a unit
  of a few letters after a figure counts as part of it (B24); a cell of tags widens its column as
  a figure does (B30). Tests: `DataTable.test.tsx`, `dataColumns.test.ts`.
- **Live values**: the indices, the movers, the watchlists and EQS's results hand the table the
  values their cells show (`useLiveQuoteRows`, `useLiveIndexRows`), so a sorted column follows them
  (B42); EQS moves its market cap, P/E, P/B and yield with the live price (B95). Tests:
  `entities/quote/model/hooks.test.ts`, `liveRow.test.ts`.
- **`Panel`**: the title gives way first, then the options wrap onto more lines of the bar, at
  every width, their start kept in view (B13, B28).
- **Menus** (`ContextMenu`): an entry with a tick is a `menuitemcheckbox`, or a `menuitemradio`
  in a group (languages, accounts, portfolios), with `aria-checked` (B44); the flows pick them by
  these roles. Test: `ContextMenu.test.tsx`.
- **`Dialog`**: a dialog's submit stops at the dialog, so a confirmation inside a form no longer
  submits the form (B79). Test: `ConfirmDialog.test.tsx`.
- **`Button`**: a submit button, or one showing a request's progress, takes the first click of a
  double click only (B76). Test: `Button.test.tsx`.
- **Errors**: an API error says its first field's message before its title, "Invalid request"
  (B49, B55, B58, B69); `QueryView` offers no Retry for an answer the server will give again (4xx
  but 408 and 429; B07, B55); `InlineError` says a part of a panel that could not be read, with
  Retry: saved screens, scenarios, people blocked, an analyst's publications, the last news import
  (B63). Tests: `problem.test.ts`, `retry.test.ts`.
- **GP's drawings**: nothing is drawn or saved until the user's lines are read; a failure says so
  with Retry (B48, S1). Tests: `useDrawings.test.tsx`; `monitoring.spec.ts`.
- **PUB's purchase**: the payment is followed above the screens to its end, whatever note is
  opened meanwhile (B65). Tests: `purchaseFollowUp.test.tsx`; `research.spec.ts`.
- **PUB NEW's editor**: a picture pasted from another program is left out, and the toast says why
  (B77). Test: `apiImage.test.ts`.
- **ECO**: the comparison is sorted and exported in its rows' units, people in millions (B45);
  the country bar says a failure with Retry, no endless tiles (B50); the tiles' long words break
  (B20). Test: `macroFigures.test.ts`.
- **Profile**: the language from the user menu and the codes' channel are written over the
  profile as the server holds it (B100). Test: `entities/session/api/queries.test.tsx`.
- **Uploads** (CMarket.Api): a publication's attachment, a news item's file or import, a document,
  a newspaper's logo, a cancellation's letter and a sign-up's documents are scanned before they are
  stored, a virus refused (400), the scanner away 503 (B102, B38; `UploadScanner`). Tests:
  `RegisterTests`, `StudioTests`, `NewsStudioTests`, `RfqAgreementsTests`.
- **Real time**: MKT asks the session summary and the movers again together every 15 s at most
  while prices move (B06); a newspaper's statements are read again with each notice, MPAY's every
  minute (B97); the buyers of an updated note get a notice (B78, CMarket.Api) and its line reads
  "Updated". Tests: `useMarketRealtimeSync.test.tsx`, `useStatementRealtimeSync.test.tsx`,
  `AnalystsAndEarningsTests`.
- **Narrow windows**: PORT's tabs take their line, scroll to the tab shown and fade where tabs are
  hidden (B15, `ScreenTabs`, which also keeps OPT's within the page, B26); PORT's codes end in an
  ellipsis (B16); news tags give way to an alert's subject (B23); key data, EODHD's and the
  calculator's figures keep their digits (B25); the security header's row wraps (B27); RFQ AGR's
  status comes after the time (B31); IMP's counters and steps, CORR's fields (B32, B33); USER's
  and SUBS's tiles (B29); text columns keep a readable width (B34); ADMCFG's quotas (B35); the
  ticker shows whole entries only (B14).
- **Accessibility**: a button's visible text starts its name (B05, `toolName.test.ts`); the
  employees' grey lightens on a selected row (B22).
- **Forms and inputs**: FX's converter says what amount it takes (B49, `amount.test.ts`); YCRV's
  calculator says an input out of range, shows no stale result and settles on the bond market's
  calendar (B51, B52, `calculatorForm.test.ts`); BP names its inputs out of range and shows no
  other bond's figures (B54, B56, `pricingForm.test.ts`); ADMCFG's quotas are whole numbers from 0,
  the API's error on its field (B91); RFQ AGR's Reset empties the fields and Save says the criteria
  refused (B82, B83); HIST and AUDT say an inverted period (B90).
- **OPT**: the checks say why a setup cannot be checked, or that they failed (B36, B58,
  `setup.test.ts`); a scenario's name is the user's once (CMarket.Api, 409) and a new result is
  named as a copy (B59, `OptimizerUseCaseTests`); OPT RES keeps a saved scenario in its address
  (B60, `optimizer.spec.ts`); an unknown list or id is said (B61); a capital that buys nothing is
  said (B62).
- **Each its page**: the command bar says a code the account may not run and an unknown function,
  and offers the functions of the security typed (B39, B40, `smoke.spec.ts`); the profile offers
  the tabs and indicators the account may read (B21); NET ME and CFG's profile ask before leaving
  unsaved changes (B68, `LeaveGuard`, `network.spec.ts`); the alert and watchlist forms close on a
  screen change (B47); MSG joins a conversation once it is known (B08) and says one's own address
  (B69); PORT and FX say an item they replace (B11); CMP ticks each year once (B10,
  `timeTicks.test.ts`); the home footer follows the session (B37, `home.spec.ts`); PUB NEW's nil
  commission (B09); ETFS sorts AUM in francs (B64, `aumInFrancs.test.ts`); a page past the last
  goes to the last (B66); PUB's unknown analyst (B67); "not open to your account" (B85); IMP's
  years (B87, `useImportText.test.ts`); DATA's "today" (B89); Change type within the family (B92,
  `accountTypes.test.ts`); SUBS's counters say they count accounts (B93); a BTA has no coupon
  (B53); PUB's list reads "Updated" for a buyer (B78).
- **CMarket.Api**: IMP's templates pass their own checks (B88, `BondFilesImportTests`); a file
  rolled back is named so (B96, `ImportCycleTests`); a suspended account's refresh says so (403)
  and the login page with it (B98, `SessionTests`, `session.test.ts`); the chat hub ends a
  connection the page left without logging an error (B02).

Checked: the type check, the lint, 492 unit tests; every Playwright flow (139 and each
`@fresh-db` spec); CMarket.Api's classes touched. Still open: B18 (the API writes its messages in
English, which a French page shows: a step of its own, to translate them by the user's language);
B01 (PORT values a dollar line at 1, a "Still to do" of step 42); B99 with B73 (a client's change
of plan is not prorated: to decide); the "To decide" rows; B03 and B04.

## Bug log

| #    | Page                                                 | Who · language · width                   | Sev. | What happens                                                                                                  | Status      |
| ---- | ---------------------------------------------------- | ---------------------------------------- | ---- | ------------------------------------------------------------------------------------------------------------- | ----------- |
| B01  | PORT                                                 | any                                      | S2   | A line quoted in dollars (IWDA) is valued at a rate of 1 to the franc                                         | Known, open |
| B02  | Every page (CMarket.Api)                             | any                                      | S4   | `ChatHub.OnConnectedAsync`'s `TaskCanceledException` logged as an error when a page reloads                   | Fixed       |
| B03  | RFQ's flows                                          | —                                        | S3   | `rfq.spec.ts`'s `@fresh-db` flows failed once at step 48                                                      | Not seen    |
| B04  | Top bar, live site                                   | any                                      | S3   | "MARKET OPEN" at night: Azure runs the API as Development, `Market:AlwaysOpen` on                             | User's call |
| B05  | Home, login pages, `/p`, ECO, PUB NEW, NEWS NEW, MSG | visitor; K. Atangana; L. Mballa · en, fr | S3   | A button's visible text is not in its accessible name (WCAG 2.5.3, level A)                                   | Fixed       |
| B06  | MKT                                                  | any                                      | S3   | Session summary and Top movers lag the live quotes by up to a minute, so their counts disagree                | Fixed       |
| B07  | DES, PUB, BP, RFQ AGR, IMP with an unknown id        | K. Atangana · en · 1600                  | S4   | An item that does not exist offers "Retry"; IMP says nothing                                                  | Fixed       |
| B08  | MSG with an unknown `?c=`                            | K. Atangana · en · 1600                  | S4   | The page joins an unknown conversation on `/hubs/chat`, which refuses it                                      | Fixed       |
| B09  | PUB NEW                                              | K. Atangana · en · 1600                  | S4   | The month's earnings read "CMarket commission − 0 XAF"                                                        | Fixed       |
| B10  | CMDTY's CMP                                          | K. Atangana · en · 1600                  | S3   | The chart's time axis repeats its years: 2022, 2022, 2023, 2023, 2023…                                        | Fixed       |
| B11  | PORT, FX with an unknown id; PORT not shared         | K. Atangana · en · 1600                  | S4   | An unknown or no longer readable portfolio, an unknown currency, is replaced without a word                   | Fixed       |
| B12  | OPT from a portfolio                                 | K. Atangana · en · 1600                  | S4   | Every correlation of the nine securities reads −0.03: the demo's prices move independently                    | To decide   |
| B13  | DES's GP                                             | M. Ngono · en · 1024, 768                | S3   | The chart's toolbar runs out of its panel: the drawing tools, UNDO and CLEAR out of reach                     | Fixed       |
| B14  | Ticker tape, every screen                            | any · below 1600                         | S4   | The last entry in view is cut mid-word ("SA" at 390 px), the rest hidden                                      | Fixed       |
| B15  | PORT                                                 | K. Atangana · fr · 390                   | S3   | The tabs scroll in a strip one tab wide beside "+ New transaction", no sign of the other five                 | Fixed       |
| B16  | PORT's positions                                     | K. Atangana · fr · 390                   | S3   | Security names cut short with no ellipsis: "REGIONAL", "GAB 6.50", "ECMR 6.2"                                 | Fixed       |
| B17  | PORT, MKT, CFG, DES, home                            | K. Atangana; visitor · fr                | S3   | Reference data in English on French pages: sectors, index names, plan names, "Free float"                     | To decide   |
| B18  | OPT, RFQ, SUBS and every toast                       | K. Atangana · fr · 390                   | S3   | The API's English detail inside a French message: "Le scénario ne s'est pas ouvert : No scenario …"           | Open        |
| B19  | Every screen (`/hubs/chat`)                          | K. Atangana · en, fr                     | —    | The chat hub connected 118 times in a session where the market hub connected 109                              | Not a bug   |
| B20  | ECO                                                  | K. Atangana · en, fr · 320               | S4   | Tile titles cut: "GOVERNMENT DEBT / GDP" by 2 px, "EXPORTATIONS / PIB" loses its S (10 px)                    | Fixed       |
| B21  | A security's profile, its tabs                       | B. Sima (SVT) · en, fr · any             | S3   | Every tab offered, the analysis refused: FA and ANA say "not allowed", MA20/MA50 on with no line              | Fixed       |
| B22  | USER, the selected account                           | L. Mvogo · en, fr · 1600, 390            | S3   | An employee's type ("Admin") in grey on the selected row: 3.4:1, WCAG 1.4.3 asks 4.5:1                        | Fixed       |
| B23  | ALRT's history, MKT's alerts                         | K. Atangana · en, fr · 1280–320          | S3   | A news alert's subject hidden behind its two tags, the second tag cut: which security, unsaid                 | Fixed       |
| B24  | PORT's returns by period                             | K. Atangana · en, fr · 390, 320          | S3   | The outperformance's unit cut: "+21.34 p", "+0.51 pt"; the table widens for figures, not these                | Fixed       |
| B25  | DES's key data, IMP's EODHD                          | K. Atangana, A. Mbarga · fr · 320        | S3   | Figures behind an ellipsis: 52-week "52 800 / 37…", last dividend "XAF 3 260 (07/…"                           | Fixed       |
| B26  | OPT                                                  | K. Atangana · fr · 320                   | S4   | The tabs and the scenario selector run 8 px past the page's edge                                              | Fixed       |
| B27  | A security's header (DES, GP…)                       | S. Mvondo · en, fr · 320                 | S3   | The "Delayed" badge beside the price cut to "DI": a delayed price reads as live                               | Fixed       |
| B28  | EODHD, CONT, SRC, MPAY                               | A. Mbarga, L. Mvogo · 390, 320           | S3   | A panel's actions pushed out of its title bar's left edge, out of reach: "[ALL] PARTNERS" → "NERS"            | Fixed       |
| B29  | USER's counters, SUBS's tiles                        | L. Mvogo · en, fr · 390, 320             | S4   | Three tiles a row: the types cut to four letters ("STUD…", "JOUR…"), "active" cut short                       | Fixed       |
| B30  | MPAY, NEWS NEW's statements                          | L. Mvogo, L. Mballa · 390, 320           | S4   | A tag or a status in a table cell cut with no ellipsis: "CONGO INF", "TCHAD MAT", "TO APPRO"                  | Fixed       |
| B31  | RFQ AGR (client side)                                | P. Owona, B. Sima · en · 1600            | S3   | The agreements' status past the panel's edge: "Exp", "Con", "Can", "Rej", the rest a scroll away              | Fixed       |
| B32  | IMP's current upload                                 | A. Mbarga · fr · 390                     | S3   | The six counters' labels print over each other: "Nouvelles", "Modifiées", "Inchangées", "Alertes"             | Fixed       |
| B33  | CORR's price correction                              | A. Mbarga · fr · 390                     | S3   | Each price field narrower than its value: 51 820 reads "51 82", 51 900 "51 9"                                 | Fixed       |
| B34  | ANLY, AUDT and other tables                          | L. Mvogo · fr · 390                      | S4   | Text columns cut to a few letters: the applicant "R. E…", the audit's "A. M…", "Fich…"                        | Fixed       |
| B35  | ADMCFG's quotas                                      | L. Mvogo · fr · 390                      | S4   | The alerts' quota fields run past the panel's edge: "Illimit", "1" of "10"                                    | Fixed       |
| B36  | OPT's pre-run checks                                 | K. Atangana · en · 1600                  | S3   | Once the universe is emptied, the last setup's checks stay "Passed": "Enough history 9 of 0"                  | Fixed       |
| B37  | Home, its footer                                     | K. Atangana logged in · any              | S4   | The footer still offers "Log in" to a member, whose top bar offers "Open the terminal"                        | Fixed       |
| B38  | Sign-up (CMarket.Api)                                | visitor                                  | S2   | A document holding the EICAR test virus is taken and the account created: only MSG's files are scanned        | Fixed       |
| B39  | Command bar                                          | S. Mvondo · en · 1600                    | S3   | A code the account may not use falls to the name search: the Student's "N NEW" opens New York heating oil     | Fixed       |
| B40  | Command bar                                          | K. Atangana · en · 1600                  | S4   | Enter on an unknown command does and says nothing; "SEMC HLD" (an ETF's function) is offered for an equity    | Fixed       |
| B41  | Tables of 20 screens (FX, CAL… USER, AUDT)           | K. Atangana · en → fr                    | S3   | Translated cells keep the former language after a switch on the page, until a reload: "Real", "Cameroon"      | Fixed       |
| B42  | MKT's Indices, Top movers, EQS's results             | P. Owona · en · 1600                     | S3   | A live column sorts by the values first loaded, not those shown: Chg. 0.56, 1.36, 0.61, 0.40…                 | Fixed       |
| B43  | Every table (`DataTable`)                            | any                                      | S3   | The sort shows by an `aria-hidden` chevron only, no `aria-sort`: a screen reader hears neither column nor way | Fixed       |
| B44  | MKT's right-click menu, EQS's COLUMNS                | P. Owona · en · 1600                     | S3   | The lists that hold the security are marked by an icon only, no `aria-checked`: unheard by screen readers     | Fixed       |
| B45  | ECO's CEMAC comparison, XLSX                         | K. Atangana · en · 1600                  | S2   | The export writes persons under "Population (M)": 29100000 for Cameroon, 29.1 M on the screen                 | Fixed       |
| B46  | MKT's watchlist                                      | P. Owona · en · 1600                     | S4   | After a reload the panel shows the first list, not the one being worked on                                    | To decide   |
| B47  | ALRT's New alert form                                | R. Tamba · en · 1600                     | S4   | The form, a dialog of the app shell, stays open over the page Back leads to                                   | Fixed       |
| B48  | GP's drawings                                        | P. Owona · en · 1600                     | S1   | When the saved drawings fail to load, a new line saves over them: two kept lines lost, unsaid                 | Fixed       |
| B49  | FX's converter                                       | P. Owona · en · 1600                     | S3   | Letters or a negative convert to 0.00 unsaid; 20 digits show the API's "Invalid request"; a 500 a "—"         | Fixed       |
| B50  | ECO's country bar                                    | P. Owona · en · 1600                     | S3   | When the countries fail to load, the bar reads "Loading" for ever, with no Retry                              | Fixed       |
| B51  | YCRV's bond calculator                               | K. Atangana · en · 1600                  | S3   | Traded on 23/12/2026, the settlement reads 25/12/2026, Christmas on BVMAC: T+2 skips weekends only            | Fixed       |
| B52  | YCRV's bond calculator                               | K. Atangana · en · 1600                  | S3   | A price of 0 or below, letters, a yield past 100 %: unsaid, the last result stays beside it, faded            | Fixed       |
| B53  | YCRV's bond calculator                               | K. Atangana · en · 1600                  | S4   | A BTA, a zero-coupon bill, described as "Repaid at maturity · annual coupon"                                  | Fixed       |
| B54  | BP's inputs                                          | P. Owona · en · 1600                     | S3   | A coupon of −1 %, a face of 0, a yield of −80 %: Calculate off, "Complete the inputs", no field named         | Fixed       |
| B55  | BP's result panels                                   | P. Owona · en · 1600                     | S4   | The API's 400 said on its field, and in four panels as "Invalid request" with a Retry that cannot help        | Fixed       |
| B56  | BP with an unknown bond                              | P. Owona · en · 1600                     | S4   | `/bp/NOPE`: the inputs say "No bond NOPE.", the results still show the last bond's figures                    | Fixed       |
| B57  | PORT's transactions                                  | P. Owona · en · 1600                     | S3   | A withdrawal or a purchase above the cash is taken: cash −100 bn, total negative, every weight 0.0 %          | To decide   |
| B58  | OPT's pre-run checks, scenarios                      | K. Atangana · en · 1600                  | S3   | A bound the API refuses (min above max…) reads "Add 2 to 20 securities…"; a save "Invalid request"            | Fixed       |
| B59  | OPT's scenarios, OPT RES                             | K. Atangana · en · 1600                  | S3   | A name used twice is saved; Export from a frontier point saves a second "CEMAC balanced"                      | Fixed       |
| B60  | OPT RES                                              | K. Atangana · en · 1600                  | S3   | A reload loses the result and the setup: "No result yet", then an empty New setup                             | Fixed       |
| B61  | OPT with an unknown list or id                       | K. Atangana · en · 1600                  | S4   | `?watchlist=` unknown is dropped unsaid (a portfolio is said); `?scenario=nope` says "Not Found"              | Fixed       |
| B62  | OPT RES                                              | K. Atangana · en · 1600                  | S4   | A capital of XAF 1,000: 0 of every security, all in cash, the indicators those of the weights                 | Fixed       |
| B63  | EQS, ETFS, BS, OPT, NET ME, NET, NEWS NEW lists      | K. Atangana · en · 1600                  | S4   | When a list fails to load it shows nothing, unsaid: "Saved screens:" then nothing, OPT only "New setup"       | Fixed       |
| B64  | ETFS's results                                       | K. Atangana · en · 1600                  | S4   | AUM sorted by the number whatever the currency: €84.6 bn after $89.3 bn                                       | Fixed       |
| B65  | PUB's purchase                                       | P. Owona · en · 1600                     | S2   | Paid by mobile money, the dialog closed and another note opened: no word, the note still offers Buy           | Fixed       |
| B66  | PUB, NET, RFQ AGR past their last page (`Pager`)     | P. Owona, S. Mvondo · en · 1600          | S4   | `?page=99`: "No publication for these filters." under 128 results, the pager "1,961–128 of 128"               | Fixed       |
| B67  | PUB with an unknown `?analyst=`                      | P. Owona · en · 1600                     | S4   | The banner reads "Publications of …" for good, the list "No publication for these filters."                   | Fixed       |
| B68  | NET ME, CFG's profile                                | T. Bekale, R. Tamba · en · 1600          | S3   | A change not saved is dropped unasked on leaving the screen or closing the tab                                | Fixed       |
| B69  | MSG's and PUB NEW's uploads, MSG's `?to=`            | K. Atangana · en · 1600                  | S4   | A file the API refuses reads "Invalid request", not its reason; one's own `?to=` gives a wrong one            | Fixed       |
| B70  | MSG's contact requests                               | B. Eyinga, K. Atangana · en · 1600       | S3   | Declined, a request is followed at once by a new one from the same person, the first still "Request sent"     | To decide   |
| B71  | PUB's and CFG's mobile money                         | P. Owona · en · 1600                     | S4   | Any phone of 8 to 15 digits is taken: +33 6 12 34 56 78, a French number, paid a note                         | To decide   |
| B72  | CFG for the Data admin and the Admin                 | A. Mbarga, L. Mvogo · en · 1600          | S3   | No settings of their own: no password change, no time zone, no SMS codes; `/cfg` "not available"              | To decide   |
| B73  | CFG's plan change                                    | R. Tamba · en · 1600                     | S3   | Analysis paid to 09/08/2027, Professional chosen on 17/11/2026: a full year charged, nothing credited         | To decide   |
| B74  | MSG's thread                                         | K. Atangana · en · 1600                  | S3   | When the messages fail to load, the conversation shows empty: no message, no error, no Retry                  | Fixed       |
| B75  | PUB NEW's settings                                   | K. Atangana · en · 1600                  | S3   | When the price rules fail to load, the panel reads "Loading" for good, no Retry: nothing submits              | Fixed       |
| B76  | Create and send buttons (PUB NEW, NEWS…)             | K. Atangana, L. Mballa · en · 1600       | S3   | A double click acts twice: two drafts, two news items, tickets e-mailed twice; a 409 toast                    | Fixed       |
| B77  | PUB NEW's editor                                     | K. Atangana · en · 1600                  | S2   | A paste from Word keeps its picture as a `file:///` image: from then on the draft saves nothing               | Fixed       |
| B78  | PUB, a note updated                                  | P. Owona · en · 1600                     | S3   | "Its buyers are told" of a new version, yet the buyer gets no notice and the list still reads "Bought"        | Fixed       |
| B79  | RFQ's answer, NEWS's Publishers (`Dialog`)           | B. Ngoma, A. Mbarga · fr, en · 1600      | S2   | Confirming Withdraw or Remove submits the form around it too: an improvement logged, a publisher back         | Fixed       |
| B80  | SVT's agreements to approve                          | B. Sima · en · 1600                      | S2   | The time left stands still between reloads: "20:42" for 7 min, amber past the 15-minute reminder              | Fixed       |
| B81  | RFQ AGR, USER (sorted by the API)                    | T. Bekale, L. Mvogo · en · 1600          | S3   | A third click is dropped: RFQ AGR's Date and USER's Last login never sort oldest first                        | Fixed       |
| B82  | RFQ AGR's Save filter                                | T. Bekale · en · 1600                    | S3   | A filter the API refuses (an inverted period) leaves the dialog open, nothing said                            | Fixed       |
| B83  | RFQ AGR's filters                                    | T. Bekale · en · 1600                    | S4   | Reset leaves the values typed, and their error, while no filter was applied                                   | Fixed       |
| B84  | SVT, four eyes                                       | B. Sima · en · 1600                      | S3   | A bank with one SVT account cannot approve above the threshold: "another approver" never comes                | To decide   |
| B85  | RFQ, RFQ AGR with the RFQ off; MSG unpermitted       | T. Bekale · en · 1600                    | S4   | "This screen is not available for your account type.": the account type is not the cause                      | Fixed       |
| B86  | TRD's linked traders                                 | B. Sima · en · 1600                      | S4   | No export: the SVT has no `analysis:export`, though the table is meant to be exportable                       | To decide   |
| B87  | IMP's rows                                           | A. Mbarga · en · 1600                    | S4   | A year shown as a figure: "2,025" for the macro year and the fiscal year                                      | Fixed       |
| B88  | IMP, two templates                                   | A. Mbarga · en · 1600                    | S4   | The bond list's and bond ratings' example lines fail their own checks                                         | Fixed       |
| B89  | DATA, a session ahead                                | A. Mbarga · en · 1600                    | S4   | Tomorrow's session reads "Expected today"                                                                     | Fixed       |
| B90  | HIST, AUDT                                           | A. Mbarga, L. Mvogo · en · 1600          | S4   | A period from after to lists nothing, unsaid: "No upload.", "No entry matches."                               | Fixed       |
| B91  | ADMCFG's quotas                                      | L. Mvogo · en · 1600                     | S3   | A quota the API refuses (-1, 2.5) says nothing; 2.5 then reads "3"                                            | Fixed       |
| B92  | USER's Change type                                   | L. Mvogo · en · 1600                     | S4   | SVT offered to a client, then refused: "A client stays a client…"                                             | Fixed       |
| B93  | SUBS's tiles                                         | L. Mvogo · en · 1600                     | S4   | "Expiring within 30 days" reads 143, the list it opens 146                                                    | Fixed       |
| B94  | Tables sorted in the page (`DataTable`)              | L. Mvogo · en · 1600                     | S4   | An accented first letter sorts after Z: "ÉCO HEBDO" after "TCHAD MATIN" (SRC, MPAY)                           | Fixed       |
| B95  | EQS's results (`useScreener`)                        | K. Atangana · en · 1600                  | S3   | Market cap, P/E and yield keep the last fetch's price while the change follows the live quote                 | Fixed       |
| B96  | IMP, a session whose file was rolled back            | A. Mbarga · en · 1600                    | S4   | A new file is refused as "… is being checked for this session": that file was rolled back                     | Fixed       |
| B97  | NEWS NEW's Statements, MPAY's statement              | L. Mballa, L. Mvogo · en · 1600          | S3   | A statement does not follow the other side: "Disputed" while the answer is notified                           | Fixed       |
| B98  | A page open when its user is suspended               | K. Atangana, L. Mvogo · en · 1600        | S4   | The next click reads "Your session has expired: log in again.", not the suspension                            | Fixed       |
| B99  | CFG's plans (`/subscription/checkout`)               | T. Bekale · en · 1600                    | S2   | A change of plan starts a new period at full price: the days left of the plan paid are lost                   | To decide   |
| B100 | The user menu's language                             | K. Atangana · en → fr · 1600             | S2   | A tab opened before a change sends the old profile back: name, phone, two-factor channel                      | Fixed       |
| B101 | ALRT's alert form, CFG's profile                     | K. Atangana · en · 1600                  | S4   | No version: a second tab's save replaces the first's without a 409                                            | To decide   |
| B102 | Uploads of PUB NEW, NEWS NEW, RFQ AGR's letters      | K. Atangana, L. Mballa, T. Bekale · API  | S2   | No virus scan: the EICAR test file is taken and served back                                                   | Fixed       |

### Notes

- **B01**: found at step 42 (`roadmap/client-screens.md`, PORT): the PORT valuation converts the
  euro at the peg only. Decision 25 keeps portfolios made from OPT in francs and euros meanwhile.
- **B02**: seen at step 49 in CMarket.Api's log; offered then, not asked yet.
  Part 7: `ChatHub.OnConnectedAsync` ends a connection the page left (a reload) without the error,
  still seen in part 7's own runs before the fix.
- **B05**: axe-core's `label-content-name-mismatch`. `shared/ui/LanguageSwitch` shows "FR" and
  "EN" but names them "Français" and "English" (the home page, the login, the sign-up, the
  password reset and the public profile all use it); ECO's two XLSX buttons are named "Export
  the chart's figures to Excel" and "Export the CEMAC comparison to Excel"; the editor of PUB NEW
  shows "H2" and "H3" named "Heading 2" and "Heading 3", and NEWS NEW's (the News provider's)
  the same and its security card button; in French MSG's "+ NOUVEAU" is named
  "Nouvelle conversation" (its English "New conversation" holds "New"). A voice user saying what
  they see ("click FR") reaches nothing. axe-core 4.14 checks it; the audits of steps 19 to 48
  did not.
- **B06**: CMarket.Api's `/market/summary` is right at any instant (its breadth equals the
  quotes', checked three times in a row), but MKT reads it every 60 s and the movers every 30 s,
  while the indices, the ticker and the watchlist move with each trade: on the first sweep's
  screenshot the summary read 4 advancers and 6 decliners while the movers listed 5 gainers.
- **B07**: `/securities/NO-SUCH-SECURITY/des` says "No security NO-SUCH-SECURITY." and
  `/pub?id=` of an unknown publication "No publication …", each with a Retry that cannot help;
  a 404 could say so without it. A refusal (403) offers it too (B21's FA and ANA).
  BP alike: `/bp/NOPE` says "No bond NOPE." with a Retry (and B56).
  PUB alike for a note withdrawn ("The analyst withdrew this publication.", 410) or in
  moderation ("No publication …"); `/pub?id=nope` says "Not Found".
  Part 5: RFQ AGR's `?agreement=` of another bank's agreement ("No agreement of yours has this
  id.", 404) or `nope` ("Not Found"), each with a Retry; IMP's `?import=nope` shows the overview
  and says nothing.
- **B08**: `/msg?c={unknown}` shows that the conversation does not exist, but still calls
  `JoinConversation`; the hub answers "Conversation not found" (a console warning), and
  CMarket.Api logs each refusal as an error ("Failed to invoke hub method 'JoinConversation'"):
  the only 16 errors of its log over the whole sweep, the explorer included.
- **B09**: the commission is written as a deduction even when there is none.
- **B10**: CMP's 5Y axis has a tick every few months, each labelled with its year only:
  `CommodityComparePanel`'s `XAxis` keeps `date.slice(0, 4)` of the ticks Recharts spaces 32 px
  apart, several a year at 5Y (and on a 1Y period at most two different labels).
- **B11**: `/port/{unknown}` answers 404 and opens the first portfolio at its own address;
  `/fx?currency=XYZ` draws the dollar. ECO says "No economy XYZ on ECO: CMR is shown." and N
  "This news item does not exist or is no longer available."
  Part 6: a fund unshared while M. Ngono reads it shows M. Ngono's first portfolio at the next
  reload, nothing said; K. Atangana opening P. Owona's private portfolio by its address reads
  their own instead; the API answers 404 each time.
- **B12**: `/opt?portfolio={CEMAC Equity Fund}` fills the universe with the fund's nine lines and
  the correlations matrix reads −0.03 in every cell off the diagonal, where the demo scenario
  "CEMAC balanced" shows 0.05 to 0.60 (typed in by the scenario). `/optimizer/estimates` answers
  a shrinkage of 1 for that universe and for another with IWDA (−0.04 everywhere): the demo's
  price histories are drawn independently, so their sample correlations are noise around zero
  and Ledoit-Wolf rightly keeps only the average. The estimator is right; the demo shows a flat
  matrix to whoever opens OPT on a portfolio or a watchlist. Correlated demo histories (a common
  market factor in CMarket.Api's demo market) would show what real data will: the user's call.
- **B13**: at 1024 px the toolbar ends in "UNDO CL", at 768 px in "[VOLUME", COMPARE, TREND
  LINE, LEVEL, UNDO and CLEAR beyond the panel's edge, which clips them. At 390 px it wraps onto
  four lines. `shared/ui/Panel`'s title bar and its actions wrap below `md` only (`md:h-bar
md:flex-nowrap`): from 768 px a panel narrower than its actions cuts them. The second pass
  finds GP's the only such panel: at 1024 px CLEAR is cut and the panel's layout menu hidden,
  at 768 px COMPARE, TREND LINE, LEVEL, UNDO, CLEAR and the layout menu.
- **B14**: the ticker is a row that clips what does not fit (the spec asks only "indices and main
  securities with coloured change"); at 1600 px its eight entries fit. The home page's
  illustration of the terminal has the same ticker, cut the same way.
- **B15**: `shared/ui/ScreenTabs` scrolls sideways (`overflow-x-auto`), as PortfolioPage means
  ("On a narrow window the tabs scroll, the button beside them stays"), but at 390 px in French
  the strip left beside the button shows "Positions" and the edge of "Transactions": the other
  tabs are a swipe away with nothing to say so. Worse, the strip does not bring the tab shown
  into view: on Performance, Risk, Income or Reports it still shows "Positions" and an edge, so
  the page does not say which tab it is (the Manager's and the Student's portfolios alike).
- **B16**: `PortfolioPositionsPanel`'s security cell is an `inline-flex` span holding a
  `truncate` span and the stale badge; nothing bounds the outer span's width, so the inner one
  never truncates and the cell clips the code with no ellipsis. The first sweep did not see it;
  its detector now does: the second pass finds it at 768 px as well ("GAB 6.50% 28" by 32 px),
  in both languages; tags cut the same way in other tables are B30 (ETFS's tickers, flagged
  too, draw their ellipsis).
- **B17**: what the API sends as data stays English: PORT's allocation (Sovereign, Banking…), MKT's
  indices (BVMAC Equities), the plans on CFG and on the home page's prices (Monitoring, Analysis,
  Professional, the student's Student; their modules are translated: Suivi, Analyse,
  Portefeuille), a bond's long name ("Republic of Cameroon 6.25% 2025-2029" on YCRV, BS and BP's
  calculator), the shareholders' "Free float" (the key data's own
  label reads "Flottant"). CMarket.Api keeps a French name for each sector (`Sector.NameFr`:
  "Agro-industrie"), commodity, rate series and specialty, but PORT's allocation by sector shows
  the API's key as it comes (`PortfolioAllocationPanel`'s `labelOf` translates countries, asset
  classes and maturities, returns a sector's key). The indices ("BVMAC Equities", "CMarket
  Banks"), the plans (ids `monitoring`, `analysis`…) and `Shareholding.FreeFloatName` have one
  English name only. How to name reference data in French is to decide before a fix; the sectors
  are a bug either way.
- **B18**: OPT shows "Le scénario ne s'est pas ouvert : No scenario 00000000-…": the problem's
  detail, which CMarket.Api writes in English, inside the French sentence.
  Part 5: RFQ's answer form shows the API's refusals in English on B. Ngoma's French page ("An
  improvement keeps or betters the price: withdraw the answer to quote a worse one.", "This
  answer was withdrawn or has expired."); SUBS's Extend shows the API's "Extend to a day after
  2027-08-09.", an ISO date among dd/mm/yyyy ones.
  Part 7: the API writes about 1,100 messages in English (exceptions and checks); a page in French
  shows them as they come. Translating them by the user's language is a step of its own.
- **B19**: the Analyst's sweep loaded the site 109 times (the market hub connected 109 times, once
  a load), but the chat hub 118 times; the first trial, without reloads, connected chat twice
  and market once. Replaying the Analyst's 108 pages with each connection logged: only the
  public profile (`/p/m-ndong`, `/p/k-atangana`) closes the chat hub, being outside the app
  shell, and the next page of the app opens it again. Not a bug.
- **B20**: a tile's title wraps on two lines, clamped with an ellipsis ("INFLATION (PRIX À
  LA…", "DETTE PUBLIQUE /…", which is right), but a single word wider than the tile is cut
  short with none: "EXPORTATIONS" shows as "EXPORTATION" at 320 px in French.
- **B21**: the SVT has `market:read`, `svt:approve` and `messages:write` only (CMarket.Api's
  `DefaultRolePermissions`), enough for DES, and the profile offers every tab of the security's
  kind (`shared/routes/profiles.ts`, no permission looked at). CMarket.Api refuses it what needs
  `analysis:read` or `research:read`: on FA the four panels (financials, ratios) each say "Your
  account type does not allow this." with a Retry; ANA says "This account cannot read research."
  beside a preview that asks to choose a publication; a bond's BP has its market yield refused;
  every chart (DES, GP, DVD, HDS) shows MA20 and MA50 on, asks `/indicators/{id}` for them and
  draws no line (`PriceChartPanel` turns them on for everyone). Checked tab by tab on 16
  November. The tabs, the toggles and the requests should follow the permissions, as the menu
  does; the API is right to refuse. In the demo the other client types have `analysis:read`, but
  the Admin's permissions table (ADMCFG) can take it from any of them.
- **B22**: `shared/config/accountTypes.ts` colours the Data admin and the Admin with an inline
  `var(--text-secondary)`. `app/styles/index.css` lightens the class `.text-secondary` on a
  selected row (`--text-secondary-selected`, 4.7:1) and overrides `--type-trader` there, but
  not this inline grey: on `--bg-selected` it stays 3.4:1. Wherever an employee's type shows on a
  selected row (USER's accounts list; any other list that colours by `ACCOUNT_TYPE_COLORS`).
- **B23**: `AlertHistoryPanel`'s subject cell (and `TriggeredAlertsPanel`'s, MKT) is a flex row
  of `NewsTags` (`inline-flex shrink-0`) and the subject (`truncate`): the tags never give way,
  so in a column narrower than both ("ARTICLE", "DAILY K") the subject gets no width and the
  second tag is cut. Seen at 1280 px already; at 390 px only "ARTICLE" and a sliver show. The
  message ("Third-quarter revenue release") does not name the security either.
- **B24**: `DataTable` widens a column to what its figures need (step 48), but a cell counts as
  a figure only when `isFigure` (`shared/ui/dataColumns.ts`) finds no letter but M, B, n, k, X,
  A, F and x: "+0.51 pts" does not count, so the column stays narrow and `ChangeText` (an
  `inline-flex`) is clipped with no ellipsis. Other units of the kind (pt, pb, bp, ans) would
  meet the same; the period's names are cut too ("Mont…", "3 yea…"), with an ellipsis.
- **B25**: `KeyDataPanel` lays each row as a label and a value, both `truncate`: at 320 px the
  value gives way and hides its digits behind the ellipsis, where the label could ("Plus haut /
  bas 52 se…" is cut too). Every tab with key data shows it (DES, DVD, HDS). The Data admin's
  EODHD connector (IMP, EODHD) lays its rows the same way: its last runs read "13/11 22:…". And
  MPAY's tile "TOTAL À PAYER" reads "XAF 1 269 …" at 390 px in French (seen on its screenshot:
  the detector took a figure that starts with its currency for text; it no longer does).
- **B26**: at 320 px in French, OPT's two tabs ("OPT Paramétrage", "OPT RES Résultat") and the
  scenario selector are 8 px wider than the page: the selector's right border and the second
  tab's edge are cut; no text is lost.
- **B27**: `SecurityHeader` wraps its blocks (`flex-wrap`), but the price row inside (the price,
  its change, and the "Delayed" badge of an account on delayed quotes) is a `flex` that does
  not: at 320 px it is 33 px (English) to 41 px (French) wider than the header, which clips the
  badge after its first letters. Seen as the Student, whose quotes are delayed.
- **B28**: `shared/ui/Panel`'s actions box is `ml-auto flex flex-wrap justify-end`; it wraps its
  own children, but a panel whose options are one group that does not wrap (a segmented filter,
  a row of links) makes a child wider than the bar, and `justify-end` lays the overflow out of
  the start edge, which no scroll reaches. At 320 px: EODHD's bulk loads (the "Load" selector
  shows only its arrow), CONT's published items ("[NEWS]" → "WS]"), SRC's newspapers ("[ALL]",
  "PARTNERS"), MPAY's statements ("GLOBAL SETTINGS" → "LOBAL ETTINGS"); at 390 px in French SRC
  already. `justify-end-safe` (CSS `safe flex-end`) keeps the start in view; B13 is the same bar
  from 768 px, cut at the other end.
- **B29**: `AccountCounters` lays its ten tiles three to a row at 320 px; each tile keeps the
  count whole and truncates the type ("STUD…", "ANAL…", "PORT…", "DATA …"), and "active" runs
  9 px (English) out of the tile ("348 activ"). At 390 px in French as well ("1 284 actif",
  "GÉRANT D…", "ADMIN DO…"); SUBS's tiles cut their labels the same way ("ABONNEMENTS AC…",
  "PAIEMENTS ÉCHOU…").
- **B30**: `DataTable` widens a column to its header and its figures (B24), not to a tag: a tag
  (`inline-flex`) in a narrower cell is cut with no ellipsis. MPAY's newspaper tags at 390 px in
  French ("ÉCO HEBDO", "CONGO INF", "TCHAD MAT", 22 to 35 px short), NEWS NEW's statement status
  at 390 and 320 px ("TO APPROVE", 16 px short). B16 is the same in PORT's positions.
- **B31**: the client's AGR (`/rfq/agreements`, as the Manager and the SVT) has eleven columns
  in a panel of its default layout narrower than they need at 1600 px: `DataTable` fits the
  figures and lets the table scroll sideways, so the last column, the status, shows its first
  letters at the panel's edge. The Admin's AGR, with fewer columns, shows it whole.
- **B32**: `ImportCounters` is a `grid grid-cols-6` at every width: at 390 px each column is
  about 45 px and the French labels, longer than that, overflow into their neighbours. The steps
  above them ("Chargement — Format — Contrô…") are cut at the panel's edge too.
- **B33**: `PriceCorrectionForm` lays the open, high, low, close and volume in a `grid
grid-cols-5` at every width: at 390 px a field is about 50 px, two digits short of a price in
  francs; "Plus haut" wraps and pushes its field down out of line. The sweep could not see it (a
  field is not a box that clips); D11 did.
- **B34**: at 390 px `DataTable` gives the figures what they need and the text columns the rest:
  ANLY's applicants read "R. E…", "F. B…", AUDT's who, action and target "A. M…", "Fich…",
  "cour…", PAY's analysts "K. Atan…". Each ends in an ellipsis, but what is left cannot be read.
- **B35**: ADMCFG's quotas by account type (`/admin/settings`, the Admin's CFG) are a three
  column form whose last column, the alerts, runs past the panel's edge at 390 px: "Illimit…"
  and the first digit of 10 or 20 show.
- **B36**: found by the explorer: `/opt?portfolio={fund}` fills the universe with nine lines and
  the checks pass; "New" empties the universe (with no question, though nothing was saved: to
  decide), and the pre-run checks still read "Passed" four times, "Minimum return is reachable
  between 6.46% and 13.45%" and "Enough history 9 of 0 securities". `useOptCheck` keeps the
  previous answer (`placeholderData: keepPreviousData`) and stops asking once the setup cannot
  be checked (`enabled: isCheckable(setup)`), so the last answer stays. OPTIMISE is rightly
  disabled meanwhile.
  A capital of 0 or below leaves the last checks the same way: four "Passed" and OPTIMISE off,
  nothing saying why (part 3).
- **B37**: the top of the home page follows the session (`home.cta.open`), the footer's links do
  not: "Log in" (`/login`) stays at its foot for a member, at every width.
- **B38**: CMarket.Api's `IVirusScanner` serves `ScanAttachmentCommand` (MSG's attachments) only.
  The sign-up's documents (`UploadedDocument`: PDF, JPEG or PNG up to 10 MB, both checked and
  refused rightly) are saved unscanned, and an Admin opens them in USER and ANLY; a PDF holding
  the EICAR string made an Analyst's account. The other uploads (PUB NEW, NEWS NEW, NEWS, IMP)
  are checked in their parts.
- **B39**: the command bar falls back to the securities' names when no code matches: "N NEW"
  is no code of the Student's, so it opens the first name holding "new". A code the account has
  not could say so ("N NEW is not part of your account").
- **B40**: an unknown command ("XYZQ", "SEMC XYZ") leaves the bar as it is with nothing said;
  the suggestions combine any code with any function, "SEMC HLD — ETF holdings" for an equity,
  whose choice opens SEMC's DES (`/securities/SEMC/hld` redirects).
- **B41**: found by the language switched on each page (C9) against the page loaded in French:
  FX's cross rates keep "Real", CAL's auctions "Cameroon" and "Chad", ALRT's list "Price or
  change", "Unusual volume", FA's statements "Revenue", "Net income". Their columns translate in
  their accessor (`helper.accessor((row) => t(…))`) and `DataTable`'s rows keep each accessor's
  value (`row._valuesCache`, @tanstack/table-core 9.3) until the data change; the headers,
  rendered, follow. Every other table and chart followed the switch, the charts' months too.
  EQS's statements alike (part 3), the same widget as FA's: "Revenue", "Operating income", "Net
  income" under "Compte de résultat".
  YCRV's auctions (CAL's widget) keep "Cameroon" and "Chad"; PORT keeps its transactions' and
  income's types ("Dividend", "Redemption") and its returns' periods ("Month to date", "Year to
  date", "1 year").
  Part 5: RFQ AGR, AGR and the Admin's RFQ keep their statuses ("Awaiting SVT", "Expired"),
  DATA, IMP and HIST the uploads' types ("BVMAC daily prices"), NEWS its categories ("Issuers"),
  USER and ANLY "Independent", SUBS its types and statuses, MPAY its statements' statuses, SRC
  its review modes, AUDT its actions. B80 is the same cache holding a time.
- **B42**: `IndicesPanel` sorts on `accessor('change')`, the REST answer, and shows
  `LiveIndexChange`, the quote store's: after a few trades the order no longer follows what is
  shown (sorted by Chg.: 0.56, 1.36, 0.61, 0.40, 0.03, 0.04, -1.69). Top movers alike; every
  table with live cells is to look at (the watchlists).
  EQS's results too (part 3): sorted by Day chg., the column reads 0.31, 0.39, -0.24, 0, -0.13,
  -0.43, 0.3 (`changePct` sorted, `LiveChangePct` shown); its Last column is built the same way.
- **B43**: `DataTable`'s header is a button whose chevron (`ChevronUp`, `ChevronDown`) is
  `aria-hidden`; the `th` has no `aria-sort`. axe has no rule for it.
- **B44**: the right-click menu's lists (`W1 · My picks`…) are `menuitem`s; the one that holds
  the security shows a check icon only. A `menuitemcheckbox` with `aria-checked` would say it.
  A click on it takes the security out ("BANGE removed from W6"), as the icon means.
  The cause is `shared/ui/ContextMenu`: an item's `checked` draws the icon on a `menuitem`, so
  every menu with ticks is concerned; EQS's COLUMNS is one (part 3): its items have no
  `aria-checked`, a screen reader hears neither the columns shown nor those hidden.
- **B45**: `CemacComparisonPanel` exports its accessors' values (`shown(row.values[i])?.value`),
  raw, while its cells format them by the indicator's unit (`formatMacroFigure`): the XLSX's
  "Population (M)" row reads 29100000, 2500000… The other rows are in their unit (percent,
  dollars); ECO's chart export is right.
- **B46**: the list shown is not kept in the address nor in the layout: a reload opens the
  first list (the second after the first was deleted).
- **B47**: the alert form is mounted once by `AppShell` and opened through `openAlertDialog`; a
  page change does not close it, so Back from ALRT leaves it open over MKT.
- **B48**: found by C11 (each query of the page failing in turn), then reproduced: two
  horizontal lines saved on SEMC through the API, GP opened with `GET /charts/SEMC/drawings`
  answering 500, one level drawn: the server keeps that one line only. `useDrawings` takes
  `useChartDrawings(id).data?.drawings ?? []` and every edit `PUT`s the whole list, so a list
  that could not be loaded reads as empty and is saved over; nothing says the drawings failed
  to load. The workspace layouts have the guard that drawings lack ("a layout that could not
  be loaded is never saved over").
- **B49**: the converter (`FxConverterPanel`, `GET /fx/convert`) shows 0.00 for "abc", "-5" and
  "1e309", the API's own title "Invalid request" for 99999999999999999999, and a bare "—" when
  the API answers 500 or does not answer; no message says what to type.
- **B50**: ECO's country bar asks `/macro/countries`; when it answers 500 or times out, the bar
  keeps its spinner and "Loading" (seen after 8 s and more), with no message nor Retry, so no
  country can be chosen; the rest of ECO works on its default countries.
- **B51**: `settlementDateAfter` (`widgets/bond-calculator-panel/model/calculatorForm.ts`) skips
  Saturdays and Sundays only. CMarket.Api's BVMAC calendar (`MarketReferenceData.Holidays`) has
  Christmas, and BP's settlement comes from the API's sessions (`settlementSessions`), so YCRV
  and BP disagree before a holiday; seen with the browser's clock on Wednesday 23/12/2026. A
  holiday or a Saturday typed by hand is priced on both screens without a word (25/12/2026,
  21/11/2026), which the spec ("T+1 or T+2 by default depending on the market") leaves open.
- **B52**: `toRequest` returns null for a price of 0 or below or a yield outside -50 to 100 %, so
  nothing is asked, and `keepPreviousData` keeps the last answer at 60 % opacity: the yield field
  reads 5.24 under a price of -5, the price 101.40 beside a yield of 150 %. Letters mark the field
  invalid while typed, then it goes back. The face amount says "Enter an amount above 0"; the
  price and the yield say nothing. A price of 1,000,000 reaches the API, which says "No yield
  between -50% and +100% gives this clean price.", which is right.
- **B53**: the calculator's description reads the bond's `frequency` (1) whatever its
  `couponType`: the BTA (`couponType` "zero", `couponPct` 0) reads "annual coupon". BS's list
  says "Zero".
- **B54**: `pricingForm`'s `toRequest` returns null for a value out of its range, so Calculate is
  off and the form reads "Complete the inputs to calculate." with no field marked: a coupon of
  -1 %, a face value of 0, a yield of -80 %. A coupon of 150 % does reach CMarket.Api, whose
  400 the field shows ("Between 0% and 100%."). Letters, or a month 13, go back on blur.
- **B55**: a settlement of 01/01/1900 reads "Between 1950 and 2200." under its field, rightly;
  Results, Price-yield relationship, Cash flow schedule and Rate sensitivity each read "Invalid
  request" (the problem's title) with a Retry that sends the same inputs again. A maturity
  before the settlement, a coupon of 150 % alike.
- **B56**: BP's store lives outside the page (for the calculator's inputs to survive a visit
  elsewhere): with `/bp/NOPE` the inputs panel says the bond does not exist while the results,
  the cash flows and the sensitivity still show the last calculation (case A's 101.3999 %).
- **B57**: a sale above what is held is refused ("100 held on 16/11/2026."), but nothing checks
  the cash: a withdrawal of 99,999,999,999 with XAF 6.4 M of cash, then a purchase of 2.6 bn, are
  recorded; the total value reads -99,982,996,754 XAF and every weight 0.0 %. A redemption is
  any amount too: 400,000 on two ECMR bonds (XAF 12,000 of face), the cash credited and a loss
  of 5,600 realized. `PortfolioValuer` adds every amount. The spec says nothing of an
  overdraft: whether the cash may go negative is to decide; a redemption above the face held is
  a mistake either way.
- **B58**: `/optimizer/check` answers 400 naming the field ("setup.universe[0].minWeightPct": "At
  most the maximum weight."; a maximum of 150 % "Between 0 and 100."; a volatility of -5 %
  "Between 0 and 1000."; a return of -200 % "Between -100 and 1000."), but `PreRunChecksPanel`
  shows `opt.checks.waiting` whenever `check.data` is empty, an error included, and no field is
  marked: the user reads "Add 2 to 20 securities and the objective's target." with eight
  securities and a target. Saving the setup says "The scenario was not saved: Invalid request"
  (the title, not the errors).
  The check answering 500 or timing out reads the same, OPTIMISE off with no word of a failure
  (C11).
- **B59**: a copy saved under a name already used gives two "Sweep copy" in the scenario list;
  EQS, ETFS and BS refuse it ("A screen named … already exists"). The next steps of OPT RES save
  the result first under `useEnsureSaved`'s `defaultName`, the open scenario's name, as a new
  scenario: a frontier point exported from "CEMAC balanced" left two "CEMAC balanced" (targets
  8 % and 7.22 %), which nothing tells apart.
- **B60**: `/opt/result` holds no scenario id and the optimizer's store is memory only: a reload
  reads "No result yet: set up the optimisation, then press OPTIMISE.", and "Open the setup"
  opens a New setup with an empty universe, though the scenario is saved with its result.
- **B61**: `/opt?portfolio={unknown}` says "The securities were not taken: No portfolio …";
  `?watchlist={unknown}` is dropped from the address with nothing said. `?scenario=nope` says
  "The scenario did not open: Not Found", the problem's title (B18's kind).
- **B62**: with a capital of XAF 1,000 the allocation lists the optimal weights (13.0 %, 5.1 %…),
  a quantity and an amount of 0 for each security and XAF 1,000 left in cash; the indicators
  (8.00 %, 5.40 %) are those of weights nothing holds. A capital that buys nothing could be said.
- **B63**: found by C11: with `/analysis/screens`, `/analysis/etf-screens` or
  `/analysis/bond-screens` answering 500 or timing out, the criteria panel ends in "Saved
  screens:" and nothing (it reads "Saved screens: none yet" when there are none); OPT's scenario
  list holds "New setup" alone. Nothing says the user's own were not read; the results, the
  profile and the other main panels say it with a Retry.
  Part 4: NET ME's people blocked (the title and its hint, then nothing), a profile's latest
  publications in NET and NEWS NEW's last import (the section gone).
- **B64**: ETFS writes each fund's AUM in its own currency and sorts on the number: $98.4 bn,
  $89.3 bn, €84.6 bn, $45.2 bn, €9.6 bn, though €84.6 bn is more than $89.3 bn. BS's coupons
  ("Zero" lowest) and starred model prices, PORT's weights sort right.
- **B65**: the payment is followed by `usePayment` inside `BuyPublication`, which unmounts when
  another note is chosen: its polling stops, and with it the toast "Payment confirmed…" and the
  refresh of the lists, which live there. The API confirms the payment about 3 s later
  (`purchasedAt` set); the list never marks the note "Bought", and back on it the preview still
  reads "Before purchase" with "Buy this report"; a second Buy answers 409 and the dialog says
  "You bought it already." without opening the note. Staying on the note works (the e2e flow's
  case), a card too. Steps: P. Owona, `/pub`, a paid note, Buy, a number, Pay, "Close and wait",
  another note in the list, 10 s, back to the first.
- **B66**: `shared/ui/Pager.tsx` writes the range from the page asked, and the lists take any
  page: `/pub?page=99` reads "No publication for these filters." under "Publications: 128
  results" with "1,961–128 of 128" and "99 / 7"; `/net?page=999` "No profile matches these
  filters.", "19,961–1,177 of 1,177" and "999 / 59". RFQ AGR, HIST, AUDT, USER and CORR use the
  same pager (part 5).
  Part 5: `/rfq/agreements?page=99` reads "No agreement yet: an RFQ's confirmation makes one for
  each answer selected." under "Agreements · 11 results"; USER, HIST and AUDT keep no page in
  their address.
- **B67**: `/pub?analyst={unknown}`: the banner waits for a name that never comes, the filters
  find nothing; NET says "This profile is no longer in the directory." for the same case.
- **B68**: NET ME shows "Not saved" in its title bar and CFG's profile has its Save, yet another
  screen and back gives the saved values again, and a tab closed with changes asks nothing (no
  `beforeunload`): only PUB NEW's and NEWS NEW's autosaves save on leaving and ask before a tab
  closes. Steps: T. Bekale, `/net/me`, the job title changed, NET in the menu, NET ME again.
- **B69**: an empty CSV chosen in MSG gets the problem's title "Invalid request" on its chip,
  where the API's field error says "Choose a file." (the other chips say "PDF, XLSX, CSV, PNG or
  JPEG." and "10 MB at most." on their own); in PUB NEW a text file named `.png` inserted as an
  image gets the toast "Invalid request", where the API says "The content is not what its type
  says.". `/msg?to={own id}` opens "New conversation with K. Atangana" and "K. Atangana does not
  take messages from your account type.".
- **B70**: the decline is not told (spec), so B. Eyinga's conversation still reads "Request
  sent… waits for the answer"; a new POST `/conversations` then opens a second request (201) that
  lands in K. Atangana's Requests again, within the day's 5 (Student) or 20 new conversations.
  While a request waits, a second one is refused (409, "A contact request between you waits for
  an answer"). Whether a decline holds the next request back, for a while or for good, is the
  user's call.
- **B71**: `shared/lib/phone.ts`'s `isPhoneNumber` (8 to 15 digits) is the only check, in PUB's
  payment dialog and CFG's checkout alike, and the API takes the number too: the payment of a
  note with +33 6 12 34 56 78 was confirmed. The hint names MTN Mobile Money and Orange Money,
  whose CEMAC numbers start +237, +241, +242, +235, +236 or +240.
- **B72**: CFG is a client screen and the back-office's CFG (ADMCFG) holds the platform's
  settings; the user menu of an employee offers the languages and the logout. An employee can
  change the password only through "Forgot your password?", and never the name, the phone, the
  time zone or the codes by SMS. The spec gives the back-office its own menu and says nothing of
  this.
- **B73**: the checkout reads "1 user × XAF 700,000, yearly", VAT 19.25 % XAF 134,750, total
  XAF 834,750, and the new year runs to 17/11/2027; the Analysis year paid XAF 536,625 on
  09/08/2026 loses its 265 days left. The Admin's plan change in SUBS is prorated by the day
  (spec, `PUT /admin/subscriptions/{accountId}/plan`); the client's own change is not said.
- **B74**: found by C11: with `GET /conversations/{id}/messages` answering 500 or timing out, the
  thread holds the composer and nothing above it, while the list reads the conversation's last
  message ("You: Thanks, I'll send you the curve tonight."). `ThreadPanel.tsx` handles
  `details.isError` and `history.isPending`, not `history.isError`.
- **B75**: found by C11: with `GET /publications/rules` answering 500 or timing out, "Publication
  settings" stays on "Loading", and Submit, Publish update and Withdraw live in that panel.
- **B76**: the buttons turn busy once React renders the request's `isPending`, after both clicks
  of a double click have submitted, and the forms hold no guard of their own: PUB NEW's "Create
  the draft" makes two drafts ("Untitled" twice), NEWS NEW's "Write it" two FLASH items, and PUB
  NEW's Submit sends twice, the second refused (409) with the toast "Another request saved the
  same thing at the same time.". MSG's "Create the group", NET ME's "Add", CFG's "Invite" and
  PUB's "Pay" send once.
  Part 5: NEWS's Publish (the Data admin) makes two items, both live in N; RFQ AGR's Resend
  sends two requests at once, both e-mailing the ticket (CMarket.Api sends before it saves; the
  second ends 409 after sending), so each recipient gets it twice and the log once; SVT's
  Approve answers "This agreement was decided already, by your bank or the other SVT, or has
  expired." after its own approval. RFQ's "Send my answer", TRD's Confirm, IMP's Publish, PAY's
  "Mark paid" and MOD's "Take down" send twice too, the second refused unseen; Add an SVT,
  Create account, CORR's correction, a cancellation, a rejection and Publish request send once.
- **B77**: a paste from Word keeps its local picture as
  `<img src="file:///C:/…/clip_image001.png">`, shown broken; from then on each save answers 400
  ("Images come from the studio." on the body), the title bar reads "Not saved: see the fields
  in red", and the title, the summary and the text typed after stay in the page only, until the
  picture is found and deleted. The paste otherwise drops Word's classes and styles and keeps
  the bold, the italic and the table.
- **B78**: after "Publish update", the toast says "…the new version is published and its buyers
  are told", and the API sends the buyers `PublicationPublished`, which refreshes their lists.
  But a bought note's line reads "Bought" before "Updated" (`PublicationListPanel`), and nothing
  else tells them: P. Owona, who bought SEMC, got no notification. Only the note itself, once
  opened, reads "Updated 17/11/2026 · version 2".
- **B79**: `shared/ui/Dialog.tsx` puts the `<dialog>` in a portal, but React passes a portal's
  `submit` event up its own tree: a `ConfirmDialog` rendered inside a `<form>` submits that form
  too. RFQ's answer form holds `WithdrawAnswerButton`: confirming "Retirer" sends a PUT with the
  form's values, then the DELETE. CMarket.Api's compliance export (`/admin/rfq/audit`) then logs
  a `ResponseImproved` the trader never made, 8 ms before `ResponseWithdrawn`, and the
  requester's selection changes version. A better price typed but not sent (99,5) went out with
  that PUT; the DELETE came first that time, and the page answered in red "This answer was
  withdrawn or has expired.". NEWS's Publishers (`PublisherForm`): confirming Remove sends the
  DELETE and a `PUT /admin/publishers`, an upsert by domain, with the toasts "Saved: the
  newspapers of … take its names." and "… removed."; in one try of three the PUT came last and
  the publisher was back in the list. AGR's filters hold `SaveFilterDialog` the same way: saving
  "BTA only", typed but not applied, put `?type=BTA` in the address.
- **B80**: `ApprovalsPanel` computes the time left in the column's accessor,
  `timeLeft(item.deadline, now)`, and `DataTable` keeps an accessor's value until the data
  change (B41's cache): the cell stops at the last fetch's value while the clock ticks. The RFQ
  board computes its time left in the cell and counts down. ACC-0015 read "26:30" from 14:08 to
  14:12 and "20:42" from 14:14 to 14:21; 15 minutes were left at 14:19:57, when the hub's
  reminder "an agreement's approval is due within 15 minutes" came, and the row stayed amber at
  "20:42". The detail's countdown ticks.
- **B81**: TanStack's sort cycles ascending, descending, none, and both handlers drop "none":
  RFQ AGR's `if (first)` keeps the second order for good (`number → -number → -number`), and its
  Date, the default order (newest first), never sorts oldest first: each click asks "none". USER
  falls back to its default on "none", which works for every column but Last login, the default
  (`-lastLoginAt`): it never sorts oldest first. SUBS's expiry goes both ways. A header's sort
  button is the label only: a click on the rest of a wide header does nothing.
- **B82**: the filters keep an inverted period after Reset (B83); "Save" sends it, CMarket.Api
  answers 400 on `criteria.to` ("The period ends on or after its first day."), and the dialog
  shows the name's error only: it stays open with nothing said.
- **B83**: `FiltersForm` gets a new draft when the applied criteria change; Reset applies `{}`,
  so with nothing applied yet nothing changes: "Ngoma", 20/11/2026 to 10/11/2026 and a minimum of
  300 stay in the fields, the period's error with them.
- **B84**: Bank E, Bank D and Bank G have one SVT account each, and every bank starts with four
  eyes above XAF 1 billion (`SvtSettings.DefaultFourEyesThreshold`). B. Sima's approval of a
  1.2 billion agreement reads "your approval is recorded; another approver of your bank
  completes it" and "Awaiting a second approver"; Approve stays offered, and CMarket.Api refuses
  the same person ("Four eyes: another approver of the bank approves it."). The agreement can
  only expire. The settings read "every SVT account (1 person)" beside the threshold and say
  nothing of it. Whether a threshold needs two approvers, or one account approves alone, is for
  the spec's author.
- **B85**: decision 24 closes the RFQ's menus and routes when the Admin turns it off, the SVT's
  three screens included; the page then says the account type is the cause.
  Part 6: R. Tamba's MSG, once ADMCFG takes messages:write from the journalists, reads the same.
- **B86**: `TraderLinksPanel` names its export `cmarket-trader-links`, but `DataTable` offers
  exports only with `analysis:export` (AppShell's `TableExportContext`), which the SVT lacks.
  The SVT's AGR has its own XLSX and CSV buttons.
- **B87**: IMP formats the year columns as figures: the macro template's row reads "CMR
  debt_percent_gdp 2,025 43.20", the financial statements' "SEMC 2,025 revenue 18,250".
- **B88**: uploaded as downloaded, the bond list's template fails with "ECMR 6.25% 2029 is
  another security's code." (its ticker maps to the listed `ECMR-6.25-2029`, whose ISIN is not
  the line's CM0000035002) and the bond ratings' with "Unknown security XS1234567890.". The
  other twelve templates pass their checks.
- **B89**: Next session leads to 18/11/2026, where BVMAC's prices and indices and BEAC's
  auctions read "Expected today"; the label is the session's day, not today.
- **B90**: HIST's and AUDT's From and to take a day after the other, and the lists answer "No
  upload." and "No entry matches."; RFQ AGR's filters say "The period ends on or after its first
  day." and hold Apply.
- **B91**: ADMCFG sends -1 and 2.5 for the Student's portfolios; CMarket.Api answers 400 on
  `quotas.student` ("A whole number from 0 to 10,000…"), which no field shows: no message, the
  field keeps -1, and 2.5 reads "3" once the field is left (the stored value is 3 again). "abc"
  holds Save, as it should.
- **B92**: the dialog says "A client stays a client, an employee an employee" and lists SVT
  among a client's types; the API refuses it ("A client stays a client, an SVT an SVT and an
  employee an employee: create a new account instead."), shown on the field and as a toast.
- **B93**: `/admin/subscriptions/stats` counts 143 expiring within 30 days, the list with
  `status=expiringSoon` or `expiringWithinDays=30` 146.
- **B94**: `shared/ui/dataColumns.ts` sorts with TanStack's `sortFn_alphanumeric` and
  `sortFn_text`, which compare code points: SRC's and MPAY's newspapers read "… MEDIA I · TCHAD
  MATIN · ÉCO HEBDO" ascending, ÉCO HEBDO first descending. Every table sorted in the page puts
  an accented first letter after Z (in French, "Égypte", "État").
- **B95**: `useScreener` keeps a screen's answer 60 s and nothing asks again on `QuoteUpdated` (nor
  on focus: `refetchOnWindowFocus` is off), while each row's change follows the live quote. A.
  Mbarga's file took SEMC from 52,500 to 53,500: EQS read "84.0 · 11.4x · 6.2% · +3.08%" where
  DES read "Market cap 85.6 Bn · P/E 11.6x · Yield 6.1%"; after a reload, "85.1 · 11.6x · 6.1%"
  at 53,200. A screen by P/E or yield then filters on figures the page does not show.
- **B96**: a rolled-back upload stays pending by design (`ImportStatus.IsPending`: fixed and
  published anew), so a new upload of its type and session gets 409 "prices-flow1.csv is being
  checked for this session: replace or discard it first." with "Open it"; the file was
  published, then rolled back, and opens with Publish 2 rows, Fix row, Replace file and Discard.
- **B97**: CMarket.Api tells the newspaper each step of its statement (`StatementNotices`, an
  `AlertTriggered`), which refreshes the notification centre and the alerts only; no hub event
  names a statement. L. Mballa's notification read "Your dispute of MPAY-2026-10-MEDIAI is
  answered: the amount stands, XAF 368,400." while NEWS NEW's row still read "Disputed" until a
  reload; L. Mvogo's MPAY showed the newspaper's dispute only after a reload.
- **B98**: K. Atangana, suspended with MKT open, stayed on MKT (10 s, the page asking the API
  nothing); the next click led to the login with "Your session has expired: log in again.";
  "This account is suspended. Contact CMarket." came only at the next login.
- **B99**: T. Bekale's Analysis yearly, paid by Bank C to 01/03/2027 (104 days left): Choose
  Professional by mobile money charged XAF 2,504,250 (3 users × 700,000 and VAT) for a year from
  that day (`periodEnd` 2027-11-17), nothing back for the days left; Monitoring monthly by
  transfer just after replaced the year just paid at once (invoice CM-2026-000242, XAF 89,438,
  due 02/12). Decision 7 of the third version: "A change of plan is prorated by the day"; SUBS's
  Change plan prorates ("265 days left of Analysis annual, worth XAF 326,712 excluding VAT").
  The second version's open question had noted the prototype's checkout without proration.
  Part 7: CMarket.Api's checkout (`PlanChanges.ApplyAsync`) starts the new plan for a full period
  on purpose, "without proration (spec section 6)", where decision 7 prorates every change of
  plan; prorating a client's own change makes most changes cost nothing at once (the value left
  buys days of the new plan) and changes CFG's checkout: to decide, with B73.
- **B100**: the user menu's language (`useLanguageMenuItems`, like `TwoFactorForm`) sends `{
...profileOf(user), language }` from the tab's `/me`, kept 5 min and not read again on focus.
  K. Atangana saved "K. Atangana (A)" in CFG; a tab opened before switched to French: the
  profile read "K. Atangana" again. The phone and the two-factor channel go back the same way,
  and the login codes with them.
- **B101**: `AlertInputDto` and `MeUpdateDto` carry no version, where PORT's settings and
  transactions and PUB NEW's autosave answer 409 to a second tab. An alert's threshold saved at
  26,600 in one tab and 26,700 in the other: both said "Alert saved", 26,700 stayed. Whether these
  small forms need the 409 is for the spec's author.
- **B102**: the EICAR test file named .pdf: PUB NEW's attachment answered 201 and its download 200
  with the EICAR content (each buyer of the note gets it); NEWS NEW's file 201
  (`/api/v1/news-files/…`, for every reader); an RFQ cancellation took two such letters (200, the
  agreement cancelled, the letters kept). MSG scans its files (201 "scanning", then 410
  "Blocked") and the sign-up its documents (part 2); the spec names the scan for MSG
  ("virus-scanned before becoming available").
