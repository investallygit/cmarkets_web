import { expect, test, type Page } from '@playwright/test'
import { cemacPortfolioId } from './demoIds.js'

// The Journalist and CEO account types of step 12 (ROADMAP.md): "Read" in the permission matrix
// of spec section 12 views the analysis without saving anything. Step 13: a CEO reads the
// portfolios the managers share with the organisation.

const panel = (page: Page, title: string | RegExp) =>
  page.locator('section', { has: page.getByRole('heading', { name: title }) })

/**
 * The prototype's account switch, from the badge of the account logged in (the Analyst's at
 * first), reloads the app: wait for the new account's badge.
 */
/** The fund P. Owona, the Portfolio manager, shares with Asset manager A. */
const OWONA_FUND = cemacPortfolioId('user-manager')

async function switchAccount(page: Page, account: string, badge: RegExp, from = /analyst/i) {
  await page.goto('/mkt')
  await page.getByRole('button', { name: from }).click()
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

test('a CEO exports, and reads the fund P. Owona shares without changing it', async ({ page }) => {
  await switchAccount(page, 'CEO', /ceo/i)
  await page.goto('/eqs')
  await expect(panel(page, /^Results/).getByRole('button', { name: 'XLSX' })).toBeVisible()

  await page.goto('/port')
  await expect(page).toHaveURL(new RegExp(`/port/${OWONA_FUND}$`))
  const selector = page.getByRole('button', { name: /Shared by P\. Owona/i })
  await expect(selector).toContainText('CEMAC Equity Fund')
  await expect(selector).toContainText('Read only')
  const positions = panel(page, 'Valued positions')
  await expect(positions.getByRole('row', { name: /^REGIONALE/ })).toContainText('9,500')
  await expect(page.getByRole('button', { name: 'New transaction' })).toHaveCount(0)
  await expect(page.getByRole('button', { name: 'Import CSV' })).toHaveCount(0)
  await expect(page.getByRole('button', { name: 'Generate portfolio PDF report' })).toHaveCount(0)
  const tabs = page.getByRole('navigation', { name: 'Portfolio tabs' })
  await expect(tabs.getByRole('link', { name: 'Reports' })).toHaveCount(0)

  // The selector lists the fund, and nothing to create, set or delete.
  await selector.click()
  await expect(page.getByRole('menuitem', { name: 'CEMAC Equity Fund · P. Owona' })).toBeVisible()
  await expect(page.getByRole('menuitem', { name: /New portfolio|settings|Delete/ })).toHaveCount(0)
  await page.keyboard.press('Escape')

  // The history reads, without corrections.
  await tabs.getByRole('link', { name: 'Transactions' }).click()
  const history = panel(page, 'Transactions')
  await expect(history.getByRole('row', { name: /Fund launch/ })).toBeVisible()
  await history.getByRole('row', { name: /Fund launch/ }).click({ button: 'right' })
  await expect(page.getByRole('menuitem', { name: /Correct|Delete/ })).toHaveCount(0)
})

test('P. Owona stops sharing the fund, and the CEO has nothing left to read', async ({ page }) => {
  await switchAccount(page, 'Portfolio manager', /manager/i)
  await page.goto(`/port/${OWONA_FUND}`)
  const selector = page.getByRole('button', { name: /CEMAC Equity Fund/ })
  await expect(selector).toContainText('Shared')
  await selector.click()
  await page.getByRole('menuitem', { name: 'Portfolio settings…' }).click()
  const dialog = page.getByRole('dialog')
  const share = dialog.getByRole('checkbox', { name: 'Share with Asset manager A' })
  await expect(share).toBeChecked()
  await share.uncheck({ force: true })
  await dialog.getByRole('button', { name: 'Save' }).click()
  await expect(dialog).toBeHidden()
  await expect(selector).not.toContainText('Shared')

  await switchAccount(page, 'CEO', /ceo/i, /manager/i)
  await page.goto('/port')
  await expect(page.getByText(/No portfolio to read yet/)).toBeVisible()
  await expect(page.getByRole('button', { name: 'New portfolio…' })).toHaveCount(0)
})
