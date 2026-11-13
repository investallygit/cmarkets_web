# Step 40 · ECO · Macroeconomic dashboard (screen 25) (L): to do

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
