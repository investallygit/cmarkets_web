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
- **Built in step 39 (fourth version)**: the Rates and FX panel opens FX (screen 26), from its
  title bar or an exchange rate opened (double click or Enter) on its currency; its rates are FX's,
  the ECB's reference rates (decision 22).
- **Built in step 42 (fourth version)**: a watchlist of two securities or more gets "Optimise" in
  its title bar, which opens OPT on its equities, bonds and ETFs.
- **Fixed in step 50** ([step 50](steps/step-50-page-bug-sweep.md)): the session summary and the top
  movers follow the live prices (B06), live columns sort on the values shown (B42), a news alert's
  tags give way to its subject (B23), the lists holding a security are ticked for screen readers
  (B44), a reload shows the watchlist worked on (B46).
- **Built in step 54 (fifth version)**: a BVMAC security's quote moves at each fixing only, once
  a session at the close (decision 38).
- **Built in step 56 (fifth version)**: a double click on an index, or its name in the ticker,
  opens its profile (screen 31).
- **Built in step 57 (fifth version)**: the Indices panel's Download button opens DL on the indices
  (screen 30).
- **Sixth version (step 67)**: the calendar panel reads the events of screen 32.

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
- **Built in step 41 (fourth version)**: DES opens the commodity profile (screen 21) for a
  commodity; `BRENT DES` and `BRENT CMP` from the command bar, which finds "cacao" too.
- **Fixed in step 50** ([step 50](steps/step-50-page-bug-sweep.md)): GP's toolbar wraps in its panel
  (B13) and never saves over drawings it could not read (B48); the tabs and indicators follow the
  account's permissions (B21); the key data keeps its figures whole (B25) and the header its
  "Delayed" badge (B27); the sector reads in French on a French page (B17); an unknown security
  offers no Retry (B07).
- **Built in step 54 (fifth version)** ([step 54](steps/step-54-security-profile-at-the-fixing.md)):
  redrawn for the BVMAC fixing: the header's last fixing with its date, the previous price and the
  value traded; "Closing price (fixing)", a line of the closes without candles; "Prices of recent
  sessions" in place of the order book and the latest trades; the sessions with trades in the key
  data; the description under the chart (FR · EN, its source and date, edited by CMarket's
  analyst, decision 40); GP without 1D, 5D, candles or bars for a BVMAC security (decision 38); ANA
  stays (decision 39). The Download button in step 57.

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

## CAL · Event calendar (screen 32): done

- **Built**: week (Monday to Sunday, today in amber, weekends without a session) or day view
  (a table that sorts and exports) of sessions, auctions, ex-dividend dates, bond redemptions,
  general meetings and earnings releases, filtered by type and country; an event on a security
  opens its profile. Below, the latest BEAC auctions of the screen 4 mockup, cover ratio in green
  above 1 and red below. The view, the day and the filters are in the URL.
- **Mock**: holidays at fixed dates close BVMAC, redemptions come from the bond schedules, held
  auctions from the auction results.
- **Sixth version (step 67)**: screen 32 gives CAL its mockup: the filters with each type's count
  (the spec's nine types, BVMAC's closed days as a note), the countries, the views by day, week,
  list and month, "only my securities", the ICS and XLSX export; the agenda by day in Douala time;
  the event picked with "Create an alert", "Add to my calendar" and its screen; the calendar
  alerts. The events entered by the Data admin, "announced" until confirmed; EODHD's
  international events behind a switch (decision 57). See
  [step 67](steps/step-67-event-calendar.md).
- **Built in step 67 (sixth version)**: CAL as the mockup: the filters (the nine types with
  their colours and counts, the six states, the four views, "only my securities", Export ICS ·
  XLSX), the agenda by day in Douala time (time, type, state, event, the detail that matters;
  the BVMAC's closed days as notes), the event picked (its facts, the previous comparable auction,
  "Create an alert on this event", "Add to my calendar (ICS)", AUC, the profile or BEAC) and "My
  calendar alerts". MKT's calendar panel shows the same events; the latest auctions panel stays on
  YCRV. ALRT's new type, `calendar`. See [step 67](steps/step-67-event-calendar.md).

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
- **Built in step 41 (fourth version)**: an alert on a commodity goes off when a new value comes,
  from EODHD's load or the Data admin's file.
- **Fixed in step 50** ([step 50](steps/step-50-page-bug-sweep.md)): the history gives a news
  alert's subject the room (B23); the New alert form closes when the screen changes (B47). The form
  keeps no version: the later save of two tabs stands (B101, left as is).
- **Built in step 54 (fifth version)**: a price alert on a BVMAC security goes off at the fixing,
  the only price of its session (decision 38).
- **Sixth version (steps 65 and 67)**: the calendar alerts (decision 57), the BEAC's decisions
  among them.

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
- **Fixed in step 50** ([step 50](steps/step-50-page-bug-sweep.md)): the results sort on the live
  values (B42), their ratios follow the live price (B95), the sector reads in French (B17); COLUMNS
  ticks its entries for screen readers (B44); the saved screens say when they could not be read
  (B63).
- **Built in step 54 (fifth version)**: the description panel reads the latest version on the
  spec's route, with its source and date (decision 40). The Download button in step 57.

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
- **Built in step 38**: behind the auctions of 90 days and the bonds' closes, each tenor's latest
  point of the country's series (`CMR5Y.CMKT`), however old (decision 20). A point older than the
  Admin's limit (90 days) is a hollow square, and the legend says so ("Stale point: older than 90
  days": in the demo, the CAR's 7 and 10 years, last published 17 weeks before). The tooltip says
  what gave each point and when: "Auction", "BVMAC close", or the series' type, source and
  security ("Secondary market · CRCT · CM0000035002"), then the day, "stale" in amber.
- **Built in step 49**: a series' point the concluded RFQ agreements gave (decision 27) names
  them in place of its source: "Secondary market · RFQ agreement · CMOTA2610283", or "2 RFQ
  agreements" without a security when theirs differ.
- **Fixed in step 50** ([step 50](steps/step-50-page-bug-sweep.md)): the calculator settles on the
  market's calendar, T+2 skipping Christmas as BP's does (B51), says an input out of range rather
  than keep the last result (B52), and describes a BTA as a zero-coupon bill (B53).
- **Sixth version (steps 64 to 66)**: the auctions panel links to AUC; AUC, BEAC and DEBT light
  YCRV's entry (decision 61).

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
- **Built in step 42 (fourth version)**: "Optimise" in the header opens OPT on the portfolio's
  lines, the portfolio as the one compared; an allocation of OPT becomes a model portfolio, a
  portfolio (francs and euros only, decision 25), or the trades that adjust an existing one.
- **Still to do (found in step 42)**: a line quoted in dollars (IWDA) is valued without its
  exchange rate, as the PORT valuation converts only the euro at the peg.
- **Fixed in step 50** ([step 50](steps/step-50-page-bug-sweep.md)): a line in another currency is
  settled and valued at the ECB's rate of its day (B01, decision 36); no day's cash ends below zero
  and a redemption repays at most the principal held (B57, decision 28); the tabs show their number
  (B15), the lines end their names in an ellipsis (B16), the outperformance keeps its unit (B24),
  the sectors read in French (B17); a portfolio unknown or no longer shared is said (B11).

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
- **Fixed in step 50** ([step 50](steps/step-50-page-bug-sweep.md)): a purchase is followed to its
  end, the note opened elsewhere (B65); mobile money takes the CEMAC's numbers only (B71, decision
  31); a page past the last goes to the last (B66), an unknown analyst is said (B67), a buyer's list
  reads "Updated" and a notice tells each buyer of a new version (B78).

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
- **Fixed in step 50** ([step 50](steps/step-50-page-bug-sweep.md)): a nil commission is left out
  (B09), the price rules that could not be read are said with Retry (B75), a double click sends once
  (B76), a paste from Word leaves its pictures out (B77), an upload refused says why (B69) and every
  file is scanned (B102).

## NET · Professional directory (screen 10): done

- **Built in step 15**: the filters, the results and the profile of the mockup, the search and the
  profile open in the URL, and the public page `/p/{handle}`. Since: Contact and Send a message
  open MSG, blocks (step 16); the reported profiles reviewed in MOD, the specialties of ADMCFG
  (step 18). See [step 15](steps/step-15-net-directory.md).
- **Third version (step 24)**: the News provider among the types, with its teal badge.
- **Fourth version (step 43)**: the SVT, a tenth type, has no profile and is not listed.
- **Fixed in step 50** ([step 50](steps/step-50-page-bug-sweep.md)): the lists say when they could
  not be read (B63), a page past the last goes to the last (B66).
- **Built in step 62 (sixth version)**: a Trader's or a Manager's profile shows its organisation's
  RFQ completion as requester and responder (decision 53).

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
- **Built in step 48 (fourth version)**: an SVT and the traders a confirmed link joins to its
  bank write to each other at once, one to one, out of the directory: "+ NEW" offers them first,
  an SVT's card gives its bank; a trader may block an SVT, which reports a conversation instead.
- **Fixed in step 50** ([step 50](steps/step-50-page-bug-sweep.md)): a conversation is joined once
  known (B08), one's own address is said (B69), messages that could not be read are said with Retry
  (B74); a declined request holds its sender's next one 30 days, untold (B70, decision 30).

## NET ME · My profile, visibility and contact (screen 12): done

- **Built in step 14**: the profile, its visibility and contact rules and the card preview of the
  mockup. Since: the people blocked (step 16); the Admin's default rules and specialties (step 18).
  See [step 14](steps/step-14-net-me-profile.md).
- **Still to do**: choosing the square of the photo (the mock keeps its centre).
- **Third version (step 24)**: a seventh row, the News provider, in "Who can contact me".
- **Fixed in step 50** ([step 50](steps/step-50-page-bug-sweep.md)): a change not saved is kept from
  a careless exit (B68); the lists say when they could not be read (B63).

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
- **Fixed in step 50** ([step 50](steps/step-50-page-bug-sweep.md)): a change of the plan in force
  is prorated by the day as in SUBS, nothing to pay while the days left buy the new plan (B99, B73,
  decision 29); mobile money takes the CEMAC's numbers (B71); the language switch no longer writes
  an old profile back (B100); the profile asks before leaving unsaved changes (B68); the plans read
  in French (B17).
- **After step 50's release**: the French of a plan change says "la formule Analyse", no longer
  "de Analyse", and puts the amount before XAF. See
  [step 50](steps/step-50-page-bug-sweep.md#after-the-release).

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
- **Fixed in step 50** ([step 50](steps/step-50-page-bug-sweep.md)): the footer follows the session
  (B37), a button's text starts its accessible name (B05), the plans read in French (B17), the
  picture's ticker tape stands still without motion, no entry cut (B14).

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
- **Fixed in step 50** ([step 50](steps/step-50-page-bug-sweep.md)): a suspended account's next
  click says the suspension (B98, with CMarket.Api's 403); the sign-up's documents are scanned
  (B38).

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
- **Fixed in step 50** ([step 50](steps/step-50-page-bug-sweep.md)): the statements follow the other
  side's answer (B97), their tags stay whole (B30), a double click sends once (B76), every file is
  scanned (B102).

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
- **Fixed in step 50** ([step 50](steps/step-50-page-bug-sweep.md)): AUM sorts in francs whatever
  the currency (B64); the saved screens say when they could not be read (B63).

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
- **Fixed in step 50** ([step 50](steps/step-50-page-bug-sweep.md)): an input out of range is said
  on its field (B54), the API's refusals on theirs (B55), an unknown bond shows no other bond's
  figures (B56), and no Retry (B07).
- **Built in step 55 (fifth version)**: block B's three ways to discount (a single yield or a
  clean price, a yield curve, rates entered by cash-flow date or by tenor), the custom curves
  saved, renamed, shared and deleted (decision 45), the equivalent yield and the Z-spread, the
  zero rate of each cash flow, the curve used or the rates used, the sensitivity to them with a
  shock by tenor on a custom curve, the calculation method; section 14.1's curve cases B and C
  (see [step 55](steps/step-55-bond-pricing-from-a-curve.md)). Its part 2, the client's entry
  panel (decision 46): each rate beside its reference and the spread in bp, start from a curve,
  shift all rows, paste from Excel, clear. The Download button in step 57.
- **Built in step 63 (sixth version)**: decision 46's entry panel where the spec draws it, "Rate
  entry by cash-flow date" (or by standard tenor) in the place of "Calculation method" with a
  curve or rates entered: the table, the keyboard (Enter stays, Tab and ↓ go on, Shift+Tab and ↑
  back), an empty date red, and the four entry helpers beside it; block B keeps the mode, the
  entry status (the rates entered, the 0–30% check, the average spread, the starting point) and
  the save, Calculate saying how many dates wait for a rate (decision 56). See
  [step 63](steps/step-63-bp-rate-entry-panel.md).

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
- **Built in step 44 (fourth version)**: "Request a price (RFQ)" beside "Open in BP" on a BTA or an
  OTA of the BEAC, for a Trader or a Manager: RFQ opens with its new request on the security.
- **Sixth version (step 61)**: ten more BEAC government securities in the demo, of Cameroon, Gabon,
  Congo and Chad, at model prices, which the requests by criteria offer: 15 bonds by default.

## DES on an ETF · ETF profile (screen 19): done

- **Built in step 33**: the header and the tabs DES, GP, HLD, PERF, DIST and DOC of the mockup, then
  N and ANA; DES with the price and NAV history, the performance against the index, the risk, the
  top 10 holdings, the allocation and the structure and costs; under ETFS in the menu (EQS, as the
  mockup, until [the spec author's answers](third-version.md#the-spec-authors-answers)). See
  [step 33](steps/step-33-etf-profile.md).
- **After step 49's release**: on a phone HLD cut its names to their first letters; under 36rem
  its table scrolls sideways in its panel instead. See
  [step 49](steps/step-49-rfq-curve-feed.md#after-the-release).

## DES on a bond · Bond profile (screen 20): done

- **Built in step 31**: the header and the tabs DES, GP, BP, CF, RAT and DOC of the mockup, then N
  and ANA; DES with the price and yield history (model prices lighter, volume bars), today's
  analytics, ratings, characteristics, upcoming cash flows and documents and news; under BS in the
  menu (YCRV, as the mockup, until
  [the spec author's answers](third-version.md#the-spec-authors-answers)). See
  [step 31](steps/step-31-bond-profile.md).
- **Built in step 44 (fourth version)**: "Request a price (RFQ)" in the header of a BTA or an OTA
  of the BEAC, for a Trader or a Manager.
- **Sixth version (steps 64 and 66)**: a BTA or an OTA links to its auctions (AUC) and to its
  State's debt (DEBT).

## CMDTY · Commodities (screen 21): done

- **Built in step 41 (fourth version)**: CMDTY in the menu after MKT opens Brent's profile, with
  the list of the 28 series on its left (by category, the last value yellow past 10 or 50 days,
  the change, the badge D, W or M; a right click adds one to a list or sets an alert); the
  header with the key figures; DES with the history (by day, week or month, the 50-value moving
  average), the statistics, the Data admin's description, the data and the CEMAC links; GP the
  history; CMP up to five series rebased to 100 with their correlations; N the news naming it.
  See [step 41](steps/step-41-commodities.md).
- **Fixed in step 50** ([step 50](steps/step-50-page-bug-sweep.md)): CMP's time axis names each year
  once (B10).

## RFQ · Government securities RFQ (screen 22): done

- **Built in step 43**: "My SVTs", alone on the screen for now: each SVT asked with its status and
  date, as the mockup ("Confirmed on 12/09/2026 · 1 Bn / day", "Request sent 28/10 · expires
  04/11", "Link withdrawn by the SVT on 15/10"), a link in force removed, "Add an SVT" asking
  another, which its bank's SVT accounts confirm on TRD; read again live through `/hubs/rfq`. An
  entry of the menu after BS (decision 15), for a Trader or a Manager of an organisation while
  the RFQ is on. See [step 43](steps/step-43-svt-accounts.md).
- **Built in step 44**: the mockup's four other panels under the tab bar of the RFQ's screens
  (Trading; Agreements and BEAC reporting with steps 46 and 47). "New request": a BTA or an OTA,
  buy or sell, the face amount, a BTA in rate or an OTA in clean price or yield, a settlement
  among the BEAC's next ten days, 1 to 30 minutes, a confirmed SVT, anonymous or not, the CMarket
  curve's reference. "My request": the day's requests, the countdown (then the 10 minutes of the
  confirmation), the answers ranked with the responders, their SVTs and the face allocated, the
  automatic selection and its weighted average price, "Confirm selection" at the version shown
  and "Cancel request", then the agreements awaiting the SVTs. The board of the others' requests,
  the anonymous requester hidden, its time left and the trader's answer; the answer form under it
  (a price or a rate, the other worked out by CMarket, a quantity, an SVT, a validity; send,
  improve, withdraw). Today's blotter. Everything read again live through `/hubs/rfq`; the CEO
  reads its organisation's requests and blotter. See [step 44](steps/step-44-rfq-trading.md).
- **Fixed in step 50** ([step 50](steps/step-50-page-bug-sweep.md)): Withdraw's confirmation submits
  only itself (B79); a screen closed to the account says it is not open to it (B85); Confirm
  selection and Cancel request say how they went though the hub's event takes their button away
  before the answer comes.
- **Built in step 61 (sixth version)**: a request by criteria: the amount alone, an optional
  minimum yield, maximum maturity, countries and types; the eligible securities in the place of "My
  SVTs"; the responders offering a security of the list, its price and quantity, checked as they
  type; answers ranked by yield; one agreement per security (decisions 49 and 50). See
  [step 61](steps/step-61-rfq-by-criteria.md).
- **Built in step 62 (sixth version)**: the completion ratio, the organisation's on the board and
  in the answers, the trader's in the blotter; a minimum responder completion on a request, the
  answer form locked below it; the ratio's detail and its disputes (decisions 51 to 55). See
  [step 62](steps/step-62-rfq-completion-ratio.md).

## RFQ AGR · Agreements (screen 23): done

- **Built in step 46**: under RFQ's tabs for an organisation's Traders, Managers and CEO, and from
  AGR in an SVT's menu (decision 26): the filters of the mockup with the user's saved filters, the
  list with its count and total face amount, sorted and paged by the API, XLSX and CSV of every
  agreement kept, each read from the reader's side; the detail (the request and the rank, the
  parties and their SVTs, the security and its CRCT code, the amounts, each SVT's approval, the
  e-mails by recipient, the ticket and its fingerprint); the ticket's PDF for every reader; the
  ticket sent again (to every recipient or to one) and a concluded agreement cancelled on both
  parties' letters, by a Trader or a Manager of either party. See
  [step 46](steps/step-46-rfq-agreements.md).
- **Fixed in step 50** ([step 50](steps/step-50-page-bug-sweep.md)): the status stays in view (B31),
  a third click on a sorted column sorts the other way (B81), a filter refused is said (B82), Reset
  clears what was typed (B83), a page past the last goes to the last (B66); the cancellation's
  letters are scanned (B102).

## ECO · Macroeconomic dashboard (screen 25): done

- **Built in step 40**: as the mockup, the country bar (the CEMAC's six, Sub-Saharan Africa, the
  Admin's comparison countries, the World; "Annual World Bank data · latest year"), the six tiles
  the Admin chose (the figure, its year, its seven years; "n/a" with "series not published", or
  "no figure since 1999" for a series stopped ten years ago or more; the source of a Data admin's
  figure), the chart of any of the 37 indicators for up to six economies (the CEMAC's first four
  by default, 2010 to 2025; 10Y, 15Y, 30Y or MAX; XLSX), the sovereign and reference rates (the
  CEMAC's yields in amber, their point described on hover, then the world's) and the CEMAC
  comparison (a figure's year beside it when not its row's; XLSX). An entry of the menu after
  MKT, before FX (decision 15); `ECO CMR` (or `CMR ECO`) opens an economy, `?country=CMR` keeps it.
  See [step 40](steps/step-40-macro-dashboard.md).
- **Fixed in step 50** ([step 50](steps/step-50-page-bug-sweep.md)): the tile titles wrap (B20), the
  country bar says a failure with Retry (B50), the CEMAC comparison exports in its units (B45).
- **Sixth version (step 65)**: the BEAC's rates link to BEAC (screen 34).

## FX · FX dashboard (screen 26): done

- **Built in step 39**: as the mockup, under the parity's header (the day of the ECB's reference
  rates): the cross rates against XAF of the Admin's currencies (the ECB's rate, XAF per unit, the
  yen per 100, the changes over a day, a month, the year and a year; a click draws the currency,
  kept in the address), the chart from 1M to MAX with the last rate, the 1-year high, low and
  volatility, the converter, the cross-rate matrix and the euro area's benchmarks; the note that
  the rates are indicative and settle nothing. An entry of the menu after MKT (decision 15); MKT's
  rates panel opens it.
- **Still to do**: a currency the ECB lacks, such as the naira, "added by file or through the EODHD
  Forex API" (spec section 9), waits for the spec author (open questions, fourth version).
- **Fixed in step 50** ([step 50](steps/step-50-page-bug-sweep.md)): the converter says letters, a
  negative or too many digits (B49); an unknown currency is said (B11).

## SVT · SVT approval (screen 27): done

- **Built in step 43**: the SVT's account and menu (TRD, N, CFG then; SVT, AGR and MSG with
  steps 45, 46 and 48), the market screens a CEO reads open from the command bar (decision 16).
  TRD, screen 27's "Trader links" on a screen of its own: the bank's requests, oldest first,
  confirmed with the client's daily limit or declined, and its linked traders with their limit
  and link date in a sortable, exportable table, the one picked getting its buttons under it (its
  limit changed, its link removed); a colleague's decision and a new request arrive live.
- **Built in step 45**: SVT, the SVT's home, first in its menu, as the mockup: the counters; the
  agreements to approve by time left with the client, its side, the security, the face, the price
  or rate, the counterparty and its SVT and the checks (OK, Limit, Link; four eyes), then the
  day's decisions with their author and reason; the trader links; the approval settings (the
  Admin's window and cut-off, the bank's four-eyes threshold, approvers, default client limit and
  channels, edited in place; the reasons offered); the agreement picked on the right, "Awaiting
  your approval", its parties and amounts, the checks on the client, both approvals with their
  countdown or decision, Approve and Reject (one of six reasons, "other" with its text). A new
  agreement to approve, a reminder 15 minutes before its deadline and each decision arrive live;
  TRD's confirmation offers the bank's default limit. See [step 45](steps/step-45-svt-approval.md).
- **Built in step 48**: MSG in its menu, its messages with the traders linked to its bank, one to
  one (decision 16): MSG's "+ NEW" offers them, TRD's "Write to" opens a conversation with the
  trader picked. See [step 48](steps/step-48-fourth-version-done.md).
- **Fixed in step 50** ([step 50](steps/step-50-page-bug-sweep.md)): the time left ticks between
  reloads (B80); with one SVT account the bank approves alone, which its settings say (B84, decision
  32); TRD exports its linked traders in XLSX and CSV (B86, decision 34).
- **Built in step 62 (sixth version)**: each linked trader's organisation's completion (decision
  53).

## OPT / OPT RES · Portfolio optimisation (screens 28 and 29): done

- **Built in step 42 (fourth version)**: OPT, the setup, under a tab bar with OPT RES: the
  investment universe (2 to 20 equities, bonds and ETFs, searched or taken from a portfolio or a
  watchlist, each with its type, its expected return and volatility, the estimate shown and the
  value entered in amber, its minimum and maximum weight, flagged when under a year of prices,
  quoted too seldom or without a price), where the estimates come from; one of the four
  objectives with its target; the constraints (100% invested and no short sale, the maximum per
  security, each security's own bounds, the totals per class, country or ETF market, currency,
  "+ Add a constraint"); the capital, the history (1, 3 or 5 years, weekly or daily), the
  risk-free rate (the Admin's shown), the portfolio to compare with; the correlations, a cell
  edited with a click and taken back with Delete, the brighter the closer; the pre-run checks,
  which name the constraints in conflict and the reachable returns and hold OPTIMISE back. The
  scenarios: one opened from a list (`/opt?scenario=`), saved again on today's data, saved as a
  copy, deleted, a new setup.
- OPT RES, the result: the objective, the securities, the constraints and the time taken; the six
  indicators; the allocation (weight and bar, whole securities, amount, risk share, "max" or
  "min", the cash the rounding leaves); the efficient frontier (25 points, the securities by
  class, the optimum, equal weights, the portfolio compared), another point picked on the curve
  or in its list; the breakdown by class with its limits, by country or by currency; the binding
  constraints and the comparison; the next steps: a model portfolio, a portfolio, the trades that
  adjust one, the export in XLSX or PDF, back to the setup. "Not investment advice" on both.
- OPT in the menu after PORT (decision 15), `OPT` and `OPT RES` in the command bar; open to the
  Student, the Analyst, the Manager and the Trader (`portfolios:optimize`, decision 18), a Student
  making model portfolios only.
- **Fixed in step 50** ([step 50](steps/step-50-page-bug-sweep.md)): the tabs fit (B26); the checks
  follow the universe (B36) and say a bound the API refuses (B58); a scenario's name is the user's
  once (B59); OPT RES keeps its saved scenario in its address (B60); an unknown list or id is said
  (B61), a capital that buys nothing too (B62). The demo's prices move independently, their
  correlations near zero (B12, left as is).

## DES on an index · Index profile (screen 31): done

- **Built in step 56 (fifth version)**: the security profile's layout for BVMAC-A and the five
  CMarket indices: the header, the tabs DES, GP, MEMB, PERF and DOC, the index value based 100 and
  compared, the description, the values of recent sessions, the constituents and their
  contributions, which add up to the index change (decision 47), the composition on a date with
  each member's entry and exit, the performance and risk, the returns by month, the methodology
  and notices; from `BVMAC-A DES`, a double click on MKT's Indices panel or the ticker (decision
  44), the members dated (decision 42), BVMAC's reviews uploaded on IMP. See
  [step 56](steps/step-56-index-profile.md).
- **Built in step 57 (fifth version)**: the Download button of the sessions.

## DL · Data download (screen 30): done

- **Built in step 57 (fifth version)**: the eight datasets the profile allows, their settings, a
  preview of 10 rows, the user's files of 7 days and their limits; a file above 50,000 rows made in
  the background; scheduled exports; from the command bar and the user menu, for every account type
  (decision 43), the sources the Admin allows (decision 41). The Download button that opens it
  filled in on MKT's indices, DES, EQS, YCRV, PORT, ETFS, BP, BS, the ETF, bond and commodity
  profiles, RFQ, RFQ AGR, ECO, FX, SVT, OPT RES and the index profile; the formats, the portfolios'
  three tables and the schedules of decision 48. See [step 57](steps/step-57-data-download.md).

## AUC · BTA and OTA auctions (screen 33): done

- **Built in step 64 (sixth version)**: three tabs (AUC, AUC NEXT, APE) with the filters (state,
  type, year, Download); the indicators (amount raised, auctions, average cover, the latest
  52-week BTA and 5-year OTA, the next auction); the latest results with the cover (red below
  100%) and the change from the previous auction of the same security; the average rate of a
  tenor by state over 24 months; the picked result's bids by rate, amber up to the marginal
  rate's cut-off, its bidders, value date and security; the coming auctions; APE's public bond
  issues, entered in CORR. From the `AUCTION_CALENDAR` and `AUCTION_RESULTS` files (decision
  58). YCRV's auctions panel and a BEAC bond's profile open it on their state. See
  [step 64](steps/step-64-auctions.md).
- **Mockup**: its values are fictitious (it says so); the demo keeps screen 4's auctions as the
  latest and adds two years before them.

## BEAC · Monetary policy and liquidity (screen 34): done

- **Built in step 65 (sixth version)**: the six indicators (the policy rate, the two facilities,
  the reserve requirements, the CEMAC's inflation, the next meeting), the corridor since 2019 as
  steps, the Monetary Policy Committee's decisions (announced first, unchanged or the change in
  bp, the release in the PDF viewer or by its link, a meeting picked shows its summary), the
  liquidity injections, the interbank market's latest week and the monetary aggregates; from the
  Data admin's four files (decision 59). The demo's history is marked illustrative. ECO's rates
  and MKT's policy rates open it. See [step 65](steps/step-65-beac-monetary-policy.md).
- **To do**: the alert on a decision is the calendar's, with CAL (step 67).

## DEBT · Sovereign debt (screen 35): done

- **Built in step 66 (sixth version)**: the country bar (the six states and the CEMAC; `DEBT CMR`
  from the command bar), the six indicators (the outstanding, BTA and OTA, the average maturity
  and rate weighted by the outstanding, the principal due within 12 months, S&P / Moody's), the
  redemption schedule (the current year's quarters, then the years, beyond seven in one bar; BTA
  and OTA apart), the CEMAC comparison (a row opens its state), the outstanding securities (a
  double click opens the profile), the ratings with their outlooks and the state's documents,
  Download; computed from the auctions and the master (decision 60). The ratings show behind
  ADMCFG's switch, "(example)" in the demo. ECO's rates and a state's bond profile open it. See
  [step 66](steps/step-66-sovereign-debt.md).
