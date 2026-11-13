# Step 39 · FX · FX dashboard (screen 26) (M): done

Step 39 of the [roadmap](../../ROADMAP.md#order), for the
[fourth version of the spec](../fourth-version.md).

CMarket.Api's phase 30.

- The header (the fixed parity, the date of the reference rates), the cross rates against the XAF
  (the ECB's rate, XAF per unit, the change over 1 day, 1 month, the year to date and 1 year; a
  click draws the currency), the chart from 1 month to MAX with the last rate, the year's high and
  low and the volatility, the converter, the cross-rate matrix and the euro area's benchmarks
  (Euribor at 1, 3, 6 and 12 months, the EUR 10-year swap), as the mockup; the note that reference
  rates are indicative and settle nothing.
- FX in the menu, after MKT (decision 15); MKT's "Rates and FX" panel opens it.
- **Contract**: `/fx/xaf-crosses?date=`, `/fx/{ccy}/history`, `/fx/convert`,
  `/fx/matrix?currencies=`; `GET / PUT /admin/macro/settings` for the currencies shown (ADMCFG).
- **CMarket.Api**: `mkt.FxReferenceRates`; the ECB's rate of each currency shown, once a day at
  17:15 CET (10 calls each), the last value kept on a day without publication; XAF per unit =
  655.957 / the ECB's rate, the yen per 100; MKT's `/fx` on the same rates (decision 22).

## What was built

- **Contract** (`fx.ts`): `XafCrossesDto` (the parity, the day of the rates, the crosses in the
  Admin's order), `XafCrossDto` (the currency, its names, its unit, its day, the ECB's rate, the
  XAF for its unit and `changes`: `day`, `month`, `ytd`, `year`, in percent of the XAF value),
  `FxHistoryDto` (`points` of a day and a value, `year`: last, high, low, volatility),
  `FxConversionDto` (the result, the rate, the day of the rates, `fixedParity`), `FxMatrixDto`
  (`rates[i][j]`, 1 unit in row = … in column), `FxCurrencyDto`; `MacroSettingsDto` in
  `admin.ts`, `fxCurrencies` and `matrixCurrencies` among the audited fields; the six routes in
  `endpoints/market.ts` and `endpoints/admin.ts`.
- **FX** (`pages/fx-dashboard`, `widgets/fx-dashboard-panels`): the parity's header ("1 EUR =
  655.957 XAF … crosses computed from ECB reference rates of 12/11/2026 (published around 16:00
  CET)", ECB REFERENCE); the cross rates against XAF, a row a currency of the Admin's, the yen "per
  100", the ECB's rate with its own decimals (two to four: 1.0848, 163.40, 19.412), the XAF value,
  the four changes, the formula and "Indicative reference rates, not usable for settlement." under
  them; a click or the arrow keys draw the currency, kept in the address (`/fx?currency=GBP`); the
  chart in amber from 1M to MAX (each publication up to a year, each week's last beyond), under it
  the last rate, the 1-year high, low and volatility; the converter (10,000,000 XAF into dollars
  as the mockup, asked once the amount stops changing, "Rate applied: 1 USD = 604.68 XAF (ECB
  reference of …)", the parity said between the euro and the franc); the matrix, two decimals and
  four below one, the parity's three (655.957, where the mockup rounds it); the euro area's
  benchmarks of step 38's `/macro/global-rates?set=euro`. Its panels are laid out as the mockup,
  under the header, and stack below 1280 px, where a table too narrow scrolls sideways.
- **MKT**: the Rates and FX panel's title bar opens FX ("FX dashboard"); an exchange rate opened
  (double click or Enter) opens it on that currency. Its rates are now FX's (decision 22):
  USD/XAF 604.68 on the demo, as FX shows it.
- **The menu** (decision 15, settled): FX after MKT, a Trader's fourteenth entry. The menu keeps
  its 44 px entries; a window too short for them scrolls it, the open screen's entry is brought
  into view, and a grey glow at the top or the bottom edge says entries lie beyond it (no motion).
- **ADMCFG**: "Macro and FX", the currencies of FX's table (1 to 20 of the ECB's, in order) and
  of its matrix (2 to 8, the euro and the franc allowed), each moved up or down, removed, or added
  from a list of the ECB's currencies; saved together, each list changed audited ("FX currencies
  against XAF: USD, GBP, … → …"); AUDT names the target "Macro and FX settings". ECO's countries
  and tiles join the panel with step 40.
- **Slices**: `pages/fx-dashboard`, `widgets/fx-dashboard-panels` (new);
  `entities/rate` (the FX queries, the chart's periods, the currency's name),
  `entities/platform-settings`, `features/edit-platform-settings` (the currency lists),
  `widgets/platform-settings-panels`, `widgets/rates-fx-panel`, `widgets/side-menu`,
  `entities/audit`; the strings in a new area file, `macro`.

## CMarket.Api (phase 30, ADR-055)

- `mkt.FxReferenceRates` (a currency and a day, the ECB's rate for 1 EUR) and `usr.MacroSettings`
  (one row, the two lists). `mkt.FxRates`, whose provider pairs only the demo wrote, is dropped by
  the migration `FxReferenceRates`; its `Down` brings it back.
- The ECB's currencies (29 in 2026: the lev, gone with the euro of 2026, the rouble and those of
  the states that took the euro are not offered), their names in both languages, the yen per 100.
- EODHD's load (`LoadFxReferenceRatesCommand`) each business day at 17:15 in Frankfurt with the
  key alone (`Eodhd:FxEnabled`): each currency FX shows and MKT's dollar and yuan, a call of 10
  units each, its whole history at its first load (from 4 January 1999), then the days since its
  latest rate less a week; at start-up and once the Admin adds a currency, while one has none.
  Without the key, the demo gets the screen 26 mockup's rates and changes (`DemoFx`).
- The routes, on a series cached a day a currency: `/fx/xaf-crosses` (on a day, a holiday keeping
  the day before's), `/fx/{ccy}/history` (with `interval=1w`), `/fx/convert` (the parity between
  the euro and the franc), `/fx/matrix`, MKT's `/fx` (any `{CCY}XAF` of the ECB's); the ETFs'
  assets in dollars on the same rates; `GET / PUT /admin/macro/settings`.

## Checked

- Type check, lint, the 374 unit tests (4 new: the chart's periods and the days of Douala they
  count, the decimals of the ECB's rates and of the crosses).
- CMarket.Api: 1,550 tests, all passing: 1,524 in the usual run and the SQL Server suite's 26 on
  SQL Server. New: the currencies, a rate's rules, the figures on the mockup's, the Admin's lists;
  the crosses, the history, the conversion and the matrix on the demo's rates (the mockup's to the
  hundredth), MKT's rates, the settings audited and a currency added loaded; the load (what it asks
  from 1999, stores, rewrites, counts at 10 units, tries again, at start-up, nothing without the
  key, the schedule at 17:15 in Frankfurt); the routes over HTTP; the migration up, as an
  idempotent script, and down. One test changed its figure: the ETFs' assets in dollars turn at the
  ECB's rate (1.0848), no longer at the demo's provider pair.
- The live load, on a throwaway database with the key: the ten currencies from 4 January 1999 in
  23 seconds, 100 quota units, each answered 200; the ECB's rates of 13 November were at EODHD by
  15:15 CET (the dollar at 1.1052, 593.52 XAF); the crosses answered in 115 ms the first time,
  every route then in 4 to 18 ms; the dollar since 1999 is 293 KB a publication a day, 60 KB a
  week (the chart's 5Y and MAX).
- Every Playwright flow on CMarket.Api from a fresh database: 118, all passing. Three new: FX (the
  mockup's crosses, the pound drawn and kept in the address, two conversions, the matrix, the
  benchmarks); MKT's panel opens FX on the yuan, FX lit after MKT in the menu; ADMCFG takes TRY
  out, moves CAD up and adds CHF to the matrix, AUDT records it, FX follows. The smoke flow that
  lists the client menu in order now has FX after MKT; the API's log holds no error.
- axe (WCAG 2.2 AA) at 1600, 390 and 320 px, in English and French: FX with the pound drawn and a
  conversion, MKT, ADMCFG with a currency moved: 18 audits, nothing found. The screenshots showed
  the header's note squeezed and the table's figures cut at 390 px: the note now wraps under the
  parity and the table scrolls sideways. In a window 560 px high, the open screen's entry stays in
  view and a glow marks the edge where entries are hidden.
