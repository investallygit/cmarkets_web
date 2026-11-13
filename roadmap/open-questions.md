# Open questions for the spec author

Part of the [roadmap](../ROADMAP.md). Where the spec is silent or contradicts itself, the
prototype, then the plan, made a choice, written after each question ("the prototype: …",
"the plan: …"). The answers received are with the version they belong to
([the spec author's answers](third-version.md#the-spec-authors-answers)).

## First version

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
- **Screens 6 and 9 mockups**: J. Ekane is a Data admin on screen 6, and on screen 9 in the first
  version; the prototype's demo Admin is L. Mvogo.
- **USER**: no endpoint returns the counters by account type: the prototype adds
  `GET /admin/users/counts` (`{ student, analyst, ... }`, the active accounts). It also adds
  `GET /admin/users/export` (the CSV of every account of the filters), `GET /admin/organizations`
  (for the account form) and `?sort=` on `GET /admin/users`, whose items are
  `{ id, displayName, email, accountType, organization, status, verificationStatus, createdAt,
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
- **Fundamentals**: over which equities is a sector average computed? The mock used a fixed
  table (Beverages at the mockup's 6.3%); CMarket.Api averages the equities it covers in the
  sector, so that SEMC, the only Beverages equity, is its own sector's average. The line items of
  the "Financial statements" file need agreed codes (the prototype: `revenue`, `ebitda`,
  `operatingIncome`...).
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
  Admin's settings are under /admin), and `/me` gets `verificationStatus` (`analystStatus` in the
  first version). `/library` takes `followed=true` for the Followed analysts tab and `q` for the
  search; `/me/purchases` takes the same filters; `GET /library/{id}/attachment` serves the
  attachment to readers.
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

## Second version

- **Account types, second version**: which permission keys stand for browsing the directory,
  being listed in it and reading a reported conversation (section 12 names `directory:list` and
  `messages:write` only; the prototype adds `directory:profile` and leaves the reported
  conversations to the Admin's `moderation:manage`)? "Read" forbids saved screens and drawings:
  the prototype adds `analysis:save`, which the Journalist and the CEO lack, and leaves them their
  watchlists and alerts. Which plans do they take (the prototype: the professional ones,
  Monitoring, Analysis and Professional, with the trial of Professional)? Does a CEO need the
  Portfolio module to read the organisation's portfolios? The members of an organisation share its
  plan, so the managers who hold those portfolios have the module. The Admin browses the
  directory, while employees only use the back-office: from which screen (the prototype: MOD,
  which shows the profiles reported; NET stays a client screen)?
- **Portfolios of the organisation**: sharing a portfolio with the organisation has no endpoint.
  The prototype adds `sharedWithOrganization` to the settings of `POST` and
  `PUT /portfolios/{id}`, and `sharedBy` to `GET /portfolios`, which lists the portfolios shared
  after the user's own. Section 6 shares them "between colleagues", section 12 with the CEO: the
  prototype lets every member who reads portfolios read them, without changing them, recording
  transactions or generating reports. May a reader set a limit alert on them (the prototype: yes)?
  Watchlists, which section 6 shares too, are not shared yet.
- **Function codes** (section 8): the table lacks NET, MSG and NET ME, which the mockups of screens
  10 to 12 type in the command bar.
- **Screen 9 mockup, second version**: the list still counts "8 of 1,946 accounts", while the eight
  counters add up to 2,041 (the prototype counts 2,041, and 2,054 with the suspended); its panel
  is still "ANALYST STATUS REQUESTS", while Journalists and CEOs are approved too (the prototype:
  "Status requests", each with its type). E. Fouda is the CEO of Bank C on screens 9 and 11, whose
  plan has no Portfolio module: the prototype makes E. Fouda the CEO of Asset manager A, whose
  managers have portfolios to share.
- **Status requests, second version**: `GET /admin/analyst-requests` keeps its name and lists the
  requests of the three types, each with its `accountType`; `/me` and the Admin's accounts call
  the status `verificationStatus`. What may a Journalist or a CEO do while waiting (the
  prototype: view as the type does; for a CEO, without the organisation's portfolios; without
  messaging)? A Journalist sends one document, a press card or an employer letter; a CEO a proof
  of position and the name of the organisation they head, which the sign-up opens: how does a CEO
  join an organisation already on CMarket?
- **Screen 10 mockup**: "Only profiles I can contact" is ticked, yet A. Tchakounté shows "Contact
  not open" (the prototype leaves out, once ticked, the profiles the user cannot write to; a
  request counts as a contact); D. Moussavou has 9 publications, yet the Analyst status of
  D. Moussavou waits on screen 9 (the prototype lists D. Moussavou without the VERIFIED badge and
  without contact until approved); the directory counts 412 Students for 1,284 active Student
  accounts (the prototype: the others hide their profile); "Analysts who published in last 90
  days" has no parameter in `GET /directory` (the prototype: `recent=true`); the button is "Send
  a request" in section 9 and "Send a contact request" on screen 12. The viewer of the mockup,
  "P. MANAGER", is in no list.
- **Directory**: `GET /directory` gives each card its `contactMode`, which saves a call of
  `/profiles/{id}/contact-permission` per card; the prototype adds `sort` (relevance, name,
  newest members) for "SORT: RELEVANCE", `pageSize` (20) and a comma list in `types`. What is
  relevance? The prototype ranks the text match (the name first), then how complete the profile
  is, the VERIFIED badge and an Analyst's followers. `GET /directory/facets` takes no filter: the
  prototype counts the whole directory and adds the organisations and languages, which the lists
  of the filters need. Do users see their own card (the prototype: yes, with Edit my profile, and
  not among the profiles they can contact)? Are Analysts, Journalists and CEOs waiting for an
  Admin's approval listed (the prototype: yes, without the badge, and without messaging either
  way)? The report reasons are the prototype's (fake profile, spam, inappropriate content,
  harassment, other), one report per reporter and profile (409 after). The public endpoint is
  `/public/profiles/{slug}` and the page `/p/{handle}`: the prototype takes the handle as the
  slug, and answers `GET /directory/specialties` without login for the page. Follow is the
  library's `/analysts/{id}/follow`: the profile gives its `analystId`.
- **Profiles**: the public page is `/p/{handle}` and its endpoint `/public/profiles/{slug}`: how is
  the handle chosen (the prototype: the display name, "k-atangana", numbered when another account
  had it first)? The prototype takes the display name of `PUT /me/profile` as the account's, the
  one CFG changes too, and keeps the work e-mail and phone of the profile apart from the login and
  the phone of the codes. LinkedIn has no display toggle on screen 12, unlike the e-mail and the
  phone: the prototype keeps it from the others, as by default. Who crops the photo square: the
  prototype's server keeps its centre. The specialties have no endpoint: the prototype reads them
  from `GET /directory/specialties`, named in French and English. Which languages may a profile
  list (the prototype: nine, by ISO code)? What does Follow do on a profile that is not an
  analyst's (the prototype shows it on an analyst's only)? Which module of the plans holds the
  directory and messaging, if any (research and settings are in none)?
- **Messaging**: how is a chart frozen for a message (the prototype: a line chart of 1M to 5Y,
  frozen when sent, as PUB NEW freezes one with `POST /publications/{id}/charts`)? A security is
  shared with its price, and a bond with its yield and duration, as they were. What do the other
  members see of an edited or deleted message (the prototype: "edited", and "This message was
  deleted.")? Who adds members to a group (the prototype: its creator, among the people they may
  write to at once; a member leaves, the creator takes one out)? Does a message reach the
  notification centre of the top bar, besides push and e-mail after 5 minutes? Employees cannot be
  messaged and support goes through a help centre, which the spec does not describe. The
  prototype's answers where the API is silent: the Unread tab counts the messages unread, not the
  requests, which have their tab; the
  conversations panel searches with `GET /messages/search` (the thread's SEARCH and "⋯" of the
  mockup are not built); `q` of `GET /conversations` matches the names and the text; the request
  declined stays "sent" for its sender, who cannot write again; the files are uploaded first
  (`POST /attachments`) then sent with `attachmentIds`, and may be sent while scanned; the reasons
  of a conversation report are spam, harassment, scam or market manipulation, inappropriate
  content and other. The mockup's conversation with D. Moussavou is left out: the status of
  D. Moussavou waits for an Admin (screen 9), and a client waiting has no messaging.
- **Messaging in real time**: what does JoinConversation change? CMarket.Api lets a connection
  send "typing…" only from a thread it joined, and sends it, as every other event, to the members
  still in the conversation; the client shows it in the thread it has open (a group per
  conversation kept a member taken out reading the others typing). The spec has no event for a
  conversation that changes: CMarket.Api adds `ConversationUpdated { conversationId }` (a request
  accepted, a member added or taken out, a mute), which the client reads again; and tells a file's
  verdict with `MessageUpdated`. Does a member brought back into a group read what was said while
  they were out (CMarket.Api: yes, as a new member reads the whole history)?
  MessageUpdated and MessageDeleted carry no message: the client reads the thread again after an
  edit and marks a deletion in place. The online status needs a first value besides
  PresenceChanged: the prototype adds `online` to the members of `GET /conversations` and
  `/conversations/{id}`. Who receives PresenceChanged (the prototype: the people the user has a
  conversation with), and does someone who hides their status still see the others' (the
  prototype: yes)? Does the hub send the user's own messages and reads to their other tabs (the
  client takes them)? ContactRequestReceived has no name: the toast gives the sender's account
  type. The count on MSG in the menu is the prototype's (the mockups draw none) and has no
  endpoint: it reads `GET /conversations`. A thread reads the messages that arrive only while its
  tab shows: hidden, it reads them when the user comes back, so ✓✓ means seen.
- **Directory and messaging settings**: the default contact rules, the daily limits of new
  conversations, the report threshold and the list of specialties are the Admin's, without an
  endpoint: the prototype's are `GET / PUT /admin/settings/directory` and `/admin/specialties`
  (GET, POST, PUT and DELETE). Do new defaults reach the profiles never saved (the prototype:
  yes, the others keep theirs)? Is the limit a day set per type (the prototype: yes, 20 and 5
  for a Student by default)? What becomes of the profiles listing a specialty the Admin removes
  (the prototype keeps such a specialty, which can be renamed)?
- **Reports of the directory and the messaging**: `GET /admin/reports?type=` lists reports; the
  prototype groups them by profile or conversation, the open ones only, and dismisses them with
  `POST /admin/reports/{type}/{id}/dismiss`, an endpoint of its own. Which reports count toward
  "beyond 3 reports" (the prototype: the open ones about the account, on its profile, its direct
  conversations and its notes; the reports of a group are about no one)? Is the account only
  shown as referred, or also told, limited or suspended (the prototype: shown, in MOD and USER)?
  Does a suspension close the reports (the prototype: those of the profile and the
  conversations)? Does the Admin read a conversation whose reports were dismissed (the
  prototype: yes, it was reported)? The prototype reads it on request only, since each reading
  is logged.

## Third version

- **News provider, third version**: the text gives a News provider NEWS (the studio) in the menu,
  but the screen 13 mockup lights N and shows PORT, which the matrix refuses: the plan follows the
  text. The studio's code is NEWS NEW (section 9), while NEWS is the Data admin's news and
  documents screen: the plan keeps both, each in its own menu. Is the media a News provider works
  for its organisation, as a CEO's (the plan: yes, and its newspaper belongs to it)? Which
  permission keys stand for the two new rows (the plan: `news:write` and `news:stats`, with
  `news:moderate`, `news:payments` and `subscriptions:manage` for the back-office)?
- **News, third version**: are the eight categories the feed's `topic=` (the plan: yes, as
  `category=`, MKT's ISSUERS and REGULATOR filtering the categories of those names)? Who
  "follows" the securities or countries of a FLASH (the plan: the owners of news alerts on them,
  as for a publication)? Which casing does the JSON take: the spec writes `"type": "FLASH"` and
  `EQUITY`, the API elsewhere `camelCase` (the plan: the spec's codes for the ingestion API and the
  files, the API's style for the front end)? How is automated access told apart (the plan: a view
  3 seconds or more after the content was read, no headless browser, a cap per account and hour
  set by the Admin)? The administration of news (moderation, newspapers, publishers, ingestion
  clients) has no mockup: the plan puts the moderation and the publishers in NEWS and MOD, the
  rest in a new Admin screen, SRC.
- **News, step 25**: the feed's "excerpt" is not described (the plan: an ARTICLE's standfirst,
  none for a FLASH, whose text is the content whose display is paid). Screen 1 shows a subject in
  amber that no field of the studio's table holds (the plan: a Subject field in NEWS, and in the
  studio the first security's code unless written). How many views an hour make automated access
  (the plan: 120 until the Admin sets it in SRC)? The feed filters by `sourceId`, but no endpoint
  lists the newspapers (the plan: `GET /news/sources`). Screen 1 shows DAILY Z in the AI's green,
  and screen 18 pays no Daily Z: the plan takes DAILY Z for a story the AI processed.
- **News studio, step 26**: the studio's table names no subject, while the feed and the
  notifications show one ("[FLASH · MEDIA I] SEMC: …"): the plan takes the code of the first
  related security when it is an amber code (a bond's "ECMR 6.25% 29" is not). Does an edit of a
  published item go live at once (the plan: yes, on Update, with "Updated on …" and a version
  kept), and may a scheduled item change before its time (the plan: yes, it stays complete)?
  May a draft be deleted (the plan: no; it stays a draft)? A `publish_at` less than 24 hours past
  publishes at once; an Excel cell's time, without its zone, is one of Douala. The month of a
  click, its statement's, is counted in UTC for now (step 28 settles the statements). Does a
  withdrawal reach the terminals at once (the plan: the feed drops the item at its next read, no
  hub event)? `PUT /provider/source` names a logo, which the studio does not upload yet: SRC
  (step 27) keeps the newspapers' logos.
- **News administration, step 27**: `/admin/news?status=reported` lists items readers reported,
  but no endpoint lets them report one: the plan adds `POST /news/{id}/report`, with a
  publication's reasons. Which statuses does `GET /ingest/news/{externalId}` answer for an item
  withdrawn (the plan: `withdrawn`, by the AI or after its publication; `rejected`, a moderator's
  reason, when it never went live)? The signature is of the body alone, as written: a call sent
  again is applied again, which an idempotent push makes harmless; should a timestamp be signed
  with it? A push without a category takes MARKETS, without a language French, without a country
  those of its securities (refused when it has none); is an ARTICLE of the AI without a body
  allowed (the plan: yes, "a short summary and a link to the original article")? "A very similar
  headline": the plan compares letters (85% of the character trigrams) and the names and numbers
  (all of one in the other). EODHD's news API needs a ticker or a topic: the plan asks the
  mapped securities (50 at most) every 15 minutes, 5 calls each. A retyped published item is not
  pushed again; should an ARTICLE retyped as a FLASH reach the alerts' channels? The Admin's menu
  places SRC after USER until MPAY (step 28) comes before it. Is a newspaper's item taken down
  told to its News providers (the plan: they read the reason in the studio)?
- **Media payments, third version**: the mockup's total of unique clicks reads 74,364, its rows
  add to 75,364 (its payable and excluded totals agree with them): the screen sums the rows. "38
  accounts · same IP address" on "3 FLASH items" makes 210 clicks, but a reader counts once per
  item, so 38 accounts make 114 at most: the demo's 38 accounts read 6 FLASH items. Which
  newspapers get a statement (the plan: those with clicks in the month, or an amount carried
  over)? Is the cap of the month's amount alone (the plan) or with what the month before carried?
  A statement below the minimum payment follows the cycle with nothing due and never reaches the
  transfer file: is that the intent? "Spike above 5 times the average": the plan compares an
  item's clicks of a day with the newspaper's clicks per item of the 30 days before, from 50 clicks;
  a "wave of new accounts" has no threshold (the plan: the 20 accounts of the shared address). Is
  the newspaper told of a hold (the plan: no)? MPAY follows SUBS (step 34), and SRC, which the spec
  does not place, follows MPAY.
- **Bond screener, third version**: the mockup's figures do not all follow from its bonds' terms:
  ECMR's are case A of section 14.1 (bullet), YAS's case B (amortizing), and COMPANY X's accrued
  interest of 4.51 matches no coupon date of an annual bond paying on 30/06. Its prices fit a
  settlement the next session (29/10 → 30/10), YAS's mockup two sessions (28/10 → 30/10): which
  convention does each market keep (the plan: the next session for the daily calculation)? The
  BTA's spread reads "—": the plan computes it as for any bond (0 on its own curve). The mockup's
  note says a double-click opens BP, the text the bond profile (screen 20): the plan follows the
  text. The issue category boxes leave out MUNICIPAL, the market boxes OTHER: the plan adds a box
  for each. A floating, step-up or inflation-linked coupon is held at the list's rate (the file
  gives no fixings, steps nor index); an odd first or last period earns its share of a coupon by
  actual days; a model price and the Z-spread read a curve flat beyond its ends, the credit spread
  only inside it. The sector of a corporate issuer: FINANCIALS, UTILITIES or INDUSTRIALS, as block
  A lists them. "ISIN · nom" in the mockup's block A is French.
- **Bond pricing, third version**: "Face value (M)" reads 100.00%: the plan takes it as what the
  principal is repaid at per 100 of face value (the coupons run on the face). The
  characteristics give no issue date nor first coupon: a bond entered by hand pays a period apart
  back from maturity, every period whole. "T+1 or T+2 by default depending on the market": the
  plan settles BVMAC and other markets at T+2, as the BP and YAS mockups settle ECMR, and the
  BEAC's securities at T+1; which does each market keep? "The country curve + spread": the plan
  adds the bond's last known spread over its country curve (0 without one), and takes BS's yield
  when its latest calculation priced the bond. `/bonds/{id}/price-yield` cannot draw a bond
  entered by hand: `POST /bonds/price` also answers the curve. The mockup mixes the yield it shows
  (5.7302%, which gives the dirty price, the durations and the shifts) with case A's clean price
  (101.4000 and XAF 107,564,384, which need the unrounded yield), and its +50 bp row reads −1.26%
  where the dirty price falls 1.25%. The modified duration is written in percent, as the mockup
  does; "CALCULATE" in the inputs' title bar is the button below it.
- **ETFS, third version**: the screen 15 mockup keeps fees "< 0.25%" yet lists CW8 at 0.38%; its
  Sharpe ratios need a risk-free rate near 6% for both the dollar and the euro, which no single
  rate a currency fits (the plan: the Admin's rate of each trading currency, 4% and 2% in the
  demo). An ETF is a security per listing, so that IWDA and EUNL, one fund, have their own prices,
  spreads and premiums: are both to be listed, as the mockup does (the plan: yes)? The AUM shows
  in the listing's currency, the fund's turned at the day's rate. "30-day" averages are read as 30
  sessions; the returns are worked out from the stored prices, EODHD's published returns not
  shown; since inception needs the history from the inception. The 1D return of block E (+0.3%)
  and the change of screen 19's header (+0.42%) are one figure for an ETF priced at the close.
  Which EODHD codes are the benchmarks' (MSCI World in dollars and in euros)?
- **ETF profile, third version**: the mockup's allocation lists Health care (10.2%) above
  Industrials (10.9%): the plan orders the classes by weight. Its header shows "$XX.XX" for the
  price, the NAV and the AUM: the plan shows the latest close, NAV and size. Its description line
  reads "Global equity", which the plan writes as ETFS's class line, "Equity · Global", in both
  languages. The tabs HLD, PERF and DIST have no mockup: the plan gives HLD every line kept (the
  100 largest) and both allocations, PERF the total return against the index, every period and
  the calendar years, DIST the distributions and the policy; PERF's chart and years need the
  index's and the fund's total return, which the spec's history (`with=nav`) does not name, so
  the API adds `with=total,index` and `/etfs/{id}/annual-returns`. The "ETF profiles" file
  carries the portfolio in five optional columns: is a separate holdings file wanted? The
  mockup's tabs leave out N and ANA: kept after DOC, as on the bond profile.
- **Bond profile, third version**: the mockup's tabs leave out N and ANA, which screen 2 has: the
  plan keeps them after DOC, so that a bond's news and the research on its country stay one
  click away. Its BP tab shows screen 16's panels inside the profile, as FA shows EQS's; "Open in
  bond pricing (BP)" opens that tab, the BP code still screen 16. The header takes the clean
  price of the latest daily calculation (the spec names `/bonds/{id}/analytics`), not the
  session's live quote, and the change since the calculation before. "AUM" in the
  characteristics is the amount outstanding the text names; "6.25% · fixe" is French; "Sovereign
  · Government" names a state's sector, which the bond list leaves empty. DV01 is for 100 million
  of face value in the bond's currency, as the mockup's "XAF 100 M". The profile's reads (the
  analytics and their history, the ratings, the cash flows) need only `market:read`, as DES: is
  a bond's yield part of the Monitoring plan (the plan: yes), BS and BP staying in Analysis? The
  mockup's ECMR is bullet (case A) where the demo's amortizes (case B), as on BS and BP. A bond's
  order book and latest trades, on screen 2 until now, have no place in the mockup: the plan
  leaves them out. MAX starts at the issue; the history is the daily calculation's, which the
  platform keeps from its start.
- **Subscriptions, third version**: SUBS shows auto-renewal, a stored card and failed payments,
  but no payment provider that keeps cards is named. The plan: a renewal charges the stored card
  or sends a mobile money request, a simulated provider standing in; a failed charge is tried
  again for 7 days, then the plan expires. How is a change of plan prorated (the plan: by the
  day)? Does Suspend cut access at once (the plan: yes, until lifted)? The mockup's Media I pays
  XAF 0 by "Agreement": is that a plan of its own (the plan: "Media source", for the media's News
  providers)? Built in step 34: the proration converts the value of the days left into days of
  the new plan (no refund, no credit carried), a full period charged at once when they buy less
  than a day; Suspend has its own lifting, `/reactivate`, which section 10 does not list, nor the
  catalogue (`/plans`) and the preview of a change (`/proration`) that SUBS reads.
- **SUBS, third version**: the mockup's plans are by account type ("Analyst annual", "Org.
  annual", "Institution annual") where the catalogue's are by module (Monitoring, Analysis,
  Professional, Student, the prototype's): SUBS shows the catalogue's with their cycle
  ("Professional annual") and its prices; is a catalogue by account type wanted? Its invoices are
  numbered FAC-2026-0412, the platform's CM-2026-000130 since phase 9. Its counters count accounts
  (1,871 active against a list of 1,871 subscriptions), which the plan follows: a member counts as
  a subscription, and the list adds a row per paying organisation. Its rows disagree with the
  other screens' demo accounts: S. Mvondo and T. Bekale pay their own plans there, members of
  University B and Bank C elsewhere; Bank C and E. Fouda are expired, while the Trader's flows need
  Bank C's plan and E. Fouda heads Asset manager A; D. Moussavou pays since April, while screen 9
  has him waiting for approval since 22 October; Asset manager A has 5 managers, the demo 3 and a
  CEO; University B 120 students, the demo 4. The plan keeps the other screens' accounts and fits
  the counters with the generated ones. The list says "sort: expiry date" but its rows are not in
  that order; an organisation's expiry is the last day of its period (31/12/2026) where an
  account's is the day it renews (15/03/2027): the plan shows the day it renews or ends for all.
  The organisations of the demo logins renew by themselves, so that a demo account keeps its
  modules (the mockup's "No"). Is "Expiring soon" meant for a plan that renews by itself (the
  mockup's S. Mvondo is)?
- **ETFs and bonds, third version**: which EODHD licence covers news, ETF holdings, NAV and
  spreads, and the EUR and USD government curves, whose codes are "to confirm" (the plan: demo
  data until then; EUR and USD spreads n/a)? The description of a security is in French and
  English, but EODHD writes English only and no endpoint lets the Data admin write it (the plan:
  `PUT /data/securities/{id}/description` from CORR, the English standing in, marked EN). Flags
  are "SVG flag icons" while the icons come from lucide (the plan: `flag-icons`).
- **EQS, third version**: the redrawn mockup's SEMC text ends with "Text written by the Data
  admin and updated with each annual report", a note on where it comes from, which its title bar
  gives ("Source: Data admin"): the demo leaves it out. The results count "5 of 8 securities"
  where the market lists seven equities, the mockup's ticker too: the screen counts the equities
  listed. FR / EN reads as a choice between the two texts, the one shown in brackets as on the
  screen's other tabs. The spec shows the description on EQS alone: should DES, or its FA tab,
  show it too (the plan: no)?

## Fourth version

- **RFQ, fourth version**: the spec's own points to confirm before development: the status, with
  the BEAC and if needed COSUMAF, of a board where every trader sees the requests and answers them
  with firm prices, which resembles a multilateral trading system; the scope of the SVTs'
  confirmation, to be backed by participation terms; the BTA calculation convention (section
  14.1's until the CRCT's is confirmed); the format of the reporting. The plan builds the module
  behind a switch, off until then (decision 24). Besides: which days are the "BEAC payment system
  business days" of the delivery date, the cut-off and the daily report (the plan: BVMAC's
  sessions, until a calendar is given)? The 16:00 cut-off and the 18:00 send are read as times of
  Douala. A trader belongs to a "registered organisation": may an individual account trade (the
  plan: no)? The "maximum face amount per request and per day set by each organisation" and the
  "quota of cancelled or expired requests" have no endpoint and no figure: who sets them, and
  where? A security's "CRCT code", the mockup's `CMXXXXXXXXXX`, is not in the master list (the
  plan: its ISIN, which the Excel file allows). Section 10 keeps the tracking of the CRCT's
  settlement for a later phase, in a note placed under the commodities.
- **SVT, fourth version**: the matrix has no column for the SVT, whose rights a paragraph gives:
  which keys stand for them (the plan: `svt:approve`, with `market:read` and `messages:write`)?
  Its menu on the screen 27 mockup is SVT, TRD, AGR, N, CFG, without the markets "a CEO views" nor
  the messaging "with linked traders" (the plan: MSG added, the market screens from the command
  bar, decision 16); TRD and AGR have no mockup (the plan: the trader links on a screen of their
  own, and screen 23 on the agreements that name the bank). Is the account, "created at the
  bank's request and approved by the Admin", a sign-up to approve, as an Analyst's, or an account
  the Admin creates (the plan: the latter)? Does it need a plan (the plan: none to pay, as a
  media's News providers)? It has no badge colour, which screen 9's counters need. The link's
  e-mail "opens screen 27 after signing in" while the screen 22 mockup reads "Confirmed by
  e-mail": the plan confirms on screen 27. The mockup's buttons read Confirm and Reject for a link
  the text confirms or declines; a link the SVT removes and one the trader removes both read
  "Withdrawn".
- **The compliance team, fourth version**: screen 24 is "reserved for the CMarket compliance
  team", which is no account type; its mockup draws the client menu, RFQ lit, for a "CMARKET
  ADMIN" account without the BACK-OFFICE badge (the plan: the Admin, in the back-office, decision
  17). Its tab bar is the traders', who may not open it: the plan shows them two tabs.
- **Menu and codes, fourth version**: section 9's text of the client menu is unchanged and lacks
  RFQ, which the mockups of screens 22 to 24 draw after YCRV; the codes of section 8 name ECO, FX,
  SVT and OPT, not CMDTY, RFQ, RFQ AGR, RFQ REP nor OPT RES, which the mockups type (the plan: all
  of them). The mockups of CMDTY, ECO and FX light MKT, those of OPT light PORT (the plan: an
  entry each, decision 15, which makes eighteen entries for a Trader). Which module of the plans
  holds each new screen (the plan: Monitoring for CMDTY, ECO and FX, Portfolio for OPT, none for
  the RFQ)?
- **Rates and curves, fourth version**: `CEMAC_SOV_YIELDS` "replaces the Curves and rates file
  type", yet section 11's table of files still lists "Curves and rates", and its sources still
  feed screen 4 from the "Auctions" and "Curves" files: are the auctions and the bonds' closes
  still points of the curve (the plan: yes, decision 20)? The old file also carried the "BEAC
  rates", for which the new template has no row: where do the policy rates and the money market
  rates of `/rates/policy` and `/rates/money-market` come from (the demo's are seeded)? Screen 6
  expects the file at 17:30 of its session, while its points follow the auctions: how often is it
  due (the plan: each session)? Its tenors 13W, 26W and 52W are read as the old file's 3M, 6M and
  1Y. Are the German and US yields of the GBOND series the reference curves of BS's EUR and USD
  spreads, n/a since decision 8? Which EODHD plan will the commercial licence cover: the spec
  names the Fundamentals Data Feed and All-in-One plans for the macro, GBOND and MONEY data. (Step
  38 moved the old file's points into the series as computed points given by the BEAC, and loads
  the Treasury, Bund, OAT and gilt curves each day: they could serve as those reference curves.)
- **FX, fourth version**: section 11 still feeds `/fx` from EODHD's real-time FOREX, screen 26
  from the ECB's daily reference rates: two USD/XAF on two screens (the plan: the reference rate
  on both, decision 22). The matrix writes EUR/XAF 655.96, the header 655.957 (the plan: three
  decimals for the peg, two for the others, as MKT). Which currencies are quoted per 100 (the
  plan: the yen alone)? A currency the ECB lacks, such as the naira, "can be added by file or
  through the EODHD Forex API", without a template (the plan: not built).
- **ECO, fourth version**: the chart offers "any of the 39 indicators", the table names 25 and
  the rules leave two out (the plan: the 37 that EODHD serves besides those two, decision 21). Its
  routes and its code take ISO alpha-3 codes (`CMR`), the rest of the API alpha-2 (`CM`): the plan
  keeps each as written. Are Sub-Saharan Africa and the World, which are World Bank aggregates,
  countries of the selector like the others (the plan: yes, as `SSF` and `WLD`)? The "Macro" file
  that fills a missing series has no template (the plan: year, country, indicator, value,
  source). Is ECO the "country page" that sections 10 and 11 still name for `GET /macro?country=`
  and that has no mockup (the plan: yes; that route stays as CMarket.Api serves it)?
- **CMDTY, fourth version**: the five series of the CEMAC complement have no code, unit nor
  frequency (the mockup lists cocoa, rubber and palm oil by day, gold at "XX", timber by month at
  "XXX"), and their sources and licences are "to be confirmed before go-live": the plan seeds
  them as demo data. Which series is the "reference series" of a commodity's 1-year correlation
  (the mockup: WTI for Brent)? Is an alert on a commodity a threshold on its value, checked when
  a new value comes (the plan: yes, as a price alert)? `PUT /data/commodities/{code}` is placed
  on screen 6 (the plan: in CORR, beside a security's description). The catalogue's market rows
  still give `/commodities` and `/global/indices` to screen 1, which no mockup of MKT shows.
- **OPT, fourth version**: "Student on simulated portfolios": the plan lets a Student run OPT and
  save the allocation as a model portfolio only. The test case's weights add up to 100.1%: ECMR's
  8.6% reads 8.5% on the screen 29 mockup. The estimates are "mean weekly return × 52" while the
  setup offers a history "weekly or daily" (the plan: the same formulas on daily returns, × 252,
  refused when a security is flagged as quoted too seldom). The mockup's risk-free rate is 4.50%,
  "52-week BTA", where PORT's Sharpe ratio takes the Admin's rate (the plan: the Admin's rate,
  which the user changes for a run). "Create a portfolio from the allocation": with which
  transactions (the plan: buys at the last prices, dated today, the rest in cash)? The mockup's
  amounts are round and add up to the capital, while the rule rounds them to whole securities and
  leaves the rest in cash.
