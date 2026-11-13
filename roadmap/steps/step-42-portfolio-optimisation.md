# Step 42 · OPT · Portfolio optimisation (screens 28 and 29) (XL): to do

Step 42 of the [roadmap](../../ROADMAP.md#order), for the
[fourth version of the spec](../fourth-version.md).

CMarket.Api's phase 33.

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
