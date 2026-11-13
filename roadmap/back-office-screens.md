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
- **Fourth version (step 41)**: a commodity's name, description, exposed countries and related
  securities.

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
- **Fourth version (step 43)**: ten counters; the SVT accounts of a licensed bank, which an Admin
  creates.

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
- **Fourth version (steps 38 to 47)**: the age past which a curve point is stale; ECO's comparison
  countries and tiles, FX's currencies; the licensed SVTs with their back-office address, the
  minimum trading amount, the validity of a link, the approval window and the RFQ's switch
  (decision 24); the keys of the RFQ and of OPT in the matrix.

## AUDT · Audit log (no mockup): done

- **Built**: when, who, action, target, the values before and after and the reason, newest first
  and 50 a page, filtered by user (an account picker), action and dates, all in the URL
  (`/admin/audit?userId=&action=&from=&to=`); a click shows the entry with each value before and
  after. USER's "View audit log" opens it on the account: what it did and what was done to it.
- **Built in steps 12 and 18**: a status approved or rejected, with the account type; the reports
  dismissed, the reported conversations read, the specialties and the directory settings changed.
- **Fourth version (step 44)**: the RFQ's compliance export, over a period.

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

## MPAY · Media payments (screen 18): done

- **Built in step 28**: the month's header, the statements by newspaper with their total, the global
  settings and the transfer file; the click anomalies of the newspaper picked, Invalidate and Keep;
  the statement with its status, a change a second Admin confirms, the newspaper's dispute, Release,
  Recalculate and the PDF; the newspaper's payment settings by month. NEWS NEW shows the newspaper
  its statements and lets it dispute one. See [step 28](steps/step-28-media-payments.md).

## SRC · News sources (no mockup): done

- **Built in step 27**: the newspapers by channel (contract, review mode, logo, News providers),
  CMarket AI's review mode and threshold, the views an hour, the ingestion clients (decision 6 of
  the third version).

## RFQ REP · Daily reporting to the BEAC (screen 24): to do

- **Planned in step 47**, in the Admin's back-office with every organisation's agreements
  (decision 17 of the fourth version).
