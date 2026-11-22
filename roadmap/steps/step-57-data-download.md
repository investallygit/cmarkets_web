# Step 57 · DL: data download (screen 30), the Download buttons (XL): to do

Step 57 of the [roadmap](../../ROADMAP.md#order), for the
[fifth version of the spec](../fifth-version.md).

CMarket.Api's phase 45. Comes last: its datasets read what steps 54 to 56 add. It may split in two
when it starts: the screen and its files first, then the schedules and the buttons.

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
