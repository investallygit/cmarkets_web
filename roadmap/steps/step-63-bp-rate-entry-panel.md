# Step 63 · BP: the rate entry panel as the spec draws it (screen 16) (M): done

Step 63 of the [roadmap](../../ROADMAP.md#order), for the
[sixth version of the spec](../sixth-version.md). No CMarket.Api phase: `POST /bonds/price` and
`/bonds/{id}/calculate` take the rates entered since step 55.

## Built (26 November 2026)

- **"Rate entry by cash-flow date"** (`features/price-bond/ui/RateEntryPanel.tsx`), in the
  layout's `method` slot with a curve or rates entered, "Calculation method" with a single yield:
  one row per remaining cash-flow date, its time, the reference rate greyed, the entry cell and
  the spread in bp, which follows each keystroke; the row being typed in highlighted; "Rate entry
  by standard tenor" with the eight tenors. The keyboard of the mockup: Enter confirms the cell
  (shown as it is kept) and stays on it, Tab and ↓ go to the next row, Shift+Tab and ↑ back; a
  date without a rate is red. Its hint under the table, then the reference and the notes.
- **The entry helpers** beside the table (`RateHelpers.tsx`, rewritten): 1) start from a curve
  of the list and Copy; 2) shift all rows by a number of bp (Enter applies it); 3) Paste (date ;
  rate), opening the field for cells copied from Excel; 4) Clear. Below 30rem they go under the
  table.
- **Block B** (`DiscountRatesBlock.tsx`): the mode, "Enter by" Cash-flow date or Standard tenor,
  the entry status (`EntryStatusBox.tsx`, `model/entryStatus.ts`): the rates entered for the dates
  or the tenors, the 0–30% check, the average spread to the curve, the starting point "modified"
  or "unchanged"; a line to the panel with "Go to the entry →", which reaches its first cell; Save
  as custom curve. With a single yield, the cash-flow dates greyed at that yield as before.
- **Calculate** says how many dates wait for a rate ("4 cash-flow dates have no rate: Calculate
  waits for them.").
- Block B and the panel read the same model (`model/useDiscountRates.ts`: the schedule's dates,
  the curves, the rates shown, the reference); `NumberInput` takes `invalid` for a cell red
  without a field around it. Strings in `bondPricing.entry`, English and French; the keys of
  decision 46's helpers and notes no longer used are gone.

## Decisions taken while building

- The panel also shows with a curve (decision 56 updated): the spec keeps the curve's rates
  editable, a rate changed making them rates entered; in the same panel the table stays under the
  cursor as the mode changes, where block B's table would have moved away mid-keystroke.
- The status's reference is decision 46's (the curve the rates started from, else CMarket's at
  the settlement date): the mockup's +17.5 bp is case C over case B, the curve of 29/10/2026; the
  demo's curve of 30/10/2026 gives another figure.
- The 0–30% check is said in the status; the rates the server takes (−5% to 50%) still decide
  whether Calculate can send them.
- Enter selects the cell's rate once reformatted, so that a new one replaces it; ↓ and ↑ select
  the next cell's.

## Checked

- Typecheck, lint, Vitest 561 (`entryStatus.test.ts`: the mockup's status, the dates missing, the
  rates outside 0 to 30%, the tenors).
- `e2e/bond-pricing.spec.ts`: step 55's flows moved to the panel (cases B and C typed, the status
  read, the curve saved and reused; paste, Copy, shift and clear, the empty cell red and Calculate's
  reason); a new keyboard walk (block B's link to the first cell, Enter, ↓, Tab, ↑, case C, the
  tenors, back to a single yield); `keyboard.spec.ts`, `bond-profile.spec.ts`.
- axe (WCAG 2.2 AA) finds nothing on BP by date (an empty cell, the paste field open), by tenor
  and from a curve, in English and in French, at 1600, 1280 and 390 px; the panel compared with
  the mockup at 1600 and 1280 px.

### Found and fixed

- The helpers' curve list, its labels long, widened its column past the panel and pushed Copy and
  Apply out of sight: the columns are held to the panel's width.
- A cell selected a frame after ↓ took the first character typed into it: ↓ and ↑ select at once,
  Enter alone after the reformat.
