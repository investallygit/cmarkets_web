import { expect, test, type Page } from '@playwright/test'

// What the keyboard alone reaches (WCAG 2.1.1, 2.1.2), the panels moved without dragging
// (WCAG 2.5.7) and the title of each page (WCAG 2.4.2).

const panel = (page: Page, title: string | RegExp) =>
  page.locator('section', { has: page.getByRole('heading', { name: title }) })

test('Tab leaves the command bar, which completes only a word under way', async ({ page }) => {
  await page.goto('/mkt')
  const bar = page.getByRole('combobox', { name: 'Command bar' })
  await bar.focus()
  await page.keyboard.type('SEM')
  await expect(page.getByRole('option', { name: /^SEMC/ })).toBeVisible()
  await page.keyboard.press('Tab')
  await expect(bar).toHaveValue('SEMC ')
  await expect(bar).toBeFocused()
  // Nothing under way: Tab moves on, as from any field.
  await page.keyboard.press('Tab')
  await expect(bar).not.toBeFocused()
  await bar.focus()
  await page.keyboard.press('Shift+Tab')
  await expect(bar).not.toBeFocused()
})

test("the user's menu and a row's menu open and work from the keyboard", async ({ page }) => {
  await page.goto('/mkt')
  const watchlist = panel(page, /^Watchlist/)
  await expect(watchlist.getByRole('row', { name: /SAFACAM/ })).toBeVisible()
  await watchlist.locator('[tabindex="0"]').first().focus()
  await page.keyboard.press('ArrowDown')
  await page.keyboard.press('ArrowDown')
  await expect(watchlist.getByRole('status')).toHaveText(/^SAFACAM, /)
  await page.keyboard.press('Shift+F10')
  await expect(page.getByRole('menuitem').first()).toBeFocused()
  await page.keyboard.press('Escape')
  await expect(page.getByRole('menu')).toHaveCount(0)

  await page.getByRole('button', { name: /K\. Analyst/i }).focus()
  await page.keyboard.press('Enter')
  await expect(page.getByRole('menuitem', { name: 'Settings' })).toBeFocused()
  await page.keyboard.press('End')
  await expect(page.getByRole('menuitem', { name: 'Log out' })).toBeFocused()
  await page.keyboard.press('Enter')
  await expect(page).toHaveURL(/\/login/)
})

test('a panel moves and sizes from its menu, and the default layout comes back', async ({
  page,
}) => {
  await page.goto('/mkt')
  const rates = panel(page, 'Rates and FX')
  const chart = panel(page, 'BVMAC Equities').first()
  const before = { rates: (await rates.boundingBox())?.y, chart: (await chart.boundingBox())?.y }
  expect(before.rates).toBeGreaterThan(before.chart ?? 0)

  await rates.getByRole('button', { name: 'FX: move or resize the panel' }).click()
  await page.getByRole('menuitem', { name: 'Move up' }).click()
  // It takes the chart's place, and keeps it on the next visit.
  await expect.poll(async () => (await rates.boundingBox())?.y).toBeLessThan(before.chart! + 1)
  await page.reload()
  await expect.poll(async () => (await rates.boundingBox())?.y).toBeLessThan(before.chart! + 1)

  await rates.getByRole('button', { name: 'FX: move or resize the panel' }).click()
  await page.getByRole('menuitem', { name: 'Default layout of the screen' }).click()
  await expect.poll(async () => (await rates.boundingBox())?.y).toBe(before.rates)
})

test('each page names itself in the title of the tab', async ({ page }) => {
  await page.goto('/mkt')
  await expect(page).toHaveTitle('Market dashboard · CMarket')
  await page.goto('/securities/SEMC/des')
  await expect(page).toHaveTitle(
    'Société des Eaux Minérales du Cameroun — Security profile · CMarket',
  )
  await page.goto('/no-such-screen')
  await expect(page).toHaveTitle('Screen not found · CMarket')
})

test.describe('without the service worker of the prototype', () => {
  test.use({ serviceWorkers: 'block' })

  test('the page says why the prototype cannot start', async ({ page }) => {
    await page.goto('/')
    await expect(page.getByText(/^The prototype could not start/)).toBeVisible()
    await expect(page.getByRole('button', { name: 'Retry' })).toBeVisible()
  })
})
