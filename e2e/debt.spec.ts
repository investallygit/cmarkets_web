import { expect, test, type Page } from '@playwright/test'

// DEBT (screen 35, sixth version), ROADMAP step 66: `DEBT CMR` from the command bar; the Analyst
// reads Cameroon's indicators, its redemption schedule, the CEMAC comparison (a row opens Gabon),
// the ratings marked as examples and a document; a security's double click opens its profile,
// whose link comes back; ECO opens DEBT. The Admin hides the ratings in ADMCFG.

async function switchAccount(page: Page, from: RegExp, account: string, badge: RegExp) {
  const topBar = page.getByRole('banner')
  await topBar.getByRole('button', { name: from }).click()
  await page.getByRole('menuitemradio', { name: account, exact: true }).click()
  await expect(topBar.getByRole('button', { name: badge })).toBeVisible()
}

const panel = (page: Page, title: string | RegExp) =>
  page.locator('section').filter({ has: page.getByRole('heading', { name: title }) })

test('DEBT CMR shows the indicators, the schedule, the comparison, the securities, the ratings and documents', async ({
  page,
}) => {
  await page.goto('/mkt')
  const command = page.getByRole('combobox', { name: 'Command bar' })
  await command.fill('DEBT CMR')
  await command.press('Enter')
  await expect(page).toHaveURL(/\/debt\?country=CMR$/)

  const bar = page.getByRole('group', { name: 'Country' })
  await expect(bar.getByRole('button', { name: 'CMR Cameroon' })).toHaveAttribute(
    'aria-pressed',
    'true',
  )
  await expect(bar).toContainText(/Outstanding at \d{2}\/\d{2}\/\d{4}/)
  const indicators = page.getByRole('region', { name: 'Debt indicators' })
  await expect(indicators).toContainText(/Government securities outstanding\s*XAF [\d,]+ bn/)
  await expect(indicators).toContainText(/Of which BTA \/ OTA\s*[\d,]+ \/ [\d,]+ bn/)
  await expect(indicators).toContainText(/Average maturity\s*\d\.\d yrs/)
  await expect(indicators).toContainText(/Weighted average rate\s*\d\.\d\d%/)
  await expect(indicators).toContainText(/Rating \(example\)\s*B- \/ Caa1/)

  const schedule = panel(page, 'Redemption schedule')
  await expect(schedule.getByRole('img', { name: /^Principal to repay by Cameroon/ })).toBeVisible()
  await expect(schedule).toContainText(/Total: [\d,]+ bn\. Maturing BTAs are usually rolled over/)

  const documents = panel(page, 'Ratings and documents')
  await expect(documents).toContainText(/S&P Global\s*B- \(example\)\s*stable/)
  await expect(documents).toContainText(/Fitch\s*not rated/)
  await documents.getByRole('button', { name: 'PDF of Debt statistics bulletin' }).click()
  const pdf = page.getByRole('dialog', { name: 'Debt statistics bulletin' })
  await expect(pdf).toBeVisible()
  await page.keyboard.press('Escape')
  await expect(pdf).toBeHidden()

  // The six states, the largest first; a row opens its state.
  const compare = panel(page, 'CEMAC comparison')
  await expect(compare.getByRole('row').nth(1)).toContainText(/^CMR/)
  await expect(compare.getByRole('row')).toHaveCount(7)
  await compare.getByRole('row', { name: /^GAB/ }).click()
  await expect(page).toHaveURL(/\/debt\?country=GAB$/)
  await expect(documents).toContainText(/Moody's\s*Caa2 \(example\)\s*negative/)
  await bar.getByRole('button', { name: 'CEMAC All' }).click()
  await expect(indicators).toContainText(/Rating\s*By state/)
  await expect(documents).toContainText('Pick a state for its ratings.')
  await bar.getByRole('button', { name: 'CMR Cameroon' }).click()

  // A security's double click opens its profile, whose link comes back to DEBT.
  const securities = panel(page, 'Outstanding securities')
  await expect(securities).toContainText(/\d+ securities · double-click: profile/)
  const ota = securities.getByRole('row', { name: /^OTA CMR 6\.25% \d{4}-\d{4}/ })
  await expect(ota).toContainText(
    /OTA\s*\d{2}\/\d{2}\/\d{4}\s*\d{2}\/\d{2}\/\d{4}\s*400\.0\s*6\.25%/,
  )
  await ota.dblclick()
  await expect(page).toHaveURL(/\/securities\/OTA-CM-6\.25-\d{4}/)
  await page.getByRole('link', { name: 'Sovereign debt (DEBT CMR)' }).click()
  await expect(page).toHaveURL(/\/debt\?country=CMR$/)

  // ECO's sovereign rates open DEBT.
  await page.goto('/eco')
  await page.getByRole('link', { name: 'Sovereign debt (DEBT)' }).click()
  await expect(page).toHaveURL(/\/debt$/)
  await expect(bar.getByRole('button', { name: 'CMR Cameroon' })).toHaveAttribute(
    'aria-pressed',
    'true',
  )
})

test('The Admin hides the agencies’ ratings in ADMCFG, and DEBT shows none @fresh-db', async ({
  page,
}) => {
  await page.goto('/cfg')
  await switchAccount(page, /analyst/i, 'Admin', /^admin$/i)
  await page.goto('/admin/settings')
  const settings = panel(page, 'Platform settings')
  const ratings = settings.getByRole('switch', {
    name: "Show the agencies' sovereign ratings on DEBT",
  })
  await expect(ratings).toBeChecked()
  await ratings.uncheck({ force: true })
  await settings.getByRole('button', { name: 'Save the settings' }).click()
  await expect(
    page.getByText('Settings saved; each change is written to the audit log.'),
  ).toBeVisible()

  await switchAccount(page, /^admin$/i, 'Analyst', /analyst/i)
  await page.goto('/debt?country=CMR')
  await expect(page.getByRole('region', { name: 'Debt indicators' })).toContainText(
    /Rating\s*Hidden/,
  )
  await expect(panel(page, 'Ratings and documents')).toContainText(
    "The agencies' ratings are hidden until their licences are confirmed (ADMCFG).",
  )
})
