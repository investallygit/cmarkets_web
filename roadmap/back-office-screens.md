# Back-office screens

Part of the [roadmap](../ROADMAP.md): each screen of the Data admin and of the Admin, what is built,
by which step, and what is still to do. The terminal's screens are in
[Client screens](client-screens.md).

## IMP · Data import (screen 6): done, with DATA, HIST and EODH

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
  security master and the statements of the screens do not read them yet.
- **Third version (steps 29 and 32)**: the bond list and ratings files, the two ETF files.
- **Built in step 29**: the bond list (`bond-master`) and the bond ratings (`bond-ratings`): a
  bond listed or described by its ISIN, a rating added to its history; their rollback.
- **Built in step 32**: "ETF profiles" (`etf-profiles`: a listing by its ticker and exchange,
  listed as an ETF or described again, the size, inception and benchmark EODHD keeps left as they
  are where the file is empty) and "ETF NAV and spreads" (`etf-nav`: a session's NAV and bid and
  ask, an alert past 10% from the NAV before); their rollback.
- **Built in step 33**: the portfolio of "ETF profiles" (its count, day, largest lines and
  weights by sector and region, packed as the bond list's schedules), written back the largest
  first, its rollback to the portfolio it replaced.
- **Fourth version (steps 38, 40 and 41)**: the CEMAC sovereign yields file, which takes the
  place of "Curves and rates" in the session coverage (expected at 17:30, "Under review" while it
  is checked, as the redrawn mockup); the commodity prices file; a "Macro" file for the series
  the World Bank lacks.
- **Built in step 38**: "CEMAC sovereign yields" (`cemac-sov-yields`: date, country as the spec
  writes it, `CMR`, tenor 13W to 10Y, yield, point type, reference security, source, comment):
  after the auctions in the coverage, "Expected 17:30" (in the user's time zone); its template;
  a move of more than 100 bp from the series' point before, and a row that replaces the point
  stored for its day, state and tenor ("Replaces the stored yield of 6.20%"), are alerts to tick,
  the spec's confirmation; its rollback puts the point back. "Curves and rates" is no longer
  offered nor taken: its uploads stay in HIST, filtered by their type, and still roll back.
- **Built in step 40**: "Macro indicators" (`macro`: country, the World Bank's code or a name,
  `CMR`, `SSF`, `Cameroun`; indicator, the spec's key or ECO's code, `debt_percent_gdp`; year;
  value, a deficit below zero; source, `BEAC`, `IMF`, `MINISTRY` or `NSO`; comment), a periodic
  file out of the session coverage; its template, the IMF's debt of Cameroon as the example. A
  row that replaces a stored figure, the World Bank's or an earlier file's ("Replaces the stored
  value of 3.6"), is an alert to tick; the figure published stands with its source, which ECO
  shows, until the upload is rolled back, whatever EODHD's monthly load brings; the rollback
  puts back the figure it replaced.
- **Built in step 41**: "Commodity prices" (`commodity-prices`: date; code, a series of the CEMAC
  complement, `COCOA`, `RUBBER`, `PALM_OIL`, `GOLD`, `OKOUME`, in any case; value; unit, the
  series', `USD/t`; source, its publisher), an on-demand file out of the session coverage; its
  template, cocoa at the ICCO as the example. A monthly series' date becomes the first of its
  month; a date in the future, another series or another unit is an error; a value that replaces
  a stored one, or moves more than 15% from the one before, is an alert to tick. The values
  published show in CMDTY with their source, and an alert on a new value goes off; the rollback
  puts back what each row replaced.
- **Fixed in step 50** ([step 50](steps/step-50-page-bug-sweep.md)): the counters keep their labels
  (B32), the years read as years (B87), the templates pass their own checks (B88), a file rolled
  back is named so (B96), an unknown upload is said (B07), EODHD's figures stay whole (B25),
  EODH's filters stay in the title bar (B28).
- **After step 50's release**: an upload of a retired file ("Curves and rates") shows its rows with
  the template it had, where IMP showed "Loading" for ever. See
  [step 50](steps/step-50-page-bug-sweep.md#after-the-release).
- **Built in step 54 (fifth version)**: the `DESCRIPTIONS` file, each row a new version of a
  description (decision 40), rolled back with its upload.
- **Fifth version (step 56)**: the `INDEX_CONSTITUENTS` file, BVMAC-A's members and weights
  (decision 42).

## CORR · Data corrections (no mockup): done

- **Built**: a security and a session (or a click on one of the two months of stored sessions,
  each with its source: daily prices file, initial history or correction), the stored open,
  high, low, close and volume typed again, a required reason; the log of corrections (when, the
  security, the session, the close before and after, the reason, who), a click opens one. Both
  are in the URL (`/data/corrections?security=SEMC&date=`).
- **Mock**: a correction replaces the session for every screen, today's last price too, and
  outlives the rollback of an earlier file.
- **Built in step 35 (third version)**: the description of the security picked, in French and
  English (2,000 characters each), who wrote each and when, what EQS shows of a language left
  empty, EODHD's English apart; an empty text removes that language. AUDT keeps each language
  changed, before and after.
- **Built in step 41 (fourth version)**: on a commodity (`?security=BRENT`), its names in English
  and French (the list's too), its texts, the CEMAC countries it weighs on and its related bonds
  and equities, ten at most, in place of the description; AUDT keeps what changed.
- **Fixed in step 50** ([step 50](steps/step-50-page-bug-sweep.md)): each price field holds its
  value (B33).
- **Built in step 54 (fifth version)**: a description's versions, each language with its source,
  1,500 characters, on the spec's routes (decision 40); an index's description in step 56.

## NEWS · News and documents (no mockup): done

- **Built**: the news and the documents published, newest first, in two tabs; a click opens one
  in the editor. News: headline, source, topic, country, securities and text, published at once
  to the terminals (`NewsPublished`); documents: type, title, source, securities and the PDF
  (20 MB), shown in the DOC tab of their securities and the N screen. An edit keeps the
  publication date; a document keeps its file unless another is dropped.
- **Mock**: the entries are kept with the sample news and documents; a PDF uploaded stays in the
  tab that sent it (a generated one stands in after a reload).
- **Still to do**: the PDF attached to a news item (spec section 11): for now the Data admin
  publishes it as a document of the same securities.
- **Built in step 25 (third version)**: an item of the CMARKET channel with its type (an
  ARTICLE's standfirst and body, a FLASH's 500 characters), subject, category, countries and
  language; the list keeps the CMARKET channel's items.
- **Built in step 27 (third version)**: the Moderation tab (the items reported, then those
  waiting; approve or keep, take down, retype) and the Publishers tab (the domains of the feeds'
  newspapers).
- **Fixed in step 50** ([step 50](steps/step-50-page-bug-sweep.md)): the Publishers' confirmation
  submits only itself (B79), the panel's actions stay in its title bar (B28).
- **Fifth version (step 56)**: an index as a document's subject: its methodology, notices,
  factsheets and constituents' history (decision 44).

## USER · Account administration (screen 9): done, with ANLY and MOD

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
- **Built in step 12**: the eight account types in the counters, as on the redrawn screen 9;
  "Status requests" of the Analysts, Journalists and CEOs, each with its type and documents.
- **Built in step 18**: "Reports received" in the details of every client, in red once referred; MOD
  reviews the reported profiles and conversations below its publications (see
  [step 18](steps/step-18-admin-directory-messaging.md)).
- **Mock**: the counters add up to 2,041 active accounts (2,054 with the suspended; 1,946 before
  the second version); the three requests, the two reports and C. Nguema's first publication of
  the mockup are seeded. Suspending ends the user's sessions at once; a type changed to Analyst,
  Journalist or CEO is approved with it.
- **Third version (steps 24 and 27)**: nine counters, the News provider approved in ANLY;
  MOD's news panel (step 27).
- **Built in step 43**: ten counters, the SVT's in its own blue; "+ Create account" creates an SVT
  for a bank of the licensed SVTs (its bank chosen in the list ADMCFG keeps; a code at every
  login), the route section 10 names `/admin/svt-accounts`.
- **Fixed in step 50** ([step 50](steps/step-50-page-bug-sweep.md)): an employee's type stays
  readable on a selected row (B22), the counters keep their names (B29), Last login sorts both ways
  (B81), Change type offers the account's family only (B92); ANLY's columns keep their text (B34).
- **Fifth version (step 57)**: the download log, by period and dataset, for the data licences
  (`GET /admin/exports/log`).

## ADMCFG · Platform settings (no mockup): done

- **Built**: quotas of portfolios and alerts by client type (empty for unlimited), the price
  range, CMarket's commission and the moderation mode of research, the risk-free rate of the
  Sharpe ratio, saved together with who changed them last. The permission matrix: the
  permissions by area as rows, the eight account types as columns, the changes counted and saved
  role by role (`PUT /admin/roles/{role}/permissions`); the Admin keeps `settings:manage`.
- **Built in steps 12, 14 and 18**: the quotas of the six client types and the eight columns of
  the matrix, with the rows of the directory and messaging (step 14); the panels Directory and
  messaging (default contact rules, new conversations a day, report threshold) and Specialties.
- **Mock**: users get the new permissions and quotas with their next `/me`, the studio and the
  library the new price range, commission and moderation, PORT the new rate.
- **Third version (steps 24, 29 and 32)**: the News provider's quotas and column of the
  matrix; the reference curve and the risk-free rate of each currency.
- **Built in step 29**: the XAF reference curve of the bonds' spreads (Cameroon's by default).
- **Built in step 38**: under Bonds, the age past which a curve point is stale (90 days, 1 to
  3,650), audited as "Stale curve point after (days)".
- **Built in step 39**: "Macro and FX", the currencies of FX's table (1 to 20 of the ECB's, in
  order) and of its matrix (2 to 8, the euro and the franc allowed): moved up or down, removed,
  added; each list changed audited, "Macro and FX settings" in AUDT. A currency added gets its
  rates at once when CMarket loads them from EODHD.
- **Built in step 40**: "Macro and FX" opens with ECO: its comparison countries (up to 8 of the
  20 offered, Nigeria and France by default, in the selector's order), moved, removed or added,
  and its six tiles, an indicator each of the 37; saved with FX's lists ("Save the settings"),
  each list changed audited ("ECO comparison countries: NGA, FRA → NGA, ZAF"). A country added
  gets its figures at once when CMarket loads them from EODHD.
- **Built in step 43**: "RFQ" beside "Macro and FX": the RFQ's switch (off until the BEAC confirms
  its status, on in the demo; off, RFQ leaves the menus and its routes close, decision 24), the
  minimum trading amount (XAF 10 million), how long a link's confirmation holds (12 months), the
  licensed SVTs with their back office's address, their SVT accounts and links in force: a bank
  added by its name, one unticked to take it off the list; saved together and audited ("RFQ
  settings"). The matrix's row "RFQ (government securities)": `rfq:trade` and `svt:approve`, and
  its SVT column.
- **Built in step 45**: under "RFQ", the SVTs' approval window: the minutes (60, from 15 to 240),
  the cut-off (16:00, from 08:00 to 20:00) and the next business day's deadline (10:00, from 07:00,
  before the cut-off), times of Douala, audited as one field ("SVT approval window: 60 min · 16:00
  · 10:00").
- **Built in step 49**: under "RFQ", "The CMarket curve": the switch "Concluded agreements feed
  the curve" (off) and the face from which they do (XAF 250,000,000, from 1 million to 10
  billion), audited as "RFQ agreements feed the curve: No → Yes" and "Curve feed from a face of"
  (decision 27). The approval window's audit line gets its label, which step 45 had left out.
- **Fourth version (steps 42 to 47)**: the key of OPT in the matrix (step 42).
- **Fixed in step 50** ([step 50](steps/step-50-page-bug-sweep.md)): the quotas fit their panel
  (B35) and a quota refused is said (B91).
- **Fifth version (step 57)**: the sources whose data may be downloaded and each profile's
  download limits (decision 41).

## AUDT · Audit log (no mockup): done

- **Built**: when, who, action, target, the values before and after and the reason, newest first
  and 50 a page, filtered by user (an account picker), action and dates, all in the URL
  (`/admin/audit?userId=&action=&from=&to=`); a click shows the entry with each value before and
  after. USER's "View audit log" opens it on the account: what it did and what was done to it.
- **Built in steps 12 and 18**: a status approved or rejected, with the account type; the reports
  dismissed, the reported conversations read, the specialties and the directory settings changed.
- **Built in step 44 (fourth version)**: under the entry, "RFQ compliance export" for the holder of
  `rfq:report` (the Admin): every request, answer, selection, confirmation and agreement of the
  RFQ between two days, to the millisecond, as CSV.
- **Fixed in step 50** ([step 50](steps/step-50-page-bug-sweep.md)): the columns keep their text
  (B34), an inverted period is said (B90).

## PAY · Analyst payouts (no mockup): done

- **Built**: by analyst and month, the sales, revenue, commission and net payable with its status
  (in progress for the current month, due once closed, paid), the total due in the title bar,
  filters by month, status and analyst in the URL, "Mark paid" for the selected payout in the title
  bar, with a confirmation (also by double click, Enter or the right-click menu). The analyst's
  earnings in PUB NEW show the payment.
- **Mock**: the months up to August are paid, K. Atangana's September too (on 5 October), the
  other analysts' September is due.

## SUBS · Subscription management (screen 14): done

- **Built in step 34**: the counters, the subscriptions of every account and paying organisation
  (search, plan, status and expiry filters, sorted by expiry, CSV), the account's subscription
  with its payments and invoices (each invoice's PDF), Extend, Change plan, Resend last invoice and
  Suspend; "via organisation" for a member. See [step 34](steps/step-34-subscription-management.md).
- **Fixed in step 50** ([step 50](steps/step-50-page-bug-sweep.md)): the tiles keep their names
  (B29) and say they count accounts, the list adding its organisations' lines (B93).
- **After step 50's release**: the French of a plan change and of a price says "la formule
  Analyse", no longer "de Analyse", and puts the amount before XAF. See
  [step 50](steps/step-50-page-bug-sweep.md#after-the-release).

## MPAY · Media payments (screen 18): done

- **Built in step 28**: the month's header, the statements by newspaper with their total, the global
  settings and the transfer file; the click anomalies of the newspaper picked, Invalidate and Keep;
  the statement with its status, a change a second Admin confirms, the newspaper's dispute, Release,
  Recalculate and the PDF; the newspaper's payment settings by month. NEWS NEW shows the newspaper
  its statements and lets it dispute one. See [step 28](steps/step-28-media-payments.md).
- **Fixed in step 50** ([step 50](steps/step-50-page-bug-sweep.md)): the actions stay in the title
  bar (B28), the tags and statuses whole (B30), the newspapers sort as a dictionary (B94), a
  statement follows the other side's answer (B97).

## SRC · News sources (no mockup): done

- **Built in step 27**: the newspapers by channel (contract, review mode, logo, News providers),
  CMarket AI's review mode and threshold, the views an hour, the ingestion clients (decision 6 of
  the third version).
- **Fixed in step 50** ([step 50](steps/step-50-page-bug-sweep.md)): the actions stay in the title
  bar (B28), the newspapers sort as a dictionary (B94).

## RFQ · The Admin's agreements (screen 23): done

- **Built in step 46**: the Admin's RFQ entry, before CFG (decision 17), on screen 23 for every
  organisation's agreements: the buyer and the seller in the list, neither side nor role among the
  filters, the mail server's answer to a failed e-mail in the detail, the ticket sent again and a
  concluded agreement cancelled on both parties' letters (decision 26). RFQ REP (step 47) beside
  it under the RFQ's tabs, the entry lit on both. See [step 46](steps/step-46-rfq-agreements.md).
- **Fixed in step 50** ([step 50](steps/step-50-page-bug-sweep.md)): the agreements sort both ways
  on a third click (B81).

## RFQ REP · Daily reporting to the BEAC (screen 24): done

- **Built in step 47**, in the Admin's back-office under the RFQ entry (decision 17 of the fourth
  version), by its tab beside the agreements since step 46, `rfq:report`: the header of the automatic send, the month's reports by business day,
  the PDF summary of the day picked as it was or will be sent, its send (Send now or Resend, the
  files, the sends logged) and the settings (the send time, the BEAC's address, the copies, the
  nil report). CMarket.Api's job makes and e-mails each report at the send time.
- **To do**: the content and the BEAC's business days, once agreed with the BEAC. The agreements
  concluded by the SVTs (step 45) and cancelled on RFQ AGR (step 46) reach it with nothing more.

## ME · An employee's own settings (no mockup): done

- **Built in step 50** ([step 50](steps/step-50-page-bug-sweep.md), B72, decision 33): the Data
  admin and the Admin change their own profile (name, phone, language, time zone) and security
  (password, where the login codes go) on ME, CFG's two panels, from the user menu's "My settings"
  and the command bar. Until then they changed their password only through "Forgot your password?",
  and nothing else. CMarket.Api's `/me` routes needed no change.
