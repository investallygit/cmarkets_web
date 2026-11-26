# Step 65 · BEAC: monetary policy and liquidity (screen 34) (M–L): to do

Step 65 of the [roadmap](../../ROADMAP.md#order), for the
[sixth version of the spec](../sixth-version.md). CMarket.Api's phase 49 (ADR-076).

- **Contract**: `GET /beac/summary`, `/beac/rates/history`, `/beac/decisions`, `/beac/operations`,
  `/beac/interbank`, `/beac/aggregates`; `BeacDecisionPublished`.
- **CMarket.Api**: `mkt.BeacPolicyRates` (the MPC's decisions, beside the `mkt.PolicyRates` that
  ECO and MKT read, decision 59), `mkt.BeacOperations`, `mkt.InterbankRates`,
  `mkt.MonetaryAggregates`; IMP's `BEAC_POLICY`, `BEAC_OPERATIONS`, `INTERBANK_RATES` and
  `MONETARY_AGGREGATES`; a decision published alerts and changes the calendar; the demo's
  illustrative history since 2019. A migration.
- **Screen**: BEAC, the six indicators, the rate corridor as steps, the MPC's decisions with their
  releases, the injections, the interbank rates, the aggregates; ECO links to it. A new alert on
  the MPC's decisions (with step 67's calendar alerts).
- **Checked by**: Vitest on the decision's change in bp; a Playwright flow (a `BEAC_POLICY` upload
  `@fresh-db` shown on BEAC and ECO); axe in both languages.
