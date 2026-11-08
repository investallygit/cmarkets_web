import { expect, type Page } from '@playwright/test'
import { ON_API } from './demoIds.js'

/**
 * The demo Analyst's session, saved by auth.setup.ts for the other tests: one per back end, the
 * mock's and CMarket.Api's (npm run e2e:api), whose cookies share the host.
 */
export const ANALYST_SESSION =
  process.env.E2E_BACKEND === 'api' ? 'e2e/.auth/analyst-api.json' : 'e2e/.auth/analyst.json'

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

/**
 * Before a flow that logs out: on CMarket.Api the stored session is one the other flows share,
 * which a logout ends on the server, so the flow logs in for a session of its own. The mock keeps
 * each flow's session apart already.
 */
export async function ownSession(page: Page, email: string) {
  if (!ON_API) return
  await page.context().clearCookies()
  await page.goto('/login')
  await logIn(page, email)
}

/**
 * Before a flow that arranges a screen: on CMarket.Api the user's layout outlives the flow, so it
 * goes back to the screen's default (a layout without panels), as each flow starts on the mock.
 */
export async function defaultLayout(page: Page, screen: string) {
  if (!ON_API) return
  const refresh = await page.request.post('/api/v1/auth/refresh')
  const { accessToken } = (await refresh.json()) as { accessToken: string }
  const saved = await page.request.put(`/api/v1/me/layouts/${screen}`, {
    headers: { Authorization: `Bearer ${accessToken}` },
    data: { items: [] },
  })
  expect(saved.ok()).toBe(true)
}
