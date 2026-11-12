import { expect, test, type Locator, type Page } from '@playwright/test'
import { demoId } from './demoIds.js'
import { ownSession } from './session.js'

// What the keyboard alone reaches (WCAG 2.1.1, 2.1.2), the panels moved without dragging
// (WCAG 2.5.7) and the title of each page (WCAG 2.4.2).

const panel = (page: Page, title: string | RegExp) =>
  page.locator('section', { has: page.getByRole('heading', { name: title }) })

test('Tab leaves the command bar, which completes only a word under way', async ({ page }) => {
  await page.goto('/mkt')
  const bar = page.getByRole('combobox', { name: 'Command bar' })
  await bar.focus()
  await page.keyboard.type('SEM')
  await expect(page.getByRole('option', { name: /^SEMC/ })).toBeVisible()
  await page.keyboard.press('Tab')
  await expect(bar).toHaveValue('SEMC ')
  await expect(bar).toBeFocused()
  // Nothing under way: Tab moves on, as from any field.
  await page.keyboard.press('Tab')
  await expect(bar).not.toBeFocused()
  await bar.focus()
  await page.keyboard.press('Shift+Tab')
  await expect(bar).not.toBeFocused()
})

test("the user's menu and a row's menu open and work from the keyboard", async ({ page }) => {
  await ownSession(page, 'k.atangana@analyst.example')
  await page.goto('/mkt')
  const watchlist = panel(page, /^Watchlist/)
  await expect(watchlist.getByRole('row', { name: /SAFACAM/ })).toBeVisible()
  await watchlist.locator('[tabindex="0"]').first().focus()
  await page.keyboard.press('ArrowDown')
  await page.keyboard.press('ArrowDown')
  await expect(watchlist.getByRole('status')).toHaveText(/^SAFACAM, /)
  await page.keyboard.press('Shift+F10')
  await expect(page.getByRole('menuitem').first()).toBeFocused()
  await page.keyboard.press('Escape')
  await expect(page.getByRole('menu')).toHaveCount(0)

  await page.getByRole('button', { name: /K\. Analyst/i }).focus()
  await page.keyboard.press('Enter')
  await expect(page.getByRole('menuitem', { name: 'My professional profile' })).toBeFocused()
  await page.keyboard.press('ArrowDown')
  await expect(page.getByRole('menuitem', { name: 'Settings' })).toBeFocused()
  await page.keyboard.press('End')
  await expect(page.getByRole('menuitem', { name: 'Log out' })).toBeFocused()
  await page.keyboard.press('Enter')
  await expect(page).toHaveURL(/\/login/)
})

test('a panel moves and sizes from its menu, and the default layout comes back', async ({
  page,
}) => {
  await page.goto('/mkt')
  const rates = panel(page, 'Rates and FX')
  const chart = panel(page, 'BVMAC Equities').first()
  const before = { rates: (await rates.boundingBox())?.y, chart: (await chart.boundingBox())?.y }
  expect(before.rates).toBeGreaterThan(before.chart ?? 0)

  await rates.getByRole('button', { name: 'FX: layout menu' }).click()
  await page.getByRole('menuitem', { name: 'Move up' }).click()
  // It takes the chart's place, and keeps it on the next visit.
  await expect.poll(async () => (await rates.boundingBox())?.y).toBeLessThan(before.chart! + 1)
  await page.reload()
  await expect.poll(async () => (await rates.boundingBox())?.y).toBeLessThan(before.chart! + 1)

  await rates.getByRole('button', { name: 'FX: layout menu' }).click()
  await page.getByRole('menuitem', { name: 'Default layout of the screen' }).click()
  await expect.poll(async () => (await rates.boundingBox())?.y).toBe(before.rates)
})

test('each page names itself in the title of the tab', async ({ page }) => {
  await page.goto('/mkt')
  await expect(page).toHaveTitle('Market dashboard · CMarket')
  await page.goto('/securities/SEMC/des')
  await expect(page).toHaveTitle(
    'Société des Eaux Minérales du Cameroun — Security profile · CMarket',
  )
  await page.goto('/net')
  await expect(page).toHaveTitle('Professional directory · CMarket')
  await page.goto('/msg')
  await expect(page).toHaveTitle('Messaging · CMarket')
  await page.goto('/net/me')
  await expect(page).toHaveTitle('My professional profile · CMarket')
  await page.goto('/p/m-ndong')
  await expect(page).toHaveTitle('M. Ndong · CMarket')
  await page.goto('/no-such-screen')
  await expect(page).toHaveTitle('Screen not found · CMarket')
})

/** Tab until the control has the focus: the keyboard reaches it in fewer than `limit` steps. */
async function tabTo(page: Page, control: Locator, limit = 80) {
  for (let step = 0; step < limit; step += 1) {
    if (await control.evaluate((element) => element === document.activeElement)) return
    await page.keyboard.press('Tab')
  }
  await expect(control).toBeFocused()
}

test('NET and MSG from the keyboard: a profile found, a message sent, a dialog closed', async ({
  page,
}) => {
  await page.goto('/mkt')
  await expect(page.getByRole('heading', { name: 'Indices' })).toBeVisible()
  await page.keyboard.press('Control+K')
  await page.keyboard.type('NET')
  await page.keyboard.press('Enter')
  await expect(page).toHaveURL(/\/net$/)

  await tabTo(page, page.getByRole('searchbox', { name: 'Name, organisation, specialty' }))
  await page.keyboard.type('fotso')
  await expect(panel(page, 'Professionals: 1 result')).toBeVisible()
  await tabTo(page, page.getByRole('button', { name: 'View profile: L. Fotso' }))
  await page.keyboard.press('Enter')
  await expect(page).toHaveURL(new RegExp(`profile=${demoId('user-fotso')}`))
  await tabTo(page, panel(page, 'Profile').getByRole('button', { name: 'Send a message' }))
  await page.keyboard.press('Enter')
  await expect(page).toHaveURL(new RegExp(`/msg\\?to=${demoId('user-fotso')}$`))

  const composer = page.getByRole('textbox', { name: 'Message' })
  await tabTo(page, composer)
  await page.keyboard.type('Hello, a question on the BVMAC agribusiness stocks.')
  await page.keyboard.press('Shift+Enter')
  await page.keyboard.type('Do you cover SAFACAM too?')
  await page.keyboard.press('Enter')
  await expect(page).toHaveURL(/\/msg\?c=/)
  const thread = panel(page, /^L\. Fotso · Analyst/)
  await expect(thread.getByRole('listitem').last()).toContainText(
    'Hello, a question on the BVMAC agribusiness stocks.\nDo you cover SAFACAM too?',
  )

  // A dialog keeps the focus while open and gives it back on Escape.
  const report = page.getByRole('button', { name: 'Report conversation' })
  await tabTo(page, report)
  await page.keyboard.press('Enter')
  const dialog = page.getByRole('dialog', { name: 'Report a conversation' })
  await expect(dialog.getByLabel('Reason')).toBeFocused()
  await page.keyboard.press('Escape')
  await expect(dialog).toHaveCount(0)
  await expect(report).toBeFocused()
})

test('BS, BP and ETFS from the keyboard: a bond picked with the arrows and priced, an ETF opened', async ({
  page,
}) => {
  await page.goto('/mkt')
  await expect(page.getByRole('heading', { name: 'Indices' })).toBeVisible()
  await page.keyboard.press('Control+K')
  await page.keyboard.type('BS')
  await page.keyboard.press('Enter')
  await expect(page).toHaveURL(/\/bs$/)
  await expect(page).toHaveTitle('Bond screener · CMarket')

  // The arrows move the selection, and the bond's four blocks follow it.
  // BS's own flows may have added a bond: the list's count is theirs to check.
  const list = panel(page, /^Results/)
  await expect(list.getByRole('heading')).toHaveText(/Results: \d+ bonds/i)
  await tabTo(page, list.locator('[tabindex="0"]').first())
  const selected = list.locator('tr[aria-current="true"]')
  for (let step = 0; step < 6; step += 1) {
    if ((await selected.allTextContents()).join().includes('GAB 6.50% 28')) break
    await page.keyboard.press('ArrowDown')
  }
  await expect(list.getByRole('status')).toHaveText(/^GAB 6\.50% 28, /)
  const open = panel(page, /^GAB 6\.50% 28 ·/).getByRole('link', { name: 'Open in BP' })
  await tabTo(page, open)
  await page.keyboard.press('Enter')
  await expect(page).toHaveURL(/\/bp\/GAB-6\.50-2028$/)
  await expect(page).toHaveTitle('Gabonese Republic 6.50% 2028 — Bond pricing · CMarket')

  // Another yield, typed: the figures wait for Calculate, pressed with Enter.
  const form = panel(page, 'Inputs')
  await tabTo(page, form.getByRole('textbox', { name: 'Target yield to maturity (YTM)' }))
  await page.keyboard.press('ControlOrMeta+A')
  await page.keyboard.type('7')
  await expect(form.getByText('The inputs changed: calculate to update the results.')).toBeVisible()
  await tabTo(page, form.getByRole('button', { name: 'Calculate' }))
  await page.keyboard.press('Enter')
  await expect(form.getByText(/The inputs changed/)).toBeHidden()

  // ETFS: Enter opens the ETF reached, as a double click does.
  await page.keyboard.press('Control+K')
  await page.keyboard.type('ETFS')
  await page.keyboard.press('Enter')
  await expect(page).toHaveURL(/\/etfs$/)
  await expect(page).toHaveTitle('ETF screener · CMarket')
  const etfs = panel(page, /^Results/)
  await expect(etfs.getByRole('heading')).toHaveText(/Results: \d+ ETFs?$/i)
  await tabTo(page, etfs.locator('[tabindex="0"]').first())
  await page.keyboard.press('ArrowDown')
  await expect(etfs.getByRole('status')).not.toBeEmpty()
  const reached = (await etfs.locator('tr[aria-current="true"]').innerText()).split(/\s/)[0]
  await page.keyboard.press('Enter')
  await expect(page).toHaveURL(new RegExp(`/securities/${reached}\\.[A-Z]+/des$`))
  await expect(page).toHaveTitle(/ — ETF profile · CMarket$/)
})
