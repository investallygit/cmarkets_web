# Step 45 · SVT · SVT approval (screen 27) (XL): to do

Step 45 of the [roadmap](../../ROADMAP.md#order), for the
[fourth version of the spec](../fourth-version.md).

CMarket.Api's phase 36. Lane 1 of the [lanes](../lanes.md), once step 44 is on `main`.

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
