# Step 44 · RFQ · Government securities RFQ (screen 22) (XL): to do

Step 44 of the [roadmap](../../ROADMAP.md#order), for the
[fourth version of the spec](../fourth-version.md).

CMarket.Api's phase 35. Lane 1 of the [lanes](../lanes.md), once step 43 is on `main`. It sets
the agreement's whole model (section 10's columns of `rfq.Agreements`, every status, demo
agreements in each), on which steps 46 and 47 start.

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
- **CMarket.Api**: the `rfq` schema; the ranking (the best price, the largest quantity, the
  earliest answer) and the allocation (in that order up to the face amount, the last answer in
  part, down to the minimum trading amount of XAF 10 million); a request without confirmation
  expires 10 minutes after its end; each answer selected makes an agreement that waits for its
  SVTs; a BTA priced by section 14.1, an OTA by BP's engine; every event stamped to the
  millisecond and kept five years, with the compliance export (`/admin/rfq/audit`); the hub's
  `RfqPublished`, `RfqClosed`, `ResponseReceived`, `ResponseUpdated`, `AllocationChanged`,
  `RfqConfirmed` and `AgreementCreated`.
