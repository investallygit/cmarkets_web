import { expect, type Page } from '@playwright/test'

/** The demo Analyst's session, saved by auth.setup.ts for the other tests. */
export const ANALYST_SESSION = 'e2e/.auth/analyst-api.json'

/** No session at all: the tests of the login pages. */
export const NO_SESSION = { cookies: [], origins: [] }

export const DEMO_PASSWORD = 'cmarket2026'

/** The login page: e-mail and password, then the code the API's development tools show. */
export async function logIn(page: Page, email: string, password = DEMO_PASSWORD) {
  await page.getByLabel('E-mail address').fill(email)
  await page.getByLabel('Password', { exact: true }).fill(password)
  await page.getByRole('button', { name: 'Log in' }).click()
  await page.getByRole('button', { name: 'Fill in' }).click()
  await page.getByRole('button', { name: 'Verify' }).click()
  await expect(page).not.toHaveURL(/\/login/)
}

/**
 * Before a flow that logs out: the stored session is one the other flows share, which a logout
 * ends on the server, so the flow logs in for a session of its own.
 */
export async function ownSession(page: Page, email: string) {
  await page.context().clearCookies()
  await page.goto('/login')
  await logIn(page, email)
}

/**
 * Before a flow that arranges a screen: the user's layout outlives the flow, so it goes back to
 * the screen's default (a layout without panels).
 */
export async function defaultLayout(page: Page, screen: string) {
  const refresh = await page.request.post('/api/v1/auth/refresh')
  const { accessToken } = (await refresh.json()) as { accessToken: string }
  const saved = await page.request.put(`/api/v1/me/layouts/${screen}`, {
    headers: { Authorization: `Bearer ${accessToken}` },
    data: { items: [] },
  })
  expect(saved.ok()).toBe(true)
}
