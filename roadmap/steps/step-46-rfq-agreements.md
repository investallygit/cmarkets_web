# Step 46 · RFQ AGR · Agreements (screen 23) (L): to do

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
