# Step 33 · ETF profile (screen 19) (L): done

Step 33 of the [roadmap](../../ROADMAP.md#order), for the
[third version of the spec](../third-version.md).

CMarket.Api's phase 26.

- **Built**:
  - DES on an ETF opens screen 19, under EQS as ETFS (under ETFS since
    [the spec author's answers](../third-version.md#the-spec-authors-answers)), named "ETF profile"
    in the title bar, with the mockup's tabs DES Profile, GP Chart, HLD Holdings, PERF Performance,
    DIST Distributions, DOC Documents, then N and ANA, which every profile keeps; the command bar
    offers HLD, PERF and DIST on an ETF.
  - The header: the flag and code of the fund's domicile, the ticker, the full name, the line of
    its description (class and geography as ETFS writes them, provider and brand, exchange,
    currency, UCITS, accumulating or distributing), the price and its change, then NAV, premium
    or discount, TER, AUM, 30-day average volume, YTD and 1Y volatility.
  - DES as the mockup: the price history (the price in amber over its filled area and the NAV
    dotted in blue on one price axis, 1M to MAX, 1Y by default, by week past three years; the
    volume below; PRICE, NAV and VOLUME switch their line, one of the prices kept; the date, the
    price, the NAV and the premium or discount under the cursor), the performance against the
    benchmark index (1 month to 5 years a year, the ETF's, the index's and the gap in points),
    the risk (volatility 1Y and 3Y, Sharpe 1Y on the currency's risk-free rate as a tooltip,
    maximum drawdown with its dates as a tooltip, tracking error and difference, average spread),
    the top 10 holdings (each line's weight as a bar and in percent, the number of lines in all;
    a line CMarket lists opens its profile), the allocation ([SECTOR] · REGION: a stacked bar and
    its legend, the six largest and the rest as "Other"), structure and costs.
  - HLD, every line known (rank, name, sector, country, weight; the other lines and their weight;
    the day and the source), the allocation by sector and by region side by side. PERF, the total
    return against the index from 100 (1Y, 3Y by default, 5Y, MAX), every period of block E with
    1 day and since inception, the calendar years (the latest to date, ten at most) and the risk.
    DIST, the distributions (ex-date, payment date, amount per share) and the fund's policy (its
    rhythm, the 12-month yield, what it paid over 12 months, its last distribution, what it paid
    each calendar year as bars); a fund that accumulates says it pays none. GP keeps the price
    chart. Each tab keeps its layout (ETF, ETF-GP, ETF-HLD, ETF-PERF, ETF-DIST).
  - IMP: the "ETF profiles" file's portfolio columns (holdings_count, holdings_date,
    top_holdings, sector_weights, region_weights) with their words and their check (weights
    adding up past 100%).
  - Slices: `widgets/etf-profile-panels` (the header and the eleven panels, their periods and the
    portfolio's arithmetic in `lib`), `shared/ui/charts/AllocationBar` (PORT's stacked bar and
    legend, shared), `TwoAxisChart` with a filled area, the price axis on either side and a
    figure of the day beside the date; the contracts and calls of the four reads, their hooks in
    `entities/etf` with the labels of the sectors and regions; the strings under `etfProfile`.
- **CMarket.Api** (phase 26):
  - An ETF's portfolio, `ref.EtfCompositions` with its lines (`ref.EtfHoldings`, the 100
    largest) and its weights (`ref.EtfSectorWeights`, `ref.EtfRegionWeights`), written whole by
    EODHD's weekly fundamentals (Holdings, Sector_Weights, World_Regions, Holdings_Count) or by
    a row of the "ETF profiles" file that gives one of its lists ("name:weight" separated by "|",
    as the bond list's schedules); migration `EtfComposition`. ADR-050.
  - `GET /etfs/{id}/history?with=nav,total,index` (the NAV and the premium; the total return
    from 100; the index on its scale), `/holdings?top=`, `/allocation?by=sector|region`, and
    `/annual-returns` for PERF's calendar years, all on `market:read`.
  - Benchmarks loaded over ten years the first time (eleven in the demo), for the calendar years.
  - Demo: each ETF's portfolio as its factsheet gives it, IWDA's the mockup's; VNGA60 holds VWRL
    and VUSA.
- **Checked**:
  - Type check, lint, the 349 unit tests.
  - CMarket.Api: 1,387 tests, all passing: 1,368 in the usual run, and the SQL Server suite's 19
    on SQL Server (the new migration up, as an idempotent script, and down). `npm run test:api`
    now reads the profile as every demo account: 563 reads, 193 left out by permission or plan.
  - Every Playwright flow on CMarket.Api from a fresh database: 108, all passing. Four new ones:
    IWDA's DES from the command bar (the mockup's header, performance, risk, top 10, allocation
    by sector and by region, structure and costs, the NAV switched off); HLD's 25 lines and
    VNGA60's line opening VUSA's profile; PERF's total return against MSCI World, every period
    and the calendar years; DIST with VUSA's distributions and IWDA accumulating. ETFS's
    double-click opens the new profile.
  - axe (WCAG 2.2 AA) at 1600, 390 and 320 px, in English and French: an ETF's DES (by sector and
    by region), HLD, a fund of funds' HLD, PERF, DIST of a distributing and an accumulating fund,
    ETFS, IMP's templates with the portfolio columns: 54 audits, nothing found.
