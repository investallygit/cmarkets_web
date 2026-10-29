import { expect, test } from '@playwright/test'

test('the market dashboard loads its panels and real-time data', async ({ page }) => {
  await page.goto('/')
  await expect(page).toHaveURL(/\/mkt$/)
  for (const title of ['Indices', 'Top movers', 'Rates and FX', 'News', 'Session summary']) {
    await expect(page.getByRole('heading', { name: title })).toBeVisible()
  }
  await expect(page.getByText('Real-time connected')).toBeVisible()
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

test('the back-office menu replaces the client menu for a Data admin', async ({ page }) => {
  await page.goto('/mkt')
  await page.getByRole('button', { name: /analyst/i }).click()
  await page.getByRole('menuitem', { name: 'Data admin' }).click()
  await expect(page).toHaveURL(/\/imp$/)
  await expect(page.getByText('Back-office', { exact: true })).toBeVisible()
  await expect(page.getByRole('link', { name: /IMP/ })).toBeVisible()
  await expect(page.getByRole('link', { name: /MKT/ })).toHaveCount(0)
})
