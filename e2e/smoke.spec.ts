import { expect, test } from '@playwright/test'
import { demoId } from './demoIds.js'

test('the market dashboard loads its panels and real-time data', async ({ page }) => {
  // /app opens the home screen of the account type.
  await page.goto('/app')
  await expect(page).toHaveURL(/\/mkt$/)
  for (const title of ['Indices', 'Top movers', 'Rates and FX', 'News', 'Session summary']) {
    await expect(page.getByRole('heading', { name: title })).toBeVisible()
  }
  await expect(page.getByText('Real-time connected')).toBeVisible()
  // The hub sends IndexUpdated to the screens that follow the index: the panel follows its own.
  // Once the panels' first reads are over (the summary is read again every minute only), only
  // the hub moves the value.
  const indices = page.locator('section', {
    has: page.getByRole('heading', { name: 'Indices', exact: true }),
  })
  const first = indices.getByRole('row').nth(1)
  await page.waitForLoadState('networkidle')
  const before = (await first.textContent()) ?? ''
  await expect(first).not.toHaveText(before, { timeout: 15_000 })
})

test('the command bar opens a security profile', async ({ page }) => {
  await page.goto('/mkt')
  await expect(page.getByRole('heading', { name: 'Indices' })).toBeVisible()
  await page.keyboard.press('Control+K')
  await page.keyboard.type('SEMC DES')
  await page.keyboard.press('Enter')
  await expect(page).toHaveURL(/\/securities\/SEMC\/des$/)
  await expect(page.getByRole('heading', { name: 'Price chart' })).toBeVisible()
})

test('the security profile follows the mockup and opens a document', async ({ page }) => {
  await page.goto('/securities/SEMC/des')
  for (const title of [
    'Price chart',
    'Order book',
    'Latest trades',
    'Key data',
    'Dividends',
    'Documents and news',
  ]) {
    await expect(page.getByRole('heading', { name: title, exact: true })).toBeVisible()
  }
  await page.getByRole('link', { name: /2025 annual report/ }).click()
  await expect(page).toHaveURL(
    new RegExp(`/securities/SEMC/doc\\?doc=${demoId('doc-semc-annual-2025')}$`),
  )
  await expect(page.locator('iframe[title="2025 annual report"]')).toBeAttached()
})

test('a bond opens the bond profile, its characteristics and payments to come', async ({
  page,
}) => {
  await page.goto('/securities/ECMR-6.25-2029/des')
  await expect(page.getByRole('heading', { name: 'Characteristics' })).toBeVisible()
  await expect(page.getByRole('heading', { name: 'Upcoming cash flows' })).toBeVisible()
  const tabs = page.getByRole('navigation', { name: 'Security functions' })
  await expect(tabs.getByRole('link', { name: 'GP Price and yield' })).toBeVisible()
  await expect(tabs.getByRole('link', { name: 'FA Fundamentals' })).toHaveCount(0)
})

test('the back-office menu replaces the client menu for a Data admin', async ({ page }) => {
  await page.goto('/mkt')
  await page.getByRole('button', { name: /analyst/i }).click()
  await page.getByRole('menuitem', { name: 'Data admin' }).click()
  // IMP opens the upload waiting in its preview.
  await expect(page).toHaveURL(/\/imp(\?import=|$)/)
  await expect(page.getByText('Back-office', { exact: true })).toBeVisible()
  await expect(page.getByRole('link', { name: /IMP/ })).toBeVisible()
  await expect(page.getByRole('link', { name: /MKT/ })).toHaveCount(0)
})
