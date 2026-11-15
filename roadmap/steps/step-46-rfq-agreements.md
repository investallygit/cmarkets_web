# Step 46 · RFQ AGR · Agreements (screen 23) (L): done

Step 46 of the [roadmap](../../ROADMAP.md#order), for the
[fourth version of the spec](../fourth-version.md).

CMarket.Api's phase 37. Lane 2 of the [lanes](../lanes.md), once step 44 is on `main`; the
ticket's download and resending and the e-mail log once step 45 is.

- The filters (search, period, status, e-mail status, side, type, country, security, SVT, role,
  trader, face amount; the filters saved), the list with its count and total face amount, sorted,
  paged and exported (XLSX, CSV), and the detail (the request and the agreement's rank, the buyer,
  the seller and their SVTs, the security and its CRCT code, the amounts, the e-mail log by
  recipient; Download ticket PDF, Resend ticket, Cancel agreement), as the mockup.
- Each organisation reads the agreements it is party to, its CEO too; an SVT those that name its
  bank, from AGR; the Admin all of them (decision 17).
- **CMarket.Api**: a ticket sent again is the same document; a concluded agreement is cancelled
  only on both parties' written requests, with a reason and a notice to the four recipients, and
  then leaves the BEAC's reporting; a delivery that fails alerts the trader and the Admin.

## What was built

Started on 15 November 2026 on step 44's agreements, finished the same day on step 45's approvals,
tickets and e-mail log (with step 47 before it on `main`); decision 26 settles what the spec leaves
open.

- **Three screens, one page** (`pages/rfq-agreements`): `RFQ AGR` under RFQ's tabs for an
  organisation's Traders, Managers and CEO (`rfq:read`, `/rfq/agreements`, RFQ's entry lit);
  `AGR` in the SVT's menu (`svt:approve`, `/svt/agreements`, no tab bar: a single tab is none);
  the Admin's RFQ entry (`rfq:report`, `/admin/rfq`, before CFG), with RFQ REP of step 47
  (`/admin/rfq/reports`) beside it under the tabs, the entry lit on both: RFQ REP's own entry left
  the menu (`inMenu: false`), as lane 3 offered.
  `RfqTabs` finds, for each code, the screen the user may open. The filters applied, the order,
  the page and the agreement picked live in the address (`?status=concluded&sort=-faceAmount&
agreement=…`), so that a reload or a link shows the same.
- **The filters** (`widgets/rfq-agreement-filters`), as the mockup: the free search, the period,
  the statuses and e-mail statuses (several), the side, BTA or OTA, the issuing state, the
  security, the SVT ("mine or the counterparty's"), the role, the trader, the face amount in
  millions; Apply, Save, Reset. The selects offer the values of the reader's agreements
  (`/rfq/agreements/options`). The saved filters above them: one picked is applied, and can be
  deleted. The Admin filters neither side nor role.
- **The list** (`widgets/rfq-agreement-list`): "Agreements · 10 results · XAF 2.1 Bn", the mockup's
  columns (the short number, the date and time, the side in green or red, the security in amber,
  the counterparty and its SVT, the nominal, the price, the amount, the DvP date, the status in its
  colour) and the e-mail's status; the Admin's columns are the buyer and the seller. Sorted by the
  API on a header's click, 15 a page as the mockup's "First 15 of 42 · page 1 / 3", XLSX and CSV
  of every agreement the filters keep in the title bar.
- **The detail** (`widgets/rfq-agreement-detail`): the status with its moment ("CONCLUDED 29/10
  10:52") and the e-mail's, the request and the rank ("RFQ-261029-0042 · agreement 1 / 3",
  "anonymous" for an anonymous request), the buyer and the seller with their SVTs, the security and
  its CRCT code (the ISIN), the nominal, the clean price and the rate (a BTA's) or yield (an
  OTA's), the accrued interest, the settlement amount "for information", the DvP date; each SVT's
  approval as screen 27 writes it ("Bank D (buyer's SVT) · Approved 29/10 10:47 · A. Okala", a
  rejection with its reason, a pending one with its deadline); the e-mails by recipient (the
  requesting and the responding trader, each SVT's back office, by its bank), each with its kind
  (the ticket, a notice), status and time, the mail server's answer to a failure for the Admin; the
  ticket, when it was made and its SHA-256 fingerprint; a cancellation's reason, who entered it and
  when, the two letters kept.
- **Download ticket PDF** for a concluded or cancelled agreement, to every reader (`ACC-….pdf`, the
  stored document); **Resend ticket** (`features/resend-rfq-ticket`), to a Trader or a Manager of
  either party and to the Admin: to every recipient or to one, the same document, each send logged;
  a failure is said, and alerts the trader and the Admin in their notification centres.
- **Cancel agreement (reason)** (`features/cancel-rfq-agreement`): for a concluded agreement, to a
  Trader or a Manager of either party and to the Admin; the reason and both parties' written
  requests (PDF, JPEG or PNG, 10 MB), the requester's and the responder's named after their
  organisations.
- `entities/rfq-agreement`: the queries under the RFQ's keys (the ticket's download and resend
  among them), the address's filters and order, the recipients' names (`agreementDisplay`),
  `useRfqAgreementSync` (an agreement made reaches its parties' and SVTs' lists; an SVT's decision
  and the agreement's end read the detail and the lists again). The contract `rfqAgreements.ts`
  (step 45's `AgreementApprovalDto` for the approvals), the routes in `endpoints/rfq.ts`, the
  locale area `rfqAgreements` (the approvals' words are step 45's `svt` keys).

## CMarket.Api (phase 37, ADR-063)

- `rfq.AgreementCancellations` (one an agreement: the reason, both letters with their SHA-256 and
  storage key, who entered it and when) and `rfq.AgreementFilters` (a name once per user, 20 a
  user, the criteria as JSON); migration `RfqAgreements`.
- `GET /rfq/agreements` (the filters, `sort`, `page`, `pageSize`; the count and the total face),
  `/rfq/agreements/options`, `/rfq/agreements/export?format=xlsx|csv`, `/rfq/agreements/{id}`;
  `POST /rfq/agreements/{id}/cancel` (multipart); `GET`, `POST /rfq/agreement-filters`, `DELETE
/rfq/agreement-filters/{id}`. The reads open to any of `rfq:read`, `svt:approve` and
  `rfq:report` (a new `[HasAnyPermission]`), the cancellation to `rfq:trade` or `rfq:report`.
- On step 45: the detail's approvals, e-mails by recipient and ticket; the ticket's PDF (`GET`
  `/rfq/agreements/{id}/ticket.pdf`, the stored ticket, made at its first reading for an agreement
  concluded before it had one) and `POST /rfq/agreements/{id}/resend` (`{ recipient? }`, through
  step 45's `AgreementMailer`: each send Resent or Failed, the alerts, the e-mail status again;
  audited `TicketResent`).
- A cancellation: the RFQ's audit log, then a job e-mails the four recipients through the same
  mailer, each in its language (a back office's French, as the ticket's), each send logged as a
  `CancellationNotice`; a failure alerts the trader and the Admins.
- The migration `RfqAgreements` made again after step 45's `SvtApproval` (20261115133007).
- The demo: the cancelled agreement's letters and reason; the first agreement's ticket, refused by
  Bank E's back office and sent again twelve minutes later by T. Bekale; T. Bekale's saved filter
  "Concluded OTA".

## Checked

On 15 November 2026, on `main` with steps 45 and 47 (web e939dc9, API a827ab0), each run on a fresh
database:

- `npm run typecheck` and `npm run lint` clean; `npm run test:run` 441 (the criteria in the
  address, the recipients' names, the menus with AGR and the Admin's one RFQ entry, the routes
  against the API's OpenAPI, which gained ten).
- Every flow: 135, then the 23 `@fresh-db` flows, one spec per fresh database: among them
  `rfq-agreements` (the tabs; a trader's filters, order, saved filter and export, the CEO reading
  its organisation's; the SVT's AGR and the Admin's RFQ; both approvals and the e-mails of the
  first agreement, its ticket downloaded and sent again to the four; a cancellation on both
  letters), lane 1's `rfq`, `rfq-trading` and `svt-approval`, lane 3's `rfq-reporting`, which now
  opens RFQ REP by its tab. No answer 5xx in the API's logs.
- axe (WCAG 2.2 AA) on RFQ AGR (the list and the first agreement's detail, its Resend ticket and
  Cancel agreement dialogs), the SVT's AGR and the Admin's RFQ, at 1600, 390 and 320 px, in
  English and French (each account's profile language): 30 audits, no violation, no page wider
  than the screen.
- CMarket.Api: the whole suite, 1,773 tests, the SQL Server ones included (the migration
  `RfqAgreements` from `SvtApproval`, its idempotent script and its way down).
- `e2e/svt-approval.spec.ts` (step 45) failed once in three runs of the RFQ flows: B. Sima's
  "rejected" toast missing, the agreement's detail read again with a 401 right after the
  rejection. It passed the two runs after and the every-flow run: left to step 48, which runs
  every flow again.

## Fixed on the way

- The request's line of the detail no longer breaks inside "agreement 1 / 3".
