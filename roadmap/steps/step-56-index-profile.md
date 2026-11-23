# Step 56 · DES on an index: the index profile (screen 31) (L): done

Step 56 of the [roadmap](../../ROADMAP.md#order), for the
[fifth version of the spec](../fifth-version.md).

CMarket.Api's phase 44 (ADR-070). Builds on step 54: the description panel and the recent sessions'
table.

## Built

- **The page** (`pages/index-profile`): `/indices/{code}/{fn}`, screen `IDX` (not in the menu, MKT
  lit), its tabs DES Profile, GP Chart, MEMB Constituents, PERF Performance and DOC Methodology,
  each with its own saved layout (`IDX`, `IDX-GP`...); `?doc=` opens a document in DOC. The command
  bar reads `BVMAC-A DES` (or GP, MEMB, PERF, DOC) before a security's code; a double click on MKT's
  Indices panel and an index of the ticker (now a link) open DES. MCAP says it has no profile.
- **The panels** (`widgets/index-profile-panels`): the header; the index value (recharts, 1M to 5Y,
  10Y on GP, base 100, compared with another index or a constituent, both based on their first
  common session); the values of recent sessions (10, 20, 60, XLSX and CSV, the note of a computed
  or an uploaded index); the constituents (sector in the page's language, weight at the previous
  close, price, change, contribution in points, their sum beside the index change; a double click
  opens the security); on MEMB the composition on a date typed, each member's entry and exit, and
  the constituents' history as XLSX; the performance and risk; the returns by month and year; the
  methodology and notices, opened in the PDF viewer. The description is step 54's panel, for an
  index (`type="index"`).
- **NEWS**: a document's form gets an Index field, the documents of an index its DOC tab
  (decision 44); two document types, Methodology and Factsheet. **IMP**: the `index-constituents`
  file.
- **CMarket.Api** (phase 44, ADR-070):
  - `ref.IndexConstituents` (migration `IndexProfile`): each member, its weight, entry and exit,
    the import that wrote or ended it. The CMarket indices' members follow their filters at each
    recalculation (`IndexMembership`); BVMAC-A's come from `INDEX_CONSTITUENTS` (date, index,
    code, weight: a known BVMAC index, a known security, not in the future, the weights of a
    review adding up to 100 within 0.5): a review ends the members in force on its date; a rollback
    deletes its rows and reopens those it ended. A review on the date of another replaces it, the
    replaced rows ended on their own entry so that a rollback brings them back (decision 47).
  - `GET /indices/{code}`, `/sessions?last=`, `/constituents?date=`, `/constituents/history`,
    `/performance`, `/documents`. The contributions are the weight at the previous close times
    the day's change: BVMAC's weights moved by each price since the review, else the
    capitalisations (`IndexContributions`, decision 47); they add up to the index change, to
    rounding. The performance: 1 and 3 months, YTD, 1 year, 3 years annualised, section 14.3's
    volatility and maximum drawdown on a year of closes, the members' dividend yield weighted.
  - `POST` and `PUT` of a document take an `indexCode`. Demo (`DemoIndexProfiles`): BVMAC-A's three
    reviews (its first close, 30/06 and 30/09/2026), weighted by capitalisation at the close before
    each; the CMarket indices' members; the six indices' descriptions in both languages; BVMAC-A's
    methodology, review notice, SAFACAM adjustment and factsheet, each CMarket index's methodology.
- **Checked**: web typecheck, lint, 533 unit tests; the routes against CMarket.Api's OpenAPI;
  Playwright, `index-profile.spec.ts` (MKT's double click to DES, whose contributions add up to the
  change; `CMK-BANK DES` from the command bar; MEMB on 15/07/2026, the history's XLSX, PERF, GP,
  DOC's methodology opened; IMP's review on the last session shown on MEMB and rolled back,
  `@fresh-db`) with the smoke and security profile flows; axe clean on the five tabs, MEMB on a
  date, the comparison and CMK-BANK, in English and in French. CMarket.Api: the domain (710),
  application (821), integration (312) and architecture (21) suites; the SQL Server suite waits
  for Docker.
- **Fixed on the way**: BVMAC-A's contributions added up to −0.81 for a change of −0.62 %: the
  mockup's weights, fixed since the review, weighed a level computed from capitalisations
  (decision 47); a French page named the sectors in English.
- **Left**: the Download button comes with step 57; BVMAC-A TR is not built (decision 44).

## Planned

- **The page** (decision 44): `/indices/{code}/{fn}`, the tabs DES Profile, GP Chart, MEMB
  Constituents, PERF Performance and DOC Methodology, each with its saved layout; the Download
  button comes with step 57. `BVMAC-A DES` (or GP, MEMB, PERF, DOC) in the command bar, a search
  result, a double click on MKT's Indices panel or an index item of the ticker opens it; MKT's
  entry stays lit, as the mockup.
- **The header**: the code, the name, "Price index · cap-weighted · 7 constituents · XAF ·
  fixing"; the closing value at 26 px with "Close of dd/mm/yyyy", its change in points and %;
  the previous value, YTD, 1 year, the 52-week high and low, the constituents' market cap.
- **DES**, as the mockup: the index value (1M, 3M, 6M, 1Y, 5Y; base 100; compare with another
  index or a security), the description (step 54's panel), the values of recent sessions (the
  session, the value, the change in points and %, the market cap in billions; 10, 20 or 60; XLSX
  and CSV; "One value per session, computed after the fixing from the closing prices of the index
  constituents."), the constituents (security, sector, weight, price, change, contribution in
  points; "Sum of contributions: +0.42 point = index change."; a double click opens the security),
  the performance and risk, the methodology and notices (each document's type and date, opened in
  the PDF viewer).
- **GP**: the value's whole history, 1M to 10Y, base 100 and the comparison. **MEMB**: the
  constituents at a date chosen (the composition then in force), with their entry and exit dates.
  **PERF**: 1 and 3 months, YTD, 1 year, 3 years annualised, the 1-year volatility and maximum
  drawdown, the dividend yield, and the values by month and year. **DOC**: the documents, filtered
  by type.
- **CMarket.Api** (decision 42):
  - `ref.IndexConstituents` (the index, the security, the weight, the entry and exit dates); the
    CMarket indices' members written at each fixing as they enter and leave their filter;
    BVMAC-A's from the `INDEX_CONSTITUENTS` file of IMP (date, index, code, weight), its filter's
    meanwhile.
  - `GET /indices/{code}` (the header), `/history?from=&to=&base100=`, `/sessions?last=`,
    `/constituents?date=` (the weights at the previous close, each one's day change and
    contribution, which add up to the index change, a member without a trade at its last price and
    a zero change), `/performance` (spec section 14.3's volatility and drawdown on the index's
    closes; the dividend yield of its members weighted), `/documents`, `/description?lang=`;
    `GET /indices` with the last value and change, as now.
  - The documents of an index published in NEWS with the index as their subject (decision 44).
  - Demo: the six indices' descriptions in both languages, BVMAC-A's the mockup's; its constituents
    and weights of the mockup, with a quarterly review of 30/09/2026; its methodology, a review
    notice, an adjustment after SAFACAM's corporate action, the factsheet of 31/10/2026 and the
    constituents' history.
- **Checks**: Vitest for the contributions' sum and the header; the flow from MKT's double click
  to the five tabs, a date in MEMB, a document opened, the description's edit by CMarket's
  analyst; IMP's `INDEX_CONSTITUENTS`; axe in both languages.
