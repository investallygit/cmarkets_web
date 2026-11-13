# Step 30 · BP · Bond pricing (screen 16) (M): done

Step 30 of the [roadmap](../../ROADMAP.md#order), for the
[third version of the spec](../third-version.md).

CMarket.Api's phase 23.

- **Built**:
  - BP (`/bp`, `/bp/{bondId}`, `analysis:read` and the analysis module), under YCRV in the menu as
    the mockup lights it, until BP had an entry of its own
    ([the spec author's answers](../third-version.md#the-spec-authors-answers)). "ECMR 6.25 2029 BP"
    opens it on that bond, BP alone on the first bond of the master list; YAS now opens it too (spec
    section 8), with or without a bond, and the old addresses `/yas/{bondId}` lead there. Screen 4
    keeps its calculator, on `/ycrv/{bondId}`, with a link to BP; BS's "Open in BP" and a bond
    shared in MSG ("Open in bond pricing") open BP.
  - Inputs: A, a bond of the master list, whose characteristics fill the fields (face value M,
    annual coupon C, frequency k, maturity, settlement, day count, redemption: bullet, or
    amortizing with its schedule of dates and shares); changing one makes it a bond entered by
    hand ("or enter all characteristics manually"). B, the target yield the platform supplies,
    amber: the last YTM of the daily calculation ("Source: last computed YTM (BS screen) as of
    …"), otherwise the issuer country's curve and the bond's spread; the user's own yield says the
    platform's and offers it back. The face amount, XAF 100,000,000 by default. CALCULATE prices;
    a bond opens calculated; inputs changed since show a note.
  - Results: A, dirty price, accrued interest, clean price; B, Macaulay and modified durations,
    DV01 of the face amount ("DV01 (100 M XAF)"); C, current yield, settlement amount, time to
    maturity; "As of" the settlement. The cash-flow schedule (date, t, coupon, principal, total,
    discount factor, present value per 100 outstanding; the Total row is the dirty price; XLSX
    for the accounts that export); the clean price from 3 points below the yield to 3 above, the
    bond in amber; the rate sensitivity for ±25, ±50 and ±100 bp, rises in green, falls in red,
    the yield itself highlighted.
  - Slices: `features/price-bond` (the form, its store, the inputs panel and the redemption
    schedule), `widgets/bond-pricing-panels` (results, cash flows, price-yield, sensitivity),
    `pages/bond-pricing`; `useMarketYield` and `useBondPrice` in `entities/bond`; the contracts in
    `bondPricing.ts`, the endpoints of `/bonds/price`, `/bonds/{id}/market-yield` and
    `/bonds/{id}/price-yield`; the strings under `bondPricing` in the area file `bonds.json`.
- **CMarket.Api** (phase 23):
  - `POST /bonds/price` on the calculator's engine, from a yield: a bond of the list (at its
    market yield and its market's settlement by default) or its characteristics; the three
    blocks, the cash flows discounted one by one, the shifts asked and the price-yield points in
    one answer, so a bond entered by hand has its curve too. `GET /bonds/{id}/market-yield` (BS's
    yield of the latest calculation, else the country curve at the average life plus the bond's
    last spread) and `GET /bonds/{id}/price-yield` over any range.
  - A bond entered by hand pays a period apart back from maturity, from the coupon date before
    the settlement or before its first repayment; M is the price its principal is repaid at. BVMAC
    settles at T+2, the BEAC's securities at T+1. Nothing stored, no migration. ADR-047.
  - Tested on case A at the mockup's yield (dirty price 107.5643, DV01 XAF 27,242, the four cash
    flows and the seven shifts of the mockup) and at its clean price's, on case B, by hand and on
    the list.
- **Checked**:
  - Type check, lint, the 330 unit tests.
  - CMarket.Api: 1,308 tests (the SQL Server suite's 17 not needed: no migration).
  - Every Playwright flow on CMarket.Api from a fresh database: 98, all passing, and MSG's
    `@fresh-db` flow, whose bond card now opens BP, on a database fresh for it. Two new ones, of BP:
    ECMR from the command bar at BS's yield, its schedule, its cash flows and their export, a yield
    of the user's, YAS alone; case A by hand with the mockup's figures, cash flows, shifts and
    curve, then a repayment off the payment dates refused under the schedule. The flows of YCRV's
    calculator, BS's "Open in BP" and MSG's bond card follow the new addresses.
  - axe (WCAG 2.2 AA) at 1600, 390 and 320 px, in English and French: BP on a bond of the list,
    case A by hand, a yield of the user's, a schedule refused, YCRV's calculator: 30 audits,
    nothing found, nothing scrolls sideways.
  - The audits of steps 24 to 29 set French in the browser, which the app replaces at each load
    with the profile's language: their French runs were English ones. They now switch the
    profile's language from the user menu, and ran again in French: steps 24 to 29, nothing
    found, except the studio's dispute dialog of step 28, which needs a statement awaiting the
    newspaper that this database did not have.
