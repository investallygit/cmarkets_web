import { expect, test, type Page } from '@playwright/test'

// Analysis screens of step 4 (ROADMAP.md): EQS and the FA tab, YCRV and YAS.

const panel = (page: Page, title: string | RegExp) =>
  page.locator('section', { has: page.getByRole('heading', { name: title }) })

// @fresh-db: the sector averages of the demo data as seeded.
test(
  'a saved screen filters the equities and the lower panels follow the selected row',
  { tag: '@fresh-db' },
  async ({ page }) => {
    await page.goto('/eqs')
    const results = panel(page, /^Results/)
    await expect(results.getByRole('heading')).toHaveText(/7 of 7 securities/i)

    // The criteria of the screen 3 mockup.
    await page.getByRole('button', { name: 'High yield', exact: true }).click()
    await expect(results.getByRole('heading')).toHaveText(/5 of 7 securities/i)
    await expect(results.getByRole('row', { name: /SIAT/ })).toHaveCount(0)

    await results.getByRole('row', { name: /SEMC/ }).click()
    await expect(panel(page, /Income statement/).getByRole('heading')).toHaveText(
      /SEMC — Income statement/i,
    )
    await expect(
      panel(page, /Income statement/).getByRole('row', { name: /Revenue/ }),
    ).toContainText('+8.4%')
    // The values of the bars, as screen readers get them.
    await expect(panel(page, /^Comparison/).getByRole('listitem')).toHaveText([
      'SEMC: 6.2%',
      /^BANGE: /,
      /^SOCAPALM: /,
      /^SAFACAM: /,
      /^REGIONALE: /,
      'Sector average 6.3%',
    ])

    await results.getByRole('row', { name: /SEMC/ }).dblclick()
    await expect(page).toHaveURL(/\/securities\/SEMC\/des$/)
  },
)

test('a range criterion is run and a screen is saved under a name', async ({ page }) => {
  await page.goto('/eqs')
  const criteria = panel(page, 'Criteria')
  await criteria.getByRole('combobox', { name: 'P/E: condition' }).selectOption('below')
  await criteria.getByRole('textbox', { name: 'P/E: maximum' }).fill('9')
  await expect(criteria.getByText(/Criteria changed/)).toBeVisible()
  await criteria.getByRole('button', { name: 'Run' }).click()
  await expect(panel(page, /^Results/).getByRole('heading')).toHaveText(/2 of 7 securities/i)

  await criteria.getByRole('button', { name: 'Save', exact: true }).click()
  const dialog = page.getByRole('dialog')
  await dialog.getByRole('textbox', { name: 'Name' }).fill('Low P/E')
  await dialog.getByRole('button', { name: 'Save' }).click()
  await expect(dialog).toBeHidden()
  await expect(criteria.getByRole('button', { name: 'Low P/E', exact: true })).toHaveAttribute(
    'aria-pressed',
    'true',
  )
})

test('the bond calculator gives the results of spec section 14.1, case B', async ({ page }) => {
  await page.goto('/yas/ECMR-6.25-2029')
  const calculator = panel(page, 'Bond calculator')
  await expect(calculator.getByText('Dirty price')).toBeVisible()

  const settlement = calculator.getByRole('textbox', { name: 'Settlement date' })
  await settlement.fill('30/10/2026')
  await settlement.blur()
  await calculator.getByRole('textbox', { name: 'Clean price' }).fill('101.40')
  await expect(calculator.getByText('XAF 86,051,507')).toBeVisible()
  await expect(calculator.getByRole('textbox', { name: 'Yield to maturity' })).toHaveValue('5.24')
  await expect(calculator.getByText('6.16% (XAF 4,931,507)')).toBeVisible()
  await expect(calculator.getByText('XAF 11,306')).toBeVisible()

  // The yield drives: the price follows.
  const yieldBox = calculator.getByRole('textbox', { name: 'Yield to maturity' })
  await yieldBox.fill('5.50')
  await yieldBox.blur()
  await expect(calculator.getByRole('textbox', { name: 'Clean price' })).toHaveValue('101.04')
})

test('the yield curves hide a country and compare with a past date', async ({ page }) => {
  await page.goto('/ycrv')
  const curves = panel(page, 'CEMAC sovereign yield curves')
  await expect(curves.getByText('Cameroon 1 month ago')).toBeVisible()
  await curves.getByRole('button', { name: 'Gabon' }).click()
  await expect(curves.getByRole('button', { name: 'Gabon' })).toHaveAttribute(
    'aria-pressed',
    'false',
  )
  await curves.getByRole('combobox', { name: 'Compare to:' }).selectOption('3m')
  await expect(curves.getByText('Cameroon 3 months ago')).toBeVisible()

  // Another bond: YAS, and the comparison follows its country.
  await panel(page, 'Bond calculator')
    .getByRole('combobox', { name: 'Bond' })
    .selectOption('GAB-6.50-2028')
  await expect(page).toHaveURL(/\/yas\/GAB-6.50-2028$/)
  await expect(panel(page, 'Bond calculator').getByText('Spread vs Gabon curve')).toBeVisible()
})

// @fresh-db: the sector averages of the demo data as seeded.
test(
  'the FA tab shows the ratios and the statements of the security',
  { tag: '@fresh-db' },
  async ({ page }) => {
    await page.goto('/securities/SEMC/fa')
    // The P/E moves with the price; the sector average does not.
    await expect(panel(page, /^Ratios 2025/).getByRole('row', { name: /P\/E/ })).toHaveText(
      /P\/E\s*1\d\.\dx\s*12\.1x/,
    )
    await expect(
      panel(page, /Balance sheet & cash flow/).getByRole('row', { name: /Total assets/ }),
    ).toContainText('+5.2%')
  },
)
