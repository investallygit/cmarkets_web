# Step 28 · MPAY · Media payments (screen 18) (XL): done

Step 28 of the [roadmap](../../ROADMAP.md#order), for the
[third version of the spec](../third-version.md).

CMarket.Api's phase 21.

- **Built**:
  - MPAY (Admin, `news:payments`; `/admin/media-payments?month=2026-10&id=`), after SRC in the
    Admin's menu (the spec puts it between SUBS and ANLY; SUBS comes in step 34). Over the
    workspace, the header of the mockup: the month (the one before this by default), the total
    amount due, payable and excluded unique clicks, anomalies open, amount already paid.
  - The statements by newspaper: rate per click, items, unique, excluded and payable clicks,
    gross amount, cap, amount due and status in its colour, with a total row; in the title bar
    the global settings, the table as XLSX and the transfer file (XLSX or CSV: the approved,
    unpaid statements, newspaper, amount and reference); below, the cycle and the two notes of
    the mockup. A statement below the minimum payment reads "Carried over".
  - The click anomalies of the newspaper picked: day, signal ("Spike ×7 the average", "38
    accounts · same IP address", "Accounts under 24 h old"), items (an item's headline, "6 FLASH
    items", "Several items"), clicks and decision; Invalidate and Keep, each with a reason; the
    clicks in detail (time, item, account, address, exclusion).
  - The statement: its figures as the mockup lists them, items by type and the five most clicked,
    its approval and dispute window, its payment; the status picked with a reason (and the
    payment's date, method and reference for Paid); a change a second Admin must confirm (the
    API's 409 `statementSecondAdmin`) waits on the statement, which another Admin confirms and
    either drops; the newspaper's dispute with Maintain and Correct; Release, Recalculate and the
    PDF; the newspaper's payment settings from a month on (this one by default, "No cap") with
    their versions; the history.
  - NEWS NEW gets the newspaper's statements under the studio: month, reference, payable clicks,
    amount due and status, its payment or the Admin's answer; the PDF once approved; Dispute,
    with a reason, within the window after the approval.
  - SRC's rate and cap are the payment settings in force this month: a change there is a version
    from this month on. AUDT files the seven new actions under "Media payments".
  - Slices: `entities/news-statement`; the features `change-statement-status`,
    `decide-click-anomaly`, `edit-payment-terms`, `edit-payment-settings`,
    `resolve-statement-dispute` and `dispute-statement`; `widgets/media-payments-panels`,
    `pages/media-payments`; the studio's `NewsStatementsPanel`. The contracts in
    `newsPayments.ts`, the endpoints of `/admin/news-statements*`, `/admin/news-clicks/anomalies*`,
    `/admin/news-sources/{id}/payment-settings*`, `/admin/news-payment-settings` and
    `/provider/statements*`.
- **CMarket.Api** (phase 21):
  - Tables `news.ClickStatements` (one a newspaper and month, guarded by a row version) with its
    history, payments, disputes and the changes waiting for a second Admin; its clicks per item
    as computed (`news.ClickStatementItems`); `news.ClickAnomalies` and the clicks of each;
    `news.SourcePaymentSettings` (dated versions) and `news.PaymentSettings`. The migration
    `MediaPayments` makes each partner newspaper's rate and cap its first version, from the month
    it joined, and drops them from `news.Sources`; tested up, again by the idempotent script, and
    down on SQL Server.
  - Amount due: min(payable clicks × rate, cap) in whole francs, plus what the month before
    carried; below the minimum payment (XAF 5,000) the whole is carried over. A statement keeps
    its figures as computed: approved, its amount no longer moves; a month's terms are the latest
    version not after it, and a new version computes again the statements not approved yet.
  - The cycle and the manual changes of the spec; a second Admin above the four-eyes threshold
    (XAF 300,000), with an anomaly open, for Paid without approval and out of Paid; the dispute
    within 15 days; every action audited with its reason; the newspaper's News providers told in
    the app (statement available, approved, paid, dispute answered).
  - Jobs: `news-click-anomalies` at 01:00 for the day before (a spike: an item's payable clicks of
    a day five times the newspaper's average per item of the 30 days before, 50 at least; 20
    accounts on one address; 20 accounts under a day old, excluded by rule already) and
    `news-statements` every 15 minutes, which issues the month before's statements once their
    day and time of Douala have passed (the 1st at 02:00 by default), once.
  - The demo: the month before the seed as the mockup's October 2026, from 770 items and 74,364
    unique clicks the population read (the mockup's six rows to the click); DAILY K's three
    anomalies; ÉCO HEBDO and CONGO INFO approved, GABON ÉCO paid by transfer, TCHAD MATIN
    disputed by its News provider; the mockup's contracts (DAILY K's earlier version: XAF 12 and
    300,000). Without the population, a small month of the same shape.
- **Checked**:
  - Type check, lint, the 316 unit tests.
  - CMarket.Api: 1,255 tests and the SQL Server suite's 16.
  - Every Playwright flow on CMarket.Api from a fresh database: 93, all passing, and the studio's
    `@fresh-db` flow on a fresh database of its own. Three new ones, of MPAY: the month as the
    mockup, the 210 clicks of one address invalidated and the approval above the threshold
    confirmed by a second Admin; MEDIA I approved, its statement's PDF and dispute in the studio,
    maintained by the Admin; a payment, the transfer file, a newspaper's terms from this month.
  - axe (WCAG 2.2 AA) at 1600, 390 and 320 px, in English and French: MPAY (a statement waiting
    for a second Admin, a disputed one, the payment fields, the global settings, the clicks of an
    anomaly) and the studio's statements with the dispute dialog: 54 audits, nothing found,
    nothing scrolls sideways.
