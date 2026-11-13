# Step 32 · ETF data and ETFS · ETF screener (screen 15) (XL): done

Step 32 of the [roadmap](../../ROADMAP.md#order), for the
[third version of the spec](../third-version.md).

CMarket.Api's phase 25.

- **Built**:
  - ETFS under EQS in the menu, as its mockup lights it (an entry of its own since
    [the spec author's answers](../third-version.md#the-spec-authors-answers)), on the Analysis
    module (the "Screener, XLSX / CSV exports" row): the criteria of the mockup (category,
    sub-category, geography, several at once, sector, issuer, listing exchange, minimum YTD return,
    minimum Sharpe ratio, maximum TER, UCITS only, accumulating only, currency-hedged only), active
    ones with an amber border; it opens on the mockup's screen, to which Reset returns; RUN, SAVE
    and the saved screens as on BS; the values of the drop-downs from `/etfs/facets`.
  - The results: the flag of the fund's domicile left of the ticker (`flag-icons`, decision 10),
    name, class (asset class · geography), issuer, exchange · currency, TER, AUM in the trading
    currency, YTD and 1Y in colour, Sharpe, 1Y volatility; the largest funds first; the time of the
    evening's calculation; XLSX and CSV for the accounts that export; a click shows the ETF below,
    a double-click opens its profile. No comparison block, as the spec says.
  - The selected ETF in its five blocks: A. identification (ticker and name with the listing
    country's flag, asset class, sub-category, sector of a sector fund, issuer and brand, exchange
    and currency); B. structure (replication, dividends, UCITS status, fund currency and hedging,
    domicile); C. size and liquidity (AUM, market price, NAV, premium or discount, 30-session
    volume, average bid-ask spread in % and bp); D. costs and yield (TER, 12-month distribution
    yield, "— (accumulating)" for a fund that accumulates, distribution frequency); E. performance
    and risk (1D, 1M, 3M, YTD, 1Y, 3Y and 5Y a year, since inception a year, tracking error and
    difference, volatility 1Y and 3Y, Sharpe 1Y and maximum drawdown). "ETF profile" opens DES.
  - DES on an ETF until step 33: the type `etf` in `SECURITY_PROFILES`, under EQS, tabs DES (the
    price chart, the five blocks, the documents and news), GP, DOC, N and ANA; its header shows the
    session's open, high, low and volume (an ETF has no capitalisation, earnings nor dividend of
    its own). Its layouts ETF and ETF-GP are saved apart.
  - IMP: the "ETF profiles" and "ETF NAV and spreads" files (their templates, columns, checks and
    words, an ask below its bid named as such); ADMCFG: the risk-free rates of EUR, USD and GBP
    beside XAF's, audited by currency; EODH: the ETFs' loads among the jobs.
  - Slices: `pages/etf-screener`, `features/screen-etfs` (criteria, store, saved screens),
    `widgets/etf-screener-results-panel`, `widgets/etf-blocks-panel`, `entities/etf` (hooks,
    labels, the realtime refresh after an ETF file); `shared/ui/CountryFlag` and
    `shared/ui/form/MultiSelect`; the contracts in `etfs.ts`; the strings under `etf` and
    `etfScreener` in the new area file `etfs.json`.
- **CMarket.Api** (phase 25):
  - The ETF type, a security per listing (TICKER.EXCHANGE, EODHD's code) whose fund's ISIN its
    other listings share; `ref.Etfs` (blocks A, B and D), `mkt.EtfDaily` (NAV, bid and ask),
    `mkt.EtfPerformance` (block E and block C's figures, a row per ETF and session),
    `mkt.BenchmarkCloses`, `usr.RiskFreeRates`, `usr.EtfScreens`; EODHD's exchanges (LSE, Xetra,
    Euronext Paris and Amsterdam, Borsa Italiana, the US) and the countries of the listings and
    domiciles in the reference data; migration `EtfData`.
  - The evening's calculation (section 14.5, the risk as section 14.3 with 252 sessions a year):
    total returns with the distributions added back on their ex-dates, annualized over 3 and 5
    years and since inception, the index's over the same periods, premium, 30-session averages,
    12-month yield, volatilities, Sharpe ratio on the trading currency's rate, maximum drawdown,
    tracking error and difference; at 23:00 Douala, and after an ETF file, a correction, EODHD's
    ETF data or a change of the rates.
  - `GET /etfs` (the criteria of the spec's query, the largest funds first), `/etfs/facets`,
    `/etfs/{id}` (blocks A to D), `/etfs/{id}/performance?periods=` (block E),
    `/etfs/{id}/distributions`, `/analysis/etf-screens`; the screener in the analysis module, an
    ETF's reads on `market:read`, as its profile.
  - EODHD: each evening the benchmarks' closes, each Saturday each listing's fundamentals (fees,
    assets, inception, index) and distributions, the job `etfs` on EODH; built and tested on
    EODHD's documented answers.
  - Demo: twenty ETFs, the mockup's six and fourteen others of each class, geography and kind,
    drawn so that the evening finds the mockup's figures (IWDA's blocks and profile, the five
    others' YTD, 1Y and volatility). ADR-049.
- **Checked**:
  - Type check, lint, the 342 unit tests.
  - CMarket.Api: 1,369 tests, all passing: 1,351 in the usual run, and the SQL Server suite's 18
    on SQL Server (the new migration up, as an idempotent script, and down). `npm run test:api`
    now reads the ETFs as every demo account: 527 reads, 193 left out by permission or plan.
  - Every Playwright flow on CMarket.Api from a fresh database: 104, all passing. Three new ones:
    ETFS from the command bar (the mockup's criteria and five ETFs, IWDA's flag and five blocks,
    VUSA's quarterly distributions); the criteria narrowed to hedged bonds, saved, loaded back
    after Reset, the XLSX and CSV export; a double-click to CSPX's profile (its tabs, its blocks,
    EQS lit, DVD refused).
  - axe (WCAG 2.2 AA) at 1600, 390 and 320 px, in English and French: ETFS (the geographies'
    list open, VUSA selected), an ETF's DES and GP, ADMCFG's rates, IMP's ETF templates, EODH.
