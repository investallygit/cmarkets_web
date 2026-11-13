# Step 40 · ECO · Macroeconomic dashboard (screen 25) (L): done

Step 40 of the [roadmap](../../ROADMAP.md#order), for the
[fourth version of the spec](../fourth-version.md).

CMarket.Api's phase 31, on the indicators it loads since 13 November 2026 (its ADR-053).

- The country selector (the six CEMAC countries, Sub-Saharan Africa and the World, the comparison
  countries the Admin chooses); six tiles (GDP growth, inflation, GDP per capita, government debt
  to GDP, exports to GDP, population) with their year and seven years of history, "n/a" for a
  series not published; the chart of an indicator for up to six countries since 1960, with its
  XLSX export; the sovereign and reference rates (the CEMAC's in amber, then the 10-year yields of
  seven countries and the 3-month Euribor); the CEMAC comparison table with the year of each
  value, as the mockup.
- ECO in the menu, after MKT (decision 15); `ECO CMR` opens Cameroon.
- **Contract**: `/macro/countries`, `/macro/countries/{iso3}/summary`, `/macro/indicators`,
  `/macro/compare` and `/macro/cemac-table`; the comparison countries and the tiles' indicators in
  `/admin/macro/settings`.
- **CMarket.Api**: the World Bank's aggregates and the comparison countries beside the six; the
  refresh once a month (10 calls a request); the indicators in the spec's six categories, less the
  two it leaves out (decision 21); a "Macro" file by which the Data admin fills a series the World
  Bank lacks, its source shown.

## What was built

- **Contract** (`macro.ts`): `MacroCountryDto` (the World Bank's code, `CMR` or `SSF`, its kind,
  CEMAC, aggregate or country, its names and short names in both languages),
  `MacroIndicatorInfoDto` (ECO's code, `gdpGrowth`, the spec's key, `gdp_growth_annual`, the
  group of the spec's six, the unit, the names), `MacroSummaryDto` with its `MacroTileDto`s (the
  latest figure, `current` when ten years old at most, the seven years), `MacroYearDto` (the
  year, the value, the publisher, a file's comment), `MacroComparisonDto`, `CemacTableDto`;
  `MacroSettingsDto` gains `comparisonCountries`, `tileIndicators` and what they may name; the
  file type `macro`; the five routes in `endpoints/market.ts`.
- **ECO** (`pages/macro-dashboard`, `widgets/macro-dashboard-panels`): the country bar, each
  economy by its code and short name, the one shown pressed and kept in the address
  (`/eco?country=GAB`), "Annual World Bank data · latest year: 2025" at its end; the six tiles of
  the Admin (the figure with its unit, "3.6%", "$1,720", "29.1 M", its year, its seven years in a
  sparkline; "n/a" with "series not published", or "no figure since 1999" for a series stopped ten
  years ago or more; "Source: IMF" for a Data admin's figure); the chart of one indicator of the
  37 for up to six economies (the CEMAC's first four by default, as the mockup's GDP growth, a
  line each in the mockup's colours), 10Y, 15Y (2010 to 2025), 30Y or MAX, its axis on round
  ticks, the economies picked under it, its figures exported to Excel; the sovereign and
  reference rates of step 38 (the CEMAC's yields in amber, the point described on hover, a dashed
  line before the world's, the change in basis points); the CEMAC comparison of the mockup's
  seven indicators (a figure's year beside it when not its row's, its source when a file gave
  it, "n/a" where the World Bank publishes none; exported to Excel). Below 1280 px the panels
  stack, the tiles in three then two columns, the chart's options on a second line.
- **The command bar**: `ECO CMR` (or `CMR ECO`) opens ECO on that economy; an economy ECO does
  not offer is said on the screen, which shows Cameroon.
- **The menu** (decision 15): ECO after MKT, before FX; a Trader's fifteenth entry.
- **ADMCFG**: "Macro and FX" opens with ECO, its comparison countries (up to 8 of 20, moved,
  removed, added) and its six tiles (a select each), then FX's two lists, saved together ("Save
  the settings"), each list changed audited ("ECO comparison countries: NGA, FRA → NGA, ZAF").
- **IMP**: the "Macro indicators" file, its template and its strings; HIST filters it.
- **Slices**: `pages/macro-dashboard`, `widgets/macro-dashboard-panels`, `entities/macro` (new:
  the queries, a figure written by its unit, the chart's periods, the names in the user's
  language); `features/command-bar` (a code followed by its word),
  `features/edit-platform-settings` (`CodeListEditor` in place of the currencies' editor,
  `TileIndicatorsEditor`), `shared/ui/PanelSelect` (a class of its own), `entities/data-import`,
  `shared/routes`; the strings in `macro`, `core`, `dataAdmin` and `admin`.

## CMarket.Api (phase 31, ADR-057)

- The economies of a catalogue in the domain (`ref.MacroEconomies`): the CEMAC's six, Sub-Saharan
  Africa and the World, twenty countries to compare them with; `mkt.MacroValues` keyed by their
  World Bank code, the figures loaded before kept (CM is CMR), with who published each, a file's
  comment and upload.
- The indicators in the spec's six groups, its keys and their names in both languages; the two it
  leaves out neither offered nor loaded.
- The load once a month (the first, 04:30 in Douala) of the economies ECO shows; at start-up and
  once the Admin adds a country, the economies without a figure only; a figure a file published
  stands.
- The "Macro" file into the same table, a replaced figure confirmed by a tick, rolled back to
  what it replaced; the demo's figures of the mockup without the key (`DemoMacro`).

## Checked

- Type check, lint, the 387 unit tests (13 new: a figure written by its unit in the tiles, the
  table and the axis, the chart's periods, its rows, its round ticks, `ECO CMR` in the command
  bar).
- CMarket.Api: 1,578 tests, all passing: 1,550 in the usual run and the SQL Server suite's 28. New:
  the catalogues, a figure's rules and its publisher, the Admin's choices, the file; the five
  routes on the demo's figures (the mockup's tiles, chart and table, "n/a" past ten years, the
  refusals); the load (the ten economies, 37 indicators each, the missing ones at start-up, a
  file's figure kept, a retry's economies, nothing without the key, the first of the month); the
  settings audited and a country added loaded; the file checked, published, kept from the load
  and rolled back; the contract names over HTTP; the migration on SQL Server with Azure's figures
  (CM became CMR), as an idempotent script, and down.
- The live load, on a throwaway database with the key: Cameroon, Sub-Saharan Africa, the World
  and Nigeria on the eight indicators of the tiles and the table, 32 requests in 10 seconds, 320
  quota units; Cameroon's growth 3.2% in 2025, its government debt "n/a" (its last figure 79.5%
  in 1999), Nigeria's exports "n/a" (a single figure, of 1960); the tiles answered in 74 ms the
  first time, then 2 to 5 ms.
- Every Playwright flow on CMarket.Api from a fresh database: 123, all passing. Five new: ECO
  (Cameroon's tiles, the CEMAC's growth and comparison of the mockup, Gabon on a click); `ECO GAB`
  from the command bar and an economy ECO does not offer; the chart on another indicator and
  period, six economies at most, its Excel file; ADMCFG choosing ECO's countries and tiles, AUDT,
  ECO following them; IMP's "Macro" file filling Cameroon's debt with the IMF's figure, its
  source on the tile, then rolled back. The menu flows now have ECO between MKT and FX; the API's
  log holds no error.
- axe (WCAG 2.2 AA) at 1600, 390 and 320 px, in English and French: ECO on Cameroon, ECO on Gabon
  with Sub-Saharan Africa drawn, ADMCFG with a country moved: 18 audits, nothing found once the
  rates table's scroll box took the focus. The screenshots showed the tiles' names cut and the
  chart's options past the edge of its bar at 390 px, and the axis written "7.0": the names now
  take two lines, the options wrap, the axis takes round steps (15, 10, 5, 0, -5, as the mockup).
