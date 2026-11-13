# Step 38 · Rate series and CEMAC sovereign yields (M): done

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

## What was built

- **The key first**: the EODHD key in use answers 200 for `US10Y.GBOND`, `EURIBOR3M.MONEY`,
  `EURIRS10Y.MONEY`, `ECBEURUSD.MONEY` and the commodities API (`/commodities/historical/WTI`,
  for step 41). EODHD lists 268 sovereign yields, none of a CEMAC state, and 90 MONEY symbols,
  41 ECB reference rates among them (for step 39).
- **Contract**: `RateSeriesDto`, `RatePointDto`, `RateHistoryDto`, `RateOrigin` (`gbond`, `money`,
  `cmkt`), `RatePointType` (`auction`, `secondary`, `model`), `RatePointSource` (`beac`, `crct`,
  `svt`, `bvmac`, `cmarket`) in `rates.ts`, the three routes in `endpoints/market.ts`; a curve
  point's `asOf`, `stale` and `series` (its code, type, reference security and source) and the
  curve's `staleAfterDays` in `yieldCurves.ts`, its source `series` where it was `file`; the file
  type `cemac-sov-yields`, the check `replacesStored` and the coverage's `dueTime` in
  `dataImport.ts`; `curveStaleDays` among the settings and the audited fields in `admin.ts`.
- **IMP, DATA, HIST**: "CEMAC sovereign yields" after the auctions in the coverage, "Expected
  17:30" (the time of Douala in the user's time zone), "Under review" while checked; its template
  (`date ; country ; tenor ; yield ; point_type ; reference_security ; source ; comment`, the
  country as the spec writes it, `CMR`); the columns in both languages; "Replaces the stored yield
  of 6.20%" on a row that changes a point, an alert to tick as the threshold's ("check the yield
  against the source named in the row"). "Curves and rates" is no longer offered: the upload form
  and the templates leave it out, HIST still filters its uploads.
- **YCRV**: each tenor's latest point of the country's series behind the auctions of 90 days and
  the bonds' closes; a point older than the Admin's limit is a hollow square, with "Stale point:
  older than 90 days" in the legend (the demo's CAR has two, its 7 and 10 years); the tooltip says
  what gave each point and when ("Auction · 13/11/2026", "BVMAC close", "Secondary market · CRCT ·
  CM0000035002 · 13/11/2026"), "stale" in amber.
- **ADMCFG**: under Bonds, "Stale curve point after" in days (1 to 3,650, 90 by default), audited
  as "Stale curve point after (days)".
- **Slices**: no new one: `entities/data-import` (the types offered and retired, the columns, the
  check's words), `widgets/yield-curves-panel`, `widgets/session-coverage-panel`,
  `widgets/upload-history-panel`, `features/edit-platform-settings`.

## CMarket.Api (phase 29, ADR-054)

- `ref.RateSeries` (a series: code, origin, country, tenor, names) and `mkt.RateValues` (a
  series and a day, the value in percent; a CEMAC yield's type, reference, source, comment and
  upload), system-versioned. The CEMAC states' 48 series are reference data (`CMR13W.CMKT` to
  `GNQ10Y.CMKT`). Migration `RateSeries`: the series written, every point of the weekly files
  moved into the series of its state and tenor (3 months are 13 weeks, a year 52 weeks) as a
  computed point given by the BEAC, keeping its upload, then `mkt.YieldCurvePoints` dropped; its
  `Down` brings them back.
- The file's checks (country, tenor, a yield from 0 to 30% at three decimals, a business day,
  the spec's types and sources, 100 bp, the same key twice), its publication and rollback; an
  upload of the weekly file made before still publishes and rolls back into the same series, and
  a new one is refused ("This file is no longer uploaded: the CEMAC sovereign yields file took its
  place.").
- The curves read each tenor's latest point of the series, however old; a point's age against
  `CurveStaleDays` is read at each answer.
- EODHD's load every day at 06:30 of Douala with the key alone (`Eodhd:RatesEnabled`): 45 series
  by default (the Treasury, Bund, OAT and gilt curves, the 10-year yields of Nigeria, South Africa
  and Kenya, Euribor 1 to 12 months and the EUR 10-year swap), ten years at the first load, then a
  week before the latest value; at start-up while a series has no value. Without the key, the demo
  gets the screens 25 and 26 mockups' levels instead.
- `GET /rates/series`, `GET /rates/{code}/history`, `GET /macro/global-rates` (`market:read`,
  cached a day, evicted by the load and by a publication of yields); the coverage's `dueTime`; the
  settings' `curveStaleDays`.

## Checked

- Type check, lint, the 370 unit tests (3 new: the file types offered and retired, the yield
  among the figures an alert measures).
- CMarket.Api: 1,524 tests, all passing: 1,499 in the usual run and the SQL Server suite's 25 on
  SQL Server (the migration up, the weekly files' points moved into the series with their uploads,
  as an idempotent script, and down). New: the tenors, codes and catalogue of the series, a value's
  rules, the file's checks, the curve's latest and stale points; the queries, the load (what it
  asks, stores, counts and tries again, the start-up, the schedule), the file published and rolled
  back, an upload of the weekly file still published, the stale age's setting; the routes over
  HTTP; the migration.
- The live load, on a throwaway database with the key: the 45 series in 40 seconds, each answered
  200, 90 quota units, 116,841 days from 13 November 2016; the routes answered from the cache in
  2 to 12 ms, a 304 on their ETag.
- Every Playwright flow on CMarket.Api from a fresh database: 115, all passing. One new: the
  Data admin uploads CEMAC sovereign yields, fixes a row into the CAR's stale 7 years, ticks the
  row that replaces Cameroon's 7-year point, publishes; YCRV's tooltip gives the trade's point
  ("Secondary market · CRCT · CM0000035002"); the upload is rolled back from HIST. The YCRV flow
  sees the stale legend. A first full run met the auctions flow's 3-year OTA, which comes before
  the series on the curve: the flow reads the 7 years, where no auction stands.
- axe (WCAG 2.2 AA) at 1600, 390 and 320 px, in English and French: IMP with the yields' upload
  and its replacement alert selected, DATA, the templates, HIST filtered on the retired curves
  file, ADMCFG refusing a stale age of 0, YCRV with the tooltip on the CAR's stale 10 years: 36
  audits, nothing found. The screenshots showed the tooltip's notes cut at 390 px: on a narrow
  screen they now go under each country.
