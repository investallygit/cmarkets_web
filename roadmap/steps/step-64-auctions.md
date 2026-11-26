# Step 64 · AUC: the BTA and OTA auctions (screen 33) (L): to do

Step 64 of the [roadmap](../../ROADMAP.md#order), for the
[sixth version of the spec](../sixth-version.md). CMarket.Api's phase 48 (ADR-075).

- **Contract**: `GET /auctions/summary`, `/auctions?status=done|planned&country=&type=&from=&to=`
  (the security, the value date, the change from the previous), `/auctions/{id}` (the bids by
  rate, the bidders), `/auctions/rates?tenor=&countries=`, `/public-offers`;
  `AuctionResultPublished`.
- **CMarket.Api**: `mkt.Auctions` with the security, the status, the value date, the method and the
  bidders, `mkt.AuctionBids`, the public offers (decision 58); IMP's `AUCTION_CALENDAR` and
  `AUCTION_RESULTS` (the old `AUCTION` read as the latter), a result completing its planned row,
  creating its BTA in the master, feeding the curve and the `auction` alerts as now; CORR's public
  offers; the demo's 24 months of auctions in the six countries, the mockup's included. A migration.
- **Screen**: AUC with its tabs (AUC, AUC NEXT, APE), the indicators, the latest results (the
  filters, Download), the 52-week BTA average rate by country, an auction's bids by rate with the
  marginal cut-off, the coming auctions; a row opens the security's history. YCRV's auctions panel
  and the bond profile link to it; the codes AUC, AUC NEXT, APE (decision 61). DL's datasets gain
  the auctions if the catalogue allows them.
- **Checked by**: Vitest on the cover and the changes; a Playwright flow (an `AUCTION_RESULTS`
  upload `@fresh-db` that fills a planned auction and shows on AUC); axe in both languages.
