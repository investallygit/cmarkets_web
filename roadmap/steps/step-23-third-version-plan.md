# Step 23 · The plan (S): done

Step 23 of the [roadmap](../../ROADMAP.md#order), for the
[third version of the spec](../third-version.md).

The third version is now `CMarket-developer-spec-EN.pdf` and the second `-v2.pdf`;
[what it changes and the decisions taken](../third-version.md), the [order](../../ROADMAP.md#order)
of its steps, the status of the screens to come in the README, the
[open questions](../open-questions.md#third-version) of the third version, and the same plan in
CMarket.Api's `docs/PLAN.md` (its phases 17 to 28). With the mock gone, each step writes its
contract first (`shared/api/contracts` and `shared/api/endpoints`, from spec section 10),
CMarket.Api serves it (domain, tests, migration, demo data as in the mockups), then the screen is
built on the API and checked by its Playwright flow and axe.
