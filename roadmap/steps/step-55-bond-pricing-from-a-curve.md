# Step 55 · BP from a curve, custom curves (screen 16) (M–L): done

Step 55 of the [roadmap](../../ROADMAP.md#order), for the
[fifth version of the spec](../fifth-version.md).

CMarket.Api's phase 43 (ADR-069).

- **Built**:
  - Block B, "Discount rates" (`DiscountRatesBlock`), as the mockup's three images: three radio
    buttons; with a single yield, the YTM field and its source as since step 30, "Enter the clean
    price instead of the yield" (the yield computed from it), the cash-flow dates greyed at that
    yield; with a yield curve, the CMarket curve of the bond's country ("CMarket Cameroon · zero ·
    20/11/2026"), the user's curves and the colleagues' shared ones, each date's rate read on the
    curve and editable: a rate changed switches to rates entered, the curve's rates kept on the
    other dates; with rates entered, by cash-flow date (one row per remaining date, prefilled with
    the rates shown before) or by standard tenor (3M to 10Y, prefilled from the curve, the dates'
    rates interpolated and greyed). The table's dates are those of the bond's schedule, asked of
    `/bonds/price` at a fixed yield as the characteristics change (`scheduleRequest`).
  - "Save as custom curve" (`analysis:save`): a name and "Share with my organisation"; the curve
    saved becomes the curve priced at. A custom curve of the user's is renamed, shared or deleted
    under the drop-down (`CurveActions`); a colleague's says who shared it.
  - The face amount moved into block A, after the redemption.
  - Results: the title bar names the mode ("As of 30/10/2026 · From the curve"); from a curve or
    rates entered, A. Pricing, B. Yield and risk (the equivalent yield, the modified duration,
    DV01), C. Comparison (the market price, the Z-spread in red or green, the settlement amount).
  - The schedule's "Zero rate %" column in amber before the discount factor, and the mockup's note.
  - "Curve used" (`CurveUsedPanel`) in place of the price-yield relationship from a curve: its
    nodes in blue, the cash-flow dates in amber with dashed verticals, the curve's date and source
    under it; "Rates used" for rates entered, the CMarket curve dashed for comparison. The axis
    runs to two years past the last cash flow, the curve cut there (`curveWindow`).
  - The sensitivity's title follows the mode ("Yield sensitivity", "Sensitivity to the curve",
    "Sensitivity to rates entered"); a custom curve or the tenors entered add a drop-down,
    parallel or a shock at one tenor, sent as `shockTenor`.
  - "Calculation method" (`CalculationMethodPanel`), a new panel under the schedule: the mockup's
    four explanations, the mode of the last calculation in amber. A layout saved before finds it
    at its default place.
  - Slices: `entities/bond` (`useCurves`, `useCurve`, `useSaveCurve`, `useUpdateCurve`,
    `useDeleteCurve`, `cmarketCurveId`, `rateAt`, `TENOR_YEARS`); `features/price-bond`
    (`model/discountForm.ts`, the block's UI); `widgets/bond-pricing-panels` (`lib/modes.ts`, the
    two new panels); the contracts in `bondPricing.ts`; the routes of `bonds.ts` and `me.ts`.
- **CMarket.Api** (phase 43, ADR-069):
  - `ZeroRatePricing` in the domain: each cash flow at its own zero rate (linear interpolation,
    the end nodes' rates beyond them), the equivalent yield, the Z-spread to the market dirty
    price, the parallel shift, and the shock at a tenor, which inserts a node there so that it
    fades to the neighbouring nodes.
  - `POST /bonds/price` takes `cleanPrice`, `discount` (`curve`, `rates`, `tenors`) and
    `shockTenor` (a custom curve or the tenors; rates by date shift as a whole), and answers the
    mode and the curve, the market price and the Z-spread, each flow's zero rate.
    `/bonds/{id}/calculate` keeps its single yield: the spec names it, BP calls `/bonds/price`.
  - `GET /curves?country=&date=`, `GET /curves/{id}/points?date=`; `GET`, `POST`, `PUT` and
    `DELETE /me/curves` (`usr.CustomCurves`, migration `CustomCurves`). Demo: P. Owona's "Q4
    rate-rise scenario", shared with Asset manager A.
- **Checked**: web typecheck, lint, 524 unit tests; the routes against CMarket.Api's OpenAPI;
  Playwright, the four flows of `bond-pricing.spec.ts` (case A by yield and by clean price; the
  CMarket Cameroon curve on ECMR; cases B and C entered by date at 30/10/2026, saved as a curve,
  shocked at 2Y, reused on GAB 6.50% 2028 and deleted) and the flows that open BP (BS, the bond
  profile, the keyboard, the smoke); axe clean on BP in each mode, the custom curve's actions and
  the save form, in English and in French. CMarket.Api: the domain (705), application (809),
  integration (309) and architecture (21) suites; the SQL Server suite waits for Docker.
- **Left**: the CMarket curve's rates are YCRV's yields read as zero rates (decision 45), so the
  demo's figures from the curve are not the mockup's 4.600 to 5.850, which cases B and C enter by
  hand. The Download button comes with step 57.

## Part 2: the client's entry panel (S–M): done

Added on 22 November 2026 from [the client's answer](../fifth-version.md#the-clients-answer-of-22-november)
(decision 46), built the same day.

- **Built**:
  - Block B's table, with a curve or rates entered: the date, t, "Ref. %" (the reference curve
    read at the date), the rate and "Spread bp" (rate − reference, one decimal, green above and
    red below, recomputed at each keystroke), at set column widths so that the five fit the inputs
    panel; the tenors in a table of their own with the same columns. The reference is the curve
    chosen, the curve the rates started from (a curve's rate edited, or "Start from a curve"),
    else the CMarket curve of the country on the settlement date, named under the table.
  - The helpers above it (`RateHelpers`): "Start from a curve" (a curve of the list, read on the
    settlement date for CMarket's), "Shift all rows" (± bp), "Paste from Excel" (a text area: a
    rate a line, or a date and a rate, tabs or semicolons, `4,60` or `4.60`, a header skipped),
    "Clear"; Enter applies a helper, not Calculate. Several cells pasted into a rate fill the
    table from that row down. A line unread or unmatched (a date the bond does not pay on, past
    the last row) changes nothing and is said under the table. From a curve, a helper makes the
    rates entered, as an edited rate does.
  - `model/rateEntry.ts` (`referenceOf`, `referenceRates`, `spreadBp`, `shiftRates`,
    `clearRates`, `startFromCurve`, `parsePasted`, `pasteRates`, `cellsPasted`); the form's
    `referenceId`; `SpreadCell`.
- **CMarket.Api** (phase 43, part 2): `POST /bonds/{id}/calculate` takes `discount` in place of
  the price and the yield (400 with both), priced by BP's query: the clean price, the equivalent
  yield as its yield, `discount`, `comparison` and `zeroRates` (date, years, rate), which a single
  yield leaves out of the answer.
- **Checked**: web typecheck, lint, 530 unit tests; Playwright, the five flows of
  `bond-pricing.spec.ts` (the new one: case B pasted from Excel, started from the CMarket curve at
  a spread of 0.0, shifted by +20.0 bp, case C pasted as four cells into the first rate, a line
  unmatched, cleared) and the flows that open BP; axe clean on the table with spreads, each helper
  open and the tenors, in English and in French. CMarket.Api: the calculate route's application
  and integration tests (curve case B from the calculator equals BP's; the refusal), the
  application, integration and architecture suites.
