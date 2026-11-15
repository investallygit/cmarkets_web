# Step 47 · RFQ REP · Daily reporting to the BEAC (screen 24) (L): done

Step 47 of the [roadmap](../../ROADMAP.md#order), for the
[fourth version of the spec](../fourth-version.md).

CMarket.Api's phase 38. Lane 3 of the [lanes](../lanes.md), once step 44 is on `main`; the
concluded agreements once step 45 is, the cancellations once step 46 is.

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

## What was built

- **Contract** (`rfqReports.ts`, `endpoints/rfq.ts`, `endpoints/admin.ts`): `DailyReportMonthDto`
  (the month's business days, each `DailyReportDayDto`: its date, status, agreements, face amount
  and latest send; the next send); `DailyReportDto` (the status, `preview` for a day not made yet,
  the period, the time it was made, `DailyReportFiguresDto`: the key figures, by security with the
  face-weighted averages, a BTA's price left out, the six buckets of residual maturity, the
  cancellations; the subject, the recipients, the attachments with their size, pages or rows and
  columns and SHA-256, the Excel's columns, the sends logged); `DailyReportSettingsDto` and its
  input at a version; the routes of section 10: `GET /rfq/daily-reports?month=`,
  `/rfq/daily-reports/{date}`, its `summary.pdf` and `transactions.xlsx`, `POST …/send`,
  `GET` and `PUT /admin/rfq/daily-report-settings`, all `rfq:report` (decision 18).
- **RFQ REP** (`pages/rfq-reporting`, `widgets/rfq-report-panels`): under the RFQ's tab bar (the
  Admin sees "BEAC reporting" alone, decision 17) and the header ("Automatic send every business
  day at 18:00 · to: … · copy: … · PDF summary + Excel of trades", the next send, "RFQ off" while
  it is); "Daily reports": the month's business days, newest first, each day's agreements, face
  amount in millions and status in its colour with its time, the months before and after; the
  newest day picked; "PDF summary preview": the day's page drawn from the figures it was made of
  (the title and the scope, the period, the key figures, "1. By security" with its total, the
  cancellations line, "2. By residual maturity" with its bars, "3. List of trades", the footer
  with the time it was made, the Excel file's SHA-256 and the note that the amounts are
  indicative), "Preview" on a day not made yet; "Send of …": the status, To, Copy, the subject,
  the attachments ("Summary · 1 page", "3 rows · 18 columns", their size and fingerprint), the
  Excel's columns, Send now or Resend (confirmed first), Download PDF, Download Excel, the sends
  with their time, the Admin or "Automatic" and the mail server's error; "Settings (Admin)" and
  their dialog (the time HH:mm of Douala, the BEAC's address, up to ten copies, the nil report;
  each address once; another Admin's change meanwhile read again).
- **The Admin's menu**: an RFQ entry after PAY, before CFG (decision 17), the screen's code
  `RFQ REP` in the command bar; AUDT names the four settings changed.
- **Slices**: `pages/rfq-reporting`, `widgets/rfq-report-panels`, `entities/rfq-report` (the
  queries under the Admin's keys, the statuses' tones, the months, the millions),
  `features/send-daily-report`, `download-daily-report`, `edit-daily-report-settings`; the strings
  in a new area, `rfqReports`, and in `core` (the screen, the panels) and `admin` (the audit's
  fields).

## CMarket.Api (phase 38, ADR-064)

- A report a business day made once, its period from the end of the report before to its day's
  send time (or a Send now's time before it), its agreements recorded once as concluded and once as
  cancelled, its figures a document read whole, its PDF and Excel file stored with their SHA-256 and
  sent as they are on a resend; what a period reports decided in the domain (concluded in it and
  not cancelled by its end; a cancellation in it of an agreement reported before; one concluded
  and cancelled within a period, neither). The job `rfq-daily-report` every minute, from the first
  day it found the RFQ on, catching up after a stop; a nil report, or the day Skipped when the nil
  report is off; a failed send logged with the server's error, the Admins told by a notice and an
  e-mail; the reports past five years purged with their files. The PDF writer gains headings,
  tables in Courier and rules; `EmailMessage` its copies. The demo's twenty business days of
  reports.

## Checked

On step 44 (`main` at web 9c0497c, API 17f44ca), 15 November 2026:

- **Web**: `typecheck`, `lint` and 430 unit tests (the months, the millions and the statuses of
  RFQ REP, the settings' rules, the back-office menu with its RFQ entry); `openapi-routes.txt`
  written again from the lane's API (its seven routes added); 133 flows on one fresh database,
  RFQ REP's two among them (the list, the day as sent with its files and its sends, Download PDF
  and Download Excel, Resend logged; the settings checked, saved, the header following them, then
  put back), and the nine specs of `@fresh-db` flows each on a fresh database of its own (55
  flows), all passing.
- **Accessibility**: axe (WCAG 2.2 AA) at 1600, 390 and 320 px in English and French on RFQ REP,
  a day sent and resent, the confirmation of a resend, the settings and their errors: 30 audits
  clean. The checks found the preview's body and its table by security scrolling without a
  focusable element at 390 and 320 px: they scroll in the kit's `ScrollArea`, which takes the
  focus itself.
- **CMarket.Api**: 1,740 tests, all passing: 1,706 in the usual run (26 more: domain 13,
  application 10, HTTP 3) and the SQL Server suite's 34 (this migration's constraints, as an
  idempotent script, and down). The checks found the jobs' list of `LiveMarketTests` without
  `rfq-daily-report`, and a 500 for a settings change without its copies (a rule after `NotNull`
  runs on a missing list too): fixed.
- Steps 45 and 46 conclude and cancel the agreements through `RfqAgreement.Conclude` and `Cancel`,
  which the report reads (`ConcludedAt`, `Status`, `EndedAt`): their flows reach it with nothing
  more; step 48 runs every flow again with them.

## Open points

- The Excel file holds an 18th column, the status, which the spec's 17 do not have, so that a
  cancellation shows "with the Cancelled status in the Excel file" in one layout.
- A day without trades while the nil report is off is listed "Skipped", a status the spec's five
  do not have.
- The PDF's footer carries the Excel file's fingerprint (a file cannot carry its own); the send
  log carries both.
- The PDF is in English, as the mockup; the e-mail's text in French then English. The BEAC's
  business days are BVMAC's sessions, as the RFQ's settlement dates. All are to agree with the
  BEAC (the spec: "the content and the sending address must be agreed with the BEAC").
