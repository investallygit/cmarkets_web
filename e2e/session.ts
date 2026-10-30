import { expect, type Page } from '@playwright/test'

/** The demo Analyst's session, saved by auth.setup.ts for the other tests. */
export const ANALYST_SESSION = 'e2e/.auth/analyst.json'

/** No session at all: the tests of the login pages. */
export const NO_SESSION = { cookies: [], origins: [] }

export const DEMO_PASSWORD = 'cmarket2026'

/** The login page: e-mail and password, then the code the prototype shows. */
export async function logIn(page: Page, email: string, password = DEMO_PASSWORD) {
  await page.getByLabel('E-mail address').fill(email)
  await page.getByLabel('Password', { exact: true }).fill(password)
  await page.getByRole('button', { name: 'Log in' }).click()
  await page.getByRole('button', { name: 'Fill in' }).click()
  await page.getByRole('button', { name: 'Verify' }).click()
  await expect(page).not.toHaveURL(/\/login/)
}
