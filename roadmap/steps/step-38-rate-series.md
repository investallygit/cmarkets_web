# Step 38 · Rate series and CEMAC sovereign yields (M): to do

Step 38 of the [roadmap](../../ROADMAP.md#order), for the
[fourth version of the spec](../fourth-version.md).

CMarket.Api's phase 29.

- **Contract**: `GET /rates/series?origin=&country=`, `GET /rates/{code}/history?from=&to=` and
  `GET /macro/global-rates?set=world|euro`, which steps 39 and 40 read. A series has a code
  (`US10Y.GBOND`, `EURIBOR3M.MONEY`, `CMR5Y.CMKT`), an origin, a country, a tenor and its French
  and English names; a CEMAC point also has its type, reference security and source.
- **IMP**: the `cemac-sov-yields` file (date, country, tenor from 13W to 10Y, yield, point type,
  reference security, source, comment): a yield between 0 and 30%; a move of more than 100 bp from
  the series' point before, to confirm; a point of the same date, country and tenor replaced once
  confirmed. It takes the place of "Curves and rates" in the session coverage, expected at 17:30;
  a file being checked reads "Under review", as the redrawn mockup.
- **YCRV**: a country's curve takes the latest point of each tenor; a point older than 90 days
  (the Admin's setting) is marked stale; the tooltip gives the point's type, reference security
  and source.
- **CMarket.Api**: `ref.RateSeries` and `mkt.RateValues`; EODHD's sovereign yields (`.GBOND`) and
  its Euribor and swap rates (`.MONEY`) every day, once it is known which of them the key in use
  opens; the points of the weekly files kept as CMKT points (decision 20).
