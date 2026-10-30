import { expect, test, type Page } from '@playwright/test'

// Portfolio screen of step 5 (ROADMAP.md): PORT and its tabs.

const panel = (page: Page, title: string | RegExp) =>
  page.locator('section', { has: page.getByRole('heading', { name: title, exact: true }) })

const csv = (rows: string[]) => ({
  name: 'transactions.csv',
  mimeType: 'text/csv',
  buffer: Buffer.from(['date;type;security;quantity;price;fees;amount;note', ...rows].join('\n')),
})

/** The prototype's account switch reloads the app: wait for the new account's badge. */
async function switchAccount(page: Page, account: string, badge: RegExp) {
  await page.goto('/mkt')
  await page.getByRole('button', { name: /analyst/i }).click()
  await page.getByRole('menuitem', { name: account }).click()
  await expect(page.getByRole('button', { name: badge })).toBeVisible()
}

test('the sample fund shows the lines of the screen 5 mockup', async ({ page }) => {
  await page.goto('/port')
  await expect(page).toHaveURL(/\/port\/portfolio-cemac$/)
  const positions = panel(page, 'Valued positions')
  // The quantities of the mockup; REGIONALE weighs more than the 12% limit on one issuer.
  await expect(positions.getByRole('row', { name: /^REGIONALE/ })).toContainText('9,500')
  await expect(positions.getByRole('row', { name: /^REGIONALE/ })).toContainText('▲')
  await expect(positions.getByRole('row', { name: /^ECMR 6.25% 29/ })).toContainText('15,000')
  await expect(positions.getByText('Cash XAF')).toBeVisible()
  await expect(panel(page, 'Risk metrics').getByText('limit: 12.0%')).toBeVisible()
  await expect(
    panel(page, 'Upcoming income').getByRole('row', { name: /ECMR 6.25% 29/ }),
  ).toContainText('Coupon + amort.')
  await expect(page.getByText('Upcoming income (3 months)')).toBeVisible()
})

test('a purchase is recorded and a sale of more than held is refused', async ({ page }) => {
  await page.goto('/port')
  const positions = panel(page, 'Valued positions')
  await expect(positions.getByRole('row', { name: /^SEMC/ })).toContainText('2,300')

  await page.getByRole('button', { name: 'New transaction' }).click()
  const form = page.getByRole('dialog')
  await form.getByRole('combobox', { name: 'Security' }).fill('SEMC')
  await form.getByRole('option', { name: /SEMC/ }).first().click()
  await form.getByRole('textbox', { name: 'Quantity' }).fill('100')
  await form.getByRole('textbox', { name: 'Price' }).fill('52500')
  await form.getByRole('textbox', { name: 'Fees' }).fill('3000')
  await expect(form.getByText('Cash: -5,253,000 XAF, fees included')).toBeVisible()
  await form.getByRole('button', { name: 'Record' }).click()
  await expect(form).toBeHidden()
  await expect(positions.getByRole('row', { name: /^SEMC/ })).toContainText('2,400')

  // "Sell SIAT…" fills in the 4,100 held; more is refused by the server.
  await positions.getByRole('row', { name: /^SIAT/ }).click({ button: 'right' })
  await page.getByRole('menuitem', { name: 'Sell SIAT…' }).click()
  await expect(form.getByRole('textbox', { name: 'Quantity' })).toHaveValue('4,100')
  await form.getByRole('textbox', { name: 'Quantity' }).fill('5000')
  await form.getByRole('button', { name: 'Record' }).click()
  await expect(form.getByText(/^4,100 held on/)).toBeVisible()
})

test('transactions are imported from the template, all rows or none', async ({ page }) => {
  await page.goto('/port/portfolio-cemac/transactions')
  const history = panel(page, 'Transactions')
  await history.getByRole('button', { name: 'Import CSV' }).click()
  const dialog = page.getByRole('dialog')
  await dialog
    .locator('input[type=file]')
    .setInputFiles(csv(['2026-10-28;deposit;;;;;5000000;Top-up', '2026-10-28;buy;XYZ;10;100;0;;']))
  await dialog.getByRole('button', { name: 'Import' }).click()
  await expect(dialog.getByText('Line 3 · security: Unknown security.')).toBeVisible()

  await dialog
    .locator('input[type=file]')
    .setInputFiles(csv(['28/10/2026;deposit;;;;;5 000 000;Top-up']))
  await dialog.getByRole('button', { name: 'Import' }).click()
  await expect(dialog).toBeHidden()
  await expect(history.getByRole('row', { name: /Top-up/ })).toContainText('+5,000,000')
})

test('performance is time-weighted and the risk checked against the limits', async ({ page }) => {
  await page.goto('/port/portfolio-cemac/performance')
  const returns = panel(page, 'Returns by period')
  for (const period of ['Year to date', '1 year', '3 years', 'Since inception']) {
    await expect(returns.getByRole('row', { name: new RegExp(`^${period}`) })).toBeVisible()
  }
  await page.getByRole('link', { name: 'Risk', exact: true }).click()
  const limits = panel(page, 'Limits')
  await expect(limits.getByRole('row', { name: /Weight of one issuer/ })).toContainText('Breached')
  await expect(limits.getByRole('row', { name: /^Volatility/ })).toContainText('Within')
  await expect(panel(page, 'Issuer concentration').getByRole('listitem').first()).toContainText(
    'La Régionale',
  )
})

test('a Portfolio manager generates the PDF report', async ({ page }) => {
  await switchAccount(page, 'Portfolio manager', /manager/i)
  await page.goto('/port/portfolio-cemac/reports')
  const form = panel(page, 'PDF report')
  await form.getByRole('textbox', { name: 'Comments' }).fill('Third quarter review.')
  await form.getByRole('button', { name: 'Generate the PDF' }).click()
  await expect(panel(page, 'Reports generated').getByText('Ready')).toBeVisible({
    timeout: 10_000,
  })
  await expect(page.locator('iframe[title="CEMAC Equity Fund"]')).toBeAttached()
})

test('a Student simulates allocations with model portfolios', async ({ page }) => {
  await switchAccount(page, 'Student', /student/i)
  await page.goto('/port')
  await expect(page.getByRole('button', { name: /CEMAC selection/ })).toBeVisible()
  await expect(page.getByRole('button', { name: 'New transaction' })).toHaveCount(0)
  await expect(page.getByRole('button', { name: 'Edit allocation' })).toBeVisible()
  const tabs = page.getByRole('navigation', { name: 'Portfolio tabs' })
  await expect(tabs.getByRole('link', { name: 'Transactions' })).toHaveCount(0)
  await tabs.getByRole('link', { name: 'Reports' }).click()
  await expect(
    page.getByText('PDF client reports come with a Portfolio manager account.'),
  ).toBeVisible()
})
