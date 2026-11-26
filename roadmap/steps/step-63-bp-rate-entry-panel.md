# Step 63 · BP: the rate entry panel as the spec draws it (screen 16) (M): to do

Step 63 of the [roadmap](../../ROADMAP.md#order), for the
[sixth version of the spec](../sixth-version.md). No CMarket.Api phase: `POST /bonds/price` and
`/bonds/{id}/calculate` take the rates entered since step 55.

- In rates-entered mode, "Rate entry by cash-flow date" in the `method` slot of the layout: the
  table (date, t, reference rate greyed, the entry cell, the spread) and the four helpers beside it;
  "Calculation method" back in the other modes (decision 56).
- Block B: the mode, "Cash-flow date" or "Standard tenor", the entry status (the rates entered for
  the dates, all within 0 to 30%, the average spread, the starting point), Save.
- The keyboard: Enter confirms, Tab and ↓ to the next row, Shift+Tab and ↑ back; an empty cell red,
  Calculate waiting with its reason. The mockup's case C typed from the CMarket curve of 29/10/2026.
- **Checked by**: Vitest on the entry status; the BP flows of step 55 moved to the panel, a keyboard
  walk; axe in both languages, at 1600, 1280 and 390 px.
