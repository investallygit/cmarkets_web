# Step 61 · RFQ: a request by criteria (screen 22) (L–XL): to do

Step 61 of the [roadmap](../../ROADMAP.md#order), for the
[sixth version of the spec](../sixth-version.md). CMarket.Api's phase 46 (ADR-073).

What the client's note of 26 November asks first: "send an RFQ with just the amount and let the
responders suggest the security, price and quantity".

- **Contract**: `RfqMode` (`security` or `criteria`) on the request; `POST /rfq` with `mode`,
  `faceAmount` and the optional `minYield`, `maxMaturityYears`, `countries`, `securityTypes`, the
  security and the quote type only for a specific request; `GET /rfq/{id}/eligible-securities`
  (the security, its country, its remaining maturity, its last computed yield); the answer's
  `securityId`, its computed yield and remaining maturity; the board's criteria and the
  selection's average yield and maturity. `routes.test.ts` against the API's OpenAPI.
- **CMarket.Api**: `rfq.Requests` with a nullable security, its criteria and a table of the
  eligible securities kept at publication (decision 49); `rfq.Responses` with their security;
  ranking by yield then quantity then time (decision 50), the selection's weighted averages; the
  answer's checks (yield, maturity, country) on the server, in French and English; the agreement
  on the answer's security. The demo: a request by criteria open on the board and one of the
  mockup's, confirmed with its three agreements. A migration, its SQL Server test.
- **Screen**: "Request type" (Specific security, By criteria) in "New request", Sell locked by
  criteria, the optional fields with "An empty field = no constraint"; "My request" by criteria
  (its criteria in the header, the eligible count, the answers with their security, country,
  maturity, price, yield, quantity and allocation; the selection's agreements, securities and
  averages); the "Eligible securities" panel in the right-hand column while a request by criteria
  is picked (the requester's or the one answered); the board's "Security or criteria" column; the
  answer form with the eligible list only, the yield worked out at each keystroke and the three
  checks in green or red. In French and English.
- **Checked by**: Vitest on the form's rules and the checks; a Playwright flow (a request by
  criteria published by one trader, answered by two others on two securities, confirmed in two
  agreements); axe in both languages; the API's suites with the mockup's case (6.60%, 2.4 years).
