import { expect, test, type Page } from '@playwright/test'

// BP, bond pricing of ROADMAP step 30 (spec screen 16): a bond of the list at the yield of the
// daily calculation (BS), YAS opening BP; then case A of section 14.1 entered by hand, the
// mockup's figures, its cash flows, its rate sensitivity and its curve. Step 55 (fifth version):
// block B's discount rates, the CMarket curve, cases B and C entered by date, a custom curve
// saved, reused on another bond and deleted.

const panel = (page: Page, title: string | RegExp) =>
  page.locator('section', { has: page.getByRole('heading', { name: title }) })

const inputs = (page: Page) => panel(page, 'Inputs')
const entry = (page: Page) => panel(page, 'Rate entry by cash-flow date')

async function command(page: Page, text: string) {
  await page.getByRole('combobox', { name: 'Command bar' }).fill(text)
  await page.keyboard.press('Enter')
}

test('BP prices a bond of the list at the yield BS computed, and YAS opens it', async ({
  page,
}) => {
  await page.goto('/mkt')
  await command(page, 'ECMR 6.25 2029 BP')
  await expect(page).toHaveURL(/\/bp\/ECMR-6\.25-2029$/)
  // Its own entry in the menu, after YCRV, which the mockup lights.
  await expect(
    page.getByRole('navigation', { name: 'Main menu' }).getByRole('link', { name: /^BP/ }),
  ).toHaveClass(/border-accent-amber/)

  const form = inputs(page)
  await expect(form.getByRole('combobox', { name: 'Bond' })).toHaveValue('ECMR-6.25-2029')
  await expect(form.getByText(/^Source: last computed YTM \(BS screen\) as of/)).toBeVisible()
  await expect(form.getByRole('textbox', { name: 'Settlement date (T+2)' })).not.toHaveValue('')
  // ECMR repays a fifth of its face each November: its schedule, in the form.
  await expect(form.getByRole('combobox', { name: 'Redemption' })).toHaveValue('amortizing')
  await expect(form.getByRole('textbox', { name: 'Repayment 5: date' })).toHaveValue('04/11/2029')

  // Figures of the yield given: per 100 of the 60 outstanding after two repayments.
  const results = panel(page, 'Results')
  await expect(results.getByRole('region', { name: 'A. Pricing' })).toContainText('Dirty price')
  await expect(results).toContainText(/As of \d{2}\/\d{2}\/\d{4}/)
  const cashFlows = panel(page, 'Cash flow schedule')
  await expect(cashFlows.getByRole('row', { name: /04\/11\/2029/ })).toContainText('33.3333')
  await expect(panel(page, 'Yield sensitivity').getByRole('row')).toHaveCount(8)

  const download = page.waitForEvent('download')
  await cashFlows.getByRole('button', { name: 'Export XLSX' }).click()
  expect((await download).suggestedFilename()).toMatch(/^bp-cash-flows.*\.xlsx$/)

  // Another yield: the figures wait for Calculate.
  await form.getByRole('textbox', { name: 'Target yield to maturity (YTM)' }).fill('7')
  await expect(form.getByText(/^Your yield\. The platform's:/)).toBeVisible()
  await expect(form.getByText('The inputs changed: calculate to update the results.')).toBeVisible()
  await form.getByRole('button', { name: 'Calculate' }).click()
  await expect(form.getByText(/The inputs changed/)).toBeHidden()

  // YAS alone opens BP, on the first bond of the list.
  await command(page, 'YAS')
  await expect(page).toHaveURL(/\/bp$/)
  await expect(inputs(page).getByRole('combobox', { name: 'Bond' })).toHaveValue('ECMR-6.25-2029')
})

test('a bond entered by hand gives the figures of case A, the mockup of screen 16', async ({
  page,
}) => {
  await page.goto('/bp/ECMR-6.25-2029')
  const form = inputs(page)
  await expect(form.getByRole('combobox', { name: 'Redemption' })).toHaveValue('amortizing')

  // Case A of section 14.1: a bullet bond, settled on 30/10/2026, at the mockup's yield.
  await form.getByRole('combobox', { name: 'Redemption' }).selectOption('bullet')
  await expect(form.getByRole('combobox', { name: 'Bond' })).toHaveValue('')
  await expect(form.getByText('A bond entered by hand: enter its yield.')).toBeVisible()
  await form.getByRole('textbox', { name: /^Settlement date/ }).fill('30/10/2026')
  await form.getByRole('textbox', { name: 'Target yield to maturity (YTM)' }).fill('5.7302')
  await form.getByRole('textbox', { name: 'Face amount (XAF)' }).fill('100000000')
  await form.getByRole('button', { name: 'Calculate' }).click()

  const results = panel(page, 'Results')
  await expect(results).toContainText('As of 30/10/2026')
  await expect(results.getByRole('region', { name: 'A. Pricing' })).toContainText(
    /Dirty price\s*107\.5643%\s*Accrued interest\s*6\.1644%\s*Clean price\s*101\.3999%/,
  )
  await expect(results.getByRole('region', { name: 'B. Risk and sensitivity' })).toContainText(
    /Macaulay duration\s*2\.6778 yrs\s*Modified duration\s*2\.5326%\s*DV01 \(100\sM XAF\)\s*27,242 XAF/,
  )
  await expect(results.getByRole('region', { name: 'C. Supplemental' })).toContainText(
    /Current yield\s*6\.1637%\s*Settlement amount\s*107,564,262 XAF\s*Time to maturity\s*3\.01 yrs/,
  )

  const cashFlows = panel(page, 'Cash flow schedule')
  await expect(cashFlows.getByRole('row', { name: /04\/11\/2026/ })).toHaveText(
    /04\/11\/2026\s*0\.0137\s*6\.2500\s*0\.0000\s*6\.2500\s*5\.730\s*0\.999237\s*6\.2452/,
  )
  await expect(cashFlows.getByRole('row', { name: /04\/11\/2029/ })).toHaveText(
    /04\/11\/2029\s*3\.0137\s*6\.2500\s*100\.0000\s*106\.2500\s*5\.730\s*0\.845418\s*89\.8256/,
  )
  await expect(cashFlows.getByRole('row', { name: /^Total/ })).toContainText('107.5643')

  const sensitivity = panel(page, 'Yield sensitivity')
  await expect(sensitivity.getByRole('row', { name: /^-100 bp/ })).toHaveText(
    /-100 bp\s*104\.1755\s*\+2\.776\s*\+2\.58%/,
  )
  await expect(sensitivity.getByRole('row', { name: /^\+100 bp/ })).toHaveText(
    /\+100 bp\s*98\.7256\s*-2\.674\s*-2\.49%/,
  )
  await expect(panel(page, 'Price-yield relationship')).toContainText(
    '101.40 at the yield of 5.73%',
  )
  await expect(panel(page, 'Calculation method').locator('[aria-current="true"]')).toContainText(
    'Single yield (YTM)',
  )

  // The clean price in place of the yield: the yield is computed from it.
  await form.getByRole('button', { name: 'Enter the clean price instead of the yield' }).click()
  await form.getByRole('textbox', { name: 'Clean price (%)' }).fill('101.4')
  await form.getByRole('button', { name: 'Calculate' }).click()
  await expect(results.getByRole('region', { name: 'A. Pricing' })).toContainText(
    /Clean price\s*101\.4000%/,
  )
  await form.getByRole('button', { name: 'Enter the yield instead of the clean price' }).click()

  // ECMR's repayments come back; one moved off the payment dates, the server says so.
  await form.getByRole('combobox', { name: 'Redemption' }).selectOption('amortizing')
  await expect(form.getByRole('textbox', { name: 'Repayment 5: date' })).toHaveValue('04/11/2029')
  await form.getByRole('textbox', { name: 'Repayment 1: date' }).fill('04/05/2026')
  await form.getByRole('button', { name: 'Calculate' }).click()
  await expect(form.getByRole('alert')).toHaveText('The principal is repaid on payment dates.')
})

test("the CMarket curve of the bond's country discounts each cash flow at its own rate", async ({
  page,
}) => {
  await page.goto('/bp/ECMR-6.25-2029')
  const form = inputs(page)
  await expect(form.getByRole('combobox', { name: 'Redemption' })).toHaveValue('amortizing')
  await form.getByRole('radio', { name: 'Yield curve' }).check()
  await expect(form.getByRole('combobox', { name: 'Curve' })).toHaveValue('cmkt-CM')
  // The rates of the curve, read at the bond's dates, fill the entry panel in the method's place.
  await expect(
    entry(page)
      .getByRole('textbox', { name: /^Rate on / })
      .first(),
  ).not.toHaveValue('')
  await expect(panel(page, 'Calculation method')).toBeHidden()
  await form.getByRole('button', { name: 'Calculate' }).click()

  const results = panel(page, 'Results')
  await expect(results).toContainText(/As of \d{2}\/\d{2}\/\d{4} · From the curve/)
  await expect(results.getByRole('region', { name: 'B. Yield and risk' })).toContainText(
    /Equivalent yield \(YTM\)\s*\d+\.\d{4}%/,
  )
  await expect(results.getByRole('region', { name: 'C. Comparison' })).toContainText(
    'Spread to curve (Z-spread)',
  )
  const curve = panel(page, 'Curve used')
  await expect(curve).toContainText('Zero-coupon · Cameroon')
  await expect(curve).toContainText(/Rate used at each cash-flow date: 04\/11\/\d{4} \d\.\d{3}%/)
  await expect(panel(page, 'Sensitivity to the curve')).toContainText(
    'The same shock is applied to every rate on the curve.',
  )
})

test('rates entered by date give cases B and C, saved as a curve, reused and deleted', async ({
  page,
}) => {
  await page.goto('/bp/ECMR-6.25-2029')
  const form = inputs(page)
  await expect(form.getByRole('combobox', { name: 'Redemption' })).toHaveValue('amortizing')
  // Case A's bond: ECMR bullet, settled on 30/10/2026.
  await form.getByRole('combobox', { name: 'Redemption' }).selectOption('bullet')
  await form.getByRole('textbox', { name: /^Settlement date/ }).fill('30/10/2026')
  await form.getByRole('textbox', { name: 'Face amount (XAF)' }).fill('100000000')
  await form.getByRole('radio', { name: 'Rates entered by maturity' }).check()

  const rates = entry(page)
  const rate = (date: string) => rates.getByRole('textbox', { name: `Rate on ${date}, %` })
  const enter = async (values: string[]) => {
    for (const [index, value] of values.entries()) await rate(`04/11/${2026 + index}`).fill(value)
    await form.getByRole('button', { name: 'Calculate' }).click()
  }
  await expect(rates.getByRole('textbox', { name: /^Rate on / })).toHaveCount(4)

  // Case B of section 14.1: the CMarket curve's rates at the four dates.
  await enter(['4.6', '5.1', '5.55', '5.85'])
  const results = panel(page, 'Results')
  await expect(results).toContainText('As of 30/10/2026 · Rates entered')
  await expect(results.getByRole('region', { name: 'A. Pricing' })).toContainText(
    /Dirty price\s*107\.3143%\s*Accrued interest\s*6\.1644%\s*Clean price\s*101\.1499%/,
  )
  await expect(results.getByRole('region', { name: 'B. Yield and risk' })).toContainText(
    /Equivalent yield \(YTM\)\s*5\.8221%\s*Modified duration\s*2\.5299%/,
  )
  const cashFlows = panel(page, 'Cash flow schedule')
  await expect(cashFlows.getByRole('row', { name: /04\/11\/2028/ })).toContainText('5.550')
  await expect(panel(page, 'Rates used')).toContainText('Entered · comparison')
  await expect(panel(page, 'Sensitivity to rates entered')).toContainText(
    'Once saved, shocks by tenor are possible.',
  )

  // Case C: 15 to 20 bp higher, the mockup's rate-rise scenario, and block B's entry status.
  await enter(['4.8', '5.3', '5.7', '6'])
  const status = form.getByRole('region', { name: 'Entry status' })
  await expect(status).toContainText('4 rates entered for 4 cash-flow dates')
  await expect(status).toContainText('All rates between 0 and 30%')
  // The reference is CMarket's curve at the settlement date (the mockup's +17.5 bp is over case B).
  await expect(status).toContainText(/Average spread to curve: [+−-]?\d+\.\d bp/)
  await expect(status).toContainText(/Starting point: CMarket Cameroon · zero · .+, modified\./)
  await expect(results.getByRole('region', { name: 'A. Pricing' })).toContainText(
    /Clean price\s*100\.7410%/,
  )
  await expect(results.getByRole('region', { name: 'B. Yield and risk' })).toContainText(
    /Equivalent yield \(YTM\)\s*5\.9731%\s*Modified duration\s*2\.5253%/,
  )

  // Saved as a custom curve, which becomes the curve priced at: a shock by tenor is offered.
  const name = `E2E rate rise ${Date.now()}`
  await form.getByRole('button', { name: 'Save as custom curve' }).click()
  await form.getByRole('textbox', { name: 'Curve name' }).fill(name)
  await form.getByRole('button', { name: 'Save', exact: true }).click()
  await expect(page.getByText(`Curve “${name}” saved.`)).toBeVisible()
  await expect(form.getByRole('radio', { name: 'Yield curve' })).toBeChecked()
  await form.getByRole('button', { name: 'Calculate' }).click()
  await expect(results.getByRole('region', { name: 'A. Pricing' })).toContainText(
    /Clean price\s*100\.7410%/,
  )
  const sensitivity = panel(page, 'Sensitivity to the curve')
  await sensitivity.getByRole('combobox', { name: 'Shock' }).selectOption('2Y')
  await expect(sensitivity).toContainText('The shock moves the 2Y rate alone')
  await expect(panel(page, 'Curve used')).toContainText(`Custom · ${name}`)

  // Reused on another bond, then deleted.
  await form.getByRole('combobox', { name: 'Bond' }).selectOption('GAB-6.50-2028')
  await expect(page).toHaveURL(/\/bp\/GAB-6\.50-2028$/)
  const other = inputs(page)
  await other.getByRole('radio', { name: 'Yield curve' }).check()
  const curves = other.getByRole('combobox', { name: 'Curve' })
  const id = await curves.locator('option', { hasText: name }).getAttribute('value')
  await curves.selectOption(id ?? '')
  await expect(other.getByText('Your curve, private.')).toBeVisible()
  await other.getByRole('button', { name: 'Calculate' }).click()
  await expect(panel(page, 'Results')).toContainText('From the curve')
  await expect(panel(page, 'Curve used')).toContainText(`Custom · ${name}`)

  await other.getByRole('button', { name: 'Delete' }).click()
  await page.getByRole('dialog').getByRole('button', { name: 'Delete' }).click()
  await expect(page.getByText(`Curve “${name}” deleted.`)).toBeVisible()
  await expect(curves.locator('option', { hasText: name })).toHaveCount(0)
})

test('the entry panel pastes, starts from a curve, shifts and clears the rates', async ({
  page,
}) => {
  await page.goto('/bp/ECMR-6.25-2029')
  const form = inputs(page)
  await expect(form.getByRole('combobox', { name: 'Redemption' })).toHaveValue('amortizing')
  await form.getByRole('combobox', { name: 'Redemption' }).selectOption('bullet')
  await form.getByRole('textbox', { name: /^Settlement date/ }).fill('30/10/2026')
  await form.getByRole('textbox', { name: 'Face amount (XAF)' }).fill('100000000')
  await form.getByRole('radio', { name: 'Rates entered by maturity' }).check()
  const rates = entry(page)
  const rate = (date: string) => rates.getByRole('textbox', { name: `Rate on ${date}, %` })
  const dates = ['04/11/2026', '04/11/2027', '04/11/2028', '04/11/2029']
  const table = rates.getByRole('table', { name: 'Discount rate of each remaining cash-flow date' })
  const results = panel(page, 'Results')
  const calculate = form.getByRole('button', { name: 'Calculate' })
  await expect(rate(dates[3]!)).toBeVisible()

  // Case B pasted from Excel, a header, French decimals, a date and a rate a line.
  const helpers = rates.getByRole('region', { name: 'Entry helpers' })
  const paste = helpers.getByRole('group', { name: '3. Paste from Excel' })
  await paste.getByRole('button', { name: 'Paste (date ; rate)' }).click()
  await paste
    .getByRole('textbox', { name: 'Rates copied from Excel' })
    .fill('Date\tRate\n04/11/2026\t4,6\n04/11/2027\t5,1\n04/11/2028\t5,55\n04/11/2029\t5,85')
  await paste.getByRole('button', { name: 'Apply' }).click()
  await expect(rate(dates[2]!)).toHaveValue('5.550')
  await calculate.click()
  await expect(results.getByRole('region', { name: 'A. Pricing' })).toContainText(
    /Clean price\s*101\.1499%/,
  )

  // Started from the CMarket curve: each rate is its reference, a spread of 0.0.
  await helpers.getByRole('button', { name: 'Copy' }).click()
  await expect(table.getByRole('row', { name: dates[0] })).toContainText(/0\.0$/)
  // Shifted by 20 bp: each spread +20.0.
  await helpers.getByRole('textbox', { name: 'Shift (bp)' }).fill('20')
  await helpers.getByRole('textbox', { name: 'Shift (bp)' }).press('Enter')
  for (const date of dates) {
    await expect(table.getByRole('row', { name: date })).toContainText('+20.0')
  }

  // Case C pasted as four cells into the first rate: the table fills from it down.
  await rate(dates[0]!).evaluate((input) => {
    const data = new DataTransfer()
    data.setData('text/plain', '4.8\n5.3\n5.7\n6')
    input.dispatchEvent(new ClipboardEvent('paste', { clipboardData: data, bubbles: true }))
  })
  await expect(rate(dates[3]!)).toHaveValue('6.000')
  await calculate.click()
  await expect(results.getByRole('region', { name: 'A. Pricing' })).toContainText(
    /Clean price\s*100\.7410%/,
  )

  // A line the bond does not pay on changes nothing; Clear empties the rows.
  await paste.getByRole('button', { name: 'Paste (date ; rate)' }).click()
  await paste.getByRole('textbox', { name: 'Rates copied from Excel' }).fill('04/12/2029\t6')
  await paste.getByRole('button', { name: 'Apply' }).click()
  await expect(rates.getByRole('alert')).toContainText('Some lines match no row of the table')
  await expect(rate(dates[3]!)).toHaveValue('6.000')
  await helpers.getByRole('button', { name: 'Clear' }).click()
  await expect(rate(dates[0]!)).toHaveValue('')
  await expect(rate(dates[0]!)).toHaveAttribute('aria-invalid', 'true')
  await expect(calculate).toBeDisabled()
  await expect(form).toContainText('4 cash-flow dates have no rate: Calculate waits for them.')
})

test('the rates are typed from the keyboard: Enter stays, ↓ and Tab go on, ↑ goes back', async ({
  page,
}) => {
  await page.goto('/bp/ECMR-6.25-2029')
  const form = inputs(page)
  await expect(form.getByRole('combobox', { name: 'Redemption' })).toHaveValue('amortizing')
  await form.getByRole('combobox', { name: 'Redemption' }).selectOption('bullet')
  await form.getByRole('textbox', { name: /^Settlement date/ }).fill('30/10/2026')
  await form.getByRole('radio', { name: 'Rates entered by maturity' }).check()
  const rates = entry(page)
  const rate = (date: string) => rates.getByRole('textbox', { name: `Rate on ${date}, %` })
  await expect(rate('04/11/2029')).toBeVisible()
  await rates.getByRole('button', { name: 'Clear' }).click()

  // Block B's link reaches the first cell; each value typed, then Enter, ↓, Tab and ↑.
  await form.getByRole('button', { name: 'Go to the entry →' }).click()
  await expect(rate('04/11/2026')).toBeFocused()
  await page.keyboard.type('4.8')
  await page.keyboard.press('Enter')
  await expect(rate('04/11/2026')).toBeFocused()
  await expect(rate('04/11/2026')).toHaveValue('4.800')
  await page.keyboard.press('ArrowDown')
  await expect(rate('04/11/2027')).toBeFocused()
  await page.keyboard.type('5.3')
  await page.keyboard.press('Tab')
  await expect(rate('04/11/2028')).toBeFocused()
  await page.keyboard.type('5.7')
  await page.keyboard.press('ArrowDown')
  await page.keyboard.type('6')
  await page.keyboard.press('ArrowUp')
  await expect(rate('04/11/2028')).toBeFocused()
  await expect(rate('04/11/2029')).toHaveValue('6.000')
  await expect(form.getByRole('region', { name: 'Entry status' })).toContainText(
    '4 rates entered for 4 cash-flow dates',
  )

  // Calculate gives case C; by standard tenor, the panel follows.
  await form.getByRole('button', { name: 'Calculate' }).click()
  await expect(panel(page, 'Results').getByRole('region', { name: 'A. Pricing' })).toContainText(
    /Clean price\s*100\.7410%/,
  )
  // A segment's radio is hidden under its label, which takes the click.
  await form.getByRole('radiogroup', { name: 'Enter by' }).getByText('Standard tenor').click()
  await expect(form.getByRole('radio', { name: 'Standard tenor' })).toBeChecked()
  await expect(panel(page, 'Rate entry by standard tenor')).toContainText('3M')
  await expect(form.getByRole('region', { name: 'Entry status' })).toContainText(
    /\d+ rates? entered for 8 standard tenors/,
  )
  await form.getByRole('radio', { name: 'Single yield (YTM)' }).check()
  await expect(panel(page, 'Calculation method')).toBeVisible()
})
