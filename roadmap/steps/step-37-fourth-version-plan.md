# Step 37 · The plan (S): done

Step 37 of the [roadmap](../../ROADMAP.md#order), for the
[fourth version of the spec](../fourth-version.md).

The fourth version is now `CMarket-developer-spec-EN.pdf` and the third `-v3.pdf`;
[what it changes and the decisions taken](../fourth-version.md), the [order](../../ROADMAP.md#order)
of its steps, the status of the screens to come in the README, the
[open questions](../open-questions.md#fourth-version) of the fourth version, and the same plan in
CMarket.Api's `docs/PLAN.md` (its phases 29 to 38). Each step still writes its contract first
(`shared/api/contracts` and `shared/api/endpoints`, from spec section 10), CMarket.Api serves it,
then the screen is built on the API and checked by its Playwright flow and axe. The market data
comes first (steps 38 to 41), then the optimisation (step 42): they wait for no answer. The RFQ
(steps 43 to 47), about half of the work, comes last, which leaves the spec author time to answer
its points to confirm.

The spec's test case of section 14.6 was recomputed from the correlations of the screen 28 mockup:
its weights give a return of 8.01%, a volatility of 5.41%, a Sharpe ratio of 0.65 and a VaR of
0.56%, and equal weights 8.74% and 7.84%, as it expects.
