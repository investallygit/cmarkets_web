# Step 42 · OPT · Portfolio optimisation (screens 28 and 29) (XL): done

Step 42 of the [roadmap](../../ROADMAP.md#order), for the
[fourth version of the spec](../fourth-version.md).

CMarket.Api's phase 33. Lane 3 of the [lanes](../lanes.md), its first step.

- **Setup** (screen 28): the universe (2 to 20 equities, bonds and ETFs, searched or taken from a
  portfolio or a watchlist, each with its type, an expected return the user may change, its
  volatility and its minimum and maximum weights), one of four objectives, the constraints (per
  security, asset class, country or currency), the capital, the history of the estimates and the
  risk-free rate, the correlations changed cell by cell, and the checks before a run.
- **Result** (screen 29): the indicators; the allocation with each weight, amount and share of the
  risk ("max" or "min" where a limit binds); the efficient frontier with the securities, the
  optimum, equal weights and an existing portfolio (a click on the curve computes that point); the
  breakdown by class, country and currency; the binding constraints and the comparison; then Save
  as a model portfolio, Create a portfolio, the trades that adjust an existing one, the XLSX and
  PDF export. A scenario is saved, opened again, duplicated and computed again on today's data.
- OPT in the menu, after PORT (decision 15); "Optimise" on PORT and on a watchlist; "not
  investment advice" on both screens. A Student saves an allocation as a model portfolio only.
- **CMarket.Api**: section 14.6 in `CMarket.Domain`: the estimates (weekly returns over the
  history chosen, a bond's yield to maturity, the covariance in XAF shrunk towards a constant
  correlation, a security quoted too seldom flagged), the solver (decision 23) checked on the
  spec's test case, amounts rounded to whole securities with the rest in cash, under 2 seconds for
  20 securities; `pf.OptScenarios` and its results.

## What was built

- **Contract** (`optimizer.ts`, `endpoints/optimizer.ts`): `OptEstimatesDto` (each security's
  class, issuer's country or ETF's market, currency, expected return, volatility, yield, modified
  duration, unit price in XAF, observations, missing weeks, flags `shortHistory`, `illiquid`,
  `converted`, `noPrice`; the correlations, the shrinkage, the data date, R_f); `OptSetupDto` (the
  universe with what the user entered, the objective and its target, the maximum per security,
  the group constraints, the correlations entered, the capital, the history, R_f, the portfolio
  compared); `OptCheckDto` (feasible, the reachable returns and risks, the items with the
  constraints involved, `OptConstraintRefDto`); `OptResultDto` (indicators, lines, cash, frontier,
  breakdown, binding constraints); the scenarios, `OptToPortfolioDto`, `OptRebalanceDto`; the
  twelve routes of section 10; the permission `portfolios:optimize` (decision 18).
- **OPT** (`pages/portfolio-optimisation`, `widgets/opt-setup-panels`): the tab bar OPT Setup ·
  OPT RES Result; the scenario bar (open one of the user's, save it again on today's data, save a
  copy, delete, start a new setup; `/opt?scenario=`); panel 1, the universe: the search of
  equities, bonds and ETFs, "From a portfolio" and "From a watchlist", each security's code, type
  in its colour, expected return and volatility (the estimate shown, a value entered in amber and
  kept), its bounds, a warning on a short history, a security quoted too seldom or without a
  price, where the estimates come from; panel 2: the four objectives with their target, the
  constraints (100% invested and no short sale shown as rules, decision 25; the maximum per
  security; each security's own bound and each group's total, changed or removed; "+ Add a
  constraint" on a security, a class, a country or an ETF's market, a currency), the capital, the
  history (1, 3 or 5 years, weekly or daily), the risk-free rate (the Admin's shown), the
  portfolio to compare with, OPTIMISE; panel 3, the correlations (the brighter the cell, the
  closer the securities, in two contrast-safe bands; a cell edited on a click, taken back with
  Delete; the shrinkage said); the pre-run checks, asked once the typing pauses, which name the
  constraints in conflict and the reachable returns and hold OPTIMISE back.
- **OPT RES** (`widgets/opt-result-panels`): the objective, the securities, the constraints and
  the time taken, the data date, "Recompute on today's data" on a saved scenario, a warning once
  the setup changed since; the six indicators; the allocation (weight and bar, whole securities,
  amount, risk share, "max" or "min", the cash the rounding leaves, the totals); the efficient
  frontier (the curve's 25 points, the securities in their class's colour, the optimum, equal
  weights, the portfolio compared), a point of the curve clicked or picked in its list computes
  that allocation; the breakdown by class with its limits, by country or by currency; the binding
  constraints and the comparison; the next steps: a model portfolio, a portfolio (the scenario
  saved first when it is not), the trades that adjust a portfolio, the XLSX or PDF export, back to
  the setup.
- **PORT and MKT**: "Optimise" in PORT's header opens OPT on the portfolio's lines, the portfolio
  compared; a watchlist of two securities or more has "Optimise" in its title bar.
- **The menu** (decision 15): OPT after PORT; `OPT` and `OPT RES` in the command bar.
- **Slices**: `pages/portfolio-optimisation`, `widgets/opt-setup-panels`,
  `widgets/opt-result-panels`, `entities/optimizer` (the queries, the store the two screens
  share, the setup's pure rules, the words of a constraint), `features/import-opt-universe`,
  `run-optimization`, `save-opt-scenario`, `create-portfolio-from-allocation`,
  `rebalance-portfolio`, `export-opt-scenario`; `widgets/portfolio-header` and
  `widgets/watchlist-panel` (Optimise); the strings in a new area, `optimizer`, and in `core`
  (the screens, the panels) and `admin` (the permission).

## CMarket.Api (phase 33, ADR-059)

- Section 14.6 in the domain: `InteriorPointSolver` (a dense primal-dual method with Mehrotra's
  predictor-corrector, decision 23); `MeanVarianceOptimizer` (A, B by bisection, C by the change
  of variable, D, the frontier, the constraints in conflict by their least violation, those that
  bind); `OptFigures` (return, volatility, Sharpe, risk shares, VaR); `ReturnEstimator` and
  `LedoitWolf` (weekly or daily returns in XAF at the ECB's rates, the shrinkage towards the
  constant correlation, illiquid and short histories).
- `pf.OptScenarios`, `pf.OptScenarioSecurities`, `pf.OptResults` (migration
  `PortfolioOptimisation`); the twelve routes under `portfolios:optimize` and the Portfolio
  module; a scenario computed by the server when saved; a model or a real portfolio made of an
  allocation within the portfolio quota; the trades from the ledger's holdings at the optimiser's
  prices; the workbook and the PDF.
- The demo: each demo Student, Analyst, Manager and Trader has "CEMAC balanced", the test case of
  the spec with the mockup's figures, compared with their first portfolio.

## Checked

- Type check, lint, the 413 unit tests (14 new: a security added once, 20 at most, taken away
  with the correlations entered with it; one correlation a pair, within -1 and 1; the mockup's
  seven constraints counted as the result counts them; a group whose limits are cleared dropped;
  a setup checked once it has two securities and its target; the grid's short codes; a result
  stale once the setup changes; a scenario opened with its labels, unsaved once deleted; the two
  contrast-safe bands of the correlation cells; the frontier's round ticks and the point nearest
  a click); the menu's test with OPT after PORT and OPT RES out of the menu.
- CMarket.Api: 1,681 tests, all passing: 1,649 in the usual run and the SQL Server suite's 32.
  New: 38. The solver on section 14.6's test case (8.00% for 5.40%, Sharpe 0.65, VaR 0.56%;
  equal weights 8.74% for 7.84%), B, C, D, the frontier, the highest return (9.015%), the
  conflicts, twenty securities with the four problems and the frontier under 2 seconds; the
  estimates (weekly returns, quiet weeks, short histories, the shrinkage). The use cases on the
  demo's market: the test case, its constraints named with their percentages, the four
  objectives, a point of the frontier, a target out of reach, the missing estimates, the
  scenarios and their versions, a model and a real portfolio, a Student's model only, the trades,
  the export. The routes over HTTP. On SQL Server, every migration from an empty database with
  the demo's scenarios, and two of the new CHECKs.
- Every Playwright flow on CMarket.Api from fresh databases: 142, all passing. Three new: OPT
  opens the demo's scenario and optimises it into the mockup's result (8.00%, 5.40%, Sharpe 0.65,
  GAB at its maximum, the target met exactly, the portfolio compared); a point of the frontier
  saved as a model portfolio that PORT opens; PORT's "Optimise" on the portfolio's lines, then a
  conflict the checks name, OPTIMISE held back. Then on `main` with steps 41 and 43: the
  migration made again after `Commodities` and `SvtAccounts`; the shared flows again, 128, the
  menu with CMDTY after MKT and OPT after PORT; no server error in the API's log.
- axe (WCAG 2.2 AA) at 1600, 390 and 320 px, in English and French: the setup, a constraint being
  added, a correlation being edited, the result, the dialogs of the model portfolio, the trades
  and the export: 42 audits, nothing found. The screenshots showed "From a watchlist" past the
  edge of its title bar on a phone: the universe's options now wrap like every panel's.
- Fixed by the checks: the constraints were named at a hundred times their value ("at least
  800.00%"), the API taking a percentage for a fraction; a portfolio made from an allocation
  opened PORT on the first portfolio until the list came back, now in PORT's list at once; the
  returns' frequency had the history's name for a screen reader; a run of a few milliseconds
  read "0.0 s"; the frontier's return axis went by 2 points from 5.7% to 12%, now by 1.

## Still to do

- PORT values a line quoted in dollars (IWDA) without its exchange rate: a real portfolio made
  from an allocation holds francs and euros only meanwhile (decision 25), an open question.
