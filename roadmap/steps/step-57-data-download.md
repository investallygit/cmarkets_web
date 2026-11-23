# Step 57 · DL: data download (screen 30), the Download buttons (XL): done

Step 57 of the [roadmap](../../ROADMAP.md#order), for the
[fifth version of the spec](../fifth-version.md).

CMarket.Api's phase 45 (ADR-071). Comes last: its datasets read what steps 54 to 56 add. Built in
two parts the same day: the screen and its files, then the portfolios and the RFQ, the schedules,
the buttons and the Admin's side.

## Built

- **DL** (`pages/data-download`; `/dl`, screen `DL`, and `/admin/dl`, `ADMDL`, for the Data admin
  and the Admin; `DL` in the command bar and "Data download" in the user menu, decision 43):
  - Datasets (`DatasetsPanel`): those the profile downloads and whose source is on, each with what
    it holds and its screens' codes; a source the Admin turned off is said under them.
  - Settings (`DownloadSettingsPanel`): the selection (securities searched or a watchlist's at
    once; countries and tenors; currencies; series; indices; portfolios; the RFQ's statuses and
    role), the portfolios' table, the period, the frequency, raw or adjusted prices, the fields,
    the format (CSV only for a profile so limited), the layout, the decimal separator, the time
    zone, the estimate; Download (`features/download-data`), saved at once up to 50,000 rows, and
    Schedule (daily, weekly, monthly, e-mailed if asked).
  - Preview (`ExportPreviewPanel`): the first 10 rows of the first item, newest first, with the
    note on BVMAC's sessions without trades.
  - My downloads (`MyDownloadsPanel`): the files of 7 days, ready (their file), in progress (their
    share, read again every 5 seconds and on `ExportReady`), failed or expired; delete; the
    scheduled exports and their stop.
  - My limits (`MyLimitsPanel`): files today and a day, rows a file, the history, the schedules, the
    terms of use.
  - Each dataset keeps its settings while the user goes from one to another; a Download button's
    address (`?dataset=&items=&from=&to=&table=`) fills one in (`settingsFromSearch`).
- **The Download buttons** (`DownloadDataLink`, ⬇ at the right of the panel's bar, shown when the
  profile downloads the dataset): MKT's Indices, DES's recent sessions, the index profile's
  sessions, EQS's and ETFS's results, BS's results, BP's results, YCRV's curves, PORT's positions,
  the ETF's and the bond's price histories, the commodity's history, RFQ's blotter, RFQ AGR's list,
  SVT's approvals, ECO's sovereign rates, FX's crosses and OPT RES's allocation.
- **The Admin**: USER's "Download log" (`widgets/export-admin-panels`), by period and dataset,
  exported as the other tables; ADMCFG's "Data download", the sources DL downloads and each
  profile's limits.
- **CMarket.Api** (phase 45, ADR-071; migration `DataDownloads`):
  - `usr.Exports` (each download: the settings as sent, the summary, the format, the rows, the
    status and progress, the file, kept 7 days; the row stays as the log), `usr.ExportLimits` (each
    profile's limits, the spec's table and decision 43), `usr.ExportDays` (the files of a day,
    counted by one conditional update), `usr.ExportSchedules`; the sources on
    `usr.PlatformSettings`.
  - A reader per dataset: the prices (`mkt.PriceDaily`, adjusted backwards for dividends and
    splits, in XAF at the peg or the ECB's rate), the bonds (the evening's analytics), the curves
    (CEMAC, GBOND, Euribor as "EU"), the portfolios (performance, positions, transactions, the
    user's own and those shared with them), FX (the ECB's rates and XAF's), the commodities (each
    series at its interval), the RFQ's agreements (as RFQ AGR reads them), the indices; a week or a
    month keeps its last session.
  - The files (`ExportFileWriter`): CSV, XLSX of several sheets (the workbook writer now writes
    notes above a frozen header and dates as dates), JSON; their three lines at the top in the
    reader's language.
  - `GET /exports/catalog`, `POST /exports/preview`, `POST /exports` (201 ready, 202 and a job
    above 50,000 rows), `GET /exports?status=`, `GET /exports/{id}`, `/exports/{id}/file` (409
    before, 410 once expired), `DELETE /exports/{id}`; `GET`, `POST` and `DELETE /exports/schedules`;
    `GET /admin/exports/log`, `GET` and `PUT /admin/exports/settings`. Jobs: the file above 50,000
    rows (notification, e-mail, `ExportReady`), the schedules each hour, the files past 7 days each
    night.

## Checked

- Typecheck and lint clean; Vitest 540 tests (the settings from an address, the fields, the time
  zones, the catalogue's limits). CMarket.Api: Domain 713, Application 837, integration 315,
  architecture 21, all passing (the French catalogue of the new messages included).
- Playwright, `e2e/data-download.spec.ts` (6 flows): the mockup's prices from the user menu,
  previewed, downloaded as CSV, listed and counted; a file above 50,000 rows prepared in the
  background until `ExportReady`; a Student's CSV-only year and four datasets; DES's Download
  button opening DL filled in, scheduled every month and stopped; the Admin's log, and EODHD turned
  off then on. The whole suite's first run had 12 failures: most while the Mac slept, two
  fixed below, and the index profile's, whose cause [step 58](step-58-fifth-version-done.md) found
  (other flows moved the prices its contributions are read from).
- axe in English and in French: DL on each dataset and the schedule window, USER, ADMCFG and
  ADMDL clean once the file button of "My downloads" says its visible word.

### Fixed on the way

- USER counts 97 Analysts since step 54 added R. Biyiti (decision 40) outside the drawn
  population: `e2e/admin.spec.ts` expected the mockup's 96.
- The demo fund's purchase of 1,400 SEMC on 4 January 2023 was left out since step 54: SEMC did
  not trade that session (decision 38), and the seed bought at the day's close only. CMarket.Api's
  seed now buys at the last close of the week before.
- The seed of a database from before the second version failed on the new `usr.ExportLimits`
  (its test deleted the account types they refer to); the recurring jobs' tests list the two new
  jobs.

### Left

- The RFQ's requests and answers are not downloaded: the agreements only, as RFQ AGR reads them.
- A portfolio's positions are valued now, not at a date of the past.

## Planned

- **DL** (`/dl`, `DL` in the command bar and the user menu, decision 43), as the mockup:
  - Datasets (left): those the profile allows, each with the codes of the screens it comes from.
  - Settings (centre): the selection (securities, a watchlist, countries and tenors, a portfolio,
    currencies, series, indices, the RFQ's period, status, security and role), the period, the
    frequency (day, week, month), raw or adjusted prices, the fields to include, the format (CSV,
    XLSX, JSON), the layout (one sheet per security or a single table), the decimal separator,
    the time zone, the rows estimated; Download, and Schedule (daily, weekly, monthly, e-mailed if
    asked).
  - Preview (centre): the first 10 rows, and what a session without trades leaves out.
  - My downloads (right): the files of the last 7 days, in progress (with its share), ready (a
    link) or expired; "Above 50,000 rows, the file is prepared in the background: you get an
    e-mail and a notification when it is ready."
  - My limits (right): downloads today, rows per file, history available, scheduled exports;
    "Personal or internal use only: provider data may not be redistributed (terms of use)."
- **The datasets**: historical prices of equities and ETFs (date, open, high, low, close, volume,
  value traded, change, currency, price in XAF), bonds (clean and dirty prices, accrued, YTM, YTW,
  durations, spread, quoted or model), yield curves (the CEMAC series by country and tenor,
  `.GBOND`, Euribor), portfolios (positions valued at a date, transactions, daily performance,
  risk, breakdown), FX (each currency against XAF, the ECB's rates), commodities (each series'
  values, unit, source), RFQ trades (the agreements, and the user's requests and answers),
  indices (the daily values).
- **The rules**: a file up to 50,000 rows at once, above in the background, `ExportReady` and an
  e-mail when ready; kept 7 days; each file opens with the source, the extraction date and the
  terms of use; the scope (one's own and shared portfolios; the organisation's agreements, an
  SVT's bank's; a request anonymous until its agreement); the profiles' limits of the spec,
  decision 43 for the types it leaves out, set by the Admin in ADMCFG; a source turned off
  (decision 41) leaves its datasets out, the catalogue saying why.
- **The Download buttons**: ⬇ at the top right of the panel, opening DL's window with the screen's
  settings: MKT's indices (1), DES (2), EQS (3), YCRV (4), PORT (5), ETFS (15), BP (16), BS (17),
  the ETF, bond and commodity profiles (19 to 21), RFQ (22), RFQ AGR (23), ECO (25), FX (26), SVT
  (27), OPT RES (29) and the index profile (31). The tables' own XLSX and CSV export stays.
- **The Admin**: in USER (screen 9), the download log (who, which dataset, the settings, the rows,
  when) by period and dataset, exported; ADMCFG's sources and limits (decision 41).
- **CMarket.Api**: `usr.Exports` (the user, the dataset, the settings, the format, the rows, the
  status, the file, the expiry), `usr.ExportSchedules`, the log; `GET /exports/catalog`,
  `POST /exports/preview`, `POST /exports` (the file under 50,000 rows, 202 and an `exportId`
  above), `GET /exports?status=`, `GET /exports/{id}`, `/exports/{id}/file`,
  `DELETE /exports/{id}`, `GET`, `POST` and `DELETE /exports/schedules`,
  `GET /admin/exports/log?from=&to=&dataset=`; jobs to make a large file, to run the schedules, to
  remove the expired files; `ExportReady` to the user's connections; the e-mail in the reader's
  language; the limits counted per day in Douala, atomically.
- **Checks**: Vitest for the settings' estimate and the catalogue's limits; the flow of the
  mockup (SEMC, BANGE and IWDA, daily, adjusted, XLSX, one sheet per security), a file above
  50,000 rows ready through `ExportReady`, a weekly schedule, a Student's CSV-only year, the
  Admin's log; each Download button opens DL filled in; axe in both languages.
