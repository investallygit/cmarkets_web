import { readFile } from 'node:fs/promises'
import { expect, test, type Page } from '@playwright/test'
import { NO_SESSION, logIn } from './session.js'

// ROADMAP step 57: screen 30, DL (fifth version): from the user menu, the mockup's prices
// previewed and downloaded, "My downloads" and "My limits"; a file above 50,000 rows prepared in
// the background until ExportReady; a Student's CSV only and year of history.

const panel = (page: Page, title: string | RegExp) =>
  page.locator('section', { has: page.getByRole('heading', { name: title, exact: true }) })

/** An access token for the API's own calls, as the screens get theirs. */
async function accessToken(page: Page): Promise<string> {
  const refresh = await page.request.post('/api/v1/auth/refresh')
  return ((await refresh.json()) as { accessToken: string }).accessToken
}

test('DL from the user menu: the mockup prices previewed, downloaded as CSV, listed and counted', async ({
  page,
}) => {
  await page.goto('/mkt')
  await page
    .getByRole('banner')
    .getByRole('button', { name: /analyst/i })
    .click()
  await page.getByRole('menuitem', { name: 'Data download' }).click()
  await expect(page).toHaveURL(/\/dl$/)

  const datasets = panel(page, 'Datasets')
  for (const name of ['Historical prices', 'Bonds', 'Yield curves', 'FX', 'Commodities', 'Indices'])
    await expect(datasets.getByRole('button', { name: new RegExp(`^${name}`) })).toBeVisible()
  await expect(datasets.getByRole('button', { name: /^Historical prices/ })).toHaveAttribute(
    'aria-pressed',
    'true',
  )

  const settings = panel(page, 'Historical prices · Settings')
  await expect(settings.getByText('Securities (3)')).toBeVisible()
  for (const code of ['SEMC', 'BANGE', 'IWDA'])
    await expect(settings.getByRole('button', { name: `Remove ${code}` })).toBeVisible()
  const preview = panel(page, 'Preview · SEMC')
  await expect(preview.getByRole('row')).toHaveCount(11)
  await expect(preview).toContainText('On days without trading, BVMAC publishes no price')
  await expect(settings).toContainText(/Estimate: [\d,]+ rows · about/)

  await settings.getByText('CSV', { exact: true }).click()
  await expect(settings.getByRole('radio', { name: 'CSV' })).toBeChecked()
  await expect(settings.getByRole('radio', { name: 'One sheet per security' })).toBeDisabled()
  await settings.getByText('Volume', { exact: true }).click()
  await expect(settings.getByRole('checkbox', { name: 'Volume' })).not.toBeChecked()
  await expect(preview.getByRole('columnheader', { name: 'Volume' })).toHaveCount(0)

  const limits = panel(page, 'My limits')
  const used = async () =>
    Number((/Downloads per day\s*(\d+) \/ 50/.exec((await limits.textContent()) ?? '') ?? [])[1])
  const before = await used()
  const download = page.waitForEvent('download')
  await settings.getByRole('button', { name: 'Download' }).click()
  const file = await download
  expect(file.suggestedFilename()).toMatch(/^prices-SEMC-BANGE-IWDA-\d{4}-\d{2}-\d{2}\.csv$/)
  const text = await readFile((await file.path())!, 'utf8')
  expect(text).toContain('Source: BVMAC · EODHD')
  expect(text).toContain('Personal or internal use only')
  expect(text).toContain('Code,Date,Open,High,Low,Close,Change %,Currency')
  await expect(page.getByText(/prices-SEMC-BANGE-IWDA-.*\.csv downloaded\./)).toBeVisible()

  const mine = panel(page, 'My downloads')
  await expect(mine.getByRole('listitem').first()).toContainText('Historical prices')
  await expect(mine.getByRole('listitem').first()).toContainText('Ready')
  await expect.poll(used).toBe(before + 1)

  await mine
    .getByRole('button', { name: /^Delete Historical prices/ })
    .first()
    .click()
  await expect(page.getByText('Historical prices deleted.')).toBeVisible()
})

test('a file above 50,000 rows is prepared in the background, then ExportReady says it is ready', async ({
  page,
}) => {
  test.setTimeout(90_000)
  await page.goto('/dl')
  await expect(panel(page, 'My downloads')).toBeVisible()
  const token = await accessToken(page)
  const headers = { Authorization: `Bearer ${token}` }
  const codes: string[] = []
  for (const type of ['equity', 'etf']) {
    const listed = await page.request.get(`/api/v1/securities?type=${type}`, { headers })
    codes.push(...((await listed.json()) as { code: string }[]).map((security) => security.code))
  }
  const started = await page.request.post('/api/v1/exports', {
    headers,
    data: {
      dataset: 'prices',
      securities: codes,
      from: '2006-01-01',
      to: new Date().toISOString().slice(0, 10),
      format: 'csv',
    },
  })
  expect(started.status()).toBe(202)
  expect(((await started.json()) as { rows: number }).rows).toBeGreaterThan(50_000)

  // The job's ExportReady reaches the screen: a toast, and "My downloads" reads its file.
  await expect(page.getByText(/prices-.*\.csv is ready in My downloads\./)).toBeVisible({
    timeout: 60_000,
  })
  const mine = panel(page, 'My downloads')
  await expect(mine.getByRole('listitem').first()).toContainText('Ready')
  await expect(mine.getByRole('listitem').first()).toContainText(
    `${codes.slice(0, 3).join(', ')} +`,
  )
})

test.describe('a Student', () => {
  test.use({ storageState: NO_SESSION })

  test('downloads CSV only, over the last year, four datasets', async ({ page }) => {
    await page.goto('/login')
    await logIn(page, 's.mvondo@university.example')
    await page.goto('/dl')

    await expect(page.getByRole('list', { name: 'Datasets' }).getByRole('button')).toHaveCount(4)
    const settings = panel(page, 'Historical prices · Settings')
    await expect(settings.getByRole('radio', { name: 'CSV' })).toBeChecked()
    await expect(settings.getByRole('radio', { name: 'XLSX' })).toBeDisabled()
    await expect(settings.getByText('Your profile downloads CSV only.')).toBeVisible()
    const limits = panel(page, 'My limits')
    await expect(limits).toContainText('Student profile')
    await expect(limits).toContainText(/Downloads per day\s*\d+ \/ 5/)
    await expect(limits).toContainText(/Rows per file\s*10,000 \(CSV only\)/)
    await expect(limits).toContainText(/History available\s*since \d{2}\/\d{2}\/\d{4}/)

    // Two years back: the server says the profile's history.
    await settings.getByRole('textbox', { name: 'From' }).fill('01/01/2024')
    await expect(settings).toContainText(/Your profile reaches back to/)
    await expect(settings.getByRole('button', { name: 'Download' })).toBeDisabled()
  })
})

test("a panel's Download button opens DL filled in, whose file is scheduled every month", async ({
  page,
}) => {
  await page.goto('/securities/SEMC/des')
  await panel(page, 'Prices of recent sessions')
    .getByRole('link', { name: 'Download SEMC' })
    .click()
  await expect(page).toHaveURL(/\/dl\?dataset=prices&items=SEMC$/)
  const settings = panel(page, 'Historical prices · Settings')
  await expect(settings.getByText('Securities (1)')).toBeVisible()
  await expect(panel(page, 'Preview · SEMC').getByRole('row')).toHaveCount(11)

  await settings.getByRole('button', { name: 'Schedule' }).click()
  const dialog = page.getByRole('dialog', { name: 'Schedule this export' })
  await dialog.getByText('first of the month', { exact: true }).click()
  await dialog.getByRole('button', { name: 'Schedule' }).click()
  await expect(page.getByText(/^Scheduled: SEMC · /)).toBeVisible()
  const scheduled = page.getByRole('region', { name: 'Scheduled exports' })
  await expect(scheduled).toContainText('Monthly')

  await scheduled
    .getByRole('button', { name: /^Stop the scheduled export Historical prices/ })
    .click()
  await expect(page.getByText('Scheduled export stopped.')).toBeVisible()
  await expect(scheduled).toHaveCount(0)
})

test('the Admin reads the download log and keeps EODHD on the screens only', async ({ page }) => {
  test.setTimeout(60_000)
  const topBar = page.getByRole('banner')
  const switchTo = async (from: RegExp, account: string, badge: RegExp) => {
    await topBar.getByRole('button', { name: from }).click()
    await page.getByRole('menuitemradio', { name: account, exact: true }).click()
    await expect(topBar.getByRole('button', { name: badge })).toBeVisible()
  }
  await page.goto('/cfg')
  await switchTo(/analyst/i, 'Admin', /admin/i)
  await page.goto('/admin/users')
  const log = panel(page, 'Download log')
  await expect(log.getByRole('row', { name: /Historical prices/ }).first()).toBeVisible()

  await page.goto('/admin/settings')
  const exports = panel(page, 'Data download')
  await exports.getByText('EODHD', { exact: true }).click()
  await exports.getByRole('button', { name: 'Save' }).click()
  await expect(page.getByText('Data download settings saved.')).toBeVisible()

  await switchTo(/admin/i, 'Analyst', /analyst/i)
  await page.goto('/dl')
  await expect(page.getByText(/Not downloadable, kept on the screens: EODHD/)).toBeVisible()
  await expect(
    page.getByRole('list', { name: 'Datasets' }).getByRole('button', { name: /^FX/ }),
  ).toHaveCount(0)

  // EODHD back on, as the demo has it.
  await switchTo(/analyst/i, 'Admin', /admin/i)
  await page.goto('/admin/settings')
  await panel(page, 'Data download').getByText('EODHD', { exact: true }).click()
  await panel(page, 'Data download').getByRole('button', { name: 'Save' }).click()
  await expect(page.getByText('Data download settings saved.')).toBeVisible()
  await switchTo(/admin/i, 'Analyst', /analyst/i)
})
