# Fourth version of the spec

Planned as steps 37 to 48: see the [order of the roadmap](../ROADMAP.md#order) and the files of
[`steps/`](steps).

The version of 13 November 2026 (132 pages, against 96), compared sentence by sentence and image by
image with the third. Nothing of the third version is taken out: sections 1 to 5, 7, 13 and 15 to
17 are unchanged, and so are the formulas of 14.1 to 14.5; sections 6, 8, 9 and 12 are reworded
where they count the account types, the codes and the screens. The mockups of screens 1 to 5 and 7
to 20 are the same images; that of screen 6 is redrawn: its session coverage expects "CEMAC
sovereign yields" at 17:30 where it expected "Curves and rates" on Friday, and the BEAC auctions
are "Under review" where they were "Being checked".

- **Account types** (sections 6 and 12): ten. The SVT is an officer of the securities back office
  of a bank licensed as a Treasury Securities Specialist: it approves or rejects the RFQ agreements
  that name its bank, confirms the traders' links and sets their limits (screen 27). The account is
  created at the bank's request and approved by the Admin (the SVT licence and an employer letter),
  logs in with a code every time, neither publishes nor answers requests (the bank's traders hold
  Trader accounts) and is not listed in the directory. The matrix has no column for it; a paragraph
  gives its rights: the markets as a CEO reads them, screen 27, the list and the export of the
  agreements that name its bank, messages with its linked traders; no portfolio, no publication, no
  request board. The Trader now trades BTA and OTA through the RFQ, the CEO reads the
  organisation's agreements, and the News provider is for "managers of local partner newspapers"
  (media managers of newspapers, agencies and business news sites until then).
- **RFQ** (screens 22 to 24 and 27): requests for quotes on the BTA and OTA of the BEAC's auctions.
  A Trader or a Manager of a registered organisation, linked to at least one SVT that confirmed the
  link, publishes a request (the security, buy or sell, the face amount, a rate for a BTA, a clean
  price or a yield for an OTA, the delivery-versus-payment date, 1 to 30 minutes, its SVT for the
  trade, anonymous or not) on a board that every such trader sees. The others answer with a price
  or a rate, a quantity and their SVT, and improve or withdraw the answer until the confirmation.
  CMarket ranks the answers (the best price, then the largest quantity, then the earliest) and
  fills them in that order; the requester confirms the selection as computed, or cancels. Each
  answer selected makes an agreement, "Awaiting SVT": the buyer's SVT and the seller's each approve
  it within 60 minutes and before 16:00 (two approvers above XAF 1 bn), or reject it with a reason.
  Once concluded, its PDF ticket goes by e-mail to both traders and both back offices; the SVTs
  settle at the CRCT, outside CMarket. Every business day at 18:00, a PDF summary and an Excel file
  of the day's concluded agreements go to the BEAC. The spec itself lists points to confirm before
  development: the module's status with the BEAC and, if needed, COSUMAF, the scope of the SVTs'
  confirmation, the BTA calculation convention and the format of the reporting.
- **Screens** (section 9): twenty-nine. 21 CMDTY, the commodities and the profile of one (DES on a
  commodity); 22 RFQ, 23 RFQ AGR (the agreements) and 24 RFQ REP (the daily reporting to the BEAC),
  under one tab bar; 25 ECO, the macroeconomic dashboard (`ECO CMR` opens Cameroon); 26 FX, the
  XAF's cross rates; 27 SVT, the SVT's approvals; 28 OPT and 29 OPT RES, portfolio optimisation,
  its setup and its result. Screen 1's "Rates and FX" panel opens FX; PORT and a watchlist get
  "Optimise"; BS and the bond profile get "Request a price (RFQ)" on a BTA or an OTA; screen 4
  marks a curve point older than 90 days. The mockups of screens 22 to 24 add RFQ to the client
  menu, after YCRV; those of screens 21, 25 and 26 light MKT, those of 28 and 29 PORT; the SVT's
  menu is SVT, TRD, AGR, N, CFG.
- **API** (section 10): some seventy-five rows of routes. `/commodities*` and
  `PUT /data/commodities/{code}`; `/rfq*` (the requests, the board, the answers, the allocation,
  confirm, cancel, the blotter), `/me/svt` and `/svt-links/{token}`, `/rfq/agreements*` with their
  ticket, export and saved filters, `/rfq/daily-reports*`; `/svt/*` (the summary, the approvals,
  the links and their limits, the settings); `/macro/*` (countries, a country's summary, the
  indicators, compare, the CEMAC table, the global rates), `/fx/*` (the crosses, a currency's
  history, convert, the matrix), `/rates/series` and `/rates/{code}/history`; `/optimizer/*` (the
  estimates, check, run, a point of the frontier, the scenarios with their portfolio, rebalancing
  and export); for the Admin, `/admin/rfq/svt`, `/admin/rfq/audit`,
  `/admin/rfq/daily-report-settings`, `/admin/svt-accounts` and `/admin/macro/settings`. A third
  hub, `/hubs/rfq`, with fifteen events.
- **Data** (section 11): from EODHD, the commodities (23 series that FRED publishes, 5 calls a
  request), the macro indicators (39 World Bank series a country, by year, 10 calls), the
  sovereign yields (`.GBOND`: 154 series of 34 countries, none of the CEMAC, 1 call), and Euribor,
  the EUR 10-year swap and the ECB's reference rates of the euro against 42 currencies (`.MONEY`,
  10 calls). Two file templates: `COMMODITY_PRICES` for the products the API lacks (cocoa, rubber,
  palm oil, gold, okoumé timber) and `CEMAC_SOV_YIELDS` for the six countries' yields (a tenor from
  13W to 10Y, a point of type AUCTION, SECONDARY or MODEL, series named `CMR5Y.CMKT`), which
  replaces the "Curves and rates" file.
- **Formulas** (section 14.6, new): mean-variance optimisation under constraints: the expected
  return, the volatility, the Sharpe ratio, each security's share of the risk, the 1-day 95% VaR
  and the bonds' duration; estimates from weekly returns (a bond's yield to maturity), a covariance
  shrunk towards a constant correlation (Ledoit-Wolf); four problems (the lowest risk for a minimum
  return, the highest return for a maximum risk, the best ratio, the lowest risk), a frontier of 25
  points and a test case of eight securities.
- **Back end only** (the notes of section 10): the `rfq` schema (Svt, TraderSvtLinks, Requests,
  Responses, ResponseVersions, Allocations, Agreements, AgreementEmails, AgreementCancellations,
  SavedFilters, SvtApprovals, SvtSettings, DailyReports, DailyReportSends, AuditLog);
  `ref.Commodities` and `mkt.CommodityValues`; `ref.MacroIndicators` and `mkt.MacroValues`;
  `ref.RateSeries`, `mkt.RateValues` and `mkt.FxReferenceRates`; `pf.OptScenarios`,
  `pf.OptScenarioSecurities` and `pf.OptResults`.

CMarket.Api already loads the macro indicators: since 13 November 2026 (its ADR-053) it asks EODHD
for the 39 indicators of the six CEMAC countries once a week, with its key alone, keeps them by
country, indicator and year and answers `GET /macro?country=`, for which the web project has no
contract yet. Step 40 builds on it.

## Decisions taken

The decisions of the third version stand (1 to 13). Where the fourth is silent or contradicts
itself, steps 38 to 48 follow these; each is also an open question for the spec author.

14. **The spec's files**: the fourth version is `CMarket-developer-spec-EN.pdf`, as the code's
    comments name the spec, and the third `CMarket-developer-spec-EN-v3.pdf`.
15. **The menu**: CMDTY, ECO, FX, RFQ and OPT each get an entry of their own, as ETFS, BP and BS
    since the spec author's answer of 12 November: CMDTY, ECO and FX after MKT, which their
    mockups light; RFQ after BS (the mockups of screens 22 to 24 draw it after YCRV); OPT after
    PORT, which its mockups light. A Trader's menu then has eighteen entries, more than a window
    900 px high shows at 44 px each: the menu scrolls, and step 39, the first to add an entry,
    settles how it holds them.
16. **The SVT account**: not offered at sign-up. An Admin creates it from USER, on the bank's
    request, its licence and an employer letter, for a bank of the licensed SVTs; the bank is its
    organisation, as a media is a News provider's (decision 12). Its menu is the mockup's (SVT,
    TRD, AGR, N, CFG) with MSG, for its messages with the traders linked to it; the market
    screens a CEO reads stay open to it from the command bar, out of the menu.
17. **The compliance team**: the Admin. RFQ REP (screen 24), every organisation's agreements and
    the compliance export are back-office screens, under an RFQ entry of the Admin's menu; the
    screen 24 mockup draws the client menu for a "CMARKET ADMIN" account.
18. **Permissions**: `rfq:trade` (publish and answer: the Trader and the Manager, once an SVT
    confirmed their link), `rfq:read` (the organisation's requests and agreements: the Trader, the
    Manager and the CEO), `svt:approve` (screen 27, the links and the agreements that name the
    bank: the SVT), `rfq:report` (RFQ REP, every agreement, the compliance export and the RFQ's
    settings: the Admin), `portfolios:optimize` (OPT: the Student, the Analyst, the Manager and the
    Trader). CMDTY, ECO and FX open with `market:read`. Each key comes with the endpoints it guards
    (decision 13).
19. **Commodities**: a commodity is a security of type `commodity`, as section 9 has
    `GET /securities/{id}` answer it, so that the search, DES, the watchlists, the alerts and the
    news hold it as they hold an equity; its profile is the fourth of `SECURITY_PROFILES`. The
    files and the Data admin write the spec's codes as written (`BRENT`, `COMMODITY_PRICES`,
    decision 3).
20. **CEMAC curves**: the `.CMKT` series take the place of the weekly file's points in screen 4's
    curves (the latest point of each tenor, stale past 90 days); the auctions of the last 90 days
    and the closes of the listed bonds still feed them, as since step 4 (CMarket.Api's ADR-023).
    The points the weekly files published are kept, as points of those series.
21. **Macro indicators**: what CMarket.Api loads since 13 November stays; the refresh becomes
    monthly, as the spec says; ECO offers the 37 indicators EODHD serves once the two the spec
    leaves out are taken off (`real_interest_rate`, `startup_procedures_register`), in the spec's
    six categories, where its table names 25.
22. **Exchange rates**: the ECB's reference rates feed MKT's `/fx` too (EUR/XAF at the peg, the
    others through the euro), so that MKT and FX show one USD/XAF; section 11 still names EODHD's
    real-time FOREX for MKT.
23. **The optimiser**: the quadratic programmes of section 14.6 are solved in `CMarket.Domain`, by
    a solver written for at most 20 securities and checked on the spec's test case, without a
    native library (the spec leaves the library, OSQP or ALGLIB, "to be confirmed by the
    developer").
24. **The RFQ behind a switch**: the module is built with its demo data behind a platform setting
    of the Admin, off until the BEAC confirms its status (on in the demo): off, RFQ leaves the
    menus and its endpoints are closed.
