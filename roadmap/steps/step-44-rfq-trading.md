# Step 44 · RFQ · Government securities RFQ (screen 22) (XL): done

Step 44 of the [roadmap](../../ROADMAP.md#order), for the
[fourth version of the spec](../fourth-version.md).

CMarket.Api's phase 35 (its ADR-061). Lane 1 of the [lanes](../lanes.md), once step 43 was on
`main`. It sets the agreement's whole model (section 10's columns of `rfq.Agreements`, every
status, demo agreements in each), on which steps 46 and 47 start.

- New request (a BTA or an OTA of the master list, buy or sell, the face amount, a rate for a BTA,
  a clean price or a yield for an OTA, the delivery-versus-payment date, 1 to 30 minutes, the
  requester's SVT, anonymous or not, the curve's reference); my request (the countdown, the
  answers ranked with their allocation, the total, the weighted average price, Confirm selection
  and Cancel request); the board of the other organisations' requests with the answer form (a
  price or a rate, the other worked out, a quantity, an SVT, a validity; Send, Improve, Withdraw);
  today's blotter; the tab bar Trading, Agreements, BEAC reporting, as the mockup.
- RFQ in the menu, after BS (decision 15); "Request a price (RFQ)" on BS and on the bond profile,
  for a BTA or an OTA; the organisation's requests read only for its CEO.
- **Rules**: the selection is the server's: the requester confirms the version shown, or gets the
  new one (409). A responder sees neither the other answers nor their number, nor an anonymous
  requester before the agreement. An organisation does not answer its own requests; a trader
  without a confirmed SVT reads the board only.

## What was built

- **Contract** (`rfqTrading.ts`): the sides, the quote types (`rate`, `price`, `yield`), the
  statuses of a request, an answer and an agreement; `RfqSetupDto` (the BTA and OTA traded, the
  settlement dates, the minimum trading amount, the confirmed SVTs), `RfqPricingDto` (the CMarket
  curve's reference, the latest auction, a quote worked out), `RfqBoardDto`, `RfqRequestDto` (what
  each reader may see), `RfqResponseDto`, `RfqAllocationDto` with its version, `RfqAgreementDto`,
  `RfqRequestSummaryDto`, `RfqBlotterDto`; the inputs; the permissions `rfq:read` and
  `rfq:report`; the routes in `endpoints/rfq.ts` and `/admin/rfq/audit` in `endpoints/admin.ts`;
  the hub's seven trading events in `RfqEventMap`.
- **RFQ** (`pages/rfq`): under the tab bar of the RFQ's screens (`widgets/rfq-tabs`: Trading now,
  Agreements and BEAC reporting once steps 46 and 47 add their screens), the mockup's five panels
  for a Trader or a Manager. "New request" (`features/publish-rfq`): the security (opened on one
  by "Request a price (RFQ)"), the side, the face amount, the quote type of its kind, the
  settlement among the BEAC's next ten business days, 1 to 30 minutes, a confirmed SVT, anonymous
  or not, the curve's reference. "My request" (`widgets/rfq-my-request`): the day's requests, the
  one picked with its countdown (to its end, then to the end of its confirmation), its answers
  ranked with their responders, SVTs, price, rate or yield, quantity, time and face allocated, the
  selection's line ("Automatic selection: 500 M / 500 M · 3 agreements · weighted average price
  100.207 (6.02%)"), "Confirm selection (3 agreements)" at the version shown
  (`features/confirm-rfq`; a 409 says the selection changed and shows the new one) and "Cancel
  request", then its agreements, "Awaiting SVT". The board (`widgets/rfq-board`): the others'
  requests, the anonymous requester hidden, the time each has left, the trader's answer; the
  request picked gets the answer form (`features/answer-rfq`): the value in the request's quote
  type, the other worked out by CMarket as it is typed, the quantity, the SVT, the validity; send,
  then improve (the price kept or bettered) or withdraw. Today's blotter (`widgets/rfq-blotter`).
  "My SVTs" (step 43) in its place. A CEO gets the organisation's requests, read only, and its
  blotter.
- **Real time**: `entities/rfq`'s `useRfqTradingSync`, mounted by the app shell: each event of
  `/hubs/rfq` names what changed and the screens read it again (a responder never receives the
  others' answers); the countdowns follow the server's clock (`shared/lib/serverClock`, moved
  from `entities/svt-link`), and a request's answers are read again when one runs out of
  validity.
- **BS and the bond profile**: "Request a price (RFQ)" on a BTA or an OTA of the BEAC, for a Trader
  or a Manager.
- **AUDT**: "RFQ compliance export" under the entry, for the holder of `rfq:report` (the Admin):
  every event of the RFQ between two days, as CSV (`features/export-rfq-audit`).
- **Slices**: `entities/rfq` (new: the queries, the hub's sync, the server's time each second, a
  status's tone, a price or a rate, a face amount and a countdown as the mockup writes them),
  `entities/session` (RFQ open to `rfq:read`), `entities/svt-link` (the hub open to `rfq:read`),
  `entities/platform-settings` (the export), `shared/config` (the two keys in the RFQ's group), the
  strings in `rfq` (`rfqTrading`), `core` (the panels) and `admin` (the keys).

## CMarket.Api (phase 35, ADR-061)

- The `rfq` schema: `Requests` (a number `RFQ-yymmdd-NNNN`, the requester, its organisation and
  SVT, the security, the side, the face, the quote type, the settlement, the duration, anonymous
  or not, the curve's reference, its times, its status, the selection's version), `Responses`
  (one in force per responder and request), `ResponseVersions`, `Agreements` (the whole model for
  steps 45 to 47: a number `ACC-yymmdd-NNNN`, the request, the answer and its rank, the buyer and
  the seller with their organisations and SVTs, the face, the price, the rate or yield, the accrued
  interest, the settlement amount and date, the status with its dates, the ticket's e-mail
  status) and `RfqAuditLog` (every event to the millisecond, its actor and values; section 10's
  `AuditLog`).
- The selection computed by the server (the best price, the largest quantity, the earliest),
  filled up to the face amount, the last answer in part from XAF 10 million; its version moves
  with each answer sent, improved, withdrawn or expired, and the confirmation names it. A BTA
  priced on 360 days to its maturity, an OTA through the calculator of section 14.1.
- The job `rfq-request-close` every minute: answers past their validity and requests unconfirmed
  10 minutes after their end expire. A day's quota of 10 requests closed without a trade.
- `/hubs/rfq`: the board's group for a trader, its organisation's for a reader of its requests;
  `RfqPublished`, `RfqClosed`, `ResponseReceived`, `ResponseUpdated`, `AllocationChanged`,
  `RfqConfirmed`, `AgreementCreated`.
- The keys `rfq:read` (Trader, Manager, CEO) and `rfq:report` (Admin, kept while the RFQ is off);
  `GET /admin/rfq/audit`.
- The demo (`DemoRfqTrading`), on its two BEAC securities: nine requests over the last three
  sessions in every status, answers in every status, eleven agreements in every status, today's
  four awaiting their SVTs (C. Abena's sale, which her CEO reads; T. Bekale's purchase of the
  mockup, 300, 150 and 50 million of 500). The bond list keeps BS's six bonds.

## Checked

On top of steps 41 to 43 and lane 3's step 42, as `main` stood on 14 November 2026 (the migration
`RfqTrading` made after lane 3's `PortfolioOptimisation`).

- Type check, lint, the 420 unit tests (new: a price or a rate as entered, a face amount and a
  countdown as the mockup writes them, a request's status as of the server's time, RFQ in a CEO's
  menu with `rfq:read`; the routes refreshed from CMarket.Api, its 14 new ones).
- CMarket.Api: 1,713 tests, all passing: 1,680 in the usual run and the SQL Server suite's 33. New:
  the ranking, the allocation (the mockup's 300, 150 and 50 of 500), the quotes (section 14.1's
  4.95 % on 182 days) and the lives of a request, an answer and an agreement in the domain; the
  setup and the pricing, the board without the anonymous requester, a colleague's request read
  and not answered, the ranked answers for the requester and its own for a responder, the 409 of
  a changed selection, the agreements and their amounts, the expiries the job writes, the
  cancellation, the day's quota, the CEO's view, the demo in every status with its blotters, the
  compliance export; over HTTP the contract's names, the keys, a request reaching the board's
  traders on `/hubs/rfq`; the migration on SQL Server (its constraints, the idempotent script,
  down). Two tests that pinned the permissions were brought up to date (the Admin's fourteen keys;
  the CEO's `rfq:read`, taken while the RFQ is off); a test of the demo market's simulator failed
  once in the full run (a round without a trade among its nine securities) and passed three times
  alone: not this step's.
- Every Playwright flow on CMarket.Api from a fresh database: 150, all passing (131 in the usual
  run, the 19 `@fresh-db` ones on a fresh database per spec). Two new: T. Bekale publishes, B.
  Ngoma (whose profile is in French) answers on the board and improves his price, T. Bekale reads
  each change at once and confirms the selection, the agreement awaiting both SVTs, the request
  off B. Ngoma's board and both blotters telling it; E. Fouda reads C. Abena's sale of the
  morning, read only; "Request a price (RFQ)" from BS opens the new request on the OTA; the
  Admin downloads the compliance export from AUDT. The API answered no 5xx. Its log holds two
  errors of the chat hub (a conversation joined after a messaging flow left it) and, in one run of
  the research flows, a hub's connection that failed while it opened, not seen again: the RFQ's
  hub now lets such a connection go quietly.
- axe (WCAG 2.2 AA) at 1600, 390 and 320 px, in English and French, with a request of the
  Trader's open and answered and another organisation's on the board: RFQ with its open request,
  the demo's confirmed one with its agreements, the cancel dialog, the board's answer form, a
  bond's profile with "Request a price (RFQ)" as the Trader; the organisation's requests as the
  CEO; AUDT with its export as the Admin: 42 audits, nothing found.
- Found on the way: SQLite has one schema, where the platform's audit log already holds
  `AuditLog`: the RFQ's is `rfq.RfqAuditLog`. The compliance export, first put in ADMCFG's RFQ
  panel, went to AUDT, where the plan of the back-office screens had it. A CEO reading an open
  request asked for the latest auction with a trader's key: `/rfq/pricing` takes `rfq:read`.

The organisations' own limits (a maximum face per request and per day) are not built: the spec
says each organisation sets them, without a screen nor an endpoint for it (see the
[open questions](../open-questions.md#fourth-version)); the quota of requests closed without a
trade is 10 a day. Concluded agreements feeding the curve above XAF 250 million wait for step 45,
which concludes them.
