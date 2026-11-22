# Step 56 · DES on an index: the index profile (screen 31) (L): to do

Step 56 of the [roadmap](../../ROADMAP.md#order), for the
[fifth version of the spec](../fifth-version.md).

CMarket.Api's phase 44. Builds on step 54: the description panel and the recent sessions' table.

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
