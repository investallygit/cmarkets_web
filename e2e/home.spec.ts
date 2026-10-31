import { expect, test } from '@playwright/test'
import { NO_SESSION } from './session.js'

// The home page, step 10 (ROADMAP.md): open without a session, it leads to the trial or the
// login; a user already logged in opens the terminal from it.

test.describe('a visitor', () => {
  test.use({ storageState: NO_SESSION })

  test('reads the plans by month and by year, then signs up as a student', async ({ page }) => {
    await page.goto('/')
    await expect(
      page.getByRole('heading', { level: 1, name: 'The financial terminal of the CEMAC markets' }),
    ).toBeVisible()
    await expect(page.getByRole('img', { name: /^The CMarket terminal/ })).toBeVisible()

    // The plans come from the server before login, per user and month, then per year.
    const plans = page.locator('#plans')
    const monitoring = plans.getByRole('article', { name: 'Monitoring' })
    await expect(monitoring).toContainText('XAF 25,000')
    await expect(monitoring).toContainText('per user per month, excl. VAT')
    await plans.getByRole('button', { name: 'Yearly −17%' }).click()
    await expect(monitoring).toContainText('XAF 250,000')
    await expect(monitoring).toContainText('That is XAF 20,833 a month')

    await plans
      .getByRole('article', { name: 'Student' })
      .getByRole('link', { name: 'Start the trial' })
      .click()
    await expect(page).toHaveURL(/\/signup\?type=student$/)
    await expect(page.getByRole('radio', { name: /^Student/ })).toBeChecked()
  })

  test('reads the page in French, then goes to the login', async ({ page }) => {
    await page.goto('/')
    await page.getByRole('button', { name: 'fr', exact: true }).click()
    await expect(
      page.getByRole('heading', {
        level: 1,
        name: 'Le terminal financier des marchés de la CEMAC',
      }),
    ).toBeVisible()
    await page.getByRole('banner').getByRole('link', { name: 'Se connecter' }).click()
    await expect(page).toHaveURL(/\/login$/)
    await expect(page.getByRole('heading', { name: 'Connexion à CMarket' })).toBeVisible()
  })
})

test('a user already logged in opens the terminal, whose logo leads to the home screen', async ({
  page,
}) => {
  await page.goto('/')
  const header = page.getByRole('banner')
  await expect(header.getByRole('link', { name: 'Open the terminal' })).toBeVisible()
  await expect(header.getByRole('link', { name: 'Log in' })).toHaveCount(0)
  await expect(
    page
      .locator('#plans')
      .getByRole('article', { name: 'Professional' })
      .getByRole('link', { name: 'See my plan' }),
  ).toHaveAttribute('href', '/cfg')

  await header.getByRole('link', { name: 'Open the terminal' }).click()
  await expect(page).toHaveURL(/\/mkt$/)
  await page.goto('/cfg')
  await page.getByRole('link', { name: 'CMarket', exact: true }).click()
  await expect(page).toHaveURL(/\/mkt$/)
})
