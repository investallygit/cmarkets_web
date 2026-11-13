# Client screens

Part of the [roadmap](../ROADMAP.md): each screen of the terminal, what is built, by which step, and
what is still to do. The Data admin's and the Admin's screens are in
[Back-office screens](back-office-screens.md).

## MKT · Market dashboard (screen 1): done

- **Built in step 3**: watchlist editing. "…" creates a list, changes its name and columns (name,
  last, change, change %, volume, 5-day chart) or deletes it; "+ Add" adds securities; the
  right-click menu of a row removes it. "Add to a list" in the right-click menu of any security
  ticks the lists that hold it and offers "New list…". A click on a news item opens the article
  on the N screen; a double-click on a calendar event opens the security.
- **Still to do**: sharing a list with colleagues of the same organisation (spec section 6) has no
  API yet.
- **Built in step 25 (third version)**: each news item shows its type and newspaper tags, which
  filter N; ISSUERS and REGULATOR filter the categories issuers and regulation; the content
  opened on N counts its unique click once it shows 3 seconds.
- **Fourth version (steps 39 and 42)**: the Rates and FX panel opens FX (screen 26); a watchlist
  gets "Optimise", which opens OPT on its securities.

## DES · Security profile (screen 2): done

- **Built**: header (last price at 26 px, change, 7 key figures, delayed tag for Students) and
  the tabs DES, GP, DVD, N, DOC, HDS, each with its own saved layout (`DES`, `DES-GP`...). DES
  follows the mockup: price chart, order book with depth bars, latest trades, key data,
  dividends, documents and news. GP adds 1D to 10Y, candles / bars / line, Bollinger bands, RSI
  and MACD panes, comparison with securities and indices rebased to 100, and trend lines and
  levels saved per user. A bond gets its terms and redemption schedule instead of the key data
  and dividends, and no FA, DVD or HDS tab.
- **Built in step 4**: the FA tab, with the panels of EQS (see below).
- **Built in step 6**: the ANA tab, with the list, the preview and the analyst of PUB.
- **Built in step 12**: GP has no drawing tools without `analysis:save` (the Journalist, the CEO).
- **Still to do**: PNG and PDF export of the chart stays in the shared groundwork.
- **Built in step 25 (third version)**: the N tab and the DOC · N panel show the news tags.
- **Built in step 31 (third version)**: DES opens the profile of the security's type, the bond
  profile (screen 20) for a bond, and screen 2 keeps the equities (the ETF profile, screen 19,
  comes in step 33).
- **Fourth version (step 41)**: DES opens the commodity profile (screen 21) for a commodity.

## N · News (no mockup): done

- **Built**: two tabs, `/n` and `/n/documents`, each with its saved layout (`N`, `N-DOC`). News on
  the left, filtered by security, country and topic, the article on the right with links to the
  securities concerned; new items arrive through `NewsPublished`. Documents: full-text search
  (`/documents?q=`), type filter and the embedded PDF viewer. Filters and the open item are in
  the URL, so `/n?article=news-1` opens an article.
- **Shared by link (2026-11-10)**: every news item has its address, `/n?article={id}`, which a
  member opens after logging in if need be (`?next=`). The items of N, of the MKT News panel and
  of a profile's N tab are links (a new tab, "Copy link address"); the article's title bar copies
  the address ("Copy link") or sends the article as a card to an open conversation ("Share",
  `features/share-news`, for whoever writes messages). CMarket.Api takes a news item as a shared
  object (`{ type: 'news', newsId }`, kept with its source, time and headline); the card opens
  the article. In MSG, an address of the site pasted in a message is a link. A removed article
  says so instead of an error.
- **Still to do**: the list shows the 50 newest items; "load more" comes with the pagination of
  the shared groundwork.
- **Built in step 25 (third version)**: the type and newspaper tags; filters by security, country,
  category (instead of topic), type and newspaper; the content read from `GET /news/{id}`, with
  its newspaper, author, original link and "Updated on …", and its unique click.

## CAL · Market calendar (no mockup): done

- **Built**: week (Monday to Sunday, today in amber, weekends without a session) or day view
  (a table that sorts and exports) of sessions, auctions, ex-dividend dates, bond redemptions,
  general meetings and earnings releases, filtered by type and country; an event on a security
  opens its profile. Below, the latest BEAC auctions of the screen 4 mockup, cover ratio in green
  above 1 and red below. The view, the day and the filters are in the URL.
- **Mock**: holidays at fixed dates close BVMAC, redemptions come from the bond schedules, held
  auctions from the auction results.

## ALRT · Alerts (no mockup): done

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
- **Built in step 13**: a portfolio limit alert on a portfolio the user reads, as a CEO watches the
  organisation's fund; none for an account type without portfolios (the Journalist).
- **Built in step 25 (third version)**: a news alert follows a security or a country (decision
  5): a FLASH goes out on its channels, an ARTICLE in the app; the notification starts with the
  item's two tags.
- **Still to do**: setting off the publication alerts (a followed analyst, a security or a country)
  when a publication goes out: the analysts are followed from PUB since step 6.
- **Fourth version (step 41)**: an alert on a commodity goes off when a new value comes.

## EQS / FA · Equity screener and fundamental analysis (screen 3): done

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
- **Built in step 12**: without `analysis:save` (the Journalist, the CEO), no SAVE and no saved
  screens; the server refuses them too.
- **Still to do**: the "ANNUAL" switch of the mockup: the statements file has half-years, the API
  no period parameter.
- **Built in step 35 (third version)**: the description of the selected row under the results,
  as the redrawn mockup: its text in the screen's language, its source (the Data admin, EODHD) and
  FR / EN when both languages are written; a language without text shows the other one, marked.
  The results keep seven rows of the grid, the description four, the panels below fifteen.

## YCRV / YAS · Yield curves and bond calculator (screen 4): done

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
- **Third version (step 30)**: YAS opens BP, bond pricing (screen 16), and its old addresses
  `/yas/{bondId}` lead there; screen 4's calculator stays, on the same engine, at
  `/ycrv/{bondId}`, with a link to BP ("Full pricing in BP").
- **Fourth version (step 38)**: the CEMAC curves read the sovereign yield series of the
  `CEMAC_SOV_YIELDS` file, the latest point of each tenor; a point older than 90 days is marked
  stale, and the tooltip gives its type, reference security and source.

## PORT · Portfolio (screen 5): done

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
- **Built in step 13**: a portfolio shared with the organisation from its settings: SHARED for
  its owner, "Shared by P. Owona" and READ ONLY for the colleagues and the CEO, who change nothing
  and generate no report.
- **Still to do**: the mock leaves the logo out of the PDF; a portfolio in EUR holds XAF
  securities at the peg, no floating currency.
- **Fourth version (step 42)**: "Optimise" opens OPT on the portfolio's securities; an allocation
  of OPT becomes a model portfolio, a portfolio, or the trades that adjust an existing one.

## PUB · Research library (screen 8): done

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
- **Built in step 15**: "Publications of M. Ndong" (`?analyst=`), opened from a profile in NET.
- **Still to do**: the country page (open question); notifying the followers of an analyst or a
  subject (the hub sends `PublicationPublished`, alerts of type "publication" are not set off
  yet); card payment through the provider's page (3-D Secure) and its return. Employees read free
  research through the moderation queue (MOD, step 9): the library is a client screen.

## PUB NEW · Publishing studio (screen 7): done

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

## NET · Professional directory (screen 10): done

- **Built in step 15**: the filters, the results and the profile of the mockup, the search and the
  profile open in the URL, and the public page `/p/{handle}`. Since: Contact and Send a message
  open MSG, blocks (step 16); the reported profiles reviewed in MOD, the specialties of ADMCFG
  (step 18). See [step 15](steps/step-15-net-directory.md).
- **Third version (step 24)**: the News provider among the types, with its teal badge.
- **Fourth version (step 43)**: the SVT, a tenth type, has no profile and is not listed.

## MSG · Messaging (screen 11): done

- **Built in steps 16 and 17**: the conversations, the thread and the participant of the mockup,
  contact requests, blocks, groups, files scanned before use, securities, charts, publications and
  news items (from N) shared; then the `/hubs/chat` hub: new messages, read receipts, "typing…",
  online status and the count on MSG in the menu. See steps [16](steps/step-16-msg-messaging.md) and
  [17](steps/step-17-msg-real-time.md).
- **Still to do**: the thread's SEARCH and "⋯" of the mockup; the push and e-mail notifications
  of a message unread after 5 minutes, with the back end, which also encrypts the messages and
  keeps them 24 months.
- **Built in step 25 (third version)**: a news card shows its tags and subject.
- **Built in step 31 (third version)**: a security card opens the profile of its type, a
  bond's the bond profile (it opened BP since step 30).
- **Fourth version (step 43)**: an SVT writes to the traders linked to its bank.

## NET ME · My profile, visibility and contact (screen 12): done

- **Built in step 14**: the profile, its visibility and contact rules and the card preview of the
  mockup. Since: the people blocked (step 16); the Admin's default rules and specialties (step 18).
  See [step 14](steps/step-14-net-me-profile.md).
- **Still to do**: choosing the square of the photo (the mock keeps its centre).
- **Third version (step 24)**: a seventh row, the News provider, in "Who can contact me".

## CFG · Settings (no mockup): done

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
  PDF from the title bar once selected (or by double click); a transfer still due shows its date.
  Members of an organisation read its plan without changing it.
- **Mock**: four plans (Monitoring, Analysis, Professional, and Student for students), prices per
  user and month excluding VAT at 19.25%, a year for ten months. K. Atangana pays Professional
  yearly by card; Asset manager A pays Professional monthly and Bank C Analysis yearly (no
  Portfolio: PORT is locked for T. Bekale), both by transfer; University B has the student plan.
- **Built in step 12**: the green VERIFIED badge of an approved Analyst, Journalist or CEO; the
  user menu opens NET ME since step 14.
- **Still to do**: accepting an invitation (the e-mail link and its sign-up); the status of a
  Student's proof of enrolment.

## Home page (no mockup): done

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
- **Built in step 12**: the six client account types, in two rows of three, with two more photos.
- **Still to do**: the texts are the prototype's, to be checked by the spec author.
- **Third version (step 24)**: seven client types, the News provider among them.

## Login, OTP, sign-up, password reset: done

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
- **Mock**: the accounts of the eight demo users and of their colleagues (password `cmarket2026`),
  salted SHA-256 hashes, access tokens of 15 minutes, refresh tokens of 7 days in the cookie the
  mock keeps for the browser, codes shown by the prototype (`GET /_prototype/codes`). The account
  switch of the user menu opens a session for a demo user.
- **Built in step 12**: the sign-up asks a Journalist for a press card or an employer letter, a
  CEO for a proof of position and the organisation they head; their status then waits for an
  Admin. R. Tamba (Journalist) and E. Fouda (CEO) are demo accounts.
- **Third version (step 24)**: the sign-up of a News provider: its media, the media's letter
  and the signed content agreement.
- **Fourth version (step 43)**: the SVT is not among the types of the sign-up: an Admin creates
  it, and it logs in with a code every time.

## NEWS NEW · News studio (screen 13): done

- **Built in step 26**: the five panels of the mockup: My news by status, with its badges and
  unique clicks; the month's earnings; the editor (headline and counter, standfirst or FLASH text,
  the rich body with its images, credits and CMarket security cards, the PDF, source and author,
  original link, rights box); the publishing settings (category, countries, securities, language,
  type, go live now or at a time of Douala, Preview, Publish, Schedule or Update, Withdraw); the
  file import (templates, drop zone, the last import and its rows in error, Fix row, details,
  Publish). NEWS in the menu, after N; "News studio — Media I" in the top bar.
- **Mockup**: the mockup's country field is a drop-down ("CEMAC (6) · Cameroon"): the studio
  ticks the six and each country in the panel, as NEWS does. Its card "RELATED · BEAC POLICY
  RATES" shows rates, which no security holds: a card names a security of the master list, its
  live price shown. The withdrawal, which section 16 asks for, has no control on the mockup: it
  sits in the publishing panel's title bar.

## ETFS · ETF screener (screen 15): done

- **Built in step 32**: the criteria, the results with the domicile's flag and the five blocks
  of the selected ETF of the mockup, saved screens and the XLSX and CSV export, on the evening's
  calculation of CMarket.Api (see [step 32](steps/step-32-etf-screener.md)).
- **Mockup**: its criteria keep fees "< 0.25%" while its results list CW8 at 0.38%: the screen
  keeps the criteria, five ETFs. Its Sharpe ratios (1.18 to 1.45) imply a risk-free rate near 6%
  in dollars and in euros, which no single rate a currency gives for all six: the demo's rates
  are 4% in dollars and 2% in euros, the Admin's to change, and IWDA's Sharpe ratio reads 1.45.
  Its prices "XX,XX $" are written as the user's language writes amounts ($121.80, 121,80 $).
  Its "30-day" averages are read as the last 30 sessions.
- **Changed on 12 November 2026**: its own entry in the menu, after EQS, which the mockup lights
  ([the spec author's answers](third-version.md#the-spec-authors-answers)).

## BP · Bond pricing (screen 16): done

- **Built in step 30**: the inputs (a bond of the master list or its characteristics entered by
  hand, the platform's yield the user may change, the face amount), the three blocks of results, the
  cash-flow schedule with its total and its XLSX export, the price-yield curve and the rate
  sensitivity of the mockup, on CMarket.Api's `/bonds/price` (see
  [step 30](steps/step-30-bond-pricing.md)). YAS opens BP.
- **Mockup**: its values are case A of section 14.1 at the yield it shows, 5.7302%: the dirty
  price, the durations, DV01, the cash flows and the shifts follow that yield; its clean price
  101.4000 and settlement amount XAF 107,564,384 follow case A's clean price of 101.40, whose
  yield it rounds (BP shows 101.3999 and XAF 107,564,262 at 5.7302%, 101.4000 at the platform's
  unrounded yield). The demo's ECMR is the amortizing bond of case B.
- **Changed on 12 November 2026**: its own entry in the menu, after YCRV, which the mockup lights
  ([the spec author's answers](third-version.md#the-spec-authors-answers)).

## BS · Bond screener (screen 17): done

- **Built in step 29**: the criteria, the results and the four blocks of the selected bond of the
  mockup, saved screens and the XLSX export, on the daily calculation of CMarket.Api (see
  [step 29](steps/step-29-bond-screener.md)).
- **Mockup**: its figures are of 29/10/2026; the demo computes its bonds on the latest session,
  so that the accrued interest, the yields and the durations follow the date. ECMR is the
  amortizing bond of YAS (case B of section 14.1), where the mockup shows case A's yield.
  "Open in BP" opens BP since step 30.
- **Changed on 12 November 2026**: its own entry in the menu, after BP, under YCRV, which the
  mockup lights ([the spec author's answers](third-version.md#the-spec-authors-answers)).
- **Fourth version (step 44)**: "Request a price (RFQ)" on a BTA or an OTA.

## DES on an ETF · ETF profile (screen 19): done

- **Built in step 33**: the header and the tabs DES, GP, HLD, PERF, DIST and DOC of the mockup, then
  N and ANA; DES with the price and NAV history, the performance against the index, the risk, the
  top 10 holdings, the allocation and the structure and costs; under ETFS in the menu (EQS, as the
  mockup, until [the spec author's answers](third-version.md#the-spec-authors-answers)). See
  [step 33](steps/step-33-etf-profile.md).

## DES on a bond · Bond profile (screen 20): done

- **Built in step 31**: the header and the tabs DES, GP, BP, CF, RAT and DOC of the mockup, then N
  and ANA; DES with the price and yield history (model prices lighter, volume bars), today's
  analytics, ratings, characteristics, upcoming cash flows and documents and news; under BS in the
  menu (YCRV, as the mockup, until
  [the spec author's answers](third-version.md#the-spec-authors-answers)). See
  [step 31](steps/step-31-bond-profile.md).
- **Fourth version (step 44)**: "Request a price (RFQ)" on a BTA or an OTA.

## CMDTY · Commodities (screen 21): to do

- **Planned in step 41**: the list of the commodities and the profile of one, DES on a commodity.

## RFQ · Government securities RFQ (screen 22): to do

- **Planned in steps 43 and 44**: "My SVTs" first, then the requests, the answers, the automatic
  selection and the blotter.

## RFQ AGR · Agreements (screen 23): to do

- **Planned in step 46**.

## ECO · Macroeconomic dashboard (screen 25): to do

- **Planned in step 40**.

## FX · FX dashboard (screen 26): to do

- **Planned in step 39**.

## SVT · SVT approval (screen 27): to do

- **Planned in steps 43 and 45**: the SVT's account, menu and trader links first, then the
  approval of the agreements.

## OPT / OPT RES · Portfolio optimisation (screens 28 and 29): to do

- **Planned in step 42**.
