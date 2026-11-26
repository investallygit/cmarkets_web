# Step 60 · The plan (S): done

Step 60 of the [roadmap](../../ROADMAP.md#order), for the
[sixth version of the spec](../sixth-version.md).

The sixth version is now `CMarket-developer-spec-EN.pdf` and the fifth `-v5.pdf`;
[what it changes and the decisions taken](../sixth-version.md) (49 to 61), the
[order](../../ROADMAP.md#order) of its steps, a note under each screen it changes or adds, the
status of the screens to come in the README, the
[open questions](../open-questions.md#sixth-version) of the sixth version, and the same plan in
CMarket.Api's `docs/PLAN.md` (its phases 46 to 51). Each step still writes its contract first
(`shared/api/contracts` and `shared/api/endpoints`, from spec section 10), CMarket.Api serves it,
then the screen is built on the API and checked by its Playwright flow and axe.

The steps run in one lane, in this order: screen 22's two additions first, which the client's note
asks for, the request by criteria (step 61), then the completion ratio (step 62), which counts the
outcomes of both kinds of request; BP's entry panel (step 63), a front-end move of what step 55
built; then the primary market, which the three other new screens read: the auctions (step 64),
the BEAC (step 65), the sovereign debt (step 66), computed from the auctions; the calendar last
(step 67), which gathers their events; step 68 checks them all.

The text was compared sentence by sentence and the mockups pixel by pixel (ImageMagick, 10% fuzz):
the top half of screen 22's image and screens 23 to 26's are the fifth version's pictures to a few
hundred pixels of antialiasing; screen 16's first image moves by 3%, its second is redrawn.
