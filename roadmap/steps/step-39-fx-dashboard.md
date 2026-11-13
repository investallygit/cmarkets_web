# Step 39 · FX · FX dashboard (screen 26) (M): to do

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
