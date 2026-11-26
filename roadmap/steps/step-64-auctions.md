# Step 64 · AUC: the BTA and OTA auctions (screen 33) (L): done

Step 64 of the [roadmap](../../ROADMAP.md#order), for the
[sixth version of the spec](../sixth-version.md). CMarket.Api's phase 48 (ADR-075).

## Built (27 November 2026)

- **Contract** (`contracts/auctions.ts`, `endpoints/bonds.ts`, `endpoints/dataAdmin.ts`):
  `GET /auctions?status=done|planned&country=&type=&from=&to=` (a result's security, value date,
  bidders and change from the previous auction of the same security; a planned auction with its
  amount offered alone), `/auctions/summary?year=&country=&type=`, `/auctions/{id}` (the bids by
  rate, those allotted marked), `/auctions/rates?tenor=&countries=` (24 months, a gap for a month
  without an auction), `/public-offers`; the Data admin's `POST`, `PUT` and `DELETE
/data/public-offers`; `AuctionResultPublished` on `/hubs/market`; IMP's `auction-calendar`.
- **CMarket.Api** (phase 48): `mkt.Auctions` gains the security, the value date and the bidders,
  `mkt.AuctionBids` the bids by rate, `mkt.PlannedAuctions` the Treasuries' calendars,
  `mkt.PublicOffers` APE's issues; `AUCTION_CALENDAR` plans an auction, `AUCTION_RESULTS` (the
  auctions file, three columns more) completes it, links the master's BTA or OTA and creates a
  BTA the master lacks, a rollback undoing all three; the demo's two years of results in the six
  states before screen 4's, older than the curves' 90-day window, their bids, bidders and value
  dates, eight coming auctions and four public issues marked "(example)"; migration
  `AuctionsMarket`.
- **Screens**: AUC (`pages/auction-market`, `widgets/auction-market`), its tabs AUC, AUC NEXT and
  APE (codes of their own, lighting YCRV, decision 61), the filters (state, type, year,
  Download), the indicators, the latest results, the average rate of a tenor by state, the
  detail of the picked result (its bids by rate in a chart, amber up to the marginal rate, and
  its figures), the coming auctions; AUC NEXT's full list; APE's issues. CORR's "Public bond
  issues (APE)" (`widgets/public-offer-editor-panel`, `features/edit-public-offer`). YCRV's
  auctions panel ("All auctions (AUC)") and a BEAC bond's profile ("Auctions of this security")
  open AUC on their state. IMP's "Auction results" and "Auction calendar". Strings in
  `auctionMarket.json`, English and French.

## Decisions taken while building

- The planned auctions have a table of their own, which the result names (decision 58 updated):
  the results keep their figures required, so the curve, the alerts, CAL and the RFQ read them
  unchanged.
- The bids by rate are a column of `AUCTION_RESULTS`, "rate:amount" pairs split by bars (a CSV's
  cells are split by semicolons); a file without them keeps those published before.
- A result creates its BTA in the master when none of its state, kind and maturity exists, zero
  coupon, its amount the allotted; an OTA is only linked, its coupon not being in the result.
- The demo's history stops 91 days before the latest session, out of the curves' window: YCRV,
  BP and the RFQ read the same curves; screen 4's auctions stay the latest. The AUC mockup's
  figures are fictitious (it says so) and are not the demo's.
- Neither the mockup nor the files give an auction's method: none is kept. The next auction shows
  its day, the calendar file giving no time.
- AUC, AUC NEXT and APE have the audience of ECO (`market:read`, the monitoring module).

## Checked

- CMarket.Api: Domain `AuctionMarketTests` (4) and the suite (733), Application
  `AuctionMarketTests` (3) and the suite (860), integration `AuctionEndpointsTests` and the suite
  (318), architecture (21, the French of the new messages), the migration on SQL Server
  (`AuctionsMarketMigrationTests`).
- Web: typecheck, lint, Vitest (568; `figures.test.ts`, `amounts.test.ts`, `offerForm.test.ts`),
  `routes.test.ts` on the API's refreshed routes; the whole Playwright run, then the `@fresh-db`
  flows of AUC, CAL and SVT approval each on a fresh database; `e2e/auctions.spec.ts`: AUC from CAL's auctions
  panel on Cameroon, the indicators, the 5-year OTA's bids and rates, AUC NEXT and APE; CORR's
  public issue entered, listed on APE and deleted; a calendar and its result loaded on IMP
  (`@fresh-db`). axe (WCAG 2.2 AA) finds nothing on AUC, AUC NEXT and APE at 1600 and 390 px, nor on
  CORR and its dialog, in English and in French.

### Found and fixed

- `GET /auctions` declared twice in the API module (the results and the planned): one route,
  `status=planned` read as the planned auctions.
- A publication of auction results now creates its BTAs in the master, which BS lists: the IMP
  flow of `back-office.spec.ts` rolls its publication back at its end, and BS counts the demo's
  15 bonds again.
- CAL's results gained the demo's history: its `@fresh-db` flow reads the first rows only.
- SVT approval's flow used up Bank E's limit after the RFQ flows of steps 61 and 62: `@fresh-db`.
- A button in the results' security cell fell short of the 24 px target (axe): the row selects,
  by click and by the arrows.
- The `@fresh-db` results upload waited behind the demo's pending results of the session, which
  it now discards first; the bids by rate are separated by `|`, since `;` splits the CSV.
