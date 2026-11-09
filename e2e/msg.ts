import { expect, type Page } from '@playwright/test'

// What the flows of MSG (screen 11) find on the screen, for messaging.spec.ts and
// messaging-realtime.spec.ts.

/** A panel of the workspace, by its title. */
export const panel = (page: Page, title: string | RegExp) =>
  page.locator('section', { has: page.getByRole('heading', { name: title, exact: true }) })

export const composer = (page: Page) => page.getByRole('textbox', { name: 'Message' })

/** MSG in the left menu, with the count of the unread messages and requests. */
export const msgLink = (page: Page) =>
  page.getByRole('navigation', { name: 'Main menu' }).getByRole('link', { name: /MSG/ })

/** The prototype's account switch, from the Analyst's badge, reloads the app. */
export async function switchAccount(page: Page, account: string, badge: RegExp) {
  await page.goto('/mkt')
  await page.getByRole('button', { name: /analyst/i }).click()
  await page.getByRole('menuitem', { name: account, exact: true }).click()
  await expect(page.getByRole('button', { name: badge })).toBeVisible()
}
