import { expect, test, type Page } from '@playwright/test'

// CMDTY, the commodities (screen 21), ROADMAP step 41: the list by category beside Brent's profile
// (its header, history, statistics, description, data and CEMAC links), another commodity on a
// click, CMP from the command bar; CORR names and links a commodity. The demo's series of the
// mockup stand in for EODHD's.

const panel = (page: Page, title: string | RegExp) =>
  page.locator('section', { has: page.getByRole('heading', { name: title, exact: true }) })

/** The prototype's account switch reloads the app: wait for the new account's badge. */
async function switchAccount(page: Page, from: RegExp, account: string, badge: RegExp) {
  const topBar = page.getByRole('banner')
  await topBar.getByRole('button', { name: from }).click()
  await page.getByRole('menuitemradio', { name: account, exact: true }).click()
  await expect(topBar.getByRole('button', { name: badge })).toBeVisible()
}

test('CMDTY opens Brent’s profile beside the list, as the mockup, and another commodity on a click', async ({
  page,
}) => {
  await page.goto('/mkt')
  const menu = page.getByRole('navigation', { name: 'Main menu' })
  await menu.getByRole('link', { name: /^CMDTY/ }).click()
  await expect(page).toHaveURL(/\/securities\/BRENT\/des$/)
  await expect(menu.locator('a.border-accent-amber')).toHaveText([/^CMDTY/])

  const list = page.getByRole('navigation', { name: 'Commodities by category' })
  await expect(panel(page, 'Commodities')).toContainText('28 series')
  await expect(list.getByRole('heading', { name: 'Energy' })).toBeVisible()
  await expect(list.getByRole('heading', { name: 'CEMAC complement (file)' })).toBeVisible()
  const brentRow = list.getByRole('link', { name: /^Brent/ })
  await expect(brentRow).toHaveAttribute('aria-current', 'page')
  await expect(brentRow).toContainText('81.40')
  await expect(brentRow).toContainText('+0.90%')

  const header = page.getByRole('region', { name: 'BRENT' })
  await expect(header.getByRole('heading', { name: 'BRENT' })).toBeVisible()
  await expect(header).toContainText('Brent crude oil (Europe)')
  await expect(header).toContainText('Energy · USD per barrel · Daily (weekly publication)')
  await expect(header).toContainText('81.40')

  const statistics = panel(page, 'Statistics')
  await expect(statistics).toContainText('Last value')
  await expect(statistics).toContainText('1Y correlation with WTI')
  await expect(statistics).toContainText('Data published in weekly batches')
  await expect(panel(page, 'Description')).toContainText(
    'Brent is the benchmark crude oil produced in the North Sea.',
  )
  await expect(panel(page, 'Data')).toContainText('DCOILBRENTEU (FRED)')
  const links = panel(page, 'CEMAC links')
  await expect(links.getByRole('link', { name: 'Gabon' })).toBeVisible()
  await expect(links.getByRole('link', { name: 'SIAT' })).toBeVisible()
  await expect(links).toContainText('Brent crude above $90')
  const history = panel(page, 'History')
  await expect(history.getByRole('tab', { name: /Daily/ })).toHaveAttribute('aria-selected', 'true')

  // Cocoa, of the Data admin's file: one interval, its source the file's.
  await list.getByRole('link', { name: /^Cocoa/ }).click()
  await expect(page).toHaveURL(/\/securities\/COCOA\/des$/)
  await expect(page.getByRole('region', { name: 'COCOA' })).toContainText('Cocoa')
  await expect(panel(page, 'Data')).toContainText('ICCO')
  await expect(panel(page, 'History').getByRole('tab', { name: /Weekly/ })).toBeDisabled()
  // Correlated with the global index, named.
  await expect(panel(page, 'Statistics')).toContainText('1Y correlation with Global index')
  // A country opens its ECO.
  await panel(page, 'CEMAC links').getByRole('link', { name: 'Cameroon' }).click()
  await expect(page).toHaveURL(/\/eco\?country=CMR$/)
})

test('another commodity opens beside the list, which stays where it was scrolled', async ({
  page,
}) => {
  // Too low for the whole list.
  await page.setViewportSize({ width: 1600, height: 600 })
  await page.goto('/securities/BRENT/des')
  const list = page.getByRole('navigation', { name: 'Commodities by category' })
  const cocoa = list.getByRole('link', { name: /^Cocoa/ })
  await expect(panel(page, 'Statistics')).toContainText('Last value')
  await cocoa.scrollIntoViewIfNeeded()
  const before = await list.evaluate((element) => {
    element.setAttribute('data-kept', 'yes')
    return element.scrollTop
  })
  expect(before).toBeGreaterThan(0)

  // Cocoa's answers wait: the list, the header and the panels stay meanwhile.
  let release = () => {}
  const released = new Promise<void>((resolve) => (release = resolve))
  await page.route(/\/api\/v1\/(securities|commodities)\/COCOA/, async (route) => {
    await released
    await route.continue()
  })
  await cocoa.click()
  await expect(page).toHaveURL(/\/securities\/COCOA\/des$/)
  await expect(cocoa).toHaveAttribute('aria-current', 'page')
  const header = page.getByRole('region', { name: 'COCOA' })
  await expect(header).toContainText('USD per metric ton · Daily')
  await expect(panel(page, 'Statistics')).toContainText('Loading')
  await expect(panel(page, 'History')).toContainText('Loading')
  await expect(page.getByRole('link', { name: /^CMP/ })).toBeVisible()
  release()
  await expect(panel(page, 'Data')).toContainText('ICCO')
  await expect(panel(page, 'History').locator('canvas').first()).toBeVisible()
  await expect(list).toHaveAttribute('data-kept', 'yes')
  expect(await list.evaluate((element) => element.scrollTop)).toBe(before)

  // An interval Brent offers and cocoa does not is not asked of cocoa's history.
  await list.getByRole('link', { name: /^Brent/ }).click()
  await panel(page, 'History')
    .getByRole('tab', { name: /Weekly/ })
    .click()
  await expect(panel(page, 'History').getByRole('tab', { name: /Weekly/ })).toHaveAttribute(
    'aria-selected',
    'true',
  )
  await cocoa.click()
  await expect(panel(page, 'History').getByRole('tab', { name: /Daily/ })).toHaveAttribute(
    'aria-selected',
    'true',
  )
  await expect(panel(page, 'History').locator('canvas').first()).toBeVisible()
})

test('`BRENT CMP` compares Brent with WTI rebased to 100 and gives their correlations', async ({
  page,
}) => {
  await page.goto('/mkt')
  await page.getByRole('combobox', { name: 'Command bar' }).fill('BRENT CMP')
  await page.keyboard.press('Enter')
  await expect(page).toHaveURL(/\/securities\/BRENT\/cmp$/)

  const compare = panel(page, 'Compare')
  const picker = compare.getByRole('group', { name: /Series compared/ })
  await expect(picker.getByRole('button', { name: 'Brent' })).toHaveAttribute(
    'aria-pressed',
    'true',
  )
  await expect(picker.getByRole('button', { name: 'WTI' })).toHaveAttribute('aria-pressed', 'true')
  const matrix = panel(page, 'Correlations').getByRole('table')
  await expect(matrix.getByRole('columnheader', { name: 'WTI' })).toBeVisible()
  await expect(matrix.getByRole('row', { name: /^Brent/ })).toContainText('1.00')

  // A third series, cocoa.
  await picker.getByRole('button', { name: 'Cocoa' }).click()
  await expect(picker.getByRole('button', { name: 'Cocoa' })).toHaveAttribute(
    'aria-pressed',
    'true',
  )
  await expect(matrix.getByRole('columnheader', { name: 'Cocoa' })).toBeVisible()
})

test('CORR names a commodity and links it to a country, and CMDTY shows them', async ({ page }) => {
  await page.goto('/mkt')
  await switchAccount(page, /analyst/i, 'Data admin', /data admin/i)
  await page.goto('/data/corrections?security=OKOUME')
  const editor = panel(page, /OKOUME/)
  await editor.getByLabel('List name (English)').fill('Okoumé')
  // Chad, which the demo does not link okoumé to (Gabon, Congo, Eq. Guinea and Cameroon).
  await editor.getByRole('checkbox', { name: 'Chad' }).check({ force: true })
  await editor.getByRole('button', { name: 'Save the commodity' }).click()
  await expect(page.getByText('OKOUME saved.')).toBeVisible()

  await switchAccount(page, /data admin/i, 'Analyst', /analyst/i)
  await page.goto('/securities/OKOUME/des')
  const list = page.getByRole('navigation', { name: 'Commodities by category' })
  await expect(list.getByRole('link', { name: /^Okoumé/ })).toHaveAttribute('aria-current', 'page')
  const links = panel(page, 'CEMAC links')
  await expect(links.getByRole('link', { name: 'Gabon' })).toBeVisible()
  await expect(links.getByRole('link', { name: 'Chad' })).toBeVisible()

  // The demo's name and countries back.
  await switchAccount(page, /analyst/i, 'Data admin', /data admin/i)
  await page.goto('/data/corrections?security=OKOUME')
  await editor.getByLabel('List name (English)').fill('Timber (okoumé)')
  await editor.getByRole('checkbox', { name: 'Chad' }).uncheck({ force: true })
  await editor.getByRole('button', { name: 'Save the commodity' }).click()
  await expect(page.getByText('OKOUME saved.')).toBeVisible()
  await switchAccount(page, /data admin/i, 'Analyst', /analyst/i)
})
