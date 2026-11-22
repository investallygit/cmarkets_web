# Step 53 · The plan (S): done

Step 53 of the [roadmap](../../ROADMAP.md#order), for the
[fifth version of the spec](../fifth-version.md).

The fifth version is now `CMarket-developer-spec-EN.pdf` and the fourth `-v4.pdf`;
[what it changes and the decisions taken](../fifth-version.md) (38 to 45), the
[order](../../ROADMAP.md#order) of its steps, a note under each screen it changes or adds, the
status of the screens to come in the README, the
[open questions](../open-questions.md#fifth-version) of the fifth version, and the same plan in
CMarket.Api's `docs/PLAN.md` (its phases 42 to 45). Each step still writes its contract first
(`shared/api/contracts` and `shared/api/endpoints`, from spec section 10), CMarket.Api serves it,
then the screen is built on the API and checked by its Playwright flow and axe.

The steps run in one lane, in this order: DES at the fixing first (step 54), since it changes
what every screen's quotes do and makes the description panel and the table of recent sessions
the index profile reuses; BP's curves (step 55), which wait for nothing; the index profile
(step 56); the data download last (step 57), whose datasets and buttons read the three others.

Section 14.1's two new test cases were recomputed on test case A's bond: from a curve (B) and from
rates entered (C), the present values, the dirty and clean prices, the equivalent yields, the
modified durations, the Z-spreads against 101.40 and the prices after +100 bp all hold to the last
digit, and so do the mockup's discount factors.
