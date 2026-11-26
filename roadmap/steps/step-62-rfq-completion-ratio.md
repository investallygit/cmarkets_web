# Step 62 · RFQ: the completion ratio (screens 22, 10, 27) (L): done

Step 62 of the [roadmap](../../ROADMAP.md#order), for the
[sixth version of the spec](../sixth-version.md). CMarket.Api's phase 47 (ADR-074).

The client's note's second request: "a ratio representing the number of RFQs completed by the
user".

## Built (26 November 2026)

- **Contract** (`contracts/rfqCompletion.ts`, `endpoints/rfq.ts`, `endpoints/admin.ts`):
  `RfqCompletionDto` ("96% (48)", or "New (3)" under 5 cases) and its pair (requester,
  responder); the requester's organisation's on each board row (`requesterCompletion`, with the
  request's threshold and `completionAllows`), the reader's organisation's as a responder on the
  board, each answer's responder's in `GET /rfq/{id}`, "My completion" in the blotter, a Trader's
  or a Manager's organisation's on NET's profile and on the SVT's linked traders;
  `minResponderCompletion` and `excludeNewcomers` on `POST /rfq`;
  `GET /rfq/participants/{orgId}/completion?period=&traderId=` (both roles, the cases by cause,
  the withdrawal rate, the organisation's own cases), `POST /rfq/completion/{caseId}/disputes`
  (multipart: a reason, up to three files); the Admin's `/admin/rfq/completion/participants`,
  `participants/{orgId}`, `disputes`, `disputes/{id}/files/{index}`, `{caseId}/neutralize` and
  `disputes/{id}/reject`; `completionWindowMonths` in the RFQ settings; `RfqCompletionChanged` on
  `/hubs/rfq`; AUDT's `rfq-case-neutralize`, `rfq-dispute-reject`, the target `rfqCase` and the
  field `completionWindow`.
- **CMarket.Api** (phase 47): `rfq.CompletionEvents` written by a ledger from a request's rows
  after each change that makes an outcome known (a request cancelled or expired, an agreement
  decided by the SVTs or cancelled after its conclusion), once per case and rewritten in place;
  the ratios counted over the window when read; the threshold refusing a responder (403) in its
  words; the disputes and their files (`rfq.CompletionDisputes`), the Admin's neutralisation and
  refusal in AUDT, the participant notified in its language; the demo's cases of its own requests
  and six months of past cases (T. Bekale 94% (32) as a requester, 97% (61) as a responder,
  Pension fund G 96%, the asset manager 64% as a requester), one of C. Abena's failures disputed;
  migration `RfqCompletionRatio`.
- **Screens**: RFQ's board "Requester · completion" ("Anonymous · 93%"); My request's
  "Completion" column, its threshold and a note that the ratio ranks nothing; New request's
  "Minimum responder completion" (optional) and "Exclude new profiles"; the answer form locked
  below a threshold, in its words; the blotter's "My completion · requester / responder" (the
  organisation's for its CEO), each opening the ratio's detail: both roles, the cases by cause,
  the withdrawal rate, the failures and neutral cases, Dispute (a reason, up to three files); NET's
  profile of a Trader or a Manager; the SVT's linked traders (two columns); ADMCFG's window (1 to
  24 months); RFQ CPL, a new Admin screen under the RFQ's tabs: the disputes (the evidence,
  Neutralise or Turn down with a reason), every participant's ratios and the cases of the one
  picked, a failure neutralised without a dispute. Strings in `rfqCompletion.json`, English and
  French; the percent written "93 %" in French.

## Decisions taken while building

- A valid answer (decision 51) is one not withdrawn: an answer that ran out of validity before the
  requester let its request expire still counts the request as the requester's failure.
- The case's outcome is written from the rows (the request, its answers, agreements and approvals)
  by one ledger, after the change is saved, rather than at each step: the rules live in one place
  (`RfqCompletionCases`), and a case is rewritten when its rows change (a concluded agreement
  cancelled by both), a neutralisation kept.
- The withdrawal rate counts the answers sent over the window from `rfq.Responses`: the demo's past
  cases have none.
- The Admin's screen for the disputes is RFQ CPL (no mockup), beside RFQ AGR and RFQ REP.

## Checked

- CMarket.Api: Domain `RfqCompletionTests` (7), Application `RfqCompletionTests` (5) and the whole
  suite (857), integration, architecture, the message catalogue, the migration on SQL Server
  (`RfqCompletionMigrationTests`).
- Web: typecheck, lint, Vitest 556 (`completion.test.ts`), `routes.test.ts` on the API's refreshed
  routes; `e2e/rfq-completion.spec.ts` (T. Bekale's blotter and detail, a failure disputed, a 99%
  threshold keeping B. Ngoma out in French, the Admin neutralising the case on RFQ CPL); the whole
  Playwright suite on a fresh database (154 of 158 at first: three fixed below, and `admin` timed
  out on a toast; the four pass again).
- axe (WCAG 2.2 AA) finds nothing, in English and in French, on RFQ (the board, the blotter, the
  ratio's detail, the dispute dialog), NET's profile, the SVT's linked traders, RFQ CPL and its
  decision dialog, ADMCFG.

### Found and fixed

- After a dispute is sent, the ratio's detail comes back with the case marked disputed: the flow
  closes it before going on.
- The blotter's "My completion" buttons: their accessible name now starts with their label (the
  term and the ratio), and they are 24 px high.
- The flows that read the board's rows, the ranked answers and the criteria's ranking expect the
  ratio beside each requester and responder (`rfq-trading`, `rfq-criteria`).
- `svt-approval`: its "OK" check reads B. Ngoma's agreement, since step 61's demo agreement by
  criteria with E. Tchakounté through Bank E takes most of that bank's limit.
