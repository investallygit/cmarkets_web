# Step 29 · Bond analytics and BS · Bond screener (screen 17) (XL): done

Step 29 of the [roadmap](../../ROADMAP.md#order), for the
[third version of the spec](../third-version.md).

CMarket.Api's phase 22.

- **Built**:
  - BS (`/bs`, `analysis:read` and the analysis module), opened from the command bar; the menu lit
    YCRV, as the mockup does, until BS had an entry of its own
    ([the spec author's answers](../third-version.md#the-spec-authors-answers)). The criteria of the
    mockup: the issue category (Sovereign, Supranational / regional, Corporate, and Municipal, which
    the mockup's boxes leave out) and the market (BVMAC, BEAC, and Other markets) ticked, then
    minimum yield, modified duration, maturity, country, currency, minimum rating and coupon type,
    each a drop-down with an amber border while it filters; the mockup's screen by default (above
    5%, duration 0 to 5, this year to six years on, XAF). RUN, Reset, SAVE under a name and the
    saved screens below, as on EQS (`analysis:save`).
  - The results of the latest daily calculation: bond, issuer and country, market, coupon ("Zero"
    for a BTA), maturity, clean price (an asterisk for a model price), dirty price, YTM, YTW (in
    yellow when it differs from YTM: a call), current yield, spread in bp, composite rating ("NR"
    when not rated), modified duration; "Computed" with the date and time of the calculation and
    "Export XLSX" for the accounts that export (`analysis:export`); the mockup's notes below. A
    click shows the bond below, a double-click opens its profile (DES, the bond profile of step
    31), the right-click menu is the security's.
  - The selected bond in the mockup's four blocks: identification and issuer; pricing, yield and
    spreads (YTW "(to 30/06/2027)", the OAS "n/a (V2)" for a bond with options); risk and ratings
    (S&P, Moody's and Fitch, the credit bucket, the durations, the effective duration and
    convexity, the time to maturity); cash flow and structure (coupon and type, frequency,
    maturity and next call, payment status). "Open in BP" opens the bond in the pricing of
    screen 4 (YAS) until BP (step 30).
  - IMP takes the bond list (`bond-master`, BOND_MASTER) and the bond ratings (`bond-ratings`,
    BOND_RATINGS): their templates and columns, their checks worded (a ticker another security
    holds, an amortization schedule that does not add up, dates out of order), their publication
    and rollback. ADMCFG chooses the XAF reference curve among the six CEMAC states' (EUR and USD:
    n/a until their EODHD codes are confirmed, decision 8). AUDT words the new field.
  - Slices: `features/screen-bonds` (criteria, store, saved screens),
    `widgets/bond-screener-results-panel`, `widgets/bond-analytics-panel`, `pages/bond-screener`;
    the screener's hooks and labels in `entities/bond`; the contracts in `bondScreener.ts`, the
    endpoints of `/bonds/screener*`, `/bonds/{id}/analytics*` and `/analysis/bond-screens`; the
    strings in the area file `bonds.json`.
- **CMarket.Api** (phase 22):
  - Section 14.4 in `CMarket.Domain`: current yield, yield to worst over each call (its date and
    price), credit spread over the currency's reference curve at the average life, Z-spread over
    its rates at each payment, OAS (the Z-spread without options, n/a with), effective duration
    and convexity (±25 bp with the yield to worst's logic), time to maturity, composite rating
    (median of the agencies, the lower of two; Investment Grade from BBB− / Baa3); the model price
    of a bond without a quote for 5 sessions (its country's curve at the average life plus its
    last known spread). The calculator of section 14.1 now takes zero coupons, a first coupon
    date, odd first and last periods and amortization schedules; cases A and B unchanged.
  - The bond list's terms on `ref.BondTerms` (category, sector, market, seniority, coupon type,
    floating index and margin, first coupon, status), `ref.BondSchedule` and
    `ref.BondCallSchedule`; `ref.BondRatings` (history); `mkt.BondAnalyticsDaily`;
    `usr.BondScreens`; the XAF curve in `usr.PlatformSettings`; the markets BEAC and OTC and five
    sectors of non-state issuers. The migration `BondAnalytics`, tested up, again by the
    idempotent script, and down on SQL Server.
  - The job `bond-analytics` at 18:30 Douala on weekdays, and after a publication of a bond list,
    prices, auctions or curves, or a new reference curve: each bond of the list not matured,
    settled the next session.
  - The demo: the mockup's six bonds (ECMR and GAB; Cameroon's OTA 3 years and 26-week BTA of the
    latest auction on the BEAC's market, at model prices; BDEAC 5.50% 2030 and COMPANY X 7.00%
    2028, callable on 30/06/2027 at 101, listed on BVMAC at the mockup's prices), S&P's B and B−
    of Gabon, 65 sessions of figures.
- **Checked**:
  - Type check, lint, the 321 unit tests.
  - CMarket.Api: 1,285 tests and the SQL Server suite's 17.
  - Every Playwright flow on CMarket.Api from a fresh database: 96, all passing, and the market's
    two `@fresh-db` flows on a fresh database of their own. Three new ones, of BS: the mockup's
    list, a callable bond's and a rated bond's blocks, the profile and the pricing it opens; the
    BEAC's securities only, a saved screen loaded again, a minimum rating, the XLSX export; a bond
    list published in IMP, whose new bond BS prices at a model price.
  - axe (WCAG 2.2 AA) at 1600, 390 and 320 px, in English and French: BS (the list, a callable
    bond, the save dialog), IMP's upload of a bond list, ADMCFG: 30 audits, nothing found,
    nothing scrolls sideways.
