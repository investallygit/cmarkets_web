# Sixth version of the spec

Planned as steps 60 to 68: see the [order of the roadmap](../ROADMAP.md#order) and the files of
[`steps/`](steps).

The version of 26 November 2026 (157 pages, against 146), compared sentence by sentence and image by
image with the fifth. Sections 1 to 7 and 11 to 17 are unchanged, the formulas of section 14
included (only their lines move); sections 8, 9 and 10 change. Of the mockups, screen 16's second
image is redrawn (rates entered by cash-flow date), screen 22 gets a bottom half (a request by
criteria), and two new images hold screens 32 and 33, then 34 and 35; screens 23 and 24 now share
one image, and so do 25 and 26 (their texts say so: "in the screen 23 image, bottom half"), the
same pictures as before. The client's note that came with it asks for screen 22's two additions:
"the ability to send an RFQ with just the amount and let the responders suggest the security, price
and quantity, and a ratio representing the number of RFQs completed by the user".

- **Screen 22, a request by criteria** (section 9): the "New request" block offers two types, a
  specific security (as before) and "By criteria". By criteria, the amount (face, XAF) is the only
  required field; a minimum yield, a maximum remaining maturity, one or more issuing countries
  (empty: the six) and the security type (BTA, OTA or both) are optional, an empty field imposing
  nothing; the SVT, the duration, the anonymity and the settlement date are those of a normal
  request. It is always a purchase: a seller offers a specific security. CMarket shows the
  requester and the responders the outstanding securities that meet the criteria with their last
  computed yield (the right-hand panel, "Eligible securities"), and refuses to publish when none
  does. A responder picks one of them and enters a price (a rate for a BTA), a quantity and an SVT;
  CMarket recomputes the yield at each keystroke and refuses an answer below the minimum yield,
  beyond the maximum maturity or from a country not accepted, the checks in green or red under the
  form. The answers rank by yield, highest first, then the largest quantity, then time; the
  allocation follows the rules of a specific security (filled in order, the last possibly in part,
  the minimum trading amount). The selection shows the agreements and securities, the average
  yield and the average maturity weighted by the quantities allocated. Each selected answer makes
  one agreement on the security it offered, approved by both SVTs as any other. The board shows a
  request's criteria in place of a security ("Criteria: ≥ 6.50% · ≤ 2 yrs · all countries").
  `POST /rfq` with `mode: "criteria"`, `faceAmount`, and optionally `minYield`,
  `maxMaturityYears`, `countries`, `securityTypes`; `GET /rfq/{id}/eligible-securities`; a
  `securityId` required in `POST /rfq/{id}/responses` for such a request. The mockup's 500 M
  purchase (≥ 6.00%, ≤ 3 years, Cameroon, Gabon, Congo) receives four answers on four securities
  and keeps three agreements, 200 M at 7.02%, 150 M at 6.58% and 150 M at 6.05% in part: 6.60% on
  average, 2.4 years.
- **Screen 22, the completion ratio** (section 9): for each organisation and each trader, the
  share of RFQs carried through to an agreement approved by both SVTs, as a requester (requests
  with at least one concluded agreement, over the closed requests that had at least one valid
  answer) and as a responder (selected answers whose agreement was concluded, over the answers
  selected in a selection the requester confirmed). The requester fails when it cancels after an
  answer, lets the request expire without confirming, or its SVT rejects or lets expire an
  agreement; the responder when its SVT does. Neutral, out of the count: a request without any
  answer, a failure of the counterparty or its SVT, an agreement cancelled by mutual consent after
  its conclusion, a technical incident the Admin confirms. An answer withdrawn before the
  confirmation is no failure, counted apart as a withdrawal rate. Over a rolling 6 months
  (configurable by the Admin), updated with every event; "96% (48)", green from 90%, amber from 75
  to 90%, red below; under 5 cases "New (n)". It shows in a "Completion" column of the answers the
  requester receives, beside the requester (or "Anonymous") on the board, as "My completion" as
  requester and as responder in today's blotter, on the organisation's directory profile
  (screen 10) and on the SVT's screen (27) for its linked traders. The ratio shown is the
  organisation's, not the trader's, to limit cross-checking; the trader's is visible to its
  organisation and the Admin. The requester may set a minimum responder completion: the traders
  below cannot answer, "New" profiles can unless the requester excludes them. The ratio does not
  rank the answers. A participant may dispute a failure with the Admin, with a reason and
  evidence; the Admin can neutralise the case, traced in the audit log.
  `GET /rfq/participants/{orgId}/completion?period=` (both ratios, the case counts, the failures,
  the withdrawal rate); the completion in `GET /rfq/board` and in the answers of `GET /rfq/{id}`;
  `minResponderCompletion` and `excludeNewcomers` on `POST /rfq`;
  `POST /admin/rfq/completion/{caseId}/neutralize`; the table `rfq.CompletionEvents` (the
  organisation, the trader, the role, the request, the agreement, the outcome, the cause, the date).
- **Screen 16, the rates entered** (section 9): the spec now draws what decision 46 built from the
  client's answer of 22 November, in another place. In rates-entered mode a panel "Rate entry by
  cash-flow date" takes the place of "Calculation method" at the bottom centre: one row per
  remaining cash-flow date with the date, the time t, the reference curve's rate (greyed), the
  entry cell and the spread to the curve in bp; Enter confirms, Tab or ↓ moves to the next row, the
  spread follows each keystroke, an empty cell turns red and blocks the calculation. Its entry
  helpers on the right: start from a curve (the day's CMarket curve copied, then edited), shift all
  rows by a number of bp, paste two columns "date ; rate" from Excel, clear. "Standard tenor" in
  block B shows the same columns for the tenors from 3 months to 10 years, interpolated to the
  dates. Block B keeps the "Entry status" (the rates entered for the dates, all between 0 and 30%,
  the average spread to the curve, the starting point) and the save as a custom curve. The
  mockup's example is test case C, typed from the CMarket curve of 29/10/2026.
- **Screen 32, the event calendar** (CAL, section 9): one agenda of what moves the CEMAC market,
  in Douala time: the auctions and their results, the government securities redemptions, the
  dividends, the general meetings, the earnings releases, the BEAC's Monetary Policy Committee, the
  statistics, and as an option the international events (EODHD's Economic Events API). The filters
  on the left (each event type with its count, the countries, the view by day, week, list or month,
  "only my securities" from the portfolios and watchlists, an ICS or XLSX export); the agenda by
  day in the centre (the time, the coloured type, the country, the event and a detail: the amount
  offered, a rate, a dividend, the previous figure); the event picked on the right (create an
  alert, add to my calendar in ICS, open the auction, the profile or BEAC) and the user's calendar
  alerts with their channels (screen, e-mail, SMS) below it. The sources: the Treasuries' quarterly
  calendars and auction results, BVMAC's corporate actions, the BEAC's releases, the issuers'
  announced dates, EODHD's international events; an event the Data admin enters by hand is marked
  "announced date" until confirmed. `GET /calendar?from=&to=&types=&countries=&mine=`,
  `/calendar/{id}`, `/calendar/export?format=ics|xlsx`, `/alerts?source=calendar`.
- **Screen 33, the BTA and OTA auctions** (AUC, section 9): the CEMAC primary market in three tabs,
  the results (AUC), the coming auctions (AUC NEXT) and the public bond issues (APE). The
  indicators (the amount raised in the year, the number of auctions, the average cover, the last
  52-week BTA and 5-year OTA rates, the next auction); the latest results (the date, the country,
  the security, the maturity, the amounts offered, bid and allotted, the cover, the weighted
  average and marginal rates, the change from the previous auction of the same security; filters
  and download); the 52-week BTA average rate (or another tenor) over 24 months, a line per
  country; an auction's detail (the bids by rate level with the marginal rate's cut-off, the
  amounts, the cover, the rates, the bidders, the value date); the coming auctions. A cover below
  100% is red. The results also feed the CEMAC curve (screen 4, the CMKT series), the security's
  profile and the calendar; the bids by rate show only when the BEAC publishes them. The files
  `AUCTION_CALENDAR` and `AUCTION_RESULTS` of screen 6. `GET /auctions/summary`,
  `/auctions?status=done|planned&country=&type=&from=&to=`, `/auctions/{id}`,
  `/auctions/rates?tenor=&countries=`, `/public-offers`.
- **Screen 34, the BEAC's monetary policy and liquidity** (BEAC, section 9): the indicators (the
  policy rate, TIAO, the marginal lending and deposit facilities, the reserve requirements, the
  CEMAC inflation, the next MPC); the rate corridor since 2019 as steps; the MPC's decisions (the
  date, the policy rate, the marginal lending facility, unchanged, hike or cut in bp, the release
  as PDF; a summary and an alert on publication); the liquidity injections (the date, 7 or 28
  days, the amounts offered, bid and allotted, the rate); the interbank market (overnight, 1 week,
  1 month, 3 months, the weekly volume, their changes); the monetary aggregates (M2, the credit to
  the economy, the FX reserves in months of imports, the external coverage, the inflation, the
  growth forecast, each with its date). The files `BEAC_POLICY`, `BEAC_OPERATIONS`,
  `INTERBANK_RATES` and `MONETARY_AGGREGATES`; an MPC decision triggers an alert and updates the
  calendar. `GET /beac/summary`, `/beac/rates/history`, `/beac/decisions`, `/beac/operations`,
  `/beac/interbank`, `/beac/aggregates`.
- **Screen 35, the sovereign debt** (DEBT, section 9): a State's debt on the BEAC's government
  securities market, and the six compared, from `DEBT CMR` or a BTA or OTA profile. The country
  picked (or the CEMAC); the indicators (the securities outstanding, the BTA and OTA shares, the
  average maturity, the weighted average rate, the amount maturing within 12 months, the rating);
  the redemption schedule (the principal by quarter, then by year, BTA and OTA apart); the CEMAC
  comparison; the outstanding securities (a double click opens the profile); the agencies' ratings
  and the documents (issuance calendar, budget law, debt bulletins). The outstanding is the sum
  allotted at the auctions less the redemptions and buybacks; the maturity and rate are weighted
  by the outstanding; the 12-month amount is the principal due within 365 days. The file
  `SOVEREIGN_RATINGS`; showing S&P's, Moody's and Fitch's ratings is "a point to confirm" under
  their licences. `GET /debt/{country}/summary`, `/redemptions`, `/securities`, `/documents`,
  `GET /debt/compare`.
- **The Data admin's new files** (section 9, screen 6): `AUCTION_CALENDAR` (quarterly, with
  updates), `AUCTION_RESULTS` (after each auction), `BEAC_POLICY` (each MPC), `BEAC_OPERATIONS`,
  `INTERBANK_RATES` (weekly), `MONETARY_AGGREGATES` (monthly or quarterly), `CORPORATE_EVENTS`
  (AGMs, earnings dates, other issuer events) and `SOVEREIGN_RATINGS` (each change). Section 11's
  list of files is not updated.
- **The API and the tables** (section 10): the routes above; the tables `mkt.Auctions`,
  `mkt.AuctionBids`, `mkt.CalendarEvents`, `mkt.BeacPolicyRates`, `mkt.BeacOperations`,
  `mkt.InterbankRates`, `mkt.MonetaryAggregates`, `ref.SovereignRatings`; the debt outstanding
  computed from `mkt.Auctions` and the securities master; the events `AuctionResultPublished`,
  `BeacDecisionPublished` and `CalendarEventChanged`.
- **Codes** (section 8): CAL (screen 32), AUC (33), BEAC (34), DEBT (35, `DEBT CMR`); thirty-five
  screens. Section 12's matrix has no row for them.

## What is there already

- **CAL** exists since the first version, without a mockup: a week or a day of sessions, auctions,
  ex-dividend dates, redemptions, general meetings and earnings releases, and the latest auctions
  below. Screen 32 redraws it.
- **The auctions**: `mkt.Auctions` holds the results of the `AUCTION` file of IMP (a date, a
  country, BTA or OTA, a term, the maturity, the three amounts, the cover, the average and marginal
  rates), read by `GET /auctions`, YCRV's panel, CAL and the CEMAC curve. It has no security, no
  bids by rate, no bidders, no value date and nothing planned.
- **The BEAC's rates**: `mkt.PolicyRates` (a rate's code, its date, its value), which ECO and MKT
  read. Nothing on the operations, the interbank market or the aggregates.
- **The alerts**: an `auction` alert on a country's results; nothing on the BEAC or the calendar.
- **The RFQ**: a request names one security (`SecurityId`, its instrument and quote type), each
  responder answers once (improving or withdrawing it), the agreement carries its own security.
  Neither a ratio nor a history of outcomes.
- **BP**: the reference rate, the spread and the four helpers of decision 46, in block B; the
  "Calculation method" panel below the schedule.

## Decisions taken

The decisions of the earlier versions stand (1 to 48). Where the sixth is silent or contradicts
itself, steps 61 to 68 follow these; each is also an
[open question](open-questions.md#sixth-version) for the spec author.

49. **A request by criteria**: a purchase, its face amount required as any request's; the minimum
    yield in percent to two decimals, the maximum remaining maturity in years to two decimals
    (0.25 at least), the countries among the six, the types BTA, OTA or both. A security is
    eligible when it is a BTA or an OTA of the master list, outstanding on the settlement date
    (issued, maturing after it), of an accepted country and type, its remaining maturity at the
    settlement date within the maximum, and its last computed yield (BS's, screen 17, or its
    auction's rate for a BTA without one) at or above the minimum, as the mockup lists them; the
    list is drawn at publication and kept with the request, so that both sides read the same one,
    by yield, highest first. A responder answers one security of it, once, as now; improving may
    change the security. The answer is quoted as its security is: a BTA in rate, an OTA in clean
    price; CMarket works out the yield on the settlement date with section 14's formulas and
    checks it again on the server. The requester's reference is no curve price but the eligible
    list; the requester's own organisation still cannot answer.
50. **Ranking and agreements by criteria**: by yield, then quantity, then the time of the answer's
    last version, the allocation unchanged. The selection's average yield and maturity are
    weighted by the face allocated. Each agreement is on its answer's security, at its price or
    rate, with its accrued interest, as any other: AGR, REP, the SVT's approval, the tickets and
    the curve fed by agreements (step 49) take it unchanged. RFQ AGR's and DL's "security" column
    reads the agreement's, a request's row reading "By criteria".
51. **What a completion case is**: as a requester, a request that ended (confirmed, cancelled or
    expired) with at least one valid answer, one not withdrawn (step 62: an answer that ran out of
    validity before the request expired still counts); it succeeds with one agreement concluded,
    fails when it was cancelled or expired unconfirmed or when none was concluded and one failed
    through the requester's SVT, and is neutral when every agreement failed through the other side.
    As a responder, an answer selected in a confirmed selection, successful when its agreement is
    concluded. An agreement that expires unapproved is the fault of the side whose SVT did not
    decide, both when neither did. An agreement concluded then cancelled by both (step 46) is
    neutral. The withdrawal rate is the answers withdrawn before the confirmation over the answers
    sent. Each case is an event of `rfq.CompletionEvents`, written when its outcome is known, once
    per organisation and trader and role; the ratios are counted from them over the window when
    read.
52. **The window and the display**: 6 months by default, from 1 to 24 in ADMCFG's RFQ panel; the
    ratio rounded to the whole percent, "96% (48)" with the cases counted, green from 90%, amber
    from 75%, red below; "New (n)" under 5 cases. A Trader and a Manager read their own ratios and
    those of their organisation's members; the Admin all of them, in USER and on the Admin's RFQ
    screen.
53. **Whose ratio is shown**: on the board, in the answers and on NET, the organisation's, as the
    spec says, an anonymous request showing its requester's organisation's without naming it; the
    blotter's "My completion" is the trader's own. NET shows it on the directory profile of a
    Trader or a Manager (the directory has no profile of an organisation), both roles; the SVT's
    screen shows each linked trader's organisation's. The minimum responder completion compares the
    responder's organisation's ratio as a responder, the one the requester sees; "New" is under 5
    cases there.
54. **Disputes**: the trader concerned or a Manager of its organisation disputes a failure from
    the ratio's detail, a reason (500 characters) and up to three files as evidence (PDF or image,
    5 MB each); the Admin reads the disputes on the Admin's RFQ screen, neutralises the case or
    turns the dispute down with a reason, and may neutralise a case without a dispute (an
    incident); each decision goes to AUDT and to the participant by a notification.
    `POST /rfq/completion/{caseId}/disputes` and `GET /admin/rfq/completion/disputes` are the
    plan's, beside the spec's `POST /admin/rfq/completion/{caseId}/neutralize`.
55. **The demo's ratios**: CMarket.Api's demo writes six months of past cases for its
    organisations and traders, from the mockup's range (64% to 97%, a "New (3)"), as events that
    keep the request's and the agreement's numbers without their rows, so that AGR, REP and the
    curve are not filled with them; the requests made since add their own events.
56. **BP's entry panel, as the spec draws it** (it replaces where decision 46 put it): in
    rates-entered mode the panel of the layout's `method` slot shows the entry table and the
    helpers, "Calculation method" coming back in the other modes; block B keeps the mode, "Cash-flow
    date" or "Standard tenor", the entry status and the save. Enter confirms the cell and stays on
    it, Tab and ↓ go to the next row, Shift+Tab and ↑ to the one before; an empty cell is red and
    Calculate says why it waits. "Start from" copies the CMarket curve of the bond's country at the
    settlement date or a curve of the list, as before; decision 46's reference rule stands.
    Built in step 63 with the curve mode too: its rates stay editable (spec section 9), and a rate
    changed makes them rates entered in the same panel rather than moving the table under the
    cursor; "Calculation method" shows with a single yield.
57. **CAL, rebuilt**: the spec's nine types (BTA and OTA auctions coming, auction results,
    redemptions, dividends, general meetings, earnings releases, BEAC monetary policy, CEMAC
    statistics, international); BVMAC's closed days stay as a note on their day, no longer a type.
    "Only my securities" keeps the events of a security of the user's portfolios and watchlists,
    leaving out those of a country. A calendar alert is a new alert type, `calendar`, on a type of
    event and a country (CMR auction results, BEAC MPC decisions, statistics) or on the user's
    securities (dividends, D−2 by default, general meetings, earnings releases), with the alerts'
    channels and quotas; ALRT lists it. The ICS has one event or the filtered list, in Douala time.
    The Data admin enters an event by hand in CORR ("announced date" until confirmed) and loads
    `CORPORATE_EVENTS` on IMP. The international events come through EODHD behind ADMCFG's source
    switch, off by default until the licence and the key's plan are checked (decision 41). Built in
    step 67: the events entered or loaded are `mkt.CalendarEvents` (data.CalendarEntries moved), the
    others read from their tables (the planned auctions not held, the results at 15:00, the
    redemptions, the dividends, the BEAC's meetings at 10:00); a country keeps the zone's and the
    international events; "only my securities" reads the portfolios' transactions and the
    watchlists; CORPORATE_EVENTS maps its types to meetings and releases ("other" a release); a
    calendar alert goes off each morning the days it asks ahead, with the results, or with a BEAC
    decision published, once an event; the demo turns EODHD's events on with fourteen examples; CAL
    opens on the list of two weeks from today, without the international events, which a click adds.
58. **The auctions**: `mkt.Auctions` gains the security (the master's BTA or OTA it issued, created
    or found by its code), the status (planned or done), the value date, the method and the
    bidders; `mkt.AuctionBids` the bids by rate when published. `AUCTION_CALENDAR` adds or updates
    the planned rows, `AUCTION_RESULTS` completes them (the old `AUCTION` file is read as
    `AUCTION_RESULTS`); a result publishes `AuctionResultPublished` and the `auction` alerts. "The
    previous auction of the same security" is the one of the same country, instrument and term. The
    rate chart takes a month's average, a month without an auction leaving a gap. APE lists the
    public bond issues the Data admin enters in CORR (issuer, sovereign or corporate, the amount
    sought, the coupon, the maturity, the subscription period, the arranger, the status, the
    amount raised), the spec naming neither their columns nor a file. Built in step 64 with the
    planned auctions in a table of their own, `mkt.PlannedAuctions`, which the result names: the
    results keep their figures required, and the curve, the alerts and the RFQ read them as before.
    No method: neither the mockup nor the files give one. A BTA the master lacks is created, not an
    OTA, whose coupon the result does not give.
59. **BEAC**: `BEAC_POLICY` writes the MPC's decisions and the rates of `mkt.PolicyRates` that ECO
    and MKT read already, a row dated later without rates being the next MPC; the decision
    (unchanged, hike or cut in bp) is worked out from the previous rate. The release is a document
    the Data admin publishes in NEWS with the BEAC as subject, its link kept on the row. The demo's
    history since 2019 is marked illustrative, as the mockup. Built in step 65: MKT reads
    `mkt.PolicyRates`, ECO does not (it links to BEAC), and a meeting writes the policy rate and
    the marginal lending facility there; the row's release is an https link or the id of a
    document of the library, shown in the PDF viewer, and the file carries the release's summary,
    which a meeting picked shows. The alert on a decision is the calendar's of step 67. A demo row
    no upload wrote is illustrative.
60. **DEBT**: a security's outstanding is the sum allotted at its auctions, or the master's amount
    issued for an OTA issued before CMarket's auctions, less the principal its schedule repaid; no
    buyback is recorded until a file brings one. The rate of a BTA is its auction's average rate, of
    an OTA its coupon; the schedule groups the current year's quarters, then the years, beyond seven
    years in one bar. The agencies' ratings show behind an ADMCFG switch, off by default until their
    licences are confirmed, on in the demo with "(example)"; the documents are NEWS documents with
    the country as subject. Built in step 66: a security is a state's XAF bond, the BEAC's zero
    coupons its BTAs and every other one, the listed included, an OTA; a security that no auction
    names counts its amount issued; the yield is the last computed, else a BTA's auction rate; a
    NEWS document gets a state of its own (none by default), and the zone (CEMAC) adds the six
    states up without a rating. The demo's securities issued before CMarket's auctions bring each
    state near the mockup's comparison; its ratings are the mockup's, marked as examples.
61. **Who reads the new screens**: section 12's matrix leaves them out; CAL, AUC, BEAC and DEBT
    follow ECO and FX (`market:read`, the monitoring module), every client account type that reads
    ECO, the SVT among them from the command bar (decision 16). Not in the left menu (decision 15):
    CAL lights MKT, AUC, BEAC and DEBT light YCRV, as their mockups; YCRV, ECO, the bond profile and
    each other open them. The Data admin uploads their files; the Admin reads them as a client.
