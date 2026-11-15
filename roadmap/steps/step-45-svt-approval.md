# Step 45 · SVT · SVT approval (screen 27) (XL): done

Step 45 of the [roadmap](../../ROADMAP.md#order), for the
[fourth version of the spec](../fourth-version.md).

CMarket.Api's phase 36 (its ADR-062). Lane 1 of the [lanes](../lanes.md), once step 44 was on
`main`. It concludes the agreements step 44 made, and gives step 46 their tickets, their e-mails'
log and the service that sends them.

- The counters, the agreements to approve by time left with the checks on the client (its link,
  its daily limit and what it used of it, the day's trades), the latest decisions, the trader
  links (step 43), the approval settings and the agreement's detail with both approvals, Approve
  and Reject (a reason required), as the mockup.
- **Rules**: 60 minutes to decide (the Admin's setting) and 16:00 at the latest, 10:00 on the next
  business day for an agreement confirmed after the cut-off; without a decision the approval
  expires and the agreement is cancelled; two approvers above the bank's threshold (XAF 1 bn); one
  decision when both sides chose the same SVT; a rejection's reason told to both traders; a
  reminder 15 minutes before the deadline.
- **CMarket.Api**: `rfq.SvtApprovals` and `rfq.SvtSettings`; once both SVTs approved, the
  agreement is concluded and its PDF ticket (a timestamp, a SHA-256 fingerprint, the approvers'
  names) goes by e-mail to both traders and both back offices; `ApprovalRequested`,
  `ApprovalDecided`, `AgreementConcluded` and `AgreementRejected`; the notices on screen, by
  e-mail and by SMS.

## What was built

- **Contract** (`svtApprovals.ts`): an approval's statuses and sides, the six rejection reasons,
  `SvtSummaryDto` (the counters and the Admin's window), `SvtApprovalItemDto` (the agreement, its
  confirmation and deadline, the approval's status and the agreement's, the bank's client or
  clients with their checks, the security, the face, the price or rate, the counterparty and its
  SVT, four eyes, the decision), `ClientCheckDto`, `SvtApprovalDetailDto` (both approvals, what
  the reader may do), `SvtSettingsDto` and the inputs; `TimeOfDay` in `common.ts`; the window's
  three fields on `RfqAdminSettingsDto` and its input; the seven routes in `endpoints/rfq.ts`;
  the hub's four approval events in `RfqEventMap`.
- **SVT** (`pages/svt-approval`, `widgets/svt-approval-panels`): the SVT account's home, first
  in its menu. The counters above the panels (to approve in amber, approved today in green,
  rejected today in red, the face approved, the linked traders, the link requests). "Agreements
  to approve": the window in the bar ("Window: 60 min · before 16:00"), the bank's agreements by
  time left (red past the reminder's 15 minutes), the client and its side (both when the bank
  holds both legs), the security, the face, a BTA's rate or an OTA's price, the counterparty and
  its SVT, the checks ("OK", "Limit" over the client's daily limit, "Link" without a confirmed
  link; "Four eyes" above the threshold); then the day's decisions ("ACC-0013 approved by B. Sima
  · agreement concluded, PDF sent"; "rejected by … · reason: …"). The agreement picked, the first
  to approve until one is: "Awaiting your approval" (or a second approver, the other SVT, its
  end), the request and its rank, the parties with "your client" and "(you)", the security and
  its CRCT code, the face, price and rate, the settlement amount, the DvP date; the checks on the
  client (its link and since when, its daily limit with what it used and what is left or by how
  much it is over, the day's agreements); both approvals (approved at … by …, pending with its
  countdown, a first approval of four eyes, rejected with its reason, expired, none left to take
  once the other SVT ended it); Approve and Reject (`features/decide-svt-approval`: the six
  reasons, "other" with its text, 500 characters). TRD's "Trader links" panel. "Approval
  settings": the Admin's window and cut-off, then the bank's four-eyes threshold, its approvers
  (every SVT account, or those ticked), its default client limit, its channels and the reasons
  offered; edited in place (`features/edit-svt-settings`).
- **TRD**: confirming a link offers the bank's default client limit.
- **ADMCFG**: "The SVTs' approval window" in the RFQ panel: the minutes (15 to 240), the cut-off
  (08:00 to 20:00) and the next business day's deadline (from 07:00, before the cut-off), audited
  as one field.
- **RFQ**: an agreement concluded, rejected or expired reaches the requester's and the
  responder's screens at once (its status in "My request", the blotters).
- **Real time**: `entities/rfq`'s `useRfqTradingSync` handles the four approval events: an SVT
  told of an agreement to approve, or of its deadline 15 minutes away, by a toast; a decision and
  an agreement's end read again on both sides; the counters on the links' events too.
- **Slices**: `entities/rfq` (the SVT's queries and mutations, a check's result, what is left of a
  limit, the time left, the reasons), `entities/session` (the SVT's home),
  `widgets/svt-approval-panels` (new), `features/decide-svt-approval` and
  `features/edit-svt-settings` (new), `features/decide-trader-link` (the default limit),
  `features/edit-platform-settings` (the window); the strings in `rfq` (`svt`, `rfqSettings`) and
  `core` (the screen, the panels).

## CMarket.Api (phase 36, ADR-062)

- `rfq.SvtApprovals`: an approval per SVT of each agreement at its confirmation (one, "both", when
  both sides chose the same SVT), its deadline the Admin's window from the confirmation, the
  cut-off at the latest, the next business day's deadline after it; its status, the first
  approver of four eyes, the deciding account and time, the reason and its text, the reminder's
  time. `rfq.SvtSettings`: a bank's four-eyes threshold, its approvers (none listed: every SVT
  account), its default client limit, its notices by e-mail and SMS. `rfq.RfqSettings` gains the
  window; `rfq.Agreements` the ticket's file, SHA-256 and time; `rfq.AgreementEmails` logs each
  send (the ticket or a notice, the recipient, Sent, Resent or Failed, the error).
- Approved by every SVT, the agreement is concluded; its ticket, a PDF of the agreement and both
  approvals made once and stored, goes by a job to both traders (each in their language) and the
  back office of each SVT (one when both chose the same); a failed send alerts the trader and the
  Admins in their notification centres. Rejected by one SVT, or expired, the agreement ends and
  both traders get the notice (the reason with a rejection's). `AgreementMailer` is the service
  step 46 resends and cancels through.
- The job `rfq-approval-expiry` every minute: the approvals past their deadline expire with their
  agreement, and the bank's approvers are reminded 15 minutes before (by e-mail, by SMS where the
  bank asks for it, on the hub). An approval the other SVT's rejection left pending stays without
  a decision to take.
- `/svt/summary`, `/svt/approvals` (`status=pending|decided`, `from`, `to`),
  `/svt/approvals/{agreementId}` with `/approve` and `/reject`, `/svt/settings`; `/admin/rfq/svt`
  carries the window. `/hubs/rfq`: `ApprovalRequested`, `ApprovalDecided`, `AgreementConcluded`,
  `AgreementRejected`.
- The demo (`DemoSvtApprovals`, which also completes a database seeded before): the approvals of
  every agreement of step 44's demo, as their statuses tell (A. Okala for Bank D, B. Sima for
  Bank E), their tickets' and notices' e-mails logged; C. Abena's sale of the morning approved by
  B. Sima and concluded; the screen 27 mockup's agreement approved by A. Okala for Bank D,
  waiting for Bank E with its two siblings; Bank E's settings with the SMS on.

## Checked

On top of steps 44 and 47 (lane 3's, which came onto `main` while this step was checked), as
`main` stood on 15 November 2026 (web 6345cc8, API edf7d90): the migration `SvtApproval` made
again after step 47's `BeacReporting`, the demo's approvals seeded before its daily reports,
which report the agreements they conclude.

- Type check, lint, the 435 unit tests (new: a check's result and what is left of a client's
  limit, the time left to decide, a rejection's reason as the lists write it, SVT the SVT's home
  and the first of its menu; the routes refreshed from CMarket.Api, its 7 new ones).
- CMarket.Api: 1,757 tests, all passing: 1,722 in the usual run and the SQL Server suite's 35.
  New: the deadline (the window, the cut-off, 10:00 the next business day after a holiday or a
  Saturday), four eyes, the reasons, the expiry and the reminder, the settings and the ticket made
  once, in the domain; approved by both and the ticket e-mailed to four (its PDF read back),
  rejected with the other approval left without a decision to take, the reminder (its e-mails
  and its SMS) then the expiry, the cut-off, four eyes and the approvers listed, the settings and
  the Admin's window audited, the demo as the mockup tells it; over HTTP the contract's names and
  the hub's events, the keys; on SQL Server the migration (the settings' defaults, the
  constraints, the idempotent script, down), the demo's approvals seeded there too. Brought up to
  date: step 44's demo (C. Abena's sale of the morning now concluded, the blotters' events), the
  Admin's RFQ settings' keys, and four of step 47's daily report tests, whose Friday now carries
  the morning's sale (the nil report moved to Monday, the day skipped to Tuesday).
- Every Playwright flow on CMarket.Api from a fresh database: 153, all passing (134 in the usual
  run, the 19 `@fresh-db` ones on a fresh database per spec). New: T. Bekale buys 500 million of
  the OTA through Bank D from B. Ngoma and A. Tchakounté, who sell through Bank E; B. Sima approves
  the first, which waits for Bank D, and rejects the second for a reason of her own, which the
  latest decisions show; A. Okala (in French) reads Bank E's approval and concludes the first; B.
  Sima reads it at once, T. Bekale both outcomes on RFQ; Bank E's four eyes set above XAF 2
  billion. Changed: SVT is B. Sima's home and the first of her menu; TRD offers the bank's default
  limit (XAF 500 million) when a link is confirmed; ADMCFG's window (45 minutes, 15:30, 09:30)
  read back in B. Sima's settings; the CEO reads C. Abena's sale concluded. The API answered no
  5xx.
- axe (WCAG 2.2 AA) at 1600, 390 and 320 px, in English and French, once T. Bekale's purchase made
  two agreements for Bank E: SVT with an agreement open, its reject dialog, the settings edited,
  TRD's confirm dialog with the default limit, as B. Sima; ADMCFG with the window as the Admin;
  RFQ with the request's agreements awaiting the SVTs and the blotter's concluded one as the
  Trader: 36 audits, nothing found.
- Found on the way: a decision's line said "agreement concluded" after any approval: it says what
  followed (concluded, the other SVT rejected, expired). The expiry job also wrote the approvals
  the other SVT's rejection had left without a decision, and the agreement's end went twice on
  the hub: the job takes the agreements still awaiting, an agreement's approvals expire together,
  its end goes once. A rejection's notice marked the agreement's ticket as e-mailed. The approval
  request's SMS gave the deadline's time alone, read as today's on a Sunday: it gives its day too.
  On such a day the countdown reads "24:26:11", which the list cut: its narrow columns fit their
  headers and such a countdown, and the counters wrap on a phone rather than cut the amount. Lane
  3 found that `PUT /admin/rfq/svt` without its list of SVTs answered 500 (step 44's validator
  read the missing list): it is refused as any missing field now.

## Not built here

- **The SVT's messages with its linked traders** (decision 16, MSG in its menu): the messaging
  rests on the professional profile, which an SVT has not; moved to
  [step 48](step-48-fourth-version-done.md).
- **"Concluded agreements above XAF 250 million can feed the CMarket curve (Admin option)"**
  (screen 22's rules): the curve's inputs and the option's place are open; moved to step 48 and
  asked in the [open questions](../open-questions.md#fourth-version).
