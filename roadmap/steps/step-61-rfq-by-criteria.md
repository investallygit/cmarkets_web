# Step 61 · RFQ: a request by criteria (screen 22) (L–XL): done

Step 61 of the [roadmap](../../ROADMAP.md#order), for the
[sixth version of the spec](../sixth-version.md). CMarket.Api's phase 46 (ADR-073).

What the client's note of 26 November asks first: "send an RFQ with just the amount and let the
responders suggest the security, price and quantity".

## Built (26 November 2026)

- **Contract** (`contracts/rfqTrading.ts`, `endpoints/rfq.ts`): `RfqMode`, `RfqCriteriaDto` (the
  criteria and the eligible count), `RfqEligibleSecurityDto`; a request, a board row and a summary
  with `mode`, a `security` null by criteria and its `criteria`; an answer's `security`, `yieldPct`
  and `remainingYears`; the selection's `securities` and `averageMaturityYears`, no average price
  by criteria; `yieldPct` on `/rfq/pricing`; `POST /rfq` as a security or by criteria;
  `securityId` on an answer; `GET /rfq/eligible-securities` (the new request's preview, the plan's
  route) and `GET /rfq/{id}/eligible-securities`.
- **CMarket.Api** (phase 46): the request's mode, criteria, countries and eligible list kept at
  publication (none: 409); a purchase only; an answer naming a security of the list, quoted as its
  kind is, its yield worked out and checked (yield, maturity, country) in French and English; the
  answers ranked by yield, an improvement keeping or bettering it, the security changeable; each
  agreement on its answer's security; ten more BEAC securities in the demo (Cameroon, Gabon, Congo,
  Chad), three requests by criteria (one confirmed in two agreements awaiting their SVTs, one open
  with three offers, one on the board); migration `RfqByCriteria`.
- **Screen**: "Request type" in New request (Specific security, By criteria), Sell locked, the
  amount, the optional minimum yield, maximum maturity, countries (CMR to GNQ) and type, the count
  of the securities they accept as they change, Publish off at none; "Eligible securities" in the
  place of "My SVTs" (the preview, then the request's list once published, picked in My request or
  on the board; "Back to my SVTs"); My request's criteria header, eligible count, answers with their
  security, country, maturity, price and yield, the selection's averages; the board's "Security or
  criteria" column ("Criteria: ≥ 6.50% · ≤ 2 yrs · CMR, GAB, COG"); the answer form by criteria (a
  security of the list, its price or rate, the yield's, maturity's and country's checks in green or
  red). Strings in `rfqCriteria.json`, English and French.

## Checked

- CMarket.Api: Domain 722 (`RfqCriteriaTests`, 9), Application `RfqByCriteriaTests` (4) and every
  RFQ class (32), integration 316 (`RfqEndpointsTests` with the criteria's names and routes), SQL
  Server `RfqByCriteriaMigrationTests` (Docker), the message catalogue.
- Web: typecheck, lint, Vitest 554 (`criteria.test.ts`), `routes.test.ts` on the API's refreshed
  routes; every Playwright flow on a fresh database (153), with `e2e/rfq-criteria.spec.ts` (T.
  Bekale publishes, B. Ngoma in French is refused under the minimum then offers, T. Bekale
  confirms); axe on New request by criteria, its preview, My request and the answer form in English
  and French: none.

### Found and fixed

- The demo's RFQ took "the first OTA" of the BEAC: with the new securities, Congo's. It takes
  DemoBonds' OTA and BTA of Cameroon by their ids again.
- A country button read "Cameroon" where it shows "CMR" (axe, label in name): "CMR (Cameroon)".
- An empty table whose headers are wider than its panel scrolled sideways without taking the focus
  (axe, scrollable region): an empty table no longer scrolls sideways (`DataTable`).
- Flows that counted the bonds (BS: 15 by default, 16 after IMP's) or took the first OTA (SVT) or
  the first request shown (SVT: its own is picked) follow the new demo.
