# Step 41 · CMDTY · Commodities (screen 21) (L): to do

Step 41 of the [roadmap](../../ROADMAP.md#order), for the
[fourth version of the spec](../fourth-version.md).

CMarket.Api's phase 32.

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
