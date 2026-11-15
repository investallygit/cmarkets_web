# Step 49 · The CMarket curve fed by the RFQ agreements (S): done

Step 49 of the [roadmap](../../ROADMAP.md#order), for the
[fourth version of the spec](../fourth-version.md).

Asked on 15 November 2026, once the [lanes](../lanes.md) were done: screen 22's rule "Yield
curve: concluded agreements above XAF 250 million can feed the CMarket curve (Admin option)",
which [step 48](step-48-fourth-version-done.md) left to the spec author, built on the plan
proposed then, [decision 27](../fourth-version.md#decisions-taken), until the author answers.
CMarket.Api's phase 40 (its ADR-066).

## What was built

- **ADMCFG's RFQ panel**: a section "The CMarket curve" between the SVTs' window and the licensed
  SVTs, with the switch "Concluded agreements feed the curve" (off by default) and "From a face
  amount of (XAF)" (250,000,000 by default; XAF 1 million to 10 billion, in whole francs), saved
  with the panel. AUDT words both changes ("RFQ agreements feed the curve: No → Yes", "Curve feed
  from a face of: XAF 250,000,000 → XAF 300,000,000"); the SVTs' window, which step 45 audited
  without a label, reads "SVT approval window". Slices: `features/edit-platform-settings`
  (`RfqSettingsForm`), `entities/audit` (`useAuditText`); the contracts' `RfqAdminSettingsDto`,
  `RfqAdminSettingsInput`, `AUDIT_FIELDS`; strings in `rfq`, `admin`.
- **YCRV** (screen 4): a point the agreements gave reads "Secondary market · RFQ agreement ·
  CMOTA2610283 · 02/11/2026", or "2 RFQ agreements" without a security when theirs differ, where a
  file's point names its source. The curve's other readers (BP's market yield, BS's spreads, the
  RFQ's reference price) read the same points. Slice: `widgets/yield-curves-panel`
  (`lib/pointNote`, with its Vitest); the contract's `CurveSeriesPointDto.agreements`; strings in
  `analysis`.
- **CMarket.Api** (phase 40, ADR-066): the Admin's option and amount on `rfq.RfqSettings`
  (`GET / PUT /admin/rfq/svt`, kept when a PUT leaves them out); `rfq.AgreementCurvePoints`, one
  row per agreement that fed the curve, made with the second SVT's approval, its series, day,
  yield, face and security; the curve merges each series' latest day of the concluded agreements'
  points with the file's points, evicted when one is made or its agreement cancelled; migration
  `RfqCurveFeed`.

## Decision 27: the rules where the spec is silent

- An agreement concluded while the option is on, of at least the amount ("above XAF 250
  million": from it), gives the issuing state's series a point: at the standard tenor nearest the
  security's remaining maturity from the settlement date (a tie to the shorter), on the
  conclusion's day in Douala, at the agreement's yield as the curve reads yields (a BTA's rate
  compounded over its days left, as an auction's; an OTA's yield once a year), typed SECONDARY,
  source CMARKET, its security's ISIN for reference.
- A day's agreements at one tenor make one point, averaged by face. The series' latest point
  stands, whoever gave it: the agreements' day when it is the later, the Data admin's point on
  the same day. The auctions of the last 90 days and the listed bonds' closes keep their places
  before the series (decision 20).
- A cancelled agreement leaves the curve. Turning the option off feeds no new agreement and keeps
  the points given; an amount changed counts from the next conclusion. A point is stale past the
  Admin's age, as every series' point. The series' history (RATES, the Data admin's files and
  coverage) stays the files'.

## Checked

On `main` as step 48 left it (web ac0e6de, API e926fbe).

- Type check, lint, the 451 unit tests (new: a curve point's tooltip line, its agreements or its
  source, in English and French); no file over 700 lines.
- CMarket.Api: 1,814 tests, all passing: 1,775 in the usual run (new: an agreement's point, its
  tenor, yield and day, the option and its bounds; the curve's merge of the agreements and the
  file; the point made at the SVT's approval and taken out by a cancellation, the curves read
  again; the settings' names in the contract, a series point's `agreements`) and the SQL Server
  suite's 39 (new: the migration `RfqCurveFeed`, the settings' row off from 250 million, the
  checks, one point an agreement, its idempotent script, down).
- The usual Playwright flows on CMarket.Api from a fresh database: 137, all passing. New: the
  Admin turns the curve feed on from 300 million, AUDT words both changes, 500,000 is refused,
  then the demo's settings again. The `@fresh-db` flows of the RFQ, its agreements (a
  cancellation among them) and the analysis, each on a fresh database: all passing. The API
  answered no 5xx.
- axe-core (WCAG 2.2 AA) at 1600, 390 and 320 px, in English and French: ADMCFG's RFQ panel at
  "The CMarket curve", and with the amount's error shown, as the Admin; YCRV as the Analyst: 18
  audits, axe finds nothing.
- From the keyboard, Tab from the top of ADMCFG to its end: the switch and the amount are two
  more stops (the page goes round in 499 presses, 497 at step 48), the focus shows at each and
  never sticks.

## Fixed on the way

- CMarket.Api's test of a round of the demo simulator failed once on GitHub (run 53, e926fbe):
  it added up the trades of nine securities, while a round trades one to three picked among all
  the home market's (the BDEAC's and COMPANY X's bonds too). It now reads every security a round
  may trade and wants one whose newest trade changed: 15 runs in a row, all passing. Committed
  on its own, before phase 40.

## Open points

- The spec author's answer (the [open questions](../open-questions.md#fourth-version)): until
  then decision 27 stands.
- The demo starts with the option off, as everywhere. Its series' latest weekly point is dated
  the day the database is seeded, so on that day an agreement concluded with the option on keeps
  its point under the file's; from the next session its point shows on YCRV.
