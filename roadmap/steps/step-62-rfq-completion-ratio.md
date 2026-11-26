# Step 62 · RFQ: the completion ratio (screens 22, 10, 27) (L): to do

Step 62 of the [roadmap](../../ROADMAP.md#order), for the
[sixth version of the spec](../sixth-version.md). CMarket.Api's phase 47 (ADR-074).

The client's note's second request: "a ratio representing the number of RFQs completed by the
user".

- **Contract**: `CompletionDto` (the ratio, the cases, "new" under 5, the withdrawal rate) for a
  role; `GET /rfq/participants/{orgId}/completion?period=` with both roles, the failures and their
  causes; the organisation's completion on the board's rows and the answers of `GET /rfq/{id}`, the
  trader's in the blotter; `minResponderCompletion` and `excludeNewcomers` on `POST /rfq`; the
  disputes and the Admin's neutralisation (decision 54); the window in the RFQ settings.
- **CMarket.Api**: `rfq.CompletionEvents` written when a case's outcome is known (a request ended,
  an agreement concluded, rejected, expired or cancelled; decision 51), the ratios counted over
  the window (decision 52), cached and evicted by an event; the responders under the requester's
  threshold refused; the disputes, their files, the neutralisation in AUDT, the notifications;
  `RfqCompletionChanged` on `/hubs/rfq`; the demo's six months of cases (decision 55). A
  migration, its SQL Server test.
- **Screens**: the "Completion" column of the answers, the requester's ratio on the board (the
  organisation's, an anonymous one unnamed, decision 53), "My completion" as requester and
  responder in the blotter, the "Minimum responder completion" field (and excluding the new); the
  ratio's detail (the cases, the failures by cause, the withdrawals, Dispute); NET's profile of a
  Trader or a Manager; the SVT's linked traders; the Admin's RFQ screen (the disputes, Neutralise);
  ADMCFG's window.
- **Checked by**: Vitest on the display (colours, "New (n)") and the counting rules on the API's
  side (each case of section 9's table, the neutral ones, the withdrawals); a Playwright flow (a
  threshold refusing a responder, a dispute neutralised by the Admin); axe in both languages.
