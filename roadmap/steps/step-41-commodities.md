# Step 41 · CMDTY · Commodities (screen 21) (L): done

Step 41 of the [roadmap](../../ROADMAP.md#order), for the
[fourth version of the spec](../fourth-version.md).

CMarket.Api's phase 32. Lane 2 of the [lanes](../lanes.md), its first step.

- The list by category (energy, metals, agriculture, indices, the CEMAC complement) with the last
  value, the change since the observation before and the frequency's badge (D, W, M). The profile
  of a commodity: the header, the tabs DES, GP, CMP (up to five series rebased to 100 and their
  correlations) and N, the history (the value in amber, its moving average in blue, by day, week
  or month, without volume or candles), the statistics, the description in French and English, the
  data's sources and usual lag, the CEMAC links (the countries exposed, the related securities,
  the latest news), as the mockup.
- The observation date beside every value, yellow past 10 days for a daily or weekly series and
  past 50 days for a monthly one.
- `CMDTY` opens the screen, in the menu after MKT (decision 15); `BRENT DES`, a search result or a
  card opens the profile (decision 19). An alert on a commodity goes off when a new value comes.
- **Data admin**: the `commodity-prices` file of IMP (date, code, value, unit, source) for cocoa,
  rubber, palm oil, gold and okoumé timber; a commodity's name, description, countries and
  securities in CORR (`PUT /data/commodities/{code}`).
- **CMarket.Api**: the `commodity` type, `ref.Commodities` and `mkt.CommodityValues`; EODHD's 23
  series twice a day, each series and interval kept 12 hours (5 calls a request); the changes, the
  volatility at the series' own frequency and the correlations on monthly changes.

## What was built

- **Contract** (`commodities.ts`): `CommodityListItemDto` (the spec's code, also the security's id;
  the names, the list's short ones too; the category; the unit as the file writes it, `USD/bbl`,
  `USc/lb`, `INDEX_2016`; the frequency; the origin, EODHD or the file; the last value and the one
  before with their dates; the change; `stale`), `CommodityProfileDto` (the intervals offered,
  EODHD's and FRED's codes, the source, the usual lag, the history's start, the last update, the
  Data admin's texts as a security's description, `CommodityStatisticsDto`),
  `CommodityHistoryDto` (each value with its 50-value moving average), `CommodityComparisonDto`
  (up to five series rebased to 100, the correlation matrix), `CommodityRelatedDto`,
  `CommodityWriteDto`; `SecurityType` gains `commodity`, the import types `commodity-prices`, the
  audit `commodity-describe` with the fields `countries` and `relatedSecurities`; the five routes
  in `endpoints/market.ts`, the Data admin's in `dataAdmin.ts`.
- **CMDTY** (`pages/commodities`): opens Brent's profile, the mockup's (decision 19: the profile
  of a commodity is the fourth of DES, at `/securities/{code}`); in the menu after MKT, before ECO
  (decision 15), lit on every commodity's profile.
- **The profile** (`pages/security-profile`, `widgets/commodity-profile-panels`): the list of the 28
  series on the left, as the mockup draws it (above the profile below 1,024 px): by category, the
  short name, the last value (yellow, its date on hover, past 10 days for a daily or weekly series,
  50 after its month for a monthly one), the change, the badge D in blue, W in yellow, M in grey; a
  right click or the menu key adds it to a list or sets an alert on it. The header: the code, the
  name, the category, unit, frequency with how it is published and the source; the last value, its
  change and its date; 1 month, YTD, 1Y, the 12-month high and low, the 1-year volatility. DES: the
  history, the value in amber over its area and its 50-value average in blue, by day, week or month
  (an interval the series does not offer greyed out), 1Y, 5Y (by default), 10Y or MAX, the period's
  values only asked for; the statistics (the last value and the one before with their dates, the
  changes over 1 and 3 months, the year, 1 year and 5 years a year, the 12-month high and low with
  their dates, the 5-year average, the volatility, the 1-year correlation with the reference series)
  and the publication's warning; the description in French and English; the data (EODHD's and FRED's
  codes, the source, the last update, the usual lag); the CEMAC links (each country opens its ECO,
  each security its profile, the latest news with its tag). GP: the history. CMP: up to five series
  on their monthly values, rebased to 100 at the first month all have, Brent and WTI at first (the
  statistics' reference), the others picked under the chart; their correlations beside. N: the news
  naming the commodity.
- **The command bar**: `BRENT DES`, `BRENT CMP`; the search finds a commodity by its French names
  too ("cacao", "pétrole").
- **CORR** (`features/describe-commodity`): on a commodity, its names, its texts, the CEMAC
  countries it weighs on (in their order, Brent's the mockup's; a new one last) and its related
  bonds and equities, ten at most, in place of the description editor.
- **IMP**: the "Commodity prices" file, its strings and what its publication does.
- **Slices**: `pages/commodities`, `entities/commodity` (the queries, the mutation, the names in the
  user's language, a value's decimals, the periods, the badge), `widgets/commodity-profile-panels`,
  `features/describe-commodity` (new); `pages/security-profile`, `features/command-bar`,
  `widgets/description-editor-panel`, `entities/data-import`, `entities/audit`,
  `shared/ui/PanelTabs` (an option may be greyed out), `shared/routes`; the strings in the new area
  `commodities`, in `core`, `monitoring`, `dataAdmin` and `admin`.

## CMarket.Api (phase 32, ADR-058)

- A commodity is a security of type `Commodity` (its id and code the spec's, on the exchange
  `CMDTY`, its French names the command bar's aliases) with its `ref.Commodities` row (the
  catalogue's facts, the Data admin's names, its CEMAC countries and related securities), seeded
  in every environment; its texts are its security's description. Its values are rows of
  `mkt.CommodityValues` by series, interval and date, EODHD's and the file's, outside the price
  tables.
- The load at 06:00 and 18:00 in Douala, with the key alone: the 23 series in each interval they
  offer (38 requests, 5 calls each), a series' whole history the first time (EODHD's pages of
  1,000), its 100 latest values after; a file's value stands; a failure tried again for the
  requests left. A value that moves a series' latest goes to the alert engine, from the load and
  from a file.
- The five routes and `PUT /data/commodities/{code}`; the watchlists show a commodity's last value,
  change and five latest values; the "Commodity prices" file, checked, published and rolled back.
- Without the key, `DemoCommodities` writes the mockup's last values and changes, five years of
  daily values (the energies moving together), the monthly ones from 2000, the file's five as a
  file had published them, Brent's texts and links; the FLASH on Brent names it.

## Checked

- Type check, lint, the 395 unit tests (8 new: the comparison's rows, the series CMP starts with
  and the picker's five at most, the form's names and countries, the commodity's tabs and
  `BRENT CMP` in the command bar).
- CMarket.Api: 1,617 tests, all passing: 1,588 in the usual run and the SQL Server suite's 29. New
  (37): the catalogue, a date's staleness, the changes, the volatility at the series' frequency, the
  monthly values and correlations, the moving average, a value's rules, the links and the file in
  the domain; the queries on the demo's values (the mockup's list, Brent's profile and links, a
  history and an interval refused, five series compared, a commodity in the search, DES and a
  watchlist, the description audited), the load (each series in each interval, 5 calls each, a whole
  history then the latest, a file's value kept, the start-up, a retry's requests, nothing without
  the key, an alert going off on a new value, the schedule) and the file (checked, published, rolled
  back, its template); the contract names and the refusals over HTTP; the migration on SQL Server
  with the 28 seeded, its checks, as an idempotent script, and down. Seven earlier tests now list
  the new import type, template, replacement check and job.
- The live load, on a throwaway database with the key, the other loads off: 38 requests in 53
  seconds, 545 calls of the quota, 85,932 values; Brent by day since 20 May 1987 (10,018 values),
  the US producer prices since 1913, the gasoline's weekly values dated the Monday, the IMF's
  monthly ones to September. Brent's last value 92.14 on 11 November, its 1-year correlation with
  WTI 0.96; EODHD repeats a value on a US holiday. The list answered in 114 ms the first time, then
  1 ms, the profile in 32 then 2 ms; Brent's whole daily history weighed 539 KB, so the chart now
  asks for its period only.
- Every Playwright flow on CMarket.Api from a fresh database: 126, all passing, and the 25 tagged
  `@fresh-db`, each spec on a database of its own. Three new: CMDTY (Brent's profile beside the
  list, as the mockup; cocoa on a click, its one interval; Cameroon opening ECO); `BRENT CMP`
  (Brent and WTI rebased to 100, cocoa added, the correlations); CORR naming a commodity and
  linking it to a country, CMDTY showing them, then put back. The menu flows now have CMDTY between
  MKT and ECO, FX fourth; the API's log holds no error.
- axe (WCAG 2.2 AA) at 1600, 390 and 320 px, in English and French: Brent's DES, GP and CMP, cocoa,
  the list's menu opened from the keyboard (Shift+F10; Escape gives the focus back to the row),
  CORR on okoumé: 36 audits, nothing found once the description's scroll box took the focus. The
  screenshots showed, at 320 px, the header's source, the statistics' names and the data's codes
  cut, and cocoa's correlation named by its code (`ALL_COMMODITIES`): they now wrap, and the series
  is named ("Global index").
- Fixed on the way: CORR put the countries in the reference data's order, losing Brent's; they now
  keep theirs. A fresh database's start failed once the commodities, seeded with the reference data,
  made the demo market believe it was there: `DemoMarketSeeder` now looks for a security other than
  a commodity.

## Since (24 November 2026)

- **Another series picked in the list no longer loads the whole page again.** Each series is an
  address of its own (decision 19), and the page waited for `GET /securities/{code}` before drawing
  anything: the list went with the rest and came back scrolled to its top. A series of the list on
  screen now opens at once beside it (`useListedCommodity`): the list keeps its place, the header
  shows what the list knows, each panel says "Loading" for itself.
- A line pointed at or focused for 100 ms loads its profile, its chart and its links ahead of the
  click (`usePrefetchCommodity`).
- The history never shows another series' values under this one's name while it loads, and an
  interval chosen on one series is dropped on a series that does not offer it.
- CMP starts again with each series, not only when the reference series changes.
- A flow of `e2e/commodities.spec.ts` holds it, with the answers of the series held back.
