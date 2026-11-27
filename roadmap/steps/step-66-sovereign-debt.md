# Step 66 · DEBT: the sovereign debt (screen 35) (M): done

Step 66 of the [roadmap](../../ROADMAP.md#order), for the
[sixth version of the spec](../sixth-version.md). CMarket.Api's phase 50 (ADR-077).

## Built (27 November 2026)

- **Contract** (`contracts/debt.ts`, `endpoints/market.ts`): `GET /debt/{country}/summary` (the
  outstanding, BTA and OTA, the average maturity and rate, the principal due within 12 months,
  the agencies' ratings or null when hidden), `/redemptions` (the current year's quarters, the
  years, the years beyond; BTA and OTA apart), `/securities`, `/documents` (the ratings with their
  outlooks behind the switch, the state's documents) and `GET /debt/compare`; a country is a
  state's three letters or `CEMAC`. ADMCFG's `sovereignRatings`; a document's `countryCode`;
  IMP's `sovereign-ratings`.
- **CMarket.Api** (phase 50): the debt read from the master's XAF bonds of the six states, the
  auctions that name them and the evening's yields, cached for the day until a publication moves
  them; `ref.SovereignRatings` and `SOVEREIGN_RATINGS`, a row replacing the one of its state,
  agency and day, a rollback putting it back; the platform switch, audited; a document's state;
  the demo's securities issued before CMarket's auctions (20, near the mockup's comparison), run after the other seeders, the
  sovereign issuers of Equatorial Guinea and the CAR, the mockup's ratings as examples with the
  switch on, five documents; migration `SovereignDebt`.
- **Screen**: DEBT (`pages/sovereign-debt`, `widgets/debt-panels`, `entities/debt`), lighting YCRV
  (decision 61): the country bar with "Outstanding at …" and Download (the securities shown, CSV),
  the six indicators, the redemption schedule (BTA amber above OTA, the total over each bar), the
  CEMAC comparison (a row opens its state), the outstanding securities (a double click opens the
  profile; the state's column for the zone), the ratings and the documents (in the PDF viewer).
  `DEBT CMR` from the command bar; ECO's sovereign rates and a state's bond profile ("Sovereign
  debt (DEBT CMR)") open it. ADMCFG's switch under Bonds; NEWS's document form names its state;
  IMP's file. Strings in `debt.json`, English and French.

## Decisions taken while building

- A security of the debt is a state's bond in XAF, not matured: the BEAC's zero coupons are its
  BTAs, every other one an OTA, the listed ones included (the mockup lists ECMR 6.25% among the
  OTAs). A security no auction names counts its amount issued, which the demo's older ones do.
- The yield is the evening's last computed yield, else a BTA's auction rate (the mockup's note);
  the rate a BTA's auctions' average, weighted by their allotments, an OTA's coupon.
- The schedule's bars are all listed, empty ones included: the quarters of the current year from
  the present one, then the six years after, then the rest from the seventh ("2033+").
- The zone (CEMAC) adds the six states up; it has no rating, and its documents are the six
  states'. The comparison lists the six, the largest outstanding first.
- A NEWS document gets a state of its own, chosen in its form (none by default), as an index got
  its own in the fifth version: its source names who wrote it, not what it is about.
- The rating indicator writes S&P / Moody's, as the mockup; "(example)" in its title while the
  demo's examples show; "Hidden" when ADMCFG's switch is off.
- The demo's older securities do not take the names the other screens' flows look for ("OTA CMR
  3 yr", "BTA CMR 26 wk"): they are named as the mockup's ("OTA CMR 6.25% 2023-2028").

## Checked

- CMarket.Api: Domain `SovereignDebtTests` (4) and the suite (740), Application `DebtTests` (2),
  `SettingsAdminTests`' switch and the suite (866), integration `DebtEndpointsTests` and the suite
  (320), architecture (21, the French of the new messages), the migration on SQL Server
  (`SovereignDebtMigrationTests`).
- Web: typecheck, lint, Vitest (577; `debt.test.ts`, `download.test.ts`), `routes.test.ts` on the
  API's refreshed routes; the whole Playwright run (161 of 162, the one left below); `e2e/debt.spec.ts`: `DEBT CMR` from the
  command bar, the indicators, the schedule, the ratings and a document, the comparison opening
  Gabon, the zone, a security's profile and its link back, ECO's link; the Admin hiding the
  ratings in ADMCFG (`@fresh-db`). axe (WCAG 2.2 AA) finds nothing on DEBT (Cameroon and the
  zone), its document dialog, a bond profile and ECO at 1600 and 390 px, in English and in French.

### Found and fixed

- The demo's switch of the ratings wrote ADMCFG's "last changed", which made the administration's
  demo skip its own changes (EODHD's downloads stayed off): it now keeps the last change's author
  and day.
- The demo's first securities took ids the RFQ's demo looks for ("OTA-CM-3Y-…") and numbers that
  filled BS (48 bonds): DEBT's demo runs last, its OTAs named by coupon and maturity
  (`OTA-CM-6.25-2028`), twenty of them; BS lists 31 within its default criteria (15 before), its
  flow and the API's counts updated.

### Left as it was

- `back-office.spec.ts`' CEMAC sovereign yields flow fails when run before the day's session in
  Douala: IMP proposes today's session, while the stored 7-year point is the latest session's, so
  the row is new rather than replacing 6.90%. Older than this step (the run of step 65, in the
  evening, passed it); a question of the flow's date, not of DEBT.
