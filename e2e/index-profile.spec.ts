import { expect, test, type Page } from '@playwright/test'

// ROADMAP step 56: screen 31, the index profile (fifth version): opened from MKT or the command
// bar, its header and its five tabs, the constituents and their contributions, the composition on
// a date, the methodology documents, and BVMAC's reviews loaded on IMP (ROADMAP decision 44).

async function switchAccount(page: Page, from: RegExp, account: string, badge: RegExp) {
  const topBar = page.getByRole('banner')
  await topBar.getByRole('button', { name: from }).click()
  await page.getByRole('menuitemradio', { name: account, exact: true }).click()
  await expect(topBar.getByRole('button', { name: badge })).toBeVisible()
}

const panel = (page: Page, title: string | RegExp) =>
  page.locator('section', { has: page.getByRole('heading', { name: title, exact: true }) })

test('MKT opens BVMAC-A, whose DES shows its value, sessions and constituents', async ({
  page,
}) => {
  await page.goto('/mkt')
  await panel(page, 'Indices')
    .getByRole('row', { name: /BVMAC Equities/ })
    .dblclick()
  await expect(page).toHaveURL(/\/indices\/BVMAC-A\/des$/)
  await expect(page.getByRole('heading', { level: 1, name: 'BVMAC-A' })).toBeVisible()
  await expect(page.getByText(/Price index · cap-weighted · 7 constituents/)).toBeVisible()

  const tabs = page.getByRole('navigation', { name: 'Index profile tabs' })
  for (const name of ['DES Profile', 'GP Chart', 'MEMB Constituents', 'PERF Performance'])
    await expect(tabs.getByRole('link', { name })).toBeVisible()
  await expect(tabs.getByRole('link', { name: 'DOC Methodology' })).toBeVisible()

  const value = panel(page, 'Index value')
  await expect(value.getByRole('tab', { name: '5Y' })).toBeVisible()
  await expect(value.getByRole('tab', { name: '10Y' })).toHaveCount(0)
  await value.getByRole('button', { name: 'Base 100' }).click()
  await expect(value).toContainText('Both lines based 100 on their first common session.')

  const sessions = panel(page, 'Values of recent sessions')
  await expect(sessions.getByRole('row').nth(1)).toBeVisible()

  // The seven members of the last review.
  const constituents = panel(page, 'Constituents')
  await expect(constituents.getByRole('row')).toHaveCount(8)
  await expect(constituents.getByRole('row').nth(1)).toContainText(/\d+\.\d%/)
  await expect(constituents.getByText(/^Sum of contributions: /)).toBeVisible()
  await expect(constituents).toContainText('those BVMAC published at its last review')

  await expect(panel(page, 'Performance and risk')).toContainText('1-year volatility')
  await expect(panel(page, 'Description')).toContainText('Source: Index methodology (DOC tab)')

  // A double click on a constituent opens its profile.
  await constituents.getByRole('row', { name: /SEMC/ }).dblclick()
  await expect(page).toHaveURL(/\/securities\/SEMC\/des$/)
})

// @fresh-db: BVMAC's weights moved by each price since its review; the contributions add up to the
// index's change, to rounding. Another flow's price file moves the prices without BVMAC's level.
test("BVMAC-A's contributions add up to its change", { tag: '@fresh-db' }, async ({ page }) => {
  await page.goto('/indices/BVMAC-A/des')
  const sum = panel(page, 'Constituents').getByText(/^Sum of contributions: /)
  const [contributions, change] = ((await sum.textContent()) ?? '')
    .match(/[+−-]?\d+\.\d+/g)!
    .map((figure) => Number(figure.replace('−', '-')))
  expect(Math.abs(contributions! - change!)).toBeLessThanOrEqual(0.05)
})

test('the command bar opens a CMarket index, weighted by capitalisation', async ({ page }) => {
  await page.goto('/mkt')
  await expect(page.getByRole('heading', { name: 'Indices' })).toBeVisible()
  await page.keyboard.press('Control+K')
  await page.keyboard.type('CMK-BANK DES')
  await page.keyboard.press('Enter')
  await expect(page).toHaveURL(/\/indices\/CMK-BANK\/des$/)
  await expect(panel(page, 'Constituents')).toContainText(
    "Weights: each constituent's capitalisation at the previous close.",
  )
  await expect(panel(page, 'Methodology and notices')).toContainText('methodology')
})

test('MEMB, PERF, GP and DOC: the composition on a date, the returns and the methodology', async ({
  page,
}) => {
  await page.goto('/indices/BVMAC-A/memb')
  const constituents = panel(page, 'Constituents')
  await expect(constituents.getByRole('columnheader', { name: 'Entry' })).toBeVisible()
  // The review in force in the summer, which the one of 30 September ended.
  await constituents.getByRole('textbox', { name: 'Composition on' }).fill('15/07/2026')
  const bange = constituents.getByRole('row', { name: /BANGE/ })
  await expect(bange).toContainText('30/06/2026')
  await expect(bange).toContainText('30/09/2026')
  const download = page.waitForEvent('download')
  await constituents.getByRole('button', { name: 'Constituent history (XLSX)' }).click()
  expect((await download).suggestedFilename()).toBe('BVMAC-A-constituent-history.xlsx')

  const tabs = page.getByRole('navigation', { name: 'Index profile tabs' })
  await tabs.getByRole('link', { name: 'PERF Performance' }).click()
  await expect(page).toHaveURL(/\/indices\/BVMAC-A\/perf$/)
  await expect(
    panel(page, 'Returns by month').getByRole('columnheader', { name: 'Year' }).first(),
  ).toBeVisible()
  await expect(panel(page, 'Performance and risk')).toContainText('1-year max drawdown')

  await tabs.getByRole('link', { name: 'GP Chart' }).click()
  await expect(panel(page, 'Index value').getByRole('tab', { name: '10Y' })).toBeVisible()

  await tabs.getByRole('link', { name: 'DOC Methodology' }).click()
  const list = panel(page, 'Methodology and notices')
  await list.getByRole('button', { name: /BVMAC Equity Index methodology/ }).click()
  await expect(page).toHaveURL(/\/indices\/BVMAC-A\/doc\?doc=/)
  await expect(
    page.getByRole('heading', { name: 'BVMAC Equity Index methodology', exact: true }),
  ).toBeVisible()
  await expect(
    list.getByRole('button', { name: /BVMAC Equity Index methodology/ }),
  ).toHaveAttribute('aria-current', 'true')
})

test('IMP loads a BVMAC review, shown at once on MEMB, which a rollback takes back @fresh-db', async ({
  page,
}) => {
  test.setTimeout(60_000)
  // The review takes effect from its date's session: the last one, as MEMB names it.
  await page.goto('/indices/BVMAC-A/memb')
  const options = panel(page, 'Constituents').getByText(/^7 constituents · /)
  const [date, month, year] = ((await options.textContent()) ?? '').slice(-10).split('/')
  const onDay = `${date}/${month}/${year}`
  const day = `${year}-${month}-${date}`
  await switchAccount(page, /analyst/i, 'Data admin', /data admin/i)
  await page.goto('/imp?import=new')
  const form = panel(page, 'New upload')
  await form.getByRole('combobox', { name: 'File type' }).selectOption('index-constituents')
  const csv = [
    'date;index;code;weight',
    `${day};BVMAC-A;BANGE;40`,
    `${day};BVMAC-A;SAFACAM;35`,
    `${day};BVMAC-A;SEMC;25`,
  ].join('\r\n')
  await form.locator('input[type=file]').setInputFiles({
    name: 'constituents_e2e.csv',
    mimeType: 'text/csv',
    buffer: Buffer.from(csv),
  })
  await form.getByRole('button', { name: 'Upload and check' }).click()
  const upload = panel(page, 'Current upload: constituents_e2e.csv')
  await upload.getByRole('button', { name: /^Publish 3 rows/ }).click()
  await expect(upload.getByText(/^Published .* 3 rows\.$/)).toBeVisible()

  await switchAccount(page, /data admin/i, 'Analyst', /analyst/i)
  await page.goto('/indices/BVMAC-A/memb')
  const constituents = panel(page, 'Constituents')
  await constituents.getByRole('textbox', { name: 'Composition on' }).fill(onDay)
  await expect(constituents.getByRole('row')).toHaveCount(4)
  await expect(constituents.getByRole('row', { name: /BANGE/ })).toContainText('40.0%')

  await switchAccount(page, /analyst/i, 'Data admin', /data admin/i)
  await page.goto('/data/history')
  const history = panel(page, 'Upload history')
  await history.getByRole('combobox', { name: 'File type' }).selectOption('index-constituents')
  const row = history.getByRole('row', { name: /constituents_e2e\.csv/ }).first()
  await row.click({ button: 'right' })
  await page.getByRole('menuitem', { name: 'Roll back…' }).click()
  const rollBack = page.getByRole('dialog', { name: 'Roll back the publication' })
  await rollBack.getByRole('textbox', { name: 'Reason' }).fill('A test review.')
  await rollBack.getByRole('button', { name: 'Roll back' }).click()
  await expect(row).toContainText('Rolled back')

  await switchAccount(page, /data admin/i, 'Analyst', /analyst/i)
  await page.goto('/indices/BVMAC-A/memb')
  await panel(page, 'Constituents').getByRole('textbox', { name: 'Composition on' }).fill(onDay)
  await expect(panel(page, 'Constituents').getByRole('row')).toHaveCount(8)
})
