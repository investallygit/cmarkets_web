# Step 47 · RFQ REP · Daily reporting to the BEAC (screen 24) (L): to do

Step 47 of the [roadmap](../../ROADMAP.md#order), for the
[fourth version of the spec](../fourth-version.md).

CMarket.Api's phase 38.

- The header (the send time, the recipients, the files, the next send), the month's reports by
  business day (scheduled, sent, nil report sent, failed, resent), the preview of the day's PDF,
  the send panel (Send now or Resend, Download PDF, Download Excel) and the settings (the send
  time, the BEAC's address, the copies, the nil report), as the mockup; in the Admin's back-office
  (decision 17).
- **CMarket.Api**: a job at the send time (18:00) of each business day: the agreements concluded
  since the send before, a one-page PDF (the key figures, by security, by residual maturity) and
  an Excel file of 17 columns, each with its fingerprint; a cancellation reported on its day; a
  nil report on a day without a trade; a send that fails alerts the Admin; every send logged, the
  files kept five years.
