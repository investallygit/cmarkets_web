# Step 65 · BEAC: monetary policy and liquidity (screen 34) (M–L): done

Step 65 of the [roadmap](../../ROADMAP.md#order), for the
[sixth version of the spec](../sixth-version.md). CMarket.Api's phase 49 (ADR-076).

## Built (27 November 2026)

- **Contract** (`contracts/beac.ts`, `endpoints/market.ts`): `GET /beac/summary` (the latest
  meeting's rates and reserve requirements, the CEMAC's inflation, the next meeting),
  `/beac/rates/history?from=` (the corridor's steps, the rates in force on `from` first),
  `/beac/decisions` (the meetings announced, then the decisions newest first, the change in bp,
  the release as a link or a library document, the summary), `/beac/operations`,
  `/beac/interbank` (the latest week, the changes from the week before), `/beac/aggregates`; each
  says whether what it shows is the demo's illustrative history; `BeacDecisionPublished` on
  `/hubs/market`; IMP's `beac-policy`, `beac-operations`, `interbank-rates` and
  `monetary-aggregates`.
- **CMarket.Api** (phase 49): `mkt.BeacPolicyRates` (a meeting once by its day, its corridor in
  order, the reserves only with the rates), `mkt.BeacOperations`, `mkt.InterbankRates`,
  `mkt.MonetaryAggregates`; the four files, each row replacing the one of its key and a rollback
  putting it back; a meeting's policy rate and marginal lending facility written to
  `mkt.PolicyRates`, which MKT reads; the demo's meetings since 2019 as the mockup's chart, the
  next one announced, half a year of tenders and interbank weeks up to the latest session, the
  aggregates of 2026, all marked illustrative; migration `BeacMonetaryPolicy`.
- **Screen**: BEAC (`pages/beac-monetary-policy`, `widgets/beac-panels`, `entities/beac`), lighting
  YCRV (decision 61): the six indicators, the corridor since 2019 as steps run on to today, the
  decisions (a cut green, a hike red; the release in the PDF viewer or by its link; a meeting
  picked shows its summary), the injections (whether the latest demand was above the offer), the
  interbank market's latest week and the aggregates. ECO's sovereign rates and MKT's policy rates
  (double click) open it. IMP's four files. Strings in `beac.json`, English and French.

## Decisions taken while building

- MKT reads `mkt.PolicyRates`, ECO does not: a meeting writes the policy rate and the marginal
  lending facility there, and the demo's fixture of two rates gives way to the meetings' history
  (MKT shows 4.50% and 6.00%, the BEAC mockup's, rather than screen 1's 5.00% and 6.75%).
- The release is an https link or the id of a library document (the demo's latest meeting has
  the library's "BEAC decision — policy rates"); the file carries its summary, which the screen
  shows for the meeting picked: the spec's "one-click release summary".
- The alert on a decision is the calendar alert of step 67 (decision 57 lists "BEAC MPC
  decisions" among its types); this step publishes `BeacDecisionPublished`, which BEAC and MKT
  read again on.
- The meetings and the aggregates of the demo keep the mockup's dates (they are past); the next
  meeting is the mockup's 18 November 2026, or two weeks after the latest session once that day is
  past; the tenders and the interbank weeks run up to the latest session.
- The CEMAC's inflation shows amber above the 3% convergence ceiling, as the mockup's 3.8%.

## Checked

- CMarket.Api: Domain `BeacFilesTests` (3) and the suite (736), Application `BeacTests` (3) and
  the suite (863), integration `BeacEndpointsTests` and the suite (319), architecture (21, the
  French of the new messages), the migration on SQL Server (`BeacMonetaryPolicyMigrationTests`).
- Web: typecheck, lint, Vitest (573; `figures.test.ts`, `corridor.test.ts`), `routes.test.ts` on
  the API's refreshed routes; the whole Playwright run (161); `e2e/beac.spec.ts`: BEAC from ECO, the indicators, the corridor, the
  decisions, a summary and a release, the injections, the interbank market, the aggregates, MKT's
  policy rate opening BEAC; a meeting published on IMP shown on BEAC and MKT (`@fresh-db`). axe
  (WCAG 2.2 AA) finds nothing on BEAC, its release dialog and ECO at 1600 and 390 px, in English
  and in French.

### Found and fixed

- A check constraint compared with a NULL is unknown, which SQL Server lets pass: the corridor
  and the reserves name each rate not null.
- The release's "PDF" button was named "Release of the meeting of …", which does not hold the
  word it shows (axe, label in name): "PDF of the release of …".
