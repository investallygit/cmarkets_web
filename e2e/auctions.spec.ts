import { expect, test, type Page } from '@playwright/test'

// AUC, AUC NEXT and APE (screen 33, sixth version), ROADMAP step 64: the Analyst reads the
// indicators, the results, a result's bids by rate and its security's rates, the coming auctions
// and the public bond issues; the Data admin loads a Treasury's calendar and the result that
// completes it, and enters a public issue in CORR.

async function switchAccount(page: Page, from: RegExp, account: string, badge: RegExp) {
  const topBar = page.getByRole('banner')
  await topBar.getByRole('button', { name: from }).click()
  await page.getByRole('menuitemradio', { name: account, exact: true }).click()
  await expect(topBar.getByRole('button', { name: badge })).toBeVisible()
}

const panel = (page: Page, title: string | RegExp) =>
  page.locator('section').filter({ has: page.getByRole('heading', { name: title }) })

test('AUC shows the indicators, the results, the bids of a result and its rates; AUC NEXT and APE', async ({
  page,
}) => {
  // YCRV's auctions panel opens AUC on a state.
  await page.goto('/cal')
  const latest = panel(page, 'Latest government securities auctions (BEAC)')
  await latest.getByRole('combobox', { name: 'Country' }).selectOption('CM')
  await latest.getByRole('link', { name: 'All auctions (AUC)' }).click()
  await expect(page).toHaveURL(/\/auc\?country=CM$/)
  await expect(page.getByRole('group', { name: 'Filters of the results' })).toBeVisible()
  await expect(page.getByRole('combobox', { name: 'Country' }).first()).toHaveValue('CM')

  const indicators = page.getByRole('region', { name: 'Primary market indicators' })
  await expect(indicators).toContainText(/Amount raised in \d{4}\s*XAF [\d,]+ bn/)
  await expect(indicators).toContainText(/Average cover\s*\d+%/)
  await expect(indicators).toContainText(/CMR OTA 5 yr · last\s*6\.60%/)
  await expect(indicators).toContainText(/Next\s*CMR /)

  // Cameroon's 5-year OTA of screen 4: its bids by rate, the cut-off at the marginal rate.
  const results = panel(page, 'Latest results')
  const row = results.getByRole('row', { name: /OTA 5 yr/ }).first()
  await expect(row).toContainText('40.0')
  await expect(row).toContainText('130%')
  await row.click()
  const detail = panel(page, /^Detail · CMR OTA 5 yr of \d{2}\/\d{2}\/\d{4}$/)
  await expect(detail.getByRole('img', { name: /up to the marginal rate of 6\.70%/ })).toBeVisible()
  await expect(detail).toContainText(/Amount bid\s*XAF 52\.1 bn/)
  await expect(detail).toContainText(/Bidders\s*\d+ SVTs/)
  await expect(detail).toContainText(/Security\s*OTA CMR 5 yr/)
  // The chart follows the result's tenor.
  await expect(panel(page, 'OTA 5 yr average rate')).toContainText('By country · 24 months')

  // AUC NEXT: the Treasuries' coming auctions; APE: the public bond issues.
  const tabs = page.getByRole('navigation', { name: 'BTA and OTA auctions' })
  await tabs.getByRole('link', { name: /Upcoming/ }).click()
  await expect(page).toHaveURL(/\/auc\/next$/)
  await expect(panel(page, 'Upcoming auctions').getByRole('row')).toHaveCount(9)
  await tabs.getByRole('link', { name: /Public bond issues/ }).click()
  const offers = panel(page, 'Public bond issues')
  await expect(offers.getByRole('row', { name: /Republic of Cameroon \(example\)/ })).toContainText(
    'Open',
  )
  await expect(offers.getByRole('row', { name: /Alios Finance/ })).toContainText('16.2')
})

test('CORR enters a public bond issue that APE lists, then deletes it', async ({ page }) => {
  await page.goto('/mkt')
  await switchAccount(page, /analyst/i, 'Data admin', /data admin/i)
  await page.goto('/data/corrections')
  const editor = panel(page, 'Public bond issues (APE)')
  await editor.getByRole('button', { name: 'New issue' }).click()
  const dialog = page.getByRole('dialog', { name: 'Public bond issue' })
  await dialog.getByRole('button', { name: 'Save' }).click()
  await expect(dialog).toContainText('Required.')
  await dialog.getByRole('textbox', { name: 'Issuer' }).fill('E2E Energy SA')
  await dialog.getByText('Corporate', { exact: true }).click()
  await dialog.getByRole('combobox', { name: 'Country' }).selectOption('GA')
  await dialog.getByRole('textbox', { name: 'Amount sought (XAF M)' }).fill('12000')
  await dialog.getByRole('textbox', { name: 'Coupon (%)' }).fill('7.25')
  await dialog.getByRole('textbox', { name: 'Subscription from' }).fill('01/01/2030')
  await dialog.getByRole('textbox', { name: 'Subscription to' }).fill('31/01/2030')
  await dialog.getByRole('textbox', { name: 'Maturity' }).fill('31/01/2035')
  await dialog.getByRole('textbox', { name: 'Arranger' }).fill('Bank Y')
  await dialog.getByRole('button', { name: 'Save' }).click()
  await expect(page.getByText('Issue of E2E Energy SA saved.')).toBeVisible()

  await switchAccount(page, /data admin/i, 'Analyst', /analyst/i)
  await page.goto('/ape')
  await expect(
    panel(page, 'Public bond issues').getByRole('row', { name: /E2E Energy SA/ }),
  ).toContainText('Upcoming')

  await switchAccount(page, /analyst/i, 'Data admin', /data admin/i)
  await page.goto('/data/corrections')
  await panel(page, 'Public bond issues (APE)')
    .getByRole('button', { name: 'Delete E2E Energy SA' })
    .click()
  await page.getByRole('dialog').getByRole('button', { name: 'Delete E2E Energy SA' }).click()
  await expect(page.getByText('Issue of E2E Energy SA deleted.')).toBeVisible()
  await switchAccount(page, /data admin/i, 'Analyst', /analyst/i)
})

test('A Treasury calendar plans an auction that its result completes on AUC @fresh-db', async ({
  page,
}) => {
  test.setTimeout(90_000)
  await page.goto('/mkt')
  await switchAccount(page, /analyst/i, 'Data admin', /data admin/i)
  const upload = async (type: string, name: string, lines: (day: string) => string[]) => {
    await page.goto('/imp?import=new')
    const form = panel(page, 'New upload')
    await form.getByRole('combobox', { name: 'File type' }).selectOption(type)
    const session = form.getByRole('textbox', { name: 'Session' })
    await expect(session).toHaveValue(/^\d{2}\/\d{2}\/\d{4}$/)
    const [day, month, year] = (await session.inputValue()).split('/')
    await form.locator('input[type=file]').setInputFiles({
      name,
      mimeType: 'text/csv',
      buffer: Buffer.from(lines(`${year}-${month}-${day}`).join('\r\n')),
    })
    await form.getByRole('button', { name: 'Upload and check' }).click()
    const current = panel(page, `Current upload: ${name}`)
    await current.getByRole('button', { name: /^Publish 1 row/ }).click()
    await expect(current.getByText(/^Published .* 1 row\.$/)).toBeVisible()
    return `${day}/${month}/${year}`
  }

  const day = await upload('auction-calendar', 'calendrier_e2e.csv', (date) => [
    'date;country;security;offered;value_date',
    `${date};CM;BTA 52 wk;18000;`,
  ])
  await switchAccount(page, /data admin/i, 'Analyst', /analyst/i)
  await page.goto('/auc/next')
  // AUC NEXT lists from today: the session's auction is there while it waits for its result.
  await expect(
    panel(page, 'Upcoming auctions').getByRole('row', { name: new RegExp(`${day}.*BTA 52 wk`) }),
  ).toBeVisible()

  await switchAccount(page, /analyst/i, 'Data admin', /data admin/i)
  // The demo's results of the session wait for their checks: discarded, a session takes one.
  await page.goto('/imp')
  const pending = panel(page, /^Current upload: adjudications_beac_/)
  await pending.getByRole('button', { name: 'Discard' }).click()
  await page
    .getByRole('dialog', { name: 'Discard the upload' })
    .getByRole('button', { name: 'Discard' })
    .click()
  await expect(pending.getByText('Discarded: nothing of this file was published.')).toBeVisible()
  await upload('auctions', 'resultats_e2e.csv', (date) => [
    'date;country;security;offered;bids;allotted;avg_rate;marginal_rate;value_date;bidders;bids_by_rate',
    `${date};CM;BTA 52 wk;18000;27000;18000;5.40;5.48;;9;5.30:6000 | 5.40:8000 | 5.48:6000 | 5.60:7000`,
  ])

  await switchAccount(page, /data admin/i, 'Analyst', /analyst/i)
  await page.goto('/auc/next')
  await expect(panel(page, 'Upcoming auctions')).not.toContainText(new RegExp(`${day}.*BTA 52 wk`))
  await page.goto('/auc?country=CM')
  const row = panel(page, 'Latest results')
    .getByRole('row', { name: /BTA 52 wk/ })
    .first()
  await expect(row).toContainText(day)
  await expect(row).toContainText('150%')
  await row.click()
  const detail = panel(page, new RegExp(`^Detail · CMR BTA 52 wk of ${day}$`))
  await expect(detail).toContainText(/Bidders\s*9 SVTs/)
  await expect(detail).toContainText(/Security\s*BTA CMR 52 wk/)
  await expect(detail.getByRole('img', { name: /marginal rate of 5\.48%/ })).toBeVisible()
})
