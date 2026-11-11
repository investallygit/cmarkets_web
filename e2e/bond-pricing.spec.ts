import { expect, test, type Page } from '@playwright/test'

// BP, bond pricing of ROADMAP step 30 (spec screen 16): a bond of the list at the yield of the
// daily calculation (BS), YAS opening BP; then case A of section 14.1 entered by hand, the
// mockup's figures, its cash flows, its rate sensitivity and its curve.

const panel = (page: Page, title: string | RegExp) =>
  page.locator('section', { has: page.getByRole('heading', { name: title }) })

const inputs = (page: Page) => panel(page, 'Inputs')

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
  // Under YCRV in the menu, as the mockup lights it.
  await expect(
    page.getByRole('navigation', { name: 'Main menu' }).getByRole('link', { name: /^YCRV/ }),
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
  await expect(panel(page, 'Rate sensitivity').getByRole('row')).toHaveCount(8)

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
    /04\/11\/2026\s*0\.0137\s*6\.2500\s*0\.0000\s*6\.2500\s*0\.999237\s*6\.2452/,
  )
  await expect(cashFlows.getByRole('row', { name: /04\/11\/2029/ })).toHaveText(
    /04\/11\/2029\s*3\.0137\s*6\.2500\s*100\.0000\s*106\.2500\s*0\.845418\s*89\.8256/,
  )
  await expect(cashFlows.getByRole('row', { name: /^Total/ })).toContainText('107.5643')

  const sensitivity = panel(page, 'Rate sensitivity')
  await expect(sensitivity.getByRole('row', { name: /^-100 bp/ })).toHaveText(
    /-100 bp\s*104\.1755\s*\+2\.776\s*\+2\.58%/,
  )
  await expect(sensitivity.getByRole('row', { name: /^\+100 bp/ })).toHaveText(
    /\+100 bp\s*98\.7256\s*-2\.674\s*-2\.49%/,
  )
  await expect(panel(page, 'Price-yield relationship')).toContainText(
    '101.40 at the yield of 5.73%',
  )

  // ECMR's repayments come back; one moved off the payment dates, the server says so.
  await form.getByRole('combobox', { name: 'Redemption' }).selectOption('amortizing')
  await expect(form.getByRole('textbox', { name: 'Repayment 5: date' })).toHaveValue('04/11/2029')
  await form.getByRole('textbox', { name: 'Repayment 1: date' }).fill('04/05/2026')
  await form.getByRole('button', { name: 'Calculate' }).click()
  await expect(form.getByRole('alert')).toHaveText('The principal is repaid on payment dates.')
})
