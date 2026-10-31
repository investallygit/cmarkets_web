import { expect, test as setup } from '@playwright/test'
import { ANALYST_SESSION } from './session.js'

// The demo Analyst, K. Atangana, logs in with the password and the one-time code; the other tests
// start from this session (the refresh cookie the mock keeps).
setup('log in as the demo Analyst', async ({ page }) => {
  await page.goto('/app')
  await expect(page).toHaveURL(/\/login$/)
  await page.getByLabel('E-mail address').fill('k.atangana@analyst.example')
  await page.getByLabel('Password', { exact: true }).fill('cmarket2026')
  await page.getByRole('button', { name: 'Log in' }).click()
  await page.getByRole('button', { name: 'Fill in' }).click()
  await page.getByRole('button', { name: 'Verify' }).click()
  await expect(page).toHaveURL(/\/mkt$/)
  await expect(page.getByRole('heading', { name: 'Indices' })).toBeVisible()
  await page.context().storageState({ path: ANALYST_SESSION })
})
