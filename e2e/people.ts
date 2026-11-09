import { test as base, expect, type BrowserContext, type Page } from '@playwright/test'
import { logIn, NO_SESSION } from './session.js'

/**
 * The flows where someone else takes part, as the hub's other end: `person(email)` logs them in,
 * in a browser context of their own beside the test's page (the Analyst's session), closed after
 * the flow.
 */
export const test = base.extend<{ person: (email: string) => Promise<Page> }>({
  person: async ({ browser }, provide, testInfo) => {
    const { baseURL, viewport } = testInfo.project.use
    const contexts: BrowserContext[] = []
    await provide(async (email) => {
      // Without a session of its own, the context would take the project's, the Analyst's.
      const context = await browser.newContext({ baseURL, viewport, storageState: NO_SESSION })
      contexts.push(context)
      const page = await context.newPage()
      await page.goto('/login')
      await logIn(page, email)
      return page
    })
    await Promise.all(contexts.map((context) => context.close()))
  },
})

export { expect }

/**
 * CMarket.Api as the page's user, for what a flow sets up faster than through the screens: one
 * access token from the session's refresh cookie, then each call answers its JSON.
 */
export async function apiAs(page: Page) {
  const refresh = await page.request.post('/api/v1/auth/refresh')
  expect(refresh.ok()).toBe(true)
  const { accessToken } = (await refresh.json()) as { accessToken: string }
  return async <T>(method: 'GET' | 'POST' | 'DELETE', path: string, data?: unknown): Promise<T> => {
    const response = await page.request.fetch(`/api/v1${path}`, {
      method,
      headers: { Authorization: `Bearer ${accessToken}` },
      data,
    })
    expect(response.ok(), `${method} ${path}: ${response.status()}`).toBe(true)
    return (response.status() === 204 ? null : await response.json()) as T
  }
}
