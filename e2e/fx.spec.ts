import { expect, test, type Page } from '@playwright/test'

// FX, the FX dashboard (screen 26), ROADMAP step 39: the cross rates against XAF, the chart, the
// converter, the matrix and the euro benchmarks, on the demo's ECB reference rates (the mockup's);
// MKT's rates panel opens it; ADMCFG chooses its currencies.

const panel = (page: Page, title: string | RegExp) =>
  page.locator('section', { has: page.getByRole('heading', { name: title, exact: true }) })

const ECB_DAY = String.raw`\d{2}/\d{2}/\d{4}`

/** The prototype's account switch reloads the app: wait for the new account's badge. */
async function switchAccount(page: Page, from: RegExp, account: string, badge: RegExp) {
  const topBar = page.getByRole('banner')
  await topBar.getByRole('button', { name: from }).click()
  await page.getByRole('menuitem', { name: account, exact: true }).click()
  await expect(topBar.getByRole('button', { name: badge })).toBeVisible()
}

test('FX gives the mockup’s cross rates, draws the currency picked, converts and crosses them', async ({
  page,
}) => {
  await page.goto('/mkt')
  await panel(page, 'Rates and FX').getByRole('link', { name: 'FX dashboard' }).click()
  await expect(page).toHaveURL(/\/fx$/)
  await expect(page.getByText('1 EUR = 655.957 XAF')).toBeVisible()
  await expect(
    page.getByText(new RegExp(`crosses computed from ECB reference rates of ${ECB_DAY}`)),
  ).toBeVisible()

  const crosses = panel(page, 'Cross rates against XAF')
  await expect(
    crosses.getByRole('row', {
      name: /^USD US dollar 1\.0848 604\.68 -0\.21% -1\.40% -4\.20% \+2\.10%$/,
    }),
  ).toBeVisible()
  await expect(
    crosses.getByRole('row', { name: /^JPY Yen \(per 100\) 163\.40 401\.44 / }),
  ).toBeVisible()
  await expect(
    crosses.getByText('Indicative reference rates, not usable for settlement.'),
  ).toBeVisible()
  // The chart draws the table's first currency, the year by default.
  const dollar = panel(page, 'USD / XAF')
  await expect(dollar.getByRole('tab', { name: '[1Y]' })).toHaveAttribute('aria-selected', 'true')
  await expect(dollar.getByText('604.68')).toBeVisible()

  await crosses.getByRole('row', { name: /^GBP Pound sterling/ }).click()
  await expect(page).toHaveURL(/\/fx\?currency=GBP$/)
  const pound = panel(page, 'GBP / XAF')
  await expect(pound.getByText('783.61')).toBeVisible()
  await pound.getByRole('tab', { name: 'MAX' }).click()
  await expect(pound.getByRole('tab', { name: '[MAX]' })).toBeVisible()
  await expect(pound.getByRole('figure', { name: /GBP against the CFA franc/ })).toBeVisible()

  // The mockup's conversion, then the parity between the euro and the franc.
  const converter = panel(page, 'Converter')
  const result = converter.getByRole('status', { name: 'Converted amount' })
  await expect(result).toHaveText('16,537.67')
  await expect(
    converter.getByText(
      new RegExp(`^Rate applied: 1 USD = 604\\.68 XAF \\(ECB reference of ${ECB_DAY}\\)\\.$`),
    ),
  ).toBeVisible()
  await converter.getByRole('textbox', { name: 'Amount' }).fill('1000000')
  await expect(result).toHaveText('1,653.77')
  await converter.getByRole('combobox', { name: 'Currency converted' }).selectOption('EUR')
  await converter.getByRole('combobox', { name: 'Currency of the result' }).selectOption('XAF')
  await expect(result).toHaveText('655,957,000.00')
  await expect(
    converter.getByText('Rate applied: 1 EUR = 655.957 XAF, the fixed parity.'),
  ).toBeVisible()

  // 1 unit in row = … in column; the euro's franc the parity itself.
  const matrix = panel(page, 'Cross-rate matrix')
  await expect(matrix.getByRole('row', { name: 'EUR – 1.08 0.8371 7.78 655.957' })).toBeVisible()
  await expect(matrix.getByRole('row', { name: 'USD 0.9218 – 0.7717 7.17 604.68' })).toBeVisible()
  await expect(matrix.getByRole('row', { name: 'XAF 0.0015 0.0017 0.0013 0.0119 –' })).toBeVisible()
  const euro = panel(page, 'Euro area benchmarks')
  await expect(euro.getByText('Euribor 3M')).toBeVisible()
  await expect(euro.getByText('2.02%')).toBeVisible()
})

test('MKT’s rates panel opens FX on the currency of a rate, and the menu has FX after MKT', async ({
  page,
}) => {
  await page.goto('/mkt')
  await panel(page, 'Rates and FX')
    .getByRole('row', { name: /^CNY \/ XAF/ })
    .dblclick()
  await expect(page).toHaveURL(/\/fx\?currency=CNY$/)
  await expect(panel(page, 'CNY / XAF').getByText('84.33')).toBeVisible()
  const menu = page.getByRole('navigation', { name: 'Main menu' })
  await expect(menu.getByRole('link', { name: /^FX/ })).toHaveAttribute('aria-current', 'page')
  await expect(menu.getByRole('link').nth(1)).toHaveAccessibleName(/^FX/)
})

test('ADMCFG chooses FX’s currencies, audited, and FX follows them', async ({ page }) => {
  await page.goto('/cfg')
  await switchAccount(page, /analyst/i, 'Admin', /^admin$/i)
  await page.goto('/admin/settings')
  const macro = panel(page, 'Macro and FX')
  await macro.getByRole('button', { name: 'Remove TRY' }).click()
  await macro.getByRole('button', { name: 'Move CAD up' }).click()
  await macro
    .getByRole('combobox', { name: 'Add a currency to “Cross-rate matrix”' })
    .selectOption('CHF')
  await macro.getByRole('button', { name: 'Save the currencies' }).click()
  await expect(page.getByText('Currencies saved.')).toBeVisible()

  await page.getByRole('link', { name: /AUDT/ }).click()
  const entry = panel(page, 'Audit log').getByRole('row').nth(1)
  await expect(entry).toContainText('Macro and FX settings')
  await expect(entry).toContainText(
    'FX currencies against XAF: USD, GBP, CHF, JPY, CNY, ZAR, INR, TRY, BRL, CAD → USD, GBP, CHF, JPY, CNY, ZAR, INR, CAD, BRL',
  )
  await expect(entry).toContainText(
    'FX matrix currencies: EUR, USD, GBP, CNY, XAF → EUR, USD, GBP, CNY, XAF, CHF',
  )

  await switchAccount(page, /^admin$/i, 'Analyst', /analyst/i)
  await page.goto('/fx')
  const crosses = panel(page, 'Cross rates against XAF')
  await expect(crosses.getByRole('row', { name: /^CAD / })).toBeVisible()
  await expect(crosses.getByRole('row', { name: /^TRY / })).toHaveCount(0)
  const codes = await crosses.getByRole('row').allInnerTexts()
  expect(codes.map((row) => row.slice(0, 3)).slice(-2)).toEqual(['CAD', 'BRL'])
  await expect(
    panel(page, 'Cross-rate matrix').getByRole('columnheader', { name: 'CHF' }),
  ).toBeVisible()

  // The demo's currencies again, for the flows that read the mockup's.
  await switchAccount(page, /analyst/i, 'Admin', /^admin$/i)
  const refresh = await page.request.post('/api/v1/auth/refresh')
  const { accessToken } = (await refresh.json()) as { accessToken: string }
  const restored = await page.request.put('/api/v1/admin/macro/settings', {
    headers: { Authorization: `Bearer ${accessToken}` },
    data: {
      fxCurrencies: ['USD', 'GBP', 'CHF', 'JPY', 'CNY', 'ZAR', 'INR', 'TRY', 'BRL', 'CAD'],
      matrixCurrencies: ['EUR', 'USD', 'GBP', 'CNY', 'XAF'],
    },
  })
  expect(restored.ok()).toBe(true)
})
