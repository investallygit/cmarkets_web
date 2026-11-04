import { expect, test, type Page } from '@playwright/test'

// The Journalist and CEO account types of step 12 (ROADMAP.md): "Read" in the permission matrix
// of spec section 12 views the analysis without saving anything.

const panel = (page: Page, title: string | RegExp) =>
  page.locator('section', { has: page.getByRole('heading', { name: title }) })

/** The prototype's account switch reloads the app: wait for the new account's badge. */
async function switchAccount(page: Page, account: string, badge: RegExp) {
  await page.goto('/mkt')
  await page.getByRole('button', { name: /analyst/i }).click()
  await page.getByRole('menuitem', { name: account, exact: true }).click()
  await expect(page.getByRole('button', { name: badge })).toBeVisible()
}

test('a Journalist reads the analysis without portfolios, saved screens, drawings or exports', async ({
  page,
}) => {
  await switchAccount(page, 'Journalist', /journalist/i)
  const menu = page.getByRole('navigation', { name: 'Main menu' })
  await expect(menu).toContainText('PUB')
  await expect(menu).not.toContainText('PORT')

  await page.goto('/eqs')
  const results = panel(page, /^Results/)
  await expect(results.getByRole('heading')).toHaveText(/7 of 7 securities/i)
  const criteria = panel(page, 'Criteria')
  await expect(criteria.getByRole('button', { name: 'Run' })).toBeVisible()
  await expect(criteria.getByRole('button', { name: 'Save', exact: true })).toHaveCount(0)
  await expect(criteria).not.toContainText('Saved screens')
  await expect(results.getByRole('button', { name: 'XLSX' })).toHaveCount(0)

  await page.goto('/securities/SEMC/gp')
  const chart = panel(page, 'Price chart')
  await expect(chart.getByRole('button', { name: 'Compare' })).toBeVisible()
  await expect(chart.getByRole('button', { name: 'Trend line' })).toHaveCount(0)
})

test('a CEO exports, and has no portfolio of their own to create', async ({ page }) => {
  await switchAccount(page, 'CEO', /ceo/i)
  await page.goto('/eqs')
  await expect(panel(page, /^Results/).getByRole('button', { name: 'XLSX' })).toBeVisible()

  await page.goto('/port')
  await expect(page.getByText(/No portfolio to read yet/)).toBeVisible()
  await expect(page.getByRole('button', { name: 'New portfolio…' })).toHaveCount(0)
})
