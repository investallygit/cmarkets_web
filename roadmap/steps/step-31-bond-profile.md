# Step 31 · Bond profile (screen 20), profiles by security type (L): done

Step 31 of the [roadmap](../../ROADMAP.md#order), for the
[third version of the spec](../third-version.md).

CMarket.Api's phase 24.

- **Built**:
  - One place decides the profile from the security's type: `SECURITY_PROFILES`
    (`shared/routes/profiles.ts`) gives each type its tabs, its name in the title bar and the
    menu entry it lights. DES in the command bar, a double-click in a list or a screener, a search
    result and a card shared in MSG all open `/securities/{id}/des`, and the type that
    `GET /securities/{id}` answers picks the profile: screen 2 for an equity, screen 20 for a bond
    (an ETF's comes in step 33). The command bar offers a code on the types whose profile has it:
    CF and RAT on a bond, FA, DVD and HDS on an equity.
  - The bond profile, under YCRV in the menu (under BS since
    [the spec author's answers](../third-version.md#the-spec-authors-answers)) and named "Bond
    profile" in the title bar as the mockup: the header (the issuer's country, the code, the issuer
    and ISIN, the line of the terms: category, market, currency, coupon, redemption, seniority; the
    clean price of the latest daily calculation, an asterisk for a model price, and its change;
    dirty price, YTM, YTW in yellow when a call makes it lower, modified duration, spread, maturity)
    and the tabs DES, GP Price and yield, BP Pricing, CF Schedule, RAT Ratings, DOC Documents, then
    N and ANA, which every profile keeps.
  - DES as the mockup: the price and yield history (the clean price in amber on the left axis,
    lighter on a model price's days, the YTM dotted in blue on the right; YIELD shows the YTM and
    the YTW, SPREAD the spread over the curve; 6M, 1Y by default, 3Y and MAX from the issue; the
    volume of the traded sessions below; the values of the day under the cursor), today's
    analytics (clean, accrued and dirty prices, YTM, YTW and current yield, durations, convexity
    and DV01 of 100 million, spread and Z-spread, the price's source; "Computed" with its date),
    the ratings (S&P, Moody's, Fitch with their dates, NR without one, the composite and the credit
    bucket), the characteristics (issuer, category and sector, seniority, coupon and type,
    frequency and day count, issue and maturity, redemption, early redemption, amount
    outstanding), the upcoming cash flows per 100 of face value with the days to the next coupon
    and "Open in bond pricing (BP)", and the documents and news with their tags.
  - GP, the history alone; BP, screen 16's panels inside the profile on the bond (the analysis
    module's, as FA; another bond of its drop-down opens that bond's profile); CF, the whole
    schedule (past payments in grey, total and principal outstanding, CSV and XLSX) beside the
    payments to come and the characteristics; RAT, the ratings in force, the day's figures and
    every rating given with the one it replaced (upgrades green, downgrades red).
  - Screen 2 keeps the equities: its header and key data lose their bond lines, the DES income
    panel is the dividends. A bond's order book and trades leave its DES (the mockup has none;
    its traded sessions are the history's bars).
  - Slices: `pages/security-profile` split by type (`EquityTab`, `BondTab`, `SharedTab` for N,
    DOC and ANA), the layouts BOND, BOND-GP, BOND-BP, BOND-CF and BOND-RAT saved apart from
    screen 2's; `widgets/bond-profile-panels`; `TwoAxisChart` in `shared/ui/charts` (two axes, a
    lighter stretch, volume below); `useBondHistory`, `useBondRatings` and `useBondCashFlows` in
    `entities/bond`; the contracts in `bondProfile.ts`; the strings under `bondProfile` in
    `bonds.json`.
- **CMarket.Api** (phase 24):
  - `GET /bonds/{id}` adds the bond list's details (ISIN, category, sector, market, seniority,
    coupon type, index and margin, first coupon, payment status) and the calls and puts;
    `GET /bonds/{id}/analytics` the clean price's change since the calculation before, the
    convexity and the DV01 of 100 million; `GET /bonds/{id}/analytics/history` each session's
    volume (the session under way's so far), and MAX up to a bond's life.
  - New: `GET /bonds/{id}/ratings` (each agency's rating in force, the composite and its bucket,
    every rating given and what it did) and `GET /bonds/{id}/cashflows?from=` (the payments from
    today and the days to the next coupon).
  - The profile's reads need only `market:read`, as every security profile: the analytics and
    their history leave the analysis module; BS's screener and BP stay in it. ADR-048.
  - Demo: a year of daily figures (260 sessions, against 65), and COMPANY X traded two sessions
    in twelve before its last five, so that its history mixes quotes and model prices.
- **Checked**:
  - Type check, lint, the 338 unit tests.
  - CMarket.Api: 1,332 tests, 1,315 run and passing (the SQL Server suite's 17 not needed: no
    migration). `npm run test:api` now reads the bond profile's four endpoints as every demo
    account: 476 reads, 190 left out by permission or plan.
  - Every Playwright flow on CMarket.Api from a fresh database: 100, all passing, and MSG's
    `@fresh-db` flow, whose bond card now opens the bond profile, on a database fresh for it. Two
    new ones: ECMR from the command bar (header, tabs, analytics, ratings, characteristics,
    payments to come, documents, the yields over six months, "Open in bond pricing (BP)" to the
    BP tab); CF from the command bar, Gabon's ratings, COMPANY X callable and at model prices,
    DVD refused on a bond. The smoke flow of a bond's DES and BS's double-click follow the bond
    profile.
  - axe (WCAG 2.2 AA) at 1600, 390 and 320 px, in English and French: the bond profile's DES
    (and its yields over 6M), COMPANY X's, GP, BP, CF, RAT, an equity's profile and MSG's bond
    card: 49 audits, nothing found, nothing scrolls sideways.
